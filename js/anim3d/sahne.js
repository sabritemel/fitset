/**
 * 3B SAHNE — uygulamanın hareket çiziminin TEK giriş noktası (odak ekranı, plank varyantları,
 * ısınma satırları).
 *
 * İki çizici, tek karar yeri:
 *   WebGL  — three.js ile ışıklı manken (anim3d/webgl.js). three.js ~135 KB gzip olduğu için
 *            açılışı YAVAŞLATMAMALI → ilk çizimde arka planda yüklenir, hazır olunca geçilir.
 *   SVG    — aynı motorun bağımlılıksız çizimi (manken3d.sahne). Yükleme sürerken, WebGL hiç
 *            yoksa ya da GPU bağlamı kaybolduysa (telefon arka plana alınınca olabilir) bu çizer.
 * Sabri (24 Eyl): "girsin — SVG yedekle birlikte".
 *
 * Tek paylaşılan WebGL bağlamı: her görünüm kendi 2B tuvaline kopyalanır. Tarayıcılar ~16
 * bağlama izin verir ve ekran her yeniden çizildiğinde öğeler değişir — görünüm başına bağlam
 * açmak hem sınırı hem belleği zorlardı.
 */
import * as M from './manken3d.js';
import { hareketBul } from './hareketler3d.js';

export { hareketBul };

let motor = null;                 // { r, tuval, ciz, w, h } — WebGL hazırsa
let kayip = false;                // GPU bağlamı kayıp (geri gelene kadar SVG)
let yukleme = null;
let durum = 'svg';                // 'svg' | 'yukleniyor' | 'webgl' | 'yok' — tanı ve test için
export const cizici = () => (motor && !kayip ? 'webgl' : durum === 'yukleniyor' ? 'svg (webgl yükleniyor)' : 'svg');

/**
 * WebGL çiziciyi arka planda hazırla. Hazır olduğunda `hazir()` çağrılır — çağıran o an
 * ekrandakini yeniden çizer (SVG'den WebGL'e geçiş). Başarısızsa SVG'de kalınır ve söylenir.
 */
export function webglHazirla(hazir) {
  if (motor || durum === 'yok') return;
  if (!yukleme) {
    durum = 'yukleniyor';
    yukleme = (async () => {
      try {
        const [T, W] = await Promise.all([import('../vendor/three.min.js'), import('./webgl.js')]);
        const tuval = document.createElement('canvas');
        const r = new T.WebGLRenderer({ canvas: tuval, antialias: true, alpha: true, powerPreference: 'low-power' });
        r.setPixelRatio(1);
        r.setClearColor(0x000000, 0);
        // three.js bağlam kaybında preventDefault eder ve geri gelince kendini kurar; arada SVG çizeriz
        tuval.addEventListener('webglcontextlost', () => { kayip = true; });
        tuval.addEventListener('webglcontextrestored', () => { kayip = false; hazir?.(); });
        motor = { r, tuval, ...W.motorKur(r), w: 0, h: 0 };
        durum = 'webgl';
      } catch (e) {
        durum = 'yok';
        console.warn('[3b] WebGL çizici açılamadı, SVG çizim kullanılıyor:', e?.message ?? e);
      }
    })();
  }
  yukleme.then(() => { if (motor) hazir?.(); });
}

/** Plank gibi varyantlı hareketin i. varyantı — nesne önbellekte (WebGL ekipman önbelleği kimliğe bakar) */
const varyantlar = new WeakMap();
export function varyant(h, i) {
  if (!varyantlar.has(h)) varyantlar.set(h, (h.varyantlar ?? []).map(a => ({ ...h, a, varyantlar: undefined })));
  return varyantlar.get(h)[i] ?? h;
}

/** Birden çok hareketin ortak çerçevesi — yan yana karşılaştırılan varyantlar AYNI ölçekte görünsün */
export function ortakCerceve(hs, kam, bicim = 'sabit') {
  const c = hs.map(h => M.cerceve(h, kam[0], kam[1], bicim));
  return { sol: Math.min(...c.map(x => x.sol)), sag: Math.max(...c.map(x => x.sag)),
           ust: Math.max(...c.map(x => x.ust)), alt: Math.min(...c.map(x => x.alt)) };
}

/**
 * `el` kabına h hareketini t anında çiz.
 *   kamera   [θ, φ] — varsayılan hareketin kendi açısı
 *   bicim    'donen' (sürüklenebilen görünüm; çerçeve açıdan bağımsız) | 'sabit' (sıkı kadraj)
 *   cerceve  hazır çerçeve (ör. ortakCerceve) — verilirse bicim yok sayılır
 */
export function ciz(el, h, t, { kamera = h.kamera, bicim = 'donen', cerceve } = {}) {
  if (!el || !h) return;
  const w = el.clientWidth, hh = el.clientHeight;
  if (!w || !hh) return;                                   // görünmeyen kap (ekran değişirken)
  const c = M.sigdir(cerceve ?? M.cerceve(h, kamera[0], kamera[1], bicim), w / hh);
  if (motor && !kayip) {
    let cv = el.firstElementChild;
    if (!cv || cv.tagName !== 'CANVAS') { el.innerHTML = '<canvas></canvas>'; cv = el.firstElementChild; }
    const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(hh * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (motor.w !== W || motor.h !== H) { motor.r.setSize(W, H, false); motor.w = W; motor.h = H; }
    motor.ciz(h, t, kamera[0], kamera[1], c);
    const g = cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.drawImage(motor.tuval, 0, 0);                        // aynı görevde: tampon henüz temizlenmedi
    return;
  }
  let sv = el.firstElementChild;
  if (!sv || sv.tagName.toLowerCase() !== 'svg') {
    el.innerHTML = '<svg preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>';
    sv = el.firstElementChild;
  }
  sv.setAttribute('viewBox', M.viewBox(c));
  sv.innerHTML = M.sahne(h, t, kamera[0], kamera[1]).svg;
}
