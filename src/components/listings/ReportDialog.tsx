'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * İlan şikayeti.
 *
 * Bu düğme daha önce SAHTEYDİ: "Şikayetiniz alındı" yazan bir bildirim
 * gösteriyor, hiçbir yere kaydetmiyordu. Kullanıcı kötü niyetli bir ilanı
 * bildiriyor, kimse görmüyordu. Düğmenin hiç olmamasından kötü bir durum —
 * kullanıcı bildirdiğini sanıp konuyu kapatıyor.
 *
 * Şikayet artık listing_reports tablosuna yazılıyor ve yönetim panelinde
 * görünüyor. Sebep seçilmesi zorunlu: "kötü ilan" diye gelen bir bildirim
 * incelemeye yardımcı olmuyor.
 */

const REASONS = [
  { value: 'dolandiricilik', label: 'Dolandırıcılık şüphesi', hint: 'Kapora veya ön ödeme istiyor' },
  { value: 'yaniltici', label: 'Yanıltıcı bilgi veya fotoğraf', hint: 'Fotoğraf ilana ait değil, bilgiler yanlış' },
  { value: 'yasakli_tur', label: 'Yasaklı ırk veya yabani hayvan', hint: 'Satışı kanunen yasak bir hayvan' },
  { value: 'kotu_muamele', label: 'Hayvana kötü muamele', hint: 'İçerik kötü muamele içeriyor' },
  { value: 'yanlis_kategori', label: 'Yanlış kategori' },
  { value: 'tekrar_ilan', label: 'Aynı ilan tekrar açılmış' },
  { value: 'diger', label: 'Diğer' },
];

export function ReportDialog({ listingId }: { listingId: number }) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function submit() {
    if (!reason) {
      toast({ variant: 'destructive', title: 'Sebep seçin', description: 'İncelemenin başlaması için sebep gerekiyor.' });
      return;
    }

    setIsSending(true);
    const { error } = await getSupabaseBrowserClient().rpc('report_listing', {
      p_listing_id: listingId,
      p_reason: reason,
      p_note: note.trim() || undefined,
    });
    setIsSending(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Şikayet gönderilemedi', description: error.message });
      return;
    }

    setOpen(false);
    setReason('');
    setNote('');
    toast({
      title: 'Şikayetiniz kaydedildi',
      description: 'İlan en kısa sürede incelenecek. Bildiriminiz için teşekkürler.',
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <Flag className="h-4 w-4" />
          Şikayet Et
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>İlanı Şikayet Et</DialogTitle>
          <DialogDescription>
            Kurallara aykırı bulduğunuz ilanı bildirin. Bildiriminiz ilan sahibine
            gösterilmez.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          /* Giriş şartı kötüye kullanımı sınırlamak için: kimliksiz
             bildirimler rakip ilanları gömmek üzere toplu gönderilebiliyor. */
          <div className="py-2 text-sm text-muted-foreground">
            Şikayet gönderebilmek için giriş yapmanız gerekiyor.
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href="/login">Giriş Yap</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  htmlFor={`sebep-${r.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={r.value} id={`sebep-${r.value}`} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block font-medium">{r.label}</span>
                    {r.hint && (
                      <span className="block text-xs text-muted-foreground">{r.hint}</span>
                    )}
                  </span>
                </label>
              ))}
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor="sikayet-not">Açıklama (isteğe bağlı)</Label>
              <Textarea
                id="sikayet-not"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Ne fark ettiğinizi kısaca yazın; inceleme hızlanır."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button onClick={submit} disabled={isSending}>
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Şikayeti Gönder
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
