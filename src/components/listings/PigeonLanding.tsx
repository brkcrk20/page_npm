import Link from 'next/link';
import { Film, MapPin, Play, Search, Trophy } from 'lucide-react';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { PigeonBreedSidebar } from '@/components/listings/PigeonBreedSidebar';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { Button } from '@/components/ui/button';
import type { ListingCard } from '@/lib/queries/listings';
import type { Category, SidebarData } from '@/lib/queries/catalog';

/**
 * Güvercin kategorisinin kendine özgü giriş sayfası.
 *
 * Diğer kategorilerden ayrılmasının nedeni içeriğin farklı olması: güvercin
 * alıcısı fotoğrafa değil UÇUŞA bakıyor. Taklacıda takla sayısı, postada
 * yarış derecesi belirleyici; bunların hiçbiri statik fotoğrafla anlatılamıyor.
 * Bu yüzden sayfa videolu ilanları öne çıkarıyor ve ırk seçimini görünür
 * kılıyor — taklacı ırkları bölgesel adlarıyla aranıyor.
 *
 * Veri katmanı diğer kategorilerle ortak; ayrılan tek şey bu ekran.
 */
export function PigeonLanding({
  category,
  sidebar,
  listings,
  withVideo,
  total,
}: {
  category: Category;
  sidebar: SidebarData;
  listings: ListingCard[];
  withVideo: ListingCard[];
  total: number;
}) {
  const pigeonBreeds = sidebar.categories.find((c) => c.id === category.id)?.breeds ?? [];

  // Menüde ırklar grup grup; burada, giriş bölümünün hemen altında yalnızca
  // grupların kendisi duruyor. Elli dokuz ırkı sayfanın üstüne düz bir
  // etiket bulutu olarak dökmek, en çok aranan dalları görünmez kılıyordu.
  /**
   * Irk dizini.
   *
   * Önce her gruptan rastgele dört ırk gösteriliyordu; "16 ırk" yazıp
   * dördünü listelemek yarım kalmış bir kutu görüntüsü veriyordu ve
   * gösterilenlerin neden o dördü olduğu belli değildi. Artık her grubun
   * TÜM ırkları listeleniyor — zaten toplam 59, bir dizin sayfası için
   * fazla değil ve ziyaretçinin aradığını bulmasının en kısa yolu bu.
   */
  const GROUP_NOTES: Record<string, string> = {
    'Taklacı': 'Havada takla atan uçucu ırklar; Türkiye\'de bölge adıyla anılır.',
    'Oyun': 'Uçuş tavrı ve sürüdeki oyunuyla beslenen ırklar.',
    'Posta ve Yarış': 'Uzun mesafe uçuşu için seçilmiş hatlar.',
    'Süs': 'Tüy yapısı ve duruşuyla, görünüş için yetiştirilen ırklar.',
    'Yerli': 'Yerli hatlar ve renk/desen adıyla anılan güvercinler.',
  };

  const groupSummary = ['Taklacı', 'Oyun', 'Posta ve Yarış', 'Süs', 'Yerli']
    .map((group) => {
      const items = pigeonBreeds.filter((b) => b.group === group);
      return {
        group,
        note: GROUP_NOTES[group],
        breedCount: items.length,
        listingCount: items.reduce((sum, b) => sum + b.count, 0),
        breeds: items,
      };
    })
    .filter((g) => g.breedCount > 0);

  return (
    <div className="bg-secondary/30">
      {/* --- Kendine özgü giriş bölümü --- */}
      <section className="border-b bg-gradient-to-br from-slate-800 to-slate-700 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-10">
          <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-white/70">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-white hover:underline">
                  Ana Sayfa
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <span aria-hidden>›</span>
                <span className="text-white">Güvercin İlanları</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold md:text-4xl">Güvercin İlanları</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Taklacıdan postaya, süs güvercininden yarış kuşuna. Kuşun uçuşunu
            videosundan izleyin, halka numarasını ve şeceresini görün, sahibiyle
            doğrudan görüşün.
          </p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Film className="h-4 w-4 text-white/70" />
              Uçuş videolu ilanlar
            </span>
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-white/70" />
              Yarış ve takla dereceleri
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/70" />
              81 ilde ilan
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/ilan-ver">Güvercin İlanı Ver</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="#tum-ilanlar">
                <Search className="mr-2 h-4 w-4" />
                {total} İlanı Gör
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 py-8">
        {/* --- Irk dizini ---
             Ziyaretçinin ilk sorusu "hangi dala bakacağım": taklacı mı,
             posta mı, süs mü. Bu yüzden gruplar başlık, gruplar içindeki
             ırklar da eksiksiz listeleniyor. Daha önce her gruptan yalnızca
             dört ırk gösteriliyordu ve "16 ırk" yazıp dördünü listelemek
             yarım kalmış bir kutu görüntüsü veriyordu. */}
        {groupSummary.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">Güvercin Irkları</h2>
              <p className="text-sm text-muted-foreground">
                {pigeonBreeds.length} ırk, {groupSummary.length} grupta
              </p>
            </div>

            <div className="space-y-3">
              {groupSummary.map((g) => (
                <section
                  key={g.group}
                  className="overflow-hidden rounded-xl border bg-white"
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b bg-secondary/40 px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="font-bold">{g.group}</h3>
                      {g.note && (
                        <p className="text-xs text-muted-foreground">{g.note}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {g.breedCount} ırk
                      {g.listingCount > 0 && ` · ${g.listingCount} ilan`}
                    </span>
                  </header>

                  {/* Irk adları sütunlara akıyor: 16 ırkı tek satırda
                      sıralamak uzun bir etiket bulutuna dönüşüyor, sütun
                      düzeninde göz alfabetik listeyi tarayabiliyor. */}
                  <ul className="columns-2 gap-x-6 p-4 sm:columns-3 lg:columns-4">
                    {g.breeds.map((breed) => (
                      <li key={breed.id} className="mb-1 break-inside-avoid">
                        <Link
                          href={`/${category.slug}/${breed.slug}`}
                          className="group flex items-baseline justify-between gap-2 rounded px-1.5 py-1 text-sm transition-colors hover:bg-secondary"
                        >
                          <span className="min-w-0 truncate group-hover:text-primary">
                            {breed.name}
                          </span>
                          {breed.count > 0 && (
                            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                              {breed.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        )}

        {/* --- Videolu ilanlar --- */}
        {withVideo.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Uçuş Videolu İlanlar</h2>
            </div>
            <ListingGrid listings={withVideo} />
          </section>
        )}

        {/* --- Tüm ilanlar --- */}
        <div id="tum-ilanlar" className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
          {/* Güvercin sayfası kendine yeter: ırk menüsü ve şehir menüsü
              burada. Şehir menüsüne KATEGORİ LİSTESİ VERİLMİYOR
              (categories={[]}) — ziyaretçi zaten güvercinde, köpek ve kedi
              ırklarını burada görmesinin bir anlamı yok. Şehir bağlantıları
              da güvercin kategorisinin altına gidiyor. */}
          <aside className="hidden md:block">
            <div className="sticky top-4 space-y-4">
              <PigeonBreedSidebar
                breeds={pigeonBreeds}
                categorySlug={category.slug}
                categoryName={category.name}
              />
              <CategorySidebar
                categories={[]}
                cities={sidebar.cities}
                cityLinkCategorySlug={category.slug}
              />
            </div>
          </aside>

          <main>
            <h2 className="mb-4 text-xl font-bold">
              Tüm Güvercin İlanları{' '}
              <span className="font-normal text-muted-foreground">({total})</span>
            </h2>
            <ListingGrid
              listings={listings}
              emptyMessage="Şu an yayında güvercin ilanı yok. İlk ilanı sen ver!"
            />
          </main>
        </div>

        {/* --- SEO içeriği ---
             Kategori sayfalarının arama motorunda sıralanması için özgün metin
             gerekiyor; ilan listesi tek başına indekslenecek içerik sayılmıyor. */}
        <section className="mt-12 space-y-4 rounded-xl border bg-white p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground">Güvercin Alırken Nelere Dikkat Edilir?</h2>
          <p>
            Güvercin seçiminde ırk kadar kuşun sağlığı ve geçmişi de belirleyicidir.
            Taklacı bir kuşta takla sayısı ve yüksekliği, posta güvercininde ise
            yarış dereceleri ve şecere kaydı fiyatı doğrudan etkiler. Satın almadan
            önce kuşun uçuşunu videodan izlemek, fotoğrafla anlaşılamayacak birçok
            şeyi gösterir.
          </p>
          <p>
            <strong className="text-foreground">Halka numarası</strong> kuşun kimliğidir;
            doğum yılını ve yetiştiricisini gösterir. Halkası olmayan bir kuşun yaşı ve
            soyu doğrulanamaz. Şecere kaydı olan kuşlarda ana ve baba bilgisi takip
            edilebildiği için özellikle damızlık alımlarında aranır.
          </p>
          <p>
            <strong className="text-foreground">Sağlık kontrolü</strong> için kuşun
            gözleri, burun akıntısı, kanat ve kuyruk tüylerinin durumu ile dışkısı
            incelenmelidir. Solunum sesi temiz olmalı, göğüs eti zayıf olmamalıdır.
            Yeni alınan kuşun mevcut sürüye katılmadan önce bir süre ayrı
            tutulması yaygın bir uygulamadır.
          </p>
          <h3 className="pt-2 text-base font-bold text-foreground">Taklacı Güvercin Nedir?</h3>
          <p>
            Taklacı güvercinler uçuş sırasında havada geriye doğru takla atmalarıyla
            bilinir. Türkiye&apos;de bölgelere göre farklı hatlar gelişmiştir; Adana,
            Mardin, Urfa ve Antep taklacıları uçuş yüksekliği, takla sıklığı ve
            sürüde durma süreleri bakımından birbirinden ayrılır. Bu yüzden ilanlar
            genellikle bölge adıyla aranır.
          </p>
        </section>
      </div>
    </div>
  );
}
