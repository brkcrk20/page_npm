'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, MapPin, Calendar, Tag, User, ArrowLeft } from 'lucide-react';
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
        // İlanı ana koleksiyondan veya kullanıcı alt koleksiyonundan çekmek gerekebilir
        // Şimdilik genel bir yapı kuruyoruz
        const docRef = doc(db, 'petListings', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as PetListing);
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-12 animate-spin text-primary" /></div>;
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold">İlan bulunamadı.</h2>
        <Button asChild className="mt-4"><Link href="/">Ana Sayfaya Dön</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Sol Taraf: Görsel */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
          <Image 
            src={listing.imageUrl} 
            alt={listing.name} 
            fill 
            className="object-cover"
            priority
          />
        </div>

        {/* Sağ Taraf: Detaylar */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {listing.listingType === 'Sale' ? 'Satılık' : 'Sahiplendirme'}
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                {listing.species}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-gray-900">{listing.name}</h1>
            <p className="text-3xl font-bold text-primary mt-4">
              {listing.listingType === 'Sale' ? `${listing.price?.toLocaleString()} TL` : 'Ücretsiz'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Tag className="text-primary h-5 w-5" />
              <div>
                <p className="text-xs text-gray-500">Cins</p>
                <p className="font-semibold">{listing.breed}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Calendar className="text-primary h-5 w-5" />
              <div>
                <p className="text-xs text-gray-500">Yaş</p>
                <p className="font-semibold">{listing.age} Yaşında</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-medium">{listing.location}</span>
          </div>

          <div className="border-t border-b py-6">
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <ArrowLeft className="rotate-180 mr-2 h-4 w-4 text-primary" /> İlan Açıklaması
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="pt-4">
            <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20">
              Satıcıyla İletişime Geç
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}