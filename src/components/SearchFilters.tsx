'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { citiesData, cityNames } from '@/lib/turkiye-data';
import { petBreeds } from '@/lib/pet-data';
import { cn } from '@/lib/utils';

// Firebase Verisi Çekmek İçin
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';

// --- TİPLER ---
type Option = {
  value: string;
  label: string;
  count?: number; // İlan sayısı
};

type ListingData = {
  type?: string;     // veya species
  species?: string;
  breed?: string;
  city?: string;
  district?: string;
  [key: string]: any;
};

// --- ARAMALI SELECT BİLEŞENİ (Sıralama Mantığı Burada) ---
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

  // Dışarı tıklayınca kapat
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

  // FİLTRELEME VE SIRALAMA (En çok sayı -> En az sayı -> Alfabetik)
  const filteredOptions = useMemo(() => {
    let result = options;

    // 1. Arama Filtresi
    if (searchText.length > 0) {
      result = result.filter(item => 
        item.label.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 2. Sıralama
    return result.sort((a, b) => {
      const countA = a.count || 0;
      const countB = b.count || 0;
      
      // Önce sayıya göre (Büyükten küçüğe)
      if (countB !== countA) return countB - countA; 
      
      // Sayılar eşitse isme göre (A'dan Z'ye)
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
                        {/* SAYAÇ ROZETİ */}
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

// --- ANA İÇERİK ---
function SearchFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  // Seçim State'leri
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || "");
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || "");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || "");

  // Tüm İlan Verisi (Hesaplama yapmak için)
  const [listings, setListings] = useState<ListingData[]>([]);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
    setSelectedType(searchParams.get('type') || "");
    setSelectedBreed(searchParams.get('breed') || "");
    setSelectedCity(searchParams.get('city') || "");
    setSelectedDistrict(searchParams.get('district') || "");
  }, [searchParams]);

  // Firebase'den TÜM İlanları Çek ve Hafızaya Al
  useEffect(() => {
    const fetchListings = async () => {
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
      }
    };

    fetchListings();
  }, []);

  // --- SEÇENEKLERİ HESAPLA ---

  // 1. TÜR LİSTESİ (İlan Sayılı)
  const typeOptions: Option[] = useMemo(() => {
    const baseOptions = [
      { value: "Dog", label: "Köpek" },
      { value: "Cat", label: "Kedi" },
      { value: "Bird", label: "Kuş" },
      { value: "Fish", label: "Akvaryum" },
      { value: "Other", label: "Diğer" }
    ];

    return baseOptions.map(opt => {
      // Veritabanında kaç tane bu türden var say
      const count = listings.filter(l => (l.type === opt.value || l.species === opt.value)).length;
      return { ...opt, count };
    });
  }, [listings]);

  // 2. CİNS LİSTESİ (Dinamik ve Sayılı)
  const breedOptions: Option[] = useMemo(() => {
    if (!selectedType || selectedType === "all") return [];
    
    const typeKey = selectedType.toLowerCase();
    const breeds = petBreeds[typeKey] || [];

    // Seçilen türe göre ilanları filtrele
    const filteredListings = listings.filter(l => 
      (l.type === selectedType || l.species === selectedType)
    );

    return breeds.map(breed => {
      // Bu türdeki ilanların içinde bu cinsten kaç tane var?
      const count = filteredListings.filter(l => l.breed === breed).length;
      return { value: breed, label: breed, count };
    });
  }, [selectedType, listings]);

  // 3. İL LİSTESİ (Sayılı)
  const cityOptions: Option[] = useMemo(() => {
    return cityNames.map(city => {
      // İlde kaç ilan var? (Eğer tür seçiliyse, o türden o ilde kaç tane var?)
      const count = listings.filter(l => {
        const matchesCity = l.city === city;
        // Eğer tür seçiliyse, türü de kontrol et (Opsiyonel: Daha akıllı filtreleme)
        const matchesType = !selectedType || selectedType === "all" || (l.type === selectedType || l.species === selectedType);
        return matchesCity && matchesType;
      }).length;
      
      return { value: city, label: city, count };
    });
  }, [listings, selectedType]);

  // 4. İLÇE LİSTESİ (Sayılı)
  const districtOptions: Option[] = useMemo(() => {
    if (!selectedCity || selectedCity === "tum_sehirler") return [];
    const districts = citiesData[selectedCity] || [];

    return districts.map(dist => {
      const count = listings.filter(l => {
        const matchesCity = l.city === selectedCity;
        const matchesDistrict = l.district === dist;
        // Eğer tür seçiliyse onu da hesaba kat
        const matchesType = !selectedType || selectedType === "all" || (l.type === selectedType || l.species === selectedType);
        return matchesCity && matchesDistrict && matchesType;
      }).length;

      return { value: dist, label: dist, count };
    });
  }, [selectedCity, listings, selectedType]);


  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (selectedType && selectedType !== "all") params.set('type', selectedType); else params.delete('type');
    if (selectedBreed && selectedBreed !== "all") params.set('breed', selectedBreed); else params.delete('breed');
    if (selectedCity && selectedCity !== "tum_sehirler") params.set('city', selectedCity); else params.delete('city');
    if (selectedDistrict && selectedDistrict !== "tum_ilceler") params.set('district', selectedDistrict); else params.delete('district');

    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="py-2 w-full max-w-full">
      
      {/* MOBİL FİLTRE BUTONU */}
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full flex items-center justify-between mb-2 md:hidden h-12 rounded-2xl transition-all duration-300 shadow-sm border ${isOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-700 border-gray-100 hover:border-primary/30 hover:bg-orange-50'}`}
      >
        <span className="flex items-center gap-2.5 font-semibold text-base">
          <div className={`p-1.5 rounded-full ${isOpen ? 'bg-white/20' : 'bg-orange-100 text-primary'}`}>
             <SlidersHorizontal className="w-4 h-4" />
          </div>
          İlan Ara & Filtrele
        </span>
        {isOpen ? <ChevronUp className="w-5 h-5 opacity-80" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </Button>

      {/* ARAMA FORMU */}
      <div className={`${isOpen ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-end w-full animate-in slide-in-from-top-4 fade-in duration-300 ease-out`}>
        
        {/* 1. İsim/No Arama Inputu */}
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Ne arıyorsun? (İlan no, başlık...)" 
            className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-primary/20" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 2. TÜR SEÇİMİ (Aramalı) */}
        <SearchableSelect
          placeholder="Tüm Türler"
          searchPlaceholder="Tür ara..."
          options={typeOptions}
          value={selectedType}
          onChange={(val) => {
             setSelectedType(val);
             setSelectedBreed(""); 
          }}
        />

        {/* 3. CİNS SEÇİMİ (Aramalı + Sayılı) */}
        <SearchableSelect
          placeholder="Tüm Cinsler"
          searchPlaceholder="Cins ara..."
          options={breedOptions}
          value={selectedBreed}
          onChange={setSelectedBreed}
          disabled={!selectedType || selectedType === "all"}
        />
        
        {/* 4. İL SEÇİMİ (Aramalı) */}
        <SearchableSelect
          placeholder="İl Seçiniz"
          searchPlaceholder="Şehir ara..."
          options={cityOptions}
          value={selectedCity}
          onChange={(val) => {
             setSelectedCity(val);
             setSelectedDistrict(""); 
          }}
        />

        {/* 5. İLÇE SEÇİMİ (Aramalı) */}
        <SearchableSelect
          placeholder="İlçe Seçiniz"
          searchPlaceholder="İlçe ara..."
          options={districtOptions}
          value={selectedDistrict}
          onChange={setSelectedDistrict}
          disabled={!selectedCity || selectedCity === "tum_sehirler"}
        />

        {/* BUL BUTONU */}
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