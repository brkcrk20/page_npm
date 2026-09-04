-- ============================================================================
-- 0053 — Kuraldan önce açılmış bireysel hayvan satış ilanlarını düzelt
--
-- 0051/0052 bireysel hesapların hayvan satış ilanı açmasını engelledi ama
-- kural yürürlüğe girmeden önce açılmış ilanlara dokunmadı. Sitede bireysel
-- bir hesabın "1 TL" fiyatlı köpek ilanı duruyordu: kullanıcı ücret almak
-- istemediği hâlde form fiyat zorunlu tuttuğu için en küçük değeri yazmış.
--
-- Bu ilanlar ücretsiz sahiplendirmeye çevriliyor. Fiyat alanı boşaltılıyor
-- çünkü listings_price_matches_kind kısıtı sahiplendirmede fiyat kabul
-- etmiyor.
--
-- KAPSAM
-- Yalnızca hayvan kategorileri. Malzeme (Supply) ve güvercin (Pigeon)
-- kuralın dışında; oradaki bireysel satış ilanlarına dokunulmuyor.
--
-- Muhafızlar bu yazmayı geri almasın diye sayaç bayrağı açılıyor; göç
-- doğrudan bağlantıyla çalıştığı için guard_bypass zaten geçerli ama
-- açıkça belirtmek ileride betikten çalıştırılırsa da korunmasını sağlıyor.
-- ============================================================================

do $$
declare
  v_sayi integer;
begin
  perform set_config('app.counter_sync', 'on', true);

  update public.listings l
     set kind  = 'sahiplendirme',
         price = null
   where l.kind = 'satilik'
     and exists (
       select 1 from public.profiles p
        where p.id = l.owner_id and p.account_type <> 'kurumsal'
     )
     and exists (
       select 1 from public.categories c
        where c.id = l.category_id and c.code not in ('Supply', 'Pigeon')
     );

  get diagnostics v_sayi = row_count;
  perform set_config('app.counter_sync', 'off', true);

  raise notice 'Sahiplendirmeye çevrilen ilan sayısı: %', v_sayi;
end;
$$;
