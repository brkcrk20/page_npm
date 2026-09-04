-- ============================================================================
-- 0034_supply_two_level.sql — Malzeme filtresini iki kademeye indir
--
-- Malzemeler tek bir düz listeydi ve "Genel" grubu her hayvana uyan on bir
-- ürünü topluyordu: oto koltuk örtüsü, tırnak makası, taşıma çantası. Kedi
-- sahibi listeyi açtığında bunların arasında geziniyordu.
--
-- Filtre artık iki kademe: önce TÜR (kedi, köpek, kuş...), sonra o türe ait
-- EŞYA. Bu yüzden "Genel" küçültülüp ürünler ait oldukları hayvana
-- dağıtıldı. Gerçekten türden bağımsız olan birkaç ürün "Tüm Hayvanlar"
-- altında kaldı.
--
-- Kedi ve köpek listeleri en kalabalık olanlar: ikinci el pet eşyası
-- pazarının ağırlığı orada.
-- ============================================================================

-- SİLMEK YERİNE GÜNCELLEME
-- Bir ilan zaten bir malzeme türüne bağlı (listings_breed_id_fkey); silmek
-- o ilanı kırardı. Var olan slug'lar güncelleniyor, yenileri ekleniyor,
-- artık kullanılmayanlar pasife alınıyor — böylece mevcut ilan yerinde
-- kalıyor.
update public.breeds set is_active = false where category_id = 7;

insert into public.breeds (category_id, slug, name, position, group_name) values
  -- Köpek
  (7, 'kopek-kulubesi',      'Köpek Kulübesi',                 1, 'Köpek'),
  (7, 'kopek-yatagi',        'Köpek Yatağı ve Minderi',        2, 'Köpek'),
  (7, 'kopek-tasma',         'Tasma, Kayış ve Göğüs Tasması',  3, 'Köpek'),
  (7, 'kopek-agizlik',       'Ağızlık',                        4, 'Köpek'),
  (7, 'kopek-mama-kabi',     'Mama ve Su Kabı',                5, 'Köpek'),
  (7, 'kopek-oyuncak',       'Oyuncak',                        6, 'Köpek'),
  (7, 'kopek-egitim',        'Eğitim Malzemesi ve Klikır',     7, 'Köpek'),
  (7, 'kopek-kiyafet',       'Kıyafet ve Yağmurluk',           8, 'Köpek'),
  (7, 'kopek-tasima',        'Taşıma Çantası ve Box',          9, 'Köpek'),
  (7, 'kopek-arabasi',       'Pet Arabası',                   10, 'Köpek'),
  (7, 'kopek-oto',           'Oto Koltuk Örtüsü ve Kemeri',   11, 'Köpek'),
  (7, 'kopek-bakim',         'Tarak, Fırça ve Bakım Seti',    12, 'Köpek'),

  -- Kedi
  (7, 'kedi-evi',            'Kedi Evi ve Yatağı',             1, 'Kedi'),
  (7, 'kedi-tuvaleti',       'Kedi Tuvaleti ve Kum Kabı',      2, 'Kedi'),
  (7, 'kedi-tirmalama',      'Tırmalama Tahtası',              3, 'Kedi'),
  (7, 'kedi-tirmanma',       'Tırmanma Ünitesi',               4, 'Kedi'),
  (7, 'kedi-mama-kabi',      'Mama ve Su Kabı',                5, 'Kedi'),
  (7, 'kedi-oyuncak',        'Oyuncak',                        6, 'Kedi'),
  (7, 'kedi-tasma',          'Tasma ve Zil',                   7, 'Kedi'),
  (7, 'kedi-tasima',         'Taşıma Çantası ve Box',          8, 'Kedi'),
  (7, 'kedi-bakim',          'Tarak, Fırça ve Bakım Seti',     9, 'Kedi'),

  -- Kuş ve güvercin
  (7, 'kus-kafesi',          'Kuş Kafesi',                     1, 'Kuş ve Güvercin'),
  (7, 'guvercin-kumes',      'Güvercin Kafesi ve Kümes',       2, 'Kuş ve Güvercin'),
  (7, 'kulucka-makinesi',    'Kuluçka Makinesi',               3, 'Kuş ve Güvercin'),
  (7, 'yumurta-viyol',       'Yumurta Viyolü ve Kuluçka Aparatı', 4, 'Kuş ve Güvercin'),
  (7, 'halka-numara',        'Halka ve Numaralandırma',        5, 'Kuş ve Güvercin'),
  (7, 'kus-yemlik',          'Yemlik ve Suluk',                6, 'Kuş ve Güvercin'),
  (7, 'guvercin-tasima',     'Taşıma Sepeti',                  7, 'Kuş ve Güvercin'),
  (7, 'kus-oyuncak',         'Oyuncak ve Tünek',               8, 'Kuş ve Güvercin'),

  -- Akvaryum
  (7, 'akvaryum',            'Akvaryum',                       1, 'Akvaryum'),
  (7, 'akvaryum-filtre',     'Filtre',                         2, 'Akvaryum'),
  (7, 'akvaryum-isitici',    'Isıtıcı ve Termometre',          3, 'Akvaryum'),
  (7, 'akvaryum-aydinlatma', 'Aydınlatma',                     4, 'Akvaryum'),
  (7, 'akvaryum-hava',       'Hava Motoru ve Taşı',            5, 'Akvaryum'),
  (7, 'akvaryum-dekor',      'Dekor, Kum ve Bitki',            6, 'Akvaryum'),

  -- Kemirgen ve tavşan
  (7, 'kemirgen-kafesi',     'Kafes',                          1, 'Kemirgen ve Tavşan'),
  (7, 'kemirgen-carki',      'Koşu Çarkı ve Tünel',            2, 'Kemirgen ve Tavşan'),
  (7, 'kemirgen-yemlik',     'Yemlik, Suluk ve Yatak',         3, 'Kemirgen ve Tavşan'),
  (7, 'kemirgen-tasima',     'Taşıma Kabı',                    4, 'Kemirgen ve Tavşan'),

  -- Sürüngen
  (7, 'teraryum',            'Teraryum',                       1, 'Sürüngen'),
  (7, 'teraryum-isitma',     'Isıtma Lambası ve Termostat',    2, 'Sürüngen'),
  (7, 'teraryum-zemin',      'Zemin Malzemesi ve Dekor',       3, 'Sürüngen'),

  -- Gerçekten türden bağımsız olanlar
  (7, 'genel-yem-saklama',   'Yem Saklama Kabı',               1, 'Tüm Hayvanlar'),
  (7, 'genel-biberon',       'Yavru Biberon ve Mama Seti',     2, 'Tüm Hayvanlar'),
  (7, 'genel-temizlik',      'Temizlik ve Koku Giderici',      3, 'Tüm Hayvanlar'),
  (7, 'genel-tirnak',        'Tırnak Makası ve Törpü',         4, 'Tüm Hayvanlar'),
  (7, 'genel-tiras',         'Tıraş Makinesi',                 5, 'Tüm Hayvanlar'),
  (7, 'genel-diger',         'Diğer Pet Malzemeleri',         99, 'Tüm Hayvanlar')
on conflict (category_id, slug) do update
  set name       = excluded.name,
      position   = excluded.position,
      group_name = excluded.group_name,
      is_active  = true;

-- Pasife alınan ama hâlâ ilanı olan türler geri açılıyor: ilanın türü
-- listede görünmezse ilan menüden erişilemez hâle gelirdi.
update public.breeds b
   set is_active = true
 where b.category_id = 7
   and b.is_active = false
   and exists (select 1 from public.listings l where l.breed_id = b.id);
