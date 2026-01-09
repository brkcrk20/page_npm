
'use client';

import { useParams } from 'next/navigation';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, LayoutGrid, List, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { allBreeds, categories } from '@/lib/breeds';
import React from 'react';

const unslugify = (slug: string) => {
  if (!slug) return '';
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

export default function CatchAllPage() {
  const params = useParams();
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];

  let filteredPets = pets;
  let pageTitle = "Tüm İlanlar";
  let category: (typeof categories)[0] | undefined;
  let breed: (typeof allBreeds)[0] | undefined;
  let breadcrumb: { href: string; label: string }[] = [];

  if (slugParts.length === 1) {
    const categorySlug = slugParts[0];
    category = categories.find(c => c.slug === categorySlug);
    if (category) {
      pageTitle = category.title;
      filteredPets = pets.filter(p => p.type === category.type);
      breadcrumb = [
        { href: '/', label: 'Anasayfa' },
        { href: `/${category.slug}`, label: category.title },
      ];
    }
  } else if (slugParts.length === 2) {
    const [categorySlug, breedSlug] = slugParts;
    category = categories.find(c => c.slug === categorySlug);
    breed = allBreeds.find(b => b.slug === breedSlug);

    if (category && breed) {
      pageTitle = breed.name;
      filteredPets = pets.filter(p => p.type === category.type && p.breed === breed.name);
      breadcrumb = [
        { href: '/', label: 'Anasayfa' },
        { href: `/${category.slug}`, label: category.title },
        { href: `/${category.slug}/${breed.slug}`, label: breed.name },
      ];
    }
  }

  const categoryName = category ? category.title : "Tüm Kategoriler";
  const categoryCount = category ? pets.filter(p => p.type === category.type).length : pets.length;
  const breedName = breed ? breed.name : undefined;
  const breedCount = breed ? filteredPets.length : undefined;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <BreedPageSidebar 
            categoryName={categoryName}
            categoryCount={categoryCount}
            breedName={breedName}
            breedCount={breedCount}
            breeds={category?.breeds}
            categorySlug={category?.slug}
          />
        </aside>

        <main className="lg:col-span-3">
          <div className="text-sm text-muted-foreground mb-4 flex items-center">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <Link href={item.href} className={index === breadcrumb.length - 1 ? "font-semibold text-foreground" : "hover:text-primary"}>
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>{pageTitle}</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-t border-b py-4">
              <h1 className="text-2xl font-bold font-headline mb-2 sm:mb-0">
                {pageTitle}
              </h1>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-muted-foreground'>Görünüm</span>
                  <Button variant="outline" size="icon" className="h-9 w-9 bg-primary text-primary-foreground border-primary">
                    <LayoutGrid className="h-5 w-5" />
                  </Button>
                   <Button variant="outline" size="icon" className="h-9 w-9">
                    <List className="h-5 w-5" />
                  </Button>
                </div>
                 <Select defaultValue="default">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sıralama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Gelişmiş Sıralama</SelectItem>
                      <SelectItem value="newest">Yeniden Eskiye</SelectItem>
                      <SelectItem value="oldest">Eskiden Yeniye</SelectItem>
                      <SelectItem value="price-asc">Fiyata Göre Artan</SelectItem>
                      <SelectItem value="price-desc">Fiyata Göre Azalan</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
          </div>
          

          {filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
              <PawPrint className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">
                Aradığınız kriterlere uygun ilan bulunamadı.
              </p>
              <p className="text-muted-foreground">
                Lütfen daha sonra tekrar kontrol edin veya farklı bir arama yapın.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
