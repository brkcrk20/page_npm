import 'server-only';

import { SITE_URL } from '@/lib/site';

/**
 * E-posta şablonu.
 *
 * Tek bir sade kalıp: markalı başlık, metin, bir düğme ve alt bilgi.
 * Karmaşık HTML e-posta istemcilerinde dağılıyor; tablo düzeni ve satır
 * içi stil, e-posta tarafında hâlâ en güvenilir yol.
 *
 * Her e-postanın altında bildirim tercihine giden bir bağlantı var. Bu
 * yalnızca nezaket değil: izinsiz ve çıkışsız e-posta göndermek hem
 * spam işaretlenmeye hem de mevzuata aykırılığa yol açıyor.
 */

const KIRMIZI = '#C92C53';

function kacir(metin: string): string {
  return metin
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function epostaGovdesi(opts: {
  baslik: string;
  paragraflar: string[];
  dugme?: { etiket: string; href: string };
}): { text: string; html: string } {
  const tercihAdresi = `${SITE_URL}/profil/hesap`;

  const text = [
    opts.baslik,
    '',
    ...opts.paragraflar,
    ...(opts.dugme ? ['', `${opts.dugme.etiket}: ${opts.dugme.href}`] : []),
    '',
    '—',
    'Bu e-postayı PetSemti hesabınızdaki bildirim tercihiniz açık olduğu için aldınız.',
    `Bildirimleri kapatmak için: ${tercihAdresi}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="tr"><body style="margin:0;padding:0;background:#f5f5f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1f">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e8">
        <tr><td style="background:${KIRMIZI};padding:18px 24px">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.2px">petsemti</span>
        </td></tr>
        <tr><td style="padding:24px">
          <h1 style="margin:0 0 12px;font-size:18px;line-height:1.4">${kacir(opts.baslik)}</h1>
          ${opts.paragraflar
            .map(
              (p) =>
                `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#44444a">${kacir(p)}</p>`
            )
            .join('')}
          ${
            opts.dugme
              ? `<p style="margin:20px 0 0"><a href="${kacir(opts.dugme.href)}" style="display:inline-block;background:${KIRMIZI};color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600">${kacir(opts.dugme.etiket)}</a></p>`
              : ''
          }
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e5e5e8;font-size:12px;line-height:1.6;color:#77777e">
          Bu e-postayı PetSemti hesabınızdaki bildirim tercihiniz açık olduğu için aldınız.<br>
          <a href="${tercihAdresi}" style="color:${KIRMIZI}">Bildirimleri kapat</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { text, html };
}
