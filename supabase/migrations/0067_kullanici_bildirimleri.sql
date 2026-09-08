-- 0067 — Site içi bildirimler
--
-- NEDEN AYRI TABLO
-- notification_outbox bir GÖNDERİM kuyruğu: satırlar gönderilince işi biter,
-- kullanıcı onları hiçbir yerde göremiyor. Üst bantta bir zil olacaksa
-- kullanıcının kendi göreceği, okundu bilgisi tutulan ayrı bir kayda ihtiyaç
-- var. İkisini tek tabloya sıkıştırmak, gönderim durumu ile okunma durumunu
-- aynı sütuna bindirmek olurdu: "gönderildi" ile "kullanıcı okudu" farklı
-- şeyler.
--
-- E-POSTA ŞART DEĞİL
-- Buradaki satır e-posta sağlayıcısı tanımlı olmasa da görünüyor. Duyuru
-- gönderen yönetici, e-posta ayarı yapılmadığı için hiç kimseye ulaşamamak
-- yerine en azından siteye giren herkese ulaşıyor.

create table if not exists public.user_notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,

  title       text not null check (char_length(btrim(title)) between 2 and 120),
  body        text not null check (char_length(btrim(body)) between 2 and 2000),
  -- Tıklanınca gidilecek yer. Site içi olmak zorunda: bildirim dışarıya
  -- yönlendiren bir kanal değil.
  link        text check (link is null or link ~ '^/'),
  level       text not null default 'bilgi' check (level in ('bilgi', 'uyari', 'duyuru')),

  is_read     boolean not null default false,
  read_at     timestamptz,

  -- Yönetimden gönderildiyse gönderen ve gönderim yığını.
  sent_by     uuid references public.profiles(id) on delete set null,
  batch_id    uuid,

  created_at  timestamptz not null default now()
);

-- Kaynağı ayırt etmek için: 'duyuru' (yönetimden), 'mesaj', 'ilan_durumu'.
alter table public.user_notifications
  add column if not exists kind text not null default 'duyuru';

-- Aynı olaydan iki satır olmasın (ör. aynı görüşmeye üst üste gelen mesaj).
alter table public.user_notifications
  add column if not exists dedupe_key text;

create index if not exists user_notifications_kullanici_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_okunmamis_idx
  on public.user_notifications (user_id)
  where not is_read;

create index if not exists user_notifications_yigin_idx
  on public.user_notifications (batch_id)
  where batch_id is not null;

create unique index if not exists user_notifications_dedupe_idx
  on public.user_notifications (dedupe_key)
  where dedupe_key is not null and not is_read;

alter table public.user_notifications enable row level security;

-- Kullanıcı yalnızca kendi bildirimlerini görüyor ve yalnızca okundu
-- işaretleyebiliyor. Kendi kendine bildirim YAZAMIYOR: yazma yetkisi
-- tetikleyicilerde (security definer) ve yönetimde.
drop policy if exists user_notifications_read_own on public.user_notifications;
create policy user_notifications_read_own on public.user_notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_notifications_mark_read on public.user_notifications;
create policy user_notifications_mark_read on public.user_notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_notifications_admin on public.user_notifications;
create policy user_notifications_admin on public.user_notifications
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.user_notifications is
  'Kullanıcının üst banttaki zilde gördüğü bildirimler. Gönderim kuyruğu değil.';

-- ---------------------------------------------------------------------------
-- Okunmamış sayısı ve toplu okundu işaretleme
-- ---------------------------------------------------------------------------

create or replace function public.bildirimleri_okundu_isaretle()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sayi integer;
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekiyor.' using errcode = 'insufficient_privilege';
  end if;

  update public.user_notifications
     set is_read = true, read_at = now()
   where user_id = auth.uid() and not is_read;

  get diagnostics v_sayi = row_count;
  return v_sayi;
end;
$$;

revoke all on function public.bildirimleri_okundu_isaretle() from public, anon;
grant execute on function public.bildirimleri_okundu_isaretle() to authenticated;

-- ---------------------------------------------------------------------------
-- Yeni mesaj bildirimi artık zile de düşüyor
--
-- E-posta kuyruğuna yazan tetikleyicinin aynısı; tek fark site içi satırın
-- da eklenmesi. E-posta tercihi kapalı olan kullanıcı e-posta almıyor ama
-- zilde görüyor: tercih "bana e-posta atma" demek, "beni haberdar etme"
-- demek değil.
-- ---------------------------------------------------------------------------

create or replace function public.bildirim_yeni_mesaj()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_alici uuid;
  v_gorusme public.conversations%rowtype;
  v_eposta text;
  v_tercih boolean;
  v_gonderen text;
  v_baslik text;
begin
  select * into v_gorusme from public.conversations where id = new.conversation_id;
  if not found then
    return new;
  end if;

  v_alici := case when new.sender_id = v_gorusme.buyer_id
                  then v_gorusme.seller_id else v_gorusme.buyer_id end;
  if v_alici is null or v_alici = new.sender_id then
    return new;
  end if;

  if exists (select 1 from public.profiles where id = v_alici and is_demo) then
    return new;
  end if;

  select coalesce(nullif(p.company_title, ''), nullif(p.full_name, ''), '@' || p.username, 'Bir kullanıcı')
    into v_gonderen
    from public.profiles p where p.id = new.sender_id;

  v_baslik := coalesce(nullif(v_gorusme.listing_title, ''), 'ilanınız');

  -- Site içi bildirim: e-posta tercihinden bağımsız.
  insert into public.user_notifications (user_id, kind, title, body, link, dedupe_key)
  values (
    v_alici,
    'mesaj',
    v_gonderen || ' mesaj gönderdi',
    '"' || v_baslik || '" hakkında yeni mesajınız var.',
    '/mesajlarim',
    'mesaj:' || v_gorusme.id::text || ':' || v_alici::text
  )
  on conflict do nothing;

  select p.email_notifications, u.email
    into v_tercih, v_eposta
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = v_alici;

  if coalesce(v_tercih, true) is not true or coalesce(v_eposta, '') = '' then
    return new;
  end if;

  insert into public.notification_outbox (kind, user_id, email, subject, body_text, dedupe_key)
  values (
    'yeni_mesaj',
    v_alici,
    v_eposta,
    v_gonderen || ' ilanınıza mesaj gönderdi',
    v_gonderen || ' adlı kullanıcı "' || v_baslik || '" ilanınız hakkında mesaj gönderdi.',
    'mesaj:' || v_gorusme.id::text || ':' || v_alici::text
  )
  on conflict do nothing;

  perform public.bildirim_tetikle();
  return new;
end;
$$;
