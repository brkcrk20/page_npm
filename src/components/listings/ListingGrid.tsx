import Image from 'next/image';
import { listingHref } from '@/lib/listing-url';
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

/** Kart üzerindeki tür rozeti. Kayıp ilanı listede ilk bakışta ayırt edilmeli. */
const KIND_BADGE: Record<string, { label: string; className: string }> = {
  sahiplendirme: { label: 'Sahiplendirme', className: 'bg-emerald-600 hover:bg-emerald-600' },
  kayip: { label: 'KAYIP', className: 'bg-red-600 hover:bg-red-600' },
  bulundu: { label: 'BULUNDU', className: 'bg-blue-600 hover:bg-blue-600' },
};

function formatPrice(listing: ListingCard): string {
  // Kayıp/bulundu ilanında fiyat diye bir kavram yok; o satırda tarih daha
  // işe yarar bilgi.
  if (listing.kind === 'kayip' || listing.kind === 'bulundu') {
    if (!listing.event_date) return listing.kind === 'kayip' ? 'Kayıp' : 'Bulundu';
    const tarih = new Date(listing.event_date).toLocaleDateString('tr-TR');
    return listing.kind === 'kayip' ? `${tarih} tarihinde kayboldu` : `${tarih} tarihinde bulundu`;
  }
  if (listing.kind === 'sahiplendirme') return 'Ücretsiz Sahiplendirme';
  if (listing.price === null || Number(listing.price) === 0) return 'Fiyat Belirtilmemiş';

  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  return listing.is_negotiable ? `${formatted} (Pazarlıklı)` : formatted;
}

/**
 * İlan kartı.
 *
 * İKİ AYRI DÜZEN
 * Mobilde YATAY SATIR: solda kare küçük görsel, sağda bilgiler. İki
 * sütunlu ızgara telefonda hem başlıkları iki kelimeye sıkıştırıyor hem de
 * ekranda dört ilan gösteriyordu; satır düzeninde aynı yükseklikte altı
 * ilan ve tam okunabilir başlık var.
 *
 * Masaüstünde DİKEY KART: görsel 4:5. Hayvan fotoğrafları çoğunlukla dikey
 * çekiliyor; 4:3 kırpma kafayı ya da kuyruğu kesiyordu. Konum ve tür
 * bilgisi görselin üstünde, degrade şeridin içinde — bilgi ile fotoğraf
 * arasındaki kopukluğu kaldırıyor.
 */
function PetListingCard({ listing }: { listing: ListingCard }) {
  const cover = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
  const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;
  const age = formatAge(listing.age_months);
  const location = [listing.cities?.name, listing.districts?.name].filter(Boolean).join(' / ');
  const rozet = KIND_BADGE[listing.kind];
  const altBilgi = [listing.breeds?.name, age].filter(Boolean).join(' · ');

  return (
    <Link
      href={listingHref(listing)}
      className="group flex overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50 md:block"
    >
      {/* Görsel — mobilde solda kare, masaüstünde üstte dikey */}
      <div className="relative aspect-square w-28 shrink-0 bg-muted sm:w-32 md:aspect-[4/5] md:w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 767px) 128px, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
            Fotoğraf yok
          </div>
        )}

        {rozet && (
          <Badge className={`absolute left-1.5 top-1.5 px-1.5 py-0 text-[10px] md:left-2 md:top-2 md:px-2 md:py-0.5 md:text-xs ${rozet.className}`}>
            {rozet.label}
          </Badge>
        )}

        {/* Konum yalnızca masaüstünde görselin üstünde; mobilde satırın
            içinde zaten yer var ve degrade küçük görselde okunmuyor. */}
        {location && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 md:block">
            <p className="flex items-center gap-1 text-xs font-medium text-white">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3 md:justify-start md:gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {listing.title}
        </h3>

        {altBilgi && <p className="truncate text-xs text-muted-foreground">{altBilgi}</p>}

        {location && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground md:hidden">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </p>
        )}

        <p className="pt-0.5 text-sm font-bold text-primary md:pt-1">{formatPrice(listing)}</p>
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

  // Mobilde tek sütun (yatay satırlar), masaüstünde ızgara.
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
      {listings.map((listing) => (
        <PetListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
