
'use client';

import { useParams } from 'next/navigation';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/lib/breeds';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { ListingRow } from '@/components/ListingRow';

export default function OtherBreedPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const category = categories.find(c => c.type === 'Other');
  const breed = category?.breeds.find(b => b.slug === slug);
  const breedName = breed ? breed.name : 'Bilinmeyen Cins';
  
  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  const filteredPets = pets.filter(
    (pet) => pet.type === 'Other' && pet.breed === breedName
  );
  
  const featuredPets = filteredPets.filter(p => p.featured).slice(0, 4);
  const standardPets = filteredPets.filter(p => !p.featured);
  const categoryCount = pets.filter(p => p.type === 'Other').length;

  return (
    <div className="container mx-auto py-8">
       <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside className="col-span-1">
           <BreedPageSidebar 
            categoryName={category.title}
            categoryCount={categoryCount}
            categorySlug={category.slug}
            breeds={category.breeds}
            breedName={breedName}
            breedCount={filteredPets.length}
          />
        </aside>
        <main className="col-span-1">
           <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/diger-ilanlar" className="hover:text-primary">Diğer İlanlar</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-foreground">{breedName}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                <span className='font-bold text-primary'>{breedName}</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
            </p>

            {/* Vitrin Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Yıldızlı İlanlar</h2>
              {featuredPets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredPets.map((pet) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </div>
              ) : (
                 <div className="text-center py-10 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                    <PawPrint className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Bu cinse ait yıldızlı ilan bulunamadı.</p>
                 </div>
              )}
            </div>

            {/* Promotion Banner */}
            <div className="my-8 p-3 bg-red-100/50 border border-red-200 text-red-700 text-sm text-center rounded-lg">
                İlanınız yukarıda yer alsın, alıcılara daha kısa sürede ulaşın! <Link href="#" className="font-bold underline hover:text-red-800">Detaylı bilgi için tıklayın.</Link>
            </div>

            {/* Standard List Section */}
            <div>
              {standardPets.length > 0 ? (
                <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg">
                    {standardPets.map((pet) => (
                    <ListingRow key={pet.id} pet={pet} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                    <PawPrint className="mx-auto h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">
                    Aradığınız <span className="font-bold text-primary">{breedName}</span> cinsine ait ilan bulunamadı.
                    </p>
                    <p className="text-muted-foreground">
                    Lütfen daha sonra tekrar kontrol edin veya farklı bir cins arayın.
                    </p>
                </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}
