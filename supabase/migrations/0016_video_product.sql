-- ============================================================================
-- 0016_video_product.sql — Video doping ürünü
--
-- 0015'ten ayrı bir dosya: Postgres, ALTER TYPE ... ADD VALUE ile eklenen bir
-- enum değerinin AYNI işlem içinde kullanılmasına izin vermiyor. 'video'
-- değeri 0015'te ekleniyor, burada kullanılıyor.
--
-- Ücretlendirme kapalı olduğu için ürün pasif (is_active = false) ve fiyatı
-- sıfır. Açılırken fiyat admin panelinden belirlenecek.
-- ============================================================================

insert into public.products (
  code, kind, name, description,
  price_minor, duration_days, promotion, is_active, position
)
values (
  'video_paketi_30g',
  'doping',
  'İlan Videosu (30 gün)',
  'İlanınıza 5 adede kadar video ekleyin. Hayvanın hareket hâlindeki görüntüsü — güvercinde uçuş ve takla, köpekte yürüyüş — ilana olan ilgiyi belirgin şekilde artırıyor.',
  0, 30, 'video'::public.promotion_kind, false, 10
)
on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      duration_days = excluded.duration_days,
      promotion = excluded.promotion;
