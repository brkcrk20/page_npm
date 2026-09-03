import Link from 'next/link';
import { ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';

import { ListingGallery } from '@/components/listings/ListingGallery';
import { ListingActions } from '@/components/listings/ListingActions';
import { SellerCard } from '@/components/listings/SellerCard';
import { ListingGrid } from '@/components/listings/ListingGrid';
import type { ListingCard, SellerInfo, AdjacentListings } from '@/lib/queries/listings';

/**
 * İlan detay sayfası.
 *
 * Üç sütun: fotoğraf galerisi, özellik tablosu, satıcı kartı. Altında ilan
 * açıklaması ve benzer ilanlar.
 *
 * Sayfa sunucuda render ediliyor; yalnızca galeri gezinme, favorileme ve
 * iletişim düğmeleri istemci bileşeni. Böylece ilan içeriğinin tamamı arama
 * motoruna dolu HTML olarak gidiyor.
 */

type DetailListing = {
  id: number;
  slug: string;
  title: string;
  description: string;
  kind: string;
  price: number | string | null;
  currency: string;
  is_negotiable: boolean;
  is_reserved: boolean;
  age_months: number | null;
  gender: string;
  color: string | null;
  quantity: number;
  is_vaccinated: boolean;
  is_dewormed_internal: boolean;
  is_dewormed_external: boolean;
  is_neutered: boolean;
  has_pedigree: boolean;
  has_microchip: boolean;
  has_health_report: boolean;
  accepts_credit_card: boolean;
  ships_intercity: boolean;
  has_warranty: boolean;
  contact_phone: string | null;
  show_phone: boolean;
  allow_whatsapp: boolean;
  view_count: number;
  whatsapp_count: number;
  phone_count: number;
  published_at: string | null;
  updated_at: string | null;
  owner_id: string;
  breeds: { id: number; name: string; slug: string } | null;
  categories: { id: number; slug: string; name: string } | null;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  listing_photos: { storage_path: string; position: number }[];
};

const GENDER_LABELS: Record<string, string> = {
  erkek: 'Erkek',
  disi: 'Dişi',
  belirtilmemis: 'Belirtilmemiş',
};

const KIND_LABELS: Record<string, string> = {
  satilik: 'Satılık',
  sahiplendirme: 'Ücretsiz Sahiplendirme',
  kayip: 'Kayıp İlanı',
  bulundu: 'Bulundu İlanı',
  es_arayan: 'Eş Arıyor',
};

function formatAge(months: number | null): string {
  if (months === null || months === undefined) return 'Belirtilmemiş';
  if (months < 12) return `${months} Aylık`;
  const years = months / 12;
  const text = Number.isInteger(years) ? `${years}` : years.toFixed(1).replace('.', ',');
  return `${text} Yaşında`;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatPrice(listing: DetailListing): string {
  if (listing.kind === 'sahiplendirme') return 'Ücretsiz Sahiplendirme';
  if (listing.price === null || Number(listing.price) === 0) return 'Fiyat Belirtilmemiş';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(listing.price));
}

export function ListingDetail({
  listing,
  seller,
  similar,
  adjacent,
}: {
  listing: DetailListing;
  seller: SellerInfo | null;
  similar: ListingCard[];
  adjacent: AdjacentListings;
}) {
  const category = listing.categories;
  const breed = listing.breeds;
  const categoryPath = category ? `/${category.slug}` : '/';

  const publishedAt = formatDate(listing.published_at);
  const updatedAt = formatDate(listing.updated_at);

  const rows: { label: string; value: React.ReactNode }[] = [
    // Ekrandaki tabloda iki satır da "DURUM" başlığını taşıyordu; biri fiyat
    // pazarlığı, diğeri ilan tipi. Aynı başlığın iki farklı şeyi anlatması
    // kafa karıştırıcı olduğu için ayrıştırıldı.
    { label: 'FİYAT', value: formatPrice(listing) },
    {
      label: 'PAZARLIK',
      value: listing.is_negotiable ? 'Görüşülür' : 'Sabit Fiyat',
    },
    {
      label: 'TÜRÜ',
      value: category ? (
        <Link href={categoryPath} className="text-primary hover:underline">
          {category.name}
        </Link>
      ) : (
        '—'
      ),
    },
    {
      label: 'CİNSİ',
      value:
        category && breed ? (
          <Link href={`/${category.slug}/${breed.slug}`} className="text-primary hover:underline">
            {breed.name}
          </Link>
        ) : (
          '—'
        ),
    },
    { label: 'İLAN NO', value: String(listing.id) },
    {
      label: 'İLAN TARİHİ',
      value: publishedAt ? (
        <>
          {publishedAt}
          {updatedAt && updatedAt !== publishedAt && (
            <span className="block text-xs text-muted-foreground">Güncellendi: {updatedAt}</span>
          )}
        </>
      ) : (
        '—'
      ),
    },
    { label: 'YAŞ', value: formatAge(listing.age_months) },
    { label: 'CİNSİYET', value: GENDER_LABELS[listing.gender] ?? listing.gender },
    { label: 'İLAN TİPİ', value: KIND_LABELS[listing.kind] ?? listing.kind },
    ...(listing.color ? [{ label: 'RENK', value: listing.color }] : []),
    ...(listing.quantity > 1 ? [{ label: 'ADET', value: String(listing.quantity) }] : []),
    { label: 'AŞI', value: yesNo(listing.is_vaccinated) },
    { label: 'İÇ PARAZİT', value: yesNo(listing.is_dewormed_internal) },
    { label: 'DIŞ PARAZİT', value: yesNo(listing.is_dewormed_external) },
    { label: 'PEDİGRİ', value: yesNo(listing.has_pedigree) },
    { label: 'SAĞLIK RAPORU', value: yesNo(listing.has_health_report) },
    { label: 'KREDİ KARTINA ÖDEME', value: yesNo(listing.accepts_credit_card) },
    { label: 'ŞEHİR DIŞINA GÖNDERİM', value: yesNo(listing.ships_intercity) },
    {
      label: "İLAN WHATSAPP'TAN",
      value: (
        <>
          <span className="font-semibold text-primary">{listing.whatsapp_count}</span> İstek aldı
        </>
      ),
    },
    {
      label: 'İNCELENEN İLAN',
      value: (
        <>
          <span className="font-semibold text-primary">{listing.phone_count}</span> Arama aldı
        </>
      ),
    },
    {
      label: 'GÖRÜNTÜLENME',
      value: `${listing.view_count} Görüntülendi`,
    },
  ];

  return (
    <div className="bg-secondary/30">
      {/* --- Kırıntı navigasyonu --- */}
      <nav aria-label="Kırıntı navigasyonu" className="border-b bg-white">
        <ol className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-1.5 px-5 py-3 text-sm">
          <li>
            <Link href="/" className="text-primary hover:underline">
              Anasayfa
            </Link>
          </li>
          {category && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-muted-foreground">›</span>
              <Link href={categoryPath} className="text-primary hover:underline">
                {category.name}
              </Link>
            </li>
          )}
          {category && breed && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-muted-foreground">›</span>
              <Link href={`/${category.slug}/${breed.slug}`} className="text-primary hover:underline">
                {breed.name}
              </Link>
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="text-muted-foreground">›</span>
            <span className="text-muted-foreground">{listing.title}</span>
          </li>
        </ol>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-5 py-5">
        {/* --- Başlık ve işlemler --- */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-bold md:text-2xl">{listing.title}</h1>
          <ListingActions listingId={listing.id} title={listing.title} />
        </div>

        {/* --- Üç sütun --- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
          <ListingGallery photos={listing.listing_photos ?? []} title={listing.title} />

          {/* Özellik tablosu */}
          <div>
            {listing.cities && (
              <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
                <Link
                  href={category ? `/${category.slug}/${listing.cities.slug}` : '/'}
                  className="text-primary hover:underline"
                >
                  {listing.cities.name}
                </Link>
                {listing.districts && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <Link
                      href={
                        category
                          ? `/${category.slug}/${listing.cities.slug}/${listing.districts.slug}`
                          : '/'
                      }
                      className="text-primary hover:underline"
                    >
                      {listing.districts.name}
                    </Link>
                  </>
                )}
              </p>
            )}

            <dl className="overflow-hidden rounded-lg border bg-white text-sm">
              {rows.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-start gap-4 px-4 py-2.5 ${
                    i % 2 === 1 ? 'bg-secondary/30' : ''
                  } ${i > 0 ? 'border-t' : ''}`}
                >
                  <dt className="w-[46%] shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Satıcı kartı */}
          <div className="space-y-3">
            <SellerCard
              seller={seller}
              listingId={listing.id}
              phone={listing.contact_phone}
              showPhone={listing.show_phone}
              allowWhatsapp={listing.allow_whatsapp}
            />

            {listing.view_count > 0 && (
              <p className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                <Eye className="h-4 w-4 shrink-0" />
                Bu ilan {listing.view_count} kez görüntülendi
              </p>
            )}

            {(adjacent.previous || adjacent.next) && (
              <div className="grid grid-cols-2 gap-2">
                <AdjacentLink
                  href={
                    adjacent.previous
                      ? `/${adjacent.previous.slug}-${adjacent.previous.id}`
                      : undefined
                  }
                  icon={<ChevronsLeft className="h-4 w-4" />}
                  label="Önceki İlan"
                />
                <AdjacentLink
                  href={adjacent.next ? `/${adjacent.next.slug}-${adjacent.next.id}` : undefined}
                  icon={<ChevronsRight className="h-4 w-4" />}
                  label="Sonraki İlan"
                  iconRight
                />
              </div>
            )}
          </div>
        </div>

        {/* --- İlan açıklaması --- */}
        <section className="mt-6 overflow-hidden rounded-lg border bg-white">
          <h2 className="border-l-4 border-primary px-4 py-3 font-bold">İlan Detayları</h2>
          <div className="border-t p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </div>
        </section>

        {/* --- Benzer ilanlar --- */}
        {similar.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-lg border bg-white">
            <h2 className="border-l-4 border-primary px-4 py-3 font-bold">Benzer İlanlar</h2>
            <div className="border-t p-4">
              <ListingGrid listings={similar} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? (
    <span className="font-medium text-emerald-600">Var</span>
  ) : (
    <span className="text-muted-foreground">Yok</span>
  );
}

function AdjacentLink({
  href,
  icon,
  label,
  iconRight,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  iconRight?: boolean;
}) {
  const content = (
    <>
      {!iconRight && icon}
      {label}
      {iconRight && icon}
    </>
  );

  const className =
    'flex items-center justify-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium';

  // Komşu ilan yoksa bağlantı değil, devre dışı bir kutu gösteriyoruz —
  // hiçbir yere gitmeyen bir bağlantı vermektense.
  if (!href) {
    return <span className={`${className} cursor-not-allowed opacity-40`}>{content}</span>;
  }

  return (
    <Link href={href} className={`${className} transition-colors hover:bg-secondary`}>
      {content}
    </Link>
  );
}
