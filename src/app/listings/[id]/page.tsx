'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { 
  collectionGroup, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore'; // Gerekli araçları ekledik
import { Loader2, MapPin, Calendar, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { PetListing } from '@/lib/types';

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<PetListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        // YENİ MANTIK: Tüm 'petListings' alt klasörlerinde bu ID'yi ara
        const q = query(collectionGroup(db, 'petListings'));
        const querySnapshot = await getDocs(q);
        
        // Gelen sonuçlar içinde bizim ilan ID'mizle eşleşeni buluyoruz
        const foundDoc = querySnapshot.docs.find(doc => doc.id === id);

        if (foundDoc) {
          setListing({ id: foundDoc.id, ...foundDoc.data() } as PetListing);
        }
      } catch (error) {
        console.error("İlan yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#f05a28]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold">İlan bulunamadı.</h2>
        <p className="text-gray-500 mt-2">İlan silinmiş veya adresi yanlış olabilir.</p>
        <Button asChild className="mt-6 bg-[#f05a28] hover:bg-[#d44d21]">
          <Link href="/">Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-gray-500 hover:text-[#f05a28] mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> İlanlara Geri Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
          <Image src={listing.imageUrl} alt={listing.name} fill className="object-cover" priority />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-orange-100 text-[#f05a28] px-3 py-1 rounded-full text-xs font-bold uppercase">
                {listing.listingType === 'Sale' ? 'Satılık' : 'Sahiplendirme'}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900">{listing.name}</h1>
            <p className="text-3xl font-bold text-[#f05a28] mt-2">
              {listing.listingType === 'Sale' ? `${listing.price?.toLocaleString()} TL` : 'Ücretsiz'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border">
              <p className="text-xs text-gray-500 uppercase font-bold">Cins</p>
              <p className="font-semibold text-lg">{listing.breed}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border">
              <p className="text-xs text-gray-500 uppercase font-bold">Yaş</p>
              <p className="font-semibold text-lg">{listing.age} Yaşında</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-5 w-5 text-[#f05a28]" />
            <span className="font-medium text-lg">{listing.location}</span>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-3 text-gray-800 underline decoration-[#f05a28] decoration-2 underline-offset-4">
              İlan Açıklaması
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          <Button size="lg" className="w-full h-14 text-xl font-bold bg-[#f05a28] hover:bg-[#d44d21] rounded-xl shadow-lg">
            İletişime Geç
          </Button>
        </div>
      </div>
    </div>
  );
}