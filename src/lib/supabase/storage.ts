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
