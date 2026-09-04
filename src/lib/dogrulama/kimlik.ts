/**
 * TC kimlik numarası ve vergi kimlik numarası doğrulaması.
 *
 * İki kademe var ve karıştırılmamalı:
 *
 *   1. ALGORİTMA — numaranın kendi içinde tutarlı olup olmadığı. Rastgele
 *      yazılmış on bir haneyi anında eler, ağ erişimi gerektirmez. Ama
 *      "geçerli" demek "bu kişiye ait" demek değil.
 *   2. KİMLİK EŞLEŞMESİ — numaranın ad, soyad ve doğum yılıyla birlikte
 *      NVI'da sorgulanması. Asıl doğrulama bu.
 *
 * Birincisi bu dosyada; ikincisi nvi.ts'te, çünkü ağ çağrısı yapıyor ve
 * başarısız olabiliyor.
 */

/** TCKN algoritma kontrolü. Numaranın birine ait olduğunu göstermez. */
export function tcknGecerliMi(deger: string): boolean {
  const n = deger.trim();
  if (!/^[1-9][0-9]{10}$/.test(n)) return false;

  const d = [...n].map(Number);
  const tek = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const cift = d[1]! + d[3]! + d[5]! + d[7]!;

  if ((tek * 7 - cift) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/**
 * Vergi kimlik numarası algoritma kontrolü (10 hane).
 *
 * Maliye'nin yayımladığı kontrol: her hane sıradaki ağırlıkla işlenip
 * son hane kalanla eşleştiriliyor.
 */
export function vknGecerliMi(deger: string): boolean {
  const n = deger.trim();
  if (!/^[0-9]{10}$/.test(n)) return false;

  const d = [...n].map(Number);
  let toplam = 0;

  for (let i = 0; i < 9; i++) {
    const gecici = (d[i]! + (9 - i)) % 10;
    if (gecici === 0) continue;
    const carpim = (gecici * 2 ** (9 - i)) % 9;
    // 2^k mod 9 sıfır çıkarsa değer 9 kabul ediliyor.
    toplam += carpim === 0 ? 9 : carpim;
  }

  return (10 - (toplam % 10)) % 10 === d[9];
}

/** Girilen adı NVI'nın beklediği biçime getirir: büyük harf, tek boşluk. */
export function adNormalize(deger: string): string {
  return deger.trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr');
}
