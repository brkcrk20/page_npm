-- ============================================================================
-- 0036_reports_and_restricted_breeds.sql — Şikayet sistemi ve yasaklı ırklar
--
-- İKİ SORUN
--
-- 1) ŞİKAYET DÜĞMESİ SAHTEYDİ. İlan detayındaki "Şikayet Et" düğmesi
--    "Şikayetiniz alındı" yazan bir bildirim gösteriyor, hiçbir yere
--    kaydetmiyordu. Kullanıcı kötü niyetli bir ilanı bildiriyor, kimse
--    görmüyor. Bu, düğmenin hiç olmamasından kötü: kullanıcı bildirdiğini
--    sanıp konuyu kapatıyor.
--
-- 2) YASAKLI IRKLAR İLAN EDİLEBİLİYORDU. 5199 sayılı Hayvanları Koruma
--    Kanunu bazı ırkların satışını, sahiplendirilmesini, takasını ve
--    üretimini yasaklıyor. Veritabanında bu ırklar duruyor ve ilan
--    açılabiliyordu.
--
--    Irklar SİLİNMİYOR, işaretleniyor: mevcut sahipler için bilgi
--    sayfalarında görünmeye devam etmeli ve arama motorunda o sayfaların
--    kaybolması da doğru değil. Yasak olan ilan vermek.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Yasaklı / kısıtlı ırklar
-- ---------------------------------------------------------------------------
alter table public.breeds add column if not exists is_restricted boolean not null default false;
alter table public.breeds add column if not exists restriction_note text;

comment on column public.breeds.is_restricted is
  '5199 sayılı kanun kapsamında ilanı yasak ırk. Irk kaydı silinmiyor, yalnızca ilan açılamıyor.';

-- Kesin olarak yasaklı olanlar. İngiliz Staffordshire (Staffordshire Bull
-- Terrier) BİLEREK LİSTEDE DEĞİL: yasaklı olan American Staffordshire
-- Terrier; ikisi farklı ırk ve karıştırmak meşru ilanları engellerdi.
update public.breeds
   set is_restricted = true,
       restriction_note = '5199 sayılı Hayvanları Koruma Kanunu uyarınca bu ırkın satışı, sahiplendirilmesi, takası ve üretimi yasaktır.'
 where category_id = 1
   and slug in ('pitbull', 'dogo-argentino', 'american-bully');

-- ---------------------------------------------------------------------------
-- Muhafız: yasaklı ırkla ilan açılamaz
-- ---------------------------------------------------------------------------
create or replace function public.listings_restricted_breed_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_note text;
begin
  if new.breed_id is null then
    return new;
  end if;

  select restriction_note into v_note
    from public.breeds
   where id = new.breed_id and is_restricted;

  if v_note is not null then
    raise exception '%', v_note using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Yönetici de dahil hiç kimse açamıyor: bu bir moderasyon tercihi değil,
-- yasal bir sınır.
drop trigger if exists listings_restricted_breed_trigger on public.listings;
create trigger listings_restricted_breed_trigger
  before insert or update of breed_id on public.listings
  for each row execute function public.listings_restricted_breed_guard();

-- ---------------------------------------------------------------------------
-- Şikayetler
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.report_reason as enum (
    'yaniltici',      -- yanıltıcı bilgi veya fotoğraf
    'dolandiricilik', -- kapora/ödeme dolandırıcılığı şüphesi
    'yasakli_tur',    -- yasaklı ırk veya yabani hayvan
    'kotu_muamele',   -- hayvana kötü muamele
    'yanlis_kategori',
    'tekrar_ilan',
    'diger'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('acik', 'inceleniyor', 'kapatildi', 'reddedildi');
exception when duplicate_object then null; end $$;

create table if not exists public.listing_reports (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  -- Bildiren silinirse şikayet kalmalı: içerik hâlâ incelenmeli.
  reporter_id uuid references public.profiles(id) on delete set null,

  reason      public.report_reason not null,
  note        text check (note is null or char_length(btrim(note)) <= 1000),

  status      public.report_status not null default 'acik',
  admin_note  text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,

  created_at  timestamptz not null default now(),

  -- Aynı kişi aynı ilanı bir kez bildirebilir; tekrar bildirim listeyi
  -- şişirmekten başka bir şey yapmıyor.
  unique (listing_id, reporter_id)
);

create index if not exists listing_reports_open_idx
  on public.listing_reports (status, created_at desc)
  where status in ('acik', 'inceleniyor');

alter table public.listing_reports enable row level security;

-- Giriş yapmış herkes bildirebilir; kendi bildirimini görebilir.
drop policy if exists listing_reports_insert on public.listing_reports;
create policy listing_reports_insert on public.listing_reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists listing_reports_read_own on public.listing_reports;
create policy listing_reports_read_own on public.listing_reports
  for select using (reporter_id = auth.uid());

drop policy if exists listing_reports_admin on public.listing_reports;
create policy listing_reports_admin on public.listing_reports
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert on public.listing_reports to authenticated;
grant update, delete on public.listing_reports to authenticated;

-- ---------------------------------------------------------------------------
-- Bildirim fonksiyonu
--
-- Doğrudan insert yerine RPC: aynı ilanı tekrar bildirmek hata vermek
-- yerine sessizce mevcut kaydı güncelliyor. Kullanıcıya "zaten
-- bildirmiştiniz" demek yerine işlemi başarılı saymak daha doğru — amacı
-- zaten içeriği incelettirmek.
-- ---------------------------------------------------------------------------
create or replace function public.report_listing(
  p_listing_id bigint,
  p_reason     text,
  p_note       text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Şikayet için giriş yapmanız gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.listings where id = p_listing_id) then
    raise exception 'İlan bulunamadı.' using errcode = 'no_data_found';
  end if;

  insert into public.listing_reports (listing_id, reporter_id, reason, note)
  values (p_listing_id, v_user, p_reason::public.report_reason, nullif(btrim(p_note), ''))
  on conflict (listing_id, reporter_id) do update
    set reason     = excluded.reason,
        note       = excluded.note,
        status     = 'acik',
        created_at = now();
end;
$$;

grant execute on function public.report_listing(bigint, text, text) to authenticated;
