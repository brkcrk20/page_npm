'use client';

import {
  Award,
  Phone,
  MapPin,
  Star,
  BookOpen,
  Users,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { services } from "@/lib/data";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function TrainerPage() {
  const trainerServices = services.filter(s => s.type === 'Trainer');

  return (
    <div className="container mx-auto py-12">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-headline">Profesyonel Evcil Hayvan Eğitmenleri</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trainerServices.map((service) => (
          <Card key={service.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden group">
            <div className='relative h-48 w-full'>
               <Image
                  src="https://picsum.photos/seed/trainer-session/400/300"
                  alt={`${service.name} eğitim seansı`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint="dog training session"
              />
            </div>
            <CardHeader className="flex-row items-start gap-4 pb-4">
              <div className="w-16 h-16 flex-shrink-0 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <Award className="w-8 h-8" />
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
                <span>5.0 (18 yorum)</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
                <Badge variant="outline" className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> Temel İtaat</Badge>
                <Badge variant="outline" className="flex items-center gap-1"><Users className="w-3 h-3" /> Grup Dersleri</Badge>
                <Badge variant="outline" className="flex items-center gap-1"><Shield className="w-3 h-3" /> Davranış Düzeltme</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {trainerServices.length === 0 && (
        <div className="text-center py-20 col-span-full">
          <Award className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Şu anda listelenecek eğitmen bulunmamaktadır.</p>
          <p className="text-muted-foreground">Lütfen daha sonra tekrar kontrol edin.</p>
        </div>
      )}
    </div>
  );
}
