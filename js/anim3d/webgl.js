/**
 * WEBGL MANKEN — uygulamanın 3B çizicisi (yedeği manken3d.js'in SVG çizimi; seçim anim3d/sahne.js'te)
 *
 * Sabri (24 Eyl): "yüz şekli, kafa şekli gerçeklerden çok farklı, mutasyon gibi — daha profesyonel
 * uygulamalar kullanabilirsin, ama ticari kullanımda sorun olmasın."
 *
 * Çizici three.js (MIT, r186 alt kümesi → js/vendor/three.min.js; lisans metni yanında ve paketin
 * başında; yeniden üretmek için tools/three-giris.js). Sabri 24 Eyl'de onayladı: "girsin, SVG yedekle".
 * ⭐ HAREKET MOTORU DEĞİŞMEDİ: iskelet `an(h, t)` ile manken3d.js'ten, ekipman hareketin KENDİ
 * `ekipman()` tanımından gelir. Fizik denetimi konum tabanlı olduğu için bu çiziciden etkilenmez —
 * yalnız GÖRÜNÜŞ değişir.
 *
 * Figür: çizim mankeni geleneği (yüzsüz, mafsallı) — kas profilli uzuvlar (lathe), görünür eklem
 * küreleri, enine geniş / derinliğine dar gövde, öne-aşağı eğik yumurta kafa. Ölçüler SVG motorunun
 * temas yarıçaplarıyla UYUMLU tutulur (sırt 12,5 · kafa arkası 10 · ayak tabanı 3,6) — sehpaya
 * yatan beden sehpaya DEĞER, havada durmaz.
 */
import * as T from '../vendor/three.min.js';
import * as M from './manken3d.js';

const V = a => new T.Vector3(a[0], a[1], a[2]);
const Y = new T.Vector3(0, 1, 0);
const { R } = M;

/* ── Malzemeler ─────────────────────────────────────────────────────────── */
const MAT = {
  beden: new T.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.58, metalness: 0 }),
  eklem: new T.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.5, metalness: 0 }),
  zemin: new T.MeshStandardMaterial({ color: 0x15181c, roughness: 0.95, metalness: 0 }),
  iz: new T.MeshBasicMaterial({ color: 0xb0606c }),
};
const ekipmanMat = new Map();
/** SVG rengi → ışıklı malzeme. SVG tonları düz dolgu içindi (koyu); ışık altında okunsun diye açılır. */
function ekipmanMalzemesi(hex, metal) {
  const k = hex + (metal ? 'm' : '');
  if (!ekipmanMat.has(k)) {
    const c = new T.Color(hex); c.multiplyScalar(1.9);
    ekipmanMat.set(k, new T.MeshStandardMaterial({ color: c, roughness: metal ? 0.38 : 0.8, metalness: metal ? 0.55 : 0,
      flatShading: !metal, side: T.DoubleSide }));
  }
  return ekipmanMat.get(k);
}

/* ── Geometriler (paylaşılan) ───────────────────────────────────────────── */
/** Kas profili: t 0→1 boyunca yarıçap; birim boyda (Y ekseni 0..1) lathe */
const profil = (noktalar, n = 16) => {
  const P = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let j = 0; while (j < noktalar.length - 2 && t > noktalar[j + 1][0]) j++;
    const [t0, r0] = noktalar[j], [t1, r1] = noktalar[j + 1], u = (t - t0) / (t1 - t0);
    const e = u * u * (3 - 2 * u);                                         // yumuşak geçiş
    P.push(new T.Vector2(r0 + (r1 - r0) * e, t));
  }
  return new T.LatheGeometry(P, 20);
};
const GEO = {
  ustKol: profil([[0, 5.3], [0.35, 5.7], [1, 4.3]]),
  onKol: profil([[0, 4.3], [0.25, 4.7], [1, 3.1]]),
  uyluk: profil([[0, 7.9], [0.4, 7.1], [1, 5.3]]),
  baldir: profil([[0, 5.3], [0.3, 5.9], [1, 3.4]]),
  boyun: profil([[0, 5.0], [1, 4.2]], 6),
  kure: new T.SphereGeometry(1, 20, 14),
  // ⚠️ CylinderGeometry MERKEZLİDİR (y −0,5…0,5); lathe'ler 0…1. uzat() a noktasından başlatır →
  // öteleme şart, yoksa her silindir yarı boyu kadar kayar (omuz kuşağı omuzdan dışarı taştı, ölçüldü).
  silindir: new T.CylinderGeometry(1, 1, 1, 18, 1, true).translate(0, 0.5, 0),
};
/** Yumurta kafa (yüzsüz): üstü geniş kafatası, altı sivrilen çene — lathe, ekseni öne-aşağı eğilecek */
const KAFA = { yari: 12, rMax: 9.2, en: 0.84, egim: 24 };   // boy 24 · derinlik ~19 · en ~16 (baş/boy ≈ 1/7,5)
GEO.kafa = (() => {
  const P = [];
  for (let i = 0; i <= 24; i++) {
    const y = -1 + 2 * i / 24;
    const r = Math.sqrt(Math.max(0, 1 - y * y)) * (1 + 0.2 * y) * KAFA.rMax;
    P.push(new T.Vector2(Math.max(r, 1e-3), y * KAFA.yari));
  }
  return new T.LatheGeometry(P, 28);
})();

/* ── Yardımcılar ────────────────────────────────────────────────────────── */
const mesh = (geo, mat, golgeli = true) => { const m = new T.Mesh(geo, mat); m.castShadow = golgeli; m.receiveShadow = true; return m; };
/** a→b arasına Y ekseni birim boylu geometriyi yerleştir (lathe/silindir) */
function uzat(m, a, b, enX = 1, enZ = enX) {
  const A = V(a), B = V(b), d = B.clone().sub(A), L = d.length() || 1e-6;
  m.position.copy(A);
  m.quaternion.setFromUnitVectors(Y, d.divideScalar(L));
  m.scale.set(enX, L, enZ);
}
/** Yönlü elipsoit: merkez + üç eksen (birim) + üç yarıçap */
const eksenMatris = new T.Matrix4();
function elipsoit(m, merkez, [ex, ey, ez], [rx, ry, rz]) {
  eksenMatris.makeBasis(V(ex), V(ey), V(ez));
  m.quaternion.setFromRotationMatrix(eksenMatris);
  m.position.copy(V(merkez));
  m.scale.set(rx, ry, rz);
}
const cap = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** g'ye dik, v yönünde birim (ortogonalleştir) */
const dik = (v, g) => M.birim(M.fark(v, M.ekle([0, 0, 0], g, M.nokta(v, g))));
/** Sağ elli taban: ileri f, yukarı g → sol = g × f */
const taban = (g, f) => { const F = dik(f, g); return [cap(g, F), g, F]; };

/* ── Figür ──────────────────────────────────────────────────────────────── */
export function figurKur() {
  const grup = new T.Group();
  const p = {};
  const ekle = (ad, m) => { p[ad] = m; grup.add(m); return m; };
  for (const k of ['A', 'B']) {
    ekle('ustKol' + k, mesh(GEO.ustKol, MAT.beden)); ekle('onKol' + k, mesh(GEO.onKol, MAT.beden));
    ekle('uyluk' + k, mesh(GEO.uyluk, MAT.beden)); ekle('baldir' + k, mesh(GEO.baldir, MAT.beden));
    ekle('el' + k, mesh(GEO.kure, MAT.beden)); ekle('ayak' + k, mesh(GEO.kure, MAT.beden));
    ekle('omuz' + k, mesh(GEO.kure, MAT.eklem)); ekle('dirsek' + k, mesh(GEO.kure, MAT.eklem));
    ekle('bilek' + k, mesh(GEO.kure, MAT.eklem)); ekle('kalca' + k, mesh(GEO.kure, MAT.eklem));
    ekle('diz' + k, mesh(GEO.kure, MAT.eklem)); ekle('topuk' + k, mesh(GEO.kure, MAT.eklem));
  }
  ekle('gogus', mesh(GEO.kure, MAT.beden)); ekle('karin', mesh(GEO.kure, MAT.beden)); ekle('pelvis', mesh(GEO.kure, MAT.beden));
  ekle('omuzKusak', mesh(GEO.silindir, MAT.beden));
  ekle('boyun', mesh(GEO.boyun, MAT.beden)); ekle('kafa', mesh(GEO.kafa, MAT.beden));
  return { grup, p };
}

/** Kafanın yüz yönündeki merkez kayması: arkası tam R.kafa'da dursun (sehpaya DEĞSİN) — kurulumda ölçülür */
const kafaOfset = (() => {
  const e = M.rd(KAFA.egim), pos = GEO.kafa.attributes.position;
  let arka = 0;
  for (let i = 0; i < pos.count; i++) {                                   // yerel: x yan, y eksen, z ileri
    const x = pos.getX(i) * KAFA.en, y = pos.getY(i), z = pos.getZ(i);
    const ileri = z * Math.cos(e) - y * Math.sin(e);                      // ekseni geriye eğ → çene öne
    arka = Math.max(arka, -ileri);
  }
  return arka - R.kafa;                                                   // + ise merkez öne kayar (arka yüzey tam R.kafa'da)
})();

export function figurGuncelle(fg, s) {
  const { p } = fg;
  const ileri = M.birim(cap(s.g, s.yan));                                 // gövdenin önü (iskeletle aynı tanım)
  const [sol, yuk, on] = taban(s.g, ileri);
  const G = (x, k) => M.ekle(s.P, s.g, k);
  // Gövde: enine geniş, derinliğine dar (sırt yarıçapı 12,5 = temas yarıçapı)
  elipsoit(p.pelvis, G(0, 1.5), [sol, yuk, on], [15.2, 10, 10.2]);
  elipsoit(p.karin, G(0, 15), [sol, yuk, on], [12.4, 12.5, 10.3]);
  elipsoit(p.gogus, G(0, 41), [sol, yuk, on], [14.6, 19.5, 12.5]);
  uzat(p.omuzKusak, s.omB, s.omA, 6.3);
  // Boyun: kafatasının arka-alt yarısına, hafif öne eğik
  const kafaTaban = M.ekle(M.ekle(s.kafa, s.g, -7.5), s.yuz, -1.5);
  uzat(p.boyun, M.ekle(s.boyun, s.g, -4), kafaTaban, 1);
  // Kafa: yüz tabanında eğik yumurta
  const [kSol, kYuk, kOn] = taban(s.g, s.yuz), e = M.rd(KAFA.egim);
  const eksen = M.birim(M.ekle(M.ekle([0, 0, 0], kYuk, Math.cos(e)), kOn, -Math.sin(e)));   // tepe geriye
  const onE = M.birim(M.ekle(M.ekle([0, 0, 0], kOn, Math.cos(e)), kYuk, Math.sin(e)));
  elipsoit(p.kafa, M.ekle(M.ekle(s.kafa, s.yuz, kafaOfset), s.g, 0.5), [kSol, eksen, onE], [KAFA.en, 1, 1]);
  for (const k of ['A', 'B']) {
    const om = s['om' + k], d = s['d' + k], e2 = s['e' + k], ka = s['ka' + k], z = s['z' + k], a = s['a' + k], u = s['u' + k];
    uzat(p['ustKol' + k], om, d); uzat(p['onKol' + k], d, e2);
    uzat(p['uyluk' + k], ka, z); uzat(p['baldir' + k], z, a);
    const kure = (m, c, r) => { m.position.copy(V(c)); m.scale.setScalar(r); m.quaternion.identity(); };
    kure(p['omuz' + k], om, 6.1); kure(p['dirsek' + k], d, 4.5); kure(p['bilek' + k], e2, 3.2);
    kure(p['kalca' + k], ka, 7.6); kure(p['diz' + k], z, 5.5); kure(p['topuk' + k], a, 3.5);
    // El: ön kol yönünde uzanan eldiven
    const fa = M.birim(M.fark(e2, d));
    const [elSol, , elOn] = taban(fa, Math.abs(M.nokta(fa, ileri)) > 0.95 ? s.g : ileri);
    elipsoit(p['el' + k], M.ekle(e2, fa, 3.2), [elSol, fa, elOn], [3.7, 4.6, 2.9]);
    // Ayak: bilekten parmak ucuna, tabanı bilek altında
    const ay = M.birim(M.fark(u, a)), ust = dik(Math.abs(ay[1]) > 0.95 ? ileri : [0, 1, 0], ay);
    elipsoit(p['ayak' + k], M.ekle(M.ekle(a, ay, 3.4), ust, -0.3), [cap(ay, ust), ay, ust], [3.9, 7.4, 3.3]);   // sağ elli: (ay × üst) × ay = üst
  }
}

/* ── Ekipman: hareketin KENDİ ekipman() tanımından ────────────────────────
 * Tanım SVG ilkelleri üretir (kapsül, küre, çokgen) ve her biri 3B verisini `geo`da taşır.
 * Kutular yalnız "kameraya bakan" yüzleri verir → iki zıt yönden kaydedip birleştirilir. */
function kaydedici(D) { const f = q => [q[0], q[1], q[0] * D[0] + q[1] * D[1] + q[2] * D[2]]; return f; }
const D0 = M.birim([0.31, 0.53, 0.79]);
function ekipmanIlkelleri(h, s, t) {
  const hepsi = [...h.ekipman(kaydedici(D0), s, t), ...h.ekipman(kaydedici(D0.map(x => -x)), s, t)];
  const gor = new Set(), o = [];
  for (const e of hepsi) {
    if (!e.geo) continue;
    const g = e.geo, anahtar = g.tur === 'p' ? 'p' + g.P3.map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';')
      : g.tur === 'k' ? 'k' + [g.a3, g.b3].map(q => q.map(v => v.toFixed(2)).join(',')).sort().join(';') + g.r : 's' + g.c3.join(',') + g.r;
    if (gor.has(anahtar)) continue;
    gor.add(anahtar);
    const renkler = [...e.svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)].map(m => m[1]).filter(c => c.toLowerCase() !== '#0a0b0d');
    o.push({ geo: g, renk: renkler.at(-1) ?? '#5d646d' });
  }
  return o;
}

export function ekipmanKur(h, s, t) {
  const grup = new T.Group(), parcalar = [];
  for (const { geo, renk } of ekipmanIlkelleri(h, s, t)) {
    if (geo.tur === 'p') {
      const bg = new T.BufferGeometry();
      bg.setAttribute('position', new T.Float32BufferAttribute(new Float32Array((geo.P3.length - 2) * 9), 3));
      const m = mesh(bg, ekipmanMalzemesi(renk, false));
      grup.add(m); parcalar.push({ tur: 'p', m });
    } else if (geo.tur === 'k') {
      const metal = geo.r < 3.2;
      const g2 = new T.Group(), c = mesh(GEO.silindir, ekipmanMalzemesi(renk, metal)), u1 = mesh(GEO.kure, ekipmanMalzemesi(renk, metal)), u2 = mesh(GEO.kure, ekipmanMalzemesi(renk, metal));
      g2.add(c, u1, u2); grup.add(g2); parcalar.push({ tur: 'k', c, u1, u2 });
    } else {
      const m = mesh(GEO.kure, ekipmanMalzemesi(renk, true)); grup.add(m); parcalar.push({ tur: 's', m });
    }
  }
  return { grup, parcalar };
}
/** Havuz uyuşmuyorsa (ilkel sayısı/türü değişti) false döner → çağıran yeniden kurar */
export function ekipmanGuncelle(ek, h, s, t) {
  const il = ekipmanIlkelleri(h, s, t);
  if (il.length !== ek.parcalar.length || il.some(({ geo }, i) => geo.tur !== ek.parcalar[i].tur)) return false;
  il.forEach(({ geo }, i) => {
    const pc = ek.parcalar[i];
    if (pc.tur === 'p') {
      const pos = pc.m.geometry.attributes.position, P = geo.P3;
      for (let j = 1; j < P.length - 1; j++) for (const [n, q] of [[0, P[0]], [1, P[j]], [2, P[j + 1]]])
        pos.setXYZ((j - 1) * 3 + n, q[0], q[1], q[2]);
      pos.needsUpdate = true; pc.m.geometry.computeBoundingSphere();
    } else if (pc.tur === 'k') {
      uzat(pc.c, geo.a3, geo.b3, geo.r);
      for (const [u, q] of [[pc.u1, geo.a3], [pc.u2, geo.b3]]) { u.position.copy(V(q)); u.scale.setScalar(geo.r); }
    } else { pc.m.position.copy(V(geo.c3)); pc.m.scale.setScalar(geo.r); }
  });
  return true;
}

/* ── Sahne — TEK ve PAYLAŞILAN ──────────────────────────────────────────────
 * Mokapta her hareket kendi sahnesini, ışıklarını ve GÖLGE HARİTASINI kuruyordu; 22 hareket
 * 22 gölge dokusu (her biri 1024² derinlik) demekti — telefonda gereksiz GPU belleği. Burada
 * tek sahne, tek figür, tek ışık takımı; hareket değişince yalnız EKİPMAN grubu değişir
 * (hareket başına önbellekte). Çerçeve dışarıdan gelir (manken3d.cerceve): SVG yedekle
 * aynı hesap → iki çizici aynı kadrajı gösterir. */
export function motorKur(renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  const scene = new T.Scene();
  const fg = figurKur();
  scene.add(fg.grup);
  const zemin = mesh(new T.CircleGeometry(78, 48), MAT.zemin, false);
  zemin.rotation.x = -Math.PI / 2;
  scene.add(zemin);
  // Işık: gökyüzü/yer dolgusu + gölge atan ana ışık (dünyada sabit) + figürün ARKASINDAN kontur ışığı
  scene.add(new T.HemisphereLight(0xe6ebf2, 0x23262b, 1.35));
  const ana = new T.DirectionalLight(0xffffff, 2.1);
  ana.castShadow = true; ana.shadow.mapSize.set(1024, 1024);
  Object.assign(ana.shadow.camera, { left: -130, right: 130, top: 130, bottom: -130, near: 10, far: 420 });
  ana.shadow.bias = -0.0004; ana.shadow.normalBias = 0.6;
  const kontur = new T.DirectionalLight(0xbcd0ea, 1.1);
  scene.add(ana, ana.target, kontur, kontur.target);
  // Yörünge izi: izlenen eklemin yolu, küçük noktalar
  const izler = Array.from({ length: 19 }, (_, i) => {
    const m = mesh(GEO.kure, MAT.iz, false); m.scale.setScalar(i === 18 ? 1.7 : 0.95); scene.add(m); return m;
  });
  const kamera = new T.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
  const ekipmanlar = new Map();
  let aktif = null, aktifH = null;

  const ekipmanTak = (h, s, t, yeniden = false) => {
    if (aktif) scene.remove(aktif.grup);
    aktif = (!yeniden && ekipmanlar.get(h)) || ekipmanKur(h, s, t);
    ekipmanlar.set(h, aktif);
    scene.add(aktif.grup);
  };
  const hareketeGec = (h, s, t) => {
    ekipmanTak(h, s, t);
    zemin.position.set(h.merkez[0], 0, h.merkez[2]);
    ana.position.set(h.merkez[0] + 70, 170, h.merkez[2] + 90);
    ana.target.position.set(h.merkez[0], 40, h.merkez[2]);
    const yol = h.statik ? [] : Array.from({ length: 19 }, (_, i) => M.an(h, i / 18)[h.izlenen]);
    izler.forEach((m, i) => { m.visible = i < yol.length; if (m.visible) m.position.copy(V(yol[i])); });
    aktifH = h;
  };

  return {
    /** h'yi t anında, θ/φ kamerasından, c çerçevesiyle (ekran koordinatı, y yukarı) çiz */
    ciz(h, t, teta, fi, c) {
      const s = M.an(h, t);
      if (aktifH !== h) hareketeGec(h, s, t);
      figurGuncelle(fg, s);
      if (!ekipmanGuncelle(aktif, h, s, t)) { ekipmanTak(h, s, t, true); ekipmanGuncelle(aktif, h, s, t); }
      // Kamera SVG motoruyla AYNI kural: θ yatay, φ yükseklik, dünya orijinine bakar
      const cT = Math.cos(M.rd(teta)), sT = Math.sin(M.rd(teta)), cF = Math.cos(M.rd(fi)), sF = Math.sin(M.rd(fi));
      const yon = [sT * cF, sF, cT * cF];
      kamera.position.set(yon[0] * 600, yon[1] * 600, yon[2] * 600);
      kamera.up.set(0, 1, 0); kamera.lookAt(0, 0, 0);
      Object.assign(kamera, { left: c.sol, right: c.sag, top: c.ust, bottom: c.alt });
      kamera.updateProjectionMatrix();
      kontur.position.set(h.merkez[0] - yon[0] * 300, 220, h.merkez[2] - yon[2] * 300);
      kontur.target.position.set(h.merkez[0], 60, h.merkez[2]);
      renderer.render(scene, kamera);
    },
  };
}
