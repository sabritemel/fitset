/**
 * 3B HAREKET KÜTÜPHANESİ — MOKAP (uygulama koduna bağlı değil)
 *
 * Her hareket ADINDAN türetilen doğru teknikle, "ekipman sürer, beden takip
 * eder" ilkesiyle yazılır: el ve ayaklar ekipmanın ya da zeminin belirlediği
 * noktalara bağlanır, uzuvlar ters kinematikle çözülür. Her hareket FİZİKSEL
 * kısıtlarını KENDİSİ beyan eder (`kisit`); fizik-denetimi.mjs her kareyi ölçer.
 *
 * Eksenler: x ileri (kişinin baktığı yön), y yukarı, z sağ (A = sağ taraf).
 * Sırtüstü hareketlerde baş −x yönündedir. Birimler 2B motorla aynı ölçekte.
 * Zaman: t = 0 başlangıç pozisyonu, t = 1 hareketin öbür ucu (animasyon 0→1→0).
 */
import * as M from './manken3d.js';

const { rd, yon, ekle, fark, nokta, birim, ara, mesafe, R } = M;
const ease = t => t * t * (3 - 2 * t);
const Z = [0, 0, 1];

/* ── Ortak parçalar ─────────────────────────────────────────────────────── */
const SEHPA = { ust: '#3a4149', yan: '#272c33' }, PED = { ust: '#3a4149', yan: '#2c323a' }, METAL = '#5d646d';
const sehpa = (pr, ust = 38.5) => [
  ...M.kutu(pr, [-80, 18], [ust - 6, ust], [-13, 13], SEHPA),
  ...M.kutu(pr, [-72, -64], [0, ust - 6], [-8, 8]), ...M.kutu(pr, [4, 12], [0, ust - 6], [-8, 8])];
const oturak = (pr, ust, x = [-16, 14]) => [...M.kutu(pr, x, [ust - 6, ust], [-15, 15], SEHPA), ...M.kutu(pr, [-4, 4], [0, ust - 6], [-4, 4])];
/** Gövdenin arkasındaki yönlü minder: gövde yönü g boyunca, gövdenin ARKASINDA */
const sirtMinderi = (pr, s, n, boy = 70, ofset = 30) =>
  M.kutuY(pr, ekle(ekle(s.P, s.g, ofset), n, -(R.gogus + 3)), [Z, s.g, n], [30, boy, 6], PED);
/** Temas: gövde yüzeyi ile minderin ön yüzü arasındaki boşluk (0 = değiyor) */
const sirtTemas = n => s => nokta(fark(s.gogusAlt, ekle(ekle(s.P, s.g, 30), n, -(R.gogus + 3) + 3)), n) - R.gogus;

/** Oturur: kalça oturakta, uyluklar öne, ayak tabanları yerde (FK; bilek y = 3,6 için P.y = 44) */
const OTURUR = (P, g, yan = [-90, 0]) => ({ P, g, yan, ayak: 0,
  thA: [-8, -5], shA: [-8, -88], thB: [8, -5], shB: [8, -88],
  uaA: [-90, -85], faA: [-90, -85], uaB: [90, -85], faB: [90, -85] });
/** Ayakta: bacaklar IK ile ayak bileği hedeflerine; kollar yanda sarkık (FK) */
const AYAKTA = (P, g = [0, 90]) => ({ P, g, yan: [-90, 0], ayak: 0,
  uaA: [-90, -86], faA: [-90, -86], uaB: [90, -86], faB: [90, -86] });
const ayakBilekleri = (x, zYari, kutup = [1, 0, 0]) => ({
  ayakA: { hedef: [x, R.ayak, zYari], kutup: [kutup[0], kutup[1], 0.12] },
  ayakB: { hedef: [x, R.ayak, -zYari], kutup: [kutup[0], kutup[1], -0.12] } });
/** Sırtüstü (bench): baş −x, A = −z */
const SIRTUSTU = { P: [8, 50, 0], g: [180, 0], yan: [90, 0], yuz: [0, 90], ayak: 0,   // yüz YUKARI
  thA: [25, -12], shA: [25, -85], thB: [-25, -12], shB: [-25, -85] };
const BENCH_UST = 38.5;
const sehpaTemaslari = [
  { ad: 'sırt sehpada', f: s => (s.gogusAlt[1] - R.gogus) - BENCH_UST, aralik: [-2, 2] },
  { ad: 'baş sehpada', f: s => (s.kafa[1] - R.kafa) - BENCH_UST, aralik: [-2, 3] }];
const kalcaOturakta = ust => ({ ad: 'kalça oturakta', f: s => (s.P[1] - R.kalca) - ust, aralik: [-1.5, 1.5] });
/** Sabit bir dirsek E etrafında, eğik düzlemde dönen el: kolun "sabit üst kol" hareketleri */
const dirsekEtrafinda = (E, onKol, aci, egim, isaret) =>
  [E[0] + onKol * Math.sin(aci) * Math.cos(egim), E[1] - onKol * Math.cos(aci) * Math.cos(egim), E[2] + isaret * onKol * Math.sin(egim)];
const bitisik = (h, ad, kisit = {}) => ({ ...h, ad, kisit: { ...h.kisit, ...kisit } });

/* ══════════════════════════════════════════════════════════════════════════ */
export const KUTUPHANE = {

  /* ─── 1. GÜN ─────────────────────────────────────────────────────────── */

  bb_bench_press: bitisik(M.HAREKETLER.bench, 'Barbell Bench Press', { dizYonu: [0.7, 0.7, 0] }),

  db_bench_fly: {
    ad: 'Dumbbell Bench Fly', kamera: [40, 32], seritKameralar: [[0, 0], [90, 24], [40, 32]], merkez: [-20, 0, 0],
    a: SIRTUSTU,
    // El, omzun üstünde sabit yarıçaplı yay çizer (yatay abdüksiyon); dirsek hafif bükük ve SABİT
    uclar: t => { const th = rd(ara(-4, 84, ease(t))); return s => ({   // altta dambıllar omuz hizasında, üst kol ≈ yatay (NSCA)
      A: { hedef: [s.omA[0] + 6, s.omA[1] + 58 * Math.cos(th), s.omA[2] - 58 * Math.sin(th)], kutup: [0.3, -0.2, -1] },
      B: { hedef: [s.omB[0] + 6, s.omB[1] + 58 * Math.cos(th), s.omB[2] + 58 * Math.sin(th)], kutup: [0.3, -0.2, 1] } }); },
    ekipman: (pr, s) => [...sehpa(pr), ...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
    cisimler: s => [[ekle(s.eA, [1, 0, 0], -7), ekle(s.eA, [1, 0, 0], 7), 5.5], [ekle(s.eB, [1, 0, 0], -7), ekle(s.eB, [1, 0, 0], 7), 5.5]],
    izlenen: 'eB',
    kisit: { ayaklar: 'yerde', dizYonu: [0.7, 0.7, 0], dirsek: { aralik: [10, 35], sabit: true }, temas: sehpaTemaslari },
  },

  machine_incline_press: (() => {
    // Sırt yere 40° (üst göğüs için 30–45°, Rodríguez-Ridao 2020). Kaldıraçlı makinede tutamak
    // bir PİVOT etrafında YAY çizer: yukarı-ileri, sonda alın hizasının üstüne (ExRx videosu).
    const g = [180, 40], gd = yon(...g), n = yon(0, 50), P = [0, 44, 0], RL = 100;
    const S0 = ekle(ekle(P, gd, 40), n, R.gogus + 6);             // tutamak üst göğsün hemen altında
    const PIVOT = ekle(S0, gd, RL);                                // pivot başın üst-arkasında
    const yol = t => { const f = 0.38 * ease(t); return ekle(ekle(PIVOT, gd, -RL * Math.cos(f)), n, RL * Math.sin(f)); };
    return {
      ad: 'Incline Chest Press Machine', kamera: [35, 16], seritKameralar: [[0, 0], [35, 16], [110, 22]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], 26], kutup: [0, -0.6, 1] }, B: { hedef: [c[0], c[1], -26], kutup: [0, -0.6, -1] } }); },
      ekipman(pr, s, t) {
        const c = yol(t), o = [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 74, 32)];
        for (const zz of [1, -1]) {
          o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], 34 * zz], [c[0], c[1], 34 * zz], 2.4, METAL));   // kaldıraç kolu (sabit boy)
          o.push(M.kapsul(pr, [c[0], c[1], 20 * zz], [c[0], c[1], 34 * zz], 2.4, '#8a929c'));        // tutamak (pronasyon, geniş)
        }
        o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], -36], [PIVOT[0], PIVOT[1], 36], 3, METAL));         // pivot mili
        return o;
      },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(36), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }],
        ozel: [{ ad: 'kaldıraç boyu sabit', f: ks => { const d = ks.map(s => Math.hypot(s.eA[0] - PIVOT[0], s.eA[1] - PIVOT[1])), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } }] },
    };
  })(),

  db_shoulder_press: (() => {
    const g = [180, 85], n = yon(0, 5), P = [0, 44, 0];
    return {
      ad: 'Dumbbell Shoulder Press', kamera: [28, 12], seritKameralar: [[0, 0], [90, 6], [28, 12]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      // Altta: üst kol yanda ~yatay, ön kol DİK (dambıl omuz hizası); üstte: kollar neredeyse uzanık, dambıllar yakın
      uclar: t => { const k = ease(t); return s => ({
        A: { hedef: ekle(s.omA, [ara(4, 2, k), ara(27, 58.3, k), ara(29, 8, k)]), kutup: [0.1, -1, 0.7] },
        B: { hedef: ekle(s.omB, [ara(4, 2, k), ara(27, 58.3, k), -ara(29, 8, k)]), kutup: [0.1, -1, -0.7] } }); },
      ekipman: (pr, s) => [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 62, 34), ...M.dambil(pr, s.eA, Z), ...M.dambil(pr, s.eB, Z)],
      cisimler: s => [[ekle(s.eA, Z, -7), ekle(s.eA, Z, 7), 5.5], [ekle(s.eB, Z, -7), ekle(s.eB, Z, 7), 5.5]],
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(36), { ad: 'sırt pedde', f: sirtTemas(n), aralik: [-1.5, 1.5] }] },
    };
  })(),

  cable_front_raise: (() => {
    // Sabri'nin salondaki varyantı (24 Eyl): tek ALÇAK makaraya sırt dönük, kablo İKİ BACAĞIN
    // ARASINDAN geçer, ucundaki bar İKİ ELLE tutulup öne-yukarı kaldırılır. (ExRx'in iki elli
    // sürümünde kablolar iki makaradan gövdenin yanlarından gelir; bu tek makaralı salon varyantı.)
    const MAKARA = [-40, 6, 0], KOL = 59.6, YARI = 16, gam = Math.asin((YARI - 14) / KOL);
    const el = (om, t, i) => { const f = rd(ara(22, 90, ease(t)));   // başta bar uylukların önünde, sonda omuz hizası
      return ekle(om, [KOL * Math.sin(f) * Math.cos(gam), -KOL * Math.cos(f) * Math.cos(gam), i * KOL * Math.sin(gam)]); };
    const bar = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    return {
      ad: 'Cable Front Raise', kamera: [40, 14], seritKameralar: [[0, 0], [40, 14], [130, 10]], merkez: [-8, 0, 0],
      a: AYAKTA([0, 78, 0]),
      uclar: t => s => ({ A: { hedef: el(s.omA, t, 1), kutup: [-0.2, -1, 0.5] }, B: { hedef: el(s.omB, t, -1), kutup: [-0.2, -1, -0.5] }, ...ayakBilekleri(2, 16) }),
      ekipman(pr, s) {
        const m = bar(s);
        return [...M.kutu(pr, [-48, -34], [0, 20], [-8, 8], PED), M.makara(pr, MAKARA), M.kablo(pr, MAKARA, m),
          M.kapsul(pr, [m[0], m[1], -22], [m[0], m[1], 22], 1.8, '#8a929c')];            // düz bar, pronasyon
      },
      cisimler: s => { const m = bar(s); return [[MAKARA, m, 0.7], [[m[0], m[1], -22], [m[0], m[1], 22], 1.8]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [3, 20], sabit: true },
        govde: { aralik: [87, 93], oynama: 1 } },
    };
  })(),

  machine_reverse_fly: bitisik(M.HAREKETLER.reverseFly, 'Reverse Pec Fly', { dizYonu: [1, 0.5, 0] }),

  cable_vbar_pushdown: (() => {
    const MAKARA = [26, 185, 0], bet = Math.asin(11 / 29);       // ön kollar içe eğik: dirsek ±17, el V tutamakta ±6
    const E = s => [s.omA[0] + 3, s.omA[1] - 30.6, 17];           // dirsekler gövdenin YANINDA ve SABİT
    const el = (s, t, i) => { const e = E(s); return dirsekEtrafinda([e[0], e[1], i * 17], 29, rd(ara(100, 12, ease(t))), bet, -i); };
    return {
      ad: 'V-Bar Push Down', kamera: [38, 12], seritKameralar: [[0, 0], [38, 12], [100, 8]], merkez: [10, 0, 0],
      a: AYAKTA([0, 77, 0], [0, 82]),
      uclar: t => s => ({
        A: { hedef: el(s, t, 1), kutup: fark([E(s)[0], E(s)[1], 17], s.omA) },
        B: { hedef: el(s, t, -1), kutup: fark([E(s)[0], E(s)[1], -17], s.omB) }, ...ayakBilekleri(2, 11) }),
      ekipman(pr, s) {
        const m = s.eA.map((v, i) => (v + s.eB[i]) / 2), tepe = ekle(m, [0, 7, 0]);
        return [M.kapsul(pr, [46, 0, -34], [46, 195, -34], 3, METAL), M.kapsul(pr, [46, 192, -34], MAKARA, 2.4, METAL),   // kolon yanda: önde durunca kolları örtüyordu
          M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          M.kapsul(pr, s.eA, tepe, 1.6, '#8a929c'), M.kapsul(pr, s.eB, tepe, 1.6, '#8a929c')];
      },
      cisimler: s => { const m = s.eA.map((v, i) => (v + s.eB[i]) / 2); return [[MAKARA, ekle(m, [0, 7, 0]), 0.7]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [80, 84], oynama: 1 } },
    };
  })(),

  db_overhead_ext: (() => {
    const U = [0, 1, 0], V = birim([-1, 0, -0.35]);               // ön kol ensenin arkasına, hafif içe iner
    const E = s => ekle(s.omA, [-2, 30.8, -3]);                    // üst kol kulağın yanında dik ve SABİT
    const el = (s, t) => { const a = rd(ara(6, 120, ease(t))); return ekle(E(s), ekle(M.ekle([0, 0, 0], U, Math.cos(a)), V, Math.sin(a)), 29); };
    return {
      ad: 'One Arm Overhead Dumbbell Ext.', kamera: [-30, 14], seritKameralar: [[0, 0], [-30, 14], [-120, 12]], merkez: [0, 0, 0],
      a: OTURUR([0, 44, 0], [180, 88]),
      uclar: t => s => ({
        A: { hedef: el(s, t), kutup: fark(E(s), s.omA) },
        B: { hedef: ekle(s.P, [24, 10, -13]), kutup: [-0.3, 0, -1] } }),   // boştaki el uyluğun üstünde (dirseği desteklemek başın önünden geçirir)
      ekipman: (pr, s) => [...oturak(pr, 36), ...M.dambil(pr, s.eA, Z, 14, 6)],          // sap yatay (sağ-sol), avuç öne
      cisimler: s => [[ekle(s.eA, Z, -7), ekle(s.eA, Z, 7), 6]],
      izlenen: 'eA',
      kisit: { tekTaraf: true, dirsekYerinde: ['A'], ayaklar: 'yerde', dizYonu: [1, 0.3, 0], temas: [kalcaOturakta(36)] },
    };
  })(),

  plank: (() => {
    // Omuz–kalça–bilek TEK ÇİZGİDE; dirsekler omzun tam altında, ön kollar yerde öne dönük, parmak uçlarında
    const al = 10.2, P = [0, 35.6 - 55 * Math.sin(rd(al)), 0];
    /* VARYANTLAR — izometrik harekette öğretici olan doğru ile yanlış arasındaki fark (uygulamadaki
       doğru / kalça çökük / kalça yüksek). Pozlar kısıtlardan ÇÖZÜLÜR, uydurulmaz: omuz yüksekliği
       (ön kollar yerde) ve bilek yüksekliği (parmak uçları yerde) SABİT, dirsek omzun altında kalır;
       serbest değişken kalçanın yüksekliği. Gövde eğimi sin(ag) = (35,6 − Py)/55, bacak eğimi
       sin(ab) = (Py − 12,4)/76. Ayak ucu bu yüzden ileri-geri kayar (2B çözümüyle aynı). */
    const OMUZ_Y = 35.6, BILEK_Y = P[1] - 76 * Math.sin(rd(al)), OMUZ_X = 55 * Math.cos(rd(al));
    const plankPoz = Py => {
      const ag = Math.asin((OMUZ_Y - Py) / 55) * 180 / Math.PI, ab = Math.asin((Py - BILEK_Y) / 76) * 180 / Math.PI;
      return { P: [OMUZ_X - 55 * Math.cos(rd(ag)), Py, 0], g: [0, ag], yan: [-90, 0], ayak: [0, -90 + ab],
        thA: [180, -ab], shA: [180, -ab], thB: [180, -ab], shB: [180, -ab],
        uaA: [0, -90], faA: [0, 0], uaB: [0, -90], faB: [0, 0] };
    };
    return {
      ad: 'Plank', kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [10, 0, 0], statik: true,
      // Sıra uygulamadaki metinlerle AYNI (exercises.js → plank.variants): doğru · çökük · yüksek
      varyantlar: [plankPoz(P[1]), plankPoz(P[1] - 10), plankPoz(P[1] + 14)],
      a: { P, g: [0, al], yan: [-90, 0], ayak: [0, -90 + al],
        thA: [180, -al], shA: [180, -al], thB: [180, -al], shB: [180, -al],
        uaA: [0, -90], faA: [0, 0], uaB: [0, -90], faB: [0, 0] },
      ekipman: () => [],
      izlenen: 'P',
      kisit: { ayaklar: 'parmakUcu', dizYonu: [0, -1, 0], ozel: [
        { ad: 'omuz–kalça–bilek tek çizgide', f: ks => { const s = ks[0], o = s.omA.map((v, i) => (v + s.omB[i]) / 2), a = s.aA.map((v, i) => (v + s.aB[i]) / 2);
          const u = birim(fark(a, o)), v = fark(s.P, o), d = mesafe(v, ekle([0, 0, 0], u, nokta(v, u))); return { gecti: d <= 1.5, olcum: `sapma ${d.toFixed(1)}` }; } },
        { ad: 'dirsekler omzun altında', f: ks => { const s = ks[0], d = Math.hypot(s.dA[0] - s.omA[0], s.dA[2] - s.omA[2]); return { gecti: d <= 1, olcum: `yatay kayma ${d.toFixed(1)}` }; } },
        { ad: 'ön kollar yerde', f: ks => { const s = ks[0], y = [s.dA[1], s.eA[1], s.dB[1], s.eB[1]].map(v => v - R.fa); return { gecti: y.every(v => v >= -0.5 && v <= 1.5), olcum: `zemine göre ${Math.min(...y).toFixed(1)} … ${Math.max(...y).toFixed(1)}` }; } },
      ] },
    };
  })(),

  /* ─── 2. GÜN ─────────────────────────────────────────────────────────── */

  cable_close_pulldown: (() => {
    const g = [180, 70], gd = yon(...g), n = yon(0, 20), P = [0, 41, 0], MAKARA = [12, 205, 0];   // gövde 20° geride (ACE ≤30°)
    const alt = ekle(ekle(P, gd, 47), n, R.gogus + 5);             // göğsün üst kısmı
    const d = birim(fark(MAKARA, alt)), ust = ekle(alt, d, 54);   // tepede kollar neredeyse uzanık (58 iken gövde 20° geride ulaşılamadı, ölçüldü)    // tutamak KABLO doğrultusunda iner
    const yol = t => ekle(ust, fark(alt, ust), ease(t));
    return {
      ad: 'Close Grip Pull Down', kamera: [30, 10], seritKameralar: [[0, 0], [30, 10], [150, 14]], merkez: [8, 0, 0],
      a: { ...OTURUR(P, g), thA: [-6, 0], shA: [-6, -88], thB: [6, 0], shB: [6, -88] },
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], 6], kutup: [0.5, -1, 0.35] }, B: { hedef: [c[0], c[1], -6], kutup: [0.5, -1, -0.35] } }); },   // dirsekler önden-yandan iner
      ekipman(pr, s, t) {
        const c = yol(t), tepe = ekle(c, d, 6);
        return [...oturak(pr, 33, [-14, 12]), ...M.kutu(pr, [14, 26], [49, 55], [-16, 16], PED),
          M.kapsul(pr, [40, 0, -34], [40, 210, -34], 3, METAL), M.kapsul(pr, [40, 52, -34], [26, 52, -16], 2.4, METAL),   // kolon yanda
          M.kapsul(pr, [40, 208, -34], MAKARA, 2.4, METAL), M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          M.kapsul(pr, [c[0], c[1], 6], tepe, 1.6, '#8a929c'), M.kapsul(pr, [c[0], c[1], -6], tepe, 1.6, '#8a929c')];
      },
      cisimler: s => [[MAKARA, ekle(yol(s.t), d, 6), 0.7]],
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0], govde: { aralik: [68, 72], oynama: 1 },
        temas: [kalcaOturakta(33), { ad: 'uyluk pedin altında', f: s => 49 - ((s.kaA[1] + s.zA[1]) / 2 + R.th), aralik: [-1.5, 1.5] }] },
    };
  })(),

  db_two_arm_row: {
    ad: 'Two Arm Dumbbell Row', kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [150, 20]], merkez: [15, 0, 0],
    a: AYAKTA([0, 74, 0], [0, 20]),                               // gövde yere ~20° (NSCA; ExRx: yataya yakın)
    // Dambıl SARKAR: ön kol her karede dikey. El yüksekliği dy seçilir, dirsek elin 29 üstünde
    // olacak biçimde geriye kayma dx çözülür: dx² + (29 − dy)² + dz² = 31²
    uclar: t => { const k = ease(t), dz = 10, dy = ara(58.4, 8, k), dx = Math.sqrt(Math.max(0, 961 - (29 - dy) ** 2 - dz * dz));
      return s => {
        const hA = ekle(s.omA, [-dx, -dy, dz]), hB = ekle(s.omB, [-dx, -dy, -dz]);
        return { A: { hedef: hA, kutup: fark(ekle(hA, [0, 29, 0]), s.omA) }, B: { hedef: hB, kutup: fark(ekle(hB, [0, 29, 0]), s.omB) },
          ...ayakBilekleri(12, 9) }; }; },
    ekipman: (pr, s) => [...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
    cisimler: s => [[ekle(s.eA, [1, 0, 0], -7), ekle(s.eA, [1, 0, 0], 7), 5.5], [ekle(s.eB, [1, 0, 0], -7), ekle(s.eB, [1, 0, 0], 7), 5.5]],
    izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], onKolDikey: 20, govde: { aralik: [15, 25], oynama: 1 } },
  },

  cable_seated_row: (() => {
    const MAKARA = [78, 40, 0];
    const yol = t => [ara(60, 28, ease(t)), 70, 0];                // tutamak yere PARALEL gelir, karnın önüne
    return {
      ad: 'Seated Cable Row', kamera: [30, 16], seritKameralar: [[0, 0], [30, 16], [140, 20]], merkez: [35, 0, 0],
      a: { ...OTURUR([0, 40, 0], [0, 81]), ayak: [0, 70] }, b: { ...OTURUR([0, 40, 0], [0, 90]), ayak: [0, 70] },
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], 5], kutup: [-1, -0.2, 1] }, B: { hedef: [c[0], c[1], -5], kutup: [-1, -0.2, -1] },
        ayakA: { hedef: [72, 30, 10], kutup: [0.2, 1, 0.15] }, ayakB: { hedef: [72, 30, -10], kutup: [0.2, 1, -0.15] } }); },
      ekipman(pr, s, t) {
        const c = yol(t), tepe = ekle(c, [8, 0, 0]);
        return [...M.kutu(pr, [-20, 40], [26, 32], [-13, 13], SEHPA), ...M.kutu(pr, [-12, 32], [0, 26], [-6, 6]),
          ...M.kutu(pr, [80, 84], [8, 54], [-18, 18], PED), M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          M.kapsul(pr, [c[0], c[1], 5], tepe, 1.6, '#8a929c'), M.kapsul(pr, [c[0], c[1], -5], tepe, 1.6, '#8a929c')];
      },
      cisimler: s => [[MAKARA, ekle(yol(s.t), [8, 0, 0]), 0.7]],
      izlenen: 'eA',
      kisit: { ortakBar: true, dizYonu: [0.2, 1, 0], govde: { aralik: [80, 91], oynama: 10 }, temas: [kalcaOturakta(32)],
        ozel: [{ ad: 'ayaklar platformda sabit', f: ks => { const d = Math.max(...ks.map(s => mesafe(s.aA, ks[0].aA))); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)}` }; } }] },
    };
  })(),

  cable_curl: (() => {
    const MAKARA = [16, 8, 0];                                    // makara ayakların hemen önünde: kablo neredeyse dikey (ExRx)
    const E = (s, i) => ekle(i > 0 ? s.omA : s.omB, [3, -30.6, 4 * i]);   // dirsekler gövdenin yanında SABİT
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), 29, rd(ara(20, 140, ease(t))), 0, i);
    return {
      ad: 'Cable Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [10, 0, 0],
      a: AYAKTA([0, 78, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: fark(E(s, 1), s.omA) }, B: { hedef: el(s, t, -1), kutup: fark(E(s, -1), s.omB) }, ...ayakBilekleri(2, 11) }),
      ekipman(pr, s) {
        const m = [s.eA[0], s.eA[1], 0];
        return [...M.kutu(pr, [12, 26], [0, 4], [-8, 8], PED), M.makara(pr, MAKARA), M.kablo(pr, MAKARA, m),
          M.kapsul(pr, [m[0], m[1], -24], [m[0], m[1], 24], 1.8, '#8a929c')];    // düz bar, supinasyon
      },
      cisimler: s => [[MAKARA, [s.eA[0], s.eA[1], 0], 0.7], [[s.eA[0], s.eA[1], -24], [s.eA[0], s.eA[1], 24], 1.8]],
      izlenen: 'eA',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 } },
    };
  })(),

  db_hammer_curl: (() => {
    const bet = Math.asin(5 / 29);                                 // dambıllar uylukların DIŞINDA sarkar
    const E = (s, i) => ekle(i > 0 ? s.omA : s.omB, [3, -30.6, 4 * i]);
    const aci = t => rd(ara(8, 135, ease(t)));
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), 29, aci(t), bet, i);
    const eksen = t => [Math.cos(aci(t)), Math.sin(aci(t)), 0];   // çekiç tutuş: tutamak ön kola dik, sagital düzlemde
    return {
      ad: 'Dumbbell Hammer Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [5, 0, 0],
      a: AYAKTA([0, 78, 0]),
      // Kollar SIRAYLA (ExRx): sol kol sağın tersi zamanlamayla
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: fark(E(s, 1), s.omA) }, B: { hedef: el(s, 1 - t, -1), kutup: fark(E(s, -1), s.omB) }, ...ayakBilekleri(2, 11) }),
      ekipman: (pr, s, t) => [...M.dambil(pr, s.eA, eksen(t)), ...M.dambil(pr, s.eB, eksen(1 - t))],
      cisimler: s => [[ekle(s.eA, eksen(s.t), -7), ekle(s.eA, eksen(s.t), 7), 5.5], [ekle(s.eB, eksen(1 - s.t), -7), ekle(s.eB, eksen(1 - s.t), 7), 5.5]],
      izlenen: 'eA',
      kisit: { sirayla: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 } },
    };
  })(),

  machine_leg_press: (() => {
    const P = [0, 30, 0], g = [180, 38], gd = yon(...g), n = yon(0, 52), r = birim([1, 1, 0]), pY = birim([-1, 1, 0]);
    const s0 = 53.8, sH = 21;                                       // altta diz ~90°, üstte ~160°
    const bilek = (t, i) => ekle(ekle(P, r, s0 + sH * (1 - ease(t))), Z, 12 * i);   // t=0 üst (kollar uzun), t=1 alt
    return {
      ad: 'Leg Press', kamera: [30, 18], seritKameralar: [[0, 0], [30, 18], [120, 26]], merkez: [25, 0, 0],
      a: { P, g, yan: [-90, 0], ayak: [180, 45], uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] },
      uclar: t => s => ({
        A: { hedef: [P[0] + 6, P[1] + 4, 24], kutup: [0, -1, 0.5] }, B: { hedef: [P[0] + 6, P[1] + 4, -24], kutup: [0, -1, -0.5] },
        ayakA: { hedef: bilek(t, 1), kutup: [-0.5, 1, 0.15] }, ayakB: { hedef: bilek(t, -1), kutup: [-0.5, 1, -0.15] } }),
      ekipman(pr, s, t) {
        const orta = ekle(ekle(P, r, s0 + sH * (1 - ease(t)) + 5), pY, 6);
        return [...M.kutu(pr, [-14, 14], [16, 22], [-15, 15], SEHPA), ...M.kutu(pr, [-10, 10], [0, 16], [-8, 8]),
          ...sirtMinderi(pr, s, n, 70, 32),
          ...M.kutuY(pr, orta, [Z, pY, r], [44, 40, 4], PED),
          ...[26, -26].map(zz => M.kapsul(pr, ekle(ekle(P, r, 40), Z, zz), ekle(ekle(P, r, 105), Z, zz), 2.2, METAL)),
          ...[24, -24].map(zz => M.kapsul(pr, [P[0] + 2, P[1] + 4, zz], [P[0] + 10, P[1] + 4, zz], 2.2, '#8a929c'))];
      },
      izlenen: 'aA',
      kisit: { dizYonu: [-0.7, 0.7, 0], temas: [kalcaOturakta(22), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'altta diz ~90° (80–105°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m >= 80 && m <= 105, olcum: `${m.toFixed(1)}°` }; } },
          { ad: 'üstte diz kilitlenmiyor (≥ 10°)', f: ks => { const m = Math.min(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m >= 10, olcum: `${m.toFixed(1)}°` }; } },
          { ad: 'dizler ayak hizasında (içe düşmüyor)', f: ks => { const m = Math.max(...ks.map(s => Math.abs(s.zA[2] - s.aA[2]))); return { gecti: m <= 4, olcum: `sapma ${m.toFixed(1)}` }; } },
        ] },
    };
  })(),

  lunge: (() => {
    // Sabri (24 Eyl): "adımı ileri atıyorum, sonra geri alıp sonraki adımı atıyorum — ilerlemiyorum".
    // ExRx/NSCA/ACE de aynı: ayaklar yan yana → öne ADIM → aşağı in → itip BAŞA dön; bacaklar SIRAYLA.
    // Döngü: ilk yarı sağ bacak önde, ikinci yarı sol bacak önde; her yarı 0→1→0 (adım, iniş, dönüş).
    const T1 = 0.4, ADIM = 72;
    const faz = t => { const yari = t < 0.5 ? 0 : 1, u = (t - yari * 0.5) * 2; return { i: yari ? -1 : 1, tau: u < 0.5 ? u * 2 : (1 - u) * 2 }; };
    const k1 = t => ease(Math.min(t / T1, 1)), k2 = t => ease(Math.max(0, (t - T1) / (1 - T1)));
    const onBilek = (tau, i) => [ADIM * k1(tau), R.ayak + 9 * Math.sin(Math.PI * k1(tau)), 9 * i];      // adımda yay çizer
    const parmak = i => [9, R.ayak, -9 * i];                                                          // arka ayak parmak ucu SABİT
    const arkaAci = tau => ara(0, -55, ease(tau));
    const arkaBilek = (tau, i) => { const d = yon(0, arkaAci(tau)); return [9 - 9 * d[0], R.ayak - 9 * d[1], -9 * i]; };
    const kalca = tau => tau <= T1 ? [ara(0, 30, k1(tau)), ara(77, 60, k1(tau)), 0] : [ara(30, 40, k2(tau)), ara(60, 47, k2(tau)), 0];
    const on = (s, i, k) => s[`${k}${i > 0 ? 'A' : 'B'}`], arka = (s, i, k) => s[`${k}${i > 0 ? 'B' : 'A'}`];
    const alt = ks => ks.filter(s => faz(s.t).tau >= 0.999);
    const ozel = (ad, f) => ({ ad, f });
    return {
      ad: 'Lunge', dongu: true, seritAnlar: [[0, 'başı'], [0.25, 'sağ öne'], [0.75, 'sol öne']],
      kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [90, 8]], merkez: [30, 0, 0],
      poz: t => { const { i, tau } = faz(t);
        return { ...AYAKTA(kalca(tau)), ayakA: i > 0 ? 0 : [0, arkaAci(tau)], ayakB: i > 0 ? [0, arkaAci(tau)] : 0 }; },
      uclar: t => s => { const { i, tau } = faz(t);
        const onA = { hedef: onBilek(tau, i), kutup: [1, 0, 0.1 * i] }, arkaA = { hedef: arkaBilek(tau, i), kutup: [1, -0.5, -0.1 * i] };
        return {
          A: { hedef: ekle(s.P, [-2, 6, 17]), kutup: [-0.5, 0, 1] }, B: { hedef: ekle(s.P, [-2, 6, -17]), kutup: [-0.5, 0, -1] },   // eller belde
          ayakA: i > 0 ? onA : arkaA, ayakB: i > 0 ? arkaA : onA }; },
      ekipman: () => [],
      izlenen: 'P',
      kisit: { dizYonu: [1, 0, 0], govde: { aralik: [84, 96], oynama: 1 },
        ozel: [
          ozel('arka ayak parmak ucu yerde ve sabit', ks => { const d = Math.max(...ks.map(s => { const { i } = faz(s.t); return mesafe(arka(s, i, 'u'), parmak(i)); })); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)}` }; }),
          ozel('ön ayak bastıktan sonra sabit', ks => { const b = ks.filter(s => faz(s.t).tau >= T1); const d = Math.max(...b.map(s => { const { i } = faz(s.t); return mesafe(on(s, i, 'a'), onBilek(1, i)); })); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)} (${b.length} kare)` }; }),
          ozel('ön ayak adımda yere sürtmüyor', ks => { const m = Math.min(...ks.filter(s => faz(s.t).tau < T1).map(s => { const { i } = faz(s.t); return Math.min(on(s, i, 'a')[1], on(s, i, 'u')[1]) - R.ayak; })); return { gecti: m >= -0.5, olcum: `zemine en yakın ${m.toFixed(1)}` }; }),
          ozel('altta ön diz ~90° (75–105°) — iki bacakta', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return 180 - aciOf(on(s, i, 'ka'), on(s, i, 'z'), on(s, i, 'a')); }); return { gecti: v.length === 2 && v.every(m => m >= 75 && m <= 105), olcum: v.map(m => m.toFixed(1) + '°').join(' · ') }; }),
          ozel('altta ön diz ayak bileğini fazla geçmiyor', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return on(s, i, 'z')[0] - on(s, i, 'a')[0]; }); return { gecti: v.every(m => m <= 10), olcum: v.map(m => m.toFixed(1)).join(' · ') }; }),
          ozel('altta arka diz yere yakın (3–5 cm)', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return arka(s, i, 'z')[1] - R.sh; }); return { gecti: v.every(m => m >= 0 && m <= 8), olcum: v.map(m => m.toFixed(1)).join(' · ') }; }),
          ozel('başa döner (ayaklar yan yana, ilerlemiyor)', ks => { const s0 = ks.find(s => s.t === 0), sY = ks.find(s => Math.abs(s.t - 0.5) < 1e-9); const d = Math.max(mesafe(s0.aA, sY.aA), mesafe(s0.aB, sY.aB), mesafe(s0.P, sY.P)); return { gecti: d <= 0.5 && Math.abs(s0.aA[0] - s0.aB[0]) <= 0.5, olcum: `yarım döngü sonunda sapma ${d.toFixed(1)}` }; }),
        ] },
    };
  })(),

  calf_raise: (() => {
    // ExRx: ayak ÖN TABANI basamakta, topuklar boşta; topuk basamak seviyesinin ALTINDAN
    // (dorsifleksiyon) en yükseğe; dizler düz, bir el destekte
    const BASAMAK = 12, PARMAK = zz => [9, BASAMAK + R.ayak, zz];
    const aci = t => ara(15, -40, ease(t));
    const bilek = (t, zz) => { const d = yon(0, aci(t)); return fark(PARMAK(zz), [9 * d[0], 9 * d[1], 0]); };
    const DIREK = [22, 0, 36], EL = [19, 112, 32];                 // direk yanda: önde durunca bedeni örtüyordu
    return {
      ad: 'Calf Raise', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 8]], merkez: [10, 0, 0],
      poz: t => ({ ...AYAKTA([bilek(t, 0)[0], bilek(t, 0)[1] + 75.9, 0]), ayak: [0, aci(t)] }),
      uclar: t => () => ({
        A: { hedef: EL, kutup: [0, -1, 0.4] },
        ayakA: { hedef: bilek(t, 10), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(t, -10), kutup: [1, 0, -0.1] } }),
      ekipman: pr => [...M.kutu(pr, [4, 34], [0, BASAMAK], [-18, 18], PED), M.kapsul(pr, DIREK, [DIREK[0], 150, DIREK[2]], 2, METAL)],
      izlenen: 'P',
      kisit: { tekTaraf: true, zeminY: BASAMAK, ayaklar: 'parmakUcu', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'dizler düz (≤ 10°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 10, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          { ad: 'başta topuk basamağın altında', f: ks => { const m = ks[0].aA[1] - (BASAMAK + R.ayak); return { gecti: m < 0, olcum: `${m.toFixed(1)}` }; } },
          { ad: 'topuk yükseliyor (≥ 5)', f: ks => { const m = ks.at(-1).aA[1] - ks[0].aA[1]; return { gecti: m >= 5, olcum: `${m.toFixed(1)}` }; } },
          { ad: 'el direkte sabit', f: ks => { const m = Math.max(...ks.map(s => mesafe(s.eA, EL))); return { gecti: m <= 0.5, olcum: `kayma ${m.toFixed(1)}` }; } },
        ] },
    };
  })(),

  /* ─── ISINMA ─────────────────────────────────────────────────────────── */

  w_kol_cevirme: {
    // Metin: "öne ve geriye, küçükten büyüğe daireler" → kollar yana açık (T), el omuzun
    // yanında daire çizer (sagitale paralel düzlemde). SO kılavuzu kollar aşağıda büyük daire
    // de gösteriyor — metindeki varyant seçildi.
    ad: 'Kol çevirme', isinma: true, dongu: true, kamera: [30, 12], seritKameralar: [[0, 0], [30, 12], [90, 8]], merkez: [0, 0, 0],
    a: AYAKTA([0, 78, 0]),
    uclar: t => { const w = 2 * Math.PI * t, r = 14, yan = Math.sqrt(59.6 ** 2 - r * r); return s => ({
      A: { hedef: ekle(s.omA, [r * Math.cos(w), r * Math.sin(w), yan]), kutup: [-0.3, -1, 0] },
      B: { hedef: ekle(s.omB, [r * Math.cos(w), r * Math.sin(w), -yan]), kutup: [-0.3, -1, 0] }, ...ayakBilekleri(2, 11) }); },
    ekipman: () => [], izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [0, 15], sabit: true }, govde: { aralik: [88, 92], oynama: 1 } },
  },

  w_dis_rotasyon: (() => {
    // ACE / NHS: üst kol gövdenin yanında SABİT, dirsek 90°, ön kol öne bakar ve DIŞA açılır
    // (transvers düzlem). 2B önden görünüm bunu ön kolu yukarı kaldırır gibi çiziyordu.
    const E = (s, i) => ekle(i > 0 ? s.omA : s.omB, [2, -30.8, 3 * i]);
    const el = (s, t, i) => { const f = rd(ara(0, 70, ease(t))); return ekle(E(s, i), [29 * Math.cos(f), 0, i * 29 * Math.sin(f)]); };
    return {
      ad: 'Omuz dış rotasyon', isinma: true, kamera: [20, 40], seritKameralar: [[0, 0], [20, 40], [90, 60]], merkez: [0, 0, 0],
      a: AYAKTA([0, 78, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: fark(E(s, 1), s.omA) }, B: { hedef: el(s, t, -1), kutup: fark(E(s, -1), s.omB) }, ...ayakBilekleri(2, 11) }),
      ekipman: () => [], izlenen: 'eA',
      kisit: { dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [{ ad: 'ön kol yere paralel', f: ks => { const m = Math.max(...ks.flatMap(s => [Math.abs(s.eA[1] - s.dA[1]), Math.abs(s.eB[1] - s.dB[1])])); return { gecti: m <= 1, olcum: `en fazla ${m.toFixed(1)}` }; } }] },
    };
  })(),

  w_gogus_acma: {
    // SO "Arm Swings": kollar omuz hizasında; önde birleşmeye yakın → olabildiğince geriye açılır
    // (yatay abdüksiyon, transvers düzlem). 2B önden görünüm ön kolları yukarıda eğiyordu.
    ad: 'Göğüs açma — dinamik', isinma: true, kamera: [20, 45], seritKameralar: [[90, 0], [20, 45], [0, 80]], merkez: [0, 0, 0],
    a: AYAKTA([0, 78, 0]),
    uclar: t => { const f = rd(ara(5, 100, ease(t))); return s => ({
      A: { hedef: ekle(s.omA, [59.6 * Math.cos(f), 0, 59.6 * Math.sin(f)]), kutup: [0, -1, 0] },
      B: { hedef: ekle(s.omB, [59.6 * Math.cos(f), 0, -59.6 * Math.sin(f)]), kutup: [0, -1, 0] }, ...ayakBilekleri(2, 11) }); },
    ekipman: () => [], izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [0, 15], sabit: true }, govde: { aralik: [88, 92], oynama: 1 } },
  },

  w_bacak_sallama: (() => {
    // SO: bir elle desteğe tutun, bir bacak DÜZ öne-arkaya sallanır; duran bacak ve gövde sabit
    const DIREK = [8, 0, -30], EL = [5, 100, -30];
    const p = t => ara(-125, -52, ease(t));
    return {
      ad: 'Bacak sallama', isinma: true, kamera: [28, 10], seritKameralar: [[0, 0], [28, 10], [-40, 14]], merkez: [0, 0, 0],
      poz: t => ({ ...AYAKTA([0, 79, 0]), thA: [0, p(t)], shA: [0, p(t) + 12], ayakA: [0, p(t) + 12 + 90], ayakB: 0 }),
      uclar: () => () => ({ B: { hedef: EL, kutup: [0, -1, -0.4] }, ayakB: { hedef: [2, R.ayak, -9], kutup: [1, 0, -0.1] } }),
      ekipman: pr => [M.kapsul(pr, DIREK, [DIREK[0], 140, DIREK[2]], 2, METAL)],
      izlenen: 'aA',
      kisit: { tekTaraf: true, ayaklar: { B: 'yerde' }, govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'sallanan bacak düz (≤ 15°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 15, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          { ad: 'sallanan ayak yere sürtmüyor', f: ks => { const m = Math.min(...ks.map(s => Math.min(s.aA[1], s.uA[1]) - R.ayak)); return { gecti: m >= -0.5, olcum: `zemine en yakın ${m.toFixed(1)}` }; } },
          { ad: 'el destekte sabit', f: ks => { const m = Math.max(...ks.map(s => mesafe(s.eB, EL))); return { gecti: m <= 0.5, olcum: `kayma ${m.toFixed(1)}` }; } },
        ] },
    };
  })(),

  w_squat: (() => {
    // ACE/ExRx: ayaklar kalçadan biraz geniş, parmaklar hafif dışa; kollar öne uzanık; kalça
    // GERİ-aşağı; altta uyluk yere paralel, kaval kemiği gövdeye paralel; topuklar yerde
    const k = t => ease(t);
    return {
      ad: 'Vücut ağırlığıyla squat', isinma: true, kamera: [40, 10], seritKameralar: [[0, 0], [40, 10], [90, 6]], merkez: [0, 0, 0],
      poz: t => ({ ...AYAKTA([ara(0, -20, k(t)), ara(78, 40, k(t)), 0], [0, ara(90, 58, k(t))]),
        uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0], ayakA: -15, ayakB: 15 }),
      uclar: () => () => ({ ayakA: { hedef: [2, R.ayak, 14], kutup: [1, 0, 0.3] }, ayakB: { hedef: [2, R.ayak, -14], kutup: [1, 0, -0.3] } }),
      ekipman: () => [], izlenen: 'P',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0],
        ozel: [
          { ad: 'altta uyluk yere paralel', f: ks => { const s = ks.at(-1), m = s.kaA[1] - s.zA[1]; return { gecti: Math.abs(m) <= 6, olcum: `kalça dizden ${m.toFixed(1)} yukarıda` }; } },
          { ad: 'altta kaval kemiği gövdeye paralel (≤ 15°)', f: ks => { const s = ks.at(-1), u = birim(fark(s.zA, s.aA)), m = Math.acos(Math.max(-1, Math.min(1, nokta(u, s.g)))) * 180 / Math.PI; return { gecti: m <= 15, olcum: `${m.toFixed(1)}°` }; } },
          { ad: 'dizler parmak yönünde (içe düşmüyor)', f: ks => { const m = Math.min(...ks.map(s => s.zA[2] - s.kaA[2])); return { gecti: m >= -0.5, olcum: `diz kalçadan ${m.toFixed(1)} dışta` }; } },
          { ad: 'ağırlık merkezi ayak tabanının üstünde', f: ks => {
              const agm = s => { const orta = (a, b) => a.map((v, i) => (v + b[i]) / 2);
                const parca = [[orta(s.P, s.boyun), 0.5], [s.kafa, 0.08], [orta(s.kaA, s.zA), 0.1], [orta(s.kaB, s.zB), 0.1], [orta(s.zA, s.aA), 0.045], [orta(s.zB, s.aB), 0.045], [orta(s.omA, s.eA), 0.05], [orta(s.omB, s.eB), 0.05]];
                return parca.reduce((a, [p, m]) => a + p[0] * m, 0) / parca.reduce((a, [, m]) => a + m, 0); };
              const x = ks.map(agm), a = Math.min(...x), b = Math.max(...x);
              return { gecti: a >= 2 - 6 && b <= 2 + 9, olcum: `x ${a.toFixed(1)} … ${b.toFixed(1)} (topuk −4 · parmak 11)` }; } },
        ] },
    };
  })(),

};

function aciOf(a, o, b) {
  const u = fark(a, o), v = fark(b, o);
  return Math.acos(Math.max(-1, Math.min(1, nokta(u, v) / (Math.hypot(...u) * Math.hypot(...v))))) * 180 / Math.PI;
}

/**
 * Uygulamadaki bir egzersiz ya da ısınma kaydının 3B hareketi. Isınmanın hazırlık setleri
 * (`ref`) asıl hareketin kendisini gösterir. ⚠️ Tek eşleme burası: uygulama ve fizik denetimi
 * AYNI fonksiyonu çağırır — kapsam kapısı ürünün kendi kararını sınar, bir kopyasını değil.
 */
export const hareketBul = ex => KUTUPHANE[ex?.ref ?? ex?.id] ?? null;
