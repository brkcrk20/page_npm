
'use client';

import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut, Edit, Save, X, FileText, Heart, ShieldCheck, Building, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { doc, updateDoc, getDoc, collection, onSnapshot, query, where, collectionGroup } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import type { UserProfile, PetListing } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUploader } from '@/components/AvatarUploader';


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
              <X className="mr-2 h-4 w-4" /> Sil
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
      async function fetchProfile() {
        if (user && firestore) {
          const docRef = doc(firestore, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
          setIsLoadingProfile(false);
        } else if (!user) {
           setIsLoadingProfile(false);
        }
      }
      fetchProfile();
    }, [user, firestore]);

    const favoriteIds = profile?.favoritePetIds || [];
    
    const favoritesQuery = useMemoFirebase(() => {
        if (!firestore || favoriteIds.length === 0) return null;
        return query(collectionGroup(firestore, 'petListings'), where('id', 'in', favoriteIds));
    }, [firestore, favoriteIds]);

    const { data: favoriteListings, isLoading: areListingsLoading } = useCollection<PetListing>(favoritesQuery);
    
    const isLoading = isLoadingProfile || (favoriteIds.length > 0 && areListingsLoading);

    if (isLoading) {
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
                            <X className="mr-2 h-4 w-4" />
                            Favorilerden Kaldır
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    
    const [editModes, setEditModes] = useState<Record<string, boolean>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && firestore) {
            const userProfileRef = doc(firestore, "users", user.uid);
            const unsubscribe = onSnapshot(userProfileRef, (doc) => {
                if (doc.exists()) {
                    setProfileData(doc.data() as UserProfile);
                }
                setIsProfileLoading(false);
            }, (error) => {
                console.error("Error fetching profile:", error);
                setIsProfileLoading(false);
            });

            return () => unsubscribe();
        }

    }, [user, isUserLoading, router, firestore]);

    const handleLogout = () => {
        signOut(auth).then(() => {
            toast({ title: 'Çıkış Yapıldı', description: 'Hesabınızdan güvenle çıkış yaptınız.' });
            router.push('/');
        });
    };
    
    const handleFieldUpdate = async (field: keyof UserProfile) => {
        if (!user || !fieldValues[field]) return;

        setIsUpdating(field);
        try {
            const userProfileRef = doc(firestore, "users", user.uid);
            await updateDoc(userProfileRef, { [field]: fieldValues[field] });
            
            toast({ title: "Başarılı", description: "Profil bilgileriniz güncellendi." });
            setEditModes(prev => ({ ...prev, [field]: false }));
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "Profil güncellenirken bir sorun oluştu." });
            console.error("Profile update error:", error);
        } finally {
            setIsUpdating(null);
        }
    };
    
    const toggleEditMode = (field: keyof UserProfile) => {
        if (!editModes[field]) {
            setFieldValues(prev => ({ ...prev, [field]: profileData?.[field] as string || '' }));
        }
        setEditModes(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

     if (!user) {
        return null; // Should be redirected by the effect
    }
    
    const username = user.displayName || profileData?.username || 'Kullanıcı';

    const InfoRow = ({ label, value, fieldName, isEditable = true }: { label: string, value: string | undefined | null, fieldName?: keyof UserProfile, isEditable?: boolean }) => {
        const isEditing = fieldName && editModes[fieldName];
        const isSaving = isUpdating === fieldName;

        return (
             <li className="flex items-center justify-between p-4 border-b last:border-b-0">
                <span className='w-1/3 text-sm font-medium text-muted-foreground'>{label}</span>
                <div className="flex-grow text-sm">
                     {isEditing && fieldName ? (
                        <Input
                            value={fieldValues[fieldName] || ''}
                            onChange={(e) => setFieldValues(prev => ({...prev, [fieldName]: e.target.value}))}
                            className="h-9"
                            disabled={isSaving}
                        />
                    ) : (
                        value || <span className="text-muted-foreground italic">Belirtilmemiş</span>
                    )}
                </div>
                 {fieldName && isEditable && (
                    <div className="flex items-center gap-2 ml-4 w-32 justify-end">
                        {isEditing ? (
                            <>
                                <Button size="sm" onClick={() => handleFieldUpdate(fieldName)} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => toggleEditMode(fieldName)} disabled={isSaving}><X className="h-4 w-4" /></Button>
                            </>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => toggleEditMode(fieldName)}><Edit className="h-4 w-4 mr-2" /> Değiştir</Button>
                        )}
                    </div>
                )}
             </li>
        );
    };

    return (
        <div className="container mx-auto py-12">
            <Card className="mb-8">
                <CardContent className="p-6 flex items-center space-x-6">
                    <AvatarUploader user={user} />
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold font-headline">{username}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {profileData?.userStatus && (
                            <Badge variant={profileData.userStatus === 'premium' ? 'default' : 'secondary'} className="mt-2 capitalize">
                                {profileData.userStatus}
                            </Badge>
                        )}
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                    </Button>
                </CardContent>
            </Card>

            <main>
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="info">Profil Bilgileri</TabsTrigger>
                        <TabsTrigger value="listings"><FileText className="mr-2" />İlanlarım</TabsTrigger>
                        <TabsTrigger value="favorites"><Heart className="mr-2" />Favorilerim</TabsTrigger>
                        <TabsTrigger value="status"><ShieldCheck className="mr-2 h-4 w-4" />Hesap Durumu</TabsTrigger>
                        <TabsTrigger value="settings"><Settings className="mr-2" />Ayarlar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info" className="mt-6">
                       <Card>
                          <CardHeader>
                              <CardTitle>Genel Bilgiler</CardTitle>
                              <CardDescription>Hesap bilgilerinizi görüntüleyin ve düzenleyin.</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <ul>
                              <InfoRow label="Kullanıcı Adı" value={username} isEditable={false} />
                              <InfoRow label="E-posta" value={user.email} isEditable={false} />
                              <InfoRow label="Telefon Numarası" value={profileData?.phoneNumber} fieldName="phoneNumber" />
                              <InfoRow label="Konum" value={profileData?.location} fieldName="location" />
                            </ul>
                          </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="listings" className="mt-6"><ProfileListings /></TabsContent>
                    <TabsContent value="favorites" className="mt-6"><FavoriteListings /></TabsContent>
                    <TabsContent value="status" className="mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Hesap Durumu ve Bilgileri</CardTitle>
                            <CardDescription>Mevcut hesap seviyenizi ve ilgili bilgileri görüntüleyin.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div>
                              <h3 className="font-medium mb-2">Mevcut Statü</h3>
                              {profileData?.userStatus ? (
                                <Badge variant={profileData.userStatus === 'premium' ? 'default' : profileData.userStatus === 'onayli' ? 'secondary' : 'outline'} className="text-base capitalize">
                                  {profileData.userStatus}
                                </Badge>
                              ) : <Badge variant="outline">standart</Badge>}
                            </div>
                            {profileData?.companyType ? (
                              <div className="border-t pt-6">
                                <h3 className="font-medium mb-4 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" />Kurumsal Bilgiler</h3>
                                <div className="text-sm space-y-3">
                                   <p><strong>Şirket Tipi:</strong> {profileData.companyType}</p>
                                   <p><strong>Firma Ünvanı:</strong> {profileData.companyTitle}</p>
                                   <p><strong>TC Kimlik No:</strong> {profileData.tcNo}</p>
                                   <p><strong>Vergi Dairesi:</strong> {profileData.taxOffice}</p>
                                   <p><strong>Vergi Numarası:</strong> {profileData.taxNo}</p>
                                   <p><strong>Firma Adresi:</strong> {profileData.companyAddress}</p>
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
                      <Card>
                          <CardHeader>
                              <CardTitle>Hesap Ayarları</CardTitle>
                              <CardDescription>Şifrenizi değiştirin veya hesabınızı yönetin.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div>
                                  <h3 className="font-medium mb-2">Şifre Değiştir</h3>
                                  <Button variant="outline" onClick={() => alert('Şifre sıfırlama özelliği henüz tamamlanmadı.')}>Şifre Değiştirme E-postası Gönder</Button>
                              </div>
                              <div className="border-t pt-6">
                                  <h3 className="font-medium mb-2 text-destructive">Hesabı Sil</h3>
                                  <p className="text-sm text-muted-foreground mb-3">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
                                  <Button variant="destructive" onClick={() => alert('Hesap silme özelliği henüz tamamlanmadı. Bu işlem sunucu tarafında yapılmalıdır.')}>Hesabımı Kalıcı Olarak Sil</Button>
                              </div>
                          </CardContent>
                      </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
