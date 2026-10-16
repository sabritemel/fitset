/**
 * C MANKEN SAHNESİ — ışık, gölge, zemin, alet malzemeleri, kas vurgusu tanımları (8 Eki 2026'da prototipten
 * uygulamaya taşındı: docs/2026-10-08-c-manken-uygulamaya-PLAN.md). Gövde: ./govde.js.
 *
 * ⭐ HAREKET MOTORU AYNI: iskelet `M.an(h, t)`, ekipman hareketin kendi `ekipman()` tanımından.
 * Değişen yalnız GÖRÜNÜŞ: ortam ışığı (prosedürel oda, 0 bayt) · yumuşak gölge · alet malzemeleri
 * (krom, kauçuk, döşeme, boyalı çelik) · kas vurgusu (birincil/ikincil, gövdenin gölgelendiricisinde).
 * three.js: js/vendor/three-c.min.js (r186 alt kümesi, MIT). A (premium kapsül manken) 8 Eki'de emekliye ayrıldı.
 */
import * as T from '../../vendor/three-c.min.js';
import * as M from '../manken3d.js';

const V = a => new T.Vector3(a[0], a[1], a[2]);
const uzunluk = v => Math.hypot(v[0], v[1], v[2]);
const Y = new T.Vector3(0, 1, 0);

/* ── Geometriler (aletler) ── */
const GEO = {
  kure: new T.SphereGeometry(1, 40, 28),
  silindir: new T.CylinderGeometry(1, 1, 1, 32, 1, true).translate(0, 0.5, 0),
};
const kapakliOnbellek = new Map();
const kapakli = kenar => { if (!kapakliOnbellek.has(kenar))
  kapakliOnbellek.set(kenar, new T.CylinderGeometry(1, 1, 1, Math.max(kenar, kenar === 6 ? 6 : 40), 1, false)
    .rotateY(kenar === 6 ? Math.PI / 6 : 0).translate(0, 0.5, 0));
  return kapakliOnbellek.get(kenar); };
const mesh = (geo, mat, golgeli = true) => { const m = new T.Mesh(geo, mat); m.castShadow = golgeli; m.receiveShadow = true; return m; };
function uzat(m, a, b, enX = 1, enZ = enX) {
  const A = V(a), B = V(b), d = B.clone().sub(A), L = d.length() || 1e-6;
  m.position.copy(A); m.quaternion.setFromUnitVectors(Y, d.divideScalar(L)); m.scale.set(enX, L, enZ);
}
const cap = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dik = (v, g) => M.birim(M.fark(v, M.ekle([0, 0, 0], g, M.nokta(v, g))));

/** Kas yönleri (dünya uzayı) — gövdenin kemiklerine göre.
 * biceps = dirseğin büküldüğü taraf · quadriceps = dizin önü · baldır = kaval kemiğinin arkası */
export function kasYonleri(s) {
  // ⚠️ Gövdenin ÖNÜ g × yan DEĞİLDİR: sırtüstü hareketlerde (bench, fly) veri yan'ı ters tutar ve
  // g × yan sehpayı gösterir (ölçüldü: yüz·ileri = −1,00). Mutlak referans yüz yönüdür (`s.yuz`).
  const ileri0 = M.birim(cap(s.g, s.yan)), ters = M.nokta(s.yuz, ileri0) < 0;
  const ileri = ters ? ileri0.map(x => -x) : ileri0;
  const yon = { on: ileri, arka: ileri.map(x => -x), ileri, ters };
  // omzun dışa yönü (yan deltoid): iki omuz arasından o omza, gövde eksenine dik
  const omOrta = s.omA.map((v, i) => (v + s.omB[i]) / 2);
  for (const k of ['A', 'B']) yon['dis' + k] = dik(M.fark(s['om' + k], omOrta), s.g);
  for (const k of ['A', 'B']) {
    const om = s['om' + k], d = s['d' + k], e2 = s['e' + k], ka = s['ka' + k], z = s['z' + k], a = s['a' + k], u = s['u' + k];
    const ua = M.birim(M.fark(d, om)), fa = M.birim(M.fark(e2, d));
    // Dirsek/diz yönü önce verinin KENDİ IK kutbundan (sürekli). Bükümden türetmek kol düzleşince
    // tanımsızlaşıyor ve yedeğe geçerken kol burkuluyordu (Sabri: "kollar yön değiştiriyor").
    const kutupDik = (kutup, eksen) => { if (!kutup) return null; const v = M.fark(kutup, M.ekle([0, 0, 0], eksen, M.nokta(kutup, eksen)));
      return uzunluk(v) > 0.1 ? M.birim(v) : null; };
    const dirsekYonu = kutupDik(s.hedef?.[k]?.kutup, ua);
    const dikHam = M.fark(fa, M.ekle([0, 0, 0], ua, M.nokta(fa, ua)));        // normalize EDİLMEMİŞ: kol düzse ~0
    const bukum = dirsekYonu ? dirsekYonu.map(x => -x) : uzunluk(dikHam) > 0.25 ? M.birim(dikHam) : dik(ileri, ua);
    const th = M.birim(M.fark(z, ka)), sh = M.birim(M.fark(a, z));
    const dizYonu = kutupDik(s.hedef?.['ayak' + k]?.kutup, th);
    const dizArka = dizYonu ? dizYonu.map(x => -x) : M.nokta(sh, th) < 0.97 ? dik(sh, th) : dik(ileri.map(x => -x), th);
    const parmak = dik(M.birim(M.fark(u, a)), sh);
    Object.assign(yon, { ['bukum' + k]: bukum, ['bukumTers' + k]: bukum.map(x => -x),
      ['uylukOn' + k]: dizArka.map(x => -x), ['uylukArka' + k]: dizArka, ['baldirArka' + k]: parmak.map(x => -x), ['kavalOn' + k]: parmak });
  }
  return yon;
}

export const HAREKET_KAS = {
  bb_bench_press: [['gogus'], ['onOmuz', 'triceps']],
  db_bench_fly: [['gogus'], ['onOmuz']],
  machine_incline_press: [['gogus'], ['onOmuz', 'triceps']],
  db_incline_press: [['gogus'], ['onOmuz', 'triceps']],   // 17 Eki (Parti E)
  db_shoulder_press: [['omuz'], ['triceps']],
  cable_front_raise: [['onOmuz'], []],
  machine_reverse_fly: [['arkaOmuz'], ['sirtOrta']],
  cable_face_pull: [['arkaOmuz'], ['sirtOrta']],   // 17 Eki (Parti E)
  cable_vbar_pushdown: [['triceps'], []],
  db_overhead_ext: [['triceps'], [], { taraf: 'A' }],   // tek kol: yalnız çalışan kol
  plank: [['karin'], []],
  bw_side_plank: [['karin'], []],   // 17 Eki (Parti E) — yan karın, alttaki taraf (kasAktif)
  cable_close_pulldown: [['lat'], ['biceps']],
  db_two_arm_row: [['sirtOrta'], ['arkaOmuz', 'biceps']],
  db_one_arm_row: [['sirtOrta', 'lat'], ['arkaOmuz', 'biceps']],   // 17 Eki (Parti E) — yalnız çalışan (sağ) taraf (kasAktif)
  cable_seated_row: [['sirtOrta'], ['biceps']],
  cable_curl: [['biceps'], []],
  db_hammer_curl: [['biceps'], ['onKol']],
  db_biceps_curl: [['biceps'], ['onKol']],   // 17 Eki (G2)
  cable_crossover: [['gogus'], ['onOmuz']],
  bb_incline_press: [['gogus'], ['onOmuz', 'triceps']],
  bb_skull_crusher: [['triceps'], []],
  machine_leg_press: [['kuadriseps'], ['kalca']],
  lunge: [['kuadriseps'], ['kalca', 'arkaBacak']],
  calf_raise: [['baldir'], []],
  w_squat: [['kuadriseps'], ['kalca', 'arkaBacak']],   // 13 Eki: kütüphaneye girdi (bw_squat → w_squat)
  bb_squat: [['kuadriseps', 'kalca'], ['arkaBacak', 'bel']],   // 13 Eki (1B)
  bb_deadlift: [['kalca', 'arkaBacak'], ['bel', 'sirtOrta', 'onKol']],   // 14 Eki (1B)
  bb_rdl: [['arkaBacak', 'kalca'], ['bel']],
  bb_ohp: [['omuz'], ['triceps', 'onOmuz']],
  bw_pushup: [['gogus'], ['triceps', 'onOmuz', 'karin']],
  db_bench_press: [['gogus'], ['triceps', 'onOmuz']],
  db_lateral_raise: [['omuz'], ['onOmuz']],
  db_goblet_squat: [['kuadriseps', 'kalca'], ['arkaBacak', 'karin']],
  bw_pullup: [['lat'], ['biceps', 'sirtOrta', 'arkaOmuz']],
  bw_dips: [['triceps', 'gogus'], ['onOmuz']],
  cable_wide_pulldown: [['lat'], ['biceps', 'arkaOmuz']],
  machine_leg_extension: [['kuadriseps'], []],
  machine_leg_curl: [['arkaBacak'], ['baldir']],
  bb_hip_thrust: [['kalca'], ['arkaBacak']],
  bw_glute_bridge: [['kalca'], ['arkaBacak']],   // 17 Eki (Parti E)
  machine_chest_press: [['gogus'], ['triceps', 'onOmuz']],   // 15 Eki (1B dalga 3)
  machine_pec_deck: [['gogus'], ['onOmuz']],
  bb_curl: [['biceps'], ['onKol']],
  cable_rope_pushdown: [['triceps'], []],
  bw_crunch: [['karin'], []],
  bw_decline_crunch: [['karin'], []],
  cable_kneeling_crunch: [['karin'], []],
  machine_ab_crunch: [['karin'], []],
  bw_hanging_leg_raise: [['karin'], ['onKol']],
  bw_hanging_knee_raise: [['karin'], ['onKol']],
  machine_shoulder_press: [['omuz'], ['triceps']],
  cable_overhead_ext: [['triceps'], []],
  bw_dead_bug: [['karin'], []],
  bw_bird_dog: [['karin', 'bel'], ['kalca', 'arkaOmuz']],
  cable_pallof_press: [['karin'], ['onOmuz']],
  bw_tibialis_raise: [['kaval'], []],
  db_bulgarian_split_squat: [['kuadriseps', 'kalca'], ['arkaBacak']],
  bb_row: [['sirtOrta', 'lat'], ['arkaOmuz', 'biceps', 'bel']],
  cardio_treadmill: [['kalca', 'kuadriseps', 'baldir'], ['arkaBacak']],   // 15 Eki (1B dalga 3, Parti D — kardiyo)
  cardio_treadmill_run: [['kalca', 'kuadriseps', 'baldir'], ['arkaBacak']],   // 17 Eki (Parti E)
  cardio_bike: [['kuadriseps', 'kalca'], ['arkaBacak', 'baldir']],
  cardio_elliptical: [['kuadriseps', 'kalca'], ['arkaBacak', 'baldir', 'triceps', 'biceps']],   // kollar taraf başına itme/çekme (kasAktif)
  cardio_rower: [['kuadriseps', 'kalca', 'sirtOrta', 'lat'], ['arkaBacak', 'biceps', 'arkaOmuz', 'bel']],
  cardio_stair: [['kalca', 'kuadriseps'], ['baldir', 'arkaBacak']],
};
/* ── KAS EVRESİ (8 Eki akşam, Sabri: "manken güç harcarken — halatı çekerken, dambılı kaldırırken, plankta gergin
   dururken — vurgu yansın; halatı bırakırken, dambıl aşağıdayken ve kolda yük yokken sönsün").
   Her hareketin t=0 pozu DİNLENME ucudur (r = 0); r hareketin dinlenmeden uzaklığı (0…1).
   KAS_EVRE: +1 güç evresi dinlenmeden UZAKLAŞIRKEN (curl, kürek, çekiş, kaldırma, pres yukarı) ·
             −1 güç evresi dinlenmeye DÖNERKEN (bench press ve fly yukarı, triceps baş üstü uzatma, leg press itiş,
                lunge kalkış) · 0 sürekli gergin (plank).
   Yön kareden kareye r'nin değişiminden okunur; duran karede (dokunulmamış görüntü) yalnız konum belirler. */
export const KAS_EVRE = { bb_bench_press: -1, db_bench_fly: -1, db_overhead_ext: -1, machine_leg_press: -1, lunge: -1, w_squat: -1, bb_squat: -1, bb_rdl: -1, bw_pushup: -1, db_bench_press: -1, db_incline_press: -1, bb_incline_press: -1, bb_skull_crusher: -1, db_goblet_squat: -1, bw_dips: -1, db_bulgarian_split_squat: -1, plank: 0, bw_side_plank: 0,
  cardio_treadmill: 0, cardio_treadmill_run: 0, cardio_bike: 0, cardio_elliptical: 0, cardio_rower: 0, cardio_stair: 0 };   // kardiyo: evre hareketin kasAktif'inden (kas ve taraf başına; ciz)
const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const evreDurum = new WeakMap();
/** lunge gibi dönen harekette r = kalça derinliği (en yüksek 0, en alçak 1) — hareket başına bir kez ölçülür */
const derinlikAraligi = new WeakMap();
function evreR(h, s, t) {
  if (!h.dongu) return t;
  if (!derinlikAraligi.has(h)) { let lo = Infinity, hi = -Infinity; for (let q = 0; q <= 48; q++) { const y = M.an(h, q / 48).P[1]; lo = Math.min(lo, y); hi = Math.max(hi, y); } derinlikAraligi.set(h, [lo, hi]); }
  const [lo, hi] = derinlikAraligi.get(h); return hi - lo > 0.5 ? (hi - s.P[1]) / (hi - lo) : 0;
}
export function kasEvresi(id, h, s, t) {
  if (globalThis.__kasTam) return 1;                                     // TANI: evresiz tam vurgu (bölge denetimi)
  const tur = KAS_EVRE[id] ?? 1;
  if (tur === 0 || h.statik) return 1;
  const r = Math.min(1, Math.max(0, evreR(h, s, t)));
  const d = evreDurum.get(h) ?? { r, yon: 0 };
  if (Math.abs(r - d.r) > 1e-4) d.yon = Math.sign(r - d.r);            // aynı an yeniden çizilirse yön korunur
  d.r = r; evreDurum.set(h, d);
  if (tur > 0) return d.yon > 0 ? 0.15 + 0.85 * sstep(0, 0.25, r)      // kaldırırken / çekerken: hemen yanar
    : Math.pow(r, 1.2);                                                  // bırakırken söner; dinlenmede 0
  return d.yon < 0 ? sstep(0, 0.3, r)                                    // dinlenmeye iterken yanar, kilitlenince söner
    : 0.6 * r * r;                                                       // indirirken yük birikir; dinlenmede 0
}

export const KAS_AD = { gogus: 'Göğüs', onOmuz: 'Ön omuz', omuz: 'Omuz', arkaOmuz: 'Arka omuz', triceps: 'Triceps',
  biceps: 'Biceps', onKol: 'Ön kol', lat: 'Sırt (lat)', sirtOrta: 'Sırt (orta)', karin: 'Karın',
  kuadriseps: 'Uyluk ön', arkaBacak: 'Arka bacak', kalca: 'Kalça', baldir: 'Baldır', bel: 'Bel', kaval: 'Kaval ön' };

/* ── Ekipman — hareketin KENDİ tanımından (webgl.js ile aynı ilkel toplama) ── */
function kaydedici(D) { return q => [q[0], q[1], q[0] * D[0] + q[1] * D[1] + q[2] * D[2]]; }
const D0 = M.birim([0.31, 0.53, 0.79]);
function ekipmanIlkelleri(h, s, t) {
  const hepsi = [...h.ekipman(kaydedici(D0), s, t), ...h.ekipman(kaydedici(D0.map(x => -x)), s, t)];
  const gor = new Set(), o = [];
  for (const e of hepsi) {
    if (!e.geo || e.geo.gizli3B) continue;                        // yuvarlatılmış minderin yerini tutan kutu yüzleri 3B'de çizilmez
    const g = e.geo, anahtar = g.tur === 'p' ? 'p' + g.P3.map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';')
      : g.tur === 'y' ? 'y' + [g.merkez, g.u, g.v, g.n, [g.w, g.h, g.d]].map(q => q.map(v => v.toFixed(2)).join(',')).join(';')
      : g.tur === 'k' || g.tur === 'c' ? g.tur + [g.a3, g.b3].map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';') + g.r : 's' + g.c3.join(',') + g.r;
    if (gor.has(anahtar)) continue;
    gor.add(anahtar);
    const renkler = [...e.svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)].map(m => m[1]).filter(c => c.toLowerCase() !== '#0a0b0d');
    o.push({ geo: g, renk: g.tur === 'y' ? g.renk : renkler.at(-1) ?? '#5d646d' });
  }
  return o;
}
/** Alet malzemeleri — rol, ilkelin türünden ve kalınlığından çıkarılır (prototip sezgisi) */
// AYDINLIK SAHNE (8 Eki, Sabri: "halat, direkler, oturak koyu zeminde görünmüyor; ortam biraz daha aydınlık olsun"):
// kablo açık çelik, boyalı çelik ve döşeme bir kademe açık, ortam ışığı artırıldı. ?karanlik=1 eski görünüm (kıyas).
const KARANLIK = !!globalThis.__karanlik;
const ALET = {
  krom: new T.MeshPhysicalMaterial({ color: 0xe9ecef, metalness: 1, roughness: 0.2, clearcoat: 0.4 }),
  celikKablo: new T.MeshStandardMaterial({ color: KARANLIK ? 0x30343a : 0xa9b0b8, metalness: 0.7, roughness: 0.35 }),
  kaucuk: new T.MeshStandardMaterial({ color: KARANLIK ? 0x1a1c1f : 0x2a2d32, metalness: 0, roughness: 0.82 }),
  boyaliCelik: new T.MeshPhysicalMaterial({ color: KARANLIK ? 0x3c424b : 0x66707c, metalness: 0.55, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  ip: new T.MeshStandardMaterial({ color: KARANLIK ? 0x2b2f35 : 0x3d434b, metalness: 0, roughness: 0.9 }),   // örgü naylon ip (mat)
};
// 17 Eki (Sabri: "iple triceps itmede ip düz bar gibi görünüyor"): ince kapsüller rengine bakılmadan KROM çiziliyordu — ip ve
// kauçuk tutma yerleri parlak metal çubuk gibiydi. Veri rengi malzemeyi seçer; tanımsız renkte eski yarıçap kuralı.
const RENK_MALZEME = { '#3d434b': ALET.ip, '#2f343a': ALET.kaucuk };
const doseme = new Map();
function dosemeMalzemesi(hex) {
  if (!doseme.has(hex)) {
    const c = new T.Color(hex).multiplyScalar(KARANLIK ? 0.72 : 1.25);
    doseme.set(hex, new T.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.6, clearcoat: 0.15,
      clearcoatRoughness: 0.5, sheen: 0.12, sheenRoughness: 0.6, sheenColor: 0x6a6f76, flatShading: true, side: T.DoubleSide }));
  }
  return doseme.get(hex);
}
/* ── LOGO ETİKETİ (16 Eki, Sabri: "monitördeki gri tonlu logoyu merdiven makinesinin büyük kaidesinin ön yüzüne, tam ortaya,
   uygun büyüklükte yerleştir"): hareket `logolar` ile yerini verir ({merkez, n: yüzey normali, yukari, en}); FS işareti
   (icons/isaret.svg) GRİ TONLU dokuya çevrilip yüzeyin 0,15 cm önüne ince bir düzlem olarak konur. Aletin parçalarından
   ayrıdır (fizik ve kadraj denetimleri onu görmez; hareket etmez). Gri ton piksel piksel (canvas filter her tarayıcıda yok). */
// 16 Eki (Sabri: "logonun rengi uygulandığı alanın biraz koyu tonu olsun"): doku yalnız ŞEKİL taşır (alfa = işaretin parlaklığı:
// açık harf tam, turuncu vurgu yarım); renk logonun KENDİSİNDEN (yüzeyin koyulaştırılmış tonu) — kabartma/baskı gibi
let logoDoku = null;
const logoMat = new Map();
export function logoDokusu() {
  if (logoDoku) return logoDoku;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 297;   // işaretin oranı (viewBox 620 × 360)
  logoDoku = new T.CanvasTexture(cv); logoDoku.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    const x = cv.getContext('2d'); x.drawImage(img, 0, 0, cv.width, cv.height);
    const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const l = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) * p[i + 3] / 255; p[i] = p[i + 1] = p[i + 2] = l; p[i + 3] = 255; }
    x.putImageData(d, 0, 0); logoDoku.needsUpdate = true;
  };
  img.src = new URL('../../../icons/isaret.svg', import.meta.url).href;
  return logoDoku;
}
function logoMalzemesi(renk = '#2a3038') {
  if (!logoMat.has(renk)) logoMat.set(renk, new T.MeshStandardMaterial({ color: new T.Color(renk), alphaMap: logoDokusu(), transparent: true,
    roughness: 0.8, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  return logoMat.get(renk);
}
/* OYUK (GRAVÜR) LOGO (2. tur, Sabri: "logolar yüzeye 2 mm oyuk olsun"): düz baskı yerine çukur görünümü — çukurun tabanı logonun
   koyu tonu; ışık yukarıdan geldiği için ÜST iç kenarda duvarın gölgesi (koyu şerit), ALT iç kenarda aydınlanan duvar (açık şerit).
   Şeritler doku uzayında logonun kendisinin ~2 mm kaydırılmış farkından (maske − kaydırılmış maske). Yüzeyle aynı düzlemde. */
const gravurDoku = {};
function gravurDokusu(tur) {
  if (gravurDoku[tur]) return gravurDoku[tur];
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 297;
  const tx = gravurDoku[tur] = new T.CanvasTexture(cv); tx.anisotropy = 4;
  const ciz = () => {
    const kaynak = logoDokusu().image; if (!kaynak) return;
    const W = cv.width, H = cv.height, a = kaynak.getContext('2d').getImageData(0, 0, W, H).data, x = cv.getContext('2d'), o = x.createImageData(W, H), s = 6;   // 6 px ≈ 2 mm (17 cm logo, 512 px)
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4, ic = a[i] / 255, kom = (yy + (tur === 'golge' ? -s : s)), dis = kom >= 0 && kom < H ? a[(kom * W + xx) * 4] / 255 : 0;
      const v = Math.max(0, ic - dis); o.data[i] = o.data[i + 1] = o.data[i + 2] = v * 255; o.data[i + 3] = 255; }
    x.putImageData(o, 0, 0); tx.needsUpdate = true; };
  const bekle = () => (logoDokusu().image?.getContext?.('2d') && logoDokusu().version > 0 ? ciz() : setTimeout(bekle, 150));
  bekle();
  return tx;
}
function logoKur(L) {
  const n = V(L.n).normalize(), up = V(L.yukari).normalize(), sag = new T.Vector3().crossVectors(up, n);
  const g = new T.PlaneGeometry(L.en, L.en * 360 / 620), grup = new T.Group();
  const m = new T.Mesh(g, logoMalzemesi(L.renk));
  const golge = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x000000, alphaMap: gravurDokusu('golge'), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  const isik = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xffffff, alphaMap: gravurDokusu('isik'), transparent: true, opacity: 0.16, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  grup.add(m, golge, isik);
  grup.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(sag, up, n));
  grup.position.copy(V(L.merkez)).addScaledVector(n, 0.15); m.receiveShadow = true;
  return grup;
}
/* ── YUVARLATILMIŞ MİNDER GÖVDESİ (2. tur): plan dikdörtgeni köşe yarıçaplı (r), kalınlık kenarları pahlı (pah) → kalın,
   yumuşak görünen levha. Geometri boyut başına bir kez kurulur; yeri/yönü her karede matrisle. */
const yastikBelek = new Map();
function yastikGeo(g) {
  const k = [g.w, g.h, g.d, g.r, g.pah].map(v => v.toFixed(2)).join(',');
  if (yastikBelek.has(k)) return yastikBelek.get(k);
  // dış hat: köşe yaylı dikdörtgen, içe δ kadar çekilmiş (köşe başına 8 nokta); kesit: alt ve üst kenarda çeyrek daire pah
  const KOSE = 8, PAH = 4, X = g.w / 2, Y = g.d / 2;
  const hat = dl => { const rr = Math.max(0.05, g.r - dl), o = [];
    for (const [cx, cy, a0] of [[X - g.r, Y - g.r, 0], [-X + g.r, Y - g.r, 90], [-X + g.r, -Y + g.r, 180], [X - g.r, -Y + g.r, 270]])
      for (let q = 0; q <= KOSE; q++) { const a = (a0 + 90 * q / KOSE) * Math.PI / 180; o.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    return o; };
  const kesit = [];                                                  // [δ, z] alttan üste
  for (let q = 0; q <= PAH; q++) { const f = q / PAH * Math.PI / 2; kesit.push([g.pah * (1 - Math.sin(f)), -g.h / 2 + g.pah * (1 - Math.cos(f))]); }
  for (let q = 0; q <= PAH; q++) { const f = q / PAH * Math.PI / 2; kesit.push([g.pah * (1 - Math.cos(f)), g.h / 2 - g.pah * (1 - Math.sin(f))]); }
  const P = [], I = [], halkalar = kesit.map(([dl, z]) => { const bas = P.length / 3; for (const [x, y] of hat(dl)) P.push(x, y, z); return bas; });
  const M2 = hat(0).length;
  for (let h = 0; h < halkalar.length - 1; h++) for (let q = 0; q < M2; q++) {
    const a = halkalar[h] + q, b2 = halkalar[h] + (q + 1) % M2, c = halkalar[h + 1] + q, d = halkalar[h + 1] + (q + 1) % M2;
    I.push(a, b2, d, a, d, c); }
  for (const [h, yukari] of [[0, false], [halkalar.length - 1, true]]) {   // kapaklar (orta noktadan yelpaze)
    const m = P.length / 3; P.push(0, 0, kesit[h][1]);
    for (let q = 0; q < M2; q++) { const a = halkalar[h] + q, b2 = halkalar[h] + (q + 1) % M2; yukari ? I.push(m, a, b2) : I.push(m, b2, a); } }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
  yastikBelek.set(k, geo);
  return geo;
}
// şekil uzayı: x → u (en), y → n (boy), z → v (kalınlık). Sağ el için z = x × y; v'ye ters düşerse y çevrilir (şekil simetrik).
function yastikYerlestir(m, g) {
  const u = V(g.u).normalize(), v = V(g.v).normalize();
  let n = V(g.n).normalize();
  if (new T.Vector3().crossVectors(u, n).dot(v) < 0) n = n.negate();
  m.matrixAutoUpdate = false;
  m.matrix.makeBasis(u, n, v).setPosition(V(g.merkez));
  m.matrixWorldNeedsUpdate = true;
}
const deri = new Map(), mat = new Map(), govdeYastik = new Map();
/** Deri döşeme: ipeksi ama yumuşak parlaklık, pürüzsüz gölgeleme (köşe yuvarlaklığı görünsün) */
function deriMalzemesi(hex) {
  if (!deri.has(hex)) { const c = new T.Color(hex).multiplyScalar(KARANLIK ? 0.72 : 0.95);
    deri.set(hex, new T.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.6, clearcoat: 0.18, clearcoatRoughness: 0.55, sheen: 0.1, sheenRoughness: 0.6, sheenColor: 0x5a5f66 })); }
  return deri.get(hex);
}
/** Egzersiz matı: köpük/lastik, parlamaz, pürüzsüz */
function matMalzemesi(hex) {
  if (!mat.has(hex)) mat.set(hex, new T.MeshStandardMaterial({ color: new T.Color(hex), metalness: 0, roughness: 0.95 }));
  return mat.get(hex);
}
/** Minderin altındaki taşıyıcı levha (kontrplak/çerçeve tonu) */
function govdeYastikMalzemesi(hex) {
  if (!govdeYastik.has(hex)) govdeYastik.set(hex, new T.MeshStandardMaterial({ color: new T.Color(hex).multiplyScalar(KARANLIK ? 0.72 : 1.15), metalness: 0.1, roughness: 0.7 }));
  return govdeYastik.get(hex);
}
/** Egzersiz minderi (16 Eki): lastik/köpük — parlamaz, sheen yok (döşemenin ipeksi parlaklığı alçak açıda koyu minderi açık
 *  griye çeviriyordu) */
const minder = new Map();
function minderMalzemesi(hex) {
  if (!minder.has(hex)) minder.set(hex, new T.MeshStandardMaterial({ color: new T.Color(hex), metalness: 0, roughness: 0.95, flatShading: true, side: T.DoubleSide }));
  return minder.get(hex);
}
function ekipmanKur(h, s, t) {
  const grup = new T.Group(), parcalar = [];
  for (const { geo, renk } of ekipmanIlkelleri(h, s, t)) {
    if (geo.tur === 'p') {
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.Float32BufferAttribute(new Float32Array((geo.P3.length - 2) * 9), 3));
      const m = mesh(bg, geo.malzeme === 'minder' ? minderMalzemesi(renk) : dosemeMalzemesi(renk)); grup.add(m); parcalar.push({ tur: 'p', m });
    } else if (geo.tur === 'c') {
      const m = mesh(kapakli(geo.kenar), geo.metal ? ALET.krom : ALET.kaucuk); grup.add(m); parcalar.push({ tur: 'c', m });
    } else if (geo.tur === 'y') {
      const m = mesh(yastikGeo(geo), geo.malzeme === 'minder' ? matMalzemesi(renk) : geo.malzeme === 'govde' ? govdeYastikMalzemesi(renk) : deriMalzemesi(renk));
      yastikYerlestir(m, geo); grup.add(m); parcalar.push({ tur: 'y', m });
    } else if (geo.tur === 'k') {
      const mat = RENK_MALZEME[renk] ?? (geo.r < 1 ? ALET.celikKablo : geo.r < 3.2 ? ALET.krom : ALET.boyaliCelik);
      const g2 = new T.Group(), c = mesh(GEO.silindir, mat), u1 = mesh(GEO.kure, mat), u2 = mesh(GEO.kure, mat);
      g2.add(c, u1, u2); grup.add(g2); parcalar.push({ tur: 'k', c, u1, u2 });
    } else {
      const m = mesh(GEO.kure, RENK_MALZEME[renk] ?? ALET.krom); grup.add(m); parcalar.push({ tur: 's', m });
    }
  }
  for (const L of h.logolar ?? []) grup.add(logoKur(L));                // parçalar listesine girmez (güncellenmez, sabit)
  return { grup, parcalar };
}
function ekipmanGuncelle(ek, h, s, t, il = ekipmanIlkelleri(h, s, t)) {
  if (il.length !== ek.parcalar.length || il.some(({ geo }, i) => geo.tur !== ek.parcalar[i].tur)) return false;
  il.forEach(({ geo }, i) => {
    const pc = ek.parcalar[i];
    if (pc.tur === 'p') {
      const pos = pc.m.geometry.attributes.position, P = geo.P3;
      for (let j = 1; j < P.length - 1; j++) for (const [n, q] of [[0, P[0]], [1, P[j]], [2, P[j + 1]]]) pos.setXYZ((j - 1) * 3 + n, q[0], q[1], q[2]);
      pos.needsUpdate = true; pc.m.geometry.computeVertexNormals(); pc.m.geometry.computeBoundingSphere();
    } else if (pc.tur === 'c') uzat(pc.m, geo.a3, geo.b3, geo.r);
    else if (pc.tur === 'y') yastikYerlestir(pc.m, geo);
    else if (pc.tur === 'k') {
      uzat(pc.c, geo.a3, geo.b3, geo.r);
      for (const [u, q] of [[pc.u1, geo.a3], [pc.u2, geo.b3]]) { u.position.copy(V(q)); u.scale.setScalar(geo.r); }
    } else { pc.m.position.copy(V(geo.c3)); pc.m.scale.setScalar(geo.r); }
  });
  return true;
}

/* ── Zemin: yumuşak gölge alan görünmez düzlem + sahne ışığı lekesi ── */
function zeminKur() {
  const g = new T.Group();
  const golge = new T.Mesh(new T.PlaneGeometry(900, 900), new T.ShadowMaterial({ opacity: 0.72 }));
  golge.rotation.x = -Math.PI / 2; golge.receiveShadow = true; golge.position.y = 0.05;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d'), gr = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(150,158,170,${KARANLIK ? 0.22 : 0.42})`); gr.addColorStop(0.55, `rgba(120,128,140,${KARANLIK ? 0.08 : 0.18})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
  const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace;
  const leke = new T.Mesh(new T.CircleGeometry(M.ZEMIN_R * 1.7, 64), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
  leke.rotation.x = -Math.PI / 2;
  g.add(leke, golge);
  return g;
}

/* ── Motor: webgl.js motorKur ile AYNI arayüz (ciz(h, t, θ, φ, çerçeve)) + kas/iz ayarı + ms (nabız) ── */
/** `govde`: ./govde.js gövdesi (zorunlu) */
export function motorKur(renderer, { govde }) {
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;   // 14 Eki (Sabri: "ortam çok az daha aydınlık"): 0,92 → 1,0
  renderer.shadowMap.enabled = true;
  // GÖLGE KALİTESİ (8 Eki, telefon hazırlığı): 'vsm' = 2048 + 16 örnekli bulanıklık (masaüstü) · 'pcf' = yumuşak PCF 1024
  // (bulanıklık geçişi yok) · 'pcf512' — ölçüm için seçilebilir
  const GOLGE = globalThis.__golge ?? 'pcf';   // ölçüm 8 Eki: VSM 34,8 ms ↔ PCF 18,3 ms (aynı ekran), görüntü farkı fark edilmiyor
  renderer.shadowMap.type = GOLGE === 'vsm' ? T.VSMShadowMap : T.PCFShadowMap;   // r186: PCFSoftShadowMap kaldırıldı (PCF zaten yumuşak, radius ile)
  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = KARANLIK ? 0.5 : 0.85;
  if (!KARANLIK) scene.add(new T.HemisphereLight(0xdfe6ef, 0x3a3f46, 0.6));   // gökyüzü/zemin dolgu ışığı
  scene.add(govde.nesne);
  const zemin = zeminKur(); scene.add(zemin);
  const ana = new T.DirectionalLight(0xfff6ec, 1.9);
  const harita = GOLGE === 'vsm' ? 2048 : GOLGE === 'pcf512' ? 512 : 1024;
  ana.castShadow = true; ana.shadow.mapSize.set(harita, harita);
  Object.assign(ana.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 10, far: 480 });
  ana.shadow.radius = 7; ana.shadow.blurSamples = 16; ana.shadow.bias = -0.0006; ana.shadow.normalBias = 0.4;
  const kontur = new T.DirectionalLight(0xc8d8f0, 2.4);
  scene.add(ana, ana.target, kontur, kontur.target);
  const izMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
  const izler = Array.from({ length: 19 }, (_, i) => { const m = new T.Mesh(GEO.kure, izMat); m.scale.setScalar(i === 18 ? 1.5 : 0.8); scene.add(m); return m; });
  const kamera = new T.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
  const kameraP = new T.PerspectiveCamera(37, 1, 2, 3000);           // 16 Eki: perspektif (izdüşümü elle kurulur)
  logoDokusu();                                                          // logo dokusu motor açılırken yüklensin (ilk çizimde boş kalmasın)
  const ekipmanlar = new Map();
  let aktif = null, aktifH = null;
  const ayar = { kas: true, iz: true, id: null };

  const ekipmanTak = (h, s, t, yeniden = false) => {
    if (aktif) scene.remove(aktif.grup);
    aktif = (!yeniden && ekipmanlar.get(h)) || ekipmanKur(h, s, t);
    ekipmanlar.set(h, aktif); scene.add(aktif.grup);
  };
  const hareketeGec = (h, s, t) => {
    ekipmanTak(h, s, t);
    zemin.position.set(h.merkez[0], 0, h.merkez[2]);
    ana.position.set(h.merkez[0] + 50, 230, h.merkez[2] + 70);
    ana.target.position.set(h.merkez[0], 40, h.merkez[2]);
    const yol = M.IZ_GORUNUR ? M.izYolu(h) : [];          // 14 Eki: iz gizli (Sabri)
    izler.forEach((m, i) => { m.visible = i < yol.length; if (m.visible) m.position.copy(V(yol[i])); });
    aktifH = h;
  };

  return {
    ayar,
    /** ISINMA (8 Eki): ilk çizimde gölgelendirici derlemesi ana iş parçacığını ~1,2 sn kilitliyordu (hareket ekranına
     * geçiş donuyordu). Açılıştaki arka plan yüklemesinde bir hareketin sahnesi kurulur ve programlar ASENKRON derlenir
     * (KHR_parallel_shader_compile); ardından küçük bir çizim gölge geçişini de ısıtır. */
    async isit(h) {
      const s = M.an(h, 0);
      hareketeGec(h, s, 0);
      govde.guncelle(s, { ...ayar, nabiz: 1, ilkeller: ekipmanIlkelleri(h, s, 0), h, kasGuc: 1 });
      const c = M.sigdir(M.cerceve(h, ...h.kamera, 'donen'), 1);
      Object.assign(kamera, { left: c.sol, right: c.sag, top: c.ust, bottom: c.alt }); kamera.position.set(300, 300, 300); kamera.lookAt(0, 0, 0);
      kamera.updateProjectionMatrix();
      if (renderer.compileAsync) await renderer.compileAsync(scene, kamera);
      // gölge geçişinin derinlik programları yalnız gerçek çizimde derlenir → 1×1 piksellik bir çizim
      const boy = renderer.getSize(new T.Vector2());
      renderer.setSize(1, 1, false); renderer.render(scene, kamera); renderer.setSize(boy.x || 1, boy.y || 1, false);
    },
    ciz(h, t, teta, fi, c, ms = 0) {
      const s = M.an(h, t);
      if (aktifH !== h) hareketeGec(h, s, t);
      const nabiz = 0.8 + 0.2 * Math.sin(ms / 420);
      const ilkeller = ekipmanIlkelleri(h, s, t);                       // karede BİR kez (eskiden iki kez üretiliyordu)
      // döngüsel harekette (kardiyo) kas ve taraf başına etkinlik: hareketin kasAktif(t)'si (16 Eki)
      // tek taraflı harekette (tek kol kürek, yan plank — 17 Eki) kasAktif yalnız TARAFI verir; evre (kuvvet/gevşeme) yine kasEvresi'nden
      govde.guncelle(s, { ...ayar, nabiz, ilkeller, h, kasGuc: ayar.kas ? (h.kasAktif && h.dongu ? 1 : kasEvresi(ayar.id, h, s, t)) : 0, kasYan: ayar.kas && h.kasAktif ? h.kasAktif(t) : null });
      izler.forEach(m => { if (!ayar.iz) m.visible = false; });
      if (ayar.iz && !h.statik && M.IZ_GORUNUR) izler.forEach(m => { m.visible = true; });
      if (!ekipmanGuncelle(aktif, h, s, t, ilkeller)) { ekipmanTak(h, s, t, true); ekipmanGuncelle(aktif, h, s, t, ilkeller); }
      const cT = Math.cos(M.rd(teta)), sT = Math.sin(M.rd(teta)), cF = Math.cos(M.rd(fi)), sF = Math.sin(M.rd(fi));
      const yon = [sT * cF, sF, cT * cF];
      // 16 Eki: çerçeve D taşıyorsa PERSPEKTİF — kamera eksen merkezinin (c.eksen) D uzağında, pencere hedef düzleminde c
      const kam = c.D ? kameraP : kamera;
      if (c.D) {
        const R = [cT, 0, -sT], U = [-sT * sF, cF, -cT * sF], [ex, ey] = c.eksen, T0 = [R[0] * ex + U[0] * ey, R[1] * ex + U[1] * ey, R[2] * ex + U[2] * ey];
        kameraP.position.set(T0[0] + yon[0] * c.D, T0[1] + yon[1] * c.D, T0[2] + yon[2] * c.D);
        kameraP.up.set(0, 1, 0); kameraP.lookAt(T0[0], T0[1], T0[2]);
        const yakin = 2, k = yakin / c.D;
        kameraP.near = yakin; kameraP.far = c.D + 2000;
        kameraP.projectionMatrix.makePerspective((c.sol - ex) * k, (c.sag - ex) * k, (c.ust - ey) * k, (c.alt - ey) * k, yakin, c.D + 2000);
        kameraP.projectionMatrixInverse.copy(kameraP.projectionMatrix).invert();
      } else {
        kamera.position.set(yon[0] * 600, yon[1] * 600, yon[2] * 600);
        kamera.up.set(0, 1, 0); kamera.lookAt(0, 0, 0);
        Object.assign(kamera, { left: c.sol, right: c.sag, top: c.ust, bottom: c.alt });
        kamera.updateProjectionMatrix();
      }
      kontur.position.set(h.merkez[0] - yon[0] * 300, 230, h.merkez[2] - yon[2] * 300);
      kontur.target.position.set(h.merkez[0], 60, h.merkez[2]);
      renderer.render(scene, kam);
    },
  };
}
