begin;

create temporary table requested_tubitos_20261028 (
  name text primary key,
  gender public.product_gender not null,
  stock integer not null,
  photo_url text not null,
  stock_before integer not null default 0
) on commit drop;

insert into requested_tubitos_20261028 (name, gender, stock, photo_url) values
  ('Yara Rosa', 'Femenino', 40, '/tubitos-arabes/yara-rosa.jpeg'),
  ('Yara Candy', 'Femenino', 40, '/tubitos-arabes/yara-candy.jpeg'),
  ('Asad Bourbon', 'Masculino', 40, '/tubitos-arabes/asad-bourbon.jpeg'),
  ('Khamrah Waha', 'Unisex', 40, '/tubitos-arabes/khamrah-waha.jpeg'),
  ('Crystal', 'Femenino', 24, '/tubitos-arabes/crystal.jpeg'),
  ('La Bomba', 'Femenino', 60, '/tubitos-arabes/la-bomba.jpeg'),
  ('Odyssey Mandarin', 'Masculino', 40, '/tubitos-arabes/odyssey-mandarin.jpeg'),
  ('Good Girl', 'Femenino', 24, 'https://ygcrffguuthkyhtajgom.supabase.co/storage/v1/object/public/perfume-images/65/a23f7f82-895f-4df7-bcc0-65df882135d0.jpg'),
  ('Hugo Boss', 'Masculino', 24, '/tubitos-arabes/hugo-boss.jpeg'),
  ('Invictus', 'Masculino', 24, '/tubitos-arabes/invictus.jpeg'),
  ('Prada Paradoxe', 'Femenino', 24, '/tubitos-arabes/prada-paradoxe.jpeg'),
  ('Olympea', 'Femenino', 24, '/tubitos-arabes/olympea.jpeg'),
  ('Libre', 'Femenino', 24, '/tubitos-arabes/libre.jpeg'),
  ('Black Opium', 'Femenino', 24, '/tubitos-arabes/black-opium.jpeg'),
  ('Bleu de Chanel', 'Masculino', 24, '/tubitos-arabes/bleu-de-chanel.jpeg'),
  ('Creed Aventus', 'Masculino', 24, '/tubitos-arabes/creed-aventus.jpeg'),
  ('La Vie Est Belle', 'Femenino', 24, '/tubitos-arabes/la-vie-est-belle.jpeg');

update requested_tubitos_20261028 requested
set stock_before = product.stock
from public.products product
where product.catalog_section = 'tubitos_arabes'
  and lower(trim(product.name)) = lower(trim(requested.name));

update public.products product
set
  gender = requested.gender,
  stock = requested.stock,
  photo_url = requested.photo_url,
  is_active = true,
  data_status = 'foto_validada',
  updated_at = now()
from requested_tubitos_20261028 requested
where product.catalog_section = 'tubitos_arabes'
  and lower(trim(product.name)) = lower(trim(requested.name));

insert into public.products
  (name, gender, stock, min_stock, photo_url, catalog_section, is_active, data_status)
select
  requested.name,
  requested.gender,
  requested.stock,
  3,
  requested.photo_url,
  'tubitos_arabes',
  true,
  'foto_validada'
from requested_tubitos_20261028 requested
where not exists (
  select 1
  from public.products product
  where product.catalog_section = 'tubitos_arabes'
    and lower(trim(product.name)) = lower(trim(requested.name))
);

insert into public.stock_movements
  (product_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
select
  product.id,
  'set',
  requested.stock - requested.stock_before,
  requested.stock_before,
  requested.stock,
  'Carga de Tubitos Árabes y fotos del 28/10/2026',
  '0a41ee90-4f27-419c-9763-6f0bf1925ce9'::uuid
from requested_tubitos_20261028 requested
join public.products product
  on product.catalog_section = 'tubitos_arabes'
 and lower(trim(product.name)) = lower(trim(requested.name))
where requested.stock <> requested.stock_before;

commit;
