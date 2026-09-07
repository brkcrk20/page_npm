import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { epostaGonder, epostaYapilandirildiMi } from '@/lib/eposta/gonder';
import { epostaGovdesi } from '@/lib/eposta/sablon';
import { SITE_URL } from '@/lib/site';

/**
 * Bildirim kuyruğunu boşaltan işçi.
 *
 * Veritabanındaki tetikleyici yeni mesaj geldiğinde buraya bir istek
 * bırakıyor (pg_net, eşzamansız). Ayrıca pg_cron beş dakikada bir aynı
 * uca vuruyor: ilk çağrı herhangi bir sebeple düşerse bildirim en geç beş
 * dakika içinde yine gidiyor.
 *
 * YETKİ
 * Paylaşılan bir gizli anahtar (private_settings.notify.secret). Bu uç
 * nokta oturum taşımıyor; veritabanı tarafından çağrılıyor. Anahtar
 * app_settings'te değil, çünkü orası herkese açık okunuyor.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Tek çağrıda gönderilecek en fazla e-posta. */
const YIGIN = 25;
/** Bu kadar denemeden sonra bırakılıyor. */
const MAKS_DENEME = 5;
/** Bu kadar eskimiş bildirim artık gönderilmiyor. */
const BAYAT_GUN = 3;

async function anahtarDogru(request: Request): Promise<boolean> {
  const gelen = request.headers.get('x-bildirim-anahtari') ?? '';
  if (!gelen) return false;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('private_settings')
    .select('value')
    .eq('key', 'notify')
    .maybeSingle();

  const beklenen = ((data?.value ?? {}) as { secret?: string }).secret ?? '';
  return beklenen.length > 0 && gelen === beklenen;
}

export async function POST(request: Request) {
  if (!(await anahtarDogru(request))) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // Sağlayıcı yoksa kuyruğa dokunmuyoruz: anahtar sonradan eklendiğinde
  // biriken bildirimler (bayatlamamışsa) gidiyor.
  if (!epostaYapilandirildiMi()) {
    const { count } = await supabase
      .from('notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'bekliyor');
    return NextResponse.json({ durum: 'yapilandirilmamis', bekleyen: count ?? 0 });
  }

  const bayatSinir = new Date(Date.now() - BAYAT_GUN * 86_400_000).toISOString();
  await supabase
    .from('notification_outbox')
    .update({ status: 'iptal', last_error: 'bayat' })
    .eq('status', 'bekliyor')
    .lt('created_at', bayatSinir);

  const { data: satirlar, error } = await supabase
    .from('notification_outbox')
    .select('id, kind, email, subject, body_text, attempts')
    .eq('status', 'bekliyor')
    .order('created_at')
    .limit(YIGIN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let gonderildi = 0;
  let hata = 0;

  for (const satir of satirlar ?? []) {
    const govde = epostaGovdesi({
      baslik: satir.subject,
      paragraflar: [satir.body_text],
      dugme:
        satir.kind === 'yeni_mesaj'
          ? { etiket: 'Mesajı oku', href: `${SITE_URL}/mesajlarim` }
          : { etiket: 'İlanlarımı aç', href: `${SITE_URL}/profil/ilanlarim` },
    });

    const sonuc = await epostaGonder({
      to: satir.email,
      subject: satir.subject,
      text: govde.text,
      html: govde.html,
    });

    if (sonuc.durum === 'gonderildi') {
      await supabase
        .from('notification_outbox')
        .update({ status: 'gonderildi', sent_at: new Date().toISOString() })
        .eq('id', satir.id);
      gonderildi++;
    } else if (sonuc.durum === 'hata') {
      const deneme = (satir.attempts ?? 0) + 1;
      await supabase
        .from('notification_outbox')
        .update({
          attempts: deneme,
          last_error: sonuc.mesaj.slice(0, 500),
          // Israrla başarısız olan satır kuyruğu tıkamasın.
          status: deneme >= MAKS_DENEME ? 'hata' : 'bekliyor',
        })
        .eq('id', satir.id);
      hata++;
    }
  }

  return NextResponse.json({ gonderildi, hata, islenen: satirlar?.length ?? 0 });
}
