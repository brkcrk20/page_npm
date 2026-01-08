'use client';

import { HeartHandshake } from 'lucide-react';
import { PetCard } from '@/components/PetCard';
import { pets } from '@/lib/data'; // Assuming you might want to show some pets here as examples

export default function MatingPage() {
  // In a real scenario, you would fetch pets available for mating
  const matingPets = pets.filter(p => p.listingType === 'Sale').slice(0, 4); // Example filter
  
  return (
    <div className="container mx-auto py-12">
      {matingPets.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {matingPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 col-span-full">
          <HeartHandshake className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Şu anda eş arayan ilan bulunmamaktadır.</p>
          <p className="text-muted-foreground">Lütfen daha sonra tekrar kontrol edin veya ilk ilanı siz verin!</p>
        </div>
      )}
    </div>
  );
}
