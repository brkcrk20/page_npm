-- ============================================================================
-- 0008_storage.sql — İlan fotoğrafları için depolama kovası
--
-- Yol düzeni:  <kullanici_id>/<zaman>-<sira>.<uzanti>
--
-- Klasör adının kullanıcı kimliği olması bilinçli: RLS politikası yalnızca
-- yolun ilk parçasına bakarak "bu dosya bu kullanıcının mı" sorusunu
-- cevaplayabiliyor. İlan kimliğine göre klasörlemek mümkün değildi, çünkü
-- fotoğraflar ilan satırı oluşmadan önce yükleniyor.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ilan-fotograflari',
  'ilan-fotograflari',
  true,                                    -- herkese açık okuma: ilan görselleri
  5 * 1024 * 1024,                         -- dosya başına 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Okuma: herkes. İlan görselleri giriş yapmamış ziyaretçiye de görünmeli.
-- ---------------------------------------------------------------------------
drop policy if exists "ilan_foto_herkes_okur" on storage.objects;
create policy "ilan_foto_herkes_okur"
  on storage.objects for select
  using (bucket_id = 'ilan-fotograflari');

-- ---------------------------------------------------------------------------
-- Yükleme: yalnızca giriş yapmış kullanıcı ve yalnızca kendi klasörüne.
--
-- storage.foldername(name) yolu parçalarına ayırır; ilk parça kullanıcı
-- kimliği olmak zorunda. Bu olmadan herhangi bir kullanıcı başkasının
-- klasörüne dosya atabilir ya da üzerine yazabilirdi.
-- ---------------------------------------------------------------------------
drop policy if exists "ilan_foto_sahibi_yukler" on storage.objects;
create policy "ilan_foto_sahibi_yukler"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ilan-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ilan_foto_sahibi_gunceller" on storage.objects;
create policy "ilan_foto_sahibi_gunceller"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ilan-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ilan_foto_sahibi_siler" on storage.objects;
create policy "ilan_foto_sahibi_siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ilan-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
