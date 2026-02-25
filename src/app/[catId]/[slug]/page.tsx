'use client';

import { useState, useEffect } from 'react'; // useEffect eklendi
// import { pets } from '@/lib/data'; // Bu satırı artık kullanmıyoruz, Firebase'den çekeceğiz.
import { PetCard } from '@/components/PetCard';
import { PawPrint, MessageCircle, Star, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';
import { ListingRow } from '@/components/ListingRow';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// --- FIREBASE BAĞLANTISI ---
import { db } from '@/lib/firebase'; 
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

export default function DogPage() {
  // --- STATE (DURUM) YÖNETİMİ ---
  const [realPets, setRealPets] = useState([]); // Firebase'den gelen köpekler buraya gelecek
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [reviews, setReviews] = useState(initialMockReviews);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  // --- FIREBASE'DEN VERİLERİ ÇEK ---
  useEffect(() => {
    const getDogs = async () => {
      try {
        setLoading(true);
        // Veritabanında "tur" alanı "kopek" olan her şeyi getir
        const q = query(collection(db, "ilanlar"), where("tur", "==", "kopek"));
        const querySnapshot = await getDocs(q);
        const dogData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRealPets(dogData);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    getDogs();
  }, []);

  // Mantıksal Filtrelemeler (Artık realPets üzerinden)
  const category = categories.find(c => c.type === 'Dog');
  const featuredPets = realPets.filter((p: any) => p.featured).slice(0, 4);
  
  const totalPages = Math.ceil(realPets.length / listingsPerPage);
  const paginatedListings = realPets.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  const handleCommentSubmit = () => {
    if (newComment.trim() === "") return;
    const newReview = {
      id: reviews.length + 1,
      author: "Yeni Kullanıcı",
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      comment: newComment,
      date: "şimdi"
    };
    setReviews([newReview, ...reviews]);
    setNewComment("");
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold">Veritabanına bağlanılıyor, lütfen bekle...</div>;
  }

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

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
            <span className="font-semibold text-foreground">Köpek İlanları</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>Köpek İlanları</span> kategorisinde <span className='font-bold text-foreground'>{realPets.length}</span> ilan bulundu.
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
                İlanınız yukarıda yer alsın, alıcılara daha kısa sürede ulaşın! <Link href="#" className="font-bold underline hover:text-red-800">Detaylı bilgi için tıklayın.</Link>
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
                    {/* Sayfalar... */}
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

            {/* Diğer kısımlar (Yorumlar vs) senin kodunla aynı devam ediyor... */}
            {/* Kod çok uzun olduğu için özetledim, kalan kısımları aynen koruyabilirsin. */}
        </main>
      </div>
    </div>
  );
}