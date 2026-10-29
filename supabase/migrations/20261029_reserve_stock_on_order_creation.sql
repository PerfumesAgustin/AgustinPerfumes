begin;

alter table public.stock_movements
  drop constraint if exists stock_movements_movement_type_check;

alter table public.stock_movements
  add constraint stock_movements_movement_type_check
  check (movement_type in (
    'manual_add',
    'manual_remove',
    'set',
    'order_confirmed',
    'order_cancelled',
    'order_reserved',
    'order_released'
  ));

create or replace function public.create_order(
  p_reseller_name text,
  p_phone text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_order_sequence bigint;
  v_total integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_before integer;
begin
  if char_length(trim(coalesce(p_reseller_name, ''))) < 2 then raise exception 'Nombre inválido'; end if;
  if char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'Teléfono inválido'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'El pedido supera el máximo de productos'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    group by item->>'product_id'
    having count(*) > 1
  ) then
    raise exception 'Hay productos repetidos en el pedido';
  end if;

  -- Bloquea los productos en un orden estable para impedir que dos clientes
  -- reserven simultáneamente las mismas últimas unidades.
  for v_item in
    select value
    from jsonb_array_elements(p_items)
    order by (value->>'product_id')::bigint
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 then raise exception 'Cantidad inválida'; end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::bigint
      and is_active
    for update;

    if not found then raise exception 'Producto no disponible'; end if;
    if v_quantity > v_product.stock then
      raise exception 'Stock insuficiente para %', v_product.name;
    end if;
    v_total := v_total + v_quantity;
  end loop;

  v_order_sequence := nextval('public.order_number_seq');
  v_order_number := lpad(v_order_sequence::text, greatest(4, char_length(v_order_sequence::text)), '0');

  insert into public.orders (id, order_number, reseller_name, phone, notes, total_units, stock_applied)
  values (v_order_id, v_order_number, trim(p_reseller_name), trim(p_phone), nullif(trim(p_notes), ''), v_total, true);

  for v_item in
    select value
    from jsonb_array_elements(p_items)
    order by (value->>'product_id')::bigint
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::bigint;
    v_before := v_product.stock;

    update public.products
    set
      stock = stock - v_quantity,
      is_active = case when stock - v_quantity = 0 then false else is_active end
    where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, quantity)
    values (
      v_order_id,
      v_product.id,
      case
        when v_product.catalog_section = 'tubitos_arabes' then 'Tubito Árabe 35 ML · '
        else 'Extracto de 60 ML · '
      end || v_product.name,
      v_quantity
    );

    insert into public.stock_movements
      (product_id, order_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
    values
      (v_product.id, v_order_id, 'order_reserved', -v_quantity, v_before, v_before - v_quantity,
       'Reserva Pedido N°' || v_order_number, null);
  end loop;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total_units', v_total);
end;
$$;

create or replace function public.confirm_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_before integer;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status <> 'pending' then raise exception 'El pedido ya fue procesado'; end if;

  -- Compatibilidad con pedidos pendientes creados antes de esta actualización.
  if not v_order.stock_applied then
    for v_item in select * from public.order_items where order_id = p_order_id order by product_id
    loop
      select stock into v_before from public.products where id = v_item.product_id for update;
      if v_before < v_item.quantity then raise exception 'Stock insuficiente para %', v_item.product_name; end if;
      update public.products
      set stock = stock - v_item.quantity,
          is_active = case when stock - v_item.quantity = 0 then false else is_active end
      where id = v_item.product_id;
      insert into public.stock_movements
        (product_id, order_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
      values
        (v_item.product_id, p_order_id, 'order_reserved', -v_item.quantity, v_before, v_before - v_item.quantity,
         'Reserva al confirmar Pedido N°' || v_order.order_number, auth.uid());
    end loop;
  end if;

  update public.orders
  set status = 'confirmed', stock_applied = true, confirmed_at = now(), confirmed_by = auth.uid()
  where id = p_order_id;
end;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_before integer;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if p_status not in ('rejected', 'cancelled') then raise exception 'Estado no permitido'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status in ('rejected', 'cancelled') then raise exception 'El pedido ya fue procesado'; end if;
  if p_status = 'rejected' and v_order.status <> 'pending' then raise exception 'Solo se rechazan pedidos pendientes'; end if;

  if v_order.stock_applied then
    for v_item in select * from public.order_items where order_id = p_order_id order by product_id
    loop
      select stock into v_before from public.products where id = v_item.product_id for update;
      update public.products
      set
        stock = stock + v_item.quantity,
        is_active = case
          when stock = 0 and coalesce(source_name, '') not like '__deleted_product__:%' then true
          else is_active
        end
      where id = v_item.product_id;
      insert into public.stock_movements
        (product_id, order_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
      values
        (v_item.product_id, p_order_id, 'order_released', v_item.quantity, v_before, v_before + v_item.quantity,
         case when p_status = 'rejected' then 'Rechazo Pedido N°' else 'Cancelación Pedido N°' end || v_order.order_number,
         auth.uid());
    end loop;
  end if;

  update public.orders set status = p_status, stock_applied = false where id = p_order_id;
end;
$$;

create or replace function public.reopen_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_product public.products%rowtype;
  v_before integer;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status <> 'rejected' then raise exception 'Solo se pueden reabrir pedidos rechazados'; end if;

  for v_item in select * from public.order_items where order_id = p_order_id order by product_id
  loop
    select * into v_product from public.products where id = v_item.product_id for update;
    if coalesce(v_product.source_name, '') like '__deleted_product__:%' then
      raise exception 'El producto % fue eliminado', v_item.product_name;
    end if;
    if v_product.stock < v_item.quantity then
      raise exception 'Stock insuficiente para %', v_item.product_name;
    end if;
    v_before := v_product.stock;
    update public.products
    set
      stock = stock - v_item.quantity,
      is_active = case when stock - v_item.quantity = 0 then false else is_active end
    where id = v_item.product_id;
    insert into public.stock_movements
      (product_id, order_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
    values
      (v_item.product_id, p_order_id, 'order_reserved', -v_item.quantity, v_before, v_before - v_item.quantity,
       'Nueva reserva al reabrir Pedido N°' || v_order.order_number, auth.uid());
  end loop;

  update public.orders set status = 'pending', stock_applied = true where id = p_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, jsonb) to anon, authenticated;
revoke all on function public.confirm_order(uuid) from public;
grant execute on function public.confirm_order(uuid) to authenticated;
revoke all on function public.set_order_status(uuid, public.order_status) from public;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;
revoke all on function public.reopen_order(uuid) from public;
grant execute on function public.reopen_order(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end;
$$;

commit;
