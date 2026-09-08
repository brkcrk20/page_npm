/**
 * WhatsApp'a hazır metinle başlama.
 *
 * Düğme daha önce yalnızca numarayı açıyordu: karşı taraf boş bir sohbet
 * penceresiyle karşılaşıyor ve mesaj yazan kişinin nereden geldiğini
 * bilmiyordu. Aynı satıcının farklı platformlarda ilanı varsa hangi ilan
 * için yazıldığı da belirsiz kalıyordu.
 *
 * Hazır metin üç şeyi birden çözüyor: yazan kişi ilk cümleyi kurmak
 * zorunda kalmıyor, satıcı hangi ilan için arandığını görüyor ve iletişimin
 * PetSemti üzerinden geldiği anlaşılıyor.
 *
 * Metin yalnızca ÖNERİ olarak giriyor — WhatsApp bunu gönderilmiş kabul
 * etmiyor, kullanıcının giriş kutusuna yazıyor. Kullanıcı silip kendi
 * cümlesini yazabiliyor.
 */

/** Adres alınamazsa metin adressiz kuruluyor; boş bir satır bırakmıyoruz. */
function suankiAdres(): string | null {
  if (typeof window === 'undefined') return null;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}`;
}

export function ilanWhatsappMetni(baslik: string): string {
  const adres = suankiAdres();
  const satirlar = [
    `Merhaba, PetSemti'de yayınladığınız "${baslik}" ilanı için ulaşıyorum. Bilgi alabilir miyim?`,
  ];
  if (adres) satirlar.push('', adres);
  return satirlar.join('\n');
}

export function isletmeWhatsappMetni(ad: string): string {
  const adres = suankiAdres();
  const satirlar = [
    `Merhaba, PetSemti'de ${ad} kaydınızı gördüm. Hizmetleriniz hakkında bilgi alabilir miyim?`,
  ];
  if (adres) satirlar.push('', adres);
  return satirlar.join('\n');
}

/** wa.me adresine hazır metni ekler. */
export function whatsappAdresi(numara: string, metin: string): string {
  return `https://wa.me/${numara}?text=${encodeURIComponent(metin)}`;
}
