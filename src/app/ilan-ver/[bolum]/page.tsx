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
  sahiplendirme: {
    kind: 'sahiplendirme',
    hideCategorySlugs: ['guvercin-ilanlari', 'pet-malzemeleri'],
    title: 'Ücretsiz Sahiplendirme İlanı Ver',
    backHref: '/sahiplendirme',
    backLabel: 'Sahiplendirme İlanları',
    metaTitle: 'Ücretsiz Sahiplendirme İlanı Ver',
    metaDescription:
      'Yuva arayan dostunuz için ücretsiz sahiplendirme ilanı verin. Fotoğraf ekleyin, sahiplenmek isteyenlerle doğrudan görüşün.',
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
  if (!preset) return { title: 'İlan Ver | PetSemti' };

  return {
    title: `${preset.metaTitle} | PetSemti`,
    description: preset.metaDescription,
    // Form sayfaları listeleme sayfalarıyla arama sonuçlarında rekabet etmemeli.
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return Object.keys(PRESETS).map((bolum) => ({ bolum }));
}

export default async function Page({ params }: { params: Promise<{ bolum: string }> }) {
  const { bolum } = await params;
  const preset = PRESETS[bolum];
  if (!preset) notFound();

  return <CreateListingForm preset={preset} />;
}
