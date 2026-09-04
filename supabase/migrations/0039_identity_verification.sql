-- ============================================================================
-- 0039_identity_verification.sql — İlan vermeden önce profil doğrulama
--
-- İlan verebilmek için tek koşul profilde telefon bulunmasıydı; telefon da
-- doğrulanmadan, beyan olarak kabul ediliyordu. Dolandırıcılık bildirimlerinin
-- büyük kısmı doğrulanmamış hesaplardan gelir ve doğrulanmamış bir hesabı
-- kapatmak da işe yaramaz: aynı kişi beş dakikada yenisini açar.
--
-- Bu göç kimlik doğrulama DURUMUNU tutuyor. Doğrulamanın kendisi (TCKN'nin
-- NVI'da sorgulanması, vergi numarasının incelenmesi) uygulama tarafında;
-- veritabanı yalnızca sonucu saklıyor ve ilan girişinde kontrol ediyor.
--
-- KVKK NOTU
-- TCKN ve vergi numarası zaten fatura için profiles'ta tutuluyordu
-- (national_id, tax_number) ve public_profiles görünümüne dahil değil.
-- Burada yeni bir hassas alan eklenmiyor, yalnızca doğrulama durumu.
-- ============================================================================

create type public.identity_kind as enum ('tc', 'vergi');

create type public.verification_status as enum (
  'yok',            -- hiç başvurulmamış
  'inceleniyor',    -- başvuru alındı, yönetici bakacak
  'dogrulandi',
  'reddedildi'
);

alter table public.profiles
  add column if not exists identity_kind        public.identity_kind,
  add column if not exists identity_status      public.verification_status not null default 'yok',
  add column if not exists identity_verified_at timestamptz,
  add column if not exists identity_rejected_reason text,
  add column if not exists identity_birth_year  smallint,
  add column if not exists phone_verified_at    timestamptz;

comment on column public.profiles.identity_status is
  'Kimlik doğrulama durumu. Yalnızca yönetici veya sunucu tarafı (service_role) yazabilir.';
comment on column public.profiles.phone_verified_at is
  'Telefonun SMS ile doğrulandığı an. Beyan edilen telefon yeterli sayılmıyor.';

-- ---------------------------------------------------------------------------
-- Doğrulama başvuruları
--
-- Kullanıcının gönderdiği veriyi başvuru olarak saklıyoruz; profildeki durum
-- bunun sonucu. Ayrı tablo, reddedilen bir başvurunun geçmişte kalmasını ve
-- yöneticinin neye bakarak karar verdiğini görebilmesini sağlıyor.
-- ---------------------------------------------------------------------------
create table public.identity_requests (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,

  kind         public.identity_kind not null,
  -- Bireysel
  national_id  text,
  first_name   text,
  last_name    text,
  birth_year   smallint,
  -- Kurumsal
  tax_number   text,
  tax_office   text,
  company_title text,

  status       public.verification_status not null default 'inceleniyor',
  -- NVI sorgusu yapılabildiyse sonucu; yapılamadıysa null (elle inceleme).
  nvi_result   boolean,
  nvi_checked_at timestamptz,
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  reject_reason text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index identity_requests_user_idx   on public.identity_requests (user_id, created_at desc);
create index identity_requests_status_idx on public.identity_requests (status, created_at)
  where status = 'inceleniyor';

create trigger identity_requests_set_updated_at
  before update on public.identity_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Telefon doğrulama kodları
--
-- Kod açık saklanmıyor: veritabanını okuyabilen biri her numaranın kodunu
-- görebilirdi. Karşılaştırma özet üzerinden yapılıyor.
-- ---------------------------------------------------------------------------
create table public.phone_verifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  phone       text not null,
  code_hash   text not null,
  attempts    smallint not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index phone_verifications_user_idx on public.phone_verifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Muhafız: doğrulama alanlarını istemci yazamaz
--
-- Gövde elle yeniden yazılmıyor; 0030'daki gibi mevcut tanım okunup içine
-- ekleniyor. Elle yazmak, o göçün çözdüğü ayrışmayı geri getirirdi.
-- ---------------------------------------------------------------------------
do $$
declare
  src text;
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'profiles_guard';

  if src is null then
    raise exception 'profiles_guard bulunamadı';
  end if;

  if position('identity_status' in src) > 0 then
    raise notice 'profiles_guard zaten doğrulama alanlarını koruyor';
    return;
  end if;

  src := replace(
    src,
    '  new.username      := old.username;',
    '  new.username      := old.username;'                                       || E'\n' ||
    '  -- Doğrulama durumu: yalnızca sunucu tarafı doğrulama akışı yazar.'       || E'\n' ||
    '  new.identity_kind        := old.identity_kind;'                            || E'\n' ||
    '  new.identity_status      := old.identity_status;'                          || E'\n' ||
    '  new.identity_verified_at := old.identity_verified_at;'                     || E'\n' ||
    '  new.identity_rejected_reason := old.identity_rejected_reason;'             || E'\n' ||
    '  new.phone_verified_at    := old.phone_verified_at;'
  );

  if position('identity_status' in src) = 0 then
    raise exception 'profiles_guard içinde beklenen satır bulunamadı; elle bakılmalı';
  end if;

  execute src;
end;
$$;

-- ---------------------------------------------------------------------------
-- Telefon değişince doğrulama düşer
--
-- Doğrulanmış numarayı değiştirip doğrulanmış kalmak, doğrulamayı anlamsız
-- kılardı: kişi kendi numarasını doğrulayıp başkasının numarasını yazabilirdi.
-- ---------------------------------------------------------------------------
create or replace function public.profiles_phone_reverify()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_phone_reverify_trigger on public.profiles;
-- Muhafızdan SONRA çalışmalı: muhafız phone_verified_at'i eski değerine
-- döndürüyor, bu trigger da telefon değiştiyse onu sıfırlıyor.
create trigger profiles_phone_reverify_trigger
  before update on public.profiles
  for each row execute function public.profiles_phone_reverify();

-- ---------------------------------------------------------------------------
-- İlan girişinde doğrulama kontrolü
--
-- Zorunluluk app_settings'ten okunuyor. SMS sağlayıcısı bağlanana kadar
-- telefon zorunluluğu kapalı; açıldığı anda kod değişikliği gerekmiyor.
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
  ('verification',
   '{"require_identity": true, "require_phone": false}'::jsonb,
   'İlan verebilmek için kimlik / telefon doğrulaması zorunlu mu.')
on conflict (key) do nothing;

create or replace function public.listings_require_verification()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cfg     jsonb;
  v_profile public.profiles%rowtype;
begin
  if tg_op <> 'INSERT' or public.guard_bypass() then
    return new;
  end if;

  select value into v_cfg from public.app_settings where key = 'verification';
  v_cfg := coalesce(v_cfg, '{}'::jsonb);

  select * into v_profile from public.profiles where id = new.owner_id;

  if coalesce((v_cfg->>'require_identity')::boolean, false)
     and v_profile.identity_status is distinct from 'dogrulandi' then
    raise exception 'İlan verebilmek için önce profilinizi doğrulamalısınız.'
      using errcode = 'check_violation';
  end if;

  if coalesce((v_cfg->>'require_phone')::boolean, false)
     and v_profile.phone_verified_at is null then
    raise exception 'İlan verebilmek için telefon numaranızı doğrulamalısınız.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists listings_require_verification_trigger on public.listings;
create trigger listings_require_verification_trigger
  before insert on public.listings
  for each row execute function public.listings_require_verification();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.identity_requests   enable row level security;
alter table public.phone_verifications enable row level security;

-- Başvurular yalnızca sahibine ve yöneticiye görünür. Yazma tamamen sunucu
-- tarafında: istemci kendi başvurusunu "dogrulandi" yapamamalı.
create policy identity_requests_read_own on public.identity_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy identity_requests_admin on public.identity_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- Doğrulama kodları istemciye hiç açılmıyor; yalnızca service_role okur.
create policy phone_verifications_admin on public.phone_verifications
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.identity_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Yönetici işlemleri
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_identity(
  p_request_id bigint,
  p_approve    boolean,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.identity_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Yetkiniz yok.' using errcode = '42501';
  end if;

  select * into r from public.identity_requests where id = p_request_id;
  if not found then
    raise exception 'Başvuru bulunamadı.';
  end if;

  update public.identity_requests
     set status = case when p_approve then 'dogrulandi' else 'reddedildi' end,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         reject_reason = case when p_approve then null else p_reason end
   where id = p_request_id;

  update public.profiles
     set identity_kind = r.kind,
         identity_status = case when p_approve then 'dogrulandi' else 'reddedildi' end,
         identity_verified_at = case when p_approve then now() else null end,
         identity_rejected_reason = case when p_approve then null else p_reason end,
         -- "Güvenli üye" rozeti kimlik doğrulamasıyla veriliyor.
         is_verified = p_approve,
         verified_at = case when p_approve then now() else null end
   where id = r.user_id;
end;
$$;

revoke all on function public.admin_review_identity(bigint, boolean, text) from public;
grant execute on function public.admin_review_identity(bigint, boolean, text) to authenticated;
