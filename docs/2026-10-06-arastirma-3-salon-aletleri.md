# Araştırma 3: Salon aletleri — gerçek ölçü, tutamaç geometrisi, veri modeli (6 Eki 2026)

Alt ajan araştırması (yalnız WebSearch/WebFetch).
İşaretler: **[S]** standart (IWF/IPF) · **[Ü]** üretici sayfası · **[İ]** ikincil kaynak · **[T]** türetilmiş/tahmin.
⚠️ Makine üreticileri oturak, ped ve makara konumlarını **yayımlamıyor**. Bunlar mankenin ölçülerinden türetilmeli ([T]).

## Manken referansı (~178 cm, 50. yüzdelik; NCSU ergonomi tablosu [İ], ×1,014 ölçek)

| Ölçü | mm |
|---|---|
| Diz altı (popliteal) yükseklik | 430 |
| Oturma omuz yüksekliği | 602 |
| Kalça–diz | 617 |
| Omuz genişliği (deltoid / akromiyon) | 509 / 415 |
| Omuz–avuç | 711 |

**Ölçülen uyumsuzluk:** Hareket verimizde omuzlar ±140 mm (= 280 mm). Akromiyon genişliği 415 mm. Prototipteki "gövdeyi daralt" çaresi bu yüzden geçici; asıl çözüm **mankeni gerçek oranlara çekmek** (Araştırma 1, öneri A).

## Ölçüler

| Alet | Değerler | Kaynak |
|---|---|---|
| Olimpik halter | 2200 mm · 20 kg · sap Ø28 · kovan Ø50 · omuzlar arası 1310 · yükleme 415 · işaretler IWF 910 / IPF 810 | [S] [Ü] |
| Plaka | Ø450 · göbek 50,5 · kalınlık 10 kg 35 / 15 kg 39 / 20 kg 50 / 25 kg 58 · IWF renkleri | [S] [İ] |
| Kilit | 2,5 kg · ~140 × 140 × 61 mm | [S] [İ] |
| Altıgen dambıl | sap 130 mm, Ø28–35. Toplam boy 9 kg 305 / 27 kg 386. Baş (köşe/düz) 9 kg 127/112 · 27 kg 183/163 | [İ] [Ü] |
| Düz bench | yükseklik 420–457 · ped eni 290–320 · boy ≥1220 · ped kalınlığı 64 | [S] [Ü] |
| Ayarlı bench | sırt 0–85°, oturak 0–15°, oturak–sırt boşluğu 25 mm | [Ü] |
| Rack | iç genişlik 1092 · derinlik 610/762 · yükseklik 2296 · dikme 51 × 76 | [Ü] |
| Lat makinesi | oturak ≈ 455 · uyluk pedi alt yüzü ≈ 600–620 · üst makara ≈ 1900–2000 (kablo dikey) | [T] |
| Kürek V-tutamacı | kulp 190 mm, Ø25, eksenler arası ~125 mm. **Kulplar paralel, avuçlar karşılıklı (nötr)** | [İ] |
| Triceps V-bar | genişlik 330 · yükseklik 203 · kulp Ø31,75. Kollar tepede birleşir, yataydan ~35–40° aşağı-dışa. **Avuçlar aşağı-içe** | [Ü] |
| İp | 686 mm · uçta Ø64 × 51 lastik · nötr → hareket sonunda dışa açılır | [İ] |
| Oturarak kürek | oturak ~450 · ayak plakası 650–700 mm önde, 10–20° yatık · makara 600–700 mm (kablo yatay) | [T] |
| Kablo kulesi | makara rayda 200–1800 mm, 15–35 konum, 2:1 oran | [Ü] [İ] |
| Leg press (45°) | Hammer Linear 241 × 165 × 145 cm. Platform ~750 × 450 · kızak 500–600 · yan tutamak kalça hizasında, öne-arka uzanan boru, nötr | [Ü] [T] |
| Eğik pres makinesi | kollar yaklaşan yay çizer; tutamak **yarı nötr** (pronasyon ile nötr arası); aralık 600–700 → 350–450 mm; pivot omzun arkası-üstü | [Ü] [T] |
| Pec deck / reverse fly | dönme ekseni dikey, **omuz eklemiyle çakışık**; fly'da dikey kulp nötr; kol uzunluğu 600–700 | [Ü] (patent US4840373) |
| Calf basamağı | 100–150 yüksek, 400–500 geniş | [T] |

⚠️ **"V-bar" iki ayrı alet.** Bugünkü verimizde ikisi aynı küçük eşkenar dörtgen; prototipte eller bu yüzden çaprazlanıyordu.
- **Kürek/lat V-tutamacı:** kulplar paralel, avuçlar karşılıklı.
- **Triceps itme V-barı:** açılı kollar, avuçlar aşağı-içe.

## Hazır 3B model
**CC0 / CC-BY lisanslı, doğrulanmış salon makinesi modeli yok.**
- Poly Haven'da spor aleti yok.
- Ücretli itch paketleri yeniden dağıtımı yasaklıyor.
→ **Prosedürel üretim doğru yol.** IK'nın ihtiyaç duyduğu kulp, pivot ve oturak noktalarını zaten ancak prosedürel üretim kesin verir.

## ⚠️ Marka ve tasarım tescili
AB tasarım reformu (2025–2026) sanal ürünleri de kapsıyor.
- Logo, marka adı ve plaka yazısı kullanılmaz.
- Bir modelin ayırt edici silüeti (Hammer Strength kolları, Technogym kapakları) kopyalanmaz.
- İşlevsel ölçüler serbest. Biçim dili FitSet'e özgü olmalı.
- IWF plaka renkleri bir standart ve serbest.

## Malzemeler (MeshPhysicalMaterial)

| Malzeme | Ayar |
|---|---|
| Toz boya çelik | metalness 0 · roughness 0,45–0,6 · clearcoat 0,2–0,3 · "portakal kabuğu" normal |
| Krom | metalness 1 · roughness 0,05–0,12 · ortam haritası şart (`RoomEnvironment`, 0 bayt) |
| Knurl (tırtıl) | elmas desen normal haritası, hatve ~1 mm |
| Vinil döşeme | roughness 0,55–0,7 · sheen 0,2–0,3 · deri gren + dikiş |
| Kauçuk | temel renk ~0,02–0,04 · roughness 0,85–0,95 |

## Alet veri modeli (öneri)

```ts
interface Kulp { id: 'L'|'R'|'tek'; merkez: V3; eksen: V3; avucNormali: V3; cap: number; uzunluk: number;
  avuc: 'pronasyon'|'supinasyon'|'notr'|'yari'; aci?: number }
interface Pivot { konum: V3; eksen: V3; minDeg: number; maxDeg: number }
interface Alet { tip: string; olcu: Record<string, number>;
  oturak?: {nokta: V3; normal: V3; yukseklik: Expr}; sirt?: {...}; ayak?: {L: V3; R: V3; normal: V3};
  diz?: {pedAlt: V3}; gogus?: {ped: V3; normal: V3};
  kulplar: Kulp[]; pivotlar: Pivot[]; kablo?: {makara: V3; baglanti: V3; oran: '1:1'|'2:1'};
  hareket: {tip: 'serbest'|'dondur'|'dogrusal'|'kablo'} }
```

- **Kulbun iki vektörü** (`eksen` + `avucNormali`) el IK'sına bilek dönüşünü kesin verir. Bugünkü "avuç tablosu" sezgisi kalkar.
- **Kullanıcıya göre konumlar mankenden türer:** `oturak = popliteal + 25` · `uylukPedi = oturak + 150` · `pecPivotY = oturak + oturmaOmuz`.

Tam rapor ve kaynak URL'leri sohbet kaydında. Önemlileri:
- https://en.wikipedia.org/wiki/Barbell
- https://eleiko.com/equipment/plates/weightlifting/3085231-25-eleiko-iwf-weightlifting-competition-plate-25-kg
- https://www.ritfitsports.com/pages/hex-dumbbells-pairs-and-sets-technical-specification
- https://www.roguecanada.ca/rogue-flat-utility-bench
- https://www.roguefitness.com/ca/rogue-adjustable-bench-3-0
- https://www.living.fit/collections/vendors/products/rowing-handle-for-cable-machine-v-bar
- https://www.titan.fitness/strength/specialty-machines/accessories/v-shape-tricep-press-down-bar-cable-machine-attachment/400126.html
- https://lifefitness.com/en-us/catalog/strength-training/plate-loaded/plate-loaded-iso-lateral-incline-press
- https://patents.google.com/patent/US4840373
- https://physicallybased.info/
- https://www.dreyfus.fr/en/2026/01/05/eu-design-protection-complete-guide-to-the-2025-reform/
