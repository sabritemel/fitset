/**
 * EKRAN ÇİZİMİ — saf işaretleme üretimi, olay yok.
 * Olayların tamamı app.js'te tek bir delegasyonla yönetilir; buradaki
 * fonksiyonlar yalnız HTML döndürür, bu yüzden tek tek denenebilirler.
 */
import * as E from './anim/engine.js';
import * as N from './session.js';
import * as C from './schedule.js';
import { mmss } from './timer.js';

/* ── Yardımcılar ───────────────────────────────────────────────────────── */

const setLabel = (s, birim) =>
  s.type === 'time' ? `${s.seconds} sn`
    : s.type === 'cardio' ? `${s.minutes} dk`
      : `${s.weight ?? '—'}${birim}×${s.reps}`;

/** "Geçen sefer (3 gün önce): 40kg×12 · 40kg×10" */
export function lastTime(ex, lastPerf, birim) {
  const lp = lastPerf[ex.id];
  if (!lp) return 'Bu egzersizin ilk kaydı.';
  return `Geçen sefer (${C.relativeLabel(new Date(lp.at))}) `
    + `<b>${lp.sets.map(s => setLabel(s, birim)).join(' · ')}</b>`;
}

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

export function listHTML(ctx) {
  const { session, dayIndex, settings, status } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const [gün, kaslar] = N.DAY_NAMES[dayIndex].split(' — ');

  const rail = exs.map(ex => {
    const q = N.exerciseProgress(session, ex);
    return `<i class="${q.tamam ? 'd' : q.calisma ? 'c' : ''}"></i>`;
  }).join('');

  const items = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex);
    const pips = Array.from({ length: ex.sets }, (_, k) =>
      `<i class="${k < q.calisma ? 'f' : ''}"></i>`).join('');
    return `<button class="item${q.tamam ? ' done' : ''}" data-go="${i}">
      <span class="ix mono">${String(i + 1).padStart(2, '0')}</span>
      <span class="nm"><span class="en" lang="en">${ex.en}</span><span class="tr">${ex.tr}</span></span>
      <span class="pips">${pips}</span>
    </button>`;
  }).join('');

  const f = N.finisherFor(dayIndex);

  return `
    <div class="rail">${rail}</div>
    <header>
      <p class="lbl">${status.label}${status.isTrainingDay ? '' : ' · dinlenme günü'}</p>
      <h1 class="day">${gün}</h1>
      <p class="muscles">${kaslar}</p>
      ${status.isTrainingDay ? '' :
        `<p class="resting">Bugün program günü değil — istersen yine de kaydet.
         Sıradaki antrenman ${status.next ? C.fmtShort(status.next) : '—'}.</p>`}
    </header>
    <div class="sum">
      <div><span class="lbl">Set</span><b>${p.done} / ${p.total}</b></div>
      <div><span class="lbl">Hacim</span><b>${v.kg.toLocaleString('tr-TR')}<i> ${settings.unit}</i></b></div>
      <div><span class="lbl">Süre</span><b>${dk}<i> dk</i></b></div>
    </div>
    <div class="items">${items}</div>
    <div class="finisher"><h3>${f.h}</h3><p>${f.p}</p></div>
    <div class="spacer"></div>
    <div class="foot">
      <p>Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez — bu yüzden düzenli yedek al.
      Ağrı hissettiğin bir harekette dur. Bu uygulama tıbbi tavsiye vermez.</p>
      <button data-act="backup">Yedek al</button> ·
      <button data-act="import">Yedekten geri yükle</button>
    </div>
    <div class="bar">
      <button class="btn" data-act="reset-day">Sıfırla</button>
      <button class="btn primary" data-act="finish" ${N.hasAnySet(session) ? '' : 'disabled'}>Seansı bitir</button>
    </div>`;
}

/* ══ ODAK EKRANI ══════════════════════════════════════════════════════════ */

/** Animasyon sahnesi ya da izometrik hareketler için doğru/yanlış duruşlar */
function vizHTML(ex) {
  if (ex.hold) {
    // Oynatacak hareket yok — ama GÖRSEL ŞART. Öğretici olan tek doğru kare
    // değil, doğru ile yanlış arasındaki fark.
    return `<div class="variants">${ex.variants.map(v => {
      const s = E.skeleton(v.pose, ex.view);
      return `<figure class="${v.ok ? 'ok' : ''}">
        <svg viewBox="0 40 260 155" aria-hidden="true"><g class="art" fill="none" stroke-width="4"
          stroke-linecap="round" stroke-linejoin="round">${ex.eq(s) + E.figure(s, ex)}</g></svg>
        <figcaption><b>${v.ok ? '✓' : '✗'} ${v.label}</b><span>${v.note}</span></figcaption>
      </figure>`;
    }).join('')}</div>`;
  }
  return `<div class="viz">
    <span class="phase lbl" id="phase">başlangıç</span>
    <svg viewBox="0 0 260 200" id="fig" aria-hidden="true">
      <g class="art" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></g>
    </svg>
    <input class="scrub" type="range" min="0" max="100" value="0" id="scrub"
           aria-label="Hareketi elle ilerlet">
  </div>`;
}

/** Sayı girişi ya da geri sayım — egzersizin tipine göre */
function entryHTML(ex, ctx) {
  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? ex.target.seconds;
    return `<div class="clock" id="clock">
      <span class="lbl">Hedef süre</span>
      <span class="time" id="clock-time">${mmss(sn)}</span>
      <div class="row">
        <button data-act="clock-minus">−15 sn</button>
        <button class="main" data-act="clock-start">Başlat</button>
        <button data-act="clock-plus">+15 sn</button>
      </div>
    </div>`;
  }
  if (ex.setType === 'cardio') {
    return `<div class="nums">${num('minutes', ctx.draft.minutes ?? ex.target.minutes, 5, 'dakika')}</div>`;
  }
  // Ağırlığın NE OLDUĞU ayrı bir satırda: etiketin içine sıkıştırıldığında
  // dar sütunda üç satıra bölünüyor ve rakamı eziyordu (ölçüldü).
  const ipucu = ex.equipment === 'dumbbell' ? 'Tek dambılın ağırlığı — hacimde iki kol sayılır'
    : ex.equipment === 'barbell' ? 'Bar dahil toplam ağırlık'
      : ex.equipment === 'machine' ? 'Makinede seçili ağırlık' : '';
  return `<div class="nums">
      ${num('weight', ctx.draft.weight, 2.5, ctx.settings.unit)}
      ${num('reps', ctx.draft.reps, 1, 'tekrar')}
    </div>
    ${ipucu ? `<p class="hint">${ipucu}</p>` : ''}`;
}

/** Tek bir sayı alanı. Sarmalamayı ÇAĞIRAN yapar — iç içe .nums yerleşimi bozuyordu. */
const num = (field, val, delta, unit) => `
  <div class="f">
    <span class="lbl">${unit}</span>
    <input class="val mono" type="number" inputmode="decimal" step="${delta}" min="0"
           id="f-${field}" value="${val ?? ''}" placeholder="—" aria-label="${unit}">
    <div class="pm">
      <button data-step="${field}:${-delta}" aria-label="${unit} azalt">−</button>
      <button data-step="${field}:${delta}" aria-label="${unit} artır">+</button>
    </div>
  </div>`;

export function focusHTML(ctx) {
  const { session, dayIndex, idx, lastPerf, settings } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const ex = exs[idx];
  const q = N.exerciseProgress(session, ex);

  const chips = q.sets.map((s, i) => {
    const son = i === q.sets.length - 1;
    return `<span class="${s.warmup ? 'warm' : 'on'}">${s.warmup ? 'ısınma ' : ''}${setLabel(s, settings.unit)}</span>`
      + (son ? `<button class="undo" data-act="undo">geri al</button>` : '');
  }).join('');

  const sıradaki = q.calisma + 1;
  const kaydetEtiketi = ex.setType === 'time' ? 'Süreyi kaydet'
    : q.tamam ? 'Fazladan set kaydet' : `${sıradaki}. seti kaydet`;

  return `
    <div class="rail">${exs.map(e => {
      const p = N.exerciseProgress(session, e);
      return `<i class="${p.tamam ? 'd' : e.id === ex.id ? 'c' : ''}"></i>`;
    }).join('')}</div>
    <div class="top">
      <button class="back" data-act="to-list">‹ Listeye dön</button>
      <span class="lbl">${idx + 1} / ${exs.length} · ${q.calisma}/${ex.sets} set</span>
    </div>
    <h2 lang="en">${ex.en}</h2>
    <p class="sub">${ex.tr} · ${ex.reps}</p>
    ${vizHTML(ex)}
    <p class="prev">${lastTime(ex, lastPerf, settings.unit)}</p>
    ${q.sets.length ? `<div class="chips">${chips}</div>` : ''}
    ${entryHTML(ex, ctx)}
    ${ex.setType === 'cardio' ? '' :
      `<label class="warmtog"><input type="checkbox" id="warm" ${ctx.draft.warmup ? 'checked' : ''}>
       Bu bir ısınma seti (hacme sayılmaz)</label>`}
    <button class="go" data-act="save">${kaydetEtiketi}</button>
    <ol class="steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <p class="tip"><b class="lbl">dikkat</b>${ex.tip}</p>
    <div class="spacer"></div>
    <div class="nav">
      <button data-act="prev" ${idx === 0 ? 'disabled' : ''}>‹ Önceki</button>
      <button data-act="rest">Dinlenme ${settings.restSeconds} sn</button>
      <button data-act="next" ${idx === exs.length - 1 ? 'disabled' : ''}>Sonraki ›</button>
    </div>`;
}
