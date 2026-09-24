# FitSet — Kullanım

Salon antrenman defteri. Çevrimdışı çalışır, veri telefonda kalır.

> **Son güncelleme: 24 Eylül 2026.** Bu belge `tools/check-docs.js` ile koda bağlıdır:
> uygulamaya yeni bir ekran ya da test betiği eklenip burada anlatılmazsa `npm test` kırmızı yanar.
> (28 Temmuz sürümü iki ay boyunca "Ayarlar ekranı yok" demeye devam etmişti.)

---

## 1. Telefona kurulum

**Android · Chrome**

1. Uygulamanın adresini Chrome'da aç: `https://sabritemel.github.io/fitset/`
2. Sağ üstteki **⋮** menüsünden **"Ana ekrana ekle"** (bazı sürümlerde *"Uygulamayı yükle"*).
3. Ana ekranda **FitSet** ikonu belirir. Oradan açtığında tarayıcı çubuğu görünmez, tam ekran açılır.

**İlk açılışta internete bağlı ol.** Uygulama kendini bir kez indirir; sonrasında uçak modunda bile açılır.

> **Neden dosyayı indirip açamıyorum?** Tarayıcılar `file://` üzerinde service worker'ı kaydetmez ve
> **IndexedDB'yi bloklar**. Yani indirilen dosya programı gösterebilir ama **hiçbir kaydı saklayamaz**.

---

## 2. Ekranlar

### Liste

"Bugün ne var, nerede kaldım." Üstte tarih, **Geçmiş** ve **Ayarlar** bağlantıları.

- **Gün adı bir düğmedir** (yanındaki ▾). Dokununca **gün seçici** açılır: program sıradaki günü
  önerir, ama hangi günü yapacağına sen karar verirsin. Bugün set girdiysen gün kilitlenir —
  girilen setler yanlış güne bağlanmasın diye; sebebi ekranda yazar.
- Telefonsuz yaptığın bir günü **"yapıldı işaretle"** ile kayda geçirebilirsin. Sıra ilerler,
  geçmişte **kayıtsız** diye görünür; ağırlıklar bilinmediği için hacme ve "geçen sefer"e karışmaz.
- **Set / Hacim / Süre** özeti, altında **Isınma** satırı ve günün hareketleri. Her satırdaki
  noktalar o harekette kaç set yaptığını gösterir.
- Bir önceki gün **yarım kaldıysa** (hareketlerin yarısından azı yapıldıysa) listenin üstünde bir bant
  sorar: **Sıradakine geç** ya da **Bu güne devam et**. Cevabın kaydedilir, bir daha sorulmaz.
- Programın dışında bir günde açarsan "Bugün program günü değil — istersen yine de kaydet" yazar.
- En altta **Bugünü sıfırla** ve **Seansı bitir**.

### Isınma

Listede numarasız ilk satır. Önce 3 dk kardiyo, sonra o günün eklemlerine yönelik hareketler ve
ilk ağır hareketin hafif hazırlık seti. **Sayaç ve işaret yok** — ekran yalnız gösterir; figürler
sırayla oynar, dokunduğun hemen öne gelir. **Isınma bitti** doğrudan 1. harekete geçirir.
Isınma sete ve hacme sayılmaz.

### Odak

Bir harekete dokununca açılır. Tek hareket, tam ekran, **kaymaz** — her şey tek bakışta görünür.

- Üstte ilerleme rayı, `hareket / toplam · yapılan / hedef set`, sağda **?** paneli.
- Ortada hareketin **3B animasyonu** — ışıklı, yüzsüz bir çizim mankeni. **Parmakla sürükleyerek
  döndür**, hareketi her açıdan gör; **çift dokunuş** ilk açıya döndürür. Plank gibi süreli
  hareketlerde doğru duruş + iki yaygın hata yan yana, aynı ölçekte.
- Hareketler adlarından ve kaynaklardan (ExRx, ACE, NSCA) çizildi ve her kare bir **fizik
  denetiminden** geçer: aynı barı tutan eller arası sabit, makine kolu kendi ekseninde döner, ayak
  yerde kaymaz, diz doğru yöne bükülür.
- **Ağırlık** kutusu geçen seferki değerle dolu gelir; `+ / −` 2,5'er değiştirir. Altında ne
  girmen gerektiği yazar: *bar dahil toplam* · *tek dambıl — hacimde ×2* · *makinede seçili*.
- **× 12 tekrar** satırına dokunursan **yalnız bu set** için tekrarı değiştirebilirsin.
- **Isınma seti** düğmesi: işaretli set hacme ve "geçen sefer"e karışmaz.
- **Geçen sefer** satırı son yaptığın setleri gösterir.
- **Ağırlık önerisi:** bir hareketi **iki seans üst üste** aynı ağırlıkla, hedef set sayısında ve her sette
  hedef tekrara ulaşarak yaptıysan altında *"İki seanstır 3 × 12 tamam — 42,5 kg dene"* yazar.
  **uygula** yalnız kutuya yazar; seti kaydetmek senin kararın. Artış bileşik harekette ~%5, izole
  harekette ~%2,5; bar ve dambılda 2,5 kg'a, makine ve kabloda 5 kg'a yuvarlanır. Adım çok büyükse
  (ör. 10 kg dambılda +2,5 = %25) önce **tekrar** artırmanı önerir. Bugün önerilen ağırlığa çıktıysan
  satır kaybolur. (Kural: ACSM 2009 "iki ardışık seans" + çift ilerleme.)
- **N. seti kaydet** → set kaydedilir, dinlenme sayacı kendiliğinden başlar. Hedef set sayısına
  ulaşınca düğme ikiye bölünür: **Fazladan** / **Sonraki hareket →**.
- Rozetler son 3 seti gösterir, gerisi **+N** ardında. Son rozetin yanında **geri al**.
- Alt çubukta **← Önceki · dinlenme · Sonraki →**. Dinlenme çalışırken yerinde sayaca dönüşür:
  **geç** ve **+30**.

**? paneli** (aşağı kaydırarak ya da boşluğa dokunarak kapanır): hareketin **hedefi**
(set · tekrar · ağırlık — hoca programı değiştirdiğinde buradan güncelle, *programa dön* ile
geri al), çalışan kaslar, adım adım anlatım ve *dikkat* notu.

**Süreli hareketler (Plank):** hedef süreyi ±5 sn ayarla, **Başlat**'a bas; süre dolunca set
kendiliğinden kaydedilir. Erken bırakırsan **Kaydet** ile elle kaydedebilirsin.

> **"Kaydedilemedi" uyarısı çıkarsa:** telefonun depolaması yazmayı reddetmiştir (dolu depolama,
> tarayıcı kısıtı). Set kaydedilmemiştir ve ekranda da görünmez — tekrar dene. Sürerse hemen
> **yedek al**. (24 Eylül öncesinde bu durum sessiz kalıyor ve sonraki dokunuş fazladan set
> yazıyordu.)

### Geçmiş

- **Kilo:** son değer, ilk ölçümden bu yana değişim ve çizgi. **Bugün** alanına yazıp kaydet
  (20–400 kg). Aynı gün ikinci giriş öncekinin üstüne yazar; alanı boşaltıp kaydedersen bugünün
  kaydı silinir.
- **Son seanslar:** son 12 seans — tarih, gün, yapılan/toplam hareket, hacim. Yarım kalanlar
  *yarım*, telefonsuz işaretlenenler *kayıtsız* etiketi taşır. **Dokununca düzenleme açılır.**
- **Hareket ilerlemesi:** en az iki seansta yapılmış her hareket için **en ağır set** çizgisi
  (ortalama değil — hafif setler gerçek artışı gizlerdi).

### Seans düzenleme

Geçmişte bir seansa dokununca açılır. Yanlış girilen bir değeri üstüne yazıp alandan çık —
kaydedilir; hacim, "geçen sefer" ve grafikler kendiliğinden yeniden hesaplanır.
**sil** tek seti siler (**Geri getir** ile geri alınır); **Bu seansı sil** seansı geçmişten
kaldırır ve sırayı yeniden hesaplar (o da geri getirilebilir). Son set silinince seans da silinir.

### Ayarlar

- **Antrenman günleri:** hangi günler program günü (en az bir gün seçili kalmak zorunda).
  *Sıradaki* satırı hemen güncellenir.
- **Setler arası dinlenme:** 30 / 45 / 60 / 90 / 120 sn (varsayılan 60).
- **Boy** (bir kez girilir; kilo takibi Geçmiş'te).
- **Yedek al / Geri yükle** — aşağıda.

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

**Açık tema yok.** Tasarım bilinçli olarak koyu temaya bağlı.

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
| `check-contrast.js` | Renk kontrastı (WCAG) + parlaklık tavanı |
| `fizik-denetimi.js` | **3B hareketlerin fiziği**, her hareket kısıtlarını kendisi beyan eder: uzuv boyları, ortak bar, makine kolu ekseni, ayak kaymıyor, diz yönü, görünürlük (144 sahne) · **olumsuz fikstürler** (eski hatalar kırmızı yanmak ZORUNDA) · **her hareketin ve ısınmanın 3B karşılığı var** · plank varyantları doğru yönde yanlış |
| `test-store.js` | Depolama, "geçen sefer", hacim, kilo, dışa/içe aktarım, **yedek şema doğrulaması** |
| `test-session.js` | Takvim, sıra, seans yaşam döngüsü, yarım gün, gün seçici, geçmiş düzenleme, **işlemsel kayıt**, **güncelleme kararı**, **sayı biçimi** |
| `test-timer.js` | Sayaç: duvar saati, **ekran kilidinin dönüşte yeniden alınması** |
| `check-docs.js` | Bu belgenin koda bağlılığı: her ekran ve her test betiği burada anlatılıyor mu |

**Yeni egzersiz eklemek** — metin ve hedefler `js/data/exercises.js`'te, **hareketin kendisi**
`js/anim3d/hareketler3d.js`'te (aynı `id` ile; "ekipman sürer, beden takip eder": el ve ayak
ekipmanın yoluna bağlanır, kollar ters kinematikle çözülür, hareket kısıtlarını `kisit` alanında
beyan eder). 3B karşılığı olmayan kayıt `npm test`'i kırmızı yakar.

**2B çizim emekli (24 Eylül).** `js/anim/engine.js` ve pozlar (`a`, `b`, `eq` alanları) artık
uygulamada çizilmiyor; yalnız eski mokaplar (`mockup*.html`) ve onların araçları için duruyor.
Temizliği ayrı bir iş.
