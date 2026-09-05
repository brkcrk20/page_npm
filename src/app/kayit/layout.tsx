import type { Metadata } from 'next';

/** Kayıt sayfası da istemci bileşeni; gerekçe için ../login/layout.tsx. */
export const metadata: Metadata = {
  title: 'Ücretsiz Üye Ol',
  description:
    'PetSemti’ye ücretsiz üye olun: ilan verin, sahiplendirme ilanlarına başvurun, satıcılarla mesajlaşın.',
  alternates: { canonical: '/kayit' },
  robots: { index: false, follow: true },
};

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
