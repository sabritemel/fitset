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
 *   5. RIR (G1, 17 Eki): setlerde RIR kaydedildiyse ağırlık YALNIZ hedef RIR korunarak (RIR ≥ hedef; hedef yoksa
 *      RIR ≥ 1) üst sınıra ulaşıldıysa artar — "zorla çıkarılmış" tekrar (RIR 0) artış gerekçesi değildir. Son seansın
 *      bir setinde RIR 0 varsa öneri `kal`: "bu ağırlıkta kal". RIR kaydı yoksa kural 1–3 aynen geçerli.
 *
 * ⚠️ Hareket sınıfı (bileşik/izole) ve ekipman adımı şimdilik BURADA; hareket
 * kütüphanesi (yol haritasının 2. adımı) gelince oraya taşınacak.
 */

/** Ekipman başına en küçük artış (kg). Bar: en küçük plaka 1,25 × 2. Makine/kablo yığını: tipik 5. */
export const ADIM = { barbell: 2.5, dumbbell: 2.5, machine: 5, cable: 5 };

/** Dambıl seti salona göre 2 ya da 2,5 kg artar — kullanıcı Ayarlar'da seçer */
export const DAMBIL_ADIMLARI = [2, 2.5];

/**
 * AĞIRLIK ADIMI — TEK KAYNAK: odak ekranındaki +/−, hedef panelinin adımlayıcısı ve
 * önerinin yuvarlaması bunu çağırır.
 * ⚠️ 27 Eyl'e kadar +/− her ekipmanda sabit 2,5'ti (ui.js), öneri motoru ise makineyi 5'e
 * yuvarlıyordu: aynı uygulama iki ayrı adım biliyordu. 16 kg dambılda "+" 18,5 yazıyordu.
 * @returns {number|null} null: ekipmanın standart adımı yok (vücut ağırlığı) — öneri yapılmaz
 */
export function agirlikAdimi(ex, settings) {
  if (ex.equipment === 'dumbbell' && DAMBIL_ADIMLARI.includes(settings?.dambilAdimi)) return settings.dambilAdimi;
  return ADIM[ex.equipment] ?? null;
}
/** Standart adımı olmayan ekipmanda (vücut ağırlığına eklenen yük) giriş adımı */
export const GIRIS_ADIMI_YEDEK = 2.5;

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
 * HAREKET GEÇMİŞİ (14 Eki, Hareketler sekmesi · Sabri onayı): bitmiş seanslardan bir hareketin özeti — kaç seansta
 * yapıldı, SON seansın en iyi seti ve bütün zamanların en iyi seti. "En iyi": ağırlık (süreli harekette süre, kardiyoda
 * dakika) en büyük; eşitse tekrarı çok olan. Isınma setleri sayılmaz. `seanslar` EN YENİDEN eskiye (store.doneSessions).
 * Hiç kaydı yoksa null.
 */
export function hareketGecmisi(seanslar, ex) {
  const tur = ex?.setType ?? 'weight_reps';
  const deger = s => (tur === 'time' ? s.seconds : tur === 'cardio' ? s.minutes : s.weight) ?? 0;
  const iyi = (a, b) => !b || deger(a) > deger(b) || (deger(a) === deger(b) && (a.reps ?? 0) > (b.reps ?? 0));
  let sayi = 0, son = null, enIyi = null, not = null;
  for (const seans of seanslar ?? []) {
    const e = seans.entries?.find(x => x.exerciseId === ex.id);
    if (!not && e?.note) not = { at: seans.finishedAt ?? seans.startedAt, metin: e.note };   // G4: en son not
    const setler = (e?.sets ?? []).filter(s => !s.warmup && s.type === tur);
    if (!setler.length) continue;
    sayi++;
    const at = seans.finishedAt ?? seans.startedAt;
    let seansIyi = null;
    for (const s of setler) if (iyi(s, seansIyi)) seansIyi = s;
    if (!son) son = { at, set: seansIyi };
    if (iyi(seansIyi, enIyi?.set)) enIyi = { at, set: seansIyi };
  }
  return sayi ? { sayi, son, enIyi, not } : null;
}

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
 * @param {number|null} [adim]  ekipman adımı — uygulama agirlikAdimi(ex, ayarlar) geçer
 *        (dambıl adımı kullanıcının seçimi); verilmezse ekipman tablosu
 * @returns {null | {tur:'agirlik', agirlik, onceki, setler, tekrar} | {tur:'tekrar', agirlik, hedefTekrar, adimOrani}}
 */
export function oneri(ex, seanslar, hedef, adim = ADIM[ex.equipment]) {
  if (ex.setType !== 'weight_reps') return null;
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
  if (!hepsi.every(s => (s.reps ?? 0) >= hedef.reps)) {
    if (son[0].some(s => s.rir === 0)) return { tur: 'kal', agirlik: W };
    return null;
  }
  // RIR (kural 5): kaydedilen her set hedef RIR'ı korumuş olmalı
  const rirAlt = hedef.rir ?? 1;
  if (hepsi.some(s => s.rir != null && s.rir < rirAlt)) return son[0].some(s => s.rir === 0) ? { tur: 'kal', agirlik: W } : null;
  const rirli = hepsi.some(s => s.rir != null);

  const p = BILESIK.has(ex.id) ? 0.05 : 0.025;
  const yeni = yuvarla(Math.ceil(yuvarla(W * (1 + p)) / adim - 1e-9) * adim);
  const oran = (yeni - W) / W;
  if (oran > BUYUK_ADIM && !hepsi.every(s => s.reps >= hedef.reps + FAZLA_TEKRAR))
    return { tur: 'tekrar', agirlik: W, hedefTekrar: hedef.reps + FAZLA_TEKRAR, adimOrani: oran };
  return { tur: 'agirlik', agirlik: yeni, onceki: W, setler: hedef.sets, tekrar: hedef.reps, ...(rirli && { rir: rirAlt }) };
}

/**
 * Öneri bugün hâlâ geçerli mi? Kullanıcı bugün önerilen ağırlığa (ya da üstüne)
 * zaten çıktıysa öneri iş görmüş sayılır ve gizlenir.
 */
export function oneriGecerliMi(o, bugunkuSetler) {
  if (!o) return false;
  if (o.tur === 'kal') return !(bugunkuSetler ?? []).some(s => !s.warmup);   // ilk sete kadar hatırlatır
  if (o.tur !== 'agirlik') return true;
  return !(bugunkuSetler ?? []).some(s => !s.warmup && (s.weight ?? 0) >= o.agirlik - 0.01);
}
