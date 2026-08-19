/**
 * POZ DOĞRULAYICI — her poz değişikliğinden sonra ÇALIŞTIR.
 *
 *   node tools/verify-poses.js        (veya: npm run verify)
 *
 * Neden var: çubuk-adam motoru forward kinematics kullandığı için uzuv UZUNLUKLARI
 * yapı gereği sabittir — ama EKLEM AÇILARI değildir. İki eklem bağımsız interpole
 * edilirse, her iki UÇ POZ doğru olsa bile ARA POZDA dirsek/diz insan sınırını
 * aşabilir. Gözle bakınca fark edilmez; sayıyla bakınca hemen görünür.
 *
 * Çıkış kodu 0 = temiz, 1 = en az bir ihlal (ileride CI kapısı olarak kullanılabilir).
 */
import { EX } from '../js/data/exercises.js';
import { L, skeleton, poseAt } from '../js/anim/engine.js';

const STEPS = 40;                 // her egzersiz için denetlenecek ara kare sayısı
const LEN_TOL = 0.01;             // segment uzunluğunda kabul edilen sapma (%1)
const JOINT_MAX = 150;            // dirsek/diz azami fleksiyon (insan sınırı ~145-150°)
const GROUND_Y = 186;             // zemin çizgisi (engine ile aynı viewBox)

/**
 * Bilinçli istisna: yukarıdan görünümde kolların kameraya doğru gelmesi 2B'de
 * ancak kısaltarak (foreshortening) temsil edilebilir. Bu egzersizlerde `al`
 * çarpanı uzuv uzunluğunu KASTEN değiştirir — bug değildir.
 */
const FORESHORTEN_OK = new Set(['Dumbbell Bench Fly', 'Reverse Pec Fly']);

const norm = a => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const all = EX.flat();
let fails = 0, warns = 0;
const problem = [];

const say = (icon, ex, msg) => console.log(`  ${icon} ${ex.en.padEnd(34)} ${msg}`);

// ── 1. Segment uzunluğu hareket boyunca sabit mi? ────────────────────────────
console.log('\n1) SEGMENT UZUNLUK SABİTLİĞİ');
for (const ex of all) {
  let worst = 0;
  for (let i = 0; i <= STEPS; i++) {
    const s = skeleton(poseAt(ex.a, ex.b, i / STEPS), ex.view);
    for (const [got, want] of [[dist(s.shA, s.elA), L.ua], [dist(s.elA, s.haA), L.fa],
                               [dist(s.hipA, s.knA), L.th], [dist(s.knA, s.ftA), L.sh]])
      worst = Math.max(worst, Math.abs(got - want) / want);
  }
  if (worst > LEN_TOL) {
    if (FORESHORTEN_OK.has(ex.en)) { say('ⓘ', ex, `%${(worst * 100).toFixed(0)} kısalma — bilinçli foreshortening, beklenen`); }
    else { say('✗', ex, `%${(worst * 100).toFixed(0)} uzunluk sapması — FK bozulmuş`); fails++; problem.push(ex.en); }
  }
}
if (!problem.length) console.log(`  ✓ ${all.length} egzersizin tümünde uzuv uzunlukları sabit`);

// ── 2. Eklem açısı insan aralığında mı? (uç pozlar VE ara pozlar) ────────────
console.log(`\n2) EKLEM LİMİTİ (azami ${JOINT_MAX}° fleksiyon)`);
let jointClean = true;
for (const ex of all) {
  let peak = { v: 0, t: 0, joint: '' };
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS, p = poseAt(ex.a, ex.b, t);
    const joints = {
      dirsek: norm(p.fa - p.ua),
      dirsek2: norm((p.fa2 ?? p.fa) - (p.ua2 ?? p.ua)),
      diz: norm(p.sh - p.th),
      diz2: norm((p.sh2 ?? p.sh) - (p.th2 ?? p.th)),
    };
    for (const [name, v] of Object.entries(joints))
      if (Math.abs(v) > Math.abs(peak.v)) peak = { v, t, joint: name };
  }
  if (Math.abs(peak.v) > JOINT_MAX) {
    const where = peak.t === 0 ? 'BAŞLANGIÇ pozu' : peak.t === 1 ? 'BİTİŞ pozu' : `ara poz t=${peak.t.toFixed(2)}`;
    say('✗', ex, `${peak.joint} ${Math.abs(peak.v).toFixed(0)}° @ ${where}`);
    fails++; jointClean = false;
  }
}
if (jointClean) console.log(`  ✓ tüm eklemler ${JOINT_MAX}° sınırının altında`);

// ── 3. Açı sıçraması: uzuv kısa yoldan mı dönüyor? ──────────────────────────
console.log('\n3) DÖNÜŞ YÖNÜ (|Δ| > 180° = uzuv uzun yoldan dolanıyor)');
let spinClean = true;
for (const ex of all) {
  for (const k of ['torso', 'ua', 'fa', 'ua2', 'fa2', 'th', 'sh', 'th2', 'sh2']) {
    if (ex.a[k] === undefined || ex.b[k] === undefined) continue;
    const d = ex.b[k] - ex.a[k];
    if (Math.abs(d) > 180) {
      say('⚠', ex, `${k}: ${ex.a[k]}° → ${ex.b[k]}° (Δ=${d}°, kısa yol ${d > 0 ? d - 360 : d + 360}°)`);
      warns++; spinClean = false;
    }
  }
}
if (spinClean) console.log('  ✓ tüm eklemler kısa yoldan dönüyor');

// ── 4. Zemine basan ayak hareket boyunca yerinde kalıyor mu? ────────────────
console.log('\n4) AYAK YERDE');
let footClean = true;
for (const ex of all) {
  if (ex.nofoot || ex.top) continue;
  const y0 = skeleton(ex.a, ex.view).ftA[1];

  // (a) ZEMİN ÇİZGİSİ ÇİZEN hareketin ayağı gerçekten YERDE olmalı.
  //     Aşağıdaki kayma denetimi, ayak zeminden uzaksa SESSİZCE ATLIYORDU —
  //     yani "figür havada duruyor" hatası hiç yakalanamıyordu. Kasten 10px
  //     kaldırılan bir poz denendi ve denetim ötmedi (19 Ağu). Zemin çizen
  //     hareketlerde artık ayrıca konum denetleniyor.
  const zeminCiziyor = /\bgrd\(/.test(String(ex.eq ?? ''));
  if (zeminCiziyor) {
    const ayaklar = [skeleton(ex.a, ex.view), skeleton(ex.b, ex.view)]
      .flatMap(s => ex.view === 'front' ? [s.ftA[1], s.ftB[1]] : [s.ftA[1]]);
    const enUzak = ayaklar.reduce((m, y) => Math.abs(y - GROUND_Y) > Math.abs(m - GROUND_Y) ? y : m, GROUND_Y);
    if (Math.abs(enUzak - GROUND_Y) > 4) {
      say('✗', ex, `zemin çizgisi var ama ayak ${(enUzak - GROUND_Y).toFixed(0)}px ${enUzak < GROUND_Y ? 'HAVADA' : 'zeminin ALTINDA'}`);
      fails++; footClean = false;
    }
  }

  // (b) Zemine basan ayak hareket boyunca KAYMAMALI
  if (Math.abs(y0 - GROUND_Y) > 6) continue;        // zaten zeminde başlamıyor
  let drift = 0;
  for (let i = 0; i <= STEPS; i++)
    drift = Math.max(drift, Math.abs(skeleton(poseAt(ex.a, ex.b, i / STEPS), ex.view).ftA[1] - y0));
  if (drift > 3) { say('✗', ex, `ayak zeminden ${drift.toFixed(0)}px kayıyor`); fails++; footClean = false; }
}
if (footClean) console.log(`  ✓ zemine basan ayaklar yerinde ve sabit`);

// ── 5. Veri tutarlılığı ────────────────────────────────────────────────────
console.log('\n5) VERİ TUTARLILIĞI');
let dataClean = true;
const SET_TYPES = new Set(['weight_reps', 'time', 'cardio']);
const byId = new Map();

for (const ex of all) {
  for (const f of ['id', 'setType', 'equipment', 'target', 'en', 'tr', 'sets', 'reps', 'view', 'mus', 'a', 'b', 'steps', 'tip'])
    if (ex[f] === undefined) { say('✗', ex, `zorunlu alan eksik: ${f}`); fails++; dataClean = false; }

  if (!SET_TYPES.has(ex.setType)) { say('✗', ex, `geçersiz setType: ${ex.setType}`); fails++; dataClean = false; }

  // setType ile target aynı şeyi söylüyor mu?
  const key = ex.setType === 'time' ? 'seconds' : ex.setType === 'cardio' ? 'minutes' : 'reps';
  if (ex.target && ex.target[key] === undefined) {
    say('✗', ex, `setType="${ex.setType}" ama target.${key} yok (${JSON.stringify(ex.target)})`); fails++; dataClean = false;
  }

  // Etiket ("2-3 × 12") gerçek veriyle örtüşüyor mu?
  const m = ex.reps.match(/^(\d+)(?:-(\d+))?\s*×\s*(\d+)/);
  if (m) {
    const lo = +m[1], hi = m[2] ? +m[2] : +m[1], val = +m[3];
    if (hi !== ex.sets || lo !== (ex.setsMin ?? ex.sets)) {
      say('✗', ex, `etiket "${ex.reps}" ≠ veri (sets=${ex.sets}, setsMin=${ex.setsMin ?? ex.sets})`); fails++; dataClean = false;
    }
    if (ex.target[key] !== val) { say('✗', ex, `etiket ${val} diyor, target.${key}=${ex.target[key]}`); fails++; dataClean = false; }
  }

  // Aynı id iki yerde geçiyorsa (Plank) tanımları çelişmemeli — geçmiş ortak tutulacak
  const prev = byId.get(ex.id);
  if (prev && (prev.setType !== ex.setType || JSON.stringify(prev.target) !== JSON.stringify(ex.target)))
    { say('✗', ex, `id="${ex.id}" iki farklı tanımla kullanılmış`); fails++; dataClean = false; }
  byId.set(ex.id, ex);

  if (ex.steps && ex.steps.length !== 4) { say('⚠', ex, `${ex.steps.length} adım (beklenen 4)`); warns++; dataClean = false; }
}
if (dataClean) console.log(`  ✓ ${all.length} egzersiz · ${byId.size} benzersiz id · alanlar, tipler ve etiketler tutarlı`);

// ── 6. İzometrik hareketlerin görseli var mı, temas noktaları doğru mu? ─────
console.log('\n6) İZOMETRİK (hold) HAREKETLER');
let holdClean = true, holdCount = 0;
for (const ex of all) {
  if (!ex.hold) continue;
  holdCount++;
  if (!ex.variants?.length) {
    // Animasyon yoksa görsel de yoksa kullanıcı hareketi hiç öğrenemez.
    say('✗', ex, 'hold:true ama variants[] yok — izometrik harekette görsel ŞART');
    fails++; holdClean = false; continue;
  }
  const doğru = ex.variants.filter(v => v.ok);
  if (doğru.length !== 1) { say('✗', ex, `${doğru.length} adet "doğru" varyant (tam 1 olmalı)`); fails++; holdClean = false; }
  for (const v of ex.variants) {
    if (!v.label || !v.note) { say('✗', ex, 'varyantta label/note eksik'); fails++; holdClean = false; continue; }
    const s = skeleton(v.pose, ex.view);
    // Plank'ta temas noktaları yerde olmalı — havada duran bir figür öğretmez
    for (const [ad, y] of [['ön kol', s.haA[1]], ['ayak', s.ftA[1]]])
      if (Math.abs(y - 179) > 2) {
        say('✗', ex, `"${v.label}": ${ad} zeminde değil (y=${y.toFixed(1)}, beklenen 179)`);
        fails++; holdClean = false;
      }
  }
}
if (holdClean) console.log(holdCount
  ? `  ✓ ${holdCount} izometrik hareket · doğru + hatalı duruş görselleri tam, temas noktaları yerinde`
  : '  ⓘ izometrik hareket yok');

// ── 7. Isınma hareketleri de AYNI denetimden geçer ──────────────────────────
console.log('\n7) ISINMA HAREKETLERİ');
{
  const { WARMUP } = await import('../js/data/warmup.js');
  const kendi = WARMUP.flat().filter(w => !w.ref);      // ref olanlar egzersizin pozunu ödünç alır
  const ödünç = WARMUP.flat().filter(w => w.ref);
  let temiz = true;

  for (const w of kendi) {
    for (const f of ['id', 'ad', 'miktar', 'not', 'view', 'a', 'b', 'eq'])
      if (w[f] === undefined) { console.log(`  ✗ ${w.ad}: zorunlu alan eksik: ${f}`); fails++; temiz = false; }
    if (!w.a) continue;

    for (let i = 0; i <= 20; i++) {
      const p = poseAt(w.a, w.b, i / 20);
      const s = skeleton(p, w.view);
      // uzuv uzunluğu
      for (const [got, want] of [[dist(s.shA, s.elA), L.ua], [dist(s.elA, s.haA), L.fa],
                                 [dist(s.hipA, s.knA), L.th], [dist(s.knA, s.ftA), L.sh]])
        if (Math.abs(got - want) / want > 0.01) { console.log(`  ✗ ${w.ad}: uzuv uzunluğu sapıyor`); fails++; temiz = false; i = 99; break; }
      // eklem limiti
      const dirsek = norm(p.fa - p.ua), diz = norm(p.sh - p.th);
      if (Math.abs(dirsek) > 150 || Math.abs(diz) > 150) {
        console.log(`  ✗ ${w.ad} @t=${(i / 20).toFixed(2)}: eklem limiti aşıldı (dirsek ${dirsek.toFixed(0)}°, diz ${diz.toFixed(0)}°)`);
        fails++; temiz = false; break;
      }
    }
    // dönüş yönü: eklem işareti hareket boyunca değişmemeli
    for (const [ad, üst, alt] of [['dirsek', 'ua', 'fa'], ['diz', 'th', 'sh'],
                                  ['dirsek2', 'ua2', 'fa2'], ['diz2', 'th2', 'sh2']]) {
      if (w.a[üst] === undefined) continue;
      const seri = Array.from({ length: 21 }, (_, i) => {
        const p = poseAt(w.a, w.b, i / 20);
        return norm((p[alt] ?? p[alt.replace('2', '')]) - p[üst]);
      });
      const mn = Math.min(...seri), mx = Math.max(...seri);
      if (mn < -6 && mx > 6) {
        console.log(`  ✗ ${w.ad}: ${ad} TERS KIVRILIYOR (${mn.toFixed(0)}° … ${mx.toFixed(0)}°)`);
        fails++; temiz = false;
      }
    }
  }
  if (temiz) console.log(`  ✓ ${kendi.length} kendi pozlu hareket · uzuv, eklem limiti ve dönüş yönü temiz`);
  console.log(`  ⓘ ${ödünç.length} hazırlık adımı egzersizin pozunu ödünç alıyor (ayrıca denetlenmiş)`);
}

// ── 8. Diz FLEKSİYON YÖNÜ: işaret değişmiyor diye doğru demek değil ─────────
// Bölüm 2 büyüklüğe bakar, bölüm 7 işaretin DEĞİŞMESİNE. İkisi de "baştan sona
// yanlış yöne bükülü" dizi kaçırır — Two Arm Dumbbell Row tam olarak öyleydi:
// diz sabit −15°, hiç değişmiyor, ama face:-1 için ters yön.
//
// Sözleşme: `face` ayak ucunun baktığı yöndür. Diz FLEKSİYONU dizi ileri iter,
// yani işaretli diz açısı (sh − th) sağa bakanda ≤ 0, sola bakanda ≥ 0 olmalı.
console.log('\n8) DİZ FLEKSİYON YÖNÜ (face ile uyum — hiperekstansiyon)');
{
  const { WARMUP } = await import('../js/data/warmup.js');
  const hepsi = [...all.map(ex => ({ ad: `${ex.tr}`, ex })),
                 ...WARMUP.flat().filter(w => !w.ref && w.a)
                   .map(w => ({ ad: `ısınma · ${w.ad}`, ex: w }))];
  const DÜZ = 4;                                    // ±4° = düz bacak, yönsüz
  let temiz = true;

  for (const { ad, ex } of hepsi) {
    if ((ex.view ?? 'side') === 'front') continue;   // önden görünümde yön okunmaz
    const f = ex.face ?? 1;
    const bekle = f === 1 ? 'negatif (diz sağa/ileri)' : 'pozitif (diz sola/ileri)';
    for (const [ad2, ü, a] of [['diz', 'th', 'sh'], ['diz2', 'th2', 'sh2']]) {
      if (ex.a[ü] === undefined) continue;
      const seri = Array.from({ length: 21 }, (_, i) => {
        const p = poseAt(ex.a, ex.b, i / 20);
        return norm((p[a] ?? p[a.replace('2', '')]) - (p[ü] ?? p[ü.replace('2', '')]));
      });
      const ters = seri.filter(v => Math.abs(v) > DÜZ && (f === 1 ? v > 0 : v < 0));
      if (ters.length) {
        const en = ters.reduce((x, y) => Math.abs(y) > Math.abs(x) ? y : x);
        console.log(`  ✗ ${ad}: ${ad2} TERS YÖNE bükülü — ${en.toFixed(0)}°, beklenen ${bekle} (face=${f})`);
        fails++; temiz = false;
      }
    }
  }
  if (temiz) console.log(`  ✓ ${hepsi.length} hareketin tüm dizleri face yönüyle uyumlu`);
}

// ── Özet ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(64)}`);
console.log(`${all.length} egzersiz · ${fails} hata · ${warns} uyarı`);
if (fails) console.log('✗ Anatomik olarak geçersiz poz var — düzeltilmeden yayınlama.');
else if (warns) console.log('⚠ Hata yok, gözden geçirilecek uyarılar var.');
else console.log('✓ Temiz.');
process.exit(fails ? 1 : 0);
