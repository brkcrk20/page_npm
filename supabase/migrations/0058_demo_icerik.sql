-- 0058 — Demo içerik işareti.
--
-- Site yeni; ilan sayısı tek haneli. Boş bir pazaryeri ilk ziyaretçiyi
-- geri çeviriyor, o yüzden vitrini doldurmak için örnek ilanlar ve
-- işletmeler ekleniyor.
--
-- Bu içeriğin tek bir bayrakla işaretlenmesi şart. Sebepleri:
--
--  1) Tek komutla tamamı silinebilmeli. Gerçek ilanlar geldiğinde demo
--     içeriğin elle ayıklanması gerekseydi, ya hiç silinmez ya da yanlış
--     satır silinirdi.
--  2) Sayfada işaretlenebilmeli. Gerçek bir kullanıcı demo bir ilana mesaj
--     attığında karşılık alamıyor; bunu önceden söylemek sitenin ilk
--     izlenimini korur.
--  3) İstatistiklerden ayrılabilmeli. "Kaç ilan var" sorusunun cevabı
--     demo satırları içermemeli.
--
-- Demo hesaplar auth tarafında da oluşturuluyor; onların silinmesi
-- servis anahtarı gerektirdiği için uygulama tarafında yapılıyor
-- (src/app/api/admin/demo). Buradaki bayrak hangi satırın demo olduğunu
-- tek doğru kaynak olarak tutuyor.

begin;

alter table public.profiles          add column if not exists is_demo boolean not null default false;
alter table public.listings          add column if not exists is_demo boolean not null default false;
alter table public.service_providers add column if not exists is_demo boolean not null default false;

comment on column public.profiles.is_demo is
  'Vitrini doldurmak için üretilmiş örnek hesap. Yönetim panelinden toplu silinir.';
comment on column public.listings.is_demo is
  'Örnek ilan. Gerçek değil; sayfada işaretlenir ve toplu silinebilir.';
comment on column public.service_providers.is_demo is
  'Örnek işletme. Gerçek değil; sayfada işaretlenir ve toplu silinebilir.';

-- Kısmi indeks: demo satırlar azınlıkta kalacağı için tam indeks gereksiz.
create index if not exists listings_is_demo_idx          on public.listings (is_demo) where is_demo;
create index if not exists service_providers_is_demo_idx on public.service_providers (is_demo) where is_demo;
create index if not exists profiles_is_demo_idx          on public.profiles (is_demo) where is_demo;

-- Demo rozetinin görünürlüğü. Varsayılan açık: işaretsiz demo ilan,
-- gerçek sanılıp mesaj atılan ilan demektir.
insert into public.app_settings (key, value)
values ('demo', '{"badge_visible": true}'::jsonb)
on conflict (key) do nothing;

commit;

-- İletişim zorunluluğu demo kayıtları kapsamıyor.
--
-- service_providers_contact kısıtı her işletmenin en az bir iletişim
-- kanalı taşımasını istiyor; doğru bir kural, çünkü ulaşılamayan bir
-- işletme kaydının rehberde işi yok.
--
-- Demo kayıtlarda ise durum tersine dönüyor: arkasında gerçek bir işletme
-- olmadığı için verilecek her numara ya boşa çıkar ya da başka birine
-- aittir. Kısıtı sağlamak için uydurma bir e-posta yazmak, kuralı
-- lafzen sağlayıp amacını çiğnemek olurdu.
begin;

alter table public.service_providers drop constraint if exists service_providers_contact;

alter table public.service_providers add constraint service_providers_contact check (
  is_demo
  or coalesce(
       nullif(btrim(phone), ''),
       nullif(btrim(email), ''),
       nullif(btrim(website), ''),
       nullif(btrim(whatsapp), '')
     ) is not null
);

commit;
