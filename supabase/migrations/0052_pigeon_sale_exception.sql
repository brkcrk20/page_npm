-- ============================================================================
-- 0052 — Güvercin, bireysel satış kuralının dışında
--
-- 0051 hayvan kategorilerinde satılık ilanını kurumsal hesaplara kilitledi.
-- Gerekçe kedi köpek üretimiydi: bireysel bir üyenin evindeki yavruyu
-- ücretle satması hem mevzuat açısından sorunlu hem de sahiplendirme
-- listesini kirletiyordu.
--
-- Güvercinde durum başka. Güvercincilik Türkiye'de neredeyse tamamen
-- bireysel yetiştiriciler arasında yürüyen bir alışveriş; kuralı orada da
-- uygulamak, sitenin ayrı bir dikey olarak kurduğu güvercin bölümünü
-- kullanılamaz hâle getiriyordu — bölümün var oluş sebebi tam olarak o
-- topluluk.
--
-- Kapsam dışı kategoriler tek yerde: Supply (malzeme) ve Pigeon.
-- ============================================================================

create or replace function public.listings_individual_adoption_only()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_account public.account_type;
  v_code    text;
begin
  if public.guard_bypass() then
    return new;
  end if;

  if new.kind <> 'satilik' then
    return new;
  end if;

  select c.code into v_code from public.categories c where c.id = new.category_id;

  -- Supply: ikinci el kafes satmak hayvan satışı değil.
  -- Pigeon: bireysel yetiştiriciler arasındaki alışveriş bölümün kendisi.
  if v_code in ('Supply', 'Pigeon') then
    return new;
  end if;

  select p.account_type into v_account
    from public.profiles p
   where p.id = coalesce(new.owner_id, old.owner_id);

  if v_account is distinct from 'kurumsal' then
    raise exception 'Bireysel hesaplar hayvan satış ilanı veremez. Ücretsiz sahiplendirme ilanı verebilir, satış için kurumsal hesaba geçebilirsiniz.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
