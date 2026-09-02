import 'server-only';

/**
 * Sunucu tarafı Supabase istemcileri.
 *
 * Bu katman SEO'nun anahtarı: sayfalar server component olarak veriyi burada
 * çekerse Google gerçek içeriği görür. Eski Firebase kurulumunda tüm veri
 * istemcide çekildiği için arama motorları boş sayfa görüyordu.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}. .env.local dosyasını .env.example'a göre doldurun.`
    );
  }
  return value;
}

/**
 * Giriş yapmış kullanıcının oturumuyla çalışan istemci.
 * RLS politikaları bu kullanıcı için uygulanır.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server component içinden çerez yazılamaz; oturum tazeleme
            // middleware'de yapılıyor, burada sessizce geçmek doğru davranış.
          }
        },
      },
    }
  );
}

/**
 * Oturumsuz, salt okunur istemci — herkese açık sayfalar için.
 *
 * Çerez okumadığı için Next.js önbelleğini bozmaz; kategori, cins ve şehir
 * sayfaları bununla statik olarak üretilebilir.
 */
export function createSupabasePublicClient() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * RLS'i tamamen atlayan yönetim istemcisi.
 *
 * DİKKAT: service_role anahtarı tüm veriye sınırsız erişim verir. Yalnızca
 * sunucuda, yalnızca moderasyon/webhook/ödeme onayı gibi işlerde kullanın.
 * Bu anahtar ASLA NEXT_PUBLIC_ önekiyle tanımlanmamalı ve istemciye
 * gönderilmemelidir.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
