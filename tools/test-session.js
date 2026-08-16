/**
 * TAKVİM + SEANS MOTORU TESTLERİ —  node tools/test-session.js
 *
 * Bu iki modül de saf mantık (DOM yok), o yüzden tarayıcı açmadan sınanabilir.
 * Özellikle dikkat edilen: A/B sırasının takvimden BAĞIMSIZ olduğu iddiası.
 */
import * as C from '../js/schedule.js';
import * as N from '../js/session.js';
import * as S from '../js/store.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const D = (y, m, d) => new Date(y, m - 1, d);
const SALPERCMT = [2, 4, 6];

console.log('\n1) TAKVİM TEMELLERİ');
{
  ok(D(2026, 7, 14).getDay() === 2, '14 Temmuz 2026 gerçekten Salı');
  ok(C.isTrainingDay(D(2026, 7, 14), SALPERCMT), 'Salı antrenman günü');
  ok(!C.isTrainingDay(D(2026, 7, 15), SALPERCMT), 'Çarşamba değil');
  ok(C.fmtDate(D(2026, 7, 14)) === '14 Temmuz Salı', `fmtDate: "${C.fmtDate(D(2026, 7, 14))}"`);
  ok(+C.nextTrainingDay(D(2026, 7, 14), SALPERCMT) === +D(2026, 7, 16), 'Salı → sıradaki Perşembe');
  ok(+C.nextTrainingDay(D(2026, 7, 18), SALPERCMT) === +D(2026, 7, 21), 'Cumartesi → sıradaki Salı (hafta atlar)');
  ok(+C.nextTrainingDay(D(2026, 12, 31), SALPERCMT) === +D(2027, 1, 2), 'yıl sınırını doğru geçiyor');
  ok(+C.addDays(D(2026, 2, 28), 1) === +D(2026, 3, 1), 'ay sınırı (2026 artık yıl değil)');
}

console.log('\n2) GÜN ARİTMETİĞİ SAAT DİLİMİNDEN BAĞIMSIZ');
{
  // Klasik hata: (t2-t1)/86400000. Yaz saati geçişinde 23 veya 25 saatlik gün
  // olur ve fark bir gün kayar. dayNumber yerel bileşenleri kullandığı için etkilenmez.
  const a = new Date(2026, 2, 28, 23, 59), b = new Date(2026, 2, 29, 0, 1);   // AB'de YS geçişi
  ok(C.daysBetween(a, b) === 1, 'gece yarısını 2 dakikayla geçmek = 1 gün');
  const naif = Math.floor((b - a) / 86_400_000);
  ok(naif === 0, `naif epoch aritmetiği aynı durumda ${naif} diyor — bu yüzden kullanılmıyor`);
  ok(C.daysBetween(new Date(2026, 6, 14, 23, 0), new Date(2026, 6, 15, 1, 0)) === 1, 'saat farkı gün sayısını bozmuyor');
  ok(C.sameDay(new Date(2026, 6, 14, 0, 1), new Date(2026, 6, 14, 23, 59)), 'aynı gün, 24 saat arayla');
  ok(!C.sameDay(new Date(2026, 6, 14, 23, 59), new Date(2026, 6, 15, 0, 1)), 'gece yarısı sonrası farklı gün (bayatlama tespiti)');
}

console.log('\n3) GÖRECELİ ETİKETLER');
{
  const t = D(2026, 7, 28);
  ok(C.relativeLabel(D(2026, 7, 28), t) === 'bugün', 'bugün');
  ok(C.relativeLabel(D(2026, 7, 27), t) === 'dün', 'dün');
  ok(C.relativeLabel(D(2026, 7, 25), t) === '3 gün önce', '3 gün önce');
  ok(C.relativeLabel(D(2026, 7, 29), t) === 'yarın', 'yarın');
  ok(C.relativeLabel(D(2026, 6, 14), t) === '14 Haziran', 'bir haftadan eski → tarihe döner');
}

console.log('\n4) ⭐ A/B SIRASI TAKVİMDEN BAĞIMSIZ');
{
  await S.driver.clear('sessions');
  ok(await N.nextDayIndex() === 0, 'hiç seans yokken 1. Gün');

  const bitir = async (dayIndex, t) => {
    const s = S.newSession(dayIndex); s.startedAt = t; s.finishedAt = t + 3.6e6; s.status = 'done';
    s.entries = [{ exerciseId: 'plank', sets: [{ type: 'time', seconds: 15, warmup: false, ts: t }] }];
    await S.saveSession(s); return s;
  };
  const T = 1_770_000_000_000, GUN = 86_400_000;

  await bitir(0, T);
  ok(await N.nextDayIndex() === 1, '1. Gün yapıldı → sıradaki 2. Gün');
  await bitir(1, T + 2 * GUN);
  ok(await N.nextDayIndex() === 0, '2. Gün yapıldı → sıradaki 1. Gün');

  // ⭐ Prototipin "sırayı kaydır" düğmesine ihtiyaç duyduğu senaryo
  await bitir(0, T + 4 * GUN);
  ok(await N.nextDayIndex() === 1, 'ÜÇ HAFTA seans kaçırılsa da sıra bozulmuyor (takvim sorulmuyor)');
  await bitir(1, T + 90 * GUN);
  ok(await N.nextDayIndex() === 0, '3 ay ara verilip dönülse bile kaldığı yerden devam');
}

console.log('\n5) SEANS YAŞAM DÖNGÜSÜ');
{
  await S.driver.clear('sessions');
  let { session, resumed } = await N.startOrResume();
  ok(!resumed && session.dayIndex === 0, 'temiz başlangıçta yeni 1. Gün seansı');

  ok((await N.finish(session)) === null, 'HİÇ SET GİRİLMEMİŞ seans kaydedilmiyor (boş seans geçmişi kirletmez)');
  ok((await S.allSessions()).length === 0, 'gerçekten kaydedilmedi');

  ({ session } = await N.startOrResume());
  const bench = N.byId['bb_bench_press'];
  N.recordSet(session, bench.id, { type: 'weight_reps', weight: 40, reps: 12, warmup: false });
  await N.persist(session);
  ok((await N.startOrResume()).resumed === true, 'set girildikten sonra seans YARIDA KALDI olarak bulunuyor');

  const geri = N.undoLastSet(session, bench.id);
  ok(geri?.weight === 40, 'geri alma son seti döndürüyor (arayüz "geri getir" gösterebilsin)');
  ok(N.exerciseProgress(session, bench).calisma === 0, 'geri alınan set ilerlemeden düştü');
}

console.log('\n6) İLERLEME VE HACİM');
{
  await S.driver.clear('sessions');
  const { session } = await N.startOrResume();
  const gun = N.exercisesFor(0);
  ok(N.progress(session, 0).total === 27, `1. Gün hedefi 27 set (9 egzersiz × 3)`);

  const bench = gun[0];
  N.recordSet(session, bench.id, { type: 'weight_reps', weight: 20, reps: 15, warmup: true });
  ok(N.exerciseProgress(session, bench).calisma === 0, 'ısınma seti ÇALIŞMA seti sayılmıyor');
  for (let i = 0; i < 3; i++) N.recordSet(session, bench.id, { type: 'weight_reps', weight: 40, reps: 12, warmup: false });
  ok(N.exerciseProgress(session, bench).tamam, '3 çalışma seti → egzersiz tamam');

  for (let i = 0; i < 5; i++) N.recordSet(session, gun[1].id, { type: 'weight_reps', weight: 10, reps: 12, warmup: false });
  ok(N.progress(session, 0).pct <= 100, 'hedeften fazla set girilse bile ilerleme %100\'ü aşmıyor');

  const plank = N.byId['plank'];
  ok(N.blankSet(plank).type === 'time' && N.blankSet(plank).seconds === 15, 'Plank SÜRE bazlı boş set üretiyor');
  ok(N.blankSet(bench).type === 'weight_reps', 'bench ağırlık×tekrar üretiyor');
}

console.log('\n7) ÖN-DOLDURMA ("geçen sefer" tuş sayısını azaltır)');
{
  await S.driver.clear('sessions');
  const bench = N.byId['bb_bench_press'];
  const eski = S.newSession(0);
  eski.status = 'done'; eski.startedAt = 1e12; eski.finishedAt = 1e12 + 1;
  eski.entries = [{ exerciseId: bench.id, sets: [{ type: 'weight_reps', weight: 42.5, reps: 10, warmup: false, ts: 1e12 }] }];
  await S.saveSession(eski);

  const { session } = await N.startOrResume();
  const lp = await S.lastPerformance(bench.id);
  const s1 = N.suggestSet(bench, session, lp);
  ok(s1.weight === 42.5 && s1.reps === 10, 'ilk set geçen seferkiyle doluyor (42.5 × 10)');

  N.recordSet(session, bench.id, { ...s1, weight: 45, reps: 8 });
  const s2 = N.suggestSet(bench, session, lp);
  ok(s2.weight === 45 && s2.reps === 8, 'sonraki set BU SEANSTA girilenle doluyor, geçen seferkiyle değil');

  const plank = N.byId['plank'];
  ok(N.suggestSet(plank, session, lp).type === 'time', 'tip uyuşmazlığında geçen sefer taşınmıyor (Plank\'a kg gelmez)');
}

console.log('\n8) BİTİŞ ÖZETİ');
{
  await S.driver.clear('sessions');
  const { session } = await N.startOrResume();
  session.startedAt = Date.now() - 63 * 60_000;
  N.recordSet(session, 'bb_bench_press', { type: 'weight_reps', weight: 40, reps: 10, warmup: false });
  N.recordSet(session, 'db_bench_fly', { type: 'weight_reps', weight: 10, reps: 12, warmup: false });
  N.recordSet(session, 'plank', { type: 'time', seconds: 15, warmup: false });

  const bitti = await N.finish(session);
  ok(bitti?.status === 'done' && bitti.finishedAt, 'seans "done" olarak kapandı');
  const o = await N.summary(bitti);
  ok(o.kg === 400 + 240, `hacim doğru: bench 40×10 + fly 10×12×2 (dambıl) = ${o.kg}`);
  ok(o.seconds === 15, 'Plank süresi ayrı raporlanıyor');
  ok(o.minutesElapsed >= 62 && o.minutesElapsed <= 64, `süre duvar saatinden: ${o.minutesElapsed} dk`);
  ok(o.dayName.startsWith('1. Gün'), 'gün adı özet başlığında');
  ok((await N.nextDayIndex()) === 1, 'bitince sıradaki gün döndü');
}

console.log('\n9) ⭐ BAYAT SEANS KENDİLİĞİNDEN KAPANIR');
{
  // Gerçek kullanımdan çıkan hata: salondan "Seansı bitir"e basmadan çıkınca
  // seans sonsuza kadar açık kalıyor, ertesi gün "geçen sefer" boş geliyordu.
  await S.driver.clear('sessions');
  const SAAT = 3_600_000;
  const s = S.newSession(0);
  s.startedAt = Date.now() - 9 * SAAT;
  N.recordSet(s, 'bb_bench_press', { type: 'weight_reps', weight: 40, reps: 12, warmup: false });
  s.entries[0].sets[0].ts = Date.now() - 8 * SAAT;      // son hareket 8 saat önce
  await S.saveSession(s);

  const r = await N.closeStaleSession();
  ok(r?.action === 'closed', '8 saat dokunulmamış seans kapatıldı');
  const kapali = await S.getSession(s.id);
  ok(kapali.status === 'done', 'durumu "done" oldu');
  ok(Math.abs(kapali.finishedAt - s.entries[0].sets[0].ts) < 1000,
     'bitiş damgası SON HAREKET anı — "şimdi" olsaydı süre 8 saat görünürdü');
  ok((await N.nextDayIndex()) === 1, 'kapandığı için A/B sırası ilerledi');
  ok((await S.lastPerformance('bb_bench_press'))?.sets[0].weight === 40,
     '"geçen sefer" artık dolu — asıl şikâyetin kökü buydu');

  // Taze seans kapatılmamalı
  await S.driver.clear('sessions');
  const t = S.newSession(0);
  N.recordSet(t, 'plank', { type: 'time', seconds: 15, warmup: false });
  await S.saveSession(t);
  ok((await N.closeStaleSession()) === null, 'devam eden taze seansa DOKUNULMAZ');

  // Hiç set girilmemiş bayat seans kaydedilmez, atılır
  await S.driver.clear('sessions');
  const b = S.newSession(0); b.startedAt = Date.now() - 9 * SAAT;
  await S.saveSession(b);
  ok((await N.closeStaleSession())?.action === 'discarded', 'boş bayat seans geçmişe eklenmez, atılır');
  ok((await S.allSessions()).length === 0, 'gerçekten silindi');
}

console.log('\n10) HEDEF ÜZERİNE YAZMA (kullanıcı/hoca değişikliği)');
{
  const bench = N.byId['bb_bench_press'], plank = N.byId['plank'];
  const boş = { ...S.DEFAULT_SETTINGS, overrides: {} };
  ok(N.effective(bench, boş).sets === 3, 'override yoksa programın hedefi geçerli');
  ok(N.repsLabel(bench, boş) === '3 × 12', `etiket veriden türüyor: "${N.repsLabel(bench, boş)}"`);

  const st = { ...S.DEFAULT_SETTINGS, overrides: { bb_bench_press: { sets: 4, reps: 10, weight: 45 } } };
  const e = N.effective(bench, st);
  ok(e.sets === 4 && e.reps === 10 && e.weight === 45, 'override uygulanıyor');
  ok(e.edited === true, 'değiştirilmiş olarak işaretleniyor');
  ok(N.repsLabel(bench, st) === '4 × 10', 'etiket de güncelleniyor');
  ok(N.effective(plank, st).sets === 3, 'başka egzersiz etkilenmiyor');

  await S.driver.clear('sessions');
  const { session } = await N.startOrResume();
  ok(N.progress(session, 0, st).total === 28, 'gün toplamı 27 → 28 (bench 3→4 set)');
  ok(N.exerciseProgress(session, bench, st).hedef === 4, 'egzersiz hedefi 4');
  ok(N.blankSet(bench, st).weight === 45, 'planlanan ağırlık kutuya ön-doldurulur');

  const kısmi = { ...S.DEFAULT_SETTINGS, overrides: { bb_bench_press: { sets: 5 } } };
  const k = N.effective(bench, kısmi);
  ok(k.sets === 5 && k.reps === 12, 'kısmi override: yalnız verilen alan değişir, gerisi programdan');
  ok(k.weight === null, 'ağırlık verilmediyse boş kalır (geçen sefer devreye girer)');
}

console.log('\n11) ISINMA — tek bayrak, sete ve hacme karışmaz');
{
  await S.driver.clear('sessions');
  const { session } = await N.startOrResume();
  ok(session.warmupDone === false, 'yeni seansta ısınma işareti kapalı');
  ok(N.warmupFor(0).length > 0 && N.warmupFor(1).length > 0, 'iki gün için de ısınma tanımlı');

  N.setWarmupDone(session);
  ok(session.warmupDone === true, 'işaret konuluyor');

  // ⭐ REGRESYON: persist yalnız hasAnySet'e baksaydı bu kayıt DİSKE YAZILMAZDI
  // ve kullanıcı uygulamayı kapatıp açınca ısınma işareti kaybolurdu.
  await N.persist(session);
  const geri = await S.getSession(session.id);
  ok(geri?.warmupDone === true, 'set girilmeden de diske YAZILIYOR (işaret kaybolmuyor)');

  ok(N.progress(session, 0).done === 0, 'ısınma set sayımına girmiyor');
  ok(S.sessionVolume(session, N.byId).kg === 0, 'ısınma hacme girmiyor');

  // Yalnız ısınma yapılmış gün "bitmiş antrenman" sayılmamalı — yoksa A/B kayar
  ok(await N.finish(session) === null, 'yalnız ısınma yapılan seans TAMAMLANMIŞ sayılmıyor');
  ok(await N.nextDayIndex() === 0, 'A/B sırası ilerlemiyor');
}

console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
