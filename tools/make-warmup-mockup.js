/**
 * ISINMA MOKAP'I —  node tools/make-warmup-mockup.js
 *
 * Sabri: "günlük programın ilk hareketi ısınma olsun, tüm ısınma hareketleri
 * tek sayfada olabilir... bu uygun mu? en makul nasıl olabilir?"
 *
 * Bu dosya öneriyi GÖSTERİR, uygulamaya bir şey eklemez. Onaydan sonra
 * js/data/warmup.js + bir ekran yazılacak.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const b64 = f => fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
const FONTS = ['archivo-latin.woff2', 'archivo-latin-ext.woff2'].map((f, i) =>
  `@font-face{font-family:'Archivo';font-style:normal;font-weight:400 700;font-display:swap;`
  + `src:url(data:font/woff2;base64,${b64(f)}) format('woff2');`
  + `unicode-range:${i ? 'U+0100-02BA,U+1E00-1EFF,U+2020,U+20A0-20AB,U+2113,U+2C60-2C7F,U+A720-A7FF'
    : 'U+0000-00FF,U+0131,U+2000-206F,U+2122,U+2191,U+2193,U+2212,U+2215'}}`).join('\n');

/* ── Isınma programı — öneri ──────────────────────────────────────────────
   Üç aşama. Sıra rastgele değil: önce vücut ısısı, sonra eklem açıklığı,
   en son o günün ilk ağır hareketine özel hazırlık seti. */
const ISINMA = {
  0: {
    gün: '1. Gün · Göğüs · Omuz · Triceps',
    adımlar: [
      ['Koşu bandı ya da bisiklet', '3 dk', 'genel', 'Konuşabildiğin tempo. Amaç ter değil, ısı.'],
      ['Kol çevirme — öne / geriye', '10 + 10', 'hareketlilik', 'Küçükten büyüğe daireler.'],
      ['Omuz dış rotasyon (lastik/hafif)', '12', 'hareketlilik', 'Dirsek gövdede sabit, ön kolu dışa aç.'],
      ['Diz üstü ya da duvar şınavı', '10', 'hareketlilik', 'Göğüs ve triceps kan alsın.'],
      ['Göğüs açma — dinamik', '20 sn', 'hareketlilik', 'Kolları geriye aç-kapa; germede bekleme.'],
      ['Bench press — boş bar', '1 × 12', 'hazırlık', 'İlk ağır hareketin sinir sistemini uyandırır.'],
    ],
  },
  1: {
    gün: '2. Gün · Sırt · Biceps · Bacak',
    adımlar: [
      ['Koşu bandı ya da bisiklet', '3 dk', 'genel', 'Konuşabildiğin tempo. Amaç ter değil, ısı.'],
      ['Kalça çemberi', '8 + 8', 'hareketlilik', 'Her iki yöne, kontrollü.'],
      ['Vücut ağırlığıyla squat', '12', 'hareketlilik', 'Tam derinlik, ağırlıksız.'],
      ['Yürüyen lunge', '8 adım', 'hareketlilik', 'Dizler ve kalça açılsın.'],
      ['Kabloyla hafif kürek çekişi', '12', 'hareketlilik', 'Kürek kemiklerini hissederek.'],
      ['Lat çekişi — hafif ağırlık', '1 × 12', 'hazırlık', 'İlk ağır hareketin hazırlık seti.'],
    ],
  },
};

const SYS = `
:root{--bg:#0A0B0D;--s1:#111316;--s2:#181B1F;--line:rgba(255,255,255,.07);
  --line2:rgba(255,255,255,.12);--ink:#CDD1D7;--ink2:#8D939C;--ink3:#777E88;
  --btn:#C8CCD3;--live:#EE5568;--r1:6px;--r2:10px}
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
.li{display:flex;align-items:center;gap:14px;padding:15px 20px;border-bottom:1px solid var(--line);
  width:100%;text-align:left}
.li .ix{width:16px;flex:none;font-size:11.5px;color:var(--ink3)}
.li .nm{flex:1;min-width:0}
.li .nm .t-m{display:block;margin-top:1px}
.li .pips{display:flex;gap:3px;flex:none}
.li .pips i{width:5px;height:5px;border-radius:999px;border:1px solid var(--line2)}
/* ISINMA SATIRI — numarasız, üstte, kendi işaretiyle */
.li.warm{background:linear-gradient(90deg,rgba(238,85,104,.07),transparent 60%)}
.li.warm .ix{color:var(--live);font-size:13px}
.li.warm .chip{flex:none;font-size:11px;color:var(--ink3);border:1px solid var(--line);
  border-radius:999px;padding:3px 9px}
.li.warm.done .chip{border-color:var(--ink2);color:var(--ink2)}

/* ── Isınma ekranı ──────────────────────────────────────────────────────
   Sayaç YOK, işaret YOK, ilerleme YOK. Ekran yalnız GÖSTERİR.
   Satırlar liste ekranındaki hareket satırının AYNI bileşeni (.li) — bütünlük
   yeni bir desen icat ederek değil, var olanı yeniden kullanarak kurulur.
   Satırlar flex:1 ile eşit dağılıp ekranı dolduruyor; kaydırma yok. */
.wlist{flex:1;min-height:0;display:flex;flex-direction:column;border-top:1px solid var(--line)}
.wlist .li{flex:1;align-items:center}
.wlist .li .amt{flex:none;font-size:13px;font-weight:600;color:var(--ink2);
  font-variant-numeric:tabular-nums}
/* Koşu ayrı: hareket değil, ısı yükseltme. Üstte ve kendi bloğunda duruyor. */
.cardio{display:flex;align-items:center;gap:13px;margin:14px 20px 0;padding:13px 15px;
  border:1px solid var(--line2);border-radius:var(--r2)}
.cardio .nm{flex:1;min-width:0}
.cardio .nm b{display:block;font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.cardio .nm span{display:block;font-size:11.5px;color:var(--ink3);margin-top:1px}
.cardio .amt{flex:none;font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}
.wfoot{padding:14px 20px 16px;display:flex;flex-direction:column;gap:9px}
.wnote{font-size:12px;color:var(--ink3);line-height:1.45;margin:0;text-align:center}
`;

/** Koşu dışındaki adımlar — liste satırının aynı bileşeniyle, ekranı doldurarak */
const wlistHTML = d => ISINMA[d].adımlar.filter(([, , faz]) => faz !== 'genel')
  .map(([ad, miktar, , not]) => `<div class="li">
      <span class="nm"><span class="t-h2">${ad}</span><span class="t-m">${not}</span></span>
      <span class="amt">${miktar}</span>
    </div>`).join('');

const ekranListe = `<div class="ph">
  <div class="rail">${Array.from({ length: 9 }, (_, i) => `<i class="${i === 0 ? 'c' : ''}"></i>`).join('')}</div>
  <div class="hd">
    <p class="t-l">30 Temmuz Perşembe</p><h2>2. Gün</h2><p class="t-m">Sırt · Biceps · Bacak</p>
  </div>
  <div class="lst">
    <button class="li warm">
      <span class="ix">◆</span>
      <span class="nm"><span class="t-h2">Isınma</span><span class="t-m">6 hareket · ~7 dk</span></span>
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
    <p class="t-m" style="margin:3px 0 0">${ISINMA[1].gün.split(' · ').slice(1).join(' · ')} · ~7 dk</p>
  </div>
  <div class="cardio">
    <span class="nm"><b>Koşu bandı ya da bisiklet</b><span>Konuşabildiğin tempo. Amaç ter değil, ısı.</span></span>
    <span class="amt">3 dk</span>
  </div>
  <div class="wlist">${wlistHTML(1)}</div>
  <div class="wfoot">
    <button class="b1">Isınma bitti →</button>
    <p class="wnote">Sete ve hacme sayılmaz.</p>
  </div>
</div>`;

const page = `<style>${FONTS}
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
</style>
<div class="pg">
  <p class="eb">FitSet · ısınma önerisi</p>
  <h1>Isınma, listenin numarasız ilk satırı</h1>
  <p class="lede">Sorunun cevabı <b>evet, uygun</b> — hatta eksik olan en değerli parça bu.
  Ama iki şeyi ayırmak gerekiyor: ısınma <b>kaydedilen bir hareket değil</b>, bir hazırlık.
  Bu yüzden numara almıyor, sete ve hacme sayılmıyor, ve <b>hepsi tek ekranda</b> duruyor —
  altı ayrı ekran açtırmak, çözmek istediğimiz sorunun ta kendisi olurdu.</p>
  <p class="lede">Sıra rastgele değil: <b>ısı → eklem açıklığı → hazırlık seti.</b>
  Üçüncüsü en çok atlanan ve en çok işe yarayan kısım.</p>

  <div class="frames">
    <figure>
      <div class="phone">${ekranListe}</div>
      <figcaption>Liste — ısınma numarasız ilk satır</figcaption>
    </figure>
    <figure>
      <div class="phone">${ekranIsinma}</div>
      <figcaption>Isınma — hepsi tek ekranda, sayaç sırayı yürütür</figcaption>
    </figure>
  </div>

  <div class="why">
    <div class="card"><h3>Neden numarasız?</h3>
      <p>Numaralar <b>kaydedilen</b> hareketler için. Isınmaya numara vermek onu programın
      bir parçası gibi gösterir ve "6/28 set" gibi yanlış sayımlara yol açar. Elmas işareti
      ve hafif vurgu, üstte olduğunu numara vermeden söylüyor.</p></div>
    <div class="card"><h3>Neden tek ekran?</h3>
      <p>Isınma hareketleri kısa ve <b>akış hâlinde</b> yapılır. Satırlar liste ekranındaki hareket
      satırının <b>aynı bileşeni</b> — bütünlük yeni desen icat ederek değil, var olanı yeniden
      kullanarak kuruluyor. Eşit dağılıp ekranı dolduruyorlar; kaydırma yok.</p></div>
    <div class="card"><h3>Neden sayaç yok?</h3>
      <p>Isınmayı <b>saymak gereksiz iş yaratır</b>: kol çevirirken telefona dokunmazsın.
      Ekran yalnız gösteriyor — ne sayaç, ne işaret kutusu, ne ilerleme. Tek dokunuş var,
      o da çıkarken.</p></div>
    <div class="card"><h3>Hazırlık seti neden burada?</h3>
      <p>Sonuncu adım o günün <b>ilk ağır hareketi, hafif ağırlıkla</b>. Sinir sistemini uyandıran
      ve ilk seti kurtaran şey bu — ve en çok atlanan şey de bu. Program değişirse otomatik uyar.</p></div>
    <div class="card"><h3>Kaydediliyor mu?</h3>
      <p>Yalnızca <b>"yapıldı" işareti</b>. Ağırlık, tekrar, hacim tutulmuyor; ısınma performans
      verisi değil. Böylece grafikler ve "geçen sefer" referansı temiz kalıyor.</p></div>
    <div class="card"><h3>Ne kadar sürüyor?</h3>
      <p><b>~7 dakika.</b> Daha uzun olsa atlanır, daha kısa olsa işe yaramaz. Kardiyo 3 dk,
      hareketlilik ~3 dk, hazırlık seti ~1 dk.</p></div>
  </div>

  <div class="ask">
    <h3>Onaylarsan bunlar yazılacak</h3>
    <ul>
      <li><code>js/data/warmup.js</code> — iki günün ısınma programı, aynı veri disipliniyle</li>
      <li>Liste ekranına numarasız ısınma satırı</li>
      <li>Isınma ekranı — sayaçsız, liste satırı bileşeniyle, kaydırmasız</li>
      <li>Seans kaydına tek bir <code>warmupDone</code> işareti — sete ve hacme karışmaz</li>
    </ul>
  </div>
</div>`;

const out = path.join(ROOT, 'mockup-isinma.html');
fs.writeFileSync(out, page, 'utf8');
console.log(`✓ mockup-isinma.html — ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);
