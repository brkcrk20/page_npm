'use client';

import { PaginationLink } from '@/components/ui/pagination';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';
import { ListingRow } from '@/components/ListingRow';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// FIREBASE BAĞLANTISI
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const initialMockReviews = [
    {
      id: 1,
      author: "Köpeksever123",
      avatar: "https://i.pravatar.cc/150?img=5",
      comment: "Bu siteden sahiplendiğim Golden Retriever cinsi köpeğimle çok mutluyuz.",
      date: "3 gün önce"
    }
];

export default function CategoryPage() {
  const params = useParams();
  const catId = params.catId as string;
  const slug = params.slug as string;
  
  // --- STATE YÖNETİMİ ---
  const [realPets, setRealPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews] = useState(initialMockReviews);
  const [newComment, setNewComment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  // Kategori belirleme
  const getCategoryType = () => {
    if (catId.includes('kopek')) return 'kopek';
    if (catId.includes('kedi')) return 'kedi';
    return 'kopek';
  };

  const categoryType = getCategoryType();
  const category = categories.find(c => 
    categoryType === 'kopek' ? c.type === 'Dog' : c.type === 'Cat'
  );

  // --- FIREBASE'DEN VERİLERİ ÇEK ---
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        // Slug'a göre filtreleme
        let q;
        if (slug === 'kopek-ilanlari' || slug === 'kedi-ilanlari') {
          // Ana kategori sayfası
          q = query(
            collection(firestore, 'ilanlar'),
            where('hayvanTuru', '==', categoryType),
            where('onayDurumu', '==', 'onaylandi')
          );
        } else {
          // Cins sayfası - Firestore'da cins slug'ı var mı kontrol et
          const cinsAdi = slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          q = query(
            collection(firestore, 'ilanlar'),
            where('hayvanTuru', '==', categoryType),
            where('cins', '>=', cinsAdi),
            where('cins', '<=', cinsAdi + '\uf8ff'),
            where('onayDurumu', '==', 'onaylandi')
          );
        }
        
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
  }, [catId, slug, categoryType]);

  // Mantıksal Filtrelemeler
  const featuredPets = realPets.filter((p: any) => p.vitrinMi === true).slice(0, 4);
  
  const totalPages = Math.ceil(realPets.length / listingsPerPage);
  const paginatedListings = realPets.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold">Veritabanına bağlanılıyor, lütfen bekle...</div>;
  }

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  // Sayfa başlığını belirle
  const pageTitle = slug === 'kopek-ilanlari' || slug === 'kedi-ilanlari' 
    ? `${categoryType === 'kopek' ? 'Köpek' : 'Kedi'} İlanları`
    : slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
     <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <aside className="col-span-1">
           <BreedPageSidebar 
            categoryName={category.title}
            categoryCount={realPets.length}
            categorySlug={category.slug}
            breeds={category.breeds}
          />
        </aside>

        <main className="col-span-1">
            <div className="text-sm text-muted-foreground mb-4 flex items-center">
            <Link href="/" className="hover:text-primary">Anasayfa</Link>
            <ChevronRightIcon className="h-4 w-4 mx-1" />
            <span className="font-semibold text-foreground">{pageTitle}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>{pageTitle}</span> kategorisinde <span className='font-bold text-foreground'>{realPets.length}</span> ilan bulundu.
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
                İlanınız yukarıda yer alsın, alıcılara daha kısa sürede ulaşın! <Link href="/listings/new" className="font-bold underline hover:text-red-800">Hemen İlan Ver</Link>
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

            {/* Yorumlar Bölümü */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Kullanıcı Yorumları</h2>
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Yorum Yap</CardTitle>
                  <CardDescription>Düşüncelerinizi paylaşın</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Yorumunuz..." 
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button>Gönder</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4 flex gap-3">
                      <Avatar>
                        <AvatarImage src={review.avatar} />
                        <AvatarFallback>{review.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{review.author}</span>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}