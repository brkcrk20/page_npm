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
      /**
       * Yapay zekâ arama botlarına açık izin.
       *
       * Varsayılan zaten "izinli" ama bu botların bir kısmı açık bir kural
       * bulamadığında temkinli davranıyor. Sohbet tabanlı aramalar
       * ("İzmir'de toy poodle sahiplendirme nereden bulurum") giderek daha
       * çok trafik getiriyor; bu sorulara cevap veren kaynaklardan biri
       * olmak indekslenmekle aynı şey değil, ayrıca izin gerektiriyor.
       */
      ...[
        'GPTBot',
        'OAI-SearchBot',
        'ChatGPT-User',
        'ClaudeBot',
        'Claude-Web',
        'PerplexityBot',
        'Google-Extended',
        'CCBot',
        'Applebot-Extended',
      ].map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
