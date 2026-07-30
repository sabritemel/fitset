/**
 * FONT İNDİRİCİ —  node tools/fetch-fonts.js
 *
 * Tek aile: **Archivo** (değişken eksenli grotesk).
 *
 * Neden tek aile: önceki tasarımda üç aile vardı (Bricolage + Karla + Space
 * Mono) ve ikisi karakterliydi — sonuç "indie defter" gibi okunuyordu,
 * profesyonel bir spor aracı gibi değil. Doğru hamle karşıt eksende
 * EŞLEŞTİRMEK ya da TEK aileyi ağırlık/genişlikle çalıştırmaktır. Archivo
 * ikincisine birebir uygun:
 *   · wght 400-700  → hiyerarşi ağırlıkla kurulur, aile değiştirmeden
 *   · wdth 75-125   → büyük rakamlar genişletilir, etiketler sıkıştırılır
 *   · hizalı (tabular) rakamlar — ağırlık/tekrar için şart
 *
 * ⚠️ ALT KÜME: latin + latin-ext ŞART (ğ ş ı İ latin-ext'te). vietnamese atılır.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');
const KEEP = new Set(['latin', 'latin-ext']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const API = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,400..700&display=swap';

const css = await (await fetch(API, { headers: { 'User-Agent': UA } })).text();
const chunks = css.split(/\/\* ([a-z-]+) \*\//).slice(1);

let out = '', kept = 0, bytes = 0;
for (let i = 0; i < chunks.length; i += 2) {
  const subset = chunks[i], block = chunks[i + 1];
  if (!KEEP.has(subset)) continue;
  const url = block.match(/url\((https:[^)]+)\)/)[1];
  const file = `archivo-${subset}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(path.join(DIR, file), buf);
  bytes += buf.length; kept++;
  out += `/* Archivo · ${subset} · wght 400-700 · wdth 75-125 */\n`
    + block.replace(/url\(https:[^)]+\)/, `url(./${file})`).trim() + '\n\n';
  console.log(`  ↓ ${file.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB`);
}

fs.writeFileSync(path.join(DIR, 'fonts.css'), out, 'utf8');

// Eski üç ailenin dosyaları artık kullanılmıyor
let silinen = 0;
for (const f of fs.readdirSync(DIR))
  if (/^(bricolage|karla|space-mono)/.test(f)) { fs.unlinkSync(path.join(DIR, f)); silinen++; }
for (const f of ['raw.css', 'arch.css'])
  if (fs.existsSync(path.join(DIR, f))) fs.unlinkSync(path.join(DIR, f));

console.log(`\n✓ ${kept} dosya (${(bytes / 1024).toFixed(0)} KB) · eski ${silinen} dosya silindi`);
console.log('  Önceki kurulum: 3 aile / 14 dosya / 380 KB.');
