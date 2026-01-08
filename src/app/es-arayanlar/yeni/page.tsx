import Image from 'next/image';
import { CreateMatingListingForm } from './CreateMatingListingForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { HeartHandshake } from 'lucide-react';

export default function NewMatingListingPage() {
  // Using a relevant image, can be customized later
  const heroImage = PlaceHolderImages.find((img) => img.id === 'pet-1'); 

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
           <HeartHandshake className="w-16 h-16 mb-4 text-primary-foreground drop-shadow-lg" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            Yeni Eşleştirme İlanı
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Dostunuz için aradığınız eşi bulmak için ilanı doldurun.
          </p>
        </div>
      </section>

      <div className="container mx-auto py-10 -mt-20 relative z-10">
        <CreateMatingListingForm />
      </div>
    </div>
  );
}
