import type { Metadata } from 'next';

import { AdminShell } from './AdminShell';

export const metadata: Metadata = {
  title: 'Yönetim Paneli',
  // Marka ekini şablon koyuyor (kök düzendeki template: '%s | PetSemti');
  // burada tekrar yazınca başlık "... | PetSemti | PetSemti" oluyordu.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
