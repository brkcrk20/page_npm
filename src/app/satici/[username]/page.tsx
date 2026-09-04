import { notFound } from 'next/navigation';
import Image from 'next/image';

import { avatarUrl } from '@/lib/supabase/storage';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BadgeCheck, Calendar, Star, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { getSellerByUsername, getSellerListings } from '@/lib/queries/listings';
import { getProviderForOwner } from '@/lib/queries/services';
import { getServiceConfig } from '@/lib/services-config';
import type { ServiceType } from '@/lib/queries/services';

/**
 * Satıcı profili.
 *
 * İlan detayındaki "Tüm İlanlar" bağlantısı buraya geliyordu ama sayfa yoktu.
 * Kullanıcı adı üzerinden çalışıyor; profil kimliği (uuid) adreste görünmüyor.
 */

type Params = { username: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  const seller = await getSellerByUsername(username);
  if (!seller) return { title: 'Satıcı Bulunamadı' };

  const name = seller.company_title || seller.full_name || `@${seller.username}`;
  return {
    title: `${name} — Tüm İlanları`,
    description: `${name} kullanıcısının PetSemti'deki güncel ilanları.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function SellerPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);
  if (!seller) notFound();

  const [{ listings, total }, business] = await Promise.all([
    getSellerListings(seller.id),
    getProviderForOwner(seller.id),
  ]);
  // İşletme kaydı olan üyenin (petshop, klinik…) vitrini ilanlarından ayrı
  // duruyordu; ziyaretçi ikisinin aynı işletme olduğunu göremiyordu.
  const businessConfig = business ? getServiceConfig(business.service_type as ServiceType) : null;
  const displayName = seller.company_title || seller.full_name || `@${seller.username}`;
  const memberSince = seller.member_since ? new Date(seller.member_since) : null;

  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        <header className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border bg-white p-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {avatarUrl(seller.avatar_url) ? (
              <Image src={avatarUrl(seller.avatar_url)!} alt={displayName} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-semibold text-muted-foreground">
                {displayName.slice(0, 1).toLocaleUpperCase('tr')}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-xl font-bold">
              {displayName}
              {seller.is_verified && (
                <BadgeCheck className="h-5 w-5 text-emerald-600" aria-label="Güvenli üye" />
              )}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {seller.username && <span>@{seller.username}</span>}
              {memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {memberSince.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  {' tarihinden beri üye'}
                </span>
              )}
              {seller.account_type === 'kurumsal' && <Badge variant="secondary">Kurumsal Üye</Badge>}
            </div>
          </div>

          <div className="flex gap-2 text-center">
            <div className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              <p className="text-xl font-bold leading-tight">{seller.active_listings}</p>
              <p className="text-[11px] opacity-90">Aktif İlan</p>
            </div>
            <div className="rounded-lg border px-4 py-2">
              <p className="text-xl font-bold leading-tight">{seller.total_listings}</p>
              <p className="text-[11px] text-muted-foreground">Toplam İlan</p>
            </div>
          </div>
        </header>

        {business && businessConfig && (
          <Link
            href={`/${businessConfig.slug}/${business.slug}-${business.id}`}
            className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-primary"
          >
            <Store className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 p-2 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{businessConfig.label}</p>
              <p className="flex items-center gap-1.5 font-semibold">
                {business.name}
                {business.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
              </p>
            </div>
            {business.rating_count > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {Number(business.rating_average).toFixed(1)}
                <span className="text-muted-foreground">({business.rating_count})</span>
              </span>
            )}
            <span className="text-sm font-medium text-primary">İşletme sayfası →</span>
          </Link>
        )}

        <h2 className="mb-4 text-lg font-bold">
          Yayındaki İlanlar <span className="font-normal text-muted-foreground">({total})</span>
        </h2>

        <ListingGrid
          listings={listings}
          emptyMessage={`${displayName} kullanıcısının şu an yayında ilanı yok.`}
        />

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Tüm ilanlara dön
          </Link>
        </p>
      </div>
    </div>
  );
}
