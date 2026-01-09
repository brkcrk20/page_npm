'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useStorage, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, User, FileText, Settings, Heart, Edit, Trash2, Camera, LogOut, ShieldCheck, Building } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, updateDoc, collection, query } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile, signOut } from 'firebase/auth';
import type { UserProfile, PetListing } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';

function ProfileListings() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userListingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/petListings`));
  }, [firestore, user]);

  const { data: userListings, isLoading } = useCollection<PetListing>(userListingsQuery);

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <Skeleton className="w-full h-40" />
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  if (userListings && userListings.length === 0) {
    return (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold">Henüz hiç ilan vermediniz.</p>
            <p className="text-sm">Yeni bir ilan oluşturarak başlayabilirsiniz.</p>
            <Button asChild className="mt-4">
                <Link href="/listings/new">Yeni İlan Oluştur</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {userListings?.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="relative w-full aspect-video">
            <Image src={listing.imageUrl} alt={listing.name} fill className="object-cover" />
             <Badge className="absolute top-2 right-2" variant={listing.isFeatured ? "default" : "secondary"}>
                {listing.isFeatured ? "Yıldızlı" : "Normal"}
             </Badge>
          </div>
          <CardHeader>
            <CardTitle>{listing.name}</CardTitle>
            <CardDescription>{listing.breed}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
             <Button variant="outline" size="sm" onClick={() => alert('Düzenleme henüz aktif değil.')}>
              <Edit className="mr-2 h-4 w-4" /> Düzenle
            </Button>
            <Button variant="destructive" size="sm" onClick={() => alert('Silme henüz aktif değil.')}>
              <Trash2 className="mr-2 h-4 w-4" /> Sil
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


function FavoriteListings() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const favoritesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || !userProfile.favoritePetIds || userProfile.favoritePetIds.length === 0) {
      return null;
    }
    // This query is inefficient and should be improved if many pet listings exist.
    // A better approach would involve denormalizing favorite data or using a dedicated favorites collection.
    // For this prototype, we'll proceed with a potentially slow 'in' query.
    return query(collection(firestore, 'petListings'), where('id', 'in', userProfile.favoritePetIds));
  }, [firestore, userProfile]);

  const { data: favoriteListings, isLoading } = useCollection<PetListing>(favoritesQuery);

  // We only want to show loading state if we know there are favorites to fetch.
  const effectiveIsLoading = (userProfile?.favoritePetIds?.length ?? 0) > 0 && isLoading;
  
  if (effectiveIsLoading) {
     return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
    );
  }

  if (!favoriteListings || favoriteListings.length === 0) {
    return (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
           <Heart className="mx-auto h-12 w-12 mb-4" />
           <p className="font-semibold">Favori ilanınız bulunmuyor.</p>
           <p className="text-sm">İlanları gezerken kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.</p>
       </div>
    );
  }

  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {favoriteListings.map(pet => (
        <Card key={pet.id} className="overflow-hidden group">
            <Link href={`/listings/${pet.id}`} className="block">
                <div className="relative aspect-square">
                    <Image src={pet.imageUrl} alt={pet.name} fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-lg truncate">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">{pet.breed}</p>
                </CardContent>
            </Link>
             <CardContent className="p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => alert('Favorilerden kaldırma henüz aktif değil.')}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Favorilerden Kaldır
                </Button>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}

const getStatusVariant = (status?: UserProfile['userStatus']) => {
    switch (status) {
      case 'premium':
        return 'default';
      case 'onayli':
        return 'secondary';
      case 'yasakli':
        return 'destructive';
      default:
        return 'outline';
    }
};

export default function ProfilePage() {
  const { user, isUserLoading, auth } = useFirebase();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
     if (userProfile) {
      setUsername(userProfile.username || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setLocation(userProfile.location || '');
    }
  }, [user, isUserLoading, router, userProfile]);
  
  const handleLogout = () => {
    signOut(auth);
    toast({ title: 'Çıkış Yapıldı', description: 'Hesabınızdan güvenle çıkış yaptınız.' });
    router.push('/');
  };

  if (isUserLoading || !user || isProfileLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() ?? 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userProfileRef) return;

    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        toast({
          variant: 'destructive',
          title: 'Yükleme Başarısız',
          description: 'Profil resmi yüklenirken bir hata oluştu. İzinlerinizi kontrol edin.',
        });
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await updateDoc(userProfileRef, { avatarUrl: downloadURL });
          // CRITICAL FIX: Pass the 'user' object from the hook, not the 'auth' service itself.
          await updateProfile(user, { photoURL: downloadURL });

          toast({
            title: 'Başarılı',
            description: 'Profil resminiz güncellendi.',
          });
        } catch (error) {
           console.error('Profile update failed:', error);
           toast({
            variant: "destructive",
            title: 'Güncelleme Başarısız',
            description: 'Profil bilgileri güncellenirken bir hata oluştu.',
          });
        } finally {
          setUploadProgress(null);
        }
      }
    );
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfileRef) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(userProfileRef, {
        username: username,
        phoneNumber: phoneNumber,
        location: location
      });
       if(user.displayName !== username) {
        await updateProfile(user, { displayName: username });
       }
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
    } catch (error) {
       toast({ variant: "destructive", title: "Hata", description: "Profil güncellenirken bir sorun oluştu." });
      console.error("Profile update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePasswordReset = () => {
    alert('Şifre sıfırlama özelliği henüz tamamlanmadı.');
  }

  const handleDeleteAccount = () => {
    alert('Hesap silme özelliği henüz tamamlanmadı. Bu işlem sunucu tarafında yapılmalıdır.');
  }

  const avatarUrl = userProfile?.avatarUrl ?? user.photoURL ?? '';

  return (
    <div className="container mx-auto py-12">
        <Card className="mb-8">
            <CardContent className="p-6 flex items-center space-x-6">
                 <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/50">
                        <AvatarImage src={avatarUrl} alt={userProfile?.username} />
                        <AvatarFallback className="text-3xl bg-secondary">{getInitials(userProfile?.username)}</AvatarFallback>
                    </Avatar>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="icon"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                        disabled={uploadProgress !== null}
                    >
                        {uploadProgress !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        <span className="sr-only">Profil resmini değiştir</span>
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                    />
                     {uploadProgress !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <Progress value={uploadProgress} className="h-1 w-16" />
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold font-headline">{userProfile?.username}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                     <Badge variant={getStatusVariant(userProfile?.userStatus)} className="mt-2 capitalize">
                        {userProfile?.userStatus || 'standart'}
                    </Badge>
                </div>
                 <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                </Button>
            </CardContent>
        </Card>

        <main>
          <Tabs defaultValue="listings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="listings"><FileText className="mr-2" />İlanlarım</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="mr-2" />Favorilerim</TabsTrigger>
              <TabsTrigger value="status"><ShieldCheck className="mr-2 h-4 w-4" />Hesap Durumu</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="mr-2" />Ayarlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="listings" className="mt-6">
                <ProfileListings />
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
                 <FavoriteListings />
            </TabsContent>

            <TabsContent value="status" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hesap Durumu ve Bilgileri</CardTitle>
                  <CardDescription>Mevcut hesap seviyenizi ve ilgili bilgileri görüntüleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Mevcut Statü</h3>
                    <Badge variant={getStatusVariant(userProfile?.userStatus)} className="text-base capitalize">
                      {userProfile?.userStatus || 'standart'}
                    </Badge>
                  </div>
                  
                  {userProfile?.companyType ? (
                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Kurumsal Bilgiler</h3>
                      <div className="text-sm space-y-3">
                         <p><strong>Şirket Tipi:</strong> {userProfile.companyType}</p>
                         <p><strong>Firma Ünvanı:</strong> {userProfile.companyTitle}</p>
                         <p><strong>TC Kimlik No:</strong> {userProfile.tcNo}</p>
                         <p><strong>Vergi Dairesi:</strong> {userProfile.taxOffice}</p>
                         <p><strong>Vergi Numarası:</strong> {userProfile.taxNo}</p>
                         <p><strong>Firma Adresi:</strong> {userProfile.companyAddress}</p>
                      </div>
                    </div>
                  ) : (
                     <div className="border-t pt-6 text-center text-muted-foreground">
                        <Building className="mx-auto h-10 w-10 mb-2" />
                        <p className="font-semibold">Kurumsal üyeliğiniz bulunmamaktadır.</p>
                        <p className="text-xs">Kurumsal üye olarak daha fazla ilanı öne çıkarabilir ve ek avantajlardan yararlanabilirsiniz.</p>
                        <Button variant="secondary" className="mt-4">Kurumsal Üyeliğe Geç (Yakında)</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Profil Bilgileri</CardTitle>
                            <CardDescription>Genel profil bilgilerinizi güncelleyin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-1">
                                <Label htmlFor="displayName">Kullanıcı Adı</Label>
                                <Input id="displayName" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Adınız" />
                                </div>
                                <div className="space-y-1">
                                <Label htmlFor="phoneNumber">Telefon Numarası</Label>
                                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Telefon numaranız" />
                                </div>
                                <div className="space-y-1">
                                <Label htmlFor="location">Konum</Label>
                                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Şehir, Ülke" />
                                </div>
                                <div className="space-y-1">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" type="email" value={user.email ?? ''} disabled />
                                </div>
                                <Button type="submit" disabled={isUpdating} className="w-full">
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Bilgileri Güncelle
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Hesap Ayarları</CardTitle>
                            <CardDescription>Şifrenizi değiştirin veya hesabınızı yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Şifre Değiştir</h3>
                                <Button variant="outline" onClick={handlePasswordReset}>Şifre Değiştirme E-postası Gönder</Button>
                            </div>
                            <div className="border-t pt-6">
                                <h3 className="font-medium mb-2 text-destructive">Hesabı Sil</h3>
                                <p className="text-sm text-muted-foreground mb-3">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
                                <Button variant="destructive" onClick={handleDeleteAccount}>Hesabımı Kalıcı Olarak Sil</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

          </Tabs>
        </main>
    </div>
  );
}

    