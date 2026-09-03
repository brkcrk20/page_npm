'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
 * Fatura bilgileri.
 *
 * Ücretlendirme şu an kapalı (app_settings.monetization.enabled = false), ama
 * bilgiler önceden toplanabilsin diye sayfa duruyor. Ücretli özellikler
 * açıldığında sipariş anında bu alanların anlık kopyası orders.billing_snapshot
 * içine yazılacak — kullanıcı sonradan profilini değiştirse bile kesilmiş
 * faturanın verisi bozulmasın.
 */

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isUserLoading, refreshProfile } = useSupabaseAuth();

  const [accountType, setAccountType] = useState<'bireysel' | 'kurumsal'>('bireysel');
  const [nationalId, setNationalId] = useState('');
  const [companyTitle, setCompanyTitle] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setAccountType(profile.account_type as 'bireysel' | 'kurumsal');
    setNationalId(profile.national_id ?? '');
    setCompanyTitle(profile.company_title ?? '');
    setCompanyType(profile.company_type ?? '');
    setTaxNumber(profile.tax_number ?? '');
    setTaxOffice(profile.tax_office ?? '');
    setCompanyAddress(profile.company_address ?? '');
  }, [profile]);

  async function save() {
    if (!user) return;

    // Veritabanındaki profiles_corporate_requires_title kısıtının aynısı;
    // kullanıcı ham kısıt hatası görmesin.
    if (accountType === 'kurumsal' && !companyTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Eksik bilgi',
        description: 'Kurumsal hesapta firma ünvanı zorunludur.',
      });
      return;
    }

    setIsSaving(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        account_type: accountType,
        national_id: nationalId.trim() || null,
        company_title: accountType === 'kurumsal' ? companyTitle.trim() : null,
        company_type: accountType === 'kurumsal' ? companyType.trim() || null : null,
        tax_number: accountType === 'kurumsal' ? taxNumber.trim() || null : null,
        tax_office: accountType === 'kurumsal' ? taxOffice.trim() || null : null,
        company_address: accountType === 'kurumsal' ? companyAddress.trim() || null : null,
      })
      .eq('id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
    } else {
      await refreshProfile();
      toast({ title: 'Fatura bilgileri kaydedildi' });
    }
    setIsSaving(false);
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Fatura Bilgileri</CardTitle>
        <CardDescription>
          İlan vermek ücretsizdir. Bu bilgiler yalnızca ileride ücretli bir hizmet
          satın alırsanız fatura kesmek için kullanılır.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Hesap Türü</Label>
          <Select value={accountType} onValueChange={(v) => setAccountType(v as 'bireysel' | 'kurumsal')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bireysel">Bireysel</SelectItem>
              <SelectItem value="kurumsal">Kurumsal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nationalId">TC Kimlik No</Label>
          <Input
            id="nationalId"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            maxLength={11}
            placeholder="11 haneli"
          />
        </div>

        {accountType === 'kurumsal' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="companyTitle">Firma Ünvanı</Label>
              <Input id="companyTitle" value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Şirket Türü</Label>
              <Select value={companyType} onValueChange={setCompanyType}>
                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sahis">Şahıs</SelectItem>
                  <SelectItem value="Limited">Limited</SelectItem>
                  <SelectItem value="Anonim">Anonim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="taxNumber">Vergi No</Label>
                <Input id="taxNumber" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                <Input id="taxOffice" value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyAddress">Firma Adresi</Label>
              <Textarea id="companyAddress" rows={3} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
            </div>
          </>
        )}

        <Button onClick={save} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
