import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/profil', '/mesajlarim', '/fatura-bilgileri'],
    },
    sitemap: 'https://petsemti.com/sitemap.xml',
    host: 'https://petsemti.com',
  };
}
