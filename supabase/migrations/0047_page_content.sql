-- ============================================================================
-- 0047 — Sayfa içerikleri: liste sayfalarına özgün metin
--
-- SORUN
-- Kategori, cins, şehir, ilçe ve hizmet rehberi sayfaları yalnızca
-- filtrelerden ve ilan kartlarından oluşuyordu. Arama motoru için de
-- kullanıcı için de bu sayfaların birbirinden ayrışan hiçbir yanı yoktu:
-- "Kadıköy Veterinerleri" ile "Beşiktaş Veterinerleri" aynı şablon.
--
-- Şemada bunun için bir yer VARDI ama yanlış yerdeydi ve hiç kullanılmıyordu:
-- breeds tablosunda content_intro, content_body, faq, seo_title,
-- seo_description kolonları duruyordu — 220 cinsin tamamında boş ve uygulama
-- hiçbirini okumuyordu. Üstelik yalnızca cinsi kapsıyordu; şehir, ilçe ve
-- hizmet rehberi sayfaları için karşılığı yoktu.
--
-- ÇÖZÜM
-- Tek bir içerik tablosu, hangi sayfaya ait olduğu boş bırakılabilen
-- anahtarlarla belirleniyor:
--
--   kategori           → (category_id)
--   cins               → (category_id, breed_id)
--   şehir              → (category_id, city_id)
--   ilçe               → (category_id, city_id, district_id)
--   hizmet rehberi     → (service_type)
--   şehirde hizmet     → (service_type, city_id)
--
-- Her sayfa türü için ayrı tablo açmak aynı alanları beş kez kopyalamak,
-- her yeni sayfa türünde yeni göç yazmak demekti.
-- ============================================================================

create table public.page_content (
  id          bigint generated always as identity primary key,

  category_id  smallint            references public.categories(id) on delete cascade,
  breed_id     integer             references public.breeds(id)     on delete cascade,
  city_id      smallint            references public.cities(id)     on delete cascade,
  district_id  integer             references public.districts(id)  on delete cascade,
  service_type public.service_type,

  seo_title       text check (char_length(seo_title) <= 120),
  seo_description text check (char_length(seo_description) <= 300),

  -- Listenin ÜSTÜNDE, iki üç cümle: sayfanın ne olduğunu söyler.
  intro text,
  -- Listenin ALTINDA, uzun metin. Paragraflar boş satırla ayrılır.
  body  text,
  -- [{ "soru": "...", "cevap": "..." }] — sayfada ve FAQPage işaretlemesinde.
  faq   jsonb not null default '[]'::jsonb
    check (jsonb_typeof(faq) = 'array'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Aynı sayfaya iki içerik olamaz. NULLS NOT DISTINCT şart: varsayılan
-- davranışta iki NULL birbirinden farklı sayılır ve aynı kategori için
-- sınırsız satır açılabilirdi.
create unique index page_content_hedef_idx
  on public.page_content (category_id, breed_id, city_id, district_id, service_type)
  nulls not distinct;

create trigger page_content_set_updated_at
  before update on public.page_content
  for each row execute function public.set_updated_at();

alter table public.page_content enable row level security;

create policy page_content_read on public.page_content
  for select using (true);
create policy page_content_admin on public.page_content
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.page_content to anon, authenticated;
grant insert, update, delete on public.page_content to authenticated;

-- ---------------------------------------------------------------------------
-- breeds üzerindeki ölü kolonlar
--
-- Beşi de 220 satırın tamamında boş ve hiçbir yerden okunmuyor (ölçüldü).
-- Bırakmak, aynı bilginin iki yerde tutulması demekti: ileride biri
-- doldurulur, öbürü unutulur ve sayfa hangisini gösterdiğini kimse bilmez.
-- ---------------------------------------------------------------------------
alter table public.breeds
  drop column if exists content_intro,
  drop column if exists content_body,
  drop column if exists faq,
  drop column if exists seo_title,
  drop column if exists seo_description;
