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

const { rd, yon, ekle, fark, nokta, birim, ara, mesafe, R, L, AYAK_Y, TOP_Y, KALCA_YAN, OMUZ } = M;
/* ── B1 (7 Eki 2026): ölçüler C mankeninden (olcu.js). Eski veri elle yazılmış sayılardı (üst kol 31, ön kol 29,
 * uyluk 39, baldır 37, omuz 14, bilek 3,6 …). Aşağıdaki türetilmiş değerler o sayıların yerini alır. ── */
const ERISIM = L.ua + L.fa;                                    // omuz → kavrama (kol tam uzanık)
const AYAKTA_Y = AYAK_Y + (L.th + L.sh) * 0.995;               // ayakta kalça merkezi (dizler kilitli değil)
const OTURAK = Math.round(AYAK_Y + L.sh - R.kalca);            // standart oturak üstü: kaval dik, uyluk yatay
const OTURUR_Y = OTURAK + R.kalca;
/** Omzun altında, omuzdan TAM üst kol boyunda dirsek ofseti (dx öne, dz dışa) — sabit üst kollu hareketler */
const dirsekAlti = (dx, dz) => [dx, -Math.sqrt(L.ua ** 2 - dx * dx - dz * dz), dz];
/** TUTAMAK (B1, D3): elin tuttuğu şeyin ekseni (dünya), yarıçapı (cm) ve avucun anatomik yönü.
 *  avuc: 'ic' (avuçlar karşılıklı/içe) · 'ayak' (bench: avuç ayaklara) · 'ileri' · 'onKolOn' (supinasyon) · 'onKolArka' (pronasyon).
 *  Çizici artık tutamağı ARAMAZ (eskiden en yakın kapsülü tahmin ediyordu); fizik denetimi çizilen aletle eşleşmeyi ölçer. */
const tut = (eksen, r, avuc = 'ic') => ({ tutamak: { eksen: birim(eksen), r, avuc } });
const kemer = (a, b) => Math.asin(Math.max(-1, Math.min(1, a / b))) * 180 / Math.PI;   // derece
const ease = t => t * t * (3 - 2 * t);
const AYAK_BOY_ = M.AYAK_BOY;
/** bilek → parmak kökü vektörü [x, y], taban eğimi pt° (manken3d.iskelet ile AYNI) */
const ayakVek = pt => { const a = rd(pt), c = AYAK_Y - TOP_Y; return [AYAK_BOY_ * Math.cos(a) + c * Math.cos(a - Math.PI / 2), AYAK_BOY_ * Math.sin(a) + c * Math.sin(a - Math.PI / 2)]; };
const Z = [0, 0, 1];

/* ── Ortak parçalar ─────────────────────────────────────────────────────── */
const SEHPA = { ust: '#3a4149', yan: '#272c33' }, PED = { ust: '#3a4149', yan: '#2c323a' }, PED_RENK = PED, METAL = '#5d646d';
const sehpa = (pr, ust = M.BENCH_UST) => M.sehpaCiz(pr, [-80, 18], ust, 28);   // 8 Eki: bacaklı sehpa (eskiden tek kutu)
/**
 * KABLO KULESİ (8 Eki, Sabri: "aletler gerçek şekillere kabaca benzesin — halatın geliş yeri, bağlantı yükseklikleri"):
 * gerçek bir kablo istasyonu — taban, iki dikme, üst kiriş, kılavuz çubukları arasında plaka yığını, makaraya uzanan
 * kol ve kablonun kuleye dönüş yolu. Kullanıcı −x yanında durur, kule `on` (ön yüz x) ile `on + 46` arasında.
 * `makara` verinin makarasıdır (kablo oradan tutamağa iner); kule ona kendi kolu ya da kızağıyla bağlanır.
 */
const KULE = { govde: { ust: '#4a525c', yan: '#363c44' }, plaka: { ust: '#565e68', yan: '#2c3138' }, boru: '#7a828c' };   // 8 Eki: bir kademe açık (koyu zeminde görünsün)
/** `yon` +1: kule kullanıcının önünde (+x), −1: arkasında (−x) — kule `on`dan yon yönünde 46 cm derinliğe uzanır */
const kabloKulesi = (pr, on, makara, yon = 1, kalk = 0) => {
  // 8 Eki (Sabri: "öndeki sütunlar ağırlıklardan çok uzak, yaklaştır; kule biraz daha küçük olsun"): KOMPAKT kule —
  // derinlik 46 → 32, dikmeler yığının hemen yanında (eni ±30 → ±21). Kollar ve eller kuleye daha az yaklaşır.
  const X = x => on + yon * x, aralik = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
  const kutu = (xa, xb, y, z, ton) => M.kutu(pr, aralik(xa, xb), y, z, ton);
  const D = 32, Y = 214, mx = X(16), my = Y - 6;
  const o = [
    ...kutu(-3, D + 3, [0, 3], [-23, 23], KULE.govde),                                          // taban
    ...[-21, 16].flatMap(z => [...kutu(0, 5, [3, Y], [z, z + 5], KULE.govde), ...kutu(D - 5, D, [3, Y], [z, z + 5], KULE.govde)]),   // dikmeler (yığına bitişik)
    ...kutu(0, D, [Y, Y + 5], [-21, 21], KULE.govde),                                           // üst kiriş
    ...[-7, 7].map(z => M.kapsul(pr, [mx, 3, z], [mx, Y, z], 0.9, KULE.boru)),                   // yığın kılavuzları
  ];
  // 8 Eki (Sabri: "ağırlıklar hiç hareket etmiyor"): üstteki 6 plaka seçici çubukla birlikte halatın çekildiği kadar kalkar
  for (let i = 0; i < 12; i++) { const k = i >= 6 ? kalk : 0; o.push(...kutu(6, 26, [4 + i * 5 + k, 8.4 + i * 5 + k], [-14, 14], KULE.plaka)); }
  const ust = 64 + kalk;
  o.push(M.kapsul(pr, [mx, 30 + kalk, 0], [mx, ust, 0], 0.9, KULE.boru), ...M.makara(pr, [mx, my, 0]));        // seçici çubuk + üst makara
  if (!makara) return o;                                                                         // makarasız (seçmeli makine gövdesi)
  if (makara[1] > Y - 40) {                                                                     // YÜKSEK makara: kirişten kol
    o.push(...M.kutu(pr, [Math.min(makara[0], X(2)) - 4, Math.max(makara[0], X(2)) + 4], [makara[1] + 4, makara[1] + 9], [-3, 3], KULE.govde),
      M.kapsul(pr, [X(2), makara[1] + 6, 0], [X(2), Y, 0], 2.5, KULE.boru),
      M.kablo(pr, [makara[0], makara[1] + 4.5, 0], [mx, my + 4.5, 0]));
  } else {                                                                                      // ALÇAK/ORTA makara: ön dikmede kızak
    const kx = X(-2);
    o.push(...M.kutu(pr, [Math.min(makara[0], kx) - 3, Math.max(makara[0], kx) + 3], [makara[1] - 5, makara[1] + 5], [-4, 4], KULE.govde),
      ...kutu(-1, 2, [3, Y], [-2, 2], KULE.govde),
      M.kablo(pr, [kx, makara[1], 0], [kx, Y - 2, 0]), M.kablo(pr, [kx, Y - 2, 0], [mx, my + 4.5, 0]));
  }
  o.push(M.kablo(pr, [mx, my - 4.5, 0], [mx, ust, 0]));
  return o;
};
/** Yığının kalkışı: halatın makaradan tutamağa uzunluğu, hareket boyunca en kısa olduğu andan ne kadar uzunsa (cm).
 *  En kısa an = ağırlık yerde. Hareket başına bir kez örneklenir ve hareketin üstünde saklanır. */
const yiginKalkisi = (h, makara, uc, s) => {
  if (h.__ipEnKisa == null) { let mn = Infinity; for (let i = 0; i <= 24; i++) mn = Math.min(mn, M.mesafe(makara, uc(M.an(h, i / 24)))); h.__ipEnKisa = mn; }
  return Math.max(0, M.mesafe(makara, uc(s)) - h.__ipEnKisa);
};
const oturak = (pr, ust, x = [-16, 14]) => M.sehpaCiz(pr, [x[0] - 4, x[1] + 4], ust, 30);   // 8 Eki: bacaklı oturak (eskiden tek dikmeli kutu)
/** Gövdenin arkasındaki yönlü minder: gövde yönü g boyunca, gövdenin ARKASINDA */
const sirtMinderi = (pr, s, n, boy = 70, ofset = 30, destekY = null) => {
  const merkez = ekle(ekle(s.P, s.g, ofset), n, -(M.SIRT + 3)), o = M.kutuY(pr, merkez, [Z, s.g, n], [30, boy, 6], PED);
  // ⚠️ Minder havada duruyordu (27 Eyl denetimi): arkasından oturak tabanına inen destek borusu
  if (destekY != null) { const arka = ekle(merkez, n, -4); o.push(M.kapsul(pr, arka, [arka[0], destekY, 0], 2.2, METAL)); }
  return o;
};
/** Temas: gövde yüzeyi ile minderin ön yüzü arasındaki boşluk (0 = değiyor) */
const sirtTemas = n => s => nokta(fark(s.gogusAlt, ekle(ekle(s.P, s.g, 30), n, -(M.SIRT + 3) + 3)), n) - M.SIRT;   // C'nin sırt derinliği (8 Eki)

/** Oturur: kalça oturakta, uyluklar öne, kaval DİK, ayak tabanları yerde (FK). Uyluk eğimi kalça yüksekliğinden
 *  ÇÖZÜLÜR (bilek AYAK_Y'de kalsın) — eskiden sabit −5° idi, oturak yüksekliği değişince ayak yere gömülüyordu. */
const OTURUR = (P, g, yan = [-90, 0], acik = 8) => { const th = -kemer(P[1] - AYAK_Y - L.sh * Math.sin(rd(88)), L.th);
  return { P, g, yan, ayak: 0,
    thA: [-acik, th], shA: [-acik, -88], thB: [acik, th], shB: [acik, -88],
    uaA: [-90, -85], faA: [-90, -85], uaB: [90, -85], faB: [90, -85] }; };
/** Ayakta: bacaklar IK ile ayak bileği hedeflerine; kollar yanda sarkık (FK) */
const AYAKTA = (P, g = [0, 90]) => ({ P, g, yan: [-90, 0], ayak: 0,
  uaA: [-90, -81], faA: [-90, -84], uaB: [90, -81], faB: [90, -84] });   // B1: C'nin gövdesi geniş — kollar 9° açık sarkar
const ayakBilekleri = (x, zYari = KALCA_YAN, kutup = [1, 0, 0]) => ({
  ayakA: { hedef: [x, AYAK_Y, zYari], kutup: [kutup[0], kutup[1], 0.12] },
  ayakB: { hedef: [x, AYAK_Y, -zYari], kutup: [kutup[0], kutup[1], -0.12] } });
/** Sırtüstü (bench): baş −x, A = −z. Sehpa 43 cm (IPF: 42–45); uyluk eğimi bilek yerde kalacak biçimde çözülür */
const BENCH_UST = M.BENCH_UST;
const SIRTUSTU = (() => { const P = [8, BENCH_UST + M.SIRT, 0], th = -kemer(P[1] - AYAK_Y - L.sh * Math.sin(rd(85)), L.th);
  return { P, g: [180, 0], yan: [90, 0], yuz: [0, 90], ayak: 0, bas: M.basYaslanmaEgimi(P[1], BENCH_UST),   // yüz YUKARI, başın arkası sehpada
    thA: [25, th], shA: [25, -85], thB: [-25, th], shB: [-25, -85] }; })();
const sehpaTemaslari = [
  { ad: 'sırt sehpada', f: s => (s.gogusAlt[1] - M.SIRT) - BENCH_UST, aralik: [-2, 2] },
  { ad: 'baş sehpada', f: s => (s.kafa[1] - M.KAFA_R) - BENCH_UST, aralik: [-2, 3] }];
const kalcaOturakta = ust => ({ ad: 'kalça oturakta', f: s => (s.P[1] - R.kalca) - ust, aralik: [-1.5, 1.5] });
/** Sabit bir dirsek E etrafında, eğik düzlemde dönen el: kolun "sabit üst kol" hareketleri */
const dirsekEtrafinda = (E, onKol, aci, egim, isaret) =>
  [E[0] + onKol * Math.sin(aci) * Math.cos(egim), E[1] - onKol * Math.cos(aci) * Math.cos(egim), E[2] + isaret * onKol * Math.sin(egim)];
/** Kapalı tutuş tutamacı (double-D, MAG 127 mm): iki PARALEL kulp (eksen `ek`, ±6,5) + tepeye D halkaları */
const paralelKulp = (pr, eller, ek, tepe) => eller.flatMap(e => { const a = ekle(e, ek, -6.5), b = ekle(e, ek, 6.5);
  return [M.kapsul(pr, a, b, 1.6, '#8a929c'), M.kapsul(pr, a, ekle(tepe, ek, -2), 0.9, '#8a929c'), M.kapsul(pr, b, ekle(tepe, ek, 2), 0.9, '#8a929c')]; });
const bitisik = (h, ad, kisit = {}) => ({ ...h, ad, kisit: { ...h.kisit, ...kisit } });

/* ══════════════════════════════════════════════════════════════════════════ */
export const KUTUPHANE = {

  /* ─── 1. GÜN ─────────────────────────────────────────────────────────── */

  bb_bench_press: bitisik(M.HAREKETLER.bench, 'Barbell Bench Press', { dizYonu: [0.7, 0.7, 0],
    // Gerçek bench press kollar DÜZ başlar (bar yukarıda) ve oraya döner — duran görüntü de bu (27 Eyl)
    ozel: [{ ad: 'başlangıçta kollar düz, bar en yüksekte', f: ks => { const y = ks.map(s => (s.eA[1] + s.eB[1]) / 2), en = Math.max(...y);
      return { gecti: y[0] >= en - 0.5, olcum: `başta ${y[0].toFixed(1)} · en yüksek ${en.toFixed(1)}` }; } }] }),

  db_bench_fly: {
    ad: 'Dumbbell Bench Fly', kamera: [40, 32], seritKameralar: [[0, 0], [90, 24], [40, 32]], merkez: [-20, 0, 0],
    a: SIRTUSTU,
    // El, omzun üstünde sabit yarıçaplı yay çizer (yatay abdüksiyon); dirsek hafif bükük ve SABİT
    // 8 Eki (Sabri: "fly'da kol aşağı inince kırılıyor"): kırık görünen BİLEKti — kol düz ve yatay kalınca dambılı tutan el
    // bilekten ~70° yukarı bükülüyordu. Gerçekte altta dirsek ~25° bükük ve dambılın ALTINDA, ön kol dambıla doğru
    // yükselir, bilek düz kalır → kutup dirseği aşağı (yere) verir; altta 80°.
    uclar: t => { const th = rd(ara(-4, 80, ease(t))), RF = ERISIM * 0.9675; return s => ({
      A: { hedef: [s.omA[0] + 6, s.omA[1] + RF * Math.cos(th), s.omA[2] - RF * Math.sin(th)], kutup: [0.3, -1, -0.5], ...tut([1, 0, 0], 1.6, 'kolaGore') },
      B: { hedef: [s.omB[0] + 6, s.omB[1] + RF * Math.cos(th), s.omB[2] + RF * Math.sin(th)], kutup: [0.3, -1, 0.5], ...tut([1, 0, 0], 1.6, 'kolaGore') } }); },   /* avuç kolun açısıyla içe → tavana, hareket boyunca kesintisiz */
    ekipman: (pr, s) => [...sehpa(pr), ...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
    cisimler: s => [M.dambilCismi(s.eA, [1, 0, 0]), M.dambilCismi(s.eB, [1, 0, 0])],
    izlenen: 'eB',
    kisit: { ayaklar: 'yerde', dizYonu: [0.7, 0.7, 0], dirsek: { aralik: [10, 35], sabit: true }, temas: sehpaTemaslari },
  },

  machine_incline_press: (() => {
    // Sırt yere 40° (üst göğüs için 30–45°, Rodríguez-Ridao 2020). Kaldıraçlı makinede tutamak
    // bir PİVOT etrafında YAY çizer: yukarı-ileri, sonda alın hizasının üstüne (ExRx videosu).
    const g = [180, 40], gd = yon(...g), n = yon(0, 50), P = [0, 44, 0], RL = 100;
    const S0 = ekle(ekle(P, gd, L.torso - OMUZ.asagi - 12), n, R.gogus + 7);   // tutamak üst göğsün hemen önünde (omzun 12 cm altı; dirsek ≤ 140°)
    const PIVOT = ekle(S0, gd, RL);                                // pivot başın üst-arkasında
    const yol = t => { const f = 0.38 * ease(t); return ekle(ekle(PIVOT, gd, -RL * Math.cos(f)), n, RL * Math.sin(f)); };
    return {
      ad: 'Incline Chest Press Machine', kamera: [35, 16], seritKameralar: [[0, 0], [35, 16], [110, 22]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], OMUZ.yan + 8], kutup: [0, -0.6, 1], ...tut(Z, 2.4, 'ayak') }, B: { hedef: [c[0], c[1], -(OMUZ.yan + 8)], kutup: [0, -0.6, -1], ...tut(Z, 2.4, 'ayak') } }); },
      ekipman(pr, s, t) {
        const c = yol(t), o = [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 74, 32, 30)];
        for (const zz of [1, -1]) {
          o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], 34 * zz], [c[0], c[1], 34 * zz], 2.4, METAL));   // kaldıraç kolu (sabit boy)
          o.push(M.kapsul(pr, [c[0], c[1], 20 * zz], [c[0], c[1], 34 * zz], 2.4, '#8a929c'));        // tutamak (pronasyon, geniş)
          // ⚠️ Pivot ve kollar havada asılıydı (27 Eyl denetimi): pivotu taşıyan dikme + yere oturan şase
          o.push(...M.kutu(pr, [PIVOT[0] - 3.5, PIVOT[0] + 3.5], [0, PIVOT[1] + 4], [39 * zz - 3.5, 39 * zz + 3.5], KULE.govde),
                 ...M.kutu(pr, [PIVOT[0] - 4, 18], [0, 5], [39 * zz - 4, 39 * zz + 4], KULE.govde));
          // 8 Eki: plaka yüklemeli kaldıraç — kolun pivota yakın üçte birinde plaka boynuzu + plaka (dışa doğru)
          const hb = ekle([PIVOT[0], PIVOT[1], 0], fark([c[0], c[1], 0], [PIVOT[0], PIVOT[1], 0]), 0.35);
          o.push(M.kapsul(pr, [hb[0], hb[1], 34 * zz], [hb[0], hb[1], 52 * zz], 2, METAL),
                 M.silindirParca(pr, [hb[0], hb[1], 44 * zz], Z, 20, 3.5, '#2f343a'));
        }
        o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], -40], [PIVOT[0], PIVOT[1], 40], 3, METAL),          // pivot mili
               M.kapsul(pr, [0, 2.5, -39], [0, 2.5, 39], 2.5, METAL));                                // şase: oturak altı travers
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
        A: { hedef: ekle(s.omA, [ara(4, 2, k), ara(27, 58.3, k), ara(29, 8, k)]), kutup: [0.1, -1, 0.7], ...tut(Z, 1.6, 'ileri') },
        B: { hedef: ekle(s.omB, [ara(4, 2, k), ara(27, 58.3, k), -ara(29, 8, k)]), kutup: [0.1, -1, -0.7], ...tut(Z, 1.6, 'ileri') } }); },
      ekipman: (pr, s) => [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 62, 34, 30), ...M.dambil(pr, s.eA, Z), ...M.dambil(pr, s.eB, Z)],
      cisimler: s => [M.dambilCismi(s.eA, Z), M.dambilCismi(s.eB, Z)],
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(36), { ad: 'sırt pedde', f: sirtTemas(n), aralik: [-1.5, 1.5] }] },
    };
  })(),

  cable_front_raise: (() => {
    // Sabri'nin salondaki varyantı (24 Eyl): tek ALÇAK makaraya sırt dönük, kablo İKİ BACAĞIN
    // ARASINDAN geçer, ucundaki bar İKİ ELLE tutulup öne-yukarı kaldırılır. (ExRx'in iki elli
    // sürümünde kablolar iki makaradan gövdenin yanlarından gelir; bu tek makaralı salon varyantı.)
    const MAKARA = [-40, 6, 0], KOL = ERISIM * 0.997, YARI = OMUZ.yan + 2, gam = Math.asin((YARI - OMUZ.yan) / KOL);   // bar omuz genişliğinde tutulur
    const el = (om, t, i) => { const f = rd(ara(22, 90, ease(t)));   // başta bar uylukların önünde, sonda omuz hizası
      return ekle(om, [KOL * Math.sin(f) * Math.cos(gam), -KOL * Math.cos(f) * Math.cos(gam), i * KOL * Math.sin(gam)]); };
    const bar = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    return {
      ad: 'Cable Front Raise', kamera: [40, 14], seritKameralar: [[0, 0], [40, 14], [130, 10]], merkez: [-8, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s.omA, t, 1), kutup: [-0.2, -1, 0.5], ...tut(Z, 1.8, 'onKolArka') }, B: { hedef: el(s.omB, t, -1), kutup: [-0.2, -1, -0.5], ...tut(Z, 1.8, 'onKolArka') }, ...ayakBilekleri(2, KALCA_YAN + 7) }),
      ekipman(pr, s) {
        const m = bar(s);
        return [...kabloKulesi(pr, MAKARA[0] - 6, MAKARA, -1, yiginKalkisi(this, MAKARA, bar, s)), ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, m),   // kule arkada, alçak makara kızakta
          M.kapsul(pr, [m[0], m[1], -22], [m[0], m[1], 22], 1.8, '#8a929c')];            // düz bar, pronasyon
      },
      cisimler: s => { const m = bar(s); return [[MAKARA, m, 0.7], [[m[0], m[1], -22], [m[0], m[1], 22], 1.8]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [3, 20], sabit: true },
        govde: { aralik: [87, 93], oynama: 1 } },
    };
  })(),

  machine_reverse_fly: {
    ...bitisik(M.HAREKETLER.reverseFly, 'Reverse Pec Fly', { dizYonu: [1, 0.5, 0] }),
    // 8 Eki: seçmeli makine — ağırlık kulesi önde
    // kule ÖNDE (Sabri 8 Eki: "gerçekte kule ön tarafta"), tutamakların erişiminin (x ≤ 67) ötesinde, kompakt; makine
    // kolonundan kuleye üst kiriş
    ekipman(pr, s, t) { this.__e0 ??= M.an(this, 0).eA;                    // halatsız: kalkış tutamağın yolunun yarısı
      return [...kabloKulesi(pr, 76, null, 1, 0.5 * M.mesafe(s.eA, this.__e0)), ...M.kutu(pr, [32, 76], [M.FLY_UST - 2, M.FLY_UST + 3], [-3, 3], KULE.govde),
      ...M.HAREKETLER.reverseFly.ekipman.call(this, pr, s, t)]; },
  },

  cable_vbar_pushdown: (() => {
    // V-bar 330 mm, kollar tepeden ~35° aşağı-dışa (salon aletleri araştırması, 6 Eki): eller V'nin KOLLARINDA ±11
    const V_UC = 4;                                                  // V kolunun elin dışına uzanan ucu (cm; 6 iken altta uyluğa değiyordu)
    const DZ = OMUZ.yan + 3.5, EZ = 11, MAKARA = [40, 185 + (AYAKTA_Y - 77), 0], bet = Math.asin((DZ - EZ) / L.fa);   // ön kollar içe eğik
    const E = s => { const o = dirsekAlti(5, DZ - OMUZ.yan); return [s.omA[0] + o[0], s.omA[1] + o[1], DZ]; };   // dirsekler gövdenin YANINDA ve SABİT (8 Eki: 3 → 5 öne, altta V uyluğa değiyordu)
    const el = (s, t, i) => { const e = E(s); return dirsekEtrafinda([e[0], e[1], i * DZ], L.fa, rd(ara(100, 12, ease(t))), bet, -i); };
    const vTepe = (s, t) => { const a = el(s, t, 1), b = el(s, t, -1); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 7, (a[2] + b[2]) / 2]; };
    return {
      ad: 'V-Bar Push Down', kamera: [38, 12], seritKameralar: [[0, 0], [38, 12], [100, 8]], merkez: [10, 0, 0],
      a: AYAKTA([0, AYAKTA_Y - 1, 0], [0, 82]),
      uclar: t => s => ({
        A: { hedef: el(s, t, 1), kutup: fark([E(s)[0], E(s)[1], DZ], s.omA), ...tut(fark(el(s, t, 1), vTepe(s, t)), 1.6) },
        B: { hedef: el(s, t, -1), kutup: fark([E(s)[0], E(s)[1], -DZ], s.omB), ...tut(fark(el(s, t, -1), vTepe(s, t)), 1.6) }, ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman(pr, s) {
        const m = s.eA.map((v, i) => (v + s.eB[i]) / 2), tepe = ekle(m, [0, 7, 0]);
        return [...kabloKulesi(pr, MAKARA[0] + 14, MAKARA, 1, yiginKalkisi(this, MAKARA, q => ekle(q.eA.map((v, i) => (v + q.eB[i]) / 2), [0, 7, 0]), s)),                  // 8 Eki: kule karşıda, makara kirişten uzanan kolda
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          ...[s.eA, s.eB].map(e => M.kapsul(pr, tepe, ekle(e, birim(fark(e, tepe)), V_UC), 1.6, '#8a929c'))];   // V'nin kolu elin V_UC cm DIŞINA uzanır
      },
      // 8 Eki: V'nin kolları da cisim (Sabri: "bar bacaklarının içine giriyor" — altta kol ucu uyluğa giriyordu, denetim kolları görmüyordu)
      cisimler: s => { const m = s.eA.map((v, i) => (v + s.eB[i]) / 2), tepe = ekle(m, [0, 7, 0]);
        return [[MAKARA, tepe, 0.7], ...[s.eA, s.eB].map(e => [tepe, ekle(e, birim(fark(e, tepe)), V_UC), 1.6])]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [80, 84], oynama: 1 } },
    };
  })(),

  db_overhead_ext: (() => {
    // 8 Eki (Sabri: "one arm dambılın kolu eklemlerden doğru çalışmıyor"): ön kol 120°'de neredeyse yatay kalıyor, el
    // omzun 32 cm arkasına uzanıyordu (kol geriye kırılmış gibi). Gerçekte ön kol başın ARKASINDAN aşağı sarkar,
    // dambıl ensenin arkasına iner: dirsek bükümü ~116°, el ensenin arkasında (omzun 28 cm arkası, 8 cm üstü); 125°+ ön kolu sırta gömüyordu.
    // Ön kol, ÜST KOLUN EKSENİYLE aynı düzlemde döner (8 Eki, Sabri: "kol olduğu yerde dönüyor"): yol dikey eksene göre
    // kuruluyordu, üst kol ise 9° eğik — hareket başında bükülme yönünü eğim belirliyor, ön kol indikçe V'ye dönüyordu;
    // üst kol yerinde ~60° burkuluyordu. Artık eksen = omuz → dirsek, V ona dik bileşen → bükülme düzlemi sabit.
    const V0 = birim([-0.9, 0, -0.45]);
    const E = s => ekle(s.omA, [1, L.ua - 0.5, -4]);               // üst kol kulağın yanında dik ve SABİT, dirsek hafif önde
    const el = (s, t) => {
      const U = birim(fark(E(s), s.omA)), V = birim(fark(V0, ekle([0, 0, 0], U, nokta(V0, U))));
      const a = rd(ara(6, 118, ease(t))); return ekle(E(s), ekle(M.ekle([0, 0, 0], U, Math.cos(a)), V, Math.sin(a)), L.fa); };
    return {
      ad: 'One Arm Overhead Dumbbell Ext.', kamera: [-30, 14], seritKameralar: [[0, 0], [-30, 14], [-120, 12]], merkez: [0, 0, 0],
      a: OTURUR([0, 44, 0], [180, 88]),
      uclar: t => s => ({
        A: { hedef: el(s, t), kutup: fark(E(s), s.omA), ...tut(Z, 1.6, 'onKolOn') },
        B: { hedef: ekle(s.P, [L.th * 0.72, R.th + 2, -(KALCA_YAN + 1)]), kutup: [-0.3, 0, -1] } }),   // el dizin üstünde; ön kol uyluğun üstünde uzanır   // boştaki el uyluğun üstünde (dirseği desteklemek başın önünden geçirir)
      ekipman: (pr, s) => [...oturak(pr, 36), ...M.dambil(pr, s.eA, Z)],          // sap yatay (sağ-sol), avuç öne
      cisimler: s => [M.dambilCismi(s.eA, Z)],
      izlenen: 'eA',
      kisit: { tekTaraf: true, dirsekYerinde: ['A'], ayaklar: 'yerde', dizYonu: [1, 0.3, 0], temas: [kalcaOturakta(36)] },
    };
  })(),

  plank: (() => {
    // Omuz–kalça–bilek TEK ÇİZGİDE; dirsekler omzun tam altında, ön kollar yerde öne dönük, parmak uçlarında
    // B1: omuz yüksekliği = ön kol yarıçapı + üst kol; kalça→omuz = gövde − omuz düşüklüğü; bacak = uyluk + baldır.
    // Bilek yüksekliği parmak kökü (u) yerde kalacak biçimde ÇÖZÜLÜR (ayak eğimi bacak eğimine bağlı → yineleme).
    const OMUZ_Y = R.fa + L.ua + OMUZ.on, GV = L.torso - OMUZ.asagi, BCK = L.th + L.sh;
    const bilekY = ab => { const pt = rd(-90 + ab);                                          // u = a + taban·AYAK_BOY + dik·(AYAK_Y − TOP_Y)
      return TOP_Y - (AYAK_BOY_ * Math.sin(pt) + (AYAK_Y - TOP_Y) * Math.sin(pt - Math.PI / 2)); };
    // tek çizgi: omuz yüksekliği − (gövde + bacak)·sin(al) = bilek yüksekliği(al) → al yinelemeyle
    const al = (() => { let a = 10; for (let i = 0; i < 40; i++) a = kemer(OMUZ_Y - bilekY(a), GV + BCK); return a; })();
    const P = [0, OMUZ_Y - GV * Math.sin(rd(al)), 0];
    /* VARYANTLAR — izometrik harekette öğretici olan doğru ile yanlış arasındaki fark (uygulamadaki
       doğru / kalça çökük / kalça yüksek). Pozlar kısıtlardan ÇÖZÜLÜR, uydurulmaz: omuz yüksekliği
       (ön kollar yerde) ve bilek yüksekliği (parmak uçları yerde) SABİT, dirsek omzun altında kalır;
       serbest değişken kalçanın yüksekliği. Gövde eğimi sin(ag) = (35,6 − Py)/55, bacak eğimi
       sin(ab) = (Py − 12,4)/76. Ayak ucu bu yüzden ileri-geri kayar (2B çözümüyle aynı). */
    const BILEK_Y = bilekY(al);
    const OMUZ_X = GV * Math.cos(rd(al));
    const plankPoz = Py => {
      const ag = kemer(OMUZ_Y - Py, GV), ab = kemer(Py - BILEK_Y, BCK);
      return { P: [OMUZ_X - GV * Math.cos(rd(ag)), Py, 0], g: [0, ag], yan: [-90, 0], ayak: [0, -90 + ab],
        thA: [180, -ab], shA: [180, -ab], thB: [180, -ab], shB: [180, -ab],
        uaA: [0, -90], faA: [0, 0], uaB: [0, -90], faB: [0, 0] };
    };
    return {
      ad: 'Plank', kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [10, 0, 0], statik: true,
      // Sıra uygulamadaki metinlerle AYNI (exercises.js → plank.variants): doğru · çökük · yüksek
      varyantlar: [plankPoz(P[1]), plankPoz(P[1] - 10), plankPoz(P[1] + 14)],
      a: plankPoz(P[1]),
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
    const g = [180, 70], gd = yon(...g), n = yon(0, 20), P = [0, 41, 0], MAKARA = [12, 205 + 6, 0];   // gövde 20° geride (ACE ≤30°)
    const alt = ekle(ekle(P, gd, L.torso - OMUZ.asagi - 11), n, R.gogus + 5);   // göğsün üst kısmı (omzun 11 cm altı; dirsek ≤ 140°)
    const PED = Math.round((P[1] + AYAK_Y + L.sh * Math.sin(rd(88))) / 2 + R.th);     // uyluk pedi alt yüzü = uyluk ortasının üstü
    const d = birim(fark(MAKARA, alt)), ust = ekle(alt, d, ERISIM * 0.9);   // tepede kollar neredeyse uzanık    // tutamak KABLO doğrultusunda iner
    const yol = t => ekle(ust, fark(alt, ust), ease(t));
    const KULP = birim([d[1], -d[0], 0]);                           // kulp ekseni: kabloya ve yanala dik (kapalı tutuş, paralel kulplar)
    return {
      ad: 'Close Grip Pull Down', kamera: [30, 10], seritKameralar: [[0, 0], [30, 10], [150, 14]], merkez: [8, 0, 0],
      a: OTURUR(P, g, [-90, 0], 6),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], 7], kutup: [0.5, -1, 0.35], ...tut(KULP, 1.6) }, B: { hedef: [c[0], c[1], -7], kutup: [0.5, -1, -0.35], ...tut(KULP, 1.6) } }); },   // dirsekler önden-yandan iner
      ekipman(pr, s, t) {
        const c = yol(t), tepe = ekle(c, d, 6);
        return [...oturak(pr, 33, [-14, 12]), ...M.kutu(pr, [14, 26], [PED, PED + 6], [-16, 16], PED_RENK),
          ...kabloKulesi(pr, 72, MAKARA, 1, yiginKalkisi(this, MAKARA, q => ekle(yol(q.t), d, 6), s)),                                                             // kule karşıda (8 Eki: 44 → 72, ayak ucu x ≤ 65 kuleye giriyordu), makara tepede
          ...M.kutu(pr, [26, 72], [PED + 1, PED + 5], [-4, 4], KULE.govde), ...M.kutu(pr, [12, 72], [0, 4], [-6, 6], KULE.govde),   // ped kolu + oturak rayı kuleye bağlı
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          ...paralelKulp(pr, [[c[0], c[1], 7], [c[0], c[1], -7]], KULP, tepe)];
      },
      cisimler: s => [[MAKARA, ekle(yol(s.t), d, 6), 0.7]],
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0], govde: { aralik: [68, 72], oynama: 1 },
        temas: [kalcaOturakta(33), { ad: 'uyluk pedin altında', f: s => PED - ((s.kaA[1] + s.zA[1]) / 2 + R.th), aralik: [-1.5, 1.5] }] },
    };
  })(),

  db_two_arm_row: {
    ad: 'Two Arm Dumbbell Row', kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [150, 20]], merkez: [15, 0, 0],
    a: AYAKTA([0, AYAKTA_Y - 5, 0], [0, 20]),                               // gövde yere ~20° (NSCA; ExRx: yataya yakın)
    // Dambıl SARKAR: ön kol her karede dikey. El yüksekliği dy seçilir, dirsek elin 29 üstünde
    // olacak biçimde geriye kayma dx çözülür: dx² + (29 − dy)² + dz² = 31²
    uclar: t => { const k = ease(t), dz = 12 /* 8 Eki: çekişte dambıl başı (Ø14) uyluğun yanından geçer — 7 iken uyluğa giriyordu */, dy = ara(ERISIM - 1.4, L.fa - L.ua * Math.sin(rd(16)), k) /* tepede dirsek omzun ~16° üstünde */, dx = Math.sqrt(Math.max(0, L.ua ** 2 - (L.fa - dy) ** 2 - dz * dz));
      return s => {
        const hA = ekle(s.omA, [-dx, -dy, dz]), hB = ekle(s.omB, [-dx, -dy, -dz]);
        return { A: { hedef: hA, kutup: fark(ekle(hA, [0, L.fa, 0]), s.omA), ...tut([1, 0, 0], 1.6) }, B: { hedef: hB, kutup: fark(ekle(hB, [0, L.fa, 0]), s.omB), ...tut([1, 0, 0], 1.6) },
          ...ayakBilekleri(12, KALCA_YAN + 0.5) }; }; },
    ekipman: (pr, s) => [...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
    cisimler: s => [M.dambilCismi(s.eA, [1, 0, 0]), M.dambilCismi(s.eB, [1, 0, 0])],
    izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], onKolDikey: 20, govde: { aralik: [15, 25], oynama: 1 } },
  },

  cable_seated_row: (() => {
    // Sabri (27 Eyl): "halat tam karşıdan bir yerden çıkmalı". Makara 40 cm'deydi, tutamak 70'te: kablo
    // ellerden ayak tablasına doğru EĞİK iniyordu. Makara artık tutamak yüksekliğinde, tam karşıda bir
    // kolonun üstünde → çekiş yere paralel, kablo yatay.
    // B1: bacak 16 cm uzadı → ayak bileği 80'e, ayak tabanı tablaya (taban, bilekten AYAK_Y ileride). Tabla ve kolon birlikte.
    const BILEK_X = 80, AYAK_PT = 82, TABLA = Math.round(BILEK_X + AYAK_Y * Math.cos(rd(AYAK_PT - 90)) + 0.4);
    const MAKARA = [TABLA + 18, 70, 0], KOLON_X = TABLA + 26;
    const yol = t => [ara(60, 28, ease(t)), 70, 0];                // tutamak yere PARALEL gelir, karnın önüne
    return {
      ad: 'Seated Cable Row', kamera: [30, 16], seritKameralar: [[0, 0], [30, 16], [140, 20]], merkez: [35, 0, 0],
      a: { ...OTURUR([0, 40, 0], [0, 81]), ayak: [0, AYAK_PT] }, b: { ...OTURUR([0, 40, 0], [0, 90]), ayak: [0, AYAK_PT] },
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], 7], kutup: [-1, -0.2, 1], ...tut([0, 1, 0], 1.6) }, B: { hedef: [c[0], c[1], -7], kutup: [-1, -0.2, -1], ...tut([0, 1, 0], 1.6) },
        ayakA: { hedef: [BILEK_X, 30, KALCA_YAN], kutup: [0.2, 1, 0.15] }, ayakB: { hedef: [BILEK_X, 30, -KALCA_YAN], kutup: [0.2, 1, -0.15] } }); },
      ekipman(pr, s, t) {
        const c = yol(t), tepe = ekle(c, [8, 0, 0]);
        return [...M.kutu(pr, [-20, 40], [26, 32], [-13, 13], SEHPA), ...M.kutu(pr, [-12, 32], [0, 26], [-6, 6]),
          ...M.kutu(pr, [TABLA, TABLA + 4], [8, 54], [-20, 20], PED),                                // ayak tablası (taban yüzeyi TABLA'da)
          ...kabloKulesi(pr, KOLON_X, MAKARA, 1, yiginKalkisi(this, MAKARA, q => ekle(yol(q.t), [8, 0, 0]), s)),                                                         // kule karşıda, makara kızakta tutamak yüksekliğinde
          ...M.kutu(pr, [-12, KOLON_X], [0, 5], [-8, 8], KULE.govde),                                     // sehpadan kuleye taban rayı
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          ...paralelKulp(pr, [[c[0], c[1], 7], [c[0], c[1], -7]], [0, 1, 0], tepe)];
      },
      cisimler: s => [[MAKARA, ekle(yol(s.t), [8, 0, 0]), 0.7]],
      izlenen: 'eA',
      kisit: { ortakBar: true, dizYonu: [0.2, 1, 0], govde: { aralik: [80, 91], oynama: 10 }, temas: [kalcaOturakta(32)],
        ozel: [{ ad: 'ayaklar platformda sabit', f: ks => { const d = Math.max(...ks.map(s => mesafe(s.aA, ks[0].aA))); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)}` }; } },
          // Sabri (27 Eyl): "halat tam karşıdan bir yerden çıkmalı"
          { ad: 'kablo tam karşıdan gelir (yere paralel, ≤ 5°)', f: ks => { const a = Math.max(...ks.map(s => { const c = ekle(yol(s.t), [8, 0, 0]);
              return Math.abs(Math.atan2(MAKARA[1] - c[1], MAKARA[0] - c[0])) * 180 / Math.PI; }));
            return { gecti: a <= 5 && MAKARA[0] > TABLA, olcum: `en fazla ${a.toFixed(1)}°` }; } }] },
    };
  })(),

  cable_curl: (() => {
    const MAKARA = [46, 8, 0];                                    // alçak makara kulenin ön kızağında (8 Eki: 16 ayağın altındaydı, 30'da eller kuleye giriyordu — el x ≤ 41)
    const E = (s, i) => { const o = dirsekAlti(4, 3.5); return ekle(i > 0 ? s.omA : s.omB, [o[0], o[1], o[2] * i]); };   // dirsekler gövdenin yanında SABİT
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), L.fa, rd(ara(28, 135, ease(t))), 0, i);   // altta bar uylukların ÖNÜNDE (20° iken içinden geçiyordu)
    return {
      ad: 'Cable Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [10, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: ekle(fark(E(s, 1), s.omA), [-4, 0, 0]), ...tut(Z, 1.8, 'onKolOn') }, B: { hedef: el(s, t, -1), kutup: ekle(fark(E(s, -1), s.omB), [-4, 0, 0]), ...tut(Z, 1.8, 'onKolOn') }, /* 8 Eki: kutup dirsekten + 4 cm GERİ eğilim — kol düzken kola paralel kutupta dirsek kareden kareye yer değiştiriyordu */ ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman(pr, s) {
        const m = [s.eA[0], s.eA[1], 0];
        return [...kabloKulesi(pr, MAKARA[0] + 6, MAKARA, 1, yiginKalkisi(this, MAKARA, q => [q.eA[0], q.eA[1], 0], s)), ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, m),
          M.kapsul(pr, [m[0], m[1], -(OMUZ.yan + 4)], [m[0], m[1], OMUZ.yan + 4], 1.8, '#8a929c')];    // düz bar, supinasyon
      },
      cisimler: s => [[MAKARA, [s.eA[0], s.eA[1], 0], 0.7], [[s.eA[0], s.eA[1], -(OMUZ.yan + 4)], [s.eA[0], s.eA[1], OMUZ.yan + 4], 1.8]],
      izlenen: 'eA',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 } },
    };
  })(),

  db_hammer_curl: (() => {
    const bet = Math.asin(6 / L.fa);                               // dambıllar uylukların DIŞINDA sarkar (Ø14 altıgen baş uyluğa değmesin — 27 Eyl)
    const E = (s, i) => { const o = dirsekAlti(3, 4.5); return ekle(i > 0 ? s.omA : s.omB, [o[0], o[1], o[2] * i]); };
    const aci = t => rd(ara(8, 135, ease(t)));
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), L.fa, aci(t), bet, i);
    const eksen = t => [Math.cos(aci(t)), Math.sin(aci(t)), 0];   // çekiç tutuş: tutamak ön kola dik, sagital düzlemde
    return {
      ad: 'Dumbbell Hammer Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [5, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      // Kollar SIRAYLA (ExRx): sol kol sağın tersi zamanlamayla
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: ekle(fark(E(s, 1), s.omA), [-4, 0, 0]), ...tut(eksen(t), 1.6) }, B: { hedef: el(s, 1 - t, -1), kutup: ekle(fark(E(s, -1), s.omB), [-4, 0, 0]), ...tut(eksen(1 - t), 1.6) }, /* 8 Eki: kutup dirsekten + 4 cm GERİ eğilim (Sabri: kol aşağı inince dirsekten hızlıca kırılıp düzeliyor) */ ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman: (pr, s, t) => [...M.dambil(pr, s.eA, eksen(t)), ...M.dambil(pr, s.eB, eksen(1 - t))],
      cisimler: s => [M.dambilCismi(s.eA, eksen(s.t)), M.dambilCismi(s.eB, eksen(1 - s.t))],
      izlenen: 'eA',
      kisit: { sirayla: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 } },
    };
  })(),

  machine_leg_press: (() => {
    const P = [0, 30, 0], g = [180, 38], gd = yon(...g), n = yon(0, 52), r = birim([1, 1, 0]), pY = birim([-1, 1, 0]);
    const BK = (L.th + L.sh) / 76, s0 = 53.8 * BK, sH = 21 * BK;    // altta diz ~90°, üstte ~160° (eski bacak 76 cm'e göre)
    const bilek = (t, i) => ekle(ekle(P, r, s0 + sH * (1 - ease(t))), Z, (KALCA_YAN + 1) * i);   // t=0 üst (kollar uzun), t=1 alt
    return {
      ad: 'Leg Press', kamera: [30, 18], seritKameralar: [[0, 0], [30, 18], [120, 26]], merkez: [25, 0, 0],
      a: { P, g, yan: [-90, 0], ayak: [0, 135], uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] },   // ayak plakaya doğru (yaw 180 tabanı ters çeviriyordu)
      uclar: t => s => ({
        A: { hedef: [P[0] + 6, P[1] + 4, 24], kutup: [0, -1, 0.5], ...tut([1, 0, 0], 2.2) }, B: { hedef: [P[0] + 6, P[1] + 4, -24], kutup: [0, -1, -0.5], ...tut([1, 0, 0], 2.2) },
        ayakA: { hedef: bilek(t, 1), kutup: [-0.5, 1, 0.15] }, ayakB: { hedef: bilek(t, -1), kutup: [-0.5, 1, -0.15] } }),
      ekipman(pr, s, t) {
        const orta = ekle(ekle(P, r, s0 + sH * (1 - ease(t)) + AYAK_Y + 2), pY, 6);   // plakanın ön yüzü = ayak tabanı (bilekten AYAK_Y)
        // 8 Eki (Sabri: "kalçası mindere oturmuyor", "aletler gerçek şekillere benzesin"): oturak sırtlığa kadar uzanan
        // kova koltuk + taban kirişi; platform raylarda kayan KIZAĞA bağlı (eskiden havada levha)
        return [...M.kutu(pr, [-22, 14], [15, 22], [-17, 17], SEHPA), ...M.kutu(pr, [-26, 12], [11, 15], [-12, 12], KULE.govde),
          ...M.kutu(pr, [-60, 30], [0, 4], [-30, 30], KULE.govde), ...M.kutu(pr, [-6, 6], [4, 11], [-8, 8], KULE.govde),
          ...sirtMinderi(pr, s, n, 70, 32, 16),
          ...M.kutuY(pr, orta, [Z, pY, r], [44, 40, 4], PED),
          ...M.kutuY(pr, ekle(orta, r, 9), [Z, pY, r], [62, 26, 12], KULE.govde),                    // kızak (raylar arasında)
          ...[24, -24].map(zz => M.kapsul(pr, ekle(ekle(orta, r, 12), Z, zz), ekle(ekle(ekle(orta, r, 12), Z, zz), pY, 18), 2, METAL)),   // plaka boynuzları
          ...[26, -26].map(zz => M.kapsul(pr, ekle(ekle(P, r, 40), Z, zz), ekle(ekle(P, r, 105), Z, zz), 2.2, METAL)),
          // ⚠️ Raylar havada duruyordu (27 Eyl denetimi): iki uçtan yere inen dikme + taban kirişi
          ...[28, -28].flatMap(zz => { const alt = ekle(ekle(P, r, 40), Z, zz), ust = ekle(ekle(P, r, 105), Z, zz);
            return [M.kapsul(pr, [alt[0], 0, zz], alt, 2.6, METAL), M.kapsul(pr, [ust[0], 0, zz], ust, 2.6, METAL),
                    M.kapsul(pr, [-16, 2.5, zz], [ust[0] + 4, 2.5, zz], 2.6, METAL)]; }),
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
    // B1: adım uzunluğu ve kalça yolu bacak ölçülerinden ÇÖZÜLÜR. Altta: ön kaval dik + ön uyluk yatay (diz 90°),
    // arka parmak kökü yerde ve sabit, arka diz yerden R.sh + 4 yukarıda, arka uyluk kalçanın gerisinde.
    // 8 Eki (Sabri: "adım çok açılıyor, yere çökerken biraz yavaş"): adımı uzatan yere paralel arka kaval ve dik ön kavaldı.
    // Dipte ön kaval 12° öne yatar (diz bileğin ~9 cm önünde), ön uyluk 8° eğik, arka diz yerden 14 cm; iki diz ~90° kalır.
    // Adım fazı 0,4 → 0,5 (çöküş daha kısa sürede, daha çabuk).
    const T1 = 0.5, ZY = KALCA_YAN + 0.5, AV = ayakVek(-55), ON_UYLUK = rd(8), ON_KAVAL = rd(12), ARKA_DIZ_Y = 14;
    const ARKA_B = [AYAK_BOY_ - AV[0], TOP_Y - AV[1]];                                  // altta arka bilek
    const ARKA_D = [ARKA_B[0] + Math.sqrt(L.sh ** 2 - (ARKA_B[1] - ARKA_DIZ_Y) ** 2), ARKA_DIZ_Y];   // altta arka diz
    const PY_ALT = AYAK_Y + L.sh * Math.cos(ON_KAVAL) + L.th * Math.sin(ON_UYLUK), PX_ALT = ARKA_D[0] + Math.sqrt(L.th ** 2 - (PY_ALT - ARKA_D[1]) ** 2);
    const ADIM = PX_ALT + L.th * Math.cos(ON_UYLUK) - L.sh * Math.sin(ON_KAVAL);
    const faz = t => { const yari = t < 0.5 ? 0 : 1, u = (t - yari * 0.5) * 2; return { i: yari ? -1 : 1, tau: u < 0.5 ? u * 2 : (1 - u) * 2 }; };
    const k1 = t => ease(Math.min(t / T1, 1)), k2 = t => ease(Math.max(0, (t - T1) / (1 - T1)));
    const onBilek = (tau, i) => [ADIM * k1(tau), AYAK_Y + 9 * Math.sin(Math.PI * k1(tau)), ZY * i];   // adımda yay çizer
    const parmak = i => [AYAK_BOY_, TOP_Y, -ZY * i];                                                 // arka ayak parmak kökü SABİT
    const arkaAci = tau => ara(0, -55, ease(tau));
    const arkaBilek = (tau, i) => { const v = ayakVek(arkaAci(tau)); return [AYAK_BOY_ - v[0], TOP_Y - v[1], -ZY * i]; };
    const PY_ORTA = AYAKTA_Y - (AYAKTA_Y - PY_ALT) * 0.567;
    const kalca = tau => tau <= T1 ? [ara(0, PX_ALT * 0.75, k1(tau)), ara(AYAKTA_Y, PY_ORTA, k1(tau)), 0] : [ara(PX_ALT * 0.75, PX_ALT, k2(tau)), ara(PY_ORTA, PY_ALT, k2(tau)), 0];
    const on = (s, i, k) => s[`${k}${i > 0 ? 'A' : 'B'}`], arka = (s, i, k) => s[`${k}${i > 0 ? 'B' : 'A'}`];
    const alt = ks => ks.filter(s => faz(s.t).tau >= 0.999);
    const ozel = (ad, f) => ({ ad, f });
    return {
      ad: 'Lunge', dongu: true, donguTekrar: 2, seritAnlar: [[0, 'başı'], [0.25, 'sağ öne'], [0.75, 'sol öne']],
      kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [90, 8]], merkez: [30, 0, 0],
      poz: t => { const { i, tau } = faz(t);
        return { ...AYAKTA(kalca(tau)), ayakA: i > 0 ? 0 : [0, arkaAci(tau)], ayakB: i > 0 ? [0, arkaAci(tau)] : 0 }; },
      uclar: t => s => { const { i, tau } = faz(t);
        const onA = { hedef: onBilek(tau, i), kutup: [1, 0, 0.1 * i] }, arkaA = { hedef: arkaBilek(tau, i), kutup: [1, -0.5, -0.1 * i] };
        return {
          A: { hedef: ekle(s.P, [-2, 6, KALCA_YAN + 6]), kutup: [-0.5, 0, 1] }, B: { hedef: ekle(s.P, [-2, 6, -(KALCA_YAN + 6)]), kutup: [-0.5, 0, -1] },   // eller belde
          ayakA: i > 0 ? onA : arkaA, ayakB: i > 0 ? arkaA : onA }; },
      ekipman: () => [],
      izlenen: 'P',
      kisit: { dizYonu: [1, 0, 0], govde: { aralik: [84, 96], oynama: 1 },
        ozel: [
          ozel('arka ayak parmak ucu yerde ve sabit', ks => { const d = Math.max(...ks.map(s => { const { i } = faz(s.t); return mesafe(arka(s, i, 'u'), parmak(i)); })); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)}` }; }),
          ozel('ön ayak bastıktan sonra sabit', ks => { const b = ks.filter(s => faz(s.t).tau >= T1); const d = Math.max(...b.map(s => { const { i } = faz(s.t); return mesafe(on(s, i, 'a'), onBilek(1, i)); })); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(1)} (${b.length} kare)` }; }),
          ozel('ön ayak adımda yere sürtmüyor', ks => { const m = Math.min(...ks.filter(s => faz(s.t).tau < T1).map(s => { const { i } = faz(s.t); return Math.min(on(s, i, 'a')[1] - AYAK_Y, on(s, i, 'u')[1] - TOP_Y); })); return { gecti: m >= -0.5, olcum: `zemine en yakın ${m.toFixed(1)}` }; }),
          ozel('altta ön diz ~90° (75–105°) — iki bacakta', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return 180 - aciOf(on(s, i, 'ka'), on(s, i, 'z'), on(s, i, 'a')); }); return { gecti: v.length === 2 && v.every(m => m >= 75 && m <= 105), olcum: v.map(m => m.toFixed(1) + '°').join(' · ') }; }),
          ozel('altta ön diz ayak bileğini fazla geçmiyor', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return on(s, i, 'z')[0] - on(s, i, 'a')[0]; }); return { gecti: v.every(m => m <= 10), olcum: v.map(m => m.toFixed(1)).join(' · ') }; }),
          ozel('altta arka diz yere yakın (≤ 10 cm)', ks => { const v = alt(ks).map(s => { const { i } = faz(s.t); return arka(s, i, 'z')[1] - R.sh; }); return { gecti: v.every(m => m >= 0 && m <= 10), olcum: v.map(m => m.toFixed(1)).join(' · ') }; }),
          ozel('başa döner (ayaklar yan yana, ilerlemiyor)', ks => { const s0 = ks.find(s => s.t === 0), sY = ks.find(s => Math.abs(s.t - 0.5) < 1e-9); const d = Math.max(mesafe(s0.aA, sY.aA), mesafe(s0.aB, sY.aB), mesafe(s0.P, sY.P)); return { gecti: d <= 0.5 && Math.abs(s0.aA[0] - s0.aB[0]) <= 0.5, olcum: `yarım döngü sonunda sapma ${d.toFixed(1)}` }; }),
        ] },
    };
  })(),

  calf_raise: (() => {
    // ExRx: ayak ÖN TABANI basamakta, topuklar boşta; topuk basamak seviyesinin ALTINDAN
    // (dorsifleksiyon) en yükseğe; dizler düz, bir el destekte
    const BASAMAK = 12, PARMAK = zz => [AYAK_BOY_, BASAMAK + TOP_Y, zz];
    const aci = t => ara(15, -40, ease(t));
    const bilek = (t, zz) => { const v = ayakVek(aci(t)); return fark(PARMAK(zz), [v[0], v[1], 0]); };
    const DIREK = [22, 0, OMUZ.yan + 22], EL = [DIREK[0], 112 + (AYAKTA_Y - 79.6), DIREK[2]];   // direk yanda; el direğin EKSENİNDE (eskiden 5 cm yanındaydı — B1 tutamak denetimi buldu)
    return {
      ad: 'Calf Raise', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 8]], merkez: [10, 0, 0],
      poz: t => ({ ...AYAKTA([bilek(t, 0)[0], bilek(t, 0)[1] + L.th + L.sh - 0.1, 0]), ayak: [0, aci(t)] }),
      uclar: t => () => ({
        A: { hedef: EL, kutup: [0, -1, 0.4], ...tut([0, 1, 0], 2) },
        ayakA: { hedef: bilek(t, KALCA_YAN), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(t, -KALCA_YAN), kutup: [1, 0, -0.1] } }),
      // 8 Eki: basamak lastik kaplı platform + direk basamağın tabanına bağlı (eskiden yerden çıkan tek boru)
      ekipman: pr => [...M.kutu(pr, [4, 34], [0, BASAMAK - 2], [-18, 18], KULE.govde), ...M.kutu(pr, [4, 34], [BASAMAK - 2, BASAMAK], [-18, 18], PED),
        ...M.kutu(pr, [4, DIREK[0] + 6], [0, 3], [-18, DIREK[2] + 6], KULE.govde),
        M.kapsul(pr, DIREK, [DIREK[0], 160, DIREK[2]], 2, METAL), M.kapsul(pr, [DIREK[0], 160, DIREK[2]], [DIREK[0] - 10, 160, DIREK[2]], 2, METAL)],
      izlenen: 'P', izKaydir: [0, 0, -(KALCA_YAN + 30)],   // kalça izi direğin KARŞI yanında, sarkan kolun da dışında (içeride görünmüyordu)
      kisit: { tekTaraf: true, zeminY: BASAMAK, ayaklar: 'parmakUcu', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'dizler düz (≤ 10°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 10, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          { ad: 'başta topuk basamağın altında', f: ks => { const m = ks[0].aA[1] - (BASAMAK + AYAK_Y); return { gecti: m < 0, olcum: `${m.toFixed(1)}` }; } },
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
    a: AYAKTA([0, AYAKTA_Y, 0]),
    uclar: t => { const w = 2 * Math.PI * t, r = 14, yan = Math.sqrt((ERISIM * 0.993) ** 2 - r * r); return s => ({
      A: { hedef: ekle(s.omA, [r * Math.cos(w), r * Math.sin(w), yan]), kutup: [-0.3, -1, 0] },
      B: { hedef: ekle(s.omB, [r * Math.cos(w), r * Math.sin(w), -yan]), kutup: [-0.3, -1, 0] }, ...ayakBilekleri(2, KALCA_YAN + 2) }); },
    ekipman: () => [], izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [0, 15], sabit: true }, govde: { aralik: [88, 92], oynama: 1 } },
  },

  w_dis_rotasyon: (() => {
    // ACE / NHS: üst kol gövdenin yanında SABİT, dirsek 90°, ön kol öne bakar ve DIŞA açılır
    // (transvers düzlem). 2B önden görünüm bunu ön kolu yukarı kaldırır gibi çiziyordu.
    const E = (s, i) => { const o = dirsekAlti(2, 4.5); return ekle(i > 0 ? s.omA : s.omB, [o[0], o[1], o[2] * i]); };
    const el = (s, t, i) => { const f = rd(ara(0, 70, ease(t))); return ekle(E(s, i), [L.fa * Math.cos(f), 0, i * L.fa * Math.sin(f)]); };
    return {
      ad: 'Omuz dış rotasyon', isinma: true, kamera: [20, 40], seritKameralar: [[0, 0], [20, 40], [90, 60]], merkez: [0, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: fark(E(s, 1), s.omA) }, B: { hedef: el(s, t, -1), kutup: fark(E(s, -1), s.omB) }, ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman: () => [], izlenen: 'eA',
      kisit: { dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [{ ad: 'ön kol yere paralel', f: ks => { const m = Math.max(...ks.flatMap(s => [Math.abs(s.eA[1] - s.dA[1]), Math.abs(s.eB[1] - s.dB[1])])); return { gecti: m <= 1, olcum: `en fazla ${m.toFixed(1)}` }; } }] },
    };
  })(),

  w_gogus_acma: {
    // SO "Arm Swings": kollar omuz hizasında; önde birleşmeye yakın → olabildiğince geriye açılır
    // (yatay abdüksiyon, transvers düzlem). 2B önden görünüm ön kolları yukarıda eğiyordu.
    ad: 'Göğüs açma — dinamik', isinma: true, kamera: [20, 45], seritKameralar: [[90, 0], [20, 45], [0, 80]], merkez: [0, 0, 0],
    a: AYAKTA([0, AYAKTA_Y, 0]),
    uclar: t => { const f = rd(ara(5, 100, ease(t))); return s => ({
      A: { hedef: ekle(s.omA, [(ERISIM * 0.993) * Math.cos(f), 0, (ERISIM * 0.993) * Math.sin(f)]), kutup: [0, -1, 0] },
      B: { hedef: ekle(s.omB, [(ERISIM * 0.993) * Math.cos(f), 0, -(ERISIM * 0.993) * Math.sin(f)]), kutup: [0, -1, 0] }, ...ayakBilekleri(2, KALCA_YAN + 2) }); },
    ekipman: () => [], izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], dirsek: { aralik: [0, 15], sabit: true }, govde: { aralik: [88, 92], oynama: 1 } },
  },

  w_bacak_sallama: (() => {
    // SO: bir elle desteğe tutun, bir bacak DÜZ öne-arkaya sallanır; duran bacak ve gövde sabit
    const DIREK = [8, 0, -(OMUZ.yan + 12)], EL = [DIREK[0], 100 + (AYAKTA_Y - 79), DIREK[2]];   // el direğin EKSENİNDE
    const p = t => ara(-125, -52, ease(t));
    return {
      ad: 'Bacak sallama', isinma: true, kamera: [28, 10], seritKameralar: [[0, 0], [28, 10], [-40, 14]], merkez: [0, 0, 0],
      poz: t => ({ ...AYAKTA([0, AYAKTA_Y, 0]), thA: [0, p(t)], shA: [0, p(t) + 12], ayakA: [0, p(t) + 12 + 90], ayakB: 0 }),
      uclar: () => () => ({ B: { hedef: EL, kutup: [0, -1, -0.4], ...tut([0, 1, 0], 2) }, ayakB: { hedef: [2, AYAK_Y, -KALCA_YAN], kutup: [1, 0, -0.1] } }),
      ekipman: pr => [M.kapsul(pr, DIREK, [DIREK[0], 140, DIREK[2]], 2, METAL)],
      izlenen: 'aA',
      kisit: { tekTaraf: true, ayaklar: { B: 'yerde' }, govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'sallanan bacak düz (≤ 15°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 15, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          { ad: 'sallanan ayak yere sürtmüyor', f: ks => { const m = Math.min(...ks.map(s => Math.min(s.aA[1] - AYAK_Y, s.uA[1] - TOP_Y))); return { gecti: m >= -0.5, olcum: `zemine en yakın ${m.toFixed(1)}` }; } },
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
      poz: t => ({ ...AYAKTA([ara(0, -20 * (L.th / 39), k(t)), ara(AYAKTA_Y, AYAK_Y + L.sh * 0.92, k(t)), 0], [0, ara(90, 58, k(t))]),
        uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0], ayakA: -15, ayakB: 15 }),
      uclar: () => () => ({ ayakA: { hedef: [2, AYAK_Y, KALCA_YAN + 4], kutup: [1, 0, 0.3] }, ayakB: { hedef: [2, AYAK_Y, -(KALCA_YAN + 4)], kutup: [1, 0, -0.3] } }),
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
