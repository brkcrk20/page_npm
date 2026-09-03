import { permanentRedirect } from 'next/navigation';

/**
 * Fatura bilgileri hesap paneline taşındı. Eski adres kalıcı olarak
 * yönlendiriliyor: kullanıcıların yer imleri ve varsa dış bağlantılar
 * kırılmasın.
 */
export default function BillingRedirect(): never {
  permanentRedirect('/profil/fatura');
}
