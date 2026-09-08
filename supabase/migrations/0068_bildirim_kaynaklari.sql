-- 0068 — Zile düşen olayları çoğalt
--
-- 0067'de zil yalnızca iki şeyden besleniyordu: yönetim duyurusu ve yeni
-- mesaj. Kullanıcının merak ettiği olayların çoğu dışarıda kalıyordu —
-- ilanı onaylandı mı, reddedildiyse neden, süresi ne zaman doluyor, kimlik
-- başvurusu ne oldu, işletmesine yorum geldi mi. Zil bunları göstermezse
-- boş bir düğme oluyor.
--
-- Hepsi aynı kalıpta: security definer bir tetikleyici, user_notifications'a
-- tek satır, dedupe_key ile tekrar koruması.

-- ---------------------------------------------------------------------------
-- İlan durumu: onaylandı / reddedildi / süresi doldu
-- ---------------------------------------------------------------------------

create or replace function public.bildirim_ilan_durumu()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_baslik text;
  v_govde  text;
  v_link   text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Kendi ilanını duraklatan/sattı olarak işaretleyen kullanıcıya bildirim
  -- göndermek gereksiz: değişikliği kendi yaptı.
  if new.status not in ('yayinda', 'reddedildi', 'suresi_doldu') then
    return new;
  end if;
  if new.status = 'yayinda' and old.status not in ('onay_bekliyor', 'reddedildi') then
    return new;
  end if;

  v_link := '/' || new.slug || '-' || new.id::text;

  if new.status = 'yayinda' then
    v_baslik := 'İlanınız yayında';
    v_govde  := '"' || new.title || '" ilanınız onaylandı ve yayına alındı.';
  elsif new.status = 'reddedildi' then
    v_baslik := 'İlanınız yayınlanmadı';
    v_govde  := '"' || new.title || '" ilanı yayınlanmadı.' ||
                coalesce(' Gerekçe: ' || nullif(btrim(new.rejection_reason), ''), '');
    v_link   := '/profil/ilanlarim';
  else
    v_baslik := 'İlanınızın süresi doldu';
    v_govde  := '"' || new.title || '" ilanının yayın süresi doldu. İlanlarım ' ||
                'sayfasından tek tıkla yenileyebilirsiniz.';
    v_link   := '/profil/ilanlarim';
  end if;

  insert into public.user_notifications (user_id, kind, level, title, body, link, dedupe_key)
  values (
    new.owner_id,
    'ilan_durumu',
    case when new.status = 'reddedildi' then 'uyari' else 'bilgi' end,
    v_baslik,
    v_govde,
    v_link,
    'ilan:' || new.id::text || ':' || new.status::text
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists listings_bildirim_durumu on public.listings;
create trigger listings_bildirim_durumu
  after update of status on public.listings
  for each row execute function public.bildirim_ilan_durumu();

-- ---------------------------------------------------------------------------
-- Kimlik doğrulama sonucu
-- ---------------------------------------------------------------------------

create or replace function public.bildirim_kimlik_sonucu()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.identity_status is not distinct from old.identity_status then
    return new;
  end if;
  if new.identity_status not in ('dogrulandi', 'reddedildi') then
    return new;
  end if;

  insert into public.user_notifications (user_id, kind, level, title, body, link, dedupe_key)
  values (
    new.id,
    'dogrulama',
    case when new.identity_status = 'reddedildi' then 'uyari' else 'bilgi' end,
    case when new.identity_status = 'dogrulandi'
         then 'Hesabınız doğrulandı'
         else 'Kimlik doğrulama başvurunuz onaylanmadı' end,
    case when new.identity_status = 'dogrulandi'
         then 'Artık ilanlarınızda onaylı üye rozeti görünüyor.'
         else coalesce(nullif(btrim(new.identity_rejected_reason), ''),
                       'Başvurunuzu güncelleyip yeniden gönderebilirsiniz.') end,
    '/profil/dogrulama',
    'kimlik:' || new.id::text || ':' || new.identity_status::text
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_bildirim_kimlik on public.profiles;
create trigger profiles_bildirim_kimlik
  after update of identity_status on public.profiles
  for each row execute function public.bildirim_kimlik_sonucu();

-- ---------------------------------------------------------------------------
-- İşletmeye yeni yorum
-- ---------------------------------------------------------------------------

create or replace function public.bildirim_isletme_yorumu()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sahip uuid;
  v_ad    text;
begin
  select p.owner_id, p.name into v_sahip, v_ad
    from public.service_providers p where p.id = new.provider_id;

  -- Sahibi olmayan (rehbere bizim eklediğimiz) kayıtta bildirilecek kimse yok.
  -- Kendi işletmesine yorum yazan kişiye de bildirim gitmiyor.
  if v_sahip is null or v_sahip = new.user_id then
    return new;
  end if;

  insert into public.user_notifications (user_id, kind, level, title, body, link, dedupe_key)
  values (
    v_sahip,
    'yorum',
    'bilgi',
    v_ad || ' için yeni değerlendirme',
    coalesce(nullif(btrim(new.comment), ''), 'İşletmeniz ' || new.rating::text || ' puan aldı.'),
    '/profil/isletmem',
    'yorum:' || new.id::text
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists service_reviews_bildirim on public.service_reviews;
create trigger service_reviews_bildirim
  after insert on public.service_reviews
  for each row execute function public.bildirim_isletme_yorumu();

-- ---------------------------------------------------------------------------
-- Süresi dolmak üzere olan ilan: e-posta işine zil de eklendi
--
-- E-posta tercihi kapalı olan kullanıcı e-posta almıyor ama zilde görüyor;
-- tercih "bana e-posta atma" demek, "beni haberdar etme" demek değil.
-- ---------------------------------------------------------------------------

create or replace function public.bildirim_ilan_suresi()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sayi integer;
begin
  insert into public.user_notifications (user_id, kind, level, title, body, link, dedupe_key)
  select
    l.owner_id,
    'ilan_durumu',
    'uyari',
    '"' || l.title || '" ilanınızın süresi doluyor',
    'Yayın süresi ' || to_char(l.expires_at, 'DD.MM.YYYY') ||
      ' tarihinde doluyor. İlanlarım sayfasından tek tıkla yenileyebilirsiniz.',
    '/profil/ilanlarim',
    'sure:' || l.id::text || ':' || to_char(l.expires_at, 'YYYYMMDD')
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.status = 'yayinda'
    and l.expires_at is not null
    and l.expires_at between now() and now() + interval '3 days'
    and not p.is_demo
  on conflict do nothing;

  insert into public.notification_outbox (kind, user_id, email, subject, body_text, dedupe_key)
  select
    'ilan_suresi',
    l.owner_id,
    u.email,
    '"' || l.title || '" ilanınızın süresi doluyor',
    'İlanınızın yayın süresi ' || to_char(l.expires_at, 'DD.MM.YYYY') ||
      ' tarihinde doluyor. İlanlarım sayfasından tek tıkla yenileyebilirsiniz.',
    'sure:' || l.id::text || ':' || to_char(l.expires_at, 'YYYYMMDD')
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  join auth.users u on u.id = l.owner_id
  where l.status = 'yayinda'
    and l.expires_at is not null
    and l.expires_at between now() and now() + interval '3 days'
    and p.email_notifications
    and not p.is_demo
    and coalesce(u.email, '') <> ''
  on conflict do nothing;

  get diagnostics v_sayi = row_count;
  if v_sayi > 0 then
    perform public.bildirim_tetikle();
  end if;
  return v_sayi;
end;
$$;

-- ---------------------------------------------------------------------------
-- Okunmamış sayısı
--
-- Zil yalnızca son on beş satırı çekiyor; rozet bunlara bakarsa on beşten
-- fazla okunmamış bildirimi olan kullanıcıda yanlış sayı gösterir.
-- ---------------------------------------------------------------------------

create or replace function public.okunmamis_bildirim_sayisi()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from public.user_notifications
   where user_id = auth.uid() and not is_read;
$$;

revoke all on function public.okunmamis_bildirim_sayisi() from public, anon;
grant execute on function public.okunmamis_bildirim_sayisi() to authenticated;
