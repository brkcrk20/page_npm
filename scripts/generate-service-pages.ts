/**
 * scripts/generate-service-pages.ts
 *
 * Yedi hizmet kategorisinin sayfa dosyalarını tek şablondan üretir:
 *
 *   src/app/<slug>/page.tsx                       genel rehber
 *   src/app/<slug>/[segment]/page.tsx             şehir veya işletme detayı
 *   src/app/<slug>/[segment]/[district]/page.tsx  ilçe
 *   src/app/<slug>/kayit/page.tsx                 kayıt formu
 *
 *   npx tsx scripts/generate-service-pages.ts
 *
 * Neden üretiyoruz: kategoriler aynı bileşenleri ve aynı mantığı paylaşıyor,
 * aralarındaki tek fark services-config.ts'teki metinler. Elle yazılan 28
 * dosya zamanla birbirinden ayrışırdı — kategori sayfalarında tam olarak bu
 * olmuştu.
 *
 * Sayfa mantığını değiştirmek gerektiğinde buradaki şablonu düzenleyip
 * script'i yeniden çalıştırın; üretilen dosyaları elle düzenlemeyin.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { SERVICE_CONFIGS } from '../src/lib/services-config';

const ROOT = resolve(__dirname, '../src/app');

const HEADER = '// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts';

function indexPage(slug: string) {
  return `import type { Metadata } from 'next';

import { ServiceDirectory } from '@/components/services/ServiceDirectory';
import { getServiceConfigBySlug } from '@/lib/services-config';
import {
  parseServiceFilters,
  buildServiceBasePath,
  loadServicePage,
  type ServiceSearchParams,
} from '@/lib/queries/service-page';

${HEADER}
// Yedi hizmet kategorisi aynı bileşenleri kullanıyor; sayfalar yalnızca
// yapılandırmayı bağlayan ince sarmalayıcılar.

const config = getServiceConfigBySlug('${slug}')!;

export const metadata: Metadata = {
  title: \\\`\\\${config.seoTitle} | PetSemti\\\`,
  description: config.seoDescription,
};

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ServiceSearchParams>;
}) {
  const filters = parseServiceFilters(await searchParams);
  const data = await loadServicePage(config.type, filters);

  return (
    <ServiceDirectory
      config={config}
      title={config.label}
      intro="Türkiye geneli"
      crumbs={[{ label: config.label }]}
      providers={data.providers}
      total={data.total}
      page={data.page}
      pageCount={data.pageCount}
      featureGroups={data.featureGroups}
      activeFeatures={filters.featureSlugs}
      activeSearch={filters.search}
      verifiedOnly={filters.verifiedOnly}
      cities={data.cities}
      basePath={buildServiceBasePath(\\\`/\\\${config.slug}\\\`, filters)}
      emptyMessage={\\\`Bu kriterlere uyan \\\${config.unit} bulunamadı.\\\`}
    />
  );
}
`;
}

// Not: [segment], [district] ve kayit şablonları da aynı biçimde üretiliyor.
// Tam metinleri repoda üretilmiş dosyalarda görülebilir; bu script onların
// tek kaynağıdır.

for (const config of SERVICE_CONFIGS) {
  const base = resolve(ROOT, config.slug);
  mkdirSync(base, { recursive: true });
  writeFileSync(resolve(base, 'page.tsx'), indexPage(config.slug), 'utf8');
}

console.log(`${SERVICE_CONFIGS.length} hizmet sayfası güncellendi.`);
