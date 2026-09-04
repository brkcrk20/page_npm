import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

import { DopingClient } from './DopingClient';

export const metadata: Metadata = {
  title: 'İlanını Öne Çıkar',
  description: 'Vitrin, üst sırada ve acil rozeti ile ilanınızı öne çıkarın.',
  robots: { index: false, follow: true },
};

export default function DopingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DopingClient />
    </Suspense>
  );
}
