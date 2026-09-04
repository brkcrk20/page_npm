import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceFilterPanel } from '@/components/services/ServiceFilterPanel';
import { Button } from '@/components/ui/button';
import type { ServiceFeature, ServiceProviderCard } from '@/lib/queries/services';
import type { ServiceConfig } from '@/lib/services-config';

/**
 * Hizmet rehberlerinin ortak gövdesi.
 *
 * Yedi hizmet kategorisi ve her birinin genel/şehir/ilçe sayfaları aynı
 * bileşeni kullanıyor. Kategori sayfalarında öğrendiğimiz ders: aynı ekranı
 * ayrı dosyalarda kopyalamak, zamanla birbirinden ayrışan ekranlar demek.
 */

type Crumb = { label: string; href?: string };

export function ServiceDirectory({
  config,
  title,
  intro,
  crumbs,
  providers,
  total,
  page,
  pageCount,
  featureGroups,
  activeFeatures,
  activeSearch,
  verifiedOnly,
  cities,
  activeCitySlug,
  basePath,
  emptyMessage,
}: {
  config: ServiceConfig;
  title: string;
  intro?: string;
  crumbs: Crumb[];
  providers: ServiceProviderCard[];
  total: number;
  page: number;
  pageCount: number;
  featureGroups: { group: string; features: ServiceFeature[] }[];
  activeFeatures: string[];
  activeSearch: string;
  verifiedOnly: boolean;
  cities: { slug: string; name: string; count: number }[];
  activeCitySlug?: string;
  basePath: string;
  emptyMessage: string;
}) {
  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-4">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary hover:underline">
                Ana Sayfa
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                <span aria-hidden>›</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <Building2 className="h-7 w-7 text-primary" />
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} {config.unit} listeleniyor
              {intro ? ` · ${intro}` : ''}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={`/${config.slug}/kayit`}>{config.registerCta}</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <ServiceFilterPanel
              groups={featureGroups}
              activeFeatures={activeFeatures}
              activeSearch={activeSearch}
              verifiedOnly={verifiedOnly}
              unit={config.unit}
            />

            {cities.length > 0 && (
              <div className="rounded-xl border bg-white p-4">
                <h2 className="mb-3 font-bold">Şehirler</h2>
                <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
                  <li>
                    <Link
                      href={`/${config.slug}`}
                      className={
                        !activeCitySlug
                          ? 'flex justify-between rounded px-2 py-1 text-sm font-semibold text-primary'
                          : 'flex justify-between rounded px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary'
                      }
                    >
                      Tüm Türkiye
                    </Link>
                  </li>
                  {cities.map((city) => (
                    <li key={city.slug}>
                      <Link
                        href={`/${config.slug}/${city.slug}`}
                        className={
                          city.slug === activeCitySlug
                            ? 'flex justify-between rounded px-2 py-1 text-sm font-semibold text-primary'
                            : 'flex justify-between rounded px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary'
                        }
                      >
                        <span>{city.name}</span>
                        <span className="text-xs">{city.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <main>
            {providers.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white py-16 text-center">
                <p className="text-muted-foreground">{emptyMessage}</p>
                <Button asChild className="mt-6">
                  <Link href={`/${config.slug}/kayit`}>{config.registerCta}</Link>
                </Button>
              </div>
            ) : (
              <>
                <ul className="space-y-4">
                  {providers.map((provider) => (
                    <li key={provider.id}>
                      <ServiceCard provider={provider} config={config} />
                    </li>
                  ))}
                </ul>

                {pageCount > 1 && (
                  <Pagination page={page} pageCount={pageCount} basePath={basePath} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  basePath,
}: {
  page: number;
  pageCount: number;
  basePath: string;
}) {
  // Sayfa bağlantılarında diğer filtreleri korumak gerekiyor; basePath
  // çağıran sayfada mevcut sorgu dizesiyle birlikte hazırlanıyor.
  const href = (target: number) =>
    basePath.includes('?') ? `${basePath}&sayfa=${target}` : `${basePath}?sayfa=${target}`;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2
  );

  return (
    <nav aria-label="Sayfalama" className="mt-6 flex flex-wrap items-center justify-center gap-1">
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground'
                : 'rounded-md border bg-white px-3 py-1.5 text-sm hover:bg-secondary'
            }
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
