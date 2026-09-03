-- ============================================================================
-- 0028_admin_tools.sql — Yönetim panelinin veriye erişimi
--
-- RLS zaten yöneticiye bütün tablolarda tam yetki veriyor (is_admin()).
-- Panelin eksik kaldığı iki nokta var ve ikisi de auth şemasında:
--
--   1. E-POSTA. profiles tablosunda e-posta yok; auth.users'da. Kullanıcı
--      listesinde e-posta görünmeden destek yapmak imkânsız — "şu adresle
--      kaydolan kişi" diye gelen her talep elle SQL yazmayı gerektiriyordu.
--
--   2. SİLME. auth.users'a REST üzerinden dokunulamıyor. Yönetici bir hesabı
--      ancak Supabase panelinden silebiliyordu.
--
-- İkisi de SECURITY DEFINER fonksiyonlarla çözülüyor; her ikisi de ilk iş
-- olarak is_admin() kontrol ediyor. Kontrolü atlarsak bu fonksiyonlar tüm
-- kullanıcıların e-postasını sızdıran ve herkesin hesabını silebilen bir
-- arka kapı olurdu.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Kullanıcı listesi (yalnızca yönetici)
--
-- View değil fonksiyon: view'da yetki kontrolü satır bazlı yapılabilir ama
-- burada "yönetici değilse hiçbir şey yok" demek istiyoruz ve bunu bir
-- exception ile açıkça söylemek, sessizce boş liste döndürmekten iyi —
-- panelde boş liste "kullanıcı yok" gibi görünürdü.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users(
  p_search text default null,
  p_limit  integer default 100,
  p_offset integer default 0
)
returns table (
  id            uuid,
  email         text,
  full_name     text,
  username      text,
  phone         text,
  role          text,
  account_type  text,
  company_title text,
  is_verified   boolean,
  is_banned     boolean,
  banned_reason text,
  listing_count integer,
  created_at    timestamptz,
  last_sign_in_at timestamptz,
  listings_total bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.full_name,
      p.username,
      p.phone,
      p.role::text,
      p.account_type::text,
      p.company_title,
      p.is_verified,
      p.is_banned,
      p.banned_reason,
      p.listing_count,
      p.created_at,
      u.last_sign_in_at,
      (select count(*) from public.listings l where l.owner_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p_search is null
       or btrim(p_search) = ''
       or p.full_name    ilike '%' || p_search || '%'
       or p.username     ilike '%' || p_search || '%'
       or p.company_title ilike '%' || p_search || '%'
       or p.phone        like  '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
       or u.email::text  ilike '%' || p_search || '%'
    order by p.created_at desc
    limit  greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

revoke all on function public.admin_list_users(text, integer, integer) from public, anon;
grant execute on function public.admin_list_users(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Hesap silme (yalnızca yönetici)
--
-- delete_my_account'tan farkı hedefin parametre olması; bu yüzden yetki
-- kontrolü burada çok daha kritik.
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Kendi hesabınızı buradan silemezsiniz.'
      using errcode = 'check_violation';
  end if;

  -- Son yöneticinin silinmesi paneli erişilemez bırakırdı.
  if exists (select 1 from public.profiles where id = p_user_id and role = 'admin')
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Sistemdeki son yönetici hesabı silinemez.'
      using errcode = 'check_violation';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Yönetici, kullanıcının rolünü/yasağını değiştirebilsin
--
-- profiles_guard yöneticiyi zaten muaf tutuyor, yani doğrudan UPDATE de
-- çalışır. Yine de ayrı bir fonksiyon var: son yöneticinin kendi yetkisini
-- düşürmesi paneli kilitler ve bunu politika ile ifade etmek mümkün değil.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_role not in ('user', 'admin', 'moderator') then
    raise exception 'Geçersiz rol.' using errcode = 'check_violation';
  end if;

  if p_role <> 'admin'
     and exists (select 1 from public.profiles where id = p_user_id and role = 'admin')
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Sistemdeki son yöneticinin yetkisi kaldırılamaz.'
      using errcode = 'check_violation';
  end if;

  update public.profiles set role = p_role::public.user_role where id = p_user_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
