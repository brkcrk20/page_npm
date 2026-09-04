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
  stats,
}: {
  stats: { listings_active: number; members: number; online_now: number };
}) {
  return (
    <section className="border-b bg-gradient-to-br from-primary via-primary to-orange-600 text-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 md:py-14">
        <h1 className="max-w-3xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          Semtinizdeki evcil hayvan ilanları ve pet hizmetleri
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm text-white/90 sm:text-base">
          Sahiplendirmeden güvercinciliğe, ikinci el malzemeden veteriner rehberine.
          İlan vermek ücretsiz, sahibiyle doğrudan görüşüyorsunuz.
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg" variant="secondary" className="w-full font-semibold sm:w-auto">
            <Link href="/ilan-ver">
              <Plus className="mr-1.5 h-4 w-4" />
              Ücretsiz İlan Ver
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="/sahiplendirme">
              <Search className="mr-1.5 h-4 w-4" />
              Sahiplendirme İlanları
            </Link>
          </Button>
        </div>

        {/* Bir pazaryerinde anlamlı olan üç sayı: kaç ilan yayında, kaç
            kişi üye, şu an kaç kişi sitede. İlk ikisi büyüklüğü, üçüncüsü
            canlılığı gösteriyor. Önceki "ırk ve tür sayısı" ziyaretçiye
            hiçbir şey anlatmıyordu. */}
        <dl className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-white/70">Yayındaki ilan</dt>
            <dd className="text-2xl font-bold leading-none">{stats.listings_active}</dd>
          </div>
          <div>
            <dt className="text-white/70">Üye</dt>
            <dd className="text-2xl font-bold leading-none">{stats.members}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-white/70">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Şu an sitede
            </dt>
            <dd className="text-2xl font-bold leading-none">{stats.online_now}</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-white/15 bg-black/10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-2 px-5 md:grid-cols-4">
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
    <Link href={href} className="flex items-center gap-2.5 rounded-lg px-2 py-3.5 transition-colors hover:bg-white/10 md:gap-3 md:px-4 md:py-4">
      <Icon className="h-5 w-5 shrink-0 text-white/80 md:h-6 md:w-6" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold md:text-base">{title}</span>
        <span className="block truncate text-[11px] text-white/70 md:text-xs">{text}</span>
      </span>
    </Link>
  );
}
