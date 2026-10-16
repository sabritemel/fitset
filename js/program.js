/**
 * PROGRAM — kullanıcının antrenman planı (Faz 1A, 11 Eki 2026).
 *
 * ┌─ AYRIM ─────────────────────────────────────────────────────────────────┐
 * │ HAREKET TANIMI (kütüphane: data/exercises.js + kullanıcının özel        │
 * │ hareketleri) ile PROGRAM (hangi gün hangi hareket, kaç set × tekrar)   │
 * │ ayrıldı. Eskiden ikisi tek dizideydi (EX) ve program kodda sabitti:     │
 * │ başka biri uygulamayı kendi programıyla kullanamıyordu.                 │
 * │ Program kullanıcının VERİSİDİR: IndexedDB 'programs' tablosunda durur,  │
 * │ yedeğe girer.                                                            │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * GÖÇ: bugünkü iki günlük program "Benim programım" olur (benimProgrami). Seanslar
 * DEĞİŞMEZ: program kimliği taşımayan seans "Benim programım"a aittir (BENIM_ID).
 *
 * Saf modül: DOM ve depolama yok, Node'da test edilir (tools/test-program.js).
 */
import { EX, FIN } from './data/exercises.js';
import { WARMUP, SURE } from './data/warmup.js';

export const BENIM_ID = 'benim';
export const GRUPLAR = ['Göğüs', 'Sırt', 'Omuz', 'Kol', 'Bacak', 'Karın', 'Kardiyo'];   // 15 Eki: Kardiyo (Parti D)
export const EKIPMAN = { barbell: 'Bar', dumbbell: 'Dambıl', machine: 'Makine', cable: 'Kablo', bodyweight: 'Vücut ağırlığı', cardio: 'Kardiyo aleti' };
export const SET_TURU = { weight_reps: 'Ağırlık × tekrar', time: 'Süre', cardio: 'Kardiyo (dk)' };

/** Sınırlar — adımlayıcı ve içe aktarım doğrulaması aynı tabloyu okur */
export const SINIR = {
  sets: { en: 1, ec: 10, adim: 1 },
  reps: { en: 1, ec: 50, adim: 1 },
  seconds: { en: 5, ec: 600, adim: 5 },
  minutes: { en: 1, ec: 180, adim: 5 },
  // G1 (17 Eki): tekrar aralığının alt sınırı · hedef RIR (setin sonunda kaç temiz tekrar daha) · hareket başına dinlenme (sn)
  repsMin: { en: 1, ec: 50, adim: 1 },
  rir: { en: 0, ec: 5, adim: 1 },
  dinlenme: { en: 15, ec: 600, adim: 15 },
};
/** Program kaleminin İSTEĞE BAĞLI yöntem alanları (G1) — yoksa hareketin/ayarın varsayılanı geçerli */
export const YONTEM_ALANLARI = ['repsMin', 'rir', 'dinlenme'];
export const EN_COK_GUN = 7;
export const EN_COK_HAREKET = 30;
export const AD_UZUNLUK = 60;

const KIMLIK = /^[A-Za-z0-9_-]{1,80}$/;
const yeniKimlik = on => `${on}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Bir hareketin hedef alanı — set türüne göre tek alan */
export const hedefAlani = setType => setType === 'time' ? 'seconds' : setType === 'cardio' ? 'minutes' : 'reps';

/**
 * PROGRAM KALEMİ: hareketin BU programdaki hedefi. Hareket tanımı (adı, anlatımı, 3B çizimi)
 * kalemde DURMAZ — kütüphaneden kimlikle okunur; böylece bir hareketin anlatımı düzelince
 * her programda düzelir.
 * @param {object} ex  kütüphane tanımı
 * @param {object} [o] kullanıcının hedef değişikliği (eski settings.overrides biçimi)
 */
export function kalem(ex, o = {}) {
  const k = { exId: ex.id, sets: o.sets ?? ex.sets };
  if (o.sets == null && ex.setsMin) k.setsMin = ex.setsMin;          // "2-3 × 12" etiketi korunur
  const alan = hedefAlani(ex.setType);
  k[alan] = o[alan] ?? ex.target?.[alan];
  if (o.weight != null) k.agirlik = o.weight;
  return k;
}

const BENIM_GUN_ADLARI = ['Göğüs · Omuz · Triceps', 'Sırt · Biceps · Bacak'];

/**
 * BUGÜNKÜ PROGRAM → "Benim programım". Hedef değişiklikleri (eski settings.overrides)
 * kaleme katılır; ısınma ve bitiş bugünkü günlerin kendisi kalır.
 */
export function benimProgrami(overrides = {}) {
  return {
    id: BENIM_ID, ad: 'Benim programım', guncellendi: 0,
    gunler: EX.map((gun, i) => ({
      id: 'g' + i, ad: BENIM_GUN_ADLARI[i] ?? '', isinma: i, bitis: i,
      hareketler: gun.map(ex => kalem(ex, overrides[ex.id] ?? {})),
    })),
  };
}

export const yeniGun = () => ({ id: yeniKimlik('g'), ad: '', hareketler: [] });
export const yeniProgram = (ad = 'Yeni program') => ({ id: yeniKimlik('p'), ad, guncellendi: Date.now(), gunler: [yeniGun()] });
/** Hazır programın KOPYASI (Faz 1C): yeni kimlikler; kaynak (data/hazir.js) sonradan değişse de kopya değişmez */
export function hazirdanKur(h) {
  return { id: yeniKimlik('p'), ad: h.ad, guncellendi: Date.now(),
    gunler: h.gunler.map(([ad, kalemler]) => ({ id: yeniKimlik('g'), ad, hareketler: kalemler.map(x => ({ ...x })) })) };
}

/** "1. Gün" — gün numarası programdaki SIRADIR, kayıtta saklanmaz */
export const gunKisa = i => `${i + 1}. Gün`;
/** "Göğüs · Omuz · Triceps" — gün adı yoksa günün hareketlerinin kas grupları */
export function gunKaslari(gun, cozulmus = []) {
  if (gun?.ad?.trim()) return gun.ad.trim();
  const g = [...new Set(cozulmus.map(ex => ex.grup).filter(Boolean))];
  return g.length ? g.join(' · ') : 'Boş gün';
}

/**
 * Kalemi ÇÖZ: kütüphane tanımı + bu programdaki hedef. Ekranlar ve seans motoru bu nesneyle
 * çalışır (eskiden EX'in kendi nesnesiydi; alan adları aynı tutuldu: sets, setsMin, target).
 * Kütüphanede olmayan kimlik (silinmiş özel hareket, bozuk yedek) çökertmez: adsız bir tanım döner.
 */
export function cozumle(k, kutuphane) {
  const ex = kutuphane[k.exId] ?? bilinmeyen(k);
  const alan = hedefAlani(ex.setType);
  const c = { ...ex, sets: k.sets, target: { [alan]: k[alan] ?? ex.target?.[alan] } };
  if (k.setsMin) c.setsMin = k.setsMin; else delete c.setsMin;
  if (k.agirlik != null) c.agirlik = k.agirlik; else delete c.agirlik;
  // G1: tekrar aralığı yalnız ağırlık × tekrarda ve alt sınır hedeften küçükse; RIR ve dinlenme olduğu gibi
  if (ex.setType === 'weight_reps' && k.repsMin != null && k.repsMin < (k.reps ?? Infinity)) c.repsMin = k.repsMin; else delete c.repsMin;
  if (k.rir != null && ex.setType === 'weight_reps') c.rir = k.rir; else delete c.rir;
  if (k.dinlenme != null) c.dinlenme = k.dinlenme; else delete c.dinlenme;
  return c;
}
function bilinmeyen(k) {
  const setType = k.seconds != null ? 'time' : k.minutes != null ? 'cardio' : 'weight_reps';
  return { id: k.exId, ad: 'Bilinmeyen hareket', en: '', tr: 'Bilinmeyen hareket', grup: '', equipment: 'bodyweight',
    setType, sets: 3, target: { [hedefAlani(setType)]: k[hedefAlani(setType)] ?? 10 }, mus: '', steps: [], tip: '', bilinmeyen: true };
}

/* ── Isınma ve bitiş ────────────────────────────────────────────────────────
   "Benim programım"ın günleri bugünkü ısınmayı aynen taşır (isinma: 0 | 1). Yeni bir günde ısınma
   günün hareketlerinden KURULUR: alt vücut ağırlıklıysa bacak hareketliliği, değilse üst vücut;
   son adım günün İLK AĞIRLIK hareketi hafif ağırlıkla (24 Eyl kararının hazırlık ilkesi —
   ağırlığa göre ısınma setleri Faz 3'te). */
export function isinmaFor(gun, cozulmus = []) {
  if (!gun) return [];
  if (Number.isInteger(gun.isinma) && WARMUP[gun.isinma]) return WARMUP[gun.isinma];
  if (!cozulmus.length) return [];
  const alt = cozulmus.filter(ex => ex.grup === 'Bacak').length * 2 > cozulmus.length;
  const hareketlilik = WARMUP[alt ? 1 : 0].filter(w => !w.ref);
  const ilk = cozulmus.find(ex => ex.setType === 'weight_reps' && ex.equipment !== 'bodyweight');
  if (!ilk) return hareketlilik;
  return [...hareketlilik, { id: 'w_hazirlik_' + ilk.id, ad: `${ilk.ad ?? ilk.en} — hafif ağırlıkla`, miktar: '1 × 12',
    not: 'Günün ilk ağır hareketi; kas ve eklemleri asıl setlere hazırlar.', ref: ilk.id, hazirlik: true }];
}
export const isinmaSuresi = gun => (Number.isInteger(gun?.isinma) && SURE[gun.isinma]) || '~9 dk';
/** Antrenman sonrası kardiyo — yalnız "Benim programım"ın günlerinde (bitis: 0 | 1); yeni günde yok */
export const bitisFor = gun => (Number.isInteger(gun?.bitis) && FIN[gun.bitis]) || null;

/* ── Düzenleme (saf; programı YERİNDE değiştirir, çağıran kaydeder) ─────────── */

export function gunEkle(p) {
  if (p.gunler.length >= EN_COK_GUN) return { ok: false, neden: 'gün sınırı' };
  p.gunler.push(yeniGun()); dokun(p);
  return { ok: true, i: p.gunler.length - 1 };
}
export function gunSil(p, i) {
  if (p.gunler.length <= 1) return { ok: false, neden: 'son gün' };
  const [silinen] = p.gunler.splice(i, 1); dokun(p);
  return { ok: true, silinen };
}
export function kalemEkle(p, gunI, ex) {
  const g = p.gunler[gunI];
  if (!g) return { ok: false, neden: 'gün yok' };
  if (g.hareketler.length >= EN_COK_HAREKET) return { ok: false, neden: 'hareket sınırı' };
  g.hareketler.push(kalem(ex)); dokun(p);
  return { ok: true };
}
export function kalemSil(p, gunI, i) {
  const [silinen] = p.gunler[gunI]?.hareketler.splice(i, 1) ?? []; dokun(p);
  return silinen ?? null;
}
export function kalemTasi(p, gunI, i, yon) {
  const h = p.gunler[gunI]?.hareketler, j = i + yon;
  if (!h || j < 0 || j >= h.length) return false;
  [h[i], h[j]] = [h[j], h[i]]; dokun(p);
  return true;
}
/** Bir hedef alanını adım kadar değiştir — sınırların içinde kalır */
export function kalemAyarla(p, gunI, i, alan, yon) {
  const k = p.gunler[gunI]?.hareketler[i], s = SINIR[alan];
  if (!k || !s || k[alan] == null) return null;
  k[alan] = Math.min(s.ec, Math.max(s.en, k[alan] + yon * s.adim));
  if (alan === 'sets') delete k.setsMin;                          // elle ayarlanınca aralık etiketi düşer
  dokun(p);
  return k[alan];
}
/** Bir hedef alanını DOĞRUDAN değere yaz (set noktası, tekrar şeridi, hazır şema) — sınırların içinde kalır */
export function kalemYaz(p, gunI, i, alan, deger) {
  const k = p.gunler[gunI]?.hareketler[i], s = SINIR[alan];
  if (!k || !s || k[alan] == null || !Number.isFinite(+deger)) return null;
  k[alan] = Math.min(s.ec, Math.max(s.en, Math.round(+deger)));
  if (alan === 'sets') delete k.setsMin;
  if (alan === 'reps' && k.repsMin != null && k.repsMin >= k.reps) delete k.repsMin;   // aralık tersine dönmesin
  dokun(p);
  return k[alan];
}
/**
 * YÖNTEM ALANI (G1, 17 Eki): tekrar aralığının alt sınırı (`repsMin`), hedef RIR (`rir`), dinlenme (`dinlenme`, sn).
 * `deger` null → alan kalkar (tek sayı / RIR yok / genel dinlenme). Alt sınır hedef tekrardan küçük olmalı.
 * @returns {boolean} yazıldı mı
 */
export function kalemYontem(p, gunI, i, alan, deger) {
  const k = p.gunler[gunI]?.hareketler[i], s = SINIR[alan];
  if (!k || !s || !YONTEM_ALANLARI.includes(alan)) return false;
  if (deger == null) { delete k[alan]; dokun(p); return true; }
  if (!Number.isFinite(+deger)) return false;
  const v = Math.min(s.ec, Math.max(s.en, Math.round(+deger)));
  if (alan === 'repsMin' && !(k.reps > v)) return false;
  if ((alan === 'repsMin' || alan === 'rir') && k.reps == null) return false;   // yalnız ağırlık × tekrar kalemi
  k[alan] = v; dokun(p);
  return true;
}
/** Kalemi i'den j'ye taşı (sürükle-bırak) — aradakiler kayar */
export function kalemYerDegistir(p, gunI, i, j) {
  const h = p.gunler[gunI]?.hareketler;
  if (!h || i === j || i < 0 || j < 0 || i >= h.length || j >= h.length) return false;
  const [k] = h.splice(i, 1);
  h.splice(j, 0, k); dokun(p);
  return true;
}
const dokun = p => { p.guncellendi = Date.now(); };

/* ── Özel hareket ──────────────────────────────────────────────────────────── */

/** Kütüphanede olmayan hareket — 3B çizimi yoktur, kaydı ve geçmişi diğerleri gibi tutulur */
export function ozelHareket({ ad, grup, equipment, setType }) {
  const alan = hedefAlani(setType);
  return {
    id: yeniKimlik('ozel'), ozel: true, ad: String(ad).trim().slice(0, AD_UZUNLUK), en: '', tr: String(ad).trim().slice(0, AD_UZUNLUK),
    grup, equipment, setType, sets: 3, target: { [alan]: alan === 'seconds' ? 30 : alan === 'minutes' ? 20 : 10 },
    mus: grup, steps: [], tip: '', olusturuldu: Date.now(),
  };
}

/**
 * Özel hareketi BİLİNEN ALANLARA indir (içe aktarım ve açılış). Yedek dosyası dışarıdan gelir:
 * doğrulanmış kimlik/ad yetmez, nesnenin geri kalanı (steps, tip, ek alanlar) olduğu gibi
 * saklanırsa ekrana veri olmayan bir şey taşıyabilir. Anlatım ve ipucu özel harekette yoktur.
 */
export function ozelTemizle(h) {
  const k = ozelHareket({ ad: h.ad, grup: h.grup, equipment: h.equipment, setType: h.setType });
  k.id = h.id;
  if (Number.isFinite(h.olusturuldu)) k.olusturuldu = h.olusturuldu;
  if (h.arsiv) k.arsiv = true;
  return k;
}

/* ── Doğrulama (içe aktarım) — sebebi döner, geçerliyse null ─────────────── */

const sayiMi = v => typeof v === 'number' && Number.isFinite(v);
const metinMi = (v, uz = AD_UZUNLUK) => typeof v === 'string' && v.length <= uz;

export function gecersizKalem(k) {
  if (!k || typeof k !== 'object' || !KIMLIK.test(k.exId ?? '')) return 'hareket kimliği';
  if (!Number.isInteger(k.sets) || k.sets < SINIR.sets.en || k.sets > SINIR.sets.ec) return 'set';
  const alanlar = ['reps', 'seconds', 'minutes'].filter(a => k[a] != null);
  if (alanlar.length !== 1 || !sayiMi(k[alanlar[0]]) || k[alanlar[0]] <= 0) return 'hedef';
  if (k.agirlik != null && (!sayiMi(k.agirlik) || k.agirlik < 0)) return 'ağırlık';
  for (const a of YONTEM_ALANLARI) if (k[a] != null && (!Number.isInteger(k[a]) || k[a] < SINIR[a].en || k[a] > SINIR[a].ec)) return a;
  if (k.repsMin != null && !(k.reps > k.repsMin)) return 'repsMin';
  return null;
}
export function gecersizProgram(p) {
  if (!p || typeof p !== 'object' || !KIMLIK.test(p.id ?? '')) return 'kimlik';
  if (!metinMi(p.ad)) return 'ad';
  if (!Array.isArray(p.gunler) || !p.gunler.length || p.gunler.length > EN_COK_GUN) return 'günler';
  for (const g of p.gunler) {
    if (!g || !KIMLIK.test(g.id ?? '') || !metinMi(g.ad ?? '')) return 'gün';
    if (!Array.isArray(g.hareketler) || g.hareketler.length > EN_COK_HAREKET) return 'hareketler';
    for (const k of g.hareketler) { const n = gecersizKalem(k); if (n) return n; }
  }
  return null;
}
export function gecersizOzel(h) {
  if (!h || typeof h !== 'object' || !/^ozel_[A-Za-z0-9_-]{1,74}$/.test(h.id ?? '')) return 'kimlik';
  if (!metinMi(h.ad) || !h.ad.trim()) return 'ad';
  if (!GRUPLAR.includes(h.grup)) return 'grup';
  if (!(h.equipment in EKIPMAN)) return 'ekipman';
  if (!(h.setType in SET_TURU)) return 'tür';
  return null;
}
