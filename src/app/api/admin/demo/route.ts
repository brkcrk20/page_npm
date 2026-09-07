import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { demoDurumu, demoEkle, demoSil } from '@/lib/demo/uygula';

/**
 * Demo içeriğin eklenmesi ve silinmesi.
 *
 * NEDEN SUNUCUDA
 * İşlem servis anahtarı istiyor: ilanların doğrudan yayına alınması,
 * bireysel satış kuralının atlanması ve auth hesaplarının açılıp
 * silinmesi normal yetkilerle yapılamıyor. Servis anahtarı istemciye
 * hiçbir koşulda verilemez.
 *
 * YETKİ
 * Oturumdaki kullanıcının rolü veritabanından okunuyor. İstemcinin
 * gönderdiği hiçbir bilgiye bakılmıyor; "ben adminim" diyen bir istek
 * yetki almıyor.
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

export async function GET() {
  if (!(await yoneticiMi())) {
    return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
  }
  return NextResponse.json(await demoDurumu());
}

export async function POST(request: Request) {
  if (!(await yoneticiMi())) {
    return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
  }

  let govde: { islem?: string };
  try {
    govde = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  try {
    if (govde.islem === 'ekle') {
      const sonuc = await demoEkle();
      return NextResponse.json({ sonuc, durum: await demoDurumu() });
    }
    if (govde.islem === 'sil') {
      const sonuc = await demoSil();
      return NextResponse.json({ sonuc, durum: await demoDurumu() });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 });
}
