'use client';

import { useState, useRef } from 'react';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { User, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Camera } from 'lucide-react';

interface AvatarUploaderProps {
  user: User;
}

export function AvatarUploader({ user }: AvatarUploaderProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const auth = useAuth();
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name?: string | null) => {
    if (!name && user?.email) return user.email.charAt(0).toUpperCase();
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !auth.currentUser) return;

    setIsUploading(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressedFile = await imageCompression(file, options);

      const storageRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // --- CRITICAL CHANGE: Update Auth profile FIRST ---
      // This will trigger the useUser hook and update the UI immediately and reliably.
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      // Update Firestore in the background. This doesn't need to block the UI update.
      const userProfileRef = doc(firestore, 'users', user.uid);
      updateDoc(userProfileRef, { avatarUrl: downloadURL });

      toast({
        title: 'Başarılı!',
        description: 'Profil resminiz güncellendi.',
      });

    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Yükleme Başarısız',
        description: 'Profil resmi yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const username = user.displayName || user.email || 'Kullanıcı';
  const avatarUrl = user.photoURL || '';

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24 border-4 border-primary/50">
        <AvatarImage src={avatarUrl} alt={username} />
        <AvatarFallback className="text-3xl bg-secondary">{getInitials(username)}</AvatarFallback>
      </Avatar>
      
      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-50 group-hover:opacity-100 transition-opacity"
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Profil resmini değiştir</span>
        </Button>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
    </div>
  );
}
