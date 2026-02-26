'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CreateListingForm } from './CreateListingForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function NewListingPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<'standart' | 'admin'>('standart');
  const [userId, setUserId] = useState<string | null>(null);
  
  const heroImage = PlaceHolderImages.find((img) => img.id === 'listing-new-hero');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. Giriş kontrolü
      if (!user) {
        router.replace('/login');
        return;
      }

      // Kullanıcı ID'sini kaydet
      setUserId(user.uid);

      // ADMIN KONTROLÜ
      const isAdmin = user.email === 'admin@petsemti.com';
      if (isAdmin) {
        setUserRole('admin');
        setIsAuthorized(true);
        return;
      }

      try {
        // 2. Normal kullanıcılar için Fatura bilgisi kontrolü
        // Önce 'users' koleksiyonunda ara
        const userRef = doc(db, 'users', user.uid);
        let userSnap = await getDoc(userRef);
        
        // 'users'da yoksa 'kullanicilar' koleksiyonunda ara
        if (!userSnap.exists()) {
          const kullaniciRef = doc(db, 'kullanicilar', user.uid);
          userSnap = await getDoc(kullaniciRef);
        }
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // faturaBilgileri alanı yoksa fatura sayfasına yönlendir
          // 'faturaBilgileri' koleksiyonunda kontrol et
          const faturaRef = doc(db, 'faturaBilgileri', user.uid);
          const faturaSnap = await getDoc(faturaRef);
          
          if (!faturaSnap.exists()) {
            router.replace('/fatura-bilgileri');
          } else {
            setIsAuthorized(true);
          }
        } else {
          // Kullanıcı belgesi hiç yoksa fatura sayfasına yönlendir
          router.replace('/fatura-bilgileri');
        }
      } catch (error) {
        console.error("Yetki hatası:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // YÜKLENİYOR EKRANI
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white fixed inset-0 z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f05a28] rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative w-full h-[40vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
            {userRole === 'admin' ? 'Yönetici İlan Paneli' : 'Yeni Bir İlan Oluştur'}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            {userRole === 'admin' ? 'Admin olarak sınırsız ilan verme yetkiniz var.' : 'Dostuna yeni bir yuva bul veya hizmetlerini listele.'}
          </p>
        </div>
      </section>

      <div className="container mx-auto py-10 -mt-20 relative z-10">
        <CreateListingForm isAdmin={userRole === 'admin'} userId={userId} />
      </div>
    </div>
  );
}