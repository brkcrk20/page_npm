import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';

import type { ServiceConfig } from '@/lib/services-config';

import { Badge } from '@/components/ui/badge';
import { getOpenState } from '@/lib/opening-hours';
import type { ServiceProviderCard } from '@/lib/queries/services';
import { businessImageUrl } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

/**
 * Rehber listesindeki işletme kartı.
 *
 * Kart bilinçli olarak "şu an açık mı" bilgisini öne çıkarıyor: hizmet
 * ararken ziyaretçinin ilk sorusu bu, özellikle veteriner gibi acil
 * kategorilerde.
 */
export function ServiceCard({
  provider,
  config,
}: {
  provider: ServiceProviderCard;
  config: ServiceConfig;
}) {
  const openState = getOpenState(provider.service_provider_hours ?? []);
  const location = [provider.cities?.name, provider.districts?.name].filter(Boolean).join(' / ');

  // Kartta yalnızca "Hizmetler" grubundan birkaç rozet gösteriyoruz;
  // 26 özelliğin tamamı kartı okunmaz hale getirirdi.
  const highlights = (provider.service_provider_features ?? [])
    .map((f) => f.service_features)
    .filter((f) => f && f.group_name === 'Hizmetler')
    .sort((a, b) => a.position - b.position)
    .slice(0, 4);

  const logo = businessImageUrl(provider.logo_url);

  return (
    <article className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Logo. İşletmeler birbirinden yalnızca isimle ayrılıyordu;
            kullanıcı hizmet ararken önce mekânı tanımak istiyor. */}
        {logo && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
            <Image src={logo} alt={`${provider.name} logosu`} fill sizes="56px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-base font-bold">
            <Link href={`/${config.slug}/${provider.slug}-${provider.id}`} className="hover:text-primary">
              {provider.name}
            </Link>
            {provider.is_verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-emerald-600"
                aria-label="Doğrulanmış işletme"
              />
            )}
          </h3>

          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {location}
            </p>
          )}
        </div>

        <OpenBadge state={openState} />
      </div>

      {provider.rating_count > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{Number(provider.rating_average).toFixed(1)}</span>
          <span className="text-muted-foreground">({provider.rating_count} değerlendirme)</span>
        </p>
      )}

      {provider.address && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{provider.address}</p>
      )}

      {highlights.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {highlights.map((feature) => (
            <li key={feature.id}>
              <Badge variant="secondary" className="font-normal">
                {feature.name}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/${config.slug}/${provider.slug}-${provider.id}`}
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        Detayları Gör →
      </Link>
    </article>
  );
}

export function OpenBadge({ state }: { state: ReturnType<typeof getOpenState> }) {
  if (state.status === 'bilinmiyor') return null;

  const isOpen = state.status === 'acik' || state.status === 'acik_24';

  const label =
    state.status === 'acik_24'
      ? '7/24 Açık'
      : state.status === 'acik'
        ? state.until
          ? `Açık · ${state.until}'e kadar`
          : 'Şu an açık'
        : 'Kapalı';

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
        isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </span>
  );
}
