/**
 * ISINMA PROGRAMI
 *
 * ┌─ NEDEN AYRI DOSYA ──────────────────────────────────────────────────────┐
 * │ Isınma KAYDEDİLEN bir hareket değil, bir hazırlık. Numara almıyor, sete │
 * │ ve hacme sayılmıyor, ağırlık/tekrar tutulmuyor. exercises.js ile aynı   │
 * │ listeye koymak bu ayrımı bulanıklaştırır ve "6/28 set" gibi yanlış      │
 * │ sayımlara yol açardı.                                                    │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * SIRA RASTGELE DEĞİL — üç aşama:
 *   1. genel        vücut ısısını yükselt (kardiyo)
 *   2. hareketlilik o günün eklemlerini aç
 *   3. hazırlık     o günün İLK AĞIR hareketi, hafif ağırlıkla
 * Üçüncüsü en çok atlanan ve en çok işe yarayan kısım.
 *
 * ⚠️ POZLAR: her hareketin minik bir çizimi var ve bu çizimler egzersizlerle
 * AYNI motoru kullanıyor. Yani aynı denetimden geçiyorlar —
 * `node tools/verify-poses.js` uzuv uzunluğu, eklem limiti, dönüş yönü ve
 * ayak-yerde kurallarını burada da uyguluyor. Yeni ısınma hareketi eklersen
 * çalıştır; anatomik olarak imkânsız bir poz sessizce geçmesin.
 *
 * `ref` alanı olan adımlar kendi pozunu yazmaz — o günün gerçek egzersizinin
 * pozunu ödünç alır (hazırlık seti zaten o hareketin ta kendisidir).
 */
import { bar, grd, grip, rct, plate } from '../anim/equipment.js';

/** Kardiyo — hareket değil, ısı yükseltme. Çizimi yok, kendi bloğunda durur. */
export const KARDIYO = {
  ad: 'Koşu bandı ya da bisiklet',
  miktar: '3 dk',
  not: 'Konuşabildiğin tempo. Amaç ter değil, ısı.',
};

export const WARMUP = [
  /* ── 1. GÜN · Göğüs · Omuz · Triceps ─────────────────────────────────── */
  [
    {
      id: 'w_kol_cevirme', ad: 'Kol çevirme', miktar: '10 + 10',
      not: 'Öne ve geriye, küçükten büyüğe daireler.',
      view: 'side', face: 1,
      // Kol düz, omuzdan tam yay. Dirsek açısı 0 sabit — kol boyunca düz.
      a: { px: 130, py: 110, torso: 90, ua: -92, fa: -92, th: -90, sh: -90 },
      b: { px: 130, py: 110, torso: 90, ua: 86, fa: 86, th: -90, sh: -90 },
      eq: () => grd(),
    },
    {
      id: 'w_dis_rotasyon', ad: 'Omuz dış rotasyon', miktar: '12',
      not: 'Dirsekler gövdede sabit, ön kolları dışa aç.',
      view: 'front',
      // Dirsek 90° sabit; yalnız ön kol dışa dönüyor. İki kol simetrik.
      a: { px: 130, py: 110, torso: 90, ua: -90, fa: 0, ua2: -90, fa2: 180, th: -90, sh: -90, th2: -90, sh2: -90 },
      b: { px: 130, py: 110, torso: 90, ua: -90, fa: 40, ua2: -90, fa2: 140, th: -90, sh: -90, th2: -90, sh2: -90 },
      eq: () => grd(),
    },
    {
      id: 'w_gogus_acma', ad: 'Göğüs açma — dinamik', miktar: '20 sn',
      not: 'Kolları geriye aç-kapa; germede bekleme.',
      view: 'front',
      // "Kale direği" duruşu: üst kollar yatay, ön kollar yukarı, dışa açılıyor.
      a: { px: 130, py: 110, torso: 90, ua: 0, fa: 100, ua2: 180, fa2: 80, th: -90, sh: -90, th2: -90, sh2: -90 },
      b: { px: 130, py: 110, torso: 90, ua: 0, fa: 60, ua2: 180, fa2: 120, th: -90, sh: -90, th2: -90, sh2: -90 },
      eq: () => grd(),
    },
    {
      id: 'w_hazirlik_bench', ad: 'Bench press — boş bar', miktar: '1 × 12',
      not: 'İlk ağır hareketin sinir sistemini uyandırır.',
      ref: 'bb_bench_press', hazirlik: true,
    },
  ],

  /* ── 2. GÜN · Sırt · Biceps · Bacak ──────────────────────────────────── */
  [
    {
      id: 'w_bacak_sallama', ad: 'Bacak sallama', miktar: '10 + 10',
      not: 'Öne-arkaya, düz bacakla, kontrollü.',
      view: 'side', face: 1, legs2: true,
      // Basılan bacak sabit (ayak yerde); salınan bacak düz, geriden öne.
      a: { px: 130, py: 110, torso: 90, ua: -80, fa: -80, th: -90, sh: -90, th2: -120, sh2: -120 },
      b: { px: 130, py: 110, torso: 90, ua: -80, fa: -80, th: -90, sh: -90, th2: -55, sh2: -55 },
      eq: () => grd(),
    },
    {
      id: 'w_squat', ad: 'Vücut ağırlığıyla squat', miktar: '12',
      not: 'Tam derinlik, ağırlıksız, topuklar yerde.',
      view: 'side', face: 1,
      // Ayak SABİT (130,186); kalça iner. Diz açıları ters kinematikle çözüldü:
      // ayakta düz (0°) → dipte −105.6°. İşaret değişmiyor, diz öne bükülüyor.
      a: { px: 130, py: 110, torso: 90, ua: -85, fa: -85, th: -90, sh: -90 },
      b: { px: 130, py: 140, torso: 70, ua: -40, fa: -40, th: -39.2, sh: -144.8 },
      eq: () => grd(),
    },
    {
      id: 'w_hazirlik_row', ad: 'Kabloyla hafif kürek çekişi', miktar: '12',
      not: 'Kürek kemiklerini birbirine sıkarak.',
      ref: 'cable_seated_row',
    },
    {
      id: 'w_hazirlik_pulldown', ad: 'Lat çekişi — hafif ağırlık', miktar: '1 × 12',
      not: 'İlk ağır hareketin hazırlık seti.',
      ref: 'cable_close_pulldown', hazirlik: true,
    },
  ],
];

/** Toplam süre tahmini — liste satırında gösterilir */
export const SURE = ['~7 dk', '~7 dk'];
