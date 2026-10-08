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
      ['uylukOn' + k]: dizArka.map(x => -x), ['uylukArka' + k]: dizArka, ['baldirArka' + k]: parmak.map(x => -x) });
  }
  return yon;
}

export const HAREKET_KAS = {
  bb_bench_press: [['gogus'], ['onOmuz', 'triceps']],
  db_bench_fly: [['gogus'], ['onOmuz']],
  machine_incline_press: [['gogus'], ['onOmuz', 'triceps']],
  db_shoulder_press: [['omuz'], ['triceps']],
  cable_front_raise: [['onOmuz'], []],
  machine_reverse_fly: [['arkaOmuz'], ['sirtOrta']],
  cable_vbar_pushdown: [['triceps'], []],
  db_overhead_ext: [['triceps'], [], { taraf: 'A' }],   // tek kol: yalnız çalışan kol
  plank: [['karin'], []],
  cable_close_pulldown: [['lat'], ['biceps']],
  db_two_arm_row: [['sirtOrta'], ['arkaOmuz', 'biceps']],
  cable_seated_row: [['sirtOrta'], ['biceps']],
  cable_curl: [['biceps'], []],
  db_hammer_curl: [['biceps'], ['onKol']],
  machine_leg_press: [['kuadriseps'], ['kalca']],
  lunge: [['kuadriseps'], ['kalca', 'arkaBacak']],
  calf_raise: [['baldir'], []],
};
/* ── KAS EVRESİ (8 Eki akşam, Sabri: "manken güç harcarken — halatı çekerken, dambılı kaldırırken, plankta gergin
   dururken — vurgu yansın; halatı bırakırken, dambıl aşağıdayken ve kolda yük yokken sönsün").
   Her hareketin t=0 pozu DİNLENME ucudur (r = 0); r hareketin dinlenmeden uzaklığı (0…1).
   KAS_EVRE: +1 güç evresi dinlenmeden UZAKLAŞIRKEN (curl, kürek, çekiş, kaldırma, pres yukarı) ·
             −1 güç evresi dinlenmeye DÖNERKEN (bench press ve fly yukarı, triceps baş üstü uzatma, leg press itiş,
                lunge kalkış) · 0 sürekli gergin (plank).
   Yön kareden kareye r'nin değişiminden okunur; duran karede (dokunulmamış görüntü) yalnız konum belirler. */
export const KAS_EVRE = { bb_bench_press: -1, db_bench_fly: -1, db_overhead_ext: -1, machine_leg_press: -1, lunge: -1, plank: 0 };
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
  kuadriseps: 'Uyluk ön', arkaBacak: 'Arka bacak', kalca: 'Kalça', baldir: 'Baldır' };

/* ── Ekipman — hareketin KENDİ tanımından (webgl.js ile aynı ilkel toplama) ── */
function kaydedici(D) { return q => [q[0], q[1], q[0] * D[0] + q[1] * D[1] + q[2] * D[2]]; }
const D0 = M.birim([0.31, 0.53, 0.79]);
function ekipmanIlkelleri(h, s, t) {
  const hepsi = [...h.ekipman(kaydedici(D0), s, t), ...h.ekipman(kaydedici(D0.map(x => -x)), s, t)];
  const gor = new Set(), o = [];
  for (const e of hepsi) {
    if (!e.geo) continue;
    const g = e.geo, anahtar = g.tur === 'p' ? 'p' + g.P3.map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';')
      : g.tur === 'k' || g.tur === 'c' ? g.tur + [g.a3, g.b3].map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';') + g.r : 's' + g.c3.join(',') + g.r;
    if (gor.has(anahtar)) continue;
    gor.add(anahtar);
    const renkler = [...e.svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)].map(m => m[1]).filter(c => c.toLowerCase() !== '#0a0b0d');
    o.push({ geo: g, renk: renkler.at(-1) ?? '#5d646d' });
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
};
const doseme = new Map();
function dosemeMalzemesi(hex) {
  if (!doseme.has(hex)) {
    const c = new T.Color(hex).multiplyScalar(KARANLIK ? 0.72 : 1.25);
    doseme.set(hex, new T.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.6, clearcoat: 0.15,
      clearcoatRoughness: 0.5, sheen: 0.12, sheenRoughness: 0.6, sheenColor: 0x6a6f76, flatShading: true, side: T.DoubleSide }));
  }
  return doseme.get(hex);
}
function ekipmanKur(h, s, t) {
  const grup = new T.Group(), parcalar = [];
  for (const { geo, renk } of ekipmanIlkelleri(h, s, t)) {
    if (geo.tur === 'p') {
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.Float32BufferAttribute(new Float32Array((geo.P3.length - 2) * 9), 3));
      const m = mesh(bg, dosemeMalzemesi(renk)); grup.add(m); parcalar.push({ tur: 'p', m });
    } else if (geo.tur === 'c') {
      const m = mesh(kapakli(geo.kenar), geo.metal ? ALET.krom : ALET.kaucuk); grup.add(m); parcalar.push({ tur: 'c', m });
    } else if (geo.tur === 'k') {
      const mat = geo.r < 1 ? ALET.celikKablo : geo.r < 3.2 ? ALET.krom : ALET.boyaliCelik;
      const g2 = new T.Group(), c = mesh(GEO.silindir, mat), u1 = mesh(GEO.kure, mat), u2 = mesh(GEO.kure, mat);
      g2.add(c, u1, u2); grup.add(g2); parcalar.push({ tur: 'k', c, u1, u2 });
    } else {
      const m = mesh(GEO.kure, ALET.krom); grup.add(m); parcalar.push({ tur: 's', m });
    }
  }
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
  renderer.toneMappingExposure = 0.92;
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
    const yol = M.izYolu(h);
    izler.forEach((m, i) => { m.visible = i < yol.length; if (m.visible) m.position.copy(V(yol[i])); });
    aktifH = h;
  };

  return {
    ayar,
    ciz(h, t, teta, fi, c, ms = 0) {
      const s = M.an(h, t);
      if (aktifH !== h) hareketeGec(h, s, t);
      const nabiz = 0.8 + 0.2 * Math.sin(ms / 420);
      const ilkeller = ekipmanIlkelleri(h, s, t);                       // karede BİR kez (eskiden iki kez üretiliyordu)
      govde.guncelle(s, { ...ayar, nabiz, ilkeller, h, kasGuc: ayar.kas ? kasEvresi(ayar.id, h, s, t) : 0 });
      izler.forEach(m => { if (!ayar.iz) m.visible = false; });
      if (ayar.iz && !h.statik) izler.forEach(m => { m.visible = true; });
      if (!ekipmanGuncelle(aktif, h, s, t, ilkeller)) { ekipmanTak(h, s, t, true); ekipmanGuncelle(aktif, h, s, t, ilkeller); }
      const cT = Math.cos(M.rd(teta)), sT = Math.sin(M.rd(teta)), cF = Math.cos(M.rd(fi)), sF = Math.sin(M.rd(fi));
      const yon = [sT * cF, sF, cT * cF];
      kamera.position.set(yon[0] * 600, yon[1] * 600, yon[2] * 600);
      kamera.up.set(0, 1, 0); kamera.lookAt(0, 0, 0);
      Object.assign(kamera, { left: c.sol, right: c.sag, top: c.ust, bottom: c.alt });
      kamera.updateProjectionMatrix();
      kontur.position.set(h.merkez[0] - yon[0] * 300, 230, h.merkez[2] - yon[2] * 300);
      kontur.target.position.set(h.merkez[0], 60, h.merkez[2]);
      renderer.render(scene, kamera);
    },
  };
}
