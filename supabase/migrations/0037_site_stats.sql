-- ============================================================================
-- 0037_site_stats.sql — Ana sayfa sayaçları ve çevrimiçi kullanıcı
--
-- Ana sayfada "ırk ve tür sayısı" gibi ziyaretçiye bir şey anlatmayan
-- sayılar vardı. Bir pazaryerinde anlamlı olan üç şey: kaç ilan yayında,
-- kaç kişi üye, şu an kaç kişi sitede. İlk ikisi büyüklüğü, üçüncüsü
-- canlılığı gösteriyor.
--
-- İKİ ENGEL VARDI
-- 1) profiles üzerindeki RLS yalnızca kişinin kendi satırını gösteriyor;
--    ziyaretçi kullanıcı sayısını sayamıyordu.
-- 2) last_seen_at kolonu en baştan beri duruyordu ama hiçbir yerde
--    güncellenmiyordu; "çevrimiçi" bilgisi üretilemiyordu.
--
-- Sayımlar SECURITY DEFINER bir fonksiyonla veriliyor: tek tek satırlar
-- değil yalnızca toplamlar dışarı çıkıyor, yani RLS'in koruduğu hiçbir
-- bilgi sızmıyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Varlık kaydı
--
-- Kullanıcının kendi satırını güncellemesi profiles_guard'a takılmıyor
-- (last_seen_at korumalı kolon değil) ama yine de RPC üzerinden: istemcinin
-- profil tablosuna yazma alışkanlığı edinmesi istenmiyor ve burada
-- gereksiz yazmayı da engelliyoruz.
-- ---------------------------------------------------------------------------
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return;
  end if;

  -- Dakikada birden fazla yazmanın anlamı yok: "çevrimiçi" penceresi
  -- 15 dakika ve her sayfa geçişinde satır güncellemek boşuna yazma yükü.
  update public.profiles
     set last_seen_at = now()
   where id = v_user
     and (last_seen_at is null or last_seen_at < now() - interval '1 minute');
end;
$$;

grant execute on function public.touch_last_seen() to authenticated;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen_at desc)
  where last_seen_at is not null;

-- ---------------------------------------------------------------------------
-- Ana sayfa sayaçları
-- ---------------------------------------------------------------------------
create or replace function public.site_stats()
returns table (
  listings_active bigint,
  members         bigint,
  online_now      bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    (select count(*) from public.listings where status = 'yayinda'),
    (select count(*) from public.profiles where is_banned = false),
    -- Son 15 dakikada görülen kullanıcılar. Gerçek bir websocket varlık
    -- takibi değil; sayfa açan kullanıcı işaretleniyor. Abartılı bir sayı
    -- üretmiyor, gerçekten ne varsa onu gösteriyor.
    (select count(*) from public.profiles
      where is_banned = false
        and last_seen_at > now() - interval '15 minutes');
$$;

grant execute on function public.site_stats() to anon, authenticated;
