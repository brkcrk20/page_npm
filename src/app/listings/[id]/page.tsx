'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Star,
  MessageSquare,
  AlertTriangle,
  Printer,
  Phone,
  ArrowLeft,
  BookOpen,
  Loader2,
  MapPin,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pets as staticPets } from '@/lib/data'; // Örnek veriler
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Firebase
import { db } from '@/firebase';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
// PetListing tipini import etmesek de olur çünkü 'any' kullanacağız, ama dursun.
import type { PetListing } from '@/lib/types';

const WhatsappIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.052 24l1.688-6.164a11.93 11.93 0 01-1.67-6.202A11.948 11.948 0 0111.942 0a11.95 11.95 0 0111.943 11.943c0 6.59-5.352 11.943-11.943 11.943a11.928 11.928 0 01-5.753-1.503L.052 24zm6.568-3.435a9.955 9.955 0 005.322 1.493c5.514 0 9.98-4.466 9.98-9.98s-4.466-9.98-9.98-9.98-9.98 4.466-9.98 9.98a9.94 9.94 0 001.55 5.257l-1.025 3.743 3.82-1.01zM9.462 7.25c-.21-.06-.44-.1-.703-.122-.26-.02-.553.05-.774.242-.22.193-.78.763-.954.93-.173.166-.347.188-.49.188-.142 0-.284-.02-.426-.042-.26-.042-.574-.21-.868-.42-1.04-.72-1.72-1.57-1.95-1.84-.23-.27-.46-.58-.46-.94s.16-.53.28-.67c.12-.14.26-.23.38-.23.1 0 .22-.02.33 0 .1.02.24-.29.28-.37.04-.08.06-.17.02-.25-.04-.08-.37-.88-.51-1.2-.14-.32-.28-.28-.39-.28-.11 0-.24 0-.38.01-.28.02-.68.16-.92.38-1.01.9-1.23 2.13-1.02 3.1.21 1.05 1.01 2.29 2.45 3.72 1.77 1.76 3.33 2.74 5.24 3.49.53.21 1.04.33 1.54.43.68.14 1.28.12 1.74.08.5-.04 1.54-.62 1.76-1.22.22-.6.22-1.1.15-1.28-.07-.18-.26-.28-.53-.39z" />
    </svg>
);

export default function ListingDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      // 1. Önce Sahte (Static) Verilerde Ara (Eski örnekler için)
      const staticPet = staticPets.find((p) => p.id === id);

      if (staticPet) {
        setPet({ ...staticPet, isDb: false });
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

      // 2. Yoksa Veritabanına (Firebase) Bak
      try {
        const q = query(collectionGroup(db, 'petListings'));
        const querySnapshot = await getDocs(q);
        const foundDoc = querySnapshot.docs.find(doc => doc.id === id);

        if (foundDoc) {
          // HATA ÇÖZÜMÜ BURADA: 'as any' diyerek TypeScript kontrolünü esnetiyoruz
          const dbData = foundDoc.data() as any;

          const normalizedPet = {
            id: foundDoc.id,
            name: dbData.name,
            breed: dbData.breed,
            // Artık hem species hem type kontrolü yapabiliriz, hata vermez
            type: dbData.species || dbData.type || 'Other',
            age: dbData.age,
            description: dbData.description,
            location: dbData.location,
            listingType: dbData.listingType,
            price: dbData.price,
            imageUrl: dbData.imageUrl,
            date: "Yeni İlan",
            isDb: true
          };
          
          setPet(normalizedPet);
          setMainImage(dbData.imageUrl);
          setGalleryImages([dbData.imageUrl]);
        }
      } catch (error) {
        console.error("Firebase Hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#f05a28]" /></div>;

  if (!pet) return (
        <div className="container mx-auto py-20 text-center">
            <h2 className="text-2xl font-bold text-gray-800">İlan Bulunamadı</h2>
            <Button asChild className="mt-6 bg-[#f05a28] hover:bg-[#d44d21]"><Link href="/">Ana Sayfaya Dön</Link></Button>
        </div>
    );

  const priceDisplay = pet.listingType === 'Sale' ? (pet.price ? `${Number(pet.price).toLocaleString()} TL` : 'Fiyat Belirtilmemiş') : 'Ücretsiz Sahiplendirme';

  return (
    <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-1">
                <Link href="/" className="hover:text-primary transition-colors">Anasayfa</Link> 
                <ChevronRight className="w-4 h-4" />
                <span>{pet.type} İlanları</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-foreground">{pet.breed}</span>
            </div>
            <div className="flex items-center gap-3">
                 <Button variant="outline" size="sm" className="gap-2"><Star className="w-4 h-4" /> Favorile</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-y-8">
            {/* SOL: GÖRSEL */}
            <div className="lg:col-span-7 space-y-8">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-gray-100 shadow-sm group">
                    <Image src={mainImage} alt={pet.name} fill className="object-cover" priority />
                    <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${pet.listingType === 'Sale' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                            {pet.listingType === 'Sale' ? 'Satılık' : 'Sahiplendirme'}
                        </span>
                    </div>
                </div>
                {galleryImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {galleryImages.map((img, idx) => (
                            <button key={idx} onClick={() => setMainImage(img)} className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img ? 'border-[#f05a28]' : 'border-transparent'}`}>
                                <Image src={img} alt="thumb" fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#f05a28]" /> İlan Açıklaması</h2>
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">{pet.description}</div>
                </div>
                <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-orange-500" /> {pet.breed} Hakkında</h3>
                    <p className="text-sm text-gray-600">Bu ırk hakkında detaylı bilgi ve bakım rehberi yakında eklenecektir.</p>
                </div>
            </div>

            {/* SAĞ: BİLGİ */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{pet.name}</h1>
                    <div className="flex items-center text-gray-500 text-sm mb-6"><MapPin className="w-4 h-4 mr-1" /> {pet.location} <span className="mx-2">•</span> <Calendar className="w-4 h-4 mr-1" /> {pet.date}</div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">İlan Fiyatı</p><div className="text-2xl font-bold text-[#f05a28]">{priceDisplay}</div></div>
                        {pet.age && (<div className="text-right"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Yaş</p><div className="text-lg font-semibold text-gray-800">{pet.age}</div></div>)}
                    </div>
                </div>
                <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b"><h3 className="font-bold text-gray-700">Özellikler</h3></div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-8">
                        <div><span className="block text-xs text-gray-400 uppercase">Tür</span><span className="font-medium text-gray-800">{pet.type}</span></div>
                        <div><span className="block text-xs text-gray-400 uppercase">Irk</span><span className="font-medium text-[#f05a28]">{pet.breed}</span></div>
                        <div><span className="block text-xs text-gray-400 uppercase">İlan No</span><span className="font-medium text-gray-800">{pet.id.slice(0, 8)}</span></div>
                        <div><span className="block text-xs text-gray-400 uppercase">Durum</span><span className="font-medium text-gray-800">{pet.listingType === 'Sale' ? 'Satılık' : 'Sahiplenme'}</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border p-6 shadow-lg border-orange-100">
                     <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-12 w-12 border"><AvatarImage src="" /><AvatarFallback className="bg-orange-100 text-orange-600 font-bold">U</AvatarFallback></Avatar>
                        <div><h3 className="font-bold text-gray-900">İlan Sahibi</h3><div className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Doğrulanmış Hesap</div></div>
                    </div>
                    <div className="space-y-3">
                         <Button className="w-full h-12 text-lg font-bold bg-green-500 hover:bg-green-600 shadow-green-200 shadow-lg"><WhatsappIcon /> WhatsApp ile Yaz</Button>
                        <Button variant="outline" className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold"><Phone className="w-5 h-5 mr-2" /> Numarayı Göster</Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4"><Link href="/" className="w-full"><Button variant="ghost" className="w-full border"><ArrowLeft className="mr-1 w-4 h-4"/> Geri Dön</Button></Link></div>
            </div>
        </div>
    </div>
  );
}