-- 0069 — Kart fotoğrafının mobil kopyası
--
-- ÖLÇÜM
-- Ana sayfada LCP'yi belirleyen görsel 400×889 piksel ve 21,8 KB. Aynı görsel
-- telefonda 67×149 CSS pikselinde çiziliyor — yani inen verinin dörtte üçü
-- hiç kullanılmıyor. Yavaş 4G'de dosyanın inmesi 1,4 saniye sürüyor ve LCP'nin
-- büyük kısmı buradan geliyor (ölçüm: istek 348 ms'de başlıyor, 1773 ms'de
-- bitiyor).
--
-- NEDEN ÜÇÜNCÜ BİR KOPYA
-- Tek bir boyut iki ekrana birden yetmiyor: masaüstünde kart görseli retina
-- ekranda ~314 piksel istiyor, telefonda ~134. Ortada bir boyut seçmek
-- masaüstünü bulanıklaştırıyor ya da telefonu yavaşlatıyor. İki kopya + srcset
-- ile tarayıcı kendi ekranına uyanı indiriyor.
--
-- Sütun boş kalabilir: eski kayıtlarda küçük kopya yoksa kart eskisi gibi
-- 400 pikselliği kullanıyor, bozulma olmuyor.

alter table public.listing_photos
  add column if not exists thumb_sm_path text;

comment on column public.listing_photos.thumb_sm_path is
  'Kart görselinin mobil kopyası (~200 piksel). Yoksa thumb_path kullanılıyor.';
