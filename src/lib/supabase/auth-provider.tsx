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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** İstemci dinamik yükleniyor; tipi buradan geliyor. */
type SupabaseIstemci = NonNullable<
  ReturnType<typeof import('./client')['getSupabaseBrowserClientOrNull']>
>;

/**
 * Tarayıcıda oturum çerezi var mı?
 *
 * Supabase oturumu "sb-<proje>-auth-token" adlı çerezde tutuluyor. Çerez
 * yoksa oturum da yok; bunu anlamak için Supabase istemcisini indirmeye
 * gerek kalmıyor.
 */
function oturumCereziVarMi(): boolean {
  if (typeof document === 'undefined') return false;
  return /(^|;\s*)sb-[^=]*-auth-token(\.\d+)?=/.test(document.cookie);
}

export type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /**
   * Girişten hemen sonra çağrılıyor.
   *
   * Oturum açılınca sayfa yeniden yüklenmiyor (router.push), yani bu
   * sağlayıcı yeniden kurulmuyor. Anonim ziyaretçide istemci hiç
   * yüklenmediği için oturum değişikliğini dinleyen de yok; giriş yapan
   * kullanıcı başlıkta hâlâ "Giriş Yap" görürdü.
   */
  oturumuYenile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  /**
   * Supabase istemcisi yalnızca gerektiğinde indiriliyor.
   *
   * Bu sağlayıcı kök düzende, yani her sayfada. İstemci yukarıdan içe
   * aktarıldığında @supabase/supabase-js ilk yüklenen paket yığınına
   * giriyordu: ölçülen 55 KB (sıkıştırılmış) ve ana sayfada bu kodun
   * %83'ü hiç çalışmıyordu. Ziyaretçilerin çoğu oturum açmamış oluyor —
   * arama motorundan gelen ilk ziyaret her zaman öyle.
   *
   * Çerez yoksa oturum da yoktur; istemci hiç indirilmiyor. Çerez varsa
   * indirilip her şey eskisi gibi çalışıyor.
   *
   * Yapılandırma eksikse istemci null gelir; site açılmaya devam eder,
   * yalnızca giriş yapılamaz.
   */
  const [supabase, setSupabase] = useState<SupabaseIstemci | null>(null);
  const istemciYuklendi = useRef(false);

  const istemciYukle = useCallback(async (): Promise<SupabaseIstemci | null> => {
    if (istemciYuklendi.current) return supabase;
    istemciYuklendi.current = true;

    const { getSupabaseBrowserClientOrNull } = await import('./client');
    const c = getSupabaseBrowserClientOrNull();
    if (!c) {
      console.error(
        'Supabase yapılandırılmamış: NEXT_PUBLIC_SUPABASE_URL ve ' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. Giriş devre dışı.'
      );
      return null;
    }
    setSupabase(c);
    return c;
  }, [supabase]);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const user = session?.user ?? null;

  // Çerez yoksa hiçbir şey indirmiyoruz: oturum yok, yükleme de bitti.
  useEffect(() => {
    if (!oturumCereziVarMi()) {
      setIsUserLoading(false);
      return;
    }
    istemciYukle();
  }, [istemciYukle]);

  useEffect(() => {
    let active = true;
    if (!supabase) return;

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
        // İstemci hiç yüklenmediyse burada yükleniyor: aksi hâlde çıkış
        // yalnızca ekranı temizler, oturum çerezi sunucuda kalırdı.
        const istemci = supabase ?? (await istemciYukle());
        if (istemci) await istemci.auth.signOut();
        setSession(null);
        setProfile(null);
      },
      async refreshProfile() {
        const userId = session?.user?.id;
        if (!supabase || !userId) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        setProfile((data as Profile) ?? null);
      },
      async oturumuYenile() {
        const istemci = supabase ?? (await istemciYukle());
        if (!istemci) return;
        setIsUserLoading(true);
        const { data } = await istemci.auth.getSession();
        setSession(data.session);
        setIsUserLoading(false);
      },
    }),
    [supabase, istemciYukle, user, session, profile, isUserLoading, isProfileLoading]
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
