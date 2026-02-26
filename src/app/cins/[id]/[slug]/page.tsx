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

export default function CinsPage() {
  const params = useParams();
  const id = params.id as string;
  const slug = params.slug as string;
  
  const [realPets, setRealPets] = useState<any[]>([]);
  const [cinsAdi, setCinsAdi] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        // Slug'dan cins adını oluştur (toy-poodle -> Toy Poodle)
        const cinsFromSlug = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        setCinsAdi(cinsFromSlug);
        
        // Bu cinse ait ilanları çek
        const q = query(
          collection(firestore, 'ilanlar'),
          where('cins', '==', cinsFromSlug),
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
  }, [slug]);

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
        <span className="font-semibold text-foreground">{cinsAdi}</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">{cinsAdi}</h1>
      <p className="text-muted-foreground mb-8">{realPets.length} ilan bulundu</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {paginatedListings.map((pet: any) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-8">
          {/* Pagination component'ı buraya ekleyin */}
        </Pagination>
      )}
    </div>
  );
}