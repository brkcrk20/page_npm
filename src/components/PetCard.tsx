import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ShieldCheck, BadgeCheck } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
}

export function PetCard({ pet }: PetCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);
  const isGuvenliUye = pet.badge === 'Guvenli Uye';
  const isDoping = pet.badge === 'Doping';

  return (
    <Link href={`/ilan/${pet.id}`} className="group block">
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-primary">
        <div className="relative overflow-hidden aspect-square">
          
          {isGuvenliUye && (
             <div className="absolute top-0 left-0 z-10 w-full overflow-hidden" style={{ transform: 'translate(-30.5%, -30.5%) rotate(-45deg)'}}>
                <div className="absolute top-7 left-0 bg-red-600 text-center text-white font-semibold py-1 w-full text-[10px] shadow-lg">
                    <div style={{transform: 'rotate(0deg)'}}>GÜVENLİ ÜYE</div>
                </div>
            </div>
          )}

          {isDoping && (
              <div className='absolute top-2 left-2 z-10 bg-yellow-400 text-black rounded-full p-1.5 shadow-md'>
                  <BadgeCheck className='w-4 h-4' />
              </div>
          )}
          
          {image ? (
            <Image
              src={image.imageUrl}
              alt={pet.name}
              fill
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              data-ai-hint={image.imageHint}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-3 flex-grow flex flex-col">
          <div className='flex-grow'>
            <h3 className="text-sm font-semibold truncate mb-1 group-hover:text-primary transition-colors leading-tight">{pet.name}</h3>
            <div className="text-xs text-center space-y-0.5">
                <p className="text-primary font-semibold">{pet.age}</p>
                <p className="font-bold text-gray-800">{pet.breed}</p>
            </div>
          </div>
          <div className="flex items-center justify-center text-xs text-muted-foreground mt-2 pt-2 border-t">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
