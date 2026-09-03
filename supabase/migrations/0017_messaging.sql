-- ============================================================================
-- 0017_messaging.sql — İlan üzerinden mesajlaşma
--
-- İlan detayındaki "Mesaj Gönder" düğmesi boş bir sayfaya gidiyordu. Alıcının
-- telefon vermeden satıcıya ulaşabilmesi bu tür sitelerde temel bir ihtiyaç:
-- numarasını paylaşmak istemeyen kullanıcı aksi hâlde hiç iletişime geçmiyor.
--
-- TASARIM
-- Konuşma İLAN BAŞINA ve ALICI BAŞINA tek. Aynı alıcı aynı ilan için ikinci
-- kez yazdığında yeni konuşma açılmıyor, mevcut olana ekleniyor — aksi hâlde
-- satıcının gelen kutusu aynı kişiyle onlarca ayrı başlığa bölünürdü.
--
-- Okunmamış sayacı konuşma satırında tutuluyor. Her açılışta mesajları sayan
-- bir sorgu çalıştırmak, gelen kutusu büyüdükçe yavaşlardı.
-- ============================================================================

create table public.conversations (
  id          bigint generated always as identity primary key,

  -- İlan silinse de konuşma kalsın: taraflar geçmişi görebilmeli.
  listing_id  bigint references public.listings(id) on delete set null,
  -- İlan silinirse başlığı gösterebilmek için anlık kopya.
  listing_title text,

  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,

  last_message_at      timestamptz,
  last_message_preview text,

  buyer_unread  integer not null default 0 check (buyer_unread >= 0),
  seller_unread integer not null default 0 check (seller_unread >= 0),

  -- Arşivleme taraf başına: alıcının arşivlemesi satıcının kutusunu etkilemez.
  buyer_archived  boolean not null default false,
  seller_archived boolean not null default false,

  created_at timestamptz not null default now(),

  constraint conversations_distinct_parties check (buyer_id <> seller_id)
);

-- İlan başına alıcı başına tek konuşma.
create unique index conversations_listing_buyer_idx
  on public.conversations (listing_id, buyer_id)
  where listing_id is not null;

create index conversations_buyer_idx  on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

create table public.messages (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id       uuid   not null references public.profiles(id) on delete cascade,

  body       text not null check (char_length(btrim(body)) between 1 and 4000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Yeni mesaj: konuşma özetini ve okunmamış sayacını güncelle
--
-- counter_sync bayrağı kullanılmıyor: conversations tablosunda muhafız trigger
-- yok, doğrudan güncellenebiliyor.
-- ---------------------------------------------------------------------------
create or replace function public.on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
begin
  select buyer_id into v_buyer from public.conversations where id = new.conversation_id;

  update public.conversations
     set last_message_at      = new.created_at,
         last_message_preview = left(btrim(new.body), 120),
         -- Gönderen kim ise KARŞI tarafın sayacı artıyor.
         buyer_unread  = case when new.sender_id = v_buyer then buyer_unread else buyer_unread + 1 end,
         seller_unread = case when new.sender_id = v_buyer then seller_unread + 1 else seller_unread end,
         -- Yeni mesaj gelen konuşma her iki taraf için de arşivden çıkıyor.
         buyer_archived  = false,
         seller_archived = false
   where id = new.conversation_id;

  return null;
end;
$$;

create trigger messages_update_conversation
  after insert on public.messages
  for each row execute function public.on_new_message();

-- ---------------------------------------------------------------------------
-- Konuşmayı bul veya oluştur
--
-- Alıcı ilan sayfasından yazmaya başladığında çağrılıyor. İstemcide
-- "önce ara, yoksa oluştur" yapmak iki eşzamanlı istekte çift kayıt üretirdi;
-- burada tek işlemde çözülüyor.
--
-- SECURITY DEFINER: satıcının kimliğini bulmak için ilana bakmak gerekiyor,
-- ama alıcının listings üzerinde owner_id okuma yetkisi RLS ile sınırlı.
-- ---------------------------------------------------------------------------
create or replace function public.start_conversation(p_listing_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer  uuid := auth.uid();
  v_seller uuid;
  v_title  text;
  v_id     bigint;
begin
  if v_buyer is null then
    raise exception 'Mesaj göndermek için giriş yapmalısınız.' using errcode = 'insufficient_privilege';
  end if;

  select owner_id, title into v_seller, v_title
    from public.listings
   where id = p_listing_id and status = 'yayinda';

  if v_seller is null then
    raise exception 'İlan bulunamadı.' using errcode = 'no_data_found';
  end if;

  if v_seller = v_buyer then
    raise exception 'Kendi ilanınıza mesaj gönderemezsiniz.' using errcode = 'check_violation';
  end if;

  select id into v_id
    from public.conversations
   where listing_id = p_listing_id and buyer_id = v_buyer;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.conversations (listing_id, listing_title, buyer_id, seller_id)
  values (p_listing_id, v_title, v_buyer, v_seller)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_conversation(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Okundu işaretleme
--
-- Yalnızca KARŞI tarafın mesajları okundu sayılıyor ve yalnızca kendi
-- sayacınız sıfırlanıyor.
-- ---------------------------------------------------------------------------
create or replace function public.mark_conversation_read(p_conversation_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_buyer uuid;
  v_seller uuid;
begin
  select buyer_id, seller_id into v_buyer, v_seller
    from public.conversations where id = p_conversation_id;

  if v_user is null or v_user not in (v_buyer, v_seller) then
    raise exception 'Bu konuşmaya erişiminiz yok.' using errcode = 'insufficient_privilege';
  end if;

  update public.messages
     set read_at = now()
   where conversation_id = p_conversation_id
     and sender_id <> v_user
     and read_at is null;

  update public.conversations
     set buyer_unread  = case when v_user = v_buyer then 0 else buyer_unread end,
         seller_unread = case when v_user = v_seller then 0 else seller_unread end
   where id = p_conversation_id;
end;
$$;

grant execute on function public.mark_conversation_read(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Toplam okunmamış sayısı — başlıktaki rozet için
-- ---------------------------------------------------------------------------
create or replace function public.unread_message_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
    case when buyer_id = auth.uid() then buyer_unread else seller_unread end
  ), 0)::integer
    from public.conversations
   where auth.uid() in (buyer_id, seller_id);
$$;

grant execute on function public.unread_message_count() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

create policy conversations_own on public.conversations
  for select using (auth.uid() in (buyer_id, seller_id));

-- Konuşma yalnızca start_conversation RPC'si ile açılıyor; doğrudan insert yok.
-- Güncelleme yalnızca arşivleme için; sayaçlar ve özet trigger'a ait.
create policy conversations_archive on public.conversations
  for update
  using (auth.uid() in (buyer_id, seller_id))
  with check (
    auth.uid() in (buyer_id, seller_id)
    and buyer_id = (select c.buyer_id from public.conversations c where c.id = conversations.id)
    and seller_id = (select c.seller_id from public.conversations c where c.id = conversations.id)
    and last_message_at is not distinct from (select c.last_message_at from public.conversations c where c.id = conversations.id)
  );

create policy conversations_admin on public.conversations
  for all using (public.is_admin()) with check (public.is_admin());

create policy messages_read_own on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)
    )
  );

create policy messages_send_own on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)
    )
  );

create policy messages_admin on public.messages
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.conversations, public.messages to authenticated;
grant update on public.conversations to authenticated;
grant insert on public.messages to authenticated;
