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
export function lastTime(ex, lastPerf, birim, bugünVar = false) {
  const lp = lastPerf[ex.id];
  // Bugün zaten set girilmişken "ilk kaydı" demek kafa karıştırıyordu —
  // hemen altında dolu setler duruyor. Ayrım: GEÇEN SEFER ≠ bugün.
  if (!lp) return bugünVar ? 'Bu hareketi ilk kez yapıyorsun.' : 'Bu egzersizin ilk kaydı.';
  return `Geçen sefer (${C.relativeLabel(new Date(lp.at))}) `
    + `<b>${lp.sets.map(s => setLabel(s, birim)).join(' · ')}</b>`;
}

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

export function listHTML(ctx) {
  const { session, dayIndex, settings, status } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex, settings);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const [gün, kaslar] = N.DAY_NAMES[dayIndex].split(' — ');

  const rail = exs.map(ex => {
    const q = N.exerciseProgress(session, ex, settings);
    return `<i class="${q.tamam ? 'd' : q.calisma ? 'c' : ''}"></i>`;
  }).join('');

  const items = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex, settings);
    const pips = Array.from({ length: q.hedef }, (_, k) =>
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
  // svg preserveAspectRatio ile kutuya sığar; kutu ne kadar kalırsa figür o kadar
  // büyür. Yükseklik içerikten değil EKRANDAN geliyor (bkz. .viz { flex:1 }).
  return `<div class="viz">
    <span class="phase lbl" id="phase">başlangıç</span>
    <svg viewBox="0 0 260 200" id="fig" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g class="art" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></g>
    </svg>
    <input class="scrub" type="range" min="0" max="100" value="0" id="scrub"
           aria-label="Hareketi elle ilerlet">
  </div>`;
}

/**
 * Anlatım paneli — aşağıdan kayarak açılır, okunup kapatılır.
 * Adımlar ve "dikkat" notu odak ekranından buraya taşındı: salonda ekranın
 * kaymaması, her şeyin tek bakışta görünmesi daha değerli. Bu metinler
 * hareketi öğrenirken lazım, her set arasında değil.
 */
function sheetHTML(ex, settings) {
  const t = N.effective(ex, settings);
  // Hedef alanları egzersizin tipine göre — Plank'a "tekrar" sorulmaz
  const alanlar = [
    ['sets', t.sets, 1, 'set sayısı'],
    ...(ex.setType === 'time' ? [['seconds', t.seconds, 5, 'süre (sn)']]
      : ex.setType === 'cardio' ? [['minutes', t.minutes, 5, 'süre (dk)']]
        : [['reps', t.reps, 1, 'tekrar'], ['weight', t.weight, 2.5, `ağırlık (${settings.unit})`]]),
  ];

  return `<div class="sheet-bg" data-act="sheet-close" hidden></div>
    <section class="sheet" id="sheet" aria-hidden="true" aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h3 lang="en">${ex.en}</h3>
        <p class="sheet-sub">${ex.tr}</p>

        <div class="goal">
          <div class="goal-hd">
            <span class="lbl">hedef</span>
            ${t.edited ? '<button class="reset-goal" data-act="goal-reset">programa dön</button>' : ''}
          </div>
          <div class="goal-grid">
            ${alanlar.map(([f, v, d, l]) => `
              <div class="gf">
                <span class="lbl">${l}</span>
                <div class="gbox">
                  <button data-gstep="${f}:${-d}" aria-label="${l} azalt">−</button>
                  <input class="mono" type="number" inputmode="decimal" step="${d}" min="0"
                         id="g-${f}" value="${v ?? ''}" placeholder="—" aria-label="${l}">
                  <button data-gstep="${f}:${d}" aria-label="${l} artır">+</button>
                </div>
              </div>`).join('')}
          </div>
          <button class="goal-save" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hoca programı değiştirdiğinde burayı güncelle.
            Ağırlık boş bırakılabilir — o zaman kutular geçen seferki değerle dolar.</p>
        </div>

        <p class="mus"><span class="lbl">çalışan kaslar</span>${ex.mus}</p>
        <ol class="steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        <p class="tip"><span class="lbl">dikkat</span>${ex.tip}</p>
      </div>
    </section>`;
}

/**
 * Dinlenme yuvası — gezinme satırının ORTASI.
 * Sayaç ayrı bir bant açmıyor: boşta "Dinlenme 90 sn" yazan yer, çalışırken
 * canlı sayaca dönüşüyor. Ekranda yeni bir şerit belirmiyor, hiçbir şey
 * yer değiştirmiyor — göz aynı noktaya bakmaya devam ediyor.
 */
export const restSlotHTML = (settings, kalan = null) => kalan === null
  ? `<button class="restbtn" data-act="rest">Dinlenme ${settings.restSeconds} sn</button>`
  : `<button class="restbtn run" data-act="rest-skip" aria-label="Dinlenmeyi geç">
       <span class="rt mono" id="rest-time">${mmss(kalan)}</span><span class="rl">geç</span>
     </button>
     <button class="restadd" data-act="rest-plus" aria-label="30 saniye ekle">+30</button>`;

/** Sayı girişi ya da geri sayım — egzersizin tipine göre */
function entryHTML(ex, ctx) {
  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds;
    // Süre ayarı ±5 sn: 15 sn'lik bir hedefte ±15 çok kaba bir adımdı
    // (bir dokunuşta süreyi ikiye katlıyor ya da sıfırlıyordu).
    return `<div class="clock" id="clock">
      <span class="lbl">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5<span>sn</span></button>
        <span class="time" id="clock-time">${mmss(sn)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5<span>sn</span></button>
      </div>
      <button class="main" data-act="clock-start">Başlat</button>
    </div>`;
  }
  if (ex.setType === 'cardio') {
    return `<div class="nums">${num('minutes', ctx.draft.minutes ?? ex.target.minutes, 5, 'dakika')}</div>`;
  }
  // Ağırlığın NE OLDUĞU ayrı bir satırda: etiketin içine sıkıştırıldığında
  // dar sütunda üç satıra bölünüyor ve rakamı eziyordu (ölçüldü).
  const ipucu = ex.equipment === 'dumbbell' ? 'tek dambıl · hacimde ×2'
    : ex.equipment === 'barbell' ? 'bar dahil toplam'
      : ex.equipment === 'machine' ? 'makinede seçili' : '';
  const tekrar = ctx.draft.reps ?? N.effective(ex, ctx.settings).reps;

  /* ÇALIŞMA EKRANINDA TEK GİRİŞ: AĞIRLIK.
     Tekrar sayısı hedeften geliyor ve her sette değişmiyor; her seferinde
     sormak gereksiz dokunuş. Ama hedef 12 iken 10 çıkarsa o seti 12 diye
     kaydetmek veriyi yanlışlar — bu yüzden tekrar GÖRÜNÜR kalıyor ve üstüne
     dokununca YALNIZ BU SET için açılıyor. Kalıcı değişiklik panelden. */
  return `<div class="nums single">
      ${num('weight', ctx.draft.weight, 2.5, ctx.settings.unit)}
    </div>
    <button class="repsline" data-act="reps-edit" aria-expanded="false">
      <span>× <b id="reps-show">${tekrar}</b> tekrar</span>
      <span class="edit">bu sette değiştir</span>
    </button>
    <div class="repsedit" id="repsedit" hidden>${num('reps', tekrar, 1, 'tekrar')}</div>
    <div class="hintrow">
      <span class="hint">${ipucu}</span>
      <label class="warmtog"><input type="checkbox" id="warm" ${ctx.draft.warmup ? 'checked' : ''}>ısınma</label>
    </div>`;
}

/**
 * Tek bir sayı alanı.
 * +/− rakamın ALTINDA değil SAĞINDA, dikey yığın olarak: üstte artır, altta
 * azalt. Alt alta iki geniş düğme için ayrılan satır 58px yiyordu; o alan
 * artık animasyona gidiyor. Dikey dizilim ayrıca yönü kendiliğinden anlatıyor
 * — yukarı = artır, aşağı = azalt.
 * Sarmalamayı ÇAĞIRAN yapar: iç içe .nums yerleşimi bozuyordu.
 */
const num = (field, val, delta, unit) => `
  <div class="f">
    <span class="lbl">${unit}</span>
    <div class="valrow">
      <input class="val mono" type="number" inputmode="decimal" step="${delta}" min="0"
             id="f-${field}" value="${val ?? ''}" placeholder="—" aria-label="${unit}">
      <div class="pm">
        <button data-step="${field}:${delta}" aria-label="${unit} artır">+</button>
        <button data-step="${field}:${-delta}" aria-label="${unit} azalt">−</button>
      </div>
    </div>
  </div>`;

export function focusHTML(ctx) {
  const { session, dayIndex, idx, lastPerf, settings } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const ex = exs[idx];
  const q = N.exerciseProgress(session, ex, settings);

  let no = 0;
  const chips = q.sets.map((s, i) => {
    const son = i === q.sets.length - 1;
    const et = s.warmup ? 'ıs' : `${++no}`;
    return `<span class="${s.warmup ? 'warm' : 'on'}"><i>${et}</i>${setLabel(s, settings.unit)}</span>`
      + (son ? `<button class="undo" data-act="undo">geri al</button>` : '');
  }).join('');

  const sıradaki = q.calisma + 1;
  const hedefEt = N.repsLabel(ex, settings);
  const kaydetEtiketi = ex.setType === 'time' ? 'Süreyi kaydet'
    : q.tamam ? 'Fazladan set kaydet' : `${sıradaki}. seti kaydet`;

  /* Ekran KAYMAZ. Yapı sabit bantlar + esneyen tek bir bölge:
     üst bantlar → görsel (esner, kalan boşluğu yutar) → giriş → kaydet → gezinme.
     Böylece küçük telefonda figür küçülür, büyükte büyür; hiçbirinde taşma olmaz.
     Adımlar ve "dikkat" notu buradan çıkıp kayan panele taşındı. */
  return `
    <div class="rail">${exs.map(e => {
      const p = N.exerciseProgress(session, e, settings);
      return `<i class="${p.tamam ? 'd' : e.id === ex.id ? 'c' : ''}"></i>`;
    }).join('')}</div>
    <div class="top">
      <button class="back" data-act="to-list">‹ Liste</button>
      <span class="lbl">${idx + 1}/${exs.length} · ${q.calisma}/${q.hedef} set</span>
      <button class="how" data-act="sheet-open">Nasıl yapılır?</button>
    </div>
    <div class="head">
      <h2 lang="en">${ex.en}</h2>
      <p class="sub">${ex.tr} · ${N.repsLabel(ex, settings)}</p>
    </div>
    ${vizHTML(ex)}
    <div class="foot-block">
      <p class="prev">${lastTime(ex, lastPerf, settings.unit, q.sets.length > 0)}</p>
      ${q.sets.length ? `<div class="chips">${chips}</div>` : ''}
      ${entryHTML(ex, ctx)}
      ${/* Hedef tamamlanınca düğme İKİYE bölünür: solda fazladan set, sağda
            sıradaki harekete geçiş. Otomatik ilerlemek kontrolü elden alırdı;
            burada karar hâlâ senin ama sıradakine geçmek tek dokunuş. */''}
      ${q.tamam ? `<div class="gorow">
          <button class="go" data-act="save">Fazladan set</button>
          ${idx === exs.length - 1
            ? `<button class="go next" data-act="to-list">Listeye dön<span class="ar">→</span></button>`
            : `<button class="go next" data-act="next">Sonraki hareket<span class="ar">→</span></button>`}
        </div>`
        : `<div class="gorow"><button class="go" data-act="save">${kaydetEtiketi}</button></div>`}
      <div class="nav">
        <button class="side" data-act="prev" ${idx === 0 ? 'disabled' : ''}>‹ Önceki</button>
        <div class="restslot" id="restslot">${restSlotHTML(settings)}</div>
        <button class="side" data-act="next" ${idx === exs.length - 1 ? 'disabled' : ''}>Sonraki ›</button>
      </div>
      <div class="restline"><i id="restline"></i></div>
    </div>
    ${sheetHTML(ex, settings)}`;
}
