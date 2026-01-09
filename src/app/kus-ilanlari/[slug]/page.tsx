'use client';

import { useParams } from 'next/navigation';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { allBirdBreeds } from '@/lib/breeds';

export default function BirdBreedPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const breed = allBirdBreeds.find(b => b.slug === slug);
  const breedName = breed ? breed.name : 'Bilinmeyen Cins';

  const filteredPets = pets.filter(
    (pet) => pet.type === 'Bird' && pet.breed === breedName
  );

  return (
    <div className="container mx-auto py-8">
      <main>
        <div className="text-sm text-muted-foreground mb-4 flex items-center">
          <Link href="/" className="hover:text-primary">Anasayfa</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
           <Link href="/kus-ilanlari" className="hover:text-primary">Kuş İlanları</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-semibold text-foreground">{breedName}</span>
        </div>

         <h1 className="text-3xl font-bold font-headline mb-6">
            {breedName} İlanları
        </h1>

        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
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
      </main>
    </div>
  );
}
