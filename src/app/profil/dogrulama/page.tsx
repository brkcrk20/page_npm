'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

import { DogrulamaForm } from './DogrulamaForm';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Profil doğrulama.
 *
 * İlan verebilmek için tek koşul profilde telefon bulunmasıydı ve o telefon
 * da doğrulanmıyordu. Doğrulanmamış hesabı kapatmak işe yaramıyor: aynı kişi
 * beş dakikada yenisini açıyor. Kimlik doğrulaması bunu kırıyor.
 */

type Profil = {
  identity_status: 'yok' | 'inceleniyor' | 'dogrulandi' | 'reddedildi';
  identity_rejected_reason: string | null;
  account_type: string;
  full_name: string | null;
};

export default function Page() {
  const { user, isUserLoading } = useSupabaseAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!user) return;
    let iptal = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('profiles')
        .select('identity_status, identity_rejected_reason, account_type, full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (iptal) return;
      setProfil((data as Profil) ?? null);
      setYukleniyor(false);
    })();
    return () => {
      iptal = true;
    };
  }, [user]);

  if (isUserLoading || (user && yukleniyor)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Profil Doğrulama
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İlan verebilmek için kimliğinizi bir kez doğrulamanız gerekiyor. Doğrulanmış
          hesaplar alıcıya güven verir ve dolandırıcılığı zorlaştırır.
        </p>
      </header>

      <DogrulamaForm
        durum={profil?.identity_status ?? 'yok'}
        redSebebi={profil?.identity_rejected_reason ?? null}
        hesapTuru={profil?.account_type ?? 'bireysel'}
        adSoyad={profil?.full_name ?? null}
      />
    </div>
  );
}
