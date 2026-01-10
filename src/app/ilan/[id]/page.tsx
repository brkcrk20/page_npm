'use client';

import { useState } from 'react';
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
  Heart,
  Printer,
  Share2,
  Eye,
  Phone,
  Home,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { pets } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const WhatsappIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.052 24l1.688-6.164a11.93 11.93 0 01-1.67-6.202A11.948 11.948 0 0111.942 0a11.95 11.95 0 0111.943 11.943c0 6.59-5.352 11.943-11.943 11.943a11.928 11.928 0 01-5.753-1.503L.052 24zm6.568-3.435a9.955 9.955 0 005.322 1.493c5.514 0 9.98-4.466 9.98-9.98s-4.466-9.98-9.98-9.98-9.98 4.466-9.98 9.98a9.94 9.94 0 001.55 5.257l-1.025 3.743 3.82-1.01zM9.462 7.25c-.21-.06-.44-.1-.703-.122-.26-.02-.553.05-.774.242-.22.193-.78.763-.954.93-.173.166-.347.188-.49.188-.142 0-.284-.02-.426-.042-.26-.042-.574-.21-.868-.42-1.04-.72-1.72-1.57-1.95-1.84-.23-.27-.46-.58-.46-.94s.16-.53.28-.67c.12-.14.26-.23.38-.23.1 0 .22-.02.33 0 .1.02.24-.29.28-.37.04-.08.06-.17.02-.25-.04-.08-.37-.88-.51-1.2-.14-.32-.28-.28-.39-.28-.11 0-.24 0-.38.01-.28.02-.68.16-.92.38-1.01.9-1.23 2.13-1.02 3.1.21 1.05 1.01 2.29 2.45 3.72 1.77 1.76 3.33 2.74 5.24 3.49.53.21 1.04.33 1.54.43.68.14 1.28.12 1.74.08.5-.04 1.54-.62 1.76-1.22.22-.6.22-1.1.15-1.28-.07-.18-.26-.28-.53-.39z" />
    </svg>
);

export default function IlanPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const pet = pets.find((p) => p.id === id);

  const galleryImages = [
    'https://picsum.photos/seed/pomeranian-1/800/600',
    'https://picsum.photos/seed/pomeranian-2/800/600',
    'https://picsum.photos/seed/pomeranian-3/800/600',
    'https://picsum.photos/seed/pomeranian-4/800/600',
    'https://picsum.photos/seed/pomeranian-5/800/600'
  ];

  const [mainImage, setMainImage] = useState(galleryImages[0]);
  
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

  if (!pet) {
    return (
      <div className="container mx-auto py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">İlan Bulunamadı</h1>
        <p className="text-muted-foreground">Aradığınız ilan mevcut değil veya kaldırılmış olabilir.</p>
        <Button asChild className="mt-6">
          <Link href="/"><Home className="mr-2" /> Anasayfaya Dön</Link>
        </Button>
      </div>
    );
  }

  const similarPets = pets.filter(p => p.type === pet.type && p.id !== pet.id).slice(0, 4);

  return (
    <div className="container mx-auto py-8">
        {/* Breadcrumb and Top Actions */}
        <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary">Anasayfa</Link> &gt; 
                <Link href="/kopek-ilanlari" className="hover:text-primary"> Köpek İlanları</Link> &gt; 
                <span className="font-semibold text-foreground"> Pomeranian Boo</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <Link href="#" className="flex items-center gap-1 hover:text-primary"><Star className="w-4 h-4" /> Favorilere Ekle</Link>
                <Link href="#" className="flex items-center gap-1 hover:text-primary"><Printer className="w-4 h-4" /> Yazdır</Link>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8 bg-[#3b5998] text-white hover:bg-[#3b5998]/90">f</Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90">t</Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 bg-[#E60023] text-white hover:bg-[#E60023]/90">P</Button>
                </div>
            </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">Teddybear Pomerianboo</h1>
      
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        
        {/* --- 1. SOL SÜTUN (MEDYA VE AÇIKLAMA) --- */}
        <div className="lg:col-span-5 space-y-6">
            {/* Gallery */}
            <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border mb-2">
                    <Image src={mainImage} alt="Main pet image" fill className="object-cover" />
                     <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70">
                        <ChevronLeft />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70">
                        <ChevronRight />
                    </Button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {galleryImages.map((img, idx) => (
                        <button key={idx} onClick={() => setMainImage(img)} className={`aspect-square relative rounded-md overflow-hidden border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}>
                             <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Menu */}
             <div className="flex items-center gap-4 text-sm border-b pb-2">
                <button className="flex items-center gap-1 text-red-600 font-semibold">
                    <Camera className="w-4 h-4"/> Fotoğrafı Büyüt
                </button>
                <button className="flex items-center gap-1 text-muted-foreground">
                    <Video className="w-4 h-4"/> Video
                </button>
            </div>

            {/* İlan Detayları */}
            <div className="space-y-2">
                <div className="bg-gray-700 text-white font-bold text-sm py-2 px-4 rounded-t-md">
                    İlan Detayları
                </div>
                <div className="border bg-white p-4 rounded-b-md">
                    <p className="text-sm leading-relaxed">
                        EV ORTAMINDA SAĞLIKLI VE MUTLU BİR ŞEKİLDE BÜYÜTTÜĞÜMÜZ YAVRULARI VETERİNERİMİZ KONTROLÜNDE YENİ YUVALARINA TESLİM EDİYORUZ
                    </p>
                </div>
            </div>
        </div>

        {/* --- 2. ORTA SÜTUN (TEKNİK TABLO) --- */}
        <div className="lg:col-span-4">
            <div className="border rounded-lg bg-white p-4">
                <h2 className="text-2xl font-bold text-blue-600 mb-1">Görüşülür</h2>
                <div className="text-sm text-muted-foreground mb-4">
                    İstanbul / Tuzla / Postane Mah.
                </div>

                <ul className="info-table text-sm">
                    <li><span className="label">Türü</span><span className="value">Köpek Cinsleri</span></li>
                    <li><span className="label">Cinsi</span><span className="value"><Link href="#" className="text-red-600 hover:underline">Pomeranian Boo</Link></span></li>
                    <li><span className="label">İlan No</span><span className="value text-red-600 font-semibold">105693</span></li>
                    <li><span className="label">İlan Tarihi</span><span className="value">6 Ocak 2026</span></li>
                    <li><span className="label">Yaş</span><span className="value">2 Aylık</span></li>
                    <li><span className="label">Cinsiyet</span><span className="value">Erkek</span></li>
                    <li><span className="label">Durum</span><span className="value">Görüşülür</span></li>
                    <li><span className="label">Aşı</span><span className="value">Var</span></li>
                    <li><span className="label">İç Parazit</span><span className="value">Var</span></li>
                    <li><span className="label">Dış Parazit</span><span className="value">Yok</span></li>
                    <li><span className="label">Kredi Kartına Ödeme</span><span className="value">Yok</span></li>
                    <li><span className="label">Şehir Dışına Gönderim</span><span className="value">Var</span></li>
                </ul>

                <div className="mt-4 pt-4 border-t text-sm space-y-1 text-muted-foreground">
                    <p>İlan Whatsapp'tan <span className="font-bold text-primary">5</span> İstek aldı</p>
                    <p>İncelenen İlan <span className="font-bold text-primary">0</span> Arama aldı</p>
                    <p>Görüntülenme: <span className="font-bold text-primary">57 kez</span> görüntülendi</p>
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
             {/* İstatistik Kutuları */}
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
            
            {/* Aciliyet Bandı */}
            <div className="bg-red-600 text-white text-center text-sm font-semibold p-2 rounded">
                8 kişi şu anda bu ilanı inceliyor.
            </div>

            {/* Satıcı Kartı */}
            <div className="border rounded-lg bg-white p-4 text-center">
                <h3 className="text-xl font-bold text-primary">PATİLİ HOME</h3>
                <p className="text-xs text-muted-foreground mb-2">Üyelik tarihi: 30 Eylül 2021</p>
                <Link href="#" className="text-sm text-primary hover:underline">Üyenin Tüm İlanlarını Görüntüle</Link>

                <div className="space-y-2 mt-4">
                    <Button variant="secondary" className="w-full justify-start gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700">
                        <Phone className="w-4 h-4"/> 0542 *** ** 93
                    </Button>
                     <Button variant="secondary" className="w-full justify-start gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700">
                        <Phone className="w-4 h-4"/> 0542 *** ** 93
                    </Button>
                    <Button className="w-full justify-center gap-2 bg-green-500 hover:bg-green-600 text-lg py-6">
                        <WhatsappIcon /> WhatsApp
                    </Button>
                </div>
                 <Link href="#" className="text-sm text-primary hover:underline mt-4 inline-flex items-center gap-1">
                    <MessageSquare className="w-4 h-4"/> İlan Sahibine Mesaj Gönder
                </Link>
            </div>
            
            {/* Navigasyon */}
            <div className="grid grid-cols-2 gap-2">
                <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
                    <ChevronLeft className="mr-1"/> Önceki İlan
                </Button>
                <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
                    Sonraki İlan <ChevronRight className="ml-1"/>
                </Button>
            </div>
        </div>
      </div>
      
      {/* Benzer İlanlar Bölümü */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Benzer İlanlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
      
       {/* İlan Değerlendirmeleri Bölümü */}
       <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">İlan Değerlendirmeleri</h2>
        
        {/* Yorum Yazma Formu */}
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Yorumunuzu Paylaşın</CardTitle>
                <CardDescription>Bu ilan hakkındaki düşüncelerinizi diğer kullanıcılarla paylaşın.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Puanınız:</span>
                        <div className="flex items-center text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-6 h-6 cursor-pointer fill-current" />
                            ))}
                        </div>
                    </div>
                    <Textarea placeholder="Yorumunuzu buraya yazın..." rows={4} />
                    <div className="flex justify-end">
                        <Button>Yorumu Gönder</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Mevcut Yorumlar */}
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
