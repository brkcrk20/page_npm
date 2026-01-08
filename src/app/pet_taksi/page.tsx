'use client';

import {
  Car,
  Phone,
  MapPin,
  Star,
  Clock,
  Wind,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { services } from "@/lib/data";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function PetTaxiPage() {
  const petTaxiServices = services.filter(s => s.type === 'Pet Taxi');
  const heroImage = PlaceHolderImages.find(img => img.id === 'pet-taxi-hero') ?? { imageUrl: 'https://picsum.photos/seed/pet-taxi-hero/1200/400', description: 'A dog looking out of a car window', imageHint: 'dog car' };

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
            Pet Taksi Hizmetleri
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-primary-foreground/80">
            Dostlarınız için güvenli, konforlu ve zamanında ulaşım çözümleri.
          </p>
        </div>
      </section>

      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {petTaxiServices.map((service) => (
            <Card key={service.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden group">
              <div className='relative h-48 w-full'>
                 <Image
                    src="https://picsum.photos/seed/pet-taxi-car/400/300"
                    alt={`${service.name} aracı`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="pet taxi car"
                />
              </div>
              <CardHeader className="flex-row items-start gap-4 pb-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <Car className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-headline text-xl">{service.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{service.location}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-primary" />
                  <a href={`tel:${service.contact}`} className="hover:underline">{service.contact}</a>
                </div>
                 <div className="flex items-center text-sm text-yellow-500 font-semibold">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  <Star className="w-4 h-4 mr-2 fill-current" />
                  <span>4.9 (28 yorum)</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
                  <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> 7/24 Hizmet</Badge>
                  <Badge variant="outline" className="flex items-center gap-1"><Globe className="w-3 h-3" /> Şehirlerarası</Badge>
                  <Badge variant="outline" className="flex items-center gap-1"><Wind className="w-3 h-3" /> Klimalı Araçlar</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {petTaxiServices.length === 0 && (
          <div className="text-center py-20 col-span-full">
            <Car className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Şu anda listelenecek pet taksi hizmeti bulunmamaktadır.</p>
            <p className="text-muted-foreground">Lütfen daha sonra tekrar kontrol edin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
