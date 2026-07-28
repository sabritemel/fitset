/**
 * GÖRÜŞ AÇISI DENETİMİ —  node tools/audit-views.js
 *
 * Soru: "bu hareket hangi açıdan en iyi anlaşılır?" tamamen zevk meselesi değil.
 * Ölçülebilir tarafı şu: SEÇİLEN AÇIDA HAREKET NE KADAR YOL ALIYOR?
 *
 * Açı yanlışsa (hareket kameraya doğru oluyorsa) uzuvlar 2B'de öne kısalır ve
 * ekranda neredeyse hiç kıpırdamaz — izleyen kişi hareketi anlayamaz. Bu ölçüde
 * düşük çıkan egzersizler "açısı gözden geçirilmeli" adaylarıdır.
 *
 * Ölçüler (hepsi gövde uzunluğuna — 60 birim — oranlanmış, ölçekten bağımsız):
 *   yol      : izlenen noktanın kat ettiği toplam mesafe
 *   genlik   : hareket boyunca tüm eklemlerin süpürdüğü alanın köşegeni
 *   çakışma  : iki uzvun üst üste binme oranı (yüksek = okunaksız)
 */
import { EX } from '../js/data/exercises.js';
import { L, skeleton, poseAt } from '../js/anim/engine.js';

const N = 32;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const MOVING = ['haA', 'haB', 'elA', 'elB', 'knA', 'knB', 'ftA', 'ftB', 'neck'];

/** İki doğru parçasının en yakın mesafesi — uzuv çakışması için kaba ölçü */
function segDist(p1, p2, p3, p4) {
  const d = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  return Math.min(d(p1, p3, p4), d(p2, p3, p4), d(p3, p1, p2), d(p4, p1, p2));
}

const rows = [];
for (const [d, gün] of EX.entries()) for (const ex of gün) {
  const k = ex.track || 'haA';
  const kareler = Array.from({ length: N + 1 }, (_, i) => skeleton(poseAt(ex.a, ex.b, i / N), ex.view));

  // izlenen noktanın kat ettiği yol
  let yol = 0;
  for (let i = 1; i <= N; i++) yol += dist(kareler[i - 1][k], kareler[i][k]);

  // tüm hareketli eklemlerin süpürdüğü alan
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of kareler) for (const j of MOVING) {
    if (!s[j]) continue;
    x0 = Math.min(x0, s[j][0]); x1 = Math.max(x1, s[j][0]);
    y0 = Math.min(y0, s[j][1]); y1 = Math.max(y1, s[j][1]);
  }
  const genlik = Math.hypot(x1 - x0, y1 - y0);

  // kol ile bacak üst üste biniyor mu (yandan görünümde sık)
  let çakışma = 0;
  for (const s of kareler) {
    const kol = [s.shA, s.haA], bacak = [s.hipA, s.ftA];
    if (segDist(kol[0], kol[1], bacak[0], bacak[1]) < 9) çakışma++;
  }

  rows.push({
    gün: d + 1, en: ex.en, view: ex.view + (ex.top ? '/üstten' : ''),
    yol: yol / L.torso, genlik: genlik / L.torso, çakışma: çakışma / (N + 1),
    track: k, al: ex.a.al !== undefined,
  });
}

const f = (n, w = 5) => n.toFixed(2).padStart(w);
console.log('\nGÖRÜŞ AÇISI DENETİMİ  (değerler gövde boyuna oranlı)\n' + '─'.repeat(78));
console.log('G  EGZERSİZ                            AÇI            YOL GENLİK ÇAKIŞMA');
console.log('─'.repeat(78));
for (const r of rows.sort((a, b) => a.yol - b.yol)) {
  const bayrak = r.yol < 0.45 ? '  ← genliği düşük' : r.çakışma > 0.5 ? '  ← uzuvlar örtüşüyor' : '';
  console.log(`${r.gün}  ${r.en.slice(0, 32).padEnd(34)}${r.view.padEnd(13)}${f(r.yol)} ${f(r.genlik)} ${f(r.çakışma)}${bayrak}`);
}
console.log('─'.repeat(78));
const zayıf = rows.filter(r => r.yol < 0.45);
console.log(`${rows.length} egzersiz · ${zayıf.length} tanesinin açısı gözden geçirilmeli`);
if (zayıf.length) console.log('  ' + zayıf.map(r => r.en).join('\n  '));
