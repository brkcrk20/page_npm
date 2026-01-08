import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);
  const isSecure = pet.badge === 'Ruhsatlı';

  return (
    <Link href={`/listings/${pet.id}`} className="group block">
      <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl bg-white h-full border-orange-200 hover:border-primary">
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden">
            {image ? (
              <Image
                src={image.imageUrl}
                alt={pet.name}
                width={600}
                height={450}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                data-ai-hint={image.imageHint}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          {isSecure && (
             <div className="absolute top-0 right-0 z-10">
                <div className="relative py-1 px-4 bg-red-600 text-white text-xs font-bold uppercase -mr-2 mt-2">
                    GÜVENLİ ÜYE
                    <div className="absolute top-full right-0 w-0 h-0 border-t-8 border-t-red-800 border-l-8 border-l-transparent"></div>
                </div>
            </div>
          )}
        </div>
        <CardContent className="p-3 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold truncate mb-2 group-hover:text-primary transition-colors">{pet.name}</h3>
            <div className="text-sm text-center space-y-1">
                <p className="text-primary font-semibold">{pet.age}</p>
                <p className="font-bold text-gray-800">{pet.breed}</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
