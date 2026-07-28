/**
 * TASARIM YÖNÜ MOCKUP'I —  node tools/make-mockup.js
 *
 * Üç tasarım yönünü AYNI içerikle yan yana gösterir. Çubuk adamlar uygulamanın
 * GERÇEK motoruyla çizilir; karşılaştırma renk/yerleşim/bilgi mimarisi üzerinden
 * yapılsın diye çizim üçünde de aynıdır.
 *
 * Not: her yönün CSS'i `#a`, `#b`, `#c` altında kapsanmıştır — iframe kullanılsaydı
 * gömülü fontlar dört kez tekrarlanır ve dosya 1.9 MB'a çıkardı.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EX } from '../js/data/exercises.js';
import * as E from '../js/anim/engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let FONTS = '';
for (const [fam, w, stem] of [
  ['Bricolage Grotesque', 800, 'bricolage-grotesque-800'],
  ['Karla', 400, 'karla-400'], ['Karla', 700, 'karla-700'],
  ['Space Mono', 400, 'space-mono-400'],
]) for (const sub of ['latin', 'latin-ext']) {          // latin-ext ŞART: ğ ş ı İ orada
  const p = path.join(ROOT, 'fonts', `${stem}-${sub}.woff2`);
  if (!fs.existsSync(p)) continue;
  FONTS += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;`
    + `src:url(data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}) format('woff2')}\n`;
}

const ex = EX[0][0];
const s = E.skeleton(E.poseAt(ex.a, ex.b, 0.58), ex.view);
const FIG = `<svg viewBox="0 0 260 200" aria-hidden="true"><g fill="none" stroke-width="4"
  stroke-linecap="round" stroke-linejoin="round">${ex.eq(s) + E.ghostOf(ex) + E.trailOf(ex) + E.figure(s, ex)}</g></svg>`;

/* ── YÖN A · ODAK ─────────────────────────────────────────────────────── */
const cssA = `
#a{--bg:#0E1118;--surf:#161C27;--line:#232B3A;--tx:#ECE7DF;--dim:#7E889D;--acc:#FF4D6D;--ok:#46C7A8;
  background:var(--bg);color:var(--tx);font-family:'Karla',system-ui,sans-serif;display:flex;flex-direction:column}
#a .rail{display:flex;gap:4px;padding:16px 18px 0}
#a .rail i{flex:1;height:4px;border-radius:2px;background:var(--line)}
#a .rail i.d{background:var(--ok)}#a .rail i.c{background:var(--acc)}
#a .top{display:flex;justify-content:space-between;padding:14px 18px 0;font-family:'Space Mono',monospace;
  font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
#a h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:29px;line-height:1.03;
  letter-spacing:-.025em;margin:12px 18px 0;text-wrap:balance}
#a .sub{margin:5px 18px 0;color:var(--dim);font-size:14px}
#a .viz{margin:14px 18px 0;background:var(--surf);border-radius:16px;padding:6px 0}
#a .viz [stroke]{stroke:var(--tx)}#a .viz .eq,#a .viz .cbl{stroke:#5A6478}#a .viz .gr{stroke:#39414F}
#a .viz .ghost{stroke:#3A4256}#a .viz .trail{stroke:#A8506A}
#a .prev{margin:14px 18px 0;font-family:'Space Mono',monospace;font-size:12px;color:var(--dim)}
#a .prev b{color:var(--tx);font-weight:400}
#a .chips{display:flex;gap:6px;padding:12px 18px 0}
#a .chips span{padding:6px 10px;border-radius:8px;background:var(--surf);font-size:11px;
  font-family:'Space Mono',monospace;color:var(--dim)}
#a .chips span.on{background:rgba(70,199,168,.14);color:var(--ok)}
#a .pad{flex:1;min-height:14px}
#a .nums{display:flex;gap:12px;padding:6px 18px 0}
#a .nums .f{flex:1;text-align:center}
#a .lb{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);display:block;margin-bottom:6px}
#a .val{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:46px;line-height:1;
  font-variant-numeric:tabular-nums;letter-spacing:-.03em}
#a .val small{font-size:15px;color:var(--dim);margin-left:3px}
#a .pm{display:flex;gap:10px;margin-top:10px}
#a .pm button{flex:1;height:46px;border-radius:11px;background:var(--surf);font-size:23px;color:var(--tx)}
#a .go{margin:16px 18px 0;height:60px;border-radius:15px;background:var(--acc);color:#12060A;
  font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:19px;width:calc(100% - 36px)}
#a .nav{display:flex;justify-content:space-between;padding:14px 18px 22px;
  font-family:'Space Mono',monospace;font-size:12px;color:var(--dim)}`;

const htmlA = `
<div class="rail"><i class="d"></i><i class="d"></i><i class="c"></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
<div class="top"><span>1. Gün · Göğüs</span><span>3 / 9</span></div>
<h2 lang="en">Barbell Bench Press</h2>
<p class="sub">Bar ile düz bench press · 3 set × 12</p>
<div class="viz">${FIG}</div>
<p class="prev">Geçen sefer <b>40 kg × 12 · 40 × 12 · 40 × 10</b></p>
<div class="chips"><span class="on">✓ 42,5 × 12</span><span class="on">✓ 42,5 × 11</span><span>3. set</span></div>
<div class="pad"></div>
<div class="nums">
  <div class="f"><span class="lb">Ağırlık · bar dahil</span><div class="val">42,5<small>kg</small></div>
    <div class="pm"><button>−</button><button>+</button></div></div>
  <div class="f"><span class="lb">Tekrar</span><div class="val">11</div>
    <div class="pm"><button>−</button><button>+</button></div></div>
</div>
<button class="go">3. seti kaydet</button>
<div class="nav"><span>‹ Önceki</span><span>Dinlenme 90 sn</span><span>Sonraki ›</span></div>`;

/* ── YÖN B · KONSOL ───────────────────────────────────────────────────── */
const cssB = `
#b{--bg:#141517;--pan:#1C1E21;--ln:#2B2E33;--tx:#E7E4E0;--dim:#8B8F95;--acc:#FFB000;--ok:#5FD08A;
  background:var(--bg);color:var(--tx);font-family:'Karla',system-ui,sans-serif;font-size:15px}
#b .hd{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid var(--ln)}
#b .hd .l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
#b .hd h3{font-family:'Space Mono',monospace;font-size:14px;margin:4px 0 0;letter-spacing:-.01em;font-weight:400}
#b .meter{text-align:right;font-family:'Space Mono',monospace}
#b .meter b{font-size:22px;color:var(--acc);font-variant-numeric:tabular-nums}
#b .meter span{display:block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
#b .ch{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--ln)}
#b .ch .ix{color:var(--dim);font-size:11px;width:20px;font-family:'Space Mono',monospace}
#b .ch .nm{flex:1;font-size:15px}
#b .ch .st{display:flex;gap:3px}
#b .ch .st i{width:7px;height:15px;background:var(--ln);border-radius:1px}
#b .ch .st i.f{background:var(--ok)}
#b .ch.sel{background:var(--pan);box-shadow:inset 3px 0 0 var(--acc)}
#b .panel{background:var(--pan);border-bottom:1px solid var(--ln);padding:14px 16px 16px}
#b .viz{background:#0F1012;border:1px solid var(--ln);border-radius:4px;margin-bottom:13px}
#b .viz [stroke]{stroke:var(--tx)}#b .viz .eq,#b .viz .cbl{stroke:#6B6F76}#b .viz .gr{stroke:#3A3E44}
#b .lastline{font-family:'Space Mono',monospace;font-size:11px;color:var(--dim);margin:0 0 12px}
#b .lastline b{color:var(--tx);font-weight:400}
#b table{width:100%;border-collapse:collapse;font-family:'Space Mono',monospace;font-size:13px}
#b th{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);text-align:right;
  padding:0 0 7px;font-weight:400}
#b th:first-child,#b td:first-child{text-align:left}
#b td{padding:7px 0;border-top:1px solid var(--ln);text-align:right;font-variant-numeric:tabular-nums}
#b tr.warm td{color:var(--dim)}
#b .tag{font-size:9px;letter-spacing:.1em;color:var(--acc);border:1px solid var(--acc);padding:2px 6px;border-radius:3px}
#b .entry{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
#b .fld{border:1px solid var(--ln);border-radius:4px;background:#0F1012}
#b .fld span{display:block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--dim);padding:8px 9px 0}
#b .fld .r{display:flex;align-items:center}
#b .fld b{flex:1;text-align:center;font-family:'Space Mono',monospace;font-size:21px;
  font-variant-numeric:tabular-nums;padding:2px 0 9px}
#b .fld button{width:38px;height:44px;color:var(--acc);font-size:19px}
#b .commit{width:100%;margin-top:12px;height:50px;border-radius:4px;background:var(--acc);color:#171207;
  font-family:'Space Mono',monospace;font-weight:700;font-size:13px;letter-spacing:.1em;text-transform:uppercase}`;

const htmlB = `
<div class="hd"><div><span class="l">Oturum · 28.07.2026</span><h3>GÜN 1 — GÖĞÜS / OMUZ / TRİCEPS</h3></div>
  <div class="meter"><b>07/27</b><span>set</span></div></div>
<div class="ch sel"><span class="ix">01</span><span class="nm" lang="en">Barbell Bench Press</span>
  <span class="st"><i class="f"></i><i class="f"></i><i></i></span></div>
<div class="panel">
  <div class="viz">${FIG}</div>
  <p class="lastline">GEÇEN SEFER · 25.07 → <b>40×12 · 40×12 · 40×10</b> · hacim 1.360 kg</p>
  <table><thead><tr><th>Set</th><th>Ağırlık</th><th>Tekrar</th><th>Hacim</th></tr></thead><tbody>
    <tr class="warm"><td>ısınma</td><td>20,0</td><td>15</td><td>—</td></tr>
    <tr><td>1</td><td>42,5</td><td>12</td><td>510</td></tr>
    <tr><td>2</td><td>42,5</td><td>11</td><td>468</td></tr>
    <tr><td>3</td><td colspan="3"><span class="tag">bekliyor</span></td></tr>
  </tbody></table>
  <div class="entry">
    <div class="fld"><span>Ağırlık kg · bar dahil</span><div class="r"><button>−</button><b>42,5</b><button>+</button></div></div>
    <div class="fld"><span>Tekrar</span><div class="r"><button>−</button><b>11</b><button>+</button></div></div>
  </div>
  <button class="commit">Seti kaydet</button>
</div>
<div class="ch"><span class="ix">02</span><span class="nm" lang="en">Dumbbell Bench Fly</span>
  <span class="st"><i class="f"></i><i class="f"></i><i class="f"></i></span></div>
<div class="ch"><span class="ix">03</span><span class="nm" lang="en">Incline Chest Press</span>
  <span class="st"><i class="f"></i><i></i><i></i></span></div>
<div class="ch"><span class="ix">04</span><span class="nm" lang="en">Dumbbell Shoulder Press</span>
  <span class="st"><i></i><i></i><i></i></span></div>`;

/* ── YÖN C · KÂĞIT+ ───────────────────────────────────────────────────── */
const cssC = `
#c{--bg:#F4EAEE;--card:#FFF;--ink:#1B2276;--dim:#6E6678;--acc:#C81E4E;--soft:#F7F2F4;--ln:#EAE2E6;
  background:var(--bg);color:#2B2531;font-family:'Karla',system-ui,sans-serif;font-size:16px;padding-bottom:26px}
#c .hd{padding:26px 20px 8px}
#c .hd .l{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);margin:0}
#c .hd h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:34px;color:var(--ink);
  margin:6px 0 2px;letter-spacing:-.03em}
#c .hd p.s{margin:0;color:var(--dim);font-size:14.5px}
#c .sum{display:flex;gap:10px;padding:16px 20px 0}
#c .sum div{flex:1;background:var(--card);border-radius:13px;padding:13px 14px}
#c .sum span{display:block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.15em;
  text-transform:uppercase;color:var(--dim);margin-bottom:3px}
#c .sum b{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;color:var(--ink);font-variant-numeric:tabular-nums}
#c .sum b i{font-size:12px;font-style:normal;color:var(--dim)}
#c .card{background:var(--card);border-radius:16px;margin:14px 20px 0;padding:18px}
#c .crow{display:flex;align-items:flex-start;gap:12px}
#c .crow h3{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:19px;color:var(--ink);
  margin:0;letter-spacing:-.015em}
#c .crow p{color:var(--dim);font-size:14px;margin:2px 0 0}
#c .ct{font-family:'Space Mono',monospace;font-size:12.5px;color:var(--dim);white-space:nowrap;padding-top:3px}
#c .viz{background:var(--soft);border-radius:12px;margin-top:14px}
#c .viz [stroke]{stroke:var(--ink)}#c .viz .eq,#c .viz .cbl{stroke:#9A93A4}#c .viz .gr{stroke:#CFC7D2}
#c .last{font-family:'Space Mono',monospace;font-size:12px;color:var(--dim);margin:15px 0 12px}
#c .last b{color:var(--ink);font-weight:400}
#c .done{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
#c .done span{font-family:'Space Mono',monospace;font-size:12px;background:var(--soft);border-radius:8px;
  padding:6px 11px;color:var(--ink)}
#c .done span.w{color:var(--dim)}
#c .ent{display:flex;gap:10px}
#c .ent .f{flex:1}
#c .ent .lb{display:block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dim);margin-bottom:5px}
#c .bx{display:flex;align-items:center;border:1.5px solid var(--ln);border-radius:11px;background:var(--soft)}
#c .bx button{width:42px;height:50px;color:var(--ink);font-size:21px}
#c .bx b{flex:1;text-align:center;font-family:'Bricolage Grotesque',sans-serif;font-size:22px;
  color:var(--ink);font-variant-numeric:tabular-nums}
#c .save{width:100%;margin-top:12px;height:54px;border-radius:12px;background:var(--ink);color:#fff;
  font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:17px}
#c .mini{background:var(--card);border-radius:16px;margin:12px 20px 0;padding:15px 18px;display:flex;
  align-items:center;gap:12px}
#c .mini h3{font-family:'Bricolage Grotesque',sans-serif;font-size:17px;color:var(--ink);margin:0;flex:1;font-weight:800}
#c .mini .ct{font-family:'Space Mono',monospace;font-size:12.5px;color:var(--dim);padding:0}
#c .mini.ok .ct{color:#1F8F6B}`;

const htmlC = `
<div class="hd"><p class="l">28 Temmuz Salı</p><h2>1. Gün</h2><p class="s">Göğüs · Omuz · Triceps</p></div>
<div class="sum">
  <div><span>Set</span><b>7 / 27</b></div>
  <div><span>Hacim</span><b>1.840<i> kg</i></b></div>
  <div><span>Süre</span><b>34<i> dk</i></b></div>
</div>
<div class="card">
  <div class="crow"><div style="flex:1"><h3 lang="en">Barbell Bench Press</h3>
    <p>Bar ile düz bench press</p></div><span class="ct">2/3</span></div>
  <div class="viz">${FIG}</div>
  <p class="last">Geçen sefer · 3 gün önce · <b>40×12 · 40×12 · 40×10</b></p>
  <div class="done"><span class="w">ısınma 20×15</span><span>42,5 × 12</span><span>42,5 × 11</span></div>
  <div class="ent">
    <div class="f"><span class="lb">kg · bar dahil</span><div class="bx"><button>−</button><b>42,5</b><button>+</button></div></div>
    <div class="f"><span class="lb">tekrar</span><div class="bx"><button>−</button><b>11</b><button>+</button></div></div>
  </div>
  <button class="save">3. seti kaydet</button>
</div>
<div class="mini ok"><h3 lang="en">Dumbbell Bench Fly</h3><span class="ct">3/3 ✓</span></div>
<div class="mini"><h3 lang="en">Incline Chest Press</h3><span class="ct">1/3</span></div>
<div class="mini"><h3 lang="en">Dumbbell Shoulder Press</h3><span class="ct">0/3</span></div>`;

const DIRS = [
  { id: 'a', kod: 'A', ad: 'ODAK', css: cssA, html: htmlA,
    tez: 'Ekran yalnız <b>şu anki hareketi</b> gösterir. Diğer sekizi üstteki şeride iner.',
    art: ['Salonda bilişsel yük neredeyse sıfır — aranacak bir şey yok', 'Rakamlar kol mesafesinden okunacak kadar iri', 'Tek başparmakla ileri/geri'],
    eks: ['Genel görünüm kayboluyor; “bugün ne kaldı” için şeride bakmak gerek', 'Salon dışında programı gözden geçirmek daha zor'] },
  { id: 'b', kod: 'B', ad: 'KONSOL', css: cssB, html: htmlB,
    tez: 'Yaşam tarzı uygulaması değil, <b>ölçüm cihazı</b>. Veri tablo halinde, hizalı rakamlarla.',
    art: ['En “profesyonel” duran seçenek; veri yoğunluğu yüksek', 'Hacim ve ilerleme anında görünür', 'Senin endüstriyel dünyanla akraba bir dil'],
    eks: ['Yoğun — ter içinde okumak A yönünden zor', 'Sıcaklığı düşük; kişisel bir defter gibi hissettirmez'] },
  { id: 'c', kod: 'C', ad: 'KÂĞIT+', css: cssC, html: htmlC,
    tez: 'Mevcut kimlik <b>korunur ama olgunlaşır</b>: çizgili desen kalkar, beyaz kartlar yüzer, boşluk cömertleşir.',
    art: ['Kimlikte süreklilik — tanıdık ama belirgin şekilde daha temiz', 'Üstte özet şeridi: set / hacim / süre', 'Gündüz salonunda en okunaklısı'],
    eks: ['Üç yön içinde en tanıdık, en az cesur olanı', 'Uzun listede yine kaydırma var'] },
];

const page = `<style>${FONTS}
:root{--bg:#F1EEF2;--pan:#FFF;--ln:#E0DAE3;--tx:#241F29;--dim:#6B6472;--acc:#C81E4E}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#131016;--pan:#1B171E;--ln:#2C2631;--tx:#EAE5EC;--dim:#9B92A2;--acc:#FF5C82}}
:root[data-theme="dark"]{--bg:#131016;--pan:#1B171E;--ln:#2C2631;--tx:#EAE5EC;--dim:#9B92A2;--acc:#FF5C82}
:root[data-theme="light"]{--bg:#F1EEF2;--pan:#FFF;--ln:#E0DAE3;--tx:#241F29;--dim:#6B6472;--acc:#C81E4E}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:'Karla',system-ui,sans-serif;font-size:16px;line-height:1.6}
.pg{max-width:1280px;margin:0 auto;padding:44px 22px 80px}
.eb{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);margin:0 0 10px}
h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:clamp(28px,4.6vw,42px);
  line-height:1.03;letter-spacing:-.028em;margin:0 0 14px;text-wrap:balance}
.lede{max-width:64ch;color:var(--dim);margin:0 0 10px}
.lede b{color:var(--tx)}
.grid{display:grid;gap:28px;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));margin-top:34px}
.col{display:flex;flex-direction:column;gap:14px;min-width:0}
.tag{display:flex;align-items:baseline;gap:10px}
.tag .k{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.2em;color:var(--acc)}
.tag h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:24px;margin:0;letter-spacing:-.02em}
.tez{margin:0;font-size:14.5px;color:var(--dim);min-height:3.1em}
.tez b{color:var(--tx);font-weight:700}
.ph{height:824px;border:1px solid var(--ln);border-radius:20px;overflow:hidden;position:relative;
  box-shadow:0 14px 44px rgb(0 0 0/.16)}
.screen{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}
.screen::-webkit-scrollbar{width:0}
.pro,.con{margin:0;padding:0;list-style:none;font-size:13.5px}
.pro li,.con li{padding:4px 0 4px 20px;position:relative;color:var(--dim);line-height:1.45}
.pro li::before{content:'+';position:absolute;left:2px;color:#1F8F6B;font-weight:700}
.con li::before{content:'−';position:absolute;left:2px;color:var(--acc);font-weight:700}
.ask{background:var(--pan);border:1px solid var(--ln);border-radius:12px;padding:20px 22px;margin-top:38px}
.ask h3{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;margin:0 0 8px;font-weight:800}
.ask p{margin:0 0 8px;font-size:14.5px;color:var(--dim)}
.ask ul{margin:0;padding-left:20px;font-size:14.5px;color:var(--dim)}
.ask li{margin-bottom:3px}
.foot{margin-top:26px;font-family:'Space Mono',monospace;font-size:12px;color:var(--dim)}
button:focus-visible,a:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
${DIRS.map(d => d.css).join('\n')}
</style>
<div class="pg">
  <p class="eb">FitSet · tasarım yönü karşılaştırması</p>
  <h1>Aynı an, üç farklı sunum</h1>
  <p class="lede">Üçünde de aynı şey oluyor: 1. Gün, Bench Press, iki set girilmiş, üçüncüsü bekliyor.
  Değişen tek şey <b>bilgi mimarisi, renk ve yoğunluk</b>. Çubuk adam üçünde de uygulamanın gerçek
  çizim motoruyla üretildi — karşılaştırmayı çizim değil, sunum üzerinden yapabilesin diye.</p>
  <p class="lede">Telefon ekranlarını <b>kaydırarak</b> tamamını gezebilirsin.</p>

  <div class="grid">
    ${DIRS.map(d => `<div class="col">
      <div class="tag"><span class="k">YÖN ${d.kod}</span><h2>${d.ad}</h2></div>
      <p class="tez">${d.tez}</p>
      <div class="ph"><div class="screen" id="${d.id}">${d.html}</div></div>
      <ul class="pro">${d.art.map(x => `<li>${x}</li>`).join('')}</ul>
      <ul class="con">${d.eks.map(x => `<li>${x}</li>`).join('')}</ul>
    </div>`).join('')}
  </div>

  <div class="ask">
    <h3>Hangi yön seçilirse seçilsin bunlar sabit</h3>
    <p>Bunlar görsel değil davranış kararları — üçünde de aynen geçerli:</p>
    <ul>
      <li>Aynı anda tek hareket açık; yarı açık kartlar ekranda birikmiyor</li>
      <li>“Geçen sefer” her zaman girişin hemen üstünde, kutular onunla önceden dolu</li>
      <li>Ağırlığın ne demek olduğu yazılı: <b>bar dahil</b> / <b>tek dambıl</b></li>
      <li>Son set tek dokunuşla geri alınır — onay diyaloğu akışı keserdi</li>
      <li>Isınma setleri hacme ve “geçen sefer”e karışmaz</li>
      <li>Dokunma hedefleri parmak ölçüsünde (≥52 px)</li>
      <li>Çevrimdışı çalışır; veri cihazda kalır, sunucuya gitmez</li>
    </ul>
  </div>
  <p class="foot">Üreten: tools/make-mockup.js · çizim: js/anim/engine.js · içerik: js/data/exercises.js</p>
</div>`;

/* ── Çıktı denetimi ───────────────────────────────────────────────────────
   Bozuk bir renk değeri ("#3A4considered" gibi) sessizce geçip tarayıcıda
   yalnızca "o çizgi görünmüyor" olarak belirir — gözle yakalanması zor.
   Üretim anında yakalanması ucuz, o yüzden burada denetleniyor. */
const gövde = page.replace(/base64,[A-Za-z0-9+/=]+/g, 'base64,…');    // font verisini tarama dışı bırak
const kötüRenk = [...gövde.matchAll(/:\s*#([0-9A-Za-z]+)/g)]
  .map(m => m[1]).filter(h => !/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(h));
const kaçak = [...gövde].filter(ch => ch.charCodeAt(0) > 0x2FFF);      // CJK ve ötesi
if (kötüRenk.length) { console.error('✗ geçersiz renk değeri:', kötüRenk.join(', ')); process.exit(1); }
if (kaçak.length) { console.error('✗ kaçak karakter:', [...new Set(kaçak)].join(' ')); process.exit(1); }

fs.writeFileSync(path.join(ROOT, 'mockup.html'), page, 'utf8');
console.log(`✓ mockup.html — ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB, 3 yön, fontlar bir kez gömülü`);
console.log(`  denetim: ${[...gövde.matchAll(/:\s*#[0-9A-Fa-f]+/g)].length} renk değeri geçerli, kaçak karakter yok`);
