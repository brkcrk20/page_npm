import { NextResponse } from 'next/server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { epostaYapilandirildiMi } from '@/lib/eposta/gonder';

/**
 * Bildirim kuyruğunun durumu (yönetim paneli için).
 *
 * Sağlayıcı anahtarı sunucu tarafında; istemci "yapılandırıldı mı"
 * sorusunu kendi başına cevaplayamıyor. Anahtarın kendisi hiçbir zaman
 * dönmüyor, yalnızca hangi sağlayıcının tanımlı olduğu.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profil?.role !== 'admin') {
    return NextResponse.json({ error: 'Yetkiniz yok.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const say = async (durum: 'bekliyor' | 'gonderildi' | 'hata' | 'iptal') => {
    const { count } = await admin
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', durum);
    return count ?? 0;
  };

  const { data: sonHatalar } = await admin
    .from('notification_outbox')
    .select('id, kind, subject, last_error, attempts, created_at')
    .eq('status', 'hata')
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    yapilandirildi: epostaYapilandirildiMi(),
    saglayici: process.env.RESEND_API_KEY ? 'resend' : process.env.SMTP_HOST ? 'smtp' : null,
    bekleyen: await say('bekliyor'),
    gonderildi: await say('gonderildi'),
    hata: await say('hata'),
    iptal: await say('iptal'),
    sonHatalar: sonHatalar ?? [],
  });
}
