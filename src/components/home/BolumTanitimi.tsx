import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Ana sayfada bölüm tanıtımı.
 *
 * NEDEN
 * Sitenin ilan dışındaki bölümleri (hizmet rehberi, kayıp & bulundu,
 * güvercin dikeyi, rehber yazıları) yalnızca üstteki ikon şeridinden
 * bulunabiliyordu. Şerit dar ve etiketleri iki kelimelik; bir bölümün ne
 * işe yaradığı hiçbir yerde yazmıyordu.
 *
 * Burası hem yeni gelen ziyaretçiye siteyi anlatıyor hem de o sayfalara
 * ana sayfadan gerçek metin bağlantısı veriyor — daha önce yalnızca ikon
 * bağlantısı vardı.
 *
 * Listelerin ALTINDA duruyor: ziyaretçi önce ilanları görmeli, tanıtım
 * metnini değil.
 */

const BOLUMLER: { baslik: string; metin: string; href: string; bag: string }[] = [
  {
    baslik: 'Sahiplendirme',
    metin:
      'Yuva arayan kedi, köpek, kuş ve diğer canlar. İlan vermek de sahiplenmek de ücretsiz; ilan sahibiyle doğrudan yazışıyorsunuz.',
    href: '/sahiplendirme',
    bag: 'Sahiplendirme ilanlarına göz at',
  },
  {
    baslik: 'Kayıp & Bulundu',
    metin:
      'Kaybolan dostunuzu semtinizde duyurun ya da bulduğunuz bir hayvanı sahibine ulaştırın. İlanlar il ve ilçeye göre süzülüyor.',
    href: '/kayip',
    bag: 'Kayıp ve bulunan hayvanlar',
  },
  {
    baslik: 'Pet Hizmetleri',
    metin:
      'Veteriner, pet oteli, kuaför, pet taksi, eğitmen, gezdirici ve petshop rehberi. Adres, telefon, çalışma saatleri ve verdikleri hizmetler bir arada.',
    href: '/veteriner',
    bag: 'Hizmet rehberini aç',
  },
  {
    baslik: 'Güvercin',
    metin:
      'Güvercin kendi bölümünde: ırk ayrımı, videolu ilanlar ve güvercin malzemeleri. Kedi köpek ilanlarının arasında kaybolmuyor.',
    href: '/guvercin-ilanlari',
    bag: 'Güvercin ilanları',
  },
  {
    baslik: 'Pet Malzemeleri',
    metin:
      'İkinci el ve sıfır kafes, akvaryum, taşıma çantası, tasma ve bakım ürünleri. Elden teslim için şehir süzgeci var.',
    href: '/pet-malzemeleri',
    bag: 'Malzeme ilanları',
  },
  {
    baslik: 'Rehber',
    metin:
      'Aşı takvimi, ırk bakımı, sahiplenme öncesi bilinmesi gerekenler ve kayıp hayvan aramanın yolları. Veteriner hekim kaynaklarına dayanan yazılar.',
    href: '/rehber',
    bag: 'Rehber yazıları',
  },
];

export function BolumTanitimi() {
  return (
    <section className="rounded-xl border bg-white p-5 md:p-6">
      <h2 className="text-xl font-bold md:text-2xl">PetSemti&apos;de neler var?</h2>
      <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
        PetSemti; evcil hayvan ilanları, yerel pet hizmetleri ve güvercin dünyasını tek
        yerde toplayan bir platform. Türkiye&apos;nin 81 ilinden ilan verebilir, semtinizdeki
        hizmetleri bulabilirsiniz.
      </p>

      <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {BOLUMLER.map((b) => (
          <div key={b.href}>
            <h3 className="font-semibold">{b.baslik}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.metin}</p>
            <Link
              href={b.href}
              className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              prefetch={false}
            >
              {b.bag}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
