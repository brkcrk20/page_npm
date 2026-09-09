/**
 * scripts/favicon-uret.mjs — /favicon.ico dosyasını marka ikonundan üretir.
 *
 *   node scripts/favicon-uret.mjs
 *
 * NEDEN
 * /favicon.ico adresi 404 dönüyordu. Tarayıcı sekmesi için sorun değil —
 * onu <link rel="icon"> hallediyor — ama Google'ın favicon tarayıcısı önce
 * bu klasik adrese bakıyor. Adres boş kalınca arama sonucunda sitenin ESKİ
 * ikonu görünmeye devam ediyordu.
 *
 * Next.js src/app/favicon.ico dosyasını otomatik olarak /favicon.ico
 * adresinden yayınlıyor.
 *
 * ICO içine PNG gömülüyor: biçim bunu destekliyor ve bütün güncel
 * tarayıcılar okuyor. Üç boy (16/32/48) yeterli; büyük boyları zaten
 * icon.svg ve apple-icon.png karşılıyor.
 */

import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const KAYNAK = 'public/marka/ikon-512.png';
const HEDEF = 'src/app/favicon.ico';
const BOYLAR = [16, 32, 48];

const pngler = await Promise.all(
  BOYLAR.map((b) => sharp(KAYNAK).resize(b, b).png({ compressionLevel: 9 }).toBuffer())
);

const baslik = Buffer.alloc(6);
baslik.writeUInt16LE(0, 0); // ayrılmış
baslik.writeUInt16LE(1, 2); // tür: ikon
baslik.writeUInt16LE(BOYLAR.length, 4);

let konum = 6 + 16 * BOYLAR.length;
const girisler = BOYLAR.map((boy, i) => {
  const g = Buffer.alloc(16);
  g.writeUInt8(boy === 256 ? 0 : boy, 0); // genişlik
  g.writeUInt8(boy === 256 ? 0 : boy, 1); // yükseklik
  g.writeUInt8(0, 2); // renk sayısı (0 = 256'dan fazla)
  g.writeUInt8(0, 3); // ayrılmış
  g.writeUInt16LE(1, 4); // düzlem
  g.writeUInt16LE(32, 6); // bit derinliği
  g.writeUInt32LE(pngler[i].length, 8);
  g.writeUInt32LE(konum, 12);
  konum += pngler[i].length;
  return g;
});

writeFileSync(HEDEF, Buffer.concat([baslik, ...girisler, ...pngler]));
console.log(`${HEDEF} yazıldı — ${BOYLAR.join('/')} piksel, ${konum} bayt`);
