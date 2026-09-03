-- ============================================================================
-- 0022_delete_own_account.sql — Kullanıcı kendi hesabını silebilsin
--
-- 0020 hesap silmenin ÖNÜNDEKİ ENGELİ kaldırmıştı (orders.user_id artık
-- boşalabiliyor) ama silme işlemini yapacak bir yol bırakmamıştı. Tarayıcıdan
-- auth.users'a dokunulamıyor: silme yalnızca service_role anahtarıyla,
-- yönetim API'si üzerinden mümkün ve o anahtar istemciye asla verilemez.
--
-- Sonuç: panelde "üyeliği sonlandır" düğmesi koyulamıyordu, kullanıcının
-- hesabını silmesinin hiçbir yolu yoktu.
--
-- Bu göç, yalnızca ÇAĞIRANIN KENDİ hesabını silen SECURITY DEFINER bir
-- fonksiyon ekliyor. Hedef kullanıcı parametre olarak alınmıyor — alınsaydı,
-- fonksiyonu çağırabilen herkes istediği hesabı silebilirdi. Silinecek kayıt
-- her zaman auth.uid().
--
-- Bağlı veriler: profiles.id -> auth.users(id) on delete cascade zinciriyle
-- ilanlar, fotoğraflar, favoriler, mesajlar ve abonelikler birlikte gidiyor.
-- Siparişler kalıyor (user_id boşalıyor): mali kayıtların saklanması gerekiyor
-- ve faturanın gerektirdiği bilgi orders.billing_snapshot içinde donmuş halde
-- duruyor.
-- ============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Bu işlem için giriş yapmanız gerekiyor.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Yönetici hesabının kendini silmesi, panele erişimi olan son kişinin
  -- kaybedilmesi anlamına gelebilir. Bilinçli bir karar olmalı; panelden
  -- tek tıkla olmamalı.
  if exists (select 1 from public.profiles where id = v_user and role = 'admin') then
    raise exception 'Yönetici hesapları panelden silinemez.'
      using errcode = 'insufficient_privilege';
  end if;

  -- auth.users silinince profiles ve ona bağlı her şey cascade ile gidiyor.
  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Çağıranın kendi hesabını siler. Hedef kullanıcı parametre almaz: her zaman auth.uid().';
