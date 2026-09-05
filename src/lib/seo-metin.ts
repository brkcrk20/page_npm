/**
 * Arama sonucunda görünen metinlerin uzunluk sınırları.
 *
 * Google başlığı yaklaşık 60, açıklamayı yaklaşık 160 karakterde kesiyor.
 * Kesilen metin cümlenin ortasında koptuğu için hem okunmuyor hem de
 * tıklanma oranını düşürüyor.
 *
 * Ölçüldü: 70 sayfalık taramada 22 sayfanın başlığı, 9 sayfanın açıklaması
 * sınırın üstündeydi. En kötüsü "Yumurta Viyolü ve Kuluçka Aparatı İlanları
 * — Satılık ve Sahiplendirme" (80 karakter) — hem uzun, hem de bir viyol
 * "sahiplendirilemeyeceği" için yanlış.
 */

/** Başlık şablonu " | PetSemti" ekliyor; ona yer bırakmak gerekiyor. */
export const BASLIK_SINIRI = 60 - ' | PetSemti'.length;
export const ACIKLAMA_SINIRI = 158;

/**
 * Sığan ilk adayı seçer.
 *
 * Başlığı kırpmak yerine en zengin sığan biçimi seçmek daha iyi: kısa
 * cinslerde "Akbaş — Satılık ve Sahiplendirme İlanları", uzun olanlarda
 * "Amerikan Cocker Spaniel İlanları". İkisi de tam cümle; hiçbiri "…" ile
 * yarıda kalmıyor. Hiçbir aday sığmazsa sonuncusu kelime sınırında kırpılır.
 */
export function seoBaslikSec(...adaylar: string[]): string {
  return siganiSec(adaylar, BASLIK_SINIRI);
}

/**
 * Açıklamada da aynı sorun var: uzun cins adları iki kez geçince metin
 * 160 karakteri aşıyor ("Yumurta Viyolü ve Kuluçka Aparatı" ile 179).
 * Adı bir kez anan daha kısa bir varyant sığıyor.
 */
export function seoAciklamaSec(...adaylar: string[]): string {
  return siganiSec(adaylar, ACIKLAMA_SINIRI);
}

function siganiSec(adaylar: string[], sinir: number): string {
  const temiz = adaylar.map(bosluklariTopla).filter(Boolean);
  for (const aday of temiz) {
    if (aday.length <= sinir) return aday;
  }
  const enKisa = temiz.reduce((a, b) => (b.length < a.length ? b : a), temiz[0] ?? '');
  return kisalt(enKisa, sinir);
}

export function seoBaslik(metin: string): string {
  return kisalt(bosluklariTopla(metin), BASLIK_SINIRI);
}

export function seoAciklama(metin: string): string {
  return kisalt(bosluklariTopla(metin), ACIKLAMA_SINIRI);
}

function bosluklariTopla(metin: string): string {
  return metin.replace(/\s+/g, ' ').trim();
}

/** Kelime sınırında kırpar; ortadan kesilen kelime metni anlamsızlaştırıyor. */
function kisalt(metin: string, sinir: number): string {
  if (metin.length <= sinir) return metin;

  const kesit = metin.slice(0, sinir - 1);
  const bosluk = kesit.lastIndexOf(' ');
  // Son kelime aşırı uzunsa (boşluk çok geride kaldıysa) sert kesmek daha iyi.
  const govde = bosluk > sinir * 0.6 ? kesit.slice(0, bosluk) : kesit;
  return `${govde.replace(/[\s,;:—-]+$/, '')}…`;
}
