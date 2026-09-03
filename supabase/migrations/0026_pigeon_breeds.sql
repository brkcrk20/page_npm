-- ============================================================================
-- 0026_pigeon_breeds.sql — Güvercin ırkları ve ırk grupları
--
-- 0015 güvercin kategorisini 24 ırkla açmıştı. Türkiye'de güvercinciler
-- ırkları tek bir liste olarak değil, KULLANIM AMACINA göre grupluyor:
-- taklacı (uçuş/takla), oyun kuşu, posta/yarış, süs. Bir taklacı arayan
-- kişinin süs güvercinleri arasında gezinmesinin bir anlamı yok — bu, kedi
-- ve köpek ilanlarını tek listede karıştırmak gibi.
--
-- Bu yüzden breeds tablosuna group_name ekleniyor. Yalnızca güvercinde
-- doldurulacak (diğer kategorilerde ırk sayısı zaten gruplamayı gerektirmiyor)
-- ama kolon geneldir: köpek ırkları da ileride boy/kullanım gruplarına
-- ayrılmak istenirse aynı yol kullanılabilir.
--
-- Taklacılar bölgesel adlarıyla anılıyor (Adana, Mardin, Urfa taklacısı) ve
-- alıcı doğrudan bunları arıyor; tek bir "taklacı" başlığı altında toplamak
-- arama trafiğini kaybettirirdi.
-- ============================================================================

alter table public.breeds add column if not exists group_name text;

comment on column public.breeds.group_name is
  'Irk grubu (güvercinde: Taklacı, Oyun, Posta ve Yarış, Süs, Yerli). Boş olabilir.';

create index if not exists breeds_group_idx on public.breeds (category_id, group_name);

-- ---------------------------------------------------------------------------
-- Güvercin ırkları
--
-- position grup içi sıra; menüde önce ilan sayısına, sonra bu sıraya göre
-- diziliyor.
-- ---------------------------------------------------------------------------
insert into public.breeds (category_id, slug, name, position, group_name) values
  -- Taklacılar: bölgesel ırklar. Türkiye güvercinciliğinin en kalabalık dalı.
  (6, 'taklaci-guvercin',        'Taklacı Güvercin',         1,  'Taklacı'),
  (6, 'adana-taklacisi',         'Adana Taklacısı',          2,  'Taklacı'),
  (6, 'mardin-taklacisi',        'Mardin Taklacısı',         3,  'Taklacı'),
  (6, 'urfa-taklacisi',          'Urfa Taklacısı',           4,  'Taklacı'),
  (6, 'antep-taklacisi',         'Antep Taklacısı',          5,  'Taklacı'),
  (6, 'maras-taklacisi',         'Maraş Taklacısı',          6,  'Taklacı'),
  (6, 'diyarbakir-taklacisi',    'Diyarbakır Taklacısı',     7,  'Taklacı'),
  (6, 'konya-taklacisi',         'Konya Taklacısı',          8,  'Taklacı'),
  (6, 'kayseri-taklacisi',       'Kayseri Taklacısı',        9,  'Taklacı'),
  (6, 'sivas-taklacisi',         'Sivas Taklacısı',          10, 'Taklacı'),
  (6, 'malatya-taklacisi',       'Malatya Taklacısı',        11, 'Taklacı'),
  (6, 'hatay-taklacisi',         'Hatay Taklacısı',          12, 'Taklacı'),
  (6, 'van-taklacisi',           'Van Taklacısı',            13, 'Taklacı'),
  (6, 'erzurum-taklacisi',       'Erzurum Taklacısı',        14, 'Taklacı'),
  (6, 'mersin-taklacisi',        'Mersin Taklacısı',         15, 'Taklacı'),
  (6, 'bursa-taklacisi',         'Bursa Taklacısı',          16, 'Taklacı'),

  -- Oyun kuşları: uçuş biçimi ve tavırlarıyla değer görüyor.
  (6, 'dolapci-guvercin',        'Dolapçı Güvercin',         1,  'Oyun'),
  (6, 'miralay-guvercin',        'Miralay Güvercin',         2,  'Oyun'),
  (6, 'sebab-guvercin',          'Şebab Güvercin',           3,  'Oyun'),
  (6, 'bango-guvercin',          'Bango Güvercin',           4,  'Oyun'),
  (6, 'kelebek-guvercin',        'Kelebek Güvercin',         5,  'Oyun'),
  (6, 'makaraci-guvercin',       'Makaracı Güvercin',        6,  'Oyun'),
  (6, 'oynar-guvercin',          'Oynar Güvercin',           7,  'Oyun'),
  (6, 'hunkari-guvercin',        'Hünkari Güvercin',         8,  'Oyun'),
  (6, 'kuskus-guvercin',         'Kuşkuş Güvercin',          9,  'Oyun'),
  (6, 'tekir-guvercin',          'Tekir Güvercin',           10, 'Oyun'),
  (6, 'sam-guvercini',           'Şam Güvercini',            11, 'Oyun'),
  (6, 'halep-guvercini',         'Halep Güvercini',          12, 'Oyun'),
  (6, 'bagdat-guvercini',        'Bağdat Güvercini',         13, 'Oyun'),
  (6, 'misir-guvercini',         'Mısır Güvercini',          14, 'Oyun'),

  -- Posta ve yarış: mesafe uçuşu için seçilmiş hatlar.
  (6, 'posta-guvercini',         'Posta Güvercini',          1,  'Posta ve Yarış'),
  (6, 'yaris-guvercini',         'Yarış Güvercini',          2,  'Posta ve Yarış'),
  (6, 'belcika-postasi',         'Belçika Postası',          3,  'Posta ve Yarış'),
  (6, 'alman-postasi',           'Alman Postası',            4,  'Posta ve Yarış'),
  (6, 'hollanda-postasi',        'Hollanda Postası',         5,  'Posta ve Yarış'),
  (6, 'janssen-guvercini',       'Janssen Güvercini',        6,  'Posta ve Yarış'),

  -- Süs ırkları: görünüş için yetiştiriliyor.
  (6, 'sus-guvercini',           'Süs Güvercini',            1,  'Süs'),
  (6, 'pofuduk-guvercin',        'Pofuduk (Jakoben) Güvercin', 2, 'Süs'),
  (6, 'kuyruklu-guvercin',       'Kuyruklu (Tavus) Güvercin', 3, 'Süs'),
  (6, 'guatrli-guvercin',        'Guatrlı Güvercin',         4,  'Süs'),
  (6, 'modena-guvercini',        'Modena Güvercini',         5,  'Süs'),
  (6, 'king-guvercini',          'King Güvercini',           6,  'Süs'),
  (6, 'rahibe-guvercin',         'Rahibe (Nun) Güvercin',    7,  'Süs'),
  (6, 'borazan-guvercin',        'Borazan (Trumpeter) Güvercin', 8, 'Süs'),
  (6, 'kivircik-guvercin',       'Kıvırcık (Frillback) Güvercin', 9, 'Süs'),
  (6, 'arsanjel-guvercin',       'Arşanjel Güvercin',        10, 'Süs'),
  (6, 'buhara-guvercini',        'Buhara Güvercini',         11, 'Süs'),
  (6, 'lahor-guvercini',         'Lahor Güvercini',          12, 'Süs'),
  (6, 'sirazi-guvercin',         'Şirazi Güvercin',          13, 'Süs'),
  (6, 'barb-guvercini',          'Barb Güvercini',           14, 'Süs'),
  (6, 'satinet-guvercin',        'Satinet Güvercin',         15, 'Süs'),

  -- Yerli ırklar ve renk/desen adlarıyla anılanlar.
  (6, 'ankara-guvercini',        'Ankara Güvercini',         1,  'Yerli'),
  (6, 'izmir-guvercini',         'İzmir Güvercini',          2,  'Yerli'),
  (6, 'trakya-guvercini',        'Trakya Güvercini',         3,  'Yerli'),
  (6, 'karabas-guvercin',        'Karabaş Güvercin',         4,  'Yerli'),
  (6, 'beyaz-guvercin',          'Beyaz Güvercin',           5,  'Yerli'),
  (6, 'alaca-guvercin',          'Alaca Güvercin',           6,  'Yerli'),
  (6, 'sinsin-guvercin',         'Sinsin Güvercin',          7,  'Yerli'),
  (6, 'karma-guvercin',          'Karma / Melez Güvercin',   99, 'Yerli')
on conflict (category_id, slug) do update
  set name       = excluded.name,
      position   = excluded.position,
      group_name = excluded.group_name;
