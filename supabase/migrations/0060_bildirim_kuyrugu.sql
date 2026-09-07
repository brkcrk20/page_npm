-- 0060 — E-posta bildirim kuyruğu.
--
-- Bugün biri ilanınıza mesaj attığında hiçbir haber almıyorsunuz: siteye
-- tekrar girip bakmanız gerekiyor. Beş kullanıcıyla bu görünmüyor; ilk
-- gerçek kullanıcılarda en büyük kayıp noktası burası olur. Mesaja
-- karşılık gelmeyen bir ilan, ilan sahibinin ilgisizliği değil sistemin
-- eksikliği.
--
-- KUYRUK, DOĞRUDAN GÖNDERİM DEĞİL
-- E-posta gönderimi ağ işi: sağlayıcı yavaşlarsa ya da hata verirse
-- mesajın kendisinin kaydedilmesi bundan etkilenmemeli. Tetikleyici
-- yalnızca kuyruğa bir satır yazıyor; göndermeyi uygulama tarafındaki
-- işçi yapıyor. Sağlayıcı çökse bile mesaj kaydediliyor ve bildirim
-- kuyrukta bekliyor.
--
-- SPAM KORUMASI KUYRUKTA
-- Karşılıklı hızlı yazışmada her mesaj için e-posta atmak, kullanıcıyı
-- kendi sohbetiyle boğar. Aynı görüşme için bekleyen bir bildirim varsa
-- yenisi eklenmiyor; kullanıcı siteye girip okuduğunda da bekleyenler
-- iptal ediliyor.

begin;

create extension if not exists pg_net with schema extensions;

-- --------------------------------------------------------------------------
-- Kullanıcı tercihi
-- --------------------------------------------------------------------------

alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

comment on column public.profiles.email_notifications is
  'E-posta bildirimi almak istiyor mu? Kapalıysa kuyruğa hiç yazılmıyor.';

-- --------------------------------------------------------------------------
-- Kuyruk
-- --------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('bekliyor', 'gonderildi', 'hata', 'iptal');
  end if;
end
$$;

create table if not exists public.notification_outbox (
  id           bigint generated always as identity primary key,
  kind         text not null,
  user_id      uuid references public.profiles(id) on delete cascade,
  -- E-posta anlık kopyalanıyor: auth.users'a her okumada gitmemek için ve
  -- kullanıcı adresini değiştirse bile bildirimin gideceği adres belli olsun.
  email        text not null,
  subject      text not null,
  body_text    text not null,
  body_html    text,
  -- Aynı olayın tekrar kuyruğa girmesini engelleyen anahtar.
  dedupe_key   text,
  status       public.notification_status not null default 'bekliyor',
  attempts     smallint not null default 0,
  last_error   text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

comment on table public.notification_outbox is
  'Gönderilmeyi bekleyen e-posta bildirimleri. İşçi: /api/bildirim/gonder';

-- Bekleyen aynı olaydan bir tane. Gönderilmiş satırlar tekrarı
-- engellemesin diye kısmi indeks.
create unique index if not exists notification_outbox_dedupe_idx
  on public.notification_outbox (dedupe_key)
  where status = 'bekliyor' and dedupe_key is not null;

create index if not exists notification_outbox_bekleyen_idx
  on public.notification_outbox (created_at)
  where status = 'bekliyor';

-- Kuyruk kimseye açık değil: içinde e-posta adresleri ve mesaj özetleri var.
alter table public.notification_outbox enable row level security;

drop policy if exists notification_outbox_admin on public.notification_outbox;
create policy notification_outbox_admin on public.notification_outbox
  for all using (public.is_admin()) with check (public.is_admin());

commit;
