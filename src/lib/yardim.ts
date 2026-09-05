import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bird,
  Building2,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Search,
  ShieldCheck,
  Timer,
  UserCheck,
} from 'lucide-react';

/**
 * Yardım Merkezi içeriği.
 *
 * İçerik neden veritabanında değil: rehber yazıları ve kategori metinleri
 * editoryal, yani üründen bağımsız değişiyor — onlar panelden yazılıyor.
 * Yardım metni ise ürünün DAVRANIŞINI anlatıyor. Kural değiştiğinde metnin
 * de aynı anda değişmesi gerekiyor; ikisi ayrı yerde durursa metin sessizce
 * yanlışa düşer ve kimse fark etmez. Kodda durduğu için kuralı değiştiren
 * commit metni de değiştirmek zorunda kalıyor.
 *
 * Sayılar (fotoğraf sınırı, ilan süresi) yönetim ayarlarından geliyor;
 * burada elle yazılsalardı panelden değiştirilen bir ayar yardım sayfasını
 * yalancı çıkarırdı.
 */

export type YardimAyarlari = {
  maxPhotos: number;
  durationDays: number;
};

export type YardimSorusu = { soru: string; cevap: string };

export type YardimYazisi = {
  slug: string;
  baslik: string;
  /** Liste kartında ve meta açıklamada kullanılıyor. */
  ozet: string;
  icon: LucideIcon;
  /** Paragraflar. */
  govde: (a: YardimAyarlari) => string[];
  sorular?: (a: YardimAyarlari) => YardimSorusu[];
  /** Sayfa içinden yönlendirilecek yerler. */
  baglantilar?: { label: string; href: string }[];
};

export type YardimGrubu = {
  slug: string;
  ad: string;
  aciklama: string;
  yazilar: YardimYazisi[];
};

export const YARDIM_GRUPLARI: YardimGrubu[] = [
  {
    slug: 'ilan-verme',
    ad: 'İlan Verme',
    aciklama: 'İlan açmak, düzenlemek, süresini yönetmek ve kaldırılma sebepleri.',
    yazilar: [
      {
        slug: 'ilan-nasil-verilir',
        baslik: 'İlan nasıl verilir?',
        ozet: 'Bölüm seçiminden yayına kadar ilan verme adımları.',
        icon: FileText,
        govde: (a) => [
          'PetSemti’de her bölümün kendi ilan formu var. Üst menüden ya da bulunduğunuz sayfadaki "İlan Ver" düğmesinden başlıyorsunuz; hangi sayfadaysanız form o bölüme kilitli açılıyor. Sahiplendirme sayfasından basınca sahiplendirme formu, güvercin sayfasından basınca güvercin formu geliyor. Böylece kategoriyi tekrar seçmeniz gerekmiyor ve ilan yanlış bölüme düşmüyor.',
          'Form üç bölümden oluşuyor: ilanın kendisi (başlık, açıklama, tür ve cins), hayvana ya da ürüne ait bilgiler (yaş, cinsiyet, aşı durumu; malzemede ürün durumu) ve konum. Konum il ve ilçe olarak soruluyor; açık adres istenmiyor ve ilanda gösterilmiyor.',
          `Fotoğraf en fazla ${a.maxPhotos} adet. Yüklerken otomatik küçültülüp WebP’ye çevriliyor, ilk fotoğraf kapak oluyor. Fotoğrafın tamamı ilan sayfasında görünüyor; kırpılmıyor.`,
          'İlan verebilmek için üye olmanız gerekiyor. Üyelik ücretsiz ve ilan vermek de ücretsiz.',
        ],
        sorular: (a) => [
          {
            soru: 'İlan vermek ücretli mi?',
            cevap: 'Hayır. Üyelik de ilan vermek de ücretsiz. Şu anda sitede ücretli bir paket satışı yapılmıyor.',
          },
          {
            soru: 'İlanım ne zaman yayına girer?',
            cevap: 'İlanlar kurallara uygun olduğu sürece kaydettiğiniz anda yayına giriyor. Şikayet gelen ya da kural ihlali tespit edilen ilanlar sonradan incelemeye alınabiliyor.',
          },
          {
            soru: 'Kaç fotoğraf ekleyebilirim?',
            cevap: `En fazla ${a.maxPhotos} fotoğraf. Fotoğraf sayısı ilana gelen mesaj sayısını doğrudan etkiliyor; hayvanın tamamının göründüğü, gündüz ışığında çekilmiş en az üç dört fotoğraf öneriyoruz.`,
          },
        ],
        baglantilar: [
          { label: 'İlan verme kuralları', href: '/ilan-kurallari' },
          { label: 'Hemen ilan ver', href: '/ilan-ver' },
        ],
      },
      {
        slug: 'neden-satilik-ilan-veremiyorum',
        baslik: 'Neden satılık ilan veremiyorum?',
        ozet: 'Bireysel üyeler yalnızca ücretsiz sahiplendirme ilanı verebiliyor. Sebebi ve istisnası.',
        icon: AlertTriangle,
        govde: () => [
          '5199 sayılı Hayvanları Koruma Kanunu’nda 2021’de yapılan değişiklikle kedi, köpek ve gelinciklerin satışı yalnızca üretim izni bulunan işletmeler üzerinden yapılabiliyor. 14 Temmuz 2022’den beri bu hayvanlar pet shop vitrinlerinde satılamıyor. Bireysel bir kişinin hayvan satması bu düzenlemenin dışında kalıyor.',
          'PetSemti bu kuralı sisteme gömdü: bireysel hesaplarda hayvan ilanı yalnızca ücretsiz sahiplendirme olarak açılabiliyor, fiyat alanı görünmüyor. Kurala uymayan bir ilan formda değil, veritabanı seviyesinde engelleniyor — yani arayüzü aşarak da açılamıyor.',
          'Üretim izni olan çiftlik, kennel ve katteriler kurumsal hesap açarak satılık ilan verebiliyor. Kurumsal hesap için işletme bilgileri ve vergi numarası isteniyor.',
          'İki istisna var. Birincisi güvercin: güvercin kanun kapsamındaki "ev hayvanı" tanımına girmediği için bireysel üyeler güvercin alım satım ilanı verebiliyor. İkincisi pet malzemeleri: ikinci el kafes, akvaryum, tasma gibi ürünleri herkes satabiliyor.',
        ],
        sorular: () => [
          {
            soru: 'Yavrularımı satmak istiyorum, ne yapmalıyım?',
            cevap: 'Hayvan satışı üretim izni gerektiriyor. İzniniz varsa kurumsal hesap açarak satılık ilan verebilirsiniz. İzniniz yoksa yalnızca ücretsiz sahiplendirme ilanı verebilirsiniz.',
          },
          {
            soru: 'Sahiplendirme ilanında ücret isteyebilir miyim?',
            cevap: 'Hayır. Sahiplendirme ilanında ücret, "aşı masrafı", "kapora" veya başka bir ad altında para talep edilmesi yasak. Böyle bir durumla karşılaşırsanız ilanı bildirin.',
          },
          {
            soru: 'Güvercin ilanına neden fiyat yazabiliyorum?',
            cevap: 'Güvercin, kanunun ev hayvanı tanımı dışında kaldığı için satış kısıtlaması güvercinlere uygulanmıyor. Güvercin bölümünde bireysel üyeler de alım satım ilanı verebiliyor.',
          },
        ],
        baglantilar: [
          { label: 'Kurumsal hesap nedir?', href: '/yardim/kurumsal-hesap' },
          { label: 'İlan verme kuralları', href: '/ilan-kurallari' },
        ],
      },
      {
        slug: 'ilan-suresi-ve-yenileme',
        baslik: 'İlanım ne kadar yayında kalır?',
        ozet: 'İlan süresi, süre dolunca ne olduğu ve ilanı yeniden yayına alma.',
        icon: Timer,
        govde: (a) => [
          `İlanlar yayına girdikten sonra ${a.durationDays} gün boyunca listelerde görünüyor. Kalan süreyi ilan sayfasında ve "İlanlarım" bölümünde görebiliyorsunuz.`,
          'Süre dolduğunda ilan silinmiyor, yayından kalkıyor. İlanlarım sayfasından tek tıkla yeniden yayına alabiliyorsunuz; fotoğraflar ve tüm bilgiler duruyor.',
          'Dostunuz yuva bulduğunda ya da ürün satıldığında ilanı kapatmanız önemli. Yayında kalan eski ilan hem size gereksiz mesaj getiriyor hem de arayan kişinin vaktini alıyor.',
        ],
        sorular: (a) => [
          {
            soru: 'Süresi dolan ilanım silindi mi?',
            cevap: `Hayır. ${a.durationDays} gün sonunda ilan yalnızca yayından kalkıyor; İlanlarım sayfasında duruyor ve tek tıkla yeniden yayınlanabiliyor.`,
          },
          {
            soru: 'İlanımı nasıl kapatırım?',
            cevap: 'Profil > İlanlarım bölümünden ilanın yanındaki menüden yayından kaldırabilirsiniz. Yuva bulan ya da satılan ilanları kapatmanız hem sizin hem arayanların işini kolaylaştırır.',
          },
          {
            soru: 'İlanımı düzenleyebilir miyim?',
            cevap: 'Evet. İlanlarım sayfasından fotoğraf, açıklama, fiyat ve konum dahil her alanı düzenleyebilirsiniz. Başlığı değiştirdiğinizde ilanın adresi de güncelleniyor, eski adres yeni adrese yönlendiriliyor.',
          },
        ],
        baglantilar: [{ label: 'İlanlarım', href: '/profil/ilanlarim' }],
      },
      {
        slug: 'fotograf-ve-video',
        baslik: 'Fotoğraf ve video kuralları',
        ozet: 'Kaç fotoğraf, hangi boyutta, video nasıl eklenir ve hangi görseller kabul edilmiyor.',
        icon: ImageIcon,
        govde: (a) => [
          `Bir ilana en fazla ${a.maxPhotos} fotoğraf ekleyebiliyorsunuz. Yükleme sırasında fotoğraflar otomatik küçültülüp WebP biçimine çevriliyor; telefondan çektiğiniz büyük dosyaları küçültmenize gerek yok.`,
          'İlk fotoğraf kapak oluyor: listelerde, arama sonuçlarında ve paylaşımlarda görünen fotoğraf bu. Kapak için hayvanın tamamının göründüğü, net ve aydınlık bir kare seçin.',
          'Video ekleyebiliyorsunuz. Özellikle güvercinde uçuş ve takla, köpekte yürüyüş görüntüsü ilana olan ilgiyi belirgin biçimde artırıyor — fotoğraf hayvanın nasıl göründüğünü, video nasıl olduğunu anlatıyor.',
          'İnternetten alınmış görseller, başka ilanlardan kopyalanmış fotoğraflar, üzerinde telefon numarası ya da başka site adı yazan görseller kabul edilmiyor. Bu tür ilanlar uyarı yapılmadan kaldırılıyor.',
        ],
        sorular: () => [
          {
            soru: 'Fotoğrafımın üzerine telefon numaramı yazabilir miyim?',
            cevap: 'Hayır. Görsel üzerine iletişim bilgisi, filigran ya da başka site adı yazılamaz. İletişim bilgileriniz zaten ilan sayfasında üyelere gösteriliyor.',
          },
          {
            soru: 'Fotoğraflar neden kırpılmıyor?',
            cevap: 'İlan fotoğraflarının çoğu telefonla dikey çekiliyor. Kırpma yapıldığında hayvanın kafası ya da patileri kadraj dışında kalıyordu; artık fotoğrafın tamamı gösteriliyor, kenarda kalan boşluk fotoğrafın bulanık bir kopyasıyla dolduruluyor.',
          },
        ],
      },
      {
        slug: 'ilanim-neden-kaldirildi',
        baslik: 'İlanım neden yayından kaldırıldı?',
        ozet: 'En sık kaldırılma sebepleri ve itiraz yolu.',
        icon: AlertTriangle,
        govde: () => [
          'İlanlar kural ihlali nedeniyle yayından kaldırılabiliyor. En sık görülen sebepler: sahiplendirme ilanında ücret talep edilmesi, yasaklı ırka ait ilan açılması, sekiz haftalıktan küçük yavru ilanı, internetten alınmış fotoğraf kullanılması, ilan başlığında ya da açıklamasında başka site veya iletişim yönlendirmesi bulunması.',
          '5199 sayılı kanun uyarınca bazı ırkların satışı, sahiplendirilmesi, takası ve üretimi yasak. Bu ırklara ait ilan sistem tarafından hiç kabul edilmiyor. Güncel liste ilan verme kuralları sayfasında yer alıyor.',
          'Yavrunun anneden ayrılma yaşı da bir kaldırma sebebi: sekiz haftadan küçük kedi ve köpek yavrusu için ilan açılamıyor. Bu süre hem bağışıklık hem de sosyalleşme için gerekli.',
          'İlanınızın haksız yere kaldırıldığını düşünüyorsanız iletişim sayfasından ilan numarasıyla birlikte yazın; kaydı inceleyip size dönüyoruz.',
        ],
        baglantilar: [
          { label: 'İlan verme kuralları', href: '/ilan-kurallari' },
          { label: 'İletişim', href: '/iletisim' },
        ],
      },
    ],
  },
  {
    slug: 'hesap',
    ad: 'Hesap ve Güvenlik',
    aciklama: 'Üyelik, kimlik doğrulama, onaylı rozeti ve kurumsal hesap.',
    yazilar: [
      {
        slug: 'onayli-kullanici-rozeti',
        baslik: 'Onaylı kullanıcı rozeti ne anlama geliyor?',
        ozet: 'Rozetin ne söylediği, ne söylemediği ve nasıl alındığı.',
        icon: UserCheck,
        govde: () => [
          'Profilinde onaylı rozeti bulunan bir kullanıcı, kimliğini PetSemti’ye doğrulatmış demek. Bireysel hesaplarda T.C. kimlik numarası, kurumsal hesaplarda vergi numarası ve işletme unvanı üzerinden yapılıyor.',
          'Rozet kişinin kim olduğunu doğruluyor; ilanın doğruluğunu ya da hayvanın sağlığını garanti etmiyor. Onaylı bir satıcıyla da görüşürken aynı dikkati göstermeniz gerekiyor: hayvanı yerinde görün, anneyi sorun, aşı karnesini isteyin.',
          'Rozetin asıl işlevi hesap verebilirlik: kimliği doğrulanmış bir kullanıcı, sorun çıktığında arkasına saklanacağı bir anonimliğe sahip değil.',
          'Doğrulama zorunlu değil, ilan vermek için gerekmiyor. Profil > Hesap bölümünden başvurabilirsiniz; başvurular yönetim tarafından inceleniyor.',
        ],
        sorular: () => [
          {
            soru: 'Doğrulama yapmazsam ilan veremez miyim?',
            cevap: 'Verebilirsiniz. Kimlik doğrulama şu anda zorunlu değil; yalnızca profilinizde onaylı rozeti görünmesini sağlıyor.',
          },
          {
            soru: 'Kimlik numaram ilanımda görünür mü?',
            cevap: 'Hayır. Kimlik ve vergi numarası yalnızca doğrulama için kullanılıyor, hiçbir sayfada görünmüyor ve diğer kullanıcılara gösterilmiyor.',
          },
        ],
        baglantilar: [{ label: 'Hesap ayarları', href: '/profil/hesap' }],
      },
      {
        slug: 'kurumsal-hesap',
        baslik: 'Kurumsal hesap nedir, nasıl açılır?',
        ozet: 'Çiftlik, kennel, katteri ve işletmeler için hesap türü.',
        icon: Building2,
        govde: () => [
          'Kurumsal hesap, üretim izni bulunan çiftlik, kennel ve katteriler ile veteriner, pet oteli, kuaför gibi hizmet işletmeleri için. Bireysel hesaptan farkı satılık ilan verebilmesi ve hizmet rehberinde işletme sayfasına sahip olabilmesi.',
          'Kurumsal hesap açarken işletme unvanı ve vergi numarası isteniyor. Bu bilgiler doğrulandığında hesap kurumsal olarak işaretleniyor ve ilan formunda fiyat alanı açılıyor.',
          'Hizmet rehberine eklenen işletmeler kendi sayfalarına logo, fotoğraf, çalışma saatleri ve sundukları hizmetleri ekleyebiliyor. İşletme sayfası il ve ilçe bazında listeleniyor.',
        ],
        baglantilar: [
          { label: 'İşletmenizi ekleyin', href: '/veteriner/kayit' },
          { label: 'Hesap ayarları', href: '/profil/hesap' },
        ],
      },
      {
        slug: 'sifre-ve-hesap-erisimi',
        baslik: 'Şifremi unuttum, hesabımı nasıl silerim?',
        ozet: 'Şifre sıfırlama, e-posta değişikliği ve hesap silme.',
        icon: ShieldCheck,
        govde: () => [
          'Şifrenizi unuttuysanız giriş ekranındaki "Şifremi unuttum" bağlantısını kullanın. Kayıtlı e-posta adresinize sıfırlama bağlantısı gönderiliyor; bağlantı sınırlı süre geçerli.',
          'E-posta adresinizi ve şifrenizi Profil > Hesap bölümünden değiştirebilirsiniz. Şifre değişikliğinde mevcut şifreniz soruluyor.',
          'Hesabınızı Profil > Hesap bölümünün en altındaki "Üyeliği Sonlandır" alanından kendiniz silebilirsiniz. Onay için silme cümlesini yazmanız isteniyor. Hesap silindiğinde ilanlarınız, fotoğraflarınız, mesajlarınız ve favorileriniz de kalıcı olarak kaldırılıyor; işlem geri alınamıyor.',
        ],
        baglantilar: [
          { label: 'Şifremi unuttum', href: '/sifremi-unuttum' },
          { label: 'Hesap ayarları', href: '/profil/hesap' },
        ],
      },
    ],
  },
  {
    slug: 'iletisim-ve-guvenlik',
    ad: 'İletişim ve Güvenlik',
    aciklama: 'Mesajlaşma, telefon görünürlüğü, dolandırıcılıktan korunma ve şikayet.',
    yazilar: [
      {
        slug: 'telefon-numaram-kime-gorunuyor',
        baslik: 'Telefon numaram kime görünüyor?',
        ozet: 'Numaranın kimlere açık olduğu ve nasıl gizlendiği.',
        icon: ShieldCheck,
        govde: () => [
          'İlan sayfasında telefon numarası doğrudan yazılmıyor. Ziyaretçi "Telefonu Göster" düğmesine bastığında numara sunucudan isteniyor; yani sayfanın kaynak kodunda da bulunmuyor. Bu, numaraları toplayan otomatik yazılımlara karşı alınmış bir önlem.',
          'Numarayı yalnızca giriş yapmış üyeler görebiliyor. Üye olmayan bir ziyaretçi düğmeye bastığında giriş daveti görüyor. Aynı kural WhatsApp düğmesi için de geçerli.',
          'İsterseniz numaranızı hiç paylaşmayabilirsiniz; bu durumda ilanınıza yalnızca site içi mesajla ulaşılıyor. Mesajlaşma numaranızı vermeden görüşmenin en güvenli yolu.',
        ],
        sorular: () => [
          {
            soru: 'Numaramı ilan açıklamasına yazabilir miyim?',
            cevap: 'Yazmamanızı öneriyoruz. Açıklamaya yazılan numara herkese açık olur ve otomatik toplayan yazılımlara açık hâle gelir. "Telefonu Göster" düğmesi numaranızı yalnızca üyelere gösterir.',
          },
        ],
      },
      {
        slug: 'mesajlasma',
        baslik: 'Mesajlaşma nasıl çalışır?',
        ozet: 'İlan sahibiyle iletişim, mesaj listesi ve bildirimler.',
        icon: MessageSquare,
        govde: () => [
          'Her ilan sayfasında "Mesaj Gönder" düğmesi var. Gönderdiğiniz mesaj o ilana bağlı bir görüşme başlatıyor; ilan sahibi mesajı Mesajlarım bölümünde görüyor.',
          'Mesajlar listesinde kiminle konuştuğunuz, hangi ilan üzerinden konuştuğunuz ve son mesaj görünüyor. Kullanıcının adına ya da fotoğrafına tıklayarak profiline ve diğer ilanlarına gidebiliyorsunuz.',
          'Mesajlaşma için üye olmanız gerekiyor. Görüşmeler yalnızca iki tarafa açık; başka kimse okuyamıyor. Kural ihlali şüphesi olan görüşmeler şikayet üzerine incelenebiliyor.',
        ],
        baglantilar: [{ label: 'Mesajlarım', href: '/mesajlarim' }],
      },
      {
        slug: 'guvenli-alisveris',
        baslik: 'Dolandırıcılıktan nasıl korunurum?',
        ozet: 'Kapora, kargo ve uzaktan satış tuzaklarına karşı pratik kurallar.',
        icon: ShieldCheck,
        govde: () => [
          'En sık karşılaşılan tuzak kapora: hayvanı ya da ürünü görmeden "yerini ayırtmak için" para istenmesi. Görmediğiniz bir hayvan ya da ürün için asla ön ödeme yapmayın. Gerçek bir sahiplendiren ya da üretici, sizi hayvanı görmeye davet eder.',
          'İkinci sık tuzak kargoyla hayvan göndermek. Yavru bir hayvanın kargoyla gönderilmesi hem yasal olarak sorunlu hem de hayvan sağlığı açısından tehlikeli. "Ücreti yatırın, kargoyla gönderelim" diyen bir ilanı ciddiye almayın ve bildirin.',
          'Hayvanı yerinde görün, mümkünse annesiyle birlikte görün. Aşı ve mikroçip kaydını sorun; kedi ve köpeklerde mikroçip zorunlu. Aşı karnesini ve varsa veteriner kayıtlarını isteyin.',
          'Görüşmeyi site içi mesajla yürütün. Sizi hemen başka bir uygulamaya çekmeye çalışan, acele ettiren, "başkası da istiyor" diyerek baskı kuran kişilere karşı temkinli olun.',
          'Ödeme yapacaksanız yüz yüze ve teslim anında yapın. Havale, kripto ya da alışveriş kartı koduyla ödeme isteyen kişiler neredeyse her zaman dolandırıcıdır.',
        ],
        sorular: () => [
          {
            soru: 'Kapora istendi, ne yapmalıyım?',
            cevap: 'Ödeme yapmayın ve ilanı bildirin. Sahiplendirme ilanlarında hiçbir ad altında para talep edilemez; satış ilanlarında da hayvanı görmeden ön ödeme yapmanız için bir sebep yoktur.',
          },
          {
            soru: 'Dolandırıldım, nereye başvurmalıyım?',
            cevap: 'İlanı ve görüşmeyi bildirin, ekran görüntülerini saklayın. Maddi kayıp varsa Cumhuriyet Savcılığına ya da kolluk kuvvetlerine suç duyurusunda bulunun; site içi kayıtlar talep edilmesi hâlinde yetkili makamlarla paylaşılır.',
          },
        ],
      },
      {
        slug: 'ilan-ve-kullanici-sikayeti',
        baslik: 'İlan veya kullanıcı nasıl şikayet edilir?',
        ozet: 'Şikayet yolu, incelenme süreci ve acil durumlar.',
        icon: AlertTriangle,
        govde: () => [
          'Her ilan sayfasında "Şikayet Et" bağlantısı var. Şikayet ederken sebebini seçiyor, isterseniz açıklama ekliyorsunuz. Şikayetler yönetim paneline düşüyor ve tek tek inceleniyor.',
          'Kural ihlali doğrulanırsa ilan yayından kaldırılıyor; tekrarlayan ihlallerde hesap askıya alınıyor. Şikayetiniz sonucunda ne yapıldığı size ayrıca bildirilmiyor, ancak ilanın yayında olup olmadığını kontrol edebilirsiniz.',
          'Hayvana kötü muamele, işkence veya ihmal gördüğünüzü düşünüyorsanız yalnızca ilanı bildirmekle yetinmeyin: 5199 sayılı kanun kapsamında il tarım ve orman müdürlüklerine ya da kolluk kuvvetlerine bildirimde bulunun. Acil durumlarda 112’yi arayabilirsiniz.',
        ],
        baglantilar: [{ label: 'İletişim', href: '/iletisim' }],
      },
    ],
  },
  {
    slug: 'bolumler',
    ad: 'Bölümler',
    aciklama: 'Kayıp & Bulundu, hizmet rehberi ve güvercin bölümü.',
    yazilar: [
      {
        slug: 'kayip-ve-bulundu',
        baslik: 'Kayıp ve Bulundu nasıl kullanılır?',
        ozet: 'Kaybolan hayvan için ilan vermek ve bulunan hayvanı sahibine ulaştırmak.',
        icon: Search,
        govde: () => [
          'Kayıp & Bulundu bölümü iki yönlü çalışıyor: hayvanı kaybolanlar kayıp ilanı, sokakta hayvan bulanlar bulundu ilanı veriyor. İlanlar il ve ilçeye göre listeleniyor.',
          'Kayıp ilanında en önemli üç bilgi: kaybolduğu tarih ve semt, hayvanın ayırt edici özellikleri ve varsa mikroçip numarası. Mikroçip numarası bulan kişinin en yakın veterinerde sahibi tespit etmesini sağlıyor.',
          'Bir hayvan bulduysanız önce en yakın veterinere götürüp mikroçip taratın; çipli hayvanın sahibi kayıtlardan bulunabiliyor. Çip yoksa bulundu ilanı verin ve bulunduğu semti mutlaka yazın.',
          'Kayıp ilanı verirken hayvanın fotoğrafını eklemeyi ihmal etmeyin. Tarif eden metinden çok, net bir fotoğraf işe yarıyor.',
        ],
        baglantilar: [{ label: 'Kayıp & Bulundu', href: '/kayip' }],
      },
      {
        slug: 'hizmet-rehberi',
        baslik: 'İşletmemi hizmet rehberine nasıl eklerim?',
        ozet: 'Veteriner, pet oteli, kuaför, pet taksi, gezdirici, eğitmen ve petshop kaydı.',
        icon: Building2,
        govde: () => [
          'Hizmet rehberi yedi bölümden oluşuyor: veteriner klinikleri, pet otelleri, pet kuaförleri, pet taksi, köpek gezdiriciler, köpek eğitmenleri ve petshoplar. Her bölümün kendi kayıt formu var.',
          'Kayıt için giriş yapmanız ve kurumsal hesabınızın olması gerekiyor. Formda işletme adı, adres, telefon, çalışma saatleri ve sunduğunuz hizmetler soruluyor.',
          'İşletme sayfanıza logo ve işletme fotoğrafları ekleyebiliyorsunuz. Sayfa il ve ilçe listelerinde görünüyor; kullanıcılar sunduğunuz hizmetlere göre filtreleyebiliyor.',
          'Hizmet rehberine kayıt ücretsiz.',
        ],
        baglantilar: [
          { label: 'Veteriner kaydı', href: '/veteriner/kayit' },
          { label: 'Pet oteli kaydı', href: '/pet-oteli/kayit' },
        ],
      },
      {
        slug: 'guvercin-bolumu',
        baslik: 'Güvercin bölümü diğerlerinden neden farklı?',
        ozet: 'Güvercinde alım satım, halka numarası, şecere ve uçuş videosu.',
        icon: Bird,
        govde: () => [
          'Güvercin bölümü kendi başına bir dikey: kendi giriş sayfası, kendi ırk menüsü ve kendi terminolojisi var. Taklacı, posta, oyun, süs ve yerli ırklar ayrı gruplar hâlinde listeleniyor.',
          'Güvercin, 5199 sayılı kanunun ev hayvanı tanımı dışında kaldığı için satış kısıtlaması güvercinlere uygulanmıyor. Bireysel üyeler de güvercin alım satım ilanı verebiliyor.',
          'Güvercin ilanında halka numarası ve şecere bilgisi ayrı alanlar olarak isteniyor. Halka numarası kuşun doğum yılını ve halkayı takan kişiyi gösterdiği için bu alanda güvenin temeli.',
          'Uçuş videosu güvercinde fotoğraftan daha değerli: taklacıda takla biçimi, postada uçuş düzeni ancak videoda görülüyor. İlanınıza video eklemenizi öneriyoruz.',
        ],
        baglantilar: [{ label: 'Güvercin ilanları', href: '/guvercin-ilanlari' }],
      },
    ],
  },
];

export const YARDIM_YAZILARI: YardimYazisi[] = YARDIM_GRUPLARI.flatMap((g) => g.yazilar);

export function yardimYazisiBul(slug: string): { yazi: YardimYazisi; grup: YardimGrubu } | null {
  for (const grup of YARDIM_GRUPLARI) {
    const yazi = grup.yazilar.find((y) => y.slug === slug);
    if (yazi) return { yazi, grup };
  }
  return null;
}

/**
 * Yardım merkezinin ana sayfasında gösterilen sorular.
 *
 * Yazıların içindeki soruların tamamı değil, en sık sorulan sekiz tanesi.
 * FAQPage işaretlemesi yalnızca sayfada GÖRÜNEN soruları taşıyor;
 * görünmeyen içeriği işaretlemek arama motoru kurallarına aykırı.
 */
export function sikSorulanlar(a: YardimAyarlari): YardimSorusu[] {
  const sec = (yaziSlug: string, soruBasi: string): YardimSorusu | null => {
    const bulunan = yardimYazisiBul(yaziSlug);
    const soru = bulunan?.yazi.sorular?.(a).find((s) => s.soru.startsWith(soruBasi));
    return soru ?? null;
  };

  return [
    sec('ilan-nasil-verilir', 'İlan vermek ücretli mi?'),
    sec('neden-satilik-ilan-veremiyorum', 'Yavrularımı satmak'),
    sec('neden-satilik-ilan-veremiyorum', 'Sahiplendirme ilanında ücret'),
    sec('ilan-suresi-ve-yenileme', 'Süresi dolan ilanım'),
    sec('ilan-nasil-verilir', 'Kaç fotoğraf'),
    sec('onayli-kullanici-rozeti', 'Doğrulama yapmazsam'),
    sec('telefon-numaram-kime-gorunuyor', 'Numaramı ilan açıklamasına'),
    sec('guvenli-alisveris', 'Kapora istendi'),
  ].filter((s): s is YardimSorusu => s !== null);
}
