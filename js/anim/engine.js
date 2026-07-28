/**
 * ÇUBUK-ADAM MOTORU — prototipten birebir taşındı (antrenman-programi_1.html:155-206).
 *
 * ┌─ NASIL ÇALIŞIR ─────────────────────────────────────────────────────────┐
 * │ Poz, eklem KOORDİNATLARI olarak değil, EKLEM AÇILARI olarak saklanır.   │
 * │ Koordinatlar çizim anında forward kinematics (FK) ile üretilir:         │
 * │   pt(nokta, açı, uzunluk) → yeni nokta                                  │
 * │                                                                          │
 * │ Bunun sonucu: segment uzunlukları (L) SABİTTİR, hiçbir ara karede uzuv  │
 * │ kısalamaz/uzayamaz. Anatomik doğruluğun yarısı buradan bedava gelir.    │
 * │                                                                          │
 * │ ⚠️ Diğer yarısı gelmez: FK uzunluğu garanti eder, EKLEM LİMİTİNİ etmez. │
 * │ İki eklem bağımsız interpole edilirse ara pozda dirsek/diz insan        │
 * │ sınırını aşabilir. Bunu tools/verify-poses.js yakalar — yeni poz        │
 * │ eklerken O BETİĞİ ÇALIŞTIR.                                             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * POZ NESNESİ (derece cinsinden; 0° = sağ, 90° = yukarı):
 *   px, py  gövde kökü (kalça) konumu
 *   torso   gövde açısı (kalçadan boyuna)
 *   ua, fa  üst kol / ön kol açısı        · ua2, fa2 → karşı kol (yoksa ua/fa kullanılır)
 *   th, sh  uyluk / baldır açısı          · th2, sh2 → karşı bacak
 *   al      kol uzunluk çarpanı (varsayılan 1) — yalnızca yukarıdan görünümde
 *           kolların kameraya doğru gelmesini 2B'de temsil etmek için kullanılır
 *           (kısaltma/foreshortening). Bug değil, bilinçli bir çizim aracıdır.
 */

/** Segment uzunlukları — SABİT. Değiştirilirse tüm çizimler ölçek değiştirir. */
export const L = { torso: 60, head: 13, ua: 31, fa: 29, th: 39, sh: 37 };

const rd = d => d * Math.PI / 180;

/** Forward kinematics tek adımı: p noktasından a açısıyla l uzunluk git */
export const pt = (p, a, l) => [p[0] + l * Math.cos(rd(a)), p[1] - l * Math.sin(rd(a))];

const lerp = (a, b, t) => a + (b - a) * t;

/** İki poz arasında t∈[0,1] noktasındaki ara pozu üretir (yalnız sayısal alanlar interpole edilir) */
export const poseAt = (A, B, t) => {
  const o = {};
  for (const k in A) {
    const bv = B[k] === undefined ? A[k] : B[k];
    o[k] = typeof A[k] === 'number' ? lerp(A[k], bv, t) : A[k];
  }
  return o;
};

/** Açılardan tüm eklem koordinatlarını üretir. view: 'side' | 'front' */
export function skeleton(p, view) {
  const P = [p.px, p.py], al = p.al === undefined ? 1 : p.al;
  const neck = pt(P, p.torso, L.torso), head = pt(neck, p.torso, L.head);
  const perp = p.torso - 90, u = [Math.cos(rd(perp)), -Math.sin(rd(perp))];
  // Önden görünümde omuz/kalça genişliği açılır; yandan görünümde uzuvlar üst üste biner
  const w = view === 'front' ? 13 : 0, hw = view === 'front' ? 9 : 0;
  const shA = [neck[0] + w * u[0], neck[1] + w * u[1]], shB = [neck[0] - w * u[0], neck[1] - w * u[1]];
  const hipA = [P[0] + hw * u[0], P[1] + hw * u[1]], hipB = [P[0] - hw * u[0], P[1] - hw * u[1]];
  const elA = pt(shA, p.ua, L.ua * al), haA = pt(elA, p.fa, L.fa * al);
  const elB = pt(shB, p.ua2 ?? p.ua, L.ua * al), haB = pt(elB, p.fa2 ?? p.fa, L.fa * al);
  const knA = pt(hipA, p.th, L.th), ftA = pt(knA, p.sh, L.sh);
  const knB = pt(hipB, p.th2 ?? p.th, L.th), ftB = pt(knB, p.sh2 ?? p.sh, L.sh);
  return { P, neck, head, shA, shB, elA, haA, elB, haB, hipA, hipB, knA, ftA, knB, ftB, view };
}

const poly = (...ps) => `<polyline points="${ps.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/>`;
const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; };
const off = (p, v, l) => [p[0] + v[0] * l, p[1] + v[1] * l];

/** İskeletten çizilebilir SVG figürü üretir. ghost=true → içi boş kafa (hayalet figür) */
export function figure(s, ex, ghost) {
  const f = (ex.face || 1);
  let g = '';
  const tv = nrm(s.P, s.neck), tp = [-tv[1], tv[0]];              // gövde ekseni ve dikeyi
  if (s.view === 'front') {
    g += poly(s.shA, s.shB) + poly(s.hipA, s.hipB);
    g += poly(s.shB, s.elB, s.haB) + poly(s.hipB, s.knB, s.ftB);
  } else {
    g += poly(off(s.neck, tp, -7), off(s.neck, tp, 7));            // omuz genişliği
    g += poly(off(s.P, tp, -6), off(s.P, tp, 6));                  // kalça genişliği
  }
  if (s.view !== 'front' && ex.legs2)
    g += `<g class="far">${poly(s.hipA, s.knB, s.ftB)}${ex.nofoot ? '' : poly([s.ftB[0] - 3 * f, s.ftB[1]], [s.ftB[0] + 11 * f, s.ftB[1]])}</g>`;
  g += poly(s.P, s.neck) + poly(s.shA, s.elA, s.haA) + poly(s.hipA, s.knA, s.ftA);
  if (!ex.nofoot) {
    const mk = a => s.view === 'front'
      ? poly([a[0] - 7, a[1]], [a[0] + 7, a[1]])
      : poly([a[0] - 3 * f, a[1]], [a[0] + 11 * f, a[1]]);
    g += mk(s.ftA); if (s.view === 'front') g += mk(s.ftB);
  }
  g += `<circle cx="${s.head[0].toFixed(1)}" cy="${s.head[1].toFixed(1)}" r="11" fill="${ghost ? 'none' : '#FDF3F6'}"/>`;
  return g;
}

/**
 * Hareketin izlediği yolu (uç noktanın yörüngesi) ucunda yön okuyla çizer.
 * ex.track ile hangi eklemin izleneceği seçilir (varsayılan 'haA' = el).
 *
 * ⚠️ Bu fonksiyon t'den BAĞIMSIZDIR — verdiği sonuç animasyon boyunca değişmez.
 * Bu yüzden kare başına değil, egzersiz başına BİR KEZ hesaplanmalıdır (bkz. cache.js).
 */
export function trail(ex) {
  const k = ex.track || 'haA', pts = [];
  for (let i = 0; i <= 18; i++) pts.push(skeleton(poseAt(ex.a, ex.b, i / 18), ex.view)[k]);
  const A = pts[0], B = pts[18];
  if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 12) return '';       // hareket çok küçükse iz çizme
  const v = nrm(pts[15], B), w = [-v[1], v[0]];
  const tip = off(B, v, 3);
  return `<g class="trail">${poly(...pts)}<polyline points="${off(off(tip, v, -8), w, 4).map(n => n.toFixed(1)).join(',')} ${tip.map(n => n.toFixed(1)).join(',')} ${off(off(tip, v, -8), w, -4).map(n => n.toFixed(1)).join(',')}"/></g>`;
}

/* ─── ÖNBELLEK KATMANI ────────────────────────────────────────────────────────
 * Prototipte `trail()` ve hayalet figür her animasyon karesinde yeniden
 * hesaplanıyordu — oysa ikisi de yalnız ex.a/ex.b'ye bağlı, yani t'den BAĞIMSIZ.
 * 60fps'te kare başına ~40 gereksiz iskelet hesabı + string birleştirme demekti.
 * Egzersiz nesnesi sabit olduğu için sonucu WeakMap'te tutmak yeterli.
 * (WeakMap: egzersiz nesnesi düşerse önbellek kendiliğinden temizlenir.)
 * Çizim tarafı bu iki fonksiyonu kullanmalı — ham trail()/figure() değil. */
const _trail = new WeakMap();
const _ghost = new WeakMap();

/** trail() ile aynı sonuç, egzersiz başına bir kez hesaplanır */
export function trailOf(ex) {
  if (!_trail.has(ex)) _trail.set(ex, trail(ex));
  return _trail.get(ex);
}

/** Başlangıç pozunun kesikli "hayalet" figürü — egzersiz başına bir kez hesaplanır */
export function ghostOf(ex) {
  if (!_ghost.has(ex)) _ghost.set(ex, `<g class="ghost">${figure(skeleton(ex.a, ex.view), ex, true)}</g>`);
  return _ghost.get(ex);
}
