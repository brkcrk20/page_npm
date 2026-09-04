-- ============================================================================
-- Kayıp / Bulundu ilanları
--
-- listing_kind enum'ında 'kayip' ve 'bulundu' ilk günden beri vardı ama hiç
-- arayüzü yoktu. Kayıp ilanında en kritik bilgi tarih: "dün kayboldu" ile
-- "üç ay önce kayboldu" arayan için bambaşka iki durum. Açıklamaya yazılan
-- tarih ne sıralanabiliyor ne filtrelenebiliyor, o yüzden kendi sütunu.
-- ============================================================================

alter table public.listings
  add column if not exists event_date date;

comment on column public.listings.event_date is
  'Kayıp ilanında kaybolduğu, bulundu ilanında bulunduğu tarih. Diğer ilan türlerinde null.';

-- Gelecek tarih girilemez; "yarın kayboldu" bir veri girişi hatası.
alter table public.listings
  drop constraint if exists listings_event_date_sane;
alter table public.listings
  add constraint listings_event_date_sane check (
    event_date is null or event_date <= current_date
  );

-- Kayıp ilanı listelerken tarihe göre sıralanıyor.
create index if not exists listings_event_date_idx
  on public.listings (kind, event_date desc)
  where status = 'yayinda' and kind in ('kayip', 'bulundu');
