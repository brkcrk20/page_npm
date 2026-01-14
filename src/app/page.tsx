
'use client';

import { PetCard } from "@/components/PetCard";
import { pets } from "@/lib/data";
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
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import React, { useState, useMemo, useEffect } from 'react';
import type { Pet } from "@/lib/data";
import { categories, type CategoryInfo } from "@/lib/breeds";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


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
                <li className="text-center text-sm text-muted-foreground py-4">
                    Sonuç bulunamadı.
                </li>
            )}
          </ul>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const blogPosts = [
  {
    id: 1,
    title: "Köpekler İçin Doğru Mama Seçimi: Sağlıklı Bir Yaşamın Temeli",
    category: "Beslenme",
    excerpt: "Köpeğinizin yaşına, ırkına ve aktivite seviyesine en uygun mamayı nasıl seçeceğinizi öğrenin. Tahıllı ve tahılsız mamalar arasındaki farklar, protein kaynaklarının önemi ve porsiyon kontrolü hakkında bilmeniz gereken her şey bu rehberde. Sağlıklı bir beslenme planı, dostunuzun uzun ve mutlu bir yaşam sürmesinin anahtarıdır.",
  },
  {
    id: 2,
    title: "Kedi Tuvalet Eğitimi: Sabır ve Doğru Tekniklerle Başarıya Ulaşın",
    category: "Eğitim",
    excerpt: "Yeni bir yavru kediye veya yetişkin bir kediye tuvalet eğitimi vermek göz korkutucu olabilir. Bu makalede, doğru tuvalet kabı ve kum seçimi, kedinizi tuvalete alıştırma yöntemleri, olası kazaları önleme ve sık karşılaşılan sorunlara yönelik pratik çözümler bulacaksınız. Pozitif pekiştirme ile bu süreci stressiz hale getirin.",
  },
  {
    id: 3,
    title: "Evcil Hayvanlarda Tüy Dökülmesi: Nedenleri ve Etkili Çözüm Yolları",
    category: "Bakım",
    excerpt: "Mevsimsel tüy dökülmesi normal olsa da, aşırı dökülme bir sağlık sorununun işareti olabilir. Beslenme, stres, alerjiler ve parazitler gibi tüy dökülmesine neden olan faktörleri keşfedin. Doğru tarama teknikleri, uygun bakım ürünleri ve besin takviyeleri ile tüy dökülmesini nasıl kontrol altına alabileceğinizi öğrenin.",
  },
];


export default function HomePage() {
  const [shuffledFeaturedPets, setShuffledFeaturedPets] = useState<Pet[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string[]>(["dog", "cat"]);

  const dogPets = useMemo(() => pets.filter(p => p.type === 'Dog'), []);
  const catPets = useMemo(() => pets.filter(p => p.type === 'Cat'), []);
  const birdPets = useMemo(() => pets.filter(p => p.type === 'Bird'), []);
  const aquariumPets = useMemo(() => pets.filter(p => p.type === 'Aquarium'), []);
  
  const initialFeatured = useMemo(() => pets.filter(p => p.featured).slice(0, 8), []);

  useEffect(() => {
    // Client-side shuffle to avoid hydration mismatch
    const featured = pets.filter(p => p.featured);
    const shuffled = [...featured].sort(() => 0.5 - Math.random());
    setShuffledFeaturedPets(shuffled.slice(0, 8));
  }, []);

  const displayedFeaturedPets = shuffledFeaturedPets.length > 0 ? shuffledFeaturedPets : initialFeatured;

  const handleAccordionToggle = (value: string) => {
    setOpenAccordion(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value) 
        : [...prev, value]
    );
  };

  return (
    <div className="bg-secondary/50 overflow-x-hidden">
      {/* py-6 yerine pt-2 pb-8 yaptık. Üst boşluk çok azaldı */}
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
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Yıldızlı İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {displayedFeaturedPets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Köpek İlanları</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/kopek-ilanlari">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {dogPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Kedi İlanları</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/kedi-ilanlari">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {catPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Kuş İlanları</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/kus-ilanlari">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {birdPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Akvaryum Canlıları</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/akvaryum-ilanlari">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {aquariumPets.slice(0, 4).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <BookText className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">petsemti Blog</h2>
                    </div>
                    <Button variant="link" asChild className="text-primary">
                        <Link href="/blog">
                        Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
                <div className="space-y-8">
                    {blogPosts.map((post) => (
                        <div key={post.id}>
                           <Badge variant="secondary" className="mb-2 self-start">{post.category}</Badge>
                           <h3 className="text-2xl font-bold font-headline leading-tight text-primary mb-4">
                               {post.title}
                           </h3>
                           <p className="text-base text-muted-foreground leading-relaxed">
                               {post.excerpt}
                           </p>
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
