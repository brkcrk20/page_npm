import { Stethoscope, Phone, MapPin, Ambulance } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { services } from "@/lib/data";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function VeterinarianPage() {
  const vetServices = services.filter(s => s.type === 'Veterinarian');
  const heroImage = PlaceHolderImages.find(img => img.id === 'vet-hero') ?? { imageUrl: 'https://picsum.photos/seed/vet-hero/1200/400', description: 'Veterinarian attending a pet', imageHint: 'veterinarian pet' };

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
            Veteriner Hizmetleri
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-primary-foreground/80">
            Minik dostlarınızın sağlığı için en iyi veteriner klinikleri.
          </p>
        </div>
      </section>

      <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vetServices.map((service) => (
            <Card key={service.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex-row items-start gap-4 pb-4">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Stethoscope className="w-8 h-8" />
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
                <p className="text-sm text-muted-foreground italic">
                  "Sevgiyle ve uzmanlıkla, evcil hayvanlarınızın sağlığı bizim önceliğimizdir."
                </p>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-primary" />
                  <a href={`tel:${service.contact}`} className="hover:underline">{service.contact}</a>
                </div>
                <div className="flex items-center text-sm font-semibold text-green-600">
                  <Ambulance className="w-4 h-4 mr-2" />
                  <span>7/24 Acil Servis</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">Muayene</Badge>
                  <Badge variant="secondary">Aşı</Badge>
                  <Badge variant="secondary">Cerrahi</Badge>
                  <Badge variant="secondary">Laboratuvar</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {vetServices.length === 0 && (
          <div className="text-center py-20 col-span-full">
            <Stethoscope className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Şu anda listelenecek veteriner hizmeti bulunmamaktadır.</p>
            <p className="text-muted-foreground">Lütfen daha sonra tekrar kontrol edin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
