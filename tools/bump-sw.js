/**
 * SERVICE WORKER SÜRÜMÜNÜ İÇERİKTEN ÜRET —  node tools/bump-sw.js
 *
 * Sorun: "dosya değiştirdiysen sw.js'teki CACHE sürümünü artır" bir İNSAN
 * KURALIYDI ve tam da beklendiği gibi unutuldu — tarayıcı eski CSS'i servis
 * etmeye devam etti, değişiklik "gitmemiş" gibi göründü.
 *
 * Çözüm: sürümü elle yazmak yerine önbelleğe alınan dosyaların İÇERİĞİNDEN
 * türet. Dosya değişmişse hash değişir, önbellek adı değişir, güncelleme
 * kendiliğinden tetiklenir. Unutulacak bir adım kalmaz.
 *
 * Commit öncesi çalıştır (npm test bunu da koşar).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SW = path.join(ROOT, 'sw.js');
let src = fs.readFileSync(SW, 'utf8');

// ASSETS listesini sw.js'in kendisinden oku — iki yerde liste tutmayalım
const blok = src.match(/const ASSETS = \[([\s\S]*?)\];/);
if (!blok) { console.error('✗ sw.js içinde ASSETS listesi bulunamadı'); process.exit(1); }
const dosyalar = [...blok[1].matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);

const h = crypto.createHash('sha256');
let okunan = 0, eksik = [];
for (const f of ['index.html', ...dosyalar].filter((v, i, a) => a.indexOf(v) === i)) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { eksik.push(f); continue; }
  h.update(f).update(fs.readFileSync(p));
  okunan++;
}
// fonts.css içerik değişirse de sürüm değişsin (fontlar runtime önbelleğinde)
const fc = path.join(ROOT, 'fonts', 'fonts.css');
if (fs.existsSync(fc)) h.update(fs.readFileSync(fc));

const yeni = 'fitset-' + h.digest('hex').slice(0, 10);
const eski = src.match(/const CACHE = '([^']+)'/)?.[1];

if (eksik.length) console.warn(`⚠ ASSETS'te olup diskte olmayan: ${eksik.join(', ')}`);

if (eski === yeni) { console.log(`· sw.js sürümü güncel (${yeni}, ${okunan} dosya)`); process.exit(0); }
src = src.replace(/const CACHE = '[^']+'/, `const CACHE = '${yeni}'`);
fs.writeFileSync(SW, src, 'utf8');
console.log(`✓ sw.js sürümü: ${eski} → ${yeni}  (${okunan} dosyanın içeriğinden)`);
