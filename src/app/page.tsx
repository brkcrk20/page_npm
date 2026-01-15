'use client';

import { PetCard } from "@/components/PetCard";
import { pets as staticPets } from "@/lib/data"; // Sabit verileri geri ekledik
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
// DOĞRU İTHALAT YOLU
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
            ? "bg-background text-primary shadow-sm [box-shadow:0_0_8_hsl(var(--primary))] rounded-b-none"
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

  // VERİ DÖNÜŞTÜRÜCÜ: Veritabanı verisini PetCard'ın anlayacağı şekle sokar (Hata önleyici)
  const mapListingToPet = (listing: any) => ({
    ...listing,
    // PetCard 'image' (dizi) bekliyorsa 'imageUrl' (string) değerini diziye çeviriyoruz
    image: listing.imageUrl ? [listing.imageUrl] : (listing.image || []),
    type: listing.species || listing.type,
    price: listing.price || 0,
    location: listing.location || "Belirtilmemiş",
    isDb: true
  });

  // HİBRİT VERİ: Veritabanından gelenleri ve sabit örnekleri birleştiriyoruz
  const allPets = useMemo(() => {
    const fromDb = dbListings.map(mapListingToPet);
    const fromStatic = staticPets.map(p => ({ ...p, isStatic: true }));
    // Veritabanı ilanları her zaman en üstte görünsün
    return [...fromDb, ...fromStatic];
  }, [dbListings]);

  // FİLTRELEME MANTIKLARI (Güncellenmiş liste üzerinden)
  const dogPets = useMemo(() => allPets.filter(p => p.type === 'Dog'), [allPets]);
  const catPets = useMemo(() => allPets.filter(p => p.type === 'Cat'), [allPets]);
  const birdPets = useMemo(() => allPets.filter(p => p.type === 'Bird'), [allPets]);
  const featuredPets = useMemo(() => allPets.slice(0, 8), [allPets]);

  const handleAccordionToggle = (value: string) => {
    setOpenAccordion(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  // Yükleme ekranı (Sadece ilk veriler gelene kadar)
  if (loading && dbListings.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="bg-secondary/50 overflow-x-hidden">
      <div className="w-full px-5 md:container md:mx-auto pt-2 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <aside className="col-span-1 hidden md:block">
            <div className="bg-white p-4 rounded-lg shadow-sm">
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
            {/* BİLGİ KUTUSU: Veritabanı boşsa gösterilir */}
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