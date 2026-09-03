-- ============================================================================
-- 0019_service_role_detection.sql — service_role tespitini güvenilir hâle getir
--
-- SORUN
-- Yetki kontrollerinde `current_user = 'service_role'` kullanılıyordu. Bu,
-- SECURITY DEFINER fonksiyonların İÇİNDE çalışmıyor: definer bağlamında
-- current_user fonksiyonun SAHİBİNE (postgres) eşit oluyor, çağıranın rolüne
-- değil.
--
-- Belirti: confirm_order_payment admin/service_role tarafından çağrılsa bile
-- "yetkiniz yok" hatası veriyordu. Yani ödeme onaylanamıyor, dolayısıyla
-- satın alınan doping/abonelik/ilan hakkı hiç verilemiyordu.
--
-- ÇÖZÜM
-- Rol bilgisi `role` GUC'undan okunuyor. PostgREST her isteği `set local role`
-- ile açtığı için bu değer çağıranın gerçek rolünü taşıyor ve SECURITY DEFINER
-- sınırını geçiyor. Test edilerek doğrulandı:
--
--   postgres      -> current_user=postgres, role GUC=none
--   service_role  -> current_user=postgres, role GUC=service_role
--   authenticated -> current_user=postgres, role GUC=authenticated
--
-- Muhafız trigger'ları SECURITY INVOKER olduğu için orada current_user doğru
-- çalışıyordu; yine de aynı yardımcıya geçiriliyorlar ki ileride biri
-- fonksiyonu DEFINER yaparsa kontrol sessizce bozulmasın.
-- ============================================================================

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('role', true), '') = 'service_role';
$$;

grant execute on function public.is_service_role() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ödeme onayı
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_public_ref  uuid,
  p_provider_ref text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item  record;
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'Bu işlem için yetkiniz yok.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_order from public.orders where public_ref = p_public_ref;
  if v_order.id is null then
    raise exception 'Sipariş bulunamadı.' using errcode = 'no_data_found';
  end if;

  -- Çift onay koruması: aynı sipariş iki kez onaylanırsa haklar iki kez
  -- verilirdi.
  if v_order.status = 'odendi' then
    return;
  end if;

  update public.orders
     set status = 'odendi', paid_at = now(), provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = v_order.id;

  insert into public.payments (order_id, provider, provider_ref, status, amount_minor, currency)
  values (v_order.id, v_order.provider, p_provider_ref, 'odendi', v_order.amount_minor, v_order.currency);

  for v_item in
    select oi.*, p.kind, p.promotion, p.duration_days, p.listing_credits
      from public.order_items oi
      join public.products p on p.id = oi.product_id
     where oi.order_id = v_order.id
  loop
    if v_item.kind = 'doping' and v_item.listing_id is not null then
      insert into public.listing_promotions (listing_id, promotion, order_id, starts_at, ends_at)
      values (
        v_item.listing_id, v_item.promotion, v_order.id, now(),
        now() + make_interval(days => coalesce(v_item.duration_days, 7) * v_item.quantity)
      );

      if v_item.promotion = 'ilan_yenileme' then
        update public.listings set published_at = now() where id = v_item.listing_id;
      end if;

    elsif v_item.kind = 'abonelik' then
      update public.subscriptions set is_active = false
       where user_id = v_order.user_id and is_active;

      insert into public.subscriptions (user_id, product_id, order_id, starts_at, ends_at)
      values (
        v_order.user_id, v_item.product_id, v_order.id, now(),
        now() + make_interval(days => coalesce(v_item.duration_days, 30) * v_item.quantity)
      );

      update public.profiles set account_type = 'kurumsal'
       where id = v_order.user_id and account_type <> 'kurumsal' and company_title is not null;

    elsif v_item.kind = 'ilan_paketi' then
      insert into public.listing_credits (user_id, order_id, delta, reason)
      values (
        v_order.user_id, v_order.id,
        coalesce(v_item.listing_credits, 0) * v_item.quantity,
        'Sipariş: ' || v_order.public_ref
      );
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Muhafızlar aynı yardımcıya geçiriliyor
-- ---------------------------------------------------------------------------
create or replace function public.service_providers_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() or public.is_service_role() or public.counter_sync_active() then
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
  if public.is_admin() or public.is_service_role() or public.counter_sync_active() then
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
