'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Loader2, User, FileText, Settings, Heart, Edit, Trash2, Camera, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import type { UserProfile, PetListing } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

function ProfileListings() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userListingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/petListings`);
  }, [firestore, user]);

  const { data: listings, isLoading } = useCollection<PetListing>(userListingsQuery);

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

  if (listings && listings.length === 0) {
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
      {listings?.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="relative w-full aspect-square">
            <Image src={listing.imageUrl} alt={listing.name} fill className="object-cover" />
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
  const [favoriteListings, setFavoriteListings] = useState<PetListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (userProfile && userProfile.favoritePetIds && userProfile.favoritePetIds.length > 0) {
        try {
          const listingsRef = collection(firestore, 'petListings');
          const q = query(listingsRef, where('id', 'in', userProfile.favoritePetIds));
          const querySnapshot = await getDocs(q);
          const listings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PetListing[];
          setFavoriteListings(listings);
        } catch (error) {
          console.error("Error fetching favorite listings:", error);
        }
      } else {
        setFavoriteListings([]);
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [userProfile, firestore]);

  if (isLoading) {
     return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
    );
  }

  if (favoriteListings.length === 0) {
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
      {/* Re-using a simplified PetCard structure, you can also import PetCard component if needed */}
      {favoriteListings.map(pet => (
        <Link key={pet.id} href={`/listings/${pet.id}`} className="group block">
            <Card className="overflow-hidden">
                <div className="relative aspect-square">
                    <Image src={pet.imageUrl} alt={pet.name} fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-lg truncate">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">{pet.breed}</p>
                </CardContent>
            </Card>
        </Link>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
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

  if (isUserLoading || !user || isProfileLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() ?? 'U';
    return name.charAt(0).toUpperCase();
  };
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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
          description: 'Profil resmi yüklenirken bir hata oluştu.',
        });
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Firebase Auth profile
          await updateProfile(user, { photoURL: downloadURL });

          // Update Firestore profile
          if (userProfileRef) {
            await updateDoc(userProfileRef, { avatarUrl: downloadURL });
          }

          toast({
            title: 'Başarılı',
            description: 'Profil resminiz güncellendi.',
          });
        } catch (error) {
           console.error('Profile update failed:', error);
           toast({
            variant: 'destructive',
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
      toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
    } catch (error) {
       toast({ variant: "destructive", title: "Hata", description: "Profil güncellenirken bir sorun oluştu." });
      console.error("Profile update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePasswordReset = () => {
    // TODO: Implement password reset logic
    alert('Şifre sıfırlama özelliği henüz tamamlanmadı.');
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion logic (needs a backend function)
    alert('Hesap silme özelliği henüz tamamlanmadı. Bu işlem sunucu tarafında yapılmalıdır.');
  }

  const avatarUrl = userProfile?.avatarUrl ?? user.photoURL ?? '';

  return (
    <div className="container mx-auto py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Column */}
        <aside className="md:col-span-1 space-y-8">
          <Card>
            <CardContent className="p-6 flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/50">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback className="text-4xl bg-secondary">{getInitials(username)}</AvatarFallback>
                </Avatar>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="icon"
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploadProgress !== null}
                >
                  {uploadProgress !== null ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  <span className="sr-only">Profil resmini değiştir</span>
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
              </div>
              {uploadProgress !== null && (
                <div className="w-32">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              <div className="text-center">
                <h1 className="text-2xl font-bold font-headline">{username}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
               <Button variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
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

        </aside>

        {/* Right Column */}
        <main className="md:col-span-3">
          <Tabs defaultValue="listings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="listings"><FileText className="mr-2" />İlanlarım</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="mr-2" />Favorilerim</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="mr-2" />Ayarlar</TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="mt-6">
                <ProfileListings />
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
                 <FavoriteListings />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
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
            </TabsContent>
          </Tabs>
        </main>

      </div>
    </div>
  );
}
