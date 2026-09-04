/**
 * Supabase Storage yol yardımcıları.
 *
 * İlan fotoğrafları veritabanında yalnızca depolama yolu olarak tutuluyor
 * (ör. "12/0.jpg"), tam URL olarak değil. Sebebi: proje adresi ya da kova adı
 * değiştiğinde binlerce satırı güncellemek gerekmesin.
 */

export const LISTING_PHOTO_BUCKET = 'ilan-fotograflari';

/**
 * Depolama yolundan herkese açık URL üretir.
 *
 * Kova public olduğu için imzalı URL'e gerek yok; bu sayede adres deterministik
 * ve Next.js görsel önbelleğiyle uyumlu kalıyor.
 */
/**
 * Kova ve yoldan herkese açık adres üretir.
 *
 * Adres KENDİ ALAN ADIMIZDAN veriliyor (/gorsel/...). Daha önce doğrudan
 * depolama sağlayıcısını gösteriyordu; bu hem altyapıyı her ziyaretçiye
 * duyuruyor, hem görsel aramasından gelen otoriteyi başka bir alan adına
 * yazıyor, hem de sağlayıcı değişirse yayınlanmış bütün adresleri
 * kırıyordu. Yönlendirme next.config.ts içindeki rewrite kuralında.
 */
function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;

  // Eski kayıtlarda tam URL saklanmış olabilir; olduğu gibi kullan.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  return `/gorsel/${bucket}/${path.replace(/^\/+/, '')}`;
}

export function listingPhotoUrl(storagePath: string): string | null {
  return publicUrl(LISTING_PHOTO_BUCKET, storagePath);
}

export const LISTING_VIDEO_BUCKET = 'ilan-videolari';

/**
 * Video oynatma adresi.
 *
 * Şu an yalnızca Supabase Storage yolu destekleniyor. Harici bir video
 * platformuna geçildiğinde (listing_videos.provider) burada o platformun
 * oynatma adresi döndürülecek; çağıran taraf değişmeyecek.
 */
export function listingVideoUrl(video: {
  provider?: string | null;
  storage_path?: string | null;
  playback_url?: string | null;
}): string | null {
  if (video.playback_url) return video.playback_url;
  if (!video.storage_path) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = video.storage_path.replace(/^\/+/, '');
  return publicUrl(LISTING_VIDEO_BUCKET, clean);
}

export const AVATAR_BUCKET = 'profil-fotograflari';

/**
 * Profil fotoğrafının herkese açık URL'i.
 *
 * avatar_url kolonunda tam URL de saklanabiliyor (eski kayıtlar, dış
 * sağlayıcılar); o durumda olduğu gibi kullanılıyor.
 */
export function avatarUrl(path: string | null | undefined): string | null {
  return publicUrl(AVATAR_BUCKET, path);
}

export const BUSINESS_IMAGE_BUCKET = 'isletme-gorselleri';

/**
 * İşletme logosu / fotoğrafı adresi.
 *
 * Rehberdeki her kart aynı görünüyordu: bir isim, bir adres, bir puan.
 * Kullanıcı klinik ya da otel seçerken en çok mekânın kendisine bakıyor;
 * o alan sitede hiç yoktu.
 */
export function businessImageUrl(path: string | null | undefined): string | null {
  return publicUrl(BUSINESS_IMAGE_BUCKET, path);
}
