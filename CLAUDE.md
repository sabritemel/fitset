# FitSet — Agent Context

> **Salon antrenman defteri.** Çevrimdışı çalışan PWA; veri telefonda kalır.
> Saf HTML/CSS/JS, **sıfır çalışma-zamanı bağımlılığı**, IndexedDB.

## ⚠️ EN ÖNEMLİ KISIT: bu proje SmartVisor suite'inin PARÇASI DEĞİL

FitSet, `AntigravityProjeler/` altında **duruyor** ama suite'e **ait değil** —
FinLens ve SmartCRM gibi ayrı bir üründür. Bunun somut karşılıkları:

| | |
|---|---|
| Depo | **kendi git deposu**: `github.com/sabritemel/fitset` (kök depo `.gitignore` satır 123'te `FitSet/` ile onu dışlar) |
| Çıktılar | `artifacts/`'a **YAZILMAZ** — o depo QVS + STS + SVS içindir |
| Port tablosu | FitSet'in portu **yoktur**; suite port tablosuna eklenmez |
| Tasarım dili | suite'inkinden farklı olabilir; ISA-101 / endüstriyel HMI kuralları **burada geçerli değildir** (bu bir tüketici uygulaması, kontrol odası ekranı değil) |
| Lisans borcu | suite'in AGPL kısıtları burada ayrıca değerlendirilir; bugün sıfır bağımlılık var, **öyle kalması tercih edilir** |

⚠️ Suite'in kök `CLAUDE.md`'sindeki uygulama/port/altın-kural tablosu **bu
projeyi kapsamaz**. Buradaki tek üst kural şudur: *kök depoya sızma.*

## Yapı (ölçüldü, 7 Eyl 2026)

```
js/     10 dosya · 3 120 satır   app.js · store.js · session.js · schedule.js
                                 timer.js · ui/ · anim/ · data/
tools/  17 betik · 2 661 satır   doğrulayıcılar + üreticiler
css/    style.css (519 satır)
sw.js   98 satır — service worker · CACHE sürümü İÇERİKTEN türetilir
5 HTML  index.html + 4 mokap (cizimler · isinma · izometrik · genel)
```

Derleme **yok** — saf statik dosyalar. `package.json` yalnız betikleri taşır
(`"private": true`, `"type": "module"`).

## Komutlar

```bash
npm test      # bump-sw + check-contrast + verify-poses + verify-port
              # + test-store + test-session   ← tam kapı
npm run verify   # yalnız poz denetimi
npm run bump     # sw.js CACHE sürümünü artır
npm run icons    # ikon üretimi
npm run fonts    # font indirme
```

**Ölçüldü (7 Eyl 2026): `npm test` → 187 geçti · 0 kaldı.**

⚠️ `npm test` **`bump-sw.js` ile başlar** ve bu bilerek böyledir.

`sw.js` içindeki `CACHE` sürümü **elle yazılmaz** — `bump-sw.js` onu `ASSETS`
listesindeki dosyaların **içeriğinden** türetilen sha256'nın ilk 10 hanesinden
üretir (`fitset-<hash>`). Dosya değişmişse hash değişir, önbellek adı değişir,
güncelleme kendiliğinden tetiklenir.

⭐ Gerekçesi kaynakta yazılı: *"dosya değiştirdiysen sürümü artır" bir İNSAN
KURALIYDI ve tam da beklendiği gibi unutuldu* — tarayıcı eski CSS'i servis
etmeye devam etti, değişiklik "gitmemiş" gibi göründü.
**Unutulabilen bir adım kurala değil ARACA bağlanır.**

⚠️ `sw.js`'in kendi başlığındaki *"SÜRÜM ARTIRMAYI UNUTMA"* yorumu bu araçtan
ÖNCEsine ait — **bayattır**, ona göre davranma.

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
