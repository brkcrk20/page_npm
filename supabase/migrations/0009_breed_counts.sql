-- ============================================================================
-- 0009_breed_counts.sql — Cins ve kategori başına yayındaki ilan sayıları
--
-- Sol menüde her cinsin yanında ilan sayısı gösteriliyor. Bunu her cins için
-- ayrı sorguyla almak 100+ istek demekti; PostgREST doğrudan GROUP BY
-- desteklemediği için sayımı view'a taşıyoruz — tek istekle tüm liste geliyor.
--
-- View yalnızca yayındaki ilanları sayar; taslak veya onay bekleyen ilanların
-- sayaçta görünmesi ziyaretçiye olmayan içerik vaat ederdi.
-- ============================================================================

create or replace view public.breed_listing_counts as
  select
    b.id          as breed_id,
    b.category_id,
    b.slug        as breed_slug,
    b.name        as breed_name,
    b.position,
    count(l.id)   as listing_count
  from public.breeds b
  left join public.listings l
    on l.breed_id = b.id
   and l.status = 'yayinda'
  where b.is_active
  group by b.id, b.category_id, b.slug, b.name, b.position;

create or replace view public.category_listing_counts as
  select
    c.id        as category_id,
    c.slug      as category_slug,
    c.name      as category_name,
    c.position,
    count(l.id) as listing_count
  from public.categories c
  left join public.listings l
    on l.category_id = c.id
   and l.status = 'yayinda'
  where c.is_active
  group by c.id, c.slug, c.name, c.position;

create or replace view public.city_listing_counts as
  select
    ct.id        as city_id,
    ct.slug      as city_slug,
    ct.name      as city_name,
    count(l.id)  as listing_count
  from public.cities ct
  left join public.listings l
    on l.city_id = ct.id
   and l.status = 'yayinda'
  group by ct.id, ct.slug, ct.name;

-- Sayımlar herkese açık: sol menü giriş yapmamış ziyaretçiye de görünüyor.
grant select on
  public.breed_listing_counts,
  public.category_listing_counts,
  public.city_listing_counts
to anon, authenticated;
