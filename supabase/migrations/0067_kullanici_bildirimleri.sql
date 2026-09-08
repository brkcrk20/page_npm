-- 0067 — Site içi bildirimler (yönetimden kullanıcıya)
--
-- NEDEN E-POSTA DEĞİL
-- Kuyrukta duran notification_outbox e-posta gönderiyor ve bir sağlayıcı
-- anahtarı gerektiriyor; anahtar tanımlanana kadar hiçbir bildirim
-- ulaşmıyor. Site içi bildirim ilk günden çalışıyor, kullanıcı siteye
-- girdiğinde görüyor. İkisi birbirini dışlamıyor: yönetim isterse aynı
-- bildirimi e-posta olarak da kuyruğa bırakabiliyor.
--
-- OKUNDU BİLGİSİ SATIRDA
-- Herkese giden tek bir duyuru satırı tutup okunma durumunu ayrı tabloda
-- saklamak daha az yer kaplardı ama "bu kullanıcı bunu gördü mü" sorusunu
-- her okumada bir birleştirmeye çeviriyordu. Kullanıcı başına satır,
-- okuma tarafını tek indeksle çözüyor — bildirim hacmi ilan hacminin
-- yanında küçük.

create table public.user_notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,

  title       text not null check (char_length(btrim(title)) between 2 and 120),
  body        text not null check (char_length(btrim(body)) between 2 and 2000),
  -- Bildirime basınca gidilecek yer. Site içi yol ("/kopek-ilanlari") ya da
  -- boş. Dış adres kabul edilmiyor: bildirim kutusu bir reklam kanalına
  -- dönüşmesin ve kimse kullanıcıyı siteden çıkarmasın.
  link        text check (link is null or link ~ '^/'),

  -- Duyuru mu, uyarı mı, bilgi mi. Rengi bu belirliyor.
  level       text not null default 'bilgi' check (level in ('bilgi', 'uyari', 'duyuru')),

  is_read     boolean not null default false,
  read_at     timestamptz,

  -- Gönderen yönetici. Silinirse bildirim kalıyor, izi kayboluyor.
  sent_by     uuid references public.profiles(id) on delete set null,
  -- Aynı toplu gönderimin satırlarını bir arada tutan numara; yönetim
  -- panelinde "şu duyuru 412 kişiye gitti" diyebilmek için.
  batch_id    uuid,

  created_at  timestamptz not null default now()
);

create index user_notifications_kullanici_idx
  on public.user_notifications (user_id, created_at desc);

-- Okunmamış sayacı başlıktaki rozette her sayfa açılışında okunuyor;
-- kısmi indeks bu sorguyu tabloyu taramadan cevaplıyor.
create index user_notifications_okunmamis_idx
  on public.user_notifications (user_id)
  where not is_read;

create index user_notifications_yigin_idx
  on public.user_notifications (batch_id)
  where batch_id is not null;

alter table public.user_notifications enable row level security;

-- Kullanıcı yalnızca kendi bildirimlerini görüyor ve yalnızca okundu
-- işaretleyebiliyor. Kendine bildirim YAZAMIYOR: yazma yetkisi yalnızca
-- yönetimde, gönderim servis anahtarıyla yapılıyor.
create policy user_notifications_read_own on public.user_notifications
  for select using (user_id = auth.uid() or public.is_admin());

create policy user_notifications_mark_read on public.user_notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_notifications_admin on public.user_notifications
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.user_notifications is
  'Yönetimden kullanıcıya giden site içi bildirimler. Toplu gönderim batch_id ile gruplanır.';

/**
 * Okunmamış bildirim sayısı.
 *
 * Başlıktaki rozet için. Satırları çekip saymak yerine tek sayı dönüyor:
 * rozet her sayfa yüklemesinde soruluyor.
 */
create or replace function public.unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path to 'public'
as $$
  select count(*)::integer
    from public.user_notifications
   where user_id = auth.uid() and not is_read;
$$;

grant execute on function public.unread_notification_count() to authenticated;
