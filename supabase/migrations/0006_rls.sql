-- ============================================================================
-- 0006_rls.sql — Row Level Security politikaları
--
-- Firestore kurallarının yerini alan katman. Temel ilke: her tabloda RLS AÇIK
-- ve varsayılan REDDET; erişim tek tek politikalarla veriliyor.
--
-- Rol karşılıkları (Supabase):
--   anon          -> giriş yapmamış ziyaretçi
--   authenticated -> giriş yapmış kullanıcı
--   service_role  -> sunucu tarafı / webhook (RLS'i tamamen atlar)
--
-- Kritik kural: kullanıcı KENDİNE vitrin/doping veremez, ilanını kendi
-- onaylayamaz, sayaçları elle şişiremez, ödemeyi "ödendi" yapamaz. Bu alanların
-- tamamı yalnızca admin veya service_role tarafından yazılır.
-- ============================================================================

alter table public.categories         enable row level security;
alter table public.breeds             enable row level security;
alter table public.cities             enable row level security;
alter table public.districts          enable row level security;
alter table public.profiles           enable row level security;
alter table public.listings           enable row level security;
alter table public.listing_photos     enable row level security;
alter table public.app_settings       enable row level security;
alter table public.products           enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.payments           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.listing_promotions enable row level security;
alter table public.listing_credits    enable row level security;

-- ---------------------------------------------------------------------------
-- Referans tabloları: herkes okur, yalnızca admin yazar.
-- SEO sayfaları giriş yapmamış ziyaretçiye de açık olmak zorunda.
-- ---------------------------------------------------------------------------
create policy categories_read on public.categories
  for select using (true);
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy breeds_read on public.breeds
  for select using (true);
create policy breeds_admin_write on public.breeds
  for all using (public.is_admin()) with check (public.is_admin());

create policy cities_read on public.cities
  for select using (true);
create policy cities_admin_write on public.cities
  for all using (public.is_admin()) with check (public.is_admin());

create policy districts_read on public.districts
  for select using (true);
create policy districts_admin_write on public.districts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiller
--
-- Tam satırı yalnızca sahibi ve admin görür (telefon, TCKN, vergi no burada).
-- Herkese açık satıcı bilgisi için public_profiles view'ı kullanılır.
-- ---------------------------------------------------------------------------
create policy profiles_read_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- Kullanıcı kendi rolünü, rozetini, ban durumunu veya ilan sayacını
-- değiştiremez. Bu alanlar sadece admin'e açık.
create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role          = (select p.role          from public.profiles p where p.id = auth.uid())
    and is_verified   = (select p.is_verified   from public.profiles p where p.id = auth.uid())
    and is_banned     = (select p.is_banned     from public.profiles p where p.id = auth.uid())
    and listing_count = (select p.listing_count from public.profiles p where p.id = auth.uid())
  );

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- İlanlar
-- ---------------------------------------------------------------------------

-- Yayındaki ilanı herkes görür; kendi ilanını sahibi her durumda görür.
create policy listings_read_published on public.listings
  for select using (
    status = 'yayinda'
    or owner_id = auth.uid()
    or public.is_admin()
  );

-- Oluşturma ve güncelleme: politika yalnızca SAHİPLİĞE bakar.
--
-- Durum, sayaçlar, yayın tarihleri ve moderasyon alanları listings_guard()
-- trigger'ı tarafından zorla normalleştiriliyor (bkz. 0004). BEFORE trigger
-- RLS WITH CHECK'ten önce çalıştığı için denetlenen değer trigger'ın bıraktığı
-- değerdir; aynı kontrolü politikada tekrarlamak hem gereksiz hem de
-- trigger'la çakışıyordu (published_at'i trigger dolduruyor, politika
-- "değişmemiş olmalı" diyordu ve geçerli güncellemeler reddediliyordu).
create policy listings_insert_own on public.listings
  for insert
  with check (owner_id = auth.uid());

create policy listings_update_own on public.listings
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy listings_delete_own on public.listings
  for delete using (owner_id = auth.uid() or public.is_admin());

create policy listings_admin_all on public.listings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- İlan fotoğrafları — ilanın görünürlüğünü miras alır
-- ---------------------------------------------------------------------------
create policy listing_photos_read on public.listing_photos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'yayinda' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_photos_write_own on public.listing_photos
  for all
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

create policy listing_photos_admin on public.listing_photos
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Uygulama ayarları — herkes okur (ücretlendirme açık mı bilinmeli),
-- yalnızca admin yazar.
-- ---------------------------------------------------------------------------
create policy app_settings_read on public.app_settings
  for select using (true);
create policy app_settings_admin_write on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Ürün kataloğu — fiyat listesi herkese açık
-- ---------------------------------------------------------------------------
create policy products_read on public.products
  for select using (is_active or public.is_admin());
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Siparişler
--
-- Kullanıcı sipariş oluşturabilir ama ASLA 'odendi' yazamaz — ödeme onayı
-- yalnızca service_role (webhook) veya admin tarafından işlenir.
-- ---------------------------------------------------------------------------
create policy orders_read_own on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

create policy orders_insert_own on public.orders
  for insert
  with check (
    user_id = auth.uid()
    and status = 'odeme_bekleniyor'
    and paid_at is null
  );

-- Kullanıcının tek yapabileceği: bekleyen siparişini iptal etmek.
create policy orders_cancel_own on public.orders
  for update
  using (user_id = auth.uid() and status = 'odeme_bekleniyor')
  with check (user_id = auth.uid() and status = 'iptal' and paid_at is null);

create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

create policy order_items_read_own on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy order_items_insert_own on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid() and o.status = 'odeme_bekleniyor'
    )
  );

create policy order_items_admin on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Ödemeler, abonelikler, dopingler, ilan hakları
--
-- Hepsi SALT OKUNUR. Yazma yetkisi yalnızca admin ve service_role'da —
-- kullanıcının kendine abonelik veya vitrin yazabilmesi ücretlendirmenin
-- tamamını anlamsız kılardı.
-- ---------------------------------------------------------------------------
create policy payments_read_own on public.payments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy payments_admin_write on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

create policy subscriptions_read_own on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());
create policy subscriptions_admin_write on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- Aktif dopingler herkese görünür (vitrin sıralaması için gerekli).
create policy listing_promotions_read on public.listing_promotions
  for select using (true);
create policy listing_promotions_admin_write on public.listing_promotions
  for all using (public.is_admin()) with check (public.is_admin());

create policy listing_credits_read_own on public.listing_credits
  for select using (user_id = auth.uid() or public.is_admin());
create policy listing_credits_admin_write on public.listing_credits
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Rol izinleri
--
-- RLS politikaları GRANT'in yerine geçmez; ikisi birlikte çalışır. Supabase
-- varsayılan olarak public şemaya geniş GRANT verir, biz burada netleştiriyoruz.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.categories, public.breeds, public.cities, public.districts,
  public.listings, public.listing_photos, public.app_settings,
  public.products, public.listing_promotions,
  public.public_profiles, public.active_listing_promotions
to anon, authenticated;

grant insert, update, delete on public.listings, public.listing_photos to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select on public.payments, public.subscriptions, public.listing_credits to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Görüntülenme sayacı RPC'si herkese açık (giriş yapmamış ziyaretçi de sayılır).
grant execute on function public.increment_listing_view(bigint) to anon, authenticated;
grant execute on function public.monetization_enabled() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
