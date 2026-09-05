-- ============================================================================
-- 0055 — "Doğrulanmış" rozeti yalnızca kimlik doğrulamasından gelsin
--
-- SORUN
-- profiles.is_verified iki ayrı yoldan veriliyordu: kimlik doğrulaması
-- onaylandığında otomatik, bir de yönetim panelindeki "Onayla" düğmesiyle
-- elle — hiçbir kontrol yapılmadan. İkincisi, kullanıcıya "Doğrulanmış"
-- diye gösterilen yeşil tikin hiçbir şeyi doğrulamadan verilebilmesi
-- demekti. Ölçüldü: beş profilden üçünde rozet vardı ve üçünün de kimlik
-- durumu "yok" idi.
--
-- Rozet bir yetki kapısı değil, bir GÜVEN İŞARETİ; karşılığı olmayan bir
-- güven işareti, hiç işaret olmamasından kötü.
--
-- ÇÖZÜM
-- Tek kaynak: identity_status. Rozet artık ondan türetiliyor ve elle
-- değiştirilemiyor. Yönetici birini "doğrulanmış" yapmak istiyorsa kimlik
-- başvurusunu onaylıyor — yani bakıp karar verdiği bir şey oluyor.
-- ============================================================================

create or replace function public.profiles_sync_verified()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Kaynak tek: kimlik doğrulama durumu. is_verified'e yazılan her değer
  -- (yönetici dâhil) bununla değiştiriliyor.
  new.is_verified := (new.identity_status = 'dogrulandi');
  new.verified_at := case when new.is_verified then coalesce(new.identity_verified_at, now()) end;
  return new;
end;
$$;

-- Muhafızdan SONRA çalışmalı: muhafız is_verified'i eski değerine
-- döndürüyor, bu tetikleyici de doğru değeri yazıyor.
drop trigger if exists profiles_sync_verified_trigger on public.profiles;
create trigger profiles_sync_verified_trigger
  before insert or update on public.profiles
  for each row execute function public.profiles_sync_verified();

-- Mevcut satırları hizala: kimlik doğrulaması olmayanların rozeti kalkıyor.
update public.profiles
   set is_verified = (identity_status = 'dogrulandi')
 where is_verified is distinct from (identity_status = 'dogrulandi');

comment on column public.profiles.is_verified is
  'Kimlik doğrulaması tamamlanmış mı. identity_status''tan türetiliyor, elle yazılamaz.';
