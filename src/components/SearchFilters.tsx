'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
 * Eski sürüm seçenekleri Firestore'dan collectionGroup sorgusuyla, yani tüm
 * ilanları çekip içlerinden tür/cins çıkararak üretiyordu — hem yavaş hem de
 * ilan yokken boş kalan bir yaklaşım. Artık kategori, cins ve il listeleri
 * doğrudan referans tablolarından geliyor; ilan olmasa da doludur.
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

function SearchFiltersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    (async () => {
      const [cats, brs, cits] = await Promise.all([
        supabase.from('categories').select('id, name, slug').eq('is_active', true).order('position'),
        supabase.from('breeds').select('id, name, slug, category_id').eq('is_active', true).order('position'),
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

  const filteredBreeds = useMemo(() => {
    if (categorySlug === ALL) return breeds;
    const category = categories.find((c) => c.slug === categorySlug);
    return category ? breeds.filter((b) => b.category_id === category.id) : breeds;
  }, [breeds, categories, categorySlug]);

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

    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (citySlug !== ALL) params.set('city', citySlug);
    if (districtSlug !== ALL) params.set('district', districtSlug);
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto_auto_auto]">
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

      <FilterSelect
        value={categorySlug}
        onChange={(v) => {
          setCategorySlug(v);
          setBreedSlug(ALL);
        }}
        placeholder="Tüm Türler"
        allLabel="Tüm Türler"
        searchPlaceholder="Tür ara..."
        options={categories}
      />

      <FilterSelect
        value={breedSlug}
        onChange={setBreedSlug}
        placeholder="Tüm Cinsler"
        allLabel="Tüm Cinsler"
        searchPlaceholder="Cins ara..."
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
