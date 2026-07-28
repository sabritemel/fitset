/**
 * PROTOTİPTEN VERİ ÇIKARICI — tek seferlik taşıma aracı.
 *
 * Neden betik? Poz verisi (18 egzersiz × 2 poz × ~10 eklem açısı) elle debug edilmiş,
 * anatomik olarak düzeltilmiş bir varlık. Elle kopyalamak transkripsiyon hatası riski
 * taşır ve o hata sessizce yanlış bir çizim üretir. Metni BİREBİR dilimleyip taşımak
 * bu riski sıfırlar.
 *
 * Kullanım:  node tools/extract-from-prototype.js <prototip.html>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || 'C:/Users/Sabri/Downloads/antrenman-programi_1.html';
const html = fs.readFileSync(src, 'utf8');

/** Kaynak metinden iki işaret arasını BİREBİR keser (yeniden serileştirme YOK) */
function slice(startMark, endMark, label) {
  const a = html.indexOf(startMark);
  const b = html.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error(`${label}: işaret bulunamadı (${startMark} … ${endMark})`);
  return html.slice(a, b).trim();
}

const exBlock = slice('const EX=[[', 'const FIN=', 'EX');
const finBlock = slice('const FIN=', '/* ---------- takvim', 'FIN');

const out = `/**
 * EGZERSİZ VERİSİ — prototipten MEKANİK olarak taşındı (elle yazılmadı).
 * Kaynak: ${path.basename(src)}
 * Araç:   tools/extract-from-prototype.js
 *
 * ┌─ YENİ EGZERSİZ EKLEMEK ─────────────────────────────────────────────────┐
 * │ 1. Aşağıdaki diziye bir nesne ekle. Zorunlu alanlar:                    │
 * │      en, tr        İngilizce + Türkçe ad                                │
 * │      sets, reps    set sayısı (veri) + etiket (görsel)                  │
 * │      view          'side' | 'front'                                     │
 * │      mus           çalışan kaslar (tek satır)                           │
 * │      a, b          başlangıç ve bitiş pozu — DERECE cinsinden açılar    │
 * │      eq            ekipman çizimi: (skeleton) => SVG string             │
 * │      steps         4 adımlık anlatım                                    │
 * │      tip           kırmızı "dikkat" notu                                │
 * │ 2. İsteğe bağlı: face(-1|1), nofoot, legs2, track, top, vl, al          │
 * │ 3. ⚠️ ZORUNLU: node tools/verify-poses.js çalıştır.                     │
 * │    Betik uzuv uzunluğunu, eklem limitini ve ayak-yerde kuralını         │
 * │    sayısal olarak denetler. Kırmızı varsa poz anatomik olarak yanlıştır.│
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Poz alanlarının anlamı için: js/anim/engine.js başlığı.
 */
import { plate, db, bar, cbl, rct, grd, grip } from '../anim/equipment.js';

export ${exBlock}

export ${finBlock}
`;

const dest = path.join(HERE, '..', 'js', 'data', 'exercises.js');
fs.writeFileSync(dest, out, 'utf8');

// Taşıma bütünlüğü: kaynaktaki egzersiz sayısı hedefte de aynı olmalı
const count = (exBlock.match(/^\s*en:"/gm) || []).length;
console.log(`✓ ${path.relative(process.cwd(), dest)} yazıldı`);
console.log(`  EX bloğu   : ${exBlock.length} karakter, ${count} egzersiz`);
console.log(`  FIN bloğu  : ${finBlock.length} karakter`);
