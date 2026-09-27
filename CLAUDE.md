# FitSet — Agent Context

> **Salon antrenman defteri.** Çevrimdışı çalışan PWA; veri telefonda kalır.
> Saf HTML/CSS/JS, IndexedDB, derleme yok. Çalışma-zamanı bağımlılığı **tek ve bilinçli**:
> hareket çizimi için **three.js** alt kümesi (MIT), depoda paketli — bkz. "3B çizim" aşağıda.

## ⚠️ EN ÖNEMLİ KISIT: bu proje SmartVisor suite'inin PARÇASI DEĞİL

FitSet, `AntigravityProjeler/` altında **duruyor** ama suite'e **ait değil** —
FinLens ve SmartCRM gibi ayrı bir üründür. Bunun somut karşılıkları:

| | |
|---|---|
| Depo | **kendi git deposu**: `github.com/sabritemel/fitset` (kök depo `.gitignore` satır 123'te `FitSet/` ile onu dışlar) |
| Çıktılar | `artifacts/`'a **YAZILMAZ** — o depo QVS + STS + SVS içindir |
| Port tablosu | FitSet'in portu **yoktur**; suite port tablosuna eklenmez |
| Tasarım dili | suite'inkinden farklı olabilir; ISA-101 / endüstriyel HMI kuralları **burada geçerli değildir** (bu bir tüketici uygulaması, kontrol odası ekranı değil) |
| Lisans borcu | suite'in AGPL kısıtları burada ayrıca değerlendirilir. Tek bağımlılık three.js (**MIT**, 24 Eyl — Sabri: *"girsin, SVG yedekle"*); yenisi eklenmeden önce lisansı **birincil kaynaktan** okunur (bu turda "tam bu iş için yazılmış" mannequin.js **GPL-3.0** çıktı) |

⚠️ Suite'in kök `CLAUDE.md`'sindeki uygulama/port/altın-kural tablosu **bu
projeyi kapsamaz**. Buradaki tek üst kural şudur: *kök depoya sızma.*

## Yapı (ölçüldü, 27 Eyl 2026 — telefon turundan sonra, `d1b8e1b`)

```
js/        15 dosya · 5 464 satır (vendor hariç)   app · store · session · schedule · timer
                                                   ui · ilerleme · data/ · anim/ · anim3d/
js/anim3d/ 4 dosya · 1 585 satır   manken3d (iskelet+IK, SVG çizim, çerçeve) · hareketler3d
                                   (22 hareket, kısıtlarıyla) · webgl (three.js çizici) · sahne (giriş)
js/vendor/ three.min.js (530 KB · 135 KB gzip, MIT) + three-LICENSE.txt
tools/     22 betik · 3 743 satır  doğrulayıcılar + üreticiler (+ three-giris.js: paketi yeniden üretir)
css/       style.css (530 satır) — tasarım dili 3 "Grafit"
sw.js      120 satır — service worker · CACHE sürümü İÇERİKTEN türetilir
icons/     Grafit + mercan (`make-icons.js`) · ayrı maskable 512 (Android kırpar)
screenshots/ 3 WebP — yalnız Chrome'un kurulum penceresi için (SENTETİK veri; SW önbelleğine girmez)
8 HTML     index.html (+ çizgisel ikon sprite'ı) + 7 mokap (cizimler · isinma · izometrik · genel ·
           3b · 3b-figur · tasarim-v3)
docs/      2026-09-24-bas-tasarimci-raporu.md · 2026-09-27-tasarim-dili-analizi.md (+ ekran görüntüleri)
           · 2026-09-27-akilli-saat-onerisi.md (bekliyor: yeni saat gelince test sayfası)
```

### Tasarım dili 3 "Grafit" (27 Eyl 2026 — Sabri: *"premium, sade ama şık, sezgisel"*)

Analiz, ölçümler, mokap ve kararlar: `docs/2026-09-27-tasarim-dili-analizi.md` · `mockup-tasarim-v3.html`.

- **Değerler yalnız `:root`'ta** (`css/style.css`): tip ölçeği **7 basamak** (`--f-xs … --f-hero`:
  12 · 14 · 16 · 18 · 22 · 32 · 80), ağırlık **3** (`--w-reg/med/bold`: 450 · 560 · 650), metin tonları
  `--t1/t2/t3`, yüzeyler `--bg/s1/s2/s3`, tek vurgu `--acc` (mercan, Sabri seçti). Kurallar sayı ya da
  renk YAZAMAZ — `tools/check-tasarim.js` kırmızı yakar (mutasyon 12/12).
- **Vurgu yalnız CANLI ve ŞİMDİ olan:** çalışan sayaç, "şimdi" yuvası, kaldığın satırın yayı. Odak
  halkası ve yıkıcı eylem vurgu rengini kullanmaz. İki yarım hareket iki mercan yay OLMAZ.
- **Tek düğme dili:** `.btn.p` (açık dolgu) · `.btn.s` (koyu dolgu) · `.cip` · `.ib` (44 daire) ·
  adımlayıcı. Seçili = **ters dolgu** (`aria-pressed`). Altı çizili yazı/çerçeveli düğme yok.
  Her dokunma yüzeyi ≥ 44 px (ölçüldü: 390 px'te 197/197; 360 px'te gün çipleri 40×44 — ilan edildi).
- **Satır içi `style=` yalnız VERİ** (`--p` yüzdesi, sayaç çubuğu); kapı bunu da denetler.
- **İkonlar** `index.html`'deki SVG sprite'ta (`<use href="#i-…">`); `ui.js`'in çağırdığı her ikonun
  sprite'ta olduğunu kapı sınar.
- **Kadraj:** `manken3d.cerceve('sabit')` zemin diskinin (`ZEMIN_R`) ön kenarını da sığdırır.
  **Odak ekranının `'donen'` kadrajı (27 Eyl, Sabri: telefonda "animasyon çok küçük"):** üst sınırı yalnız
  BEDEN ve HAREKET EDEN aletler belirler; sabit makine gövdesi (lat kulesi, makara tepesi) üstten taşar.
  Alt ve yan sınıra her şey + zemin diski girer. Sınır nokta başına (`y·cosφ + ρ·sinφ`) — eskiden en
  yüksek noktanın boyu ile en uzak noktanın ρ'su toplanıyordu. Hareketli = 13 anda >0,5 cm yer değiştiren.
  Ölçüldü: lat çekişinde kişi/kadraj %62 → %78. `fizik-denetimi` KADRAJ: 504 açıda beden ve tutulan alet
  kırpılmaz, sabit gövde yalnız üstten taşar, disk kesilmez (mutasyon 4/4; hareket tespiti denetimde
  ürün kodundan BAĞIMSIZ yazıldı — aynısını kullansaydı K3 mutantıyla birlikte körleşiyordu).
- **Sade odak ekranı (27 Eyl, Sabri: "ana ekran olabildiğince sade olsun"):** ağırlık önerisi **? paneline**
  (hedefin üstü), tekrar ve ısınma seti **"Bu set" paneline** (`#set-sheet`) taşındı — "Şimdi" yuvası
  onu açan bir DÜĞME (yalnız ağırlık × tekrar). İşlev kalktı değil taşındı: hedef 12 iken 10 yapılan set.
  `#f-reps` / `#warm` kimlikleri aynı, kapalı panelde DOM'da (inert) → kayıt kodu değişmedi. Isınma
  seçimi gizli durum olmasın diye ana ekran söyler: yuva "Isınma", düğme "Isınma setini kaydet".
  Isınma `role="switch"` + `aria-checked` (etiketi değişen `aria-pressed` çelişik okunur). Taslağın tek
  gerçeği `ctx.draft.warmup` (DOM özniteliği okunmaz). Figür alanı Sabri'nin telefonunda (393×724 CSS) 166 → 313 px.
  `test-session` 32-33 tutar (mutasyon 4/4: öneri ana ekrana dönmez, ısınma söylenir, —×12, yükle düğmesi).
- **Ağırlıksız değer "—" yazılmaz:** boş kutu sönük `0` (80 px "—" gri çubuk gibiydi), yuva/set etiketi
  `12 tekrar` ("—×12" değil).
- **Animasyon zamanı TEK kaynak: `sahne.animT`** (Sabri, 27 Eyl): 6 tekrar (`TEKRAR`, 3 sn/tekrar),
  başlangıç pozundan (`DURAGAN_T = 0`) başlar ve TAM orada biter; duran figür de o pozdadır. Dururken
  dokunmak/döndürmek 6 tekrar daha oynatır; ekran yeniden kurulunca (set kaydı) süren oynatma kaldığı
  yerden sürer. `fizik-denetimi` her hareket için ilk/son/bir kare geç son kareyi ve dönen hareketlerin
  tur sonunu başlangıç pozuyla karşılaştırır (mutasyon 5/5). ⚠️ Son kareyi TAM süre anında ölçmek
  sıfırlamanın yokluğunu gizler (o anda dalga zaten 0) — gerçek son kare bir kare geç gelir.

### 3B çizim (24 Eyl 2026)

- **Tek giriş `js/anim3d/sahne.js`.** WebGL (three.js) varsa ışıklı manken, yoksa aynı motorun
  **SVG** çizimi. three.js açılışı yavaşlatmasın diye **ilk kullanımda** dinamik yüklenir; o arada
  SVG çizer. GPU bağlamı kaybolursa (telefon arka plan) yine SVG. Tek paylaşılan WebGL bağlamı,
  görünümler 2B tuvale kopyalanır (tarayıcı ~16 bağlam sınırı; ekran HTML'i sık yeniden kurulur).
- **Hareket motoru çiziciden bağımsız:** iskelet `an(h,t)` ve ekipman hareketin kendi tanımından;
  `tools/fizik-denetimi.js` konum ölçer, çiziciyi değil. Yeni hareket = `hareketler3d.js`'e aynı
  `id` ile giriş + `kisit` beyanı. 3B'si olmayan kayıt `npm test`'i kırmızı yakar (`hareketBul`,
  uygulama ve denetim AYNI fonksiyonu çağırır).
- ⚠️ **three.js paketi:** `node_modules` yok; `tools/three-giris.js` hangi sınıfların alındığını ve
  paketleme komutunu taşır. MIT bildirimi paketin başında ve `three-LICENSE.txt`'te — esbuild'in
  `--legal-comments=none`'ı bildirimi SİLER, başlık `--banner` ile eklenir.
- ⚠️ `CylinderGeometry` MERKEZLİDİR, bu motorun lathe'leri 0…1 → `translate(0, 0.5, 0)` şart.
- **Aletler gerçek ölçüde (27 Eyl, Sabri: "dambıl ve halterlerin hiç kalınlığı yok"):** plaka, dambıl başı ve
  makara `manken3d.silindirParca` — geo türü `'c'` (kapsülle uyumlu alanlar: a2/b2/a3/b3/r), WebGL kapaklı
  silindir, SVG iki yüzün dışbükey zarfı. `M.DAMBIL` (altıgen, 25 cm), `M.halter` (olimpik tip, 1,6 m),
  `M.dambilCismi` çarpışma kapsülü. Eski `disk()` düz 24-gendi: kenardan 0 px. `fizik-denetimi` kalınlıksız
  daireyi, dambıl ölçüsünü, seated row kablosunun yataylığını ve bench press'in yukarıda başlamasını tutar
  (mutasyon 5/5). ⚠️ Görsel denetimde önce `bump-sw` + SKIP_WAITING: service worker ESKİ 3B modüllerini
  sunarken yarım denetim eski aletlere bakıldı (27 Eyl).
- **2B çizim emekli:** `js/anim/engine.js` uygulamada kullanılmıyor, yalnız eski mokaplar ve
  araçları (`verify-poses`, `verify-port`, `make-mockup*`, `audit-*`) için duruyor; `npm test`'te
  değiller. `exercises.js`'teki `a/b/eq` poz alanları ölü veri. Temizliği ayrı iş.

Derleme **yok** — saf statik dosyalar. `package.json` yalnız betikleri taşır
(`"private": true`, `"type": "module"`).

## Komutlar

```bash
npm test      # bump-sw (+ çevrimdışı kapısı) + check-contrast + check-tasarim + fizik-denetimi
              # + test-store + test-session + test-timer + check-docs   ← tam kapı
npm run verify   # yalnız 3B fizik denetimi
npm run bump     # sw.js CACHE sürümünü artır
npm run icons    # ikon üretimi
npm run fonts    # font indirme
```

**Ölçüldü (27 Eyl 2026, telefon turu sonrası): `npm test` exit 0** — `check-contrast` 23 kontrol
(her metin tonu × her yüzey, ton ayrışması, parlaklık tavanı) · `check-tasarim` 14 · `test-store` 71 ·
`test-session` 282 · `test-timer` 14 · `check-docs` 17 · `fizik-denetimi` tümü temiz (22 hareket,
6 olumsuz fikstür, 25 kaydın 3B kapsamı, plank varyantları, aletler, animasyon, KADRAJ 504 açı) · `bump-sw` çevrimdışı kapısı: `app.js`'ten
erişilen 15 modülün hepsi ASSETS'te (dinamik `import()` dahil).
⚠️ 7 Eyl'de burada yazan "187 geçti" `npm test`'in SON satırıydı, yani yalnız
`test-session`'ın sayısı — toplam değil. Sayı betik başına okunur.

⚠️ **Kullanıcı belgesi koda bağlı:** `check-docs.js`, `index.html`'deki her ekranın
ve `npm test`'teki her betiğin `KULLANIM.md`'de anlatıldığını denetler. Yeni ekran
eklersen tablosuna adını ver ve kılavuza bölüm yaz — yoksa kapı kırmızı.

⚠️ `npm test` **`bump-sw.js` ile başlar** ve bu bilerek böyledir.

`sw.js` içindeki `CACHE` sürümü **elle yazılmaz** — `bump-sw.js` onu `ASSETS`
listesindeki dosyaların **içeriğinden** türetilen sha256'nın ilk 10 hanesinden
üretir (`fitset-<hash>`). Dosya değişmişse hash değişir, önbellek adı değişir,
güncelleme kendiliğinden tetiklenir.

⭐ Gerekçesi kaynakta yazılı: *"dosya değiştirdiysen sürümü artır" bir İNSAN
KURALIYDI ve tam da beklendiği gibi unutuldu* — tarayıcı eski CSS'i servis
etmeye devam etti, değişiklik "gitmemiş" gibi göründü.
**Unutulabilen bir adım kurala değil ARACA bağlanır.**

*(`sw.js` başlığındaki eski "SÜRÜM ARTIRMAYI UNUTMA" yorumu 24 Eyl'de düzeltildi.)*

⚠️ **Yerel denemede de aynı tuzak:** kaynağı düzenleyip `bump-sw`'yi koşmadan
tarayıcıyı yenilersen service worker **önbellekteki eski dosyayı** sunar
(önbellek öncelikli). Canlı doğrulamadan önce `node tools/bump-sw.js` + iki yenileme,
sonra *"koşan kod benim kodum mu?"* diye kaynağı `fetch` ile oku (24 Eyl'de
yakalandı: düzeltme diskteydi, tarayıcı eskisini çalıştırıyordu).

## ⭐⭐ Bu projede pahalıya öğrenilmiş dersler

Bunları tekrar öğrenmek zorunda kalma.

### 1. Aynı doğrulayıcı ÜÇ ayrı biçimde kör çıktı

Üçünü de **Sabri gözle** ya da canlı deneme buldu — testler değil:

| # | denetim ne soruyordu | neyi kaçırdı |
|---|---|---|
| 1 | açının **BÜYÜKLÜĞÜ** sınırda mı? | büyüklük doğru, **yön** yanlış |
| 2 | işaret hareket boyunca **DEĞİŞİYOR** mu? | baştan sona **sabit ve yanlış** |
| 3 | ayak **KAYIYOR** mu? | ayak zeminden uzaksa `continue` → **hiç bakmıyordu** |

> ⭐⭐ **"İşaret değişmiyor" ≠ "işaret doğru".**
> ⭐⭐ **Yön denetimi MUTLAK REFERANS ister.** Yoksa yalnız *"kendi içinde
> tutarlı mı"* sorulabilir ve **baştan sona tutarlı biçimde yanlış** olan hep
> geçer. Referans (`face`) kodda zaten VARDI — yalnız çizim onu okuyordu.
> ⭐⭐ **Denetimin "bu vakayı atla" koşulu, yakalaması gereken hatayı yutar.**
> Muafiyet, veriyle AYNI ölçüte bağlanmamalı; **bağımsız** bir sinyale bağlanır.

⭐ Her yeni denetimin gerçekten gördüğü **kanıtlandı**: eski hatalı değer geri
konup ✗ verdiği ölçüldü. *Sıfır sonuç körlük de olabilir.*

### 2. PWA'da bekleyen sürüm SESSİZCE atlanır

`updatefound` yalnız güncelleme **o sırada** bulunursa ateşlenir. Önceki
ziyarette indirilmişse kullanıcı eski sürümde **çakılı kalır** — Sabri'de
yaşandı. Bu yüzden `reg.waiting` **ayrıca** yoklanır.

> ⭐⭐ *Olay tabanlı bildirim, olayı KAÇIRAN durumu kapsamaz.*

### 3. "Kaydedilmeye değer" ile "tamamlanmış sayılan" AYRI kapılardır

Aynı hata **iki kez** yapıldı (`warmupDone`, `carriedFrom`): kullanıcı karar
veriyor, ama set girmediği için seans diske yazılmıyor ve karar kayboluyor.
İkincisi daha kötüydü — soru "cevaplandı" sayıldığı için **bir daha
sorulmuyordu**.

### 4. Ayar nesnede duruyor diye ÇALIŞIYOR demek değil — üç sessiz seviye

- **yazılamayan** — `trainingDays` tüm takvimi sürüyordu, hiçbir ekran yazmıyordu
- **yalnız etiket** — `unit` dönüşüm yapmıyordu, "lbs" yalan söylerdi
- **tümüyle ölü** — `theme`, tek okuyucusu yok

Son ikisi arayüze **konulmadı**. *Görünür ama işlevsiz bir ayar, ayarsızlıktan
kötüdür.*

### 5. Çizim kararları

- **Kuşbakışı bakınca insan daireye iner** — iki "fly" hareketi üstten
  çizildiği için okunmuyordu. Düzeltme **motorda değil VERİDEydi** (kısaltma
  `al` zaten vardı; eksik olan gövdenin dikey çizilmesiydi).
- **İzometrik prototiplendi, ÇALIŞIYOR, ama uygulanmadı.** Gerekçe estetik
  değil: **poz denetimlerinin tamamı 2B'ye bağlı**, izometrik pozlar korumasız
  kalırdı. ⭐ Yeni bir çizim kipi eklerken asıl maliyet kalemi şu sorudur:
  *"bu kipin doğrulama ağı var mı?"*

### 6. Kuralı olay işleyicisine yazarsan doğrulayamazsın

*"Son antrenman günü kapatılamaz"* kuralı `app.js`'ten `schedule.js`'e taşındı
ve **10 doğrulama kazandı**. Kural, olayın değil **alanın** yanında durur.

### 7. Mokap da ürün gibi ölçülür; kapı ölçtüğü yüzeyi söylemeli (27 Eyl)

- **Mokabın ilk hâli kendi iddiasını çiğniyordu:** "7 punto" diyordu, aynı araçla ölçülünce 12 punto,
  6 ağırlık, gri yüzeyde 4,36:1 kontrast ve 9 küçük hedef çıktı. Önerilen dil, önerildiği sayfada bile
  tutulmuyordu — yalnız ölçüm yakaladı.
- **Kontrast kapısı tonları yalnız ZEMİNE karşı ölçüyordu;** yüzey üstündeki metin görünmezdi. Artık
  her ton her yüzeye karşı. *Kapının iddiası, ölçtüğü yüzeyden geniş olamaz.*
- **Eski kararın kapısı yeni öneriyi durdurdu (iyi ki):** mokabın parlak tonları 2. sürümün
  *"gözü yormasın"* parlaklık tavanını (0,70) aşıyordu; tavan korunup tonlar indirildi.
- **Ölçüm aracı üç kez yanıldı:** `color-mix()` rengini (`oklab(...)`) okuyamayıp çöktü · kesilme
  denetimi +1 px toleransla 0,24 px'lik taşmayı yuttu (tarayıcı bu kadarında da üç nokta koyar) ·
  otomasyonda rAF durunca "+30 çalışmıyor" sandım (500 ms'de 1 kare). Her araç önce bilinen bir
  örnekle doğrulandı.

### 8. Telefona kurulum ve verinin kalıcılığı (27 Eyl)

- **Kurulum mağazasız:** manifest + SW zaten Chrome'un şartlarını karşılıyordu (CDP
  `getInstallabilityErrors` → 0). Chrome bunu gerçek bir Android uygulamasına (WebAPK) çevirir: çekmece,
  adres çubuğu yok, siteden güncellenir, **veri tarayıcıyla ORTAK**. APK dosyası (TWA) reddedildi:
  "bilinmeyen kaynak" izni + Play Protect uyarısı, üstelik doğrulama dosyası (`/.well-known/assetlinks.json`)
  alan kökü ister — `github.io/fitset/` alt yolunda konamaz → uygulamada adres çubuğu görünürdü.
- `beforeinstallprompt` bastırılır, istem saklanır, **yalnız Ayarlar → Uygulama → Telefona yükle** açar
  (Sabri: "ayarlarda yeterli"). İstem yoksa düğme GÖSTERİLMEZ, menü yolu yazılır.
- Manifest: `id: "/fitset/"` (Chrome'un önerisi = yayındaki mevcut kimlik; adres değişse de uygulama aynı
  kalır) · ayrı **maskable** ikon (köşesiz, içerik ≤ 0,354·S) · `screenshots/` (Chrome'un zengin kurulum
  penceresi; **sentetik veri** — depo herkese açık; SW önbelleğine girmez).
- ⚠️ **`navigator.storage.persisted()` bir PROMISE döndürür.** `persisted() ? true : persist()` her zaman
  `true` döndü, `persist()` HİÇ çağrılmadı — canlıda ölçüldü: veri "en iyi çaba" deposundaydı, Android
  sıkışınca silebilirdi. `test-store` sahte `navigator.storage` ile tutar (eski satır mutantı ÖLDÜ).

## Çalışma biçimi

- **Doğrulama önce**: yeni bir davranış eklerken onu `tools/` altındaki bir
  denetime bağla; bağlayamıyorsan neden bağlanamadığını **yaz**.
- **Sabri gözle test eder.** Bu projede kusurların çoğunu testler değil canlı
  kullanım buldu — bir değişikliği "bitti" saymadan önce *nasıl gözle
  doğrulanacağını* söyle.
- **`file://` çalışmaz**: tarayıcılar service worker'ı kaydetmez ve IndexedDB'yi
  bloklar. Yerel deneme için `node tools/serve.js`.
- **Türkçe arayüz**; kullanıcı belgesi `KULLANIM.md`.

## Bilgi katmanı — nerede duruyor

⚠️ Bu projenin dersleri **kök projenin** hafızasında ve wiki'sinde tutuluyor
(`Brain_Obsidian/`), çünkü çoğu **suite'e de geçerli** çıktı ve orada
`suite-standard` etiketiyle standarda dönüştü:

- `concepts/dogrulayici-buyukluge-bakar-yone-bakmaz.md`
- `concepts/denetimin-kacis-kapisi-hatayi-yutar.md`
- `concepts/ayar-nesnede-durmasi-calismasi-degildir.md`
- `concepts/kaydetmeye-deger-ile-tamamlanmis-ayri-kapi.md`
- `concepts/oznel-istek-olcute-cevrilir.md`
- `concepts/pwa-bekleyen-surum-sessizce-atlanir.md`
- `concepts/beklenmeyen-promise-kosulda-hep-dogrudur.md` (27 Eyl — `persisted()`; SV-UI-061 ile aynı sınıf)
- `concepts/kapinin-olcutu-urunden-bagimsiz-olmali.md` (27 Eyl — kadraj kapısı, mutant K3)
- `decisions/fitset-tasarim-dili-3-grafit-27eyl.md` · `decisions/fitset-telefona-kurulum-magazasiz-27eyl.md`
- `issues/fitset-uretici-kendi-stil-sayfasini-atladi.md`

⭐ **Kod ayrı, ders ortak.** Bir dersin nerede *öğrenildiği* ile nerede
*geçerli* olduğu ayrı sorulardır; bu yüzden depolar ayrı tutulurken bilgi
katmanı bilerek ayrılmadı (7 Eyl 2026 kararı — ölçüldü: dokuz sayfanın altısı
`suite-standard`, yalnız biri FitSet'e özgü).
