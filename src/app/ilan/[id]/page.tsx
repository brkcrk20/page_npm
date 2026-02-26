'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetCard } from '@/components/PetCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import NotFound from '@/app/not-found';

// FIREBASE BAĞLANTISI
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface Ilan {
  id: string;
  baslik?: string;
  name?: string;
  aciklama?: string;
  hayvanTuru?: string;
  cins?: string;
  cinsId?: string;
  yas?: string;
  cinsiyet?: string;
  sehir?: string;
  ilce?: string;
  fiyat?: number;
  telefon?: string;
  fotoUrl?: string[];
  imageUrls?: string[];
  vitrinMi?: boolean;
  goruntulenme?: number;
  olusturmaTarihi?: any;
  onayDurumu?: string;
  kategori?: string;
}

const WhatsappIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.052 24l1.688-6.164a11.93 11.93 0 01-1.67-6.202A11.948 11.948 0 0111.942 0a11.95 11.95 0 0111.943 11.943c0 6.59-5.352 11.943-11.943 11.943a11.928 11.928 0 01-5.753-1.503L.052 24zm6.568-3.435a9.955 9.955 0 005.322 1.493c5.514 0 9.98-4.466 9.98-9.98s-4.466-9.98-9.98-9.98-9.98 4.466-9.98 9.98a9.94 9.94 0 001.55 5.257l-1.025 3.743 3.82-1.01zM9.462 7.25c-.21-.06-.44-.1-.703-.122-.26-.02-.553.05-.774.242-.22.193-.78.763-.954.93-.173.166-.347.188-.49.188-.142 0-.284-.02-.426-.042-.26-.042-.574-.21-.868-.42-1.04-.72-1.72-1.57-1.95-1.84-.23-.27-.46-.58-.46-.94s.16-.53.28-.67c.12-.14.26-.23.38-.23.1 0 .22-.02.33 0 .1.02.24-.29.28-.37.04-.08.06-.17.02-.25-.04-.08-.37-.88-.51-1.2-.14-.32-.28-.28-.39-.28-.11 0-.24 0-.38.01-.28.02-.68.16-.92.38-1.01.9-1.23 2.13-1.02 3.1.21 1.05 1.01 2.29 2.45 3.72 1.77 1.76 3.33 2.74 5.24 3.49.53.21 1.04.33 1.54.43.68.14 1.28.12 1.74.08.5-.04 1.54-.62 1.76-1.22.22-.6.22-1.1.15-1.28-.07-.18-.26-.28-.53-.39z" />
  </svg>
);

export default function IlanPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [pet, setPet] = useState<Ilan | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarPets, setSimilarPets] = useState<Ilan[]>([]);
  const [mainImage, setMainImage] = useState('');

  const mockReviews = [
    {
      id: 1,
      author: "Ayşe Yılmaz",
      avatar: "https://i.pravatar.cc/150?img=1",
      rating: 5,
      comment: "İlan sahibi çok ilgiliydi, yavruyu sağlıklı bir şekilde teslim aldık. Herkese tavsiye ederim!",
      date: "2 gün önce"
    },
    {
      id: 2,
      author: "Mehmet Kaya",
      avatar: "https://i.pravatar.cc/150?img=2",
      rating: 4,
      comment: "İletişim kurmak kolay oldu. Köpeğin aşıları tamdı. Sadece buluşma yerinde biraz bekledik ama genel olarak memnun kaldık.",
      date: "1 hafta önce"
    }
  ];

  useEffect(() => {
    const fetchIlan = async () => {
      try {
        setLoading(true);
        const { firestore } = initializeFirebase();
        
        if (!id) return;
        
        // İlanı ID'ye göre çek
        const ilanRef = doc(firestore, 'ilanlar', id);
        const ilanSnap = await getDoc(ilanRef);
        
        if (ilanSnap.exists()) {
          const ilanData = { id: ilanSnap.id, ...ilanSnap.data() } as Ilan;
          setPet(ilanData);
          
          // Ana resmi ayarla
          const fotoUrl = ilanData.fotoUrl || ilanData.imageUrls || [];
          setMainImage(fotoUrl[0] || PlaceHolderImages.find(img => img.id === 'placeholder')?.imageUrl || '/placeholder-pet.png');
          
          // Benzer ilanları çek (aynı cins)
          if (ilanData.cins) {
            const q = query(
              collection(firestore, 'ilanlar'),
              where('cins', '==', ilanData.cins),
              where('onayDurumu', '==', 'onaylandi')
            );
            const snapshot = await getDocs(q);
            const similar = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Ilan))
              .filter(item => item.id !== id)
              .slice(0, 4);
            setSimilarPets(similar);
          }
        }
      } catch (error) {
        console.error("İlan yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchIlan();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!pet) {
    return <NotFound />;
  }

  // Galeri resimleri
  const galleryImages = pet.fotoUrl || pet.imageUrls || [
    PlaceHolderImages.find(img => img.id === 'placeholder')?.imageUrl || '/placeholder-pet.png'
  ];

  const priceDisplay = pet.fiyazt && pet.fiyat > 0 ? `${pet.fiyat} TL` : 'Görüşülür';

  return (
    <div className="container mx-auto py-8">
        {/* Breadcrumb */}
<div className="text-sm text-muted-foreground mb-4 flex items-center">
  <Link href="/" className="hover:text-primary">Anasayfa</Link>
  <ChevronRight className="h-4 w-4 mx-1" />
  <Link href={pet.hayvanTuru === 'kopek' ? '/kopek-ilanlari' : '/kedi-ilanlari'} className="hover:text-primary">
    {pet.hayvanTuru === 'kopek' ? 'Köpek İlanları' : 'Kedi İlanları'}
  </Link>
  {pet.sehir && (
    <>
      <ChevronRight className="h-4 w-4 mx-1" />
      <Link href={`/${pet.hayvanTuru === 'kopek' ? 'kopek-ilanlari' : 'kedi-ilanlari'}/${pet.sehir.toLowerCase()}`} className="hover:text-primary">
        {pet.sehir}
      </Link>
    </>
  )}
  <ChevronRight className="h-4 w-4 mx-1" />
  <Link href={`/cins/${pet.cinsId || ''}`} className="hover:text-primary">{pet.cins}</Link>
  <ChevronRight className="h-4 w-4 mx-1" />
  <span className="font-semibold text-foreground">{pet.baslik || pet.name}</span>
</div>

        <h1 className="text-2xl font-bold mb-6">{pet.baslik || pet.name}</h1>
      
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        
        {/* SOL SÜTUN */}
        <div className="lg:col-span-5 space-y-6">
            <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border mb-2">
                    <Image src={mainImage} alt={pet.baslik || pet.name || ''} fill className="object-cover" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {galleryImages.map((img: string, idx: number) => (
                        <button key={idx} onClick={() => setMainImage(img)} className={`aspect-square relative rounded-md overflow-hidden border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}>
                             <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="bg-gray-700 text-white font-bold text-sm py-2 px-4 rounded-t-md">
                    İlan Detayları
                </div>
                <div className="border bg-white p-4 rounded-b-md">
                    <p className="text-sm leading-relaxed">
                        {pet.aciklama}
                    </p>
                </div>
            </div>
        </div>

        {/* ORTA SÜTUN */}
        <div className="lg:col-span-4">
            <div className="border rounded-lg bg-white p-4">
                <h2 className="text-2xl font-bold text-blue-600 mb-1">{priceDisplay}</h2>
                <div className="text-sm text-muted-foreground mb-4">
                    {pet.sehir} / {pet.ilce}
                </div>

                <ul className="info-table text-sm">
                    <li><span className="label">Türü</span><span className="value">{pet.hayvanTuru === 'kopek' ? 'Köpek' : 'Kedi'} Cinsleri</span></li>
                    <li><span className="label">Cinsi</span><span className="value"><Link href={`/cins/${pet.cinsId || ''}`} className="text-red-600 hover:underline">{pet.cins}</Link></span></li>
                    <li><span className="label">İlan No</span><span className="value text-red-600 font-semibold">{pet.id?.slice(-6)}</span></li>
                    <li><span className="label">İlan Tarihi</span><span className="value">{pet.olusturmaTarihi ? new Date(pet.olusturmaTarihi.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span></li>
                    <li><span className="label">Yaş</span><span className="value">{pet.yas}</span></li>
                    <li><span className="label">Cinsiyet</span><span className="value">{pet.cinsiyet || 'Belirtilmemiş'}</span></li>
                    <li><span className="label">Durum</span><span className="value">{pet.kategori === 'satilik' ? 'Satılık' : 'Sahiplenme'}</span></li>
                </ul>

                <div className="mt-4 pt-4 border-t text-sm space-y-1 text-muted-foreground">
                    <p>Görüntülenme: <span className="font-bold text-primary">{pet.goruntulenme || 0} kez</span> görüntülendi</p>
                </div>
            </div>
        </div>

        {/* SAĞ SÜTUN */}
        <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-white">
                <div className="bg-green-500 rounded p-2">
                    <div className="font-bold text-2xl">2</div>
                    <div className="text-xs">Aktif İlan</div>
                </div>
                <div className="bg-gray-400 rounded p-2">
                    <div className="font-bold text-2xl">18</div>
                    <div className="text-xs">Toplam İlan</div>
                </div>
                <div className="bg-yellow-400 rounded p-2 flex flex-col items-center justify-center">
                    <Star className="w-6 h-6 text-white fill-white"/>
                    <div className="text-xs font-bold text-gray-800">4 yıl</div>
                </div>
            </div>
            
            <div className="border rounded-lg bg-white p-4 text-center">
                <h3 className="text-xl font-bold text-primary">İlan Sahibi</h3>
                <div className="space-y-2 mt-4">
                    <Button variant="secondary" className="w-full justify-start gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700">
                        <Phone className="w-4 h-4"/> {pet.telefon || 'Belirtilmemiş'}
                    </Button>
                    <Button className="w-full justify-center gap-2 bg-green-500 hover:bg-green-600 text-lg py-6">
                        <WhatsappIcon /> WhatsApp
                    </Button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Benzer İlanlar */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Benzer İlanlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
      
       {/* Yorumlar */}
       <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">İlan Değerlendirmeleri</h2>
        
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Yorumunuzu Paylaşın</CardTitle>
                <CardDescription>Bu ilan hakkındaki düşüncelerinizi paylaşın.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <Textarea placeholder="Yorumunuzu buraya yazın..." rows={4} />
                    <div className="flex justify-end">
                        <Button>Yorumu Gönder</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="space-y-6">
          {mockReviews.map((review) => (
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
                      <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}