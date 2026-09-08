'use client';

import Image from 'next/image';

import { avatarUrl } from '@/lib/supabase/storage';
import { ilanWhatsappMetni, whatsappAdresi } from '@/lib/whatsapp-mesaj';
import { formatTrPhone, whatsappNumber } from '@/lib/phone';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  BadgeCheck,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClientOrNull } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SellerInfo } from '@/lib/queries/listings';

/**
 * Satıcı kartı: kimlik, iletişim düğmeleri ve üyelik istatistikleri.
 *
 * TELEFON SAYFAYLA GELMİYOR
 * "Telefonu Göster" düğmesi eskiden de vardı ama numara zaten sayfanın
 * içindeydi: WhatsApp bağlantısının adresinde ve bu bileşene geçirilen
 * özelliklerin HTML'e gömülen kopyasında. Yani düğme yalnızca gözden
 * saklıyordu; sayfayı indiren bir betik tıklamadan numarayı alıyordu.
 * Numara artık düğmeye basılınca sunucudan isteniyor.
 *
 * MESAJ ÖNCE
 * Birincil eylem mesajlaşma: numarasını vermeden iletişim kurabilmek hem
 * alıcı hem satıcı için daha güvenli ve yazışma sitede kalıyor.
 *
 * SAYILAR BİR KEZ
 * Kart eskiden aynı üç sayıyı iki kez gösteriyordu: içeride bir tablo,
 * altında ayrıca üç kutu. Tek şerit kaldı. Görüntülenme sayısı da
 * kartın altındaki kutudan kalktı: özellik tablosunda zaten var ve iki
 * yerde farklı an okunduğu için birbirini tutmayan iki sayı çıkıyordu.
 *
 * MOBİLDE SABİT ŞERİT
 * Uzun bir ilan sayfasında iletişim düğmeleri ekrandan çıkıyordu.
 * Telefonundan bakan kullanıcı için aynı eylemler altta sabit duruyor;
 * durum (numara alındı mı) kartla ortak, iki yerde ayrı istek gitmiyor.
 */
export function SellerCard({
  seller,
  listingId,
  listingTitle,
  hasPhone,
  showPhone,
  allowWhatsapp,
  demoMu = false,
}: {
  seller: SellerInfo | null;
  listingId: number;
  /** WhatsApp'a yazılan hazır metinde geçiyor. */
  listingTitle: string;
  /** Numaranın kendisi DEĞİL, yalnızca var olup olmadığı. */
  hasPhone: boolean;
  showPhone: boolean;
  allowWhatsapp: boolean;
  /** Vitrin için eklenmiş örnek ilan; iletişim düğmeleri gösterilmiyor. */
  demoMu?: boolean;
}) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const pathname = usePathname();
  const [phone, setPhone] = useState<string | null>(null);
  const [aliniyor, setAliniyor] = useState(false);
  /** Oturumsuz kullanıcıya gösterilen üyelik daveti. */
  const [davetAcik, setDavetAcik] = useState(false);

  const displayName =
    seller?.company_title || seller?.full_name || seller?.username || 'PetSemti Üyesi';

  const memberSince = seller?.member_since ? new Date(seller.member_since) : null;
  const membershipYears = memberSince
    ? Math.max(0, Math.floor((Date.now() - memberSince.getTime()) / (365.25 * 24 * 3600 * 1000)))
    : 0;
  const kurumsal = seller?.account_type === 'kurumsal';
  const telefonVar = showPhone && hasPhone;
  const whatsappVar = allowWhatsapp && hasPhone;

  function track(rpc: 'increment_listing_phone' | 'increment_listing_whatsapp') {
    const supabase = getSupabaseBrowserClientOrNull();
    // .then() ŞART — bkz. ListingActions'taki açıklama: tembel thenable
    // await edilmezse istek gönderilmiyor.
    void supabase?.rpc(rpc, { p_listing_id: listingId }).then(() => {});
  }

  /** Numarayı sunucudan getirir; zaten getirilmişse döndürür. */
  async function numarayiGetir(): Promise<string | null> {
    if (phone) return phone;

    // Numara üyelere açık. Girişi burada isteyip kullanıcıyı sayfadan
    // atmıyoruz: nedenini gösterip geri dönebileceği bir bağlantı veriyoruz.
    if (!user) {
      setDavetAcik(true);
      return null;
    }

    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return null;

    setAliniyor(true);
    const { data, error } = await supabase.rpc('get_listing_contact', {
      p_listing_id: listingId,
    });
    setAliniyor(false);

    if (error || !data) {
      // Sunucu oturumun düştüğünü söylüyorsa hata değil, davet göster.
      if (error?.code === '42501') {
        setDavetAcik(true);
        return null;
      }
      toast({
        title: 'Telefon alınamadı',
        description: error?.message ?? 'Satıcı mesaj yoluyla iletişim tercih ediyor.',
        variant: error ? 'destructive' : 'default',
      });
      return null;
    }

    setPhone(data as string);
    track('increment_listing_phone');
    return data as string;
  }

  async function revealPhone() {
    // İlk basış numarayı açar, ikincisi arar. Numarayı görür görmez
    // aramak isteyen kullanıcıyı ikinci bir adıma zorlamak yerine, ilk
    // basışta zaten numara görünüyor.
    if (!phone) {
      await numarayiGetir();
      return;
    }
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  async function whatsappAc() {
    const numara = await numarayiGetir();
    const wa = whatsappNumber(numara);
    if (!wa) {
      toast({ title: 'WhatsApp numarası yok' });
      return;
    }
    track('increment_listing_whatsapp');
    window.open(
      whatsappAdresi(wa, ilanWhatsappMetni(listingTitle)),
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <aside className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* Başlık bandı: kimlik. Ad ve fotoğraf satıcının profiline gidiyor.
            Önce yalnızca aşağıdaki "tüm ilanları" bağlantısı tıklanabilirdi;
            kullanıcılar önce isme ya da fotoğrafa basıyor ve hiçbir şey
            olmuyordu. */}
        <div className="bg-gradient-to-b from-secondary/60 to-transparent p-4">
          <ProfilBagi
            username={seller?.username ?? null}
            className="flex items-center gap-3 group"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-white shadow-sm">
              {avatarUrl(seller?.avatar_url) ? (
                <Image
                  src={avatarUrl(seller?.avatar_url)!}
                  alt={displayName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
                  {displayName.slice(0, 1).toLocaleUpperCase('tr')}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground group-hover:text-primary">
                {displayName}
              </p>
              <p
                className="mt-0.5 text-xs text-muted-foreground"
                title={
                  memberSince
                    ? `Üyelik tarihi: ${memberSince.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}`
                    : undefined
                }
              >
                {kurumsal ? 'Kurumsal üye' : 'Bireysel üye'}
                {memberSince && ` · ${memberSince.getFullYear()}'ten beri`}
              </p>
            </div>

            {seller?.username && (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </ProfilBagi>

          {/* Rozetler yalnızca hak edilmişse çıkıyor; boş bir satır
              bırakmaktansa hiç göstermemek daha okunur. */}
          {(seller?.is_verified || kurumsal) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {seller?.is_verified && (
                <Link
                  href="/yardim/onayli-kullanici-rozeti"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Onaylı üye
                </Link>
              )}
              {kurumsal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                  <Store className="h-3.5 w-3.5" />
                  Kurumsal
                </span>
              )}
            </div>
          )}
        </div>

        {/*
          Satıcı geçmişi.

          Alıcının ilk sorusu "bu kişi güvenilir mi". Emsal sitelerin hepsi
          üyelik tarihini ve ilan sayısını gösteriyor; ikisi de tek başına
          garanti değil ama yeni açılmış bir hesapla yıllardır ilan veren
          bir hesabı ayırt etmeye yarıyor. Veri zaten seller_stats'ta
          duruyordu, hiçbir yerde gösterilmiyordu.
        */}
        {seller && (
          <dl className="grid grid-cols-3 divide-x border-y bg-secondary/30 text-center">
            <Sayi
              deger={seller.active_listings}
              etiket="Yayında"
              href={seller.username ? `/satici/${seller.username}` : undefined}
            />
            <Sayi deger={seller.total_listings} etiket="Toplam ilan" />
            <Sayi deger={membershipYears > 0 ? `${membershipYears} yıl` : 'Yeni'} etiket="Üyelik" />
          </dl>
        )}

        <div className="p-4">
          {/* Örnek ilanda iletişim düğmesi yok.
              Düğmeyi bırakıp mesaja karşılık vermemek, ziyaretçiyi bekletmek
              olurdu; sebebini burada söylemek daha dürüst. */}
          {demoMu ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
              <p className="font-medium">Bu bir örnek ilan</p>
              <p className="mt-1 text-muted-foreground">
                Site yeni açıldığı için vitrinde örnek ilanlar bulunuyor. Bu ilanın
                arkasında gerçek bir ilan sahibi olmadığından mesaj ve telefon
                kapalı. Gerçek ilanlara{' '}
                <Link href="/sahiplendirme" className="text-primary hover:underline">
                  sahiplendirme
                </Link>{' '}
                bölümünden ulaşabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button className="h-11 w-full justify-center gap-2 text-[15px]" asChild>
                <Link href={`/mesajlarim?ilan=${listingId}`}>
                  <Mail className="h-4 w-4" />
                  Mesaj Gönder
                </Link>
              </Button>

              {telefonVar && (
                <button
                  type="button"
                  onClick={revealPhone}
                  disabled={aliniyor}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {aliniyor ? 'Alınıyor…' : phone ? formatTrPhone(phone) : 'Telefonu Göster'}
                </button>
              )}

              {whatsappVar && (
                <button
                  type="button"
                  onClick={whatsappAc}
                  disabled={aliniyor}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25d366] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
              )}
            </div>
          )}

          {/* Güvenlik uyarısı iletişim düğmelerinin hemen altında: kapora
              isteyen dolandırıcılık girişimi tam bu adımda başlıyor. */}
          <Link
            href="/yardim/guvenli-alisveris"
            className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-[11px] leading-snug text-amber-900 ring-1 ring-amber-200/70 hover:bg-amber-100"
          >
            <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong className="font-semibold">Hayvanı görmeden kapora göndermeyin.</strong>{' '}
              Güvenli alışveriş ipuçları →
            </span>
          </Link>
        </div>
      </div>

      <Dialog open={davetAcik} onOpenChange={setDavetAcik}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">İletişim bilgisi üyelere açık</DialogTitle>
            <DialogDescription className="text-center">
              İlan sahibinin telefon numarasını görmek ve mesaj göndermek için ücretsiz
              üye olun. Üyelik birkaç saniye sürüyor.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <Button asChild>
              <Link href={`/kayit?donus=${encodeURIComponent(pathname ?? '/')}`}>
                Ücretsiz Üye Ol
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/login?donus=${encodeURIComponent(pathname ?? '/')}`}>
                Zaten üyeyim, giriş yap
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobilde sabit iletişim şeridi. Alt menünün üzerine geliyor:
          ilan sayfasındayken kullanıcının aradığı eylem menü değil,
          satıcıya ulaşmak. */}
      {!demoMu && (
        <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center gap-2 border-t bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
          <Button className="h-11 flex-1 gap-2" asChild>
            <Link href={`/mesajlarim?ilan=${listingId}`}>
              <Mail className="h-4 w-4" />
              Mesaj Gönder
            </Link>
          </Button>

          {telefonVar && (
            <button
              type="button"
              onClick={revealPhone}
              disabled={aliniyor}
              aria-label="Telefonu göster"
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition-colors disabled:opacity-60',
                phone ? 'flex-1 px-3' : 'w-11 shrink-0'
              )}
            >
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              {phone && <span className="truncate">{formatTrPhone(phone)}</span>}
            </button>
          )}

          {whatsappVar && (
            <button
              type="button"
              onClick={whatsappAc}
              disabled={aliniyor}
              aria-label="WhatsApp ile yaz"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#25d366] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

/** İstatistik şeridinin tek gözü; bağlantı verilirse tıklanabilir. */
function Sayi({
  deger,
  etiket,
  href,
}: {
  deger: number | string;
  etiket: string;
  href?: string;
}) {
  const icerik = (
    <>
      <dd className="text-base font-bold leading-tight">{deger}</dd>
      <dt className="mt-0.5 text-[11px] text-muted-foreground">{etiket}</dt>
    </>
  );
  if (!href) return <div className="px-2 py-2.5">{icerik}</div>;
  return (
    <Link href={href} className="px-2 py-2.5 transition-colors hover:bg-secondary/70">
      {icerik}
    </Link>
  );
}

/**
 * Kullanıcı adı varsa profiline bağlar, yoksa düz kutu olarak çizer.
 *
 * Kullanıcı adı olmayan (henüz oluşmamış) hesaplarda tıklanabilir bir
 * bağlantı göstermek 404'e götürürdü.
 */
function ProfilBagi({
  username,
  className,
  children,
}: {
  username: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  if (!username) return <div className={className}>{children}</div>;
  return (
    <Link href={`/satici/${username}`} className={cn(className, 'group')}>
      {children}
    </Link>
  );
}
