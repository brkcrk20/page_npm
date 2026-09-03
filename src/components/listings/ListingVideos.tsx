'use client';

import { useState } from 'react';
import { Film } from 'lucide-react';

import { listingVideoUrl } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

/**
 * İlan videoları.
 *
 * preload="metadata": sayfa açılır açılmaz video indirmeye başlamıyor,
 * yalnızca süre ve ilk kare bilgisi geliyor. Güvercin ilanlarında beş video
 * olabiliyor; hepsini önden indirmek mobil veriyi anlamsızca tüketirdi.
 *
 * Videolar arama motoruna da anlamlı gelsin diye her birinin başlığı ilan
 * adından türetiliyor.
 */
export function ListingVideos({
  videos,
  title,
}: {
  videos: {
    id: number;
    provider: string;
    storage_path: string | null;
    playback_url: string | null;
    duration_seconds: number | null;
    position: number;
    title: string | null;
    status: string;
  }[];
  title: string;
}) {
  const ready = [...videos]
    .filter((v) => v.status === 'hazir')
    .sort((a, b) => a.position - b.position);

  const [active, setActive] = useState(0);

  if (ready.length === 0) return null;

  const current = ready[Math.min(active, ready.length - 1)];
  const url = listingVideoUrl(current);
  if (!url) return null;

  return (
    <section className="overflow-hidden rounded-lg border bg-white">
      <h2 className="flex items-center gap-2 border-l-4 border-primary px-4 py-3 font-bold">
        <Film className="h-4 w-4" />
        Video
        {ready.length > 1 && (
          <span className="text-sm font-normal text-muted-foreground">({ready.length})</span>
        )}
      </h2>

      <div className="border-t">
        <video
          key={current.id}
          src={url}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
          title={current.title ?? title}
        >
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>

        {ready.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {ready.map((video, i) => (
              <button
                key={video.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'shrink-0 rounded border px-3 py-1.5 text-xs transition-colors',
                  i === active
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'hover:bg-secondary'
                )}
              >
                Video {i + 1}
                {video.duration_seconds ? ` · ${video.duration_seconds} sn` : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
