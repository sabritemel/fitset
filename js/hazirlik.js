/**
 * TOPARLANMA KONTROLÜ (G4, 17 Eki 2026 — plan docs/2026-10-17-parti-f-ve-program-ozellikleri-PLAN.md §G4).
 * Seans başında isteğe bağlı üç soru; cevaplardan bugünkü öneri. Saf modül (DOM yok), tools/test-session.js sınar.
 *
 * Dayanak: Hooper indeksinin uyku ve kas ağrısı maddelerinden esinlenildi (Hooper & Mackinnon 1995: uyku · yorgunluk ·
 * stres · kas ağrısı, 1–7 ölçekli EĞİLİM izleme — eşikli karar kuralı değildir); ağrı sorusu Hooper'da yok, ürünün
 * kendi güvenlik sorusu. RP Hypertrophy'nin tutulma geri bildirimi kas grubuna özgüdür; burada her harekete
 * uygulanır (daha tutucu). "Bir set az" sayısı yerleşik bir kaynaktan değil, ürünün seçimi — sporcu onaylamadan uygulanmaz.
 * Öneri ÜÇ düzey: plana uy · biraz hafiflet · dinlen. Her öneri NEDENİNİ söyler (bağımsız denetim, 17 Eki).
 * ⚠️ Tıbbi teşhis değil. Tutulma yalnız 2 günden uzun sürüyorsa sayılır (dünkü antrenmanın normal tutulması hafifletme
 * sebebi değildir — bilinçli ölçüt). Kırmızı renk ve kayıp dili yok.
 */

export const SORULAR = [
  { id: 'uyku', soru: 'Dün gece iyi uyudun mu?', secenekler: [['iyi', 'Evet'], ['kotu', 'Hayır']] },
  { id: 'sertlik', soru: 'Kaslarında 2 günden uzun süren tutulma (sertlik, dokununca hassasiyet) var mı?', secenekler: [['yok', 'Yok'], ['var', 'Var']] },
  { id: 'agri', soru: 'Bir eklemde ya da kasta ağrın var mı? (Tutulmadan farklı: keskin ya da batan, tek bir noktada ya da eklemde, ısındıkça geçmeyen ağrı)', secenekler: [['yok', 'Yok'], ['var', 'Var']] },
];
const GECERLI = Object.fromEntries(SORULAR.map(s => [s.id, s.secenekler.map(([v]) => v)]));

/** Cevap nesnesini temizle: yalnız bilinen soru ve seçenekler */
export function temizle(c) {
  const o = {};
  for (const [id, izin] of Object.entries(GECERLI)) if (izin.includes(c?.[id])) o[id] = c[id];
  return o;
}

/**
 * Cevaplardan öneri. Eksik cevapla da çalışır: ağrı "var" ise hemen dinlen; diğerleri ancak üç soru da cevaplanınca.
 * @returns {null | { duzey: 'uy'|'hafif'|'dinlen', baslik, metin, sebep }}
 */
export function degerlendir(cevap) {
  const c = temizle(cevap);
  if (c.agri === 'var') return { duzey: 'dinlen', baslik: 'Bugün dinlen',
    metin: 'Ağrı bir zorlanmanın işareti olabilir; üstüne yüklenmek onu büyütebilir. Bugün dinlen ya da ağrıyı artırmayan hafif bir yürüyüş yap. Şişlik, uyuşma ya da hareket kısıtlılığı varsa ya da ağrı birkaç gün içinde geçmez veya artarsa bir hekime danış.',
    sebep: 'ağrı' };
  if (Object.keys(c).length < SORULAR.length) return null;
  const nedenler = [c.uyku === 'kotu' && 'uyku', c.sertlik === 'var' && 'sertlik'].filter(Boolean);
  if (nedenler.length) {
    const neden = [c.uyku === 'kotu' && 'Uykun az olduğu için toparlanman eksik kalmış olabilir.',
      c.sertlik === 'var' && 'Kasların hâlâ tutulmuş; toparlanma sürüyor.'].filter(Boolean).join(' ');
    return { duzey: 'hafif', baslik: 'Bugün biraz hafiflet',
      metin: `${neden} Hareketlerde birer set az yap: toplam yük azalır, ağırlığın ve tekniğin aynı kalır. Kendini iyi hissedersen programdaki gibi devam edebilirsin.`,
      sebep: nedenler.join(' · ') };
  }
  return { duzey: 'uy', baslik: 'Plana uy', metin: 'Uykun iyi, uzun süren tutulma ve ağrı yok. Programdaki setlerle devam et.', sebep: '' };
}

/** Kartın alt notu — acil işaretler (GUVENLIK_NOTU ile aynı çizgide) + tıbbi değerlendirme olmadığı */
export const KART_NOTU = 'Göğüs ağrısı, baş dönmesi, ateş ya da olağandışı nefes darlığı varsa bugün antrenman yapma ve bir hekime danış. Bu kısa kontrol bir öneridir, tıbbi değerlendirme değildir; Ayarlar\'dan kapatabilirsin.';
