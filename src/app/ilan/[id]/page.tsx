// This is a new file for handling individual pet listings based on ID.
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { pets } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Phone, MessageSquare, ShieldCheck, User, Calendar, Heart, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';

export default function IlanPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const pet = pets.find((p) => p.id === id);

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

  const image = PlaceHolderImages.find((img) => img.id === pet.image);

  return (
    <div className="container mx-auto py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                  <CardTitle className="text-3xl font-headline">{pet.name}</CardTitle>
                  <CardDescription className="text-lg">{pet.breed}</CardDescription>
                </div>
                <Badge variant={pet.listingType === 'Sale' ? 'destructive' : 'secondary'} className="text-base mt-2 sm:mt-0 self-start sm:self-center">
                  {pet.listingType === 'Sale' ? 'Satılık' : 'Sahiplendirme'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
                {image ? (
                  <Image src={image.imageUrl} alt={pet.name} fill className="object-cover" data-ai-hint={image.imageHint} />
                ) : (
                  <div className="bg-secondary flex items-center justify-center h-full">
                    <span className="text-muted-foreground">Resim Yok</span>
                  </div>
                )}
              </div>
              <div className="prose max-w-none text-card-foreground">
                <h3 className="font-bold border-b pb-2 mb-4">Açıklama</h3>
                <p>
                  Bu kısımda evcil hayvanla ilgili detaylı açıklamalar yer alacak. Örneğin, {pet.name} çok oyuncu ve enerjik bir {pet.type.toLowerCase()}. İnsanlarla ve diğer hayvanlarla arası çok iyi. Tuvalet eğitimi var ve temel komutları biliyor. Yeni ailesine mutluluk getireceğinden eminiz.
                </p>
                
                <h3 className="font-bold border-b pb-2 mb-4 mt-8">Özellikler</h3>
                <ul className="grid grid-cols-2 gap-4 list-none p-0">
                  <li className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> <strong>Yaş:</strong> {pet.age}</li>
                  <li className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> <strong>Konum:</strong> {pet.location}</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> <strong>Aşı Durumu:</strong> Tam</li>
                  <li className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> <strong>Kısırlaştırılmış:</strong> Evet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İlan Sahibi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-10 h-10 text-muted-foreground" />
                <div>
                  <p className="font-bold">Ahmet Yılmaz</p>
                  <p className="text-xs text-muted-foreground">Güvenilir Üye</p>
                </div>
              </div>
              <Button className="w-full" size="lg"><Phone className="mr-2" /> Telefon Numarasını Göster</Button>
              <Button variant="outline" className="w-full" size="lg"><MessageSquare className="mr-2" /> Mesaj Gönder</Button>
            </CardContent>
          </Card>
           <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2"><AlertCircle /> Güvenlik Uyarısı</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive/80 space-y-2">
                <p>Evcil hayvan sahiplenirken veya satın alırken kesinlikle kapora veya ön ödeme yapmayınız.</p>
                <p>Patisemti.com üzerinden yapılan alışverişlerin sorumluluğu alıcı ve satıcıya aittir.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
