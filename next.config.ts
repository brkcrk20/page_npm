import type { NextConfig } from 'next';

import { SERVICE_CONFIGS } from './src/lib/services-config';

const nextConfig: NextConfig = {
  /**
   * Kritik CSS'i HTML'e göm.
   *
   * ÖLÇÜM: stil dosyası yalnızca 13,5 KB ama 250 KB'lık JS ile aynı hattı
   * paylaştığı için yavaş 4G'de 1147 ms'de tamamlanıyor; ilk boyama da onu
   * beklediği için 1,3 saniyeye kayıyor. Dosya küçük, sorun sıraya girmesi.
   *
   * inlineCss stil dosyasını doğrudan belgenin içine yazıyor; ilk boyama
   * ağdan hiçbir şey beklemiyor. Ölçüm (yavaş 4G + 4x CPU): FCP 756 ms ->
   * 312 ms, LCP 756 ms -> 580 ms.
   */
  experimental: {
    // App Router'da CSS'i belgenin içine yazan bayrak bu; optimizeCss
    // (critters) yalnızca Pages Router'da devreye giriyor.
    inlineCss: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    /**
     * Görseller Next'in iyileştiricisinden GEÇMİYOR.
     *
     * Sebep ölçülmüş bir arıza: /_next/image istekleri canlıda 402
     * dönmeye başladı — barındırma sağlayıcısının görsel iyileştirme
     * kotası doldu ve sitedeki bütün fotoğraflar kırıldı. Kota her
     * fotoğrafın her genişlik ve kalite varyasyonunu ayrı sayıyor;
     * kart, galeri ve bulanık zemin çarpınca sayı hızla büyüyor.
     *
     * Buna ihtiyacımız yok: fotoğraflar yüklenirken zaten tarayıcıda
     * 1600 pikselin altına indirilip WebP'ye çevriliyor
     * (src/lib/image-pipeline.ts). İyileştirici, zaten iyileştirilmiş
     * bir dosyayı yeniden işliyordu.
     *
     * Kart ve yan menü gibi küçük alanlar için yüklemede ayrıca 400
     * piksellik küçük kopya üretiliyor; boyut farkı oradan geliyor.
     */
    unoptimized: true,

    /**
     * İyileştirilmiş görsellerin önbellek süresi.
     *
     * Next, üretilen görselin Cache-Control'ünü kaynağınkinden türetiyor.
     * Supabase depolaması "no-cache" gönderdiği için bizim görsellerimiz
     * "max-age=0, must-revalidate" ile çıkıyordu: her sayfa görüntülemesinde
     * her görsel yeniden doğrulanıyordu. Karşılaştırma için bakılan
     * patibul.com görselleri bir gün önbellekleniyor.
     *
     * Yükleme tarafında da düzeltildi (cacheControl), ama bu ayar mevcut
     * dosyaları da kapsıyor: iyileştirici kendi çıktısını en az bu süre
     * boyunca saklıyor ve tarayıcıya da o süreyi bildiriyor.
     *
     * Otuz gün: ilan fotoğrafı değiştiğinde depolama yolu da değişiyor,
     * yani eski adresin önbellekte kalması yanlış görsel göstermiyor.
     */
    minimumCacheTTL: 2592000,
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
    /**
     * İlan detayı kendi rotasına.
     *
     * Adres kullanıcıda /<sehir>-<cins>-<baslik>-<no> olarak kalıyor ama
     * sayfayı /ilan/[slug] çiziyor. Neden ayrıldığı o dosyanın başında
     * yazıyor: aynı rotada duran kategori sayfası süzgeç için searchParams
     * okuyor ve bu, ilan sayfalarını da önbelleğe alınamaz hale getiriyordu.
     *
     * Kalıp tek segment ve "-<sayı>" ile bitiyor; kategori slug'ları asla
     * rakamla bitmediği için çakışma yok. Statik yollar (/veteriner,
     * /ilan-ver) rewrite'tan önce eşleştiği için buraya düşmüyor.
     */
    const ilanRewrite = {
      source: '/:slug((?!api/|_next/|ilan/)[^/]+-\\d+)',
      destination: '/ilan/:slug',
    };

    /**
     * beforeFiles ŞART: dizi döndürüldüğünde kurallar "afterFiles" sayılıyor,
     * yani önce dosya sistemi ve dinamik rotalar deneniyor. /[slug] zaten
     * eşleştiği için ilan kuralı hiç çalışmazdı.
     */
    /**
     * Süzgeçli liste adresleri /filtre altına.
     *
     * Sıralama ve fiyat kutuları adrese ?sirala=/?min=/?max=/?kimden=
     * ekliyor. searchParams okuyan rota önbelleğe giremediği için liste
     * sayfaları bunları okumayı bıraktı; parametre TAŞIYAN istekler ise
     * aynı gövdeyi çizen /filtre rotalarına yönleniyor. Kullanıcının
     * adresi değişmiyor.
     *
     * Bu dört anahtar yalnızca ilan listelerinde kullanılıyor (arama ve
     * yönetim sayfaları q/sayfa kullanıyor), o yüzden kural yanlış yere
     * düşmüyor.
     */
    const suzgecAnahtarlari = ['sirala', 'min', 'max', 'kimden'];
    // İlk segmentteki "filtre" dışlaması ŞART: kural yeniden yazılmış yola
    // da uyuyor ve /filtre/filtre/... diye ikinci kez yazıyordu. Dışlamada
    // "$" kullanılamaz — path-to-regexp'te o, segmentin değil bütün yolun
    // sonu demek; /filtre/kopek-ilanlari onu geçip tekrar yazılıyordu.
    const ilkSegment = ':a((?!filtre)[^/]+)';
    const suzgecRewrites = [
      [`/${ilkSegment}`, '/filtre/:a'],
      [`/${ilkSegment}/:b`, '/filtre/:a/:b'],
      [`/${ilkSegment}/:b/:c`, '/filtre/:a/:b/:c'],
    ].flatMap(([source, destination]) =>
      suzgecAnahtarlari.map((anahtar) => ({
        source,
        has: [{ type: 'query' as const, key: anahtar }],
        destination,
      }))
    );

    /**
     * Süzgeçli hizmet rehberi adresleri /hizmet-filtre altına.
     *
     * Aynı gerekçe: ozellik/q/dogrulanmis/sayfa okuyan rota önbelleğe
     * giremiyor. Burada anahtarlar siteye özel değil (arama sayfası da q
     * kullanıyor, yönetim sayfaları da sayfa), o yüzden kural yediye
     * kapalı bir hizmet listesiyle sınırlandı.
     */
    const hizmetSluglari = SERVICE_CONFIGS.map((c) => c.slug).join('|');
    const hizmetAnahtarlari = ['ozellik', 'q', 'dogrulanmis', 'sayfa'];
    const hizmetRewrites = [
      [`/:h(${hizmetSluglari})`, '/hizmet-filtre/:h'],
      [`/:h(${hizmetSluglari})/:b`, '/hizmet-filtre/:h/:b'],
      [`/:h(${hizmetSluglari})/:b/:c`, '/hizmet-filtre/:h/:b/:c'],
    ].flatMap(([source, destination]) =>
      hizmetAnahtarlari.map((anahtar) => ({
        source,
        has: [{ type: 'query' as const, key: anahtar }],
        destination,
      }))
    );

    /**
     * Kayıp & bulundu sekmesi ve şehir süzgeci.
     *
     * Aynı gerekçe: tip/sehir okuyan rota önbelleğe giremiyordu (ölçüm:
     * TTFB 503 ms, önbelleğe giren sayfalarda 70-100 ms).
     */
    const kayipRewrites = ['tip', 'sehir'].map((anahtar) => ({
      source: '/kayip',
      has: [{ type: 'query' as const, key: anahtar }],
      destination: '/kayip-filtre',
    }));

    return {
      beforeFiles: [ilanRewrite, ...suzgecRewrites, ...hizmetRewrites, ...kayipRewrites],
      // /gorsel artık bir rota (src/app/gorsel/...): yeniden yazma
      // kuralının yanıtı Vercel kenar ağında önbelleğe girmiyordu.
      afterFiles: [],
      fallback: [],
    };
  },

  /**
   * Yazı tipi dosyaları kalıcı önbellekte.
   *
   * public/ altındaki dosyalar varsayılan olarak "max-age=0" ile
   * gidiyor; yani her ziyaret fontu yeniden indiriyordu.
   *
   * Bir yıl güvenli ÇÜNKÜ adres sürümlü: içerik değişirse dosya adındaki
   * sürüm de artıyor (bkz. scripts/yazi-tipi-kirp.py ve globals.css).
   */
  async headers() {
    return [
      {
        source: '/fontlar/:dosya*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
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
