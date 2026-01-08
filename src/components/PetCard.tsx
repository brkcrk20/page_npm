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
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 hover:shadow-xl group bg-white">
      <CardHeader className="p-0 relative">
        <Link href={`/listings/${pet.id}`}>
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
        </Link>
        {pet.badge && (
          <Badge className="absolute top-2 left-2" variant={pet.badge === 'Bireysel' ? 'default' : 'secondary'}>
            {pet.badge}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <h3 className="text-lg font-bold">{pet.name}</h3>
        <p className="text-sm text-muted-foreground">{pet.breed}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{pet.location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <span className={`font-bold ${pet.listingType === 'Adoption' ? 'text-green-600' : 'text-blue-600'}`}>
          {pet.listingType === 'Adoption' ? 'Ücretsiz' : 'Ücretli'}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/listings/${pet.id}`}>İncele</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
