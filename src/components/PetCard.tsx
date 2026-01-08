import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <CardHeader className="p-0 relative">
        <Link href={`/listings/${pet.id}`}>
          <div className="aspect-[3/2] w-full">
            {image ? (
              <Image
                src={image.imageUrl}
                alt={pet.name}
                width={600}
                height={400}
                className="object-cover w-full h-full"
                data-ai-hint={image.imageHint}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
        </Link>
        {pet.listingType === 'Adoption' ? (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">Yuva Arıyor</Badge>
        ) : (
           <Badge variant="secondary" className="absolute top-2 right-2">Satılık</Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="text-lg font-bold font-headline">{pet.name}</h3>
        <p className="text-sm text-muted-foreground">{pet.breed}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{pet.location}</span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/listings/${pet.id}`}>Detaylar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
