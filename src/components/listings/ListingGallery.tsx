'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, Video } from 'lucide-react';

import { cn } from '@/lib/utils';
import { listingPhotoUrl } from '@/lib/supabase/storage';

/**
 * İlan fotoğraf galerisi.
 *
 * Büyük görsel + ok tuşları + küçük önizlemeler. Fotoğraf yoksa bileşen yine
 * de yer kaplayan bir kutu gösteriyor; aksi halde sayfa düzeni fotoğrafı olan
 * ve olmayan ilanlarda farklı görünürdü.
 */
export function ListingGallery({
  photos,
  title,
}: {
  photos: { storage_path: string; position: number }[];
  title: string;
}) {
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const urls = sorted.map((p) => listingPhotoUrl(p.storage_path)).filter(Boolean) as string[];

  const [index, setIndex] = useState(0);
  const hasPhotos = urls.length > 0;
  const current = urls[index];

  const go = (delta: number) => {
    setIndex((prev) => (prev + delta + urls.length) % urls.length);
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      {/**
        * Sahne oranı ve object-contain.
        *
        * Kutu 4:3 ve fotoğraf object-cover ile basılıyordu. İlan
        * fotoğraflarının neredeyse tamamı telefonla dikey çekiliyor —
        * veritabanındaki örnekler 720×1600 (0,45) ve 1200×1600 (0,75).
        * 0,45 oranındaki bir fotoğrafı 1,33 oranındaki kutuya "cover" ile
        * yerleştirmek, fotoğrafın yüksekliğinin yalnızca ~%20'sini
        * gösteriyordu: hayvanın kafası da kuyruğu da kutunun dışında
        * kalıyordu. İlanın tek işi fotoğrafı göstermek.
        *
        * contain ile fotoğrafın tamamı görünüyor; kenarda kalan boşluğu
        * aynı fotoğrafın bulanık ve büyütülmüş bir kopyası dolduruyor,
        * böylece boş şeritler yerine fotoğrafın kendi rengi kalıyor.
        *
        * Mobilde sahne 3:4: dar ekranda kare kutu bile dikey fotoğrafı
        * şeride çeviriyordu. Masaüstünde 4:3 kalıyor, orada yatay alan bol.
        */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted sm:aspect-[4/3]">
        {hasPhotos ? (
          <>
            <Image
              src={current}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="scale-110 object-cover blur-2xl"
            />
            <Image
              src={current}
              alt={`${title} — fotoğraf ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain"
              priority
            />
            {urls.length > 1 && (
              <>
                <GalleryArrow side="left" onClick={() => go(-1)} />
                <GalleryArrow side="right" onClick={() => go(1)} />
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {urls.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-colors',
                        i === index ? 'bg-white' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Bu ilana fotoğraf eklenmemiş
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 border-y text-sm">
        <button
          type="button"
          onClick={() => hasPhotos && window.open(current, '_blank', 'noopener')}
          disabled={!hasPhotos}
          className="flex items-center justify-center gap-2 py-2.5 font-medium text-primary transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Maximize2 className="h-4 w-4" />
          Büyük Fotoğraf
        </button>
        {/* Video yükleme henüz yok; düğme düzeni koruyor ama tıklanamıyor —
            çalışmayan bir bağlantı vermektense devre dışı göstermek dürüst. */}
        <button
          type="button"
          disabled
          title="Video özelliği henüz aktif değil"
          className="flex items-center justify-center gap-2 border-l py-2.5 font-medium text-muted-foreground disabled:opacity-40"
        >
          <Video className="h-4 w-4" />
          Video
        </button>
      </div>

      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-16 w-20 shrink-0 overflow-hidden rounded border-2 transition-colors',
                i === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
              )}
              aria-label={`Fotoğraf ${i + 1}`}
            >
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Önceki fotoğraf' : 'Sonraki fotoğraf'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 rounded-full border bg-white/90 p-2 text-primary shadow-sm transition-colors hover:bg-white',
        side === 'left' ? 'left-3' : 'right-3'
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
