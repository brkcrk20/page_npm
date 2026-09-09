import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * E-posta bağlantılarının indiği yer: doğrulama ve şifre sıfırlama.
 *
 * NEDEN GEREKİYORDU
 * Uygulamada bu uç hiç yoktu. Supabase'in gönderdiği bağlantı önce kendi
 * /auth/v1/verify adresine gidiyor, orada jetonu doğruluyor ve bizim
 * sitemize geri gönderiyor — ama oturumu kuran adım BİZDE olmak zorunda:
 *
 *   - Yeni akışta adres ?code=... ile geliyor; oturum ancak
 *     exchangeCodeForSession çağrılırsa oluşuyor.
 *   - Bazı e-posta şablonları ?token_hash=...&type=... gönderiyor; orada da
 *     verifyOtp çağrılması gerekiyor.
 *
 * İkisi de yapılmadığı için şifre sıfırlama bağlantısına tıklayan kullanıcı
 * "bağlantı geçersiz veya süresi dolmuş" ekranına düşüyordu.
 *
 * Eski akışta oturum adresin # kısmında geliyor; o kısım sunucuya hiç
 * gönderilmediği için onu tarayıcıdaki Supabase istemcisi kendisi çözüyor.
 * Bu uç o durumu bozmuyor: kod ya da jeton yoksa kullanıcıyı hedef sayfaya
 * olduğu gibi bırakıyor.
 */

export const dynamic = 'force-dynamic';

/** Yalnızca site içi yollar; açık yönlendirme açığı bırakmamak için. */
function guvenliYol(aday: string | null): string {
  if (!aday || !aday.startsWith('/') || aday.startsWith('//')) return '/';
  return aday;
}

export async function GET(istek: Request) {
  const adres = new URL(istek.url);
  const kod = adres.searchParams.get('code');
  const jeton = adres.searchParams.get('token_hash');
  const tur = adres.searchParams.get('type') as EmailOtpType | null;
  const sonraki = guvenliYol(adres.searchParams.get('next'));

  const supabase = await createSupabaseServerClient();

  if (kod) {
    const { error } = await supabase.auth.exchangeCodeForSession(kod);
    if (error) return NextResponse.redirect(new URL(hataYolu(tur), adres.origin));
    return NextResponse.redirect(new URL(sonraki, adres.origin));
  }

  if (jeton && tur) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: jeton, type: tur });
    if (error) return NextResponse.redirect(new URL(hataYolu(tur), adres.origin));
    return NextResponse.redirect(new URL(sonraki, adres.origin));
  }

  // Kod da jeton da yoksa oturum # kısmından geliyordur; hedef sayfa kendi
  // halleder.
  return NextResponse.redirect(new URL(sonraki, adres.origin));
}

/** Bağlantı çalışmadığında kullanıcıyı doğru yeniden deneme sayfasına at. */
function hataYolu(tur: EmailOtpType | null): string {
  if (tur === 'recovery') return '/sifremi-unuttum?hata=baglanti';
  return '/login?hata=baglanti';
}
