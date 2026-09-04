import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BadgeCheck,
  Building2,
  Calendar,
  MapPin,
  Package,
  Star,
} from 'lucide-react';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { avatarUrl } from '@/lib/supabase/storage';
import { getSellerByUsername, getSellerListings } from '@/lib/queries/listings';
import { getProviderForOwner } from '@/lib/queries/services';
import { getServiceConfig, type ServiceConfig } from '@/lib/services-config';
import { getCities } from '@/lib/queries/catalog';
import type { ServiceType } from '@/lib/queries/services';
import { cn } from '@/lib/utils';

/**
 * Satıcı profili.
 *
 * MOBİLDE BOZUKTU
 * Başlık tek satırda ad, üyelik bilgisi ve iki sayaç kutusunu yan yana
 * diziyordu; dar ekranda sayaçlar ismin üstüne biniyor, "… tarihinden beri
 * üye" üç satıra bölünüyordu. Düzen artık mobilde dikey: önce kimlik,
 * altında tam genişlikte sayaç şeridi.
 *
 * Ayrıca profil ilan sayısı dışında hiçbir şey söylemiyordu. Kullanıcının
 * "bu kişi kim, güvenilir mi" sorusuna yardımcı olan ne varsa (üyelik
 * süresi, şehir, hesap türü, hakkında metni, işletme kaydı) buraya geldi.
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
    alternates: { canonical: `/satici/${seller.username}` },
  };
}

export const dynamic = 'force-dynamic';

export default async function SellerPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);
  if (!seller) notFound();

  const [{ listings, total }, business, cities] = await Promise.all([
    getSellerListings(seller.id),
    getProviderForOwner(seller.id),
    getCities(),
  ]);

  const businessConfig: ServiceConfig | null = business
    ? getServiceConfig(business.service_type as ServiceType)
    : null;

  const displayName = seller.company_title || seller.full_name || `@${seller.username}`;
  const memberSince = seller.member_since ? new Date(seller.member_since) : null;
  const city = seller.city_id ? cities.find((c) => c.id === seller.city_id) : undefined;
  const avatar = avatarUrl(seller.avatar_url);

  // Üyelik süresi: "2 yıldır üye" ilk yıl anlamsız, o yüzden ay olarak da
  // hesaplanıyor.
  const uyelikAy = memberSince
    ? Math.max(0, Math.floor((Date.now() - memberSince.getTime()) / (30.44 * 24 * 3600 * 1000)))
    : 0;
  // Bu ay katılan üyede "0 ay" saçma duruyordu.
  const uyelikSuresi =
    uyelikAy >= 12
      ? `${Math.floor(uyelikAy / 12)} yıl`
      : uyelikAy >= 1
        ? `${uyelikAy} ay`
        : 'Yeni üye';

  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 sm:py-6">
        <nav aria-label="Kırıntı navigasyonu" className="mb-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">Ana Sayfa</Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">{displayName}</span>
        </nav>

        <header className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-20 sm:w-20">
              {avatar ? (
                <Image src={avatar} alt={displayName} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                  {displayName.slice(0, 1).toLocaleUpperCase('tr')}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold leading-tight sm:text-2xl">
                <span className="break-words">{displayName}</span>
                {seller.is_verified && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Doğrulanmış üye" />
                )}
              </h1>

              {seller.username && (
                <p className="mt-0.5 text-sm text-muted-foreground">@{seller.username}</p>
              )}

              {/* Rozetler alt alta değil, sarmalanan tek satır: dar ekranda
                  her biri ayrı satıra düşünce kart uzayıp gidiyordu. */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Rozet
                  icon={seller.account_type === 'kurumsal' ? Building2 : undefined}
                  metin={seller.account_type === 'kurumsal' ? 'Kurumsal üye' : 'Bireysel üye'}
                />
                {seller.is_verified && <Rozet icon={BadgeCheck} metin="Doğrulanmış" vurgulu />}
                {memberSince && (
                  <Rozet
                    icon={Calendar}
                    metin={`${memberSince.toLocaleDateString('tr-TR', {
                      month: 'long',
                      year: 'numeric',
                    })} tarihinden beri üye`}
                  />
                )}
                {city && <Rozet icon={MapPin} metin={city.name} />}
              </div>

              {seller.bio && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {seller.bio}
                </p>
              )}
            </div>
          </div>

          {/* Sayaçlar kendi şeridinde ve tam genişlikte; başlıkla aynı satırda
              olunca dar ekranda ismin üstüne biniyordu. */}
          <dl className="grid grid-cols-3 divide-x border-t bg-secondary/40 text-center">
            <Sayac deger={seller.active_listings} etiket="Aktif İlan" vurgulu />
            <Sayac deger={seller.total_listings} etiket="Toplam İlan" />
            <Sayac deger={uyelikSuresi} etiket="Üyelik" />
          </dl>
        </header>

        {business && businessConfig && (
          <Link
            href={`/${businessConfig.slug}/${business.slug}-${business.id}`}
            className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary"
          >
            <Building2 className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 p-2 text-primary" />
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

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">
            Yayındaki İlanlar{' '}
            <span className="font-normal text-muted-foreground">({total})</span>
          </h2>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card py-14 text-center">
              <Package className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 font-medium">Yayında ilan yok</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {displayName} şu an ilan yayınlamıyor.
              </p>
            </div>
          ) : (
            <ListingGrid listings={listings} />
          )}
        </section>

        {/* Buradan doğrudan mesaj gönderilemiyor: konuşma bir ilana bağlı
            açılıyor, ilansız bir sohbetin karşılığı yok. Kullanıcı yukarıdaki
            ilanlardan birine girip oradan yazıyor. */}
        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Tüm ilanlara dön
          </Link>
        </p>
      </div>
    </div>
  );
}

function Rozet({
  icon: Icon,
  metin,
  vurgulu,
}: {
  icon?: React.ElementType;
  metin: string;
  vurgulu?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
        vurgulu ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-secondary/60'
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {metin}
    </span>
  );
}

function Sayac({
  deger,
  etiket,
  vurgulu,
}: {
  deger: number | string;
  etiket: string;
  vurgulu?: boolean;
}) {
  return (
    <div className="px-2 py-3">
      <dd className={cn('text-xl font-bold leading-none', vurgulu && 'text-primary')}>{deger}</dd>
      <dt className="mt-1 text-[11px] text-muted-foreground">{etiket}</dt>
    </div>
  );
}
