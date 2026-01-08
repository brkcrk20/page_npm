'use client';

import { HeartHandshake } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PetCard } from '@/components/PetCard';
import { pets } from '@/lib/data'; // Assuming you might want to show some pets here as examples

export default function MatingPage() {
  // In a real scenario, you would fetch pets available for mating
  const matingPets = pets.filter(p => p.listingType === 'Sale').slice(0, 4); // Example filter
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-dog') ?? { imageUrl: 'https://picsum.photos/seed/mating-hero/1200/400', description: 'Two dogs playing together', imageHint: 'dogs playing' };

  return (
    <div>
      <section className="relative w-full h-64 bg-primary/10">
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="relative container mx-auto h-full flex flex-col items-start justify-end text-white pb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            Eş Arayanlar
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-primary-foreground/80">
            Sevimli dostunuz için bir eş bulun ve soyunu devam ettirin.
          </p>
        </div>
      </section>

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
    </div>
  );
}
