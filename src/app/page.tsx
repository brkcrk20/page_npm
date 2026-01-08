
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
  Dog,
  Cat,
  Bird,
  Fish,
  ArrowRight,
  Search,
  PawPrint,
  BookText
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import React, { useState, useMemo } from 'react';
import type { Pet } from "@/lib/data";
import { allDogBreeds, allCatBreeds, allBirdBreeds, allAquariumBreeds, allOtherBreeds } from "@/lib/breeds";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BreedInfo = {
  name: string;
  count: number;
};

type CategoryInfo = {
  type: 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other';
  breeds: BreedInfo[];
  Icon: React.ElementType;
  color: string;
  title: string;
};

const CategoryFilter = ({ category }: { category: CategoryInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBreeds = category.breeds.filter(breed =>
    breed.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AccordionItem value={category.type.toLowerCase()}>
      <AccordionTrigger className="font-bold">
        <div className={`flex items-center gap-2 ${category.color}`}>
          <category.Icon /> {category.title}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pl-2">
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
          <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {filteredBreeds.map((breed) => (
              <li key={breed.name}>
                <Link href="#" className="flex items-center justify-between text-muted-foreground hover:text-primary group">
                  <div className="flex items-center gap-3">
                     <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                       <Image 
                         src={`https://picsum.photos/seed/${breed.name.replace(/\s/g, '-')}/40/40`} 
                         alt={breed.name}
                         fill
                         className="object-cover"
                       />
                     </div>
                     <span className="text-sm font-medium group-hover:underline">{breed.name}</span>
                  </div>
                  <span className="text-xs bg-secondary group-hover:bg-primary/20 text-secondary-foreground group-hover:text-primary font-semibold px-2 py-0.5 rounded-full">
                    {breed.count}
                  </span>
                </Link>
              </li>
            ))}
             {filteredBreeds.length === 0 && (
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

    // 1. Get counts of breeds that are in the pet listings
    const countsByType = pets.reduce((acc, pet) => {
        const { type, breed } = pet;
        if (!acc[type]) acc[type] = {};
        if (!acc[type][breed]) acc[type][breed] = 0;
        acc[type][breed]++;
        return acc;
    }, {} as Record<Pet['type'], Record<string, number>>);

    // 2. Function to merge static breed list with dynamic counts
    const processBreeds = (
      allBreeds: string[], 
      breedCounts: Record<string, number> | undefined
    ): BreedInfo[] => {
      const breedInfo = allBreeds.map(breedName => ({
        name: breedName,
        count: breedCounts?.[breedName] || 0,
      }));
      // Sort by count descending, then alphabetically using a specific locale
      return breedInfo.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Using 'en' locale to ensure consistent sorting on server and client
        return a.name.localeCompare(b.name, 'en');
      });
    };
    
    const categories: CategoryInfo[] = [
      {
        type: 'Dog',
        title: 'Köpekler',
        Icon: Dog,
        color: 'text-orange-500',
        breeds: processBreeds(allDogBreeds, countsByType.Dog),
      },
      {
        type: 'Cat',
        title: 'Kediler',
        Icon: Cat,
        color: 'text-red-400',
        breeds: processBreeds(allCatBreeds, countsByType.Cat),
      },
      {
        type: 'Bird',
        title: 'Kuşlar',
        Icon: Bird,
        color: 'text-sky-400',
        breeds: processBreeds(allBirdBreeds, countsByType.Bird),
      },
      {
        type: 'Aquarium',
        title: 'Akvaryum Canlıları',
        Icon: Fish,
        color: 'text-blue-400',
        breeds: processBreeds(allAquariumBreeds, countsByType.Aquarium),
      },
       {
        type: 'Other',
        title: 'Diğer',
        Icon: PawPrint,
        color: 'text-emerald-500',
        breeds: processBreeds(allOtherBreeds, countsByType.Other),
      },
    ];

  return (
    <div className="bg-secondary/50">
      <div className="container mx-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="col-span-1">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Accordion type="multiple" defaultValue={["dog", "cat"]} className="w-full">
                 {categories.map((cat) => (
                    <CategoryFilter key={cat.type} category={cat} />
                 ))}
              </Accordion>
            </div>
          </aside>
          <main className="col-span-3 space-y-12">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Yıldızlı İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {pets.slice(0, 8).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Son Yüklenen İlanlar</h2>
                <Button variant="link" asChild className="text-primary">
                  <Link href="/">
                    Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {pets.slice(2, 6).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            </div>
             <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <BookText className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">PatiBul Blog</h2>
                    </div>
                    <Button variant="link" asChild className="text-primary">
                        <Link href="/blog">
                        Tümünü Gör <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
                <div className="space-y-8">
                    {blogPosts.map((post) => (
                        <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm">
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
