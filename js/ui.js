/**
 * EKRAN ÇİZİMİ — saf işaretleme üretimi, olay yok.
 * Olayların tamamı app.js'te tek bir delegasyonla yönetilir; buradaki
 * fonksiyonlar yalnız HTML döndürür, bu yüzden tek tek denenebilirler.
 *
 * Tasarım dili 3. sürüm "Grafit" (27 Eyl): tek yazı ailesi, tek vurgu rengi (yalnız
 * CANLI olana), kart yerine tonlu grup, tek düğme dili, çizgisel ikon seti (index.html).
 * Ayrıntı: css/style.css başlığı ve docs/2026-09-27-tasarim-dili-analizi.md.
 *
 * ⚠️ Punto, ağırlık ve renk BURADA yazılmaz — satır içi `style=` yalnız veri taşır
 * (ör. --p yüzdesi). Görsel karar css/style.css'te; tools/check-tasarim.js denetler.
 */
import * as N from './session.js';
import * as C from './schedule.js';
import { dayKey } from './store.js';
import { mmss } from './timer.js';
import * as I from './ilerleme.js';

/* ── Yardımcılar ───────────────────────────────────────────────────────── */

/**
 * TEK SAYI BİÇİMİ — Türkçe: ondalık VİRGÜL, binlik NOKTA.
 * Ekranda sayı basan her yer BUNU kullanır.
 * @param {number|null} n
 * @param {number} [enCok=2]  en fazla ondalık hane
 * @param {number} [enAz=0]   en az ondalık hane (kilo gibi hep 1 hane gösterilecekler için)
 */
export const fmt = (n, enCok = 2, enAz = 0) => (n == null || !Number.isFinite(+n)) ? '—'
  : (+n).toLocaleString('tr-TR', { minimumFractionDigits: enAz, maximumFractionDigits: enCok });

/**
 * HTML kaçışı — VERİDEN gelip işaretlemeye giren her metin için.
 * İçe aktarım kimlikleri doğruluyor (store.gecersizSeans); bu ikinci kemer.
 */
export const esc = v => String(v).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Çizgisel ikon — sembolleri index.html taşır (pakette, çevrimdışı) */
const ik = ad => `<svg class="i" aria-hidden="true"><use href="#i-${ad}"/></svg>`;

/* Ağırlıksız set (vücut ağırlığı) "— × 12" değil "12 tekrar" yazılır — "—" bir değer gibi okunuyordu (27 Eyl) */
export const setLabel = s =>
  s.type === 'time' ? `${fmt(s.seconds)} sn`
    : s.type === 'cardio' ? `${fmt(s.minutes)} dk`
      : s.weight == null ? `${fmt(s.reps)} tekrar` : `${fmt(s.weight)} × ${fmt(s.reps)}`;

/** Bir setin tek değeri — liste satırının sağı ("45 kg", "40 sn", "12 tekrar") */
const degerEtiketi = (s, birim) => s.type === 'time' ? `${fmt(s.seconds)} sn`
  : s.type === 'cardio' ? `${fmt(s.minutes)} dk`
    : s.weight == null ? `${fmt(s.reps)} tekrar` : `${fmt(s.weight)} ${birim}`;

/** "Geçen sefer · 3 gün önce · 35 × 12 · 3 set" — özdeş setler tek kez yazılır */
export function lastTime(ex, lastPerf, birim, bugünVar = false) {
  const lp = lastPerf[ex.id];
  // Bugün zaten set girilmişken "ilk kaydı" demek kafa karıştırıyordu. Ayrım: GEÇEN SEFER ≠ bugün.
  if (!lp) return bugünVar ? 'Bu hareketi ilk kez yapıyorsun.' : 'Bu hareketin ilk kaydı.';
  const etiketler = lp.sets.map(setLabel);
  const hepsiAyni = etiketler.every(e => e === etiketler[0]);
  const setler = hepsiAyni ? `<b>${etiketler[0]}</b> · ${etiketler.length} set` : `<b>${etiketler.join(' · ')}</b>`;
  return `Geçen sefer · ${C.relativeLabel(new Date(lp.at))} · ${setler}`;
}

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

/* YARIM KALAN GÜN BANDI — modal DEĞİL: ekranı kilitlemez, altındaki program görünür kalır. */
const carryHTML = y => !y ? '' : `
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${N.DAY_NAMES[y.session.dayIndex].split(' — ')[0]} yarım kaldı</p>
    <p class="alt-satir">${C.relativeLabel(new Date(y.session.finishedAt ?? y.session.startedAt))}
      · ${y.yapilan}/${y.toplam} hareket</p>
    <p>${y.kalan.map(e => e.tr).join(' · ')}</p>
    <div class="cift dikey">
      <button class="btn s" data-act="carry-skip">Sıradakine geç</button>
      <button class="btn p" data-act="carry-go">Bu güne devam et</button>
    </div>
  </div></div>`;

/* GÜN SEÇİCİ — "öner, dayatma". Satır içi grup, modal değil.
   Kilitliyken seçilemeyen seçenekleri GÖSTERMEZ; yalnız sebebi söyler. */
const gunSeciciHTML = ctx => {
  const { session, dayIndex, onerilen, gunSecici } = ctx;
  if (!gunSecici) return '';
  const izin = N.canSwitchDay(session);
  const bugunAdi = N.DAY_NAMES[dayIndex].split(' — ')[0];
  if (!izin.ok) return `<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`;

  const secenekler = N.allDays().map(g => {
    const [ad, kas] = g.name.split(' — ');
    return `<button class="pick" data-gun-sec="${g.dayIndex}" aria-pressed="${g.dayIndex === dayIndex}">
      <span class="pick-ad">${ad}</span><span class="pick-kas">${kas}</span>
      ${g.dayIndex === onerilen ? '<span class="pick-not">program önerisi</span>' : ''}
    </button>`;
  }).join('');

  return `<div class="grup picker"><h2 class="etiket">Bugün ne yapıyorsun?</h2><div class="ic">
    <div class="picks">${secenekler}</div>
    <p>${bugunAdi}'ü telefonsuz yaptıysan işaretle: kayda geçer, sıra sonraki güne atlar.
      Ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.</p>
    <button class="btn s" data-act="gun-yapildi">${bugunAdi}'ü yapıldı işaretle</button>
  </div></div>`;
};

/** Liste satırının sağı: bugün yapılan · geçen sefer · hedef — hangisi varsa */
function satirSag(ex, q, lp, settings) {
  const bugun = q.sets.filter(s => !s.warmup).at(-1);
  if (bugun) return `<b>${degerEtiketi(bugun, settings.unit)}</b>${q.calisma}/${q.hedef}`;
  const gecen = lp?.sets?.at(-1);
  if (gecen) return `<b>${degerEtiketi(gecen, settings.unit)}</b>geçen`;
  return `<b>${N.repsLabel(ex, settings)}</b>hedef`;
}

/** Durum dairesi: boş halka · kısmi yay (yüzde veridir) · dolu tik */
const durumHTML = q => q.tamam ? `<span class="durum tamam">${ik('tik')}</span>`
  : q.calisma > 0 ? `<span class="durum kismi" style="--p:${Math.round(q.calisma / q.hedef * 100)}"></span>`
    : '<span class="durum bos"></span>';

/**
 * Liste ekranının birincil eylemi (session.siradakiEylem karar verir).
 * Hareketler eksikken "Seansı bitir" İKİNCİL; ancak her şey tamamken birincil olur.
 */
function listeEylemi(ctx, eylem, exs) {
  if (eylem.tur === 'isinma') return `<button class="btn p" data-act="warmup">Isınmaya başla${ik('ileri')}</button>`;
  if (eylem.tur === 'bitir') return '<button class="btn p" data-act="finish">Seansı bitir</button>';
  const setVar = N.hasAnySet(ctx.session);
  const ex = exs[eylem.idx];
  const ust = eylem.basladi ? 'Devam et' : setVar ? 'Sıradaki' : 'Başla';
  // Adın TAMAMI görünmeli: ok ikonu yok ("Devam et" yönü söylüyor), ikincil düğme kısa
  // ("Bitir"); yine sığmazsa ad kesilmez, ikinci satıra sarar. 27 Eyl ölçümü: 18 addan en uzunu
  // 251 px, bu düzende 390 px'lik telefonda ada 240 px kalıyor.
  const ana = `<button class="btn p iki" data-go="${eylem.idx}" aria-label="${ust}: ${esc(ex.en)}">
      <span><small>${ust}</small><b lang="en">${ex.en}</b></span></button>`;
  return setVar ? `<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${ana}</div>` : ana;
}

export function listHTML(ctx) {
  const { session, dayIndex, settings, status, yarim, oncekiYapilan, gunSecici, lastPerf = {} } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex, settings);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const [gün, kaslar] = N.DAY_NAMES[dayIndex].split(' — ');
  const eylem = N.siradakiEylem(session, dayIndex, settings);
  const simdi = eylem.tur === 'hareket' ? eylem.idx : -1;

  const satirlar = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex, settings);
    // Devredilen günde geçen sefer YAPILMIŞ olanı söyle — ama setlerini KOPYALAMA.
    const gecen = oncekiYapilan?.has(ex.id);
    const sinif = [q.tamam && 'bitti', i === simdi && 'simdi', gecen && !q.calisma && 'onceki'].filter(Boolean).join(' ');
    return `<button class="satir${sinif ? ' ' + sinif : ''}" data-go="${i}">
      ${durumHTML(q)}
      <span class="ad"><b lang="en">${ex.en}</b><span>${gecen && !q.calisma ? 'geçen sefer yapıldı' : ex.tr}</span></span>
      <span class="sag">${satirSag(ex, q, lastPerf[ex.id], settings)}</span>
    </button>`;
  }).join('');

  /* ISINMA — numarasız İLK satır; sete ve hacme sayılmaz */
  const isinma = `<button class="satir${session.warmupDone ? ' bitti' : ''}" data-act="warmup">
    <span class="durum ${session.warmupDone ? 'tamam' : 'ikon'}">${ik(session.warmupDone ? 'tik' : 'alev')}</span>
    <span class="ad"><b>Isınma</b><span>${N.warmupFor(dayIndex).length + 1} adım · ${N.WARMUP_SURE[dayIndex]}</span></span>
    <span class="sag">${session.warmupDone ? 'yapıldı' : 'başla'}</span>
  </button>`;

  const f = N.finisherFor(dayIndex);
  const [fAd, fSure] = f.h.split(' — ');
  const bitis = `<div class="satir">
    <span class="durum ikon">${ik('nabiz')}</span>
    <span class="ad"><b>${fAd}</b><span>${f.p}</span></span>
    <span class="sag"><b>${fSure ?? ''}</b>bitişte</span>
  </div>`;

  return `
    <div class="ust liste-ust">
      <span class="tarih">${status.label}</span>
      <span class="sag-grup">
        <button class="ib" data-act="to-history" aria-label="Geçmiş">${ik('grafik')}</button>
        <button class="ib" data-act="to-settings" aria-label="Ayarlar">${ik('ayar')}</button>
      </span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!gunSecici}" aria-label="Günü değiştir: ${gün}">
      ${gün}${ik(gunSecici ? 'yukari' : 'asagi')}</button>
    <div class="gun-baslik"><h1>${kaslar}</h1></div>
    ${status.isTrainingDay ? '' : `<div class="not">${ik('takvim')}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${status.next ? C.fmtShort(status.next) : '—'}</b>.</span></div>`}
    ${gunSeciciHTML(ctx)}
    <div class="ozet">
      <div><b>${p.done}<small>/${p.total}</small></b><span>Set</span></div>
      <div><b>${fmt(v.kg, 0)}<small>${settings.unit}</small></b><span>Hacim</span></div>
      <div><b>${dk}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${carryHTML(yarim)}
    <div class="liste">${isinma}${satirlar}${bitis}</div>
    <div class="alt">${listeEylemi(ctx, eylem, exs)}</div>`;
}

/* ══ ODAK EKRANI ══════════════════════════════════════════════════════════ */

/**
 * Hareket görseli — 3B sahne kapları; çizimi app.js yapar (anim3d/sahne.js).
 * İzometrik harekette (plank) oynatacak hareket yok, öğretici olan doğru ile yanlış
 * arasındaki FARK. Ama bu öğrenirken lazım, her sette değil: İLK SET kaydedilince yalnız
 * doğru duruş kalır, hatalar ? paneline geçer (Sabri, 27 Eyl).
 */
function vizHTML(ex, q) {
  if (ex.hold) {
    const dogru = Math.max(0, ex.variants.findIndex(v => v.ok));
    if (q.calisma >= 1) return `<div class="fig">
        <div class="sahne3d" data-varyant="${dogru}" role="img" aria-label="${esc(ex.tr)}: doğru duruş"></div>
        <p class="fig-not">${ik('tik')}${ex.variants[dogru].note} · hatalar ? panelinde</p>
      </div>`;
    return `<div class="variants">${ex.variants.map((v, i) => `<figure class="${v.ok ? 'ok' : ''}">
        <div class="sahne3d" data-varyant="${i}" aria-hidden="true"></div>
        <figcaption><b>${ik(v.ok ? 'tik' : 'carpi')}${v.label}</b><span>${v.note}</span></figcaption>
      </figure>`).join('')}</div>`;
  }
  return `<div class="fig">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${esc(ex.tr)} hareket çizimi; sürükleyerek döndürülür"></div>
  </div>`;
}

/**
 * Kayan panel — hedef ayarları + anlatım. Kapalıyken `inert`: ekran dışında dursa da
 * içindeki kontroller odak sırasına girmesin (eskiden aria-hidden ama 11 kontrol odaklanabiliyordu).
 */
function sheetHTML(ex, ctx) {
  const { settings } = ctx;
  const t = N.effective(ex, settings);
  const adim = I.agirlikAdimi(ex, settings) ?? I.GIRIS_ADIMI_YEDEK;
  const alanlar = [
    ['sets', t.sets, 1, 'Set sayısı'],
    ...(ex.setType === 'time' ? [['seconds', t.seconds, 5, 'Süre (sn)']]
      : ex.setType === 'cardio' ? [['minutes', t.minutes, 5, 'Süre (dk)']]
        : [['reps', t.reps, 1, 'Tekrar'], ['weight', t.weight, adim, `Ağırlık (${settings.unit})`]]),
  ];

  /* Ağırlık önerisi burada (Sabri, 27 Eyl: ana ekranda görünmesin) — hedefin hemen üstünde,
     çünkü ikisi aynı soruya bakar: bu harekette hangi yüke çıkmalıyım? */
  return `<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2 lang="en">${ex.en}</h2>
        <p class="alt-baslik">${ex.tr}</p>
        ${oneriHTML(ex, ctx)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef</span>
            ${t.edited ? '<button class="cip" data-act="goal-reset">Programa dön</button>' : ''}
          </div>
          <div class="goal-grid">
            ${alanlar.map(([f, v, d, l]) => `
              <div class="gf">
                <span class="etiket">${l}</span>
                <div class="gbox">
                  <button data-gstep="${f}:${-d}" aria-label="${l} azalt">${ik('eksi')}</button>
                  <input type="number" inputmode="decimal" step="${d}" min="0"
                         id="g-${f}" value="${v ?? ''}" placeholder="—" aria-label="${l}">
                  <button data-gstep="${f}:${d}" aria-label="${l} artır">${ik('arti')}</button>
                </div>
              </div>`).join('')}
          </div>
          <button class="btn p" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hoca programı değiştirdiğinde burayı güncelle. Ağırlık boş kalırsa kutu
            geçen seferki değerle dolar.</p>
        </div>
        <h3>Çalışan kaslar</h3>
        <p class="mus">${ex.mus}</p>
        <h3>Nasıl yapılır</h3>
        <ol class="steps">${ex.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        ${ex.hold ? `<h3>Doğru duruş ve yaygın hatalar</h3>
          <ul class="hatalar">${ex.variants.map(v => `<li><b>${v.label}</b><span>${v.note}</span></li>`).join('')}</ul>` : ''}
        <h3 class="tip-bas">${ik('uyari')}Dikkat</h3>
        <p>${ex.tip}</p>
      </div>
    </section>`;
}

/**
 * ALT BANT — yüksekliği SABİT (css). Boşta: önceki · dinlenme · sonraki.
 * Dinlenme çalışırken yan gezinme ÇEKİLİR ve bant tümüyle sayaca döner: +30 · kalan · geç.
 * ⚠️ Eskiden sayaç 19 px'ti (değişmeyen ağırlık 76 px) ve "+30" ~26 px'lik bir hedef olarak
 * "Sonraki →"nın hemen yanında duruyordu: dinlenme ortasında yanlış dokunuş hareketi değiştiriyordu.
 */
export function gezinmeHTML(ctx, kalan = null, toplam = 0) {
  if (kalan === null) {
    const son = N.exercisesFor(ctx.dayIndex).length - 1;
    return `<div class="gezinme" id="gezinme">
      <button data-act="prev" ${ctx.idx === 0 ? 'disabled' : ''} aria-label="Önceki hareket">${ik('geri')}Önceki</button>
      <button class="dinlenme" data-act="rest">${ik('saat')}Dinlenme ${ctx.settings.restSeconds} sn</button>
      <button data-act="next" ${ctx.idx === son ? 'disabled' : ''} aria-label="Sonraki hareket">Sonraki${ik('ileri')}</button>
    </div>`;
  }
  return `<div class="gezinme run" id="gezinme">
    <button data-act="rest-plus" aria-label="Dinlenmeye 30 saniye ekle">+30</button>
    <div class="dinlenme" role="timer" aria-label="Kalan dinlenme">
      <b id="rest-time">${mmss(kalan)}</b>
      <span class="bar"><i id="rest-bar" style="transform:scaleX(${toplam ? (kalan / toplam).toFixed(3) : 0})"></i></span>
    </div>
    <button data-act="rest-skip">Geç</button>
  </div>`;
}

/** Yuvadaki sıkı biçim ("42,5×12") — dar yuvada değer kırpılmasın (360 px'te yuvaya ~60 px kalır) */
const yuvaDegeri = s => s.type === 'weight_reps' && s.weight != null ? `${fmt(s.weight)}×${fmt(s.reps)}` : setLabel(s);

/**
 * SET YUVALARI — "1/3 SET" metni ve rozetler yerine hedef kadar yuva: biten tikli,
 * sıradaki vurgu çerçeveli ("Şimdi"), kalan boş. Isınma setleri kendi (dar) yuvasında, sayılmaz.
 * ⚠️ 360 px'te ölçüldü: geri al düğmesi de bu satırdayken yuvaya 61 px kalıyor ve "42,5 × 12"
 * (72 px) ile "Set 2 · şimdi" (75 px) sessizce kırpılıyordu → geri al üst çubuğa taşındı.
 */
function yuvalarHTML(q, ctx, ex) {
  const calisma = q.sets.filter(s => !s.warmup);
  const isinma = q.sets.filter(s => s.warmup);
  const n = Math.max(q.hedef, calisma.length);
  const bas = Math.max(0, n - 3);                          // en fazla 3 çalışma yuvası (+ ısınma)
  const yuvalar = [];
  if (isinma.length) yuvalar.push(`<div class="yuva isinma"><small>Isınma</small><b>×${isinma.length}</b></div>`);
  for (let i = bas; i < n; i++) {
    if (i < calisma.length) yuvalar.push(`<div class="yuva"><small>${ik('tik')}Set ${i + 1}</small><b>${yuvaDegeri(calisma[i])}</b></div>`);
    else if (i === calisma.length) yuvalar.push(simdiYuvasi(ex, ctx));
    else yuvalar.push(`<div class="yuva bos"><small>Set ${i + 1}</small><b>—</b></div>`);
  }
  return `<div class="yuvalar${yuvalar.length > 3 ? ' sik' : ''}">${yuvalar.join('')}</div>`;
}

/**
 * "ŞİMDİ" YUVASI — ağırlık × tekrar hareketinde bir DÜĞME: dokununca "Bu set" paneli açılır
 * (tekrar ve ısınma seti). Sabri (27 Eyl): ana ekran olabildiğince sade — ikisi ekrandan kalktı
 * ama işlev kalmalı: hedef 12 iken 10 çıkan seti 12 diye kaydetmek veriyi yanlışlar.
 * Isınma seçiliyse yuva bunu SÖYLER (etiket "Isınma") — gizli bir durum ekranda görünmeli.
 */
function simdiYuvasi(ex, ctx) {
  const ic = `<small id="yuva-etiket">${simdiEtiketi(ctx)}</small><b id="yuva-onizleme">${onizleme(ex, ctx)}</b>`;
  if (ex.setType !== 'weight_reps') return `<div class="yuva simdi" id="yuva-simdi">${ic}</div>`;
  return `<button class="yuva simdi ayarli" id="yuva-simdi" data-act="set-ayar" aria-haspopup="dialog"
    aria-describedby="yuva-ipucu">${ic}${ik('asagi')}<span class="gizli" id="yuva-ipucu">Tekrar ve ısınma seti</span></button>`;
}
export const simdiEtiketi = ctx => ctx.draft.warmup ? 'Isınma' : 'Şimdi';

/**
 * "Şimdi" yuvasının ön izlemesi — o an kutuda duran değer (app.js adımlayıcıyla tazeler).
 * Ağırlık henüz yoksa yalnız tekrar: "—×12" okunmuyordu (27 Eyl, Sabri).
 */
export function onizleme(ex, ctx) {
  const t = N.effective(ex, ctx.settings);
  if (ex.setType === 'time') return `${fmt(ctx.draft.seconds ?? t.seconds)} sn`;
  if (ex.setType === 'cardio') return `${fmt(ctx.draft.minutes ?? t.minutes)} dk`;
  const tekrar = fmt(ctx.draft.reps ?? t.reps);
  return ctx.draft.weight == null ? `${tekrar} tekrar` : `${fmt(ctx.draft.weight)}×${tekrar}`;
}

/** Kaydet düğmesinin etiketi — ısınma seçiliyse onu söyler (çip artık ekranda değil) */
export function kaydetEtiketi(ex, q, ctx) {
  if (ex.setType === 'time') return 'Süreyi kaydet';
  return ctx.draft.warmup ? 'Isınma setini kaydet' : `${q.calisma + 1}. seti kaydet`;
}

/** "Geçen sefer" — ağırlığın ALTINDA, adımlayıcının yanındaki boşlukta (eskiden ayrı bir bant, 30 px) */
const gecenHTML = (ex, ctx) => `<p class="gecen">${ik('gecmis')}<span>${lastTime(ex, ctx.lastPerf, ctx.settings.unit,
  N.exerciseProgress(ctx.session, ex, ctx.settings).sets.length > 0)}</span></p>`;

/**
 * Sayı girişi: rakam kahraman, adımlayıcı başparmağın altında. Düğmeler ADIMI üstünde yazar
 * ("+5 / −5"): ne yaptıklarını kendileri söyler, ayrı adım satırına gerek kalmaz (figüre yer açıldı).
 * Boş kutunun yer tutucusu sönük "0": 80 px'lik "—" gri bir çubuk gibi okunuyordu (27 Eyl, Sabri).
 * Değer yine BOŞTUR — kaydederken "Ağırlığı gir." uyarısı aynen çalışır.
 */
const entry = (field, val, delta, etiket, birim, alt = '') => `
  <div class="giris">
    <div class="deger">
      <span class="etiket">${etiket}</span>
      <div><input type="number" inputmode="decimal" step="${delta}" min="0"
             id="f-${field}" value="${val ?? ''}" placeholder="0" aria-label="${etiket} (${birim})"><em>${birim}</em></div>
      ${alt}
    </div>
    <div class="stp">
      <button data-step="${field}:${delta}" aria-label="${fmt(delta)} ${birim} artır">+${fmt(delta)}</button>
      <button data-step="${field}:${-delta}" aria-label="${fmt(delta)} ${birim} azalt">−${fmt(delta)}</button>
    </div>
  </div>`;

const IPUCU = { dumbbell: 'tek dambıl', barbell: 'bar dahil', machine: 'makinede seçili' };

function girisHTML(ex, ctx) {
  const t = N.effective(ex, ctx.settings);

  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? t.seconds;
    // ±5 sn: 15 sn'lik bir hedefte ±15 çok kaba bir adımdı
    return `<div class="clock" id="clock">
      <span class="etiket">Hedef süre</span>
      <div class="crow">
        <button class="cadj" data-act="clock-minus" aria-label="5 saniye azalt">−5</button>
        <span class="time" id="clock-time" role="timer">${mmss(sn)}</span>
        <button class="cadj" data-act="clock-plus" aria-label="5 saniye ekle">+5</button>
      </div>
    </div>`;
  }
  if (ex.setType === 'cardio') return entry('minutes', ctx.draft.minutes ?? t.minutes, 5, 'Süre', 'dk', gecenHTML(ex, ctx));

  /* Adım EKİPMANDAN (ilerleme.agirlikAdimi): bar 2,5 · makine/kablo 5 · dambıl ayardan.
     Eskiden her ekipmanda 2,5'ti — 16 kg dambılda "+" 18,5 yazıyordu. */
  const adim = I.agirlikAdimi(ex, ctx.settings) ?? I.GIRIS_ADIMI_YEDEK;
  const birim = ctx.settings.unit;
  const etiket = `Ağırlık${IPUCU[ex.equipment] ? ' · ' + IPUCU[ex.equipment] : ''}${ex.equipment === 'dumbbell' ? ' · hacimde ×2' : ''}`;
  return entry('weight', ctx.draft.weight, adim, etiket, birim, gecenHTML(ex, ctx));
}

/**
 * "BU SET" PANELİ — "Şimdi" yuvasına dokununca açılır (yalnız ağırlık × tekrar hareketi).
 * Tekrar hedeften gelir ama bu set için değiştirilebilir: hedef 12 iken 10 çıkarsa o seti 12 diye
 * kaydetmek veriyi yanlışlar. Kalıcı değişiklik "?" panelinden (Hedef).
 * Kimlikler (#f-reps, #warm) ana ekrandaki eski yerleriyle AYNI: kayıt ve adımlayıcı kodu onları
 * kimlikle bulur; panel kapalıyken de DOM'dadır (inert), yani değer her zaman okunur.
 */
function setAyarHTML(ex, ctx) {
  if (ex.setType !== 'weight_reps') return '';
  const t = N.effective(ex, ctx.settings);
  const tekrar = ctx.draft.reps ?? t.reps;
  return `<section class="sheet" id="set-sheet" aria-hidden="true" inert aria-label="Bu set">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>Bu set</h2>
        <p class="alt-baslik">Hedef ${fmt(t.reps)} tekrar. Farklı yaptıysan yalnız bu set için değiştir.</p>
        <div class="set-satir">
          <span class="etiket">Tekrar</span>
          <div class="kucuk-stp">
            <button data-step="reps:-1" aria-label="Tekrar azalt">${ik('eksi')}</button>
            <input type="number" inputmode="numeric" step="1" min="1" id="f-reps" value="${tekrar ?? ''}" aria-label="Bu setin tekrarı">
            <button data-step="reps:1" aria-label="Tekrar artır">${ik('arti')}</button>
          </div>
        </div>
        <div class="set-satir">
          <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Hacme ve "geçen sefer"e karışmaz</small></span>
          <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!ctx.draft.warmup}"
                  aria-labelledby="warm-ad" aria-describedby="warm-not">${ctx.draft.warmup ? 'Açık' : 'Kapalı'}</button>
        </div>
        <button class="btn p" data-act="sheet-close">Tamam</button>
      </div>
    </section>`;
}

/* ══ ISINMA EKRANI ════════════════════════════════════════════════════════
   Sayaç YOK, işaret YOK — ekran yalnız GÖSTERİR. Satırlar liste satırının AYNI bileşeni;
   eşit dağılıp ekranı dolduruyorlar (odak ekranıyla aynı "kaymaz" kuralı). */
export function warmupHTML(ctx) {
  const { dayIndex } = ctx;
  const adımlar = N.warmupFor(dayIndex);
  const kaslar = N.DAY_NAMES[dayIndex].split(' — ')[1];

  const satır = adımlar.map(w => `<div class="satir yalin" data-warm="${w.id}">
      <span class="ad"><b>${w.ad}</b><span>${w.not}</span></span>
      <span class="sag"><b>${w.miktar}</b></span>
      <div class="mini sahne3d" data-anim="${w.id}" aria-hidden="true"></div>
    </div>`).join('');

  return `
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${kaslar} · ${N.WARMUP_SURE[dayIndex]} · sete sayılmaz</p></div>
    <div class="liste dagit">
      <div class="satir">
        <span class="durum ikon">${ik('nabiz')}</span>
        <span class="ad"><b>${N.KARDIYO.ad}</b><span>${N.KARDIYO.not}</span></span>
        <span class="sag"><b>${N.KARDIYO.miktar}</b></span>
      </div>
      ${satır}
    </div>
    <div class="alt"><button class="btn p" data-act="warmup-done">Isınma tamam, 1. harekete geç${ik('ileri')}</button></div>`;
}

/**
 * AĞIRLIK ÖNERİSİ — tonlu blok, vurgu rengi YOK (kırmızı yalnız canlıya ayrılı).
 * Bugün önerilen ağırlığa zaten çıkıldıysa gizlenir.
 */
export function oneriHTML(ex, ctx) {
  const o = ctx.oneri?.[ex.id];
  const bugun = ctx.session.entries.find(e => e.exerciseId === ex.id)?.sets;
  if (!I.oneriGecerliMi(o, bugun)) return '';
  const birim = ctx.settings.unit;
  if (o.tur === 'agirlik') return `<div class="oneri">${ik('yildiz')}
      <span>İki seanstır ${o.setler} × ${o.tekrar} tamam: <b>${fmt(o.agirlik)} ${birim}</b> dene</span>
      ${ctx.draft.weight === o.agirlik ? '' : '<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`;
  return `<div class="oneri">${ik('yildiz')}<span>İki seanstır ${fmt(o.agirlik)} ${birim} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(o.adimOrani * 100)}); önce <b>${o.hedefTekrar} tekrara</b> çık.</span></div>`;
}

export function focusHTML(ctx) {
  const { session, dayIndex, idx, settings } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const ex = exs[idx];
  const q = N.exerciseProgress(session, ex, settings);
  const kaydet = kaydetEtiketi(ex, q, ctx);

  const seritler = exs.map((e, i) => {
    const p = N.exerciseProgress(session, e, settings);
    return `<i class="${p.tamam ? 'f' : i === idx ? 'c' : ''}"></i>`;
  }).join('');

  /* Ekran KAYMAZ: sabit bantlar + esneyen tek bölge (görsel).
     Hedef tamamlanınca alt eylem ikiye bölünür — fazladan set / ilerle. */
  return `
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button>
      <div class="orta"><b>${idx + 1} / ${exs.length}</b><span class="seritler" aria-hidden="true">${seritler}</span></div>
      <span class="sag-grup">
        ${q.sets.length ? `<button class="ib" data-act="undo" aria-label="Son seti geri al">${ik('geri-al')}</button>` : ''}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır ve hedef">${ik('soru')}</button>
      </span>
    </div>
    <div class="baslik">
      <h1 lang="en">${ex.en}</h1>
      <p>${ex.tr} · ${N.repsLabel(ex, settings)}</p>
    </div>
    ${vizHTML(ex, q)}
    ${yuvalarHTML(q, ctx, ex)}
    ${girisHTML(ex, ctx)}
    ${ex.setType === 'time' ? `<div class="gecen-bant">${gecenHTML(ex, ctx)}</div>` : ''}
    <div class="foot">
      ${q.tamam
        ? `<div class="cift">
             <button class="btn s" data-act="save">Fazladan set</button>
             ${idx === exs.length - 1
               ? `<button class="btn p" data-act="to-list">Listeye dön</button>`
               : `<button class="btn p" data-act="next">Sonraki hareket${ik('ileri')}</button>`}
           </div>`
        : ex.setType === 'time'
          /* Süre hareketinde asıl eylem BAŞLATMAK; süre dolunca set kendiliğinden kaydedilir */
          ? `<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`
          : `<button class="btn p" data-act="save" id="kaydet-btn">${kaydet}</button>`}
    </div>
    ${gezinmeHTML(ctx)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${sheetHTML(ex, ctx)}
    ${setAyarHTML(ex, ctx)}`;
}

/* ══ SEANS SONU ═══════════════════════════════════════════════════════════
   Antrenmanın son anı. Eskiden bir bildirim şeridiydi ve her 8. seansta yedek hatırlatması
   onu 0,9 sn sonra siliyordu (peak-end kuralı: son an, bütün deneyimin hatırasını belirler).
   Hesap session.seansOzeti'nde (test ediliyor); vurgu yalnız artış ikonunda. */
export function summaryHTML(ctx) {
  const o = ctx.ozet;
  if (!o) return '';
  const birim = ctx.settings.unit;
  const [gün, kaslar] = N.DAY_NAMES[o.dayIndex].split(' — ');
  const fark = o.hacimFarki == null ? '' : (() => {
    const yuzde = Math.abs(o.hacimFarki * 100);
    const deger = yuzde < 0.05 ? 'aynı' : `${o.hacimFarki > 0 ? '+' : '−'}%${fmt(yuzde, 1, 1)}`;
    return `<div class="grup"><div class="ic fark-satir">${ik('grafik')}<span>Geçen ${gün}e göre hacim</span><b>${deger}</b></div></div>`;
  })();
  const artis = !o.artislar.length ? '' : `<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2>
    <div class="ic sira">${o.artislar.map(a => `<div class="ilerleme tek"><b lang="en">${a.ex.en}</b>
      <span>${fmt(a.once)} → <em>${fmt(a.simdi)} ${birim}</em></span></div>`).join('')}</div></div>`;

  return `
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${ik('geri-al')}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    <div class="bitis">
      <span class="durum tamam">${ik('tik')}</span>
      <h1>Seans tamam</h1>
      <p>${gün} · ${kaslar} · ${C.fmtDate(new Date(o.bitis))}</p>
    </div>
    <div class="ozet">
      ${o.sure ? `<div><b>${o.sure}<small>dk</small></b><span>Süre</span></div>` : ''}
      <div><b>${o.calismaSet}<small>set</small></b><span>Set</span></div>
      ${o.kg ? `<div><b>${fmt(o.kg, 0)}<small>${birim}</small></b><span>Hacim</span></div>`
        : o.seconds ? `<div><b>${fmt(o.seconds)}<small>sn</small></b><span>Süre hareketi</span></div>` : ''}
    </div>
    ${fark}${artis}
    ${o.yedekZamani ? `<div class="not">${ik('uyari')}<span>Veri yalnız bu telefonda. <b>Yedek almanın zamanı.</b></span></div>` : ''}
    ${o.sonraki ? `<p class="kucuk-yazi">Sıradaki antrenman: <b>${o.sonraki}</b></p>` : ''}
    <div class="alt"><div class="cift">
      <button class="btn s" data-act="backup">Yedek al</button>
      <button class="btn p" data-act="ozet-tamam">Tamam</button>
    </div></div>`;
}

/* ══ GEÇMİŞ EKRANI ════════════════════════════════════════════════════════
   · TEK SERİ → gösterge yok; başlık neyi çizdiğini söylüyor.
   · VURGU RENGİ YOK: geçmiş canlı değil. Çizgi ikincil tonda, son nokta birincil.
   · İki noktadan azına grafik çizilmez; "tek nokta trend" yalandır. */

/** Tek seri çizgi (+ isteğe bağlı alan dolgusu). Genişliğe yayılır; çizgi ve uç noktası
    ölçeklenmez (non-scaling-stroke), yoksa nokta elips olurdu. */
function sparkHTML(vals, { w = 280, h = 72, alan = true } = {}) {
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const pay = (mx - mn) * 0.18 || Math.max(1, mx * 0.02);   // düz seri de ortada dursun
  const alt = mn - pay, ust = mx + pay;
  const m = 4;
  const X = i => m + (i / (vals.length - 1)) * (w - 2 * m);
  const Y = v => m + (h - 2 * m) - ((v - alt) / (ust - alt)) * (h - 2 * m);
  const yol = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const sx = X(vals.length - 1).toFixed(1), sy = Y(vals.at(-1)).toFixed(1);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"
      aria-label="${vals.length} ölçüm: ${fmt(vals[0])} → ${fmt(vals.at(-1))}">
    ${alan ? `<path class="alan-dolgu" d="${yol} L${sx} ${h} L${X(0).toFixed(1)} ${h} Z"/>` : ''}
    <path class="cizgi" d="${yol}"/>
    <path class="uc" d="M${sx} ${sy} h0"/>
  </svg>`;
}

const kiloDelta = kilolar => {
  if (kilolar.length < 2) return '';
  const d = kilolar.at(-1).kg - kilolar[0].kg;
  const gun = Math.round((kilolar.at(-1).ts - kilolar[0].ts) / 86400000);
  const sure = gun >= 14 ? `${Math.round(gun / 7)} hafta` : `${gun} gün`;
  if (Math.abs(d) < 0.05) return `<span class="fark">değişmedi · ${sure}</span>`;
  return `<span class="fark">${d > 0 ? '+' : '−'}${fmt(Math.abs(d), 1, 1)} kg · ${sure}</span>`;
};

export function historyHTML(ctx) {
  const { kilolar = [], gecmis = [], ilerleme = [], settings } = ctx;
  const son = kilolar.at(-1);

  const kiloBolum = `
    <div class="grup"><h2 class="etiket">Kilo</h2><div class="ic">
      ${son ? `<div class="kilo"><b>${fmt(son.kg, 1, 1)}</b><em>kg</em>${kiloDelta(kilolar)}</div>
               ${sparkHTML(kilolar.map(k => k.kg))}
               <p>${kilolar.length} ölçüm · son giriş ${C.relativeLabel(new Date(son.ts))}</p>`
            : '<p>Henüz kilo kaydı yok. Aşağıya yazınca burada takip edilir.</p>'}
      <div class="alan kilo-gir">
        <label for="h-weight">Bugün</label>
        <label class="kutucuk"><input type="number" id="h-weight" inputmode="decimal" step="0.1" min="20" max="400"
               value="${son && son.d === dayKey() ? son.kg : ''}" placeholder="—" aria-label="Bugünkü kilo"><small>kg</small></label>
        <button class="cip" data-act="weight-save">Kaydet</button>
      </div>
    </div></div>`;

  const seansBolum = `
    <div class="grup"><h2 class="etiket">Son seanslar</h2>
      ${gecmis.length ? `<div class="ic sira">${gecmis.map(r => `
        <button class="seans" data-seans="${esc(r.id)}" aria-label="${C.fmtShort(new Date(r.at))} seansını düzenle">
          <span class="tarih2">${C.fmtShort(new Date(r.at))}</span>
          <span class="g">${N.DAY_NAMES[r.dayIndex].split(' — ')[0]}</span>
          ${r.kayitsiz ? '<span class="etk kyt">kayıtsız</span>' : r.yarim ? '<span class="etk">yarım</span>' : ''}
          <span class="sag">${r.kayitsiz ? '—' : `${r.yapilan}/${r.toplam} · <b>${fmt(r.hacim.kg, 0)} ${settings.unit}</b>`}</span>
        </button>`).join('')}</div>`
        : '<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`;

  const ilerlemeBolum = `
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${ilerleme.length ? `<div class="ic sira">${ilerleme.map(p => `
        <div class="ilerleme">
          <b lang="en">${p.ex.en}</b>
          <span>${fmt(p.seri[0].v)} → <em>${fmt(p.seri.at(-1).v)} ${p.birim}</em></span>
          ${sparkHTML(p.seri.map(s => s.v), { w: 280, h: 18, alan: false })}
        </div>`).join('')}</div>
        <p class="kucuk-yazi grup-alti">${ilerleme.length} hareket · çizgi en fazla son ${Math.max(...ilerleme.map(p => p.seri.length))} seansı gösterir.</p>`
        : '<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`;

  return `
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Geçmiş</h1></div>
    ${kiloBolum}${seansBolum}${ilerlemeBolum}`;
}

/* ══ SEANS DÜZENLEME EKRANI ═══════════════════════════════════════════════
   Yanlış girilen ağırlık ömür boyu kalıyordu; düzeltme burada.
   Alan bırakılınca kaydeder (her tuşta değil) — "4" yazarken 4 kg diske inmesin diye. */
export function sessionEditHTML(ctx) {
  const { duzenlenen: d, settings } = ctx;
  if (!d) return `<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${ik('geri')}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;

  const gunAdi = N.DAY_NAMES[d.dayIndex].split(' — ')[0];
  const bloklar = N.exercisesFor(d.dayIndex).map(ex => {
    const e = d.entries.find(x => x.exerciseId === ex.id);
    if (!e?.sets.length) return '';
    const adim = I.agirlikAdimi(ex, settings) ?? I.GIRIS_ADIMI_YEDEK;
    /* Numaralar odak ekranıyla AYNI kurala uyar: yalnız ÇALIŞMA setleri sayılır,
       ısınma numarasızdır. `i` yalnız veri adresidir. */
    let no = 0;
    const satirlar = e.sets.map((s, i) => {
      const alanlar = s.type === 'time'
        ? [['seconds', s.seconds, 'sn', 5]]
        : s.type === 'cardio'
          ? [['minutes', s.minutes, 'dk', 5]]
          : [['weight', s.weight, settings.unit, adim], ['reps', s.reps, 'tekrar', 1]];
      const et = s.warmup ? 'ısınma' : `${++no}.`;
      return `<div class="eset">
        <span class="eno">${s.warmup ? 'ıs' : no}</span>
        ${alanlar.map(([alan, deger, birim, a]) => `
          <label class="efield">
            <input type="number" inputmode="decimal" step="${a}" min="0"
                   value="${deger ?? ''}" placeholder="—"
                   data-eset="${ex.id}:${i}:${alan}" aria-label="${ex.tr} ${et} set ${birim}">
            <span class="eunit">${birim}</span>
          </label>`).join('')}
        <button class="esil" data-eset-sil="${ex.id}:${i}" aria-label="${et} seti sil">${ik('sil')}</button>
      </div>`;
    }).join('');
    return `<div class="grup"><h2 class="etiket" lang="en">${ex.en}</h2><div class="ic sira">${satirlar}</div></div>`;
  }).join('');

  const v = N.summaryVolume(d);
  return `
    <div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${ik('geri')}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik">
      <h1>${gunAdi}</h1>
      <p>${C.fmtShort(new Date(d.finishedAt ?? d.startedAt))} · ${v.sets} set · ${fmt(v.kg, 0)} ${settings.unit}</p>
    </div>
    <p class="aciklama">Bir değeri düzeltmek için üstüne yaz; alandan çıkınca kaydedilir. Hacim, "geçen sefer"
      ve ilerleme çizgisi kendiliğinden yeniden hesaplanır.</p>
    ${bloklar}
    <div class="grup"><div class="ic">
      <button class="btn s" data-act="seans-sil">Bu seansı sil</button>
      <p>Silinen seans geçmişten kalkar, sıra yeniden hesaplanır. Geri getirebilirsin.</p>
    </div></div>`;
}

/* ══ AYARLAR EKRANI ═══════════════════════════════════════════════════════
   Yalnız GERÇEKTEN çalışan ayarlar burada. `settings` nesnesinde duran ama hiçbir kod
   yolunun okumadığı iki alan bilerek DIŞARIDA:
     unit   → yalnızca ETİKET, dönüşüm yok; "lbs" seçeneği YALAN söylerdi.
     theme  → hiçbir yerde okunmuyor; uygulama bilinçli olarak tek (koyu) temalı.
   Kural: arayüz, arkasındaki gerçeğin üstünde vaat veremez. */

const GUN_SEC = [1, 2, 3, 4, 5, 6, 0];        // Pzt…Paz — hafta Pazartesi başlar
const DINLENME = [30, 45, 60, 90, 120];

/**
 * TELEFONA YÜKLE — üç hâl: yüklü (bilgi) · Chrome istem verdi (düğme) · istem yok (menü yolu).
 * "İstem yok" iki şey olabilir: zaten yüklü ama tarayıcı sekmesinde açılmış, ya da Chrome henüz
 * sunmadı / reddedildi. Tarayıcı ikisini ayırt ettirmez → metin ikisini de karşılar.
 */
function kurulumHTML(k = {}) {
  const ic = k.kurulu
    ? '<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>'
    : k.istem
      ? `<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`
      : `<p>Chrome menüsünden (⋮) <b>Uygulamayı yükle</b>'yi seç. Zaten yüklüyse ana ekrandaki
           FitSet simgesinden aç.</p>`;
  return `<div class="grup"><h2 class="etiket">Uygulama</h2><div class="ic">${ic}</div></div>`;
}

export function settingsHTML(ctx) {
  const { settings } = ctx;
  const seciliGunler = settings.trainingDays ?? [];

  const gunler = GUN_SEC.map(g => `
    <button class="cip" data-gun="${g}" aria-pressed="${seciliGunler.includes(g)}" aria-label="${C.GUN[g]}">${C.GUN_KISA[g]}</button>`).join('');

  const sonraki = C.upcoming(new Date(), seciliGunler, 3);
  const sonrakiMetin = sonraki.length ? `<b>${sonraki.map(d => C.fmtShort(d)).join(' · ')}</b>`
    : 'Hiç gün seçili değil; takvim çalışmaz.';

  const dinlenme = DINLENME.map(sn => `
    <button data-rest="${sn}" aria-pressed="${settings.restSeconds === sn}" aria-label="${sn} saniye">${sn}</button>`).join('');
  const basit = !!settings.basitGorunum;
  const gorunum = [['tam', 'Tam', false], ['basit', 'Basit', true]].map(([k, ad, b]) => `
    <button data-gorunum="${k}" aria-pressed="${basit === b}">${ad}</button>`).join('');
  const dambil = I.DAMBIL_ADIMLARI.map(a => `
    <button data-dambil="${a}" aria-pressed="${settings.dambilAdimi === a}">${fmt(a)} kg</button>`).join('');

  return `
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Antrenman günleri</h2><div class="ic">
      <div class="cipler">${gunler}</div>
      <p>Sıradaki: ${sonrakiMetin}</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setler arası dinlenme</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dinlenme süresi">${dinlenme}</div>
      <p>Saniye. Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Dambıl adımı</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dambıl adımı">${dambil}</div>
      <p>Salondaki dambıl setinde bir sonraki ağırlık. Bar 2,5 kg, makine ve kablo 5 kg adımla ilerler.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hareket çizimi</h2><div class="ic">
      <div class="segment" role="group" aria-label="Hareket çizimi">${gorunum}</div>
      <p>${basit && settings.basitOto ? 'Bu telefonda ayrıntılı manken yavaş çizildiği için basit görünüm kendiliğinden açıldı. '
        : ''}Basit görünüm daha hafif bir manken çizer, pili korur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Vücut</h2><div class="ic">
      <div class="alan">
        <label for="s-height">Boy</label>
        <label class="kutucuk"><input type="number" id="s-height" inputmode="numeric" min="100" max="250" step="1"
               value="${settings.heightCm ?? ''}" placeholder="—" aria-label="Boy (cm)"><small>cm</small></label>
      </div>
      <p>Kilo takibi Geçmiş ekranında.</p>
    </div></div>

    ${kurulumHTML(ctx.kurulum)}

    <div class="grup"><h2 class="etiket">Yedek</h2><div class="ic">
      <p>Veri yalnız bu telefonda; sunucuya hiçbir şey gönderilmez. Telefonu değiştirirsen ya da tarayıcı
        verisini silersen <b>her şey gider</b>; arada bir yedek al.</p>
      <div class="cift">
        <button class="btn s" data-act="import">Geri yükle</button>
        <button class="btn s" data-act="backup">Yedek al</button>
      </div>
    </div></div>

    <div class="grup"><h2 class="etiket">Bugünkü seans</h2><div class="ic">
      <button class="btn s" data-act="reset-day">Bugünü sıfırla</button>
      <p>Bugün girilen setleri siler. Hemen ardından geri getirebilirsin.</p>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0).</p>`;
}
