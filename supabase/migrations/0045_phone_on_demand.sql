-- ============================================================================
-- 0045 — İlan telefonu sayfa kaynağında durmasın
--
-- Detay sayfasında "Telefonu Göster" düğmesi vardı ama numara zaten sayfanın
-- içindeydi: WhatsApp bağlantısında (href="https://wa.me/90...") ve istemci
-- bileşenine geçirilen özelliklerin HTML'e gömülen kopyasında. Yani düğme
-- yalnızca gözden saklıyordu; sayfayı indiren herhangi bir betik tek istekle
-- numarayı alıyordu. Sitedeki bütün numaraları toplamak için tıklamaya bile
-- gerek yoktu.
--
-- Numara artık sayfayla gelmiyor; kullanıcı düğmeye bastığında bu fonksiyon
-- veriyor. Toplu kazıma imkânsız olmuyor ama ilan başına ayrı bir çağrı
-- gerekiyor: kayıt altına alınabilir ve gerekirse sınırlanabilir hâle geliyor.
--
-- NEDEN GİRİŞ ZORUNLU DEĞİL
-- Sahiplenmek isteyen kişiyi arama noktasında kayıt olmaya zorlamak, ilanın
-- asıl amacına zarar verir. Asıl kazanç zaten numaranın kaynak kodda
-- durmamasında.
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
  -- Yalnızca yayındaki ve süresi geçmemiş ilanın numarası verilir; pasif ya
  -- da süresi dolmuş ilanın sahibi artık aranmak istemiyor olabilir.
  select l.contact_phone into v_phone
    from public.listings l
   where l.id = p_listing_id
     and l.status = 'yayinda'
     and (l.expires_at is null or l.expires_at > now());

  return v_phone;
end;
$$;

comment on function public.get_listing_contact(bigint) is
  'İlan telefonunu istek üzerine döndürür. Numara sayfa kaynağında bulunmasın diye.';

revoke all on function public.get_listing_contact(bigint) from public;
grant execute on function public.get_listing_contact(bigint) to anon, authenticated;
