/**
 * Sunucudaki sayfa önbelleğini tazeler.
 *
 * Liste sayfaları CDN'de duruyor. Kullanıcı ilan ekleyip/durumunu
 * değiştirip listeye baktığında değişikliği hemen görsün diye tarayıcı
 * /api/tazele'ye haber veriyor; orası ilanın değdiği sayfaları yeniliyor.
 *
 * Hata yutuluyor: veri zaten kaydedilmiş oluyor, tazeleme başarısız olsa
 * bile en geç bir dakika içinde kendiliğinden yenileniyor. Kullanıcıyı
 * ikinci bir hata mesajıyla meşgul etmenin anlamı yok.
 */
export async function onbellegiTazele(ilanNo?: number): Promise<void> {
  try {
    await fetch('/api/tazele', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ilanNo }),
    });
  } catch {
    // sessiz
  }
}

/** İşletme sayfası ve içinde göründüğü rehber listeleri. */
export async function isletmeOnbelleginiTazele(isletmeNo: number): Promise<void> {
  try {
    await fetch('/api/tazele', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isletmeNo }),
    });
  } catch {
    // sessiz
  }
}
