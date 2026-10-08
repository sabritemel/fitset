# Araştırma 1: Oyun ve animasyon dünyası bu sorunları nasıl çözüyor (6 Eki 2026)

Bağlam: `docs/2026-10-05-urun-evrimi-analizi.md` §12. Alt ajan araştırması; ajan yalnız WebSearch/WebFetch kullandı. Doğrulanamayan her şey ⚠️ ile işaretli.
Modelimizden ölçülen ek bilgi: Quaternius iskeletinde (65 kemik) **burkulma (twist) kemiği YOK** (kemik listesi §11 ölçümünde).

## Kısa sonuç

Sorunların çoğu iki kökten çıkıyor:
1. **Oran farkı.** Hareket ince mankene göre yazılıyor, daha geniş modele yalnız eklem konumu olarak aktarılıyor.
2. **Burkulma kaybı.** Konumdan aktarma, kemiğin kendi ekseni etrafındaki dönüşünü taşımıyor; bilek ve avuç yönü belirsiz kalıyor.

Endüstrinin çözümü beş adım:
1. Hareketi hedef iskeletin oranlarında üretmek.
2. Dönüşü bükülme ve burkulma (swing-twist) olarak ayırıp anatomik sınırla kırpmak.
3. El hedeflerini, ekipman üstünde tanımlı tutuş noktalarından (konum + avuç normali + parmak ekseni) almak.
4. Gövdeyi kapsüllerle temsil edip uzuvları dışarı itmek.
5. Giysinin altındaki gövde yüzeylerini gizlemek.

## 1. Endüstri teknikleri

- **Unreal IK Retargeter.** Kemik kemik değil zincir zincir eşleştiriyor; önce iki iskeletin dinlenme pozu eşitleniyor. Temas gerekiyorsa IK hedefleri kullanılıyor.
  - Kaynaklar: https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine · https://dev.epicgames.com/documentation/unreal-engine/retargeting-bipeds-with-ik-rig-in-unreal-engine
- **İki elle tutulan nesne (silah deseni).** Nesne tek bir kökten taşınıyor (`ik_hand_gun`), iki el o kökün altındaki noktalara çekiliyor. Oranı farklı karakterler aynı nesneyi böyle tutuyor. → **V-bar sorununun doğrudan karşılığı.**
  - https://dev.epicgames.com/documentation/unreal-engine/API/Plugins/IKRig/FIKRetargetWeaponGoalsOpSettings
- **Unity.** Animation Rigging: iki kemikli IK (hedef + dirsek ipucu); Multi-Parent kısıtıyla el hedefleri nesnenin alt noktalarına bağlanıyor.
  - https://blog.unity.com/es/games/advanced-animation-rigging-character-and-props-interaction
- **Tüm vücut IK.** Unreal FBIK/PBIK: kemik başına sertlik, eksen başına sınır, tercih edilen açı.
  - https://dev.epicgames.com/documentation/en-us/unreal-engine/control-rig-full-body-ik-in-unreal-engine
  - **Ders:** Kol ve bacakta analitik iki kemikli IK + dirsek/diz ipucu hâlâ standart; **bizim seçimimiz doğru.**
- **Swing-twist eklem sınırları.** Göreli dönüş, bükülme ve burkulma olarak ayrılır. Bükülme (eliptik) koniye, burkulma bir aralığa kırpılır (Bullet ConeTwist).
  - https://arxiv.org/pdf/2211.01466
  - ⚠️ Bilek değerleri doğrulanmadı: fleksiyon ~70–80°, ekstansiyon ~60–70°, radyal ~20°, ulnar ~30°.
  - Pronasyon/supinasyon ~80–90° ve **bilekte değil ön kolda** olur.
- **Burkulma kemikleri.** UE iskeletinde `upperarm_twist` / `lowerarm_twist` var. Bizim modelde yok: ya eklenir ya da burkulma ön kol köşelerine dağıtılır (bugün %65 ön kol kemiğinde).
- **El ve nesne.** Tutuş noktaları ("socket"): konum + avuç normali + parmak ekseni. Elin dönüşü bu çerçeveden alınır; parmaklar hazır tutuş pozlarından gelir (tam kavrama, nötr, kanca).
- **Kendi kendine çarpışma.** Gövde ve uzuvlar kapsül ve kürelerle temsil edilir; mesafe sorgusu ve IK düzeltmesiyle çözülür.
  - https://docs.vulkan.org/tutorial/latest/Advanced_glTF/Physics_Integration/02_bone_proxy_colliders.html
- **Deri deformasyonu.**
  - Doğrusal karışımlı deri (LBS) eklemde hacim kaybı ve "şeker ambalajı" büzülmesi yapar.
  - Çift kuaterniyonlu deri (DQS) hacmi korur ama şişkinlik yapabilir. https://users.cs.utah.edu/~ladislav/dq/
    - ⚠️ three.js'te hazır DQS yok (doğrulanmadı).
  - Düzeltici blend shape'ler (pose space deformation) de bir seçenek.
- **Giysi.** Standart çözüm, giysinin altındaki gövde yüzeylerini gizlemek (MetaHuman: "Body Hidden Face Map"). Bağlama pozunda verilen ofset bükülen bölgede küçülür; tek başına yetmez.

## 2. Fitness uygulamaları ve biyomekanik araçlar

- **Muscle & Motion:** fizyoterapist + animatör ekibi, 1 200+ egzersiz. Mocap mı elle mi, açıklanmıyor.
- **Sektör deseni (çıkarım):** mocap + elle temizlik (temas, el-bar, ayak kayması) ya da elle anahtar kare.
- **OpenSim:** API Apache-2.0; modeller dosya dosya farklı lisanslı. Eklem hareket açıklığı ve kas verisi için çevrimdışı başvuru.
- **MuJoCo:** Apache-2.0, resmî WASM bağlaması var. Denge ve temas doğrulaması için çevrimdışı denetim aracı olabilir; çalışma anında karakteri sürmek gerçekçi değil.

## 3. Tarayıcı kütüphaneleri

| Kütüphane | Lisans | Katkı |
|---|---|---|
| three.js CCDIKSolver | MIT | Eksen başına Euler sınırı; parmak ve omurga için |
| three-ik | MIT | FABRIK, top eklem kısıtı; durgun, fikir kaynağı |
| @pixiv/three-vrm | MIT | Normalize insansı kemik; spring bone (şort kenarı) |
| MediaPipe Pose | Apache-2.0 | Videodan 33 nokta, tarayıcıda; çevrimdışı referans |
| three-mesh-bvh | MIT | Gerçek ağa karşı batma ölçümü → test kapısı |
| Rapier / cannon-es | Apache-2.0 / MIT | Bu iş için ağır; kendi kapsül kodumuz yeter |

**Yasak olanlar:**
- FreeMoCap (AGPL-3.0)
- LaFAN1 verisi (CC BY-NC-ND)
- OpenPose (ticari olmayan lisans; doğrulanmadı)
- SMPL ekosistemi: ticari lisans Meshcapade'den ~1 500 €/yıl (mikro işletme) · ~25 000 €/yıl (KOBİ)

## 4. "Daha iyi teknoloji"

- **Videodan mocap:** Lisansa uygun pratik yol yalnız MediaPipe. O da gürültülü; yalnız çevrimdışı referans olarak kullanılabilir.
- **Fizik tabanlı kontrol** (DeepMimic + MuJoCo) ve **makine öğrenmeli IK / motion matching:** egzersiz doğruluğu için uygun değil, tarayıcıda gerçekçi değil. **Önerilmiyor.**

## 5. Önerilen mimari ve sıra (ajanın önerisi)

| | İş | Çözdüğü sorun | Maliyet |
|---|---|---|---|
| E | Giysi altındaki gövdeyi gizle | Gövdenin şorttan taşması | Düşük |
| C | Ekipmanda tutuş çerçeveleri + tutuş pozları; çok parçalı tutamaç tek kökten | Avuç/bilek, V-bar | Orta |
| D | Swing-twist sınırları + burkulmayı ön kola dağıt; sınır aşımı denetime yazılsın | Bilek burkulması | Düşük-orta |
| B | Modelden kapsüller + itme; fizik denetimine batma kapısı | Kolun gövdeye girmesi | Düşük-orta |
| A | Hareketi hedef iskeletin oranlarında yaz | Kök 1 (kalıcı çözüm) | Orta-yüksek |
| F | Düzeltici blend shape / DQS | Eklem deformasyonu | Orta-yüksek |

**Önerilen sıra: E → C → D → B → A → F.**
