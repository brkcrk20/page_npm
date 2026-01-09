'use client';

import { useUser } from '@/firebase';
import { Loader2, ShieldOff } from 'lucide-react';
import { AdminShell } from './AdminShell';


export default function AdminPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // IMPORTANT: In a real production app, this check should be done using custom claims
  // and enforced with Firestore security rules, not just client-side logic.
  const isAdmin = user && user.email === 'admin@patisemti.com';

  if (!isAdmin) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <ShieldOff className="h-24 w-24 text-destructive" />
        <h1 className="mt-6 text-3xl font-bold font-headline">Erişim Reddedildi</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Bu sayfayı görüntüleme yetkiniz yok.
        </p>
      </div>
    );
  }

  return <AdminShell />;
}
