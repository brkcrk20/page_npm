-- ============================================================================
-- 0011_services.sql — Hizmet sağlayıcıları (veteriner, pet oteli, kuaför…)
--
-- Hizmet sağlayıcı bir İLAN DEĞİL: süresi dolmaz, satılmaz, kalıcı bir işletme
-- kaydıdır. Bu yüzden listings tablosuna sığdırılmadı — orada yaşam döngüsü
-- (yayın süresi, satıldı durumu, doping) tamamen farklı.
--
-- Tablo hizmet tipinden bağımsız: sitede yedi hizmet kategorisi var ve her biri
-- için ayrı tablo açmak, kategori sayfalarında düzelttiğimiz kopyalama
-- hatasının aynısı olurdu. Tipe özgü özellikler (röntgen, yatılı tedavi, evde
-- bakım…) ayrı bir katalog tablosunda tutuluyor; yeni özellik eklemek şema
-- göçü değil, tek satır veri.
-- ============================================================================

create type public.service_type as enum (
  'veteriner',
  'pet_oteli',
  'kuafor',
  'pet_taksi',
  'gezdirici',
  'egitmen',
  'petshop'
);

create type public.service_status as enum (
  'taslak',
  'onay_bekliyor',
  'yayinda',
  'reddedildi',
  'pasif'
);

-- ---------------------------------------------------------------------------
-- Filtrelenebilir özellik kataloğu
--
-- "Röntgen var mı", "7/24 acil mi", "evde bakım yapıyor mu" gibi işaretler.
-- Kolon yerine katalog: veteriner için 15, pet oteli için bambaşka 10 özellik
-- gerekiyor; hepsini kolon yapmak tabloyu kullanılmayan alanlarla doldururdu.
-- ---------------------------------------------------------------------------
create table public.service_features (
  id           integer generated always as identity primary key,
  service_type public.service_type not null,
  slug         text not null,
  name         text not null,
  -- Filtre panelinde gruplama: "Hizmetler", "Tedavi Ettiği Hayvanlar", "Olanaklar"
  group_name   text not null default 'Hizmetler',
  position     smallint not null default 0,
  is_active    boolean not null default true,

  unique (service_type, slug)
);

create index service_features_type_idx on public.service_features (service_type, position);

-- ---------------------------------------------------------------------------
-- Hizmet sağlayıcı kaydı
-- ---------------------------------------------------------------------------
create table public.service_providers (
  id            bigint generated always as identity primary key,
  service_type  public.service_type not null,
  status        public.service_status not null default 'onay_bekliyor',

  -- Kaydı yöneten kullanıcı. Null olabilir: rehberi biz doldurup işletmenin
  -- sonradan "bu benim işletmem" diyerek sahiplenmesine izin veriyoruz.
  owner_id      uuid references public.profiles(id) on delete set null,

  name          text not null check (char_length(btrim(name)) between 2 and 120),
  slug          text not null,
  description   text,

  -- --- İletişim ---
  phone         text,
  phone_alt     text,
  whatsapp      text,
  email         text,
  website       text,

  -- --- Konum ---
  city_id       smallint not null references public.cities(id),
  district_id   integer  references public.districts(id),
  address       text,
  -- Harita için. numeric, float değil: koordinatlarda kayan nokta yuvarlaması
  -- metrelerce kayma yaratabiliyor.
  latitude      numeric(9,6),
  longitude     numeric(9,6),

  -- --- Güven işaretleri ---
  -- Veteriner hekim oda kayıt / ruhsat numarası. Doğrulama admin tarafından
  -- yapılıyor; kullanıcı is_verified alanına yazamıyor (bkz. RLS).
  license_number text,
  is_verified    boolean not null default false,
  verified_at    timestamptz,

  -- --- Sayaçlar (yalnızca RPC ile artar) ---
  view_count      integer not null default 0,
  phone_count     integer not null default 0,
  whatsapp_count  integer not null default 0,

  -- --- Değerlendirme özeti (trigger ile güncellenir) ---
  rating_average numeric(3,2) not null default 0 check (rating_average between 0 and 5),
  rating_count   integer not null default 0,

  -- --- Moderasyon ---
  rejection_reason text,
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles(id),

  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  search_vector tsvector generated always as (
    setweight(to_tsvector('turkish', coalesce(name, '')),        'A') ||
    setweight(to_tsvector('turkish', coalesce(address, '')),     'B') ||
    setweight(to_tsvector('turkish', coalesce(description, '')), 'C')
  ) stored,

  -- Koordinatın yarısı işe yaramaz; ya ikisi de var ya hiçbiri.
  constraint service_providers_coords check (
    (latitude is null) = (longitude is null)
  ),
  -- En az bir iletişim yolu olmayan kayıt kullanıcıya hiçbir işe yaramaz.
  constraint service_providers_contact check (
    coalesce(nullif(btrim(phone), ''), nullif(btrim(email), ''),
             nullif(btrim(website), ''), nullif(btrim(whatsapp), '')) is not null
  )
);

create index service_providers_browse_idx
  on public.service_providers (service_type, city_id, rating_average desc)
  where status = 'yayinda';

create index service_providers_district_idx
  on public.service_providers (service_type, district_id)
  where status = 'yayinda' and district_id is not null;

create index service_providers_search_idx
  on public.service_providers using gin (search_vector);

create index service_providers_owner_idx on public.service_providers (owner_id);

create index service_providers_moderation_idx
  on public.service_providers (created_at)
  where status = 'onay_bekliyor';

create trigger service_providers_set_updated_at
  before update on public.service_providers
  for each row execute function public.set_updated_at();

-- Slug başlıktan üretiliyor; istemciden alınmıyor (ilanlarda olduğu gibi).
create or replace function public.service_providers_sync_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := coalesce(nullif(public.tr_slugify(new.name), ''), 'hizmet');
  return new;
end;
$$;

create trigger service_providers_sync_slug_trigger
  before insert or update of name on public.service_providers
  for each row execute function public.service_providers_sync_slug();

-- ---------------------------------------------------------------------------
-- Korumalı kolon muhafızı — listings_guard ile aynı gerekçe.
-- Kullanıcı kendini doğrulanmış işletme yapamaz, sayaç şişiremez, kaydını
-- kendi yayına alamaz.
-- ---------------------------------------------------------------------------
create or replace function public.service_providers_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() or current_user = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status          := 'onay_bekliyor';
    new.is_verified     := false;
    new.verified_at     := null;
    new.view_count      := 0;
    new.phone_count     := 0;
    new.whatsapp_count  := 0;
    new.rating_average  := 0;
    new.rating_count    := 0;
    new.reviewed_at     := null;
    new.reviewed_by     := null;
    new.rejection_reason:= null;
    new.published_at    := null;
  else
    new.id             := old.id;
    new.owner_id       := old.owner_id;
    new.is_verified    := old.is_verified;
    new.verified_at    := old.verified_at;
    new.view_count     := old.view_count;
    new.phone_count    := old.phone_count;
    new.whatsapp_count := old.whatsapp_count;
    new.rating_average := old.rating_average;
    new.rating_count   := old.rating_count;
    new.reviewed_at    := old.reviewed_at;
    new.reviewed_by    := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.published_at   := old.published_at;
    new.created_at     := old.created_at;

    -- Sahibi yalnızca yayından kaldırıp geri alabilir; onay kararını değiştiremez.
    if new.status <> old.status then
      if not (
        case old.status
          when 'yayinda'       then new.status = 'pasif'
          when 'pasif'         then new.status = 'onay_bekliyor'
          when 'taslak'        then new.status = 'onay_bekliyor'
          when 'reddedildi'    then new.status = 'taslak'
          when 'onay_bekliyor' then new.status in ('taslak', 'pasif')
          else false
        end
      ) then
        new.status := old.status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger service_providers_guard_trigger
  before insert or update on public.service_providers
  for each row execute function public.service_providers_guard();

-- ---------------------------------------------------------------------------
-- Sağlayıcı ↔ özellik bağı
-- ---------------------------------------------------------------------------
create table public.service_provider_features (
  provider_id bigint  not null references public.service_providers(id) on delete cascade,
  feature_id  integer not null references public.service_features(id) on delete cascade,

  primary key (provider_id, feature_id)
);

create index service_provider_features_feature_idx
  on public.service_provider_features (feature_id);

-- ---------------------------------------------------------------------------
-- Çalışma saatleri
--
-- jsonb yerine satır: "şu anda açık olanlar" filtresi jsonb ile indekslenemez,
-- satır olarak tek karşılaştırma.
-- weekday: 1 = Pazartesi … 7 = Pazar (ISO 8601, extract(isodow) ile uyumlu).
-- ---------------------------------------------------------------------------
create table public.service_provider_hours (
  provider_id bigint   not null references public.service_providers(id) on delete cascade,
  weekday     smallint not null check (weekday between 1 and 7),
  opens_at    time,
  closes_at   time,
  is_closed   boolean  not null default false,
  -- 7/24 açık işletmeler için: saat aralığı anlamsız
  is_24h      boolean  not null default false,

  primary key (provider_id, weekday),

  constraint service_provider_hours_range check (
    is_closed or is_24h or (opens_at is not null and closes_at is not null)
  )
);

-- ---------------------------------------------------------------------------
-- Değerlendirmeler
--
-- Veteriner seçiminde güven belirleyici; puan olmadan rehber işe yaramıyor.
-- Kullanıcı başına işletme başına tek yorum ve kendi işletmesine yorum yasak.
-- ---------------------------------------------------------------------------
create table public.service_reviews (
  id          bigint generated always as identity primary key,
  provider_id bigint not null references public.service_providers(id) on delete cascade,
  user_id     uuid   not null references public.profiles(id) on delete cascade,

  rating      smallint not null check (rating between 1 and 5),
  comment     text check (char_length(btrim(comment)) <= 2000),

  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (provider_id, user_id)
);

create index service_reviews_provider_idx
  on public.service_reviews (provider_id, created_at desc)
  where is_published;

create trigger service_reviews_set_updated_at
  before update on public.service_reviews
  for each row execute function public.set_updated_at();

-- Kişi kendi işletmesine puan veremez.
create or replace function public.service_reviews_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.service_providers p
     where p.id = new.provider_id and p.owner_id = new.user_id
  ) then
    raise exception 'Kendi işletmenize değerlendirme yazamazsınız.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger service_reviews_guard_trigger
  before insert or update on public.service_reviews
  for each row execute function public.service_reviews_guard();

-- Puan ortalamasını sağlayıcı satırında güncel tut.
create or replace function public.sync_service_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider bigint := coalesce(new.provider_id, old.provider_id);
begin
  update public.service_providers p
     set rating_average = coalesce(agg.avg_rating, 0),
         rating_count   = coalesce(agg.cnt, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
        from public.service_reviews
       where provider_id = v_provider and is_published
    ) agg
   where p.id = v_provider;
  return null;
end;
$$;

create trigger service_reviews_sync_rating
  after insert or update or delete on public.service_reviews
  for each row execute function public.sync_service_rating();

-- ---------------------------------------------------------------------------
-- Sayaç RPC'leri
-- ---------------------------------------------------------------------------
create or replace function public.increment_service_view(p_provider_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.service_providers set view_count = view_count + 1
   where id = p_provider_id and status = 'yayinda';
$$;

create or replace function public.increment_service_phone(p_provider_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.service_providers set phone_count = phone_count + 1
   where id = p_provider_id and status = 'yayinda';
$$;

create or replace function public.increment_service_whatsapp(p_provider_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.service_providers set whatsapp_count = whatsapp_count + 1
   where id = p_provider_id and status = 'yayinda';
$$;

grant execute on function public.increment_service_view(bigint)     to anon, authenticated;
grant execute on function public.increment_service_phone(bigint)    to anon, authenticated;
grant execute on function public.increment_service_whatsapp(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Şehir/ilçe başına sayımlar — rehber sayfasındaki yan menü için
-- ---------------------------------------------------------------------------
create or replace view public.service_city_counts as
  select p.service_type, c.id as city_id, c.slug as city_slug, c.name as city_name,
         count(p.id) as provider_count
    from public.cities c
    left join public.service_providers p
      on p.city_id = c.id and p.status = 'yayinda'
   group by p.service_type, c.id, c.slug, c.name;

grant select on public.service_city_counts to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.service_features          enable row level security;
alter table public.service_providers         enable row level security;
alter table public.service_provider_features enable row level security;
alter table public.service_provider_hours    enable row level security;
alter table public.service_reviews           enable row level security;

create policy service_features_read on public.service_features
  for select using (true);
create policy service_features_admin on public.service_features
  for all using (public.is_admin()) with check (public.is_admin());

create policy service_providers_read on public.service_providers
  for select using (status = 'yayinda' or owner_id = auth.uid() or public.is_admin());
create policy service_providers_insert_own on public.service_providers
  for insert with check (owner_id = auth.uid());
create policy service_providers_update_own on public.service_providers
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy service_providers_delete_own on public.service_providers
  for delete using (owner_id = auth.uid() or public.is_admin());
create policy service_providers_admin on public.service_providers
  for all using (public.is_admin()) with check (public.is_admin());

-- Özellik ve saat satırları sağlayıcının görünürlüğünü miras alır.
create policy service_provider_features_read on public.service_provider_features
  for select using (
    exists (select 1 from public.service_providers p
             where p.id = provider_id
               and (p.status = 'yayinda' or p.owner_id = auth.uid() or public.is_admin()))
  );
create policy service_provider_features_write on public.service_provider_features
  for all
  using (exists (select 1 from public.service_providers p where p.id = provider_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.service_providers p where p.id = provider_id and p.owner_id = auth.uid()));
create policy service_provider_features_admin on public.service_provider_features
  for all using (public.is_admin()) with check (public.is_admin());

create policy service_provider_hours_read on public.service_provider_hours
  for select using (
    exists (select 1 from public.service_providers p
             where p.id = provider_id
               and (p.status = 'yayinda' or p.owner_id = auth.uid() or public.is_admin()))
  );
create policy service_provider_hours_write on public.service_provider_hours
  for all
  using (exists (select 1 from public.service_providers p where p.id = provider_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.service_providers p where p.id = provider_id and p.owner_id = auth.uid()));
create policy service_provider_hours_admin on public.service_provider_hours
  for all using (public.is_admin()) with check (public.is_admin());

create policy service_reviews_read on public.service_reviews
  for select using (is_published or user_id = auth.uid() or public.is_admin());
create policy service_reviews_insert_own on public.service_reviews
  for insert with check (user_id = auth.uid());
create policy service_reviews_update_own on public.service_reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy service_reviews_delete_own on public.service_reviews
  for delete using (user_id = auth.uid() or public.is_admin());
create policy service_reviews_admin on public.service_reviews
  for all using (public.is_admin()) with check (public.is_admin());

grant select on
  public.service_features, public.service_providers,
  public.service_provider_features, public.service_provider_hours,
  public.service_reviews
to anon, authenticated;

grant insert, update, delete on
  public.service_providers, public.service_provider_features,
  public.service_provider_hours, public.service_reviews
to authenticated;

grant usage, select on all sequences in schema public to authenticated;
