begin;

-- Normaliza nombres que ya existían en el inventario sin alterar su stock.
update public.products
set name = case lower(trim(name))
  when 'montale' then 'Arabians Tonka'
  when 'marshmalow' then 'Marshmallow Blush'
  when 'bom bom' then 'Bonbon'
  when 'yara rosa' then 'Yara'
  else name
end
where catalog_section = 'extractos'
  and lower(trim(name)) in ('montale', 'marshmalow', 'bom bom', 'yara rosa');

-- Corrige clasificaciones según el catálogo Extrait de Parfum 60 ML.
update public.products
set gender = case lower(trim(name))
  when 'eternity' then 'Femenino'::public.product_gender
  when 'amber oud dubai night' then 'Masculino'::public.product_gender
  when 'lost cherry tom ford' then 'Femenino'::public.product_gender
  when 'tobacco vanille' then 'Masculino'::public.product_gender
  else gender
end
where catalog_section = 'extractos'
  and lower(trim(name)) in (
    'eternity',
    'amber oud dubai night',
    'lost cherry tom ford',
    'tobacco vanille'
  );

with requested(name, gender, photo_url) as (
  values
    ('212 New York Femenino', 'Femenino'::public.product_gender, '/product-images/212%20Femenino%20-%20Carolina%20Herrera.jpeg'),
    ('Goddess', 'Femenino'::public.product_gender, '/product-images/Goddess%20Burberry%20-%20Burberry.jpeg'),
    ('Scandal Le Parfum', 'Femenino'::public.product_gender, null),
    ('Shakira Rock', 'Femenino'::public.product_gender, '/product-images/Rock%20Shakira%20-%20Shakira.jpeg'),
    ('The Only One', 'Femenino'::public.product_gender, '/product-images/The%20Only%20One%20-%20Dolce%20%26%20Gabbana.jpeg'),
    ('Valentino Born in Roma Purple Melancholia', 'Femenino'::public.product_gender, '/product-images/Valentino%20Born%20in%20Roma%20Purple%20Melancholia%20-%20Valentino.jpeg'),
    ('Acqua di Gio Profumo', 'Masculino'::public.product_gender, '/product-images/Acqua%20di%20Gio%20Profumo%20-%20Armani.jpeg'),
    ('Bleu de Chanel', 'Masculino'::public.product_gender, '/product-images/Bleu%20de%20Chanel%20-%20Chanel.jpeg'),
    ('Blue Seduction', 'Masculino'::public.product_gender, null),
    ('Devotion Pour Homme', 'Masculino'::public.product_gender, '/product-images/Devotion%20Pour%20Homme%20-%20Dolce%20%26%20Gabbana.jpeg'),
    ('Invictus Elixir', 'Masculino'::public.product_gender, null),
    ('Phantom', 'Masculino'::public.product_gender, '/product-images/Phantom%20-%20Rabanne.jpeg'),
    ('Polo Blue', 'Masculino'::public.product_gender, '/product-images/Polo%20Blue%20-%20Ralph%20Lauren.jpeg'),
    ('Spice Bomb', 'Masculino'::public.product_gender, '/product-images/Spicebomb%20-%20Viktor%20%26%20Rolf.jpeg'),
    ('Wanted', 'Masculino'::public.product_gender, '/product-images/Wanted%20-%20Azzaro.jpeg'),
    ('Angel Share', 'Unisex'::public.product_gender, null),
    ('Costa Azzurra', 'Unisex'::public.product_gender, null),
    ('Noble Blush', 'Femenino'::public.product_gender, '/product-images/Noble%20Blush%20-%20Lattafa.jpeg'),
    ('Asad Elixir', 'Masculino'::public.product_gender, null),
    ('Pisa', 'Masculino'::public.product_gender, null),
    ('Amber Oud Aqua Dubai', 'Unisex'::public.product_gender, '/product-images/Amber%20Oud%20Aqua%20Dubai%20-%20Al%20Haramain.jpeg'),
    ('Amethyst', 'Unisex'::public.product_gender, null),
    ('Honor & Glory', 'Unisex'::public.product_gender, null),
    ('Nebras', 'Unisex'::public.product_gender, null),
    ('Oud Mood', 'Unisex'::public.product_gender, null),
    ('Sublime', 'Unisex'::public.product_gender, '/product-images/Sublime%20-%20Lattafa.jpeg'),
    ('Teriaq', 'Unisex'::public.product_gender, null),
    ('Torino 21', 'Unisex'::public.product_gender, '/product-images/Torino21%20-%20Xerjoff.jpeg')
), reactivated as (
  update public.products existing
  set
    gender = requested.gender,
    stock = 0,
    photo_url = coalesce(existing.photo_url, requested.photo_url),
    is_active = true,
    data_status = case
      when coalesce(existing.photo_url, requested.photo_url) is null then 'revisar'
      else 'foto_validada'
    end
  from requested
  where existing.catalog_section = 'extractos'
    and lower(trim(existing.name)) = lower(trim(requested.name))
    and not existing.is_active
  returning existing.id
)
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
  true,
  case when requested.photo_url is null then 'revisar' else 'foto_validada' end
from requested
where not exists (
  select 1
  from public.products existing
  where existing.catalog_section = 'extractos'
    and lower(trim(existing.name)) = lower(trim(requested.name))
);

commit;
