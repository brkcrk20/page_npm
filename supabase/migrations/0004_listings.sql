-- ============================================================================
-- 0004_listings.sql — İlanlar (sitenin ana içeriği)
--
-- Tek tablo + `kind` ayırıcısı: satılık, sahiplendirme, kayıp ve eş arayan
-- ilanları aynı tabloda durur. Arama, fotoğraf, moderasyon, favori ve öne
-- çıkarma mantığı hepsinde ortak olduğu için ayrı tablolara bölmek dört kat
-- tekrar demekti. Türe özgü alanlar `details` jsonb içinde.
--
-- id = ilan numarası. URL /<baslik-slug>-<id> biçiminde ve çözümleme yalnızca
-- id üzerinden yapılır; başlık değişince slug değişse bile link kırılmaz.
-- ============================================================================

create type public.listing_kind as enum (
  'satilik',        -- ücretli satış
  'sahiplendirme',  -- ücretsiz sahiplendirme
  'kayip',          -- kayıp hayvan ilanı
  'bulundu',        -- bulunan hayvan ilanı
  'es_arayan'       -- çiftleştirme
);

create type public.listing_status as enum (
  'taslak',
  'onay_bekliyor',
  'yayinda',
  'reddedildi',
  'pasif',          -- kullanıcı yayından kaldırdı
  'suresi_doldu',
  'satildi'
);

create type public.pet_gender as enum ('erkek', 'disi', 'belirtilmemis');
create type public.pet_size   as enum ('mini', 'kucuk', 'orta', 'buyuk', 'dev');

create table public.listings (
  -- İlan numarası; URL'de görünen sayı.
  id            bigint generated always as identity primary key,

  owner_id      uuid not null references public.profiles(id) on delete cascade,
  kind          public.listing_kind   not null default 'satilik',
  status        public.listing_status not null default 'onay_bekliyor',

  category_id   smallint not null references public.categories(id),
  breed_id      integer  references public.breeds(id),
  -- Listede olmayan / karışık cinsler için serbest metin
  breed_other   text,

  title         text not null check (char_length(btrim(title)) between 5 and 120),
  slug          text not null,
  description   text not null check (char_length(btrim(description)) between 20 and 5000),

  -- --- Fiyat ---
  price         numeric(12,2) check (price >= 0),
  currency      char(3) not null default 'TRY',
  is_negotiable boolean not null default false,
  is_reserved   boolean not null default false,

  -- --- Hayvan bilgileri (filtrelenebilir alanlar kolon olarak) ---
  age_months    integer check (age_months between 0 and 360),
  gender        public.pet_gender not null default 'belirtilmemis',
  size          public.pet_size,
  color         text,
  quantity      smallint not null default 1 check (quantity > 0),

  -- --- Sağlık ---
  is_vaccinated        boolean not null default false,
  is_dewormed_internal boolean not null default false,
  is_dewormed_external boolean not null default false,
  is_neutered          boolean not null default false,
  has_pedigree         boolean not null default false,
  has_microchip        boolean not null default false,
  has_health_report    boolean not null default false,

  -- --- Satış / lojistik ---
  accepts_credit_card  boolean not null default false,
  ships_intercity      boolean not null default false,
  has_warranty         boolean not null default false,

  -- --- Konum ---
  city_id       smallint not null references public.cities(id),
  district_id   integer  references public.districts(id),

  -- --- İletişim ---
  contact_phone   text,
  show_phone      boolean not null default true,
  allow_whatsapp  boolean not null default true,

  -- --- Türe özgü ek alanlar ---
  -- kayip/bulundu: { "kaybolma_tarihi": "...", "son_gorulme_yeri": "...", "odul": 0 }
  -- es_arayan:     { "ciftlesme_ucreti": 0, "yavru_takasi": true }
  details       jsonb not null default '{}'::jsonb,

  -- --- Sayaçlar ---
  -- İstemci bunlara yazamaz (bkz. RLS + listing_update_guard trigger'ı);
  -- yalnızca SECURITY DEFINER RPC'ler üzerinden artar.
  view_count      integer not null default 0,
  favorite_count  integer not null default 0,
  contact_count   integer not null default 0,

  -- --- Moderasyon ---
  rejection_reason text,
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles(id),

  -- --- Zaman ---
  published_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- --- Tam metin arama (Türkçe stemming) ---
  search_vector tsvector generated always as (
    setweight(to_tsvector('turkish', coalesce(title, '')),       'A') ||
    setweight(to_tsvector('turkish', coalesce(breed_other, '')), 'B') ||
    setweight(to_tsvector('turkish', coalesce(description, '')), 'C')
  ) stored,

  -- Satılık ilanın fiyatı olmak zorunda; sahiplendirmede fiyat olamaz.
  constraint listings_price_matches_kind check (
    (kind = 'satilik'       and price is not null and price > 0) or
    (kind = 'sahiplendirme' and (price is null or price = 0))    or
    (kind in ('kayip', 'bulundu', 'es_arayan'))
  ),

  -- Cins ya katalogdan seçilir ya serbest yazılır; ikisi birden boş olamaz.
  constraint listings_breed_present check (
    breed_id is not null or nullif(btrim(coalesce(breed_other, '')), '') is not null
  )
);

-- ---------------------------------------------------------------------------
-- İndeksler
--
-- Neredeyse tüm okuma trafiği "yayında olan ilanlar" üzerinde olduğu için
-- gezinme indeksleri kısmi (partial) — indeks boyutu küçük, tarama hızlı.
-- ---------------------------------------------------------------------------

-- Kategori sayfası: /kopek-ilanlari
create index listings_category_browse_idx
  on public.listings (category_id, published_at desc)
  where status = 'yayinda';

-- Cins sayfası: /kopek-ilanlari/toy-poodle
create index listings_breed_browse_idx
  on public.listings (breed_id, published_at desc)
  where status = 'yayinda';

-- Şehir sayfası: /kopek-ilanlari/istanbul
create index listings_city_browse_idx
  on public.listings (city_id, category_id, published_at desc)
  where status = 'yayinda';

-- İlçe kırılımı
create index listings_district_browse_idx
  on public.listings (district_id, published_at desc)
  where status = 'yayinda' and district_id is not null;

-- Kullanıcının kendi ilanları (profil sayfası) — her durumdaki ilanı kapsar
create index listings_owner_idx
  on public.listings (owner_id, created_at desc);

-- Moderasyon kuyruğu
create index listings_moderation_idx
  on public.listings (created_at)
  where status = 'onay_bekliyor';

-- Serbest metin arama
create index listings_search_idx
  on public.listings using gin (search_vector);

-- Süresi dolanları toplu kapatan iş için
create index listings_expiry_idx
  on public.listings (expires_at)
  where status = 'yayinda' and expires_at is not null;

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Slug'ı başlıktan üret.
--
-- Slug istemciden hiç alınmıyor; başlıktan türetiliyor ki URL üretimi tek
-- yerden kontrol edilsin ve kullanıcı slug'a istediğini yazamasın.
-- ---------------------------------------------------------------------------
create or replace function public.listings_sync_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := coalesce(nullif(public.tr_slugify(new.title), ''), 'ilan');
  return new;
end;
$$;

create trigger listings_sync_slug_trigger
  before insert or update of title on public.listings
  for each row execute function public.listings_sync_slug();

-- ---------------------------------------------------------------------------
-- Korumalı kolon muhafızı.
--
-- Bu trigger, ilan üzerindeki "kullanıcının yazmaması gereken" tüm kolonların
-- TEK otoritesi. RLS'e bu kolonları politika içinde karşılaştırtmak yerine
-- burada zorla normalleştiriyoruz; çünkü BEFORE trigger'lar RLS WITH CHECK
-- kontrolünden ÖNCE çalışır, yani trigger'ın bıraktığı değer denetlenen
-- değerdir. Böylece politika sadece "bu satır senin mi" sorusuna bakar.
--
-- Kullanıcı ne gönderirse göndersin:
--   * sayaçlar, moderasyon alanları ve yayın tarihleri elle yazılamaz
--   * ilan sahibi ve id değiştirilemez
--   * yayın durumu app_settings.listing.auto_approve ayarına göre belirlenir
-- ---------------------------------------------------------------------------
create or replace function public.listings_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_auto_approve boolean;
  v_duration     integer;
begin
  -- Admin ve service_role bu normalleştirmenin dışında: moderasyon paneli
  -- onay/red alanlarını, göç/seed script'leri de yayın tarihlerini yazabilmeli.
  --
  -- Bu fonksiyon bilerek SECURITY DEFINER DEĞİL: definer bağlamında
  -- current_user fonksiyonun sahibine (postgres) eşit olur ve service_role
  -- muafiyeti hiçbir zaman tutmaz. Invoker olarak çalışınca PostgREST'in
  -- "set role service_role" ataması doğru görülür.
  --
  -- Bilerek "auth.uid() is null" da DEĞİL: o koşul giriş yapmamış herkesi
  -- muafiyet kapsamına alırdı.
  if public.is_admin() or current_user = 'service_role' then
    return new;
  end if;

  select coalesce((value ->> 'auto_approve')::boolean, true),
         coalesce((value ->> 'default_duration_days')::integer, 60)
    into v_auto_approve, v_duration
    from public.app_settings where key = 'listing';

  v_auto_approve := coalesce(v_auto_approve, true);
  v_duration     := coalesce(v_duration, 60);

  if tg_op = 'INSERT' then
    new.view_count       := 0;
    new.favorite_count   := 0;
    new.contact_count    := 0;
    new.reviewed_at      := null;
    new.reviewed_by      := null;
    new.rejection_reason := null;

    -- Taslak dışındaki her giriş, ayara göre ya doğrudan yayına girer ya da
    -- onay kuyruğuna düşer. Kullanıcı 'yayinda' yazsa bile burası belirler.
    if new.status <> 'taslak' then
      new.status := case when v_auto_approve then 'yayinda'::public.listing_status
                         else 'onay_bekliyor'::public.listing_status end;
    end if;

    if new.status = 'yayinda' then
      new.published_at := now();
      new.expires_at   := now() + make_interval(days => v_duration);
    else
      new.published_at := null;
      new.expires_at   := null;
    end if;

  else
    -- Değiştirilemez alanları eski değerlerine geri çevir.
    new.id               := old.id;
    new.owner_id         := old.owner_id;
    new.view_count       := old.view_count;
    new.favorite_count   := old.favorite_count;
    new.contact_count    := old.contact_count;
    new.reviewed_at      := old.reviewed_at;
    new.reviewed_by      := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.created_at       := old.created_at;

    -- Sahibinin yapabileceği durum geçişleri açık bir tabloyla sınırlı.
    -- İzin verilmeyen her geçiş sessizce eski duruma geri döner.
    --
    -- Özellikle: REDDEDİLMİŞ bir ilan kullanıcı tarafından ne yayına ne de
    -- 'satildi'ya çevrilebilir — tek çıkışı 'taslak'a alıp düzelterek yeniden
    -- göndermektir. Aksi halde moderasyon kararı tek satırlık bir UPDATE ile
    -- etkisiz kalırdı.
    if new.status <> old.status then
      if not (
        case old.status
          when 'taslak'        then new.status in ('onay_bekliyor', 'yayinda', 'pasif')
          when 'onay_bekliyor' then new.status in ('taslak', 'pasif')
          when 'yayinda'       then new.status in ('pasif', 'satildi', 'taslak')
          when 'pasif'         then new.status in ('yayinda', 'satildi', 'taslak')
          when 'satildi'       then new.status in ('yayinda', 'pasif', 'taslak')
          when 'suresi_doldu'  then new.status in ('yayinda', 'taslak')
          when 'reddedildi'    then new.status = 'taslak'
          else false
        end
      ) then
        new.status := old.status;

      -- Yayına dönüş talebi yine ayara tabi: moderasyon açıksa kuyruğa girer.
      elsif new.status = 'yayinda' then
        new.status := case when v_auto_approve then 'yayinda'::public.listing_status
                           else 'onay_bekliyor'::public.listing_status end;
      end if;
    end if;

    if new.status = 'yayinda' then
      new.published_at := coalesce(old.published_at, now());
      new.expires_at   := coalesce(old.expires_at, now() + make_interval(days => v_duration));
    else
      new.published_at := old.published_at;
      new.expires_at   := old.expires_at;
    end if;
  end if;

  return new;
end;
$$;

create trigger listings_guard_trigger
  before insert or update on public.listings
  for each row execute function public.listings_guard();

-- ---------------------------------------------------------------------------
-- Fotoğraflar
-- ---------------------------------------------------------------------------
create table public.listing_photos (
  id           bigint generated always as identity primary key,
  listing_id   bigint not null references public.listings(id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0 check (position between 0 and 19),
  width        integer,
  height       integer,
  created_at   timestamptz not null default now(),

  unique (listing_id, position)
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, position);

-- ---------------------------------------------------------------------------
-- Kullanıcının ilan sayacını güncel tut
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_listing_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set listing_count = listing_count + 1 where id = new.owner_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set listing_count = greatest(listing_count - 1, 0) where id = old.owner_id;
  end if;
  return null;
end;
$$;

create trigger listings_sync_profile_count
  after insert or delete on public.listings
  for each row execute function public.sync_profile_listing_count();

-- ---------------------------------------------------------------------------
-- Görüntülenme sayacı.
--
-- Doğrudan UPDATE yerine RPC: RLS kullanıcıya sayaç kolonlarını yazdırmıyor,
-- artış yalnızca buradan geçiyor.
-- ---------------------------------------------------------------------------
create or replace function public.increment_listing_view(p_listing_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id and status = 'yayinda';
$$;
