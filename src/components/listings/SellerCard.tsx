'use client';

import Image from 'next/image';

import { avatarUrl } from '@/lib/supabase/storage';
import { formatTrPhone, whatsappNumber } from '@/lib/phone';
import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, MessageCircle, Phone, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';
import type { SellerInfo } from '@/lib/queries/listings';

/**
 * Satıcı kartı: kimlik, iletişim düğmeleri ve üyelik istatistikleri.
 *
 * TELEFON SAYFAYLA GELMİYOR
 * "Telefonu Göster" düğmesi eskiden de vardı ama numara zaten sayfanın
 * içindeydi: WhatsApp bağlantısının adresinde ve bu bileşene geçirilen
 * özelliklerin HTML'e gömülen kopyasında. Yani düğme yalnızca gözden
 * saklıyordu; sayfayı indiren bir betik tıklamadan numarayı alıyordu.
 * Numara artık düğmeye basılınca sunucudan isteniyor.
 *
 * MESAJ ÖNCE
 * Birincil eylem mesajlaşma: numarasını vermeden iletişim kurabilmek hem
 * alıcı hem satıcı için daha güvenli ve yazışma sitede kalıyor.
 */
export function SellerCard({
  seller,
  listingId,
  hasPhone,
  showPhone,
  allowWhatsapp,
}: {
  seller: SellerInfo | null;
  listingId: number;
  /** Numaranın kendisi DEĞİL, yalnızca var olup olmadığı. */
  hasPhone: boolean;
  showPhone: boolean;
  allowWhatsapp: boolean;
}) {
  const { toast } = useToast();
  const [phone, setPhone] = useState<string | null>(null);
  const [aliniyor, setAliniyor] = useState(false);

  const displayName =
    seller?.company_title || seller?.full_name || seller?.username || 'PetSemti Üyesi';

  const memberSince = seller?.member_since ? new Date(seller.member_since) : null;
  const membershipYears = memberSince
    ? Math.max(0, Math.floor((Date.now() - memberSince.getTime()) / (365.25 * 24 * 3600 * 1000)))
    : 0;

  function track(rpc: 'increment_listing_phone' | 'increment_listing_whatsapp') {
    const supabase = getSupabaseBrowserClientOrNull();
    // .then() ŞART — bkz. ListingActions'taki açıklama: tembel thenable
    // await edilmezse istek gönderilmiyor.
    void supabase?.rpc(rpc, { p_listing_id: listingId }).then(() => {});
  }

  /** Numarayı sunucudan getirir; zaten getirilmişse döndürür. */
  async function numarayiGetir(): Promise<string | null> {
    if (phone) return phone;

    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return null;

    setAliniyor(true);
    const { data, error } = await supabase.rpc('get_listing_contact', {
      p_listing_id: listingId,
    });
    setAliniyor(false);

    if (error || !data) {
      toast({
        title: 'Telefon alınamadı',
        description: error?.message ?? 'Satıcı mesaj yoluyla iletişim tercih ediyor.',
        variant: error ? 'destructive' : 'default',
      });
      return null;
    }

    setPhone(data as string);
    track('increment_listing_phone');
    return data as string;
  }

  async function revealPhone() {
    // İlk basış numarayı açar, ikincisi arar. Numarayı görür görmez
    // aramak isteyen kullanıcıyı ikinci bir adıma zorlamak yerine, ilk
    // basışta zaten numara görünüyor.
    if (!phone) {
      await numarayiGetir();
      return;
    }
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  async function whatsappAc() {
    const numara = await numarayiGetir();
    const wa = whatsappNumber(numara);
    if (!wa) {
      toast({ title: 'WhatsApp numarası yok' });
      return;
    }
    track('increment_listing_whatsapp');
    window.open(`https://wa.me/${wa}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <aside className="space-y-3">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
            {avatarUrl(seller?.avatar_url) ? (
              <Image src={avatarUrl(seller?.avatar_url)!} alt={displayName} fill sizes="44px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {displayName.slice(0, 1).toLocaleUpperCase('tr')}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-semibold text-primary">
              {displayName}
              {seller?.is_verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Onaylı üye" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {seller?.account_type === 'kurumsal' ? 'Kurumsal üye' : 'Bireysel üye'}
              {memberSince && ` · ${memberSince.getFullYear()} yılından beri`}
            </p>
          </div>
        </div>

        {/*
          Satıcı geçmişi.

          Alıcının ilk sorusu "bu kişi güvenilir mi". Emsal sitelerin hepsi
          üyelik tarihini ve ilan sayısını gösteriyor; ikisi de tek başına
          garanti değil ama yeni açılmış bir hesapla yıllardır ilan veren
          bir hesabı ayırt etmeye yarıyor. Veri zaten seller_stats'ta
          duruyordu, hiçbir yerde gösterilmiyordu.
        */}
        {seller && (
          <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-secondary/60 p-2.5 text-center">
            <div>
              <dt className="text-[11px] text-muted-foreground">Üyelik</dt>
              <dd className="text-sm font-semibold">
                {membershipYears > 0 ? `${membershipYears} yıl` : 'Yeni'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Toplam ilan</dt>
              <dd className="text-sm font-semibold">{seller.total_listings}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Yayında</dt>
              <dd className="text-sm font-semibold">{seller.active_listings}</dd>
            </div>
          </dl>
        )}

        {memberSince && (
          <p className="mt-2 text-xs text-muted-foreground">
            Üyelik tarihi:{' '}
            {memberSince.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        {seller?.username && (
          <Link
            href={`/satici/${seller.username}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Satıcının tüm ilanları ({seller.active_listings})
          </Link>
        )}

        <div className="mt-4 space-y-2">
          <Button className="w-full justify-center gap-2" asChild>
            <Link href={`/mesajlarim?ilan=${listingId}`}>
              <Mail className="h-4 w-4" />
              Mesaj Gönder
            </Link>
          </Button>

          {showPhone && hasPhone && (
            <button
              type="button"
              onClick={revealPhone}
              disabled={aliniyor}
              className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              {aliniyor ? 'Alınıyor…' : phone ? formatTrPhone(phone) : 'Telefonu Göster'}
            </button>
          )}

          {allowWhatsapp && hasPhone && (
            <button
              type="button"
              onClick={whatsappAc}
              disabled={aliniyor}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatBox value={seller?.active_listings ?? 0} label="Aktif İlan" highlight />
        <StatBox value={seller?.total_listings ?? 0} label="Toplam İlan" />
        <StatBox value={`${membershipYears} Yıl`} label="Üyelik Süresi" />
      </div>
    </aside>
  );
}

function StatBox({
  value,
  label,
  highlight,
}: {
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? 'rounded-lg bg-primary p-3 text-center text-primary-foreground'
          : 'rounded-lg border bg-white p-3 text-center'
      }
    >
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className={highlight ? 'text-[11px] opacity-90' : 'text-[11px] text-muted-foreground'}>
        {label}
      </p>
    </div>
  );
}
