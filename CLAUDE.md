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

## Yapı (ölçüldü, 24 Eyl 2026 — 3B geçişinden sonra)

```
js/        15 dosya · 4 990 satır (vendor hariç)   app · store · session · schedule · timer
                                                   ui · ilerleme · data/ · anim/ · anim3d/
js/anim3d/ 4 dosya · 1 424 satır   manken3d (iskelet+IK, SVG çizim, çerçeve) · hareketler3d
                                   (22 hareket, kısıtlarıyla) · webgl (three.js çizici) · sahne (giriş)
js/vendor/ three.min.js (530 KB · 135 KB gzip, MIT) + three-LICENSE.txt
tools/     21 betik · 3 293 satır  doğrulayıcılar + üreticiler (+ three-giris.js: paketi yeniden üretir)
css/       style.css (529 satır)
sw.js      119 satır — service worker · CACHE sürümü İÇERİKTEN türetilir
7 HTML     index.html + 6 mokap (cizimler · isinma · izometrik · genel · 3b · 3b-figur)
```

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
- **2B çizim emekli:** `js/anim/engine.js` uygulamada kullanılmıyor, yalnız eski mokaplar ve
  araçları (`verify-poses`, `verify-port`, `make-mockup*`, `audit-*`) için duruyor; `npm test`'te
  değiller. `exercises.js`'teki `a/b/eq` poz alanları ölü veri. Temizliği ayrı iş.

Derleme **yok** — saf statik dosyalar. `package.json` yalnız betikleri taşır
(`"private": true`, `"type": "module"`).

## Komutlar

```bash
npm test      # bump-sw (+ çevrimdışı kapısı) + check-contrast + fizik-denetimi
              # + test-store + test-session + test-timer + check-docs   ← tam kapı
npm run verify   # yalnız 3B fizik denetimi
npm run bump     # sw.js CACHE sürümünü artır
npm run icons    # ikon üretimi
npm run fonts    # font indirme
```

**Ölçüldü (24 Eyl 2026, 3B geçişi sonrası): `npm test` exit 0** — `test-store` 68 ·
`test-session` 235 · `test-timer` 14 · `check-docs` 15 · `fizik-denetimi` tümü temiz (22 hareket,
6 olumsuz fikstür, 25 kaydın 3B kapsamı, plank varyantları) · `bump-sw` çevrimdışı kapısı: `app.js`'ten
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
- `issues/fitset-uretici-kendi-stil-sayfasini-atladi.md`

⭐ **Kod ayrı, ders ortak.** Bir dersin nerede *öğrenildiği* ile nerede
*geçerli* olduğu ayrı sorulardır; bu yüzden depolar ayrı tutulurken bilgi
katmanı bilerek ayrılmadı (7 Eyl 2026 kararı — ölçüldü: dokuz sayfanın altısı
`suite-standard`, yalnız biri FitSet'e özgü).
