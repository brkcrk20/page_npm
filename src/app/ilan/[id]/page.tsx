'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Video,
  Star,
  MessageSquare,
  AlertTriangle,
  Printer,
  Phone,
  ArrowLeft,
  BookOpen,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pets as staticPets } from '@/lib/data'; // Statik veriler
import { PetCard } from '@/components/PetCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Firebase importları
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import type { PetListing } from '@/lib/types';

const WhatsappIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.052 24l1.688-6.164a11.93 11.93 0 01-1.67-6.202A11.948 11.948 0 0111.942 0a11.95 11.95 0 0111.943 11.943c0 6.59-5.352 11.943-11.943 11.943a11.928 11.928 0 01-5.753-1.503L.052 24zm6.568-3.435a9.955 9.955 0 005.322 1.493c5.514 0 9.98-4.466 9.98-9.98s-4.466-9.98-9.98-9.98-9.98 4.466-9.98 9.98a9.94 9.94 0 001.55 5.257l-1.025 3.743 3.82-1.01zM9.462 7.25c-.21-.06-.44-.1-.703-.122-.26-.02-.553.05-.774.242-.22.193-.78.763-.954.93-.173.166-.347.188-.49.188-.142 0-.284-.02-.426-.042-.26-.042-.574-.21-.868-.42-1.04-.72-1.72-1.57-1.95-1.84-.23-.27-.46-.58-.46-.94s.16-.53.28-.67c.12-.14.26-.23.38-.23.1 0 .22-.02.33 0 .1.02.24-.29.28-.37.04-.08.06-.17.02-.25-.04-.08-.37-.88-.51-1.2-.14-.32-.28-.28-.39-.28-.11 0-.24 0-.38.01-.28.02-.68.16-.92.38-1.01.9-1.23 2.13-1.02 3.1.21 1.05 1.01 2.29 2.45 3.72 1.77 1.76 3.33 2.74 5.24 3.49.53.21 1.04.33 1.54.43.68.14 1.28.12 1.74.08.5-.04 1.54-.62 1.76-1.22.22-.6.22-1.1.15-1.28-.07-.18-.26-.28-.53-.39z" />
    </svg>
);

export default function IlanDetayPage() {
  const params = useParams();
  // ID bazen dizi gelebilir, string'e çeviriyoruz
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pet, setPet] = useState<any>(null); // Hem statik hem DB verisi için esnek tip
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Veriyi Çekme (Statik mi DB mi kontrolü)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Önce Statik Verilerde Ara (Eski ilanlar bozulmasın)
      const staticPet = staticPets.find((p) => p.id === id);

      if (staticPet) {
        setPet(staticPet);
        // Statik resim mantığı
        const imageDetails = PlaceHolderImages.find((img) => img.id === staticPet.image);
        const mainImg = imageDetails ? imageDetails.imageUrl : 'https://picsum.photos/seed/placeholder/800/600';
        setMainImage(mainImg);
        setGalleryImages([
            mainImg,
            'https://picsum.photos/seed/pomeranian-2/800/600',
            'https://picsum.photos/seed/pomeranian-3/800/600'
        ]);
        setLoading(false);
        return;
      }

      // 2. Statik değilse Firebase'e bak
      try {
        const q = query(collectionGroup(db, 'petListings'));
        const querySnapshot = await getDocs(q);
        const foundDoc = querySnapshot.docs.find(doc => doc.id === id);

        if (foundDoc) {
          const dbData = foundDoc.data() as PetListing;
          // DB verisini UI formatına uyarla
          const normalizedPet = {
            id: foundDoc.id,
            name: dbData.name,
            breed: dbData.breed,
            type: dbData.species || 'Other', // species'i type'a çevir
            age: dbData.age,
            description: dbData.description,
            location: dbData.location,
            listingType: dbData.listingType,
            price: dbData.price,
            imageUrl: dbData.imageUrl,
            isDb: true // DB'den geldiğini işaretle
          };
          
          setPet(normalizedPet);
          setMainImage(dbData.imageUrl);
          setGalleryImages([dbData.imageUrl]); // DB'de şimdilik tek resim var
        }
      } catch (error) {
        console.error("İlan çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Loading Ekranı
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#f05a28]" />
        </div>
    );
  }

  // İlan Bulunamadıysa
  if (!pet) {
    return (
        <div className="container mx-auto py-20 text-center">
            <h2 className="text-2xl font-bold">İlan bulunamadı.</h2>
            <Button asChild className="mt-6 bg-[#f05a28] hover:bg-[#d44d21]">
                <Link href="/">Ana Sayfaya Dön</Link>
            </Button>
        </div>
    );
  }

  // Fiyat Gösterimi
  const priceDisplay = pet.listingType === 'Sale' 
    ? (pet.price ? `${Number(pet.price).toLocaleString()} TL` : 'Fiyat Belirtilmemiş') 
    : 'Ücretsiz Sahiplendirme';

  // Benzer İlanlar (Statik veriden çekiyoruz şimdilik)
  const similarPets = staticPets.filter(p => p.type === pet.type && p.id !== pet.id).slice(0, 4);

  return (
    <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary">Anasayfa</Link> &gt; 
                <span className="mx-1">{pet.type} İlanları</span> &gt; 
                <span className="font-semibold text-foreground ml-1">{pet.breed}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
                 <Link href="#" className="flex items-center gap-1 hover:text-primary"><Star className="w-4 h-4" /> Favorilere Ekle</Link>
                 <Link href="#" className="flex items-center gap-1 hover:text-primary"><Printer className="w-4 h-4" /> Yazdır</Link>
            </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-6">{pet.name} - {pet.breed}</h1>
      
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-y-8">
        
        {/* --- 1. SOL SÜTUN (FOTOĞRAFLAR VE DETAY) --- */}
        <div className="lg:col-span-5 space-y-6">
            {/* Gallery */}
            <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-gray-100 mb-2">
                    <Image src={mainImage} alt={pet.name} fill className="object-cover" />
                </div>
                {/* Küçük Resimler (Eğer birden fazla varsa) */}
                {galleryImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                        {galleryImages.map((img, idx) => (
                            <button key={idx} onClick={() => setMainImage(img)} className={`aspect-square relative rounded-md overflow-hidden border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}>
                                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* İlan Detayları Metni */}
            <div className="space-y-2">
                <div className="bg-gray-800 text-white font-bold text-sm py-2 px-4 rounded-t-md">
                    İlan Açıklaması
                </div>
                <div className="border bg-white p-4 rounded-b-md">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {pet.description || "Açıklama belirtilmemiş."}
                    </p>
                </div>
            </div>
        </div>

        {/* --- 2. ORTA SÜTUN (TEKNİK TABLO) --- */}
        <div className="lg:col-span-4">
            <div className="border rounded-xl bg-white p-5 shadow-sm">
                <h2 className="text-3xl font-bold text-[#f05a28] mb-1">{priceDisplay}</h2>
                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                     <span className="font-semibold text-gray-700">Konum:</span> {pet.location}
                </div>

                <ul className="info-table text-sm space-y-3">
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">Türü</span><span className="font-medium">{pet.type}</span></li>
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">Cinsi</span><span className="font-medium text-primary">{pet.breed}</span></li>
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">İlan No</span><span className="font-medium text-red-600">{pet.id.slice(0, 8)}...</span></li>
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">Yaş</span><span className="font-medium">{pet.age}</span></li>
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">Durum</span><span className="font-medium">{pet.listingType === 'Sale' ? 'Satılık' : 'Sahiplendirme'}</span></li>
                    <li className="flex justify-between border-b pb-2"><span className="text-gray-500">Şehir Dışına Gönderim</span><span className="font-medium">Görüşülür</span></li>
                </ul>

                <div className="mt-6 pt-4 border-t text-sm space-y-1 text-muted-foreground text-center">
                    <p>İlan <span className="font-bold text-primary">Aktif</span> ve yayında.</p>
                </div>
                
                <div className="mt-4 text-center">
                    <Link href="#" className="text-red-600 text-sm inline-flex items-center gap-1 hover:underline">
                        <AlertTriangle className="w-4 h-4"/> İlan ile İlgili Şikayetim Var
                    </Link>
                </div>
            </div>
        </div>

        {/* --- 3. SAĞ SÜTUN (SATICI VE AKSİYON) --- */}
        <div className="lg:col-span-3 space-y-4">
             {/* Aciliyet Bandı */}
            <div className="bg-red-600 text-white text-center text-sm font-semibold p-2 rounded animate-pulse">
                Popüler İlan 🔥
            </div>

            {/* Satıcı Kartı */}
            <div className="border rounded-xl bg-white p-4 text-center shadow-sm">
                <h3 className="text-xl font-bold text-gray-800">İlan Sahibi</h3>
                <p className="text-xs text-muted-foreground mb-4">Onaylı Üye</p>

                <div className="space-y-3 mt-4">
                    <Button variant="secondary" className="w-full justify-start gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 h-12">
                        <Phone className="w-5 h-5"/> Numarayı Göster
                    </Button>
                    <Button className="w-full justify-center gap-2 bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-semibold shadow-md transition-transform active:scale-95">
                        <WhatsappIcon /> WhatsApp
                    </Button>
                     <Button variant="outline" className="w-full justify-center gap-2 border-primary text-primary hover:bg-primary/10">
                        <MessageSquare className="w-5 h-5"/> Mesaj Gönder
                    </Button>
                </div>
            </div>
            
            {/* Navigasyon */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                <Link href="/" className="w-full">
                    <Button variant="ghost" className="w-full border">
                        <ArrowLeft className="mr-1 w-4 h-4"/> Geri Dön
                    </Button>
                </Link>
            </div>
        </div>
      </div>
      
      {/* Makale Bölümü (Sabit İçerik) */}
      <div className="mt-16 border-t pt-12">
        <h2 className="text-3xl font-bold font-headline mb-4 text-gray-800 flex items-center gap-3"><BookOpen />{pet.breed} Hakkında Bilgiler</h2>
        <div className="prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
                {pet.breed}, karakteri ve fiziksel özellikleriyle dikkat çeken özel bir cinstir. Bu dostlarımız genellikle sadık, enerjik ve öğrenmeye açıktır.
            </p>
            <h3 className="text-2xl font-bold font-headline text-gray-700 !mt-6 !mb-2">Bakım Önerileri</h3>
            <p>
                Düzenli veteriner kontrolleri, kaliteli mama ile beslenme ve günlük egzersiz ihtiyaçlarının karşılanması, {pet.breed} cinsi dostunuzun sağlıklı ve uzun bir ömür sürmesi için gereklidir.
            </p>
        </div>
      </div>
    </div>
  );
}