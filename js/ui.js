/**
 * EKRAN ÇİZİMİ — saf işaretleme üretimi, olay yok.
 * Olayların tamamı app.js'te tek bir delegasyonla yönetilir; buradaki
 * fonksiyonlar yalnız HTML döndürür, bu yüzden tek tek denenebilirler.
 *
 * Tasarım dili 2. sürüm: tek yazı ailesi (Archivo, eksenlerle hiyerarşi),
 * tek vurgu rengi (yalnız CANLI olana), kart yerine kıl payı çizgi.
 * Ayrıntı: css/style.css başlığı.
 */
import * as E from './anim/engine.js';
import * as N from './session.js';
import * as C from './schedule.js';
import { mmss } from './timer.js';

/* ── Yardımcılar ───────────────────────────────────────────────────────── */

/** Odak ekranında aynı anda duran set rozeti sayısı; gerisi "+N" ardında. */
export const GORUNUR_ROZET = 3;

const setLabel = (s, birim) =>
  s.type === 'time' ? `${s.seconds} sn`
    : s.type === 'cardio' ? `${s.minutes} dk`
      : `${s.weight ?? '—'}×${s.reps}`;

/** "Geçen sefer · 3 gün önce · 35×12 · 35×12" */
export function lastTime(ex, lastPerf, birim, bugünVar = false) {
  const lp = lastPerf[ex.id];
  // Bugün zaten set girilmişken "ilk kaydı" demek kafa karıştırıyordu —
  // hemen üstünde dolu rozetler duruyor. Ayrım: GEÇEN SEFER ≠ bugün.
  if (!lp) return bugünVar ? 'Bu hareketi ilk kez yapıyorsun.' : 'Bu egzersizin ilk kaydı.';
  return `Geçen sefer · ${C.relativeLabel(new Date(lp.at))} · `
    + `<b>${lp.sets.map(s => setLabel(s, birim)).join(' · ')}</b>`;
}

const railHTML = (exs, session, settings, şimdi = -1) =>
  `<div class="rail">${exs.map((e, i) => {
    const p = N.exerciseProgress(session, e, settings);
    return `<i class="${p.tamam ? 'f' : i === şimdi ? 'c' : ''}"></i>`;
  }).join('')}</div>`;

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

export function listHTML(ctx) {
  const { session, dayIndex, settings, status } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex, settings);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const [gün, kaslar] = N.DAY_NAMES[dayIndex].split(' — ');

  const items = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex, settings);
    const pips = Array.from({ length: q.hedef }, (_, k) =>
      `<i class="${k < q.calisma ? 'f' : ''}"></i>`).join('');
    return `<button class="li${q.tamam ? ' done' : ''}" data-go="${i}">
      <span class="ix">${String(i + 1).padStart(2, '0')}</span>
      <span class="nm"><span class="t-h2" lang="en">${ex.en}</span><span class="t-m">${ex.tr}</span></span>
      <span class="pips">${pips}</span>
    </button>`;
  }).join('');

  const f = N.finisherFor(dayIndex);

  /* ISINMA — numarasız İLK satır.
     Numaralar KAYDEDİLEN hareketler için; ısınmaya numara vermek onu programın
     parçası gibi gösterir ve set sayımını yanlışlar. Elmas işareti ve hafif
     vurgu, üstte olduğunu numara vermeden söylüyor. */
  const isinma = `<button class="li warm${session.warmupDone ? ' done' : ''}" data-act="warmup">
    <span class="ix">◆</span>
    <span class="nm"><span class="t-h2">Isınma</span>
      <span class="t-m">${N.warmupFor(dayIndex).length + 1} adım · ${N.WARMUP_SURE[dayIndex]}</span></span>
    <span class="chip">${session.warmupDone ? 'yapıldı' : 'başla'}</span>
  </button>`;

  return `
    ${railHTML(exs, session, settings)}
    <div class="hd">
      <p class="t-l">${status.label}</p>
      <h1 class="day">${gün}</h1>
      <p class="t-b">${kaslar}</p>
      ${status.isTrainingDay ? '' :
        `<p class="resting">Bugün program günü değil — istersen yine de kaydet.
          Sıradaki antrenman ${status.next ? C.fmtShort(status.next) : '—'}.</p>`}
    </div>
    <div class="stat">
      <div><span class="t-l">Set</span><b>${p.done}<i>/${p.total}</i></b></div>
      <div><span class="t-l">Hacim</span><b>${v.kg.toLocaleString('tr-TR')}<i>${settings.unit}</i></b></div>
      <div><span class="t-l">Süre</span><b>${dk}<i>dk</i></b></div>
    </div>
    <div class="lst">${isinma}${items}</div>
    <div class="finisher"><h3>${f.h}</h3><p>${f.p}</p></div>
    <div class="note">
      <p>Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez — bu yüzden düzenli yedek al.
      Ağrı hissettiğin bir harekette dur. Bu uygulama tıbbi tavsiye vermez.</p>
      <button data-act="backup">Yedek al</button> &nbsp;
      <button data-act="import">Geri yükle</button> &nbsp;
      <button data-act="reset-day">Bugünü sıfırla</button>
    </div>
    <div class="grow"></div>
    <div class="foot">
      <button class="b1" data-act="finish" ${N.hasAnySet(session) ? '' : 'disabled'}>Seansı bitir</button>
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
        <svg viewBox="0 40 260 155" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g class="art" fill="none" stroke-width="4" stroke-linecap="round"
             stroke-linejoin="round">${ex.eq(s) + E.figure(s, ex)}</g></svg>
        <figcaption><b>${v.ok ? '✓' : '✗'} ${v.label}</b><span>${v.note}</span></figcaption>
      </figure>`;
    }).join('')}</div>`;
  }
  return `<div class="viz">
    <svg viewBox="0 0 260 200" id="fig" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g class="art" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></g>
    </svg>
  </div>`;
}

/**
 * Kayan panel — hedef ayarları + anlatım.
 * Adımlar odak ekranından buraya taşındı: salonda ekranın kaymaması, her şeyin
 * tek bakışta görünmesi daha değerli. Bu metinler hareketi öğrenirken lazım,
 * her set arasında değil.
 */
function sheetHTML(ex, settings) {
  const t = N.effective(ex, settings);
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
        <h2 class="t-h1" lang="en">${ex.en}</h2>
        <p class="t-m sheet-sub">${ex.tr}</p>

        <div class="goal">
          <div class="goal-hd">
            <span class="t-l">hedef</span>
            ${t.edited ? '<button class="reset-goal" data-act="goal-reset">programa dön</button>' : ''}
          </div>
          <div class="goal-grid">
            ${alanlar.map(([f, v, d, l]) => `
              <div class="gf">
                <span class="t-l">${l}</span>
                <div class="gbox">
                  <button data-gstep="${f}:${-d}" aria-label="${l} azalt">−</button>
                  <input type="number" inputmode="decimal" step="${d}" min="0"
                         id="g-${f}" value="${v ?? ''}" placeholder="—" aria-label="${l}">
                  <button data-gstep="${f}:${d}" aria-label="${l} artır">+</button>
                </div>
              </div>`).join('')}
          </div>
          <button class="b1" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hoca programı değiştirdiğinde burayı güncelle.
            Ağırlık boş bırakılabilir — o zaman kutu geçen seferki değerle dolar.</p>
        </div>

        <p class="mus"><span class="t-l">çalışan kaslar</span>${ex.mus}</p>
        <ol class="steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        <p class="tip"><span class="t-l">dikkat</span>${ex.tip}</p>
      </div>
    </section>`;
}

/**
 * Dinlenme yuvası — alt segmentin ORTASI.
 * Sayaç ayrı bant açmıyor: boşta "dinlenme 90 sn" yazan yer, çalışırken canlı
 * sayaca dönüşüyor. Ekranda hiçbir şey yer değiştirmiyor.
 */
export const restSlotHTML = (settings, kalan = null) => kalan === null
  ? `<button class="rest" data-act="rest">dinlenme ${settings.restSeconds} sn</button>`
  : `<span class="rest run">
       <span class="n" id="rest-time">${mmss(kalan)}</span>
       <button data-act="rest-skip">geç</button>
       <button class="add" data-act="rest-plus">+30</button>
     </span>`;

/** Sayı girişi: rakam kahraman, adımlayıcı dikey ve sessiz */
const entry = (field, val, delta, unit) => `
  <div class="entry">
    <div class="val">
      <input class="t-num" type="number" inputmode="decimal" step="${delta}" min="0"
             id="f-${field}" value="${val ?? ''}" placeholder="—" aria-label="${unit}">
      <span class="unit">${unit}</span>
    </div>
    <div class="stp">
      <button data-step="${field}:${delta}" aria-label="${unit} artır">+</button>
      <button data-step="${field}:${-delta}" aria-label="${unit} azalt">−</button>
    </div>
  </div>`;

function girisHTML(ex, ctx) {
  const t = N.effective(ex, ctx.settings);

  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? t.seconds;
    // ±5 sn: 15 sn'lik bir hedefte ±15 çok kaba bir adımdı — tek dokunuşta
    // süreyi ikiye katlıyor ya da sıfırlıyordu.
    return `<div class="clock" id="clock">
      <span class="t-l">hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5 sn</button>
        <span class="time" id="clock-time">${mmss(sn)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5 sn</button>
      </div>
    </div>`;
  }
  if (ex.setType === 'cardio') return entry('minutes', ctx.draft.minutes ?? t.minutes, 5, 'dk');

  const ipucu = ex.equipment === 'dumbbell' ? 'tek dambıl · hacimde ×2'
    : ex.equipment === 'barbell' ? 'bar dahil toplam'
      : ex.equipment === 'machine' ? 'makinede seçili' : '';
  const tekrar = ctx.draft.reps ?? t.reps;

  /* ÇALIŞMA EKRANINDA TEK GİRİŞ: AĞIRLIK.
     Tekrar hedeften geliyor ve her sette değişmiyor; her seferinde sormak
     gereksiz dokunuş. Ama hedef 12 iken 10 çıkarsa o seti 12 diye kaydetmek
     veriyi yanlışlar — tekrar GÖRÜNÜR kalıyor ve dokununca YALNIZ BU SET için
     açılıyor. Kalıcı değişiklik panelden. */
  return entry('weight', ctx.draft.weight, 2.5, ctx.settings.unit) + `
    <div class="meta">
      <button class="reps t-m" data-act="reps-edit" aria-expanded="false">
        × <b id="reps-show">${tekrar}</b> tekrar
        ${ipucu ? `<span class="hint">${ipucu}</span>` : ''}
      </button>
      <button class="b3" id="warm" data-act="warm" aria-pressed="${!!ctx.draft.warmup}">Isınma seti</button>
    </div>
    <div class="repsedit" id="repsedit" hidden>${entry('reps', tekrar, 1, 'tekrar')}</div>`;
}

/* ══ ISINMA EKRANI ════════════════════════════════════════════════════════
   Sayaç YOK, işaret YOK, ilerleme YOK — ekran yalnız GÖSTERİR. Isınmayı
   saymak gereksiz iş yaratır: kol çevirirken telefona dokunmazsın.
   Satırlar liste ekranındaki hareket satırının AYNI bileşeni; bütünlük yeni
   desen icat ederek değil var olanı kullanarak kuruluyor. flex:1 ile eşit
   dağılıp ekranı dolduruyorlar — odak ekranıyla aynı "kaymaz" kuralı. */
export function warmupHTML(ctx) {
  const { dayIndex } = ctx;
  const adımlar = N.warmupFor(dayIndex);
  const kaslar = N.DAY_NAMES[dayIndex].split(' — ')[1];

  const satır = adımlar.map(w => `<div class="li" data-warm="${w.id}">
      <span class="nm"><span class="t-h2">${w.ad}</span><span class="t-m">${w.not}</span></span>
      <span class="amt">${w.miktar}</span>
      <svg class="mini" data-anim="${w.id}" viewBox="10 25 240 170"
           preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></g>
      </svg>
    </div>`).join('');

  return `
    <div class="top">
      <button class="icb" data-act="to-list" aria-label="Listeye dön">←</button>
      <span class="mid t-l">ısınma</span>
      <span style="width:36px"></span>
    </div>
    <div class="title">
      <h1 class="t-h1">Isınma</h1>
      <p class="t-m">${kaslar} · ${N.WARMUP_SURE[dayIndex]}</p>
    </div>
    <div class="cardio">
      <span class="nm"><b>${N.KARDIYO.ad}</b><span>${N.KARDIYO.not}</span></span>
      <span class="amt">${N.KARDIYO.miktar}</span>
    </div>
    <div class="wlist">${satır}</div>
    <div class="foot">
      <button class="b1" data-act="warmup-done">Isınma bitti — 1. harekete geç →</button>
      <p class="t-m" style="text-align:center">Sete ve hacme sayılmaz.</p>
    </div>`;
}

export function focusHTML(ctx) {
  const { session, dayIndex, idx, lastPerf, settings } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const ex = exs[idx];
  const q = N.exerciseProgress(session, ex, settings);

  /* Rozetler: yalnız SON 3'ü durur. Uzun hareketlerde (3 çalışma + ısınma
     setleri + yeniden girilen setler) sıra taşıp kontrolleri sıkıştırıyordu.
     Gizlemek veriyi ERİŞİLMEZ yapmasın diye "+N" dokununca hepsi açılır.
     Numaralar TÜM setler üzerinden sayılır — gizlenen set numarayı kaydırmaz. */
  let no = 0;
  const hepsi = q.sets.map((s, i) => {
    const son = i === q.sets.length - 1;
    const et = s.warmup ? 'ısınma' : `${++no}`;
    return `<span class="tag${s.warmup ? ' w' : ''}">${et} <b>${setLabel(s, settings.unit)}</b></span>`
      + (son ? `<button class="undo" data-act="undo">geri al</button>` : '');
  });
  const gizli = ctx.tumRozetler ? 0 : Math.max(0, hepsi.length - GORUNUR_ROZET);
  const katla = hepsi.length > GORUNUR_ROZET
    ? (gizli
        ? `<button class="tag more" data-act="rozet-hepsi" aria-label="${gizli} önceki seti göster">+${gizli}</button>`
        : `<button class="tag more" data-act="rozet-az" aria-label="Yalnız son ${GORUNUR_ROZET} seti göster">az</button>`)
    : '';
  const tags = katla + hepsi.slice(gizli).join('');

  const kaydet = ex.setType === 'time' ? 'Süreyi kaydet' : `${q.calisma + 1}. seti kaydet`;

  /* Ekran KAYMAZ: sabit bantlar + esneyen tek bölge (görsel).
     Hedef tamamlanınca alt eylem ikiye bölünür — 1/3 fazladan set, 2/3 ilerle.
     Otomatik ilerlemek kontrolü elden alırdı; karar hâlâ senin ama tek dokunuş. */
  return `
    ${railHTML(exs, session, settings, idx)}
    <div class="top">
      <button class="icb" data-act="to-list" aria-label="Listeye dön">←</button>
      <span class="mid t-l">${idx + 1}/${exs.length} · ${q.calisma}/${q.hedef} set</span>
      <button class="icb" data-act="sheet-open" aria-label="Nasıl yapılır ve hedef">?</button>
    </div>
    <div class="title">
      <h1 class="t-h1" lang="en">${ex.en}</h1>
      <p class="t-m">${ex.tr} · ${N.repsLabel(ex, settings)}</p>
    </div>
    ${vizHTML(ex)}
    ${q.sets.length ? `<div class="tags">${tags}</div>` : ''}
    ${girisHTML(ex, ctx)}
    <div class="foot">
      <p class="t-m">${lastTime(ex, lastPerf, settings.unit, q.sets.length > 0)}</p>
      ${q.tamam
        ? `<div class="split">
             <button class="b2" data-act="save">Fazladan</button>
             ${idx === exs.length - 1
               ? `<button class="b1" data-act="to-list">Listeye dön →</button>`
               : `<button class="b1" data-act="next">Sonraki hareket →</button>`}
           </div>`
        : ex.setType === 'time'
          /* Süre hareketinde asıl eylem BAŞLATMAK; süre dolunca set kendiliğinden
             kaydedilir. Erken bırakıldığında elle kaydedebilmek için "Kaydet"
             ikincil olarak duruyor. */
          ? `<div class="split">
               <button class="b2" data-act="save">Kaydet</button>
               <button class="b1" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`
          : `<button class="b1" data-act="save">${kaydet}</button>`}
    </div>
    <div class="seg">
      <button class="side" data-act="prev" ${idx === 0 ? 'disabled' : ''}>← Önceki</button>
      <span class="restslot" id="restslot" style="display:contents">${restSlotHTML(settings)}</span>
      <button class="side" data-act="next" ${idx === exs.length - 1 ? 'disabled' : ''}>Sonraki →</button>
    </div>
    <div class="restline"><i id="restline"></i></div>
    ${sheetHTML(ex, settings)}`;
}
