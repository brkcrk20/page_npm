'use client';

import { HeartHandshake, PlusCircle } from 'lucide-react';
import { PetCard } from '@/components/PetCard';
import { pets } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';

export default function MatingPage() {
  const { user } = useUser();
  // In a real scenario, you would fetch pets available for mating
  const matingPets = pets.filter(p => p.listingType === 'Sale').slice(0, 4); // Example filter

  return (
    <div className="container mx-auto py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Eş Arayanlar</h1>
        <Button asChild>
          <Link href={user ? "/es-arayanlar/yeni" : "/giris"}>
            <PlusCircle className="mr-2 h-4 w-4" /> İlan Ekle
          </Link>
        </Button>
      </div>
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
