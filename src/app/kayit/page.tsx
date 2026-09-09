'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { RegisterForm } from './RegisterForm';
import { KimlikDuzeni } from '@/components/kimlik/KimlikDuzeni';
import { useUser } from '@/lib/supabase/auth-provider';

export default function RegisterPage() {
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
      baslik="Hesap Oluştur"
      aciklama="Birkaç saniye sürer, ilan vermek ücretsiz."
      panelBaslik="Evcil hayvan dünyasının tamamı tek hesapta"
      panelMaddeler={[
        'Ücretsiz ilan verin, sahibiyle doğrudan mesajlaşın',
        '81 ilde veteriner, otel, kuaför ve petshop rehberi',
        'Kayıp ilanınızı semtinizde duyurun',
        'Beğendiğiniz ilanları favorilerinize ekleyin',
      ]}
      altMetin="Zaten hesabınız var mı?"
      altBaglantiMetni="Giriş yapın"
      altBaglantiAdresi="/login"
    >
      <RegisterForm />
    </KimlikDuzeni>
  );
}
