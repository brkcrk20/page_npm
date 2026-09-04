import 'server-only';

import { adNormalize } from './kimlik';

/**
 * NVI kimlik sorgulaması.
 *
 * Nüfus ve Vatandaşlık İşleri'nin herkese açık KPSPublic servisi TCKN, ad,
 * soyad ve doğum yılını birlikte sorgulayıp yalnızca "doğru / yanlış"
 * döndürüyor; kişinin bilgilerini vermiyor. Doğrulama için ihtiyacımız olan
 * tam olarak bu.
 *
 * SERVİS HER ZAMAN ERİŞİLEBİLİR DEĞİL
 * Servis yurt dışı adreslerden yetkisiz sayıyor ve zaman zaman bakıma
 * giriyor. Bu yüzden üç durumlu cevap veriyoruz: true (eşleşti),
 * false (eşleşmedi), null (sorulamadı). null, başvurunun elle incelemeye
 * düşmesi demek — "doğrulandı" saymak, doğrulamayı hiç yapmamaktan
 * daha kötü olurdu.
 */
export type NviSonuc = true | false | null;

const ENDPOINT = 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx';

/** XML metin değerini kaçırır: ad alanına & veya < yazılabiliyor. */
function xmlKacir(deger: string): string {
  return deger
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function nviDogrula(params: {
  tckn: string;
  ad: string;
  soyad: string;
  dogumYili: number;
}): Promise<NviSonuc> {
  const govde = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
      <TCKimlikNo>${xmlKacir(params.tckn)}</TCKimlikNo>
      <Ad>${xmlKacir(adNormalize(params.ad))}</Ad>
      <Soyad>${xmlKacir(adNormalize(params.soyad))}</Soyad>
      <DogumYili>${params.dogumYili}</DogumYili>
    </TCKimlikNoDogrula>
  </soap:Body>
</soap:Envelope>`;

  const kontrol = new AbortController();
  const zamanAsimi = setTimeout(() => kontrol.abort(), 8000);

  try {
    const cevap = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '"http://tckimlik.nvi.gov.tr/WS/TCKimlikNoDogrula"',
      },
      body: govde,
      signal: kontrol.signal,
      cache: 'no-store',
    });

    if (!cevap.ok) return null;

    const metin = await cevap.text();
    // Servis hata sayfasına yönlendirdiğinde gövde XML değil HTML oluyor;
    // bu durumda "false" okumak yanlış olurdu.
    const eslesme = /<TCKimlikNoDogrulaResult>(true|false)<\/TCKimlikNoDogrulaResult>/i.exec(metin);
    if (!eslesme) return null;

    return eslesme[1]!.toLowerCase() === 'true';
  } catch {
    // Ağ hatası, zaman aşımı, engelleme — hepsi "sorulamadı".
    return null;
  } finally {
    clearTimeout(zamanAsimi);
  }
}
