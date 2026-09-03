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
export function listingPhotoUrl(storagePath: string): string | null {
  if (!storagePath) return null;

  // Eski kayıtlarda tam URL saklanmış olabilir; olduğu gibi kullan.
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  const clean = storagePath.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${LISTING_PHOTO_BUCKET}/${clean}`;
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
  return `${base}/storage/v1/object/public/${LISTING_VIDEO_BUCKET}/${clean}`;
}

export const AVATAR_BUCKET = 'profil-fotograflari';

/**
 * Profil fotoğrafının herkese açık URL'i.
 *
 * avatar_url kolonunda tam URL de saklanabiliyor (eski kayıtlar, dış
 * sağlayıcılar); o durumda olduğu gibi kullanılıyor.
 */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${path.replace(/^\/+/, '')}`;
}
