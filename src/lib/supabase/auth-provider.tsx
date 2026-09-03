'use client';

/**
 * Supabase oturum sağlayıcısı.
 *
 * Oturum ve profil bilgisini tek yerden dağıtır.
 *
 * Profil bilgisi de burada tutuluyor: neredeyse her tüketici hem oturumu hem
 * profili (ad, rol, kurumsal mı) istiyor; ayrı ayrı çekmek her sayfada ikinci
 * bir istek demekti.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClientOrNull } from './client';
import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  // Yapılandırma eksikse null gelir. Bu durumda sağlayıcı oturumsuz çalışır:
  // site açılmaya devam eder, yalnızca giriş yapılamaz. Eksik bir ortam
  // değişkeninin tüm siteyi düşürmesini istemiyoruz.
  const supabase = getSupabaseBrowserClientOrNull();

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const user = session?.user ?? null;

  useEffect(() => {
    let active = true;

    if (!supabase) {
      console.error(
        'Supabase yapılandırılmamış: NEXT_PUBLIC_SUPABASE_URL ve ' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. Giriş devre dışı.'
      );
      setIsUserLoading(false);
      return;
    }

    // İlk yükleme: sunucudan doğrulanmış kullanıcıyı al.
    // getSession() yerine getUser() çünkü getSession çerezdeki veriyi
    // doğrulamadan döndürüyor; kullanıcı kimliğine güvenmemiz gereken yerde
    // sunucuya sorulmuş olan doğru.
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        supabase.auth.getSession().then(({ data: s }) => {
          if (active) setSession(s.session);
        });
      }
      setIsUserLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsUserLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Oturum değiştikçe profili tazele.
  useEffect(() => {
    let active = true;
    const userId = session?.user?.id;

    if (!supabase || !userId) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        // Profil trigger'ı henüz yazmamış olabilir (kayıt anındaki yarış);
        // hata basmak yerine null bırakıyoruz, sonraki tazelemede gelir.
        if (error) console.error('Profil okunamadı:', error.message);
        setProfile((data as Profile) ?? null);
        setIsProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [supabase, session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isUserLoading,
      isProfileLoading,
      async signOut() {
        if (supabase) await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      },
      async refreshProfile() {
        const userId = session?.user?.id;
        if (!supabase || !userId) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        setProfile((data as Profile) ?? null);
      },
    }),
    [supabase, user, session, profile, isUserLoading, isProfileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useUser/useProfile yalnızca <SupabaseAuthProvider> içinde kullanılabilir.');
  }
  return ctx;
}

/** Oturum açmış kullanıcı ve yüklenme durumu. */
export function useUser() {
  const { user, isUserLoading } = useAuthContext();
  return { user, isUserLoading };
}

export function useProfile() {
  const { profile, isProfileLoading, refreshProfile } = useAuthContext();
  return { profile, isProfileLoading, refreshProfile };
}

export function useSupabaseAuth() {
  return useAuthContext();
}
