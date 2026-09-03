'use client';

import { useEffect, useState } from 'react';

import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Okunmamış mesaj rozeti.
 *
 * Sayı veritabanındaki RPC'den geliyor; konuşma satırındaki sayaçları
 * topluyor. Her açılışta mesajları saymak gelen kutusu büyüdükçe yavaşlardı.
 *
 * Yeni mesaj geldiğinde rozet kendiliğinden güncelleniyor: kullanıcı mesaj
 * sayfasında değilken de bildirim alması gerekiyor.
 */
export function UnreadBadge() {
  const { user } = useSupabaseAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase || !user) {
      setCount(0);
      return;
    }

    const refresh = () => {
      supabase.rpc('unread_message_count').then(({ data }) => setCount(Number(data ?? 0)));
    };
    refresh();

    const channel = supabase
      .channel('okunmamis-mesaj')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (count === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? '99+' : count}
    </span>
  );
}
