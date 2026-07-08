import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  // allowedDevOrigins uyarısını gidermek için burayı sadeleştirdik
  // Eğer özel bir Cloud Workstation kullanıyorsan CORS ayarlarını Next.js otomatik yönetir

  // ESKİ URL YAPISINDAN YENİ (Patibul tarzı) URL YAPISINA YÖNLENDİRMELER
  // Site canlıda olduğu için eski linkler kırılmasın diye 308 kalıcı yönlendirme ekliyoruz.
  async redirects() {
    return [
      {
        source: '/ilan/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/cins/:id/:slug',
        destination: '/:id/:slug',
        permanent: true,
      },
      {
        source: '/listings/new',
        destination: '/ilan/yeni',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;