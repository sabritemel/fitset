/**
 * HAZIR PROGRAMLAR (Faz 1C, 14 Eki 2026 — plan docs/2026-10-14-1c-ilk-acilis-hazir-programlar-PLAN.md §2, Sabri onayı).
 * Yalnız hareket KİMLİĞİ ve hedef: hareketin kendisi kütüphanede. Kullanıcı bir programı seçince KOPYASI kurulur
 * (program.hazirdanKur) — burası sonradan güncellense de kullanıcının programı değişmez.
 * Her günün adı var: boş adda başlık günün kas gruplarını sayıyordu ve iki satıra taşıyordu (14 Eki, canlı ölçüm).
 * 0.7.0 (1B dalga 2, plan K6/K7): Evde dambıl şınav, goblet ve yana kaldırmayla; sehpa isteyen dambıl göğüs açma evden çıktı.
 * Barfiks ve dips ev programına girmez (ekipman ister). Kurulmuş kopyalar değişmez; yalnız yeni seçimler.
 * 0.8.0 (K7): bacak açma ve bükme Tüm vücut C · Üst/Alt (Alt 1, Alt 2) · İtme/Çekme/Bacak (Bacak).
 */
const k = (exId, sets, hedef) => (typeof hedef === 'string' ? { exId, sets, seconds: parseInt(hedef, 10) } : { exId, sets, reps: hedef });
const PLANK = k('plank', 3, '30 sn');

export const HAZIR = [
  { id: 'tum', ad: 'Tüm vücut · 3 gün', kime: 'Yeni başlayanlar için; her gün bütün vücut', gunler: [
    ['Tüm vücut A', [k('bb_squat', 3, 8), k('bb_bench_press', 3, 8), k('bb_row', 3, 10), k('db_lateral_raise', 3, 12), PLANK]],
    ['Tüm vücut B', [k('bb_rdl', 3, 10), k('bb_ohp', 3, 8), k('bw_pullup', 3, 6), k('cable_close_pulldown', 3, 10), k('lunge', 3, 10)]],
    ['Tüm vücut C', [k('machine_leg_press', 3, 12), k('machine_incline_press', 3, 10), k('cable_seated_row', 3, 12), k('machine_leg_curl', 3, 12), k('cable_curl', 3, 12), k('cable_vbar_pushdown', 3, 12)]]] },
  { id: 'ustalt', ad: 'Üst / Alt · 4 gün', kime: 'Haftada 4 gün; üst ve alt vücut sırayla', gunler: [
    ['Üst 1', [k('bb_bench_press', 3, 8), k('bw_pullup', 3, 6), k('bb_row', 3, 10), k('bb_ohp', 3, 8), k('cable_close_pulldown', 3, 10), k('cable_curl', 3, 12), k('cable_vbar_pushdown', 3, 12)]],
    ['Alt 1', [k('bb_squat', 3, 8), k('bb_rdl', 3, 10), k('machine_leg_press', 3, 12), k('machine_leg_extension', 3, 12), k('calf_raise', 3, 15), PLANK]],
    ['Üst 2', [k('machine_incline_press', 3, 10), k('cable_seated_row', 3, 12), k('db_shoulder_press', 3, 10), k('db_lateral_raise', 3, 12), k('machine_reverse_fly', 3, 12), k('db_hammer_curl', 3, 12), k('db_overhead_ext', 3, 12)]],
    ['Alt 2', [k('bb_deadlift', 3, 5), k('lunge', 3, 10), k('machine_leg_press', 3, 12), k('machine_leg_curl', 3, 12), k('calf_raise', 3, 15), PLANK]]] },
  { id: 'ppl', ad: 'İtme / Çekme / Bacak', kime: 'Haftada 5–6 gün, deneyimliler için', gunler: [
    ['İtme', [k('bb_bench_press', 3, 8), k('machine_incline_press', 3, 10), k('bb_ohp', 3, 8), k('db_lateral_raise', 3, 12), k('cable_front_raise', 3, 12), k('cable_vbar_pushdown', 3, 12), k('db_overhead_ext', 3, 12)]],
    ['Çekme', [k('bw_pullup', 3, 6), k('bb_row', 3, 10), k('cable_close_pulldown', 3, 10), k('cable_seated_row', 3, 12), k('machine_reverse_fly', 3, 12), k('cable_curl', 3, 12), k('db_hammer_curl', 3, 12)]],
    ['Bacak', [k('bb_squat', 3, 8), k('bb_rdl', 3, 10), k('machine_leg_press', 3, 12), k('machine_leg_extension', 3, 12), k('machine_leg_curl', 3, 12), k('lunge', 3, 10), k('calf_raise', 3, 15)]]] },
  { id: 'bes', ad: '5 × 5 · güç', kime: 'Güç hedefi; az hareket, ağır setler, haftada 3 gün', gunler: [
    ['A', [k('bb_squat', 5, 5), k('bb_bench_press', 5, 5), k('bb_row', 5, 5)]],
    ['B', [k('bb_squat', 5, 5), k('bb_ohp', 5, 5), k('bb_deadlift', 1, 5)]]] },
  { id: 'ev', ad: 'Evde dambıl', kime: 'Evde; bir çift dambıl ve vücut ağırlığı', gunler: [
    ['Ev A', [k('db_goblet_squat', 3, 12), k('bw_pushup', 3, 10), k('db_two_arm_row', 3, 12), k('db_lateral_raise', 3, 12), PLANK]],
    ['Ev B', [k('lunge', 3, 10), k('bw_pushup', 3, 10), k('db_overhead_ext', 3, 12), k('db_hammer_curl', 3, 12), k('calf_raise', 3, 15), PLANK]]] },
];
export const hazirBul = id => HAZIR.find(h => h.id === id) ?? null;

/** İLK AÇILIŞ SORULARI (plan §3) — her biri tek dokunuş */
export const SORULAR = [
  { anahtar: 'hedef', soru: 'Hedefin ne?', alt: 'Programı buna göre önereceğiz.',
    secenek: [['kas', 'Kas ve görünüm', 'Hacim, şekil'], ['guc', 'Güç', 'Daha ağır kaldırmak'], ['form', 'Genel form', 'Sağlık, enerji, düzen']] },
  { anahtar: 'gun', soru: 'Haftada kaç gün?', alt: 'Gerçekçi olanı seç; sonradan değiştirebilirsin.',
    secenek: [[2, '2 gün', ''], [3, '3 gün', ''], [4, '4 gün', ''], [5, '5–6 gün', '']] },
  { anahtar: 'yer', soru: 'Nerede çalışacaksın?', alt: '',
    secenek: [['salon', 'Salonda', 'Bar, makine, kablo'], ['ev', 'Evde', 'Bir çift dambıl ve vücut ağırlığı']] },
  { anahtar: 'deneyim', soru: 'Deneyimin?', alt: '',
    secenek: [['yeni', 'Yeni başlıyorum', 'Ya da uzun ara verdim'], ['orta', 'Bir süredir yapıyorum', 'Birkaç aydır düzenli'], ['ileri', 'Deneyimliyim', 'Yıllardır']] },
];

/**
 * ÖNERİ KURALI (plan §3, tek yer): Evde → Evde dambıl · güç hedefi ve ≤ 3 gün → 5 × 5 · 4 gün → Üst/Alt ·
 * 5–6 gün → deneyimliyse İtme/Çekme/Bacak, yeniyse Üst/Alt · diğerleri → Tüm vücut 3 gün.
 */
/**
 * ANTRENMAN GÜNLERİ (ilk açılış): "haftada kaç gün" cevabından, BUGÜNÜ içeren aralıklı bir hafta düzeni (0 = Pazar).
 * Yeni kullanıcı ilk gün "program günü değil" uyarısı görüyordu (varsayılan Sabri'nin Salı/Perşembe/Cumartesi'si).
 */
const DUZEN = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };
export function antrenmanGunleri(gunSayisi, bugun) {
  const d = DUZEN[Math.min(5, Math.max(2, gunSayisi || 3))];
  return [...new Set(d.map(o => (bugun + o) % 7))].sort((a, b) => a - b);
}

export function oner(c = {}) {
  if (c.yer === 'ev') return 'ev';
  if (c.hedef === 'guc' && (c.gun ?? 3) <= 3) return 'bes';
  if (c.gun === 4) return 'ustalt';
  if (c.gun >= 5) return c.deneyim === 'yeni' ? 'ustalt' : 'ppl';
  return 'tum';
}
