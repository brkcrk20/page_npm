/**
 * scripts/migrate-to-new-project.ts
 *
 * Eski Supabase projesinden alınan yedeği YENİ projeye aktarır.
 *
 *   npx tsx scripts/migrate-to-new-project.ts <yedek-dizini>
 *
 * ÖNCE ne yapılmış olmalı:
 *   1. .env.local YENİ projenin bilgileriyle güncellenmiş olmalı
 *   2. npm run db:setup çalıştırılmış olmalı (şema + referans verisi)
 *   3. Site üzerinden hesap açılmış olmalı — kullanıcı bu betikle
 *      taşınmıyor
 *
 * KULLANICI NEDEN TAŞINMIYOR
 * Şifreler auth.users içinde geri döndürülemez şekilde saklanıyor; yönetim
 * API'si kullanıcı oluştururken düz metin şifre istiyor. Yani şifreyi taşımak
 * teknik olarak mümkün değil. Sahibinin siteden yeniden kaydolması hem daha
 * hızlı hem de şifresinin hiçbir yerde görünmemesini sağlıyor.
 *
 * Betik ilanı, fotoğrafları ve profil alanlarını YENİ kullanıcı kimliğine
 * bağlıyor: eski kimlik yeni projede yok, olduğu gibi kopyalamak yabancı
 * anahtar hatası verirdi.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const BACKUP = process.argv[2];
if (!BACKUP) {
  console.error('Kullanım: npx tsx scripts/migrate-to-new-project.ts <yedek-dizini>');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('HATA: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.');
  process.exit(1);
}

// Kontrolden sonra sabitleniyor: TypeScript, kapanışların içinde
// process.env okumalarını daraltmıyor.
const URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY: string = process.env.SUPABASE_SERVICE_ROLE_KEY;

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(path: string, init?: RequestInit) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers ?? {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path}: ${r.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

function load<T>(name: string): T[] {
  const p = resolve(BACKUP, name);
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as T[]) : [];
}

/** Bir dizindeki tüm dosyaları göreli yollarıyla listeler. */
function walk(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full, base) : [relative(base, full)];
  });
}

async function main() {
  // --- 1) Yeni projedeki kullanıcıyı bul --------------------------------
  const usersRes = await fetch(`${URL}/auth/v1/admin/users`, { headers: H });
  const usersJson = await usersRes.json();
  const users = usersJson.users ?? usersJson;

  if (!Array.isArray(users) || users.length === 0) {
    console.error('HATA: Yeni projede hiç kullanıcı yok.');
    console.error('Önce siteden kaydolun, sonra bu betiği tekrar çalıştırın.');
    process.exit(1);
  }

  const oldUsers = load<any>('kullanicilar.json');
  const oldProfiles = load<any>('profiles.json');

  // E-posta eşleşen kullanıcıyı seç; yoksa ilk kullanıcı.
  const oldEmail = oldUsers[0]?.email;
  const target = users.find((u: any) => u.email === oldEmail) ?? users[0];
  console.log(`Hedef kullanıcı: ${target.email} (${target.id})`);

  // --- 2) Profil alanlarını geri yükle -----------------------------------
  const oldProfile = oldProfiles.find((p) => p.id === oldUsers[0]?.id) ?? oldProfiles[0];
  if (oldProfile) {
    // Kimlik, sayaçlar ve zaman damgaları taşınmıyor: yeni kayıt kendi
    // değerlerini üretiyor ve eskisini zorlamak tutarsızlık yaratırdı.
    const { id, created_at, updated_at, last_seen_at, listing_count, avatar_url, ...rest_ } = oldProfile;
    await rest(`profiles?id=eq.${target.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...rest_, role: 'admin' }),
    });
    console.log('  profil alanları geri yüklendi (rol: admin)');
  }

  // --- 3) Depolama dosyaları ---------------------------------------------
  //     Fotoğraf yolları <kullanici_id>/... biçiminde; yeni kimliğe göre
  //     yeniden yazılıyor, yoksa RLS kendi klasörü saymaz.
  const pathMap = new Map<string, string>();

  for (const bucket of ['ilan-fotograflari', 'profil-fotograflari']) {
    const dir = resolve(BACKUP, 'fotograflar', bucket);
    const files = walk(dir);
    let ok = 0;

    for (const rel of files) {
      const newPath = oldUsers[0] ? rel.replace(oldUsers[0].id, target.id) : rel;
      const body = readFileSync(join(dir, rel));
      const ext = rel.split('.').pop()!.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const r = await fetch(`${URL}/storage/v1/object/${bucket}/${newPath}`, {
        method: 'POST',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': mime, 'x-upsert': 'true' },
        // Blob: Node'un Buffer'ı TypeScript'in BodyInit tanımına doğrudan
        // uymuyor; Blob her iki tarafta da geçerli.
        body: new Blob([new Uint8Array(body)], { type: mime }),
      });
      if (r.ok) { ok++; pathMap.set(rel, newPath); }
      else console.warn(`  ! ${rel}: ${r.status} ${(await r.text()).slice(0, 120)}`);
    }
    console.log(`  ${bucket}: ${ok}/${files.length} dosya yüklendi`);
  }

  // Profil fotoğrafını profile bağla
  const avatarOld = oldProfile?.avatar_url;
  if (avatarOld) {
    const avatarNew = avatarOld.replace(oldUsers[0].id, target.id);
    await rest(`profiles?id=eq.${target.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar_url: avatarNew }),
    });
    console.log('  profil fotoğrafı bağlandı');
  }

  // --- 4) İlanlar ---------------------------------------------------------
  const oldListings = load<any>('listings.json');
  const oldPhotos = load<any>('listing_photos.json');
  const listingIdMap = new Map<number, number>();

  for (const l of oldListings) {
    // id ve slug üretiliyor; sayaçlar ve moderasyon alanları muhafız
    // tarafından sıfırlanıyor, göndermenin anlamı yok.
    const {
      id, slug, created_at, updated_at, published_at, expires_at,
      view_count, favorite_count, contact_count, whatsapp_count, phone_count,
      reviewed_at, reviewed_by, rejection_reason, search_vector, contact_phone,
      ...fields
    } = l;

    const inserted = await rest('listings', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ...fields, owner_id: target.id, slug: 'gecici' }),
    });
    const newId = inserted[0].id;
    listingIdMap.set(id, newId);
    console.log(`  ilan #${id} -> #${newId} (${l.title})`);
  }

  // --- 5) İlan fotoğrafları ----------------------------------------------
  const photoRows = oldPhotos
    .filter((p) => listingIdMap.has(p.listing_id))
    .map((p) => ({
      listing_id: listingIdMap.get(p.listing_id),
      storage_path: oldUsers[0] ? p.storage_path.replace(oldUsers[0].id, target.id) : p.storage_path,
      position: p.position,
      width: p.width,
      height: p.height,
    }));

  if (photoRows.length > 0) {
    await rest('listing_photos', { method: 'POST', body: JSON.stringify(photoRows) });
    console.log(`  ${photoRows.length} ilan fotoğrafı bağlandı`);
  }

  console.log('\nTaşıma tamamlandı.');
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
