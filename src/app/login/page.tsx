'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { LoginForm } from './LoginForm';
import { KimlikDuzeni } from '@/components/kimlik/KimlikDuzeni';
import { useUser } from '@/lib/supabase/auth-provider';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <KimlikDuzeni
      baslik="Giriş Yap"
      aciklama="Hesabınıza girerek ilanlarınızı ve mesajlarınızı yönetin."
      panelBaslik="Tekrar hoş geldiniz"
      panelMaddeler={[
        'İlanlarınızı düzenleyin, yenileyin veya yayından kaldırın',
        'Gelen mesajları tek yerden yanıtlayın',
        'Favorileriniz ve kayıtlı aramalarınız sizi bekliyor',
      ]}
      altMetin="Hesabınız yok mu?"
      altBaglantiMetni="Ücretsiz üye olun"
      altBaglantiAdresi="/kayit"
    >
      <LoginForm />
    </KimlikDuzeni>
  );
}
