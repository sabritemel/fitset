# Araştırma 2: Giysi ve aksesuar (gözlük, saat, ayakkabı) — 6 Eki 2026

Alt ajan araştırması (yalnız WebSearch/WebFetch). "(doğrulanmadı)" = birincil kaynaktan teyit edilemedi.

## ⚠️ Önce: B gövdesinin lisansı yeniden kontrol edilmeli

**Quaternius lisansı değişmiş.** Quaternius Asset License (QAL) v1.0, son güncelleme **28 Ağu 2026** (https://quaternius.com/license.html, 6 Eki'de okundu):
- Varlıklar oyun ve projelerde atıfsız serbestçe kullanılabiliyor.
- Ama şu yasak: *"You may not extract, repackage, sublicense, sell, or otherwise redistribute the Assets (in original or modified form) as a standalone asset…"*
- §7: değişiklikler geriye işlemez; varlığı aldığın anda geçerli sürüm geçerlidir.

**Çelişki:** 5 Eki'de itch.io'dan indirdiğimiz paketin içindeki `License_Standard.txt` açıkça **CC0 1.0** diyor (sha256 `0f4beaf0…268e`, dosya `tools/proto-stil/govde/LICENSE-Quaternius-CC0.txt`). Ama indirme tarihi QAL'in yürürlüğünden **sonra**.

**Etkisi:**
- Public depoda ham GLB/bin olarak durmak, QAL altında "bağımsız yeniden dağıtım" sayılabilir.
- **Öneri:** Prototip yerelde kalsın, commit edilmesin. Ürün gövdesi, lisansı kesin CC0 olan **MakeHuman/MPFB2 sistem varlıklarından** üretilsin. Ya da Quaternius'a yazılı olarak sorulsun.
- Gövdenin hangi kaynaktan geleceği, bu seçime göre Sabri'nin kararı.

## Kısa sonuç

Hazır avatar platformlarının hiçbiri uymuyor:
- Ready Player Me 31 Oca 2026'da kapandı.
- Avaturn hem bulut hem pahalı (~800 $/ay) hem de gizlilik sorunu yaratıyor.
- Reallusion ve Daz, dosyanın son kullanıcıya açık durmasını yasaklıyor.

**Doğru yol, bugünkü şort yöntemini sistemleştirmek:**
1. Her giysi, aynı iskelete bağlı ayrı bir GLB dosyası olur; ağırlıklar çevrimdışı aktarılır.
2. Giysinin örttüğü gövde bölgesi **bit maskesiyle gizlenir.** Endüstri standardı bu: MakeHuman "Delete" grubu, Unreal Mutable "Remove Mesh", MetaHuman "Body Hidden Face Map".
3. Aksesuarlar kemiğe bağlı sert nesneler olur ("soket").
4. Gerçek kumaş simülasyonu yapılmaz. Gevşek kenar gerekirse 2–4 kemiklik "spring bone" yeter (VRM yöntemi, three-vrm MIT).
5. Varlık kaynağı önceliği: MakeHuman/MPFB2 sistem giysileri (CC0) → Poly Haven / Kenney (CC0) → Sketchfab'da yalnız CC0 ve CC BY (CC BY-SA ⚠️).

## Teknikler

| Konu | Yöntem | Not |
|---|---|---|
| Bağlama | Blender'da aynı iskelet ve dinlenme pozu → `giysi.bind(govde.skeleton, govde.bindMatrix)` | Tek iskelet, kemik hesabı bir kez |
| Ağırlık aktarma | En yakın yüzey + barisentrik ağırlık. Uzak bölgelerde "Robust Skin Weights Transfer" (Epic, örnek kodu **MIT**: https://github.com/rin-23/RobustSkinWeightsTransferCode) | Çevrimdışı yapılır, GLB'ye pişirilir |
| Gövde maskeleme | Gövde 24–32 bölge; köşeye `bolge` özniteliği; giysi kaydında `gizle: [...]`; 32 bitlik tek uniform; vertex shader'da çökertme | Bölge sınırı giysi kenarının **içinde** kalmalı |
| Katmanlar | 0 tayt/şort/çorap · 1 tişört/atlet · 2 kemer/dış; her katman alttakinden 2–4 mm dışarıda | Üstteki, alttakinin bölgesini de gizler |
| Soketler | `kafa` → gözlük, kulaklık · `lowerarm` → saat · `hand` → bileklik | Eldiven ve kalın kemer skinned olmalı |
| Kumaş | Simülasyon yok; three.js `webgpu_compute_cloth` var ama telefonda pahalı | Spring bone yeter |
| Roblox katmanlı giysi | İç/dış kafes (cage) ile deformasyon | Güçlü ama ağır iş; tek gövde için gereksiz |

## Üretim araçları

| Araç | Lisans / çıktı | Uygunluk |
|---|---|---|
| Blender (Cloth, Data Transfer) | Çıktı kullanıcıya ait | ✅ Önerilen hat |
| MPFB2 | Kod GPLv3 (yalnız araç, ürüne bulaşmaz) · varlıklar **CC0** | ✅ Gövde + sistem giysileri |
| Marvelous Designer / CLO | Ücretli; çıktı kullanıcıya ait (doğrulanmadı) | Kalite en yüksek; retopoloji şart |
| GarmentCode (desen → 3B) | **MIT** | Çevrimdışı parametrik üretim için ilginç; ilk aşamada gereksiz |
| DressCode, Garment3DGen (yapay zekâ) | Lisans yok / doğrulanamadı | ❌ Kullanılamaz |

## Sponsorlu ürün
- Nike ve Adidas, Fortnite ve Roblox için dijital ürünleri platformla ortak üretiyor; koşullar kamuya açık değil.
- FitSet ölçeğinde gerçekçi yol: markanın yazılı lisansı + markanın onayladığı model ya da doku.
- Ürün, aynı giysinin bir **varyantı** olur (yeni doku ve renk); uygulamada "Reklam" etiketiyle gösterilir.

## Veri modeli önerisi

```json
{ "id":"tisort_basic_01", "tur":"giysi|aksesuar", "katman":1, "dosya":"giysi/tisort_basic_01.glb",
  "gizle":["govde_on","govde_arka","ust_kol_l","ust_kol_r"], "soket":null,
  "varyantlar":[{"id":"lacivert","renk":"#1d2b4f"}], "uyumlu_govde":"sha256:…",
  "lisans":{"spdx":"CC0-1.0","kaynak":"https://…"},
  "sponsor":{"marka":null,"baslangic":null,"bitis":null,"etiket":"Reklam"} }
```

## Bütçe (telefon, tahmin)
- Kostüm (gövde + 4–6 parça + 2–3 aksesuar) ≤ ~60 bin üçgen.
- 3–6 çizim çağrısı.
- İndirme ≤ 3–5 MB; giysi başına ~100–400 KB.

**Şart: otomatik poz testi.** Her giysi her egzersizde denetlenir ve gövdenin giysiden görünmesi sıfır olmalı (pafta + ölçüm).
