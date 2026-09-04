'use client';

import { useEffect, useState } from 'react';
import { Facebook, Flag, Star, Send } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';
import { ReportDialog } from '@/components/listings/ReportDialog';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Başlık satırının sağındaki işlemler: favorileme, şikayet, paylaşım.
 *
 * Görüntülenme sayacı da burada artırılıyor — sunucuda saymak Next.js
 * önbelleğiyle çakışıyor ve aynı kullanıcının her yenilemesini saymıyordu.
 */
export function ListingActions({
  listingId,
  title,
}: {
  listingId: number;
  title: string;
}) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  // Görüntülenme sayacı. Oturum başına bir kez: aynı ilanı yenileyip sayacı
  // şişirmenin önüne geçiyor.
  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    const key = `ilan-goruntulendi-${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Gizli sekmede sessionStorage erişimi hata verebilir; sayaç kritik
      // değil, sessizce devam ediyoruz.
    }
    // .then() ŞART: Supabase istemcisinin sorgu oluşturucusu tembel bir
    // "thenable". await edilmez ya da .then() çağrılmazsa istek HİÇ
    // gönderilmiyor ve hata da vermiyor. Sayaçların hep sıfır kalmasının
    // sebebi buydu.
    void supabase.rpc('increment_listing_view', { p_listing_id: listingId }).then(() => {});
  }, [listingId]);

  // Kullanıcının bu ilanı favorilemiş olup olmadığı.
  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase || !user) {
      setIsFavorite(false);
      return;
    }
    supabase
      .from('favorites')
      .select('listing_id')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(Boolean(data)));
  }, [user, listingId]);

  async function toggleFavorite() {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    if (!user) {
      toast({
        title: 'Giriş yapmalısınız',
        description: 'İlanları favorilerinize eklemek için giriş yapın.',
      });
      return;
    }

    setBusy(true);
    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', user.id);
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ listing_id: listingId, user_id: user.id });
      if (!error) setIsFavorite(true);
    }
    setBusy(false);
  }

  const encoded = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={busy}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-colors',
          isFavorite ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )}
      >
        <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        {isFavorite ? 'Favorilerimde' : 'Favorilere Ekle'}
      </button>

      <ReportDialog listingId={listingId} />

      <div className="flex items-center gap-1.5">
        <ShareButton
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          label="Facebook'ta paylaş"
          className="bg-[#1877f2]"
        >
          <Facebook className="h-3.5 w-3.5" />
        </ShareButton>

        <ShareButton
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
          label="X'te paylaş"
          className="bg-black"
        >
          <span className="text-[11px] font-bold leading-none">X</span>
        </ShareButton>

        <ShareButton
          href={`https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedTitle}`}
          label="Pinterest'te paylaş"
          className="bg-[#e60023]"
        >
          <span className="text-[11px] font-bold leading-none">P</span>
        </ShareButton>

        <ShareButton
          href={`https://wa.me/?text=${encodedTitle}%20${encoded}`}
          label="WhatsApp'ta paylaş"
          className="bg-[#25d366]"
        >
          <Send className="h-3.5 w-3.5" />
        </ShareButton>
      </div>
    </div>
  );
}

function ShareButton({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-white transition-opacity hover:opacity-85',
        className
      )}
    >
      {children}
    </a>
  );
}
