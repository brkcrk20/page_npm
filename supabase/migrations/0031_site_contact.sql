-- ============================================================================
-- 0031_site_contact.sql — Site iletişim bilgileri
--
-- Alt bilgide telefon, e-posta ve WhatsApp numarası KODA GÖMÜLÜ ve tamamı
-- yer tutucuydu: 0555 555 55 55, info@petsemti.com, wa.me/905555555555.
-- Bunlar her ziyaretçiye gösteriliyordu. Sahte iletişim bilgisi yayınlamak
-- güven kaybettirmenin ötesinde, arayan kişiyi başkasının numarasına
-- düşürebilecek bir hata.
--
-- Değerler ayarlara taşınıyor: sahibi panelden bir kez doldurunca her yerde
-- geçerli oluyor, dağıtım gerekmiyor. Boş bırakılan alan alt bilgide hiç
-- GÖSTERİLMİYOR — yer tutucu göstermektense hiç göstermemek doğru.
--
-- Kurumsal metinler de burada: unvan, adres ve mersis numarası künye ve
-- kullanım şartları sayfalarında kullanılıyor.
-- ============================================================================

insert into public.app_settings (key, value)
values (
  'contact',
  jsonb_build_object(
    'phone',        '',
    'email',        '',
    'whatsapp',     '',
    'address',      '',
    'legal_name',   '',
    'mersis',       '',
    'instagram',    '',
    'facebook',     '',
    'x',            '',
    'youtube',      ''
  )
)
on conflict (key) do nothing;

comment on table public.app_settings is
  'Site geneli ayarlar. Değerler veritabanından okunuyor; değişiklik dağıtım gerektirmiyor.';
