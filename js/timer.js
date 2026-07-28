/**
 * GERİ SAYIM — iki iş, tek bileşen:
 *   1. Set süresi   (Plank gibi izometrik hareketler)  · seansta 3-6 kez
 *   2. Set arası dinlenme                              · seansta ~27 kez
 *
 * ┌─ ÜÇ TASARIM KARARI, üçü de aynı gerçekten çıkıyor ──────────────────────┐
 * │ PWA'da ARKA PLANDA GÜVENİLİR ALARM YOKTUR.                              │
 * │   · navigator.vibrate sayfa gizliyken yok sayılır                       │
 * │   · setTimeout/setInterval arka planda kısılır (throttling)             │
 * │   · ses, kullanıcı etkileşimi olmadan çalmaz                            │
 * │                                                                          │
 * │ Bu yüzden:                                                               │
 * │ 1. Sayaç TICK SAYMAZ, DUVAR SAATİ kullanır. Kısılma süreyi bozamaz;     │
 * │    telefona geri dönüldüğünde kalan süre doğrudur.                      │
 * │ 2. Sayaç başlarken WAKE LOCK alınır — ekran açık kalır, böylece         │
 * │    titreşim ve ses fiilen çalışır.                                       │
 * │ 3. Buna rağmen kaçarsa SESSİZCE YALAN SÖYLENMEZ: "12 sn önce bitti"     │
 * │    denir. Vaat edilmeyen şey vaat edilmiş gibi gösterilmez.             │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

let audio = null;

/**
 * Ses bağlamını kullanıcı dokunuşuyla açar ve AÇIK TUTAR.
 * Otomatik oynatma politikası yüzünden ilk dokunuştan sonra açılmalı;
 * her seferinde yeniden açmak bazı tarayıcılarda sessiz kalmaya yol açar.
 */
export function primeAudio() {
  if (audio) return audio;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { audio = new AC(); } catch { audio = null; }
  return audio;
}

/** Kısa, keskin bir bip — konuşma değil, sinyal */
function beep(times = 2) {
  const ac = primeAudio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  for (let i = 0; i < times; i++) {
    const t = ac.currentTime + i * 0.22;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}

export class Countdown {
  #endAt = 0;
  #total = 0;
  #raf = 0;
  #lock = null;
  #done = false;

  /**
   * @param {(kalan:number,toplam:number)=>void} onTick   her ~100ms
   * @param {(gecikme:number)=>void} onDone   gecikme = bitişten kaç sn sonra fark edildi
   */
  constructor({ onTick, onDone } = {}) { this.onTick = onTick; this.onDone = onDone; }

  get running() { return this.#endAt > 0 && !this.#done; }
  /** Kalan saniye — her zaman duvar saatinden hesaplanır, sayaçtan değil */
  get remaining() { return Math.max(0, (this.#endAt - Date.now()) / 1000); }
  get total() { return this.#total; }

  async start(seconds) {
    this.stop(false);
    this.#total = seconds;
    this.#endAt = Date.now() + seconds * 1000;
    this.#done = false;
    primeAudio();                     // kullanıcı dokunuşu HÂLÂ geçerliyken aç
    await this.#wake();
    this.#loop();
  }

  stop(release = true) {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0; this.#endAt = 0; this.#done = true;
    if (release) this.#release();
  }

  /** +30 sn gibi ayarlamalar — bitiş anı kaydırılır, yeniden başlatılmaz */
  extend(seconds) {
    if (!this.#endAt) return;
    this.#endAt += seconds * 1000;
    this.#total += seconds;
    this.#done = false;
    if (!this.#raf) this.#loop();
  }

  #loop() {
    const adım = () => {
      const kalan = this.remaining;
      this.onTick?.(kalan, this.#total);
      if (kalan > 0) { this.#raf = requestAnimationFrame(adım); return; }
      if (this.#done) return;
      this.#done = true;
      // Ne kadar geç fark edildi? Sekme arka plandaysa rAF durur; geri
      // dönüldüğünde bu değer kullanıcıya dürüstçe söylenir.
      const gecikme = Math.max(0, (Date.now() - this.#endAt) / 1000);
      if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
      beep(2);
      this.#release();
      this.onDone?.(gecikme);
    };
    this.#raf = requestAnimationFrame(adım);
  }

  async #wake() {
    try { this.#lock = await navigator.wakeLock?.request('screen') ?? null; }
    catch { this.#lock = null; }        // izin yok / desteklenmiyor — sayaç yine çalışır
  }
  #release() { try { this.#lock?.release(); } catch { } this.#lock = null; }

  /**
   * Sekmeye geri dönüldüğünde çağrılır. Ekran kilidi kaybolmuş olabilir,
   * geri alınır; sayaç arka planda dolduysa bitiş burada işlenir.
   */
  async resume() {
    if (!this.running) return;
    if (this.remaining <= 0) { this.#loop(); return; }
    if (!this.#lock) await this.#wake();
    if (!this.#raf) this.#loop();
  }
}

/** 95 → "1:35" ·  45 → "0:45" */
export const mmss = sn => {
  const t = Math.ceil(sn);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
