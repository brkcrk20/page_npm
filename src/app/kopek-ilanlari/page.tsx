'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';
import { ListingRow } from '@/components/ListingRow';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// FIREBASE BAĞLANTISI
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function KopekIlanlariContent() {
  const searchParams = useSearchParams();
  const cinsFiltre = searchParams.get('cins') || '';

  const [realPets, setRealPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  const category = categories.find(c => c.type === 'Dog');

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        const baseFilters = [
          where('hayvanTuru', '==', 'kopek'),
          where('onayDurumu', '==', 'onaylandi'),
        ];
        if (cinsFiltre) {
          baseFilters.push(where('cins', '==', cinsFiltre));
        }

        const q = query(
          collection(firestore, 'ilanlar'),
          ...baseFilters
        );
        
        const querySnapshot = await getDocs(q);
        const petData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRealPets(petData);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [cinsFiltre]);

  const featuredPets = realPets.filter((p: any) => p.vitrinMi === true).slice(0, 4);
  const totalPages = Math.ceil(realPets.length / listingsPerPage);
  const paginatedListings = realPets.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside className="col-span-1">
          <BreedPageSidebar 
            categoryName={category?.title || 'Köpek'}
            categoryCount={realPets.length}
            categorySlug={category?.slug || 'kopek'}
            breeds={category?.breeds || []}
            breedName={cinsFiltre || undefined}
          />
        </aside>

        <main className="col-span-1">
          <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/kopek-ilanlari" className="hover:text-primary">Köpek İlanları</Link>
            {cinsFiltre && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="font-semibold text-foreground">{cinsFiltre}</span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>{cinsFiltre ? cinsFiltre : 'Köpek İlanları'}</span> kategorisinde <span className='font-bold text-foreground'>{realPets.length}</span> ilan bulundu.
          </p>
          
          {/* Vitrin Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Yıldızlı İlanlar</h2>
            {featuredPets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredPets.map((pet: any) => (
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

          <div className="my-8 p-3 bg-red-100/50 border border-red-200 text-red-700 text-sm text-center rounded-lg">
            İlanınız yukarıda yer alsın! <Link href="/ilan-ver" className="font-bold underline hover:text-red-800">Hemen İlan Ver</Link>
          </div>

          {/* Liste Kısmı */}
          <div>
            {paginatedListings.length > 0 ? (
              <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {paginatedListings.map((pet: any) => (
                  <ListingRow key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 col-span-full border-2 border-dashed rounded-lg bg-secondary/30">
                <PawPrint className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">Bu kategoride henüz ilan bulunamadı.</p>
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
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                  }
                  if (pageNum <= totalPages) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                          }}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
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
        </main>
      </div>
    </div>
  );
}

export default function KopekIlanlariPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold">Yükleniyor...</div>}>
      <KopekIlanlariContent />
    </Suspense>
  );
}