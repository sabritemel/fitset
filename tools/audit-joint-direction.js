/**
 * EKLEM YÖNÜ DENETİMİ —  node tools/audit-joint-direction.js
 *
 * verify-poses.js açının BÜYÜKLÜĞÜNÜ denetliyor (≤150°). Ama bir diz 40°
 * bükülmüş olabilir ve YANLIŞ YÖNE bükülmüş olabilir — büyüklük testi bunu
 * geçirir. Sabri'nin gördüğü "bacak ters tarafa kıvrılmış" tam olarak bu.
 *
 * İnsan ekleminde diz ve dirsek TEK YÖNE bükülür:
 *   diz    → topuk kalçaya doğru (baldır, uyluğun ARKASINA gider)
 *   dirsek → el omuza doğru (ön kol, üst kolun ÖNÜNE gider)
 *
 * 2B'de bu, işaretli açının SABİT İŞARETLİ olması demektir. İşaret hareket
 * sırasında değişiyorsa eklem düz konumu geçip ters tarafa kıvrılıyordur.
 *
 * Bu betik yalnız RAPOR üretir; hangi pozun düzeltileceğine bakılarak karar verilir.
 */
import { EX } from '../js/data/exercises.js';
import { poseAt } from '../js/anim/engine.js';

const N = 40;
const norm = a => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };

/** Eklem açısı: alt segmentin üst segmente göre işaretli sapması */
const eklem = (üst, alt) => norm(alt - üst);

const bulgular = [];

for (const [d, gün] of EX.entries()) for (const ex of gün) {
  const kareler = Array.from({ length: N + 1 }, (_, i) => poseAt(ex.a, ex.b, i / N));

  const eklemler = [
    ['diz',     p => eklem(p.th, p.sh)],
    ['diz-2',   p => (p.th2 === undefined ? null : eklem(p.th2, p.sh2 ?? p.sh))],
    ['dirsek',  p => eklem(p.ua, p.fa)],
    ['dirsek-2', p => (p.ua2 === undefined ? null : eklem(p.ua2, p.fa2 ?? p.fa))],
  ];

  for (const [ad, ölç] of eklemler) {
    const seri = kareler.map(ölç).filter(v => v !== null);
    if (!seri.length) continue;

    const min = Math.min(...seri), max = Math.max(...seri);
    // İşaret değişimi: bir uçta pozitif diğerinde negatif → düzü geçip ters bükülüyor
    const isaretDegisti = min < -6 && max > 6;
    // Tek yönde ama küçük bir ters pay: hafif hiperekstansiyon (kabul edilebilir)
    const hafifTers = !isaretDegisti && (min < -6 || max > 6) && Math.min(Math.abs(min), Math.abs(max)) < 6;

    if (isaretDegisti) {
      bulgular.push({
        gün: d + 1, ex: ex.en, eklem: ad, min: min.toFixed(0), max: max.toFixed(0),
        tip: 'TERS KIVRILMA', not: 'düz konumu geçip karşı yöne bükülüyor',
      });
    } else if (Math.abs(min) < 3 && Math.abs(max) < 3) {
      // hiç bükülmüyor — bilgi amaçlı, hata değil
    } else if (hafifTers) {
      bulgular.push({
        gün: d + 1, ex: ex.en, eklem: ad, min: min.toFixed(0), max: max.toFixed(0),
        tip: 'sınırda', not: 'düz konuma çok yaklaşıyor',
      });
    }
  }
}

console.log('\nEKLEM YÖNÜ DENETİMİ   (işaret değişimi = ters kıvrılma)');
console.log('─'.repeat(76));
if (!bulgular.length) console.log('  ✓ Hiçbir eklem ters yöne kıvrılmıyor.');
for (const b of bulgular.sort((x, y) => (x.tip < y.tip ? -1 : 1))) {
  const ok = b.tip === 'TERS KIVRILMA' ? '✗' : '⚠';
  console.log(`  ${ok} G${b.gün} ${b.ex.slice(0, 30).padEnd(32)} ${b.eklem.padEnd(9)} `
    + `${String(b.min).padStart(5)}° … ${String(b.max).padStart(4)}°   ${b.not}`);
}
console.log('─'.repeat(76));
const ters = bulgular.filter(b => b.tip === 'TERS KIVRILMA').length;
console.log(`${bulgular.length} bulgu · ${ters} ters kıvrılma`);
