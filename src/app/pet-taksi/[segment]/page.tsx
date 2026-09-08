import type { Metadata } from 'next';

import { seoAciklama, seoBaslik, seoBaslikSec } from '@/lib/seo-metin';

import {
  HIZMET_SUZGECSIZ,
  HizmetSegmenti,
  isletmeSegmentiCoz,
} from '@/components/pages/HizmetSayfalari';
import { getCityBySlug } from '@/lib/queries/catalog';
import { getServiceProviderById } from '@/lib/queries/services';
import { getServiceConfigBySlug } from '@/lib/services-config';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
//
// Segment ya bir ŞEHİR ("istanbul") ya da bir İŞLETME ("dost-klinik-12").
// Ayrım belirsiz değil: işletme adresi her zaman "-<sayı>" ile biter, şehir
// slug'ları asla rakamla bitmez — ilan/kategori ayrımıyla aynı kural.

const config = getServiceConfigBySlug('pet-taksi')!;

type Params = { segment: string };

/** Çözümleme gövdeyle ortak; iki yerde ayrı kural kalmasın. */
const parseProviderSegment = isletmeSegmentiCoz;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { segment } = await params;
  const parsed = parseProviderSegment(segment);

  if (parsed) {
    const data = await getServiceProviderById(parsed.id, config.type);
    if (data) {
      const location = [(data as any).cities?.name, (data as any).districts?.name]
        .filter(Boolean)
        .join(', ');
      /**
       * Başlık marka ekini kendisi taşımıyordu ama "| Veteriner Klinikleri"
       * yazıyordu; kök düzenin şablonu buna bir de "| PetSemti" ekleyince
       * başlık 78 karaktere çıkıp arama sonucunda kesiliyordu. Kategori adı
       * işletme adının yanında zaten bilgi taşımıyor — konum taşıyor.
       */
      const govde = (data.description ?? '').replace(/\s+/g, ' ').trim();
      return {
        title: seoBaslikSec(
          location ? `${data.name} — ${location}` : data.name,
          data.name
        ),
        description: seoAciklama(
          govde.length >= 70
            ? govde
            : `${data.name}${location ? ` — ${location}` : ''}: adres, telefon, çalışma saatleri ve sunulan hizmetler.`
        ),
        alternates: { canonical: `/${config.slug}/${data.slug}-${data.id}` },
      };
    }
    return { title: 'Sayfa Bulunamadı' };
  }

  const city = await getCityBySlug(segment);
  if (!city) return { title: 'Sayfa Bulunamadı' };

  return {
    title: seoBaslik(`${city.name} ${config.label}`),
    description: seoAciklama(
      `${city.name} ve ilçelerindeki ${config.label.toLocaleLowerCase('tr')}. Adres, telefon ve çalışma saatlerini görün, hizmetlere göre filtreleyin.`
    ),
    alternates: { canonical: `/${config.slug}/${city.slug}` },
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
  const { segment } = await params;
  return <HizmetSegmenti hizmet="pet-taksi" segment={segment} filters={HIZMET_SUZGECSIZ} />;
}
