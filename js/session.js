/**
 * SEANS MOTORU — bir antrenmanın yaşam döngüsü ve kayıt işlemleri.
 * Saf mantık: DOM'a dokunmaz, bu yüzden Node'da test edilebilir.
 */
import { EX, FIN } from './data/exercises.js';
import * as store from './store.js';

export const DAY_NAMES = [
  '1. Gün — Göğüs · Omuz · Triceps',
  '2. Gün — Sırt · Biceps · Bacak',
];

/** id → egzersiz tanımı (Plank iki günde de var; tanımları özdeş) */
export const byId = Object.fromEntries(EX.flat().map(e => [e.id, e]));

export const exercisesFor = dayIndex => EX[dayIndex];
export const finisherFor = dayIndex => FIN[dayIndex];

/**
 * Sıradaki gün — TAKVİMDEN DEĞİL, geçmişten.
 * Hiç seans yoksa 1. Gün'den başlanır.
 */
export async function nextDayIndex() {
  const last = await store.lastDoneSession();
  return last ? (last.dayIndex === 0 ? 1 : 0) : 0;
}

/**
 * Uygulama açılışı: yarıda kalmış seans varsa ONA devam edilir, yoksa
 * sıradaki gün için yeni seans açılır (henüz kaydedilmez — kullanıcı ilk
 * seti işaretlediğinde kaydedilir ki boş seans geçmişi kirletmesin).
 */
export async function startOrResume() {
  const active = await store.activeSession();
  if (active) return { session: active, resumed: true };
  return { session: store.newSession(await nextDayIndex()), resumed: false };
}

/* ── Kayıt işlemleri ───────────────────────────────────────────────────── */

/** Egzersizin kaydını bulur, yoksa oluşturur */
export function entryFor(session, exerciseId) {
  let e = session.entries.find(x => x.exerciseId === exerciseId);
  if (!e) { e = { exerciseId, note: '', sets: [] }; session.entries.push(e); }
  return e;
}

/** Egzersizin tipine göre boş bir set nesnesi — hedef değerlerle önceden dolu */
export function blankSet(ex) {
  const t = ex.setType;
  if (t === 'time') return { type: 'time', seconds: ex.target.seconds, warmup: false };
  if (t === 'cardio') return { type: 'cardio', minutes: ex.target.minutes, warmup: false };
  return { type: 'weight_reps', weight: null, reps: ex.target.reps, warmup: false };
}

/**
 * Yeni set için ÖNERİLEN değerler.
 * Öncelik: (1) bu seansta zaten girilmiş son set → aynısını tekrarla,
 *          (2) geçen seferki son çalışma seti, (3) boş.
 * Bu bir TAVSİYE değil, tuş sayısını azaltan bir ön-doldurmadır.
 */
export function suggestSet(ex, session, lastPerf) {
  const mine = entryFor(session, ex.id).sets.filter(s => !s.warmup);
  const src = mine.at(-1) ?? lastPerf?.sets?.at(-1);
  const base = blankSet(ex);
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

/** { done, total, pct } — hedef set sayısına göre ilerleme */
export function progress(session, dayIndex) {
  const total = exercisesFor(dayIndex).reduce((a, e) => a + e.sets, 0);
  const done = session.entries.reduce((a, e) => {
    const ex = byId[e.exerciseId];
    return a + Math.min(e.sets.length, ex?.sets ?? e.sets.length);   // fazla set ilerlemeyi >%100 yapmasın
  }, 0);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

/** Egzersiz bazında: kaç set girildi, hedefe ulaşıldı mı */
export function exerciseProgress(session, ex) {
  const sets = session.entries.find(x => x.exerciseId === ex.id)?.sets ?? [];
  const calisma = sets.filter(s => !s.warmup).length;
  return { sets, calisma, hedef: ex.sets, tamam: calisma >= ex.sets };
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
export async function persist(session) {
  if (!hasAnySet(session)) return;          // boş seans yazma
  await store.saveSession(session);
}

/** Bitiş özeti */
export async function summary(session) {
  const v = store.sessionVolume(session, byId);
  const dk = session.finishedAt && session.startedAt
    ? Math.max(1, Math.round((session.finishedAt - session.startedAt) / 60000)) : null;
  return { ...v, minutesElapsed: dk, dayName: DAY_NAMES[session.dayIndex] };
}
