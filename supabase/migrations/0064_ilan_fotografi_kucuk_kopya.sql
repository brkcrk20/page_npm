-- 0064 — İlan fotoğraflarının küçük kopyası.
--
-- Görseller barındırma sağlayıcısının iyileştiricisinden çıkarıldı (kota
-- doldu, /_next/image 402 dönüyordu ve sitedeki bütün fotoğraflar
-- kırılmıştı). İyileştirici olmadan kart, yan menü ve galeri şeridi gibi
-- küçük alanlar da tam boy dosyayı indiriyor: kategori sayfasında yedi
-- kart × ~90 KB.
--
-- Çözüm, boyutlandırmayı istek anında değil YÜKLEME anında yapmak.
-- Yüklenen her fotoğrafın 400 piksellik bir kopyası daha üretiliyor ve
-- yolu burada tutuluyor.
--
-- Yol türetilmiyor, sütunda saklanıyor. Türetseydik küçük kopyanın
-- üretilemediği (yükleme yarıda kaldı, eski kayıt) her fotoğrafta kart
-- kırık görsel gösterirdi. Sütun boşsa tam boy dosya kullanılıyor:
-- yavaş ama doğru.

begin;

alter table public.listing_photos
  add column if not exists thumb_path text;

comment on column public.listing_photos.thumb_path is
  'Kart ve şeritler için 400 piksellik kopya. Boşsa storage_path kullanılır.';

commit;
