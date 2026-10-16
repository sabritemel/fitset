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
import * as RK from './rekorlar.js';
import * as P from './program.js';
import { Countdown, mmss, primeAudio } from './timer.js';
import { AD } from './marka.js';
import * as AV from './avatar.js';
import { AVATAR_DURUS } from './anim3d/hareketler3d.js';
import { hazirBul, oner, antrenmanGunleri } from './data/hazir.js';
import { kurulumTuru } from './kurulum.js';
import * as H from './hazirlik.js';

const $ = id => document.getElementById(id);
const listEl = $('list-screen'), focusEl = $('focus-screen');

/* ── Durum ─────────────────────────────────────────────────────────────── */
const ctx = {
  session: null, dayIndex: 0, idx: 0,
  lastPerf: {}, settings: S.DEFAULT_SETTINGS, status: null,
  oneri: {},                 // ağırlık artırma önerisi (iki seans kuralı) — hareket başına
  draft: {},                 // o an ekranda duran, henüz kaydedilmemiş değerler
  yarim: null,               // yarım kalan gün önerisi (cevap verilene kadar)
  oncekiYapilan: null,       // devredilen günde geçen sefer yapılmış hareketler
  kilolar: [], gecmis: [], ilerleme: [],   // geçmiş ekranı — açılırken doldurulur
  gunSecici: false,          // gün seçici paneli açık mı
  duzenlenen: null,          // geçmiş ekranından açılan seans
  ozet: null,                // az önce biten seansın özeti (seans sonu ekranı)
  onerilen: 0,               // programın önerdiği gün (kullanıcı ezebilir)
  kurulum: { istem: false, kurulu: false },   // telefona yükleme (Ayarlar) — bkz. KURULUM
  duzen: null,               // program düzenleyici: { id, gun } (Faz 1A)
  secici: null,              // hareket seçici: { ara, grup, eq }
  ozelForm: null,            // özel hareket formu: { ad, setType, equipment, grup, kaynak? }
  kutuphane: { ara: '', grup: '', eq: '' },   // Hareketler sekmesi süzgeçleri (14 Eki)
  hareketId: null,           // Hareketler › ayrıntısı açık hareket
  hareketGecmisi: null,      // o hareketin geçmiş özeti (ilerleme.hareketGecmisi)
  hareketEkle: null,         // Programa ekle: { programId }
  ia: null,                  // İLK AÇILIŞ (Faz 1C): { adim, c: cevaplar, secili, profil } — yalnız taze kurulumda
  hazirId: null,             // Programlar › hazır program önizlemesi
  programDegisti: false,     // aktif program düzenlendi → Bugün'e dönüşte "geçen sefer" tazelenir
  view: 'list',
};
let bootDay = C.dayNumber(new Date());
/* Bekleyen yeni sürüm (bkz. GÜNCELLEME). render() onu okuduğu için burada,
   ilk çizimden ÖNCE tanımlı olmalı. */
let bekleyenSW = null, sorulanSW = null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const curEx = () => N.exercisesFor(ctx.dayIndex)[ctx.idx];

/* ── KURULUM (telefona yükleme) ────────────────────────────────────────────
   Chrome siteyi gerçek bir Android uygulaması olarak kurabiliyor (WebAPK: çekmecede simge,
   adres çubuğu yok, internetsiz, siteden kendiliğinden güncellenir; veri aynı kalır).
   Chrome'un kendi alt bandı bastırılır, istem saklanır ve YALNIZ Ayarlar'daki düğme açar
   (Sabri, 27 Eyl: "ayarlarda yeterli"). İstem tek kullanımlık; reddedilirse Chrome yenisini
   verene kadar Ayarlar menü yolunu anlatır. */
let kurulumIstemi = null;
ctx.kurulum.kurulu = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
/** 14 Eki: tarif tarayıcıya göre (js/kurulum.js) — Ayarlar kartı ve Bugün bandı aynı türden okur */
const kurulumTaniGuncelle = () => { ctx.kurulum.tur = kurulumTuru(navigator.userAgent, { kurulu: ctx.kurulum.kurulu, istem: ctx.kurulum.istem,
  brave: !!navigator.brave, dokunmatik: navigator.maxTouchPoints > 1 }); };
kurulumTaniGuncelle();
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  kurulumIstemi = e; ctx.kurulum.istem = true; kurulumTaniGuncelle();
  if (ctx.view === 'settings' || (ctx.view === 'list' && ctx.session)) render();   // açılışta veri gelmeden çizme (14 Eki: Bugün çöküyordu)
});
addEventListener('appinstalled', () => {
  kurulumIstemi = null; ctx.kurulum.istem = false; ctx.kurulum.kurulu = true; kurulumTaniGuncelle();
  S.requestPersistence().catch(() => {});      // kurulu uygulamaya kalıcılık çoğunlukla verilir — yeniden iste
  toast('FitSet telefona yüklendi. Ana ekrandaki simgesinden aç.');
  if (ctx.view === 'settings') render();
});

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
 * Dinlenme — alt bantta, ayrı şerit AÇMADAN. Bant yüksekliği sabit; sayaç çalışırken yan
 * gezinme (Önceki/Sonraki) bant dışına çekilir ve bant tümüyle sayaca döner: +30 · kalan · Geç.
 * Böylece dinlenme ortasında yanlış dokunuş hareketi değiştiremez.
 */
const rest = new Countdown({
  onTick: (k, toplam) => {
    const e = $('rest-time'); if (e) e.textContent = mmss(k);
    const b = $('rest-bar'); if (b) b.style.transform = `scaleX(${toplam ? k / toplam : 0})`;
  },
  onDone: gecikme => {
    restSlot();
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
    toast(gecikme > 2
      ? `Dinlenme ${Math.round(gecikme)} sn önce bitti.`   // dürüst: kaçırdıysa söyler
      : 'Dinlenme bitti. Sıradaki set.');
  },
});

/** Alt bandı mevcut duruma göre tazeler (boşta gezinme / çalışırken sayaç) */
function restSlot() {
  const bant = $('gezinme');
  if (!bant) return;
  bant.outerHTML = UI.gezinmeHTML(ctx, rest.running ? rest.remaining : null, rest.total);
}

/** Değer değişince sütunların alt yazıları: tekrarın hedef sapması, barın plaka hesabı, uzun ağırlık */
function onizlemeTazele() {
  if (ctx.view !== 'focus') return;
  const ex = curEx();
  const pl = $('plaka-yazi'); if (pl) pl.textContent = UI.plakaYazi(ex, ctx.draft.weight, ctx.settings.unit);
  const kg = $('f-weight'); if (kg) kg.classList.toggle('uzun', kg.value.length >= 5);
}

/**
 * Isınma seçimi ekranda GÖRÜNMELİ: anahtar "?" panelinde, panel kapanınca gizli bir durum
 * kalırdı. Set yazısı ("Isınma seti") ve kaydet düğmesi onu söyler.
 */
function isinmaTazele() {
  if (ctx.view !== 'focus') return;
  const ex = curEx(), q = N.exerciseProgress(ctx.session, ex, ctx.settings);
  const et = $('set-etiket'), kb = $('kaydet-btn'), w = $('warm');
  if (et) et.innerHTML = UI.setEtiketi(q, ctx);
  if (kb) kb.textContent = UI.kaydetEtiketi(ex, q, ctx);
  if (w) { w.setAttribute('aria-checked', String(!!ctx.draft.warmup)); w.textContent = ctx.draft.warmup ? 'Açık' : 'Kapalı'; }
}

/**
 * ADIM DÜĞMESİ (▲ ▼) — basılı tutunca hızlanır (350 ms sonra 90 ms'de bir): 60'tan 100'e tek tek
 * basmak yorar. Parmak/fare ile basışta adım POINTERDOWN'da atılır; klavyeyle (Enter/Boşluk) gelen
 * tıklama ayrıca işlenir — tıklamada ikinci kez atılmasın diye fareden gelen tıklama yok sayılır.
 */
function adimAt(st) {
  const [field, d] = st.dataset.step.split(':');
  const inp = $('f-' + field);
  if (!inp) return;
  const alt = field === 'reps' ? 1 : 0;
  inp.value = Math.max(alt, Math.round(((+inp.value || 0) + +d) * 100) / 100);
  ctx.draft[field] = +inp.value;
  onizlemeTazele();
  navigator.vibrate?.(5);
}
let adimTekrar = null;
const adimBirak = () => { clearTimeout(adimTekrar?.ilk); clearInterval(adimTekrar?.z); adimTekrar = null; };
document.addEventListener('pointerdown', e => {
  const st = e.target.closest?.('[data-step]');
  if (!st || st.disabled) return;
  adimBirak();
  adimAt(st);
  adimTekrar = { ilk: setTimeout(() => { adimTekrar.z = setInterval(() => adimAt(st), 90); }, 350) };
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(o => document.addEventListener(o, adimBirak));

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
  onizlemeTazele();
}

/** Set süresi — izometrik hareketler (Plank) */
const hold = new Countdown({
  onTick: k => { const e = $('clock-time'); if (e) e.textContent = mmss(k); },
  onDone: async () => {
    const ex0 = curEx(); saatDurumu(ex0);
    const ex = ex0;
    const oldu = await kaydet(ex, { type: 'time', seconds: ctx.draft.seconds ?? N.effective(ex, ctx.settings).seconds, warmup: !!ctx.draft.warmup });
    if (oldu) toast('Süre doldu, set kaydedildi.');   // başarısızsa hata şeridi yerinde kalsın
  },
});


/* ── Kayan paneller ────────────────────────────────────────────────────────
   "?" paneli (#sheet — ısınma seti, hedef, öneri, anlatım). Eski "Bu set" paneli 11 Eki'de kalktı
   (tekrar ana ekranda). Kapatma her zaman AÇIK olanı kapatır. */
const açıkPanel = () => document.querySelector('.sheet.on');
function sheet(aç, id = 'sheet') {
  const bg = document.querySelector('.sheet-bg');
  const s = aç ? $(id) : açıkPanel();
  if (!s || !bg) return;
  // ⚠️ Kapalıyken `inert`: ekran dışında dursa da 11 kontrolü odak sırasına giriyordu
  s.inert = !aç;
  if (aç) {
    bg.hidden = false;
    requestAnimationFrame(() => { bg.classList.add('on'); s.classList.add('on'); seritOrtala(s); geriNobetcisi(); });
    s.setAttribute('aria-hidden', 'false');
  } else {
    s.classList.remove('on'); bg.classList.remove('on');
    s.setAttribute('aria-hidden', 'true');
    s.style.transform = '';
    setTimeout(() => { if (!açıkPanel()) bg.hidden = true; }, 300);
    geriNobetcisi();
  }
}
const sheetAçık = () => !!açıkPanel();

/** Tekrar şeridini seçili değere kaydır (12 seçiliyse şerit 1'de başlamasın). Görünür olduktan sonra çağrılır. */
function seritOrtala(kok = document) {
  kok.querySelectorAll('.serit-t').forEach(sr => {
    const b = sr.querySelector('[aria-checked="true"]');
    if (b && sr.clientWidth) sr.scrollLeft = b.offsetLeft - sr.offsetLeft - sr.clientWidth / 2 + b.offsetWidth / 2;
  });
}

/** Aşağı sürükleyerek kapatma — parmakla en doğal kapanış */
let sy = 0, sürükle = null;
document.addEventListener('touchstart', e => {
  const s = açıkPanel();
  if (!s) return;
  // Panel içeriği yukarı kaydırılmışsa sürükleme değil kaydırma istiyordur
  if (e.target.closest('.sheet-in') && s.querySelector('.sheet-in').scrollTop > 0) return;
  if (!e.target.closest('.sheet')) return;
  sy = e.touches[0].clientY; sürükle = s; s.style.transition = 'none';
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!sürükle) return;
  const d = e.touches[0].clientY - sy;
  if (d > 0) sürükle.style.transform = `translateY(${d}px)`;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (!sürükle) return;
  const s = sürükle;
  sürükle = null;
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
    const ms = now - isinmaAnim.t0;
    const w = adımlar[isinmaAnim.hangi % adımlar.length];
    // Bir tekrar; A3.animT başlangıç noktasından başlar ve TAM orada biter (duran kareyle aynı → sıçrama yok)
    isinmaÇiz(w, A3.animT(A3.hareketBul(w), ms, DONGU, 1));
    if (ms >= DONGU) { isinmaAnim.hangi++; isinmaAnim.t0 = now; }
    isinmaAnim.raf = requestAnimationFrame(adım);
  };
  isinmaAnim.raf = requestAnimationFrame(adım);
}
/** Isınma satırındaki minik 3B figür — küçük alanda figür boşlukta kaybolmasın diye SIKI kadraj */
function isinmaÇiz(w, t) {
  A3.ciz(document.querySelector(`[data-anim="${w.id}"]`), A3.hareketBul(w), t, { bicim: 'sabit' });
}
/** Duran figürler BAŞLANGIÇ noktasında (eskiden hareketin ortası, t=0,55: oynayınca 0'a sıçrıyordu) */
function isinmaDurağan() { N.warmupFor(ctx.dayIndex).forEach(w => isinmaÇiz(w, A3.DURAGAN_T)); }
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
  profil:   { el: () => $('profile-screen'),  html: () => UI.profilHTML(ctx) },
  history:  { el: () => $('history-screen'),  html: () => UI.historyHTML(ctx) },
  seans:    { el: () => $('session-screen'),  html: () => UI.sessionEditHTML(ctx) },
  ozet:     { el: () => $('summary-screen'),  html: () => UI.summaryHTML(ctx) },
  programs: { el: () => $('programs-screen'), html: () => UI.programsHTML(ctx) },
  program:  { el: () => $('program-screen'),  html: () => UI.programHTML(ctx) },
  secici:   { el: () => $('picker-screen'),   html: () => UI.seciciHTML(ctx) },
  ozel:     { el: () => $('custom-screen'),   html: () => UI.ozelHTML(ctx) },
  kutuphane: { el: () => $('library-screen'), html: () => UI.kutuphaneHTML(ctx) },
  hareket:  { el: () => $('exercise-screen'), html: () => UI.hareketHTML(ctx) },
  hareketEkle: { el: () => $('add-screen'),   html: () => UI.hareketEkleHTML(ctx) },
  ilkAcilis: { el: () => $('welcome-screen'), html: () => UI.ilkAcilisHTML(ctx) },
  hazir:    { el: () => $('preset-screen'),   html: () => UI.hazirHTML(ctx) },
};
/* ── AVATAR (13 Eki, js/avatar.js) ────────────────────────────────────────────────────────────────────────
   Ayarlar satırında küçük resim (kafa–omuz), Profil ve avatar ekranında döndürülebilir önizleme. Görünüm her
   değişiklikte çiziciye verilir (A3.avatarAyarla): renk anında, gövde değişince yeni gövde arkada kurulup yer değiştirir. */
const AVATARLI = new Set(['settings', 'profil']);
let avatarTeta = 30;
const avatarGorunumu = () => AV.cozumle(ctx.settings?.avatar, ctx.settings?.profil);
function avatarUygula() { A3.avatarAyarla(avatarGorunumu(), yenidenÇiz); }
/** Önizleme seçenekleri: Saç sekmesinde görünüm BAŞA yaklaşır (çerçevenin üst %34'ü, önizlemenin en-boy oranında) */
function onizlemeSecenek(on) {
  const kamera = [avatarTeta, 8];
  if (ctx.avatarSekme !== 'sac') return { kamera, bicim: 'donen', kas: false };
  const c = A3.cerceveOf(AVATAR_DURUS, kamera, 'donen'), yuk = (c.ust - c.alt) * 0.34, mx = (c.sol + c.sag) / 2;
  const en = yuk * (on.clientWidth / Math.max(1, on.clientHeight));
  return { kamera, cerceve: { sol: mx - en / 2, sag: mx + en / 2, ust: c.ust, alt: c.ust - yuk }, kas: false };
}
function avatarCiz() {
  const on = document.getElementById('avatar3d');
  if (on) A3.ciz(on, AVATAR_DURUS, 0, onizlemeSecenek(on));
  const k = document.querySelector('[data-avatar-k]');
  if (k) {   // küçük resim: önden, kafa–omuz kesiti (çerçevenin üst %30'u, kare)
    const c = A3.cerceveOf(AVATAR_DURUS, [90, 4], 'donen'), yuk = (c.ust - c.alt) * 0.3, mx = (c.sol + c.sag) / 2;
    A3.ciz(k, AVATAR_DURUS, 0, { kamera: [90, 4], cerceve: { sol: mx - yuk / 2, sag: mx + yuk / 2, ust: c.ust, alt: c.ust - yuk }, kas: false });
  }
}
/* Profil ve avatar: ekran açık kaldıkça avatar kendi ekseninde çok yavaş döner (14 Eki, Sabri). Sürüklemek dönüşü
   devralır; bırakınca dönüş kalınan açıdan sürer. Ekrandan çıkınca ya da sekme gizliyken durur; "hareketi azalt"
   tercihinde hiç dönmez. Pil için en çok saniyede 30 çizim. */
const AVATAR_DONUS = 18;                               // derece / sn — bir tur 20 sn (Sabri: 6 → 12 → "20 saniyede")
const avatarDonus = { raf: 0, son: 0, cizim: 0 };
function avatarDonusBaslat() {
  if (avatarDonus.raf || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  avatarDonus.son = avatarDonus.cizim = performance.now();
  const adim = simdi => {
    const on = document.getElementById('avatar3d');
    if (ctx.view !== 'profil' || !on) { avatarDonus.raf = 0; return; }
    const dt = Math.min(0.1, (simdi - avatarDonus.son) / 1000);
    avatarDonus.son = simdi;
    if (!avatarSurukle) {
      avatarTeta += AVATAR_DONUS * dt;
      if (simdi - avatarDonus.cizim >= 32) { avatarDonus.cizim = simdi; A3.ciz(on, AVATAR_DURUS, 0, onizlemeSecenek(on)); }
    }
    avatarDonus.raf = requestAnimationFrame(adim);
  };
  avatarDonus.raf = requestAnimationFrame(adim);
}
async function avatarKaydet(yama) {
  ctx.settings = await S.saveSettings({ avatar: { ...(ctx.settings.avatar ?? {}), ...yama } });
  avatarUygula(); render();
}
/** Profil değişti: avatar ELLE seçilmediyse önerilen gövde değişebilir → bilgi + "Geri al" */
async function profilKaydet(yama) {
  const once = avatarGorunumu().govde;
  ctx.settings = await S.saveSettings({ profil: { ...(ctx.settings.profil ?? {}), ...yama } });
  const sonra = avatarGorunumu().govde;
  if (!ctx.settings.avatar?.govdeElle && sonra !== once) ctx.avatarOneri = { eski: once, yeni: sonra, yas: 'yas' in yama };
  avatarUygula(); render();
}

/** Küçük 3B görselli ekranlar (program düzenleyici, hareket seçici) */
const KUCUKLU = new Set(['program', 'secici', 'kutuphane']);

/** 3B çizici (three.js) arka planda hazırlanır; hazır olunca ekrandaki 3B görseller yeniden çizilir */
function ucBoyutHazirla() {
  A3.webglHazirla(yenidenÇiz, {
    basit: !!ctx.settings?.basitGorunum,
    // 'yavas': C manken bu cihazda yavaş kaldı → basit görünüm; karar cihazda saklanır, Ayarlar'da görünür ve geri alınabilir.
    // 'acilamadi' (10 Eki): C bu cihazda açılamadı (gölgelendirici derlenmedi) → kapsül zaten çiziyor. Karar SAKLANMAZ
    // (bir güncelleme sorunu giderebilir; her açılışta yeniden denenir) ve ekran yeniden çizilmez (açılışta, listede
    // olur — kullanıcının işini bölmesin); yalnız Ayarlar notu için bellekte tutulur.
    yedegeGecti: async neden => {
      if (neden === 'acilamadi') { ctx.cAcilamadi = true; return; }
      ctx.settings = await S.saveSettings({ basitGorunum: true, basitOto: true }); render();
    },
  });
}

/**
 * ONAY PENCERESİ (dil 4, 13 Eki — Sabri: "hiçbir silme ve geri dönülemez değişiklik onaysız yapılmasın").
 * Alttan açılır; ne silineceğini VE neyin kalacağını söyler. Odak "Vazgeç"te (yanlışlıkla Enter silmez),
 * Esc ve boşluğa dokunuş vazgeçer. Metinler textContent ile yazılır (adlar kullanıcı metnidir).
 * Silmeden sonraki "Geri getir" bildirimi ayrıca sürer — onay ikinci bir güvenlik değil, ilk adımdır.
 */
function onayla({ baslik, govde, kalir = '', eylem }) {
  return new Promise(coz => {
    const onceki = document.activeElement;
    const perde = document.createElement('div');
    perde.className = 'onay-perde';
    const kutu = document.createElement('div');
    kutu.className = 'onay-kutu';
    kutu.setAttribute('role', 'alertdialog');
    kutu.setAttribute('aria-modal', 'true');
    const h = Object.assign(document.createElement('h2'), { id: 'onay-baslik', textContent: baslik });
    const g = Object.assign(document.createElement('p'), { id: 'onay-govde', textContent: govde });
    kutu.setAttribute('aria-labelledby', 'onay-baslik');
    kutu.setAttribute('aria-describedby', 'onay-govde');
    kutu.append(h, g);
    if (kalir) kutu.append(Object.assign(document.createElement('p'), { className: 'kalir', textContent: kalir }));
    const cift = Object.assign(document.createElement('div'), { className: 'cift' });
    const vazgec = Object.assign(document.createElement('button'), { className: 'btn p', textContent: 'Vazgeç' });
    const yik = Object.assign(document.createElement('button'), { className: 'btn s yik', textContent: eylem });
    cift.append(vazgec, yik);
    kutu.append(cift);
    perde.append(kutu);
    const kapat = v => { document.removeEventListener('keydown', tus, true); perde.remove(); onceki?.focus?.({ preventScroll: true }); coz(v); geriNobetcisi(); };
    const tus = e => { if (e.key === 'Escape') { e.preventDefault(); kapat(false); } };
    vazgec.addEventListener('click', e => { e.stopPropagation(); kapat(false); });
    yik.addEventListener('click', e => { e.stopPropagation(); kapat(true); });
    perde.addEventListener('click', e => { e.stopPropagation(); if (e.target === perde) kapat(false); });
    document.addEventListener('keydown', tus, true);
    document.body.append(perde);
    geriNobetcisi();                     // geri tuşu önce bu pencereyi kapatır (Vazgeç)
    vazgec.focus({ preventScroll: true });
  });
}

/**
 * BASIŞ GERİ BİLDİRİMİ (dil 4, 13 Eki — Sabri): ▲/▼'ye basınca o sütunun çerçevesi, basılan ok ve sayı mercan;
 * parmak kalkınca 0,2 sn sonra hepsi nötr. Sayıya dokunup yazarken de aynı. Hiçbir sütun "seçili" kalmaz.
 * SET düğmesi ekranı yeniden çizdirir → durum sütunun SIRASIYLA tutulur, render() yeni çizime de uygular.
 */
const BASIS_SURESI = 200;
let basis = null, basisZaman = 0;
function basisBoya() {
  if (ctx.view !== 'focus') return;
  focusEl.querySelectorAll('.sutun.basili, .ok.basili').forEach(x => x.classList.remove('basili'));
  const s = basis && focusEl.querySelectorAll('.sutun')[basis.sutun];
  if (!s) return;
  s.classList.add('basili');
  if (basis.ok >= 0) s.querySelectorAll('.ok')[basis.ok]?.classList.add('basili');
}
function basisBirak() {
  clearTimeout(basisZaman);
  basisZaman = setTimeout(() => { basis = null; basisBoya(); }, BASIS_SURESI);
}
const sutunSirasi = el => [...focusEl.querySelectorAll('.sutun')].indexOf(el.closest('.sutun'));
document.addEventListener('pointerdown', e => {
  const ok = e.target.closest?.('#focus-screen .sutun .ok');
  if (!ok || ok.disabled) return;
  clearTimeout(basisZaman);
  basis = { sutun: sutunSirasi(ok), ok: [...ok.closest('.sutun').querySelectorAll('.ok')].indexOf(ok) };
  basisBoya();
}, true);
['pointerup', 'pointercancel'].forEach(o => document.addEventListener(o, e => {
  if (!basis) return;
  basisBirak();
  // Düğme odakta kalmasın (odak çerçevesi "seçili" gibi duruyordu); klavyeyle gelen tıklamada dokunma
  const ok = e.target.closest?.('#focus-screen .sutun .ok');
  if (ok) setTimeout(() => ok.blur(), 0);
}, true));
document.addEventListener('focusin', e => {
  const n = e.target.closest?.('#focus-screen .sutun .n');
  if (n) { clearTimeout(basisZaman); basis = { sutun: sutunSirasi(n), ok: -1 }; basisBoya(); }
});
document.addEventListener('focusout', e => { if (e.target.closest?.('#focus-screen .sutun .n')) basisBirak(); });

function render() {
  if (ctx.view !== 'warmup') isinmaDur();
  const ad = EKRAN[ctx.view] ? ctx.view : 'list';
  for (const [k, v] of Object.entries(EKRAN)) v.el().classList.toggle('on', k === ad);
  EKRAN[ad].el().innerHTML = EKRAN[ad].html();

  if (ad === 'warmup' || ad === 'focus' || ad === 'hareket' || KUCUKLU.has(ad) || AVATARLI.has(ad)) ucBoyutHazirla();
  if (ad !== 'hareket') ayrintiDur();
  else ayrintiKur();
  if (AVATARLI.has(ad)) avatarCiz();
  if (ad === 'profil') avatarDonusBaslat();
  if (KUCUKLU.has(ad)) kucukleriCiz(EKRAN[ad].el());
  if (ad === 'program') seritOrtala(EKRAN[ad].el());
  if (ad === 'warmup') {
    isinmaOynat();
  } else if (ad === 'focus') {
    const ex = curEx();
    if (ex.hold) varyantlarıÇiz(ex);
    else animasyonuKur(ex);
    saatDurumu(ex);
    // Bant her çizimde tazelenmeli: yeniden çizim boştaki gezinmeyi basıyor,
    // ama sayaç hâlâ çalışıyor olabilir.
    restSlot();
    basisBoya();                 // SET'e basılırken ekran yeniden çizildiyse basış görünümü yeni sütunda sürsün
  }
  guncellemeyiDene();          // bekleyen sürüm varsa ve artık güvenliyse uygula
  geriNobetcisi();             // telefonun geri tuşu: ana ekran dışında geçmişte nöbetçi kayıt
}

/* ── TELEFONUN GERİ TUŞU (13 Eki, Sabri: "geri tuşu uygulamayı arka plana atıyor") ──────────────────────────
   Android standardı (Material · "Back navigation"): geri tuşu uygulamanın İÇİNDE bir önceki yere döner ve sol üstteki
   okla AYNI davranır; önce açık pencereyi/paneli kapatır; ana sekme dışındaki sekmeden (İlerleme, Programlar, Ayarlar)
   ana sekmeye (Bugün) döner; YALNIZ ana ekranda uygulamadan çıkar. Uygulama tek sayfa olduğu için tarayıcı geçmişinde
   adım yoktu → ilk basışta çıkıyordu.
   Yöntem: ana ekranda değilken (ya da bir katman açıkken) geçmişte TEK bir nöbetçi kayıt tutulur. Geri basılınca
   tarayıcı onu siler (popstate) → aşağıdaki karar uygulanır; hâlâ gerekirse nöbetçi yeniden konur. Karar TEK kaynaktan:
   sol üstteki ok düğmesi (.ust .ib) programla basılır — ok ile tuş ayrışamaz. Seans sonundaki "Geri al" bir ok değildir
   (seansı geri açar) → orada geri tuşu ana ekrana döner. */
let geriKaydi = false, geriYoksay = false;
const onayAcik = () => document.querySelector('.onay-perde');
function geriNobetcisi() {
  const gerek = (ctx.view !== 'list' && !(ctx.view === 'ilkAcilis' && ctx.ia?.adim === 0)) || sheetAçık() || !!onayAcik() || ctx.gunSecici;
  if (gerek && !geriKaydi) { history.pushState({ fitsetGeri: 1 }, ''); geriKaydi = true; }
  else if (!gerek && geriKaydi) { geriKaydi = false; geriYoksay = true; history.back(); }   // ana ekrana başka yoldan dönüldü
}
function geriTusu() {
  const onay = onayAcik();
  if (onay) { [...onay.querySelectorAll('button')].find(b => b.textContent === 'Vazgeç')?.click(); return; }
  if (sheetAçık()) { sheet(false); return; }
  if (ctx.gunSecici) { ctx.gunSecici = false; render(); return; }
  if (ctx.view === 'ilkAcilis') { if (ctx.ia?.adim > 0) { ctx.ia.adim--; render(); } return; }
  const ok = EKRAN[ctx.view]?.el().querySelector('.ust .ib[data-act]');
  if (ok) { ok.click(); return; }
  if (ctx.view !== 'list') { stopAnim(); ctx.view = 'list'; render(); scrollTo(0, 0); }
}
addEventListener('popstate', () => {
  if (geriYoksay) { geriYoksay = false; return; }
  geriKaydi = false;
  geriTusu();
  // ok düğmesinin işi zaman uyumsuz olabilir (kayıt, yükleme): nöbetçi bir sonraki görev turunda yeniden kurulur
  setTimeout(geriNobetcisi, 0);
});

/* ── Animasyon — 3B (anim3d/sahne.js: WebGL, yoksa SVG) ──────────────────── */
let raf = 0;
let sonT = 0;                                          // son çizilen an — döndürürken aynı kare yeniden çizilir
/** Kullanıcının döndürdüğü açı, hareket başına (oturum içi; kalıcı değil — her açılış ilk açıyla) */
const kamera3d = {};
/** Odak ekranında görüntü %15 büyük (8 Eki, Sabri: "ortadaki görüntüyü birazcık büyütelim") */
const ODAK_YAKINLIK = 1.15;
/* Zemin figür (ağırlık × tekrar, 11 Eki): kutu kontrollerin arkasına uzadığı için figür zaten büyür;
   yakınlık 1 — mokapta 1,12 "büyük olmuş" dendi, 1,0 onaylandı. */
const ZEMIN_YAKINLIK = 1;
/* Hareketler ayrıntısı (14 Eki, Sabri: "bazı açılardan ve hareketin bazı yerlerinde başın bir kısmı üstten kesiliyor"):
   odak yakınlığından %5 küçük ve birkaç piksel aşağıda. */
const AYRINTI_YAKINLIK = ODAK_YAKINLIK * 0.95;
const AYRINTI_ASAGI = 6;
const yakinlikOf = ex => ex.setType === 'weight_reps' ? ZEMIN_YAKINLIK : ODAK_YAKINLIK;
const kameraOf = (ex, h) => kamera3d[ex.id] ?? h.kamera;
/* SÜREKLİ DÖNÜŞ (17 Eki, Sabri: "set ekranındaki animasyonları da kendi merkezinde 20 saniyede bir tur atacak şekilde döndür"):
   Hareketler ayrıntısı ve avatar ekranıyla aynı kural — sabit hızla kendi ekseninde, yükseklik hareketin bakış yüksekliği;
   sürüklemek devralır, bırakınca bırakılan açıdan sürer; "hareketi azalt" tercihinde dönmez; en çok 30 çizim/sn
   (animasyon sürerken her kare). 12 tekrarlık oynatma dönüşten AYRI tutulur (oynatma.aktif): döngü hep çalışır. */
const DONUS_HIZI = 360 / 20;                            // derece / sn — bir tur 20 sn
const odak = { te: 0 };
const odakDonuyor = () => !reduced && !döndür;
function draw(ex, t) {
  sonT = t;
  const h = A3.hareketBul(ex);
  if (!h) return;
  const k = kameraOf(ex, h);
  A3.ciz($('fig3d'), h, t, { kamera: odakDonuyor() ? [odak.te, k[1]] : k, yakinlik: yakinlikOf(ex) });
}
/**
 * OYNATMA — Sabri (27 Eyl · 14 Eki): 12 tekrar yapıp durur; dururken figüre dokununca ya da döndürünce
 * 12 tekrar daha. Hareket başlangıç noktasından başlar ve TAM orada biter (A3.animT); duran
 * görüntü de başlangıç noktasıdır, harekete geçince hiçbir yere sıçramaz.
 * Oynatma ekrandan BAĞIMSIZ tutulur: set kaydı ekranı yeniden kurar, ama süren oynatma kaldığı
 * yerden devam eder (eskiden baştan başlıyordu — ortadaki figür 0'a sıçrıyordu).
 */
const oynatma = { exId: null, t0: 0, aktif: false };
const oynuyor = () => oynatma.aktif;

/** Harekete ilk girişte kendiliğinden oynar; aynı harekette yeniden çizimde sürer ya da başlangıçta durur */
function animasyonuKur(ex) {
  const h = A3.hareketBul(ex);
  if (!h) return;                                        // özel hareket: çizim yok, yer tutucu duruyor
  const gecen = performance.now() - oynatma.t0;
  if (oynatma.exId === ex.id && oynatma.aktif && gecen < A3.animSure()) { draw(ex, A3.animT(h, gecen)); dongu(ex); return; }
  if (oynatma.exId !== ex.id) {
    oynatma.exId = ex.id; odak.te = kameraOf(ex, h)[0];   // dönüş hareketin bakış açısından başlar
    draw(ex, A3.DURAGAN_T);
    if (!reduced) oynat(ex);                             // hareket azaltma tercihinde kendiliğinden OYNAMAZ
    return;
  }
  draw(ex, A3.DURAGAN_T);
  if (!reduced) dongu(ex);                               // aynı hareket, oynatma bitmiş: yalnız dönüş sürer
}
/** 12 tekrar oynat (dokunuş ve döndürme de bunu çağırır; hareket azaltmada da — kullanıcı istedi) */
function oynat(ex) {
  oynatma.exId = ex.id;
  oynatma.t0 = performance.now();
  oynatma.aktif = true;
  dongu(ex);
}
/** Tek döngü: 12 tekrarlık oynatma (süre dolunca TAM başlangıç noktası) + sürekli dönüş (set ekranı açık kaldıkça) */
function dongu(ex) {
  stopAnim();
  const h = A3.hareketBul(ex);
  if (!h) return;
  let son = performance.now(), cizim = 0;
  const adım = now => {
    if (ctx.view !== 'focus' || curEx()?.id !== ex.id) { raf = 0; return; }
    const dt = Math.min(0.1, (now - son) / 1000); son = now;
    if (odakDonuyor()) odak.te += DONUS_HIZI * dt;
    let t = sonT;
    const anim = oynatma.aktif;
    if (anim) { const ms = now - oynatma.t0; t = A3.animT(h, ms); if (ms >= A3.animSure()) oynatma.aktif = false; }
    if (anim || now - cizim >= 32) { cizim = now; draw(ex, t); }
    raf = oynatma.aktif || !reduced ? requestAnimationFrame(adım) : 0;
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
  // yanlış duruşlarda kas vurgusu yok (8 Eki, Sabri): vurgu "doğru çalışan kas" demek; gri tonu CSS verir (.variants)
  document.querySelectorAll('[data-varyant]').forEach(el => A3.ciz(el, hs[+el.dataset.varyant], 0,
    { kamera: kam, cerceve: c, perspektif: 'sigdir', kas: ex.variants?.[+el.dataset.varyant]?.ok !== false }));   // ortak çerçeve kırpma değil: minder dahil sığsın
}

/* ── HAREKET AYRINTISI (Hareketler sekmesi, 14 Eki) — odak ekranının oynatma kuralı: 12 tekrar oynar ve durur;
   dokununca yeniden oynar, sürükleyince döner (açı hareket başına odak ekranıyla ORTAK: kamera3d). Kendi döngüsü:
   odak ekranının döngüsü curEx()'e bağlı.
   SÜREKLİ DÖNÜŞ (17 Eki, Sabri, 2. tur: "kamera turunu kaldır; platform kendi merkezinde 15 saniyede bir tur atacak şekilde
   sürekli dönsün"; 3. tur: 20 saniyede bir tur): avatar ekranındaki gibi sabit hızla (18°/sn) kendi ekseninde döner, yükseklik hareketin bakış yüksekliği.
   Sürüklemek dönüşü devralır; bırakınca dönüş bırakılan açıdan sürer; çift dokunuş ilk açıya döner. "Hareketi azalt"
   tercihinde dönmez. En çok saniyede 30 çizim (animasyon sürerken her kare). (İlk tur 0.13.3: anahtar açılarda yavaşlayan,
   çaprazlarda yukarıdan bakan kamera turu — Sabri istemedi.) */
const ayrinti = { raf: 0, t0: 0, id: null, sonT: 0, surukle: null, sonDokunus: 0, animT0: null, son: 0, cizim: 0, te: 0 };
const AYRINTI_DONUS = DONUS_HIZI;                        // bir tur 20 sn (17 Eki, Sabri: 15 → 20; set ekranı ve avatar ekranıyla aynı)
const donuyor = () => !reduced && !ayrinti.surukle;
function ayrintiCiz(t) {
  const ex = N.byId[ctx.hareketId], h = A3.hareketBul(ex), el = $('hareket3d');
  if (!h || !el) return;
  ayrinti.sonT = t;
  const k = kameraOf(ex, h);
  A3.ciz(el, h, t, { kamera: donuyor() ? [ayrinti.te, k[1]] : k, yakinlik: AYRINTI_YAKINLIK, asagi: AYRINTI_ASAGI });
}
function ayrintiDur() { if (ayrinti.raf) cancelAnimationFrame(ayrinti.raf); ayrinti.raf = 0; ayrinti.animT0 = null; }
/** Tek döngü: tekrar animasyonu (12 tekrar, sonra durur) + sürekli dönüş (ekran açık kaldıkça) */
function ayrintiDongu(simdi) {
  const h = A3.hareketBul(N.byId[ctx.hareketId]);
  if (ctx.view !== 'hareket' || !h || !$('hareket3d')) { ayrinti.raf = 0; ayrinti.animT0 = null; return; }
  const dt = Math.min(0.1, (simdi - ayrinti.son) / 1000); ayrinti.son = simdi;
  if (donuyor()) ayrinti.te += AYRINTI_DONUS * dt;
  let t = ayrinti.sonT, anim = ayrinti.animT0 != null;
  if (anim) { const ms = simdi - ayrinti.animT0; t = A3.animT(h, ms); if (ms >= A3.animSure()) ayrinti.animT0 = null; }
  if (anim || simdi - ayrinti.cizim >= 32) { ayrinti.cizim = simdi; ayrintiCiz(t); }
  ayrinti.raf = ayrinti.animT0 != null || !reduced ? requestAnimationFrame(ayrintiDongu) : 0;
}
function ayrintiDonguBaslat() { if (!ayrinti.raf) { ayrinti.son = performance.now(); ayrinti.raf = requestAnimationFrame(ayrintiDongu); } }
function ayrintiOynat() { ayrinti.animT0 = performance.now(); ayrintiDonguBaslat(); }
const animSuruyor = () => ayrinti.animT0 != null;
/** Ayrıntı ekranı çizildi: aynı harekette süren oynatma devam eder; yeni harekette başlangıçtan bir kez oynar */
function ayrintiKur() {
  const ex = N.byId[ctx.hareketId], h = A3.hareketBul(ex);
  if (!h) return;
  if (ayrinti.id === ctx.hareketId && ayrinti.raf) return;
  if (ayrinti.id !== ctx.hareketId) ayrinti.te = kameraOf(ex, h)[0];   // dönüş hareketin bakış açısından başlar
  ayrintiCiz(A3.DURAGAN_T);
  if (ayrinti.id !== ctx.hareketId) { ayrinti.id = ctx.hareketId; if (!reduced) ayrintiOynat(); }
  else if (!reduced) ayrintiDonguBaslat();
}
document.addEventListener('pointerdown', e => {
  const el = e.target.closest?.('#hareket3d');
  if (!el || ctx.view !== 'hareket') return;
  const ex = N.byId[ctx.hareketId], h = A3.hareketBul(ex);
  if (!h) return;
  // sürükleme dönüşün O ANKİ açısından başlar (dönüş kapalıysa hareketin kayıtlı açısından)
  const [te0, fi] = kameraOf(ex, h), te = reduced ? te0 : ayrinti.te;
  // 17 Eki (Sabri: "bir süre döndükten sonra yeniden dokununca görüntü daha önce bıraktığım açıya sıçrıyor"): dokunuş anında
  // dönüş durur ve çizim kayıtlı açıyı (kamera3d — ÖNCEKİ sürüklemenin bıraktığı) kullanıyordu → kayıt dokunuş anında şimdiki açı
  if (!reduced) kamera3d[ex.id] = [te, fi];
  ayrinti.surukle = { x: e.clientX, y: e.clientY, te, fi, id: ex.id, oynadi: false };
  try { el.setPointerCapture(e.pointerId); } catch { /* belge düzeyinde dinleniyor */ }
});
document.addEventListener('pointermove', e => {
  const d = ayrinti.surukle; if (!d) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (!d.oynadi && Math.hypot(dx, dy) < 4) return;
  d.oynadi = true;
  kamera3d[d.id] = [d.te - dx * 0.6, Math.max(-5, Math.min(75, d.fi + dy * 0.4))];
  if (!animSuruyor()) ayrintiCiz(ayrinti.sonT);
});
const ayrintiBirak = () => {
  const d = ayrinti.surukle; if (!d) return;
  const h = A3.hareketBul(N.byId[d.id]);
  if (!d.oynadi) {                                     // dokunuş: tek → yeniden oynat · çift → ilk açı
    const simdi = performance.now();
    if (simdi - ayrinti.sonDokunus < 320) { delete kamera3d[d.id]; if (h) ayrinti.te = h.kamera[0]; if (!animSuruyor()) ayrintiCiz(ayrinti.sonT); ayrinti.sonDokunus = 0; }
    else { ayrinti.sonDokunus = simdi; ayrintiOynat(); }
  } else ayrinti.te = kamera3d[d.id][0];               // sürükleme bitti: dönüş bırakılan açıdan sürer
  ayrinti.surukle = null;
};
document.addEventListener('pointerup', ayrintiBirak);
document.addEventListener('pointercancel', ayrintiBirak);

/* ── İLK AÇILIŞ (Faz 1C, 14 Eki) — karşılama → 4 soru → profil (isteğe bağlı) → öneri. Yalnız taze kurulumda. ── */
function iaProfiliTopla() {
  const p = ctx.ia.profil, ad = $('ia-ad')?.value.trim().slice(0, 24), yas = parseInt(($('ia-yas')?.value ?? '').replace(/\D/g, ''), 10);
  if (ad != null) p.ad = ad;
  p.yas = Number.isFinite(yas) && yas >= 10 && yas <= 110 ? yas : null;
}
async function iaBitir(program, { duzenle = false } = {}) {
  const p = ctx.ia.profil;
  // Antrenman günleri cevaptan ve BUGÜNÜ içerecek biçimde (yeni kullanıcı ilk gün "program günü değil" görmesin)
  ctx.settings = await S.saveSettings({ trainingDays: antrenmanGunleri(ctx.ia.c.gun ?? 3, new Date().getDay()) });
  if (p.ad || p.yas) ctx.settings = await S.saveSettings({ profil: { ...(ctx.settings.profil ?? {}), ...(p.ad ? { ad: p.ad } : {}), ...(p.yas ? { yas: p.yas } : {}) } });
  if (p.govde) { ctx.settings = await S.saveSettings({ avatar: { ...(ctx.settings.avatar ?? {}), govde: p.govde, govdeElle: true } }); }
  if (p.ad || p.yas || p.govde) avatarUygula();
  await N.ilkAcilisiBitir(program);
  ctx.settings = await S.getSettings();
  ctx.ia = null;
  await yükle();                                      // Bugün: seçilen programın 1. günü
  if (duzenle) { ctx.duzen = { id: program.id, gun: 0, kopya: structuredClone(program) }; ctx.view = 'program'; render(); scrollTo(0, 0); }
}
async function iaTiklamasi(t) {
  if (ctx.view !== 'ilkAcilis' || !ctx.ia) return false;
  const d = ctx.ia;
  const c = t.closest('[data-ia-cevap]');
  if (c) {
    const [a, v] = c.dataset.iaCevap.split(':');
    d.c[a] = Number.isNaN(+v) ? v : +v; d.secili = null; render();
    setTimeout(() => { if (ctx.ia === d && d.adim <= 4) { d.adim++; render(); scrollTo(0, 0); } }, 220);   // seçim görünsün, sonra geç
    return true;
  }
  const g = t.closest('[data-ia-govde]');
  if (g) { iaProfiliTopla(); d.profil.govde = g.dataset.iaGovde; render(); return true; }
  const s = t.closest('[data-ia-sec]');
  if (s) { d.secili = s.dataset.iaSec; render(); scrollTo(0, 0); return true; }
  const e = t.closest('[data-ia]')?.dataset.ia;
  if (!e) return false;
  if (e === 'ileri') { if (d.adim === 5) iaProfiliTopla(); d.adim++; render(); scrollTo(0, 0); }
  else if (e === 'atla') { d.profil = {}; d.adim++; render(); scrollTo(0, 0); }
  else if (e === 'geri') { d.adim = Math.max(0, d.adim - 1); render(); }
  else if (e === 'basla') {
    const h = hazirBul(d.secili ?? oner(d.c));
    await iaBitir(P.hazirdanKur(h));
    toast(`${h.ad} hazır. Isınmayla başla.`);
  } else if (e === 'kendim') {
    await iaBitir(P.yeniProgram('Programım'), { duzenle: true });
    toast('Boş program kuruldu. Hareket ekleyerek başla.');
  }
  return true;
}

/** Hareketler sekmesi: liste/ayrıntı/programa ekle tıklamaları — işlendiyse true */
async function hareketAc(id) {
  const ex = N.byId[id];
  if (!ex) return;
  ctx.hareketId = id;
  const bitmis = await S.doneSessions();
  ctx.hareketGecmisi = I.hareketGecmisi(bitmis, ex);
  ctx.hareketRekor = RK.rekorlar(bitmis, id);
  ctx.view = 'hareket'; render(); scrollTo(0, 0);
}
async function kutuphaneTiklamasi(t) {
  const hb = t.closest('[data-hareket]');
  // İlerleme'deki rekor satırı da ayrıntıyı açar; geri tuşu oraya döner (ctx.hareketDonus)
  if (hb && (ctx.view === 'kutuphane' || ctx.view === 'history')) { ctx.hareketDonus = ctx.view; await hareketAc(hb.dataset.hareket); return true; }
  for (const [ozellik, alan] of [['kgrup', 'grup'], ['keq', 'eq']]) {
    const b = t.closest(`[data-${ozellik}]`);
    if (b && ctx.view === 'kutuphane') { ctx.kutuphane[alan] = b.dataset[ozellik]; render(); return true; }
  }
  const pb = t.closest('[data-he-prg]');
  if (pb && ctx.view === 'hareketEkle') { ctx.hareketEkle = { programId: pb.dataset.hePrg }; render(); return true; }
  const gb = t.closest('[data-he-gun]');
  if (gb && ctx.view === 'hareketEkle') {
    const ex = N.byId[ctx.hareketId], prg = N.programGetir(ctx.hareketEkle?.programId) ?? N.aktifProgram(), gi = +gb.dataset.heGun;
    if (!ex || !prg) return true;
    const r = P.kalemEkle(prg, gi, ex);
    if (!r.ok) { toast('Bir günde en çok 30 hareket olabilir.', { warn: true }); return true; }
    await programiKaydet(prg);
    const i = prg.gunler[gi].hareketler.length - 1, gunAd = N.gunEtiketi(gi, prg).kisa;
    ctx.hareketEkle = null; ctx.view = 'hareket'; render();
    toast(`${ex.ad} · ${prg.ad} · ${gunAd} eklendi.`, { label: 'Geri al',
      action: async () => { P.kalemSil(prg, gi, i); await programiKaydet(prg); if (ctx.view === 'hareket') render(); } });
    return true;
  }
  return false;
}

/** Ekrandaki 3B görselleri yeniden çiz: WebGL hazır olduğunda, GPU bağlamı geri geldiğinde, boyut değişince */
function yenidenÇiz() {
  if (ctx.view === 'focus') { const ex = curEx(); if (ex.hold) varyantlarıÇiz(ex); else if (!raf) draw(ex, sonT); }
  else if (ctx.view === 'warmup') isinmaDurağan();
  else if (KUCUKLU.has(ctx.view)) kucukleriCiz(EKRAN[ctx.view].el());
  else if (AVATARLI.has(ctx.view)) avatarCiz();
  else if (ctx.view === 'hareket' && !ayrinti.raf) ayrintiCiz(ayrinti.sonT);
}

/**
 * KÜÇÜK GÖRSELLER — hareketin duran 3B karesi (data-kucuk). Hepsi aynı karede çizilirse uzun listede
 * ekran takılır: karede birkaç tane. Yeni çizim gelince eski kuyruk bırakılır (liste süzüldüyse).
 */
let kucukKuyruk = 0;
function kucukleriCiz(kok) {
  const els = [...kok.querySelectorAll('[data-kucuk]')];
  const no = ++kucukKuyruk;
  const adim = () => {
    if (no !== kucukKuyruk) return;
    for (const el of els.splice(0, 4)) {
      const h = A3.hareketBul(N.byId[el.dataset.kucuk]);
      if (h) A3.ciz(el, h, 0.5, { bicim: 'sabit' });
    }
    if (els.length) requestAnimationFrame(adim);
  };
  requestAnimationFrame(adim);
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
  const [te0, fi] = kameraOf(ex, h), te = reduced ? te0 : odak.te;
  if (!reduced) kamera3d[ex.id] = [te, fi];              // dokunuş anında şimdiki açı (yoksa önceki sürüklemenin açısına sıçrardı)
  döndür = { x: e.clientX, y: e.clientY, te, fi, id: ex.id, oynadı: false };
  try { el.setPointerCapture(e.pointerId); } catch { /* yakalama olmadan da belge düzeyinde dinleniyor */ }
});
document.addEventListener('pointermove', e => {
  if (!döndür) return;
  const dx = e.clientX - döndür.x, dy = e.clientY - döndür.y;
  if (!döndür.oynadı && Math.hypot(dx, dy) < 4) return;
  döndür.oynadı = true;
  kamera3d[döndür.id] = [döndür.te - dx * 0.6, Math.max(-5, Math.min(75, döndür.fi + dy * 0.4))];
  // Duruyorken döndürmek 12 tekrar daha oynatır; oynuyorsa sonraki kare zaten yeni açıyla çizer
  if (!oynuyor()) oynat(curEx());
});
const bırak = () => {
  if (!döndür) return;
  if (!döndür.oynadı) {                                // dokunuş (sürükleme değil)
    const şimdi = performance.now();
    // Çift dokunuş → ilk açı; tek dokunuş duran figürü 12 tekrar daha oynatır
    if (şimdi - sonDokunuş < 320) { delete kamera3d[döndür.id]; const h = A3.hareketBul(curEx()); if (h) odak.te = h.kamera[0]; if (!raf) draw(curEx(), sonT); sonDokunuş = 0; }
    else { sonDokunuş = şimdi; if (!oynuyor()) oynat(curEx()); }
  } else odak.te = kamera3d[döndür.id][0];               // sürükleme bitti: dönüş bırakılan açıdan sürer
  döndür = null;
};
document.addEventListener('pointerup', bırak);
document.addEventListener('pointercancel', bırak);

/* Avatar önizlemesini sürükleyerek döndür (Profil ve avatar). Seçim boyası CSS'te kapalı (user-select). */
let avatarSurukle = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest?.('#avatar3d');
  if (!el || ctx.view !== 'profil') return;
  e.preventDefault();
  avatarSurukle = { x: e.clientX, te: avatarTeta };
  try { el.setPointerCapture(e.pointerId); } catch { /* belge düzeyinde dinleniyor */ }
});
document.addEventListener('pointermove', e => {
  if (!avatarSurukle) return;
  avatarTeta = avatarSurukle.te - (e.clientX - avatarSurukle.x) * 0.8;
  const on = document.getElementById('avatar3d');
  if (on) A3.ciz(on, AVATAR_DURUS, 0, onizlemeSecenek(on));
});
const avatarBirak = () => { avatarSurukle = null; };
document.addEventListener('pointerup', avatarBirak);
document.addEventListener('pointercancel', avatarBirak);

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
const KAYIT_HATASI = 'Kaydedilemedi: telefonun depolaması yazmayı reddetti. Tekrar dene; sürerse yedek al.';

let rozetZamani = 0, rirZamani = 0;
async function kaydet(ex, veri) {
  // Rekor mu? (K4) — önceki seanslar + bugün bu setten önce girilenler; önceki değer yoksa (ilk kayıt) rekor değil
  const once = [...(ctx.rekorTaban?.[ex.id] ?? []), ...N.exerciseProgress(ctx.session, ex, ctx.settings).sets];
  const rk = veri.warmup || !ctx.rekorTaban ? null : RK.setRekoru(veri, once);
  try {
    await N.transact(ctx.session, s => N.recordSet(s, ex.id, veri));
  } catch (err) {
    console.error('[kayıt]', err);
    toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} });
    return false;
  }
  ctx.draft = draftFor(ex);
  if (rk) {
    ctx.rozet = { exId: ex.id, ...rk, bitis: Date.now() + 4000 };
    clearTimeout(rozetZamani);
    rozetZamani = setTimeout(() => { ctx.rozet = null; document.querySelector('.rekor-rozet')?.remove(); }, 4000);
  }
  // G1: ağırlıklı çalışma setinden sonra RIR sorusu (hedef RIR'lı harekette ya da Ayarlar'da açıksa); 15 sn sonra kalkar
  if (ex.setType === 'weight_reps' && !veri.warmup && (N.effective(ex, ctx.settings).rir != null || ctx.settings.rirSor)) {
    ctx.rirSor = { exId: ex.id, bitis: Date.now() + 15000 };
    clearTimeout(rirZamani);
    rirZamani = setTimeout(() => { ctx.rirSor = null; document.querySelector('.rir-sor')?.remove(); }, 15000);
  } else ctx.rirSor = null;
  render();
  if (navigator.vibrate) navigator.vibrate(rk ? [20, 80, 40] : 15);
  // Dinlenme kendiliğinden başlar — seansta ~27 kez elle başlatmak angarya. G1: süre hareketin kaleminden (yoksa genel)
  if (ctx.settings.restSeconds > 0) { await rest.start(N.dinlenmeSuresi(ex, ctx.settings)); restSlot(); }
  return true;
}

async function kaydetTıklandı() {
  const ex = curEx();
  // Tek gerçek taslak: çip panelde, DOM özniteliği değil ctx.draft okunur (süre hareketi de onu okur)
  const ısınma = !!ctx.draft.warmup;
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
  // K5 (0.7.0): vücut ağırlığı hareketinde alan EK ağırlıktır — boş bırakılırsa 0 (yalnız vücut) sayılır
  const kg = $('f-weight')?.value.trim() || (ex.equipment === 'bodyweight' ? '0' : ''), tek = +($('f-reps')?.value || 0);
  if (kg === '' || kg == null) return toast('Ağırlığı gir.', { warn: true });
  if (!tek) return toast('Tekrar sayısını gir.', { warn: true });
  return kaydet(ex, { type: 'weight_reps', weight: +kg, reps: tek, warmup: ısınma });
}

/* ── Olaylar ───────────────────────────────────────────────────────────── */
document.addEventListener('click', async e => {
  primeAudio();                                  // ses bağlamı ilk dokunuşta açılır
  const t = e.target;

  // Profil ve avatar: sekme ve kıyafet parçası (14 Eki, tek ekran) — yalnız görünüm, kayıt yok
  const avs = t.closest('[data-avatar-sekme], [data-kiyafet-parca]');
  if (avs && ctx.view === 'profil') {
    if (avs.dataset.avatarSekme) ctx.avatarSekme = avs.dataset.avatarSekme; else ctx.kiyafetParca = avs.dataset.kiyafetParca;
    render(); return;
  }
  // Profil ve avatar seçimleri (13 Eki)
  const avb = t.closest('[data-avatar-govde], [data-avatar-ten], [data-avatar-sac], [data-avatar-sacvar], [data-avatar-ust], [data-avatar-alt], [data-profil-cins]');
  if (avb && ctx.view === 'profil') {
    const d = avb.dataset;
    if (d.avatarGovde) { ctx.avatarOneri = null; await avatarKaydet({ govde: d.avatarGovde, govdeElle: true }); }
    else if (d.avatarTen) await avatarKaydet({ ten: d.avatarTen });
    else if (d.avatarSac) await avatarKaydet({ sacRenk: d.avatarSac, sacElle: true });
    else if (d.avatarSacvar) await avatarKaydet({ sacVar: d.avatarSacvar === '1' });
    else if (d.avatarUst) await avatarKaydet({ ust: d.avatarUst });
    else if (d.avatarAlt) await avatarKaydet({ alt: d.avatarAlt });
    else if (d.profilCins) await profilKaydet({ cinsiyet: d.profilCins });
    return;
  }

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
    const exAd = (N.byId[exId] ?? N.bilinmeyenHareket(exId)).ad;
    if (!(await onayla({ baslik: 'Bu set silinsin mi?', govde: `${exAd}: ${+i + 1}. set kalıcı olarak silinir.`,
      kalir: 'Hacim ve grafikler yeniden hesaplanır.', eylem: 'Seti sil' }))) return;
    const r = N.deleteSet(ctx.duzenlenen, exId, +i);
    if (!r.ok) return;
    const sonuc = await N.saveEdited(ctx.duzenlenen);
    await gecmisYukle(); await yükle();
    if (sonuc.silindi) {
      // Son set de gitti → seans boşaldı. Kullanıcı kararı (6 Eyl): seansı sil.
      const id = ctx.duzenlenen.id;
      ctx.duzenlenen = null; ctx.view = 'history'; render();
      toast('Son set silindi; seans da silindi.', {
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
      if (!r.ok) { toast('Bugün set girdin. Önce seansı bitir ya da bugünü sıfırla.', { warn: true }); return; }
      ctx.dayIndex = hedef; ctx.idx = 0; ctx.oncekiYapilan = null;
      await lastPerfYukle();
      toast(`${N.gunEtiketi(hedef).kisa} seçildi.`);
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
  // G1: RIR sorusunun cevabı — son çalışma setine yazılır; × soruyu kapatır
  const rirBtn = t.closest('[data-rir]');
  if (rirBtn && ctx.view === 'focus') {
    const ex = curEx(), v = rirBtn.dataset.rir;
    clearTimeout(rirZamani); ctx.rirSor = null;
    if (v !== 'x') {
      try { await N.transact(ctx.session, s => N.setRir(s, ex.id, +v)); }
      catch (err) { console.error('[rir]', err); toast(KAYIT_HATASI, { warn: true }); }
      navigator.vibrate?.(5);
    }
    document.querySelector('.rir-sor')?.remove();
    return;
  }
  // G4 (17 Eki) TOPARLANMA KONTROLÜ: cevaplar ctx'te birikir; karar ("Tamam" / "hafiflet") seansa ve güne yazılır
  const hzBtn = t.closest('[data-hz]');
  if (hzBtn) { const [k, v] = hzBtn.dataset.hz.split(':'); ctx.hazirlik ??= { cevap: {} }; ctx.hazirlik.cevap[k] = v; render(); return; }
  const hzSorBtn = t.closest('[data-hzsor]');
  if (hzSorBtn) { ctx.settings = await S.saveSettings({ hazirlikSor: hzSorBtn.dataset.hzsor === 'acik' }); render(); return; }
  const rirSorBtn = t.closest('[data-rirsor]');
  if (rirSorBtn) { ctx.settings = await S.saveSettings({ rirSor: rirSorBtn.dataset.rirsor === 'acik' }); render(); return; }
  const gorunumBtn = t.closest('[data-gorunum]');
  if (gorunumBtn) { ctx.settings = await S.saveSettings({ basitGorunum: gorunumBtn.dataset.gorunum === 'basit', basitOto: false }); render(); return; }
  const dambilBtn = t.closest('[data-dambil]');
  if (dambilBtn) {
    // Adım hem +/−'yi hem önerinin yuvarlamasını değiştirir (ilerleme.agirlikAdimi tek kaynak)
    ctx.settings = await S.saveSettings({ dambilAdimi: +dambilBtn.dataset.dambil });
    await oneriYukle(); render(); return;
  }

  const go = t.closest('[data-go]');
  if (go) { git(+go.dataset.go); return; }

  const st = t.closest('[data-step]');
  if (st) { if (e.detail === 0) adimAt(st); return; }

  // Hedef paneli: set noktaları · tekrar şeridi · hazır şema · süre — gizli girdilere yazar, panel açık kalır
  if (hedefSecimi(t)) return;

  // Paneldeki hedef adımlayıcıları — taslağa değil, hedef alanlarına yazar
  const gs = t.closest('[data-gstep]');
  if (gs) {
    const [field, d] = gs.dataset.gstep.split(':');
    const inp = $('g-' + field);
    inp.value = Math.max(0, Math.round(((+inp.value || 0) + +d) * 100) / 100);
    return;
  }

  if (await iaTiklamasi(t)) return;
  if (await kutuphaneTiklamasi(t)) return;
  const hz = t.closest('[data-hazir]');
  if (hz && ctx.view === 'programs') { ctx.hazirId = hz.dataset.hazir; ctx.view = 'hazir'; render(); scrollTo(0, 0); return; }
  if (await duzenleyiciTiklamasi(t)) return;

  const a = t.closest('[data-act]')?.dataset.act;
  if (!a) return;
  const ex = ctx.view === 'focus' ? curEx() : null;

  switch (a) {
    case 'warm': ctx.draft.warmup = !ctx.draft.warmup; isinmaTazele(); break;
    case 'hz-gec': ctx.hazirlik = null; ctx.settings = await S.saveSettings({ hazirlikGunu: { d: S.dayKey() } }); render(); break;
    case 'hz-tamam': case 'hz-hafif': {
      const c = ctx.hazirlik?.cevap ?? {}, o = H.degerlendir(c);
      if (!o) break;
      try {
        const azalan = await N.transact(ctx.session, s => { N.hazirlikYaz(s, c, o.duzey); return a === 'hz-hafif' ? N.hafiflet(s, ctx.dayIndex, ctx.settings) : null; });
        if (azalan) toast(azalan.length ? `Bugün ${azalan.length} harekette birer set az.` : 'Azaltılacak set yok.');
      } catch (err) { console.error('[hazirlik]', err); toast(KAYIT_HATASI, { warn: true }); }
      ctx.hazirlik = null; ctx.settings = await S.saveSettings({ hazirlikGunu: { d: S.dayKey() } }); render(); break;
    }
    case 'hz-geri':
      try { await N.transact(ctx.session, s => N.hafifGeriAl(s, ctx.settings)); }
      catch (err) { console.error('[hazirlik]', err); toast(KAYIT_HATASI, { warn: true }); }
      render(); break;
    case 'set-arti': case 'set-eksi': {
      // Bugünkü set sayısı — program değişmez (seans setHedefi); şimdiki setin altına inmez
      const ex0 = curEx();
      try { await N.transact(ctx.session, s => N.setHedefiDegis(s, ex0, ctx.settings, a === 'set-arti' ? 1 : -1)); }
      catch (err) { console.error('[set sayısı]', err); toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); break; }
      navigator.vibrate?.(5);
      render();
      break;
    }
    case 'kur': {
      if (!kurulumIstemi) break;
      const istem = kurulumIstemi;
      kurulumIstemi = null; ctx.kurulum.istem = false; kurulumTaniGuncelle();   // istem tek kullanımlık
      await istem.prompt();
      await istem.userChoice.catch(() => null);
      render();                                                  // kabul → appinstalled bildirir; ret → menü yolu yazılır
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
    case 'sheet-close': sheet(false); if (ctx.yontemDegisti) { ctx.yontemDegisti = false; await oneriYukle(); render(); } break;

    case 'goal-save': {
      // Faz 1A: hedef ayarlara (overrides) değil PROGRAMIN KALEMİNE yazılır — düzenleyici ile aynı yer.
      // Boş bırakılan alan değişmez; boş ağırlık "planlanan ağırlık yok" demektir.
      const al = f => { const el = $('g-' + f); if (!el) return undefined; const v = el.value.trim(); return v === '' ? undefined : +v; };
      const o = {};
      for (const f of ['sets', 'reps', 'seconds', 'minutes', 'weight']) {
        const v = al(f);
        if (v !== undefined && !Number.isNaN(v)) o[f] = v;
      }
      const prg = N.aktifProgram(), k = prg.gunler[ctx.dayIndex]?.hareketler[ctx.idx];
      if (!k || k.exId !== ex.id) { toast('Hedef kaydedilemedi: hareket programda bulunamadı.', { warn: true }); break; }
      const sinirla = (alan, v) => Math.min(P.SINIR[alan].ec, Math.max(P.SINIR[alan].en, Math.round(v)));
      if (o.sets !== undefined) { k.sets = sinirla('sets', o.sets); delete k.setsMin; }
      for (const f of ['reps', 'seconds', 'minutes']) if (o[f] !== undefined && k[f] != null) k[f] = sinirla(f, o[f]);
      if (k.repsMin != null && !(k.reps > k.repsMin)) delete k.repsMin;   // G1: aralık tersine dönmesin
      if (o.weight !== undefined && o.weight > 0) k.agirlik = o.weight; else if ($('g-weight')?.value.trim() === '') delete k.agirlik;
      await N.programYaz(prg);
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
    case 'to-list':
      stopAnim();
      if (ctx.programDegisti) { ctx.programDegisti = false; ctx.idx = 0; await lastPerfYukle(); }
      ctx.view = 'list'; render(); scrollTo(0, 0); break;
    case 'to-programs': ctx.duzen = null; ctx.view = 'programs'; render(); scrollTo(0, 0); break;
    case 'hazir-ekle': {
      const h = hazirBul(ctx.hazirId); if (!h) break;
      const p = P.hazirdanKur(h);
      await N.programYaz(p);
      ctx.duzen = { id: p.id, gun: 0, kopya: structuredClone(p) }; ctx.view = 'program'; render(); scrollTo(0, 0);
      toast(`${h.ad} programlarına eklendi. Kullanmak için "Bu programı kullan".`);
      break;
    }
    case 'to-hareketler':
      stopAnim(); ctx.hareketEkle = null;
      if (ctx.view === 'hareket' && ctx.hareketDonus === 'history') { ctx.hareketDonus = null; await gecmisYukle(); ctx.view = 'history'; }
      else ctx.view = 'kutuphane';
      render(); scrollTo(0, 0); break;
    case 'hareket-ekle-ac': ctx.hareketEkle = { programId: N.aktifProgram().id }; ctx.view = 'hareketEkle'; render(); scrollTo(0, 0); break;
    case 'hareket-ekle-kapat': ctx.hareketEkle = null; ctx.view = 'hareket'; render(); break;
    case 'ozel-ac-kutuphane':
      ctx.ozelForm = { ad: ctx.kutuphane.ara.trim(), setType: 'weight_reps', equipment: 'machine', grup: ctx.kutuphane.grup || 'Göğüs', kaynak: 'kutuphane' };
      ctx.view = 'ozel'; render(); scrollTo(0, 0); break;
    case 'program-yeni': {
      const yeni = P.yeniProgram('Yeni program');
      await N.programYaz(yeni);
      ctx.duzen = { id: yeni.id, gun: 0, kopya: structuredClone(yeni) }; ctx.view = 'program'; render(); scrollTo(0, 0);
      break;
    }
    case 'program-aktif': {
      const r = await N.aktifYap(ctx.duzen.id, ctx.session);
      if (!r.ok) { toast(r.neden === 'set' ? 'Bugün set girdin. Önce seansı bitir, sonra programı değiştir.' : 'Program bulunamadı.', { warn: true }); break; }
      await yükle();
      ctx.view = 'program'; render();
      toast(`Artık ${N.aktifProgram().ad} kullanılıyor.`);
      break;
    }
    case 'program-sil': {
      const id = ctx.duzen.id, ad = N.programGetir(id)?.ad;
      if (!(await onayla({ baslik: `"${ad}" silinsin mi?`, govde: `Program ve ${N.programGetir(id)?.gunler.length ?? 0} günü listeden kalkar.`,
        kalir: 'Geçmiş seansların ve hareketlerin geçmişi silinmez.', eylem: 'Programı sil' }))) break;
      if (!(await N.programSil(id)).ok) break;
      ctx.duzen = null; ctx.view = 'programs'; render();
      toast(`${ad} silindi.`, { label: 'Geri getir', sticky: true,
        action: async () => { await N.programGeriGetir(id); if (ctx.view === 'programs') render(); } });
      break;
    }
    case 'program-geri-don': {
      const kopya = ctx.duzen?.kopya;
      if (!kopya || !(await onayla({ baslik: 'Program açtığın hâle dönsün mü?',
        govde: 'Bu programa girdiğinden beri yaptığın bütün değişiklikler (ad, gün, hareket, set, tekrar, sıra) geri alınır.',
        kalir: 'Geçmiş seanslar etkilenmez.', eylem: 'Geri dön' }))) break;
      const geri = structuredClone(kopya);
      await programiKaydet(geri);
      ctx.duzen.gun = Math.min(ctx.duzen.gun, geri.gunler.length - 1); ctx.duzen.acik = null;
      render();
      toast('Program açtığın hâle döndü.');
      break;
    }
    case 'gun-ekle': {
      const prg = duzenlenenProgram();
      const r = P.gunEkle(prg);
      if (!r.ok) { toast('En çok 7 gün olabilir.', { warn: true }); break; }
      await programiKaydet(prg);
      ctx.duzen.gun = r.i; ctx.duzen.acik = null; render();
      break;
    }
    case 'gun-sil': {
      const prg = duzenlenenProgram(), gi = ctx.duzen.gun;
      if (prg === N.aktifProgram() && N.hasAnySet(ctx.session)) { toast('Bugün set girdin. Gün silmek için önce seansı bitir.', { warn: true }); break; }
      if (!(await onayla({ baslik: `${gi + 1}. gün silinsin mi?`,
        govde: `Bu gündeki ${prg.gunler[gi].hareketler.length} hareket ve hedefleri de silinir.`,
        kalir: 'Geçmiş seanslar etkilenmez.', eylem: 'Günü sil' }))) break;
      const yedek = structuredClone(prg.gunler);
      if (!P.gunSil(prg, gi).ok) break;
      await programiKaydet(prg);
      ctx.duzen.gun = Math.max(0, gi - 1); ctx.duzen.acik = null; render();
      toast(`${gi + 1}. gün silindi.`, { label: 'Geri getir',
        action: async () => { prg.gunler = yedek; await programiKaydet(prg); ctx.duzen = { ...ctx.duzen, id: prg.id, gun: gi, acik: null }; if (ctx.view === 'program') render(); } });
      break;
    }
    case 'secici-ac': ctx.secici = { ara: '', grup: '', eq: '' }; ctx.view = 'secici'; render(); scrollTo(0, 0); break;
    case 'secici-kapat': ctx.secici = null; ctx.view = 'program'; render(); break;
    case 'ozel-ac':
      ctx.ozelForm = { ad: ctx.secici?.ara.trim() ?? '', setType: 'weight_reps', equipment: 'machine', grup: ctx.secici?.grup || 'Göğüs' };
      ctx.view = 'ozel'; render(); scrollTo(0, 0); break;
    case 'ozel-kapat': { const k = ctx.ozelForm?.kaynak; ctx.ozelForm = null; ctx.view = k === 'kutuphane' ? 'kutuphane' : 'secici'; render(); break; }
    case 'ozel-kaydet': {
      const f = ctx.ozelForm, ad = f.ad.trim();
      if (!ad) { toast('Önce hareketin adını yaz.', { warn: true }); $('o-ad')?.focus(); break; }
      const h = P.ozelHareket({ ...f, ad });
      await N.ozelEkle(h);
      // Hareketler sekmesinden açıldıysa güne konmaz: hareketin ayrıntısı açılır (oradan "Programa ekle")
      if (f.kaynak === 'kutuphane') { ctx.ozelForm = null; toast(`${h.ad} eklendi.`); await hareketAc(h.id); break; }
      await kalemiEkle(h);
      break;
    }
    case 'carry-go': {
      const y = ctx.yarim;
      // Yeni seans, YARIM KALAN günün kendisi. Setler kopyalanmaz — kayıtlar
      // yapıldıkları güne ait kalır; carriedFrom yalnız "geçen sefer yapıldı"
      // işaretini yeniden kurabilmek için (yeniden açılışta da sürsün diye).
      const yeni = N.yeniSeans(y.session.dayIndex);
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
      toast(`${N.gunEtiketi(ctx.dayIndex).kisa}'e devam ediliyor.`);
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
      const ad = N.gunEtiketi(gun).kisa;
      // Tarih BUGÜN değil ÖNCEKİ antrenman günü: telefonsuz yapılan antrenman
      // tipik olarak bugün değil, kaçırılan program günündeydi.
      const onceki = C.prevTrainingDay(new Date(), ctx.settings.trainingDays);
      const ne = onceki ?? C.addDays(new Date(), -1);
      await N.markDayDone(gun, ne.getTime());
      ctx.gunSecici = false;
      await yükle();
      toast(`${ad} yapıldı olarak işaretlendi (${C.fmtShort(ne)}). Sıra ${N.gunEtiketi(ctx.dayIndex).kisa}.`);
      break;
    }

    case 'seans-sil': {
      const d = ctx.duzenlenen;
      if (!(await onayla({ baslik: 'Bu seans silinsin mi?',
        govde: `${C.fmtShort(new Date(d.startedAt))} seansındaki bütün setler geçmişten silinir; hacim ve grafikler yeniden hesaplanır.`,
        kalir: 'Sıradaki gün de yeniden hesaplanır.', eylem: 'Seansı sil' }))) break;
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

    case 'to-settings': stopAnim(); ctx.avatarOneri = null; ctx.view = 'settings'; render(); scrollTo(0, 0); break;
    case 'kurulum-nasil':                                     // Bugün bandı → Ayarlar'daki tarayıcıya özel tarif
      stopAnim(); ctx.view = 'settings'; render(); document.getElementById('kurulum')?.scrollIntoView({ block: 'center' }); break;
    case 'kurulum-kapat':
      ctx.settings = await S.saveSettings({ kurulumBant: 'kapali' }); render();
      toast(`Yükleme tarifi Ayarlar › Telefona yükle'de duruyor.`); break;
    case 'to-profil': stopAnim(); ctx.view = 'profil'; ctx.avatarSekme = 'avatar'; render(); scrollTo(0, 0); break;
    case 'avatar-geri-al': {
      const o = ctx.avatarOneri; ctx.avatarOneri = null;
      if (o) await avatarKaydet({ govde: o.eski, govdeElle: true }); else render();
      break;
    }
    case 'prev': git(ctx.idx - 1); break;
    case 'next': git(ctx.idx + 1); break;
    case 'save': await kaydetTıklandı(); break;

    case 'oneri-uygula': {
      // ÖNER, DAYATMA: yalnız kutuya yazar; seti kaydetmek kullanıcının kararı
      // Öneri "?" panelinde: yeniden çizim paneli kapatır, kutu yeni ağırlıkla görünür
      const o = ctx.oneri[ex.id];
      if (o?.tur === 'agirlik') { ctx.draft.weight = o.agirlik; render(); toast(`Ağırlık ${UI.fmt(o.agirlik)} ${ctx.settings.unit} yapıldı.`); }
      break;
    }
    case 'ozet-tamam': ctx.ozet = null; ctx.view = 'list'; render(); scrollTo(0, 0); break;
    case 'ozet-geri-al': {
      // "Seansı bitir"in geri alması: seans yeniden açılır, liste kaldığın yerden sürer
      const s = ctx.ozet?.seans;
      if (!s) break;
      try { await N.reopen(s); }
      catch (err) { console.error('[yeniden aç]', err); toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); break; }
      ctx.ozet = null;
      await yükle();                                   // açılış kuralı: açık seansa devam edilir
      toast('Seans yeniden açıldı.');
      break;
    }

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

    case 'rest': await rest.start(N.dinlenmeSuresi(curEx(), ctx.settings)); restSlot(); break;
    case 'rest-plus': rest.extend(30); break;
    case 'rest-skip': rest.stop(); restSlot(); break;

    case 'finish': await bitir(); break;
    case 'backup': await yedekAl(); break;
    case 'import':
      if (await onayla({ baslik: 'Yedek geri yüklensin mi?',
        govde: 'Seçeceğin yedekteki kayıtlar bu telefondakilere eklenir; aynı kayıtlar yedektekiyle değişir.',
        kalir: 'Önce şimdiki hâlin yedeğini almanı öneririz.', eylem: 'Dosya seç' })) $('file').click();
      break;
    case 'reset-day':
      if (!N.hasAnySet(ctx.session) || await onayla({ baslik: 'Bugün sıfırlansın mı?', govde: 'Bugün girdiğin bütün setler silinir.',
        kalir: 'Önceki günler etkilenmez.', eylem: 'Bugünü sıfırla' })) sıfırla();
      break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'scrub') { stopAnim(); oynatma.aktif = false; draw(curEx(), +t.value / 100); if (!reduced) dongu(curEx()); return; }   // kaydırıcı: o an durur, dönüş sürer
  
  if (t.id?.startsWith('f-')) { ctx.draft[t.id.slice(2)] = t.value === '' ? null : +t.value; onizlemeTazele(); }
  // Arama: yalnız sonuç listesi yenilenir (kutunun kendisi yeniden çizilirse odak ve imleç kaybolur)
  if (t.id === 'ara' && ctx.secici) { ctx.secici.ara = t.value; $('secici-liste').innerHTML = UI.seciciListeHTML(ctx); kucukleriCiz($('secici-liste')); }
  if (t.id === 'o-ad' && ctx.ozelForm) ctx.ozelForm.ad = t.value;
  if (t.id === 'k-ara' && ctx.view === 'kutuphane') { ctx.kutuphane.ara = t.value; $('kutuphane-liste').innerHTML = UI.kutuphaneListeHTML(ctx); kucukleriCiz($('kutuphane-liste')); }
});

/* Boy: her tuşta değil ALAN BIRAKILINCA yazılır. Yazarken kaydetmek "17" gibi
   yarım değerleri diske indirir ve sonraki açılışta saçma bir boy gösterirdi. */
document.addEventListener('change', async e => {
  // Profil: ad ve yaş alan BIRAKILINCA yazılır (yazarken yeniden çizim odağı kaçırırdı)
  if (e.target.id === 'p-adin' && ctx.view === 'profil') { await profilKaydet({ ad: e.target.value.trim().slice(0, 24) }); return; }
  if (e.target.id === 'p-yas' && ctx.view === 'profil') {
    const y = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (e.target.value.trim() !== '' && !(y >= 10 && y <= 110)) { toast('Yaşı 10 ile 110 arasında yaz.', { warn: true }); render(); return; }
    await profilKaydet({ yas: Number.isInteger(y) ? y : null }); return;
  }
  // G4: harekete not — alan bırakılınca yazılır (her tuşta değil)
  if (e.target.id === 'ex-not' && ctx.session) {
    const exId = e.target.dataset.not, v = e.target.value;
    try { await N.transact(ctx.session, s => N.setNote(s, exId, v)); }
    catch (err) { console.error('[not]', err); toast(KAYIT_HATASI, { warn: true }); }
    return;
  }
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
  if ((e.target.id === 'p-ad' || e.target.id === 'g-ad') && duzenlenenProgram()) {
    const prg = duzenlenenProgram(), v = e.target.value.trim().slice(0, P.AD_UZUNLUK);
    if (e.target.id === 'p-ad') {
      if (!v) { e.target.value = prg.ad; toast('Programın bir adı olmalı.', { warn: true }); return; }
      prg.ad = v;
    } else prg.gunler[ctx.duzen.gun].ad = v;           // boş gün adı: kaslardan türetilir
    await programiKaydet(prg);
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

/* ── PROGRAM DÜZENLEYİCİ (Faz 1A) ─────────────────────────────────────────
   Program YERİNDE değiştirilir (program.js saf işlevleri) ve hemen kaydedilir. Aktif program
   değiştiyse Bugün ekranının bağımlıları (geçen sefer, öneri) dönüşte tazelenir. */
const duzenlenenProgram = () => N.programGetir(ctx.duzen?.id);
async function programiKaydet(prg) {
  await N.programYaz(prg);
  if (prg === N.aktifProgram()) ctx.programDegisti = true;
}
/** ÖZEL HAREKETİ SİL (14 Eki): onay → listeden ve programlardaki günlerden çıkar; geçmiş kalır; Geri al */
async function ozelHareketiSil(id) {
  const ex = N.byId[id];
  if (!ex?.ozel) return;
  const n = N.ozelKullanim(id).length;
  if (!(await onayla({ baslik: `"${ex.ad}" silinsin mi?`,
    govde: n ? `Hareket listesinden kalkar ve ${n === 1 ? 'kullanıldığı programdan' : `kullanıldığı ${n} programdan`} çıkarılır.` : 'Hareket listesinden kalkar.',
    kalir: 'Bu hareketle kaydettiğin setler geçmişte kalır.', eylem: 'Sil' }))) return;
  const r = await N.ozelSil(id);
  if (!r.ok) return;
  if (ctx.view === 'hareket' && ctx.hareketId === id) ctx.view = 'kutuphane';   // ayrıntısından silindiyse listeye dön
  render();
  toast(`${ex.ad} silindi.`, { label: 'Geri al', action: async () => { await N.ozelGeriGetir(r.geri); render(); } });
}
async function kalemiEkle(ex) {
  const prg = duzenlenenProgram();
  const r = P.kalemEkle(prg, ctx.duzen.gun, ex);
  if (!r.ok) { toast('Bir günde en çok 30 hareket olabilir.', { warn: true }); return; }
  await programiKaydet(prg);
  ctx.secici = null; ctx.ozelForm = null; ctx.view = 'program'; render();
  toast(`${ex.ad} eklendi.`);
}
async function duzenleyiciTiklamasi(t) {
  const ac = t.closest('[data-program-ac]');
  if (ac) {
    // Girerken anlık kopya: bir şey değişirse üstte "Açtığın hâle dön" belirir (dil 4, 13 Eki)
    const p0 = N.programGetir(ac.dataset.programAc);
    ctx.duzen = { id: ac.dataset.programAc, gun: 0, kopya: p0 ? structuredClone(p0) : null };
    ctx.view = 'program'; stopAnim(); render(); scrollTo(0, 0); return true;
  }
  const pg = t.closest('[data-pgun]');
  if (pg) { ctx.duzen.gun = +pg.dataset.pgun; ctx.duzen.acik = null; render(); return true; }
  const prg = duzenlenenProgram(), gi = ctx.duzen?.gun;
  // Satıra dokununca açılır/kapanır — bir seferde tek satır açık
  const dac = t.closest('[data-dz-ac]');
  if (dac && prg) { const i = +dac.dataset.dzAc; ctx.duzen.acik = ctx.duzen.acik === i ? null : i; render(); return true; }
  if (t.closest('[data-dz-tutac]')) return true;   // tutacak yalnız sürükler (pointer) ya da ok tuşuyla taşır
  // Açık satırın seçimleri: set noktası · tekrar şeridi · hazır şema · süre çipi
  const sec = t.closest('[data-dz-set],[data-dz-tekrar],[data-dz-sema],[data-dz-sn]');
  if (sec && prg) {
    const d = sec.dataset, [i, a, b] = (d.dzSet ?? d.dzTekrar ?? d.dzSema ?? d.dzSn).split(':').map(Number);
    const yazildi = d.dzSet != null ? P.kalemYaz(prg, gi, i, 'sets', a)
      : d.dzTekrar != null ? P.kalemYaz(prg, gi, i, 'reps', a)
      : d.dzSn != null ? P.kalemYaz(prg, gi, i, 'seconds', a)
      : P.kalemYaz(prg, gi, i, 'sets', a) != null && P.kalemYaz(prg, gi, i, 'reps', b);
    if (yazildi == null || yazildi === false) return true;
    navigator.vibrate?.(5);
    await programiKaydet(prg); render(); return true;
  }
  const yt = t.closest('[data-dz-yontem]');
  if (yt && prg) {
    const [i, alan, deger] = yt.dataset.dzYontem.split(':');
    if (!P.kalemYontem(prg, gi, +i, alan, deger === 'x' ? null : +deger)) return true;
    navigator.vibrate?.(5);
    await programiKaydet(prg); render(); return true;
  }
  const kl = t.closest('[data-kalem]');
  if (kl && prg) {
    const [i, alan, yon] = kl.dataset.kalem.split(':');
    if (P.kalemAyarla(prg, gi, +i, alan, +yon) == null) return true;
    await programiKaydet(prg); render(); return true;
  }
  const cx = t.closest('[data-cikar]');
  if (cx && prg) {
    const i0 = +cx.dataset.cikar, k0 = prg.gunler[gi]?.hareketler[i0];
    if (!k0) return true;
    const hedef = k0.minutes != null ? `${k0.minutes} dk` : k0.seconds != null ? `${k0.sets} × ${k0.seconds} sn` : `${k0.sets} × ${k0.reps}`;
    if (!(await onayla({ baslik: `"${(N.byId[k0.exId] ?? N.bilinmeyenHareket(k0.exId)).ad}" bu günden çıkarılsın mı?`,
      govde: `Bu gündeki hedefi (${hedef}) de silinir.`, kalir: 'Hareketin geçmişi ve ilerlemesi silinmez.', eylem: 'Çıkar' }))) return true;
    const i = i0, k = P.kalemSil(prg, gi, i);
    if (!k) return true;
    ctx.duzen.acik = null;
    await programiKaydet(prg); render();
    toast(`${(N.byId[k.exId] ?? N.bilinmeyenHareket(k.exId)).ad} çıkarıldı.`, { label: 'Geri getir',
      action: async () => { prg.gunler[gi]?.hareketler.splice(i, 0, k); await programiKaydet(prg); if (ctx.view === 'program') render(); } });
    return true;
  }
  const os = t.closest('[data-ozel-sil]');
  if (os) { await ozelHareketiSil(os.dataset.ozelSil); return true; }
  const ek = t.closest('[data-ekle]');
  if (ek && prg) { const ex = N.byId[ek.dataset.ekle]; if (ex) await kalemiEkle(ex); return true; }
  for (const [ozellik, alan] of [['sgrup', 'grup'], ['seq', 'eq']]) {
    const b = t.closest(`[data-${ozellik}]`);
    if (b && ctx.secici) {
      ctx.secici[alan] = b.dataset[ozellik];
      // Yalnız süzgeç düğmeleri ve liste yenilenir — arama kutusundaki odak ve yazı kaybolmasın
      render(); return true;
    }
  }
  for (const [ozellik, alan] of [['otur', 'setType'], ['oeq', 'equipment'], ['ogrup', 'grup']]) {
    const b = t.closest(`[data-${ozellik}]`);
    if (b && ctx.ozelForm) { ctx.ozelForm[alan] = b.dataset[ozellik]; ctx.ozelForm.ad = $('o-ad')?.value ?? ctx.ozelForm.ad; render(); return true; }
  }
  return false;
}

/**
 * SIRAYI DEĞİŞTİR — kalemi i'den j'ye taşır, açık satır AYNI kalemde açık kalır, kaydeder.
 * Sürükleme ile ok tuşu aynı yoldan geçer.
 */
async function kalemiTasi(i, j) {
  const prg = duzenlenenProgram(), gi = ctx.duzen?.gun, h = prg?.gunler[gi]?.hareketler;
  if (!h) return;
  const acikKalem = ctx.duzen.acik != null ? h[ctx.duzen.acik] : null;
  if (!P.kalemYerDegistir(prg, gi, i, j)) { render(); return; }
  if (acikKalem) ctx.duzen.acik = h.indexOf(acikKalem);
  await programiKaydet(prg);
  render();
  document.querySelector(`[data-dz-tutac="${j}"]`)?.focus({ preventScroll: true });
}

/**
 * SÜRÜKLE-BIRAK (11 Eki, Sabri: "listedeki hareketi yukarı aşağı kaydırabiliyoruz") — ⋮⋮ tutacağı
 * basılı tutulup sürüklenir. Satır parmağı izler; komşunun ortasını geçince DOM'da yer değiştirir
 * (diğer satırlar anında kayar), bırakınca sıra kaydedilir. Kaydırma ile çakışmasın diye tutacakta
 * `touch-action: none` (CSS). Satırın kayması `--dy` değişkeniyle — biçim CSS'te.
 */
let suruk = null;
const ortasi = k => { const r = k.getBoundingClientRect(); return r.top + r.height / 2; };
document.addEventListener('pointerdown', e => {
  const tc = e.target.closest?.('[data-dz-tutac]');
  if (!tc || ctx.view !== 'program') return;
  const satir = tc.closest('.satir-d'), liste = $('dz-liste');
  if (!satir || !liste) return;
  e.preventDefault();
  try { tc.setPointerCapture(e.pointerId); } catch { /* yapay olayda kimlik yok — yakalamasız da çalışır */ }
  suruk = { satir, liste, ilk: +tc.dataset.dzTutac, y0: e.clientY, ust0: satir.offsetTop, id: e.pointerId };
  satir.classList.add('suruk');
  navigator.vibrate?.(8);
});
document.addEventListener('pointermove', e => {
  if (!suruk || e.pointerId !== suruk.id) return;
  const { satir } = suruk;
  let k, degisti = false;
  while ((k = satir.nextElementSibling) && e.clientY > ortasi(k)) { k.after(satir); degisti = true; }
  while ((k = satir.previousElementSibling) && e.clientY < ortasi(k)) { k.before(satir); degisti = true; }
  if (degisti) navigator.vibrate?.(5);
  satir.style.setProperty('--dy', `${e.clientY - suruk.y0 - (satir.offsetTop - suruk.ust0)}px`);
});
const surukBitir = e => {
  if (!suruk || e.pointerId !== suruk.id) return;
  const { satir, liste, ilk } = suruk;
  suruk = null;
  const j = [...liste.children].indexOf(satir);
  satir.classList.remove('suruk'); satir.style.removeProperty('--dy');
  if (e.type === 'pointercancel' || j === ilk || j < 0) { render(); return; }
  kalemiTasi(ilk, j).catch(err => { console.error('[sıra]', err); toast(KAYIT_HATASI, { warn: true, sticky: true, label: 'Kapat', action: () => {} }); });
};
document.addEventListener('pointerup', surukBitir);
document.addEventListener('pointercancel', surukBitir);
// Klavye: tutacakta ↑/↓ bir satır taşır (sürükleyemeyenler için)
document.addEventListener('keydown', e => {
  const tc = e.target.closest?.('[data-dz-tutac]');
  if (!tc || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault();
  const i = +tc.dataset.dzTutac;
  kalemiTasi(i, i + (e.key === 'ArrowUp' ? -1 : 1)).catch(err => console.error('[sıra]', err));
});

/**
 * HEDEF PANELİ SEÇİMLERİ — set noktası, tekrar şeridi, hazır şema, süre çipi. Değer gizli girdiye
 * (#g-sets, #g-reps, #g-seconds) yazılır; "Hedefi kaydet" onları okur. Yeniden çizim YOK: panel açık kalır.
 */
function hedefSecimi(t) {
  const yaz = (alan, v) => { const i = $('g-' + alan); if (i) i.value = v; const y = $(`g-${alan}-yaz`); if (y) y.textContent = alan === 'seconds' ? `${v} sn` : v; };
  const isaretle = (kok, secici, kosul) => kok?.querySelectorAll(secici).forEach(b => {
    const on = kosul(b); b.setAttribute(b.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-pressed', String(on));
  });
  const noktalar = n => { document.querySelectorAll('#sheet [data-gset]').forEach(b => { b.classList.toggle('on', +b.dataset.gset <= n); b.setAttribute('aria-checked', String(+b.dataset.gset === n)); }); yaz('sets', n); };
  const tekrar = n => { isaretle($('sheet'), '[data-greps]', b => +b.dataset.greps === n); yaz('reps', n); };
  const semaIsaretle = () => isaretle($('sheet'), '[data-gsema]', b => b.dataset.gsema === `${$('g-sets')?.value}:${$('g-reps')?.value}`);
  const yt = t.closest('[data-g-yontem]');
  if (yt) { gYontem(yt); return true; }
  const b = t.closest('[data-gset],[data-greps],[data-gsema],[data-gsn]');
  if (!b) return false;
  if (b.dataset.gset) noktalar(+b.dataset.gset);
  else if (b.dataset.greps) tekrar(+b.dataset.greps);
  else if (b.dataset.gsema) { const [st, tk] = b.dataset.gsema.split(':').map(Number); noktalar(st); tekrar(tk); }
  else if (b.dataset.gsn) { isaretle($('sheet'), '[data-gsn]', x => x === b); yaz('seconds', +b.dataset.gsn); }
  semaIsaretle();
  navigator.vibrate?.(5);
  return true;
}

/** Hedef panelindeki yöntem çipi (G1): seçim HEMEN programın kalemine yazılır; panel açık kalır, blok yeniden çizilir */
async function gYontem(yt) {
  const [alan, deger] = yt.dataset.gYontem.split(':'), ex = curEx();
  const prg = N.aktifProgram(), k = prg.gunler[ctx.dayIndex]?.hareketler[ctx.idx];
  if (!k || k.exId !== ex.id) { toast('Kaydedilemedi: hareket programda bulunamadı.', { warn: true }); return; }
  const r = $('g-reps')?.value;                         // panelde seçilip henüz kaydedilmemiş tekrar: aralık ona göre
  if (alan === 'repsMin' && r && +r !== k.reps) { k.reps = Math.min(P.SINIR.reps.ec, Math.max(1, +r)); }
  if (!P.kalemYontem(prg, ctx.dayIndex, ctx.idx, alan, deger === 'x' ? null : +deger)) return;
  await N.programYaz(prg);
  navigator.vibrate?.(5);
  ctx.yontemDegisti = true;
  const yeni = curEx(), kutu = $('g-yontem');
  const t = N.effective(yeni, ctx.settings);
  if (kutu) kutu.innerHTML = UI.yontemHTML('g-yontem', t, '', ctx.settings.restSeconds, { tekrarli: yeni.setType === 'weight_reps' });
}

function git(i) {
  const exs = N.exercisesFor(ctx.dayIndex);
  if (i < 0 || i >= exs.length) return;
  stopAnim(); hold.stop();
  ctx.idx = i; ctx.view = 'focus'; ctx.draft = draftFor(exs[i]);
  oynatma.exId = null;            // harekete her girişte baştan 12 tekrar
  render(); scrollTo(0, 0);
}

/* ── Seans işlemleri ───────────────────────────────────────────────────── */
/**
 * SEANSI BİTİR → seans sonu ekranı.
 * ⚠️ Eskiden tek bir bildirim şeridiydi ve her 8. seansta yedek hatırlatması onu 0,9 sn sonra
 * SİLİYORDU (toast() öncekini kaldırır). Artık özet bir ekran; yedek hatırlatması onun içinde
 * bir satır. Bitirmenin geri alması da orada ("Geri al" → seans yeniden açılır).
 */
async function bitir() {
  const oncekiler = await S.doneSessions();             // bu seans henüz aktif → listede değil
  const bitti = await N.finish(ctx.session);
  if (!bitti) return toast('Hiç set girilmemiş; seans kaydedilmedi.', { warn: true });
  rest.stop(); hold.stop();                              // biten seansın sayacı öbür ekranda ötmesin
  const say = (await S.doneSessions()).length;
  const sonrakiGun = await N.nextDayIndex();
  const sonrakiTarih = C.nextTrainingDay(new Date(), ctx.settings.trainingDays);
  ctx.ozet = {
    ...N.seansOzeti(bitti, oncekiler, ctx.settings), seans: bitti, dayIndex: bitti.dayIndex, gun: N.gunEtiketiSeans(bitti), bitis: bitti.finishedAt,
    yedekZamani: say % ctx.settings.backupNagEvery === 0,
    sonraki: N.gunEtiketi(sonrakiGun).kisa + (sonrakiTarih ? `, ${C.fmtShort(sonrakiTarih)}` : ''),
  };
  await yükle();                                         // yeni günün listesi arkada hazır
  ctx.view = 'ozet'; render(); scrollTo(0, 0);
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
    const s = await S.importData(await f.text(), 'merge', { gunSayisi: N.programGetir(P.BENIM_ID)?.gunler.length ?? 2 });
    // Yedek programları getirmiş olabilir; eski bir yedek ise ayarlarda hedef değişikliği (overrides) taşır → programa katılır
    await N.programlariYukle();
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
  ctx.rekorOlaylari = RK.rekorOlaylari(await S.doneSessions());
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
  // Adım kullanıcının seçimiyle (dambıl 2 / 2,5) — odak ekranındaki +/− ile AYNI kaynak
  for (const ex of N.exercisesFor(ctx.dayIndex))
    ctx.oneri[ex.id] = I.oneri(ex, bitmis, N.effective(ex, ctx.settings), I.agirlikAdimi(ex, ctx.settings));
  // REKOR TABANI (14 Eki): her hareketin bugünden önceki setleri — set kaydedilince "rekor mu?" buna karşı sorulur
  ctx.rekorTaban = {};
  for (const ex of N.exercisesFor(ctx.dayIndex))
    ctx.rekorTaban[ex.id] = bitmis.flatMap(s => s.entries.filter(e => e.exerciseId === ex.id).flatMap(e => e.sets));
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

/**
 * AÇILIŞ (11 Eki, Sabri seçti: B "sade") — FS işareti sistem açılışının yerinden yukarı süzülür,
 * ad maskesiz belirir, slogan gelir, ~1,15 sn'de solar. Uygulama bu sırada arkada yüklenir: süre
 * beklemeye EKLENMEZ, örter. Dokununca hemen geçer. Hareket azaltma açıksa yalnız solma.
 * Ad ve slogan js/marka.js'ten (tek yer).
 */
/**
 * GERİ DÖNÜŞ (13 Eki): uygulamadan çıkan tek sayfa gizlilik politikası (Ayarlar › Hakkında). Oradan GERİ
 * ile dönülünce tarayıcı sayfayı baştan yükleyebiliyor (canlıda ölçüldü: önbellekte tutmadı) → açılış
 * animasyonu yeniden oynuyor ve kullanıcı Ayarlar yerine listede kalıyordu. Tarayıcının KENDİ bilgisi
 * kullanılır (gezinme türü "back_forward"); hiçbir şey saklanmaz.
 */
const GERI_DONUS = (() => { try { return performance.getEntriesByType('navigation')[0]?.type === 'back_forward'; } catch { return false; } })();

function acilisOynat() {
  const ac = $('acilis');
  if (!ac) return;
  if (GERI_DONUS) { ac.remove(); return; }   // soğuk açılış değil: kullanıcı uygulamanın içinden dönüyor
  ac.querySelector('.k1').textContent = AD.on;
  ac.querySelector('.k2').textContent = AD.son;
  ac.querySelector('.slogan').textContent = AD.slogan;
  if (!ac.animate) { ac.remove(); return; }
  const isr = ac.querySelector('.isaret'), kel = ac.querySelector('.kelime'), slo = ac.querySelector('.slogan');
  const oynayan = [];
  const an = (el, kf, o) => oynayan.push(el.animate(kf, { fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)', ...o }));
  const azalt = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bitis;
  if (azalt) {
    an(kel, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    an(slo, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    an(ac, [{ opacity: 1 }, { opacity: 0 }], { delay: 450, duration: 250 }); bitis = 700;
  } else {
    an(isr, [{ transform: 'translateY(46px) scale(1)' }, { transform: 'translateY(0) scale(.86)' }], { duration: 420 });
    an(kel, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: 260, duration: 360 });
    an(slo, [{ opacity: 0 }, { opacity: 1 }], { delay: 460, duration: 300 });
    an(ac, [{ opacity: 1 }, { opacity: 0 }], { delay: 850, duration: 180, easing: 'ease-in' }); bitis = 1030;
  }
  const kaldir = () => ac.remove();
  const zamanlayici = setTimeout(kaldir, bitis + 50);
  // Dokununca geç: hızlı solma, sonra kaldır (dokunuş alttaki düğmeye geçmez)
  ac.addEventListener('pointerdown', e => {
    e.preventDefault();
    clearTimeout(zamanlayici);
    oynayan.forEach(a => a.cancel());
    ac.animate([{ opacity: getComputedStyle(ac).opacity }, { opacity: 0 }], { duration: 120, fill: 'both' }).finished.then(kaldir, kaldir);
  }, { once: true });
}
acilisOynat();

(async () => {
  // Programlar (ve ilk açılışta göç) önce: liste aktif programın gününü gösterir
  await N.programlariYukle();
  ctx.settings = await S.getSettings();
  avatarUygula();                       // çizici henüz yok: avatar saklanır, ilk kurulum bu görünümle yapılır (yanlış gövde karesi yok)
  S.requestPersistence().catch(() => {});
  const ilk = await N.ilkAcilisGerekli();
  const r = await yükle();
  if (ilk) { ctx.ia = { adim: 0, c: {}, secili: null, profil: {} }; ctx.view = 'ilkAcilis'; render(); }
  else if (GERI_DONUS) {
    // Gizlilik sayfasından dönüş: kullanıcıyı bıraktığı yere, Ayarlar › Hakkında'ya geri koy
    ctx.view = 'settings'; render();
    document.querySelector('#settings-screen .hk-bag')?.scrollIntoView({ block: 'center' });
  } else if (r.resumed) toast('Yarım kalan seansına devam ediyorsun.');
  // 8 Eki (Sabri: "uygulama ilk açılınca ilk animasyon eski çizimle geliyor"): manken açılışta, liste ekranı
  // çizildikten sonra arka planda yüklenir — harekete geçildiğinde çoğu zaman hazırdır
  (globalThis.requestIdleCallback ?? (f => setTimeout(f, 300)))(ucBoyutHazirla);
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
    toast('Yeni sürüm hazır; seansı bitirince kendiliğinden uygulanacak.', {
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
