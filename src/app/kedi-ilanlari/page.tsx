
'use client';

import { useState } from 'react';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PawPrint, ChevronRight, BookOpen, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { BreedPageSidebar } from '@/components/BreedPageSidebar';
import { categories } from '@/lib/breeds';
import { ListingRow } from '@/components/ListingRow';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const initialMockReviews = [
    {
      id: 1,
      author: "PatiSever",
      avatar: "https://i.pravatar.cc/150?img=9",
      comment: "Kedi sahiplenmek isteyenler için harika bir platform. Çok çeşitli cinsler var ve ilan sahipleri genellikle ilgili oluyor.",
      date: "1 gün önce"
    },
    {
      id: 2,
      author: "Ev Kedisi",
      avatar: "https://i.pravatar.cc/150?img=10",
      comment: "Aradığım British Shorthair'i buradan buldum. Sitedeki bilgiler çok yardımcı oldu.",
      date: "4 gün önce"
    }
  ];

export default function CatPage() {
  const filteredPets = pets.filter((pet) => pet.type === 'Cat');
  const featuredPets = filteredPets.filter(p => p.featured).slice(0, 4);
  const allPetsInCategory = filteredPets;
  const category = categories.find(c => c.type === 'Cat');

  const [reviews, setReviews] = useState(initialMockReviews);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 20;

  const totalPages = Math.ceil(allPetsInCategory.length / listingsPerPage);
  const paginatedListings = allPetsInCategory.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );


  const handleCommentSubmit = () => {
    if (newComment.trim() === "") return;

    const newReview = {
      id: reviews.length + 1,
      author: "Yeni Kullanıcı", // In a real app, this would be the logged-in user
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      comment: newComment,
      date: "şimdi"
    };

    setReviews([newReview, ...reviews]);
    setNewComment("");
    setNewRating(5);
  };

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  return (
    <div className="container mx-auto py-8">
       <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-8">
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
            <span className="font-semibold text-foreground">Kedi İlanları</span>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
            <span className='font-bold text-primary'>Kedi İlanları</span> kategorisinde <span className='font-bold text-foreground'>{filteredPets.length}</span> ilan bulundu.
            </p>
            
            {/* Vitrin Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">Yıldızlı İlanlar</h2>
              {featuredPets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

            {/* Popular Listings */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">Popüler Kedi İlanları</h2>
                <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <h2 className="text-2xl font-bold">Kedi Sahiplenme Hakkında Yorumlar</h2>
                </div>

                 <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Yorumunuzu Paylaşın</CardTitle>
                        <CardDescription>Bu kategori hakkındaki düşüncelerinizi diğer kullanıcılarla paylaşın.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Puanınız:</span>
                                <div className="flex items-center text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-6 h-6 cursor-pointer ${i < newRating ? 'fill-current' : 'fill-muted stroke-muted-foreground'}`} onClick={() => setNewRating(i + 1)}/>
                                    ))}
                                </div>
                            </div>
                            <Textarea placeholder="Yorumunuzu buraya yazın..." rows={4} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                            <div className="flex justify-end">
                                <Button onClick={handleCommentSubmit}>Yorumu Gönder</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                  {reviews.map((review) => (
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
                <h2 className="text-3xl font-bold font-headline mb-4 text-gray-800 flex items-center gap-3"><BookOpen />Kedilerin Gizemli Dünyası</h2>
                <div className="prose max-w-none text-muted-foreground space-y-4">
                    <p>
                        Kediler, bağımsız doğaları, zarif hareketleri ve gizemli tavırlarıyla binlerce yıldır insanların ilgisini çeker. Bir kediyle yaşamı paylaşmak, eşsiz bir deneyimdir.
                    </p>
                    <h3 className="text-2xl font-bold font-headline text-gray-700 !mt-6 !mb-2">Ev Ortamına Uyum</h3>
                    <p>
                        Kediler temiz ve titiz hayvanlardır. Tuvalet eğitimi genellikle içgüdüseldir. Onlara temiz bir kum kabı, tırmalama tahtası ve güvenli bir dinlenme alanı sağlamak, evdeki mutlulukları için esastır.
                    </p>
                </div>
            </div>

        </main>
      </div>
    </div>
  );
}

    