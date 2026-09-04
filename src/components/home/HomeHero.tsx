import Link from 'next/link';
import { Bird, HeartHandshake, PackageSearch, Plus, Search, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Ana sayfa giriş bölümü.
 *
 * Ana sayfa doğrudan ilan listesiyle başlıyordu: ziyaretçi siteye girdiğinde
 * ne olduğunu, ne yapabileceğini ve neden burada olması gerektiğini anlatan
 * hiçbir şey yoktu. İncelediğim emsal ilan sitelerinin tamamında giriş
 * bölümü var ve hepsi aynı üç işi yapıyor: siteyi bir cümlede anlatmak,
 * aramaya başlatmak, ilan vermeye çağırmak.
 *
 * Sayılar veritabanından geliyor. "Binlerce ilan" gibi doğrulanamayan bir
 * iddia yerine ne varsa o yazıyor — site büyüdükçe kendiliğinden büyüyor.
 */
export function HomeHero({
  totalListings,
  cityCount,
  breedCount,
}: {
  totalListings: number;
  cityCount: number;
  breedCount: number;
}) {
  return (
    <section className="border-b bg-gradient-to-br from-primary via-primary to-orange-600 text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
        <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
          Semtinizdeki evcil hayvan ilanları ve pet hizmetleri
        </h1>
        <p className="mt-3 max-w-2xl text-white/90">
          Sahiplendirmeden güvercinciliğe, ikinci el malzemeden veteriner rehberine.
          İlan vermek ücretsiz, sahibiyle doğrudan görüşüyorsunuz.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link href="/ilan-ver">
              <Plus className="mr-1.5 h-4 w-4" />
              Ücretsiz İlan Ver
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/sahiplendirme">
              <Search className="mr-1.5 h-4 w-4" />
              Sahiplendirme İlanları
            </Link>
          </Button>
        </div>

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-white/70">Yayında ilan</dt>
            <dd className="text-xl font-bold">{totalListings}</dd>
          </div>
          <div>
            <dt className="text-white/70">Irk ve tür</dt>
            <dd className="text-xl font-bold">{breedCount}</dd>
          </div>
          <div>
            <dt className="text-white/70">Şehir</dt>
            <dd className="text-xl font-bold">{cityCount}</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-white/15 bg-black/10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-5 md:grid-cols-4">
          <Shortcut href="/sahiplendirme" icon={HeartHandshake} title="Sahiplendirme" text="Yuva arayan dostlar" />
          <Shortcut href="/guvercin-ilanlari" icon={Bird} title="Güvercin" text="59 ırk, uçuş videolu" />
          <Shortcut href="/al-sat" icon={PackageSearch} title="Al & Sat" text="İkinci el malzeme" />
          <Shortcut href="/veteriner" icon={Stethoscope} title="Hizmetler" text="Veteriner, otel, kuaför" />
        </div>
      </div>
    </section>
  );
}

function Shortcut({ href, icon: Icon, title, text }: { href: string; icon: any; title: string; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-2 py-4 transition-colors hover:bg-white/10 md:px-4">
      <Icon className="h-6 w-6 shrink-0 text-white/80" />
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block truncate text-xs text-white/70">{text}</span>
      </span>
    </Link>
  );
}
