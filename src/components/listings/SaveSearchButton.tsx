'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BellPlus, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Aramayı kaydet.
 *
 * Aradığını bulamayan ziyaretçi bir daha aynı filtreleri kurmak zorunda
 * kalıyordu ve çoğu geri dönmüyordu. Kaydedilen arama profilde duruyor ve
 * son bakıştan sonra eklenen ilan sayısını gösteriyor.
 *
 * SIRALAMA KAYDEDİLMİYOR
 * Sıralama hangi ilanların eşleştiğini değiştirmiyor, yalnızca sırasını.
 * Kaydetseydik aynı arama iki farklı sıralamayla iki ayrı kayıt olurdu.
 */
export function SaveSearchButton({
  baslik,
  context,
}: {
  baslik: string;
  context?: { kategori?: string; sehir?: string; cins?: string };
}) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const pathname = usePathname() ?? '/';
  const search = useSearchParams();

  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link href="/login">
          <BellPlus className="mr-1.5 h-4 w-4" />
          Aramayı Kaydet
        </Link>
      </Button>
    );
  }

  async function kaydet() {
    setKaydediliyor(true);

    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(context ?? {})) if (v) params[k] = v;
    for (const anahtar of ['kimden', 'min', 'max']) {
      const deger = search.get(anahtar);
      if (deger) params[anahtar] = deger;
    }

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('saved_searches').insert({
      user_id: user!.id,
      name: baslik.slice(0, 80),
      path: pathname,
      params,
    });
    setKaydediliyor(false);

    if (error) {
      // (user_id, path, params) tekil: aynı aramayı ikinci kez kaydetmek
      // hata değil, zaten kayıtlı olduğunu söylemek yeterli.
      const zatenVar = error.code === '23505';
      setKaydedildi(zatenVar);
      toast({
        title: zatenVar ? 'Bu arama zaten kayıtlı' : 'Arama kaydedilemedi',
        description: zatenVar ? 'Kayıtlı aramalarınızda görebilirsiniz.' : error.message,
        variant: zatenVar ? 'default' : 'destructive',
      });
      return;
    }

    setKaydedildi(true);
    toast({
      title: 'Arama kaydedildi',
      description: 'Yeni ilan eklendiğinde profilinizde sayısını göreceksiniz.',
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={kaydet}
      disabled={kaydediliyor || kaydedildi}
      className="text-muted-foreground hover:text-primary"
    >
      {kaydediliyor ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : kaydedildi ? (
        <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
      ) : (
        <BellPlus className="mr-1.5 h-4 w-4" />
      )}
      {kaydedildi ? 'Kaydedildi' : 'Aramayı Kaydet'}
    </Button>
  );
}
