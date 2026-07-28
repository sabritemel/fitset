/**
 * DEPOLAMA MANTIĞI TESTLERİ —  node tools/test-store.js
 *
 * store.js'te sorgu mantığı sürücüden ayrıldığı için IndexedDB olmayan Node'da
 * aynı kod bellek sürücüsüyle koşar. Tarayıcı açmadan sınanabilen kısım bu.
 * (IndexedDB adaptörünün kendisi ayrıca gerçek cihazda doğrulanmalı.)
 */
import * as S from '../js/store.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ✓ ${msg}`); } else { fail++; console.log(`  ✗ ${msg}`); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}  (${JSON.stringify(a)})`);

const EXBYID = { bb_bench_press: { equipment: 'barbell' }, db_hammer_curl: { equipment: 'dumbbell' }, plank: { equipment: 'bodyweight' } };
const set = (o) => ({ ts: Date.now(), warmup: false, ...o });

console.log('\n1) SEANS YAŞAM DÖNGÜSÜ');
{
  const s = S.newSession(0);
  ok(s.schemaVersion === S.SCHEMA_VERSION, 'yeni seans schemaVersion taşıyor');
  ok(s.status === 'active' && s.finishedAt === null, 'yeni seans "active" başlıyor');
  await S.saveSession(s);
  ok((await S.activeSession())?.id === s.id, 'yarıda kalan seans bulunuyor (kısmi seans → devam et)');
  ok((await S.lastDoneSession()) === null, 'tamamlanmamış seans "son biten" sayılmıyor');

  s.status = 'done'; s.finishedAt = Date.now();
  await S.saveSession(s);
  ok((await S.activeSession()) === null, 'bitince aktif seans kalmıyor');
  ok((await S.lastDoneSession())?.id === s.id, 'son biten seans bulunuyor');
}

console.log('\n2) A/B SIRASI GEÇMİŞTEN TÜRETİLİYOR (takvimden değil)');
{
  const last = await S.lastDoneSession();
  const next = last.dayIndex === 0 ? 1 : 0;
  ok(next === 1, 'son seans 1. Gün ise sıradaki 2. Gün');
  const s2 = S.newSession(next); s2.status = 'done'; s2.finishedAt = Date.now() + 1000;
  await S.saveSession(s2);
  ok((await S.lastDoneSession()).dayIndex === 1, 'en son biten seans doğru seçiliyor');
  ok(((await S.lastDoneSession()).dayIndex === 0 ? 1 : 0) === 0, 'sıra geri dönüyor — kaçırılan seans sırayı bozamaz');
}

console.log('\n3) "GEÇEN SEFER" SORGUSU');
{
  const s = S.newSession(0);
  s.status = 'done'; s.finishedAt = Date.now() + 2000;
  s.entries = [{
    exerciseId: 'bb_bench_press', note: '', sets: [
      set({ type: 'weight_reps', weight: 20, reps: 15, warmup: true }),   // ısınma
      set({ type: 'weight_reps', weight: 40, reps: 12 }),
      set({ type: 'weight_reps', weight: 40, reps: 10 }),
    ]
  }];
  await S.saveSession(s);

  const lp = await S.lastPerformance('bb_bench_press');
  ok(lp !== null, 'kayıt bulundu');
  ok(lp.sets.length === 2, 'ısınma seti "geçen sefer"e KARIŞMIYOR');
  eq([lp.sets[0].weight, lp.sets[0].reps], [40, 12], 'ilk çalışma seti doğru');
  ok(await S.lastPerformance('lunge') === null, 'hiç yapılmamış egzersizde null döner');

  const aktif = S.newSession(0); aktif.status = 'active';
  aktif.entries = [{ exerciseId: 'bb_bench_press', sets: [set({ type: 'weight_reps', weight: 99, reps: 1 })] }];
  await S.saveSession(aktif);
  ok((await S.lastPerformance('bb_bench_press')).sets[0].weight === 40,
     'DEVAM EDEN seans "geçen sefer" olarak gösterilmiyor');
  await S.driver.del('sessions', aktif.id);
}

console.log('\n4) HACİM HESABI');
{
  const s = S.newSession(1);
  s.entries = [
    { exerciseId: 'bb_bench_press', sets: [set({ type: 'weight_reps', weight: 40, reps: 10 })] },
    { exerciseId: 'db_hammer_curl', sets: [set({ type: 'weight_reps', weight: 10, reps: 10 })] },
    { exerciseId: 'plank', sets: [set({ type: 'time', seconds: 15 }), set({ type: 'time', seconds: 15 })] },
    { exerciseId: 'cardio', sets: [set({ type: 'cardio', minutes: 20 })] },
  ];
  const v = S.sessionVolume(s, EXBYID);
  ok(v.kg === 400 + 200, 'dambıl TEK ağırlık girilir, hacimde ×2 sayılır (40×10 + 10×10×2 = 600)');
  ok(v.seconds === 30, 'süre bazlı setler ayrı toplanıyor (Plank kg hacmine karışmıyor)');
  ok(v.minutes === 20, 'kardiyo ayrı toplanıyor');
  ok(v.sets === 5, 'set sayısı tüm tipleri kapsıyor');

  const w = S.sessionVolume({ entries: [{ exerciseId: 'bb_bench_press', sets: [set({ type: 'weight_reps', weight: 99, reps: 9, warmup: true })] }] }, EXBYID);
  ok(w.kg === 0 && w.sets === 1, 'ısınma seti hacme girmiyor ama set sayısında görünüyor');
}

console.log('\n5) DIŞA / İÇE AKTARIM');
{
  const dump = await S.exportData();
  ok(dump.app === 'fitset' && dump.schemaVersion === S.SCHEMA_VERSION, 'yedek zarfı uygulama adı + sürüm taşıyor');
  const n = dump.sessions.length;

  const stat = await S.importData(JSON.parse(JSON.stringify(dump)));
  eq([stat.eklendi, stat.güncellendi, stat.atlandı], [0, 0, n], 'aynı yedeği tekrar almak hiçbir şeyi bozmuyor (idempotent)');

  const yeni = JSON.parse(JSON.stringify(dump));
  yeni.sessions[0].finishedAt += 5000;
  yeni.sessions[0].entries = [{ exerciseId: 'lunge', sets: [set({ type: 'weight_reps', weight: 1, reps: 1 })] }];
  ok((await S.importData(yeni)).güncellendi === 1, 'daha YENİ kayıt mevcut kaydın üstüne yazıyor');

  const eski = JSON.parse(JSON.stringify(dump));
  eski.sessions[0].finishedAt -= 99999;
  ok((await S.importData(eski)).atlandı === n, 'daha ESKİ kayıt yenisini EZMİYOR');

  const baska = S.newSession(0); baska.status = 'done'; baska.finishedAt = 1;
  ok((await S.importData({ app: 'fitset', schemaVersion: 1, sessions: [baska] })).eklendi === 1, 'bilinmeyen seans ekleniyor');

  await S.importData({ app: 'fitset', schemaVersion: 1, sessions: [] }, 'replace');
  ok((await S.allSessions()).length === 0, '"replace" gerçekten temizliyor');
}

console.log('\n6) BOZUK / UYUMSUZ YEDEK REDDEDİLİYOR');
{
  const red = async (payload, ne) => {
    try { await S.importData(payload); fail++; console.log(`  ✗ ${ne} — kabul edildi (reddetmeliydi)`); }
    catch (e) { pass++; console.log(`  ✓ ${ne} — reddedildi: "${e.message}"`); }
  };
  await red({ app: 'baska-uygulama', schemaVersion: 1, sessions: [] }, 'yabancı dosya');
  await red({ app: 'fitset', sessions: [] }, 'sürümsüz yedek');
  await red({ app: 'fitset', schemaVersion: 99, sessions: [] }, 'gelecekten gelen yedek');
}

console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
