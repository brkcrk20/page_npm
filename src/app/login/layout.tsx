import type { Metadata } from 'next';

/**
 * Giriş sayfası bir istemci bileşeni; kendi metadata'sını dışa aktaramıyor.
 * Metadata olmayınca kök düzenin varsayılanı kullanılıyordu: arama
 * sonucunda "PetSemti — Evcil Hayvan İlanları…" başlığı ve tüm siteyi
 * anlatan açıklama. Kullanıcı giriş sayfası bekleyip ana sayfa tarifi
 * görüyordu.
 *
 * noindex: giriş formunun arama sonucunda işi yok, üstelik oturum açmış
 * kullanıcıyı ana sayfaya yönlendiriyor.
 */
export const metadata: Metadata = {
  title: 'Giriş Yap',
  description:
    'PetSemti hesabınıza giriş yapın; ilanlarınızı yönetin, mesajlarınızı okuyun ve favorilerinize ulaşın.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
