begin;

update public.products as product
set
  photo_url = images.photo_url,
  updated_at = now()
from (
  values
    ('9 PM Elixir', '/tubitos-arabes/9-pm-elixir.jpeg'),
    ('9 PM Rebel', '/tubitos-arabes/9-pm-rebel.jpeg'),
    ('Aawa Musamam', '/tubitos-arabes/aawa-musamam.jpeg'),
    ('Amber Oud Gold Edition', '/tubitos-arabes/amber-oud-gold-edition.jpeg'),
    ('Amber Oud Ruby Edition', '/tubitos-arabes/amber-oud-ruby-edition.jpeg'),
    ('Amber Oud Ultra Edition', '/tubitos-arabes/amber-oud-ultra-edition.jpeg'),
    ('Ameerat Al Arab Imperium', '/tubitos-arabes/ameerat-al-arab-imperium.jpeg'),
    ('Ameerat Al Arab Privé Rose', '/tubitos-arabes/ameerat-al-arab-prive-rose.jpeg'),
    ('Asad', '/tubitos-arabes/asad.jpeg'),
    ('Azzure Aoud', '/tubitos-arabes/azzure-aoud.jpeg'),
    ('Bade''e Al Oud Oud for Glory', '/tubitos-arabes/badee-al-oud-oud-for-glory.jpeg'),
    ('Club de Nuit Women', '/tubitos-arabes/club-de-nuit-women.jpeg'),
    ('Cocoa Morado', '/tubitos-arabes/cocoa-morado.jpeg'),
    ('Coro', '/tubitos-arabes/coro.jpeg'),
    ('Crystal', '/tubitos-arabes/crystal.jpeg'),
    ('Eclaire Banoffi', '/tubitos-arabes/eclaire-banoffi.jpeg'),
    ('Eclaire Pistachio', '/tubitos-arabes/eclaire-pistachio.jpeg'),
    ('Erba Pura', '/tubitos-arabes/erba-pura.jpeg'),
    ('Goo Mango', '/tubitos-arabes/goo-mango.jpeg'),
    ('Hawas for Her', '/tubitos-arabes/hawas-for-her.jpeg'),
    ('Hawas Ice', '/tubitos-arabes/hawas-ice.jpeg'),
    ('Haya', '/tubitos-arabes/haya.jpeg'),
    ('Hayaati Black', '/tubitos-arabes/hayaati-black.jpeg'),
    ('Hayaati Florence', '/tubitos-arabes/hayaati-florence.jpeg'),
    ('Hayaati Gold Elixir', '/tubitos-arabes/hayaati-gold-elixir.jpeg'),
    ('Island Breeze', '/tubitos-arabes/island-breeze.jpeg'),
    ('Kai Aly', '/tubitos-arabes/kai-aly.jpeg'),
    ('Khamrah Qahwa', '/tubitos-arabes/khamrah-qahwa.jpeg'),
    ('Liquid Brun', '/tubitos-arabes/liquid-brun.jpeg'),
    ('Mario Bros', '/tubitos-arabes/mario-bros.jpeg'),
    ('Marshmallow Blush', '/tubitos-arabes/marshmallow-blush.jpeg'),
    ('Odor Epic Verde', '/tubitos-arabes/odor-epic-verde.jpeg'),
    ('Odyssey Aqua', '/tubitos-arabes/odyssey-aqua.jpeg'),
    ('Odyssey Bahamas', '/tubitos-arabes/odyssey-bahamas.jpeg'),
    ('Odyssey Black Forest', '/tubitos-arabes/odyssey-black-forest.jpeg'),
    ('Odyssey Eau de Montagne', '/tubitos-arabes/odyssey-eau-de-montagne.jpeg'),
    ('Odyssey Homme', '/tubitos-arabes/odyssey-homme.jpeg'),
    ('Odyssey Limoni', '/tubitos-arabes/odyssey-limoni.jpeg'),
    ('Odyssey Mandarin', '/tubitos-arabes/odyssey-mandarin.jpeg'),
    ('Odyssey Mega', '/tubitos-arabes/odyssey-mega.jpeg'),
    ('Odyssey Spectra', '/tubitos-arabes/odyssey-spectra.jpeg'),
    ('Odyssey Tyrant', '/tubitos-arabes/odyssey-tyrant.jpeg'),
    ('Opera', '/tubitos-arabes/opera.jpeg'),
    ('Sublime', '/tubitos-arabes/sublime.jpeg'),
    ('Super David Edition', '/tubitos-arabes/super-david-edition.jpeg'),
    ('Super David In Heaven', '/tubitos-arabes/super-david-in-heaven.jpeg'),
    ('Super David Noir', '/tubitos-arabes/super-david-noir.jpeg'),
    ('Super David Not Only Intense', '/tubitos-arabes/super-david-not-only-intense.jpeg'),
    ('Victoria', '/tubitos-arabes/victoria.jpeg'),
    ('Yara Elixir', '/tubitos-arabes/yara-elixir.jpeg'),
    ('Yum Yum', '/tubitos-arabes/yum-yum.jpeg')
) as images(name, photo_url)
where product.catalog_section = 'tubitos_arabes'
  and product.name = images.name;

commit;
