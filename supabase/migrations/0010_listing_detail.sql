-- ============================================================================
-- 0010_listing_detail.sql — İlan detay sayfasının ihtiyaç duyduğu alanlar
--
-- Detay sayfasında gösterilen üç sayaç (görüntülenme, WhatsApp isteği, telefon
-- araması) ayrı ayrı tutuluyor. Tek bir "iletişim" sayacı bunları ayırt
-- edemezdi; satıcı için "kaç kişi aradı" ile "kaç kişi WhatsApp yazdı" farklı
-- bilgiler.
--
-- Sayaçlar yalnızca SECURITY DEFINER RPC'ler üzerinden artıyor. RLS kullanıcıya
-- bu kolonları yazdırmıyor (bkz. listings_guard), yoksa herkes kendi ilanının
-- sayaçlarını şişirebilirdi.
-- ============================================================================

alter table public.listings
  add column if not exists whatsapp_count integer not null default 0,
  add column if not exists phone_count    integer not null default 0;

-- ---------------------------------------------------------------------------
-- Sayaç artırma RPC'leri
--
-- Görüntülenme sayacı zaten 0004'te tanımlı; buradakiler onun kardeşleri.
-- Hepsi yalnızca YAYINDAKİ ilanları artırıyor: taslak bir ilanın sayacını
-- artırmanın anlamı yok ve bu, sayaçları şişirmenin bir yolu olurdu.
-- ---------------------------------------------------------------------------
create or replace function public.increment_listing_whatsapp(p_listing_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set whatsapp_count = whatsapp_count + 1
   where id = p_listing_id and status = 'yayinda';
$$;

create or replace function public.increment_listing_phone(p_listing_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set phone_count = phone_count + 1
   where id = p_listing_id and status = 'yayinda';
$$;

grant execute on function public.increment_listing_whatsapp(bigint) to anon, authenticated;
grant execute on function public.increment_listing_phone(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Favoriler
--
-- Ayrı tablo, kullanıcı profilinde dizi değil: hem "bu ilanı kaç kişi
-- favoriledi" sorgusu hem de "bu kullanıcının favorileri" sorgusu indeksle
-- çalışsın. Dizi kolonunda ikincisi tablo taraması olurdu.
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  listing_id bigint not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (user_id, listing_id)
);

create index if not exists favorites_listing_idx on public.favorites (listing_id);
create index if not exists favorites_user_idx    on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

-- Kullanıcı yalnızca kendi favorilerini görür ve yönetir.
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, delete on public.favorites to authenticated;

-- İlanın favori sayacını güncel tut.
create or replace function public.sync_listing_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set favorite_count = favorite_count + 1 where id = new.listing_id;
  elsif tg_op = 'DELETE' then
    update public.listings set favorite_count = greatest(favorite_count - 1, 0) where id = old.listing_id;
  end if;
  return null;
end;
$$;

drop trigger if exists favorites_sync_count on public.favorites;
create trigger favorites_sync_count
  after insert or delete on public.favorites
  for each row execute function public.sync_listing_favorite_count();

-- ---------------------------------------------------------------------------
-- Satıcı istatistikleri
--
-- Detay sayfasındaki "12 Aktif İlan / 25 Toplam İlan / 3 Yıl Üyelik" kutuları.
-- public_profiles view'ı hassas alanları gizlediği için sayımları ayrı bir
-- view'da topluyoruz; ikisi birlikte kullanılıyor.
-- ---------------------------------------------------------------------------
create or replace view public.seller_stats as
  select
    p.id                                                   as user_id,
    p.created_at                                           as member_since,
    count(l.id)                                            as total_listings,
    count(l.id) filter (where l.status = 'yayinda')        as active_listings
  from public.profiles p
  left join public.listings l on l.owner_id = p.id
  where p.is_banned = false
  group by p.id, p.created_at;

grant select on public.seller_stats to anon, authenticated;
