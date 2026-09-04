-- ============================================================================
-- 0042 — Süre dolumunu zamanlanmış işe bağla
--
-- 0041 fonksiyonu yazdı ama pg_cron kurulu olmadığı için iş kurulmadı.
-- Supabase'de eklenti SQL'den kurulabiliyor. Kurulamazsa göç yine geçiyor:
-- sorgu tarafındaki süzme doğru sonucu vermeye devam ediyor, yalnızca ilan
-- sahibi listesinde "süresi doldu" etiketi gecikir.
-- ============================================================================

do $$
begin
  create extension if not exists pg_cron;
  raise notice 'pg_cron kuruldu';
exception when others then
  raise notice 'pg_cron kurulamadı: %', sqlerrm;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('ilan-suresi-dolumu')
      where exists (select 1 from cron.job where jobname = 'ilan-suresi-dolumu');
    perform cron.schedule('ilan-suresi-dolumu', '17 3 * * *', 'select public.expire_listings()');
    raise notice 'zamanlanmış iş kuruldu: her gece 03:17';
  else
    raise notice 'pg_cron yok; süre dolumu yalnızca sorgu süzmesiyle';
  end if;
exception when others then
  raise notice 'zamanlanmış iş kurulamadı: %', sqlerrm;
end;
$$;
