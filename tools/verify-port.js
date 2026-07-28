/**
 * TAŞIMA DOĞRULAYICI — tek seferlik.
 *
 * İP-1'in kabul kriteri: yeni modüller (js/anim/engine.js + js/data/exercises.js)
 * prototiple BİREBİR aynı çizimi üretmeli. "Bence aynı" yetmez; kanıt gerekir.
 *
 * Yöntem: prototipin kendi motorunu ve verisini kaynak metinden çalıştırıp,
 * 18 egzersiz × 41 ara kare için hem eklem koordinatlarını hem üretilen SVG
 * metnini karakter karakter karşılaştırır.
 *
 *   node tools/verify-port.js
 */
import fs from 'node:fs';
import * as neu from '../js/anim/engine.js';
import { EX as EXnew } from '../js/data/exercises.js';

const SRC = process.argv[2] || 'C:/Users/Sabri/Downloads/antrenman-programi_1.html';
const html = fs.readFileSync(SRC, 'utf8');

// new Function gerekçesi: prototipin motoru ve verisi bir HTML içinde gömülü düz
// metin; onu ÇALIŞTIRMADAN "aynı sonucu veriyor mu" sorusu yanıtlanamaz. Girdi
// kullanıcının kendi yerel dosyası, ağdan gelen veri değil. Tek seferlik araç.
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const engineSrc = cut('const L={', '/* ---------- program ---------- */');
const exSrc = cut('const EX=[[', '/* ---------- takvim');
const old = new Function(`${engineSrc}\n${exSrc}\nreturn {skeleton,poseAt,figure,trail,EX};`)();

/**
 * BİLİNÇLİ SAPMALAR — İP-2'de düzeltilen 3 anatomi hatası.
 * Bunlar prototipten KASTEN farklı; betik "fark yok" derse asıl o zaman
 * endişelenmek gerekir (düzeltme kaybolmuş demektir).
 *   endpointsSame: uç pozların (t=0 ve t=1) değişmemesi bekleniyor mu?
 */
const EXPECTED = {
  'Close Grip Pull Down': { endpointsSame: true, why: 'ua −90°→270°: aynı yön, kısa yol (dirsek 179°→131°)' },
  'Cable Curl': { endpointsSame: false, why: 'fa 105→53, fa2 75→57: bitiş fleksiyonu 197°→145°' },
  'Dumbbell Hammer Curl': { endpointsSame: false, why: 'fa 100→53, fa2 80→57: bitiş fleksiyonu 192°→145°' },
};

const STEPS = 40;
let frames = 0, jointDiff = 0, svgDiff = 0;
const bad = [];
const diverged = new Set();
const same = (a, b) => Object.keys(a).every(k => k === 'view' ? a[k] === b[k] : a[k][0] === b[k][0] && a[k][1] === b[k][1]);

if (old.EX.flat().length !== EXnew.flat().length)
  throw new Error(`Egzersiz sayısı uyuşmuyor: eski ${old.EX.flat().length}, yeni ${EXnew.flat().length}`);

for (const [d, day] of old.EX.entries()) {
  for (const [i, exOld] of day.entries()) {
    const exNew = EXnew[d][i];
    if (exOld.en !== exNew.en) { bad.push(`${d}-${i}: ad farklı (${exOld.en} ≠ ${exNew.en})`); continue; }

    // Bilinçli olarak düzeltilen egzersizler: farklı OLMALI, ayrıca iddia edilen
    // uç-poz davranışı da burada sınanır ("aynı yön, farklı yol" gerçekten öyle mi?)
    if (EXPECTED[exOld.en]) {
      const exp = EXPECTED[exOld.en];
      const endSame = [0, 1].every(t =>
        same(old.skeleton(old.poseAt(exOld.a, exOld.b, t), exOld.view),
             neu.skeleton(neu.poseAt(exNew.a, exNew.b, t), exNew.view)));
      if (endSame !== exp.endpointsSame)
        bad.push(`${exOld.en}: uç pozlar ${endSame ? 'AYNI' : 'FARKLI'} — beklenen ${exp.endpointsSame ? 'AYNI' : 'FARKLI'}`);
      diverged.add(exOld.en);
      continue;                                  // ara kareleri karşılaştırma: kasten farklı
    }

    // iz (t'den bağımsız) ve hayalet figür bir kez
    if (old.trail(exOld) !== neu.trail(exNew)) { bad.push(`${exOld.en}: trail() farklı`); svgDiff++; }

    for (let s = 0; s <= STEPS; s++) {
      const t = s / STEPS;
      const sOld = old.skeleton(old.poseAt(exOld.a, exOld.b, t), exOld.view);
      const sNew = neu.skeleton(neu.poseAt(exNew.a, exNew.b, t), exNew.view);
      frames++;

      for (const k of Object.keys(sOld)) {
        if (k === 'view') { if (sOld[k] !== sNew[k]) { jointDiff++; bad.push(`${exOld.en} t=${t}: view farklı`); } continue; }
        const [ax, ay] = sOld[k], [bx, by] = sNew[k];
        if (ax !== bx || ay !== by) { jointDiff++; bad.push(`${exOld.en} t=${t} ${k}: (${ax},${ay}) ≠ (${bx},${by})`); }
      }
      // çizilen SVG metni + ekipman katmanı
      if (old.figure(sOld, exOld) !== neu.figure(sNew, exNew)) { svgDiff++; bad.push(`${exOld.en} t=${t}: figure() farklı`); }
      if (exOld.eq && exOld.eq(sOld) !== exNew.eq(sNew)) { svgDiff++; bad.push(`${exOld.en} t=${t}: eq() farklı`); }
    }
  }
}

const untouched = EXnew.flat().length - diverged.size;
console.log(`\nTAŞIMA DOĞRULAMASI  (prototip → modüller)`);
console.log('─'.repeat(66));
console.log(`  dokunulmamış egzersiz : ${untouched}`);
console.log(`  karşılaştırılan       : ${frames} kare × 15 eklem + figure/eq/trail`);
console.log(`  eklem farkı           : ${jointDiff}`);
console.log(`  SVG metin farkı       : ${svgDiff}`);
console.log(`\n  bilinçli düzeltilen   : ${diverged.size}`);
for (const [en, e] of Object.entries(EXPECTED))
  console.log(`    • ${en}\n      ${e.why}\n      uç pozlar: ${e.endpointsSame ? 'DEĞİŞMEDİ ✓ (yalnız yol düzeldi)' : 'değişti (kasten)'}`);

if (bad.length) { console.log('\n✗ FARKLAR:'); bad.slice(0, 20).forEach(b => console.log('   ' + b)); }
else console.log(`\n✓ ${untouched} egzersiz BİREBİR AYNI; 3 düzeltme beklendiği gibi davranıyor.`);
process.exit(bad.length ? 1 : 0);
