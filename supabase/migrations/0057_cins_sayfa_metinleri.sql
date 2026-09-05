-- 0057 — Cins sayfalarına özgün metin.
--
-- Cins sayfaları yalnızca filtre ve ilan kartlarından oluşuyordu; "Toy
-- Poodle İlanları" ile "Kangal İlanları" arasında metin olarak hiçbir fark
-- yoktu. Arama motoru için ikisi de aynı şablonun kopyasıydı, kullanıcı
-- için de sayfa hiçbir şey anlatmıyordu.
--
-- Buradaki metinler ırka özgü: her biri o ırkın bakımına, sağlık riskine ve
-- sahiplenme kararına dair somut bilgi taşıyor. Şablona değişken doldurarak
-- üretilmedi — öyle üretilen metin yirmi sayfayı birbirinin kopyası yapardı,
-- yani çözmek istediğimiz sorunun kendisi olurdu.
--
-- Yirmi cins, ilan sayısına göre değil arama hacmine göre seçildi: sayfanın
-- aramada karşılık bulması için ilanın gelmesini beklemek gerekmiyor, tersi
-- geçerli. Site haritası zaten "ilanı var VEYA özgün metni var" koşuluna
-- bakıyor, bu satırlar eklendiğinde sayfalar haritaya kendiliğinden giriyor.

begin;

insert into public.page_content
  (category_id, breed_id, seo_title, seo_description, intro, body, faq)
select b.category_id, v.breed_id, v.seo_title, v.seo_description, v.intro, v.body, v.faq
from (values
  (1, 'Taklacı Güvercin İlanları — Alım Satım', 'Taklacı güvercin ilanları: Adana, Antep, Urfa ve Mardin hatları, takla değerlendirmesi, halka numarası ve uçuş videosu. İl ve ilçeye göre inceleyin.',
   'Taklacı güvercin, uçarken havada geriye doğru takla atmasıyla bilinen bir grup. Türkiye''de şehir adıyla anılan çok sayıda yerel hat var ve bunlar birbirinden uçuş biçimiyle ayrılıyor.',
   'Taklacıda değerlendirme kuşun görünüşünden çok uçuşuna dayanıyor: takla sayısı, taklanın temizliği, yüksekliğini koruyup korumadığı ve sürüyle uyumu. Bu yüzden ciddi ilanlarda uçuş videosu bekleniyor; fotoğraf tek başına bir taklacı hakkında çok az şey söylüyor.

Türkiye''de en bilinen hatlar şehir adlarıyla anılıyor: Adana, Antep, Urfa, Mardin, Maraş, Konya, Kayseri, Sivas, Malatya, Van. Bu adlar bir tescil değil, o yörede yıllar içinde belirli özelliklere göre seçilerek oluşmuş yerel hatları anlatıyor. Hatlar arasında takla biçimi, uçuş süresi ve yüksekliği farklılık gösteriyor. İlan verenden hattın kaynağını ve anaç bilgisini sormak, kuşun ne yapacağını önceden görmenin tek yolu.

Halka numarası bu alanda güvenin temeli: kuşun doğum yılını ve halkayı takan kişiyi gösteriyor. Halkasız satılan bir kuşun yaşı ve kökeni beyandan ibaret kalıyor. Alırken halka numarasının fotoğrafını istemek yerleşmiş bir uygulama.

Sağlık tarafında en sık karşılaşılan üç sorun kanat kırığı, iç parazit ve solunum yolu enfeksiyonu. Uzun yol taşımadan sonra kuşa birkaç gün dinlenme, temiz su ve ayrı kafes vermek yerleşmesini kolaylaştırıyor. Yeni kuşu doğrudan mevcut sürünün içine katmak, hastalık taşıma riski nedeniyle önerilmiyor.',
   '[{"soru": "Taklacı güvercin alırken uçuş videosu neden isteniyor?", "cevap": "Taklacıda değer, kuşun görünüşünden çok uçuşundadır: takla sayısı, taklanın temizliği ve yüksekliğini koruması. Fotoğraf bunları göstermez, video gösterir."}, {"soru": "Halka numarası ne işe yarar?", "cevap": "Kuşun doğum yılını ve halkayı takan kişiyi gösterir; yaş ve köken için tek somut belgedir. Halkasız kuşta bu bilgiler beyandan ibarettir."}, {"soru": "Yeni aldığım güvercini doğrudan sürüye katabilir miyim?", "cevap": "Önerilmez. Yeni kuş birkaç gün ayrı kafeste dinlendirilmeli, iç parazit ve solunum belirtileri açısından gözlenmelidir. Doğrudan katmak tüm sürüye hastalık taşıma riski yaratır."}]'::jsonb),
  (6, 'Posta Güvercini İlanları — Alım Satım', 'Posta güvercini ilanları: yön bulma yeteneği, yarış hatları, halka ve şecere kaydı, antrenman düzeni. İl ve ilçeye göre inceleyin.',
   'Posta güvercini, yüzlerce kilometre uzaktan yuvasına dönebilme yeteneği için seçilerek geliştirilmiş bir grup. Türkiye''de yarış güvercinciliğinin temelini bu kuşlar oluşturuyor.',
   'Posta güvercininin yön bulması tek bir yeteneğe değil, birden çok duyunun birlikte çalışmasına dayanıyor: güneşin konumu, dünyanın manyetik alanı ve yerel işaretler. Bu nedenle genç kuşların kısa mesafelerden başlayarak kademeli antrenmanla yola alıştırılması gerekiyor; ilk uçuşunu uzun mesafeden yapan kuş çoğu zaman geri dönmüyor.

Hatlar bu alanda fiyatın ana belirleyicisi. Belçika ve Hollanda kökenli hatlar (Janssen gibi) uzun yıllardır yarış sonuçlarına göre seçildikleri için aranıyor. İlan verenden şecere (soy kütüğü) ve varsa yarış sonucu istemek, hattın iddiasını doğrulamanın yolu.

Halka numarası posta güvercininde şecere kadar önemli: kuşun doğum yılını, halka veren federasyon ya da dernek kaydını taşıyor. Yarışa katılacak kuşlarda kayıtlı halka zorunlu. Halkasız bir kuş yalnızca üretimde kullanılabiliyor.

Bakımda üç başlık öne çıkıyor: kümes havalandırması, temiz su ve iç parazit takibi. Kalabalık ve havasız kümes solunum yolu hastalıklarının en yaygın nedeni. Yarış döneminde beslenmenin enerji içeriği artırılıyor, dinlenme döneminde hafifletiliyor. Uzun yoldan gelen kuşa dönüşte su ve elektrolit desteği veriliyor.',
   '[{"soru": "Posta güvercini nasıl yolunu bulur?", "cevap": "Güneşin konumu, dünyanın manyetik alanı ve yerel işaretleri birlikte kullanır. Bu nedenle genç kuşlar kısa mesafelerden başlayarak kademeli antrenmanla yola alıştırılmalıdır."}, {"soru": "Posta güvercini alırken şecere neden önemli?", "cevap": "Hattın yarış geçmişini gösterir ve bu alanda fiyatın ana belirleyicisidir. Şecere ve varsa yarış sonucu istemek, ilandaki hat iddiasını doğrulamanın yoludur."}, {"soru": "Halkasız posta güvercini yarışa girebilir mi?", "cevap": "Giremez. Yarışa katılacak kuşlarda kayıtlı halka zorunludur. Halkasız kuş yalnızca üretimde kullanılabilir."}]'::jsonb),
  (84, 'Golden Retriever — Satılık ve Sahiplendirme', 'Golden Retriever ilanları: yavru bakımı, egzersiz ihtiyacı, kalça displazisi ve tüy dökümü. İl ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
   'Golden Retriever 25-34 kg ağırlığında, sakin mizaçlı bir av-getirme ırkı. Çocuklu evlerde en çok tercih edilen ırklardan biri; buna karşılık günlük egzersiz ihtiyacı çoğu sahibin beklediğinden yüksek.',
   'Golden Retriever''ın mizacı bu ırkın en bilinen özelliği: yabancıya karşı düşük tepkili, çocuklara toleranslı, eğitime son derece açık. Rehber köpek ve arama-kurtarma programlarında en çok kullanılan üç ırktan biri olması tesadüf değil. Ancak bu uysallık bekçilik beklentisiyle sahiplenenler için hayal kırıklığı yaratır — bu ırk bir koruma köpeği değildir.

Egzersiz ihtiyacı günde en az bir saat, tercihen koşu ya da yüzme. Su bu ırk için ayrı bir konu: ayak parmakları arasındaki perde ve yağ tutan çift kat tüy, Golden''ı doğal bir yüzücü yapıyor. Yeterince hareket etmeyen bir Golden hızla kilo alıyor ve eklem sorunları buradan başlıyor.

Çift kat tüy yılda iki kez yoğun dökülüyor; bahar ve sonbaharda günlük tarama gerekiyor, yılın kalanında haftada iki üç kez. "Tüy dökmeyen köpek" arayan biri için uygun bir ırk değil.

Sağlık tarafında kalça ve dirsek displazisi bu ırkın en yaygın sorunu. Ciddi üreticiler anne ve babanın kalça skorunu belgelendirir; yavru alırken bu belgeyi istemek, ileride binlerce liralık bir ameliyatın önüne geçebilir. Kulak yapısı nedeniyle dış kulak iltihabı da sık görülür, özellikle yüzdükten sonra kulakların kurulanması gerekir.',
   '[{"soru": "Golden Retriever çocuklu eve uygun mu?", "cevap": "Evet, ırkın mizacı çocuklara karşı toleranslıdır ve bu yönüyle en çok önerilen ırklardan biridir. Yine de büyük ve hareketli bir köpektir; küçük çocuklarla oyunun gözetimsiz bırakılmaması gerekir."}, {"soru": "Golden Retriever ne kadar tüy döker?", "cevap": "Çok döker. Çift kat tüyü vardır ve yılda iki kez mevsim dökümü yaşar. Döküm dönemlerinde günlük, diğer zamanlarda haftada iki üç kez tarama gerekir."}, {"soru": "Golden Retriever apartmanda bakılabilir mi?", "cevap": "Bakılabilir ama bahçe yerine geçen bir egzersiz programı şarttır: günde en az bir saat aktif hareket. Bu karşılanmazsa kilo, eklem sorunu ve ev içinde huzursuzluk kaçınılmazdır."}]'::jsonb),
  (91, 'Alman Kurdu İlanları — Satılık ve Sahiplendirme', 'Alman Kurdu (Alman Çoban Köpeği) ilanları: eğitim, egzersiz, kalça displazisi ve hat farkları. İl ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
   'Alman Kurdu 22-40 kg ağırlığında, çalışmak için yetiştirilmiş bir ırk. Zekası ve öğrenme hızı yüksek; buna karşılık boş kalan bir Alman Kurdu, enerjisini sahibinin hoşuna gitmeyecek işlere yönlendiriyor.',
   'Alman Kurdu''nu diğer ırklardan ayıran şey fiziksel gücünden çok zihinsel ihtiyacı. Bu ırk bir görev bekliyor: iz sürme, getirme, koklama oyunları, itaat çalışması. Günde iki yürüyüş bedensel ihtiyacı karşılar ama zihinsel ihtiyacı karşılamaz; sıkılan bir Alman Kurdu kapı önünde havlamaya, kazmaya ve eşya parçalamaya başlar.

Irk içinde iki ayrı hat var ve bu fark satın alma kararında önemli. Çalışma hattı köpekleri daha ince yapılı, daha yüksek enerjili ve deneyimli sahip isteyen köpekler. Şov hattı ise daha ağır yapılı; bu hatta yıllar içinde abartılan eğimli sırt yapısı, kalça sorunlarının artmasında rol oynadı. İlan verenden hangi hattan geldiğini sormak, köpeğin yaşam tarzınıza uyup uymayacağını baştan gösterir.

Kalça ve dirsek displazisi bu ırkın bilinen sorunu; anne-baba kalça skoru olmayan bir yavru, sağlıklı bile olsa bilinmeyen bir risk taşıyor. Ayrıca ilerleyen yaşta arka bacaklarda güç kaybına yol açan dejeneratif miyelopati bu ırkta görülüyor; genetik testi mevcut.

Çift kat tüy yıl boyu, mevsim geçişlerinde ise yoğun dökülüyor. Haftada iki üç tarama şart. Kulaklar dik ve havalandığı için kulak enfeksiyonu Golden gibi ırklara göre daha az sorun çıkarıyor.',
   '[{"soru": "Alman Kurdu ilk köpeğim olabilir mi?", "cevap": "Zorlayıcı bir seçimdir. Irk zeki ve eğitilebilir olsa da yüksek zihinsel uğraş, tutarlı sınırlar ve düzenli egzersiz ister. Deneyimsiz sahiplerde çoğu sorun eğitim eksikliğinden doğar."}, {"soru": "Alman Kurdu ne kadar egzersiz ister?", "cevap": "Günde en az bir saat aktif hareket ve buna ek olarak zihinsel uğraş: koklama oyunları, iz sürme, itaat çalışması. Sadece yürüyüş bu ırk için yeterli değildir."}, {"soru": "Alman Kurdu yavrusu alırken neye bakmalıyım?", "cevap": "Anne ve babanın kalça-dirsek skoru belgesini isteyin, yavruyu annesiyle birlikte görün ve sekiz haftadan erken teslim almayın. Hattın çalışma mı şov hattı mı olduğunu sormak da yaşam tarzınıza uygunluk açısından önemlidir."}]'::jsonb),
  (103, 'Chihuahua İlanları — Satılık ve Sahiplendirme', 'Chihuahua ilanları: dünyanın en küçük köpek ırkı, soğuğa hassasiyet, bıngıldak ve diş sağlığı. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Chihuahua dünyanın en küçük köpek ırkı: 1,5-3 kg. Küçüklüğü onu kırılgan yapıyor; buna karşılık karakteri hiç de küçük değil — kendinden çok büyük köpeklere kafa tutabiliyor.',
   'Chihuahua''nın en çok yanlış anlaşılan yanı mizacı. Boyutu nedeniyle bir "kucak köpeği" gibi davranılıyor, kucaktan inmesine izin verilmiyor ve sosyalleşmesi eksik kalıyor. Sonuç, yabancıya ve diğer köpeklere karşı tepkili, sürekli havlayan bir köpek oluyor. Bu ırkın sorunlarının çoğu genetik değil, sosyalleşme eksikliğinden kaynaklanıyor.

Fiziksel olarak dikkat isteyen üç nokta var. Birincisi soğuk: yağ dokusu ve tüy örtüsü ince olduğu için kışın mont gerçekten gerekli, süs değil. İkincisi kafatasındaki bıngıldak (molera) — bu ırkın bir kısmında kafatasının tepesindeki açıklık yetişkinlikte de kapanmıyor; kafaya gelen darbelere karşı korumasız bir alan demek. Üçüncüsü düşme: masadan ya da kucaktan atlaması kırıkla sonuçlanabiliyor.

Diş sağlığı bu ırkta ortalamanın üzerinde sorun çıkarıyor. Küçük çenede dişler sıkışık duruyor, diş taşı erken başlıyor ve tedavi edilmezse üç dört yaşında diş kaybı görülebiliyor. Günlük diş fırçalama bu ırkta lüks değil.

Yaşam süresi 14-18 yıl; köpek ırkları arasında en uzun ömürlülerden. Yani sahiplenme kararı, çoğu ırktan daha uzun bir taahhüt.',
   '[{"soru": "Chihuahua neden sürekli havlıyor?", "cevap": "Genellikle sosyalleşme eksikliğinden. Küçüklüğü nedeniyle kucaktan indirilmeyen ve farklı ortam, insan ve köpekle tanışmayan yavrularda tepkisellik gelişir. Erken ve düzenli sosyalleşme bunu büyük ölçüde önler."}, {"soru": "Chihuahua''ya kışın mont gerekli mi?", "cevap": "Evet. Vücut yağı ve tüy örtüsü ince olduğu için soğuğa dayanıksızdır; kış aylarında dışarıda mont işlevsel bir ihtiyaçtır."}, {"soru": "Chihuahua kaç yıl yaşar?", "cevap": "Ortalama 14-18 yıl. Köpek ırkları arasında en uzun ömürlülerden biridir; sahiplenme kararı buna göre değerlendirilmelidir."}]'::jsonb),
  (120, 'Kangal İlanları — Satılık ve Sahiplendirme', 'Kangal ilanları: sürü koruma içgüdüsü, barınma ve beslenme ihtiyacı, tescil ve ihracat kuralları. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Kangal, Türkiye''nin tescilli sürü koruma köpeği: erkeklerde 50-65 kg, omuz yüksekliği 75-85 cm. Bir eşlik köpeği değil, iş köpeğidir — sahiplenmeden önce bunun ne anlama geldiğini bilmek gerekiyor.',
   'Kangal''ın davranışını anlamak için ne için yetiştirildiğine bakmak gerekiyor: yüzyıllardır sürüyü kurda karşı, çoban olmadan, kendi kararıyla koruyan bir köpek. Buradan iki sonuç çıkıyor. Birincisi, Kangal bağımsız karar veren bir ırk; "otur-kalk" komutlarını öğrenir ama itaat köpeği gibi çalışmaz. İkincisi, koruma içgüdüsü öğretilen bir şey değil, doğuştan gelen bir davranış — eve giren yabancıyı tehdit sayması eğitim eksikliği değil, ırkın kendisidir.

Bu yüzden apartman dairesi ya da küçük bir bahçe bu ırk için uygun değil. Kangal geniş alan, iş ve net sınırlar ister. Alanı olmayan bir Kangal, enerjisini sahibinin istemediği yerlere yönlendirir. Kentte Kangal sahiplenmeyi düşünen biri, günde kilometrelerce yürüyüş ve ciddi bir sosyalleşme programı taahhüt ediyor demektir.

Beslenme maliyeti hafife alınmamalı: yetişkin bir Kangal günde 600-900 gram kuru mama tüketebiliyor. Büyüme döneminde kalsiyum-fosfor dengesi kritik; aşırı protein ve erken yoğun egzersiz, büyük ırklarda eklem gelişimini bozuyor. Şişkinlik (mide burulması) büyük ve derin göğüslü ırklarda ölümcül olabilen acil bir durum — günlük tek öğün yerine bölünmüş öğün önerilir.

Kangal Türkiye''nin tescilli ırkı olarak koruma altında; yurt dışına çıkarılması izne tabidir. Sahiplenirken hayvanın kayıt ve mikroçip durumunu sormak yalnızca yasal bir gereklilik değil, hattın izlenebilirliği açısından da önemli.',
   '[{"soru": "Kangal apartmanda beslenebilir mi?", "cevap": "Uygun değildir. Kangal geniş alan ve iş isteyen bir sürü koruma ırkıdır; dar alanda huzursuzluk, aşırı havlama ve davranış sorunları gelişir."}, {"soru": "Kangal saldırgan bir ırk mı?", "cevap": "Saldırgan değil, koruyucudur. Sürüsünü ve alanını savunmak için yetiştirilmiştir; yabancıya mesafeli davranması ırkın doğasıdır. Erken sosyalleşme ve net sınırlar bu davranışın yönetilebilir kalmasını sağlar."}, {"soru": "Kangal yavrusu ne kadar mama yer?", "cevap": "Yetişkinde günde 600-900 gram kuru mama tipiktir. Yavrulukta miktardan çok içerik önemlidir: büyük ırklara özel, kalsiyum-fosfor dengesi ayarlanmış mama kullanılmalıdır."}]'::jsonb),
  (122, 'Labrador Retriever — Satılık ve Sahiplendirme', 'Labrador Retriever ilanları: egzersiz ihtiyacı, kilo kontrolü, kalça displazisi ve renk farkları. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Labrador Retriever 25-36 kg ağırlığında, suya ve getirme oyununa yatkın bir av köpeği. Dünyada en çok tercih edilen ırklardan biri; en yaygın sorunu da bu popülerlikle ilgili: aşırı kilo.',
   'Labrador''un iştahı ırkın belirgin bir özelliği. Yapılan çalışmalar, bu ırkın önemli bir bölümünde tokluk hissini düzenleyen bir gen bölgesinin farklı çalıştığını gösteriyor — yani Labrador''un sürekli aç görünmesi terbiyesizlik değil, biyoloji. Sonuç olarak bu ırkta obezite oranı diğer ırkların üzerinde ve fazla kilo, kalça-dirsek sorunlarını doğrudan ağırlaştırıyor. Mamayı göz kararı değil tartarak vermek bu ırkta gerçekten fark yaratıyor.

Egzersiz ihtiyacı yüksek: günde en az bir saat, tercihen yüzme veya getirme oyunu. Su tutmayan çift kat tüyü ve perdeli ayakları Labrador''u güçlü bir yüzücü yapıyor. Yeterince hareket etmeyen genç bir Labrador enerjisini eve yöneltiyor; bu ırkta eşya kemirme şikayetinin arkasında neredeyse her zaman eksik egzersiz var.

Sarı, siyah ve çikolata renkleri aynı ırkın renk varyasyonları; mizaç farkı yaratmıyor. Yalnızca çikolata renginde bazı çalışmalarda daha kısa ortalama ömür ve daha sık deri-kulak sorunu bildirildi; bunun dar bir gen havuzundan seçilim yapılmasıyla ilgili olduğu düşünülüyor.

Mizaç olarak sabırlı, öğrenmeye açık ve insana yönelik. Rehber köpek programlarında en çok kullanılan ırk olması bundan. Bekçilik beklentisiyle sahiplenmek için uygun bir ırk değil.',
   '[{"soru": "Labrador neden sürekli aç?", "cevap": "Irkın önemli bir bölümünde tokluk hissini düzenleyen gen bölgesi farklı çalışır. Bu yüzden Labrador''da porsiyon kontrolü ve mamanın tartılarak verilmesi, diğer ırklara göre daha kritiktir."}, {"soru": "Siyah, sarı ve çikolata Labrador arasında karakter farkı var mı?", "cevap": "Hayır, aynı ırkın renk varyasyonlarıdır ve mizaç farkı yaratmaz. Yalnızca çikolata renginde deri ve kulak sorunlarının biraz daha sık görüldüğü bildirilmiştir."}, {"soru": "Labrador apartmanda bakılır mı?", "cevap": "Bakılabilir ama günde en az bir saat aktif egzersiz şarttır. Bu karşılanmadığında kilo alma ve ev içinde yıkıcı davranış görülür."}]'::jsonb),
  (124, 'Maltese Terrier — Satılık ve Sahiplendirme', 'Maltese Terrier ilanları: ipeksi tüy bakımı, göz altı lekesi, diz ve diş sağlığı. İl ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
   'Maltese Terrier 3-4 kg ağırlığında, düz ve ipeksi beyaz tüylü bir ırk. Tüyü dökülmüyor ama günlük tarama istiyor; bakımı ihmal edilirse kısa sürede keçeleşiyor.',
   'Maltese''in tüyü alt katmanı olmayan, tek kat ve ipeksi bir yapıda. Bu, tüy dökümünü neredeyse sıfıra indiriyor ama bakımı zorlaştırıyor: düz ve ince tüy sürtünen yerlerden — kulak altı, koltuk altı, bacak arası — hızla keçeleşiyor. Uzun tüy tercih ediliyorsa günlük tarama gerekiyor; günlük bakım için vakit yoksa kısa "yavru traşı" daha gerçekçi bir seçim.

Beyaz tüylü ırklarda göz altındaki kahverengi leke sık sorulan bir konu. Nedeni çoğunlukla gözyaşının tüyle sürekli teması; gözyaşı kanallarının darlığı, kirpik yönü ya da alerji altta yatan sebep olabiliyor. Kalıcı çözüm lekeyi boyamak değil, nedeni veterinerde araştırmak.

Küçük ırk sorunları bu ırkta da geçerli: diz kapağı kayması, erken diş taşı ve süt dişlerinin zamanında dökülmemesi. Kısırlaştırma ya da diş taşı temizliği için anestezi alınacaksa, kalıcı dişlerin arkasında kalan süt dişlerinin aynı seansta çekilmesi yaygın bir uygulama.

Maltese sahibine çok bağlı bir ırk; bu bağlılık ayrılık kaygısına dönüşebiliyor. Yavrulukta kısa süreli yalnız kalma alıştırmaları yapmak, ileride tüm gün havlayan bir köpekle uğraşmaktan kolay.',
   '[{"soru": "Maltese Terrier tüy döker mi?", "cevap": "Neredeyse dökmez; tek kat ipeksi tüyü vardır. Buna karşılık günlük tarama ister, taranmadığında kulak altı ve bacak arasından keçeleşir."}, {"soru": "Maltese''in göz altındaki kahverengi leke neden olur?", "cevap": "Gözyaşının tüyle sürekli teması sonucu oluşur. Altında gözyaşı kanalı darlığı, ters kirpik veya alerji olabilir; kalıcı çözüm için nedenin veterinerde araştırılması gerekir."}, {"soru": "Maltese Terrier çocuklu eve uygun mu?", "cevap": "Uygundur ama 3-4 kg''lık bir köpektir; düşme ve ezilme riski nedeniyle küçük çocuklarla teması gözetim altında olmalıdır."}]'::jsonb),
  (131, 'Pomeranian Boo — Satılık ve Sahiplendirme', 'Pomeranian Boo ilanları: "Boo" traşı, tüy bakımı, trakea ve diş sağlığı. İl ve ilçeye göre inceleyin, ilan sahibiyle doğrudan görüşün.',
   '"Boo" ayrı bir ırk değil, Pomeranian''ın tüyünün yuvarlak biçimde kısa traş edilmesine verilen ad. Irkın kendisi 1,8-3,5 kg ağırlığında, çift kat tüylü bir Alman spitz''i.',
   'İlanlarda "Boo cinsi" diye geçen köpek, tüyü kısa ve yuvarlak traş edilmiş bir Pomeranian''dır. Bunu bilmek fiyat açısından da önemli: Boo görünümü kuaförde elde edilen geçici bir sonuç, kalıcı bir ırk özelliği değil. Traş uzadıkça köpek normal Pomeranian görünümüne döner.

Traşın bir riski de var: Pomeranian çift kat tüylü bir ırk ve alt tüy dibinden kesildiğinde bazı köpeklerde eski yoğunluğunda geri çıkmıyor. Bu duruma "traş sonrası alopesi" deniyor. Tüyü çok kısaltmak yerine biçimlendirmek, kuaförden istenmesi gereken şey.

Küçük ırklarda soluk borusunun yassılaşması (trakea kollapsı) yaygın; kuru, ötücü bir öksürükle kendini gösteriyor. Boyun tasması yerine göğüs tasması kullanmak bu ırkta tercih değil, gereklilik. Diş taşı ve erken diş kaybı da yaygın — küçük çenede dişler sıkışık duruyor, günlük diş bakımı gerçekten fark yaratıyor.

Karakter olarak Pomeranian boyutuyla ters orantılı bir özgüvene sahip: cesur, sesli, hareketli. Havlama eğilimi yüksek, apartman yaşamında erken dönemde yönetilmezse sorun olabiliyor. Yaşam süresi 12-16 yıl.',
   '[{"soru": "Boo ayrı bir köpek ırkı mı?", "cevap": "Hayır. \"Boo\", Pomeranian''ın tüyünün kısa ve yuvarlak traş edilmiş hâline verilen isimdir. Irk Pomeranian''dır; traş uzadıkça köpek normal görünümüne döner."}, {"soru": "Pomeranian tüyü traş edilmeli mi?", "cevap": "Çok kısa traş önerilmez. Çift kat tüyde alt tüy dibinden kesildiğinde bazı köpeklerde eski yoğunluğunda geri çıkmaz. Biçimlendirme tercih edilmelidir."}, {"soru": "Pomeranian neden öksürüyor?", "cevap": "Küçük ırklarda soluk borusu yassılaşması (trakea kollapsı) yaygındır ve kuru, ötücü bir öksürükle görülür. Boyun tasması yerine göğüs tasması kullanılmalı, öksürük sürüyorsa veterinere başvurulmalıdır."}]'::jsonb),
  (132, 'Pug İlanları — Satılık ve Sahiplendirme', 'Pug ilanları: basık burun yapısının getirdiği solunum riski, sıcakta bakım, göz ve kilo sorunları. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Pug 6-8 kg ağırlığında, basık burunlu (brakisefalik) bir ırk. Mizacı ev yaşamına çok uygun; buna karşılık kafa yapısının getirdiği solunum sorunları bu ırkta sahiplenme kararının merkezinde olmalı.',
   'Pug''ın yassı kafa yapısı burun deliklerini ve üst solunum yolunu daraltıyor. Bu, ırkın bir kısmında horlama ve efor sonrası zorlanmış nefes olarak görülüyor; ileri durumlarda cerrahi gerekiyor. Sahiplenmeden önce köpeği kısa bir yürüyüşten sonra izlemek, ilan fotoğrafından çok daha fazla şey söyler. Burun delikleri belirgin biçimde açık olan, yürüyüş sonrası hızla normale dönen bir Pug daha iyi bir başlangıçtır.

Sıcak bu ırk için gerçek bir tehlike. Köpekler serinlemeyi solunumla sağlıyor; dar solunum yolu bunu zorlaştırdığı için Pug yaz aylarında sıcak çarpmasına diğer ırklardan çok daha yatkın. Öğle saatlerinde yürüyüş, kapalı araçta bekletme ve aşırı efor bu ırkta hayati risk taşıyor.

Göz yapısı da dikkat istiyor: gözler öne çıkık ve göz çukuru sığ olduğu için çizilme ve travma riski yüksek. Gözde bulutlanma, kısılma ya da sürekli sulanma ertelenmeden veteriner işi.

Kilo bütün bu sorunları büyütüyor. Pug kilo almaya çok yatkın ve fazla kilo hem solunumu hem eklemleri doğrudan etkiliyor. Bu ırkta ideal kiloyu korumak, bakımın en önemli tek başlığı. Yüzdeki kıvrımların haftada birkaç kez temizlenip kurulanması da deri iltihabını önlüyor.',
   '[{"soru": "Pug neden horlar?", "cevap": "Basık kafa yapısı burun deliklerini ve üst solunum yolunu daraltır. Hafif horlama ırkta yaygındır; ancak dinlenirken zorlanmış nefes, morarma veya efor sonrası uzun süre toparlayamama veteriner değerlendirmesi gerektirir."}, {"soru": "Pug sıcakta nasıl korunur?", "cevap": "Yürüyüşler sabah erken ve akşam geç saatlere alınmalı, kapalı araçta asla bırakılmamalıdır. Bu ırk solunumla serinlemekte zorlandığı için sıcak çarpmasına çok yatkındır."}, {"soru": "Pug''ın yüz kıvrımları nasıl temizlenir?", "cevap": "Haftada birkaç kez nemli bezle silinip mutlaka kurulanmalıdır. Nemli kalan kıvrımlarda deri iltihabı ve koku gelişir."}]'::jsonb),
  (139, 'Sibirya Kurdu (Husky) — Satılık ve Sahiplendirme', 'Sibirya Kurdu (Husky) ilanları: yüksek egzersiz ihtiyacı, kaçma eğilimi, tüy dökümü ve sıcak iklimde bakım. İl ve ilçeye göre inceleyin.',
   'Sibirya Kurdu 20-27 kg ağırlığında, kızak çekmek için yetiştirilmiş bir ırk. Görünüşü nedeniyle çok sahipleniliyor, ihtiyaçları karşılanamadığı için de en sık geri bırakılan ırklardan biri.',
   'Husky bir dayanıklılık köpeği: saatlerce, kilometrelerce koşmak üzere seçilmiş. Günde iki kısa yürüyüş bu ırk için hiçbir şey ifade etmiyor. İhtiyacı karşılanmayan bir Husky uluyor, kazıyor ve kaçıyor — bu üçü ırkın en sık şikayet edilen davranışları ve üçü de aynı nedenden kaynaklanıyor.

Kaçma eğilimi ayrı bir başlık. Husky bahçe çitinin altını kazabiliyor, üstünden tırmanabiliyor ve serbest bırakıldığında geri çağrıya çoğu ırktan daha az yanıt veriyor. Bu ırkta tasmasız gezdirme, güvenli çevrili bir alan dışında ciddi risk. Türkiye''de kaybolan köpek ilanlarında bu ırkın sık görülmesi tesadüf değil.

Tüy dökümü konusunda beklentiyi baştan ayarlamak gerekiyor: yoğun alt tüy yılda iki kez tümüyle atılıyor ve bu dönemde ev günlerce tüy içinde kalıyor. Kalan aylarda döküm ılımlı. Sıcak iklimde tüyü traş etmek yaygın bir hata — alt tüy aynı zamanda yalıtım sağlıyor ve traş güneş yanığı ile ısı düzenleme sorununa yol açıyor.

Mizaç olarak Husky insanla iyi geçiniyor ama bekçilik yapmıyor; yabancıya karşı genellikle dostane. Ekip hâlinde çalışmaya alışkın olduğu için yalnız bırakılmayı diğer ırklardan daha zor kaldırıyor.',
   '[{"soru": "Husky sıcak iklimde yaşayabilir mi?", "cevap": "Yaşayabilir ama önlem ister: gölge, sürekli su, egzersizin serin saatlere alınması. Tüyün traş edilmesi çözüm değildir; alt tüy yalıtım sağlar ve traş ısı düzenlemesini bozar."}, {"soru": "Husky neden kaçar?", "cevap": "Uzun mesafe koşmak için yetiştirilmiş bir ırktır ve enerjisi karşılanmadığında kaçma davranışı gelişir. Çit altını kazabilir, üstünden tırmanabilir; güvenli alan dışında tasmasız gezdirilmemelidir."}, {"soru": "Husky ne kadar egzersiz ister?", "cevap": "Günde en az bir-iki saat yoğun hareket. Yürüyüş tek başına yetmez; koşu, bisiklet eşliği veya çekme sporları gibi dayanıklılık gerektiren etkinlikler uygundur."}]'::jsonb),
  (143, 'Toy Poodle İlanları — Satılık ve Sahiplendirme', 'Toy Poodle ilanları: yavru fiyatları, bakım ve tüy traşı, ırka özgü sağlık riskleri. İl ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
   'Toy Poodle, poodle ailesinin en küçük boyu: 24-28 cm, 2-4 kg. Tüyü dökülmek yerine uzadığı için ev içinde tüy sorunu neredeyse yok, ama bu tüy düzenli bakım istiyor.',
   'Toy Poodle''un tüyü kıl değil, insan saçına benzeyen kıvırcık bir yapıda: dökülmüyor, uzuyor. Bu, ev içinde tüy toplama derdini büyük ölçüde ortadan kaldırıyor. Buna karşılık taranmadığında dipten keçeleşiyor; keçeleşmiş tüy deriyi çekiyor ve traş dışında çözümü kalmıyor. Haftada iki üç kez tarak, 6-8 haftada bir kuaför bu ırkta zorunlu bir gider — sahiplenmeden önce hesaba katın.

"Hipoalerjenik" tanımı bu ırk için sık kullanılıyor ama garanti değil. Alerji tüye değil, tükürük ve deri döküntüsündeki proteinlere karşı gelişiyor; dökülmeyen tüy ortamdaki alerjen miktarını azaltıyor, sıfırlamıyor. Evde alerjisi olan biri varsa, karar vermeden önce köpekle birkaç saat aynı ortamda bulunmayı deneyin.

Irka özgü en yaygın iki sorun diz kapağı kayması (patella luksasyonu) ve ilerleyen yaşta göz merceğinin bulanıklaşması. Küçük ırklarda diş taşı da erken başlıyor. Yavru alırken anne ve babanın diz muayenesinin yapılmış olması, sağlıklı bir hattın en somut göstergesi. Yaşam süresi 12-15 yıl; yani bugün alınan yavru, on beş yıllık bir sorumluluk.

Toy Poodle zeki ve öğrenmeye çok istekli bir ırk; temel itaat eğitimi hızlı ilerliyor. Ama aynı zeka, yalnız bırakıldığında havlama ve eşya kemirme olarak geri dönüyor. Gün boyu evde kimsenin olmadığı bir düzen bu ırk için uygun değil.',
   '[{"soru": "Toy Poodle tüy döker mi?", "cevap": "Kıl dökümü çok azdır; tüy dökülmek yerine uzar. Bu yüzden ev içinde tüy birikmez ama 6-8 haftada bir kuaför ve haftada birkaç kez tarama gerekir. Taranmayan tüy dipten keçeleşir."}, {"soru": "Toy Poodle apartman dairesinde bakılır mı?", "cevap": "Evet, boyutu apartmana uygundur. Ancak günde en az iki kısa yürüyüş ve ev içinde zihinsel uğraş ister; hareketsiz bırakıldığında havlama ve kemirme davranışı gelişir."}, {"soru": "Toy Poodle yavrusu kaç aylıkken annesinden ayrılmalı?", "cevap": "Sekiz haftadan önce ayrılmamalıdır. Bu süre hem bağışıklık hem de sosyalleşme için gereklidir; daha erken ayrılan yavrularda ısırma kontrolü ve ayrılık kaygısı sorunları görülür."}]'::jsonb),
  (146, 'Tekir Kedi İlanları — Ücretsiz Sahiplendirme', 'Tekir kedi sahiplendirme ilanları. Tekir bir ırk değil, tüy desenidir; Türkiye''deki sokak kedilerinin çoğu bu desendedir. İl ve ilçeye göre inceleyin.',
   'Tekir bir ırk değil, bir tüy deseni: alın bölgesindeki "M" işareti ve gövdedeki çizgiler. Türkiye''deki kedilerin büyük bölümü bu desende ve sahiplendirme ilanlarının çoğunluğunu oluşturuyor.',
   'Tekir deseni kedinin ırkını değil, tüyündeki çizgi düzenini anlatıyor. Çizgili (makarel), benekli, alacalı ve halkalı gibi alt biçimleri var; hepsinin ortak işareti alındaki "M". Bu desen ev kedilerinin atası olan yaban kedisinden geliyor, yani en eski kedi görünümü.

Irk kedilerinden farklı olarak tekirlerde belirli bir genetik hastalık eğilimi yok. Dar bir gen havuzundan gelmedikleri için ırk kedilerine göre kalıtsal sorunları daha az görülüyor. Bu, sahiplenme açısından somut bir avantaj.

Türkiye''de tekir kedilerin çoğu sokaktan geliyor. Sahiplenirken sorulacak üç şey var: iç ve dış parazit uygulaması yapıldı mı, karma aşı takvimi başladı mı, kedi FIV/FeLV açısından test edildi mi. Evde başka kedi varsa test özellikle önemli. Sokaktan gelen bir yavruda ilk haftalarda ishal ve göz akıntısı sık görülür; ikisi de tedavi edilebilir ama ihmal edilmemesi gerekir.

Yasal olarak evcil hayvan satışı yalnızca üretim izni olan işletmeler üzerinden yapılabiliyor; bireysel üyeler PetSemti''de yalnızca ücretsiz sahiplendirme ilanı verebiliyor. Tekir ilanlarının tamamına yakınının ücretsiz sahiplendirme olmasının sebebi bu.',
   '[{"soru": "Tekir bir kedi ırkı mı?", "cevap": "Hayır, tekir bir tüy desenidir. Alındaki \"M\" işareti ve gövdedeki çizgilerle tanınır; farklı ırklarda ve karışık kedilerde görülebilir."}, {"soru": "Sokaktan kedi sahiplenirken nelere dikkat etmeliyim?", "cevap": "İç-dış parazit uygulaması, karma aşı takvimi ve FIV/FeLV testi sorulmalıdır. Evde başka kedi varsa test yaptırmadan tanıştırma yapılmamalıdır."}, {"soru": "Tekir kediler ırk kedilerine göre daha mı sağlıklı?", "cevap": "Genellikle evet. Dar bir gen havuzundan seçilim yapılmadığı için ırka özgü kalıtsal hastalıklar tekirlerde daha az görülür."}]'::jsonb),
  (147, 'British Shorthair — Satılık ve Sahiplendirme', 'British Shorthair ilanları: yoğun tüy bakımı, sakin mizaç, kalp taraması (HCM) ve kilo kontrolü. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'British Shorthair 4-8 kg ağırlığında, yoğun ve dik tüylü bir ırk. Sakin mizacı apartman yaşamına çok uygun; buna karşılık hareketsizliğe ve kilo almaya yatkın.',
   'British Shorthair''ın tüyü kısa ama çok yoğun; yüne benzeyen dik bir yapıda ve alt tüyü kalın. Bu yüzden "kısa tüylü kedi bakım istemez" varsayımı bu ırkta geçerli değil: haftada iki üç kez tarama, hem tüy yumaklarını hem de ev içindeki tüyü belirgin biçimde azaltıyor. Mevsim geçişlerinde döküm artıyor.

Mizacı bu ırkın en çok tercih edilme sebebi: sakin, kucakta durmaktan çok yanınızda oturmayı seven, sese ve harekete az tepki veren bir kedi. Çocuklu evlerde ve ilk kez kedi sahiplenenler için kolay bir ırk. Aynı sakinlik hareketsizliğe dönüşebiliyor; oyun ve tırmanma alanı sunulmazsa kilo alımı hızlı oluyor ve bu ırkta obezite yaygın bir sorun.

Sağlık tarafında en önemli başlık hipertrofik kardiyomiyopati (HCM) — kalp kasının kalınlaşması. Bu ırkta bilinen bir risk ve dışarıdan belirti vermeden ilerleyebiliyor. Ciddi üreticiler damızlıklarında ekokardiyografi taraması yaptırıyor; yavru alırken bu taramanın yapılıp yapılmadığını sormak anlamlı bir sorudur. Ayrıca kan grubu B bu ırkta diğer ırklara göre daha sık görülüyor; bu, çiftleştirmede yenidoğan izoeritrolizi riski nedeniyle üreticiyi ilgilendiren bir konu.

Yaşam süresi 12-17 yıl. Yavrunun anneden sekiz haftadan önce ayrılmaması, sosyalleşme ve bağışıklık açısından bu ırkta da geçerli.',
   '[{"soru": "British Shorthair tüy döker mi?", "cevap": "Kısa ama çok yoğun tüylüdür ve döker. Haftada iki üç kez tarama, mevsim geçişlerinde daha sık bakım gerekir."}, {"soru": "British Shorthair kilo almaya yatkın mı?", "cevap": "Evet. Sakin mizacı hareketsizliğe dönüşebildiği için bu ırkta obezite yaygındır. Porsiyon kontrolü, oyun ve tırmanma ünitesi kilo yönetiminin temelidir."}, {"soru": "British Shorthair yavrusu alırken neye dikkat etmeliyim?", "cevap": "Anne-baba için kalp taraması (HCM ekokardiyografi) yapılıp yapılmadığını sorun, yavruyu annesiyle görün ve sekiz haftadan erken teslim almayın."}]'::jsonb),
  (148, 'Scottish Fold — Satılık ve Sahiplendirme', 'Scottish Fold ilanları: kıvrık kulağın genetik nedeni, kıkırdak-eklem riski ve sorumlu eşleştirme. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Scottish Fold''un öne kıvrık kulakları, kıkırdak yapısını etkileyen bir gen mutasyonundan kaynaklanıyor. Bu mutasyon yalnızca kulağı değil, vücuttaki diğer kıkırdakları da ilgilendiriyor — ırkı seçerken bilinmesi gereken en önemli bilgi bu.',
   'Scottish Fold''un kıvrık kulağı estetik bir seçim değil, kıkırdağı yumuşatan bir gen değişiminin görünür sonucu. Aynı gen, bazı kedilerde kuyruk, bilek ve diz eklemlerinde de kıkırdak-kemik gelişim bozukluğuna (osteokondrodisplazi) yol açabiliyor. Bu durum ağrılı olabiliyor ve topallama, atlamaktan kaçınma, kuyruk esnekliğinin azalması gibi belirtiler veriyor.

Bu yüzden sorumlu üretimde iki kıvrık kulaklı kedi asla eşleştirilmiyor. İki kopya geni birden alan yavrularda eklem sorunları erken yaşta ve ağır seyrediyor. Sağlıklı eşleştirme, kıvrık kulaklı bir kediyle dik kulaklı (Scottish Straight) bir kedi arasında yapılıyor. Yavru alırken anne ve babanın kulak tipini sormak, bu ırkta sorulabilecek en yerinde soru. Aynı batında dik kulaklı kardeşlerin bulunması normaldir ve iyi bir işarettir.

Bakım açısından ırk kolay: kısa ya da yarı uzun tüy, haftada birkaç tarama. Kulak kıvrımı kulak kanalının havalanmasını azalttığı için kulak temizliği düzenli yapılmalı. Mizaç sakin, insana yakın, sese az tepkili.

Kedi seçerken atlamakta zorlanma, topallama ya da sert yürüyüş gördüğünüzde bunu yaşa ya da utangaçlığa vermeyin; bu ırkta eklem değerlendirmesi gerektiren bir bulgudur.',
   '[{"soru": "Scottish Fold''un kulakları neden kıvrık?", "cevap": "Kıkırdak yapısını etkileyen bir gen mutasyonu nedeniyle. Aynı mutasyon bazı kedilerde kuyruk, bilek ve diz eklemlerinde gelişim sorununa da yol açabilir."}, {"soru": "İki kıvrık kulaklı Scottish Fold eşleştirilebilir mi?", "cevap": "Hayır. İki kopya geni birden alan yavrularda eklem sorunları erken yaşta ve ağır görülür. Sorumlu eşleştirme kıvrık kulaklı bir kedi ile dik kulaklı (Scottish Straight) bir kedi arasında yapılır."}, {"soru": "Scottish Fold yavrusu alırken ne sormalıyım?", "cevap": "Anne ve babanın kulak tipini sorun; ikisinin de kıvrık kulaklı olması sağlıklı bir eşleştirme değildir. Yavruyu yürürken ve atlarken izleyin, topallama veya atlamaktan kaçınma varsa veteriner değerlendirmesi isteyin."}]'::jsonb),
  (150, 'Van Kedisi İlanları — Satılık ve Sahiplendirme', 'Van kedisi ilanları: elmas göz (heterokromi), suyla ilişkisi, beyaz kedilerde işitme kontrolü ve tüy bakımı. İl ve ilçeye göre inceleyin.',
   'Van kedisi Türkiye''ye özgü, yarı uzun tüylü ve beyaz bir ırk. En bilinen özelliği iki farklı renkteki gözleri; ancak her Van kedisinin gözleri farklı renkte olmak zorunda değil.',
   'Van kedisinin "elmas göz" diye bilinen özelliği heterokromi: bir gözün mavi, diğerinin kehribar olması. Bu, beyaz tüy geniyle birlikte taşınan bir özellik ve ırkın tamamında görülmüyor — iki gözü de kehribar ya da iki gözü de mavi Van kedileri de saf kabul ediliyor.

Beyaz tüy ve mavi gözle birlikte gelen bir konu daha var: bu kombinasyonda iç kulaktaki hücrelerin gelişimi etkilenebiliyor ve doğuştan işitme kaybı görülebiliyor. Tek gözü mavi olan kedilerde kayıp genellikle o taraftaki kulakta oluyor. Sahiplenirken kedinin arkasından gelen sese tepkisini gözlemek basit ama işe yarayan bir kontrol. İşitmeyen bir kedi de gayet iyi bir ev kedisi olur; bilinmesi gereken şey dışarı çıkmasına izin verilmemesi.

Suyla ilişkisi bu ırkın en çok anlatılan özelliği. Van kedilerinin bir bölümünün suya girmekten çekinmediği, hatta yüzdüğü gözlenmiş. Tüyünün suyu itmesi bunu kolaylaştırıyor. Yine de her Van kedisinin yüzmeyi seveceğini beklemek doğru olmaz.

Bakım açısından yarı uzun tüy alt katmanı zayıf olduğu için keçeleşme az; haftada bir iki tarama yeterli. Kışın tüy uzuyor, yazın belirgin biçimde inceliyor. Van kedisi Türkiye''de koruma programlarına konu olan bir ırk; yavru alırken kayıt ve köken bilgisini sormak yerinde olur.',
   '[{"soru": "Her Van kedisinin gözleri farklı renkte midir?", "cevap": "Hayır. İki farklı renkte göz (heterokromi) ırkta sık görülür ama zorunlu değildir; iki gözü de kehribar veya iki gözü de mavi olan Van kedileri de vardır."}, {"soru": "Van kedisi gerçekten yüzer mi?", "cevap": "Bir bölümü suya girmekten çekinmez ve yüzdüğü gözlenmiştir. Tüy yapısı suyu itmeye elverişlidir. Yine de bu, ırkın tamamı için geçerli bir özellik değildir."}, {"soru": "Beyaz ve mavi gözlü kedilerde sağırlık riski var mı?", "cevap": "Beyaz tüy ve mavi gözle birlikte doğuştan işitme kaybı görülebilir; tek mavi gözlü kedilerde kayıp genellikle o taraftaki kulaktadır. Kedinin arkadan gelen sese tepkisini gözlemek basit bir ön kontroldür."}]'::jsonb),
  (151, 'Ankara Kedisi — Satılık ve Sahiplendirme', 'Ankara kedisi ilanları: ipeksi uzun tüy bakımı, heterokromi ve işitme kontrolü, ırkın koruma programı. İl ve ilçeye göre inceleyin.',
   'Ankara kedisi Türkiye''ye özgü, uzun ve ipeksi tüylü bir ırk. Dünyadaki uzun tüylü kedi ırklarının önemli bir bölümünün kökeninde bu kedi var.',
   'Ankara kedisinin tüyü uzun ama alt katmanı zayıf: ipeksi, hafif ve keçeleşmeye Persian gibi ırklardan çok daha az yatkın. Haftada iki üç tarama çoğu kedi için yeterli. Tüy yazın belirgin biçimde inceliyor, kışın özellikle boyun ve kuyrukta yoğunlaşıyor.

Beyaz en bilinen rengi olsa da ırk yalnızca beyaz değil; tekir ve diğer renkler de kabul ediliyor. Van kedisinde olduğu gibi beyaz tüy ve mavi gözün birlikte bulunduğu kedilerde doğuştan işitme kaybı görülebiliyor. Sahiplenirken kedinin göremediği bir yönden gelen sese tepkisini denemek işe yarar.

Mizaç olarak Ankara kedisi hareketli, meraklı ve insana yönelik. Yüksek yerleri seviyor; dolap üstü, raf ve tırmanma ünitesi bu ırkta sadece süs değil, ihtiyaç. Sesi ince ve iletişimi aktif — sessiz bir kedi arayan biri için doğru tercih değil.

Ankara kedisi Türkiye''de koruma programı yürütülen bir ırk; Ankara Hayvanat Bahçesi''ndeki üretim ve koruma çalışması ırkın devamlılığında belirleyici oldu. Yavru alırken kökeni ve kaydı sormak, ırkın sürdürülebilirliği açısından da anlamlı.',
   '[{"soru": "Ankara kedisi sadece beyaz mı olur?", "cevap": "Hayır. Beyaz en bilinen rengidir ama tekir ve diğer renkler de ırk içinde kabul edilir."}, {"soru": "Ankara kedisinin tüyü keçeleşir mi?", "cevap": "Uzun tüylü olmasına rağmen alt katmanı zayıf olduğu için keçeleşmeye az yatkındır. Haftada iki üç tarama çoğu kedi için yeterlidir."}, {"soru": "Ankara kedisi ile Van kedisi aynı mı?", "cevap": "Hayır, ikisi ayrı ırklardır. Ankara kedisi uzun ve ipeksi tüylüdür; Van kedisi yarı uzun tüylü ve tipik olarak baş ile kuyrukta renk taşıyan beyaz bir kedidir."}]'::jsonb),
  (155, 'İran Kedisi (Persian) — Satılık ve Sahiplendirme', 'İran kedisi ilanları: günlük tüy bakımı, basık burun yapısı, göz akıntısı ve böbrek (PKD) taraması. İl ve ilçeye göre inceleyin.',
   'İran kedisi uzun ve yoğun tüylü, basık yüzlü bir ırk. Sakin mizacıyla ev yaşamına çok uygun; buna karşılık günlük tüy bakımı gerektiren, bakımı en zahmetli kedi ırklarından biri.',
   'İran kedisinin tüyü hem uzun hem de alt katmanı yoğun. Bu ikisi bir araya gelince keçeleşme kaçınılmaz oluyor: bir gün atlanan tarama, koltuk altı ve arka bacaklarda düğüme dönüşüyor. Bu ırkta günlük tarama tavsiye değil, gereklilik. Keçeleşmiş tüy deriyi çekiyor, altında iltihap gelişiyor ve çözümü çoğu zaman sedasyon altında traş oluyor.

Basık yüz yapısı (brakisefalik) iki sonuç doğuruyor. Birincisi gözyaşı kanalının kısalması: gözyaşı buruna akmak yerine yüze taşıyor, göz altında sürekli ıslaklık ve kahverengi leke oluşuyor. Bu bölgenin her gün silinip kurulanması gerekiyor. İkincisi solunum: aşırı basık yüzlü hatlarda burun delikleri dar kalıyor ve kedi sıcakta zorlanıyor. Yavru seçerken burun yapısının aşırı basık olmaması, kedinin hayatı boyunca daha rahat nefes alması demek.

Sağlıkta ırka özgü en önemli başlık polikistik böbrek hastalığı (PKD). Genetik testi var ve sorumlu üreticiler damızlıklarını test ettiriyor. Yavru alırken bu testin yapılıp yapılmadığını sormak, bu ırkta en değerli sorulardan biri.

Mizaç sakin ve düşük enerjili; yüksek yerlere tırmanma isteği çoğu ırktan az. Bu, kilo alma riskini artırıyor — porsiyon kontrolü ve oyun bu ırkta ihmal edilmemeli.',
   '[{"soru": "İran kedisinin tüyü ne sıklıkla taranmalı?", "cevap": "Her gün. Uzun tüy ve yoğun alt katman birleşince keçeleşme hızlı gelişir; bir iki gün atlanan bakım koltuk altı ve arka bacaklarda düğüme dönüşür."}, {"soru": "İran kedisinin gözleri neden sürekli sulanıyor?", "cevap": "Basık yüz yapısı gözyaşı kanalını kısaltır; gözyaşı buruna akmak yerine yüze taşar. Göz altının her gün silinip kurulanması gerekir. Aşırı akıntı ve kızarıklık veteriner değerlendirmesi ister."}, {"soru": "İran kedisi yavrusu alırken hangi test sorulmalı?", "cevap": "Polikistik böbrek hastalığı (PKD) genetik testi. Sorumlu üreticiler damızlıklarını test ettirir; testin yapılıp yapılmadığını sormak bu ırkta en önemli sorulardan biridir."}]'::jsonb),
  (163, 'Muhabbet Kuşu İlanları — Satılık ve Sahiplendirme', 'Muhabbet kuşu ilanları: kafes seçimi, beslenme, tek mi çift mi bakılmalı, tüy tozu ve sağlık. İl ve ilçeye göre inceleyin, sahibiyle görüşün.',
   'Muhabbet kuşu kuyrukla birlikte 18 cm boyunda, sürü hâlinde yaşayan bir papağan türü. Türkiye''de en çok beslenen kuş; kolay göründüğü için sık alınıyor, ihtiyaçları çoğu zaman hafife alınıyor.',
   'Muhabbet kuşu doğada büyük sürüler hâlinde yaşayan bir tür. Tek başına bir kafeste, gün boyu kimsenin olmadığı bir evde bu kuş mutlu olmuyor: tüy yolma, sürekli çığlık ve durgunluk bu yalnızlığın belirtileri. İki seçenek var — ya ikinci bir kuş, ya da günün büyük bölümünde insan teması. Ayna bir arkadaş yerine geçmiyor; aksine bazı kuşlarda aynadaki yansımaya besleme davranışı ve takıntı gelişiyor.

Kafes genişliği yükseklikten önemli: bu kuş yukarı tırmanmıyor, yatay uçuyor. Uzun kenarı en az 60 cm olan bir kafes tek kuş için alt sınır. Farklı çaplarda doğal ağaç tüneği ayak sağlığı için gerçekten fark yaratıyor; tek çaplı plastik tünek ayak tabanında yaralara yol açıyor.

Beslenmede yaygın hata sadece darı karışımı vermek. Tohum ağırlıklı beslenme yağlanmaya ve A vitamini eksikliğine yol açıyor. Karışıma sebze (havuç, roka, semizotu), pelet mama ve kalsiyum kaynağı (mürekkep kemiği) eklenmeli. Avokado, çikolata, kafein ve tuz kuşlar için zehirli.

Yaşam süresi bakım kalitesine göre 5-10 yıl. Tüy tozu üreten bir tür olduğu için solunum hassasiyeti olan evlerde havalandırma önemli. Yumurtlayan dişilerde kalsiyum eksikliğine bağlı yumurta tıkanması acil bir durumdur.',
   '[{"soru": "Muhabbet kuşu tek başına bakılır mı?", "cevap": "Bakılabilir ama ancak gün içinde uzun süre insan teması varsa. Sürü hâlinde yaşayan bir türdür; yalnız ve ilgisiz kalan kuşlarda tüy yolma ve sürekli çığlık gelişir. Ayna arkadaş yerine geçmez."}, {"soru": "Muhabbet kuşuna sadece darı vermek yeterli mi?", "cevap": "Yeterli değildir. Yalnızca tohumla beslenme yağlanma ve A vitamini eksikliğine yol açar. Sebze, pelet mama ve mürekkep kemiği eklenmelidir."}, {"soru": "Muhabbet kuşu kafesi nasıl olmalı?", "cevap": "Genişlik yükseklikten önemlidir; bu kuş yatay uçar. Tek kuş için uzun kenarı en az 60 cm olan bir kafes alt sınırdır. Farklı çaplarda doğal ağaç tünek ayak sağlığı için gereklidir."}]'::jsonb),
  (164, 'Sultan Papağanı — Satılık ve Sahiplendirme', 'Sultan papağanı (cockatiel) ilanları: tepelik dili, ıslık öğrenme, tüy tozu ve gece paniği. İl ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
   'Sultan papağanı 30-33 cm boyunda, Avustralya kökenli bir kakadu türü. Muhabbet kuşundan daha büyük, daha sakin ve ortalama 15-20 yıl yaşıyor — yani uzun bir taahhüt.',
   'Sultan papağanının başındaki tepelik yalnızca süs değil, bir iletişim aracı. Dik ve öne eğik tepelik merak, tümüyle yatık tepelik korku ya da tehdit, hafif geride duran tepelik rahatlık anlamına geliyor. Kuşun ruh hâlini okumanın en kolay yolu bu.

Konuşmaktan çok ıslık çalmaya yatkın bir tür; erkekler melodi öğrenmede belirgin biçimde daha başarılı. Kelime öğrenmesi mümkün ama beklenti buraya kurulmamalı.

Bu türe özgü bir konu gece paniği: karanlıkta ani bir sesle ürken kuşun kafes içinde çırpınması. Tüy kırığı ve yaralanmayla sonuçlanabiliyor. Kafesin yanında loş bir gece lambası bırakmak bu riski büyük ölçüde azaltıyor.

Sultan papağanı tüy tozu üreten türlerden; kakadu ailesinin ortak özelliği. Evde solunum hassasiyeti olan biri varsa havalandırma ve düzenli temizlik önem kazanıyor. Beslenmede tohum ağırlıklı diyet yerine pelet mama, sebze ve sınırlı tohum karışımı öneriliyor; yalnız tohumla beslenen kuşlarda yağlanma ve karaciğer sorunu yaygın.

Dişilerde eş olmadan da yumurtlama görülebiliyor. Sürekli yumurtlama kalsiyum kaybına ve yumurta tıkanmasına yol açtığı için ışık süresini kısaltmak ve yuvalık benzeri köşeleri kaldırmak gerekiyor.',
   '[{"soru": "Sultan papağanı konuşur mu?", "cevap": "Kelime öğrenebilir ama asıl yeteneği ıslıktır; özellikle erkekler melodi öğrenmede başarılıdır. Konuşma beklentisiyle sahiplenilmesi önerilmez."}, {"soru": "Sultan papağanı neden gece kafeste çırpınıyor?", "cevap": "Bu türde \"gece paniği\" görülür: karanlıkta ani bir sesle ürken kuş kafes içinde çırpınır ve yaralanabilir. Kafes yanında loş bir gece lambası bırakmak riski büyük ölçüde azaltır."}, {"soru": "Sultan papağanı kaç yıl yaşar?", "cevap": "Bakım koşullarına göre ortalama 15-20 yıl, iyi bakımda daha uzun. Sahiplenme kararı bu süre göz önünde bulundurularak verilmelidir."}]'::jsonb)
) as v(breed_id, seo_title, seo_description, intro, body, faq)
join public.breeds b on b.id = v.breed_id
on conflict (category_id, breed_id, city_id, district_id, service_type) do update
set seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    intro = excluded.intro,
    body = excluded.body,
    faq = excluded.faq,
    updated_at = now();

commit;
