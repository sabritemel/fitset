/**
 * SAYAÇ TESTLERİ —  node tools/test-timer.js
 *
 * timer.js tarayıcı API'lerine dokunur (requestAnimationFrame, Wake Lock).
 * Burada o API'ler TAKLİT edilir; sınanan şey tarayıcı değil, sayacın
 * onlara nasıl davrandığıdır.
 *
 * ⚠️ 24 Eyl hatası: sayfa gizlenince tarayıcı ekran kilidini kendiliğinden
 * bırakır ama kilit NESNESİ elde kalır (released = true). Sayaç "nesne var mı"
 * diye baktığı için dönüşte kilidi HİÇ geri almıyordu — başka uygulamaya geçip
 * dönen kullanıcının ekranı dinlenme sırasında kararabiliyordu.
 */
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };

// ── Tarayıcı taklidi (timer.js İÇE AKTARILMADAN önce kurulmalı) ──────────
globalThis.window = globalThis.window ?? {};
globalThis.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
globalThis.cancelAnimationFrame = id => clearTimeout(id);

let istek = 0, son = null, kip = 'olayli';
/** Gerçek tarayıcı: bırakınca 'release' olayı yayar ve released=true olur */
class OlayliKilit extends EventTarget {
  released = false;
  async release() { if (this.released) return; this.released = true; this.dispatchEvent(new Event('release')); }
}
/** Olay yaymayan eski/eksik uygulama: YALNIZ released bayrağı değişir */
class BayrakliKilit {
  released = false;
  async release() { this.released = true; }
}
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { wakeLock: { request: async () => { istek++; son = kip === 'olayli' ? new OlayliKilit() : new BayrakliKilit(); return son; } } },
});

const { Countdown, mmss } = await import('../js/timer.js');

console.log('\n1) EKRAN KİLİDİ — sayfa gizlenip dönünce YENİDEN alınır');
for (const k of ['olayli', 'bayrakli']) {
  kip = k; istek = 0;
  const c = new Countdown({});
  await c.start(60);
  ok(istek === 1 && c.awake, `[${k}] sayaç başlarken kilit alındı`);
  await son.release();                       // tarayıcı: sayfa gizlendi → kilit bırakıldı
  ok(!c.awake, `[${k}] kilidin bırakıldığı FARK EDİLDİ`);
  await c.resume();                          // kullanıcı uygulamaya döndü
  ok(istek === 2 && c.awake, `[${k}] dönüşte kilit YENİDEN alındı (eskiden alınmıyordu)`);
  await c.resume();
  ok(istek === 2, `[${k}] kilit zaten tutuluyorsa ikinci kez İSTENMİYOR`);
  c.stop();
  ok(!c.awake, `[${k}] durdurunca kilit bırakıldı`);
}

console.log('\n2) DUVAR SAATİ — kısılma süreyi bozmaz');
{
  const c = new Countdown({});
  await c.start(90);
  ok(Math.abs(c.remaining - 90) < 0.5, `kalan süre duvar saatinden (${c.remaining.toFixed(2)} sn)`);
  c.extend(30);
  ok(Math.abs(c.remaining - 120) < 0.5 && c.total === 120, '+30 bitiş anını kaydırıyor, yeniden başlatmıyor');
  c.stop();
  ok(!c.running, 'durduruldu');
  ok(mmss(95) === '1:35' && mmss(45) === '0:45' && mmss(0.2) === '0:01', 'mm:ss biçimi (yukarı yuvarlar)');
}

console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
