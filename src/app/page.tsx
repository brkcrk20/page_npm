import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Cat,
  Dog,
  Bird,
  Stethoscope,
  Building,
  Medal,
  Scissors,
  Car,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetCard } from '@/components/PetCard';
import { ServiceCard } from '@/components/ServiceCard';
import { featuredPets, services } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-dog');

  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[60vh] md:h-[70vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
            En yakın dostunu bul
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/80">
            Evcil Hayvan Sahiplenme ve Hizmet Platformu
          </p>
          <div className="mt-8 w-full max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Arama..."
                className="w-full pl-10 h-14 rounded-full text-base"
              />
              <Button
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
              >
                Ara
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="secondary" className="rounded-full">
                <Dog className="mr-2" /> Köpek
              </Button>
              <Button variant="secondary" className="rounded-full">
                <Cat className="mr-2" /> Kedi
              </Button>
              <Button variant="secondary" className="rounded-full">
                <Bird className="mr-2" /> Kuş
              </Button>
              <Button variant="secondary" className="rounded-full">
                Diğer
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-headline font-bold">Yıldızlı İlanlar</h2>
            <Button variant="link" asChild>
              <Link href="/listings">
                Tümünü Gör <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-secondary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-headline font-bold">Hizmetler</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Evcil dostlarınız için ihtiyacınız olan her şey bir arada.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
            <ServiceCard icon={<Stethoscope />} title="Veteriner" />
            <ServiceCard icon={<Building />} title="Pet Otel" />
            <ServiceCard icon={<Medal />} title="Eğitmen" />
            <ServiceCard icon={<Scissors />} title="Pet Kuaför" />
            <ServiceCard icon={<Car />} title="Pet Taksi" />
          </div>
           <Button asChild size="lg" className="mt-10">
              <Link href="/services">Tüm Hizmetleri Keşfet</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
