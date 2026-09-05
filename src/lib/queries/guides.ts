import 'server-only';

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';

/**
 * PetSemti Rehber sorguları.
 *
 * Rehber blogdan farklı olarak ürüne bağlı: her yazının bağlandığı bir
 * ilan listesi, cins, şehir ya da hizmet rehberi var. Amaç yazı okutmak
 * değil, aramadan gelen kişiyi doğru bölüme götürmek — o yüzden ilişkili
 * alanlar listeyle birlikte çekiliyor.
 */

export type GuideCard = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  published_at: string | null;
  guide_topics: { slug: string; name: string } | null;
};

export type GuideDetail = GuideCard & {
  body: string;
  seo_title: string | null;
  seo_description: string | null;
  related_links: { label: string; href: string }[];
  categories: { slug: string; name: string } | null;
  breeds: { slug: string; name: string; category_id: number } | null;
  cities: { slug: string; name: string } | null;
  related_service: string | null;
  related_category_id: number | null;
};

const KART = `
  id, slug, title, excerpt, cover_path, published_at,
  guide_topics ( slug, name )
`;

export async function getGuides(opts: { topicSlug?: string; limit?: number } = {}) {
  if (!isSupabaseServerConfigured()) return [] as GuideCard[];
  const supabase = createSupabasePublicClient();

  let q = supabase
    .from('guides')
    .select(KART)
    .eq('status', 'yayinda')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 50);

  // Alt konu seçildiyse yalnızca o konu; üst konu seçildiyse altları da.
  if (opts.topicSlug) {
    const { data: konu } = await supabase
      .from('guide_topics')
      .select('id')
      .eq('slug', opts.topicSlug)
      .maybeSingle();

    if (!konu) return [] as GuideCard[];

    const { data: altlar } = await supabase
      .from('guide_topics')
      .select('id')
      .eq('parent_id', (konu as { id: number }).id);

    const idler = [
      (konu as { id: number }).id,
      ...((altlar ?? []) as { id: number }[]).map((a) => a.id),
    ];
    q = q.in('topic_id', idler);
  }

  const { data, error } = await q;
  if (error) {
    console.error('Rehber yazıları alınamadı:', error.message);
    return [] as GuideCard[];
  }
  return (data ?? []) as unknown as GuideCard[];
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('guides')
    .select(
      `${KART}, body, seo_title, seo_description, related_links,
       related_service, related_category_id,
       categories:categories!guides_related_category_id_fkey ( slug, name ),
       breeds:breeds!guides_related_breed_id_fkey ( slug, name, category_id ),
       cities:cities!guides_related_city_id_fkey ( slug, name )`
    )
    .eq('slug', slug)
    .eq('status', 'yayinda')
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as GuideDetail;
}

export type GuideTopic = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  position: number;
};

/**
 * Bir yazıyla ilgili diğer yazılar.
 *
 * Önce aynı alt konuya bakılıyor; tek yazılık bir alt konuda (ör. "Kedi
 * Bakımı") hiçbir öneri çıkmıyordu. O durumda üst konuya çıkılıyor, orada
 * da yoksa en yeni yazılara. Boş bir "ilgili" bloğu, iç bağlantı ağının
 * en çok işe yarayacağı yerde hiç bağlantı olmaması demekti.
 */
export async function getRelatedGuides(
  slug: string,
  topicSlug: string | undefined,
  limit = 3
): Promise<GuideCard[]> {
  const ele = (liste: GuideCard[]) => liste.filter((g) => g.slug !== slug).slice(0, limit);

  if (topicSlug) {
    const aynisi = ele(await getGuides({ topicSlug, limit: limit + 1 }));
    if (aynisi.length >= limit) return aynisi;

    const konular = await getGuideTopics();
    const konu = konular.find((k) => k.slug === topicSlug);
    const ust = konu?.parent_id ? konular.find((k) => k.id === konu.parent_id) : null;

    if (ust) {
      const ustten = ele(await getGuides({ topicSlug: ust.slug, limit: limit + 3 }));
      if (ustten.length >= 1) return ustten;
    }
    if (aynisi.length) return aynisi;
  }

  return ele(await getGuides({ limit: limit + 1 }));
}

export async function getGuideTopics(): Promise<GuideTopic[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from('guide_topics')
    .select('id, slug, name, parent_id, position')
    .order('position');

  return (data ?? []) as unknown as GuideTopic[];
}

/**
 * Bir ilana gerçekten ait rehber yazıları.
 *
 * İlan sayfasının altına yazı KOPYALAMAK yerine yazıya BAĞLANIYORUZ. Aynı
 * metni binlerce ilan sayfasına basmak, arama motoru açısından her sayfayı
 * birbirinin kopyası hâline getirir; bağlantı vermek ise hem okuyucuya
 * gerçek bir sonraki adım sunar hem de rehber yazılarına iç bağlantı
 * kazandırır.
 *
 * Eşleşme dar tutuluyor: önce cinse, sonra kategoriye bağlı yazılar.
 * Hiçbiri yoksa boş dönüyor — alakasız yazıyla doldurmak, tam da kaçınmak
 * istediğimiz "her sayfada aynı blok" sorununu geri getirirdi.
 */
export async function getGuidesForListing(
  categoryId: number | null,
  breedId: number | null,
  limit = 3
): Promise<GuideCard[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const cek = async (alan: 'related_breed_id' | 'related_category_id', deger: number) => {
    const { data } = await supabase
      .from('guides')
      .select(KART)
      .eq('status', 'yayinda')
      .eq(alan, deger)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    return (data ?? []) as unknown as GuideCard[];
  };

  const bulunan: GuideCard[] = breedId ? await cek('related_breed_id', breedId) : [];

  if (bulunan.length < limit && categoryId) {
    const gorulen = new Set(bulunan.map((g) => g.id));
    for (const yazi of await cek('related_category_id', categoryId)) {
      if (gorulen.has(yazi.id)) continue;
      bulunan.push(yazi);
      if (bulunan.length === limit) break;
    }
  }

  return bulunan;
}
