# FitSet — Baş Tasarımcı ve Geliştirici Raporu

**Tarih:** 24 Eylül 2026 · **Kapsam:** kod, veri modeli, arayüz, test zemini, belgeler, 2 aylık istek geçmişi
**Durum:** Depoya girdi (24 Eyl, Sabri: *"wiki + artifact + hafıza, commit + push"*). İçindeki güvenlik bulgusu (§4, H3 — yedek içe aktarmada şema doğrulaması yoktu) **aynı gün kapandı** ve `07e7418` ile yayınlandı; rapor kapanmış bir bulguyu anlatıyor. Ek A–H turların kaydıdır.

---

## 0. Özet

FitSet **iyi mühendislik ürünü**: sıfır bağımlılık, cihazda kalan veri, geçmişten türetilen sıra,
187/187 yeşil test, gözle bulunan her hatanın bir denetime bağlanması. Tasarım dili (tek aile,
tek vurgu, kart yok) tutarlı ve olgun. Yayındaki sürüm depoyla birebir aynı (`fitset-409effe834`).

Ama premium bir uygulamanın **üç ayağından ikisi eksik**:

| Ayak | Durum | Özet |
|---|---|---|
| **Güven** — veri asla sessizce bozulmaz | ⚠️ **1 yüksek, 3 orta hata** | Kayıt başarısız olursa kullanıcıya hiçbir şey söylenmiyor ve sonraki dokunuş **hayalet setler** yazıyor (tarayıcıda üretildi) |
| **Süreklilik** — uygulama kullanıcıyla birlikte yaşar | ❌ **Program kodda sabit** | Hoca hareket değiştirdiğinde uygulama geliştirici olmadan güncellenemiyor; "3-4 güne büyür" iddiası da yanlış çıktı |
| **Zekâ** — uygulama sadece kaydetmez, yol gösterir | ❌ **Yok** | Ağırlık artırma önerisi, rekor tespiti, seans karşılaştırması yok; kutu hep geçen seferin aynısıyla doluyor |

**Önerim:** önce 1 turda **güveni** kapat (P0), sonra **program editörünü** mokapla başlat (P1),
premium hissi ise **ilerleme önerisi + rekor + seans özeti** üçlüsü verir (P2). Özellik yığmaya
gerek yok — senin tasarım dilin azaltarak kuruldu, premium da öyle kurulmalı.

---

## 1. Ne yaptım (yöntem)

- **Tüm kaynak okundu:** `js/` 10 dosya · 3 120 satır, `css/style.css` 519, `sw.js`, `index.html`,
  `manifest.json`, `KULLANIM.md`, `CLAUDE.md` — örnekleme değil okuma.
- **Geçmiş:** 33 commit'in gövdeleri (isteklerin tam metni orada), wiki `projects/fitset.md` +
  günlük kayıtları + hafıza.
- **Test:** `npm test` → **187 geçti · 0 kaldı**; çalışma ağacı değişmedi.
- **Canlı tur:** yerel sunucu, 390×844 (telefon), 6 haftalık örnek veriyle beş ekran gezildi,
  dokunma hedefleri ölçüldü. Örnek veri sonra silindi.
- **Hata üretimi:** üç şüphe tarayıcıda **denenerek** doğrulandı (H1, H3). Kodla kanıtlanan ama
  cihazda denenemeyenler **ayrıca işaretlendi**.
- **Yayın:** `sabritemel.github.io/fitset/sw.js` sürümü = depodaki sürüm; `main` = `origin/main`.

---

## 2. Nereden geldik — senin isteklerin ve verilen cevaplar

| Tarih | Senin isteğin / bildirimin | Ne yapıldı |
|---|---|---|
| 26-28 Tem | Tek dosyalık prototip → gerçek uygulama | "Motor kalır, şasi değişir": çubuk-adam motoru birebir taşındı (615 kare, 0 fark); depolama, takvim, arayüz yeniden yazıldı. Sıra **takvimden değil geçmişten**. GitHub Pages'e yayın |
| 30 Tem | Salon geri bildirimi: ekran kaymasın, adımlar panelde, hedefler kalıcı | Kaymayan odak ekranı (sabit bantlar + esneyen figür), kayan panel, hedef üzerine yazma |
| 30 Tem | Tek giriş, küçük rozetler, sayaç gezinmede | Ağırlık tek giriş; tekrar dokununca açılır; dinlenme sayacı alt çubukta yerinde |
| 30 Tem | **Tasarım dilini reddettin** (renk, tipografi, düğmeler) | Dil v2: tek aile (Archivo), tek vurgu yalnız canlıya, kart yok — mokap → onay → kod |
| 30 Tem | "Gözü yormayan soft ton" | Kontrast ve parlaklık iki ayrı ölçüt; `check-contrast.js` teste bağlandı |
| 30 Tem | "Sitede hâlâ eski versiyon" | PWA bekleyen sürüm tuzağı çözüldü (`reg.waiting` ayrıca yoklanıyor) |
| 16 Ağu | Isınma ekranı: saymasın, göstersin, ekranı doldursun, küçük animasyonlar | Numarasız ısınma satırı + ekranı; animasyon sırayla, tek figür |
| 16 Ağu | Two Arm Row dizi ters kırılıyor (salonda gördün) | IK ile düzeltildi + **yön denetimi** eklendi (doğrulayıcının 2. kör noktası) |
| 16 Ağu | Rozetler taşıyor | Son 3 rozet + "+N" |
| 19 Ağu | "Gitmediğim gün ne oluyor · ayar sayfası var mı · metriklerim kaydediliyor mu?" | Ayarlar ekranı · yarım kalan gün bandı · Geçmiş + kilo takibi |
| 19 Ağu | Reverse Pec Fly okunmuyor; izometrik çizilebilir mi? | Arkadan görünüm; izometrik prototiplendi ama **denetim ağı olmadığı için** uygulanmadı |
| 6 Eyl | Telefonsuz yaptığın gün sayılmıyor; başka güne geçilemiyor | Gün seçici ("öner, dayatma") + "kaydetmeden yaptım" |
| 6 Eyl | "Yanlış kaydı nasıl düzelteceksin?" · "Son set silinirse seans silinsin" | Geçmiş seans düzenleme, yumuşak silme + geri getirme |
| 7 Eyl | — | `CLAUDE.md` ajan bağlamı (suite dışı + pahalı dersler) |

**Açık bekleyenler (kayıtlardan):** ısınma içeriğini hocaya sormak (iki kez soruldu, yanıt yok) ·
zayıf çizimler (Bench Press, Leg Press, Seated Cable Row, Overhead Triceps Ext.) · izometrik motor ·
seans sonunda kilo sorma (sen deneyince) · `unit`/`theme` sahte ayarları · "Bugünü sıfırla" geri-alı
yalnız bellekte.

---

## 3. Ürünün DNA'sı — önerilerin uyması gereken ilkeler

İki ayda verdiğin kararlardan çıkardığım kurallar. Aşağıdaki her öneri bunlara göre süzüldü:

1. **Salonda tek el, terli parmak:** az dokunuş, kaymayan ekran, modal yok.
2. **Azaltarak tasarım:** tek aile, tek vurgu, kart yok. Premium = daha az ama daha doğru.
3. **Dürüstlük:** yalan söyleyen ayar yok, uydurma istatistik yok, "12 sn önce bitti" denir.
4. **Öner, dayatma:** son söz kullanıcının (gün seçici, yarım gün bandı).
5. **Veri cihazda, sıfır bağımlılık:** sunucu, hesap, izleme yok.
6. **Gözle test:** her değişiklik "salonda nasıl doğrulanır" sorusuyla biter.

---

## 4. Hatalar — kanıtlı

| # | Önem | Hata | Nerede | Kanıt |
|---|---|---|---|---|
| **H1** | **YÜKSEK** | **Kayıt başarısız olunca sessizlik + hayalet set.** `kaydet()` seti önce belleğe ekliyor, sonra diske yazıyor; yazma hata verirse ekran değişmiyor, uyarı çıkmıyor. Kullanıcı tekrar basıyor → bellekte ikinci set. Depolama düzelince tek dokunuş **3 set** yazıyor. Ayrıca yalnız `error` olayı dinleniyor; async işleyicilerin hataları (`unhandledrejection`) hiç yakalanmıyor | [app.js:266-274](../js/app.js#L266-L274), [app.js:780](../js/app.js#L780) | **Tarayıcıda üretildi:** yazma hatası simüle edildi → uyarı yok, düğme aynı; düzelince tek dokunuşla rozetler `1 · 2 · 3 × 30×12`, başlık `3/3 SET` |
| **H2** | ORTA | **Ekran kilidi (Wake Lock) geri alınmıyor.** Sayfa arka plana geçince tarayıcı kilidi bırakıyor ama nesne referansı duruyor; dönüşte `if (!this.#lock)` yanlış çıktığı için yeniden istenmiyor. Sonuç: bir kez başka uygulamaya geçip dönersen dinlenme sırasında ekran kararabilir ve titreşim/bip kaçar | [timer.js:126-131](../js/timer.js#L126-L131) | Kod okumasıyla kanıtlı (`WakeLockSentinel.released`); **cihazda denenmedi** |
| **H3** | ORTA | **Yedek içe aktarımı şema doğrulamasız.** Yalnız `app` ve `schemaVersion` bakılıyor. Aralık dışı `dayIndex` Geçmiş ekranını çökertiyor; seans `id`'si kaçışsız HTML'e basılıyor. Uygulamanın kendi yorumu "düşmanca yedek dosyası kod çalıştırırdı" diyerek bu tehdidi zaten tanımış — ama yalnız toast'ta korumuş | [store.js:273-301](../js/store.js#L273-L301), [ui.js:487](../js/ui.js#L487), [app.js:43-45](../js/app.js#L43-L45) | **Tarayıcıda:** `dayIndex:7` → `Cannot read properties of undefined`; `id` içindeki `<img onerror>` HTML'e **kaçışsız** girdi |
| **H4** | ORTA | **"Program 3-4 güne çıkarsa seçici kendiliğinden büyür" iddiası yanlış.** Sıra `son === 0 ? 1 : 0` ile ikili; 3. gün asla sıraya girmez. `DAY_NAMES`, ısınma süreleri ve ilerleme listesi de 2 güne çivili; 3. gün eklenirse gün seçici `undefined.split` ile çöker | [session.js:36](../js/session.js#L36), [session.js:9](../js/session.js#L9), [session.js:488](../js/session.js#L488), [warmup.js:107](../js/data/warmup.js#L107) | Kod okumasıyla kanıtlı. 6 Eyl commit mesajındaki vaat ile kod çelişiyor |
| **H5** | DÜŞÜK-ORTA | **Sessiz güncelleme işi kesiyor.** "Güvenli" ölçütü yalnız "set var mı". Isınma ekranındayken, ağırlık yazmışken ya da ilk Plank sayacı çalışırken uygulamaya dönünce yeni sürüm sayfayı **yeniden yüklüyor** → listeye atılırsın, taslak/sayaç gider | [app.js:755](../js/app.js#L755) | Kod okumasıyla kanıtlı |
| **H6** | DÜŞÜK | **Geçmişte tek set silme geri alınamıyor** — küçük "sil" yazısına tek dokunuş, geri-al yok. Seans silmede var. Uygulamanın kendi ilkesi: *"geri al konfor değil zorunluluk"* | [app.js:333](../js/app.js#L333) vs [session.js:229](../js/session.js#L229) | Kod + ekran |
| **H7** | DÜŞÜK | **Ondalık/binlik ayracı karışık.** Aynı Geçmiş ekranında `80.8 kg` (nokta = ondalık) ve `12.870 kg` (nokta = binlik) yan yana. Odakta giriş `27,5`, rozetler `27.5×12` | [ui.js:23](../js/ui.js#L23), [ui.js:469](../js/ui.js#L469), [ui.js:504](../js/ui.js#L504) | Ekran görüntüsünde görüldü |
| **H8** | DÜŞÜK | **Bugünkü kilo alanı UTC tarihiyle karşılaştırılıyor.** Kayıt yerel güne yazılıyor (`dayKey`), ön-doldurma `toISOString()` (UTC) ile bakıyor → 00:00-03:00 arası yanlış gün. `schedule.js` başlığı tam da bu sınıfa karşı uyarıyor | [ui.js:476](../js/ui.js#L476) | Kod |
| **H9** | DÜŞÜK | Düzenleme ekranında set numarası ısınma setlerini sayıyor (`ıs, 2, 3, 4`); odak ekranı saymıyor (`ısınma, 1, 2, 3`) | [ui.js:541](../js/ui.js#L541) vs [ui.js:364](../js/ui.js#L364) | Kod |
| **H10** | DÜŞÜK | İçe aktarma özeti seans ve kilo kayıtlarını tek sayıda topluyor ("28 yeni" = 14 seans + 14 kilo) | [store.js:284](../js/store.js#L284) | Tarayıcıda görüldü |
| **H11** | DÜŞÜK | Font dosyaları ön-önbellek listesinde yok; kurulumdan hemen sonra çevrimdışı açılırsa sistem fontuna düşer | [sw.js](../sw.js) `ASSETS` | Çıkarım, denenmedi |
| **H12** | DÜŞÜK | Uyarı toast'ı kırmızı kenarlıkla (`--live`) — kendi kuralın "kırmızı yalnız canlı olana" ile çelişiyor; amber (`--warn`) zaten var | [style.css:368](../css/style.css#L368) | Kod |

### Belgeleme ve ölü kod borcu

- **`KULLANIM.md` 28 Temmuz'da donmuş.** "Ayarlar ekranı yok", "dinlenme 90 sn", "Yedek al liste
  ekranında", "ısınma kutucuğu", "dört doğrulayıcı" diyor; Geçmiş, kilo, gün seçici, düzenleme hiç
  yok. Bu, projenin kendi dersinin tekrarı: *kayıt koda bağlanmazsa sessizce bayatlar*.
- **Wiki `projects/fitset.md` 19 Ağu'da:** 171 test yazıyor (gerçek 187), 6 Eyl özellikleri yok.
- **`sw.js` başlığındaki "SÜRÜM ARTIRMAYI UNUTMA"** bayat — `CLAUDE.md` bunu ilan etmiş ama
  kaynaktaki yorum hâlâ yanlış kuralı öğretiyor.
- Yorumlarda vurgu rengi `#FF3B4E`, gerçekte `#EE5568`.
- **Ölü yollar:** `setNote` (not alanı veri modelinde var, arayüz yok) · `unit` / `theme` ·
  `--touch: 48px` jetonu (tanımlı, hiç kullanılmıyor) · kardiyo kayıt dalı (aşağıda G2).

---

## 5. Eksikler — ürün boşlukları

| # | Eksik | Neden önemli |
|---|---|---|
| **G1** | **Program kodda sabit.** Arayüzden yalnız set/tekrar/ağırlık değişiyor; hareket ekleme, çıkarma, sıralama, gün ekleme **geliştirici** istiyor | Hocalar programı tipik olarak 6-8 haftada değiştirir. O gün uygulama ya kodlanır ya bırakılır — ürünün ömrünü belirleyen tek kalem bu |
| **G2** | **Antrenman sonu kardiyo kaydedilemiyor.** Veri modeli (`setType:'cardio'`, 20 dk hedef) ve kaydetme dalı var; liste ekranındaki blok düz metin | "Ayar nesnede duruyor diye çalışmıyor" dersinin kardiyo hâli — uyuyan yetenek |
| **G3** | Geçmiş son 12 seansla sınırlı; hareket bazında ayrıntı sayfası yok | 3. ayda "Mayıs'ta bench kaçtı?" sorusu cevapsız |
| **G4** | **İlerleme önerisi yok.** Kutu geçen seferin aynısıyla doluyor; 3×12 tutsa da "artır" sinyali yok | Direnç antrenmanının temel kuralı kademeli yüklenme; premium uygulamaların (Strong, Hevy, Fitbod) ayırt edici özelliği |
| **G5** | Rekor (PR) tespiti yok | En ucuz motivasyon kaynağı; veri zaten var |
| **G6** | Makine ayarı notu yok (koltuk kademesi, sırt pedi) | Salonun en tekrar eden küçük sürtünmesi; `note` alanı modelde hazır |
| **G7** | Seans sonu özeti tek satırlık toast; önceki aynı günle karşılaştırma yok | Seansın "kapanış hissi" yok |
| **G8** | Yedek hatırlatması sayıya bağlı (her 8 seans), son yedek tarihi tutulmuyor | "Veri yalnız bu telefonda" ürünün en büyük riski; görünmez |
| **G9** | Dinlenme tek genel süre | Bileşik hareket (bench) 90-120 sn, izole (curl) 60 sn ister |
| **G10** | Dokunma hedefleri küçük: dinlenmede **"geç" 34×22 px**, "+30" 38×27, "geri al" 40×28, üst ikonlar 36×36 | Seansta ~27 kez kullanılan "geç" terli parmakla 22 px yükseklikte. Hedef ≥44 px |
| **G11** | Erişilebilirlik: toast `aria-live` değil; ekran değişiminde odak yönetimi yok | Düşük öncelik ama ucuz |
| **G12** | **Arayüz katmanı (app.js, 780 satır) otomatik test dışı** | Canlıda bulunan hataların çoğu tam bu katmandaydı; H1 de burada |

---

## 6. Premium için öneriler — öncelikli yol haritası

Efor: **S** küçük (tek oturumun bir kısmı) · **M** orta (bir oturum) · **L** büyük (mokap + birkaç oturum).
Her maddenin sonunda **gözle doğrulama** yolu var (bu projenin kuralı).

### P0 — Güven (önce bunlar; tek tur)

| # | Öneri | Efor | Gözle doğrulama |
|---|---|---|---|
| 1 | **Kaydı işlemsel yap:** seti önce bir kopyada diske yaz, başarılıysa belleğe al; başarısızsa kalıcı "Kaydedilemedi — tekrar dene" şeridi. Global `unhandledrejection` yakalayıcı. Test: bellek sürücüsüne hata enjeksiyonu → hayalet set sayısı 0 | S | Uçak modunda değil; testle + geliştirici konsolunda simüle |
| 2 | **Wake Lock'u her dönüşte yeniden al** (`released` kontrolü / `release` olayı) | S | Dinlenme başlat → WhatsApp'a geç → dön → ekran kararmamalı, sayaç bitince titremeli |
| 3 | **İçe aktarımda şema doğrulaması** (dayIndex aralığı, durum listesi, sayısal alanlar, id deseni) + HTML'e basılan her veri için tek `esc()`. Geçersiz satır atlanır ve **sayılır** | S | Bozuk bir yedek dosyası yükle → "3 kayıt geçersiz, atlandı" |
| 4 | **Güncellemeyi yalnız gerçekten güvenliyken uygula:** liste ekranında, taslak ve sayaç yokken; aksi hâlde şerit | S | Isınma ekranındayken yeni sürüm yayınla → ekran yerinde kalmalı |
| 5 | Tek set silmeye **geri-al** | S | Geçmişte set sil → "Geri getir" |
| 6 | **Tek sayı biçimleyici** (`tr-TR`, virgül ondalık) her yerde; UTC kilo hatası; ısınma numaralandırması; import özetini ayır; uyarı rengi amber | S | Geçmiş ekranında `80,8 kg` ve `12.870 kg` karışmamalı |

### P1 — Süreklilik

| # | Öneri | Efor |
|---|---|---|
| 7 | **Program veri olsun, kod olmasın.** İkiye ayır: **hareket kütüphanesi** (kodda kalır — çizim, poz, denetim) + **program** (IndexedDB'de, yedeğe dahil, düzenlenebilir: günler, hareket sırası, set/tekrar/dinlenme). Sıra `(son + 1) % N` — N gün. Kütüphanede olmayan hareket **çizimsiz ama kaydedilebilir** eklenir (dürüst yedek: "bu hareketin çizimi yok"). Göç: bugünkü program "program v1" olur, hareket kimlikleri aynı kalır, geçmiş kaymaz. **Senin kuralın gereği önce çizimli mokap.** | L |
| 8 | **Kardiyo kaydı:** antrenman sonu bloğu dokunulabilir olsun (dakika + isteğe bağlı koşu bandı/bisiklet). Veri modeli hazır | S |
| 9 | **Belgeleri koda bağla:** `KULLANIM.md` yeniden yazılsın; basit bir kapı ekran listesini ve test sayısını koddan okuyup belgeyle karşılaştırsın. `sw.js` başlık yorumu düzeltilsin, wiki sayfası tazelensin | S |
| 10 | **Arayüz kurallarını modüllere taşı** (dersin #6: *kural olayın değil alanın yanında durur*): `kaydet`, gün değiştirme, güncelleme güvenliği gibi kararlar `session.js`'e → Node'da test edilebilir. İsteğe bağlı: Playwright varsa koşan, yoksa açıkça "atlandı" diyen bir duman testi (çalışma-zamanı bağımlılığı değil) | M |

### P2 — Antrenman zekâsı (premium hissin asıl kaynağı)

| # | Öneri | Efor | Not |
|---|---|---|---|
| 11 | **İlerleme önerisi (çift ilerleme):** son seansta tüm çalışma setleri hedef tekrarı tuttuysa odak ekranında sessiz bir satır: *"Geçen sefer 3×12 tuttu — 30 kg dene"* (bar +2,5 · dambıl +1/+2). Kutu **öneriyle değil geçen seferle** dolar; öneri **tek dokunuşla** uygulanır | M | "Öner, dayatma"ya birebir uyuyor; kural `session.js`'te, testli. Artış adımı hocanın yöntemine göre ayarlanmalı (§8 soru 2) |
| 12 | **Rekor tespiti:** ağırlık rekoru, aynı ağırlıkta tekrar rekoru, tahmini 1TM (Epley: `ağırlık × (1 + tekrar/30)`). Rozette küçük bir işaret, seans özetinde liste. **Konfeti yok** | S | Veri zaten var |
| 13 | **Seans özeti ekranı** (toast yerine): süre · set · hacim · **aynı günün önceki seansına göre ↑↓** · rekorlar · atlanan hareketler · **"Hocaya gönder"** (paylaşım menüsüyle düz metin özet — WhatsApp'a yapıştırılabilir) | M | Hoca döngünün içinde; bunu somut kılar |
| 14 | **Makine ayarı notu:** hareket başına kalıcı tek satır ("koltuk 4 · sırt 2"), odak ekranında başlığın altında | S | Ölü `setNote`/`note` alanı canlanıyor |
| 15 | **Hareket başına dinlenme** (programdan; genel ayar varsayılan kalır) | S | P1-7 ile birlikte doğal |
| 16 | **Hareket detay sayfası:** tüm seanslar tablo + en ağır set + 1TM eğrisi; Geçmiş'te 12 seans sınırı yerine aylara göre gruplu tam liste | M | |
| 17 | **Plaka hesaplayıcı** (barbell): "60 kg → 20 bar + her yana 15 + 5". Uygulama zaten "bar dahil toplam" diyor | S | İsteğe bağlı |
| 18 | **İstikrar görünümü:** son 12 haftanın ısı haritası (planlanan gün / yapılan gün). **Seri/alev baskısı yok** — bilgi, oyun değil | S | |

### P3 — Cila

| # | Öneri | Efor |
|---|---|---|
| 19 | Dokunma hedefleri ≥44 px ("geç", "+30", "geri al", üst ikonlar); `--touch` jetonunu gerçekten kullan | S |
| 20 | **Ekran geçişleri:** View Transitions API (bağımlılıksız, `prefers-reduced-motion`'a saygılı) — liste ↔ odak geçişi şu an anlık `innerHTML` değişimi | S |
| 21 | `aria-live` toast, ekran değişiminde başlığa odak | S |
| 22 | **`theme` kararı:** ya açık temayı uygula ya alanı sil — ayar yalan söylememeli. Önerim: parlak ışıklı salon/dış mekân ihtiyacı yoksa **sil** | S |
| 23 | Seans sonunda "bugün tartıldın mı?" (senin ertelediğin madde — özet ekranına doğal oturur) | S |
| 24 | Zayıf dört çizim (Bench Press, Leg Press, Seated Cable Row, Overhead Ext.) — salonda gözle karar | M |
| 25 | Fontları ön-önbelleğe al; "Yedek" bölümünde **son yedek tarihi** ve depolamanın kalıcı olup olmadığı (`storage.persisted()`) | S |

---

## 7. Bilerek YAPILMAMASI gerekenler

Premium ≠ özellik yığını. Bunlar senin ilkelerinle çelişiyor:

- **Hesap / bulut senkronu** — "veri cihazda" ilkesini bozar. Yerine: son yedek tarihi + hatırlatma (P3-25).
- **Oyunlaştırma** (seri alevleri, rozet koleksiyonu, konfeti) — "sessiz sporcu aracı" diline aykırı.
- **Yapay zekâ koç / programı otomatik değiştirme** — "öner, dayatma"; hoca döngüde.
- **Apple Health / Google Fit** — PWA'dan erişim yok; vaat edilemez.
- **İzometrik çizim** — denetim ağı kurulmadan değil (19 Ağu kararı hâlâ geçerli).
- **lbs birimi** — dönüşüm uygulanmadan arayüze konmaz.

---

## 8. Önerilen sıra

1. **Tur 1 — P0 (1-6) + belge (9):** güven kapanır, kılavuz güncellenir. Tek oturum.
2. **Tur 2 — Program editörü mokabı (7):** önce çizimli mokap, onayınla kod. Kardiyo (8) aynı turda.
3. **Tur 3 — Zekâ üçlüsü (11 + 12 + 13):** ilerleme önerisi, rekor, seans özeti + "Hocaya gönder".
4. **Sonra:** makine notu (14), hareket detayı (16), cila (P3) — salon geri bildirimine göre.

---

## 9. Kararlar sende — açık sorular

1. **Program editörünün kapsamı:** yalnız hareket ekle/çıkar/sırala mı, yoksa sıfırdan program
   yazma da mı? Hocan programı ne sıklıkla değiştiriyor?
2. **İlerleme kuralı:** "Hedef tekrarı tuttuysan +2,5 kg" hocanın yöntemine uyuyor mu, yoksa o
   tekrar aralığıyla mı (ör. 10-12) çalışıyor?
3. **Isınma içeriği:** hocadan öneri geldi mi? (İki kez soruldu, hâlâ bekliyor.)
4. **Açık tema** gerekli mi, yoksa `theme` alanı silinsin mi?
5. **Bu rapor** public depoya commit edilsin mi? (H3 güvenlik bulgusu içeriyor — P0 kapandıktan
   sonra commit etmek daha doğru olur.) → **Cevap (24 Eyl): evet** — P0 (H3 dahil) `07e7418` ile
   yayınlandıktan sonra, Sabri'nin "commit + push" talimatıyla.

---
---

# EK A — Tur 1 uygulandı (24 Eyl, aynı gün) · commit EDİLMEDİ

Sabri: *"daha sonra commit edelim, önce gelişmeye bakalım."* Kod çalışma ağacında.

| # | Durum | Nasıl doğrulandı |
|---|---|---|
| H1 sessiz kayıt + hayalet set | ✅ `session.transact` (önce disk, sonra bellek) + `unhandledrejection` yakalayıcı | test §25 · mutasyon M1 · **canlı**: yazma hatasında amber "Kaydedilemedi" şeridi, rozet yok, dinlenme başlamıyor; düzelince tek basış = **1 set** (önce 3) |
| **H13 (YENİ)** ilk seti geri alınca set diskte kalıyordu | ✅ `persist` boşalan seansı diskten de siler | düzeltmeden **önce ölçüldü** (bellekte 0 · diskte 1 · yeniden açılışta 1) · test §26 · M2 · **canlı**: geri al → yenile → seans boş |
| H2 Wake Lock dönüşte alınmıyor | ✅ `release` olayı + `awake` denetimi | yeni `test-timer.js` (olay yayan ve yaymayan iki kilit türü) · M3 · ⚠️ **cihazda denenmedi** |
| H3 import şema doğrulamasız | ✅ `gecersizSeans` + `temizAyar` + `esc()` | test §12 (11 bozuk vaka) · M4 M5 M7 M12 · **canlı**: bozuk dosya → "1 yeni seans · 1 kilo kaydı · 3 bozuk kayıt atlandı", Geçmiş çökmüyor, sayfaya HTML girmiyor, ayarlar bozulmuyor |
| H5 güncelleme işi kesiyor | ✅ `session.guncellemeKarari` (uygula / bekle / sor) | test §28 · M10 · canlı: yeni sürüm boş listede kendiliğinden uygulandı · ⚠️ "bekle" dalı yalnız testte |
| H6 tek set silmede geri-al yok | ✅ `restoreSet` + "Geri getir" | test §27 · M11 · **canlı**: sil → geri getir → `40, 400` aynı yerde |
| **H14 (YENİ)** set silince düzenleme ekranından listeye atılıyordu | ✅ görünüm geri kuruluyor | **canlıda bulundu** (önceden var olan kusur) · ⚠️ arayüz katmanında, otomatik testi yok |
| H7 sayı biçimi | ✅ tek `fmt()` (tr-TR) | test §29 · M8 · canlı: `27,5×12` · `80,5 kg` · `149.280 kg` |
| H8 · H9 · H10 · H12 | ✅ | test §29 · M6 M9 · canlı (amber `rgb(216,170,94)`) |
| H4 iki gün sabit · H11 font ön-önbelleği | ⏸ bilerek bırakıldı — H4 program editörüyle, H11 cila turuyla | |
| Belge | ✅ `KULLANIM.md` baştan yazıldı · `check-docs.js` kapısı (eski kılavuza karşı **10 kırmızı**, yenisine 16/16) · `sw.js` başlığı · `CLAUDE.md` | |

**Kapı:** `npm test` exit 0 — `test-store` 47→**68** · `test-session` 187→**214** · `test-timer` **14** (yeni) · `check-docs` **16** (yeni).
**Mutasyon:** 12/12 öldü, 0 kaçtı, 0 geçersiz (her düzeltme tek tek geri bozuldu, ilgili test kırmızıya döndü; dosyalar sha256 ile geri doğrulandı).
**Değişiklik:** 11 dosya +605 / −181, 3 yeni dosya.

⚠️ **Canlı doğrulamada kendi hatam:** kodu düzenleyip `bump-sw` koşmadan tarayıcıyı yeniledim; service
worker önbellekteki **eski** `app.js`'i sundu ve düzeltme "işe yaramıyor" göründü. Kaynak `fetch` ile
okunarak yakalandı → `CLAUDE.md`'ye eklendi.

**Ölü kod (dokunulmadı):** `app.js` ekranda olmayan `#scrub` / `#phase` öğelerini güncelliyor;
egzersiz verisindeki `vl` (görüş etiketi) hiçbir yerde gösterilmiyor.

---

# EK B — Sabri'nin kararları ve üç büyük iş için öneriler

## Kararlar (24 Eyl)

1. **Program sıfırdan da yazılabilsin.**
2. **İlerleme kuralı:** hoca yalnız "yapabildiğin kadar artır" diyor → **genel geçer, en yaygın/en başarılı standart**.
3. **Isınma:** bugünkü ısınmayı kodlama ajanı yazdı → **o günün programına göre otomatik** üretilsin.
4. Commit sonra; önce gelişmeye bakılacak.
5. (Yeni istek) Animasyonlar **daha anlaşılır, daha doğru, hafif ama net 3B** olabilir mi?

## ⭐ Ortak temel: hareket kütüphanesi

Üç iş de **aynı veri modeline** dayanıyor; ayrı ayrı yazılırlarsa üç kez yazılır:

| Kütüphane alanı | Program editörü | İlerleme | Isınma | 3B |
|---|---|---|---|---|
| ad, ekipman, kas grupları | seçim listesi | — | bölge seçimi | — |
| örüntü (itme/çekme yatay-dikey, squat, hinge, lunge, izole, core) | filtre | artış yüzdesi | hareketlilik + hazırlık seti | kamera |
| bileşik / izole | — | %5 / %2,5 | hazırlık seti kime | — |
| ekipman adımı (bar 2,5 · dambıl 2/2,5 · makine 5) | — | yuvarlama | yüzde yuvarlama | — |
| 3B poz + kamera | önizleme | — | ısınma figürleri | çizim |

Açık veri: **free-exercise-db** (Unlicense, 800+ hareket; `force`, `mechanic`, `primaryMuscles`,
`equipment`) üst veri kaynağı olabilir — **örüntü alanı yok**, elle etiketlenir; görsellerinin lisansı
ayrıca kontrol edilmeli. https://github.com/yuhonas/free-exercise-db

## 1) İlerleme kuralı — önerilen varsayılan (kaynaklı)

**Standart:** ACSM 2009 pozisyon bildirisi (kanıt düzeyi B): *"a 2–10% increase in load be applied when
the individual can perform the current workload for 1–2 repetitions over the desired number on two
consecutive training sessions"* (küçük kasa alt, büyük kasa üst yüzde). NSCA "2-for-2" aynı yönde
(birincil metin doğrulanamadı). Uygulamalarda en yaygın biçimi **çift ilerleme** (Hevy: tüm setler
aralığın üst sınırına ulaşınca artır). Plotkin 2022 RKÇ: tekrar ilerletmek ile yük ilerletmek benzer
kas büyümesi.
https://pubmed.ncbi.nlm.nih.gov/19204579/ · https://www.hevyapp.com/features/workout-plan-generator/ · https://pmc.ncbi.nlm.nih.gov/articles/PMC9528903/
⚠️ ACSM bildirisi **Mart 2026'da yenilendi**; yeni metinde somut artış kuralı var mı doğrulanamadı (ücretli).

**Kural (muhafazakâr — "iki ardışık seans" en güçlü iki kaynağın ortak noktası):**
1. Her harekette **tekrar aralığı** `[alt, üst]` — bugünkü "3 × 12" → **8–12** (ACSM acemi aralığı; editörde değişir).
2. Aynı ağırlıkla **iki ardışık seansta tüm çalışma setleri ≥ üst** → öneri: `yeni = yukarı_yuvarla(W × (1 + p), adım)`; `p` bileşik 0,05 · izole 0,025.
3. Adım ağırlığın %10'undan büyükse (ör. 10 → 12,5 kg dambıl = %25) önce **tekrar** ilerletilir: tüm setler ≥ üst + 2 olmadan artış önerilmez; artış sonrası alt sınırın altına düşülürse eski ağırlığa dönülür.
4. Aksi hâlde aynı ağırlık, hedef "geçen seferden +1 tekrar".
5. **Tıkanma:** aynı ağırlıkta iki seans üst üste bir set < alt → "%10 düşür" önerisi (pratik kural, StrongLifts; hakemli kanıt yok — ilan edilir).
6. RIR/RPE karara girmez (acemide tahmin hatası ~1 tekrar; Helms 2016).
7. **Öner, dayatma:** kutu yine geçen seferle dolar; öneri odak ekranında tek satır + tek dokunuşla uygulanır.
Daha agresif alternatif: tek seans yeterli (Hevy'nin yaptığı). Seçim senin.

## 2) Otomatik ısınma — önerilen kural seti (RAMP)

**Çerçeve:** RAMP (Jeffreys 2007): *Raise → Activate & Mobilise → Potentiate*. Isınma, ölçülen
performans ölçütlerinin %79'unu iyileştiriyor (Fradkin 2010). Statik esneme kas başına ≥60 sn olunca
−%4,6 (Behm 2016) → ısınmada statik esneme yok ya da ≤30 sn.
https://cdn.uksca.org.uk/assets/pdfs/UkscaIqPdfs/ramp-warmups-more-than-simply-shortterm-preparation-636825390373342631.pdf · https://cdnsciencepub.com/doi/10.1139/apnm-2015-0235

**Girdi:** günün hareket listesi + her hareketin örüntüsü, kasları, bileşik/izole bilgisi, çalışma ağırlığı `W` (geçen seferden) ve ekipman adımı.
1. **Yükselt:** 5 dk hafif kardiyo (konuşabileceğin tempo).
2. **Hareketlendir:** günün örüntülerinden bölge başına 1–2 dinamik hareket, 8–10 tekrar (itme → kol çevirme, duvar kaydırma · çekme → pull-apart, göğüs omurgası rotasyonu · squat/lunge → vücut ağırlığı squat, bacak sallama · hinge → kalça menteşe drili).
3. **Hazırla:** her örüntünün günün **ilk bileşik** hareketinde `%50·W × 8` ve `%75·W × 4` (çalışma tekrarı ≤6 ise `%90·W × 1–2`), adıma aşağı yuvarlanır; W'ye eşit ya da tekrar eden set üretilmez.
4. Birincil kası o gün zaten çalışmış hareket → hazırlık seti yok; değilse izole harekete `%50·W × 10` bir set.
5. Tahmini süre (10–15 dk) ekranda.
⚠️ Hazırlık setlerinin şeması **tartışmalı** (Ribeiro 2020 faydalı · Enes 2025 ~10RM'de küçük fark);
"hangi harekete" sorusuna kaynaklı kural yok → 3–4. maddeler bir **tasarım kararı**, kanıt değil.
Örnek (1. Gün): 5 dk kardiyo · kol çevirme + duvar kaydırma · bench `%50×8, %75×4` · omuz presi `%50×8, %75×4` · triceps 0.

## 3) 3B animasyon — öneri ve mokap

**Mokap:** `mockup-3b.html` + `tools/proto-3b/manken3d.js` (uygulama koduna dokunmaz). Görmek için
`node tools/serve.js` → `http://localhost:5099/mockup-3b.html` (telefondan aynı Wi-Fi ile ağ adresi).
Bench Press ve Reverse Pec Fly; solda bugünkü 2B (uygulamanın kendi motorundan canlı), sağda 3B,
parmakla döndürülür, altta aynı an üç kameradan.

**Ağustos denemesi neden kötü okunuyordu, bu neden farklı:** Ağustos iskeleti 3B hesaplıyordu ama
**çizgi** çiziyordu; çizgi figürde göz derinliği okuyamaz ("kollar kanat gibi"). Mokap üç ipucu ekliyor,
hepsi SVG, bağımlılıksız:
- **Hacim:** her uzuv bir kapsül. Kapsülün dik izdüşümü tam olarak yuvarlak uçlu kalın çizgidir → hacim bedava.
- **Örtme:** kapsüller uzaktan yakına sıralanır, her birinin altında zemin renginde kontur → üst üste binen uzuvlar ayrılır.
- **Zemin + gölge + derinlik tonu:** figür yerde durur; yakın uzuv açık, uzak uzuv koyu.
- **Kamera:** hareket başına hareket düzlemini gösteren açı + parmakla döndürme.

**Ölçüm (masaüstü, başsız tarayıcı):** 55–66 SVG öğesi/kare · kare hesabı medyan **0,30 ms**, p95
**0,80 ms** (telefonda birkaç kat yavaş olsa da 16 ms bütçenin çok altında) · motor ~210 satır, sıfır bağımlılık.

**Neden three.js/WebGL değil (şimdilik):** kütüphane yüz kilobaytlar, deri geçirilmiş model + her
hareket için animasyon üretim hattı gerekir (Blender/Mixamo; Mixamo kullanım koşulları ayrıca
incelenmeli), sıfır bağımlılık ilkesini bozar ve **denetlenmesi zor**. SVG manken yetmezse ikinci basamak.

**Üretim motoru için öneri (mokaptan farkı):** pozlar dünya yönleriyle değil **anatomik eklem
açılarıyla** (diz: yalnız fleksiyon 0–150°; omuz: fleksiyon/abdüksiyon/rotasyon) tanımlanır. Böylece
gözle bulunan hata sınıfı (ters bükülen diz/dirsek) **temsil edilemez hâle gelir**; yön denetimi bir
aralık denetimine iner. Denetim ağı (izometrik o gün bu yüzden reddedilmişti) motordan **önce** yazılır:
uzuv uzunluğu · eklem aralıkları (ara karelerde) · ayak zeminde/kaymıyor · **uzuv gövdeyi delmiyor**
(yeni, yalnız 3B'de mümkün) · el ekipmanda. Göç: bugünkü 2B pozlar 3B'ye çevrilir; yan kameradan (θ 0°)
izdüşümleri bugünkü çizimle **0 fark** vermeli (Temmuz taşımasındaki 615 kare kanıtının aynısı).

**Mokabın ilan edilen sınırları:** pozlar dünya yönleriyle (anatomik değil) · uzun kapsüller kesişince
ressam sıralaması yanılabilir · bench bacak pozu hâlâ kaba · yalnız iki hareket · telefonda denenmedi.

## Önerilen sıra (onayını bekliyor)

1. **İlerleme önerisi** (M) — bugünkü veriyle hemen çalışır, kütüphane beklemez.
2. **Hareket kütüphanesi modeli + 3B motor + denetim ağı** (L) — program editörü yeni hareket
   ekleyeceği için yeni hareketler 2B'de değil doğrudan 3B'de yazılsın; iş iki kez yapılmasın.
3. **Program editörü** (L) — önce çizimli mokap.
4. **Otomatik ısınma** (M) — kütüphane üst verisiyle.

---

# EK C — Fiziksel gerçeklik: "aynı barı tutan eller" (Sabri'nin gözlemi, 24 Eyl)

> *"Bench press'te sporcu barı iki eliyle tutuyor; kaldırırken ve indirirken elleri arasındaki mesafe
> sabit kalmıyor, daralıp genişliyor. Bu şekilde bazı hareketlerde fiziksel gerçekliğe uygun olmayan
> yerler olabilir."*

**Ölçüldü (mokap, 21 kare):** bench'te iki el arası **49,2 ↔ 88,0** (%79). Aynı sınıftan, fark edilmemiş
ikinci kusur: reverse fly'da makine kolunun boyu **32,4 ↔ 78,0** — demir kol 2,4 kat uzuyordu.

**Kök:** pozlar iki anahtar karede **eklem açısı** olarak yazılıp açılar ayrı ayrı ara değerleniyordu
(ileri kinematik). Elleri bara, eli makine koluna bağlayan hiçbir şey yoktu; kısıt yalnız çizimde "var
gibi" duruyordu. Açı ara değerlemesi kapalı zincir kısıtlarını (iki el tek barda, el makine kolunda)
**hiçbir zaman** korumaz — anahtar kareler doğru olsa bile ara karelerde bozulur.

**Düzeltme — "ekipman sürer, beden takip eder":** hareket artık ekipmanın yolu olarak yazılıyor (bar hafif
J yolu çizer; makine kolu omuz ekleminin düşey ekseni etrafında döner — makine ayarının kendi kuralı:
*"omzu dönme ekseniyle hizala"*). Eller o noktalara bağlanıyor, kol **iki kemikli ters kinematikle**
çözülüyor. İki el arası ve kaldıraç boyu artık **tanım gereği** sabit.

**Fizik denetimi** (`tools/proto-3b/fizik-denetimi.mjs`, 41 kare) — her hareket kısıtlarını kendisi beyan eder:
uzuv boyları · aynı bardaki eller arası · kaldıraç boyu · el ekipmana ulaşıyor · dirsek/diz 0–150° · ayaklar
zeminde ve kaymıyor · temaslar (sırt sehpada, baş sehpada, kalça oturakta, göğüs pedde) · sağ-sol simetri ·
ayrı tutamaklardaki eller birbirine girmiyor · ön kol gövdeye girmiyor · hareketin kendi tanımı (fly: dirsek
10–35° ve **sabit**).

| | önce | sonra |
|---|---|---|
| bench — iki el arası | 49,2 ↔ 88,0 | **52,0 sabit** |
| reverse fly — kaldıraç | 32,4 ↔ 78,0 | **58,5 sabit** |
| reverse fly — dirsek | 51,6° ("hafif" değildi) | **25,4° sabit** |
| reverse fly — eller başta | **iç içe** (5,5 < 9,4) — yeni kural buldu | 11,7 |

⭐ Eski açı tabanlı pozlar denetimde **olumsuz fikstür** olarak koşuyor ve kırmızı yanmak zorunda
(49,2…88,0 ve 32,4…78,0 ile yanıyor) — denetimin kör olmadığının kanıtı.

## Aynı sınıf bugünkü 2B uygulamada — H15 (YENİ, düzeltilmedi)

Kütüphane tarandı: iki elin de göründüğü (önden) beş hareket var. Dambıl ve ayrı tutamaklı olanlarda
eller arasının değişmesi doğal. **Cable Curl** (ve aynı pozları kullanan **Hammer Curl**) değil:

- bar gövde ekseninden (x = 130) **yana kayıyor**: ortada 157,6'ya gidiyor, tepede bile 146,6'da kalıyor —
  gerçekte bar gövdenin önünde düz yukarı çıkar
- iki ön kol **aynı yana savruluyor**
- bar 11,8 ↔ 15,5 uzuyor

**Kök 2B'nin kendisi:** önden bakınca ön kolun kameraya doğru gelmesi çizilemiyor; çizim onu yana
döndürerek taklit ediyor. Bu kusur 2B'de yama ile değil, 3B ile doğru çözülür (curl = ön kolun sagital
düzlemde dönmesi). Bu yüzden ayrı düzeltme yapılmadı; 3B göçünde kapanır.

## Yan bulgu — H16 (düzeltildi): service worker mokapları bayat tutuyordu

SW "önbellekte yoksa ağdan al ve önbelleğe ekle" kuralını aynı kökenden her dosyaya uyguluyordu (kural
fontlar için yazılmıştı). Önbellek adı yalnız ASSETS'in içeriğinden türediği için mokap/araç dosyaları
değişince önbellek yenilenmiyor, **eski mokap** çalışıyordu — bugün iki kez (Tur 1'de `app.js`, burada
düzeltilmiş 3B motoru yerine eskisi). Artık yalnız uygulama dosyaları ve fontlar SW'den geçiyor.
**Canlı:** önbelleğe bilerek sahte eski modül kondu → sayfa yine ağdan doğru kodu aldı; uygulama
çevrimdışı açılmaya devam ediyor.
⚠️ **Mokabın ilk hâlini gördüğün tarayıcıda** eski SW hâlâ eski modülü tutuyor olabilir: bir kez
normal açıp kapat (yeni SW devralır) ya da site verisini temizle.

## Genel ders

**Anahtar kareleri doğru olan bir hareket, ara karelerde fiziği bozabilir.** Kapalı zincir kısıtı
(iki el tek ekipmanda, el makine kolunda, ayak yerde) açı uzayında temsil edilmez; ya hareket
ekipmanın yolu olarak yazılır ve beden IK ile ona uydurulur, ya da her kare ölçülür — burada ikisi birden.
3B motor ürüne geçerken bu denetim `npm test`'e girecek (şimdilik mokap aracı olduğu için dışında).

---

# EK D — Bütün hareketlerin denetimi (24 Eyl, Sabri: *"hareketin isminden ne olması gerektiğini bul, doğru hareketi, doğru pozisyonu çiz"*)

**Kararlar:** iş sırası onaylandı (ilerleme önerisi → kütüphane + 3B → program editörü → otomatik ısınma) · ağırlık artışı **iki seans** kuralı.

**Yöntem:** (1) her hareketin doğru tekniği adından ve kaynaklardan çıkarıldı — ExRx (metin + 8 demo videosu kare kare), ACE, NSCA Lifting Proficiencies, Special Olympics dinamik ısınma kılavuzu; (2) bugünkü 2B çizim üç anda (başı/ortası/sonu) ölçüldü ve gözle incelendi; (3) doğrusu 3B kütüphanede çizildi ve her karede fizik denetiminden geçti.

**3B kütüphane:** `tools/proto-3b/hareketler3d.js` — 17 hareket + 5 ısınma. `mockup-3b.html` hepsini bugünkü 2B ile yan yana gösterir (parmakla döndürülür; yalnız ekrandaki kartlar oynar).
**Fizik denetimi:** **346 ölçüm geçti**, **6 olumsuz testin 6'sı kırmızı** (eski bench, eski fly, ters diz, kayan dirsek, kayan ayak, eğik ön kol) — denetim kör değil. Kısıt türleri: uzuv boyu · aynı bardaki eller · kaldıraç boyu · uçlar hedefte · dirsek/diz aralığı · **diz yönü (mutlak referans)** · ayak tabanı/parmak ucu yerde ve kaymıyor · dirsek yerinde · ön kol dikey (sarkık yük) · gövde açısı ve sabitliği · kablo/bar/dambıl bedenin içinden geçmiyor (kalınlığıyla) · ön kol gövdeye/başa girmiyor · simetri (sırayla/tek kol muaf) · harekete özel kurallar (plank tek çizgi, lunge alt pozisyonu, squat ağırlık merkezi…).
⚠️ İlk taslağımda denetim **12 hata** buldu (ör. pushdown'da ön kolu ters yöne döndürmüşüm, overhead'de destek kolu başın içinden geçiyordu) — hepsi düzeltildi. Kaynak gelince 4 hareket daha değişti.

## Bugünkü 2B çizimin karnesi

| Hareket | Bugünkü 2B | Doğrusu (kaynak) → 3B'de |
|---|---|---|
| **Barbell Bench Press** | ✅ doğru | eller barda 52,0 sabit, hafif J yolu |
| **Dumbbell Bench Fly** | ❌ **yanıltıcı**: üstten görünüm sırtüstü kişiyi AYAKTA gibi gösteriyor | sırtüstü; dambıllar omuz hizasına iner, dirsek 27° **sabit**, sap gövdeye paralel (NSCA) |
| **Incline Chest Press** | ⚠️ sırt ~65° (yere göre) fazla dik, yol düz çizgi | sırt yere **40°** (30–45°), kaldıraçlı **yay**, geniş pronasyon tutuşu (ExRx) |
| **Dumbbell Shoulder Press** | ✅ kabaca doğru | altta dambıllar omuz hizası, ön kol dikey; üstte dirsek ~22° |
| **Cable Front Raise** | ⚠️ tek kol, yan görünüm | **Sabri'nin salon varyantı** (24 Eyl): tek alçak makaraya sırt dönük, kablo **iki bacağın arasından**, bar **iki elle**, omuz hizasına kalkar (eller arası 32,0 sabit). ExRx'in tek kollu ve iki makaralı sürümleri de geçerli |
| **Reverse Pec Fly** | ✅ kabul edilebilir | dirsekler **yukarıda** (omuz hizasının altına düşmez), makine kolu omuz eksenli, nötr tutamak |
| **V-Bar Push Down** | ✅ doğru | dirsek yanda **sabit**, V tutuşu **dar** (±6), ön kol 100°→12° |
| **One Arm Overhead Ext.** | ✅ kabaca doğru | üst kol dik ve sabit, dambıl sapı **yatay**, boştaki el uylukta (ExRx videosu) |
| **Plank** | ✅ doğru | omuz–kalça–bilek tek çizgide, dirsek omzun altında (denetimli) |
| **Close Grip Pull Down** | ❌ gövde geriye değil **öne** 5° eğik | gövde **20° geride** ve sabit, **V tutamak nötr**, dirsekler **önden** iner (ExRx, ACE ≤30°) |
| **Two Arm Dumbbell Row** | ❌ gövde yere ~52° (kaynak 10–20°), ön kol öne açılıyor, dambıl göğse çekiliyor | gövde yere **20°**, ön kol **her karede dikey** (yük sarkar), dambıl alt göğüs/karın hizasına (NSCA) |
| **Seated Cable Row** | ✅ kabaca doğru (yol aşağı eğik) | tutamak **yere paralel** gelir, gövde 81°→90° |
| **Cable Curl** | ❌ **bar yana kayıyor** (x 130→157), ön kollar aynı yana savruluyor, bar uzuyor | dirsekler yanda sabit, bar sagital düzlemde, makara ayak önünde (kablo neredeyse dikey) |
| **Dumbbell Hammer Curl** | ❌ Cable Curl ile aynı pozlar, aynı kusur | kollar **sırayla**, sap ön-arka, bilek dönmez (ExRx) |
| **Leg Press** | ⚠️ kızak ~30° (45° değil) — küçük | **45° kızak**, altta diz ~90°, üstte kilitlenmez, dizler ayak hizasında |
| **Lunge** | ❌ **başka hareket**: yerinde split squat | ayaklar yan yana → **öne adım** → in (ön diz 90°, arka diz yerden ~2) → **başa dön** (ExRx/NSCA/ACE üçü aynı) |
| **Calf Raise** | ✅ doğru (zeminde) | **basamakta**, topuk basamağın altından başlar, dizler düz |
| ısınma · **Kol çevirme** | ⚠️ tek kol yay | kollar yanda (T), daireler (metnin varyantı) |
| ısınma · **Omuz dış rotasyon** | ❌ ön kol YUKARI kalkıyor (frontal düzlem) | dirsek yanda sabit, ön kol **dışa açılır** (transvers düzlem, ACE/NHS) |
| ısınma · **Göğüs açma** | ❌ ön kollar yukarıda eğiliyor | kollar omuz hizasında önden **geriye açılır** (yatay abdüksiyon, SO) |
| ısınma · **Bacak sallama** | ✅ kabaca doğru | destek el + düz bacak, ayak yere sürtmez |
| ısınma · **Squat** | ✅ doğru | kollar önde, kalça geri; altta uyluk yere paralel, kaval kemiği gövdeye paralel (11°), ağırlık merkezi ayak üstünde |

**Özet:** 22 hareketin **8'i yanlış** (fly, pulldown, row, cable curl, hammer curl, lunge, dış rotasyon, göğüs açma), **4'ü kısmen** (incline, front raise, leg press, kol çevirme), **10'u doğru**. Yanlışların çoğunun kökü 2B'nin kendisi: hareket kameraya doğru ya da yatay düzlemde olunca 2B onu başka bir hareket gibi çiziyor.

## Uygulama metinlerindeki çelişkiler (düzeltme önerisi — 3B ile birlikte uygulanmalı)

Metinler de prototipten geliyor ve bazıları kaynakla çelişiyor. Çizimle metin aynı anda değişmeli (3B'ye geçerken), yoksa ekran ile anlatım birbirini yalanlar:

1. **Cable Front Raise:** kurulum doğru (Sabri'nin yaptığı varyant), ama metin "tutamak" ve "kolunu" diyor → "**barı iki elle** tut, kolları düz tutarak birlikte kaldır".
2. **Lunge:** 4. adım yerinde split squat anlatıyor → "ön topuğundan itip **başlangıca dön**, bacakları sırayla değiştir".
3. **Close Grip Pull Down:** "barı omuz genişliğinden dar kavra, dirsekler yanlardan iner" → V tutamak, nötr tutuş, dirsekler önden iner.
4. **V-Bar Push Down:** "omuz genişliğinde, avuçlar aşağı" → V-bar **dar** tutulur, yarı-pronasyon.
5. **Two Arm Row:** "gövde yere ~45°" → yatayın biraz üstü (~10–20°).
6. **Reverse Pec Fly:** "hareketi sırt başlatır" → hedef **arka deltoid**; asıl kural dirseklerin omuz hizasında kalması.
7. **Bench Press:** "sırtında küçük boşluk kalır" → NSCA sırtı kavislendirmemeyi söylüyor.
8. **Incline Press:** "yol yukarı doğrudur" → kaldıraçlı makinede **yay**.
9. **Shoulder Press:** alt nokta "kulak hizasının biraz altı" → kaynaklarda dambıllar **omuz seviyesine** iner.
10. **Hammer Curl:** "bicepsin yan başı" → böyle bir baş yok; hedef **brachioradialis** (ExRx).

## Sınırlar (ilan)

- Mokap; uygulamaya henüz taşınmadı (onaylı sıranın 2. adımı).
- Gövde modeli yuvarlak kapsül: gerçek gövde enine geniş, derinliğine dar. Bu yüzden dirsekler ve eller gerçekte olduğundan biraz daha dışarıda çizildi — denetim bunu zorunlu kıldı.
- Pozlar hâlâ dünya yönleriyle tanımlı; üretimde **anatomik eklem açılarına** geçilecek (diz ters bükülmesi temsil edilemez hâle gelir).
- Ressam sıralaması uzun kablolarda ara sıra yanılabilir; incline makinesinin kaldıraç çerçevesi görsel olarak ağır.
- Telefonda henüz denenmedi.


---

# EK E — Sabri'nin iki gözlemi (24 Eyl, 4. tur)

**1. Front Raise:** *"halat iki bacak arasından geçip, ucundaki bar iki elle tutularak ileri çekilmiyor mu?"*
Evet — yaygın ve geçerli bir salon varyantı; uygulama kullanıcının yaptığını göstermeli. 3B'de öyle çizildi:
eller barda 32,0 sabit, kablo bacakların arasından geçiyor (bedene en yakın 1,8), dirsek 13° sabit.

**2. Eklem atlaması:** *"bacak önde iken diz bağlantı yüzeyi dışta, arkaya çekilince içte, bacakların arasına
geçiyor — ters simetrik olmalı değil mi?"* — **Haklı; fizik değil ÇİZİM kusuruydu.**
- **Ölçüldü:** her parça ayrı kapsül + ayrı kontur ve her karede derinliğe göre yeniden sıralanıyordu. Bacak
  sallamada t=0,05'te uyluk, t=0,95'te baldır üstte çiziliyor → dizdeki koyu ek yeri bir uçtan öbürüne atlıyor;
  parça başına ton da eklemde ton sınırını aynı anda atlatıyordu.
- **Standartta nasıl:** 3B'de beden sürekli (deri geçirilmiş) bir yüzeydir, görünürlük piksel piksel çözülür —
  ek yeri yoktur. 2B parça animasyonunda (Spine, Toon Boom) parçaların çizim sırası SABİTTİR ve eklem özel bir
  örtüyle gizlenir; sıra yalnız uzuv gerçekten bir şeyin arkasına geçince değiştirilir.
- **Çözüm (motor):** (1) her uzuv zinciri TEK tonla boyanıyor; (2) her eklemde iki parça çizildikten sonra
  kontursuz bir **eklem örtüsü** geçiyor — hangi parça üstte olursa olsun ek yeri görünmüyor; uzuv kökleri
  (omuz, kalça) gövdenin üstünde yuvarlak biter. Parçalar ARASI derinlik sıralaması korundu (gövdenin önüne
  geçen ön kol için gerekli — tümüyle grup sıralaması bunu bozardı: V-bar'da uzak kolun ortalama derinliği gövdenin gerisinde kalıyor, yani ön kol gövdenin arkasına gizlenirdi. Bu **elle hesaplandı, kodda denenmedi**).
- **Doğrulama:** yakın çekim — bacak arkada/önde, lunge ön/arka diz, curl dirsek alt/üst, squat diz önden/yandan:
  hepsinde tek tonlu kesintisiz büküm; sol ve sağ uzuv aynı çiziliyor (ton farkı yalnız derinlik: yakın uzuv açık).
- **Bedel (ilan):** aynı uzvun iki parçası üst üste bindiğinde (katlanan kol) aralarındaki ayrım çizgisi artık yok.
  Başka bir parça bir eklemin tam önünden geçerse örtü onu kısa süre kapatabilir (nadir).

Fizik denetimi **348 ölçüm** temiz, 6/6 olumsuz test kırmızı. `npm test` yeşil (uygulama koduna bu turda dokunulmadı).


---

# EK F — 5. tur (24 Eyl): görünürlük, lunge, ağırlık önerisi

## Sabri'nin gözlemleri ve karşılıkları

**1. "Bazı açılarda kafa sıranın altında çiziliyor."** — Haklı. Ressam sıralaması parçaların ortalama
derinliğine bakıyordu; geniş bir yatay yüzeyin (sıra üstü) ortalaması, üstünde yatan kafadan "önde" çıkabiliyor.
Motor artık iki kurallı bir görünürlük düzeltmesi yapıyor (destek yüzeyinin ÜSTÜNDEKİ nesne, kameraya
bakan tarafta kaldığı sürece önce çizilemez). **Ölçüldü:** 144 sahnede ihlal **317 → 0**; düzeltmesiz eski
sıralama olumsuz testte **99 ihlal** verip kırmızı yanıyor (denetim kör değil).

**2. "Kafa tam yuvarlak, yönü okunmuyor."** — Bu turda kafaya yön verildi (kafatası + çene + burun).
⚠️ **Sabri bunu da REDDETTİ ve haklı** (aynı gün, sonraki mesaj): *"yüz şekli, kafa şekli gerçeklerden çok farklı,
mutasyon gibi."* Üç daireden kafa kurmak yönü söylüyor ama insan kafası gibi okunmuyor. Sonraki adım: profesyonel
ve ticari kullanıma uygun bir çizim yolu araştırılıyor (bkz. EK G).

**3. Lunge — "adımı ileri atıyorum, geri alıp sonraki adımı atıyorum; yani ilerlemiyorum."** — 3B hareket buna
göre yeniden yazıldı: **ileri adım → in → geri dön → diğer bacak**. Her yarım döngüde ön diz ve arka diz
89,6° (iki bacakta aynı), döngü sonunda figür başlangıç noktasına dönüyor; ayaklar yere basarken kaymıyor
(denetim `ayaklar: yerde`). ⚠️ Uygulamadaki metin hâlâ "yürüyerek" izlenimi veriyor — 3B ile birlikte
değiştirilecek metinler listesine eklendi.

## Ağırlık artırma önerisi — UYGULANDI (onaylı sıranın 1. adımı)

**Kural** (`js/ilerleme.js`, saf mantık; ACSM 2009 "iki ardışık seans" + çift ilerleme):
1. Hareketin yapıldığı **son iki seansta** çalışma setlerinin (ısınma hariç) hepsi **aynı ağırlıkta**, sayısı
   hedef set sayısı kadar ve her biri hedef tekrara ulaşmış olmalı.
2. Yeni ağırlık = ağırlık × (1 + p), ekipman adımına **yukarı** yuvarlanır; p = %5 bileşik, %2,5 izole.
   Adım: bar/dambıl 2,5 kg, makine/kablo 5 kg.
3. Artış ağırlığın **%10'undan büyükse** (10 kg dambılda +2,5 = %25) önce tekrar ilerletilir:
   tüm setler hedef + 2 tekrara ulaşmadan ağırlık önerilmez (NSCA "2-for-2").
4. **Öner, dayatma:** kutu yine geçen seferle dolar; öneri tek dokunuşla (`uygula`) büyük sayıya yazılır.
   Kullanıcı bugün önerilen ağırlıkta (ya da üstünde) bir çalışma seti kaydedince öneri kendiliğinden gizlenir.

**Kanıt:**
- Birim testi: `test-session` bölüm 30 — **21 test** (iki seans şartı, ısınma hariç tutulur, kayıtsız seans atlanır,
  farklı ağırlık/eksik set/eksik tekrar → öneri yok, bileşik/izole oranı ayırt edilir, makine adımı, büyük adım dalı,
  gizlenme). Toplam `test-session` **235**, `test-store` 68, `test-timer` 14, `check-docs` 16 — hepsi yeşil.
- **Mutasyon 12/12 öldü** (tek seans · aynı ağırlık şartı yok · set şartı yok · tekrar şartı yok · bileşik↔izole
  oranı · en yakına yuvarlama · büyük adım eşiği · fazladan tekrar · ısınmanın sayılması iki yerde · makine adımı).
  ⚠️ İlk tasarımda **oran mutantları kaçacaktı**: 40 kg'da %5 ve %2,5 aynı sonuca yuvarlanıyor (42,5) — test oranı
  görmüyordu. Oranı **ayırt eden** ağırlık (60 kg → 65 / 62,5) eklendi, ikisi de öldü.
- **Canlı doğrulandı** (yerel sunucu, önce "koşan kod benim kodum mu" kapısı: SW önbelleği `fitset-68f386d849`,
  servis edilen `app.js` `oneriYukle` içeriyor): iki seans bench 3×12 @40 →
  *"İki seanstır 3 × 12 tamam — **42,5 kg** dene"* + `uygula`; dokununca büyük sayı **42,5**, düğme kayboldu;
  42,5 × 12 kaydedilince öneri **gizlendi**. Dambıl fly 3×12 @10 → *"Sonraki ağırlık adımı büyük (%25) — önce
  **14 tekrara** çık"* (düğme yok, doğru). Isınma seti (20 × 10) "geçen sefer" ve kurala girmedi.
- **Sınır (ilan):** hareket sınıfı (bileşik/izole) ve ekipman adımı şimdilik `ilerleme.js`'te; hareket kütüphanesi
  gelince oraya taşınacak. Kullanıcının kendi plaka setine göre adım ayarı yok (5 kg makine yığını varsayımı).


---

# EK G — Figür çizimi: "mutasyon gibi" (24 Eyl, 6. tur)

**Sabri:** *"yüz şekli, kafa şekli gerçeklerden çok farklı, mutasyon gibi. Daha profesyonel uygulamalar
kullanabilirsin, yardım alabilirsin — ama ticari kullanımda sorun olmasın."*

## Kök (geometrik, ölçüldü)
Kafa iki kesişen daireden (kafatası r 9,5 + çene r 6,6) ve bir burun çubuğundan çiziliyordu. İki dairenin
BİRLEŞİMİ iki içbükey çentik üretir; öndeki çentik tam yüz hizasına düşüyor ve burun çubuğu o çentikten
çıkıyordu → kabarık kafatası + çentik + çubuk + çene kabarcığı. Oranlar sorun değildi (figür ≈ 7,7 baş boyu;
sanatta kabul 7,5–8).

## Araştırma (lisanslar birincil kaynaktan; ayrıntı ve kaynaklar: bu turun araştırma notu)
| Aday | Lisans | Karar |
|---|---|---|
| **three.js r186** | **MIT** | ✅ seçildi — alt küme paketlendi: **530 KB / 135 KB gzip** (ölçüldü) |
| mannequin.js (tam da bu iş için yazılmış manken) | **GPL-3.0** | ❌ kara liste — fikir serbest, kod değil |
| Quaternius karakterleri | paket sayfası "CC0", site lisansı **28 Ağu 2026'dan beri "QAL v1.0"** | ⚠️ çelişkili; ileride gerekirse indirme günü lisansı arşivlenerek |
| Kenney | CC0 | stil fitness için fazla "oyuncak" |
| MakeHuman çekirdek varlıkları | CC0 (uygulama AGPL — sevk edilmez) | gerçekçi yüz → "tekinsiz vadi" riski |
| Mixamo | ticari serbest, ham dosya dağıtımı gri | ❌ PWA'da GLB dosyası açıkça indirilebilir |
| Gymvisual / MoveKit (satıcı) | ücretli klip | ❌ fizik denetimli özgün motoru çöpe atar |
| Shadertoy kodu | varsayılan CC BY-NC-SA | ❌ ticari değil |

Profesyonel uygulamalarda baskın biçim gerçek video ya da gerçekçi 3B render; yüzsüz manken satıcı pazarında
var (MoveKit) ve düşük bütçede en çok bozulan şeyi (gerçekçi yüz) baştan dışlar — çizim mankeni geleneği.

## Yapılan (mokap — uygulama koduna dokunulmadı)
1. **WebGL manken** (`tools/proto-3b/manken-webgl.js`, three.js alt kümesi `tools/proto-3b/vendor/`,
   MIT metni yanında + paketin başında): yüzsüz çizim mankeni — kas profilli uzuvlar, görünür eklem küreleri,
   enine geniş / derinliğine dar gövde (SVG'deki "yuvarlak gövde" sınırı kalktı), öne-aşağı eğik yumurta kafa,
   gölge atan ana ışık + zıt yönden kontur ışığı. ⭐ **Hareket motoru değişmedi**: iskelet ve ekipman
   hareketin KENDİ tanımından gelir (ekipman ilkelleri 3B verisini zaten taşıyordu); temas yarıçapları
   korunur — kafanın arkası **ölçülerek** tam 10 birimde durur (sehpaya değer).
2. **SVG yedek kafa** (bağımlılıksız): iki dairenin dış teğetlerle **dışbükey zarfı** — tek siluet, çentik yok,
   burun yok. WebGL açılamayan cihazlar için de gerekli.
3. **Karşılaştırma sayfası:** `mockup-3b-figur.html` — her harekette sol SVG, sağ WebGL, birlikte döner.

## Kanıt
- Fizik denetimi **tümü temiz** (6/6 olumsuz fikstür kırmızı) — çizici değişti, hareketler değişmedi.
- Performans (masaüstü, CPU+gönderim; GPU süresi tam ölçülmedi): **0,3–1,6 ms/kare**, ~103 bin üçgen (gölge dahil).
- ⚠️ **Kendi hatam:** `CylinderGeometry` merkezli (−0,5…0,5), benim lathe'lerim 0…1 → her silindir yarı boyu
  kadar kaydı (omuz kuşağı omuzdan dışarı taştı, barlar kaydı). Yakın çekimde görüldü, düzeltildi.
- ⚠️ `--legal-comments=none` MIT bildirimini paketten siliyordu → başlık yorumu olarak geri eklendi (MIT şartı).

## Sınırlar (ilan)
- **Telefonda ölçülmedi** (kare hızı, ilk ayrıştırma). Üçgen sayısı küre/lathe bölüt sayısı düşürülerek
  yarıya indirilebilir — ölçmeden yapılmadı.
- Sıfır bağımlılık kuralını **değiştirir** (ilk çalışma-anı bağımlılığı; tek dosya, CDN yok, çevrimdışı) — karar Sabri'nin.
- Kafa yüzsüz: yön, yumurtanın eğimi ve boynun kafanın arkasından çıkmasıyla okunur; ayrıca bir yüz işareti yok.
- İleri aşama (istenirse): CC0 iskeletli gövde + konumdan dönüşe hedefleme (~100-200 satır, tahmin; ölçülmedi).


---

# EK H — three.js mankeni uygulamaya girdi (24 Eyl, 7. tur)

**Sabri:** *"girsin… SVG yedekle birlikte. Sonra wiki, hafıza kayıtları; programı yenile; yayınla."*

## Yapılan
- **Tek giriş `js/anim3d/sahne.js`:** WebGL varsa three.js mankeni, yoksa aynı motorun SVG çizimi.
  three.js (135 KB gzip) açılışı yavaşlatmasın diye **ilk kullanımda** arka planda yüklenir; o arada
  SVG çizer. GPU bağlamı kaybolursa yine SVG. Tek paylaşılan WebGL bağlamı; görünümler 2B tuvale kopyalanır.
- **Mokaptaki çizici uygulamaya göre yeniden yapıldı:** mokap her hareket için ayrı sahne + ayrı gölge
  haritası kuruyordu (22 × 1024² doku). Uygulamada **tek sahne, tek figür**; hareket değişince yalnız
  ekipman grubu değişir. Bölüt sayıları telefon için düşürüldü.
- **Çerçeve hareketin kendi hacminden** (`manken3d.cerceve`): sürüklenebilen odak görünümünde dikey
  silindir (açı değişince figür zıplamaz, kırpılmaz), küçük görünümlerde sıkı kadraj.
- **Odak ekranı:** parmakla sürükleyerek döndürme, çift dokunuş ilk açıya döndürür (oturum içi).
- **Plank varyantları 3B** — kısıtlardan çözülmüş (omuz ve bilek yüksekliği sabit, dirsek omzun altında,
  serbest değişken kalça). ⚠️ İlk yerleşim (yan yana 3 sütun, 110 px) farkı göstermiyordu → **alt alta**,
  **tam yandan** kamera. Isınma minyatürleri 80×62 → 92×80.
- **10 metin çelişkisi düzeltildi** (Ek D listesi) — ekran ile anlatım artık birbirini yalanlamıyor.
- Ayarlar'ın altında three.js atfı (MIT metnine bağlantı).
- **2B çizim emekli:** uygulama `js/anim/engine.js`'i artık yüklemiyor; eski mokaplar ve araçları için
  dosyada duruyor, `npm test`'ten çıktı. Temizliği ayrı iş.
- Dosyalar prototip klasöründen uygulamaya taşındı: `js/anim3d/` (motor, hareketler, webgl, sahne),
  `js/vendor/` (three.js + lisans), `tools/fizik-denetimi.js`, `tools/three-giris.js`.

## Yeni kapılar
- **Kapsam:** uygulamadaki 25 kaydın (17 hareket + 8 ısınma) hepsinin 3B karşılığı var — uygulama ve
  denetim AYNI eşleme fonksiyonunu (`hareketBul`) çağırır.
- **Plank varyantları:** metinlerle aynı sıra, "doğru" = hareketin kendi pozu, "çökük" kalçada çizginin
  **−10,4** altında, "yüksek" **+14,4** üstünde; ön kollar ve parmak uçları yerde.
- **Çevrimdışı kapısı (`bump-sw.js`):** ASSETS'teki eksik dosya artık **kırmızı** (eskiden yalnız uyarı —
  yeni sürüm yine yayınlanırdı) ve `app.js`'ten erişilen her modül (dinamik `import()` dahil) ASSETS'te
  olmak zorunda: 15/15.
- **Mutasyon 12/12** — dinamik import'la yüklenen dosyanın listeden düşmesi dahil.

## Canlı doğrulama (yerel, 390×844; önce "koşan kod benim kodum mu": SW + önbellek temizlendi)
- 2. günün 9 hareketi odak ekranında WebGL ile; 1. günün 8 hareketi + 4 ısınması aynı çizim yoluyla.
- Sürükleme görünümü döndürdü (yan → ön), çerçeve sabit kaldı.
- **WebGL'siz cihaz taklidi** (`getContext('webgl')` → null): odak, plank varyantları, ısınma — üçü de SVG,
  uygulama hatası YOK (konsolda yalnız three.js'in kendi "bağlam açılamadı" satırı ve bizim beyanımız).
- Isınmadan 9 hareketin sonuna kadar gezinti: çizici WebGL'de kaldı, hata yok.

## Sınırlar (ilan)
- **Telefonda ölçülmedi** — kare hızı ve ilk yükleme gerçek cihazda görülmeli.
- İlk açılışta three.js yüklenene kadar (yerelde ~150 ms) SVG görünür, sonra WebGL'e geçer — kısa bir
  görünüm değişimi.
- Döndürülen açı oturum içi; uygulama kapanınca hareketin kendi açısına döner (bilinçli).
