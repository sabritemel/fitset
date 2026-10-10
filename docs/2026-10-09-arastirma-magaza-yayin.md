# FitSet — Google Play ve App Store yayın araştırması (9 Eki 2026)

> Kapsam: çevrimdışı PWA'yı (vanilla JS, service worker, three.js, veri yalnız cihazda) Türkiye'den bireysel geliştirici olarak iki mağazaya çıkarmak. Hukuki ve vergi tavsiyesi değildir. Doğrulayamadığım her şey "doğrulanamadı" diye işaretli.

## Özet (5 madde)

- **Play en kısa yol:** PWA → Trusted Web Activity (Bubblewrap/PWABuilder). Ama `assetlinks.json` alan adının **kökünde** olmalı → GitHub Pages proje sitesi (`kullanici.github.io/FitSet/`) yetmez; **kendi alan adı** (CNAME) gerekir.
- ⚠️ **Bireysel Play hesabında üretime çıkmadan önce 12 test kullanıcısı × 14 kesintisiz gün kapalı test şart.** Şirket (D-U-N-S'li kuruluş) hesabı bundan muaf.
- **App Store'da asıl risk Kılavuz 4.2 ("paketlenmiş web sitesi")** reddi. Capacitor ile web dosyalarını uygulamanın içine koyun ve gerçek yerel özellik ekleyin: HealthKit'e antrenman yazma, dinlenme sayacı için yerel bildirim + Live Activity, titreşim.
- ⚠️ **iOS'ta Capacitor içindeki localStorage/IndexedDB disk dolarken silinebilir** (Capacitor belgesi). Tek veri kaynağı cihaz olduğu için kalıcı depoya (Preferences/SQLite) geçiş + dışa aktarma gerekli.
- ⚠️ **"FitSet" adı riskli:** Türkiye'de tescilli marka + Play'de aynı adlı uygulamalar var. Mağaza adı ve marka tescili için ayırt edici yeni ad önerilir.

## 1. Google Play — Trusted Web Activity

**Nasıl çalışır:** Bubblewrap (JDK 17, Android komut satırı araçları, Node 18+) PWA'yı Chrome'da tam ekran açan bir Android paketi üretir. Doğrulama iki yönlüdür: uygulamada site adresi, sitede `/.well-known/assetlinks.json` (imza anahtarının SHA-256 parmak izi). Doğrulama tutmazsa adres çubuğu görünür.

**GitHub Pages:** Dosya alan adının kökünde olmalı. Seçenekler: (a) projeye kendi alan adını bağlamak (önerilen; site köke taşınır), (b) `kullanici.github.io` deposuna ayrıca `.well-known/assetlinks.json` koymak — uygulama adresi yine alt yolda kalır, daha kırılgan. Jekyll nokta ile başlayan klasörleri yayımlamaz → `.nojekyll` ekleyin (genel GitHub Pages davranışı; bu turda belgeyle doğrulanmadı).

**İmza:** Yeni uygulamalar Play App Signing kullanır. `assetlinks.json`'a **Play'in uygulama imzalama anahtarının** parmak izi de eklenmeli (Play Console → Uygulama bütünlüğü).

**Çevrimdışı:** TWA Chrome'un service worker'ını kullanır; kurulduktan sonra çevrimdışı çalışır. Ama **ilk açılış çevrimdışıysa service worker henüz kayıtlı olmadığı için hata sayfası** çıkar; Chrome belgesi yerel bir "bağlantı yok" ekranı öneriyor. Chrome yoksa `fallbackType` Custom Tabs ya da WebView'e düşer.

**Hedef API:** 31 Ağu 2026'dan beri yeni uygulamalar ve güncellemeler **Android 16 (API 36)** hedeflemeli. Güncel Bubblewrap sürümünün hangi API'yi hedeflediği doğrulanamadı → `targetSdkVersion` derlemede kontrol edilmeli.

**Hesap:**
- Kayıt ücreti **25 $** (tek sefer). Kimlik doğrulama zorunlu; e-posta/telefon tek kullanımlık kodla doğrulanır.
- Ücretli uygulama/uygulama içi satış yaparsanız **tam adresiniz mağazada herkese açık görünür** (bireysel hesapta ev adresi demek).
- Kuruluş hesabı **D-U-N-S** ister; yeni D-U-N-S'in kayda geçmesi 30 güne kadar sürebilir (ikincil kaynak).
- Android geliştirici doğrulaması 30 Eyl 2026'da Brezilya, Endonezya, Singapur, Tayland'da başladı; küresel yayılım 2027. Türkiye tarihi doğrulanamadı. Play üzerinden yayımlayan zaten Play Console'da doğrulanır.

**Kapalı test (bireysel hesap, 13 Kas 2023 sonrası):** en az **12 test kullanıcısı**, **14 gün kesintisiz** katılım. Google test kullanıcılarının uygulamayı gerçekten kullanmasını bekliyor. Ancak sonra üretim erişimi istenir.

**Politika formları:**
- **Veri güvenliği formu** ve **gizlilik politikası URL'si tüm uygulamalara zorunlu** (veri toplamasanız da). FitSet "veri toplanmıyor/paylaşılmıyor" diyebilir. TWA siteyi GitHub'dan yüklediği için sunucu günlüklerini politikada anmak dürüst olur.
- **Sağlık uygulamaları beyanı tüm uygulamalara zorunlu.** "Activity and Fitness" kategorisi antrenman kaydını açıkça kapsıyor → işaretlenmeli. Health Connect kullanılırsa ayrıca veri türü beyanı gerekir.
- İçerik derecelendirmesi (IARC anketi), hedef kitle, reklam beyanı.

**"WebView sarmalayıcı" politikası:** Play'in spam politikası, **izinsiz** başka bir sitenin webview'ini yasaklıyor. Kendi sitenizin TWA'sı buna girmez. Asgari işlev kuralı yalnız "statik, uygulamaya özgü işlevi olmayan" içeriği hedefliyor; 3B figürlü kayıt uygulaması bu riski taşımaz.

## 2. Apple App Store

**Sarmalama:** Capacitor (güncel sürüm 8). Web dosyaları uygulama paketinin içinde → çevrimdışı çalışır. Uzak URL yüklemeyin; hem 4.2 hem çevrimdışı açısından kötü.

**Kılavuz 4.2:** "Uygulamanız onu paketlenmiş bir web sitesinin ötesine taşıyan özellik, içerik ve arayüz içermeli." 4.2.2: web kırpıntısı/bağlantı koleksiyonu olmamalı. Yardımcı olanlar:
- **HealthKit'e antrenman yazma** (Capacitor Health eklentisi, Capacitor 8 ister).
- **Dinlenme sayacı:** resmî Local Notifications + Haptics eklentileri; Live Activity/Dynamic Island için topluluk eklentisi + widget uzantısı.
- Paylaşım sayfası, ana ekran widget'ı, çevrimdışı tam işlev.

**HealthKit kuralları:**
- Sağlık uygulaması amacıyla kullanılmalı ve açıklamada belirtilmeli (2.5.1).
- Sağlık verisi reklam/veri madenciliğinde kullanılamaz; yanlış veri yazılamaz; **iCloud'da saklanamaz** (5.1.3).
- Gizlilik politikası şart.
- Ayrıca başvuru gerekip gerekmediği doğrulanamadı (Xcode yeteneği olarak açılıyor).

**Gizlilik:**
- Gizlilik politikası URL'si **tüm uygulamalara zorunlu.**
- **Yalnız cihazda işlenen veri "toplanmış" sayılmaz** → etiket "Veri Toplanmıyor" olabilir.
- Gizlilik bildirimi (`PrivacyInfo.xcprivacy`): Preferences/Filesystem eklentileri gerekçeli API'ler kullanır (örn. UserDefaults → `CA92.1`); 1 May 2024'ten beri gerekçesiz yükleme kabul edilmiyor.
- Hesap silme kuralı (5.1.1(v)) yalnız hesap varsa geçerli → FitSet'e uymaz.

**Araç ve hesap:**
- Apple Developer Program **yıllık 99 $**. Bireysel kayıtta yasal ad satıcı adı olarak görünür. Kuruluş kaydı D-U-N-S + kuruluş alan adlı e-posta + çalışan web sitesi ister.
- 28 Nis 2026'dan beri yüklemeler **Xcode 26 / iOS 26 SDK** ile derlenmeli.
- **Mac şart değil:** Codemagic ücretsiz planı ayda **500 macOS M2 dakikası** veriyor. GitHub Actions macOS koşucuları ve Capgo Build başka seçenekler. Simülatör/cihaz testi Mac'siz zordur. TestFlight ile dış test kullanıcılarına dağıtılır.
- **Yaş derecelendirmesi:** yeni anket (4+, 9+, 13+, 16+, 18+). Anketin tıbbi/sağlıklı yaşam soruları var. 31 Oca 2026 sonrası anketsiz güncelleme kabul edilmiyor.

**iOS PWA yolu (ana ekrana ekle):**
- Hâlâ çalışıyor. Web push iOS 16.4'ten beri yalnız ana ekran uygulamalarında var.
- WebKit, ana ekran uygulamasına tarayıcıyla aynı kotayı veriyor. Kalıcı depolama isteğini ana ekran uygulamasına daha kolay tanıyor.
- Mağazada görünmez; keşif ve HealthKit yok. Yedek kanal olarak kalabilir.

## 3. Para kazanma

- **Apple:** dijital özellik kilidi açmak için **Apple IAP zorunlu** (3.1.1).
- **Google Play:** Play Faturalandırma kullanılmalı. TWA'da bu, Digital Goods API + Payment Request ile yapılır (Chrome 101+).
- **Komisyon:**
  - Apple Small Business Program: önceki yıl kazancı 1 milyon $'a kadar olana %15.
  - Google: yılın ilk 1 milyon $'ında %15 (kayıt gerekir), otomatik yenilenen aboneliklerde ilk günden %15.
- **Fiyat:** iki mağaza da TL fiyat basamakları sunuyor; güncel TL basamak listesi bu turda doğrulanamadı.
- **KDV:** Türkiye'deki alıcılardan KDV'yi **Apple** (2018'den beri) ve **Google** (Türkiye listede) tahsil edip yatırıyor. Güncel oranların ve dijital hizmet vergisinin gelirinize etkisi doğrulanamadı.
- **Gelir vergisi:** GVK mükerrer 20/B — mağazadan gelen hasılat Türkiye'de açılan özel banka hesabına alınırsa %15 tevkifat nihai vergi olur. 2026 sınırı ikincil kaynağa göre 5.300.000 TL; mali müşavirle doğrulayın.
- **RevenueCat:** aylık 2 500 $ izlenen gelire kadar ücretsiz, sonra %1. İki mağazanın aboneliğini tek yerden yönetir. Ancak TWA tarafı web SDK + Play Billing köprüsü ister; ne kadar uyumlu olduğu doğrulanamadı.

## 4. Fitness uygulaması için diğer zorunlular

- **Tıbbi feragat:** uygulama içinde ve açıklamada "tıbbi tavsiye değildir, egzersize başlamadan doktora danışın". Apple 1.4.1 doğruluğu kanıtlanamayan sağlık ölçümü iddiasını reddediyor → kalori/nabız gibi iddialar yapmayın.
- **KVKK/GDPR:** veri cihazdan çıkmıyorsa yükümlülük hafif. Yine de Türkçe + İngilizce gizlilik politikası, saklama yeri ("yalnız bu cihazda"), silme yolu ("uygulama verisini sil / kaldır") ve iletişim adresi yazın.
- **Görseller:**
  - Play: simge 512×512 PNG; öne çıkan görsel **1024×500**; ekran görüntüsü 2–8 adet/cihaz türü, kenar 320–3840 px.
  - App Store: ekran görüntüsü 1–10 adet/boyut, 6,9" için 1320×2868 (ve alternatifleri). Apple sayfası zorunlu boyutu "iPhone with Dynamic Island (medium display)" olarak listeliyor; tam ölçüsü bu turda net doğrulanamadı.
- **Yerelleştirme:** listeyi TR + EN ayrı yazın; uygulama metni de iki dilde olursa EN pazarında görünürlük artar.
- **ASO:**
  - Apple: ad 30, alt başlık 30, anahtar kelime alanı 100 karakter.
  - Play: başlık 30, kısa açıklama 80, uzun açıklama 4 000 karakter; Play'de gizli anahtar kelime alanı yok, metinden indeksler.
  - Örnek anahtar kelimeler: "antrenman takibi, spor salonu, workout log, set tekrar, kas grubu, 3B vücut".

## 5. Ad çakışması ve marka sınıfları (genel bilgi)

- **Mağaza:** Play'in taklit (impersonation) ve fikri mülkiyet politikaları, kullanıcıyı başka bir uygulama/şirketle bağ kurduğu yönünde yanıltan adları yasaklıyor. Marka sahibinin şikâyeti uygulamayı kaldırtabilir. App Store'da da aynı ad başka hesapta kayıtlıysa kullanılamaz (genel bilgi).
- **Nice sınıfları:**
  - **9** — indirilebilir yazılım/uygulama (asıl çakışma alanı).
  - **41** — spor/fitness eğitimi, çevrimiçi içerik.
  - **42** — yazılım tasarımı, SaaS.
  - **28** — spor aletleri (dambıl satıcısının olası sınıfı).
- **Risk:** Tescilli bir "Fitset" ile ad benzerliği + aynı/ilişkili sınıf → itiraz ya da kaldırma riski. Brezilya ve "Fitset AI" uygulamaları mağazada karışıklık yaratır.
- **Öneri:** yayından önce yeni ve ayırt edici ad seçin; TÜRKPATENT, WIPO Global Brand Database ve TMview'da 9/41/42 sınıflarında arayın; gerekirse marka vekiline danışın.

## Yayın kontrol listesi

### A) Google Play (önce)
1. Yeni ad seç, marka araması yap (9/41/42).
2. Alan adı al, GitHub Pages'e bağla (CNAME + HTTPS), `.nojekyll` ekle.
3. Gizlilik politikası + tıbbi feragat sayfasını TR/EN yayımla.
4. Play Console bireysel hesap aç (25 $), kimliği doğrula. Ücretli plan varsa adresin görüneceğini kabul et.
5. Bubblewrap ile paket üret; hedef API 36'yı doğrula; çevrimdışı ilk açılış ekranını ekle.
6. `assetlinks.json`'a yükleme anahtarı + Play imza anahtarı parmak izlerini koy; adres çubuğu çıkmadığını cihazda doğrula.
7. Uygulama içeriği formları: Veri güvenliği, Sağlık uygulamaları (Activity and Fitness), içerik derecelendirmesi, hedef kitle, reklam yok.
8. Mağaza listesi TR/EN: simge, 1024×500 görsel, ekran görüntüleri.
9. Kapalı test: 12+ kişi, 14 gün kesintisiz, gerçek kullanım. Sonra üretim erişimi başvurusu.
10. (İsteğe bağlı) Play Faturalandırma: Digital Goods API.

### B) App Store (sonra)
1. Apple Developer Program'a kaydol (99 $/yıl).
2. Capacitor 8 projesi oluştur; web dosyalarını paketin içine koy.
3. Veriyi Preferences/SQLite'a taşı; dışa/içe aktarma ekle.
4. Yerel özellik ekle: HealthKit antrenman yazma, dinlenme bildirimi + titreşim, (varsa) Live Activity/widget.
5. `PrivacyInfo.xcprivacy` gerekçelerini yaz; gizlilik etiketini "Veri Toplanmıyor" olarak doldur; gizlilik URL'sini gir.
6. Codemagic (ya da GitHub Actions macOS) ile Xcode 26 derlemesi + imzalama kur.
7. TestFlight ile gerçek cihazda dene.
8. Yaş anketi, TR/EN liste, 6,9" ekran görüntüleri, inceleme notuna yerel özellikleri yaz.
9. IAP gerekiyorsa Paid Apps sözleşmesini kabul et; Small Business Program'a başvur.

## Kaynaklar

- Play test şartı: https://support.google.com/googleplay/android-developer/answer/14151465
- Hedef API: https://developer.android.com/google/play/requirements/target-sdk
- Geliştirici doğrulaması: https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html
- Hesap bilgileri / adres: https://support.google.com/googleplay/android-developer/answer/13628312 · https://support.google.com/googleplay/android-developer/answer/13634081
- Sağlık beyanı: https://support.google.com/googleplay/android-developer/answer/14738291
- Spam/asgari işlev: https://support.google.com/googleplay/android-developer/answer/9898783 · https://support.google.com/googleplay/android-developer/answer/9899034
- Veri güvenliği + gizlilik politikası: https://android-developers.googleblog.com/2021/10/launching-data-safety-in-play-console.html
- Görsel ölçüleri: https://support.google.com/googleplay/android-developer/answer/9866151
- Play vergi (Türkiye): https://support.google.com/googleplay/android-developer/answer/138000
- Play ücretleri: https://support.google.com/googleplay/android-developer/answer/112622
- TWA hızlı başlangıç: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- TWA çevrimdışı: https://developer.chrome.com/docs/android/trusted-web-activity/offline-first
- TWA Play Billing: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- Bubblewrap CLI: https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md
- Apple inceleme kılavuzu: https://developer.apple.com/app-store/review/guidelines/
- Apple gizlilik ayrıntıları: https://developer.apple.com/app-store/app-privacy-details/
- Apple kayıt: https://developer.apple.com/programs/enroll/
- Small Business Program: https://developer.apple.com/app-store/small-business-program/
- SDK şartı: https://developer.apple.com/news/upcoming-requirements/
- Ekran görüntüsü ölçüleri: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/
- Capacitor API'leri / depolama / gizlilik bildirimi: https://capacitorjs.com/docs/apis · https://capacitorjs.com/docs/guides/storage · https://capacitorjs.com/docs/ios/privacy-manifest
- Capacitor Health: https://capawesome.io/blog/announcing-the-capacitor-health-plugin/
- Live Activities eklentisi: https://capgo.app/docs/plugins/live-activities/getting-started/
- Codemagic fiyat: https://codemagic.io/pricing/
- RevenueCat fiyat: https://www.revenuecat.com/pricing/
- WebKit depolama politikası: https://webkit.org/blog/14403/updates-to-storage-policy/
- Apple yaş derecelendirmesi (ikincil): https://developer.apple.com/forums/thread/810473
- Apple Türkiye KDV (ikincil, 2018): https://appleinsider.com/articles/18/01/25/apple-adjusts-foreign-app-store-pricing-to-account-for-vat-changes
- GVK 20/B (ikincil): https://www.fatiharas.com/gvk-mukerrer-madde-20-b-sosyal-icerik-ureticiligi-istisnasi/
- ASO karakter sınırları (ikincil): https://www.applaunchflow.com/blog/app-store-metadata-character-limits-2026
