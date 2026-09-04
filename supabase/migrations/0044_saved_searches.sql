-- ============================================================================
-- 0044 — Kayıtlı aramalar
--
-- İlan sitelerinde en çok kullanılan özelliklerden biri ve sitede yoktu:
-- aradığını bulamayan ziyaretçi bir daha aynı filtreleri kurmak zorunda
-- kalıyor, çoğu da geri dönmüyordu.
--
-- E-POSTA YOK, SAYAÇ VAR
-- Alarm e-postası göndermek için sağlayıcı gerekiyor ve henüz yok. Ama
-- özelliğin asıl değeri "aramayı bir daha kurmamak" ve "yokken ne eklendi";
-- ikisi de e-postasız çalışıyor. Kullanıcı son baktığı andan sonra eklenen
-- ilan sayısını görüyor. Sağlayıcı bağlandığında aynı satırlar e-posta
-- alarmına da kaynaklık edecek.
--
-- FİLTRE NEDEN JSONB
-- Arama parametreleri zamanla değişiyor (fiyat aralığı ve "kimden" bu hafta
-- eklendi). Her filtre için kolon açmak, her yeni filtrede göç yazmak
-- demekti. Sorgu tarafı zaten adres çubuğu parametreleriyle çalışıyor;
-- burada da onları saklıyoruz.
-- ============================================================================

create table public.saved_searches (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,

  name        text not null check (char_length(btrim(name)) between 1 and 80),
  -- Aramanın gittiği sayfa, ör. '/kopek-ilanlari'
  path        text not null check (path ~ '^/[A-Za-z0-9/_-]*$'),
  -- Adres çubuğu parametreleri: {"sirala":"ucuz","kimden":"sahibinden"}
  params      jsonb not null default '{}'::jsonb,

  -- Sayaç bunun üzerinden hesaplanıyor.
  last_seen_at timestamptz not null default now(),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Aynı aramayı iki kez kaydetmenin anlamı yok.
  unique (user_id, path, params)
);

create index saved_searches_user_idx on public.saved_searches (user_id, created_at desc);

create trigger saved_searches_set_updated_at
  before update on public.saved_searches
  for each row execute function public.set_updated_at();

alter table public.saved_searches enable row level security;

create policy saved_searches_own on public.saved_searches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_searches_admin on public.saved_searches
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.saved_searches to authenticated;

-- ---------------------------------------------------------------------------
-- Kayıtlı aramaların yeni ilan sayıları
--
-- Sayımı istemcide yapmak, her kayıtlı arama için ayrı bir sorgu demekti.
-- Tek çağrıda hepsini döndürüyoruz.
--
-- Filtrelerin tamamı değil, sonucu daraltan ana alanlar uygulanıyor
-- (kategori, şehir, cins, kimden). Sıralama sayımı etkilemiyor; fiyat
-- aralığı gibi ikincil alanlar sayacı biraz gevşetiyor ama "yeni bir şey
-- var" bilgisi için yeterli — kullanıcı zaten tıklayıp tam listeyi görüyor.
-- ---------------------------------------------------------------------------
create or replace function public.saved_search_counts()
returns table (id bigint, yeni_ilan integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select s.id,
         (
           select count(*)::integer
             from public.listings l
             join public.categories c on c.id = l.category_id
             left join public.cities  ct on ct.id = l.city_id
             left join public.breeds  b  on b.id = l.breed_id
            where l.status = 'yayinda'
              and (l.expires_at is null or l.expires_at > now())
              and l.published_at > s.last_seen_at
              and (s.params->>'kategori' is null or c.slug = s.params->>'kategori')
              and (s.params->>'sehir'    is null or ct.slug = s.params->>'sehir')
              and (s.params->>'cins'     is null or b.slug = s.params->>'cins')
              and (
                s.params->>'kimden' is null
                or l.owner_account_type = case s.params->>'kimden'
                                            when 'magazadan' then 'kurumsal'::public.account_type
                                            else 'bireysel'::public.account_type
                                          end
              )
         )
    from public.saved_searches s
   where s.user_id = auth.uid();
end;
$$;

revoke all on function public.saved_search_counts() from public;
grant execute on function public.saved_search_counts() to authenticated;
