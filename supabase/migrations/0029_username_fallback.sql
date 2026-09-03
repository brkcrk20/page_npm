-- ============================================================================
-- 0029_username_fallback.sql — Kullanıcı adı boş kalmasın
--
-- SORUN
-- handle_new_user, kullanıcı adını kayıt formunun gönderdiği metadata'dan
-- alıyor ve gelmezse null bırakıyordu. Null kullanıcı adı hesabı yarı bozuk
-- bırakıyor:
--
--   * /satici/<kullanici-adi> profili açılamıyor
--   * kullanıcı adıyla giriş çalışmıyor (email_for_username boş dönüyor)
--   * panelde ve ilanlarda "@—" görünüyor
--
-- Canlıda böyle bir hesap var: kayıt formunun düzeltilmesinden önce açılmış.
--
-- ÇÖZÜM
-- Metadata'da kullanıcı adı yoksa e-postanın yerel kısmından türetiliyor.
-- Çakışma olursa sonuna sayı ekleniyor. Kullanıcı adı formatı zaten
-- harf/rakam/alt çizgi ile sınırlı olduğu için e-postadaki nokta, tire gibi
-- karakterler temizleniyor.
--
-- Böylece hesabın nasıl açıldığından (form, yönetim API'si, ileride sosyal
-- giriş) bağımsız olarak her hesabın çalışan bir kullanıcı adı oluyor.
-- ============================================================================

create or replace function public.generate_username(p_seed text)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_base   text;
  v_try    text;
  v_suffix integer := 0;
begin
  -- E-postanın yerel kısmı; kullanıcı adında izin verilmeyen her şey atılıyor.
  v_base := lower(regexp_replace(split_part(coalesce(p_seed, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));

  if length(v_base) < 3 then
    v_base := 'uye' || v_base;
  end if;
  v_base := left(v_base, 20);

  v_try := v_base;
  while exists (select 1 from public.profiles where username = v_try) loop
    v_suffix := v_suffix + 1;
    v_try := left(v_base, 20 - length(v_suffix::text)) || v_suffix::text;
  end loop;

  return v_try;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta          jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_account_type  public.account_type;
  v_company_title text;
  v_username      text;
begin
  v_company_title := nullif(btrim(v_meta ->> 'company_title'), '');

  v_account_type := case
    when (v_meta ->> 'account_type') = 'kurumsal' and v_company_title is not null
      then 'kurumsal'::public.account_type
    else 'bireysel'::public.account_type
  end;

  v_username := nullif(lower(btrim(v_meta ->> 'username')), '');

  -- Formdan gelmediyse ya da başkası kapmışsa üret. İkinci kontrol, iki kişi
  -- aynı kullanıcı adıyla aynı anda kaydolmaya çalıştığında kaydın tümüyle
  -- düşmesini engelliyor.
  if v_username is null or exists (select 1 from public.profiles where username = v_username) then
    v_username := public.generate_username(coalesce(v_username, new.email));
  end if;

  insert into public.profiles (
    id, full_name, username, phone, account_type,
    company_title, company_type, tax_office, tax_number,
    national_id, company_address
  )
  values (
    new.id,
    nullif(btrim(v_meta ->> 'full_name'), ''),
    v_username,
    nullif(btrim(v_meta ->> 'phone'), ''),
    v_account_type,
    case when v_account_type = 'kurumsal' then v_company_title end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'company_type'), '') end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'tax_office'), '') end,
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'tax_number'), '') end,
    nullif(btrim(v_meta ->> 'national_id'), ''),
    case when v_account_type = 'kurumsal' then nullif(btrim(v_meta ->> 'company_address'), '') end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Mevcut kullanıcı adsız hesapları onar.
do $$
declare
  r record;
begin
  for r in
    select p.id, u.email
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.username is null
  loop
    -- profiles_guard kullanıcı adını korumaya alıyor; bu blok tablo sahibi
    -- olarak çalıştığı için muhafız devrede değil (is_service_role/postgres).
    update public.profiles
       set username = public.generate_username(r.email)
     where id = r.id;
  end loop;
end $$;
