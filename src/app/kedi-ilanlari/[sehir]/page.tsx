'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PetCard } from '@/components/PetCard';
import { ListingRow } from '@/components/ListingRow';
import { ChevronRight, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function KediSehirPage() {
  const params = useParams();
  const sehir = params.sehir as string;
  
  const sehirAdi = sehir === 'istanbul' ? 'İstanbul' : 
                   sehir === 'izmir' ? 'İzmir' :
                   sehir === 'ankara' ? 'Ankara' :
                   sehir === 'bursa' ? 'Bursa' :
                   sehir === 'antalya' ? 'Antalya' :
                   sehir.charAt(0).toUpperCase() + sehir.slice(1);
  
  const [realPets, setRealPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const listingsPerPage = viewMode === 'grid' ? 12 : 20;

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        const q = query(
          collection(firestore, 'ilanlar'),
          where('hayvanTuru', '==', 'kedi'),
          where('sehir', '==', sehirAdi),
          where('onayDurumu', '==', 'onaylandi')
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
  }, [sehirAdi]);

  const totalPages = Math.ceil(realPets.length / listingsPerPage);
  const paginatedListings = realPets.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  if (realPets.length === 0) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">İlan Bulunamadı</h1>
        <p className="text-muted-foreground mb-8">{sehirAdi} şehrinde kedi ilanı bulunamadı.</p>
        <Link href="/kedi-ilanlari" className="text-primary hover:underline">← Tüm Kedi İlanlarına Dön</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-sm text-muted-foreground mb-4 flex items-center">
        <Link href="/" className="hover:text-primary">Anasayfa</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/kedi-ilanlari" className="hover:text-primary">Kedi İlanları</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-semibold text-foreground">{sehirAdi}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{sehirAdi} Kedi İlanları</h1>
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
              <span className="px-4 py-2">Sayfa {currentPage} / {totalPages}</span>
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
    </div>
  );
}