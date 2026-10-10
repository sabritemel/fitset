# FitSet'i uygulama mağazalarına hazırlamak: ekran incelemesi, rakipler, yol haritası

**Tarih:** 9 Ekim 2026 · **Durum:** analiz. Kod yazılmadı; kararlar Sabri'de (§8).
**Girdi:** uygulamanın telefon boyutunda (390×844) tam turu, boş ve 8 haftalık örnek veriyle; kaynak kodu;
5 Ekim analizi (`2026-10-05-urun-evrimi-analizi.md` §1–§9, 21 rakip); bu tur için iki yeni araştırma (en sevilen
rakiplerin kullanım desenleri · mağaza yayın şartları). Ekran görüntüleri: `magaza-2026-10-09/`.

> 5 Ekim analizi rakiplerin fiyat, kütüphane ve puan tablosunu zaten çıkardı. Burada tekrarlanmıyor.
> Bu belge üç yeni soruyu cevaplıyor: **ekranlar bir sporcu için ne kadar iyi?**, **en sevilen uygulamalar
> kullanıcıyı neyle bağlıyor?**, **mağazaya çıkmak için tam olarak ne gerekiyor?**

---

## 0. Kısa sonuç

**Bugünkü FitSet senin için premium'a yakın bir defter; başkası için henüz bir ürün değil.**

1. **Güçlü olduğu yer, kategorinin kazanan kriteriyle aynı: hız.** Set başına tek dokunuş, önceki değerlerin hazır
   gelmesi, kendiliğinden başlayan dinlenme sayacı. Rakip araştırmasına göre en sevilen uygulamalar (Hevy, Strong,
   Setgraph) tam olarak bununla kazanıyor. FitSet bunu zaten yapıyor.
2. **Kimsede olmayan bir kozu var:** döndürülebilir, çalışan kası yanan, fiziksel olarak denetlenmiş 3B manken;
   üstelik hesapsız, reklamsız, internetsiz. Rakiplerin hepsi video kullanıyor ya da 3B'leri ağırlık takibinde zayıf.
3. ❌ **Mağazayı engelleyen dört eksik:**
   - Uygulama **senin programınla açılıyor**; yeni kullanıcı kendi programını kuramıyor.
   - **17 hareket** var, rakiplerde 300–1 600.
   - **Geri getiren ekranlar zayıf**: anında kişisel rekor, kutlama, takvim, kas başına hacim ve paylaşılabilir özet yok.
   - Kilit ekranında dinlenme bildirimi, sağlık uygulaması ve saat bağlantısı yok. Bu bir web uygulaması sınırı;
     mağaza paketiyle aşılıyor.
4. ⚠️ **"FitSet" adıyla mağazaya çıkmak riskli.** Türkiye'de dambıl satan bir firmanın tescilli "Fitset" markası var.
   Google Play'de aynı adla iki fitness uygulaması var. Yeni logoyu uygulamaya yaymadan önce **ad kararı** verilmeli (§8 K1).
5. **Önerilen yol: önce "başkası kullanabilsin", sonra "geri gelsin", en son mağaza.**
   Google Play önce (web uygulaması paketlenerek), App Store sonra (yerel özelliklerle). Toplam kabaca 2–3 aylık iş (§6).

---

## 1. Ekran ekran inceleme (bugünkü FitSet)

Ölçüt: elinde dambıl, nefes nefese, 60 sn dinlenmesi olan bir sporcu. Her ekran için *hız*, *anlaşılırlık*,
*motivasyon*, *görünüm* ayrı ayrı değerlendirildi.

### 1.1 Liste (ana ekran) — `02-liste.png`, `03-gun-secici.png`

| | |
|---|---|
| ✅ İyi | Büyük, okunaklı başlık; günün hareketleri tek listede; set/hacim/süre sayaçları; "program günü değil ama kaydedebilirsin" bilgisi dürüst; tek büyük birincil düğme (Isınmaya başla). |
| ⚠️ Zayıf | **İlk açılışta bir başkasının programı açılıyor**: yeni kullanıcı "1. Gün · Göğüs · Omuz · Triceps"i görüyor, kendi programını kuramıyor, hareket ekleyemiyor, çıkaramıyor. Karşılama, hedef sorusu, hiçbir yönlendirme yok. |
| ⚠️ Zayıf | Gezinme yalnız sağ üstteki iki simgeyle (Geçmiş, Ayarlar). Mağaza uygulamalarında beklenen alt sekme çubuğu yok; "İlerleme" ve "Kütüphane" diye bir yer yok. |
| ⚠️ Zayıf | Hareket adı İngilizce birincil, Türkçe açıklama altta. Türkiye'deki acemi için ters; dünyaya açılınca doğru. Dil seçimine bağlanmalı. |

### 1.2 Hareket (odak) ekranı — `04-odak.png`, `05-dinlenme.png`, `06-hareket-bitti.png`, `17-odak-gecmisli.png`

Uygulamanın en güçlü ekranı.

| | |
|---|---|
| ✅ Çok iyi | **Set başına tek dokunuş:** ağırlık önceki setten ve geçen seanstan dolu gelir, "1. seti kaydet". Ölçüldü: aynı ağırlıkla 3 set = 3 dokunuş. |
| ✅ Çok iyi | Dinlenme sayacı set kaydedilince **kendiliğinden** başlıyor; +30 ve Geç düğmeleri baş parmak bölgesinde; ekran açık tutuluyor (wake lock). |
| ✅ Çok iyi | "Geçen sefer · 3 gün önce · 27,5 × 12 · 27,5 × 12 · 27,5 × 10" satırı; geri al düğmesi; hareket bitince "Fazladan set / Sonraki hareket". |
| ✅ Ayırt edici | **Döndürülebilir 3B manken, çalışan kas yanıyor**, alet gerçek ölçüde. Rakiplerin hiçbirinde bu kalitede, çevrimdışı ve fiziksel olarak denetlenmiş hareket çizimi yok. |
| ⚠️ Zayıf | İlk kayıtta ağırlık **"0 kg"** görünüyor; bar hareketinde "boş bar 20 kg" gibi bir başlangıç önerisi yok. |
| ⚠️ Zayıf | Ön doldurma geçen seansın **son** setini alıyor: hedef 12 iken 1. set "27,5 × 10" geliyor (`session.js:213-219`). Rakipler her satıra geçen seansın **aynı sıradaki** setini yazıyor. |
| ⚠️ Eksik | RPE/RIR (ne kadar zorlandın), süperset, drop set, plaka hesaplayıcı, set notu girişi. |
| ⚠️ Platform sınırı | Telefon kilitlenince dinlenme bitişi bildirilemiyor (PWA'da arka planda güvenilir alarm yok — `timer.js:6-18`). Rakipler kilit ekranında/saatte geri sayım gösteriyor. |
| ⚠️ Karışık | "?" sayfası hem *nasıl yapılır* hem *hedefi değiştir* işini taşıyor; "Hoca programı değiştirdiğinde burayı güncelle" cümlesi kişisel kullanıma yazılmış. |

### 1.3 Isınma — `14-isinma.png`

| | |
|---|---|
| ✅ İyi | Günün kas gruplarına göre 5 adım, süre/tekrar sağda, küçük 3B görseller. |
| ⚠️ Zayıf | Görseller çok küçük (~50 px); dokununca büyümüyor. Isınma setleri ağırlığa göre hesaplanmıyor (24 Eyl'de onaylanan RAMP kuralı henüz yok). |

### 1.4 Seans sonu — `16-ozet.png`

| | |
|---|---|
| ✅ İyi | Süre, set, hacim; "Geri al" ile bitirmeyi geri alma; sıradaki antrenman. |
| ❌ Zayıf | **En duygusal an boş geçiyor.** Kişisel rekor yok, hangi kasların çalıştığı yok, geçen seferle hareket hareket kıyas yok, paylaşılabilir kart yok. Yarım bir seansta "Geçen 1. Güne göre hacim −%89,2" kırmızımsı bir çizgiyle **olumsuz** bir kapanış yapıyor. |

### 1.5 Geçmiş — `11-gecmis-veri.png`

| | |
|---|---|
| ✅ İyi | Kilo grafiği; son seanslar; her hareket için ilk → son ağırlık ve küçük çizgi; seansa dokununca değerler düzeltilebiliyor. |
| ⚠️ Zayıf | Her şey tek uzun sayfada; 17 hareketin çizgileri ince ve küçük, eksen yok, dokununca ayrıntı açılmıyor. |
| ❌ Eksik | Takvim/seri (streak), haftalık kas başına set, tahmini 1 tekrar maksimum (e1RM), rekor listesi, hacim haftalık grafiği. Rakiplerde kullanıcıyı geri getiren ekran bu. |

### 1.6 Ayarlar — `13-ayarlar.png`

| | |
|---|---|
| ✅ İyi | Sade; antrenman günleri, dinlenme, dambıl adımı, Tam/Basit çizim; **yedek uyarısı dürüst** ("telefonu değiştirirsen her şey gider"); tıbbi uyarı ve lisans künyesi. |
| ⚠️ Eksik | Dil, birim (kg/lb), açık tema, bildirimler, program yönetimi, veri içe aktarma (Strong/Hevy CSV), gizlilik politikası bağlantısı. |

### 1.7 Görsel dil (genel)

- **Premium'a yakın.** Koyu "Grafit" zemin, tek mercan vurgu, büyük rakamlar, ≥44 px dokunma alanları, Archivo yazı tipi.
  Koyu temada mağaza ekran görüntülerinde Strong ve Hevy ile aynı ligde duruyor; 3B manken onları geçiyor.
- **Eksik olan cila:** mikro-animasyon ve dokunsal geri bildirim (rekor anı, hareket bitişi), boş durumların tasarımı
  (bugün yalnız bir cümle), ikon dili tutarlı ama az.
- Yeni logo (FS işareti, `tools/logo/`) uygulamanın içinde henüz yok; başlıkta ve açılış ekranında kullanılabilir.

---

## 2. En sevilen rakipler kullanıcıyı neyle kazanıyor?

Ayrıntı ve kaynaklar: `2026-10-09-arastirma-rakip-ux.md`. ⚠️ Reddit'e doğrudan erişilemedi; Reddit görüşü ikincil
kaynaklardan, bir kısmı rakiplerin kendi bloglarından. Puanlar 9 Ekim App Store (ABD/TR) sayfalarından.

| Uygulama | Sevilme sinyali | Neyle seviliyor | Neye kızılıyor |
|---|---|---|---|
| **Hevy** | 4,9 (~97 bin oy); TR 4,9, Türkçe | Önceki değerler hazır; set tipleri (ısınma/drop/tükeniş/süperset); **anında rekor şeridi**; yıl sonu özeti ve paylaşılabilir kartlar; kilit ekranı, saat | Hesap zorunlu; ücretsiz pakette 4 rutin, 3 aylık grafik; önerileri açıklamıyor |
| **Strong** | 4,9 (~109 bin oy); Türkçe yok | Sade ve hızlı; **plaka ve ısınma hesaplayıcı**; saatten telefonsuz kayıt; Live Activity | Saat uygulaması kopuyor; ücretsizde 3 rutin; "terk edilmiş" hissi |
| **Boostcamp** | 4,8 (~10 bin) | **Koçların hazır programları ücretsiz**; "geçen haftayı geç" hedefi; RPE/RIR; kas ısı haritası | Grafikleri ve karanlık modu sonradan ücretli yaptı; antrenman bitince ödeme/puan isteği |
| **Alpha Progression** | 4,9 | Set başına hedef ağırlık; otomatik ısınma setleri; **hesapsız ücretsiz paket** | Öneri, grafik ve hesaplayıcılar ücretli |
| **Fitbod** | 4,8 (~287 bin) | Yapay zekâ antrenmanı; **toparlanma ısı haritası** | İptalden sonra çekim; hep aynı antrenman; gerçek ücretsiz paket yok |
| **Ağırsağlam / Lightweight (TR)** | TR 4,8 (~11 bin), 12. sıra | Türkçe, TL fiyat, tanınan Türk antrenör; kas ısı haritası; 50+ program | Saat yok; kullanıcılar kısa hareket videosu istiyor |

**Kategoriden beş ders:**
1. **Hız her şeyden önce.** Övgülerin ortak paydası "saniyeler içinde set girmek".
2. **Cömert ve kalıcı ücretsiz paket sadakat yaratıyor.** En sert yorumlar sınırlara (3–4 rutin) ve **sonradan paralıya
   alınan özelliklere** geliyor.
3. **Antrenman sırasında ödeme ya da puan isteği affedilmiyor.**
4. **Güvenilirlik özellikten önce gelir.** 1–3 yıldızların çekirdeği veri kaybı, güncelleme hataları ve kopan saat uygulaması.
5. **Boşluk: gerekçesini söyleyen öneri.** Alpha Progression ve Hevy Trainer öneriyor ama nedenini söylemiyor; ikisi
   de bunun için eleştiriliyor. FitSet'in ağırlık önerisi ("iki seans hedef tutuldu → +%5") zaten gerekçeli.

---

## 3. FitSet, kategorinin olmazsa olmazlarına karşı

| Olmazsa olmaz (araştırmadan) | FitSet bugün |
|---|---|
| Önceki değerler hazır, tek dokunuşla set | ✅ (küçük düzeltme: set sırası eşleşmeli, §1.2) |
| Otomatik dinlenme sayacı | ✅ |
| Kilit ekranında sayaç / bildirim | ❌ web uygulaması sınırı → mağaza paketi |
| Rutin / program düzenleyici + hazır programlar | ❌ **en büyük açık** |
| Hareket kütüphanesi (yüzlerce) | ❌ 17 hareket |
| Set türleri (ısınma, drop, tükeniş, süperset) | ⚠️ yalnız ısınma |
| Anında kişisel rekor + tahmini 1RM + grafikler | ❌ / ⚠️ basit çizgi |
| Kas grubu başına haftalık hacim | ❌ |
| Plaka ve ısınma hesaplayıcı | ❌ |
| Apple Health / Health Connect | ❌ mağaza paketi gerekir |
| Saat uygulaması | ❌ (ertelenebilir) |
| CSV içe/dışa aktarma (Strong/Hevy) | ⚠️ yalnız kendi yedeği |
| Karanlık mod, reklamsız | ✅ |
| Hesap açmadan başlamak | ✅ **fark yaratır** (Hevy'de zorunlu) |
| Türkçe | ✅ · İngilizce ❌ |

**FitSet'in rakiplerde olmayan dört kozu:**
1. **3B manken:** her açıdan dönen, çalışan kası yanan, karesi karesine fiziksel olarak denetlenmiş. Video çekmeden çok açılı gösterim.
2. **Gerekçeli öneri:** "neden bu ağırlık" cümlesi zaten var; kategorinin açık boşluğu.
3. **Hesap yok, reklam yok, internet yok:** veri telefonda. Hevy'ye karşı açık bir fark.
4. **3B kas haritası fırsatı:** rakiplerin kas ısı haritası düz bir çizim. FitSet aynı haritayı **haftalık hacimle boyanmış
   3B mankende** gösterebilir. Bu, mağaza ekran görüntüsünde ilk bakışta fark edilecek tek şey olur.

**Önerilen konum (5 Eki'deki cümle, güncellendi):**
> *"Her hareketi her açıdan gösteren, çalışan kası parlayan 3B koç ve en hızlı set defteri. Önerilerinin nedenini söyler.
> Hesap yok, reklam yok, internet gerekmez."*

---

## 4. Mağazaya çıkmak için ne gerekiyor?

Ayrıntı, kaynaklar ve adım adım kontrol listesi: `2026-10-09-arastirma-magaza-yayin.md`.

### 4.1 Google Play (önce)

| Gereken | Not |
|---|---|
| **Kendi alan adı** | Uygulama, Trusted Web Activity olarak paketlenir (bugünkü web uygulaması Chrome'da tam ekran açılır). Doğrulama dosyası alan adının **kökünde** olmalı; `sabritemel.github.io/fitset/` bunu sağlayamaz. |
| Geliştirici hesabı | 25 $, tek sefer; kimlik doğrulama. ⚠️ Ücretli satış yapılırsa bireysel hesapta **ev adresin mağazada görünür**. |
| ⚠️ **Kapalı test** | Bireysel hesapta yayından önce **en az 12 kişi, 14 gün kesintisiz** gerçekten kullanmalı. Şirket hesabı muaf. |
| Formlar | Gizlilik politikası (veri toplanmasa da zorunlu), veri güvenliği, **sağlık uygulaması beyanı** (Activity and Fitness), içerik derecelendirmesi. |
| Teknik | Android 16 (API 36) hedefi; ilk açılış internetsizse gösterilecek ekran; mağaza görselleri (512 simge, 1024×500 görsel, ekran görüntüleri). |

### 4.2 App Store (sonra)

| Gereken | Not |
|---|---|
| ⚠️ **Kılavuz 4.2 riski** | Apple "paketlenmiş web sitesini" reddediyor. Uygulama Capacitor ile **cihazın içine** paketlenmeli ve **yerel özellik** taşımalı: kilit ekranında dinlenme bildirimi, titreşim, Apple Sağlık'a antrenman yazma, mümkünse Live Activity. Bunlar zaten rakiplerin olmazsa olmazı. |
| ⚠️ **Veri kaybı riski** | iOS'ta paket içindeki tarayıcı deposu disk dolunca **silinebilir** (Capacitor belgesi). Veri yalnız telefonda olduğu için kalıcı depoya geçiş şart. |
| Hesap ve araç | 99 $/yıl. Mac şart değil: bulut derleme (Codemagic ücretsiz 500 dk/ay). Gerçek cihazda TestFlight denemesi gerekir. |
| Gizlilik | Gizlilik politikası; etiket "Veri Toplanmıyor" olabilir (yalnız cihazda işlenen veri toplanmış sayılmaz); gizlilik bildirim dosyası. |

### 4.3 Para kazanma (ileride)

- Dijital özellik satışı iki mağazada da **mağazanın ödeme sistemiyle** olur; küçük geliştiriciye komisyon **%15**.
- Türkiye'deki alıcının KDV'sini mağazalar tahsil ediyor. Gelir vergisi için GVK 20/B istisnası var; **mali müşavirle doğrulanmalı.**
- Rakiplerden ders: **kayıt tutmak sınırsız ve ücretsiz kalmalı.** Ücretli paket ekleyen değer olmalı (gelişmiş analiz,
  3B kas haritası, hazır program kütüphanesi); bir kez ücretsiz verilen şey geri alınmamalı; antrenman sırasında ödeme istenmemeli.
  Hevy TR'de yıllık ₺159,99, ömür boyu ₺3.999,99; Ağırsağlam yıllık ₺349,99. Ömür boyu seçeneği Türk kullanıcı için cazip.

---

## 5. Tasarım önerileri (ekran bazında)

| Ekran | Öneri |
|---|---|
| **Gezinme** | Alt sekme çubuğu: **Bugün · İlerleme · Programlar · Ayarlar**. Bugünkü sağ üst simgeler kalkar. |
| **İlk açılış** | 4 soru (hedef · haftada kaç gün · ekipman · deneyim) → hazır programdan öneri → ilk antrenman. Hesap yok, ödeme ekranı yok. Hedef: **60 saniyede ilk set**. |
| **Bugün (liste)** | Programdan gelen gün; harekete uzun basınca değiştir/çıkar; "+ hareket ekle"; boş durumda 3B manken ve tek cümle. |
| **Hareket** | Her set satırına geçen seansın **aynı sıradaki** değeri · ilk kayıtta akıllı başlangıç (bar 20 kg) · isteğe bağlı RIR (0–3+, tek dokunuş) · plaka hesaplayıcı (ağırlığa dokununca) · süperset. Rekor kırılınca kısa titreşim + mercan şerit. |
| **Seans sonu** | Rekorlar en üstte · çalışan kaslar 3B mankende · geçen seferle hareket hareket kıyas · **paylaşılabilir kart** (logolu, manken görselli). Yarım seansta olumsuz yüzde gösterilmez. |
| **İlerleme** (yeni) | Takvim + seri · haftalık kas başına set (3B mankende ısı haritası) · hareket sayfası: e1RM ve en ağır set grafiği, rekor geçmişi · kilo grafiği buraya taşınır · aylık/yıllık özet. |
| **Programlar** (yeni) | Hazır şablonlar (Full Body 3 gün · Üst/Alt 4 gün · Push/Pull/Legs · 5×5 · evde dambıl) + düzenleyici; hareket kütüphanesi arama ve kas filtresiyle. |
| **Ayarlar** | Dil (TR/EN) · birim (kg/lb) · bildirimler · içe aktar (Strong/Hevy CSV) · gizlilik politikası · hakkında. |
| **Marka** | FS işareti açılış ekranında ve başlıkta; mağaza ekran görüntüleri 3B manken öne çıkacak şekilde. |
| **Açık tema** | Ertelenebilir: rakiplerin hepsi karanlık modu öne çıkarıyor, salonda karanlık tema yaygın tercih. |

---

## 6. Önerilen yol haritası

Her faz kendi planı ve onayıyla. Süreler tahmin, ölçüm değil.

| Faz | Amaç | İçerik | Tahmini süre |
|---|---|---|---|
| **0 · Karar** | Ad ve hedef | Ad (§8 K1) + marka araması (TÜRKPATENT, sınıf 9/41/42) · alan adı | 1–2 oturum |
| **1 · Başkası kullanabilsin** | Ürünleşmenin ön koşulu | Program veri modeli (bugün program `exercises.js`'te sabit) · hazır şablonlar + düzenleyici · ilk açılış soruları · hareket kütüphanesi (aileler, hedef ~60–80 hareket) · alt sekme çubuğu | 3–5 hafta |
| **2 · Geri gelsin** | Bağlılık | Anında rekor + kutlama · zengin seans sonu + paylaşım kartı · İlerleme ekranı (takvim, e1RM, 3B kas haritası) | 2–3 hafta |
| **3 · Hız cilası** | Olmazsa olmazları tamamla | Set sırası eşleşmesi · RIR · plaka ve ısınma hesaplayıcı · süperset · ilk ağırlık önerisi · Strong/Hevy CSV içe aktarma | 1–2 hafta |
| **4 · Google Play** | İlk mağaza | TR/EN + kg/lb · gizlilik politikası · TWA paketi · mağaza görselleri · **12 kişi / 14 gün kapalı test** | 2–3 hafta (testin 14 günü dahil) |
| **5 · App Store** | İkinci mağaza | Capacitor paketi · kalıcı depo · bildirim/titreşim/Sağlık · TestFlight | 2–3 hafta |
| **6 · Gelir (isteğe bağlı)** | S3 | Ücretsiz paket kalıcı; Pro: gelişmiş analiz, program kütüphanesi; ömür boyu seçeneği | sonra |

Faz 2 ile Faz 3 sıra değiştirebilir. 3B kalitesini artırma işi (yeni hareketler, aletler) Faz 1'deki kütüphaneyle birlikte yürür.

---

## 7. Bilerek yapılmaması gerekenler

- **Zorunlu hesap.** En net farkımız.
- **Sosyal akış.** Sunucu ister, Hevy'de bile isteğe bağlı; kimliğimize aykırı.
- **Yapay zekâ sohbet koçu, kamerayla form takibi.** İnternet ister, pahalı, güven kazandırmıyor.
- **Ücretsiz özelliği sonradan paralıya almak, antrenman içinde ödeme veya puan istemek.** Kategorinin en çok kızılan iki davranışı.
- **Kalori ve nabız iddiası.** Apple doğrulanamayan sağlık ölçümünü reddediyor.
- **Yeni logoyu uygulamaya ad kararından önce yaymak.** Ad değişirse iş tekrarlanır.

---

## 8. Kararlar sende

| # | Soru | Önerim |
|---|---|---|
| **K1** | ⚠️ Ad: "FitSet" kalsın mı? | **Mağaza için yeni ve ayırt edici bir ad.** "FitSet" Türkiye'de spor aleti sınıfında tescilli, Play'de iki eş adlı uygulama var. Kişisel kullanımda sorun yok. Aday üretip marka araması yapabilirim. |
| **K2** | Hedef: ücretsiz açık ürün (S2) mi, ücretli (S3) mi? | **S2 ile başla**, ödeme kapısı Faz 6'da (5 Eki kararıyla aynı). |
| **K3** | İlk mağaza? | **Google Play** (paketleme ucuz); App Store yerel özelliklerle sonra. |
| **K4** | İlk iş? | **Faz 1:** program + ilk açılış + kütüphane. Bunlar olmadan diğer her şey yalnız sana yarar. |
| **K5** | İngilizce ne zaman? | Faz 4 (mağaza öncesi). |
| **K6** | Saat uygulaması? | **Ertele.** En çok şikâyet alan alan güvenilirlik; yarım saat uygulaması zarar verir. |
| **K7** | Kapalı test için 12 kişi kimler olacak? | Salondaki çevren; Faz 4'e kadar belirlenmeli. |

---

## 9. Kaynaklar

- Ekran turu: `magaza-2026-10-09/*.png` (390×844, örnek veri yalnız deneme tarayıcısında).
- Rakip kullanım desenleri: `2026-10-09-arastirma-rakip-ux.md` (kaynak listesi içinde).
- Mağaza yayın şartları: `2026-10-09-arastirma-magaza-yayin.md` (kaynak listesi içinde).
- Önceki analiz: `2026-10-05-urun-evrimi-analizi.md` (21 rakibin fiyat ve kütüphane tablosu, dağıtım, 3B yolu).
