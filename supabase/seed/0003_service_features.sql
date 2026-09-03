-- ============================================================================
-- supabase/seed/0003_service_features.sql
--
-- Veteriner dışındaki altı hizmet kategorisinin filtrelenebilir özellikleri.
-- (Veteriner katalogu 0002'de.)
--
-- Her kategorinin kendi terminolojisi var: pet otelinde "kamera takibi",
-- eğitmende "yatılı eğitim", taksîde "klimalı araç". Bunları ortak bir kolon
-- setine sığdırmak yerine katalog satırı olarak tutuyoruz; yeni özellik
-- eklemek şema göçü değil, tek satır veri.
--
-- Idempotent: tekrar çalıştırılabilir.
-- ============================================================================

begin;

insert into public.service_features (service_type, slug, name, group_name, position) values
  -- ======================= PET OTELİ =======================
  ('pet_oteli', 'kamera-takibi',    'Kamera ile Takip',        'Hizmetler', 1),
  ('pet_oteli', 'gunluk-yuruyus',   'Günlük Yürüyüş',          'Hizmetler', 2),
  ('pet_oteli', 'veteriner-destegi','Veteriner Desteği',       'Hizmetler', 3),
  ('pet_oteli', 'ozel-oda',         'Özel Oda',                'Hizmetler', 4),
  ('pet_oteli', 'bahceli',          'Bahçeli / Açık Alan',     'Hizmetler', 5),
  ('pet_oteli', 'mama-dahil',       'Mama Dahil',              'Hizmetler', 6),
  ('pet_oteli', 'yikama',           'Çıkışta Yıkama',          'Hizmetler', 7),
  ('pet_oteli', 'transfer',         'Alma / Bırakma Servisi',  'Hizmetler', 8),
  ('pet_oteli', 'kedi',       'Kedi',              'Kabul Ettiği Hayvanlar', 20),
  ('pet_oteli', 'kopek',      'Köpek',             'Kabul Ettiği Hayvanlar', 21),
  ('pet_oteli', 'kus',        'Kuş',               'Kabul Ettiği Hayvanlar', 22),
  ('pet_oteli', 'kemirgen',   'Kemirgen',          'Kabul Ettiği Hayvanlar', 23),
  ('pet_oteli', 'otopark',     'Otopark',          'Olanaklar', 40),
  ('pet_oteli', 'kredi-karti', 'Kredi Kartı',      'Olanaklar', 41),
  ('pet_oteli', 'klima',       'Klimalı',          'Olanaklar', 42),
  ('pet_oteli', '7-24-acik',   '7/24 Açık',        'Olanaklar', 43),

  -- ======================= PET KUAFÖR =======================
  ('kuafor', 'tiras',           'Tıraş / Kesim',        'Hizmetler', 1),
  ('kuafor', 'yikama',          'Yıkama',               'Hizmetler', 2),
  ('kuafor', 'tirnak-kesimi',   'Tırnak Kesimi',        'Hizmetler', 3),
  ('kuafor', 'kulak-temizligi', 'Kulak Temizliği',      'Hizmetler', 4),
  ('kuafor', 'tuy-alma',        'Ölü Tüy Alma',         'Hizmetler', 5),
  ('kuafor', 'parazit-banyosu', 'Parazit Banyosu',      'Hizmetler', 6),
  ('kuafor', 'dis-fircalama',   'Diş Fırçalama',        'Hizmetler', 7),
  ('kuafor', 'eve-servis',      'Eve Servis',           'Hizmetler', 8),
  ('kuafor', 'kedi',   'Kedi',   'Kabul Ettiği Hayvanlar', 20),
  ('kuafor', 'kopek',  'Köpek',  'Kabul Ettiği Hayvanlar', 21),
  ('kuafor', 'randevu',      'Randevu ile Çalışır', 'Olanaklar', 40),
  ('kuafor', 'kredi-karti',  'Kredi Kartı',         'Olanaklar', 41),
  ('kuafor', 'otopark',      'Otopark',             'Olanaklar', 42),

  -- ======================= PET TAKSİ =======================
  ('pet_taksi', 'sehir-ici',      'Şehir İçi',              'Hizmetler', 1),
  ('pet_taksi', 'sehirlerarasi',  'Şehirlerarası',          'Hizmetler', 2),
  ('pet_taksi', 'havalimani',     'Havalimanı Transferi',   'Hizmetler', 3),
  ('pet_taksi', 'veteriner-transfer', 'Veterinere Götürme', 'Hizmetler', 4),
  ('pet_taksi', 'acil-7-24',      '7/24 Acil',              'Hizmetler', 5),
  ('pet_taksi', 'klimali-arac',   'Klimalı Araç',           'Olanaklar', 40),
  ('pet_taksi', 'tasima-kabini',  'Taşıma Kabini Sağlanır', 'Olanaklar', 41),
  ('pet_taksi', 'refakatci',      'Refakatçi Kabul Edilir', 'Olanaklar', 42),
  ('pet_taksi', 'kredi-karti',    'Kredi Kartı',            'Olanaklar', 43),
  ('pet_taksi', 'kedi',   'Kedi',   'Taşıdığı Hayvanlar', 20),
  ('pet_taksi', 'kopek',  'Köpek',  'Taşıdığı Hayvanlar', 21),
  ('pet_taksi', 'kus',    'Kuş',    'Taşıdığı Hayvanlar', 22),
  ('pet_taksi', 'buyuk-irk', 'Büyük Irk Köpek', 'Taşıdığı Hayvanlar', 23),

  -- ======================= GEZDİRİCİ =======================
  ('gezdirici', 'birebir-yuruyus', 'Birebir Yürüyüş',     'Hizmetler', 1),
  ('gezdirici', 'grup-yuruyusu',   'Grup Yürüyüşü',       'Hizmetler', 2),
  ('gezdirici', 'gunluk-bakim',    'Gün İçi Bakım',       'Hizmetler', 3),
  ('gezdirici', 'evde-besleme',    'Evde Besleme',        'Hizmetler', 4),
  ('gezdirici', 'konum-paylasimi', 'Canlı Konum Paylaşımı','Hizmetler', 5),
  ('gezdirici', 'fotograf-raporu', 'Fotoğraflı Rapor',    'Hizmetler', 6),
  ('gezdirici', 'sigortali',   'Sigortalı Hizmet',   'Güven', 40),
  ('gezdirici', 'sertifikali', 'Sertifikalı',        'Güven', 41),
  ('gezdirici', 'referansli',  'Referans Verebilir', 'Güven', 42),
  ('gezdirici', 'kucuk-irk', 'Küçük Irk', 'Gezdirdiği Hayvanlar', 20),
  ('gezdirici', 'orta-irk',  'Orta Irk',  'Gezdirdiği Hayvanlar', 21),
  ('gezdirici', 'buyuk-irk', 'Büyük Irk', 'Gezdirdiği Hayvanlar', 22),

  -- ======================= EĞİTMEN =======================
  ('egitmen', 'temel-itaat',      'Temel İtaat',            'Hizmetler', 1),
  ('egitmen', 'tuvalet-egitimi',  'Tuvalet Eğitimi',        'Hizmetler', 2),
  ('egitmen', 'davranis-problemi','Davranış Problemleri',   'Hizmetler', 3),
  ('egitmen', 'saldirganlik',     'Saldırganlık Terapisi',  'Hizmetler', 4),
  ('egitmen', 'ayrilik-kaygisi',  'Ayrılık Kaygısı',        'Hizmetler', 5),
  ('egitmen', 'koruma-egitimi',   'Koruma Eğitimi',         'Hizmetler', 6),
  ('egitmen', 'yavru-sosyallesme','Yavru Sosyalleşme',      'Hizmetler', 7),
  ('egitmen', 'evde-ders',   'Evde Ders',       'Çalışma Biçimi', 40),
  ('egitmen', 'yatili-egitim','Yatılı Eğitim',  'Çalışma Biçimi', 41),
  ('egitmen', 'online-ders', 'Online Danışmanlık','Çalışma Biçimi', 42),
  ('egitmen', 'grup-dersi',  'Grup Dersi',      'Çalışma Biçimi', 43),
  ('egitmen', 'sertifikali', 'Sertifikalı Eğitmen', 'Güven', 60),

  -- ======================= PETSHOP =======================
  ('petshop', 'mama',        'Mama',                  'Ürünler', 1),
  ('petshop', 'kum',         'Kedi Kumu',             'Ürünler', 2),
  ('petshop', 'oyuncak',     'Oyuncak',               'Ürünler', 3),
  ('petshop', 'bakim-urunu', 'Bakım Ürünleri',        'Ürünler', 4),
  ('petshop', 'akvaryum',    'Akvaryum Malzemeleri',  'Ürünler', 5),
  ('petshop', 'kus-malzeme', 'Kuş Malzemeleri',       'Ürünler', 6),
  ('petshop', 'tasma-kayis', 'Tasma ve Kayış',        'Ürünler', 7),
  ('petshop', 'veteriner-mama','Veteriner Diyet Mama','Ürünler', 8),
  ('petshop', 'ayni-gun-teslimat', 'Aynı Gün Teslimat', 'Hizmetler', 30),
  ('petshop', 'online-siparis',    'Online Sipariş',    'Hizmetler', 31),
  ('petshop', 'kuafor-hizmeti',    'Kuaför Reyonu',     'Hizmetler', 32),
  ('petshop', 'otopark',     'Otopark',      'Olanaklar', 40),
  ('petshop', 'kredi-karti', 'Kredi Kartı',  'Olanaklar', 41)
on conflict (service_type, slug) do update
  set name       = excluded.name,
      group_name = excluded.group_name,
      position   = excluded.position;

commit;
