'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, User, FileText, Settings, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
     if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      // In a real app, you'd fetch the full user profile from Firestore
      // For now, we'll just use what's in the auth object
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement profile update logic (e.g., updateProfile in Firebase Auth, and update user doc in Firestore)
    console.log('Updating profile with:', { displayName, phoneNumber, location });
    alert('Profil güncelleme özelliği henüz tamamlanmadı.');
  };

  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col items-center space-y-4 mb-10">
        <Avatar className="h-32 w-32 border-4 border-primary/50">
          <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
          <AvatarFallback className="text-4xl bg-secondary">{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">{user.displayName || 'Kullanıcı'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile"><User className="mr-2" />Profil Bilgileri</TabsTrigger>
          <TabsTrigger value="listings"><FileText className="mr-2" />İlanlarım</TabsTrigger>
          <TabsTrigger value="favorites"><Heart className="mr-2" />Favorilerim</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2" />Ayarlar</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgilerini Güncelle</CardTitle>
              <CardDescription>Kişisel bilgilerinizi buradan düzenleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Görünür İsim</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Adınız" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" value={user.email ?? ''} disabled />
                  <p className="text-xs text-muted-foreground">E-posta adresiniz değiştirilemez.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                  <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Telefon numaranız" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="location">Konum</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Şehir, Ülke" />
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Bilgileri Güncelle</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listings" className="mt-6">
            <div className="text-center py-20 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p className="font-semibold">Henüz hiç ilan vermediniz.</p>
                <p className="text-sm">Yeni bir ilan oluşturarak başlayabilirsiniz.</p>
                <Button asChild className="mt-4">
                    <a href="/listings/new">Yeni İlan Oluştur</a>
                </Button>
            </div>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
             <div className="text-center py-20 text-muted-foreground">
                <Heart className="mx-auto h-12 w-12 mb-4" />
                <p className="font-semibold">Favori ilanınız bulunmuyor.</p>
                <p className="text-sm">İlanları gezerken kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.</p>
            </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Hesap Ayarları</CardTitle>
                    <CardDescription>Şifrenizi değiştirin veya hesabınızı yönetin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">Şifre Değiştir</h3>
                        <Button variant="outline">Şifre Değiştirme E-postası Gönder</Button>
                    </div>
                     <div className="border-t pt-4">
                        <h3 className="font-medium mb-2 text-destructive">Hesabı Sil</h3>
                        <p className="text-sm text-muted-foreground mb-3">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
                        <Button variant="destructive">Hesabımı Kalıcı Olarak Sil</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
