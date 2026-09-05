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

/**
 * İlan ayarları.
 *
 * Fotoğraf sınırı yönetim panelinde bir alan olarak duruyordu ama hiçbir
 * yerde okunmuyordu: form kendi içinde 12 sabitini kullanıyor, panel ise
 * 8 gösteriyordu. Yani ayarı değiştirmek hiçbir şey yapmıyordu. Yardım
 * merkezinde bu sayıyı yazacaksak önce doğru sayının tek bir kaynağı
 * olması gerekiyor.
 */
export type ListingSettings = {
  maxPhotos: number;
  durationDays: number;
  autoApprove: boolean;
};

const VARSAYILAN_ILAN_AYARLARI: ListingSettings = {
  maxPhotos: 12,
  durationDays: 30,
  autoApprove: true,
};

export async function getListingSettings(): Promise<ListingSettings> {
  if (!isSupabaseServerConfigured()) return VARSAYILAN_ILAN_AYARLARI;

  try {
    const { data, error } = await createSupabasePublicClient()
      .from('app_settings')
      .select('value')
      .eq('key', 'listing')
      .maybeSingle();

    if (error || !data?.value) return VARSAYILAN_ILAN_AYARLARI;

    const raw = data.value as Record<string, unknown>;
    const sayi = (deger: unknown, varsayilan: number) =>
      typeof deger === 'number' && Number.isFinite(deger) && deger > 0 ? deger : varsayilan;

    return {
      maxPhotos: sayi(raw.max_photos, VARSAYILAN_ILAN_AYARLARI.maxPhotos),
      durationDays: sayi(raw.default_duration_days, VARSAYILAN_ILAN_AYARLARI.durationDays),
      autoApprove:
        typeof raw.auto_approve === 'boolean'
          ? raw.auto_approve
          : VARSAYILAN_ILAN_AYARLARI.autoApprove,
    };
  } catch {
    return VARSAYILAN_ILAN_AYARLARI;
  }
}
