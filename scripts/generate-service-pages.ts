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
 *
 * DİKKAT: bugün yalnızca page.tsx üretiliyor (aşağıdaki döngüye bakın).
 * [segment], [district] ve kayit dosyaları elle bakılıyor.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { SERVICE_CONFIGS } from '../src/lib/services-config';

const ROOT = resolve(__dirname, '../src/app');

const HEADER = '// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts';

function indexPage(slug: string) {
  return `import type { Metadata } from 'next';

import { HizmetRehberi, HIZMET_SUZGECSIZ } from '@/components/pages/HizmetSayfalari';
import { getServiceConfigBySlug } from '@/lib/services-config';

${HEADER}
// Yedi hizmet kategorisi aynı bileşenleri kullanıyor; sayfalar yalnızca
// yapılandırmayı bağlayan ince sarmalayıcılar. Sayfanın gövdesi
// src/components/pages/HizmetSayfalari.tsx içinde: süzgeçli sürüm de aynı
// gövdeyi çiziyor.

const config = getServiceConfigBySlug('${slug}')!;

export const metadata: Metadata = {
  title: config.seoTitle,
  description: config.seoDescription,
  alternates: { canonical: \`/\${config.slug}\` },
};

// İşletme kayıtları nadiren değişiyor; beş dakikalık önbellek
// her istekte veritabanına gitmekten çok daha hızlı.
export const revalidate = 300;

export default async function Page() {
  return <HizmetRehberi hizmet="${slug}" filters={HIZMET_SUZGECSIZ} />;
}
`;
}

// Not: yalnızca genel rehber sayfası (page.tsx) buradan üretiliyor.
// [segment], [district] ve kayit dosyaları bir kez üretildikten sonra elle
// bakılıyor; script onları artık yazmıyor. Bu ayrım açıkça yazılmazsa
// script'i çalıştırmak elle yapılmış düzeltmeleri sessizce geri alıyor —
// bir kez oldu.

for (const config of SERVICE_CONFIGS) {
  const base = resolve(ROOT, config.slug);
  mkdirSync(base, { recursive: true });
  writeFileSync(resolve(base, 'page.tsx'), indexPage(config.slug), 'utf8');
}

console.log(`${SERVICE_CONFIGS.length} hizmet sayfası güncellendi.`);
