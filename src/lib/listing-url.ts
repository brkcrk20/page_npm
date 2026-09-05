/**
 * İlan adresi.
 *
 * ESKİ: /sevimli-yavrularimiz-18
 * YENİ: /izmir-toy-poodle-sevimli-yavrularimiz-18
 *
 * Tek parça, tire ile: şehir, cins, başlık, numara. Adres arama sonucunda
 * başlığın altında görünen ve tıklanma kararına giren bir şey; "izmir toy
 * poodle" arayan kişi aradığı kelimeleri adreste görüyor.
 *
 * NUMARA NEDEN SONDA
 * Başlık, şehir ya da cins değişince adres de değişiyor. Numara sabit
 * kimlik: eski adresten hangi ilan olduğu bulunup yeni adrese
 * yönlendiriliyor. Sonda olması ayrıştırmayı da tekilleştiriyor —
 * "-<sayı>" ile biten kök adres her zaman ilandır.
 *
 * ÇAKIŞMA YOK
 * Kategori adresleri ("kopek-ilanlari") rakamla bitmiyor; kök segment
 * çözümleyicisi zaten bu kurala göre çalışıyor.
 */

export type IlanAdresi = {
  id: number;
  slug: string;
  cities?: { slug: string } | null;
  breeds?: { slug: string } | null;
};

/** Şehir ya da cins yoksa o parça atlanıyor; ikisi de zorunlu değil. */
export function listingHref(listing: IlanAdresi): string {
  const parcalar = [listing.cities?.slug, listing.breeds?.slug, listing.slug].filter(Boolean);
  return `/${parcalar.join('-')}-${listing.id}`;
}

/** Adresin son parçasından ilan numarasını çıkarır. */
export function ilanNoAyikla(segment: string): number | null {
  const m = /^(.*)-(\d+)$/.exec(segment);
  if (!m || !m[1]) return null;
  const no = Number(m[2]);
  return Number.isFinite(no) ? no : null;
}
