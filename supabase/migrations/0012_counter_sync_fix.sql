-- ============================================================================
-- 0012_counter_sync_fix.sql — Türetilmiş sayaçların muhafızlara takılmasını önle
--
-- SORUN
-- Türetilmiş sayaçlar (puan ortalaması, favori sayısı) bir trigger tarafından
-- güncelleniyor. Ama hedef tablolarda korumalı kolonları eski değerine geri
-- çeviren BEFORE UPDATE muhafızları var (listings_guard,
-- service_providers_guard). Muhafızlar SECURITY DEFINER içinden çağrıldığında
-- current_user fonksiyon sahibine eşit oluyor, is_admin() de false; sonuç
-- olarak sayaç güncellemesi sessizce geri alınıyordu.
--
-- Belirti: değerlendirme yazılıyor ama rating_average 0 kalıyordu.
--
-- ÇÖZÜM
-- Sayaç senkronizasyonu işlem-yerel bir bayrak açıyor; muhafızlar bu bayrak
-- açıkken devreye girmiyor. Bayrak yalnızca trigger gövdesi içinde ve tek
-- ifade boyunca açık kalıyor (set_config(..., true) = transaction-local),
-- dışarıdan tetiklenemiyor: istemcinin ne SQL çalıştırma ne de GUC ayarlama
-- yolu var, PostgREST yalnızca tanımlı RPC'leri açıyor.
-- ============================================================================

create or replace function public.counter_sync_active()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('app.counter_sync', true), 'off') = 'on';
$$;

-- ---------------------------------------------------------------------------
-- Puan ortalaması
-- ---------------------------------------------------------------------------
create or replace function public.sync_service_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider bigint := coalesce(new.provider_id, old.provider_id);
begin
  perform set_config('app.counter_sync', 'on', true);

  update public.service_providers p
     set rating_average = coalesce(agg.avg_rating, 0),
         rating_count   = coalesce(agg.cnt, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
        from public.service_reviews
       where provider_id = v_provider and is_published
    ) agg
   where p.id = v_provider;

  perform set_config('app.counter_sync', 'off', true);
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Favori sayacı — aynı sorun listings_guard ile de yaşanıyordu.
-- ---------------------------------------------------------------------------
create or replace function public.sync_listing_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);

  if tg_op = 'INSERT' then
    update public.listings set favorite_count = favorite_count + 1 where id = new.listing_id;
  elsif tg_op = 'DELETE' then
    update public.listings set favorite_count = greatest(favorite_count - 1, 0) where id = old.listing_id;
  end if;

  perform set_config('app.counter_sync', 'off', true);
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Muhafızlar: sayaç senkronizasyonu sırasında devre dışı
-- ---------------------------------------------------------------------------
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
    new.id               := old.id;
    new.owner_id         := old.owner_id;
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
    new.id             := old.id;
    new.owner_id       := old.owner_id;
    new.is_verified    := old.is_verified;
    new.verified_at    := old.verified_at;
    new.view_count     := old.view_count;
    new.phone_count    := old.phone_count;
    new.whatsapp_count := old.whatsapp_count;
    new.rating_average := old.rating_average;
    new.rating_count   := old.rating_count;
    new.reviewed_at    := old.reviewed_at;
    new.reviewed_by    := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.published_at   := old.published_at;
    new.created_at     := old.created_at;

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
