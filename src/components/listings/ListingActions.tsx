'use client';

import { useEffect, useState } from 'react';
import { Facebook, Flag, Instagram, Star, Send } from 'lucide-react';

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

  /**
   * Instagram paylaşımı.
   *
   * Instagram'ın diğerleri gibi bir paylaşım adresi YOK: dışarıdan bir
   * bağlantıyla gönderi ya da hikâye açtırmanın desteklenen bir yolu
   * bulunmuyor. Bu yüzden düğme iki yoldan biriyle çalışıyor:
   *
   *  - Telefonda: işletim sisteminin paylaş sayfası açılıyor ve Instagram
   *    orada bir seçenek olarak çıkıyor (Web Share API). Kullanıcı
   *    Instagram'ı seçtiğinde bağlantı hikâyesine/DM'ine gidiyor.
   *  - Masaüstünde: paylaş sayfası olmadığı için bağlantı panoya
   *    kopyalanıyor ve ne yapılacağı söyleniyor.
   *
   * Çalışmayan bir "Instagram'da paylaş" bağlantısı koymak, kullanıcıyı
   * boş bir Instagram sayfasına göndermek olurdu.
   */
  async function instagramPaylas() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // Kullanıcı vazgeçti ya da paylaşım engellendi; panoya düşüyoruz.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Bağlantı kopyalandı',
        description:
          'Instagram dışarıdan bağlantıyla paylaşıma izin vermiyor. Bağlantıyı hikâyenize, gönderinize ya da mesajınıza yapıştırabilirsiniz.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Kopyalanamadı',
        description: 'Adres çubuğundaki bağlantıyı elle kopyalayabilirsiniz.',
      });
    }
  }

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

        {/* Instagram bağlantıyla paylaşımı desteklemediği için düğme,
            bağlantı değil. Davranışı instagramPaylas() anlatıyor. */}
        <button
          type="button"
          onClick={instagramPaylas}
          aria-label="Instagram'da paylaş"
          title="Instagram'da paylaş"
          className="flex h-7 w-7 items-center justify-center rounded text-white transition-opacity hover:opacity-85"
          style={{
            background:
              'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
        >
          <Instagram className="h-3.5 w-3.5" />
        </button>
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
