'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, BadgeCheck } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PetCardProps {
  pet: any; // Hem statik Pet hem de veritabanı PetListing tipini desteklemesi için any kullanıyoruz
}

export function PetCard({ pet }: PetCardProps) {
  // 1. RESİM MANTIĞI: Veritabanından gelen imageUrl varsa onu al, 
  // yoksa statik id'yi PlaceHolderImages içinde ara.
  const staticImage = PlaceHolderImages.find((img) => img.id === pet.image);
  const displayImageUrl = pet.imageUrl || staticImage?.imageUrl || "/placeholder-pet.png";

  // 2. ROZET MANTIĞI
  const isGuvenliUye = pet.badge === 'Guvenli Uye';
  const isDoping = pet.badge === 'Doping';
  const isSale = pet.listingType === 'Sale' || (pet.price && Number(pet.price) > 0);

  // 3. YAŞ MANTIĞI: Veritabanından sayı gelirse replace hata vermesin diye String'e çeviriyoruz
  const displayAge = String(pet.age).replace(/years?/, 'yaşında');

  // 4. ROTA MANTIĞI: Veritabanı ilanları için /listings/, statik olanlar için /ilan/ 
  // veya hepsini yeni rotamız olan /listings/ üzerine yönlendirebiliriz.
  const href = pet.imageUrl ? `/ilanlar/${pet.id}` : `/ilan/${pet.id}`;

  return (
    <Link href={href} className="group block h-full">
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-primary">
        <div className="relative overflow-hidden aspect-square bg-gray-100">
          
          {/* Rozetler */}
          {isGuvenliUye && (
             <div className="absolute top-0 left-0 z-10 w-full overflow-hidden" style={{ transform: 'translate(-30.5%, -30.5%) rotate(-45deg)'}}>
                <div className="absolute top-7 left-0 bg-red-600 text-center text-white font-semibold py-1 w-full text-[10px] shadow-lg">
                    <div>GÜVENLİ ÜYE</div>
                </div>
            </div>
          )}

          {isDoping && (
              <div className='absolute top-2 left-2 z-10 bg-yellow-400 text-black rounded-full p-1.5 shadow-md'>
                  <BadgeCheck className='w-4 h-4' />
              </div>
          )}

          {isSale && (
            <div className="absolute top-2 right-2 z-10 bg-[#f05a28] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              SATILIK
            </div>
          )}
          
          {/* Ana Görsel */}
          <Image
            src={displayImageUrl}
            alt={pet.name}
            fill
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            unoptimized={pet.imageUrl ? true : false} // Firebase resimlerinde optimizasyon hatasını önlemek için
          />
        </div>

        <CardContent className="p-3 flex-grow flex flex-col">
          <div className='flex-grow'>
            <div className="flex justify-between items-start gap-1 mb-1">
              <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                {pet.name}
              </h3>
              {pet.price && (
                <span className="text-[11px] font-bold text-[#f05a28] whitespace-nowrap">
                  {Number(pet.price).toLocaleString()} TL
                </span>
              )}
            </div>
            
            <div className="text-xs text-center space-y-0.5">
                <p className="text-primary font-semibold">{displayAge}</p>
                <p className="font-bold text-gray-800 truncate">{pet.breed}</p>
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