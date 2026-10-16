/**
 * SEANS MOTORU — bir antrenmanın yaşam döngüsü ve kayıt işlemleri.
 * Saf mantık: DOM'a dokunmaz, bu yüzden Node'da test edilebilir.
 */
import { EX, KUTUPHANE_EK } from './data/exercises.js';
import { KARDIYO } from './data/warmup.js';
import * as P from './program.js';
import * as store from './store.js';
import * as I from './ilerleme.js';
import * as RK from './rekorlar.js';
import * as H from './hazirlik.js';

/**
 * KÜTÜPHANE: id → hareket TANIMI (Plank iki günde de var; tanımları özdeş). Kullanıcının özel
 * hareketleri açılışta buraya eklenir (programlariYukle). Hedef (set × tekrar) burada DEĞİL,
 * programın kaleminde — exercisesFor çözülmüş nesneyi döndürür.
 */
// 13 Eki: kütüphane eki (KUTUPHANE_EK) programa eklenebilir ama ilk programı kurmaz
// 14 Eki: `taslak` kayıt (1B'nin henüz yayına çıkmamış bar hareketleri) kütüphaneye girmez — 3B'si ve denetimleri durur
export const byId = Object.fromEntries([...EX.flat(), ...KUTUPHANE_EK.filter(e => !e.taslak)].map(e => [e.id, e]));

/* ── PROGRAM DURUMU (Faz 1A) ───────────────────────────────────────────────
   Eskiden program kodda sabitti (EX). Artık kullanıcının verisi: açılışta store'dan yüklenir
   (programlariYukle) ve buraya kurulur. Varsayılan "Benim programım" — Node testleri ve
   ilk çizim depolamayı beklemeden çalışsın. */
let programlar = new Map([[P.BENIM_ID, P.benimProgrami()]]);
let aktif = programlar.get(P.BENIM_ID);

/** Programları kur; aktif program verilen kimlik (yoksa ya da silinmişse "Benim programım") */
export function programlariKur(liste, aktifId) {
  programlar = new Map(liste.map(p => [p.id, p]));
  // Hiç program yoksa (taze kurulum, ilk açılış cevaplanmadan) uygulama çalışsın diye bellekte "Benim programım";
  // DİSKE yazılmaz (14 Eki, 1C: yeni kullanıcıya Sabri'nin programı kurulmaz).
  if (![...programlar.values()].some(p => !p.silindi)) programlar.set(P.BENIM_ID, P.benimProgrami());
  const a = programlar.get(aktifId);
  aktif = a && !a.silindi ? a : programlar.get(P.BENIM_ID) ?? [...programlar.values()].find(p => !p.silindi);
  return aktif;
}
export const aktifProgram = () => aktif;
export const programGetir = id => programlar.get(id) ?? null;
/** Görünen programlar (silinmişler geçmiş için bellekte durur ama listelenmez) */
export const programListesi = () => [...programlar.values()].filter(p => !p.silindi);
/** Seansın programı — kimliği olmayan (Faz 1A öncesi) seans "Benim programım"ındır */
export const programOf = s => programlar.get(s?.programId ?? P.BENIM_ID) ?? null;

/**
 * Bir günün hareketleri, ÇÖZÜLMÜŞ (kütüphane tanımı + bu programdaki hedef).
 * Önbellek kalemlerin içeriğine bağlı: düzenleyici programı yerinde değiştirince kendiliğinden tazelenir.
 */
const cozum = new WeakMap();
function gunHareketleri(p, i) {
  const g = p?.gunler[i];
  if (!g) return [];
  const imza = JSON.stringify(g.hareketler) + '|' + g.hareketler.map(k => (byId[k.exId] ? 1 : 0)).join('');
  const c = cozum.get(g);
  if (c?.imza === imza) return c.liste;
  const liste = g.hareketler.map(k => P.cozumle(k, byId));
  cozum.set(g, { imza, liste });
  return liste;
}
export const exercisesFor = dayIndex => gunHareketleri(aktif, dayIndex);
/**
 * Seansın KENDİ programındaki günün hareketleri (geçmiş, özet, düzenleme). Program yoksa
 * seansın kayıtlarından kurulur — geçmiş asla boş kalmaz.
 */
export function exercisesOfSession(s) {
  const l = gunHareketleri(programOf(s), s.dayIndex);
  if (l.length) return l;
  return s.entries.map(e => byId[e.exerciseId] ?? P.cozumle({ exId: e.exerciseId, sets: Math.max(1, e.sets.length), reps: 10 }, byId));
}

/** Gün etiketi: { kisa: '1. Gün', kaslar: 'Göğüs · Omuz · Triceps' } */
const etiket = (p, i) => ({ kisa: P.gunKisa(i), kaslar: P.gunKaslari(p?.gunler[i], gunHareketleri(p, i)) });
export const gunEtiketi = (dayIndex, p = aktif) => etiket(p, dayIndex);
export const gunEtiketiSeans = s => etiket(programOf(s), s.dayIndex);
/** "1. Gün — Göğüs · Omuz · Triceps" */
export const gunAdi = (dayIndex, p = aktif) => { const e = etiket(p, dayIndex); return `${e.kisa} — ${e.kaslar}`; };

/**
 * AKTİF PROGRAMI DEĞİŞTİR (ayara yazılır). Kural çağıranda değil burada: açık seansta set varsa
 * HAYIR — setler başka programın gününe bağlanırdı. Setsiz açık seans (ısınma işareti vb.) bırakılır.
 */
export async function aktifYap(id, acikSeans = null) {
  const p = programlar.get(id);
  if (!p || p.silindi) return { ok: false, neden: 'yok' };
  if (p === aktif) return { ok: true };
  if (acikSeans && hasAnySet(acikSeans)) return { ok: false, neden: 'set' };
  if (acikSeans) await abandon(acikSeans);
  aktif = p;
  await store.saveSettings({ aktifProgram: id });
  return { ok: true };
}

/** Düzenleyicinin kaydı: diske, sonra belleğe (yazma başarısızsa bellek eski hâliyle kalsın diye kopya) */
export async function programYaz(p) {
  const k = structuredClone(p);
  k.guncellendi = Date.now();
  await store.programKaydet(k);
  p.guncellendi = k.guncellendi;
  programlar.set(p.id, p);
  if (aktif.id === p.id) aktif = p;
  return p;
}

/**
 * Programı SİL — yumuşak: kayıt durur (geçmişteki seanslar gün adlarını ondan okur), listede görünmez.
 * Aktif program silinemez (önce başka program aktif yapılır); "Benim programım" da silinemez.
 */
export async function programSil(id) {
  const p = programlar.get(id);
  if (!p || p.id === P.BENIM_ID || p === aktif) return { ok: false };
  p.silindi = Date.now();
  await programYaz(p);
  return { ok: true };
}
export async function programGeriGetir(id) {
  const p = programlar.get(id);
  if (!p) return false;
  delete p.silindi;
  await programYaz(p);
  return true;
}

/** Faz 1A öncesi verisi olan kullanıcı mı: seans ya da eski hedef değişikliği var */
async function eskiVeriVar() {
  if ((await store.allSessions()).length) return true;
  const ayar = await store.getSettings();
  return Object.keys(ayar.overrides ?? {}).length > 0;
}
/**
 * İLK AÇILIŞ GEREKLİ Mİ (Faz 1C): hiç seans yok, kayıtlı program yok ve ilk açılış daha önce geçilmedi.
 * Sabri'nin telefonunda seans olduğu için asla true olmaz.
 */
export async function ilkAcilisGerekli() {
  const ayar = await store.getSettings();
  if (ayar.ilkAcilis) return false;
  if ((await store.programlar()).length) return false;
  return !(await eskiVeriVar());
}
/** İlk açılışı bitir: seçilen (ya da boş) programı kaydet, etkin yap, bir daha sorma */
export async function ilkAcilisiBitir(p) {
  await store.programKaydet(p);
  await store.saveSettings({ aktifProgram: p.id, ilkAcilis: 'tamam' });
  programlariKur(await store.programlar(), p.id);
  return aktif;
}

/** Özel hareketi kütüphaneye ekle (diske, sonra belleğe) */
export async function ozelEkle(h) {
  await store.ozelKaydet(h);
  byId[h.id] = h;
  return h;
}

/**
 * ÖZEL HAREKETİ SİL (14 Eki, Sabri: "kendi eklediğim hareketleri silemiyorum; uygulamanın kendi hareketleri silinemesin,
 * kullanıcının ekledikleri silinebilsin"). Yumuşak: kayıt 'arsiv' işaretiyle durur — geçmişteki setler adını ondan okur
 * (seans düzenleyici programdan çıkmış hareketin kayıtlarını ayrıca gösterir). Seçiciden kalkar ve görünen bütün
 * programların günlerinden çıkar (Sabri: "evet"); silinmiş programlar geçmişin anlık görüntüsüdür, dokunulmaz.
 * Yerleşik (uygulamanın) hareketi silinemez. Dönen `geri` ozelGeriGetir'e verilir (Geri al).
 */
export const ozelKullanim = id => programListesi().filter(p => p.gunler.some(g => g.hareketler.some(k => k.exId === id)));
export async function ozelSil(id) {
  const h = byId[id];
  if (!h?.ozel || h.arsiv) return { ok: false };
  const cikanlar = [];
  for (const p of ozelKullanim(id)) {
    p.gunler.forEach((g, gi) => {
      for (let i = g.hareketler.length - 1; i >= 0; i--)
        if (g.hareketler[i].exId === id) cikanlar.push({ p, gi, i, k: g.hareketler.splice(i, 1)[0] });
    });
    await programYaz(p);
  }
  const k = { ...h, arsiv: true };
  await store.ozelKaydet(k);
  byId[id] = k;
  return { ok: true, programSayisi: new Set(cikanlar.map(c => c.p)).size, geri: { h, cikanlar } };
}
/** Silmeyi geri al: kayıt arşivden çıkar, günlere ESKİ yerlerine döner (çıkarıldıkları sıranın tersiyle) */
export async function ozelGeriGetir({ h, cikanlar }) {
  await store.ozelKaydet(h);
  byId[h.id] = h;
  const degisen = new Set();
  for (const c of [...cikanlar].reverse()) { c.p.gunler[c.gi]?.hareketler.splice(c.i, 0, c.k); degisen.add(c.p); }
  for (const p of degisen) await programYaz(p);
  return true;
}

/** Kütüphanedeki hareketler — seçici bundan süzer (özel hareketler dahil, arşivlenmişler hariç) */
export const kutuphaneListesi = () => Object.values(byId).filter(h => !h.arsiv);

/** Yeni seans — AKTİF programın kimliğini taşır (geçmiş, hangi programda yapıldığını bilsin) */
export const yeniSeans = dayIndex => ({ ...store.newSession(dayIndex), programId: aktif.id });

/**
 * AÇILIŞTA programları yükle (+ göç).
 * GÖÇ (Faz 1A): "Benim programım" yoksa bugünkü programdan kurulur; ayarlardaki hedef
 * değişiklikleri (overrides) programa KATILIR ve ayarlardan boşaltılır — yoksa düzenleyicide
 * yapılan değişikliği eski değer ezerdi. Eski değişikliklerin kopyası ayrı kayıtta saklanır.
 * Seanslara DOKUNULMAZ: kimliği olmayan seans "Benim programım"ındır.
 */
export async function programlariYukle() {
  for (const h of await store.ozelHareketler()) if (!P.gecersizOzel(h)) byId[h.id] = P.ozelTemizle(h);
  // "Benim programım" YALNIZ eski verisi olan kullanıcıya kurulur (Faz 1A göçü: seansı ya da eski hedef değişikliği
  // olan). Taze kurulumda program yok → ilk açılış sorulur (14 Eki, 1C).
  if (!(await store.programlar()).some(p => p.id === P.BENIM_ID) && await eskiVeriVar()) await store.programKaydet(P.benimProgrami());
  await overridesKat();
  const ayar = await store.getSettings();
  programlariKur(await store.programlar(), ayar.aktifProgram);
  return { liste: programListesi(), aktifId: aktif.id };
}

/**
 * Ayarlarda hedef değişikliği varsa "Benim programım"ın kalemlerine kat ve ayarları boşalt.
 * Göçte ve eski bir yedek geri yüklendikten sonra çağrılır (eski yedek overrides taşır).
 */
export async function overridesKat() {
  const ayar = await store.getSettings();
  const ov = ayar.overrides ?? {};
  if (!Object.keys(ov).length) return false;
  const benim = (await store.programlar()).find(p => p.id === P.BENIM_ID) ?? P.benimProgrami();
  for (const g of benim.gunler)
    g.hareketler = g.hareketler.map(k => {
      const o = ov[k.exId], ex = byId[k.exId];
      if (!o || !ex) return k;
      const alan = P.hedefAlani(ex.setType);
      const yeni = P.kalem({ ...ex, sets: k.sets, setsMin: k.setsMin, target: { [alan]: k[alan] } }, o);
      if (o.weight == null && k.agirlik != null) yeni.agirlik = k.agirlik;
      return yeni;
    });
  benim.guncellendi = Date.now();
  await store.programKaydet(benim);
  // önce kopya, sonra boşalt (yazma yarıda kalırsa değişiklik kaybolmasın)
  await store.driver.put('settings', { key: 'goc-1a', overrides: ov, at: Date.now() });
  await store.saveSettings({ overrides: {} });
  return true;
}

/** O günün ısınma adımları — numarasız, sete ve hacme sayılmaz (program.isinmaFor) */
export const warmupFor = dayIndex => P.isinmaFor(aktif.gunler[dayIndex], exercisesFor(dayIndex));
export const isinmaSuresi = dayIndex => P.isinmaSuresi(aktif.gunler[dayIndex]);
export { KARDIYO };

/** Isinma yapildi isareti — tek bayrak, baska hicbir sey tutulmuyor */
export function setWarmupDone(session, done = true) {
  session.warmupDone = done;
  return session;
}
/** Antrenman sonrası kardiyo — yoksa null (yeni programların günleri) */
export const finisherFor = dayIndex => P.bitisFor(aktif.gunler[dayIndex]);

/**
 * Sıradaki gün — TAKVİMDEN DEĞİL, geçmişten.
 * Hiç seans yoksa 1. Gün'den başlanır.
 */
export async function nextDayIndex() {
  // Yalnız AKTİF programın seansları sayılır (başka programda yapılan gün bu programın sırasını kaydırmasın)
  const son = (await store.doneSessions()).find(s => (s.programId ?? P.BENIM_ID) === aktif.id);
  const n = aktif.gunler.length || 1;
  return son ? (son.dayIndex + 1) % n : 0;
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
  let active = await store.activeSession();
  // Açık seans başka bir programa aitse (program değiştirildi, yedek geri yüklendi): seti varsa o
  // programa geç — setler kendi gününde kalsın; yoksa bırak. Gün artık yoksa (gün silindi) setsiz seans da bırakılır.
  if (active) {
    const ap = programOf(active);
    if (ap && ap !== aktif && !ap.silindi && hasAnySet(active)) { aktif = ap; await store.saveSettings({ aktifProgram: ap.id }); }
    else if ((ap !== aktif || active.dayIndex >= aktif.gunler.length) && !hasAnySet(active)) { await abandon(active); active = null; }
  }
  if (active) return { session: active, resumed: true, stale };
  return { session: yeniSeans(await nextDayIndex()), resumed: false, stale };
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
  return exercisesOfSession(session).filter(ex => {
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
  // Kayıtsız gün 0/9 görünür ama YARIM DEĞİLDİR — kullanıcı "tamamladım" dedi.
  // Bu koruma olmadan "1. Gün yarım kaldı, 0/9" diyerek tam tersini söylüyordu.
  if (son.kayitsiz) return null;
  // Başka programın yarım günü bu programa devredilemez (günler aynı değil)
  if ((son.programId ?? P.BENIM_ID) !== aktif.id) return null;
  const toplam = exercisesOfSession(son).length;
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

/* ── Gün seçimi ve kayıtsız gün ────────────────────────────────────────────
 * Sıra geçmişten türetiliyor (doğru) ama kullanıcının bunu DEĞİŞTİREBİLECEĞİ
 * hiçbir yer yoktu. Telefonsuz yapılan gün uygulama için hiç olmamış sayılıyor
 * ve sıra sonsuza kadar orada bekliyordu.
 *
 * Emsallerin kalıbı "ÖNER, DAYATMA": sıradaki gün, tamamlanana YA DA bilerek
 * atlanana kadar sıradaki kalır. FitSet önerinin ilk yarısını yapıyordu.
 */

/** Programdaki tüm günler — seçici bundan üretilir, gün sayısı artarsa büyür */
export const allDays = () => aktif.gunler.map((_, i) => ({ dayIndex: i, name: gunAdi(i) }));

/**
 * Gün değiştirilebilir mi? Set girilmişse HAYIR — girilen setler yanlış güne
 * bağlanırdı. Sebebini de döndürür ki arayüz "neden" diyebilsin.
 */
export function canSwitchDay(session) {
  if (hasAnySet(session)) return { ok: false, neden: 'set' };
  return { ok: true };
}

/**
 * Bugünün gününü elle değiştir. Seans DİSKE yazılır — yoksa yenilemede seçim
 * kaybolur (aynı tuzağın dördüncü hâli olurdu).
 */
export async function chooseDay(session, dayIndex) {
  const izin = canSwitchDay(session);
  if (!izin.ok) return izin;
  // İşlemsel: yazma başarısızsa bellekteki gün de DEĞİŞMEZ
  await transact(session, s => { s.dayIndex = dayIndex; s.dayChosen = true; });   // "kullanıcı seçti" — sıra bunu ezmesin
  return { ok: true };
}

/**
 * "Bu günü kaydetmeden yaptım."
 * Kaydı olmayan ama YAPILMIŞ bir gün: sırayı ilerletir, geçmişte görünür,
 * ama hacme/"geçen sefer"e karışmaz (uydurma istatistik üretmesin).
 *
 * Tarih: bugün değil SON ANTRENMAN GÜNÜ — telefonsuz yapılan antrenman
 * tipik olarak bugün değil, önceki program günündeydi.
 */
export async function markDayDone(dayIndex, at = Date.now()) {
  const s = yeniSeans(dayIndex);
  s.status = 'done';
  s.kayitsiz = true;                    // ⚠️ hacim/geçen-sefer bunu ATLAR
  s.carryResolved = true;                // yarım sanılmasın (aşağıdaki korumaya ek kemer)
  s.startedAt = s.finishedAt = at;
  await store.saveSession(s);
  return s;
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
  // 13 Eki (1B): bar hareketinde geçmiş ve plan yoksa boş bar (20 kg · 45 lb) — eskiden boş gelip ekranda "0 kg · bar dahil"
  // yazıyordu; boş bar zaten 20 kg, 0 bu harekette olanaksız bir değer
  const bosBar = ex.equipment === 'barbell' ? (settings?.unit === 'lb' ? 45 : 20) : null;
  return { type: 'weight_reps', weight: t.weight ?? bosBar, reps: t.reps, warmup: false };
}

/**
 * Yeni set için ÖNERİLEN değerler.
 * Öncelik: (1) bu seansta zaten girilmiş son set → aynısını tekrarla (ağırlık artırıldıysa yeni ağırlık sürer),
 *          (2) geçen seferki İLK çalışma seti, (3) boş.
 * Bu bir TAVSİYE değil, tuş sayısını azaltan bir ön-doldurmadır.
 * ⚠️ 10 Eki: (2) eskiden geçen seferin SON setiydi; son set yorgunlukla düştüğü için (12 · 12 · 10) hedef 12'yken
 * 1. set "× 10" geliyordu (Sabri'nin ekran turunda görüldü).
 */
export function suggestSet(ex, session, lastPerf, settings) {
  const mine = entryFor(session, ex.id).sets.filter(s => !s.warmup);
  const src = mine.at(-1) ?? lastPerf?.sets?.[0];
  const base = blankSet(ex, settings);
  if (!src || src.type !== base.type) return base;
  return { ...base, ...(src.weight != null && { weight: src.weight }), reps: src.reps ?? base.reps };
}

export function recordSet(session, exerciseId, data) {
  const set = { ...data, ts: Date.now() };
  entryFor(session, exerciseId).sets.push(set);
  return set;
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

/** G4 (17 Eki): harekete kısa not (makine ayarı, his) — en çok NOT_SINIR karakter, kırpılır */
export const NOT_SINIR = 140;
export function setNote(session, exerciseId, note) {
  entryFor(session, exerciseId).note = String(note ?? '').trim().slice(0, NOT_SINIR);
}

/* ── G4: TOPARLANMA KONTROLÜ (js/hazirlik.js) ──────────────────────────────
   Cevap ve öneri seansa yazılır (hazirlik); "hafiflet" yalnız BUGÜN hareketlerde birer set az yapar (setHedefi —
   programı değiştirmez) ve geri alınabilir. Kardiyo ve tek setlik hareket azaltılmaz. */
export function hazirlikYaz(session, cevap, duzey) {
  session.hazirlik = { ...H.temizle(cevap), duzey };
}
export function hafiflet(session, dayIndex, settings) {
  const azalan = [];
  for (const ex of exercisesFor(dayIndex)) {
    if (ex.setType === 'cardio' || hedefSet(session, ex, settings) <= 1) continue;
    const once = hedefSet(session, ex, settings);
    if (setHedefiDegis(session, ex, settings, -1) < once) azalan.push(ex.id);
  }
  session.hazirlik = { ...(session.hazirlik ?? {}), azalan };
  return azalan;
}
export function hafifGeriAl(session, settings) {
  for (const id of session.hazirlik?.azalan ?? []) { const ex = byId[id]; if (ex) setHedefiDegis(session, ex, settings, 1); }
  if (session.hazirlik) { const { azalan, ...kalan } = session.hazirlik; session.hazirlik = kalan; }
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
    weight: o.weight ?? ex.agirlik ?? null,   // planlanan ağırlık (isteğe bağlı; programın kaleminden)
    // G1 (17 Eki): tekrar aralığının alt sınırı · hedef RIR · hareket başına dinlenme — yoksa null (genel ayar / yok)
    repsMin: ex.repsMin != null && ex.repsMin < (o.reps ?? ex.target.reps) ? ex.repsMin : null,
    rir: ex.rir ?? null,
    dinlenme: ex.dinlenme ?? null,
    edited: Object.keys(o).length > 0,
  };
}

/** Bu hareketin dinlenmesi (sn): kalemdeki süre, yoksa genel ayar (G1) */
export const dinlenmeSuresi = (ex, settings) => effective(ex, settings).dinlenme ?? settings?.restSeconds ?? 60;

/**
 * Son çalışma setine RIR yaz (G1): set kaydedildikten sonra "kaç tekrar daha yapabilirdin?" sorusunun cevabı.
 * Isınma setine yazılmaz. `rir` null → kaldırılır. @returns {object|null} güncellenen set
 */
export function setRir(session, exerciseId, rir) {
  const e = session.entries.find(x => x.exerciseId === exerciseId);
  const s = e?.sets.filter(x => !x.warmup && x.type === 'weight_reps').at(-1);
  if (!s) return null;
  if (rir == null) delete s.rir; else s.rir = Math.max(0, Math.min(5, Math.round(rir)));
  return s;
}

/** "3 × 12" / "3 × 15 sn" — etiket artık veriden türetiliyor, elle yazılmıyor */
export function repsLabel(ex, settings) {
  const t = effective(ex, settings);
  const alt = ex.setsMin && ex.setsMin !== t.sets ? `${ex.setsMin}-${t.sets}` : `${t.sets}`;
  if (ex.setType === 'time') return `${alt} × ${t.seconds} sn`;
  if (ex.setType === 'cardio') return `${t.minutes} dk`;
  return `${alt} × ${t.repsMin ? `${t.repsMin}-` : ''}${t.reps}`;
}

/** { done, total, pct } — hedef set sayısına göre ilerleme */
export function progress(session, dayIndex, settings) {
  const exs = exercisesFor(dayIndex);
  const total = exs.reduce((a, e) => a + hedefSet(session, e, settings), 0);
  const done = session.entries.reduce((a, e) => {
    const ex = exs.find(x => x.id === e.exerciseId) ?? byId[e.exerciseId];
    const hedef = ex ? hedefSet(session, ex, settings) : e.sets.length;
    return a + Math.min(e.sets.filter(s => !s.warmup).length, hedef);  // fazla set >%100 yapmasın
  }, 0);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

/** Egzersiz bazında: kaç set girildi, hedefe ulaşıldı mı */
/**
 * BUGÜNKÜ SET SAYISI (11 Eki, Sabri'nin set ekranı tasarımı) — programın hedefi bu seans için
 * değiştirilebilir ("bugün bir set daha", "bugün 2 set yeter"). PROGRAM DEĞİŞMEZ: değer seansta
 * `setHedefi[hareketId]` olarak durur; programın kendi sayısına dönülünce kayıt silinir.
 */
export const hedefSet = (session, ex, settings) => session?.setHedefi?.[ex.id] ?? effective(ex, settings).sets;

/**
 * Bugünkü set sayısını bir artır/azalt. Şimdiki setin altına İNMEZ (yapılmış setler + 1):
 * erken bitirmek "Sonraki" ile olur — sayıyı düşürüp yapılmış setleri "fazladan" saymak veriyi bulandırırdı.
 * Seansı DEĞİŞTİRİR (çağıran transact ile yazar); yeni değeri döndürür.
 */
export function setHedefiDegis(session, ex, settings, yon) {
  const yapilan = (session.entries.find(e => e.exerciseId === ex.id)?.sets ?? []).filter(s => !s.warmup).length;
  const yeni = Math.min(P.SINIR.sets.ec, Math.max(yapilan + 1, P.SINIR.sets.en, hedefSet(session, ex, settings) + yon));
  const kalan = { ...session.setHedefi };
  if (yeni === effective(ex, settings).sets) delete kalan[ex.id]; else kalan[ex.id] = yeni;
  // ⚠️ Silme yerine YENİ nesne / undefined: transact kopyayı Object.assign ile geri yazar ve
  // silinmiş bir alan asıl seansta KALIRDI (programın sayısına dönüş sessizce işlemezdi).
  session.setHedefi = Object.keys(kalan).length ? kalan : undefined;
  return yeni;
}

export function exerciseProgress(session, ex, settings) {
  const sets = session.entries.find(x => x.exerciseId === ex.id)?.sets ?? [];
  const calisma = sets.filter(s => !s.warmup).length;
  const hedef = hedefSet(session, ex, settings);
  return { sets, calisma, hedef, tamam: calisma >= hedef };
}

/**
 * "DEVAM ET" HEDEFİ — kaldığın hareketin sırası.
 * Önce YARIM bırakılan (en az bir çalışma seti var, hedefe ulaşmamış) hareket; yoksa
 * programda sırası gelen ilk tamamlanmamış hareket. Hepsi tamamsa -1.
 * ⚠️ 27 Eyl'e kadar liste bunu hiç söylemiyordu: `.li.now` stili tanımlıydı ama hiçbir
 * satır o sınıfı almıyordu, "nerede kaldım" 5 px'lik gri noktalardan okunuyordu.
 */
export function devamHedefi(session, dayIndex, settings) {
  const q = exercisesFor(dayIndex).map(ex => exerciseProgress(session, ex, settings));
  const yarim = q.findIndex(p => p.calisma > 0 && !p.tamam);
  return yarim >= 0 ? yarim : q.findIndex(p => !p.tamam);
}

/**
 * LİSTE EKRANININ BİRİNCİL EYLEMİ — tek yerden karar.
 * Eskiden ekranın en büyük, en parlak düğmesi ilk setten itibaren "Seansı bitir"di:
 * uygulama kullanıcıyı bitirmeye yönlendiriyordu. Artık sıradaki iş öne çıkar,
 * bitirmek ancak her hareket tamamken birincil olur.
 *   {tur:'isinma'} · {tur:'hareket', idx, basladi} · {tur:'bitir'}
 */
export function siradakiEylem(session, dayIndex, settings) {
  if (!hasAnySet(session) && !session.warmupDone) return { tur: 'isinma' };
  const idx = devamHedefi(session, dayIndex, settings);
  if (idx < 0) return { tur: 'bitir' };
  return { tur: 'hareket', idx, basladi: exerciseProgress(session, exercisesFor(dayIndex)[idx], settings).calisma > 0 };
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
/**
 * ⚠️ Bu liste ÜÇ KEZ eksik kaldı (warmupDone → carriedFrom → dayChosen), her
 * seferinde aynı biçimde: kullanıcı bir KARAR veriyor, henüz set girmediği için
 * seans diske yazılmıyor, karar yenilemede buharlaşıyor. Dördüncüsünü beklemek
 * yerine kural yazıldı: **sette olmayan ama kullanıcıdan gelen her işaret**
 * kayda değerdir. Yeni bir bayrak eklerken buraya EKLE — ya da daha iyisi,
 * `KARAR_BAYRAKLARI` listesine.
 */
export const KARAR_BAYRAKLARI = ['warmupDone', 'carriedFrom', 'dayChosen', 'kayitsiz', 'setHedefi'];

export const hasAnyRecord = session =>
  hasAnySet(session) || KARAR_BAYRAKLARI.some(k => !!session[k]) || session.entries.some(e => e.note);   // G4: setten önce yazılan not da kayıttır

export async function persist(session) {
  if (hasAnyRecord(session)) { await store.saveSession(session); return; }
  // Gerçekten boş seans YAZILMAZ — ama daha önce yazılmışsa diskte de KALMAZ.
  // ⚠️ Eskiden burada yalnız `return` vardı. İlk seti "geri al"ınca seans
  // bellekte boşalıyor, disk ise o seti taşımaya devam ediyordu; uygulama
  // yeniden açılınca geri alınan set GERİ GELİYORDU (24 Eyl, ölçüldü:
  // bellekte 0 · diskte 1 · yeniden açılışta 1).
  await abandon(session);
}

/**
 * İŞLEMSEL DEĞİŞİKLİK — önce DİSK, sonra BELLEK.
 *
 * ⚠️ Kök hata (24 Eyl, tarayıcıda üretildi): set önce bellekteki seansa
 * ekleniyor, sonra diske yazılıyordu. Yazma başarısız olunca (kota, depolama
 * hatası) bellek İLERLEMİŞ kalıyor ama ekran değişmiyordu; kullanıcı "basmadım
 * galiba" deyip tekrar basıyor, depolama düzelince TEK dokunuş üç set yazıyordu
 * (ikisi hayalet). Hata oluştuğu yerde değil, bir sonraki DOĞRU işlemde görünür.
 *
 * Çözüm: değişiklik bir KOPYADA yapılır, kopya diske yazılır; yalnız yazma
 * başarılıysa kopya belleğe geçer. Yazma hata verirse `session` DOKUNULMAMIŞ
 * kalır ve hata çağırana fırlar — arayüz onu kullanıcıya söylemek zorunda.
 *
 * @param {object} session  bellekteki seans (başarıda YERİNDE güncellenir)
 * @param {(kopya:object)=>any} degistir  kopya üzerinde çalışan değişiklik
 * @returns {Promise<any>} degistir'in dönüşü (kopyanın nesnelerine işaret eder;
 *          başarıdan sonra bunlar session'ın nesneleridir)
 */
export async function transact(session, degistir) {
  const kopya = structuredClone(session);
  const sonuc = degistir(kopya);
  await persist(kopya);                     // hata burada fırlar → session aynen kalır
  Object.assign(session, kopya);
  return sonuc;
}

/**
 * Yeni sürüm SW'si beklerken ne yapılmalı?
 *   'uygula' → hiçbir şey kaybolmaz, sayfa yeniden yüklenebilir
 *   'bekle'  → kaybolacak bir şey var ama set değil (ekran konumu, sayaç,
 *              yazılmış ama kaydedilmemiş değer) — liste ekranına dönülünce uygula
 *   'sor'    → seansta set var; kesintinin bedeli kullanıcının kararı
 *
 * ⚠️ Eskiden tek ölçüt "set var mı"ydı. Isınma ekranındayken, ağırlık yazmışken
 * ya da ilk Plank sayacı çalışırken uygulamaya dönünce yeni sürüm sayfayı
 * yeniden yüklüyor ve kullanıcıyı listeye atıyordu. Kural buraya (app.js'e
 * değil) taşındı ki test edilebilsin.
 */
export function guncellemeKarari({ ekran, seansSetli, sayacCalisiyor }) {
  if (seansSetli) return 'sor';
  if (ekran !== 'list' || sayacCalisiyor) return 'bekle';
  return 'uygula';
}

/** Anlık hacim — liste ekranındaki özet şeridi için (senkron) */
export const summaryVolume = session => store.sessionVolume(session, byId);

/** Bitiş özeti */
export async function summary(session) {
  const v = store.sessionVolume(session, byId);
  const dk = session.finishedAt && session.startedAt
    ? Math.max(1, Math.round((session.finishedAt - session.startedAt) / 60000)) : null;
  return { ...v, minutesElapsed: dk, dayName: gunAdi(session.dayIndex, programOf(session)) };
}

/** Bir seansta o hareketin en ağır ÇALIŞMA seti (ısınma ve ağırlıksız setler hariç) */
const enAgirSet = (s, exerciseId) => {
  const w = (s.entries.find(e => e.exerciseId === exerciseId)?.sets ?? [])
    .filter(x => !x.warmup && x.type === 'weight_reps' && x.weight > 0).map(x => x.weight);
  return w.length ? Math.max(...w) : null;
};

/**
 * SEANS SONU ÖZETİ — saf hesap (özet ekranı bunu gösterir).
 *
 * ⚠️ Antrenmanın son anı eskiden tek bir bildirim şeridiydi ve her 8. seansta 0,9 sn sonra
 * yedek hatırlatması onu SİLİYORDU (toast() öncekini kaldırır); ardından liste bir sonraki
 * günün boş hâline dönüyordu. Veri (hacim farkı, aşılan en ağır setler) vardı, gösterilmiyordu.
 *
 * 14 Eki (rekorlar ve antrenman özeti, plan docs/2026-10-14-rekorlar-ve-antrenman-ozeti-PLAN.md): rekorlar, günün hacim
 * rekoru, gelecek sefer önerisi, haftalık düzen ve programın son gününde dönem bilgisi de burada hesaplanır.
 *
 * @param {object} seans   az önce biten seans
 * @param {Array}  onceki  bitmiş seanslar, EN YENİDEN eskiye, bu seans HARİÇ
 * @param {object} [settings]  ayarlar (hedefler, ağırlık adımı, antrenman günleri)
 * @returns {{sure, calismaSet, kg, seconds, hacimFarki, hacimKismi, artislar:Array<{ex, once, simdi}>,
 *            onceki:{sure, calismaSet}|null, rekor:{kirilan, ilkler}, gunHacmi:{once, simdi}|null, gelecek:Array, duzen, donem}}
 *   hacimFarki: aynı günün önceki sayılabilir seansına göre, İKİSİNDE DE yapılan hareketlerin hacim oranı
 *               (−0,05 = %5 az); kıyas yoksa null · hacimKismi: geçen seferin bazı hareketleri bugün yapılmadı
 *   artislar  : bugünkü en ağır set, o hareketin EN SON yapıldığı önceki seanstakinden ağırsa
 */
export function seansOzeti(seans, onceki, settings = {}) {
  const v = store.sessionVolume(seans, byId);
  const calismaSet = seans.entries.reduce((a, e) => a + e.sets.filter(s => !s.warmup).length, 0);
  const sure = seans.finishedAt && seans.startedAt
    ? Math.max(1, Math.round((seans.finishedAt - seans.startedAt) / 60000)) : null;
  // Kayıtsız gün hacimsizdir — kıyasa girerse her şey "+∞" görünürdü
  const sayilir = onceki.filter(s => !s.kayitsiz && s.id !== seans.id);
  const ayniGun = sayilir.find(s => s.dayIndex === seans.dayIndex && store.sessionVolume(s, byId).kg > 0);
  // ORTAK HAREKETLER (10 Eki): kıyas yalnız iki seansta da çalışma seti olan hareketler üzerinden. Eskiden geçen
  // seansın TAMAMIYLA kıyaslanıyordu → yarım bırakılan seans "−%89" gibi olumsuz bir kapanış yapıyordu; bugün eklenen
  // bir hareket de farkı şişiriyordu.
  const yapilan = x => new Set(x.entries.filter(e => e.sets.some(s => !s.warmup)).map(e => e.exerciseId));
  const bugunku = yapilan(seans), oncekiler = ayniGun ? yapilan(ayniGun) : new Set();
  const ortak = new Set([...bugunku].filter(id => oncekiler.has(id)));
  const kgOrtak = x => store.sessionVolume({ ...x, entries: x.entries.filter(e => ortak.has(e.exerciseId)) }, byId).kg;
  const oncekiKg = ayniGun ? kgOrtak(ayniGun) : 0, bugunKg = kgOrtak(seans);
  const hacimFarki = oncekiKg > 0 && bugunKg > 0 ? (bugunKg - oncekiKg) / oncekiKg : null;
  // Geçen seferin hareketlerinden bazıları bugün yapılmadıysa kıyas KISMİDİR — ekran bunu söyler
  const hacimKismi = hacimFarki != null && ortak.size < oncekiler.size;
  const artislar = [];
  for (const ex of exercisesOfSession(seans)) {
    const simdi = enAgirSet(seans, ex.id);
    if (simdi == null) continue;
    const son = sayilir.find(s => enAgirSet(s, ex.id) != null);
    const once = son ? enAgirSet(son, ex.id) : null;
    if (once != null && simdi > once + 1e-9) artislar.push({ ex, once, simdi });
  }
  const calisma = x => x.entries.reduce((a, e) => a + e.sets.filter(s => !s.warmup).length, 0);
  const oncekiOzet = ayniGun ? { sure: ayniGun.finishedAt && ayniGun.startedAt
    ? Math.max(1, Math.round((ayniGun.finishedAt - ayniGun.startedAt) / 60000)) : null, calismaSet: calisma(ayniGun) } : null;
  // Günün hacim rekoru: bu programın bu gününün önceki bütün seanslarından fazla (ilk seansta yok)
  const pid = s => s.programId ?? P.BENIM_ID;
  const gunKg = sayilir.filter(s => s.dayIndex === seans.dayIndex && pid(s) === pid(seans)).map(s => store.sessionVolume(s, byId).kg);
  const enCok = gunKg.length ? Math.max(...gunKg) : 0;
  const gunHacmi = enCok > 0 && v.kg > enCok + 1e-9 ? { once: enCok, simdi: v.kg } : null;
  const hedef = (settings.trainingDays ?? []).length || 3;
  const rekor = RK.seansRekorlari(seans, sayilir);
  const hepsi = [seans, ...onceki.filter(s => s.id !== seans.id)];
  return { sure, calismaSet, kg: v.kg, seconds: v.seconds, hacimFarki, hacimKismi, artislar, onceki: oncekiOzet,
    rekor, gunHacmi, gelecek: gelecekSefer(seans, sayilir, settings),
    duzen: RK.haftalikDuzen(hepsi, hedef, seans.finishedAt ?? Date.now()),
    donem: donemBilgisi(seans, onceki), ovgu: ovguSec(seans, sayilir, rekor, hedef, hepsi, settings.unit ?? 'kg') };
}

/**
 * HAK EDİLMİŞ ÖVGÜ (14 Eki, Sabri: "gerçekten başarılı biri için başardın, gelişiyorsun, istikrarlısın diyebilir miyiz?").
 * Davranışı över, kişiyi değil (Mueller & Dweck 1998); bilgi veren olumlu geri bildirim içsel motivasyonu artırır (Deci,
 * Koestner & Ryan 1999). Kurallar: koşul ÖLÇÜLÜR, övgünün yanında daima kanıtı (sayı) durur, sayfa başına TEK övgü
 * (öncelik: başardın > gelişiyorsun > istikrarlısın > zor antrenman); koşul yoksa övgü yok — açılış istatistik verir.
 * @returns {null | {tur:'rekor'|'gelisim'|'istikrar'|'zor', baslik, kanit}}
 */
const GUN = 864e5;
const zamanOf = s => s.finishedAt ?? s.startedAt ?? 0;
export function ovguSec(seans, onceki, rekor, hedef, hepsi, birim = 'kg') {
  const ad = id => byId[id]?.ad ?? id;
  // 1 · Başardın — rekor
  if (rekor.kirilan.length) {
    const ilk = rekor.kirilan[0], kisa = { agir: 'en ağır set', bir: 'tahmini 1 tekrar maksimumu', hacim: 'en iyi set hacmi', tekrar: 'en çok tekrar', sure: 'en uzun süre' };
    const deger = (t, x) => t === 'tekrar' ? `${sayiYaz(x)} tekrar` : t === 'sure' ? `${sayiYaz(x)} sn` : `${sayiYaz(t === 'agir' ? x : Math.round(x))} ${birim}`;
    return { tur: 'rekor', baslik: 'Başardın.', kanit: rekor.kirilan.length === 1
      ? `${ad(ilk.exId)}: yeni rekor, ${kisa[ilk.ana.tur]} ${deger(ilk.ana.tur, ilk.ana.simdi)}.`
      : `${rekor.kirilan.length} yeni rekor: ${rekor.kirilan.slice(0, 3).map(k => ad(k.exId)).join(', ')}.` };
  }
  // 2 · Gelişiyorsun — bir hareket 2–5 hafta önceki ilk yapılışına göre en az %5 (ağırlık / tekrar / süre)
  const t = zamanOf(seans);
  let en = null;
  for (const e of seans.entries) {
    const bugun = enIyiDeger(e.sets);
    if (!bugun) continue;
    const taban = onceki.filter(s => s.id !== seans.id && t - zamanOf(s) >= 14 * GUN && t - zamanOf(s) <= 35 * GUN)
      .sort((a, b) => zamanOf(a) - zamanOf(b))
      .map(s => ({ s, d: enIyiDeger(s.entries.find(x => x.exerciseId === e.exerciseId)?.sets ?? []) })).find(x => x.d?.tur === bugun.tur);
    if (!taban) continue;
    const oran = (bugun.deger - taban.d.deger) / taban.d.deger;
    if (oran >= 0.05 && (!en || oran > en.oran)) en = { exId: e.exerciseId, oran, fark: bugun.deger - taban.d.deger, tur: bugun.tur, hafta: Math.round((t - zamanOf(taban.s)) / (7 * GUN)) };
  }
  if (en) {
    const fark = en.tur === 'tekrar' ? `+${sayiYaz(en.fark)} tekrar` : en.tur === 'sure' ? `+${sayiYaz(en.fark)} sn` : `+${sayiYaz(en.fark)} ${birim}`;
    return { tur: 'gelisim', baslik: 'Gelişiyorsun.', kanit: `${ad(en.exId)}: ${en.hafta} haftada ${fark}.` };
  }
  // 3 · İstikrarlısın — en az 4 hafta arka arkaya haftalık hedef tamam
  const ardisik = RK.ardisikTamHafta(hepsi, hedef, t);
  if (ardisik >= 4) return { tur: 'istikrar', baslik: 'İstikrarlısın.', kanit: `${ardisik} haftadır her hafta hedefin (${hedef} antrenman) tamam.` };
  // 4 · Zor antrenman — son 4 haftanın en yüksek hacmi (en az 3 kıyas antrenmanı varken)
  const vKg = store.sessionVolume(seans, byId).kg;
  const son4 = onceki.filter(s => s.id !== seans.id && t - zamanOf(s) <= 28 * GUN && t >= zamanOf(s)).map(s => store.sessionVolume(s, byId).kg);
  if (vKg > 0 && son4.length >= 3 && vKg > Math.max(...son4)) {
    const set = seans.entries.reduce((a, e) => a + e.sets.filter(s => !s.warmup).length, 0);
    return { tur: 'zor', baslik: 'Zor bir antrenmanı bitirdin.', kanit: `${set} set, ${Math.round(vKg).toLocaleString('tr-TR')} ${birim}: son 4 haftanın en yüksek hacmi.` };
  }
  return null;
}

/** Bir hareketin bir seanstaki en iyi değeri, türüyle: ağırlıklı → en ağır · vücut ağırlığı → en çok tekrar · süreli → en uzun */
function enIyiDeger(sets) {
  let r = null;
  for (const s of sets ?? []) {
    const d = RK.setDegerleri(s), tur = d.agir != null ? 'agir' : d.tekrar != null ? 'tekrar' : d.sure != null ? 'sure' : null;
    if (!tur) continue;
    if (!r || (tur === r.tur && d[tur] > r.deger) || (tur === 'agir' && r.tur !== 'agir')) r = { tur, deger: d[tur] };
  }
  return r;
}

const sayiYaz = v => String(+(+v).toFixed(2)).replace('.', ',');

/**
 * GELECEK SEFER (K7) — bugün yapılan her hareket için tek somut öneri + kısa "neden". Ağırlıklı harekette kural
 * ilerleme.oneri (ACSM, iki seans) — set ekranındaki ? paneliyle AYNI sonuç. Öneri yoksa öğretici satır. Öneri dili.
 * @param {Array} onceki  bitmiş seanslar EN YENİDEN eskiye, bu seans HARİÇ (kayıtsızlar çıkarılmış)
 * @returns {Array<{ex, tur:'artir'|'kal', deger, neden}>}  önce artırılacaklar, en çok 4
 */
export function gelecekSefer(seans, onceki, settings = {}) {
  const birim = settings.unit ?? 'kg', out = [];
  const sira = [seans, ...onceki.filter(s => s.id !== seans.id)];
  for (const ex of exercisesOfSession(seans)) {
    const setler = (seans.entries.find(e => e.exerciseId === ex.id)?.sets ?? []).filter(s => !s.warmup);
    if (!setler.length) continue;
    const h = effective(ex, settings);
    if (ex.setType === 'time') {
      if (!(h.seconds > 0)) continue;
      const tamam = setler.length >= h.sets && setler.every(s => (s.seconds ?? 0) >= h.seconds);
      out.push(tamam ? { ex, tur: 'artir', deger: `${h.sets} × ${h.seconds + 5} sn dene`, neden: `Bugün her set ${h.seconds} sn ya da fazlası.` }
        : { ex, tur: 'kal', deger: `${h.sets} × ${h.seconds} sn`, neden: `Bugün ${setler.map(s => s.seconds ?? 0).join('-')} sn; önce hepsini ${h.seconds} sn yap.` });
      continue;
    }
    if (ex.setType !== 'weight_reps' || !(h.reps > 0)) continue;
    const tekrar = setler.map(s => s.reps ?? 0).join('-');
    const W = Math.max(...setler.map(s => s.weight ?? 0));
    const tamam = setler.length >= h.sets && setler.every(s => (s.reps ?? 0) >= h.reps);
    if (!(W > 0)) {                       // vücut ağırlığı (ek ağırlıksız): tekrar ilerler
      out.push(tamam ? { ex, tur: 'artir', deger: `${h.sets} × ${h.reps + 1} dene`, neden: `Bugün her sette ${h.reps} tekrar tamam (${tekrar}).` }
        : { ex, tur: 'kal', deger: `${h.sets} × ${h.reps} hedefle`, neden: `Bugün ${tekrar}. Hedef her sette ${h.reps}.` });
      continue;
    }
    const o = I.oneri(ex, sira, h, I.agirlikAdimi(ex, settings));
    if (o?.tur === 'agirlik') out.push({ ex, tur: 'artir', deger: `${sayiYaz(o.agirlik)} ${birim} dene`, neden: `İki seanstır ${sayiYaz(o.onceki)} ${birim} ile ${o.setler} × ${o.tekrar} tamam.` });
    else if (o?.tur === 'tekrar') out.push({ ex, tur: 'artir', deger: `${h.sets} × ${o.hedefTekrar} dene`, neden: 'Ağırlık adımı bu ağırlığa göre büyük; önce tekrarı artır.' });
    else if (tamam) out.push({ ex, tur: 'kal', deger: `${sayiYaz(W)} ${birim} · ${h.sets} × ${h.reps}`, neden: `Bir seans daha ${h.sets} × ${h.reps} yaparsan ağırlık önerilecek.` });
    else out.push({ ex, tur: 'kal', deger: `${sayiYaz(W)} ${birim} · ${h.sets} × ${h.reps}`, neden: `Bugün ${tekrar} yaptın; önce bu ağırlıkta ${h.sets} × ${h.reps} tamamla.` });
  }
  return out.sort((a, b) => (a.tur === 'artir' ? 0 : 1) - (b.tur === 'artir' ? 0 : 1)).slice(0, 4);
}

/**
 * DÖNEM (K9): programın SON günü bittiyse bu dönemin özeti. Dönem = bu programın bir önceki "son gün" seansından sonraki
 * antrenmanlar (bu seans dahil). Ana hareketler: dönemdeki en iyi tahmini 1RM ↔ önceki dönemdeki (önceki dönem yoksa yok).
 * @param {Array} onceki  bitmiş seanslar, bu seans hariç (sıra önemsiz)
 * @returns {null | {program, antrenman, gun, hacim, oncekiHacim, calismaSet, rekorSayisi, hareketler:Array<{ex, once, simdi}>}}
 */
export function donemBilgisi(seans, onceki) {
  const p = programOf(seans), n = p?.gunler?.length ?? 0;
  if (n < 2 || seans.dayIndex !== n - 1) return null;
  const pid = s => s.programId ?? P.BENIM_ID, zm = s => s.finishedAt ?? s.startedAt ?? 0;
  const ayni = onceki.filter(s => s.id !== seans.id && pid(s) === pid(seans) && zm(s) <= zm(seans)).sort((a, b) => zm(b) - zm(a));
  const bu = [seans]; let i = 0;
  for (; i < ayni.length && ayni[i].dayIndex !== n - 1; i++) bu.push(ayni[i]);
  const onc = [];
  if (i < ayni.length) { onc.push(ayni[i]); for (i++; i < ayni.length && ayni[i].dayIndex !== n - 1; i++) onc.push(ayni[i]); }
  if (bu.length < 2) return null;
  const kg = l => l.reduce((a, s) => a + store.sessionVolume(s, byId).kg, 0);
  const ilk = bu.at(-1), gun = Math.max(1, Math.ceil((zm(seans) - (ilk.startedAt ?? zm(ilk))) / 864e5));
  const ids = new Set(bu.map(s => s.id));
  const rekorSayisi = RK.rekorOlaylari([seans, ...onceki.filter(s => s.id !== seans.id)]).filter(o => ids.has(o.seansId)).length;
  const enIyiBir = (l, exId) => Math.max(0, ...l.flatMap(s => (s.entries ?? []).filter(e => e.exerciseId === exId)
    .flatMap(e => (e.sets ?? []).map(x => RK.setDegerleri(x).bir ?? 0))));
  const exler = new Set(bu.flatMap(s => (s.entries ?? []).map(e => e.exerciseId)));
  const hareketler = onc.length ? [...exler].map(id => ({ ex: byId[id], once: enIyiBir(onc, id), simdi: enIyiBir(bu, id) }))
    .filter(h => h.ex && h.once > 0 && h.simdi > 0).sort((a, b) => b.simdi - a.simdi).slice(0, 3) : [];
  return { program: p.ad, antrenman: bu.length, gun, hacim: kg(bu), oncekiHacim: onc.length ? kg(onc) : null,
    calismaSet: bu.reduce((a, s) => a + s.entries.reduce((x, e) => x + e.sets.filter(k => !k.warmup).length, 0), 0), rekorSayisi, hareketler };
}

/**
 * Bitmiş seansı YENİDEN AÇ — "Seansı bitir"in geri alması (özet ekranından).
 * Eskiden bitirmenin ne onayı ne geri alması vardı; uygulamanın geri kalanında her şey
 * geri alınabiliyordu. İşlemsel: önce kopya diske, başarılıysa bellek.
 */
export async function reopen(session) {
  const k = structuredClone(session);
  k.status = 'active';
  delete k.finishedAt;
  await store.saveSession(k);
  Object.assign(session, k);
  delete session.finishedAt;
  return session;
}

/* ── Geçmiş seansı düzenleme ───────────────────────────────────────────────
 * Yanlış girilen ağırlık kalıcıydı: yalnız CANLI seansta son set geri
 * alınabiliyordu. Geçmişteki bir sayı yanlışsa hacim, "geçen sefer" ve
 * ilerleme grafiği ömür boyu o yanlışı taşıyordu.
 *
 * SİLME YUMUŞAKTIR (`status:'deleted'`), sert değil. Sebebi: geri-al'ın
 * uygulamayı kapatınca da yaşaması gerekiyor. "Bugünü sıfırla"nın geri-al'ı
 * yalnız BELLEKTE ve bu yüzden kapanışta kayboluyor — aynı hatayı burada
 * tekrarlamamak için silinen seans diskte duruyor, yalnız görünmüyor.
 *
 * `doneSessions()` ve `activeSession()` duruma göre süzdüğü için silinen
 * seans geçmişten, sıradan, hacimden KENDİLİĞİNDEN düşer.
 */

/**
 * Bir setin değerlerini düzelt.
 *
 * Burada ÖLÜ bir `updateSet` zaten vardı (kimse çağırmıyordu) ve iki kusuru
 * taşıyordu: (1) doğrulama yok — "abc" yazılabilirdi; (2) `entryFor` kullanıyordu,
 * yani OLMAYAN bir egzersizi düzenlemeye çalışmak boş kayıt YARATIRDI.
 * Silinip yerine bu kondu. (Ölü API sayısı bu projede üçe çıktı: setNote,
 * updateSet, unit/theme ayarları.)
 */
export function updateSet(session, exerciseId, index, patch) {
  const e = session.entries.find(x => x.exerciseId === exerciseId);
  const set = e?.sets[index];
  if (!set) return { ok: false, neden: 'yok' };
  const izinli = set.type === 'time' ? ['seconds']
    : set.type === 'cardio' ? ['minutes'] : ['weight', 'reps'];
  for (const [k, v] of Object.entries(patch)) {
    if (!izinli.includes(k)) continue;
    if (v === null || v === '') { set[k] = k === 'weight' ? null : set[k]; continue; }
    const n = +v;
    if (!Number.isFinite(n) || n < 0) return { ok: false, neden: 'sayı' };
    set[k] = n;
  }
  return { ok: true, set };
}

/** Tek seti sil. Egzersizin son seti gidince o kayıt da temizlenir. */
export function deleteSet(session, exerciseId, index) {
  const e = session.entries.find(x => x.exerciseId === exerciseId);
  if (!e?.sets[index]) return { ok: false };
  const silinen = e.sets.splice(index, 1)[0];
  if (!e.sets.length) session.entries = session.entries.filter(x => x !== e);
  return { ok: true, silinen, bosaldi: !hasAnySet(session) };
}

/**
 * Silinen seti AYNI YERİNE geri koy — deleteSet'in geri-alı.
 *
 * Geçmişte tek set silmek tek dokunuşluktu ve geri alınamıyordu; oysa bu
 * uygulamanın kendi ilkesi "terli parmakla yanlış dokunuş KESİN, geri al
 * zorunluluk" (bkz. undoLastSet). Egzersiz kaydı son setle birlikte
 * temizlendiyse yeniden kurulur.
 */
export function restoreSet(session, exerciseId, index, set) {
  const e = entryFor(session, exerciseId);
  e.sets.splice(Math.min(Math.max(0, index), e.sets.length), 0, set);
  return e;
}

/**
 * Seansı sil — YUMUŞAK. Geri getirilebilir ve geri-al uygulamayı kapatsan da
 * yaşar. Sert silme (`abandon`) yalnız hiç seti olmayan seanslar için.
 */
export async function softDeleteSession(session) {
  session.status = 'deleted';
  session.deletedAt = Date.now();
  await store.saveSession(session);
  return session.id;
}

/** Silinen seansı geri getir */
export async function restoreSession(id) {
  const s = await store.getSession(id);
  if (!s || s.status !== 'deleted') return null;
  s.status = 'done';
  delete s.deletedAt;
  await store.saveSession(s);
  return s;
}

/** Düzenlenen seansı diske yaz — boşaldıysa SİLER (kullanıcı kararı, 6 Eyl) */
export async function saveEdited(session) {
  if (!hasAnySet(session)) { await softDeleteSession(session); return { silindi: true }; }
  await store.saveSession(session);
  return { silindi: false };
}

/* ── Geçmiş ────────────────────────────────────────────────────────────────
 * Bu veriler ZATEN kaydediliyordu; eksik olan onları GÖSTEREN ekrandı.
 * doneSessions() yeniden eskiye sıralı; grafikler soldan sağa okunduğu için
 * seriler burada ters çevrilir.
 */

/** Bir seansın özet satırı: kaç hareket yapıldı, hacim ne, yarım mı */
export function sessionSummaryRow(session) {
  const toplam = exercisesOfSession(session).length || 1;
  const yapilan = completedIds(session).size;
  return {
    id: session.id,
    at: session.finishedAt ?? session.startedAt,
    dayIndex: session.dayIndex,
    gun: gunEtiketiSeans(session).kisa,
    // Seans başka bir programda yapıldıysa adı satırda görünsün (yoksa "1. Gün" hangi programın?)
    programAdi: programOf(session) && programOf(session) !== aktif ? programOf(session).ad : null,
    yapilan, toplam,
    // Kayıtsız gün ne "yarım"dır ne de sayılabilir — kendi etiketini taşır
    kayitsiz: !!session.kayitsiz,
    yarim: !session.kayitsiz && yapilan / toplam < YARIM_ORAN,
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
  // PROGRAM SIRASINDA dön (aktif programın günleri sırayla, sonra başka programlarda yapılanlar).
  // Map'in ekleme sırası "en son hangi seansta görüldüğü"ne göreydi ve
  // listeyi her seansta yeniden diziyordu — okuyan için rastgele görünüyordu.
  const sira = [];
  const görüldü = new Set();
  for (let gün = 0; gün < aktif.gunler.length; gün++)
    for (const ex of exercisesFor(gün))
      if (!görüldü.has(ex.id)) { görüldü.add(ex.id); sira.push(ex); }
  for (const id of say.keys())
    if (!görüldü.has(id) && byId[id]) { görüldü.add(id); sira.push(byId[id]); }
  return sira.filter(ex => (say.get(ex.id) ?? 0) >= minPoints);
}

/** Kütüphanede olmayan kimlik (silinmiş özel hareket, bozuk yedek) için adlandırılmış yer tutucu */
export const bilinmeyenHareket = id => P.cozumle({ exId: id, sets: 1, reps: 10 }, byId);
