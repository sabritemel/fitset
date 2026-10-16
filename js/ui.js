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
import * as RK from './rekorlar.js';
import { GRUPLAR, EKIPMAN, SET_TURU } from './program.js';
import { HAZIR, SORULAR, oner, hazirBul } from './data/hazir.js';
import { AD, SURUM } from './marka.js';
import * as AV from './avatar.js';
import { KURULUM_TARIFI, bantGoster } from './kurulum.js';
import * as H from './hazirlik.js';

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

/**
 * HAREKET ADI (Faz 1A, K6): Türkçe kısa ad BÜYÜK, İngilizce altta. Eskiden İngilizce birincildi;
 * Türkiye'deki yeni başlayan için ters. Özel harekette İngilizce ad yoktur.
 */
export const adi = ex => esc(ex.ad ?? ex.tr ?? ex.en ?? '');
const ingilizce = ex => (ex.en && ex.en !== (ex.ad ?? ex.tr)) ? `<span lang="en">${esc(ex.en)}</span>` : '';
/** 3B çizimi olmayan hareket: kullanıcının özel hareketi ya da tanımı kaybolmuş kayıt */
export const cizimsiz = ex => !!(ex.ozel || ex.bilinmeyen);

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
  const sonRir = lp.sets.at(-1)?.rir;   // G1: kaydedildiyse son setin RIR'ı
  return `Geçen sefer · ${C.relativeLabel(new Date(lp.at))} · ${setler}${sonRir != null ? ` · son set RIR ${sonRir}` : ''}`;
}

/* ══ LİSTE EKRANI ═════════════════════════════════════════════════════════ */

/* G4 (17 Eki) TOPARLANMA KONTROLÜ — "Bugün nasılsın?" (js/hazirlik.js). Seans başlamadan (set ve ısınma yok) bir kez,
   günde bir; "Geç" ile atlanır, Ayarlar'dan kapanır. Modal DEĞİL: liste altında görünür kalır. Öneri dili "kal / hafiflet /
   dinlen"; kırmızı ve kayıp dili yok. "Hafiflet" yalnız sporcu basarsa bugünün set sayısını düşürür ve geri alınır. */
export function hazirlikGoster(ctx) {
  const { session, settings } = ctx;
  if (ctx.hazirlik) return true;                                         // cevaplanıyor
  return settings.hazirlikSor !== false && settings.hazirlikGunu?.d !== dayKey()
    && !N.hasAnySet(session) && !session.warmupDone && !session.hazirlik;
}
function hazirlikHTML(ctx) {
  const az = ctx.session.hazirlik?.azalan;
  if (az?.length && !ctx.hazirlik) return `<div class="not hafif-not">${ik('nabiz')}<span>Bugün ${az.length} harekette birer set az
      (toparlanma kontrolü). <button class="bag" data-act="hz-geri">Programdaki gibi yap</button></span></div>`;
  if (!hazirlikGoster(ctx)) return '';
  const c = ctx.hazirlik?.cevap ?? {}, o = H.degerlendir(c);
  const sorular = H.SORULAR.map(s => `<div class="hz-soru"><p>${esc(s.soru)}</p>
      <div class="segment" role="group" aria-label="${esc(s.soru)}">${s.secenekler.map(([v, ad]) =>
        `<button data-hz="${s.id}:${v}" aria-pressed="${c[s.id] === v}">${ad}</button>`).join('')}</div></div>`).join('');
  const sonuc = !o ? '' : `<div class="hz-sonuc ${o.duzey}" role="status"><b>${o.baslik}</b><p>${o.metin}</p>
      ${o.duzey === 'hafif'
        ? `<div class="cift dikey"><button class="btn p" data-act="hz-hafif">Hareketlerde birer set az yap</button>
             <button class="btn s" data-act="hz-tamam">Programdaki gibi devam et</button></div>`
        : `<button class="btn ${o.duzey === 'uy' ? 'p' : 's'}" data-act="hz-tamam">Tamam</button>`}</div>`;
  return `<div class="grup hazirlik"><h2 class="etiket">Bugün nasılsın?</h2><div class="ic">
      ${sorular}${sonuc}
      ${o ? '' : `<button class="bag hz-gec" data-act="hz-gec">Bugün sorma</button>`}
      <p class="kucuk-yazi">${esc(H.KART_NOTU)}</p>
    </div></div>`;
}

/* YARIM KALAN GÜN BANDI — modal DEĞİL: ekranı kilitlemez, altındaki program görünür kalır. */
const carryHTML = y => !y ? '' : `
  <div class="grup carry"><div class="ic">
    <p class="baslik-satir">${N.gunEtiketiSeans(y.session).kisa} yarım kaldı</p>
    <p class="alt-satir">${C.relativeLabel(new Date(y.session.finishedAt ?? y.session.startedAt))}
      · ${y.yapilan}/${y.toplam} hareket</p>
    <p>${y.kalan.map(adi).join(' · ')}</p>
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
  const bugunAdi = N.gunEtiketi(dayIndex).kisa;
  if (!izin.ok) return `<div class="grup picker"><div class="ic">
    <p>Bugün set girdin; günü değiştirmek bu setleri yanlış güne bağlardı. Önce <b>Seansı bitir</b>
      ya da Ayarlar'dan <b>Bugünü sıfırla</b>.</p></div></div>`;

  const secenekler = N.allDays().map(g => {
    // Gün adı kullanıcı metnidir (elle ya da yedekten): kaçışlı. Adı " — " ile bölmek, adın içinde
    // aynı ayraç geçince kası kesiyordu — etiket doğrudan alınır.
    const { kisa, kaslar } = N.gunEtiketi(g.dayIndex);
    return `<button class="pick" data-gun-sec="${g.dayIndex}" aria-pressed="${g.dayIndex === dayIndex}">
      <span class="pick-ad">${kisa}</span><span class="pick-kas">${esc(kaslar)}</span>
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
  const ana = `<button class="btn p iki" data-go="${eylem.idx}" aria-label="${ust}: ${adi(ex)}">
      <span><small>${ust}</small><b>${adi(ex)}</b></span></button>`;
  return setVar ? `<div class="cift"><button class="btn s" data-act="finish" aria-label="Seansı bitir">Bitir</button>${ana}</div>` : ana;
}

export function listHTML(ctx) {
  const { session, dayIndex, settings, status, yarim, oncekiYapilan, gunSecici, lastPerf = {} } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const p = N.progress(session, dayIndex, settings);
  const v = N.summaryVolume(session);
  const dk = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
  const { kisa: gün, kaslar } = N.gunEtiketi(dayIndex);
  const eylem = N.siradakiEylem(session, dayIndex, settings);
  const simdi = eylem.tur === 'hareket' ? eylem.idx : -1;

  const satirlar = exs.map((ex, i) => {
    const q = N.exerciseProgress(session, ex, settings);
    // Devredilen günde geçen sefer YAPILMIŞ olanı söyle — ama setlerini KOPYALAMA.
    const gecen = oncekiYapilan?.has(ex.id);
    const sinif = [q.tamam && 'bitti', i === simdi && 'simdi', gecen && !q.calisma && 'onceki'].filter(Boolean).join(' ');
    return `<button class="satir${sinif ? ' ' + sinif : ''}" data-go="${i}">
      ${durumHTML(q)}
      <span class="ad"><b>${adi(ex)}</b>${gecen && !q.calisma ? '<span>geçen sefer yapıldı</span>' : ingilizce(ex)}</span>
      <span class="sag">${satirSag(ex, q, lastPerf[ex.id], settings)}</span>
    </button>`;
  }).join('');

  /* ISINMA — numarasız İLK satır; sete ve hacme sayılmaz */
  const isinma = `<button class="satir${session.warmupDone ? ' bitti' : ''}" data-act="warmup">
    <span class="durum ${session.warmupDone ? 'tamam' : 'ikon'}">${ik(session.warmupDone ? 'tik' : 'alev')}</span>
    <span class="ad"><b>Isınma</b><span>${N.warmupFor(dayIndex).length + 1} adım · ${N.isinmaSuresi(dayIndex)}</span></span>
    <span class="sag">${session.warmupDone ? 'yapıldı' : 'başla'}</span>
  </button>`;

  /* Bitiş kardiyosu yalnız "Benim programım"ın günlerinde; yeni programın gününde satır yok */
  const f = N.finisherFor(dayIndex);
  const [fAd, fSure] = f ? f.h.split(' — ') : [];
  const bitis = !f ? '' : `<div class="satir">
    <span class="durum ikon">${ik('nabiz')}</span>
    <span class="ad"><b>${fAd}</b><span>${f.p}</span></span>
    <span class="sag"><b>${fSure ?? ''}</b>bitişte</span>
  </div>`;

  return `
    <div class="ust liste-ust">
      <span class="tarih">${status.label}</span>
      <span class="tarih">${esc(N.aktifProgram().ad)}</span>
    </div>
    <button class="cip gun-cip" data-act="gun-ac" aria-expanded="${!!gunSecici}" aria-label="Günü değiştir: ${gün}">
      ${gün}${ik(gunSecici ? 'yukari' : 'asagi')}</button>
    <div class="gun-baslik"><h1>${esc(kaslar)}</h1></div>
    ${kurulumBantHTML(ctx)}
    ${hazirlikHTML(ctx)}
    ${status.isTrainingDay ? '' : `<div class="not">${ik('takvim')}<span>Program günü değil; yine de kaydedebilirsin.
      Sıradaki antrenman <b>${status.next ? C.fmtShort(status.next) : '—'}</b>.</span></div>`}
    ${gunSeciciHTML(ctx)}
    <div class="ozet">
      <div><b>${p.done}<small>/${p.total}</small></b><span>Set</span></div>
      <div><b>${fmt(v.kg, 0)}<small>${settings.unit}</small></b><span>Hacim</span></div>
      <div><b>${dk}<small>dk</small></b><span>Süre</span></div>
    </div>
    ${carryHTML(yarim)}
    ${exs.length ? `<div class="liste">${isinma}${satirlar}${bitis}</div>
    <div class="alt alt-sekmeli">${listeEylemi(ctx, eylem, exs)}</div>`
    : `<div class="grup"><div class="ic"><p>Bu günde henüz hareket yok.</p>
        <button class="btn s" data-program-ac="${esc(N.aktifProgram().id)}">Programı düzenle</button></div></div>`}
    ${sekmelerHTML('bugun')}`;
}

/* ══ ODAK EKRANI ══════════════════════════════════════════════════════════ */

/**
 * Hareket görseli — 3B sahne kapları; çizimi app.js yapar (anim3d/sahne.js).
 * İzometrik harekette (plank) oynatacak hareket yok, öğretici olan doğru ile yanlış
 * arasındaki FARK. Ama bu öğrenirken lazım, her sette değil: İLK SET kaydedilince yalnız
 * doğru duruş kalır, hatalar ? paneline geçer (Sabri, 27 Eyl).
 */
function vizHTML(ex, q, ek = '') {
  if (cizimsiz(ex)) return `<div class="fig"><div class="sahne3d cizimsiz" role="img" aria-label="${adi(ex)}: çizim yok">
      ${ik('figur')}<span>${ex.ozel ? 'Özel hareket · çizimi yok' : 'Bu hareketin tanımı bulunamadı'}</span></div></div>`;
  if (ex.hold) {
    const dogru = Math.max(0, ex.variants.findIndex(v => v.ok));
    if (q.calisma >= 1) return `<div class="fig">
        <div class="sahne3d" data-varyant="${dogru}" role="img" aria-label="${adi(ex)}: doğru duruş"></div>
        <p class="fig-not">${ik('tik')}${ex.variants[dogru].note} · hatalar ? panelinde</p>${ek}
      </div>`;
    return `<div class="variants">${ex.variants.map((v, i) => `<figure class="${v.ok ? 'ok' : ''}">
        <div class="sahne3d" data-varyant="${i}" aria-hidden="true"></div>
        <figcaption><b>${ik(v.ok ? 'tik' : 'carpi')}${esc(v.label)}</b><span>${esc(v.note)}</span></figcaption>
      </figure>`).join('')}</div>`;
  }
  /* ZEMİN (11 Eki, Sabri): ağırlık × tekrarda figür büyür ve aşağıda kontrollerin ARKASINA uzanır;
     alt kenarı zemine doğru solar. Üstten kesilmez — başlığın altında başlar. */
  return `<div class="fig${ex.setType === 'weight_reps' ? ' zemin' : ''}">
    <div class="sahne3d" id="fig3d" role="img" aria-label="${adi(ex)} hareket çizimi; sürükleyerek döndürülür"></div>${ek}
  </div>`;
}

/* REKOR ROZETİ (14 Eki, K4): rekor seti kaydedilince 4 sn, sessiz (ses/konfeti/açılır pencere yok — rakip araştırması). */
const ROZET_TUR = { agir: 'en ağır set', bir: 'tahmini 1RM', hacim: 'set hacmi', tekrar: 'en çok tekrar', sure: 'en uzun süre' };
function rozetHTML(ctx, ex) {
  const r = ctx.rozet;
  if (!r || r.exId !== ex.id || Date.now() > r.bitis) return '';
  // tekrarda birim yazılmaz ("en çok tekrar 7 tekrar" yinelemesi — canlı denemede görüldü)
  const deger = r.tur === 'tekrar' ? fmt(r.simdi) : rekorDeger(r.tur, r.simdi, ctx.settings.unit);
  return `<div class="rekor-rozet" role="status">${ik('yildiz')}<span>Yeni rekor · <em>${ROZET_TUR[r.tur]} ${deger}</em></span></div>`;
}

/* RIR SORUSU (G1, 17 Eki): ağırlıklı çalışma seti kaydedilince "kaç tekrar daha yapabilirdin?" — tek dokunuş, 15 sn sonra
   kendiliğinden kalkar; cevaplamak zorunlu değil. Programda hedef RIR verilen harekette ya da Ayarlar'da açılınca sorulur;
   hedef RIR çipi işaretli. Rozet gibi figürün içinde durur — ekranın düzeni kaymaz. */
function rirSorHTML(ctx, ex) {
  const r = ctx.rirSor;
  if (!r || r.exId !== ex.id || Date.now() > r.bitis) return '';
  const hedef = N.effective(ex, ctx.settings).rir;
  return `<div class="rir-sor" role="group" aria-label="Bu sette kaç tekrar daha yapabilirdin?">
      <span>Kaç tekrar daha yapabilirdin?</span>
      <div class="rir-cipler">${RIR_SECENEK.map(v => `<button class="cip${v === hedef ? ' hedef' : ''}" data-rir="${v}" aria-label="RIR ${v}${v === 4 ? ' ya da daha çok' : ''}${v === hedef ? ' (hedef)' : ''}">${v === 4 ? '4+' : v}</button>`).join('')}
        <button class="rir-kapat" data-rir="x" aria-label="Sorma, kapat">${ik('carpi')}</button></div>
    </div>`;
}

/** G4 (17 Eki): harekete NOT — makine ayarı, his. Bugünkü not yazılır; boşsa en son notun ipucu olarak görünür.
 *  Alan bırakılınca kaydedilir (app.js change). */
function notAlaniHTML(ex, ctx) {
  const bugun = ctx.session?.entries.find(e => e.exerciseId === ex.id)?.note ?? '';
  const son = ctx.lastPerf?.[ex.id]?.not;
  return `<div class="not-alani">
      <label class="etiket" for="ex-not">Notun</label>
      <textarea id="ex-not" data-not="${esc(ex.id)}" maxlength="${N.NOT_SINIR}" rows="2"
        placeholder="${son ? esc(son) : 'Ör. koltuk 4. delik · sol omuz biraz gergin'}">${esc(bugun)}</textarea>
      ${son ? `<p class="kucuk-yazi">Gri yazı son notun; bugüne kaydedilmez. Bugün için yeni not yazabilirsin.</p>` : ''}
    </div>`;
}

/**
 * Kayan panel — hedef ayarları + anlatım. Kapalıyken `inert`: ekran dışında dursa da
 * içindeki kontroller odak sırasına girmesin (eskiden aria-hidden ama 11 kontrol odaklanabiliyordu).
 */
function sheetHTML(ex, ctx) {
  const t = N.effective(ex, ctx.settings);

  /* Ağırlık önerisi burada (Sabri, 27 Eyl: ana ekranda görünmesin) — hedefin hemen üstünde,
     çünkü ikisi aynı soruya bakar: bu harekette hangi yüke çıkmalıyım? */
  return `<section class="sheet" id="sheet" aria-hidden="true" inert aria-label="Hedef ve anlatım">
      <button class="grab" data-act="sheet-close" aria-label="Kapat"></button>
      <div class="sheet-in">
        <h2>${adi(ex)}</h2>
        ${ex.en ? `<p class="alt-baslik" lang="en">${esc(ex.en)}</p>` : ''}
        ${notAlaniHTML(ex, ctx)}
        ${isinmaAnahtariHTML(ex, ctx)}
        ${oneriHTML(ex, ctx)}
        <div class="goal">
          <div class="goal-hd">
            <span class="etiket">Hedef · ${esc(N.aktifProgram().ad)}</span>
            ${t.edited ? '<button class="cip" data-act="goal-reset">Programa dön</button>' : ''}
          </div>
          ${hedefHTML(ex, ctx)}
          <button class="btn p" data-act="goal-save">Hedefi kaydet</button>
          <p class="goal-note">Hedef <b>${esc(N.aktifProgram().ad)}</b> içindeki bu hareketin hedefidir; kaydedince program
            da değişir. Ağırlık boş kalırsa kutu geçen seferki değerle dolar.</p>
        </div>
        <h3>Çalışan kaslar</h3>
        <p class="mus">${esc(ex.mus || ex.grup || '—')}</p>
        ${ex.steps?.length ? `<h3>Nasıl yapılır</h3>
        <ol class="steps">${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        ${ex.hold ? `<h3>Doğru duruş ve yaygın hatalar</h3>
          <ul class="hatalar">${ex.variants.map(v => `<li><b>${esc(v.label)}</b><span>${esc(v.note)}</span></li>`).join('')}</ul>` : ''}
        ${ex.tip ? `<h3 class="tip-bas">${ik('uyari')}Dikkat</h3>
        <p>${esc(ex.tip)}</p>` : ''}
        ${ilkAgirlikNotu(ex) ? `<p class="kucuk-yazi">${ilkAgirlikNotu(ex)}</p>` : ''}
        <p class="kucuk-yazi">${GUVENLIK_NOTU}</p>
      </div>
    </section>`;
}

/**
 * ALT BANT — yüksekliği SABİT (css). Boşta: önceki · dinlenme · sonraki.
 * Dinlenme çalışırken yan gezinme ÇEKİLİR ve bant tümüyle sayaca döner: +30 · kalan · geç.
 * ⚠️ Eskiden sayaç 19 px'ti (değişmeyen ağırlık 76 px) ve "+30" ~26 px'lik bir hedef olarak
 * "Sonraki →"nın hemen yanında duruyordu: dinlenme ortasında yanlış dokunuş hareketi değiştiriyordu.
 */
/** Şimdiki hareketin dinlenmesi (G1: programın kalemi, yoksa genel ayar) */
const dinlenmeOf = ctx => { const ex = N.exercisesFor(ctx.dayIndex)[ctx.idx]; return ex ? N.dinlenmeSuresi(ex, ctx.settings) : ctx.settings.restSeconds; };
export function gezinmeHTML(ctx, kalan = null, toplam = 0) {
  if (kalan === null) {
    const son = N.exercisesFor(ctx.dayIndex).length - 1;
    return `<div class="gezinme" id="gezinme">
      <button data-act="prev" ${ctx.idx === 0 ? 'disabled' : ''} aria-label="Önceki hareket">${ik('geri')}Önceki</button>
      <button class="dinlenme" data-act="rest">${ik('saat')}Dinlenme ${dinlenmeOf(ctx)} sn</button>
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

/* ══ SET GİRİŞİ (11 Eki, Sabri'nin onayladığı tasarım — mockup-kontroller.html) ══════════════
   Antrenmanda SADE: iki değer + bugünkü set sayısı üç sütunda (SET · TEKRAR · AĞIRLIK), her biri
   ▲ sayı ▼. Oklar sütun genişliğinde (eldivenle basılır), basılı tutunca hızlanır, sayıya dokununca
   klavye açılır. Değerler hedeften ve geçen seferden DOLU gelir: çoğu sette doğrudan "Seti kaydet".
   Eski "Bu set" paneli (tekrar + ısınma) kalktı: tekrar ana ekranda, ısınma seti "?" panelinde. */

const IPUCU = { dumbbell: 'tek dambıl', barbell: 'bar dahil', machine: 'makinede seçili' };

/** Bar plakaları — standart 20 kg bar, 25…1,25 kg plakalar (kg biriminde) */
export const BAR_KG = 20;
const PLAKALAR = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Ağırlığın altındaki tek satır. Barda "her yana 20 + 1,25" — salonda en sık yapılan hesap;
 * plakalarla tam kurulamayan ağırlıkta ve kg dışındaki birimde yalnız "bar dahil" der (uydurmaz).
 */
export function plakaYazi(ex, kg, birim) {
  // K5 (1B dalga 2): vücut ağırlığında alan EK ağırlıktır (kemer, yelek) — boşken 0'ın anlamını söyler
  if (ex.equipment === 'bodyweight') return +kg > 0 ? 'ek ağırlık' : 'ek ağırlık · 0 = yalnız vücut';
  if (ex.equipment !== 'barbell') return IPUCU[ex.equipment] ?? '';
  const v = +kg;
  if (birim !== 'kg' || kg == null || kg === '' || !Number.isFinite(v)) return 'bar dahil';
  if (v < BAR_KG) return `boş bar ${BAR_KG} kg`;
  let yan = (v - BAR_KG) / 2;
  const takilan = [];
  for (const p of PLAKALAR) while (yan >= p - 1e-9) { takilan.push(p); yan -= p; }
  if (yan > 1e-9) return 'bar dahil';
  return takilan.length ? `her yana ${takilan.map(p => fmt(p)).join(' + ')}` : 'yalnız bar';
}

/** Tekrarın altı: her zaman tek satır "Hedef 12" (13 Eki, Sabri: sapma satırı yok — sayı zaten üstte) */
export const tekrarAlt = (ex, ctx) => { const t = N.effective(ex, ctx.settings); return `Hedef <b>${t.repsMin ? `${t.repsMin}-` : ''}${fmt(t.reps)}</b>`; };   // G1: aralık

/** SET sütununun altı: her zaman programdaki set sayısı — "Hedef 5" (bugünkü sayı farklı olsa da) */
const setAlt = program => `Hedef <b>${program}</b>`;

/** Kaydet düğmesinin etiketi — ısınma seçiliyse onu söyler (ayar "?" panelinde, durum ekranda görünmeli) */
export function kaydetEtiketi(ex, q, ctx) {
  if (ex.setType === 'time') return 'Süreyi kaydet';
  return ctx.draft.warmup ? 'Isınma setini kaydet' : 'Seti kaydet';
}

/** Set ilerleme satırının yazısı: "3. set · 5 setten" · ısınma · bitti */
export function setEtiketi(q, ctx) {
  if (q.tamam) return 'Bütün setler tamam';
  if (ctx.draft.warmup) return '<b>Isınma</b> seti · sete sayılmaz';
  const isinma = q.sets.filter(s => s.warmup).length;
  return `<b>${q.calisma + 1}.</b> set · ${q.hedef} setten${isinma ? ` · ısınma ×${isinma}` : ''}`;
}

/** Set ilerlemesi: yazı + set başına çubuk (yapılan · şimdiki (vurgu) · kalan) */
function setIlerlemeHTML(q, ctx, ex) {
  const n = Math.max(q.hedef, q.calisma);
  // Rekor seti kutusunda yıldız (14 Eki): her çizimde aynı kuraldan — önceki seanslar + bugün bu setten öncekiler
  const taban = ctx.rekorTaban?.[ex?.id], ws = q.sets.filter(s => !s.warmup);
  const rekor = i => !!taban && !!RK.setRekoru(ws[i], [...taban, ...ws.slice(0, i)]);
  // Dil 4: kutu numaralı; biten ✓, şimdiki mercan (çubuktan daha okunaklı — Stitch mokabı, Sabri seçti)
  const cubuk = Array.from({ length: n }, (_, i) => i < q.calisma ? (rekor(i) ? `<i class="bitti rekor">${ik('yildiz')}</i>` : `<i class="bitti">${ik('tik')}</i>`)
    : `<i class="${i === q.calisma ? 'simdi' : ''}">${i + 1}</i>`).join('');
  return `<div class="set-ilerleme"><span id="set-etiket">${setEtiketi(q, ctx)}</span><span class="cubuk" aria-hidden="true">${cubuk}</span></div>`;
}

/** Bir sütun (dil 4): ▲ · ad · değer · tek satır bilgi · ▼ */
const sutun = ({ ad, deger, alt, artir, azalt, etiket, sinif = '', azaltPasif = false }) => `
  <div class="sutun ${sinif}">
    <button class="ok" ${artir} aria-label="${etiket} artır">${ik('yukari')}</button>
    <span class="etk">${ad}</span>
    ${deger}
    <span class="s-alt">${alt}</span>
    <button class="ok" ${azalt} aria-label="${etiket} azalt"${azaltPasif ? ' disabled' : ''}>${ik('asagi')}</button>
  </div>`;

/**
 * SET · TEKRAR · AĞIRLIK. Kimlikler (#f-reps, #f-weight) kayıt koduyla aynı: kaydet onları okur.
 * SET yalnız BUGÜNÜ değiştirir (seans `setHedefi`), şimdiki setin altına inmez.
 */
function sutunlarHTML(ex, q, ctx) {
  const { settings } = ctx, t = N.effective(ex, settings);
  const adim = I.agirlikAdimi(ex, settings) ?? I.GIRIS_ADIMI_YEDEK;
  const kg = ctx.draft.weight, birim = settings.unit;
  const kgYazi = kg == null ? '' : String(kg);
  return `<div class="sutunlar">
    ${sutun({ ad: 'SET', etiket: 'Bugünkü set sayısını',
      deger: `<b class="n">${q.hedef}</b>`, alt: setAlt(t.sets),
      artir: 'data-act="set-arti"', azalt: 'data-act="set-eksi"', azaltPasif: q.hedef <= q.calisma + 1 })}
    ${sutun({ ad: 'TEKRAR', etiket: 'Tekrarı',
      deger: `<input class="n" type="number" inputmode="numeric" step="1" min="1" id="f-reps" value="${ctx.draft.reps ?? t.reps ?? ''}" aria-label="Bu setin tekrarı">`,
      alt: `<span id="tk-alt">${tekrarAlt(ex, ctx)}</span>`, artir: 'data-step="reps:1"', azalt: 'data-step="reps:-1"' })}
    ${sutun({ ad: 'AĞIRLIK', etiket: 'Ağırlığı', sinif: 'genis',
      deger: `<span class="n-kap"><input class="n${kgYazi.length >= 5 ? ' uzun' : ''}" type="number" inputmode="decimal" step="${adim}" min="0"
               id="f-weight" value="${kgYazi}" placeholder="0" aria-label="Ağırlık (${birim})"><small>${birim}</small></span>`,
      alt: `<span id="plaka-yazi">${plakaYazi(ex, kg, birim)}</span>`,
      artir: `data-step="weight:${adim}"`, azalt: `data-step="weight:${-adim}"` })}
  </div>`;
}

/** "Geçen sefer" — ağırlığın ALTINDA, adımlayıcının yanındaki boşlukta (süre/kardiyo hareketinde) */
const gecenHTML = (ex, ctx) => `<p class="gecen">${ik('gecmis')}<span>${lastTime(ex, ctx.lastPerf, ctx.settings.unit,
  N.exerciseProgress(ctx.session, ex, ctx.settings).sets.length > 0)}</span></p>`;

/** Başlığın altı: "Hedef 5 × 5 · geçen 57,5 × 5" — bugünkü set sayısı ve geçen seferin en ağır seti */
function altBaslik(ex, q, ctx) {
  const t = N.effective(ex, ctx.settings);
  const hedef = ex.setType === 'time' ? `${q.hedef} × ${fmt(t.seconds)} sn`
    : ex.setType === 'cardio' ? `${fmt(t.minutes)} dk` : `${q.hedef} × ${t.repsMin ? `${t.repsMin}-` : ''}${fmt(t.reps)}${t.rir != null ? ` · RIR ${t.rir}` : ''}`;
  const lp = ctx.lastPerf[ex.id]?.sets?.filter(s => !s.warmup) ?? [];
  const enIyi = lp.length ? lp.reduce((a, s) => ((s.weight ?? s.seconds ?? s.minutes ?? 0) > (a.weight ?? a.seconds ?? a.minutes ?? 0) ? s : a)) : null;
  return `Hedef ${hedef}${enIyi ? ` · geçen ${setLabel(enIyi)}` : ''}`;
}

/**
 * Sayı girişi (kardiyo): rakam kahraman, adımlayıcı başparmağın altında. Düğmeler ADIMI üstünde yazar.
 * Boş kutunun yer tutucusu sönük "0". Değer yine BOŞTUR — kaydederken "Süre gir." uyarısı çalışır.
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

/** Değer girişi — ağırlık × tekrarda üç sütun; süre hareketinde geri sayım; kardiyoda dakika */
function girisHTML(ex, q, ctx) {
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
  return sutunlarHTML(ex, q, ctx);
}

/* ── Hedef paneli (? panelinde) — aynı kontrol dili: hazır şema · set noktaları · tekrar şeridi ── */
export const SEMALAR = [[3, 8], [3, 10], [3, 12], [4, 8], [4, 6], [5, 5]];
const SURE_SECENEK = [15, 20, 30, 45, 60, 90];

/** Set noktaları: 1–10, dokunduğun nokta set sayısı. `veri` tıklanınca okunan öznitelik adı */
export const noktalarHTML = (veri, n, onEk = '') => `<div class="noktalar-set" role="radiogroup" aria-label="Set sayısı">${Array.from({ length: 10 }, (_, i) =>
  `<button role="radio" aria-checked="${i + 1 === n}" class="${i < n ? 'on' : ''}" data-${veri}="${onEk}${i + 1}" aria-label="${i + 1} set"><i></i></button>`).join('')}</div>`;

/** Tekrar şeridi: 1–30 (değer daha büyükse ona kadar) — yaptığın sayıya tek dokunuş */
export const tekrarSeridiHTML = (veri, n, onEk = '') => `<div class="serit-t" role="radiogroup" aria-label="Tekrar">${Array.from({ length: Math.max(30, n ?? 0) }, (_, i) => i + 1).map(v =>
  `<button role="radio" aria-checked="${v === n}" data-${veri}="${onEk}${v}">${v}</button>`).join('')}</div>`;

/** Hazır şemalar (set × tekrar) */
export const semalarHTML = (veri, s, t, onEk = '') => `<div class="semalar" role="group" aria-label="Hazır şema">${SEMALAR.map(([a, b]) =>
  `<button class="cip" aria-pressed="${a === s && b === t}" data-${veri}="${onEk}${a}:${b}">${a} × ${b}</button>`).join('')}</div>`;

/**
 * YÖNTEM ÇİPLERİ (G1, 17 Eki — plan docs/2026-10-17-parti-f-ve-program-ozellikleri-PLAN.md): tekrar aralığı (alt sınır),
 * hedef RIR ve hareket başına dinlenme. Hedef panelinde ve program düzenleyicide AYNI blok; seçim hemen programın kalemine
 * yazılır. `k`: {reps, repsMin, rir, dinlenme} · `veri`: tıklanınca okunan öznitelik (değer "ön ek + alan:değer"; x = kaldır).
 * Ağırlık × tekrar dışında yalnız dinlenme satırı.
 */
const RIR_SECENEK = [0, 1, 2, 3, 4], DINLENME_SECENEK = [60, 90, 120, 180, 240];
export function yontemHTML(veri, k, onEk = '', genelSn = 60, { tekrarli = true } = {}) {
  const cip = (alan, deger, yazi, on, etiket = yazi) =>
    `<button class="cip" aria-pressed="${on}" data-${veri}="${onEk}${alan}:${deger}" aria-label="${esc(etiket)}">${yazi}</button>`;
  const satir = (baslik, deger, ic) => `<div class="g-alan"><div class="g-etk"><span>${baslik}</span><b>${deger}</b></div>
      <div class="semalar" role="group" aria-label="${baslik}">${ic}</div></div>`;
  let h = '';
  if (tekrarli && k.reps > 1) {
    const altlar = [...new Set([k.reps - 4, k.reps - 3, k.reps - 2, ...(k.repsMin ? [k.repsMin] : [])])].filter(v => v >= 1 && v < k.reps).sort((a, b) => a - b);
    h += satir('Tekrar aralığı', k.repsMin ? `${k.repsMin}-${k.reps}` : 'tek sayı',
      cip('repsMin', 'x', 'Tek sayı', !k.repsMin) + altlar.map(v => cip('repsMin', v, `${v}-${k.reps}`, k.repsMin === v, `${v} ile ${k.reps} arası`)).join(''));
    h += satir('Hedef RIR', k.rir != null ? `${k.rir}` : 'yok',
      cip('rir', 'x', 'Yok', k.rir == null, 'Hedef RIR yok') + RIR_SECENEK.map(v => cip('rir', v, v === 4 ? '4+' : `${v}`, k.rir === v, `RIR ${v}`)).join(''))
      + `<p class="g-not">RIR: setin sonunda kaç temiz tekrar daha yapabilirdin. 2 = iki tekrar daha çıkardı.</p>`;
  }
  h += satir('Dinlenme', `${k.dinlenme ?? genelSn} sn`,
    cip('dinlenme', 'x', `Genel (${genelSn} sn)`, k.dinlenme == null, 'Genel ayar') + DINLENME_SECENEK.map(v => cip('dinlenme', v, `${v} sn`, k.dinlenme === v)).join(''));
  return h;
}

/** Hedef panelinin gövdesi — gizli girdiler (#g-sets, #g-reps, #g-seconds) "Hedefi kaydet"in okuduğu yerler */
function hedefHTML(ex, ctx) {
  const { settings } = ctx, t = N.effective(ex, settings);
  const adim = I.agirlikAdimi(ex, settings) ?? I.GIRIS_ADIMI_YEDEK;
  const gbox = (f, v, d, l) => `<div class="gf">
      <span class="etiket">${l}</span>
      <div class="gbox">
        <button data-gstep="${f}:${-d}" aria-label="${l} azalt">${ik('eksi')}</button>
        <input type="number" inputmode="decimal" step="${d}" min="0" id="g-${f}" value="${v ?? ''}" placeholder="—" aria-label="${l}">
        <button data-gstep="${f}:${d}" aria-label="${l} artır">${ik('arti')}</button>
      </div>
    </div>`;
  const setAlani = `<div class="g-alan"><div class="g-etk"><span>Set sayısı</span><b id="g-sets-yaz">${t.sets}</b></div>
      ${noktalarHTML('gset', t.sets)}<input type="hidden" id="g-sets" value="${t.sets}"></div>`;
  const yontem = (o = {}) => `<div id="g-yontem">${yontemHTML('g-yontem', t, '', settings.restSeconds, o)}</div>`;
  if (ex.setType === 'time') return `${setAlani}
    <div class="g-alan"><div class="g-etk"><span>Süre</span><b id="g-seconds-yaz">${fmt(t.seconds)} sn</b></div>
      <div class="semalar" role="group" aria-label="Süre">${[...new Set([...SURE_SECENEK, t.seconds])].sort((a, b) => a - b).map(v =>
        `<button class="cip" aria-pressed="${v === t.seconds}" data-gsn="${v}">${v} sn</button>`).join('')}</div>
      <input type="hidden" id="g-seconds" value="${t.seconds}"></div>${yontem({ tekrarli: false })}`;
  if (ex.setType === 'cardio') return `${setAlani}<div class="goal-grid">${gbox('minutes', t.minutes, 5, 'Süre (dk)')}</div>`;
  return `<div class="g-alan"><div class="g-etk"><span>Hazır şema</span></div>${semalarHTML('gsema', t.sets, t.reps)}</div>
    ${setAlani}
    <div class="g-alan"><div class="g-etk"><span>Tekrar</span><b id="g-reps-yaz">${t.reps}</b></div>
      ${tekrarSeridiHTML('greps', t.reps)}<input type="hidden" id="g-reps" value="${t.reps}"></div>
    ${yontem()}
    <div class="goal-grid">${gbox('weight', t.weight, adim, `Planlanan ağırlık (${settings.unit})`)}</div>`;
}

/** Isınma seti anahtarı — "?" panelinde (ana ekran sade kalsın); durum ekranda yazar (set yazısı + kaydet) */
function isinmaAnahtariHTML(ex, ctx) {
  if (ex.setType === 'cardio') return '';
  return `<div class="set-satir">
      <span class="etiket"><span id="warm-ad">Isınma seti</span><small id="warm-not">Bu set hacme ve "geçen sefer"e karışmaz</small></span>
      <button class="cip" id="warm" data-act="warm" role="switch" aria-checked="${!!ctx.draft.warmup}"
              aria-labelledby="warm-ad" aria-describedby="warm-not">${ctx.draft.warmup ? 'Açık' : 'Kapalı'}</button>
    </div>`;
}

/* ══ ISINMA EKRANI ════════════════════════════════════════════════════════
   Sayaç YOK, işaret YOK — ekran yalnız GÖSTERİR. Satırlar liste satırının AYNI bileşeni;
   eşit dağılıp ekranı dolduruyorlar (odak ekranıyla aynı "kaymaz" kuralı). */
export function warmupHTML(ctx) {
  const { dayIndex } = ctx;
  const adımlar = N.warmupFor(dayIndex);
  const { kaslar } = N.gunEtiketi(dayIndex);

  const satır = adımlar.map(w => `<div class="satir yalin" data-warm="${w.id}">
      <span class="ad"><b>${esc(w.ad)}</b><span>${esc(w.not)}</span></span>
      <span class="sag"><b>${esc(w.miktar)}</b></span>
      <div class="mini sahne3d" data-anim="${w.id}" aria-hidden="true"></div>
    </div>`).join('');

  return `
    <div class="ust"><button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Isınma</h1><p>${esc(kaslar)} · ${N.isinmaSuresi(dayIndex)} · sete sayılmaz</p></div>
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
  if (o.tur === 'kal') return `<div class="oneri">${ik('yildiz')}<span>Geçen sefer son sete RIR 0 ile vardın: <b>${fmt(o.agirlik)} ${birim}</b> ile kal,
      tekrarları temiz tamamla</span></div>`;
  if (o.tur === 'agirlik') return `<div class="oneri">${ik('yildiz')}
      <span>İki seanstır ${o.setler} × ${o.tekrar} tamam${o.rir != null ? ` (RIR ${o.rir}+)` : ''}: <b>${fmt(o.agirlik)} ${birim}</b> dene</span>
      ${ctx.draft.weight === o.agirlik ? '' : '<button class="cip" data-act="oneri-uygula">Uygula</button>'}
    </div>`;
  return `<div class="oneri">${ik('yildiz')}<span>İki seanstır ${fmt(o.agirlik)} ${birim} ile hedef tamam. Sonraki
      ağırlık adımı büyük (%${Math.round(o.adimOrani * 100)}); önce <b>${o.hedefTekrar} tekrara</b> çık.</span></div>`;
}

/** Başlığın üstünde bağlam (dil 4): program · gün — gün adı yazılmışsa o ("İtme Günü A"), yoksa sıra ("1. Gün") */
function ustYazi(ctx) {
  const p = N.aktifProgram(), g = p?.gunler[ctx.dayIndex];
  if (!g) return '';
  return `<div class="ust-yazi"><b>${esc(p.ad)}</b> · ${esc(g.ad?.trim() || N.gunEtiketi(ctx.dayIndex).kisa)}</div>`;
}

export function focusHTML(ctx) {
  const { session, dayIndex, idx, settings } = ctx;
  const exs = N.exercisesFor(dayIndex);
  const ex = exs[idx];
  const q = N.exerciseProgress(session, ex, settings);

  const seritler = exs.map((e, i) => {
    const p = N.exerciseProgress(session, e, settings);
    return `<i class="${p.tamam ? 'f' : i === idx ? 'c' : ''}"></i>`;
  }).join('');
  const son = idx === exs.length - 1;

  /* Ekran KAYMAZ: sabit bantlar + esneyen tek bölge (görsel).
     Hedef tamamlanınca giriş çekilir; "Bir set daha" bugünkü set sayısını bir artırır. */
  return `
    <div class="ust uclu">
      <button class="ib" data-act="to-list" aria-label="Listeye dön">${ik('geri')}</button>
      <div class="orta"><b>${idx + 1} / ${exs.length}</b><span class="seritler" aria-hidden="true">${seritler}</span></div>
      <span class="sag-grup">
        ${q.sets.length ? `<button class="ib" data-act="undo" aria-label="Son seti geri al">${ik('geri-al')}</button>` : ''}
        <button class="ib" data-act="sheet-open" aria-label="Nasıl yapılır, hedef ve ısınma seti">${ik('soru')}</button>
      </span>
    </div>
    <div class="baslik">
      ${ustYazi(ctx)}
      <h1>${adi(ex)}${ex.grup ? `<span class="kas-cip">${esc(ex.grup.toLocaleUpperCase('tr'))}</span>` : ''}</h1>
      <p>${altBaslik(ex, q, ctx)}</p>
    </div>
    ${vizHTML(ex, q, rirSorHTML(ctx, ex) + rozetHTML(ctx, ex))}
    ${ex.setType === 'cardio' ? '' : setIlerlemeHTML(q, ctx, ex)}
    ${q.tamam ? '' : girisHTML(ex, q, ctx)}
    ${ex.setType === 'time' && !q.tamam ? `<div class="gecen-bant">${gecenHTML(ex, ctx)}</div>` : ''}
    <div class="foot">
      ${q.tamam
        ? `<div class="cift">
             <button class="btn s" data-act="set-arti">${ik('arti')}Bir set daha</button>
             ${son
               ? `<button class="btn p" data-act="to-list">Listeye dön</button>`
               : `<button class="btn p" data-act="next">Sonraki hareket${ik('ileri')}</button>`}
           </div>`
        : ex.setType === 'time'
          /* Süre hareketinde asıl eylem BAŞLATMAK; süre dolunca set kendiliğinden kaydedilir */
          ? `<div class="cift">
               <button class="btn s" data-act="save">Kaydet</button>
               <button class="btn p" data-act="clock-start" id="clock-btn">Başlat</button>
             </div>`
          : `<button class="btn p" data-act="save" id="kaydet-btn">${kaydetEtiketi(ex, q, ctx)}</button>`}
    </div>
    ${gezinmeHTML(ctx)}
    <div class="sheet-bg" data-act="sheet-close" hidden></div>
    ${sheetHTML(ex, ctx)}`;
}

/* ══ SEANS SONU ═══════════════════════════════════════════════════════════
   Antrenmanın son anı (peak-end: son an bütün deneyimin hatırasını belirler). 14 Eki: rekorlar ve antrenman özeti
   (plan docs/2026-10-14-rekorlar-ve-antrenman-ozeti-PLAN.md, mokap mockup-rekorlar.html, rakip araştırması §1).
   Sıra: dönem bandı (programın son günüyse) → açılış (en güçlü haber; "rekor yok" hiç yazılmaz) → üç sayı → rekorlar →
   geçen seferden ağır → gelecek sefer (öğretir) → bu hafta (seri sayacı yok) → sıradaki.
   Dil (K11): görev odaklı — hareket + sayı + eylem; övgü ve ünlem yok; kayıp vurgulanmaz, kırmızı yok.
   Hesap session.seansOzeti / rekorlar.js'te (test ediliyor). */
const TUR_KISA = { agir: 'en ağır set', bir: 'tahmini 1 tekrar maksimumu', hacim: 'en iyi set hacmi', tekrar: 'en çok tekrar', sure: 'en uzun süre' };
/** Rekor değeri birimiyle: ağırlık · 1RM (tam sayıya) · hacim · tekrar · süre */
export const rekorDeger = (tur, v, birim) => tur === 'tekrar' ? `${fmt(v)} tekrar` : tur === 'sure' ? `${fmt(v)} sn`
  : tur === 'bir' ? `${fmt(v, 0)} ${birim}` : tur === 'hacim' ? `${fmt(v, 0)} ${birim}` : `${fmt(v)} ${birim}`;
const rekorOnce = (tur, v) => tur === 'bir' || tur === 'hacim' ? fmt(v, 0) : fmt(v);

function donemHTML(d, birim) {
  if (!d) return '';
  const fark = d.oncekiHacim > 0 ? (d.hacim - d.oncekiHacim) / d.oncekiHacim : null;
  const farkYazi = fark == null ? '' : ` · önceki döneme göre ${Math.abs(fark) < 0.0005 ? 'aynı' : `${fark > 0 ? '+' : '−'}%${fmt(Math.abs(fark * 100), 0)}`}`;
  return `<div class="oz-donem">
    <span class="ust-satir">${ik('takvim')}DÖNEM TAMAM</span>
    <h2>${d.antrenman} antrenman, ${d.gun} günde</h2>
    <span class="alt-satir">${esc(d.program)}: programın bütün günlerini bitirdin.${d.rekorSayisi ? ` Bu dönemde ${d.rekorSayisi} rekor kırdın.` : ''}</span>
    <div class="iki"><div><b>${fmt(d.hacim, 0)} ${birim}</b><span>Toplam hacim${farkYazi}</span></div>
      <div><b>${d.calismaSet}</b><span>Çalışma seti</span></div></div>
    ${d.hareketler.length ? `<div>${d.hareketler.map(h => `<div class="hareket"><span>${adi(h.ex)}</span><b>${fmt(h.once, 0)} → ${fmt(h.simdi, 0)} ${birim}</b></div>`).join('')}
      <p class="oz-kural">Tahmini 1 tekrar maksimumu, önceki dönem → bu dönem.</p></div>` : ''}
  </div>`;
}

/** Açılış (K6 + 14 Eki hak edilmiş övgü): koşulu ölçülmüş TEK övgü + kanıtı (session.ovguSec: başardın > gelişiyorsun >
    istikrarlısın > zor antrenman); övgü yoksa istatistik — hacim artışı → ağırlaşan hareket → yapılan işin sayıları.
    Boş övgü ("harika!") yok; "rekor yok" yazılmaz. */
const OVGU_IKON = { rekor: 'yildiz', gelisim: 'grafik', istikrar: 'takvim', zor: 'alev' };
function haberHTML(o, gün, birim) {
  if (o.ovgu) return { ikon: OVGU_IKON[o.ovgu.tur] ?? 'yildiz', baslik: o.ovgu.baslik, yazi: esc(o.ovgu.kanit) };
  if (o.hacimFarki != null && o.hacimFarki > 0.005)
    return { ikon: 'grafik', baslik: `Hacim %${fmt(o.hacimFarki * 100, 0)} arttı`, yazi: `Geçen ${gün}e göre aynı hareketlerde daha çok iş yaptın.` };
  if (o.artislar.length)
    return { ikon: 'yukari', baslik: 'Geçen seferden ağır', yazi: o.artislar.slice(0, 2).map(a => `${adi(a.ex)} ${fmt(a.once)} → ${fmt(a.simdi)} ${birim}`).join(' · ') };
  const sayilar = [`${o.calismaSet} çalışma seti`, o.sure && `${o.sure} dk`, o.kg && `${fmt(o.kg, 0)} ${birim}`].filter(Boolean).join(' · ');
  return { ikon: 'tik', notr: true, baslik: 'Antrenman tamam', yazi: `${sayilar}.` };
}

function haftaHTML(d) {
  if (!d) return '';
  const n = d.serit.length, kalan = Math.max(0, d.hedef - d.buHafta);
  const yorum = (kalan ? `Bu hafta ${kalan} antrenman daha kaldı.` : 'Bu haftanın hedefi tamam.')
    + (n >= 3 && d.tutulan ? ` Son ${n} haftada ${d.tutulan} kez hedefini tuttun.` : '');
  return `<div class="grup"><h2 class="etiket">Bu hafta</h2><div class="ic">
    <div class="oz-hafta"><b>${d.buHafta} / ${d.hedef} antrenman</b><span class="kucuk-yazi">hedefin haftada ${d.hedef}</span></div>
    <div class="oz-serit" aria-label="Son ${n} hafta">${d.serit.map((x, i) => `<i class="${x}${i === n - 1 ? ' bu' : ''}"></i>`).join('')}</div>
    <div class="oz-serit-alt">${n > 1 ? `<span>${n - 1} hafta önce</span>` : '<span></span>'}<span>bu hafta</span></div>
    <p class="oz-kural">${yorum}</p></div></div>`;
}

export function summaryHTML(ctx) {
  const o = ctx.ozet;
  if (!o) return '';
  const birim = ctx.settings.unit;
  const { kisa: gün, kaslar } = o.gun ?? N.gunEtiketi(o.dayIndex);
  const h = haberHTML(o, gün, birim);
  const k = o.rekor?.kirilan ?? [], rekorlu = new Set(k.map(x => x.exId));
  const fark = o.hacimFarki == null ? '' : (() => {
    const y = Math.abs(o.hacimFarki * 100);
    return y < 0.05 ? 'aynı' : `${o.hacimFarki > 0 ? '+' : '−'}%${fmt(y, 0)}`;
  })();
  const setFark = o.onceki ? (o.calismaSet === o.onceki.calismaSet ? 'aynı' : `${o.calismaSet > o.onceki.calismaSet ? '+' : '−'}${Math.abs(o.calismaSet - o.onceki.calismaSet)}`) : '';
  const rekorlar = !k.length && !o.gunHacmi && !(o.rekor?.ilkler?.length) ? '' : `<div class="grup"><h2 class="etiket">${k.length || o.gunHacmi ? 'Rekorlar' : 'İlk kayıt'}</h2><div class="ic">
    ${k.map(x => `<div class="oz-kayit">${ik('yildiz')}<b>${adi(N.byId[x.exId] ?? { ad: x.exId })}</b>
      <span class="oz-deger"><s>${rekorOnce(x.ana.tur, x.ana.once)} →</s> <em>${rekorDeger(x.ana.tur, x.ana.simdi, birim)}</em></span>
      <span class="oz-alt">${RK.TUR_AD[x.ana.tur]}${x.turler.length > 1 ? ` · ayrıca ${x.turler.slice(1).map(t => TUR_KISA[t.tur]).join(', ')}` : ''}</span></div>`).join('')}
    ${o.gunHacmi ? `<div class="oz-kayit">${ik('yildiz')}<b>Günün toplam hacmi</b>
      <span class="oz-deger"><s>${fmt(o.gunHacmi.once, 0)} →</s> <em>${fmt(o.gunHacmi.simdi, 0)} ${birim}</em></span>
      <span class="oz-alt">${esc(gün)} için en yüksek</span></div>` : ''}
    ${o.rekor?.ilkler?.length ? `<p class="oz-kural">İlk kayıt: ${o.rekor.ilkler.map(id => adi(N.byId[id] ?? { ad: id })).join(', ')}. Bugünkü değerlerin taban oldu; sonraki seferlerde rekorlar sayılır.</p>` : ''}
  </div></div>`;
  const artis = o.artislar.filter(a => !rekorlu.has(a.ex.id));
  const agir = !artis.length ? '' : `<div class="grup"><h2 class="etiket">Geçen seferden ağır</h2><div class="ic">${artis.map(a =>
    `<div class="oz-kayit">${ik('yukari')}<b>${adi(a.ex)}</b><span class="oz-deger"><s>${fmt(a.once)} →</s> <em>${fmt(a.simdi)} ${birim}</em></span>
      <span class="oz-alt">En ağır çalışma seti</span></div>`).join('')}</div></div>`;
  const gelecek = !o.gelecek?.length ? '' : `<div class="grup"><h2 class="etiket">Gelecek sefer</h2><div class="ic">${o.gelecek.map(g =>
    `<div class="oz-kayit">${g.tur === 'artir' ? ik('yukari') : ik('ileri').replace('class="i"', 'class="i notr"')}<b>${adi(g.ex)}</b><span class="oz-deger">${esc(g.deger)}</span>
      <span class="oz-alt neden">${esc(g.neden)}</span></div>`).join('')}
    <p class="oz-kural">Kural: aynı ağırlıkta iki seans üst üste hedef tekrarların hepsini yaparsan ağırlığı küçük bir adımla artır (ACSM). Öneridir; kutu yine geçen seferle dolar.</p></div></div>`;

  return `
    <div class="ust">
      <button class="cip" data-act="ozet-geri-al" aria-label="Bitirmeyi geri al, seansa dön">${ik('geri-al')}Geri al</button>
      <span class="ib-yer"></span>
    </div>
    ${donemHTML(o.donem, birim)}
    <div class="oz-haber">
      <span class="rozet${h.notr ? ' notr' : ''}">${ik(h.ikon)}</span>
      <h1>${h.baslik}</h1><p>${h.yazi}</p>
      <span class="tarih">${esc(gün)} · ${esc(kaslar)} · ${C.fmtDate(new Date(o.bitis))}</span>
    </div>
    <div class="oz-uc">
      <div><b>${o.sure ?? '—'}<small>dk</small></b><span>Süre</span>${o.onceki?.sure ? `<em>geçen sefer ${o.onceki.sure}</em>` : ''}</div>
      <div><b>${o.calismaSet}<small>set</small></b><span>Set</span>${setFark ? `<em>${setFark}</em>` : ''}</div>
      ${o.kg ? `<div><b>${fmt(o.kg, 0)}<small>${birim}</small></b><span>Hacim</span>${fark ? `<em class="${o.hacimFarki > 0.0005 ? 'art' : ''}">${fark}</em>` : ''}</div>`
        : `<div><b>${fmt(o.seconds ?? 0)}<small>sn</small></b><span>Süre hareketi</span></div>`}
    </div>
    ${o.onceki ? `<p class="oz-not">${o.hacimKismi ? `Hacim farkı yalnız bugün de yapılan hareketlerde, geçen ${esc(gün)}e göre.` : `Farklar geçen ${esc(gün)}e göre.`}</p>` : ''}
    ${rekorlar}${agir}${gelecek}${haftaHTML(o.duzen)}
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
          <span class="s-baslik">${r.gun}</span>
          <span class="s-hacim">${r.kayitsiz ? '—' : `${fmt(r.hacim.kg, 0)} ${settings.unit}`}</span>
          <span class="s-ikinci">${C.fmtShort(new Date(r.at))}${r.programAdi ? ` · ${esc(r.programAdi)}` : ''}${
            r.kayitsiz ? '<span class="etk kyt">kayıtsız</span>' : r.yarim ? '<span class="etk">yarım</span>' : ''}</span>
          <span class="s-oran">${r.kayitsiz ? '' : `${r.yapilan}/${r.toplam} hareket`}</span>
        </button>`).join('')}</div>`
        : '<div class="ic"><p>Henüz tamamlanmış seans yok.</p></div>'}
    </div>`;

  const ilerlemeBolum = `
    <div class="grup"><h2 class="etiket">Hareket ilerlemesi · en ağır set</h2>
      ${ilerleme.length ? `<div class="ic sira">${ilerleme.map(p => `
        <div class="ilerleme">
          <b>${adi(p.ex)}</b>
          <span>${fmt(p.seri[0].v)} → <em>${fmt(p.seri.at(-1).v)} ${p.birim}</em></span>
          ${sparkHTML(p.seri.map(s => s.v), { w: 280, h: 18, alan: false })}
        </div>`).join('')}</div>
        <p class="kucuk-yazi grup-alti">${ilerleme.length} hareket · çizgi en fazla son ${Math.max(...ilerleme.map(p => p.seri.length))} seansı gösterir.</p>`
        : '<div class="ic"><p>İlerleme çizgisi için bir hareketin en az iki seansta kaydı gerekiyor.</p></div>'}
    </div>`;

  // REKORLAR (14 Eki, K10): son kırılanlar; dokununca hareketin bütün rekorları. İlk kayıt rekor değil (Hevy).
  const olaylar = ctx.rekorOlaylari ?? [], buAy = new Date(); buAy.setDate(1); buAy.setHours(0, 0, 0, 0);
  const ayda = olaylar.filter(o => o.at >= buAy.getTime()).length;
  const rekorSatiri = o => `<button class="oz-kayit satir-dugme" data-hareket="${esc(o.exId)}">${ik('yildiz')}<b>${adi(N.byId[o.exId] ?? { ad: o.exId })}</b>
      <span class="oz-deger"><em>${rekorDeger(o.tur, o.simdi, settings.unit)}</em></span>
      <span class="oz-alt">${RK.TUR_AD[o.tur]} · ${C.fmtShort(new Date(o.at))}</span></button>`;
  const rekorBolum = `
    <div class="grup"><h2 class="etiket">Rekorlar · son kırılanlar</h2><div class="ic">${olaylar.length
      ? `${olaylar.slice(0, 6).map(rekorSatiri).join('')}
         <p class="oz-kural">${ayda ? `Bu ay ${ayda} rekor · ` : ''}Bir harekete dokun: bütün rekorları ve geçmişi.</p>`
      : '<p>Rekorlar bir hareketi ikinci kez yaptığında sayılmaya başlar: ilk kayıt taban olur.</p>'}</div></div>`;

  return `
    <div class="sayfa-baslik ust-bosluk"><h1>İlerleme</h1></div>
    ${rekorBolum}${kiloBolum}${seansBolum}${ilerlemeBolum}
    ${sekmelerHTML('ilerleme')}`;
}

/* ══ SEANS DÜZENLEME EKRANI ═══════════════════════════════════════════════
   Yanlış girilen ağırlık ömür boyu kalıyordu; düzeltme burada.
   Alan bırakılınca kaydeder (her tuşta değil) — "4" yazarken 4 kg diske inmesin diye. */
export function sessionEditHTML(ctx) {
  const { duzenlenen: d, settings } = ctx;
  if (!d) return `<div class="ust"><button class="ib" data-act="to-history" aria-label="Geçmişe dön">${ik('geri')}</button></div>
    <div class="sayfa-baslik"><h1>Seans bulunamadı</h1></div>`;

  const gunAdi = N.gunEtiketiSeans(d).kisa;
  // Seansın KENDİ programının sırası; ardından programdan sonradan çıkarılmış hareketlerin kayıtları
  const sirali = N.exercisesOfSession(d);
  const disarida = d.entries.filter(e => !sirali.some(x => x.id === e.exerciseId))
    .map(e => N.byId[e.exerciseId] ?? N.bilinmeyenHareket(e.exerciseId));
  const bloklar = [...sirali, ...disarida].map(ex => {
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
                   data-eset="${ex.id}:${i}:${alan}" aria-label="${adi(ex)} ${et} set ${birim}">
            <span class="eunit">${birim}</span>
          </label>`).join('')}
        <button class="esil" data-eset-sil="${ex.id}:${i}" aria-label="${et} seti sil">${ik('sil')}</button>
      </div>`;
    }).join('');
    return `<div class="grup"><h2 class="etiket">${adi(ex)}</h2><div class="ic sira">${satirlar}${e.note ? `<p class="seans-notu">${ik('liste')}<span>${esc(e.note)}</span></p>` : ''}</div></div>`;
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
  // 14 Eki: tarif TARAYICIYA göre (js/kurulum.js) — eskiden yalnız Chrome menüsü anlatılıyordu (Sabri iPhone Safari ve
  // Xiaomi Brave'de yükleyemedi)
  const t = KURULUM_TARIFI[k.tur];
  const ic = k.kurulu
    ? '<p>Telefona yüklü: ana ekrandaki simgesiyle, adres çubuğu olmadan açılıyor.</p>'
    : k.istem
      ? `<button class="btn p" data-act="kur">Telefona yükle</button>
         <p>Ana ekrana kendi simgesiyle eklenir; adres çubuğu olmadan açılır, internetsiz çalışır.
           Kayıtların aynen kalır. Mağaza gerekmez.</p>`
      : t ? `<p class="kurulum-tarayici">${esc(t.tarayici)} için:</p>
           <ol class="kurulum-adim">${t.adimlar.map(a => `<li>${a}</li>`).join('')}</ol>
           ${t.not ? `<p class="kucuk-not">${esc(t.not)}</p>` : ''}
           <p class="kucuk-not">Zaten yüklüyse ana ekrandaki FitSet simgesinden aç.</p>`
        : `<p>Tarayıcı menüsünden <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>'yi seç.</p>`;
  return `<div class="grup" id="kurulum"><h2 class="etiket">Telefona yükle</h2><div class="ic">${ic}</div></div>`;
}

/** Bugün ekranındaki yükleme bandı (14 Eki): tek dokunuşla yükle ya da Ayarlar'daki tarife git; kapatılabilir */
export function kurulumBantHTML(ctx) {
  const k = ctx.kurulum ?? {};
  if (!bantGoster(k.tur, ctx.settings)) return '';
  return `<div class="kurulum-bant"><span class="yazi"><b>FitSet'i telefona yükle</b><span>Ana ekranda kendi simgesiyle, internetsiz açılır.</span></span>
    <button class="btn p kucuk" data-act="${k.istem ? 'kur' : 'kurulum-nasil'}">${k.istem ? 'Yükle' : 'Nasıl?'}</button>
    <button class="kapat" data-act="kurulum-kapat" aria-label="Bandı kapat">${ik('carpi')}</button></div>`;
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
    <div class="sayfa-baslik ust-bosluk"><h1>Ayarlar</h1></div>

    <div class="grup"><h2 class="etiket">Profil ve avatar</h2><div class="ic">
      <button class="pm-satir" data-act="to-profil">
        <span class="avatar-k" data-avatar-k aria-hidden="true"></span>
        <span class="yazi"><b>${esc(settings.profil?.ad?.trim() || 'Profil oluştur')}</b></span>${ik('ileri')}
      </button>
    </div></div>

    <div class="grup"><h2 class="etiket">Antrenman günleri</h2><div class="ic">
      <div class="cipler">${gunler}</div>
      <p>Sıradaki: ${sonrakiMetin}</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setler arası dinlenme</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dinlenme süresi">${dinlenme}</div>
      <p>Saniye. Odak ekranındaki sayaç bu süreyle başlar.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Setten sonra zorluk (RIR)</h2><div class="ic">
      <div class="segment" role="group" aria-label="RIR sorusu">${[['kapali', 'Sorma', false], ['acik', 'Sor', true]].map(([k, ad, v]) =>
        `<button data-rirsor="${k}" aria-pressed="${!!settings.rirSor === v}">${ad}</button>`).join('')}</div>
      <p>Ağırlıklı her setten sonra "kaç tekrar daha yapabilirdin?" sorulur; cevap ağırlık önerisini daha doğru yapar.
        Programda hedef RIR verdiğin harekette her zaman sorulur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Seans başında kontrol</h2><div class="ic">
      <div class="segment" role="group" aria-label="Toparlanma kontrolü">${[['kapali', 'Sorma', false], ['acik', 'Sor', true]].map(([k, ad, v]) =>
        `<button data-hzsor="${k}" aria-pressed="${(settings.hazirlikSor !== false) === v}">${ad}</button>`).join('')}</div>
      <p>Seansa başlamadan uyku, uzun süren kas tutulması ve ağrı sorulur; cevaba göre "plana uy", "biraz hafiflet" ya da
        "dinlen" önerilir. Günde bir kez sorulur, atlanabilir.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Dambıl adımı</h2><div class="ic">
      <div class="segment" role="group" aria-label="Dambıl adımı">${dambil}</div>
      <p>Salondaki dambıl setinde bir sonraki ağırlık. Bar 2,5 kg, makine ve kablo 5 kg adımla ilerler.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Hareket çizimi</h2><div class="ic">
      <div class="segment" role="group" aria-label="Hareket çizimi">${gorunum}</div>
      <p>${basit && settings.basitOto ? 'Bu telefonda ayrıntılı manken yavaş çizildiği için basit görünüm kendiliğinden açıldı. '
        : !basit && ctx.cAcilamadi ? 'Ayrıntılı manken bu telefonda açılamadı; yerine basit manken çiziliyor. '
        : ''}Basit görünüm daha hafif bir manken çizer, pili korur.</p>
    </div></div>

    <div class="grup"><h2 class="etiket">Vücut</h2><div class="ic">
      <div class="alan">
        <label for="s-height">Boy</label>
        <label class="kutucuk"><input type="number" id="s-height" inputmode="numeric" min="100" max="250" step="1"
               value="${settings.heightCm ?? ''}" placeholder="—" aria-label="Boy (cm)"><small>cm</small></label>
      </div>
      <p>Kilo takibi İlerleme ekranında.</p>
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

    <div class="grup"><h2 class="etiket">Hakkında</h2><div class="ic">
      <div class="hk-ust"><img src="icons/isaret.svg" alt="" width="44" height="26">
        <div class="hk-ad"><b class="hk-kelime"><span class="k1">${esc(AD.on)}</span><span class="k2">${esc(AD.son)}</span></b>
          <small>Sürüm ${esc(SURUM)}</small></div></div>
      <p>Verilerin yalnızca bu telefonda durur; hesap yok, hiçbir sunucuya bir şey gönderilmez.</p>
      <a class="hk-bag" href="gizlilik.html">Gizlilik politikası${ik('ileri')}</a>
      <a class="hk-bag" href="kosullar.html">Kullanım koşulları${ik('ileri')}</a>
    </div></div>

    <p class="kucuk-yazi">Ağrı hissettiğin bir harekette dur; bu uygulama tıbbi tavsiye vermez.
      Hareket çizimleri <a href="js/vendor/three-LICENSE.txt" target="_blank" rel="noopener">three.js</a> ile yapılır (MIT lisansı);
      manken MakeHuman ile üretildi (CC0); yazı tipi Archivo (<a href="fonts/OFL.txt" target="_blank" rel="noopener">SIL OFL 1.1</a>).
      © 2026 Sabri Temel, tüm hakları saklıdır.</p>
    ${sekmelerHTML('ayarlar')}`;
}

/* ══ PROFİL VE AVATAR (13 Eki 2026 — Sabri onaylı mokap mockup-profil-manken.html) ═══════════════════════════
   Avatar = kullanıcıyı temsil eden 3B figür (dört gövde aynı iskelette: Leo · Mia · Max · Nora). Profil (ad · yaş ·
   cinsiyet) isteğe bağlı, yalnız telefonda; yaş/cinsiyet avatarı ÖNERİR, elle seçim ezilmez (js/avatar.js). */
const renkDugmeleri = (liste, secili, veri) => liste.map(([k, ad, hx]) =>
  `<button class="renk" data-${veri}="${k}" aria-pressed="${secili === k}" aria-label="${esc(ad)}" style="--renk:${hx}"></button>`).join('');

export function profilHTML(ctx) {
  const st = ctx.settings ?? {}, av = st.avatar ?? {}, pr = st.profil ?? {};
  const g = AV.cozumle(av, pr), govde = AV.govdeBul(g.govde);
  const oneri = ctx.avatarOneri, sekme = ctx.avatarSekme ?? 'avatar', parca = ctx.kiyafetParca ?? 'ust';
  const renkAdi = (liste, k) => `<p class="renk-ad">${esc(liste.find(x => x[0] === k)?.[1] ?? '')}</p>`;
  // TEK EKRAN (14 Eki, Sabri onaylı mokap mockup-avatar-tek-ekran.html): avatar üstte sabit, altında sekmeler, yalnız seçili
  // sekmenin seçenekleri — sayfa kaydırılmaz (eskiden renk seçerken avatar ekrandan çıkıyordu, Sabri)
  const PANEL = {
    avatar: () => `<div class="govdeler">${AV.GOVDELER.map(x => `<button class="cip" data-avatar-govde="${x.id}" aria-pressed="${g.govde === x.id}">${esc(x.ad)}</button>`).join('')}</div>
      <p class="av-not">Yaşını Profil'de yazarsan avatar önerilir; seçimin hep senin.</p>`,
    ten: () => `<div class="renkler">${renkDugmeleri(AV.TEN, g.ten, 'avatar-ten')}</div>${renkAdi(AV.TEN, g.ten)}
      <p class="av-not">Ten ve saç rengi telefonunun bölge ayarına göre önerildi; internete bağlanılmaz.</p>`,
    sac: () => (govde.kadin ? '' : `<div class="segment" role="group" aria-label="Saç">
        <button data-avatar-sacvar="1" aria-pressed="${g.sacli}">Saçlı</button><button data-avatar-sacvar="0" aria-pressed="${!g.sacli}">Saçsız</button></div>`)
      + (g.sacli ? `<div class="renkler">${renkDugmeleri(AV.SAC, g.sacRenk, 'avatar-sac')}</div>${renkAdi(AV.SAC, g.sacRenk)}` : ''),
    kiyafet: () => `<div class="segment" role="group" aria-label="Kıyafet">
        <button data-kiyafet-parca="ust" aria-pressed="${parca === 'ust'}">Üst</button><button data-kiyafet-parca="alt" aria-pressed="${parca === 'alt'}">Alt</button></div>`
      + (parca === 'ust' ? `<div class="renkler">${renkDugmeleri(AV.UST, g.ust, 'avatar-ust')}</div>${renkAdi(AV.UST, g.ust)}`
        : `<div class="renkler">${renkDugmeleri(AV.ALT, g.alt, 'avatar-alt')}</div>${renkAdi(AV.ALT, g.alt)}`),
    profil: () => `<div class="av-iki">
        <div class="profil-alan"><label for="p-adin">Adın</label><input class="metin" id="p-adin" maxlength="24" autocomplete="off" placeholder="Örneğin Deniz" value="${esc(pr.ad ?? '')}"></div>
        <div class="profil-alan av-yas"><label for="p-yas">Yaşın</label><input class="metin" id="p-yas" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="—" value="${pr.yas ?? ''}"></div></div>
      <div class="segment" role="group" aria-label="Cinsiyet">${AV.CINSIYET.map(([k, ad]) => `<button data-profil-cins="${k}" aria-pressed="${pr.cinsiyet === k}">${ad}</button>`).join('')}</div>
      <p class="av-not">İsteğe bağlı; yalnız bu telefonda saklanır. Yaş ve cinsiyet avatarını önerir.</p>`,
  };
  const SEKME = [['avatar', 'Avatar'], ['ten', 'Ten'], ['sac', 'Saç'], ['kiyafet', 'Kıyafet'], ['profil', 'Profil']];
  return `
    <div class="ust av-baslik"><button class="ib" data-act="to-settings" aria-label="Ayarlara dön">${ik('geri')}</button><h1>Profil ve avatar</h1><span class="ib-yer"></span></div>
    <div class="av-sahne">
      <div class="avatar-onizleme" id="avatar3d" aria-label="Avatarın — döndürmek için sürükle"></div>
      ${oneri ? '' : '<img class="damga" src="icons/isaret.svg" alt="" width="30" height="17">'}
      ${oneri ? `<div class="avatar-oneri"><span>Avatarın ${oneri.yas ? 'yaşına' : 'seçimine'} göre ${esc(AV.govdeBul(oneri.yeni).ad)} oldu.</span>
        <button data-act="avatar-geri-al">Geri al</button></div>` : '<p class="avatar-ipucu">Döndürmek için sürükle</p>'}
    </div>
    <div class="av-sekmeler" role="tablist" aria-label="Avatar ayarları">${SEKME.map(([k, ad]) =>
      `<button role="tab" data-avatar-sekme="${k}" aria-selected="${sekme === k}">${ad}</button>`).join('')}</div>
    <div class="av-panel" role="tabpanel">${PANEL[sekme]()}</div>`;
}

/* ══ ALT SEKME ÇUBUĞU (Faz 1A, K4) ════════════════════════════════════════
   Eskiden liste ekranının köşesinde iki ikon vardı (Geçmiş, Ayarlar); program düzenleyici
   dördüncü bir yer isteyince gezinme alt çubuğa indi. Yalnız ana ekranlarda çizilir —
   odak, ısınma, özet ve düzenleme ekranları kendi dönüş düğmesini taşır. */
// 14 Eki (Sabri onayı, mockup-hareketler.html): "Hareketler" sekmesi — program kurmadan bütün hareketlere bakılır
const SEKMELER = [['bugun', 'Bugün', 'bugun', 'to-list'], ['ilerleme', 'İlerleme', 'grafik', 'to-history'],
  ['hareketler', 'Hareketler', 'figur', 'to-hareketler'], ['programlar', 'Programlar', 'liste', 'to-programs'],
  ['ayarlar', 'Ayarlar', 'ayar', 'to-settings']];
export function sekmelerHTML(acik) {
  return `<nav class="sekmeler" aria-label="Ana gezinme">${SEKMELER.map(([k, ad, i, act]) =>
    `<button data-act="${act}"${k === acik ? ' aria-current="page"' : ''}>${ik(i)}<span>${ad}</span></button>`).join('')}</nav>`;
}

/* ══ PROGRAMLAR ═══════════════════════════════════════════════════════════ */

/** Küçük görsel: 3B çizimi olan harekette app.js doldurur (data-kucuk), olmayanda yer tutucu */
const kucuk = ex => cizimsiz(ex)
  ? `<span class="kucuk yer" aria-hidden="true">${ik('figur')}</span>`
  : `<span class="kucuk" data-kucuk="${esc(ex.id)}" aria-hidden="true"></span>`;

const hareketSayisi = p => p.gunler.reduce((a, g) => a + g.hareketler.length, 0);

export function programsHTML() {
  const aktif = N.aktifProgram();
  const satirlar = N.programListesi().map(p => `
    <button class="satir yalin" data-program-ac="${esc(p.id)}">
      <span class="ad"><b>${esc(p.ad)}</b><span>${p.gunler.length} gün · ${hareketSayisi(p)} hareket</span></span>
      <span class="sag">${p === aktif ? '<span class="rozet">Kullanılıyor</span>' : ''}</span>${ik('ileri')}
    </button>`).join('');
  return `
    <div class="sayfa-baslik ust-bosluk"><h1>Programlar</h1>
      <p>Bugün ekranı <b>kullanılan</b> programın sıradaki gününü gösterir.</p></div>
    <div class="liste">${satirlar}</div>
    <div class="grup"><button class="btn s" data-act="program-yeni">${ik('arti')}Yeni program</button></div>
    <div class="grup"><h2 class="etiket">Hazır programlar</h2><div class="hazir-liste">${HAZIR.map(hazirSatiri('data-hazir')).join('')}</div>
      <p class="kucuk-yazi grup-alti">Dokun: günlerini gör, kopyasını programlarına ekle. Eklenen kopya senindir; düzenleyebilirsin.</p></div>
    ${sekmelerHTML('programlar')}`;
}

/* ══ HAZIR PROGRAMLAR + İLK AÇILIŞ (Faz 1C, 14 Eki — mockup-ilk-acilis.html, Sabri onayı) ═════════════════════════ */
/** Rozet: programdaki farklı gün sayısı (A/B dönüşümlü programlar haftada 3 gün yapılsa da 2 farklı gündür) */
const hazirRozet = h => h.gunler.length === 2 ? 'A / B' : `${h.gunler.length} farklı gün`;
const hazirSatiri = nitelik => h => `<button class="hazir" ${nitelik}="${esc(h.id)}"><span class="ad"><b>${esc(h.ad)}</b><span>${esc(h.kime)}</span></span>
  <span class="rozet">${hazirRozet(h)}</span></button>`;
/** Hazır programın kartı: ad, kime, günler ve hareketleri (gün adı boşsa "1. Gün") */
function hazirKartHTML(h, etiket) {
  const hedef = x => x.seconds != null ? `${x.sets}×${x.seconds} sn` : `${x.sets}×${x.reps}`;
  return `<div class="oneri-kart">${etiket ? `<small>${etiket}</small>` : ''}<h2>${esc(h.ad)}</h2><p>${esc(h.kime)}</p>
    <div class="gun-ozet">${h.gunler.map(([g, ks], i) => `<div><b>${esc(g || `${i + 1}. Gün`)}</b><span>${ks.map(x =>
      `${esc(N.byId[x.exId]?.ad ?? x.exId)} ${hedef(x)}`).join(' · ')}</span></div>`).join('')}</div></div>`;
}
/** Programlar › hazır program önizlemesi */
export function hazirHTML(ctx) {
  const h = hazirBul(ctx.hazirId);
  if (!h) return `<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${ik('geri')}</button></div>`;
  return `
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${ik('geri')}</button>
      <span class="tarih">Hazır program</span><span class="ib-yer"></span></div>
    ${hazirKartHTML(h)}
    <div class="grup"><button class="btn p" data-act="hazir-ekle">${ik('arti')}Programlarıma ekle</button></div>
    <p class="kucuk-yazi grup-alti">Kopyası eklenir; günlerini ve hedeflerini düzenleyebilirsin. Kullanmak için programda "Bu programı kullan".</p>`;
}
/**
 * İLK AÇILIŞ: 0 karşılama · 1–4 soru · 5 profil (isteğe bağlı, avatar önerisi) · 6 öneri.
 * Yalnız taze kurulumda (session.ilkAcilisGerekli); alt sekme çubuğu yok.
 */
export function ilkAcilisHTML(ctx) {
  const d = ctx.ia;
  const cizgi = `<div class="ilerleme-cizgi" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= d.adim ? 'dolu' : ''}"></i>`).join('')}</div>`;
  if (d.adim === 0) return `
    <div class="karsilama"><img class="logo" src="icons/fs-192.png" alt="">
      <h1>Antrenman defterin hazır.</h1>
      <p>Dört kısa soru; sana uygun programı önerelim. Bir dakika sürer.</p>
      <ul><li>Her hareketin 3B anlatımı</li><li>Set, tekrar ve ağırlık kaydı</li><li>Hesap yok; verilerin telefonunda kalır</li></ul>
      <p class="kucuk-yazi">FitSet bir egzersiz yardımcısıdır, tıbbi tavsiye vermez. Bir sağlık sorunun varsa başlamadan önce hekimine danış.
        Devam ederek <a href="kosullar.html">Kullanım koşullarını</a> kabul etmiş olursun; verilerinin nasıl tutulduğu
        <a href="gizlilik.html">Gizlilik politikasında</a>.</p></div>
    <div class="alt-bar dikey"><button class="btn p" data-ia="ileri">Başlayalım</button>
      <button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`;
  if (d.adim <= 4) {
    const s = SORULAR[d.adim - 1];
    return `${cizgi}
    <div class="soru"><h1>${s.soru}</h1>${s.alt ? `<p>${s.alt}</p>` : ''}</div>
    <div class="secenekler" role="group" aria-label="${s.soru}">${s.secenek.map(([v, b, a]) =>
      `<button class="secenek" aria-pressed="${d.c[s.anahtar] === v}" data-ia-cevap="${s.anahtar}:${v}"><span class="ad"><b>${b}</b>${a ? `<span>${a}</span>` : ''}</span></button>`).join('')}</div>
    <div class="alt-bar"><button class="btn s" data-ia="geri">${ik('geri')}Geri</button><span class="kucuk-yazi">${d.adim} / 4</span></div>`;
  }
  if (d.adim === 5) {
    const onerilen = AV.cozumle({}, { yas: d.profil.yas, cinsiyet: null }).govde;
    const secili = d.profil.govde ?? onerilen;
    return `${cizgi}
    <div class="soru"><h1>Seni tanıyalım</h1><p>İsteğe bağlı: avatarını seç. Bilgiler yalnız bu telefonda kalır.</p></div>
    <div class="profil-alan">
      <div class="form-alan"><label for="ia-ad">Adın</label><input id="ia-ad" class="metin" maxlength="24" autocomplete="off" placeholder="İsteğe bağlı" value="${esc(d.profil.ad ?? '')}"></div>
      <div class="form-alan"><label for="ia-yas">Yaşın</label><input id="ia-yas" class="metin" inputmode="numeric" maxlength="3" placeholder="İsteğe bağlı" value="${d.profil.yas ?? ''}"></div>
      <div class="form-alan"><span class="etiket">Avatar</span><div class="cip-izgara">${AV.GOVDELER.map(g =>
        `<button class="cip" aria-pressed="${g.id === secili}" data-ia-govde="${g.id}">${esc(g.ad)}</button>`).join('')}</div></div></div>
    <div class="alt-bar"><button class="btn s" data-ia="atla">Atla</button><button class="btn p" data-ia="ileri">Devam</button></div>`;
  }
  const id = d.secili ?? oner(d.c), h = hazirBul(id);
  return `
    <div class="soru"><h1>Senin için önerimiz</h1><p>Hedefine ve haftana göre seçildi; istediğin zaman değiştirebilirsin.</p></div>
    ${hazirKartHTML(h, d.secili ? 'SEÇTİĞİN' : 'ÖNERİLEN')}
    <div class="alt-bar dikey"><button class="btn p" data-ia="basla">Bu programla başla</button></div>
    <div class="grup"><h2 class="etiket">Diğer programlar</h2><div class="hazir-liste">${HAZIR.filter(x => x.id !== id).map(hazirSatiri('data-ia-sec')).join('')}</div></div>
    <div class="grup"><button class="btn s" data-ia="kendim">Kendim kuracağım</button></div>`;
}

/** Bir hedef ayarlayıcı: − değer + (düzenleyicide kardiyo dakikası için) */
const ayarlayici = (i, alan, yazi, ad) => `<span class="hedef">
    <button class="adim" data-kalem="${i}:${alan}:-1" aria-label="${ad} azalt">${ik('eksi')}</button>
    <b>${yazi}</b>
    <button class="adim" data-kalem="${i}:${alan}:1" aria-label="${ad} artır">${ik('arti')}</button></span>`;

/** Kalemin hedef hapı: "5 × 5" · "3 × 45 sn" · "20 dk" */
const hapYazi = k => k.minutes != null ? `${k.minutes} dk` : k.seconds != null ? `${k.sets} × ${k.seconds} sn`
  : `${k.sets} × ${k.repsMin && k.repsMin < k.reps ? `${k.repsMin}-` : ''}${k.reps}`;

/**
 * DÜZENLEYİCİ SATIRI (11 Eki, onaylı mokap): kapalıyken görsel · ad · hedef hapı · tutacak (⋮⋮ sürükle → sıra).
 * Dokununca açılır: set noktaları + tekrar şeridi + hazır şema (süreli harekette süre çipleri,
 * kardiyoda dakika) ve "Bu günden çıkar". Bir seferde tek satır açık. Yukarı/aşağı okları yok (Sabri).
 */
function duzenSatiriHTML(k, i, acik, genelSn = 60) {
  const ex = N.byId[k.exId] ?? N.bilinmeyenHareket(k.exId);
  const alt = [ex.grup, EKIPMAN[ex.equipment]].filter(Boolean).join(' · ');
  const on = `${i}:`;
  let ayar = '';
  if (acik) {
    const setAlani = k.minutes != null ? '' : `<div class="g-alan"><div class="g-etk"><span>Set</span><b>${k.sets}</b></div>${noktalarHTML('dz-set', k.sets, on)}</div>`;
    const hedef = k.minutes != null
      ? `<div class="g-alan"><div class="g-etk"><span>Süre</span></div>${ayarlayici(i, 'minutes', `${k.minutes} dk`, 'Süre')}</div>`
      : k.seconds != null
        ? `<div class="g-alan"><div class="g-etk"><span>Süre</span><b>${k.seconds} sn</b></div>
            <div class="semalar" role="group" aria-label="Süre">${[...new Set([15, 20, 30, 45, 60, 90, k.seconds])].sort((a, b) => a - b).map(v =>
              `<button class="cip" aria-pressed="${v === k.seconds}" data-dz-sn="${on}${v}">${v} sn</button>`).join('')}</div></div>`
        : `<div class="g-alan"><div class="g-etk"><span>Tekrar</span><b>${k.reps}</b></div>${tekrarSeridiHTML('dz-tekrar', k.reps, on)}</div>
           ${semalarHTML('dz-sema', k.sets, k.reps, on)}`;
    const yontem = k.minutes != null ? '' : yontemHTML('dz-yontem', k, on, genelSn, { tekrarli: k.reps != null && ex.setType !== 'time' });
    ayar = `<div class="acilir">${setAlani}${hedef}${yontem}
      <div class="alt-eylem"><button class="btn s" data-cikar="${i}">${ik('sil')}Bu günden çıkar</button></div></div>`;
  }
  return `<div class="satir-d${acik ? ' acik' : ''}" data-dz-i="${i}">
    <div class="kafa">${kucuk(ex)}
      <button class="ad" data-dz-ac="${i}" aria-expanded="${acik}"><b>${adi(ex)}</b>${alt ? `<small>${esc(alt)}</small>` : ''}</button>
      <button class="hap" data-dz-ac="${i}" aria-label="${adi(ex)}: hedef ${hapYazi(k)}">${hapYazi(k)}</button>
      <button class="tutac" data-dz-tutac="${i}" aria-label="${adi(ex)}: sırayı değiştir — sürükle ya da yukarı/aşağı ok tuşu">${ik('tutac')}</button>
    </div>${ayar}</div>`;
}

/**
 * PROGRAM DÜZENLEYİCİ — günler çip, hareketler satır. Her dokunuş HEMEN kaydedilir
 * (Kaydet düğmesi yok: salonda yarıda bırakılan düzenleme kaybolmasın).
 */
/** Program, düzenleyiciye girildiği andaki kopyasından farklı mı (güncellenme damgası hariç) */
const programOzu = p => JSON.stringify({ ...p, guncellendi: 0 });
export const programDegisti = (p, kopya) => !!(p && kopya && programOzu(p) !== programOzu(kopya));

export function programHTML(ctx) {
  const p = N.programGetir(ctx.duzen?.id);
  if (!p) return `<div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${ik('geri')}</button></div>
    <div class="sayfa-baslik"><h1>Program bulunamadı</h1></div>`;
  const gi = Math.min(ctx.duzen.gun ?? 0, p.gunler.length - 1), g = p.gunler[gi];
  const aktifMi = p === N.aktifProgram();
  const satirlar = g.hareketler.map((k, i) => duzenSatiriHTML(k, i, ctx.duzen.acik === i, ctx.settings?.restSeconds ?? 60)).join('');
  return `
    <div class="ust"><button class="ib" data-act="to-programs" aria-label="Programlara dön">${ik('geri')}</button>
      ${programDegisti(p, ctx.duzen.kopya) ? `<button class="geri-don" data-act="program-geri-don">${ik('geri-al')}Açtığın hâle dön</button>` : ''}
      ${aktifMi ? '<span class="rozet">Kullanılıyor</span>' : `<button class="cip" data-act="program-aktif">Bu programı kullan</button>`}</div>
    <div class="form-alan"><label for="p-ad">Programın adı</label>
      <input id="p-ad" class="metin" value="${esc(p.ad)}" maxlength="60" autocomplete="off"></div>
    <div class="kaydir" role="group" aria-label="Günler">${p.gunler.map((_, i) =>
      `<button class="cip" aria-pressed="${i === gi}" data-pgun="${i}">${i + 1}. Gün</button>`).join('')}
      ${p.gunler.length < 7 ? `<button class="cip" data-act="gun-ekle" aria-label="Gün ekle">${ik('arti')}Gün</button>` : ''}</div>
    <div class="form-alan"><label for="g-ad">${gi + 1}. günün adı</label>
      <input id="g-ad" class="metin" value="${esc(g.ad ?? '')}" maxlength="60" autocomplete="off"
             placeholder="${esc(N.gunEtiketi(gi, p).kaslar)}"></div>
    <div class="grup"><h2 class="etiket">Hareketler · ${g.hareketler.length}</h2>
      ${g.hareketler.length ? `<div class="liste-d" id="dz-liste">${satirlar}</div>`
        : '<div class="ic"><p>Bu gün boş. Aşağıdan hareket ekle.</p></div>'}
    </div>
    <div class="grup eylemler"><button class="btn s" data-act="secici-ac">${ik('arti')}Hareket ekle</button>
      ${p.gunler.length > 1 ? `<button class="btn s" data-act="gun-sil">${gi + 1}. günü sil</button>` : ''}
      ${!aktifMi && p.id !== 'benim' ? '<button class="btn s" data-act="program-sil">Programı sil</button>' : ''}
    </div>
    <p class="kucuk-yazi">Satıra dokun: set ve tekrar. ⋮⋮ tutup sürükle: sıra. Değişiklikler hemen kaydedilir; geçmişteki seanslar etkilenmez.</p>`;
}

/* ── Hareket seçici ───────────────────────────────────────────────────── */

/** Arama: Türkçe büyük/küçük harf duyarsız; Türkçe ad, İngilizce ad ve kaslarda */
const kucult = v => String(v ?? '').toLocaleLowerCase('tr');
export function seciciSonuc(s) {
  const q = kucult(s.ara).trim();
  return N.kutuphaneListesi()
    .filter(ex => (!s.grup || ex.grup === s.grup) && (!s.eq || ex.equipment === s.eq)
      && (!q || kucult(ex.ad).includes(q) || kucult(ex.en).includes(q) || kucult(ex.mus).includes(q)))
    .sort((a, b) => kucult(a.ad).localeCompare(kucult(b.ad), 'tr'));
}

export function seciciListeHTML(ctx) {
  const liste = seciciSonuc(ctx.secici);
  const g = N.programGetir(ctx.duzen?.id)?.gunler[ctx.duzen.gun];
  const gunde = new Set(g?.hareketler.map(k => k.exId) ?? []);
  if (!liste.length) return '<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';
  // 14 Eki: ÖZEL harekette satırın yanında Sil (uygulamanın kendi hareketlerinde YOK — onlar silinemez).
  // Ayrı düğme: satırın kendisi "ekle" düğmesi, iç içe düğme olmaz.
  const satir = ex => `
    <button class="satir" data-ekle="${esc(ex.id)}">
      ${kucuk(ex)}
      <span class="ad"><b>${adi(ex)}</b><span>${[gunde.has(ex.id) && 'bu günde var', ex.en && `<span lang="en">${esc(ex.en)}</span>`,
        EKIPMAN[ex.equipment], ex.ozel && 'özel'].filter(Boolean).join(' · ')}</span></span>
      <span class="durum ikon">${ik('arti')}</span>
    </button>`;
  return `<p class="sayac">${liste.length} hareket</p><div class="liste">${liste.map(ex => ex.ozel
    ? `<div class="satir-ozel">${satir(ex)}<button class="ozel-sil" data-ozel-sil="${esc(ex.id)}" aria-label="${adi(ex)}: kütüphaneden sil">${ik('sil')}</button></div>`
    : satir(ex)).join('')}</div>`;
}

export function seciciHTML(ctx) {
  const s = ctx.secici;
  return `
    <div class="ust"><button class="ib" data-act="secici-kapat" aria-label="Kapat">${ik('carpi')}</button>
      <span class="tarih">Hareket ekle · ${ctx.duzen.gun + 1}. Gün</span><span class="ib-yer"></span></div>
    <label class="arama">${ik('ara')}<input id="ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${['', ...GRUPLAR].map(k =>
      `<button class="cip" aria-pressed="${s.grup === k}" data-sgrup="${k}">${k || 'Tüm kaslar'}</button>`).join('')}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${['', ...Object.keys(EKIPMAN)].map(k =>
      `<button class="cip" aria-pressed="${s.eq === k}" data-seq="${k}">${k ? EKIPMAN[k] : 'Tüm ekipman'}</button>`).join('')}</div>
    <div id="secici-liste">${seciciListeHTML(ctx)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac">Listede yok mu? Özel hareket ekle</button></div>`;
}

/* ══ HAREKETLER SEKMESİ (14 Eki, Sabri: "hareket gruplarını ve hareketleri inceleyebileceğimiz bir liste yok") ══════
   Liste kas grubuna göre bölümlü; arama ve süzgeçler hareket seçicininkiyle AYNI (seciciSonuc). Satıra dokun →
   ayrıntı: 3B (sürükle: döndür), kaslar, geçmişin (son + en iyi set), nasıl yapılır, dikkat, Programa ekle. */
export function kutuphaneListeHTML(ctx) {
  const liste = seciciSonuc(ctx.kutuphane);
  const bolumler = (ctx.kutuphane.grup ? [ctx.kutuphane.grup] : GRUPLAR).map(g => [g, liste.filter(e => e.grup === g)]).filter(([, l]) => l.length);
  if (!bolumler.length) return '<div class="grup"><div class="ic"><p>Bulunamadı. Aşağıdan özel hareket olarak ekleyebilirsin.</p></div></div>';
  return bolumler.map(([g, l]) => `
    <div class="bolum-baslik"><h2>${esc(g)}</h2><span>${l.length}</span></div>
    <div class="liste">${l.map(ex => `
      <button class="satir" data-hareket="${esc(ex.id)}">
        ${kucuk(ex)}
        <span class="ad"><b>${adi(ex)}</b><span>${[ex.mus, EKIPMAN[ex.equipment], ex.ozel && 'özel'].filter(Boolean).map(esc).join(' · ')}</span></span>
        <span class="durum ok">${ik('ileri')}</span>
      </button>`).join('')}</div>`).join('');
}
export function kutuphaneHTML(ctx) {
  const s = ctx.kutuphane, n = seciciSonuc(s).length;
  return `
    <div class="sayfa-baslik ust-bosluk"><h1>Hareketler</h1><p>${n} hareket · dokun: nasıl yapılır, kaslar, geçmişin</p></div>
    <label class="arama">${ik('ara')}<input id="k-ara" type="search" value="${esc(s.ara)}" placeholder="Ara: squat, göğüs, curl…"
      autocomplete="off" aria-label="Hareket ara"></label>
    <div class="kaydir" role="group" aria-label="Kas grubu">${['', ...GRUPLAR].map(k =>
      `<button class="cip" aria-pressed="${s.grup === k}" data-kgrup="${k}">${k || 'Tüm kaslar'}</button>`).join('')}</div>
    <div class="kaydir" role="group" aria-label="Ekipman">${['', ...Object.keys(EKIPMAN)].map(k =>
      `<button class="cip" aria-pressed="${s.eq === k}" data-keq="${k}">${k ? EKIPMAN[k] : 'Tüm ekipman'}</button>`).join('')}</div>
    <div id="kutuphane-liste">${kutuphaneListeHTML(ctx)}</div>
    <div class="grup"><button class="btn s" data-act="ozel-ac-kutuphane">${ik('arti')}Özel hareket ekle</button></div>
    ${sekmelerHTML('hareketler')}`;
}

/** Hareket ayrıntısı · REKORLARIN (14 Eki, K10): tür başına en iyi + ağırlık başına en çok tekrar. Bir seanslık
    kayıtta gösterilmez — tek seans "en iyi"den başka bir şey söylemez (Geçmişin zaten gösteriyor). */
function rekorlarHTML(r, g, birim, tarih) {
  if (!r || !g || g.sayi < 2) return '';
  const turler = RK.TURLER.filter(t => r[t]);
  if (!turler.length) return '';
  return `<div class="grup"><h2 class="etiket">Rekorların</h2><div class="ic"><div class="rekor-tablo">${turler.map(t =>
    `<span>${RK.TUR_AD[t]}<small>${tarih(r[t].at)} · ${setKisa(r[t].set, birim)}</small></span><span><b>${rekorDeger(t, r[t].deger, birim)}</b></span>`).join('')}</div>
    ${r.tekrarlar.length > 1 ? `<p class="rekor-ara">Ağırlık başına en çok tekrar</p><div class="tekrar-cipleri">${r.tekrarlar.map(x =>
      `<span><b>${fmt(x.agirlik)} ${birim}</b> × ${x.tekrar}</span>`).join('')}</div>` : ''}
    ${r.bir ? '<p class="oz-kural">Tahmini 1 tekrar maksimumu en fazla 10 tekrarlı setlerden hesaplanır (Brzycki); ısınma setleri sayılmaz.</p>' : ''}</div></div>`;
}

/** Her hareketin ayrıntısında (15 Eki, Sabri: "sporcuya verdiğimiz bilgilerden sorumluyuz; yanlış bilgi yüzünden sakatlanmasın") */
export const GUVENLIK_NOTU = 'Ağrı, baş dönmesi, göğüs ağrısı ya da olağandışı nefes darlığı olursa hemen dur. Bir sağlık sorunun varsa, gebeysen ya da uzun süredir hareketsizsen başlamadan önce hekimine danış. FitSet tıbbi tavsiye vermez.';

/** Ağırlıklı harekette başlangıç yükü (ACSM 2009 / NSCA: hedef tekrarı temiz teknikle, yedekte 2–3 tekrar kalacak yük) */
export const ilkAgirlikNotu = ex => ex?.setType !== 'weight_reps' || ex.equipment === 'bodyweight' ? ''
  : `İlk seansta hedef tekrarı temiz teknikle bitirip 2–3 tekrar daha yapabileceğin ağırlığı seç.${ex.equipment === 'barbell' ? ' Önce boş barla tekniği öğren.' : ''}`;

/** Bir set kısaca: "60 kg × 8" · "12 tekrar" (ağırlıksız) · "45 sn" · "20 dk" */
const setKisa = (s, birim) => s.type === 'time' ? `${fmt(s.seconds)} sn` : s.type === 'cardio' ? `${fmt(s.minutes)} dk`
  : s.weight ? `${fmt(s.weight)} ${birim} × ${s.reps ?? '—'}` : `${s.reps ?? '—'} tekrar`;
const hedefKisa = ex => ex.target?.minutes != null ? `${ex.target.minutes} dk` : ex.target?.seconds != null
  ? `${ex.sets} × ${ex.target.seconds} sn` : `${ex.sets} × ${ex.target?.reps ?? '—'}`;

export function hareketHTML(ctx) {
  const ex = N.byId[ctx.hareketId];
  if (!ex) return `<div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${ik('geri')}</button></div>
    <div class="sayfa-baslik"><h1>Hareket bulunamadı</h1></div>`;
  const kaslar = String(ex.mus ?? '').split('·').map(k => k.trim()).filter(Boolean);
  const g = ctx.hareketGecmisi, birim = ctx.settings?.unit ?? 'kg';
  const tarih = at => C.fmtShort(new Date(at));
  return `
    <div class="ust"><button class="ib" data-act="to-hareketler" aria-label="Hareketlere dön">${ik('geri')}</button>
      <span class="tarih">${esc(ex.grup ?? '')}</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(ex)}</h1>${ex.en ? `<p lang="en">${esc(ex.en)}</p>` : ''}</div>
    ${cizimsiz(ex) ? '<div class="grup"><div class="ic"><p>Özel hareket · çizimi yok.</p></div></div>'
      : `<div class="buyuk3b"><div class="sahne3d" id="hareket3d" role="img" aria-label="${adi(ex)} hareket çizimi; sürükleyerek döndürülür"></div>
         <img class="damga" src="icons/isaret.svg" alt="" width="30" height="17"><span class="ipucu">Sürükle: döndür · dokun: yeniden oynat</span></div>`}
    <p class="kunye">${[EKIPMAN[ex.equipment], `Önerilen ${hedefKisa(ex)}`].filter(Boolean).map(esc).join(' · ')}</p>
    ${kaslar.length ? `<div class="grup"><h2 class="etiket">Çalışan kaslar</h2><div class="ic"><div class="kaslar">${kaslar.map((k, i) =>
      `<span class="kas${i < 2 ? ' ana' : ''}">${esc(k)}</span>`).join('')}</div></div></div>` : ''}
    ${ex.fayda ? `<div class="grup"><h2 class="etiket">Faydası</h2><div class="ic"><p>${esc(ex.fayda)}</p></div></div>` : ''}
    <div class="grup"><h2 class="etiket">Geçmişin</h2><div class="ic">${g ? `
      <div class="ozet-iki">
        <div><small>Son · ${tarih(g.son.at)}</small><b>${setKisa(g.son.set, birim)}</b></div>
        <div><small>En iyi · ${tarih(g.enIyi.at)}</small><b>${setKisa(g.enIyi.set, birim)}</b></div></div>
      <p class="kucuk-yazi">${g.sayi} seansta yapıldı</p>
      ${g.not ? `<p class="seans-notu">${ik('liste')}<span>${esc(g.not.metin)} <small>· ${tarih(g.not.at)}</small></span></p>` : ''}` : '<p>Bu hareketi henüz kaydetmedin.</p>'}</div></div>
    ${rekorlarHTML(ctx.hareketRekor, g, birim, tarih)}
    ${ex.steps?.length ? `<div class="grup"><h2 class="etiket">Nasıl yapılır</h2><div class="ic"><ol class="adimlar">${ex.steps.map(a =>
      `<li>${esc(a)}</li>`).join('')}</ol></div></div>` : ''}
    ${ex.tip ? `<div class="grup"><h2 class="etiket">Dikkat</h2><div class="ipucu-kutu">${esc(ex.tip)}</div></div>` : ''}
    ${ilkAgirlikNotu(ex) ? `<p class="kucuk-yazi grup-alti">${ilkAgirlikNotu(ex)}</p>` : ''}
    <p class="kucuk-yazi grup-alti">${GUVENLIK_NOTU}</p>
    <div class="grup eylemler"><button class="btn p" data-act="hareket-ekle-ac">${ik('arti')}Programa ekle</button>
      ${ex.ozel ? `<button class="btn s" data-ozel-sil="${esc(ex.id)}">${ik('sil')}Hareketi sil</button>` : ''}</div>
    ${sekmelerHTML('hareketler')}`;
}

/** Programa ekle: program ve gün seçilir; önerilen hedefle eklenir */
export function hareketEkleHTML(ctx) {
  const ex = N.byId[ctx.hareketId], p = N.programGetir(ctx.hareketEkle?.programId) ?? N.aktifProgram();
  if (!ex) return '';
  return `
    <div class="ust"><button class="ib" data-act="hareket-ekle-kapat" aria-label="Kapat">${ik('carpi')}</button>
      <span class="tarih">Programa ekle</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>${adi(ex)}</h1><p>Hangi programın hangi gününe?</p></div>
    <div class="grup"><h2 class="etiket">Program</h2><div class="kaydir" role="group" aria-label="Program">${N.programListesi().map(x =>
      `<button class="cip" aria-pressed="${x.id === p.id}" data-he-prg="${esc(x.id)}">${esc(x.ad)}</button>`).join('')}</div></div>
    <div class="grup"><h2 class="etiket">Gün</h2><div class="gun-secim">${p.gunler.map((g, i) => `
      <button class="satir" data-he-gun="${i}">
        <span class="ad"><b>${N.gunEtiketi(i, p).kisa}</b><span>${[N.gunEtiketi(i, p).kaslar, `${g.hareketler.length} hareket`,
          g.hareketler.some(k => k.exId === ex.id) && 'bu günde var'].filter(Boolean).map(esc).join(' · ')}</span></span>
        <span class="durum ikon">${ik('arti')}</span>
      </button>`).join('')}</div></div>
    <p class="kucuk-yazi grup-alti">${esc(hedefKisa(ex))} hedefiyle eklenir; programda değiştirebilirsin.</p>`;
}


/* ── Özel hareket ─────────────────────────────────────────────────────── */
export function ozelHTML(ctx) {
  const o = ctx.ozelForm;
  const ciplar = (ad, sozluk, secili) => Object.entries(sozluk).map(([v, a]) =>
    `<button class="cip" aria-pressed="${secili === v}" data-${ad}="${v}">${a}</button>`).join('');
  return `
    <div class="ust"><button class="ib" data-act="ozel-kapat" aria-label="Hareket seçiciye dön">${ik('geri')}</button>
      <span class="tarih">Özel hareket</span><span class="ib-yer"></span></div>
    <div class="sayfa-baslik"><h1>Özel hareket</h1>
      <p>Listede olmayan hareketi kendin ekle. Çizimi olmaz; kaydı ve geçmişi diğerleri gibi tutulur.</p></div>
    <div class="form-alan"><label for="o-ad">Adı</label>
      <input id="o-ad" class="metin" value="${esc(o.ad)}" maxlength="60" autocomplete="off" placeholder="ör. Smith makinesinde squat"></div>
    <div class="form-alan"><span class="etiket">Nasıl kaydedilsin?</span>
      <div class="cip-izgara">${ciplar('otur', SET_TURU, o.setType)}</div></div>
    <div class="form-alan"><span class="etiket">Ekipman</span>
      <div class="cip-izgara">${ciplar('oeq', EKIPMAN, o.equipment)}</div></div>
    <div class="form-alan"><span class="etiket">Çalışan kas</span>
      <div class="cip-izgara">${ciplar('ogrup', Object.fromEntries(GRUPLAR.map(g => [g, g])), o.grup)}</div></div>
    <div class="alt"><button class="btn p" data-act="ozel-kaydet">Ekle ve güne koy</button></div>`;
}
