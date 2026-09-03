'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Panelin giriş kontrolü.
 *
 * Tek yerde yapılıyor: eskiden her sayfa kendi yönlendirmesini yazıyordu ve
 * yeni eklenen bir sayfada bunu unutmak, çıkış yapmış kullanıcıya boş bir
 * panel göstermek demekti.
 *
 * Oturum tarayıcıda çözüldüğü için kontrol istemci tarafında; sunucuda
 * yapılsaydı panel tamamen dinamik hale gelir, hiçbir parçası önbelleğe
 * alınamazdı.
 */
export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
