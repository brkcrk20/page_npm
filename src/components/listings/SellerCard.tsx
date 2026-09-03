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
 * Telefon numarası baştan gösterilmiyor; kullanıcı düğmeye bastığında
 * açılıyor. Böylece hem numara toplayan botlara karşı bir engel oluyor hem de
 * "kaç kişi aradı" sayacı gerçek niyeti ölçüyor.
 */
export function SellerCard({
  seller,
  listingId,
  phone,
  showPhone,
  allowWhatsapp,
}: {
  seller: SellerInfo | null;
  listingId: number;
  phone: string | null;
  showPhone: boolean;
  allowWhatsapp: boolean;
}) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);

  const displayName =
    seller?.company_title || seller?.full_name || seller?.username || 'PetSemti Üyesi';

  const memberSince = seller?.member_since ? new Date(seller.member_since) : null;
  const membershipYears = memberSince
    ? Math.max(0, Math.floor((Date.now() - memberSince.getTime()) / (365.25 * 24 * 3600 * 1000)))
    : 0;

  function track(rpc: 'increment_listing_phone' | 'increment_listing_whatsapp') {
    const supabase = getSupabaseBrowserClientOrNull();
    supabase?.rpc(rpc, { p_listing_id: listingId });
  }

  function revealPhone() {
    if (!phone) {
      toast({ title: 'Telefon paylaşılmamış', description: 'Satıcı mesaj yoluyla iletişim tercih ediyor.' });
      return;
    }
    if (!revealed) {
      setRevealed(true);
      track('increment_listing_phone');
      return;
    }
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  const waNumber = whatsappNumber(phone);
  const whatsappHref = waNumber
    ? `https://wa.me/${waNumber}`
    : null;

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
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Güvenli üye" />
              )}
            </p>
            {memberSince && (
              <p className="text-xs text-muted-foreground">
                Üyelik tarihi:{' '}
                {memberSince.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {seller?.username && (
          <Link
            href={`/satici/${seller.username}`}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Tüm İlanlar
          </Link>
        )}

        <div className="mt-4 space-y-2">
          {showPhone && (
            <button
              type="button"
              onClick={revealPhone}
              className="flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              {revealed && phone ? formatTrPhone(phone) : 'Telefonu Göster'}
            </button>
          )}

          {allowWhatsapp && whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('increment_listing_whatsapp')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}

          <Button variant="outline" className="w-full justify-center gap-2" asChild>
            <Link href={`/mesajlarim?ilan=${listingId}`}>
              <Mail className="h-4 w-4" />
              Mesaj Gönder
            </Link>
          </Button>
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
