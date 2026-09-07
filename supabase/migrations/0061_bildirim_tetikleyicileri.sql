-- 0061 — Bildirimleri kuyruğa yazan tetikleyiciler ve gönderim çağrısı.
--
-- İki olay bildirim üretiyor:
--   1) Görüşmeye yeni mesaj gelmesi  → karşı tarafa
--   2) İlan süresinin dolmasına az kalması → ilan sahibine
--
-- Ayarlar public.app_settings'te DEĞİL: orası herkese açık okunuyor
-- (alt bilgideki iletişim bilgisi oradan geliyor) ve burada bir paylaşılan
-- gizli anahtar tutuluyor. Ayrı, hiçbir politikası olmayan bir tabloya
-- yazılıyor; yalnızca servis anahtarı ve tanımlayıcı fonksiyonlar okuyor.

begin;

create table if not exists public.private_settings (
  key   text primary key,
  value jsonb not null
);

alter table public.private_settings enable row level security;
-- Politika YOK: anon ve authenticated hiçbir satır göremiyor.
-- service_role ve doğrudan bağlantı RLS'i atlıyor.

comment on table public.private_settings is
  'Herkese açık olmaması gereken ayarlar. app_settings public okunabilir, buraya sır yazılmaz.';

insert into public.private_settings (key, value)
values ('notify', jsonb_build_object('endpoint', '', 'secret', ''))
on conflict (key) do nothing;

-- --------------------------------------------------------------------------
-- Gönderim çağrısı
-- --------------------------------------------------------------------------

/**
 * Kuyruğu boşaltması için uygulamaya haber verir.
 *
 * pg_net eşzamansız çalışıyor: istek kuyruğa bırakılıyor ve tetikleyici
 * beklemeden dönüyor. Bu önemli — HTTP çağrısını senkron yapmak, mesaj
 * kaydını e-posta sağlayıcısının hızına bağlamak olurdu.
 *
 * Adres tanımlı değilse sessizce hiçbir şey yapmıyor: bildirim kuyrukta
 * kalıyor ve ayar girildiğinde zamanlanmış iş onu gönderiyor.
 */
create or replace function public.bildirim_tetikle()
returns void
language plpgsql
security definer
set search_path to 'public', 'net'
as $$
declare
  v_ayar jsonb;
  v_adres text;
  v_sir text;
begin
  select value into v_ayar from public.private_settings where key = 'notify';
  v_adres := coalesce(v_ayar->>'endpoint', '');
  v_sir := coalesce(v_ayar->>'secret', '');

  if v_adres = '' or v_sir = '' then
    return;
  end if;

  perform net.http_post(
    url := v_adres,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-bildirim-anahtari', v_sir),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
exception when others then
  -- Bildirim gönderilememesi mesajın kaydedilmesini engellemesin.
  raise warning 'bildirim_tetikle: %', sqlerrm;
end;
$$;

-- --------------------------------------------------------------------------
-- Yeni mesaj bildirimi
-- --------------------------------------------------------------------------

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

  -- Alıcı, mesajı yazmayan taraf.
  v_alici := case when new.sender_id = v_gorusme.buyer_id
                  then v_gorusme.seller_id else v_gorusme.buyer_id end;
  if v_alici is null or v_alici = new.sender_id then
    return new;
  end if;

  select p.email_notifications, u.email
    into v_tercih, v_eposta
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = v_alici;

  -- Tercihi kapalı olana, e-postası olmayana ve demo hesaba yazılmıyor.
  if coalesce(v_tercih, true) is not true or coalesce(v_eposta, '') = '' then
    return new;
  end if;
  if exists (select 1 from public.profiles where id = v_alici and is_demo) then
    return new;
  end if;

  select coalesce(nullif(p.company_title, ''), nullif(p.full_name, ''), '@' || p.username, 'Bir kullanıcı')
    into v_gonderen
    from public.profiles p where p.id = new.sender_id;

  v_baslik := coalesce(nullif(v_gorusme.listing_title, ''), 'ilanınız');

  insert into public.notification_outbox (kind, user_id, email, subject, body_text, dedupe_key)
  values (
    'yeni_mesaj',
    v_alici,
    v_eposta,
    v_gonderen || ' ilanınıza mesaj gönderdi',
    v_gonderen || ' adlı kullanıcı "' || v_baslik || '" ilanınız hakkında mesaj gönderdi.',
    -- Görüşme başına bekleyen tek bildirim: karşılıklı hızlı yazışmada
    -- her mesaj için e-posta atmak kullanıcıyı kendi sohbetiyle boğardı.
    'mesaj:' || v_gorusme.id::text || ':' || v_alici::text
  )
  on conflict do nothing;

  perform public.bildirim_tetikle();
  return new;
end;
$$;

drop trigger if exists messages_bildirim_trigger on public.messages;
create trigger messages_bildirim_trigger
  after insert on public.messages
  for each row execute function public.bildirim_yeni_mesaj();

-- --------------------------------------------------------------------------
-- Okunduğunda bekleyen bildirimi iptal et
-- --------------------------------------------------------------------------

/**
 * Kullanıcı siteye girip mesajı okuduysa e-posta artık gereksiz.
 *
 * Okuduktan sonra gelen "yeni mesajınız var" e-postası kullanıcıya
 * sistemin kendisini takip etmediğini düşündürüyor.
 */
create or replace function public.bildirim_okundu_iptal()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.buyer_unread = 0 and coalesce(old.buyer_unread, 0) > 0 then
    update public.notification_outbox set status = 'iptal'
     where status = 'bekliyor' and dedupe_key = 'mesaj:' || new.id::text || ':' || new.buyer_id::text;
  end if;
  if new.seller_unread = 0 and coalesce(old.seller_unread, 0) > 0 then
    update public.notification_outbox set status = 'iptal'
     where status = 'bekliyor' and dedupe_key = 'mesaj:' || new.id::text || ':' || new.seller_id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_bildirim_iptal_trigger on public.conversations;
create trigger conversations_bildirim_iptal_trigger
  after update of buyer_unread, seller_unread on public.conversations
  for each row execute function public.bildirim_okundu_iptal();

-- --------------------------------------------------------------------------
-- İlan süresi bildirimi
-- --------------------------------------------------------------------------

/**
 * Süresi üç gün içinde dolacak ilanların sahiplerine hatırlatma.
 *
 * İlan sessizce yayından kalkıyor ve sahibi bunu ancak tesadüfen fark
 * ediyordu. Üç gün, yenilemek için makul bir süre.
 */
create or replace function public.bildirim_ilan_suresi()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sayi integer;
begin
  insert into public.notification_outbox (kind, user_id, email, subject, body_text, dedupe_key)
  select
    'ilan_suresi',
    l.owner_id,
    u.email,
    '"' || l.title || '" ilanınızın süresi doluyor',
    'İlanınızın yayın süresi ' || to_char(l.expires_at, 'DD.MM.YYYY') ||
      ' tarihinde doluyor. İlanlarım sayfasından tek tıkla yenileyebilirsiniz.',
    'sure:' || l.id::text || ':' || to_char(l.expires_at, 'YYYYMMDD')
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  join auth.users u on u.id = l.owner_id
  where l.status = 'yayinda'
    and l.expires_at is not null
    and l.expires_at between now() and now() + interval '3 days'
    and p.email_notifications
    and not p.is_demo
    and coalesce(u.email, '') <> ''
  on conflict do nothing;

  get diagnostics v_sayi = row_count;
  if v_sayi > 0 then
    perform public.bildirim_tetikle();
  end if;
  return v_sayi;
end;
$$;

commit;
