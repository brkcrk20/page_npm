import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

/**
 * robots.txt
 *
 * Kullanıcıya özel ve arama motorunda değeri olmayan yollar kapatılıyor.
 * Özellikle filtreli rehber adresleri (?ozellik=...) taranmamalı: aynı
 * içeriğin yüzlerce kombinasyonu tarama bütçesini tüketir ve kopya içerik
 * sinyali üretir. Filtresiz kategori/cins/şehir sayfaları zaten indeksleniyor.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/profil',
          '/mesajlarim',
          '/fatura-bilgileri',
          '/ilan-ver',
          // Tüm hizmet kayıt formları (/veteriner/kayit, /petshop/kayit …)
          '/*/kayit',
          '/login',
          '/kayit',
          // /gorsel-kaynaklari BİLEREK AÇIK: CC-BY ve CC-BY-SA lisansları
          // atfın herkese erişilebilir olmasını şart koşuyor; o sayfayı
          // arama motoruna kapatmak yükümlülükle çelişirdi.
          // Filtre kombinasyonları
          '/*?ozellik=',
          '/*?dogrulanmis=',
          '/*?sayfa=',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
