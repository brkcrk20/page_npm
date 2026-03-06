'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { initializeFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CreateListingForm } from './CreateListingForm';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function NewListingPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<'standart' | 'admin'>('standart');
  
  const heroImage = PlaceHolderImages.find((img) => img.id === 'listing-new-hero');

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      const isAdmin = user.email === 'admin@petsemti.com';
      if (isAdmin) {
        setUserRole('admin');
        setIsAuthorized(true);
        return;
      }

      try {
        // users koleksiyonundan hasBillingInfo kontrolü
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().hasBillingInfo) {
          setIsAuthorized(true);
        } else {
          router.replace('/fatura-bilgileri');
        }
      } catch (error) {
        console.error("Yetki hatası:", error);
        router.replace('/fatura-bilgileri');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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
            {userRole === 'admin' ? 'Yönetici İlan Paneli' : 'Yeni İlan Oluştur'}
          </h1>
          <p className="mt-4 max-w-2xl text-lg">
            {userRole === 'admin' ? 'Admin olarak sınırsız ilan verebilirsiniz.' : 'Dostuna yeni bir yuva bul.'}
          </p>
        </div>
      </section>

      <div className="container mx-auto py-10 -mt-20 relative z-10">
        <CreateListingForm isAdmin={userRole === 'admin'} />
      </div>
    </div>
  );
}