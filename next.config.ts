import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // İlan fotoğrafları ve profil görselleri Supabase Storage'da duruyor.
    // Bu desen olmadan next/image Supabase adreslerini tümüyle reddediyor ve
    // hiçbir ilan fotoğrafı görünmüyordu.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  // ESKİ URL YAPISINDAN YENİ YAPIYA YÖNLENDİRMELER
  // Site canlıda olduğu için eski linkler kırılmasın diye 308 kalıcı yönlendirme.
  //
  // SIRA ÖNEMLİ: Next.js kuralları yukarıdan aşağıya değerlendirir ve
  // redirect'ler dosya sistemi route'larından ÖNCE çalışır. Bu yüzden özel
  // yollar ("/ilan/yeni") genel desenden ("/ilan/:slug") önce gelmek zorunda —
  // aksi halde ilan verme sayfası ilan detayına yönlenip erişilemez hale gelir.
  async redirects() {
    return [
      // 1) İlan verme sayfası taşındı: /ilan/yeni -> /ilan-ver
      //    Artık /ilan/* deseniyle çakışmıyor.
      {
        source: '/ilan/yeni',
        destination: '/ilan-ver',
        permanent: true,
      },
      {
        source: '/listings/new',
        destination: '/ilan-ver',
        permanent: true,
      },

      // 2) Eski ilan detay yolları: /ilan/<slug> -> /<slug>
      //    "yeni" yukarıda yakalandığı için buraya düşmez.
      {
        source: '/ilan/:slug',
        destination: '/:slug',
        permanent: true,
      },

      // 3) Eski cins yolları: /cins/<kategori>/<cins> -> /<kategori>/<cins>
      {
        source: '/cins/:category/:breed',
        destination: '/:category/:breed',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
