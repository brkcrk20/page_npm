import type { DemoIsletme } from './tipler';

/**
 * Demo işletmeler — yedi hizmet türünde dörder tane.
 *
 * İsimler kasten yaygın kalıplardan uzak tutuldu. Gerçek bir kliniğin
 * adıyla çakışan bir demo kaydı, o kliniğe ait olmayan bilgileri onun
 * adına yayımlamak olurdu. Aynı sebeple telefon, e-posta ve kapı numarası
 * yazılmıyor; adres yalnızca semt ve cadde düzeyinde.
 *
 * Çalışma saatleri gerçekçi: veteriner sabah dokuzda açılıyor, pet oteli
 * pazar günü de çalışıyor, kuaför pazartesi kapalı.
 */

/** Pazartesi 1, pazar 7. Çoğu işletme için ortak kalıplar. */
const HAFTA_ICI_TAM = [1, 2, 3, 4, 5, 6].map((gun) => ({ gun, acilis: '09:00', kapanis: '19:00' }));
const HER_GUN = [1, 2, 3, 4, 5, 6, 7].map((gun) => ({ gun, acilis: '08:30', kapanis: '20:00' }));
const KUAFOR_SAATLERI = [2, 3, 4, 5, 6, 7].map((gun) => ({ gun, acilis: '10:00', kapanis: '19:00' }));

export const DEMO_ISLETMELER: DemoIsletme[] = [
  // --- Veteriner ---
  {
    slug: 'demo-vet-kadikoy',
    tur: 'veteriner',
    ad: 'Semtpati Veteriner Kliniği',
    aciklama:
      'Kadıköy’de küçük hayvan hekimliği üzerine çalışan bir klinik. Aşılama, kısırlaştırma, iç hastalıkları ve diş tedavisi hizmetleri veriyoruz. Kliniğimizde röntgen ve ultrason bulunuyor; laboratuvar tetkiklerinin çoğu aynı gün sonuçlanıyor.\n\nRandevu ile çalışıyoruz, acil vakalar randevusuz kabul edilir. Mikroçip uygulaması ve pet pasaport işlemleri yapılmaktadır.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'Kadıköy, Bağdat Caddesi civarı',
    ozellikler: ['asilama', 'kisirlastirma', 'dis-tedavisi', 'rontgen', 'ultrason', 'laboratuvar', 'mikrocip', 'kedi', 'kopek', 'randevu', 'kredi-karti'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-vet-cankaya',
    tur: 'veteriner',
    ad: 'Yeşilpati Hayvan Hastanesi',
    aciklama:
      'Çankaya’da 7/24 acil servisi bulunan hayvan hastanesi. Cerrahi operasyon, yatılı tedavi ve yoğun bakım ünitemiz mevcut. Gece nöbetinde hekim ve teknisyen bulunuyor.\n\nKedi, köpek ve kemirgenlerin yanında kuş ve sürüngen hastaları da kabul ediyoruz. Otoparkımız ve engelli erişimimiz var.',
    sehir: 'ankara',
    ilce: 'cankaya',
    adres: 'Çankaya, Kızılırmak Mahallesi civarı',
    ozellikler: ['acil-7-24', 'cerrahi', 'yatili-tedavi', 'asilama', 'kisirlastirma', 'laboratuvar', 'rontgen', 'kedi', 'kopek', 'kemirgen', 'kus', 'surungen', 'otopark', 'engelli-erisim'],
    saatler: [1, 2, 3, 4, 5, 6, 7].map((gun) => ({ gun, acilis: '00:00', kapanis: '23:59' })),
  },
  {
    slug: 'demo-vet-karsiyaka',
    tur: 'veteriner',
    ad: 'Körfez Pati Veteriner Kliniği',
    aciklama:
      'Karşıyaka’da aşılama, kısırlaştırma ve koruyucu hekimlik ağırlıklı çalışan bir klinik. Yavru kedi ve köpeklerde aşı takvimi takibi yapıyor, sahiplerine yazılı program veriyoruz.\n\nEvde bakım hizmetimiz de var; yaşlı ve hareket edemeyen hastalar için adrese gidiyoruz.',
    sehir: 'izmir',
    ilce: 'karsiyaka',
    adres: 'Karşıyaka, Bostanlı civarı',
    ozellikler: ['asilama', 'kisirlastirma', 'mikrocip', 'evde-bakim', 'davranis-danismanligi', 'kedi', 'kopek', 'randevu', 'kredi-karti'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-vet-nilufer',
    tur: 'veteriner',
    ad: 'Uludağ Evcil Hayvan Kliniği',
    aciklama:
      'Nilüfer’de kedi ve köpek hekimliğinin yanında egzotik hayvan ve kuş hastalarına da bakan bir klinik. Kanarya, muhabbet kuşu ve papağanlarda solunum yolu hastalıkları üzerine çalışıyoruz.\n\nPet pasaport ve yurt dışı çıkış işlemlerinde belge desteği veriyoruz.',
    sehir: 'bursa',
    ilce: 'nilufer',
    adres: 'Nilüfer, Görükle civarı',
    ozellikler: ['asilama', 'kisirlastirma', 'kus', 'egzotik', 'kemirgen', 'kedi', 'kopek', 'pet-pasaport', 'mikrocip', 'randevu'],
    saatler: HAFTA_ICI_TAM,
  },

  // --- Pet oteli ---
  {
    slug: 'demo-otel-besiktas',
    tur: 'pet_oteli',
    ad: 'Mavi Tasma Pet Oteli',
    aciklama:
      'Beşiktaş’ta kedi ve köpek konaklaması. Her misafirin ayrı odası var; köpekler günde iki kez yürüyüşe çıkarılıyor. Odalarda kamera bulunuyor ve sahipleriyle günlük fotoğraf paylaşıyoruz.\n\nAşı karnesi ve parazit uygulaması olan hayvanları kabul ediyoruz. Uzun konaklamalarda veteriner kontrolü dahildir.',
    sehir: 'istanbul',
    ilce: 'besiktas',
    adres: 'Beşiktaş, Levent civarı',
    ozellikler: ['ozel-oda', 'kamera-takibi', 'gunluk-yuruyus', 'veteriner-destegi', 'mama-dahil', 'kedi', 'kopek', 'klima'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-otel-muratpasa',
    tur: 'pet_oteli',
    ad: 'Portakal Bahçesi Pet Oteli',
    aciklama:
      'Muratpaşa’da bahçeli pet oteli. Köpekler gün içinde çitli bahçede serbest vakit geçiriyor, kedilere ayrı ve sessiz bir bölüm ayrılmış durumda.\n\nTatil dönemlerinde yer hızlı doluyor, önceden rezervasyon öneriyoruz. Havalimanı transferi ücretli olarak sağlanabiliyor.',
    sehir: 'antalya',
    ilce: 'muratpasa',
    adres: 'Muratpaşa, Konyaaltı yolu civarı',
    ozellikler: ['bahceli', 'ozel-oda', 'gunluk-yuruyus', 'transfer', 'yikama', 'kedi', 'kopek', 'otopark'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-otel-selcuklu',
    tur: 'pet_oteli',
    ad: 'Sessiz Pati Konukevi',
    aciklama:
      'Selçuklu’da küçük ölçekli, aynı anda en fazla on hayvan kabul eden bir konukevi. Kalabalık ortamda stres yaşayan hayvanlar için uygundur.\n\nKuş ve kemirgen konaklaması da yapıyoruz; kafesiyle birlikte getirilmesi yeterli. Mama misafirin kendi mamasıysa ek ücret alınmıyor.',
    sehir: 'konya',
    ilce: 'selcuklu',
    adres: 'Selçuklu, Bosna Hersek Mahallesi civarı',
    ozellikler: ['ozel-oda', 'kamera-takibi', 'kus', 'kemirgen', 'kedi', 'kopek', 'mama-dahil'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-otel-atakum',
    tur: 'pet_oteli',
    ad: 'Karadeniz Pati Otel',
    aciklama:
      'Atakum’da deniz kenarına yakın pet oteli. Köpekler için günde iki yürüyüş, kediler için tırmanma üniteli ayrı bölüm bulunuyor.\n\nKonaklama öncesi hayvanın alıştırma ziyaretine gelmesini öneriyoruz; ilk gece stresini belirgin şekilde azaltıyor. Kamera erişimi tüm misafirler için açık.',
    sehir: 'samsun',
    ilce: 'atakum',
    adres: 'Atakum, Denizevleri civarı',
    ozellikler: ['kamera-takibi', 'gunluk-yuruyus', 'ozel-oda', 'kedi', 'kopek', 'klima', 'otopark'],
    saatler: HER_GUN,
  },

  // --- Kuaför ---
  {
    slug: 'demo-kuafor-kadikoy',
    tur: 'kuafor',
    ad: 'Tüylü Dost Pet Kuaför',
    aciklama:
      'Kadıköy’de kedi ve köpek bakımı. Tıraş, yıkama, tırnak kesimi, kulak temizliği ve ölü tüy alma yapıyoruz. Poodle, Maltese ve Pomeranian gibi tüy bakımı isteyen ırklarda düzenli müşterilerimiz var.\n\nRandevu ile çalışıyoruz; hayvanı bırakıp gitmek yerine yanında beklemek isteyen sahipler için oturma alanımız var.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'Kadıköy, Moda civarı',
    ozellikler: ['tiras', 'yikama', 'tirnak-kesimi', 'kulak-temizligi', 'tuy-alma', 'kedi', 'kopek', 'randevu', 'kredi-karti'],
    saatler: KUAFOR_SAATLERI,
  },
  {
    slug: 'demo-kuafor-cankaya',
    tur: 'kuafor',
    ad: 'Fırça Pet Bakım Salonu',
    aciklama:
      'Çankaya’da pet bakım salonu. Parazit banyosu ve diş fırçalama dahil tüm bakım hizmetleri. Kedilerde sakinleştirici kullanmadan, sabırla çalışmayı tercih ediyoruz; bu yüzden randevular geniş aralıklı veriliyor.\n\nEve servis hizmetimiz var, kafes taşımak istemeyen sahipler için uygundur.',
    sehir: 'ankara',
    ilce: 'cankaya',
    adres: 'Çankaya, Ayrancı civarı',
    ozellikler: ['tiras', 'yikama', 'tirnak-kesimi', 'parazit-banyosu', 'dis-fircalama', 'eve-servis', 'kedi', 'kopek', 'randevu'],
    saatler: KUAFOR_SAATLERI,
  },
  {
    slug: 'demo-kuafor-karsiyaka',
    tur: 'kuafor',
    ad: 'Ege Pati Kuaför',
    aciklama:
      'Karşıyaka’da köpek tıraşı ve bakımı. Irka özgü tıraş biçimlerinde deneyimliyiz; poodle, schnauzer ve terrier tıraşlarını standardına uygun yapıyoruz.\n\nİlk gelen hayvanlarda kısa bir tanışma seansı yapıyor, sonra bakıma başlıyoruz. Yaşlı hayvanlarda işlem süresini bölerek uyguluyoruz.',
    sehir: 'izmir',
    ilce: 'karsiyaka',
    adres: 'Karşıyaka, Çarşı civarı',
    ozellikler: ['tiras', 'yikama', 'tuy-alma', 'tirnak-kesimi', 'kopek', 'kedi', 'randevu', 'kredi-karti'],
    saatler: KUAFOR_SAATLERI,
  },
  {
    slug: 'demo-kuafor-sahinbey',
    tur: 'kuafor',
    ad: 'Pati Spa Bakım Merkezi',
    aciklama:
      'Şahinbey’de kedi ve köpek bakım merkezi. Yıkama, tıraş, tırnak ve kulak bakımının yanında düğümlenmiş tüylerin açılması üzerine çalışıyoruz.\n\nKeçeleşmiş tüyde tıraş dışında çözüm olmadığı durumları sahibiyle konuşarak karar veriyoruz; hayvanın derisini zorlayacak müdahale yapmıyoruz.',
    sehir: 'gaziantep',
    ilce: 'sahinbey',
    adres: 'Şahinbey, İncilipınar civarı',
    ozellikler: ['tiras', 'yikama', 'tuy-alma', 'kulak-temizligi', 'tirnak-kesimi', 'kedi', 'kopek', 'kredi-karti'],
    saatler: KUAFOR_SAATLERI,
  },

  // --- Pet taksi ---
  {
    slug: 'demo-taksi-istanbul',
    tur: 'pet_taksi',
    ad: 'Pati Yol Pet Taksi',
    aciklama:
      'İstanbul içi ve şehirlerarası evcil hayvan taşıma. Araçlarımız klimalı, taşıma kabinleri mevcut. Veterinere gidiş-dönüş, havalimanı transferi ve taşınma desteği veriyoruz.\n\nHayvanın yanında sahibi olmadan da taşıma yapıyoruz; bu durumda yol boyunca konum ve fotoğraf paylaşıyoruz.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'İstanbul geneli hizmet',
    ozellikler: ['sehir-ici', 'sehirlerarasi', 'havalimani', 'veteriner-transfer', 'klimali-arac', 'tasima-kabini', 'kedi', 'kopek'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-taksi-ankara',
    tur: 'pet_taksi',
    ad: 'Başkent Pet Ulaşım',
    aciklama:
      'Ankara içi evcil hayvan taşıma hizmeti. Acil durumlar için 7/24 ulaşılabiliriz; gece veteriner nakli en sık verdiğimiz hizmet.\n\nBüyük ırk köpekler için uygun araç ve kabinimiz var. Refakatçi talebiyle de çalışıyoruz.',
    sehir: 'ankara',
    ilce: 'cankaya',
    adres: 'Ankara geneli hizmet',
    ozellikler: ['sehir-ici', 'acil-7-24', 'veteriner-transfer', 'buyuk-irk', 'klimali-arac', 'refakatci', 'kedi', 'kopek'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-taksi-izmir',
    tur: 'pet_taksi',
    ad: 'Körfez Pet Taksi',
    aciklama:
      'İzmir ve çevre ilçelerde evcil hayvan taşıma. Kuş ve kemirgen taşımasında kafesin sabitlenmesi ve hava akımına karşı korunması konusunda dikkatliyiz.\n\nŞehirlerarası taleplerde güzergâh ve mola planını önceden paylaşıyoruz.',
    sehir: 'izmir',
    ilce: 'karsiyaka',
    adres: 'İzmir geneli hizmet',
    ozellikler: ['sehir-ici', 'sehirlerarasi', 'kus', 'kedi', 'kopek', 'tasima-kabini', 'klimali-arac'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-taksi-antalya',
    tur: 'pet_taksi',
    ad: 'Akdeniz Pati Transfer',
    aciklama:
      'Antalya merkez ve havalimanı transferleri. Tatil dönemlerinde otel–havalimanı arası evcil hayvan taşımada yoğun çalışıyoruz.\n\nUçuş öncesi kabin ölçüleri ve havayolu kuralları konusunda bilgi veriyoruz; bu kurallar havayoluna göre değiştiği için önceden konuşmak gerekiyor.',
    sehir: 'antalya',
    ilce: 'muratpasa',
    adres: 'Antalya geneli hizmet',
    ozellikler: ['havalimani', 'sehir-ici', 'sehirlerarasi', 'tasima-kabini', 'klimali-arac', 'kedi', 'kopek', 'kredi-karti'],
    saatler: HER_GUN,
  },

  // --- Gezdirici ---
  {
    slug: 'demo-gezdirici-kadikoy',
    tur: 'gezdirici',
    ad: 'Adım Adım Köpek Gezdirme',
    aciklama:
      'Kadıköy ve çevresinde köpek gezdirme. Birebir yürüyüş yapıyorum; grup yürüyüşünde köpeklerin birbirini tanıması ve uyumu zaman aldığı için sadece uygun köpeklerle grup oluşturuyorum.\n\nYürüyüş boyunca canlı konum paylaşıyor, dönüşte kısa bir not ve fotoğraf gönderiyorum.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'Kadıköy ve çevresi',
    ozellikler: ['birebir-yuruyus', 'konum-paylasimi', 'fotograf-raporu', 'kucuk-irk', 'orta-irk', 'sigortali', 'referansli'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-gezdirici-cankaya',
    tur: 'gezdirici',
    ad: 'Tasma Ucu Gezdirme Hizmeti',
    aciklama:
      'Çankaya’da köpek gezdirme ve gün içi bakım. Ofiste çalışan sahipler için öğle arası yürüyüşü en çok tercih edilen hizmet.\n\nBüyük ırklarla çalışıyorum; çekme alışkanlığı olan köpeklerde göğüs tasmasına geçilmesini öneriyor, gerekirse birlikte alıştırıyoruz.',
    sehir: 'ankara',
    ilce: 'cankaya',
    adres: 'Çankaya ve çevresi',
    ozellikler: ['birebir-yuruyus', 'gunluk-bakim', 'evde-besleme', 'buyuk-irk', 'orta-irk', 'sertifikali', 'referansli'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-gezdirici-nilufer',
    tur: 'gezdirici',
    ad: 'Yeşil Rota Köpek Gezdirme',
    aciklama:
      'Nilüfer’de park ve yeşil alan güzergâhlarında köpek gezdirme. Yaşlı ve eklem sorunu olan köpekler için kısa ve düz güzergâhlar planlıyorum.\n\nSahibi seyahatteyken evde besleme ve su takibi de yapıyorum. Referans verebilirim.',
    sehir: 'bursa',
    ilce: 'nilufer',
    adres: 'Nilüfer ve çevresi',
    ozellikler: ['birebir-yuruyus', 'grup-yuruyusu', 'evde-besleme', 'kucuk-irk', 'orta-irk', 'referansli'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-gezdirici-karsiyaka',
    tur: 'gezdirici',
    ad: 'Sahil Yürüyüşü Pet Bakım',
    aciklama:
      'Karşıyaka sahil bandında köpek gezdirme. Sabah erken ve akşamüstü saatlerde, yaz aylarında asfaltın ısınmadığı saatlerde yürüyüş yapıyorum.\n\nKöpeğin tasma alışkanlığına göre güzergâh ve süre belirliyoruz. Sigortalı çalışıyorum.',
    sehir: 'izmir',
    ilce: 'karsiyaka',
    adres: 'Karşıyaka sahil ve çevresi',
    ozellikler: ['birebir-yuruyus', 'konum-paylasimi', 'fotograf-raporu', 'orta-irk', 'buyuk-irk', 'sigortali'],
    saatler: HAFTA_ICI_TAM,
  },

  // --- Eğitmen ---
  {
    slug: 'demo-egitmen-istanbul',
    tur: 'egitmen',
    ad: 'Sakin Pati Köpek Eğitimi',
    aciklama:
      'İstanbul’da temel itaat ve davranış problemleri üzerine çalışıyorum. Ceza yerine ödül temelli yöntem kullanıyorum; korkuyla öğretilen davranış, korku ortadan kalkınca kayboluyor.\n\nEn sık gelen konular: tasma çekme, kapıya havlama, yalnız kalma kaygısı. İlk görüşme evde yapılıyor, program köpeğe göre çıkarılıyor.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'İstanbul Anadolu yakası',
    ozellikler: ['temel-itaat', 'davranis-problemi', 'ayrilik-kaygisi', 'yavru-sosyallesme', 'evde-ders', 'sertifikali'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-egitmen-ankara',
    tur: 'egitmen',
    ad: 'Komut Köpek Eğitim Merkezi',
    aciklama:
      'Ankara’da temel itaat, tuvalet eğitimi ve yavru sosyalleşme programları. Grup dersleri hafta sonu, birebir dersler hafta içi yapılıyor.\n\nSaldırganlık vakalarında önce veteriner kontrolü istiyoruz: ağrı kaynaklı davranış değişikliği eğitimle çözülmüyor.',
    sehir: 'ankara',
    ilce: 'cankaya',
    adres: 'Çankaya ve çevresi',
    ozellikler: ['temel-itaat', 'tuvalet-egitimi', 'yavru-sosyallesme', 'grup-dersi', 'evde-ders', 'sertifikali'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-egitmen-izmir',
    tur: 'egitmen',
    ad: 'Ege Köpek Davranış Danışmanlığı',
    aciklama:
      'İzmir’de davranış danışmanlığı. Ayrılık kaygısı ve aşırı havlama üzerine yoğunlaşıyorum; bu iki konu birbirine bağlı çıkıyor ve çoğu zaman köpeğin gün içi rutininin düzenlenmesiyle çözülüyor.\n\nOnline danışmanlık da veriyorum; ilk değerlendirme için video kaydı yeterli oluyor.',
    sehir: 'izmir',
    ilce: 'karsiyaka',
    adres: 'İzmir geneli',
    ozellikler: ['davranis-problemi', 'ayrilik-kaygisi', 'online-ders', 'evde-ders', 'temel-itaat', 'sertifikali'],
    saatler: HAFTA_ICI_TAM,
  },
  {
    slug: 'demo-egitmen-bursa',
    tur: 'egitmen',
    ad: 'Uludağ Köpek Eğitim',
    aciklama:
      'Bursa’da temel itaat ve koruma eğitimi. Çoban ve koruma ırklarıyla çalışma deneyimim var; bu ırklarda amaç itaatten çok net sınırlar ve öngörülebilir bir düzen kurmak.\n\nYatılı eğitim veriyorum ancak sahibin de programa katılmasını şart koşuyorum: köpek eğitmenle öğrendiğini sahibiyle sürdürmezse davranış geri dönüyor.',
    sehir: 'bursa',
    ilce: 'nilufer',
    adres: 'Nilüfer ve çevresi',
    ozellikler: ['temel-itaat', 'koruma-egitimi', 'yatili-egitim', 'davranis-problemi', 'evde-ders'],
    saatler: HAFTA_ICI_TAM,
  },

  // --- Petshop ---
  {
    slug: 'demo-petshop-kadikoy',
    tur: 'petshop',
    ad: 'Semt Pet Market',
    aciklama:
      'Kadıköy’de mama, kum, oyuncak ve bakım ürünleri. Veteriner mamalarında (böbrek, karaciğer, alerji) geniş çeşidimiz var; reçeteli mamalarda stok durumunu telefonla teyit etmenizi öneririz.\n\nSemt içi aynı gün teslimat yapıyoruz. Canlı hayvan satışı yapmıyoruz.',
    sehir: 'istanbul',
    ilce: 'kadikoy',
    adres: 'Kadıköy, Caferağa civarı',
    ozellikler: ['mama', 'kum', 'oyuncak', 'bakim-urunu', 'veteriner-mama', 'ayni-gun-teslimat', 'kredi-karti'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-petshop-selcuklu',
    tur: 'petshop',
    ad: 'Kanat Pet Akvaryum ve Kuş',
    aciklama:
      'Selçuklu’da akvaryum ve kuş malzemeleri üzerine uzmanlaşmış işletme. Akvaryum kurulumu, filtre ve ısıtıcı seçimi konusunda destek veriyoruz.\n\nKuş kafesi, yemlik, tünek ve kuluçka malzemeleri bulunmaktadır. Akvaryum canlıları için karantina uygulamamız var.',
    sehir: 'konya',
    ilce: 'selcuklu',
    adres: 'Selçuklu, Bosna Hersek Mahallesi civarı',
    ozellikler: ['akvaryum', 'kus-malzeme', 'mama', 'oyuncak', 'bakim-urunu', 'online-siparis', 'kredi-karti'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-petshop-muratpasa',
    tur: 'petshop',
    ad: 'Akdeniz Pet Store',
    aciklama:
      'Muratpaşa’da mama, tasma, taşıma çantası ve bakım ürünleri. Kuaför hizmetimiz de var; alışverişle birlikte randevu alabilirsiniz.\n\nMama alışverişinde açık tartı yerine kapalı ambalaj öneriyoruz: açıkta bekleyen mamanın yağı okside oluyor ve besin değeri düşüyor.',
    sehir: 'antalya',
    ilce: 'muratpasa',
    adres: 'Muratpaşa, Işıklar civarı',
    ozellikler: ['mama', 'tasma-kayis', 'bakim-urunu', 'oyuncak', 'kuafor-hizmeti', 'kredi-karti', 'otopark'],
    saatler: HER_GUN,
  },
  {
    slug: 'demo-petshop-atakum',
    tur: 'petshop',
    ad: 'Karadeniz Pet Malzeme',
    aciklama:
      'Atakum’da pet malzemeleri ve mama satışı. Kedi kumunda bentonit, silika ve bitkisel seçeneklerin farkını anlatıp kullanım alışkanlığınıza uygun olanı öneriyoruz.\n\nOnline sipariş ve şehir içi teslimat yapıyoruz. Canlı hayvan satışımız yoktur.',
    sehir: 'samsun',
    ilce: 'atakum',
    adres: 'Atakum, Denizevleri civarı',
    ozellikler: ['mama', 'kum', 'bakim-urunu', 'oyuncak', 'online-siparis', 'ayni-gun-teslimat', 'kredi-karti'],
    saatler: HER_GUN,
  },
];
