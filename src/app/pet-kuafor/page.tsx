import type { Metadata } from 'next';

import { HizmetRehberi, HIZMET_SUZGECSIZ } from '@/components/pages/HizmetSayfalari';
import { getServiceConfigBySlug } from '@/lib/services-config';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
// Yedi hizmet kategorisi aynı bileşenleri kullanıyor; sayfalar yalnızca
// yapılandırmayı bağlayan ince sarmalayıcılar. Sayfanın gövdesi
// src/components/pages/HizmetSayfalari.tsx içinde: süzgeçli sürüm de aynı
// gövdeyi çiziyor.

const config = getServiceConfigBySlug('pet-kuafor')!;

export const metadata: Metadata = {
  title: config.seoTitle,
  description: config.seoDescription,
  alternates: { canonical: `/${config.slug}` },
};

// İşletme kayıtları nadiren değişiyor; beş dakikalık önbellek
// her istekte veritabanına gitmekten çok daha hızlı.
export const revalidate = 300;

export default async function Page() {
  return <HizmetRehberi hizmet="pet-kuafor" filters={HIZMET_SUZGECSIZ} />;
}
