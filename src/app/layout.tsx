import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav'; // YENİ EKLENDİ
import { Toaster } from '@/components/ui/toaster';
import { getSiteContact } from '@/lib/queries/site-settings';
import { JsonLd } from '@/components/JsonLd';
import { PresenceTracker } from '@/components/PresenceTracker';
import { organizationSchema, websiteSchema } from '@/lib/structured-data';
import { SupabaseAuthProvider } from '@/lib/supabase/auth-provider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.petsemti.com';

/**
 * Site geneli metadata.
 *
 * Metin, sitenin gerçekten yaptığı işi anlatıyor: ilan + hizmet rehberi +
 * güvercin bölümü. Genel pazaryeri kalıplarından bilerek uzak duruldu; hem
 * özgünlük hem de arama sonuçlarında ayrışmak için.
 *
 * Paylaşım kartları (Open Graph / Twitter) daha önce hiç tanımlanmamıştı:
 * WhatsApp veya X'te paylaşılan her bağlantı başlıksız ve açıklamasız
 * görünüyordu. Bu sektörde paylaşım ciddi bir trafik kaynağı.
 */
/**
 * Yazı tipleri kendi sunucumuzdan.
 *
 * Fontlar Google Fonts'tan <link> ile çekiliyordu. Bunun iki ölçülmüş
 * bedeli vardı:
 *
 *  - Sayfa ilk yazıyı boyayabilmek için önce fonts.googleapis.com'dan CSS,
 *    sonra fonts.gstatic.com'dan woff2 indirmek zorundaydı. İki ayrı alan
 *    adı, iki DNS + TLS turu, hepsi ilk boyamanın önünde. Sunucu yanıtı
 *    10 ms olmasına rağmen ilk boyama her sayfada 3,0-3,2 saniyeydi.
 *  - Font sonradan yerleşince yazılar kayıyordu. Lighthouse kayma
 *    puanının (CLS) tek sebebini gösterdi: "Web font loaded". Cins
 *    sayfasında 0,161 — Google'ın "iyi" eşiği 0,1.
 *
 * next/font fontları derleme sırasında indirip kendi alan adımızdan
 * sunuyor, @font-face kuralını HTML'e gömüyor ve yedek yazı tipinin
 * ölçülerini gerçek fonta göre ayarlıyor; font yerleşince metin kaymıyor.
 *
 * latin-ext açıkça isteniyor: ğ, ş, ı ve İ o alt kümede. Unutulursa
 * Türkçe harfler yedek yazı tipinden düşer ve satır ortasında karakter
 * değişir.
 *
 * Ağırlık listesi verilmiyor. İkisi de değişken yazı tipi; ağırlık
 * sayıldığında her ağırlık ve alt küme için ayrı bir dosya üretiliyordu
 * (aile başına altı dosya, ölçülen 181 KB). Liste kaldırılınca alt küme
 * başına tek değişken dosya iniyor ve aradaki tüm ağırlıkları karşılıyor.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-headline',
  display: 'swap',
  /**
   * Başlık yazı tipi ön yüklenmiyor.
   *
   * Dört font dosyası birden ön yükleniyordu: 178 KB, sayfanın toplam
   * ağırlığının %30'u ve hepsi ilk boyamanın önünde. Outfit yalnızca
   * başlıklarda kullanılıyor; gövde metni Inter ile zaten okunabilir
   * durumda boyanıyor.
   *
   * Yedek yazı tipinin ölçüleri gerçek fonta göre ayarlandığı için font
   * sonradan geldiğinde satırlar kaymıyor — yalnızca harf biçimi
   * değişiyor.
   */
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // 68 karakterdi; Google 60'tan sonrasını kesiyordu ve varsayılan
    // başlık şablondan geçmediği için markayı da kendisi taşımak zorunda.
    default: 'PetSemti — Evcil Hayvan İlanları ve Pet Hizmetleri',
    template: '%s | PetSemti',
  },
  /**
   * Marka cümlesi.
   *
   * Site kendini bir dönem yalnızca "sahiplendirme platformu" diye
   * tanıtıyordu; oysa ilanlar, yedi hizmet rehberi, kayıp-bulundu ve kendi
   * dikeyi olan güvercin bölümü aynı yapının parçası. Dar tanım hem ürünü
   * eksik anlatıyor hem de arama sonuçlarında yalnızca tek bir niyeti
   * yakalıyordu.
   *
   * Aynı cümle alt bilgide, ana sayfada ve Hakkımızda'da da geçiyor;
   * ayrı ayrı yazılırsa marka yine parçalı görünür.
   *
   * Buradaki hâli kısaltıldı: 257 karakterdi ve arama sonucunda ~160'tan
   * sonrası kesiliyordu. Kesilen yer de tam hizmet listesinin ortasıydı.
   * Uzun anlatım Hakkımızda ve alt bilgide duruyor; meta açıklamanın işi
   * anlatmak değil, tıklatmak.
   */
  description:
    'PetSemti; evcil hayvan ilanları, yerel pet hizmetleri ve güvercin dünyası tek platformda. Kedi, köpek, kuş ilanları ve kayıp-bulundu — 81 ilde ücretsiz.',
  applicationName: 'PetSemti',
  keywords: [
    'evcil hayvan ilanları',
    'kedi sahiplendirme',
    'köpek ilanları',
    'güvercin ilanları',
    'kayıp hayvan ilanı',
    'veteriner',
    'pet oteli',
    'pet malzemeleri',
  ],
  /**
   * Sekme ikonu.
   *
   * app/favicon.ico proje iskeletiyle gelen üretici ikonuydu ve Next.js onu
   * /favicon.ico olarak servis ettiği için tarayıcı sekmesinde markanın
   * değil onun ikonu görünüyordu. Dosya silindi; ikon artık amblemin
   * kendisi (app/icon.svg) ve Apple cihazlar için ondan üretilen PNG.
   */
  /**
   * Sekme ikonu.
   *
   * Sürüm parametresi (?v=2) bilerek duruyor: tarayıcılar favicon'u çok
   * uzun süre önbellekte tutuyor ve amblem rengi değiştiğinde kullanıcılar
   * eskisini görmeye devam ediyordu. Adres değişince yeniden indiriliyor.
   *
   * PNG boyutları da veriliyor: SVG'yi göstermeyen ortamlar (arama sonucu
   * favicon'u, bazı uygulama içi tarayıcılar) var ve orada şeffaf zemin
   * siyaha düşüyordu — PNG'ler beyaz zeminli.
   */
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/marka/ikon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/marka/ikon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png?v=2',
  },
  alternates: { canonical: '/' },
  /**
   * Google Search Console doğrulaması.
   *
   * Ortam değişkeni tanımlıysa etiket basılıyor. DNS ile doğrulama daha
   * kalıcı (dağıtımdan bağımsız), ama etiket yöntemi de gerekebiliyor —
   * ikisinden biri yeterli.
   */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'PetSemti',
    url: SITE_URL,
    title: 'PetSemti — Evcil Hayvan İlanları ve Pet Hizmetleri',
    description:
      'İlanlar, yerel pet hizmetleri ve güvercin dünyası tek platformda. 81 ilde, ilan vermek ücretsiz.',
    /**
     * Paylaşım kartı.
     *
     * og:image hiç tanımlı değildi. Bu durumda Facebook ve WhatsApp
     * sayfadaki görselleri kendi tarayıp birini seçiyor; seçtiği şey de
     * yan menüdeki 64 pikselik bir cins küçük görseli oluyordu — büyütülünce
     * bulanık, markayla ilgisiz bir fotoğraf. Paylaşımın ilk izlenimi buydu.
     *
     * 1200×630 markalı kart: her paylaşımda aynı ve okunur.
     */
    images: [
      {
        url: `${SITE_URL}/marka/paylasim-karti.png`,
        width: 1200,
        height: 630,
        alt: 'PetSemti — Tüm patiler için, tek bir yer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${SITE_URL}/marka/paylasim-karti.png`],
    title: 'PetSemti — Evcil Hayvan İlanları ve Pet Hizmetleri',
    description:
      'İlanlar, yerel pet hizmetleri ve güvercin dünyası tek platformda. 81 ilde, ilan vermek ücretsiz.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Alt bilgideki iletişim bilgisi veritabanından; koda gömülü yer
  // tutucular kaldırıldı.
  const contact = await getSiteContact();

  return (
    <html lang="tr" suppressHydrationWarning>
      {/* Scrollbar gizleme ve responsive ayarları global.css'teydi */}
      <body
        className={cn(
          inter.variable,
          outfit.variable,
          'min-h-screen bg-background font-body antialiased overflow-x-hidden w-full max-w-[100vw]'
        )}
      >
        <SupabaseAuthProvider>
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            {/* pb-20 ekledik: Mobil menü içeriği kapatmasın diye alt boşluk */}
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer contact={contact} />

            {/* Kuruluş ve site şeması her sayfada: Google bunları site
                genelinde bir kez okuyor ama hangi sayfayla karşılaşacağı
                belli olmuyor. */}
            <JsonLd data={[organizationSchema(contact), websiteSchema()]} />
            {/* Bottom Nav Sadece Mobilde Görünecek (Kendi içinde md:hidden var) */}
            <BottomNav />
          </div>
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}