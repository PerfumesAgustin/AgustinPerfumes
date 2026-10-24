begin;

with classifications(name, gender) as (
  values
    ('Odyssey Aqua', 'Masculino'::public.product_gender),
    ('Odyssey Tyrant', 'Masculino'::public.product_gender),
    ('Odyssey Mandarin', 'Masculino'::public.product_gender),
    ('Odyssey Homme', 'Masculino'::public.product_gender),
    ('Odyssey Mega', 'Masculino'::public.product_gender),
    ('Hayaati Black', 'Masculino'::public.product_gender),
    ('Asad', 'Masculino'::public.product_gender),
    ('Azzure Aoud', 'Masculino'::public.product_gender),
    ('Liquid Brun', 'Masculino'::public.product_gender),
    ('9 PM Elixir', 'Masculino'::public.product_gender),
    ('9 PM Rebel', 'Masculino'::public.product_gender),
    ('Ameerat Al Arab Imperium', 'Masculino'::public.product_gender),
    ('Super David In Heaven', 'Masculino'::public.product_gender),
    ('Super David Not Only Intense', 'Masculino'::public.product_gender),
    ('Super David Noir', 'Masculino'::public.product_gender),
    ('Super David Edition', 'Masculino'::public.product_gender),
    ('Hawas Ice', 'Masculino'::public.product_gender),
    ('Odor Epic Verde', 'Masculino'::public.product_gender),
    ('Yara Elixir', 'Femenino'::public.product_gender),
    ('Haya', 'Femenino'::public.product_gender),
    ('Crystal', 'Femenino'::public.product_gender),
    ('Yum Yum', 'Femenino'::public.product_gender),
    ('Club de Nuit Women', 'Femenino'::public.product_gender),
    ('Island Breeze', 'Femenino'::public.product_gender),
    ('Hayaati Florence', 'Femenino'::public.product_gender),
    ('Amber Oud Ultra Edition', 'Femenino'::public.product_gender),
    ('Ameerat Al Arab Privé Rose', 'Femenino'::public.product_gender),
    ('Hawas for Her', 'Femenino'::public.product_gender),
    ('Sublime', 'Femenino'::public.product_gender),
    ('Odyssey Eau de Montagne', 'Unisex'::public.product_gender),
    ('Odyssey Black Forest', 'Unisex'::public.product_gender),
    ('Odyssey Bahamas', 'Unisex'::public.product_gender),
    ('Odyssey Limoni', 'Unisex'::public.product_gender),
    ('Goo Mango', 'Unisex'::public.product_gender),
    ('Odyssey Spectra', 'Unisex'::public.product_gender),
    ('Marshmallow Blush', 'Unisex'::public.product_gender),
    ('Cocoa Morado', 'Unisex'::public.product_gender),
    ('Hayaati Gold Elixir', 'Unisex'::public.product_gender),
    ('Amber Oud Gold Edition', 'Unisex'::public.product_gender),
    ('Amber Oud Ruby Edition', 'Unisex'::public.product_gender),
    ('Aawa Musamam', 'Unisex'::public.product_gender),
    ('Erba Pura', 'Unisex'::public.product_gender),
    ('Opera', 'Unisex'::public.product_gender),
    ('Coro', 'Unisex'::public.product_gender),
    ('Victoria', 'Unisex'::public.product_gender),
    ('Khamrah Qahwa', 'Unisex'::public.product_gender),
    ('Bade''e Al Oud Oud for Glory', 'Unisex'::public.product_gender),
    ('Eclaire Pistachio', 'Unisex'::public.product_gender),
    ('Eclaire Banoffi', 'Unisex'::public.product_gender),
    ('Kai Aly', 'Unisex'::public.product_gender),
    ('Mario Bros', 'Infantil'::public.product_gender)
)
update public.products product
set gender = classifications.gender
from classifications
where product.catalog_section = 'tubitos_arabes'
  and lower(trim(product.name)) = lower(trim(classifications.name));

commit;
