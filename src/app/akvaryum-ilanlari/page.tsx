
'use client';

import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, ChevronRight } from 'lucide-react';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';


export default function AquariumPage() {
  const filteredPets = pets.filter((pet) => pet.type === 'Aquarium');
  const category = categories.find(c => c.type === 'Aquarium');

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto py-8">
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
           <BreedPageSidebar 
            categoryName={category.title}
            categoryCount={filteredPets.length}
            categorySlug={category.slug}
            breeds={category.breeds}
          />
        </aside>
        <main className="lg:col-span-3">
            <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-foreground">Akvaryum İlanları</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>Akvaryum İlanları</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-t border-b py-4">
                <h1 className="text-2xl font-bold font-headline mb-2 sm:mb-0">
                Akvaryum İlanları
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
                Bu kategoride henüz ilan bulunamadı.
                </p>
                <p className="text-muted-foreground">
                Lütfen daha sonra tekrar kontrol edin veya farklı bir kategoriye göz atın.
                </p>
            </div>
            )}
        </main>
      </div>
    </div>
  );
}
