'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Bireysel hesabı kurumsala yükseltme.
 *
 * Veteriner, pet oteli, kuaför gibi rehberlere yalnızca kurumsal hesaplar
 * kayıt açabiliyor. Bu kural olmadan rehberler bireysel kullanıcıların açtığı
 * kayıtlarla doluyordu.
 *
 * Ama kural tek başına bir çıkmaz üretiyordu: bireysel üye olarak kaydolmuş
 * bir veteriner işletmesini hiçbir şekilde ekleyemiyordu. Yükseltmenin bir
 * yolu olmalı ve destek beklemeden çalışmalı.
 *
 * Doğrulama veritabanında (profiles_guard): dört alan da eksiksiz olmadan
 * hesap tipi değişmiyor. Buradaki kontrol yalnızca anında geri bildirim için.
 */
export function UpgradeToCorporate() {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useSupabaseAuth();

  const [companyTitle, setCompanyTitle] = useState(profile?.company_title ?? '');
  const [taxOffice, setTaxOffice] = useState(profile?.tax_office ?? '');
  const [taxNumber, setTaxNumber] = useState(profile?.tax_number ?? '');
  const [address, setAddress] = useState(profile?.company_address ?? '');
  const [isBusy, setIsBusy] = useState(false);

  if (profile?.account_type === 'kurumsal') return null;

  const missing =
    !companyTitle.trim() || !taxOffice.trim() || !taxNumber.trim() || !address.trim();

  async function upgrade() {
    if (!user) return;
    setIsBusy(true);

    const { error } = await getSupabaseBrowserClient()
      .from('profiles')
      .update({
        account_type: 'kurumsal',
        company_title: companyTitle.trim(),
        tax_office: taxOffice.trim(),
        tax_number: taxNumber.trim(),
        company_address: address.trim(),
      })
      .eq('id', user.id);

    setIsBusy(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Geçiş yapılamadı', description: error.message });
      return;
    }
    await refreshProfile();
    toast({
      title: 'Kurumsal hesaba geçtiniz',
      description: 'Artık işletmenizi rehberlere ekleyebilirsiniz.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Kurumsal Hesaba Geç
        </CardTitle>
        <CardDescription>
          Veteriner kliniği, pet shop, otel, kuaför, eğitmen veya pet taksi işletiyorsanız
          kurumsal hesapla işletmenizi rehberlere ekleyebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {[
            'İşletmenizi hizmet rehberlerinde yayınlayın',
            'Çalışma saatleri, adres ve harita bilgisi ekleyin',
            'Müşteri yorumu ve puan alın',
            'Faturalarınız firma bilgilerinizle kesilir',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ct">Firma / İşletme Ünvanı</Label>
            <Input
              id="ct"
              value={companyTitle}
              onChange={(e) => setCompanyTitle(e.target.value)}
              placeholder="Örn. Kadıköy Veteriner Kliniği Ltd. Şti."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">Vergi Dairesi</Label>
            <Input id="to" value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tn">Vergi Numarası</Label>
            <Input id="tn" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ca">İşletme Adresi</Label>
            <Textarea
              id="ca"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Açık adres"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={upgrade} disabled={isBusy || missing}>
            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kurumsal Hesaba Geç
          </Button>
          {missing && (
            <span className="text-xs text-muted-foreground">
              Geçiş için dört alanın da doldurulması gerekiyor.
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Geçiş sonrası{' '}
          <Link href="/veteriner/kayit" className="text-primary hover:underline">
            işletme kaydı
          </Link>{' '}
          açabilirsiniz. Kayıtlar yayına alınmadan önce incelenir.
        </p>
      </CardContent>
    </Card>
  );
}
