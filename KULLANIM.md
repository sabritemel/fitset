# FitSet — Kullanım

Salon antrenman defteri. Çevrimdışı çalışır, veri telefonda kalır.

---

## 1. Telefona kurulum

**Android · Chrome**

1. Uygulamanın adresini Chrome'da aç.
2. Sağ üstteki **⋮** menüsünden **"Ana ekrana ekle"** (bazı sürümlerde *"Uygulamayı yükle"*).
3. Ana ekranda **FitSet** ikonu belirir. Oradan açtığında tarayıcı çubuğu görünmez, tam ekran açılır.

**İlk açılışta internete bağlı ol.** Uygulama kendini bir kez indirir; sonrasında uçak modunda bile açılır.

> **Neden dosyayı indirip açamıyorum?**
> Denedin ve çalışmadıysa sebebi şu: tarayıcılar `file://` üzerinde service worker'ı kaydetmez ve
> **IndexedDB'yi bloklar**. Yani indirilen dosya programı gösterebilir ama **hiçbir kaydı saklayamaz**.
> Kayıt tutmak bu uygulamanın var olma sebebi olduğu için, gerçek bir adres üzerinden açılması gerekiyor.

---

## 2. Günlük kullanım

**Liste ekranı** — bugünün 9 hareketi, üstte özet (set / hacim / süre). Her satırdaki çubuklar o
egzersizde kaç set yaptığını gösterir.

**Odak ekranı** — bir harekete dokununca açılır. Tek hareket, tam ekran.
- `‹ Önceki` / `Sonraki ›` ile hareketler arasında geçebilirsin
- `‹ Listeye dön` ile listeye çıkarsın
- İkisi de aynı seansı sürdürür; nereden devam ettiğin fark etmez

**Set kaydetme**
1. Ağırlık ve tekrar kutuları **geçen seferki değerlerle önceden dolu** gelir — çoğu sette hiç
   dokunmadan kaydedebilirsin.
2. `− / +` ile ayarla (ağırlık 2,5'er, tekrar 1'er).
3. **Seti kaydet**'e bas. Dinlenme sayacı kendiliğinden başlar.
4. Yanlış girdiysen setin yanındaki **geri al**'a bas; bir şerit "geri getir" önerir.

**Ağırlık ne demek?** Kutunun altında yazıyor:
- **Bar dahil toplam ağırlık** (halter hareketleri) — barın kendi ağırlığı dahil
- **Tek dambılın ağırlığı** — hacim hesabında iki kol otomatik sayılır
- Bugün bir türlü, üç ay sonra başka türlü girersen grafiğin bozulur ve geri düzeltilemez.

**Isınma setleri** — kutucuğu işaretlersen o set hacme *ve* "geçen sefer" referansına karışmaz.

**Plank gibi süre hareketleri** — animasyon yerine üç figür görürsün (doğru duruş + iki yaygın hata)
ve bir geri sayım. **Başlat**'a bas; süre dolunca set otomatik kaydedilir.

**Sıradaki gün nasıl belirleniyor?** Takvimden değil, **son tamamladığın seanstan**. 1. Gün yaptıysan
sıradaki 2. Gün'dür — üç hafta ara versen de böyle. Kaçırılan seans sırayı bozamaz.

---

## 3. Yedekleme — bunu ihmal etme

⚠️ **Veri yalnızca bu telefonda.** Sunucu yok (bilinçli karar: gizlilik ve basitlik). Bunun bedeli:
tarayıcı verisi silinirse ya da telefon kaybolursa **kayıtlar gider**.

**Yedek almak:** Liste ekranının altındaki **Yedek al**.
- Paylaşım penceresi açılırsa Drive / WhatsApp / e-posta ile kendine gönder
- Açılmazsa `fitset-yedek-20260728.json` diye bir dosya iner

**Geri yüklemek:** **Yedekten geri yükle** → dosyayı seç.
- Aynı seans iki dosyada varsa **daha yeni olan** kazanır; eski kayıt yenisini ezmez
- Aynı yedeği iki kez almak hiçbir şeyi bozmaz
- Başka bir uygulamanın dosyasını verirsen reddeder

Uygulama her 8 seansta bir yedek almanı hatırlatır.

---

## 4. Bilinen sınırlar (dürüstlük bölümü)

**Ekran kapalıyken sayaç uyarısı güvenilir değil.** Bu bir eksiklik değil, tarayıcı kısıtı:
sayfa arka plandayken titreşim yok sayılır, zamanlayıcılar kısılır. Bunu şöyle karşıladık:
- Sayaç **duvar saatiyle** çalışır — arka planda kalsa bile kalan süre doğrudur
- Sayaç başlarken **ekran açık tutulur** (Wake Lock), böylece titreşim/ses fiilen çalışır
- Buna rağmen kaçarsa uygulama *"Dinlenme 12 sn önce bitti"* der — sessizce doğru gibi davranmaz

**Açık tema yok.** Tasarım bilinçli olarak koyu temaya bağlı. İhtiyaç olursa eklenebilir.

**Ayarlar ekranı yok.** Dinlenme süresi (90 sn), antrenman günleri (Sal/Per/Cmt) ve birim (kg)
şimdilik kodda sabit: `js/store.js` → `DEFAULT_SETTINGS`.

**Bu bir egzersiz yardımcısıdır, tıbbi tavsiye değildir.** Ağrı hissettiğin bir harekette dur.

---

## 5. Geliştirici notları

**Yerel çalıştırma** — `file://` çalışmaz (ES modülleri ve service worker izin vermez):

```bash
node tools/serve.js          # http://localhost:5099
```

Çıktıda bir de ağ adresi yazar; aynı Wi-Fi'daki telefondan oraya girebilirsin.
(Ağ IP'sinde service worker kaydolmaz — çevrimdışı testi ancak yayındaki adreste yapılabilir.)

**Testler**

```bash
npm test
```

Dört doğrulayıcıyı sırayla koşar:

| Betik | Ne denetler |
|---|---|
| `verify-poses.js` | **Her poz değişiminden sonra ÇALIŞTIR.** Uzuv uzunlukları, eklem limitleri (dirsek/diz ≤150°), dönüş yönü, ayak-yerde, veri tutarlılığı, izometrik hareketlerin görselleri |
| `verify-port.js` | Prototipten taşınan verinin bozulmadığını; bilinçli sapmaların defterini tutar |
| `test-store.js` | Depolama, "geçen sefer", hacim, dışa/içe aktarım |
| `test-session.js` | Takvim, A/B sırası, seans yaşam döngüsü, ön-doldurma |

**Yeni egzersiz eklemek** — `js/data/exercises.js` başındaki yorum bloğunu oku. Zorunlu alanlar,
isteğe bağlı bayraklar ve poz formatı orada. Ekledikten sonra **`node tools/verify-poses.js`** çalıştır;
anatomik olarak imkânsız bir poz sessizce geçmesin.

**Görüş açısı denetimi** — `node tools/audit-views.js`. Her hareketin seçilen açıda ne kadar yol
aldığını ve uzuvların örtüşüp örtüşmediğini ölçer. Düşük değerler açının ya da kol/bacak
yerleşiminin gözden geçirilmesi gerektiğini söyler.

**Tasarım mockup'ı** — `node tools/make-mockup.js` → `mockup.html` (tek dosya, fontlar gömülü).

**Yayın** — `main` dalına push yeter; Cloudflare Pages otomatik dağıtır.
⚠️ **Dosya değiştirdiysen `sw.js` içindeki `CACHE` sürümünü artır** (`fitset-v4` → `v5`).
Artırmazsan telefonda eski sürüm servis edilmeye devam eder.

---

## 6. Yayın

**Adres:** https://sabritemel.github.io/fitset/
**Depo:** https://github.com/sabritemel/fitset (public)

Yayın **GitHub Pages** üzerinde, `main` dalının kökünden. Kurulum tamamlandı; bundan sonra
`git push` yeterli, birkaç dakika içinde canlıya çıkar.

**Derleme adımı yok** — saf HTML/CSS/JS, sıfır bağımlılık. Dosyalar olduğu gibi servis edilir.

İki dosya bu yayına özel:

| Dosya | Ne işe yarıyor |
|---|---|
| `.nojekyll` | GitHub Pages varsayılan olarak Jekyll çalıştırır ve alt çizgiyle başlayan dosyaları yok sayar. Bu dosya derlemeyi kapatır, her şey olduğu gibi servis edilir. |
| `_headers` | Cloudflare/Netlify formatı — **GitHub Pages bunu yok sayar.** Sorun değil (aşağıya bak); ileride taşınırsa diye duruyor. |

> **`_headers` geçersizken sw.js önbelleği sorun olmuyor mu?**
> Olmuyor. Tarayıcılar service worker betiğinin kendisini zaten HTTP önbelleğini **atlayarak**
> alır (`registration.updateViaCache` varsayılanı `"imports"`). Yani güncelleme kontrolü
> GitHub Pages'te de doğru çalışır.

⚠️ **Kod değiştirdiysen `sw.js` içindeki `CACHE` sürümünü artır** (`fitset-v4` → `v5`).
Artırmazsan telefonda eski sürüm servis edilmeye devam eder.

### Yayın doğrulaması (28 Tem 2026)

```
derleme            built
sw kaydı           ✓  kapsam /fitset/  ·  durum activated
önbellek           fitset-v4 · 25 dosya
eksik kritik dosya YOK
font (latin-ext)   8 ✓
hareket            9 ✓
```
