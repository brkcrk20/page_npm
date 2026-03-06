'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PetCard } from '@/components/PetCard';
import { ListingRow } from '@/components/ListingRow';
import { ChevronRight, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function CinsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [realPets, setRealPets] = useState<any[]>([]);
  const [cinsAdi, setCinsAdi] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = viewMode === 'grid' ? 12 : 20;

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        // SADECE ID'den cins adını bul
        const cinsRef = doc(firestore, 'cinsler', id);
        const cinsSnap = await getDoc(cinsRef);
        
        if (!cinsSnap.exists()) {
          setLoading(false);
          return;
        }
        
        const cinsData = cinsSnap.data();
        const cinsAdiFromDb = cinsData.cinsAdi || '';
        setCinsAdi(cinsAdiFromDb);
        
        // Bu cinse ait ilanları çek
        const q = query(
          collection(firestore, 'ilanlar'),
          where('cins', '==', cinsAdiFromDb),
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
  }, [id]);

  const totalPages = Math.ceil(realPets.length / listingsPerPage);
  const paginatedListings = realPets.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold">Yükleniyor...</div>;
  }

  if (!cinsAdi) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground mb-4 flex items-center">
        <Link href="/" className="hover:text-primary">Anasayfa</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/kopek-ilanlari" className="hover:text-primary">Köpek İlanları</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-semibold text-foreground">{cinsAdi}</span>
      </div>

      {/* Başlık ve Görünüm Değiştirme */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{cinsAdi}</h1>
          <p className="text-muted-foreground">{realPets.length} ilan bulundu</p>
        </div>
        
        {/* Görünüm Değiştirme Butonları */}
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value: string) => {
            if (value === 'grid' || value === 'list') {
              setViewMode(value);
              setCurrentPage(1); // Sayfayı sıfırla
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

      {realPets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-lg text-muted-foreground">Bu cinse ait ilan bulunmamaktadır.</p>
          <Link href="/kopek-ilanlari" className="text-primary hover:underline mt-4 inline-block">
            Tüm Köpek İlanlarına Dön
          </Link>
        </div>
      ) : (
        <>
          {/* İlanlar - Grid veya Liste Görünümü */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-1">
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

          {/* Sayfalama */}
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
        </>
      )}
    </div>
  );
}