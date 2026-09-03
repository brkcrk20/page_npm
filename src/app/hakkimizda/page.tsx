import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Film, HeartHandshake, MapPin, ShieldCheck, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSiteContact } from '@/lib/queries/site-settings';
import { SERVICE_CONFIGS } from '@/lib/services-config';

export const metadata: Metadata = {
  title: 'Hakkımızda | PetSemti',
  description:
    'PetSemti; sahiplendirme, güvercin, veteriner, pet oteli ve diğer evcil hayvan hizmetlerini tek çatı altında toplayan Türkiye geneli ilan ve rehber platformudur.',
};

/**
 * Hakkımızda.
 *
 * Metin sitenin GERÇEKTEN yaptığı işi anlatıyor — kaç kategori, kaç ırk, kaç
 * il, hangi hizmet rehberleri. Bunlar uydurma değil, uygulamadaki yapıdan
 * geliyor. Doğrulanamayan iddialar (kullanıcı sayısı, "Türkiye'nin en
 * büyüğü" gibi) bilerek yok.
 */
export default async function Page() {
  const contact = await getSiteContact();

  return (
    <div className="bg-secondary/30">
      <section className="border-b bg-gradient-to-br from-primary/90 to-primary text-white">
        <div className="mx-auto w-full max-w-4xl px-5 py-12">
          <h1 className="text-3xl font-bold md:text-4xl">Hakkımızda</h1>
          <p className="mt-3 max-w-2xl text-white/90">
            PetSemti, evcil hayvan sahiplendirme ve satış ilanlarını, güvercinciliği ve
            hayvan sahiplerinin ihtiyaç duyduğu hizmet rehberlerini tek bir yerde toplayan
            Türkiye geneli bir platformdur.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Ne yapıyoruz</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Evcil hayvan arayan biri, aradığını bulmak için genellikle birkaç farklı yere
            bakmak zorunda kalıyor: ilan siteleri, sosyal medya grupları, forumlar. Sahip
            olduktan sonra ise veteriner, otel, kuaför, eğitmen ararken aynı dağınıklıkla
            karşılaşıyor. PetSemti bu iki ihtiyacı aynı çatı altında karşılıyor.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            İlan vermek ücretsizdir. İlanlar cinse, şehre ve ilçeye göre ayrılmış
            sayfalarda listelenir; böylece “İstanbul Kadıköy’de British Shorthair” gibi
            aramalar doğrudan ilgili sayfaya düşer.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Feature
            icon={HeartHandshake}
            title="Sahiplendirme ve satış"
            text="Köpek, kedi, kuş, akvaryum ve diğer evcil hayvanlar. Yüzlerce ırk, ırk bazında ayrı sayfalar."
          />
          <Feature
            icon={Film}
            title="Güvercinciliğe özel bölüm"
            text="59 güvercin ırkı; taklacı, oyun, posta ve yarış, süs ve yerli hatlar ayrı ayrı. Uçuş videosu yüklenebiliyor — takla ve uçuş fotoğrafla anlatılamıyor."
          />
          <Feature
            icon={Stethoscope}
            title="Hizmet rehberleri"
            text={`${SERVICE_CONFIGS.length} ayrı rehber: ${SERVICE_CONFIGS.map((s) => s.label).join(', ')}. Kayıtlar yalnızca kurumsal hesaplarla açılır ve yayına alınmadan önce incelenir.`}
          />
          <Feature
            icon={MapPin}
            title="81 il, 973 ilçe"
            text="Her il ve ilçe için ayrı liste. Yakınınızdaki ilana ve işletmeye doğrudan ulaşabilirsiniz."
          />
        </section>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Sorumluluğumuzun sınırı
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            PetSemti bir <strong>yer sağlayıcıdır</strong>. Doğrudan hayvan alım satımı
            yapmaz, ilanların tarafı değildir. İlan içeriklerinin doğruluğu ilan sahibinin
            sorumluluğundadır. Kural ihlali bildirilen ilanlar incelenir ve gerekirse
            yayından kaldırılır.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Hayvanların korunmasına ilişkin mevzuata aykırı ilanlar, yabani ve koruma
            altındaki türlere ait ilanlar ve hayvana kötü muameleyi içeren içerikler kabul
            edilmez.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/kullanim-sartlari">Kullanım Şartları</Link>
          </Button>
        </section>

        {(contact.legal_name || contact.address || contact.mersis) && (
          <section className="rounded-xl border bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              Künye
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              {contact.legal_name && <Row label="Unvan" value={contact.legal_name} />}
              {contact.address && <Row label="Adres" value={contact.address} />}
              {contact.mersis && <Row label="MERSİS No" value={contact.mersis} />}
              {contact.email && <Row label="E-posta" value={contact.email} />}
              {contact.phone && <Row label="Telefon" value={contact.phone} />}
            </dl>
          </section>
        )}

        <section className="rounded-xl border bg-white p-6 text-center">
          <h2 className="text-lg font-bold">İlanınızı ücretsiz yayınlayın</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Üyelik ve ilan vermek ücretsiz.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/ilan-ver">Ücretsiz İlan Ver</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/iletisim">İletişim</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-2 font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 border-b pb-1.5 last:border-b-0">
      <dt className="min-w-24 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
