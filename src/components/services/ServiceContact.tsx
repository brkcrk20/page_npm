'use client';

import { useEffect, useState } from 'react';
import { Globe, MessageCircle, Navigation, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';

/**
 * Klinik iletişim düğmeleri.
 *
 * Telefon baştan gösterilmiyor: numara toplayan botlara karşı engel ve
 * "kaç kişi aradı" sayacı gerçek niyeti ölçüyor. İlan detayındaki satıcı
 * kartıyla aynı yaklaşım.
 */
export function ServiceContact({
  providerId,
  phone,
  phoneAlt,
  whatsapp,
  website,
  address,
  cityName,
  districtName,
}: {
  providerId: number;
  phone: string | null;
  phoneAlt: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  cityName?: string;
  districtName?: string;
}) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);

  // Görüntülenme sayacı — oturum başına bir kez.
  useEffect(() => {
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    const key = `veteriner-goruntulendi-${providerId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Gizli sekmede sessionStorage erişimi hata verebilir; sayaç kritik değil.
    }
    supabase.rpc('increment_service_view', { p_provider_id: providerId });
  }, [providerId]);

  function track(rpc: 'increment_service_phone' | 'increment_service_whatsapp') {
    getSupabaseBrowserClientOrNull()?.rpc(rpc, { p_provider_id: providerId });
  }

  function handlePhone() {
    if (!phone) {
      toast({ title: 'Telefon paylaşılmamış' });
      return;
    }
    if (!revealed) {
      setRevealed(true);
      track('increment_service_phone');
      return;
    }
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  const whatsappNumber = (whatsapp || phone || '').replace(/\D/g, '');
  const whatsappHref = whatsappNumber
    ? `https://wa.me/90${whatsappNumber.replace(/^90/, '').replace(/^0/, '')}`
    : null;

  // Yol tarifi: koordinat yerine adres araması kullanılıyor. Koordinatı olmayan
  // kayıtlarda da çalışsın diye; il/ilçe eklenmesi eşleşmeyi belirgin
  // biçimde iyileştiriyor.
  const mapQuery = [address, districtName, cityName].filter(Boolean).join(', ');
  const mapHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <div className="space-y-2">
      {phone && (
        <button
          type="button"
          onClick={handlePhone}
          className="flex w-full items-center gap-3 rounded-md border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          {revealed ? phone : 'Telefonu Göster'}
        </button>
      )}

      {revealed && phoneAlt && (
        <a
          href={`tel:${phoneAlt.replace(/\s/g, '')}`}
          className="flex w-full items-center gap-3 rounded-md border bg-white px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          {phoneAlt}
        </a>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('increment_service_whatsapp')}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}

      {mapHref && (
        <Button variant="outline" className="w-full justify-center gap-2" asChild>
          <a href={mapHref} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-4 w-4" />
            Yol Tarifi Al
          </a>
        </Button>
      )}

      {website && (
        <Button variant="outline" className="w-full justify-center gap-2" asChild>
          <a href={website} target="_blank" rel="noopener noreferrer nofollow">
            <Globe className="h-4 w-4" />
            Web Sitesi
          </a>
        </Button>
      )}
    </div>
  );
}
