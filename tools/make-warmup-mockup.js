/**
 * ISINMA MOKAP'I —  node tools/make-warmup-mockup.js
 *
 * Öneriyi GÖSTERİR; uygulamaya bir şey eklemez. Veri gerçek (js/data/warmup.js),
 * çizimler gerçek motorla (js/anim/engine.js) üretiliyor — yani onaylanan şey
 * doğrudan uygulanabilir.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WARMUP, KARDIYO, SURE } from '../js/data/warmup.js';
import { EX } from '../js/data/exercises.js';
import * as E from '../js/anim/engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const b64 = f => fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
const FONTS = ['archivo-latin.woff2', 'archivo-latin-ext.woff2'].map((f, i) =>
  `@font-face{font-family:'Archivo';font-style:normal;font-weight:400 700;font-display:swap;`
  + `src:url(data:font/woff2;base64,${b64(f)}) format('woff2');`
  + `unicode-range:${i ? 'U+0100-02BA,U+1E00-1EFF,U+2020,U+20A0-20AB,U+2113,U+2C60-2C7F,U+A720-A7FF'
    : 'U+0000-00FF,U+0131,U+2000-206F,U+2122,U+2191,U+2193,U+2212,U+2215'}}`).join('\n');

const byId = Object.fromEntries(EX.flat().map(e => [e.id, e]));

/** Minik figür — Plank varyantlarındaki gibi, hareketin ortasından tek kare */
function mini(w) {
  const k = w.ref ? byId[w.ref] : w;
  const s = E.skeleton(E.poseAt(k.a, k.b, 0.55), k.view);
  return `<svg class="mini" viewBox="10 25 240 170" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
    + `<g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">`
    + `${k.eq ? k.eq(s) : ''}${E.figure(s, k)}</g></svg>`;
}

const SYS = `
:root{--bg:#0A0B0D;--s1:#111316;--line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.12);
  --ink:#CDD1D7;--ink2:#8D939C;--ink3:#777E88;--btn:#C8CCD3;--live:#EE5568;--r2:10px;
  /* Kafa dairesi boyun çizgisini maskeleyen DOLU dairedir — rengi ZEMİN olmalı.
     Tanımlanmazsa motor #FDF3F6'ya düşer ve koyu zeminde parlak nokta kalır. */
  --fig-head:#0A0B0D}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.ph *{font-family:'Archivo',system-ui,sans-serif}
button{border:0;background:none;color:inherit;font:inherit;cursor:pointer}
.t-h1{font-size:21px;font-weight:600;letter-spacing:-.02em;line-height:1.12;margin:0}
.t-h2{font-size:15px;font-weight:600;letter-spacing:-.01em}
.t-m{font-size:12.5px;font-weight:450;color:var(--ink2)}
.t-l{font-size:10.5px;font-weight:550;letter-spacing:.055em;text-transform:uppercase;
  color:var(--ink3);font-stretch:92%}
.b1{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:54px;
  border-radius:var(--r2);background:var(--btn);color:#0A0B0D;font-size:15.5px;font-weight:600}
.ph{width:100%;height:100%;background:var(--bg);color:var(--ink);display:flex;
  flex-direction:column;overflow:hidden}
.rail{display:flex;gap:3px;padding:16px 20px 0}
.rail i{flex:1;height:2px;background:var(--line2);border-radius:1px}
.rail i.c{background:var(--live)}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px 0}
.top .mid{flex:1;text-align:center}
.icb{width:36px;height:36px;border-radius:999px;border:1px solid var(--line);display:flex;
  align-items:center;justify-content:center;color:var(--ink2);font-size:15px;flex:none}
.hd{padding:22px 20px 0}
.hd h2{font-size:27px;font-weight:600;letter-spacing:-.025em;margin:7px 0 3px}
.lst{margin-top:20px;border-top:1px solid var(--line)}
.li{display:flex;align-items:center;gap:13px;padding:14px 20px;border-bottom:1px solid var(--line);
  width:100%;text-align:left}
.li .ix{width:16px;flex:none;font-size:11.5px;color:var(--ink3)}
.li .nm{flex:1;min-width:0}
.li .nm .t-m{display:block;margin-top:1px}
.li .pips{display:flex;gap:3px;flex:none}
.li .pips i{width:5px;height:5px;border-radius:999px;border:1px solid var(--line2)}
.li.warm{background:linear-gradient(90deg,rgba(238,85,104,.07),transparent 60%)}
.li.warm .ix{color:var(--live);font-size:13px}
.li.warm .chip{flex:none;font-size:11px;color:var(--ink3);border:1px solid var(--line);
  border-radius:999px;padding:3px 9px}

/* ── Isınma ekranı ──────────────────────────────────────────────────────
   Sayaç YOK, işaret YOK, ilerleme YOK — ekran yalnız GÖSTERİR.
   Satırlar liste ekranındaki hareket satırının AYNI bileşeni (.li); bütünlük
   yeni desen icat ederek değil var olanı kullanarak kuruluyor. flex:1 ile
   eşit dağılıp ekranı dolduruyorlar, kaydırma yok.
   Her satırın SONUNDA minik çizim — Plank varyantlarındaki gibi. */
.wlist{flex:1;min-height:0;display:flex;flex-direction:column;border-top:1px solid var(--line)}
.wlist .li{flex:1}
.amt{flex:none;font-size:13px;font-weight:600;color:var(--ink2);font-variant-numeric:tabular-nums}
.mini{flex:none;width:80px;height:62px;color:var(--ink);stroke:currentColor;opacity:.92}
.mini .eq,.mini .cbl{stroke:#4A5058}.mini .gr{stroke:#242A30}
/* Koşu ayrı: hareket değil, ısı yükseltme — kendi bloğunda, çizimsiz. */
.cardio{display:flex;align-items:center;gap:13px;margin:14px 20px 0;padding:12px 15px;
  border:1px solid var(--line2);border-radius:var(--r2)}
.cardio .nm{flex:1;min-width:0}
.cardio .nm b{display:block;font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.cardio .nm span{display:block;font-size:11.5px;color:var(--ink3);margin-top:1px}
.cardio .amt{font-size:17px;color:var(--ink)}
.wfoot{padding:14px 20px 16px;display:flex;flex-direction:column;gap:9px}
.wnote{font-size:12px;color:var(--ink3);line-height:1.45;margin:0;text-align:center}
`;

const wlistHTML = d => WARMUP[d].map(w => `<div class="li">
    <span class="nm"><span class="t-h2">${w.ad}</span><span class="t-m">${w.not}</span></span>
    <span class="amt">${w.miktar}</span>
    ${mini(w)}
  </div>`).join('');

const ekranListe = `<div class="ph">
  <div class="rail">${Array.from({ length: 9 }, (_, i) => `<i class="${i === 0 ? 'c' : ''}"></i>`).join('')}</div>
  <div class="hd">
    <p class="t-l">30 Temmuz Perşembe</p><h2>2. Gün</h2><p class="t-m">Sırt · Biceps · Bacak</p>
  </div>
  <div class="lst">
    <button class="li warm">
      <span class="ix">◆</span>
      <span class="nm"><span class="t-h2">Isınma</span><span class="t-m">${WARMUP[1].length + 1} adım · ${SURE[1]}</span></span>
      <span class="chip">başla</span>
    </button>
    ${[['01', 'Close Grip Pull Down', 'Dar tutuş lat çekişi'],
       ['02', 'Two Arm Dumbbell Row', 'Çift dambıl kürek çekişi'],
       ['03', 'Seated Cable Row', 'Oturarak kablo kürek çekişi'],
       ['04', 'Cable Curl', 'Kabloyla biceps curl']]
      .map(([ix, en, tr]) => `<button class="li">
        <span class="ix">${ix}</span>
        <span class="nm"><span class="t-h2" lang="en">${en}</span><span class="t-m">${tr}</span></span>
        <span class="pips"><i></i><i></i><i></i></span>
      </button>`).join('')}
  </div>
</div>`;

const ekranIsinma = `<div class="ph">
  <div class="top">
    <button class="icb">←</button>
    <span class="mid t-l">ısınma</span>
    <span style="width:36px"></span>
  </div>
  <div style="padding:14px 20px 0">
    <h1 class="t-h1">Isınma</h1>
    <p class="t-m" style="margin:3px 0 0">Sırt · Biceps · Bacak · ${SURE[1]}</p>
  </div>
  <div class="cardio">
    <span class="nm"><b>${KARDIYO.ad}</b><span>${KARDIYO.not}</span></span>
    <span class="amt">${KARDIYO.miktar}</span>
  </div>
  <div class="wlist">${wlistHTML(1)}</div>
  <div class="wfoot">
    <button class="b1">Isınma bitti — 1. harekete geç →</button>
    <p class="wnote">Sete ve hacme sayılmaz.</p>
  </div>
</div>`;

const page = `<style>${FONTS}${SYS}
:root{--pg:#F2EFF2;--pn:#FFF;--ln:#E1DBE3;--tx:#231F26;--dm:#6B6472;--ac:#C81E4E}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --pg:#121016;--pn:#1A171D;--ln:#2B2630;--tx:#EAE5EC;--dm:#9B92A2;--ac:#FF5C82}}
:root[data-theme="dark"]{--pg:#121016;--pn:#1A171D;--ln:#2B2630;--tx:#EAE5EC;--dm:#9B92A2;--ac:#FF5C82}
:root[data-theme="light"]{--pg:#F2EFF2;--pn:#FFF;--ln:#E1DBE3;--tx:#231F26;--dm:#6B6472;--ac:#C81E4E}
*{box-sizing:border-box}
body{margin:0;background:var(--pg);color:var(--tx);font-family:'Archivo',system-ui,sans-serif;
  font-size:16px;line-height:1.55}
.pg{max-width:1000px;margin:0 auto;padding:44px 22px 80px}
.eb{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ac);margin:0 0 10px;font-weight:600}
h1{font-size:clamp(28px,4.6vw,40px);font-weight:700;line-height:1.05;letter-spacing:-.03em;
  margin:0 0 14px;text-wrap:balance}
.lede{max-width:64ch;color:var(--dm);margin:0 0 12px}
.lede b{color:var(--tx)}
.frames{display:flex;gap:30px;flex-wrap:wrap;margin-top:34px}
figure{margin:0;display:flex;flex-direction:column;gap:12px;flex:1;min-width:320px}
figcaption{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--dm);text-align:center}
.phone{height:720px;border:1px solid var(--ln);border-radius:20px;overflow:hidden;
  box-shadow:0 14px 44px rgb(0 0 0/.16)}
.why{margin-top:44px;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(270px,1fr))}
.card{background:var(--pn);border:1px solid var(--ln);border-radius:12px;padding:18px 20px}
.card h3{font-size:16px;margin:0 0 6px;font-weight:700}
.card p{margin:0;font-size:14px;color:var(--dm);line-height:1.5}
.card b{color:var(--tx)}
.ask{margin-top:34px;background:var(--pn);border:1px solid var(--ln);border-radius:12px;padding:20px 22px}
.ask h3{font-size:17px;margin:0 0 8px;font-weight:700}
.ask ul{margin:0;padding-left:20px;font-size:14.5px;color:var(--dm)}
.ask li{margin-bottom:6px}
code{font-size:13px;background:rgb(128 128 128/.14);padding:1px 5px;border-radius:4px}
</style>
<div class="pg">
  <p class="eb">FitSet · ısınma önerisi</p>
  <h1>Isınma, listenin numarasız ilk satırı</h1>
  <p class="lede">Isınma <b>kaydedilen bir hareket değil</b>, bir hazırlık. Bu yüzden numara almıyor,
  sete ve hacme sayılmıyor, ağırlık/tekrar tutulmuyor — ve <b>hepsi tek ekranda</b> duruyor.</p>
  <p class="lede">Sıra rastgele değil: <b>ısı → eklem açıklığı → hazırlık seti.</b>
  Üçüncüsü en çok atlanan ve en çok işe yarayan kısım — o günün ilk ağır hareketi, hafif ağırlıkla.</p>

  <div class="frames">
    <figure>
      <div class="phone">${ekranListe}</div>
      <figcaption>Liste — ısınma numarasız ilk satır</figcaption>
    </figure>
    <figure>
      <div class="phone">${ekranIsinma}</div>
      <figcaption>Isınma — tek ekran, her satırda minik çizim</figcaption>
    </figure>
  </div>

  <div class="why">
    <div class="card"><h3>Neden numarasız?</h3>
      <p>Numaralar <b>kaydedilen</b> hareketler için. Isınmaya numara vermek onu programın parçası
      gibi gösterir ve "6/28 set" gibi yanlış sayımlara yol açar.</p></div>
    <div class="card"><h3>Neden sayaç yok?</h3>
      <p>Isınmayı saymak <b>gereksiz iş yaratır</b> — kol çevirirken telefona dokunmazsın. Ekran
      yalnız gösteriyor. Tek dokunuş var, o da çıkarken.</p></div>
    <div class="card"><h3>Minik çizimler</h3>
      <p>Her satırın sonunda hareketin bir karesi — <b>Plank varyantlarındaki gibi</b>. Aynı motor,
      aynı denetim: uzuv uzunluğu, eklem limiti ve dönüş yönü <code>verify-poses.js</code>'te
      kontrol ediliyor.</p></div>
    <div class="card"><h3>Neden tek ekran?</h3>
      <p>Satırlar liste ekranındaki hareket satırının <b>aynı bileşeni</b>. Eşit dağılıp ekranı
      dolduruyorlar; kaydırma yok — odak ekranıyla aynı kural.</p></div>
    <div class="card"><h3>"Bitti" ne yapıyor?</h3>
      <p>Tıpkı normal hareketlerdeki gibi <b>doğrudan 1. harekete geçiyor</b>. Listeye dönüp
      oradan seçmene gerek yok; akış kesilmiyor.</p></div>
    <div class="card"><h3>Kaydediliyor mu?</h3>
      <p>Yalnızca <b>"yapıldı" işareti</b>. Ağırlık, tekrar, hacim tutulmuyor — grafikler ve
      "geçen sefer" referansı temiz kalıyor.</p></div>
  </div>

  <div class="ask">
    <h3>Durum</h3>
    <ul>
      <li><code>js/data/warmup.js</code> — <b>yazıldı</b>, 5 kendi pozlu hareket + 3 hazırlık adımı</li>
      <li>Pozlar <code>verify-poses.js</code> bölüm 7'den geçiyor: uzuv, eklem limiti, dönüş yönü ✓</li>
      <li>Kalan: liste satırı + ısınma ekranı + <code>warmupDone</code> işareti</li>
    </ul>
  </div>
</div>`;

/* ── ÇIKTI DENETİMİ ────────────────────────────────────────────────────────
   Bu betik bir kez ${SYS}'i sayfaya koymayı ATLADI: telefon ekranlarının TÜM
   stil sayfası eksik yayınlandı, satırlar çöktü, figürlerden yalnız kafa
   daireleri göründü. Sayfa "üretildi" dediği için hata sessiz kaldı.
   Artık üretim, beklenen KURALLARIN ve çizim öğelerinin varlığını doğruluyor. */
const gövde = page.replace(/base64,[A-Za-z0-9+/=]+/g, 'base64,…');
const eksik = [];
for (const kural of ['.wlist{', '.mini{', '.li{', '.cardio{', '.ph{', '--fig-head'])
  if (!gövde.includes(kural)) eksik.push(kural);

const polyline = (gövde.match(/<polyline/g) || []).length;
const svg = (gövde.match(/<svg class="mini"/g) || []).length;
if (svg === 0) eksik.push('minik figür üretilmemiş');
if (polyline < svg * 3) eksik.push(`figürlerde gövde çizgisi yok (${polyline} polyline / ${svg} figür)`);

if (eksik.length) {
  console.error('✗ Çıktı eksik: ' + eksik.join(' · '));
  process.exit(1);
}

fs.writeFileSync(path.join(ROOT, 'mockup-isinma.html'), page, 'utf8');
console.log(`✓ mockup-isinma.html — ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);
console.log(`  denetim: ${svg} figür · ${polyline} gövde çizgisi · stil kuralları yerinde`);
