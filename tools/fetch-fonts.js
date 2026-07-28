/**
 * FONT İNDİRİCİ — tek seferlik.
 *
 * Prototip fontları Google CDN'den çekiyordu. Çevrimdışı bir PWA'da bu, uçak
 * modunda tipografinin çökmesi demek. Bu betik woff2 dosyalarını yerele indirip
 * CSS'i yeniden yazar.
 *
 * ⚠️ ALT KÜME (subset) SEÇİMİ HAYATİ:
 *    latin      → a-z, ç ö ü  (U+0000-00FF)
 *    latin-ext  → ğ ş ı İ     (U+0100-...)   ← Türkçe bunsuz TOFU olur
 *    vietnamese → gereksiz, atılıyor
 * Yeni bir alfabe/karakter eklersen bu listeyi gözden geçir.
 *
 *   node tools/fetch-fonts.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');
const KEEP = new Set(['latin', 'latin-ext']);
const css = fs.readFileSync(path.join(DIR, 'raw.css'), 'utf8');

// CSS, her @font-face'in üstüne /* altküme */ yorumu koyar — ona göre bölüyoruz
const chunks = css.split(/\/\* ([a-z-]+) \*\//).slice(1);
const out = [];
let kept = 0, skipped = 0, bytes = 0;

for (let i = 0; i < chunks.length; i += 2) {
  const subset = chunks[i], block = chunks[i + 1];
  if (!KEEP.has(subset)) { skipped++; continue; }

  const fam = block.match(/font-family:\s*'([^']+)'/)[1];
  const wght = block.match(/font-weight:\s*([\d ]+)/)[1].trim().replace(/\s+/g, '-');
  const url = block.match(/url\((https:[^)]+)\)/)[1];
  const file = `${fam.toLowerCase().replace(/\s+/g, '-')}-${wght}-${subset}.woff2`;

  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(path.join(DIR, file), buf);
  bytes += buf.length; kept++;

  out.push(`/* ${fam} ${wght} · ${subset} */\n${block.replace(/url\(https:[^)]+\)/, `url(./${file})`).trim()}`);
  console.log(`  ↓ ${file.padEnd(44)} ${(buf.length / 1024).toFixed(1)} KB`);
}

fs.writeFileSync(path.join(DIR, 'fonts.css'), out.join('\n\n') + '\n', 'utf8');
fs.unlinkSync(path.join(DIR, 'raw.css'));
console.log(`\n✓ ${kept} dosya indirildi (${(bytes / 1024).toFixed(0)} KB), ${skipped} altküme atlandı`);
console.log('  fonts/fonts.css yazıldı — index.html bunu çağırmalı, CDN'.concat("'i değil"));
