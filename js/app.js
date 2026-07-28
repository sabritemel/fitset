/**
 * FitSet — uygulama kabuğu.
 * Tüm ağır mantık modüllerde (store / schedule / session / anim). Burası
 * yalnızca DOM'a bağlar: çiz, dinle, kaydet.
 */
import { EX } from './data/exercises.js';
import * as E from './anim/engine.js';
import * as C from './schedule.js';
import * as N from './session.js';
import * as S from './store.js';

const $ = id => document.getElementById(id);
const el = { today: $('today'), upnext: $('upnext'), list: $('list'), finisher: $('finisher'),
             pnum: $('pnum'), ptxt: $('ptxt'), pbar: $('pbar'), foot: $('foot'),
             finish: $('finish'), backup: $('backup'), import: $('import'), file: $('file') };

let session = null;          // aktif seans
let dayIndex = 0;
let lastPerf = {};           // exerciseId → "geçen sefer" kaydı
let settings = S.DEFAULT_SETTINGS;
let bootDay = C.dayNumber(new Date());   // gece yarısı tazelemesi için

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Bildirim şeridi ───────────────────────────────────────────────────── */
/**
 * ⚠️ Mesaj METİN olarak basılır, innerHTML ile DEĞİL.
 * Gerekçe teorik değil: içe aktarım hatasında `JSON.parse`'ın mesajı bozuk
 * dosyadan bir parça taşır ("Unexpected token '<', \"<img src=x onerror=...\"").
 * innerHTML kullanılsaydı düşmanca bir yedek dosyası burada kod çalıştırırdı.
 * (Sayfanın geri kalanındaki innerHTML'ler yalnız exercises.js'ten ve
 *  kullanıcının kendi sayılarından beslenir — dış girdi oraya ulaşmaz.)
 */
let toastTimer;
function toast(msg, { action, label, warn, sticky } = {}) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const t = document.createElement('div');
  t.className = 'toast' + (warn ? ' warn' : '');
  const span = document.createElement('span');
  span.style.flex = '1';
  span.textContent = msg;
  t.append(span);
  if (action) {
    const b = document.createElement('button');
    b.textContent = label || 'Geri al';
    b.onclick = () => { t.remove(); action(); };
    t.append(b);
  }
  document.body.append(t);
  if (!sticky) toastTimer = setTimeout(() => t.remove(), action ? 7000 : 3500);
}

/* ── Üst bilgi ─────────────────────────────────────────────────────────── */
function renderBanner() {
  const st = C.todayStatus(settings.trainingDays);
  const ad = N.DAY_NAMES[dayIndex];
  const devam = session && N.hasAnySet(session);

  el.today.innerHTML = st.isTrainingDay
    ? `<span class="lbl">Bugün · ${st.label}</span><span class="big">${ad}</span>`
      + (devam ? `<span class="rest">Yarım kalan seansa devam ediyorsun.</span>` : '')
    : `<span class="lbl">Bugün · ${st.label}</span><span class="big">Dinlenme günü</span>`
      + `<span class="rest">Sıradaki antrenman ${st.next ? C.fmtDate(st.next) : '—'}: ${ad}`
      + `<br>İstersen bugün de yapabilirsin — kayıt her zaman açık.</span>`;

  el.upnext.textContent = 'Sonraki günler: ' + st.upcoming.map(C.fmtShort).join('  ·  ');
}

/* ── "Geçen sefer" satırı ──────────────────────────────────────────────── */
function lastTimeText(ex) {
  const lp = lastPerf[ex.id];
  if (!lp) return 'Bu egzersizin ilk kaydı.';
  const ne = C.relativeLabel(new Date(lp.at));
  const özet = lp.sets.map(s =>
    s.type === 'time' ? `${s.seconds} sn`
    : s.type === 'cardio' ? `${s.minutes} dk`
    : `${s.weight ?? '—'}${settings.unit}×${s.reps}`).join(' · ');
  return `Geçen sefer (${ne}): <b>${özet}</b>`;
}

/* ── Kayıt bloğu ───────────────────────────────────────────────────────── */
function logHTML(ex) {
  const { sets } = N.exerciseProgress(session, ex);
  const öneri = N.suggestSet(ex, session, lastPerf[ex.id]);
  const birim = settings.unit;

  const kayıtlı = sets.map((s, i) => {
    const v = s.type === 'time' ? `${s.seconds} sn`
      : s.type === 'cardio' ? `${s.minutes} dk`
      : `${s.weight ?? '—'} ${birim} × ${s.reps}`;
    return `<div class="setitem${s.warmup ? ' warm' : ''}">
        <span class="k">${s.warmup ? 'ısınma' : `${sets.slice(0, i + 1).filter(x => !x.warmup).length}. set`}</span>
        <span class="v">${v}</span>
        ${i === sets.length - 1 ? `<button class="undo" data-undo="${ex.id}">geri al</button>` : ''}
      </div>`;
  }).join('');

  // Egzersiz tipine göre giriş alanları
  let alanlar;
  if (ex.setType === 'time') {
    alanlar = step(ex.id, 'seconds', öneri.seconds, 5, 'Süre (saniye)');
  } else if (ex.setType === 'cardio') {
    alanlar = step(ex.id, 'minutes', öneri.minutes, 5, 'Süre (dakika)');
  } else {
    const ağırlıkEtiketi = ex.equipment === 'dumbbell' ? `Ağırlık — tek dambıl (${birim})`
      : ex.equipment === 'barbell' ? `Ağırlık — bar dahil (${birim})`
      : `Ağırlık (${birim})`;
    alanlar = step(ex.id, 'weight', öneri.weight ?? '', 2.5, ağırlıkEtiketi)
            + step(ex.id, 'reps', öneri.reps, 1, 'Tekrar');
  }

  return `<div class="log">
      <p class="lasttime">${lastTimeText(ex)}</p>
      <div class="setlist">${kayıtlı || ''}</div>
      <div class="entry">
        ${alanlar}
        <button class="add" data-add="${ex.id}">Seti kaydet</button>
      </div>
      <label class="warmtog"><input type="checkbox" data-warm="${ex.id}"> Bu bir ısınma seti (hacme sayılmaz)</label>
    </div>`;
}

/**
 * Büyük +/− adımlayıcı — 52px dokunma hedefi, terli/eldivenli parmak için.
 * Birim etiketi kutunun İÇİNDE değil ÜSTÜNDE: içeride olduğunda iki alan yan
 * yana gelince etiket tüm genişliği yiyor ve sayı alanı 4px'e düşüyordu.
 * Etiket üstte olunca ayrıca ne girileceği belirsizlikten çıkıyor
 * ("Ağırlık — bar dahil" / "tek dambıl" ayrımı veriyi kalıcı bozan bir belirsizlikti).
 */
const step = (id, field, val, delta, label) => `
  <div class="field">
    <span class="flab">${label}</span>
    <div class="stepper">
      <button type="button" data-step="${id}:${field}:${-delta}" aria-label="${label} azalt">−</button>
      <input type="number" inputmode="decimal" step="${delta}" min="0" placeholder="—"
             id="f-${id}-${field}" value="${val}" aria-label="${label}">
      <button type="button" data-step="${id}:${field}:${delta}" aria-label="${label} artır">+</button>
    </div>
  </div>`;

/* ── Egzersiz listesi ──────────────────────────────────────────────────── */
function renderList() {
  const gün = N.exercisesFor(dayIndex);
  el.list.innerHTML = gün.map((ex, i) => {
    const p = N.exerciseProgress(session, ex);
    return `<div class="card${p.tamam ? ' done' : ''}" id="c-${ex.id}">
      <button class="row" data-open="${ex.id}" aria-expanded="false">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="names"><span class="en" lang="en">${ex.en}</span><span class="tr">${ex.tr}</span></span>
        <span class="reps">${p.calisma}/${ex.sets}</span><span class="chev"></span>
      </button>
      <div class="panel">
        <div class="stage">
          <span class="phase" id="ph-${ex.id}">başlangıç</span>
          <span class="viewlbl">${ex.vl || (ex.view === 'front' ? 'önden görünüm' : 'yandan görünüm')}</span>
          <svg viewBox="0 0 260 200" id="sv-${ex.id}" aria-hidden="true">
            <g class="art" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></g>
          </svg>
          <div class="ctrl">
            <button class="playbtn" data-play="${ex.id}">▶ oynat</button>
            <input class="scrub" type="range" min="0" max="100" value="0"
                   id="sc-${ex.id}" data-scrub="${ex.id}" aria-label="Hareketi elle ilerlet">
          </div>
        </div>
        <p class="mus"><b>çalışan kaslar</b>${ex.mus}</p>
        <ol class="steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        <div class="tip"><b>dikkat</b>${ex.tip}</div>
        ${logHTML(ex)}
      </div>
    </div>`;
  }).join('');

  gün.forEach(ex => draw(ex, 0));
  const f = N.finisherFor(dayIndex);
  el.finisher.innerHTML = `<h3>${f.h}</h3><p>${f.p}</p>`;
  renderProgress();
}

function renderProgress() {
  const p = N.progress(session, dayIndex);
  el.pnum.textContent = `${p.done} / ${p.total}`;
  el.pbar.style.transform = `scaleX(${p.done / p.total || 0})`;
  el.ptxt.textContent = p.done >= p.total ? 'gün tamamlandı — eline sağlık' : 'set tamamlandı';
  el.finish.disabled = !N.hasAnySet(session);
}

/** Yalnız bir kartın kayıt bloğunu tazeler — tüm listeyi yeniden çizmez */
function refreshCard(ex) {
  const card = $('c-' + ex.id);
  if (!card) return;
  card.querySelector('.log').outerHTML = logHTML(ex);
  const p = N.exerciseProgress(session, ex);
  card.classList.toggle('done', p.tamam);
  card.querySelector('.reps').textContent = `${p.calisma}/${ex.sets}`;
  renderProgress();
}

/* ── Animasyon ─────────────────────────────────────────────────────────── */
const anims = new Map();
function draw(ex, t) {
  const g = $('sv-' + ex.id)?.querySelector('.art');
  if (!g) return;
  try {
    const s = E.skeleton(E.poseAt(ex.a, ex.b, t), ex.view);
    // ghostOf/trailOf ÖNBELLEKLİ: ikisi de t'den bağımsız, kare başına
    // yeniden hesaplanmaları saf israftı (bkz. engine.js önbellek katmanı).
    g.innerHTML = (ex.eq ? ex.eq(s) : '')
      + (t > 0.03 ? E.ghostOf(ex) : '')
      + E.trailOf(ex)
      + E.figure(s, ex);
  } catch { g.innerHTML = ''; }
  const ph = $('ph-' + ex.id);
  if (ph) ph.textContent = t < 0.03 ? 'başlangıç' : t > 0.97 ? 'bitiş' : 'geçiş';
  const sc = $('sc-' + ex.id);
  if (sc && +sc.value !== Math.round(t * 100)) sc.value = Math.round(t * 100);
}

function play(ex) {
  if (anims.has(ex.id)) { cancelAnimationFrame(anims.get(ex.id)); anims.delete(ex.id); draw(ex, 0); return; }
  const t0 = performance.now();
  const adım = now => {
    const e = (now - t0) / 1500, t = (1 - Math.cos(e * Math.PI)) / 2;
    draw(ex, t);
    if (e < 6) anims.set(ex.id, requestAnimationFrame(adım));    // 3 tekrar sonra durur
    else { anims.delete(ex.id); draw(ex, 0); }
  };
  anims.set(ex.id, requestAnimationFrame(adım));
}
const stop = id => { if (anims.has(id)) { cancelAnimationFrame(anims.get(id)); anims.delete(id); } };

/* ── Etkileşim ─────────────────────────────────────────────────────────── */
const num = (id, field) => {
  const i = $(`f-${id}-${field}`);
  const v = i?.value.trim();
  return v === '' || v == null ? null : Number(v);
};

document.addEventListener('click', async e => {
  const t = e.target;

  const open = t.closest('[data-open]');
  if (open) {
    const ex = N.byId[open.dataset.open];
    const card = $('c-' + ex.id), aç = !card.classList.contains('open');
    // Akordiyon: aynı anda yalnız BİR hareket açık kalır. Salonda ekranda
    // sürüklenip duran yarı açık kartlar aramayı zorlaştırıyor.
    for (const c of document.querySelectorAll('.card.open')) {
      c.classList.remove('open');
      c.querySelector('.row').setAttribute('aria-expanded', 'false');
      stop(c.id.slice(2));
    }
    card.classList.toggle('open', aç);
    open.setAttribute('aria-expanded', aç);
    if (aç) {
      draw(ex, 0);
      if (!reduced) play(ex);
      card.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }
    return;
  }

  const p = t.closest('[data-play]'); if (p) { play(N.byId[p.dataset.play]); return; }

  const st = t.closest('[data-step]');
  if (st) {
    const [id, field, d] = st.dataset.step.split(':');
    const inp = $(`f-${id}-${field}`);
    const next = Math.max(0, Math.round(((+inp.value || 0) + +d) * 100) / 100);
    inp.value = next;
    return;
  }

  const add = t.closest('[data-add]');
  if (add) { await kaydet(N.byId[add.dataset.add]); return; }

  const un = t.closest('[data-undo]');
  if (un) {
    const ex = N.byId[un.dataset.undo];
    const geri = N.undoLastSet(session, ex.id);
    if (!geri) return;
    await N.persist(session); refreshCard(ex);
    toast('Set geri alındı.', {
      label: 'Geri getir',
      action: async () => { N.recordSet(session, ex.id, geri); await N.persist(session); refreshCard(ex); },
    });
    return;
  }

  if (t.id === 'finish') { await bitir(); return; }
  if (t.id === 'backup') { await yedekAl(); return; }
  if (t.id === 'import') { el.file.click(); return; }
});

/** Kaydırma çubuğu — elle ilerletme */
document.addEventListener('input', e => {
  const sc = e.target.closest('[data-scrub]');
  if (!sc) return;
  const ex = N.byId[sc.dataset.scrub];
  stop(ex.id);
  draw(ex, +sc.value / 100);
});

async function kaydet(ex) {
  const ısınma = document.querySelector(`[data-warm="${ex.id}"]`)?.checked ?? false;
  let veri;
  if (ex.setType === 'time') {
    const sn = num(ex.id, 'seconds');
    if (!sn) return toast('Süre gir.', { warn: true });
    veri = { type: 'time', seconds: sn, warmup: ısınma };
  } else if (ex.setType === 'cardio') {
    const dk = num(ex.id, 'minutes');
    if (!dk) return toast('Süre gir.', { warn: true });
    veri = { type: 'cardio', minutes: dk, warmup: false };
  } else {
    const kg = num(ex.id, 'weight'), tek = num(ex.id, 'reps');
    if (kg == null) return toast('Ağırlığı gir.', { warn: true });
    if (!tek) return toast('Tekrar sayısını gir.', { warn: true });
    veri = { type: 'weight_reps', weight: kg, reps: tek, warmup: ısınma };
  }
  N.recordSet(session, ex.id, veri);
  await N.persist(session);
  refreshCard(ex);
  if (navigator.vibrate) navigator.vibrate(15);
}

async function bitir() {
  const özetVerisi = { ...session };
  const bitti = await N.finish(session);
  if (!bitti) return toast('Hiç set girilmemiş — seans kaydedilmedi.', { warn: true });

  const o = await N.summary(bitti);
  const satır = [
    `${o.sets} set`,
    o.kg ? `${o.kg.toLocaleString('tr-TR')} kg toplam hacim` : null,
    o.seconds ? `${o.seconds} sn plank` : null,
    o.minutesElapsed ? `${o.minutesElapsed} dk` : null,
  ].filter(Boolean).join(' · ');

  const say = (await S.doneSessions()).length;
  toast(`Seans kaydedildi. ${satır}`, { sticky: true, label: 'Tamam', action: () => {} });

  if (say % settings.backupNagEvery === 0)
    setTimeout(() => toast('Veri yalnız bu telefonda. Yedek almanın tam zamanı.',
      { label: 'Yedek al', action: yedekAl, sticky: true }), 800);

  await yenidenBaşlat();
}

async function yedekAl() {
  const { blob, filename } = await S.exportBlob();
  const dosya = new File([blob], filename, { type: 'application/json' });
  // Paylaşım varsa Drive/WhatsApp'a tek dokunuşla gider; yoksa indirilir.
  if (navigator.canShare?.({ files: [dosya] })) {
    try { await navigator.share({ files: [dosya], title: 'FitSet yedeği' }); return; } catch { /* iptal */ }
  }
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`${filename} indirildi.`);
}

el.file.addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  e.target.value = '';
  try {
    const stat = await S.importData(await f.text());
    toast(`Geri yüklendi: ${stat.eklendi} yeni, ${stat.güncellendi} güncel, ${stat.atlandı} atlandı.`);
    await yenidenBaşlat();
  } catch (err) { toast(err.message, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); }
});

/* ── Açılış ────────────────────────────────────────────────────────────── */
async function yenidenBaşlat() {
  const r = await N.startOrResume();
  session = r.session; dayIndex = session.dayIndex;
  lastPerf = {};
  for (const ex of N.exercisesFor(dayIndex))
    lastPerf[ex.id] = await S.lastPerformance(ex.id, session.id);
  renderBanner(); renderList();
  return r;
}

async function boot() {
  settings = await S.getSettings();
  if (settings.theme !== 'auto') document.documentElement.dataset.theme = settings.theme;
  S.requestPersistence().catch(() => {});

  const r = await yenidenBaşlat();
  el.foot.textContent = 'Veri yalnız bu telefonda saklanır — sunucuya hiçbir şey gönderilmez. '
    + 'Bu yüzden düzenli yedek al. Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.';
  if (r.resumed) toast('Yarım kalan seansına devam ediyorsun.');
}

/**
 * Gece yarısı bayatlaması: PWA arka planda gün değiştirirse başlıktaki tarih
 * ve "bugün antrenman günü mü" bilgisi eskir. Geri dönüldüğünde kontrol edilir.
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const bugün = C.dayNumber(new Date());
  if (bugün !== bootDay) { bootDay = bugün; renderBanner(); }
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
          toast('Yeni sürüm hazır.', {
            sticky: true, label: 'Yenile',
            action: () => { yeni.postMessage('SKIP_WAITING'); },
          });
      });
    });
    let yenilendi = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!yenilendi) { yenilendi = true; location.reload(); }
    });
  });
}

addEventListener('error', e => toast('Bir aksaklık oldu: ' + (e.message || 'bilinmeyen'), { warn: true }));
boot();
