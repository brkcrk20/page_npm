'use client';

import { useState } from 'react';
import Image from 'next/image';

import { breedImagePath, breedImageAlt, breedFallbackImage } from '@/lib/breed-image';

/**
 * Cins küçük görseli.
 *
 * Görsel dosyası henüz eklenmemişse harf tabanlı yedeğe düşer. Yedek inline
 * SVG olduğu için ek ağ isteği yapmaz — 100+ cinsin her biri için 404 almak
 * hem yavaş olurdu hem de sunucu günlüklerini doldururdu.
 *
 * Görselleri eklemek için: npx tsx scripts/fetch-breed-images.ts
 *
 * PERFORMANS: unoptimized=true. Dosyalar zaten 128px WebP ve ortalama 5 KB —
 * indirme betiği onları o boyutta üretiyor. Next.js görsel optimizasyonundan
 * geçirmek, her biri için sunucuya ayrı bir /_next/image isteği demek ve ana
 * sayfada bu 72 ek gidiş dönüşe çıkıyordu. 5 KB'lık bir dosyayı yeniden
 * kodlamanın kazancı yok, maliyeti bütün sayfayı bekletmek.
 */
export function BreedAvatar({
  breedName,
  breedSlug,
  categorySlug,
  categoryCode,
  categoryName,
  size = 32,
}: {
  breedName: string;
  breedSlug: string;
  categorySlug: string;
  categoryCode: string;
  categoryName: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  const src = failed
    ? breedFallbackImage(breedName, breedSlug, categoryCode)
    : breedImagePath(breedName, categorySlug, categoryCode);

  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full bg-muted"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={breedImageAlt(breedName, categoryName)}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
        unoptimized
      />
    </span>
  );
}
