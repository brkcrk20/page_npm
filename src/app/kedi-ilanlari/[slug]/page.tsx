
'use client';

import { useParams } from 'next/navigation';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight, BookOpen, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/lib/breeds';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { ListingRow } from '@/components/ListingRow';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export default function CatBreedPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const category = categories.find(c => c.type === 'Cat');
  const breed = category?.breeds.find(b => b.slug === slug);
  const breedName = breed ? breed.name : 'Bilinmeyen Cins';
  
  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  const filteredPets = pets.filter(
    (pet) => pet.type === 'Cat' && pet.breed === breedName
  );

  const featuredPets = filteredPets.filter(p => p.featured).slice(0, 4);
  const standardPets = filteredPets.filter(p => !p.featured);
  const categoryCount = pets.filter(p => p.type === 'Cat').length;

  const mockReviews = [
    {
      id: 1,
      author: "ScottishFoldHayranı",
      avatar: "https://i.pravatar.cc/150?img=11",
      comment: "Bu cinsin kulak yapısı ve sakin karakteri harika. Sahiplenmeden önce genetik hastalıkları hakkında bilgi edinmek önemli.",
      date: "2 gün önce"
    }
  ];

  return (
    <div className="container mx-auto py-8">
       <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside className="col-span-1">
           <BreedPageSidebar 
            categoryName={category.title}
            categoryCount={categoryCount}
            categorySlug={category.slug}
            breeds={category.breeds}
            breedName={breedName}
            breedCount={filteredPets.length}
          />
        </aside>
        <main className="col-span-1">
           <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/kedi-ilanlari" className="hover:text-primary">Kedi İlanları</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-foreground">{breedName}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                <span className='font-bold text-primary'>{breedName}</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
            </p>

            {/* Vitrin Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Yıldızlı İlanlar</h2>
              {featuredPets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredPets.map((pet) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </div>
              ) : (
                 <div className="text-center py-10 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                    <PawPrint className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Bu cinse ait yıldızlı ilan bulunamadı.</p>
                 </div>
              )}
            </div>

            {/* Promotion Banner */}
            <div className="my-8 p-3 bg-red-100/50 border border-red-200 text-red-700 text-sm text-center rounded-lg">
                İlanınız yukarıda yer alsın, alıcılara daha kısa sürede ulaşın! <Link href="#" className="font-bold underline hover:text-red-800">Detaylı bilgi için tıklayın.</Link>
            </div>
            
            {/* Standard List Section */}
            <div>
                {standardPets.length > 0 ? (
                <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg">
                    {standardPets.map((pet) => (
                    <ListingRow key={pet.id} pet={pet} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                    <PawPrint className="mx-auto h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">
                    Aradığınız <span className="font-bold text-primary">{breedName}</span> cinsine ait ilan bulunamadı.
                    </p>
                    <p className="text-muted-foreground">
                    Lütfen daha sonra tekrar kontrol edin veya farklı bir cins arayın.
                    </p>
                </div>
                )}
            </div>

            {/* Pagination */}
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* Popular Listings */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">Popüler {breedName} İlanları</h2>
                <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredPets.slice(0, 4).map((pet) => (
                            <PetCard key={pet.id} pet={pet} />
                        ))}
                    </div>
                </div>
            </div>

             {/* Reviews */}
            <div className="mt-16">
                <div className="flex items-center gap-2 mb-6">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">{breedName} Cinsi Hakkında Yorumlar</h2>
                </div>
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <Card key={review.id} className="p-0">
                      <CardContent className="p-6 flex gap-4">
                          <Avatar>
                              <AvatarImage src={review.avatar} alt={review.author} />
                              <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-semibold">{review.author}</h4>
                                  <span className="text-xs text-muted-foreground">{review.date}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                          </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </div>

            {/* Article Section */}
            <div className="mt-16 border-t pt-12">
                <h2 className="text-3xl font-bold font-headline mb-4 text-gray-800 flex items-center gap-3"><BookOpen />{breedName} Bakımı ve Karakteri</h2>
                <div className="prose max-w-none text-muted-foreground space-y-4">
                    <p>
                        {breedName}, kendine özgü görünüşü ve sevecen karakteriyle en popüler kedi ırklarından biridir. Sakin ve uysal yapıları, onları harika birer ev arkadaşı yapar.
                    </p>
                    <h3 className="text-2xl font-bold font-headline text-gray-700 !mt-6 !mb-2">Tüy Bakımı</h3>
                    <p>
                        Bu cinsin tüy yapısına göre bakım ihtiyacı değişir. Shorthair olanlar haftada bir fırçalanmaya ihtiyaç duyarken, Longhair olanların tüy yumaklarını önlemek için daha sık taranması gerekebilir.
                    </p>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
