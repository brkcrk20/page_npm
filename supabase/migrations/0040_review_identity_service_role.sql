-- ============================================================================
-- 0040 — admin_review_identity sunucu tarafından da çağrılabilsin
--
-- Fonksiyon yalnızca is_admin() kabul ediyordu; service_role ile çağrıldığında
-- auth.uid() boş olduğu için 403 dönüyordu. Oysa doğrulama akışının sunucu
-- tarafı (NVI eşleşmesi) zaten profiles'a service_role ile yazıyor — yani bu
-- kısıt var olmayan bir sınır koruyordu, yalnızca bakım betiklerini engelliyordu.
--
-- guard_bypass() ile aynı mantık: yönetici, service_role veya doğrudan bağlantı.
-- ============================================================================

create or replace function public.admin_review_identity(
  p_request_id bigint,
  p_approve    boolean,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.identity_requests%rowtype;
begin
  if not public.guard_bypass() then
    raise exception 'Yetkiniz yok.' using errcode = '42501';
  end if;

  select * into r from public.identity_requests where id = p_request_id;
  if not found then
    raise exception 'Başvuru bulunamadı.';
  end if;

  update public.identity_requests
     -- Açık dönüşüm şart: CASE metin döndürüyor, sütun enum.
     set status = (case when p_approve then 'dogrulandi' else 'reddedildi' end)::public.verification_status,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         reject_reason = case when p_approve then null else p_reason end
   where id = p_request_id;

  update public.profiles
     set identity_kind = r.kind,
         identity_status = (case when p_approve then 'dogrulandi' else 'reddedildi' end)::public.verification_status,
         identity_verified_at = case when p_approve then now() else null end,
         identity_rejected_reason = case when p_approve then null else p_reason end,
         is_verified = p_approve,
         verified_at = case when p_approve then now() else null end
   where id = r.user_id;
end;
$$;
