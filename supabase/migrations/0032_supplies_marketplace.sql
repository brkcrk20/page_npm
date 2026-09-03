-- ============================================================================
-- 0032_supplies_marketplace.sql — 2. el pet malzemeleri pazarı
--
-- /al-sat sayfası "satılık hayvan ilanları" demekti, yani sahiplendirme
-- sayfasının fiyatlı ikizi. İki sayfa aynı ilanları farklı süzgeçle
-- gösteriyordu ve ırk/tür filtreleri her ikisinde de aynıydı.
--
-- Artık al-sat kullanıcıların ikinci el pet EŞYALARINI alıp sattığı yer:
-- kafes, akvaryum, taşıma çantası, tasma, kuluçka makinesi. Bu, hayvan
-- ilanından farklı bir şey — yaşı, cinsiyeti, aşısı yok; durumu (sıfır /
-- az kullanılmış) ve türü var.
--
-- YENİ TABLO AÇILMIYOR
-- İlan altyapısının tamamı (fotoğraf, moderasyon, favori, mesaj, arama,
-- şehir kırılımı, öne çıkarma, RLS) malzeme ilanı için de birebir geçerli.
-- İkinci bir tablo açmak bunların hepsini yeniden yazmak olurdu. Malzeme
-- bir KATEGORİ olarak ekleniyor; alt türleri de breeds tablosunda duruyor
-- (kolon adı "breed" ama işlevi "alt tür" — güvercinde ırk, malzemede eşya
-- türü).
-- ============================================================================

alter table public.categories drop constraint if exists categories_code_check;
alter table public.categories add constraint categories_code_check
  check (code in ('Dog', 'Cat', 'Bird', 'Aquarium', 'Other', 'Pigeon', 'Supply'));

insert into public.categories (id, slug, name, code, position, seo_title, seo_description)
values (
  7, 'pet-malzemeleri', 'Pet Malzemeleri', 'Supply', 7,
  'İkinci El Pet Malzemeleri — Kafes, Akvaryum, Tasma ve Fazlası',
  'İkinci el ve sıfır pet malzemeleri: kafes, akvaryum, taşıma çantası, tasma, yatak, oyuncak ve bakım ürünleri. Şehrinize göre inceleyin, satıcıyla doğrudan görüşün.'
)
on conflict (id) do update
  set slug = excluded.slug, name = excluded.name, code = excluded.code,
      position = excluded.position, seo_title = excluded.seo_title,
      seo_description = excluded.seo_description;

-- ---------------------------------------------------------------------------
-- Eşya türleri
--
-- group_name burada da kullanılıyor: alıcı "kuş kafesi" ararken akvaryum
-- filtreleri arasında gezinmemeli.
-- ---------------------------------------------------------------------------
insert into public.breeds (category_id, slug, name, position, group_name) values
  (7, 'kus-kafesi',            'Kuş Kafesi',                  1, 'Barınak ve Kafes'),
  (7, 'guvercin-kafesi',       'Güvercin Kafesi ve Kümes',    2, 'Barınak ve Kafes'),
  (7, 'kemirgen-kafesi',       'Kemirgen Kafesi',             3, 'Barınak ve Kafes'),
  (7, 'kopek-kulubesi',        'Köpek Kulübesi',              4, 'Barınak ve Kafes'),
  (7, 'kedi-evi',              'Kedi Evi ve Yatağı',          5, 'Barınak ve Kafes'),
  (7, 'kopek-yatagi',          'Köpek Yatağı',                6, 'Barınak ve Kafes'),

  (7, 'akvaryum',              'Akvaryum',                    1, 'Akvaryum ve Teraryum'),
  (7, 'akvaryum-filtresi',     'Akvaryum Filtresi',           2, 'Akvaryum ve Teraryum'),
  (7, 'akvaryum-isitici',      'Isıtıcı ve Termometre',       3, 'Akvaryum ve Teraryum'),
  (7, 'akvaryum-aydinlatma',   'Akvaryum Aydınlatması',       4, 'Akvaryum ve Teraryum'),
  (7, 'akvaryum-dekor',        'Akvaryum Dekoru ve Kumu',     5, 'Akvaryum ve Teraryum'),
  (7, 'teraryum',              'Teraryum ve Ekipmanı',        6, 'Akvaryum ve Teraryum'),

  (7, 'tasima-cantasi',        'Taşıma Çantası ve Box',       1, 'Taşıma ve Gezdirme'),
  (7, 'tasma-kayis',           'Tasma ve Kayış',              2, 'Taşıma ve Gezdirme'),
  (7, 'agizlik',               'Ağızlık',                     3, 'Taşıma ve Gezdirme'),
  (7, 'pet-arabasi',           'Pet Arabası',                 4, 'Taşıma ve Gezdirme'),
  (7, 'oto-koltuk-ornusu',     'Oto Koltuk Örtüsü',           5, 'Taşıma ve Gezdirme'),

  (7, 'mama-kabi',             'Mama ve Su Kabı',             1, 'Besleme'),
  (7, 'otomatik-mama-kabi',    'Otomatik Mamalık / Suluk',    2, 'Besleme'),
  (7, 'yem-saklama',           'Yem Saklama Kabı',            3, 'Besleme'),
  (7, 'biberon-mama-seti',     'Yavru Biberon ve Mama Seti',  4, 'Besleme'),

  (7, 'kedi-tuvaleti',         'Kedi Tuvaleti ve Kum Kabı',   1, 'Tuvalet ve Temizlik'),
  (7, 'tirmalama-tahtasi',     'Tırmalama Tahtası',           2, 'Tuvalet ve Temizlik'),
  (7, 'cis-pedi-aparat',       'Çiş Pedi Aparatı',            3, 'Tuvalet ve Temizlik'),
  (7, 'temizlik-malzemesi',    'Temizlik ve Koku Giderici',   4, 'Tuvalet ve Temizlik'),

  (7, 'tuy-tarak-firca',       'Tarak, Fırça ve Tüy Toplayıcı', 1, 'Bakım'),
  (7, 'tirnak-makasi',         'Tırnak Makası ve Törpü',      2, 'Bakım'),
  (7, 'tiras-makinesi',        'Tıraş Makinesi',              3, 'Bakım'),
  (7, 'yikama-malzemesi',      'Yıkama ve Bakım Malzemesi',   4, 'Bakım'),

  (7, 'oyuncak',               'Oyuncak',                     1, 'Oyun ve Eğitim'),
  (7, 'kedi-tirmanma',         'Kedi Tırmanma Ünitesi',       2, 'Oyun ve Eğitim'),
  (7, 'egitim-malzemesi',      'Eğitim Malzemesi ve Klikır',  3, 'Oyun ve Eğitim'),
  (7, 'kosu-carki',            'Koşu Çarkı ve Tüneli',        4, 'Oyun ve Eğitim'),

  (7, 'kulucka-makinesi',      'Kuluçka Makinesi',            1, 'Kuş ve Güvercin'),
  (7, 'yumurta-viyol',         'Yumurta Viyolü ve Kuluçka Aparatı', 2, 'Kuş ve Güvercin'),
  (7, 'halka-numara',          'Halka ve Numaralandırma',     3, 'Kuş ve Güvercin'),
  (7, 'kus-yem-kabi',          'Kuş Yemliği ve Suluğu',       4, 'Kuş ve Güvercin'),
  (7, 'guvercin-tasima',       'Güvercin Taşıma Sepeti',      5, 'Kuş ve Güvercin'),

  (7, 'akvaryum-diger',        'Diğer Pet Malzemeleri',      99, 'Diğer')
on conflict (category_id, slug) do update
  set name = excluded.name, position = excluded.position, group_name = excluded.group_name;

comment on column public.breeds.group_name is
  'Alt tür grubu. Güvercinde ırk grubu (Taklacı, Süs...), malzemede eşya grubu (Barınak, Akvaryum...).';
