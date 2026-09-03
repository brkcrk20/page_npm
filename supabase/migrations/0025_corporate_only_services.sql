-- ============================================================================
-- 0025_corporate_only_services.sql — İşletme kaydı yalnızca kurumsal hesaplara
--
-- SORUN 1
-- Veteriner, pet oteli, kuaför gibi rehberlere HERKES kayıt oluşturabiliyordu.
-- Bunlar işletme kayıtları: adres, çalışma saatleri, vergi bilgisi, yorum ve
-- puanlama taşıyor. Bireysel bir kullanıcının buraya kayıt açması, rehberi
-- kirletmekten başka bir işe yaramıyor ve moderasyon yükünü büyütüyordu.
--
-- SORUN 2 (asıl açık)
-- profiles üzerindeki güncelleme politikası korunacak kolonları tek tek
-- sayıyordu ve account_type listede YOKTU. Yani kullanıcı kendi hesap tipini
-- tek bir istekle 'kurumsal' yapabiliyordu:
--
--   patch /profiles?id=eq.<kendi> {"account_type":"kurumsal"}  -> geçiyordu
--
-- Hesap tipine bir yetki bağlanacaksa önce bu kapatılmalı; aksi halde kural
-- kâğıt üzerinde kalırdı.
--
-- ÇÖZÜM
-- Korumanın otoritesi politikadan muhafız trigger'ına taşınıyor — ilanlarda,
-- konuşmalarda ve hizmet kayıtlarında işe yarayan desen. Politikada kolon
-- saymak, yeni kolon eklendiğinde listeye eklemeyi unutmak demek; account_type
-- tam olarak böyle unutulmuştu.
--
-- Kurumsala geçiş İMKÂNSIZ değil, KOŞULLU: firma ünvanı, vergi dairesi, vergi
-- numarası ve adres eksiksizse kullanıcı kendi hesabını yükseltebiliyor.
-- Böylece bireysel üye olarak kaydolmuş bir veteriner, destek beklemeden
-- işletmesini ekleyebiliyor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profil muhafızı
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() or public.is_service_role() or public.counter_sync_active() then
    return new;
  end if;

  -- Yetki ve moderasyon alanları: yalnızca yönetici.
  new.role          := old.role;
  new.is_verified   := old.is_verified;
  new.verified_at   := old.verified_at;
  new.is_banned     := old.is_banned;
  new.banned_reason := old.banned_reason;
  new.listing_count := old.listing_count;
  new.username      := old.username;
  new.created_at    := old.created_at;

  if new.account_type is distinct from old.account_type then
    if new.account_type = 'kurumsal' then
      -- Yükseltme: işletme bilgileri eksiksiz olmalı. Bunlar fatura ve
      -- rehber kaydı için zaten gerekli; eksik bırakmak "kurumsal" etiketini
      -- anlamsızlaştırırdı.
      if coalesce(btrim(new.company_title), '') = ''
         or coalesce(btrim(new.tax_office), '') = ''
         or coalesce(btrim(new.tax_number), '') = ''
         or coalesce(btrim(new.company_address), '') = '' then
        raise exception 'Kurumsal hesaba geçmek için firma ünvanı, vergi dairesi, vergi numarası ve adres bilgilerini eksiksiz doldurun.'
          using errcode = 'check_violation';
      end if;
    else
      -- Düşürme: açık bir işletme kaydı varken bireysele dönmek, rehberde
      -- sahipsiz bir kayıt bırakırdı.
      if exists (select 1 from public.service_providers sp where sp.owner_id = new.id) then
        raise exception 'İşletme kaydınız olduğu için bireysel hesaba geçemezsiniz. Önce işletme kaydınızı kaldırın.'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_trigger on public.profiles;
create trigger profiles_guard_trigger
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- Politika artık yalnızca sahipliğe bakıyor; korumayı trigger yapıyor.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- İşletme kaydı: kurumsal hesap + telefon zorunlu
-- ---------------------------------------------------------------------------
create or replace function public.service_providers_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_account_type text;
  v_phone        text;
begin
  if public.is_admin() or public.is_service_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select p.account_type, p.phone into v_account_type, v_phone
      from public.profiles p
     where p.id = new.owner_id;

    if v_account_type is distinct from 'kurumsal' then
      raise exception 'İşletme kaydı yalnızca kurumsal hesaplarla açılabilir. Hesap bilgilerinizden kurumsal hesaba geçebilirsiniz.'
        using errcode = 'insufficient_privilege';
    end if;

    -- İlanlardaki kuralın aynısı: ulaşılamayan bir işletme kaydı rehberde
    -- yer kaplamaktan başka bir şey yapmıyor.
    if v_phone is null then
      raise exception 'İşletme kaydı için önce profilinize telefon numaranızı ekleyin.'
        using errcode = 'check_violation';
    end if;

    new.status          := 'onay_bekliyor';
    new.is_verified     := false;
    new.verified_at     := null;
    new.view_count      := 0;
    new.phone_count     := 0;
    new.whatsapp_count  := 0;
    new.rating_average  := 0;
    new.rating_count    := 0;
    new.reviewed_at     := null;
    new.reviewed_by     := null;
    new.rejection_reason:= null;
    new.published_at    := null;
  else
    new.id             := old.id;
    new.owner_id       := old.owner_id;
    new.is_verified    := old.is_verified;
    new.verified_at    := old.verified_at;
    new.view_count     := old.view_count;
    new.phone_count    := old.phone_count;
    new.whatsapp_count := old.whatsapp_count;
    new.rating_average := old.rating_average;
    new.rating_count   := old.rating_count;
    new.reviewed_at    := old.reviewed_at;
    new.reviewed_by    := old.reviewed_by;
    new.rejection_reason := old.rejection_reason;
    new.published_at   := old.published_at;
    new.created_at     := old.created_at;

    if new.status <> old.status then
      if not (
        case old.status
          when 'yayinda'       then new.status = 'pasif'
          when 'pasif'         then new.status = 'onay_bekliyor'
          when 'reddedildi'    then new.status = 'onay_bekliyor'
          when 'onay_bekliyor' then new.status = 'pasif'
          else false
        end
      ) then
        new.status := old.status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.service_providers_guard() is
  'İşletme kaydını kurumsal hesaba ve telefonu olan profile sınırlar; sayaç ve onay alanlarını korur.';
