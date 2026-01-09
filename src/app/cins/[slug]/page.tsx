
'use client';

import { useParams } from 'next/navigation';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint } from 'lucide-react';

const unslugify = (slug: string) => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export default function BreedPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const breedName = unslugify(slug || '');

  const filteredPets = pets.filter(
    (pet) => slugify(pet.breed) === slug
  );

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">
          <span className="text-primary">{breedName}</span> İlanları
        </h1>
        <p className="text-muted-foreground">{filteredPets.length} ilan bulundu.</p>
      </div>

      {filteredPets.length > 0 ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg">
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
  );
}
