-- ============================================================================
-- supabase/seed/0001_reference_data.sql
--
-- ÜRETİLMİŞ DOSYA — elle düzenlemeyin.
-- Kaynak: src/lib/turkiye-data.ts, src/lib/breeds.ts, src/lib/routing.ts
-- Yeniden üretmek için: npx tsx scripts/generate-seed.ts
--
-- Idempotent: tekrar tekrar çalıştırılabilir (on conflict do update).
-- ============================================================================

begin;

-- Kategoriler ---------------------------------------------------------------
insert into public.categories (id, slug, name, code, position) values (1, 'kopek-ilanlari', 'Köpek İlanları', 'Dog', 1)
  on conflict (id) do update set slug = excluded.slug, name = excluded.name, code = excluded.code, position = excluded.position;
insert into public.categories (id, slug, name, code, position) values (2, 'kedi-ilanlari', 'Kedi İlanları', 'Cat', 2)
  on conflict (id) do update set slug = excluded.slug, name = excluded.name, code = excluded.code, position = excluded.position;
insert into public.categories (id, slug, name, code, position) values (3, 'kus-ilanlari', 'Kuş İlanları', 'Bird', 3)
  on conflict (id) do update set slug = excluded.slug, name = excluded.name, code = excluded.code, position = excluded.position;
insert into public.categories (id, slug, name, code, position) values (4, 'akvaryum-ilanlari', 'Akvaryum İlanları', 'Aquarium', 4)
  on conflict (id) do update set slug = excluded.slug, name = excluded.name, code = excluded.code, position = excluded.position;
insert into public.categories (id, slug, name, code, position) values (5, 'diger-ilanlar', 'Diğer İlanlar', 'Other', 5)
  on conflict (id) do update set slug = excluded.slug, name = excluded.name, code = excluded.code, position = excluded.position;
select setval(pg_get_serial_sequence('public.categories','id'), 5, true)
  where pg_get_serial_sequence('public.categories','id') is not null;

-- Şehirler ------------------------------------------------------------------
insert into public.cities (id, slug, name) values (1, 'adana', 'Adana')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (2, 'adiyaman', 'Adıyaman')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (3, 'afyonkarahisar', 'Afyonkarahisar')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (4, 'agri', 'Ağrı')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (68, 'aksaray', 'Aksaray')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (5, 'amasya', 'Amasya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (6, 'ankara', 'Ankara')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (7, 'antalya', 'Antalya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (75, 'ardahan', 'Ardahan')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (8, 'artvin', 'Artvin')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (9, 'aydin', 'Aydın')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (10, 'balikesir', 'Balıkesir')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (74, 'bartin', 'Bartın')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (72, 'batman', 'Batman')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (69, 'bayburt', 'Bayburt')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (11, 'bilecik', 'Bilecik')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (12, 'bingol', 'Bingöl')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (13, 'bitlis', 'Bitlis')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (14, 'bolu', 'Bolu')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (15, 'burdur', 'Burdur')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (16, 'bursa', 'Bursa')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (17, 'canakkale', 'Çanakkale')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (18, 'cankiri', 'Çankırı')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (19, 'corum', 'Çorum')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (20, 'denizli', 'Denizli')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (21, 'diyarbakir', 'Diyarbakır')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (81, 'duzce', 'Düzce')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (22, 'edirne', 'Edirne')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (23, 'elazig', 'Elazığ')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (24, 'erzincan', 'Erzincan')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (25, 'erzurum', 'Erzurum')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (26, 'eskisehir', 'Eskişehir')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (27, 'gaziantep', 'Gaziantep')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (28, 'giresun', 'Giresun')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (29, 'gumushane', 'Gümüşhane')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (30, 'hakkari', 'Hakkari')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (31, 'hatay', 'Hatay')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (76, 'igdir', 'Iğdır')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (32, 'isparta', 'Isparta')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (34, 'istanbul', 'İstanbul')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (35, 'izmir', 'İzmir')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (46, 'kahramanmaras', 'Kahramanmaraş')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (78, 'karabuk', 'Karabük')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (70, 'karaman', 'Karaman')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (36, 'kars', 'Kars')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (37, 'kastamonu', 'Kastamonu')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (38, 'kayseri', 'Kayseri')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (71, 'kirikkale', 'Kırıkkale')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (39, 'kirklareli', 'Kırklareli')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (40, 'kirsehir', 'Kırşehir')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (79, 'kilis', 'Kilis')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (41, 'kocaeli', 'Kocaeli')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (42, 'konya', 'Konya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (43, 'kutahya', 'Kütahya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (44, 'malatya', 'Malatya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (45, 'manisa', 'Manisa')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (47, 'mardin', 'Mardin')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (33, 'mersin', 'Mersin')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (48, 'mugla', 'Muğla')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (49, 'mus', 'Muş')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (50, 'nevsehir', 'Nevşehir')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (51, 'nigde', 'Niğde')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (52, 'ordu', 'Ordu')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (80, 'osmaniye', 'Osmaniye')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (53, 'rize', 'Rize')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (54, 'sakarya', 'Sakarya')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (55, 'samsun', 'Samsun')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (56, 'siirt', 'Siirt')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (57, 'sinop', 'Sinop')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (58, 'sivas', 'Sivas')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (63, 'sanliurfa', 'Şanlıurfa')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (73, 'sirnak', 'Şırnak')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (59, 'tekirdag', 'Tekirdağ')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (60, 'tokat', 'Tokat')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (61, 'trabzon', 'Trabzon')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (62, 'tunceli', 'Tunceli')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (64, 'usak', 'Uşak')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (65, 'van', 'Van')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (77, 'yalova', 'Yalova')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (66, 'yozgat', 'Yozgat')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;
insert into public.cities (id, slug, name) values (67, 'zonguldak', 'Zonguldak')
  on conflict (id) do update set slug = excluded.slug, name = excluded.name;

-- İlçeler -------------------------------------------------------------------
insert into public.districts (city_id, slug, name) values
  (1, 'aladag', 'Aladağ'),
  (1, 'ceyhan', 'Ceyhan'),
  (1, 'cukurova', 'Çukurova'),
  (1, 'feke', 'Feke'),
  (1, 'imamoglu', 'İmamoğlu'),
  (1, 'karaisali', 'Karaisalı'),
  (1, 'karatas', 'Karataş'),
  (1, 'kozan', 'Kozan'),
  (1, 'pozanti', 'Pozantı'),
  (1, 'saimbeyli', 'Saimbeyli'),
  (1, 'saricam', 'Sarıçam'),
  (1, 'seyhan', 'Seyhan'),
  (1, 'tufanbeyli', 'Tufanbeyli'),
  (1, 'yumurtalik', 'Yumurtalık'),
  (1, 'yuregir', 'Yüreğir')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (2, 'besni', 'Besni'),
  (2, 'celikhan', 'Çelikhan'),
  (2, 'gerger', 'Gerger'),
  (2, 'golbasi', 'Gölbaşı'),
  (2, 'kahta', 'Kahta'),
  (2, 'merkez', 'Merkez'),
  (2, 'samsat', 'Samsat'),
  (2, 'sincik', 'Sincik'),
  (2, 'tut', 'Tut')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (3, 'basmakci', 'Başmakçı'),
  (3, 'bayat', 'Bayat'),
  (3, 'bolvadin', 'Bolvadin'),
  (3, 'cay', 'Çay'),
  (3, 'cobanlar', 'Çobanlar'),
  (3, 'dazkiri', 'Dazkırı'),
  (3, 'dinar', 'Dinar'),
  (3, 'emirdag', 'Emirdağ'),
  (3, 'evciler', 'Evciler'),
  (3, 'hocalar', 'Hocalar'),
  (3, 'ihsaniye', 'İhsaniye'),
  (3, 'iscehisar', 'İscehisar'),
  (3, 'kiziloren', 'Kızılören'),
  (3, 'merkez', 'Merkez'),
  (3, 'sandikli', 'Sandıklı'),
  (3, 'sinanpasa', 'Sinanpaşa'),
  (3, 'sultandagi', 'Sultandağı'),
  (3, 'suhut', 'Şuhut')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (4, 'diyadin', 'Diyadin'),
  (4, 'dogubayazit', 'Doğubayazıt'),
  (4, 'eleskirt', 'Eleşkirt'),
  (4, 'hamur', 'Hamur'),
  (4, 'merkez', 'Merkez'),
  (4, 'patnos', 'Patnos'),
  (4, 'taslicay', 'Taşlıçay'),
  (4, 'tutak', 'Tutak')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (68, 'agacoren', 'Ağaçören'),
  (68, 'eskil', 'Eskil'),
  (68, 'gulagac', 'Gülağaç'),
  (68, 'guzelyurt', 'Güzelyurt'),
  (68, 'merkez', 'Merkez'),
  (68, 'ortakoy', 'Ortaköy'),
  (68, 'sariyahsi', 'Sarıyahşi'),
  (68, 'sultanhani', 'Sultanhanı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (5, 'goynucek', 'Göynücek'),
  (5, 'gumushacikoy', 'Gümüşhacıköy'),
  (5, 'hamamozu', 'Hamamözü'),
  (5, 'merkez', 'Merkez'),
  (5, 'merzifon', 'Merzifon'),
  (5, 'suluova', 'Suluova'),
  (5, 'tasova', 'Taşova')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (6, 'akyurt', 'Akyurt'),
  (6, 'altindag', 'Altındağ'),
  (6, 'ayas', 'Ayaş'),
  (6, 'bala', 'Bala'),
  (6, 'beypazari', 'Beypazarı'),
  (6, 'camlidere', 'Çamlıdere'),
  (6, 'cankaya', 'Çankaya'),
  (6, 'cubuk', 'Çubuk'),
  (6, 'elmadag', 'Elmadağ'),
  (6, 'etimesgut', 'Etimesgut'),
  (6, 'evren', 'Evren'),
  (6, 'golbasi', 'Gölbaşı'),
  (6, 'gudul', 'Güdül'),
  (6, 'haymana', 'Haymana'),
  (6, 'kahramankazan', 'Kahramankazan'),
  (6, 'kalecik', 'Kalecik'),
  (6, 'kecioren', 'Keçiören'),
  (6, 'kizilcahamam', 'Kızılcahamam'),
  (6, 'mamak', 'Mamak'),
  (6, 'nallihan', 'Nallıhan'),
  (6, 'polatli', 'Polatlı'),
  (6, 'pursaklar', 'Pursaklar'),
  (6, 'sincan', 'Sincan'),
  (6, 'sereflikochisar', 'Şereflikoçhisar'),
  (6, 'yenimahalle', 'Yenimahalle')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (7, 'akseki', 'Akseki'),
  (7, 'aksu', 'Aksu'),
  (7, 'alanya', 'Alanya'),
  (7, 'demre', 'Demre'),
  (7, 'dosemealti', 'Döşemealtı'),
  (7, 'elmali', 'Elmalı'),
  (7, 'finike', 'Finike'),
  (7, 'gazipasa', 'Gazipaşa'),
  (7, 'gundogmus', 'Gündoğmuş'),
  (7, 'ibradi', 'İbradı'),
  (7, 'kas', 'Kaş'),
  (7, 'kemer', 'Kemer'),
  (7, 'kepez', 'Kepez'),
  (7, 'konyaalti', 'Konyaaltı'),
  (7, 'korkuteli', 'Korkuteli'),
  (7, 'kumluca', 'Kumluca'),
  (7, 'manavgat', 'Manavgat'),
  (7, 'muratpasa', 'Muratpaşa'),
  (7, 'serik', 'Serik')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (75, 'cildir', 'Çıldır'),
  (75, 'damal', 'Damal'),
  (75, 'gole', 'Göle'),
  (75, 'hanak', 'Hanak'),
  (75, 'merkez', 'Merkez'),
  (75, 'posof', 'Posof')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (8, 'ardanuc', 'Ardanuç'),
  (8, 'arhavi', 'Arhavi'),
  (8, 'borcka', 'Borçka'),
  (8, 'hopa', 'Hopa'),
  (8, 'kemalpasa', 'Kemalpaşa'),
  (8, 'merkez', 'Merkez'),
  (8, 'murgul', 'Murgul'),
  (8, 'savsat', 'Şavşat'),
  (8, 'yusufeli', 'Yusufeli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (9, 'bozdogan', 'Bozdoğan'),
  (9, 'buharkent', 'Buharkent'),
  (9, 'cine', 'Çine'),
  (9, 'didim', 'Didim'),
  (9, 'efeler', 'Efeler'),
  (9, 'germencik', 'Germencik'),
  (9, 'incirliova', 'İncirliova'),
  (9, 'karacasu', 'Karacasu'),
  (9, 'karpuzlu', 'Karpuzlu'),
  (9, 'kocarli', 'Koçarlı'),
  (9, 'kosk', 'Köşk'),
  (9, 'kusadasi', 'Kuşadası'),
  (9, 'kuyucak', 'Kuyucak'),
  (9, 'nazilli', 'Nazilli'),
  (9, 'soke', 'Söke'),
  (9, 'sultanhisar', 'Sultanhisar'),
  (9, 'yenipazar', 'Yenipazar')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (10, 'altieylul', 'Altıeylül'),
  (10, 'ayvalik', 'Ayvalık'),
  (10, 'balya', 'Balya'),
  (10, 'bandirma', 'Bandırma'),
  (10, 'bigadic', 'Bigadiç'),
  (10, 'burhaniye', 'Burhaniye'),
  (10, 'dursunbey', 'Dursunbey'),
  (10, 'edremit', 'Edremit'),
  (10, 'erdek', 'Erdek'),
  (10, 'gomec', 'Gömeç'),
  (10, 'gonen', 'Gönen'),
  (10, 'havran', 'Havran'),
  (10, 'ivrindi', 'İvrindi'),
  (10, 'karesi', 'Karesi'),
  (10, 'kepsut', 'Kepsut'),
  (10, 'manyas', 'Manyas'),
  (10, 'marmara', 'Marmara'),
  (10, 'savastepe', 'Savaştepe'),
  (10, 'sindirgi', 'Sındırgı'),
  (10, 'susurluk', 'Susurluk')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (74, 'amasra', 'Amasra'),
  (74, 'kurucasile', 'Kurucaşile'),
  (74, 'merkez', 'Merkez'),
  (74, 'ulus', 'Ulus')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (72, 'besiri', 'Beşiri'),
  (72, 'gercus', 'Gercüş'),
  (72, 'hasankeyf', 'Hasankeyf'),
  (72, 'kozluk', 'Kozluk'),
  (72, 'merkez', 'Merkez'),
  (72, 'sason', 'Sason')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (69, 'aydintepe', 'Aydıntepe'),
  (69, 'demirozu', 'Demirözü'),
  (69, 'merkez', 'Merkez')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (11, 'bozuyuk', 'Bozüyük'),
  (11, 'golpazari', 'Gölpazarı'),
  (11, 'inhisar', 'İnhisar'),
  (11, 'merkez', 'Merkez'),
  (11, 'osmaneli', 'Osmaneli'),
  (11, 'pazaryeri', 'Pazaryeri'),
  (11, 'sogut', 'Söğüt'),
  (11, 'yenipazar', 'Yenipazar')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (12, 'adakli', 'Adaklı'),
  (12, 'genc', 'Genç'),
  (12, 'karliova', 'Karlıova'),
  (12, 'kigi', 'Kiğı'),
  (12, 'merkez', 'Merkez'),
  (12, 'solhan', 'Solhan'),
  (12, 'yayladere', 'Yayladere'),
  (12, 'yedisu', 'Yedisu')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (13, 'adilcevaz', 'Adilcevaz'),
  (13, 'ahlat', 'Ahlat'),
  (13, 'guroymak', 'Güroymak'),
  (13, 'hizan', 'Hizan'),
  (13, 'merkez', 'Merkez'),
  (13, 'mutki', 'Mutki'),
  (13, 'tatvan', 'Tatvan')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (14, 'dortdivan', 'Dörtdivan'),
  (14, 'gerede', 'Gerede'),
  (14, 'goynuk', 'Göynük'),
  (14, 'kibriscik', 'Kıbrıscık'),
  (14, 'mengen', 'Mengen'),
  (14, 'merkez', 'Merkez'),
  (14, 'mudurnu', 'Mudurnu'),
  (14, 'seben', 'Seben'),
  (14, 'yenicaga', 'Yeniçağa')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (15, 'aglasun', 'Ağlasun'),
  (15, 'altinyayla', 'Altınyayla'),
  (15, 'bucak', 'Bucak'),
  (15, 'cavdir', 'Çavdır'),
  (15, 'celtikci', 'Çeltikçi'),
  (15, 'golhisar', 'Gölhisar'),
  (15, 'karamanli', 'Karamanlı'),
  (15, 'kemer', 'Kemer'),
  (15, 'merkez', 'Merkez'),
  (15, 'tefenni', 'Tefenni'),
  (15, 'yesilova', 'Yeşilova')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (16, 'buyukorhan', 'Büyükorhan'),
  (16, 'gemlik', 'Gemlik'),
  (16, 'gursu', 'Gürsu'),
  (16, 'harmancik', 'Harmancık'),
  (16, 'inegol', 'İnegöl'),
  (16, 'iznik', 'İznik'),
  (16, 'karacabey', 'Karacabey'),
  (16, 'keles', 'Keles'),
  (16, 'kestel', 'Kestel'),
  (16, 'mudanya', 'Mudanya'),
  (16, 'mustafakemalpasa', 'Mustafakemalpaşa'),
  (16, 'nilufer', 'Nilüfer'),
  (16, 'orhaneli', 'Orhaneli'),
  (16, 'orhangazi', 'Orhangazi'),
  (16, 'osmangazi', 'Osmangazi'),
  (16, 'yenisehir', 'Yenişehir'),
  (16, 'yildirim', 'Yıldırım')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (17, 'ayvacik', 'Ayvacık'),
  (17, 'bayramic', 'Bayramiç'),
  (17, 'biga', 'Biga'),
  (17, 'bozcaada', 'Bozcaada'),
  (17, 'can', 'Çan'),
  (17, 'eceabat', 'Eceabat'),
  (17, 'ezine', 'Ezine'),
  (17, 'gelibolu', 'Gelibolu'),
  (17, 'gokceada', 'Gökçeada'),
  (17, 'lapseki', 'Lapseki'),
  (17, 'merkez', 'Merkez'),
  (17, 'yenice', 'Yenice')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (18, 'atkaracalar', 'Atkaracalar'),
  (18, 'bayramoren', 'Bayramören'),
  (18, 'cerkes', 'Çerkeş'),
  (18, 'eldivan', 'Eldivan'),
  (18, 'ilgaz', 'Ilgaz'),
  (18, 'kizilirmak', 'Kızılırmak'),
  (18, 'korgun', 'Korgun'),
  (18, 'kursunlu', 'Kurşunlu'),
  (18, 'merkez', 'Merkez'),
  (18, 'orta', 'Orta'),
  (18, 'sabanozu', 'Şabanözü'),
  (18, 'yaprakli', 'Yapraklı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (19, 'alaca', 'Alaca'),
  (19, 'bayat', 'Bayat'),
  (19, 'bogazkale', 'Boğazkale'),
  (19, 'dodurga', 'Dodurga'),
  (19, 'iskilip', 'İskilip'),
  (19, 'kargi', 'Kargı'),
  (19, 'lacin', 'Laçin'),
  (19, 'mecitozu', 'Mecitözü'),
  (19, 'merkez', 'Merkez'),
  (19, 'oguzlar', 'Oğuzlar'),
  (19, 'ortakoy', 'Ortaköy'),
  (19, 'osmancik', 'Osmancık'),
  (19, 'sungurlu', 'Sungurlu'),
  (19, 'ugurludag', 'Uğurludağ')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (20, 'acipayam', 'Acıpayam'),
  (20, 'babadag', 'Babadağ'),
  (20, 'baklan', 'Baklan'),
  (20, 'bekilli', 'Bekilli'),
  (20, 'beyagac', 'Beyağaç'),
  (20, 'bozkurt', 'Bozkurt'),
  (20, 'buldan', 'Buldan'),
  (20, 'cal', 'Çal'),
  (20, 'cameli', 'Çameli'),
  (20, 'cardak', 'Çardak'),
  (20, 'civril', 'Çivril'),
  (20, 'guney', 'Güney'),
  (20, 'honaz', 'Honaz'),
  (20, 'kale', 'Kale'),
  (20, 'merkezefendi', 'Merkezefendi'),
  (20, 'pamukkale', 'Pamukkale'),
  (20, 'saraykoy', 'Sarayköy'),
  (20, 'serinhisar', 'Serinhisar'),
  (20, 'tavas', 'Tavas')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (21, 'baglar', 'Bağlar'),
  (21, 'bismil', 'Bismil'),
  (21, 'cermik', 'Çermik'),
  (21, 'cinar', 'Çınar'),
  (21, 'cungus', 'Çüngüş'),
  (21, 'dicle', 'Dicle'),
  (21, 'egil', 'Eğil'),
  (21, 'ergani', 'Ergani'),
  (21, 'hani', 'Hani'),
  (21, 'hazro', 'Hazro'),
  (21, 'kayapinar', 'Kayapınar'),
  (21, 'kocakoy', 'Kocaköy'),
  (21, 'kulp', 'Kulp'),
  (21, 'lice', 'Lice'),
  (21, 'silvan', 'Silvan'),
  (21, 'sur', 'Sur'),
  (21, 'yenisehir', 'Yenişehir')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (81, 'akcakoca', 'Akçakoca'),
  (81, 'cumayeri', 'Cumayeri'),
  (81, 'cilimli', 'Çilimli'),
  (81, 'golyaka', 'Gölyaka'),
  (81, 'gumusova', 'Gümüşova'),
  (81, 'kaynasli', 'Kaynaşlı'),
  (81, 'merkez', 'Merkez'),
  (81, 'yigilca', 'Yığılca')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (22, 'enez', 'Enez'),
  (22, 'havsa', 'Havsa'),
  (22, 'ipsala', 'İpsala'),
  (22, 'kesan', 'Keşan'),
  (22, 'lalapasa', 'Lalapaşa'),
  (22, 'meric', 'Meriç'),
  (22, 'merkez', 'Merkez'),
  (22, 'suloglu', 'Süloğlu'),
  (22, 'uzunkopru', 'Uzunköprü')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (23, 'agin', 'Ağın'),
  (23, 'alacakaya', 'Alacakaya'),
  (23, 'aricak', 'Arıcak'),
  (23, 'baskil', 'Baskil'),
  (23, 'karakocan', 'Karakoçan'),
  (23, 'keban', 'Keban'),
  (23, 'kovancilar', 'Kovancılar'),
  (23, 'maden', 'Maden'),
  (23, 'merkez', 'Merkez'),
  (23, 'palu', 'Palu'),
  (23, 'sivrice', 'Sivrice')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (24, 'cayirli', 'Çayırlı'),
  (24, 'ilic', 'İliç'),
  (24, 'kemah', 'Kemah'),
  (24, 'kemaliye', 'Kemaliye'),
  (24, 'merkez', 'Merkez'),
  (24, 'otlukbeli', 'Otlukbeli'),
  (24, 'refahiye', 'Refahiye'),
  (24, 'tercan', 'Tercan'),
  (24, 'uzumlu', 'Üzümlü')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (25, 'askale', 'Aşkale'),
  (25, 'aziziye', 'Aziziye'),
  (25, 'cat', 'Çat'),
  (25, 'hinis', 'Hınıs'),
  (25, 'horasan', 'Horasan'),
  (25, 'ispir', 'İspir'),
  (25, 'karacoban', 'Karaçoban'),
  (25, 'karayazi', 'Karayazı'),
  (25, 'koprukoy', 'Köprüköy'),
  (25, 'narman', 'Narman'),
  (25, 'oltu', 'Oltu'),
  (25, 'olur', 'Olur'),
  (25, 'palandoken', 'Palandöken'),
  (25, 'pasinler', 'Pasinler'),
  (25, 'pazaryolu', 'Pazaryolu'),
  (25, 'senkaya', 'Şenkaya'),
  (25, 'tekman', 'Tekman'),
  (25, 'tortum', 'Tortum'),
  (25, 'uzundere', 'Uzundere'),
  (25, 'yakutiye', 'Yakutiye')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (26, 'alpu', 'Alpu'),
  (26, 'beylikova', 'Beylikova'),
  (26, 'cifteler', 'Çifteler'),
  (26, 'gunyuzu', 'Günyüzü'),
  (26, 'han', 'Han'),
  (26, 'inonu', 'İnönü'),
  (26, 'mahmudiye', 'Mahmudiye'),
  (26, 'mihalgazi', 'Mihalgazi'),
  (26, 'mihaliccik', 'Mihalıççık'),
  (26, 'odunpazari', 'Odunpazarı'),
  (26, 'saricakaya', 'Sarıcakaya'),
  (26, 'seyitgazi', 'Seyitgazi'),
  (26, 'sivrihisar', 'Sivrihisar'),
  (26, 'tepebasi', 'Tepebaşı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (27, 'araban', 'Araban'),
  (27, 'islahiye', 'İslahiye'),
  (27, 'karkamis', 'Karkamış'),
  (27, 'nizip', 'Nizip'),
  (27, 'nurdagi', 'Nurdağı'),
  (27, 'oguzeli', 'Oğuzeli'),
  (27, 'sahinbey', 'Şahinbey'),
  (27, 'sehitkamil', 'Şehitkamil'),
  (27, 'yavuzeli', 'Yavuzeli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (28, 'alucra', 'Alucra'),
  (28, 'bulancak', 'Bulancak'),
  (28, 'camoluk', 'Çamoluk'),
  (28, 'canakci', 'Çanakçı'),
  (28, 'dereli', 'Dereli'),
  (28, 'dogankent', 'Doğankent'),
  (28, 'espiye', 'Espiye'),
  (28, 'eynesil', 'Eynesil'),
  (28, 'gorele', 'Görele'),
  (28, 'guce', 'Güce'),
  (28, 'kesap', 'Keşap'),
  (28, 'merkez', 'Merkez'),
  (28, 'piraziz', 'Piraziz'),
  (28, 'sebinkarahisar', 'Şebinkarahisar'),
  (28, 'tirebolu', 'Tirebolu'),
  (28, 'yaglidere', 'Yağlıdere')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (29, 'kelkit', 'Kelkit'),
  (29, 'kose', 'Köse'),
  (29, 'kurtun', 'Kürtün'),
  (29, 'merkez', 'Merkez'),
  (29, 'siran', 'Şiran'),
  (29, 'torul', 'Torul')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (30, 'cukurca', 'Çukurca'),
  (30, 'derecik', 'Derecik'),
  (30, 'merkez', 'Merkez'),
  (30, 'semdinli', 'Şemdinli'),
  (30, 'yuksekova', 'Yüksekova')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (31, 'altinozu', 'Altınözü'),
  (31, 'antakya', 'Antakya'),
  (31, 'arsuz', 'Arsuz'),
  (31, 'belen', 'Belen'),
  (31, 'defne', 'Defne'),
  (31, 'dortyol', 'Dörtyol'),
  (31, 'erzin', 'Erzin'),
  (31, 'hassa', 'Hassa'),
  (31, 'iskenderun', 'İskenderun'),
  (31, 'kirikhan', 'Kırıkhan'),
  (31, 'kumlu', 'Kumlu'),
  (31, 'payas', 'Payas'),
  (31, 'reyhanli', 'Reyhanlı'),
  (31, 'samandag', 'Samandağ'),
  (31, 'yayladagi', 'Yayladağı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (76, 'aralik', 'Aralık'),
  (76, 'karakoyunlu', 'Karakoyunlu'),
  (76, 'merkez', 'Merkez'),
  (76, 'tuzluca', 'Tuzluca')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (32, 'aksu', 'Aksu'),
  (32, 'atabey', 'Atabey'),
  (32, 'egirdir', 'Eğirdir'),
  (32, 'gelendost', 'Gelendost'),
  (32, 'gonen', 'Gönen'),
  (32, 'keciborlu', 'Keçiborlu'),
  (32, 'merkez', 'Merkez'),
  (32, 'senirkent', 'Senirkent'),
  (32, 'sutculer', 'Sütçüler'),
  (32, 'sarkikaraagac', 'Şarkikaraağaç'),
  (32, 'uluborlu', 'Uluborlu'),
  (32, 'yalvac', 'Yalvaç'),
  (32, 'yenisarbademli', 'Yenişarbademli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (34, 'adalar', 'Adalar'),
  (34, 'arnavutkoy', 'Arnavutköy'),
  (34, 'atasehir', 'Ataşehir'),
  (34, 'avcilar', 'Avcılar'),
  (34, 'bagcilar', 'Bağcılar'),
  (34, 'bahcelievler', 'Bahçelievler'),
  (34, 'bakirkoy', 'Bakırköy'),
  (34, 'basaksehir', 'Başakşehir'),
  (34, 'bayrampasa', 'Bayrampaşa'),
  (34, 'besiktas', 'Beşiktaş'),
  (34, 'beykoz', 'Beykoz'),
  (34, 'beylikduzu', 'Beylikdüzü'),
  (34, 'beyoglu', 'Beyoğlu'),
  (34, 'buyukcekmece', 'Büyükçekmece'),
  (34, 'catalca', 'Çatalca'),
  (34, 'cekmekoy', 'Çekmeköy'),
  (34, 'esenler', 'Esenler'),
  (34, 'esenyurt', 'Esenyurt'),
  (34, 'eyupsultan', 'Eyüpsultan'),
  (34, 'fatih', 'Fatih'),
  (34, 'gaziosmanpasa', 'Gaziosmanpaşa'),
  (34, 'gungoren', 'Güngören'),
  (34, 'kadikoy', 'Kadıköy'),
  (34, 'kagithane', 'Kağıthane'),
  (34, 'kartal', 'Kartal'),
  (34, 'kucukcekmece', 'Küçükçekmece'),
  (34, 'maltepe', 'Maltepe'),
  (34, 'pendik', 'Pendik'),
  (34, 'sancaktepe', 'Sancaktepe'),
  (34, 'sariyer', 'Sarıyer'),
  (34, 'silivri', 'Silivri'),
  (34, 'sultanbeyli', 'Sultanbeyli'),
  (34, 'sultangazi', 'Sultangazi'),
  (34, 'sile', 'Şile'),
  (34, 'sisli', 'Şişli'),
  (34, 'tuzla', 'Tuzla'),
  (34, 'umraniye', 'Ümraniye'),
  (34, 'uskudar', 'Üsküdar'),
  (34, 'zeytinburnu', 'Zeytinburnu')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (35, 'aliaga', 'Aliağa'),
  (35, 'balcova', 'Balçova'),
  (35, 'bayindir', 'Bayındır'),
  (35, 'bayrakli', 'Bayraklı'),
  (35, 'bergama', 'Bergama'),
  (35, 'beydag', 'Beydağ'),
  (35, 'bornova', 'Bornova'),
  (35, 'buca', 'Buca'),
  (35, 'cesme', 'Çeşme'),
  (35, 'cigli', 'Çiğli'),
  (35, 'dikili', 'Dikili'),
  (35, 'foca', 'Foça'),
  (35, 'gaziemir', 'Gaziemir'),
  (35, 'guzelbahce', 'Güzelbahçe'),
  (35, 'karabaglar', 'Karabağlar'),
  (35, 'karaburun', 'Karaburun'),
  (35, 'karsiyaka', 'Karşıyaka'),
  (35, 'kemalpasa', 'Kemalpaşa'),
  (35, 'kinik', 'Kınık'),
  (35, 'kiraz', 'Kiraz'),
  (35, 'konak', 'Konak'),
  (35, 'menderes', 'Menderes'),
  (35, 'menemen', 'Menemen'),
  (35, 'narlidere', 'Narlıdere'),
  (35, 'odemis', 'Ödemiş'),
  (35, 'seferihisar', 'Seferihisar'),
  (35, 'selcuk', 'Selçuk'),
  (35, 'tire', 'Tire'),
  (35, 'torbali', 'Torbalı'),
  (35, 'urla', 'Urla')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (46, 'afsin', 'Afşin'),
  (46, 'andirin', 'Andırın'),
  (46, 'caglayancerit', 'Çağlayancerit'),
  (46, 'dulkadiroglu', 'Dulkadiroğlu'),
  (46, 'ekinozu', 'Ekinözü'),
  (46, 'elbistan', 'Elbistan'),
  (46, 'goksun', 'Göksun'),
  (46, 'nurhak', 'Nurhak'),
  (46, 'onikisubat', 'Onikişubat'),
  (46, 'pazarcik', 'Pazarcık'),
  (46, 'turkoglu', 'Türkoğlu')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (78, 'eflani', 'Eflani'),
  (78, 'eskipazar', 'Eskipazar'),
  (78, 'merkez', 'Merkez'),
  (78, 'ovacik', 'Ovacık'),
  (78, 'safranbolu', 'Safranbolu'),
  (78, 'yenice', 'Yenice')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (70, 'ayranci', 'Ayrancı'),
  (70, 'basyayla', 'Başyayla'),
  (70, 'ermenek', 'Ermenek'),
  (70, 'kazimkarabekir', 'Kazımkarabekir'),
  (70, 'merkez', 'Merkez'),
  (70, 'sariveliler', 'Sarıveliler')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (36, 'akyaka', 'Akyaka'),
  (36, 'arpacay', 'Arpaçay'),
  (36, 'digor', 'Digor'),
  (36, 'kagizman', 'Kağızman'),
  (36, 'merkez', 'Merkez'),
  (36, 'sarikamis', 'Sarıkamış'),
  (36, 'selim', 'Selim'),
  (36, 'susuz', 'Susuz')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (37, 'abana', 'Abana'),
  (37, 'agli', 'Ağlı'),
  (37, 'arac', 'Araç'),
  (37, 'azdavay', 'Azdavay'),
  (37, 'bozkurt', 'Bozkurt'),
  (37, 'cide', 'Cide'),
  (37, 'catalzeytin', 'Çatalzeytin'),
  (37, 'daday', 'Daday'),
  (37, 'devrekani', 'Devrekani'),
  (37, 'doganyurt', 'Doğanyurt'),
  (37, 'hanonu', 'Hanönü'),
  (37, 'ihsangazi', 'İhsangazi'),
  (37, 'inebolu', 'İnebolu'),
  (37, 'kure', 'Küre'),
  (37, 'merkez', 'Merkez'),
  (37, 'pinarbasi', 'Pınarbaşı'),
  (37, 'seydiler', 'Seydiler'),
  (37, 'senpazar', 'Şenpazar'),
  (37, 'taskopru', 'Taşköprü'),
  (37, 'tosya', 'Tosya')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (38, 'akkisla', 'Akkışla'),
  (38, 'bunyan', 'Bünyan'),
  (38, 'develi', 'Develi'),
  (38, 'felahiye', 'Felahiye'),
  (38, 'hacilar', 'Hacılar'),
  (38, 'incesu', 'İncesu'),
  (38, 'kocasinan', 'Kocasinan'),
  (38, 'melikgazi', 'Melikgazi'),
  (38, 'ozvatan', 'Özvatan'),
  (38, 'pinarbasi', 'Pınarbaşı'),
  (38, 'sarioglan', 'Sarıoğlan'),
  (38, 'sariz', 'Sarız'),
  (38, 'talas', 'Talas'),
  (38, 'tomarza', 'Tomarza'),
  (38, 'yahyali', 'Yahyalı'),
  (38, 'yesilhisar', 'Yeşilhisar')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (71, 'bahsili', 'Bahşılı'),
  (71, 'baliseyh', 'Balışeyh'),
  (71, 'celebi', 'Çelebi'),
  (71, 'delice', 'Delice'),
  (71, 'karakecili', 'Karakeçili'),
  (71, 'keskin', 'Keskin'),
  (71, 'merkez', 'Merkez'),
  (71, 'sulakyurt', 'Sulakyurt'),
  (71, 'yahsihan', 'Yahşihan')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (39, 'babaeski', 'Babaeski'),
  (39, 'demirkoy', 'Demirköy'),
  (39, 'kofcaz', 'Kofçaz'),
  (39, 'luleburgaz', 'Lüleburgaz'),
  (39, 'merkez', 'Merkez'),
  (39, 'pehlivankoy', 'Pehlivanköy'),
  (39, 'pinarhisar', 'Pınarhisar'),
  (39, 'vize', 'Vize')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (40, 'akcakent', 'Akçakent'),
  (40, 'akpinar', 'Akpınar'),
  (40, 'boztepe', 'Boztepe'),
  (40, 'cicekdagi', 'Çiçekdağı'),
  (40, 'kaman', 'Kaman'),
  (40, 'merkez', 'Merkez'),
  (40, 'mucur', 'Mucur')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (79, 'elbeyli', 'Elbeyli'),
  (79, 'merkez', 'Merkez'),
  (79, 'musabeyli', 'Musabeyli'),
  (79, 'polateli', 'Polateli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (41, 'basiskele', 'Başiskele'),
  (41, 'cayirova', 'Çayırova'),
  (41, 'darica', 'Darıca'),
  (41, 'derince', 'Derince'),
  (41, 'dilovasi', 'Dilovası'),
  (41, 'gebze', 'Gebze'),
  (41, 'golcuk', 'Gölcük'),
  (41, 'izmit', 'İzmit'),
  (41, 'kandira', 'Kandıra'),
  (41, 'karamursel', 'Karamürsel'),
  (41, 'kartepe', 'Kartepe'),
  (41, 'korfez', 'Körfez')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (42, 'ahirli', 'Ahırlı'),
  (42, 'akoren', 'Akören'),
  (42, 'aksehir', 'Akşehir'),
  (42, 'altinekin', 'Altınekin'),
  (42, 'beysehir', 'Beyşehir'),
  (42, 'bozkir', 'Bozkır'),
  (42, 'cihanbeyli', 'Cihanbeyli'),
  (42, 'celtik', 'Çeltik'),
  (42, 'cumra', 'Çumra'),
  (42, 'derbent', 'Derbent'),
  (42, 'derebucak', 'Derebucak'),
  (42, 'doganhisar', 'Doğanhisar'),
  (42, 'emirgazi', 'Emirgazi'),
  (42, 'eregli', 'Ereğli'),
  (42, 'guneysinir', 'Güneysınır'),
  (42, 'hadim', 'Hadim'),
  (42, 'halkapinar', 'Halkapınar'),
  (42, 'huyuk', 'Hüyük'),
  (42, 'ilgin', 'Ilgın'),
  (42, 'kadinhani', 'Kadınhanı'),
  (42, 'karapinar', 'Karapınar'),
  (42, 'karatay', 'Karatay'),
  (42, 'kulu', 'Kulu'),
  (42, 'meram', 'Meram'),
  (42, 'sarayonu', 'Sarayönü'),
  (42, 'selcuklu', 'Selçuklu'),
  (42, 'seydisehir', 'Seydişehir'),
  (42, 'taskent', 'Taşkent'),
  (42, 'tuzlukcu', 'Tuzlukçu'),
  (42, 'yalihuyuk', 'Yalıhüyük'),
  (42, 'yunak', 'Yunak')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (43, 'altintas', 'Altıntaş'),
  (43, 'aslanapa', 'Aslanapa'),
  (43, 'cavdarhisar', 'Çavdarhisar'),
  (43, 'domanic', 'Domaniç'),
  (43, 'dumlupinar', 'Dumlupınar'),
  (43, 'emet', 'Emet'),
  (43, 'gediz', 'Gediz'),
  (43, 'hisarcik', 'Hisarcık'),
  (43, 'merkez', 'Merkez'),
  (43, 'pazarlar', 'Pazarlar'),
  (43, 'simav', 'Simav'),
  (43, 'saphane', 'Şaphane'),
  (43, 'tavsanli', 'Tavşanlı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (44, 'akcadag', 'Akçadağ'),
  (44, 'arapgir', 'Arapgir'),
  (44, 'arguvan', 'Arguvan'),
  (44, 'battalgazi', 'Battalgazi'),
  (44, 'darende', 'Darende'),
  (44, 'dogansehir', 'Doğanşehir'),
  (44, 'doganyol', 'Doğanyol'),
  (44, 'hekimhan', 'Hekimhan'),
  (44, 'kale', 'Kale'),
  (44, 'kuluncak', 'Kuluncak'),
  (44, 'puturge', 'Pütürge'),
  (44, 'yazihan', 'Yazıhan'),
  (44, 'yesilyurt', 'Yeşilyurt')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (45, 'ahmetli', 'Ahmetli'),
  (45, 'akhisar', 'Akhisar'),
  (45, 'alasehir', 'Alaşehir'),
  (45, 'demirci', 'Demirci'),
  (45, 'golmarmara', 'Gölmarmara'),
  (45, 'gordes', 'Gördes'),
  (45, 'kirkagac', 'Kırkağaç'),
  (45, 'koprubasi', 'Köprübaşı'),
  (45, 'kula', 'Kula'),
  (45, 'salihli', 'Salihli'),
  (45, 'sarigol', 'Sarıgöl'),
  (45, 'saruhanli', 'Saruhanlı'),
  (45, 'selendi', 'Selendi'),
  (45, 'soma', 'Soma'),
  (45, 'sehzadeler', 'Şehzadeler'),
  (45, 'turgutlu', 'Turgutlu'),
  (45, 'yunusemre', 'Yunusemre')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (47, 'artuklu', 'Artuklu'),
  (47, 'dargecit', 'Dargeçit'),
  (47, 'derik', 'Derik'),
  (47, 'kiziltepe', 'Kızıltepe'),
  (47, 'mazidagi', 'Mazıdağı'),
  (47, 'midyat', 'Midyat'),
  (47, 'nusaybin', 'Nusaybin'),
  (47, 'omerli', 'Ömerli'),
  (47, 'savur', 'Savur'),
  (47, 'yesilli', 'Yeşilli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (33, 'akdeniz', 'Akdeniz'),
  (33, 'anamur', 'Anamur'),
  (33, 'aydincik', 'Aydıncık'),
  (33, 'bozyazi', 'Bozyazı'),
  (33, 'camliyayla', 'Çamlıyayla'),
  (33, 'erdemli', 'Erdemli'),
  (33, 'gulnar', 'Gülnar'),
  (33, 'mezitli', 'Mezitli'),
  (33, 'mut', 'Mut'),
  (33, 'silifke', 'Silifke'),
  (33, 'tarsus', 'Tarsus'),
  (33, 'toroslar', 'Toroslar'),
  (33, 'yenisehir', 'Yenişehir')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (48, 'bodrum', 'Bodrum'),
  (48, 'dalaman', 'Dalaman'),
  (48, 'datca', 'Datça'),
  (48, 'fethiye', 'Fethiye'),
  (48, 'kavaklidere', 'Kavaklıdere'),
  (48, 'koycegiz', 'Köyceğiz'),
  (48, 'marmaris', 'Marmaris'),
  (48, 'mentese', 'Menteşe'),
  (48, 'milas', 'Milas'),
  (48, 'ortaca', 'Ortaca'),
  (48, 'seydikemer', 'Seydikemer'),
  (48, 'ula', 'Ula'),
  (48, 'yatagan', 'Yatağan')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (49, 'bulanik', 'Bulanık'),
  (49, 'haskoy', 'Hasköy'),
  (49, 'korkut', 'Korkut'),
  (49, 'malazgirt', 'Malazgirt'),
  (49, 'merkez', 'Merkez'),
  (49, 'varto', 'Varto')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (50, 'acigol', 'Acıgöl'),
  (50, 'avanos', 'Avanos'),
  (50, 'derinkuyu', 'Derinkuyu'),
  (50, 'gulsehir', 'Gülşehir'),
  (50, 'hacibektas', 'Hacıbektaş'),
  (50, 'kozakli', 'Kozaklı'),
  (50, 'merkez', 'Merkez'),
  (50, 'urgup', 'Ürgüp')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (51, 'altunhisar', 'Altunhisar'),
  (51, 'bor', 'Bor'),
  (51, 'camardi', 'Çamardı'),
  (51, 'ciftlik', 'Çiftlik'),
  (51, 'merkez', 'Merkez'),
  (51, 'ulukisla', 'Ulukışla')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (52, 'akkus', 'Akkuş'),
  (52, 'altinordu', 'Altınordu'),
  (52, 'aybasti', 'Aybastı'),
  (52, 'camas', 'Çamaş'),
  (52, 'catalpinar', 'Çatalpınar'),
  (52, 'caybasi', 'Çaybaşı'),
  (52, 'fatsa', 'Fatsa'),
  (52, 'golkoy', 'Gölköy'),
  (52, 'gulyali', 'Gülyalı'),
  (52, 'gurgentepe', 'Gürgentepe'),
  (52, 'ikizce', 'İkizce'),
  (52, 'kabaduz', 'Kabadüz'),
  (52, 'kabatas', 'Kabataş'),
  (52, 'korgan', 'Korgan'),
  (52, 'kumru', 'Kumru'),
  (52, 'mesudiye', 'Mesudiye'),
  (52, 'persembe', 'Perşembe'),
  (52, 'ulubey', 'Ulubey'),
  (52, 'unye', 'Ünye')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (80, 'bahce', 'Bahçe'),
  (80, 'duzici', 'Düziçi'),
  (80, 'hasanbeyli', 'Hasanbeyli'),
  (80, 'kadirli', 'Kadirli'),
  (80, 'merkez', 'Merkez'),
  (80, 'sumbas', 'Sumbas'),
  (80, 'toprakkale', 'Toprakkale')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (53, 'ardesen', 'Ardeşen'),
  (53, 'camlihemsin', 'Çamlıhemşin'),
  (53, 'cayeli', 'Çayeli'),
  (53, 'derepazari', 'Derepazarı'),
  (53, 'findikli', 'Fındıklı'),
  (53, 'guneysu', 'Güneysu'),
  (53, 'hemsin', 'Hemşin'),
  (53, 'ikizdere', 'İkizdere'),
  (53, 'iyidere', 'İyidere'),
  (53, 'kalkandere', 'Kalkandere'),
  (53, 'merkez', 'Merkez'),
  (53, 'pazar', 'Pazar')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (54, 'adapazari', 'Adapazarı'),
  (54, 'akyazi', 'Akyazı'),
  (54, 'arifiye', 'Arifiye'),
  (54, 'erenler', 'Erenler'),
  (54, 'ferizli', 'Ferizli'),
  (54, 'geyve', 'Geyve'),
  (54, 'hendek', 'Hendek'),
  (54, 'karapurcek', 'Karapürçek'),
  (54, 'karasu', 'Karasu'),
  (54, 'kaynarca', 'Kaynarca'),
  (54, 'kocaali', 'Kocaali'),
  (54, 'pamukova', 'Pamukova'),
  (54, 'sapanca', 'Sapanca'),
  (54, 'serdivan', 'Serdivan'),
  (54, 'sogutlu', 'Söğütlü'),
  (54, 'tarakli', 'Taraklı')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (55, '19-mayis', '19 Mayıs'),
  (55, 'alacam', 'Alaçam'),
  (55, 'asarcik', 'Asarcık'),
  (55, 'atakum', 'Atakum'),
  (55, 'ayvacik', 'Ayvacık'),
  (55, 'bafra', 'Bafra'),
  (55, 'canik', 'Canik'),
  (55, 'carsamba', 'Çarşamba'),
  (55, 'havza', 'Havza'),
  (55, 'ilkadim', 'İlkadım'),
  (55, 'kavak', 'Kavak'),
  (55, 'ladik', 'Ladik'),
  (55, 'salipazari', 'Salıpazarı'),
  (55, 'tekkekoy', 'Tekkeköy'),
  (55, 'terme', 'Terme'),
  (55, 'vezirkopru', 'Vezirköprü'),
  (55, 'yakakent', 'Yakakent')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (56, 'baykan', 'Baykan'),
  (56, 'eruh', 'Eruh'),
  (56, 'kurtalan', 'Kurtalan'),
  (56, 'merkez', 'Merkez'),
  (56, 'pervari', 'Pervari'),
  (56, 'sirvan', 'Şirvan'),
  (56, 'tillo', 'Tillo')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (57, 'ayancik', 'Ayancık'),
  (57, 'boyabat', 'Boyabat'),
  (57, 'dikmen', 'Dikmen'),
  (57, 'duragan', 'Durağan'),
  (57, 'erfelek', 'Erfelek'),
  (57, 'gerze', 'Gerze'),
  (57, 'merkez', 'Merkez'),
  (57, 'sarayduzu', 'Saraydüzü'),
  (57, 'turkeli', 'Türkeli')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (58, 'akincilar', 'Akıncılar'),
  (58, 'altinyayla', 'Altınyayla'),
  (58, 'divrigi', 'Divriği'),
  (58, 'dogansar', 'Doğanşar'),
  (58, 'gemerek', 'Gemerek'),
  (58, 'golova', 'Gölova'),
  (58, 'gurun', 'Gürün'),
  (58, 'hafik', 'Hafik'),
  (58, 'imranli', 'İmranlı'),
  (58, 'kangal', 'Kangal'),
  (58, 'koyulhisar', 'Koyulhisar'),
  (58, 'merkez', 'Merkez'),
  (58, 'susehri', 'Suşehri'),
  (58, 'sarkisla', 'Şarkışla'),
  (58, 'ulas', 'Ulaş'),
  (58, 'yildizeli', 'Yıldızeli'),
  (58, 'zara', 'Zara')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (63, 'akcakale', 'Akçakale'),
  (63, 'birecik', 'Birecik'),
  (63, 'bozova', 'Bozova'),
  (63, 'ceylanpinar', 'Ceylanpınar'),
  (63, 'eyyubiye', 'Eyyübiye'),
  (63, 'halfeti', 'Halfeti'),
  (63, 'haliliye', 'Haliliye'),
  (63, 'harran', 'Harran'),
  (63, 'hilvan', 'Hilvan'),
  (63, 'karakopru', 'Karaköprü'),
  (63, 'siverek', 'Siverek'),
  (63, 'suruc', 'Suruç'),
  (63, 'viransehir', 'Viranşehir')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (73, 'beytussebap', 'Beytüşşebap'),
  (73, 'cizre', 'Cizre'),
  (73, 'guclukonak', 'Güçlükonak'),
  (73, 'idil', 'İdil'),
  (73, 'merkez', 'Merkez'),
  (73, 'silopi', 'Silopi'),
  (73, 'uludere', 'Uludere')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (59, 'cerkezkoy', 'Çerkezköy'),
  (59, 'corlu', 'Çorlu'),
  (59, 'ergene', 'Ergene'),
  (59, 'hayrabolu', 'Hayrabolu'),
  (59, 'kapakli', 'Kapaklı'),
  (59, 'malkara', 'Malkara'),
  (59, 'marmaraereglisi', 'Marmaraereğlisi'),
  (59, 'muratli', 'Muratlı'),
  (59, 'saray', 'Saray'),
  (59, 'suleymanpasa', 'Süleymanpaşa'),
  (59, 'sarkoy', 'Şarköy')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (60, 'almus', 'Almus'),
  (60, 'artova', 'Artova'),
  (60, 'basciftlik', 'Başçiftlik'),
  (60, 'erbaa', 'Erbaa'),
  (60, 'merkez', 'Merkez'),
  (60, 'niksar', 'Niksar'),
  (60, 'pazar', 'Pazar'),
  (60, 'resadiye', 'Reşadiye'),
  (60, 'sulusaray', 'Sulusaray'),
  (60, 'turhal', 'Turhal'),
  (60, 'yesilyurt', 'Yeşilyurt'),
  (60, 'zile', 'Zile')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (61, 'akcaabat', 'Akçaabat'),
  (61, 'arakli', 'Araklı'),
  (61, 'arsin', 'Arsin'),
  (61, 'besikduzu', 'Beşikdüzü'),
  (61, 'carsibasi', 'Çarşıbaşı'),
  (61, 'caykara', 'Çaykara'),
  (61, 'dernekpazari', 'Dernekpazarı'),
  (61, 'duzkoy', 'Düzköy'),
  (61, 'hayrat', 'Hayrat'),
  (61, 'koprubasi', 'Köprübaşı'),
  (61, 'macka', 'Maçka'),
  (61, 'of', 'Of'),
  (61, 'ortahisar', 'Ortahisar'),
  (61, 'surmene', 'Sürmene'),
  (61, 'salpazari', 'Şalpazarı'),
  (61, 'tonya', 'Tonya'),
  (61, 'vakfikebir', 'Vakfıkebir'),
  (61, 'yomra', 'Yomra')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (62, 'cemisgezek', 'Çemişgezek'),
  (62, 'hozat', 'Hozat'),
  (62, 'mazgirt', 'Mazgirt'),
  (62, 'merkez', 'Merkez'),
  (62, 'nazimiye', 'Nazımiye'),
  (62, 'ovacik', 'Ovacık'),
  (62, 'pertek', 'Pertek'),
  (62, 'pulumur', 'Pülümür')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (64, 'banaz', 'Banaz'),
  (64, 'esme', 'Eşme'),
  (64, 'karahalli', 'Karahallı'),
  (64, 'merkez', 'Merkez'),
  (64, 'sivasli', 'Sivaslı'),
  (64, 'ulubey', 'Ulubey')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (65, 'bahcesaray', 'Bahçesaray'),
  (65, 'baskale', 'Başkale'),
  (65, 'caldiran', 'Çaldıran'),
  (65, 'catak', 'Çatak'),
  (65, 'edremit', 'Edremit'),
  (65, 'ercis', 'Erciş'),
  (65, 'gevas', 'Gevaş'),
  (65, 'gurpinar', 'Gürpınar'),
  (65, 'ipekyolu', 'İpekyolu'),
  (65, 'muradiye', 'Muradiye'),
  (65, 'ozalp', 'Özalp'),
  (65, 'saray', 'Saray'),
  (65, 'tusba', 'Tuşba')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (77, 'altinova', 'Altınova'),
  (77, 'armutlu', 'Armutlu'),
  (77, 'cinarcik', 'Çınarcık'),
  (77, 'ciftlikkoy', 'Çiftlikköy'),
  (77, 'merkez', 'Merkez'),
  (77, 'termal', 'Termal')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (66, 'akdagmadeni', 'Akdağmadeni'),
  (66, 'aydincik', 'Aydıncık'),
  (66, 'bogazliyan', 'Boğazlıyan'),
  (66, 'candir', 'Çandır'),
  (66, 'cayiralan', 'Çayıralan'),
  (66, 'cekerek', 'Çekerek'),
  (66, 'kadisehri', 'Kadışehri'),
  (66, 'merkez', 'Merkez'),
  (66, 'saraykent', 'Saraykent'),
  (66, 'sarikaya', 'Sarıkaya'),
  (66, 'sorgun', 'Sorgun'),
  (66, 'sefaatli', 'Şefaatli'),
  (66, 'yenifakili', 'Yenifakılı'),
  (66, 'yerkoy', 'Yerköy')
  on conflict (city_id, slug) do update set name = excluded.name;
insert into public.districts (city_id, slug, name) values
  (67, 'alapli', 'Alaplı'),
  (67, 'caycuma', 'Çaycuma'),
  (67, 'devrek', 'Devrek'),
  (67, 'eregli', 'Ereğli'),
  (67, 'gokcebey', 'Gökçebey'),
  (67, 'kilimli', 'Kilimli'),
  (67, 'kozlu', 'kozlu'),
  (67, 'merkez', 'Merkez')
  on conflict (city_id, slug) do update set name = excluded.name;

-- Cinsler -------------------------------------------------------------------
-- Köpek İlanları
insert into public.breeds (category_id, slug, name, position) values
  (1, 'golden-retriever', 'Golden Retriever', 0),
  (1, 'beagle', 'Beagle', 1),
  (1, 'french-bulldog', 'French Bulldog', 2),
  (1, 'akbas', 'Akbaş', 3),
  (1, 'akita-inu', 'Akita Inu', 4),
  (1, 'alabay-alabai', 'Alabay (Alabai)', 5),
  (1, 'alaska-kurdu', 'Alaska Kurdu', 6),
  (1, 'alman-kurdu', 'Alman Kurdu', 7),
  (1, 'american-bully', 'American Bully', 8),
  (1, 'amerikan-cocker', 'Amerikan Cocker', 9),
  (1, 'avustralya-coban-kopegi', 'Avustralya Çoban Köpeği', 10),
  (1, 'belcika-kurdu', 'Belçika Kurdu', 11),
  (1, 'bernedoodle', 'bernedoodle', 12),
  (1, 'bernese-dag-kopegi', 'Bernese Dağ Köpeği', 13),
  (1, 'bison-cuha-kopegi', 'Bişon Çuha Köpeği', 14),
  (1, 'border-collie', 'Border Collie', 15),
  (1, 'cane-corso', 'Cane Corso', 16),
  (1, 'cavalier-king-charles', 'Cavalier King Charles', 17),
  (1, 'cavapoo', 'Cavapoo', 18),
  (1, 'chihuahua', 'Chihuahua', 19),
  (1, 'cockapoo', 'Cockapoo', 20),
  (1, 'corgi', 'corgi', 21),
  (1, 'cin-aslani', 'Çin Aslanı', 22),
  (1, 'dakhund-sosis-kopek', 'Dakhund - Sosis Köpek', 23),
  (1, 'dalmacyali', 'Dalmaçyalı', 24),
  (1, 'danua-great-dane', 'Danua (Great Dane)', 25),
  (1, 'doberman', 'Doberman', 26),
  (1, 'dogo-argentino', 'Dogo Argentino', 27),
  (1, 'fransiz-mastiff', 'Fransız Mastiff', 28),
  (1, 'goldendoodle', 'Goldendoodle', 29),
  (1, 'havanese', 'Havanese', 30),
  (1, 'ingiliz-bulldog', 'İngiliz Bulldog', 31),
  (1, 'ingiliz-cocker', 'İngiliz Cocker', 32),
  (1, 'ingiliz-staffordshire', 'İngiliz Staffordshire', 33),
  (1, 'jack-russell-terrier', 'Jack Russell Terrier', 34),
  (1, 'kafkas-coban-kopegi', 'Kafkas Çoban Köpeği', 35),
  (1, 'kangal', 'Kangal', 36),
  (1, 'labradoodle', 'Labradoodle', 37),
  (1, 'labrador-retriever', 'Labrador Retriever', 38),
  (1, 'lagotto-romagnolo', 'Lagotto Romagnolo', 39),
  (1, 'maltese-terrier', 'Maltese Terrier', 40),
  (1, 'maltipoo', 'Maltipoo', 41),
  (1, 'morkie', 'Morkie', 42),
  (1, 'newfoundland-kopek', 'Newfoundland Köpek', 43),
  (1, 'pekinez', 'Pekinez', 44),
  (1, 'pincher', 'Pincher', 45),
  (1, 'pitbull', 'Pitbull', 46),
  (1, 'pomeranian-boo', 'Pomeranian Boo', 47),
  (1, 'pug', 'Pug', 48),
  (1, 'rottweiler', 'Rottweiler', 49),
  (1, 'saint-bernard', 'Saint Bernard', 50),
  (1, 'samoyed', 'Samoyed', 51),
  (1, 'schnauzer', 'Schnauzer', 52),
  (1, 'shiba-kopek', 'Shiba Köpek', 53),
  (1, 'shih-tzu', 'Shih Tzu', 54),
  (1, 'sibirya-kurdu-husky', 'Sibirya Kurdu (Husky)', 55),
  (1, 'spitz', 'Spitz', 56),
  (1, 'sus-kopegi', 'Süs Köpeği', 57),
  (1, 'tibet-mastifi', 'Tibet Mastifi', 58),
  (1, 'toy-poodle', 'Toy Poodle', 59),
  (1, 'wolfdog', 'Wolfdog', 60),
  (1, 'yorkshire-terrier', 'Yorkshire Terrier', 61)
  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;
-- Kedi İlanları
insert into public.breeds (category_id, slug, name, position) values
  (2, 'tekir', 'Tekir', 0),
  (2, 'british-shorthair', 'British Shorthair', 1),
  (2, 'scottish-fold', 'Scottish Fold', 2),
  (2, 'siyam', 'Siyam', 3),
  (2, 'van-kedisi', 'Van Kedisi', 4),
  (2, 'ankara-kedisi', 'Ankara Kedisi', 5),
  (2, 'british-longhair', 'British Longhair', 6),
  (2, 'chinchilla', 'Chinchilla', 7),
  (2, 'exotic-shorthair', 'Exotic Shorthair', 8),
  (2, 'iran-kedisi', 'İran Kedisi', 9),
  (2, 'maine-coon', 'Maine Coon', 10),
  (2, 'munchkin-kedisi', 'Munchkin Kedisi', 11),
  (2, 'ragdoll-kedisi', 'Ragdoll Kedisi', 12),
  (2, 'sarman-kedi', 'Sarman Kedi', 13),
  (2, 'scottish-fold-longhair', 'Scottish Fold Longhair', 14),
  (2, 'scottish-straight', 'Scottish Straight', 15),
  (2, 'sfenks-kedisi', 'Sfenks Kedisi', 16)
  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;
-- Kuş İlanları
insert into public.breeds (category_id, slug, name, position) values
  (3, 'muhabbet-kusu', 'Muhabbet Kuşu', 0),
  (3, 'sultan-papagani', 'Sultan Papağanı', 1),
  (3, 'cennet-papagani', 'Cennet Papağanı', 2),
  (3, 'forpus-papagani', 'Forpus Papağanı', 3),
  (3, 'hint-bulbulu', 'Hint Bülbülü', 4),
  (3, 'kanarya', 'Kanarya', 5),
  (3, 'papagan', 'Papağan', 6)
  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;
-- Akvaryum İlanları
insert into public.breeds (category_id, slug, name, position) values
  (4, 'japon-baligi', 'Japon Balığı', 0),
  (4, 'beta', 'Beta', 1),
  (4, 'ciklet', 'Ciklet', 2),
  (4, 'discus', 'Discus', 3),
  (4, 'karides', 'Karides', 4),
  (4, 'kilickuyruk', 'Kılıçkuyruk', 5),
  (4, 'lepistes', 'Lepistes', 6),
  (4, 'melek-baligi', 'Melek Balığı', 7),
  (4, 'moli', 'Moli', 8),
  (4, 'neon-tetra', 'Neon Tetra', 9),
  (4, 'vatoz', 'Vatoz', 10)
  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;
-- Diğer İlanlar
insert into public.breeds (category_id, slug, name, position) values
  (5, 'guineapig', 'Guineapig', 0),
  (5, 'hamster', 'Hamster', 1),
  (5, 'iguana', 'Iguana', 2),
  (5, 'kaplumbaga', 'Kaplumbağa', 3),
  (5, 'tavsan', 'Tavşan', 4)
  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;

commit;
