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
/** Kart ve şerit kopyasının genişliği (masaüstü). */
export const THUMB_WIDTH = 400;
/**
 * Kart kopyasının mobil genişliği.
 *
 * Telefonda kart görseli ~134 piksele çiziliyor; 400 piksellik kopyayı
 * indirtmek yavaş bağlantıda LCP'yi bir saniyeden fazla geciktiriyordu
 * (ölçüm: 21,8 KB'lık dosyanın inmesi 1,4 sn). 200 piksel hem yeterli hem
 * de tabletlerde pay bırakıyor.
 */
export const THUMB_SM_WIDTH = 200;
export const WEBP_QUALITY = 0.82;

export type PreparedImage = {
  file: File;
  /**
   * Kart ve şeritler için 400 piksellik kopya.
   *
   * Görseller barındırma sağlayıcısının iyileştiricisinden çıkarıldı
   * (kota doldu, bütün fotoğraflar 402 dönüyordu). Boyutlandırma artık
   * istek anında değil burada, yükleme anında yapılıyor.
   */
  thumb: File;
  /** Aynı kopyanın mobil boyu (~200 piksel). */
  thumbSm: File;
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

  const ad = buildSeoFilename(naming, index, extension);
  const prepared = new File([blob], ad, { type: mimeType, lastModified: Date.now() });

  // Küçük kopya: aynı görselden, yalnızca genişlik sınırı farklı.
  const kOlcek = Math.min(1, THUMB_WIDTH / width);
  const kCanvas = document.createElement('canvas');
  kCanvas.width = Math.round(width * kOlcek);
  kCanvas.height = Math.round(height * kOlcek);
  const kContext = kCanvas.getContext('2d');
  if (!kContext) throw new Error('Tarayıcı görsel işlemeyi desteklemiyor.');
  kContext.imageSmoothingEnabled = true;
  kContext.imageSmoothingQuality = 'high';
  kContext.drawImage(image, 0, 0, kCanvas.width, kCanvas.height);

  const kBlob = await new Promise<Blob | null>((resolve) =>
    kCanvas.toBlob(resolve, mimeType, 0.74)
  );
  if (!kBlob) throw new Error('Görsel dönüştürülemedi.');

  const nokta = ad.lastIndexOf('.');
  const kAd = nokta === -1 ? `${ad}-k` : `${ad.slice(0, nokta)}-k${ad.slice(nokta)}`;
  const thumb = new File([kBlob], kAd, { type: mimeType, lastModified: Date.now() });

  // Mobil kopya: aynı yol, yalnızca genişlik ve ad soneki farklı.
  const sOlcek = Math.min(1, THUMB_SM_WIDTH / width);
  const sCanvas = document.createElement('canvas');
  sCanvas.width = Math.round(width * sOlcek);
  sCanvas.height = Math.round(height * sOlcek);
  const sContext = sCanvas.getContext('2d');
  if (!sContext) throw new Error('Tarayıcı görsel işlemeyi desteklemiyor.');
  sContext.imageSmoothingEnabled = true;
  sContext.imageSmoothingQuality = 'high';
  sContext.drawImage(image, 0, 0, sCanvas.width, sCanvas.height);

  const sBlob = await new Promise<Blob | null>((resolve) =>
    sCanvas.toBlob(resolve, mimeType, 0.74)
  );
  if (!sBlob) throw new Error('Görsel dönüştürülemedi.');

  const sAd = nokta === -1 ? `${ad}-s` : `${ad.slice(0, nokta)}-s${ad.slice(nokta)}`;
  const thumbSm = new File([sBlob], sAd, { type: mimeType, lastModified: Date.now() });

  return {
    file: prepared,
    thumb,
    thumbSm,
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

/** Profil fotoğrafının kenar uzunluğu. Her yerde daire içinde ve en fazla
 *  128px gösteriliyor; 512 ekranların 2x/3x yoğunluğuna fazlasıyla yetiyor. */
export const AVATAR_SIZE = 512;

/**
 * Profil fotoğrafını kare olarak kırpıp WebP'ye çevirir.
 *
 * prepareImage kullanılamıyordu: o, oranı koruyup uzun kenarı 1600'e
 * indiriyor. Profil fotoğrafı her yerde daire içinde gösteriliyor ve dikey bir
 * fotoğrafta yüz çerçevenin dışında kalıyordu. Burada merkezden kare kırpma
 * yapılıyor — telefonla çekilmiş portrelerde yüz genelde merkeze yakın.
 */
export async function prepareAvatar(file: File, userId: string): Promise<PreparedImage> {
  const image = await readImage(file);

  // Merkezden en büyük kareyi al.
  const side = Math.min(image.width, image.height);
  const sourceX = (image.width - side) / 2;
  const sourceY = (image.height - side) / 2;

  // Küçük bir fotoğrafı büyütmenin anlamı yok; olduğu boyutta bırak.
  const target = Math.min(AVATAR_SIZE, side);

  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Tarayıcı görsel işlemeyi desteklemiyor.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, target, target);

  const useWebp = supportsWebp();
  const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
  const extension = useWebp ? 'webp' : 'jpg';

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, WEBP_QUALITY)
  );
  if (!blob) throw new Error('Görsel dönüştürülemedi.');

  // Dosya adı zamanla değişiyor: aynı adı korumak, tarayıcı ve CDN
  // önbelleğinde eski fotoğrafın takılı kalması demekti.
  const filename = `profil-fotografi-${Date.now()}.${extension}`;
  const prepared = new File([blob], filename, { type: mimeType });

  return {
    file: prepared,
    // Profil fotoğrafı zaten kare ve küçük; ayrı kopya gerekmiyor.
    thumb: prepared,
    thumbSm: prepared,
    width: target,
    height: target,
    previewUrl: URL.createObjectURL(prepared),
    originalBytes: file.size,
  };
}
