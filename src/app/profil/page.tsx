'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { listingPhotoUrl } from '@/lib/supabase/storage';

type MyListing = {
  id: number;
  slug: string;
  title: string;
  status: string;
  price: number | null;
  kind: string;
  created_at: string;
  view_count: number;
  listing_photos: { storage_path: string; position: number }[];
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  taslak: { label: 'Taslak', variant: 'secondary' },
  onay_bekliyor: { label: 'Onay Bekliyor', variant: 'secondary' },
  yayinda: { label: 'Yayında', variant: 'default' },
  reddedildi: { label: 'Reddedildi', variant: 'destructive' },
  pasif: { label: 'Yayında Değil', variant: 'secondary' },
  suresi_doldu: { label: 'Süresi Doldu', variant: 'secondary' },
  satildi: { label: 'Satıldı', variant: 'secondary' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isUserLoading, signOut, refreshProfile } = useSupabaseAuth();

  const [listings, setListings] = useState<MyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile?.full_name, profile?.phone]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    // Kendi ilanlarını her durumda görebilir (RLS owner_id üzerinden izin verir),
    // yayında olmayanlar dahil.
    supabase
      .from('listings')
      .select('id, slug, title, status, price, kind, created_at, view_count, listing_photos(storage_path, position)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'İlanlar yüklenemedi', description: error.message });
        }
        setListings((data as MyListing[]) ?? []);
        setIsLoading(false);
      });
  }, [user, toast]);

  async function saveProfile() {
    if (!user) return;
    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq('id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
    } else {
      await refreshProfile();
      toast({ title: 'Profil güncellendi' });
    }
    setIsSaving(false);
  }

  async function deleteListing(id: number) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('listings').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'İlan silinemedi', description: error.message });
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
    toast({ title: 'İlan silindi' });
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-6 md:container md:mx-auto">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgilerim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" value={user.email ?? ''} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {profile?.username && (
                <p className="text-sm text-muted-foreground">
                  Kullanıcı adı: <span className="font-medium">@{profile.username}</span>
                </p>
              )}
              {profile?.account_type === 'kurumsal' && (
                <Badge variant="secondary">Kurumsal Üye</Badge>
              )}
              {profile?.is_verified && <Badge>Güvenli Üye</Badge>}

              <Button onClick={saveProfile} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Kaydet
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                  router.refresh();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">İlanlarım</h1>
            <Button asChild>
              <Link href="/ilan-ver">
                <Plus className="mr-2 h-4 w-4" />
                Yeni İlan
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white py-16 text-center">
              <p className="text-muted-foreground">Henüz ilanınız yok.</p>
              <Button asChild className="mt-4">
                <Link href="/ilan-ver">İlk İlanını Ver</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {listings.map((listing) => {
                const cover = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
                const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;
                const status = STATUS_LABELS[listing.status] ?? { label: listing.status, variant: 'secondary' as const };

                return (
                  <li key={listing.id} className="flex gap-4 rounded-xl border bg-white p-3">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={listing.title} fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          Foto yok
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${listing.slug}-${listing.id}`}
                        className="line-clamp-1 font-semibold hover:text-primary"
                      >
                        {listing.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span>İlan no: {listing.id}</span>
                        <span>{listing.view_count} görüntülenme</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteListing(listing.id)}
                      aria-label="İlanı sil"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
