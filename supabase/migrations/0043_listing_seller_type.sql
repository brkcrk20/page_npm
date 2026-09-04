-- ============================================================================
-- 0043 — "Kimden" filtresi: sahibinden mi, mağazadan mı
--
-- Alıcının en çok sorduğu ayrımlardan biri bu ve sitede karşılığı yoktu.
-- Sahiplendirme arayan kişi kurumsal ilanları elemek, toplu alım yapan kişi
-- tam tersini yapmak istiyor.
--
-- NEDEN KOLON, NEDEN JOIN DEĞİL
-- Bilgi profiles.account_type'ta duruyor; her listelemede gömülü join ile
-- süzmek hem her sorguya bir tabloya daha bağlanma maliyeti bindiriyor hem
-- de PostgREST'te `!inner` unutulduğunda filtrenin sessizce hiçbir şey
-- yapmamasına yol açıyor (bu tuzağa daha önce düşülmüş, CARD_COLUMNS
-- yorumunda yazıyor). Telefonda olduğu gibi profilden ilana taşıyoruz.
-- ============================================================================

alter table public.listings
  add column if not exists owner_account_type public.account_type not null default 'bireysel';

comment on column public.listings.owner_account_type is
  'İlan sahibinin hesap türü. profiles.account_type''tan tetikleyiciyle taşınıyor; istemci yazamaz.';

create index if not exists listings_owner_account_type_idx
  on public.listings (owner_account_type)
  where status = 'yayinda';

-- ---------------------------------------------------------------------------
-- İlan yazılırken sahibin hesap türünü al
-- ---------------------------------------------------------------------------
create or replace function public.listings_set_owner_account_type()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select p.account_type into new.owner_account_type
    from public.profiles p
   where p.id = coalesce(new.owner_id, old.owner_id);

  new.owner_account_type := coalesce(new.owner_account_type, 'bireysel');
  return new;
end;
$$;

drop trigger if exists listings_set_owner_account_type_trigger on public.listings;
create trigger listings_set_owner_account_type_trigger
  before insert or update of owner_id on public.listings
  for each row execute function public.listings_set_owner_account_type();

-- ---------------------------------------------------------------------------
-- Hesap türü değişince mevcut ilanlara yay
--
-- Bireysel hesabını kurumsala çeviren kullanıcının eski ilanları da mağaza
-- ilanı sayılmalı; yoksa aynı satıcının ilanları iki farklı yerde görünür.
-- ---------------------------------------------------------------------------
create or replace function public.propagate_account_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_type is distinct from old.account_type then
    perform set_config('app.counter_sync', 'on', true);

    update public.listings
       set owner_account_type = new.account_type
     where owner_id = new.id
       and owner_account_type is distinct from new.account_type;

    perform set_config('app.counter_sync', 'off', true);
  end if;

  return null;
end;
$$;

drop trigger if exists propagate_account_type_trigger on public.profiles;
create trigger propagate_account_type_trigger
  after update of account_type on public.profiles
  for each row execute function public.propagate_account_type();

-- ---------------------------------------------------------------------------
-- Muhafız: istemci bu kolonu yazamasın
-- ---------------------------------------------------------------------------
do $$
declare
  src text;
begin
  select pg_get_functiondef(p.oid) into src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'listings_guard';

  if src is null then
    raise exception 'listings_guard bulunamadı';
  end if;

  if position('owner_account_type' in src) > 0 then
    raise notice 'listings_guard zaten owner_account_type''ı koruyor';
    return;
  end if;

  src := replace(
    src,
    '  new.contact_phone := v_phone;',
    '  new.contact_phone := v_phone;' || E'\n' ||
    '  -- Hesap türü profilden geliyor; istemcinin yazdığı değer yok sayılıyor.' || E'\n' ||
    '  new.owner_account_type := old.owner_account_type;'
  );

  if position('owner_account_type' in src) = 0 then
    raise exception 'listings_guard içinde beklenen satır bulunamadı; elle bakılmalı';
  end if;

  execute src;
end;
$$;

-- Mevcut ilanları doldur.
update public.listings l
   set owner_account_type = p.account_type
  from public.profiles p
 where p.id = l.owner_id
   and l.owner_account_type is distinct from p.account_type;
