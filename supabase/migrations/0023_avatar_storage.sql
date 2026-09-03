-- ============================================================================
-- 0023_avatar_storage.sql — Profil fotoğrafı kovası
--
-- profiles.avatar_url kolonu en baştan beri vardı ve satıcı kartında,
-- satıcı sayfasında okunuyordu — ama hiçbir yerde YAZILAMIYORDU. Kullanıcının
-- profil fotoğrafı ekleme imkânı yoktu; alan hep boş kalıyor, her yerde
-- yerine harf/ikon gösteriliyordu.
--
-- Yol düzeni:  <kullanici_id>/<zaman>.webp
-- İlan fotoğraflarındaki desenin aynısı: klasör adı kullanıcı kimliği olduğu
-- için RLS yalnızca yolun ilk parçasına bakarak sahipliği doğrulayabiliyor.
--
-- Kova ilan fotoğraflarından ayrı: boyut sınırı çok daha küçük (profil
-- fotoğrafı 512px'e indirgeniyor) ve silme davranışı farklı — kullanıcı
-- fotoğrafını değiştirdiğinde eskisi silinebilmeli.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profil-fotograflari',
  'profil-fotograflari',
  true,                        -- herkese açık okuma: satıcı kartında görünüyor
  2 * 1024 * 1024,             -- 2 MB; istemci zaten 512px webp'e indiriyor
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profil_foto_herkes_okur" on storage.objects;
create policy "profil_foto_herkes_okur"
  on storage.objects for select
  using (bucket_id = 'profil-fotograflari');

drop policy if exists "profil_foto_sahibi_yukler" on storage.objects;
create policy "profil_foto_sahibi_yukler"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profil_foto_sahibi_gunceller" on storage.objects;
create policy "profil_foto_sahibi_gunceller"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profil_foto_sahibi_siler" on storage.objects;
create policy "profil_foto_sahibi_siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
