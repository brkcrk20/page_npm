-- ============================================================================
-- 0007_auth_helpers.sql — Kayıt ve giriş akışının veritabanı tarafı
--
-- İki ihtiyaç var:
--   1) Giriş kullanıcı adıyla da yapılabiliyor. Ama profiles üzerindeki RLS
--      kullanıcıya yalnızca kendi satırını gösteriyor, yani giriş yapmamış
--      biri "bu kullanıcı adının e-postası ne" sorusunu soramaz. Bunu
--      kontrollü bir RPC ile çözüyoruz — tüm tabloyu açmadan.
--   2) Kayıt formundaki alanlar (kullanıcı adı, kurumsal bilgiler)
--      auth.users.raw_user_meta_data içinde geliyor; profil trigger'ı
--      bunları da yazmalı.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Kullanıcı adı müsait mi?
--
-- Kayıt formunda anlık kontrol için. Yalnızca true/false döner, hiçbir profil
-- bilgisi sızmaz.
-- ---------------------------------------------------------------------------
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
     where username = lower(btrim(p_username))
  );
$$;

-- ---------------------------------------------------------------------------
-- Kullanıcı adından e-posta.
--
-- Supabase Auth yalnızca e-posta ile giriş kabul ediyor; kullanıcı adıyla
-- giriş için önce eşleşen e-postayı bulmamız gerekiyor.
--
-- GÜVENLİK NOTU: Bu fonksiyon e-posta adresi döndürdüğü için kötüye
-- kullanılırsa kullanıcı adı → e-posta eşlemesi toplanabilir. Bunu kabul
-- edilebilir kılan şey, aynı bilginin zaten giriş ekranından denenerek
-- öğrenilebilmesi. Yine de üretimde Supabase panelinden bu RPC'ye rate limit
-- uygulanması önerilir.
-- ---------------------------------------------------------------------------
create or replace function public.email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.email
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.username = lower(btrim(p_username))
   limit 1;
$$;

grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profil oluşturmayı kayıt formundaki tüm alanları kapsayacak şekilde genişlet.
--
-- Kullanıcı adı küçük harfe çevriliyor: profiles.username kısıtı yalnızca
-- küçük harf kabul ediyor ama kayıt formu büyük harfe izin veriyor. Çevirmezsek
-- "Ahmet123" yazan kullanıcı kısıt ihlaliyle karşılaşır.
--
-- Kurumsal hesapta company_title zorunlu (profiles_corporate_requires_title);
-- meta veride yoksa hesabı bireysele düşürüyoruz ki kayıt hiç oluşmamaktansa
-- eksik bilgiyle oluşsun ve kullanıcı profilinden tamamlayabilsin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_account_type  public.account_type;
  v_company_title text;
  v_username      text;
begin
  v_company_title := nullif(btrim(v_meta ->> 'company_title'), '');

  v_account_type := case
    when (v_meta ->> 'account_type') = 'kurumsal' and v_company_title is not null
      then 'kurumsal'::public.account_type
    else 'bireysel'::public.account_type
  end;

  v_username := nullif(lower(btrim(v_meta ->> 'username')), '');

  insert into public.profiles (
    id, full_name, username, phone, account_type,
    company_title, company_type, tax_office, tax_number,
    national_id, company_address
  )
  values (
    new.id,
    nullif(btrim(v_meta ->> 'full_name'), ''),
    v_username,
    nullif(btrim(v_meta ->> 'phone'), ''),
    v_account_type,
    case when v_account_type = 'kurumsal' then v_company_title end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'company_type'), '') end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'tax_office'), '') end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'tax_number'), '') end,
    nullif(btrim(v_meta ->> 'national_id'), ''),
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'company_address'), '') end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
