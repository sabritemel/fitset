/**
 * TAKVİM — "bugün antrenman günü mü?" sorusunu cevaplar. HANGİ günü değil.
 *
 * ┌─ TASARIM KARARI ────────────────────────────────────────────────────────┐
 * │ Prototip A/B sırasını takvimden hesaplıyordu: başlangıç tarihinden bugüne│
 * │ kaç antrenman günü geçtiyse index o. Bir seans kaçırıldığında sıra       │
 * │ kayıyordu ve bunu telafi etmek için "sırayı kaydır" düğmesi konmuştu.    │
 * │ O düğme bir özellik değil, modelin yanlış olduğunun itirafıydı.          │
 * │                                                                          │
 * │ Burada sıra takvimden TÜRETİLMEZ. Sıradaki gün, son TAMAMLANAN seansın   │
 * │ tersidir (bkz. store.lastDoneSession + session.nextDayIndex). Tatil,     │
 * │ hastalık, kaçırılan seans, program dışı antrenman — hepsi kendiliğinden  │
 * │ doğru çalışır ve kullanıcı hiçbir zaman "uygulama şaştı" demez.          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️ ZAMAN ARİTMETİĞİ: gün farkı ASLA (t2-t1)/86400000 ile hesaplanmaz —
 * yaz saati geçişinde bir gün kayar. Yerel y/m/g bileşenleri Date.UTC'ye
 * verilerek gün numarasına çevrilir; bu saat dilimini tamamen devre dışı
 * bırakır. (Türkiye kalıcı UTC+3, ama kod yurt dışında da doğru çalışmalı.)
 */

export const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Yerel takvim gününün sıra numarası — saat diliminden ve yaz saatinden bağımsız */
export const dayNumber = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);

/** b − a, tam gün cinsinden. Saat/dakika farkı sonucu etkilemez. */
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);

/** Aynı yerel güne mi düşüyorlar? (gece yarısı tazelemesi bunu kullanır) */
export const sameDay = (a, b) => dayNumber(a) === dayNumber(b);

/** Saat bilgisi atılmış kopya */
export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Gün ekle/çıkar — setDate ay ve yıl taşmasını kendisi halleder */
export const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };

/** "14 Temmuz Salı" */
export const fmtDate = d => `${d.getDate()} ${AY[d.getMonth()]} ${GUN[d.getDay()]}`;
/** "14 Tem Sal" */
export const fmtShort = d => `${d.getDate()} ${AY[d.getMonth()].slice(0, 3)} ${GUN_KISA[d.getDay()]}`;

export const isTrainingDay = (d, trainingDays) => trainingDays.includes(d.getDay());

/** `from`'dan SONRAKİ ilk antrenman günü (from'un kendisi sayılmaz) */
export function nextTrainingDay(from, trainingDays) {
  if (!trainingDays.length) return null;
  for (let i = 1; i <= 7; i++) {
    const d = addDays(from, i);
    if (isTrainingDay(d, trainingDays)) return d;
  }
  return null;
}

/** Sıradaki n antrenman günü (bugün antrenman günüyse bugünle başlar) */
export function upcoming(from, trainingDays, n = 3) {
  const out = [];
  let d = startOfDay(from);
  if (!isTrainingDay(d, trainingDays)) d = nextTrainingDay(d, trainingDays);
  while (d && out.length < n) { out.push(d); d = nextTrainingDay(d, trainingDays); }
  return out;
}

/**
 * "bugün" · "dün" · "3 gün önce" · "12 Temmuz"
 * Bir haftadan eskiler tarihe döner; "34 gün önce" kimseye bir şey söylemez.
 */
export function relativeLabel(date, today = new Date()) {
  const n = daysBetween(date, today);
  if (n === 0) return 'bugün';
  if (n === 1) return 'dün';
  if (n > 1 && n <= 7) return `${n} gün önce`;
  if (n === -1) return 'yarın';
  if (n < -1 && n >= -7) return `${-n} gün sonra`;
  return `${date.getDate()} ${AY[date.getMonth()]}`;
}

/**
 * Ekranın üstündeki durum satırı için tek seferde her şey.
 * Dikkat: burada dayIndex YOK — o bilgi geçmişten gelir, takvimden değil.
 */
export function todayStatus(trainingDays, now = new Date()) {
  const today = startOfDay(now);
  const bugunAntrenman = isTrainingDay(today, trainingDays);
  return {
    today,
    isTrainingDay: bugunAntrenman,
    label: fmtDate(today),
    next: bugunAntrenman ? null : nextTrainingDay(today, trainingDays),
    upcoming: upcoming(bugunAntrenman ? addDays(today, 1) : today, trainingDays, 3),
  };
}
