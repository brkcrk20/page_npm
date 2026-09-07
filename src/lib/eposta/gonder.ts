import 'server-only';

/**
 * E-posta gönderimi.
 *
 * İki sağlayıcı destekleniyor ve seçim ortam değişkenlerinden yapılıyor:
 *
 *   RESEND_API_KEY  → Resend (HTTP API, ek paket gerekmiyor)
 *   SMTP_HOST + …   → herhangi bir SMTP sunucusu (hosting, Yandex, Gmail)
 *
 * İkisi de tanımlı değilse gönderim yapılmıyor ve bunu çağıran taraf
 * biliyor: bildirim kuyrukta bekliyor. Böylece anahtar sonradan
 * eklendiğinde biriken bildirimler gidiyor, hiçbiri kaybolmuyor.
 *
 * Neden iki sağlayıcı: Resend kurulumu en kolayı ama Türkiye'de çoğu
 * işletmenin zaten bir hosting SMTP'si var. Birine bağlanmak, o
 * sağlayıcıyı kullanmayan sahibi anahtarsız bırakırdı.
 */

export type EpostaMesaji = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type GonderimSonucu =
  | { durum: 'gonderildi' }
  | { durum: 'yapilandirilmamis' }
  | { durum: 'hata'; mesaj: string };

function gonderen(): string {
  return process.env.EPOSTA_GONDEREN || 'PetSemti <bildirim@petsemti.com>';
}

export function epostaYapilandirildiMi(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export async function epostaGonder(mesaj: EpostaMesaji): Promise<GonderimSonucu> {
  if (process.env.RESEND_API_KEY) return resendIle(mesaj);
  if (process.env.SMTP_HOST) return smtpIle(mesaj);
  return { durum: 'yapilandirilmamis' };
}

async function resendIle(mesaj: EpostaMesaji): Promise<GonderimSonucu> {
  try {
    const yanit = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: gonderen(),
        to: [mesaj.to],
        subject: mesaj.subject,
        text: mesaj.text,
        ...(mesaj.html ? { html: mesaj.html } : {}),
      }),
    });

    if (!yanit.ok) {
      const govde = await yanit.text();
      return { durum: 'hata', mesaj: `resend ${yanit.status}: ${govde.slice(0, 200)}` };
    }
    return { durum: 'gonderildi' };
  } catch (e) {
    return { durum: 'hata', mesaj: `resend: ${(e as Error).message}` };
  }
}

async function smtpIle(mesaj: EpostaMesaji): Promise<GonderimSonucu> {
  try {
    // Dinamik içe aktarma: Resend kullanan kurulumda nodemailer'ın
    // paketlenmesi gerekmiyor.
    const nodemailer = await import('nodemailer');
    const tasiyici = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      // 465 kapalı SSL, diğerleri STARTTLS.
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await tasiyici.sendMail({
      from: gonderen(),
      to: mesaj.to,
      subject: mesaj.subject,
      text: mesaj.text,
      html: mesaj.html,
    });
    return { durum: 'gonderildi' };
  } catch (e) {
    return { durum: 'hata', mesaj: `smtp: ${(e as Error).message}` };
  }
}
