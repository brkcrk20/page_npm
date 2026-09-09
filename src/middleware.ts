import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase oturum tazeleme.
 *
 * Erişim jetonunun ömrü kısa. Sunucu component'leri çerez yazamadığı için
 * jeton süresi dolduğunda kullanıcı sessizce çıkmış görünür. Middleware her
 * istekte jetonu tazeleyip yeni çerezi yanıta yazıyor — oturumun sayfalar
 * arasında ayakta kalmasını sağlayan parça bu.
 */
export async function middleware(request: NextRequest) {
  const kimlikYolu = kimlikBaglantisiniTasi(request);
  if (kimlikYolu) return NextResponse.redirect(kimlikYolu);

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ortam değişkenleri yoksa (ör. henüz yapılandırılmamış kurulum) middleware
  // isteği olduğu gibi geçirmeli; burada patlamak tüm siteyi kapatır.
  if (!url || !key) return response;

  /**
   * Oturum çerezi yoksa tazelenecek jeton da yok.
   *
   * Ziyaretçilerin büyük bölümü giriş yapmamış oluyor; onlar için
   * getUser() çağrısı her sayfa isteğine boşuna iş ekliyordu. Çerez
   * varlığına bakmak yetiyor: Supabase oturum çerezleri "sb-" önekiyle
   * yazılıyor.
   */
  const oturumCerezi = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-'));
  if (!oturumCerezi) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Bu çağrı jetonu tazeler ve setAll üzerinden çerezleri günceller.
  // getSession() değil getUser(): getSession çerezi doğrulamadan okur.
  await supabase.auth.getUser();

  return response;
}

/**
 * E-posta bağlantısını doğrulama ucuna taşı.
 *
 * Supabase, gönderdiği bağlantıdaki redirect_to adresini yalnızca panelde
 * tanımlı "Redirect URLs" listesindeyse kullanıyor; değilse sessizce Site
 * URL'e düşüyor. Yani kullanıcı /auth/dogrula yerine ana sayfada, elinde
 * ?code= ya da ?token_hash= ile karşımıza çıkabiliyor — orada oturumu kuran
 * kimse olmadığı için şifre sıfırlama "geçersiz bağlantı" veriyordu.
 *
 * Bu yüzden hangi yola düşerse düşsün bağlantı doğrulama ucuna alınıyor.
 * Panel ayarı düzeltilmeden de akış çalışsın diye.
 */
function kimlikBaglantisiniTasi(request: NextRequest): URL | null {
  const { pathname, searchParams } = request.nextUrl;

  // Doğrulama ucunun kendisi taşınmamalı; sonsuz döngü olur.
  if (pathname.startsWith('/auth/')) return null;

  const jeton = searchParams.get('token_hash');
  const tur = searchParams.get('type');
  const kod = searchParams.get('code');

  // token_hash yalnızca e-posta bağlantılarında bulunuyor. Buna karşılık
  // ?code= başka bir amaçla da gelebilir; onu sadece ana sayfada (Site URL'in
  // düştüğü yer) kimlik bağlantısı sayıyoruz.
  const kimlik = (jeton && tur) || (kod && pathname === '/');
  if (!kimlik) return null;

  const hedef = new URL('/auth/dogrula', request.nextUrl.origin);
  for (const [ad, deger] of searchParams) hedef.searchParams.set(ad, deger);
  // Adreste zaten bir hedef varsa ona dokunma; yoksa türe göre karar ver.
  if (!hedef.searchParams.get('next')) {
    hedef.searchParams.set('next', tur === 'recovery' ? '/sifre-yenile' : '/');
  }
  return hedef;
}

export const config = {
  matcher: [
    /*
     * Statik dosyalar ve görseller dışındaki her yol.
     * Bunlarda oturum tazelemek gereksiz istek ve gecikme demek.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
