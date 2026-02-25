import type { MetadataRoute } from 'next';

const staticRoutes = [
  '',
  '/ilanlar',
  '/ilanlar/yeni',
  '/kedi-ilanlari',
  '/kopek-ilanlari',
  '/kus-ilanlari',
  '/akvaryum-ilanlari',
  '/diger-ilanlar',
  '/es-arayanlar',
  '/es-arayanlar/yeni',
  '/veteriner',
  '/pet-oteli',
  '/egitmen',
  '/pet-kuafor',
  '/petshop',
  '/pet-taksi',
  '/gezdirici',
  '/giris',
  '/kayit',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return staticRoutes.map((route) => ({
    url: `https://petsemti.com${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
