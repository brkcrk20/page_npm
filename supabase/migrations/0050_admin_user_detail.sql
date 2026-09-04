-- ============================================================================
-- 0050 — Yönetim panelinde kullanıcı detayı
--
-- Kullanıcı listesi ad, e-posta, telefon ve ilan sayısını gösteriyordu.
-- Bir hesaba dair karar vermek (şikayet incelemek, doğrulamayı onaylamak,
-- yasaklamak) için bunlar yetmiyor: hesap ne zaman açıldı, en son ne zaman
-- girdi, kaç ilanı yayında, kaç şikayet aldı, doğrulama durumu ne, işletme
-- kaydı var mı?
--
-- Liste sorgusuna hepsini eklemek her satır için beş alt sorgu demekti;
-- detay ayrı bir fonksiyonda ve yalnızca bir kullanıcı için çalışıyor.
-- ============================================================================

create or replace function public.admin_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v jsonb;
begin
  -- guard_bypass(): yönetici, service_role veya doğrudan bağlantı.
  -- Yalnızca is_admin() yazmak sunucu tarafını ve bakım betiklerini
  -- dışarıda bırakıyordu (bkz. göç 0040'taki aynı düzeltme).
  if not public.guard_bypass() then
    raise exception 'Bu işlem için yönetici yetkisi gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'id', p.id,
    'email', u.email::text,
    'email_confirmed_at', u.email_confirmed_at,
    'last_sign_in_at', u.last_sign_in_at,
    'created_at', p.created_at,
    'last_seen_at', p.last_seen_at,

    'full_name', p.full_name,
    'username', p.username,
    'phone', p.phone,
    'bio', p.bio,
    'role', p.role::text,
    'account_type', p.account_type::text,
    'is_verified', p.is_verified,
    'is_banned', p.is_banned,
    'banned_reason', p.banned_reason,

    'city', c.name,
    'district', d.name,

    'company_title', p.company_title,
    'tax_number', p.tax_number,
    'tax_office', p.tax_office,

    'identity_status', p.identity_status::text,
    'identity_kind', p.identity_kind::text,
    'identity_verified_at', p.identity_verified_at,
    'phone_verified_at', p.phone_verified_at,

    -- İlanların durum dağılımı: "5 ilan" demek yetmiyor, kaçı yayında?
    'listings', (
      select coalesce(jsonb_object_agg(x.status, x.adet), '{}'::jsonb)
        from (
          select l.status::text as status, count(*) as adet
            from public.listings l
           where l.owner_id = p.id
           group by l.status
        ) x
    ),
    'listing_total', (select count(*) from public.listings l where l.owner_id = p.id),

    -- Bu kullanıcının ilanları hakkında gelen şikayetler.
    'reports_received', (
      select count(*)
        from public.listing_reports r
        join public.listings l on l.id = r.listing_id
       where l.owner_id = p.id
    ),
    'reports_made', (
      select count(*) from public.listing_reports r where r.reporter_id = p.id
    ),

    'businesses', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', s.id, 'name', s.name, 'service_type', s.service_type::text,
               'status', s.status::text, 'is_verified', s.is_verified
             ) order by s.id), '[]'::jsonb)
        from public.service_providers s where s.owner_id = p.id
    ),

    'conversations', (
      select count(*) from public.conversations cv
       where cv.buyer_id = p.id or cv.seller_id = p.id
    ),
    'favorites', (
      select count(*) from public.favorites f where f.user_id = p.id
    )
  )
  into v
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.cities    c on c.id = p.city_id
  left join public.districts d on d.id = p.district_id
  where p.id = p_user_id;

  if v is null then
    raise exception 'Kullanıcı bulunamadı.';
  end if;

  return v;
end;
$$;

revoke all on function public.admin_user_detail(uuid) from public, anon;
grant execute on function public.admin_user_detail(uuid) to authenticated;
