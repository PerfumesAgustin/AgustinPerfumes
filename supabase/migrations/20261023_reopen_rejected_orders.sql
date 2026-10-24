create or replace function public.reopen_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Pedido inexistente'; end if;
  if v_order.status <> 'rejected' then raise exception 'Solo se pueden reabrir pedidos rechazados'; end if;

  update public.orders
  set status = 'pending', stock_applied = false
  where id = p_order_id;
end;
$$;

revoke all on function public.reopen_order(uuid) from public;
grant execute on function public.reopen_order(uuid) to authenticated;
