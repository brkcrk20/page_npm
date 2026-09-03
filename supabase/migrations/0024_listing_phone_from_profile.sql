-- ============================================================================
-- 0024_listing_phone_from_profile.sql — İlan telefonu profilden gelsin
--
-- SORUN
-- İlan formunda ayrı bir "İletişim Telefonu" alanı vardı ve serbestçe
-- doldurulabiliyordu. Üç sonucu vardı:
--
--   1. Kullanıcı numarasını değiştirdiğinde eski ilanlarında ulaşılamaz bir
--      numara kalıyordu. Alıcı arıyor, kimse açmıyor.
--   2. Hiç doğrulanmayan, hatta hiç girilmeyen bir alan: telefonsuz ilanlar
--      yayınlanabiliyordu.
--   3. Kendi numarası olmayan bir numara yazılabiliyordu.
--
-- ÇÖZÜM
-- Telefon tek bir yerde tutuluyor: profiles.phone. İlan satırındaki
-- contact_phone artık istemciden değil VERİTABANINDAN yazılıyor ve profil
-- değiştiğinde o kişinin bütün ilanlarına yayılıyor. Böylece ilanda görünen
-- numara her zaman kullanıcının güncel numarası.
--
-- Kolon kaldırılmıyor, türetilmiş hale getiriliyor: ilan detayının okuma yolu
-- (herkese açık listings satırı) olduğu gibi kalıyor. Alternatif, telefonu
-- public_profiles view'ına eklemekti — o da her kullanıcının numarasını,
-- ilan vermemiş olanlar dahil, toplu çekilebilir hale getirirdi.
--
-- NOT: Bu format doğrulaması, numaranın KİŞİYE AİT olduğunu kanıtlamaz.
-- Bunun tek yolu SMS doğrulaması ve bir SMS sağlayıcısı seçilmesi gerekiyor.
-- normalize edilmiş kolon o adım geldiğinde hazır olacak.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Türkiye cep telefonu normalizasyonu
--
-- Kullanıcılar numarayı beş farklı biçimde yazıyor:
--   0552 401 61 92 / +90 552 401 61 92 / 905524016192 / 5524016192 / 552-401...
-- Hepsi aynı numara. Tek bir biçimde saklamak, wa.me bağlantısı üretmeyi ve
-- ileride tekilleştirmeyi mümkün kılıyor.
--
-- Saklama biçimi: 10 hane, 5 ile başlar (5524016192).
-- ---------------------------------------------------------------------------
create or replace function public.normalize_tr_phone(p_raw text)
returns text
language plpgsql
immutable
as $$
declare
  v_digits text;
begin
  if p_raw is null or btrim(p_raw) = '' then
    return null;
  end if;

  v_digits := regexp_replace(p_raw, '\D', '', 'g');

  -- Ülke kodu ve/veya baştaki sıfır kırpılıyor.
  if length(v_digits) = 12 and left(v_digits, 2) = '90' then
    v_digits := substr(v_digits, 3);
  elsif length(v_digits) = 11 and left(v_digits, 1) = '0' then
    v_digits := substr(v_digits, 2);
  end if;

  -- Türkiye cep numaraları 10 hanedir ve 5 ile başlar.
  if length(v_digits) <> 10 or left(v_digits, 1) <> '5' then
    return null;
  end if;

  return v_digits;
end;
$$;

comment on function public.normalize_tr_phone(text) is
  'Serbest biçimli telefonu 10 haneli cep numarasına indirger; geçersizse null.';

-- ---------------------------------------------------------------------------
-- Profil telefonu: normalize et, geçersizi reddet
--
-- Doğrulama istemcide değil burada: ilan verebilmenin ön koşulu bu numara ve
-- istemci doğrulaması atlanabiliyor.
-- ---------------------------------------------------------------------------
create or replace function public.profiles_phone_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_normalized text;
begin
  if new.phone is not null and btrim(new.phone) <> '' then
    v_normalized := public.normalize_tr_phone(new.phone);

    if v_normalized is null then
      raise exception 'Geçerli bir cep telefonu numarası girin (örn. 0552 401 61 92).'
        using errcode = 'check_violation';
    end if;

    new.phone := v_normalized;
  else
    new.phone := null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_phone_guard_trigger on public.profiles;
create trigger profiles_phone_guard_trigger
  before insert or update of phone on public.profiles
  for each row execute function public.profiles_phone_guard();

-- Mevcut kayıtları da aynı biçime getir. Normalize edilemeyenler boşaltılıyor;
-- sahibi ilan vermeye çalıştığında düzeltmesi istenecek.
update public.profiles
   set phone = public.normalize_tr_phone(phone)
 where phone is not null;

-- ---------------------------------------------------------------------------
-- İlan muhafızı: telefon zorunlu ve her zaman profilden
-- ---------------------------------------------------------------------------
create or replace function public.listings_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_auto_approve boolean;
  v_duration     integer;
  v_phone        text;
begin
  if public.is_admin() or public.is_service_role() or public.counter_sync_active() then
    return new;
  end if;

  select coalesce((value ->> 'auto_approve')::boolean, true),
         coalesce((value ->> 'default_duration_days')::integer, 60)
    into v_auto_approve, v_duration
    from public.app_settings where key = 'listing';

  v_auto_approve := coalesce(v_auto_approve, true);
  v_duration     := coalesce(v_duration, 60);

  -- Telefon her durumda ilan sahibinin profilinden. İstemcinin yazdığı değer
  -- yok sayılıyor; taslakta bile, çünkü taslak yayına alınırken bu muhafız
  -- tekrar çalışmayabilir.
  select p.phone into v_phone
    from public.profiles p
   where p.id = coalesce(new.owner_id, old.owner_id);

  if tg_op = 'INSERT' then
    if v_phone is null then
      raise exception 'İlan verebilmek için önce profilinize telefon numaranızı eklemelisiniz.'
        using errcode = 'check_violation';
    end if;

    new.contact_phone    := v_phone;
    new.view_count       := 0;
    new.favorite_count   := 0;
    new.contact_count    := 0;
    new.reviewed_at      := null;
    new.reviewed_by      := null;
    new.rejection_reason := null;

    if new.status <> 'taslak' then
      new.status := case when v_auto_approve then 'yayinda'::public.listing_status
                         else 'onay_bekliyor'::public.listing_status end;
    end if;

    if new.status = 'yayinda' then
      new.published_at := now();
      new.expires_at   := now() + make_interval(days => v_duration);
    else
      new.published_at := null;
      new.expires_at   := null;
    end if;

  else
    new.contact_phone := v_phone;

    if new.id is distinct from old.id then new.id := old.id; end if;
    if new.owner_id is distinct from old.owner_id then new.owner_id := old.owner_id; end if;

    new.view_count       := old.view_count;
    new.favorite_count   := old.favorite_count;
    new.contact_count    := old.contact_count;
    new.reviewed_at      := old.reviewed_at;
    new.reviewed_by      := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.created_at       := old.created_at;

    if new.status <> old.status then
      if not (
        case old.status
          when 'taslak'        then new.status in ('onay_bekliyor', 'yayinda', 'pasif')
          when 'onay_bekliyor' then new.status in ('taslak', 'pasif')
          when 'yayinda'       then new.status in ('pasif', 'satildi', 'taslak')
          when 'pasif'         then new.status in ('yayinda', 'satildi', 'taslak')
          when 'satildi'       then new.status in ('yayinda', 'pasif', 'taslak')
          when 'suresi_doldu'  then new.status in ('yayinda', 'taslak')
          when 'reddedildi'    then new.status = 'taslak'
          else false
        end
      ) then
        new.status := old.status;
      elsif new.status = 'yayinda' then
        new.status := case when v_auto_approve then 'yayinda'::public.listing_status
                           else 'onay_bekliyor'::public.listing_status end;
      end if;
    end if;

    if new.status = 'yayinda' then
      new.published_at := coalesce(old.published_at, now());
      new.expires_at   := coalesce(old.expires_at, now() + make_interval(days => v_duration));
    else
      new.published_at := old.published_at;
      new.expires_at   := old.expires_at;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profil telefonu değişince ilanlara yay
--
-- counter_sync bayrağı açılıyor: aksi halde bu güncelleme listings_guard'a
-- takılır ve muhafız kendi yazdığını geri alırdı.
-- ---------------------------------------------------------------------------
create or replace function public.propagate_profile_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    perform set_config('app.counter_sync', 'on', true);

    update public.listings
       set contact_phone = new.phone
     where owner_id = new.id
       and contact_phone is distinct from new.phone;

    perform set_config('app.counter_sync', 'off', true);
  end if;

  return null;
end;
$$;

drop trigger if exists propagate_profile_phone_trigger on public.profiles;
create trigger propagate_profile_phone_trigger
  after update of phone on public.profiles
  for each row execute function public.propagate_profile_phone();

-- Mevcut ilanları da profildeki numaraya hizala.
do $$ begin
  perform set_config('app.counter_sync', 'on', true);
  update public.listings l
     set contact_phone = p.phone
    from public.profiles p
   where p.id = l.owner_id
     and l.contact_phone is distinct from p.phone;
  perform set_config('app.counter_sync', 'off', true);
end $$;

comment on column public.listings.contact_phone is
  'Türetilmiş kolon: ilan sahibinin profiles.phone değeri. İstemci yazamaz, profil değişince otomatik güncellenir.';
