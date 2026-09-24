/**
 * FitSet — uygulama kabuğu ve yönlendirme.
 *
 * İki ekran: LİSTE ("bugün ne var, nerede kaldım") ve ODAK ("şu an ne yapıyorum").
 * Ağır mantığın tamamı modüllerde (store / schedule / session / anim / timer);
 * burası yalnız durum tutar, çizer ve olayları bağlar.
 */
import * as A3 from './anim3d/sahne.js';
import * as C from './schedule.js';
import * as N from './session.js';
import * as S from './store.js';
import * as UI from './ui.js';
import * as I from './ilerleme.js';
import { Countdown, mmss, primeAudio } from './timer.js';

const $ = id => document.getElementById(id);
const listEl = $('list-screen'), focusEl = $('focus-screen');

/* ── Durum ─────────────────────────────────────────────────────────────── */
const ctx = {
  session: null, dayIndex: 0, idx: 0,
  lastPerf: {}, settings: S.DEFAULT_SETTINGS, status: null,
  oneri: {},                 // ağırlık artırma önerisi (iki seans kuralı) — hareket başına
  draft: {},                 // o an ekranda duran, henüz kaydedilmemiş değerler
  tumRozetler: false,        // "+N" açıldı mı — harekete özel, geçicidir
  yarim: null,               // yarım kalan gün önerisi (cevap verilene kadar)
  oncekiYapilan: null,       // devredilen günde geçen sefer yapılmış hareketler
  kilolar: [], gecmis: [], ilerleme: [],   // geçmiş ekranı — açılırken doldurulur
  gunSecici: false,          // gün seçici paneli açık mı
  duzenlenen: null,          // geçmiş ekranından açılan seans
  onerilen: 0,               // programın önerdiği gün (kullanıcı ezebilir)
  view: 'list',
};
let bootDay = C.dayNumber(new Date());
/* Bekleyen yeni sürüm (bkz. GÜNCELLEME). render() onu okuduğu için burada,
   ilk çizimden ÖNCE tanımlı olmalı. */
let bekleyenSW = null, sorulanSW = null;
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

/**
 * Dinlenme — gezinme satırının ortasında, ayrı bant AÇMADAN.
 * Yeni bir şerit belirse ekranda her şey kayar; boşta zaten orada duran
 * "Dinlenme 90 sn" düğmesi canlı sayaca dönüşüyor, göz aynı noktada kalıyor.
 */
const rest = new Countdown({
  onTick: (k, toplam) => {
    const e = $('rest-time'); if (e) e.textContent = mmss(k);
    const l = $('restline'); if (l) l.style.transform = `scaleX(${toplam ? k / toplam : 0})`;
  },
  onDone: gecikme => {
    restSlot();
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    toast(gecikme > 2
      ? `Dinlenme ${Math.round(gecikme)} sn önce bitti.`   // dürüst: kaçırdıysa söyler
      : 'Dinlenme bitti — sıradaki set.');
  },
});

/** Yuvayı mevcut duruma göre tazeler (boşta düğme / çalışırken sayaç) */
function restSlot() {
  const slot = $('restslot');
  if (!slot) return;
  slot.innerHTML = UI.restSlotHTML(ctx.settings, rest.running ? rest.remaining : null);
  const l = $('restline');
  if (l) l.style.transform = `scaleX(${rest.running && rest.total ? rest.remaining / rest.total : 0})`;
}

/**
 * Saat görünümünü tek yerden tazeler: rakam, "canlı" durumu ve düğme etiketi.
 * Üç yerde ayrı ayrı güncellenirken biri unutuluyordu (durdurunca rakam eski
 * kalıyordu) — tek fonksiyon olunca o hata sınıfı ortadan kalkıyor.
 */
function saatDurumu(ex) {
  const c = $('clock'), b = $('clock-btn'), t = $('clock-time');
  const çalışıyor = hold.running;
  c?.classList.toggle('run', çalışıyor);
  if (b) b.textContent = çalışıyor ? 'Durdur' : 'Başlat';
  if (t && !çalışıyor) t.textContent = mmss(ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds);
}

/** Set süresi — izometrik hareketler (Plank) */
const hold = new Countdown({
  onTick: k => { const e = $('clock-time'); if (e) e.textContent = mmss(k); },
  onDone: async () => {
    const ex0 = curEx(); saatDurumu(ex0);
    const ex = ex0;
    const oldu = await kaydet(ex, { type: 'time', seconds: ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds, warmup: !!ctx.draft.warmup });
    if (oldu) toast('Süre doldu — set kaydedildi.');   // başarısızsa hata şeridi yerinde kalsın
  },
});


/* ── Kayan panel ───────────────────────────────────────────────────────── */
function sheet(aç) {
  const s = $('sheet'), bg = document.querySelector('.sheet-bg');
  if (!s || !bg) return;
  if (aç) {
    bg.hidden = false;
    requestAnimationFrame(() => { bg.classList.add('on'); s.classList.add('on'); });
    s.setAttribute('aria-hidden', 'false');
  } else {
    s.classList.remove('on'); bg.classList.remove('on');
    s.setAttribute('aria-hidden', 'true');
    s.style.transform = '';
    setTimeout(() => { bg.hidden = true; }, 300);
  }
}
const sheetAçık = () => $('sheet')?.classList.contains('on');

/** Aşağı sürükleyerek kapatma — parmakla en doğal kapanış */
let sy = 0, sürükle = false;
document.addEventListener('touchstart', e => {
  if (!sheetAçık()) return;
  const s = $('sheet');
  // Panel içeriği yukarı kaydırılmışsa sürükleme değil kaydırma istiyordur
  if (e.target.closest('.sheet-in') && $('sheet').querySelector('.sheet-in').scrollTop > 0) return;
  if (!e.target.closest('.sheet')) return;
  sy = e.touches[0].clientY; sürükle = true; s.style.transition = 'none';
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!sürükle) return;
  const d = e.touches[0].clientY - sy;
  if (d > 0) $('sheet').style.transform = `translateY(${d}px)`;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!sürükle) return;
  sürükle = false;
  const s = $('sheet');
  s.style.transition = '';
  const d = e.changedTouches[0].clientY - sy;
  if (d > 90) sheet(false); else s.style.transform = '';   // eşiği geçmediyse geri yerine
});

addEventListener('keydown', e => { if (e.key === 'Escape' && sheetAçık()) sheet(false); });

/* ── Isınma animasyonu — SIRAYLA, tek seferde bir figür ────────────────────
   Beşini birden oynatmak hem görsel gürültü hem gereksiz maliyet olurdu
   (5 SVG × 60fps yeniden çizim orta seviye telefonda hissedilir). Sıralı
   oynatma maliyeti tek figüre indiriyor ve gözü ısınma sırasında yukarıdan
   aşağı gezdiriyor. Dokununca o hareket hemen öne alınır. */
const isinmaAnim = { raf: 0, hangi: 0, t0: 0 };
const DONGU = 2400;

function isinmaOynat() {
  isinmaDur();
  const adımlar = N.warmupFor(ctx.dayIndex);
  if (!adımlar.length) return;

  // Hepsini durağan kareyle bir kez çiz — animasyon sırası gelmeden de görünsünler
  isinmaDurağan();
  if (reduced) return;

  const adım = now => {
    if (!isinmaAnim.t0) isinmaAnim.t0 = now;
    const e = (now - isinmaAnim.t0) / DONGU;
    const w = adımlar[isinmaAnim.hangi % adımlar.length];
    if (e >= 1) {
      isinmaÇiz(w, 0.55);                            // durağan kareye dön
      isinmaAnim.hangi++; isinmaAnim.t0 = now;
    } else {
      // Gidip gelen hareket 0→1→0 zıplamadan; dönen hareket (kol çevirme) 0→1 bir tur
      isinmaÇiz(w, A3.hareketBul(w)?.dongu ? e : (1 - Math.cos(2 * Math.PI * e)) / 2);
    }
    isinmaAnim.raf = requestAnimationFrame(adım);
  };
  isinmaAnim.raf = requestAnimationFrame(adım);
}
/** Isınma satırındaki minik 3B figür — küçük alanda figür boşlukta kaybolmasın diye SIKI kadraj */
function isinmaÇiz(w, t) {
  A3.ciz(document.querySelector(`[data-anim="${w.id}"]`), A3.hareketBul(w), t, { bicim: 'sabit' });
}
function isinmaDurağan() { N.warmupFor(ctx.dayIndex).forEach(w => isinmaÇiz(w, 0.55)); }
function isinmaDur() {
  if (isinmaAnim.raf) cancelAnimationFrame(isinmaAnim.raf);
  isinmaAnim.raf = 0; isinmaAnim.t0 = 0;
}

/* ── Çizim ─────────────────────────────────────────────────────────────── */
/* Ekran tablosu: yeni ekran eklemek buraya bir satırdır. Eskiden if/else
   zinciriydi; üçüncü ekranda hangi ekranın 'on' sınıfını kimin sildiği
   takip edilemez olmuştu. Yalnız AKTİF ekran yeniden çizilir. */
const EKRAN = {
  list:     { el: () => listEl,               html: () => UI.listHTML(ctx) },
  focus:    { el: () => focusEl,              html: () => UI.focusHTML(ctx) },
  warmup:   { el: () => $('warmup-screen'),   html: () => UI.warmupHTML(ctx) },
  settings: { el: () => $('settings-screen'), html: () => UI.settingsHTML(ctx) },
  history:  { el: () => $('history-screen'),  html: () => UI.historyHTML(ctx) },
  seans:    { el: () => $('session-screen'),  html: () => UI.sessionEditHTML(ctx) },
};

function render() {
  if (ctx.view !== 'warmup') isinmaDur();
  const ad = EKRAN[ctx.view] ? ctx.view : 'list';
  for (const [k, v] of Object.entries(EKRAN)) v.el().classList.toggle('on', k === ad);
  EKRAN[ad].el().innerHTML = EKRAN[ad].html();

  if (ad === 'warmup' || ad === 'focus') A3.webglHazirla(yenidenÇiz);   // three.js arka planda; hazır olunca geçer
  if (ad === 'warmup') {
    isinmaOynat();
  } else if (ad === 'focus') {
    const ex = curEx();
    if (ex.hold) varyantlarıÇiz(ex);
    else { draw(ex, 0); if (!reduced) play(ex); }
    saatDurumu(ex);
    // Yuva her çizimde tazelenmeli: yeniden çizim sonrası işaretleme boştaki
    // düğmeyi basıyor, ama sayaç hâlâ çalışıyor olabilir. Ayrıca kalan-süre
    // çizgisi eski değerinde takılı kalıyordu (ekranda kırmızı kalıntı).
    restSlot();
  }
  guncellemeyiDene();          // bekleyen sürüm varsa ve artık güvenliyse uygula
}

/* ── Animasyon — 3B (anim3d/sahne.js: WebGL, yoksa SVG) ──────────────────── */
let raf = 0;
let sonT = 0;                                          // son çizilen an — döndürürken aynı kare yeniden çizilir
/** Kullanıcının döndürdüğü açı, hareket başına (oturum içi; kalıcı değil — her açılış ilk açıyla) */
const kamera3d = {};
const kameraOf = (ex, h) => kamera3d[ex.id] ?? h.kamera;
function draw(ex, t) {
  sonT = t;
  const h = A3.hareketBul(ex);
  if (h) A3.ciz($('fig3d'), h, t, { kamera: kameraOf(ex, h) });
}
function play(ex) {
  stopAnim();
  const dongu = A3.hareketBul(ex)?.dongu;
  const t0 = performance.now();
  const adım = now => {
    const ms = now - t0;
    // Gidip gelen hareket 0→1→0 (1,5 sn'de bir yön); dönen hareket (lunge: sağ adım, dön, sol adım,
    // dön) 0→1 sürekli, 3 sn'de bir tur. İkisi de 9 sn sonra durur — pil.
    draw(ex, dongu ? (ms / 3000) % 1 : (1 - Math.cos(ms / 1500 * Math.PI)) / 2);
    if (ms < 9000) raf = requestAnimationFrame(adım); else { raf = 0; draw(ex, 0); }
  };
  raf = requestAnimationFrame(adım);
}
const stopAnim = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

/** İzometrik hareket (plank): doğru ve yanlış duruşlar yan yana, AYNI ölçekte */
function varyantlarıÇiz(ex) {
  const h = A3.hareketBul(ex);
  if (!h?.varyantlar) return;
  const hs = h.varyantlar.map((_, i) => A3.varyant(h, i));
  // Tam YANDAN: "baştan topuğa tek çizgi" yandan okunan bir şey; 3/4 açıda kalçanın sapması kaybolur
  const kam = [0, 6], c = A3.ortakCerceve(hs, kam);
  document.querySelectorAll('[data-varyant]').forEach(el => A3.ciz(el, hs[+el.dataset.varyant], 0, { kamera: kam, cerceve: c }));
}

/** Ekrandaki 3B görselleri yeniden çiz: WebGL hazır olduğunda, GPU bağlamı geri geldiğinde, boyut değişince */
function yenidenÇiz() {
  if (ctx.view === 'focus') { const ex = curEx(); if (ex.hold) varyantlarıÇiz(ex); else if (!raf) draw(ex, sonT); }
  else if (ctx.view === 'warmup') isinmaDurağan();
}
addEventListener('resize', yenidenÇiz);

/* Sürükleyerek döndür — hareketi her açıdan görmek (özellikle yatay düzlemdeki fly, rotasyon).
   Çift dokunuş hareketin kendi açısına döndürür. Çizim ekranın yeniden kurulmasından bağımsız:
   hedef her olayda kimlikle (#fig3d) yeniden bulunur. */
let döndür = null, sonDokunuş = 0;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest?.('#fig3d');
  if (!el || ctx.view !== 'focus') return;
  const ex = curEx(), h = A3.hareketBul(ex);
  if (!h) return;
  const [te, fi] = kameraOf(ex, h);
  döndür = { x: e.clientX, y: e.clientY, te, fi, id: ex.id, oynadı: false };
  try { el.setPointerCapture(e.pointerId); } catch { /* yakalama olmadan da belge düzeyinde dinleniyor */ }
});
document.addEventListener('pointermove', e => {
  if (!döndür) return;
  const dx = e.clientX - döndür.x, dy = e.clientY - döndür.y;
  if (!döndür.oynadı && Math.hypot(dx, dy) < 4) return;
  döndür.oynadı = true;
  kamera3d[döndür.id] = [döndür.te - dx * 0.6, Math.max(-5, Math.min(75, döndür.fi + dy * 0.4))];
  if (!raf) draw(curEx(), sonT);                       // oynuyorsa sonraki kare zaten yeni açıyla çizer
});
const bırak = () => {
  if (!döndür) return;
  if (!döndür.oynadı) {                                // dokunuş (sürükleme değil): çift dokunuş → ilk açı
    const şimdi = performance.now();
    if (şimdi - sonDokunuş < 320) { delete kamera3d[döndür.id]; if (!raf) draw(curEx(), sonT); sonDokunuş = 0; }
    else sonDokunuş = şimdi;
  }
  döndür = null;
};
document.addEventListener('pointerup', bırak);
document.addEventListener('pointercancel', bırak);

/* ── Kayıt ─────────────────────────────────────────────────────────────── */
function draftFor(ex) {
  const lp = ctx.lastPerf[ex.id];
  const ö = N.suggestSet(ex, ctx.session, lp, ctx.settings);
  return { ...ö, warmup: false };
}

/**
 * Kaydetme başarısız olduğunda söylenecek tek cümle. Sessiz kalmak en kötüsü:
 * kullanıcı "basmadım galiba" deyip tekrar basar (bkz. session.transact).
 */
const KAYIT_HATASI = 'Kaydedilemedi — telefonun depolaması yazmayı reddetti. Tekrar dene; sürerse yedek al.';

async function kaydet(ex, veri) {
  try {
    await N.transact(ctx.session, s => N.recordSet(s, ex.id, veri));
  } catch (err) {
    console.error('[kayıt]', err);
    toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} });
    return false;
  }
  ctx.draft = draftFor(ex);
  render();
  if (navigator.vibrate) navigator.vibrate(15);
  // Dinlenme kendiliğinden başlar — seansta ~27 kez elle başlatmak angarya
  if (ctx.settings.restSeconds > 0) { await rest.start(ctx.settings.restSeconds); restSlot(); }
  return true;
}

async function kaydetTıklandı() {
  const ex = curEx();
  const ısınma = $('warm')?.getAttribute('aria-pressed') === 'true';
  if (ex.setType === 'time') {
    const sn = ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds;
    hold.stop(); saatDurumu(ex);
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

  // Isinma figurune dokununca sirasini beklemeden one al
  const wa = t.closest('[data-warm]');
  if (wa && ctx.view === 'warmup') {
    const i = N.warmupFor(ctx.dayIndex).findIndex(w => w.id === wa.dataset.warm);
    if (i >= 0) { isinmaAnim.hangi = i; isinmaAnim.t0 = 0; }
    return;
  }

  // Geçmişte bir seansa dokunmak → düzenleme ekranı
  const hs = t.closest('[data-seans]');
  if (hs) {
    ctx.duzenlenen = await S.getSession(hs.dataset.seans);
    ctx.view = 'seans'; render(); scrollTo(0, 0);
    return;
  }

  // Set silme (düzenleme ekranı)
  const es = t.closest('[data-eset-sil]');
  if (es) {
    const [exId, i] = es.dataset.esetSil.split(':');
    const r = N.deleteSet(ctx.duzenlenen, exId, +i);
    if (!r.ok) return;
    const sonuc = await N.saveEdited(ctx.duzenlenen);
    await gecmisYukle(); await yükle();
    if (sonuc.silindi) {
      // Son set de gitti → seans boşaldı. Kullanıcı kararı (6 Eyl): seansı sil.
      const id = ctx.duzenlenen.id;
      ctx.duzenlenen = null; ctx.view = 'history'; render();
      toast('Son set silindi — seans da silindi.', {
        label: 'Geri getir', sticky: true,
        action: async () => { await N.restoreSession(id); await gecmisYukle(); await yükle();
                              ctx.view = 'history'; render(); },
      });
    } else {
      // ⚠️ yükle() görünümü LİSTEYE çeker. Eskiden burada yalnız render()
      // vardı ve set silen kullanıcı düzenleme ekranından listeye atılıyordu
      // (24 Eyl, canlıda görüldü). Değer düzeltme dalı görünümü geri kuruyordu,
      // bu dal kurmuyordu.
      ctx.view = 'seans';
      render();
      // Tek dokunuşluk silme GERİ ALINABİLİR olmalı (uygulamanın kendi ilkesi:
      // yanlış dokunuş kesin, geri al zorunluluk). Eskiden yalnız "Set silindi." diyordu.
      const d = ctx.duzenlenen;
      toast('Set silindi.', {
        label: 'Geri getir',
        action: async () => {
          if (ctx.duzenlenen?.id !== d.id) return;   // başka seansa geçildiyse dokunma
          N.restoreSet(d, exId, +i, r.silinen);
          await N.saveEdited(d);
          await gecmisYukle(); await yükle();
          ctx.duzenlenen = d; ctx.view = 'seans'; render();
        },
      });
    }
    return;
  }

  // Gün seçici: hangi günü yapacağını kullanıcı söyler
  const gsec = t.closest('[data-gun-sec]');
  if (gsec) {
    const hedef = +gsec.dataset.gunSec;
    if (hedef !== ctx.dayIndex) {
      const r = await N.chooseDay(ctx.session, hedef);
      if (!r.ok) { toast('Bugün set girdin — önce seansı bitir ya da bugünü sıfırla.', { warn: true }); return; }
      ctx.dayIndex = hedef; ctx.idx = 0; ctx.oncekiYapilan = null;
      await lastPerfYukle();
      toast(`${N.DAY_NAMES[hedef].split(' — ')[0]} seçildi.`);
    }
    ctx.gunSecici = false;
    render();
    return;
  }

  // Ayar çipleri: gün seçimi ve dinlenme süresi anında yazılır
  const gunBtn = t.closest('[data-gun]');
  if (gunBtn) { await gunuCevir(+gunBtn.dataset.gun); return; }
  const restBtn = t.closest('[data-rest]');
  if (restBtn) { ctx.settings = await S.saveSettings({ restSeconds: +restBtn.dataset.rest }); render(); return; }

  const go = t.closest('[data-go]');
  if (go) { git(+go.dataset.go); return; }

  const st = t.closest('[data-step]');
  if (st) {
    const [field, d] = st.dataset.step.split(':');
    const inp = $('f-' + field);
    inp.value = Math.max(0, Math.round(((+inp.value || 0) + +d) * 100) / 100);
    ctx.draft[field] = +inp.value;
    if (field === 'reps') { const s = $('reps-show'); if (s) s.textContent = inp.value; }
    return;
  }

  // Tekrar satırı: hedeften geliyor, ama bu sete özel değiştirilebilsin
  if (t.closest('[data-act="reps-edit"]')) {
    const ed = $('repsedit'), btn = t.closest('[data-act="reps-edit"]');
    ed.hidden = !ed.hidden;
    btn.setAttribute('aria-expanded', String(!ed.hidden));
    return;
  }

  // Paneldeki hedef adımlayıcıları — taslağa değil, hedef alanlarına yazar
  const gs = t.closest('[data-gstep]');
  if (gs) {
    const [field, d] = gs.dataset.gstep.split(':');
    const inp = $('g-' + field);
    inp.value = Math.max(0, Math.round(((+inp.value || 0) + +d) * 100) / 100);
    return;
  }

  const a = t.closest('[data-act]')?.dataset.act;
  if (!a) return;
  const ex = ctx.view === 'focus' ? curEx() : null;

  switch (a) {
    case 'warm': {
      const b = $('warm');
      ctx.draft.warmup = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(ctx.draft.warmup));
      break;
    }
    case 'warmup': stopAnim(); ctx.view = 'warmup'; render(); scrollTo(0, 0); break;
    case 'warmup-done': {
      // Tıpkı normal hareketlerdeki gibi doğrudan 1. harekete geç — listeye
      // dönüp oradan seçtirmek akışı kesiyordu.
      await N.transact(ctx.session, s => N.setWarmupDone(s));   // hata → genel yakalayıcı söyler
      isinmaDur();
      git(0);
      break;
    }
    case 'sheet-open': sheet(true); break;
    case 'sheet-close': sheet(false); break;

    case 'goal-save': {
      // Boş bırakılan alan "override yok" demektir — programın değeri geçerli kalır
      const al = f => { const el = $('g-' + f); if (!el) return undefined; const v = el.value.trim(); return v === '' ? undefined : +v; };
      const o = {};
      for (const f of ['sets', 'reps', 'seconds', 'minutes', 'weight']) {
        const v = al(f);
        if (v !== undefined && !Number.isNaN(v)) o[f] = v;
      }
      if (o.sets !== undefined) o.sets = Math.max(1, Math.round(o.sets));
      const ov = { ...ctx.settings.overrides, [ex.id]: o };
      ctx.settings = await S.saveSettings({ overrides: ov });
      // Yeni hedef ağırlık girildiyse kutuya HEMEN yansısın: yeni plan,
      // geçen seferki gerçekleşmeyi ezmeli (yoksa "kaydettim ama değişmedi" olur).
      ctx.draft = draftFor(ex);
      if (o.weight !== undefined) ctx.draft.weight = o.weight;
      await oneriYukle();
      sheet(false); render();
      toast(`Hedef güncellendi: ${N.repsLabel(ex, ctx.settings)}`);
      break;
    }
    case 'goal-reset': {
      const ov = { ...ctx.settings.overrides }; delete ov[ex.id];
      ctx.settings = await S.saveSettings({ overrides: ov });
      ctx.draft = draftFor(ex);
      await oneriYukle();
      sheet(false); render();
      toast('Programın kendi hedefine dönüldü.');
      break;
    }
    case 'to-list': stopAnim(); ctx.view = 'list'; render(); scrollTo(0, 0); break;
    case 'carry-go': {
      const y = ctx.yarim;
      // Yeni seans, YARIM KALAN günün kendisi. Setler kopyalanmaz — kayıtlar
      // yapıldıkları güne ait kalır; carriedFrom yalnız "geçen sefer yapıldı"
      // işaretini yeniden kurabilmek için (yeniden açılışta da sürsün diye).
      const yeni = S.newSession(y.session.dayIndex);
      yeni.carriedFrom = y.session.id;
      // HEMEN diske: yoksa yenilemede seçim kaybolur ve soru bir daha
      // sorulmadığı için kullanıcı sessizce yanlış güne düşer (canlıda yakalandı).
      // ⚠️ SIRA ÖNEMLİ: önce yeni seans, SONRA "cevaplandı" işareti. Tersi
      // olunca yazma başarısızlığında soru cevaplanmış sayılıp kayboluyordu.
      await N.persist(yeni);
      await N.resolveCarry(y.session);
      ctx.session = yeni;
      ctx.dayIndex = y.session.dayIndex;
      ctx.oncekiYapilan = N.completedIds(y.session);
      ctx.yarim = null;
      await lastPerfYukle();
      render();
      toast(`${N.DAY_NAMES[ctx.dayIndex].split(' — ')[0]}'e devam ediliyor.`);
      break;
    }
    case 'carry-skip':
      await N.resolveCarry(ctx.yarim.session);
      ctx.yarim = null;
      render();
      break;

    case 'to-history': stopAnim(); await gecmisYukle(); ctx.view = 'history'; render(); scrollTo(0, 0); break;

    case 'weight-save': {
      const el = $('h-weight');
      const v = el.value === '' ? null : +el.value;
      if (v !== null && (!Number.isFinite(v) || v < 20 || v > 400)) {
        toast('Kilo 20–400 kg arasında olmalı.', { warn: true });
        break;
      }
      await S.saveWeight(v);
      await gecmisYukle();
      render();
      toast(v === null ? 'Bugünün kilo kaydı silindi.' : `${UI.fmt(v, 1, 1)} kg kaydedildi.`);
      break;
    }

    case 'gun-ac': ctx.gunSecici = !ctx.gunSecici; render(); break;

    case 'gun-yapildi': {
      const gun = ctx.dayIndex;
      const ad = N.DAY_NAMES[gun].split(' — ')[0];
      // Tarih BUGÜN değil ÖNCEKİ antrenman günü: telefonsuz yapılan antrenman
      // tipik olarak bugün değil, kaçırılan program günündeydi.
      const onceki = C.prevTrainingDay(new Date(), ctx.settings.trainingDays);
      const ne = onceki ?? C.addDays(new Date(), -1);
      await N.markDayDone(gun, ne.getTime());
      ctx.gunSecici = false;
      await yükle();
      toast(`${ad} yapıldı olarak işaretlendi (${C.fmtShort(ne)}). Sıra ${N.DAY_NAMES[ctx.dayIndex].split(' — ')[0]}.`);
      break;
    }

    case 'seans-sil': {
      const d = ctx.duzenlenen;
      const id = await N.softDeleteSession(d);
      ctx.duzenlenen = null;
      await gecmisYukle();
      await yükle();                       // sıra silinen seansa göre yeniden hesaplanır
      ctx.view = 'history'; render();
      // Geri-al DİSKTEN çalışır: uygulamayı kapatsan da seans duruyor, yalnız gizli.
      toast('Seans silindi.', {
        label: 'Geri getir', sticky: true,
        action: async () => {
          await N.restoreSession(id);
          await gecmisYukle(); await yükle();
          ctx.view = 'history'; render();
          toast('Seans geri getirildi.');
        },
      });
      break;
    }

    case 'to-settings': stopAnim(); ctx.view = 'settings'; render(); scrollTo(0, 0); break;
    case 'prev': git(ctx.idx - 1); break;
    case 'next': git(ctx.idx + 1); break;
    case 'save': await kaydetTıklandı(); break;

    case 'oneri-uygula': {
      // ÖNER, DAYATMA: yalnız kutuya yazar; seti kaydetmek kullanıcının kararı
      const o = ctx.oneri[ex.id];
      if (o?.tur === 'agirlik') { ctx.draft.weight = o.agirlik; render(); }
      break;
    }
    case 'rozet-hepsi': ctx.tumRozetler = true;  render(); break;
    case 'rozet-az':    ctx.tumRozetler = false; render(); break;

    case 'undo': {
      // Geri al da işlemsel: yazma başarısızsa set bellekte de KALIR (ekran
      // ile disk aynı şeyi söylesin).
      let geri;
      try { geri = await N.transact(ctx.session, s => N.undoLastSet(s, ex.id)); }
      catch (err) { console.error('[geri al]', err); toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); break; }
      if (!geri) break;
      ctx.draft = draftFor(ex); render();
      toast('Set geri alındı.', {
        label: 'Geri getir',
        action: async () => {
          try { await N.transact(ctx.session, s => { N.entryFor(s, ex.id).sets.push(geri); }); }
          catch (err) { console.error('[geri getir]', err); toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); return; }
          ctx.draft = draftFor(ex); render();
        },
      });
      break;
    }

    case 'clock-start':
      if (hold.running) { hold.stop(); saatDurumu(ex); }
      else { await hold.start(ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds); saatDurumu(ex); }
      break;
    case 'clock-plus': case 'clock-minus': {
      const d = a === 'clock-plus' ? 5 : -5;
      if (hold.running) hold.extend(d);
      else { ctx.draft.seconds = Math.max(5, (ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds) + d); saatDurumu(ex); }
      break;
    }

    case 'rest': await rest.start(ctx.settings.restSeconds); restSlot(); break;
    case 'rest-plus': rest.extend(30); break;
    case 'rest-skip': rest.stop(); restSlot(); break;

    case 'finish': await bitir(); break;
    case 'backup': await yedekAl(); break;
    case 'import': $('file').click(); break;
    case 'reset-day': sıfırla(); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'scrub') { stopAnim(); draw(curEx(), +t.value / 100); return; }
  
  if (t.id?.startsWith('f-')) ctx.draft[t.id.slice(2)] = t.value === '' ? null : +t.value;
});

/* Boy: her tuşta değil ALAN BIRAKILINCA yazılır. Yazarken kaydetmek "17" gibi
   yarım değerleri diske indirir ve sonraki açılışta saçma bir boy gösterirdi. */
document.addEventListener('change', async e => {
  // Geçmiş seansta bir set değeri düzeltildi
  const ed = e.target.closest?.('[data-eset]');
  if (ed && ctx.duzenlenen) {
    const [exId, i, alan] = ed.dataset.eset.split(':');
    const r = N.updateSet(ctx.duzenlenen, exId, +i, { [alan]: ed.value });
    if (!r.ok) { toast('Geçerli bir sayı gir.', { warn: true }); render(); return; }
    await N.saveEdited(ctx.duzenlenen);
    await gecmisYukle(); await yükle();
    ctx.view = 'seans'; render();
    return;
  }
  if (e.target.id !== 's-height') return;
  const v = e.target.value === '' ? null : Math.round(+e.target.value);
  if (v !== null && (!Number.isFinite(v) || v < 100 || v > 250)) {
    toast('Boy 100–250 cm arasında olmalı.', { warn: true });
    e.target.value = ctx.settings.heightCm ?? '';
    return;
  }
  ctx.settings = await S.saveSettings({ heightCm: v });
});

/** Gün çipi — kural schedule.toggleTrainingDay'de (orada test ediliyor) */
async function gunuCevir(gun) {
  const yeni = C.toggleTrainingDay(ctx.settings.trainingDays ?? [], gun);
  if (!yeni) {
    toast('En az bir antrenman günü seçili kalmalı.', { warn: true });
    return;
  }
  ctx.settings = await S.saveSettings({ trainingDays: yeni });
  ctx.status = C.todayStatus(ctx.settings.trainingDays);   // takvim satırı hemen tazelensin
  render();
}

function git(i) {
  const exs = N.exercisesFor(ctx.dayIndex);
  if (i < 0 || i >= exs.length) return;
  stopAnim(); hold.stop();
  ctx.idx = i; ctx.view = 'focus'; ctx.draft = draftFor(exs[i]);
  ctx.tumRozetler = false;        // her harekete katlanmış başla
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
    // Gün sayısı verilir ki programda olmayan güne ait seans içeri girip
    // ekranları çökertmesin (bkz. store.gecersizSeans).
    const s = await S.importData(await f.text(), 'merge', { gunSayisi: N.allDays().length });
    // Seans ve kilo AYRI sayılır: "28 yeni" 14 seans + 14 kilo demekti.
    const parca = [`${s.eklendi} yeni seans`, s.güncellendi && `${s.güncellendi} güncellendi`,
      s.kilo.eklendi && `${s.kilo.eklendi} kilo kaydı`,
      s.geçersiz && `${s.geçersiz} bozuk kayıt atlandı`].filter(Boolean).join(' · ');
    toast(`Geri yüklendi: ${parca}.`, s.geçersiz ? { warn: true, sticky: true, label: 'Tamam', action: () => {} } : {});
    await yükle();
  } catch (err) { toast(err.message, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); }
});

/* ── Açılış ────────────────────────────────────────────────────────────── */
/**
 * Geçmiş ekranının verisi — AÇILIRKEN yüklenir, açılışta değil.
 * Her uygulama açılışında tüm seansları taramak, ekranı hiç açmayan kullanıcıya
 * ödetilen bir maliyet olurdu.
 */
async function gecmisYukle() {
  ctx.kilolar = await S.weights();
  ctx.gecmis = await N.historyRows(12);
  const birimi = ex => ex.setType === 'time' ? 'sn' : ex.setType === 'cardio' ? 'dk' : ctx.settings.unit;
  ctx.ilerleme = [];
  for (const ex of await N.progressables()) {
    const seri = await N.exerciseSeries(ex.id);
    if (seri.length >= 2) ctx.ilerleme.push({ ex, seri, birim: birimi(ex) });
  }
}

/** "Geçen sefer" kutularını o günün hareketleri için tazeler */
async function lastPerfYukle() {
  ctx.lastPerf = {};
  for (const ex of N.exercisesFor(ctx.dayIndex))
    ctx.lastPerf[ex.id] = await S.lastPerformance(ex.id, ctx.session.id);
  await oneriYukle();
}

/**
 * Ağırlık artırma önerisi — o hareketin yapıldığı son İKİ bitmiş seanstan (bugünkü hariç).
 * Kural ilerleme.js'te (test ediliyor); burada yalnız veri toplanır. Hedef değişince yeniden hesaplanır.
 */
async function oneriYukle() {
  const bitmis = (await S.doneSessions()).filter(s => s.id !== ctx.session.id);
  ctx.oneri = {};
  for (const ex of N.exercisesFor(ctx.dayIndex)) ctx.oneri[ex.id] = I.oneri(ex, bitmis, N.effective(ex, ctx.settings));
}

async function yükle() {
  ctx.onerilen = await N.nextDayIndex();      // program ne diyor (öneri)
  const r = await N.startOrResume();
  ctx.session = r.session; ctx.dayIndex = r.session.dayIndex;
  ctx.gunSecici = false;
  ctx.status = C.todayStatus(ctx.settings.trainingDays);
  await lastPerfYukle();

  // Yarım kalan gün YALNIZ yeni seansta sorulur. Yarıda kalmış bir seansa
  // devam ediliyorsa günü değiştirmek girilmiş setleri yanlış güne bağlardı.
  ctx.yarim = r.resumed ? null : await N.carryOffer();

  // Devredilen bir seansa geri dönüldüyse "geçen sefer yapıldı" işareti
  // yeniden kurulur — yoksa uygulamayı kapatıp açınca kaybolurdu.
  ctx.oncekiYapilan = null;
  if (ctx.session.carriedFrom) {
    const önce = await S.getSession(ctx.session.carriedFrom);
    if (önce) ctx.oncekiYapilan = N.completedIds(önce);
  }

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

/**
 * ── GÜNCELLEME ────────────────────────────────────────────────────────────
 *
 * ⚠️ ÖNCEKİ SÜRÜMDEKİ DEFEKT: yalnız 'updatefound' olayı dinleniyordu. Ama
 * yeni sürüm BİR ÖNCEKİ ziyarette indirilip beklemeye alınmışsa o olay bir
 * daha ATEŞLENMEZ — kayıt doğrudan `waiting` durumunda açılır, şerit hiç
 * görünmez ve kullanıcı eski sürümde SONSUZA KADAR takılı kalır.
 * Gerçekte yaşandı: "sitede hâlâ eski versiyon var, yenile düğmesi çıkmıyor."
 * Bu yüzden reg.waiting ayrıca kontrol ediliyor — hem açılışta hem her dönüşte.
 *
 * ⚠️ İKİNCİ KARAR: güncellemeyi kullanıcının bulmasına bırakmak kırılgan.
 * Kaybedilecek bir şey yoksa sorulmadan uygulanır; seans sürerken sorulur.
 *
 * ⚠️ ÜÇÜNCÜ KARAR (24 Eyl): "kaybedilecek şey" yalnız set DEĞİL. Isınma
 * ekranındayken, ağırlık yazmışken ya da ilk Plank sayacı çalışırken dönünce
 * sayfa yeniden yükleniyor ve kullanıcı listeye atılıyordu. Karar artık
 * session.guncellemeKarari'nda (test ediliyor); 'bekle' durumunda sürüm
 * liste ekranına dönülünce uygulanır — render() her çizimde yeniden dener.
 */
function guncellemeyiDene() {
  const sw = bekleyenSW;
  if (!sw) return;
  const karar = N.guncellemeKarari({
    ekran: ctx.view,
    seansSetli: !!ctx.session && N.hasAnySet(ctx.session),
    sayacCalisiyor: rest.running || hold.running,
  });
  if (karar === 'uygula') { bekleyenSW = null; sw.postMessage('SKIP_WAITING'); return; }
  if (karar === 'sor' && sorulanSW !== sw) {
    sorulanSW = sw;                                   // her çizimde yeniden sorma
    toast('Yeni sürüm hazır — seansı bitirince kendiliğinden uygulanacak.', {
      sticky: true, label: 'Şimdi yenile', action: () => sw.postMessage('SKIP_WAITING'),
    });
  }
  // 'bekle' → sessizce bekle
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  let yenilendi = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!yenilendi) { yenilendi = true; location.reload(); }
  });

  const kontrolEt = reg => {
    if (!reg.waiting) return;
    bekleyenSW = reg.waiting;
    guncellemeyiDene();
  };

  addEventListener('load', async () => {
    const reg = await navigator.serviceWorker.register('sw.js').catch(() => null);
    if (!reg) return;
    kontrolEt(reg);                                    // ← zaten bekleyen sürüm
    reg.addEventListener('updatefound', () => {
      const yeni = reg.installing;
      yeni?.addEventListener('statechange', () => {
        if (yeni.state === 'installed' && navigator.serviceWorker.controller) kontrolEt(reg);
      });
    });
    // Uygulamaya her dönüşte yeni sürüm var mı diye bak
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      reg.update().then(() => kontrolEt(reg)).catch(() => {});
    });
  });
}

addEventListener('error', e => toast('Bir aksaklık oldu: ' + (e.message || 'bilinmeyen'), { warn: true }));
/* ⚠️ Olay işleyicilerinin neredeyse hepsi async: içlerinden fırlayan hata
   'error' DEĞİL 'unhandledrejection' olur ve eskiden HİÇ dinlenmiyordu —
   yani yukarıdaki satır bu uygulamanın hatalarının çoğunu hiç görmüyordu
   (24 Eyl, tarayıcıda ölçüldü: yazma hatasında toast null). */
addEventListener('unhandledrejection', e => {
  console.error('[yakalanmamış]', e.reason);
  toast('Bir aksaklık oldu: ' + (e.reason?.message || e.reason || 'bilinmeyen'), { warn: true, sticky: true, label: 'Kapat', action: () => {} });
});
