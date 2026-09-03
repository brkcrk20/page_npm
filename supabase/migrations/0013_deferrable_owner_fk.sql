-- ============================================================================
-- 0013_deferrable_owner_fk.sql — Hesap silmede yabancı anahtar çakışmasını gider
--
-- SORUN
-- Bir kullanıcı hesabı silindiğinde iki basamaklı işlem aynı anda çalışıyor:
--   1) service_reviews satırları CASCADE ile siliniyor
--      → sync_service_rating trigger'ı service_providers'ı GÜNCELLİYOR
--   2) service_providers.owner_id ON DELETE SET NULL ile boşaltılıyor
--
-- Bu ikisinin sırası garanti değil. (1) önce çalışırsa güncelleme, henüz
-- boşaltılmamış owner_id üzerinden yabancı anahtarı yeniden doğrulatıyor ve
-- "profiles'ta yok" hatası veriyor. Sonuç: kullanıcı hesabı hiç silinemiyor.
--
-- Doğrulamayı tetikleyen şey muhafızın savunma amaçlı yeniden ataması
-- (new.owner_id := old.owner_id): kolon yazılmış sayıldığı için Postgres
-- kısıtı yeniden kontrol ediyor.
--
-- ÇÖZÜM
-- Kısıtı ertelenebilir yapıyoruz: doğrulama işlem sonuna kaydırılıyor, o ana
-- kadar SET NULL uygulanmış oluyor. Muhafızın atamasını kaldırmak yerine bunu
-- tercih ettik; muhafız oradaki en güçlü koruma ve sırasının doğru olmasına
-- güvenmek istemiyoruz.
-- ============================================================================

alter table public.service_providers
  drop constraint if exists service_providers_owner_id_fkey;

alter table public.service_providers
  add constraint service_providers_owner_id_fkey
  foreign key (owner_id) references public.profiles(id)
  on delete set null
  deferrable initially deferred;

-- İlanlarda da aynı desen var: listings_guard owner_id'yi yeniden atıyor ve
-- favorites CASCADE'i favorite_count güncellemesini tetikliyor.
alter table public.listings
  drop constraint if exists listings_owner_id_fkey;

alter table public.listings
  add constraint listings_owner_id_fkey
  foreign key (owner_id) references public.profiles(id)
  on delete cascade
  deferrable initially deferred;
