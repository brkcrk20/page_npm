/**
 * İlan adresi.
 *
 * ESKİ: /sevimli-yavrularimiz-18
 * YENİ: /izmir/toy-poodle/sevimli-yavrularimiz-18
 *
 * Şehir ve cins adreste geçiyor. Adres, arama sonucunda başlığın altında
 * görünen ve tıklanma kararına giren bir şey; "izmir/toy-poodle" gören
 * kullanıcı ne bulacağını biliyor.
 *
 * NUMARA NEDEN DURUYOR
 * Başlık değişince adres de değişirse eski adresler kırılır. Numara
 * sabit kimlik: başlık, şehir ya da cins değişse bile ilan bulunuyor,
 * eski adres yeni adrese yönlendiriliyor.
 *
 * ÇAKIŞMA YOK
 * Üçüncü parça her zaman "-<sayı>" ile bitiyor; şehir ve ilçe adresleri
 * asla rakamla bitmiyor. Aynı desen sitenin başka yerlerinde de kullanılıyor
 * (işletme adresleri), dolayısıyla yeni bir kural getirmiyor.
 */

export type IlanAdresi = {
  id: number;
  slug: string;
  cities?: { slug: string } | null;
  breeds?: { slug: string } | null;
};

/** Şehir ya da cins yoksa eski düz adres kullanılıyor; ikisi de zorunlu değil. */
export function listingHref(listing: IlanAdresi): string {
  const sehir = listing.cities?.slug;
  const cins = listing.breeds?.slug;
  const son = `${listing.slug}-${listing.id}`;

  if (sehir && cins) return `/${sehir}/${cins}/${son}`;
  return `/${son}`;
}

/** Adresin son parçasından ilan numarasını çıkarır. */
export function ilanNoAyikla(segment: string): number | null {
  const m = /^(.*)-(\d+)$/.exec(segment);
  if (!m || !m[1]) return null;
  const no = Number(m[2]);
  return Number.isFinite(no) ? no : null;
}
