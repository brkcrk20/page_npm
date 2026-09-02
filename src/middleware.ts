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
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ortam değişkenleri yoksa (ör. henüz yapılandırılmamış kurulum) middleware
  // isteği olduğu gibi geçirmeli; burada patlamak tüm siteyi kapatır.
  if (!url || !key) return response;

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

export const config = {
  matcher: [
    /*
     * Statik dosyalar ve görseller dışındaki her yol.
     * Bunlarda oturum tazelemek gereksiz istek ve gecikme demek.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
