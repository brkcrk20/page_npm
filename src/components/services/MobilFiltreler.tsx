'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Mobilde filtreleri çekmeceye alan sarmalayıcı.
 *
 * Rehber sayfalarında filtre paneli her ekranda açıkta duruyordu: telefonda
 * arama kutusu, doğrulama kutusu, beş-altı özellik grubu ve seksen bir şehir
 * alt alta diziliyor, kullanıcı asıl aradığı işletme listesine ulaşmak için
 * bir ekran boyu kaydırmak zorunda kalıyordu. Geniş ekranda sorun yok — orada
 * panel yanda duruyor — bu yüzden çekmece yalnızca mobilde çıkıyor.
 *
 * İçerik sunucuda çiziliyor ve children olarak geliyor; burada yalnızca
 * açılıp kapanma durumu var.
 */
export function MobilFiltreler({
  etkinSayisi,
  children,
}: {
  /** Seçili filtre sayısı; düğmenin üstünde rozet olarak çıkıyor. */
  etkinSayisi: number;
  children: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);

  return (
    <Sheet open={acik} onOpenChange={setAcik}>
      <SheetTrigger asChild>
        <Button variant="outline" className="mb-4 w-full justify-center gap-2 md:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filtrele
          {etkinSayisi > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {etkinSayisi}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[88vw] max-w-sm overflow-y-auto p-0"
        // Filtreye basılınca sayfa yeniden çiziliyor; çekmece açık kalırsa
        // kullanıcı sonucu göremiyor. Her tıklamada kapanması için içeriğe
        // yakalayıcı bir tıklama dinleyicisi konuldu.
        onClick={(e) => {
          const hedef = e.target as HTMLElement;
          if (hedef.closest('a, button[role="checkbox"], input[type="checkbox"]')) setAcik(false);
        }}
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle>Filtrele</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
