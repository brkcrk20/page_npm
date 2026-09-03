-- ============================================================================
-- supabase/seed/0002_vet_features.sql
--
-- Veteriner rehberindeki filtrelenebilir özellikler.
--
-- Üç grup: kliniğin sunduğu hizmetler, tedavi ettiği hayvan türleri ve
-- olanaklar. Gruplama filtre panelinde başlık olarak kullanılıyor — 20
-- işaretleme kutusunu düz liste hâlinde göstermek okunmaz olurdu.
--
-- Idempotent: tekrar çalıştırılabilir.
-- ============================================================================

begin;

insert into public.service_features (service_type, slug, name, group_name, position) values
  -- --- Hizmetler ---
  ('veteriner', 'acil-7-24',        '7/24 Acil Servis',        'Hizmetler', 1),
  ('veteriner', 'cerrahi',          'Cerrahi Operasyon',       'Hizmetler', 2),
  ('veteriner', 'asilama',          'Aşılama',                 'Hizmetler', 3),
  ('veteriner', 'kisirlastirma',    'Kısırlaştırma',           'Hizmetler', 4),
  ('veteriner', 'dis-tedavisi',     'Diş Tedavisi',            'Hizmetler', 5),
  ('veteriner', 'laboratuvar',      'Laboratuvar / Tahlil',    'Hizmetler', 6),
  ('veteriner', 'rontgen',          'Röntgen',                 'Hizmetler', 7),
  ('veteriner', 'ultrason',         'Ultrason',                'Hizmetler', 8),
  ('veteriner', 'yatili-tedavi',    'Yatılı Tedavi',           'Hizmetler', 9),
  ('veteriner', 'evde-bakim',       'Evde Muayene',            'Hizmetler', 10),
  ('veteriner', 'mikrocip',         'Mikroçip Uygulama',       'Hizmetler', 11),
  ('veteriner', 'pet-pasaport',     'Pet Pasaport / Kimlik',   'Hizmetler', 12),
  ('veteriner', 'davranis-danismanligi', 'Davranış Danışmanlığı', 'Hizmetler', 13),

  -- --- Tedavi ettiği hayvanlar ---
  ('veteriner', 'kedi',       'Kedi',                  'Tedavi Ettiği Hayvanlar', 20),
  ('veteriner', 'kopek',      'Köpek',                 'Tedavi Ettiği Hayvanlar', 21),
  ('veteriner', 'kus',        'Kuş',                   'Tedavi Ettiği Hayvanlar', 22),
  ('veteriner', 'kemirgen',   'Kemirgen',              'Tedavi Ettiği Hayvanlar', 23),
  ('veteriner', 'surungen',   'Sürüngen',              'Tedavi Ettiği Hayvanlar', 24),
  ('veteriner', 'egzotik',    'Egzotik Hayvanlar',     'Tedavi Ettiği Hayvanlar', 25),
  ('veteriner', 'ciftlik',    'Çiftlik Hayvanları',    'Tedavi Ettiği Hayvanlar', 26),

  -- --- Olanaklar ---
  ('veteriner', 'otopark',        'Otopark',               'Olanaklar', 40),
  ('veteriner', 'kredi-karti',    'Kredi Kartı',           'Olanaklar', 41),
  ('veteriner', 'randevu',        'Randevu ile Çalışır',   'Olanaklar', 42),
  ('veteriner', 'pet-shop',       'Pet Shop Reyonu',       'Olanaklar', 43),
  ('veteriner', 'pet-taksi',      'Pet Taksi Hizmeti',     'Olanaklar', 44),
  ('veteriner', 'engelli-erisim', 'Engelli Erişimi',       'Olanaklar', 45)
on conflict (service_type, slug) do update
  set name       = excluded.name,
      group_name = excluded.group_name,
      position   = excluded.position;

commit;
