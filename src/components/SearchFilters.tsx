'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { citiesData, cityNames } from '@/lib/turkiye-data';
import { petBreeds } from '@/lib/pet-data';
import { cn } from '@/lib/utils';

// Firebase Verisi Çekmek İçin
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';

function SearchFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  // State Tanımları
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || "");
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || "");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || "");

  // Cins Arama ve Dropdown State'leri
  const [breedSearch, setBreedSearch] = useState("");
  const [isBreedOpen, setIsBreedOpen] = useState(false);
  const breedDropdownRef = useRef<HTMLDivElement>(null);

  // İlan Sayılarını Tutacak State
  const [breedCounts, setBreedCounts] = useState<Record<string, number>>({});

  // URL Parametrelerini Dinle
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
    setSelectedType(searchParams.get('type') || "");
    setSelectedBreed(searchParams.get('breed') || "");
    setSelectedCity(searchParams.get('city') || "");
    setSelectedDistrict(searchParams.get('district') || "");
  }, [searchParams]);

  // Firebase'den İlan Sayılarını Çek (Sadece bir kere çalışır)
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const q = query(collectionGroup(db, 'petListings'));
        const snapshot = await getDocs(q);
        const counts: Record<string, number> = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.breed) {
            counts[data.breed] = (counts[data.breed] || 0) + 1;
          }
        });
        setBreedCounts(counts);
      } catch (error) {
        console.error("İlan sayıları çekilemedi:", error);
      }
    };

    fetchCounts();
  }, []);

  // Dropdown dışına tıklanınca kapatma mantığı
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (breedDropdownRef.current && !breedDropdownRef.current.contains(event.target as Node)) {
        setIsBreedOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // AKILLI SIRALAMA VE FİLTRELEME MANTIĞI
  const sortedAndFilteredBreeds = useMemo(() => {
    if (!selectedType || selectedType === "all" || selectedType === "other") return [];

    // 1. Seçilen türe ait ırkları al
    let breeds = petBreeds[selectedType] || [];

    // 2. Arama filtresi uygula (En az 1 harf yazıldıysa)
    if (breedSearch.length > 0) {
      breeds = breeds.filter(breed => 
        breed.toLowerCase().includes(breedSearch.toLowerCase())
      );
    }

    // 3. Sıralama Mantığı: Önce ilan sayısı çok olan, sonra alfabetik
    return [...breeds].sort((a, b) => {
      const countA = breedCounts[a] || 0;
      const countB = breedCounts[b] || 0;

      // İlan sayısı farklıysa çoktan aza sırala
      if (countB !== countA) {
        return countB - countA;
      }
      // İlan sayısı eşitse (veya 0 ise) alfabetik sırala
      return a.localeCompare(b, 'tr');
    });
  }, [selectedType, breedSearch, breedCounts]);

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
        
        {/* Arama Inputu */}
        <div className="relative lg:col-span-2 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Ne arıyorsun? (İlan no, başlık...)" 
            className="pl-9 h-11 w-full bg-white border-gray-200 rounded-xl focus:border-primary focus:ring-primary/20" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- TÜR SEÇİMİ --- */}
        <Select 
          value={selectedType} 
          onValueChange={(val) => {
            setSelectedType(val);
            setSelectedBreed(""); // Tür değişince cins sıfırlanır
            setBreedSearch(""); // Arama temizlenir
          }}
        >
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
            <SelectValue placeholder="Tüm Türler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="dog">Köpek</SelectItem>
            <SelectItem value="cat">Kedi</SelectItem>
            <SelectItem value="bird">Kuş</SelectItem>
            <SelectItem value="fish">Akvaryum</SelectItem>
            <SelectItem value="other">Diğer</SelectItem>
          </SelectContent>
        </Select>

        {/* --- ÖZEL ARAMALI CİNS SEÇİMİ (CUSTOM COMBOBOX) --- */}
        <div className="relative w-full" ref={breedDropdownRef}>
            <div 
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                    (!selectedType || selectedType === "all" || selectedType === "other") && "opacity-50 cursor-not-allowed bg-gray-50"
                )}
                onClick={() => {
                    if (selectedType && selectedType !== "all" && selectedType !== "other") {
                        setIsBreedOpen(!isBreedOpen);
                    }
                }}
            >
                <span className={cn("block truncate", !selectedBreed && "text-muted-foreground")}>
                    {selectedBreed || "Tüm Cinsler"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </div>

            {/* AÇILIR LİSTE */}
            {isBreedOpen && (
                <div className="absolute z-50 mt-1 max-h-[300px] w-full min-w-[200px] overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    {/* Arama Inputu */}
                    <div className="flex items-center border-b px-3 pb-2 pt-3 sticky top-0 bg-white">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                           ref={(input) => input && input.focus()} 
                           className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                           placeholder="Cins ara..."
                           value={breedSearch}
                           onChange={(e) => setBreedSearch(e.target.value)}
                        />
                    </div>

                    {/* Liste */}
                    <div className="max-h-[220px] overflow-y-auto p-1">
                        <div
                            className={cn(
                                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedBreed === "" && "bg-accent/50"
                            )}
                            onClick={() => {
                                setSelectedBreed("");
                                setIsBreedOpen(false);
                            }}
                        >
                            <Check className={cn("mr-2 h-4 w-4", selectedBreed === "" ? "opacity-100" : "opacity-0")} />
                            Tüm Cinsler
                        </div>
                        {sortedAndFilteredBreeds.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
                        ) : (
                            sortedAndFilteredBreeds.map((breed) => (
                                <div
                                    key={breed}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-orange-50 hover:text-orange-900 cursor-pointer",
                                        selectedBreed === breed && "bg-orange-100 text-orange-900 font-medium"
                                    )}
                                    onClick={() => {
                                        setSelectedBreed(breed);
                                        setIsBreedOpen(false);
                                    }}
                                >
                                    <div className="flex items-center">
                                        <Check className={cn("mr-2 h-4 w-4", selectedBreed === breed ? "opacity-100" : "opacity-0")} />
                                        {breed}
                                    </div>
                                    {/* İLAN SAYISI BADGE */}
                                    <span className="ml-auto text-xs text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded-full">
                                        {breedCounts[breed] || 0}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
        
        {/* --- İL SEÇİMİ --- */}
        <Select value={selectedCity} onValueChange={(val) => { setSelectedCity(val); setSelectedDistrict(""); }}>
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
            <SelectValue placeholder="İl" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="tum_sehirler">Tüm Şehirler</SelectItem>
            {cityNames.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
          </SelectContent>
        </Select>

        {/* --- İLÇE SEÇİMİ --- */}
        <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity || selectedCity === "tum_sehirler"}>
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
            <SelectValue placeholder="İlçe" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="tum_ilceler">Tüm İlçeler</SelectItem>
            {selectedCity && citiesData[selectedCity]?.map((district) => (<SelectItem key={district} value={district}>{district}</SelectItem>))}
          </SelectContent>
        </Select>

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