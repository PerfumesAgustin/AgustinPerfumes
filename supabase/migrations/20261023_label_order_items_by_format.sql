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
begin
  if char_length(trim(coalesce(p_reseller_name, ''))) < 2 then raise exception 'Nombre inválido'; end if;
  if char_length(trim(coalesce(p_phone, ''))) < 6 then raise exception 'Teléfono inválido'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'El pedido supera el máximo de productos'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity <= 0 then raise exception 'Cantidad inválida'; end if;
    select * into v_product from public.products
      where id = (v_item->>'product_id')::bigint and is_active;
    if not found then raise exception 'Producto no disponible'; end if;
    if v_quantity > v_product.stock then
      raise exception 'Stock insuficiente para %', v_product.name;
    end if;
    v_total := v_total + v_quantity;
  end loop;

  v_order_sequence := nextval('public.order_number_seq');
  v_order_number := lpad(v_order_sequence::text, greatest(4, char_length(v_order_sequence::text)), '0');
  insert into public.orders (id, order_number, reseller_name, phone, notes, total_units)
  values (v_order_id, v_order_number, trim(p_reseller_name), trim(p_phone), nullif(trim(p_notes), ''), v_total);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item->>'product_id')::bigint;
    insert into public.order_items (order_id, product_id, product_name, quantity)
    values (
      v_order_id,
      v_product.id,
      case
        when v_product.catalog_section = 'tubitos_arabes' then 'Tubito Árabe 35 ML · '
        else 'Extracto de 60 ML · '
      end || v_product.name,
      (v_item->>'quantity')::integer
    );
  end loop;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total_units', v_total);
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, jsonb) to anon, authenticated;
