'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, Package, PawPrint, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { oneriUret, type AramaOnerisi } from '@/lib/akilli-arama';
import {
  staticCategories,
  staticBreeds,
  staticCities,
  staticDistrictsFor,
} from '@/lib/static-catalog';

/**
 * Başlıktaki arama çubuğu.
 *
 * Kategori, cins ve il listeleri referans tablolarından geliyor — ilanlardan
 * türetilmiyor, böylece henüz ilan yokken de dolu görünüyorlar.
 *
 * Arama, kategori seçiliyse o kategorinin sayfasına, değilse ana sayfaya
 * yönlendiriyor; böylece URL'ler site yapısıyla tutarlı kalıyor.
 */

type Option = { id: number; name: string; slug: string };
type Breed = Option & { category_id: number };

const ALL = 'all';

/**
 * useSearchParams() bir Suspense sınırı gerektiriyor; olmadan bu bileşeni
 * içeren HER sayfa (Header'da olduğu için 404 dahil) prerender sırasında
 * patlıyor. Sınırı bileşenin kendi içine koyuyoruz ki her kullanıcısı
 * ayrı ayrı sarmalamak zorunda kalmasın.
 */
/**
 * @param mod
 *  'tam'    — arama kutusu + süzgeçler (mobil satırı)
 *  'sade'   — yalnızca arama kutusu (üst bant)
 *  'suzgec' — yalnızca süzgeçler (geniş ekranda ikinci satır)
 *
 * Üst bandın dar olması yüzünden bölündü: dört açılır liste ve "Bul"
 * düğmesi logoyla zilin arasına sığmıyor, sığdırılınca da hepsi bir avuç
 * beyaz kutuya dönüşüyordu. Arama yukarı çıktı, süzgeçler yerinde kaldı.
 */
export function SearchFilters({ mod = 'tam' }: { mod?: 'tam' | 'sade' | 'suzgec' }) {
  return (
    <Suspense fallback={<SearchFiltersSkeleton />}>
      <SearchFiltersInner mod={mod} />
    </Suspense>
  );
}

function SearchFiltersSkeleton() {
  return <div className="h-11 w-full animate-pulse rounded-md bg-white/20" />;
}

/** Kendi dikeyi olan kategoriler; genel tür listesinde görünmezler. */
const PIGEON_SLUG = 'guvercin-ilanlari';
const SUPPLY_SLUG = 'pet-malzemeleri';
const OWN_SECTION_SLUGS = [PIGEON_SLUG, SUPPLY_SLUG];

function SearchFiltersInner({ mod }: { mod: 'tam' | 'sade' | 'suzgec' }) {
  const router = useRouter();
  /** Öneri listesi yalnızca kutu odaktayken açık. */
  const [odakli, setOdakli] = useState(false);
  /** Klavyeyle gezinen satır; -1 = hiçbiri. */
  const [vurgulu, setVurgulu] = useState(-1);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  /**
   * Güvercin bölümünde miyiz?
   *
   * Güvercin ayrı bir dikey: kendi ırk sınıflandırması ve kendi sayfaları
   * var. Bu filtre çubuğu her sayfada aynı listeyi gösteriyordu, yani
   * güvercin sayfasında köpek ve kedi türleri, sahiplendirme sayfasında da
   * güvercin görünüyordu. İkisi de yanlış.
   *
   * Güvercin bölümünde tür seçici hiç gösterilmiyor (zaten güvercindesiniz)
   * ve cins listesi güvercin ırklarına kilitleniyor. Diğer sayfalarda ise
   * güvercin tür listesinden çıkarılıyor.
   */
  const inPigeonSection = pathname === `/${PIGEON_SLUG}` || pathname.startsWith(`/${PIGEON_SLUG}/`);

  /**
   * Malzeme bölümü: /al-sat ve /pet-malzemeleri.
   *
   * Burada satılan hayvan değil eşya; tür ve ırk seçicilerinin ikisi de
   * anlamsız. Yerlerini eşya türü listesi alıyor ve o listeyi sayfanın
   * kendisi gösteriyor.
   */
  const inSupplySection =
    pathname === '/al-sat' ||
    pathname === `/${SUPPLY_SLUG}` ||
    pathname.startsWith(`/${SUPPLY_SLUG}/`);

  // Statik yedekle başlıyoruz: veritabanına ulaşılamasa bile (ortam değişkeni
  // eksik, geçici kesinti) açılır listeler dolu gelir. Veritabanı erişilebilirse
  // aşağıdaki effect gelen veriyle üzerine yazar.
  const [categories, setCategories] = useState<Option[]>(staticCategories);
  const [breeds, setBreeds] = useState<Breed[]>(staticBreeds);
  const [cities, setCities] = useState<Option[]>(staticCities);
  const [districts, setDistricts] = useState<Option[]>([]);

  const [term, setTerm] = useState(searchParams.get('q') ?? '');
  /**
   * Kategori sayfasındaysak tür kendiliğinden seçili başlıyor.
   *
   * Köpek ilanları sayfasındaki kullanıcıya "önce tür seçin" demek, zaten
   * verdiği kararı tekrar sormak olurdu. Adresin ilk parçası kategori
   * adresiyse onu alıyoruz; değilse boş kalıyor.
   */
  const [categorySlug, setCategorySlug] = useState(() => {
    const ilk = pathname.split('/').filter(Boolean)[0];
    return ilk && ilk.endsWith('-ilanlari') ? ilk : ALL;
  });
  const [breedSlug, setBreedSlug] = useState(ALL);
  const [citySlug, setCitySlug] = useState(ALL);
  const [districtSlug, setDistrictSlug] = useState(ALL);
  /** Malzeme bölümünde seçilen hayvan türü (grup adı). */
  const [supplyGroup, setSupplyGroup] = useState(ALL);

  /**
   * Mobilde süzgeçler katlı başlıyor.
   *
   * Dört açılır liste ve "Bul" düğmesi alt alta dizilince telefon
   * ekranının yarısını kaplıyor ve ana içeriği 450 piksel aşağı itiyordu.
   * Masaüstünde hepsi tek satıra sığdığı için orada katlama yok.
   */
  const [filtrelerAcik, setFiltrelerAcik] = useState(false);

  /**
   * Katalog tazelemesi ilk etkileşime kadar bekliyor.
   *
   * Bu üç sorgu her sayfa açılışında, hemen mount anında çalışıyordu:
   * kategoriler, 209 ırk ve 81 il. Sunucusu Singapur'da olan bir
   * veritabanına üç tur ve ardından ~300 satırlık JSON'un ayrıştırılması —
   * hepsi kullanıcı henüz süzgeçlere dokunmadan, ilk boyamanın önünde.
   * Ziyaretlerin çoğunda bu listelere hiç bakılmıyor bile.
   *
   * Açılır listeler zaten statik katalogla dolu geliyor (yukarıdaki
   * başlangıç durumu), yani gecikme kullanıcıya boş liste göstermiyor.
   * Tazeleme, kullanıcı çubuğa ilk kez dokunduğunda bir kez çalışıyor:
   * veritabanına yeni eklenmiş bir ırk yine görünüyor, ama artık kritik
   * yolun dışında.
   */
  const katalogIstendi = useRef(false);

  const katalogTazele = useCallback(() => {
    if (katalogIstendi.current) return;
    katalogIstendi.current = true;

    (async () => {
      // Dinamik: süzgeç çubuğu başlıkta, yani her sayfada. Yukarıdan içe
      // aktarıldığında Supabase paketi hiç süzgece dokunmayan ziyaretçiye
      // de iniyordu.
      const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClientOrNull();
      if (!supabase) return;

      const [cats, brs, cits] = await Promise.all([
        supabase.from('categories').select('id, name, slug').eq('is_active', true).order('position'),
        supabase.from('breeds').select('id, name, slug, category_id, group_name').eq('is_active', true).order('position'),
        supabase.from('cities').select('id, name, slug').order('name'),
      ]);
      // Boş sonuç gelirse yedeği koruyoruz; boş listeyle değiştirmek
      // kullanıcıya daha kötü bir deneyim verirdi.
      if (cats.data?.length) setCategories(cats.data as Option[]);
      if (brs.data?.length) setBreeds(brs.data as Breed[]);
      if (cits.data?.length) setCities(cits.data as Option[]);
    })();
  }, []);

  const selectedCity = useMemo(
    () => cities.find((c) => c.slug === citySlug),
    [cities, citySlug]
  );

  useEffect(() => {
    setDistrictSlug(ALL);

    if (!selectedCity) {
      setDistricts([]);
      return;
    }

    // Önce yedekten doldur, sonra veritabanı cevap verirse tazele.
    setDistricts(staticDistrictsFor(selectedCity.slug));

    let active = true;
    (async () => {
      const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClientOrNull();
      if (!supabase) return;

      const { data } = await supabase
        .from('districts')
        .select('id, name, slug')
        .eq('city_id', selectedCity.id)
        .order('name');

      // Şehir bu arada değiştiyse eski cevabı yazmıyoruz.
      if (active && data?.length) setDistricts(data as Option[]);
    })();

    return () => {
      active = false;
    };
  }, [selectedCity]);

  const pigeonCategory = useMemo(
    () => categories.find((c) => c.slug === PIGEON_SLUG),
    [categories]
  );

  const supplyCategory = useMemo(
    () => categories.find((c) => c.slug === SUPPLY_SLUG),
    [categories]
  );

  /** Genel tür listesi: kendi dikeyi olan kategoriler burada görünmez. */
  const visibleCategories = useMemo(
    () => categories.filter((c) => !OWN_SECTION_SLUGS.includes(c.slug)),
    [categories]
  );

  /**
   * Malzeme bölümünde iki kademeli filtre.
   *
   * Önce hayvan türü (Kedi, Köpek, Kuş...), sonra o türe ait eşya. Tek düz
   * listede kedi sahibi köpek kulübesiyle oto koltuk örtüsünün arasında
   * geziniyordu; kimse malzemeyi böyle aramıyor.
   *
   * Gruplar breeds.group_name'den geliyor, ayrı bir tablo yok: eşya türü
   * zaten alt tür kaydı, grubu da onun bir alanı.
   */
  const supplyGroups = useMemo(() => {
    if (!supplyCategory) return [] as { id: number; name: string; slug: string }[];
    const seen = new Map<string, number>();
    for (const b of breeds) {
      if (b.category_id !== supplyCategory.id) continue;
      const g = (b as { group_name?: string | null }).group_name;
      if (g && !seen.has(g)) seen.set(g, seen.size + 1);
    }
    // Sıra veritabanındaki position sırasıyla geliyor; "Tüm Hayvanlar" sona.
    const list = [...seen.keys()].map((g, i) => ({ id: i + 1, name: g, slug: g }));
    return list.sort((a, b) =>
      a.name === 'Tüm Hayvanlar' ? 1 : b.name === 'Tüm Hayvanlar' ? -1 : 0
    );
  }, [breeds, supplyCategory]);

  const filteredBreeds = useMemo(() => {
    // Güvercin bölümünde cins listesi güvercin ırklarına kilitli.
    if (inPigeonSection) {
      return pigeonCategory ? breeds.filter((b) => b.category_id === pigeonCategory.id) : breeds;
    }
    // Malzeme bölümünde eşya türlerine kilitli; tür seçildiyse o gruba.
    if (inSupplySection) {
      if (!supplyCategory) return [];
      const all = breeds.filter((b) => b.category_id === supplyCategory.id);
      if (supplyGroup === ALL) return all;
      return all.filter(
        (b) => (b as { group_name?: string | null }).group_name === supplyGroup
      );
    }

    // Diğer yerlerde kendi dikeyi olan kategorilerin alt türleri görünmez.
    const ownIds = [pigeonCategory?.id, supplyCategory?.id].filter(Boolean) as number[];
    const animalsOnly = breeds.filter((b) => !ownIds.includes(b.category_id));

    /**
     * Tür seçilmeden cins listesi gösterilmiyor.
     *
     * Seçilmediğinde 161 cins tek listede sıralanıyordu: kullanıcı köpek
     * ararken kedi ırklarını, kuş ararken köpek ırklarını görüyordu. Cins,
     * ancak türe bağlıyken anlamlı bir seçim.
     */
    if (categorySlug === ALL) return [];
    const category = categories.find((c) => c.slug === categorySlug);
    return category ? animalsOnly.filter((b) => b.category_id === category.id) : animalsOnly;
  }, [breeds, categories, categorySlug, inPigeonSection, inSupplySection, pigeonCategory, supplyCategory, supplyGroup]);

  /** Cins seçilebilir mi: kendi dikeyindeyiz ya da tür seçilmiş. */
  const cinsSecilebilir = inPigeonSection || inSupplySection || categorySlug !== ALL;

  /**
   * Yazılan metnin anlaşılmış hâli.
   *
   * Kullanıcı "denizli golden retriever" yazdığında aradığı şey bir metin
   * değil bir sayfa. Öneriler tarayıcıda üretiliyor; şehir, ilçe, cins ve
   * tür listeleri zaten paketin içinde, sunucuya gitmeye gerek yok.
   */
  const oneriler = useMemo(() => (odakli ? oneriUret(term) : []), [term, odakli]);

  function oneriyeGit(oneri: AramaOnerisi) {
    setOdakli(false);
    setVurgulu(-1);
    router.push(oneri.href);
  }

  function handleSearch() {
    /**
     * Metin yazılmışsa Enter öneriye gidiyor.
     *
     * Eskiden yazılan metin, seçili kategorinin adresine `?q=` diye
     * ekleniyordu — ama liste sayfaları `q` parametresini hiç okumuyor.
     * Yani kategori sayfasındayken arama kutusuna bir şey yazıp Enter'a
     * basmak HİÇBİR ŞEY yapmıyordu: adres değişiyor, sonuç aynı kalıyordu.
     *
     * Artık anlaşılan en iyi sayfaya gidiliyor. Hiçbir şey anlaşılmadıysa
     * listenin en altındaki düz metin araması zaten tek seçenek olarak ilk
     * sıraya çıkıyor. Aşağıdaki açılır liste yolu yalnızca metin
     * yazılmadığında, yani salt süzgeçle gezinirken çalışıyor.
     */
    if (term.trim() && oneriler.length > 0) {
      oneriyeGit(oneriler[vurgulu >= 0 ? vurgulu : 0]);
      return;
    }

    // Kategori seçiliyse yapısal URL'e git: /kopek-ilanlari/toy-poodle gibi.
    // Bu adresler hem SEO'da hem paylaşımda anlamlı; ana sayfaya sorgu
    // parametresiyle gitmek ikisini de kaybettiriyordu.
    if (categorySlug !== ALL) {
      const segments = [categorySlug];
      if (breedSlug !== ALL) segments.push(breedSlug);
      else if (citySlug !== ALL) {
        segments.push(citySlug);
        if (districtSlug !== ALL) segments.push(districtSlug);
      }
      const query = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : '';
      router.push(`/${segments.join('/')}${query}`);
      return;
    }

    // Güvercin bölümünde tür seçilemiyor; arama yine de güvercin
    // kategorisinde kalmalı, ana sayfaya düşmemeli.
    if (inPigeonSection || inSupplySection) {
      const segments = [inPigeonSection ? PIGEON_SLUG : SUPPLY_SLUG];
      if (breedSlug !== ALL) segments.push(breedSlug);
      else if (citySlug !== ALL) {
        segments.push(citySlug);
        if (districtSlug !== ALL) segments.push(districtSlug);
      }
      const q = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : '';
      router.push(`/${segments.join('/')}${q}`);
      return;
    }

    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (citySlug !== ALL) params.set('city', citySlug);
    if (districtSlug !== ALL) params.set('district', districtSlug);
    // Arama kendi sayfasına gidiyor. Daha önce ana sayfaya `?q=` ile
    // gönderiliyordu ve ana sayfa bu parametreyi hiç okumuyordu: kullanıcı
    // arama yapıyor, tüm ilanları görüyordu.
    const query = params.toString();
    router.push(query ? `/arama?${query}` : '/');
  }

  return (
    // Katalog tazelemesi buradan tetikleniyor: kullanıcı çubuğa dokunduğu
    // ya da klavyeyle geldiği anda, sayfa açılışında değil.
    <div
      onPointerDown={katalogTazele}
      onFocusCapture={katalogTazele}
      className={
        mod === 'sade'
          ? 'w-full'
          : 'grid w-full grid-cols-1 gap-2 ' +
            (mod === 'suzgec'
              ? inPigeonSection
                ? 'md:grid-cols-[auto_auto_auto_auto]'
                : 'md:grid-cols-[auto_auto_auto_auto_auto]'
              : inPigeonSection
                ? 'md:grid-cols-[1fr_auto_auto_auto_auto]'
                : 'md:grid-cols-[1fr_auto_auto_auto_auto_auto]')
      }
    >
      {mod !== 'suzgec' && (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setVurgulu(-1);
            }}
            onFocus={() => setOdakli(true)}
            // Tıklama önerinin üstüne düşmeden liste kapanmasın; blur
            // click'ten önce geliyor.
            onBlur={() => setTimeout(() => setOdakli(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
                return;
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setVurgulu((v) => Math.min(v + 1, oneriler.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setVurgulu((v) => Math.max(v - 1, -1));
              }
              if (e.key === 'Escape') setOdakli(false);
            }}
            placeholder="Ne arıyorsun? (ör. denizli golden retriever)"
            className="h-11 pl-9"
            role="combobox"
            aria-expanded={oneriler.length > 0}
            aria-autocomplete="list"
          />

          {oneriler.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border bg-white shadow-lg">
              {oneriler.map((oneri, i) => (
                <li key={oneri.href}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => oneriyeGit(oneri)}
                    onMouseEnter={() => setVurgulu(i)}
                    className={
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ' +
                      (i === vurgulu ? 'bg-secondary' : 'hover:bg-secondary/60')
                    }
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {oneri.tip === 'hizmet' ? (
                        <Building2 className="h-4 w-4" />
                      ) : oneri.tip === 'urun' ? (
                        <Package className="h-4 w-4" />
                      ) : oneri.tip === 'metin' ? (
                        <Search className="h-4 w-4" />
                      ) : (
                        <PawPrint className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {oneri.baslik}
                      </span>
                      {oneri.aciklama && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {oneri.aciklama}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Yalnızca mobilde: süzgeçleri aç/kapat ve ara. Masaüstünde
            süzgeçler zaten açık ve "Bul" satırın sonunda. */}
        {mod === 'tam' && (
        <button
          type="button"
          onClick={() => setFiltrelerAcik((v) => !v)}
          aria-expanded={filtrelerAcik}
          aria-label="Filtreleri göster"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-md border bg-white px-3 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtre
        </button>
        )}
        {mod === 'tam' && (
          <Button className="h-11 shrink-0 px-5 md:hidden" onClick={handleSearch}>
            Bul
          </Button>
        )}
      </div>
      )}

      {/* Süzgeç grubu: mobilde katlı, masaüstünde her zaman açık. */}
      {mod !== 'sade' && (
      <div
        className={
          'contents ' + (mod === 'suzgec' || filtrelerAcik ? '' : 'max-md:hidden')
        }
      >

      {/* Güvercin bölümünde tür seçici yok: ziyaretçi zaten güvercinde ve
          oradan köpek/kedi türüne geçmek filtre değil, başka bir bölüme
          atlamak olurdu — o iş üstteki kategori şeridinin. */}
      {/* Malzeme bölümünde tür = hayvan (kedi, köpek...); eşya listesi buna
          göre daralıyor. */}
      {inSupplySection && (
        <FilterSelect
          value={supplyGroup}
          onChange={(v) => {
            setSupplyGroup(v);
            setBreedSlug(ALL);
          }}
          placeholder="Tüm Türler"
          allLabel="Tüm Türler"
          searchPlaceholder="Tür ara..."
          options={supplyGroups}
        />
      )}

      {!inPigeonSection && !inSupplySection && (
        <FilterSelect
          value={categorySlug}
          onChange={(v) => {
            setCategorySlug(v);
            setBreedSlug(ALL);
          }}
          placeholder="Tüm Türler"
          allLabel="Tüm Türler"
          searchPlaceholder="Tür ara..."
          options={visibleCategories}
        />
      )}

      <FilterSelect
        value={breedSlug}
        onChange={setBreedSlug}
        placeholder={
          inPigeonSection
            ? 'Tüm Güvercin Irkları'
            : inSupplySection
              ? 'Tüm Eşyalar'
              : cinsSecilebilir
                ? 'Tüm Cinsler'
                : 'Önce tür seçin'
        }
        allLabel={
          inPigeonSection
            ? 'Tüm Güvercin Irkları'
            : inSupplySection
              ? 'Tüm Eşyalar'
              : cinsSecilebilir
                ? 'Tüm Cinsler'
                : 'Önce tür seçin'
        }
        searchPlaceholder={inPigeonSection ? 'Irk ara...' : inSupplySection ? 'Eşya ara...' : 'Cins ara...'}
        options={filteredBreeds}
        disabled={!cinsSecilebilir}
      />

      <FilterSelect
        value={citySlug}
        onChange={setCitySlug}
        placeholder="İl Seçiniz"
        allLabel="Tüm Şehirler"
        searchPlaceholder="İl ara..."
        options={cities}
      />

      <FilterSelect
        value={districtSlug}
        onChange={setDistrictSlug}
        placeholder="İlçe Seçiniz"
        allLabel="Tüm İlçeler"
        searchPlaceholder="İlçe ara..."
        options={districts}
        disabled={districts.length === 0}
      />

      </div>
      )}

      {mod !== 'sade' && (
        <Button className="hidden h-11 px-8 md:inline-flex" onClick={handleSearch}>
          Bul
        </Button>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  allLabel,
  searchPlaceholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  allLabel: string;
  searchPlaceholder: string;
  options: Option[];
  disabled?: boolean;
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      disabled={disabled}
      className="md:w-44"
      ariaLabel={placeholder}
      options={[
        { value: ALL, label: allLabel },
        ...options.map((option) => ({ value: option.slug, label: option.name })),
      ]}
    />
  );
}
