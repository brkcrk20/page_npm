-- 0059 — Kullanıcı detayına düzenleme için gereken alanlar.
--
-- Yönetim panelinde artık hesabın bütün alanları düzenlenebiliyor. Form
-- açılırken mevcut değerleri göstermesi gerekiyor ama admin_user_detail
-- şehri ve ilçeyi yalnızca AD olarak döndürüyordu ("İstanbul"), kimlik
-- (id) olarak değil — açılır listede seçili göstermek mümkün değildi.
-- Firma türü, firma adresi ve doğrulama tarihi ise hiç dönmüyordu.
--
-- Fonksiyon baştan yazılmıyor: mevcut tanımı okunup yalnızca eksik
-- anahtarlar ekleniyor. Baştan yazmak, aradan geçen değişiklikleri
-- sessizce geri almak demekti.

do $$
declare
  v_tanim text;
begin
  select pg_get_functiondef('public.admin_user_detail(uuid)'::regprocedure) into v_tanim;

  if position('''city_id''' in v_tanim) > 0 then
    raise notice 'admin_user_detail zaten güncel, atlanıyor.';
    return;
  end if;

  v_tanim := replace(
    v_tanim,
    '''district'', d.name',
    '''district'', d.name,' || chr(10) ||
    '    ''city_id'', p.city_id,' || chr(10) ||
    '    ''district_id'', p.district_id,' || chr(10) ||
    '    ''company_type'', p.company_type,' || chr(10) ||
    '    ''company_address'', p.company_address,' || chr(10) ||
    '    ''verified_at'', p.verified_at,' || chr(10) ||
    '    ''is_demo'', p.is_demo'
  );

  execute v_tanim;
end
$$;
