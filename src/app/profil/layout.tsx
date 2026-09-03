import type { Metadata } from 'next';

import { ProfileNav } from './ProfileNav';
import { ProfileGuard } from './ProfileGuard';

export const metadata: Metadata = {
  title: 'Hesabım | PetSemti',
  // Kişiye özel panel; arama sonuçlarında yeri yok.
  robots: { index: false, follow: false },
};

/**
 * Hesap panelinin ortak kabuğu.
 *
 * Sol menü tek bir yerde duruyor; alt sayfalar yalnızca kendi içeriklerini
 * yazıyor. Menüyü her sayfaya tekrar koymak, yeni bir bölüm eklendiğinde
 * sekiz dosyayı birden güncellemek demekti.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGuard>
      <div className="w-full px-5 py-6 md:container md:mx-auto">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="md:sticky md:top-20 md:self-start">
            <ProfileNav />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </ProfileGuard>
  );
}
