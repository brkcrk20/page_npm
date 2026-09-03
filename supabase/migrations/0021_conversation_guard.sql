-- ============================================================================
-- 0021_conversation_guard.sql — Konuşma sayaçlarını istemci yazamasın
--
-- SORUN
-- conversations üzerindeki güncelleme politikası korunacak kolonları tek tek
-- sayıyordu (buyer_id, seller_id, last_message_at) ama okunmamış sayaçları
-- listede yoktu. Sonuç: alıcı, satıcının okunmamış sayacını sıfırlayabiliyordu.
--
--   update conversations set seller_unread = 0 -> geçiyordu
--
-- Pratikte bu, mesaj gönderip karşı taraftaki bildirim rozetini gizlemek
-- demek. Spam açısından da kötüye kullanılabilir.
--
-- ÇÖZÜM
-- İlanlarda ve hizmet kayıtlarında işe yarayan desene geçiliyor: korumalı
-- kolonların tek otoritesi bir BEFORE UPDATE trigger'ı. Politikada kolon
-- saymak, yeni kolon eklendiğinde listeye eklemeyi unutmak anlamına geliyor —
-- tam olarak burada olan da bu.
--
-- Kullanıcının değiştirebileceği tek şey KENDİ arşiv bayrağı.
-- ============================================================================

create or replace function public.conversations_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  -- Sayaçlar, özet ve taraflar yalnızca on_new_message / mark_conversation_read
  -- tarafından yazılır. Bu iki fonksiyon SECURITY DEFINER olduğu için
  -- muhafızdan muaf değil; onları ayırt etmek yerine buradaki kuralı
  -- "istemci hiçbirine dokunamaz" olarak tutuyoruz ve fonksiyonlar bayrak
  -- açarak geçiyor.
  if not public.counter_sync_active() then
    new.id                   := old.id;
    new.listing_id           := old.listing_id;
    new.listing_title        := old.listing_title;
    new.buyer_id             := old.buyer_id;
    new.seller_id            := old.seller_id;
    new.last_message_at      := old.last_message_at;
    new.last_message_preview := old.last_message_preview;
    new.buyer_unread         := old.buyer_unread;
    new.seller_unread        := old.seller_unread;
    new.created_at           := old.created_at;

    -- Arşiv bayrağı taraf başına: kişi yalnızca KENDİ tarafını değiştirebilir.
    if auth.uid() = old.buyer_id then
      new.seller_archived := old.seller_archived;
    elsif auth.uid() = old.seller_id then
      new.buyer_archived := old.buyer_archived;
    else
      new.buyer_archived  := old.buyer_archived;
      new.seller_archived := old.seller_archived;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_guard_trigger on public.conversations;
create trigger conversations_guard_trigger
  before update on public.conversations
  for each row execute function public.conversations_guard();

-- Politika artık yalnızca sahipliğe bakıyor; korumayı trigger yapıyor.
drop policy if exists conversations_archive on public.conversations;
create policy conversations_archive on public.conversations
  for update
  using (auth.uid() in (buyer_id, seller_id))
  with check (auth.uid() in (buyer_id, seller_id));

-- ---------------------------------------------------------------------------
-- Sayaç yazan fonksiyonlar muhafızdan geçebilmeli
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

  perform set_config('app.counter_sync', 'on', true);

  update public.conversations
     set last_message_at      = new.created_at,
         last_message_preview = left(btrim(new.body), 120),
         buyer_unread  = case when new.sender_id = v_buyer then buyer_unread else buyer_unread + 1 end,
         seller_unread = case when new.sender_id = v_buyer then seller_unread + 1 else seller_unread end,
         buyer_archived  = false,
         seller_archived = false
   where id = new.conversation_id;

  perform set_config('app.counter_sync', 'off', true);
  return null;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_buyer  uuid;
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

  perform set_config('app.counter_sync', 'on', true);

  update public.conversations
     set buyer_unread  = case when v_user = v_buyer then 0 else buyer_unread end,
         seller_unread = case when v_user = v_seller then 0 else seller_unread end
   where id = p_conversation_id;

  perform set_config('app.counter_sync', 'off', true);
end;
$$;
