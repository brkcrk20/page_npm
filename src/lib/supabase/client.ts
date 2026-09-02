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

function readConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Şablon değerleri (.env.example'dan kopyalanıp doldurulmamış) yapılandırılmış
  // sayılmaz; yoksa "geçersiz URL" hatası ancak çalışma anında ortaya çıkar.
  const isPlaceholder = (v?: string) =>
    !v || v.startsWith('BURAYA') || v.includes('xxxxxxxx');

  if (isPlaceholder(url) || isPlaceholder(key)) return null;
  return { url: url as string, key: key as string };
}

/**
 * Supabase ortam değişkenleri tanımlı mı?
 *
 * Yapılandırma eksikken uygulamanın tamamen çökmesini değil, oturumsuz
 * çalışmasını istiyoruz — aksi halde Vercel'de tek bir eksik değişken
 * prerender sırasında build'i düşürüyor ve site hiç yayınlanamıyor.
 */
export function isSupabaseConfigured(): boolean {
  return readConfig() !== null;
}

/** Yapılandırma eksikse null döner; çağıran tarafın bunu ele alması gerekir. */
export function getSupabaseBrowserClientOrNull() {
  if (client) return client;
  const config = readConfig();
  if (!config) return null;
  client = createBrowserClient<Database>(config.url, config.key);
  return client;
}

/**
 * Yapılandırma zorunlu olan yerler için. Eksikse anlaşılır bir hata fırlatır.
 * Kullanıcı etkileşimiyle tetiklenen kodda (form gönderimi gibi) bunu kullanın;
 * render sırasında çalışan kodda getSupabaseBrowserClientOrNull tercih edin.
 */
export function getSupabaseBrowserClient() {
  const instance = getSupabaseBrowserClientOrNull();
  if (!instance) {
    throw new Error(
      'Supabase ortam değişkenleri eksik. NEXT_PUBLIC_SUPABASE_URL ve ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlanmalı (yerelde .env.local, ' +
        'canlıda Vercel > Settings > Environment Variables).'
    );
  }
  return instance;
}
