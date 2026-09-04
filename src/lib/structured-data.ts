import { SITE_URL } from '@/lib/site';

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
    logo: `${SITE_URL}/favicon.ico`,
    email: contact.email,
    telephone: contact.phone,
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
    url: `${SITE_URL}/${listing.slug}-${listing.id}`,
    sku: String(listing.id),
    offers: clean({
      '@type': 'Offer',
      price,
      priceCurrency: listing.currency || 'TRY',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      url: `${SITE_URL}/${listing.slug}-${listing.id}`,
      availableAtOrFrom: location
        ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'TR' } }
        : undefined,
      seller: listing.sellerName ? { '@type': 'Person', name: listing.sellerName } : undefined,
    }),
  });
}

/** İşletme kaydı → LocalBusiness. Harita ve yerel sonuçlar için. */
export function localBusinessSchema(p: {
  name: string;
  slug: string;
  serviceSlug: string;
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
  return clean({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.name,
    description: p.description ?? undefined,
    url: `${SITE_URL}/${p.serviceSlug}/${p.slug}`,
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
