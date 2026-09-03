import Link from 'next/link';
import { BadgeCheck, Clock, MapPin, ShieldCheck, Star } from 'lucide-react';

import { OpenBadge } from '@/components/services/ServiceCard';
import { ServiceContact } from '@/components/services/ServiceContact';
import { Badge } from '@/components/ui/badge';
import { getOpenState, normalizeWeek, formatTime, WEEKDAY_NAMES } from '@/lib/opening-hours';
import type { ServiceReview } from '@/lib/queries/services';
import type { ServiceConfig } from '@/lib/services-config';
import { cn } from '@/lib/utils';

/**
 * Hizmet sağlayıcı detay sayfası.
 *
 * Sayfa server component; yalnızca iletişim düğmeleri istemci tarafında.
 * İşletme bilgisi (adres, saatler, hizmetler) arama motoruna dolu HTML
 * olarak gidiyor — yerel aramada bulunabilmenin ön koşulu bu.
 */

type Provider = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  phone_alt: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  license_number: string | null;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  view_count: number;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  service_provider_features: {
    service_features: { id: number; slug: string; name: string; group_name: string; position: number };
  }[];
  service_provider_hours: {
    weekday: number;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
    is_24h: boolean;
  }[];
};

export function ServiceDetail({
  config,
  provider,
  reviews,
  nearby,
}: {
  config: ServiceConfig;
  provider: Provider;
  reviews: ServiceReview[];
  nearby: { id: number; slug: string; name: string; districts: { name: string } | null }[];
}) {
  const hours = provider.service_provider_hours ?? [];
  const openState = getOpenState(hours);
  const week = normalizeWeek(hours);

  const featureGroups = new Map<string, { id: number; name: string }[]>();
  for (const row of provider.service_provider_features ?? []) {
    const feature = row.service_features;
    if (!feature) continue;
    const list = featureGroups.get(feature.group_name) ?? [];
    list.push({ id: feature.id, name: feature.name });
    featureGroups.set(feature.group_name, list);
  }

  const location = [provider.cities?.name, provider.districts?.name].filter(Boolean).join(' / ');

  return (
    <div className="bg-secondary/30">
      <nav aria-label="Kırıntı navigasyonu" className="border-b bg-white">
        <ol className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-1.5 px-5 py-3 text-sm">
          <li>
            <Link href="/" className="text-primary hover:underline">
              Ana Sayfa
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="text-muted-foreground">›</span>
            <Link href={`/${config.slug}`} className="text-primary hover:underline">
              {config.label}
            </Link>
          </li>
          {provider.cities && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-muted-foreground">›</span>
              <Link href={`/${config.slug}/${provider.cities.slug}`} className="text-primary hover:underline">
                {provider.cities.name}
              </Link>
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="text-muted-foreground">›</span>
            <span className="text-muted-foreground">{provider.name}</span>
          </li>
        </ol>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-5 py-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              {provider.name}
              {provider.is_verified && (
                <BadgeCheck className="h-5 w-5 text-emerald-600" aria-label="Doğrulanmış işletme" />
              )}
            </h1>
            {location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            )}
          </div>
          <OpenBadge state={openState} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {provider.description && (
              <section className="overflow-hidden rounded-lg border bg-white">
                <h2 className="border-l-4 border-primary px-4 py-3 font-bold">Hakkında</h2>
                <div className="border-t p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
              </section>
            )}

            {Array.from(featureGroups).map(([group, features]) => (
              <section key={group} className="overflow-hidden rounded-lg border bg-white">
                <h2 className="border-l-4 border-primary px-4 py-3 font-bold">{group}</h2>
                <ul className="flex flex-wrap gap-2 border-t p-4">
                  {features.map((feature) => (
                    <li key={feature.id}>
                      <Badge variant="secondary" className="font-normal">
                        {feature.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="overflow-hidden rounded-lg border bg-white">
              <h2 className="flex items-center gap-2 border-l-4 border-primary px-4 py-3 font-bold">
                <Clock className="h-4 w-4" />
                Çalışma Saatleri
              </h2>
              <table className="w-full border-t text-sm">
                <tbody>
                  {week.map((day) => (
                    <tr key={day.weekday} className="border-b last:border-b-0">
                      <th scope="row" className="w-40 px-4 py-2 text-left font-medium">
                        {WEEKDAY_NAMES[day.weekday]}
                      </th>
                      <td
                        className={cn(
                          'px-4 py-2',
                          day.is_closed ? 'text-muted-foreground' : 'text-foreground'
                        )}
                      >
                        {day.is_24h
                          ? '24 saat açık'
                          : day.is_closed
                            ? 'Kapalı'
                            : `${formatTime(day.opens_at)} – ${formatTime(day.closes_at)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="overflow-hidden rounded-lg border bg-white">
              <h2 className="border-l-4 border-primary px-4 py-3 font-bold">
                Değerlendirmeler{' '}
                {provider.rating_count > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({provider.rating_count})
                  </span>
                )}
              </h2>
              <div className="border-t p-4">
                {reviews.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Henüz değerlendirme yapılmamış.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((review) => (
                      <li key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <Stars value={review.rating} />
                          <span className="text-sm font-medium">
                            {review.public_profiles?.full_name ??
                              review.public_profiles?.username ??
                              'PetSemti Üyesi'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              {provider.rating_count > 0 ? (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-3xl font-bold">
                    {Number(provider.rating_average).toFixed(1)}
                  </span>
                  <div>
                    <Stars value={Math.round(Number(provider.rating_average))} />
                    <p className="text-xs text-muted-foreground">
                      {provider.rating_count} değerlendirme
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mb-4 text-sm text-muted-foreground">Henüz değerlendirme yok</p>
              )}

              {provider.address && (
                <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {provider.address}
                </p>
              )}

              <ServiceContact
                providerId={provider.id}
                phone={provider.phone}
                phoneAlt={provider.phone_alt}
                whatsapp={provider.whatsapp}
                website={provider.website}
                address={provider.address}
                cityName={provider.cities?.name}
                districtName={provider.districts?.name}
              />

              {provider.license_number && (
                <p className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  Oda kayıt no: {provider.license_number}
                </p>
              )}
            </div>

            {nearby.length > 0 && provider.cities && (
              <div className="rounded-lg border bg-white p-4">
                <h2 className="mb-3 font-bold">{provider.cities.name} — Diğer {config.label}</h2>
                <ul className="space-y-2">
                  {nearby.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/${config.slug}/${item.slug}-${item.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary"
                      >
                        {item.name}
                        {item.districts && (
                          <span className="block text-xs">{item.districts.name}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </span>
  );
}
