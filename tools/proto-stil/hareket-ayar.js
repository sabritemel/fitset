/**
 * PROTOTİP VERİ AYARI — uygulamanın hareket verisine (js/anim3d/hareketler3d.js) dokunmadan bir şey denemek için
 * geçiş katmanı.
 *
 * B1 (7 Eki 2026, docs/2026-10-07-b1-veri-modeli-v2-PLAN.md): 6 Eki'deki dört ayarın dördü de UYGULAMA VERİSİNE
 * taşındı ve fizik denetimiyle korunuyor:
 *   · çift dambıl kürek: tepede üst kol gövdenin ~16° gerisinde (Sabri: "kol omuzda çok geri gidiyor")
 *   · lat çekişi + oturarak kürek: kapalı tutuş = iki PARALEL kulp, eller ±7 (MAG 127 mm)
 *   · triceps V-bar: eller V'nin kollarında ±11, kollar elin 6 cm dışına uzanır (330 mm)
 * Tutamak bilgisi (eksen, yarıçap, avuç yönü) artık verinin kendisinde: `uclar(t)(s).A.tutamak`.
 * Yeni bir deneme gerekirse `ayar`a eklenir; kalıcı olursa veriye taşınır.
 */
import { KUTUPHANE as ORJ } from '../../js/anim3d/hareketler3d.js';

const ayar = {};
export const KUTUPHANE = Object.fromEntries(Object.entries(ORJ).map(([id, h]) => [id, ayar[id] ? ayar[id](h) : h]));
export const KUTUPHANE_ORJ = ORJ;
export const AYARLANAN = Object.keys(ayar);
