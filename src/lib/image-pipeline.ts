'use client';

import { slugify } from './routing';

/**
 * Yükleme öncesi görsel işleme.
 *
 * Kullanıcının seçtiği her görsel tarayıcıda küçültülüp WebP'ye çevriliyor.
 * Sunucuda dönüştürmek yerine tarayıcıda yapmanın üç nedeni var:
 *   1) 8 MB'lık telefon fotoğrafı yerine ~200 KB yükleniyor — mobil veride
 *      ciddi fark ve yükleme çok daha hızlı bitiyor.
 *   2) Depolama maliyeti düşüyor; Supabase Storage kotası boşuna dolmuyor.
 *   3) Sunucu tarafında dönüştürme altyapısı gerekmiyor.
 *
 * WebP, JPEG'e göre aynı görsel kalitede yaklaşık %30 daha küçük ve
 * Safari 14'ten beri her yerde destekleniyor. Yine de destek kontrolü var:
 * desteklenmeyen bir tarayıcıda JPEG'e düşüyoruz, yükleme hiç başarısız olmuyor.
 */

/** Uzun kenar sınırı. İlan fotoğrafı için 1600px fazlasıyla yeterli. */
export const MAX_DIMENSION = 1600;
export const WEBP_QUALITY = 0.82;

export type PreparedImage = {
  file: File;
  width: number;
  height: number;
  /** Tarayıcıda önizleme için; kullanıldıktan sonra revokeObjectURL çağrılmalı. */
  previewUrl: string;
  originalBytes: number;
};

let webpSupport: boolean | null = null;

/** Tarayıcı WebP kodlayabiliyor mu? Sonuç bir kez hesaplanıp saklanıyor. */
function supportsWebp(): boolean {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

/**
 * SEO uyumlu dosya adı.
 *
 * Görsel aramada dosya adı sıralama sinyallerinden biri ve bu sektörde görsel
 * araması ciddi trafik getiriyor. Ad kullanıcıya hiçbir yerde gösterilmediği
 * için uzun ve açıklayıcı olmasının maliyeti yok.
 *
 * Örn: "sirin-toy-poodle-yavrularimiz-kopek-ilani-istanbul-kadikoy-1.webp"
 */
export function buildSeoFilename(
  parts: {
    title: string;
    /** "köpek ilanı", "veteriner kliniği", "güvercin ilanı"… */
    context?: string;
    city?: string;
    district?: string;
  },
  index: number,
  extension: string
): string {
  const segments = [parts.title, parts.context, parts.city, parts.district]
    .filter(Boolean)
    .map((s) => slugify(s as string))
    .filter(Boolean);

  // Dosya sistemi ve CDN sınırlarına takılmamak için makul bir uzunlukta kes.
  const base = segments.join('-').slice(0, 120).replace(/-+$/, '') || 'gorsel';
  return `${base}-${index + 1}.${extension}`;
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı. Dosya bozuk olabilir.'));
    };
    img.src = url;
  });
}

/**
 * Görseli küçültüp WebP'ye çevirir ve SEO uyumlu adla yeni bir File döner.
 *
 * Küçültme yalnızca gerekliyse yapılıyor: zaten küçük bir görseli büyütmek
 * kaliteyi düşürür, boyutu artırır.
 */
export async function prepareImage(
  file: File,
  naming: Parameters<typeof buildSeoFilename>[0],
  index: number
): Promise<PreparedImage> {
  const image = await readImage(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Tarayıcı görsel işlemeyi desteklemiyor.');

  // Ölçeklerken yumuşatma: küçültülen fotoğrafta tırtıklı kenarları önlüyor.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  const useWebp = supportsWebp();
  const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
  const extension = useWebp ? 'webp' : 'jpg';

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, WEBP_QUALITY)
  );
  if (!blob) throw new Error('Görsel dönüştürülemedi.');

  const prepared = new File([blob], buildSeoFilename(naming, index, extension), {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file: prepared,
    width,
    height,
    previewUrl: URL.createObjectURL(prepared),
    originalBytes: file.size,
  };
}

/** Birden fazla görseli sırayla işler; sıra korunur. */
export async function prepareImages(
  files: File[],
  naming: Parameters<typeof buildSeoFilename>[0],
  startIndex = 0
): Promise<PreparedImage[]> {
  const out: PreparedImage[] = [];
  for (let i = 0; i < files.length; i++) {
    // Sırayla: aynı anda 12 görseli canvas'a çizmek düşük bellekli
    // telefonlarda sekmeyi çökertiyor.
    out.push(await prepareImage(files[i], naming, startIndex + i));
  }
  return out;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
