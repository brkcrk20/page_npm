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

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value || value.startsWith('BURAYA') || value.includes('xxxxxxxx')) return null;
  return value;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(
      `Ortam değişkeni eksik: ${name}. Yerelde .env.local, canlıda Vercel > ` +
        'Settings > Environment Variables altında tanımlanmalı.'
    );
  }
  return value;
}

/**
 * Supabase sunucu tarafında yapılandırılmış mı?
 *
 * Sorgu katmanı buna bakıp yapılandırma eksikken hata fırlatmak yerine boş
 * sonuç dönüyor. Sebep: eksik bir ortam değişkeni yüzünden her sayfanın 500
 * vermesi, "bu kategoride ilan yok" demekten çok daha kötü bir davranış.
 * Yanlışlıkla sessiz kalmamak için konsola belirgin bir uyarı yazılıyor.
 */
export function isSupabaseServerConfigured(): boolean {
  return readEnv('NEXT_PUBLIC_SUPABASE_URL') !== null
    && readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') !== null;
}

let warned = false;
export function warnMissingConfig(where: string) {
  if (warned) return;
  warned = true;
  console.error(
    `[Supabase] Yapılandırma eksik (${where}). NEXT_PUBLIC_SUPABASE_URL ve ` +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil; sayfalar boş veriyle ' +
      'render ediliyor.'
  );
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
