-- 0062 — Kategori sayfalarının metinlerini derinleştir.
--
-- Rakip karşılaştırması: aynı konudaki kategori sayfasında 5.664 kelime ve
-- 21 alt başlık varken bizimkinde 466 kelime ve tek başlık vardı. Metnin
-- kendisi 114-549 karakterdi — bir paragraf.
--
-- Metinler ırka ve türe özgü, gerçekten bilgi veren içerikle yeniden
-- yazıldı: yasal çerçeve (5199 sayılı kanun), ırk seçimi, yavru alırken
-- sorulacaklar, tür bazlı bakım hataları. Doldurma metin değil; her
-- paragraf o sayfaya gelen kullanıcının gerçekten sorduğu bir şeyi
-- cevaplıyor.
--
-- "## " ile başlayan satırlar alt başlık olarak render ediliyor
-- (src/components/PageContentBlocks.tsx). Başlık yapısı hem okuyucuya hem
-- arama motoruna metnin neyi anlattığını söylüyor.

begin;

update public.page_content p
set intro = v.intro,
    body = v.body,
    faq = v.faq,
    updated_at = now()
from (values
  ('akvaryum-ilanlari', 'Japon balığı, lepistes, beta, neon tetra ve diğer akvaryum canlıları. İle ve ilçeye göre süzün, satıcıyla doğrudan görüşün.',
   'Akvaryum ilanları balık, karides ve akvaryum bitkilerini kapsıyor. Canlı almadan önce akvaryumun kurulmuş ve döngüsünü tamamlamış olması gerekiyor; bu, yeni başlayanların en sık atladığı adım.

## Akvaryum döngüsü nedir?
Yeni kurulan bir akvaryumda balık atığını zararsız hâle getiren bakteriler henüz yok. Filtre malzemesinde bu bakteri kolonisi oluşana kadar geçen 3-6 haftaya "döngü" deniyor. Döngüsünü tamamlamamış akvaryuma balık koymak, amonyak zehirlenmesiyle sonuçlanıyor — yeni başlayanların balık kaybetmesinin bir numaralı sebebi bu.

## Tür seçimi ve akvaryum hacmi
Japon balığı yaygın sanılanın aksine fanusta yaşayamıyor: çok atık üretiyor ve iyi bir filtreyle en az 50 litre alan istiyor. Beta erkekleri birbirini kabul etmiyor, her erkek ayrı kapta tutulmalı. Neon tetra sürü balığı; altıdan az sayıda tutulduğunda strese giriyor ve renkleri soluyor.

Lepistes başlangıç için en kolay türlerden biri: dayanıklı, ısı aralığı geniş. Yalnız çok hızlı çoğaldıkları için erkek-dişi oranını ayarlamak gerekiyor.

## Kurulum kontrol listesi
Filtre, ısıtıcı, termometre ve aydınlatma temel donanım. Su değişimi haftada bir, hacmin dörtte biri kadar; şebeke suyunun klorunu gidermeden kullanmayın. Test kiti ile amonyak, nitrit ve nitrat takibi ilk aylarda şart.

## Taşıma
Canlı taşınırken oksijenli poşet kullanılıyor ve ısı farkı kademeli dengeleniyor: poşet açılmadan 20-30 dakika akvaryumda yüzdürülüyor, sonra azar azar akvaryum suyu ekleniyor. Doğrudan boşaltmak ısı ve pH şokuna yol açıyor.',
   '[{"soru": "Japon balığı fanusta yaşar mı?", "cevap": "Yaşayamaz. Japon balığı çok atık üretir ve iyi bir filtreyle en az 50 litre alan ister; fanusta tutulan balıklar kısa sürede kaybediliyor."}, {"soru": "Yeni akvaryuma hemen balık konulur mu?", "cevap": "Konulmamalı. Filtrede faydalı bakteri kolonisi oluşana kadar 3-6 hafta geçmesi gerekiyor; döngüsünü tamamlamamış akvaryumda balık amonyak zehirlenmesiyle kaybediliyor."}, {"soru": "Neon tetra kaç adet alınmalı?", "cevap": "En az altı adet. Sürü balığıdır; az sayıda tutulduğunda strese girer ve renkleri solar."}]'::jsonb),
  ('diger-ilanlar', 'Tavşan, hamster, guinea pig, kaplumbağa ve diğer evcil hayvan ilanları. İle ve ilçeye göre süzün, sahibiyle doğrudan görüşün.',
   'Bu bölüm kemirgenler, tavşanlar ve sürüngenleri kapsıyor. Kedi ve köpeğe göre daha az yer kaplasalar da bakım ihtiyaçları çoğu zaman hafife alınıyor.

## Kemirgenlerde yalnızlık ve arkadaşlık
Suriye hamsterları yalnız yaşayan hayvanlar; iki hamsteri aynı kafeste tutmak kavgayla, çoğu zaman ölümle sonuçlanıyor. Guinea pig ise tam tersi — sürü hayvanı ve tek başına tutulduğunda strese giriyor, en az iki olarak sahiplenilmesi gerekiyor.

Kontrolsüz üremeyi önlemek için guinea piglerin aynı cinsiyette çiftler hâlinde sahiplenilmesi öneriliyor.

## Tavşan bakımının temeli saman
Tavşanların dişleri ömür boyu uzuyor ve kuru ot (saman) çiğnemek bu uzamayı dengeliyor. Yalnızca pelet mama vermek diş ve sindirim sorunlarına yol açıyor. Samana sınırsız erişim, tavşan bakımının tek en önemli kuralı.

Tavşanlar kucakta sıkışmaya çok hassas; korktuklarında ani hareketle omurga yaralanması yaşayabiliyorlar. Küçük çocuklu evlerde bu bilinerek sahiplenilmeli.

## Guinea pig ve C vitamini
Guinea pig, insan gibi C vitaminini kendi üretemiyor. Taze biber, maydanoz gibi C vitamini kaynakları günlük beslenmenin parçası olmalı; eksikliği skorbüt tablosuna yol açıyor.

## Sürüngenlerde ısı ve ışık
Kaplumbağa ve diğer sürüngenler vücut ısısını dışarıdan alıyor. Isıtma lambası ve UVB aydınlatma süs değil, kabuk ve kemik sağlığı için zorunlu. Su kaplumbağaları 30 yılı aşkın yaşıyor; kısa vadeli bir karar değil.

Yerli türlerin ekosistemine zarar vermemek için hiçbir evcil sürüngen doğaya bırakılmamalı.',
   '[{"soru": "İki hamster aynı kafeste tutulabilir mi?", "cevap": "Suriye hamsterları yalnız yaşar; aynı kafeste tutulan iki hamster kavga eder ve bu çoğu zaman ölümle sonuçlanır. Her hamster ayrı kafeste tutulmalıdır."}, {"soru": "Tavşan beslenmesinde en önemli şey nedir?", "cevap": "Kuru ota (samana) sınırsız erişim. Tavşanın dişleri ömür boyu uzar ve saman çiğnemek bunu dengeler; yalnızca pelet mama vermek diş ve sindirim sorunlarına yol açar."}, {"soru": "Guinea pig tek başına bakılır mı?", "cevap": "Bakılmamalı. Sürü hayvanıdır ve tek başına tutulduğunda strese girer; en az iki, tercihen aynı cinsiyette sahiplenilmelidir."}]'::jsonb),
  ('guvercin-ilanlari', 'Taklacı, posta, süs ve yerli güvercin ilanları. Uçuş videosu, halka numarası ve şecere bilgisiyle; ile ve ilçeye göre süzün.',
   'Güvercin bölümü kendi başına bir dikey: kendi ırk sınıflandırması, kendi terminolojisi ve kendi değerlendirme ölçütleri var. Güvercin, kanunun ev hayvanı tanımı dışında kaldığı için bireysel yetiştiriciler de alım satım ilanı verebiliyor.

## Irk grupları
Taklacılar uçarken havada geriye takla atmasıyla, posta güvercinleri yüzlerce kilometreden yuvasına dönebilmesiyle, süs güvercinleri ise görünüşleriyle tutuluyor. Yerli hatlar çoğunlukla şehir adıyla anılıyor: Adana, Antep, Urfa, Mardin, Maraş, Konya, Kayseri, Sivas, Malatya, Van. Bu adlar tescil değil, o yörede yıllar içinde seçilerek oluşmuş yerel hatları anlatıyor.

## Halka numarası neden önemli?
Halka, kuşun doğum yılını ve halkayı takan kişiyi gösteriyor; yaş ve köken için tek somut belge bu. Halkasız satılan bir kuşta bu bilgiler beyandan ibaret kalıyor. Yarışa katılacak posta güvercinlerinde kayıtlı halka zaten zorunlu.

Alırken halka numarasının fotoğrafını istemek bu alanda yerleşmiş bir uygulama.

## Uçuş videosu
Taklacıda değer görünüşte değil uçuşta: takla sayısı, taklanın temizliği, yüksekliğini koruyup korumadığı ve sürüyle uyumu. Fotoğraf bunları göstermiyor. Ciddi ilanlarda uçuş videosu bekleniyor; sitede ilana video eklenebiliyor.

## Yeni kuşu sürüye katmak
Yeni alınan kuş doğrudan mevcut sürüye katılmamalı. Birkaç gün ayrı kafeste dinlendirip iç parazit ve solunum belirtileri açısından gözlemek gerekiyor; aksi hâlde tek bir kuş tüm kümese hastalık taşıyabiliyor.

Kümeste havalandırma, temiz su ve düzenli iç parazit takibi üç temel başlık. Kalabalık ve havasız kümes, solunum yolu hastalıklarının en yaygın sebebi.',
   '[{"soru": "Güvercin satışı serbest mi?", "cevap": "Evet. Güvercin, 5199 sayılı kanunun ev hayvanı tanımı dışında kaldığı için satış kısıtlaması güvercinlere uygulanmıyor; bireysel üyeler de alım satım ilanı verebiliyor."}, {"soru": "Halka numarası ne işe yarar?", "cevap": "Kuşun doğum yılını ve halkayı takan kişiyi gösterir; yaş ve köken için tek somut belgedir. Halkasız kuşta bu bilgiler beyandan ibarettir."}, {"soru": "Taklacı alırken neye bakmalı?", "cevap": "Uçuşa. Takla sayısı, taklanın temizliği ve yüksekliğini koruması fotoğraftan anlaşılmıyor; uçuş videosu istemek yerleşmiş bir uygulama."}, {"soru": "Yeni aldığım güvercini doğrudan sürüye katabilir miyim?", "cevap": "Katmayın. Birkaç gün ayrı kafeste dinlendirip iç parazit ve solunum belirtileri açısından gözlemek gerekiyor; aksi hâlde tek kuş tüm kümese hastalık taşıyabilir."}]'::jsonb),
  ('kedi-ilanlari', 'Türkiye genelindeki kedi ilanları. Ücretsiz sahiplendirme ve satılık ilanları ırka, ile ve ilçeye göre süzün, sahibiyle doğrudan görüşün.',
   'Kedi ilanları iki başlıkta toplanıyor: bireysel sahiplerin verdiği ücretsiz sahiplendirme ilanları ve üretim izni bulunan katterilerin verdiği satılık ilanlar. Sahiplendirme ilanlarının büyük bölümü tekir ve melez yavrulardan oluşuyor.

## Irk kedisi mi, tekir mi?
Tekir bir ırk değil, bir tüy deseni; Türkiye''deki kedilerin çoğu bu desende. Dar bir gen havuzundan seçilim yapılmadığı için ırka özgü kalıtsal hastalıklar tekirlerde çok daha az görülüyor — sahiplenme açısından somut bir avantaj.

Irk kedisi tercih edecekseniz ırkın bilinen sağlık riskini önceden öğrenin: British Shorthair ve Maine Coon''da kalp kası kalınlaşması (HCM), İran kedisinde polikistik böbrek hastalığı (PKD), Scottish Fold''da kıkırdak-eklem sorunları. Ciddi katteriler damızlıklarını bu testlerden geçiriyor ve belgesini teslimde veriyor.

## Scottish Fold hakkında bilinmesi gereken
Bu ırkın kıvrık kulağı, kıkırdak yapısını etkileyen bir gen değişiminin görünür sonucu; aynı gen bazı kedilerde eklem gelişim bozukluğuna yol açıyor. Sorumlu üretimde iki kıvrık kulaklı kedi asla eşleştirilmiyor. Yavru alırken anne ve babanın kulak tipini sormak, bu ırkta sorulabilecek en yerinde soru.

## Sokaktan kedi sahiplenirken
İç ve dış parazit uygulaması yapılıp yapılmadığını, karma aşı takviminin başlayıp başlamadığını ve FIV/FeLV testinin yapılıp yapılmadığını sorun. Evde başka kedi varsa test yaptırmadan tanıştırma yapmayın.

Kısırlaştırma hem kontrolsüz üremeyi önlüyor hem de dişilerde meme tümörü, erkeklerde idrar yolu sorunları riskini düşürüyor. Sahiplendirenlerin çoğu kısırlaştırma sözü istiyor.

## Kedi evini hazırlamak
Kum kabı, tırmalama tahtası ve yüksek bir yatma noktası ilk günden hazır olmalı. Balkon filesi kedili evlerde tercih değil, gereklilik: yüksekten düşme kedilerde en sık görülen acil vakalardan biri.',
   '[{"soru": "Tekir bir kedi ırkı mı?", "cevap": "Hayır, tekir bir tüy desenidir. Alındaki \"M\" işareti ve gövdedeki çizgilerle tanınır; farklı ırklarda ve karışık kedilerde görülebilir."}, {"soru": "Kedi sahiplenirken hangi test istenmeli?", "cevap": "Sokaktan gelen kedilerde FIV ve FeLV testi, ırk kedilerinde ırka özgü testler: British Shorthair ve Maine Coon için HCM kalp taraması, İran kedisi için PKD böbrek testi."}, {"soru": "Yavru kedi kaç aylıkken annesinden ayrılmalı?", "cevap": "Sekiz haftadan önce ayrılmamalı. Bu süre hem bağışıklık hem de sosyalleşme için gerekli; erken ayrılan yavrularda davranış sorunları görülüyor."}, {"soru": "Kedi ilanı vermek ücretli mi?", "cevap": "Hayır. Bireysel hesaplar ücretsiz sahiplendirme ilanı verebiliyor; satılık ilan için üretim izni olan kurumsal hesap gerekiyor."}]'::jsonb),
  ('kopek-ilanlari', 'Türkiye genelindeki köpek ilanları. Sahiplendirme ve satılık ilanları ırka, ile ve ilçeye göre süzün; sahibiyle doğrudan görüşün.',
   'PetSemti''de köpek ilanları iki başlıkta toplanıyor: bireysel sahiplerin verdiği ücretsiz sahiplendirme ilanları ve üretim izni bulunan işletmelerin verdiği satılık ilanlar. Hangi ilanın hangisi olduğunu kart üzerindeki etiketten görebiliyorsunuz.

## Sahiplendirme mi, satın alma mı?
5199 sayılı Hayvanları Koruma Kanunu''nda 2021''de yapılan değişiklikle kedi, köpek ve gelinciklerin satışı yalnızca üretim izni bulunan işletmeler üzerinden yapılabiliyor; 14 Temmuz 2022''den beri bu hayvanlar pet shop vitrinlerinde satılamıyor. Bu yüzden sitede bireysel hesaplar yalnızca ücretsiz sahiplendirme ilanı verebiliyor, satılık ilanlar ise kurumsal hesaplardan geliyor.

Sahiplendirme ilanlarında hiçbir ad altında ücret istenemez. "Aşı masrafı", "kapora" ya da "nakil ücreti" diye para talep eden bir ilanla karşılaşırsanız bildirin.

## Irk seçerken nelere bakmalı?
Irk, köpeğin görünüşünden çok yaşam biçimini belirliyor. Kangal ve Akbaş gibi sürü koruma ırkları geniş alan ve iş isterken, Toy Poodle ve Maltese gibi küçük ırklar apartman yaşamına uyum sağlıyor. Golden Retriever ve Labrador gibi av-getirme ırkları günde en az bir saat aktif hareket istiyor; bu karşılanmadığında kilo ve eklem sorunları başlıyor.

Melez köpekler dar bir gen havuzundan seçilim görmedikleri için ırka özgü kalıtsal hastalıkları daha az taşıyor. Sahiplendirme ilanlarının büyük bölümü melez yavrulardan oluşuyor.

## Yavru alırken sorulacaklar
Yavru sekiz haftadan önce annesinden ayrılmamalı; bu süre hem bağışıklık hem de sosyalleşme için gerekli. Yavruyu annesiyle birlikte görmek, hattın bakım koşullarını anlamanın en pratik yolu.

Karma aşı takvimi, iç ve dış parazit uygulaması ve mikroçip kaydı sorulmalı. Kedi ve köpeklerde mikroçip zorunlu; çipsiz bir hayvan kaybolduğunda sahibine ulaşmanın yolu kalmıyor. Büyük ırklarda anne ve babanın kalça-dirsek skoru belgesi istemek, ileride ağır bir ameliyatın önüne geçebiliyor.

## Yasaklı ırklar
Pitbull Terrier, Japon Tosa, Dogo Argentino ve Fila Brasileiro ırklarının satışı, sahiplendirilmesi, takası ve üretimi kanunen yasak. Bu ırklara ait ilan sistem tarafından hiç kabul edilmiyor.',
   '[{"soru": "Köpek ilanı vermek ücretli mi?", "cevap": "Hayır, üyelik de ilan vermek de ücretsiz. Bireysel hesaplar ücretsiz sahiplendirme ilanı verebiliyor; satılık ilan için üretim izni olan kurumsal hesap gerekiyor."}, {"soru": "Sahiplendirme ilanında para istenebilir mi?", "cevap": "İstenemez. Sahiplendirme ilanında ücret, aşı masrafı ya da kapora adı altında para talep edilmesi yasaktır; böyle bir ilanla karşılaşırsanız bildirin."}, {"soru": "Yavru köpek kaç aylıkken sahiplenilmeli?", "cevap": "Sekiz haftadan önce annesinden ayrılmamalı. Daha erken ayrılan yavrularda ısırma kontrolü ve ayrılık kaygısı sorunları görülüyor."}, {"soru": "Köpek sahiplenirken hangi belgeler istenmeli?", "cevap": "Aşı karnesi, iç-dış parazit uygulaması kaydı ve mikroçip numarası. Büyük ırklarda anne-babanın kalça ve dirsek skoru belgesi de sorulmalı."}]'::jsonb),
  ('kus-ilanlari', 'Muhabbet kuşu, sultan papağanı, kanarya ve diğer kuş ilanları. İle ve ilçeye göre süzün, sahibiyle doğrudan görüşün.',
   'Kuş ilanları muhabbet kuşundan papağana, kanaryadan cennet papağanına kadar evde beslenen türleri kapsıyor. Kuş, kanunun "ev hayvanı" tanımındaki satış kısıtlamasının dışında; buna karşılık sitede satılık kuş ilanları kurumsal hesaplardan geliyor, bireysel üyeler sahiplendirme ilanı veriyor.

## Tür seçerken
Muhabbet kuşu ve cennet papağanı sürü hâlinde yaşayan türler; tek başına ve ilgisiz bırakıldıklarında tüy yolma ve sürekli çığlık davranışı gelişiyor. Bu türleri çift olarak ya da gün içinde uzun süre insan teması olan bir evde sahiplenmek gerekiyor.

Sultan papağanı daha sakin ve 15-20 yıl yaşıyor; kanarya ise tek başına tutulabilen, sesi rahatsız etmeyen bir ev kuşu. Papağan türlerinde ömür 30 yılı aşabiliyor — sahiplenme kararı bu süreye göre verilmeli.

## Kafes ve yerleşim
Kafeste genişlik yükseklikten önemli: bu kuşlar yatay uçuyor. Tek kuş için uzun kenarı en az 60 cm olan bir kafes alt sınır. Farklı çaplarda doğal ağaç tünek ayak sağlığı için gerekli; tek çaplı plastik tünek ayak tabanında yaralara yol açıyor.

Kafes, mutfaktan uzak bir yere konmalı. Yapışmaz tava kaplamalarının kızgın hâlde yaydığı duman kuşlar için öldürücü.

## Beslenme
Yalnızca tohum vermek en yaygın hata: yağlanmaya ve A vitamini eksikliğine yol açıyor. Karışıma sebze, pelet mama ve kalsiyum kaynağı (mürekkep kemiği) eklenmeli. Avokado, çikolata, kafein ve tuz kuşlar için zehirli.

## Sağlık işaretleri
Kabarık duran, gözünü kapatan, kafes tabanında oturan bir kuş hastadır. Kuşlar hastalığını son ana kadar gizlediği için bu belirtiler görüldüğünde durum genellikle ilerlemiştir; kuş hekimliğiyle ilgilenen bir veterinere gecikmeden başvurun.',
   '[{"soru": "Muhabbet kuşu tek başına bakılır mı?", "cevap": "Bakılabilir ama ancak gün içinde uzun süre insan teması varsa. Sürü hâlinde yaşayan bir türdür; yalnız ve ilgisiz kalan kuşlarda tüy yolma ve sürekli çığlık gelişir. Ayna arkadaş yerine geçmez."}, {"soru": "Kuşa sadece darı vermek yeterli mi?", "cevap": "Yeterli değildir. Yalnızca tohumla beslenme yağlanma ve A vitamini eksikliğine yol açar; sebze, pelet mama ve mürekkep kemiği eklenmelidir."}, {"soru": "Kuş kafesi nasıl olmalı?", "cevap": "Genişlik yükseklikten önemlidir çünkü bu kuşlar yatay uçar. Tek kuş için uzun kenarı en az 60 cm olan bir kafes alt sınırdır; farklı çaplarda doğal ağaç tünek ayak sağlığı için gereklidir."}]'::jsonb),
  ('pet-malzemeleri', 'İkinci el ve sıfır pet malzemeleri: kafes, akvaryum, taşıma çantası, tasma, yatak, oyuncak ve bakım ürünleri. Şehrinize göre inceleyin.',
   'Pet malzemeleri bölümünde kafes, akvaryum, tırmanma ünitesi, taşıma çantası, tasma, yatak ve bakım ürünleri alınıp satılıyor. Eşya satışı hayvan satışı sayılmadığı için bu bölümde bireysel üyeler de fiyat belirleyebiliyor.

## İkinci el alırken nelere bakmalı?
Kafes ve kulübelerde tellerdeki pas, ahşaptaki çürük ve kilit mekanizması kontrol edilmeli. Akvaryumda silikon kaçağı en kritik nokta; cam sağlam görünse de silikon yaşlanmışsa su tutmuyor. Tırmanma ünitelerinde sisal halatın yıpranması normal, taşıyıcı direğin sağlamlığı önemli.

Kullanılmış mama ve su kabı, tasma gibi hayvanın ağzına ve derisine değen ürünlerde dezenfeksiyon isteyin ya da yenisini tercih edin.

## Ölçü seçimi
Taşıma çantasında hayvan ayakta durabilmeli ve dönebilmeli; uçuşa çıkacaksa havayolunun kabin ölçüleri önceden sorulmalı, bu ölçüler şirketten şirkete değişiyor.

Kuş kafesinde genişlik yükseklikten önemli çünkü kuşlar yatay uçuyor. Akvaryumda hacim, tutulacak türe göre belirlenir: japon balığı için en az 50 litre, tek beta için ısıtıcılı 15-20 litre.

## Neyi almamalı
Boyun tasması küçük ırk köpeklerde soluk borusuna baskı yapıyor; bu ırklarda göğüs tasması tercih edilmeli. Kemirgenlerde talaş altlık uçucu yağları nedeniyle solunum yolunu tahriş ediyor, kağıt esaslı altlık daha güvenli.

## Teslim ve taşıma
Akvaryum, kulübe ve büyük kafesler tek kişiyle taşınmıyor; ilanda teslim şartının yazılı olması iki tarafın da işini kolaylaştırıyor. Ödemeyi teslim anında ve yüz yüze yapın.',
   '[{"soru": "İkinci el akvaryum alırken neye bakmalı?", "cevap": "Silikon kaçağına. Cam sağlam görünse de silikon yaşlanmışsa akvaryum su tutmaz; mümkünse kurulu ve dolu hâlde görün."}, {"soru": "Taşıma çantası nasıl seçilir?", "cevap": "Hayvan içinde ayakta durabilmeli ve dönebilmeli. Uçuşa çıkacaksa havayolunun kabin ölçüleri önceden sorulmalı; bu ölçüler şirketten şirkete değişiyor."}, {"soru": "Pet malzemesi ilanı vermek ücretli mi?", "cevap": "Hayır. Eşya satışı hayvan satışı sayılmadığı için bu bölümde bireysel üyeler de ücretsiz olarak fiyatlı ilan verebiliyor."}]'::jsonb)
) as v(slug, intro, body, faq)
join public.categories c on c.slug = v.slug
where p.category_id = c.id and p.breed_id is null;

commit;
