import Link from 'next/link';
import { ArrowRight, MapPin, ShieldAlert } from 'lucide-react';

import { BreedAvatar } from '@/components/BreedAvatar';
import { SERVICE_CONFIGS } from '@/lib/services-config';
import type { SidebarData } from '@/lib/queries/catalog';

/**
 * Ana sayfanın alt bölümleri.
 *
 * İncelediğim emsal sitelerin tamamında ortak olan parçalar: popüler ırk
 * kartları, şehir bağlantıları, hizmet rehberi girişleri, güvenlik uyarısı
 * ve arama motoru için özgün metin. Hiçbiri sitede yoktu.
 */

/** Popüler ırklar: ilan sayısı olanlar önce, yoksa tanımlı sıra. */
export function PopularBreeds({ sidebar }: { sidebar: SidebarData }) {
  const breeds = sidebar.categories
    .filter((c) => c.code !== 'Supply')
    .flatMap((c) =>
      c.breeds.slice(0, 8).map((b) => ({ ...b, categorySlug: c.slug, categoryCode: c.code, categoryName: c.name }))
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 18);

  if (breeds.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">Popüler Irklar</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {breeds.map((b) => (
          <li key={`${b.categorySlug}-${b.slug}`}>
            <Link
              href={`/${b.categorySlug}/${b.slug}`}
              className="flex items-center gap-2 rounded-xl border bg-white p-2.5 transition-colors hover:border-primary"
            >
              <BreedAvatar
                breedName={b.name}
                breedSlug={b.slug}
                categorySlug={b.categorySlug}
                categoryCode={b.categoryCode}
                categoryName={b.categoryName}
                size={36}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{b.name}</span>
                <span className="block text-xs text-muted-foreground">{b.count} ilan</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Hizmet rehberleri: yedi dizinin girişi. */
export function ServiceDirectories() {
  return (
    <section>
      <h2 className="mb-1 text-xl font-bold">Pet Hizmetleri</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Şehrinizdeki işletmeleri inceleyin; hizmetlerine, çalışma saatlerine ve
        değerlendirmelerine göre karşılaştırın.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {SERVICE_CONFIGS.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/${s.slug}`}
              className="flex h-full flex-col justify-center rounded-xl border bg-white p-3 text-center transition-colors hover:border-primary hover:text-primary"
            >
              {/* Etiket olduğu gibi: kısaltmaya çalışmak "Pet Otelleri" ve
                  "Pet Kuaförleri"ni ikisi de "Pet"e indiriyordu. */}
              <span className="text-sm font-semibold leading-tight">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Şehir bağlantıları.
 *
 * Arama motoru için değerli: "ankara kedi ilanları" araması ana sayfaya
 * değil doğrudan o şehrin sayfasına düşmeli. Emsal sitelerin hepsinde bu
 * bağlantı ağı var.
 */
export function CityLinks({ sidebar }: { sidebar: SidebarData }) {
  const cities = sidebar.cities.slice(0, 24);
  const mainCategory = sidebar.categories.find((c) => c.code === 'Dog') ?? sidebar.categories[0];
  if (!mainCategory || cities.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <MapPin className="h-5 w-5 text-primary" />
        Şehre Göre İlanlar
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Yakınınızdaki ilanları görün — çoğu görüşme elden teslimle sonuçlanıyor.
      </p>
      <ul className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <li key={city.id}>
            <Link
              href={`/${mainCategory.slug}/${city.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {city.name}
              {city.count > 0 && (
                <span className="text-xs font-semibold text-muted-foreground">{city.count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Güvenlik uyarısı.
 *
 * İncelediğim bütün Türk ilan sitelerinde var ve neredeyse aynı sözlerle:
 * görmeden ödeme yapma, kapora gönderme, buluşmayı halka açık yerde yap.
 * Bu sektörde dolandırıcılığın ana yolu kapora; uyarının görünür olması
 * hem kullanıcıyı koruyor hem platformun sorumluluğunu netleştiriyor.
 */
export function SafetyStrip() {
  const rules = [
    {
      title: 'Görmeden ödeme yapmayın',
      text: 'Kapora, rezervasyon veya kargo bedeli adı altında önceden para isteyen ilanlara itibar etmeyin.',
    },
    {
      title: 'Buluşmayı halka açık yerde yapın',
      text: 'Hayvanı ve varsa belgelerini yerinde görün. Mümkünse yanınızda biri olsun.',
    },
    {
      title: 'Görüşmeyi site üzerinden sürdürün',
      text: 'Sizi aceleye getiren, site dışına yönlendiren taleplere karşı temkinli olun.',
    },
  ];

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="flex items-center gap-2 font-bold text-amber-900">
        <ShieldAlert className="h-5 w-5" />
        Güvenli Alışveriş
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {rules.map((r) => (
          <li key={r.title} className="text-sm">
            <p className="font-semibold text-amber-900">{r.title}</p>
            <p className="mt-0.5 text-amber-800">{r.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-amber-800">
        PetSemti bir yer sağlayıcıdır; doğrudan hayvan satışı yapmaz ve ilanların tarafı
        değildir. Kurallara aykırı bir ilan gördüğünüzde{' '}
        <Link href="/iletisim" className="font-medium underline">
          bize bildirin
        </Link>
        .
      </p>
    </section>
  );
}

/** Arama motorunun indeksleyeceği özgün metin. */
export function HomeSeoCopy() {
  return (
    <section className="space-y-4 rounded-xl border bg-white p-6 text-sm leading-relaxed text-muted-foreground">
      <h2 className="text-lg font-bold text-foreground">PetSemti Nedir?</h2>
      <p>
        PetSemti, evcil hayvan sahiplendirme ve satış ilanlarını, güvercinciliği ve hayvan
        sahiplerinin ihtiyaç duyduğu hizmetleri tek çatı altında toplayan Türkiye geneli bir
        platformdur. İlanlar ırka, ile ve ilçeye göre ayrılmış sayfalarda listelenir; böylece
        aradığınız kedi cinsini kendi şehrinizde doğrudan bulabilirsiniz.
      </p>

      <h3 className="pt-1 text-base font-bold text-foreground">Sahiplendirme mi, satın alma mı?</h3>
      <p>
        Ücretsiz sahiplendirme ilanlarında hayvan için ücret talep edilmez. Barınaklardan ve
        bireysel sahiplerden gelen bu ilanlar, bir dostu yuvasına kavuşturmanın en doğrudan
        yolu. Ücretli ilanlarda ise fiyatı belirleyen başlıca etkenler yaş, şecere kaydı, aşı
        durumu ve yetiştirme koşullarıdır; alışılmışın belirgin şekilde altındaki fiyatlar
        dikkatle değerlendirilmelidir.
      </p>

      <h3 className="pt-1 text-base font-bold text-foreground">Sahiplenmeden önce</h3>
      <p>
        Bir hayvanı üstlenmek uzun süreli bir sorumluluktur: beslenme, düzenli veteriner
        kontrolü, günlük bakım ve tatil dönemlerindeki bakım planı önceden düşünülmelidir.
        Yavru alıyorsanız anneyi görmek hem yaş hem de yetiştirme koşulları hakkında fikir
        verir. Aşı karnesi, varsa şecere belgesi ve sağlık raporunu teslim almadan önce
        isteyin.
      </p>

      <h3 className="pt-1 text-base font-bold text-foreground">Güvercincilik</h3>
      <p>
        Güvercin ilanları kendi bölümünde toplanır. Taklacı, oyun, posta ve yarış, süs ve
        yerli hatlar ayrı ayrı listelenir; bölgesel taklacı ırkları kendi adlarıyla aranabilir.
        Uçuş videosu yükleme imkânı, fotoğrafla anlaşılamayan takla ve uçuş özelliklerinin
        görülmesini sağlar.
      </p>
    </section>
  );
}
