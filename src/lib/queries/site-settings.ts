import { createSupabasePublicClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

/**
 * Site geneli ayarların sunucu tarafında okunması.
 *
 * İletişim bilgileri, kurumsal unvan ve sosyal medya adresleri koda gömülü
 * yer tutuculardı (0555 555 55 55 gibi) ve her ziyaretçiye gösteriliyordu.
 * Artık veritabanından geliyor; sahibi panelden bir kez dolduruyor.
 *
 * Ayar okunamazsa boş nesne dönüyor — alt bilgi ve künye eksik alanı hiç
 * göstermiyor. Yer tutucu göstermektense hiç göstermemek doğru.
 */

export type SiteContact = {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  legal_name?: string;
  mersis?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  youtube?: string;
};

export async function getSiteContact(): Promise<SiteContact> {
  if (!isSupabaseServerConfigured()) return {};

  try {
    const { data, error } = await createSupabasePublicClient()
      .from('app_settings')
      .select('value')
      .eq('key', 'contact')
      .maybeSingle();

    if (error || !data?.value) return {};

    // Boş metinler yok sayılıyor: alt bilgi "var mı" diye baktığı için
    // boş string bir satırın boş boş görünmesine yol açardı.
    const raw = data.value as Record<string, unknown>;
    const clean: SiteContact = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string' && value.trim()) {
        (clean as Record<string, string>)[key] = value.trim();
      }
    }
    return clean;
  } catch {
    return {};
  }
}
