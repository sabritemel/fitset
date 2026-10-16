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
// İP UCU (17 Eki, yapısal analiz): ip yumruğun İÇİNDEN ön kola DİK geçer — çekiş başparmak yanından girer, topuzlu uç serçe
// parmak yanından çıkar. ⚠️ Eskiden ip düğümden ele düz çiziliyor ve tutamak ekseni o doğru sayılıyordu: çekişte o doğru ön
// kolla aynı yöne düşüyor (yüz çekişi, kablo mekik, leg press: aradaki açı 10°'ye indi), el yönü tanımsızlaşıp kollar
// 130–160° dönüyordu, iple itmede ip düz bar gibi görünüyordu (ölçüldü + Sabri).
// Başparmak yönü: avuç İÇE bakarken iki elde de yanal eksen × ön kol (+z yanal, kişi +x'e bakar).
const basparmak = onKol => birim([-onKol[1], onKol[0], 0]);
const ipUcu = (k, e, u, uc) => { const g = ekle(e, u, 4), t = ekle(e, u, -uc); return { cekis: [k, g], yumruk: [g, t], topuz: t }; };
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
const KULE_Y = 185, KULE_MAKARA_UST = KULE_Y - 6;
const kabloKulesi = (pr, on, makara, yon = 1, kalk = 0, zKay = 0) => {   // zKay (17 Eki, G2): kule eksen dışında (kablo göğüs açmanın iki yanı)
  // 8 Eki (Sabri: "öndeki sütunlar ağırlıklardan çok uzak, yaklaştır; kule biraz daha küçük olsun"): KOMPAKT kule —
  // derinlik 46 → 32, dikmeler yığının hemen yanında (eni ±30 → ±21). Kollar ve eller kuleye daha az yaklaşır.
  const X = x => on + yon * x, aralik = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
  const kutu = (xa, xb, y, z, ton) => M.kutu(pr, aralik(xa, xb), y, [z[0] + zKay, z[1] + zKay], ton);
  const Zk = p => [p[0], p[1], p[2] + zKay];
  // 17 Eki (Sabri: "ağırlık kulelerinin yüksekliği çok fazla; Leo'nun boyundan 25 cm fazla olsun" → tepe 200 cm; 2. tur:
  // "tüm ağırlık kulelerini 10 cm kısalt"): kule tepesi (üst kirişin üstü, Y + 5) 190 cm; ilk hâli 219'du. Yüksek makaralar
  // (lat çekiş, triceps itme) kirişin altında (KULE_MAKARA_UST)
  const D = 32, Y = KULE_Y, mx = X(16), my = Y - 6;
  const o = [
    ...kutu(-3, D + 3, [0, 3], [-23, 23], KULE.govde),                                          // taban
    ...[-21, 16].flatMap(z => [...kutu(0, 5, [3, Y], [z, z + 5], KULE.govde), ...kutu(D - 5, D, [3, Y], [z, z + 5], KULE.govde)]),   // dikmeler (yığına bitişik)
    ...kutu(0, D, [Y, Y + 5], [-21, 21], KULE.govde),                                           // üst kiriş
    ...[-7, 7].map(z => M.kapsul(pr, Zk([mx, 3, z]), Zk([mx, Y, z]), 0.9, KULE.boru)),                   // yığın kılavuzları
  ];
  // 8 Eki (Sabri: "ağırlıklar hiç hareket etmiyor"): üstteki 6 plaka seçici çubukla birlikte halatın çekildiği kadar kalkar
  for (let i = 0; i < 12; i++) { const k = i >= 6 ? kalk : 0; o.push(...kutu(6, 26, [4 + i * 5 + k, 8.4 + i * 5 + k], [-14, 14], KULE.plaka)); }
  const ust = 64 + kalk;
  o.push(M.kapsul(pr, Zk([mx, 30 + kalk, 0]), Zk([mx, ust, 0]), 0.9, KULE.boru), ...M.makara(pr, Zk([mx, my, 0])));        // seçici çubuk + üst makara
  if (!makara) return o;                                                                         // makarasız (seçmeli makine gövdesi)
  if (makara[1] > Y - 40) {                                                                     // YÜKSEK makara: kirişten kol
    o.push(...M.kutu(pr, [Math.min(makara[0], X(2)) - 4, Math.max(makara[0], X(2)) + 4], [makara[1] + 4, makara[1] + 9], [zKay - 3, zKay + 3], KULE.govde),
      M.kapsul(pr, Zk([X(2), makara[1] + 6, 0]), Zk([X(2), Y, 0]), 2.5, KULE.boru),
      M.kablo(pr, Zk([makara[0], makara[1] + 4.5, 0]), Zk([mx, my + 4.5, 0])));
  } else {                                                                                      // ALÇAK/ORTA makara: ön dikmede kızak
    const kx = X(-2);
    o.push(...M.kutu(pr, [Math.min(makara[0], kx) - 3, Math.max(makara[0], kx) + 3], [makara[1] - 5, makara[1] + 5], [zKay - 4, zKay + 4], KULE.govde),
      ...kutu(-1, 2, [3, Y], [-2, 2], KULE.govde),
      M.kablo(pr, Zk([kx, makara[1], 0]), Zk([kx, Y - 2, 0])), M.kablo(pr, Zk([kx, Y - 2, 0]), Zk([mx, my + 4.5, 0])));
  }
  o.push(M.kablo(pr, Zk([mx, my - 4.5, 0]), Zk([mx, ust, 0])));
  return o;
};
/** Yığının kalkışı: halatın makaradan tutamağa uzunluğu, hareket boyunca en kısa olduğu andan ne kadar uzunsa (cm).
 *  En kısa an = ağırlık yerde. Hareket başına bir kez örneklenir ve hareketin üstünde saklanır. */
const yiginKalkisi = (h, makara, uc, s) => {
  if (h.__ipEnKisa == null) { let mn = Infinity; for (let i = 0; i <= 24; i++) mn = Math.min(mn, M.mesafe(makara, uc(M.an(h, i / 24)))); h.__ipEnKisa = mn; }
  return Math.max(0, M.mesafe(makara, uc(s)) - h.__ipEnKisa);
};
const oturak = (pr, ust, x = [-16, 14]) => M.sehpaCiz(pr, [x[0] - 4, x[1] + 4], ust, 30);   // 8 Eki: bacaklı oturak (eskiden tek dikmeli kutu)
/* DERİ MİNDER (2. tur, Sabri: "oturma ve yaslanma yerlerinde 2 cm deri minder, köşeler hafif radiuslu"): kutu yüzleri SVG yedek ve
   denetimler için kalır (3B'de gizli); 3B'de taşıyıcı levha + yaslanılan yüzde 2 cm deri, ikisi de köşeleri yuvarlatılmış.
   v = kalınlık ekseni, MİNDERİN olduğu yüze doğru (lat çekiş uyluk pedinde aşağı). */
const yumusak = (yuzler, merkez, [u, v, n], [w, h, d], ton, deri = 2) => [...M.gizle3B(yuzler),
  M.yastik3B(ekle(merkez, v, -deri / 2), [u, v, n], [w, h - deri, d], { r: 3, pah: 0.4, malzeme: 'govde', renk: ton.yan }),
  M.yastik3B(ekle(merkez, v, (h - deri) / 2), [u, v, n], [w, deri, d], { r: 3, pah: 0.9, malzeme: 'deri', renk: ton.ust })];
const minderKutu = (pr, [x0, x1], [y0, y1], [z0, z1], ton, yon = 1) =>
  yumusak(M.kutu(pr, [x0, x1], [y0, y1], [z0, z1], ton), [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [[1, 0, 0], [0, yon, 0], [0, 0, 1]], [x1 - x0, y1 - y0, z1 - z0], ton);
/** Gövdenin arkasındaki yönlü minder: gövde yönü g boyunca, gövdenin ARKASINDA */
const sirtMinderi = (pr, s, n, boy = 70, ofset = 30, destekY = null, geri = 0) => {
  // 2. tur: 3B'de 4 cm levha + gövdeye bakan yüzünde 2 cm DERİ minder, köşeleri yuvarlak (kutu yüzleri SVG + denetim için)
  const merkez = ekle(ekle(s.P, s.g, ofset), n, -(M.SIRT + 3 + geri)), o = M.gizle3B(M.kutuY(pr, merkez, [Z, s.g, n], [30, boy, 6], PED));
  o.push(M.yastik3B(ekle(merkez, n, -1), [Z, n, s.g], [30, 4, boy], { r: 3, pah: 0.4, malzeme: 'govde', renk: PED.yan }),
    M.yastik3B(ekle(merkez, n, 2), [Z, n, s.g], [30, 2, boy], { r: 3, pah: 0.9, malzeme: 'deri', renk: PED.ust }));
  // ⚠️ Minder havada duruyordu (27 Eyl denetimi): arkasından oturak tabanına inen destek borusu
  if (destekY != null) { const arka = ekle(merkez, n, -4); o.push(M.kapsul(pr, arka, [arka[0], destekY, 0], 2.2, METAL)); }
  return o;
};
/** Temas: gövde yüzeyi ile minderin ön yüzü arasındaki boşluk (0 = değiyor) */
const sirtTemas = (n, geri = 0) => s => nokta(fark(s.gogusAlt, ekle(ekle(s.P, s.g, 30), n, -(M.SIRT + 3 + geri) + 3)), n) - M.SIRT;   // C'nin sırt derinliği (8 Eki)

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
const paralelKulp = (pr, eller, ek, tepe, yari = 6.5) => eller.flatMap(e => { const a = ekle(e, ek, -yari), b = ekle(e, ek, yari);
  return [M.kapsul(pr, a, b, 1.6, '#8a929c'), M.kapsul(pr, a, ekle(tepe, ek, -2), 0.9, '#8a929c'), M.kapsul(pr, b, ekle(tepe, ek, 2), 0.9, '#8a929c')]; });
const bitisik = (h, ad, kisit = {}) => ({ ...h, ad, kisit: { ...h.kisit, ...kisit } });

/* ══════════════════════════════════════════════════════════════════════════ */

/* TOLERANS (Sabri, 14 Eki: "tüm hareketler milimetrik olmak zorunda değil; ellerin kavraması hassas olmalı, kaba
   hareketlerde 2 santime kadar tolerans olmalı"): kavrama (el–tutamak, iki elin arası, uzuv boyu, ayak tabanı) hassas
   kalır; bar yolu, bar–beden teması, tepe konumu gibi KABA ölçüler TOL_KABA. */
const TOL_KABA = 2;
/* ── BAR HAREKETLERİ ORTAK (1B, 14 Eki) ──────────────────────────────────────────────────────────────────────────── */
/** Squat kafesi (K1, sade): iki dikme + kişiye dönük J kanca + taban; kişinin ÖNÜNDE (barı alıp geri çıkılır) */
const squatKafesi = (pr, x, kancaY) => [-48, 48].flatMap(z => [
  ...M.kutu(pr, [x - 2.5, x + 2.5], [0, kancaY + 40], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),        // dikme
  ...M.kutu(pr, [x - 24, x + 24], [0, 4], [z - 3, z + 3], M.SEHPA_TON.cerceve),                        // ayak
  ...M.kutu(pr, [x - 9, x - 2.5], [kancaY - 3, kancaY], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),      // J kanca
  ...M.kutu(pr, [x - 9, x - 7], [kancaY, kancaY + 4], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve)]);
/** Gövde ekseninde kalça → omuz hattı (omuz eklemleri gövde ekseninden OMUZ.asagi aşağıda) */
const GOVDE_OMUZ = L.torso - OMUZ.asagi;
const KOL_DUZ = ERISIM * 0.9995;                                   // kollar düz (dirsek kavramaya göre ~4°)
/** Gövde ekseninde kalçadan omuz hattına (x, y): eksen boyunca GOVDE_OMUZ + yüz yönünde OMUZ.on (yüz = [sin φ, −cos φ]).
 *  ⚠️ OMUZ.on 0,6 cm ama bel bükülünce omzu ~0,5 cm aşağı alır — düze yakın kolda bu dirseği 16° büküyordu (ölçüldü). */
const omuzOfseti = fi => [GOVDE_OMUZ * Math.cos(rd(fi)) + OMUZ.on * Math.sin(rd(fi)), GOVDE_OMUZ * Math.sin(rd(fi)) - OMUZ.on * Math.cos(rd(fi))];
/** ASILI BARIN YÜKSEKLİĞİ: kalça ve gövde açısı verilince omuz → düz kolla bar (omzun `omuzOn` gerisinde/önünde) */
const asiliBarY = (P, fi, omuzOn, dz) => P[1] + omuzOfseti(fi)[1] - Math.sqrt(KOL_DUZ ** 2 - omuzOn ** 2 - dz * dz);
/**
 * ASILI BAR (deadlift, RDL, kürek): kollar DÜZ, bar ellerde. Bar konumu ve gövde açısı verilir; omuz barın `omuzOn`
 * kadar önünde (− = arkasında) ve kol boyu kadar yukarıda olacak biçimde kalça ÇÖZÜLÜR.
 * dz: omuz ile el arasındaki yanal fark. Döner: kalça merkezi P.
 */
const asiliBarKalca = (bar, fi, omuzOn, dz, kol = KOL_DUZ) => {
  const S = [bar[0] + omuzOn, bar[1] + Math.sqrt(kol * kol - omuzOn * omuzOn - dz * dz), 0];
  const o = omuzOfseti(fi);
  return [S[0] - o[0], S[1] - o[1], 0];
};
/** Bar ↔ bacak boşluğu (iskelet yaklaşığı). Kaval ön yüzü eksenden ~3 cm. UYLUK ön yüzü eksenden DEĞİŞKEN — dört gövdede ölçüldü
 *  (14 Eki, `tools/yuzey-denetimi.html` "bar mili bedenin İÇİNDEN"): kalçadan uyluğun ortasına kadar 11–13,6 cm, dize doğru
 *  6–7 cm. ⚠️ Eski değer sabit 6 cm'ydi ve kör bir ölçümle ayarlanmıştı (köşe→mil gömülmesi ince milde en çok mil yarıçapı
 *  kadar çıkar) → deadlift ve RDL'nin tepesinde bar uyluğun 4,5–7,5 cm İÇİNDEN geçiyordu (Sabri gördü). */
const UYLUK_ONU = u => u <= 0.5 ? 13.6 : 13.6 - (u - 0.5) * 15;
const barBacakBoslugu = (bar, s) => {
  const o = { kaval: Infinity, uyluk: Infinity };
  for (const y of ['A', 'B']) {
    const dZ = [bar[0], bar[1], s[`z${y}`][2]];
    const uz = (a, c) => { const ab = fark(c, a), u = Math.max(0, Math.min(1, nokta(fark(dZ, a), ab) / nokta(ab, ab))); return [mesafe(dZ, ekle(a, ab, u)), u]; };
    const [dk] = uz(s[`z${y}`], s[`a${y}`]), [du, u] = uz(s[`ka${y}`], s[`z${y}`]);
    // diz çevresi (u ≥ 0,8) kaval gibi sayılır: bar dizi geçerken sürtünür (dört gövdede gerçek yüzeyde en çok 1,8 cm)
    const dU = du - UYLUK_ONU(u) - 1.4;
    o.kaval = Math.min(o.kaval, dk - 3 - 1.4, u >= 0.8 ? dU : Infinity); if (u < 0.8) o.uyluk = Math.min(o.uyluk, dU);
  }
  return o;
};
/** Beden + bar ağırlık merkezi (x) — bar ağırlığı bedenin yarısı sayılır */
const agmX = (s, bar) => { const orta = (a, b) => a.map((v, i) => (v + b[i]) / 2);
  const parca = [[orta(s.P, s.boyun), 0.5], [s.kafa, 0.08], [orta(s.kaA, s.zA), 0.1], [orta(s.kaB, s.zB), 0.1], [orta(s.zA, s.aA), 0.045],
    [orta(s.zB, s.aB), 0.045], [orta(s.omA, s.eA), 0.05], [orta(s.omB, s.eB), 0.05], [bar, 0.5]];
  return parca.reduce((a, [p, m]) => a + p[0] * m, 0) / parca.reduce((a, [, m]) => a + m, 0); };
const ozelBarYolu = (barNoktasi, orta, sinir) => ({ ad: `bar yolu dikey, ayak ortasının üstünde (≤ ${sinir} cm)`, f: ks => {
  const x = ks.map(s => barNoktasi(s)[0] - orta), a = Math.min(...x), b = Math.max(...x);
  return { gecti: a >= -sinir && b <= sinir, olcum: `ayak ortasına göre ${a.toFixed(1)} … ${b.toFixed(1)}` }; } });
const ozelAgm = (barNoktasi, ayakX) => ({ ad: 'beden + bar ağırlık merkezi ayak tabanında', f: ks => {
  const x = ks.map(s => agmX(s, barNoktasi(s)) - ayakX), a = Math.min(...x), b = Math.max(...x);
  return { gecti: a >= -4 && b <= 11, olcum: `bilekten ${a.toFixed(1)} … ${b.toFixed(1)} (topuk −4 · parmak kökü 11)` }; } });
// Bar bacağa SÜRTÜNÜR (doğru teknik: "bar bacaklara yakın yükselir"). Yüzey ölçümü (14 Eki, dört gövde): deadlift'te
// bar kavala/şorta en çok 0,9 cm basıyor ↔ iskelet yaklaşığı −1,7 → eşik −2 (yaklaşık 1 cm gerçek basınç); bar
// bacağın İÇİNE düşerse (eski kinematik −6,2) kırmızı.
// Uyluk: bar uyluğa DEĞER, girmez (yumuşak doku: −1). Kaval ve diz: sürtünme kabul (−2 = kaba hareket toleransı, Sabri 14 Eki).
const ozelBarBacak = barNoktasi => ({ ad: 'bar bacağın içinden geçmiyor (kaval/diz ≥ −2 · uyluk ≥ −1)', f: ks => {
  let k = Infinity, kt = 0, u = Infinity, ut = 0;
  for (const s of ks) { const d = barBacakBoslugu(barNoktasi(s), s); if (d.kaval < k) { k = d.kaval; kt = s.t; } if (d.uyluk < u) { u = d.uyluk; ut = s.t; } }
  return { gecti: k >= -2 && u >= -1, olcum: `kaval ${k.toFixed(1)} (t=${kt.toFixed(2)}) · uyluk ${u.toFixed(1)} (t=${ut.toFixed(2)})` }; } });
/** Diz açısı sabit (RDL): kalça bilekten sabit uzaklıkta → diz açısı yapı gereği sabit; denetim ölçer */
const dizAcisi = s => 180 - aciOf(s.kaA, s.zA, s.aA);
/** Ölü asılmada dirsek GERİ bükülür (kol başın üstünde, avuç önde): dirseğin omuz–el çizgisinden ÖNE sapması (cm, ≤ 0 olmalı) */
const dirsekOneSapma = (s, y) => { const om = s[`om${y}`], e = s[`e${y}`], d = s[`d${y}`], ab = fark(e, om), u = nokta(fark(d, om), ab) / nokta(ab, ab); return d[0] - (om[0] + ab[0] * u); };
const ozelDirsekGeri = (anlar = null) => ({ ad: 'asılıyken dirsek geri bükülür (öne sapma ≤ 0,2 cm)', f: ks => {
  const m = Math.max(...ks.filter(s => !anlar || s.t <= anlar).flatMap(s => ['A', 'B'].map(y => dirsekOneSapma(s, y)))); return { gecti: m <= 0.2, olcum: `en çok ${m.toFixed(2)} cm öne` }; } });
const ozelKollarDuz = (sinir = 10) => ({ ad: `kollar düz (dirsek ≤ ${sinir}°)`, f: ks => {
  const m = Math.max(...ks.flatMap(s => ['A', 'B'].map(y => 180 - aciOf(s[`om${y}`], s[`d${y}`], s[`e${y}`]))));
  return { gecti: m <= sinir, olcum: `en fazla ${m.toFixed(1)}°` }; } });

/* ── KARDİYO ORTAK (1B dalga 3, Parti D — 15 Eki) ─────────────────────────────────────────────────────────────────────
 * Kardiyo hareketleri DÖNGÜSELDİR (`dongu`): t 0 → 1 aralığında `tur` tam döngü (adım, pedal turu, kürek çekişi) oynar ve
 * t = 1 pozu t = 0 pozuna eşittir. Kol ve bacaklar sırayla çalışır (simetri denetimi yerine harekete özel kurallar).
 * Ayak tabanı: bilekten parmak köküne `ayakVek(p)`, topuğa `topukVek(p)` (p = taban eğimi °, + = parmak yukarı). */
const dongu01 = x => ((x % 1) + 1) % 1;
const TOPUK_GERI = 5;                                              // topuk tabanı bileğin ~5 cm gerisinde (C'nin ayağı)
const topukVek = pt => { const a = rd(pt), b = a - Math.PI / 2; return [-TOPUK_GERI * Math.cos(a) + AYAK_Y * Math.cos(b), -TOPUK_GERI * Math.sin(a) + AYAK_Y * Math.sin(b)]; };
/** Taban noktaları (dünya, sagital): parmak kökü ve topuk — bilek ve taban eğiminden */
const tabanNoktalari = (a, p) => { const u = ayakVek(p), h = topukVek(p); return { u: [a[0] + u[0], a[1] + u[1]], h: [a[0] + h[0], a[1] + h[1]] }; };
/**
 * Yürürken kol salınımı: üst kol omuzdan ileri-geri (±18°), dirsek hafif bükük (öne giderken 46°, geride 18°), kol hafif
 * açık. El hedefi FK ile kurulur; kutup = dirseğin kendisi → IK aynı dirseği bulur. ileri ∈ [−1, 1] · i: +1 sağ, −1 sol.
 */
const kolSalinimi = (om, i, ileri, acik = 10) => {
  const al = rd(18 * ileri), be = rd(32 + 14 * ileri), ab = rd(acik);
  const U = [Math.sin(al) * Math.cos(ab), -Math.cos(al) * Math.cos(ab), i * Math.sin(ab)];
  const F = [Math.sin(al + be) * Math.cos(ab), -Math.cos(al + be) * Math.cos(ab), i * Math.sin(ab)];
  return { hedef: ekle(ekle(om, U, L.ua), F, L.fa), kutup: U };
};
const kardiyoKurali = (ad, f) => ({ ad, f });
/** Silindir gövdenin (volan kapağı) İKİ yüzünün ortasına FS işareti (16 Eki, Sabri): eksen z, yüzler z = ±yari; renk kapağın
 *  (kauçuk, #2a2d32) biraz koyu tonu */
const silindirLogolari = (c, yari, en) => [1, -1].map(i => ({ merkez: [c[0], c[1], c[2] + i * yari], n: [0, 0, i], yukari: [0, 1, 0], en, renk: '#18191c' }));
/**
 * KAS AKTİVASYONU (16 Eki, Sabri: "kardiyoda kaslar sürekli aktif görünüyor; diğer hareketlerdeki gibi kuvvet uygulanırken
 * aktif, gevşerken pasif olsun"). Döngüsel harekette tek bir "güç evresi" yoktur: her bacak kendi evresinde çalışır. Hareket
 * `kasAktif(t)` ile her kasın sağ (A) ve sol (B) taraftaki etkinliğini 0…1 verir; motor vurguyu kas ve taraf başına bununla
 * çarpar. Zamanlar yürüme / pedal / kürek EMG çalışmalarındaki tipik etkinlik aralıklarıdır (Perry & Burnfield yürüme;
 * Hug & Dorel 2009 bisiklet; kürekte Concept2 çekiş sırası) — yuvarlatılmış.
 * pencere(f, a, b): döngü evresi f, [a, b) aralığında (sarar) yumuşak açılıp kapanan 0…1.
 */
const pencere = (f, a, b) => { const L = dongu01(b - a) || 1, u = dongu01(f - a) / L; if (u >= 1) return 0;
  const k = Math.min(1, u / 0.25, (1 - u) / 0.25); return k * k * (3 - 2 * k); };
const iki = f => ({ A: f(1), B: f(-1) });                                   // taraf başına {kas: 0…1}
/** Kardiyo aletinin ekranı (16 Eki, Sabri: "göstergeler dışarı bakıyor"): ön yüz SPORCUYA (−x) dönük, üst kenarı ondan uzak
 *  (a° geriye yatık); ön yüzde koyu ekran camı — panelin hangi yüzünün ekran olduğu okunsun. */
const EKRAN_CAMI = { ust: '#14181d', yan: '#14181d' };
const ekranPaneli = (pr, merkez, a, [w, h, d]) => { const v = [Math.sin(rd(a)), Math.cos(rd(a)), 0], n = [-Math.cos(rd(a)), Math.sin(rd(a)), 0];
  return [...M.kutuY(pr, merkez, [Z, v, n], [w, h, d], KULE.govde), ...M.kutuY(pr, ekle(merkez, n, d / 2 + 0.3), [Z, v, n], [w - 4, h - 4, 0.6], EKRAN_CAMI)]; };

/* ── KOŞU BANDI (aleti yürüyüş ve koşu paylaşır). Bant yüzeyi y = BANT_D; bant işaretleri 20 cm arayla 6 çizgi, 120 cm'lik
 * bölgede döner — döngü kesintisiz olsun diye bir oynatmada bandın aldığı yol 20 cm'nin katıdır (TUR · ADIM). */
const BANT_D = 20, SERIT = 20, SERIT_N = 6, SERIT_BOLGE = [-60, 60];
const KORKULUK = [[20, 104, 38], [70, 104, 38]];
const korkulukMesafe = e => Math.min(...[1, -1].map(i => { const a = [KORKULUK[0][0], KORKULUK[0][1], i * KORKULUK[0][2]], b = [KORKULUK[1][0], KORKULUK[1][1], i * KORKULUK[1][2]];
  const ab = fark(b, a), u = Math.max(0, Math.min(1, nokta(fark(e, a), ab) / nokta(ab, ab))); return mesafe(e, ekle(a, ab, u)); }));
const BANT_TABANI = (s, y) => { const p = Math.asin(Math.max(-1, Math.min(1, s[`tab${y}`][1]))) * 180 / Math.PI; return tabanNoktalari(s[`a${y}`], p); };
/** Koşu bandı: yol = bandın oynatma başından beri aldığı yol (cm) */
const kosuBandi = (pr, yol) => {
  const D = BANT_D, koyu = { ust: '#30363d', yan: '#22272d' }, bant = { ust: '#1d2025', yan: '#16191d' }, ray = { ust: '#5d646d', yan: '#3b4148' };
  const o = [...M.kutu(pr, [-72, 70], [5, D - 1], [-34, 34], koyu),                                    // şase (güverte)
    ...M.kutu(pr, [-66, 64], [D - 1, D], [-24, 24], bant),                                               // bant
    ...[1, -1].flatMap(i => M.kutu(pr, [-70, 66], [D - 1, D + 1.5], i > 0 ? [24.5, 33] : [-33, -24.5], ray)),   // yan basamak rayları
    M.kapsul(pr, [-71, 12, -30], [-71, 12, 30], 6, '#3b4148'),                                          // arka makara kapağı
    ...M.kutu(pr, [64, 94], [3, D + 14], [-36, 36], KULE.govde),                                          // motor kapağı
    ...[-1, 1].flatMap(i => [M.kapsul(pr, [88, D + 12, 36 * i], [72, 126, 36 * i], 3, METAL),           // dikmeler
      M.kapsul(pr, [KORKULUK[1][0], KORKULUK[1][1], i * KORKULUK[1][2]], [KORKULUK[0][0], KORKULUK[0][1], i * KORKULUK[0][2]], 1.8, '#8a929c'),   // yan korkuluk
      M.kapsul(pr, [KORKULUK[1][0], KORKULUK[1][1], i * KORKULUK[1][2]], [74, 122, 36 * i], 1.8, '#8a929c')]),
    ...ekranPaneli(pr, [70, 133, 0], 34, [70, 20, 6])];   // konsol (kişiye dönük)
  const kay = yol % SERIT, L0 = SERIT_BOLGE[0], W = SERIT_BOLGE[1] - L0;
  for (let k = 0; k < SERIT_N; k++) { const x = L0 + dongu01((k * SERIT - kay + 1e-6) / W) * W;   // bant geriye akar
    o.push(...M.kutu(pr, [x - 1.2, x + 1.2], [D - 0.6, D + 0.15], [-23, 23], { ust: '#2c3138', yan: '#16191d' })); }
  return o;
};
/**
 * Koşu kolu (17 Eki): dirsek ~90° bükük ve hareket boyunca neredeyse sabit; üst kol omuzdan ileri-geri ±26° sallanır, el
 * önde göğüs altına, geride kalça hizasına gelir; kol gövdeye yakın. ileri ∈ [−1, 1] · i: +1 sağ, −1 sol.
 */
const kosuKolu = (om, i, ileri, acik = 9) => {
  const al = rd(-4 + 26 * ileri), be = rd(88 + 8 * ileri), ab = rd(acik);
  const U = [Math.sin(al) * Math.cos(ab), -Math.cos(al) * Math.cos(ab), i * Math.sin(ab)];
  const F = [Math.sin(al + be), -Math.cos(al + be), -i * 0.12];
  return { hedef: ekle(ekle(om, U, L.ua), F, L.fa), kutup: U };
};

/* ── EGZERSİZ MİNDERİ (16 Eki, Sabri: "plank ve mekik gibi yere uzanılarak ya da oturularak yapılan hareketler için güzel bir
 * mat yap; matın kısa üst kenarının sağ köşesine FS logosunu yerleştir; logo sporcunun başının geldiği tarafta olsun"). Standart
 * mat: 66 cm en, 0,8 cm kalınlık (yumuşak: beden ona gömülür gibi değer — sıkışır), boy bedeni baştan ayağa kaplar (en az 150 cm).
 * Logo başın tarafındaki kısa kenarın SAĞ köşesinde (ayak ucundan başa bakana göre — logo da o yönden okunur), 20 cm. */
const MINDER = { en: 66, kalin: 1.2, ton: { ust: '#1d242c', yan: '#141920' } };   // 2. tur: 0,8 → 1,2 cm (Sabri: "en az 1 cm"), köşeler yuvarlak   // koyu antrasit (sahne ışığı üst yüzü belirgin açar)
const mindereKoy = h => {
  const s = M.an(h, 0), bas = Math.sign(s.kafa[0] - s.P[0]) || 1;
  const basUc = s.kafa[0] + bas * (M.KAFA_R + 10), ayakUc = bas > 0 ? Math.min(s.uA[0], s.uB[0], s.aA[0], s.aB[0]) - 12 : Math.max(s.uA[0], s.uB[0], s.aA[0], s.aB[0]) + 12;
  const boy = Math.max(150, Math.abs(basUc - ayakUc)), x0 = bas > 0 ? basUc - boy : basUc, x1 = bas > 0 ? basUc : basUc + boy, Z = MINDER.en / 2;
  return { ...h,
    // minder zemin örtüsüdür: SVG yedeğinde HER ZAMAN önce çizilir (d = −∞) ve taşıyıcı yüzey sayılmaz — 0,8 cm'lik yüzeyde
    // üstündeki bedenle sıralama çatışması (görünürlük denetimi: 148 ihlal) çıkıyordu; altında zeminden başka bir şey yok
    ekipman: (pr, s2, t) => [...M.gizle3B(M.kutu(pr, [x0, x1], [0, MINDER.kalin], [-Z, Z], MINDER.ton).map(o => ({ ...o, d: -Infinity, ustYuz: false, geo: { ...o.geo, malzeme: 'minder' } }))),
      M.yastik3B([(x0 + x1) / 2, MINDER.kalin / 2, 0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [x1 - x0, MINDER.kalin, 2 * Z], { r: 5, pah: 0.45, malzeme: 'minder', renk: MINDER.ton.ust }),
      ...h.ekipman(pr, s2, t)],
    logolar: [{ merkez: [basUc - bas * 11, MINDER.kalin, bas * (Z - 11)], n: [0, 1, 0], yukari: [bas, 0, 0], en: 17, renk: '#11151a' }] };   // 16 Eki: 20 → 17, minderin biraz koyu tonu
};

/** ASILI KALDIRMA üreticisi (17 Eki, G3): düz bacak (bw_hanging_leg_raise) ve dizler bükük kolay hâli (bw_hanging_knee_raise)
 *  aynı bar, gövde ve kol modeli; fark yalnız diz bükümü ve uyluğun tepe açısı. */
// Asılırken omuz yükselmesi (cm): aktif asılmayla (0) pasif asılma (~6) arası (Sabri, 2. tur)
const OMUZ_KALK_ASILI = 3;
/* 3. tur (Sabri: "barfiksteki gibi dimdik ayaklar; bilek biraz daha açılı, doğal olsun"): yerden kesik ayağın kaval ile tabanı
   arasındaki büküm (plantar fleksiyon). Asılı ve bükük bacaklarda 53–63° ölçüldü (bale ucu gibi); gevşek bırakılan ayak ~30°.
   Taban yönü kavaldan türer: taban açısı = kaval açısı + 90 − AYAK_GEVSEK (taban kavala dik = 0°). */
const AYAK_GEVSEK = 30;
const asiliKaldirma = bukuk => {
    // Asılı bacak kaldırma (NSCA / ACE): barfiks barında asılı, kollar düz ve DİK, avuçlar öne, eller SABİT. Bacaklar düz
    // (K4), kalçadan öne-yukarı kalkar; tepede uyluk yataya yakın. GÖVDE DİK ya da HAFİF GERİDE (sırt biraz arkada, kalça biraz
    // önde) — 15 Eki, Sabri: "gerçekte öyle duramaz, omuzları buna müsaade etmez". ⚠️ İlk sürüm gövde açısını "ağırlık merkezi
    // barın altında" diye ÇÖZÜYORDU: bacaklar kalkınca gövde 30° ÖNE yatıyor (kollar başın üstünde dikken omuz bunu yapamaz) ve
    // kalça ~112° bükülüyordu — kalçadaki şort çökmesinin (Sabri: "en yukarıda kalça içeri göçüyor") ASIL kökü buydu. Artık
    // gövde 90° → 98° (8° geride); kalça bükümü tepede ~82°. Omuzlar barın altında, kollar dik.
    const HZ = OMUZ.yan + 10, BAR_R = 1.6, AYAK_BOSLUK = 6;
    const dizT = t => bukuk ? ara(10, 95, ease(t)) : ara(4, 10, ease(t));        // düz: tepede dizler çok hafif bükük · bükük: tepede ~90°
    // ÖLÜ ASILMA KOLLARI (15 Eki, Sabri: "kollar dirsekten geriye dönüyormuş gibi; dirsek 180°'yi geçemez"): dirsek 10° ÖNE-dışa
    // bükülüyordu. Kol başın üstünde ve avuç öndeyken dirseğin bükülme yönü GERİ-dışadır; öne bükülme hiperekstansiyon gibi
    // görünür. Kutup geri-dışa, büküm ~6° (kol boyunun %99,87'si).
    const KOL = Math.sqrt((ERISIM * 0.9987) ** 2 - (HZ - OMUZ.yan) ** 2);
    const uylukAci = t => ara(-86, bukuk ? 0 : -6, ease(t));                   // uyluğun YERE göre açısı: sarkık → yataya yakın
    const fiT = t => ara(91, 98, ease(t));                                      // gövde: dik → 8° geride (boyun kalçanın gerisinde)
    const pozFi = (fi, k, diz) => { const u = fi - 180 + k; return { P: [0, 0, 0], g: [0, fi], yan: [-90, 0], ayak: [0, u - diz + 90 - AYAK_GEVSEK], bas: 4, omuzKalk: OMUZ_KALK_ASILI,
      thA: [0, u], shA: [0, u - diz], thB: [0, u], shB: [0, u - diz], uaA: [0, 90], faA: [0, 90], uaB: [0, 90], faB: [0, 90] }; };
    const omuzOrta = s => s.omA.map((v, i) => (v + s.omB[i]) / 2);
    // omuz ortası barın altında (x = 0), kol boyu kadar aşağıda
    const yerlestir = (fi, k, diz) => { const p = pozFi(fi, k, diz), o = omuzOrta(M.iskelet(p)); return { ...p, P: [-o[0], -KOL - o[1], 0] }; };
    const kOf = (fi, u) => u - fi + 180;
    const alt = M.iskelet(yerlestir(fiT(0), kOf(fiT(0), uylukAci(0)), dizT(0)));
    const BY = AYAK_BOSLUK + 6 - Math.min(alt.aA[1], alt.uA[1], alt.aB[1], alt.uB[1]), BX = 0;
    const durum = t => { const u = uylukAci(t), fi = fiT(t), p = yerlestir(fi, kOf(fi, u), dizT(t)); return { ...p, P: [BX + p.P[0], BY + p.P[1], 0] }; };
    const el = i => [BX, BY, i * HZ];
    const KX = BX + 16;
    const kafes = pr => [-58, 58].flatMap(z => [
      ...M.kutu(pr, [KX - 2.5, KX + 2.5], [0, BY + 4], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),
      ...M.kutu(pr, [KX - 24, KX + 24], [0, 4], [z - 3, z + 3], M.SEHPA_TON.cerceve),
      ...M.kutu(pr, [BX - 2, KX - 2.5], [BY - 2, BY + 2], [z - 2, z + 2], M.SEHPA_TON.cerceve)])
      .concat(M.kutu(pr, [KX - 2.5, KX + 2.5], [BY + 4, BY + 9], [-60.5, 60.5], M.SEHPA_TON.cerceve),
        M.kapsul(pr, [BX, BY, -60], [BX, BY, 60], BAR_R, '#9aa2ac'));
    const kol = i => ({ hedef: el(i), kutup: [-0.6, -0.2, i], ...tut([0, 0, 1], BAR_R, 'ileri') });
    const kalcaFleks = s => 180 - aciOf(s.boyun, s.P, s.zA);
    return {
      ad: bukuk ? 'Hanging Knee Raise' : 'Hanging Leg Raise', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [BX + 20, 0, 0],
      poz: durum,
      uclar: () => () => ({ A: kol(1), B: kol(-1) }),
      ekipman: pr => kafes(pr),
      cisimler: () => [[[BX, BY, -60], [BX, BY, 60], BAR_R]],
      izlenen: 'aA',
      kisit: { ayaklar: 'havada', ozel: [
        { ad: 'eller barda sabit (≤ 0,5)', f: ks => { const m = Math.max(...ks.flatMap(s => [M.mesafe(s.eA, el(1)), M.mesafe(s.eB, el(-1))])); return { gecti: m <= 0.5, olcum: `en fazla ${m.toFixed(2)}` }; } },
        { ad: 'kollar düz (dirsek ≤ 15°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.omA, s.dA, s.eA))); return { gecti: m <= 15, olcum: `en fazla ${m.toFixed(1)}°` }; } },
        ozelDirsekGeri(),
        bukuk ? { ad: 'tepede dizler ~90° bükük (80–105°)', f: ks => { const m = 180 - aciOf(ks.at(-1).kaA, ks.at(-1).zA, ks.at(-1).aA); return { gecti: m >= 80 && m <= 105, olcum: `${m.toFixed(1)}°` }; } }
          : { ad: 'bacaklar düz (diz ≤ 15°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 15, olcum: `en fazla ${m.toFixed(1)}°` }; } },
        { ad: 'tepede uyluk yataya yakın (±12°)', f: ks => { const s = ks.at(-1), a = Math.atan2(s.zA[1] - s.kaA[1], s.zA[0] - s.kaA[0]) * 180 / Math.PI; return { gecti: Math.abs(a) <= 12, olcum: `${a.toFixed(1)}° (kalça ${kalcaFleks(s).toFixed(0)}°)` }; } },
        { ad: 'gövde dik ya da hafif geride (öne en çok 2° · geriye en çok 12°)', f: ks => { const a = ks.map(s => s.g[0] >= 0 ? Math.acos(Math.min(1, s.g[1])) * 180 / Math.PI : -Math.acos(Math.min(1, s.g[1])) * 180 / Math.PI);
            const on = Math.max(...a), geri = -Math.min(...a); return { gecti: on <= 2 && geri <= 12, olcum: `öne en çok ${on.toFixed(1)}° · geriye en çok ${geri.toFixed(1)}°` }; } },
        { ad: 'kollar dik (omuz barın altında, ≤ 3 cm)', f: ks => { const m = Math.max(...ks.map(s => Math.abs((s.omA[0] + s.omB[0]) / 2 - BX))); return { gecti: m <= 3, olcum: `en fazla ${m.toFixed(1)} cm` }; } },
        { ad: 'tepede kalça bükümü anatomik (70–100°)', f: ks => { const a = kalcaFleks(ks.at(-1)); return { gecti: a >= 70 && a <= 100, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'bar yüksekliği gerçek kafeste (200–245 cm)', f: () => ({ gecti: BY >= 200 && BY <= 245, olcum: `${BY.toFixed(1)} cm` }) },
      ] },
    };
};

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
    const DZ = OMUZ.yan + 3.5, EZ = 11, MAKARA = [40, KULE_MAKARA_UST, 0], bet = Math.asin((DZ - EZ) / L.fa);   // ön kollar içe eğik
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

  plank: mindereKoy((() => {
    // Omuz–kalça–bilek TEK ÇİZGİDE; dirsekler omzun tam altında, ön kollar yerde öne dönük, parmak uçlarında
    // B1: omuz yüksekliği = ön kol yarıçapı + üst kol; kalça→omuz = gövde − omuz düşüklüğü; bacak = uyluk + baldır.
    // Bilek yüksekliği parmak kökü (u) yerde kalacak biçimde ÇÖZÜLÜR (ayak eğimi bacak eğimine bağlı → yineleme).
    // 13 Eki (yüzey denetimi, dört gövdede de): ön kol ekseni R.fa yükseklikteyken GERÇEK mankenin yumruğu zemine 1,9 cm,
    // ön kolu 0,5–0,9 cm giriyordu (yumruk ön koldan kalın) → ön kollar 1 cm yukarıda
    const OMUZ_Y = R.fa + 1 + L.ua + OMUZ.on, GV = L.torso - OMUZ.asagi, BCK = L.th + L.sh;
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
  })()),

  bw_pushup: mindereKoy((() => {
    // NSCA / ACE şınav (1B dalga 2 pilotu, 14 Eki): ayak uçları ve avuçlar yerde SABİT, omuz–kalça–bilek TEK ÇİZGİ (plank
    // kuralı); beden ayak ucunun etrafında döner. Eller omuzdan biraz geniş, avuç yere düz, parmaklar öne. Dirsekler
    // gövdeye ~45° açıyla geriye bükülür (yana "T" açılmaz). Tepede kollar neredeyse düz, altta göğüs yerden ~6 cm.
    // AVUÇ YERDE (ölçüldü): iskeletin "eli" bileğin KAVRAMA cm ilerisinde (bar tutan el için); düz avuçta avuç merkezi bileğin
    // ÖNÜNDE kalır, üstünde değil → kavrama noktası ön kolun uzantısına konursa dirsek 9 cm yukarı çıkıyor ve altta 137°
    // bükülüyordu. Bilek motorla AYNI yerde (avucun AVUC cm gerisinde, yerin 1,1 cm üstünde); iskelet hedefi ön kolun o
    // bilekten geçen uzantısı. Motor avucu `zemin.avuc`tan yere yatırır.
    // Tepe ve alt nokta SAYISAL ÇÖZÜLÜR: alt = göğüs yerden GOGUS_BOSLUK; bilek, altta ön kol dik duracak biçimde omzun GERI cm
    // gerisinde (göğsün alt hizası); tepe = kol neredeyse düz.
    const UX = -100, HZ = OMUZ.yan + 6, GERI = 22, AVUC = 5.5, BILEK_Y = 3.4, KAVRAMA = M.KAVRAMA;
    // göğüs ön yüzü gövde ekseninden — YÜZEYLE AYARLI (14 Eki: 12 sayılınca "6 cm" diyordu, dört gövdede gerçek 2,7–3,1; Max'te
    // göğüs-karın yere değer, −0,2). Alt nokta değişmedi (DERIN + BOSLUK = 18).
    const GOGUS_DERIN = 15.2, GOGUS_BOSLUK = 2.8;
    const poz0 = al => ({ P: [0, 0, 0], g: [0, al], yan: [-90, 0], ayak: [0, -90 + al], bas: 4,
      thA: [180, -al], shA: [180, -al], thB: [180, -al], shB: [180, -al], uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] });
    const pozAl = al => { const s0 = M.iskelet(poz0(al)); return { ...poz0(al), P: [UX - s0.uA[0], TOP_Y - s0.uA[1], 0] }; };   // ayak ucu (parmak kökü) U'da sabit
    const omuz = al => M.iskelet(pozAl(al)).omA;
    const gogusY = al => M.iskelet(pozAl(al)).gogusAlt[1] - GOGUS_DERIN;
    const coz = (f, hedef, a = 1, b = 60) => { for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (f(m) < hedef) a = m; else b = m; } return (a + b) / 2; };
    const ALT = coz(gogusY, GOGUS_BOSLUK);
    const BX = omuz(ALT)[0] - GERI;                                        // bilek x
    // parmaklar öne, ~10° dışa (doğal); yön SABİT — ön koldan türetilince el inişte 63° dönüyordu (Sabri gördü, ölçüldü)
    const PARMAK = i => [Math.cos(rd(10)), 0, i * Math.sin(rd(10))];
    const bilek = i => [BX, BILEK_Y, i * HZ], avuc = i => [BX + AVUC * PARMAK(i)[0], 0, i * HZ + AVUC * PARMAK(i)[2]];
    const UST = coz(al => mesafe(omuz(al), bilek(1)), (L.ua + L.fa - KAVRAMA) * 0.995);
    const al = t => ara(UST, ALT, ease(t));
    const kol = (s, i) => { const kutup = [-0.75, 0.35, i * 0.55], om = i > 0 ? s.omA : s.omB, W = bilek(i);
      const r = M.ik2(om, W, L.ua, L.fa - KAVRAMA, kutup), u = birim(fark(W, r.dirsek));
      return { hedef: ekle(W, u, KAVRAMA), kutup, zemin: { avuc: avuc(i), yuk: BILEK_Y, parmak: PARMAK(i) } }; };
    const tekCizgi = s => { const o = s.omA.map((v, i) => (v + s.omB[i]) / 2), a = s.aA.map((v, i) => (v + s.aB[i]) / 2);
      const u = birim(fark(a, o)), v = fark(s.P, o); return mesafe(v, ekle([0, 0, 0], u, nokta(v, u))); };
    // dirsek açılımı: üst kolun gövde ekseniyle (ayaklara doğru) açısı, sırta dik bileşen atılarak (0 = kol yanda, 90 = T)
    const acilim = (s, y) => { const u = fark(s[`d${y}`], s[`om${y}`]), n = s.yuz, uu = fark(u, n.map(x => x * nokta(u, n)));
      return Math.acos(Math.max(-1, Math.min(1, -nokta(birim(uu), s.g)))) * 180 / Math.PI; };
    const bilekOf = (s, y) => ekle(s[`e${y}`], birim(fark(s[`d${y}`], s[`e${y}`])), KAVRAMA);
    return {
      ad: 'Şınav', kamera: [35, 14], seritKameralar: [[0, 0], [35, 14], [100, 30]], merkez: [(UX + BX) / 2, 0, 0],
      poz: t => pozAl(al(t)),
      uclar: () => s => ({ A: kol(s, 1), B: kol(s, -1) }),
      ekipman: () => [],
      izlenen: 'P',
      kisit: { ayaklar: 'parmakUcu', dizYonu: [0, -1, 0], ozel: [
        { ad: 'omuz–kalça–bilek tek çizgide (≤ 1,5)', f: ks => { const d = Math.max(...ks.map(tekCizgi)); return { gecti: d <= 1.5, olcum: `en fazla ${d.toFixed(1)}` }; } },
        { ad: 'bilekler yerde ve kaymıyor (≤ 0,3)', f: ks => { const d = Math.max(...ks.flatMap(s => ['A', 'B'].map((y, j) => mesafe(bilekOf(s, y), bilek(j ? -1 : 1))))); return { gecti: d <= 0.3, olcum: `en fazla ${d.toFixed(2)}` }; } },
        { ad: `altta göğüs yere yakın (1–6 cm, yüzeyle ayarlı)`, f: ks => { const s = ks.at(-1), y = s.gogusAlt[1] - GOGUS_DERIN;
            return { gecti: y >= 1 && y <= 6, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'altta dirsek 85–120°', f: ks => { const s = ks.at(-1), a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a >= 85 && a <= 120, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'altta ön kol dike yakın (≤ 20°)', f: ks => { const s = ks.at(-1), v = birim(fark(s.dA, s.eA)), a = Math.acos(Math.abs(v[1])) * 180 / Math.PI; return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'tepede kollar neredeyse düz (≤ 15°)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 15, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'dirsek gövdeye 25–65° (yana T açılmıyor)', f: ks => { const s = ks.at(-1), a = acilim(s, 'A'); return { gecti: a >= 25 && a <= 65, olcum: `altta ${a.toFixed(1)}°` }; } },
      ] },
    };
  })()),

  db_bench_press: (() => {
    // NSCA / ACE dambıl göğüs presi (1B dalga 2, 14 Eki): sırtüstü sehpa (bench ile aynı duruş), avuçlar ayaklara; tepede
    // dambıllar omuzların üstünde YAKIN ama değmiyor, altta göğsün İKİ YANINA iner (bar göğse değer, dambıl yanına iner),
    // dirsekler gövdeye ~45–70°. Hareket omza göre kurulur (sırtüstünde omuz x = kalça − gövde + omuz düşüklüğü).
    const s0 = M.iskelet({ ...SIRTUSTU, uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] }), OM = s0.omB, KOL = ERISIM * 0.99;
    const UST = { x: OM[0] + 3, z: 15 }, ALT = { x: OM[0] + 12, y: SIRTUSTU.P[1] + 17, z: OMUZ.yan + 12 };
    UST.y = OM[1] + Math.sqrt(KOL ** 2 - (UST.x - OM[0]) ** 2 - (OMUZ.yan - UST.z) ** 2);
    const el = (t, i) => { const k = ease(t); return [ara(UST.x, ALT.x, k), ara(UST.y, ALT.y, k), i * ara(UST.z, ALT.z, k)]; };
    return {
      ad: 'Dambıl göğüs presi', kamera: [28, 22], seritKameralar: [[0, 0], [28, 22], [72, 34]], merkez: [-20, 0, 0],
      a: SIRTUSTU,
      // t = 0 tepede (kollar uzanık), t = 1 altta — bench ile aynı: hareket yukarıda başlar ve biter
      uclar: t => () => ({ A: { hedef: el(t, -1), kutup: [0.4, -0.6, -0.7], ...tut(Z, 1.6, 'ayak') },
        B: { hedef: el(t, 1), kutup: [0.4, -0.6, 0.7], ...tut(Z, 1.6, 'ayak') } }),
      ekipman: (pr, s) => [...sehpa(pr), ...M.dambil(pr, s.eA, Z), ...M.dambil(pr, s.eB, Z)],
      cisimler: s => [M.dambilCismi(s.eA, Z), M.dambilCismi(s.eB, Z)],
      izlenen: 'eB',
      kisit: { ayaklar: 'yerde', dizYonu: [0.7, 0.7, 0], temas: sehpaTemaslari, ozel: [
        { ad: 'tepede kollar neredeyse düz (≤ 20°)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omB, s.dB, s.eB); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'tepede dambıllar yakın ama değmiyor (merkezler 26–36 cm)', f: ks => { const d = mesafe(ks[0].eA, ks[0].eB); return { gecti: d >= 26 && d <= 36, olcum: `${d.toFixed(1)} cm` }; } },
        { ad: 'altta dambıllar göğüs yanında (göğüs ekseninden 10–18 cm yukarıda)', f: ks => { const s = ks.at(-1), y = s.eB[1] - s.P[1]; return { gecti: y >= 10 && y <= 18, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'altta dirsek gövdeye 45–75°', f: ks => { const s = ks.at(-1), u = birim(fark(s.dB, s.omB)), g = birim(fark(s.P, s.boyun)), uu = birim(fark(u, s.yuz.map(x => x * nokta(u, s.yuz))));
            const a = Math.acos(Math.max(-1, Math.min(1, nokta(uu, g)))) * 180 / Math.PI; return { gecti: a >= 45 && a <= 75, olcum: `${a.toFixed(1)}°` }; } },
      ] },
    };
  })(),

  db_incline_press: (() => {
    // EĞİK SEHPADA DAMBIL PRES (NSCA / ACE; sırt 30–45°, üst göğüs: Rodríguez-Ridao 2020): ayarlı sehpanın sırtı 40°, kalça
    // oturakta, sırt ve başın arkası minderde, tabanlar yerde. Avuçlar ayaklara (dambıl ekseni yana). Tepede dambıllar
    // omuzların ÜSTÜNDE (yere dik itiş), yakın ama değmiyor; altta üst göğsün iki yanına iner, dirsekler gövdeye ~45–75°.
    const g = [180, 40], gd = yon(...g), n = yon(0, 50), P = [0, 44, 0], KOL = ERISIM * 0.99;
    const s0 = M.iskelet({ ...OTURUR(P, g), uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] }), OM = s0.omB;
    const UST = { x: OM[0] + 2, z: 15 }; UST.y = OM[1] + Math.sqrt(KOL ** 2 - (UST.x - OM[0]) ** 2 - (OMUZ.yan - UST.z) ** 2);
    const nOM = nokta(fark(OM, P), n), ALT0 = ekle(ekle([OM[0], OM[1], 0], gd, -16), n, 17 - nOM), ALT_Z = OMUZ.yan + 12;
    const el = (t, i) => { const k = ease(t); return [ara(UST.x, ALT0[0], k), ara(UST.y, ALT0[1], k), i * ara(UST.z, ALT_Z, k)]; };
    const kutup = i => ekle(ekle(gd.map(v => -0.4 * v), n, -0.6), [0, 0, i * 0.7]);
    return {
      ad: 'Incline Dumbbell Press', kamera: [35, 16], seritKameralar: [[0, 0], [35, 16], [110, 22]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      // t = 0 tepede (kollar uzanık), t = 1 altta — dambıl göğüs presi ile aynı
      uclar: t => () => ({ A: { hedef: el(t, 1), kutup: kutup(1), ...tut(Z, 1.6, 'ayak') }, B: { hedef: el(t, -1), kutup: kutup(-1), ...tut(Z, 1.6, 'ayak') } }),
      // oturak ve sırt minderi bedenden 1,5 cm açık (yüzey denetimi: makinedeki ölçülerle yaşlı kadın gövdesinde kıyafet 3,4 cm giriyordu)
      ekipman: (pr, s) => [...oturak(pr, 34.5), ...sirtMinderi(pr, s, n, 74, 32, 30, 1.5), ...M.dambil(pr, s.eA, Z), ...M.dambil(pr, s.eB, Z)],
      cisimler: s => [M.dambilCismi(s.eA, Z), M.dambilCismi(s.eB, Z)],
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(34.5), { ad: 'sırt minderde', f: sirtTemas(n, 1.5), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'tepede kollar neredeyse düz (≤ 20°)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omB, s.dB, s.eB); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'tepede dambıllar omuzların üstünde (yatayda ≤ 6 cm), yakın ama değmiyor (26–36 cm)', f: ks => { const s = ks[0], x = Math.abs(s.eA[0] - s.omA[0]), d = mesafe(s.eA, s.eB);
              return { gecti: x <= 6 && d >= 26 && d <= 36, olcum: `omuzdan ${x.toFixed(1)} cm · arası ${d.toFixed(1)} cm` }; } },
          { ad: 'altta dambıllar üst göğsün yanında (göğsün ön yüzüne göre −6…+6 cm)', f: ks => { const s = ks.at(-1), m = nokta(fark(s.eA, s.P), n) - R.gogus;
              return { gecti: m >= -6 && m <= 6, olcum: `${m.toFixed(1)} cm` }; } },
          { ad: 'altta dirsek gövdeye 45–70°', f: ks => { const s = ks.at(-1), u = birim(fark(s.dB, s.omB)), gg = birim(fark(s.P, s.boyun)), uu = birim(fark(u, s.yuz.map(x => x * nokta(u, s.yuz))));
              const a = Math.acos(Math.max(-1, Math.min(1, nokta(uu, gg)))) * 180 / Math.PI; return { gecti: a >= 45 && a <= 70, olcum: `${a.toFixed(1)}°` }; } },
        ] },
    };
  })(),

  bb_incline_press: (() => {
    // EĞİK BENCH PRESS (bar; G2, 17 Eki; NSCA / ACE): eğik dambıl presle aynı sehpa ve oturuş (sırt 40°, oturak ve minder bedenden
    // 1,5 cm açık), bar başın üstündeki dikmelerin kancasından alınır. Tutuş omuzdan ~11 cm geniş (bench'in yarım tutuşu), avuçlar
    // ayaklara. Tepede bar omuzların ÜSTÜNDE (yere dik itiş) ve kollar neredeyse düz; altta bar üst göğse (köprücüğün altına)
    // değer, dirsekler gövdeye ~45–75°. t = 0 tepede (bench press gibi yukarıda başlar ve biter).
    const g = [180, 40], gd = yon(...g), n = yon(0, 50), P = [0, 44, 0], TUTUS = OMUZ.yan + 11, BAR_R = 1.4;
    const s0 = M.iskelet({ ...OTURUR(P, g), uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] });
    const OM = s0.omA.map((v, i) => (v + s0.omB[i]) / 2);                    // omuzların ortası (z = 0)
    const UST = [OM[0] + 2, OM[1] + Math.sqrt((ERISIM * 0.995) ** 2 - (TUTUS - OMUZ.yan) ** 2 - 4), 0];
    const nOM = nokta(fark(OM, P), n), ALT = ekle(ekle([OM[0], OM[1], 0], gd, -12), n, R.gogus + BAR_R + 4 - nOM);   // üst göğüs, omuz ekseninin ~12 cm altı (denetim: 15'te meme hizasına yakındı; 11'de dirsek 140°'yi aşar) (+4: 2,5'te yaşlı erkekte bar kumaşa 2,1 cm giriyordu)
    const bar = t => { const k = ease(t); return [ara(UST[0], ALT[0], k), ara(UST[1], ALT[1], k), 0]; };
    const kutup = i => ekle(ekle(gd.map(v => -0.4 * v), n, -0.6), [0, 0, i * 0.7]);
    return {
      ad: 'Incline Barbell Bench Press', kamera: [35, 16], seritKameralar: [[0, 0], [35, 16], [110, 22]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const b = bar(t); return () => ({
        A: { hedef: [b[0], b[1], TUTUS], kutup: kutup(1), ...tut(Z, BAR_R, 'ayak') }, B: { hedef: [b[0], b[1], -TUTUS], kutup: kutup(-1), ...tut(Z, BAR_R, 'ayak') } }); },
      ekipman: (pr, s) => [...oturak(pr, 34.5), ...sirtMinderi(pr, s, n, 84, 34, 30, 1.5),
        ...M.benchDikmeleri(pr, UST[0] - 12, UST[1] - 6), ...M.halter(pr, bar(s.t))],
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(34.5), { ad: 'sırt minderde', f: sirtTemas(n, 1.5), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'tepede kollar neredeyse düz (≤ 20°), bar omuzların üstünde (yatayda ≤ 6 cm)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omA, s.dA, s.eA), x = Math.abs((s.eA[0] + s.eB[0]) / 2 - (s.omA[0] + s.omB[0]) / 2);
              return { gecti: a <= 20 && x <= 6, olcum: `dirsek ${a.toFixed(1)}° · omuzdan ${x.toFixed(1)} cm` }; } },
          { ad: 'altta bar üst göğüste (göğsün ön yüzüne 0–5 cm)', f: ks => { const s = ks.at(-1), b = bar(1), m = nokta(fark(b, s.P), n) - R.gogus - BAR_R;
              return { gecti: m >= -0.5 && m <= 5, olcum: `${m.toFixed(1)} cm` }; } },
          { ad: 'altta dirsek gövdeye 45–75°', f: ks => { const s = ks.at(-1), u = birim(fark(s.dB, s.omB)), gg = birim(fark(s.P, s.boyun)), uu = birim(fark(u, s.yuz.map(x => x * nokta(u, s.yuz))));
              const a = Math.acos(Math.max(-1, Math.min(1, nokta(uu, gg)))) * 180 / Math.PI; return { gecti: a >= 45 && a <= 75, olcum: `${a.toFixed(1)}°` }; } },
        ] },
    };
  })(),

  bb_skull_crusher: (() => {
    // YATARAK TRICEPS UZATMA (skull crusher; G2, 17 Eki; NSCA / ACE / ExRx "lying triceps extension"): düz sehpada sırtüstü,
    // ayaklar yerde, kısa bar omuz genişliğinde, avuçlar ayaklara. Üst kol başa doğru ~20° eğik ve SABİT (dirsek yerinde, dışa
    // açılmaz); yalnız ön kol dirsekten döner: tepede kollar neredeyse düz (omuzların üstünde, biraz baş tarafında), altta bar başın
    // tepesinin hemen ÖTESİNE iner (değmez; ExRx'in baş arkası çeşidi — metin de böyle söyler; üst kol 20° eğik, dirsek altta ~100° — 110°'de bar başa giriyordu). t = 0 tepede.
    const EGIM = 20, TUTUS = 14, BAR_YARI = 58, BAR_R = 1.4, PL = 47.5, PL_R = 13;
    const s0 = M.iskelet({ ...SIRTUSTU, uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] });
    const u = [-Math.sin(rd(EGIM)), Math.cos(rd(EGIM))];
    const E = (s, i) => { const om = i > 0 ? s.omB : s.omA, dz = i * TUTUS - om[2];              // A = −z (sırtüstü)
      const yat = Math.sqrt(L.ua ** 2 - dz * dz); return [om[0] + u[0] * yat, om[1] + u[1] * yat, om[2] + dz]; };
    const aci = t => rd(ara(8, 100, ease(t)));
    const yonOf = a => [u[0] * Math.cos(a) - u[1] * Math.sin(a), u[0] * Math.sin(a) + u[1] * Math.cos(a)];
    const el = (s, t, i) => { const e = E(s, i), d = yonOf(aci(t)); return [e[0] + d[0] * L.fa, e[1] + d[1] * L.fa, e[2]]; };
    const bar = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    return {
      ad: 'Skull Crusher', kamera: [30, 22], seritKameralar: [[0, 0], [30, 22], [80, 30]], merkez: [-20, 0, 0],
      a: SIRTUSTU,
      uclar: t => s => ({ A: { hedef: el(s, t, -1), kutup: fark(E(s, -1), s.omA), ...tut(Z, BAR_R, 'ayak') },
        B: { hedef: el(s, t, 1), kutup: fark(E(s, 1), s.omB), ...tut(Z, BAR_R, 'ayak') } }),
      ekipman(pr, s) {
        const m = bar(s), Q = k => [m[0], m[1], k], o = [...sehpa(pr), M.kapsul(pr, Q(-BAR_YARI), Q(BAR_YARI), BAR_R, '#9aa2ac')];
        for (const i of [-1, 1]) o.push(M.silindirParca(pr, Q(i * 44), Z, 3.2, 1.6, '#8a929c', { metal: true }),
          M.silindirParca(pr, Q(i * PL), Z, PL_R, 3.6, '#2f343a'), M.silindirParca(pr, Q(i * 50.6), Z, 3.4, 2, '#8a929c', { metal: true }));
        return o;
      },
      cisimler: s => { const m = bar(s); return [[[m[0], m[1], -BAR_YARI], [m[0], m[1], BAR_YARI], BAR_R],
        ...[-1, 1].map(i => [[m[0], m[1], i * (PL - 1.8)], [m[0], m[1], i * (PL + 1.8)], PL_R])]; },
      izlenen: 'eB',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [0.7, 0.7, 0], temas: sehpaTemaslari, ozel: [
        { ad: 'tepede kollar neredeyse düz (dirsek ≤ 20°)', f: ks => { const a = 180 - aciOf(ks[0].omB, ks[0].dB, ks[0].eB); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'altta dirsek 95–125° bükük', f: ks => { const a = 180 - aciOf(ks.at(-1).omB, ks.at(-1).dB, ks.at(-1).eB); return { gecti: a >= 95 && a <= 125, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'bar başa değmez (en yakın ≥ 3 cm)', f: ks => { const m = Math.min(...ks.map(s => mesafe(bar(s), s.kafa) - M.KAFA_R - BAR_R)); return { gecti: m >= 3, olcum: `${m.toFixed(1)} cm` }; } },
        { ad: 'üst kol sabit eğik (başa doğru 10–25°)', f: ks => { const a = ks.map(s => { const v = fark(s.dB, s.omB); return Math.atan2(-v[0], v[1]) * 180 / Math.PI; }), x = Math.min(...a), y = Math.max(...a);
          return { gecti: x >= 10 && y <= 25, olcum: `${x.toFixed(1)}–${y.toFixed(1)}°` }; } },
      ] },
    };
  })(),

  db_lateral_raise: (() => {
    // NSCA / ACE yana kaldırma (1B dalga 2, 14 Eki): ayakta, gövde sabit; kollar SKAPULA DÜZLEMİNDE (yandan ~20° önde) omuz
    // hizasına kalkar, dirsek hafif bükük ve SABİT, avuç altta uyluğa, tepede yere ('icAsagi'). Dambıl altta uyluğun dışında.
    const DUZLEM = 20, RF = ERISIM * 0.965, ALT = 15, UST = 86;
    const yanYon = i => [Math.sin(rd(DUZLEM)), 0, i * Math.cos(rd(DUZLEM))];
    const el = (s, t, i) => { const th = rd(ara(ALT, UST, ease(t))), om = i > 0 ? s.omA : s.omB;
      return ekle(ekle(om, [0, -1, 0], RF * Math.cos(th)), yanYon(i), RF * Math.sin(th)); };
    const EKSEN = [1, 0, 0];
    return {
      ad: 'Dambıl yana kaldırma', kamera: [60, 10], seritKameralar: [[0, 0], [60, 10], [90, 6]], merkez: [5, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: [-1, 0.2, 0.3], ...tut(EKSEN, 1.6, 'icAsagi') },
        B: { hedef: el(s, t, -1), kutup: [-1, 0.2, -0.3], ...tut(EKSEN, 1.6, 'icAsagi') }, ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman: (pr, s) => [...M.dambil(pr, s.eA, EKSEN), ...M.dambil(pr, s.eB, EKSEN)],
      cisimler: s => [M.dambilCismi(s.eA, EKSEN), M.dambilCismi(s.eB, EKSEN)],
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 }, dirsek: { aralik: [8, 35], sabit: true }, ozel: [
        { ad: 'tepede el omuz hizasında (omzun 0–8 cm altı)', f: ks => { const s = ks.at(-1), d = s.omA[1] - s.eA[1]; return { gecti: d >= 0 && d <= 8, olcum: `omzun ${d.toFixed(1)} cm altında` }; } },
        { ad: 'altta dambıl uyluğun dışında (el kalçadan ≥ 20 cm yanda)', f: ks => { const s = ks[0], z = s.eA[2] - s.P[2]; return { gecti: z >= 20, olcum: `${z.toFixed(1)} cm` }; } },
      ] },
    };
  })(),

  db_goblet_squat: (() => {
    // NSCA / ACE goblet squat (1B dalga 2, 14 Eki): dambıl DİK, göğsün önünde; iki avuç üst başı ALTTAN taşır (avuç yukarı,
    // parmaklar öne). Bar squat'ın kuralı: yük AYAK ORTASININ üstünde dikey iner — dambıl önde olduğu için gövde bar
    // squat'tan DİK kalır (altta ~60°). Dirsekler aşağı, altta dizlerin içinden geçer. Altta uyluk paralel, topuklar yerde.
    // Avuç teması şınavla aynı model: bilek motorla aynı yerde (avucun AVUC cm gerisi, yüzeyden YUK cm), iskelet hedefi ön kolun
    // uzantısı (kavrama payı); motor avucu `zemin` verisiyle dambıl başının alt yüzüne yatırır.
    // dambıl ayak ortasının ÖNÜNDE (bilek + DX): yük önde, beden arkada dengelenir (ayak ortasının üstünde iken ağırlık merkezi
    // topuğun 7,8 cm gerisindeydi, ölçüldü)
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 8, DX = 12, ORTA = AYAK_X + DX;
    const GOGUS_YUK = L.torso - 21, ON = R.gogus + 8.8;   // dambıl sapı: kalçadan gövde boyunca · göğsün önünde (+7'de ön kol göğse 2,7 cm giriyordu; +8,8'de Leo 0,5 · Max 2,9 cm — ölçüldü)
    const UST = { y: AYAKTA_Y - 0.9, fi: 86 }, ALT = { y: 45.1, fi: 60 };
    const AVUC = 5.5, YUK = 3.4, BAS_ALT = M.DAMBIL.sap / 2;              // sap merkezinden üst başın alt yüzüne
    const durum = t => { const k = ease(t), fi = ara(UST.fi, ALT.fi, k);
      return { fi, P: [ORTA - GOGUS_YUK * Math.cos(rd(fi)) - ON * Math.sin(rd(fi)), ara(UST.y, ALT.y, k), 0] }; };
    const dambil = s => ekle(ekle(s.P, s.g, GOGUS_YUK), s.yuz, ON);       // sap merkezi; eksen = gövde ekseni (dambıl göğse yaslı)
    const poz = t => { const d = durum(t); return { ...AYAKTA(d.P, [0, d.fi]), ayakA: -20, ayakB: 20, bas: (90 - d.fi) * 0.4 }; };
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.94, 0, 0.34] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.94, 0, -0.34] } };
    // KÂSE TUTUŞU (14 Eki, görsel denetim: avuçlar düz yukarı bakınca "tepsi taşıyor" gibiydi): avuçlar üst başın ALT-DIŞ
    // kenarını iki yandan sarar — avuç yukarı ve içe (dambıla) bakar, parmaklar öne-yukarı başın çevresinde.
    const kol = (s, i) => {
      const D = dambil(s), yanI = s.yan.map(v => v * i);
      const avuc = ekle(ekle(D, s.g, BAS_ALT - 1), yanI, M.DAMBIL.r * 0.85);
      const n = birim(ekle(s.g.map(v => -v * 0.75), yanI, 0.65));               // yüzey normali: aşağı-dışa (avuç ona ters: yukarı-içe)
      const parmak = birim(ekle(s.yuz, s.g, 0.6));
      const W = ekle(ekle(avuc, n, YUK), parmak, -AVUC), kutup = [0.4, -1, i * -0.2], om = i > 0 ? s.omA : s.omB;
      const r = M.ik2(om, W, L.ua, L.fa - M.KAVRAMA, kutup), u = birim(fark(W, r.dirsek));
      return { hedef: ekle(W, u, M.KAVRAMA), kutup, zemin: { avuc, n, yuk: YUK, parmak } };
    };
    return {
      ad: 'Goblet squat', kamera: [40, 10], seritKameralar: [[0, 0], [40, 10], [90, 6]], merkez: [0, 0, 0],
      poz,
      uclar: () => s => ({ A: kol(s, 1), B: kol(s, -1), ...ayaklar }),
      ekipman: (pr, s) => M.dambil(pr, dambil(s), s.g),
      cisimler: s => [M.dambilCismi(dambil(s), s.g)],
      izlenen: 'P',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], ozel: [
        { ad: `dambıl yolu dikey, ayak ortasının ${DX - 4.5} cm önünde (≤ ${TOL_KABA} cm)`, f: ks => { const x = ks.map(s => dambil(s)[0] - ORTA), a = Math.min(...x), b = Math.max(...x);
            return { gecti: a >= -TOL_KABA && b <= TOL_KABA, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'altta uyluk yere paralel (±6)', f: ks => { const s = ks.at(-1), m = s.kaA[1] - s.zA[1]; return { gecti: Math.abs(m) <= 6, olcum: `kalça dizden ${m.toFixed(1)} yukarıda` }; } },
        { ad: 'gövde bar squat\'tan dik (≥ 55°)', f: ks => { const m = Math.min(...ks.map(s => Math.asin(s.g[1]) * 180 / Math.PI)); return { gecti: m >= 55, olcum: `en eğik ${m.toFixed(1)}°` }; } },
        { ad: 'dizler parmak yönünde (içe düşmüyor)', f: ks => { const m = Math.min(...ks.map(s => s.zA[2] - s.kaA[2])); return { gecti: m >= 2, olcum: `diz kalçadan en az ${m.toFixed(1)} dışta` }; } },
        // ⚠️ "dirsekler dizlerin içinden geçer" ipucu bu iskelette tutturulamadı: altta dirsek dizin ~6,5 cm dışında (içe çekilince ayakta
        //    dirsek gövdeye giriyor; geniş duruş dizi dışarı taşımıyor — ölçüldü). Kural: dirsekler AŞAĞI bakar.
        { ad: 'dirsekler aşağı bakar (omzun ≥ 15 cm altında)', f: ks => { const m = Math.min(...ks.map(s => s.omA[1] - s.dA[1])); return { gecti: m >= 15, olcum: `en az ${m.toFixed(1)} cm` }; } },
        ozelAgm(dambil, AYAK_X),
      ] },
    };
  })(),

  bw_pullup: (() => {
    // NSCA / ACE barfiks (1B dalga 2, 14 Eki): eller barda omuzdan biraz geniş, avuçlar öne (pronasyon) ve SABİT; altta
    // kollar neredeyse düz (ölü asılma), tepede çene barın üstünde. Beden hafif geride (bar yüzün önünden geçer), bacaklar
    // gövdeyle hemen hemen bir çizgide, ayaklar yerden kesik. Alt ve tepe SAYISAL ÇÖZÜLÜR (şınavla aynı yol): poz kalçasız
    // kurulur, omuz/çene/boyun ofseti ölçülür, kalça hedef noktadan geri hesaplanır. Bar yüksekliği ayak boşluğundan türer.
    const HZ = OMUZ.yan + 13, BAR_R = 1.6, AYAK_BOSLUK = 8;               // el yanalı (omuzdan 13 cm geniş; 11'de tepede dirsek 143°) · bar yarıçapı (Ø32)
    const ALT_FI = 94, UST_FI = 104;                                      // gövde dikten 4° → 14° geride (tepede göğüs bara)
    const pozFi = (fi, kalk = 0) => ({ P: [0, 0, 0], g: [0, fi], yan: [-90, 0], ayak: [0, fi - 186 + 90 - AYAK_GEVSEK], bas: 4, omuzKalk: kalk,
      thA: [0, fi - 174], shA: [0, fi - 186], thB: [0, fi - 174], shB: [0, fi - 186],
      uaA: [0, 90], faA: [0, 90], uaB: [0, 90], faB: [0, 90] });
    const cene = s => ekle(ekle(s.kafa, s.gBas, -10), s.yuzBas, 6);       // çene ucu (baş merkezinden aşağı-öne; görselle doğrulandı)
    const omuzOrta = s => s.omA.map((v, i) => (v + s.omB[i]) / 2);
    const s0 = (fi, kalk = 0) => M.iskelet(pozFi(fi, kalk));
    // altta: omuz ortası barın 3 cm gerisinde, kol (kavramaya kadar) %99,87 uzanık (dirsek ~6°)
    const KOL = Math.sqrt((ERISIM * 0.9987) ** 2 - (HZ - OMUZ.yan) ** 2 - 9);   // ölü asılma: büküm ~6° (asılı bacak kaldırmayla aynı)
    const altO = omuzOrta(s0(ALT_FI, OMUZ_KALK_ASILI)), ALT_P = [-3 - altO[0], -KOL - altO[1], 0];          // bar (0, 0) noktasında
    // tepede: çene barın UST_CENE cm üstünde, boyun barın UST_GERI cm gerisinde
    const UST_CENE = 2, UST_GERI = 17;
    const us = s0(UST_FI), UST_P = [-UST_GERI - us.boyun[0], UST_CENE - cene(us)[1], 0];
    // bar yüksekliği: altta en alçak ayak eklemi (bilek / parmak kökü) yerden AYAK_BOSLUK (+ parmaklar ~6 cm aşağı uzanır)
    const altS = M.iskelet({ ...pozFi(ALT_FI, OMUZ_KALK_ASILI), P: ALT_P });
    const BY = AYAK_BOSLUK + 6 - Math.min(altS.aA[1], altS.uA[1], altS.aB[1], altS.uB[1]), BX = 0;
    // beden geriye ERKEN gider (kx önde): baş barın hizasına gelmeden barın gerisine geçer, bar yüzün önünden akar
    const durum = t => { const k = ease(t), kx = 1 - (1 - k) ** 2, fi = ara(ALT_FI, UST_FI, kx);
      return { ...pozFi(fi, ara(OMUZ_KALK_ASILI, 0, k)), P: [BX + ara(ALT_P[0], UST_P[0], kx), BY + ara(ALT_P[1], UST_P[1], k), 0] }; };   // çekerken omuz iner
    const el = i => [BX, BY, i * HZ];
    // Kafes ÖNDE (kişi kafese bakar): dikmeler barın KX önünde — yandan bakışta beden dikmenin arkasında kalmasın; bar dikmelere
    // kısa kollarla bağlı (gerçek kafeslerde barfiks barı ön kirişten öne/arkaya taşar)
    const KX = BX + 16;
    const kafes = pr => [-58, 58].flatMap(z => [
      ...M.kutu(pr, [KX - 2.5, KX + 2.5], [0, BY + 4], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),     // dikme
      ...M.kutu(pr, [KX - 24, KX + 24], [0, 4], [z - 3, z + 3], M.SEHPA_TON.cerceve),               // ayak
      ...M.kutu(pr, [KX - 9, KX - 2.5], [117, 120], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),       // J kanca (squat kafesinin dili)
      ...M.kutu(pr, [KX - 9, KX - 7], [120, 124], [z - 2.5, z + 2.5], M.SEHPA_TON.cerceve),
      ...M.kutu(pr, [BX - 2, KX - 2.5], [BY - 2, BY + 2], [z - 2, z + 2], M.SEHPA_TON.cerceve)])     // bar kolu
      .concat(M.kutu(pr, [KX - 2.5, KX + 2.5], [BY + 4, BY + 9], [-60.5, 60.5], M.SEHPA_TON.cerceve),  // üst kiriş
        M.kapsul(pr, [BX, BY, -60], [BX, BY, 60], BAR_R, '#9aa2ac'));                              // barfiks barı
    // dirsek altta GERİ-dışa bükülür (ölü asılma, kol başın üstünde); çekerken dirsekler aşağı-öne iner → kutup kademeli döner
    const kol = (s, i, t) => { const k = Math.min(1, ease(t) * 3);
      return { hedef: el(i), kutup: [ara(-0.6, 0.25, k), ara(-0.2, -0.6, k), i], ...tut([0, 0, 1], BAR_R, 'ileri') }; };
    return {
      ad: 'Barfiks', kamera: [-40, 10], seritKameralar: [[0, 0], [-40, 10], [90, 6]], merkez: [BX - 10, 0, 0],
      poz: durum,
      uclar: t => s => ({ A: kol(s, 1, t), B: kol(s, -1, t) }),
      ekipman: pr => kafes(pr),
      cisimler: () => [[[BX, BY, -60], [BX, BY, 60], BAR_R]],
      izlenen: 'P',
      kisit: { ayaklar: 'havada', ozel: [
        { ad: 'eller barda sabit (≤ 0,5)', f: ks => { const m = Math.max(...ks.flatMap(s => [M.mesafe(s.eA, el(1)), M.mesafe(s.eB, el(-1))]));
            return { gecti: m <= 0.5, olcum: `en fazla ${m.toFixed(2)}` }; } },
        { ad: 'altta kollar neredeyse düz (≤ 15°)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 15, olcum: `${a.toFixed(1)}°` }; } },
        ozelDirsekGeri(0.05),
        { ad: 'tepede çene barın üstünde (0–8 cm)', f: ks => { const y = cene(ks.at(-1))[1] - BY; return { gecti: y >= 0 && y <= 8, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'bar başa girmiyor (baş küresi 10 cm + bar)', f: ks => { let en = Infinity, yer = 0;
            for (const s of ks) { const d = Math.hypot(BX - s.kafa[0], BY - s.kafa[1]) - 10 - BAR_R; if (d < en) { en = d; yer = s.t; } }
            return { gecti: en >= 0, olcum: `en yakın ${en.toFixed(1)} (t=${yer.toFixed(2)})` }; } },
        { ad: 'gövde dikten en çok 20° (sallanmıyor)', f: ks => { const m = Math.max(...ks.map(s => Math.acos(s.g[1]) * 180 / Math.PI));
            return { gecti: m <= 20, olcum: `en fazla ${m.toFixed(1)}°` }; } },
        { ad: 'bar yüksekliği gerçek kafeste (200–245 cm)', f: () => ({ gecti: BY >= 200 && BY <= 245, olcum: `${BY.toFixed(1)} cm` }) },
      ] },
    };
  })(),
  bw_dips: (() => {
    // NSCA / ACE paralel bar (dips, 1B dalga 2, 14 Eki): avuçlar içe bakar (nötr), eller barda SABİT; tepede kollar uzanık
    // ama kilitli değil, omuzlar ellerin üstünde. İnerken gövde öne eğilir (göğüs ağırlıklı dips: 10–30°), dirsekler geriye
    // bükülür, altta dirsek ~90° ve omuz dirsek hizasına iner. Dizler bükük, ayaklar geride ve yerden kesik.
    // Alt ve tepe SAYISAL ÇÖZÜLÜR (barfiksle aynı yol): poz kalçasız kurulur, omuz ofseti ölçülür, kalça geri hesaplanır.
    const HZ = OMUZ.yan + 7, BAR_R = 2.2, AYAK_BOSLUK = 22;                 // el yanalı (barlar ~53 cm arayla) · bar Ø44
    const UST_FI = 84, ALT_FI = 68;                                        // gövde dikten 6° → 22° önde
    const pozFi = fi => ({ P: [0, 0, 0], g: [0, fi], yan: [-90, 0], ayak: [0, -150 + 90 - AYAK_GEVSEK], bas: 6 + (84 - fi) * 0.5,
      thA: [0, -84], shA: [0, -150], thB: [0, -84], shB: [0, -150],
      uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] });
    const omuzOrta = s => s.omA.map((v, i) => (v + s.omB[i]) / 2);
    const s0 = fi => M.iskelet(pozFi(fi));
    const dz = HZ - OMUZ.yan;
    // tepe: omuz ortası ellerin 2 cm önünde, kol (kavramaya kadar) %99,3 uzanık
    const UST_X = 2, UST_Y = Math.sqrt((ERISIM * 0.993) ** 2 - dz * dz - UST_X ** 2);
    // alt: dirsek iç açısı ALT_DIRSEK → omuz–kavrama uzaklığı; omuz ellerin ALT_X önünde
    const ALT_DIRSEK = 92, ALT_X = 17, d90 = Math.sqrt(L.ua ** 2 + L.fa ** 2 - 2 * L.ua * L.fa * Math.cos(rd(ALT_DIRSEK)));
    const ALT_Y = Math.sqrt(d90 ** 2 - dz * dz - ALT_X ** 2);
    const pAl = (fi, x, y) => { const o = omuzOrta(s0(fi)); return [x - o[0], y - o[1], 0]; };
    const UST_P = pAl(UST_FI, UST_X, UST_Y), ALT_P = pAl(ALT_FI, ALT_X, ALT_Y);
    // bar yüksekliği: altta en alçak ayak eklemi yerden AYAK_BOSLUK (+ parmaklar ~6 cm)
    const altS = M.iskelet({ ...pozFi(ALT_FI), P: ALT_P });
    const HY = AYAK_BOSLUK + 6 - Math.min(altS.aA[1], altS.uA[1], altS.aB[1], altS.uB[1]), HX = 0;
    const durum = t => { const k = ease(t), fi = ara(UST_FI, ALT_FI, k);
      return { ...pozFi(fi), P: [HX + ara(UST_P[0], ALT_P[0], k), HY + ara(UST_P[1], ALT_P[1], k), 0] }; };
    const el = i => [HX, HY, i * HZ];
    const ON = 28, ARKA = -26;                                             // bar uçları (x): ayaklar geride → arka direk dizlerden uzak
    const istasyon = pr => [-1, 1].flatMap(i => [
      M.kapsul(pr, [HX + ARKA, HY, i * HZ], [HX + ON, HY, i * HZ], BAR_R, '#9aa2ac'),                       // paralel bar
      ...[HX + ARKA, HX + ON].flatMap(x => M.kutu(pr, [x - 2.5, x + 2.5], [0, HY - BAR_R], [i * HZ - 2.5, i * HZ + 2.5], M.SEHPA_TON.cerceve)),   // direkler
      ...M.kutu(pr, [HX + ARKA - 3, HX + ON + 3], [0, 4], [i * HZ - 4, i * HZ + 4], M.SEHPA_TON.cerceve)])   // taban
      .concat(M.kutu(pr, [HX + ON - 2.5, HX + ON + 2.5], [0, 4], [-HZ, HZ], M.SEHPA_TON.cerceve));          // önde bağlantı (arkada yok: ayaklar)
    const kol = (s, i) => ({ hedef: el(i), kutup: [-1, 0.2, i * 0.25], ...tut([1, 0, 0], BAR_R, 'ic') });
    return {
      ad: 'Paralel bar (dips)', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [-40, 10]], merkez: [-5, 0, 0],
      poz: durum,
      uclar: () => s => ({ A: kol(s, 1), B: kol(s, -1) }),
      ekipman: pr => istasyon(pr),
      cisimler: () => [-1, 1].map(i => [[HX + ARKA, HY, i * HZ], [HX + ON, HY, i * HZ], BAR_R]),
      izlenen: 'P',
      kisit: { ayaklar: 'havada', ozel: [
        { ad: 'eller barda sabit (≤ 0,5)', f: ks => { const m = Math.max(...ks.flatMap(s => [M.mesafe(s.eA, el(1)), M.mesafe(s.eB, el(-1))]));
            return { gecti: m <= 0.5, olcum: `en fazla ${m.toFixed(2)}` }; } },
        { ad: 'tepede kollar uzanık, kilitli değil (5–20°)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a >= 5 && a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'altta dirsek ~90° (80–100°)', f: ks => { const s = ks.at(-1), a = aciOf(s.omA, s.dA, s.eA); return { gecti: a >= 80 && a <= 100, olcum: `iç açı ${a.toFixed(1)}°` }; } },
        { ad: 'altta omuz dirsek hizasında (dirseğin 0–8 cm üstü)', f: ks => { const s = ks.at(-1), y = s.omA[1] - s.dA[1]; return { gecti: y >= 0 && y <= 8, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'altta gövde öne 10–30°', f: ks => { const a = 90 - Math.asin(ks.at(-1).g[1]) * 180 / Math.PI; return { gecti: a >= 10 && a <= 30, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'dirsekler geriye bükülür (yana açılmaz)', f: ks => { const s = ks.at(-1), m = Math.max(...['A', 'B'].map(y => Math.abs(s[`d${y}`][2]) - Math.abs(s[`om${y}`][2])));
            return { gecti: m <= 8, olcum: `dirsek omzun en çok ${m.toFixed(1)} cm dışında` }; } },
        { ad: 'bar yüksekliği gerçek istasyonda (100–140 cm)', f: () => ({ gecti: HY >= 100 && HY <= 140, olcum: `${HY.toFixed(1)} cm` }) },
      ] },
    };
  })(),

  /* ─── 2. GÜN ─────────────────────────────────────────────────────────── */

  cable_close_pulldown: (() => {
    const g = [180, 70], gd = yon(...g), n = yon(0, 20), P = [0, 41, 0], MAKARA = [12, KULE_MAKARA_UST, 0];   // gövde 20° geride (ACE ≤30°)
    // 17 Eki (Sabri: "dipte bar göğse giriyor"): ölçüldü — dört gövdede kulpun arka ucu göğüs giysisine 1,0–1,3 cm giriyordu →
    // tutamak 4 cm önde (+5 → +9; erkek göğsü daha önde) ve kulp ±5 (aşağıda)
    const alt = ekle(ekle(P, gd, L.torso - OMUZ.asagi - 11), n, R.gogus + 9);   // göğsün üst kısmı (omzun 11 cm altı; dirsek ≤ 140°)
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
        return [...oturak(pr, 33, [-14, 12]), ...minderKutu(pr, [14, 26], [PED, PED + 6], [-16, 16], PED_RENK, -1),
          ...kabloKulesi(pr, 72, MAKARA, 1, yiginKalkisi(this, MAKARA, q => ekle(yol(q.t), d, 6), s)),                                                             // kule karşıda (8 Eki: 44 → 72, ayak ucu x ≤ 65 kuleye giriyordu), makara tepede
          ...M.kutu(pr, [26, 72], [PED + 1, PED + 5], [-4, 4], KULE.govde), ...M.kutu(pr, [12, 72], [0, 4], [-6, 6], KULE.govde),   // ped kolu + oturak rayı kuleye bağlı
          ...M.kutu(pr, [72, 77], [PED + 1, PED + 5], [-21, 21], KULE.govde),   // 3. tur: ped kolu iki dikmenin arasında havada bitiyordu → dikmeler arası kiriş
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          ...paralelKulp(pr, [[c[0], c[1], 7], [c[0], c[1], -7]], KULP, tepe, 5)];   // 17 Eki: kulp ±6,5 → ±5 (dipte arka uç göğse 0,6 cm giriyordu)
      },
      cisimler: s => [[MAKARA, ekle(yol(s.t), d, 6), 0.7]],
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0], govde: { aralik: [68, 72], oynama: 1 },
        temas: [kalcaOturakta(33), { ad: 'uyluk pedin altında', f: s => PED - ((s.kaA[1] + s.zA[1]) / 2 + R.th), aralik: [-1.5, 1.5] }] },
    };
  })(),
  cable_wide_pulldown: (() => {
    // NSCA / ACE geniş tutuş lat çekiş (1B dalga 2 Parti B, 14 Eki): dar tutuşla aynı oturak, uyluk pedi ve kule; uzun düz
    // bar, avuçlar öne (pronasyon), tutuş omuzdan ~1,5 kat geniş. Bar KABLO doğrultusunda iner ve ÜST GÖĞSE gelir (baş
    // arkasına değil — omuz ön kapsülünü zorlar). Gövde ~20° geride. Tepe noktası SAYISAL: kol (kavramaya kadar) %97 uzanık.
    const g = [180, 70], gd = yon(...g), n = yon(0, 20), P = [0, 41, 0], MAKARA = [12, KULE_MAKARA_UST, 0];
    const HZ = Math.round(OMUZ.yan * 1.55), BAR_YARI = 60, BAR_R = 1.4;   // el yanalı (omuz ekseninin 1,55 katı) · bar 120 cm
    const PED = Math.round((P[1] + AYAK_Y + L.sh * Math.sin(rd(88))) / 2 + R.th);
    const alt = ekle(ekle(P, gd, L.torso - OMUZ.asagi - 15), n, R.gogus + 5);       // üst göğsün önü (omzun 15 cm altı; 9'da dirsek 145°)
    const d = birim(fark(MAKARA, alt));
    const s0 = M.iskelet(OTURUR(P, g, [-90, 0], 6)), om = s0.omA;                  // gövde sabit: omuz her karede aynı
    const elA = c => [c[0], c[1], HZ];
    const uzaklik = k => M.mesafe(om, elA(ekle(alt, d, k)));
    const KOL = ERISIM * 0.99; let a = 0, b = 80;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (uzaklik(m) < KOL) a = m; else b = m; }
    const ust = ekle(alt, d, (a + b) / 2);
    const yol = t => ekle(ust, fark(alt, ust), ease(t));
    const BAR = [0, 0, 1], barOrta = s => s.eA.map((v, i) => (v + s.eB[i]) / 2);
    return {
      ad: 'Lat çekiş (geniş tutuş)', kamera: [-40, 10], seritKameralar: [[0, 0], [-40, 10], [150, 14]], merkez: [8, 0, 0],
      a: OTURUR(P, g, [-90, 0], 6),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], HZ], kutup: [0.2, -1, 0.6], ...tut(BAR, BAR_R, 'ileri') },
        B: { hedef: [c[0], c[1], -HZ], kutup: [0.2, -1, -0.6], ...tut(BAR, BAR_R, 'ileri') } }); },   // dirsekler aşağı ve yana iner
      ekipman(pr, s, t) {
        const c = yol(t), tepe = ekle(c, d, 4);
        return [...oturak(pr, 33, [-14, 12]), ...minderKutu(pr, [14, 26], [PED, PED + 6], [-16, 16], PED_RENK, -1),
          ...kabloKulesi(pr, 72, MAKARA, 1, yiginKalkisi(this, MAKARA, q => ekle(yol(q.t), d, 4), s)),
          ...M.kutu(pr, [26, 72], [PED + 1, PED + 5], [-4, 4], KULE.govde), ...M.kutu(pr, [12, 72], [0, 4], [-6, 6], KULE.govde),
          ...M.kutu(pr, [72, 77], [PED + 1, PED + 5], [-21, 21], KULE.govde),   // 3. tur: dikmeler arası kiriş (ped kolu havadaydı)
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, tepe),
          M.kapsul(pr, [c[0], c[1], -BAR_YARI], [c[0], c[1], BAR_YARI], BAR_R, '#8a929c'),                       // uzun düz bar
          ...[-1, 1].map(i => M.kapsul(pr, [c[0], c[1], i * (HZ - 6)], [c[0], c[1], i * (HZ + 6)], BAR_R + 0.5, '#2f343a')),   // kauçuk tutma yerleri
          M.kapsul(pr, c, tepe, 0.9, '#8a929c')];
      },
      cisimler: s => { const c = yol(s.t); return [[MAKARA, ekle(c, d, 4), 0.7], [[c[0], c[1], -BAR_YARI], [c[0], c[1], BAR_YARI], BAR_R]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0], govde: { aralik: [68, 72], oynama: 1 },
        temas: [kalcaOturakta(33), { ad: 'uyluk pedin altında', f: s => PED - ((s.kaA[1] + s.zA[1]) / 2 + R.th), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'tutuş omuzdan geniş (el arası / omuz arası 1,4–1,9)', f: ks => { const s = ks[0], r = M.mesafe(s.eA, s.eB) / M.mesafe(s.omA, s.omB);
              return { gecti: r >= 1.4 && r <= 1.9, olcum: `${r.toFixed(2)} kat` }; } },
          { ad: 'tepede kollar uzanık (dirsek ≤ 20°)', f: ks => { const s = ks[0], m = Math.max(...['A', 'B'].map(y => 180 - aciOf(s[`om${y}`], s[`d${y}`], s[`e${y}`])));
              return { gecti: m <= 20, olcum: `${m.toFixed(1)}°` }; } },
          // bar merkezi = iki kavramanın ortası (yoldan değil ELDEN — yanlış çekişi gören ölçü)
          { ad: 'altta bar üst göğüste (omzun 0–14 cm altı, göğsün önünde)', f: ks => { const s = ks.at(-1), c = barOrta(s), om2 = s.omA.map((v, i) => (v + s.omB[i]) / 2);
              const y = om2[1] - c[1], on = nokta(fark(c, s.boyun), s.yuz);
              return { gecti: y >= 0 && y <= 14 && on >= R.gogus, olcum: `omzun ${y.toFixed(1)} altı · boyunun ${on.toFixed(1)} önü` }; } },
          { ad: 'bar başa girmiyor (baş küresi 10 cm + bar)', f: ks => { let en = Infinity, yer = 0;
              for (const s of ks) { const c = barOrta(s), dd = Math.hypot(c[0] - s.kafa[0], c[1] - s.kafa[1]) - 10 - BAR_R; if (dd < en) { en = dd; yer = s.t; } }
              return { gecti: en >= 0, olcum: `en yakın ${en.toFixed(1)} (t=${yer.toFixed(2)})` }; } },
          { ad: 'altta dirsekler omzun altında (≥ 12 cm)', f: ks => { const s = ks.at(-1), m = Math.min(...['A', 'B'].map(y => s[`om${y}`][1] - s[`d${y}`][1]));
              return { gecti: m >= 12, olcum: `${m.toFixed(1)} cm` }; } },
        ] },
    };
  })(),
  ...(() => {
    // BACAK AÇMA / BACAK BÜKME (1B dalga 2 Parti B, 14 Eki): TEK MAKİNE, İKİ PED (plan §2). Oturur, sırt minderde, eller
    // oturağın yanındaki tutamaklarda. Uyluk oturakta SABİT; kaval diz ekseni etrafında döner ve makinenin dönüş ekseni DİZ
    // EKSENİNDE (NSCA: hizasızlık dize kesme kuvveti bindirir). Ped kola bağlı ve kavalla BİRLİKTE döner (kol boyu sabit).
    // Açma: ped kavalın ÖNÜNDE, bileğin hemen üstünde · Bükme: ped kavalın ARKASINDA (topuk üstü) + uyluk pedi dizlerin üstünde.
    const P = [0, 58, 0], g = [180, 80], n = yon(0, 10), OTURAK_UST = P[1] - R.kalca;
    const TH = -2, ACIK = 4;                                                    // uyluk oturakta neredeyse yatay, hafif açık
    const PAD_R = 5, PAD_YARI = 17, KOL_Z = KALCA_YAN + 18, PED_KAVAL = 6;       // ped yarıçapı · ped yarı boyu · kol yanalı · ped bilekten yukarıda
    const PED_ESIK = 4.2;                                                       // kaval ekseninden yüzeye, bilek üstünde (yüzey ölçümüyle ayarlanır)
    const poz = sh => ({ P, g, yan: [-90, 0], ayak: [0, sh + 90],
      thA: [-ACIK, TH], shA: [-ACIK, sh], thB: [ACIK, TH], shB: [ACIK, sh],
      uaA: [-90, -85], faA: [-90, -85], uaB: [90, -85], faB: [90, -85] });
    // pivot = diz ekseni: uyluk sabit olduğu için diz her karede aynı yerde (iskeletten okunur)
    const PIV = (() => { const s = M.iskelet(poz(-90)); return [(s.zA[0] + s.zB[0]) / 2, (s.zA[1] + s.zB[1]) / 2, 0]; })();
    const kavalYon = sh => [Math.cos(rd(sh)), Math.sin(rd(sh)), 0], kavalOn = sh => [-Math.sin(rd(sh)), Math.cos(rd(sh)), 0];
    const ped = (sh, isaret) => ekle(ekle(PIV, kavalYon(sh), L.sh - PED_KAVAL), kavalOn(sh), isaret * (PED_ESIK + PAD_R));
    const tutamak = i => [P[0] + 4, OTURAK_UST + 6, i * (KALCA_YAN + 17)];
    const eller = () => () => ({ A: { hedef: tutamak(1), kutup: [-0.6, -0.6, 0.6], ...tut([1, 0, 0], 1.6, 'ic') },
      B: { hedef: tutamak(-1), kutup: [-0.6, -0.6, -0.6], ...tut([1, 0, 0], 1.6, 'ic') } });
    const UYLUK_PEDI = [PIV[0] - 10, P[1] + R.th + 1 + PAD_R, 0];               // bükmede uylukların üstünde, dizin 10 cm gerisinde
    const makine = (pr, sh, isaret, uylukPedi) => {
      const Q = ped(sh, isaret), kolUc = [Q[0], Q[1], KOL_Z];
      const o = [...oturak(pr, OTURAK_UST, [-24, PIV[0] - 14]), ...M.kutu(pr, [-30, PIV[0] + 8], [0, 4], [-26, 26], KULE.govde),
        ...M.kutu(pr, [PIV[0] - 3, PIV[0] + 3], [0, PIV[1]], [KOL_Z + 1, KOL_Z + 6], KULE.govde),                              // eksen ayağı (dış yanda)
        M.silindirParca(pr, [PIV[0], PIV[1], KOL_Z], [0, 0, 1], 4.2, 3, '#8a929c', { metal: true }),                           // dönüş ekseni göbeği
        M.kapsul(pr, [PIV[0], PIV[1], KOL_Z], kolUc, 1.8, METAL),                                                              // kol (kavalla birlikte döner)
        M.kapsul(pr, kolUc, [Q[0], Q[1], PAD_YARI], 1.2, METAL),
        M.silindirParca(pr, Q, [0, 0, 1], PAD_R, PAD_YARI * 2, '#2f343a'),                                                     // ped (silindir)
        ...[-1, 1].map(i => M.kapsul(pr, ekle(tutamak(i), [-7, 0, 0]), ekle(tutamak(i), [9, 0, 0]), 1.6, '#2f343a')),           // yan tutamaklar
        // 3. tur (Sabri: "hiçbir yere bağlı olmayan parçalar"): tutamak dikmesi oturaktan 6 cm uzakta havada bitiyordu → önce
        // dik iner, sonra oturak levhasının yan yüzüne bağlanır (bedenin dışından geçer)
        ...[-1, 1].flatMap(i => { const ust = ekle(tutamak(i), [-7, 0, 0]), alt = [ust[0], OTURAK_UST - 4, ust[2]];
          return [M.kapsul(pr, ust, alt, 1.2, METAL), M.kapsul(pr, alt, [alt[0], alt[1], i * 14.5], 1.2, METAL)]; })];
      if (uylukPedi) o.push(M.silindirParca(pr, UYLUK_PEDI, [0, 0, 1], PAD_R, PAD_YARI * 2, '#2f343a'),
        M.kapsul(pr, [UYLUK_PEDI[0], UYLUK_PEDI[1], PAD_YARI], [UYLUK_PEDI[0], UYLUK_PEDI[1], KOL_Z], 1.2, METAL),
        M.kapsul(pr, [UYLUK_PEDI[0], UYLUK_PEDI[1], KOL_Z], [UYLUK_PEDI[0], 0, KOL_Z], 1.6, METAL));
      return o;
    };
    // ped ile kaval yüzeyi arasındaki boşluk: pedin ekseni İSKELETİN GERÇEK kaval doğrusuna olan uzaklık (açıdan değil — yanlış
    // hareketi göremezdi) − ped yarıçapı − kaval yarıçapı (iskelet yaklaşığı; gerçek deri yüzey denetiminde)
    const pedBoslugu = (s, sh, isaret) => { const Q = ped(sh, isaret), a = [s.zA[0], s.zA[1], 0], u = birim(fark([s.aA[0], s.aA[1], 0], a)), v = fark(Q, a);
      return M.mesafe(v, u.map(x => x * nokta(v, u))) - PAD_R - PED_ESIK; };
    const dizAci = (s, y) => 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]);
    const ortak = (sh, isaret, ad) => [
      { ad: 'diz ekseni makinenin ekseninde (≤ 2 cm)', f: ks => { const m = Math.max(...ks.map(s => Math.hypot(s.zA[0] - PIV[0], s.zA[1] - PIV[1])));
          return { gecti: m <= 2, olcum: `en fazla ${m.toFixed(1)} cm` }; } },
      { ad: `ped ${ad} (bileğin ${PED_KAVAL} cm üstü, boşluk −1,5…1,5)`, f: ks => { const m = ks.map(s => pedBoslugu(s, sh(s.t), isaret));
          const a = Math.min(...m), b = Math.max(...m); return { gecti: a >= -1.5 && b <= 1.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
      { ad: 'ped kavalla birlikte döner (kol boyu sabit)', f: ks => { const L0 = M.mesafe(PIV, ped(sh(0), isaret)), m = Math.max(...ks.map(s => Math.abs(M.mesafe(PIV, ped(sh(s.t), isaret)) - L0)));
          return { gecti: m <= 0.01, olcum: `sapma ${m.toFixed(3)}` }; } },
      { ad: 'ayaklar yere değmiyor (≥ 3 cm)', f: ks => { const m = Math.min(...ks.map(s => Math.min(s.uA[1], s.aA[1] - AYAK_Y)));
          return { gecti: m >= 3, olcum: `en alçak ${m.toFixed(1)}` }; } },
    ];
    const ACMA = { alt: -90, ust: -10 }, BUKME = { ust: -12, alt: -94 };
    const shAcma = t => ara(ACMA.alt, ACMA.ust, ease(t)), shBukme = t => ara(BUKME.ust, BUKME.alt, ease(t));
    const kisit = (ek, ozel) => ({ dizYonu: [0, 1, 0], temas: [kalcaOturakta(OTURAK_UST), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }, ...ek], ozel });
    return {
      machine_leg_extension: {
        ad: 'Bacak açma', kamera: [30, 12], seritKameralar: [[0, 0], [30, 12], [100, 10]], merkez: [15, 0, 0],
        // t = 0 altta (diz ~90°), t = 1 üstte (bacak neredeyse düz)
        poz: t => poz(shAcma(t)),
        uclar: () => eller(),
        ekipman: (pr, s) => [...makine(pr, shAcma(s.t), 1, false), ...sirtMinderi(pr, s, n, 60, 30, OTURAK_UST)],
        izlenen: 'aA',
        kisit: kisit([], [
          ...ortak(shAcma, 1, 'kavalın önünde'),
          { ad: 'altta diz ~90° (80–100°)', f: ks => { const a = dizAci(ks[0], 'A'); return { gecti: a >= 80 && a <= 100, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'üstte bacak neredeyse düz (diz ≤ 15°)', f: ks => { const a = dizAci(ks.at(-1), 'A'); return { gecti: a <= 15, olcum: `${a.toFixed(1)}°` }; } },
        ]),
      },
      machine_leg_curl: {
        ad: 'Bacak bükme', kamera: [30, 12], seritKameralar: [[0, 0], [30, 12], [100, 10]], merkez: [15, 0, 0],
        // t = 0 bacak önde neredeyse düz, t = 1 diz ~90° (kaval oturağın altına doğru)
        poz: t => poz(shBukme(t)),
        uclar: () => eller(),
        ekipman: (pr, s) => [...makine(pr, shBukme(s.t), -1, true), ...sirtMinderi(pr, s, n, 60, 30, OTURAK_UST)],
        izlenen: 'aA',
        kisit: kisit([{ ad: 'uyluk pedin altında', f: s => UYLUK_PEDI[1] - PAD_R - (s.P[1] + R.th + 1), aralik: [-1.5, 1.5] }], [
          ...ortak(shBukme, -1, 'topuğun üstünde, kavalın arkasında'),
          { ad: 'başta diz neredeyse düz (≤ 15°)', f: ks => { const a = dizAci(ks[0], 'A'); return { gecti: a <= 15, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'sonda diz ~90° (80–100°)', f: ks => { const a = dizAci(ks.at(-1), 'A'); return { gecti: a >= 80 && a <= 100, olcum: `${a.toFixed(1)}°` }; } },
        ]),
      },
    };
  })(),
  bb_hip_thrust: (() => {
    // NSCA / ACE kalça itme (1B dalga 2 Parti B, 14 Eki): sehpa bedene DİK, kürek kemiklerinin alt ucu sehpanın ön üst
    // kenarında; beden o kenarın etrafında döner (sırt kenara yaslı kalır). Ayaklar yerde, omuz genişliğinde, SABİT. Bar
    // kalça kemiğinin üstünde, eller barı yanlardan tutar. Tepede gövde yere paralel ve kaval dik (diz ~90°); altta kalça
    // yerden kesik. Tepe ayak yeri SAYISAL: tepede kaval dik olacak biçimde bilek x'i uyluk boyundan çözülür.
    const XE = 0, E = [XE, BENCH_UST, 0], TEMAS = 38;                          // sehpa ön üst kenarı · temas noktası kalçadan gövde boyunca
    const UST_FI = 0, ALT_FI = 34;   // gövde yere göre (baş tarafı yukarı) tepede 0°, altta 34° (38'de Mia/Nora'da bar uyluğa 2,3–2,6 cm giriyordu)
    const gv = fi => [-Math.cos(rd(fi)), Math.sin(rd(fi)), 0], yz = fi => [Math.sin(rd(fi)), Math.cos(rd(fi)), 0];
    const kalca = fi => ekle(ekle(E, gv(fi), -TEMAS), yz(fi), M.SIRT);          // sırt yüzeyi kenara değecek biçimde kalça
    const UST_P = kalca(UST_FI), DIZ_Y = AYAK_Y + L.sh;                         // tepede kaval dik → diz yüksekliği
    const AX = UST_P[0] + Math.sqrt(L.th ** 2 - (UST_P[1] - DIZ_Y) ** 2), AZ = KALCA_YAN + 3;
    const KALCA_ON = 13, BAR_R = 1.4, HZ = KALCA_YAN + 17, BAR_YUKARI = 2;   // 14 Eki (Sabri: "bar göbeğe giriyor, 2 cm yukarı"): DÜŞEYDE +2                      // bar ekseni kalça ekseninin önünde · el yanalı
    const fiT = t => ara(ALT_FI, UST_FI, ease(t));                              // t = 0 altta, t = 1 tepede
    // bar leğen kemiğinin önünde: kalça ekleminin 4 cm baş tarafında (kalça kıvrımında, −3'te, altta uyluğa 5,5 cm giriyordu — ölçüldü)
    // ⚠️ +2 gövdeye dik verilince altta (gövde 34° eğik) bar ayaklara doğru da kayıp uyluğa giriyordu — kaldırma DÜŞEYDE
    const bar = fi => ekle(ekle(ekle(kalca(fi), gv(fi), 4), yz(fi), KALCA_ON + BAR_R), [0, BAR_YUKARI, 0]);
    const poz = t => { const fi = fiT(t); return { P: kalca(fi), g: [180, fi], yan: [90, 0], yuz: [0, 90 - fi], ayak: 0, bas: -6,
      uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0] }; };
    const sehpaDik = pr => [...minderKutu(pr, [XE - 30, XE], [BENCH_UST - 6, BENCH_UST], [-62, 62], SEHPA),
      ...[-54, 54].flatMap(z => M.kutu(pr, [XE - 26, XE - 4], [0, BENCH_UST - 6], [z - 3, z + 3], M.SEHPA_TON.cerceve))];
    return {
      ad: 'Kalça itme (hip thrust)', kamera: [30, 28], seritKameralar: [[-30, 28], [30, 28], [70, 24]], merkez: [35, 0, 0],
      poz,
      uclar: t => { const B = bar(fiT(t)); return () => ({
        A: { hedef: [B[0], B[1], -HZ], kutup: [-0.3, 0.6, -1], ...tut(Z, BAR_R, 'ayak') },
        B: { hedef: [B[0], B[1], HZ], kutup: [-0.3, 0.6, 1], ...tut(Z, BAR_R, 'ayak') },
        ayakA: { hedef: [AX, AYAK_Y, -AZ], kutup: [0.3, 1, -0.15] }, ayakB: { hedef: [AX, AYAK_Y, AZ], kutup: [0.3, 1, 0.15] } }); },
      ekipman: (pr, s) => [...sehpaDik(pr), ...M.halter(pr, bar(fiT(s.t)), Z, { buyuk: true })],
      // Bar KALÇAYA YASLANIR (hareketin kendisi): fizik denetiminin uyluk kapsülü (r 12,3 — uyluğun en kalın yeri) kalça
      // kıvrımında gerçek deriden çok dışarıda kalır ve yaslanan barı "uyluğa 4 cm girdi" sayardı. Bacak makinesinin pedleri
      // gibi temas gerçek deriyle yüzey denetiminde ölçülür (14 Eki, +2 düşey sonrası: kıyafete en çok 0,7 cm (Max), en çok 2,1 cm havada (Mia, altta)); cisim listesinde yok.
      izlenen: 'P',
      kisit: { ayaklar: 'yerde', dizYonu: [0, 1, 0], ozel: [
        { ad: 'sırt sehpanın kenarında (boşluk ≤ 1,5)', f: ks => { const m = Math.max(...ks.map(s => { const fi = Math.asin(s.g[1]) * 180 / Math.PI, Bk = ekle(ekle(s.P, gv(fi), TEMAS), yz(fi), -M.SIRT);
            return M.mesafe([Bk[0], Bk[1], 0], E); })); return { gecti: m <= 1.5, olcum: `en fazla ${m.toFixed(2)}` }; } },
        { ad: 'bar kalça kemiğinin üstünde (gövde boyunca kalça ekleminden 0…+8 cm)', f: ks => { const m = ks.map(s => { const B = bar(Math.asin(s.g[1]) * 180 / Math.PI); return nokta(fark(B, s.P), s.g); });
            const a = Math.min(...m), b = Math.max(...m); return { gecti: a >= 0 && b <= 8, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'tepede gövde yere paralel (±8°)', f: ks => { const a = Math.asin(ks.at(-1).g[1]) * 180 / Math.PI; return { gecti: Math.abs(a) <= 8, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'tepede kaval dik (±10°) ve diz ~90°', f: ks => { const s = ks.at(-1), k = Math.atan2(Math.abs(s.zA[0] - s.aA[0]), s.zA[1] - s.aA[1]) * 180 / Math.PI, d = 180 - aciOf(s.kaA, s.zA, s.aA);
            return { gecti: k <= 10 && d >= 75 && d <= 105, olcum: `kaval ${k.toFixed(1)}° · diz ${d.toFixed(1)}°` }; } },
        { ad: 'altta kalça yerden kesik (≥ 5 cm)', f: ks => { const y = ks[0].P[1] - R.kalca; return { gecti: y >= 5, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'baş sehpaya girmiyor', f: ks => { const m = Math.min(...ks.map(s => s.kafa[0] > XE - 30 && s.kafa[0] < XE + M.KAFA_R ? s.kafa[1] - M.KAFA_R - BENCH_UST : 99));
            return { gecti: m >= -0.5, olcum: m === 99 ? 'baş sehpanın üstünde değil' : `en yakın ${m.toFixed(1)}` }; } },
      ] },
    };
  })(),

  /* ── 1B DALGA 3 · PARTİ C (15 Eki, plan docs/2026-10-15-1b-ucuncu-dalga-PLAN.md) ─────────────────────────────────── */

  machine_chest_press: (() => {
    // Göğüs presi makinesi (NSCA / ACE): oturur, sırt minderde, kalça oturakta. Kaldıraçlı makinede tutamak başın üstündeki
    // bir PİVOT etrafında YAY çizer (eğik presin makinesi, gövde dike yakın): göğüs ortasının önünden başlar, öne ve hafif
    // yukarı itilir; sonda kollar neredeyse düz (kilitli değil). Sonun açısı SAYISAL: omuz → tutamak kol boyunun %99'u.
    const g = [180, 82], gd = yon(...g), n = yon(0, 8), P = [0, 44, 0], RL = 100, HZ = OMUZ.yan + 8;
    const S0 = ekle(ekle(P, gd, L.torso - OMUZ.asagi - 14), n, R.gogus + 6);   // tutamak göğüs ortasının önünde (omzun 14 cm altı)
    const PIVOT = ekle(S0, gd, RL);
    const yay = f => ekle(ekle(PIVOT, gd, -RL * Math.cos(f)), n, RL * Math.sin(f));
    const OM = M.iskelet(OTURUR(P, g)).omA;
    const SON = (() => { let a = 0, b = 1.2; for (let i = 0; i < 50; i++) { const m = (a + b) / 2, c = yay(m);
      if (Math.hypot(c[0] - OM[0], c[1] - OM[1], HZ - OM[2]) < ERISIM * 0.99) a = m; else b = m; } return (a + b) / 2; })();
    const yol = t => yay(SON * ease(t));
    const KZ = HZ + 9;                                                       // kaldıraç kolu tutamağın dış ucunda
    return {
      ad: 'Chest Press Machine', kamera: [35, 14], seritKameralar: [[0, 0], [35, 14], [110, 18]], merkez: [8, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], HZ], kutup: [-0.2, -0.7, 1], ...tut(Z, 2.4, 'ileriAsagi') }, B: { hedef: [c[0], c[1], -HZ], kutup: [-0.2, -0.7, -1], ...tut(Z, 2.4, 'ileriAsagi') } }); },   // 17 Eki (Sabri: "eller barı alttan tutuyor"): yatay tutamakta avuç aşağıdan ÖNE (üstten kavrar; metin: "avuçlar öne"); 'ileri' hedefi ön kol yatayken belirsizdi (ölçüldü: |n·hedef| ort. 0,11)
      ekipman(pr, s, t) {
        const c = yol(t), o = [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 72, 32, 30)];
        for (const zz of [1, -1]) {
          o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], KZ * zz], [c[0], c[1], KZ * zz], 2.4, METAL),          // kaldıraç kolu (sabit boy)
            M.kapsul(pr, [c[0], c[1], (HZ - 7) * zz], [c[0], c[1], KZ * zz], 2.4, '#8a929c'),               // tutamak
            ...M.kutu(pr, [PIVOT[0] - 3.5, PIVOT[0] + 3.5], [0, PIVOT[1] + 4], [(KZ + 13) * zz - 3.5, (KZ + 13) * zz + 3.5], KULE.govde),   // pivot dikmesi
            ...M.kutu(pr, [PIVOT[0] - 24, 26], [0, 5], [(KZ + 13) * zz - 4, (KZ + 13) * zz + 4], KULE.govde));                    // şase
          const hb = ekle([PIVOT[0], PIVOT[1], 0], fark([c[0], c[1], 0], [PIVOT[0], PIVOT[1], 0]), 0.3);                      // plaka boynuzu
          o.push(M.kapsul(pr, [hb[0], hb[1], KZ * zz], [hb[0], hb[1], (KZ + 16) * zz], 2, METAL),
            M.silindirParca(pr, [hb[0], hb[1], (KZ + 10) * zz], Z, 20, 3.5, '#2f343a'));
        }
        o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], -(KZ + 13)], [PIVOT[0], PIVOT[1], KZ + 13], 3, METAL),
          M.kapsul(pr, [0, 2.5, -(KZ + 13)], [0, 2.5, KZ + 13], 2.5, METAL));
        return o;
      },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(36), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'kaldıraç boyu sabit', f: ks => { const d = ks.map(s => Math.hypot(s.eA[0] - PIVOT[0], s.eA[1] - PIVOT[1])), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
          { ad: 'başta tutamak göğüs hizasında (omzun 8–20 cm altı)', f: ks => { const s = ks[0], y = nokta(fark(s.omA, s.eA), s.g); return { gecti: y >= 8 && y <= 20, olcum: `${y.toFixed(1)} cm` }; } },
          { ad: 'sonda kollar neredeyse düz (dirsek ≤ 20°)', f: ks => { const s = ks.at(-1), a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'tutamak öne itilir (en az 25 cm)', f: ks => { const d = ks.at(-1).eA[0] - ks[0].eA[0]; return { gecti: d >= 25, olcum: `${d.toFixed(1)} cm` }; } },
        ] },
    };
  })(),

  machine_shoulder_press: (() => {
    // OMUZ PRESİ MAKİNESİ (G3, 17 Eki; NSCA / ACE / makine talimatı): göğüs presi makinesinin dik hâli. Oturur, sırt dike
    // yakın minderde, kalça oturakta, ayaklar yerde. Tutamaklar omuz hizasının biraz üstünde, omuzların biraz önünde ve dışında
    // başlar (avuçlar öne, ön kol dike yakın — tutamak omza yakın olunca dirsek 159° kapanıyordu); kaldıraç kolları sporcunun ARKASINDAKİ mil etrafında yay çizer: tutamak yukarı ve hafif geriye gider,
    // sonda kollar başın üstünde neredeyse düz (kilitli değil). Sonun açısı SAYISAL: omuz → tutamak kol boyunun %99'u.
    const g = [180, 84], gd = yon(...g), n = yon(0, 6), P = [0, 44, 0], RL = 100, HZ = OMUZ.yan + 18;
    const OM = M.iskelet(OTURUR(P, g)).omA;
    const S0 = [OM[0] + 4, OM[1] + 16, 0];                                    // tutamak omzun 16 cm üstünde, 4 cm önünde (ön kol dike yakın)
    const PIVOT = [S0[0] - RL, S0[1], 0];                                       // mil arkada, başlangıç tutamağıyla aynı yükseklikte
    const yay = f => [PIVOT[0] + RL * Math.cos(f), PIVOT[1] + RL * Math.sin(f), 0];
    const SON = (() => { let a = 0, b = 1.2; for (let i = 0; i < 50; i++) { const m = (a + b) / 2, c = yay(m);
      if (Math.hypot(c[0] - OM[0], c[1] - OM[1], HZ - OM[2]) < ERISIM * 0.99) a = m; else b = m; } return (a + b) / 2; })();
    const yol = t => yay(SON * ease(t));
    const KZ = HZ + 9;
    return {
      ad: 'Shoulder Press Machine', kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [110, 16]], merkez: [0, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const c = yol(t); return () => ({
        A: { hedef: [c[0], c[1], HZ], kutup: [0.2, -0.8, 1], ...tut(Z, 2.4, 'ileri') }, B: { hedef: [c[0], c[1], -HZ], kutup: [0.2, -0.8, -1], ...tut(Z, 2.4, 'ileri') } }); },
      ekipman(pr, s, t) {
        const c = yol(t), o = [...oturak(pr, 36), ...sirtMinderi(pr, s, n, 84, 36, 30)];
        for (const zz of [1, -1]) {
          o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], KZ * zz], [c[0], c[1], KZ * zz], 2.4, METAL),          // kaldıraç kolu (sabit boy)
            M.kapsul(pr, [c[0], c[1], (HZ - 7) * zz], [c[0], c[1], KZ * zz], 2.4, '#8a929c'),               // tutamak
            ...M.kutu(pr, [PIVOT[0] - 3.5, PIVOT[0] + 3.5], [0, PIVOT[1] + 4], [(KZ + 6) * zz - 3.5, (KZ + 6) * zz + 3.5].sort((a, b) => a - b), KULE.govde),   // mil dikmesi
            ...M.kutu(pr, [PIVOT[0] - 10, 26], [0, 5], [(KZ + 6) * zz - 4, (KZ + 6) * zz + 4].sort((a, b) => a - b), KULE.govde));                        // şase
          const hb = ekle([PIVOT[0], PIVOT[1], 0], fark([c[0], c[1], 0], [PIVOT[0], PIVOT[1], 0]), 0.3);                                        // plaka boynuzu
          o.push(M.kapsul(pr, [hb[0], hb[1], KZ * zz], [hb[0], hb[1], (KZ + 16) * zz], 2, METAL),
            M.silindirParca(pr, [hb[0], hb[1], (KZ + 10) * zz], Z, 20, 3.5, '#2f343a'));
        }
        o.push(M.kapsul(pr, [PIVOT[0], PIVOT[1], -(KZ + 6)], [PIVOT[0], PIVOT[1], KZ + 6], 3, METAL),
          M.kapsul(pr, [0, 2.5, -(KZ + 6)], [0, 2.5, KZ + 6], 2.5, METAL));
        return o;
      },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(36), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'kaldıraç boyu sabit', f: ks => { const d = ks.map(s => Math.hypot(s.eA[0] - PIVOT[0], s.eA[1] - PIVOT[1])), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
          { ad: 'başta tutamak omuz hizasının biraz üstünde (omuz ekleminin 8–20 cm üstü; ön kol dike yakın)', f: ks => { const s = ks[0], y = s.eA[1] - s.omA[1]; return { gecti: y >= 8 && y <= 20, olcum: `${y.toFixed(1)} cm` }; } },
          { ad: 'sonda kollar başın üstünde neredeyse düz (dirsek ≤ 20°)', f: ks => { const s = ks.at(-1), a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 20 && s.eA[1] > s.kafa[1] + 20, olcum: `${a.toFixed(1)}° · başın ${(s.eA[1] - s.kafa[1]).toFixed(0)} cm üstü` }; } },
          { ad: 'sonda tutamak omuzların üstünde (yatayda ±8 cm)', f: ks => { const s = ks.at(-1), x = s.eA[0] - s.omA[0]; return { gecti: Math.abs(x) <= 8, olcum: `${x.toFixed(1)} cm` }; } },
        ] },
    };
  })(),

  machine_pec_deck: (() => {
    // Kelebek (pec deck, NSCA / ACE): ters kelebek makinesinin aynısı, beden TERS — sırt minderde, kollar omzun DÜŞEY ekseni
    // etrafında yandan öne döner (makine kuralı: "omzu dönme ekseniyle hizala"). Dirsek hafif bükük ve SABİT, tutamaklar
    // omzun biraz altında. Açıkken eller omuz hattında (gerisine geçmez — omuz önü zorlanır); kapanınca göğsün önünde
    // birbirine yaklaşır ama değmez.
    const P = [0, OTURAK + R.kalca, 0], g = [180, 84], n = yon(0, 6), FR = ERISIM * 0.978, UST = M.FLY_UST + 8;
    const aci = t => ara(88, -10, ease(t));                                  // t = 0 açık (yanda), t = 1 kapalı (önde)
    const eksen = (s, i) => { const om = i > 0 ? s.omA : s.omB; return [om[0], UST, om[2]]; };
    const KOLON = [-30, -22];
    return {
      ad: 'Pec Deck', kamera: [40, 30], seritKameralar: [[0, 0], [40, 30], [100, 20]], merkez: [8, 0, 0],
      a: OTURUR(P, g),
      uclar: t => { const f = rd(aci(t)); return s => ({
        A: { hedef: [s.omA[0] + FR * Math.cos(f), s.omA[1] - 6, s.omA[2] + FR * Math.sin(f)], kutup: [-0.4, -0.3, 0.8], ...tut([0, 1, 0], 2.6, 'ic') },
        B: { hedef: [s.omB[0] + FR * Math.cos(f), s.omB[1] - 6, s.omB[2] - FR * Math.sin(f)], kutup: [-0.4, -0.3, -0.8], ...tut([0, 1, 0], 2.6, 'ic') } }); },
      eksenler: s => [eksen(s, 1), eksen(s, -1)],
      ekipman(pr, s) {
        // 15 Eki (Sabri: "kelebekte makinenin ağırlıkları yok — sporcunun hemen arkasında, ters kelebekteki gibi ağırlık sistemi
        // olmalı ve ağırlıklar hareket etmeli"): seçmeli ağırlık kulesi kolonun hemen ARKASINDA, kolon tepesinden kuleye kiriş.
        // Halatsız makine: yığın, tutamağın açık konumdan aldığı yolun yarısı kadar kalkar (ters kelebekle aynı kural).
        this.__e0 ??= M.an(this, 0).eA;
        const o = [...kabloKulesi(pr, KOLON[0] - 2, null, -1, 0.5 * M.mesafe(s.eA, this.__e0)),
          ...M.kutu(pr, [KOLON[0] - 2, KOLON[1]], [UST - 2, UST + 3], [-3, 3], KULE.govde),
          ...oturak(pr, OTURAK - 0.6, [-18, 16]), ...sirtMinderi(pr, s, n, 72, 32, OTURAK),   // oturak 0,6 alçak: kalın uyluk mindere 2,3 cm giriyordu (Nora)
          ...M.kutu(pr, KOLON, [0, UST + 4], [-4, 4], M.SEHPA_TON.cerceve), ...M.kutu(pr, [KOLON[0], 16], [0, 4], [-6, 6], M.SEHPA_TON.cerceve)];
        for (const [i, el] of [[1, s.eA], [-1, s.eB]]) {
          const e = eksen(s, i), ust = [el[0], UST, el[2]];
          o.push(M.kapsul(pr, [KOLON[0] + 4, UST, 0], e, 2.4, METAL),                                          // kolondan eksene kiriş
            M.kapsul(pr, e, ust, 2.2, METAL), M.kapsul(pr, ust, [el[0], el[1] + 7, el[2]], 1.8, METAL),         // kaldıraç + iniş
            M.kapsul(pr, [el[0], el[1] - 7, el[2]], [el[0], el[1] + 7, el[2]], 2.6, '#8a929c'));                // tutamak (dikey, nötr)
        }
        return o;
      },
      izlenen: 'eA',
      kisit: { kaldirac: true, dirsek: { aralik: [10, 35], sabit: true }, ayaklar: 'yerde', dizYonu: [1, 0.3, 0],
        temas: [kalcaOturakta(OTURAK - 0.6), { ad: 'sırt minderde', f: sirtTemas(n), aralik: [-1.5, 1.5] }],
        ozel: [
          { ad: 'açıkken eller omuz hattının gerisine geçmiyor (≥ −3 cm)', f: ks => { const m = Math.min(...ks.flatMap(s => [s.eA[0] - s.omA[0], s.eB[0] - s.omB[0]]));
              return { gecti: m >= -3, olcum: `omuza göre en geride ${m.toFixed(1)} cm` }; } },
          { ad: 'kapanınca eller göğsün önünde yakın (el arası ≤ 25 cm)', f: ks => { const d = M.mesafe(ks.at(-1).eA, ks.at(-1).eB); return { gecti: d <= 25, olcum: `${d.toFixed(1)} cm` }; } },
          { ad: 'tutamaklar omzun altında (dirsek omuzu geçmez)', f: ks => { const m = Math.max(...ks.map(s => s.eA[1] - s.omA[1])); return { gecti: m <= 0, olcum: `omuza göre en çok ${m.toFixed(1)}` }; } },
        ] },
    };
  })(),

  machine_ab_crunch: (() => {
    // MEKİK MAKİNESİ (oturmalı; G2, 17 Eki; makine talimatı + ACE): oturakta, ayaklar yerde ve ayak bilekleri öndeki rulonun
    // ALTINDA. Sırt minderi ve tutamaklar AYNI kola bağlı; kol kalçanın iki yanındaki mil etrafında döner. ⚠️ Gerçek makinede mil
    // gövdenin büküldüğü yere (belin hizasına) gelir; burada kalçada çünkü iskelette bel ayrı bükülmez (bağımsız denetim, 17 Eki). Tutamaklar başın iki yanında; eller başa göre SABİT kalır (kolla çekilmez), gövde öne
    // kıvrılır, kalça oturaktan kalkmaz. Seçmeli ağırlık kulesi oturağın arkasında; yığın kolun aldığı yolla kalkar.
    // ⚠️ İskelette bel ayrı bükülmez (gövde tek parça): kıvrılma kalçadan döner.
    const P = [0, OTURAK + R.kalca, 0], FI = t => ara(84, 120, ease(t)), W = 27, RR = 4.5;
    const bp = (s, a, b, c) => ekle(ekle(ekle(s.P, s.g, a), s.yuz, b), s.yan, c);             // gövdeye bağlı nokta (kol gövdeyle döner)
    const UST = L.torso + 28, EL = L.torso + 20;
    const el = (s, i) => bp(s, EL, 8, i * 16);                                                    // tutamak: alnın iki yanı (kablo mekikle aynı yer)
    const kutup = (s, i) => ekle(ekle(s.yuz, s.g, -0.9), s.yan, i * 0.5);
    const s0 = M.iskelet(OTURUR(P, [180, 84])), AR = ekle(s0.aA, [R.sh + RR + 0.5, 13, -s0.aA[2]]);   // ayak rulosu kavalın önünde
    return {
      ad: 'Ab Crunch Machine', kamera: [40, 16], seritKameralar: [[0, 0], [40, 16], [110, 20]], merkez: [-5, 0, 0],
      poz: t => ({ ...OTURUR(P, [180, FI(t)]), gKalca: [180, ara(84, 92, ease(t))] }),   // 17 Eki: leğen oturakta (bel kıvrılır)
      uclar: () => s => ({ A: { hedef: el(s, 1), kutup: kutup(s, 1), ...tut(s.g, 1.6, 'ic') }, B: { hedef: el(s, -1), kutup: kutup(s, -1), ...tut(s.g, 1.6, 'ic') } }),
      ekipman(pr, s) {
        this.__e0 ??= M.an(this, 0).eA;
        const o = [...oturak(pr, OTURAK - 0.6, [-18, 16]), ...sirtMinderi(pr, s, s.yuz, 62, 32),   // oturak 0,6 alçak (kelebekteki gibi: Nora'nın uyluğu 2,3 cm giriyordu)
          ...kabloKulesi(pr, -50, null, -1, 0.4 * M.mesafe(s.eA, this.__e0)),
          M.kapsul(pr, [-50, 2.5, 0], [AR[0] + 18, 2.5, 0], 2.6, METAL), M.kapsul(pr, [AR[0] + 18, 2.5, -21], [AR[0] + 18, 2.5, 21], 2.6, METAL),   // traverse parmakların önünde (rulonun altında ayağa 1,7 cm giriyordu)
          M.kapsul(pr, [AR[0], AR[1], -RR * 4], [AR[0], AR[1], RR * 4], RR, '#2f353d'), M.kapsul(pr, [AR[0], AR[1], -21], [AR[0], AR[1], 21], 1.2, METAL)];
        for (const i of [1, -1]) {
          const pv = ekle(P, s.yan, i * W), alt = bp(s, 0, -18, i * W), tepe = bp(s, UST, -18, i * W), on = bp(s, UST, 8, i * 16);
          o.push(M.kapsul(pr, ekle(P, s.yan, i * (W - 3)), ekle(P, s.yan, i * (W + 6)), 3, METAL),            // mil göbeği (yalnız yanda — bedenden geçmez)
            ...M.kutu(pr, [P[0] - 3.5, P[0] + 3.5], [0, P[1]], [i * (W + 6) - 3.5, i * (W + 6) + 3.5].sort((a, b) => a - b), KULE.govde),   // mil dikmesi
            M.kapsul(pr, pv, alt, 2.4, METAL), M.kapsul(pr, alt, tepe, 2.4, METAL), M.kapsul(pr, tepe, on, 2.2, METAL),   // dönen kol
            M.kapsul(pr, bp(s, EL - 7, 8, i * 16), on, 1.8, '#8a929c'),                                                   // tutamak
            M.kapsul(pr, [AR[0], AR[1], i * 21], [AR[0] + 18, 2.5, i * 21], 2.2, METAL));                                  // rulo dikmesi (öne eğik)
        }
        o.push(M.kapsul(pr, bp(s, UST, -18, -W), bp(s, UST, -18, W), 2.2, METAL));                                       // kolun üst kirişi
        // 3. tur (Sabri: "havada bağlantısız minderler"): sırt minderi kola hiç bağlı değildi → arkasında iki kiriş + minder bağlantısı
        for (const h of [12, 52]) o.push(M.kapsul(pr, bp(s, h, -18, -W), bp(s, h, -18, W), 2.2, METAL), M.kapsul(pr, bp(s, h, -(M.SIRT + 5), 0), bp(s, h, -18, 0), 2.2, METAL));
        return o;
      },
      izlenen: 'boyun',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0.3, 0], temas: [kalcaOturakta(OTURAK - 0.6)], ozel: [
        { ad: 'gövde öne kıvrılır (30–45°)', f: ks => { const a = Math.asin(ks.at(-1).g[0]) * 180 / Math.PI - Math.asin(ks[0].g[0]) * 180 / Math.PI; return { gecti: a >= 30 && a <= 45, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'eller başın yanında sabit (başa uzaklık değişimi ≤ 1 cm)', f: ks => { const d = ks.map(s => mesafe(s.eA, s.kafa)), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 1, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'kaldıraç boyu sabit (tutamak mile sabit uzaklıkta)', f: ks => { const d = ks.map(s => Math.hypot(s.eA[0] - P[0], s.eA[1] - P[1])), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'ayak bilekleri rulonun altında (kaval önüne 0–2 cm)', f: ks => { const m = ks.flatMap(s => ['A', 'B'].map(y => { const a = s[`z${y}`], b = s[`a${y}`], ab = fark(b, a), c = [AR[0], AR[1], a[2]];
            const u = Math.max(0, Math.min(1, nokta(fark(c, a), ab) / nokta(ab, ab))); return mesafe(c, ekle(a, ab, u)) - R.sh - RR; })), x = Math.min(...m), y = Math.max(...m);
          return { gecti: x >= 0 && y <= 2, olcum: `${x.toFixed(1)} … ${y.toFixed(1)}` }; } },
      ] },
    };
  })(),

  bb_curl: (() => {
    // Bar ile biceps curl (NSCA / ACE): ayakta, avuçlar öne (supinasyon), tutuş omuz genişliğinde; dirsekler gövdenin yanında
    // SABİT, yalnız ön kol döner. Altta bar uylukların ÖNÜNDE (kollar neredeyse düz), üstte omuzların önünde. Kablo curl'ün
    // dirsek modeli; kısa sabit bar (K6) — olimpik bar uylukların önünde fazla geniş.
    const E = (s, i) => { const o = dirsekAlti(4, 3.5); return ekle(i > 0 ? s.omA : s.omB, [o[0], o[1], o[2] * i]); };
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), L.fa, rd(ara(26, 135, ease(t))), 0, i);
    const BAR_YARI = 58, BAR_R = 1.4, PL = 47.5, PL_R = 13;
    const bar = s => [s.eA[0], s.eA[1], 0];
    return {
      ad: 'Barbell Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [10, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: ekle(fark(E(s, 1), s.omA), [-4, 0, 0]), ...tut(Z, BAR_R, 'onKolOn') },
        B: { hedef: el(s, t, -1), kutup: ekle(fark(E(s, -1), s.omB), [-4, 0, 0]), ...tut(Z, BAR_R, 'onKolOn') }, ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman(pr, s) {
        const m = bar(s), Q = k => [m[0], m[1], k], o = [M.kapsul(pr, Q(-BAR_YARI), Q(BAR_YARI), BAR_R, '#9aa2ac')];
        for (const i of [-1, 1]) o.push(M.silindirParca(pr, Q(i * 44), Z, 3.2, 1.6, '#8a929c', { metal: true }),
          M.silindirParca(pr, Q(i * PL), Z, PL_R, 3.6, '#2f343a'), M.silindirParca(pr, Q(i * 50.6), Z, 3.4, 2, '#8a929c', { metal: true }));
        return o;
      },
      cisimler: s => { const m = bar(s); return [[[m[0], m[1], -BAR_YARI], [m[0], m[1], BAR_YARI], BAR_R],
        ...[-1, 1].map(i => [[m[0], m[1], i * (PL - 1.8)], [m[0], m[1], i * (PL + 1.8)], PL_R])]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'altta kollar neredeyse düz (dirsek ≤ 30°)', f: ks => { const a = 180 - aciOf(ks[0].omA, ks[0].dA, ks[0].eA); return { gecti: a <= 30, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'üstte bar omuz önünde (dirsek ≥ 120°)', f: ks => { const a = 180 - aciOf(ks.at(-1).omA, ks.at(-1).dA, ks.at(-1).eA); return { gecti: a >= 120, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'tutuş omuz genişliğinde (el arası / omuz arası 1,0–1,3)', f: ks => { const s = ks[0], r = M.mesafe(s.eA, s.eB) / M.mesafe(s.omA, s.omB); return { gecti: r >= 1 && r <= 1.3, olcum: r.toFixed(2) }; } },
        ] },
    };
  })(),

  cable_rope_pushdown: (() => {
    // İple triceps itme (NSCA / ACE / ExRx): V bar itmenin kulesi ve dirsek modeli; tutamak iki uçlu İP, avuçlar karşılıklı.
    // Tepede eller göğsün önünde bitişik; inerken ip AÇILIR ("spread the rope"), altta eller uylukların yanına ayrılır.
    // İpin iki kolu SABİT boyda: düğüm ellerin arası açıldıkça ellere yaklaşır (eskiden çizimde ip esneseydi göze batardı).
    const DZ = OMUZ.yan + 3.5, MAKARA = [40, KULE_MAKARA_UST, 0], IP = 38, IP_UC = 7.5, IP_R = 1.3;   // ip ucu topuzu yumruğun altında (5'te ele 2 cm giriyordu)
    const E = s => { const o = dirsekAlti(5, DZ - OMUZ.yan); return [s.omA[0] + o[0], s.omA[1] + o[1], DZ]; };
    const ez = t => ara(6, DZ + 1.5, ease(t));                                // el yanalı: tepede bitişik, altta dirseğin dışında
    const aci = t => rd(ara(100, 24, ease(t)));                            // altta kol neredeyse düz, kilitli değil
    const el = (s, t, i) => { const e = E(s), bet = Math.asin((DZ - ez(t)) / L.fa); return dirsekEtrafinda([e[0], e[1], i * DZ], L.fa, aci(t), bet, -i); };
    // düğüm: iki elin ortasından makaraya doğru, iki kolun boyu IP olacak yerde
    const dugum = (a, b) => { const m = a.map((v, i) => (v + b[i]) / 2), y = birim(fark(MAKARA, m)), yari = mesafe(a, b) / 2;
      return ekle(m, y, Math.sqrt(Math.max(0, IP * IP - yari * yari))); };
    const U = (s, e, i) => basparmak(birim(fark(e, [E(s)[0], E(s)[1], i * DZ])));   // ön kol dirsekten (yerinde)
    const kollar = (eA, eB, s) => { const k = dugum(eA, eB); return [eA, eB].map((e, j) => ipUcu(k, e, U(s, e, j ? -1 : 1), IP_UC)); };
    return {
      ad: 'Rope Push Down', kamera: [38, 12], seritKameralar: [[0, 0], [38, 12], [100, 8]], merkez: [10, 0, 0],
      a: AYAKTA([0, AYAKTA_Y - 1, 0], [0, 82]),
      uclar: t => s => { const a = el(s, t, 1), b = el(s, t, -1), k = dugum(a, b);
        return { A: { hedef: a, kutup: fark(E(s), s.omA), ...tut(U(s, a, 1), IP_R, 'ic') },
          B: { hedef: b, kutup: fark([E(s)[0], E(s)[1], -DZ], s.omB), ...tut(U(s, b, -1), IP_R, 'ic') }, ...ayakBilekleri(2, KALCA_YAN + 2) }; },
      ekipman(pr, s) {
        const k = dugum(s.eA, s.eB);
        return [...kabloKulesi(pr, MAKARA[0] + 14, MAKARA, 1, yiginKalkisi(this, MAKARA, q => dugum(q.eA, q.eB), s)),
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, k),
          ...kollar(s.eA, s.eB, s).flatMap(u => [M.kapsul(pr, ...u.cekis, IP_R, '#3d434b'), M.kapsul(pr, ...u.yumruk, IP_R, '#3d434b'), M.kure(pr, u.topuz, 2.2, '#2f343a')])];
      },
      cisimler: s => { const k = dugum(s.eA, s.eB); return [[MAKARA, k, 0.7], ...kollar(s.eA, s.eB, s).flatMap(u => [[...u.cekis, IP_R], [...u.yumruk, IP_R]])]; },
      izlenen: 'eA',
      kisit: { dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [80, 84], oynama: 1 },
        ozel: [
          { ad: 'tepede eller bitişik (el arası ≤ 15 cm)', f: ks => { const d = M.mesafe(ks[0].eA, ks[0].eB); return { gecti: d <= 15, olcum: `${d.toFixed(1)} cm` }; } },
          { ad: 'altta ip açılır (eller dirseklerin dışında)', f: ks => { const s = ks.at(-1), m = Math.min(Math.abs(s.eA[2]) - Math.abs(s.dA[2]), Math.abs(s.eB[2]) - Math.abs(s.dB[2]));
              return { gecti: m >= 0, olcum: `dirseğe göre ${m.toFixed(1)} cm dışta` }; } },
          { ad: 'altta kollar neredeyse düz, kilitli değil (dirsek 5–20°)', f: ks => { const a = 180 - aciOf(ks.at(-1).omA, ks.at(-1).dA, ks.at(-1).eA); return { gecti: a >= 5 && a <= 20, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'ipin iki kolu sabit boyda', f: ks => { const d = ks.flatMap(s => { const k = dugum(s.eA, s.eB); return [mesafe(k, s.eA), mesafe(k, s.eB)]; }), a = Math.min(...d), b = Math.max(...d);
              return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        ] },
    };
  })(),

  cable_kneeling_crunch: mindereKoy((() => {   // 2. tur: diz çökülen yerde mat (Sabri)
    // KABLO MEKİK (diz çökerek; G2, 17 Eki; ACE / ExRx "cable crunch"): yüksek makaraya dönük, dizler yerde, ayak parmak uçları
    // yerde. İpin iki ucu başın iki yanında, avuçlar karşılıklı; eller başa göre SABİT kalır (kolla çekilmez). Kalça yerinde
    // kalır (geri oturmaz, beden ağırlığıyla çekilmez), gövde öne ve aşağı kıvrılır, dirsekler uyluklara doğru iner.
    // ⚠️ İskelette bel ayrı bükülmez (gövde tek parça): kıvrılma kalçadan döner. Kalça dizin biraz gerisinde.
    const KN_Y = 5.5, GERI = 8, P = [-GERI, KN_Y + Math.sqrt(L.th ** 2 - GERI ** 2), 0], AZ = KALCA_YAN + 1;
    // kaval eğimi: parmak kökü yerde kalacak bilek yüksekliği (ayak kavala dik) → yineleme
    const KB = (() => { let x = 10; for (let i = 0; i < 40; i++) { const ay = TOP_Y + Math.cos(rd(x)) * AYAK_BOY_ - Math.sin(rd(x)) * (AYAK_Y - TOP_Y); x = kemer(ay - KN_Y, L.sh); } return x; })();
    const bilek = i => [-L.sh * Math.cos(rd(KB)), KN_Y + L.sh * Math.sin(rd(KB)), i * AZ];   // A = +z
    const kutupDiz = i => [1, -0.3, i * 0.1];
    const FI = t => ara(70, 22, ease(t));
    const MAKARA = [70, KULE_MAKARA_UST, 0], IP = 40, IP_UC = 9.5, IP_R = 1.3;   // ip ucu topuzu yumruğun altında (5'te 1,5 · 7,5'te 1,1 cm ele giriyordu)
    const el = (s, i) => ekle(ekle(ekle(s.boyun, s.gBas, 20), s.yuzBas, 8), s.yan, i * 16);   // alnın iki yanı (taramayla: ip başa ≥ 4 cm, ön kol başa girmez)
    const dugum = (a, b) => { const m = a.map((v, i) => (v + b[i]) / 2), y = birim(fark(MAKARA, m)), yari = mesafe(a, b) / 2;
      return ekle(m, y, Math.sqrt(Math.max(0, IP * IP - yari * yari))); };
    const U = s => basparmak(birim(ekle(s.gBas, s.yuzBas, -0.6)));                  // ön kol başın yanında, yukarı ve biraz geride (motorla ölçüldü, ≤ 8°)
    const kollar = (eA, eB, s) => { const k = dugum(eA, eB); return [eA, eB].map((e, j) => ipUcu(k, e, U(s, e, j ? -1 : 1), IP_UC)); };
    const kutup = (s, i) => ekle(ekle(s.yuz, s.g, -0.9), s.yan, i * 0.5);
    return {
      ad: 'Kneeling Cable Crunch', kamera: [40, 12], seritKameralar: [[0, 0], [40, 12], [100, 8]], merkez: [15, 0, 0],
      poz: t => ({ P, g: [0, FI(t)], yan: [-90, 0], ayak: [0, -90 - KB], bas: 0, uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] }),
      uclar: () => s => { const a = el(s, 1), b = el(s, -1), k = dugum(a, b);
        return { A: { hedef: a, kutup: kutup(s, 1), ...tut(U(s, a, 1), IP_R, 'ic') }, B: { hedef: b, kutup: kutup(s, -1), ...tut(U(s, b, -1), IP_R, 'ic') },
          ayakA: { hedef: bilek(1), kutup: kutupDiz(1) }, ayakB: { hedef: bilek(-1), kutup: kutupDiz(-1) } }; },
      ekipman(pr, s) {
        const k = dugum(s.eA, s.eB);
        return [...kabloKulesi(pr, MAKARA[0] + 14, MAKARA, 1, yiginKalkisi(this, MAKARA, q => dugum(q.eA, q.eB), s)),
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, k),
          ...kollar(s.eA, s.eB, s).flatMap(u => [M.kapsul(pr, ...u.cekis, IP_R, '#3d434b'), M.kapsul(pr, ...u.yumruk, IP_R, '#3d434b'), M.kure(pr, u.topuz, 2.2, '#2f343a')])];
      },
      cisimler: s => { const k = dugum(s.eA, s.eB); return [[MAKARA, k, 0.7], ...kollar(s.eA, s.eB, s).flatMap(u => [[...u.cekis, IP_R], [...u.yumruk, IP_R]])]; },
      izlenen: 'boyun',
      kisit: { ayaklar: 'parmakUcu', dizYonu: [0.7, -0.7, 0], ozel: [
        { ad: 'dizler yerde (diz eklemi yerden 4–7 cm)', f: ks => { const m = ks.flatMap(s => [s.zA[1], s.zB[1]]), a = Math.min(...m), b = Math.max(...m); return { gecti: a >= 4 && b <= 7, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'kalça yerinde (geri oturmaz, ≤ 1 cm)', f: ks => { const m = Math.max(...ks.map(s => mesafe(s.P, ks[0].P))); return { gecti: m <= 1, olcum: `${m.toFixed(1)} cm` }; } },
        { ad: 'gövde öne kıvrılır (≥ 40°)', f: ks => { const a = Math.asin(ks[0].g[1]) * 180 / Math.PI - Math.asin(ks.at(-1).g[1]) * 180 / Math.PI; return { gecti: a >= 40, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'eller başın yanında sabit (başa uzaklık değişimi ≤ 1 cm)', f: ks => { const d = ks.map(s => mesafe(s.eA, s.kafa)), a = Math.min(...d), b = Math.max(...d); return { gecti: b - a <= 1, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'ipin iki kolu sabit boyda', f: ks => { const d = ks.flatMap(s => { const k = dugum(s.eA, s.eB); return [mesafe(k, s.eA), mesafe(k, s.eB)]; }), a = Math.min(...d), b = Math.max(...d);
            return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
      ] },
    };
  })()),

  cable_overhead_ext: (() => {
    // KABLO BAŞ ÜSTÜ TRICEPS (ip; G3, 17 Eki; ACE / ExRx "cable overhead triceps extension"): kuleye SIRTI dönük, ayaklar
    // önlü arkalı (denge), gövde hafif öne eğik. İp başın arkasından gelir; üst kollar başın iki yanında, öne-yukarı ve SABİT
    // (dirsek yerinde), yalnız ön kol döner: başta eller ensenin arkasında (dirsek ~110°), sonda kollar öne-yukarı neredeyse düz.
    // Ön kol üst kolun ekseniyle aynı düzlemde döner (tek kol baş üstü dambılın dersi: düzlem eksenden kurulur).
    const P = [0, AYAKTA_Y - 3, 0], G = [0, 70], ON = 22, ARKA = -24;
    const MAKARA = [-70, 150, 0], IP = 16, IP_UC = 9.5, IP_R = 1.3;
    const ust = (s, i) => birim(ekle(ekle(s.g, s.yuz, 0.45), s.yan, -i * 0.08));         // üst kol: gövde ekseninden öne ve hafif içe (taramayla: ön kol başa girmez)
    const E = (s, i) => ekle(i > 0 ? s.omA : s.omB, ust(s, i), L.ua);
    const el = (s, t, i) => { const U = ust(s, i), V0 = birim(ekle(s.yuz.map(v => -v), s.yan, -i * 0.12)), V = birim(fark(V0, U.map(v => v * nokta(V0, U))));
      const a = rd(ara(112, 8, ease(t))); return ekle(E(s, i), ekle(U.map(v => v * Math.cos(a)), V, Math.sin(a)), L.fa); };
    const dugum = (a, b) => { const m = a.map((v, i) => (v + b[i]) / 2), y = birim(fark(MAKARA, m)), yari = mesafe(a, b) / 2;
      return ekle(m, y, Math.sqrt(Math.max(0, IP * IP - yari * yari))); };
    const U = (s, e, i) => basparmak(birim(fark(e, E(s, i))));                        // ön kol dirsekten (yerinde)
    const kollar = (eA, eB, s) => { const k = dugum(eA, eB); return [eA, eB].map((e, j) => ipUcu(k, e, U(s, e, j ? -1 : 1), IP_UC)); };
    return {
      ad: 'Cable Overhead Triceps Ext.', kamera: [40, 12], seritKameralar: [[0, 0], [40, 12], [110, 10]], merkez: [-15, 0, 0],
      a: AYAKTA(P, G),
      uclar: t => s => { const a = el(s, t, 1), b = el(s, t, -1), k = dugum(a, b);
        return { A: { hedef: a, kutup: fark(E(s, 1), s.omA), ...tut(U(s, a, 1), IP_R, 'ic') }, B: { hedef: b, kutup: fark(E(s, -1), s.omB), ...tut(U(s, b, -1), IP_R, 'ic') },
          ayakA: { hedef: [ON, AYAK_Y, KALCA_YAN + 2], kutup: [1, 0, 0.12] }, ayakB: { hedef: [ARKA, AYAK_Y, -(KALCA_YAN + 2)], kutup: [1, 0, -0.12] } }; },
      ekipman(pr, s) {
        const k = dugum(s.eA, s.eB);
        return [...kabloKulesi(pr, MAKARA[0] - 14, MAKARA, -1, yiginKalkisi(this, MAKARA, q => dugum(q.eA, q.eB), s)),
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, k),
          ...kollar(s.eA, s.eB, s).flatMap(u => [M.kapsul(pr, ...u.cekis, IP_R, '#3d434b'), M.kapsul(pr, ...u.yumruk, IP_R, '#3d434b'), M.kure(pr, u.topuz, 2.2, '#2f343a')])];
      },
      cisimler: s => { const k = dugum(s.eA, s.eB); return [[MAKARA, k, 0.7], ...kollar(s.eA, s.eB, s).flatMap(u => [[...u.cekis, IP_R], [...u.yumruk, IP_R]])]; },
      izlenen: 'eA',
      kisit: { dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [66, 74], oynama: 1 }, ozel: [
        { ad: 'başta ön kol başın arkasında (dirsek 95–125°)', f: ks => { const a = 180 - aciOf(ks[0].omA, ks[0].dA, ks[0].eA); return { gecti: a >= 95 && a <= 125, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'sonda kollar öne-yukarı neredeyse düz (dirsek ≤ 20°, el başın üstünde)', f: ks => { const s = ks.at(-1), a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 20 && s.eA[1] > s.kafa[1] + 10, olcum: `${a.toFixed(1)}° · başın ${(s.eA[1] - s.kafa[1]).toFixed(0)} cm üstü` }; } },
        { ad: 'üst kol başın yanında, öne-yukarı (gövde eksenine 15–35°)', f: ks => { const s = ks[0], u = birim(fark(s.dA, s.omA)), a = Math.acos(Math.max(-1, Math.min(1, nokta(u, s.g)))) * 180 / Math.PI; return { gecti: a >= 15 && a <= 35, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'ipin iki kolu sabit boyda', f: ks => { const d = ks.flatMap(s => { const k = dugum(s.eA, s.eB); return [mesafe(k, s.eA), mesafe(k, s.eB)]; }), a = Math.min(...d), b = Math.max(...d);
            return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
      ] },
    };
  })(),

  cable_pallof_press: (() => {
    // PALLOF PRESS (G3, 17 Eki; ACE / McGill "anti-rotation press"): kablo kulesine YAN durur (kule sağda), makara göğüs
    // hizasında. İki el tek tutamakta, göğsün önünde başlar; tutamak DÜZ öne itilir (kollar neredeyse düz), kısa tutulur ve
    // göğse geri gelir. Kablo yandan çeker, gövde DÖNMEZ (karın dönmeye direnir) — eller hep orta hatta. Öbür yan için
    // sporcu döner (metinde "her iki yan"). Ayaklar omuz genişliğinde, dizler hafif bükük.
    const P = [0, AYAKTA_Y - 2, 0], s0 = M.iskelet(AYAKTA(P), () => ayakBilekleri(2, KALCA_YAN + 4)), OM = s0.omA.map((v, i) => (v + s0.omB[i]) / 2);
    const H0 = [OM[0] + 22, OM[1] - 12, 0], ERI = ERISIM * 0.99, EZ = 5, oA = s0.omA;   // sonda kollar kol boyunun %99'u (kilitli değil)
    const H1 = [oA[0] + Math.sqrt(ERI ** 2 - (oA[2] - EZ) ** 2 - (oA[1] - H0[1]) ** 2), H0[1], 0];
    const H = t => [ara(H0[0], H1[0], ease(t)), H0[1], 0];
    const KZ = 78, MAKARA = [(H0[0] + H1[0]) / 2, H0[1], KZ - 4];
    const TUT_YARI = 8;
    return {
      ad: 'Pallof Press', kamera: [-30, 16], seritKameralar: [[0, 0], [-30, 16], [-100, 20]], merkez: [10, 0, 25],
      a: AYAKTA(P),
      uclar: t => s => { const h = H(t);
        return { A: { hedef: [h[0], h[1], EZ], kutup: [-0.4, -1, 0.5], ...tut(Z, 1.6, 'ayak') }, B: { hedef: [h[0], h[1], -EZ], kutup: [-0.4, -1, -0.5], ...tut(Z, 1.6, 'ayak') },   // yatay tutamak: avuç aşağı (17 Eki: 'ic' yatay eksende olanaksızdı, el 180° dönüyordu)
          ...ayakBilekleri(2, KALCA_YAN + 4) }; },
      ekipman(pr, s, t) {
        const h = H(t);
        return [...kabloKulesi(pr, MAKARA[0] + 2, MAKARA, 1, yiginKalkisi(this, MAKARA, q => H(q.t), s), KZ),
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, [h[0], h[1], TUT_YARI + 1]),
          M.kapsul(pr, [h[0], h[1], -TUT_YARI], [h[0], h[1], TUT_YARI], 1.6, '#8a929c')];
      },
      cisimler: s => { const h = H(s.t); return [[MAKARA, [h[0], h[1], TUT_YARI + 1], 0.7]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 }, ozel: [
        { ad: 'başta tutamak göğsün önünde (omuz ortasının 15–30 cm önü)', f: ks => { const x = H(0)[0] - OM[0]; return { gecti: x >= 15 && x <= 30, olcum: `${x.toFixed(1)} cm` }; } },
        { ad: 'tutamak DÜZ öne gider (yanal ve dikey sapma ≤ 0,5 cm)', f: ks => { const m = Math.max(...ks.map(s => Math.hypot((s.eA[2] + s.eB[2]) / 2, (s.eA[1] + s.eB[1]) / 2 - H0[1]))); return { gecti: m <= 0.5, olcum: `${m.toFixed(2)} cm` }; } },
        { ad: 'sonda kollar öne neredeyse düz (dirsek ≤ 20°)', f: ks => { const s = ks.at(-1), a = 180 - aciOf(s.omA, s.dA, s.eA); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'kablo YANDAN çeker (sonda kabloyla itiş yönü arası ≥ 60°)', f: ks => { const h = H(1), v = birim(fark(MAKARA, h)), a = Math.acos(Math.abs(v[0])) * 180 / Math.PI; return { gecti: a >= 60, olcum: `${a.toFixed(1)}°` }; } },
      ] },
    };
  })(),

  cable_face_pull: (() => {
    // KABLOYLA YÜZ ÇEKİŞİ (face pull; NSCA / ACE / ExRx): kuleye dönük ayakta, makara yüz hizasında, iki uçlu İP, avuçlar
    // karşılıklı. Başta kollar öne uzanık (hafif bükük), eller birbirine yakın. Çekişte ip AÇILIR: dirsekler YÜKSEK ve
    // DIŞARIDA (omuz hizasında) geriye gider, eller yüze doğru gelip başın iki yanına ayrılır — sonda kollar "çift biceps"
    // duruşuna yakın (omuz dışa döner). Gövde dik ve sabit; geriye yaslanıp çekilmez. İpin iki kolu SABİT boyda.
    const P = [0, AYAKTA_Y - 1, 0], IP = 40, IP_UC = 7.5, IP_R = 1.3, AZ = KALCA_YAN + 2;
    const s0 = M.iskelet({ ...AYAKTA(P, [0, 89]), thA: [0, -90], shA: [0, -90], thB: [0, -90], shB: [0, -90] }), OM = s0.omA;
    const MAKARA = [OM[0] + 112, OM[1] + 20, 0], TOWER = MAKARA[0] + 6;   // yüz hizası (17 Eki denetim: +6 köprücük hizasıydı)
    // el yolu (omza göre, A tarafı; B z'de ayna): başta öne uzanık ve içeride (makaraya doğru, omuzdan yukarıda), sonda
    // yüz hizasının biraz üstünde, başın yanında
    const H0z = 8 - OMUZ.yan, H0y = 12, H0 = [Math.sqrt(((L.ua + L.fa) * 0.975) ** 2 - H0y * H0y - H0z * H0z), H0y, H0z], H1 = [17, 24, 15];   // başta eller omuzun biraz üstünde, kol %97,5 uzanık
    const el = (t, i) => { const k = ease(t), h = [ara(H0[0], H1[0], k), ara(H0[1], H1[1], k) + 3 * Math.sin(Math.PI * k), ara(H0[2], H1[2], k)];
      return ekle(i > 0 ? OM : [OM[0], OM[1], -OM[2]], [h[0], h[1], i * h[2]]); };
    const dugum = (a, b) => { const m = a.map((v, i) => (v + b[i]) / 2), y = birim(fark(MAKARA, m)), yari = mesafe(a, b) / 2;
      return ekle(m, y, Math.sqrt(Math.max(0, IP * IP - yari * yari))); };
    const U = () => [0, 1, 0];                                                       // başparmak yukarı (ön kol hep öne–yukarı: 60–90°)
    const kollar = (eA, eB, s) => { const k = dugum(eA, eB); return [eA, eB].map((e, j) => ipUcu(k, e, U(s, e, j ? -1 : 1), IP_UC)); };
    const kutup = i => [-0.35, 0.35, i];                                      // dirsek dışarı ve yukarı
    return {
      ad: 'Face Pull', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [-150, 10]], merkez: [30, 0, 0],
      a: AYAKTA(P, [0, 89]),
      uclar: t => s => { const a = el(t, 1), b = el(t, -1), k = dugum(a, b);
        return { A: { hedef: a, kutup: kutup(1), ...tut(U(s, a, 1), IP_R, 'ic') }, B: { hedef: b, kutup: kutup(-1), ...tut(U(s, b, -1), IP_R, 'ic') },
          ...ayakBilekleri(2, AZ) }; },
      ekipman(pr, s) {
        const k = dugum(s.eA, s.eB);
        return [...kabloKulesi(pr, TOWER, MAKARA, 1, yiginKalkisi(this, MAKARA, q => dugum(q.eA, q.eB), s)),
          ...M.makara(pr, MAKARA), M.kablo(pr, MAKARA, k),
          ...kollar(s.eA, s.eB, s).flatMap(u => [M.kapsul(pr, ...u.cekis, IP_R, '#3d434b'), M.kapsul(pr, ...u.yumruk, IP_R, '#3d434b'), M.kure(pr, u.topuz, 2.2, '#2f343a')])];
      },
      cisimler: s => { const k = dugum(s.eA, s.eB); return [[MAKARA, k, 0.7], ...kollar(s.eA, s.eB, s).flatMap(u => [[...u.cekis, IP_R], [...u.yumruk, IP_R]])]; },
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [86, 92], oynama: 1 },
        ozel: [
          { ad: 'başta kollar öne uzanık (dirsek ≤ 35°), eller birbirine yakın (≤ 22 cm)', f: ks => { const s = ks[0], a = 180 - aciOf(s.omA, s.dA, s.eA), d = mesafe(s.eA, s.eB);
              return { gecti: a <= 35 && d <= 22, olcum: `dirsek ${a.toFixed(1)}° · el arası ${d.toFixed(1)} cm` }; } },
          { ad: 'sonda dirsekler yüksek (omuz hizasının −8…+6 cm) ve dışarıda (omuzdan ≥ 15 cm yanda)', f: ks => { const s = ks.at(-1), y = s.dA[1] - s.omA[1], z = s.dA[2] - s.omA[2];
              return { gecti: y >= -8 && y <= 6 && z >= 15, olcum: `yükseklik ${y.toFixed(1)} · yanda ${z.toFixed(1)} cm` }; } },
          { ad: 'sonda eller yüz hizasında, başın iki yanında', f: ks => { const s = ks.at(-1), y = s.eA[1] - s.boyun[1], z = Math.abs(s.eA[2]);
              return { gecti: y >= 0 && y <= 22 && z >= 12, olcum: `boyundan ${y.toFixed(1)} cm yukarı · ortadan ${z.toFixed(1)} cm` }; } },
          { ad: 'kablo yere yakın paralel (≤ 15°)', f: ks => { const a = Math.max(...ks.map(s => { const k = dugum(s.eA, s.eB); return Math.abs(Math.atan2(MAKARA[1] - k[1], Math.hypot(MAKARA[0] - k[0], MAKARA[2] - k[2]))) * 180 / Math.PI; }));
              return { gecti: a <= 15, olcum: `en fazla ${a.toFixed(1)}°` }; } },
          { ad: 'ipin iki kolu sabit boyda', f: ks => { const d = ks.flatMap(s => { const k = dugum(s.eA, s.eB); return [mesafe(k, s.eA), mesafe(k, s.eB)]; }), a = Math.min(...d), b = Math.max(...d);
              return { gecti: b - a <= 0.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        ] },
    };
  })(),

  bw_crunch: mindereKoy((() => {
    // Mekik / crunch (ACE / NSCA): sırtüstü yerde, dizler ~90°, tabanlar yerde ve SABİT; eller uyluklarda ve kalkarken
    // dizlere doğru KAYAR (K2 — başı elle çekme riski yok). Kürek kemikleri yerden kalkar, bel ve kalça yerde kalır. ⚠️ İskelette
    // bel ayrı bükülmez (gövde tek parça, K3): gövde kalçadan en çok ~30° kalkar — tam mekik (sit-up) değil.
    // Duruş: kalça arkası ve sırt yerde → gövdenin yere açısı sırt ile kalça derinliğinin farkından çözülür.
    const FI0 = Math.asin((M.SIRT - M.KALCA_ARKA) / 24) * 180 / Math.PI, UST_FI = 30, P = [0, M.KALCA_ARKA + 0.8, 0];   // +0,8: kıyafet yere 2 cm giriyordu (yüzey)
    const gv = fi => [-Math.cos(rd(fi)), Math.sin(rd(fi)), 0];
    const BACAK = Math.sqrt(L.th ** 2 + L.sh ** 2);                             // diz 90° → kalça–bilek uzaklığı
    const AZ = KALCA_YAN + 1, AX = Math.sqrt(BACAK ** 2 - (P[1] - AYAK_Y) ** 2 - 1);
    const fiT = t => ara(FI0, UST_FI, ease(t));
    // başta baş yerden ~3,5 cm kalkık, çene hafif içeride (karın gergin başlar); başın arkası yerdeyken kadın gövdelerinde topuz
    // yere 5 cm giriyordu (yüzey denetimi)
    const BAS0 = M.basYaslanmaEgimi(P[1] + L.torso * Math.sin(rd(FI0)), 3.5);
    const poz = t => { const fi = fiT(t); return { P, g: [180, fi], gKalca: [180, FI0], yan: [90, 0], yuz: [0, 90 - fi], ayak: 0, bas: ara(BAS0, -35, Math.min(1, ease(t) * 2)),   // gKalca (17 Eki): leğen yerde kalır, gövde belden kalkar   // baş önce kalkar, çene göğse yaklaşır (araya bir yumruk)
     
      uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0] }; };
    const bilek = i => [AX, AYAK_Y, i * AZ];                                    // A = −z (sırtüstü, baş −x)
    const kutupDiz = i => [0, 1, i * 0.1];
    // AVUÇ UYLUKTA, VERİDEN (15 Eki, Sabri: "mekikte eller yukarı aşağı oynuyor, sıçrayarak ani hareketler yapıyor"): eller
    // tutamaksızdı; motor her karede en yakın deri yüzeyini ARIYOR ve "temas var/yok" kararı kareden kareye değişiyordu
    // (ölçüldü: temas t≈0,83'te açılıp kapanıyor, avuç yeri 2–3 cm sıçrıyor; kol boyu aşılınca omuz da kayıyordu). Artık
    // goblet squat'taki gibi `zemin`: avuç uyluğun üst yüzeyinde (eksenden uyluk yarıçapı), yüzey normali ve parmak yönü (dize
    // doğru) her karede veriden; bilek avucun AVUC cm gerisinde, yüzeyden YUK cm. Bilek omuzdan kol boyunun %96'sında → kol hafif bükük.
    const UY = M.OLCU.uyluk, AVUC = 5.5, YUK = 1.6, BILEK_ERISIM = (L.ua + L.fa - M.KAVRAMA) * 0.96;
    const uyluk = (ka, i) => { const d = M.ik2(ka, bilek(i), L.th, L.sh, kutupDiz(i)).dirsek, v = fark(d, ka); return { v, yon: birim(v), n: birim([-v[1], v[0], 0]) }; };
    // 15 Eki (Sabri: "başlangıçta Max'in elleri şortun içinde"): yüzey deriden hesaplanıyordu; şortun üstünde KUMAŞ kalınlığı
    // var (bolluk Max'te paçada ~2,8 cm) → paçaya kadar +2,8, paçanın altında (uyluğun %62–78'i) deriye iner
    const KUMAS = u => 0.5 + 2.3 * (1 - Math.min(1, Math.max(0, (u - 0.62) / 0.16)));
    const temas = (ka, i, u) => { const { v, yon, n } = uyluk(ka, i), avuc = ekle(ekle(ka, v, u), n, UY + KUMAS(u)); return { avuc, n, parmak: yon, W: ekle(ekle(avuc, n, YUK), yon, -AVUC) }; };
    const kol = (s, i) => { const ka = i < 0 ? s.kaA : s.kaB, om = i < 0 ? s.omA : s.omB, kutup = [0, 0.3, i];
      let a = 0, b = 1.2; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (mesafe(om, temas(ka, i, m).W) < BILEK_ERISIM) a = m; else b = m; }
      const T0 = temas(ka, i, (a + b) / 2), r = M.ik2(om, T0.W, L.ua, L.fa - M.KAVRAMA, kutup), u = birim(fark(T0.W, r.dirsek));
      return { hedef: ekle(T0.W, u, M.KAVRAMA), kutup, zemin: { avuc: T0.avuc, n: T0.n, yuk: YUK, parmak: T0.parmak, duz: true } }; };   // duz: avuç uyluğa YASLANIR (sarmaz)
    const uylukBosluk = (s, y) => { const zm = s.hedef?.[y]?.zemin; if (!zm) return 99; const a = s[`ka${y}`], z = s[`z${y}`], ab = fark(z, a), u = Math.max(0, Math.min(1, nokta(fark(zm.avuc, a), ab) / nokta(ab, ab)));
      return mesafe(zm.avuc, ekle(a, ab, u)) - UY - KUMAS(u); };
    return {
      ad: 'Crunch', kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [10, 0, 0],
      poz,
      uclar: () => s => ({
        A: kol(s, -1), B: kol(s, 1),   // avuç uylukta (zemin verisi)
        ayakA: { hedef: bilek(-1), kutup: kutupDiz(-1) }, ayakB: { hedef: bilek(1), kutup: kutupDiz(1) } }),
      ekipman: () => [],
      izlenen: 'boyun',
      kisit: { ayaklar: 'yerde', dizYonu: [0, 1, 0], ozel: [
        { ad: 'kalça yerde (±1,5)', f: ks => { const m = ks.map(s => s.P[1] - M.KALCA_ARKA), a = Math.min(...m), b = Math.max(...m); return { gecti: a >= -1.5 && b <= 1.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'başta sırt yerde (−1,5…2), baş yerden hafif kalkık (2–6)', f: ks => { const s = ks[0], a = s.gogusAlt[1] - M.SIRT, b = s.kafa[1] - M.KAFA_R; return { gecti: a >= -1.5 && a <= 2 && b >= 2 && b <= 6, olcum: `sırt ${a.toFixed(1)} · baş ${b.toFixed(1)}` }; } },
        { ad: 'tepede kürek kemikleri yerden kalkar (≥ 8 cm)', f: ks => { const s = ks.at(-1), y = ekle(s.P, s.g, 40)[1] - M.SIRT; return { gecti: y >= 8, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'gövde en çok 35° kalkar (tam mekik değil)', f: ks => { const m = Math.max(...ks.map(s => Math.asin(s.g[1]) * 180 / Math.PI)); return { gecti: m <= 35, olcum: `${m.toFixed(1)}°` }; } },
        { ad: 'dizler ~90° (80–100°)', f: ks => { const a = 180 - aciOf(ks[0].kaA, ks[0].zA, ks[0].aA); return { gecti: a >= 80 && a <= 100, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'avuçlar uyluğun üstünde (boşluk −1…1,5)', f: ks => { const m = ks.flatMap(s => ['A', 'B'].map(y => uylukBosluk(s, y))), a = Math.min(...m), b = Math.max(...m); return { gecti: a >= -1 && b <= 1.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'eller kalkarken dizlere doğru kayar (≥ 8 cm)', f: ks => { const d = ks.at(-1).eA[0] - ks[0].eA[0]; return { gecti: d >= 8, olcum: `${d.toFixed(1)} cm` }; } },
      ] },
    };
  })()),

  bw_decline_crunch: (() => {
    // EĞİMLİ SEHPADA MEKİK (decline crunch; G2, 17 Eki; ACE / ExRx "decline crunch"): mekik sehpasında baş aşağıda, minder
    // 20° eğik. Kalça minderin yüksek ucunda, dizler ~90° bükük ve diz rulosunun üstünden geçer, ayak bilekleri öndeki rulonun
    // ALTINA takılı (ayağın üstü ruloya dayanır). Eller yerdeki mekikteki gibi uyluklarda ve kalkarken dizlere doğru KAYAR (başı
    // elle çekme yok). Kürek kemikleri minderden kalkar, kalça minderde kalır; gövde minderden en çok ~40° kalkar (tam mekik değil).
    // ⚠️ İskelette bel ayrı bükülmez (gövde tek parça): kıvrılma kalçadan döner.
    const EGIM = 20, d = [-Math.cos(rd(EGIM)), -Math.sin(rd(EGIM)), 0], n = [-Math.sin(rd(EGIM)), Math.cos(rd(EGIM)), 0];   // d: minder boyunca başa doğru
    const P = [0, 62, 0], YUZEY = ekle(P, n, -M.KALCA_ARKA - 1.4);              // kalçanın altındaki minder yüzeyi (+1,4: kalça dönerken kıyafet minderin içine giriyordu — yüzey, Nora 2,4 cm)
    const yuzeyUstu = p => nokta(fark(p, YUZEY), n);                            // minder yüzeyinden yükseklik (normal boyunca)
    const DELTA = Math.asin((M.SIRT - M.KALCA_ARKA) / 24) * 180 / Math.PI, FI0 = -EGIM + DELTA, KALK = 40;
    const fiT = t => ara(FI0, FI0 + KALK, ease(t));
    const UYL = 12, AZ = KALCA_YAN + 1;
    const bilek = i => [L.th * Math.cos(rd(UYL)) + L.sh * Math.cos(rd(UYL - 90)), P[1] + L.th * Math.sin(rd(UYL)) + L.sh * Math.sin(rd(UYL - 90)), i * AZ];   // A = −z
    const kutupDiz = i => [0.6, 0.8, i * 0.1];
    // başta baş minderden ~5 cm kalkık (karın gergin başlar): baş eğimi minder yüzeyine göre çözülür (3,5'te kadın gövdelerinde
    // topuz mindere 2 cm giriyordu — yüzey)
    const BAS0 = (() => { const sk = b => { const s = M.iskelet({ P, g: [180, FI0], yan: [90, 0], yuz: [0, 90 - FI0], bas: b, ayak: 0, uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0], thA: [0, 0], shA: [0, 0], thB: [0, 0], shB: [0, 0] }); return yuzeyUstu(s.kafa) - M.KAFA_R; };
      let a = -10, b = 60; for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (sk(m) > 5) a = m; else b = m; } return (a + b) / 2; })();
    const poz = t => { const fi = fiT(t); return { P, g: [180, fi], gKalca: [180, FI0], yan: [90, 0], yuz: [0, 90 - fi], ayak: [0, UYL + 5], bas: ara(BAS0, -35, Math.min(1, ease(t) * 2)),   // gKalca (17 Eki): leğen sehpada kalır
      uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0] }; };
    // avuç uylukta (yerdeki mekiğin yöntemi: yüzey, normal ve parmak yönü veriden; bilek kol boyunun %96'sında)
    const UY = M.OLCU.uyluk, AVUC = 5.5, YUK = 1.6, BILEK_ERISIM = (L.ua + L.fa - M.KAVRAMA) * 0.96;
    const uyluk = (ka, i) => { const dz = M.ik2(ka, bilek(i), L.th, L.sh, kutupDiz(i)).dirsek, v = fark(dz, ka); return { v, yon: birim(v), n: birim([-v[1], v[0], 0]) }; };
    const KUMAS = u => 0.5 + 2.3 * (1 - Math.min(1, Math.max(0, (u - 0.62) / 0.16)));
    const temas = (ka, i, u) => { const { v, yon: y, n: nu } = uyluk(ka, i), avuc = ekle(ekle(ka, v, u), nu, UY + KUMAS(u)); return { avuc, n: nu, parmak: y, W: ekle(ekle(avuc, nu, YUK), y, -AVUC) }; };
    const kol = (s, i) => { const ka = i < 0 ? s.kaA : s.kaB, om = i < 0 ? s.omA : s.omB, kutup = [0, 0.3, i];
      let a = 0, b = 1.2; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (mesafe(om, temas(ka, i, m).W) < BILEK_ERISIM) a = m; else b = m; }
      const T0 = temas(ka, i, (a + b) / 2), r = M.ik2(om, T0.W, L.ua, L.fa - M.KAVRAMA, kutup), u = birim(fark(T0.W, r.dirsek));
      return { hedef: ekle(T0.W, u, M.KAVRAMA), kutup, zemin: { avuc: T0.avuc, n: T0.n, yuk: YUK, parmak: T0.parmak, duz: true } }; };   // duz: avuç uyluğa YASLANIR (sarmaz)
    const uylukBosluk = (s, y) => { const zm = s.hedef?.[y]?.zemin; if (!zm) return 99; const a = s[`ka${y}`], z = s[`z${y}`], ab = fark(z, a), u = Math.max(0, Math.min(1, nokta(fark(zm.avuc, a), ab) / nokta(ab, ab)));
      return mesafe(zm.avuc, ekle(a, ab, u)) - UY - KUMAS(u); };
    // RULOLAR: ayak rulosu kaval kemiğinin önü ile ayağın üstü arasındaki köşede (ikisine de teğet), diz rulosu uyluğun altında
    // dize yakın. Yarıçaplar yüzey denetimiyle ayarlandı.
    const RR = 4.5, sDir = birim(fark(bilek(1), [L.th * Math.cos(rd(UYL)), P[1] + L.th * Math.sin(rd(UYL)), AZ])), sUst = sDir.map(v => -v), aOn = [-sUst[1], sUst[0], 0].map(v => -v);
    const AYAK_RULO = (() => { const b = bilek(0); return ekle(ekle([b[0], b[1], 0], aOn, R.sh + RR + 0.5), sUst, 4 + RR); })();
    const uDir = [Math.cos(rd(UYL)), Math.sin(rd(UYL)), 0], DIZ_RULO = ekle(ekle([0, P[1], 0], uDir, L.th * 0.68), [uDir[1], -uDir[0], 0], 9.5 + RR);   // %78'de baldıra 3,1 cm giriyordu (yüzey)
    const RULO_YARI = 17;
    const rulo = (pr, c) => [M.kapsul(pr, [c[0], c[1], -RULO_YARI], [c[0], c[1], RULO_YARI], RR, '#2f353d'), M.kapsul(pr, [c[0], c[1], -RULO_YARI - 3], [c[0], c[1], RULO_YARI + 3], 1.2, METAL)];
    const BOY = 110, ON_PAY = 3,   // minder kalçanın 3 cm ötesinde biter (8'de Nora'nın uyluğu 2,7 cm giriyordu)
    MERKEZ = ekle(ekle(YUZEY, d, BOY / 2 - ON_PAY), n, -3), BAS_UC = ekle(YUZEY, d, BOY - ON_PAY);
    return {
      ad: 'Decline Crunch', kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [-10, 0, 0],
      poz,
      uclar: () => s => ({ A: kol(s, -1), B: kol(s, 1),
        ayakA: { hedef: bilek(-1), kutup: kutupDiz(-1) }, ayakB: { hedef: bilek(1), kutup: kutupDiz(1) } }),
      ekipman: pr => {
        const alt = ekle(MERKEZ, n, -3), arka = ekle(ekle(YUZEY, d, -ON_PAY + 6), n, -6), on = ekle(BAS_UC, n, -6);
        return [...yumusak(M.kutuY(pr, MERKEZ, [Z, d, n], [30, BOY, 6], PED), MERKEZ, [Z, n, d], [30, 6, BOY], PED),
          M.kapsul(pr, ekle(arka, d, 4), ekle(on, d, -6), 2.4, METAL),                                    // minderin altındaki kiriş
          M.kapsul(pr, [arka[0], arka[1], 0], [arka[0], 2.5, 0], 2.6, METAL),                             // yüksek uç dikmesi
          M.kapsul(pr, [on[0] + 6, on[1], 0], [on[0] + 6, 2.5, 0], 2.6, METAL),                           // baş ucu dikmesi
          ...[-14, 14].map(z => M.kapsul(pr, [on[0] + 6, 2.5, z * 1.4], [on[0] + 6, 2.5, -z * 1.4], 2.6, METAL)),
          M.kapsul(pr, [on[0] + 6, 2.5, 0], [AYAK_RULO[0] + 2, 2.5, 0], 2.6, METAL),                       // taban kirişi
          M.kapsul(pr, [AYAK_RULO[0] + 2, 2.5, -20], [AYAK_RULO[0] + 2, 2.5, 20], 2.6, METAL),
          M.kapsul(pr, [AYAK_RULO[0] + 2, 2.5, 0], [AYAK_RULO[0] + 2, AYAK_RULO[1], 0], 2.4, METAL),        // ön dikme
          M.kapsul(pr, [AYAK_RULO[0] + 2, AYAK_RULO[1], 0], [DIZ_RULO[0], DIZ_RULO[1], 0], 2.2, METAL),    // diz rulosu kolu
          M.kapsul(pr, [arka[0], arka[1] - 2, 0], [DIZ_RULO[0], DIZ_RULO[1], 0], 2.2, METAL),
          ...rulo(pr, [AYAK_RULO[0], AYAK_RULO[1], 0]), ...rulo(pr, [DIZ_RULO[0], DIZ_RULO[1], 0])].filter(Boolean);
      },
      izlenen: 'boyun',
      kisit: { ayaklar: 'havada', dizYonu: [0.6, 0.8, 0], ozel: [
        { ad: 'kalça minderde (±1,5)', f: ks => { const m = ks.map(s => yuzeyUstu(s.P) - M.KALCA_ARKA), a = Math.min(...m), b = Math.max(...m); return { gecti: a >= -1.5 && b <= 1.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'başta sırt minderde (−1,5…2), baş minderden hafif kalkık (2–6)', f: ks => { const s = ks[0], a = yuzeyUstu(s.gogusAlt) - M.SIRT, b = yuzeyUstu(s.kafa) - M.KAFA_R; return { gecti: a >= -1.5 && a <= 2 && b >= 2 && b <= 6, olcum: `sırt ${a.toFixed(1)} · baş ${b.toFixed(1)}` }; } },
        { ad: 'tepede kürek kemikleri minderden kalkar (≥ 8 cm)', f: ks => { const s = ks.at(-1), y = yuzeyUstu(ekle(s.P, s.g, 40)) - M.SIRT; return { gecti: y >= 8, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'gövde minderden en çok 45° kalkar (tam mekik değil)', f: ks => { const m = Math.max(...ks.map(s => Math.asin(Math.max(-1, Math.min(1, nokta(s.g, n)))) * 180 / Math.PI)); return { gecti: m <= 45, olcum: `${m.toFixed(1)}°` }; } },
        { ad: 'dizler ~90° (80–100°)', f: ks => { const a = 180 - aciOf(ks[0].kaA, ks[0].zA, ks[0].aA); return { gecti: a >= 80 && a <= 100, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'avuçlar uyluğun üstünde (boşluk −1…1,5)', f: ks => { const m = ks.flatMap(s => ['A', 'B'].map(y => uylukBosluk(s, y))), a = Math.min(...m), b = Math.max(...m); return { gecti: a >= -1 && b <= 1.5, olcum: `${a.toFixed(1)} … ${b.toFixed(1)}` }; } },
        { ad: 'eller kalkarken dizlere doğru kayar (≥ 8 cm)', f: ks => { const u = birim(fark(ks[0].zA, ks[0].kaA)), dd = nokta(fark(ks.at(-1).eA, ks[0].eA), u); return { gecti: dd >= 8, olcum: `${dd.toFixed(1)} cm` }; } },
        { ad: 'ayak bilekleri rulonun altında sabit (kaval önüne 0–2 cm)', f: ks => { const m = ks.flatMap(s => ['A', 'B'].map(y => { const a = s[`z${y}`], b = s[`a${y}`], ab = fark(b, a), c = [AYAK_RULO[0], AYAK_RULO[1], a[2]];
            const u = Math.max(0, Math.min(1, nokta(fark(c, a), ab) / nokta(ab, ab))); return mesafe(c, ekle(a, ab, u)) - R.sh - RR; })), x = Math.min(...m), y = Math.max(...m);
          return { gecti: x >= 0 && y <= 2, olcum: `${x.toFixed(1)} … ${y.toFixed(1)}` }; } },
      ] },
    };
  })(),

  bw_dead_bug: mindereKoy((() => {
    // DEAD BUG (G3, 17 Eki; ACE / McGill): sırtüstü minderde, bel minderde SABİT (gövde kıpırdamaz). Başta kollar omuzların
    // üstünde dik, kalça ve dizler 90° (masa duruşu). Karşı kol ve bacak BİRLİKTE uzanır: kol baş tarafına, yere yakın; bacak
    // diz açılarak öne, topuk yere yakın — ikisi de yere değmez; dönüp öbür tarafa geçilir. Döngü: ilk yarı sağ kol + sol
    // bacak, ikinci yarı sol kol + sağ bacak; her yarı 0 → 1 → 0. A = −z (sırtüstü, baş −x).
    // ⚠️ Sırtüstünde A anatomik SOL taraftır (govde.js `tarafi`: yüz yukarı, baş −x → sağ +z) — bağımsız denetim yakaladı
    // (17 Eki): ilk sürüm önce SOL kol + SAĞ bacağı gösteriyordu, metin tersini söylüyordu; kural A/B'ye baktığı için görmedi.
    const FI0 = Math.asin((M.SIRT - M.KALCA_ARKA) / 24) * 180 / Math.PI, P = [0, M.KALCA_ARKA + MINDER.kalin, 0];
    const BAS = M.basYaslanmaEgimi(P[1] + L.torso * Math.sin(rd(FI0)), MINDER.kalin + 3.5);   // baş minderden hafif kalkık (yatık başta kadın gövdelerinde topuz zemine 3,9 cm giriyordu — yüzey; mekikle aynı pay)
    const faz = t => { const yari = t < 0.5 ? 0 : 1, u = (t - yari * 0.5) * 2; return { i: yari ? -1 : 1, tau: u < 0.5 ? u * 2 : (1 - u) * 2 }; };
    const KOL = ERISIM * 0.995, KOL_UZ = 95;                              // uzanan kol: dikten baş tarafına (derece)
    const UYL_UZ = 6, DIZ_UZ = 5;                                        // uzanan bacak: uyluk yere göre, diz bükümü
    const kolYon = a => [-Math.sin(rd(a)), Math.cos(rd(a)), 0];               // 0 dik yukarı · 90 baş tarafına yatay
    const bacak = (ka, k) => { const th = ara(90, UYL_UZ, k), dz = ara(90, DIZ_UZ, k), fi = th - dz;
      return { a: [ka[0] + L.th * Math.cos(rd(th)) + L.sh * Math.cos(rd(fi)), ka[1] + L.th * Math.sin(rd(th)) + L.sh * Math.sin(rd(fi)), ka[2]], fi }; };
    const ka0 = M.iskelet({ P, g: [180, FI0], yan: [90, 0], ayak: 0, uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0], thA: [0, 0], shA: [0, 0], thB: [0, 0], shB: [0, 0] });
    // k: uzanma miktarı (0 masa duruşu, 1 uzanmış) — kol ve bacak için, taraf başına
    const uz = (t, kol, yan) => { const { i, tau } = faz(t), k = ease(tau); return (kol ? -i : i) === yan ? k : 0; };   // yan: +1 = A (sırtüstünde SOL); ilk yarı B kolu (sağ) + A bacağı (sol)
    return {
      ad: 'Dead Bug', dongu: true, donguTekrar: 2, seritAnlar: [[0, 'başı'], [0.25, 'sağ kol · sol bacak'], [0.75, 'sol kol · sağ bacak']],
      kamera: [40, 20], seritKameralar: [[0, 0], [40, 20], [100, 30]], merkez: [0, 0, 0],
      poz: t => ({ P, g: [180, FI0], yan: [90, 0], yuz: [0, 90 - FI0], bas: BAS,
        ayakA: [0, bacak(ka0.kaA, uz(t, false, 1)).fi + 75], ayakB: [0, bacak(ka0.kaB, uz(t, false, -1)).fi + 75],
        uaA: [0, 90], faA: [0, 90], uaB: [0, 90], faB: [0, 90] }),
      uclar: t => s => ({
        A: { hedef: ekle(s.omA, kolYon(KOL_UZ * uz(t, true, 1)), KOL), kutup: [0, -0.3, -1] },
        B: { hedef: ekle(s.omB, kolYon(KOL_UZ * uz(t, true, -1)), KOL), kutup: [0, -0.3, 1] },
        ayakA: { hedef: bacak(s.kaA, uz(t, false, 1)).a, kutup: [0.4, 1, -0.1] },
        ayakB: { hedef: bacak(s.kaB, uz(t, false, -1)).a, kutup: [0.4, 1, 0.1] } }),
      ekipman: () => [],
      izlenen: 'eA',
      kisit: { sirayla: true, ayaklar: 'havada', dizYonu: [0.3, 1, 0], ozel: [
        { ad: 'bel ve sırt minderde sabit (sırt −1…2 cm, kalça kıpırdamaz)', f: ks => { const m = ks.map(s => s.gogusAlt[1] - M.SIRT - MINDER.kalin), a = Math.min(...m), b = Math.max(...m), k = Math.max(...ks.map(s => mesafe(s.P, ks[0].P)));
            return { gecti: a >= -1 && b <= 2 && k <= 0.1, olcum: `sırt ${a.toFixed(1)} … ${b.toFixed(1)} · kalça ${k.toFixed(1)}` }; } },
        { ad: 'başta kollar dik, kalça ve diz ~90° (80–100°)', f: ks => { const s = ks[0], k = Math.acos(Math.min(1, birim(fark(s.eA, s.omA))[1])) * 180 / Math.PI, d = 180 - aciOf(s.kaA, s.zA, s.aA), h = 180 - aciOf(s.boyun, s.P, s.zA);
            return { gecti: k <= 8 && d >= 80 && d <= 100 && h >= 80 && h <= 100, olcum: `kol dikeyden ${k.toFixed(1)}° · diz ${d.toFixed(0)}° · kalça ${h.toFixed(0)}°` }; } },
        { ad: 'KARŞI kol ve bacak birlikte uzanır (sağ kol + sol bacak, sonra tersi)', f: ks => { const at = t => ks.reduce((x, s) => Math.abs(s.t - t) < Math.abs(x.t - t) ? s : x);
            const kolAci = (s, y) => Math.acos(Math.min(1, birim(fark(s[`e${y}`], s[`om${y}`]))[1])) * 180 / Math.PI, diz = (s, y) => 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]);
            // ANATOMİK taraf: sırtüstünde B = sağ, A = sol (A/B etiketiyle sınanınca taraf hatası görünmüyordu)
            const a = at(0.25), b = at(0.75), ok = kolAci(a, 'B') > 60 && kolAci(a, 'A') < 10 && diz(a, 'A') < 20 && diz(a, 'B') > 80 && kolAci(b, 'A') > 60 && kolAci(b, 'B') < 10 && diz(b, 'B') < 20 && diz(b, 'A') > 80;
            return { gecti: ok, olcum: `t=0,25: sağ kol ${kolAci(a, 'B').toFixed(0)}° · sol diz ${diz(a, 'A').toFixed(0)}° | t=0,75: sol kol ${kolAci(b, 'A').toFixed(0)}° · sağ diz ${diz(b, 'B').toFixed(0)}°` }; } },
        { ad: 'uzanan el ve topuk yere yakın ama değmez (el 4–16 cm · bilek 8–20 cm)', f: ks => { const e = Math.min(...ks.flatMap(s => [s.eA[1], s.eB[1]])), a = Math.min(...ks.flatMap(s => [s.aA[1], s.aB[1]]));
            return { gecti: e >= 4 && e <= 16 && a >= 8 && a <= 20, olcum: `el ${e.toFixed(1)} · bilek ${a.toFixed(1)} cm` }; } },
      ] },
    };
  })()),

  bw_bird_dog: mindereKoy((() => {
    // BIRD DOG (G3, 17 Eki; McGill / ACE): dört ayak üstünde — avuçlar omuzların altında yerde, dizler kalçanın altında,
    // ayak parmak uçları yerde. Gövde ve kalça SABİT (dönmez, sarkmaz). Karşı kol ve bacak BİRLİKTE uzanır: kol öne, omuz
    // hizasında; bacak geriye, kalça hizasında — ikisi de yere paralele yakın; dönüp öbür tarafa geçilir. Döngü: ilk yarı
    // sağ kol + sol bacak, ikinci yarı sol kol + sağ bacak. A = +z (yüz aşağı, baş +x).
    // Kalça diz üstünde (uyluk dik); kollar uylukdan uzun olduğu için gövde başa doğru hafif yükselir — eğim, avuç omzun
    // altındayken kol neredeyse düz olacak biçimde ÇÖZÜLÜR. Kalkan avuç aşağı bakar, parmaklar öne (kol öne uzanınca da).
    const KN_Y = 5.5, P = [0, KN_Y + L.th, 0], AZ = KALCA_YAN + 1, HZ = OMUZ.yan + 2, AVUC = 5.5, BILEK_Y = 3.4, KAVRAMA = M.KAVRAMA;
    const KB = (() => { let x = 10; for (let i = 0; i < 40; i++) { const ay = TOP_Y + Math.cos(rd(x)) * AYAK_BOY_ - Math.sin(rd(x)) * (AYAK_Y - TOP_Y); x = kemer(ay - KN_Y, L.sh); } return x; })();
    const poz0 = al => ({ P, g: [0, al], yan: [-90, 0], bas: -8, uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90], thA: [0, -90], shA: [180, 0], thB: [0, -90], shB: [180, 0] });
    const ERI = (L.ua + L.fa - KAVRAMA) * 0.99;
    const AL = (() => { let a = -20, b = 40; for (let i = 0; i < 60; i++) { const m = (a + b) / 2, o = M.iskelet(poz0(m)).omA; if (o[1] - BILEK_Y < ERI) a = m; else b = m; } return (a + b) / 2; })();
    const OM0 = M.iskelet(poz0(AL)).omA, BX = OM0[0];
    const faz = t => { const yari = t < 0.5 ? 0 : 1, u = (t - yari * 0.5) * 2; return { i: yari ? -1 : 1, tau: u < 0.5 ? u * 2 : (1 - u) * 2 }; };
    const uz = (t, kol, yan) => { const { i, tau } = faz(t), k = ease(tau); return (kol ? i : -i) === yan ? k : 0; };   // yan: +1 = A (sağ)
    const PARMAK = i => [Math.cos(rd(10)), 0, i * Math.sin(rd(10))];
    // bilek: yerde omzun altında → öne-yukarı yay (omuz etrafında, kol neredeyse düz), sonda omuz hizasının biraz altında öne
    const KOL_UZ = 92;
    // el önce KALKAR sonra öne gider (yerde kaymaz): açı ease(k) ile yavaş başlar, yarıçap ortada 10 cm kısalır (dirsek bükülür)
    // 2. tur (Sabri: "uzanırken dirsek kırık kalıyor, daha düz olmalı"): tepede kol %99,8 uzanık (dirsek ~6°)
    const ERI_UST = (L.ua + L.fa - KAVRAMA) * 0.998;
    const bilek = (s, i, k) => { const om = i > 0 ? s.omA : s.omB, a = rd(KOL_UZ * ease(k)), r = ara(ERI, ERI_UST, ease(k)) - 10 * Math.sin(Math.PI * k);
      if (k <= 0) return [BX, BILEK_Y, i * HZ];
      const z = ara(i * HZ, om[2] + i * 2, k); return [om[0] + r * Math.sin(a), om[1] - r * Math.cos(a), z]; };
    const kol = (s, i, k) => { const kutup = [ara(-0.75, -0.2, k), ara(0.35, -1, k), i * ara(0.55, 0.3, k)],   // dirsek yönü yumuşak döner (tek karede dönünce 1 cm sıçrıyordu)
      om = i > 0 ? s.omA : s.omB, W = bilek(s, i, k);
      const r = M.ik2(om, W, L.ua, L.fa - KAVRAMA, kutup), u = birim(fark(W, r.dirsek)), f = PARMAK(i);
      return { hedef: ekle(W, u, KAVRAMA), kutup, zemin: { avuc: k > 0 ? [W[0] + AVUC * f[0], W[1] - BILEK_Y, W[2] + AVUC * f[2]] : [BX + AVUC * f[0], 0, i * HZ + AVUC * f[2]], yuk: BILEK_Y, parmak: f, kalkis: k > 0 ? W[1] - BILEK_Y : 0 } }; };   // kalkis: avuç yerden yüksekliği (motor parmakları gevşetir)
    // bacak: uyluk dikten (aşağı) geriye yataya, diz bükümü 90+KB'den ~3°'ye; ayak parmak ucu yerden kalkar, ayak bileği bükük
    // bacak: uyluk geriye döner, kaval önce DÜNYAYA göre açısını korur (ayak yerin altına inmez — önce diz açılınca parmaklar
    // 12 cm gömülüyordu, ölçüldü), sonra açılır. ⚠️ Sınır: kalça sabitken diz yerden dikey kalkamaz, kalça etrafında yay çizer —
    // ilk 1 cm'de diz ~9 cm geriye gider (gerçekte leğen biraz kalkar); hızlı geçsin diye uyluk açısı doğrusal.
    // 2. tur (Sabri: "ayak yere değerken parmak ucu zeminin içinden geçerek hareket ediyor"): diz önce biraz daha bükülür, ayak yerden
    // KALKAR, sonra bacak uzanır — eskiden ilk %5'te ayak yerde 7 cm geriye sürtünüyordu (ölçüldü)
    const bacak = (ka, k) => { const th = ara(-90, -178, k), dz = ara(th + 180 + KB, 3, ease(Math.max(0, (k - 0.4) / 0.6))) + 10 * Math.min(1, k / 0.12) * (1 - ease(Math.max(0, (k - 0.15) / 0.85))), fi = th - dz;
      return { a: [ka[0] + L.th * Math.cos(rd(th)) + L.sh * Math.cos(rd(fi)), ka[1] + L.th * Math.sin(rd(th)) + L.sh * Math.sin(rd(fi)), ka[2]], pt: fi + 90 }; };   // ayak kavala dik (başta parmak ucu yerde, sonda aşağı bakar)
    const ka0 = M.iskelet(poz0(AL));
    return {
      ad: 'Bird Dog', dongu: true, donguTekrar: 2, seritAnlar: [[0, 'başı'], [0.25, 'sağ kol · sol bacak'], [0.75, 'sol kol · sağ bacak']],
      kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [10, 0, 0],
      poz: t => ({ ...poz0(AL), ayakA: [0, bacak(ka0.kaA, uz(t, false, 1)).pt], ayakB: [0, bacak(ka0.kaB, uz(t, false, -1)).pt] }),
      uclar: t => s => ({ A: kol(s, 1, uz(t, true, 1)), B: kol(s, -1, uz(t, true, -1)),
        ayakA: { hedef: bacak(s.kaA, uz(t, false, 1)).a, kutup: [0.2, -1, 0.1] }, ayakB: { hedef: bacak(s.kaB, uz(t, false, -1)).a, kutup: [0.2, -1, -0.1] } }),
      ekipman: () => [],
      izlenen: 'eA',
      kisit: { sirayla: true, elKalkar: ['A', 'B'], dizYonu: [0.3, -1, 0], ozel: [
        { ad: 'gövde ve kalça sabit (dönmez, sarkmaz)', f: ks => { const k = Math.max(...ks.map(s => mesafe(s.P, ks[0].P) + mesafe(s.boyun, ks[0].boyun))); return { gecti: k <= 0.1, olcum: `${k.toFixed(2)} cm` }; } },
        { ad: 'başta avuçlar omzun altında, dizler kalçanın altında (yatayda ≤ 4 cm)', f: ks => { const s = ks[0], a = Math.max(Math.abs(s.eA[0] - s.omA[0]) - KAVRAMA, 0), d = Math.abs(s.zA[0] - s.kaA[0]);
            return { gecti: Math.abs(bilek(s, 1, 0)[0] - s.omA[0]) <= 4 && d <= 4, olcum: `bilek–omuz ${Math.abs(bilek(s, 1, 0)[0] - s.omA[0]).toFixed(1)} · diz–kalça ${d.toFixed(1)}` }; } },
        { ad: 'KARŞI kol ve bacak birlikte uzanır, yere paralele yakın (±15°)', f: ks => { const at = t => ks.reduce((x, s) => Math.abs(s.t - t) < Math.abs(x.t - t) ? s : x);
            const egim = (a, b) => Math.asin(Math.max(-1, Math.min(1, birim(fark(b, a))[1]))) * 180 / Math.PI;
            const a = at(0.25), b = at(0.75), kA = egim(a.omA, a.eA), lB = egim(a.kaB, a.aB), kB = egim(b.omB, b.eB), lA = egim(b.kaA, b.aA);
            const ok = [kA, lB, kB, lA].every(x => Math.abs(x) <= 15) && a.eA[0] > a.omA[0] + 40 && a.aB[0] < a.kaB[0] - 60 && b.eB[0] > b.omB[0] + 40 && b.aA[0] < b.kaA[0] - 60;
            return { gecti: ok, olcum: `t=0,25: sağ kol ${kA.toFixed(0)}° · sol bacak ${lB.toFixed(0)}° | t=0,75: sol kol ${kB.toFixed(0)}° · sağ bacak ${lA.toFixed(0)}°` }; } },
        { ad: 'kalkan el yerde kaymaz (yerden 1 cm kalkana dek yatayda ≤ 1 cm)', f: ks => { const s0 = ks[0], m = Math.max(...ks.flatMap(s => ['A', 'B'].flatMap(y => {
            const o = []; const zm = s.hedef?.[y]?.zemin, zm0 = s0.hedef?.[y]?.zemin;
            if (zm && zm0 && zm.avuc[1] < 1) o.push(Math.hypot(zm.avuc[0] - zm0.avuc[0], zm.avuc[2] - zm0.avuc[2]));
            return o; })));
          return { gecti: m <= 1, olcum: `en fazla ${m.toFixed(2)} cm` }; } },
        { ad: 'kalkan ayak yere gömülmez (parmak kökü ve bilek ≥ zemin)', f: ks => { const m = Math.min(...ks.flatMap(s => [s.uA[1] - TOP_Y, s.uB[1] - TOP_Y, s.aA[1] - AYAK_Y + 2, s.aB[1] - AYAK_Y + 2])); return { gecti: m >= -0.5, olcum: `en alçak ${m.toFixed(1)}` }; } },
        { ad: 'destek dizi ve ayak ucu yerde sabit', f: ks => { const m = Math.max(...ks.flatMap(s => [['A', -1], ['B', 1]].filter(([y]) => uz(s.t, false, y === 'A' ? 1 : -1) === 0).map(([y]) => Math.abs(s[`z${y}`][1] - KN_Y) + Math.abs(s[`u${y}`][1] - TOP_Y))));
            return { gecti: m <= 0.5, olcum: `en fazla ${m.toFixed(2)}` }; } },
      ] },
    };
  })()),

  bw_side_plank: mindereKoy((() => {
    // YAN PLANK (McGill; ACE): sol yanda, sol ön kol yerde — dirsek omzun TAM altında, ön kol öne (yüzün baktığı yöne);
    // ayaklar üst üste, alttaki ayağın dış kenarı yerde. Baştan ayağa tek düz çizgi: kalça ne yere çöker ne yukarı kaçar.
    // Üst el KALÇADA (17 Eki, Sabri: "üstteki kol bozuk, yukarıda olması gerekmiyor" — McGill'in temel yan plankı da böyle).
    // Beden yandan yatar: gövdenin yan ekseni (yan, B → A) yukarı, yüz +z'ye. Ayak sırtları başa doğru (+x): alt ayak dış
    // kenarı üstünde, üst ayak onun üstünde (motor veriden alır; eskiden alt ayak tabanı zemine yatıyordu).
    // Pozlar plank gibi kısıtlardan ÇÖZÜLÜR: alt omuz yüksekliği (ön kol yerde, üst kol dik) ve alt bilek yüksekliği (ayak
    // dış kenarında) SABİT, dirsek omzun altında; serbest değişken kalçanın yüksekliği.
    const OMUZ_Y = R.fa + 1 + L.ua, BILEK_Y = 4.5, BCK = L.th + L.sh, Z0 = -14, OX = 0;
    const yanOf = ag => yon(180, 90 - ag);                                   // gövdeye dik, yukarı (x–y düzleminde)
    const omuzB = (P, ag) => { const g = yon(0, ag), y = yanOf(ag); return ekle(ekle(ekle(ekle(P, g, L.torso), y, -OMUZ.yan), g, -OMUZ.asagi), [0, 0, 1], OMUZ.on); };
    const yanPoz = Py => {
      let a = -30, c = 60; for (let i = 0; i < 60; i++) { const m = (a + c) / 2; if (omuzB([0, Py, Z0], m)[1] < OMUZ_Y) a = m; else c = m; }
      const ag = (a + c) / 2, P = [OX - omuzB([0, Py, Z0], ag)[0], Py, Z0];
      const kaB = ekle(P, yanOf(ag), -KALCA_YAN), ab = kemer(kaB[1] - BILEK_Y, BCK);
      return { P, g: [0, ag], yan: [180, 90 - ag], bas: 0, ayak: [-90, 0], ab,
        uaA: [0, 90], faA: [0, 90], uaB: [0, -90], faB: [-90, 0], thB: [180, -ab], shB: [180, -ab], thA: [180, -ab], shA: [180, -ab] };
    };
    // doğru: alt omuz–kalça–alt bilek tek çizgi → kalça yüksekliği çözülür
    const sapma = Py => { const p = yanPoz(Py), s = M.iskelet(p), u = birim(fark(s.aB, s.omB)), v = fark(s.kaB, s.omB);
      return nokta(fark(v, u.map(x => x * nokta(v, u))), [0, 1, 0]); };     // + = kalça çizginin üstünde
    const PY = (() => { let a = 15, c = 60; for (let i = 0; i < 60; i++) { const m = (a + c) / 2; if (sapma(m) < 0) a = m; else c = m; } return (a + c) / 2; })();
    // üst ayak alttakinin üstünde (ayaklar üst üste, bilekler ~9 cm): alt bilek iskeletin kendisinden (her varyantta doğru)
    const altAyak = s => ekle(s.kaB, yon(180, -kemer(s.kaB[1] - BILEK_Y, BCK)), BCK);   // açıyla çözülen alt bilek (uclar uzuvlardan önce çağrılır)
    const ustAyak = s => { const ab = kemer(s.kaB[1] - BILEK_Y, BCK), aB = altAyak(s);
      const ust = ekle(aB, [-Math.sin(rd(ab)), Math.cos(rd(ab)), 0], 9);
      return ekle(s.kaA, birim(fark(ust, s.kaA)), BCK * 0.995); };            // üst bacak da düz (diz kilitli değil)
    const V = [yanPoz(PY), yanPoz(PY - 9), yanPoz(PY + 12)];
    return {
      ad: 'Side Plank', kamera: [20, 14], seritKameralar: [[0, 0], [20, 14], [80, 30]], merkez: [-30, 0, 0], statik: true,
      // Sıra uygulamadaki metinlerle AYNI (exercises.js → bw_side_plank.variants): doğru · kalça çökük · kalça yüksek
      varyantlar: V,
      a: V[0],
      uclar: () => s => ({ ayakA: { hedef: ustAyak(s), kutup: [0, 0, 1], sirt: [1, 0, 0] }, ayakB: { hedef: altAyak(s), kutup: [0, 0, 1], sirt: [1, 0, 0] },
        A: { hedef: ekle(ekle(s.kaA, s.yan, R.kalca + 2), s.g, 5), kutup: ekle(s.yan, [0, 0, -0.4]) } }),   // el kalçanın üstünde (motor avucu yüzeye yatırır), dirsek yukarı-geri
      kasAktif: () => ({ A: { karin: 0 }, B: { karin: 1 } }),
      ekipman: () => [],
      izlenen: 'P',
      kisit: { tekTaraf: true, dizYonu: [0, 0, 1], ozel: [
        { ad: 'baştan ayağa tek çizgi (alt omuz–kalça–alt bilek, sapma ≤ 1,5)', f: ks => { const s = ks[0], u = birim(fark(s.aB, s.omB)), v = fark(s.kaB, s.omB), d = mesafe(v, u.map(x => x * nokta(v, u)));
          return { gecti: d <= 1.5, olcum: `sapma ${d.toFixed(1)}` }; } },
        { ad: 'dirsek omzun tam altında, ön kol yerde ve öne dönük', f: ks => { const s = ks[0], d = Math.hypot(s.dB[0] - s.omB[0], s.dB[2] - s.omB[2]), y = [s.dB[1], s.eB[1]].map(v => v - R.fa), z = s.eB[2] - s.dB[2];
          return { gecti: d <= 1 && y.every(v => v >= -0.5 && v <= 1.5) && z >= L.fa - 1, olcum: `yatay ${d.toFixed(1)} · zemine ${Math.min(...y).toFixed(1)}…${Math.max(...y).toFixed(1)} · öne ${z.toFixed(1)}` }; } },
        { ad: 'alt ayağın dış kenarı yerde (bilek ' + BILEK_Y + ' cm)', f: ks => { const y = ks[0].aB[1] - BILEK_Y; return { gecti: Math.abs(y) <= 0.5, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'ayaklar üst üste (üst bilek alttakinin 7–11 cm üstünde, ≤ 6 cm kayık)', f: ks => { const s = ks[0], d = s.aA[1] - s.aB[1], x = Math.abs(s.aA[0] - s.aB[0]);
          return { gecti: d >= 7 && d <= 11 && x <= 6, olcum: `${d.toFixed(1)} cm üstte · ${x.toFixed(1)} cm kayık` }; } },
        { ad: 'üst el kalçada (metin: "ya da elini beline koy"; hedefe ≤ 1 cm)', f: ks => { const s = ks[0], d = mesafe(s.eA, ekle(ekle(s.kaA, s.yan, R.kalca + 2), s.g, 5)); return { gecti: d <= 1, olcum: `${d.toFixed(1)} cm` }; } },
      ] },
    };
  })()),

  bw_glute_bridge: mindereKoy((() => {
    // KALÇA KÖPRÜSÜ (NSCA / ACE; Contreras: glute bridge): sırtüstü minderde, dizler bükük, tabanlar yerde ve SABİT, kollar
    // yanlarda avuçlar yerde. Kalça sıkılarak yukarı itilir; omuzlar ve başın arkası yerde kalır, beden OMUZLARIN etrafında
    // döner. Tepede omuz–kalça–diz TEK ÇİZGİDE (bel aşırı kavislenmez) ve diz ~90° bükük; altta kalça yere değer.
    // Tepe açısı ve ayak yeri SAYISAL: omuzdan kalçaya uzanan çizginin uyluk boyunca uzantısı dizdir; diz 90° iken kaval
    // dizden öne-aşağı iner ve bilek yere (AYAK_Y) değmeli — gövde açısı bundan çözülür, bilek o tepe pozundan.
    const FI0 = Math.asin((M.SIRT - M.KALCA_ARKA) / 24) * 180 / Math.PI, P0 = [0, M.KALCA_ARKA + 0.8, 0];
    const gv = fi => [-Math.cos(rd(fi)), Math.sin(rd(fi)), 0];
    const BAS0 = M.basYaslanmaEgimi(P0[1] + L.torso * Math.sin(rd(FI0)), 3.5);   // mekikteki gibi: kadın gövdelerinde topuz yere girmesin
    const AZ = KALCA_YAN + 1, BACAK_FK = { thA: [0, -90], shA: [0, -90], thB: [0, -90], shB: [0, -90] };
    // gövde baş tarafına eğildikçe boyun bükülür (bas): başın arkası yerde kalır
    const poz0 = (P, fi) => ({ P, g: [180, fi], yan: [90, 0], yuz: [0, 90 - fi], ayak: 0, bas: BAS0 + (fi - FI0) * 1.8, ...BACAK_FK,
      uaA: [0, 0], faA: [0, 0], uaB: [0, 0], faB: [0, 0] });
    // dönme merkezi: omuzların ortası (altta) — beden onun etrafında, x–y düzleminde döner
    const s0 = M.iskelet(poz0(P0, FI0)), O = s0.omA.map((v, i) => (v + s0.omB[i]) / 2), v0 = fark(P0, O);
    const Pof = fi => { const a = rd(FI0 - fi), c = Math.cos(a), s = Math.sin(a); return [O[0] + c * v0[0] - s * v0[1], O[1] + s * v0[0] + c * v0[1], 0]; };
    const poz = fi => poz0(Pof(fi), fi);
    const bilekOf = fi => { const s = M.iskelet(poz(fi)), o = s.omA.map((v, i) => (v + s.omB[i]) / 2), k = s.kaA, u = birim([k[0] - o[0], k[1] - o[1], 0]), d = ekle(k, u, L.th);
      return [d[0] + L.sh * u[1], d[1] - L.sh * u[0]]; };                     // diz 90°: kaval uyluğa dik, öne-aşağı
    const UST = (() => { let a = -60, c = FI0; for (let i = 0; i < 60; i++) { const m = (a + c) / 2; if (bilekOf(m)[1] > AYAK_Y) a = m; else c = m; } return (a + c) / 2; })();
    const AX = bilekOf(UST)[0];
    const fiT = t => ara(FI0, UST, ease(t));
    // eller: yanlarda, avuç yerde, parmaklar ayağa doğru; bilek omzun ~%92 kol boyu ötesinde, kalçanın yanında
    const BILEK_Y = 4, AVUC = 5.5, HZ = OMUZ.yan + 9, KAVRAMA = M.KAVRAMA;
    const BX = O[0] + Math.sqrt(((L.ua + L.fa - KAVRAMA) * 0.97) ** 2 - (O[1] - BILEK_Y) ** 2 - (HZ - OMUZ.yan) ** 2);
    const PARMAK = [1, 0, 0], bilek = i => [BX, BILEK_Y, i * HZ], avuc = i => [BX + AVUC, 0, i * HZ];
    const kol = (s, i) => { const om = i < 0 ? s.omA : s.omB, kutup = [0, 0.4, i], W = bilek(i), r = M.ik2(om, W, L.ua, L.fa - KAVRAMA, kutup), u = birim(fark(W, r.dirsek));
      return { hedef: ekle(W, u, KAVRAMA), kutup, zemin: { avuc: avuc(i), yuk: BILEK_Y, parmak: PARMAK } }; };
    const bilekA = i => [AX, AYAK_Y, i * AZ], kutupDiz = i => [0, 1, i * 0.1];
    const ortaOm = s => s.omA.map((v, i) => (v + s.omB[i]) / 2);
    const cizgiAci = s => { const o = ortaOm(s), z = s.zA.map((v, i) => (v + s.zB[i]) / 2), k = s.P;
      const a = Math.atan2(k[1] - o[1], k[0] - o[0]), b = Math.atan2(z[1] - k[1], z[0] - k[0]); return (b - a) * 180 / Math.PI; };   // + = kalça çizginin altında (bükük), − = üstünde (aşırı)
    return {
      ad: 'Glute Bridge', kamera: [40, 18], seritKameralar: [[0, 0], [40, 18], [100, 30]], merkez: [10, 0, 0],
      poz: t => poz(fiT(t)),
      uclar: () => s => ({ A: kol(s, -1), B: kol(s, 1),
        ayakA: { hedef: bilekA(-1), kutup: kutupDiz(-1) }, ayakB: { hedef: bilekA(1), kutup: kutupDiz(1) } }),
      ekipman: () => [],
      izlenen: 'P',
      kisit: { ayaklar: 'yerde', dizYonu: [0, 1, 0], ozel: [
        { ad: 'omuzlar yerde, beden onların etrafında döner (±1,5)', f: ks => { const m = ks.map(s => mesafe(ortaOm(s), O)), d = Math.max(...m); return { gecti: d <= 1.5, olcum: `omuz kayması en çok ${d.toFixed(2)}` }; } },
        { ad: 'başın arkası yerde (0–5 cm)', f: ks => { const y = ks.map(s => s.kafa[1] - M.KAFA_R), a = Math.min(...y), c = Math.max(...y); return { gecti: a >= -0.5 && c <= 5, olcum: `${a.toFixed(1)} … ${c.toFixed(1)}` }; } },
        { ad: 'altta kalça yere değer (≤ 2 cm)', f: ks => { const y = ks[0].P[1] - M.KALCA_ARKA; return { gecti: y >= -0.5 && y <= 2, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'tepede omuz–kalça–diz tek çizgide (±8°, bel aşırı kavislenmez)', f: ks => { const a = cizgiAci(ks.at(-1)); return { gecti: Math.abs(a) <= 8, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'tepede diz ~90° (80–100°)', f: ks => { const d = 180 - aciOf(ks.at(-1).kaA, ks.at(-1).zA, ks.at(-1).aA); return { gecti: d >= 80 && d <= 100, olcum: `${d.toFixed(1)}°` }; } },
        { ad: 'avuçlar yerde sabit', f: ks => { const d = Math.max(...ks.map(s => Math.max(mesafe(s.eA, ks[0].eA), mesafe(s.eB, ks[0].eB)))); return { gecti: d <= 0.5, olcum: `kayma ${d.toFixed(2)}` }; } },
      ] },
    };
  })()),

  bw_hanging_leg_raise: asiliKaldirma(false),
  bw_hanging_knee_raise: asiliKaldirma(true),

  db_bulgarian_split_squat: (() => {
    // Bulgarian split squat (NSCA / ACE): arka ayağın ÜSTÜ sehpada, ön taban yerde; ikisi de SABİT. İnişte ön uyluk yataya
    // yaklaşır, ön kaval dike yakın kalır, arka diz yere doğru iner (değmez); gövde hafif önde. Dambıllar yanlarda sarkar ve ön
    // uyluğun DIŞINDAN geçer. Yalnız sağ bacak önde oynar (K5; metin "her bacakla ayrı set" der).
    // Ayak yerleri altta çözülür: ön kaval 10° önde, ön uyluk 8° eğik → kalça yüksekliği ve ön bilek; arka diz yerden ARKA_DIZ
    // yukarıda → arka bilek sehpanın ön kenarında.
    const ON_KAVAL = rd(10), ON_UYLUK = rd(8), ARKA_DIZ_Y = 14, SEHPA_UST = 42, ARKA_BILEK_Y = SEHPA_UST + 3.2, ZY = KALCA_YAN + 1;
    const PY_ALT = AYAK_Y + L.sh * Math.cos(ON_KAVAL) + L.th * Math.sin(ON_UYLUK);
    const ON_DIZ_X = L.th * Math.cos(ON_UYLUK), FX = ON_DIZ_X - L.sh * Math.sin(ON_KAVAL);
    const ARKA_DIZ_X = -Math.sqrt(L.th ** 2 - (PY_ALT - ARKA_DIZ_Y) ** 2);
    const RX = ARKA_DIZ_X - Math.sqrt(L.sh ** 2 - (ARKA_BILEK_Y - ARKA_DIZ_Y) ** 2);
    // tepe: ön diz ~15° bükük (kilitli değil)
    const D_UST = Math.sqrt(L.th ** 2 + L.sh ** 2 + 2 * L.th * L.sh * Math.cos(rd(15)));
    const PY_UST = AYAK_Y + Math.sqrt(D_UST ** 2 - FX ** 2);
    const fiT = t => ara(82, 78, ease(t)), PY = t => ara(PY_UST, PY_ALT, ease(t));
    const onBilek = [FX, AYAK_Y, ZY], arkaBilek = [RX, ARKA_BILEK_Y, -ZY];
    const DZ = 32;                                                             // dambıl yanalı: ön uyluğun dışında
    const el = (s, i) => { const om = i > 0 ? s.omA : s.omB; return [om[0], om[1] - Math.sqrt((ERISIM * 0.99) ** 2 - (DZ - Math.abs(om[2])) ** 2), i * DZ]; };
    const SEHPA_X = [RX - 38, RX + 1];                                      // ön kenar bileğin hemen önünde (+6'da kaval kenara 2 cm giriyordu)
    return {
      ad: 'Bulgarian Split Squat', kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [100, 10]], merkez: [(FX + RX) / 2, 0, 0],
      poz: t => ({ ...AYAKTA([0, PY(t), 0], [0, fiT(t)]), ayakA: 0, ayakB: [0, -158] }),   // 2. tur: arka bilek gevşek (−170 → −158)
      uclar: () => s => ({
        A: { hedef: el(s, 1), kutup: [-0.3, 0, 1], ...tut([1, 0, 0], 1.6, 'ic') }, B: { hedef: el(s, -1), kutup: [-0.3, 0, -1], ...tut([1, 0, 0], 1.6, 'ic') },
        ayakA: { hedef: onBilek, kutup: [1, 0, 0.1] }, ayakB: { hedef: arkaBilek, kutup: [0.4, -1, -0.1], yuzeyY: SEHPA_UST } }),
      ekipman: (pr, s) => [...M.sehpaCiz(pr, SEHPA_X, SEHPA_UST, 28), ...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
      cisimler: s => [M.dambilCismi(s.eA, [1, 0, 0]), M.dambilCismi(s.eB, [1, 0, 0])],
      izlenen: 'P',
      kisit: { ayaklar: { A: 'yerde' }, dizYonu: [1, 0, 0], govde: { aralik: [75, 90] }, ozel: [
        { ad: 'arka ayak sehpada sabit (≤ 0,5)', f: ks => { const m = Math.max(...ks.map(s => mesafe(s.aB, arkaBilek))); return { gecti: m <= 0.5, olcum: `kayma ${m.toFixed(2)}` }; } },
        { ad: 'altta ön uyluk yataya yakın (≤ 15°)', f: ks => { const s = ks.at(-1), a = Math.atan2(s.kaA[1] - s.zA[1], s.zA[0] - s.kaA[0]) * 180 / Math.PI; return { gecti: Math.abs(a) <= 15, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'altta ön kaval dike yakın (≤ 20°)', f: ks => { const s = ks.at(-1), a = Math.atan2(Math.abs(s.zA[0] - s.aA[0]), s.zA[1] - s.aA[1]) * 180 / Math.PI; return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'altta arka diz yere yakın ama değmiyor (3–12 cm)', f: ks => { const y = ks.at(-1).zB[1] - R.sh; return { gecti: y >= 3 && y <= 12, olcum: `${y.toFixed(1)} cm` }; } },
        { ad: 'tepede ön diz kilitli değil (10–25°)', f: ks => { const a = 180 - aciOf(ks[0].kaA, ks[0].zA, ks[0].aA); return { gecti: a >= 10 && a <= 25, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'ön diz ayak ucunu fazla geçmiyor (≤ 10 cm)', f: ks => { const m = Math.max(...ks.map(s => s.zA[0] - s.uA[0])); return { gecti: m <= 10, olcum: `${m.toFixed(1)}` }; } },
      ] },
    };
  })(),

  db_two_arm_row: {
    ad: 'Two Arm Dumbbell Row', kamera: [35, 12], seritKameralar: [[0, 0], [35, 12], [150, 20]], merkez: [15, 0, 0],
    a: AYAKTA([0, AYAKTA_Y - 5, 0], [0, 20]),                               // gövde yere ~20° (NSCA; ExRx: yataya yakın)
    // Dambıl SARKAR: ön kol her karede dikey. El yüksekliği dy seçilir, dirsek elin 29 üstünde
    // olacak biçimde geriye kayma dx çözülür: dx² + (29 − dy)² + dz² = 31²
    // 13 Eki (ölçüldü: başta üst kol 4 karede ~33° savruluyordu, en büyük adım 15,3° / ortanca 0,2°): el yüksekliği
    // doğrusal verilip dirsek √ ile çözülüyordu; başlangıç yüksekliği ön kol dikken ULAŞILAMAZDI (dirsek kırpılıp 0'da
    // kalıyor, sonra √'nin sonsuz eğimiyle fırlıyordu). Artık dirsek AÇIYLA sürülür: omzun altında düz başlar, x–y
    // düzleminde yay çizer (ρ = üst kolun o düzlemdeki izdüşümü); el dirseğin L.fa altında → ön kol her karede dik.
    uclar: t => { const k = ease(t), dz = 12 /* 8 Eki: çekişte dambıl başı (Ø14) uyluğun yanından geçer — 7 iken uyluğa giriyordu */,
      rho = Math.sqrt(L.ua ** 2 - dz * dz), fiTepe = Math.PI / 2 + Math.asin(Math.min(1, L.ua * Math.sin(rd(16)) / rho)) /* tepede dirsek omzun ~16° üstünde */,
      fi = ara(0, fiTepe, k), dx = rho * Math.sin(fi), dy = L.fa + rho * Math.cos(fi);
      return s => {
        const hA = ekle(s.omA, [-dx, -dy, dz]), hB = ekle(s.omB, [-dx, -dy, -dz]);
        return { A: { hedef: hA, kutup: fark(ekle(hA, [0, L.fa, 0]), s.omA), ...tut([1, 0, 0], 1.6) }, B: { hedef: hB, kutup: fark(ekle(hB, [0, L.fa, 0]), s.omB), ...tut([1, 0, 0], 1.6) },
          ...ayakBilekleri(12, KALCA_YAN + 0.5) }; }; },
    ekipman: (pr, s) => [...M.dambil(pr, s.eA, [1, 0, 0]), ...M.dambil(pr, s.eB, [1, 0, 0])],
    cisimler: s => [M.dambilCismi(s.eA, [1, 0, 0]), M.dambilCismi(s.eB, [1, 0, 0])],
    izlenen: 'eA',
    kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], onKolDikey: 20, govde: { aralik: [15, 25], oynama: 1 } },
  },

  db_one_arm_row: (() => {
    // TEK KOL DAMBIL KÜREK (NSCA Exercise Technique Manual; ACE): sol diz ve sol el düz sehpada, sağ ayak yerde (dizi hafif
    // bükük). Gövde yere neredeyse paralel, sırt düz; destek kolu omzun ALTINDA düz. Çalışan kol (sağ) dambılı omzun altından,
    // dirsek gövdeye yakın, kalçaya doğru çeker: tepede dirsek sırtın üstüne çıkar, ön kol hep DİK (dambıl sarkar); gövde
    // dönmez. Sehpa bedenin altında, sol tarafta (z < 0); dambıl sağda, sehpanın dışından geçer.
    const SZ = -15, SEN = 28, SU = BENCH_UST;                                  // sehpa: eksen z, en, üst yüzü
    // 17 Eki (Sabri: "diz ve ayak sehpanın üstünde havada"): ölçüldü — dört gövdede kaval 1,6–2,4, ayak 2,2–2,8, diz 2,9–3,8 cm havadaydı
    // (veri bacağı gövdeden ince). Diz 3, kaval 1,6 cm indirildi: minder en çok ~1 cm ezilir (yüzey denetimi, dört gövde).
    const DIZ_ON = 14, DIZ_Y = SU + 3.3, SAG_Z = KALCA_YAN + 9;                // sol diz kalçanın 14 cm önünde (uyluk hafif eğik)
    // kalça ekleminin yüksekliği: sol uyluk dizden L.th → kalça merkezi (ekleme göre P'nin farkı iskeletten)
    const BACAK_FK = { thA: [0, -90], shA: [0, -90], thB: [0, -90], shB: [0, -90] };
    const KA_FARK = (() => { const s = M.iskelet({ ...AYAKTA([0, 100, 0], [0, 10]), ...BACAK_FK }); return s.P[1] - s.kaB[1]; })();
    const P = [0, DIZ_Y + Math.sqrt(L.th ** 2 - DIZ_ON ** 2) + KA_FARK, 0];
    // 3. tur (Sabri: "sehpadaki ayak çok gergin, bilek o şekilde düz olmamalı; parmak uçları mindere değsin"): kaval ile taban
    // arası 67° bükümlüydü (taban kavalın neredeyse devamı). Bükümü 38°'ye indir; ayak ucu aşağı döner, bilek parmak UÇLARI
    // sehpaya değecek kadar yükselir (diz sehpada kalır, kaval hafif kalkar). Kaval yönü bilek yüksekliğine bağlı → yinelemeyle.
    // Parmak ucu ≈ bilek + taban·18 + ayak sırtı yönünde 1,5 (2. tur hâlinde ölçülen temasla ayarlı: 198° · bilek SU+6,8 → değiyor).
    const SOL_PF = 38, SOL = (() => { const dz = [P[0] + DIZ_ON, DIZ_Y]; let pt = 198, a = [0, 0];
      for (let i = 0; i < 40; i++) { const y = SU + 0.3 - 18 * Math.sin(rd(pt)) - 1.5 * Math.sin(rd(pt + 90)), dy = y - dz[1];
        a = [dz[0] - Math.sqrt(L.sh ** 2 - dy * dy), y]; pt = Math.atan2(a[1] - dz[1], a[0] - dz[0]) * 180 / Math.PI + 90 - SOL_PF; }
      return { bilek: [a[0], a[1], -KALCA_YAN], pt }; })();
    const AVUC = 5.5, BILEK_Y = 3.4, KAVRAMA = M.KAVRAMA, PARMAK = [Math.cos(rd(8)), 0, -Math.sin(rd(8))];
    const pozEl = el => ({ ...AYAKTA(P, [0, el]), ...BACAK_FK, bas: 8, ayakB: [0, SOL.pt] });   // sol ayak geriye uzanır, ayak sırtı sehpada (taban yukarı); 2. tur: bilek gevşek (185 → 198), parmaklar sehpaya kıvrılır
    // gövde eğimi: destek kolunun omzu, sehpadaki bileğin tam üstünde ve kol (bilek → omuz) boyunun %99,5'i (düz, kilitli değil)
    const omB = el => M.iskelet(pozEl(el)).omB;
    const EL = (() => { let a = -10, c = 40; for (let i = 0; i < 60; i++) { const m = (a + c) / 2; if (omB(m)[1] - (SU + BILEK_Y) < (L.ua + L.fa - KAVRAMA) * 0.995) a = m; else c = m; } return (a + c) / 2; })();
    const OB = omB(EL), BILEK_B = [OB[0], SU + BILEK_Y, OB[2]], AVUC_B = [OB[0] + AVUC * PARMAK[0], SU, OB[2] + AVUC * PARMAK[2]];
    const SOL_DIZ = [P[0] + DIZ_ON, DIZ_Y, -KALCA_YAN], SOL_BILEK = SOL.bilek;   // 3. tur: parmak uçlarıyla sehpaya değen gevşek ayak
    // çalışan kol: dirsek AÇIYLA sürülür (iki kollu kürekteki gibi): omzun altında düz başlar, x–y düzleminde yay çizer; el
    // dirseğin L.fa altında → ön kol her karede dik
    const DZ = 7, TEPE = 12;                                                     // dirseğin omuzdan yanalı · tepede üst kol yataydan TEPE° yukarı (dambıl kalçaya doğru)
    const el = (om, t) => { const rho = Math.sqrt(L.ua ** 2 - DZ * DZ), fi = ara(0, rd(90 + TEPE), ease(t));
      return ekle(om, [-rho * Math.sin(fi), -(L.fa + rho * Math.cos(fi)), DZ]); };
    const kol = (s, W) => { const kutup = [-0.2, 0.3, -1], r = M.ik2(s.omB, W, L.ua, L.fa - KAVRAMA, kutup), u = birim(fark(W, r.dirsek));
      return { hedef: ekle(W, u, KAVRAMA), kutup, zemin: { avuc: AVUC_B, yuk: BILEK_Y, parmak: PARMAK } }; };
    // düz sehpa (M.sehpaCiz'in aynısı) eksenini z = zc'ye kaydırarak
    const sehpaKaydir = (pr, [x0, x1], ust, en, zc) => { const T = M.SEHPA_TON, o = [...minderKutu(pr, [x0, x1], [ust - 7, ust], [zc - en / 2, zc + en / 2], T.minder),
      ...M.kutu(pr, [x0 + 3, x1 - 3], [ust - 10, ust - 7], [zc - en / 2 + 3, zc + en / 2 - 3], T.cerceve)];
      for (const xb of [x0 + 7, x1 - 7]) o.push(...M.kutu(pr, [xb - 2.5, xb + 2.5], [4, ust - 10], [zc - 2.5, zc + 2.5], T.cerceve),
        ...M.kutu(pr, [xb - 3, xb + 3], [0, 4], [zc - 20, zc + 20], T.cerceve));
      return o; };
    return {
      ad: 'One Arm Dumbbell Row', kamera: [-40, 14], seritKameralar: [[0, 0], [-40, 14], [-120, 20]], merkez: [10, 0, 0],
      poz: () => pozEl(EL),
      uclar: t => s => { const h = el(s.omA, t);
        return { A: { hedef: h, kutup: fark(ekle(h, [0, L.fa, 0]), s.omA), ...tut([1, 0, 0], 1.6) }, B: kol(s, BILEK_B),
          // 17 Eki: sağ ayak −14 → −22 (kalça 3 cm alçalınca sağ uyluk dambıl yoluna giriyordu)
          ayakA: { hedef: [P[0] - 22, AYAK_Y, SAG_Z], kutup: [1, 0, 0.15] }, ayakB: { hedef: SOL_BILEK, kutup: [1, -1, 0], yuzeyY: SU } }; },
      ekipman: (pr, s) => [...sehpaKaydir(pr, [-62, 66], SU, SEN, SZ), ...M.dambil(pr, s.eA, [1, 0, 0])],   // 2. tur: 58 → 66 (destek elinin parmakları sehpanın ucundan taşıyordu)
      cisimler: s => [M.dambilCismi(s.eA, [1, 0, 0])],
      kasAktif: () => ({ A: { sirtOrta: 1, lat: 1, arkaOmuz: 1, biceps: 1 }, B: { sirtOrta: 0, lat: 0, arkaOmuz: 0, biceps: 0 } }),   // yalnız çalışan kol
      izlenen: 'eA',
      kisit: { tekTaraf: true, dizYonu: [1, -0.3, 0], onKolDikey: 20, govde: { aralik: [0, 20], oynama: 0.5 }, ozel: [
        { ad: 'destek eli sehpada, omzun altında, kol düz', f: ks => { const s = ks[0], b = ekle(s.eB, birim(fark(s.dB, s.eB)), KAVRAMA), y = b[1] - SU - BILEK_Y, x = Math.hypot(b[0] - s.omB[0], b[2] - s.omB[2]), d = 180 - aciOf(s.omB, s.dB, s.eB);
          return { gecti: Math.abs(y) <= 1 && x <= 4 && d <= 15, olcum: `bilek sehpaya ${y.toFixed(1)} · omuzdan yatay ${x.toFixed(1)} · dirsek ${d.toFixed(0)}°` }; } },
        // 3. tur: kaval artık sehpaya yatmıyor — diz sehpada, sol ayağın parmak UÇLARI sehpada (bilek bükük), sağ ayak yerde
        { ad: 'sol diz ve parmak uçları sehpada, sağ ayak yerde', f: ks => { const s = ks[0], dz = s.zB[1] - DIZ_Y, aa = s.aA[1] - AYAK_Y;
            const uc = ekle(ekle(s.aB, s.tabB, 18), yon(0, SOL.pt + 90), 1.5), du = uc[1] - SU;
          return { gecti: Math.abs(dz) <= 1.5 && du >= -1 && du <= 1.5 && Math.abs(aa) <= 0.5 && Math.abs(s.zB[2] - SZ) <= SEN / 2 - 3, olcum: `diz ${dz.toFixed(1)} · parmak ucu ${du.toFixed(1)} · sağ ayak ${aa.toFixed(1)}` }; } },
        { ad: 'dirsek gövdeye yakın (omuzdan yanalı ≤ 10 cm)', f: ks => { const m = Math.max(...ks.map(s => s.dA[2] - s.omA[2])); return { gecti: m <= 10, olcum: `en çok ${m.toFixed(1)} cm` }; } },
        { ad: 'tepede dirsek sırtın üstünde (omuz hizasının 0–10 cm üstü), dambıl kalçayla omuz arasında', f: ks => { const s = ks.at(-1), y = s.dA[1] - s.omA[1];
          return { gecti: y >= 0 && y <= 10 && s.eA[0] > s.P[0] && s.eA[0] < s.omA[0] - 10, olcum: `dirsek +${y.toFixed(1)} · dambıl x ${s.eA[0].toFixed(0)} (kalça ${s.P[0].toFixed(0)}, omuz ${s.omA[0].toFixed(0)})` }; } },
        { ad: 'dambıl sehpaya değmiyor', f: ks => { const m = Math.min(...ks.map(s => s.eA[2] - (SZ + SEN / 2) - 9)); return { gecti: m >= 2, olcum: `sehpa kenarından ${m.toFixed(1)} cm` }; } },
      ] },
    };
  })(),

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
        return [...minderKutu(pr, [-20, 40], [26, 32], [-13, 13], SEHPA), ...M.kutu(pr, [-12, 32], [0, 26], [-6, 6]),
          ...M.kutu(pr, [TABLA, TABLA + 4], [8, 54], [-20, 20], PED),                                // ayak tablası (taban yüzeyi TABLA'da)
          ...M.kutu(pr, [TABLA, TABLA + 8], [5, 8], [-8, 8], KULE.govde),                           // 3. tur: tabla raydan 3 cm havadaydı → ayak
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
    // dambıllar uylukların DIŞINDA sarkar (Ø14 altıgen baş uyluğa değmesin — 27 Eyl). 13 Eki: 6 → 7 cm — yeni iskelette
    // omuz 20,4 → 19,5 cm, dambıl sağ uyluğa 0,8 cm giriyordu (fizik denetimi)
    const bet = Math.asin(7 / L.fa);
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

  db_biceps_curl: (() => {
    // DAMBIL BICEPS CURL (G2, 17 Eki; NSCA / ACE / ExRx "supinated dumbbell curl"): ayakta, dirsekler gövdenin yanında SABİT,
    // iki kol birlikte. Altta avuçlar birbirine bakar (dambıl uyluğun yanında — tam supinasyonda altıgen baş uyluğa girerdi),
    // kaldırırken avuç yukarı döner (supinasyon) ve dambıl yarı yolda yana dönmüş olur; tepede avuç omza bakar. Kol düz başlar
    // (kilitli değil), dambıl omuz hizasına gelir. Yol çekiç curl'ün: dirsek etrafında yay, dambıl uyluğun 7 cm dışında.
    const bet = Math.asin(7 / L.fa);
    const E = (s, i) => { const o = dirsekAlti(3, 4.5); return ekle(i > 0 ? s.omA : s.omB, [o[0], o[1], o[2] * i]); };
    const aci = t => rd(ara(8, 135, ease(t)));
    const el = (s, t, i) => dirsekEtrafinda(E(s, i), L.fa, aci(t), bet, i);
    // tutamak ekseni: altta sagital (çekiç), dambıl uyluktan ayrıldıktan sonra (%15–55) yana döner (supinasyon) — ön kola dik
    // kalır (%0'dan başlayınca dönen baş t≈0,15'te uyluğa 0,8 cm giriyordu)
    const donus = t => ease(Math.min(1, Math.max(0, (t - 0.15) / 0.4)));
    const eksen = (t, i) => { const a = aci(t), k = donus(t), c = Math.cos(k * Math.PI / 2), s2 = Math.sin(k * Math.PI / 2);
      return birim([Math.cos(a) * c, Math.sin(a) * c, i * s2]); };
    return {
      ad: 'Dumbbell Biceps Curl', kamera: [35, 10], seritKameralar: [[0, 0], [35, 10], [90, 6]], merkez: [5, 0, 0],
      a: AYAKTA([0, AYAKTA_Y, 0]),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: ekle(fark(E(s, 1), s.omA), [-4, 0, 0]), ...tut(eksen(t, 1), 1.6, 'onKolOn') },
        B: { hedef: el(s, t, -1), kutup: ekle(fark(E(s, -1), s.omB), [-4, 0, 0]), ...tut(eksen(t, -1), 1.6, 'onKolOn') }, ...ayakBilekleri(2, KALCA_YAN + 2) }),
      ekipman: (pr, s, t) => [...M.dambil(pr, s.eA, eksen(t, 1)), ...M.dambil(pr, s.eB, eksen(t, -1))],
      cisimler: s => [M.dambilCismi(s.eA, eksen(s.t, 1)), M.dambilCismi(s.eB, eksen(s.t, -1))],
      izlenen: 'eA',
      kisit: { dirsekYerinde: ['A', 'B'], ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 }, ozel: [
        { ad: 'altta kol neredeyse düz (dirsek ≤ 20°)', f: ks => { const a = 180 - aciOf(ks[0].omA, ks[0].dA, ks[0].eA); return { gecti: a <= 20, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'tepede dambıl omuz hizasına yakın (omzun ≤ 22 cm altı)', f: ks => { const d = ks.at(-1).omA[1] - ks.at(-1).eA[1]; return { gecti: d <= 22, olcum: `${d.toFixed(1)} cm` }; } },
        { ad: 'tepede avuç yukarı (tutamak yana dönmüş, ≥ %90)', f: ks => { const z = Math.abs(eksen(1, 1)[2]); return { gecti: z >= 0.9, olcum: `${z.toFixed(2)}` }; } },
      ] },
    };
  })(),

  cable_crossover: (() => {
    // KABLO İLE GÖĞÜS AÇMA (cable crossover; G2, 17 Eki; NSCA / ACE / ExRx): iki kule arasında ayakta, makaralar YÜKSEKTE,
    // gövde ~10° öne. Kollar yanda, omuz hizasının biraz altında açık başlar; dirsekler HAFİF BÜKÜK ve SABİT kalır (kucaklar
    // gibi), eller yay çizerek öne ve aşağı iner, alt göğsün önünde buluşur. Hareket omuzdan; dirsek açılıp kapanmaz.
    // Kuleler iki yanda (z = ±KZ), sporcunun hafif arkasında; makara kulenin ön dikmesinin tepesinde.
    const P = [0, AYAKTA_Y - 1, 0], G = [0, 80], KZ = 82, KX = -14, MAKARA = i => [KX - 2, KULE_MAKARA_UST - 8, i * (KZ - 6)];
    const s0 = M.iskelet({ ...AYAKTA(P, G), thA: [0, -90], shA: [0, -90], thB: [0, -90], shB: [0, -90] }), OM = s0.omA;
    const KOL = ERISIM * 0.96;                                               // dirsek ~30° bükük
    // omuza göre el yönü (A tarafı; B z'de ayna): başta yanda ve biraz geride, sonda önde-aşağıda ve içeride (eller buluşur)
    const V0 = birim([-0.15, -0.25, 1]), V1 = birim([0.86, -0.5, -(OM[2] - 7) / KOL]);
    const slerp = (a, b, k) => { const c = Math.acos(Math.max(-1, Math.min(1, nokta(a, b)))), s = Math.sin(c);
      return s < 1e-6 ? a : birim(a.map((v, j) => (Math.sin((1 - k) * c) * v + Math.sin(k * c) * b[j]) / s)); };
    const el = (s, t, i) => { const v = slerp(V0, V1, ease(t)), om = i > 0 ? s.omA : s.omB; return ekle(om, [v[0], v[1], v[2] * i], KOL); };
    const kutup = i => [-0.3, -0.6, i * 0.8];                                // dirsek geride-aşağıda-dışarıda (kucak)
    const EK = [0, 1, 0];
    // D TUTAMAK (17 Eki, Sabri: "kablonun ucunda tutamak olmalı"): kauçuk sap elde (dikey), çelik çerçeve elin SIRTINDAN
    // dolaşıp tepede kabloya bağlanır. Çerçeve ön kola DİK (yatayda), makara tarafına: D biçimi — sap uçlarından 5 cm, sonra
    // tepede birleşir (çerçeve elin üstünden ve altından geçer). ⚠️ 1. deneme tepeyi doğrudan makaraya çevirdi: eller öndeyken
    // kablo ön kol boyunca geldiği için çerçeve bileğin içinden geçti; 2. deneme hep dışa çevirdi: aynı sorun (ön kol dıştan gelir).
    const dTutamak = (m, e, om) => {
      const ok = birim([e[0] - om[0], 0, e[2] - om[2]]), y = fark(m, e), yh = [y[0], 0, y[2]];
      const dk = fark(yh, ok.map(v => v * nokta(yh, ok))), d = nokta(dk, dk) > 1e-6 ? birim(dk) : [-1, 0, 0];
      const ust = ekle(e, EK, 6.5), alt = ekle(e, EK, -6.5);
      const u2 = ekle(ust, d, 5), a2 = ekle(alt, d, 5), tepe = ekle(e, d, 10);
      return { sap: [ekle(e, EK, -6), ekle(e, EK, 6)], cerceve: [[ust, u2], [alt, a2], [u2, tepe], [a2, tepe]], tepe };
    };
    return {
      ad: 'Cable Crossover', kamera: [70, 12], seritKameralar: [[0, 0], [70, 12], [150, 20]], merkez: [0, 0, 0],
      a: AYAKTA(P, G),
      uclar: t => s => ({ A: { hedef: el(s, t, 1), kutup: kutup(1), ...tut(EK, 1.6) }, B: { hedef: el(s, t, -1), kutup: kutup(-1), ...tut(EK, 1.6) },
        ...ayakBilekleri(2, KALCA_YAN + 4) }),
      ekipman(pr, s) {
        const o = [];
        for (const [i, e] of [[1, s.eA], [-1, s.eB]]) {
          const m = MAKARA(i);
          const d = dTutamak(m, e, i > 0 ? s.omA : s.omB);
          o.push(...kabloKulesi(pr, KX, m, -1, yiginKalkisi(this, m, q => i > 0 ? q.eA : q.eB, s) * 0.5, i * KZ), ...M.makara(pr, m), M.kablo(pr, m, d.tepe),
            M.kapsul(pr, ...d.sap, 1.6, '#2f343a'), ...d.cerceve.map(([u, v]) => M.kapsul(pr, u, v, 0.7, '#8a929c')));
        }
        return o;
      },
      cisimler: s => [[MAKARA(1), dTutamak(MAKARA(1), s.eA, s.omA).tepe, 0.7], [MAKARA(-1), dTutamak(MAKARA(-1), s.eB, s.omB).tepe, 0.7]],
      izlenen: 'eA',
      kisit: { ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [76, 84], oynama: 1 }, ozel: [
        { ad: 'dirsekler hafif bükük ve sabit (15–40°, değişim ≤ 15°)', f: ks => { const d = ks.map(s => 180 - aciOf(s.omA, s.dA, s.eA)), a = Math.min(...d), b = Math.max(...d);
          return { gecti: a >= 15 && b <= 40 && b - a <= 15, olcum: `${a.toFixed(0)}–${b.toFixed(0)}°` }; } },
        { ad: 'sonda eller göğsün önünde buluşur (arası ≤ 18 cm, omzun önünde)', f: ks => { const s = ks.at(-1), d = mesafe(s.eA, s.eB);
          return { gecti: d <= 18 && s.eA[0] > s.omA[0] + 25, olcum: `el arası ${d.toFixed(1)} · önde ${(s.eA[0] - s.omA[0]).toFixed(0)} cm` }; } },
        { ad: 'başta kollar yanda açık (eller omuzdan ≥ 40 cm dışarıda)', f: ks => { const z = ks[0].eA[2] - ks[0].omA[2]; return { gecti: z >= 40, olcum: `${z.toFixed(0)} cm` }; } },
      ] },
    };
  })(),

  machine_leg_press: (() => {
    const P = [0, 30, 0], g = [180, 38], gd = yon(...g), n = yon(0, 52), r = birim([1, 1, 0]), pY = birim([-1, 1, 0]);
    const BK = (L.th + L.sh) / 76, s0 = 53.8 * BK, sH = 21 * BK;    // altta diz ~90°, üstte ~160° (eski bacak 76 cm'e göre)
    const bilek = (t, i) => ekle(ekle(P, r, s0 + sH * (1 - ease(t))), Z, (KALCA_YAN + 1) * i);   // t=0 üst (kollar uzun), t=1 alt
    // 3. tur (Sabri: "ayakla itilen plaka makinenin dışına çıkıyor"): raylar 105'te bitiyordu, üstte kızak + plaka rayın ucunu
    // aşıyordu → ray boyu plakanın EN ÜST konumundan türetilir (kızağın ön kenarı + plakanın raya dik yarı boyu kadar pay)
    const RAY_UST = Math.ceil(s0 + sH + AYAK_Y + 2 + 9 + 6 + 20);
    return {
      ad: 'Leg Press', kamera: [30, 18], seritKameralar: [[0, 0], [30, 18], [120, 26]], merkez: [25, 0, 0],
      a: { P, g, yan: [-90, 0], ayak: [0, 135], uaA: [0, -90], faA: [0, -90], uaB: [0, -90], faB: [0, -90] },   // ayak plakaya doğru (yaw 180 tabanı ters çeviriyordu)
      uclar: t => s => ({
        A: { hedef: [P[0] + 6, P[1] + 4, 24], kutup: [0, -1, 0.5], ...tut([0, 1, 0], 2.2) }, B: { hedef: [P[0] + 6, P[1] + 4, -24], kutup: [0, -1, -0.5], ...tut([0, 1, 0], 2.2) },
        ayakA: { hedef: bilek(t, 1), kutup: [-0.5, 1, 0.15] }, ayakB: { hedef: bilek(t, -1), kutup: [-0.5, 1, -0.15] } }),
      ekipman(pr, s, t) {
        const orta = ekle(ekle(P, r, s0 + sH * (1 - ease(t)) + AYAK_Y + 2), pY, 6);   // plakanın ön yüzü = ayak tabanı (bilekten AYAK_Y)
        // 8 Eki (Sabri: "kalçası mindere oturmuyor", "aletler gerçek şekillere benzesin"): oturak sırtlığa kadar uzanan
        // kova koltuk + taban kirişi; platform raylarda kayan KIZAĞA bağlı (eskiden havada levha)
        return [...minderKutu(pr, [-22, 14], [15, 22], [-17, 17], SEHPA), ...M.kutu(pr, [-26, 12], [11, 15], [-12, 12], KULE.govde),
          ...M.kutu(pr, [-60, 30], [0, 4], [-30, 30], KULE.govde), ...M.kutu(pr, [-6, 6], [4, 11], [-8, 8], KULE.govde),
          ...sirtMinderi(pr, s, n, 70, 32, 16),
          ...M.kutuY(pr, orta, [Z, pY, r], [44, 40, 4], PED),
          ...M.kutuY(pr, ekle(orta, r, 9), [Z, pY, r], [62, 26, 12], KULE.govde),                    // kızak (raylar arasında)
          ...[24, -24].map(zz => M.kapsul(pr, ekle(ekle(orta, r, 12), Z, zz), ekle(ekle(ekle(orta, r, 12), Z, zz), pY, 18), 2, METAL)),   // plaka boynuzları
          ...[26, -26].map(zz => M.kapsul(pr, ekle(ekle(P, r, 40), Z, zz), ekle(ekle(P, r, RAY_UST), Z, zz), 2.2, METAL)),
          // ⚠️ Raylar havada duruyordu (27 Eyl denetimi): iki uçtan yere inen dikme + taban kirişi
          ...[28, -28].flatMap(zz => { const alt = ekle(ekle(P, r, 40), Z, zz), ust = ekle(ekle(P, r, RAY_UST), Z, zz);
            return [M.kapsul(pr, [alt[0], 0, zz], alt, 2.6, METAL), M.kapsul(pr, [ust[0], 0, zz], ust, 2.6, METAL),
                    M.kapsul(pr, [-16, 2.5, zz], [ust[0] + 4, 2.5, zz], 2.6, METAL)]; }),
          // yan tutamaklar DİKEY (17 Eki): ileri–geri yatay çubuk ön kolla aynı yöndeydi (açı 11°) → el yönü tanımsızdı
          // 3. tur (Sabri: "ellerin tuttuğu barlar makineye bağlı değil"): yatay kol oturağın 5 cm üstünde havadaydı → tutamak taban
          // kirişinden yükselen dikmenin ucunda
          ...[24, -24].flatMap(zz => [M.kapsul(pr, [P[0] + 6, 2, zz], [P[0] + 6, P[1] - 3, zz], 1.8, METAL),
            M.kapsul(pr, [P[0] + 6, P[1] - 3, zz], [P[0] + 6, P[1] + 10, zz], 2.2, '#8a929c')])];
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
      poz: t => ({ ...AYAKTA([bilek(t, 0)[0], bilek(t, 0)[1] + L.th + L.sh - 0.1, 0]), ayak: [0, aci(t)], zeminY: BASAMAK, uaB: [90, -75], faB: [90, -78] }),   // 17 Eki: basılan yüzey basamak (motorun parmak teması buna göre); boştaki kol biraz daha açık (parmaklar uyluğa 3 cm giriyordu)
      uclar: t => () => ({
        A: { hedef: EL, kutup: [0, -1, 0.4], ...tut([0, 1, 0], 2) },
        ayakA: { hedef: bilek(t, KALCA_YAN), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(t, -KALCA_YAN), kutup: [1, 0, -0.1] } }),
      // 8 Eki: basamak lastik kaplı platform + direk basamağın tabanına bağlı (eskiden yerden çıkan tek boru)
      ekipman: pr => [...M.kutu(pr, [4, 34], [0, BASAMAK - 2], [-18, 18], KULE.govde), ...M.kutu(pr, [4, 34], [BASAMAK - 2, BASAMAK], [-18, 18], PED),
        ...M.kutu(pr, [4, DIREK[0] + 6], [0, 3], [-18, DIREK[2] + 6], KULE.govde),
        M.kapsul(pr, DIREK, [DIREK[0], 160, DIREK[2]], 2, METAL), M.kapsul(pr, [DIREK[0], 160, DIREK[2]], [DIREK[0] - 10, 160, DIREK[2]], 2, METAL)],
      izlenen: 'P',   // 14 Eki: iz bedenin yanındaki boşluğa ÖLÇÜLEREK kayar (manken3d izKaymasi; eskiden elle −(KALCA_YAN + 30))
      kisit: { tekTaraf: true, zeminY: BASAMAK, ayaklar: 'parmakUcu', dizYonu: [1, 0, 0], govde: { aralik: [88, 92], oynama: 1 },
        ozel: [
          { ad: 'dizler düz (≤ 10°)', f: ks => { const m = Math.max(...ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA))); return { gecti: m <= 10, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          { ad: 'başta topuk basamağın altında', f: ks => { const m = ks[0].aA[1] - (BASAMAK + AYAK_Y); return { gecti: m < 0, olcum: `${m.toFixed(1)}` }; } },
          { ad: 'topuk yükseliyor (≥ 5)', f: ks => { const m = ks.at(-1).aA[1] - ks[0].aA[1]; return { gecti: m >= 5, olcum: `${m.toFixed(1)}` }; } },
          { ad: 'el direkte sabit', f: ks => { const m = Math.max(...ks.map(s => mesafe(s.eA, EL))); return { gecti: m <= 0.5, olcum: `kayma ${m.toFixed(1)}` }; } },
        ] },
    };
  })(),

  /* ─── KARDİYO (1B dalga 3, Parti D — 15 Eki) ────────────────────────────────────────────────────────────────────── */

  bw_tibialis_raise: (() => {
    // TIBIALIS RAISE (G3, 17 Eki; koşucu/dizi koruma hareketi — ön kaval kası): sırt duvara yaslı, topuklar duvardan ileride,
    // bacaklar düz (dizler kilitli değil), beden düz bir çizgide hafif geride. Ayak ucu kaval kemiğine doğru KALKAR, topuk
    // yerde SABİT kalır (dönme noktası topuk — bilek değil: bilek etrafında dönen ayağın topuğu yere girer) ve kontrollü iner.
    // Duvar dikey; beden eğik olduğu için ona sırtın üstü (kürek kemikleri) değer.
    const LEAN = 10, AZ = KALCA_YAN + 2, UST_PT = 28;   // 14°'de baş duvara girmesin diye boyun 30° bükülüyordu; 10°'de 20° (çene hafif içeride)
    const BCK = (L.th + L.sh) * 0.995, P = [-BCK * Math.sin(rd(LEAN)), AYAK_Y + BCK * Math.cos(rd(LEAN)), 0];
    const HEEL = (() => { const h = topukVek(0); return [h[0], AYAK_Y + h[1]]; })();      // topuğun yerdeki noktası (bilek x = 0 iken)
    const pt = t => UST_PT * ease(t);
    const bilek = (t, i) => { const h = topukVek(pt(t)); return [HEEL[0] - h[0], HEEL[1] - h[1], i * AZ]; };
    const G = [180, 90 - LEAN];
    const s0 = M.iskelet({ ...AYAKTA(P, G), yan: [-90, 0] }, () => ({ ayakA: { hedef: bilek(0, 1), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(0, -1), kutup: [1, 0, -0.1] } }));
    const sirt = s => ekle(ekle(s.P, s.g, 40), s.yuz, -M.SIRT);                          // kürek kemikleri hizasında sırt yüzeyi
    const DUVAR_X = sirt(s0)[0];
    // baş: beden geride eğik olduğu için başın arkası sırttan geride kalır ve duvara 3,6 cm giriyordu (yüzey) → boyun hafif öne,
    // başın arkası (saç payıyla) duvara değecek kadar; eğim çözülür
    const BAS = (() => { const arka = bb => { const s = M.iskelet({ ...AYAKTA(P, G), bas: bb }, () => ({ ayakA: { hedef: bilek(0, 1), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(0, -1), kutup: [1, 0, -0.1] } }));
        return ekle(s.kafa, s.yuzBas, -M.KAFA_R)[0] - DUVAR_X; };
      let a = -40, c = 0; for (let i = 0; i < 50; i++) { const m = (a + c) / 2; if (arka(m) > 2.5) a = m; else c = m; } return (a + c) / 2; })();   // öne eğim arttıkça boşluk artar; 2,5: saç payı (deri ile iskelet kafası örtüşüyor — ölçüldü, ikisi de −4,4)
    return {
      ad: 'Tibialis Raise', kamera: [60, 10], seritKameralar: [[0, 0], [60, 10], [120, 6]], merkez: [-10, 0, 0],
      // ayak topuk etrafında dönünce bilek yükselir ve ~3 cm geri gelir; beden duvarda yukarı kayar, bacak boyu korunur
      // (yoksa diz 29°'ye bükülüyordu)
      poz: t => { const a = bilek(t, 1); return { ...AYAKTA([P[0], a[1] + Math.sqrt(BCK ** 2 - (P[0] - a[0]) ** 2), 0], G), ayak: [0, pt(t)], bas: BAS }; },
      uclar: t => () => ({ ayakA: { hedef: bilek(t, 1), kutup: [1, 0, 0.1] }, ayakB: { hedef: bilek(t, -1), kutup: [1, 0, -0.1] } }),
      ekipman: pr => [...M.kutu(pr, [DUVAR_X - 12, DUVAR_X], [0, 200], [-70, 70], { ust: '#3a4048', yan: '#2c3138' })],
      izlenen: 'uA',
      kisit: { dizYonu: [1, 0, 0], temas: [{ ad: 'sırt duvarda', f: s => s ? DUVAR_X - sirt(s)[0] : 0, aralik: [-0.5, 0.5] }], ozel: [
        { ad: 'topuk yerde ve SABİT (yer −0,5…1 · kayma ≤ 0,3)', f: ks => { const h = ks.map(s => tabanNoktalari(s.aA, Math.asin(Math.max(-1, Math.min(1, s.tabA[1]))) * 180 / Math.PI).h), y = h.map(v => v[1]), x = h.map(v => v[0]);
            const k = Math.max(...x) - Math.min(...x); return { gecti: Math.min(...y) >= -0.5 && Math.max(...y) <= 1 && k <= 0.3, olcum: `yer ${Math.min(...y).toFixed(1)} … ${Math.max(...y).toFixed(1)} · kayma ${k.toFixed(2)}` }; } },
        { ad: 'tepede ayak ucu kalkar (taban 20–35°)', f: ks => { const a = Math.asin(ks.at(-1).tabA[1]) * 180 / Math.PI; return { gecti: a >= 20 && a <= 35, olcum: `${a.toFixed(1)}°` }; } },
        { ad: 'bacaklar düz, kilitli değil (diz 2–15°)', f: ks => { const d = ks.map(s => 180 - aciOf(s.kaA, s.zA, s.aA)), a = Math.min(...d), b = Math.max(...d); return { gecti: a >= 2 && b <= 15, olcum: `${a.toFixed(1)}–${b.toFixed(1)}°` }; } },
        { ad: 'topuk duvardan ileride (25–45 cm)', f: () => { const d = HEEL[0] - DUVAR_X; return { gecti: d >= 25 && d <= 45, olcum: `${d.toFixed(1)} cm` }; } },
      ] },
    };
  })(),

  cardio_treadmill: (() => {
    // KOŞU BANDINDA TEMPOLU YÜRÜYÜŞ (ACSM / ACE; yürüme analizi: Perry & Burnfield). Kişi bandın ortasında yerinde kalır, BANT
    // geriye akar: basan ayak bantla birlikte TAM bant hızında geriye kayar, salınan ayak öne gelir. Bir adım döngüsü: topuk
    // vuruşu (taban 14° yukarı) → taban düz → topuk kalkar, parmak kökünden itiş (−38°) → salınım. Duruş evresi döngünün %62'si
    // (yürüyüşte iki ayak bir süre birlikte yerde, havada kalma yok). Kalça çift destekte en alçak, tek destekte en yüksek
    // (±2 cm). Kollar bacaklarla TERS fazda sallanır; eller korkuluğa tutunmaz (iyi teknik: ağırlığı korkuluğa verme).
    const D = 20, TUR = 2, ADIM = 120, DUTY = 0.62, F1 = 0.08, F2 = 0.45, P_TOPUK = 14, P_ITIS = -38;
    const X_TOPUK = 31, KALCA_Y = D + 89.6, SALINIM = 2, KALDIR = 10, AZ = KALCA_YAN - 1;
    const duzX = f => X_TOPUK - ADIM * f;                                   // taban düz basıyormuş gibi bilek x (bant hızında)
    const ayak = f => {                                                      // tek bacağın döngüsü (f ∈ [0, 1)) → bilek, eğim
      f = dongu01(f);
      if (f < F1) { const p = P_TOPUK * (1 - f / F1), h0 = topukVek(0), h = topukVek(p);   // topuk vuruşu: topuk bantta, eğim açılır
        return { a: [duzX(f) + h0[0] - h[0], D - h[1]], p }; }
      if (f < F2) return { a: [duzX(f), D + AYAK_Y], p: 0 };
      if (f < DUTY) { const k = (f - F2) / (DUTY - F2), p = P_ITIS * k * k, u0 = ayakVek(0), u = ayakVek(p);   // itiş: parmak kökü bantta
        return { a: [duzX(f) + u0[0] - u[0], D + TOP_Y - u[1]], p }; }
      const s = (f - DUTY) / (1 - DUTY), b = ayak(DUTY - 1e-9), e = ayak(0), es = ease(s);   // salınım: öne, yukarı yay
      return { a: [ara(b.a[0], e.a[0], es), ara(b.a[1], e.a[1], s) + KALDIR * Math.sin(Math.PI * s)], p: ara(P_ITIS, P_TOPUK, es) };
    };
    const faz = (t, i) => dongu01(TUR * t + (i > 0 ? 0 : 0.5));            // sağ (A) t = 0'da topuk vuruşunda, sol yarım döngü geride
    const kalca = t => { const f = TUR * t; return [0, KALCA_Y - SALINIM * Math.cos(4 * Math.PI * (f - 0.06)), 1.5 * Math.sin(2 * Math.PI * (f - 0.06))]; };
    const tabanY = BANT_TABANI;
    // yürüyüş EMG'si (f = o bacağın evresi, 0 = topuk vuruşu): kalça ve uyluk ön yük alırken (erken duruş), arka bacak salınım
    // sonunda bacağı frenlerken ve topuk vuruşunda, baldır itişte (orta–geç duruş); salınımda bacak gevşer
    const kasAktif = t => iki(i => { const f = faz(t, i); return { kalca: pencere(f, 0.95, 0.3), kuadriseps: pencere(f, 0.92, 0.25), arkaBacak: pencere(f, 0.78, 0.14), baldir: pencere(f, 0.15, 0.6) }; });
    return {
      ad: 'Treadmill Walk', kasAktif, dongu: true, kamera: [40, 12], seritKameralar: [[0, 0], [40, 12], [90, 6]], merkez: [0, 0, 0],
      seritAnlar: [[0, 'sağ topuk'], [0.125, 'tek destek'], [0.25, 'sol topuk']],
      poz: t => ({ ...AYAKTA(kalca(t), [0, 87]), zeminY: D, ayakA: [0, ayak(faz(t, 1)).p], ayakB: [0, ayak(faz(t, -1)).p] }),
      uclar: t => s => {
        const fA = faz(t, 1), aA = ayak(fA).a, aB = ayak(faz(t, -1)).a, ileri = Math.cos(2 * Math.PI * fA);   // sağ bacak önde → sol kol önde
        return { A: kolSalinimi(s.omA, 1, -ileri), B: kolSalinimi(s.omB, -1, ileri),
          ayakA: { hedef: [aA[0], aA[1], AZ], kutup: [1, 0, 0.1] }, ayakB: { hedef: [aB[0], aB[1], -AZ], kutup: [1, 0, -0.1] } };
      },
      ekipman: (pr, s, t) => kosuBandi(pr, TUR * ADIM * t),
      izlenen: 'aA',
      kisit: { sirayla: true, dizYonu: [1, 0, 0], govde: { aralik: [85, 89], oynama: 1 },
        ozel: [
          kardiyoKurali('basan ayak bantla TAM bant hızında geriye kayar (düz basışta)', ks => {
            let en = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const f = faz(s.t, i); if (f < F1 + 0.01 || f > F2 - 0.01) continue;
              en = Math.max(en, Math.abs(s[`a${y}`][0] - duzX(f)), Math.abs(s[`a${y}`][1] - (D + AYAK_Y))); }
            return { gecti: en <= 0.3, olcum: `en çok sapma ${en.toFixed(2)} cm` }; }),
          kardiyoKurali('her an en az bir ayak bantta (yürüyüş — havada kalma yok)', ks => {
            const m = Math.max(...ks.map(s => Math.min(...['A', 'B'].map(y => { const n = tabanY(s, y); return Math.min(n.u[1] - TOP_Y, n.h[1]) - D; }))));
            return { gecti: m <= 1, olcum: `en yüksek "en alçak taban" ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('taban bandın içine girmiyor, salınan ayak sürtmüyor', ks => {
            const m = Math.min(...ks.flatMap(s => ['A', 'B'].map(y => { const n = tabanY(s, y); return Math.min(n.u[1] - TOP_Y, n.h[1]) - D; })));
            return { gecti: m >= -0.8, olcum: `banda göre en alçak ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('eller korkuluğa tutunmuyor (≥ 5 cm)', ks => { const m = Math.min(...ks.flatMap(s => [s.eA, s.eB].map(korkulukMesafe))); return { gecti: m >= 5, olcum: `en yakın ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('kollar bacaklarla ters fazda (sağ topuk vururken sol el önde)', ks => { const s = ks[0]; return { gecti: s.eB[0] - s.eA[0] >= 10, olcum: `sol el sağdan ${(s.eB[0] - s.eA[0]).toFixed(1)} cm önde` }; }),
          kardiyoKurali('kalça yukarı-aşağı 3–5 cm oynar', ks => { const y = ks.map(s => s.P[1]), d = Math.max(...y) - Math.min(...y); return { gecti: d >= 3 && d <= 5, olcum: `${d.toFixed(1)} cm` }; }),
          kardiyoKurali('basan bacakta diz neredeyse düz (≤ 35°), salınımda ≤ 75°', ks => {
            let du = 0, sa = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const k = 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]); if (faz(s.t, i) < DUTY) du = Math.max(du, k); else sa = Math.max(sa, k); }
            return { gecti: du <= 35 && sa <= 75, olcum: `duruş ${du.toFixed(0)}° · salınım ${sa.toFixed(0)}°` }; }),
        ] },
    };
  })(),

  cardio_treadmill_run: (() => {
    // KOŞU BANDINDA KOŞU (hafif tempo, ~8 km/sa; koşu biyomekaniği: Novacheck 1998, Dicharry 2010). Yürüyüşten farkı: duruş
    // evresi döngünün yalnız %36'sı → iki kez HAVADA KALMA evresi (her biri ~%14); iki ayak hiçbir an birlikte yerde değil.
    // Ayak gövdenin hemen önüne, ORTA TABANLA (hafif topuk önde, 6°) basar; basan dizi ~15° bükük, yükü alırken ~45°'ye
    // kadar esner; parmak kökünden itiş (−40°). Salınımda topuk kalçaya doğru katlanır (diz ~110°), sonra diz öne sürülür.
    // Kalça duruşun ortasında en alçak, havada en yüksek (~6 cm). Gövde ~5° öne; kollar dirsekten ~90° bükük, bacaklarla
    // ters fazda omuzdan sallanır; eller korkuluğa tutunmaz. Adım sıklığı ~160/dk (3 s'de 4 tam döngü), hız ~8 km/sa.
    const D = BANT_D, TUR = 4, ADIM = 165, DUTY = 0.36, F1 = 0.04, F2 = 0.2, P_BAS = 6, P_ITIS = -40;
    const X_BAS = 17, KALCA_Y = 108, SALINIM = 3, KALDIR = 30, AZ = KALCA_YAN - 1;
    const duzX = f => X_BAS - ADIM * f;
    const ayak = f => {
      f = dongu01(f);
      if (f < F1) { const p = P_BAS * (1 - f / F1), h0 = topukVek(0), h = topukVek(p);   // basış: topuk önde bantta, taban düzlenir
        return { a: [duzX(f) + h0[0] - h[0], D - h[1]], p }; }
      if (f < F2) return { a: [duzX(f), D + AYAK_Y], p: 0 };
      if (f < DUTY) { const k = (f - F2) / (DUTY - F2), p = P_ITIS * k * k, u0 = ayakVek(0), u = ayakVek(p);   // itiş: parmak kökü bantta
        return { a: [duzX(f) + u0[0] - u[0], D + TOP_Y - u[1]], p }; }
      // salınım: topuk önce kalçaya doğru katlanır (ayak geride kalır), sonra diz öne sürülür ve ayak basışa iner. Konum ve
      // HIZ iki uçta da duruşla eşleşir (Hermite: itişten çıkış hızıyla kalkar, bant hızında basar — ayak sıçramaz)
      const s = (f - DUTY) / (1 - DUTY), b = ayak(DUTY - 1e-9), e = ayak(0), v0 = HIZ_CIKIS, v1 = HIZ_BASIS, T = 1 - DUTY;
      const h = (y0, m0, y1, m1) => { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * y0 + (s3 - 2 * s2 + s) * m0 * T + (-2 * s3 + 3 * s2) * y1 + (s3 - s2) * m1 * T; };
      return { a: [h(b.a[0], v0[0], e.a[0], v1[0]), h(b.a[1], v0[1], e.a[1], v1[1]) + KALDIR * TEPE * Math.pow(s, 1.6) * Math.pow(1 - s, 2.4)],
        p: h(P_ITIS, v0[2], P_BAS, v1[2]) };
    };
    // duruşun iki ucundaki hız (cm ve ° / evre): itişin sonu ve basışın başı — salınım bunlarla eşleşir
    const turev = (f, e = 1e-5) => { const x = ayak(f + e), y = ayak(f - e); return [(x.a[0] - y.a[0]) / (2 * e), (x.a[1] - y.a[1]) / (2 * e), (x.p - y.p) / (2 * e)]; };
    const HIZ_CIKIS = turev(DUTY - 2e-5), HIZ_BASIS = turev(2e-5), TEPE = 1 / (Math.pow(0.4, 1.6) * Math.pow(0.6, 2.4));
    const faz = (t, i) => dongu01(TUR * t + (i > 0 ? 0 : 0.5));
    const kalca = t => { const f = TUR * t; return [0, KALCA_Y + SALINIM * Math.cos(4 * Math.PI * (f - 0.43)), 1 * Math.sin(2 * Math.PI * (f - 0.1))]; };
    const tabanY = BANT_TABANI, yerde = (s, y) => { const n = tabanY(s, y); return Math.min(n.u[1] - TOP_Y, n.h[1]) - D <= 0.5; };
    // koşu EMG'si (f = o bacağın evresi, 0 = basış; Novacheck 1998): kalça (büyük kalça kası) ve uyluk ön basıştan önce
    // gerilir ve yükü alırken (erken duruş) çalışır; arka bacak salınımın sonunda bacağı frenler; baldır duruş boyunca (itiş)
    const kasAktif = t => iki(i => { const f = faz(t, i); return { kalca: pencere(f, 0.88, 0.22), kuadriseps: pencere(f, 0.9, 0.22), arkaBacak: pencere(f, 0.68, 0.08), baldir: pencere(f, 0.0, 0.36) }; });
    return {
      ad: 'Treadmill Run', kasAktif, dongu: true, kamera: [40, 12], seritKameralar: [[0, 0], [40, 12], [90, 6]], merkez: [0, 0, 0],
      seritAnlar: [[0, 'sağ basış'], [0.107, 'havada'], [0.125, 'sol basış']],
      poz: t => ({ ...AYAKTA(kalca(t), [0, 85]), zeminY: D, ayakA: [0, ayak(faz(t, 1)).p], ayakB: [0, ayak(faz(t, -1)).p] }),
      uclar: t => s => {
        const fA = faz(t, 1), ileri = Math.cos(2 * Math.PI * (fA - 0.04));   // sağ bacak önde → sol kol önde
        const aA = [...ayak(fA).a, AZ], aB = [...ayak(faz(t, -1)).a, -AZ];
        return { A: kosuKolu(s.omA, 1, -ileri), B: kosuKolu(s.omB, -1, ileri),
          ayakA: { hedef: aA, kutup: [1, 0, 0.1] }, ayakB: { hedef: aB, kutup: [1, 0, -0.1] } };
      },
      ekipman: (pr, s, t) => kosuBandi(pr, TUR * ADIM * t),
      izlenen: 'aA',
      kisit: { sirayla: true, dizYonu: [1, 0, 0], govde: { aralik: [82, 88], oynama: 1 },
        ozel: [
          kardiyoKurali('basan ayak bantla TAM bant hızında geriye kayar (düz basışta)', ks => {
            let en = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const f = faz(s.t, i); if (f < F1 + 0.01 || f > F2 - 0.01) continue;
              en = Math.max(en, Math.abs(s[`a${y}`][0] - duzX(f)), Math.abs(s[`a${y}`][1] - (D + AYAK_Y))); }
            return { gecti: en <= 0.3, olcum: `en çok sapma ${en.toFixed(2)} cm` }; }),
          kardiyoKurali('havada kalma evresi var (döngünün %15–40\'ı) ve iki ayak hiç birlikte yerde değil', ks => {
            const h = ks.filter(s => !yerde(s, 'A') && !yerde(s, 'B')).length / ks.length, iki = ks.filter(s => yerde(s, 'A') && yerde(s, 'B')).length;
            return { gecti: h >= 0.15 && h <= 0.4 && iki === 0, olcum: `havada %${(100 * h).toFixed(0)} · iki ayak yerde ${iki} an` }; }),
          kardiyoKurali('taban bandın içine girmiyor', ks => {
            const m = Math.min(...ks.flatMap(s => ['A', 'B'].map(y => { const n = tabanY(s, y); return Math.min(n.u[1] - TOP_Y, n.h[1]) - D; })));
            return { gecti: m >= -0.8, olcum: `banda göre en alçak ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('ayak gövdenin hemen önüne basar (bilek kalçanın ≤ 25 cm önünde)', ks => {
            let m = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) if (faz(s.t, i) < 0.01) m = Math.max(m, s[`a${y}`][0] - s[`ka${y}`][0]);
            return { gecti: m <= 25, olcum: `basışta ${m.toFixed(1)} cm önde` }; }),
          kardiyoKurali('eller korkuluğa tutunmuyor (≥ 5 cm)', ks => { const m = Math.min(...ks.flatMap(s => [s.eA, s.eB].map(korkulukMesafe))); return { gecti: m >= 5, olcum: `en yakın ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('kollar bacaklarla ters fazda (sağ basarken sol el önde)', ks => { const s = ks[0]; return { gecti: s.eB[0] - s.eA[0] >= 15, olcum: `sol el sağdan ${(s.eB[0] - s.eA[0]).toFixed(1)} cm önde` }; }),
          kardiyoKurali('dirsekler ~90° bükük (75–105°)', ks => {
            const d = ks.flatMap(s => ['A', 'B'].map(y => 180 - aciOf(s[`om${y}`], s[`d${y}`], s[`e${y}`])));
            return { gecti: Math.min(...d) >= 75 && Math.max(...d) <= 105, olcum: `${Math.min(...d).toFixed(0)}–${Math.max(...d).toFixed(0)}°` }; }),
          kardiyoKurali('kalça yukarı-aşağı 5–9 cm oynar (havada en yüksek)', ks => { const y = ks.map(s => s.P[1]), d = Math.max(...y) - Math.min(...y); return { gecti: d >= 5 && d <= 9, olcum: `${d.toFixed(1)} cm` }; }),
          kardiyoKurali('basan diz bükük ve esner (en az ≥ 8°, en çok 35–55°), salınımda topuk katlanır (90–125°)', ks => {
            let dmin = 999, dmax = 0, sa = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const k = 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]);
              if (faz(s.t, i) < DUTY) { dmin = Math.min(dmin, k); dmax = Math.max(dmax, k); } else sa = Math.max(sa, k); }
            return { gecti: dmin >= 8 && dmax >= 35 && dmax <= 55 && sa >= 90 && sa <= 125, olcum: `duruş ${dmin.toFixed(0)}–${dmax.toFixed(0)}° · salınım ${sa.toFixed(0)}°` }; }),
        ] },
    };
  })(),

  cardio_bike: (() => {
    // SABİT BİSİKLET (dik oturuşlu; ACSM / bisiklet uyum kılavuzları: Burt "Bike Fit", Holmes yöntemi). Sele yüksekliği
    // ÇÖZÜLDÜ: pedal en alttayken diz ~30° bükük (önerilen 25–35°); sele ileri-geri ayarı KOPS — pedal kolu önde (saat 3)
    // iken diz pedal milinin üstünde. Ayağın tabanı (parmak kökü) pedal milinin üstünde, ayak bileği hafif oynar ("ankling":
    // aşağı itişte taban düze yakın, altta parmak hafif aşağı). Kalça selede SABİT (sallanmaz), gövde ~18° öne, kollar hafif
    // bükük gidonda. Pedal turu 3 s'de 3 tur = 60 dev/dk (orta tempo).
    const BB = [0, 28, 0], KOL = 17, PED = 2.2, TUR = 3, PZ = 13, AZ = 13, KZ = 7;   // pedal merkezi ±13 (Q faktörü), krank kolu ±7: ayağın içinde kalır
    const P = [-18, 107.5, 0], SELE = P[1] - R.kalca, G = [0, 72];
    const GIDON = (() => { const s = M.an({ a: { ...OTURUR(P, G) } }, 0), dz = OMUZ.yan + 4.5 - OMUZ.yan, d = ERISIM * 0.985, dx = 45;   // dirsek ~20° bükük
      return [s.omA[0] + dx, s.omA[1] - Math.sqrt(d * d - dx * dx - dz * dz), OMUZ.yan + 4.5]; })();
    const aci = (t, i) => Math.PI / 2 - 2 * Math.PI * TUR * t + (i > 0 ? 0 : Math.PI);   // ileri pedal: önde aşağı, altta geri
    const pedal = (t, i) => { const q = aci(t, i); return [BB[0] + KOL * Math.cos(q), BB[1] + KOL * Math.sin(q), i * PZ]; };
    const egim = (t, i) => -18 + 9 * Math.sin(aci(t, i));                    // ankling: üstte −9°, altta −27°
    const tabanN = p => [-Math.sin(rd(p)), Math.cos(rd(p)), 0];
    const parmakKoku = (t, i) => ekle(pedal(t, i), tabanN(egim(t, i)), PED + TOP_Y);
    const bilekNok = (t, i) => { const u = parmakKoku(t, i), v = ayakVek(egim(t, i)); return [u[0] - v[0], u[1] - v[1], i * AZ]; };
    const dizAci = (s, y) => 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]);
    const poz = t => ({ ...OTURUR(P, G), ayakA: [0, egim(t, 1)], ayakB: [0, egim(t, -1)] });
    // pedal EMG'si (c = pedal kolunun üst ölü noktadan açısı / 360°): uyluk ön ve kalça aşağı itişte (−30…135°), arka bacak ve
    // baldır itişin sonu ile altta (45…225°); yukarı çıkışta kaslar gevşer
    const kasAktif = t => iki(i => { const c = dongu01((Math.PI / 2 - aci(t, i)) / (2 * Math.PI));
      return { kuadriseps: pencere(c, 0.92, 0.37), kalca: pencere(c, 0, 0.38), arkaBacak: pencere(c, 0.15, 0.62), baldir: pencere(c, 0.12, 0.58) }; });
    const uclar = t => () => ({
      A: { hedef: [GIDON[0], GIDON[1], GIDON[2]], kutup: [-0.3, -1, 0.6], ...tut(Z, 1.6, 'onKolArka') },
      B: { hedef: [GIDON[0], GIDON[1], -GIDON[2]], kutup: [-0.3, -1, -0.6], ...tut(Z, 1.6, 'onKolArka') },
      ayakA: { hedef: bilekNok(t, 1), kutup: [1, 0.5, 0.05] }, ayakB: { hedef: bilekNok(t, -1), kutup: [1, 0.5, -0.05] } });
    return {
      ad: 'Stationary Bike', dongu: true, kasAktif, logolar: silindirLogolari([26, 42, 0], 6, 28), kamera: [35, 14], seritKameralar: [[0, 0], [35, 14], [90, 6]], merkez: [5, 0, 0],
      poz, uclar,
      ekipman(pr, s, t) {
        const koyu = { ust: '#30363d', yan: '#22272d' }, ped = { ust: '#5d646d', yan: '#3b4148' };
        const o = [...M.kutu(pr, [-44, -34], [0, 5], [-26, 26], KULE.govde), ...M.kutu(pr, [48, 58], [0, 5], [-26, 26], KULE.govde),   // ayaklar
          M.kapsul(pr, [-39, 5, 0], [53, 5, 0], 3, METAL),                                                  // taban kirişi
          M.kapsul(pr, [-36, 5, 0], [-10, 62, 0], 3.6, METAL),                                              // arka gövde borusu
          M.kapsul(pr, [-10, 62, 0], [P[0] - 3, SELE - 3, 0], 2.4, '#8a929c'),                              // sele borusu (ayarlı)
          ...M.gizle3B(M.kutu(pr, [P[0] - 12, P[0] + 4], [SELE - 3, SELE], [-11, 11], PED)), ...M.gizle3B(M.kutu(pr, [P[0] + 4, P[0] + 16], [SELE - 2.6, SELE - 0.4], [-3, 3], PED)),   // sele + burnu
          M.yastik3B([P[0] - 4, SELE - 1.5, 0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [16, 3, 22], { r: 6, pah: 1.2, malzeme: 'deri', renk: PED.ust }),   // 2. tur: deri, yuvarlak
          M.yastik3B([P[0] + 10, SELE - 1.5, 0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [12, 2.2, 6], { r: 2.9, pah: 1, malzeme: 'deri', renk: PED.ust }),
          M.silindirParca(pr, [26, 42, 0], Z, 25, 12, '#2a2f35'),                                           // volan kapağı
          M.kapsul(pr, [-10, 62, 0], [20, 40, 0], 3.6, METAL), M.kapsul(pr, [40, 5, 0], [26, 30, 0], 3.6, METAL),   // gövde → volan
          M.kapsul(pr, [30, 58, 0], [GIDON[0] - 2, GIDON[1] - 4, 0], 3.4, METAL),                           // gidon direği
          M.kapsul(pr, [GIDON[0], GIDON[1], -GIDON[2] - 5], [GIDON[0], GIDON[1], GIDON[2] + 5], 1.6, '#8a929c'),   // gidon (tutamak)
          M.kapsul(pr, [GIDON[0] - 2, GIDON[1] - 4, 0], [GIDON[0], GIDON[1], 0], 2.6, METAL),
          ...ekranPaneli(pr, [GIDON[0] + 4, GIDON[1] + 13, 0], 30, [24, 14, 4]),   // ekran (kişiye dönük)
          M.kapsul(pr, [GIDON[0] + 1, GIDON[1], 0], [GIDON[0] + 4, GIDON[1] + 8, 0], 1.6, METAL),
          M.kapsul(pr, [BB[0], BB[1], -KZ], [BB[0], BB[1], KZ], 2.2, METAL)];                               // orta göbek
        for (const i of [1, -1]) {
          const p = pedal(t, i), e = egim(t, i), u = [Math.cos(rd(e)), Math.sin(rd(e)), 0], n = tabanN(e);
          o.push(M.kapsul(pr, [BB[0], BB[1], i * KZ], [p[0], p[1], i * KZ], 1.6, '#8a929c'),                // pedal kolu
            M.kapsul(pr, [p[0], p[1], i * KZ], [p[0], p[1], i * (PZ - 5)], 0.8, METAL),                     // pedal mili (pedalın iç kenarına)
            ...M.kutuY(pr, [p[0], p[1], i * PZ], [u, n, [0, 0, 1]], [11, 2 * PED, 10], ped));               // pedal (taban eğimiyle)
        }
        return o;
      },
      izlenen: 'aA',
      kisit: { sirayla: true, dizYonu: [1, 0.5, 0], govde: { aralik: [70, 74], oynama: 0.5 }, temas: [kalcaOturakta(SELE)],
        ozel: [
          kardiyoKurali('parmak kökü pedal milinin üstünde (her karede)', ks => { const m = Math.max(...ks.flatMap(s => [['A', 1], ['B', -1]].map(([y, i]) => {
            const u = parmakKoku(s.t, i); return Math.hypot(s[`u${y}`][0] - u[0], s[`u${y}`][1] - u[1]); }))); return { gecti: m <= 0.3, olcum: `en çok ${m.toFixed(2)} cm` }; }),
          kardiyoKurali('pedal kolları karşılıklı (180°), boyları sabit', ks => { const m = Math.max(...ks.map(s => { const a = pedal(s.t, 1), b = pedal(s.t, -1);
            return Math.abs(mesafe([a[0], a[1], 0], [b[0], b[1], 0]) - 2 * KOL); })); return { gecti: m <= 0.01, olcum: `sapma ${m.toFixed(3)}` }; }),
          kardiyoKurali('sele yüksekliği doğru: pedal en altta diz 25–35° bükük', ks => { const m = Math.min(...ks.flatMap(s => [dizAci(s, 'A'), dizAci(s, 'B')])); return { gecti: m >= 25 && m <= 35, olcum: `${m.toFixed(1)}°` }; }),
          kardiyoKurali('pedal en üstte diz ≤ 115°', ks => { const m = Math.max(...ks.flatMap(s => [dizAci(s, 'A'), dizAci(s, 'B')])); return { gecti: m <= 115, olcum: `${m.toFixed(1)}°` }; }),
          kardiyoKurali('pedal kolu önde (saat 3) iken diz pedal milinin üstünde (±3 cm)', () => { const s = M.an({ poz, uclar }, 1 / (4 * TUR)), d = s.zA[0] - pedal(1 / (4 * TUR), 1)[0]; return { gecti: Math.abs(d) <= 3, olcum: `diz pedal milinden ${d.toFixed(1)} cm` }; }),
          kardiyoKurali('dizler yana açılmıyor (diz ayakla aynı hizada, ≤ 3 cm)', ks => { const m = Math.max(...ks.flatMap(s => ['A', 'B'].map(y => Math.abs(s[`z${y}`][2] - s[`a${y}`][2])))); return { gecti: m <= 3, olcum: `en çok ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('eller gidonda sabit', ks => { const m = Math.max(...ks.map(s => Math.max(mesafe(s.eA, GIDON), mesafe(s.eB, [GIDON[0], GIDON[1], -GIDON[2]])))); return { gecti: m <= 0.3, olcum: `kayma ${m.toFixed(2)}` }; }),
        ] },
    };
  })(),

  cardio_elliptical: (() => {
    // ELİPTİK (arka volanlı; ACE / üretici kılavuzları). Ayaklar pedalda SABİT (topuk kalkmaz, çarpma yok), pedal gerçek bir
    // BAĞLANTIDAN çözülür: pedal rayının arka ucu volan krankında (daire), ön ucu sallanan kolun alt ucunda (pivot etrafında
    // yay); rayın sabit boyu kolun açısını belirler. Kolun üst ucu tutamaktır → sağ ayak öne giderken sağ tutamak GERİ
    // gelir (yürüyüşteki gibi çapraz). Pedal üstte öne, altta geriye gider; adım ~40 cm, iniş-çıkış ~18 cm. Gövde dik,
    // kalça ayakların ortalama yüksekliğini yarı oranda izler. Pedal raya göre hafif döner (eğim rayın %60'ı).
    const TUR = 3, CR = [-55, 30], RC = 20, PV = [35, 105], LD = 67, LR = 90, LAM = 0.55, LU = 30, UST = 4.5, RZ = 12, KZ = 22, TZ = 27;
    const HX = -3, HY = 116.5;
    const bag = q => {                                                       // krank açısı → ray, kol, pedal, tutamak (sagital)
      const K = [CR[0] + RC * Math.cos(q), CR[1] + RC * Math.sin(q)];
      let ps = 0.05; for (let i = 0; i < 30; i++) {                          // |PV + LD(sin ψ, −cos ψ) − K| = LR (Newton)
        const f = p => Math.hypot(PV[0] + LD * Math.sin(p) - K[0], PV[1] - LD * Math.cos(p) - K[1]) - LR, d = f(ps);
        ps -= d / ((f(ps + 1e-6) - d) / 1e-6); }
      const F = [PV[0] + LD * Math.sin(ps), PV[1] - LD * Math.cos(ps)], r = [(F[0] - K[0]) / LR, (F[1] - K[1]) / LR], n = [-r[1], r[0]];
      const p = 0.6 * Math.atan2(r[1], r[0]) * 180 / Math.PI, pu = [Math.cos(rd(p)), Math.sin(rd(p))], pn = [-pu[1], pu[0]];
      const Q = [K[0] + LAM * (F[0] - K[0]) + n[0] * UST, K[1] + LAM * (F[1] - K[1]) + n[1] * UST];   // pedal üst yüzü (merkez)
      const u = [Q[0] + pu[0] * 4 + pn[0] * TOP_Y, Q[1] + pu[1] * 4 + pn[1] * TOP_Y], v = ayakVek(p);
      return { K, F, ps, Q, p, pu, pn, a: [u[0] - v[0], u[1] - v[1]], G: [PV[0] - LU * Math.sin(ps), PV[1] + LU * Math.cos(ps)] };
    };
    const aci = (t, i) => Math.PI / 2 - 2 * Math.PI * TUR * t + (i > 0 ? 0 : Math.PI);   // üstte öne, altta geriye
    const ORT_Y = (() => { let s = 0; for (let k = 0; k < 72; k++) s += bag(k / 72 * 2 * Math.PI).a[1]; return s / 72; })();
    const kalcaY = t => HY + 0.5 * ((bag(aci(t, 1)).a[1] + bag(aci(t, -1)).a[1]) / 2 - ORT_Y);
    const tutamak = (t, i) => { const b = bag(aci(t, i)); return [b.G[0], b.G[1], i * TZ]; };
    const tutEksen = (t, i) => birim(fark(tutamak(t, i), [PV[0], PV[1], i * KZ]));
    const poz = t => ({ ...AYAKTA([HX, kalcaY(t), 0], [0, 87]), ayakA: [0, bag(aci(t, 1)).p], ayakB: [0, bag(aci(t, -1)).p] });
    const uclar = t => () => { const a = bag(aci(t, 1)).a, b = bag(aci(t, -1)).a;
      return { A: { hedef: tutamak(t, 1), kutup: [-0.4, -1, 0.5], ...tut(tutEksen(t, 1), 1.8, 'ic') }, B: { hedef: tutamak(t, -1), kutup: [-0.4, -1, -0.5], ...tut(tutEksen(t, -1), 1.8, 'ic') },
        ayakA: { hedef: [a[0], a[1], RZ - 1], kutup: [1, 0.2, 0.05] }, ayakB: { hedef: [b[0], b[1], -(RZ - 1)], kutup: [1, 0.2, -0.05] } }; };
    const dizAci = (s, y) => 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]);
    // c = pedalın evresi (0 üstte, 0,25 önde, 0,5 altta): ayak altta GERİYE itilirken bacak çalışır (uyluk ön önce, kalça ve arka
    // bacak itiş boyunca, baldır sonda); aynı taraftaki tutamak o sırada İLERİ itilir (triceps), ayak öne dönerken geri çekilir (biceps)
    const kasAktif = t => iki(i => { const c = dongu01((Math.PI / 2 - aci(t, i)) / (2 * Math.PI));
      return { kuadriseps: pencere(c, 0.15, 0.55), kalca: pencere(c, 0.25, 0.72), arkaBacak: pencere(c, 0.35, 0.8), baldir: pencere(c, 0.5, 0.85),
        triceps: pencere(c, 0.25, 0.75), biceps: pencere(c, 0.75, 0.25) }; });
    return {
      ad: 'Elliptical', kasAktif, dongu: true, kamera: [35, 14], seritKameralar: [[0, 0], [35, 14], [90, 6]], merkez: [-8, 0, 0],
      poz, uclar,
      ekipman(pr, s, t) {
        const ped = { ust: '#4a525c', yan: '#30363d' };
        const o = [M.kapsul(pr, [-80, 4, 0], [48, 4, 0], 3.5, METAL),                                          // taban kirişi
          ...M.kutu(pr, [-84, -74], [0, 6], [-28, 28], KULE.govde), ...M.kutu(pr, [42, 52], [0, 6], [-28, 28], KULE.govde),   // ayaklar
          M.silindirParca(pr, [CR[0], CR[1], 0], Z, 27, 16, '#2a2f35'),                                     // arka volan kapağı
          M.kapsul(pr, [CR[0], 4, 0], [CR[0], CR[1], 0], 4, METAL),
          M.kapsul(pr, [46, 5, 0], [PV[0] + 3, PV[1], 0], 4, METAL), M.kapsul(pr, [PV[0] + 3, PV[1], 0], [PV[0] + 8, 126, 0], 3.4, METAL),   // ön kolon
          M.kapsul(pr, [PV[0], PV[1], -KZ - 3], [PV[0], PV[1], KZ + 3], 2.4, METAL),                         // kol pivotu
          ...ekranPaneli(pr, [PV[0] + 9, 133, 0], 30, [30, 16, 5])];   // ekran (kişiye dönük)
        for (const i of [1, -1]) {
          const b = bag(aci(t, i)), K = [b.K[0], b.K[1], i * RZ], F = [b.F[0], b.F[1], i * RZ];
          o.push(M.kapsul(pr, [CR[0], CR[1], i * 9], [b.K[0], b.K[1], i * 9], 2, '#8a929c'),                // krank kolu
            M.kapsul(pr, [b.K[0], b.K[1], i * 9], K, 1.4, METAL),
            M.kapsul(pr, K, F, 2.2, '#8a929c'),                                                              // pedal rayı
            M.kapsul(pr, F, [b.F[0], b.F[1], i * KZ], 1.4, METAL),                                           // ray → kol bağlantısı
            M.kapsul(pr, [PV[0], PV[1], i * KZ], [b.F[0], b.F[1], i * KZ], 2.4, METAL),                      // sallanan kolun alt ucu
            M.kapsul(pr, [PV[0], PV[1], i * KZ], tutamak(t, i), 1.8, '#8a929c'),                             // tutamak
            ...M.kutuY(pr, [b.Q[0] - b.pn[0] * 1.5, b.Q[1] - b.pn[1] * 1.5, i * RZ], [[b.pu[0], b.pu[1], 0], [b.pn[0], b.pn[1], 0], [0, 0, 1]], [36, 3, 14], ped));   // pedal
        }
        return o;
      },
      izlenen: 'aA',
      kisit: { sirayla: true, dizYonu: [1, 0.2, 0], govde: { aralik: [86, 88], oynama: 0.5 },
        ozel: [
          kardiyoKurali('ayak pedalda sabit (topuk kalkmıyor)', ks => { const m = Math.max(...ks.flatMap(s => [['A', 1], ['B', -1]].map(([y, i]) => { const b = bag(aci(s.t, i));
            const n = tabanNoktalari(s[`a${y}`], Math.asin(Math.max(-1, Math.min(1, s[`tab${y}`][1]))) * 180 / Math.PI);   // iskeletin GERÇEK taban eğimi (veri değil)
            return Math.max(Math.abs(nokta(fark([...n.h, 0], [...b.Q, 0]), [...b.pn, 0])), Math.abs(nokta(fark([...n.u, 0], [...b.Q, 0]), [...b.pn, 0]) - TOP_Y)); })));
            return { gecti: m <= 0.5, olcum: `taban pedaldan en çok ${m.toFixed(2)} cm` }; }),
          kardiyoKurali('pedal rayı boyu sabit (bağlantı tutarlı)', ks => { const m = Math.max(...ks.map(s => { const b = bag(aci(s.t, 1)); return Math.abs(Math.hypot(b.F[0] - b.K[0], b.F[1] - b.K[1]) - LR); })); return { gecti: m <= 0.05, olcum: `sapma ${m.toFixed(3)}` }; }),
          kardiyoKurali('adım boyu 35–50 cm, iniş-çıkış 12–22 cm', ks => { const x = ks.map(s => bag(aci(s.t, 1)).Q[0]), y = ks.map(s => bag(aci(s.t, 1)).Q[1]);
            const dx = Math.max(...x) - Math.min(...x), dy = Math.max(...y) - Math.min(...y); return { gecti: dx >= 35 && dx <= 50 && dy >= 12 && dy <= 22, olcum: `adım ${dx.toFixed(1)} · iniş-çıkış ${dy.toFixed(1)}` }; }),
          kardiyoKurali('kol bacakla çapraz: sağ ayak en öndeyken sağ tutamak en geride', ks => { let en = -Infinity, s0 = null; for (const s of ks) if (s.aA[0] > en) { en = s.aA[0]; s0 = s; }
            const g = ks.map(s => s.eA[0]), m = Math.min(...g); return { gecti: s0.eA[0] - m <= 2, olcum: `sağ el en gerinin ${(s0.eA[0] - m).toFixed(1)} cm önünde` }; }),
          kardiyoKurali('diz hiç kilitlenmiyor (≥ 10°), en çok 95°', ks => { const v = ks.flatMap(s => [dizAci(s, 'A'), dizAci(s, 'B')]); return { gecti: Math.min(...v) >= 10 && Math.max(...v) <= 95, olcum: `${Math.min(...v).toFixed(0)}° … ${Math.max(...v).toFixed(0)}°` }; }),
          kardiyoKurali('eller tutamakta (kavrama)', ks => { const m = Math.max(...ks.map(s => Math.max(mesafe(s.eA, tutamak(s.t, 1)), mesafe(s.eB, tutamak(s.t, -1))))); return { gecti: m <= 0.3, olcum: `en çok ${m.toFixed(2)} cm` }; }),
        ] },
    };
  })(),

  cardio_rower: (() => {
    // KÜREK MAKİNESİ (Concept2 teknik kılavuzu; British Rowing). Bir çekiş: GİRİŞ (catch: kaval dik, gövde ~26° öne, kollar
    // düz) → ÇEKİŞ sırası BACAK → GÖVDE → KOL (bacaklar iter, sonra gövde ~20° geriye, en son eller alt kaburgaya) →
    // DÖNÜŞ tersine: KOL → GÖVDE → BACAK (eller dizleri GEÇMEDEN dizler bükülmez). Çekiş:dönüş ≈ 1:2; 3 s'de bir çekiş
    // = 20 çekiş/dk (sakin tempo). Sele 36 cm, sabit rayda kayar. Ayak parmak kökü pedala bağlı (kayışlı); girişte ayak
    // bileği yeterince bükülemediği için TOPUK HAFİF KALKAR (gerçekte de öyle), bitişte taban pedalda düz. Kulp yatay bir
    // yolda gider (kayış volandan gelir); bitişte dizlerde kilit yok (~12°).
    // KALK: gövde geriye yatarken leğen kemiği oturma kemiklerinin üstünde geriye yuvarlanır; iskelette leğen gövdeyle birlikte
    // döndüğü için kalça eklemi sabit kalırsa kalçanın arkası seleye 2,4–3,7 cm gömülüyordu (yüzey denetimi, dört gövde) →
    // kalça eklemi geriye yatışla birlikte KALK cm yükselir (bitişte)
    const SELE = 36, PY = SELE + R.kalca, B = [54, 26], BZ = KALCA_YAN, EZ = OMUZ.yan + 2.5, PLAKA = 45, KALK = 2.2;
    const X_GIRIS = 0, X_BITIS = (() => { const a = fark([B[0], B[1], 0], [...ayakVek(PLAKA), 0]), d = Math.sqrt(L.th ** 2 + L.sh ** 2 + 2 * L.th * L.sh * Math.cos(rd(12)));
      return a[0] - Math.sqrt(d * d - (PY + KALK - a[1]) ** 2); })();
    const G_GIRIS = 64, G_BITIS = 110;                                       // gövdenin yatayla açısı (°): 64 = 26° öne, 110 = 20° geride
    const yumusak = (f, a, b) => ease(Math.min(1, Math.max(0, (f - a) / (b - a))));
    const evre = t => { const f = dongu01(t);                                  // bacak · gövde · kol (0 = giriş hâli, 1 = bitiş hâli)
      if (f < 0.35) return { b: yumusak(f, 0, 0.22), g: yumusak(f, 0.12, 0.28), k: yumusak(f, 0.2, 0.35) };
      return { b: 1 - yumusak(f, 0.62, 0.95), g: 1 - yumusak(f, 0.47, 0.64), k: 1 - yumusak(f, 0.35, 0.49) }; };
    const egim = t => ara(32, PLAKA, evre(t).b);                              // girişte topuk hafif kalkık (taban 32°; bilek ~30° bükülür), bitişte plakada düz (45°)
    const govde = t => ara(G_GIRIS, G_BITIS, evre(t).g);
    const kalca = t => [ara(X_GIRIS, X_BITIS, evre(t).b), PY + KALK * evre(t).g, 0];
    const KUL_GIRIS_Y = 64, YOL = (() => { const P = [X_BITIS, PY, 0], gd = yon(0, G_BITIS), yuz = [Math.sin(rd(G_BITIS)), -Math.cos(rd(G_BITIS)), 0];
      return ekle(ekle(P, gd, 26), yuz, M.OLCU.govde.yariDerin + 5); })();      // bitişte kulp alt kaburganın önünde
    const yolY = x => ara(KUL_GIRIS_Y, YOL[1], (x - 81) / (YOL[0] - 81));    // kulp yolu (hafif eğik doğru)
    const omuz = t => { const P = kalca(t), g = govde(t); return [P[0] + omuzOfseti(g)[0], P[1] + omuzOfseti(g)[1]]; };
    const duzKolX = t => { const o = omuz(t), dz = EZ - OMUZ.yan; let x = o[0] + 50;   // kollar düzken kulp: omuzdan kol boyu uzakta, yolun üstünde
      for (let i = 0; i < 30; i++) { const y = yolY(x), f = Math.hypot(x - o[0], y - o[1], dz) - KOL_DUZ; x -= f * 0.9; } return x; };
    const kulp = t => { const x = ara(duzKolX(t), YOL[0], evre(t).k); return [x, yolY(x), 0]; };
    const CIKIS = [100, 58, 0];                                               // kayışın volandan çıktığı yer
    const poz = t => ({ ...OTURUR(kalca(t), [0, govde(t)]), ayakA: [0, egim(t)], ayakB: [0, egim(t)] });
    const uclar = t => () => { const k = kulp(t), v = ayakVek(egim(t)), a = [B[0] - v[0], B[1] - v[1]];
      return { A: { hedef: [k[0], k[1], EZ], kutup: [-1, -0.4, 0.5], ...tut(Z, 1.6, 'onKolArka') }, B: { hedef: [k[0], k[1], -EZ], kutup: [-1, -0.4, -0.5], ...tut(Z, 1.6, 'onKolArka') },
        ayakA: { hedef: [a[0], a[1], BZ], kutup: [0.3, 1, 0.04] }, ayakB: { hedef: [a[0], a[1], -BZ], kutup: [0.3, 1, -0.04] } }; };
    const dizAci = s => 180 - aciOf(s.kaA, s.zA, s.aA);
    // çekiş sırası kaslarda da: bacaklar (0…0,25) → sırt ve bel (0,1…0,37) → kollar (0,2…0,38); dönüşte kaslar gevşer
    const kasAktif = t => iki(() => { const f = dongu01(t);
      return { kuadriseps: pencere(f, 0, 0.24), kalca: pencere(f, 0.03, 0.28), arkaBacak: pencere(f, 0.05, 0.3), bel: pencere(f, 0.1, 0.32),
        sirtOrta: pencere(f, 0.15, 0.37), lat: pencere(f, 0.17, 0.37), biceps: pencere(f, 0.2, 0.38), arkaOmuz: pencere(f, 0.22, 0.38) }; });
    return {
      ad: 'Rowing Machine', kasAktif, dongu: true, logolar: silindirLogolari([112, 44, 0], 12, 30), kamera: [35, 16], seritKameralar: [[0, 0], [35, 16], [90, 10]], merkez: [5, 0, 0],
      seritAnlar: [[0, 'giriş'], [0.3, 'bitiş'], [0.6, 'dönüş']],
      poz, uclar,
      ekipman(pr, s, t) {
        const k = kulp(t), x = s.P[0], plu = [Math.cos(rd(PLAKA)), Math.sin(rd(PLAKA)), 0], pln = [-plu[1], plu[0], 0];
        return [...M.kutu(pr, [-96, 66], [22, 28], [-5, 5], KULE.govde),                                   // ray
          ...M.kutu(pr, [-100, -92], [0, 22], [-5, 5], KULE.govde), ...M.kutu(pr, [-102, -90], [0, 3], [-24, 24], KULE.govde),   // arka ayak
          M.kapsul(pr, [64, 25, 0], [100, 30, 0], 4, METAL),                                                 // ray → ön gövde
          ...M.kutu(pr, [100, 124], [0, 3], [-28, 28], KULE.govde), M.kapsul(pr, [108, 3, 0], [108, 30, 0], 4, METAL),
          M.silindirParca(pr, [112, 44, 0], Z, 26, 24, '#2a2f35'),                                         // volan (fan kafesi)
          M.kapsul(pr, [104, 64, 0], [86, 108, 0], 2.4, METAL),                                              // ekran kolu
          ...ekranPaneli(pr, [84, 114, 0], 24, [22, 16, 4]),                                                      // ekran (kürekçiye dönük)
          ...minderKutu(pr, [x - 15, x + 11], [28, SELE], [-14, 14], PED),                                    // kayan sele (2. tur: deri minder)
          ...[1, -1].flatMap(i => M.kutuY(pr, ekle(ekle([B[0], B[1], i * BZ], plu, -3), pln, -(1.6 + TOP_Y)), [plu, pln, Z], [30, 3.2, 12], KULE.govde)),   // ayak plakaları
          M.kapsul(pr, [60, 28, 0], [B[0] - 2, B[1] - 4, 0], 3, METAL),
          M.kablo(pr, CIKIS, k),                                                                              // kayış
          M.kapsul(pr, [k[0], k[1], -EZ - 6], [k[0], k[1], EZ + 6], 1.6, '#8a929c')];                       // kulp
      },
      cisimler: s => { const k = kulp(s.t); return [[CIKIS, k, 0.7], [[k[0], k[1], -EZ - 6], [k[0], k[1], EZ + 6], 1.6]]; },
      izlenen: 'eA',
      kisit: { ortakBar: true, dizYonu: [0.3, 1, 0], temas: [{ ad: 'kalça selede (geriye yatışta oturma kemiklerinde yuvarlanır)', f: s => (s.P[1] - R.kalca) - SELE, aralik: [-1.5, KALK + 1.5] }],
        ozel: [
          kardiyoKurali('ayak parmak kökü plakada sabit', ks => { const m = Math.max(...ks.flatMap(s => [mesafe(s.uA, [B[0], B[1], BZ]), mesafe(s.uB, [B[0], B[1], -BZ])].map(Math.abs))); return { gecti: m <= 0.3, olcum: `kayma ${m.toFixed(2)}` }; }),
          kardiyoKurali('çekiş sırası BACAK → GÖVDE → KOL', () => { const b = f => evre(f); const ok = b(0.15).b > b(0.15).g && b(0.15).g > b(0.15).k - 1e-9 && b(0.25).g > b(0.25).k; return { gecti: ok, olcum: `t=0,15 bacak ${b(0.15).b.toFixed(2)} gövde ${b(0.15).g.toFixed(2)} kol ${b(0.15).k.toFixed(2)}` }; }),
          // iskeletten ölçülür (planlanan evreden değil): dönüşte diz bitişteki açısından 5°'den fazla bükülmüşse eller dizin önünde olmalı
          kardiyoKurali('dönüşte eller dizleri geçmeden dizler bükülmez', ks => { const k0 = Math.min(...ks.map(dizAci));
            const v = ks.filter(s => dongu01(s.t) > 0.35 && dizAci(s) > k0 + 5).map(s => (s.eA[0] + s.eB[0]) / 2 - Math.max(s.zA[0], s.zB[0]));
            const m = Math.min(...v); return { gecti: m >= 3, olcum: `diz bükülürken eller dizin ${m.toFixed(1)} cm önünde (${v.length} kare)` }; }),
          kardiyoKurali('girişte kaval dike yakın (≤ 12°)', ks => { const s = M.an({ poz, uclar }, 0), a = Math.atan2(s.zA[0] - s.aA[0], s.zA[1] - s.aA[1]) * 180 / Math.PI; return { gecti: Math.abs(a) <= 12, olcum: `${a.toFixed(1)}° (dikeyden, + = diz önde)` }; }),
          kardiyoKurali('bitişte dizler düz ama kilitli değil (5–20°)', ks => { const m = Math.min(...ks.map(dizAci)); return { gecti: m >= 5 && m <= 20, olcum: `${m.toFixed(1)}°` }; }),
          kardiyoKurali('gövde girişte ~26° öne, bitişte ~20° geride (dikeyden)', ks => { const a = ks.map(s => Math.atan2(s.g[0], s.g[1]) * 180 / Math.PI); return { gecti: Math.max(...a) <= 30 && Math.min(...a) >= -24, olcum: `${Math.min(...a).toFixed(0)}° … ${Math.max(...a).toFixed(0)}°` }; }),
          kardiyoKurali('bitişte kulp alt kaburganın önünde (dirsekler gövdenin gerisinde)', ks => { const s = M.an({ poz, uclar }, 0.36); const d = Math.min(s.dA[0], s.dB[0]) - s.gogusAlt[0]; return { gecti: d < 0, olcum: `dirsek göğüs altından ${d.toFixed(1)} cm` }; }),
          kardiyoKurali('kulp yolu düz (yükseklik farkı ≤ 12 cm)', ks => { const y = ks.map(s => kulp(s.t)[1]); return { gecti: Math.max(...y) - Math.min(...y) <= 12, olcum: `${(Math.max(...y) - Math.min(...y)).toFixed(1)} cm` }; }),
        ] },
    };
  })(),

  cardio_stair: (() => {
    // MERDİVEN MAKİNESİ (dönen basamaklı "StepMill"; ACE). Basamaklar (yükseklik 20 cm ≈ 8", derinlik 28 cm) aşağı-geriye
    // akar; kişi yerinde kalır, her adımda BİR basamak çıkar (iki ayak dönüşümlü, basamak atlanmaz). Basan ayak basamakla
    // birlikte iner; itişte topuk kalkar (parmak kökü basamakta). Salınım BASAMAĞIN ÇERÇEVESİNDE çözülür: ayak önce yukarı
    // kalkar (öndeki basamağın burnunu aşar), sonra öne gelir ve TÜM TABANIYLA iki üst basamağa basar. Gövde kalçadan hafif
    // öne (~8°), korkuluğa yaslanmadan; kollar yürür gibi sallanır. 3 s'de 2 döngü = 80 basamak/dk (orta tempo).
    const H = 20, D = 28, TUR = 2, DUTY = 0.62, F2 = 0.48, P_ITIS = -28, AX = 12, TEPE = 50.5, TS = 0.6, XB = 0.3, PB = 0.3;
    const Y0 = 40, KY = Y0 + 70, R0 = AX - 7, AZ = KALCA_YAN - 1, EN = 26, KULE_UST = Y0 + 3.25 * H + 2, TABAN_UST = 12;   // kule: en üst basamağın yükseltisinin 4,5 cm üstü
    const sm = x => ease(Math.min(1, Math.max(0, x)));
    const cerceve = f => {                                                   // bastığı basamağa göre bilek + taban eğimi
      if (f < F2) return { a: [AX, AYAK_Y], p: 0 };
      if (f < DUTY) { const k = (f - F2) / (DUTY - F2), p = P_ITIS * k * k, u0 = ayakVek(0), u = ayakVek(p);   // itiş: parmak kökü sabit
        return { a: [AX + u0[0] - u[0], AYAK_Y + u0[1] - u[1]], p }; }
      const s = (f - DUTY) / (1 - DUTY), b = cerceve(DUTY - 1e-9);
      const x = ara(b.a[0], AX + 2 * D, sm((s - XB) / (1 - XB)));             // önce kalk, sonra öne
      const y = s < TS ? ara(b.a[1], TEPE, sm(s / TS)) : ara(TEPE, 2 * H + AYAK_Y, sm((s - TS) / (1 - TS)));
      return { a: [x, y], p: P_ITIS * (1 - sm((s - PB) / 0.4)) };
    };
    const ayak = f => { f = dongu01(f); const c = cerceve(f); return { a: [c.a[0] - 2 * D * f, Y0 + c.a[1] - 2 * H * f], p: c.p }; };   // dünya = basamak − kayma
    const faz = (t, i) => dongu01(TUR * t + (i > 0 ? 0 : 0.5));
    const kayma = t => 2 * TUR * t;                                          // basamak sayısı cinsinden akış
    const basamak = (k, t) => { const m = k - kayma(t); return { x: R0 + m * D, y: Y0 + m * H }; };   // k. basamağın arka kenarı ve üst yüzü
    const yuzeyY = (x, t) => { const k = Math.floor((x - R0) / D + kayma(t)); return basamak(k, t).y; };
    const tabanY = (s, y) => { const p = Math.asin(Math.max(-1, Math.min(1, s[`tab${y}`][1]))) * 180 / Math.PI; return tabanNoktalari(s[`a${y}`], p); };
    const poz = t => ({ ...AYAKTA([0, KY, 0], [0, 82]), zeminY: Y0, ayakA: [0, ayak(faz(t, 1)).p], ayakB: [0, ayak(faz(t, -1)).p] });
    const uclar = t => s => { const fA = faz(t, 1), aA = ayak(fA).a, aB = ayak(faz(t, -1)).a, ileri = Math.cos(2 * Math.PI * fA);
      return { A: kolSalinimi(s.omA, 1, -ileri), B: kolSalinimi(s.omB, -1, ileri),
        ayakA: { hedef: [aA[0], aA[1], AZ], kutup: [1, 0.2, 0.1] }, ayakB: { hedef: [aB[0], aB[1], -AZ], kutup: [1, 0.2, -0.1] } }; };
    const KORKULUK = [[-34, 100, 40], [56, 130, 40]];
    // basamak çıkma EMG'si (f = o bacağın evresi, 0 = basamağa basış): uyluk ön, kalça ve arka bacak bedeni yukarı iterken
    // (duruşun ilk yarısı), baldır itişte; salınımda bacak gevşer
    const kasAktif = t => iki(i => { const f = faz(t, i); return { kuadriseps: pencere(f, 0.97, 0.42), kalca: pencere(f, 0, 0.45), arkaBacak: pencere(f, 0.03, 0.4), baldir: pencere(f, 0.3, 0.62) }; });
    return {
      ad: 'Stair Climber', kasAktif,
      // FS işareti kulenin büyük ön yüzünün (x = 100, en 60 × boy KULE_UST) tam ortasında, yüzün %60'ı eninde (Sabri, 16 Eki)
      // 16 Eki: 36 → 30 cm, renk kulenin biraz koyu tonu
      logolar: [{ merkez: [100, KULE_UST / 2, 0], n: [1, 0, 0], yukari: [0, 1, 0], en: 30, renk: '#262b31' }], dongu: true, kamera: [145, 14], seritKameralar: [[0, 0], [145, 14], [-90, 8]], merkez: [5, 0, 0],   // kule önde: varsayılan bakış yandan-arkadan
      poz, uclar,
      ekipman(pr, s, t) {
        const ton = { ust: '#3a4149', yan: '#272c33' }, burun = { ust: '#8a929c', yan: '#5d646d' };
        const o = [...M.kutu(pr, [-78, 62], [0, TABAN_UST], [-EN - 10, EN + 10], KULE.govde),                       // taban (alt uçta basamaklar buraya girer)
          // 16 Eki (Sabri: "basamakların üstü kaidenin üstünde çizgi hâlinde görünüyor"): kuleye giren en üst basamağın yükseltisi
          // Y0 + 2,25·H + H − 2,5 = 102,5'e çıkıyor, kule 96'da bitiyordu → kule KULE_UST'e kadar (yükseltinin tepesinden yüksek)
          ...M.kutu(pr, [62, 100], [0, KULE_UST], [-EN - 4, EN + 4], KULE.govde),                              // ön kule (üst uçta basamaklar buraya girer)
          ...M.kutu(pr, [80, 92], [KULE_UST, 138], [-9, 9], KULE.govde),                                       // ekran sütunu
          ...ekranPaneli(pr, [84, 144, 0], 30, [40, 16, 5]),   // ekran (kişiye dönük)
          ...[1, -1].flatMap(i => [M.kapsul(pr, [-70, 10, i * (EN + 7)], [64, 104, i * (EN + 7)], 4, METAL),   // yan kirişler (eğimli)
            M.kapsul(pr, [KORKULUK[0][0], KORKULUK[0][1], i * KORKULUK[0][2]], [KORKULUK[1][0], KORKULUK[1][1], i * KORKULUK[1][2]], 1.8, '#8a929c'),   // korkuluk
            M.kapsul(pr, [KORKULUK[0][0], KORKULUK[0][1], i * KORKULUK[0][2]], [KORKULUK[0][0] + 6, 30, i * (EN + 7)], 1.8, '#8a929c')])];
        const m0 = Math.floor(kayma(t) - 1.75) + 1;                            // 4 basamak: göreli −1,75 … 2,25 (alt uç tabanın, üst uç kulenin içinde)
        for (let k = m0; k < m0 + 4; k++) { const b = basamak(k, t);
          // tabana gömülen basamağın yüzü taban yüzeyiyle çakışıp çizgi gibi görünmesin: taban yüzeyinin altındaysa yüzü ve burnu
          // tabanın İÇİNE (görünmez) alınır; parça sayısı sabit kalır (kadraj ve hareket sınıflaması kare kare eşleşsin)
          const yy = b.y < TABAN_UST + 0.6 ? [1, 1.2] : null;
          o.push(...M.kutu(pr, [b.x, b.x + D], yy ?? [b.y - 2.5, b.y], [-EN, EN], ton),                       // basamak yüzü
            ...M.kutu(pr, [b.x + D - 1.5, b.x + D], [b.y - 2.5, b.y + H - 2.5], [-EN, EN], ton),               // bir üstün yükseltisi
            ...M.kutu(pr, [b.x, b.x + 2.5], yy ?? [b.y - 0.6, b.y + 0.2], [-EN, EN], burun));                   // basamak burnu (açık renk şerit)
        }
        return o;
      },
      izlenen: 'aA',
      kisit: { sirayla: true, dizYonu: [1, 0.2, 0], govde: { aralik: [80, 84], oynama: 0.5 },
        ozel: [
          kardiyoKurali('basan ayak basamakta sabit (basamakla birlikte iner)', ks => { let m = 0; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const f = faz(s.t, i); if (f >= F2) continue;
            m = Math.max(m, Math.abs(s[`a${y}`][1] - (Y0 + AYAK_Y - 2 * H * f)), Math.abs(s[`a${y}`][0] - (AX - 2 * D * f))); } return { gecti: m <= 0.3, olcum: `en çok ${m.toFixed(2)} cm` }; }),
          kardiyoKurali('ayak tüm tabanıyla basamakta (topuk ve parmak ucu basamağın içinde)', ks => { let m = Infinity; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { const f = faz(s.t, i); if (f >= F2) continue;
            const n = tabanY(s, y), k = Math.floor((s[`a${y}`][0] - R0) / D + kayma(s.t)), b = basamak(k, s.t); m = Math.min(m, n.h[0] - b.x + 1, b.x + D - (n.u[0] + 7)); }
            return { gecti: m >= 0, olcum: `basamak kenarına en yakın ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('salınan ayak basamağa çarpmıyor (taban ≥ 0)', ks => { let m = Infinity; for (const s of ks) for (const y of ['A', 'B']) { const n = tabanY(s, y);
            for (const q of [[n.u[0], n.u[1] - TOP_Y], n.h, [n.u[0] + 7, n.u[1] - TOP_Y]]) m = Math.min(m, q[1] - yuzeyY(q[0], s.t)); }
            return { gecti: m >= -0.8, olcum: `basamağa göre en alçak ${m.toFixed(1)} cm` }; }),
          kardiyoKurali('basamak atlanmıyor: ayaklar dönüşümlü, iniş anında ayaklar arası bir basamak (20 cm)', ks => { const s = ks[0], d = s.aA[1] - s.aB[1]; return { gecti: Math.abs(d - H) <= 1.5, olcum: `${d.toFixed(1)} cm` }; }),
          kardiyoKurali('basan bacakta diz en çok 90°, iterken neredeyse düz (≤ 20°)', ks => { let mx = 0, mn = 180; for (const s of ks) for (const [y, i] of [['A', 1], ['B', -1]]) { if (faz(s.t, i) >= DUTY) continue;
            const k = 180 - aciOf(s[`ka${y}`], s[`z${y}`], s[`a${y}`]); mx = Math.max(mx, k); mn = Math.min(mn, k); } return { gecti: mx <= 90 && mn <= 20, olcum: `${mn.toFixed(0)}° … ${mx.toFixed(0)}°` }; }),
          kardiyoKurali('basamaklar kulenin içinde kaybolur (hiçbir basamak parçası kulenin üstünden taşmıyor)', ks => { let m = -Infinity;
            for (const s of ks) { const m0 = Math.floor(kayma(s.t) - 1.75) + 1; for (let k = m0; k < m0 + 4; k++) { const b = basamak(k, s.t); if (b.x + D > 62) m = Math.max(m, b.y + H - 2.5); } }
            return { gecti: m <= KULE_UST, olcum: `kuleye giren yükseltinin tepesi ${m.toFixed(1)} · kule ${KULE_UST.toFixed(1)}` }; }),
          kardiyoKurali('eller korkuluğa yaslanmıyor (≥ 5 cm)', ks => { const m = Math.min(...ks.flatMap(s => [s.eA, s.eB].map(e => Math.min(...[1, -1].map(i => {
            const a = [KORKULUK[0][0], KORKULUK[0][1], i * KORKULUK[0][2]], b = [KORKULUK[1][0], KORKULUK[1][1], i * KORKULUK[1][2]], ab = fark(b, a), u = Math.max(0, Math.min(1, nokta(fark(e, a), ab) / nokta(ab, ab))); return mesafe(e, ekle(a, ab, u)); })))));
            return { gecti: m >= 5, olcum: `en yakın ${m.toFixed(1)} cm` }; }),
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
      poz: t => ({ ...AYAKTA([0, AYAKTA_Y, 0]), thA: [0, p(t)], shA: [0, p(t) + 12], ayakA: [0, p(t) + 12 + 90], ayakB: 0, uaA: [-90, -75], faA: [-90, -78] }),   // 17 Eki: boştaki kol biraz açık — sallanan uyluk ele çarpıyordu
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

  /* ─── 1B · BAR HAREKETLERİ (13 Eki, plan docs/2026-10-13-1b-ilk-bes-bar-hareketi-PLAN.md) ──────────────────── */

  bb_squat: (() => {
    // NSCA / Rippetoe (yüksek bar): bar trapezin üstünde, eller omuzdan geniş (bar üzerindeki 81 cm halka işaretleri),
    // ayaklar omuz genişliğinde, parmaklar ~20° dışa; BAR AYAK ORTASININ ÜSTÜNDE DİKEY iner-çıkar — gövde açısı bundan
    // ÇÖZÜLÜR (kalça geri gittikçe gövde öne eğilir); altta uyluk yere paralel, dizler parmak yönünde, topuklar yerde.
    // Alt nokta sayısal çözüldü (gövde yere 50° → kaval 65°, diz 115°, diz parmak ucunun ~4 cm önünde).
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 8, ORTA = AYAK_X + 4.5;          // ayak ortası: bilek + 4,5 (topuk −4 … parmak ucu +19)
    const BAR_ASAGI = 4, BAR_ARKA = 6.5, TUTUS = 42;                          // bar: boyundan 4 aşağı, gövde ekseninin 6,5 arkasında
    const UST = { y: AYAKTA_Y - 0.9, fi: 84 }, ALT = { y: 45.1, fi: 50 };
    const durum = t => { const k = ease(t), fi = ara(UST.fi, ALT.fi, k);
      return { fi, P: [ORTA - (L.torso - BAR_ASAGI) * Math.cos(rd(fi)) + BAR_ARKA * Math.sin(rd(fi)), ara(UST.y, ALT.y, k), 0] }; };
    const barNoktasi = s => ekle(ekle(s.boyun, s.g, -BAR_ASAGI), s.yuz, -BAR_ARKA);
    const poz = t => { const d = durum(t); return { ...AYAKTA(d.P, [0, d.fi]), ayakA: -20, ayakB: 20, bas: (90 - d.fi) * 0.45 }; };   // baş nötr, bakış hafif aşağı
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.94, 0, 0.34] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.94, 0, -0.34] } };
    const KANCA_Y = Math.round(barNoktasi(M.iskelet(poz(0), () => ayaklar))[1] - 6);   // kanca, ayaktaki barın 6 cm altında
    const KAFES_X = 66;                                                          // kafes ÖNDE (barı alıp 2–3 adım geri çıkılır); 40° görünümde dikme bedenin önünden geçmesin
    const kafes = pr => squatKafesi(pr, KAFES_X, KANCA_Y);
    return {
      // kamera arkadan-yandan (−35°): kafes önde durduğu için 40°'de dikme bedenin önünden geçiyordu; buradan kafes arka
      // planda kalır, kalçanın geri gidişi, dizler ve bel görünür
      ad: 'Squat (bar)', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [90, 6]], merkez: [0, 0, 0],
      poz,
      // dirsekler barın altında, yere ve hafif geriye bakar (kutup: −g, −yüz)
      uclar: () => s => { const b = barNoktasi(s), kol = i => ({ hedef: ekle(b, Z, i * TUTUS),
          kutup: [-s.g[0] - 0.5 * s.yuz[0], -s.g[1] - 0.5 * s.yuz[1], i * 0.3], ...tut(Z, 1.4, 'ileri') });
        return { A: kol(1), B: kol(-1), ...ayaklar }; },
      ekipman: (pr, s) => [...kafes(pr), ...M.halter(pr, barNoktasi(s))],
      izlenen: 'P',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0],
        ozel: [
          ozelBarYolu(barNoktasi, ORTA, TOL_KABA),
          { ad: 'altta uyluk yere paralel (±6)', f: ks => { const s = ks.at(-1), m = s.kaA[1] - s.zA[1]; return { gecti: Math.abs(m) <= 6, olcum: `kalça dizden ${m.toFixed(1)} yukarıda` }; } },
          { ad: 'dizler parmak yönünde (içe düşmüyor)', f: ks => { const m = Math.min(...ks.map(s => s.zA[2] - s.kaA[2])); return { gecti: m >= 2, olcum: `diz kalçadan en az ${m.toFixed(1)} dışta` }; } },
          { ad: 'gövde yere 45–90° (öne kapanmıyor)', f: ks => { const a = ks.map(s => Math.asin(s.g[1]) * 180 / Math.PI), m = Math.min(...a); return { gecti: m >= 45, olcum: `en eğik ${m.toFixed(1)}°` }; } },
          { ad: 'beden + bar ağırlık merkezi ayak tabanında', f: ks => {
              const agm = s => { const orta = (a, b) => a.map((v, i) => (v + b[i]) / 2);
                const parca = [[orta(s.P, s.boyun), 0.5], [s.kafa, 0.08], [orta(s.kaA, s.zA), 0.1], [orta(s.kaB, s.zB), 0.1], [orta(s.zA, s.aA), 0.045], [orta(s.zB, s.aB), 0.045], [orta(s.omA, s.eA), 0.05], [orta(s.omB, s.eB), 0.05], [barNoktasi(s), 0.5]];
                return parca.reduce((a, [p, m]) => a + p[0] * m, 0) / parca.reduce((a, [, m]) => a + m, 0); };   // bar 45 kg ≈ beden ağırlığının yarısı
              const x = ks.map(agm), a = Math.min(...x) - AYAK_X, b = Math.max(...x) - AYAK_X;
              return { gecti: a >= -4 && b <= 11, olcum: `bilekten ${a.toFixed(1)} … ${b.toFixed(1)} (topuk −4 · parmak kökü 11)` }; } },
        ] },
    };
  })(),


  bb_deadlift: (() => {
    // NSCA / Rippetoe: bar yerde ayak ortasının üstünde (Ø45 plaka → bar merkezi 22,5 cm), kaval bara yakın, kollar DÜZ,
    // omuzlar barın hafif önünde, sırt düz; bar bacaklara yakın ve DİKEY yükselir, tepede kalça kilitli. K2: her
    // tekrarda bar yere değer (t = 0 yerde). Alt nokta sayısal çözüldü: gövde yere 28°, diz ~85°, diz barın ~2 cm önünde.
    // SIRA (ölçüldü: gövde ve bacak birlikte açılınca bar hareketin ortasında dize giriyordu): önce BACAKLAR açılır —
    // bar dizi geçer, gövde açısı az değişir — sonra KALÇA açılır. Kalça yolu bacak uzunluğundan, bar bedenden türer
    // (kalça x'i barı ayak ortasında tutacak biçimde çözülür).
    // ORTA 8 → 8,5 (14 Eki): bar dizi geçerken yaşlı kadın gövdede kavala 2,2 cm sürtünüyordu (tolerans 2)
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 1, ORTA = AYAK_X + 8.5, TUTUS = KALCA_YAN + 13, DZ = OMUZ.yan - TUTUS;   // bar kavaldan ~1 parmak önde
    // Tepede omuz barın 16 cm gerisinde (kollar ~15° öne): bar uyluğun ÖNÜNE değer. 14 Eki (Sabri: "en yukarı kalkınca bar
    // bacaklara giriyor"): −9'da kalça barın yalnız 9,6 cm gerisindeydi, uyluğun ön yüzü ise kalça ekseninin ~13 cm önünde.
    const ALT = { fi: 28, on: 3 }, UST_ON = -16;
    const P0 = asiliBarKalca([ORTA, M.PLAKA_R_BUYUK, 0], ALT.fi, ALT.on, DZ);
    const D0 = Math.hypot(P0[0] - AYAK_X, P0[1] - AYAK_Y), DMAX = (L.th + L.sh) * 0.997;
    const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    const durum = t => { const k = ease(t);
      const fi = ara(ALT.fi, 90, 0.18 * sm(0, 0.5, k) + 0.82 * sm(0.4, 1, k)), on = ara(ALT.on, UST_ON, sm(0.35, 1, k));
      const d = ara(D0, DMAX, sm(0, 0.6, k)), px = ORTA + on - omuzOfseti(fi)[0];
      const P = [px, AYAK_Y + Math.sqrt(Math.max(0, d * d - (px - AYAK_X) ** 2)), 0];
      return { P, fi, bar: [ORTA, asiliBarY(P, fi, on, DZ), 0] }; };
    const barNoktasi = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.98, 0, 0.2] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.98, 0, -0.2] } };
    return {
      ad: 'Deadlift (bar)', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [90, 6]], merkez: [0, 0, 0],
      poz: t => { const d = durum(t); return { ...AYAKTA(d.P, [0, d.fi]), ayakA: -8, ayakB: 8, bas: (90 - d.fi) * 0.35 }; },
      uclar: t => { const d = durum(t); return s => {
        const kol = i => ({ hedef: ekle(d.bar, Z, i * TUTUS), kutup: [0.3, 0, i * 0.4], ...tut(Z, 1.4, 'onKolArka') });
        return { A: kol(1), B: kol(-1), ...ayaklar }; }; },
      ekipman: (pr, s) => M.halter(pr, barNoktasi(s), Z, { buyuk: true }),
      izlenen: 'P',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0],
        ozel: [
          { ad: 'her tekrarda bar yere değer (t = 0)', f: ks => { const m = barNoktasi(ks[0])[1] - M.PLAKA_R_BUYUK; return { gecti: Math.abs(m) <= 0.3, olcum: `plaka yerden ${m.toFixed(1)}` }; } },
          ozelBarYolu(barNoktasi, ORTA, TOL_KABA), ozelKollarDuz(), ozelBarBacak(barNoktasi), ozelAgm(barNoktasi, AYAK_X),
          { ad: 'tepede kalça kilitli (gövde dik ≥ 85°)', f: ks => { const a = Math.asin(ks.at(-1).g[1]) * 180 / Math.PI; return { gecti: a >= 85, olcum: `${a.toFixed(1)}°` }; } },
          { ad: 'başta sırt düz ve eğik (gövde yere 20–45°)', f: ks => { const a = Math.asin(ks[0].g[1]) * 180 / Math.PI; return { gecti: a >= 20 && a <= 45, olcum: `${a.toFixed(1)}°` }; } },
        ] },
    };
  })(),

  bb_rdl: (() => {
    // NSCA / ExRx Romanian deadlift: AYAKTA başlar, bar uyluklarda; dizler hafif bükük ve SABİT (~20°), kalça GERİ
    // gider, sırt düz, bar bacaklara yakın iner — dizin altına, kavalın üst-ortasına; kollar düz. Diz sabit → kalça bilekten sabit
    // uzaklıkta (çember); kalça x'i barı ayak ortasında tutacak biçimde çözülür (deadlift ile aynı kural).
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 1, ORTA = AYAK_X + 8, TUTUS = KALCA_YAN + 13, DZ = OMUZ.yan - TUTUS;
    const DIZ = 20, D = Math.sqrt(L.th ** 2 + L.sh ** 2 + 2 * L.th * L.sh * Math.cos(rd(DIZ)));
    // Tepede omuz barın 18 cm gerisinde (14 Eki, deadlift ile aynı sebep; diz 20° bükük olduğu için uyluk daha önde)
    const UST = { fi: 90, on: -18 }, ALT = { fi: 18, on: 4 };   // altta bar dizin ~11 cm altında (ölçüldü)
    const durum = t => { const k = ease(t), fi = ara(UST.fi, ALT.fi, k), on = ara(UST.on, ALT.on, k);
      const px = ORTA + on - omuzOfseti(fi)[0], P = [px, AYAK_Y + Math.sqrt(D * D - (px - AYAK_X) ** 2), 0];
      return { P, fi, bar: [ORTA, asiliBarY(P, fi, on, DZ), 0] }; };
    const barNoktasi = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.98, 0, 0.2] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.98, 0, -0.2] } };
    return {
      ad: 'Romanian deadlift (bar)', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [90, 6]], merkez: [0, 0, 0],
      poz: t => { const d = durum(t); return { ...AYAKTA(d.P, [0, d.fi]), ayakA: -8, ayakB: 8, bas: (90 - d.fi) * 0.35 }; },
      uclar: t => { const d = durum(t); return () => {
        const kol = i => ({ hedef: ekle(d.bar, Z, i * TUTUS), kutup: [0.3, 0, i * 0.4], ...tut(Z, 1.4, 'onKolArka') });
        return { A: kol(1), B: kol(-1), ...ayaklar }; }; },
      ekipman: (pr, s) => M.halter(pr, barNoktasi(s), Z, { buyuk: true }),
      izlenen: 'P',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0],
        ozel: [
          { ad: `diz açısı sabit (${DIZ}° ± 5°)`, f: ks => { const a = ks.map(dizAcisi), m = Math.min(...a), x = Math.max(...a);
              return { gecti: m >= DIZ - 5 && x <= DIZ + 5, olcum: `${m.toFixed(1)}° … ${x.toFixed(1)}°` }; } },
          { ad: 'kalça GERİ gider (öne değil)', f: ks => { const d = ks.at(-1).P[0] - ks[0].P[0]; return { gecti: d <= -15, olcum: `kalça ${d.toFixed(1)} cm` }; } },
          { ad: 'altta bar dizin altına iner (kavalın %25–80 yüksekliği)', f: ks => { const s = ks.at(-1), y = barNoktasi(s)[1], a = s.aA[1], z = s.zA[1];
              return { gecti: y > a + 0.25 * (z - a) && y < a + 0.8 * (z - a), olcum: `bar ${y.toFixed(1)} · bilek ${a.toFixed(1)} · diz ${z.toFixed(1)}` }; } },
          ozelBarYolu(barNoktasi, ORTA, TOL_KABA), ozelKollarDuz(), ozelBarBacak(barNoktasi), ozelAgm(barNoktasi, AYAK_X),
        ] },
    };
  })(),

  bb_row: (() => {
    // NSCA / ExRx bent-over row: gövde öne ~45° ve SABİT, dizler hafif bükük, kollar sarkık (bar ayak ortasının üstünde)
    // → bar alt göğse/karna çekilir; dirsekler gövdeye yakın geriye gider, bel düz.
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 1, ORTA = AYAK_X + 8, TUTUS = OMUZ.yan + 6, DZ = OMUZ.yan - TUTUS, FI = 45;
    const DIZ = 22, D = Math.sqrt(L.th ** 2 + L.sh ** 2 + 2 * L.th * L.sh * Math.cos(rd(DIZ)));
    const px = ORTA - omuzOfseti(FI)[0], P = [px, AYAK_Y + Math.sqrt(D * D - (px - AYAK_X) ** 2), 0];
    const g = yon(0, FI), yuzV = [Math.sin(rd(FI)), -Math.cos(rd(FI)), 0], { yariDerin, merkezOn } = M.OLCU.govde;
    const ALT = [ORTA, asiliBarY(P, FI, 0, DZ), 0];
    // karın/alt göğüs: göğüs altından 4 cm aşağıda, gövdenin ön yüzünün 1 cm önünde (bar değer gibi durur)
    const UST = ekle(ekle(P, g, 20), yuzV, merkezOn + yariDerin + 1.4 + 1);
    const barYeri = t => { const k = ease(t); return [ara(ALT[0], UST[0], k), ara(ALT[1], UST[1], k), 0]; };
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.98, 0, 0.2] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.98, 0, -0.2] } };
    const barNoktasi = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    return {
      ad: 'Bar kürek', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [150, 20]], merkez: [0, 0, 0],
      a: { ...AYAKTA(P, [0, FI]), ayakA: -8, ayakB: 8, bas: (90 - FI) * 0.35 },
      // dirsek geriye (kalçaya doğru) ve hafif dışa: gövdeye yakın
      uclar: t => { const b = barYeri(t); return () => {
        const kol = i => ({ hedef: ekle(b, Z, i * TUTUS), kutup: [-1, 0.15, i * 0.35], ...tut(Z, 1.4, 'onKolArka') });
        return { A: kol(1), B: kol(-1), ...ayaklar }; }; },
      ekipman: (pr, s) => M.halter(pr, barNoktasi(s), Z, { buyuk: true }),
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0], govde: { aralik: [40, 50], oynama: 1 },
        ozel: [
          { ad: 'üstte bar alt göğse/karna gelir (gövdeye ≤ 3 cm)', f: ks => { const s = ks.at(-1), b = barNoktasi(s);
              const on = nokta(fark(b, s.P), yuzV) - merkezOn - yariDerin - 1.4, boy = nokta(fark(b, s.P), g);
              return { gecti: on >= -0.5 && on <= 3 && boy >= 8 && boy <= s.gogusAlt[1] - s.P[1] + 30, olcum: `ön yüzden ${on.toFixed(1)} · kalçadan gövde boyunca ${boy.toFixed(1)}` }; } },
          { ad: 'başta kollar düz ve sarkık', f: ks => { const s = ks[0], m = Math.max(...['A', 'B'].map(y => 180 - aciOf(s[`om${y}`], s[`d${y}`], s[`e${y}`])));
              return { gecti: m <= 10, olcum: `dirsek ${m.toFixed(1)}°` }; } },
          ozelAgm(barNoktasi, AYAK_X),
        ] },
    };
  })(),

  bb_ohp: (() => {
    // NSCA / Rippetoe ayakta omuz presi: bar ön omuzlarda (köprücük üstü), eller omuzdan geniş, dirsekler barın altında
    // öne; bar DİKEYE yakın yükselir — yüzün ÖNÜNDEN geçer (baş hafif geride), başın üstünü geçince gövde barın altına
    // girer ve tepede bar omuzların ve ayak ortasının üstünde kilitlenir. Ayaklar yerde, bel aşırı kavislenmez.
    // ⚠️ Tutuş ölçüyle seçildi: el omuzdan ≥ 23,7 cm uzakta olmalı, yoksa dirsek 140°'yi aşar (ön kol pazıya girer).
    const AYAK_X = 2, AYAK_Z = KALCA_YAN + 3, ORTA = AYAK_X + 7, TUTUS = OMUZ.yan + 20, DZ = TUTUS - OMUZ.yan;
    const BAS = { fi: 95, on: 11, ust: 8 };                                  // başta gövde 5° geride; bar omuz hattının 14 önünde, 10 üstünde
    const P0 = [ORTA - 2.5, AYAKTA_Y - 0.5, 0], S0 = ekle(P0, [...omuzOfseti(BAS.fi), 0], 1);   // başta bar ayak ortasının ~5 önünde
    const P1 = [ORTA - omuzOfseti(90)[0], AYAKTA_Y - 0.5, 0], S1 = ekle(P1, [...omuzOfseti(90), 0], 1);
    const B0 = [S0[0] + BAS.on, S0[1] + BAS.ust, 0], B1 = [S1[0], S1[1] + Math.sqrt(KOL_DUZ ** 2 - DZ * DZ), 0];
    const BAS_UST = S0[1] + 37;                                                // başın tepesi + saç (omuz hattının ~37 cm üstü)
    const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
    // Bar yüz hizasındayken gövde 4° daha geriye yaslanır ve baş geri alınır (yüz bardan uzaklaşır); bar başın tepesini
    // geçince gövde barın altına girer (g: 0 → 1)
    const durum = t => { const k = ease(t), y = ara(B0[1], B1[1], k), g = sm(BAS_UST - 2, BAS_UST + 16, y);
      const yuz = Math.sin(Math.PI * Math.max(0, Math.min(1, (y - B0[1]) / (BAS_UST + 4 - B0[1]))));
      return { bar: [ara(B0[0], B1[0], g), y, 0], fi: ara(BAS.fi + 4 * yuz, 90, g), P: [ara(P0[0], P1[0], g), P0[1], 0], bas: (10 + 5 * yuz) * (1 - g) }; };
    const barNoktasi = s => [(s.eA[0] + s.eB[0]) / 2, (s.eA[1] + s.eB[1]) / 2, 0];
    const KANCA_Y = Math.round(B0[1] - 5), KAFES_X = 66;
    const ayaklar = { ayakA: { hedef: [AYAK_X, AYAK_Y, AYAK_Z], kutup: [0.98, 0, 0.2] }, ayakB: { hedef: [AYAK_X, AYAK_Y, -AYAK_Z], kutup: [0.98, 0, -0.2] } };
    return {
      ad: 'Ayakta omuz presi (bar)', kamera: [-35, 10], seritKameralar: [[0, 0], [-35, 10], [90, 6]], merkez: [0, 0, 0],
      poz: t => { const d = durum(t); return { ...AYAKTA(d.P, [0, d.fi]), ayakA: -8, ayakB: 8, bas: d.bas }; },
      // dirsekler başta barın altında ve öne (ön kol dik), tepede yana-aşağı
      uclar: t => { const d = durum(t); return () => {
        const kol = i => ({ hedef: ekle(d.bar, Z, i * TUTUS), kutup: [0.6, -1, i * 0.5], ...tut(Z, 1.4, 'ileri') });
        return { A: kol(1), B: kol(-1), ...ayaklar }; }; },
      ekipman: (pr, s) => [...squatKafesi(pr, KAFES_X, KANCA_Y), ...M.halter(pr, barNoktasi(s))],
      izlenen: 'eA',
      kisit: { ortakBar: true, ayaklar: 'yerde', dizYonu: [1, 0, 0],
        ozel: [
          { ad: `tepede bar ayak ortasının ve omuzların üstünde (≤ ${TOL_KABA} cm)`, f: ks => { const s = ks.at(-1), b = barNoktasi(s), om = (s.omA[0] + s.omB[0]) / 2;
              return { gecti: Math.abs(b[0] - ORTA) <= TOL_KABA && Math.abs(b[0] - om) <= TOL_KABA, olcum: `ayak ortasına ${(b[0] - ORTA).toFixed(1)} · omuza ${(b[0] - om).toFixed(1)}` }; } },
          { ad: 'tepede kollar kilitli (dirsek ≤ 10°)', f: ks => { const s = ks.at(-1), m = Math.max(...['A', 'B'].map(y => 180 - aciOf(s[`om${y}`], s[`d${y}`], s[`e${y}`])));
              return { gecti: m <= 10, olcum: `${m.toFixed(1)}°` }; } },
          { ad: 'bar yolu dikeye yakın (yatay sapma ≤ 6 cm, yüzün önünden)', f: ks => { const x = ks.map(s => barNoktasi(s)[0]), a = Math.min(...x), c = Math.max(...x);
              return { gecti: c - a <= 6, olcum: `sapma ${(c - a).toFixed(1)}` }; } },
          { ad: 'bar yüze/başa girmiyor (baş küresi 10 cm + bar)', f: ks => { let en = Infinity, yer = 0;
              for (const s of ks) { const b = barNoktasi(s), d = Math.hypot(b[0] - s.kafa[0], b[1] - s.kafa[1]) - 10 - 1.4; if (d < en) { en = d; yer = s.t; } }
              return { gecti: en >= 0, olcum: `en yakın ${en.toFixed(1)} (t=${yer.toFixed(2)})` }; } },
          { ad: 'gövde dikten en çok 10° (bel aşırı kavislenmiyor)', f: ks => { const m = Math.max(...ks.map(s => Math.acos(s.g[1]) * 180 / Math.PI));
              return { gecti: m <= 10, olcum: `en fazla ${m.toFixed(1)}°` }; } },
          ozelAgm(barNoktasi, AYAK_X),
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

/**
 * AVATAR DURUŞU (13 Eki, Profil ve avatar ekranı): DURAN tek poz — hamlenin başı (ayakta, eller belde). Hareketin
 * kendisiyle çerçeve bütün anları kapsıyordu (ileri adım dahil) → avatar yana kayıyor, dönünce merkezinden sapıyordu
 * (Sabri, mokap). Merkez gövdenin dikey ekseni: 'donen' çerçeveyle ortada, kendi ekseninde döner.
 */
export const AVATAR_DURUS = (() => { const h = KUTUPHANE.lunge;
  return { ...h, ad: 'Avatar duruşu', dongu: false, merkez: [0, 0, 0], kamera: [30, 8], poz: () => h.poz(0), uclar: () => h.uclar(0) }; })();
