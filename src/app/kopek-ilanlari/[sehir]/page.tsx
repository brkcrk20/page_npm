'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PetCard } from '@/components/PetCard';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ListingRow } from '@/components/ListingRow';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from '@/components/ui/pagination';

import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function KopekSehirPage() {
  const params = useParams();
  const sehir = params.sehir as string;
  const sehirAdi = sehir.charAt(0).toUpperCase() + sehir.slice(1);
  
  const [realPets, setRealPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        const q = query(
          collection(firestore, 'ilanlar'),
          where('hayvanTuru', '==', 'kopek'),
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
    return <div className="flex h-screen items-center justify-center font-bold">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-sm text-muted-foreground mb-4 flex items-center">
        <Link href="/" className="hover:text-primary">Anasayfa</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/kopek-ilanlari" className="hover:text-primary">Köpek İlanları</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-semibold text-foreground">{sehirAdi}</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">{sehirAdi} Köpek İlanları</h1>
      <p className="text-muted-foreground mb-8">{realPets.length} ilan bulundu</p>

      <div className="space-y-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {paginatedListings.map((pet: any) => (
          <ListingRow key={pet.id} pet={pet} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          {/* Pagination component aynen kopyala */}
        </Pagination>
      )}
    </div>
  );
}