/**
 * Telefon numarası biçimlendirme.
 *
 * Veritabanı numarayı tek biçimde, 10 hane olarak saklıyor (5524016192) —
 * bkz. normalize_tr_phone. Bu, wa.me bağlantısı üretmeyi ve karşılaştırmayı
 * mümkün kılıyor ama okunması zor. Ekranda gösterilirken burada
 * gruplandırılıyor.
 *
 * Normalizasyonun kendisi kasıtlı olarak burada DEĞİL: kural veritabanında,
 * çünkü istemci doğrulaması atlanabiliyor ve ilan verebilmenin ön koşulu bu
 * numara. Buradaki kopya yalnızca kullanıcıya anında geri bildirim vermek için.
 */

/** "5524016192" -> "0552 401 61 92". Tanınmayan biçim olduğu gibi döner. */
export function formatTrPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length !== 10) return phone;
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

/** Veritabanındaki normalize_tr_phone'un istemci kopyası; geçersizse null. */
export function normalizeTrPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.length === 10 && d.startsWith('5') ? d : null;
}

/** wa.me bağlantısı için ülke kodlu biçim. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const d = phone ? normalizeTrPhone(phone) : null;
  return d ? `90${d}` : null;
}
