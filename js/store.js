/**
 * DEPOLAMA KATMANI — IndexedDB + dışa/içe aktarım.
 *
 * ┌─ NEDEN IndexedDB, localStorage DEĞİL ───────────────────────────────────┐
 * │ Yaygın gerekçe "localStorage dolar" yanlıştır: seans başına ~27 set,    │
 * │ haftada 3 seans ≈ 200 KB/yıl; 5 MB kotası 25 yıl yeter.                 │
 * │ Gerçek gerekçeler:                                                       │
 * │  1. localStorage SENKRONDUR ve ana thread'i bloklar. Salonda her set    │
 * │     kaydında arayüz donar — tek başına yeterli sebep.                   │
 * │  2. Sorgulanabilirlik: "bu egzersizin son kaydı" için tüm JSON'u parse  │
 * │     etmen gerekmez, indeksten çekersin.                                  │
 * │  3. navigator.storage.persist() ile kalıcılık talep edilebilir.         │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️ DÜRÜST SINIR: veri YALNIZCA bu cihazda. Sunucu yok (bilinçli karar:
 *    gizlilik + basitlik). Bunun bedeli: tarayıcı verisi silinirse ya da
 *    telefon kaybolursa veri gider. Bu yüzden dışa aktarım bir süs değil,
 *    tek yedekleme yoludur — UI kullanıcıyı düzenli olarak dürtmelidir.
 *
 * Mimari not: sorgu mantığı sürücüden (driver) ayrıldı. Böylece IndexedDB
 * olmayan ortamda (Node testleri) aynı mantık bellek sürücüsüyle sınanabilir.
 */

export const SCHEMA_VERSION = 1;
const DB_NAME = 'fitset';
const DB_VERSION = 1;
const STORES = { sessions: 'id', settings: 'key' };

export const DEFAULT_SETTINGS = {
  key: 'config',
  restSeconds: 60,
  unit: 'kg',
  theme: 'auto',
  trainingDays: [2, 4, 6],       // 0=Pazar … 2=Salı, 4=Perşembe, 6=Cumartesi
  backupNagEvery: 8,             // kaç seansta bir yedek hatırlatması
  // Egzersiz bazında kullanıcı hedefleri: { [exerciseId]: {sets, reps, seconds, weight} }
  // Program dosyasına dokunmadan üzerine yazmayı sağlar; yedeğe de dahildir.
  overrides: {},
};

/* ── Sürücüler ─────────────────────────────────────────────────────────── */

class IDBDriver {
  #db = null;
  async open() {
    if (this.#db) return this.#db;
    this.#db = await new Promise((res, rej) => {
      const rq = indexedDB.open(DB_NAME, DB_VERSION);
      rq.onupgradeneeded = () => {
        const d = rq.result;
        for (const [name, keyPath] of Object.entries(STORES))
          if (!d.objectStoreNames.contains(name)) {
            const s = d.createObjectStore(name, { keyPath });
            if (name === 'sessions') { s.createIndex('startedAt', 'startedAt'); s.createIndex('status', 'status'); }
          }
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    return this.#db;
  }
  async #tx(store, mode, fn) {
    const d = await this.open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const rq = fn(t.objectStore(store));
      t.oncomplete = () => res(rq?.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }
  get(store, key) { return this.#tx(store, 'readonly', s => s.get(key)); }
  getAll(store) { return this.#tx(store, 'readonly', s => s.getAll()); }
  put(store, val) { return this.#tx(store, 'readwrite', s => s.put(val)); }
  del(store, key) { return this.#tx(store, 'readwrite', s => s.delete(key)); }
  clear(store) { return this.#tx(store, 'readwrite', s => s.clear()); }
}

/** IndexedDB yoksa (Node testleri, gizli sekme kısıtları) aynı arayüz, bellekte. */
class MemoryDriver {
  #m = { sessions: new Map(), settings: new Map() };
  async open() { return this; }
  async get(store, key) { return structuredClone(this.#m[store].get(key)); }
  // .map(structuredClone) YAZMA: map ikinci argüman olarak index geçirir ve
  // structuredClone onu "options" sanıp TypeError atar. Ok fonksiyonu şart.
  async getAll(store) { return [...this.#m[store].values()].map(v => structuredClone(v)); }
  async put(store, val) { this.#m[store].set(val[STORES[store]], structuredClone(val)); }
  async del(store, key) { this.#m[store].delete(key); }
  async clear(store) { this.#m[store].clear(); }
}

export const driver = typeof indexedDB !== 'undefined' ? new IDBDriver() : new MemoryDriver();

/* ── Ayarlar ───────────────────────────────────────────────────────────── */

export async function getSettings() {
  const kayitli = await driver.get('settings', 'config') || {};
  // 90 sn yalnizca ESKI VARSAYILANDI ve degistirilecek bir arayuz hic olmadi;
  // yani 90 goren herkes varsayilani goruyor. Yeni varsayilana tasi.
  if (kayitli.restSeconds === 90) kayitli.restSeconds = 60;
  return { ...DEFAULT_SETTINGS, ...kayitli };
}
export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch, key: 'config' };
  await driver.put('settings', next);
  return next;
}

/* ── Seanslar ──────────────────────────────────────────────────────────── */

/**
 * Seans kaydı:
 *   { id, schemaVersion, dayIndex, startedAt, finishedAt, status, entries[] }
 *   entries: [{ exerciseId, note, sets: [set] }]
 *   set    : { type:'weight_reps', weight, reps, warmup, ts }
 *          | { type:'time',        seconds, warmup, ts }
 *          | { type:'cardio',      minutes, km?, mode?, ts }
 */
export const newSession = dayIndex => ({
  id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
  schemaVersion: SCHEMA_VERSION,
  dayIndex,
  startedAt: Date.now(),
  finishedAt: null,
  status: 'active',
  entries: [],
  // Isinma KAYDEDILEN bir hareket degil: tek bayrak. Agirlik/tekrar/hacim
  // tutulmuyor, set sayimina girmiyor — grafikler ve 'gecen sefer' temiz kaliyor.
  warmupDone: false,
});

export const saveSession = s => driver.put('sessions', s);
export const getSession = id => driver.get('sessions', id);

/** Eşit zaman damgalarında sıralamanın rastgeleleşmemesi için son çare ayracı */
const tieBreak = (a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

/** Tüm seanslar, BAŞLAMA zamanına göre yeniden eskiye */
export async function allSessions() {
  return (await driver.getAll('sessions')).sort((a, b) => (b.startedAt - a.startedAt) || tieBreak(a, b));
}

/**
 * Bitmiş seanslar, EN SON BİTENDEN eskiye.
 *
 * ⚠️ Sıralama finishedAt'e göre, startedAt'e göre DEĞİL. Fark gerçek bir
 * senaryoda ortaya çıkıyor: A seansını başlat, yarıda bırak → B seansını
 * başlat ve bitir → sonra A'ya dönüp onu bitir. A daha ERKEN başladı ama
 * daha GEÇ bitti; "son yapılan antrenman" A'dır. startedAt'e göre sıralarsak
 * B seçilir ve kullanıcıya YANLIŞ gün gösterilir — A/B sırasının tamamı bu
 * sorguya bağlı olduğu için bu sessiz ama can yakıcı bir hata olurdu.
 */
export async function doneSessions() {
  return (await driver.getAll('sessions'))
    .filter(s => s.status === 'done')
    .sort((a, b) => ((b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt))
      || (b.startedAt - a.startedAt) || tieBreak(a, b));
}

/** Yarıda kalmış seans (varsa) — uygulama açılışında "devam et" için */
export async function activeSession() {
  return (await allSessions()).find(s => s.status === 'active') || null;
}

/** En son TAMAMLANMIŞ seans — A/B sırası bundan türetilir (takvimden değil) */
export async function lastDoneSession() {
  return (await doneSessions())[0] || null;
}

/**
 * "Geçen sefer: 40kg × 12" — bir egzersizin en son kaydı.
 * Yalnız ısınma OLMAYAN setlere bakar; ısınma seti referans değildir.
 * @returns {{sets:Array, at:number, session:string}|null}
 */
export async function lastPerformance(exerciseId, excludeSessionId = null) {
  const bul = s => {
    if (s.id === excludeSessionId) return null;
    const e = s.entries.find(x => x.exerciseId === exerciseId);
    const sets = e?.sets.filter(x => !x.warmup) ?? [];
    return sets.length ? { sets, at: s.finishedAt ?? s.startedAt, session: s.id } : null;
  };
  // 1) Bitmiş seanslar — bitiş zamanına göre yeniden eskiye
  for (const s of await doneSessions()) { const r = bul(s); if (r) return r; }
  // 2) Bulunamadıysa yarım kalmış eski seanslara da bak. Kullanıcı "bitir"e
  //    basmayı unutmuş olabilir; girdiği ağırlık yine de geçerli bir referanstır.
  //    (Bu olmadan, bir kez bile "bitir"e basılmamışsa kutular hep boş gelirdi.)
  for (const s of await allSessions()) {
    if (s.status === 'done') continue;
    const r = bul(s); if (r) return r;
  }
  return null;
}

/** Hacim: yalnız ağırlık×tekrar setleri sayılır; süre/kardiyo ayrı raporlanır */
export function sessionVolume(session, exercisesById) {
  let kg = 0, sets = 0, seconds = 0, minutes = 0;
  for (const e of session.entries) for (const s of e.sets) {
    if (s.warmup) { sets++; continue; }
    sets++;
    if (s.type === 'weight_reps') {
      // Dambılda girilen değer TEK dambılın ağırlığıdır → hacimde iki kol sayılır
      const mult = exercisesById?.[e.exerciseId]?.equipment === 'dumbbell' ? 2 : 1;
      kg += (s.weight || 0) * (s.reps || 0) * mult;
    } else if (s.type === 'time') seconds += s.seconds || 0;
    else if (s.type === 'cardio') minutes += s.minutes || 0;
  }
  return { kg: Math.round(kg), sets, seconds, minutes };
}

/* ── Dışa / içe aktarım ────────────────────────────────────────────────── */

export async function exportData() {
  return {
    app: 'fitset',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    sessions: await allSessions(),
  };
}

export async function exportBlob() {
  const json = JSON.stringify(await exportData(), null, 2);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return { blob: new Blob([json], { type: 'application/json' }), filename: `fitset-yedek-${stamp}.json` };
}

/**
 * İçe aktarım. Varsayılan 'merge': aynı id'li seansta DAHA YENİ olan kazanır,
 * bilinmeyen id eklenir. 'replace' her şeyi siler — çağıran onay almalı.
 * Sessizce veri kaybettirmemek için ne yapıldığını sayarak döner.
 */
export async function importData(raw, mode = 'merge') {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (data?.app !== 'fitset') throw new Error('Bu dosya bir FitSet yedeği değil.');
  if (typeof data.schemaVersion !== 'number') throw new Error('Yedek sürümsüz — okunamıyor.');
  if (data.schemaVersion > SCHEMA_VERSION)
    throw new Error(`Yedek daha yeni bir sürümden (v${data.schemaVersion}). Önce uygulamayı güncelle.`);

  if (mode === 'replace') { await driver.clear('sessions'); await driver.clear('settings'); }

  const stat = { eklendi: 0, güncellendi: 0, atlandı: 0 };
  for (const s of data.sessions ?? []) {
    const cur = await getSession(s.id);
    if (!cur) { await saveSession(migrate(s)); stat.eklendi++; }
    else if ((s.finishedAt ?? s.startedAt) > (cur.finishedAt ?? cur.startedAt)) { await saveSession(migrate(s)); stat.güncellendi++; }
    else stat.atlandı++;
  }
  if (data.settings) await saveSettings(data.settings);
  return stat;
}

/** Eski şemadan yeniye taşıma. Şimdilik v1 tek sürüm; ileride buraya eklenecek. */
function migrate(session) {
  if (!session.schemaVersion) session.schemaVersion = 1;
  return session;
}

/** Tarayıcıdan verinin otomatik temizlenmemesini ister (garanti değil) */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return null;
  return navigator.storage.persisted() ? true : navigator.storage.persist();
}
