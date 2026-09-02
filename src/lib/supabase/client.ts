'use client';

/**
 * Tarayıcı tarafı Supabase istemcisi.
 *
 * Client component'lerden kullanılır. Oturum çerezlerden okunur, böylece
 * sunucu tarafıyla aynı oturumu paylaşır.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  // Tek örnek: her render'da yeni istemci kurmak oturum dinleyicilerini çoğaltır.
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase ortam değişkenleri eksik. .env.local dosyasına ' +
        'NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin ' +
        '(örnek için .env.example).'
    );
  }

  client = createBrowserClient<Database>(url, key);
  return client;
}
