'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * E-posta bildirim tercihi.
 *
 * Tercih veritabanında; bildirimi kuyruğa yazan tetikleyici de aynı alana
 * bakıyor. Yani kapalıyken bildirim üretilmiyor bile — "üret ama gönderme"
 * yaklaşımı, kapatan kullanıcının verisini gereksiz yere biriktirirdi.
 */
export function BildirimTercihi() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [acik, setAcik] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await getSupabaseBrowserClient()
        .from('profiles')
        .select('email_notifications')
        .eq('id', user.id)
        .maybeSingle();
      setAcik(data?.email_notifications !== false);
      setYukleniyor(false);
    })();
  }, [user]);

  async function degistir(deger: boolean) {
    if (!user) return;
    setAcik(deger);
    setKaydediliyor(true);
    const { error } = await getSupabaseBrowserClient()
      .from('profiles')
      .update({ email_notifications: deger })
      .eq('id', user.id);
    setKaydediliyor(false);

    if (error) {
      setAcik(!deger);
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      return;
    }
    toast({ title: deger ? 'Bildirimler açıldı' : 'Bildirimler kapatıldı' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          E-posta Bildirimleri
        </CardTitle>
        <CardDescription>
          İlanınıza mesaj geldiğinde ve ilanınızın süresi dolmak üzereyken e-posta
          gönderiyoruz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="bildirim" className="text-base">
              Bildirim e-postası al
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Kapatırsanız mesajları yalnızca siteye girdiğinizde görürsünüz. Pazarlama
              e-postası göndermiyoruz.
            </p>
          </div>
          {yukleniyor ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="bildirim"
              checked={acik}
              disabled={kaydediliyor}
              onCheckedChange={degistir}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
