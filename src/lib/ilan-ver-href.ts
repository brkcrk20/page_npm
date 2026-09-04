/**
 * Bulunduğun sayfaya göre "İlan Ver" hedefi.
 *
 * Başlıktaki ve alt menüdeki İlan Ver düğmesi her yerde aynı yere, kategori
 * seçtiren genel ekrana gidiyordu. Al-Sat sayfasından basan kullanıcı kedi
 * köpek ırklarıyla, güvercin sayfasından basan kullanıcı malzeme
 * kategorileriyle karşılaşıyordu. Bulunduğu bölüm zaten cevabın kendisi.
 *
 * Kural: hangi bölümdeysen o bölümün formu açılır. Bölümü belirsiz olan
 * yerlerde (profil, yönetim, hizmet rehberleri) seçim ekranı kalıyor.
 */

/** Kendi dikeyi olan bölümler: adres ön eki → ilan verme bölümü. */
const BOLUMLER: [string, string][] = [
  ['/guvercin-ilanlari', '/ilan-ver/guvercin'],
  ['/al-sat', '/ilan-ver/al-sat'],
  ['/kayip', '/ilan-ver/kayip'],
  ['/es-arayanlar', '/ilan-ver/es-arayan'],
  ['/sahiplendirme', '/ilan-ver/sahiplendirme'],
];

/** Bölümü belirsiz olan yollar; burada seçim ekranı gösteriliyor. */
const BELIRSIZ = ['/profil', '/admin', '/mesajlarim', '/doping', '/ilan-ver', '/ilan-duzenle'];

/** Hizmet rehberleri ilan değil işletme kaydı; oradan ilan vermek anlamsız. */
const HIZMET = ['/veteriner', '/pet-oteli', '/pet-kuafor', '/pet-taksi', '/gezdirici', '/egitmen', '/petshop'];

export function ilanVerHref(pathname: string, kategoriSlug?: string | null): string {
  for (const [onek, hedef] of BOLUMLER) {
    if (pathname === onek || pathname.startsWith(`${onek}/`) || pathname.startsWith(`${onek}?`)) {
      return hedef;
    }
  }

  if ([...BELIRSIZ, ...HIZMET].some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return '/ilan-ver';
  }

  // Kategori sayfasındaysak kategoriyi de taşıyoruz: kedi ilanlarına bakan
  // kullanıcıya form kategoriyi tekrar sormasın.
  if (kategoriSlug) return `/ilan-ver/sahiplendirme?kategori=${kategoriSlug}`;

  // Geri kalan her şey (ana sayfa, kategori ve ilan detay sayfaları) hayvan
  // ilanı bölümü.
  return '/ilan-ver/sahiplendirme';
}
