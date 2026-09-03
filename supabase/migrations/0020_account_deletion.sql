-- ============================================================================
-- 0020_account_deletion.sql — Hesap silme ile mali kayıt saklamayı ayır
--
-- SORUN
-- orders.user_id "on delete restrict" idi. Sipariş vermiş bir kullanıcı
-- hesabını HİÇ silemiyordu — silme denemesi yabancı anahtar hatasıyla
-- reddediliyordu.
--
-- Bu iki yükümlülüğü karşı karşıya getiriyor: kullanıcının verisinin
-- silinmesini isteme hakkı ile mali kayıtların saklanması zorunluluğu.
--
-- ÇÖZÜM
-- İkisi zaten ayrılabilir durumda: fatura bilgisi sipariş anında
-- orders.billing_snapshot içine donduruluyor (bkz. create_order). Yani sipariş
-- satırı, profil silinse bile faturanın gerektirdiği veriyi taşıyor.
--
-- user_id artık boşaltılabilir: profil gidiyor, sipariş kaydı ve tutarı
-- kalıyor. Abonelik ve ilan hakkı kayıtları kişiye bağlı olduğu için onlar
-- kullanıcıyla birlikte siliniyor — saklanmalarının bir anlamı yok.
-- ============================================================================

alter table public.orders alter column user_id drop not null;

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

-- RLS politikaları user_id üzerinden çalışıyor; null olduğunda satır artık
-- hiçbir kullanıcıya görünmüyor, yalnızca admin erişebiliyor. İstenen davranış
-- bu: sahibi silinmiş bir siparişi kimsenin gelen kutusunda görmesine gerek yok.

-- Sipariş kalemleri siparişe bağlı; sipariş yaşadığı sürece onlar da yaşıyor.
-- payments zaten order_id üzerinden cascade.

comment on column public.orders.user_id is
  'Hesap silindiğinde boşalır. Faturanın gerektirdiği bilgi billing_snapshot içinde donmuş hâlde saklanır.';
