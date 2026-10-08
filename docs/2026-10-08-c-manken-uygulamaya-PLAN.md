# C mankenini uygulamaya taşıma — PLAN (8 Eki 2026)

**Durum:** onay bekliyor. Girdi: 8 Eki kararı (`2026-10-05-urun-evrimi-analizi.md` §24): C tek ve varsayılan manken; bugünkü kapsül manken yalnız kendiliğinden devreye giren yedek; A emekli; Ayarlar'da tek "basit görünüm / pil tasarrufu" anahtarı.

## 1. Hedef ve "bitti" ölçütü

- Uygulamadaki her 3B görünüm C mankeniyle çizilir: odak ekranı (`#fig3d`), plank varyantları, ısınma satırları.
- C yüklenemezse ya da cihaz kaldıramazsa kapsül manken kendiliğinden devreye girer; o da olmazsa bugünkü SVG.
- Ayarlar'da "Basit görünüm (pil tasarrufu)" anahtarı kapsül mankene geçirir.
- Çevrimdışı çalışır (service worker önbelleğe alır).
- Bitti = masaüstünde bütün hareketler çok açılı görüntüyle denetlendi · fizik denetimi + `npm test` yeşil · Sabri telefonda kare hızını gördü ve onayladı.

## 2. Bugün (ölçüldü)

- Tek giriş: `js/anim3d/sahne.js` (`webglHazirla` · `ciz` · `cizici`). Paylaşılan tek `WebGLRenderer`, çizim 2B tuvallere kopyalanıyor. Yükleme sürerken ve hata olursa SVG.
- Kapsül çizici `js/anim3d/webgl.js`, three.js **alt kümesi** `js/vendor/three.min.js` (530 KB / 135 KB gzip).
- C çizici prototipte: `tools/proto-stil/govde.js` + `premium.js`. Tam three.js ister (deri bağlama, fiziksel malzeme, PMREM, GLTFLoader, RoomEnvironment). Alt küme bunları içermiyor.
- Gövde: `tools/proto-stil/govde-mh/govde.glb` 933 KB (CC0, MakeHuman/MPFB2).
- Arayüz farkı: C'nin `motorKur` işlevi `async`; `ciz`'e ek `ms` (kas vurgusu nabzı) geçiyor; ayarları `{kas, iz, id}`.

## 3. Kararlar (öneri ilk sırada)

| # | Soru | Öneri | Alternatif |
|---|---|---|---|
| K1 | C kodu nerede durur? | `js/anim3d/c/` altına taşınır (govde.js, premium.js'in sahne kısmı, gövde GLB). Prototip sayfaları oradan içe aktarır — tek kaynak | Uygulama `tools/proto-stil/`'den içe aktarır (araç klasörü ürüne girer) |
| K2 | three.js | İkinci bir **küçültülmüş paket**: `js/vendor/three-c.min.js` (tam çekirdek + GLTFLoader + RoomEnvironment), alt kümeyle aynı yöntem (esbuild, MIT başlığı). İçe aktarmalar göreli yol, import map yok | Import map + küçültülmemiş üç dosya (~2,1 MB ham) |
| K3 | Önbellek | C dosyaları kurulumda önbelleğe alınır (çevrimdışı ilk açılışta da C) | İlk kullanımda önbelleğe al (ilk çevrimdışı açılış kapsülle) |
| K4 | Kendiliğinden yedeğe geçiş | (a) C yüklenemez/derlenemezse, (b) ilk oynatmada kare süresinin ortancası > 50 ms ise kapsüle geç; karar cihazda saklanır, Ayarlar'da görünür | Yalnız (a); yavaş cihazda kullanıcı kendisi anahtarı açar |
| K5 | A (premium kapsül) | Silinir; stil sayfası "Bugün ↔ C" kıyas aracı olarak kalır | Prototip sayfasında kalır |
| K6 | Tanı bayrakları (`globalThis.__*`) | Kodda kalır, uygulama hiçbirini kurmaz (etkisiz); yalnız prototip sayfası kurar | Uygulama kopyasından sökülür |

## 4. Adımlar

| Faz | İş | Doğrulama |
|---|---|---|
| F1 | three-c paketi + C kodunun `js/anim3d/c/`'ye taşınması; prototip sayfaları yeni yoldan. Uygulama davranışı değişmez | Prototip görüntüleri taşıma öncesiyle piksel kıyası |
| F2 | `sahne.js`: C yolu (async kurulum, `ms`, kas/iz ayarı). Hareket başına önbellekler: alet parçaları ve **ritim oranı ön geçişi** — ısınma satırları ve plank varyantları aynı karede farklı hareketler çizer; bugünkü tek-hareket önbelleği her çizimde 13 karelik ön geçişi yeniden koşardı | Odak, plank, ısınma ekranları; çok açılı görüntü |
| F3 | Yedeğe geçiş (K4) + Ayarlar anahtarı (`store.js` varsayılanlar + yedek içe aktarma listesi `temizAyar`) | Zorla hata/yavaşlık enjeksiyonu; anahtar iki yönde |
| F4 | Service worker listesi + `bump-sw` · `KULLANIM.md` / `CLAUDE.md` · lisans notları (three.js MIT, MakeHuman CC0) | `npm test` (check-docs dahil) |
| F5 | Masaüstü uçtan uca tur (17 hareket × ısınma × plank) · kare süresi ölçümü · Sabri telefonda dener | Fizik denetimi, süreklilik, bekçiler; telefon kare hızı |
| F6 | Commit — yalnız Sabri söyleyince (depo herkese açık) | — |

## 5. Etki ve riskler

- **İndirme:** ilk kurulumda ~+1 MB (gzip; gövde + tam three.js). Kesin rakam F1'de ölçülür. Kapsül yedeği ancak gerekirse indirilir.
- **İlk açılış süresi:** GLB çözme + gölgelendirici derleme + ortam (PMREM). Masaüstünde ölçülecek; telefonda Sabri.
- **Paylaşılan renderer:** C renk uzayı ve ton eşlemeyi değiştiriyor; kapsüle geçişte eski hâline dönmeli.
- **Kare süresi:** masaüstünde C 2–3 ms işlemci + gölge. Telefonda ×3–5 beklenir; 6 tekrarda bir durduğu için sürekli yük yok.
- Fizik denetimi ve hareket verisi değişmez (veri katmanı aynı).

## 6. Açık küçük işler (plana dahil, ayrı)

- Kol tam yukarıdayken arka kol oyuğunda birkaç piksellik kırık (atlet).
- Çift dambıl kürek (Dumbbell Two-Arm Row): 8 Eki'deki görsellerdeki sorun netleşmedi — Sabri'nin bir cümlesi gerekiyor.
- Telefon denemesi bitince yerel ağ deneme sunucusu kapatılır.

## 7. Uygulandı (8 Eki akşam) — sonuçlar

- **F1:** `js/anim3d/c/motor.js` (eski premium.js'in sahne kısmı; A mankeni silindi) + `govde.js` + `govde.glb`. three.js C alt kümesi `js/vendor/three-c.min.js` **610 KB / 154 KB gzip** (tarif `tools/three-c-giris.js`). Gövde 933 → **817 KB** (gzip 592 → **489 KB**; yalnız kullanılmayan doku koordinatları atıldı, `glb-incelt.mjs --denetle` npm test'te). Prototip sayfaları aynı modülleri kullanıyor; `tools/proto-stil/vendor` (2,1 MB tam three) silindi. Ek indirme ≈ **0,7 MB gzip**.
- **F2:** `sahne.js` C → kapsül → SVG; hareket kimliği (kas haritası) ve plank varyantları için kimlik; gövdede ritim oranı hareket başına önbellekte. ⚠️ Bulunan kusur: yedeğe geçerken bırakılan eski bağlamın kaybı yeni çiziciyi SVG'ye düşürüyordu → yalnız şu anki çizicinin bağlamı sayılıyor. three.js r186'da `PCFSoftShadowMap` kaldırılmış (zaten PCF'ye düşüyordu) → `PCFShadowMap`.
- **F3:** yavaşlık ölçümü kare başına (bir karede birden çok görünüm bir kez sayılır); yazılım GPU'sunda ortanca 64–67 ms → kapsüle geçti, gerçek GPU'da ~9 ms. Ayarlar ▸ Hareket çizimi: Tam / Basit; otomatik geçişte satır bunu söyler. Ayar cihaza özgü (yedekle taşınmaz).
- **F4:** service worker dört yeni dosyayı kurulumda alıyor (ölçüldü); `KULLANIM.md`, `CLAUDE.md`; Ayarlar altında MakeHuman (CC0) künyesi.
- **F5 (masaüstü):** uygulamada 9 hareket + plank'in üç duruşu + ısınma listesi C ile; Basit ↔ Tam iki yönde; `npm test` 17/17; süreklilik ve bekçiler değişmedi. **Telefon denemesi Sabri'de.**

### Kas vurgusu (Sabri, aynı akşam: "güç harcarken yansın, bırakırken sönsün; yalnız ilgili kaslar; doğru yerde mi?")

- **Bölge denetimi** (17 hareket × 4 açı) üç yanlış buldu: omuz/ön omuz köprücüğe bağlıydı → vurgu boyun–trapezdeydi (artık üst kolun omuz başı, deltoid) · göğüs karına taşıyordu · lat ve orta sırt bel ve kalçaya iniyordu. Tek kol baş üstü triceps'te çalışmayan kol da yanıyordu → yalnız çalışan kol.
- **Evre** (`motor.js` `kasEvresi`, `KAS_EVRE`): t = 0 dinlenme ucu. Kaldırma/çekme hareketlerinde kalkışta hemen yanar, tepede tam, indirirken söner, dinlenmede 0. Bench press, fly, baş üstü triceps, leg press ve lunge'da indirirken gerilim birikir, iterken tam, kilitlenince söner. Plank sürekli. Yön kareden kareye okunur; duran görüntüde yalnız konum.

### Açılışta eski çizim (8 Eki gece, Sabri telefonda gördü)

- **Kusur:** manken yüklenirken SVG yedeği çiziyordu → ilk animasyon eski çizimle başlıyor, sonra yeni sporcuya geçiyordu.
- **Çözüm (Sabri onayı):** manken açılışta, liste çizildikten sonra arka planda yüklenir (`requestIdleCallback`); yükleme
  sürerken alan boş kalır, SVG yalnız WebGL hiç yoksa ya da bağlam kaybolduysa. Ölçüldü: hemen de geçilse, 5 sn sonra da
  geçilse alan doğrudan C ile açılıyor, SVG hiç görünmüyor.
- **Isınma:** ilk çizimdeki gölgelendirici derlemesi hareket ekranına geçişi ~1,2 sn donduruyordu → yüklemede bir hareketin
  sahnesi `compileAsync` ile derlenir + 1×1 piksellik çizim gölge programlarını ısıtır. Geçiş **1 228 → 53–198 ms**;
  bedeli liste ekranındayken arka planda tek seferlik ~0,5 sn'lik duraklama (masaüstü ölçümü).
