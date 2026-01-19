'use client';

import { PetCard } from "@/components/PetCard";
import { pets as staticPets } from "@/lib/data";
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

// URL OKUMA (Header'dan gelen filtreleri anlamak için gerekli)
import { useSearchParams } from 'next/navigation';

// FIREBASE
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import type { PetListing } from "@/lib/types";

const CategoryFilter = ({ category, onTriggerClick, isSelected }: { category: CategoryInfo, onTriggerClick: (value: string) => void, isSelected: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBreeds = category.breeds.filter(breed =>
    breed.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccordionItem value={category.type.toLowerCase()} className="border-b-0 mb-2 rounded-xl overflow-hidden data-[state=open]:shadow-lg">
       <div className={cn(
        "flex items-center justify-between whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full rounded-t-xl",
        isSelected 
            ? "bg-background text-primary shadow-sm [box-shadow:0_0_8px_hsl(var(--primary))] rounded-b-none"
            : "bg-muted text-muted-foreground hover:text-primary rounded-xl"
        )}>
          <Link href={`/${category.slug}`} className="flex items-center gap-2 font-bold p-3 flex-grow">
            <category.Icon className="transition-colors" /> {category.title}
          </Link>
          <AccordionTrigger
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTriggerClick(category.type.toLowerCase())
            }}
            className="p-3 hover:bg-black/5 rounded-md"
          >
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </AccordionTrigger>
      </div>
      <AccordionContent className="bg-white rounded-b-lg">
        <div className="space-y-4 p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cins ara..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
           <ul className="space-y-1 pr-2">
            {filteredBreeds.length > 0 ? filteredBreeds.map((breed) => (
              <li key={breed.name}>
                 <Link href={`/${category.slug}/${breed.slug}`} className="flex items-center justify-between text-muted-foreground hover:text-primary group p-2 rounded-md hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                     <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                       <Image 
                         src={`https://picsum.photos/seed/${breed.name.replace(/\s/g, '-')}/40/40`} 
                         alt={breed.name}
                         fill
                         className="object-cover"
                         loading="lazy"
                       />
                     </div>
                     <span className="text-sm font-medium group-hover:underline">{breed.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {breed.count}
                  </Badge>
                </Link>
              </li>
            )) : (
                <li className="text-center text-sm text-muted-foreground py-4">Sonuç bulunamadı.</li>
            )}
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

  // --- URL PARAMETRELERİNİ DİNLE ---
  // Header'daki arama çubuğu URL'i değiştirdiğinde burası tetiklenir
  const searchParams = useSearchParams();
  const urlCity = searchParams.get('city');
  const urlDistrict = searchParams.get('district');
  const urlQuery = searchParams.get('q');
  const urlType = searchParams.get('type');
  const urlBreed = searchParams.get('breed');

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

  const mapListingToPet = (listing: any) => ({
    ...listing,
    image: listing.imageUrl ? [listing.imageUrl] : (Array.isArray(listing.image) ? listing.image : []),
    type: listing.species || listing.type,
    age: listing.age ? String(listing.age) : "0", 
    price: listing.price || 0,
    location: listing.location || "Belirtilmemiş",
    featured: listing.isFeatured === true,
    isDb: true
  });

  // --- FİLTRELEME MANTIĞI ---
  const allPets = useMemo(() => {
    const fromDb = dbListings.map(mapListingToPet);
    const fromStatic = staticPets.map(p => ({ ...p, isStatic: true }));
    let combined = [...fromDb, ...fromStatic];

    // URL'den gelen filtrelere göre listeyi daralt
    if (urlCity && urlCity !== "tum_sehirler") {
        combined = combined.filter(pet => pet.location && pet.location.includes(urlCity));
    }
    if (urlDistrict && urlDistrict !== "tum_ilceler") {
        combined = combined.filter(pet => pet.location && pet.location.includes(urlDistrict));
    }
    if (urlQuery) {
        combined = combined.filter(pet => 
            pet.name.toLowerCase().includes(urlQuery.toLowerCase()) ||
            (pet.breed && pet.breed.toLowerCase().includes(urlQuery.toLowerCase()))
        );
    }
    if (urlType && urlType !== 'all') {
       combined = combined.filter(pet => pet.type === urlType);
    }
    if (urlBreed && urlBreed !== 'all') {
       combined = combined.filter(pet => pet.breed && pet.breed.toLowerCase().includes(urlBreed.toLowerCase()));
    }

    return combined;
  }, [dbListings, urlCity, urlDistrict, urlQuery, urlType, urlBreed]);

  const dogPets = useMemo(() => allPets.filter(p => p.type === 'Dog'), [allPets]);
  const catPets = useMemo(() => allPets.filter(p => p.type === 'Cat'), [allPets]);
  const birdPets = useMemo(() => allPets.filter(p => p.type === 'Bird'), [allPets]);
  
  const featuredPets = useMemo(() => {
    return allPets.filter(p => p.featured === true).slice(0, 8);
  }, [allPets]);

  const handleAccordionToggle = (value: string) => {
    setOpenAccordion(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  if (loading && dbListings.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="bg-secondary/50 overflow-x-hidden">
      <div className="w-full px-5 md:container md:mx-auto pt-2 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          
          <aside className="col-span-1 hidden md:block">
            <div className="bg-white p-4 rounded-lg shadow-sm sticky top-4">
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
          
          <main className="col-span-1 space-y-8">
            
            {/* ARAMA SONUCU BİLGİSİ (Aktif Filtre Varsa Görünür) */}
            {(urlCity || urlQuery || (urlType && urlType !== 'all') || (urlBreed && urlBreed !== 'all')) && (
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#f05a28] flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                           {urlCity ? `${urlCity} Sonuçları` : 'Arama Sonuçları'}
                        </h2>
                        <p className="text-sm text-gray-500">{allPets.length} ilan bulundu.</p>
                    </div>
                    <Link href="/" className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors">
                        Filtreleri Temizle
                    </Link>
                </div>
            )}

            {/* BİLGİ KUTUSU */}
            {dbListings.length === 0 && !loading && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-800 text-sm">
                <Info className="h-5 w-5" />
                <span>Henüz veritabanında ilan yok, örnek veriler gösteriliyor. İlan vererek burayı canlandırabilirsiniz!</span>
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
                {featuredPets.length === 0 && <div className="col-span-full text-center text-gray-400 py-8 border border-dashed rounded-xl">Sonuç yok.</div>}
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