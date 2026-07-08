'use client';

import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Star, Phone, MessageSquare, Eye, MapPin, Calendar, Award, Shield, Truck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetCard } from '@/components/PetCard';

// İLAN TİPİ TANIMLAMA
interface Ilan {
  id: string;
  ilan_no?: number;
  baslik?: string;
  baslik_slug?: string;
  aciklama?: string;
  fiyat?: number;
  kategori_id?: string;
  kategori_slug?: string;
  cins?: string;
  yas?: string;
  cinsiyet?: string;
  sehir?: string;
  ilce?: string;
  resimler?: string[];
  kullanici_id?: string;
  kullanici_adi?: string;
  uyelik_tarihi?: string;
  telefon?: string;
  olusturma_tarihi?: any;
  durum?: string;
  onayDurumu?: string;
  goruntulenme?: number;
  whatsapp_istek?: number;
  arama_sayisi?: number;
  favori_sayisi?: number;
  asliVar?: boolean;
  pedili?: boolean;
  krediKartı?: boolean;
  islemTuru?: string;
  kargo?: boolean;
  garanti?: boolean;
}

export default function IlanDetayPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [ilan, setIlan] = useState<Ilan | null>(null);
  const [benzerIlanlar, setBenzerIlanlar] = useState<Ilan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIlan = async () => {
      try {
        console.log("Slug:", slug);
        
        if (!slug) {
          setLoading(false);
          return;
        }
        
        const { firestore } = initializeFirebase();
        
        // Link'teki Firebase ID'sini al (son tireden sonrası)
        const firebaseId = slug.split('-').pop();
        console.log("Firebase ID:", firebaseId);
        
        if (!firebaseId) {
          setLoading(false);
          return;
        }
        
        // Firebase ID'sine göre direkt getir
        const ilanDocRef = doc(firestore, 'ilanlar', firebaseId);
        const ilanDocSnap = await getDoc(ilanDocRef);
        
        if (!ilanDocSnap.exists()) {
          setLoading(false);
          return;
        }
        
        const ilanData = { id: ilanDocSnap.id, ...ilanDocSnap.data() } as Ilan;
        setIlan(ilanData);
        
        // Benzer ilanları getir (aynı cins)
        if (ilanData.cins && ilanData.kategori_id) {
          const benzerQuery = query(
            collection(firestore, 'ilanlar'),
            where('cins', '==', ilanData.cins),
            where('kategori_id', '==', ilanData.kategori_id),
            where('onayDurumu', '==', 'onaylandi')
          );
          
          const snapshot = await getDocs(benzerQuery);
          const benzer = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Ilan))
            .filter(item => item.id !== ilanData.id)
            .slice(0, 4);
          
          setBenzerIlanlar(benzer);
        }
      } catch (error) {
        console.error("İlan yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchIlan();
    }
  }, [slug]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  if (!ilan) {
    return notFound();
  }
  
  const kategoriAdi = ilan.kategori_id === '1' ? 'Köpek İlanları' : 'Kedi İlanları';
  const kategoriSlug = ilan.kategori_id === '1' ? 'kopek-ilanlari' : 'kedi-ilanlari';
  const fiyatGosterim = ilan.fiyat && ilan.fiyat > 0 ? `${ilan.fiyat.toLocaleString()} TL` : 'Görüşülür';
  
  // Tarih formatlama
  let ilanTarihi = 'Belirtilmemiş';
  if (ilan.olusturma_tarihi) {
    try {
      ilanTarihi = new Date(ilan.olusturma_tarihi.seconds * 1000).toLocaleDateString('tr-TR');
    } catch {
      ilanTarihi = 'Belirtilmemiş';
    }
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-primary">Anasayfa</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href={`/${kategoriSlug}`} className="hover:text-primary">{kategoriAdi}</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        {ilan.cins && (
          <>
            <Link href={`/${kategoriSlug}`} className="hover:text-primary">{ilan.cins}</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
          </>
        )}
        <span className="font-semibold text-foreground">{ilan.baslik}</span>
      </div>
      
      {/* Ana Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SOL KOLON - Fotoğraflar ve Açıklama */}
        <div className="lg:col-span-7">
          {/* Ana Fotoğraf */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border mb-2">
            <Image 
              src={ilan.resimler?.[0] || '/placeholder-pet.png'} 
              alt={ilan.baslik || 'İlan görseli'}
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Küçük Resimler */}
          {ilan.resimler && ilan.resimler.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mb-4">
              {ilan.resimler.slice(1, 6).map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image src={img} alt={`Resim ${idx+2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          
          {/* İlan Detayları Başlık */}
          <div className="bg-gray-800 text-white font-bold py-3 px-4 rounded-t-md mt-6">
            İlan Detayları
          </div>
          
          {/* Açıklama */}
          <div className="border border-t-0 rounded-b-md p-6 bg-white mb-6">
            <p className="whitespace-pre-line leading-relaxed">{ilan.aciklama}</p>
          </div>
          
          {/* Özellikler Tablosu */}
          <div className="border rounded-md overflow-hidden bg-white">
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">Türü</div>
              <div className="p-3">{ilan.kategori_id === '1' ? 'Köpek' : 'Kedi'}</div>
            </div>
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">Cinsi</div>
              <div className="p-3 text-orange-600 font-medium">{ilan.cins || 'Belirtilmemiş'}</div>
            </div>
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">İlan No</div>
              <div className="p-3 font-mono">{ilan.ilan_no || 'Belirtilmemiş'}</div>
            </div>
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">İlan Tarihi</div>
              <div className="p-3">{ilanTarihi}</div>
            </div>
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">Yaş</div>
              <div className="p-3">{ilan.yas || 'Belirtilmemiş'}</div>
            </div>
            <div className="grid grid-cols-2 border-b">
              <div className="p-3 font-semibold bg-gray-50">Cinsiyet</div>
              <div className="p-3">{ilan.cinsiyet || 'Belirtilmemiş'}</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="p-3 font-semibold bg-gray-50">Şehir</div>
              <div className="p-3">{ilan.sehir} / {ilan.ilce}</div>
            </div>
          </div>
        </div>
        
        {/* ORTA KOLON - Bilgiler */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border p-5 sticky top-4">
            {/* Fiyat */}
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-orange-600">{fiyatGosterim}</div>
            </div>
            
            {/* Kısa Bilgiler */}
            <div className="space-y-3 text-sm mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{ilan.sehir} / {ilan.ilce}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{ilanTarihi}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <span>{ilan.goruntulenme || 0} görüntülenme</span>
              </div>
            </div>
            
            {/* Rozetler */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ilan.asliVar && <Badge className="bg-green-100 text-green-800 border-green-200">Aşılı</Badge>}
              {ilan.pedili && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pedigrili</Badge>}
              {ilan.krediKartı && <Badge className="bg-purple-100 text-purple-800 border-purple-200">Kredi Kartı</Badge>}
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">{ilan.islemTuru || 'Sahiplendirme'}</Badge>
            </div>
            
            {/* İlan Sahibi */}
            <div className="border-t pt-4 mb-4">
              <h3 className="font-bold mb-3">İlan Sahibi</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                  {ilan.kullanici_adi?.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="font-medium">{ilan.kullanici_adi || 'Patili Üye'}</div>
                  <div className="text-xs text-muted-foreground">Üyelik: {ilan.uyelik_tarihi || 'Belirtilmemiş'}</div>
                </div>
              </div>
              
              {/* İletişim Butonları */}
              <div className="space-y-2">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 gap-2">
                  <Phone className="h-4 w-4" /> {ilan.telefon || 'Telefon'}
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" /> Mesaj Gönder
                </Button>
              </div>
            </div>
            
            {/* Ek Hizmetler */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ilan.kargo && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Truck className="h-3 w-3" /> Kargo Var
                  </div>
                )}
                {ilan.krediKartı && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CreditCard className="h-3 w-3" /> Kredi Kartı
                  </div>
                )}
                {ilan.garanti && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Shield className="h-3 w-3" /> Sağlık Garantili
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* SAĞ KOLON - İstatistikler */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-4 sticky top-4">
            <h3 className="font-bold mb-3">İlan İstatistikleri</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Görüntülenme</span>
                <span className="font-bold">{ilan.goruntulenme || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Whatsapp İstek</span>
                <span className="font-bold">{ilan.whatsapp_istek || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-600">Arama Aldı</span>
                <span className="font-bold">{ilan.arama_sayisi || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Favori</span>
                <span className="font-bold">{ilan.favori_sayisi || 0}</span>
              </div>
            </div>
            
            {/* Anlık İnceleyen */}
            <div className="mt-4 bg-red-50 text-red-600 text-center py-2 rounded-lg text-sm font-medium">
              4 kişi şu anda bu ilanı inceliyor.
            </div>
            
            {/* Navigasyon */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="outline" size="sm" className="text-xs">
                ← Önceki İlan
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Sonraki İlan →
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Benzer İlanlar */}
      {benzerIlanlar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Benzer İlanlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {benzerIlanlar.map((benzer: any) => (
              <PetCard key={benzer.id} pet={benzer} />
            ))}
          </div>
        </div>
      )}
      
      {/* Değerlendirmeler */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">İlan Değerlendirmeleri</h2>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-8">
              Bu ilana henüz yorum yapılmamış. İlk yorumu siz yapın!
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Uyarı */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-medium mb-1">⚠️ Tanımadığınız Kişilere Dikkat!</p>
        <p>petsemti.com, pet arayanlar ve sahiplendirme yapanları buluşturan bir platform olup, satış yapmamaktadır. Yüz yüze görüşülmeyen kişilere hiçbir şekilde kaparo ya da bir benzeri ödeme yapılmaması gerekmektedir.</p>
      </div>
    </div>
  );
}