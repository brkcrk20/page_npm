-- ============================================================================
-- 0035_counter_rpcs_bypass_guard.sql — Sayaç fonksiyonları muhafızdan geçsin
--
-- SORUN
-- İlan görüntülenme, telefon ve WhatsApp sayaçları hiç artmıyordu. RPC'ler
-- 204 dönüyor, hata vermiyor, ama değer değişmiyordu.
--
-- Sebep: listings_guard korumalı kolonları (view_count, contact_count,
-- phone_count, whatsapp_count) her güncellemede eski değerine döndürüyor.
-- Bu doğru davranış — istemcinin kendi ilanının görüntülenmesini şişirmesini
-- engelliyor. Ama sayaçları artıran fonksiyonlar da aynı yoldan geçtiği için
-- onların yazdığı da geri alınıyordu.
--
-- Aynı tuzağa daha önce mesaj sayaçlarında düşülmüş ve orada
-- app.counter_sync bayrağıyla çözülmüştü (bkz. on_new_message). Bu
-- fonksiyonlar o düzeltmeden önce yazıldığı için bayrağı kullanmıyorlardı.
--
-- Hata sessiz: RPC başarılı dönüyor, kimse fark etmiyor. Ancak sonuca
-- bakınca (görüntülenme sayısı hep 0) görülüyor.
-- ============================================================================

create or replace function public.increment_listing_view(p_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);

  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id and status = 'yayinda';

  perform set_config('app.counter_sync', 'off', true);
end;
$$;

create or replace function public.increment_listing_phone(p_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);

  update public.listings
     set phone_count   = phone_count + 1,
         contact_count = contact_count + 1
   where id = p_listing_id and status = 'yayinda';

  perform set_config('app.counter_sync', 'off', true);
end;
$$;

create or replace function public.increment_listing_whatsapp(p_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);

  update public.listings
     set whatsapp_count = whatsapp_count + 1,
         contact_count  = contact_count + 1
   where id = p_listing_id and status = 'yayinda';

  perform set_config('app.counter_sync', 'off', true);
end;
$$;

grant execute on function public.increment_listing_view(bigint)     to anon, authenticated;
grant execute on function public.increment_listing_phone(bigint)    to anon, authenticated;
grant execute on function public.increment_listing_whatsapp(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Hizmet kaydı sayaçları da aynı sorunu taşıyor olabilir
-- ---------------------------------------------------------------------------
create or replace function public.increment_service_view(p_provider_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);
  update public.service_providers
     set view_count = view_count + 1
   where id = p_provider_id and status = 'yayinda';
  perform set_config('app.counter_sync', 'off', true);
end;
$$;

create or replace function public.increment_service_phone(p_provider_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.counter_sync', 'on', true);
  update public.service_providers
     set phone_count = phone_count + 1
   where id = p_provider_id and status = 'yayinda';
  perform set_config('app.counter_sync', 'off', true);
end;
$$;

grant execute on function public.increment_service_view(bigint)  to anon, authenticated;
grant execute on function public.increment_service_phone(bigint) to anon, authenticated;
