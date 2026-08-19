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

console.log('');
console.log('12) ANTRENMAN GÜNÜ AYARI — son gün kapatılamaz');
{
  ok(JSON.stringify(C.toggleTrainingDay([2, 4, 6], 4)) === '[2,6]', 'seçili gün kapatılıyor');
  ok(JSON.stringify(C.toggleTrainingDay([2, 4, 6], 1)) === '[1,2,4,6]', 'yeni gün açılıyor ve SIRALI kalıyor');
  ok(JSON.stringify(C.toggleTrainingDay([6, 2], 4)) === '[2,4,6]', 'karışık sıralı girdi de sıralanıyor');
  ok(C.toggleTrainingDay([3], 3) === null, 'SON gün kapatılamıyor (null = reddedildi)');
  ok(JSON.stringify(C.toggleTrainingDay([3], 5)) === '[3,5]', 'tek gün varken BAŞKA gün eklenebiliyor');

  // Reddin sebebi ölçüldü: boş liste takvimi sessizce anlamsızlaştırıyor
  ok(C.nextTrainingDay(D(2026, 7, 14), []) === null, 'boş listede sıradaki gün YOK — red bu yüzden');
  ok(C.upcoming(D(2026, 7, 14), []).length === 0, 'boş listede yaklaşan gün de yok');

  // Ayar değişince takvim GERÇEKTEN yeni günlere göre çalışmalı
  const kalan = C.toggleTrainingDay(C.toggleTrainingDay([2, 4, 6], 2), 4);
  ok(JSON.stringify(kalan) === '[6]', 'iki gün kapatılınca yalnız Cumartesi kalıyor');
  ok(+C.nextTrainingDay(D(2026, 7, 14), [6]) === +D(2026, 7, 18), 'yeni ayara göre sıradaki gün Cumartesi');
  ok(C.upcoming(D(2026, 7, 14), [1, 3, 5], 3).map(d => d.getDate()).join(',') === '15,17,20',
     'Pzt/Çar/Cum seçilince yaklaşanlar 15, 17, 20 Temmuz');
}

console.log('');
console.log('13) BOY AYARI — varsayılan ve kalıcılık');
{
  ok(S.DEFAULT_SETTINGS.heightCm === null, 'boy varsayılanı null (uydurma değer yok)');
  const a = await S.saveSettings({ heightCm: 178 });
  ok(a.heightCm === 178, 'boy yazılıyor');
  ok((await S.getSettings()).heightCm === 178, 'boy diskten geri okunuyor');
  const b = await S.saveSettings({ restSeconds: 45 });
  ok(b.heightCm === 178, 'başka ayar yazılınca boy KORUNUYOR');
  ok((await S.getSettings()).trainingDays.join(',') === '2,4,6', 'dokunulmayan ayar varsayılanda kalıyor');
  await S.saveSettings({ heightCm: null, restSeconds: 60 });
}


console.log('');
console.log('14) YARIM KALAN GÜN — tespit');
{
  await S.driver.clear('sessions');
  const kur = async (dayIndex, kacHareket) => {
    const s = S.newSession(dayIndex);
    for (const ex of N.exercisesFor(dayIndex).slice(0, kacHareket))
      N.recordSet(s, ex.id, { type: 'weight_reps', weight: 20, reps: 12 });
    s.status = 'done'; s.finishedAt = Date.now();
    await S.saveSession(s);
    return s;
  };

  const tam = await kur(0, 9);
  ok(N.incompleteOf(tam).length === 0, 'tam yapılan günde eksik hareket yok');
  ok(await N.carryOffer() === null, 'tam gün için öneri ÇIKMIYOR');

  await S.driver.clear('sessions');
  const yarim = await kur(0, 4);
  const o = await N.carryOffer();
  ok(o !== null, '4/9 yapılan gün YARIM sayılıyor');
  ok(o.yapilan === 4 && o.toplam === 9, `sayım doğru: ${o?.yapilan}/${o?.toplam}`);
  ok(o.kalan.length === 5, '5 hareket kaldı');
  ok(o.kalan[0].id === 'cable_front_raise', 'kalanlar SIRAYLA geliyor (ilki 05. hareket)');
  ok(N.completedIds(yarim).size === 4, 'yapılanların kimlikleri çıkarılıyor');

  // Eşik: yarıdan azı → yarım. 5/9 yarıdan çok → gün BİTMİŞ sayılır.
  await S.driver.clear('sessions');
  await kur(0, 5);
  ok(await N.carryOffer() === null, '5/9 yapılan gün yarım SAYILMIYOR (eşik)');

  // Isınma seti hareketi "yapıldı" yapmaz
  await S.driver.clear('sessions');
  const w = S.newSession(0);
  for (const ex of N.exercisesFor(0).slice(0, 6))
    N.recordSet(w, ex.id, { type: 'weight_reps', weight: 5, reps: 15, warmup: true });
  w.status = 'done'; w.finishedAt = Date.now();
  await S.saveSession(w);
  ok(N.incompleteOf(w).length === 9, 'yalnız ısınma seti girilen hareket YAPILMIŞ sayılmıyor');
}

console.log('');
console.log('15) YARIM KALAN GÜN — cevap ve sıraya etkisi');
{
  await S.driver.clear('sessions');
  const y = S.newSession(0);
  for (const ex of N.exercisesFor(0).slice(0, 3))
    N.recordSet(y, ex.id, { type: 'weight_reps', weight: 20, reps: 12 });
  y.status = 'done'; y.finishedAt = Date.now();
  await S.saveSession(y);

  ok(await N.nextDayIndex() === 1, 'yarım da olsa sıra normalde 2. Güne geçiyor');
  const o = await N.carryOffer();
  ok(o !== null, 'öneri var');

  // "Devam et" → aynı gün, ama sıranın kendisi değişmiyor: yeni seans o güne açılır
  await N.resolveCarry(o.session);
  ok(await N.carryOffer() === null, 'cevap verilince bir daha SORULMUYOR');
  const tekrar = await S.getSession(y.id);
  ok(tekrar.carryResolved === true, 'cevap ESKİ seansa yazıldı (yeniden açılışta da sürer)');

  // Devredilen seans tamamlanınca sıra normal işler
  const d = S.newSession(0);
  d.carriedFrom = y.id;
  for (const ex of N.exercisesFor(0)) N.recordSet(d, ex.id, { type: 'weight_reps', weight: 20, reps: 12 });
  ok(await N.finish(d) !== null, 'devredilen seans tamamlanabiliyor');
  ok(await N.nextDayIndex() === 1, 'ondan sonra sıra 2. Güne geçiyor');
  ok(await N.carryOffer() === null, 'tam yapılan devir seansı yeni öneri doğurmuyor');
}


console.log('');
console.log('16) DEVİR SEÇİMİ DİSKE YAZILIYOR — canlıda yakalanan hata');
{
  await S.driver.clear('sessions');
  const y = S.newSession(0); y.id = 'y16';
  for (const ex of N.exercisesFor(0).slice(0, 3))
    N.recordSet(y, ex.id, { type: 'weight_reps', weight: 20, reps: 12 });
  y.status = 'done'; y.finishedAt = Date.now();
  await S.saveSession(y);

  // "Bu güne devam et": yeni seans açılır, HİÇ SET GİRİLMEZ, uygulama kapanır
  await N.resolveCarry(y);
  const d = S.newSession(0);
  d.carriedFrom = y.id;
  ok(N.hasAnySet(d) === false, 'devir seansında henüz set yok');
  ok(N.hasAnyRecord(d) === true, 'ama KAYDA DEĞER: devir kararı da bir kayıt');
  await N.persist(d);

  const geri = await S.getSession(d.id);
  ok(!!geri, 'set girilmeden de diske YAZILIYOR (seçim kaybolmuyor)');
  ok(geri?.carriedFrom === 'y16', 'hangi seanstan devredildiği korunuyor');
  ok(geri?.dayIndex === 0, 'devredilen GÜN korunuyor — yenilemede 2. Güne düşmüyor');

  // Açılışta o seans yeniden bulunmalı ve "geçen sefer yapıldı" kurulabilmeli
  const aktif = await S.activeSession();
  ok(aktif?.id === d.id, 'açılışta devir seansına DEVAM ediliyor');
  ok(N.completedIds(await S.getSession(aktif.carriedFrom)).size === 3,
     'işaretlenecek hareketler eski seanstan yeniden çıkarılabiliyor');

  // Ama yalnız "devam et"e basmak antrenman yapmak değildir
  ok(await N.finish(d) === null, 'yalnız devir kararı olan seans TAMAMLANMIŞ sayılmıyor');
  ok(await N.nextDayIndex() === 1, 'A/B sırası bu yüzden ilerlemiyor');
}


console.log('');
console.log('17) GEÇMİŞ VERİSİ — özet satırı ve ilerleme serisi');
{
  await S.driver.clear('sessions');
  const kur = async (dayIndex, kacHareket, gunOnce, agirlik) => {
    const s = S.newSession(dayIndex);
    s.id = `h${gunOnce}`;
    for (const ex of N.exercisesFor(dayIndex).slice(0, kacHareket))
      N.recordSet(s, ex.id, { type: 'weight_reps', weight: agirlik, reps: 12 });
    s.status = 'done';
    s.startedAt = s.finishedAt = Date.now() - gunOnce * 86400000;
    await S.saveSession(s);
    return s;
  };

  await kur(0, 9, 20, 30);
  await kur(0, 9, 10, 35);
  await kur(0, 4, 3, 40);          // yarım

  const satir = await N.historyRows();
  ok(satir.length === 3, '3 seans listeleniyor');
  ok(satir[0].at > satir[1].at, 'YENİDEN ESKİYE sıralı');
  ok(satir[0].yapilan === 4 && satir[0].toplam === 9, 'en son seans 4/9');
  ok(satir[0].yarim === true, 'yarım seans işaretleniyor');
  ok(satir[1].yarim === false, 'tam seans yarım DEĞİL');
  ok(satir[0].hacim.kg > 0, 'hacim hesaplanıyor');

  const seri = await N.exerciseSeries('bb_bench_press');
  ok(seri.length === 3, 'bench için 3 nokta');
  ok(seri[0].v === 30 && seri.at(-1).v === 40, 'seri ESKİDEN YENİYE: 30 → 40');

  // Bench 3 seansta da var; 9. hareket yalnız 2 seansta (son seans 4 harekette kesildi)
  const ilerleyen = await N.progressables();
  ok(ilerleyen.some(e => e.id === 'bb_bench_press'), 'bench ilerleme listesinde');
  ok(ilerleyen.every(e => e.id !== 'cardio'), 'hiç kaydı olmayan hareket listede yok');

  // Tek kayıtlı hareket grafiğe girmemeli — "tek nokta trend" yalan olurdu
  await S.driver.clear('sessions');
  await kur(0, 9, 5, 25);
  ok((await N.progressables()).length === 0, 'tek seans varsa ilerleme grafiği ÇİZİLMİYOR');
  ok((await N.exerciseSeries('bb_bench_press')).length === 1, 'ama seri yine de okunabiliyor');

  // Isınma seti ilerlemeyi kirletmemeli
  await S.driver.clear('sessions');
  const a = S.newSession(0); a.id = 'w1';
  N.recordSet(a, 'bb_bench_press', { type: 'weight_reps', weight: 99, reps: 15, warmup: true });
  N.recordSet(a, 'bb_bench_press', { type: 'weight_reps', weight: 40, reps: 12 });
  a.status = 'done'; a.startedAt = a.finishedAt = Date.now();
  await S.saveSession(a);
  ok((await N.exerciseSeries('bb_bench_press'))[0].v === 40, 'seri ısınma setini SAYMIYOR (99 değil 40)');
}


console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
