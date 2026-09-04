import type { Metadata } from 'next';
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
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PetSemti — Evcil Hayvan İlanları, Pet Hizmetleri ve Güvercin Dünyası',
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
   */
  description:
    'PetSemti; evcil hayvan sahiplerini ilanlar, yerel pet hizmetleri ve güvercin dünyasıyla buluşturan pet yaşam platformudur. Kedi, köpek, kuş ve akvaryum ilanları; kayıp-bulundu; veteriner, pet oteli, kuaför ve eğitmen rehberi — 81 ilde, ilan vermek ücretsiz.',
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
  icons: {
    icon: [
      // SVG önce: her boyutta net ve tek dosya. .ico eski tarayıcılar için.
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/marka/amblem.svg',
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'PetSemti',
    url: SITE_URL,
    title: 'PetSemti — Evcil Hayvan İlanları, Pet Hizmetleri ve Güvercin Dünyası',
    description:
      'İlanlar, yerel pet hizmetleri ve güvercin dünyası tek platformda. 81 ilde, ilan vermek ücretsiz.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PetSemti — Evcil Hayvan İlanları, Pet Hizmetleri ve Güvercin Dünyası',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      {/* Scrollbar gizleme ve responsive ayarları global.css'teydi */}
      <body className={cn('min-h-screen bg-background font-body antialiased overflow-x-hidden w-full max-w-[100vw]')}>
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