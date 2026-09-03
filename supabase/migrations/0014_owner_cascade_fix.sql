-- ============================================================================
-- 0014_owner_cascade_fix.sql — Sahip kaskadını muhafızın engellemesini gider
--
-- ASIL SORUN
-- Muhafız trigger'ları owner_id'yi savunma amaçlı yeniden atıyordu
-- (new.owner_id := old.owner_id). Bu iki şeyi birden bozuyordu:
--
--   1) Yabancı anahtarın ON DELETE SET NULL işlemi de bir UPDATE olduğu için
--      muhafız onu geri alıyordu. Hesap silindiğinde service_providers.owner_id
--      silinmiş bir profile işaret etmeye devam ediyordu — sarkan referans.
--   2) Kolon "yazılmış" sayıldığı için Postgres yabancı anahtarı yeniden
--      doğruluyor ve hesap silme sırasında hata veriyordu.
--
-- 0013'te kısıtları ertelenebilir yaparak (2)'yi susturmuştuk; ama bu (1)'i
-- çözmedi, yalnızca hatayı gizledi ve veritabanında sarkan referans bıraktı.
-- Sessizce bozulmaktansa gürültülü hata iyidir, bu yüzden o değişiklik geri
-- alınıyor ve asıl sebep düzeltiliyor.
--
-- ÇÖZÜM
-- Muhafız owner_id'yi yalnızca BAŞKA BİR KULLANICIYA atanmaya karşı koruyor.
-- NULL'a çekilmesine izin veriyor: bunu yapan tek şey kaskad ve "sahipliğimi
-- bırakıyorum" işlemi; ikisi de meşru. Sahipliği bırakan kullanıcı zaten
-- RLS gereği kaydı bir daha düzenleyemiyor.
-- ============================================================================

-- SIRA ÖNEMLİ: önce muhafızlar değiştiriliyor, sonra veri onarılıyor.
-- Eski muhafız owner_id'yi NULL'a çekmeye izin vermediği için onarım UPDATE'i
-- sessizce geri alınıyor, ardından kısıtı geri eklemek sarkan satırlar
-- yüzünden başarısız oluyordu.

-- ---------------------------------------------------------------------------
-- Muhafızlar
-- ---------------------------------------------------------------------------
create or replace function public.service_providers_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() or current_user = 'service_role' or public.counter_sync_active() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status           := 'onay_bekliyor';
    new.is_verified      := false;
    new.verified_at      := null;
    new.view_count       := 0;
    new.phone_count      := 0;
    new.whatsapp_count   := 0;
    new.rating_average   := 0;
    new.rating_count     := 0;
    new.reviewed_at      := null;
    new.reviewed_by      := null;
    new.rejection_reason := null;
    new.published_at     := null;
  else
    -- Sahiplik yalnızca BAŞKASINA devredilemez. NULL'a çekilmesi serbest:
    -- bunu yapan ya kaskad ya da sahibin kaydı bırakması.
    if new.owner_id is not null and new.owner_id is distinct from old.owner_id then
      new.owner_id := old.owner_id;
    end if;

    new.is_verified      := old.is_verified;
    new.verified_at      := old.verified_at;
    new.view_count       := old.view_count;
    new.phone_count      := old.phone_count;
    new.whatsapp_count   := old.whatsapp_count;
    new.rating_average   := old.rating_average;
    new.rating_count     := old.rating_count;
    new.reviewed_at      := old.reviewed_at;
    new.reviewed_by      := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.published_at     := old.published_at;
    new.created_at       := old.created_at;

    if new.status <> old.status then
      if not (
        case old.status
          when 'yayinda'       then new.status = 'pasif'
          when 'pasif'         then new.status = 'onay_bekliyor'
          when 'taslak'        then new.status = 'onay_bekliyor'
          when 'reddedildi'    then new.status = 'taslak'
          when 'onay_bekliyor' then new.status in ('taslak', 'pasif')
          else false
        end
      ) then
        new.status := old.status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.listings_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_auto_approve boolean;
  v_duration     integer;
begin
  if public.is_admin() or current_user = 'service_role' or public.counter_sync_active() then
    return new;
  end if;

  select coalesce((value ->> 'auto_approve')::boolean, true),
         coalesce((value ->> 'default_duration_days')::integer, 60)
    into v_auto_approve, v_duration
    from public.app_settings where key = 'listing';

  v_auto_approve := coalesce(v_auto_approve, true);
  v_duration     := coalesce(v_duration, 60);

  if tg_op = 'INSERT' then
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
    -- Yalnızca gerçekten değiştiğinde geri al; gereksiz atama Postgres'in
    -- yabancı anahtarı yeniden doğrulamasına yol açıyor.
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

-- --- Sarkan referansları onar ---
update public.service_providers sp
   set owner_id = null
 where owner_id is not null
   and not exists (select 1 from public.profiles p where p.id = sp.owner_id);

-- --- 0013 geri alınıyor: kısıtlar yeniden hemen doğrulanır ---
alter table public.service_providers
  drop constraint if exists service_providers_owner_id_fkey;
alter table public.service_providers
  add constraint service_providers_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete set null;

alter table public.listings
  drop constraint if exists listings_owner_id_fkey;
alter table public.listings
  add constraint listings_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete cascade;
