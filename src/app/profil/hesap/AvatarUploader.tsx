'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Building2, Camera, Loader2, Trash2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { prepareAvatar } from '@/lib/image-pipeline';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AVATAR_BUCKET, avatarUrl } from '@/lib/supabase/storage';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Profil fotoğrafı yükleme.
 *
 * profiles.avatar_url en baştan beri vardı ve satıcı kartında okunuyordu ama
 * hiçbir yerde yazılamıyordu — kullanıcının fotoğraf ekleme imkânı yoktu.
 *
 * Fotoğraf tarayıcıda kare kırpılıp WebP'ye çevriliyor: 4 MB'lık bir telefon
 * fotoğrafı ~30 KB'a iniyor. Sunucu tarafında görsel işleme kurmaya gerek yok
 * ve kullanıcı yavaş bağlantıda megabaytlarca veri yüklemiyor.
 *
 * Kolonda tam URL değil depolama yolu tutuluyor; proje adresi değişirse
 * satırları güncellemek gerekmesin.
 */
export function AvatarUploader() {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useSupabaseAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isBusy, setIsBusy] = useState(false);
  // Yükleme biter bitmez gösterilecek yerel önizleme: depolamadaki dosyanın
  // CDN'e yayılması bir an sürebiliyor ve kullanıcı hiçbir şey olmamış gibi
  // görüyordu.
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const isCorporate = profile?.account_type === 'kurumsal';
  const current = localPreview ?? avatarUrl(profile?.avatar_url);

  async function handleFile(file: File) {
    if (!user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Desteklenmeyen dosya',
        description: 'Lütfen bir fotoğraf seçin (JPG, PNG veya WebP).',
      });
      return;
    }

    setIsBusy(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const prepared = await prepareAvatar(file, user.id);
      const path = `${user.id}/${prepared.file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, prepared.file, { contentType: prepared.file.type, upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const previous = profile?.avatar_url;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', user.id);
      if (updateError) throw new Error(updateError.message);

      // Eski dosyayı yeni kayıt yazıldıktan SONRA sil: önce silip sonra
      // güncelleme hata verse, kullanıcı hem eski hem yeni fotoğrafsız kalırdı.
      if (previous && !previous.startsWith('http')) {
        await supabase.storage.from(AVATAR_BUCKET).remove([previous]);
      }

      setLocalPreview(prepared.previewUrl);
      await refreshProfile();
      toast({ title: 'Profil fotoğrafınız güncellendi' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Fotoğraf yüklenemedi',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      });
    } finally {
      setIsBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function removeAvatar() {
    if (!user || !profile?.avatar_url) return;
    setIsBusy(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const path = profile.avatar_url;

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (error) throw new Error(error.message);

      if (!path.startsWith('http')) {
        await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      }

      setLocalPreview(null);
      await refreshProfile();
      toast({ title: 'Profil fotoğrafı kaldırıldı' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Kaldırılamadı',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white bg-primary/10 shadow-sm">
          {current ? (
            <Image
              src={current}
              alt="Profil fotoğrafınız"
              fill
              sizes="96px"
              className="object-cover"
              unoptimized={current.startsWith('blob:')}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-primary">
              {isCorporate ? <Building2 className="h-9 w-9" /> : <User className="h-9 w-9" />}
            </span>
          )}

          {isBusy && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          aria-label="Profil fotoğrafı seç"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <div className="text-center sm:pt-2 sm:text-left">
        <p className="font-medium">Profil Fotoğrafı</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          İlanlarınızda ve satıcı profilinizde görünür. Fotoğraflı ilanlara güven daha
          yüksek. JPG, PNG veya WebP.
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            {profile?.avatar_url ? 'Değiştir' : 'Fotoğraf Yükle'}
          </Button>

          {profile?.avatar_url && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={removeAvatar}
              disabled={isBusy}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Kaldır
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
