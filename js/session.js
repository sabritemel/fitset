/**
 * SEANS MOTORU — bir antrenmanın yaşam döngüsü ve kayıt işlemleri.
 * Saf mantık: DOM'a dokunmaz, bu yüzden Node'da test edilebilir.
 */
import { EX, FIN } from './data/exercises.js';
import { WARMUP, KARDIYO, SURE } from './data/warmup.js';
import * as store from './store.js';

export const DAY_NAMES = [
  '1. Gün — Göğüs · Omuz · Triceps',
  '2. Gün — Sırt · Biceps · Bacak',
];

/** id → egzersiz tanımı (Plank iki günde de var; tanımları özdeş) */
export const byId = Object.fromEntries(EX.flat().map(e => [e.id, e]));

export const exercisesFor = dayIndex => EX[dayIndex];

/** O gunun isinma adimlari — numarasiz, sete ve hacme sayilmaz */
export const warmupFor = dayIndex => WARMUP[dayIndex] ?? [];
export { KARDIYO, SURE as WARMUP_SURE };

/** Isinma yapildi isareti — tek bayrak, baska hicbir sey tutulmuyor */
export function setWarmupDone(session, done = true) {
  session.warmupDone = done;
  return session;
}
export const finisherFor = dayIndex => FIN[dayIndex];

/**
 * Sıradaki gün — TAKVİMDEN DEĞİL, geçmişten.
 * Hiç seans yoksa 1. Gün'den başlanır.
 */
export async function nextDayIndex() {
  const last = await store.lastDoneSession();
  return last ? (last.dayIndex === 0 ? 1 : 0) : 0;
}

/** Seansın son hareketi ne zamandı — bitiş damgası ve bayatlık bundan çıkar */
export function lastActivity(s) {
  let t = s.startedAt;
  for (const e of s.entries) for (const x of e.sets) if (x.ts > t) t = x.ts;
  return t;
}

export const STALE_HOURS = 6;

/**
 * BAYAT SEANSI KAPAT.
 *
 * Gerçek kullanımdan çıkan hata: kullanıcı salondan çıkarken "Seansı bitir"e
 * basmayı unutuyor. Seans sonsuza kadar `active` kalıyor ve şu iki şey bozuluyor:
 *   1. O seans hiç GEÇMİŞE geçmiyor → ertesi gün "geçen sefer" boş geliyor
 *      ve ağırlık kutuları doldurulamıyor.
 *   2. A/B sırası ilerlemiyor → hep aynı gün gösteriliyor.
 *
 * Çözüm: son SET girişinden STALE_HOURS geçmişse seans kendiliğinden kapanır.
 * Bitiş damgası "şimdi" değil SON HAREKET anı — yoksa süre özeti saatlerce
 * antrenman yapmışsın gibi görünürdü.
 *
 * Eşik neden 6 saat: gece yarısını geçen bir antrenmanı bölmemeli, ama ertesi
 * gün uygulamayı açtığında dünkü seans kapanmış olmalı.
 */
export async function closeStaleSession(now = Date.now()) {
  const a = await store.activeSession();
  if (!a) return null;
  if ((now - lastActivity(a)) / 3_600_000 < STALE_HOURS) return null;
  if (!hasAnySet(a)) { await abandon(a); return { action: 'discarded' }; }
  a.status = 'done';
  a.finishedAt = lastActivity(a);
  await store.saveSession(a);
  return { action: 'closed', session: a };
}

/**
 * Uygulama açılışı: bayat seans varsa önce kapatılır, sonra yarıda kalmış
 * seans varsa ONA devam edilir, yoksa sıradaki gün için yeni seans açılır
 * (henüz kaydedilmez — ilk set girilince kaydedilir ki boş seans geçmişi kirletmesin).
 */
export async function startOrResume() {
  const stale = await closeStaleSession();
  const active = await store.activeSession();
  if (active) return { session: active, resumed: true, stale };
  return { session: store.newSession(await nextDayIndex()), resumed: false, stale };
}

/* ── Yarım kalan gün ────────────────────────────────────────────────────────
 * Sıra takvimden değil geçmişten türetildiği için KAÇIRILAN gün zaten
 * sorunsuz: hiç seans yoksa sıra ilerlemez, sonraki gidişte aynı gün gelir.
 *
 * Kapanmayan boşluk şuydu: gün YARIM bırakılınca (erken çıkış) seans "yapıldı"
 * sayılıp sıra ilerliyor ve girilmemiş hareketler hiçbir yerde anılmıyordu.
 * Ölçüldü: 1. Gün 4/9 → sıra 2. Güne geçiyor, kalan 5 hareket sessizce kayıp.
 *
 * Karar KULLANICININ: uygulama sessizce "devam ettiriyorum" demiyor. Bilerek
 * atlanan hareket de vardır (sakatlık, dolu makine) — onu yarım saymak yanlış
 * olurdu. Sorulur, cevap seansa yazılır, bir daha sorulmaz.
 */

/** Yapılan oranı bunun ALTINDAysa gün "yarım" sayılır. 9 harekette 4 → yarım, 5 → değil. */
export const YARIM_ORAN = 0.5;

/** O seansta hiç ÇALIŞMA seti girilmemiş hareketler (ısınma seti sayılmaz) */
export function incompleteOf(session) {
  return exercisesFor(session.dayIndex).filter(ex => {
    const e = session.entries.find(x => x.exerciseId === ex.id);
    return !e || !e.sets.some(s => !s.warmup);
  });
}

/** O seansta EN AZ bir çalışma seti girilmiş hareketlerin kimlikleri */
export const completedIds = session =>
  new Set(session.entries.filter(e => e.sets.some(s => !s.warmup)).map(e => e.exerciseId));

/**
 * Son tamamlanan seans yarım kaldıysa öneri nesnesi, yoksa null.
 * Cevaplanmış (carryResolved) seans bir daha sorulmaz.
 */
export async function carryOffer() {
  const son = await store.lastDoneSession();
  if (!son || son.carryResolved) return null;
  const toplam = exercisesFor(son.dayIndex).length;
  const kalan = incompleteOf(son);
  if (!kalan.length) return null;
  const yapilan = toplam - kalan.length;
  if (yapilan / toplam >= YARIM_ORAN) return null;
  return { session: son, kalan, yapilan, toplam };
}

/** Soruya cevap verildi — bir daha sorulmasın diye ESKİ seansa yazılır */
export async function resolveCarry(prev) {
  prev.carryResolved = true;
  await store.saveSession(prev);
}

/* ── Kayıt işlemleri ───────────────────────────────────────────────────── */

/** Egzersizin kaydını bulur, yoksa oluşturur */
export function entryFor(session, exerciseId) {
  let e = session.entries.find(x => x.exerciseId === exerciseId);
  if (!e) { e = { exerciseId, note: '', sets: [] }; session.entries.push(e); }
  return e;
}

/** Egzersizin tipine göre boş bir set nesnesi — hedef değerlerle önceden dolu */
export function blankSet(ex, settings) {
  const t = effective(ex, settings);
  if (ex.setType === 'time') return { type: 'time', seconds: t.seconds, warmup: false };
  if (ex.setType === 'cardio') return { type: 'cardio', minutes: t.minutes, warmup: false };
  return { type: 'weight_reps', weight: t.weight, reps: t.reps, warmup: false };
}

/**
 * Yeni set için ÖNERİLEN değerler.
 * Öncelik: (1) bu seansta zaten girilmiş son set → aynısını tekrarla,
 *          (2) geçen seferki son çalışma seti, (3) boş.
 * Bu bir TAVSİYE değil, tuş sayısını azaltan bir ön-doldurmadır.
 */
export function suggestSet(ex, session, lastPerf, settings) {
  const mine = entryFor(session, ex.id).sets.filter(s => !s.warmup);
  const src = mine.at(-1) ?? lastPerf?.sets?.at(-1);
  const base = blankSet(ex, settings);
  if (!src || src.type !== base.type) return base;
  return { ...base, ...(src.weight != null && { weight: src.weight }), reps: src.reps ?? base.reps };
}

export function recordSet(session, exerciseId, data) {
  const set = { ...data, ts: Date.now() };
  entryFor(session, exerciseId).sets.push(set);
  return set;
}

export function updateSet(session, exerciseId, index, patch) {
  const sets = entryFor(session, exerciseId).sets;
  if (!sets[index]) return null;
  sets[index] = { ...sets[index], ...patch };
  return sets[index];
}

/**
 * Son seti geri al. Terli/eldivenli parmakla yanlış dokunuş KESİN olacağı için
 * bu bir konfor değil zorunluluk — ve onay diyaloğundan iyidir (diyalog akışı keser).
 * Geri alınan seti döner ki arayüz "geri alındı, geri getir?" gösterebilsin.
 */
export function undoLastSet(session, exerciseId) {
  const e = session.entries.find(x => x.exerciseId === exerciseId);
  return e?.sets.pop() ?? null;
}

export function setNote(session, exerciseId, note) {
  entryFor(session, exerciseId).note = note;
}

export const hasAnySet = session => session.entries.some(e => e.sets.length > 0);

/* ── İlerleme ve bitiş ─────────────────────────────────────────────────── */

/**
 * ETKİN HEDEF — programın varsayılanı + kullanıcının kendi değişikliği.
 *
 * Program sabit değil: hoca "bench'i 4 sete çıkar" diyebilir, ya da sen bir
 * hareketi 15 tekrara indirebilirsin. Kaynak dosyaya dokunmadan, egzersiz
 * bazında üzerine yazılabilsin diye ayrı tutuluyor. Override yoksa program
 * ne diyorsa o geçerli.
 */
export function effective(ex, settings) {
  const o = settings?.overrides?.[ex.id] ?? {};
  return {
    sets: o.sets ?? ex.sets,
    reps: o.reps ?? ex.target.reps,
    seconds: o.seconds ?? ex.target.seconds,
    minutes: o.minutes ?? ex.target.minutes,
    weight: o.weight ?? null,          // planlanan ağırlık (isteğe bağlı)
    edited: Object.keys(o).length > 0,
  };
}

/** "3 × 12" / "3 × 15 sn" — etiket artık veriden türetiliyor, elle yazılmıyor */
export function repsLabel(ex, settings) {
  const t = effective(ex, settings);
  const alt = ex.setsMin && ex.setsMin !== t.sets ? `${ex.setsMin}-${t.sets}` : `${t.sets}`;
  if (ex.setType === 'time') return `${alt} × ${t.seconds} sn`;
  if (ex.setType === 'cardio') return `${t.minutes} dk`;
  return `${alt} × ${t.reps}`;
}

/** { done, total, pct } — hedef set sayısına göre ilerleme */
export function progress(session, dayIndex, settings) {
  const exs = exercisesFor(dayIndex);
  const total = exs.reduce((a, e) => a + effective(e, settings).sets, 0);
  const done = session.entries.reduce((a, e) => {
    const ex = byId[e.exerciseId];
    const hedef = ex ? effective(ex, settings).sets : e.sets.length;
    return a + Math.min(e.sets.filter(s => !s.warmup).length, hedef);  // fazla set >%100 yapmasın
  }, 0);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

/** Egzersiz bazında: kaç set girildi, hedefe ulaşıldı mı */
export function exerciseProgress(session, ex, settings) {
  const sets = session.entries.find(x => x.exerciseId === ex.id)?.sets ?? [];
  const calisma = sets.filter(s => !s.warmup).length;
  const hedef = effective(ex, settings).sets;
  return { sets, calisma, hedef, tamam: calisma >= hedef };
}

/** Seansı bitirir ve kaydeder. Hiç set yoksa kaydetmez — boş seans geçmişi kirletir. */
export async function finish(session) {
  if (!hasAnySet(session)) { await abandon(session); return null; }
  session.status = 'done';
  session.finishedAt = Date.now();
  await store.saveSession(session);
  return session;
}

/** Yarıda bırakılan seansı siler (kaydedilmişse) */
export async function abandon(session) {
  if (await store.getSession(session.id)) await store.driver.del('sessions', session.id);
}

/** Kısmi seansı diske yazar — her set girişinden sonra çağrılır */
/**
 * Kaydedilmeye değer bir şey var mı?
 *
 * ⚠️ Yalnız `hasAnySet` bakmak YETMİYOR: ısınma işaretlendiğinde henüz hiç set
 * yok, dolayısıyla seans diske yazılmıyordu. Kullanıcı ısınmayı yapıyor,
 * uygulamayı kapatıp açıyor ve işaret KAYBOLMUŞ oluyordu.
 * (Yine de "bitmiş antrenman" sayılmaz — finish() ve bayat-seans temizliği
 *  hâlâ hasAnySet'e bakar, yoksa yalnız ısınma yapılan gün A/B sırasını
 *  yanlış ilerletirdi.)
 *
 * ⚠️ Aynı tuzak `carriedFrom` için de geçerli ve CANLI KULLANIMDA yakalandı:
 * "Bu güne devam et" seçilip sayfa yenilenince seçim kayboluyor, üstelik soru
 * cevaplanmış sayıldığı için bir daha SORULMUYOR ve kullanıcı sessizce yanlış
 * güne düşüyordu. Devir kararı da bir kayıttır.
 */
export const hasAnyRecord = session =>
  hasAnySet(session) || !!session.warmupDone || !!session.carriedFrom;

export async function persist(session) {
  if (!hasAnyRecord(session)) return;       // gerçekten boş seansı yazma
  await store.saveSession(session);
}

/** Anlık hacim — liste ekranındaki özet şeridi için (senkron) */
export const summaryVolume = session => store.sessionVolume(session, byId);

/** Bitiş özeti */
export async function summary(session) {
  const v = store.sessionVolume(session, byId);
  const dk = session.finishedAt && session.startedAt
    ? Math.max(1, Math.round((session.finishedAt - session.startedAt) / 60000)) : null;
  return { ...v, minutesElapsed: dk, dayName: DAY_NAMES[session.dayIndex] };
}

/* ── Geçmiş ────────────────────────────────────────────────────────────────
 * Bu veriler ZATEN kaydediliyordu; eksik olan onları GÖSTEREN ekrandı.
 * doneSessions() yeniden eskiye sıralı; grafikler soldan sağa okunduğu için
 * seriler burada ters çevrilir.
 */

/** Bir seansın özet satırı: kaç hareket yapıldı, hacim ne, yarım mı */
export function sessionSummaryRow(session) {
  const toplam = exercisesFor(session.dayIndex).length;
  const yapilan = completedIds(session).size;
  return {
    id: session.id,
    at: session.finishedAt ?? session.startedAt,
    dayIndex: session.dayIndex,
    yapilan, toplam,
    yarim: yapilan / toplam < YARIM_ORAN,
    hacim: store.sessionVolume(session, byId),
  };
}

export async function historyRows(limit = 12) {
  return (await store.doneSessions()).slice(0, limit).map(sessionSummaryRow);
}

/** Bir setin "ilerleme" değeri — ağırlık, süre ya da dakika */
const setValue = s => s.type === 'time' ? s.seconds : s.type === 'cardio' ? s.minutes : s.weight;

/**
 * Egzersizin seans başına EN AĞIR seti, eskiden yeniye.
 * En ağır set seçildi: ilerlemeyi o taşır. Ortalama, ısınmaya yakın hafif
 * setler yüzünden gerçek artışı gizlerdi.
 */
export async function exerciseSeries(exerciseId, limit = 12) {
  const out = [];
  for (const s of await store.doneSessions()) {
    const e = s.entries.find(x => x.exerciseId === exerciseId);
    const setler = (e?.sets ?? []).filter(x => !x.warmup).map(setValue).filter(v => v > 0);
    if (!setler.length) continue;
    out.push({ at: s.finishedAt ?? s.startedAt, v: Math.max(...setler) });
    if (out.length >= limit) break;
  }
  return out.reverse();
}

/** Kayıtta EN AZ iki seans bulunan egzersizler — ilerleme çizilebilenler */
export async function progressables(minPoints = 2) {
  const seanslar = await store.doneSessions();
  const say = new Map();
  for (const s of seanslar)
    for (const e of s.entries)
      if (e.sets.some(x => !x.warmup)) say.set(e.exerciseId, (say.get(e.exerciseId) ?? 0) + 1);
  // PROGRAM SIRASINDA dön (1. Gün hareketleri, sonra 2. Gün'ün yenileri).
  // Map'in ekleme sırası "en son hangi seansta görüldüğü"ne göreydi ve
  // listeyi her seansta yeniden diziyordu — okuyan için rastgele görünüyordu.
  const sira = [];
  const görüldü = new Set();
  for (const gün of [0, 1])
    for (const ex of exercisesFor(gün))
      if (!görüldü.has(ex.id)) { görüldü.add(ex.id); sira.push(ex); }
  return sira.filter(ex => (say.get(ex.id) ?? 0) >= minPoints);
}
