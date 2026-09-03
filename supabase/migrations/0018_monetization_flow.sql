-- ============================================================================
-- 0018_monetization_flow.sql — Ücretlendirme akışını tamamla
--
-- 0005'te tablolar kurulmuştu ama satın alma akışı yoktu: sipariş oluşuyor,
-- ödeme onaylanıyor ve karşılığında doping/abonelik/ilan hakkı VERİLİYOR
-- kısmı eksikti. Bu göç o boşluğu kapatıyor.
--
-- ANA ANAHTAR HÂLÂ KAPALI (app_settings.monetization.enabled = false).
-- Akışın tamamı çalışır durumda; açmak tek satırlık ayar değişikliği.
-- Fiyatlar sıfır ve ürünler pasif — fiyatlandırma iş kararı, koda gömülmemeli.
--
-- ÖDEME
-- Sağlayıcı henüz seçilmediği için çalışan yol havale/EFT: kullanıcı sipariş
-- oluşturuyor, banka bilgisi ve sipariş numarası gösteriliyor, admin ödemeyi
-- gördüğünde onaylıyor. iyzico/PayTR eklendiğinde yalnızca ödeme adımı
-- değişecek; sipariş ve hak verme mantığı aynı kalıyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ürün kataloğu
--
-- Fiyatlar 0 ve ürünler pasif: gerçek fiyatları admin panelinden gireceksiniz.
-- Katalogda durmaları, ücretlendirme açıldığında ekranların boş gelmemesi için.
-- ---------------------------------------------------------------------------
insert into public.products (code, kind, name, description, price_minor, duration_days, promotion, listing_credits, is_active, position) values
  ('vitrin_7g',  'doping', 'Ana Sayfa Vitrini (7 gün)',
   'İlanınız ana sayfanın vitrin bölümünde bir hafta boyunca yer alır.',
   0, 7,  'anasayfa_vitrin', null, false, 1),
  ('vitrin_30g', 'doping', 'Ana Sayfa Vitrini (30 gün)',
   'İlanınız ana sayfanın vitrin bölümünde bir ay boyunca yer alır.',
   0, 30, 'anasayfa_vitrin', null, false, 2),
  ('kategori_vitrin_7g', 'doping', 'Kategori Vitrini (7 gün)',
   'İlanınız kendi kategorisinin en üstünde bir hafta boyunca gösterilir.',
   0, 7,  'kategori_vitrin', null, false, 3),
  ('ust_sirada_7g', 'doping', 'Üst Sırada (7 gün)',
   'İlanınız arama sonuçlarında ve listelerde üst sıralarda çıkar.',
   0, 7,  'ust_sirada', null, false, 4),
  ('acil_7g', 'doping', 'Acil Rozeti (7 gün)',
   'İlanınızın üzerinde dikkat çeken "acil" rozeti görünür.',
   0, 7,  'acil', null, false, 5),
  ('renkli_cerceve_7g', 'doping', 'Renkli Çerçeve (7 gün)',
   'İlanınız listelerde renkli çerçeveyle öne çıkar.',
   0, 7,  'renkli_cerceve', null, false, 6),
  ('ilan_yenileme', 'doping', 'İlan Yenileme',
   'İlanınızın tarihi güncellenir ve listelerin başına döner.',
   0, 1,  'ilan_yenileme', null, false, 7),

  ('kurumsal_aylik', 'abonelik', 'Kurumsal Üyelik (Aylık)',
   'Sınırsız ilan, mağaza sayfası ve kurumsal rozet.',
   0, 30, null, null, false, 20),
  ('kurumsal_yillik', 'abonelik', 'Kurumsal Üyelik (Yıllık)',
   'Sınırsız ilan, mağaza sayfası ve kurumsal rozet. Yıllık ödemede avantajlı.',
   0, 365, null, null, false, 21),

  ('ilan_paketi_10', 'ilan_paketi', '10 İlan Hakkı',
   'Ücretsiz kotanız dolduğunda kullanabileceğiniz 10 ilan hakkı.',
   0, null, null, 10, false, 30),
  ('ilan_paketi_50', 'ilan_paketi', '50 İlan Hakkı',
   'Yoğun ilan veren üreticiler için 50 ilan hakkı.',
   0, null, null, 50, false, 31)
on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      duration_days = excluded.duration_days,
      promotion = excluded.promotion,
      listing_credits = excluded.listing_credits,
      position = excluded.position;

-- ---------------------------------------------------------------------------
-- Sipariş oluştur
--
-- İstemcide sipariş satırı + kalemleri ayrı ayrı yazmak, araya girildiğinde
-- kalemsiz sipariş bırakabilirdi. Tek işlemde, fiyat da katalogdan okunuyor:
-- istemciden gelen tutara güvenmek ödeme sistemlerindeki en yaygın açık.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_product_code text,
  p_listing_id   bigint default null,
  p_quantity     smallint default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_product  public.products%rowtype;
  v_order_id bigint;
  v_ref      uuid;
  v_billing  jsonb;
begin
  if v_user is null then
    raise exception 'Sipariş için giriş yapmalısınız.' using errcode = 'insufficient_privilege';
  end if;

  if coalesce(p_quantity, 1) < 1 then
    raise exception 'Adet en az 1 olmalı.' using errcode = 'check_violation';
  end if;

  select * into v_product from public.products where code = p_product_code and is_active;
  if v_product.id is null then
    raise exception 'Ürün bulunamadı veya satışta değil.' using errcode = 'no_data_found';
  end if;

  -- Doping bir ilana uygulanır; ilan sahibi olmayan kullanıcı başkasının
  -- ilanını öne çıkaramaz.
  if v_product.kind = 'doping' then
    if p_listing_id is null then
      raise exception 'Doping için ilan seçilmeli.' using errcode = 'check_violation';
    end if;
    if not exists (
      select 1 from public.listings where id = p_listing_id and owner_id = v_user
    ) then
      raise exception 'Bu ilan size ait değil.' using errcode = 'insufficient_privilege';
    end if;
  end if;

  -- Fatura bilgisi sipariş anında donduruluyor: kullanıcı profilini sonradan
  -- değiştirse bile kesilmiş faturanın verisi bozulmasın.
  select jsonb_build_object(
           'full_name', full_name,
           'account_type', account_type,
           'company_title', company_title,
           'tax_office', tax_office,
           'tax_number', tax_number,
           'national_id', national_id,
           'company_address', company_address
         )
    into v_billing
    from public.profiles where id = v_user;

  insert into public.orders (user_id, status, amount_minor, provider, billing_snapshot)
  values (
    v_user, 'odeme_bekleniyor',
    v_product.price_minor * p_quantity,
    coalesce((select value ->> 'provider' from public.app_settings where key = 'monetization'), 'manual'),
    coalesce(v_billing, '{}'::jsonb)
  )
  returning id, public_ref into v_order_id, v_ref;

  insert into public.order_items (order_id, product_id, listing_id, quantity, unit_price_minor)
  values (v_order_id, v_product.id, p_listing_id, p_quantity, v_product.price_minor);

  return v_ref;
end;
$$;

grant execute on function public.create_order(text, bigint, smallint) to authenticated;

-- ---------------------------------------------------------------------------
-- Ödemeyi onayla ve hakları ver
--
-- Ücretlendirmenin can alıcı noktası: sipariş "ödendi" olduğunda karşılığında
-- ne verileceği. Doping ise ilana süreli promosyon, abonelik ise üyelik,
-- ilan paketi ise kredi.
--
-- Yalnızca admin ve service_role çağırabiliyor — kullanıcı kendi siparişini
-- onaylayabilseydi ücretlendirme tamamen anlamsız olurdu.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_public_ref  uuid,
  p_provider_ref text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item  record;
begin
  if not (public.is_admin() or current_user = 'service_role') then
    raise exception 'Bu işlem için yetkiniz yok.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_order from public.orders where public_ref = p_public_ref;
  if v_order.id is null then
    raise exception 'Sipariş bulunamadı.' using errcode = 'no_data_found';
  end if;

  -- Çift onay koruması: aynı sipariş iki kez onaylanırsa haklar iki kez
  -- verilirdi.
  if v_order.status = 'odendi' then
    return;
  end if;

  update public.orders
     set status = 'odendi', paid_at = now(), provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = v_order.id;

  insert into public.payments (order_id, provider, provider_ref, status, amount_minor, currency)
  values (v_order.id, v_order.provider, p_provider_ref, 'odendi', v_order.amount_minor, v_order.currency);

  for v_item in
    select oi.*, p.kind, p.promotion, p.duration_days, p.listing_credits
      from public.order_items oi
      join public.products p on p.id = oi.product_id
     where oi.order_id = v_order.id
  loop
    if v_item.kind = 'doping' and v_item.listing_id is not null then
      insert into public.listing_promotions (listing_id, promotion, order_id, starts_at, ends_at)
      values (
        v_item.listing_id, v_item.promotion, v_order.id, now(),
        now() + make_interval(days => coalesce(v_item.duration_days, 7) * v_item.quantity)
      );

      -- İlan yenileme dopingi: tarihi güncelleyip listelerin başına taşı.
      if v_item.promotion = 'ilan_yenileme' then
        update public.listings set published_at = now() where id = v_item.listing_id;
      end if;

    elsif v_item.kind = 'abonelik' then
      -- Mevcut aktif abonelik varsa kapatılıyor: kısmi indeks aynı anda tek
      -- aktif aboneliğe izin veriyor.
      update public.subscriptions set is_active = false
       where user_id = v_order.user_id and is_active;

      insert into public.subscriptions (user_id, product_id, order_id, starts_at, ends_at)
      values (
        v_order.user_id, v_item.product_id, v_order.id, now(),
        now() + make_interval(days => coalesce(v_item.duration_days, 30) * v_item.quantity)
      );

      update public.profiles set account_type = 'kurumsal'
       where id = v_order.user_id and account_type <> 'kurumsal' and company_title is not null;

    elsif v_item.kind = 'ilan_paketi' then
      insert into public.listing_credits (user_id, order_id, delta, reason)
      values (
        v_order.user_id, v_order.id,
        coalesce(v_item.listing_credits, 0) * v_item.quantity,
        'Sipariş: ' || v_order.public_ref
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.confirm_order_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Kullanıcının kalan ilan hakkı
-- ---------------------------------------------------------------------------
create or replace function public.remaining_listing_credits()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::integer
    from public.listing_credits
   where user_id = auth.uid();
$$;

grant execute on function public.remaining_listing_credits() to authenticated;

-- ---------------------------------------------------------------------------
-- Havale bilgileri — ödeme sağlayıcısı seçilene kadar çalışan yol
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
  ('payment_manual',
   jsonb_build_object(
     'bank_name',   '',
     'account_name','',
     'iban',        '',
     'note',        'Açıklama kısmına sipariş numaranızı yazmayı unutmayın.'
   ),
   'Havale/EFT ödeme bilgileri. Ücretlendirme açılmadan önce doldurulmalı.')
on conflict (key) do nothing;
