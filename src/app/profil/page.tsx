
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut, Edit, Save, X, FileText, Heart, ShieldCheck, Building, Settings, User as UserIcon, Coins, Briefcase, Plus, Phone, Eye, MessageCircle, CreditCard, Image as ImageIcon, CheckCircle, ListTree } from 'lucide-react';
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
import { initializeFirebase } from '@/firebase';

const { auth, firestore } = initializeFirebase();

function ProfileListings() {
  const { user } = useUser();
 
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
            <Image src={listing.imageUrl} alt={listing.name} fill className="object-cover" loading="lazy"/>
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }
      const docRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setIsLoadingProfile(false);
      }, () => {
        setIsLoadingProfile(false);
      });
      return () => unsubscribe();
    }, [user]);

    const favoriteIds = profile?.favoritePetIds || [];
    
    const favoritesQuery = useMemoFirebase(() => {
        if (favoriteIds.length === 0 || !user) return null;
        // This query structure is problematic for collectionGroup queries with 'in' on the document ID.
        // A better approach would be to have a separate 'favorites' subcollection for each user.
        // For now, we will assume the IDs are structured correctly for a potential future refactor.
        const favoritePaths = favoriteIds.map(id => `users/${user.uid}/petListings/${id}`);
        if(favoritePaths.length === 0) return null;
        return query(collectionGroup(firestore, 'petListings'), where('__name__', 'in', favoritePaths));
    }, [favoriteIds, user]);
    
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
                    <Link href={`/ilan/${pet.id}`} className="block">
                        <div className="relative aspect-square">
                            <Image src={pet.imageUrl} alt={pet.name} fill className="object-cover transition-transform group-hover:scale-105" loading="lazy"/>
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

const PlaceholderContent = ({ title, icon }: { title: string, icon: React.ElementType }) => {
    const Icon = icon;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                    <Icon className="w-16 h-16 mb-4" />
                    <p className="font-bold text-lg">Bu Alan Yapım Aşamasında</p>
                    <p className="text-sm">{title} ile ilgili özellikler yakında burada olacak.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
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

        if (user) {
            const userProfileRef = doc(firestore, "users", user.uid);
            const unsubscribe = onSnapshot(userProfileRef, (doc) => {
                if (doc.exists()) {
                    setProfileData(doc.data() as UserProfile);
                }
                setIsProfileLoading(false);
            }, (error) => {
                setIsProfileLoading(false);
            });

            return () => unsubscribe();
        }

    }, [user, isUserLoading, router]);

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
        } finally {
            setIsUpdating(null);
        }
    };
    
    const toggleEditMode = async (field: keyof UserProfile) => {
        if (!editModes[field] && user) {
            const docRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const currentProfile = docSnap.data() as UserProfile;
                 setFieldValues(prev => ({ ...prev, [field]: currentProfile[field] as string || '' }));
            }
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
    
    const username = profileData?.name || 'Kullanıcı';
    
    const userType = profileData?.companyType ? 'Kurumsal Üye' : 'Bireysel Üye';

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
    
    const StatItem = ({ icon, value, label }: { icon: React.ElementType, value: string, label: string }) => {
        const Icon = icon;
        return (
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary" />
                <div className="text-left">
                    <p className="font-bold text-lg">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        );
    };


    return (
        <div className="container mx-auto py-12">
           <Tabs defaultValue="credit" className="w-full">
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="h-28 w-28 flex-shrink-0 flex items-center justify-center rounded-full bg-secondary text-primary">
                            <UserIcon className="h-16 w-16" />
                        </div>
                        <div className="flex-grow grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 text-center md:text-left w-full">
                            <StatItem icon={FileText} value="5" label="Toplam İlan" />
                            <StatItem icon={MessageCircle} value="12" label="Whatsapp Talebi" />
                            <StatItem icon={Phone} value="8" label="Arama Talebi" />
                            <StatItem icon={Eye} value="1.2k" label="Görüntülenme" />
                        </div>
                    </div>
                    <div className="border-t mt-6 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl font-bold font-headline">{username}</h1>
                            <p className="text-sm text-muted-foreground">
                                Üyelik Tarihi: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                            </p>
                        </div>
                         <div className="flex flex-col sm:flex-row md:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
                             <div className="flex items-center gap-2">
                                <Badge variant={getStatusVariant(profileData?.userStatus)} className="capitalize text-base">
                                  {profileData?.userStatus || 'standart'}
                                </Badge>
                                <Badge variant="outline" className="text-base">{userType}</Badge>
                             </div>
                             <div className='flex gap-3 w-full sm:w-auto'>
                                <Button variant="outline" className='flex-1'>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Profili Düzenle
                                </Button>
                                <Button asChild className='flex-1'>
                                    <Link href="/listings/new">
                                        <Plus className="mr-2 h-4 w-4" />
                                        İlan Ekle
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
                 <TabsList className="grid w-full grid-cols-4 rounded-t-none">
                    <TabsTrigger value="credit">Üye İlan Kredisi</TabsTrigger>
                    <TabsTrigger value="photo-limit">Fotoğraf Limiti</TabsTrigger>
                    <TabsTrigger value="instant-approval">Anında Onay</TabsTrigger>
                    <TabsTrigger value="category-limit">Kategori Limiti</TabsTrigger>
                </TabsList>
            </Card>

            <main className="mt-6">
                <TabsContent value="credit">
                    <PlaceholderContent title="Üye İlan Kredisi" icon={CreditCard} />
                </TabsContent>
                <TabsContent value="photo-limit">
                   <PlaceholderContent title="Fotoğraf Limiti" icon={ImageIcon} />
                </TabsContent>
                <TabsContent value="instant-approval">
                   <PlaceholderContent title="Anında Onay" icon={CheckCircle} />
                </TabsContent>
                <TabsContent value="category-limit">
                   <PlaceholderContent title="Kategori Limiti" icon={ListTree} />
                </TabsContent>
            </main>
            </Tabs>
        </div>
    );
}
