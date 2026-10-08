# FitSet'i daha çok kişiye açmak: ürün, 3B ve rakip analizi

**Tarih:** 5 Ekim 2026 · **Durum:** analiz. Kod yazılmadı; kararlar Sabri'de (§9).
**Girdi:** depo ölçümü (`9768aae`), 21 rakibin App Store sayfaları ve ikincil kaynaklar, 3B model/animasyon lisanslarının birincil kaynakları.
Ham araştırma çıktıları sohbet kaydında. Kaynak numaraları §10'da.

---

## 0. Kısa sonuç

1. **Boş bir alan var.** Ciddi bir set/ağırlık defterini, otomatik ağırlık önerisini, **döndürülebilir 3B figürü**, hesapsız ve çevrimdışı kullanımı ve Türkçeyi bir arada sunan bir uygulama bulunamadı.
   - Ciddi defterler (Hevy, Strong, Fitbod, MacroFactor) **gerçek video** kullanıyor.
   - 3B figür kullananlar (Muscle Booster, MadMuscles, Virtuagym) evde antrenman uygulamaları. Ağırlık takipleri zayıf, abonelik uygulamaları sorunlu.
2. **FitSet'in en büyük açığı içerik.** 17 hareket ve sabit iki günlük programa karşı rakiplerde 300–1 600 hareket ve hazır programlar var. Başka biri FitSet'i bugün **kendi programıyla kullanamaz**.
3. **Güzel 3B'nin yolu bulundu ve lisans riski yok.** Bugünkü hareket motoru ve fizik denetimi aynen kalır, yalnız figürün "giydirmesi" değişir:
   - Önce bugünkü mankene premium ışık, malzeme ve gölge verilir. Bu, günler süren bir iş.
   - Hedef: ücretsiz ve CC0 lisanslı, iskeletli, tek parça bir gövde (MakeHuman/MPFB2). Mevcut motorla sürülür, **çalışan kas mercan rengiyle parlar**.
   - Hazır kütüphane satın almak **önerilmez**: hepsi 2B video ve lisansları public depoyla uyuşmuyor.
4. **Ölçeklenmenin anahtarı "hareket aileleri".** Yüzlerce hareket tek tek elle yazılmaz. ~13 ailenin parametreli üretimiyle (itme, çekme, kürek, curl, squat, hinge…) ~140 hareket mümkün.
5. ⚠️ **Karar gerektiren üç risk:**
   - Kanada'da 2014'ten beri **"FitSet"** adlı bir fitness şirketi var. Mağazaya çıkmadan önce marka araştırması şart.
   - Yerli rakip **Lightweight** (Furkan Kaya, 230 bin indirme) Türkçe ve kas ısı haritası sunuyor. Türkçe tek başına bir koz değil.
   - Liftosaur'un kodu **AGPL**: örnek alınabilir, kod alınmaz.

---

## 1. Bugünkü FitSet (ölçüldü)

| Alan | Durum |
|---|---|
| Ekranlar | 7: liste · odak · ısınma · ayarlar · geçmiş · seans düzenleme · seans sonu |
| İçerik | **17 hareket + 5 ısınma hareketi**, sabit **2 günlük** program (`js/data/exercises.js` → `EX` 2 gün) |
| 3B | three.js (MIT), kapsül ve lathe parçalı **çizim mankeni**. Gri `MeshStandardMaterial`, yarım küre ışık + yönlü ışık + PCF gölge, ortografik kamera (`js/anim3d/webgl.js:27-31, 102-123`) |
| İskelet | Konum tabanlı: kalça, tek parça gövde, boyun/kafa, omuz, dirsek, el, kalça eklemi, diz, ayak bileği, parmak ucu. **Omurga bükümü, kürek kemiği, ön kol dönüşü, el/kavrama yok** (`manken3d.js:64-91`) |
| Doğruluk ağı | `fizik-denetimi`: her karede el-bar, ayak-zemin, kadraj ve alet ölçüleri (504 açı). **Rakiplerde benzeri bilinmiyor.** |
| Aletler | Prosedürel: kutu sehpa, silindir kule, gerçek ölçülü dambıl/halter |
| Akıllı özellikler | İki seans kuralıyla ağırlık önerisi, dinlenme sayacı, seans sonu özeti, geçmişi düzeltme |
| Görsel dil | "Grafit" koyu tema, tek mercan vurgu, ≥44 px dokunma alanları |
| Dağıtım | GitHub Pages PWA, mağazasız kurulum çalışıyor |
| Dil / birim | Yalnız Türkçe arayüz (hareket adları İngilizce birincil), yalnız kg |

**Ekrana bakınca** (`screenshots/odak.webp`): arayüz temiz ve "premium"a yakın. Figür, bilinçli bir stil olarak okunuyor ama **prototip hissi** veriyor:
- Eklemler parçalı.
- Aletler kutu ve çubuk.
- Zemin düz bir disk; ortam yok.
- Hangi kasın çalıştığı görünmüyor.

---

## 2. "Daha çok kişi" ne demek? Üç seviye

Bu karar diğer her şeyi belirliyor (dağıtım, dil, gelir, hangi 3B kaynakları kullanılabilir).

| Seviye | Kim kullanır | Gerekenler | Gelir |
|---|---|---|---|
| **S1: Cilalı kişisel ürün** | Sen ve çevren | Program editörü + biraz daha hareket | Yok |
| **S2: Açık, ücretsiz ürün** | Herkes, ağızdan ağıza | S1 + kütüphane, şablonlar, TR/EN, kendi alan adı, Play Store | Yok ya da bağış |
| **S3: Ticari ürün (freemium)** | Herkes, mağaza keşfiyle | S2 + iOS mağazası, ödeme, destek, marka tescili, isteğe bağlı yedekleme/senkron | Abonelik ya da ömür boyu lisans |

**Önerim:** Ürünü **S2 hedefiyle** geliştirmek ve S3 kapısını açık tutmak. Ödeme duvarı en son eklenir. Bu sırada lisansı temiz olmayan hiçbir şey girmez; bugünkü kural zaten bunu sağlıyor.

---

## 3. Rakip karşılaştırması

### 3.1 Özet tablo (App Store, 5 Eki 2026; "?" = doğrulanamadı)

| Uygulama | Pro (USD) | Kütüphane | Hareket gösterimi | Kas vurgusu | Otomatik ilerleme | Hesap | Türkçe | AS puanı |
|---|---|---|---|---|---|---|---|---|
| **Hevy** | 2,99–3,99/ay · 23,99/yıl (TR ₺159,99/yıl) | yüzlerce | gerçek video | kas grubu grafiği | Pro'da | **zorunlu** | ✅ | 4,9 (96 bin) |
| **Strong** | 4,99/ay · 29,99/yıl | ? | animasyon (zayıf kaynak) | ? | yok | ? | ❌ | 4,9 (109 bin) |
| **JEFIT** | 12,99/ay · 69,99/yıl | 1 400+ | video + animasyon | kas haritası | yapay zekâ | ? | ❌ | 4,8 (47 bin) |
| **Fitbod** | 15,99/ay · 95,99/yıl | 1 000–1 600 | çok açılı video | **toparlanma ısı haritası** | yapay zekâ | ? | ❌ | 4,8 (287 bin) |
| **Alpha Progression** | 12,99/ay · 79,99/yıl (TR ₺2 299,99/yıl) | 795 | video | kas önceliği | set başına öneri + deload | **gerekmez** (kendi beyanı) | ✅ | 4,9 |
| **Gravl** | 14,99/ay | 300+ | video | toparlanma | e1RM, "neden bu ağırlık" açıklaması | ? | ❌ | 4,9 (5,7 bin) |
| **MacroFactor Workouts** | 11,99/ay · 71,99/yıl | 900+ | 3 açılı video | haftalık kas başına set | kural tabanlı | ? | ❌ | 4,8 (4,6 bin) |
| **Liftosaur** | 4,99/ay · 39,99/yıl | geniş | ? | haftalık hacim | betikle | isteğe bağlı | ❌ | 4,9 (409) |
| **Lightweight** (yerli) | ₺69,99/ay · ₺349,99/yıl | ? | video | **ısı haritası + yorgunluk** | ? | ? | ✅ | 4,8 (TR 11 bin) |
| **Muscle Booster** | 14,99–24,99/ay | 1 000+ antrenman | **animasyonlu 3B model** | ✅ modelde | ağırlık takibi yok | ? | ❌ | 4,5 (138 bin) |
| **MadMuscles** | 15,99–19,99/ay (TR ₺599,99/ay) | ? | video (3B ?) | ? | zayıf | ? | ✅ | 4,4 · TR **3,7** |
| **Virtuagym** | 11,99/ay | 5 000+ "3B" | **3B antrenör** | hedef kas | ? | ? | ✅ | 4,8 (8,2 bin) |
| **Muscle & Motion** | 14,99/ay | 1 200+ | 3B anatomi videosu | **renk kodlu 4 rol** | yok | ? | ❌ | 4,9 (7,8 bin) |
| **Gymshark Training** | ücretsiz, reklamsız | 700+ | video | ? | yok | zorunlu | ❌ | 4,8 (15 bin) |
| **FitSet bugün** | ücretsiz | **17** | **döndürülebilir 3B, fiziksel olarak doğrulanmış** | yok | iki seans kuralı | **yok** | ✅ | — |

Ayrıntılı notlar ve 21 uygulamanın tamamı ham araştırmada. Bunlar dahil: Setgraph, Liftin', BetterMe, Zing, Nike Training Club, Ladder.

### 3.2 Kullanıcıyı uygulamaya ne bağlıyor?

1. **Görünür ilerleme.** Bir araştırmada (n=209) sürekli kullanımın en güçlü belirleyicisi kendini izleme çıktı; terk etmenin ana sebebi motivasyon kaybıydı [59]. Rekor bildirimi, grafikler ve yıllık özet bu ihtiyacı karşılıyor.
2. **Kayıt hızı.** Strong en çok bununla övülüyor.
3. **"Ne yapayım?" sorusunu kaldırmak.** Otomatik ilerleme kategorinin büyüme alanı. Gravl'ın *"neden bu ağırlık"* açıklaması güven kuruyor; FitSet'in ? paneli aynı yönde.
4. **Cömert ücretsiz katman.** Hevy'nin Reddit'teki üstünlüğü büyük ölçüde buradan geliyor.

### 3.3 Rakiplerin boş bıraktığı alanlar (FitSet'in fırsatları)

| Boşluk | Kanıt | FitSet'in konumu |
|---|---|---|
| **Açı sorunu:** video tek açıdan, çok açılı video pahalı ve ağır | Fitbod ve MacroFactor çok açılı video çekiyor; MadMuscles'ta kamera açısı şikâyeti | ✅ Döndürülebilir 3B bu sorunu ucuza ve çevrimdışı çözüyor |
| **Hesap ve izleme** | Hevy hesapsız açılmıyor; JEFIT, Gravl, Boostcamp, BetterMe, MadMuscles, Zing ve Lightweight uygulamalar arası izleme yapıyor | ✅ Hesap yok, veri cihazda |
| **3B'li uygulamalarda abonelik tuzakları** | MadMuscles TR 3,7, beklenmedik çekimler; BetterMe zor iptal | ✅ Dürüst fiyat bir fark yaratır |
| **Ciddi deftere güzel 3B** | 3B'liler ağırlık takipte zayıf, defterler video kullanıyor | ✅ İkisini birleştiren yok |
| **Doğruluk** | Satıcıların 3B iddiaları kanıtsız | ✅ `fizik-denetimi` sayesinde *"her karesi fiziksel olarak denetlenmiş"* demek mümkün |
| **Kütüphane** | 300–1 600 hareket | ❌ **En büyük açık** |
| **Hazır program** | Boostcamp'te 11 000+ program; Lightweight'te 50+ | ❌ Yok |
| **Grafik ve rekor** | Hevy, Strong, Fitbod | ⚠️ Geçmiş var, grafik ve rekor zayıf |
| **Saat ve sağlık uygulamaları** | Çoğunda Apple Watch/Wear OS ve Health bağlantısı var | ❌ PWA buna doğrudan erişemiyor (§7) |
| **Veri taşıma** | Hevy ve Strong CSV içe aktarıyor | ❌ Strong/Hevy CSV içe aktarma geçiş maliyetini sıfırlar |

### 3.4 Önerilen konumlandırma

> **"Her hareketi her açıdan gör: çalışan kası parlayan, her karesi doğrulanmış 3B koç ve en sade antrenman defteri. Hesap yok, reklam yok, internet gerekmez."**

---

## 4. "Çok güzel 3B" nasıl olur?

### 4.1 Üç yol

| | **A: Mevcut manken + premium görünüm** | **B: Tek parça CC0 gövde + mevcut motor** (hedef) | **C: Hazır kütüphane satın almak** |
|---|---|---|---|
| Ne | Aynı parçalı manken. Ortam ışığı, uygun ton eşleme, yumuşak temas gölgesi, kil/porselen malzeme; gerçekçi aletler (kauçuk plaka, krom bar, döşemeli minder); kas vurgusu | MakeHuman/MPFB2 gövdesi (CC0), yüzsüz, kil görünümlü, ~12 bin üçgen. Bugünkü IK motoru kemikleri **her karede** sürer | gymvisual vb. video/GIF |
| Emek | **Günler** | **1–3 hafta** (Blender hazırlığı, kemik eşleme, kavrama noktası, denetim güncellemesi) | Az, ama mimari değişir |
| Görünüş | İyi; "bilinçli stil" | **Çok iyi**: kesintisiz gövde, kas formu | Video kalitesi yüksek ama döndürülemez |
| Ölçek | En iyisi (hareket = küçük veri) | En iyisi (gövde tek dosya, hareket verisi aynı) | Zayıf (her hareket ayrı satın alım) |
| Lisans | Sıfır risk | **Çok düşük** (CC0) | ⚠️ **Yüksek**: public depo ve çevrimdışı kullanımla çakışıyor |
| Fizik denetimi | Aynen kalır | Kalır; avuç noktası ve gövde çarpışma kapsülleri eklenir | **Kaybolur** |
| İndirme | +0 | +0,5–1,5 MB (tahmin, ölçülmedi) | Her video ayrı |

**Önerim: önce A, sonra B.** A'daki ışık, gölge, malzeme ve kas vurgusu işlerinin hepsi B'de de kullanılacak; emek boşa gitmez. C önerilmez.

### 4.2 B'nin ana fikri: "motor aynı, giydirme yeni"

```
hareket verisi (hareketler3d.js) ──► IK motoru (manken3d.an) ──► eklem konumları
                                                                    │
                       fizik denetimi ◄─────────────────────────────┤ (aynen kalır)
                                                                    ▼
                                         eşleme katmanı: segment yönü + "yukarı" vektörü
                                         → glTF kemik dönüşü (bağlama pozundan ofset)
                                                                    ▼
                                         tek SkinnedMesh (CC0 gövde) + kas maskesi
```

**Bilinen tuzaklar** (araştırmadan; ilk prototip bunları ölçmeli):
1. **Segment boyları:** Manken ile modelin kol boyu farklıysa el bara değmez. Boylar modelin kendisinden türetilmeli.
2. **Kemik ekseni ve yuvarlanma:** Her iskeletin ekseni farklıdır; ofset varsayılmaz, ölçülür.
3. **Deformasyon:** three.js'in doğrusal deri karışımında ön kol dönerken "şeker ambalajı" büzülmesi, baş üstü hareketlerde omuz çökmesi görülür. Çaresi büküm kemikleri ve açıyla sürülen düzeltici şekiller.
4. **İç içe geçme:** Leg press ve squat'ta karın ile uyluk birbirine girebilir. Bu yüzden atletik/ortalama gövde seçilir, vücut geliştirmeci değil.
5. **Eksik eklemler:** Bugünkü iskelette omurga bükümü, kürek kemiği ve ön kol dönüşü yok. Gerçekçi gövdede bunların yokluğu göze batar (row, deadlift, curl). İskelet önce genişletilmeli ve fizik denetimi de birlikte genişlemeli.

### 4.3 Kas vurgusu (en güçlü görsel fark)

- Hareketin **birincil kasları mercan**, ikincil kasları daha sönük tonla parlar. Muscle & Motion bunu 4 renkle yapıyor (ana, yardımcı, dengeleyici, karşıt); bizim tasarım dilimizde **tek vurgu rengi** kuralı var, bu yüzden 2 seviye önerilir.
- **Kaynak:** Anatomi atlaslarının (BodyParts3D, Z-Anatomy) lisansı CC BY-SA ve gövdeye "bulaşır". Bunun yerine ~20 bölgelik stilize bir **kendi kas haritamızı** boyarız; lisans riski sıfır olur.
- A yolunda da yapılabilir: parçalı mankende "uyluk", "üst kol" gibi parçalar doğrudan boyanır.
- Haftalık **kas ısı haritası** (hangi kası ne kadar çalıştırdın) aynı haritayı kullanır. Fitbod ve Lightweight'in öne çıkan özelliği bu.

### 4.4 Telefonda "premium" görünümün kuralları

- **WebGL'de kalınmalı.** WebGPU iOS 26 ve Android'de açık, ama bu küçük sahnede görünüşe katkısı yok, göç maliyeti var.
- **Ortam ışığı:** `RoomEnvironment` prosedürel üretilir. İndirme sıfır bayt, lisans sorunu yok.
- **Ton eşleme:** Kil manken için `NeutralToneMapping`.
- **Temas gölgesi:** Zemine bulanık gölge. Telefonda en ucuz premium etki.
- **Ortam örtüsü:** Ekran uzayında hesaplamak telefonda pahalı; gölgelenme modele **fırınlanır**.
- **Bütçe:** karakter 10–15 bin üçgen, toplam <100 bin, <50 çizim çağrısı, piksel oranı ≤2. Sıkıştırma meshopt ile (MIT).
- **Aletler prosedürel kalır.** IK'nın ihtiyaç duyduğu tutamaç, koltuk ve makara noktalarını kesin olarak ancak prosedürel üretim verir. Hazır alet modeli de bulunamadı.

### 4.5 Kullanılmayacak kaynaklar (lisans)

| Kaynak | Neden |
|---|---|
| TurboSquid | three.js gibi açık biçimlerde kullanımı **açıkça yasaklıyor** |
| Sketchfab/Fab Standard, Character Creator, Daz3D, MoCap Online, gymvisual | Dosyanın son kullanıcıya **çıkarılabilir** durması yasak; public depo bunu doğrudan ihlal eder |
| SMPL/SMPL-X, Fit3D, FLAG3D | Yalnız ticari olmayan araştırma |
| Mixamo | Ham dosyanın yeniden dağıtımı gri alan (24 Eyl'de reddedildi) |
| Ready Player Me | 31 Ocak 2026'da kapandı |
| `nidorx/matcaps` | Depoda lisans yok |
| Liftosaur kodu | AGPL-3.0 |

---

## 5. Ölçeklenme: hareket aileleri

Bugün her hareket elle yazılıyor (poz + IK + `kisit`) ve denetimden geçiyor. Bu yolla 22 hareket kaliteli oldu, ama 150 hareket bu yolla yazılamaz.

**Öneri:** Hareketi bir **aile + parametreler** olarak tanımlamak. Aile, alet yolunu ve gövde kurulumunu üretir, IK aynen çalışır:

| Aile | Parametreler | Örnek hareketler | ~Sayı |
|---|---|---|---|
| Yatay itme | sehpa açısı (−15/0/30/45), alet (halter/dambıl/makine/Smith), tutuş genişliği | bench, incline, decline, chest press | 16 |
| Dikey itme | ayakta/oturarak, alet | shoulder press, Arnold | 8 |
| Kürek | gövde açısı, destek (göğüs/tek kol/kablo), tutuş | DB row, seated row, T-bar | 12 |
| Dikey çekme | tutuş, alet (kablo/barfiks/makine) | pulldown, pull-up | 8 |
| Fly / açış | açı, alet, yön (ön/arka) | fly, reverse fly, cable crossover | 8 |
| Kaldırış | yön (ön/yan/arka), alet | lateral raise, front raise | 8 |
| Curl | tutuş (supin/çekiç/ters), alet, destek | barbell curl, hammer, preacher | 12 |
| Triseps uzatma | yön (aşağı/baş üstü), alet | pushdown, skull crusher | 10 |
| Squat | yük (halter ön/arka, goblet, makine), duruş | back squat, goblet, hack | 10 |
| Hinge | yük, diz açısı | deadlift, RDL, hip thrust | 10 |
| Lunge / tek bacak | yön, alet | lunge, split squat, step-up | 8 |
| Bacak makineleri | makine türü | leg extension, curl, abductor, calf | 10 |
| Core | pozisyon | plank, crunch, leg raise | 12 |
| **Toplam** | | | **~130–140** |

Her aile **bir kez** yazılır ve kendi `kisit` beyanıyla gelir. `fizik-denetimi` her parametre birleşimini zaten ölçer, yani denetim ağı aileyle birlikte ölçeklenir. Ayrıca:
- Hareket üst verisi (kaslar, alet, mekanik) **free-exercise-db**'den alınabilir (Unlicense, 800+ hareket).
- 3B'si henüz olmayan hareket **"figürsüz özel hareket"** olarak eklenebilir. Rakiplerde de bu kullanıcı beklentisi var.

---

## 6. Ürün: ne eklenmeli, ne eklenmemeli

### 6.1 Ekle (öncelik sırasıyla)

| # | Özellik | Neden | Boyut |
|---|---|---|---|
| 1 | **Program editörü** (sıfırdan da yazılabilir, 24 Eyl kararı) + **hazır şablonlar** (Full Body 3 gün, Üst/Alt 4 gün, Push/Pull/Legs, 5×5) | Başkalarının kullanabilmesinin ön koşulu | L |
| 2 | **Hareket kütüphanesi** (aileler, §5) + figürsüz özel hareket | En büyük açık | L |
| 3 | **İlk açılış sihirbazı:** hedef, seviye, gün sayısı, ekipman → şablon önerisi | "Ne yapayım?" sorusunu kaldırır | M |
| 4 | **İlerleme ekranı:** hareket grafikleri, kişisel rekor bildirimi, e1RM, haftalık kas ısı haritası | Kullanıcıyı bağlayan bir numaralı unsur | M |
| 5 | **Otomatik ısınma** (RAMP, 24 Eyl kararı) + plaka hesaplayıcı | Rakiplerde standart | M |
| 6 | **Strong/Hevy CSV içe aktarma** | Geçiş maliyetini sıfırlar | S |
| 7 | **TR/EN dil + kg/lb** | Türkiye dışına açılmanın asgarisi | M |
| 8 | **Açık tema** | Parlak salonda okunabilirlik (24 Eyl #22 açık) | S |
| 9 | **Yedek/senkron** (sunucusuz: dosyayı Drive/iCloud'a paylaşma ya da otomatik yedek hatırlatması) | Cihaz kaybında veri kaybı korkusu | S–M |

### 6.2 Ekleme (bilinçli olarak)

- **Sosyal akış:** Hevy'nin en çok şikâyet alan yanı ve sunucu gerektiriyor; kimliğimize aykırı.
- **Yapay zekâ sohbet koçu / kamera ile form takibi:** Pahalı, internet istiyor, kanıtı zayıf.
- **Beslenme:** Ayrı bir pazar.
- **Zorunlu hesap:** Fark yaratıcımızı yok eder.

---

## 7. Dağıtım

| Kanal | Durum | Not |
|---|---|---|
| PWA (bugün) | ✅ Çalışıyor | iOS 26'da Ana Ekran'a eklenen site varsayılan olarak web uygulaması açılıyor (sürtünme azaldı); ama iOS'ta kurulum istemi yok |
| **Google Play (TWA)** | 24 Eyl'de alan adı yüzünden reddedildi | **Kendi alan adıyla** (ör. `fitset.app` benzeri) mümkün: `assetlinks.json` alan kökü ister. Ek maliyet: alan adı + Play hesabı ($25 bir kez) |
| App Store | Yok | Capacitor sarmalayıcısı gerekir. Apple'ın "web sitesi sarmalayıcısı" ret riski var (doğrulanmadı). Apple Developer $99/yıl |
| Saat ve sağlık uygulamaları | ❌ | PWA HealthKit/Health Connect'e erişemez. Saat için 27 Eyl'deki bildirim köprüsü önerisi geçerli |

**Önerim:** S2 için kendi alan adı + Play Store (TWA). App Store'u S3 kararına bırakmak.

---

## 8. Önerilen yol haritası

| Faz | İçerik | Çıktı | Tahmini süre |
|---|---|---|---|
| **0: Karar** | §9 kararları; marka araştırması | Hedef seviye ve ad | 1 oturum |
| **1: Görsel sıçrama (A)** | Premium ışık/malzeme/gölge, gerçekçi aletler, zemin; **kas vurgusu** (parçalı mankende) | Bugünkü 17 hareket "vitrin" kalitesinde | 1 hafta |
| **2: Gövde prototipi (B)** | CC0 gövde + tek hareket (lat pulldown: baş üstü omuz + kavrama, en riskli ikisi) | "B olur mu?" sorusunun ölçülmüş cevabı | 3–5 gün |
| **3: İçerik temeli** | Kütüphane veri modeli + hareket aileleri + program editörü + şablonlar + sihirbaz | Başkasının kullanabildiği FitSet | 3–5 hafta |
| **4: Bağlılık** | Grafikler, rekorlar, kas ısı haritası, otomatik ısınma, CSV içe aktarma | Geri getiren FitSet | 2–3 hafta |
| **5: Açılış** | TR/EN, açık tema, alan adı, Play Store, yedekleme | Herkese açık FitSet (S2) | 2 hafta |
| **6: B'ye geçiş** | Prototip olumluysa tüm ailelere tek gövde | "Çok güzel 3B" | 2–3 hafta |

Faz 1 ve 2 birbirinden bağımsız; istersen paralel yürür. Süreler tahmin, ölçüm değil.

---

## 9. Kararlar sende

| # | Soru | Önerim |
|---|---|---|
| **K1** | Hedef seviye: S1 · S2 · S3? | **S2**, S3 kapısı açık |
| **K2** | 3B yolu: A → B (önerilen) · yalnız A · doğrudan B? | **A → B** |
| **K3** | Figür stili (B için): yüzsüz kil manken · stilize atletik · gerçekçi? | **Yüzsüz kil/porselen**: bugünkü kimliği korur, "tekinsiz vadi"ye düşmez |
| **K4** | Kas vurgusu: 2 seviye (birincil/ikincil) mi? | **Evet**; tek vurgu rengi kuralıyla uyumlu |
| **K5** | Ad: "FitSet" kalsın mı, araştırma sonrası mı karar verilsin? | Mağazadan **önce** marka araştırması |
| **K6** | Dil: TR/EN ne zaman? | Faz 5 (içerik oturduktan sonra) |
| **K7** | İlk adım: Faz 1 (görsel) mi, Faz 3 (içerik) mi? | **Faz 1 + Faz 2 prototipi.** Sevdiğin şeyi büyütür ve B'nin riskini erkenden ölçer; içerik ondan sonra |

**✅ Sabri'nin kararları (5 Eki 2026):** yedi kararın yedisi de önerildiği gibi onaylandı: K1 S2 (S3 kapısı açık) · K2 A → B · K3 yüzsüz kil/porselen · K4 iki seviyeli kas vurgusu · K5 mağazadan önce marka araştırması · K6 TR/EN Faz 5'te · K7 önce Faz 1 + Faz 2 prototipi. Stil prototipi de onaylandı.

**Ek soru: manken "ürün mankeni" olabilir mi?** (sponsorlu ayakkabı, şort, matara)
- Emsal var (Bitmoji marka kıyafetleri, Nike'ın Roblox/Fortnite ürünleri, Strava'nın markalı meydan okumaları). Gri kil mankende tek renkli nesnenin ürün olması güçlü bir sunum.
- Engeller:
  - Markalar ölçülebilir erişim ister; tahminen on binlerce aktif kullanıcı gerekir.
  - Ölçüm, "hesap yok / izleme yok" kimliğiyle çatışır; ancak isteğe bağlı anonim bir sayaçla çözülebilir.
  - İzinsiz marka çizimi ihlaldir; yazılı lisans gerekir.
  - Türkiye'de örtülü reklam yasak; yerleştirme "sponsorlu" diye belirtilmeli.
  - Kullanıcı güveni zarar görebilir.
- Daha güçlü alternatifler: alet üreticileri (doğru kullanılan makine) · markalı programlar · kullanıcının kendi giydirmesi.
- **Karar:** Şimdi değil. B'de iskelete **aksesuar yuvaları** (ayak, şort, üst, el nesnesi) baştan tasarlanır.

**Sonraki somut adım (onayınla):** Aynı hareket (lat pulldown + bench press) üzerinde **tıklanabilir bir 3B stil prototipi**. Bugünkü manken / A (premium + kas vurgusu) / B (CC0 gövde) yan yana, telefonda döndürülebilir. Seçimi görerek yaparsın.

---

## 10. Kaynaklar (seçme)

Tam liste (67 kaynak) ham araştırmada. Önemlileri:

- Hevy: https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350 · TR fiyat: https://apps.apple.com/tr/app/id1458862350
- Fitbod toparlanma haritası: https://fitbod.me/blog/muscle-recovery/
- Alpha Progression: https://alphaprogression.com/en
- Lightweight (yerli): https://apps.apple.com/tr/app/id1580231861 · https://webrazzi.com/2024/11/04/kisisellestirilmis-fitness-programlari-sunan-yerli-uygulama-lightweight/
- Muscle & Motion: https://apps.apple.com/us/app/id1302056349
- MadMuscles TR: https://apps.apple.com/tr/app/id1526814298 · https://www.trustpilot.com/review/madmuscles.com
- Liftosaur (PWA + mağaza, AGPL): https://www.liftosaur.com/ · https://github.com/astashov/liftosaur
- [59] Kullanım ve terk araştırması: https://pmc.ncbi.nlm.nih.gov/articles/PMC8872344
- MPFB2 varlık lisansı (CC0): https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/LICENSE.ASSETS.md · kapalı kaynak SSS: https://static.makehumancommunity.org/mpfb/faq/use_in_closed_source.html
- Microsoft Rocketbox (MIT, arşivli): https://github.com/microsoft/Microsoft-Rocketbox
- Quaternius (CC0): https://quaternius.com/packs/universalbasecharacters.html
- Mesh2Motion (MIT/CC0): https://github.com/Mesh2Motion/mesh2motion-app
- TurboSquid WebGL yasağı: https://blog.turbosquid.com/royalty-free-license/
- SMPL lisansı: https://smpl.is.tue.mpg.de/modellicense.html
- gymvisual koşulları: https://gymvisual.com/content/3-terms-and-conditions-of-use
- Safari 26 WebGPU: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- three.js sürümleri: https://api.github.com/repos/mrdoob/three.js/releases
- Poly Haven (CC0): https://polyhaven.com/license
- free-exercise-db (Unlicense): https://github.com/yuhonas/free-exercise-db
- FitSet ad çakışması: https://www.crunchbase.com/organization/fitset

**Doğrulanamayanlar:** Strong ve Fitbod'un hesap/çevrimdışı durumu, Google Play puanlarının çoğu, Reddit görüşleri (yalnız ikincil özet), Rokoko/Plask/Move.ai çıktı lisansları, App Store'un sarmalayıcı ret riski, 3B dosya boyutu tahminleri.

---

## 11. Stil prototipi: ölçülen sonuçlar (5 Eki 2026, gece)

**Sayfa:** `mockup-3b-stil.html`. Yerelde açmak için: `python -m http.server` → `/mockup-3b-stil.html`. URL parametreleri: `?h=bb_bench_press` (hareket) · `&p=2` (telefonda açılacak panel).
**Kod:** `tools/proto-stil/` → `premium.js` (A) · `govde.js` (B) · `vendor/` (three.js r186 tam sürüm, MIT) · `govde/` (Quaternius CC0 gövde + normal haritası).

**Uygulama kodu DEĞİŞMEDİ:** `js/`, `css/`, `sw.js` aynı. Commit edilmedi. Klasör boyutu 7,1 MB (vendor 2,3 MB + normal haritası 4,2 MB); hiçbiri önbelleğe girmiyor.

**Doğrulama:** CDP ile başsız Chrome'da ekran görüntüsü alındı.
- Masaüstü (1280 px): lat çekişi, bench press, leg press.
- Telefon (393 px, cihaz öykünmesi): sayfa genişliği 393, taşma yok.
- Konsolda hata yok. Kalan iki iz beklenen türden: iki three.js kopyası uyarısı (Bugün ve A/B ayrı paketler) ve `favicon.ico` 404.
- ⚠️ Ölçüm aracı tuzağı: `--window-size` başsız Chrome'da görünümü **504 px**'e sabitliyor. İlk "telefonda taşma" görüntüsü bu yüzden yanlıştı; ölçüm `innerWidth` ile doğrulandı ve gerçek ölçüm cihaz öykünmesiyle yapıldı.

### 11.1 A · Premium
- Bugünkü mankenle aynı motor. Değişen yalnız görünüş: kil/porselen yüzey (`MeshPhysicalMaterial`, sheen + clearcoat), `RoomEnvironment` ortam ışığı, `NeutralToneMapping`, yumuşak VSM gölge, sahne ışığı lekesi, krom bar, kauçuk plaka, döşeme ve boyalı çelik.
- Kas vurgusu parça düzeyinde: yön testi (normal · yön) gölgelendiricide yapılıyor. Örneğin göğüs ile lat aynı elipsoidin ön ve arka yüzü.
- Uygulamaya taşınırsa alt kümeye eklenecek sınıflar: `MeshPhysicalMaterial`, `PMREMGenerator`, `NeutralToneMapping`, `VSMShadowMap`, `ShadowMaterial`, `CanvasTexture`, `PlaneGeometry` + `RoomEnvironment` (eklenti).

### 11.2 B · Tek gövde (en riskli varsayımlar ölçüldü)

| Varsayım | Sonuç |
|---|---|
| CC0 gövde, mevcut IK motoruyla sürülebilir mi? | ✅ **Evet.** Her kemiğe her karede bir dünya matrisi yazılıyor: `T(eklem)·R(dinlenme→hedef)·S(boyuna)·K·T(−dinlenme)·B0`. Lat çekişi, bench ve leg press ilk denemede doğru duruşta. |
| El bara değer mi? | ✅ Eller bizim IK noktasında. Parmaklar "kavrama pozu"yla bara sarılıyor. Bilek, kavrama noktasının ön kol boyunca 7 cm gerisine konuyor (araştırmadaki "kavrama ofseti"). |
| Oran farkı | ⚠️ **Ölçüldü:** modele göre bizim üst kolumuz ×1,23, ön kolumuz ×1,19, gövdemiz ×1,09 uzun; uyluğumuz ×0,91, baldırımız ×0,81 kısa. Prototip segmentleri boyuna uzatıp kısaltıyor; gözle fark edilmiyor ama gerçek uygulamada **bizim L sabitleri modelin oranlarına çekilmeli ve fizik denetimi yeniden koşmalı**. |
| Ayak zemine basar mı? | ✅ Model ayak kemiği tabandan 8,6 cm, bizimki 3,6 cm yüksekte. Bilek, taban normali boyunca 5 cm kaldırılıyor; zeminde dünya yukarısı, makinede kaval kemiği yönü kullanılıyor. |
| Kas vurgusu | ✅ Doku maskesine gerek kalmadı. Kemik başına yön + güç (65 elemanlı uniform dizi), köşenin deri ağırlıklarıyla karışıyor; bölgenin sınırını modelin kendi ağırlıkları çiziyor. |
| ⚠️ **Bilek ve avuç yönü** | **Veri yok.** Hareket tanımları elin YERİNİ veriyor, yönünü vermiyor. Bugünkü mankende görünmüyordu; gerçek elde görünüyor (bench'te bir el ters dönük). Çözüm veri modelinde: her kavramaya **"kavrama ekseni + avuç yönü"** alanı. B'ye geçişin asıl veri işi bu. |
| ⚠️ **Yüz** | Quaternius gövdesi yontulmuş bir yüz taşıyor; K3 "yüzsüz" diyordu. Seçenekler: (a) yüzü yumuşatmak (Blender'da baş ağı düzeltmesi) · (b) bugünkü yumurta kafayı gövdeye takmak · (c) yüzü bırakmak (daha "karizmatik", ama tekinsiz vadi riski) |
| Çıplak gövde | Temel model kıyafetsiz. Ürünleşirken **şort ve ayakkabı aksesuar yuvalarından** gelir. Bu, §9 ek sorusundaki aksesuar yuvalarının ilk gerçek kullanımı olur. |
| Boyut | glTF 23 KB + bin 0,7 MB + normal haritası 4,2 MB (PNG). Uygulamaya girerse KTX2/WebP + meshopt ile ~1 MB hedeflenir (ölçülmedi). |
| Lisans | Quaternius Universal Base Characters Standard: **CC0 1.0** (paketteki `License_Standard.txt`, birincil kaynak). Dosya `tools/proto-stil/govde/LICENSE-Quaternius-CC0.txt`. Ücretsiz sürümde yalnız "Superhero" erkek/kadın gövde var; "Regular" ve "Teen" oranları $20'lık kaynak pakette. |

### 11.3 Sabri'nin ilk incelemesi (5 Eki, 23:24) ve ölçülen kök

**Geri bildirim:**
- A çok parlak; kas vurgusunun şekli ve yeri doğru görünmüyor (gövde kas parçalarına bölünmüş değil).
- B çok kaslı, kaba, korkutucu; sevimli değil. Kürek ve omuz kasları abartılı ve keskin; tüm hatlar daha yumuşak olmalı.
- Bazı hareketlerde sağ ve sol bacak yer değiştirmiş, eller yanlış yöne dönük.

**Ölçülen kök (sağ/sol):** Sırtüstü iki harekette (bench press, dambıl fly) yüz yönü ile g × yan **zıt** (yüz·ileri = −1,00, 22 hareketin yalnız bu ikisi). Gövdenin önü g × yan'dan türetilince sehpayı gösteriyor, sağ ve sol da yer değiştiriyor. Parçalı mankende bu hiç görünmüyordu, çünkü parçalar önden-arkadan simetrik. A'da göğüs vurgusu sehpaya bakan tarafa düşüyordu.
→ Prototipte düzeltildi: gövdenin önü artık `s.yuz` (mutlak referans), A/B tarafı ona göre belirleniyor.
→ **Veri modeli dersi:** gövdenin önü açıkça beyan edilmeli. Yüz yönü kodda VARDI ama yalnız kafa çiziminde okunuyordu (16 Ağu dersinin tekrarı: *yön denetimi mutlak referans ister*).

**Prototipte yapılan hızlı ayarlar:**
- A ve B mat kil yüzeye geçti: cila kalktı, sheen 0,35 → 0,18, pozlama 0,92.
- B'de kas kabartması %35'e indi.

**Kalan:** B'nin kendi oranları "süper kahraman" (geniş omuz, V gövde). Sevimli ve yumuşak bir gövde yeni bir yol ister (§11.4).

### 11.4 İkinci inceleme (5 Eki, 23:47) ve düzeltmeler

**Geri bildirim:** Bacak, sırt ve kanat kasları hâlâ abartılı. Bazı hareketlerde kollar yön değiştiriyor. Bilekler neredeyse hiç doğru çalışmıyor; eller barı kavramıyor, kavrasa da hareket ederken sabit kaldığı için bar elin içine geçiyor.

**Kökler ve düzeltmeler (prototipte):**
1. **Kol burkulması:** Kolun dönüşü dirseğin büküm yönünden türetiliyordu. Kol düzleşince bu yön tanımsızlaşıyor ve yedeğe geçerken kol burkuluyordu.
   → Artık verinin kendi IK kutbundan (`hedef.kutup`) türetiliyor; diz için de aynısı. Sürekli.
2. **Bilek ve kavrama:** El ön kolun yönüne sabitti, tutulan nesneyi bilmiyordu.
   → El artık ekipmandaki en yakın ince kapsülün (bar, sap, tutamaç) eksenine göre yönleniyor. Avucun içindeki kavrama noktası bizim IK noktasına oturuyor, bilek oradan türüyor, ön kol buna göre uzuyor. Her karede yeniden hesaplandığı için bar elin içine girmiyor.
   → **Kavrama türü (avuç aşağı / yukarı / nötr) veride yok:** prototipte hareket başına elle bir tablo var; uygulamada her hareketin verisine girmeli.
3. **Abartılı kaslar:** Modelin kendi geometrisi.
   → Yüklemede bağlama uzayında Taubin süzgeci uygulanıyor (10 tur; hacmi koruyarak keskin hatları siler, dikiş köşeleri konumdan kaynaştırılıyor). Kemik ağırlığıyla inceltme: sırt kanatları −%13, sırt kabarıklığı −%18, trapez alçalıyor, uyluk −%12, baldır −%10, pazu −%8. Normal haritası %18'e indi.

⚠️ **Ölçüm aracı tuzağı:** Arka planda başlatılan yerel sunucu kabukla birlikte kapanmıştı. CDP betiği hata sayfasını yükleyip "konsol: hata yok" dedi. Görüntüye bakmasam geçersiz bir doğrulamayı geçerli sayacaktım. Sunucu artık kalıcı arka plan işi; her ölçümden önce `curl` ile 200 kontrol ediliyor.

### 11.5 Üçüncü inceleme (6 Eki, 00:06): kalça, bilek, yüz, şort

- **Kalça/bel:** bel çizgisinde genişletme (+%7 en, +%4 derinlik), kalça çıkıntısı −%32.
- **Bilek dönmesi:** iki kök vardı.
  - Başparmak yönü her karede kuraldan yeniden seçiliyordu; kuralın işareti hareket içinde değişince bilek dönüyordu.
  - V-bar gibi çok parçalı tutamaçta el kareden kareye başka parçaya atlıyordu.
  - → Başparmak yönü hareket başında **bir kez** seçiliyor, sonra önceki kareye en yakın yön korunuyor. Tutulan parça 8 cm içinde kaldıkça bırakılmıyor.
  - ⚠️ Bu yalnız ekran görüntüleriyle kontrol edildi; sürekliliği Sabri'nin canlı gözü doğrulamalı.
- **Yüz:** yüzün önüne kademeli maskeyle 30 tur hacim koruyan + 22 tur düz yumuşatma; burun ve dudak silikleşti. Baş %10 büyüdü (animasyon karakteri oranı). Baş kemiğine bağlı iki koyu, parlak oval göz eklendi. İlk denemede sert maske alında kırışık bıraktı; kademeli maskeyle giderildi.
- **Şort (ilk aksesuar yuvası):** gövdenin kendi yüzeyinden türetildi: bel ile uyluk ortası arasındaki üçgenler, normal boyunca 7 mm dışarı, aynı iskelet ve deri ağırlıkları. Kas tekdüzenleri paylaşılıyor, kas vurgusu kumaşın üstünde de görünüyor. Renk nötr grafit (`#2b3038`); mercan yalnız kas için.
  → Sponsorlu ürün / kullanıcı giydirmesi için gereken mekanizma bu: **giysi = gövdeden türeyen ya da aynı iskelete bağlı ayrı ağ**.

### 11.6 Dördüncü inceleme (6 Eki, 02:26)

- **Bel:** Sabri'nin kastettiği bel boşluğuymuş (alt sırt çukuru), bel kalınlığı değil. Benim okumam yanlıştı.
  → Genişletme geri alındı. Yalnız alt sırt çukuru arka yüzde ≤1,1 cm dolduruldu. Kalça düzeltmesi −%32'den −%20'ye indi.
- **Yüz:** Eski hâline döndü (göz, baş büyütme ve yüz yumuşatması kaldırıldı). Sabri: *"yeni yüz çok anlamsız"*.
- **Şort:**
  - Bel bandı 1,045 → 1,12 m (doğal bel).
  - Bolluk 7 → 15 mm, paçaya doğru 32 mm'ye açılıyor.
  - Kumaş, kas hatlarını izlemesin diye ayrıca yumuşatıldı.
  - ⚠️ İlk denemede düz süzgeç bacak silindirini büzdü ve gövde kumaşın içinden çıktı; Taubin'e geçildi.
  - Bilinen: bel bandının üst kenarı üçgen sınırından kesildiği için hafif tırtıklı.
- **Eller:**
  - Başparmak da bar çevresine sarılıyor.
  - Elin ön kol eksenindeki burulmasının %65'i ön kola dağıtılıyor (pronasyon/supinasyon ön kolda olur). Bilekteki burkulma kalktı.

## 12. Eklem sisteminin gözden geçirilmesi (6 Eki 2026, 16:45 isteği)

**İstek (Sabri):**
- El ve kol bağlantıları: içe geçme, ters dönme, kolun gövdeye girmesi.
- Şortun üstü yırtık gibi; daha gerçekçi ve esnek olsun.
- Omuzlar çok az geniş.
- Bütün hareketleri çalıştır, tek tek incele, planla ve yap.

**Yöntem: önce ölçüm aracı.** `mockup-3b-pafta.html`:
- 17 hareket × 3 an × 2 açı (kendi açısı + arkadan) tek sayfada.
- Altta her an için ölçüm: dirsek gövde itmesi (cm) · el-el aralığı · bilek açısı (parmak yönü ile ön kol arası) · avuç·hedef uyumu (cos) · kavradı mı.
- Kötü değerler mercan renkle işaretli.
- Ayrıca `mockup-3b-stil.html?h=…&p=2&t=…&aci=θ,φ` ile sabit an ve açıdan yakın çekim.

**Bulunan kökler ve yapılanlar:**

| Kusur | Kök (ölçüm) | Düzeltme |
|---|---|---|
| Avuç ters, eller içe geçiyor | Avuç yönü sezgiyle seçiliyordu; avuç·hedef 0,07 (eğik pres), −0,13 (lat çekişi) | Anatomik avuç modeli: hareket başına tanım (`ic` · `ayak` · `ileri` · `onKolOn` = supinasyon · `onKolArka` = pronasyon). Ön kolun ön yüzü, üst kolun tersinin ön kola dik bileşeni; kol düzken biceps tarafı. Belirsizse (\|cos\| < 0,25) önceki kare. → **Avuç·hedef her harekette ≥ 0,5** (eğik pres 0,07 → 1,00) |
| Preslerde bilek doğal değil | Parmaklar ön kolu düz sürdürüyordu; gerçek elde bar avuç kökünde, bilek geride | Avuç hedefe doğru en çok 35° dönebilir (bar ekseni çevresinde = bileğin büküm ekseni) |
| Kol gövdeye giriyor | Model gövdesi mankenden geniş; IK dirseği mankenin genişliğine koyuyor | Gövde kesiti **modelden ölçülüyor** (omurga ağırlıklı köşeler); dirsek elips kesitin + 4,8 cm kol yarıçapının dışına itiliyor. Ölçüm: curl 4,5 cm · V-bar itme 3,6 cm · ön kaldırış 1,9 cm itildi |
| Şortun üstü tırtıklı | Kesim üçgen sınırından yapılıyordu | Banda değen her üçgen alınıyor, dışarıda kalan köşeler bel ve paça düzlemine oturtuluyor → düz kenar. Üst 3 cm'de lastik bant (+4 mm) |
| Omuzlar | — | Deltoid bölgesi 1,2 cm dışa (kademeli) |

**⚠️ Kalan kusurlar: VERİDE, prototipte çözülemez** (uygulamanın `hareketler3d.js`'ine ve fizik denetimine dokunur → onay gerekir):

1. **V tutamaç geometrisi gerçek değil.** Önden görülen küçük bir eşkenar dörtgen; kulplar yan eksene yatık. Gerçek kapalı tutamacın kulpları öne-arkaya paraleldir, avuçlar birbirine bakar. Kulp aralığı 12 cm, modelin gerçek boyutlu elleri için dar.
   → Lat çekişi, oturarak kürek ve V-bar itmede bilek 84–106°, eller çaprazlanıyor.
2. **Leg press tutamakları** önkolla neredeyse aynı eksende; bilek 92°.
3. **Veri modeli eksikleri** (B'ye geçişin asıl işi):
   - Her kavrama için **avuç yönü** (bugün prototipte elle tablo).
   - **Gövdenin önü** açıkça (bugün g × yan'dan türüyor, sırtüstünde ters).
   - Mankenin **segment boyları** modelin oranlarına (bugün segmentler uzatılıp kısaltılıyor).
   - **Fizik denetimi** el için "avuç merkezi" ve gövde kesiti ile yeniden kurulmalı.

### 12.1 İkinci tur (6 Eki, 17:21): kolların gövdeye girmesinin asıl kökü

- **Ölçüm:** Model omuz eklemleri **±21,2 cm**, hareket verisinin omuzları **±14 cm**. Göğüs yarı eni 1,40 m'de 19,3 cm, mankenin göğüs elipsinde 14,6 cm. Derinlik ise yakın (12,8 ↔ 12,5).
  → Veri omuzu içeri çekiyor, modelin geniş göğsü ve kanatları kolun yolunda kalıyordu. Önceki turdaki "dirseği dışarı it" yalnız belirtiyi hedefliyordu.
- **Düzeltme:** Gövde kemikleri yan eksende ×0,8 ölçekleniyor (göğüs 19,3 → 15,4 cm). Gövde kesiti de buna göre güncellendi.
  → Dirsek itmesi curl'de 4,5 → 1,0 cm, V-bar itmede 3,6 → 0,3 cm'ye indi: kol artık doğal olarak gövdenin dışında.
- **Bilek sınırı:** Parmak yönü ile ön kol arası en çok 55°. Aşılırsa el, avuç bara oturmuş kalacak şekilde ön kola döndürülüyor.
  → Lat çekişi 84–101° → 49–50° · oturarak kürek 98–106° → 49–53° · leg press 92° → 48°.
- **Şort:**
  - Bel bandı gövdeyi 2 mm ile sarıyor; paça bolluğu 32 → 20 mm.
  - Yumuşatmadan sonra her köşe, gövdedeki eşinin normali boyunca en az 2 mm dışarıda kalmaya zorlanıyor. Yumuşatma içbükey yerlerde kumaşı gövdenin içine çekiyordu; "kalça şortun dışına çıkmış" bulgusunun kökü buydu.
- **Kalan:** V tutamaç ve leg press tutamak geometrisi (veri). Bilek sınıra dayandığı yerlerde el bara tam dik oturmuyor.

### 12.2 Paralel araştırmalar (başlatıldı)
1. Oyun/animasyon endüstrisi teknikleri (retargeting, full-body IK, eklem sınırları, çarpışma, giysi altı gövde gizleme) + three.js'te lisansı uygun kütüphaneler.
2. Salon aletlerinin gerçek ölçüleri ve tutamaç geometrisi + alet veri modeli önerisi.
3. Giysi ve aksesuar (gözlük, saat) giydirme sistemleri, kıyafet üretim algoritmaları, lisanslı kaynaklar.

## 13. Birleşik yol haritası (6 Eki 2026) — üç araştırma + prototip

Araştırmalar:
- `docs/2026-10-06-arastirma-1-animasyon-teknikleri.md`
- `docs/2026-10-06-arastirma-2-giysi-aksesuar.md`
- `docs/2026-10-06-arastirma-3-salon-aletleri.md`

### 13.1 Ana sonuç
Prototipteki kusurların çoğu "giydirmede" değil **verinin kendisinde**:
1. **Manken oranları gerçek değil.** Omuz aralığı 280 mm; gerçekte akromiyon 415, deltoid 509. Kol boyları modelden ×1,2 farklı.
2. **Aletler gerçek değil.** V tutamaç iki ayrı aletin (kürek ↔ triceps) yerine geçen tek bir eşkenar dörtgen; kulplarda avuç yönü bilgisi yok.
3. **Gövdenin önü ve avuç yönü veride açık değil.**

Prototip bunları ince ayarlarla örtüyor (gövdeyi %80'e daraltma, avuç tablosu, bilek kırpma). Kalıcı çözüm, endüstri standardını **verinin içine** koymak.

### 13.2 Önerilen yol (B'ye geçiş) — her faz kendi onayıyla

| Faz | İş | Çözdüğü | Tahmin |
|---|---|---|---|
| **B0** | Gövde kaynağını netleştir: MakeHuman/MPFB2 (CC0) gövde. Blender kurulumu + yüzsüz/sevimli düzenleme. Ya da Quaternius'a lisans sorusu | ⚠️ Lisans riski | 1–2 gün |
| **B1** | Veri modeli v2: mankenin oranları = gövdenin oranları (antropometri tablosu) · gövde önü açık · kulp = konum + eksen + avuç normali · pivot · oturak/sırt/ayak çapaları | Oranlar, avuç, bilek | 3–5 gün |
| **B2** | Aletler yeniden: gerçek ölçüler (IWF bar, altıgen dambıl tablosu, IPF bench, lat, kürek V-tutamacı, triceps V-bar, ip, leg press, eğik pres, pec deck) · premium malzemeler · jenerik biçim dili | Gerçekçi aletler, V-bar | 1–2 hafta |
| **B3** | Eklem sistemi: swing-twist sınırları · burkulmanın ön kola dağıtılması · tutuş pozları (tam/nötr/kanca) · gövde kapsülleri + itme ("temas > çarpışma") | Bilek, kolun gövdeye girmesi | 1 hafta |
| **B4** | Fizik denetimi v2: avuç merkezi bar teması · kapsül batma ≤ X mm · eklem sınırı aşımı · giysiden görünme = 0 · pafta (`mockup-3b-pafta.html`) kalıcı araç olur | Doğruluk ağı | 3–5 gün |
| **B5** | Giysi sistemi: gövde bölge maskesi (bit maskesi) · şort/tişört/ayakkabı GLB'leri (MPFB CC0 ya da Blender) · soketler (saat, gözlük) · otomatik poz testi | Şortun taşması, aksesuarlar | 1–2 hafta |
| **B6** | 17 hareketi yeni sisteme taşı · Sabri'nin canlı turu · uygulamaya entegrasyon (three.js alt kümesi, boyut bütçesi, SVG yedeği) | Ürün | 1–2 hafta |

**Sıra gerekçesi:**
- B0 olmadan gövdeye yatırım yapmak, lisansı belirsiz bir varlığa yatırım yapmak olur.
- B1, B2–B5'in hepsinin dayandığı veri temeli.
- B3 ve B4 birlikte yürür: her eklem kuralı kendi denetimiyle gelir. Projenin dersi: *sıfır sonuç körlük de olabilir.*

**Kapsam dışı (araştırmaya göre önerilmiyor):** kumaş simülasyonu · fizik tabanlı ya da yapay zekâlı karakter kontrolü · SMPL tabanlı videodan mocap (ticari lisans gerekir) · hazır avatar platformları.

**Bu bir mimari değişiklik.** Uygulamanın `hareketler3d.js`'ini, `manken3d.js`'ini ve fizik denetimini değiştirir. Onaydan sonra B0–B1 için yazılı spec ve uygulama planı hazırlanır.

### 13.3 Telefon uygunluğu, bağımlılık, lisans (ölçüm, 6 Eki)

**Boyut (gzip):**
- Bugün three.js alt kümesi 135 KB.
- Prototipin ekledikleri:
  - GLTFLoader 26 KB (three.js'in parçası, MIT).
  - Gövde geometrisi 303 KB.
  - Normal haritası 4,25 MB PNG. Kas kabartmasını %18'e indirdiğimiz için 1024 px WebP'de **63 KB** yetiyor, ya da hiç kullanılmayabilir.
  - Aletler prosedürel: **0 bayt.**
  - Giysi başına tahmin 100–400 KB (ölçülmedi).
- **Tahmini toplam ek indirme: ~0,4–0,6 MB, bir kez.** Service worker önbelleğe alır, çevrimdışı çalışır.

**Kare süresi** (bu dizüstü, Intel UHD, 786 × 982 piksel, lat çekişi, 120 kare ortalaması):

| Çizici | ms/kare | Üçgen | Çizim çağrısı |
|---|---|---|---|
| Bugün | 2,1 | 54 bin | 150 |
| A | 17,7 | 194 bin | 154 |
| B | 12,6 | 113 bin | 98 |

- 60 kare/sn için bütçe 16,7 ms. Telefon ölçülmedi.
- A ve B'yi pahalı yapan: 2048 px yumuşak (VSM) gölge + fiziksel malzeme (sheen) + yüksek çözünürlüklü küreler.
- **Hedef:** B ≤ 6 ms. Araçlar: 1024 px gölge ya da fırınlanmış temas gölgesi, `MeshStandardMaterial`, piksel oranı ≤ 1,5, alet geometrisinde daha az parça.
- Sonra **Sabri'nin telefonunda** ölçülecek.
- Not: uygulama 6 tekrar (~18 sn) oynatıp duruyor; sürekli çizim yok.

**Bağımlılık:** Çalışma anında yalnız three.js (MIT) — bugünkü tek istisna. GLTFLoader ve meshopt çözücüsü three.js paketinin parçası (MIT). Blender ve MPFB yalnız üretim aracı; GPL araç çıktıya bulaşmaz. **Yeni çalışma-zamanı bağımlılığı yok.**

**Lisans:**
- three.js MIT · gövde MPFB2 sistem varlığı CC0 (B0'da kesinleşir) · aletler ve motor kendi kodumuz · giysiler CC0 ya da kendi üretimimiz · ölçüler olgu (telif yok).
- ⚠️ Kalan iki risk: (1) Quaternius gövdesi ürüne girerse (QAL çelişkisi) → B0 bunu ortadan kaldırır; (2) marka/tasarım kopyası → jenerik biçim kuralı.

## 14. B0 uygulandı + B/C paralel (6 Eki 2026, akşam)

**Araç kurulumu** (Sabri onayı; FitSet deposunun DIŞINDA, `C:\Users\Sabri\Tools\blender\`):
- Blender **4.5.14 LTS**, taşınabilir zip (399 MB).
  - Resmî sha256 birebir tuttu.
  - `portable/` klasörü sayesinde ayarlar AppData'ya yazılmıyor.
- **MPFB 2.0.17**: extensions.blender.org, sha256 indirme bağlantısıyla aynı.
- Varlık lisansı **CC0 1.0** (birincil kaynak `LICENSE.ASSETS.md` kopyası ve sha256'sı yanında).

**Gövde üreticisi:** `tools/govde-uret/govde_uret.py`, ekransız Blender betiği.
- Makro değerler: erkek · 25 yaş · kas 0,62 · ağırlık 0,48 · oran 0,65 · boy 0,55.
- Üretim: game_engine iskeleti → hedefler pişirilir → yardımcı geometri silinir → malzemesiz GLB.
- Çıktının yanına künye (`govde.json`) yazılır.
- Sonuç: **178,4 cm · 53 kemik · 26 756 üçgen · 0,93 MB**.
- ⚠️ **Bulunan kusur:** MPFB'nin `feet_on_ground=True` ayarı gövdeyi zemine taşıyıp dönüşümü uyguluyor, iskelet ise eski koordinatlara oturuyor. Kemikler gövdeden 0,85 m aşağıda kaldı ve hareketlerde deri "patladı".
  - Ölçüm aracım bunu ilk denemede göremedi: dinlenme testi, kemiği kendi bağlama matrisinin tersine koyduğu için totolojikti.
  - → `feet_on_ground=False` kullanılıyor; zemine hizalama yükleyicide yapılıyor (geometri ve bağlama matrisleri birlikte). Künyeye denetim alanı eklendi: ayak bileği −0,749 · taban −0,819.

**Yükleyici genelleştirildi** (`govde.js`): iki gövdeyle de çalışıyor.
- El dinlenme çerçevesi (parmak yönü, avuç normali, kıvırma ekseni) **modelden ölçülüyor**.
- Şort sınırları eklem yüksekliklerinden türüyor.
- Gövde en ölçeği C'de ölçümle seçiliyor.
- Kemik adlarında büyük/küçük harf toleransı var.
- Quaternius'a özel yumuşatma yalnız B'de çalışıyor.

**Prototip artık dört panel:** Bugün · A · **B (Quaternius, Sabri'nin sevdiği)** · **C (MakeHuman, CC0)**. Pafta `?govde=B|C` alıyor.
- Sabri (6 Eki 18:15–18:19): *"B'deki gelişmeler kaybolmasın; C'ye devam ederken B'yi de geliştirelim."*
- Motor ortak: her eklem ve bilek iyileştirmesi iki gövdeye aynı anda gidiyor.

**Anatomik bilek sınırı** (her yöne eşit 55° koninin yerine):
- Fleksiyon/ekstansiyon ve radyal/ulnar sapma ön kol çerçevesinde ayrı ölçülüyor.
- Sınırlar: fleksiyon 70° · ekstansiyon 60° · radyal 20° · ulnar 30°.
- Son %30'da yumuşak sıkıştırma (`tanh`) var, sınırda sıçrama yok.
- Pafta ölçümü (B): bütün değerler aralık içinde.
- Sınıra dayananlar ve sebepleri:
  - Oturarak kürek ve lat çekişinin sonu (−60 / +70), leg press (−60): **tutamaç verisi** (Araştırma 3, B2 fazı).
  - Triceps V-bar (ulnar −30): **V-bar geometrisi**.

⚠️ **B'nin ürüne girmesi:** Quaternius QAL çelişkisi çözülmeden olamaz (yazılı soru ya da C). Prototipte serbestçe gelişebilir.

### 14.1 Beşinci inceleme (6 Eki, 18:28) — B başparmak, C kol/el

**Sabri:** B'nin başparmakları ters; C'nin kolları ve elleri çok kötü. *"Görselleri sen aç, hareketleri tek tek kontrol et; doğal ve sorunsuz olana kadar iyileştir."*

**Kökler (hepsi ölçüldü):**

| Kusur | Kök | Düzeltme |
|---|---|---|
| C kolu burkuluyor | Ön kolun dinlenme yönü üst kolunkiyle aynı varsayılmıştı. MakeHuman A-pozunda dirsek bükük (B'nin T-pozunda görünmüyordu). Baldır için de aynısı | Ön kol ve baldır kendi dinlenme yönlerinden döndürülüyor |
| C parmakları geriye yay çiziyor | ⚠️ **Üretici kusuru:** `detailed_helpers=False` iken iskelet eklem yardımcılarını bulamıyor, parmak kemikleri geometrinin **~2 cm gerisine** oturuyor (kemik 10,2 ↔ geometri 12,1 cm) | `detailed_helpers=True` → kemik 11,5 ↔ geometri 11,5. Künyede yeni denetim alanı: orta parmak segmenti |
| Parmaklar bara oturmuyor | Sabit kıvırma açıları (50/75/55°) gövdeye ve bar kalınlığına göre değişmiyor | **Sargı çözücüsü:** her eklem, sonraki eklem bar yüzeyine değene kadar kıvrılır. Bar avuç çizgisinde (kökün 2,5 cm gerisi) ve 15° çapraz (güç kavraması) |
| Başparmak ters / dik | Yanlış eksen; sonra da bükülme ekseninin işareti modelden modele değişiyordu | 4 serbestlikli ızgara araması (açılma + 3 eklem, iki yönde): uç → işaret parmağının orta boğumu, bara girme cezası |
| Kalın direkte parmaklar havada | Kavrama tek bar kalınlığına (Ø29) göreydi; el IK noktasında, direk 5 cm yandaydı | Kavrama pozu tutamağın **kendi yarıçapına** göre (önbellekli); el tutamağın **eksenine** oturur |
| Şorta el parmakları dahil | A-pozda eller kalça hizasında sarkıyor | Şort yalnız gövde/bacak kemiklerine bağlı köşelerden |
| Radyal sapma ölçümü yanlı | Çapraz eksen parmağa dik değildi (B'de 22°) | Ölçülen dik çerçeve kullanılıyor |

**Kapalı tutuş tutamacı (prototip veri ayarı, `tools/proto-stil/hareket-ayar.js`; uygulama verisine dokunulmadı):**
- Lat çekişi ve oturarak kürek: **paralel kulplar** (eksenler arası 14 cm, Ø32), avuçlar karşılıklı, D halkalı. Önce eğik V çubuklar, 10–12 cm aralık vardı.
- Triceps V-bar: eller 5 cm dışa, kol elin dışına uzar.
- Ölçüm (t = 0,5): bilek lat −18° · kürek −44° · V-bar −42° (önce −60, sınıra dayanıyordu). Parmak ucu–tutamak ≤ 2,6 cm.
- "Bugün" paneli uygulamanın KENDİ verisini çizmeye devam ediyor.

**Ölçüm araçları (kalıcı):**
- `mockup-3b-el.html`: her hareketin elini 4 açıdan yakın çekimle gösterir + kavrama ölçümü.
- `govde.kavramaOlc()`: parmak ucu ile tutamak ekseni arası mesafe (cm).
- ⚠️ **Araç tuzağı:** 8192 piksel üstü tam sayfa ekran görüntüsü GPU doku sınırında yinelenen içerik veriyor. Pafta yüksek çözünürlükte iki parçada çekiliyor.

**Süreklilik denetimi** (17 hareket × 2 gövde × 42 kare; bir karede elin en büyük dönüşü · parmak–tutamak mesafesi · bilek sınır aşımı):
- İlk koşum iki harekette **tek karede 180° ters dönme** yakaladı: baş üstü triceps ve kablo curl. Sabri'nin "bilek hareket ortasında başka yöne dönüyor" bulgusu buydu.
  - Kök: ön kolun "ön yüzü" üst kolun tersinden türüyordu. Kol düzleşince bu yön sıfıra iniyor, işareti gürültüyle dönüyordu.
  - → Yön IK kutbundan alınıyor. Avuç tarafı ilk karede anatomik tanımdan bir kez seçiliyor, sonra önceki kareye en yakın olan korunuyor.
- **Son sonuç:** en büyük kare-kare el dönüşü ≤ 19° (akıcı) · parmak ucu–tutamak ≤ 4 cm (leg press topuzu en yüksek) · bilek sınır aşımı **0**. İki gövdede de.
- Görsel kontrol: cable curl avuç yukarı (supinasyon) ✓ · baş üstü triceps sapı kavrıyor ✓.

**Kalan, prototipte çözülmeyen:**
- Leg press tutamağı topuz biçiminde; gerçek yan tutamak araştırma 3'te.
- Kapalı tutuş ve V-bar düzeltmesi yalnız prototip verisinde (uygulama verisi B2'de).
- "Bugün" paneli hâlâ eski V tutamacı gösteriyor.

### 14.2 Altıncı inceleme (6 Eki, 20:35–21:02)

- **Parmaklar bitişik:** MakeHuman'ın dinlenme pozunda parmaklar yelpaze gibi açık. Kıvırmadan önce her parmak avuç normali ekseninde orta parmağa paralel döndürülüyor; başparmak ayrı.
- **C biraz daha kaslı ve geniş omuzlu:** kas 0,62 → 0,68, `measure-shoulder-dist-incr` 0,35, `torso-vshape-incr` 0,2 (üretici künyesinde).
- **Kollar gövdeye yanlış yerden bağlanıyordu:**
  - Kök: veride omuz yarı eni 14 cm, kol 31 + 29 cm. Modellerde omuz 21,2 cm, kol 25–26 + 24–27 cm. Gövde %80'e daraltılıp köprücük ve kol veriye doğru uzatılıyordu.
  - Düzeltme: **omuz modelin yerinde, kol kendi boyuyla** IK'yla hedefe uzanıyor. Ulaşamazsa kürek kemiği en çok 6 cm kayıyor (ölçüldü: en çok 4,8 cm). **Kol uzatma hiçbir harekette gerekmedi.** Gövde daraltma kaldırıldı.
  - Omuz deri ağırlıkları omuz ekleminin 11 cm çevresinde yumuşatıldı; omuz başındaki katlanma ve kırık kalktı.
- **Üst kol büküm yönü modelden:** Dirsek→el doğrultusunun üst kola dik bileşeninden türüyor; kol düzken önceki kare korunuyor. Verinin IK kutbu baş üstü triceps'te kola paralel olduğu için üst kol 150–170° burkuluyordu.
- **Çift dambıl kürek:**
  - Tepe noktası 8 cm'den 21 cm'ye çekildi (omuz ekstansiyonu ~63° → ~35°); prototip ayarı.
  - Şortun altından gövde taşması **giysi altı gövde gizlemeyle** çözüldü: kumaşın altında kalan gövde yüzeyi çizilmiyor, sınır kenarlardan 2,5 cm içeride.
- **Bel lastiği:** 3,5 cm şerit, kumaştan en çok 2,5 mm dışarıda, kenarları yuvarlak, bir ton koyu ve hafif parlak. Aynı iskelete bağlı, belle birlikte esner.

**Doğrulama:**
- 17 hareket × **4 açı** (0/90/180/270°) × 3 an, B ve C için pafta (`?acilar=0,90,180,270`). Hepsi gözle incelendi: yön, kol bağlantısı, eller ve bacaklar doğru.
- Süreklilik: C'de en büyük kare-kare el dönüşü ≤ 15° · B'de baş üstü triceps tek karede 39° (diğerleri ≤ 15°) · bilek sınır aşımı 0 · parmak–tutamak ≤ 3,4 cm.

### 14.3 Yedinci inceleme (6 Eki, 21:17) — 17 görüntü, yakın çekimle tek tek analiz (KOD DEĞİŞMEDİ)

**Yöntem:**
- `mockup-3b-el.html` genişletildi: `odak` (omA · kalca · aA · eA · eB) · `r` (çekim yarıçapı) · `fi` · `acilar`.
- Her görüntünün hareketi C'de 4 açıdan yakın çekildi; ayak için B de çekildi.

| # | Görüntü / hareket | Gözlem (yakın çekimle doğrulandı) | Kök (kanıt düzeyi) |
|---|---|---|---|
| 1 | **Barı tutan eller** (bench, eğik pres, ön kaldırış, direk) | Parmaklar arasında 1–3 cm boşluk; serçe parmak ayrı; bazı parmak uçları barın içinde | **Kesin:** El çerçevesindeki "sanal bar" avuç içinde **15° çapraz** (bir önceki turda eklediğim güç kavraması), ama el gerçek bara bu açı hesaba katılmadan oturtuluyor → parmaklar gerçek bara 15° eğik sarılıyor: işaret parmağı bara yakın, serçe uzak |
| 2 | **Calf raise'de direği tutan el** (görüntü 1–4) | Gövde 8 cm yükselirken el direkte aynı noktada, ama elin açısı ön kolla birlikte değişiyor → el direğin içinde dönüyor, bilek bükülmüyor | **Kesin (veri ölçüldü):** el sabit (19, 112, 32), dirsek 115,8 → 124,2. El yönü her karede **ön kol yönünden** türüyor. Gerçekte el nesneye kilitli kalır, farkı bilek karşılar |
| 3 | **Calf raise'de ayaklar** (görüntü 2) | Parmak ucuna kalkarken ayak tek parça dönüyor, ayak parmakları platformun **içine giriyor**; B'de de aynı | **Kesin:** ayak parmağı kemiği (`ball`) ayakla aynı matrisi alıyor; parmak eklemi bükülmüyor |
| 4 | **Boştaki el** (calf raise, triceps) | Parmaklar gergin, yelpaze gibi açık | **Kesin:** kavrama pozu yalnız tutan ele; boştaki el model dinlenme pozunda |
| 5 | **Kollar yukarıda — koltuk altı** (omuz presi tepe, lat çekişi başı, baş üstü triceps; görüntü 5, 11, 12) | Koltuk altında soluk, düz bir kama; kol gövdeye takılmış boru gibi; omuz kası kayboluyor; arkada keskin çentik | **Olası:** son turdaki omuz deri ağırlığı yumuşatması (11 cm) + doğrusal deri bağlama. Kol kalkınca bölge gerilip düzleşiyor. Düzeltici şekil yok |
| 6 | **Kollar yanda — omuz başı** (omuz presi altı, ters kelebek; görüntü 8, 10) | Omuz ucunda basamak / sivri köşe; arkada düz yüzeyler | **Olası:** deltoid +1,2 cm genişletme + Blender'daki `shoulder-dist` + `vshape` hedefleri üst üste binmiş |
| 7 | **Omuz presi üstten** (görüntü 13) | Trapez kambur gibi yüksek, omuzlar blok | Aynı (6) + kas 0,68 |
| 8 | **Eğik pres makinesi** (görüntü 14, 15) | Üst kol göğsün önünden çıkıyor gibi; omuzda soluk dikdörtgen leke | **Olası:** (5)–(6) ile aynı aile. Bu harekette omuz kayması 0 ölçüldü, kürek kemiği kuralı sorumlu değil |
| 9 | **Kürek — kalça arası** (görüntü 16, 17) | Kalça yarığında açık renkli dikey leke | **Olası, güçlü:** şort kumaşı yarığın içine kadar gövdeyi izliyor, eğilince katlanıyor ve **kumaşın iç yüzü** (çift yüzlü malzeme) görünüyor. Gövde gizlendiği için arkada gövde yok. Gerçek şort yarığın üstünden **köprü** geçer |
| 10 | **Oturuşta paçalar** (görüntü 6) | Paça ağızlarında parlak halkalar, uyluk şortun içinden geçiyor gibi | Aynı mekanizma: paça ağzından iç yüz görünüyor (parlak sheen) |
| 11 | **Bel lastiği** (görüntü 1, 14, 15 ve yakın çekimler) | Açık renkli yamalar, kopuk dikdörtgenler | **Kesin:** lastik yalnız tamamı bantta kalan üçgenlerden kesiliyor (tırtıklı kenar) ve kenarda kumaştan yalnız 1,5 mm dışarıda (üst üste binme titreşimi) |
| 12 | **Oturuşta kalça** (görüntü 7) | Şort yanlara balon gibi taşıyor | **Olası:** 12 mm bolluk + oturakta yayılan kalça |

**Önerilen düzeltmeler (onay bekliyor):**
- **(1)** Sanal barı gerçek bar eksenine hizala (eli 15° çapraz eksen üzerinden oturt).
- **(2)** El **nesneye kilitli**: tutuşun ilk karesinde el, nesnenin yerel çerçevesinde saklanır, sonraki karelerde o çerçeveden kurulur; farkı bilek karşılar (anatomik sınırla).
- **(3)** Parmak eklemi: ayak parmakları zemine/platforma paralel kalacak şekilde `ball` kemiği ayrı döner.
- **(4)** Boştaki el için hafif kıvrık dinlenme pozu.
- **(5)–(8)** Omuz: genişletme ve yumuşatmayı geri al ve ölç; omuz kalkışına göre düzeltici yaklaşım (kol kaldırma açısına bağlı deltoid/koltuk altı şekli).
- **(9)–(12)** Şort:
  - Kumaşın iç yüzü koyu ve mat (görünse bile parlamasın).
  - Kalça yarığında kumaş **köprü** geçer (yarığa girmez).
  - Lastik şortun kendi yüzeyinden düzgün şerit (kenar dikişi düz), kumaştan sabit 3 mm dışarı.
  - Oturuşta bolluk azalır.

### 14.4 Düzeltmeler (6 Eki, 21:32 "başla")

| # | Sorun | Yapılan | Sonuç |
|---|---|---|---|
| 1 | Bardaki parmaklar ayrık | El, avuçtaki sanal barın 15° çapraz ekseni gerçek bara oturacak biçimde döner | 4 parmak bitişik; parmak ucu–bar ≤ 1 cm (bench, eğik pres, ön kaldırış) |
| 2 | Calf raise'de el direkte dönüyor | Sabit nesnede **el kilidi**: ilk karedeki duruş korunur, fark bilekte | Kilit 21/21 karede açık; bilek fleksiyonu 21° → 14° (bilek çalışıyor) |
| 3 | Boştaki el gergin | Dinlenen el: parmaklar bitişik ve hafif kıvrık (B 30–38°, C 14–22°), başparmak avuca 25° | Görselle doğrulandı |
| 4 | Ayak parmakları platforma giriyor | Ayak parmağı eklemi yere paralel kalacak şekilde bükülür (≤ 65°) | Calf raise tepesinde 65°, parmaklar platformun üstünde |
| 5 | Koltuk altı düzleşmesi | **Skapulohumeral ritim:** kol 70° üstüne kalkınca omuz köprücük etrafında yükselir (kol kalkışının 1/3'ü, ≤ 22°) | Kollar yukarıdayken koltuk altı ve omuz doğallaştı |
| 6–7 | Omuz basamağı, trapez | Ritim eşiği 30° → 70° (ilk denemede kollar yandayken trapez kabarıyordu) | Kollar yandayken omuz düzgün |
| 9 | Kalça yarığında leke | Kumaş yarığa girmez, kalça tepeleri arasında **köprü** geçer | Leke yok |
| 10 | Paçada parlak halka | Kumaşın **iç yüzü** koyu ve mat | Yok |
| 11 | Lastik yamalı | Lastik banda değen her üçgenden, alt kenar düzleme oturtulmuş; şorttan 2–3,5 mm dışarı; çizim ofseti (titreşmez); şortun kendi bel kabartısı kaldırıldı | Düz, kesintisiz şerit |
| 12 | Oturuşta balon | Bolluk 12 → 9 mm | Daha az taşkın |

**Çürüyen hipotezler (A/B ile ölçüldü):**
- **Omuz deri ağırlık yumuşatması koltuk altına etkisizdi**: açık ve kapalı görüntüler birebir aynı → kapatıldı.
- **Göğüs ağırlığını köprücüğe aktarmak** lat çekişi tepesindeki göğüs düzlüğünü değiştirmedi → kapalı.
- ⚠️ **Ölçüm aracı hatası:** üst kol burulması önce dünyaya göre ölçülüyordu; gövdenin 90° yönü karışıp 160–180° gösteriyordu. Gövdeye göre düzeltilince C'de lat çekişinde ≤ 45°. Yani göğüs düzlüğünün kökü burulma da değil.

**Kalan, açık:**
- Lat çekişinin tepesinde göğüs düzlüğü. Olası kök: C ağının çözünürlüğü (26 bin üçgen) + doğrusal deri bağlamanın baş üstü kolda göğsü germesi. Çare adayları: Blender'da 1 seviye alt bölüm + seyreltme, ya da kola bağlı düzeltici şekil.
- B'de baş üstü triceps'te tek karelik 43° el dönüşü (C'de 10°).

**Doğrulama:** 17 hareket × 4 açı × 3 an, B ve C (pafta) · süreklilik: bilek sınır aşımı 0, el dönüşü ≤ 17° (B triceps hariç), parmak–tutamak ≤ 4 cm.

### 14.5 Sekizinci inceleme (7 Eki, 11:08) — omuz/kol bağlantısı, dirsek, şekil

**İstek:** C'nin omuzları çok az daha dar, pazılar çok az daha kalın. Kol hareket ettikçe omuz–kol bağlantısı inceliyor, dirsekten kırılma bazı yerlerde yanlış.

**Ölçüm** (kesit yarıçapı, dinlenmeye göre; yeni araç `deriKonum()`, ekran kartındaki derinin işlemci kopyası):

| | Doğrusal deri (önce) | + DQS | + DQS + deltoid düzeltmesi |
|---|---|---|---|
| Omuz eklemi, en kötü (ters kelebek sonu, omuz presi) | %78–83 | %84–99 | **%97–114** (cable curl B %84) |
| Dirsek, en kötü (curl tepesi, pres altı) | %66–77 | %72–92 | %72–92 |

**Yapılanlar:**
- **Şekil:** `measure-shoulder-dist-incr` 0,35 → 0,18 · `l/r-upperarm-muscle-incr` 0,35 (üretici künyesinde).
- **Çift kuaterniyonlu deri bağlama (DQS):** yalnız kol, el ve parmak kemiklerinde; köşe başına karışım = kol ağırlıkları toplamı. Bütün kemiklerin DQ'su hesaplanıyor. Uniform ölçek K ön çarpan olarak; öteleme eklem noktasında birebir.
  - Bacaklar veriye göre uzatıldığı için doğrusal kaldı.
  - ⚠️ İlk sürüm yalnız kol kemiklerinin DQ'sunu hesaplıyordu; omuz köşeleri köprücük ve omurgayı "kimlik" sanıp %200 şişti. Ölçümle yakalandı.
- **Deltoid düzeltmesi (pozla tetiklenen):** Kol 35°'nin üstüne kalktıkça omuz eklemi çevresindeki köşeler üst kol ekseninden dışarı kabarır (en çok 2,2 cm, 125°'de).
  - Gerekçe: DQS hacmi ölçümde artırdı ama **gözle fark edilmedi** (yan yana A/B). Görünen incelme hacim kaybından çok, aşağıda dinlenen A-poz modelde deltoidin kol kalkınca kabarmamasıydı.
  - ⚠️ İlk sürüm yarıçapla da süzüyordu, yalnız 298 köşeyi etkiledi ve görünmedi; süzgeç kaldırıldı.
- **Şort iç yüzü:** 0,28 → 0,62 ton (oturuşta paça ağzında koyu halka görünüyordu).

⚠️ **Ölçüm aracı tuzakları (3):**
1. Dinlenme ve hareket farklı birimdeydi (m ↔ cm) → yüzdeler 100 kat çıktı.
2. `applyBoneTransform` yalnız doğrusal deriyi bilir → DQS etkisi görünmedi; işlemci kopyası yazıldı.
3. Dinlenmede DQS'nin K ön çarpanı yanlış → dinlenme DQS kapalıyken ölçülüyor.

Ayrıca: yerel sunucu iki kez kapanmıştı; artık PowerShell ile bağımsız süreç olarak çalışıyor.

**Doğrulama:** C ve B, 17 hareket × 4 açı × 3 an — yön, kol bağlantısı, eller, bacaklar ve şort doğru.

**Kalan:**
- Dirsek tam bükülmede hâlâ %72 (C curl).
- Lat çekişi tepesinde göğüs düzlüğü (§14.4).

## 15. B kaldırıldı — yön: C (7 Eki 2026, 11:51)

**Karar (Sabri):** B (Quaternius) tamamen kaldırıldı. A korunur (kayıtları ve kodu kalır, karşılaştırma için). **Tüm geliştirme C üzerinden.**

**Yapılan:**
- `tools/proto-stil/govde/` (Quaternius dosyaları) silindi. Bu depo public olduğu için QAL lisanslı dosyalar zaten girmemeliydi; artık yok.
- `govde.js`: B'ye özel dallar silindi (Taubin yumuşatma, T-poz el yönü, B parmak açıları, gövde daraltma). Varsayılan gövde `C`.
- `mockup-3b-stil.html`: üç panel (Bugün · A · C). Pafta ve el sayfasında varsayılan `C`.

**A ve C zarar görmedi — kanıt:**
- C: 17 hareket × 4 açı × 3 an paftası, değişiklikten önceki görüntülerle **piksel piksel aynı** (5 parça, fark 0 piksel).
- A: `premium.js` ve `hareket-ayar.js` dokunulmadı (dosya tarihleri 5–6 Eki). Stil sayfası üç hareketle açıldı: A ve C çiziliyor, konsolda hata yok.
- Uygulama kodu (`js/`, `css/`, `sw.js`) değişmedi.

### 15.1 C telefonda ağır mı? (ölçüm, 7 Eki)

Bu dizüstü (Intel UHD), 786 × 982 piksel, lat çekişi, 120 kare, her kare GPU'nun bitmesi beklenerek (§13.3'ten daha katı yöntem; sayılar o tabloyla doğrudan kıyaslanmaz):

| Çizici | ms/kare | İşlemci payı | Üçgen | Çizim çağrısı |
|---|---|---|---|---|
| Bugün | 10,2 | 0,9 ms | 63 bin | 174 |
| A | 36,1 | 1,6 ms | 229 bin | 178 |
| C | 38,1 | 2,0 ms | 177 bin | 124 |
| C, gölgesiz | **12,5** | 1,1 ms | 105 bin | 68 |
| C, yarı çözünürlük | 35,9 | 1,2 ms | 177 bin | 124 |

- C'nin kendisi pahalı değil: işlemci payı 1–2 ms (iskelet, kavrama, DQS dahil). Gövde 27 bin üçgen.
- Maliyetin üçte ikisi **yumuşak gölge geçişi** (A ve C'de ortak). Gölge kapatılınca C, bugünkü çiziciye yakın.
- Çözünürlük düşürmek neredeyse bir şey değiştirmiyor → sorun piksel değil, gölge geçişinin geometri yükü.
- **Sonuç:** C ile devam etmek telefon açısından risk değil. Telefona girmeden önce gölge ucuzlatılacak (fırınlanmış temas gölgesi ya da düşük çözünürlüklü tek gölge) ve gerçek telefonda ölçülecek.

## 16. Dirsek ve omuz/koltuk altı (7 Eki 2026, öğleden sonra)

### 16.1 Dirsek
- **Ölçüm** (dirsek bölgesi, kemik çizgisine uzaklık, dinlenmeye oran): dış yüz hacmini koruyor (%99–101). Sıkışma **iç kıvrımda**.
- **Kök:** curl'ün tepesinde tutamak modelin omzuna çok yakın kalıyor, dirsek **154°** bükülüyordu (kaslı kolda etkin sınır ~145°). Ön kol pazının içine giriyordu.
- ⚠️ Eski "%72" ölçümüm yanıltıcıydı: üst kolun sonsuz eksenine uzaklığı ölçüyordu, bükülünce ön kol köşeleri o eksene yaklaştığı için düşük çıkıyordu.
- **Düzeltme:** dirsek 145°'yi aşacaksa omuz noktası el hedefinden uzağa en çok 4 cm kayar, yukarı kaymaz (curl'de "omuzlar geri ve aşağı"). Çözücü açıyı kavrama noktasına göre kurduğu için sınır 139° (ön kolda ~145°, ölçüldü).
- **Sonuç:** cable curl 154° → 146°, hammer curl 139° → 134°. Diğer hareketler değişmedi.

### 16.2 Omuz / koltuk altı (lat çekişi tepesi)
- **Ölçüm aracı:** komşusuyla ters dönen kenar sayısı (katlanma) + alanı 3 kattan fazla değişen üçgen.
- **Çürüyen hipotezler** (hepsi ölçüldü): DQS kapalı (aynı) · deltoid kapalı (aynı) · omuz ritmi kapalı (daha kötü) · ağırlık yumuşatma 33 → 32 · göğüs ağırlık aktarımı 33 → 37 · köprücüğe ağırlık aktarımı 33 → 40 · DQS'i köprücük/üst gövdeye genişletmek 33 → 26 ama omuz şişti (gerilen üçgen 76 → 142).
- **Seçilen: Delta Mush** (Mancewicz vd. 2014; Maya, Houdini, Unreal'de standart). Omuzların çevresinde (r ≤ 19 cm, 892 köşe grubu) bağlanmış deri yumuşatılır, dinlenmedeki ayrıntı yerel çerçevede geri eklenir. İşlemcide hesaplanır, küçük bir veri dokusuyla ekran kartına gider (tüm köşe dizisini her kare göndermek ~750 KB/kare olurdu).

| Hareket | Katlanma önce → sonra | Aşırı gerilme önce → sonra |
|---|---|---|
| Lat çekişi tepesi | 33 → 18 | 22 → 0 |
| Omuz presi | 6 → 0 | 76 → 15 |
| Baş üstü triceps | 18 → 10 | 37 → 5 |

- Maliyet: kare başına 1–3 ms işlemci (bu dizüstü).
- Kalan: lat çekişinin ön göğsü hâlâ biraz düz (katlanma değil, şekil).

### 16.3 Gölge lekesi (bulundu ve düzeltildi)
- Gölge three'nin standart derinlik malzemesiyle çiziliyordu; DQS, deltoid ve Delta Mush'ı bilmiyordu. Gölgeyi düzeltilmemiş deri atıyor, omuzda keskin kenarlı lekeler çıkıyordu (soluk hâli DQS/deltoid'den beri vardı).
- Düzeltme: deri gölgelendirici parçaları ortak; görünen malzeme ve gölge malzemesi aynı deriyi çiziyor (`customDepthMaterial`).

### 16.4 Yeni bulgu (düzeltilmedi)
- C'de **pazı vurgusu deltoide taşıyor** (biceps curl'de kırmızı omuzda). Önceden de vardı. Kök: vurgu üst kol kemiğinin tamamına bağlı. Çare adayı: vurguyu kol boyunca konuma göre sınırlamak.

**Doğrulama:** 17 hareket × 4 açı × 3 an — kırık duruş yok. Stil sayfası: A ve C çiziliyor, konsolda hata yok.
**A/B anahtarları** (`mockup-3b-el.html`): `mushyok` · `dirsekyok` · `ritimyok` · `dqyok` · `deltyok`. Yeni: `odak=kemik:<ad>` (modelin kendi kemiğine odaklanır).

## 17. Şort arkası · pazı vurgusu · omuz · ten rengi (7 Eki 2026, akşam)

**Şort arkası** (Sabri: "şortun arkası yırtık gibi, arkadan bir nesne çıkıyor" + 11 görüntü):
- Kök 1: kalça yarığı "köprüsü" köşeleri kalça tepesine sert çekiyordu. Köşeler yarığın deri ağırlıklarını taşıdığı için hareket edince dikiş çizgisi, belde ve yarık dibinde sivri uçlar oluşuyordu. → Yarık dolgusu: arka orta şeritte yalnız z ekseninde, yalnız geriye, kenara ve dikeyde sönümlü yumuşatma.
- Kök 2: kumaş gövdenin kas bazlı ağırlıklarını birebir izliyordu. → Kumaşın iç kısmında ağırlıklar komşularla ortalanıyor; bel ve paça kenarına 3 cm kala gövdeyle birebir.
- Kök 3: ayrı bel lastiği şeridi üçgen sınırından kesildiği için dalgalı kenar ve kanatçık yapıyor, eğilince kalça yanına açık bant gibi geriliyordu. → Lastik artık ayrı geometri değil: kumaş gölgelendiricisinde 3,5 cm koyu bant, daha az mat, alt kenarda ince dikiş çizgisi.
- Sonuç: 4 hareket × 4 arka açı — sivri uç, dikiş çizgisi, kanatçık yok.

**Pazı vurgusu:** üst kol kemiği deltoidi de taşıdığı için curl'de omuz yanıyordu. Üst kol girdilerine kol boyu aralığı eklendi (`aKolU`: 0 omuz eklemi, 1 dirsek): pazı/triceps 0,35–1,3, ön omuz −0,4–0,3.

**Omuz:** `measure-shoulder-dist-incr` 0,18 → 0 (0,08 denendi: yalnız 0,5 cm, gözle seçilmez). Omuz eklemleri arası 41,6 → **40,7 cm** (~%2). Gövde Blender'da yeniden üretildi.
- Kol/omuz hesaplarının hepsi modelden ölçüldüğü için (omuz eklemi, kol boyu, gövde kesiti, deltoid ve Delta Mush bölgeleri, kavrama) yeni gövdeye kendiliğinden uyar. **Ölçümle doğrulandı:** katlanma lat tepesi 19 (önce 18), pres 0, baş üstü 11 (önce 10) · bilek sınır aşımı 0/17 · kavrama ≤ 2,8 cm · kare-kare el dönüşü ≤ 20° · dirsek ≤ 146° · 17 hareket × 4 açı × 3 an paftası temiz.

**Ten rengi:** `#cdc8c0` → `#d4c3b2` (dört aday yan yana çizildi; en hafif sıcak ton). Yalnız C. Deneme için `?ten=RRGGBB`.

## 18. Plank ayak parmakları · ters fly dirsekleri · kendi üstüne gölge (7 Eki 2026, akşam)

- **Plank'ta ayak parmakları ters kıvrılıyordu.** Kök: parmak ekleminin hedef yönü parmağın YATAY izdüşümüydü; ayak dik durunca izdüşüm belirsizleşip topuğa dönüyordu. Düzeltme: parmak eklemi yalnız ayak sırtına doğru bükülür (dorsifleksiyon, ayağın yan ekseni etrafında, ≤ 88°). Plank'ta parmaklar altta, uçlar başa doğru; parmak ucu kalkışı ve lunge'da yere paralel.
- **Ters fly'da dirsek omuz hizasını geçiyordu** (Sabri). Ölçüldü: açık konumda dirsek omzun 9,3 cm üstündeydi (veride bile 3,8). Kural: el omuz hizasında ya da altındayken dirsek en çok omuz (ya da el) hizasının 2 cm altına kadar çıkar; el başın üstüne çıkan harekette (pres, baş üstü triceps) kural 8→16 cm arasında yumuşakça devreden çıkar. Dirsek omuz–el ekseni etrafında döndürülür, kol boyu ve tutuş değişmez. Sonuç: ters fly +9,3 → +0,3 cm (ölçüm ekseni farkı); diğer 16 hareket birebir aynı; el dönüşü 12° → 9°, kavrama 2,1 → 1,4 cm.
- **Omuz başında keskin açık leke** (ters fly): gölge kapatılınca kayboluyor → gövdenin kendi üstüne aldığı gölge. Gövde ve şort artık yere gölge düşürüyor ama kendi üstüne gölge almıyor (kil görünümlü stilize karakterlerde yaygın); genel görünüm değişmedi. A/B: `?kendigolge=1`.
- Doğrulama: 17 hareket × 4 açı × 3 an temiz · bilek sınır aşımı 0/17.

## 19. Çok açılı denetim turu (7 Eki 2026, gece)

Sabri: "her geliştirme ve değiştirme sürecinden sonra hareketleri farklı açılardan, üstten, yanlardan, farklı bölgelerden kontrol et." Yöntem (kalıcı): 17 hareket × 4 yatay açı × 3 an paftası + **üstten** (`mockup-3b-pafta.html?fi=68`) + **bölge yakın çekimleri** (eller, dirsek, omuz, kalça/şort, diz, ayak; `mockup-3b-el.html?odak=kemik:<ad>`, 17 hareket × 4 açı) + ölçüm araçları.

Bulunan ve düzeltilen:
- **Oturuşta paça kenarı testere dişi** (bench, omuz presi, plank, seated row): kenara çekilen köşeler dizdeki/kalçadaki eski yerlerinin ağırlıklarını taşıyordu; bükülünce komşularından ayrılıyordu. Ağırlıklarını bandın içindeki komşularından alıyorlar. Ayrıca kumaş altı gizleme paça kenarında 2,5 cm → 4 mm (kenardaki deri kumaşın dışına taşıyordu); belde 2,5 cm kaldı (dar payda bel kenarı tırtıklanıyordu).
- **Serbest eller havada** (lunge'da "eller belde", baş üstü triceps'te boştaki el uylukta): veri eski mankene göre, el yüzeyden ~4 cm uzakta ve avuç yana bakıyordu. Yeni kural: tutamak tutmayan ve gövdeye ≤ 8 cm el, avucu yüzeye bakacak, parmakları gövdenin önüne doğru uzanacak biçimde yüzeye oturur; IK hedefi bilek olur. Yüzey normali 4 cm çevreden ortalanıyor ve kareler arası yumuşatılıyor (ilk sürümde el kareden kareye 34° sıçrıyordu → 12°).
- Doğal bulunanlar (değişiklik yok): dirsek ucu derin bükülmede sivri (anatomik) · front raise'de omuz başı yumrusu (perspektif — DQS/deltoid/Delta Mush/ritim A/B'sinde aynı) · dizler.

Bulunan, düzeltilmedi (B1'e):
- **Plank'ta ayak ve parmaklar yere ~2 cm gömülü** (ölçüldü: parmak altı −1,9, ayak gövdesi −2,2 cm). Kök: verinin parmak ucu bilek yüksekliği eski mankenin ayak ölçüsüyle. Çeviri katmanına yama yerine veri modeli v2'de C'nin ayak ölçüsüyle çözülecek.

Ölçümler (son): bilek sınır aşımı 0/17 · kavrama ≤ 2,8 cm · kare-kare el dönüşü ≤ 20° (lunge 12°) · katlanma lat tepesi 19, pres 0, baş üstü 11, ters fly 0 · 17 × 4 × 3 pafta temiz.

## 20. B1 veri modeli v2 uygulandı (7 Eki 2026, gece)

Plan ve tam sonuç tablosu: `2026-10-07-b1-veri-modeli-v2-PLAN.md` §6. Özet: hareket verisi artık C'nin modelden üretilen ölçüleriyle (`js/anim3d/olcu.js`) yazılıyor; prototipin çeviri bekçileri karelerin %16,7'sinden **%2,1**'ine indi; tutamak verisi açık, `hareket-ayar.js` boşaldı; dört yeni fizik kuralı (dirsek açısı, dirsek yüksekliği, dirsek gövde dışında, tutamak eşleşmesi) olumsuz fikstürleriyle. §19'da B1'e bırakılan plank ayak sorunu çözüldü (parmak eklemi yüksekliği artık C'den). Uygulamadaki "Bugün" mankeni de yeni oranlarla çiziliyor (D2). Commit edilmedi.

## 21. Sabri'nin 7 Eki gece listesi — hareket, bağlantı ve alet turu (8 Eki 2026)

İstenen: lunge daha yavaş · halat kafadan geçiyor · baş üstü triceps'te ve hammer curl'de omuz–kol bağlantısı kırılıyor · alet–manken bağlantıları (halat kafada, kalça minderde değil, bar bacağın içinde) · aletler kabaca gerçeğe benzesin (halatın geliş yeri, bağlantı yükseklikleri, oturuş).

**Yapılanlar ve kökler (hepsi ölçüldü, A/B ile doğrulandı):**
- **Lunge** her bacak 3 sn (önce iki bacak tek 3 sn'ye sığıyordu): `donguTekrar: 2`, toplam süre aynı (`sahne.animT`).
- **Veri, C bedeninin temas ölçülerini taşımıyordu** (B1'in devamı; hepsi `olcu-uret.mjs` → `olcu.js`): kafa merkezi + yarı ölçüleri (yüz veri noktasından 17,8 cm öndeydi → halat–yüz çarpışması denetime görünmüyordu) · sırt derinliği 9,5 (veri 12,5) · kalça arkası 9 · parmak eklemi yüksekliği 0,8 (veri 3,6 — plankta parmaklar havadaydı) · uyluk 11,1 / baldır 8,2 (%90'lık; uyluk kemiği bacağın arkasında, ön yüz 12 cm önde — eski 7,8'lik kapsül V-bar kolunun uyluğa girdiğini görmüyordu).
- **Sırtüstü:** sırt sehpadan 3,4 → 1,4 cm, baş 7 → 1,1 cm (boyun eğimi `bas` eklendi; sırtüstünde başın arkası sehpaya inecek kadar çözülür, prototip boyun+başı döndürür).
- **Halat/bar:** V-bar makarası öne (26 → 40), dirsekler 2 cm öne, V kolu ucu 6 → 4 cm; deri ölçümü yüz 4,1 · uyluklar 5,1/3,1 cm. İki elle kürekte dambıllar uyluğa giriyordu → dz 7 → 12 (deri 6,3 cm).
- **Omuz kırılması — iki kök:** (1) kol düzken dirsek yönü belirsiz, ilk karenin yanlış işareti bütün harekete kilitleniyordu → hammer curl'de bir üst kol 164–178° burkuluyordu (sol 2–20°). Belirsizde anatomik referans (dinlenmedeki kolun ön yüzü, gövdeyle döndürülmüş) + az bükük dirsekte aşırı açılma reddi. (2) Baş üstünde üst kol ~180° burulur (Codman paradoksu); modelde burulma kemiği yok, hepsi omuzda toplanıp deriyi katlıyordu. A/B: burulma sıfırlanınca katlanma tamamen kayboldu → üst kol kemiğinin burulması ±45° ile sınırlı (90° tam yukarıda kabarıklık bırakıyordu), ön kol ve el gerçek yönle (sınırlanmış yön ön kola geçince el 48°/kare sıçradı — ayrıldı). Squat ısınmasındaki asimetri (157–179°) de düzeldi.
- **Dirsek ters kırılıyordu** (Sabri 8 Eki, hammer curl yan görünüm): kol sarkarken verinin kutbu kolun kendisine neredeyse paralel, çözücü dirseği omuz–el çizgisinin ön tarafına koyuyordu → ön kol geriye bükülüyordu (hammer 16°). Prototipte, dirseğe dokunan bütün bekçilerden SONRA: kol başın üstünde değilse ve dirsek anatomik ön tarafta kalmışsa çizginin öbür yanına aynalanır (el yerinde kalır). Hammer'da geriye kırık kare 2 → 0. ⚠️ Ölçüm aracının fly (38°) ve pushdown (33°) bulguları görsel kontrolde yanılsama çıktı: aracın referansı üst kolun en kısa dönüşü, iç rotasyonlu kollarda ters işaret veriyor.
- **Fizik denetimine:** C'nin kafa/bacak ölçüleriyle cisim çarpışması + yeni olumsuz fikstür (HALAT YÜZDE — eski makarayla KIRMIZI yanıyor).
- **Aletler:** kablo kulesi (taban, dikmeler, kiriş, kılavuzlar arasında plaka yığını, yüksek makarada kiriş kolu / alçak-orta makarada ön kızak, kablonun kuleye dönüş yolu) — pushdown, front raise (arkada), cable curl (makara 16 → 30, ayağın altındaydı), lat çekişi (ped kolu ve oturak rayı kuleye bağlı), oturarak kürek · bacaklı sehpa/oturak (kalın minder, kiriş, geniş tabanlı iki bacak) · bench dikmeleri + J kancaları · leg press kova koltuk + raylarda kızak + plaka boynuzları · eğik preste plaka boynuzu + plaka, kutu profil dikmeler · ters fly arkasında ağırlık kulesi · calf raise lastik basamak + tabana bağlı direk.

**Ölçümler (son):** fizik-denetimi ve verify-poses temiz · `npm test` EXIT 0 · bilek sınırı aşımı 0 · kavrama ≤ 2,8 cm · kare-kare el dönüşü ≤ 15° (baş üstü 12°; lunge 25° = seyrek örnekleme, sık örneklemede 4°).

**Açık / sırada:** gölgeyi ucuzlatıp telefona hazırlamak · genel uygulama gözden geçirmesi + telefonda test · **mankene sporcu atleti** (Sabri 8 Eki: "en sonunda ya da uygun bir aralıkta") · ters fly kulesi bazı açılardan kişiyi örtüyor (gerçek makinede de öyle; gerekirse yarı saydam).

## 22. Telefon hazırlığı — gölge ve işlemci (8 Eki 2026)

**Gölge:** VSM 2048 + 16 örnekli bulanıklık (iki tam ekran geçiş) → yumuşak PCF 1024. Aynı ekran, GPU: kare **34,8 → 18,3 ms** (PCF 512: 17,8 · gölgesiz: 13,9). Görüntü yan yana kıyaslandı, fark seçilmiyor → **varsayılan PCF** (`premium.js`, `globalThis.__golge` ile seçilebilir).

**İşlemci (karede, masaüstü, aynı oturumda dönüşümlü A/B):** lat çekişi 3,1 ms · hammer 1,7 · leg press 2,0; bunun ~1 ms'si Delta Mush. Değişmeyen alet parçalarını atlamak ölçüldü ve kazanç vermedi (3,21 → 3,09) → geri alındı; parça listesi artık karede bir kez üretiliyor. Telefonda kabaca ×3–5 beklenir → 30 fps bütçesine sığar, 60 fps için Delta Mush'ı düşük güçlü cihazda kapatmak bir seçenek.

**Telefonda deneme:** `mockup-3b-stil.html?fps=1&p=3` — sağ üstte kare hızı, çizim süresi, dpr, gölge türü. `&golge=vsm` eski gölge, `&mushyok=1` Delta Mush kapalı (kıyas için). Yerel ağdan sunuluyor (geçici, bilgisayarın Wi-Fi adresi).

**Sırada:** gerçek telefon ölçümü → kalite kademesi kararı (dpr tavanı, 30 fps sınırı, Delta Mush) · C çizicisinin uygulamaya taşınması · genel gözden geçirme · sporcu atleti.

## 23. Aydınlık sahne · ters fly kulesi · fly · manken seçeneği (8 Eki 2026)

**Sabri (telefonda ve masaüstünde baktı):** çizimler ve animasyonlar iyi çalışıyor; kalan hareket sorunları var (olmadık yerde kırılan kollar, oynayan eklemler, kuleye giren kollar); halat, direkler ve oturak koyu zeminde seçilmiyor → ortam daha aydınlık olsun.

- **Aydınlık sahne** (`premium.js`, `?karanlik=1` eski görünüm): sahne arka planı açıldı · kablo açık çelik (0x30343a → 0xa9b0b8) · boyalı çelik ve döşeme bir kademe açık · ortam ışığı 0,5 → 0,85 + gökyüzü/zemin dolgu ışığı · zemin lekesi daha belirgin · kule/sehpa çerçeve tonları açıldı.
- **Ters fly:** kule göğüs pedinin önündeydi, kollar ve tutamaklar içinden geçiyordu → oturağın gerisine alındı.
- **Fly:** altta 84° → 78° ve dirsek daha az bükük (erişim 0,9675 → 0,98) — altta kol kırık görünüyordu.
- **Çekiç curl'de ters dirsek** (Sabri'nin görselleri): güncel kodda yok (yan profil çizildi); görüntü tarayıcının önbelleğindeki eski koddan. Deneme sunucuları artık `Cache-Control: no-store` gönderiyor.

**Üç manken birlikte, seçim kullanıcıda?** (ölçüm, sıkıştırılmış indirme):

| Seçenek | İndirme | Not |
|---|---|---|
| Bugün (kapsül) | ~143 KB | three alt kümesi; zayıf cihazda da akıcı |
| A · Premium (prosedürel) | ~440 KB | tam three.js |
| C · MakeHuman | ~1,07 MB | tam three.js + 593 KB gövde |
| Üçü birden | ~1,2 MB | tam three.js ortak; çevrimdışı önbellek bu kadar büyür |

- **Yük:** yalnız seçili manken kurulursa çalışma anı yükü artmaz; indirme ve depolama ~1,2 MB olur (bugünkü 143 KB'ın ~8 katı).
- **Karmaşıklık asıl maliyet:** aynı veri üç çiziciden geçiyor ama doğruluk düzeltmeleri (burulma sınırı, dirsek koruması, temas ölçüleri, kavrama, Delta Mush) yalnız C'de. Her hareket düzeltmesi üç görünümde ayrı doğrulanmalı; A ve Bugün'de bugün çözdüğümüz kusurlar görünmeye devam eder.
- **Fayda:** zayıf/eski telefonda hafif bir yedek; stil tercihi. Pazar tarafında "üç görünüm" ayırt edici değil — rakipler tek, iyi bir manken sunuyor.
- **Öneri:** C varsayılan ve tek görünüm; **Bugün** kullanıcıya seçenek olarak değil, WebGL/performans yetmediğinde **kendiliğinden** devreye giren yedek (zaten SVG yedeği olan bir yol); A (premium) emekliye ayrılsın. İstenirse Ayarlar'da tek bir "pil tasarrufu / basit görünüm" anahtarı Bugün'e geçer — üç seçenek değil iki durum.

## 24. Sabri'nin 8 Eki öğle listesi + karar (8 Eki 2026)

**KARAR (Sabri, 8 Eki):** C (MakeHuman) tek ve varsayılan manken. Bugünkü kapsül manken seçenek değil, cihaz C'yi kaldıramazsa kendiliğinden devreye giren yedek. Premium (A) emekliye ayrılır. Ayarlar'da isteğe bağlı tek bir "basit görünüm / pil tasarrufu" anahtarı. → C'yi uygulamaya taşıma planının girdisi.

| # | Sabri | Kök | Yapılan |
|---|---|---|---|
| 1 | Ters fly: kule önde olmalı; öndeki sütunlar ağırlıklardan uzak; kule biraz küçük olsun | kule 46 cm derin, dikmeler yığından ~9 cm uzak; arkaya almıştım | KOMPAKT kule (derinlik 32, eni ±21, dikmeler yığına bitişik) — bütün kablolu hareketlerde; ters fly'da kule önde, tutamakların erişiminin (x ≤ 67) ötesinde, makine kolonuna üst kirişle bağlı |
| 2 | Fly (Dumbbell Bench Fly — dambılla göğüs açma): altta iki kol kırılıyor | kırık görünen BİLEKti: dirsek altta 12° bükük ve yatay, avuç "içe" tanımlı olduğu için el bilekten ~70° yukarı bükülüyordu | avuç tavana ('ileri'), kutup dirseği aşağı veriyor (~25° büküm, ön kol dambıla doğru yükselir), altta 80° |
| 3 | Lunge: adım çok açık, çöküş biraz yavaş | adımı uzatan yere paralel arka kaval + dik ön kaval (derin lunge) | dipte ön kaval 12° öne, ön uyluk 8°, arka diz 14 cm; adım 111 → 98 cm; iki diz ~94°; adım fazı 0,4 → 0,5 (çöküş daha çabuk). Denetim: arka diz ≤ 10 cm (3–5 idi) |
| 4 | Çekiç curl (Dumbbell Hammer Curl): kol inince dirsek hızlıca kırılıp düzeliyor | verinin kutbu kola paralel → çözücü dirseği kareden kareye öbür yana koyup koruma geri aynalıyordu | kutup = dirsek yönü + 4 cm GERİ eğilim (cable curl'de de); sık örneklemede dirsek kareden kareye ≤ 0,29 cm, büküm düzgün |
| 5 | Kablolu curl (Cable Curl): el kuleye giriyor | el x ≤ 41, kule ön yüzü 36'daydı | makara 30 → 46 (kule ön yüzü 52) |
| + | Ağırlıklar hiç hareket etmiyor; üstteki 6 plaka çekilen boy kadar kalksın | — | halatın makaradan tutamağa uzunluğu, hareketin en kısa anından fazlası kadar (1:1) üstteki 6 plaka + seçici çubuk kalkar; ters fly'da (halatsız) tutamağın yolunun yarısı |
| + | Hareket adlarının İngilizce özgün adı + Türkçesi | — | stil sayfası listesi `English — Türkçe` |

Ayrıca: aydınlık sahne (§23) · deneme sunucuları önbelleksiz.

## 25. Atlet, baş üstü kol ve topuk kaldırma izi (8 Eki öğleden sonra)

Sabri: *"atletin askıları bozuk"* · *"one arm dambılın kolu eklemlerden doğru çalışmıyor"* · *"topuk kaldırmadaki yörünge izi mankenin arkasından çıkıyor, görünmüyor"*.

| Sorun | Kök (ölçüldü) | Düzeltme |
|---|---|---|
| Kol kalkınca deri atleti deliyor | Omuz düzeltmeleri (Delta Mush, deltoid) gövdeye atletten SONRA kuruluyordu; atlet düzeltilmemiş deriyi izliyordu | `atletKopyala`: aynı köşe karşılığıyla atlete aktarılır |
| Kenarda siyah dişler | Deri gizleme konum payıyla (2,5 cm) yapılıyordu; kumaşın örtmediği yerde de deri gizleniyor, karanlık zemin görünüyordu (kenar şeridi kırmızıya boyanarak ayrıldı) | Köşe, kendisinin ve komşularının bütün üçgenleri kumaşla örtülüyse gizlenir |
| Kenarda koyu kesikler | Kenar şeridi yönü sıralı anahtardan alınıyordu, dörtgenlerin yarısı ters yüzlüydü | Yön üçgenin sırasından |
| Testere dişli kenar | Kulak üçgenler + düğüm köşeler | Tur tur ayıklanır; kenara komşu iki halka gevşetilir |
| Baş üstü triceps: el omzun 32 cm arkasına uzanıyor | Ön kol 120°'de neredeyse yatay | Ön kol başın arkasından aşağı, dambıl ensenin arkasında (`V=[-0.9,0,-0.45]`, 6→118°); 125°+ ön kolu sırta gömüyordu (denetim) |
| Kol tepede bükük (veri 13°, ekran 50°) | Kürek kemiği ritmi omzu 7 cm kaldırıyor, el hedefi aynı | Tutamak tutan kolda ritim, kolu veriden fazla büktürmeyecek kadarla sınırlı → 20° (omuz presi 71 → 40°) |
| Topuk kaldırma izi görünmüyor | İzlenen nokta kalça (gövdenin içi) | `izKaydir`: iz direğin karşı yanında, sarkan kolun dışında (üç çizici aynı `izYolu`) |

Doğrulama: fizik denetimi temiz · `npm test` 17/17 · süreklilik (el dönüşü ≤ 18°/kare, sınır aşımı 0) · bekçiler 18/902 (ters fly dirsek yüksekliği bekçisi 7 → 0) · çok açılı görüntü (baş üstü, şınav üstten, lat çekiş arkadan, ayakta önden).

## 26. Tek kol baş üstü omuz bağlantısı · omuz presinde atlet delikleri (8 Eki akşam)

Sabri: *"tek kol dambıl baş üstünde kol omuzdan ayrılıyor gibi, hem olduğu yerde dönüyor hem uzuyor"* · *"omuz presinde kollar inerken atletin ön askılarında delikler"*.

| Sorun | Kök (ölçüldü) | Düzeltme |
|---|---|---|
| Omuz hareket boyunca 4,3 cm yükseliyor | §25'teki ritim sınırı kare kare hesaplanıyordu; ön kol indikçe sınır gevşiyordu | Hareket değişince 13 karelik ön geçiş; ritim = ham ritim × hareketin en küçük izinli oranı → omuz sabit (91,1 cm, değişim 0) |
| Üst kol yerinde ~60° burkuluyor | Ön kolun yolu dikey eksene göre kuruluydu, üst kol 9° eğik → bükülme yönü hareket başında eğimden geliyordu | Yol üst kol ekseniyle aynı düzlemde (`U = omuz → dirsek`, `V` ona dik) → burulma değişimi ~7° |
| Askıda açık üçgenler | Kenara komşu iki halkayı gevşetmek kumaşı köprücüğün kabarık yerine kaydırıyordu; deri kumaşın önüne çıkıyordu (tanı: gizli deri kırmızı, kenar şeridi kırmızı) | Halka gevşetme kaldırıldı; deri gizleme "kendi bütün üçgenleri örtülü" köşeye genişledi; dikiş kopyaları ortak normalle itiliyor; seçimdeki tek tük delikler dolduruluyor; kenar köşelerinin kemik ağırlıkları kenar boyunca yumuşatıldı |

Kalan: kol tam yukarıdayken arka kol oyuğunda birkaç piksellik kırık (kenar kola bağlı köşelerin üstünden geçiyor). Tanı bayrakları (`mockup-3b-el.html`): `gizligoster` · `atletkenar` · `derigizle` · `atletgorunmez` · `kopyayok` · `mushyok`.

Doğrulama: fizik denetimi temiz · `npm test` 17/17 · süreklilik (el dönüşü ≤ 17°/kare, sınır aşımı 0) · bekçiler 18/902 · dirsek bükümü veriyle uyumlu (baş üstü tepe 10 ↔ 16°, omuz presi 40 ↔ 40°).
