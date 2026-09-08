import type { Metadata } from 'next';

import { seoAciklama, seoBaslikSec } from '@/lib/seo-metin';

import {
  HIZMET_SUZGECSIZ,
  HizmetIlcesi,
  hizmetIlcesiniCoz,
} from '@/components/pages/HizmetSayfalari';
import { getServiceConfigBySlug } from '@/lib/services-config';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
// Yalnızca ikinci segment bir şehir olduğunda anlamlı; işletme detayının
// altında ilçe kırılımı yok.

const config = getServiceConfigBySlug('pet-oteli')!;

type Params = { segment: string; district: string };

/** Çözümleme gövdeyle ortak; iki yerde ayrı kural kalmasın. */
const load = (params: Params) => hizmetIlcesiniCoz(params.segment, params.district);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { city, district } = loaded;
  return {
    title: seoBaslikSec(
      `${district.name} ${config.label} — ${city.name}`,
      `${district.name} ${config.label}`
    ),
    // Tek cümle 55 karakterde bitiyordu; arama sonucundaki yerin yarısı boş
    // kalıyor ve sayfanın ne sunduğu söylenmiyordu.
    description: seoAciklama(
      `${city.name} ${district.name} bölgesindeki ${config.label.toLocaleLowerCase('tr')}. Adres, telefon ve çalışma saatlerini görün, size en yakınını seçin.`
    ),
    alternates: { canonical: `/${config.slug}/${city.slug}/${district.slug}` },
  };
}

// İşletme kayıtları nadiren değişiyor; beş dakikalık önbellek
// her istekte veritabanına gitmekten çok daha hızlı.
export const revalidate = 300;

/**
 * Boş liste, ama gerekli.
 *
 * generateStaticParams olmadan Next bu rotayı "her istekte yeniden çiz"
 * kabul ediyor ve revalidate'i hiç uygulamıyor. Boş dizi + dynamicParams
 * (varsayılan açık): derlemede hiçbir sayfa üretilmiyor, ilk isteyen
 * üretiyor, sonrakiler önbellekten alıyor.
 */
export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { segment, district } = await params;
  return (
    <HizmetIlcesi
      hizmet="pet-oteli"
      segment={segment}
      district={district}
      filters={HIZMET_SUZGECSIZ}
    />
  );
}
