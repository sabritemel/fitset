/**
 * REKORLAR ve HAFTALIK DÜZEN — saf mantık (DOM yok, Node'da test edilir: tools/test-rekorlar.js).
 *
 * Plan: docs/2026-10-14-rekorlar-ve-antrenman-ozeti-PLAN.md (K1–K4, K8). Rakip araştırması:
 *   · Rekor türleri Hevy'nin ayrımı: en ağır set · tahmini 1 tekrar maksimumu · en iyi set hacmi · (vücut ağırlığında) en çok
 *     tekrar · (sürelide) en uzun süre. Ağırlık başına tekrar rekoru yalnız listede (duyurusuz — gürültü kontrolü).
 *   · 1 tekrar maksimumu Strong gibi: Brzycki, yalnız 1–10 tekrar (üstünde tahmin bozulur); 1 tekrarda ağırlığın kendisi.
 *   · İlk kayıt rekor DEĞİL (karşılaştırılacak önceki değer yok — Hevy). Isınma setleri sayılmaz (Strong).
 *   · Rekorlar kayıtlı setlerden TÜRETİLİR, ayrıca saklanmaz: geçmiş bir set düzeltilince rekor da düzelir.
 */

/** Öncelik sırası: bir sette birden çok rekor kırılırsa duyurulan ilk tür (K4) */
export const TURLER = ['agir', 'bir', 'hacim', 'tekrar', 'sure'];
export const TUR_AD = {
  agir: 'En ağır set', bir: 'Tahmini 1 tekrar maksimumu', hacim: 'En iyi set hacmi', tekrar: 'En çok tekrar', sure: 'En uzun süre',
};
export const BIR_EN_COK_TEKRAR = 10;
const EPS = 1e-9;

/** Tahmini 1 tekrar maksimumu (Brzycki). 1–10 tekrar dışında tahmin yok → null. */
export function bir1RM(agirlik, tekrar) {
  if (!(agirlik > 0) || !(tekrar >= 1) || tekrar > BIR_EN_COK_TEKRAR) return null;
  return tekrar === 1 ? agirlik : agirlik * 36 / (37 - tekrar);
}

/** Bir setin rekor değerleri (tür → sayı). Isınma, kardiyo ve boş setler: {} */
export function setDegerleri(set) {
  if (!set || set.warmup) return {};
  if (set.type === 'time') return set.seconds > 0 ? { sure: set.seconds } : {};
  if (set.type !== 'weight_reps') return {};
  const d = {};
  if (set.weight > 0) {
    d.agir = set.weight;
    const b = bir1RM(set.weight, set.reps);
    if (b != null) d.bir = b;
    if (set.reps > 0) d.hacim = set.weight * set.reps;
  } else if (set.reps > 0) d.tekrar = set.reps;   // vücut ağırlığı (ek ağırlıksız)
  return d;
}

const zaman = s => s.finishedAt ?? s.startedAt ?? 0;

/** Bir hareketin çalışma setleri, ESKİDEN YENİYE: [{set, at, seansId}] (silinmiş seanslar çağıran tarafından süzülür) */
export function hareketSetleri(seanslar, exId) {
  const sirali = [...seanslar].sort((a, b) => zaman(a) - zaman(b));
  const out = [];
  for (const s of sirali) for (const e of s.entries ?? []) if (e.exerciseId === exId)
    for (const set of e.sets ?? []) if (!set.warmup) out.push({ set, at: set.ts ?? zaman(s), seansId: s.id });
  return out;
}

/**
 * Bir hareketin rekorları: tür → {deger, set, at}; ayrıca ağırlık başına en çok tekrar (ağırlığa göre artan).
 * @returns {{agir?, bir?, hacim?, tekrar?, sure?, tekrarlar: Array<{agirlik, tekrar, at}>}}
 */
export function rekorlar(seanslar, exId) {
  const r = { tekrarlar: [] }, agirlikBasina = new Map();
  for (const { set, at } of hareketSetleri(seanslar, exId)) {
    const d = setDegerleri(set);
    for (const t of TURLER) if (d[t] != null && !(r[t]?.deger >= d[t] - EPS)) r[t] = { deger: d[t], set, at };
    if (set.type === 'weight_reps' && set.weight > 0 && set.reps > 0) {
      const o = agirlikBasina.get(set.weight);
      if (!o || set.reps > o.tekrar) agirlikBasina.set(set.weight, { agirlik: set.weight, tekrar: set.reps, at });
    }
  }
  r.tekrarlar = [...agirlikBasina.values()].sort((a, b) => a.agirlik - b.agirlik);
  return r;
}

/** Değer listesinden tür başına en iyi (yalnız sayı) */
const enIyiler = setler => {
  const b = {};
  for (const set of setler) { const d = setDegerleri(set); for (const t of TURLER) if (d[t] != null && !(b[t] >= d[t] - EPS)) b[t] = d[t]; }
  return b;
};

/**
 * CANLI DUYURU (K4): az önce kaydedilen set bir rekor mu? Öncekiler = bu hareketin bugünden ÖNCEKİ bütün çalışma setleri +
 * bugün bu setten önce girilenler. Önceki değeri olmayan tür rekor sayılmaz (ilk kayıt). Birden çok tür kırıldıysa
 * öncelik sırasındaki İLKİ döner — tek duyuru.
 * @returns {null | {tur, once, simdi}}
 */
export function setRekoru(set, oncekiSetler) {
  const d = setDegerleri(set), b = enIyiler(oncekiSetler);
  for (const t of TURLER) if (d[t] != null && b[t] != null && d[t] > b[t] + EPS) return { tur: t, once: b[t], simdi: d[t] };
  return null;
}

/**
 * Bir seansta kırılan rekorlar, hareket başına: {exId, turler:[{tur, once, simdi}], ana} — `ana` öncelikteki ilk tür.
 * Önceki değeri olmayan türler kırılmış sayılmaz; hareketin hiç önceki kaydı yoksa `ilkler` listesine girer.
 * @param {object} seans   biten seans
 * @param {Array}  onceki  bu seanstan ÖNCEKİ bitmiş seanslar (sıra önemsiz)
 */
export function seansRekorlari(seans, onceki) {
  const kirilan = [], ilkler = [];
  for (const e of seans.entries ?? []) {
    const bugun = (e.sets ?? []).filter(s => !s.warmup);
    if (!bugun.length) continue;
    const once = onceki.flatMap(s => (s.entries ?? []).filter(x => x.exerciseId === e.exerciseId).flatMap(x => x.sets ?? []));
    const b = enIyiler(once), simdi = enIyiler(bugun);
    if (!Object.keys(b).length) { if (Object.keys(simdi).length) ilkler.push(e.exerciseId); continue; }
    const turler = TURLER.filter(t => simdi[t] != null && b[t] != null && simdi[t] > b[t] + EPS).map(t => ({ tur: t, once: b[t], simdi: simdi[t] }));
    if (turler.length) kirilan.push({ exId: e.exerciseId, turler, ana: turler[0] });
  }
  return { kirilan, ilkler };
}

/**
 * Bütün geçmişteki rekor OLAYLARI (İlerleme listesi + dönem sayımı): her seans için seansRekorlari, yeniden eskiye.
 * @returns {Array<{exId, tur, once, simdi, at, seansId}>}  her (seans, hareket) için yalnız ana tür
 */
export function rekorOlaylari(seanslar) {
  const sirali = [...seanslar].sort((a, b) => zaman(a) - zaman(b)), out = [];
  for (let i = 0; i < sirali.length; i++) {
    const { kirilan } = seansRekorlari(sirali[i], sirali.slice(0, i));
    for (const k of kirilan) out.push({ exId: k.exId, ...k.ana, at: zaman(sirali[i]), seansId: sirali[i].id });
  }
  return out.reverse();
}

/** Haftanın başı (pazartesi 00:00, yerel saat) */
export function haftaBasi(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return d.getTime();
}

/**
 * HAFTALIK DÜZEN (K8): seri sayacı YOK, kayıp mesajı YOK (bozulan seri katılımı düşürür — Silverman & Barasch 2023).
 * Şerit en çok `haftaSayisi` hafta, ama ilk antrenmanın haftasından önceye gitmez (yeni kullanıcıya boş haftalar gösterilmez).
 * @param {Array} seanslar  bitmiş seanslar
 * @param {number} hedef    haftada antrenman hedefi (Ayarlar'daki antrenman günü sayısı)
 * @returns {{buHafta, hedef, serit: Array<'tam'|'yarim'|''>, tutulan}}  serit eskiden yeniye, son eleman bu hafta
 */
export function haftalikDuzen(seanslar, hedef, simdi = Date.now(), haftaSayisi = 8) {
  const bu = haftaBasi(simdi), say = new Map();
  let ilk = Infinity;
  for (const s of seanslar) { const t = zaman(s); if (!t) continue; const h = haftaBasi(t); say.set(h, (say.get(h) ?? 0) + 1); ilk = Math.min(ilk, h); }
  const serit = [];
  for (let i = haftaSayisi - 1; i >= 0; i--) {
    const d = new Date(bu); d.setDate(d.getDate() - 7 * i);
    const h = d.getTime();
    if (h < ilk && i > 0) continue;
    const n = say.get(h) ?? 0;
    serit.push(hedef > 0 && n >= hedef ? 'tam' : n > 0 ? 'yarim' : '');
  }
  return { buHafta: say.get(bu) ?? 0, hedef, serit, tutulan: serit.filter(x => x === 'tam').length };
}

/**
 * ARDIŞIK HEDEF HAFTASI (14 Eki, hak edilmiş övgü "istikrarlısın"): bu hafta hedef tamamsa o da sayılır; değilse geçen
 * haftadan geriye. YALNIZ olumlu durumda kullanılır (≥ 4 hafta) — sayaç olarak gösterilmez, kayıp hiç söylenmez.
 */
export function ardisikTamHafta(seanslar, hedef, simdi = Date.now()) {
  if (!(hedef > 0)) return 0;
  const say = new Map();
  for (const s of seanslar) { const t = zaman(s); if (t) { const h = haftaBasi(t); say.set(h, (say.get(h) ?? 0) + 1); } }
  const onceki = h => { const d = new Date(h); d.setDate(d.getDate() - 7); return d.getTime(); };
  let h = haftaBasi(simdi), n = 0;
  if ((say.get(h) ?? 0) >= hedef) n++;
  for (h = onceki(h); (say.get(h) ?? 0) >= hedef; h = onceki(h)) n++;
  return n;
}
