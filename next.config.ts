import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Firebase resimleri için eklendi
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      { source: '/login', destination: '/giris', permanent: true },
      { source: '/listings', destination: '/ilanlar', permanent: true },
      { source: '/listings/new', destination: '/ilanlar/yeni', permanent: true },
      { source: '/listings/:id', destination: '/ilanlar/:id', permanent: true },
      { source: '/pet_kuafor', destination: '/pet-kuafor', permanent: true },
      { source: '/pet_taksi', destination: '/pet-taksi', permanent: true },
    ];
  },

  // Firebase Studio ortamı için gerekli olan bu kısmı asla silmiyoruz:
  allowedDevOrigins: [
    'https://*.cluster-6aufaxcfanfh2quaz7stglulic.cloudworkstations.dev',
  ],
};

export default nextConfig;