'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, KeyRound, Loader2, Trash2, User } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { AvatarUploader } from './AvatarUploader';

/**
 * Hesap bilgilerim.
 *
 * Üç ayrı iş bir arada: profil bilgileri, şifre değiştirme ve üyeliği
 * sonlandırma. Şifre değiştirme hiçbir yerde yoktu — kullanıcının şifresini
 * değiştirmesinin tek yolu hesabını unutmaktı.
 *
 * E-posta alanı salt okunur: değiştirmek Supabase tarafında doğrulama akışı
 * gerektiriyor ve doğrulama e-postaları şu an kapalı. Yanlışlıkla erişilemez
 * bir adrese geçmek, hesabın tamamen kaybedilmesi demek olurdu.
 */
export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile } = useSupabaseAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [companyTitle, setCompanyTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isCorporate = profile?.account_type === 'kurumsal';
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setBio(profile?.bio ?? '');
    setCompanyTitle(profile?.company_title ?? '');
  }, [profile?.full_name, profile?.phone, profile?.bio, profile?.company_title]);

  async function saveProfile() {
    if (!user) return;
    setIsSaving(true);

    const { error } = await getSupabaseBrowserClient()
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        ...(isCorporate ? { company_title: companyTitle.trim() || null } : {}),
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      return;
    }
    await refreshProfile();
    toast({ title: 'Bilgileriniz güncellendi' });
  }

  async function changePassword() {
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Şifre çok kısa',
        description: 'En az 6 karakter olmalı.',
      });
      return;
    }
    if (password !== passwordAgain) {
      toast({
        variant: 'destructive',
        title: 'Şifreler eşleşmiyor',
        description: 'İki alana da aynı şifreyi yazın.',
      });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setIsChangingPassword(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Şifre değiştirilemedi', description: error.message });
      return;
    }
    setPassword('');
    setPasswordAgain('');
    toast({ title: 'Şifreniz değiştirildi' });
  }

  async function deleteAccount() {
    setIsDeleting(true);
    const { error } = await getSupabaseBrowserClient().rpc('delete_my_account');

    if (error) {
      setIsDeleting(false);
      toast({ variant: 'destructive', title: 'Hesap silinemedi', description: error.message });
      return;
    }

    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hesap Bilgilerim</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {isCorporate ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {isCorporate ? 'İşletme Bilgileri' : 'Kişisel Bilgiler'}
          </CardTitle>
          <CardDescription>
            İlanlarınızda ve satıcı profilinizde görünen bilgiler.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="border-b pb-5 sm:col-span-2">
            <AvatarUploader />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" value={user?.email ?? ''} disabled />
            <p className="text-xs text-muted-foreground">
              E-posta adresi değiştirilemez.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input id="username" value={profile?.username ? `@${profile.username}` : ''} disabled />
            <p className="text-xs text-muted-foreground">
              İlan bağlantılarınızda kullanılıyor, değiştirilemez.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5xx xxx xx xx"
            />
          </div>

          {isCorporate && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="companyTitle">Firma / İşletme Ünvanı</Label>
              <Input
                id="companyTitle"
                value={companyTitle}
                onChange={(e) => setCompanyTitle(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bio">Hakkımda</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Satıcı profilinizde görünecek kısa bir tanıtım."
            />
          </div>

          <div className="sm:col-span-2">
            <Button onClick={saveProfile} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Değişiklikleri Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            Şifre Değiştir
          </CardTitle>
          <CardDescription>
            Yeni şifreniz kaydedildiği anda geçerli olur; diğer cihazlardaki oturumlarınız
            açık kalır.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pw">Yeni Şifre</Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Yeni Şifre (Tekrar)</Label>
            <Input
              id="pw2"
              type="password"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={changePassword} disabled={isChangingPassword || !password}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şifreyi Güncelle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="h-5 w-5" />
            Üyeliği Sonlandır
          </CardTitle>
          <CardDescription>
            Hesabınızla birlikte ilanlarınız, fotoğraflarınız, mesajlarınız ve favorileriniz
            kalıcı olarak silinir. Bu işlem geri alınamaz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Yönetici hesabı</AlertTitle>
              <AlertDescription>
                Yönetici hesapları panelden silinemez. Önce yönetici yetkisinin kaldırılması
                gerekiyor.
              </AlertDescription>
            </Alert>
          ) : (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Hesabımı Kalıcı Olarak Sil
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Yazarak onaylatma: silme geri alınamıyor ve tek tıkla tetiklenmemeli. */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteConfirm('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabınız kalıcı olarak silinecek</AlertDialogTitle>
            <AlertDialogDescription>
              Bütün ilanlarınız, fotoğraflarınız, mesajlarınız ve favorileriniz geri
              getirilemeyecek şekilde silinir. Devam etmek için aşağıya{' '}
              <strong>SİL</strong> yazın.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="SİL"
            autoComplete="off"
          />

          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirm.trim().toLocaleUpperCase('tr-TR') !== 'SİL' || isDeleting}
              onClick={(e) => {
                e.preventDefault();
                deleteAccount();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hesabımı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
