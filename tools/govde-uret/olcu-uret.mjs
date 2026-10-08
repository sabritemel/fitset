/**
 * ÖLÇÜ TABLOSU ÜRETİCİSİ — node tools/govde-uret/olcu-uret.mjs
 *
 * B1 (7 Eki 2026, docs/2026-10-07-b1-veri-modeli-v2-PLAN.md): hareket verisi eski parçalı mankenin
 * ölçüleriyle yazılmıştı (omuz yarı eni 14, üst kol 31 …); ürün mankeni C'nin (MakeHuman) ölçüleri çok
 * farklı (omuz 20,4, üst kol 26,1 …). Tek kaynak: C'nin kendi iskeleti. Bu betik govde.glb'nin
 * dinlenme iskeletinden ölçüleri çıkarır ve
 *   · js/anim3d/olcu.js     → uygulamanın hareket motoru (çalışma anında glb okumaz)
 *   · govde-mh/govde.json   → künyeye "olcu" alanı
 * yazar. Elle sayı yok: gövde yeniden üretilince bu betik yeniden koşar, `--denetle` farkı yakalar.
 *
 * Tanımlar (veri uzayı, cm, y yukarı, mankenin önü +z dinlenmede):
 *   P (kalça merkezi)   = iki kalça ekleminin (thigh_l/r) ortası
 *   torso               = P → boyun kemiği (neck_01) düşey
 *   omuz                = omuz eklemi (upperarm) boyuna göre: yan, aşağı, ön
 *   ua · fa             = upperarm→lowerarm · lowerarm→hand (bilek)
 *   elKavrama           = bilek → avuçtaki kavrama noktası (bilek→orta parmak kökünün %78'i; kavrama pozunda ölçülen)
 *   th · sh             = thigh→calf · calf→foot (ayak bileği)
 *   ayakBilek           = ayak bileğinin tabandan yüksekliği (ayakta, düz tabanda)
 *   govde               = gövde kesiti (yarı en, yarı derinlik, merkezin öne kayması) — kolun gövdeye girmemesi
 *   ayakBoy             = ayak bileği → ayak parmak kökü (ball) yatay · parmakUcu = bilek → ayak ucu
 *   kafa                = baş derisi (başa ≥ %50 bağlı köşeler) kutusunun merkezi boyuna göre (yuk, on) + yarı ölçüler
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GLB = path.join(KOK, 'tools/proto-stil/govde-mh/govde.glb');
const KUNYE = path.join(KOK, 'tools/proto-stil/govde-mh/govde.json');
const CIKTI = path.join(KOK, 'js/anim3d/olcu.js');

/* ── GLB: JSON + BIN parçaları ── */
const buf = fs.readFileSync(GLB);
const jsonUz = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.subarray(20, 20 + jsonUz).toString('utf8'));
const binBas = 20 + jsonUz + 8;
const bin = buf.subarray(binBas);
const deri = gltf.skins[0];
const acc = gltf.accessors[deri.inverseBindMatrices], bv = gltf.bufferViews[acc.bufferView];
const ibm = new Float32Array(bin.buffer.slice(bin.byteOffset + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0),
  bin.byteOffset + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0) + acc.count * 64));

/** 4×4 sütun-öncelikli ters matrisin öteleme kısmı (kemiğin dinlenmedeki dünya konumu) */
function konum(m) {
  // genel 4×4 tersin yalnız öteleme satırı (inv[12..14]) ve determinant gerekir
  const a = Array.from(m), inv = new Array(16);
  inv[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
  inv[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
  inv[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
  // determinant: ilk satır kofaktörleri
  const c0 = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
  const c4 = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
  const c8 = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
  const c12 = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
  const D = a[0] * c0 + a[1] * c4 + a[2] * c8 + a[3] * c12;
  return [inv[12] / D * 100, inv[13] / D * 100, inv[14] / D * 100];   // m → cm
}
const adlar = deri.joints.map(j => gltf.nodes[j].name);
const K = {};
adlar.forEach((n, j) => { K[n] = konum(ibm.subarray(j * 16, j * 16 + 16)); });
const gerek = ['thigh_l', 'thigh_r', 'calf_l', 'foot_l', 'ball_l', 'neck_01', 'head', 'upperarm_l', 'lowerarm_l', 'hand_l', 'middle_01_l', 'clavicle_l', 'spine_03'];
for (const n of gerek) if (!K[n]) { console.error(`✗ kemik yok: ${n}`); process.exit(1); }

const fark = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], uz = v => Math.hypot(...v);
const r1 = x => Math.round(x * 10) / 10;

/* ── zemin: ayak altındaki en düşük köşe (mesh POSITION min y) ── */
const prim = gltf.meshes.find(m => m.primitives?.[0]?.attributes?.JOINTS_0)?.primitives[0];
const zeminY = gltf.accessors[prim.attributes.POSITION].min[1] * 100;

/** accessor → düz dizi (VEC3 float, VEC4 ubyte/ushort/float) */
function oku(i) {
  const a = gltf.accessors[i], v = gltf.bufferViews[a.bufferView], bas = bin.byteOffset + (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type] * a.count;
  const Tip = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array }[a.componentType];
  const adim = v.byteStride, boy = Tip.BYTES_PER_ELEMENT, bil = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  if (!adim || adim === boy * bil) return new Tip(bin.buffer.slice(bas, bas + n * boy));
  const o = new Tip(n), dv = new DataView(bin.buffer, bas);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < bil; c++) {
    const off = k * adim + c * boy;
    o[k * bil + c] = Tip === Float32Array ? dv.getFloat32(off, true) : Tip === Uint16Array ? dv.getUint16(off, true) : dv.getUint8(off);
  }
  return o;
}
/* ── gövde kesiti (kolun gövdeye girmemesi için): omurgaya ≥ %60 bağlı köşelerin yarı eni / derinliği ──
 *    Çizicinin (js/anim3d/c/govde.js · GOVDE_KESIT) AYNI tanımı. */
const POS = oku(prim.attributes.POSITION), JN = oku(prim.attributes.JOINTS_0), WT = oku(prim.attributes.WEIGHTS_0);
const wOlcek = gltf.accessors[prim.attributes.WEIGHTS_0].componentType === 5126 ? 1 : gltf.accessors[prim.attributes.WEIGHTS_0].componentType === 5121 ? 255 : 65535;
const SP = new Set(['spine_01', 'spine_02', 'spine_03'].map(n => deri.joints.findIndex(j => gltf.nodes[j].name === n)));
let xMax = 0, zMin = 9, zMax = -9;
for (let k = 0; k < POS.length / 3; k++) {
  let w = 0; for (let c = 0; c < 4; c++) if (SP.has(JN[k * 4 + c])) w += WT[k * 4 + c] / wOlcek;
  if (w < 0.6) continue;
  xMax = Math.max(xMax, Math.abs(POS[k * 3])); zMin = Math.min(zMin, POS[k * 3 + 2]); zMax = Math.max(zMax, POS[k * 3 + 2]);
}

/* ── baş (8 Eki): verinin kafa noktası boyundan düz yukarıdaydı, C'nin yüzü o noktadan 17,8 cm öndeydi → halat
 *    yüze girerken fizik denetimi göremiyordu. Başa ≥ %50 bağlı köşelerin kutusundan merkez + yarıçap. ── */
const HB = deri.joints.findIndex(j => gltf.nodes[j].name === 'head');
const bMin = [9, 9, 9], bMax = [-9, -9, -9];
for (let k = 0; k < POS.length / 3; k++) {
  let w = 0; for (let c = 0; c < 4; c++) if (JN[k * 4 + c] === HB) w += WT[k * 4 + c] / wOlcek;
  if (w < 0.5) continue;
  for (let c = 0; c < 3; c++) { bMin[c] = Math.min(bMin[c], POS[k * 3 + c]); bMax[c] = Math.max(bMax[c], POS[k * 3 + c]); }
}
const basM = bMin.map((v, i) => (v + bMax[i]) * 50);                 // cm

/* ── uyluk ve baldır kalınlığı (8 Eki): bar/dambıl/kablo denetimi bacağı eski kapsülle (7,8 / 5,8) ölçüyordu, C daha
 *    kalın → V-bar kolu uyluğa giriyordu. Kemiğe ≥ %60 bağlı köşelerin kemik ekseninden en uzak (yanal) mesafesi. ── */
const eksenUzak = (ad, a, b) => {
  const j = deri.joints.findIndex(x => gltf.nodes[x].name === ad), ab = fark(b, a), L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  const r = [];
  for (let k = 0; k < POS.length / 3; k++) {
    let w = 0; for (let c = 0; c < 4; c++) if (JN[k * 4 + c] === j) w += WT[k * 4 + c] / wOlcek;
    if (w < 0.6) continue;
    const p = [0, 1, 2].map(c => POS[k * 3 + c] * 100), ap = fark(p, a), u = (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L2;
    if (u < 0.25 || u > 0.75) continue;                                 // kemik ortası (bar/dambılın değdiği yer); eklem uçlarındaki kabarıklık değil
    r.push(uz(fark(p, a.map((v, i) => v + ab[i] * u))));
  }
  // %90'lık değer: en uzak köşe uyluğun ÖN kabarıklığı (kemik bacağın arkasında, ön yüz 12 cm önde) — tek yarıçaplı
  // kapsül onu her yöne yayınca yandaki dambılı (hammer curl) yanlış yere "gömüyordu"
  r.sort((x, y) => x - y); return r[Math.floor(0.9 * (r.length - 1))];
};

const P = K.thigh_l.map((v, i) => (v + K.thigh_r[i]) / 2);
/* ── sırt ve kalça arkası (8 Eki): sırtüstü harekette sırt sehpadan 3,4 cm, baş 7 cm havadaydı — veri temas
 *    mesafesini eski kapsülün yarıçapından (göğüs 12,5) alıyordu. Gövde ekseni (P → boyun) arkasındaki en derin deri:
 *    sırt = omurganın (spine_02/03) arkası · kalcaArka = kalçanın (pelvis) arkası. ── */
const SP23 = new Set(['spine_02', 'spine_03'].map(n => deri.joints.findIndex(j => gltf.nodes[j].name === n)));
const PEL = deri.joints.findIndex(j => gltf.nodes[j].name === 'pelvis');
const eksenZ = y => P[2] + (K.neck_01[2] - P[2]) * (y - P[1]) / (K.neck_01[1] - P[1]);
let sirtD = 0, kalcaD = 0;
for (let k = 0; k < POS.length / 3; k++) {
  let ws = 0, wp = 0; for (let c = 0; c < 4; c++) { const j = JN[k * 4 + c], w = WT[k * 4 + c] / wOlcek; if (SP23.has(j)) ws += w; if (j === PEL) wp += w; }
  const y = POS[k * 3 + 1] * 100, d = eksenZ(y) - POS[k * 3 + 2] * 100;
  if (ws >= 0.6) sirtD = Math.max(sirtD, d);
  if (wp >= 0.5) kalcaD = Math.max(kalcaD, d);
}
const omz = fark(K.upperarm_l, K.neck_01);
const elUc = K.middle_01_l, bilek = K.hand_l;
const ayakUcu = (() => {   // ayak ucu: ball → ball_leaf varsa, yoksa ball'dan %60 ileri
  if (K.ball_leaf_l) return K.ball_leaf_l;
  const d = fark(K.ball_l, K.foot_l); return K.ball_l.map((v, i) => v + d[i] * 0.6);
})();

const olcu = {
  boy: r1(K.head[1] - zeminY + 12),                     // baş kemiği → tepe ~12 cm (bilgi amaçlı)
  torso: r1(K.neck_01[1] - P[1]),
  bas: r1(uz(fark(K.head, K.neck_01))),
  // baş derisi kutusunun merkezi (boyuna göre) + yarı en / yarı boy / yarı derinlik (yüz → ense)
  kafa: { yuk: r1(basM[1] - K.neck_01[1]), on: r1(basM[2] - K.neck_01[2]),
    yariEn: r1((bMax[0] - bMin[0]) * 50), yariBoy: r1((bMax[1] - bMin[1]) * 50), yariDerin: r1((bMax[2] - bMin[2]) * 50) },
  omuz: { yan: r1(Math.abs(omz[0])), asagi: r1(-omz[1]), on: r1(omz[2]) },
  kalcaYan: r1(Math.abs(K.thigh_l[0] - P[0])),
  ua: r1(uz(fark(K.lowerarm_l, K.upperarm_l))),
  fa: r1(uz(fark(K.hand_l, K.lowerarm_l))),
  elKavrama: r1(uz(fark(elUc, bilek)) * 0.78),          // kavrama pozunda ölçülen bilek → bar merkezi (çizici EL_OFSET 8,9 cm)
  th: r1(uz(fark(K.calf_l, K.thigh_l))),
  sh: r1(uz(fark(K.foot_l, K.calf_l))),
  ayakBilek: r1(K.foot_l[1] - zeminY),
  ayakBoy: r1(Math.hypot(K.ball_l[0] - K.foot_l[0], K.ball_l[2] - K.foot_l[2])),
  topYuk: r1(K.ball_l[1] - zeminY),                     // parmak kökü ekleminin tabandan yüksekliği (ayak düz basarken)
  parmakUcu: r1(Math.hypot(ayakUcu[0] - K.foot_l[0], ayakUcu[2] - K.foot_l[2])),
  kalcaYuk: r1(P[1] - zeminY),                          // ayakta kalça merkezi yüksekliği
  gogus: r1(K.spine_03[1] - P[1]),                      // göğüs omurgası yüksekliği (bilgi)
  govde: { yariEn: r1(xMax * 100), yariDerin: r1((zMax - zMin) * 50), merkezOn: r1((zMax + zMin) * 50) },
  sirt: r1(sirtD),                                      // gövde ekseninden sırt derisine (sırtüstü temas)
  kalcaArka: r1(kalcaD),                                // kalça ekleminden kalça arkası derisine
  uyluk: r1(eksenUzak('thigh_l', K.thigh_l, K.calf_l)), // uyluk kemiğinden derinin %90'lık uzaklığı (bar/dambıl denetimi)
  baldir: r1(eksenUzak('calf_l', K.calf_l, K.foot_l)),
};

const kaynak = `/**
 * C MANKENİNİN ÖLÇÜLERİ (cm) — ÜRETİLMİŞ DOSYA, ELLE DÜZENLEME.
 * Kaynak: tools/proto-stil/govde-mh/govde.glb · üretici: node tools/govde-uret/olcu-uret.mjs
 * Hareket motoru (manken3d.js) ve hareket verisi (hareketler3d.js) oranlarını buradan alır.
 * Tanımlar betiğin başında.
 */
export const OLCU = ${JSON.stringify(olcu, null, 2).replace(/"(\w+)":/g, '$1:')};
`;

const denetle = process.argv.includes('--denetle');
const mevcut = fs.existsSync(CIKTI) ? fs.readFileSync(CIKTI, 'utf8') : '';
if (denetle) {
  if (mevcut !== kaynak) { console.error('✗ js/anim3d/olcu.js govde.glb ile uyuşmuyor — node tools/govde-uret/olcu-uret.mjs'); process.exit(1); }
  console.log('✓ olcu.js govde.glb ile uyumlu');
} else {
  fs.writeFileSync(CIKTI, kaynak);
  const kunye = JSON.parse(fs.readFileSync(KUNYE, 'utf8'));
  kunye.olcu = olcu;
  fs.writeFileSync(KUNYE, JSON.stringify(kunye, null, 2) + '\n');
  console.log('✓ yazıldı: js/anim3d/olcu.js · govde.json.olcu');
  console.log(olcu);
}
