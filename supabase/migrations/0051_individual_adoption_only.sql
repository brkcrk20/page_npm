-- ============================================================================
-- 0051 — Bireysel hesaplar hayvanı satamaz, sahiplendirir
--
-- Sitede herkes hayvan için satılık ilan açabiliyordu. Oysa hayvan satışı
-- kayıtlı üretici / işletme işi; bireysel bir üyenin evindeki yavruyu
-- ücretle satması hem mevzuat açısından sorunlu hem de sahiplendirme
-- ilanlarının arasına ücretli ilan karıştırıyor.
--
-- Kural: hayvan kategorilerinde SATILIK ilanı yalnızca kurumsal hesaplar
-- açabilir. Bireysel hesaplar aynı hayvanı ücretsiz sahiplendirme olarak
-- ilan edebilir.
--
-- PET MALZEMELERİ KAPSAM DIŞI
-- İkinci el kafes ya da akvaryum satmak hayvan satışı değil; bireysel
-- üyeler orada satış yapmaya devam ediyor. Kuralı bütün kategorilere
-- uygulamak al-sat bölümünü tümüyle işlevsiz bırakırdı.
--
-- NEDEN SESSİZCE DÜZELTMİYORUZ
-- Diğer muhafızlar korunan alanı eski değerine döndürüyor. Burada öyle
-- yapmak, kullanıcının "satılık" diye açtığı ilanın sessizce ücretsiz
-- sahiplendirmeye dönüşmesi olurdu. Kural kullanıcının bilmesi gereken bir
-- kural; hata mesajıyla söyleniyor.
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

  -- Pet malzemeleri hayvan değil; kapsam dışı.
  if v_code = 'Supply' then
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

drop trigger if exists listings_individual_adoption_only_trigger on public.listings;
create trigger listings_individual_adoption_only_trigger
  before insert or update of kind, category_id, owner_id on public.listings
  for each row execute function public.listings_individual_adoption_only();
