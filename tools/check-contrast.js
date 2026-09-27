/**
 * KONTRAST DENETİMİ —  node tools/check-contrast.js
 *
 * "Gözü yormasın" isteği göz kararıyla karşılanırsa iki hatadan birine düşülür:
 * ya yeterince kırılmaz, ya da okunmayacak kadar söner. İkisi de göz yorar.
 * Burada tonlar style.css'ten OKUNUP WCAG oranları hesaplanıyor.
 *
 * ⚠️ 27 Eyl (tasarım dili 3): her metin tonu artık yalnız ZEMİNE değil, üzerine
 * konduğu HER YÜZEYE karşı ölçülüyor. Eski kapı yalnız zemini ölçüyordu ve mokapta
 * sönük ton zeminde 4,6:1 geçip gri yüzeyde 4,36:1'e düşmüştü — kapı bunu göremezdi.
 *
 * Eşikler: normal metin 4.5 · iri metin (≥24px veya ≥19px kalın) ve arayüz bileşeni sınırı 3.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'css', 'style.css'), 'utf8');

/** :root bloğundaki değişkenleri oku — değerler tek yerde, denetim onu izler */
const tok = {};
for (const m of CSS.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/gm)) tok[m[1]] ??= m[2];

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = h => { const [r, g, b] = rgb(h).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b; };
const oran = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05); };

/** Metin tonları × üzerine kondukları yüzeyler (css'teki kullanım) */
const YUZEY = { zemin: '--bg', grup: '--s1', kontrol: '--s2', basili: '--s3' };
const TON_YUZEY = [
  ['--t1', ['zemin', 'grup', 'kontrol', 'basili']],   // basılı çip ve bildirim üstünde birincil metin
  ['--t2', ['zemin', 'grup', 'kontrol', 'basili']],   // "program önerisi" rozeti s3 üstünde
  ['--t3', ['zemin', 'grup', 'kontrol']],             // sönük ton s3 üstüne KONMAZ
];
const KONTROL = [];
for (const [ton, yuzeyler] of TON_YUZEY)
  for (const y of yuzeyler) KONTROL.push([`${ton} / ${y}`, tok[ton], tok[YUZEY[y]], 4.5]);
KONTROL.push(
  ['vurgu metni / zemin (şimdi)',   tok['--acc'], tok['--bg'], 4.5],   // "Set 2 · şimdi" 12 px
  ['vurgu metni / grup',            tok['--acc'], tok['--s1'], 4.5],
  ['vurgu çerçevesi / zemin',       tok['--acc-line'], tok['--bg'], 3.0],   // WCAG 1.4.11
  ['dikkat işareti / grup',         tok['--warn'], tok['--s1'], 3.0],
  ['ana düğme yazısı',              tok['--on-btn'], tok['--btn'], 4.5],
  ['seçili (ters dolgu) yazısı',    tok['--bg'], tok['--t1'], 4.5],
  ['figür çizgisi / zemin',         tok['--fig-stroke'], tok['--bg'], 3.0],
);

console.log(`\nKONTRAST DENETİMİ   zemin ${tok['--bg']}\n${'─'.repeat(62)}`);
let fail = 0, warn = 0;
for (const [ad, fg, bg, esik] of KONTROL) {
  if (!fg || !bg) { console.log(`  ✗ ${ad.padEnd(30)} token bulunamadı`); fail++; continue; }
  const r = oran(fg, bg);
  const ok = r >= esik;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${ad.padEnd(30)} ${fg} / ${bg} → ${r.toFixed(2)}:1   (eşik ${esik})`);
}

// Üç metin tonu birbirinden AYRIŞMALI — eskiden ikincil ile sönük arası 1,32:1'di (üç ton fiilen iki)
const AYRISMA = 1.4;
console.log(`\nTON AYRIŞMASI   alt sınır ${AYRISMA}:1`);
for (const [a, b] of [['--t1', '--t2'], ['--t2', '--t3']]) {
  const r = oran(tok[a], tok[b]);
  const ok = r >= AYRISMA;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${(a + ' ↔ ' + b).padEnd(30)} ${r.toFixed(2)}:1`);
}

// Parlaklık tavanı: karanlıkta hiçbir geniş yüzey göz kamaştırmamalı (2. sürüm kararı, "gözü yormasın")
const TAVAN = 0.70;
console.log(`\nPARLAKLIK TAVANI (göz kamaşması)   üst sınır ${TAVAN}`);
for (const [ad, t] of [['birincil metin', '--t1'], ['ana düğme dolgusu', '--btn'], ['figür', '--fig-stroke']]) {
  const l = lum(tok[t]);
  const ok = l <= TAVAN;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${ad.padEnd(30)} ${tok[t]} → ${l.toFixed(3)}`);
}

console.log(`\n${'─'.repeat(62)}\n${fail} hata · ${warn} uyarı`);
if (fail) { console.log('✗ Ton ayarı okunurluğu bozuyor.'); process.exit(1); }
console.log('✓ Tonlar kırık ama okunur.');
