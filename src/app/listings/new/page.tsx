import Image from 'next/image';
import { CreateListingForm } from './CreateListingForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function NewListingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'listing-new-hero');

  return (
    <div>
      <section className="relative w-full h-[40vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            Yeni Bir İlan Oluştur
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Dostuna yeni bir yuva bul veya hizmetlerini listele.
          </p>
        </div>
      </section>

      <div className="container mx-auto py-10 -mt-20 relative z-10">
        <CreateListingForm />
      </div>
    </div>
  );
}
