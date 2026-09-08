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

/**
 * Yönetimden kullanıcılara duyuru.
 *
 * NEDEN KUYRUĞA YAZIYOR
 * Doğrudan göndermek yerine notification_outbox'a satır ekliyor: gönderim
 * işçisi (/api/bildirim/gonder) zaten var, tekrar deneme, bayat bildirimi
 * atlama ve hata kaydı orada. Beş yüz kişiye tek istekte e-posta atmaya
 * çalışmak ise ya zaman aşımına düşer ya yarısında kalırdı.
 *
 * KİME
 *  - 'secili'       : ekrandan işaretlenen kullanıcılar
 *  - 'tumu'         : bildirim izni açık bütün üyeler
 *  - 'dogrulanmis'  : yalnızca onaylı üyeler
 *  - 'kurumsal'     : yalnızca kurumsal hesaplar
 *
 * E-posta bildirimini kapatmış (email_notifications = false) ve engellenmiş
 * hesaplar hiçbir hedefte listeye girmiyor; tek tek seçilseler bile. Duyuru,
 * kişinin kapattığı bir kanalı yeniden açmanın gerekçesi değil.
 */
type Hedef = 'secili' | 'tumu' | 'dogrulanmis' | 'kurumsal';

export async function POST(request: Request) {
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

  let govde: { konu?: string; mesaj?: string; hedef?: Hedef; userIds?: string[] };
  try {
    govde = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const konu = (govde.konu ?? '').trim();
  const mesaj = (govde.mesaj ?? '').trim();
  const hedef: Hedef = govde.hedef ?? 'secili';

  if (konu.length < 3) return NextResponse.json({ error: 'Konu çok kısa.' }, { status: 400 });
  if (mesaj.length < 10) return NextResponse.json({ error: 'Mesaj çok kısa.' }, { status: 400 });

  const admin = createSupabaseAdminClient();

  let sorgu = admin
    .from('profiles')
    .select('id, full_name, email_notifications, is_banned, is_verified, account_type')
    .eq('email_notifications', true)
    .eq('is_banned', false);

  if (hedef === 'secili') {
    const idler = (govde.userIds ?? []).filter((x) => typeof x === 'string');
    if (idler.length === 0) {
      return NextResponse.json({ error: 'Hiç kullanıcı seçilmedi.' }, { status: 400 });
    }
    sorgu = sorgu.in('id', idler);
  } else if (hedef === 'dogrulanmis') {
    sorgu = sorgu.eq('is_verified', true);
  } else if (hedef === 'kurumsal') {
    sorgu = sorgu.eq('account_type', 'kurumsal');
  }

  const { data: profiller, error: profilHatasi } = await sorgu;
  if (profilHatasi) {
    return NextResponse.json({ error: profilHatasi.message }, { status: 500 });
  }
  if (!profiller || profiller.length === 0) {
    return NextResponse.json({ error: 'Bu ölçütlere uyan kullanıcı yok.' }, { status: 400 });
  }

  /**
   * Adresler auth tarafında.
   *
   * profiles tablosunda e-posta yok; kuyruk satırı adresi anlık kopyaladığı
   * için buradan okunması gerekiyor. Sayfa sayfa geziliyor: listUsers tek
   * seferde en fazla bin kayıt veriyor.
   */
  const adresler = new Map<string, string>();
  for (let sayfa = 1; sayfa <= 20; sayfa++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: sayfa, perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const u of data.users) if (u.email) adresler.set(u.id, u.email);
    if (data.users.length < 1000) break;
  }

  const damga = Date.now();
  const satirlar = profiller
    .map((p) => ({ p, email: adresler.get(p.id) }))
    .filter((x): x is { p: (typeof profiller)[number]; email: string } => Boolean(x.email))
    .map(({ p, email }) => ({
      kind: 'yonetim_duyurusu',
      user_id: p.id,
      email,
      subject: konu,
      body_text: mesaj,
      // Aynı duyuru iki kez gönderilmesin: konu + zaman damgası + kişi.
      dedupe_key: `duyuru:${damga}:${p.id}`,
    }));

  if (satirlar.length === 0) {
    return NextResponse.json({ error: 'Seçilen kullanıcıların e-posta adresi yok.' }, { status: 400 });
  }

  // Yığın yığın yazılıyor: tek insert'te binlerce satır isteği şişiriyor.
  let yazilan = 0;
  for (let i = 0; i < satirlar.length; i += 200) {
    const { error } = await admin
      .from('notification_outbox')
      .insert(satirlar.slice(i, i + 200) as never);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    yazilan += Math.min(200, satirlar.length - i);
  }

  return NextResponse.json({
    ok: true,
    kuyruga_alinan: yazilan,
    eposta_yapilandirildi: epostaYapilandirildiMi(),
  });
}
