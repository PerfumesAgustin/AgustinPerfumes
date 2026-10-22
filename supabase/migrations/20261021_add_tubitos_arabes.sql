begin;

alter table public.products
  add column if not exists catalog_section text not null default 'extractos';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_catalog_section_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_catalog_section_check
      check (catalog_section in ('extractos', 'tubitos_arabes'));
  end if;
end $$;

create index if not exists products_section_active_name_idx
  on public.products (catalog_section, is_active, name);

with requested(name, stock) as (
  values
    ('9 PM Elixir', 24),
    ('9 PM Rebel', 48),
    ('Aawa Musamam', 20),
    ('Amber Oud Gold Edition', 20),
    ('Amber Oud Ruby Edition', 20),
    ('Amber Oud Ultra Edition', 20),
    ('Ameerat Al Arab Imperium', 20),
    ('Ameerat Al Arab Privé Rose', 20),
    ('Asad', 40),
    ('Azzure Aoud', 24),
    ('Bade''e Al Oud Oud for Glory', 20),
    ('Club de Nuit Women', 64),
    ('Cocoa Morado', 24),
    ('Coro', 20),
    ('Crystal', 29),
    ('Eclaire Banoffi', 20),
    ('Eclaire Pistachio', 20),
    ('Erba Pura', 47),
    ('Goo Mango', 40),
    ('Hawas for Her', 24),
    ('Hawas Ice', 24),
    ('Haya', 20),
    ('Hayaati Black', 20),
    ('Hayaati Florence', 20),
    ('Hayaati Gold Elixir', 20),
    ('Island Breeze', 20),
    ('Kai Aly', 20),
    ('Khamrah Qahwa', 40),
    ('Liquid Brun', 24),
    ('Mario Bros', 13),
    ('Marshmallow Blush', 20),
    ('Odor Epic Verde', 13),
    ('Odyssey Aqua', 20),
    ('Odyssey Bahamas', 20),
    ('Odyssey Black Forest', 20),
    ('Odyssey Eau de Montagne', 20),
    ('Odyssey Homme', 20),
    ('Odyssey Limoni', 20),
    ('Odyssey Mandarin', 39),
    ('Odyssey Mega', 20),
    ('Odyssey Spectra', 20),
    ('Odyssey Tyrant', 20),
    ('Opera', 20),
    ('Sublime', 20),
    ('Super David Edition', 20),
    ('Super David In Heaven', 20),
    ('Super David Noir', 20),
    ('Super David Not Only Intense', 20),
    ('Victoria', 24),
    ('Yara Elixir', 51),
    ('Yum Yum', 16)
), inserted as (
  insert into public.products
    (name, gender, stock, min_stock, photo_url, catalog_section, is_active, data_status)
  select
    requested.name,
    'Sin clasificar'::public.product_gender,
    requested.stock,
    3,
    null,
    'tubitos_arabes',
    true,
    'revisar'
  from requested
  where not exists (
    select 1
    from public.products existing
    where existing.catalog_section = 'tubitos_arabes'
      and lower(trim(existing.name)) = lower(trim(requested.name))
  )
  returning id, stock
)
insert into public.stock_movements
  (product_id, movement_type, quantity, stock_before, stock_after, reason, created_by)
select
  id,
  'set',
  stock,
  0,
  stock,
  'Carga inicial de Tubitos Árabes 2026-10-21',
  '0a41ee90-4f27-419c-9763-6f0bf1925ce9'::uuid
from inserted;

commit;
