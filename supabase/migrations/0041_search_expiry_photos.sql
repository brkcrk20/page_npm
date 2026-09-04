-- ============================================================================
-- 0041 — Arama cinsi görsün, süresi dolan ilan kapansın, fotoğraf ölçülsün
--
-- 1) ARAMA CİNSİ GÖRMÜYORDU
--    search_vector üretilmiş bir kolondu ve üretilmiş kolon başka tabloya
--    bakamaz. Bu yüzden yalnızca serbest metin cins (breed_other) aramaya
--    giriyor, katalogdan seçilen cins girmiyordu: "Toy Poodle" araması,
--    cinsini katalogdan seçmiş bir Toy Poodle ilanını bulamıyordu. Sitedeki
--    ilanların neredeyse tamamı katalogdan seçiyor — yani arama, aramanın
--    en çok kullanıldığı durumda çalışmıyordu.
--
--    Çözüm: search_vector normal bir kolona dönüyor ve trigger dolduruyor.
--
-- 2) SÜRESİ DOLAN İLAN KAPANMIYORDU
--    expires_at ilk günden beri yazılıyor, hatta indeksi bile var — ama onu
--    okuyan hiçbir şey yoktu. İlan sonsuza kadar yayında kalıyordu.
--
-- 3) FOTOĞRAF ÖLÇÜLERİ YOKTU
--    Ölçü hazırlama adımında zaten hesaplanıyor ama kaydedilmiyordu. Kart ve
--    galeri sabit orana oturduğu için sayfada zıplama yaratmıyordu; asıl
--    eksik paylaşım kartıydı: og:image ölçüsüz verildiğinde WhatsApp ve
--    Facebook görseli kırpıyor ya da hiç göstermiyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Arama
-- ---------------------------------------------------------------------------
drop index if exists listings_search_idx;
alter table public.listings drop column if exists search_vector;
alter table public.listings add column search_vector tsvector;

create or replace function public.listings_build_search()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_breed text;
begin
  select b.name into v_breed from public.breeds b where b.id = new.breed_id;

  new.search_vector :=
      setweight(to_tsvector('turkish', coalesce(new.title, '')),        'A')
   || setweight(to_tsvector('turkish', coalesce(v_breed, '')),          'A')
   || setweight(to_tsvector('turkish', coalesce(new.breed_other, '')),  'B')
   || setweight(to_tsvector('turkish', coalesce(new.description, '')),  'C');

  return new;
end;
$$;

drop trigger if exists listings_build_search_trigger on public.listings;
create trigger listings_build_search_trigger
  before insert or update of title, description, breed_id, breed_other
  on public.listings
  for each row execute function public.listings_build_search();

create index listings_search_idx on public.listings using gin (search_vector);

-- Mevcut ilanlar için doldur.
update public.listings set title = title;

-- Cins adı yönetim panelinden değişebiliyor; o ilanların araması da
-- güncellenmeli, yoksa arama eski adla çalışmaya devam eder.
create or replace function public.breeds_refresh_listing_search()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.listings set title = title where breed_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists breeds_refresh_listing_search_trigger on public.breeds;
create trigger breeds_refresh_listing_search_trigger
  after update on public.breeds
  for each row execute function public.breeds_refresh_listing_search();

-- ---------------------------------------------------------------------------
-- 2) Süre dolumu
--
-- İki katman: fonksiyon durumu gerçekten değiştiriyor (ilan sahibi kendi
-- listesinde "süresi doldu" görsün), sorgular da tarihi ayrıca süzüyor.
-- Tek başına zamanlanmış işe güvenmek, iş çalışmadığı gün sitenin bayat
-- ilan göstermesi demekti.
-- ---------------------------------------------------------------------------
create or replace function public.expire_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sayi integer;
begin
  -- Muhafız status'ü koruyor; sayaç bayrağı bu yazmayı geçerli kılıyor.
  perform set_config('app.counter_sync', 'on', true);

  update public.listings
     set status = 'suresi_doldu'
   where status = 'yayinda'
     and expires_at is not null
     and expires_at < now();

  get diagnostics v_sayi = row_count;

  perform set_config('app.counter_sync', 'off', true);
  return v_sayi;
end;
$$;

comment on function public.expire_listings() is
  'Süresi dolan yayındaki ilanları kapatır. Zamanlanmış iş yoksa da sorgular expires_at süzüyor.';

revoke all on function public.expire_listings() from public;
grant execute on function public.expire_listings() to authenticated;

-- pg_cron kuruluysa günde bir çalıştır. Kurulu değilse göç yine de geçsin:
-- sorgu tarafındaki süzme zaten doğru sonucu veriyor.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('ilan-suresi-dolumu', '17 3 * * *', 'select public.expire_listings()');
    raise notice 'pg_cron işi kuruldu';
  else
    raise notice 'pg_cron yok; süre dolumu sorgu tarafındaki süzmeyle sağlanıyor';
  end if;
exception when others then
  raise notice 'pg_cron işi kurulamadı: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Fotoğraf ölçüleri
-- ---------------------------------------------------------------------------
alter table public.listing_photos
  add column if not exists width  integer,
  add column if not exists height integer;

comment on column public.listing_photos.width is
  'Yüklenen görselin genişliği. Paylaşım kartındaki og:image ölçüsü için.';
