import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';

import type { ServiceConfig } from '@/lib/services-config';
import type { KatalogSatiri } from '@/lib/katalog';

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
  eslesenler,
  aranan,
}: {
  provider: ServiceProviderCard;
  config: ServiceConfig;
  /** Aramada bu işletmenin kataloğunda eşleşen satırlar. */
  eslesenler?: KatalogSatiri[];
  /** Aranan metin; eşleşme rozetinde geçiyor. */
  aranan?: string;
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
            <Link href={`/${config.slug}/${provider.slug}-${provider.id}`} className="hover:text-primary" prefetch={false}>
              {provider.name}
            </Link>
            {provider.is_verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-emerald-600"
                aria-label="Doğrulanmış işletme"
              />
            )}
            {/* Vitrin için eklenmiş örnek kayıt. */}
            {provider.is_demo && (
              <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                Örnek
              </span>
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

      {/*
        Aramada eşleşen katalog satırları.

        "royal canin" arayan kişi beş mağaza görünce hangisinde hangi
        paketin kaça olduğunu da görmeli; yoksa mağazaları tek tek açmak
        zorunda kalıyor. Yalnızca aramada çıkıyor, normal listede kart
        şişmesin.
      */}
      {eslesenler && eslesenler.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-900">
            {/* Ek almayan bir kalıp: "mağaza" + "-te" = "mağazate". Bölüme
                göre değişen birim adına Türkçe hâl eki takmak yedi bölümün
                hepsinde doğru sonuç vermiyor. */}
            {aranan ? `"${aranan}" için burada:` : 'Bu işletmede:'}
          </p>
          <ul className="space-y-1.5">
            {eslesenler.map((satir) => (
              <li key={satir.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {satir.brand && <span className="font-medium">{satir.brand} </span>}
                  {satir.name}
                  {satir.unit && (
                    <span className="text-muted-foreground"> · {satir.unit}</span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {satir.stock === 0 && (
                    <span className="text-xs text-muted-foreground">Tükendi</span>
                  )}
                  {satir.price !== null && (
                    <span className="font-semibold text-primary">
                      ₺{new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(satir.price)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/${config.slug}/${provider.slug}-${provider.id}`}
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
       prefetch={false}>
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
