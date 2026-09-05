-- 0056 — Arama sonucunda kesilen başlık ve açıklamaları kısalt.
--
-- Google başlığı ~60, açıklamayı ~160 karakterde kesiyor. Kesilen metin
-- cümlenin ortasında koptuğu için okunmuyor ve tıklanma oranını düşürüyor.
-- Başlık şablonu " | PetSemti" eklediğinden yönetimden girilen metnin
-- 49 karakteri aşmaması gerekiyor.
--
-- Kod tarafında da bir üst sınır var (src/lib/seo-metin.ts); orası son
-- çare olarak "…" ile kırpıyor. Elle yazılmış metnin kırpılmasındansa
-- burada tam cümle olarak kısaltılması daha iyi.

begin;

update public.page_content p
set seo_title = v.baslik
from (values
  ('akvaryum-ilanlari', 'Akvaryum İlanları — Balık, Bitki ve Canlılar'),
  ('diger-ilanlar',     'Kemirgen, Tavşan ve Sürüngen İlanları'),
  ('kedi-ilanlari',     'Kedi İlanları — Sahiplendirme ve Satılık'),
  ('kopek-ilanlari',    'Köpek İlanları — Sahiplendirme ve Satılık'),
  ('kus-ilanlari',      'Kuş İlanları — Muhabbet Kuşu, Papağan, Kanarya')
) as v(slug, baslik)
join public.categories c on c.slug = v.slug
where p.category_id = c.id;

update public.categories
set seo_title = 'Güvercin İlanları — Taklacı, Posta ve Süs'
where slug = 'guvercin-ilanlari';

update public.categories
set seo_title = 'İkinci El Pet Malzemeleri — Kafes, Tasma, Akvaryum',
    seo_description = 'İkinci el ve sıfır pet malzemeleri: kafes, akvaryum, taşıma çantası, tasma, oyuncak ve bakım ürünleri. Şehrinize göre inceleyin, satıcıyla doğrudan görüşün.'
where slug = 'pet-malzemeleri';

commit;

-- Ek düzeltmeler
--
-- 1) "İkinci El Pet Malzemeleri — Kafes, Tasma, Akvaryum" 50 karakter;
--    marka ekiyle birlikte tam bir karakter taşıyordu.
-- 2) Köpek kategorisinin açıklaması 71 karakterdi. Google 160 karaktere
--    kadar gösteriyor; kısa açıklama arama sonucunda yer kaybı demek ve
--    kullanıcıya sayfanın ne sunduğunu anlatmıyor.

begin;

update public.categories
set seo_title = 'İkinci El Pet Malzemeleri — Kafes, Tasma, Yatak'
where slug = 'pet-malzemeleri';

update public.page_content p
set seo_description = 'Türkiye genelindeki satılık ve ücretsiz sahiplendirme köpek ilanları. Irka, ile ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.'
from public.categories c
where c.id = p.category_id and c.slug = 'kopek-ilanlari';

commit;

-- Rehber yazısının SEO başlığı 62 karakterdi; soru işaretiyle biten kısmı
-- arama sonucunda kesiliyordu. Sorunun tamamı ilk cümlede zaten var.
update public.guides
set seo_title = 'İlk Kez Kedi Sahiplenenler İçin Rehber'
where slug = 'ilk-kez-kedi-sahiplenenler-icin-rehber';

update public.guides set seo_title = 'Köpeklerde Aşı Takvimi — Yavru ve Yetişkin'
where slug = 'kopeklerde-asi-takvimi';
update public.guides set seo_title = 'Kedi Kaybolduğunda Ne Yapılmalı? İlk 24 Saat'
where slug = 'kedi-kaybolunca-ne-yapilmali';
update public.guides set seo_title = 'British Shorthair Bakımı — Tüy ve Beslenme'
where slug = 'british-shorthair-bakimi';
