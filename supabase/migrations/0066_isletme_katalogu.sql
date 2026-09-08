-- 0066 — İşletme kataloğu: ürünler ve hizmet/paket fiyatları
--
-- NEDEN
-- Rehberde işletmenin adı, adresi ve özellik etiketleri vardı; ne sattığı
-- yoktu. "Denizli Merkezefendi'de Royal Canin mama nerede var" sorusunun
-- cevabı sitede hiçbir yerde durmuyordu — kullanıcı tek tek arayıp sormak
-- zorundaydı. Katalog bu boşluğu kapatıyor.
--
-- TEK TABLO, İKİ TÜR
-- Petshop ÜRÜN satıyor: markası var, stoğu var, aynı ürün başka mağazada da
-- bulunur, o yüzden aranabilir olmalı. Veteriner, kuaför, otel, eğitmen,
-- gezdirici ve pet taksi ise HİZMET veriyor: stok diye bir şey yok, "3 tane
-- kısırlaştırma kaldı" saçma olur. İkisini ayrı tabloya bölmek aynı listeleme,
-- aynı yetkilendirme ve aynı yönetim ekranını iki kez yazmak demekti; tek
-- tabloda kind ayrımı yeterli. Stok ve marka yalnızca ürün satırlarında
-- dolduruluyor, kontrol de bunu zorluyor.
--
-- PET TAKSİDE MAĞAZA YOK
-- Pet taksi de katalog kullanıyor ama ürün olarak değil: "Şehir içi transfer
-- 500 ₺" gibi bir tarife satırı. Mağaza açmıyor, fiyat listesi yayınlıyor.

create type public.service_item_kind as enum ('urun', 'hizmet');

create table public.service_items (
  id           bigint generated always as identity primary key,
  provider_id  bigint not null references public.service_providers(id) on delete cascade,
  kind         public.service_item_kind not null,

  name         text not null check (char_length(btrim(name)) between 2 and 120),
  -- Marka yalnızca üründe anlamlı ("Royal Canin"). Aramada ayrı ağırlık
  -- taşısın diye ada gömülmedi, kendi sütununda duruyor.
  brand        text check (brand is null or char_length(btrim(brand)) <= 60),
  description  text check (description is null or char_length(description) <= 600),

  -- Ürün grubu: mama, kum, oyuncak… Serbest metin değil, sabit liste;
  -- aramanın ve filtrenin dayanacağı bir şey olması gerekiyor.
  category     text check (category is null or category in (
                 'mama', 'odul-mama', 'kum', 'oyuncak', 'tasma-kayis', 'kafes-tasima',
                 'bakim-hijyen', 'saglik-vitamin', 'akvaryum', 'kus-urunleri', 'diger'
               )),

  price        numeric(12,2) check (price is null or price >= 0),
  currency     char(3) not null default 'TRY',
  -- "1 kg", "12 kg", "500 ml", "30 dk", "8 seans" — hem üründe hem hizmette
  -- fiyatın neyin karşılığı olduğunu söylüyor.
  unit         text check (unit is null or char_length(btrim(unit)) <= 30),

  -- Stok yalnızca üründe. null = "takip etmiyorum", 0 = tükendi.
  stock        integer check (stock is null or stock >= 0),

  photo_path   text,
  position     smallint not null default 0,
  is_active    boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Stok ve marka hizmet satırında durmasın: veri girerken karışırsa
  -- listede "Kısırlaştırma — 3 adet kaldı" gibi anlamsız satırlar çıkar.
  constraint service_items_hizmet_stoksuz
    check (kind = 'urun' or (stock is null and brand is null and category is null))
);

create index service_items_provider_idx on public.service_items (provider_id, is_active, position);
create index service_items_kind_idx      on public.service_items (kind, is_active);

-- Arama: ad + marka birlikte. pg_trgm zaten kurulu (bkz. 0011), böylece
-- "royal canin" araması "Royal Canin Medium Adult"u yakalıyor ve yazım
-- hatasına da toleranslı.
create index service_items_arama_idx on public.service_items
  using gin ((coalesce(brand,'') || ' ' || name) gin_trgm_ops);

create trigger service_items_set_updated_at
  before update on public.service_items
  for each row execute function public.set_updated_at();

alter table public.service_items enable row level security;

-- Satırlar sağlayıcının görünürlüğünü miras alıyor: yayında olmayan bir
-- işletmenin ürünleri de görünmemeli.
create policy service_items_read on public.service_items
  for select using (
    is_active
    and exists (
      select 1 from public.service_providers p
       where p.id = provider_id and p.status = 'yayinda'
    )
    or exists (
      select 1 from public.service_providers p
       where p.id = provider_id and p.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy service_items_write on public.service_items
  for all
  using (exists (select 1 from public.service_providers p
                  where p.id = provider_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.service_providers p
                       where p.id = provider_id and p.owner_id = auth.uid()));

create policy service_items_admin on public.service_items
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.service_items is
  'İşletme kataloğu: petshopta stoklu ürün, diğer hizmetlerde fiyatlı hizmet/paket.';
