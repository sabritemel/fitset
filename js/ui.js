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

/* YARIM KALAN GÜN BANDI — modal DEĞİL.
   Salonda tek elle kullanılan bir uygulamada modal düşmanca: ekranı kilitler,
   kapatma hedefi arattırır. Bant listenin üstünde durur, iki düğmesi var ve
   cevap verilene kadar bekler; altındaki program görünmeye devam eder. */
const carryHTML = y => !y ? '' : `
  <div class="carry">
    <p class="t-l">${N.DAY_NAMES[y.session.dayIndex].split(' — ')[0]} yarım kaldı</p>
    <p class="carry-sub">${C.relativeLabel(new Date(y.session.finishedAt ?? y.session.startedAt))}
      · ${y.yapilan}/${y.toplam} hareket</p>
    <p class="carry-list">${y.kalan.map(e => e.tr).join(' · ')}</p>
    <div class="split">
      <button class="b2" data-act="carry-skip">Sıradakine geç</button>
      <button class="b1" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div>`;

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

export function listHTML(ctx) {
  const { session, dayIndex, settings, status, yarim, oncekiYapilan } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex, settings);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const [gün, kaslar] = N.DAY_NAMES[dayIndex].split(' — ');

  const items = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex, settings);
    const pips = Array.from({ length: q.hedef }, (_, k) =>
      `<i class="${k < q.calisma ? 'f' : ''}"></i>`).join('');
    // Devredilen günde geçen sefer YAPILMIŞ olanı söyle — ama setlerini KOPYALAMA.
    // Kayıtlar yapıldıkları güne ait kalmalı; bu yalnız bir yön göstericidir.
    const gecen = oncekiYapilan?.has(ex.id);
    return `<button class="li${q.tamam ? ' done' : ''}${gecen ? ' prev' : ''}" data-go="${i}">
      <span class="ix">${String(i + 1).padStart(2, '0')}</span>
      <span class="nm"><span class="t-h2" lang="en">${ex.en}</span>
        <span class="t-m">${gecen ? 'geçen sefer yapıldı' : ex.tr}</span></span>
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
      <div class="hd-row">
        <p class="t-l">${status.label}</p>
        <span class="hd-links">
        <button class="hd-link" data-act="to-history">Geçmiş</button>
        <button class="hd-link" data-act="to-settings">Ayarlar</button></span>
      </div>
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
    ${carryHTML(yarim)}
    <div class="lst">${isinma}${items}</div>
    <div class="finisher"><h3>${f.h}</h3><p>${f.p}</p></div>
    <div class="note">
      <p>Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez — bu yüzden düzenli yedek al.
      Ağrı hissettiğin bir harekette dur. Bu uygulama tıbbi tavsiye vermez.</p>
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

/* ══ GEÇMİŞ EKRANI ════════════════════════════════════════════════════════
   Bu verilerin hepsi ZATEN kaydediliyordu; eksik olan onları gösteren ekrandı.

   Grafik kararları (tasarım dili + veri görselleştirme kuralları):
   · TEK SERİ → gösterge (legend) yok; başlık zaten neyi çizdiğini söylüyor.
   · VURGU RENGİ YOK. #FF3B4E yalnız CANLI olana ayrıldı; geçmiş canlı değil.
     Çizgi mürekkep tonunda, ızgara/eksen daha sönük.
   · Her noktaya sayı YAZILMAZ — yalnız uçlar etiketlenir. Dokunmatikte hover
     yok, o yüzden değerler doğrudan yazılıyor (tooltip'e gömülmüyor).
   · İki noktadan azına grafik çizilmez; "tek nokta trend" yalandır. */

/** Tek seri çizgi. viewBox oranı korunur — esnetilseydi nokta elips olurdu. */
function sparkHTML(vals, { w = 280, h = 52 } = {}) {
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pay = (mx - mn) * 0.18 || Math.max(1, mx * 0.02);   // düz seri de ortada dursun
  const alt = mn - pay, ust = mx + pay;
  // KENAR PAYI: son noktanın diski çerçevenin tam üstüne düşüyor ve yarısı
  // dışarıda kalıyordu (canlıda görüldü). Çizim alanı içeriden daraltılıyor.
  const m = 5;
  const X = i => m + (i / (vals.length - 1)) * (w - 2 * m);
  const Y = v => m + (h - 2 * m) - ((v - alt) / (ust - alt)) * (h - 2 * m);
  const nokta = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img"
      aria-label="${vals.length} ölçüm: ${vals[0]} → ${vals.at(-1)}">
    <polyline points="${nokta}"/>
    <circle cx="${X(vals.length - 1).toFixed(1)}" cy="${Y(vals.at(-1)).toFixed(1)}" r="3.5"/>
  </svg>`;
}

const kiloDelta = (kilolar) => {
  if (kilolar.length < 2) return '';
  const d = kilolar.at(-1).kg - kilolar[0].kg;
  const gun = Math.round((kilolar.at(-1).ts - kilolar[0].ts) / 86400000);
  const sure = gun >= 14 ? `${Math.round(gun / 7)} haftada` : `${gun} günde`;
  if (Math.abs(d) < 0.05) return `<span class="delta">değişmedi · ${sure}</span>`;
  return `<span class="delta">${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} kg · ${sure}</span>`;
};

export function historyHTML(ctx) {
  const { kilolar = [], gecmis = [], ilerleme = [], settings } = ctx;
  const son = kilolar.at(-1);

  const kiloBolum = `
    <div class="sect">
      <p class="t-l">Kilo</p>
      ${son ? `<div class="hero"><b>${son.kg.toFixed(1)}</b><i>kg</i> ${kiloDelta(kilolar)}</div>
               ${sparkHTML(kilolar.map(k => k.kg))}
               <p class="hint">${kilolar.length} ölçüm · son giriş ${C.relativeLabel(new Date(son.ts))}</p>`
            : '<p class="hint">Henüz kilo kaydı yok. Aşağıya yazınca burada takip edilir.</p>'}
      <div class="frow kilogir">
        <label for="h-weight">Bugün</label>
        <input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
               value="${son && son.d === (new Date()).toISOString().slice(0, 10) ? son.kg : ''}"
               placeholder="—" aria-label="Bugünkü kilo">
        <span class="unit">kg</span>
        <button class="b3" data-act="weight-save">Kaydet</button>
      </div>
    </div>`;

  const seansBolum = `
    <div class="sect">
      <p class="t-l">Son seanslar</p>
      ${gecmis.length ? `<div class="hrows">${gecmis.map(r => `
        <div class="hrow">
          <span class="hdate">${C.fmtShort(new Date(r.at))}</span>
          <span class="hday">${N.DAY_NAMES[r.dayIndex].split(' — ')[0]}</span>
          <span class="hcount">${r.yapilan}/${r.toplam}${r.yarim ? ' <em>yarım</em>' : ''}</span>
          <span class="hvol">${r.hacim.kg.toLocaleString('tr-TR')} ${settings.unit}</span>
        </div>`).join('')}</div>`
        : '<p class="hint">Henüz tamamlanmış seans yok.</p>'}
    </div>`;

  const ilerlemeBolum = `
    <div class="sect">
      <p class="t-l">Hareket ilerlemesi</p>
      ${ilerleme.length ? `<div class="progs">${ilerleme.map(p => `
        <div class="prog">
          <span class="prog-ad" lang="en">${p.ex.en}</span>
          <span class="prog-spark">${sparkHTML(p.seri.map(s => s.v), { w: 96, h: 26 })}</span>
          <span class="prog-say">${p.seri[0].v} → <b>${p.seri.at(-1).v}</b> ${p.birim}</span>
        </div>`).join('')}</div>
        <p class="hint">${ilerleme.length} harekette <b>en ağır set</b> izleniyor; çizgi en fazla son ${Math.max(...ilerleme.map(p => p.seri.length))} seansı gösterir. Ortalama yerine en ağır set seçildi — hafif setler gerçek artışı gizlerdi.</p>`
        : '<p class="hint">İlerleme grafiği için bir hareketin en az iki seansta kaydı gerekiyor.</p>'}
    </div>`;

  return `
    <div class="top">
      <button class="icb" data-act="to-list" aria-label="Listeye dön">←</button>
      <span class="mid t-l">Geçmiş</span>
      <span class="icb" style="visibility:hidden" aria-hidden="true"></span>
    </div>
    ${kiloBolum}${seansBolum}${ilerlemeBolum}
    <div class="grow"></div>`;
}

/* ══ AYARLAR EKRANI ═══════════════════════════════════════════════════════
   Yalnız GERÇEKTEN çalışan ayarlar burada. `settings` nesnesinde duran ama
   hiçbir kod yolunun okumadığı iki alan bilerek DIŞARIDA bırakıldı:

     unit   → yalnızca ETİKET. setLabel birimi hiç kullanmıyor, dönüşüm yok;
              "lbs" seçeneği kiloyu libre gibi gösterir ve YALAN söylerdi.
     theme  → hiçbir yerde okunmuyor, CSS'te prefers-color-scheme bloğu da yok.
              Uygulama tek temalı; seçenek koymak işlevsiz düğme olurdu.

   Kural: arayüz, arkasındaki gerçeğin üstünde vaat veremez. İkisi de
   uygulandığında buraya eklenecek. */

const GUN_SEC = [1, 2, 3, 4, 5, 6, 0];        // Pzt…Paz — hafta Pazartesi başlar
const DINLENME = [30, 45, 60, 90, 120];

export function settingsHTML(ctx) {
  const { settings } = ctx;
  const seciliGunler = settings.trainingDays ?? [];

  const gunler = GUN_SEC.map(g => `
    <button class="b3 gun" data-gun="${g}" aria-pressed="${seciliGunler.includes(g)}"
            aria-label="${C.GUN[g]}">${C.GUN_KISA[g]}</button>`).join('');

  const sonraki = C.upcoming(new Date(), seciliGunler, 3);
  const sonrakiMetin = sonraki.length
    ? sonraki.map(d => C.fmtShort(d)).join(' · ')
    : 'Hiç gün seçili değil — takvim çalışmaz.';

  const dinlenme = DINLENME.map(sn => `
    <button class="b3" data-rest="${sn}" aria-pressed="${settings.restSeconds === sn}">${sn} sn</button>`).join('');

  return `
    <div class="top">
      <button class="icb" data-act="to-list" aria-label="Listeye dön">←</button>
      <span class="mid t-l">Ayarlar</span>
      <span class="icb" style="visibility:hidden" aria-hidden="true"></span>
    </div>

    <div class="sect">
      <p class="t-l">Antrenman günleri</p>
      <div class="chips">${gunler}</div>
      <p class="hint${sonraki.length ? '' : ' warnhint'}">Sıradaki: ${sonrakiMetin}</p>
    </div>

    <div class="sect">
      <p class="t-l">Setler arası dinlenme</p>
      <div class="chips">${dinlenme}</div>
      <p class="hint">Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div>

    <div class="sect">
      <p class="t-l">Vücut</p>
      <div class="frow">
        <label for="s-height">Boy</label>
        <input type="number" id="s-height" inputmode="numeric" min="100" max="250" step="1"
               value="${settings.heightCm ?? ''}" placeholder="—" aria-label="Boy (cm)">
        <span class="unit">cm</span>
      </div>
      <p class="hint">Kilo takibi Geçmiş ekranında.</p>
    </div>

    <div class="sect">
      <p class="t-l">Yedek</p>
      <p class="hint">Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez.
        Telefonu değiştirirsen ya da tarayıcı verisini silersen <b>her şey gider</b> —
        arada bir yedek al.</p>
      <div class="split">
        <button class="b2" data-act="import">Geri yükle</button>
        <button class="b2" data-act="backup">Yedek al</button>
      </div>
    </div>

    <div class="grow"></div>`;
}
