import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);

  return (
    <Link href={`/listings/${pet.id}`} className="group">
      <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:shadow-xl bg-white h-full">
        <CardHeader className="p-0 relative">
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
        </CardHeader>
        <CardContent className="p-3 flex-grow flex flex-col">
          <h3 className="text-lg font-bold truncate">{pet.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">{pet.breed}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
