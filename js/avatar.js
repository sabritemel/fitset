/**
 * AVATAR — tek kaynak (13 Eki 2026, plan docs/2026-10-13-manken-cesitleri-PLAN.md F2–F3).
 *
 * Dört gövde AYNI iskelette (boy, uzuv boyları, eklemler bir): yalnız beden yüzeyi farklı. Bu yüzden hareketler bir kez
 * yazılır, dördünde çalışır. Ayarlarda RENK ANAHTARI saklanır (hex değil): palet değişse de kayıt bozulmaz.
 *
 * Varsayılanlar (Sabri, K1–K4):
 *   · gövde: Leo (genç erkek) — cinsiyet TAHMİN EDİLMEZ; kullanıcı profilinde cinsiyet/yaş verirse avatar ÖNERİLİR
 *   · yaş ≥ 50 → aynı cinsiyetin yaşlı gövdesi önerilir; kullanıcı avatarı ELLE seçtiyse öneri onu ezmez
 *   · ten ve saç rengi telefonun BÖLGE ayarından (internetsiz; hiçbir yere gönderilmez) — yalnız öneri
 *   · genç erkek varsayılan saçsız; yaşlı gövdelerde saç (seçilmediyse) kır
 */
export const GOVDELER = [
  { id: 'erkek', ad: 'Leo', kadin: false, yasli: false },
  { id: 'kadin', ad: 'Mia', kadin: true, yasli: false },
  { id: 'yasli_erkek', ad: 'Max', kadin: false, yasli: true },
  { id: 'yasli_kadin', ad: 'Nora', kadin: true, yasli: true },
];
export const TEN = [['acik', 'Açık', '#e3c6ad'], ['bugday', 'Buğday', '#c79b77'], ['esmer', 'Esmer', '#9a6c4e'], ['koyu', 'Koyu', '#6c4633'], ['cokkoyu', 'Çok koyu', '#4b3024']];
export const SAC = [['siyah', 'Siyah', '#1d1a18'], ['koyu', 'Koyu kahve', '#3b2a20'], ['kumral', 'Kumral', '#6b4a2e'], ['sari', 'Sarı', '#c9a46a'], ['kizil', 'Kızıl', '#8a3b22'], ['kir', 'Kır', '#b8b4ad']];
// ⚠️ Kıyafette MERCAN YOK: mercan kas vurgusunun rengi — mercan atlet, kas mı kumaş mı karıştırıyordu (mokapta görüldü)
export const UST = [['grafit', 'Grafit', '#4a5566'], ['siyah', 'Siyah', '#24282e'], ['petrol', 'Petrol', '#2f6b66'], ['bordo', 'Bordo', '#7a2e3a'], ['haki', 'Haki', '#5d6b4a'], ['acik', 'Açık gri', '#c9ccd1'], ['lacivert', 'Lacivert', '#2c3e66'],
  // 17 Eki (Sabri: "sarı, kahverengi, kadınlar için pembe, eflatun"): pembe PUDRA tonunda (soğuk, düşük doygun) — mercan kas vurgusuyla karışmasın
  ['sari', 'Sarı', '#d1a93a'], ['kahve', 'Kahverengi', '#6b4a34'], ['pembe', 'Pembe', '#c98aa6'], ['eflatun', 'Eflatun', '#8b74b0'], ['beyaz', 'Beyaz', '#e6e7e9']];
export const ALT = [['grafit', 'Grafit', '#2b3038'], ['siyah', 'Siyah', '#1a1c20'], ['gri', 'Gri', '#5a6068'], ['lacivert', 'Lacivert', '#26324d'], ['bordo', 'Bordo', '#5a2430'],
  ['kahve', 'Kahverengi', '#4a3527'], ['haki', 'Haki', '#4b5639'], ['eflatun', 'Eflatun', '#5c4a7a'], ['pembe', 'Pembe', '#9a6079']];
export const CINSIYET = [['kadin', 'Kadın'], ['erkek', 'Erkek'], ['yok', 'Belirtme']];

/** Bölge → [ten, saç] önerisi (K2). ⚠️ Kalıp yargı riski: YALNIZ varsayılan, tek dokunuşla değişir. */
const BOLGE = {
  TR: ['bugday', 'koyu'], AZ: ['bugday', 'koyu'], CY: ['bugday', 'koyu'], GR: ['bugday', 'koyu'], IT: ['bugday', 'koyu'], ES: ['bugday', 'koyu'],
  IR: ['bugday', 'siyah'], IQ: ['bugday', 'siyah'], SY: ['bugday', 'siyah'], LB: ['bugday', 'siyah'], JO: ['bugday', 'siyah'],
  SA: ['esmer', 'siyah'], AE: ['esmer', 'siyah'], EG: ['esmer', 'siyah'], MA: ['esmer', 'siyah'], DZ: ['esmer', 'siyah'], TN: ['esmer', 'siyah'],
  DE: ['acik', 'kumral'], GB: ['acik', 'kumral'], FR: ['acik', 'kumral'], NL: ['acik', 'kumral'], BE: ['acik', 'kumral'], AT: ['acik', 'kumral'],
  CH: ['acik', 'kumral'], PL: ['acik', 'kumral'], RU: ['acik', 'kumral'], UA: ['acik', 'kumral'], US: ['acik', 'kumral'], CA: ['acik', 'kumral'],
  AU: ['acik', 'kumral'], IE: ['acik', 'kumral'], SE: ['acik', 'sari'], NO: ['acik', 'sari'], FI: ['acik', 'sari'], DK: ['acik', 'sari'], IS: ['acik', 'sari'],
  NG: ['cokkoyu', 'siyah'], GH: ['cokkoyu', 'siyah'], SN: ['cokkoyu', 'siyah'], KE: ['koyu', 'siyah'], ET: ['koyu', 'siyah'], ZA: ['koyu', 'siyah'],
  JP: ['acik', 'siyah'], CN: ['acik', 'siyah'], KR: ['acik', 'siyah'], TW: ['acik', 'siyah'], VN: ['bugday', 'siyah'], TH: ['bugday', 'siyah'],
  ID: ['bugday', 'siyah'], PH: ['bugday', 'siyah'], MY: ['bugday', 'siyah'], IN: ['esmer', 'siyah'], PK: ['esmer', 'siyah'], BD: ['esmer', 'siyah'],
  BR: ['bugday', 'koyu'], MX: ['bugday', 'koyu'], AR: ['bugday', 'koyu'], CO: ['bugday', 'koyu'], CL: ['bugday', 'koyu'], PE: ['bugday', 'koyu'],
};
const VARSAYILAN_BOLGE = ['bugday', 'koyu'];
/** Telefonun bölgesi ("tr-TR" → "TR"); bilinmiyorsa '' */
export const bolgeKodu = (dil = globalThis.navigator?.language ?? '') => (dil.split(/[-_]/)[1] ?? '').toUpperCase();
export const bolgeOnerisi = (kod = bolgeKodu()) => BOLGE[kod] ?? VARSAYILAN_BOLGE;

const anahtar = (liste, k) => liste.some(x => x[0] === k);
export const govdeBul = id => GOVDELER.find(g => g.id === id) ?? GOVDELER[0];
export const hex = (liste, k) => (liste.find(x => x[0] === k) ?? liste[0])[2];

/** Profilden önerilen gövde: yaş ≥ 50 yaşlı; cinsiyet kadın → kadın; yoksa genç erkek */
export function onerilenGovde(profil = {}) {
  const kadin = profil.cinsiyet === 'kadin', yasli = Number.isInteger(profil.yas) && profil.yas >= 50;
  return GOVDELER.find(g => g.kadin === kadin && g.yasli === yasli).id;
}

/**
 * Kullanıcının kaydı (eksik/boş olabilir) + profil + bölge → ÇİZİLECEK görünüm.
 * Kayıt alanları: govde · govdeElle · ten · sacVar (null = varsayılan) · sacRenk · sacElle · ust · alt
 */
export function cozumle(avatar = {}, profil = {}, bolge = bolgeKodu()) {
  const a = avatar ?? {}, [tenB, sacB] = bolgeOnerisi(bolge);
  const govde = govdeBul(a.govdeElle && a.govde ? a.govde : onerilenGovde(profil ?? {}));
  const ten = anahtar(TEN, a.ten) ? a.ten : tenB;
  const sacRenk = a.sacElle && anahtar(SAC, a.sacRenk) ? a.sacRenk : govde.yasli ? 'kir' : (anahtar(SAC, a.sacRenk) ? a.sacRenk : sacB);
  const sacli = govde.kadin || (typeof a.sacVar === 'boolean' ? a.sacVar : govde.yasli);   // genç erkek varsayılan saçsız (K1)
  const ust = anahtar(UST, a.ust) ? a.ust : 'grafit', alt = anahtar(ALT, a.alt) ? a.alt : 'grafit';
  return { govde: govde.id, ad: govde.ad, kadin: govde.kadin, ten, sacRenk, sacli, ust, alt,
    renk: { ten: hex(TEN, ten), sac: hex(SAC, sacRenk), ust: hex(UST, ust), alt: hex(ALT, alt) } };
}

/** Ayar kaydını doğrular (yedekten geri yükleme ve bozuk kayıt): bilinmeyen anahtar atılır */
export function temizAvatar(a) {
  if (!a || typeof a !== 'object') return null;
  const o = {};
  if (GOVDELER.some(g => g.id === a.govde)) o.govde = a.govde;
  if (typeof a.govdeElle === 'boolean') o.govdeElle = a.govdeElle;
  for (const [k, liste] of [['ten', TEN], ['sacRenk', SAC], ['ust', UST], ['alt', ALT]]) if (anahtar(liste, a[k])) o[k] = a[k];
  if (typeof a.sacVar === 'boolean' || a.sacVar === null) o.sacVar = a.sacVar;
  if (typeof a.sacElle === 'boolean') o.sacElle = a.sacElle;
  return o;
}
export function temizProfil(p) {
  if (!p || typeof p !== 'object') return null;
  const o = {};
  if (typeof p.ad === 'string') o.ad = p.ad.trim().slice(0, 24);
  if (p.yas === null || (Number.isInteger(p.yas) && p.yas >= 10 && p.yas <= 110)) o.yas = p.yas;
  if (p.cinsiyet === null || CINSIYET.some(c => c[0] === p.cinsiyet)) o.cinsiyet = p.cinsiyet;
  return o;
}
