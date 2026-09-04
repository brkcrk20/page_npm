import 'server-only';

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Liste sayfalarının özgün metinleri.
 *
 * Kategori, cins, şehir, ilçe ve hizmet rehberi sayfaları yalnızca
 * filtrelerden ve kartlardan oluşuyordu; "Kadıköy Veterinerleri" ile
 * "Beşiktaş Veterinerleri" arasında hiçbir fark yoktu. Metinler artık
 * veritabanından (page_content) geliyor ve yönetim panelinden yazılıyor —
 * koda gömülü olsaydı her metin için yayın gerekirdi.
 *
 * Metin YOKSA sayfa hiçbir şey göstermiyor. Otomatik üretilmiş, birbirinin
 * kopyası doldurma metni yazmak, hiç metin olmamasından kötü.
 */

export type SayfaIcerigi = {
  seo_title: string | null;
  seo_description: string | null;
  intro: string | null;
  body: string | null;
  faq: { soru: string; cevap: string }[];
};

export type IcerikHedefi = {
  categoryId?: number | null;
  breedId?: number | null;
  cityId?: number | null;
  districtId?: number | null;
  serviceType?: Database['public']['Enums']['service_type'] | null;
};

function faqNormalize(deger: unknown): { soru: string; cevap: string }[] {
  if (!Array.isArray(deger)) return [];
  return deger
    .filter(
      (x): x is { soru: string; cevap: string } =>
        !!x && typeof x === 'object' && 'soru' in x && 'cevap' in x
    )
    .map((x) => ({ soru: String(x.soru), cevap: String(x.cevap) }))
    .filter((x) => x.soru.trim() && x.cevap.trim());
}

export async function getPageContent(hedef: IcerikHedefi): Promise<SayfaIcerigi | null> {
  if (!isSupabaseServerConfigured()) return null;

  const supabase = createSupabasePublicClient();

  // Boş bırakılan anahtarlar NULL olarak eşleşmeli: kategori sayfası
  // ararken cinsi olan satır dönmemeli. PostgREST'te `is.null` bunu yapıyor;
  // eşitlik yazmak NULL karşılaştırmasında hiçbir satır döndürmezdi.
  const alanlar: [string, number | string | null | undefined][] = [
    ['category_id', hedef.categoryId ?? null],
    ['breed_id', hedef.breedId ?? null],
    ['city_id', hedef.cityId ?? null],
    ['district_id', hedef.districtId ?? null],
    ['service_type', hedef.serviceType ?? null],
  ];

  let query = supabase
    .from('page_content')
    .select('seo_title, seo_description, intro, body, faq');

  for (const [alan, deger] of alanlar) {
    query = deger === null ? query.is(alan, null) : query.eq(alan, deger as never);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const satir = data as unknown as Omit<SayfaIcerigi, 'faq'> & { faq: unknown };
  const icerik: SayfaIcerigi = { ...satir, faq: faqNormalize(satir.faq) };

  // Hiçbir alanı dolu değilse yokmuş gibi davran: boş bir kutu çizmeyelim.
  const doluMu =
    icerik.intro?.trim() || icerik.body?.trim() || icerik.faq.length > 0 ||
    icerik.seo_title?.trim() || icerik.seo_description?.trim();

  return doluMu ? icerik : null;
}
