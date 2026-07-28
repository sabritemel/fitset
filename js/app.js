/**
 * FitSet — uygulama kabuğu ve yönlendirme.
 *
 * İki ekran: LİSTE ("bugün ne var, nerede kaldım") ve ODAK ("şu an ne yapıyorum").
 * Ağır mantığın tamamı modüllerde (store / schedule / session / anim / timer);
 * burası yalnız durum tutar, çizer ve olayları bağlar.
 */
import * as E from './anim/engine.js';
import * as C from './schedule.js';
import * as N from './session.js';
import * as S from './store.js';
import * as UI from './ui.js';
import { Countdown, mmss, primeAudio } from './timer.js';

const $ = id => document.getElementById(id);
const listEl = $('list-screen'), focusEl = $('focus-screen');

/* ── Durum ─────────────────────────────────────────────────────────────── */
const ctx = {
  session: null, dayIndex: 0, idx: 0,
  lastPerf: {}, settings: S.DEFAULT_SETTINGS, status: null,
  draft: {},                 // o an ekranda duran, henüz kaydedilmemiş değerler
  view: 'list',
};
let bootDay = C.dayNumber(new Date());
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const curEx = () => N.exercisesFor(ctx.dayIndex)[ctx.idx];

/* ── Bildirim ──────────────────────────────────────────────────────────── */
let toastTimer;
function toast(msg, { action, label, warn, sticky } = {}) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const t = document.createElement('div');
  t.className = 'toast' + (warn ? ' warn' : '');
  // Mesaj METİN olarak basılır: içe aktarım hatasında JSON.parse'ın mesajı
  // bozuk dosyadan parça taşır; innerHTML olsaydı düşmanca bir yedek dosyası
  // burada kod çalıştırırdı.
  const span = document.createElement('span');
  span.textContent = msg;
  t.append(span);
  if (action) {
    const b = document.createElement('button');
    b.textContent = label || 'Geri al';
    b.onclick = () => { t.remove(); action(); };
    t.append(b);
  }
  document.body.append(t);
  if (!sticky) toastTimer = setTimeout(() => t.remove(), action ? 7000 : 3200);
}

/* ── Sayaçlar ──────────────────────────────────────────────────────────── */

/** Dinlenme — ekranın altına yapışan şerit, akışı kesmez */
const rest = new Countdown({
  onTick: k => { const e = $('rest-time'); if (e) e.textContent = mmss(k); },
  onDone: gecikme => {
    restBar(false);
    toast(gecikme > 2
      ? `Dinlenme ${Math.round(gecikme)} sn önce bitti.`   // dürüst: kaçırdıysa söyler
      : 'Dinlenme bitti — sıradaki set.');
  },
});

/** Set süresi — izometrik hareketler (Plank) */
const hold = new Countdown({
  onTick: k => { const e = $('clock-time'); if (e) e.textContent = mmss(k); },
  onDone: async () => {
    $('clock')?.classList.remove('run');
    const ex = curEx();
    await kaydet(ex, { type: 'time', seconds: ctx.draft.seconds ?? ex.target.seconds, warmup: !!ctx.draft.warmup });
    toast('Süre doldu — set kaydedildi.');
  },
});

function restBar(göster) {
  document.querySelector('.rest')?.remove();
  // Şerit sabit konumlu: altındaki metni örtmesin diye gövdeye pay eklenir
  document.body.classList.toggle('resting', göster);
  if (!göster) return;
  const d = document.createElement('div');
  d.className = 'rest';
  d.innerHTML = `<span class="t" id="rest-time">${mmss(rest.remaining)}</span>
    <span class="l">dinlenme</span>
    <button data-act="rest-plus">+30 sn</button>
    <button data-act="rest-skip">Geç</button>`;
  document.body.append(d);
}

/* ── Çizim ─────────────────────────────────────────────────────────────── */
function render() {
  if (ctx.view === 'list') {
    listEl.innerHTML = UI.listHTML(ctx);
    listEl.classList.add('on'); focusEl.classList.remove('on');
  } else {
    focusEl.innerHTML = UI.focusHTML(ctx);
    focusEl.classList.add('on'); listEl.classList.remove('on');
    const ex = curEx();
    if (!ex.hold) { draw(ex, 0); if (!reduced) play(ex); }
    if (hold.running) $('clock')?.classList.add('run');
  }
  if (rest.running) restBar(true);
}

/* ── Animasyon ─────────────────────────────────────────────────────────── */
let raf = 0;
function draw(ex, t) {
  const g = $('fig')?.querySelector('.art');
  if (!g) return;
  const s = E.skeleton(E.poseAt(ex.a, ex.b, t), ex.view);
  // ghostOf/trailOf ÖNBELLEKLİ: ikisi de t'den bağımsız, kare başına yeniden
  // hesaplanmaları saf israftı (bkz. engine.js önbellek katmanı).
  g.innerHTML = (ex.eq ? ex.eq(s) : '') + (t > 0.03 ? E.ghostOf(ex) : '') + E.trailOf(ex) + E.figure(s, ex);
  const ph = $('phase'); if (ph) ph.textContent = t < 0.03 ? 'başlangıç' : t > 0.97 ? 'bitiş' : 'geçiş';
  const sc = $('scrub'); if (sc && +sc.value !== Math.round(t * 100)) sc.value = Math.round(t * 100);
}
function play(ex) {
  stopAnim();
  const t0 = performance.now();
  const adım = now => {
    const e = (now - t0) / 1500, t = (1 - Math.cos(e * Math.PI)) / 2;
    draw(ex, t);
    if (e < 6) raf = requestAnimationFrame(adım); else { raf = 0; draw(ex, 0); }
  };
  raf = requestAnimationFrame(adım);
}
const stopAnim = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

/* ── Kayıt ─────────────────────────────────────────────────────────────── */
function draftFor(ex) {
  const lp = ctx.lastPerf[ex.id];
  const ö = N.suggestSet(ex, ctx.session, lp);
  return { ...ö, warmup: false };
}

async function kaydet(ex, veri) {
  N.recordSet(ctx.session, ex.id, veri);
  await N.persist(ctx.session);
  ctx.draft = draftFor(ex);
  render();
  if (navigator.vibrate) navigator.vibrate(15);
  // Dinlenme kendiliğinden başlar — seansta ~27 kez elle başlatmak angarya
  if (ctx.settings.restSeconds > 0) { await rest.start(ctx.settings.restSeconds); restBar(true); }
}

async function kaydetTıklandı() {
  const ex = curEx();
  const ısınma = $('warm')?.checked ?? false;
  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? ex.target.seconds;
    hold.stop();
    $('clock')?.classList.remove('run');
    return kaydet(ex, { type: 'time', seconds: sn, warmup: ısınma });
  }
  if (ex.setType === 'cardio') {
    const dk = +($('f-minutes')?.value || 0);
    if (!dk) return toast('Süre gir.', { warn: true });
    return kaydet(ex, { type: 'cardio', minutes: dk, warmup: false });
  }
  const kg = $('f-weight')?.value.trim(), tek = +($('f-reps')?.value || 0);
  if (kg === '' || kg == null) return toast('Ağırlığı gir.', { warn: true });
  if (!tek) return toast('Tekrar sayısını gir.', { warn: true });
  return kaydet(ex, { type: 'weight_reps', weight: +kg, reps: tek, warmup: ısınma });
}

/* ── Olaylar ───────────────────────────────────────────────────────────── */
document.addEventListener('click', async e => {
  primeAudio();                                  // ses bağlamı ilk dokunuşta açılır
  const t = e.target;

  const go = t.closest('[data-go]');
  if (go) { git(+go.dataset.go); return; }

  const st = t.closest('[data-step]');
  if (st) {
    const [field, d] = st.dataset.step.split(':');
    const inp = $('f-' + field);
    inp.value = Math.max(0, Math.round(((+inp.value || 0) + +d) * 100) / 100);
    ctx.draft[field] = +inp.value;
    return;
  }

  const a = t.closest('[data-act]')?.dataset.act;
  if (!a) return;
  const ex = ctx.view === 'focus' ? curEx() : null;

  switch (a) {
    case 'to-list': stopAnim(); ctx.view = 'list'; render(); scrollTo(0, 0); break;
    case 'prev': git(ctx.idx - 1); break;
    case 'next': git(ctx.idx + 1); break;
    case 'save': await kaydetTıklandı(); break;

    case 'undo': {
      const geri = N.undoLastSet(ctx.session, ex.id);
      if (!geri) break;
      await N.persist(ctx.session);
      ctx.draft = draftFor(ex); render();
      toast('Set geri alındı.', {
        label: 'Geri getir',
        action: async () => { N.recordSet(ctx.session, ex.id, geri); await N.persist(ctx.session); ctx.draft = draftFor(ex); render(); },
      });
      break;
    }

    case 'clock-start':
      if (hold.running) { hold.stop(); $('clock').classList.remove('run'); $('clock-time').textContent = mmss(ctx.draft.seconds ?? ex.target.seconds); }
      else { await hold.start(ctx.draft.seconds ?? ex.target.seconds); $('clock').classList.add('run'); }
      break;
    case 'clock-plus': case 'clock-minus': {
      const d = a === 'clock-plus' ? 15 : -15;
      if (hold.running) hold.extend(d);
      else { ctx.draft.seconds = Math.max(5, (ctx.draft.seconds ?? ex.target.seconds) + d); $('clock-time').textContent = mmss(ctx.draft.seconds); }
      break;
    }

    case 'rest': await rest.start(ctx.settings.restSeconds); restBar(true); break;
    case 'rest-plus': rest.extend(30); break;
    case 'rest-skip': rest.stop(); restBar(false); break;

    case 'finish': await bitir(); break;
    case 'backup': await yedekAl(); break;
    case 'import': $('file').click(); break;
    case 'reset-day': sıfırla(); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'scrub') { stopAnim(); draw(curEx(), +t.value / 100); return; }
  if (t.id === 'warm') { ctx.draft.warmup = t.checked; return; }
  if (t.id?.startsWith('f-')) ctx.draft[t.id.slice(2)] = t.value === '' ? null : +t.value;
});

function git(i) {
  const exs = N.exercisesFor(ctx.dayIndex);
  if (i < 0 || i >= exs.length) return;
  stopAnim(); hold.stop();
  ctx.idx = i; ctx.view = 'focus'; ctx.draft = draftFor(exs[i]);
  render(); scrollTo(0, 0);
}

/* ── Seans işlemleri ───────────────────────────────────────────────────── */
async function bitir() {
  const bitti = await N.finish(ctx.session);
  if (!bitti) return toast('Hiç set girilmemiş — seans kaydedilmedi.', { warn: true });
  const o = await N.summary(bitti);
  const satır = [`${o.sets} set`,
    o.kg ? `${o.kg.toLocaleString('tr-TR')} ${ctx.settings.unit}` : null,
    o.seconds ? `${o.seconds} sn plank` : null,
    o.minutesElapsed ? `${o.minutesElapsed} dk` : null].filter(Boolean).join(' · ');

  const say = (await S.doneSessions()).length;
  toast(`Seans kaydedildi. ${satır}`, { sticky: true, label: 'Tamam', action: () => {} });
  if (say % ctx.settings.backupNagEvery === 0)
    setTimeout(() => toast('Veri yalnız bu telefonda. Yedek almanın tam zamanı.',
      { label: 'Yedek al', action: yedekAl, sticky: true }), 900);
  await yükle();
}

function sıfırla() {
  if (!N.hasAnySet(ctx.session)) return toast('Zaten boş.');
  const yedek = structuredClone(ctx.session);
  ctx.session.entries = [];
  N.abandon(yedek).then(() => render());
  toast('Bugünün kayıtları silindi.', {
    label: 'Geri getir',
    action: async () => { ctx.session = yedek; await N.persist(ctx.session); render(); },
  });
}

async function yedekAl() {
  const { blob, filename } = await S.exportBlob();
  const dosya = new File([blob], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [dosya] })) {
    try { await navigator.share({ files: [dosya], title: 'FitSet yedeği' }); return; } catch { /* iptal */ }
  }
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`${filename} indirildi.`);
}

$('file').addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  e.target.value = '';
  try {
    const s = await S.importData(await f.text());
    toast(`Geri yüklendi: ${s.eklendi} yeni, ${s.güncellendi} güncel, ${s.atlandı} atlandı.`);
    await yükle();
  } catch (err) { toast(err.message, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); }
});

/* ── Açılış ────────────────────────────────────────────────────────────── */
async function yükle() {
  const r = await N.startOrResume();
  ctx.session = r.session; ctx.dayIndex = r.session.dayIndex;
  ctx.status = C.todayStatus(ctx.settings.trainingDays);
  ctx.lastPerf = {};
  for (const ex of N.exercisesFor(ctx.dayIndex))
    ctx.lastPerf[ex.id] = await S.lastPerformance(ex.id, ctx.session.id);
  ctx.view = 'list'; ctx.idx = 0;
  render();
  return r;
}

(async () => {
  ctx.settings = await S.getSettings();
  S.requestPersistence().catch(() => {});
  const r = await yükle();
  if (r.resumed) toast('Yarım kalan seansına devam ediyorsun.');
})();

/**
 * Gece yarısı bayatlaması: PWA arka planda gün değiştirirse başlıktaki tarih ve
 * "bugün antrenman günü mü" bilgisi eskir. Ayrıca arka planda rAF durduğu için
 * sayaçların bitişi burada işlenir.
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  rest.resume(); hold.resume();
  const bugün = C.dayNumber(new Date());
  if (bugün !== bootDay) { bootDay = bugün; ctx.status = C.todayStatus(ctx.settings.trainingDays); render(); }
});

/* Service worker — güncelleme kullanıcının kararı, antrenman ortasında değil */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('sw.js').catch(() => null);
    if (!reg) return;
    reg.addEventListener('updatefound', () => {
      const yeni = reg.installing;
      yeni?.addEventListener('statechange', () => {
        if (yeni.state === 'installed' && navigator.serviceWorker.controller)
          toast('Yeni sürüm hazır.', { sticky: true, label: 'Yenile', action: () => yeni.postMessage('SKIP_WAITING') });
      });
    });
    let yenilendi = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!yenilendi) { yenilendi = true; location.reload(); }
    });
  });
}

addEventListener('error', e => toast('Bir aksaklık oldu: ' + (e.message || 'bilinmeyen'), { warn: true }));
