import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav'; // YENİ EKLENDİ
import { Toaster } from '@/components/ui/toaster';
import { getSiteContact } from '@/lib/queries/site-settings';
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
    default: 'PetSemti — Evcil Hayvan İlanları ve Hizmet Rehberi',
    template: '%s | PetSemti',
  },
  description:
    'Semtinizdeki kedi, köpek, kuş, akvaryum ve güvercin ilanları. Sahiplendirme ve satılık ilanları ırka, ile ve ilçeye göre inceleyin; veteriner, pet oteli, kuaför ve eğitmen rehberinden size en yakınını bulun. İlan vermek ücretsiz.',
  applicationName: 'PetSemti',
  keywords: [
    'evcil hayvan ilanları',
    'kedi sahiplendirme',
    'köpek ilanları',
    'güvercin ilanları',
    'veteriner',
    'pet oteli',
  ],
  icons: { icon: '/favicon.ico' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'PetSemti',
    url: SITE_URL,
    title: 'PetSemti — Evcil Hayvan İlanları ve Hizmet Rehberi',
    description:
      'Semtinizdeki sahiplendirme ve satılık hayvan ilanları, 81 ilde veteriner ve pet hizmetleri rehberi. İlan vermek ücretsiz.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PetSemti — Evcil Hayvan İlanları ve Hizmet Rehberi',
    description:
      'Semtinizdeki sahiplendirme ve satılık hayvan ilanları, 81 ilde veteriner ve pet hizmetleri rehberi.',
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      {/* Scrollbar gizleme ve responsive ayarları global.css'teydi */}
      <body className={cn('min-h-screen bg-background font-body antialiased overflow-x-hidden w-full max-w-[100vw]')}>
        <SupabaseAuthProvider>
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            {/* pb-20 ekledik: Mobil menü içeriği kapatmasın diye alt boşluk */}
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer contact={contact} />
            {/* Bottom Nav Sadece Mobilde Görünecek (Kendi içinde md:hidden var) */}
            <BottomNav />
          </div>
          <Toaster />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}