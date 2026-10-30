begin;

create temporary table requested_extractos_20261030 (
  name text primary key,
  gender public.product_gender not null,
  quantity integer not null check (quantity > 0),
  photo_url text,
  stock_before integer not null default 0
) on commit drop;

insert into requested_extractos_20261030 (name, gender, quantity, photo_url) values
  ('nueve pm Night out', 'Masculino', 30, null),
  ('Kamrha hawa', 'Unisex', 10, null),
  ('9 PM Rebel', 'Masculino', 15, null),
  ('Erba Pura', 'Unisex', 29, null),
  ('scandal femenino', 'Femenino', 3, null),
  ('Valentino Born in Roma Purple Melancholia', 'Femenino', 20, null),
  ('Valentino Donna', 'Femenino', 3, null),
  ('aqua di Gio femenino', 'Femenino', 4, null),
  ('CHER DIECIOCHO', 'Femenino', 6, null),
  ('Sí Giorgio Armani', 'Femenino', 3, null),
  ('La Vida Es Bella', 'Femenino', 5, null),
  ('cred aventus', 'Masculino', 5, null),
  ('Bad Boy', 'Masculino', 7, null),
  ('Eros Flame', 'Masculino', 6, null),
  ('le beau', 'Masculino', 12, null),
  ('le male paradisen garden', 'Masculino', 5, null),
  ('Invictus Victory Elixir', 'Masculino', 3, null),
  ('Eros Versace', 'Masculino', 5, null),
  ('scandal masculino', 'Masculino', 6, null),
  ('eclayre', 'Femenino', 7, null),
  ('the most wanted', 'Masculino', 9, null),
  ('eclayre pistachio', 'Femenino', 2, null),
  ('Hawas Rasasi', 'Masculino', 3, null),
  ('Good Girl Blush', 'Femenino', 2, null),
  ('DunesCape', 'Unisex', 1, null),
  ('club de nuit bling', 'Masculino', 7, null),
  ('Bharara King', 'Masculino', 7, null),
  ('Arabians Tonka', 'Unisex', 16, null),
  ('CK One', 'Unisex', 2, null),
  ('Good Girl Supreme', 'Femenino', 2, null),
  ('Good Girl', 'Femenino', 6, null),
  ('CLUB DE NUIT INTENSE', 'Masculino', 12, null),
  ('mandaryn ski elixir', 'Masculino', 6, null),
  ('Liquid Brun', 'Masculino', 4, null),
  ('Baccarat rouget', 'Unisex', 1, null),
  ('Amber Oud Private Edition', 'Unisex', 1, null),
  ('Le Male Elixir', 'Masculino', 18, null),
  ('mandaryn ski', 'Masculino', 10, null),
  ('Burberry Her', 'Femenino', 4, null),
  ('Yara', 'Femenino', 6, null),
  ('Invictus', 'Masculino', 3, null),
  ('ligth blue masculino', 'Masculino', 3, null),
  ('Valentino Born in Roma', 'Masculino', 4, null),
  ('Yara Elixir', 'Femenino', 5, null),
  ('Power of You', 'Femenino', 6, null),
  ('Amber Oud Gold', 'Unisex', 5, null),
  ('Yara Moi', 'Femenino', 30, '/product-images/Yara%20Moi%20-%20Lattafa.jpeg'),
  ('Amethyst', 'Unisex', 20, '/product-images/Amethyst%20-%20Lattafa.jpeg'),
  ('NAXOS XERJOFF', 'Unisex', 2, null),
  ('Moschino toy boy', 'Masculino', 2, null),
  ('valentino intens', 'Masculino', 7, null),
  ('212 vip rose', 'Femenino', 2, null),
  ('212 Sexy', 'Femenino', 2, null),
  ('1 Million', 'Masculino', 2, null),
  ('Stronger With You Intensely', 'Masculino', 2, null),
  ('My Way', 'Femenino', 1, null),
  ('212 VIP', 'Femenino', 1, null);

-- Crear únicamente los dos extractos realmente nuevos, inicialmente sin stock.
insert into public.products
  (name, source_name, gender, stock, min_stock, photo_url, catalog_section, is_active, data_status)
select
  requested.name,
  requested.name,
  requested.gender,
  0,
  3,
  requested.photo_url,
  'extractos',
  false,
  'foto_validada'
from requested_extractos_20261030 requested
where requested.photo_url is not null
  and not exists (
    select 1
    from public.products product
    where product.catalog_section = 'extractos'
      and lower(trim(product.name)) = lower(trim(requested.name))
      and coalesce(product.source_name, '') not like '__deleted_product__:%'
  );

update requested_extractos_20261030 requested
set stock_before = product.stock
from public.products product
where product.catalog_section = 'extractos'
  and lower(trim(product.name)) = lower(trim(requested.name))
  and coalesce(product.source_name, '') not like '__deleted_product__:%'
  and not exists (
    select 1
    from public.stock_movements movement
    where movement.product_id = product.id
      and movement.reason = 'Ingreso de Extractos 60 ML del 30/10/2026'
  );

update public.products product
set
  gender = requested.gender,
  stock = product.stock + requested.quantity,
  photo_url = coalesce(requested.photo_url, product.photo_url),
  is_active = true,
  data_status = case when requested.photo_url is not null then 'foto_validada' else product.data_status end,
  updated_at = now()
from requested_extractos_20261030 requested
where product.catalog_section = 'extractos'
  and lower(trim(product.name)) = lower(trim(requested.name))
  and coalesce(product.source_name, '') not like '__deleted_product__:%'
  and not exists (
    select 1
    from public.stock_movements movement
    where movement.product_id = product.id
      and movement.reason = 'Ingreso de Extractos 60 ML del 30/10/2026'
  );

insert into public.stock_movements
  (product_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
select
  product.id,
  'manual_add',
  requested.quantity,
  requested.stock_before,
  requested.stock_before + requested.quantity,
  'Ingreso de Extractos 60 ML del 30/10/2026',
  '0a41ee90-4f27-419c-9763-6f0bf1925ce9'::uuid
from requested_extractos_20261030 requested
join public.products product
  on product.catalog_section = 'extractos'
 and lower(trim(product.name)) = lower(trim(requested.name))
 and coalesce(product.source_name, '') not like '__deleted_product__:%'
where not exists (
  select 1
  from public.stock_movements movement
  where movement.product_id = product.id
    and movement.reason = 'Ingreso de Extractos 60 ML del 30/10/2026'
);

-- La lista consolidada contiene 57 fragancias y 400 unidades.
do $$
declare
  v_requested integer;
  v_applied integer;
begin
  select count(*) into v_requested from requested_extractos_20261030;
  select count(*) into v_applied
  from requested_extractos_20261030 requested
  join public.products product
    on product.catalog_section = 'extractos'
   and lower(trim(product.name)) = lower(trim(requested.name))
   and coalesce(product.source_name, '') not like '__deleted_product__:%';

  if v_requested <> 57 or v_applied <> v_requested then
    raise exception 'No se pudieron vincular todos los extractos: % de %', v_applied, v_requested;
  end if;
end;
$$;

commit;
