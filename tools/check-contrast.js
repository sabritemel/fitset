/**
 * KONTRAST DENETİMİ —  node tools/check-contrast.js
 *
 * "Gözü yormasın" isteği göz kararıyla karşılanırsa iki hatadan birine düşülür:
 * ya yeterince kırılmaz, ya da okunmayacak kadar söner. İkisi de göz yorar.
 * Burada tonlar style.css'ten OKUNUP WCAG oranları hesaplanıyor.
 *
 * Eşikler: normal metin 4.5 · iri metin (≥24px veya ≥19px kalın) 3.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'css', 'style.css'), 'utf8');

/** :root bloğundaki değişkenleri oku — değerler tek yerde, denetim onu izler */
const tok = {};
for (const m of CSS.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/gm)) tok[m[1]] = m[2];

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = h => { const [r, g, b] = rgb(h).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b; };
const oran = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05); };

const BG = tok['--bg'];
const KONTROL = [
  ['ana metin',            tok['--ink'],  BG, 4.5],
  ['ikincil metin',        tok['--ink2'], BG, 4.5],
  ['etiket / üçüncül',     tok['--ink3'], BG, 4.5],
  ['iri rakam (76px)',     tok['--ink'],  BG, 3.0],
  ['figür çizgisi',        tok['--fig-stroke'], BG, 3.0],
  ['canlı sayaç',          tok['--live'], BG, 3.0],
  ['dikkat notu',          tok['--warn'], BG, 4.5],
  ['birincil düğme yazısı', BG, tok['--btn'], 4.5],
  ['birincil düğme dolgusu', tok['--btn'], BG, 3.0],
];

console.log(`\nKONTRAST DENETİMİ   zemin ${BG}\n${'─'.repeat(62)}`);
let fail = 0, warn = 0;
for (const [ad, fg, bg, esik] of KONTROL) {
  if (!fg || !bg) { console.log(`  ? ${ad.padEnd(24)} token bulunamadı`); warn++; continue; }
  const r = oran(fg, bg);
  const ok = r >= esik;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${ad.padEnd(24)} ${fg} → ${r.toFixed(1)}:1   (eşik ${esik})`);
}

// Parlaklık tavanı: karanlıkta hiçbir geniş yüzey göz kamaştırmamalı
const TAVAN = 0.70;
console.log(`\nPARLAKLIK TAVANI (göz kamaşması)   üst sınır ${TAVAN}`);
for (const [ad, t] of [['ana metin', '--ink'], ['birincil düğme dolgusu', '--btn'], ['figür', '--fig-stroke']]) {
  const l = lum(tok[t]);
  const ok = l <= TAVAN;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${ad.padEnd(24)} ${tok[t]} → ${l.toFixed(3)}`);
}

console.log(`\n${'─'.repeat(62)}\n${fail} hata · ${warn} uyarı`);
if (fail) { console.log('✗ Ton ayarı okunurluğu bozuyor.'); process.exit(1); }
console.log('✓ Tonlar kırık ama okunur.');
