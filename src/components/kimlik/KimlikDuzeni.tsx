import Link from 'next/link';
import { Check } from 'lucide-react';

import { Logo, LogoMark } from '@/components/Logo';

/**
 * Giriş ve kayıt sayfalarının ortak düzeni.
 *
 * NEDEN
 * İki sayfa da beyaz zemin üstünde çerçevesi görünmeyen bir kutuydu;
 * sitenin geri kalanıyla (marka rengi, yuvarlak kartlar, pati amblemi)
 * hiçbir bağı yoktu. Yanlarındaki büyük görsel ise Unsplash'ten alınma
 * bir stok fotoğraftı — hem siteye ait değil hem de her açılışta dış
 * bir sunucudan iniyordu.
 *
 * Onun yerine markanın kendi paneli: aynı kırmızı, aynı amblem, aynı
 * "tüm patiler için, tek bir yer" cümlesi.
 *
 * SIRALAMA EKRANA GÖRE
 * Geniş ekranda panel solda, form sağda; ikisi birlikte görünüyor.
 * Telefonda panel formun ALTINA iniyor: kayıt olmaya karar vermiş kişi
 * doğrudan forma ulaşsın, kararsız olan aşağı kaydırınca gerekçeleri
 * bulsun. Panel üstteyken form ekranın dışında kalıyordu.
 *
 * Panelin içindeki logo yalnızca geniş ekranda: telefonda üst bantta
 * zaten aynı logo duruyor, iki kez görünmesi hata gibi duruyordu.
 */
export function KimlikDuzeni({
  baslik,
  aciklama,
  panelBaslik,
  panelMaddeler,
  altMetin,
  altBaglantiMetni,
  altBaglantiAdresi,
  children,
}: {
  baslik: string;
  aciklama: string;
  panelBaslik: string;
  panelMaddeler: string[];
  /** Kartın altındaki tek yönlendirme satırı. */
  altMetin: string;
  altBaglantiMetni: string;
  altBaglantiAdresi: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-0 px-0 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-10 lg:px-5 lg:py-10">
        {/* Marka paneli — geniş ekranda solda, telefonda kartın üstünde şerit */}
        <aside className="relative order-last flex flex-col justify-center overflow-hidden bg-primary px-5 py-8 text-primary-foreground lg:order-first lg:rounded-2xl lg:px-10 lg:py-12">
          {/* Amblemin dev ve soluk kopyası: panel düz bir renk lekesi
              olmaktan çıkıyor, fotoğrafa da ihtiyaç kalmıyor. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-10 opacity-[0.07] lg:-bottom-24 lg:-right-16"
          >
            <LogoMark variant="mono" size={280} />
          </div>

          <div className="relative">
            <Link
              href="/"
              aria-label="PetSemti ana sayfa"
              className="hidden lg:inline-flex"
              prefetch={false}
            >
              <Logo variant="mono" size={36} />
            </Link>

            <h2 className="text-xl font-bold leading-snug lg:mt-10 lg:text-3xl">
              {panelBaslik}
            </h2>

            <ul className="mt-4 space-y-2.5 lg:mt-7 lg:space-y-3">
              {panelMaddeler.map((madde) => (
                <li key={madde} className="flex items-start gap-2.5 text-sm lg:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
                  <span className="text-primary-foreground/90">{madde}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 hidden text-sm text-primary-foreground/70 lg:mt-10 lg:block">
              Tüm patiler için, tek bir yer.
            </p>
          </div>
        </aside>

        {/* Form kartı */}
        <main className="order-first flex items-center px-4 py-8 lg:order-last lg:px-0 lg:py-0">
          <div className="w-full rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
            <h1 className="text-2xl font-bold">{baslik}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{aciklama}</p>

            <div className="mt-6">{children}</div>

            {/*
              Yönlendirme satırı TEK yerde.
              Kayıt sayfasında bu satır hem burada hem formun iki adımının
              ikisinde de yazılıydı; ekranda alt alta iki kez görünüyordu.
            */}
            <p className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
              {altMetin}{' '}
              <Link
                href={altBaglantiAdresi}
                className="font-semibold text-primary hover:underline"
                prefetch={false}
              >
                {altBaglantiMetni}
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
