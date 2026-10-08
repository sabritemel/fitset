/**
 * 3B SAHNE — uygulamanın hareket çiziminin TEK giriş noktası (odak ekranı, plank varyantları,
 * ısınma satırları).
 *
 * Üç çizici, tek karar yeri (8 Eki 2026 kararı — docs/2026-10-08-c-manken-uygulamaya-PLAN.md):
 *   C      — MakeHuman gövdesi (anim3d/c/, three.js C alt kümesi). Varsayılan ve tek görünüm.
 *   Kapsül — bugünkü ışıklı manken (anim3d/webgl.js, three.js alt kümesi). Seçenek DEĞİL, yedek:
 *            C açılamazsa, cihaz yavaş kalırsa (ilk oynatmada kare aralığı ortancası > 50 ms) ya da
 *            kullanıcı Ayarlar'da "basit görünüm"ü açtıysa.
 *   SVG    — aynı motorun bağımlılıksız çizimi (manken3d.sahne). WebGL hiç yoksa ya da GPU bağlamı
 *            kaybolduysa (telefon arka plana alınınca olabilir) bu çizer. Yükleme sürerken alan boş kalır
 *            (8 Eki); uygulama mankeni açılışta arka planda yükler.
 * three.js açılışı YAVAŞLATMAMALI → ilk çizimde arka planda yüklenir, hazır olunca geçilir.
 *
 * Tek paylaşılan WebGL bağlamı: her görünüm kendi 2B tuvaline kopyalanır. Tarayıcılar ~16
 * bağlama izin verir ve ekran her yeniden çizildiğinde öğeler değişir — görünüm başına bağlam
 * açmak hem sınırı hem belleği zorlardı.
 */
import * as M from './manken3d.js';
import { hareketBul, KUTUPHANE } from './hareketler3d.js';

export { hareketBul };

/* ── ANİMASYON ZAMANI — TEK KAYNAK (odak ekranı + ısınma satırları) ──────────────────────────
   Sabri (27 Eyl): "6 tekrar yapıp dursun; dururken dokununca ya da döndürünce 6 tekrar daha" ·
   "hareket nereden başlıyorsa orada bitsin; duran görüntü yalnız BAŞLANGIÇ noktasında olsun,
   harekete geçince başka bir noktaya sıçramasın".
   ⚠️ Eskiden ısınma figürleri dururken hareketin ORTASINDA (t=0,55) çiziliyordu: sırası gelince
   0'a sıçrıyor, bitince 0,55'e geri sıçrıyordu. Kural artık burada ve fizik denetiminde sınanıyor. */
export const TEKRAR = 6;
export const TEKRAR_MS = 3000;          // bir tekrar: gidip gelen 0→1→0 · dönen (lunge, kol çevirme) 0→1 tam tur
export const DURAGAN_T = 0;             // duran görüntü = hareketin başlangıç noktası

/**
 * Oynatmanın ms'inci anındaki hareket zamanı t (0…1). Başlamadan önce ve süre dolunca TAM başlangıç
 * noktası döner — ilk kare de son kare de duran görüntüyle aynıdır, sıçrama olmaz.
 * @param {object} h      3B hareket (hareketBul) — `dongu` dönen hareketi işaretler
 * @param {number} ms     oynatma başladığından beri geçen süre
 * @param {number} [donem=TEKRAR_MS]  bir tekrarın süresi
 * @param {number} [tekrar=TEKRAR]    kaç tekrar oynatılır
 */
export function animT(h, ms, donem = TEKRAR_MS, tekrar = TEKRAR) {
  if (!(ms > 0) || ms >= donem * tekrar) return DURAGAN_T;
  // Bir döngüde birden çok tekrar varsa (lunge: sağ + sol) döngü o kadar uzar — her tekrar yine `donem` sürer
  // (8 Eki, Sabri: "lunge'ı çok hızlı yapıyor"; eskiden iki bacak tek 3 sn'ye sığıyordu). Toplam süre değişmez.
  const e = (ms / (donem * (h?.donguTekrar ?? 1))) % 1;
  return h?.dongu ? e : (1 - Math.cos(2 * Math.PI * e)) / 2;
}
/** Oynatma süresi (ms) — bu süreden sonra animT hep başlangıç noktasını verir */
export const animSure = (donem = TEKRAR_MS, tekrar = TEKRAR) => donem * tekrar;

let motor = null;                 // { r, tuval, ciz, w, h, tur } — WebGL hazırsa
let kayip = false;                // GPU bağlamı kayıp (geri gelene kadar SVG)
let yukleme = null, istenen = null, nesil = 0;
let durum = 'svg';                // 'svg' | 'yukleniyor' | 'webgl' | 'yok' — tanı ve test için
let yedekBildir = null;           // (neden) => void — çağıran kararı saklar (Ayarlar'da görünür)
export const cizici = () => (motor && !kayip ? (motor.tur === 'c' ? 'webgl (C)' : 'webgl (kapsül)')
  : durum === 'yukleniyor' ? 'svg (webgl yükleniyor)' : 'svg');

/** Hareketin kütüphane kimliği (C'nin kas haritası ve hareket başına durumu buna bakar) */
const kimlikler = new Map(Object.entries(KUTUPHANE).map(([id, h]) => [h, id]));
const kimlik = h => kimlikler.get(h) ?? varyantKimligi.get(h) ?? null;

function tuvalKur(T, hazir) {
  const tuval = document.createElement('canvas');
  const r = new T.WebGLRenderer({ canvas: tuval, antialias: true, alpha: true, powerPreference: 'low-power' });
  r.setPixelRatio(1);
  r.setClearColor(0x000000, 0);
  // three.js bağlam kaybında preventDefault eder ve geri gelince kendini kurar; arada SVG çizeriz
  // yalnız ŞU ANKİ çizicinin bağlamı sayılır: yedeğe geçerken bırakılan (forceContextLoss) eski bağlamın kaybı
  // yeni çiziciyi SVG'ye düşürüyordu (8 Eki, ölçüldü)
  tuval.addEventListener('webglcontextlost', () => { if (motor?.tuval === tuval) kayip = true; });
  tuval.addEventListener('webglcontextrestored', () => { if (motor?.tuval === tuval) { kayip = false; hazir?.(); } });
  return { r, tuval };
}
async function kapsulKur(hazir) {
  const [T, W] = await Promise.all([import('../vendor/three.min.js'), import('./webgl.js')]);
  const { r, tuval } = tuvalKur(T, hazir);
  return { tur: 'kapsul', r, tuval, ...W.motorKur(r), w: 0, h: 0 };
}
async function cKur(hazir) {
  const [T, G] = await Promise.all([import('../vendor/three-c.min.js'), import('./c/govde.js')]);
  const { r, tuval } = tuvalKur(T, hazir);
  try {
    const m = await G.motorKur(r, { tur: 'C' });
    Object.assign(m.ayar, { kas: true, iz: true });
    try { await m.isit?.(KUTUPHANE.bb_bench_press); } catch (e) { console.warn('[3b] ısınma atlandı:', e?.message ?? e); }
    return { tur: 'c', r, tuval, w: 0, h: 0,
      ciz(h, t, teta, fi, c, { kas = true } = {}) { m.ayar.id = kimlik(h); m.ayar.kas = kas; m.ciz(h, t, teta, fi, c, performance.now()); } };
  } catch (e) { r.dispose(); r.forceContextLoss(); throw e; }
}
function birak() {
  if (!motor) return;
  motor.r.dispose(); motor.r.forceContextLoss();   // eski bağlamı bırak (tarayıcı sınırı ~16)
  motor = null;
}

/**
 * WebGL çiziciyi arka planda hazırla. Hazır olduğunda `hazir()` çağrılır — çağıran o an
 * ekrandakini yeniden çizer (SVG'den WebGL'e geçiş). Başarısızsa SVG'de kalınır ve söylenir.
 *   basit        true → kapsül manken (Ayarlar: "basit görünüm / pil tasarrufu")
 *   yedegeGecti  (neden) — C yavaş kaldığı için kapsüle geçildi; çağıran kararı saklar
 */
export function webglHazirla(hazir, { basit = false, yedegeGecti = null } = {}) {
  yedekBildir = yedegeGecti;
  const hedef = basit ? 'kapsul' : 'c';
  if (istenen === hedef && (motor || yukleme || durum === 'yok')) { yukleme?.then(() => { if (motor) hazir?.(); }); return; }
  istenen = hedef; birak(); kayip = false; olcum.bitti = basit; olcum.araliklar.length = 0; olcum.son = 0;
  const benim = ++nesil;
  durum = 'yukleniyor';
  yukleme = (async () => {
    let m = null;
    try { m = hedef === 'c' ? await cKur(hazir) : await kapsulKur(hazir); }
    catch (e) {
      console.warn(`[3b] ${hedef === 'c' ? 'C manken' : 'WebGL çizici'} açılamadı:`, e?.message ?? e);
      if (hedef === 'c') try { m = await kapsulKur(hazir); } catch (e2) { console.warn('[3b] kapsül de açılamadı, SVG:', e2?.message ?? e2); }
    }
    if (benim !== nesil) { if (m) { m.r.dispose(); m.r.forceContextLoss(); } return; }   // bu arada başka istek geldi
    motor = m; durum = m ? 'webgl' : 'yok';
  })();
  yukleme.then(() => { if (motor && benim === nesil) hazir?.(); });
}

/* ── YAVAŞLIK ÖLÇÜMÜ (K4): C'nin ilk oynatmasında ardışık KARELERİN aralığı (bir karede birden çok görünüm
   çizilse de — ısınma listesi, plank — kare bir kez sayılır). 30 aralığın ortancası 50 ms'yi (20 kare/sn) aşarsa
   kapsüle geçilir ve çağırana bildirilir. 600 ms'den uzun aralar oynatma sayılmaz; ilk 5 aralık (gölgelendirici
   derlemesi) atlanır. Oturumda bir kez karar verilir. */
const olcum = { son: 0, araliklar: [], bitti: false, karede: false };
function yavaslikOlc() {
  if (olcum.bitti || motor?.tur !== 'c' || olcum.karede) return;
  olcum.karede = true; requestAnimationFrame(() => { olcum.karede = false; });
  const simdi = performance.now(), d = simdi - olcum.son;
  olcum.son = simdi;
  if (!(d > 0 && d < 600)) return;
  olcum.araliklar.push(d);
  if (olcum.araliklar.length < 35) return;
  const a = olcum.araliklar.slice(5).sort((x, y) => x - y), ortanca = a[a.length >> 1];
  olcum.bitti = true;
  if (ortanca > 50) {
    console.warn(`[3b] C manken bu cihazda yavaş (kare aralığı ortancası ${ortanca.toFixed(0)} ms) → basit görünüm`);
    yedekBildir?.('yavas');
  }
}
export const _yavaslikTani = () => ({ ...olcum, araliklar: [...olcum.araliklar], durum, istenen, motorTur: motor?.tur ?? null });

/** Plank gibi varyantlı hareketin i. varyantı — nesne önbellekte (WebGL ekipman önbelleği kimliğe bakar) */
const varyantlar = new WeakMap(), varyantKimligi = new WeakMap();
export function varyant(h, i) {
  if (!varyantlar.has(h)) {
    const v = (h.varyantlar ?? []).map(a => ({ ...h, a, varyantlar: undefined }));
    v.forEach(x => varyantKimligi.set(x, kimlik(h)));
    varyantlar.set(h, v);
  }
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
 *   yakinlik >1 görüntüyü büyütür (çerçeve merkezden daralır; 8 Eki, Sabri: odak ekranında "biraz büyütelim")
 *   kas      false → kas vurgusu çizilmez (plank'in yanlış duruşları)
 */
export function ciz(el, h, t, { kamera = h.kamera, bicim = 'donen', cerceve, yakinlik = 1, kas = true } = {}) {
  if (!el || !h) return;
  const w = el.clientWidth, hh = el.clientHeight;
  if (!w || !hh) return;                                   // görünmeyen kap (ekran değişirken)
  let c = M.sigdir(cerceve ?? M.cerceve(h, kamera[0], kamera[1], bicim), w / hh);
  if (yakinlik !== 1) {
    const mx = (c.sol + c.sag) / 2, my = (c.ust + c.alt) / 2, k = 1 / yakinlik;
    c = { sol: mx + (c.sol - mx) * k, sag: mx + (c.sag - mx) * k, ust: my + (c.ust - my) * k, alt: my + (c.alt - my) * k };
  }
  if (motor && !kayip) {
    let cv = el.firstElementChild;
    if (!cv || cv.tagName !== 'CANVAS') { el.innerHTML = '<canvas></canvas>'; cv = el.firstElementChild; }
    const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(hh * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (motor.w !== W || motor.h !== H) { motor.r.setSize(W, H, false); motor.w = W; motor.h = H; }
    motor.ciz(h, t, kamera[0], kamera[1], c, { kas });
    yavaslikOlc();
    const g = cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.drawImage(motor.tuval, 0, 0);                        // aynı görevde: tampon henüz temizlenmedi
    return;
  }
  // 8 Eki (Sabri: "ilk animasyon eski çizimle geliyor, sonra yeni sporcu yükleniyor"): yükleme sürerken eski
  // (SVG) çizim gösterilmez — alan bir an boş kalır, manken hazır olunca doğrudan belirir. SVG yalnız WebGL hiç
  // açılamadıysa ya da GPU bağlamı kaybolduysa çizer.
  if (durum === 'yukleniyor' && !kayip) {
    if (el.firstElementChild?.tagName.toLowerCase() === 'svg') el.innerHTML = '';
    else if (el.firstElementChild?.tagName === 'CANVAS') el.firstElementChild.getContext('2d')?.clearRect(0, 0, el.firstElementChild.width, el.firstElementChild.height);
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
