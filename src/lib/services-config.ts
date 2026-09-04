import type { Database } from '@/lib/supabase/database.types';

export type ServiceType = Database['public']['Enums']['service_type'];

/**
 * Hizmet kategorilerinin tek tanımı.
 *
 * Yedi kategori aynı veri modelini, aynı sayfaları ve aynı filtre panelini
 * paylaşıyor; aralarındaki tek fark buradaki metinler. Kategori başına ayrı
 * bileşen yazmak, ilan kategorilerinde düzelttiğimiz kopyalama hatasının
 * aynısını hizmet tarafında tekrarlamak olurdu.
 *
 * URL'lerde alt çizgi yerine tire: arama motorları alt çizgiyi kelime
 * ayırıcı saymıyor, yani "pet_kuafor" tek bir kelime gibi okunuyor.
 * Eski alt çizgili adresler next.config.ts'te kalıcı olarak yönlendiriliyor.
 */
export type ServiceConfig = {
  type: ServiceType;
  /** URL yolu: /veteriner, /pet-oteli … */
  slug: string;
  /** Liste başlığı ve menü etiketi */
  label: string;
  /** Tekil: "klinik", "otel", "salon" */
  unit: string;
  seoTitle: string;
  seoDescription: string;
  /**
   * Kayıt formundaki çağrı.
   *
   * Hepsi İŞLETME ya da HİZMET diyor, hiçbiri "profil" demiyor. Gezdirici
   * ve eğitmen sayfalarında "Profilinizi Ekleyin" yazıyordu; aynı akış
   * kurumsal hesap isteyip işletme kaydı açtığı için bu, kullanıcıya iki
   * farklı şey vaat ediyordu — kişisel profil mi, işletme kaydı mı?
   */
  registerCta: string;
};

export const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    type: 'veteriner',
    slug: 'veteriner',
    label: 'Veteriner Klinikleri',
    unit: 'klinik',
    seoTitle: 'Veteriner Klinikleri — Size En Yakın Veteriner Hekim',
    seoDescription:
      'Türkiye genelindeki veteriner klinikleri: 7/24 acil servis, röntgen, laboratuvar ve yatılı tedavi hizmeti verenler. Şehrinize göre filtreleyin, çalışma saatlerini görün.',
    registerCta: 'Kliniğinizi Ekleyin',
  },
  {
    type: 'pet_oteli',
    slug: 'pet-oteli',
    label: 'Pet Otelleri',
    unit: 'otel',
    seoTitle: 'Pet Otelleri — Evcil Hayvan Konaklama',
    seoDescription:
      'Tatilde ve seyahatte dostunuzu güvenle bırakabileceğiniz pet otelleri. Kamera takibi, günlük yürüyüş ve veteriner desteği sunanları karşılaştırın.',
    registerCta: 'Otelinizi Ekleyin',
  },
  {
    type: 'kuafor',
    slug: 'pet-kuafor',
    label: 'Pet Kuaförleri',
    unit: 'salon',
    seoTitle: 'Pet Kuaförleri — Evcil Hayvan Bakım Salonları',
    seoDescription:
      'Tıraş, yıkama, tırnak kesimi ve kulak temizliği yapan pet kuaförleri. Eve servis veren ve randevu ile çalışan salonları bulun.',
    registerCta: 'Salonunuzu Ekleyin',
  },
  {
    type: 'pet_taksi',
    slug: 'pet-taksi',
    label: 'Pet Taksiler',
    unit: 'hizmet',
    seoTitle: 'Pet Taksi — Evcil Hayvan Ulaşım Hizmeti',
    seoDescription:
      'Veterinere, otele veya şehirlerarası yolculuğa güvenli taşıma. Klimalı araç, taşıma kabini ve 7/24 hizmet veren pet taksileri.',
    registerCta: 'Hizmetinizi Ekleyin',
  },
  {
    type: 'gezdirici',
    slug: 'gezdirici',
    label: 'Köpek Gezdiriciler',
    unit: 'gezdirici',
    seoTitle: 'Köpek Gezdirme Hizmeti — Güvenilir Gezdiriciler',
    seoDescription:
      'Gün içinde köpeğinizi gezdirecek deneyimli gezdiriciler. Grup veya birebir yürüyüş, konum paylaşımı ve sigortalı hizmet seçenekleri.',
    registerCta: 'Hizmetinizi Ekleyin',
  },
  {
    type: 'egitmen',
    slug: 'egitmen',
    label: 'Pet Eğitmenleri',
    unit: 'eğitmen',
    seoTitle: 'Köpek Eğitmenleri — Temel İtaat ve Davranış Eğitimi',
    seoDescription:
      'Temel itaat, tuvalet eğitimi ve davranış problemleri konusunda çalışan pet eğitmenleri. Evde ders veren ve yatılı eğitim sunanları karşılaştırın.',
    registerCta: 'Hizmetinizi Ekleyin',
  },
  {
    type: 'petshop',
    slug: 'petshop',
    label: 'Petshoplar',
    unit: 'mağaza',
    seoTitle: 'Petshop — Mama, Oyuncak ve Bakım Ürünleri',
    seoDescription:
      'Mama, kum, oyuncak ve bakım ürünleri satan petshoplar. Aynı gün teslimat ve online sipariş veren mağazaları bulun.',
    registerCta: 'Mağazanızı Ekleyin',
  },
];

const bySlug = new Map(SERVICE_CONFIGS.map((c) => [c.slug, c]));
const byType = new Map(SERVICE_CONFIGS.map((c) => [c.type, c]));

export function getServiceConfigBySlug(slug: string): ServiceConfig | undefined {
  return bySlug.get(slug);
}

export function getServiceConfig(type: ServiceType): ServiceConfig {
  const config = byType.get(type);
  if (!config) throw new Error(`Tanımsız hizmet tipi: ${type}`);
  return config;
}
