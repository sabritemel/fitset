/**
 * YENİDEN TASARIM MOCKUP'I —  node tools/make-mockup.js
 *
 * Sabri mevcut tasarım dilini reddetti (renk paleti, tipografi, düğme/rozet/
 * etiket biçimleri, yerleşim). Bu dosya YENİ DİLİ önerir; onay alınmadan
 * uygulama koduna dokunulmaz.
 *
 * Çubuk adamlar uygulamanın gerçek motoruyla çizilir; font gömülüdür.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EX } from '../js/data/exercises.js';
import * as E from '../js/anim/engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Archivo değişken font — tek aile, iki dosya */
let FONTS = '';
for (const sub of ['latin', 'latin-ext']) {
  const p = path.join(ROOT, 'fonts', `archivo-${sub}.woff2`);
  if (!fs.existsSync(p)) continue;
  FONTS += `@font-face{font-family:'Archivo';font-style:normal;font-weight:400 700;`
    + `font-stretch:75% 125%;font-display:swap;`
    + `src:url(data:font/woff2;base64,${fs.readFileSync(p).toString('base64')}) format('woff2')}\n`;
}

const fig = (ex, t, vb = '0 0 260 200') => {
  const s = E.skeleton(ex.hold ? ex.variants[0].pose : E.poseAt(ex.a, ex.b, t), ex.view);
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g class="art"
    fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${
    ex.eq(s) + (ex.hold ? '' : E.ghostOf(ex) + E.trailOf(ex)) + E.figure(s, ex)}</g></svg>`;
};

const row = EX[1][1];      // Two Arm Dumbbell Row
const curl = EX[1][3];     // Cable Curl

/* ══════════════════════════════════════════════════════════════════════════
   YENİ TASARIM DİLİ
   ══════════════════════════════════════════════════════════════════════════ */
const SYS = `
:root{
  /* Zemin: siyaha yakın, hafif SOĞUK eğimli — nötr seçildi, devralınmadı.
     Yüzeyler neredeyse görünmez; kart yerine kıl payı çizgi kullanılıyor. */
  --bg:#0A0B0D; --s1:#111316; --s2:#181B1F;
  --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
  --ink:#F4F5F6; --ink2:#969CA4; --ink3:#5C626A;
  /* TEK vurgu: yalnız CANLI olan şey için (çalışan sayaç, bulunulan hareket).
     Birincil eylem RENK DEĞİL — beyaz dolgu. Üç renk yarıştırmak yerine
     kontrastla hiyerarşi kurmak premium hissin yarısıdır. */
  --live:#FF3B4E;
  /* Kafa dairesi boyun çizgisini maskeleyen DOLU dairedir; rengi ZEMİN olmalı.
     Kart kalktığı için figür doğrudan zeminin üstünde duruyor. */
  --fig-head:#0A0B0D;
  --r1:6px; --r2:10px; --r3:14px;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.ph *{font-family:'Archivo',system-ui,sans-serif}
/* ⚠️ Sıfırlama ELEMENT seçicisiyle (0,0,1). Eskiden ".ph button" idi (0,1,1) ve
   .b1/.b2/.b3 bileşenlerini (0,1,0) EZİYORDU — birincil düğmelerin beyaz
   dolgusu hiç görünmüyordu. Sıfırlama daima bileşenden DÜŞÜK özgüllükte olmalı. */
button{border:0;background:none;color:inherit;font:inherit;cursor:pointer}

/* — tipografi: TEK aile, hiyerarşi ağırlık+genişlikle — */
.t-num{font-size:76px;font-weight:600;font-stretch:112%;letter-spacing:-.045em;
  font-variant-numeric:tabular-nums;line-height:.92}
.t-h1{font-size:21px;font-weight:600;letter-spacing:-.02em;line-height:1.12}
.t-h2{font-size:15px;font-weight:600;letter-spacing:-.01em}
.t-b{font-size:14.5px;font-weight:400;line-height:1.5;color:var(--ink2)}
.t-m{font-size:12.5px;font-weight:450;color:var(--ink2);font-variant-numeric:tabular-nums}
.t-l{font-size:10.5px;font-weight:550;letter-spacing:.055em;text-transform:uppercase;
  color:var(--ink3);font-stretch:92%}

/* — düğmeler: üç seviye, HİÇBİRİ altı çizili yazı değil — */
.b1{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:54px;
  border-radius:var(--r2);background:var(--ink);color:#0A0B0D;font-size:15.5px;font-weight:600;
  letter-spacing:-.01em}
.b2{display:flex;align-items:center;justify-content:center;gap:7px;height:54px;
  border-radius:var(--r2);border:1px solid var(--line2);color:var(--ink);font-size:14.5px;font-weight:500}
.b3{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 11px;
  border-radius:999px;border:1px solid var(--line);color:var(--ink2);font-size:12.5px;font-weight:500}

.ph{width:100%;height:100%;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;
  overflow:hidden}
.pad{padding-left:20px;padding-right:20px}

/* — ilerleme rayı: dolu/boş, renk yok — */
.rail{display:flex;gap:3px;padding:16px 20px 0}
.rail i{flex:1;height:2px;background:var(--line2);border-radius:1px}
.rail i.f{background:var(--ink)}
.rail i.c{background:var(--live)}

.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px 0}
.top .mid{flex:1;text-align:center}
.icb{width:36px;height:36px;border-radius:999px;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink2);font-size:15px;flex:none}

/* — görsel: kart YOK, kıl payı çizgiyle ayrılmış alan — */
.viz{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
  color:var(--ink);padding:10px 20px 0}
.viz svg{width:100%;height:100%}
.viz .eq,.viz .cbl{stroke:#4A5058}.viz .gr{stroke:#2A2F35}
.viz .ghost{stroke:#2E343B}.viz .trail{stroke:#6E4148}

/* — rozetler: dolgu yok, kıl payı çerçeve; kayıt izi sessizdir — */
.tags{display:flex;gap:6px;padding:14px 20px 0;overflow-x:auto;scrollbar-width:none}
.tags::-webkit-scrollbar{display:none}
.tag{flex:none;display:inline-flex;align-items:baseline;gap:6px;height:28px;padding:0 10px;
  border-radius:var(--r1);border:1px solid var(--line);color:var(--ink2);font-size:12.5px;
  font-variant-numeric:tabular-nums;line-height:26px}
.tag b{color:var(--ink);font-weight:550}
.tag.w{border-style:dashed;color:var(--ink3)}

/* — sayı girişi: rakam kahraman, adımlayıcı dikey ve sessiz — */
.entry{display:flex;align-items:center;gap:16px;padding:18px 20px 0}
.entry .val{flex:1;min-width:0;display:flex;align-items:baseline;gap:8px}
.entry .unit{font-size:15px;font-weight:500;color:var(--ink3)}
.stp{flex:none;width:56px;border-radius:var(--r2);border:1px solid var(--line2);overflow:hidden}
.stp button{display:block;width:100%;height:48px;font-size:21px;font-weight:400;color:var(--ink)}
.stp button:first-child{border-bottom:1px solid var(--line)}

.meta{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 0}
.foot{padding:16px 20px 18px;display:flex;flex-direction:column;gap:10px}
.split{display:flex;gap:10px}
.split .b2{flex:1}.split .b1{flex:2}

/* — alt gezinme: segment, düğme yığını değil — */
.seg{display:flex;align-items:center;border-top:1px solid var(--line)}
.seg button{flex:none;padding:15px 18px;color:var(--ink3);font-size:13px;font-weight:500}
.seg .rest{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;
  padding:15px 8px;color:var(--ink2);font-size:13px;font-weight:500}
.seg .rest.run{color:var(--live)}
.seg .rest .n{font-size:19px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.02em}

/* — liste ekranı — */
.hd{padding:22px 20px 0}
.stat{display:flex;gap:26px;padding:18px 20px 0}
.stat b{display:block;font-size:23px;font-weight:600;letter-spacing:-.025em;
  font-variant-numeric:tabular-nums;margin-top:3px}
.stat b i{font-style:normal;font-size:12px;font-weight:450;color:var(--ink3);margin-left:2px}
.lst{margin-top:20px;border-top:1px solid var(--line)}
.li{display:flex;align-items:center;gap:14px;padding:15px 20px;border-bottom:1px solid var(--line);
  width:100%;text-align:left}
.li .ix{width:16px;flex:none;font-size:11.5px;color:var(--ink3);font-variant-numeric:tabular-nums}
.li .nm{flex:1;min-width:0}
.li .nm .t-m{margin-top:1px}
.li .pips{display:flex;gap:3px;flex:none}
.li .pips i{width:5px;height:5px;border-radius:999px;border:1px solid var(--line2)}
.li .pips i.f{background:var(--ink);border-color:var(--ink)}
.li.done .t-h2{color:var(--ink2)}
.li.now{background:var(--s1)}
.li.now .ix{color:var(--live)}
`;

/* ── Ekranlar ─────────────────────────────────────────────────────────── */

const railHTML = (n, done, now) => `<div class="rail">${Array.from({ length: n }, (_, i) =>
  `<i class="${i < done ? 'f' : i === now ? 'c' : ''}"></i>`).join('')}</div>`;

const ekranListe = `<div class="ph">
  ${railHTML(9, 2, 2)}
  <div class="hd">
    <p class="t-l">30 Temmuz Perşembe</p>
    <h1 class="t-h1" style="font-size:27px;margin:7px 0 3px">2. Gün</h1>
    <p class="t-b" style="font-size:14px">Sırt · Biceps · Bacak</p>
  </div>
  <div class="stat">
    <div><span class="t-l">Set</span><b>6<i>/27</i></b></div>
    <div><span class="t-l">Hacim</span><b>1 440<i>kg</i></b></div>
    <div><span class="t-l">Süre</span><b>24<i>dk</i></b></div>
  </div>
  <div class="lst">
    ${[['01', 'Close Grip Pull Down', 'Dar tutuş lat çekişi', 3, 3, 0],
       ['02', 'Two Arm Dumbbell Row', 'Çift dambıl kürek çekişi', 3, 3, 0],
       ['03', 'Seated Cable Row', 'Oturarak kablo kürek çekişi', 3, 0, 1],
       ['04', 'Cable Curl', 'Kabloyla biceps curl', 3, 0, 0],
       ['05', 'Dumbbell Hammer Curl', 'Çekiç curl', 3, 0, 0],
       ['06', 'Leg Press', 'Bacak presi', 3, 0, 0]]
      .map(([ix, en, tr, hedef, yap, now]) => `
      <button class="li${yap >= hedef ? ' done' : ''}${now ? ' now' : ''}">
        <span class="ix">${ix}</span>
        <span class="nm"><span class="t-h2" lang="en">${en}</span><span class="t-m" style="display:block">${tr}</span></span>
        <span class="pips">${Array.from({ length: hedef }, (_, k) =>
          `<i class="${k < yap ? 'f' : ''}"></i>`).join('')}</span>
      </button>`).join('')}
  </div>
  <div style="flex:1"></div>
  <div class="foot"><button class="b1">Seansı bitir</button></div>
</div>`;

const ekranOdak = `<div class="ph">
  ${railHTML(9, 2, 2)}
  <div class="top">
    <button class="icb" aria-label="Listeye dön">←</button>
    <span class="mid t-l">3/9 · 1/3 set</span>
    <button class="icb" aria-label="Nasıl yapılır">?</button>
  </div>
  <div class="pad" style="padding-top:14px">
    <h1 class="t-h1" lang="en">Seated Cable Row</h1>
    <p class="t-m" style="margin:3px 0 0">Oturarak kablo kürek çekişi · 3 × 12</p>
  </div>
  <div class="viz">${fig(EX[1][2], 0.55)}</div>
  <div class="tags">
    <span class="tag w">ısınma <b>20×15</b></span>
    <span class="tag">1 <b>35×12</b></span>
  </div>
  <div class="entry">
    <div class="val"><span class="t-num">37,5</span><span class="unit">kg</span></div>
    <div class="stp"><button aria-label="artır">+</button><button aria-label="azalt">−</button></div>
  </div>
  <div class="meta">
    <span class="t-m">× <b style="color:var(--ink);font-weight:600">12</b> tekrar</span>
    <button class="b3">Isınma seti</button>
  </div>
  <div class="foot">
    <p class="t-m" style="margin:0">Geçen sefer · 3 gün önce · <span style="color:var(--ink)">35×12 · 35×12 · 35×10</span></p>
    <button class="b1">2. seti kaydet</button>
  </div>
  <div class="seg">
    <button>← Önceki</button>
    <span class="rest"><span class="n">1:12</span> dinlenme</span>
    <button>Sonraki →</button>
  </div>
</div>`;

const ekranTamam = `<div class="ph">
  ${railHTML(9, 3, 3)}
  <div class="top">
    <button class="icb" aria-label="Listeye dön">←</button>
    <span class="mid t-l">2/9 · 3/3 set</span>
    <button class="icb" aria-label="Nasıl yapılır">?</button>
  </div>
  <div class="pad" style="padding-top:14px">
    <h1 class="t-h1" lang="en">Two Arm Dumbbell Row</h1>
    <p class="t-m" style="margin:3px 0 0">Çift dambıl kürek çekişi · 3 × 12</p>
  </div>
  <div class="viz">${fig(row, 0.62)}</div>
  <div class="tags">
    <span class="tag">1 <b>10×12</b></span>
    <span class="tag">2 <b>10×12</b></span>
    <span class="tag">3 <b>10×11</b></span>
    <button class="tag" style="border-style:dashed">geri al</button>
  </div>
  <div class="entry">
    <div class="val"><span class="t-num">10</span><span class="unit">kg</span></div>
    <div class="stp"><button>+</button><button>−</button></div>
  </div>
  <div class="meta">
    <span class="t-m">× <b style="color:var(--ink);font-weight:600">12</b> tekrar</span>
    <button class="b3">Isınma seti</button>
  </div>
  <div class="foot">
    <div class="split">
      <button class="b2">Fazladan set</button>
      <button class="b1">Sonraki hareket →</button>
    </div>
  </div>
  <div class="seg">
    <button>← Önceki</button>
    <span class="rest run"><span class="n">0:48</span> dinlenme · geç</span>
    <button style="color:var(--ink)">Sonraki →</button>
  </div>
</div>`;

/* ── Bileşen karşılaştırması ──────────────────────────────────────────── */
const KARSI = [
  ['Birincil düğme',
   `<button style="width:100%;height:56px;border-radius:14px;background:#FF4D6D;color:#12060A;
      font-family:'Archivo';font-weight:800;font-size:18px;border:0">Sonraki hareket →</button>`,
   `<button class="b1">Sonraki hareket →</button>`,
   'Kırmızı dolgu dikkati sürekli çekiyordu. Birincil eylem artık RENKLE değil KONTRASTLA öne çıkıyor; renk yalnız canlı olan şeye ayrıldı.'],
  ['İkincil eylem',
   `<span style="color:#FF4D6D;font-family:'Archivo';font-size:13px;text-decoration:underline">bu sette değiştir</span>`,
   `<button class="b3">Bu sette değiştir</button>`,
   'Altı çizili renkli yazı ekrandaki en ucuz duran öğeydi. Kıl payı çerçeveli hap düğme hem daha okunur hem dokunulabilir.'],
  ['Kayıt rozeti',
   `<span style="display:inline-block;padding:4px 8px;border-radius:8px;background:rgba(70,199,168,.12);
      color:#46C7A8;font-family:'Archivo';font-size:11.5px">1 10kg×12</span>`,
   `<span class="tag">1 <b>10×12</b></span>`,
   'Yeşil dolgu üçüncü bir renk getiriyordu. Rozet bir kayıt izi; sessiz olmalı, sayı öne çıkmalı.'],
  ['Etiket',
   `<span style="font-family:'Archivo';font-size:10.5px;letter-spacing:.17em;text-transform:uppercase;color:#7E889D">hedef süre</span>`,
   `<span class="t-l">Hedef süre</span>`,
   'Aşırı harf aralığı "geliştirici aracı" hissi veriyordu. Aralık daraltıldı, genişlik ekseniyle sıkıştırıldı.'],
  ['Uyarı / dikkat',
   `<div style="border-left:3px solid #FFB84D;padding:2px 0 2px 12px;color:#FFB84D;
      font-family:'Archivo';font-size:14px">Belinde çukurlaşma başladıysa süre dolmadan bitir.</div>`,
   `<div style="display:flex;gap:10px;align-items:flex-start"><span style="width:5px;height:5px;
      border-radius:999px;background:var(--live);margin-top:8px;flex:none"></span>
      <span class="t-b" style="color:var(--ink)">Belinde çukurlaşma başladıysa süre dolmadan bitir.</span></div>`,
   'Yan şerit yapay-zekâ arayüzlerinin en tanınan izi. Yerine tek nokta ve tam kontrastlı metin.'],
  ['Adımlayıcı',
   `<div style="display:flex;gap:9px"><button style="flex:1;height:46px;border-radius:11px;background:#1D2534;
      color:#ECE7DF;font-size:22px;border:0">−</button><button style="flex:1;height:46px;border-radius:11px;
      background:#1D2534;color:#ECE7DF;font-size:22px;border:0">+</button></div>`,
   `<div class="stp" style="width:56px"><button>+</button><button>−</button></div>`,
   'Dolgulu iki geniş düğme yer yiyordu ve rakamdan daha baskındı. Dikey, kıl payı çerçeveli, sessiz.'],
];

const page = `<style>${FONTS}${SYS}
body{margin:0;background:#0A0B0D;color:#F4F5F6;font-family:'Archivo',system-ui,sans-serif;
  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding:52px 24px 96px}
.eyebrow{font-size:11px;font-weight:550;letter-spacing:.14em;text-transform:uppercase;color:var(--live);margin:0 0 14px}
h1.big{font-size:clamp(32px,5vw,52px);font-weight:600;font-stretch:105%;letter-spacing:-.035em;
  line-height:1.02;margin:0 0 16px;text-wrap:balance}
.lede{max-width:62ch;color:var(--ink2);margin:0 0 10px;font-size:16.5px}
.lede b{color:var(--ink);font-weight:550}
.screens{display:grid;gap:30px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:44px}
.frame{display:flex;flex-direction:column;gap:12px}
.frame .box{height:730px;border:1px solid var(--line);border-radius:26px;overflow:hidden;
  box-shadow:0 24px 70px rgba(0,0,0,.6)}
.frame .cap{font-size:12.5px;color:var(--ink3);text-align:center;letter-spacing:.02em}
h2.sec{font-size:24px;font-weight:600;letter-spacing:-.025em;margin:72px 0 6px}
.grid{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r3);
  overflow:hidden;margin-top:24px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
.cell{background:var(--bg);padding:22px}
.cell h3{font-size:13px;font-weight:600;margin:0 0 18px;color:var(--ink)}
.ab{display:grid;gap:14px;grid-template-columns:1fr;align-items:center}
.ab .lab{font-size:10px;font-weight:550;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3);margin-bottom:7px}
.cell p{margin:16px 0 0;font-size:13.5px;line-height:1.55;color:var(--ink2)}
.rules{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));margin-top:26px}
.rule{border-top:1px solid var(--line2);padding-top:14px}
.rule b{display:block;font-size:14px;font-weight:600;margin-bottom:5px}
.rule span{font-size:13.5px;color:var(--ink2);line-height:1.55}
.swatches{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.sw{border:1px solid var(--line);border-radius:var(--r2);padding:12px 14px;min-width:132px}
.sw i{display:block;width:100%;height:34px;border-radius:var(--r1);margin-bottom:10px}
.sw code{font-size:11px;color:var(--ink3);font-family:ui-monospace,monospace}
.sw span{display:block;font-size:12.5px;font-weight:550}
</style>
<div class="wrap">
  <p class="eyebrow">FitSet · tasarım dili · 2. sürüm</p>
  <h1 class="big">Sessiz arayüz, yüksek kontrast, tek vurgu</h1>
  <p class="lede">Önceki dil üç vurgu rengi, üç yazı ailesi ve altı çizili renkli bağlantılar
  kullanıyordu — okunuşu "indie" idi, profesyonel bir spor aracı değil. Bu sürüm
  <b>üç şeyi azaltarak</b> premium hissi kuruyor: renk, aile, yüzey.</p>
  <p class="lede">Yapı aynı kalıyor — Liste + Odak, kaymayan ekran, kayan panel. Değişen
  <b>dil</b>: tipografi, renk, biçim, yoğunluk.</p>

  <div class="screens">
    <div class="frame"><div class="box">${ekranListe}</div>
      <p class="cap">Liste — günün akışı, hairline ayraçlar, kart yok</p></div>
    <div class="frame"><div class="box">${ekranOdak}</div>
      <p class="cap">Odak — set girilirken, dinlenme sayacı boşta</p></div>
    <div class="frame"><div class="box">${ekranTamam}</div>
      <p class="cap">Odak — hedef tamam, sayaç canlı (tek renk burada)</p></div>
  </div>

  <h2 class="sec">Palet</h2>
  <p class="lede">Bir vurgu rengi, üç mürekkep tonu, üç yüzey. Başka renk yok.</p>
  <div class="swatches">
    ${[['#0A0B0D', 'Zemin', 'siyaha yakın, soğuk eğimli'],
       ['#111316', 'Yüzey', 'yalnız seçili satır'],
       ['#F4F5F6', 'Mürekkep', 'birincil eylem de bu'],
       ['#969CA4', 'İkincil', 'meta, açıklama'],
       ['#5C626A', 'Üçüncül', 'etiket'],
       ['#FF3B4E', 'Canlı', 'YALNIZ çalışan sayaç ve bulunulan hareket']]
      .map(([h, n, d]) => `<div class="sw"><i style="background:${h}"></i>
        <span>${n}</span><code>${h}</code><p style="margin:6px 0 0;font-size:11.5px">${d}</p></div>`).join('')}
  </div>

  <h2 class="sec">Bileşenler — önce / sonra</h2>
  <p class="lede">Beğenmediğini söylediğin öğelerin her biri, gerekçesiyle.</p>
  <div class="grid">
    ${KARSI.map(([ad, eski, yeni, not]) => `<div class="cell">
      <h3>${ad}</h3>
      <div class="ab">
        <div><div class="lab">önce</div>${eski}</div>
        <div><div class="lab">sonra</div>${yeni}</div>
      </div>
      <p>${not}</p>
    </div>`).join('')}
  </div>

  <h2 class="sec">Kurallar</h2>
  <div class="rules">
    ${[['Tek yazı ailesi', 'Archivo değişken. Hiyerarşi aileyle değil <b>ağırlık (400-700)</b> ve <b>genişlik (75-125)</b> ekseniyle kuruluyor. Üç aile 380 KB idi; bu 172 KB.'],
       ['Renk son çare', 'Vurgu rengi yalnız <b>canlı</b> olana ayrıldı: çalışan sayaç, bulunulan hareket. Birincil düğme beyaz dolgu — renkle değil kontrastla öne çıkıyor.'],
       ['Kart yerine çizgi', 'Dolgulu kutular yığını yerine kıl payı ayraçlar. Ekran daha sakin, veri daha yoğun okunuyor.'],
       ['Rakam kahraman', '76px, hafif genişletilmiş, hizalı rakam. Ağırlık kol mesafesinden okunmalı; gerisi sessiz.'],
       ['Altı çizili yazı yok', 'Her dokunulabilir şey düğme gibi görünür: hap, ikon çember ya da dolu düğme.'],
       ['Sıkı yarıçap', '6 / 10 / 14 px. Yumuşak 18px köşeler tüketici uygulaması hissi veriyordu.']]
      .map(([b, s]) => `<div class="rule"><b>${b}</b><span>${s}</span></div>`).join('')}
  </div>

  <h2 class="sec">Karar bekleyen tek şey</h2>
  <p class="lede">Geçen turda "sonraki hareket" düğmesinin <b>yeşil</b> olmasını istemiştin. Bu sürümde
  yeşil yok — çünkü üçüncü renk tam da paleti dağıtan şeydi. Onun yerine o düğme <b>beyaz dolgu</b>
  (ekrandaki en yüksek kontrast) ve "fazladan set" kıl payı çerçeveli ikincil. Hiyerarşi korunuyor,
  renk sayısı azalıyor. Beğenmezsen tek satırla yeşile döneriz.</p>
  <p class="lede" style="color:var(--ink3);font-size:13.5px;margin-top:26px">
  Üreten: tools/make-mockup.js · çizimler gerçek motorla (js/anim/engine.js) · font gömülü</p>
</div>`;

const gövde = page.replace(/base64,[A-Za-z0-9+/=]+/g, 'base64,…');
const kötü = [...gövde.matchAll(/:\s*#([0-9A-Za-z]+)/g)].map(m => m[1])
  .filter(h => !/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(h));
if (kötü.length) { console.error('✗ geçersiz renk:', kötü.join(', ')); process.exit(1); }

fs.writeFileSync(path.join(ROOT, 'mockup.html'), page, 'utf8');
console.log(`✓ mockup.html — ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB · 3 ekran + 6 bileşen karşılaştırması`);
