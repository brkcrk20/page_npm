import { listingHref } from '@/lib/listing-url';
import Link from 'next/link';
import { BadgeCheck, Images, MapPin, Store } from 'lucide-react';

import { KartBagi } from '@/components/listings/KartBagi';

import { Badge } from '@/components/ui/badge';
import type { ListingCard } from '@/lib/queries/listings';
import { listingPhotoUrl } from '@/lib/supabase/storage';

/** Ay cinsinden yaşı okunur metne çevirir: 2 -> "2 Aylık", 30 -> "2,5 Yaşında". */
function formatAge(months: number | null): string | null {
  if (months === null || months === undefined) return null;
  if (months < 12) return `${months} Aylık`;
  const years = months / 12;
  const text = Number.isInteger(years) ? `${years}` : years.toFixed(1).replace('.', ',');
  return `${text} Yaşında`;
}

/** Kart üzerindeki tür rozeti. Kayıp ilanı listede ilk bakışta ayırt edilmeli. */
const KIND_BADGE: Record<string, { label: string; className: string }> = {
  sahiplendirme: { label: 'Sahiplendirme', className: 'bg-emerald-600 hover:bg-emerald-600' },
  kayip: { label: 'KAYIP', className: 'bg-red-600 hover:bg-red-600' },
  bulundu: { label: 'BULUNDU', className: 'bg-blue-600 hover:bg-blue-600' },
};

/**
 * "Bugün", "3 gün önce" gibi tazelik bilgisi.
 *
 * İlan tarihinin kendisi ("07.09.2026") kartta yer kaplıyor ama hiçbir
 * karar değiştirmiyor; kullanıcının bilmek istediği şey ilanın taze olup
 * olmadığı. Bir aydan eski ilanlarda gün sayısı da anlamını yitirdiği
 * için tarih gösterilmiyor.
 */
function tazelik(tarih: string | null): string | null {
  if (!tarih) return null;
  const gun = Math.floor((Date.now() - new Date(tarih).getTime()) / 86_400_000);
  if (gun < 0) return null;
  if (gun === 0) return 'Bugün';
  if (gun === 1) return 'Dün';
  if (gun < 30) return `${gun} gün önce`;
  return null;
}

function formatPrice(listing: ListingCard): string {
  // Kayıp/bulundu ilanında fiyat diye bir kavram yok; o satırda tarih daha
  // işe yarar bilgi.
  if (listing.kind === 'kayip' || listing.kind === 'bulundu') {
    if (!listing.event_date) return listing.kind === 'kayip' ? 'Kayıp' : 'Bulundu';
    const tarih = new Date(listing.event_date).toLocaleDateString('tr-TR');
    return listing.kind === 'kayip' ? `${tarih} tarihinde kayboldu` : `${tarih} tarihinde bulundu`;
  }
  if (listing.kind === 'sahiplendirme') return 'Ücretsiz Sahiplendirme';
  if (listing.price === null || Number(listing.price) === 0) return 'Fiyat Belirtilmemiş';

  const formatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: listing.currency || 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  return listing.is_negotiable ? `${formatted} (Pazarlıklı)` : formatted;
}

/**
 * İlan kartı.
 *
 * İKİ AYRI DÜZEN
 * Mobilde YATAY SATIR: solda kare küçük görsel, sağda bilgiler. İki
 * sütunlu ızgara telefonda hem başlıkları iki kelimeye sıkıştırıyor hem de
 * ekranda dört ilan gösteriyordu; satır düzeninde aynı yükseklikte altı
 * ilan ve tam okunabilir başlık var.
 *
 * Masaüstünde DİKEY KART: görsel 4:5. Hayvan fotoğrafları çoğunlukla dikey
 * çekiliyor; 4:3 kırpma kafayı ya da kuyruğu kesiyordu. Konum ve tür
 * bilgisi görselin üstünde, degrade şeridin içinde — bilgi ile fotoğraf
 * arasındaki kopukluğu kaldırıyor.
 */
function PetListingCard({
  listing,
  oncelikli = false,
}: {
  listing: ListingCard;
  oncelikli?: boolean;
}) {
  const cover = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
  /**
   * Kartta küçük kopya kullanılıyor.
   *
   * Görseller barındırma sağlayıcısının iyileştiricisinden çıkarıldıktan
   * sonra (kota doldu, bütün fotoğraflar kırılmıştı) kart tam boy dosyayı
   * indiriyordu: 128 piksellik bir alan için ~90 KB. Küçük kopya yükleme
   * anında üretiliyor.
   *
   * Kopya yoksa tam boy dosyaya düşülüyor — eski kayıtlarda ve yüklemesi
   * yarıda kalan fotoğraflarda kart kırık görünmesin.
   */
  const imageUrl = cover ? listingPhotoUrl(cover.thumb_path ?? cover.storage_path) : null;
  /** Telefonlara giden küçük kopya; eski kayıtlarda yok. */
  const kucukUrl = cover?.thumb_sm_path ? listingPhotoUrl(cover.thumb_sm_path) : null;
  const age = formatAge(listing.age_months);
  const location = [listing.cities?.name, listing.districts?.name].filter(Boolean).join(' / ');
  const rozet = KIND_BADGE[listing.kind];
  const fotografSayisi = listing.listing_photos?.length ?? 0;
  const dogrulanmis = Boolean(listing.owner_is_verified);
  const kurumsal = listing.owner_account_type === 'kurumsal';
  const zaman = tazelik(listing.published_at);

  return (
    <KartBagi
      href={listingHref(listing)}
      className="group flex overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50 md:block"
    >
      {/* Görsel — mobilde solda kare, masaüstünde üstte dikey */}
      <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden bg-muted sm:w-32 md:aspect-[4/5] md:w-full">
        {imageUrl ? (
          <>
            {/*
              Öncelikli kartta ÖN YÜKLEME.

              next/image bunu kendisi basıyordu; düz <img>'e geçince o iş de
              bize kaldı. React bu etiketleri <head>'e taşıyor. Media
              sorgusu şart: telefonun büyük kopyayı boşuna indirmemesi için
              iki ayrı satır gerekiyor.
            */}
            {oncelikli && (
              <>
                {kucukUrl && (
                  <link
                    rel="preload"
                    as="image"
                    href={kucukUrl}
                    media="(max-width: 767px)"
                    fetchPriority="high"
                  />
                )}
                <link
                  rel="preload"
                  as="image"
                  href={imageUrl}
                  media={kucukUrl ? '(min-width: 768px)' : undefined}
                  fetchPriority="high"
                />
              </>
            )}

            {/*
              MOBİLDE KÜÇÜK KOPYA — next/image DEĞİL, düz <picture>.

              Görsel iyileştirici kapalı (bkz. next.config: images.unoptimized),
              o yüzden next/image tek bir adres basıyor ve srcset üretmiyor.
              Kart görseli 400 piksel; telefonda ~134 piksele çiziliyor ve
              yavaş 4G'de inmesi 1,4 saniye sürüyordu — LCP'nin büyük kısmı
              buradan geliyordu.

              srcset yerine media sorgusu kullanılıyor: `sizes` görselin
              KUTUSUNU tarif ediyor (112 piksel), oysa fotoğraflar dikey
              olduğu için object-contain ile çizilen genişlik bunun yarısı.
              srcset ile tarayıcı 112×2 = 224 piksel hesaplayıp yine büyük
              dosyayı seçiyordu. Media sorgusu kararı bize bırakıyor.
            */}
            {/* Bulanık zemin: fotoğrafın tamamı gösterildiğinde kenarda
                kalan boşluğu fotoğrafın kendi rengiyle dolduruyor. Ana
                fotoğrafla AYNI adresleri kullanıyor, bu yüzden tek istek
                gidiyor. */}
            <picture>
              {kucukUrl && <source media="(max-width: 767px)" srcSet={kucukUrl} />}
              <img
                src={imageUrl}
                alt=""
                aria-hidden
                decoding="async"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                {...(oncelikli
                  ? { fetchPriority: 'high' as const }
                  : { loading: 'lazy' as const })}
              />
            </picture>

            {/* contain: hayvan fotoğrafları dikey çekiliyor (720×1600 gibi),
                4:5 kutuya cover ile basılınca kafa ya da kuyruk kesiliyordu. */}
            <picture>
              {kucukUrl && <source media="(max-width: 767px)" srcSet={kucukUrl} />}
              <img
                src={imageUrl}
                alt={listing.title}
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain"
                {...(oncelikli
                  ? { fetchPriority: 'high' as const }
                  : { loading: 'lazy' as const })}
              />
            </picture>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
            Fotoğraf yok
          </div>
        )}

        {/* Tür rozeti yalnızca masaüstünde görselin üstünde.
            Mobilde küçük görsel 96 piksel genişliğinde ve "Sahiplendirme"
            oraya sığmıyordu: rozet "Sal" diye kesiliyordu. Mobilde aynı
            bilgi metin sütununun başında, tam hâliyle veriliyor. */}
        {rozet && (
          <Badge className={`absolute left-2 top-2 hidden px-2 py-0.5 text-xs md:inline-flex ${rozet.className}`}>
            {rozet.label}
          </Badge>
        )}

        {/* Örnek ilan işareti. Vitrin doldurmak için eklenen demo ilanlar
            gerçek sanılıp mesaj alıyordu; etiket bunu baştan söylüyor.
            Yönetim panelinden kapatılabiliyor. */}
        {listing.is_demo && (
          <Badge
            variant="secondary"
            className="absolute left-1.5 top-1.5 bg-slate-900/75 px-1.5 py-0 text-[10px] font-medium text-white md:left-auto md:right-2 md:top-2 md:px-2 md:py-0.5"
          >
            Örnek
          </Badge>
        )}

        {/* Fotoğraf sayısı. Birden çok fotoğrafı olan ilan daha güvenilir
            görünüyor ve kullanıcı hangisine tıklayacağını buna göre de
            seçiyor; tek fotoğraflı ilanda sayı göstermenin anlamı yok. */}
        {fotografSayisi > 1 && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white md:bottom-2 md:right-2">
            <Images className="h-3 w-3" />
            {fotografSayisi}
          </span>
        )}

        {/* Konum yalnızca masaüstünde görselin üstünde; mobilde satırın
            içinde zaten yer var ve degrade küçük görselde okunmuyor. */}
        {location && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 md:block">
            <p className="flex items-center gap-1 text-xs font-medium text-white">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3 md:justify-start md:gap-1">
        {/* Mobilde tür rozeti burada: görselin üstünde kesiliyordu. */}
        {rozet && (
          <span
            className={`mb-0.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold md:hidden ${rozet.className}`}
          >
            {rozet.label}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {listing.title}
        </h3>

        {/* Cins öne çıkıyor, yaş yanında soluk kalıyor. Önceki hâlde ikisi
            aynı gri tonda yan yanaydı ve göz hangisinin ne olduğunu
            ayırmadan geçiyordu. */}
        {(listing.breeds?.name || age) && (
          <p className="truncate text-xs">
            {listing.breeds?.name && (
              <span className="font-medium text-foreground/80">{listing.breeds.name}</span>
            )}
            {listing.breeds?.name && age && <span className="text-muted-foreground"> · </span>}
            {age && <span className="text-muted-foreground">{age}</span>}
          </p>
        )}

        {location && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground md:hidden">
            <MapPin className="h-3 w-3 shrink-0" />
            {location}
          </p>
        )}

        <p className="pt-0.5 text-sm font-bold text-primary md:pt-1">{formatPrice(listing)}</p>

        {/* Güven ve tazelik satırı.
            Kullanıcı hangi ilana tıklayacağına, ilanı açmadan karar
            veriyor: kimin verdiği ve ne kadar taze olduğu bu kararın iki
            girdisi. İkisi de yoksa satır hiç çizilmiyor. */}
        {(dogrulanmis || kurumsal || zaman) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px]">
            {dogrulanmis && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                Onaylı üye
              </span>
            )}
            {!dogrulanmis && kurumsal && (
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <Store className="h-3.5 w-3.5" />
                Kurumsal
              </span>
            )}
            {zaman && <span className="text-muted-foreground">{zaman}</span>}
          </div>
        )}
      </div>
    </KartBagi>
  );
}

export function ListingGrid({
  listings,
  emptyMessage = 'Bu kriterlere uyan ilan bulunamadı.',
  oncelikliSayisi = 0,
}: {
  listings: ListingCard[];
  emptyMessage?: string;
  /**
   * Baştan kaç kartın fotoğrafı öncelikli yüklensin.
   *
   * Sayfanın en büyük görseli (LCP) genellikle ilk kartın fotoğrafı oluyor.
   * Bütün kart fotoğrafları tembel yükleniyordu; tarayıcı bunu ancak
   * düzeni kurduktan sonra keşfediyor ve mobil bağlantıda LCP saniyelerce
   * gecikiyordu (PageSpeed: "LCP istek keşfi").
   *
   * Yalnızca ilk ekrandaki karta verilmeli: hepsine verilirse tarayıcı
   * yirmi görseli aynı anda çekmeye kalkıp asıl önemli olanı yavaşlatır.
   */
  oncelikliSayisi?: number;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white/50 py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Mobilde tek sütun (yatay satırlar), masaüstünde ızgara.
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
      {listings.map((listing, sira) => (
        <PetListingCard
          key={listing.id}
          listing={listing}
          oncelikli={sira < oncelikliSayisi}
        />
      ))}
    </div>
  );
}
