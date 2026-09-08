'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * "Başa dön" düğmesi.
 *
 * Kendi dosyasında, çünkü alt bilgiyi istemci bileşeni yapan tek şey
 * buydu: otuz bağlantı, marka metni ve iletişim bilgisi yalnızca bu
 * küçük düğme yüzünden tarayıcıda yeniden kuruluyordu. Ayrılınca alt
 * bilginin tamamı sunucuda kalıyor ve hiç canlandırılmıyor.
 */
export function BasaDon() {
  const [gorunur, setGorunur] = useState(false);

  useEffect(() => {
    const kontrol = () => setGorunur(window.scrollY > 300);
    kontrol();
    window.addEventListener('scroll', kontrol, { passive: true });
    return () => window.removeEventListener('scroll', kontrol);
  }, []);

  if (!gorunur) return null;

  return (
    <Button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 h-12 w-12 md:bottom-5 md:right-5 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-900"
      aria-label="Sayfanın başına dön"
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  );
}
