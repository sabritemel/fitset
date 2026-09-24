/**
 * KILAVUZ KAPISI —  node tools/check-docs.js
 *
 * Sorun: KULLANIM.md 28 Temmuz'da yazıldı ve İKİ AY boyunca "Ayarlar ekranı
 * yok", "dinlenme 90 sn", "dört doğrulayıcı" demeye devam etti. Bu arada üç
 * ekran ve üç test betiği eklendi. Belge kimse unuttuğu için değil, onu koda
 * bağlayan hiçbir şey olmadığı için bayatladı (projenin kendi dersi: kayıt
 * koda bağlanmazsa sessizce bayatlar).
 *
 * Bu kapı iki şeyi KODDAN okur ve belgede arar:
 *   1. index.html'deki her ekran (<main id="…-screen">) → KULLANIM.md'de
 *      "### <Ekran adı>" başlığı olmalı
 *   2. package.json "test" betiğindeki her araç → KULLANIM.md'de adıyla anılmalı
 *
 * Yeni bir ekran eklenince aşağıdaki EKRAN_ADI tablosunda karşılığı yoksa da
 * kırmızı yanar — ekran adını vermek, onu belgelemenin ilk adımıdır.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** Ekran kimliği → kılavuzdaki başlık. Arayüzde kullanıcının gördüğü ad. */
const EKRAN_ADI = {
  'list-screen': 'Liste',
  'focus-screen': 'Odak',
  'warmup-screen': 'Isınma',
  'settings-screen': 'Ayarlar',
  'history-screen': 'Geçmiş',
  'session-screen': 'Seans düzenleme',
};

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };

const kilavuz = oku('KULLANIM.md');
const basliklar = new Set([...kilavuz.matchAll(/^###\s+(.+?)\s*$/gm)].map(m => m[1]));

console.log('\n1) HER EKRAN KILAVUZDA ANLATILIYOR');
const ekranlar = [...oku('index.html').matchAll(/<main\s+id="([^"]+-screen)"/g)].map(m => m[1]);
ok(ekranlar.length > 0, `index.html'den ${ekranlar.length} ekran okundu`);
for (const id of ekranlar) {
  const ad = EKRAN_ADI[id];
  if (!ad) { ok(false, `${id} — YENİ ekran: EKRAN_ADI tablosuna adını ver ve KULLANIM.md'ye "### Ad" bölümü ekle`); continue; }
  ok(basliklar.has(ad), `${id} → "### ${ad}"`);
}

console.log('\n2) HER TEST BETİĞİ KILAVUZDA ANILIYOR');
const betikler = [...(JSON.parse(oku('package.json')).scripts?.test ?? '').matchAll(/tools\/([\w-]+\.js)/g)].map(m => m[1]);
ok(betikler.length > 0, `npm test'ten ${betikler.length} betik okundu`);
for (const b of betikler) ok(kilavuz.includes('`' + b + '`'), `${b}`);

console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
