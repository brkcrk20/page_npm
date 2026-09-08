-- 0065 — İlan kartında "onaylı üye" rozeti için sahibin doğrulama durumu.
--
-- Kartta ilan sahibinin doğrulanmış olup olmadığını göstermek istiyoruz:
-- kullanıcı hangi ilana tıklayacağına ilanı açmadan karar veriyor ve
-- kimin verdiği bu kararın girdilerinden biri. Karşılaştırdığımız rakip
-- sitede bu bilgi köşe şeridi olarak veriliyor.
--
-- Neden gömülü sorgu değil: profiles üzerindeki RLS anonim ziyaretçiye
-- başkasının satırını göstermiyor, bu yüzden listings → profiles gömme
-- her zaman null dönüyordu. Sütun listings üzerinde tutuluyor —
-- owner_account_type için zaten kullanılan yaklaşımın aynısı.
--
-- İki yönlü senkron: ilan yazılırken sahibinden okunuyor, profil
-- doğrulandığında o kişinin ilanları güncelleniyor. Tek yönlü olsaydı
-- sonradan doğrulanan üyenin eski ilanları rozetsiz kalırdı.

begin;

alter table public.listings
  add column if not exists owner_is_verified boolean not null default false;

comment on column public.listings.owner_is_verified is
  'İlan sahibinin doğrulama durumu. profiles.is_verified''ten tetikleyiciyle kopyalanır.';

-- İlan yazılırken sahibinden oku.
create or replace function public.listings_set_owner_verified()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  select coalesce(p.is_verified, false) into new.owner_is_verified
    from public.profiles p
   where p.id = coalesce(new.owner_id, old.owner_id);

  new.owner_is_verified := coalesce(new.owner_is_verified, false);
  return new;
end;
$$;

drop trigger if exists listings_set_owner_verified_trigger on public.listings;
create trigger listings_set_owner_verified_trigger
  before insert or update of owner_id on public.listings
  for each row execute function public.listings_set_owner_verified();

-- Profil doğrulandığında (ya da doğrulaması kaldırıldığında) ilanları güncelle.
create or replace function public.profiles_sync_listing_verified()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.is_verified is distinct from old.is_verified then
    update public.listings
       set owner_is_verified = coalesce(new.is_verified, false)
     where owner_id = new.id
       and owner_is_verified is distinct from coalesce(new.is_verified, false);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_listing_verified_trigger on public.profiles;
create trigger profiles_sync_listing_verified_trigger
  after update of is_verified on public.profiles
  for each row execute function public.profiles_sync_listing_verified();

-- Mevcut kayıtlar için tek seferlik doldurma.
update public.listings l
   set owner_is_verified = coalesce(p.is_verified, false)
  from public.profiles p
 where p.id = l.owner_id
   and l.owner_is_verified is distinct from coalesce(p.is_verified, false);

commit;
