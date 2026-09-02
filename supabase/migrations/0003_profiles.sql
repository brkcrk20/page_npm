-- ============================================================================
-- 0003_profiles.sql — Kullanıcı profilleri
--
-- Kimlik doğrulama Supabase Auth'ta (auth.users). Bu tablo onun uygulamaya
-- ait uzantısı: profil bilgisi, üyelik tipi, fatura bilgileri, rozetler.
-- ============================================================================

create type public.user_role      as enum ('user', 'moderator', 'admin');
create type public.account_type   as enum ('bireysel', 'kurumsal');

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,

  -- Genel
  full_name     text,
  username      text unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  avatar_url    text,
  bio           text,
  phone         text,
  city_id       smallint references public.cities(id),
  district_id   integer  references public.districts(id),

  role          public.user_role    not null default 'user',
  account_type  public.account_type not null default 'bireysel',

  -- "GÜVENLİ ÜYE" rozeti — yalnızca admin/doğrulama akışı verebilir.
  is_verified   boolean not null default false,
  verified_at   timestamptz,

  -- Kurumsal üye alanları (account_type = 'kurumsal')
  company_title    text,
  company_type     text,
  tax_office       text,
  tax_number       text,
  national_id      text,           -- TCKN (bireysel fatura için)
  company_address  text,

  -- Hesap durumu
  is_banned     boolean not null default false,
  banned_reason text,

  -- İstatistik (trigger ile güncellenir, istemci yazamaz)
  listing_count integer not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz,

  -- Kurumsal hesapta şirket ünvanı zorunlu
  constraint profiles_corporate_requires_title
    check (account_type <> 'kurumsal' or company_title is not null)
);

create index profiles_role_idx on public.profiles (role) where role <> 'user';
create index profiles_city_idx on public.profiles (city_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin kontrolü.
--
-- Rol bilgisi profiles tablosunda tutulur. RLS politikalarının içinden
-- profiles'a bakmak sonsuz döngüye yol açabileceği için fonksiyonu
-- SECURITY DEFINER yapıp arama yolunu sabitliyoruz.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- auth.users'a yeni kayıt düştüğünde profili otomatik oluştur.
--
-- Kayıt formundan gelen ek alanlar raw_user_meta_data içinde taşınır
-- (supabase.auth.signUp({ options: { data: {...} } })).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, account_type)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(
      (new.raw_user_meta_data ->> 'account_type')::public.account_type,
      'bireysel'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Herkese açık profil görünümü.
--
-- İlan detayında satıcı bilgisini göstermek için profiles'ı tümüyle açmak
-- yerine yalnızca güvenli alanları yayınlıyoruz — telefon, TCKN, vergi no ve
-- adres dışarı sızmasın.
--
-- Bilerek security_invoker KULLANILMIYOR: view sahibi haklarıyla çalışıp
-- profiles üzerindeki RLS'i atlar, böylece herkes satıcının adını görebilir.
-- Güvenlik, seçilen kolon listesiyle sağlanıyor — bu view'a hassas bir kolon
-- eklemek onu tüm ziyaretçilere açmak demektir.
-- ---------------------------------------------------------------------------
create view public.public_profiles as
  select
    id,
    full_name,
    username,
    avatar_url,
    bio,
    city_id,
    account_type,
    company_title,
    is_verified,
    listing_count,
    created_at
  from public.profiles
  where is_banned = false;
