import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ListingCard } from '@/lib/queries/listings';
import { listingPhotoUrl } from '@/lib/supabase/storage';

/** Ay cinsinden yaşı okunur metne çevirir: 2 -> "2 Aylık", 30 -> "2,5 Yaşında". */
function formatAge(months: number | null): string | null {
  if (months === null || months === undefined) return null;
  if (months < 12) return `${months} Aylık`;
  const years = months / 12;
  const text = Number.isInteger(years) ? `${years}` : years.toFixed(1).replace('.', ',');
  return `${text} Yaşında`;
}

function formatPrice(listing: ListingCard): string {
  if (listing.kind === 'sahiplendirme') return 'Ücretsiz Sahiplendirme';
  if (listing.price === null || Number(listing.price) === 0) return 'Fiyat Belirtilmemiş';

  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  return listing.is_negotiable ? `${formatted} (Pazarlıklı)` : formatted;
}

function PetListingCard({ listing }: { listing: ListingCard }) {
  const cover = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
  const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;
  const age = formatAge(listing.age_months);
  const location = [listing.cities?.name, listing.districts?.name].filter(Boolean).join(' / ');

  return (
    <Link
      href={`/${listing.slug}-${listing.id}`}
      className="group block overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Fotoğraf yok
          </div>
        )}
        {listing.kind === 'sahiplendirme' && (
          <Badge className="absolute left-2 top-2 bg-emerald-600 hover:bg-emerald-600">
            Sahiplendirme
          </Badge>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {listing.title}
        </h3>

        <p className="text-xs text-muted-foreground">
          {[listing.breeds?.name, age].filter(Boolean).join(' · ')}
        </p>

        {location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </p>
        )}

        <p className="pt-1 text-sm font-bold text-primary">{formatPrice(listing)}</p>
      </div>
    </Link>
  );
}

export function ListingGrid({
  listings,
  emptyMessage = 'Bu kriterlere uyan ilan bulunamadı.',
}: {
  listings: ListingCard[];
  emptyMessage?: string;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white/50 py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
      {listings.map((listing) => (
        <PetListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
