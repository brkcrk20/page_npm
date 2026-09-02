-- ============================================================================
-- 0001_init.sql — Eklentiler ve ortak yardımcı fonksiyonlar
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists unaccent;
create extension if not exists pg_trgm;    -- benzer isim araması (ILIKE hızlandırma)

-- ---------------------------------------------------------------------------
-- tr_slugify: Türkçe uyumlu slug üretimi.
--
-- DİKKAT: Bu fonksiyon src/lib/routing.ts içindeki slugify() ile BİREBİR aynı
-- sonucu üretmek zorunda. URL'ler bir tarafta üretilip diğer tarafta
-- çözümlendiği için ikisi ayrışırsa linkler kırılır.
--
-- Neden translate()? lower('İ') Postgres'te 'i̇' (i + birleşik nokta) üretir ve
-- ardından [^a-z0-9] filtresine takılır. Bu yüzden küçük harfe çevirmeden ÖNCE
-- Türkçe harfleri ASCII karşılıklarına eşliyoruz.
-- ---------------------------------------------------------------------------
create or replace function public.tr_slugify(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select trim(both '-' from
    regexp_replace(
      lower(translate(value,
        'ıİIŞşĞğÜüÖöÇçÂâÎîÛû',
        'iiiSsGgUuOoCcAaIiUu')),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

comment on function public.tr_slugify(text) is
  'Türkçe karakterleri ASCII''ye indirgeyerek URL slug üretir. src/lib/routing.ts:slugify ile senkron kalmalı.';

-- ---------------------------------------------------------------------------
-- updated_at otomatik güncelleme
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
