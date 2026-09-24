/**
 * 3B MANKEN — FİZİK DENETİMİ  ·  node tools/fizik-denetimi.js  (npm test'in parçası)
 *
 * Neden var: ilk 3B mokapta bench press'te aynı barı tutan iki elin arası
 * 49,2 ↔ 88,0 oynuyordu (Sabri gözle buldu, 24 Eyl); ölçünce reverse fly'da
 * makine kolunun 32,4 ↔ 78,0 uzadığı çıktı. İkisi de "fiziksel gerçekliğe
 * uymayan hareket" sınıfı ve 2B denetimlerin hiçbiri bu sınıfı sormuyordu
 * (yan görünümde iki el üst üste düşer, fark görünmez).
 *
 * Her hareket, kısıtlarını KENDİSİ beyan eder (HAREKETLER[x].kisit); bu betik
 * her kareyi ölçer. ⭐ Denetimin gerçekten gördüğü kanıtlanır: eski (açı
 * tabanlı) pozlar OLUMSUZ fikstür olarak koşar ve kırmızı yanmak ZORUNDADIR.
 */
import * as M from '../js/anim3d/manken3d.js';
import { KUTUPHANE } from '../js/anim3d/hareketler3d.js';

const ORNEK = 41;
const aci = (a, o, b) => {                                    // o köşesindeki iç açı (derece)
  const u = [a[0] - o[0], a[1] - o[1], a[2] - o[2]], v = [b[0] - o[0], b[1] - o[1], b[2] - o[2]];
  const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
};
const aralik = a => [Math.min(...a), Math.max(...a)];
const f = n => n.toFixed(1).replace('.', ',');
const yatay = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/** Bir hareketi ölç → [{ad, gecti, olcum}] */
export function denetle(h) {
  const kareler = Array.from({ length: ORNEK }, (_, i) => M.an(h, i / (ORNEK - 1)));
  const k = h.kisit ?? {}, sonuc = [];
  const ekle = (ad, gecti, olcum) => sonuc.push({ ad, gecti, olcum });

  // K1 uzuv boyları sabit
  const sapma = Math.max(...kareler.flatMap(s => [
    Math.abs(M.mesafe(s.omA, s.dA) - M.L.ua), Math.abs(M.mesafe(s.dA, s.eA) - M.L.fa),
    Math.abs(M.mesafe(s.omB, s.dB) - M.L.ua), Math.abs(M.mesafe(s.dB, s.eB) - M.L.fa),
    Math.abs(M.mesafe(s.kaA, s.zA) - M.L.th), Math.abs(M.mesafe(s.zA, s.aA) - M.L.sh)]));
  ekle('uzuv boyları sabit', sapma < 0.01, `en büyük sapma ${sapma.toExponential(1)}`);

  // K2 ortak bar: iki el arası sabit
  if (k.ortakBar) {
    const [a, b] = aralik(kareler.map(s => M.mesafe(s.eA, s.eB)));
    ekle('aynı bardaki iki elin arası sabit', b - a <= 0.5, `${f(a)} … ${f(b)}`);
  }
  // K3 kaldıraç: tutamak dönme ekseninden sabit uzaklıkta
  if (k.kaldirac) {
    for (const [i, el] of [[0, 'eA'], [1, 'eB']]) {
      const [a, b] = aralik(kareler.map(s => yatay(h.eksenler(s)[i], s[el])));
      ekle(`kaldıraç boyu sabit (${i ? 'sağ' : 'sol'})`, b - a <= 0.5, `${f(a)} … ${f(b)}`);
    }
  }
  // K4 el ekipmanda (IK hedefe ulaştı mı)
  if (h.uclar) ekle('eller/ayaklar hedefe ulaşıyor', kareler.every(s => s.ulasti), `${kareler.filter(s => !s.ulasti).length}/${ORNEK} karede ulaşamadı`);

  // K5 eklem açıları: dirsek ve diz fleksiyonu 0–150°
  const fleks = kareler.flatMap(s => [180 - aci(s.omA, s.dA, s.eA), 180 - aci(s.omB, s.dB, s.eB)]);
  const [fa, fb] = aralik(fleks);
  ekle('dirsek fleksiyonu 0–150°', fa >= 0 && fb <= 150, `${f(fa)}° … ${f(fb)}°`);
  if (k.dirsek) {                                             // hareketin KENDİ tanımı (ör. fly: sabit, hafif bükük)
    const kollar = k.dirsek.kollar ?? (k.tekTaraf ? ['A'] : ['A', 'B']);   // tek kollu harekette boştaki kol muaf
    const [xa, xb] = aralik(kareler.flatMap(s => kollar.map(y => 180 - aci(s[`om${y}`], s[`d${y}`], s[`e${y}`]))));
    const [x, y] = k.dirsek.aralik;
    ekle(`dirsek ${x}–${y}° aralığında`, xa >= x && xb <= y, `${f(xa)}° … ${f(xb)}°`);
    if (k.dirsek.sabit) ekle('dirsek açısı hareket boyunca sabit', xb - xa <= 3, `oynama ${f(xb - xa)}°`);
  }
  const diz = kareler.flatMap(s => [180 - aci(s.kaA, s.zA, s.aA), 180 - aci(s.kaB, s.zB, s.aB)]);
  ekle('diz fleksiyonu 0–150°', Math.max(...diz) <= 150, `en fazla ${f(Math.max(...diz))}°`);

  // K5b DİZ YÖNÜ — mutlak referansa göre (projenin dersi: "işaret değişmiyor" ≠
  // "işaret doğru"; yön denetimi MUTLAK referans ister). Diz, kalça–bilek
  // doğrusunun hareketin beyan ettiği tarafına bükülmeli (ör. öne, yukarı).
  if (k.dizYonu) {
    const en = Math.min(...kareler.flatMap(s => [['kaA', 'zA', 'aA'], ['kaB', 'zB', 'aB']].map(([ka, z, a]) => {
      const orta = s[ka].map((v, i) => (v + s[a][i]) / 2);
      return (s[z][0] - orta[0]) * k.dizYonu[0] + (s[z][1] - orta[1]) * k.dizYonu[1] + (s[z][2] - orta[2]) * k.dizYonu[2];
    })));
    ekle('diz doğru yöne bükülüyor', en >= -0.5, `en düşük ${f(en)} (≥ 0 olmalı)`);
  }

  // K6 ayaklar: 'yerde' (taban yerde, sabit) · 'parmakUcu' (parmak ucu yerde, sabit)
  const ayaklar = typeof k.ayaklar === 'string' ? { A: k.ayaklar, B: k.ayaklar } : (k.ayaklar ?? {});
  for (const [yan, tur] of Object.entries(ayaklar)) {
    const nokta = tur === 'yerde' ? `a${yan}` : `u${yan}`, zemin = k.zeminY ?? 0;   // basamaklı hareketlerde zemin = basamak üstü
    const [ya, yb] = aralik(kareler.map(s => s[nokta][1] - M.R.ayak - zemin));
    ekle(`${yan === 'A' ? 'sağ' : 'sol'} ayak ${tur === 'yerde' ? 'tabanı' : 'parmak ucu'} yerde`, ya >= -1 && yb <= 1.5, `zemine göre ${f(ya)} … ${f(yb)}`);
    const kay = Math.max(...kareler.map(s => yatay(s[nokta], kareler[0][nokta])));
    ekle(`${yan === 'A' ? 'sağ' : 'sol'} ayak kaymıyor`, kay <= 0.5, `en fazla ${f(kay)}`);
  }

  // K6b dirsek YERİNDE (curl, pushdown, baş üstü uzatma: üst kol sabit)
  for (const d of k.dirsekYerinde ?? []) {
    const kay = Math.max(...kareler.map(s => M.mesafe(s[`d${d}`], kareler[0][`d${d}`])));
    ekle(`${d === 'A' ? 'sağ' : 'sol'} dirsek yerinde`, kay <= 1.5, `en fazla ${f(kay)}`);
  }
  // K6c ön kol dikeye yakın (serbest ağırlıkta yük sarkar: kürek çekişleri)
  if (k.onKolDikey) {
    const en = Math.max(...kareler.flatMap(s => ['A', 'B'].map(y => aci(s[`e${y}`], s[`d${y}`], ekleV(s[`d${y}`], [0, -1, 0])))));
    ekle(`ön kol dikeye ≤ ${k.onKolDikey}°`, en <= k.onKolDikey, `en fazla ${f(en)}°`);
  }
  // K6d gövde açısı (yere göre) ve sabitliği
  if (k.govde) {
    const acilar = kareler.map(s => Math.asin(Math.max(-1, Math.min(1, s.g[1]))) * 180 / Math.PI);
    const [a, b] = aralik(acilar);
    ekle(`gövde yere ${k.govde.aralik.join('–')}°`, a >= k.govde.aralik[0] && b <= k.govde.aralik[1], `${f(a)}° … ${f(b)}°`);
    if (k.govde.oynama != null) ekle(`gövde neredeyse sabit (≤ ${k.govde.oynama}°)`, b - a <= k.govde.oynama, `oynama ${f(b - a)}°`);
  }
  // K6e kablo, bar, dambıl bedenin içinden geçmiyor — cisim KALINLIĞIYLA birlikte
  if (h.cisimler) {
    let en = Infinity, nerede = '';
    for (const s of kareler) h.cisimler(s).forEach(([a, b, rc = 0.7], ci) => {
      for (const [p, q, r, ad] of [[s.P, s.gogusAlt, M.R.karin, 'karın'], [s.gogusAlt, s.boyun, M.R.gogus, 'göğüs'],
        [s.kaA, s.zA, M.R.th, 'sağ uyluk'], [s.zA, s.aA, M.R.sh, 'sağ baldır'], [s.kaB, s.zB, M.R.th, 'sol uyluk'], [s.zB, s.aB, M.R.sh, 'sol baldır'], [s.kafa, s.kafa, M.R.kafa, 'baş']]) {
        const d = dogruParcaMesafe(a, b, p, q, 16) - r - rc;
        if (d < en) { en = d; nerede = `${ad} · cisim ${ci + 1} · t=${s.t.toFixed(2)}`; }
      }
    });
    ekle('kablo/bar/dambıl bedenin içinden geçmiyor', en >= -0.5, `en yakın ${f(en)} (${nerede})`);
  }
  // K7 temaslar (sırt sehpada, göğüs pedde…)
  for (const t of k.temas ?? []) {
    const [a, b] = aralik(kareler.map(t.f));
    ekle(t.ad, a >= t.aralik[0] && b <= t.aralik[1], `boşluk ${f(a)} … ${f(b)} (izin ${t.aralik.join(' … ')})`);
  }
  // K8 iki taraf simetrik (bilateral hareket; tek kollu hareket bunu beyan eder)
  if (!k.tekTaraf && !k.sirayla) {                            // sırayla çalışan kollar (hammer curl) simetrik değildir
    const sim = Math.max(...kareler.map(s => Math.hypot(s.eA[0] - s.eB[0], s.eA[1] - s.eB[1], s.eA[2] + s.eB[2] - (s.omA[2] + s.omB[2]))));
    ekle('sağ-sol simetrik', sim <= 0.5, `en fazla ${f(sim)}`);
  }
  // K9 ayrı tutamaklardaki eller birbirinin İÇİNE girmiyor
  if (!k.ortakBar && !k.tekTaraf) {
    const en = Math.min(...kareler.map(s => M.mesafe(s.eA, s.eB)));
    ekle('eller birbirine girmiyor', en >= 2 * M.R.el + 1, `en yakın ${f(en)} (gereken ≥ ${f(2 * M.R.el + 1)})`);
  }
  // K10 ön kol ve el gövdeye / başa girmiyor (kapsül–kapsül mesafesi)
  let gomulme = -Infinity, gyer = '';
  for (const s of kareler) for (const [d, e, kol] of [['dA', 'eA', 'sağ'], ['dB', 'eB', 'sol']])
    for (const [p, q, r, ad] of [[s.P, s.gogusAlt, M.R.karin, 'karın'], [s.gogusAlt, s.boyun, M.R.gogus, 'göğüs'], [s.kafa, s.kafa, M.R.kafa, 'baş']]) {
      const g = (r + M.R.fa) - dogruParcaMesafe(s[d], s[e], p, q);
      if (g > gomulme) { gomulme = g; gyer = `${kol} ön kol → ${ad} · t=${s.t.toFixed(2)}`; }
    }
  ekle('ön kol gövdeye/başa girmiyor', gomulme <= 1.5, `en fazla gömülme ${f(Math.max(0, gomulme))} (${gyer})`);

  // K11 harekete özel denetimler (ör. plank: omuz–kalça–bilek tek çizgide)
  for (const o of k.ozel ?? []) { const r = o.f(kareler); ekle(o.ad, r.gecti, r.olcum); }

  // K12 GÖRÜNÜRLÜK — taşıyıcı yüzey, üstündeki bedeni ÖRTMEZ. Kamera yukarıdan bakarken
  // yatay bir yüzey kendi düzleminin ÜSTÜNDEKİ bir şeyi fiziksel olarak örtemez; o yüzey
  // ekranda üst üste bindiği bir beden parçasından SONRA çiziliyorsa çizim sırası yanlıştır.
  // (24 Eyl, Sabri gözle buldu: bazı açılarda baş sehpanın ALTINDA çiziliyordu.)
  const g = gorunurluk(h);
  ekle(`taşıyıcı yüzey üstündekini örtmüyor (${g.sahne} sahne)`, g.ihlal === 0, g.ihlal ? `${g.ihlal} ihlal · ör. ${g.ornek}` : 'ihlal yok');
  ekle(`taşıyıcı yüzey altındakini örtüyor (${g.sahne} sahne)`, g.ters === 0, g.ters ? `${g.ters} ihlal · ör. ${g.tersOrnek}` : 'ihlal yok');
  return sonuc;
}

/* Görünürlük: motorun iki kuralıyla AYNI tanımlar (ustUsteMi, isinYuzeydenGeciyor) — ölçülen şey
   kuralların motorun ÇIKTISINDA sağlanıp sağlanmadığı (sıralama düzeltmesi çelişkide vazgeçebilir). */
function gorunurluk(h, { duzeltme = true } = {}) {
  let ihlal = 0, ters = 0, sahne = 0, ornek = '', tersOrnek = '';
  for (const t of h.statik ? [0.5] : [0, 0.5, 1]) for (let te = 0; te < 360; te += 30) for (const fi of [10, 25, 40, 55]) {
    const pr = M.kamera(te, fi), yalin = p => pr(p);                    // yalin: yön bilgisi yok → düzeltme koşmaz
    const { ogeler } = M.sahneOgeleri(h, t, duzeltme ? pr : yalin); sahne++;
    ogeler.forEach((F, fIx) => {
      if (!F.ustYuz) return;
      ogeler.forEach((E, i) => {
        if (!E.figur || !E.geo) return;
        if (i < fIx && E.geo.minY >= F.Y - 0.5 && M.ustUsteMi(E.geo, F.geo.P2)) { ihlal++; if (!ornek) ornek = `θ ${te}° φ ${fi}° t=${t}`; }
        if (i > fIx && M.isinYuzeydenGeciyor(E.geo, F, pr.yon)) { ters++; if (!tersOrnek) tersOrnek = `θ ${te}° φ ${fi}° t=${t}`; }
      });
    });
  }
  return { ihlal, ters, sahne, ornek, tersOrnek };
}

const ekleV = (a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]];

/** İki doğru parçası arasındaki en kısa mesafe (örnekleyerek — mokap için yeterli) */
function dogruParcaMesafe(a, b, c, d, n = 24) {
  let en = Infinity;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const p = a.map((v, k) => v + (b[k] - v) * i / n), q = c.map((v, k) => v + (d[k] - v) * j / n);
    en = Math.min(en, M.mesafe(p, q));
  }
  return en;
}

/* ── OLUMSUZ FİKSTÜRLER: ilk mokabın açı tabanlı hareketleri ──────────────
   Bunlar kırmızı yanmazsa denetim KÖRDÜR (projenin dersi: sıfır sonuç
   körlük de olabilir). Değerler ilk mokaptan birebir. */
const B0 = M.HAREKETLER.bench, F0 = M.HAREKETLER.reverseFly;
const ESKI = {
  'ESKİ bench (açıyla)': {
    beklenen: 'aynı bardaki iki elin arası sabit',
    h: { ...B0, uclar: undefined,
      a: { ...B0.a, uaA: [70, -25], faA: [0, 90], uaB: [-70, -25], faB: [0, 90] },
      b: { ...B0.a, uaA: [90, 70], faA: [0, 90], uaB: [-90, 70], faB: [0, 90] } },
  },
  'ESKİ reverse fly (açıyla, sabit pivot)': {
    beklenen: 'kaldıraç boyu sabit (sol)',
    h: { ...F0, uclar: undefined, eksenler: () => [[31, 104, 0], [31, 104, 0]],
      a: { ...F0.a, P: [0, 40, 0], uaA: [12, -6], faA: [18, -6], uaB: [-12, -6], faB: [-18, -6] },
      b: { ...F0.a, P: [0, 40, 0], uaA: [-88, -4], faA: [-92, -4], uaB: [88, -4], faB: [92, -4] } },
  },
};

/* Yeni kısıt türleri de kör olmadığını kanıtlamak zorunda: her biri için kasten bozulmuş bir sürüm */
const K = KUTUPHANE, bozukUc = (h, f) => ({ ...h, uclar: t => s => f(h.uclar(t)(s), t) });
Object.assign(ESKI, {
  'TERS DİZ (squat, diz kutbu geriye)': { beklenen: 'diz doğru yöne bükülüyor',
    h: bozukUc(K.w_squat, o => ({ ayakA: { ...o.ayakA, kutup: [-1, 0, 0.3] }, ayakB: { ...o.ayakB, kutup: [-1, 0, -0.3] } })) },
  'KAYAN DİRSEK (pushdown, dirsek kutbu öne)': { beklenen: 'sağ dirsek yerinde',
    h: bozukUc(K.cable_vbar_pushdown, o => ({ ...o, A: { ...o.A, kutup: [1, -0.2, 0.3] } })) },
  'KAYAN AYAK (row, bilek öne kayar)': { beklenen: 'sağ ayak kaymıyor',
    h: bozukUc(K.db_two_arm_row, (o, t) => ({ ...o, ayakA: { ...o.ayakA, hedef: M.ekle(o.ayakA.hedef, [6 * t, 0, 0]) } })) },
  'ÖN KOL EĞİK (row, dirsek aşağıda)': { beklenen: 'ön kol dikeye ≤ 20°',   // ilk sürüm yalnız 18° eğiyordu — bozma yetersizdi, denetim değil
    h: bozukUc(K.db_two_arm_row, o => ({ ...o, A: { ...o.A, kutup: [0, -1, 0.2] }, B: { ...o.B, kutup: [0, -1, -0.2] } })) },
});

let kalan = 0;
// Görünürlük düzeltmesi KAPALIYKEN denetim ihlali görmek ZORUNDA (düzeltmeden önce 317 ölçülmüştü)
{
  const g = gorunurluk(K.bb_bench_press, { duzeltme: false });
  const gordu = g.ihlal > 0;
  console.log(`
OLUMSUZ — DÜZELTMESİZ SIRALAMA (bench): ${gordu ? '✓ KIRMIZI yandı' : '✗ YEŞİL kaldı — görünürlük denetimi kör!'} (${g.ihlal} ihlal)`);
  if (!gordu) kalan++;
}
const secim = process.argv[2];
for (const [ad, h] of Object.entries(KUTUPHANE).filter(([id]) => !secim || id === secim)) {
  console.log(`\n${h.ad}`);
  for (const r of denetle(h)) { console.log(`  ${r.gecti ? '✓' : '✗'} ${r.ad} — ${r.olcum}`); if (!r.gecti) kalan++; }
}
console.log('\nOLUMSUZ FİKSTÜRLER — denetim eski hatayı GÖRMELİ');
for (const [ad, x] of Object.entries(ESKI)) {
  const r = denetle(x.h).find(r => r.ad === x.beklenen);
  const gordu = r && !r.gecti;
  console.log(`  ${gordu ? '✓' : '✗'} ${ad}: "${x.beklenen}" ${gordu ? 'KIRMIZI yandı' : 'YEŞİL kaldı — denetim kör!'} (${r?.olcum})`);
  if (!gordu) kalan++;
}
/* ── UYGULAMA ↔ 3B BAĞI ──────────────────────────────────────────────────
 * Uygulama artık yalnız 3B motorla çizer: 3B karşılığı olmayan bir hareket ekranda BOŞ
 * kalır. Kapsam, ürünün kendi eşleme fonksiyonuyla (hareketBul) sınanır. */
console.log('\nUYGULAMA ↔ 3B — her hareketin ve ısınmanın 3B karşılığı var');
const { EX } = await import('../js/data/exercises.js');
const { WARMUP } = await import('../js/data/warmup.js');
const { hareketBul } = await import('../js/anim3d/hareketler3d.js');
{
  const kayitlar = [...new Map([...EX.flat(), ...WARMUP.flat()].map(e => [e.id, e])).values()];
  const eksik = kayitlar.filter(e => !hareketBul(e)).map(e => e.id);
  console.log(`  ${eksik.length ? '✗' : '✓'} ${kayitlar.length} kayıt${eksik.length ? ` — 3B'si YOK: ${eksik.join(', ')}` : ''}`);
  if (eksik.length) kalan += eksik.length;
  // Olumsuz: denetim kör değil — var olmayan bir kimlik eşleşmemeli
  const kor = hareketBul({ id: '__yok__' }) !== null;
  console.log(`  ${kor ? '✗ kimliği olmayan kayıt eşleşti — kapsam denetimi kör!' : '✓ olumsuz: kimliği olmayan kayıt eşleşmiyor'}`);
  if (kor) kalan++;
}

/* ── PLANK VARYANTLARI — doğru ile yanlış arasındaki fark ÖLÇÜLEREK doğru olmalı ── */
console.log('\nPLANK VARYANTLARI — uygulama metinleriyle aynı sıra, yanlışlar DOĞRU yönde yanlış');
{
  const pl = EX.flat().find(e => e.id === 'plank'), V = K.plank.varyantlar ?? [];
  const yaz = (gecti, ad, olcum = '') => { console.log(`  ${gecti ? '✓' : '✗'} ${ad}${olcum ? ` — ${olcum}` : ''}`); if (!gecti) kalan++; };
  yaz(V.length === pl.variants.length, 'varyant sayısı metinlerle aynı', `${V.length} / ${pl.variants.length}`);
  yaz(pl.variants[0]?.ok === true, 'ilk varyant "doğru"');
  const ayni = (a, b) => ['P', 'omA', 'dA', 'eA', 'kaA', 'zA', 'aA', 'uA'].every(k => M.mesafe(a[k], b[k]) < 0.05);
  yaz(V.length > 0 && ayni(M.an({ ...K.plank, a: V[0] }, 0), M.an(K.plank, 0)), 'doğru varyant = hareketin kendi pozu');
  const beklenen = [null, 'çökük', 'yüksek'];
  V.forEach((poz, i) => {
    const h = { ...K.plank, a: poz }, r = denetle(h), tek = r.find(x => x.ad.startsWith('omuz–kalça–bilek'));
    const digerleri = r.filter(x => x !== tek && !x.gecti);
    const s = M.an(h, 0), o = s.omA.map((v, k) => (v + s.omB[k]) / 2), a = s.aA.map((v, k) => (v + s.aB[k]) / 2);
    const sapma = s.P[1] - (o[1] + (a[1] - o[1]) * (s.P[0] - o[0]) / (a[0] - o[0]));   // + ise kalça çizginin üstünde
    const ad = pl.variants[i]?.label ?? `#${i}`;
    yaz(!digerleri.length, `${ad}: ön kollar yerde, dirsek omzun altında, parmak uçları yerde`, digerleri.map(x => `${x.ad} (${x.olcum})`).join(', '));
    if (i === 0) { yaz(tek.gecti, `${ad}: tek çizgide`, tek.olcum); return; }
    yaz((pl.variants[i]?.label ?? '').toLocaleLowerCase('tr').includes(beklenen[i]), `${ad}: metin sırası "${beklenen[i]}" ile eşleşiyor`);
    const dogruYon = beklenen[i] === 'çökük' ? sapma < -3 : sapma > 3;
    yaz(dogruYon, `${ad}: kalça çizginin ${beklenen[i] === 'çökük' ? 'ALTINDA' : 'ÜSTÜNDE'}`, `sapma ${f(sapma)}`);
  });
}

console.log(`\n${kalan ? `✗ ${kalan} sorun` : '✓ tümü temiz'}`);
process.exit(kalan ? 1 : 0);
