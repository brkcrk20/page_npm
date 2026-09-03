-- ============================================================================
-- 0030_guard_bypass.sql — Muhafız muafiyetini tek yerde topla, göçleri kapsa
--
-- SORUN
-- Muhafız trigger'ları "bu yazma güvenilir mi" sorusunu her biri kendi
-- yazdığı bir ifadeyle cevaplıyordu ve ifadeler birbirinden ayrışmıştı:
--
--   listings_guard          : is_admin or is_service_role or counter_sync_active
--   profiles_guard          : is_admin or is_service_role or counter_sync_active
--   conversations_guard     : is_admin or is_service_role
--   service_providers_guard : is_admin or is_service_role
--
-- Dahası hiçbiri DOĞRUDAN VERİTABANI BAĞLANTISINI kapsamıyordu. Göçler
-- postgres rolüyle çalışıyor ve o bağlamda role GUC'u 'none'; yani bir göçün
-- korumalı kolona yazdığı her değeri muhafız sessizce geri alıyordu.
--
-- 0029 tam olarak buna kurban gitti: kullanıcı adsız hesapları onaran blok
-- çalıştı, hata vermedi, hiçbir şey değiştirmedi. Hata vermediği için de
-- fark edilmesi ancak sonucu kontrol etmekle mümkündü.
--
-- ÇÖZÜM
-- Tek bir guard_bypass() fonksiyonu. Doğrudan bağlantı da güvenilir sayılıyor:
-- PostgREST her isteğe rol atıyor (ölçüldü: anon -> 'anon',
-- authenticated -> 'authenticated', service_role -> 'service_role');
-- 'none' yalnızca veritabanı şifresiyle açılmış bir bağlantıda görülüyor ve
-- o bağlantı zaten trigger'ı devre dışı bırakabilecek yetkiye sahip — yani
-- bu, var olmayan bir sınırı kaldırmıyor.
--
-- Muhafızlar gövdeleri yeniden yazılarak değil, pg_get_functiondef ile
-- okunup koşulu değiştirilerek güncelleniyor. Dört uzun fonksiyonu elle
-- yeniden yazmak, tam da bu göçün çözmeye çalıştığı ayrışmayı üretme riski
-- taşıyordu.
-- ============================================================================

create or replace function public.guard_bypass()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.is_admin()
      or public.is_service_role()
      or public.counter_sync_active()
      -- Doğrudan veritabanı bağlantısı: göçler ve bakım betikleri.
      or coalesce(current_setting('role', true), 'none') in ('', 'none');
$$;

comment on function public.guard_bypass() is
  'Muhafız trigger''larının ortak muafiyet koşulu: yönetici, service_role, sayaç senkronizasyonu veya doğrudan veritabanı bağlantısı.';

grant execute on function public.guard_bypass() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Muhafızları ortak koşula bağla
-- ---------------------------------------------------------------------------
do $$
declare
  r     record;
  src   text;
begin
  for r in
    select p.oid, p.proname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'listings_guard', 'profiles_guard',
         'conversations_guard', 'service_providers_guard'
       )
  loop
    src := pg_get_functiondef(r.oid);

    -- Uzun ifade önce: kısa olanla değiştirilirse artakalan " or
    -- counter_sync_active()" ortada kalırdı.
    src := replace(
      src,
      'public.is_admin() or public.is_service_role() or public.counter_sync_active()',
      'public.guard_bypass()'
    );
    src := replace(
      src,
      'public.is_admin() or public.is_service_role()',
      'public.guard_bypass()'
    );

    execute src;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 0029'un boşa giden onarımını tekrarla
-- ---------------------------------------------------------------------------
update public.profiles p
   set username = public.generate_username(u.email)
  from auth.users u
 where u.id = p.id
   and p.username is null;
