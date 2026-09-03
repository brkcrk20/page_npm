import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = {
  title: 'Mesajlarım | PetSemti',
  description: 'İlanlarınız üzerinden gelen mesajlar.',
  // Kişiye özel içerik; arama sonuçlarında yeri yok.
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return (
    // useSearchParams Suspense sınırı gerektiriyor (ilan parametresiyle
    // konuşma açılıyor).
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
