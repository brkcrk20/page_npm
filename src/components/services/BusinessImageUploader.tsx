'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BUSINESS_IMAGE_BUCKET, businessImageUrl } from '@/lib/supabase/storage';
import { prepareImages } from '@/lib/image-pipeline';
import { cn } from '@/lib/utils';

/**
 * İşletme logosu ve fotoğraf galerisi.
 *
 * İki ayrı kavram tek bileşende: logo tek dosya (kartta ve profil
 * başlığında), fotoğraflar sıralı galeri. Aynı yükleme kodunu iki kez
 * yazmamak için `mod` ile ayrılıyorlar.
 *
 * Görseller yüklenmeden önce webp'e indirgeniyor (image-pipeline): işletme
 * sahibinin telefonundan gelen 6 MB'lık fotoğraf hem kotayı hem sayfa
 * hızını yiyordu.
 */

type Foto = { id?: number; storage_path: string; position: number };

export function BusinessImageUploader({
  providerId,
  userId,
  mod,
  logoPath,
  photos,
  onLogoChange,
  onPhotosChange,
}: {
  providerId: number;
  userId: string;
  mod: 'logo' | 'galeri';
  logoPath?: string | null;
  photos?: Foto[];
  onLogoChange?: (path: string | null) => void;
  onPhotosChange?: (photos: Foto[]) => void;
}) {
  const { toast } = useToast();
  const girdi = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const logo = mod === 'logo';
  const liste = photos ?? [];

  async function sec(dosyalar: FileList | null) {
    if (!dosyalar?.length) return;

    // Galeride en fazla sekiz fotoğraf: dokuzuncudan sonrası kimsenin
    // bakmadığı, yalnızca sayfayı ağırlaştıran içerik.
    const kalan = logo ? 1 : Math.max(0, 8 - liste.length);
    if (kalan === 0) {
      toast({ title: 'Fotoğraf sınırına ulaştınız', description: 'En fazla 8 fotoğraf ekleyebilirsiniz.' });
      return;
    }

    setYukleniyor(true);
    try {
      const hazir = await prepareImages(
        Array.from(dosyalar).slice(0, kalan),
        { title: logo ? 'logo' : 'isletme-fotografi', context: String(providerId) },
        liste.length
      );

      const supabase = getSupabaseBrowserClient();
      const yenidenler: Foto[] = [];

      for (const [i, item] of hazir.entries()) {
        const yol = `${userId}/${providerId}-${logo ? 'logo' : Date.now() + '-' + i}.webp`;
        const { error } = await supabase.storage
          .from(BUSINESS_IMAGE_BUCKET)
          .upload(yol, item.file, { contentType: item.file.type, upsert: logo });

        if (error) throw new Error(error.message);

        if (logo) {
          const { error: guncelleme } = await supabase
            .from('service_providers')
            .update({ logo_url: yol } as never)
            .eq('id', providerId);
          if (guncelleme) throw new Error(guncelleme.message);
          onLogoChange?.(yol);
        } else {
          const sira = liste.length + yenidenler.length;
          const { data, error: ekleme } = await supabase
            .from('service_provider_photos')
            .insert({
              provider_id: providerId,
              storage_path: yol,
              width: item.width,
              height: item.height,
              position: sira,
            } as never)
            .select('id, storage_path, position')
            .single();
          if (ekleme) throw new Error(ekleme.message);
          yenidenler.push(data as unknown as Foto);
        }
      }

      if (!logo && yenidenler.length) onPhotosChange?.([...liste, ...yenidenler]);
      toast({ title: logo ? 'Logo yüklendi' : `${hazir.length} fotoğraf eklendi` });
    } catch (e) {
      toast({
        title: 'Yüklenemedi',
        description: e instanceof Error ? e.message : 'Bilinmeyen hata',
        variant: 'destructive',
      });
    } finally {
      setYukleniyor(false);
      if (girdi.current) girdi.current.value = '';
    }
  }

  async function sil(foto: Foto) {
    const supabase = getSupabaseBrowserClient();
    if (foto.id) {
      const { error } = await supabase.from('service_provider_photos').delete().eq('id', foto.id);
      if (error) {
        toast({ title: 'Silinemedi', description: error.message, variant: 'destructive' });
        return;
      }
    }
    // Dosyanın kendisi de gitsin; yoksa kovada sahipsiz dosya birikiyor.
    await supabase.storage.from(BUSINESS_IMAGE_BUCKET).remove([foto.storage_path]);
    onPhotosChange?.(liste.filter((f) => f.storage_path !== foto.storage_path));
  }

  async function logoSil() {
    if (!logoPath) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from('service_providers').update({ logo_url: null } as never).eq('id', providerId);
    await supabase.storage.from(BUSINESS_IMAGE_BUCKET).remove([logoPath]);
    onLogoChange?.(null);
  }

  return (
    <div className="space-y-3">
      <input
        ref={girdi}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={!logo}
        className="hidden"
        onChange={(e) => sec(e.target.files)}
      />

      {logo ? (
        <div className="flex items-center gap-4">
          <div className={cn(
            'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted',
            !logoPath && 'border-dashed'
          )}>
            {businessImageUrl(logoPath) ? (
              <Image src={businessImageUrl(logoPath)!} alt="İşletme logosu" fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={yukleniyor} onClick={() => girdi.current?.click()}>
              {yukleniyor && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {logoPath ? 'Logoyu Değiştir' : 'Logo Yükle'}
            </Button>
            {logoPath && (
              <Button type="button" variant="ghost" size="sm" onClick={logoSil} className="text-muted-foreground">
                Kaldır
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {liste.map((foto) => (
              <div key={foto.storage_path} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                {businessImageUrl(foto.storage_path) && (
                  <Image src={businessImageUrl(foto.storage_path)!} alt="" fill sizes="200px" className="object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => sil(foto)}
                  aria-label="Fotoğrafı sil"
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {liste.length < 8 && (
              <button
                type="button"
                disabled={yukleniyor}
                onClick={() => girdi.current?.click()}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[11px]">Fotoğraf ekle</span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            En fazla 8 fotoğraf. Mekânın gerçek fotoğraflarını kullanın; stok görseller
            kullanıcıyı yanıltır ve yayından kaldırılır.
          </p>
        </>
      )}
    </div>
  );
}
