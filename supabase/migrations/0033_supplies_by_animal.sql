-- ============================================================================
-- 0033_supplies_by_animal.sql — Malzemeleri hayvan türüne göre grupla
--
-- İlk taksonomi malzemeleri İŞLEVE göre ayırıyordu: Besleme, Bakım, Taşıma...
-- Kullanıcı böyle düşünmüyor. Kimse "besleme kategorisine bakayım" demiyor;
-- "kedime bir şey lazım" diyor. Kedi sahibi için köpek kulübesiyle kedi
-- tuvaletini aynı listede görmek gürültü.
--
-- Gruplar artık hayvan türü: Köpek, Kedi, Kuş ve Güvercin, Akvaryum,
-- Kemirgen ve Tavşan, Sürüngen. Hangi hayvana ait olduğu belirsiz ürünler
-- (taşıma çantası, tırnak makası, temizlik) "Genel" altında.
--
-- Eski türler siliniyor, yenisi kuruluyor: henüz hiçbir ilan bu kategoriye
-- bağlı değil, bu yüzden veri kaybı riski yok. İlan olsaydı eşleme tablosu
-- gerekirdi.
-- ============================================================================

delete from public.breeds where category_id = 7;

insert into public.breeds (category_id, slug, name, position, group_name) values
  -- Köpek
  (7, 'kopek-kulubesi',       'Köpek Kulübesi',                1, 'Köpek Eşyaları'),
  (7, 'kopek-yatagi',         'Köpek Yatağı ve Minderi',       2, 'Köpek Eşyaları'),
  (7, 'kopek-tasma',          'Tasma, Kayış ve Göğüs Tasması', 3, 'Köpek Eşyaları'),
  (7, 'kopek-agizlik',        'Ağızlık',                       4, 'Köpek Eşyaları'),
  (7, 'kopek-mama-kabi',      'Köpek Mama ve Su Kabı',         5, 'Köpek Eşyaları'),
  (7, 'kopek-oyuncak',        'Köpek Oyuncağı',                6, 'Köpek Eşyaları'),
  (7, 'kopek-egitim',         'Eğitim Malzemesi ve Klikır',    7, 'Köpek Eşyaları'),
  (7, 'kopek-kiyafet',        'Köpek Kıyafeti ve Yağmurluğu',  8, 'Köpek Eşyaları'),

  -- Kedi
  (7, 'kedi-evi',             'Kedi Evi ve Yatağı',            1, 'Kedi Eşyaları'),
  (7, 'kedi-tuvaleti',        'Kedi Tuvaleti ve Kum Kabı',     2, 'Kedi Eşyaları'),
  (7, 'kedi-tirmalama',       'Tırmalama Tahtası',             3, 'Kedi Eşyaları'),
  (7, 'kedi-tirmanma',        'Kedi Tırmanma Ünitesi',         4, 'Kedi Eşyaları'),
  (7, 'kedi-mama-kabi',       'Kedi Mama ve Su Kabı',          5, 'Kedi Eşyaları'),
  (7, 'kedi-oyuncak',         'Kedi Oyuncağı',                 6, 'Kedi Eşyaları'),
  (7, 'kedi-tasma',           'Kedi Tasması ve Zili',          7, 'Kedi Eşyaları'),

  -- Kuş ve güvercin
  (7, 'kus-kafesi',           'Kuş Kafesi',                    1, 'Kuş ve Güvercin'),
  (7, 'guvercin-kumes',       'Güvercin Kafesi ve Kümes',      2, 'Kuş ve Güvercin'),
  (7, 'kulucka-makinesi',     'Kuluçka Makinesi',              3, 'Kuş ve Güvercin'),
  (7, 'yumurta-viyol',        'Yumurta Viyolü ve Kuluçka Aparatı', 4, 'Kuş ve Güvercin'),
  (7, 'halka-numara',         'Halka ve Numaralandırma',       5, 'Kuş ve Güvercin'),
  (7, 'kus-yemlik',           'Kuş Yemliği ve Suluğu',         6, 'Kuş ve Güvercin'),
  (7, 'guvercin-tasima',      'Güvercin Taşıma Sepeti',        7, 'Kuş ve Güvercin'),
  (7, 'kus-oyuncak',          'Kuş Oyuncağı ve Tüneği',        8, 'Kuş ve Güvercin'),

  -- Akvaryum
  (7, 'akvaryum',             'Akvaryum',                      1, 'Akvaryum ve Balık'),
  (7, 'akvaryum-filtre',      'Akvaryum Filtresi',             2, 'Akvaryum ve Balık'),
  (7, 'akvaryum-isitici',     'Isıtıcı ve Termometre',         3, 'Akvaryum ve Balık'),
  (7, 'akvaryum-aydinlatma',  'Akvaryum Aydınlatması',         4, 'Akvaryum ve Balık'),
  (7, 'akvaryum-hava',        'Hava Motoru ve Taşı',           5, 'Akvaryum ve Balık'),
  (7, 'akvaryum-dekor',       'Akvaryum Dekoru, Kumu ve Bitkisi', 6, 'Akvaryum ve Balık'),

  -- Kemirgen ve tavşan
  (7, 'kemirgen-kafesi',      'Kemirgen ve Tavşan Kafesi',     1, 'Kemirgen ve Tavşan'),
  (7, 'kemirgen-carki',       'Koşu Çarkı ve Tüneli',          2, 'Kemirgen ve Tavşan'),
  (7, 'kemirgen-yemlik',      'Yemlik, Suluk ve Yatak',        3, 'Kemirgen ve Tavşan'),

  -- Sürüngen
  (7, 'teraryum',             'Teraryum',                      1, 'Sürüngen ve Teraryum'),
  (7, 'teraryum-isitma',      'Isıtma Lambası ve Termostat',   2, 'Sürüngen ve Teraryum'),
  (7, 'teraryum-zemin',       'Zemin Malzemesi ve Dekor',      3, 'Sürüngen ve Teraryum'),

  -- Hepsine uyan ürünler
  (7, 'tasima-cantasi',       'Taşıma Çantası ve Box',         1, 'Genel'),
  (7, 'pet-arabasi',          'Pet Arabası',                   2, 'Genel'),
  (7, 'oto-koltuk-ortusu',    'Oto Koltuk Örtüsü ve Kemeri',   3, 'Genel'),
  (7, 'bakim-tarak',          'Tarak, Fırça ve Tüy Toplayıcı', 4, 'Genel'),
  (7, 'bakim-tirnak',         'Tırnak Makası ve Törpü',        5, 'Genel'),
  (7, 'bakim-tiras',          'Tıraş Makinesi',                6, 'Genel'),
  (7, 'yikama-bakim',         'Yıkama ve Bakım Malzemesi',     7, 'Genel'),
  (7, 'temizlik-koku',        'Temizlik ve Koku Giderici',     8, 'Genel'),
  (7, 'yem-saklama',          'Yem Saklama Kabı',              9, 'Genel'),
  (7, 'biberon-seti',         'Yavru Biberon ve Mama Seti',   10, 'Genel'),
  (7, 'diger-malzeme',        'Diğer Pet Malzemeleri',        99, 'Genel');
