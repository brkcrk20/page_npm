'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Sayfa geçişlerinde üstte ilerleme çubuğu.
 *
 * NEDEN
 * Ölçümde gezinme 0,4-1,1 saniye sürüyor; rakam iyi ama HİSSEDİLEN hız
 * kötü. Sebebi şu: bir bağlantıya dokunduğunda tarayıcı yeni sayfa
 * hazırlanana kadar ESKİ sayfayı göstermeye devam ediyor. Ekranda hiçbir
 * şey değişmediği için kullanıcı dokunuşun işe yaramadığını sanıyor ve
 * ikinci kez basıyor.
 *
 * Yarım saniyelik bir bekleme, geri bildirim olmadığında bir saniye gibi
 * hissediliyor. Çubuk dokunuşun ilk anında beliriyor.
 *
 * NEDEN loading.tsx DEĞİL
 * Denendi ve geri alındı: iskelet gönderilir gönderilmez yanıt başlığı
 * 200'e kilitleniyor ve notFound() artık 404 döndüremiyor — bulunmayan
 * her adres arama motoruna "sayfa var" diyordu. Bu çubuk tamamen
 * tarayıcı tarafında, HTTP durumuna dokunmuyor.
 */
export function GezinmeCubugu() {
  const pathname = usePathname();
  const [ilerleme, setIlerleme] = useState<number | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Yeni sayfa çizildi: çubuğu tamamla ve gizle.
  useEffect(() => {
    setIlerleme((p) => (p === null ? null : 100));
    const t = setTimeout(() => setIlerleme(null), 220);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    /** Bu tıklama gerçekten site içi bir gezinme mi? */
    function gezinmeMi(olay: MouseEvent): boolean {
      if (olay.defaultPrevented || olay.button !== 0) return false;
      if (olay.metaKey || olay.ctrlKey || olay.shiftKey || olay.altKey) return false;

      const bag = (olay.target as HTMLElement | null)?.closest?.('a');
      if (!bag) return false;

      const href = bag.getAttribute('href');
      if (!href || href.startsWith('#')) return false;
      if (bag.target && bag.target !== '_self') return false;
      if (bag.hasAttribute('download')) return false;

      const hedef = new URL(bag.href, window.location.href);
      if (hedef.origin !== window.location.origin) return false;
      // Aynı sayfaya gitmek gezinme değil; çubuk boşuna asılı kalmasın.
      return hedef.pathname !== window.location.pathname || hedef.search !== window.location.search;
    }

    function basla() {
      setIlerleme(8);
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      // Emniyet: gezinme bir sebeple gerçekleşmezse çubuk sonsuza kadar
      // kalmasın.
      zamanlayici.current = setTimeout(() => setIlerleme(null), 10_000);
    }

    const tikla = (olay: MouseEvent) => {
      if (gezinmeMi(olay)) basla();
    };

    document.addEventListener('click', tikla, true);
    window.addEventListener('popstate', basla);
    return () => {
      document.removeEventListener('click', tikla, true);
      window.removeEventListener('popstate', basla);
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, []);

  // Sona yaklaşırken yavaşlayan ilerleme: %92'yi geçmiyor, çünkü gerçek
  // bitişi ancak sayfa değiştiğinde biliyoruz.
  useEffect(() => {
    if (ilerleme === null || ilerleme >= 92) return;
    const t = setTimeout(() => setIlerleme((p) => (p === null ? null : p + (92 - p) * 0.18)), 120);
    return () => clearTimeout(t);
  }, [ilerleme]);

  if (ilerleme === null) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div
        className="h-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-[width] duration-150 ease-out"
        style={{ width: `${ilerleme}%` }}
      />
    </div>
  );
}
