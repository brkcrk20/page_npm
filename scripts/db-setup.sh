#!/usr/bin/env bash
#
# scripts/db-setup.sh — Supabase veritabanını tek komutla kurar.
#
#   npm run db:setup
#
# supabase/migrations/*.sql ve supabase/seed/*.sql dosyalarını sıra numarasına
# göre uygular. Uygulanan göçleri public.schema_migrations tablosunda takip
# eder, böylece tekrar çalıştırıldığında yalnızca yeni dosyaları çalıştırır.
#
# psql yoksa Docker üzerinden postgres:15 imajındaki psql kullanılır.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- .env.local'den SUPABASE_DB_URL oku -------------------------------------
if [[ -z "${SUPABASE_DB_URL:-}" && -f .env.local ]]; then
  # Yalnızca ihtiyacımız olan satırı alıyoruz; tüm dosyayı source etmek
  # yorum satırları ve tırnaklar yüzünden kırılgan olurdu.
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env.local | tail -1 | cut -d= -f2- | sed 's/^["'\'']//; s/["'\'']$//')"
fi

if [[ -z "${SUPABASE_DB_URL:-}" || "$SUPABASE_DB_URL" == *"xxxxxxxxxxxx"* ]]; then
  cat >&2 <<'MSG'
HATA: SUPABASE_DB_URL tanımlı değil.

  1) cp .env.example .env.local
  2) Supabase panelinde: Settings > Database > Connection string > URI
  3) Dizedeki [YOUR-PASSWORD] yerine veritabanı şifrenizi yazıp
     .env.local içindeki SUPABASE_DB_URL satırına yapıştırın.

MSG
  exit 1
fi

# --- psql'i bul --------------------------------------------------------------
if command -v psql >/dev/null 2>&1; then
  run_psql() { psql "$SUPABASE_DB_URL" "$@"; }
  echo "psql: yerel kurulum"
elif command -v docker >/dev/null 2>&1; then
  run_psql() { docker run --rm -i --network host postgres:15 psql "$SUPABASE_DB_URL" "$@"; }
  echo "psql: docker (postgres:15)"
else
  echo "HATA: psql de docker da bulunamadı. Biri gerekli." >&2
  exit 1
fi

echo "Bağlantı deneniyor..."
if ! run_psql -q -t -c "select 1" >/dev/null 2>&1; then
  echo "HATA: Veritabanına bağlanılamadı. SUPABASE_DB_URL doğru mu?" >&2
  echo "      Şifrede özel karakter varsa URL-encode edilmiş olmalı (@ -> %40)." >&2
  exit 1
fi
echo "Bağlantı tamam."

# --- Göç takip tablosu -------------------------------------------------------
run_psql -q -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists public.schema_migrations (
  filename    text primary key,
  applied_at  timestamptz not null default now()
);
SQL

applied=0
skipped=0

apply_file() {
  local file="$1"
  local name
  name="$(basename "$file")"

  local exists
  exists="$(run_psql -q -t -A -c \
    "select 1 from public.schema_migrations where filename = '$name'" 2>/dev/null || true)"

  if [[ "$exists" == "1" ]]; then
    printf '  %-34s atlandı (uygulanmış)\n' "$name"
    skipped=$((skipped + 1))
    return
  fi

  printf '  %-34s ' "$name"
  # Her dosya tek işlemde: yarısı uygulanmış göç kalmasın.
  if { echo "begin;"; cat "$file"; \
       echo "insert into public.schema_migrations (filename) values ('$name');"; \
       echo "commit;"; } | run_psql -q -v ON_ERROR_STOP=1 2>/tmp/db-setup-err.txt; then
    echo "OK"
    applied=$((applied + 1))
  else
    echo "HATA"
    cat /tmp/db-setup-err.txt >&2
    exit 1
  fi
}

echo
echo "Göçler:"
for f in supabase/migrations/*.sql; do
  [[ -e "$f" ]] || continue
  apply_file "$f"
done

echo
echo "Referans verisi:"
for f in supabase/seed/*.sql; do
  [[ -e "$f" ]] || continue
  apply_file "$f"
done

echo
echo "Özet: $applied uygulandı, $skipped atlandı."
echo
run_psql -q -c "
select 'kategori' as tablo, count(*)::text as adet from public.categories
union all select 'il',    count(*)::text from public.cities
union all select 'ilçe',  count(*)::text from public.districts
union all select 'cins',  count(*)::text from public.breeds
union all select 'ilan',  count(*)::text from public.listings
union all select 'kullanıcı', count(*)::text from public.profiles;"

echo "Hazır. Şimdi: npm run dev"
