import type { Metadata } from 'next';

import { ProfileBackLink, ProfileIdentity, ProfileMenu } from './ProfileNav';
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
 *
 * MOBİL SIRALAMA masaüstündeki önceliği izliyor. Masaüstünde göz önce
 * "Merhaba X" ve sayaçlara gidiyor, menü kenarda duruyor. Mobilde her şey alt
 * alta geldiği için sıra önem kazanıyor:
 *
 *   kimlik kartı -> içerik -> menü
 *
 * Menüyü içeriğin üstüne koymak, dokuz satırlık listeyle sayaçları ekranın
 * dışına itiyordu. Bu yüzden aside mobilde `display: contents` ile dağılıyor
 * ve parçalar ızgarada tek tek sıralanıyor; masaüstünde tekrar tek bir kutuya
 * dönüşüyor.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGuard>
      <div className="w-full px-5 py-4 md:container md:mx-auto md:py-6">
        <div className="grid gap-4 md:grid-cols-[260px_1fr] md:gap-6">
          <div className="contents md:sticky md:top-20 md:block md:self-start">
            <div className="order-1 md:mb-4">
              <ProfileBackLink />
              <ProfileIdentity />
            </div>
            <div className="order-3 md:order-none">
              <ProfileMenu />
            </div>
          </div>

          <main className="order-2 min-w-0 md:order-none">{children}</main>
        </div>
      </div>
    </ProfileGuard>
  );
}
