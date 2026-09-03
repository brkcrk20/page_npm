-- ============================================================================
-- 0027_breed_group_in_counts.sql — Irk grubunu sayım görünümüne taşı
--
-- 0026 breeds.group_name'i ekledi ama menüyü besleyen görünüm onu
-- taşımıyordu. Grubu ayrı bir sorguyla çekmek, her sayfa yüklemesinde ikinci
-- bir gidiş dönüş demekti — menü her sayfada var.
-- ============================================================================

-- create or replace kolon SIRASINI değiştiremiyor ("cannot change name of
-- view column"); yeni kolon sona eklenebilirdi ama grubun adın yanında
-- durması okunabilirlik açısından daha iyi. Görünüm düşürülüp kuruluyor.
drop view if exists public.breed_listing_counts;

create view public.breed_listing_counts as
  select
    b.id          as breed_id,
    b.category_id,
    b.slug        as breed_slug,
    b.name        as breed_name,
    b.group_name,
    b.position,
    count(l.id)   as listing_count
  from public.breeds b
  left join public.listings l
    on l.breed_id = b.id
   and l.status = 'yayinda'
  where b.is_active
  group by b.id, b.category_id, b.slug, b.name, b.group_name, b.position;

grant select on public.breed_listing_counts to anon, authenticated;
