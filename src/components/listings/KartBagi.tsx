'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

/**
 * İlan kartının bağlantısı; imleç üzerine gelince sayfayı önden yükler.
 *
 * Kartlarda prefetch kapalı: liste sayfasında 20-30 kart var ve hepsini
 * görünür olur olmaz indirmek, kullanıcının bakmayacağı onlarca sayfayı
 * boşuna çekiyordu. Ama tıklamadan sonra sıfırdan başlamak da tıklamayla
 * sayfanın açılması arasına bir-iki saniye koyuyordu.
 *
 * Ortası: yalnızca ilgilenilen kart hazırlanıyor. Masaüstünde imleç kartın
 * üstüne geldiğinde, dokunmatikte parmak değdiği anda (touchstart, click'ten
 * ~100 ms önce gelir) sayfa arka planda çekiliyor. Tek seferlik: aynı kart
 * üzerinde gezinmek isteği tekrarlamıyor.
 */
export function KartBagi({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const yapildi = useRef(false);

  function hazirla() {
    if (yapildi.current) return;
    yapildi.current = true;
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      className={className}
      prefetch={false}
      onMouseEnter={hazirla}
      onTouchStart={hazirla}
      onFocus={hazirla}
    >
      {children}
    </Link>
  );
}
