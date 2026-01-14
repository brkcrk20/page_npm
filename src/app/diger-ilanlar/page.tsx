
'use client';

import { useState } from 'react';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';
import { ListingRow } from '@/components/ListingRow';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export default function OtherPage() {
  const filteredPets = pets.filter((pet) => pet.type === 'Other');
  const featuredPets = filteredPets.filter(p => p.featured).slice(0, 4);
  const allPetsInCategory = filteredPets;
  const category = categories.find(c => c.type === 'Other');
  
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  const totalPages = Math.ceil(allPetsInCategory.length / listingsPerPage);
  const paginatedListings = allPetsInCategory.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );


  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside className="col-span-1">
           <BreedPageSidebar 
            categoryName={category.title}
            categoryCount={filteredPets.length}
            categorySlug={category.slug}
            breeds={category.breeds}
          />
        </aside>
        <main className="col-span-1">
            <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-foreground">Diğer İlanlar</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>Diğer İlanlar</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
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
                    <p className="mt-4 font-semibold">Bu kategoride yıldızlı ilan bulunamadı.</p>
                 </div>
              )}
            </div>

            {/* Promotion Banner */}
            <div className="my-8 p-3 bg-red-100/50 border border-red-200 text-red-700 text-sm text-center rounded-lg">
                İlanınız yukarıda yer alsın, alıcılara daha kısa sürede ulaşın! <Link href="#" className="font-bold underline hover:text-red-800">Detaylı bilgi için tıklayın.</Link>
            </div>
            
            {/* Standard List Section */}
            <div>
              {paginatedListings.length > 0 ? (
                <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg">
                  {paginatedListings.map((pet) => (
                    <ListingRow key={pet.id} pet={pet} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                    <PawPrint className="mx-auto h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">
                    Bu kategoride henüz ilan bulunamadı.
                    </p>
                    <p className="text-muted-foreground">
                    Lütfen daha sonra tekrar kontrol edin veya farklı bir kategoriye göz atın.
                    </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination className="mt-8">
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.max(1, p - 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                         <PaginationItem key={i}>
                            <PaginationLink 
                                href="#"
                                isActive={currentPage === i + 1}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(i + 1)
                                }}
                            >
                                {i + 1}
                            </PaginationLink>
                         </PaginationItem>
                    ))}
                    <PaginationItem>
                    <PaginationNext 
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                     />
                    </PaginationItem>
                </PaginationContent>
                </Pagination>
            )}

             {/* Article Section */}
            <div className="mt-16 border-t pt-12">
                <h2 className="text-3xl font-bold font-headline mb-4 text-gray-800 flex items-center gap-3"><BookOpen />Egzotik Evcil Hayvanlar</h2>
                <div className="prose max-w-none text-muted-foreground space-y-4">
                    <p>
                        Kedi ve köpeklerin dışında, tavşan, hamster, kaplumbağa gibi farklı türde evcil hayvanlar da hayatımıza renk katar. Bu hayvanların bakımları özel bilgi gerektirebilir.
                    </p>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
