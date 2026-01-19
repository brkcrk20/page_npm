'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { citiesData, cityNames } from '@/lib/turkiye-data';
import { petBreeds } from '@/lib/pet-data'; // YENİ VERİYİ ÇEKİYORUZ

function SearchFiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || "");
  const [selectedBreed, setSelectedBreed] = useState(searchParams.get('breed') || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || "");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || "");

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || "");
    setSelectedType(searchParams.get('type') || "");
    setSelectedBreed(searchParams.get('breed') || "");
    setSelectedCity(searchParams.get('city') || "");
    setSelectedDistrict(searchParams.get('district') || "");
  }, [searchParams]);

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

        {/* --- TÜR SEÇİMİ (Kedi, Köpek vb.) --- */}
        <Select 
          value={selectedType} 
          onValueChange={(val) => {
            setSelectedType(val);
            setSelectedBreed(""); // Tür değişince cins sıfırlanır
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

        {/* --- CİNS SEÇİMİ (Dinamik) --- */}
        <Select 
          value={selectedBreed} 
          onValueChange={setSelectedBreed}
          // Eğer tür seçili değilse veya "all/other" ise kapalı kalsın
          disabled={!selectedType || selectedType === "all" || selectedType === "other"}
        >
          <SelectTrigger className="h-11 w-full bg-white border-gray-200 rounded-xl focus:ring-primary/20">
            <SelectValue placeholder="Tüm Cinsler" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">Tüm Cinsler</SelectItem>
            {/* Seçilen türe göre listeyi getir */}
            {selectedType && petBreeds[selectedType]?.map((breed) => (
              <SelectItem key={breed} value={breed}>{breed}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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