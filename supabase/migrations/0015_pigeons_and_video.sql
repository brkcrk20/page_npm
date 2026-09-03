-- ============================================================================
-- 0015_pigeons_and_video.sql — Güvercin kategorisi ve ilan videoları
--
-- GÜVERCİN NEDEN AYRI BİR SİSTEM DEĞİL
-- Güvercin ilanı da bir ilan: arama, cins/şehir kırılımı, fotoğraf, favori,
-- moderasyon ve öne çıkarma mantığının tamamı aynı. Ayrı tablo açmak bunların
-- hepsini ikinci kez yazmak olurdu. Kategori olarak ekleniyor; kendine özgü
-- alanlar (halka no, şecere, uçuş süresi, takla sayısı) listings.details
-- içinde, kendine özgü sayfa tasarımı ise uygulama tarafında.
--
-- VİDEO
-- Taklacı güvercin alıcısı kuşun uçuşunu izlemek istiyor; fotoğraf yetmiyor.
-- Video ücretli bir özellik olarak kurgulanıyor — hem gerçek bir maliyeti var
-- (depolama + bant genişliği) hem de ilanı öne çıkaran bir değer.
--
-- Sağlayıcıdan bağımsız tasarlandı: dosya Supabase Storage'da da durabilir,
-- Cloudflare Stream / Bunny gibi bir video platformunda da. provider ve
-- external_id kolonları bu geçişi şema değişikliği olmadan mümkün kılıyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Güvercin kategorisi
-- ---------------------------------------------------------------------------
-- SIRA ÖNEMLİ: kısıt önce genişletiliyor. Ters sırada ekleme, henüz 'Pigeon'
-- değerini tanımayan kısıta takılıyor.
alter table public.categories drop constraint if exists categories_code_check;
alter table public.categories add constraint categories_code_check
  check (code in ('Dog', 'Cat', 'Bird', 'Aquarium', 'Other', 'Pigeon'));

insert into public.categories (id, slug, name, code, position, seo_title, seo_description)
values (
  6, 'guvercin-ilanlari', 'Güvercin İlanları', 'Pigeon', 6,
  'Güvercin İlanları — Taklacı, Posta ve Süs Güvercinleri',
  'Taklacı, posta, dolapçı ve süs güvercini ilanları. Uçuş videoları, halka numarası ve şecere bilgisiyle güvenle alım satım.'
)
on conflict (id) do update
  set slug = excluded.slug, name = excluded.name, code = excluded.code,
      position = excluded.position, seo_title = excluded.seo_title,
      seo_description = excluded.seo_description;

-- ---------------------------------------------------------------------------
-- Güvercin cinsleri
--
-- Türkiye'de yaygın olan ırklar. Taklacılar bölgesel adlarıyla anılıyor
-- (Adana, Mardin, Urfa taklacısı) ve alıcı doğrudan bunları arıyor; tek bir
-- "taklacı" başlığı altında toplamak arama trafiğini kaybettirirdi.
-- ---------------------------------------------------------------------------
insert into public.breeds (category_id, slug, name, position) values
  (6, 'taklaci-guvercin',       'Taklacı Güvercin',        1),
  (6, 'adana-taklacisi',        'Adana Taklacısı',         2),
  (6, 'mardin-taklacisi',       'Mardin Taklacısı',        3),
  (6, 'urfa-taklacisi',         'Urfa Taklacısı',          4),
  (6, 'antep-taklacisi',        'Antep Taklacısı',         5),
  (6, 'posta-guvercini',        'Posta Güvercini',         6),
  (6, 'yaris-guvercini',        'Yarış Güvercini',         7),
  (6, 'dolapci-guvercin',       'Dolapçı Güvercin',        8),
  (6, 'miralay-guvercin',       'Miralay Güvercin',        9),
  (6, 'sebab-guvercin',         'Şebab Güvercin',          10),
  (6, 'bango-guvercin',         'Bango Güvercin',          11),
  (6, 'kelebek-guvercin',       'Kelebek Güvercin',        12),
  (6, 'makaraci-guvercin',      'Makaracı Güvercin',       13),
  (6, 'oynar-guvercin',         'Oynar Güvercin',          14),
  (6, 'sam-guvercini',          'Şam Güvercini',           15),
  (6, 'halep-guvercini',        'Halep Güvercini',         16),
  (6, 'hunkari-guvercin',       'Hünkari Güvercin',        17),
  (6, 'kuskus-guvercin',        'Kuşkuş Güvercin',         18),
  (6, 'tekir-guvercin',         'Tekir Güvercin',          19),
  (6, 'sus-guvercini',          'Süs Güvercini',           20),
  (6, 'pofuduk-guvercin',       'Pofuduk Güvercin',        21),
  (6, 'kuyruklu-guvercin',      'Kuyruklu (Tavus) Güvercin', 22),
  (6, 'guatrli-guvercin',       'Guatrlı Güvercin',        23),
  (6, 'karma-guvercin',         'Karma / Melez Güvercin',  24)
on conflict (category_id, slug) do update
  set name = excluded.name, position = excluded.position;

-- ---------------------------------------------------------------------------
-- İlan videoları
-- ---------------------------------------------------------------------------
-- Tipler ve tablo idempotent: göç kısmen uygulanmış bir veritabanında
-- yeniden çalıştırılabilmeli.
do $$ begin
  create type public.video_provider as enum ('supabase', 'cloudflare', 'bunny');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_status as enum ('yukleniyor', 'isleniyor', 'hazir', 'basarisiz');
exception when duplicate_object then null; end $$;

-- Video ayrı bir öne çıkarma türü: mevcut değerlerin hiçbiri karşılamıyor.
-- ALTER TYPE ... ADD VALUE eklendiği işlemde KULLANILAMAZ, bu yüzden video
-- ürününün kaydı 0016'ya alındı.
alter type public.promotion_kind add value if not exists 'video';

create table if not exists public.listing_videos (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,

  provider    public.video_provider not null default 'supabase',
  -- Supabase'de depolama yolu, harici platformda o platformun video kimliği.
  storage_path text,
  external_id  text,
  -- Harici platformlarda oynatma adresi ayrı gelir (HLS manifest vb.).
  playback_url text,
  thumbnail_path text,

  status      public.video_status not null default 'yukleniyor',

  duration_seconds integer check (duration_seconds > 0),
  size_bytes       bigint   check (size_bytes > 0),
  width            integer,
  height           integer,

  position    smallint not null default 0 check (position between 0 and 4),
  -- SEO: video etiketi ve dosya adı ilan başlığından türetiliyor.
  title       text,

  created_at  timestamptz not null default now(),

  unique (listing_id, position),

  -- Supabase'de dosya yolu, harici platformda kimlik zorunlu; ikisi de boş
  -- bir video kaydı hiçbir şey oynatamaz.
  constraint listing_videos_source check (
    (provider = 'supabase' and storage_path is not null)
    or (provider <> 'supabase' and external_id is not null)
  )
);

create index if not exists listing_videos_listing_idx on public.listing_videos (listing_id, position);

alter table public.listing_videos enable row level security;

-- Videolar ilanın görünürlüğünü miras alır.
drop policy if exists listing_videos_read on public.listing_videos;
create policy listing_videos_read on public.listing_videos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'yayinda' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists listing_videos_write_own on public.listing_videos;
create policy listing_videos_write_own on public.listing_videos
  for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

drop policy if exists listing_videos_admin on public.listing_videos;
create policy listing_videos_admin on public.listing_videos
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.listing_videos to anon, authenticated;
grant insert, update, delete on public.listing_videos to authenticated;

-- ---------------------------------------------------------------------------
-- Video depolama kovası
--
-- Fotoğraf kovasından ayrı: boyut sınırı ve MIME tipleri tamamen farklı,
-- ileride video ayrı bir platforma taşınırsa tek kova taşınacak.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ilan-videolari',
  'ilan-videolari',
  true,
  120 * 1024 * 1024,   -- 120 MB: sıkıştırma sonrası bir dakikalık video bunun çok altında
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ilan_video_herkes_okur" on storage.objects;
create policy "ilan_video_herkes_okur"
  on storage.objects for select
  using (bucket_id = 'ilan-videolari');

drop policy if exists "ilan_video_sahibi_yukler" on storage.objects;
create policy "ilan_video_sahibi_yukler"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ilan-videolari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ilan_video_sahibi_siler" on storage.objects;
create policy "ilan_video_sahibi_siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ilan-videolari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Video ücretli bir özellik
--
-- Ücretlendirme şu an kapalı olduğu için varsayılan sınır cömert; açıldığında
-- app_settings üzerinden kısılıp doping ürünü olarak satılacak.
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
  ('video',
   jsonb_build_object(
     'enabled',            true,
     'requires_payment',   false,  -- ücretlendirme açılınca true olacak
     'free_videos_per_listing', 1,
     'max_videos_per_listing',  5,
     'max_duration_seconds',    180,
     'max_size_mb',             120,
     'provider',           'supabase'
   ),
   'İlan videosu kuralları. requires_payment açıldığında ücretsiz kota aşılınca doping satın alınması gerekir.')
on conflict (key) do nothing;
