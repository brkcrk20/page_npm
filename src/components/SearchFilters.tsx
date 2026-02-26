'use client';

import { useState, useEffect, useMemo, useRef, Suspense, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { citiesData, cityNames } from '@/lib/turkiye-data';
import { petBreeds } from '@/lib/pet-data';
import { cn } from '@/lib/utils';

// FIREBASE BAĞLANTISI BURADA DÜZELTİLDİ
import { initializeFirebase } from '@/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';

const { firestore: db } = initializeFirebase();

type Option = {
  value: string;
  label: string;
  count?: number; 
};

type ListingData = {
  type?: string; 
  species?: string;
  breed?: string;
  city?: string;
  district?: string;
  [key: string]: any;
};

interface SearchState {
  searchTerm: string;
  selectedType: string;
  selectedBreed: string;
  selectedCity: string;
  selectedDistrict: string;
}

type SearchAction =
  | { type: 'SET_STATE_FROM_PARAMS'; payload: SearchState }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_TYPE'; payload: string }
  | { type: 'SET_BREED'; payload:string }
  | { type: 'SET_CITY'; payload: string }
  | { type: 'SET_DISTRICT'; payload: string };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_STATE_FROM_PARAMS':
      return action.payload;
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_TYPE':
      return { ...state, selectedType: action.payload, selectedBreed: "" };
    case 'SET_BREED':
      return { ...state, selectedBreed: action.payload };
    case 'SET_CITY':
      return { ...state, selectedCity: action.payload, selectedDistrict: "" };
    case 'SET_DISTRICT':
      return { ...state, selectedDistrict: action.payload };
    default:
      return state;
  }
};

const SearchableSelect = ({ 
  placeholder, 
  searchPlaceholder, 
  options, 
  value, 
  onChange, 
  disabled = false 
}: {
  placeholder: string;
  searchPlaceholder: string;
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  const filteredOptions = useMemo(() => {
    let result = options;
    if (searchText.length > 0) {
      result = result.filter(item => 
        item.label.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return result.sort((a, b) => {
      const countA = a.count || 0;
      const countB = b.count || 0;
      if (countB !== countA) return countB - countA; 
      return a.label.localeCompare(b.label, 'tr'); 
    });
  }, [options, searchText]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer hover:border-orange-300 transition-colors",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50 hover:border-gray-200"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn("block truncate", !value && "text-muted-foreground")}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-[300px] w-full min-w-[200px] overflow-hidden rounded-lg border bg-white text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center border-b px-3 pb-2 pt-3 sticky top-0 bg-white z-10">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
               ref={(input) => { if (input) input.focus(); }} 
               className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
               placeholder={searchPlaceholder}
               value={searchText}
               onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200">
            <div
                className={cn(
                    "relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-orange-50 hover:text-orange-900 cursor-pointer",
                    value === "" && "bg-orange-50 text-orange-900"
                )}
                onClick={() => {
                    onChange("");
                    setIsOpen(false);
                    setSearchText("");
                }}
            >
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Hepsini Göster
            </div>

            {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
            ) : (
                filteredOptions.map((option) => (
                    <div
                        key={option.value}
                        className={cn(
                            "relative flex cursor-default select-none items-center justify-between rounded-md px-2 py-2 text-sm outline-none hover:bg-orange-50 hover:text-orange-900 cursor-pointer transition-colors",
                            value === option.value && "bg-orange-100 text-orange-900 font-medium"
                        )}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                            setSearchText("");
                        }}
                    >
                        <div className="flex items-center truncate">
                            <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", value === option.value ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{option.label}</span>
                        </div>
                        <span className={`ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${option.count && option.count > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                             {option.count || 0}
                        </span>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function SearchFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const initialState: SearchState = {
    searchTerm: searchParams.get('q') || "",
    selectedType: searchParams.get('type') || "",
    selectedBreed: searchParams.get('breed') || "",
    selectedCity: searchParams.get('city') || "",
    selectedDistrict: searchParams.get('district') || "",
  };

  const [state, dispatch] = useReducer(searchReducer, initialState);

  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch({
      type: 'SET_STATE_FROM_PARAMS',
      payload: {
        searchTerm: searchParams.get('q') || "",
        selectedType: searchParams.get('type') || "",
        selectedBreed: searchParams.get('breed') || "",
        selectedCity: searchParams.get('city') || "",
        selectedDistrict: searchParams.get('district') || "",
      }
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collectionGroup(db, 'petListings'));
        const snapshot = await getDocs(q);
        const data: ListingData[] = [];
        snapshot.forEach((doc) => {
          data.push(doc.data() as ListingData);
        });
        setListings(data);
      } catch (error) {
        console.error("İlanlar çekilemedi:", error);
        setError("İlanlar yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const typeOptions: Option[] = useMemo(() => {
    const baseOptions = [
      { value: "Dog", label: "Köpek" },
      { value: "Cat", label: "Kedi" },
      { value: "Bird", label: "Kuş" },
      { value: "Fish", label: "Akvaryum" },
      { value: "Other", label: "Diğer" }
    ];
    return baseOptions.map(opt => ({ ...opt, count: listings.filter(l => (l.type === opt.value || l.species === opt.value)).length }));
  }, [listings]);

  const breedOptions: Option[] = useMemo(() => {
    if (!state.selectedType || state.selectedType === "all") return [];
    const typeKey = state.selectedType.toLowerCase();
    const breeds = petBreeds[typeKey] || [];
    const filteredListings = listings.filter(l => (l.type === state.selectedType || l.species === state.selectedType));
    return breeds.map(breed => ({ value: breed, label: breed, count: filteredListings.filter(l => l.breed === breed).length }));
  }, [state.selectedType, listings]);

  const cityOptions: Option[] = useMemo(() => cityNames.map(city => ({
    value: city, label: city, count: listings.filter(l => l.city === city && (!state.selectedType || state.selectedType === "all" || (l.type === state.selectedType || l.species === state.selectedType))).length
  })), [listings, state.selectedType]);

  const districtOptions: Option[] = useMemo(() => {
    if (!state.selectedCity || state.selectedCity === "tum_sehirler") return [];
    const districts = citiesData[state.selectedCity] || [];
    return districts.map(dist => ({
      value: dist, label: dist, count: listings.filter(l => l.city === state.selectedCity && l.district === dist && (!state.selectedType || state.selectedType === "all" || (l.type === state.selectedType || l.species === state.selectedType))).length
    }));
  }, [state.selectedCity, listings, state.selectedType]);


  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (state.searchTerm) params.set('q', state.searchTerm); else params.delete('q');
    if (state.selectedType && state.selectedType !== "all") params.set('type', state.selectedType); else params.delete('type');
    if (state.selectedBreed && state.selectedBreed !== "all") params.set('breed', state.selectedBreed); else params.delete('breed');
    if (state.selectedCity && state.selectedCity !== "tum_sehirler") params.set('city', state.selectedCity); else params.delete('city');
    if (state.selectedDistrict && state.selectedDistrict !== "tum_ilceler") params.set('district', state.selectedDistrict); else params.delete('district');
    router.push(`/?${params.toString()}`);
  };

  if (loading) {
    return <div className="h-48 w-full flex items-center justify-center"><div className="text-gray-500">Filtreler yükleniyor...</div></div>;
  }

  if (error) {
    return <div className="h-48 w-full flex items-center justify-center"><div className="text-red-500">{error}</div></div>;
  }

  return (
    <div className="py-2 w-full max-w-full">
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full flex items-center justify-between mb-2 md:hidden h-12 rounded-2xl transition-all duration-300 shadow-sm border ${isOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-700 border-gray-100 hover:border-primary/30 hover:bg-orange-50'}`}
      >
        <span className="flex items-center gap-2.5 font-semibold text-base">
          İlan Ara & Filtrele
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5 opacity-80" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </Button>

      <div className={`${isOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-end w-full animate-in slide-in-from-top-4 fade-in duration-300 ease-out`}>
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Ne arıyorsun? (İlan no, başlık...)" 
            className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pl-9 text-sm focus:border-primary focus:ring-primary/20 outline-none" 
            value={state.searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />
        </div>
        <SearchableSelect placeholder="Tüm Türler" searchPlaceholder="Tür ara..." options={typeOptions} value={state.selectedType} onChange={(val) => dispatch({ type: 'SET_TYPE', payload: val })} />
        <SearchableSelect placeholder="Tüm Cinsler" searchPlaceholder="Cins ara..." options={breedOptions} value={state.selectedBreed} onChange={(val) => dispatch({ type: 'SET_BREED', payload: val })} disabled={!state.selectedType || state.selectedType === "all"} />
        <SearchableSelect placeholder="İl Seçiniz" searchPlaceholder="Şehir ara..." options={cityOptions} value={state.selectedCity} onChange={(val) => dispatch({ type: 'SET_CITY', payload: val })} />
        <SearchableSelect placeholder="İlçe Seçiniz" searchPlaceholder="İlçe ara..." options={districtOptions} value={state.selectedDistrict} onChange={(val) => dispatch({ type: 'SET_DISTRICT', payload: val })} disabled={!state.selectedCity || state.selectedCity === "tum_sehirler"} />
        <Button onClick={handleSearch} className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-transform active:scale-95">Bul</Button>
      </div>
    </div>
  );
}

export function SearchFilters() {
  return (
    <Suspense fallback={<div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />}>
      <SearchFiltersContent />
    </Suspense>
  );
}