import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Shield, Syringe, Truck, CreditCard, Award } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { listingPhotoUrl } from '@/lib/supabase/storage';

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
  view_count: number;
  published_at: string | null;
  breeds: { id: number; name: string; slug: string } | null;
  categories: { id: number; slug: string; name: string } | null;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  listing_photos: { storage_path: string; position: number }[];
};

function formatAge(months: number | null): string {
  if (months === null || months === undefined) return 'Belirtilmemiş';
  if (months < 12) return `${months} Aylık`;
  const years = months / 12;
  const text = Number.isInteger(years) ? `${years}` : years.toFixed(1).replace('.', ',');
  return `${text} Yaşında`;
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

const GENDER_LABELS: Record<string, string> = {
  erkek: 'Erkek',
  disi: 'Dişi',
  belirtilmemis: 'Belirtilmemiş',
};

export function ListingDetail({ listing }: { listing: DetailListing }) {
  const photos = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position);
  const cover = photos[0] ? listingPhotoUrl(photos[0].storage_path) : null;

  const location = [listing.cities?.name, listing.districts?.name].filter(Boolean).join(' / ');

  // Yalnızca doğru olan rozetleri gösteriyoruz; "aşısız" gibi olumsuz bir
  // etiket basmak satıcıyı haksız yere cezalandırır (bilgi girilmemiş de olabilir).
  const badges = [
    listing.is_vaccinated && { icon: Syringe, label: 'Aşıları Tam' },
    listing.has_pedigree && { icon: Award, label: 'Pedigrili' },
    listing.has_health_report && { icon: Shield, label: 'Sağlık Raporlu' },
    listing.is_neutered && { icon: Shield, label: 'Kısırlaştırılmış' },
    listing.has_microchip && { icon: Shield, label: 'Çipli' },
    listing.accepts_credit_card && { icon: CreditCard, label: 'Kredi Kartı' },
    listing.ships_intercity && { icon: Truck, label: 'Şehir Dışına Kargo' },
  ].filter(Boolean) as { icon: any; label: string }[];

  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary hover:underline">
                Ana Sayfa
              </Link>
            </li>
            {listing.categories && (
              <li className="flex items-center gap-1">
                <span aria-hidden>›</span>
                <Link
                  href={`/${listing.categories.slug}`}
                  className="hover:text-primary hover:underline"
                >
                  {listing.categories.name}
                </Link>
              </li>
            )}
            {listing.categories && listing.breeds && (
              <li className="flex items-center gap-1">
                <span aria-hidden>›</span>
                <Link
                  href={`/${listing.categories.slug}/${listing.breeds.slug}`}
                  className="hover:text-primary hover:underline"
                >
                  {listing.breeds.name}
                </Link>
              </li>
            )}
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="relative aspect-[4/3] bg-muted">
                {cover ? (
                  <Image
                    src={cover}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Fotoğraf yok
                  </div>
                )}
              </div>

              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {photos.slice(1).map((photo) => {
                    const url = listingPhotoUrl(photo.storage_path);
                    if (!url) return null;
                    return (
                      <div
                        key={photo.position}
                        className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md"
                      >
                        <Image
                          src={url}
                          alt={`${listing.title} — ${photo.position + 1}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Card>
              <CardContent className="space-y-4 p-5">
                <h2 className="text-lg font-bold">İlan Açıklaması</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <h1 className="text-xl font-bold leading-snug">{listing.title}</h1>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {formatPrice(listing)}
                    {listing.is_negotiable && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        Pazarlıklı
                      </span>
                    )}
                  </p>
                  {listing.is_reserved && (
                    <Badge variant="secondary" className="mt-2">
                      Rezerve
                    </Badge>
                  )}
                </div>

                <dl className="space-y-2 border-t pt-4 text-sm">
                  <Row label="İlan No" value={`#${listing.id}`} />
                  {listing.breeds && <Row label="Cins" value={listing.breeds.name} />}
                  <Row label="Yaş" value={formatAge(listing.age_months)} />
                  <Row label="Cinsiyet" value={GENDER_LABELS[listing.gender] ?? listing.gender} />
                  {listing.color && <Row label="Renk" value={listing.color} />}
                  {listing.quantity > 1 && <Row label="Adet" value={`${listing.quantity}`} />}
                </dl>

                {location && (
                  <p className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {location}
                  </p>
                )}

                {listing.published_at && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {new Date(listing.published_at).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </CardContent>
            </Card>

            {badges.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="mb-3 text-sm font-bold">Özellikler</h2>
                  <ul className="space-y-2">
                    {badges.map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
