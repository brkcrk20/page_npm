'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * İletişim formu.
 *
 * İletişim sayfasında kendi kendine çözüm bağlantıları vardı ama mesaj
 * gönderilecek bir yer yoktu; ayarlardaki e-posta ve telefon da boş olduğu
 * için sayfaya gelen kullanıcının elinde tek bir kanal bile kalmıyordu.
 *
 * GİRİŞ İSTEMİYORUZ
 * Yazması gereken kişi çoğu zaman hesabına giremeyen kişi. Giriş şartı
 * koymak tam da onu dışarıda bırakırdı. Açık formu kötüye kullanıma karşı
 * veritabanı koruyor: aynı e-postadan saatte üç mesaj.
 *
 * E-POSTA SAĞLAYICISI YOK
 * Mesaj veritabanına yazılıyor ve yönetim panelinde görünüyor. "Gönderildi"
 * deyip hiçbir yere yazmayan bir form, formun hiç olmamasından kötü olurdu.
 */

const KONULAR = [
  'İlan bildirimi / şikayet',
  'Hesabımla ilgili sorun',
  'İşletme kaydı hakkında',
  'Öneri',
  'Reklam ve iş birliği',
  'Diğer',
];

export function ContactForm() {
  const { user, profile } = useSupabaseAuth();
  const { toast } = useToast();

  const [ad, setAd] = useState('');
  const [eposta, setEposta] = useState('');
  const [konu, setKonu] = useState(KONULAR[0]!);
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  // Giriş yapmışsa alanları doldur: aynı bilgiyi tekrar yazdırmanın anlamı yok.
  useEffect(() => {
    if (profile?.full_name) setAd((o) => o || profile.full_name!);
    if (user?.email) setEposta((o) => o || user.email!);
  }, [profile?.full_name, user?.email]);

  if (gonderildi) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
        <h2 className="mt-2 font-bold text-emerald-900">Mesajınız bize ulaştı</h2>
        <p className="mt-1 text-sm text-emerald-800">
          En kısa sürede {eposta} adresine dönüş yapacağız.
        </p>
      </div>
    );
  }

  const tamam =
    ad.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta.trim()) &&
    mesaj.trim().length >= 10;

  async function gonder() {
    setGonderiliyor(true);
    const supabase = getSupabaseBrowserClient();
    // .insert() geriye satır istemiyor: okuma yalnızca yöneticiye açık,
    // temsil istemek RLS hatasına düşerdi.
    const { error } = await supabase.from('contact_messages').insert({
      name: ad.trim(),
      email: eposta.trim(),
      subject: konu,
      message: mesaj.trim(),
    });
    setGonderiliyor(false);

    if (error) {
      toast({ title: 'Mesaj gönderilemedi', description: error.message, variant: 'destructive' });
      return;
    }
    setGonderildi(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ad">Adınız</Label>
          <Input id="ad" value={ad} onChange={(e) => setAd(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eposta">E-posta adresiniz</Label>
          <Input
            id="eposta"
            type="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            placeholder="size donus yapabilmemiz icin"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="konu">Konu</Label>
        <Select value={konu} onValueChange={setKonu}>
          <SelectTrigger id="konu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KONULAR.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mesaj">Mesajınız</Label>
        <Textarea
          id="mesaj"
          rows={6}
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          maxLength={4000}
          placeholder="İlan bildiriyorsanız ilan numarasını yazmanız incelemeyi hızlandırır."
        />
        <p className="text-xs text-muted-foreground">{mesaj.trim().length}/4000</p>
      </div>

      <Button onClick={gonder} disabled={!tamam || gonderiliyor} className="w-full sm:w-auto">
        {gonderiliyor ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Mesajı Gönder
      </Button>
    </div>
  );
}
