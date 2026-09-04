-- ============================================================================
-- 0048 — İşletme logosu ve görselleri
--
-- Rehberdeki her işletme kartı aynı görünüyordu: bir isim, bir adres, bir
-- puan. Kullanıcı bir kliniği ya da oteli seçerken en çok mekânın kendisine
-- bakıyor ve baktığı şey sitede hiç yoktu — ne logo ne fotoğraf alanı vardı.
--
-- İki ayrı kavram, iki ayrı yer:
--   logo_url  → tek dosya, kartta ve profil başlığında (service_providers'ta)
--   fotoğraf  → çok dosya, sıralı galeri (kendi tablosunda)
--
-- Fotoğrafları jsonb dizi olarak kolonda tutmak sıralama ve tek tek silme
-- işlerini uygulamaya yıkardı; ilan fotoğraflarında olduğu gibi kendi
-- tablosu var.
-- ============================================================================

alter table public.service_providers
  add column if not exists logo_url text;

comment on column public.service_providers.logo_url is
  'İşletme logosu — isletme-gorselleri kovasındaki yol. Kartta ve profil başlığında.';

create table public.service_provider_photos (
  id           bigint generated always as identity primary key,
  provider_id  bigint not null references public.service_providers(id) on delete cascade,
  storage_path text not null,
  width        integer,
  height       integer,
  caption      text check (char_length(caption) <= 160),
  position     smallint not null default 0,
  created_at   timestamptz not null default now(),

  unique (provider_id, position)
);

create index service_provider_photos_provider_idx
  on public.service_provider_photos (provider_id, position);

-- ---------------------------------------------------------------------------
-- Kova
--
-- Yol düzeni: <kullanici_id>/<isletme_id>-<zaman>.webp
-- İlk parça kullanıcı kimliği — RLS sahipliği yalnızca yola bakarak
-- doğrulayabiliyor, tıpkı ilan ve profil fotoğraflarında olduğu gibi.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'isletme-gorselleri',
  'isletme-gorselleri',
  true,
  4 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "isletme_gorsel_herkes_okur" on storage.objects;
create policy "isletme_gorsel_herkes_okur"
  on storage.objects for select
  using (bucket_id = 'isletme-gorselleri');

drop policy if exists "isletme_gorsel_sahibi_yukler" on storage.objects;
create policy "isletme_gorsel_sahibi_yukler"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'isletme-gorselleri'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "isletme_gorsel_sahibi_gunceller" on storage.objects;
create policy "isletme_gorsel_sahibi_gunceller"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'isletme-gorselleri'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "isletme_gorsel_sahibi_siler" on storage.objects;
create policy "isletme_gorsel_sahibi_siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'isletme-gorselleri'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Fotoğraf tablosunun RLS'i
--
-- Yazma yalnızca işletmenin sahibine. Kaydın sahibi olmayan biri başkasının
-- işletmesine fotoğraf ekleyebilseydi rehber ilk günden kirlenirdi.
-- ---------------------------------------------------------------------------
alter table public.service_provider_photos enable row level security;

create policy service_provider_photos_read on public.service_provider_photos
  for select using (true);

create policy service_provider_photos_own on public.service_provider_photos
  for all
  using (
    exists (
      select 1 from public.service_providers p
       where p.id = provider_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.service_providers p
       where p.id = provider_id and p.owner_id = auth.uid()
    )
  );

create policy service_provider_photos_admin on public.service_provider_photos
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.service_provider_photos to anon, authenticated;
grant insert, update, delete on public.service_provider_photos to authenticated;
