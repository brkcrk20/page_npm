import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CreateListingForm, type ListingPreset } from '@/app/ilan-ver/CreateListingForm';

/**
 * Bölüme özel ilan verme sayfaları.
 *
 * "İlan Ver" her yerde aynı boş formu açıyordu: al-sat sayfasından basan
 * kullanıcı kedi ve köpek kategorileriyle karşılaşıyordu. Bulunduğu bölüm
 * zaten cevabın yarısı; formun onu tekrar sorması hem gereksiz bir adım hem
 * de yanlış kategoriye ilan açılmasının başlıca sebebi.
 *
 * Her bölüm kendi ön ayarını veriyor: kategori ve gerekiyorsa ilan türü
 * kilitleniyor, kilitli alan formda gösterilmiyor.
 *
 * KİLİT SUNUCUDA DEĞİL
 * Bu bir yetki kısıtı değil, bir kolaylık: kullanıcı /ilan-ver adresinden
 * hâlâ istediği kategoriyi seçebiliyor. Güvenlik açısından önemli olan
 * alanlar (sahiplik, durum, telefon) zaten veritabanındaki muhafızda.
 */

const PRESETS: Record<string, ListingPreset & { metaTitle: string; metaDescription: string }> = {
  // Tür kilitli DEĞİL: bu bölüm hayvan ilanlarının tamamı. Bir çiftlik ya
  // da yetiştirici de buradan satılık ilan veriyor; sahiplendirmeye
  // kilitlemek onları sitenin dışında bırakıyordu.
  sahiplendirme: {
    hideCategorySlugs: ['guvercin-ilanlari', 'pet-malzemeleri'],
    title: 'Hayvan İlanı Ver',
    description:
      'Kedi, köpek, kuş ve diğer dostlar için ilan verin. Sahiplendirme ilanları ücretsizdir, satılık ilanlarda fiyat girersiniz.',
    backHref: '/sahiplendirme',
    backLabel: 'Sahiplendirme İlanları',
    metaTitle: 'Hayvan İlanı Ver',
    metaDescription:
      'Kedi, köpek, kuş ve diğer dostlarınız için sahiplendirme veya satılık ilanı verin. Fotoğraf ekleyin, doğrudan görüşün.',
  },
  'es-arayan': {
    kind: 'es_arayan',
    hideCategorySlugs: ['pet-malzemeleri'],
    title: 'Eş Arayan İlanı Ver',
    description:
      'Çiftleştirme için eş arayan hayvanınızın ırkını, yaşını ve varsa şecere bilgisini yazın.',
    backHref: '/es-arayanlar',
    backLabel: 'Eş Arayanlar',
    metaTitle: 'Eş Arayan İlanı Ver',
    metaDescription:
      'Kedi, köpek ve güvercinler için eş arayan ilanı verin. Irk, yaş ve şecere bilgisiyle uygun eşi bulun.',
  },
  guvercin: {
    categorySlug: 'guvercin-ilanlari',
    title: 'Güvercin İlanı Ver',
    backHref: '/guvercin-ilanlari',
    backLabel: 'Güvercin İlanları',
    metaTitle: 'Güvercin İlanı Ver',
    metaDescription:
      'Taklacı, posta, süs veya yerli güvercininiz için ilan verin. Uçuş videosu, halka numarası ve şecere bilgisiyle güvenle satın.',
  },
  kayip: {
    kind: 'kayip',
    hideCategorySlugs: ['pet-malzemeleri'],
    title: 'Kayıp Hayvan İlanı Ver',
    description:
      'Kaybolduğu yeri, tarihi ve ayırt edici özelliklerini yazın. Tasma rengi ya da çip numarası gibi bir ayrıntıyı sahiplik doğrulaması için kendinize saklamanız iyi olur.',
    backHref: '/kayip',
    backLabel: 'Kayıp İlanları',
    metaTitle: 'Kayıp Hayvan İlanı Ver',
    metaDescription:
      'Kaybolan kedi, köpek veya kuşunuz için ücretsiz kayıp ilanı verin. Şehrinizdeki kullanıcılar görsün.',
  },
  bulundu: {
    kind: 'bulundu',
    hideCategorySlugs: ['pet-malzemeleri'],
    title: 'Bulunan Hayvan İlanı Ver',
    description:
      'Bulduğunuz hayvanı sahibine ulaştırın. Bulduğunuz yeri ve tarihi yazın; sahiplik iddiasında bulunanlardan ilanda yazmadığınız bir ayrıntıyı istemeniz doğrulamayı kolaylaştırır.',
    backHref: '/kayip?tip=bulundu',
    backLabel: 'Bulunan Hayvanlar',
    metaTitle: 'Bulunan Hayvan İlanı Ver',
    metaDescription:
      'Sokakta bulduğunuz kedi, köpek veya kuşu ücretsiz ilanla duyurun; sahibi arıyor olabilir.',
  },
  'al-sat': {
    categorySlug: 'pet-malzemeleri',
    // İkinci el eşya satılır; "ücretsiz veriyorum" seçeneği burada
    // gereksiz bir soru. Fiyat zaten zorunlu hâle geliyor.
    kind: 'satilik',
    title: 'Pet Malzemesi İlanı Ver',
    backHref: '/al-sat',
    backLabel: 'İkinci El Pet Malzemeleri',
    metaTitle: 'İkinci El Pet Malzemesi İlanı Ver',
    metaDescription:
      'Kullanmadığınız kafes, akvaryum, taşıma çantası ve diğer pet malzemelerini ücretsiz satışa çıkarın.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bolum: string }>;
}): Promise<Metadata> {
  const { bolum } = await params;
  const preset = PRESETS[bolum];
  if (!preset) return { title: 'İlan Ver' };

  return {
    title: `${preset.metaTitle}`,
    description: preset.metaDescription,
    // Form sayfaları listeleme sayfalarıyla arama sonuçlarında rekabet etmemeli.
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return Object.keys(PRESETS).map((bolum) => ({ bolum }));
}

/** Ön ayarın kategori kilidini gevşetmeden değiştirmek isteyen tek yer burası. */
const KATEGORI_ILE_GELEBILEN = new Set(['sahiplendirme', 'es-arayan']);

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ bolum: string }>;
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { bolum } = await params;
  const preset = PRESETS[bolum];
  if (!preset) notFound();

  // Kedi ilanları sayfasından "İlan Ver"e basan kullanıcıya kategoriyi
  // tekrar sormuyoruz. Yalnızca o bölümde zaten seçilebilen kategoriler
  // kabul ediliyor; adres çubuğuna yazılan başka bir şey yok sayılıyor.
  const { kategori } = await searchParams;
  const kilitli =
    kategori && KATEGORI_ILE_GELEBILEN.has(bolum) && !preset.hideCategorySlugs?.includes(kategori)
      ? kategori
      : undefined;

  return <CreateListingForm preset={kilitli ? { ...preset, categorySlug: kilitli } : preset} />;
}
