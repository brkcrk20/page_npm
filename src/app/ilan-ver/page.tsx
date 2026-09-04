import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bird, Building2, HeartHandshake, PackageSearch } from 'lucide-react';

import { SERVICE_CONFIGS } from '@/lib/services-config';

export const metadata: Metadata = {
  title: 'İlan Ver',
  description:
    'Sahiplendirme, güvercin, ikinci el pet malzemesi ilanı verin ya da işletmenizi hizmet rehberine ekleyin.',
  robots: { index: false, follow: true },
};

/**
 * İlan verme başlangıcı.
 *
 * Burada tek bir form vardı ve kategori seçtiriyordu. Her bölümün kendi
 * kuralları olduğu için (güvercinde ırk, malzemede ürün durumu,
 * sahiplendirmede fiyatsızlık, hizmette kurumsal hesap zorunluluğu) tek
 * form hepsini birden karşılamaya çalışıyordu; sonuç, kullanıcının işiyle
 * ilgisi olmayan alanlarla dolu bir ekrandı.
 *
 * Artık burası yalnızca yönlendirme yapıyor: ne vereceğini seç, o bölümün
 * kendi formuna git.
 */

const OPTIONS = [
  {
    href: '/ilan-ver/sahiplendirme',
    icon: HeartHandshake,
    title: 'Ücretsiz Sahiplendirme',
    text: 'Yuva arayan kedi, köpek, kuş veya diğer dostunuz için ilan verin. Ücret talep edilmez.',
  },
  {
    href: '/ilan-ver/guvercin',
    icon: Bird,
    title: 'Güvercin İlanı',
    text: 'Taklacı, posta, süs veya yerli güvercin. Uçuş videosu, halka numarası ve şecere bilgisiyle.',
  },
  {
    href: '/ilan-ver/al-sat',
    icon: PackageSearch,
    title: 'İkinci El Pet Malzemesi',
    text: 'Kullanmadığınız kafes, akvaryum, taşıma çantası ve diğer malzemeleri satışa çıkarın.',
  },
];

export default function Page() {
  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold md:text-3xl">Ne vermek istiyorsunuz?</h1>
        <p className="mt-1 text-muted-foreground">
          İlan vermek ücretsizdir. Bölümü seçin, size yalnızca o bölümle ilgili sorular
          sorulsun.
        </p>

        <ul className="mt-6 space-y-3">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <li key={o.href}>
                <Link
                  href={o.href}
                  className="flex items-center gap-4 rounded-xl border bg-white p-5 transition-colors hover:border-primary"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{o.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{o.text}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* İşletme kaydı ilan değil: kurumsal hesap gerektiriyor ve
            yayınlanmadan önce inceleniyor. Bu yüzden ayrı bir blokta. */}
        <section className="mt-8 rounded-xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            İşletmenizi eklemek mi istiyorsunuz?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Veteriner kliniği, pet oteli, kuaför, eğitmen, petshop, pet taksi veya
            gezdirici hizmeti veriyorsanız işletmenizi rehbere ekleyin. Kurumsal hesap
            gerekir; kayıtlar yayına alınmadan önce incelenir.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SERVICE_CONFIGS.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/${s.slug}/kayit`}
                  className="inline-block rounded-full border bg-secondary/40 px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
