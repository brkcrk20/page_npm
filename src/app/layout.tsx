import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav'; // YENİ EKLENDİ
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://petsemti.com'),
  title: {
    default: 'Petsemti | Evcil Hayvan Ilanlari',
    template: '%s | Petsemti',
  },
  description: 'Petsemti: Evcil hayvan ilanlari, kedi sahiplendirme, kopek satis ve ucretsiz sahiplenme platformu.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Petsemti | Evcil Hayvan Ilanlari',
    description: 'Petsemti ile semtinizdeki guncel evcil hayvan ilanlarini kesfedin.',
    url: '/',
    siteName: 'Petsemti',
    locale: 'tr_TR',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      {/* Scrollbar gizleme ve responsive ayarları global.css'teydi */}
      <body className={cn('min-h-screen bg-background font-body antialiased overflow-x-hidden w-full max-w-[100vw]')}>
        <FirebaseClientProvider>
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            {/* pb-20 ekledik: Mobil menü içeriği kapatmasın diye alt boşluk */}
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <Footer />
            {/* Bottom Nav Sadece Mobilde Görünecek (Kendi içinde md:hidden var) */}
            <BottomNav />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}