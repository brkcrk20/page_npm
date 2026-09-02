-- ============================================================================
-- 0005_monetization.sql — Ücretlendirme altyapısı
--
-- ÖNEMLİ: Ücretlendirme şu an KAPALI. app_settings'teki 'monetization' anahtarı
-- false; uygulama bu bayrağa bakarak tüm ücretli özellikleri bedava/sınırsız
-- gösteriyor (bkz. src/lib/monetization.ts). Tablolar ve kurallar baştan doğru
-- kurulsun ki açmak bir şema göçü değil, tek satırlık ayar değişikliği olsun.
--
-- Ödeme sağlayıcısı bilerek soyut: orders/payments tabloları provider'ı metin
-- olarak tutar, iyzico/PayTR/havale arasında geçiş şema değişikliği istemez.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Uygulama ayarları — deploy gerektirmeden değiştirilebilen anahtarlar
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.app_settings (key, value, description) values
  ('monetization',
   jsonb_build_object(
     'enabled',              false,   -- ANA ANAHTAR: true yapınca ücretlendirme devreye girer
     'promotions_enabled',   false,   -- doping/vitrin satışı
     'subscriptions_enabled',false,   -- kurumsal abonelik
     'quota_enabled',        false,   -- ilan hakkı sınırı
     'free_listing_quota',   null,    -- quota_enabled iken aylık ücretsiz ilan sayısı
     'provider',             'manual' -- 'manual' | 'iyzico' | 'paytr'
   ),
   'Ücretlendirme ana ayarları. enabled=false iken tüm ücretli özellikler ücretsiz/sınırsız davranır.'),

  ('listing',
   jsonb_build_object(
     'auto_approve',       true,    -- false yapınca ilanlar onay kuyruğuna düşer
     'default_duration_days', 60,
     'max_photos',         12
   ),
   'İlan yayın kuralları.');

-- ---------------------------------------------------------------------------
-- Ürün kataloğu
-- ---------------------------------------------------------------------------
create type public.product_kind as enum (
  'doping',        -- tek ilana uygulanan öne çıkarma
  'abonelik',      -- kurumsal üyelik planı
  'ilan_paketi'    -- toplu ilan hakkı
);

create type public.promotion_kind as enum (
  'anasayfa_vitrin',   -- ana sayfa vitrini
  'kategori_vitrin',   -- kategori sayfası vitrini
  'ust_sirada',        -- listede üst sıralarda
  'acil',              -- "acil" rozeti
  'renkli_cerceve',    -- renkli çerçeve
  'ilan_yenileme'      -- tarihi güncelleyip başa taşır
);

create table public.products (
  id            integer generated always as identity primary key,
  code          text not null unique,        -- 'vitrin_7g', 'kurumsal_aylik'
  kind          public.product_kind not null,

  name          text not null,
  description   text,

  -- Fiyat kuruş cinsinden tamsayı: kayan nokta hatası olmasın.
  price_minor   integer not null check (price_minor >= 0),
  currency      char(3) not null default 'TRY',

  -- doping / abonelik süresi
  duration_days smallint check (duration_days > 0),
  -- doping ise hangi öne çıkarma tipi
  promotion     public.promotion_kind,
  -- ilan_paketi ise kaç ilan hakkı verir
  listing_credits smallint check (listing_credits > 0),

  is_active     boolean not null default true,
  position      smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Her ürün tipi kendi alanını doldurmak zorunda
  constraint products_shape check (
    (kind = 'doping'      and promotion is not null and duration_days is not null) or
    (kind = 'abonelik'    and duration_days is not null) or
    (kind = 'ilan_paketi' and listing_credits is not null)
  )
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Siparişler
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'odeme_bekleniyor',
  'odendi',
  'iptal',
  'basarisiz',
  'iade'
);

create table public.orders (
  id            bigint generated always as identity primary key,
  -- Kullanıcıya gösterilen sipariş numarası
  public_ref    uuid not null default gen_random_uuid() unique,

  user_id       uuid not null references public.profiles(id) on delete restrict,
  status        public.order_status not null default 'odeme_bekleniyor',

  amount_minor  integer not null check (amount_minor >= 0),
  currency      char(3) not null default 'TRY',

  -- 'manual' (havale/EFT), 'iyzico', 'paytr' ...
  provider      text not null default 'manual',
  provider_ref  text,

  -- Fatura bilgileri sipariş anında dondurulur; kullanıcı sonradan profilini
  -- değiştirse bile kesilmiş faturanın verisi bozulmasın.
  billing_snapshot jsonb not null default '{}'::jsonb,

  paid_at       timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index orders_user_idx   on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at) where status = 'odeme_bekleniyor';

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint not null references public.orders(id) on delete cascade,
  product_id   integer not null references public.products(id) on delete restrict,
  -- Doping ise hangi ilana uygulanacak
  listing_id   bigint references public.listings(id) on delete set null,

  quantity     smallint not null default 1 check (quantity > 0),
  -- Ürün fiyatı sonradan değişse bile sipariş tutarı sabit kalsın
  unit_price_minor integer not null check (unit_price_minor >= 0),

  created_at   timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Ödeme kayıtları — sağlayıcıdan gelen ham olaylar
-- İstemci buraya asla yazamaz; yalnızca webhook/servis rolü yazar.
-- ---------------------------------------------------------------------------
create table public.payments (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders(id) on delete cascade,
  provider      text not null,
  provider_ref  text,
  status        text not null,
  amount_minor  integer not null,
  currency      char(3) not null default 'TRY',
  raw_payload   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Abonelikler (kurumsal üyelik)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  integer not null references public.products(id) on delete restrict,
  order_id    bigint references public.orders(id) on delete set null,

  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  is_active   boolean not null default true,
  auto_renew  boolean not null default false,

  created_at  timestamptz not null default now(),

  constraint subscriptions_period check (ends_at > starts_at)
);

-- Bir kullanıcının aynı anda tek aktif aboneliği olur.
create unique index subscriptions_one_active_idx
  on public.subscriptions (user_id) where is_active;

-- ---------------------------------------------------------------------------
-- İlan öne çıkarmaları (doping)
--
-- Ayrı tablo, ilan üzerinde boolean değil: süreli, denetlenebilir ve bir ilan
-- aynı anda birden fazla doping taşıyabilir.
-- ---------------------------------------------------------------------------
create table public.listing_promotions (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  promotion   public.promotion_kind not null,
  order_id    bigint references public.orders(id) on delete set null,

  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,

  created_at  timestamptz not null default now(),

  constraint listing_promotions_period check (ends_at > starts_at)
);

-- Vitrin sorgusu: "şu an aktif olan öne çıkarmalar"
create index listing_promotions_active_idx
  on public.listing_promotions (promotion, ends_at desc, listing_id);

create index listing_promotions_listing_idx
  on public.listing_promotions (listing_id, ends_at desc);

-- ---------------------------------------------------------------------------
-- İlan hakları (ilan_paketi ürünlerinden gelen krediler)
-- ---------------------------------------------------------------------------
create table public.listing_credits (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  order_id    bigint references public.orders(id) on delete set null,
  -- Pozitif: satın alınan hak. Negatif: kullanılan hak.
  delta       smallint not null check (delta <> 0),
  reason      text not null,
  listing_id  bigint references public.listings(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index listing_credits_user_idx on public.listing_credits (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Yardımcı görünüm: bir ilanın şu anda aktif dopingleri
-- ---------------------------------------------------------------------------
create view public.active_listing_promotions as
  select listing_id,
         array_agg(distinct promotion) as promotions,
         max(ends_at)                  as last_ends_at
    from public.listing_promotions
   where now() between starts_at and ends_at
   group by listing_id;

-- ---------------------------------------------------------------------------
-- Ücretlendirme açık mı? Uygulama ve RLS bu tek fonksiyona bakar.
-- ---------------------------------------------------------------------------
create or replace function public.monetization_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((value ->> 'enabled')::boolean, false)
    from public.app_settings
   where key = 'monetization';
$$;
