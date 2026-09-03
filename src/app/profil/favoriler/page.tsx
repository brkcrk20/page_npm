'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Star, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { listingPhotoUrl } from '@/lib/supabase/storage';

/**
 * Favori ilanlarım.
 *
 * İlan detayındaki yıldız düğmesi favorites tablosuna yazıyordu ama bu sayfa
 * boştu — kullanıcı favorilediği ilanları hiçbir yerde göremiyordu.
 */

type FavoriteRow = {
  listing_id: number;
  created_at: string;
  listings: {
    id: number;
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    kind: string;
    status: string;
    cities: { name: string } | null;
    districts: { name: string } | null;
    listing_photos: { storage_path: string; position: number }[];
  } | null;
};

function formatPrice(listing: NonNullable<FavoriteRow['listings']>): string {
  if (listing.kind === 'sahiplendirme') return 'Ücretsiz Sahiplendirme';
  if (listing.price === null || Number(listing.price) === 0) return 'Fiyat Belirtilmemiş';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(listing.price));
}

export default function FavoritesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useSupabaseAuth();

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    supabase
      .from('favorites')
      .select(
        `listing_id, created_at,
         listings ( id, slug, title, price, currency, kind, status,
                    cities ( name ), districts ( name ),
                    listing_photos ( storage_path, position ) )`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Favoriler yüklenemedi', description: error.message });
        }
        setFavorites((data as unknown as FavoriteRow[]) ?? []);
        setIsLoading(false);
      });
  }, [user, toast]);

  async function remove(listingId: number) {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaldırılamadı', description: error.message });
      return;
    }
    setFavorites((prev) => prev.filter((f) => f.listing_id !== listingId));
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // İlanı silinmiş veya yayından kalkmış favoriler listede yer kaplamasın.
  const visible = favorites.filter((f) => f.listings && f.listings.status === 'yayinda');
  const unavailable = favorites.length - visible.length;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <Star className="h-6 w-6 fill-primary text-primary" />
        Favorilerim
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {visible.length} ilan
        {unavailable > 0 && ` · ${unavailable} ilan artık yayında değil`}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <p className="text-muted-foreground">Henüz favori ilanınız yok.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Beğendiğiniz ilanlarda yıldıza basarak buraya ekleyebilirsiniz.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">İlanlara Göz At</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map(({ listing_id, listings: listing }) => {
            if (!listing) return null;
            const cover = [...(listing.listing_photos ?? [])].sort(
              (a, b) => a.position - b.position
            )[0];
            const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;
            const location = [listing.cities?.name, listing.districts?.name]
              .filter(Boolean)
              .join(' / ');

            return (
              <li key={listing_id} className="flex gap-4 rounded-xl border bg-white p-3">
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
                  {location && <p className="text-xs text-muted-foreground">{location}</p>}
                  <p className="mt-1 text-sm font-bold text-primary">{formatPrice(listing)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(listing_id)}
                  aria-label="Favorilerden kaldır"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
