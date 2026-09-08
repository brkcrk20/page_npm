import { SITE_URL } from '@/lib/site';
import { listingHref } from '@/lib/listing-url';

/**
 * schema.org nesneleri.
 *
 * Tek yerde toplanıyor: aynı şemayı iki sayfada farklı yazmak, birinde
 * yapılan düzeltmenin diğerine geçmemesi demek. Ayrıca boş alanlar
 * bilerek atlanıyor — Google eksik değerli bir alanı hatalı sayıyor,
 * hiç olmamasından kötü.
 */

function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as T;
}

export function organizationSchema(contact: {
  legal_name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  youtube?: string;
}) {
  const sameAs = [contact.instagram, contact.facebook, contact.x, contact.youtube].filter(Boolean);

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PetSemti',
    legalName: contact.legal_name,
    url: SITE_URL,
    /**
     * Logo ImageObject olarak veriliyor.
     *
     * Google logo için ölçüsü belli bir raster görsel istiyor; SVG'de
     * genişlik ve yükseklik olmadığı için "logo" alanı çoğu zaman
     * yok sayılıyordu. Bilgi panelinde ve arama sonucunda marka
     * görselinin çıkabilmesi için gerekli.
     */
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/marka/ikon-1024.png`,
      width: 1024,
      height: 1024,
    },
    image: `${SITE_URL}/marka/paylasim-karti.png`,
    description:
      'PetSemti; evcil hayvan ilanları, yerel pet hizmetleri ve güvercin dünyası tek platformda.',
    email: contact.email,
    telephone: contact.phone,
    // İletişim noktası ayrıca veriliyor: Google bunu "müşteri hizmetleri"
    // olarak ayrı bir alan sayıyor ve e-posta/telefon alanlarından
    // bağımsız değerlendiriyor.
    contactPoint:
      contact.email || contact.phone
        ? clean({
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: contact.email,
            telephone: contact.phone,
            areaServed: 'TR',
            availableLanguage: ['Turkish'],
          })
        : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    areaServed: { '@type': 'Country', name: 'Türkiye' },
  });
}

/** Arama kutusu: Google sonuçlarında site içi arama alanı gösterebiliyor. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PetSemti',
    url: SITE_URL,
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => clean({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * İlan → Product + Offer.
 *
 * Ücretsiz sahiplendirmede fiyat 0 veriliyor, "fiyat yok" değil: Google
 * fiyatsız bir Offer'ı geçersiz sayıyor ve zengin sonuç göstermiyor.
 */
export function listingSchema(listing: {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: number | string | null;
  currency: string;
  kind: string;
  images: string[];
  breedName?: string | null;
  categoryName?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  publishedAt?: string | null;
  sellerName?: string | null;
  /** Kanonik adresi kurmak için; eksikse eski düz adrese düşülüyor. */
  cities?: { slug: string } | null;
  breeds?: { slug: string } | null;
}) {
  const price = listing.price === null ? 0 : Number(listing.price);
  const location = [listing.districtName, listing.cityName].filter(Boolean).join(', ');

  return clean({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description.slice(0, 500),
    image: listing.images.length ? listing.images : undefined,
    category: listing.categoryName,
    brand: listing.breedName ? { '@type': 'Brand', name: listing.breedName } : undefined,
    url: `${SITE_URL}${listingHref(listing)}`,
    sku: String(listing.id),
    offers: clean({
      '@type': 'Offer',
      price,
      priceCurrency: listing.currency || 'TRY',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      url: `${SITE_URL}${listingHref(listing)}`,
      availableAtOrFrom: location
        ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'TR' } }
        : undefined,
      seller: listing.sellerName ? { '@type': 'Person', name: listing.sellerName } : undefined,
    }),
  });
}

/**
 * Hizmet türüne karşılık gelen schema.org tipi.
 *
 * Genel "LocalBusiness" yerine daha dar tip vermek, Google'ın işletmeyi
 * doğru kategoride değerlendirmesini sağlıyor: veteriner kliniği için
 * VeterinaryCare, pet oteli için ayrı bir tip var. Karşılığı olmayan
 * türlerde LocalBusiness'ta kalınıyor — uydurma bir tip vermek
 * işaretlemeyi geçersiz kılar.
 */
const HIZMET_SEMA_TIPI: Record<string, string> = {
  veteriner: 'VeterinaryCare',
  pet_oteli: 'AnimalShelter',
  petshop: 'PetStore',
  kuafor: 'HealthAndBeautyBusiness',
};

/** İşletme kaydı → LocalBusiness. Harita ve yerel sonuçlar için. */
export function localBusinessSchema(p: {
  name: string;
  slug: string;
  serviceSlug: string;
  serviceType?: string;
  id?: number;
  image?: string | null;
  openingHours?: { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean; is_24h: boolean }[];
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ratingAverage?: number | null;
  ratingCount?: number | null;
}) {
  // Gün numarası → schema.org gün adı. Pazartesi 1, pazar 7.
  const GUNLER = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];
  const saatler = (p.openingHours ?? [])
    .filter((h) => !h.is_closed && (h.is_24h || (h.opens_at && h.closes_at)))
    .map((h) =>
      clean({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${GUNLER[(h.weekday - 1 + 7) % 7]}`,
        opens: h.is_24h ? '00:00' : (h.opens_at ?? '').slice(0, 5),
        closes: h.is_24h ? '23:59' : (h.closes_at ?? '').slice(0, 5),
      })
    );

  return clean({
    '@context': 'https://schema.org',
    '@type': HIZMET_SEMA_TIPI[p.serviceType ?? ''] ?? 'LocalBusiness',
    name: p.name,
    description: p.description ?? undefined,
    url: `${SITE_URL}/${p.serviceSlug}/${p.slug}${p.id ? `-${p.id}` : ''}`,
    image: p.image ?? undefined,
    openingHoursSpecification: saatler.length ? saatler : undefined,
    telephone: p.phone ?? undefined,
    address: clean({
      '@type': 'PostalAddress',
      streetAddress: p.address ?? undefined,
      addressLocality: p.districtName ?? p.cityName ?? undefined,
      addressRegion: p.cityName ?? undefined,
      addressCountry: 'TR',
    }),
    geo:
      p.latitude && p.longitude
        ? { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude }
        : undefined,
    // Puan yoksa aggregateRating gönderilmiyor: sıfır oylu bir puan
    // Google tarafından hatalı sayılıyor.
    aggregateRating:
      p.ratingCount && p.ratingCount > 0
        ? { '@type': 'AggregateRating', ratingValue: p.ratingAverage, reviewCount: p.ratingCount }
        : undefined,
  });
}

/** Kategori ve cins sayfaları → ItemList. */
export function itemListSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${SITE_URL}${item.url}`,
    })),
  };
}
