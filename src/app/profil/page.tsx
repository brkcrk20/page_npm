'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CreditCard,
  Eye,
  Heart,
  List,
  Loader2,
  MessageSquare,
  Plus,
  Rocket,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { listingPhotoUrl } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

/**
 * Panelin açılış ekranı.
 *
 * Kullanıcı panele girdiğinde ilk sorduğu şey "ilanım ne durumda" oluyor.
 * Eskiden buraya girildiğinde profil düzenleme formu karşılıyordu — halbuki
 * ad soyad yılda bir kez değişiyor, ilan istatistikleri her gün bakılıyor.
 * Form ayrı bir sayfaya (hesap bilgilerim) taşındı.
 */

type Overview = {
  total: number;
  published: number;
  pending: number;
  views: number;
  favorites: number;
  unread: number;
  credits: number;
};

type RecentListing = {
  id: number;
  slug: string;
  title: string;
  status: string;
  view_count: number;
  listing_photos: { storage_path: string; position: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  taslak: 'Taslak',
  onay_bekliyor: 'Onay Bekliyor',
  yayinda: 'Yayında',
  reddedildi: 'Reddedildi',
  pasif: 'Yayında Değil',
  suresi_doldu: 'Süresi Doldu',
  satildi: 'Satıldı',
};

export default function ProfileOverviewPage() {
  const { toast } = useToast();
  const { user, profile } = useSupabaseAuth();

  const [data, setData] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<RecentListing[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    (async () => {
      const [listingRows, favCount, unread, credits] = await Promise.all([
        supabase
          .from('listings')
          .select('id, slug, title, status, view_count, favorite_count, listing_photos(storage_path, position)')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.rpc('unread_message_count'),
        supabase.from('listing_credits').select('delta').eq('user_id', user.id),
      ]);

      if (listingRows.error) {
        toast({
          variant: 'destructive',
          title: 'Özet yüklenemedi',
          description: listingRows.error.message,
        });
      }

      const rows = (listingRows.data as (RecentListing & { favorite_count: number })[]) ?? [];

      setData({
        total: rows.length,
        published: rows.filter((r) => r.status === 'yayinda').length,
        pending: rows.filter((r) => r.status === 'onay_bekliyor').length,
        views: rows.reduce((sum, r) => sum + (r.view_count ?? 0), 0),
        favorites: favCount.count ?? 0,
        unread: Number(unread.data ?? 0),
        // Satın alınan haklar pozitif, kullanılanlar negatif kayıt olarak
        // tutuluyor; kalan hak toplamları.
        credits: ((credits.data as { delta: number }[]) ?? []).reduce((s, c) => s + c.delta, 0),
      });
      setRecent(rows.slice(0, 4));
    })();
  }, [user, toast]);

  const firstName = (profile?.full_name ?? profile?.username ?? '').split(' ')[0];

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Merhaba ${firstName}` : 'Hesabım'}
          </h1>
          <p className="text-sm text-muted-foreground">
            İlanlarınızın durumunu buradan takip edebilirsiniz.
          </p>
        </div>
        <Button asChild>
          <Link href="/ilan-ver">
            <Plus className="mr-1.5 h-4 w-4" />
            Ücretsiz İlan Ver
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={List} label="Toplam İlan" value={data.total} href="/profil/ilanlarim" />
        <Stat icon={Eye} label="Görüntülenme" value={data.views} />
        <Stat icon={Heart} label="Favorilerim" value={data.favorites} href="/profil/favoriler" />
        <Stat
          icon={MessageSquare}
          label="Okunmamış Mesaj"
          value={data.unread}
          href="/mesajlarim"
          highlight={data.unread > 0}
        />
      </div>

      {/* Bekleyen iş varsa panelin en görünür yerinde duruyor; kullanıcı
          "ilanım neden yayında değil" diye aramasın. */}
      {data.pending > 0 && (
        <Link
          href="/profil/ilanlarim"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm hover:bg-amber-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 font-bold text-amber-900">
            {data.pending}
          </span>
          <span className="flex-1 text-amber-900">
            <strong>{data.pending} ilanınız onay bekliyor.</strong> Kontrolden geçtikten sonra
            otomatik olarak yayına alınacak.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-700" />
        </Link>
      )}

      {data.credits > 0 && (
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm">
          <CreditCard className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex-1">
            <strong>{data.credits} ilan hakkınız</strong> kullanılmayı bekliyor.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/ilan-ver">Kullan</Link>
          </Button>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Son İlanlarım</h2>
          {data.total > 0 && (
            <Link
              href="/profil/ilanlarim"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Tümünü Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white py-14 text-center">
            <p className="text-muted-foreground">Henüz ilanınız yok.</p>
            <Button asChild className="mt-4">
              <Link href="/ilan-ver">İlk İlanını Ver</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {recent.map((listing) => {
              const cover = [...(listing.listing_photos ?? [])].sort(
                (a, b) => a.position - b.position
              )[0];
              const imageUrl = cover ? listingPhotoUrl(cover.storage_path) : null;

              return (
                <li key={listing.id}>
                  <Link
                    href={`/${listing.slug}-${listing.id}`}
                    className="flex gap-3 rounded-xl border bg-white p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={listing.title} fill sizes="64px" className="object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                          Foto yok
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {STATUS_LABEL[listing.status] ?? listing.status} · {listing.view_count} görüntülenme
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {data.published > 0 && (
        <Link
          href="/doping"
          className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-primary/10 to-transparent p-4 hover:from-primary/15"
        >
          <Rocket className="h-6 w-6 shrink-0 text-primary" />
          <span className="flex-1 text-sm">
            <strong className="block">İlanını öne çıkar</strong>
            <span className="text-muted-foreground">
              Vitrinde ve üst sıralarda görünen ilanlar belirgin şekilde daha çok tıklanıyor.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: any;
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <div
      className={cn(
        'h-full rounded-xl border bg-white p-4 transition-colors',
        href && 'hover:border-primary/40',
        highlight && 'border-primary/40 bg-primary/5'
      )}
    >
      <Icon className={cn('h-5 w-5', highlight ? 'text-primary' : 'text-muted-foreground')} />
      <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
