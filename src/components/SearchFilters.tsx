'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';
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
export function SearchFilters() {
  return (
    <Suspense fallback={<SearchFiltersSkeleton />}>
      <SearchFiltersInner />
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

function SearchFiltersInner() {
  const router = useRouter();
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
  const [categorySlug, setCategorySlug] = useState(ALL);
  const [breedSlug, setBreedSlug] = useState(ALL);
  const [citySlug, setCitySlug] = useState(ALL);
  const [districtSlug, setDistrictSlug] = useState(ALL);
  /** Malzeme bölümünde seçilen hayvan türü (grup adı). */
  const [supplyGroup, setSupplyGroup] = useState(ALL);

  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    (async () => {
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

    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    supabase
      .from('districts')
      .select('id, name, slug')
      .eq('city_id', selectedCity.id)
      .order('name')
      .then(({ data }) => {
        if (data?.length) setDistricts(data as Option[]);
      });
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

    if (categorySlug === ALL) return animalsOnly;
    const category = categories.find((c) => c.slug === categorySlug);
    return category ? animalsOnly.filter((b) => b.category_id === category.id) : animalsOnly;
  }, [breeds, categories, categorySlug, inPigeonSection, inSupplySection, pigeonCategory, supplyCategory, supplyGroup]);

  function handleSearch() {
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
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
  }

  return (
    <div
      className={
        'grid w-full grid-cols-1 gap-2 ' +
        (inPigeonSection
          ? 'md:grid-cols-[1fr_auto_auto_auto_auto]'
          : 'md:grid-cols-[1fr_auto_auto_auto_auto_auto]')
      }
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ne arıyorsun? (ilan no, başlık...)"
          className="h-11 pl-9"
        />
      </div>

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
        placeholder={inPigeonSection ? 'Tüm Güvercin Irkları' : inSupplySection ? 'Tüm Eşyalar' : 'Tüm Cinsler'}
        allLabel={inPigeonSection ? 'Tüm Güvercin Irkları' : inSupplySection ? 'Tüm Eşyalar' : 'Tüm Cinsler'}
        searchPlaceholder={inPigeonSection ? 'Irk ara...' : inSupplySection ? 'Eşya ara...' : 'Cins ara...'}
        options={filteredBreeds}
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

      <Button className="h-11 px-8" onClick={handleSearch}>
        Bul
      </Button>
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
