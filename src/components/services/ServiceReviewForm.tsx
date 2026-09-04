'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * İşletme değerlendirmesi.
 *
 * service_reviews tablosu, puan ortalamasını güncelleyen tetikleyicisi ve
 * RLS kuralları ilk günden beri hazırdı ama yazma arayüzü hiç yoktu:
 * yorumlar yalnızca okunuyordu. Rehber sıralaması puana göre yapıldığı için
 * bu, sıralamanın sonsuza kadar boş kalması demekti.
 *
 * Tabloda (provider_id, user_id) tekil; aynı kişi ikinci kez yazmak yerine
 * yazdığını düzenliyor. Form da mevcut değerlendirmeyi yükleyip üstüne
 * yazıyor — "zaten değerlendirdiniz" hatası vermek yerine.
 *
 * Kendi işletmesine puan vermeyi veritabanındaki muhafız reddediyor; burada
 * formu göstermiyoruz ki kullanıcı boşuna yazmasın.
 */

export function ServiceReviewForm({
  providerId,
  ownerId,
}: {
  providerId: number;
  ownerId: string | null;
}) {
  const { user, isUserLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let iptal = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('service_reviews')
        .select('rating, comment')
        .eq('provider_id', providerId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (iptal || !data) return;
      setRating(data.rating);
      setComment(data.comment ?? '');
      setExisting(true);
    })();
    return () => {
      iptal = true;
    };
  }, [user, providerId]);

  if (isUserLoading) return null;
  if (user && ownerId === user.id) return null;

  if (!user) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Bu işletmeyi değerlendirmek için{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          giriş yapın
        </Link>
        .
      </p>
    );
  }

  async function gonder() {
    if (rating < 1) {
      toast({ title: 'Puan verin', description: 'En az bir yıldız seçmelisiniz.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('service_reviews').upsert(
      {
        provider_id: providerId,
        user_id: user!.id,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: 'provider_id,user_id' }
    );
    setSaving(false);

    if (error) {
      toast({ title: 'Değerlendirme kaydedilemedi', description: error.message, variant: 'destructive' });
      return;
    }

    setExisting(true);
    toast({
      title: existing ? 'Değerlendirmeniz güncellendi' : 'Değerlendirmeniz yayınlandı',
      description: 'Katkınız için teşekkürler.',
    });
    // Puan ortalaması tetikleyiciyle sunucuda değişiyor; sayfayı tazelemeden
    // kullanıcı kendi yorumunun listeye düştüğünü göremez.
    router.refresh();
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">
        {existing ? 'Değerlendirmenizi güncelleyin' : 'Bu işletmeyi değerlendirin'}
      </p>

      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} yıldız`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                'h-6 w-6 transition',
                n <= (hover || rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40'
              )}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Deneyiminizi yazın: ilgi, temizlik, fiyat, randevu kolaylığı…"
        className="mt-3"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Yorumunuz adınızla yayınlanır. Yalnızca kendi deneyiminizi yazın.
        </p>
        <Button onClick={gonder} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Güncelle' : 'Gönder'}
        </Button>
      </div>
    </div>
  );
}
