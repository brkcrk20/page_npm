-- ============================================================================
-- 0054 — İletişim numarası yalnızca üyelere
--
-- 0045 numarayı sayfa kaynağından çıkarıp istek üzerine veren bir
-- fonksiyona bağladı ve fonksiyonu anon'a da açtı; gerekçe, sahiplenmek
-- isteyeni arama noktasında kayda zorlamamaktı.
--
-- Pratikte bu, numarayı hâlâ herkese açık bırakıyor: tek bir istekle
-- numara alınabildiği için üyeliksiz toplama devam ediyor ve ilan sahibi
-- kiminle konuştuğunu hiç bilmiyor. Numara artık giriş isteyen bir bilgi.
--
-- Fonksiyon anon'a açık kalıyor ama oturumsuz çağrıda hata veriyor:
-- istemci "giriş gerekiyor" mesajını bu koddan ayırt edip kullanıcıya
-- üyelik daveti gösteriyor.
-- ============================================================================

create or replace function public.get_listing_contact(p_listing_id bigint)
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'İletişim bilgisini görmek için giriş yapmalısınız.'
      using errcode = '42501';
  end if;

  select l.contact_phone into v_phone
    from public.listings l
   where l.id = p_listing_id
     and l.status = 'yayinda'
     and (l.expires_at is null or l.expires_at > now());

  return v_phone;
end;
$$;
