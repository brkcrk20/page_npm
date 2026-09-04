'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Eye,
  Heart,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Rocket,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { listingPhotoUrl } from '@/lib/supabase/storage';
import type { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * İlanlarım.
 *
 * Eskiden ilanlar profil sayfasında tek bir düz liste hâlindeydi ve tek
 * yapılabilen şey silmekti. Oysa ilan sahibinin asıl ihtiyacı silmek değil:
 * satıldığında yayından kaldırmak, sonra tekrar yayına almak, süresi dolanı
 * yenilemek. Silmek geri alınamayan tek işlemdi ve tek seçenek oydu.
 *
 * Durum geçişleri veritabanındaki muhafız trigger'ında tanımlı
 * (bkz. listings_guard). Buradaki menü yalnızca izin verilen geçişleri
 * gösteriyor — izin verilmeyeni denemek sessizce eski duruma dönmekle
 * sonuçlanır ve kullanıcı neden bir şey olmadığını anlayamazdı.
 */

type ListingStatus = Database['public']['Enums']['listing_status'];

type MyListing = {
  id: number;
  slug: string;
  title: string;
  status: ListingStatus;
  kind: string;
  price: number | null;
  created_at: string;
  expires_at: string | null;
  view_count: number;
  favorite_count: number;
  listing_photos: { storage_path: string; position: number }[];
};

const STATUS: Record<
  string,
  { label: string; className: string }
> = {
  taslak:        { label: 'Taslak',        className: 'bg-slate-100 text-slate-700' },
  onay_bekliyor: { label: 'Onay Bekliyor', className: 'bg-amber-100 text-amber-800' },
  yayinda:       { label: 'Yayında',       className: 'bg-emerald-100 text-emerald-800' },
  reddedildi:    { label: 'Reddedildi',    className: 'bg-red-100 text-red-700' },
  pasif:         { label: 'Yayında Değil', className: 'bg-slate-100 text-slate-700' },
  suresi_doldu:  { label: 'Süresi Doldu',  className: 'bg-orange-100 text-orange-800' },
  satildi:       { label: 'Sonuçlandı',    className: 'bg-blue-100 text-blue-800' },
};

/** Muhafız trigger'ındaki geçiş tablosunun arayüz karşılığı. */
/**
 * Durum geçişleri.
 *
 * "Satıldı" etiketi ücretsiz sahiplendirme ilanında yanlış: hayvan
 * satılmıyor, sahiplendiriliyor. Etiket ilan türüne göre değişiyor;
 * veritabanındaki durum aynı kalıyor.
 */
const TRANSITIONS: Record<string, { to: ListingStatus; label: string; icon: any }[]> = {
  yayinda:      [{ to: 'pasif',   label: 'Yayından Kaldır', icon: Pause },
                 { to: 'satildi', label: 'SONUCLANDI', icon: Tag }],
  pasif:        [{ to: 'yayinda', label: 'Yeniden Yayınla', icon: Play },
                 { to: 'satildi', label: 'SONUCLANDI', icon: Tag }],
  satildi:      [{ to: 'yayinda', label: 'Yeniden Yayınla', icon: Play }],
  suresi_doldu: [{ to: 'yayinda', label: 'Yeniden Yayınla', icon: Play }],
  taslak:       [{ to: 'yayinda', label: 'Yayınla', icon: Play }],
};

const TABS = [
  { key: 'hepsi',         label: 'Tümü' },
  { key: 'yayinda',       label: 'Yayında' },
  { key: 'onay_bekliyor', label: 'Onay Bekleyen' },
  { key: 'pasif',         label: 'Yayında Değil' },
  { key: 'satildi',       label: 'Satıldı' },
  { key: 'suresi_doldu',  label: 'Süresi Dolmuş' },
] as const;

export default function MyListingsPage() {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [listings, setListings] = useState<MyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<string>('hepsi');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<MyListing | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getSupabaseBrowserClient()
      .from('listings')
      .select(
        'id, slug, title, status, kind, price, created_at, expires_at, view_count, favorite_count, listing_photos(storage_path, position)'
      )
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

  const counts = useMemo(() => {
    const map: Record<string, number> = { hepsi: listings.length };
    for (const l of listings) map[l.status] = (map[l.status] ?? 0) + 1;
    return map;
  }, [listings]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return listings.filter((l) => {
      if (tab !== 'hepsi' && l.status !== tab) return false;
      if (!q) return true;
      return (
        l.title.toLocaleLowerCase('tr-TR').includes(q) || String(l.id).includes(q)
      );
    });
  }, [listings, tab, query]);

  async function changeStatus(listing: MyListing, to: ListingStatus) {
    setBusyId(listing.id);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('listings')
      .update({ status: to })
      .eq('id', listing.id)
      .select('status')
      .single();

    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: error.message });
      return;
    }

    // Muhafız izin vermeyen bir geçişi sessizce eski değere döndürüyor.
    // Dönen satıra bakmadan "başarılı" demek, olmayan bir değişikliği
    // bildirmek olurdu.
    const applied = (data as { status: ListingStatus }).status;
    if (applied !== to) {
      toast({
        variant: 'destructive',
        title: 'Bu değişiklik yapılamıyor',
        description: `İlan "${STATUS[applied]?.label ?? applied}" durumundan çıkarılamadı.`,
      });
      return;
    }

    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: applied } : l))
    );
    toast({ title: 'İlan güncellendi', description: STATUS[applied]?.label ?? applied });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const { error } = await getSupabaseBrowserClient()
      .from('listings')
      .delete()
      .eq('id', target.id);

    if (error) {
      toast({ variant: 'destructive', title: 'İlan silinemedi', description: error.message });
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== target.id));
    toast({ title: 'İlan silindi' });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">İlanlarım</h1>
        <Button asChild>
          <Link href="/ilan-ver">
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni İlan
          </Link>
        </Button>
      </div>

      {/* Durum sekmeleri: sayılar sekmenin üstünde, böylece onay bekleyen bir
          ilanın varlığı sekmeye tıklamadan görülüyor. */}
      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/70'
            )}
          >
            {t.label}
            <span className={cn('ml-1.5 text-xs', tab === t.key ? 'opacity-80' : 'text-muted-foreground')}>
              {counts[t.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {listings.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İlan başlığı veya ilan numarası ara..."
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <p className="text-muted-foreground">
            {listings.length === 0
              ? 'Henüz ilanınız yok.'
              : 'Bu filtreye uyan ilan bulunamadı.'}
          </p>
          {listings.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/ilan-ver">İlk İlanını Ver</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((listing) => {
            const cover = [...(listing.listing_photos ?? [])].sort(
              (a, b) => a.position - b.position
            )[0];
            const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;
            const status = STATUS[listing.status] ?? { label: listing.status, className: 'bg-slate-100 text-slate-700' };
            const moves = TRANSITIONS[listing.status] ?? [];

            return (
              <li
                key={listing.id}
                className={cn(
                  'flex gap-3 rounded-xl border bg-white p-3 transition-opacity sm:gap-4',
                  busyId === listing.id && 'opacity-50'
                )}
              >
                <Link
                  href={`/${listing.slug}-${listing.id}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-28"
                >
                  {imageUrl ? (
                    <Image src={imageUrl} alt={listing.title} fill sizes="112px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      Foto yok
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/${listing.slug}-${listing.id}`}
                      className="line-clamp-2 font-semibold leading-snug hover:text-primary"
                    >
                      {listing.title}
                    </Link>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  {listing.price != null && (
                    <p className="mt-0.5 font-bold text-primary">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        maximumFractionDigits: 0,
                      }).format(listing.price)}
                    </p>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>İlan no: {listing.id}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {listing.view_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {listing.favorite_count}
                    </span>
                    {listing.status === 'yayinda' && listing.expires_at && (
                      <span>
                        Bitiş: {new Date(listing.expires_at).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {listing.status === 'yayinda' && (
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <Link href={`/doping?ilan=${listing.id}`}>
                          <Rocket className="mr-1.5 h-3.5 w-3.5" />
                          Öne Çıkar
                        </Link>
                      </Button>
                    )}

                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/ilan-duzenle/${listing.id}`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Düzenle
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                          <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
                          İşlemler
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                          <Link href={`/${listing.slug}-${listing.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            İlanı Görüntüle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/ilan-duzenle/${listing.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>

                        {moves.map((move) => {
                          const Icon = move.icon;
                          const etiket =
                            move.label === 'SONUCLANDI'
                              ? listing.kind === 'sahiplendirme'
                                ? 'Sahiplendirildi Olarak İşaretle'
                                : 'Satıldı Olarak İşaretle'
                              : move.label;
                          return (
                            <DropdownMenuItem
                              key={move.to}
                              onSelect={() => changeStatus(listing, move.to)}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {etiket}
                            </DropdownMenuItem>
                          );
                        })}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setPendingDelete(listing)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          İlanı Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {listing.status === 'reddedildi' && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Bu ilan yayın kurallarına uymadığı için reddedildi. Düzenleyip tekrar
                      gönderebilirsiniz.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Silme geri alınamıyor; onay penceresi olmadan tek tıkla ilan
          kaybediliyordu. */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlan silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” kalıcı olarak silinecek. Fotoğrafları, mesajları ve
              istatistikleri de gider. Bu işlem geri alınamaz.
              <br />
              <br />
              İlanı yalnızca gizlemek istiyorsanız “Yayından Kaldır” seçeneğini kullanın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
