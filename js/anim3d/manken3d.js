/**
 * 3B KAPSÜL MANKEN — MOKAP MOTORU (uygulama koduna BAĞLI DEĞİL)
 *
 * ── ÇİZİM ────────────────────────────────────────────────────────────────
 * Ağustos'taki izometrik prototip (tools/proto-izometrik.mjs) 3B iskeleti
 * doğru hesaplıyordu ama ÇİZGİ çiziyordu; çizgi figürde göz derinliği okuyamaz.
 * Burada üç derinlik ipucu var, hepsi SVG, bağımlılıksız:
 *   1. HACİM  — her uzuv bir KAPSÜL; kapsülün dik izdüşümü tam olarak
 *               yuvarlak uçlu kalın çizgidir → hacim bedava.
 *   2. ÖRTME  — kapsüller uzaktan yakına sıralanır, altlarında zemin renginde kontur.
 *   3. ZEMİN  — disk + gölge; yakın uzuv açık, uzak uzuv koyu.
 *
 * ── HAREKET: "EKİPMAN SÜRER, BEDEN TAKİP EDER" (24 Eyl, 2. tur) ──────────
 * ⚠️ İlk mokapta kollar İKİ ANAHTAR KAREDE eklem açısıyla yazılıp açılar ayrı
 * ayrı ara değerleniyordu. Sabri gözle yakaladı: bench press'te aynı barı
 * tutan iki elin arası 49,2 ↔ 88,0 oynuyordu. Ölçülünce aynı SINIFTAN ikinci
 * kusur çıktı: reverse fly'da makine kolunun boyu 32,4 ↔ 78,0 (demir kol uzuyordu).
 * Kök: elleri bara / kolu makineye bağlayan HİÇBİR ŞEY yoktu; kısıt yalnız
 * çizimde "var gibi" duruyordu.
 *
 * Çözüm yapısal: hareketin kendisi EKİPMANIN yolu olarak yazılır (bar şu
 * yoldan gider, tutamak şu eksen etrafında döner). Eller o noktalara
 * bağlanır, kol İKİ KEMİKLİ TERS KİNEMATİKLE (IK) çözülür. Böylece:
 *   · iki el arası = barın tutuş genişliği → TANIM GEREĞİ sabit
 *   · kaldıraç boyu = tutamağın dönme yarıçapı → TANIM GEREĞİ sabit
 *   · uzuv boyu = IK'nın girdisi → sabit
 * Yine de "tanım gereği" bir iddiadır; fizik-denetimi.mjs her kareyi ölçer.
 */
export const rd = d => d * Math.PI / 180;
export const yon = (yaw, pitch) => [Math.cos(rd(pitch)) * Math.cos(rd(yaw)), Math.sin(rd(pitch)), -Math.cos(rd(pitch)) * Math.sin(rd(yaw))];
export const ekle = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k, p[2] + v[2] * k];
export const fark = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const nokta = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const boy = v => Math.hypot(v[0], v[1], v[2]);
export const birim = v => { const m = boy(v) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
export const ara = (a, b, t) => a + (b - a) * t;
export const mesafe = (a, b) => boy(fark(a, b));

/** Segment uzunlukları 2B motorla AYNI — ölçek değişmesin */
export const L = { torso: 60, head: 13, ua: 31, fa: 29, th: 39, sh: 37 };
export const R = { karin: 10.5, gogus: 12.5, kafa: 10, ua: 5.6, fa: 4.6, el: 4.2, th: 7.8, sh: 5.8, ayak: 3.6, omuz: 6.2, kalca: 8 };

/**
 * İKİ KEMİKLİ TERS KİNEMATİK — omuzdan (S) hedefe (T) üst kol a, ön kol b.
 * `kutup`: dirseğin bakacağı yön (ör. dışarı-aşağı). Hedef ulaşılamazsa el
 * erişebildiği en yakın noktada kalır ve `ulasti: false` döner — denetim bunu
 * "el ekipmanda değil" diye YAKALAR (sessizce uzatmaz).
 */
export function ik2(S, T, a, b, kutup) {
  const v = fark(T, S), d0 = boy(v), u = birim(v);
  const d = Math.min(Math.max(d0, Math.abs(a - b) + 1e-3), a + b - 1e-3);
  const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  // kutbun u'ya dik bileşeni dirseğin açılacağı yönü verir
  const w = birim(fark(kutup, ekle([0, 0, 0], u, nokta(kutup, u))));
  const dirsek = ekle(ekle(S, u, a * cosA), w, a * sinA);
  return { dirsek, el: ekle(S, u, d), ulasti: Math.abs(d - d0) < 0.05 };
}

/* ── Poz → iskelet ────────────────────────────────────────────────────────
 * Beden (gövde, bacaklar) açılarla: P [x,y,z] kalça merkezi · g [yaw,pitch]
 * gövde yönü · yan [yaw,pitch] omuz ekseni · thA shA thB shB [yaw,pitch].
 * Kollar: `eller(govde)` verilirse IK ile (ekipmana bağlı), yoksa açıyla.
 */
export function iskelet(p, uclar) {
  const P = p.P, g = yon(...p.g), yan = yon(...p.yan);
  const boyun = ekle(P, g, L.torso), kafa = ekle(boyun, g, L.head + 1);
  const gogusAlt = ekle(P, g, 24);
  const omA = ekle(ekle(boyun, yan, 14), g, -5), omB = ekle(ekle(boyun, yan, -14), g, -5);
  const kaA = ekle(P, yan, 8.5), kaB = ekle(P, yan, -8.5);
  const capraz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const yuz = p.yuz ? yon(...p.yuz) : birim(capraz(g, yan));        // yüzün baktığı yön
  const s = { P, g, yan, yuz, boyun, kafa, gogusAlt, omA, omB, kaA, kaB, ulasti: true };
  const h = uclar ? uclar(s) : {};
  // Uç (el/ayak) hedefe bağlıysa IK, değilse açıyla (FK)
  const uzuv = (kok, hedef, a, b, ust, alt, ad1, ad2) => {
    if (hedef) {
      const r = ik2(kok, hedef.hedef, a, b, hedef.kutup);
      s[ad1] = r.dirsek; s[ad2] = r.el; s.ulasti &&= r.ulasti;
    } else { s[ad1] = ekle(kok, yon(...ust), a); s[ad2] = ekle(s[ad1], yon(...alt), b); }
  };
  uzuv(omA, h.A, L.ua, L.fa, p.uaA, p.faA, 'dA', 'eA');
  uzuv(omB, h.B, L.ua, L.fa, p.uaB, p.faB, 'dB', 'eB');
  uzuv(kaA, h.ayakA, L.th, L.sh, p.thA, p.shA, 'zA', 'aA');
  uzuv(kaB, h.ayakB, L.th, L.sh, p.thB, p.shB, 'zB', 'aB');
  // Ayak (bilek → parmak ucu): her ayak kendi yönünde; [yaw,pitch] ya da yalnız yaw
  const ayakYon = v => Array.isArray(v) ? yon(...v) : yon(v ?? 0, 0);
  s.uA = ekle(s.aA, ayakYon(p.ayakA ?? p.ayak), 9);
  s.uB = ekle(s.aB, ayakYon(p.ayakB ?? p.ayak), 9);
  s.hedef = h;
  return s;
}

/** İki poz arası: [yaw,pitch] çiftleri ve koordinatlar doğrusal */
export function pozAra(A, B, t) {
  const o = {};
  for (const k in A) o[k] = Array.isArray(A[k]) ? A[k].map((v, i) => ara(v, B[k]?.[i] ?? v, t)) : A[k];
  return o;
}

/** Bir hareketin t anındaki iskeleti — `poz(t)` ya da a/b ara değeri + `uclar(t)` (IK hedefleri) */
export const an = (h, t) => Object.assign(iskelet(h.poz ? h.poz(t) : pozAra(h.a, h.b ?? h.a, t), h.uclar?.(t)), { t });

/* ── Kamera ──────────────────────────────────────────────────────────────── */
export function kamera(teta, fi) {
  const cT = Math.cos(rd(teta)), sT = Math.sin(rd(teta)), cF = Math.cos(rd(fi)), sF = Math.sin(rd(fi));
  const f = ([x, y, z]) => {
    const x1 = x * cT - z * sT, z1 = x * sT + z * cT;
    return [x1, -(y * cF - z1 * sF), y * sF + z1 * cF];      // [ekranX, ekranY, derinlik (büyük = yakın)]
  };
  f.yon = [sT * cF, sF, cT * cF];                             // derinliğin arttığı yön = kameraya doğru
  return f;
}

/* ── Sahne öğeleri: { d: derinlik, svg } — sonunda derinliğe göre sıralanır ── */
const f1 = n => n.toFixed(1);
export function kapsul(pr, a, b, r, renk, kontur = '#0A0B0D') {
  const A = pr(a), B = pr(b);
  const cizgi = (w, c) => `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="${c}" stroke-width="${f1(w)}" stroke-linecap="round"/>`;
  return { d: (A[2] + B[2]) / 2, svg: cizgi(2 * r + 3, kontur) + cizgi(2 * r, renk),
           geo: { tur: 'k', a2: [A[0], A[1]], b2: [B[0], B[1]], a3: a, b3: b, r, minY: Math.min(a[1], b[1]) - r, maxY: Math.max(a[1], b[1]) + r } };
}
export function kure(pr, c, r, renk, kontur = '#0A0B0D') {
  const C = pr(c);
  return { d: C[2], svg: `<circle cx="${f1(C[0])}" cy="${f1(C[1])}" r="${f1(r + 1.5)}" fill="${kontur}"/><circle cx="${f1(C[0])}" cy="${f1(C[1])}" r="${f1(r)}" fill="${renk}"/>`,
           geo: { tur: 's', c2: [C[0], C[1]], c3: c, r, minY: c[1] - r, maxY: c[1] + r } };
}
export function cokgen(pr, noktalar, dolgu, kontur = '#0A0B0D') {
  const P = noktalar.map(pr);
  return { d: P.reduce((s, p) => s + p[2], 0) / P.length, dMin: Math.min(...P.map(p => p[2])),
           svg: `<polygon points="${P.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="${dolgu}" stroke="${kontur}" stroke-width="1.5" stroke-linejoin="round"/>`,
           geo: { tur: 'p', P2: P.map(p => [p[0], p[1]]), P3: noktalar } };
}
/** Kutu: yalnız kameraya bakan yüzler; üst yüz daha açık (ışık yukarıdan) */
export function kutu(pr, [x0, x1], [y0, y1], [z0, z1], ton = { ust: '#343a42', yan: '#23282e' }) {
  const V = (x, y, z) => [x, y, z];
  const yuzler = [
    { n: [0, 1, 0], p: [V(x0, y1, z0), V(x1, y1, z0), V(x1, y1, z1), V(x0, y1, z1)], c: ton.ust },
    { n: [0, -1, 0], p: [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1)], c: ton.yan },
    { n: [1, 0, 0], p: [V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), V(x1, y0, z1)], c: ton.yan },
    { n: [-1, 0, 0], p: [V(x0, y0, z0), V(x0, y1, z0), V(x0, y1, z1), V(x0, y0, z1)], c: ton.yan },
    { n: [0, 0, 1], p: [V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)], c: ton.yan },
    { n: [0, 0, -1], p: [V(x0, y0, z0), V(x1, y0, z0), V(x1, y1, z0), V(x0, y1, z0)], c: ton.yan },
  ];
  const o = pr([0, 0, 0]);
  return yuzler.filter(y => pr(y.n)[2] - o[2] > 1e-6).map(y => ({ ...cokgen(pr, y.p, y.c, '#0A0B0D'),
    ...(y.n[1] > 0.7 && { ustYuz: true, Y: y1 }) }));
}
/**
 * YÖNLÜ KUTU — eğik sırt minderi, 45° kızak gibi eksene paralel OLMAYAN parçalar.
 * `eksen` = [u, v, n] birim vektörleri, `boyut` = [w, h, d]; merkez etrafında.
 */
export function kutuY(pr, merkez, [u, v, n], [w, h, d], ton = { ust: '#343a42', yan: '#23282e' }) {
  const K = (a, b, c) => ekle(ekle(ekle(merkez, u, a * w / 2), v, b * h / 2), n, c * d / 2);
  const yuzler = [
    { nrm: v, p: [K(-1, 1, -1), K(1, 1, -1), K(1, 1, 1), K(-1, 1, 1)], c: ton.ust },
    { nrm: v.map(x => -x), p: [K(-1, -1, -1), K(1, -1, -1), K(1, -1, 1), K(-1, -1, 1)], c: ton.yan },
    { nrm: u, p: [K(1, -1, -1), K(1, 1, -1), K(1, 1, 1), K(1, -1, 1)], c: ton.yan },
    { nrm: u.map(x => -x), p: [K(-1, -1, -1), K(-1, 1, -1), K(-1, 1, 1), K(-1, -1, 1)], c: ton.yan },
    { nrm: n, p: [K(-1, -1, 1), K(1, -1, 1), K(1, 1, 1), K(-1, 1, 1)], c: ton.ust },
    { nrm: n.map(x => -x), p: [K(-1, -1, -1), K(1, -1, -1), K(1, 1, -1), K(-1, 1, -1)], c: ton.yan },
  ];
  const o = pr([0, 0, 0]);
  return yuzler.filter(y => pr(y.nrm)[2] - o[2] > 1e-6).map(y => ({ ...cokgen(pr, y.p, y.c),
    ...(y.nrm[1] > 0.9 && { ustYuz: true, Y: y.p.reduce((a, q) => a + q[1], 0) / 4 }) }));   // yalnız YATAYA yakın yüz taşıyıcıdır (0,7 iken 45° kızak kenarı da sayılıyordu)
}
/** Dambıl: tutamak `eksen` boyunca, iki uçta plaka */
export function dambil(pr, el, eksen, uz = 14, r = 5.5) {
  const e = birim(eksen), a = ekle(el, e, -uz / 2), b = ekle(el, e, uz / 2);
  return [kapsul(pr, a, b, 1.6, '#737b85'), disk(pr, a, e, r, '#4b525b'), disk(pr, b, e, r, '#4b525b'),
          disk(pr, ekle(a, e, -2.2), e, r, '#434951'), disk(pr, ekle(b, e, 2.2), e, r, '#434951')];
}
/** Kablo: ince çizgi (makaradan tutamağa) */
export const kablo = (pr, a, b) => kapsul(pr, a, b, 0.7, '#8a929c', '#0A0B0D');
/** Makara: küçük disk */
export const makara = (pr, c, eksen = [0, 0, 1]) => disk(pr, c, eksen, 4, '#5d646d');

/** Disk (halter plakası): eksenine dik düzlemde daire */
export function disk(pr, c, eksen, r, dolgu = '#4b525b') {
  const e = eksen, u = Math.abs(e[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const v1 = cr(e, u), v2 = cr(e, v1);
  const P = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * 2 * Math.PI; return ekle(ekle(c, v1, r * Math.cos(a)), v2, r * Math.sin(a)); });
  return cokgen(pr, P, dolgu, '#0A0B0D');
}

/* ── Figür ──────────────────────────────────────────────────────────────── */
const YAKIN = [205, 209, 215], UZAK = [78, 85, 94];
const ton = k => `rgb(${YAKIN.map((v, i) => Math.round(ara(UZAK[i], v, k))).join(',')})`;

/**
 * Figürün sahne öğeleri.
 *
 * ⚠️ EKLEM ATLAMASI (24 Eyl, Sabri gözle buldu): her parça ayrı kapsül + ayrı
 * kontur olarak çiziliyor ve her karede derinliğe göre YENİDEN sıralanıyordu.
 * Bacak önden arkaya geçerken uyluk ile baldırın sırası yer değiştiriyor, dizdeki
 * koyu ek yeri uyluğun ucundan baldırın ucuna ATLIYORDU (ölçüldü: t=0,05 uyluk
 * üstte, t=0,95 baldır üstte). Parça başına derinlik tonu da eklemde ton sınırı
 * yaratıp aynı anda atlıyordu. Fizik değil, çizim kusuru.
 *
 * Standart çözümler: 3B'de sürekli (deri geçirilmiş) yüzey + piksel başına
 * görünürlük; 2B parça animasyonunda sabit katman sırası + eklem örtüsü. Burada:
 *   1. ZİNCİR TONU — bir uzuv (uyluk-baldır-ayak) boyunca TEK ton
 *   2. EKLEM ÖRTÜSÜ — iki komşu parça çizildikten sonra eklemin üstünden
 *      KONTURSUZ dolgu geçer: hangi parça üstte olursa olsun ek yeri görünmez.
 * Parçalar ARASI derinlik sıralaması korunur (gövdenin önüne geçen ön kol için gerekli).
 */
export function figurOgeleri(pr, s) {
  const parca = [                                                     // [zincir, tür, a, b, r]
    ['govde', 'k', s.P, s.gogusAlt, R.karin], ['govde', 'k', s.gogusAlt, s.boyun, R.gogus],       // 0 1
    ['govde', 'k', s.omA, s.omB, R.omuz], ['govde', 'k', s.kaA, s.kaB, R.kalca],                  // 2 3
    ['govde', 'k', s.boyun, s.kafa, 4.5], ['govde', 's', s.kafa, null, R.kafa],                   // 4 5
    ['kolA', 'k', s.omA, s.dA, R.ua], ['kolA', 'k', s.dA, s.eA, R.fa], ['kolA', 's', s.eA, null, R.el],   // 6 7 8
    ['kolB', 'k', s.omB, s.dB, R.ua], ['kolB', 'k', s.dB, s.eB, R.fa], ['kolB', 's', s.eB, null, R.el],   // 9 10 11
    ['bacakA', 'k', s.kaA, s.zA, R.th], ['bacakA', 'k', s.zA, s.aA, R.sh], ['bacakA', 'k', s.aA, s.uA, R.ayak], // 12 13 14
    ['bacakB', 'k', s.kaB, s.zB, R.th], ['bacakB', 'k', s.zB, s.aB, R.sh], ['bacakB', 'k', s.aB, s.uB, R.ayak], // 15 16 17
  ];
  const d = parca.map(p => p[1] === 'k' ? (pr(p[2])[2] + pr(p[3])[2]) / 2 : pr(p[2])[2]);
  const mn = Math.min(...d), mx = Math.max(...d), k = v => mx - mn < 1e-6 ? 1 : 0.15 + 0.85 * (v - mn) / (mx - mn);
  const zton = {};
  for (const z of new Set(parca.map(p => p[0]))) {
    const ix = parca.map((p, i) => (p[0] === z ? i : -1)).filter(i => i >= 0);
    zton[z] = ton(k(ix.reduce((a, i) => a + d[i], 0) / ix.length));
  }
  const og = parca.map(p => (p[1] === 'k' ? kapsul(pr, p[2], p[3], p[4], zton[p[0]]) : kure(pr, p[2], p[4], zton[p[0]])));
  og[5] = { ...og[5], svg: kafaSvg(pr, s, zton.govde) };            // kafa: yön taşıyan yumurta biçimi

  // Eklem örtüsü: J'den her komşu parça yönünde kontursuz dolgu; iki parçadan SONRA çizilir
  const ortu = (J, kollar, zincir, parcalar, disk = 0) => {
    const L = Math.max(...kollar.map(x => x[1])) + 2.5, A = pr(J), renk = zton[zincir];
    let svg = disk ? `<circle cx="${f1(A[0])}" cy="${f1(A[1])}" r="${f1(disk)}" fill="${renk}"/>` : '';
    for (const [u, r] of kollar) {
      const v = birim(fark(u, J)), B = pr(ekle(J, v, Math.min(L, mesafe(u, J))));
      svg += `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="${renk}" stroke-width="${f1(2 * r)}" stroke-linecap="round"/>`;
    }
    return { d: Math.max(...parcalar.map(i => d[i])) + 0.01, svg };
  };
  og.push(
    ortu(s.gogusAlt, [[s.P, R.karin], [s.boyun, R.gogus]], 'govde', [0, 1]),
    ortu(s.boyun, [[s.gogusAlt, R.gogus], [s.kafa, 4.5]], 'govde', [1, 4]),
    ortu(s.dA, [[s.omA, R.ua], [s.eA, R.fa]], 'kolA', [6, 7]), ortu(s.dB, [[s.omB, R.ua], [s.eB, R.fa]], 'kolB', [9, 10]),
    ortu(s.zA, [[s.kaA, R.th], [s.aA, R.sh]], 'bacakA', [12, 13]), ortu(s.zB, [[s.kaB, R.th], [s.aB, R.sh]], 'bacakB', [15, 16]),
    ortu(s.aA, [[s.zA, R.sh], [s.uA, R.ayak]], 'bacakA', [13, 14]), ortu(s.aB, [[s.zB, R.sh], [s.uB, R.ayak]], 'bacakB', [16, 17]),
    // Uzuv kökleri (omuz, kalça): uzuv, gövde çubuğunun ÜSTÜNDE yuvarlak biter — sıra ne olursa olsun
    ortu(s.omA, [[s.dA, R.ua]], 'kolA', [2, 6], R.ua), ortu(s.omB, [[s.dB, R.ua]], 'kolB', [2, 9], R.ua),
    ortu(s.kaA, [[s.zA, R.th]], 'bacakA', [3, 12], R.th), ortu(s.kaB, [[s.zB, R.th]], 'bacakB', [3, 15], R.th),
  );
  return og.map(o => ({ ...o, figur: true }));
}

/**
 * KAFA — ⚠️ tam küre her açıdan AYNI göründüğü için yön taşımıyordu (24 Eyl, Sabri).
 * İlk çare (kafatası dairesi + çene dairesi + burun çubuğu) de REDDEDİLDİ — "mutasyon gibi"
 * (24 Eyl, Sabri). Kök geometrik: iki kesişen dairenin birleşimi iki İÇBÜKEY ÇENTİK üretir
 * ve öndeki çentik tam yüz hizasına düşer; burun çubuğu o çentikten çıkıyordu.
 * Çözüm çizim mankeni geleneği (Loomis / lay figure): YÜZSÜZ tek siluet — iki dairenin
 * DIŞ TEĞETLERLE dışbükey zarfı. Öne-aşağı sivrilen yumurta, yönü çene çıkıntısı taşır;
 * yüz ayrıntısı YOK (düşük çözünürlükte yüz ayrıntısı en çok bozulan şeydir).
 */
function kafaSvg(pr, s, renk) {
  const f = s.yuz, g = s.g;
  const K = pr(ekle(ekle(s.kafa, g, 1.2), f, -1.2)), C = pr(ekle(ekle(s.kafa, f, 3.4), g, -4.4));
  const yol = kafaZarfi([K[0], K[1]], 9.6, [C[0], C[1]], 6.4, 1.5);
  return `<path d="${yol.dis}" fill="#0A0B0D"/><path d="${yol.ic}" fill="${renk}"/>`;
}

/**
 * İki dairenin dışbükey zarfı (SVG yolu) — `pay` kadar büyütülmüş hâli kontur olur.
 * d ≤ |r1−r2| ise küçük daire büyüğün içindedir → yalnız büyük daire.
 */
export function kafaZarfi(c1, r1, c2, r2, pay = 0) {
  const tek = (c, r) => `M${f1(c[0] - r)},${f1(c[1])}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0Z`;
  const cz = (a, b) => {
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy);
    if (d <= Math.abs(a - b) + 1e-6) return a >= b ? tek(c1, a) : tek(c2, b);
    const ux = dx / d, uy = dy / d, sa = (a - b) / d, ca = Math.sqrt(1 - sa * sa);
    const n = k => [sa * ux - k * ca * uy, sa * uy + k * ca * ux];      // teğet normali (u⊥ = [−uy, ux])
    const [np, nm] = [n(1), n(-1)];
    const T = (c, r, m) => `${f1(c[0] + r * m[0])},${f1(c[1] + r * m[1])}`;
    // c2 tarafındaki yay kısa (≤180°), c1 tarafındaki uzun; ikisi de açıyı AZALTAN yönde (sweep 0)
    return `M${T(c1, a, np)}L${T(c2, b, np)}A${f1(b)},${f1(b)} 0 0,0 ${T(c2, b, nm)}L${T(c1, a, nm)}A${f1(a)},${f1(a)} 0 1,0 ${T(c1, a, np)}Z`;
  };
  return { dis: cz(r1 + pay, r2 + pay), ic: cz(r1, r2) };
}

export function zemin(pr, merkez, r = 78) {
  const P = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * 2 * Math.PI; return pr([merkez[0] + r * Math.cos(a), 0, merkez[2] + r * Math.sin(a)]); });
  return `<polygon points="${P.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="#13161a"/>`;
}
export function golge(pr, noktalar) {
  const bas = Math.max(0.15, Math.abs(pr([0, 0, 1])[1] - pr([0, 0, 0])[1]));
  return noktalar.map(n => { const C = pr([n[0], 0, n[2]]); return `<ellipse cx="${f1(C[0])}" cy="${f1(C[1])}" rx="16" ry="${f1(16 * bas)}" fill="#050607" opacity=".55"/>`; }).join('');
}
export function iz(pr, yol, renk = '#7a4a52') {
  const P = yol.map(pr);
  const son = P.at(-1), onc = P.at(-3);
  const vx = son[0] - onc[0], vy = son[1] - onc[1], m = Math.hypot(vx, vy) || 1, ux = vx / m, uy = vy / m;
  const ok = `${f1(son[0] - 8 * ux + 4 * uy)},${f1(son[1] - 8 * uy - 4 * ux)} ${f1(son[0])},${f1(son[1])} ${f1(son[0] - 8 * ux - 4 * uy)},${f1(son[1] - 8 * uy + 4 * ux)}`;
  return `<polyline points="${P.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="none" stroke="${renk}" stroke-width="2.2" stroke-dasharray="4 4"/><polyline points="${ok}" fill="none" stroke="${renk}" stroke-width="2.2" stroke-linejoin="round"/>`;
}

/* ══ HAREKETLER ══════════════════════════════════════════════════════════
 * `kisit` alanı fizik-denetimi.mjs'nin neyi sınayacağını söyler. Kısıt,
 * HAREKETİN KENDİSİNE yazılır — denetim onu tahmin etmez. */
const ease = t => t * t * (3 - 2 * t);

/* BENCH PRESS — bar sehpaya dik düzlemde hafif J yolu çizer (altta göğsün alt
   kısmında, üstte omuzların üstünde). Eller barda SABİT genişlikte. */
const BENCH_TUTUS = 26;                        // yarım tutuş: omuz yarı-genişliği 14 → tutuş ≈ 1,9× omuz
const BENCH_UST = 38.5;                        // sehpa üst yüzü
const benchBar = t => [ara(-35, -45, 1 - (1 - t) ** 2), ara(65.5, 106, ease(t)), 0];

/* REVERSE PEC FLY — makinenin her kolu omuz ekleminin DÜŞEY EKSENİ etrafında
   döner (makine ayarının kuralı: "omzu dönme ekseniyle hizala"). Tutamak o
   eksenden sabit yarıçapta; el tutamakta. Göğüs pede yaslı, ayaklar yerde. */
const FLY_R = 58.5;                            // tutamağın eksene uzaklığı → dirsek ~25° bükük (54 iken 51,6° ölçüldü: 'hafif' değildi)
const FLY_UST = 132;                           // makine üst kirişi
const flyAci = t => ara(-8, 92, ease(t));      // -8 = eller önde yakın (−12 iken eller İÇ İÇE girdi, ölçüldü), 92 = yana açık

export const HAREKETLER = {
  bench: {
    ad: 'Barbell Bench Press', ref: 'bb_bench_press',
    kamera: [28, 22], seritKameralar: [[0, 0], [28, 22], [72, 34]],
    merkez: [-20, 0, 0],
    a: { P: [8, 50, 0], g: [180, 0], yan: [90, 0], yuz: [0, 90], ayak: 0,
         thA: [25, -12], shA: [25, -85], thB: [-25, -12], shB: [-25, -85] },
    uclar: t => {
      const b = benchBar(t);
      return () => ({
        A: { hedef: [b[0], b[1], -BENCH_TUTUS], kutup: [0.4, -0.6, -0.7] },   // dirsek dışarı-aşağı, hafif ayağa doğru (45°)
        B: { hedef: [b[0], b[1], BENCH_TUTUS], kutup: [0.4, -0.6, 0.7] },
      });
    },
    ekipman(pr, s, t) {
      const b = benchBar(t), o = [];
      o.push(...kutu(pr, [-80, 18], [BENCH_UST - 6, BENCH_UST], [-13, 13], { ust: '#3a4149', yan: '#272c33' }));
      o.push(...kutu(pr, [-72, -64], [0, BENCH_UST - 6], [-8, 8]));
      o.push(...kutu(pr, [4, 12], [0, BENCH_UST - 6], [-8, 8]));
      o.push(kapsul(pr, [b[0], b[1], -52], [b[0], b[1], 52], 1.8, '#737b85', '#0A0B0D'));
      o.push(disk(pr, [b[0], b[1], 42], [0, 0, 1], 14));
      o.push(disk(pr, [b[0], b[1], -42], [0, 0, 1], 14));
      return o;
    },
    izlenen: 'eB',
    kisit: {
      ortakBar: true,                                                  // iki el aynı barda
      ayaklar: 'yerde',
      temas: [
        { ad: 'sırt sehpada', f: s => (s.gogusAlt[1] - R.gogus) - BENCH_UST, aralik: [-2, 2] },
        { ad: 'baş sehpada', f: s => (s.kafa[1] - R.kafa) - BENCH_UST, aralik: [-2, 3] },
      ],
    },
  },
  reverseFly: {
    ad: 'Reverse Pec Fly', ref: 'machine_reverse_fly',
    kamera: [-40, 34], seritKameralar: [[-90, 4], [-40, 34], [55, 30]],
    merkez: [8, 0, 0],
    a: { P: [0, 44, 0], g: [0, 84], yan: [-90, 0], ayak: 0,
         thA: [-8, -5], shA: [-8, -88], thB: [8, -5], shB: [8, -88] },
    uclar: t => {
      const f = rd(flyAci(t));
      return s => ({
        // Dirsekler YUKARIDA (omuz iç rotasyonda): ExRx — dirsek omuz hizasının altına düşmez
        A: { hedef: [s.omA[0] + FLY_R * Math.cos(f), s.omA[1] - 2, s.omA[2] + FLY_R * Math.sin(f)], kutup: [-0.4, 0.5, 0.8] },
        B: { hedef: [s.omB[0] + FLY_R * Math.cos(f), s.omB[1] - 2, s.omB[2] - FLY_R * Math.sin(f)], kutup: [-0.4, 0.5, -0.8] },
      });
    },
    eksenler: s => [[s.omA[0], FLY_UST, s.omA[2]], [s.omB[0], FLY_UST, s.omB[2]]],
    ekipman(pr, s) {
      const o = [];
      o.push(...kutu(pr, [-16, 12], [30, 36], [-14, 14], { ust: '#3a4149', yan: '#272c33' }));   // oturak
      o.push(...kutu(pr, [-4, 4], [0, 30], [-4, 4]));                                           // oturak direği
      o.push(...kutu(pr, [16.5, 22.5], [55, 88], [-11, 11], { ust: '#3a4149', yan: '#2c323a' })); // göğüs pedi
      o.push(...kutu(pr, [28, 34], [0, FLY_UST], [-4, 4]));                                     // kolon
      const [pA, pB] = this.eksenler(s);
      o.push(kapsul(pr, [31, FLY_UST, 0], pA, 2.4, '#5d646d', '#0A0B0D'));                      // üst kiriş → eksenler
      o.push(kapsul(pr, [31, FLY_UST, 0], pB, 2.4, '#5d646d', '#0A0B0D'));
      for (const [eks, el] of [[pA, s.eA], [pB, s.eB]]) {
        const ust = [el[0], FLY_UST, el[2]];
        o.push(kapsul(pr, eks, ust, 2.2, '#5d646d', '#0A0B0D'));                                // kaldıraç (sabit boy)
        o.push(kapsul(pr, ust, [el[0], el[1] + 7, el[2]], 1.8, '#5d646d', '#0A0B0D'));          // iniş
        o.push(kapsul(pr, [el[0], el[1] - 7, el[2]], [el[0], el[1] + 7, el[2]], 2.6, '#8a929c', '#0A0B0D')); // tutamak
      }
      return o;
    },
    izlenen: 'eA',
    kisit: {
      kaldirac: true,                                                  // tutamak eksenden sabit yarıçapta
      dirsek: { aralik: [10, 35], sabit: true },                       // fly'ın tanımı: dirsek hafif bükük ve DEĞİŞMEZ
      ayaklar: 'yerde',
      temas: [
        { ad: 'kalça oturakta', f: s => (s.P[1] - R.kalca) - 36, aralik: [-1.5, 1.5] },
        { ad: 'göğüs pedde', f: s => {                                  // pedin yüksekliğinin ortasında göğüs yüzeyi ↔ ped arka yüzü
            const y = 72, k = (y - s.gogusAlt[1]) / (s.boyun[1] - s.gogusAlt[1]);
            return 16.5 - (ara(s.gogusAlt[0], s.boyun[0], k) + R.gogus);
          }, aralik: [-2, 2] },
      ],
    },
  },
};

/** Bir kareyi çiz — öğe sayısını ve süreyi de döndürür (ölçüm) */
/** Sahnenin çizim sırası — sahne() ile görünürlük denetimi AYNI fonksiyonu kullanır */
/* ── GÖRÜNÜRLÜK DÜZELTMESİ ────────────────────────────────────────────────
 * ⚠️ Ressam sıralaması (orta noktanın derinliği) büyük yatay yüzeylerde yanılır:
 * sehpanın üst yüzü bazı açılarda üstünde yatan başı ÖRTÜYORDU (24 Eyl, Sabri
 * gördü; ölçüldü: 7 harekette 317 ihlal). İlk deneme — üst yüzü en uzak köşesiyle
 * sıralamak — 317'yi 6'ya indirdi ama diz pedinde ters hata üretti: ped uyluğun
 * ÜSTÜNE bastırır, erken çizilince altındaki uyluk pedin üstüne çıktı.
 * Kalıcı çözüm kısayol değil İKİ FİZİKSEL KURAL:
 *   (a) yatay yüzey, düzleminin ÜSTÜNDEKİ bir parçayı örtemez → ondan ÖNCE çizilir
 *   (b) kameradan parçaya giden ışın yüzeyin İÇİNDEN geçiyorsa yüzey parçayı ÖRTER → ondan SONRA
 * Önce derinlik sırası, sonra her yatay yüzey bu iki kuralın izin verdiği yere taşınır. */
export const icinde = (p, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
  if (((P[i][1] > p[1]) !== (P[j][1] > p[1])) && (p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; };
const kenaraUzaklik = (p, P) => Math.min(...P.map((a, i) => { const b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1];
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy); }));
/** Beden parçası ekranda yüzeyle gerçekten üst üste biniyor mu (kenar teması sayılmaz) */
export function ustUsteMi(E, P2) {
  const noktalar = E.tur === 's' ? [E.c2] : Array.from({ length: 7 }, (_, i) => [E.a2[0] + (E.b2[0] - E.a2[0]) * i / 6, E.a2[1] + (E.b2[1] - E.a2[1]) * i / 6]);
  return noktalar.some(p => icinde(p, P2) && kenaraUzaklik(p, P2) > 1.5);
}
/** Kameradan parçaya giden ışın yatay yüzeyin içinden geçiyor mu (parça yüzeyin ALTINDA) */
export function isinYuzeydenGeciyor(E, F, V) {
  if (!(V[1] > 1e-6) || !(E.maxY < F.Y)) return false;
  const orn = E.tur === 's' ? [E.c3] : [0, 0.25, 0.5, 0.75, 1].map(u => E.a3.map((v, k) => v + (E.b3[k] - v) * u));
  const XZ = F.geo.P3.map(q => [q[0], q[2]]);
  return orn.some(X => { const l = (F.Y - X[1]) / V[1]; return icinde([X[0] + l * V[0], X[2] + l * V[2]], XZ); });
}
function gorunurlukDuzelt(ogeler, V) {
  for (const F of ogeler.filter(o => o.ustYuz)) {
    let i = ogeler.indexOf(F);
    const ust = [], alt = [];
    ogeler.forEach((E, k) => {
      if (!E.figur || !E.geo) return;
      if (E.geo.minY >= F.Y - 0.5 && ustUsteMi(E.geo, F.geo.P2)) ust.push(k);        // (a) üstündeki: F ondan ÖNCE
      else if (isinYuzeydenGeciyor(E.geo, F, V)) alt.push(k);                          // (b) altındaki: F ondan SONRA
    });
    const enErkenUst = ust.length ? Math.min(...ust) : Infinity, enGecAlt = alt.length ? Math.max(...alt) : -1;
    if (enGecAlt >= enErkenUst) continue;                        // çelişki: kurallar aynı anda sağlanamaz — dokunma
    if (i > enErkenUst) { ogeler.splice(i, 1); ogeler.splice(enErkenUst, 0, F); }                 // üstündekinden önceye al
    else if (i < enGecAlt) { ogeler.splice(i, 1); ogeler.splice(enGecAlt, 0, F); }                 // altındakinden sonraya al
  }
  return ogeler;
}
export function sahneOgeleri(h, t, pr) {
  const s = an(h, t);
  const ogeler = [...h.ekipman(pr, s, t), ...figurOgeleri(pr, s)].sort((x, y) => x.d - y.d);
  return { s, ogeler: pr.yon ? gorunurlukDuzelt(ogeler, pr.yon) : ogeler };
}

export function sahne(h, t, teta, fi) {
  const t0 = performance.now();
  const pr = kamera(teta, fi);
  const { s, ogeler } = sahneOgeleri(h, t, pr);
  const yol = Array.from({ length: 19 }, (_, i) => an(h, i / 18)[h.izlenen]);
  // Duruş hareketinde (plank) yol tek noktadır — iz çizmek anlamsız bir ok bırakırdı
  const svg = zemin(pr, h.merkez) + golge(pr, [s.P, s.aA, s.aB]) + ogeler.map(o => o.svg).join('') + (h.statik ? '' : iz(pr, yol));
  return { svg, oge: (svg.match(/<(line|circle|polygon|ellipse|polyline)/g) || []).length, ms: performance.now() - t0 };
}

/* ── ÇERÇEVE ─────────────────────────────────────────────────────────────
 * Sabit bir görüş kutusu küçük alanda (ısınma satırındaki 80×62 px) figürü boşlukta
 * kaybettirir. Çerçeve hareketin KENDİ kapladığı hacimden türetilir: bedenin eklemleri
 * ve ekipman, zamanın 13 anında. İki biçim:
 *   'sabit'  → verilen açıdan izdüşümün sıkı kutusu (dönmeyen küçük görünümler)
 *   'donen'  → hacmi saran DİKEY SİLİNDİR; θ değişince genişlik değişmez, sürüklerken
 *              figür zıplamaz ve hiçbir açıda kırpılmaz.
 * Dönen değer ekran koordinatıdır (y YUKARI): { sol, sag, ust, alt }. */
const hacimOnbellek = new WeakMap();
function hacimNoktalari(h) {
  if (hacimOnbellek.has(h)) return hacimOnbellek.get(h);
  const n = [], D = birim([0.31, 0.53, 0.79]);
  const EKLEM = ['P', 'boyun', 'gogusAlt', 'omA', 'omB', 'dA', 'dB', 'eA', 'eB', 'kaA', 'kaB', 'zA', 'zB', 'aA', 'aB', 'uA', 'uB'];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, s = an(h, t);
    for (const k of EKLEM) n.push([s[k], 8]);
    n.push([s.kafa, R.kafa + 2]);
    for (const y of [D, D.map(v => -v)]) {                       // kutular yalnız bakan yüzlerini verir → iki zıt yön
      const pr = q => [q[0], q[1], nokta(q, y)];
      for (const e of h.ekipman(pr, s, t)) {
        const g = e.geo; if (!g) continue;
        if (g.tur === 'p') for (const q of g.P3) n.push([q, 0]);
        else if (g.tur === 'k') n.push([g.a3, g.r], [g.b3, g.r]);
        else n.push([g.c3, g.r]);
      }
    }
  }
  hacimOnbellek.set(h, n);
  return n;
}
export function cerceve(h, teta, fi, bicim = 'donen', pay = 0.06) {
  const n = hacimNoktalari(h);
  let c;
  if (bicim === 'sabit') {
    const pr = kamera(teta, fi);
    c = { sol: Infinity, sag: -Infinity, ust: -Infinity, alt: Infinity };
    for (const [q, r] of n) {
      const P = pr(q), x = P[0], y = -P[1];
      c.sol = Math.min(c.sol, x - r); c.sag = Math.max(c.sag, x + r); c.ust = Math.max(c.ust, y + r); c.alt = Math.min(c.alt, y - r);
    }
  } else {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y0 = 0, y1 = -Infinity;
    for (const [q, r] of n) { x0 = Math.min(x0, q[0] - r); x1 = Math.max(x1, q[0] + r); z0 = Math.min(z0, q[2] - r); z1 = Math.max(z1, q[2] + r); y0 = Math.min(y0, q[1] - r); y1 = Math.max(y1, q[1] + r); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    let rr = 0;
    for (const [q, r] of n) rr = Math.max(rr, Math.hypot(q[0] - cx, q[2] - cz) + r);
    const cT = Math.cos(rd(teta)), sT = Math.sin(rd(teta)), cF = Math.cos(rd(fi)), sF = Math.sin(rd(fi));
    const ox = cx * cT - cz * sT, oz = (cx * sT + cz * cT) * sF;
    c = { sol: ox - rr, sag: ox + rr, ust: y1 * cF - oz + rr * Math.abs(sF), alt: y0 * cF - oz - rr * Math.abs(sF) };
  }
  const px = (c.sag - c.sol) * pay, py = (c.ust - c.alt) * pay;
  return { sol: c.sol - px, sag: c.sag + px, ust: c.ust + py, alt: c.alt - py };
}
/** Çerçeveyi kabın en-boy oranına genişlet (kırpmadan, ortalayarak) */
export function sigdir(c, oran) {
  let w = c.sag - c.sol, hh = c.ust - c.alt;
  const mx = (c.sag + c.sol) / 2, my = (c.ust + c.alt) / 2;
  if (w / hh < oran) w = hh * oran; else hh = w / oran;
  return { sol: mx - w / 2, sag: mx + w / 2, ust: my + hh / 2, alt: my - hh / 2 };
}
/** SVG viewBox (SVG'de y AŞAĞI) */
export const viewBox = c => `${c.sol.toFixed(1)} ${(-c.ust).toFixed(1)} ${(c.sag - c.sol).toFixed(1)} ${(c.ust - c.alt).toFixed(1)}`;
