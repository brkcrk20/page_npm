-- ============================================================================
-- 0002_reference.sql — Referans tabloları (kategori, cins, şehir, ilçe)
--
-- Bu tablolar nadiren değişir ve tamamen herkese açık okunur; SEO sayfalarının
-- (kategori / cins / şehir) temeli bunlar. Veriler supabase/seed/ altındaki
-- üretilmiş dosyadan yüklenir.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Kategoriler: köpek, kedi, kuş, akvaryum, diğer
-- ---------------------------------------------------------------------------
create table public.categories (
  id          smallint primary key,
  slug        text not null unique,
  name        text not null,
  -- Kod tarafındaki kanonik tip (routing.ts: CategoryType)
  code        text not null unique check (code in ('Dog','Cat','Bird','Aquarium','Other')),
  icon        text,
  position    smallint not null default 0,
  is_active   boolean not null default true,
  -- SEO
  seo_title       text,
  seo_description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cinsler
-- ---------------------------------------------------------------------------
create table public.breeds (
  id           integer generated always as identity primary key,
  category_id  smallint not null references public.categories(id) on delete cascade,
  slug         text not null,
  name         text not null,
  position     smallint not null default 0,
  is_active    boolean not null default true,
  -- Cins sayfasındaki SEO metni. Bu sayfalar aramadan gelen trafiğin
  -- büyük kısmını karşılıyor: kullanıcı "golden retriever yavru" arıyor,
  -- ana sayfaya değil doğrudan cins sayfasına düşüyor.
  -- Her cins için kendi özgün içeriğimizi yazacağız.
  seo_title        text,
  seo_description  text,
  content_intro    text,
  content_body     text,
  faq              jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Slug kategori içinde benzersiz: /kopek-ilanlari/toy-poodle
  unique (category_id, slug)
);

create index breeds_category_idx on public.breeds (category_id, position, name);

create trigger breeds_set_updated_at
  before update on public.breeds
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Şehirler ve ilçeler
-- ---------------------------------------------------------------------------
create table public.cities (
  id         smallint primary key,          -- plaka kodu
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.districts (
  id         integer generated always as identity primary key,
  city_id    smallint not null references public.cities(id) on delete cascade,
  slug       text not null,
  name       text not null,
  created_at timestamptz not null default now(),

  unique (city_id, slug)
);

create index districts_city_idx on public.districts (city_id, name);

-- ---------------------------------------------------------------------------
-- Cins slug'ları şehir slug'larıyla çakışmamalı.
--
-- /<kategori>/<segment> route'u segmenti önce şehir listesinde arar; çakışma
-- olursa o cins sayfası hiçbir zaman açılamaz. Bunu veritabanı seviyesinde
-- garanti altına alıyoruz ki ileride cins eklerken sessizce kırılmasın.
-- (routing.ts: findSlugCollisions aynı kontrolü kod tarafında yapar.)
-- ---------------------------------------------------------------------------
create or replace function public.assert_breed_slug_not_city()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.cities where slug = new.slug) then
    raise exception
      'Cins slug''ı bir şehir slug''ı ile çakışıyor: %. Bu cins sayfası erişilemez olurdu.', new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger breeds_slug_collision_check
  before insert or update of slug on public.breeds
  for each row execute function public.assert_breed_slug_not_city();
