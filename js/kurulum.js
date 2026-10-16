/**
 * TELEFONA YÜKLEME — tarayıcıya göre yol (14 Eki 2026, Sabri: "Brave'de (Xiaomi) ve Safari'de (iPhone) yükleyemedim; daha
 * kolay, kullanıcıyı uğraştırmayan bir yol var mı?"). Saf modül: tanı + tarif; arayüz ui.js, olay app.js.
 *
 * Gerçek: tek dokunuşlu "Yükle" penceresini yalnız Chromium tabanlı tarayıcılar verir (beforeinstallprompt; Chrome, Edge,
 * Samsung İnternet, bazen Brave). iPhone'da Apple buna izin vermez: Paylaş › Ana Ekrana Ekle elle yapılır (iOS 26'da eklenen
 * site kendiliğinden uygulama gibi açılır). Uygulama içi tarayıcılar (Instagram, WhatsApp, Google uygulaması…) hiç yükleyemez.
 * ⚠️ Xiaomi / Redmi / POCO (MIUI, HyperOS): tarayıcının "Ana ekran kısayolları" izni varsayılan KAPALI → yükleme sessizce
 * başarısız olur. Android Chrome kullanıcı aracısında telefon modelini gizler, Xiaomi ayırt edilemez → not her Android tarifinde.
 */

/** ua: navigator.userAgent · o: { kurulu, istem, brave, dokunmatik } → tür anahtarı (KURULUM_TARIFI) */
export function kurulumTuru(ua = '', o = {}) {
  if (o.kurulu) return 'kurulu';
  if (o.istem) return 'istem';
  if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|TikTok|Snapchat|; wv\)|GSA\//.test(ua)) return 'uygulama-ici';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && o.dokunmatik);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-diger' : 'ios-safari';
  if (/Android/.test(ua)) {
    if (o.brave) return 'android-brave';
    if (/SamsungBrowser/.test(ua)) return 'android-samsung';
    if (/Firefox\//.test(ua)) return 'android-firefox';
    if (/MiuiBrowser|XiaoMi/.test(ua)) return 'android-mi';
    if (/Chrome\//.test(ua) && !/OPR\/|EdgA\//.test(ua)) return 'android-chrome';
    return 'android-diger';
  }
  return 'masaustu';
}

export const XIAOMI_NOTU = 'Xiaomi, Redmi ya da POCO telefonda simge çıkmazsa: Ayarlar › Uygulamalar › tarayıcın › Diğer izinler › ' +
  '"Ana ekran kısayolları" iznini aç, sonra tekrar dene.';

/** Her tür için kısa başlık + adımlar (adımlarda <b> serbest; başka HTML yok) */
export const KURULUM_TARIFI = {
  'ios-safari': { tarayici: 'Safari (iPhone)', adimlar: [
    'Alttaki <b>Paylaş</b> düğmesine dokun (kare ve yukarı ok).',
    'Listede <b>Ana Ekrana Ekle</b>\'yi seç.',
    '<b>Ekle</b>\'ye dokun. FitSet ana ekranda kendi simgesiyle, adres çubuğu olmadan açılır.'],
    not: 'iPhone\'da uygulamalar yalnız bu yolla eklenebilir; Apple tek dokunuşlu yüklemeye izin vermiyor.' },
  'ios-diger': { tarayici: 'iPhone tarayıcısı', adimlar: [
    'Adres çubuğundaki <b>Paylaş</b> düğmesine dokun.',
    '<b>Ana Ekrana Ekle</b>\'yi seç ve <b>Ekle</b>\'ye dokun.'],
    not: 'Seçenek yoksa sayfayı Safari\'de aç.' },
  'android-brave': { tarayici: 'Brave', adimlar: [
    'Sağ alttaki (bazı sürümlerde sağ üstteki) <b>⋮</b> menüye dokun.',
    '<b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>\'yi seç.',
    '<b>Yükle</b> / <b>Ekle</b>\'ye dokun.'], not: XIAOMI_NOTU },
  'android-chrome': { tarayici: 'Chrome', adimlar: [
    'Sağ üstteki <b>⋮</b> menüye dokun.',
    '<b>Uygulamayı yükle</b> (ya da <b>Ana ekrana ekle</b>) seç.',
    '<b>Yükle</b>\'ye dokun.'], not: XIAOMI_NOTU },
  'android-samsung': { tarayici: 'Samsung İnternet', adimlar: [
    'Alttaki <b>≡</b> menüye dokun.',
    '<b>Sayfayı ekle</b> › <b>Ana ekran</b>\'ı seç.'] },
  'android-firefox': { tarayici: 'Firefox', adimlar: [
    '<b>⋮</b> menüye dokun.',
    '<b>Yükle</b> (ya da <b>Ana ekrana ekle</b>) seç.'], not: XIAOMI_NOTU },
  'android-mi': { tarayici: 'Mi Tarayıcı', adimlar: [
    'Bu tarayıcıda yükleme güvenilir çalışmıyor; sayfayı <b>Chrome</b>\'da aç.',
    'Chrome\'da <b>⋮</b> › <b>Uygulamayı yükle</b>.'], not: XIAOMI_NOTU },
  'android-diger': { tarayici: 'Tarayıcın', adimlar: [
    'Tarayıcı menüsünde <b>Uygulamayı yükle</b> ya da <b>Ana ekrana ekle</b>\'yi ara.',
    'Yoksa sayfayı <b>Chrome</b>\'da aç.'], not: XIAOMI_NOTU },
  'uygulama-ici': { tarayici: 'Uygulama içi pencere', adimlar: [
    'Bu sayfa bir uygulamanın içinde açıldı (Instagram, WhatsApp, Google…); buradan yüklenemez.',
    'Sağ üstteki menüden <b>Tarayıcıda aç</b>\'ı seç, sonra oradan yükle.'] },
  masaustu: { tarayici: 'Bilgisayar', adimlar: [
    'Chrome ya da Edge\'de adres çubuğunun sağındaki <b>yükle</b> simgesine tıkla.',
    'Telefona yüklemek için bu adresi telefonda aç.'] },
};

/** Bugün ekranındaki bant gösterilsin mi: yüklü değil, kapatılmadı, telefonda (bilgisayarda değil) */
export const bantGoster = (tur, ayar = {}) => !['kurulu', 'masaustu'].includes(tur) && ayar.kurulumBant !== 'kapali';
