# B1 · Veri modeli v2 — PLAN (onaylandı 7 Eki · UYGULANDI 7 Eki gece, commit yok)

7 Eki 2026. Ana rapor: `2026-10-05-urun-evrimi-analizi.md` §13.2 (B1), §11–§18 (prototip bulguları).

## 1. Neden

Hareket verisi (`js/anim3d/`) eski parçalı mankenin oranlarıyla yazılmış. Ürün mankeni C'nin oranları çok farklı (ölçüldü, `govde.glb`):

| | Veri (`manken3d.js` L/R) | C (MakeHuman) | Fark |
|---|---|---|---|
| Omuz yarı genişliği | 14 | 20,4 | +%46 |
| Üst kol | 31 | 26,1 | −%16 |
| Ön kol | 29 | 27,4 | −%6 |
| Uyluk | 39 | 44,0 | +%13 |
| Baldır | 37 | 44,8 | +%21 |
| Gövde (pelvis→boyun) | 60 | 57,0 | −%5 |

Prototip bu farkı her karede **çeviri katmanıyla** kapatıyor (`tools/proto-stil/govde.js`): kol modelin oranında IK, omuz kayması, dirsek sınırı, dirsek yükseklik sınırı, bacak uzatma (S ≠ 1), gövde içinden dirsek itme. Bugünkü sorunların çoğu bu katmandan çıktı (curl 154°, ters fly dirseği +9 cm, kapalı tutuşta kolların içe kapanması, bacakların ölçeklenmesi DQS'i bacakta engelliyor).

**Hedef:** veri doğrudan C'nin ölçüleriyle yazılsın; çeviri katmanı yalnız **bekçi** olarak kalsın ve 17 harekette neredeyse hiç devreye girmesin.

## 2. Kabul ölçütü ("bitti" ne demek)

1. Tek kaynak: C'nin ölçüleri `govde.json`'a üretici tarafından yazılır; `manken3d.js` oranları oradan gelir (elle sayı yok).
2. 17 hareket + 5 ısınma, `tools/fizik-denetimi.js` ve `tools/verify-poses.js`'ten geçer.
3. Prototipte çeviri bekçilerinin devreye girme sayısı (omuz kayması, dirsek sınırı, dirsek yükseklik, kol uzatma, dirsek itme) 22 hareket × 41 karede **≤ %5 kare**. Bugünkü değer ölçülüp plana yazılır.
4. Tutamak verisi açık: her el hedefi `{ hedef, eksen, avuc, tutus }` taşır; prototipteki `tutulanEksen` tahmini ve `hareket-ayar.js` düzeltmeleri kalkar.
5. Pafta (17 × 4 açı × 3 an) temiz; mevcut ölçümler (katlanma, bilek sınırı 0, kavrama ≤ 3 cm, kare-kare el dönüşü ≤ 20°) kötüleşmez.
6. Uygulamanın kendi testleri (`tools/test-*.js`) yeşil.

## 3. Adımlar

| # | İş | Dosya |
|---|---|---|
| 1 | Üretici C'nin antropometrisini (kemik boyları, omuz/kalça genişliği, gövde/baş, el kavrama ofseti) `govde.json`'a yazar | `tools/govde-uret/govde_uret.py` |
| 2 | `manken3d.js` L/R ve omuz/kalça ofsetleri tek tablodan (JS modülü, üretilen değerlerden; uygulama `govde.json`'ı çalışma anında okumaz) | `js/anim3d/manken3d.js`, yeni `js/anim3d/olcu.js` |
| 3 | Hareket hedeflerini gözden geçir: omuza göre yazılanlar kendiliğinden uyar; mutlak sabitler (`BENCH_TUTUS 26`, `FLY_R 58.5`, makara konumları, oturak/sehpa yükseklikleri) yeni ölçülere göre yeniden hesaplanır | `js/anim3d/hareketler3d.js` |
| 4 | Tutamak modeli: `{ hedef, eksen, avuc, tutus: 'pron'|'sup'|'notr' }`; prototipin `hareket-ayar.js` düzeltmeleri (kürek tepesi, paralel kulp, V-bar) veriye taşınır | `hareketler3d.js` |
| 5 | Gövde önü (`yuz`) her harekette açık (sırtüstü sağ/sol karışıklığının kökü) | `hareketler3d.js` |
| 5b | Ayak: plank'ta parmak ucu bilek yüksekliği C'nin ayak ölçüsünden (bugün ayak ~2 cm yere gömülü, ölçüldü) · serbest eller (lunge belde, triceps uylukta) gövde yüzeyine göre | `hareketler3d.js` |
| 6 | Kısıtlar veriye: dirsek ≤ 145°, el omuz altındayken dirsek ≤ omuz hizası, bilek sınırları → `kisit` olarak beyan edilir, fizik denetimi ölçer | `hareketler3d.js`, `tools/fizik-denetimi.js` |
| 7 | Prototip çeviri katmanını sadeleştir: bekçiler kalır, devreye girdiklerinde sayılır (tanı) | `tools/proto-stil/govde.js` |
| 8 | Doğrulama: fizik denetimi + pafta + ölçüm araçları + uygulama testleri + "Bugün" çizicisinin ekran görüntüleri (önce/sonra) | — |

## 4. Etki ve riskler

- ⚠️ **Uygulamadaki bugünkü 3B manken de değişir.** Aynı veriyi kullandığı için omuzları genişler, kolları kısalır, bacakları uzar. Amaç C olduğu için bu istenen yön; ama yayındaki uygulama (A gelene kadar) bu oranlarla görünür.
- Mutlak sabitli hareketler (bench, fly, kablolu hareketler) elden geçmeli; en çok iş burada.
- 2B/SVG yedek çizim aynı oranları kullanıyorsa o da etkilenir — adım 2'de ölçülecek.
- `sw.js` önbellek sürümü artırılmalı (`tools/bump-sw.js`).
- Hiçbir şey commit edilmez; commit/yayın Sabri'nin kararı.

## 5. Kararlar (Sabri)

| # | Karar | Öneri |
|---|---|---|
| D1 | Verinin oran kaynağı C olsun mu? | **Evet** (amaç C) |
| D2 | Yayındaki "Bugün" manken de yeni oranlara geçsin mi, yoksa B6'ya kadar eski veri kopyası mı kalsın? | **Geçsin** — iki veri kopyası ıraksar |
| D3 | Tutamak modeli `{hedef, eksen, avuc, tutus}` | **Evet** |

Tahmin: 3–5 gün (en büyük kalem adım 3).

## 6. Sonuç (7 Eki 2026, gece) — UYGULANDI, commit edilmedi

| Kabul ölçütü | Sonuç |
|---|---|
| 1 Tek kaynak | ✅ `tools/govde-uret/olcu-uret.mjs` `govde.glb`'den ölçer → `js/anim3d/olcu.js` (üretilmiş) + `govde.json.olcu`; `--denetle` uyumsuzluğu yakalar. Elde sayı yok: omuz, kalça, kol/bacak boyları, el kavrama ofseti, ayak bileği (7,4), ayak boyu, **parmak eklemi yüksekliği (0,8)**, gövde kesiti |
| 2 fizik-denetimi + verify-poses | ✅ "tümü temiz" · "18 egzersiz · 0 hata · 0 uyarı" |
| 3 Çeviri bekçileri ≤ %5 kare | ✅ 902 karenin **19'u (%2,1)** (önce 151 = %16,7); en büyük düzeltme ≤ 1 cm |
| 4 Tutamak verisi açık | ✅ `tutamak {eksen, r, avuc}` veride; `hareket-ayar.js` artık geçiş (`ayar = {}`); `tutulanEksen` yalnız verisiz yedek |
| 5 Pafta temiz, ölçümler kötüleşmez | ✅ 17 × 4 × 3 + üstten + ayak yakın çekimi · bilek sınırı aşımı 0 · kavrama ≤ 2,8 cm · el dönüşü ≤ 15° (lunge 25° — aşağıda) |
| 6 Uygulama testleri | ✅ `npm test` EXIT 0 (282 + 14 + 17 geçti; `sw.js` sürümü arttı) |

Yeni denetim kuralları (fizik-denetimi, olumsuz fikstürleriyle): **K5** dirsek 0–140° (kavrama noktasında) · **K5c** el omuz altındayken dirsek omuz hizasını gövde ekseninde geçmez · **K5d** dirsek C gövde kesitinin dışında · **K13** tutamak beyanı ile çizilen alet eşleşir (≤ 1,5 cm, ≤ 12°).

Denetimin bulduğu gerçek kusurlar (düzeltildi): calf raise ve bacak sallamada el direkten 4–5 cm uzaktaydı (K13) · seated row'da ayak parmakları plakanın içindeydi · leg press'te taban yönü tersti · ayak noktası tabanın altına kaydırılmış olduğu için prototip ayağı ~16° öne eğiyordu (veriye taban yönü `s.tab` eklendi) · **plankta parmaklar yerden 2 cm yukarıda / önce 2 cm gömülü**: kök, verinin "parmak kökü"nün eski kapsül yarıçapıyla (3,6) tanımlanmasıydı; artık C'nin parmak eklemi (`TOP_Y` 0,8), kapsül çizici kendi ucunu ayrıca türetiyor (`kapsulUc`) · ayakta dururken parmaklar 27° kalkıktı (modelin dinlenme açısı bükülme sayılıyordu) · kablolu curl'de taban bloğu ayağa değiyordu (genişliği kalça aralığından türetildi).

Ayak ölçümü (C, prototip): ayakta duran tüm pozlarda taban 0,0 / parmak 0,1 cm, büküm 0° · plank parmak −0,3 / ayak −0,6 cm (temas ezilmesi), büküm 83° · calf raise tepede parmak basamağın 0,1 cm altında · lunge arka ayak parmak −0,1, büküm 49°.

⚠️ Lunge el dönüşü 25°: ölçüm aracının seyrek örneklemesinden (41 karede adım fazında beden kare başına ~20 cm ilerliyor). Aynı aralık 10 kat sık örneklenince en büyük adım **4°** → oynatmada sıçrama yok.

"Bugün" (uygulamanın kapsül çizicisi) önce/sonra karşılaştırıldı: yeni oranlar (geniş omuz, uzun bacak), hiçbir harekette bozulma yok; plank/lunge/calf raise/leg press'te ayaklar zeminde ve platformda.
