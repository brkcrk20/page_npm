'use client';

import { PetCard } from "@/components/PetCard";
import { pets as staticPets } from "@/lib/data"; // Sabit veriler
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Search,
  BookText,
  ChevronDown,
  Loader2,
  Info
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import React, { useState, useMemo, useEffect } from 'react';
import { categories, type CategoryInfo } from "@/lib/breeds";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// YENİ EKLENEN AKILLI KONUM SEÇİCİ
import { LocationSelector } from "@/components/ui/LocationSelector";

// FIREBASE BAĞLANTISI
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import type { PetListing } from "@/lib/types";

// ... CategoryFilter bileşeni ...
const CategoryFilter = ({ category, onTriggerClick, isSelected }: { category: CategoryInfo, onTriggerClick: (value: string) => void, isSelected: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredBreeds = category.breeds.filter(breed => breed.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AccordionItem value={category.type.toLowerCase()} className="border-b-0 mb-2 rounded-xl overflow-hidden data-[state=open]:shadow-lg">
       <div className={cn("flex items-center justify-between whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full rounded-t-xl", isSelected ? "bg-background text-primary shadow-sm [box-shadow:0_0_8px_hsl(var(--primary))] rounded-b-none" : "bg-muted text-muted-foreground hover:text-primary rounded-xl")}>
          <Link href={`/${category.slug}`} className="flex items-center gap-2 font-bold p-3 flex-grow"><category.Icon className="transition-colors" /> {category.title}</Link>
          <AccordionTrigger onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTriggerClick(category.type.toLowerCase()) }} className="p-3 hover:bg-black/5 rounded-md"><ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" /></AccordionTrigger>
      </div>
      <AccordionContent className="bg-white rounded-b-lg">
        <div className="space-y-4 p-4">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="text" placeholder="Cins ara..." className="pl-8 h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
           <ul className="space-y-1 pr-2">
            {filteredBreeds.length > 0 ? filteredBreeds.map((breed) => (
              <li key={breed.name}>
                 <Link href={`/${category.slug}/${breed.slug}`} className="flex items-center justify-between text-muted-foreground hover:text-primary group p-2 rounded-md hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0"><Image src={`https://picsum.photos/seed/${breed.name.replace(/\s/g, '-')}/40/40`} alt={breed.name} fill className="object-cover" loading="lazy"/></div>
                      <span className="text-sm font-medium group-hover:underline">{breed.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">{breed.count}</Badge>
                </Link>
              </li>
            )) : (<li className="text-center text-sm text-muted-foreground py-4">Sonuç bulunamadı.</li>)}
          </ul>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const blogPosts = [
  { id: 1, title: "Köpekler İçin Doğru Mama Seçimi", category: "Beslenme", excerpt: "Sağlıklı bir beslenme planı dostunuzun mutluluğunun anahtarıdır." },
  { id: 2, title: "Kedi Tuvalet Eğitimi", category: "Eğitim", excerpt: "Sabır ve doğru tekniklerle bu süreci stressiz hale getirin." },
  { id: 3, title: "Evcil Hayvanlarda Tüy Dökülmesi", category: "Bakım", excerpt: "Nedenleri ve tüy dökülmesini kontrol altına alma yolları." },
];

export default function HomePage() {
  const [dbListings, setDbListings] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState<string[]>(["dog", "cat"]);

  // --- FİLTRELEME İÇİN GEREKLİ AYARLAR ---
  const [filterCity, setFilterCity] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [searchName, setSearchName] = useState(""); 

  // VERİTABANINDAN İLANLARI ÇEK
  useEffect(() => {
    const fetchAllListings = async () => {
      try {
        const q = query(collectionGroup(db, 'petListings'));
        const querySnapshot = await getDocs(q);
        const allListings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PetListing[];
        setDbListings(allListings);
      } catch (error) {
        console.error("İlanlar yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllListings();
  }, []);

  // VERİ DÖNÜŞTÜRÜCÜ
  const mapListingToPet = (listing: any) => ({
    id: listing.id,
    name: listing.name,
    imageUrl: listing.imageUrl, 
    type: listing.species || listing.type,
    breed: listing.breed,
    age: listing.age,
    price: listing.price,
    location: listing.location || "", 
    // HATA ÇÖZÜMÜ: Hem 'isFeatured' hem 'featured' alanını dolduruyoruz
    // Böylece TypeScript ne ararsa buluyor.
    isFeatured: listing.isFeatured, 
    featured: listing.isFeatured === true, 
    badge: listing.isFeatured ? 'Doping' : undefined,
    listingType: listing.listingType
  });

  // HİBRİT VERİ VE FİLTRELEME MANTIĞI
  const allPets = useMemo(() => {
    const fromDb = dbListings.map(mapListingToPet);
    
    // Static verileri de dönüştürerek 'isFeatured' alanı ekleyelim ki tipler uyuşsun
    const fromStatic = staticPets.map(p => ({ 
        ...p, 
        isStatic: true,
        // TypeScript hatasını önlemek için static veriye de isFeatured ekliyoruz
        isFeatured: p.featured 
    }));
    
    let combined = [...fromDb, ...fromStatic];

    // 1. ŞEHİR FİLTRESİ
    if (filterCity && filterCity !== "tum_sehirler") {
        combined = combined.filter(pet => 
            pet.location && pet.location.includes(filterCity)
        );
    }

    // 2. İLÇE FİLTRESİ
    if (filterDistrict && filterDistrict !== "tum_ilceler") {
        combined = combined.filter(pet => 
            pet.location && pet.location.includes(filterDistrict)
        );
    }

    // 3. İSİM ARAMA
    if (searchName) {
        combined = combined.filter(pet => 
            pet.name.toLowerCase().includes(searchName.toLowerCase()) ||
            (pet.breed && pet.breed.toLowerCase().includes(searchName.toLowerCase()))
        );
    }

    return combined;
  }, [dbListings, filterCity, filterDistrict, searchName]);

  const dogPets = useMemo(() => allPets.filter(p => p.type === 'Dog'), [allPets]);
  const catPets = useMemo(() => allPets.filter(p => p.type === 'Cat'), [allPets]);
  const birdPets = useMemo(() => allPets.filter(p => p.type === 'Bird'), [allPets]);
  
  const featuredPets = useMemo(() => {
    // ARTIK HATA VERMEZ: Her iki veri tipinde de 'featured' veya 'isFeatured' var
    return allPets.filter(p => p.featured === true || p.isFeatured === true).slice(0, 8);
  }, [allPets]);

  const handleAccordionToggle = (value: string) => {
    setOpenAccordion(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  // Konum seçiciden gelen bilgiyi kaydet
  const handleLocationFilterChange = (city: string, district: string) => {
      setFilterCity(city);
      setFilterDistrict(district);
  };

  if (loading && dbListings.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="bg-secondary/50 overflow-x-hidden">
      <div className="w-full px-5 md:container md:mx-auto pt-2 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          
          {/* --- SOL TARAFTAKİ ARAMA KUTUSU VE KATEGORİLER --- */}
          <aside className="col-span-1 hidden md:block space-y-6">
            
            {/* 1. DETAYLI ARAMA KUTUSU */}
            <div className="bg-white p-5 rounded-xl shadow-sm space-y-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-5 h-5 text-[#f05a28]" />
                    <h3 className="font-bold text-gray-800 text-lg">Detaylı Arama</h3>
                </div>
                
                {/* İsim Arama */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block ml-1">İsim veya Cins</label>
                    <Input 
                        placeholder="Örn: Pamuk, Scottish..." 
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                </div>

                {/* --- AKILLI KONUM SEÇİCİ --- */}
                <div>
                     <label className="text-xs font-semibold text-gray-500 mb-1 block ml-1">Konum</label>
                     <LocationSelector onLocationChange={handleLocationFilterChange} />
                </div>
                
                <Button className="w-full bg-[#f05a28] hover:bg-[#d44d21] text-white font-bold py-6 rounded-xl shadow-md transition-transform active:scale-95">
                    Sonuçları Getir ({allPets.length})
                </Button>
            </div>

            {/* 2. KATEGORİLER */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion} className="w-full space-y-1">
                 {categories.map((cat) => (
                    <CategoryFilter 
                      key={cat.type} 
                      category={cat} 
                      onTriggerClick={handleAccordionToggle} 
                      isSelected={openAccordion.includes(cat.type.toLowerCase())}
                    />
                 ))}
              </Accordion>
            </div>
          </aside>
          
          <main className="col-span-1 space-y-12">
            
            {/* BİLGİ KUTUSU: Veritabanı boşsa */}
            {dbListings.length === 0 && !loading && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-800 text-sm">
                <Info className="h-5 w-5" />
                <span>Henüz veritabanında ilan yok, örnek veriler gösteriliyor. İlan vererek burayı canlandırabilirsiniz!</span>
              </div>
            )}

            {/* ARAMA SONUCU BAŞLIĞI (Filtre varsa görünür) */}
            {(filterCity || searchName) && (
                 <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#f05a28] flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {filterCity ? `${filterCity} bölgesindeki sonuçlar` : 'Arama Sonuçları'}
                        </h2>
                        <p className="text-sm text-gray-500">Kriterlere uygun {allPets.length} ilan listeleniyor.</p>
                    </div>
                    {/* Filtreyi Temizle Butonu */}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setFilterCity("");
                            setFilterDistrict("");
                            setSearchName("");
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        Temizle
                    </Button>
                 </div>
            )}

            {/* YILDIZLI İLANLAR */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Yıldızlı İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/">Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {featuredPets.map((pet) => (
                  <PetCard key={pet.id} pet={pet as any} />
                ))}
                {featuredPets.length === 0 && <div className="col-span-full text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed">Bu kriterlerde öne çıkan ilan bulunamadı.</div>}
              </div>
            </section>

            {/* KÖPEK İLANLARI */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Köpek İlanları</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {dogPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet as any} />
                ))}
                {dogPets.length === 0 && <div className="col-span-full text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed">Bu kriterlerde köpek ilanı bulunamadı.</div>}
              </div>
            </section>

            {/* KEDİ İLANLARI */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Kedi İlanları</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {catPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet as any} />
                ))}
                {catPets.length === 0 && <div className="col-span-full text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed">Bu kriterlerde kedi ilanı bulunamadı.</div>}
              </div>
            </section>

            {/* BLOG KISMI */}
            <div className="space-y-8 pt-8 border-t">
                <div className="flex items-center gap-2">
                    <BookText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">petsemti Blog</h2>
                </div>
                <div className="space-y-8">
                    {blogPosts.map((post) => (
                        <div key={post.id}>
                           <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                           <h3 className="text-2xl font-bold font-headline leading-tight text-primary mb-2">{post.title}</h3>
                           <p className="text-base text-muted-foreground">{post.excerpt}</p>
                       </div>
                    ))}
                </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}