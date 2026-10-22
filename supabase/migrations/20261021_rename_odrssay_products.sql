begin;

update public.products
set name = regexp_replace(name, '^Odyssey[[:space:]]+', 'Odrssay ')
where catalog_section = 'tubitos_arabes'
  and name ~ '^Odyssey[[:space:]]+';

commit;
