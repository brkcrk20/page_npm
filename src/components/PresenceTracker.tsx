'use client';

import { useEffect } from 'react';

import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Çevrimiçi kullanıcı işaretleyici.
 *
 * profiles.last_seen_at en baştan beri duruyordu ama hiçbir yerde
 * güncellenmiyordu, yani "şu an kaç kişi sitede" bilgisi üretilemiyordu.
 *
 * Gerçek bir websocket varlık takibi değil: sayfa açan kullanıcı
 * işaretleniyor ve son 15 dakika "çevrimiçi" sayılıyor. Websocket bağlantısı
 * tutmak bu ölçekte gereksiz maliyet; sonuç pratikte aynı.
 *
 * Veritabanı tarafında dakikada birden fazla yazma engelleniyor
 * (touch_last_seen), bu yüzden buradan sık çağrılması sorun değil.
 */
export function PresenceTracker() {
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    // Dinamik içe aktarma: bu bileşen kök düzende, yani her sayfada.
    // Yukarıdan içe aktarıldığında Supabase paketi oturum açmamış
    // ziyaretçiye de iniyordu; oysa burası yalnızca oturum varken çalışıyor.
    (async () => {
      const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClientOrNull();
      if (!supabase) return;

      // .then() ŞART: Supabase sorgu oluşturucusu tembel bir thenable,
      // await edilmezse istek hiç gönderilmiyor.
      const ping = () => void supabase.rpc('touch_last_seen').then(() => {});

      ping();
      // Sekme açık kalırsa da çevrimiçi sayılsın.
      timer = setInterval(ping, 5 * 60 * 1000);
    })();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user]);

  return null;
}
