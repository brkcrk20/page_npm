import { NextResponse } from 'next/server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Yöneticinin bir hesabın giriş bilgilerini değiştirmesi.
 *
 * NEDEN AYRI BİR UÇ NOKTA
 * E-posta ve parola profiles tablosunda değil auth şemasında duruyor;
 * oraya yalnızca servis anahtarı yazabiliyor. Profil alanlarının tamamı
 * (ad, telefon, rol, yasak, kurumsal bilgiler) doğrudan tablodan
 * güncellenebiliyor çünkü muhafız yöneticiyi zaten muaf tutuyor —
 * onlar için bu uç noktaya gerek yok.
 *
 * Parola değiştirmek hesabın sahibini dışarıda bırakır. Bu yüzden işlem
 * yalnızca yöneticiye açık ve tek kullanımlık: değiştirilen parolayı
 * kullanıcıya iletmek yöneticinin sorumluluğunda.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function yoneticiMi(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return data?.role === 'admin';
}

export async function POST(request: Request) {
  if (!(await yoneticiMi())) {
    return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
  }

  let govde: { userId?: string; email?: string; password?: string; emailConfirm?: boolean };
  try {
    govde = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  if (!govde.userId) {
    return NextResponse.json({ error: 'Kullanıcı belirtilmedi.' }, { status: 400 });
  }
  if (govde.password && govde.password.length < 8) {
    return NextResponse.json({ error: 'Parola en az 8 karakter olmalı.' }, { status: 400 });
  }

  const guncelleme: Record<string, unknown> = {};
  if (govde.email) guncelleme.email = govde.email;
  if (govde.password) guncelleme.password = govde.password;
  if (govde.emailConfirm) guncelleme.email_confirm = true;

  if (Object.keys(guncelleme).length === 0) {
    return NextResponse.json({ error: 'Değiştirilecek bir alan yok.' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(govde.userId, guncelleme as never);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
