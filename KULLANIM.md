# FitSet — Kullanım

Salon antrenman defteri. Çevrimdışı çalışır, veri telefonda kalır.

> **Son güncelleme: 27 Eylül 2026** (tasarım dili 3). Bu belge `tools/check-docs.js` ile koda bağlıdır:
> uygulamaya yeni bir ekran ya da test betiği eklenip burada anlatılmazsa `npm test` kırmızı yanar.
> (28 Temmuz sürümü iki ay boyunca "Ayarlar ekranı yok" demeye devam etmişti.)

---

## 1. Telefona kurulum

**Android · Chrome**

1. Uygulamanın adresini Chrome'da aç: `https://sabritemel.github.io/fitset/`
2. **Ayarlar → Uygulama → Telefona yükle**'ye bas. (Düğme yoksa sağ üstteki **⋮** menüsünden
   **"Uygulamayı yükle"**.) Chrome bir kurulum penceresi açar: açıklama ve ekran görüntüleriyle.
3. **FitSet** uygulama çekmecesine ve ana ekrana kendi simgesiyle eklenir. **Mağaza gerekmez.**
   Oradan açtığında adres çubuğu görünmez, tam ekran açılır. Siteyi güncelledikçe uygulama da
   kendiliğinden güncellenir.
4. **Kayıtların aynen kalır:** uygulama tarayıcıyla aynı depoyu kullanır. Tersi de geçerli — Chrome'un
   site verisini silersen uygulamanın kayıtları da gider; arada bir **yedek al**. Uygulama açılışta
   tarayıcıdan verinin **kalıcı** saklanmasını ister (kurulu uygulamalara çoğunlukla verilir).

**İlk açılışta internete bağlı ol.** Uygulama kendini bir kez indirir; sonrasında uçak modunda bile açılır.

> **Neden dosyayı indirip açamıyorum?** Tarayıcılar `file://` üzerinde service worker'ı kaydetmez ve
> **IndexedDB'yi bloklar**. Yani indirilen dosya programı gösterebilir ama **hiçbir kaydı saklayamaz**.

---

## 2. Ekranlar

### Liste

"Bugün ne var, nerede kaldım." Üstte tarih; sağda **Geçmiş** (çizgi grafik) ve **Ayarlar** düğmeleri.

- Başlık günün **kas grupları** ("Göğüs · Omuz · Triceps"). Üstündeki **1. Gün ⌄** çipi **gün
  seçiciyi** açar: program sıradaki günü önerir, hangi günü yapacağına sen karar verirsin. Bugün set
  girdiysen gün kilitlenir (girilen setler yanlış güne bağlanmasın diye); sebebi yazar.
- Telefonsuz yaptığın bir günü **"yapıldı işaretle"** ile kayda geçirebilirsin. Sıra ilerler,
  geçmişte **kayıtsız** diye görünür; ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.
- **Set / Hacim / Süre** özeti, altında **Isınma** satırı, günün hareketleri ve antrenman sonu
  kardiyosu. Her satırın solundaki **daire** durumu gösterir: boş · kısmen dolu (yay) · tik.
  Sağda o hareketin ağırlığı: bugün girdiysen bugünkü, girmediysen **geçen** seferki.
- **Kaldığın hareket** tonlu satırla işaretlidir.
- En alttaki **ana düğme** sıradaki işi söyler: önce **Isınmaya başla**, sonra **Başla / Devam et:
  hareketin adı**. Yanındaki **Seansı bitir** ikincildir; bütün hareketler bitince ana düğme olur.
- Bir önceki gün **yarım kaldıysa** (hareketlerin yarısından azı yapıldıysa) listenin üstünde bir bant
  sorar: **Sıradakine geç** ya da **Bu güne devam et**. Cevabın kaydedilir, bir daha sorulmaz.
- Programın dışında bir günde açarsan "Program günü değil; yine de kaydedebilirsin" notu çıkar.
- **Bugünü sıfırla** artık Ayarlar'da.

### Isınma

Listede numarasız ilk satır. Önce 3 dk kardiyo, sonra o günün eklemlerine yönelik hareketler ve
ilk ağır hareketin hafif hazırlık seti. **Sayaç ve işaret yok**; ekran yalnız gösterir. Figürler
sırayla birer tekrar oynar, dokunduğun hemen öne gelir; duran figür hareketin **başlangıç pozundadır**
ve oynayınca oradan başlayıp orada biter (hiçbir yere sıçramaz). **Isınma tamam, 1. harekete geç** doğrudan ilk harekete
götürür. Isınma sete ve hacme sayılmaz.

### Odak

Bir harekete dokununca açılır. Tek hareket, tam ekran, **kaymaz** — her şey tek bakışta görünür.

- Üstte `hareket / toplam` ve ilerleme şeridi, solda geri, sağda **?** paneli.
- Ortada hareketin **3B animasyonu** — ışıklı, yüzsüz bir çizim mankeni. Harekete girince **6 tekrar**
  oynar ve **başladığı pozda durur**; duran figüre **dokununca ya da döndürünce 6 tekrar daha** oynar.
  Set kaydetmek oynayan animasyonu baştan başlatmaz. **Parmakla sürükleyerek döndür**, hareketi her
  açıdan gör; **çift dokunuş** ilk açıya döndürür. Plank gibi süreli
  hareketlerde ilk sette doğru duruş + iki yaygın hata alt alta, aynı ölçekte; **ilk set kaydedilince
  yalnız doğru duruş kalır** (hatalar ? panelinde).
- Hareketler adlarından ve kaynaklardan (ExRx, ACE, NSCA) çizildi ve her kare bir **fizik
  denetiminden** geçer: aynı barı tutan eller arası sabit, makine kolu kendi ekseninde döner, ayak
  yerde kaymaz, diz doğru yöne bükülür. **Aletler gerçek ölçülerinde** çizilir: altıgen kauçuk başlı
  dambıl (25 cm), kovanlı, yakalı ve kalın plakalı halter, tekerlekli makaralar; makinelerin
  gövdeleri, rayları ve minder destekleri yere oturur. Bench press kollar düzken başlar.
- **Set yuvaları**: hedef set sayısı kadar yuva. Biten set tikli ve değeriyle, sıradaki **Şimdi**
  çerçeveli (kutudaki değeri ön izler), kalanlar boş. Isınma setleri ayrı yuvada, sayılmaz.
  Üst çubuktaki **↶** son seti geri alır.
- **Şimdi yuvasına dokun → "Bu set" paneli** (ekran sade kalsın diye tekrar ve ısınma burada):
  - **Tekrar** hedeften gelir; hedeften farklı yaptıysan `− / +` ile ya da yazarak **yalnız bu set**
    için değiştir (hedefin kendisi ? panelinden değişir). 12 yerine 10 yaptığın seti 12 diye
    kaydetmek veriyi yanlışlar.
  - **Isınma seti** anahtarı: açıkken set hacme ve "geçen sefer"e karışmaz. Açıkken ana ekran bunu
    söyler: yuva **Isınma** yazar, düğme **Isınma setini kaydet** olur.
- **Ağırlık** kutusu geçen seferki değerle dolu gelir. Yanındaki düğmeler **adımı üstünde yazar**
  (ör. **+5 / −5**); adım **ekipmandan** gelir: bar 2,5 kg, makine ve kablo 5 kg, dambıl Ayarlar'daki
  **dambıl adımı** (2 ya da 2,5). Üstünde ne girmen gerektiği yazar: *bar dahil* · *tek dambıl ·
  hacimde ×2* · *makinede seçili*. Hemen altında **geçen sefer** yaptığın setler. Hiç kaydı olmayan
  harekette kutu boştur ve sönük **0** gösterir; ağırlık girilmeden set kaydedilmez.
- **Ağırlık önerisi** ana ekranda değil, **? panelinde** (hedefin üstünde): bir hareketi **iki seans
  üst üste** aynı ağırlıkla, hedef set sayısında ve her sette hedef tekrara ulaşarak yaptıysan
  *"İki seanstır 3 × 12 tamam: 42,5 kg dene"* yazar.
  **Uygula** yalnız kutuya yazar; seti kaydetmek senin kararın. Artış bileşik harekette ~%5, izole
  harekette ~%2,5; `+ / −` ile **aynı adıma** yuvarlanır (bar 2,5 · dambıl ayardaki · makine ve
  kablo 5 kg). Adım çok büyükse
  (ör. 10 kg dambılda +2,5 = %25) önce **tekrar** artırmanı önerir. Bugün önerilen ağırlığa çıktıysan
  satır kaybolur. (Kural: ACSM 2009 "iki ardışık seans" + çift ilerleme.)
- **N. seti kaydet** → set kaydedilir, dinlenme sayacı kendiliğinden başlar. Hedef set sayısına
  ulaşınca düğme ikiye bölünür: **Fazladan set** / **Sonraki hareket**.
- Alt bantta **Önceki · Dinlenme · Sonraki**. Dinlenme çalışırken **bant tümüyle sayaca döner**:
  **+30** · kalan süre (büyük, çubukla) · **Geç**. Önceki/Sonraki o sırada bantta yoktur; dinlenme
  ortasında yanlış dokunuşla hareket değişmez. Bandın yüksekliği hiç değişmez.

**? paneli** (aşağı kaydırarak ya da boşluğa dokunarak kapanır): varsa **ağırlık önerisi**, hareketin **hedefi**
(set · tekrar · ağırlık; hoca programı değiştirdiğinde buradan güncelle, **Programa dön** ile
geri al), çalışan kaslar, adım adım anlatım, süreli harekette doğru duruş ve yaygın hatalar,
ve **dikkat** notu.

**Süreli hareketler (Plank):** hedef süreyi `−5 / +5` ile ayarla, **Başlat**'a bas; süre dolunca set
kendiliğinden kaydedilir. Erken bırakırsan **Kaydet** ile elle kaydedebilirsin.

> **"Kaydedilemedi" uyarısı çıkarsa:** telefonun depolaması yazmayı reddetmiştir (dolu depolama,
> tarayıcı kısıtı). Set kaydedilmemiştir ve ekranda da görünmez — tekrar dene. Sürerse hemen
> **yedek al**. (24 Eylül öncesinde bu durum sessiz kalıyor ve sonraki dokunuş fazladan set
> yazıyordu.)

### Seans sonu

**Seansı bitir**'e basınca açılır. Süre, çalışma seti sayısı ve hacim; **geçen aynı güne göre hacim
farkı**; bu seansta **geçen seferden ağır** yaptığın hareketler (ör. *42,5 → 45 kg*) ve sıradaki
antrenman. Yedek zamanı geldiyse (her 8 seansta bir) burada söylenir; **Yedek al** her zaman yanında.

- **Geri al**: yanlışlıkla bitirdiysen seansı yeniden açar, liste kaldığın yerden sürer.
- **Tamam**: sıradaki günün listesine geçer.

(27 Eylül'den önce seans sonu tek bir bildirim şeridiydi ve yedek hatırlatması onu siliyordu.)

### Geçmiş

- **Kilo:** son değer, ilk ölçümden bu yana değişim ve alanlı çizgi. **Bugün** alanına yazıp kaydet
  (20–400 kg). Aynı gün ikinci giriş öncekinin üstüne yazar; alanı boşaltıp kaydedersen bugünün
  kaydı silinir.
- **Son seanslar:** son 12 seans — tarih, gün, yapılan/toplam hareket, hacim. Yarım kalanlar
  *yarım*, telefonsuz işaretlenenler *kayıtsız* etiketi taşır. **Dokununca düzenleme açılır.**
- **Hareket ilerlemesi:** en az iki seansta yapılmış her hareket için **en ağır set** çizgisi
  (ortalama değil, çünkü hafif setler gerçek artışı gizlerdi). Adın tamamı görünür; değer sağda,
  çizgi altında.

### Seans düzenleme

Geçmişte bir seansa dokununca açılır. Yanlış girilen bir değeri üstüne yazıp alandan çık —
kaydedilir; hacim, "geçen sefer" ve grafikler kendiliğinden yeniden hesaplanır.
Çöp kutusu tek seti siler (**Geri getir** ile geri alınır); **Bu seansı sil** seansı geçmişten
kaldırır ve sırayı yeniden hesaplar (o da geri getirilebilir). Son set silinince seans da silinir.

### Ayarlar

- **Antrenman günleri:** hangi günler program günü (en az bir gün seçili kalmak zorunda).
  *Sıradaki* satırı hemen güncellenir.
- **Setler arası dinlenme:** 30 / 45 / 60 / 90 / 120 sn (varsayılan 60).
- **Dambıl adımı:** 2 kg ya da 2,5 kg (varsayılan 2,5). Salonundaki dambıl setine göre seç; odak
  ekranındaki `+ / −` ve ağırlık önerisi bu adımı kullanır.
- **Boy** (bir kez girilir; kilo takibi Geçmiş'te).
- **Uygulama:** Chrome kuruluma hazırsa **Telefona yükle** düğmesi (bkz. 1. Telefona kurulum).
  Düğme yoksa menü yolu yazar; yüklüyse "Telefona yüklü" der.
- **Yedek al / Geri yükle** (aşağıda).
- **Bugünü sıfırla:** bugün girilen setleri siler; hemen ardından **Geri getir** ile geri alınır.
- En altta sağlık notu ve three.js lisans bağlantısı.

---

## 3. Sıradaki gün nasıl belirleniyor?

Takvimden değil, **son tamamladığın seanstan**. 1. Gün yaptıysan sıradaki 2. Gün'dür — üç hafta
ara versen de. Kaçırılan seans sırayı bozamaz; istersen gün seçiciden değiştirirsin.

**Seansı bitir**'e basmayı unutursan: son setinden **6 saat** sonra seans kendiliğinden kapanır
(bitiş saati son setin saati olur).

---

## 4. Yedekleme — bunu ihmal etme

⚠️ **Veri yalnızca bu telefonda.** Sunucu yok (bilinçli karar: gizlilik ve basitlik). Bunun bedeli:
tarayıcı verisi silinirse ya da telefon kaybolursa **kayıtlar gider**.

**Yedek almak:** Ayarlar → **Yedek al**.
- Paylaşım penceresi açılırsa Drive / WhatsApp / e-posta ile kendine gönder
- Açılmazsa `fitset-yedek-YYYYAAGG.json` diye bir dosya iner

**Geri yüklemek:** Ayarlar → **Geri yükle** → dosyayı seç.
- Aynı seans iki dosyada varsa **daha yeni olan** kazanır; eski kayıt yenisini ezmez
- Aynı yedeği iki kez yüklemek hiçbir şeyi bozmaz
- Başka bir uygulamanın dosyasını reddeder
- Dosyada **bozuk kayıt** varsa (elle düzenlenmiş, yarım kopyalanmış) o kayıtlar **atlanır ve
  sayılır**; sağlam olanlar yüklenir. Özet seans ve kilo kayıtlarını ayrı ayrı söyler.

Uygulama her 8 seansta bir yedek almanı hatırlatır. Silinen seanslar yedeğe girmez.

---

## 5. Güncellemeler

Yeni sürüm yayınlandığında uygulama onu arka planda indirir. **Kaybedilecek bir şey yoksa**
(liste ekranındasın, sayaç çalışmıyor, bugün set girilmemiş) kendiliğinden uygulanır.
Isınma ya da odak ekranındaysan **listeye dönene kadar bekler**. Bugün set girdiysen sorar:
**Şimdi yenile** ya da seansı bitirince kendiliğinden.

---

## 6. Bilinen sınırlar (dürüstlük bölümü)

**Ekran kapalıyken sayaç uyarısı güvenilir değil.** Bu bir tarayıcı kısıtı: sayfa arka plandayken
titreşim yok sayılır, zamanlayıcılar kısılır. Karşılığı:
- Sayaç **duvar saatiyle** çalışır — arka planda kalsa bile kalan süre doğrudur
- Sayaç çalışırken **ekran açık tutulur** (Wake Lock); başka uygulamaya geçip dönünce kilit
  **yeniden alınır** (24 Eylül'den önce alınmıyordu)
- Buna rağmen kaçarsa uygulama *"Dinlenme 12 sn önce bitti"* der — sessizce doğru gibi davranmaz

**Program uygulamanın içine yazılı.** Hedefleri (set · tekrar · ağırlık) ? panelinden
değiştirebilirsin; hareket eklemek, çıkarmak ya da sırasını değiştirmek şimdilik mümkün değil.

**Antrenman sonu kardiyo kaydedilmiyor** — listede yalnız bilgi olarak duruyor.

**Açık tema yok.** Tasarım bilinçli olarak koyu temaya bağlı (tasarım dili 3, "Grafit": tek yazı
ailesi, tek vurgu rengi yalnız canlı olana, kart yerine tonlu gruplar; ayrıntı ve ölçümler
`docs/2026-09-27-tasarim-dili-analizi.md`).

**3B çizim telefonun grafik birimini (WebGL) kullanır.** Açılışı yavaşlatmasın diye ilk kez gerektiğinde
yüklenir; o arada ve WebGL'i olmayan cihazda aynı hareket **bağımsız bir yedek çizimle** (SVG) görünür —
ekran hiçbir durumda boş kalmaz. three.js (MIT lisansı) kullanılır; lisans metni Ayarlar'ın altında.

**Bu bir egzersiz yardımcısıdır, tıbbi tavsiye değildir.** Ağrı hissettiğin bir harekette dur.

---

## 7. Geliştirici notları

**Yerel çalıştırma** — `file://` çalışmaz (ES modülleri ve service worker izin vermez):

```bash
node tools/serve.js          # http://localhost:5099
```

Çıktıda bir de ağ adresi yazar; aynı Wi-Fi'daki telefondan oraya girebilirsin.
(Ağ IP'sinde service worker kaydolmaz — çevrimdışı testi ancak yayındaki adreste yapılabilir.)

**Testler** — `npm test` şu betikleri sırayla koşar:

| Betik | Ne denetler |
|---|---|
| `bump-sw.js` | Önbellek sürümünü dosya içeriğinden tazeler (elle artırmak gerekmez) · **çevrimdışı kapısı**: listedeki her dosya diskte olmalı ve `app.js`'ten erişilen her modül listede olmalı |
| `check-contrast.js` | Renk kontrastı (WCAG): her metin tonu **üzerine konduğu her yüzeye** karşı · tonların birbirinden ayrışması · parlaklık tavanı |
| `check-tasarim.js` | **Tasarım dili kapısı:** punto ve ağırlık yalnız ölçek değişkenlerinden (7 basamak, 3 ağırlık), renk yalnız `:root`'ta, büyük harf dönüşümü ve kalın yan şerit yok, şablonda satır içi stil yalnız veri, çağrılan her ikon sprite'ta |
| `fizik-denetimi.js` | **Aletler kalın ve gerçek ölçüde** (kalınlıksız plaka yok, dambıl boyu; seated row kablosu yere paralel; bench press kollar düz başlar) · **Animasyon başlangıç pozundan başlar ve tam orada biter** (6 tekrar; turlar arasında ve bir kare geç gelen son karede de sıçrama yok) · **3B hareketlerin fiziği**, her hareket kısıtlarını kendisi beyan eder: uzuv boyları, ortak bar, makine kolu ekseni, ayak kaymıyor, diz yönü, görünürlük (144 sahne) · **olumsuz fikstürler** (eski hatalar kırmızı yanmak ZORUNDA) · **her hareketin ve ısınmanın 3B karşılığı var** · plank varyantları doğru yönde yanlış |
| `test-store.js` | Depolama, "geçen sefer", hacim, kilo, dışa/içe aktarım, **yedek şema doğrulaması** |
| `test-session.js` | Takvim, sıra, seans yaşam döngüsü, yarım gün, gün seçici, geçmiş düzenleme, **işlemsel kayıt**, **güncelleme kararı**, **sayı biçimi**, **ağırlık adımı**, **devam hedefi**, **seans özeti**, **yeniden açma**, ekran şablonları |
| `test-timer.js` | Sayaç: duvar saati, **ekran kilidinin dönüşte yeniden alınması** |
| `check-docs.js` | Bu belgenin koda bağlılığı: her ekran ve her test betiği burada anlatılıyor mu |

**Yeni egzersiz eklemek** — metin ve hedefler `js/data/exercises.js`'te, **hareketin kendisi**
`js/anim3d/hareketler3d.js`'te (aynı `id` ile; "ekipman sürer, beden takip eder": el ve ayak
ekipmanın yoluna bağlanır, kollar ters kinematikle çözülür, hareket kısıtlarını `kisit` alanında
beyan eder). 3B karşılığı olmayan kayıt `npm test`'i kırmızı yakar.

**2B çizim emekli (24 Eylül).** `js/anim/engine.js` ve pozlar (`a`, `b`, `eq` alanları) artık
uygulamada çizilmiyor; yalnız eski mokaplar (`mockup*.html`) ve onların araçları için duruyor.
Temizliği ayrı bir iş.
