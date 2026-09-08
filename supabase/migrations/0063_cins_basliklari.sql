-- 0063 — Cins sayfası başlıklarına arama kelimesini ekle.
--
-- Türkiye'de bu sayfalara gelen aramanın baskın kalıbı "<cins> fiyatları":
-- kullanıcı önce fiyat aralığını öğrenmek istiyor, sonra ilana bakıyor.
-- Başlıklarımız "Toy Poodle — Satılık ve Sahiplendirme" diyordu; aranan
-- kelime başlıkta hiç geçmiyordu. Karşılaştırdığımız rakip sayfa
-- "Satılık Yavru Köpek Fiyatları - İlanları" ile tam bu kalıbı hedefliyor.
--
-- Yanıltıcı değil: sayfada fiyatlı satılık ilanlar da, ücretsiz
-- sahiplendirme ilanları da listeleniyor. Yalnızca sahiplendirme
-- ağırlıklı olanlarda (tekir, kaplumbağa) "fiyatları" kullanılmadı —
-- olmayan bir şeyi vaat etmek tıklamayı hayal kırıklığına çevirir.
--
-- Hepsi 49 karakterin altında; marka ekiyle birlikte 60 sınırına sığıyor.

begin;

update public.page_content p
set seo_title = v.baslik, updated_at = now()
from (values
  ('adana-taklacisi', 'Adana Taklacısı Fiyatları ve İlanları'),
  ('alman-kurdu', 'Alman Kurdu Fiyatları ve Satılık İlanları'),
  ('ankara-kedisi', 'Ankara Kedisi Fiyatları ve İlanları'),
  ('beta', 'Beta Balığı Fiyatları ve İlanları'),
  ('british-shorthair', 'British Shorthair Fiyatları ve İlanları'),
  ('cennet-papagani', 'Cennet Papağanı Fiyatları ve İlanları'),
  ('chihuahua', 'Chihuahua Fiyatları ve Satılık İlanları'),
  ('golden-retriever', 'Golden Retriever Fiyatları ve İlanları'),
  ('guineapig', 'Guinea Pig Fiyatları ve İlanları'),
  ('hamster', 'Hamster Fiyatları ve Sahiplendirme İlanları'),
  ('iran-kedisi', 'İran Kedisi Fiyatları ve İlanları'),
  ('japon-baligi', 'Japon Balığı Fiyatları ve İlanları'),
  ('kanarya', 'Kanarya Fiyatları ve Satılık İlanları'),
  ('kangal', 'Kangal Fiyatları ve Satılık İlanları'),
  ('kaplumbaga', 'Kaplumbağa Sahiplendirme İlanları'),
  ('labrador-retriever', 'Labrador Retriever Fiyatları ve İlanları'),
  ('lepistes', 'Lepistes Fiyatları ve İlanları'),
  ('maltese-terrier', 'Maltese Terrier Fiyatları ve İlanları'),
  ('muhabbet-kusu', 'Muhabbet Kuşu Fiyatları ve İlanları'),
  ('neon-tetra', 'Neon Tetra Fiyatları ve İlanları'),
  ('pomeranian-boo', 'Pomeranian Boo Fiyatları ve İlanları'),
  ('posta-guvercini', 'Posta Güvercini Fiyatları ve İlanları'),
  ('pug', 'Pug Fiyatları ve Satılık İlanları'),
  ('sam-guvercini', 'Şam Güvercini Fiyatları ve İlanları'),
  ('scottish-fold', 'Scottish Fold Fiyatları ve İlanları'),
  ('sibirya-kurdu-husky', 'Husky Fiyatları ve Satılık İlanları'),
  ('sultan-papagani', 'Sultan Papağanı Fiyatları ve İlanları'),
  ('sus-guvercini', 'Süs Güvercini Fiyatları ve İlanları'),
  ('tavsan', 'Tavşan Fiyatları ve Sahiplendirme İlanları'),
  ('tekir', 'Tekir Kedi Sahiplendirme İlanları'),
  ('toy-poodle', 'Toy Poodle Fiyatları ve Satılık İlanları'),
  ('van-kedisi', 'Van Kedisi Fiyatları ve İlanları')
) as v(slug, baslik)
join public.breeds b on b.slug = v.slug
where p.breed_id = b.id;

commit;
