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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function KediIlanlariContent() {
  const searchParams = useSearchParams();
  const cinsFiltre = searchParams.get('cins') || '';

  const [realPets, setRealPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const listingsPerPage = viewMode === 'grid' ? 12 : 20;

  // Kedi kategorisini bul
  const category = categories.find(c => c.type === 'Cat');

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        const baseFilters = [
          where('hayvanTuru', '==', 'kedi'),
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
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar - KEDİ cinsleri gösterilmeli! */}
        <aside className="col-span-1">
          <BreedPageSidebar 
            categoryName={category?.title || 'Kedi'}
            categoryCount={realPets.length}
            categorySlug={category?.slug || 'kedi'}
            breeds={category?.breeds || []}
            breedName={cinsFiltre || undefined}
          />
        </aside>

        <main className="col-span-1">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/kedi-ilanlari" className="hover:text-primary">Kedi İlanları</Link>
            {cinsFiltre && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="font-semibold text-foreground">{cinsFiltre}</span>
              </>
            )}
          </div>

          {/* Başlık ve Görünüm Değiştirme */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{cinsFiltre ? cinsFiltre : 'Kedi İlanları'}</h1>
              <p className="text-muted-foreground">{realPets.length} ilan bulundu</p>
            </div>
            
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value: string) => {
                if (value === 'grid' || value === 'list') {
                  setViewMode(value);
                }
              }}
            >
              <ToggleGroupItem value="grid" aria-label="Grid görünüm">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Liste görünüm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Vitrin Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Yıldızlı İlanlar</h2>
            {featuredPets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredPets.map((pet: any) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg bg-secondary/30">
                <PawPrint className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold">Bu kategoride yıldızlı ilan bulunamadı.</p>
              </div>
            )}
          </div>

          {/* Reklam Bandı */}
          <div className="my-8 p-3 bg-red-100/50 border border-red-200 text-red-700 text-sm text-center rounded-lg">
            İlanınız yukarıda yer alsın! <Link href="/ilan/yeni" className="font-bold underline hover:text-red-800">Hemen İlan Ver</Link>
          </div>

          {/* Liste Kısmı */}
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedListings.map((pet: any) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {paginatedListings.map((pet: any) => (
                  <ListingRow key={pet.id} pet={pet} />
                ))}
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
                <PaginationItem>
                  <span className="px-4 py-2">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
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

export default function KediIlanlariPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Yükleniyor...</div>}>
      <KediIlanlariContent />
    </Suspense>
  );
}