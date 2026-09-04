-- ============================================================================
-- 0049 — PetSemti Rehber
--
-- Sitede ilan ve hizmet var, bilgi yok. "Yavru köpek sahiplenirken nelere
-- dikkat edilir", "köpeklerde aşı takvimi", "kedim kayboldu ne yapmalıyım"
-- gibi sorular aramada en çok yazılanlar ve bu sorulara cevap veren bir
-- sayfamız olmadığı için o kullanıcılar siteye hiç uğramıyor.
--
-- Rehber, blogdan farklı olarak ürüne bağlı: her yazı ilgili ilan
-- listesine, cinse, şehre ya da hizmet rehberine bağlanıyor. Amaç yazı
-- okutmak değil, aramadan gelen kişiyi doğru bölüme götürmek.
--
-- NEDEN AYRI TABLO
-- 0047'deki page_content liste sayfalarının metnini tutuyor; her satır bir
-- SAYFAYA ait. Rehber yazısının kendi adresi, kendi başlığı, yayın tarihi
-- ve kapak görseli var — farklı bir varlık.
-- ============================================================================

create type public.guide_status as enum ('taslak', 'yayinda', 'arsiv');

create table public.guide_topics (
  id         smallint generated always as identity primary key,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name       text not null,
  -- Üst konu: Kedi > Bakım gibi iki kademe yetiyor.
  parent_id  smallint references public.guide_topics(id) on delete cascade,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);

create index guide_topics_parent_idx on public.guide_topics (parent_id, position);

create table public.guides (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,120}$'),
  topic_id    smallint references public.guide_topics(id) on delete set null,

  title       text not null check (char_length(btrim(title)) between 5 and 160),
  -- Liste kartında ve arama sonucunda görünen özet.
  excerpt     text check (char_length(excerpt) <= 300),
  body        text not null,
  cover_path  text,

  status      public.guide_status not null default 'taslak',
  published_at timestamptz,
  author_id   uuid references public.profiles(id) on delete set null,

  view_count  integer not null default 0,

  seo_title       text check (char_length(seo_title) <= 120),
  seo_description text check (char_length(seo_description) <= 300),

  -- Yazının hangi ürün sayfalarına bağlandığı. Rehberin varlık sebebi bu:
  -- "British Shorthair bakımı" yazısı o cinsin ilanlarına gitmeli.
  related_category_id smallint references public.categories(id) on delete set null,
  related_breed_id    integer  references public.breeds(id)     on delete set null,
  related_city_id     smallint references public.cities(id)     on delete set null,
  related_service     public.service_type,
  /** Serbest bağlantılar: [{"label":"...","href":"/..."}] */
  related_links jsonb not null default '[]'::jsonb
    check (jsonb_typeof(related_links) = 'array'),

  search_vector tsvector,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guides_published_idx on public.guides (published_at desc)
  where status = 'yayinda';
create index guides_topic_idx on public.guides (topic_id, published_at desc);
create index guides_search_idx on public.guides using gin (search_vector);

create or replace function public.guides_build_search()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('turkish', coalesce(new.title, '')),   'A')
   || setweight(to_tsvector('turkish', coalesce(new.excerpt, '')), 'B')
   || setweight(to_tsvector('turkish', coalesce(new.body, '')),    'C');

  -- Yayına alınırken tarih kendiliğinden düşsün; elle girilmesi unutuluyor
  -- ve tarihsiz yazı listede en sona düşüyordu.
  if new.status = 'yayinda' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists guides_build_search_trigger on public.guides;
create trigger guides_build_search_trigger
  before insert or update on public.guides
  for each row execute function public.guides_build_search();

create trigger guides_set_updated_at
  before update on public.guides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: taslak yazı dışarı sızmasın
-- ---------------------------------------------------------------------------
alter table public.guide_topics enable row level security;
alter table public.guides       enable row level security;

create policy guide_topics_read on public.guide_topics for select using (true);
create policy guide_topics_admin on public.guide_topics
  for all using (public.is_admin()) with check (public.is_admin());

create policy guides_read_published on public.guides
  for select using (status = 'yayinda' or public.is_admin());
create policy guides_admin on public.guides
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.guide_topics, public.guides to anon, authenticated;
grant insert, update, delete on public.guides, public.guide_topics to authenticated;

-- ---------------------------------------------------------------------------
-- Konu ağacı
-- ---------------------------------------------------------------------------
insert into public.guide_topics (slug, name, position) values
  ('kedi', 'Kedi', 1),
  ('kopek', 'Köpek', 2),
  ('diger-hayvanlar', 'Diğer Evcil Hayvanlar', 3),
  ('guvercin', 'Güvercin', 4),
  ('kayip-bulundu', 'Kayıp ve Bulundu', 5),
  ('hizmetler', 'Hizmet Seçimi', 6)
on conflict (slug) do nothing;

insert into public.guide_topics (slug, name, parent_id, position)
select v.slug, v.name, p.id, v.position
  from (values
    ('kedi-bakim', 'Kedi Bakımı', 'kedi', 1),
    ('kedi-beslenme', 'Kedi Beslenmesi', 'kedi', 2),
    ('kedi-saglik', 'Kedi Sağlığı', 'kedi', 3),
    ('kopek-bakim', 'Köpek Bakımı', 'kopek', 1),
    ('kopek-egitim', 'Köpek Eğitimi', 'kopek', 2),
    ('kopek-saglik', 'Köpek Sağlığı', 'kopek', 3)
  ) as v(slug, name, ust, position)
  join public.guide_topics p on p.slug = v.ust
on conflict (slug) do nothing;
