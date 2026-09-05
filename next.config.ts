import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Kullanıcı görselleri artık kendi alan adımızdan servis ediliyor
    // (aşağıdaki /gorsel yeniden yazma kuralı), bu yüzden Supabase deseni
    // gerekmiyor. Eski kayıtlarda tam Supabase adresi saklanmış olabilir
    // diye desen bırakıldı.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  /**
   * Kullanıcı görsellerini kendi alan adımızdan servis et.
   *
   * Görsel adresleri doğrudan depolama sağlayıcısını gösteriyordu:
   *   https://<proje>.supabase.co/storage/v1/object/public/...
   *
   * Bunun üç sakıncası var:
   *  1. Altyapı sağlayıcısını ve proje kimliğini her ziyaretçiye duyuruyor.
   *  2. Görseller kendi alan adımızda değil; görsel aramasından gelen
   *     trafik ve otorite bize değil sağlayıcının alan adına yazılıyor.
   *  3. Sağlayıcı değişirse yayınlanmış bütün görsel adresleri kırılıyor.
   *
   * Yeniden yazma (rewrite) yönlendirme DEĞİL: tarayıcı adresi
   * petsemti.com olarak görüyor, içerik arka planda getiriliyor. Ek sunucu
   * maliyeti yok, uç sunucuda çözülüyor.
   *
   * NOT: Yoldaki kullanıcı kimliği bu kuralla gizlenmiyor. O kimlik zaten
   * satıcı profilinde herkese açık ve bir kimlik bilgisi değil; gizlemek
   * için depolama düzenini değiştirmek gerekirdi ve depolama izinleri
   * (RLS) yolun ilk parçasının kullanıcı kimliği olmasına dayanıyor.
   */
  async rewrites() {
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabase) return [];

    return [
      {
        source: '/gorsel/:bucket/:path*',
        destination: `${supabase}/storage/v1/object/public/:bucket/:path*`,
      },
    ];
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
      // 0a) İlan adresleri kısa süre /<sehir>/<cins>/<baslik>-<no> biçiminde
      //     yayındaydı; tek parçaya (/<sehir>-<cins>-<baslik>-<no>) taşındı.
      //     O aralıkta paylaşılmış bağlantılar kırılmasın.
      //     Desendeki "-<sayı>" şartı kategori/cins/şehir liste adresleriyle
      //     çakışmayı önlüyor; onlar rakamla bitmiyor.
      {
        source: '/:sehir/:cins/:baslik(.*-\\d+)',
        destination: '/:sehir-:cins-:baslik',
        permanent: true,
      },

      // 0b) Rehber konuları sorgu parametresinden kendi adreslerine taşındı.
      //    Dışarıda kalmış ?konu= bağlantıları kırılmasın.
      {
        source: '/rehber',
        has: [{ type: 'query', key: 'konu', value: '(?<konuSlug>.*)' }],
        destination: '/rehber/konu/:konuSlug',
        permanent: true,
      },

      // 1) Güvercin bölümünün kısa adı.
      //    Menüde bir dönem /guvercinler yazıyordu ve o adres yoktu; dışarıda
      //    kalmış bağlantılar ve eski paylaşımlar 404'e düşmesin.
      {
        source: '/guvercinler',
        destination: '/guvercin-ilanlari',
        permanent: true,
      },
      {
        source: '/guvercinler/:yol*',
        destination: '/guvercin-ilanlari',
        permanent: true,
      },

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

      // 4) Hizmet adreslerinde alt çizgi -> tire.
      //    Arama motorları alt çizgiyi kelime ayırıcı saymıyor; "pet_kuafor"
      //    tek bir kelime gibi okunuyor ve "pet kuaför" aramasıyla eşleşmesi
      //    zayıflıyor. Eski adresler kalıcı olarak yeni yola taşınıyor.
      { source: '/pet_kuafor', destination: '/pet-kuafor', permanent: true },
      { source: '/pet_kuafor/:path*', destination: '/pet-kuafor/:path*', permanent: true },
      { source: '/pet_taksi', destination: '/pet-taksi', permanent: true },
      { source: '/pet_taksi/:path*', destination: '/pet-taksi/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
