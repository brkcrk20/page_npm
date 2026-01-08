import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ShieldCheck } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);
  const isSecure = pet.badge === 'Ruhsatlı';

  return (
    <Link href={`/listings/${pet.id}`} className="group block">
      <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl bg-white border-orange-200 hover:border-primary">
        <div className="relative overflow-hidden aspect-square">
          {isSecure && (
            <div className="absolute top-0 left-0 z-10 w-32 h-32 overflow-hidden">
              <div className="absolute top-4 -left-10 transform -rotate-45 bg-red-600 text-center text-white font-semibold py-1 w-40 text-xs">
                <ShieldCheck className="w-3 h-3 inline-block mr-1" />
                Güvenli
              </div>
            </div>
          )}
          {image ? (
            <Image
              src={image.imageUrl}
              alt={pet.name}
              fill
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              data-ai-hint={image.imageHint}
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-2">
          <div>
            <h3 className="text-base font-semibold truncate mb-1 group-hover:text-primary transition-colors">{pet.name}</h3>
            <div className="text-xs text-center space-y-0.5">
                <p className="text-primary font-semibold">{pet.age}</p>
                <p className="font-bold text-gray-800">{pet.breed}</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
