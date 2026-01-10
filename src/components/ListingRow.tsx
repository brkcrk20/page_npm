
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Pet } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface ListingRowProps {
  pet: Pet;
}

export function ListingRow({ pet }: ListingRowProps) {
  const image = PlaceHolderImages.find((img) => img.id === pet.image);
  const hasBadge = pet.badge === 'Guvenli Uye' || pet.badge === 'Doping';

  return (
    <Link href={`/ilan/${pet.id}`} className="block w-full">
      <div className={cn(
        "flex flex-col sm:flex-row items-center w-full border-b p-2 bg-white hover:bg-secondary/50 relative overflow-hidden transition-colors duration-200",
        hasBadge && "border-l-4 border-l-red-500"
      )}>

        {hasBadge && (
          <div className="absolute -right-10 top-3 rotate-45 bg-red-500 text-center text-white font-semibold text-[10px] px-8 py-0.5 shadow-md">
            {pet.badge?.replace(' ', '\u00A0')}
          </div>
        )}

        <div className="w-full sm:w-24 h-32 sm:h-20 flex-shrink-0 relative mb-2 sm:mb-0 mr-0 sm:mr-4">
          {image ? (
            <Image
              src={image.imageUrl}
              alt={pet.name}
              fill
              className="object-cover rounded-md"
              data-ai-hint={image.imageHint}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground rounded-md">
              No Image
            </div>
          )}
        </div>

        <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 items-center w-full">
          <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
            <h3 className="text-base font-bold text-red-600 hover:underline leading-tight">
              {pet.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {pet.breed} - {pet.age}
            </p>
          </div>

          <div className="text-sm font-medium text-center">{pet.age}</div>
          
          <div className="text-sm font-bold text-red-600 text-center">{pet.breed}</div>

          <div className="text-sm text-muted-foreground text-center flex flex-col items-center justify-center">
            <span>10 Ocak</span>
            <span>2026</span>
          </div>

        </div>
          <div className="hidden sm:flex text-sm text-muted-foreground items-center justify-center w-48 ml-4">
             <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{pet.location}</span>
          </div>
      </div>
    </Link>
  );
}
