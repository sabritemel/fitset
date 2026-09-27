# FitSet tasarım dili analizi ve "Tasarım Dili 3" önerisi

**Tarih:** 27 Eylül 2026 · **Durum:** UYGULANDI (aynı gün, Sabri'nin kararlarıyla; §11). Commit edilmedi.
**Mokap:** [`mockup-tasarim-v3.html`](../mockup-tasarim-v3.html) (bugünkü ekran görüntüleri ile öneri yan yana; öneri ekranlarındaki figürler uygulamanın gerçek 3B motoruyla çizilir).
**Bugünkü ekran görüntüleri:** [`docs/tasarim-2026-09-27/`](tasarim-2026-09-27/)

İstek (Sabri): *"Ekran tasarımlarını, renk, şekil, tasarım çizgisini, buton şekli ve tasarımlarını, renk kullanımını, font, büyüklük, yerleşim, tasarım ve renk seçeneklerini analiz et. Tasarım dilini daha premium, sade ama şık, kullanışlı, kullanımı kolay ve sezgisel, pratik ama işlevsel hale getir."*

---

## 0. Kısaca

- **Karar: temel doğru, cila dağınık.** İki bağımsız değerlendirmenin puanı 28/40 (Nielsen, "İyi" bandı). Odak ekranının iskeleti, tek vurgu rengi disiplini ve veriyi dürüst anlatan mikro metin gerçekten güçlü; bunlar korunuyor.
- **Premium hissini bozan şey renk değil, küçük çatlakların toplamı:**
  - ekranda **18 ayrı punto** (kaynakta 24),
  - metnin **%45'i** en sönük gri tonda,
  - **75 dokunma hedefi** 44 px'in altında,
  - aynı iş için **7 farklı düğme biçimi**.
- **Üç işlevsel boşluk tasarımla birlikte çözülmeli:**
  - Dinlenme sayacı 19 px, değişmeyen ağırlık 76 px.
  - Liste ekranında "devam et" yok; en parlak düğme "Seansı bitir".
  - Ağırlık adımı her ekipmanda sabit 2,5; uygulama doğru adımı zaten biliyor.
- **Öneri "Grafit" (Tasarım Dili 3):**
  - Üç karar aynen kalıyor: tek aile Archivo, tek vurgu rengi, kart yok.
  - Punto 7 basamağa, ağırlık 3'e iniyor; metin tonları net ayrışıyor.
  - Tek düğme dili; her hedef en az 44 px; seçili durum ters dolgu.
  - Çizgisel bir ikon seti geliyor; seans sonuna bir **özet ekranı** ekleniyor.
- **Öneri ölçüldü, iddia değil:**
  - Mokabın öneri ekranları bugünkü uygulamayı ölçen araçla ölçüldü: 7 punto, 3 ağırlık, en düşük kontrast 4,55:1.
  - 60 hedefin 59'u en az 44 px; kalan tek hedef cümle içi bağlantı.
  - 360 px'lik telefonda taşan ya da kesilen metin yok.

---

## 1. Yöntem

| Kaynak | Ne yapıldı |
|---|---|
| **Canlı ölçüm** | Uygulama tek kullanımlık veriyle `:5098`'de açıldı. 9 ekran/durum 390×844'te tarandı: liste, odak (yarım ve tamam), panel, plank, ısınma, ayarlar, geçmiş, seans düzenleme. Bir DOM ölçüm aracı her metnin puntosunu, ağırlığını, rengini ve zemine göre kontrastını, her etkileşimli öğenin boyutunu okudu: **491 metin örneği, 204 dokunma hedefi.** |
| **Değerlendirme A** | Bağımsız tasarım incelemesi. `style.css`, `ui.js` ve `index.html` baştan sona okundu, `app.js`'in ilgili kısımlarıyla 11 ekran görüntüsü incelendi. Tarayıcı kullanılmadı. Çıktılar: Nielsen puanlaması, bilişsel yük, duygusal yolculuk, persona. |
| **Değerlendirme B** | impeccable dedektörü, kaynak üzerinde ve tarayıcıda koşturuldu; ek erişilebilirlik ölçümleri alındı. |
| **Çapraz kontrol** | Değerlendirmelerin öne sürdüğü her kaynak atfı kodda yeniden okundu. Bu raporda geçen satır numaralarının hepsi 27 Eyl'de doğrulandı. |
| **Önerinin ölçümü** | Mokabın öneri ekranları aynı araçla 390 ve 360 px genişlikte ölçüldü (§8). |

⚠️ **Dedektörün kör noktası.** `index.html` 33 satırlık bir kabuk; ekranların tamamı `js/ui.js`'teki şablon dizgilerinden üretiliyor. Kaynak taraması bu yüzden **temiz** çıktı. Asıl kanıt tarayıcı katmanından ve DOM ölçümünden geldi.

---

## 2. Bugünkü dil: ölçülen envanter

| Eksen | Ölçüm | Yorum |
|---|---|---|
| **Punto** | Ekranda **18 ayrı** değer (kaynakta 24): 10,5 · 11 · 11,5 · 12 · 12,5 · 13 · 13,5 · 14 · 14,5 · 15 · 15,5 · 17 · 18 · 21 · 23 · 27 · 34 · 56 (+76) | 10,5–15,5 aralığında yarım piksel adımlarla 11 basamak var; telefonda bu farklar ayırt edilmiyor. Hiyerarşi puntodan okunmuyor, "hafif bulanık" bir his üretiyor. |
| **Küçük metin** | Metin örneklerinin **%65'i 13 px'in altında** (321/491) | Salonda, kolun ucunda, terli ve yorgunken okunan bir uygulama için ağır. |
| **Ağırlık** | 5 değer: 400 · 450 · 500 · 550 · 600 | 400/450 ve 550/600 telefonda ayırt edilmiyor. |
| **Metin tonları** | `#777E88` **%45** · `#CDD1D7` %26 · `#8D939C` %25 | En sönük ton çoğunlukta. İkincil ile sönük arası kontrast yalnız **1,32:1**: üç gri fiilen iki. |
| **Kontrast** | Kırmızı eşikte tek metin: Ayarlar'daki **three.js bağlantısı 2,1:1** (tarayıcı varsayılanı mavi). Pasif gezinme 1,43:1 (pasif, kabul edilebilir). | Bağlantı benim 24 Eyl'de eklediğim satır; `style.css`'te `a` kuralı yok. |
| **Dokunma hedefi** | **75 hedef 44 px'in altında.** Örnekler: üst ikonlar 36×36 · gün/dinlenme çipleri 34 · "geri al" 40×28 · "Geçmiş/Ayarlar" 32 · panel adımlayıcıları 40 · geçmiş satırları 42 · set silme 20×40 | Ana eylemler 48–56 px ve iyi; sorun ikincil ve toparlama eylemlerinde. |
| **Düğme biçimi** | 7 biçim: dolu gri, çizgili, hap çip, daire ikon, yığın adımlayıcı, düz metin, altı çizili metin | Aynı kavramın üç adımlayıcı deseni var: dikey +/− (odak), yatay −/+ (panel), "−5 sn / +5 sn" (plank). |
| **İkon** | Unicode glifler (← → ? ▾ ◆ ✓) | Punto ve ağırlıkla oynar, her ekranda ayrı hizalanır; çizgisel bir sete göre ucuz görünür. |
| **Etiket** | 42 örnek büyük harf, harf aralıklı 10,5 px etiket ("SET / HACİM / SÜRE", "KİLO", "SON SEANSLAR") | "Her bölümün üstünde minik büyük harf" kalıbı artık yapay zekâ üretiminin imzası sayılıyor. Ayarlar ve Geçmiş'te sayfanın tek adı bu etiket. |
| **Vurgu rengi** | `#EE5568`, dört anlamda: canlı (kural) · odak halkası · ısınma satırındaki gradyan ve ◆ · yıkıcı eylem | "Yalnız canlı olan kırmızı" kuralı fiilen gevşemiş. |
| **Metin sesi** | Neredeyse her cümlede uzun tire; kullanıcıya tasarım gerekçesi anlatan paragraflar (ör. `ui.js:544`) | Arayüz ne yapılacağını söylemeli; gerekçe `KULLANIM.md`'nin işi. |

---

## 3. Eleştiri sentezi

### 3.1 Yapay zekâ izi

- **Özü yapay zekâ işi değil; görsel katmanı "özenli ama jenerik koyu minimal" şablonuna yakın.**
- Şablon olmadığını gösteren özgün taraflar:
  - *"tek dambıl · hacimde ×2"*, *"bar dahil toplam"*, *"Dinlenme 12 sn önce bitti"* gibi alan bilgisi taşıyan metinler.
  - Gerekçeli ağırlık önerisi.
  - Sürüklenebilen 3B manken.
  - Dürüst hata şeridi.
- Şablon izi taşıyanlar:
  - Siyaha yakın zemin üstünde tek mercan kırmızısı.
  - Her yerde 10,5 px büyük harfli, harf aralıklı etiket.
  - "SET / HACİM / SÜRE" üçlü istatistik satırı.
  - Kesik çizgili "finisher" kutusu ve ◆ glifi.
  - Her cümlede uzun tire.

### 3.2 Nielsen sezgisel puanları (Değerlendirme A)

| # | Sezgisel | Puan | Özet gerekçe |
|---|---|---|---|
| 1 | Sistem durumunun görünürlüğü | 3 | Ray ve "N. seti kaydet" iyi. Liste "nerede kaldım"ı göstermiyor; canlı sayaç 19 px. |
| 2 | Gerçek dünyayla eşleşme | 3 | Türkçe sayı biçimi ve ekipman ipuçları çok iyi. Ağırlık adımı sabit 2,5. |
| 3 | Kullanıcı denetimi | 3 | Neredeyse her şey geri alınabiliyor; "Seansı bitir"in onayı da geri alması da yok. |
| 4 | Tutarlılık | **2** | 24 punto, 5 ağırlık, 3 adımlayıcı deseni, dört şekil ailesi, vurgu dört anlamda. Kendi *"hiçbiri altı çizili değil"* kuralı `style.css:177` ve `:343`'te çiğneniyor. |
| 5 | Hata önleme | 3 | İşlemsel kayıt ve gün kilidi güçlü. En büyük, en parlak düğme ölümcül eylem. |
| 6 | Tanıma > hatırlama | 3 | "Geçen sefer" ve ön doldurma mükemmel. Hedef ayarı "?"nin arkasında; 3B'nin döndürülebildiği yalnız `title`'da yazıyor. |
| 7 | Esneklik ve verimlilik | **2** | Ekipmana göre adım yok; dambıl değişiminde klavye kaçınılmaz. |
| 8 | Estetik ve minimalizm | 3 | Odak ekranı gerçekten sade. Liste her açılışta amber uyarı ve yasal paragraf taşıyor. |
| 9 | Hata tanıma ve toparlanma | 3 | Hata mesajı sebebi ve çareyi söylüyor. Kilitli gün seçici, seçilemeyen seçeneklerle dolu. |
| 10 | Yardım | 3 | Hareket başına bağlamsal panel iyi; panel önce hedef yapılandırmasını gösteriyor. |
| | **Toplam** | **28/40** | **İyi**: sağlam temel; tutarlılık, verimlilik ve cilada gerçek boşluklar. |

**Bilişsel yük: 5/8.**
- Odak ekranı iyi yönetilmiş.
- Yük üç yerde birikiyor:
  - liste ekranı (15 seçenek, "sıradaki" işaretsiz),
  - dinlenme anı (tek satırda 4 küçük hedef),
  - "?" paneli (yapılandırma ile öğretim aynı yüzeyde).

### 3.3 Duygusal yolculuk: en zayıf an seansın sonu

- **Isınma**, yolculuğun en "premium" anı: sakin, mini figürler, sayaç yok.
- **Set kaydı** doğru bir küçük tepe: 15 ms titreşim, rozet, düğme etiketinde +1.
- **İlerleme anı fısıldanıyor.** *"İki seanstır 3 × 12 tamam, 42,5 kg dene"* ağırlık antrenmanının duygusal çekirdeği, ama 12,5 px gri bir bilgi satırı olarak duruyor.
- **Seans sonu bir angaryayla bitiyor** (doğrulandı):
  - `bitir()` yalnız bir bildirim şeridi gösteriyor ([app.js:730](../js/app.js#L730)).
  - Her 8. seansta (`store.js:36`, `backupNagEvery: 8`) 900 ms sonra yedek hatırlatması onu siliyor ([app.js:731-733](../js/app.js#L731-L733)); `toast()` önce mevcut şeridi kaldırıyor ([app.js:44](../js/app.js#L44)).
  - Ardından liste bir sonraki günün **boş** hâline dönüyor.
  - Hacim farkı, aşılan en ağır setler: veri var, o anda gösterilmiyor.

### 3.4 Güçlü yanlar (korunacak)

1. **Odak ekranının iskeleti.**
   - Kaymayan sabit bantlar, esneyen tek görsel bölge.
   - Büyük tabular ağırlık sağ başparmak bölgesindeki adımlayıcıyla eşleşiyor.
   - "2. seti kaydet" etiketi "hangi setteyim?" sorusunu ortadan kaldırıyor.
2. **Renk disiplini işe yarıyor.** Kırmızı neredeyse hiç kullanılmadığı için dinlenme sayacı ve plank saati anında öne çıkıyor.
3. **Güven katmanı:**
   - bar dahil / tek dambıl hacim hesabı,
   - ısınma setinin hacme karışmaması,
   - set, gün ve seans düzeyinde geri alma.

   Strong/Hevy'de bile eksik.

### 3.5 Persona uyarı işaretleri

**Sabri, antrenman ortasında (terli, tek el, göz ucuyla):**
- 0:56'yı bir metreden okuyamaz; "+30"a uzanırken "Sonraki →"ya basar.
- 16 kg'dan 18'e geçerken "+" 18,5 yazar; klavye açılır ve kaydet düğmesini örter.
- Yanlış seti geri almak için hedef 28 px yüksekliğinde; hata toparlama en küçük hedefte.
- "Isınma seti" basılıyken yalnız çerçevesi değişiyor. Basılı olduğu fark edilmez, ve çalışma seti hacimden düşer.

**İlk kez açan kullanıcı:**
- Gün değiştirmenin tek girişi 22 px'lik ▾.
- Hedef ayarı "?" ikonunun arkasında.
- "× 12 tekrar" düğme olduğunu belli etmiyor; geçmiş satırları düzenlemeye açılıyor ama işaret yok.
- İngilizce hareket adı birincil, Türkçesi alt satırda.

### 3.6 Dedektör ve tarayıcı bulguları (Değerlendirme B)

| Bulgu | Hüküm | Kaynak |
|---|---|---|
| `skipped-heading`, liste ekranı: h1 "1. Gün" → h3 (h2 yok) | **Gerçek** | [ui.js:166](../js/ui.js#L166), `:181` |
| `skipped-heading`, diğer ekranlar | **Yanlış pozitif**: dedektör gizli (`display:none`) ekranların başlıklarını da geziyor | — |
| `text-overflow`: geçmişte hareket adları kesiliyor | **Gerçek bilgi kaybı**: 17 addan **8'i** kesik, dedektör eşiği (16 px) yüzünden 5'ini görüyor; tam ad için `title` yok | [ui.js:540](../js/ui.js#L540), `style.css:464` |
| `body-text-viewport-edge`: lisans satırı ekran kenarına yapışık | **Gerçek** | [ui.js:696-697](../js/ui.js#L696-L697) (`.sect` dışında, dolgu yok) |
| `single-font` (yalnız Archivo) | **Bilinçli karar**: ürün arayüzünde tek aile, farklı ağırlıklarla, kabul gören bir yol. Korunuyor. | `style.css:65` |
| Lisans bağlantısı 2,1:1 | **Gerçek** (dedektör `<a>`'yı ölçmüyor, tarayıcıda ölçüldü) | `style.css`'te `a` kuralı yok |
| Kapalı alt panel `aria-hidden` ama içinde 11 odaklanabilir kontrol | **Gerçek** (axe `aria-hidden-focus` sınıfı; DOM durumu ölçüldü, Tab ile sınanmadı) | `#sheet`: `inert` değil |
| Geçmiş ekranında hiç başlık yok; listedeki h1 bir `button` içinde | **Gerçek** | [ui.js:166](../js/ui.js#L166) |

---

## 4. Öncelikli sorunlar

### P1: Dinlenme sayacı en çok bakıldığı anda en küçük öğe

- **Ne:**
  - Canlı sayaç 19 px ([style.css:291](../css/style.css#L291)).
  - "+30" `padding: 4px 8px` ile ~26 px yükseklikte.
  - "geç" stilsiz düz metin, ~20 px.
  - Üçü de "← Önceki" ve "Sonraki →" ile aynı satırda.
  - Aynı anda ekranın kahramanı, zaten seçilmiş ve değişmeyen 76 px'lik ağırlık ([style.css:82](../css/style.css#L82)).
- **Neden:** Setler arasında telefon sehpada ya da yerde; bakılan tek şey kalan süre. Terli başparmakla "+30"a uzanırken "Sonraki →"ya basmak, dinlenmenin ortasında hareketi değiştirir.
- **Öneri** (mokapta "Odak: dinlenme"):
  - Alt bandın yüksekliği her durumda 72 px'e sabitlenir ("kaymaz" kuralı korunur).
  - Sayaç çalışırken yan gezinme çekilir; bant `[+30 | 0:56 | Geç]` olur.
  - Sayaç 32 px tabular, vurgu renginde, altında kalan süre çubuğu.
  - Yan düğmeler 76×56.

### P1: Liste ekranında "devam et" yok; tek birincil eylem ölümcül olan

- **Ne:**
  - `.li.now` stili tanımlı ([style.css:135-136](../css/style.css#L135-L136)), ama `ui.js` bu sınıfı hiç basmıyor (doğrulandı: `ui.js`'te `now` geçmiyor).
  - "Nerede kaldım" yalnız 5 px'lik gri noktalarla anlatılıyor.
  - Ekranın en büyük ve en parlak öğesi "Seansı bitir" ([ui.js:189](../js/ui.js#L189)). İlk setten itibaren etkin; onayı ve geri alması yok.
- **Neden:** Kazara basış seansı kapatır. Devam etmek ikinci bir seans açar ve kayıt geçmişte ikiye bölünür. Uygulamanın geri kalanında her şey geri alınabiliyor; burası tutarsız.
- **Öneri** (mokapta "Liste"):
  - Duruma bağlı birincil düğme: seans sürerken **"Devam et: Bench Fly ›"**; "Seansı bitir" ikincil, yanında.
  - Güncel satır tonlu zeminle işaretlenir.
  - Her satırda set ilerlemesi halka olarak gösterilir.

### P1: Ağırlık adımı sabit 2,5; uygulama doğru adımı zaten biliyor

- **Ne:**
  - Adımlayıcı her ekipmana 2,5 veriyor ([ui.js:321](../js/ui.js#L321)).
  - Oysa öneri motoru `ADIM = { barbell: 2.5, dumbbell: 2.5, machine: 5, cable: 5 }` tablosunu taşıyor ([ilerleme.js:30](../js/ilerleme.js#L30)): makineyi 5'e yuvarlıyor, adımlayıcı 2,5 atlıyor.
  - Kullanıcının dambıl verisi 2 kg adımlı (14 → 16); 16'da "+" 18,5 yazar, salonda olmayan bir dambıl.
- **Neden:** Her dambıl ya da makine değişikliği sayısal klavye açtırıyor. Klavye "kaymaz" ekranın alt yarısını, kaydet düğmesi dahil, örtüyor. "Pratik ve işlevsel" isteğinin tam kalbi burası.
- **Öneri:**
  - Adımlayıcı `ADIM[ekipman]`ı okur.
  - Dambıl adımı bir ayar olur (2 / 2,5).
  - Adım, büyük sayının altında görünür: "+ / − 2 kg (dambıl adımı)".
  - Daha iyisi: kişinin o harekette kullandığı ağırlıklar dizisinde bir sonrakine/öncekine atlar.

### P2: Yazı ve gri sistemi gürültüye dönmüş

- **Ne:** §2'deki punto, ağırlık ve ton ölçümleri.
- **Neden:** Kullanıcının salonda bakması gereken bilgi en küçük ve en sönük puntoda duruyor. Örnekler: odak üstündeki "2/9 · 1/3 SET" 10,5 px sönük gri; plank öğretici metni 11 px.
- **Öneri:** §5'teki ölçek ve tonlar.

### P2: Ödül fısıldanıyor, son angaryayla bitiyor (peak-end)

- **Öneri:** Seans sonu özet ekranı (mokapta "Seans sonu"). İçeriği:
  - süre, set ve hacim,
  - geçen aynı güne göre hacim farkı,
  - bu seansta aşılan en ağır setler,
  - sıradaki antrenman.
- Yedek hatırlatması bu ekranda ikincil düğme olur; artık özetin üstüne yazmaz.
- Yeni renk eklenmez; vurgu yalnız artış ikonunda.

---

## 5. Tasarım Dili 3 "Grafit": ilkeler ve değerler

### 5.1 Korunan üç karar (2. sürümden)

1. **Tek yazı ailesi: Archivo** (değişken, pakette, çevrimdışı). Hiyerarşi aile değiştirerek değil, ölçek ve ağırlıkla kurulur.
2. **Tek vurgu rengi, yalnız CANLI ve ŞİMDİ olan için:** dinlenme sayacı, bulunulan set, süren seans. Odak halkası ve yıkıcı eylem vurgu rengini kullanmaz.
3. **Kart yok.** Bölümler çizgiyle değil tek seviyeli **tonlu grupla** ayrılır; iç içe kart hiçbir yerde yok.

### 5.2 Değişen kararlar

| # | İlke | Bugün | Öneri |
|---|---|---|---|
| 1 | **Hiyerarşi puntodan okunur** | 18 punto | **7 basamak:** 12 · 14 · 16 · 18 · 22 · 32 · 80 |
| 2 | **Az ve net ağırlık** | 5 ağırlık | **3:** 450 gövde · 560 vurgu · 650 başlık/sayı |
| 3 | **İki ton çalışır, üçüncüsü azınlık** | sönük ton %45 | Birincil ve ikincil taşır; sönük ton yalnız birim, sıra no ve dipnot için (mokapta %3,6) |
| 4 | **Tek düğme dili** | 7 biçim | Seviye çizgiyle değil **dolgu tonuyla** ayrışır: ana eylem açık dolgu · ikincil koyu dolgu · çip · daire ikon · adımlayıcı. Altı çizili yazı ve çerçeveli düğme yok. |
| 5 | **Seçili = ters dolgu** | seçili yalnız çerçeve parlaklığı | Seçili çip, gün ya da segment **açık dolgu + koyu yazı**; bir bakışta okunur |
| 6 | **Dokunma** | 75 hedef < 44 px | Her hedef **en az 44 px**; ana eylem 56. Cümle içi bağlantı istisna (WCAG 2.5.8). |
| 7 | **Etiket küçük harf** | büyük harf, harf aralıklı 10,5 px | "Antrenman günleri", "Son seanslar": 14 px, orta ağırlık, ikincil ton |
| 8 | **Çizgisel ikon seti** | Unicode glifler | 17 ikonluk satır içi SVG seti (1,75 çizgi, yuvarlak uç), pakette, çevrimdışı |
| 9 | **Arayüz ne yapılacağını söyler** | gerekçe paragrafları, her cümlede uzun tire | Kısa emir cümleleri; gerekçe `KULLANIM.md`'ye taşınır |

### 5.3 Değerler

| Değer | Bugün | Öneri | Kontrast (zemin `#0B0C0E`) |
|---|---|---|---|
| Zemin | `#0A0B0D` | `--bg #0B0C0E` | — |
| Yüzeyler | `--s1` tek seviye | `--s1 #141619` · `--s2 #1B1E22` · `--s3 #24282D` (basılı) | — |
| Çizgi | — | `rgba(255,255,255,.07)` · `.12` | — |
| Birincil metin | `#CDD1D7` | `--t1 #DADDE2` | 14,4:1 |
| İkincil metin | `#8D939C` | `--t2 #A2A8B0` | 8,1:1 |
| Sönük metin | `#777E88` | `--t3 #7F868F` | 5,3:1 zeminde · **4,55:1** en koyu yüzeyde (`--s2`) |
| Ana eylem dolgusu | `#C8CCD3` | `--btn #E6E8EC` (ekranın en parlak yüzeyi) | — |
| Vurgu | `#EE5568` | `--acc #F06A5D` (mercan, rafine); seçenek: turuncu `#FF8B3E` · buz mavisi `#7DC3EE` | — |
| Uyarı | amber | `--warn #D9AE63`, yalnız ikon/etikette; paragraf amber olmaz | — |
| Köşe yarıçapı | 6 · 10 · 14 | 10 · 14 · 18 | — |

⚠️ **Maketi yaparken düştüğüm tuzak (ve kapı eksiği).**
- İlk taslakta sönük ton `#767D86` idi: zeminde 4,6:1 geçiyor, ama gri yüzeyde **4,36:1** ile AA'nın altında kalıyordu. Ölçüm yakaladı, ton açıldı.
- Bugünkü `tools/check-contrast.js` tonları **yalnız ana zemine** karşı denetliyor; bu hatayı göremezdi.
- Uygulamada kapı her metin tonunu **üzerine konduğu her yüzeye** karşı ölçecek (§9).

---

## 6. Ekran ekran öneriler

Her ekran mokapta "Bugün | Öneri" olarak yan yana.

| Ekran | Değişen |
|---|---|
| **Liste** | Gün adı başlık oluyor: "1. Gün" küçük bir çipe iniyor, **"Göğüs, Omuz, Triceps"** 32 px. Her satırda durum halkası (boş / kısmi / tamam) ve sağda son ağırlık. Güncel satır tonlu. Altta sabit **"Seansı bitir" (ikincil) + "Devam et: Bench Fly ›" (ana)**. Program dışı gün uyarısı amber paragraf değil, tonlu bir bilgi satırı. |
| **Odak** | Set ilerlemesi "1/3 SET" metni ve rozetler yerine hedef kadar **set yuvası**: biten tikli, sıradaki vurgu çerçeveli, kalan boş. Büyük sayı 80 px, altında adım bilgisi. Tekrar satır içi adımlayıcıda. "Isınma seti" basılıyken ters dolgu. |
| **Odak: dinlenme** | §4 P1. Bant yüksekliği değişmez; yan gezinme çekilir, bant sayaca döner. "Geri al" 44 px'lik ikincil düğme. |
| **Isınma** | Satırlar mini 3B figürlerle korunuyor. Uzun adlar iki satıra sarıyor. Mini figürlerin zemin diski artık kırpılmıyor (§7). |
| **Ayarlar** | Tonlu gruplar; **7 günlük eşit ızgara** (bugün "Paz" alt satıra düşüyor). Dinlenme süresi segment kontrolü. Boy alanı sağa yaslı. Yasal not ve lisans atfı en altta, stilli, kenar boşluklu. |
| **Seans sonu (yeni)** | §4 P2. Özet, hacim farkı, en ağır setler, sıradaki antrenman; "Yedek al" (ikincil) + "Tamam" (ana). |
| **Geçmiş** | Başlık h1. Kilo tonlu grupta: sayı, değişim hapı, alan dolgulu çizgi. Seans satırları gün çipiyle taranıyor, hacim sağda. **Hareket ilerlemesi iki katlı**: ad kesilmeden üstte, değer sağda, eğri altta. |

---

## 7. İşlevsel bulgular (tasarımla birlikte kapanacaklar)

| # | Bulgu | Kanıt | Ağırlık |
|---|---|---|---|
| F1 | Ağırlık adımı sabit 2,5; `ADIM` tablosu var ama adımlayıcı okumuyor | [ui.js:321](../js/ui.js#L321) · [ilerleme.js:30](../js/ilerleme.js#L30) | Yüksek |
| F2 | Liste "sıradaki"yi işaretlemiyor; `.li.now` ölü CSS | [style.css:135](../css/style.css#L135) · `ui.js`'te `now` yok | Yüksek |
| F3 | "Seansı bitir" onaysız ve geri alınamaz, ekranın en parlak düğmesi | [ui.js:189](../js/ui.js#L189) · [app.js:719-734](../js/app.js#L719-L734) | Yüksek |
| F4 | Seans özeti şeridi her 8. seansta yedek hatırlatmasıyla siliniyor | [app.js:730-733](../js/app.js#L730-L733) · [app.js:44](../js/app.js#L44) · `store.js:36` | Orta |
| F5 | Lisans bağlantısı 2,1:1, ekran kenarına yapışık | [ui.js:696](../js/ui.js#L696) | Orta (benim 24 Eyl kusurum) |
| F6 | Kapalı alt panel `aria-hidden` ama odaklanabilir (11 kontrol) | `#sheet`, `inert` değil | Orta |
| F7 | Geçmişte hareket adları kesik (8/17), `title` yok | [ui.js:540](../js/ui.js#L540) | Orta |
| F8 | Başlık yapısı: listede h1 → h3 atlaması, h1 düğme içinde; geçmişte hiç başlık yok | [ui.js:166](../js/ui.js#L166), `:181` | Düşük |
| F9 | Isınma mini figürlerinde zemin diski alttan düz bir çizgiyle kesiliyor | Kök: [manken3d.js:492-513](../js/anim3d/manken3d.js#L492-L513) `cerceve()` yalnız gövde noktalarını sığdırıyor, [webgl.js:238](../js/anim3d/webgl.js#L238)'deki 78 birimlik disk hesaba girmiyor | Düşük (benim 24 Eyl kusurum) |
| F10 | Plank varyantları her sette ekranın yarısını alıyor; *"öğrenirken lazım, her set arasında değil"* kararıyla çelişiyor | `ui.js:216-219` | Düşük |

**F9'un düzeltmesi mokapta gösterildi.** Çerçevenin alt sınırı diskin izdüşümünün en alt noktasına indiriliyor (mokabın betiğindeki `diskDahilCerceve`). Uygulamada bu hesap `manken3d.cerceve`'ye taşınır ve SVG yedek de aynı çerçeveyi kullanır.

---

## 8. Önerinin ölçümü (aynı araçla)

| Ölçü | Bugün (canlı uygulama) | Öneri (mokap) |
|---|---|---|
| Ayrı punto | 18 | **7** (12 · 14 · 16 · 18 · 22 · 32 · 80) |
| 13 px altındaki metin | %65 | **%2,7** (yalnız 12 px set etiketleri) |
| Ayrı ağırlık | 5 | **3** (450 · 560 · 650) |
| Sönük tondaki metin | %45 | **%3,6** |
| En düşük metin kontrastı | 2,1:1 (bağlantı) | **4,55:1** |
| 44 px altındaki hedef | 75 | **1 / 60** (cümle içi bağlantı) |
| 360 px'te taşan/kesilen metin | geçmişte 8 ad kesik | **0** |
| Düğme biçimi | 7 | 5 (ana · ikincil · çip · daire ikon · adımlayıcı) |

Sınırlar:
- Mokap statik; etkileşim ve animasyon yok.
- Ölçüm tarayıcıda 390 ve 360 px genişlikte yapıldı, gerçek telefonda değil.
- Vurgu seçenekleri salon ışığında denenmedi.
- Ayarlar'daki 7 günlük ızgara 360 px'lik telefonda 40×44'e iniyor (yükseklik korunuyor).

---

## 9. Uygulama planı taslağı (onaydan sonra)

Kod, planın onayından sonra yazılır. Önerilen sıra: kullanıcıya en çok dokunan işlev önce, görsel dil sonra.

| Faz | İçerik | Kapı |
|---|---|---|
| **F1: İşlev** | Dinlenme bandı (P1) · "devam et" + güncel satır (P1, F2, F3) · ekipmana göre adım (P1, F1) · lisans satırı (F5) · `#sheet` `inert` (F6) · başlık yapısı (F8) · mini disk çerçevesi (F9) | `npm test` + yeni birim testleri (adım tablosu, devam hedefi) |
| **F2: Dil** | `style.css` değerleri: 7 punto, 3 ağırlık, üç ton, yüzeyler, yarıçaplar, tek düğme dili, ters dolgu, 44 px, küçük harf etiket, SVG ikon seti | `check-contrast.js` **her tonu her yüzeye karşı** ölçecek şekilde genişler; puntoların ölçekte olduğunu tutan yeni bir kapı |
| **F3: Ekranlar** | Liste · odak · ısınma · ayarlar · geçmiş, mokaptaki gibi | Canlı ölçüm aracıyla §8 tablosunun uygulamada tekrarı; 360 ve 390 px |
| **F4: Seans sonu** | Özet ekranı; yedek hatırlatması onun içinde | Özetin hacim farkı ve en ağır set hesabı için birim testi |

Her fazda: SW önbellek sürümü (`bump-sw`), `KULLANIM.md` ve `CLAUDE.md` güncellenir, yayından önce depo gizli bilgi ve kişisel veri için taranır.

---

## 10. Kararlar (Sabri, 27 Eyl)

1. **Vurgu rengi:** mercan.
2. **Kapsam:** tüm tasarım dili, tek turda.
3. **Seans sonu özet ekranı:** eklensin.
4. **Hareket adı:** İngilizce birincil kalsın.
5. **Plank varyantları:** ilk set kaydedilince küçülsün (uygulamada: yalnız doğru duruş kalır, hatalar ? paneline geçer).

---

## 11. Uygulama (27 Eyl)

### 11.1 Ne yapıldı

| Katman | Değişiklik |
|---|---|
| **Mantık** (Node'da test edilir) | `ilerleme.agirlikAdimi` tek adım kaynağı (bar 2,5 · makine/kablo 5 · dambıl ayardan 2/2,5), öneri de aynı adıma yuvarlanır · `session.devamHedefi` + `siradakiEylem` (liste ekranının ana düğmesi) · `session.seansOzeti` (hacim farkı aynı güne göre, yalnız artan en ağır setler, kayıtsız gün kıyas dışı) · `session.reopen` (bitirmenin geri alması) · `store` yeni ayar `dambilAdimi` (içe aktarmada doğrulanır) |
| **3B motor** | `manken3d.cerceve('sabit')` zemin diskinin ön kenarını sığdırır (`ZEMIN_R`, SVG ve WebGL aynı sabiti okur) |
| **Stil** | `css/style.css` baştan: §5 değerleri, tek düğme dili, tonlu gruplar, sabit yükseklikli alt bant |
| **Şablonlar** | `js/ui.js` baştan: yedi ekran + yeni **Seans sonu** (`#summary-screen`); ikon sprite'ı `index.html`'de |
| **Kabuk** | `js/app.js`: alt bant tümüyle sayaca döner, "şimdi" yuvası kutudaki değeri ön izler, kapalı panel `inert`, seans sonu akışı + "Geri al", dambıl adımı ayarı |
| **Kapılar** | `check-contrast.js` her tonu her yüzeye karşı + ton ayrışması · yeni `check-tasarim.js` (punto/ağırlık/renk yalnız değişkenden, büyük harf ve kalın yan şerit yok, satır içi stil yalnız veri, ikonlar sprite'ta) — **mutasyon 12/12**, geri yükleme bayt-birebir |
| **Testler** | `test-session.js` +33 (adım, devam hedefi, özet, yeniden açma, şablonlar) → 268 |
| **Belgeler** | `KULLANIM.md` (Liste, Odak, Isınma, **Seans sonu**, Geçmiş, Ayarlar, test tablosu) · `CLAUDE.md` |

### 11.2 Mokaptan sapmalar ve sebepleri (hepsi ölçümden)

| Mokapta | Uygulamada | Neden |
|---|---|---|
| birincil metin `#DADDE2`, ana düğme `#E6E8EC` | `#D2D6DC` (0,670), `#D4D8DE` (0,684) | 2. sürümün **parlaklık tavanı** (0,70, *"gözü yormasın"*) kapıda duruyordu ve mokabın tonları onu aşıyordu (0,72 / 0,80). Tavan korundu; kontrast yine ≥ 13:1 |
| "Seansı bitir" + "Devam et: …" (ok ikonlu, tek satır) | **"Bitir"** + iki satırlı "Devam et / hareketin tam adı", ok yok, ad gerekirse sarar | 18 adın gerçek fontla ölçümü: en uzun 251 px, eski düzende ada 163 px kalıyordu ve ad kesiliyordu. Ekran okuyucu yine "Seansı bitir" duyar |
| "Geri al" yuvaların yanında | **üst çubukta**, "?"nin yanında | 360 px'te yuvaya 61 px kalıyor, "42,5 × 12" (72 px) ve "Set 2 · şimdi" (75 px) kırpılıyordu |
| yuva değeri "16 × 12", etiket "Set 2 · şimdi" | "16×12", "Şimdi"; 4 yuvada değer 14 px | aynı ölçüm; "142,5×12" 360 px'te 4 yuvayla ancak böyle sığıyor |
| yarım gün bandında düğmeler yan yana | alt alta | iki uzun etiket 360 px'te yan yana sığmıyor |
| panel tutamacı 28 px | 44 px | dokunma hedefi |
| boy/kilo kutusu `span` | `label` | dolguya dokunmak alanı odaklamıyordu (gerçek hedef rakamın kendisiydi) |
| kısmi yay her satırda vurgu | yalnız "şimdi" satırında vurgu, diğerleri nötr | iki yarım hareket iki mercan yay oluyordu: vurgu "yalnız şimdi" kuralını çiğniyordu |

### 11.3 Canlı ölçüm (tarayıcı, 9 ekran/durum + seans sonu; aynı araç, kaydırma çubuğu gizli)

| Ölçü | Bugün (26 Eyl) | 390 px | 360 px |
|---|---|---|---|
| Ayrı punto | 18 | **7** (12·14·16·18·22·32·80) | 7 |
| 13 px altındaki metin | %65 (321/491; 10,5–12,5) | %22,8 (94/413), **hepsi tam 12 px**; 81'i düzenleme ekranındaki birim ve set no | aynı |
| Ağırlık | 5 | **3** | 3 |
| Sönük tondaki metin | %45 | **%7,3** (30/413) | %7,2 |
| En düşük metin kontrastı (pasif düğme hariç) | 2,1:1 | **4,93:1** | 4,93:1 |
| 44 px altındaki dokunma yüzeyi | 75 | **0 / 197** (cümle içi lisans bağlantısı hariç) | gün çipleri 40×44 (ilan edilen sınır) |
| Kırpılan metin | geçmişte 8 ad | **0** | 0 |
| Yatay taşma | yok | yok | yok |

Ek doğrulamalar (canlı): alt bant iki durumda da 72 px · +30 toplamı 90'a çıkarıyor · kapalı panelde
odaklanabilen kontrol 11 → **0** · dambıl adımı 2 kg seçilince 18 → 20 · plank ilk setten sonra tek figür ·
seans sonu → "Geri al" seansı diskte `active` olarak geri açtı · konsolda uygulama hatası yok · service
worker yeni sürümü iki yoldan da uyguladı (set yokken kendiliğinden, set varken "Şimdi yenile").

⚠️ **Ölçüm aracının kendi hataları** (üçü de yakalandı, sonuçlardan önce düzeltildi): `color-mix()`
renkleri `oklab()` döndüğü için araç çöktü (tuvale boyayıp okuma eklendi, bilinen renkle doğrulandı) ·
kesilme denetimi +1 px tolerans yüzünden 0,24 px'lik taşmayı yuttu (tarayıcı üç noktayı bu kadarında
koyuyor; tolerans kaldırıldı, bilerek taşan kutuyla doğrulandı) · otomasyonda kare döngüsü durunca
+30 çalışmıyor gibi göründü (500 ms'de 1 kare; ekran görüntüsü kareyi çizdirince doğru çıktı).

### 11.3b İkinci tur (27 Eyl, Sabri'nin üç isteği)

1. **Ortadaki animasyon alanı büyüdü:** "Geçen sefer" ayrı bant olmaktan çıkıp ağırlığın altına, +/−
   düğmelerinin yanındaki boş alana taşındı; +/− düğmeleri adımı üstünde yazıyor ("+5 / −5", ayrı adım
   satırı kalktı); +/− 56 → 52 px, alt bant 72 → 64 px, dolgular daraldı; sayı kutusunun gizli 11 px'i
   (tarayıcı fontun doğal satır yüksekliğini veriyordu) kapandı. Ölçüm: **720 px'te 198 → 259 px (+%31)**,
   844 px'te ≈ 281 → 336 px. (Grafit öncesi uygulamada, hiç set yokken 378 px'ti; fark set yuvaları ve
   tekrar satırından.)
2. **6 tekrar, sonra durur; dururken dokununca ya da döndürünce 6 tekrar daha.**
3. **Başladığı pozda biter, duran görüntü başlangıç pozu, sıçrama yok.** Kök iki yerdeydi: ısınma
   figürleri dururken hareketin ortasında (t=0,55) çiziliyordu; odak ekranında set kaydı ekranı yeniden
   kurunca animasyon baştan başlıyordu. Kural `sahne.animT`'de, `fizik-denetimi`'nde sınanıyor
   (21 hareket + 5 ısınma, mutasyon 5/5 — ilk turda 4/5: son kareyi tam süre anında ölçmek sıfırlamanın
   yokluğunu gizliyordu).

Canlı doğrulama (piksel karşılaştırması): 6 tekrarın sonunda tuval başlangıç karesiyle **birebir aynı**
(fark 0, iki turda) · oynarken set kaydı animasyonu baştan başlatmadı · dokunma ve döndürme duran figürü
oynattı · ısınmada sırası geçen figürler duran karelerine birebir döndü.

### 11.3c Üçüncü tur: aletler ve hareket denetimi (27 Eyl)

Sabri: *"Seated Cable Row'da halat tam karşıdan çıkmalı · dambıl ve halterlerin kalınlığı yok, karşıdan tek
piksellik çizgi · bütün hareketleri kontrol et · en azından şekil olarak gerçeklere uygun olsun."*

- **Kök:** plakalar, dambıl başları ve makara düz tek bir çokgendi (`disk()`): kenardan genişlik **0 px**
  (ölçüldü). Yeni silindir parçası kenardan kendi kalınlığında (plaka 4 cm), yüzden çapında görünür.
- **Dambıl:** altıgen kauçuk başlar, sap 13 · baş Ø14 · toplam 25 cm (eskiden 18 cm, Ø11 düz daireler).
  **Halter:** Ø2,8 gövde, kovan, yaka, Ø32 + Ø21 kalın plakalar, kilit; 1,6 m (eskiden 1 m çubuk + iki düz daire).
  **Makara:** kalın teker + göbek. Hammer curl'de dambıllar uyluğa değmesin diye ön kol biraz daha dışa.
- **Seated Cable Row:** makara 40 → 70 cm, tam karşıda bir kolonda; kablo yere paralel (0,0°).
- **22 hareketin görsel denetimi** (4 açı: başlangıç, bitiş, önden, yandan): bulunan ve düzeltilen —
  *Bench Press göğüste başlıyordu* (gerçekte kollar düz başlar; artık yukarıda başlar ve biter) ·
  *Incline Chest Press pivotu ve kolları havadaydı* (dikme + şase) · *sırt minderleri havadaydı*
  (Shoulder Press, Incline Press, Leg Press: oturağa destek) · *Leg Press rayları havadaydı* (dikme + taban).
  Diğer hareketler (fly, reverse fly, pushdown, overhead ext., pulldown, row'lar, curl'ler, lunge, calf raise,
  plank, 5 ısınma) gerçekçi bulundu. Bilinçli basitleştirme: cable curl ve front raise makarası yerde bir
  tabanda (kule kolonu figürün önünü kapatırdı).
- **Kapılar:** fizik denetimi kalınlıksız daireyi, dambıl ölçüsünü, kablonun yataylığını ve bench'in başlangıcını
  tutar — mutasyon 5/5; SVG yedek 198 çizimde hatasız.

### 11.4 Sınırlar

- Gerçek telefonda değil, tarayıcıda 390 ve 360 px genişlikte ölçüldü. **Sabri'nin gözle testi gerekiyor**
  (salon ışığında vurgu, ısınma figürleri, dinlenme bandı).
- 360 px'te 7 gün tek satırda 44 px'e sığmaz: 40×44 (WCAG 2.5.8 AA 24 px'i rahat karşılar).
- Hareket verisindeki uzun tireler (açıklama metinleri) bu turda değiştirilmedi; arayüz metinlerindekiler temizlendi.
- Eski iki 3B mokabı aynı stil sayfasını paylaştığı için yerel bir uyumluluk bloğu aldı.

## Ek: Dosyalar

| Dosya | Ne |
|---|---|
| `mockup-tasarim-v3.html` | Mokap (uygulamaya dokunmaz; öneri stilleri yalnız `.v3` kabının içinde) |
| `docs/tasarim-2026-09-27/*.png` | Canlı uygulamadan 8 "bugün" ekran görüntüsü |
| Bu belge | Analiz, ölçüm ve öneri |
