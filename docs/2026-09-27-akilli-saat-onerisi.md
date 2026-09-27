# Akıllı saat entegrasyonu — öneri (27 Eylül 2026)

**Durum:** öneri; kod yazılmadı. Sabri'nin mevcut saati (Gear Sport) değişecek. Yeni saat gelince
§4'teki test sayfasıyla başlanacak.

## 1. İstek

Sabri: *"Bunu akıllı saat ile entegre edebilir miyiz? Akıllı saatte ilerletecek, adımları gösterecek bir
ayar yapabilir miyiz? Samsung akıllı saat için örneğin."*

## 2. Öneri: bildirim köprüsü — saat uygulaması YAZMADAN

Wear OS, telefondaki uygulamaların bildirimlerini düğmeleriyle birlikte saate kendiliğinden aktarır.
Saatte düğmeler, bildirime dokunup açınca görünür. FitSet telefonda kurulu bir uygulama olduğundan
(Chrome'un WebAPK'sı), bildirimleri de saate gider. Saate hiçbir şey kurulmaz, mağaza gerekmez.

Antrenman sırasında tek bir bildirim:

| An | Metin | İki düğme |
|---|---|---|
| Set sırasında | `Close Grip Pull Down · Set 2/3 · 35 kg × 12` | **Seti kaydet** · **Sonraki** |
| Dinlenmede | `Dinlenme · bitiş 18:42` | **+30** · **Geç** |
| Dinlenme bitince | saat titrer: `Set 3 zamanı` | — |

Bildirime dokununca hareketin "Nasıl yapılır" adımları ve "Dikkat" notu okunur. Saatteki düğme,
service worker'ın `notificationclick` olayını tetikler: set, telefon cebindeyken de IndexedDB'ye yazılır.

**Sınırlar (ilan edildi):**
- Bildirimde **en fazla iki düğme** — Chrome Android'de `Notification.maxActions` 2'dir ve fazlası
  sessizce atılır.
- **Ağırlık saatten değiştirilmez.** Set, kutudaki ağırlıkla kaydedilir; değiştirmek telefondan yapılır.
- Saatte animasyon ve canlı geri sayım yoktur; onu yalnız yerel bir saat uygulaması verir.
- **"Ongoing" (kalıcı) bildirim saate AKTARILMAZ**, bizimki olağan bildirim olmalıdır.

## 3. Reddedilen yollar

| Yol | Neden şimdi değil |
|---|---|
| Yerel Wear OS uygulaması (Kotlin / Compose) | En zengin sonuç (saatte ekran, geri sayım, karo) ama ikinci bir ürün olur. Telefondaki web uygulaması saatle doğrudan konuşamaz (Wearable Data Layer yalnız yerel Android'de), yani telefona da yerel uygulama gerekir. Mağazasız kurulum geliştirici kipi + adb ister. |
| Saatte tarayıcı | Galaxy Watch'un (Wear OS) PWA çalıştırabilecek bir tarayıcısı yok. |
| Gear Sport (Tizen) | Samsung, Gear Sport dahil Tizen saatlerin desteğini 2025 sonunda bitirdi. Bildirim aktarımının sürdüğü kaynaklarda yazmıyor; Sabri saati değiştirecek. |

## 4. Önce ölçülecek üç şey (test sayfası, ~10 dakika)

Uygulamaya dokunmadan ayrı bir test sayfası yayınlanır. Sabri telefonda açıp saatle dener:

1. **Düğmeler görünüyor mu?** Saat, FitSet'in (WebAPK) iki bildirim düğmesini gösteriyor mu?
2. **Kilitli telefonda kayıt:** telefon kilitliyken saatten basınca `notificationclick` çalışıp IndexedDB'ye
   yazıyor mu?
3. **Dinlenme sonu titreşimi — EN BÜYÜK RİSK:** telefon ekranı kapalıyken Chrome arka plandaki sayfanın
   zamanlayıcılarını kısar ya da sayfayı dondurabilir; titreşim gecikebilir. Tutmazsa başka yol aranır
   (sunucu yok, Notification Triggers API terk edildi).

## 5. Uygulama tasarımında şimdiden görülen risk

Saatten gelen seti service worker yazar; telefonda açık duran uygulama ise seansı **bellekte** tutar ve
bir sonraki kayıtta onu diske yazar → saatten gelen seti **ezer**. Çözüm: SW yazınca açık sayfaya haber
verir (`BroadcastChannel`), sayfa seansı diskten yeniden okur; sayfa görünür olunca da okur. Kapı: "saatten
set + açık sayfada set → ikisi de diskte".

## Kaynaklar

- [Bridging options for notifications — Wear OS](https://developer.android.com/training/wearables/notifications/bridger)
- [Notifications on Wear OS](https://developer.android.com/training/wearables/notifications)
- [Display Notifications on a Galaxy Watch Running Wear OS Powered by Samsung](https://developer.samsung.com/sdp/blog/en-us/2023/06/01/display-notifications-on-a-galaxy-watch-running-wear-os-powered-by-samsung)
- [Notification: maxActions — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notification/maxActions_static)
- [Notification Actions in Chrome 48](https://developer.chrome.google.cn/blog/notification-actions)
- [Android Authority — The end is in sight for Galaxy Watches on Tizen](https://www.androidauthority.com/samsung-tizen-os-support-ending-3592909/)
- [SamMobile — Own a Tizen Galaxy Watch? Here's what happens after September 30](https://www.sammobile.com/news/own-tizen-galaxy-watch-here-what-happens-after-september-30/)
- [Sammy Fans — 5 Samsung watches nearing support expiry date](https://www.sammyfans.com/2025/10/06/5-samsung-watches-nearing-support-expiry-date/)
