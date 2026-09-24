/**
 * AĞIRLIK ARTIRMA ÖNERİSİ — saf mantık (DOM yok, Node'da test edilir).
 *
 * Sabri (24 Eyl): hocası yalnız "yapabildiğin kadar artır" diyor; kural genel geçer
 * standarttan seçildi ve "iki seans sonra şartlar uygunsa öner" diye onaylandı.
 *
 * ┌─ KAYNAK ────────────────────────────────────────────────────────────────┐
 * │ ACSM 2009 (Progression Models, kanıt B): "a 2–10% increase in load when │
 * │ the individual can perform the current workload for 1–2 repetitions    │
 * │ over the desired number on TWO CONSECUTIVE training sessions" — küçük   │
 * │ kasa alt, büyük kasa üst yüzde. Uygulamalarda en yaygın biçimi ÇİFT     │
 * │ İLERLEME: tüm setler aralığın üst sınırına ulaşınca ağırlık artar.      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Kural:
 *   1. O hareketin yapıldığı SON İKİ seansta: çalışma setlerinin (ısınma hariç)
 *      hepsi AYNI ağırlıkta, sayısı hedef set sayısı kadar ve her biri hedef
 *      tekrara (aralığın üst sınırı) ulaşmış olmalı; iki seansın ağırlığı aynı.
 *   2. Yeni ağırlık = ağırlık × (1 + p), ekipman adımına YUKARI yuvarlanır;
 *      p = %5 bileşik, %2,5 izole hareket.
 *   3. Adım ağırlığın %10'undan büyükse (ör. 10 kg dambılda +2,5 = %25) önce
 *      TEKRAR ilerletilir: tüm setler üst sınır + 2'ye ulaşmadan ağırlık önerilmez.
 *   4. Öner, DAYATMA: kutu yine geçen seferle dolar; öneri tek dokunuşla uygulanır.
 *
 * ⚠️ Hareket sınıfı (bileşik/izole) ve ekipman adımı şimdilik BURADA; hareket
 * kütüphanesi (yol haritasının 2. adımı) gelince oraya taşınacak.
 */

/** Ekipman başına en küçük artış (kg). Bar: en küçük plaka 1,25 × 2. Makine/kablo yığını: tipik 5. */
export const ADIM = { barbell: 2.5, dumbbell: 2.5, machine: 5, cable: 5 };

/** Bileşik (çok eklemli) hareketler — büyük kas, %5 artış */
export const BILESIK = new Set([
  'bb_bench_press', 'machine_incline_press', 'db_shoulder_press',
  'cable_close_pulldown', 'db_two_arm_row', 'cable_seated_row', 'machine_leg_press', 'lunge',
]);

/** Büyük adım eşiği: artış ağırlığın bu oranından büyükse önce tekrar ilerletilir */
export const BUYUK_ADIM = 0.10;
/** Büyük adımda istenen fazladan tekrar (NSCA "2-for-2") */
export const FAZLA_TEKRAR = 2;
/** Kaç seans üst üste şart sağlanmalı */
export const SEANS = 2;

const yuvarla = x => Math.round(x * 100) / 100;

/**
 * Bir seanstaki çalışma setleri (ısınma hariç). Seans o hareketi içermiyorsa null.
 */
export function calismaSetleri(seans, exerciseId) {
  const e = seans.entries?.find(x => x.exerciseId === exerciseId);
  const setler = (e?.sets ?? []).filter(s => !s.warmup && s.type === 'weight_reps');
  return setler.length ? setler : null;
}

/**
 * Öneri üret.
 * @param {object} ex        egzersiz tanımı (id, setType, equipment)
 * @param {Array}  seanslar  bitmiş seanslar, EN YENİDEN eskiye (store.doneSessions)
 * @param {{sets:number, reps:number}} hedef  etkin hedef (session.effective)
 * @returns {null | {tur:'agirlik', agirlik, onceki, setler, tekrar} | {tur:'tekrar', agirlik, hedefTekrar, adimOrani}}
 */
export function oneri(ex, seanslar, hedef) {
  if (ex.setType !== 'weight_reps') return null;
  const adim = ADIM[ex.equipment];
  if (!adim || !(hedef?.reps > 0) || !(hedef?.sets > 0)) return null;

  const son = [];
  for (const s of seanslar) {
    if (s.kayitsiz) continue;
    const setler = calismaSetleri(s, ex.id);
    if (setler) son.push(setler);
    if (son.length === SEANS) break;
  }
  if (son.length < SEANS) return null;

  const W = son[0][0].weight;
  if (!(W > 0)) return null;
  const hepsi = son.flat();
  const ayniAgirlik = hepsi.every(s => Math.abs((s.weight ?? 0) - W) < 0.01);
  const yeterliSet = son.every(setler => setler.length >= hedef.sets);
  if (!ayniAgirlik || !yeterliSet) return null;
  if (!hepsi.every(s => (s.reps ?? 0) >= hedef.reps)) return null;

  const p = BILESIK.has(ex.id) ? 0.05 : 0.025;
  const yeni = yuvarla(Math.ceil(yuvarla(W * (1 + p)) / adim - 1e-9) * adim);
  const oran = (yeni - W) / W;
  if (oran > BUYUK_ADIM && !hepsi.every(s => s.reps >= hedef.reps + FAZLA_TEKRAR))
    return { tur: 'tekrar', agirlik: W, hedefTekrar: hedef.reps + FAZLA_TEKRAR, adimOrani: oran };
  return { tur: 'agirlik', agirlik: yeni, onceki: W, setler: hedef.sets, tekrar: hedef.reps };
}

/**
 * Öneri bugün hâlâ geçerli mi? Kullanıcı bugün önerilen ağırlığa (ya da üstüne)
 * zaten çıktıysa öneri iş görmüş sayılır ve gizlenir.
 */
export function oneriGecerliMi(o, bugunkuSetler) {
  if (!o) return false;
  if (o.tur !== 'agirlik') return true;
  return !(bugunkuSetler ?? []).some(s => !s.warmup && (s.weight ?? 0) >= o.agirlik - 0.01);
}
