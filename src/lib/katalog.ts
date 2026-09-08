/**
 * Katalogun paylaşılan tipleri ve sabitleri.
 *
 * Sorgulardan ayrı bir dosyada, çünkü işletme sahibinin yönetim ekranı bir
 * istemci bileşeni ve sunucuya özel modülü ("server-only") içeri alamıyor.
 */

export type KatalogSatiri = {
  id: number;
  provider_id: number;
  kind: 'urun' | 'hizmet';
  name: string;
  brand: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  unit: string | null;
  stock: number | null;
  photo_path: string | null;
  position: number;
  is_active: boolean;
};

/** Ürün grupları. Değerler veritabanındaki check kısıtıyla aynı. */
export const URUN_GRUPLARI = [
  { slug: 'mama', ad: 'Mama' },
  { slug: 'odul-mama', ad: 'Ödül Maması' },
  { slug: 'kum', ad: 'Kedi Kumu' },
  { slug: 'oyuncak', ad: 'Oyuncak' },
  { slug: 'tasma-kayis', ad: 'Tasma ve Kayış' },
  { slug: 'kafes-tasima', ad: 'Kafes ve Taşıma' },
  { slug: 'bakim-hijyen', ad: 'Bakım ve Hijyen' },
  { slug: 'saglik-vitamin', ad: 'Sağlık ve Vitamin' },
  { slug: 'akvaryum', ad: 'Akvaryum' },
  { slug: 'kus-urunleri', ad: 'Kuş Ürünleri' },
  { slug: 'diger', ad: 'Diğer' },
] as const;

export function urunGrubuAdi(slug: string | null): string | null {
  if (!slug) return null;
  return URUN_GRUPLARI.find((g) => g.slug === slug)?.ad ?? null;
}

