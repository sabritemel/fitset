/**
 * SERVICE WORKER — çevrimdışı çalışma + kontrollü güncelleme.
 *
 * ⚠️ İKİ KURAL, ikisi de gerçek acılardan geliyor:
 *
 * 1) SÜRÜM ARTIRMAYI UNUTMA. Dosya değiştirdiysen CACHE'i artır. Artırmazsan
 *    telefonda eski sürüm servis edilmeye devam eder ve "güncellemem gitmemiş"
 *    sanırsın. Bu, PWA'ların en yaygın hayal kırıklığıdır.
 *
 * 2) sw.js NO-CACHE İLE SERVİS EDİLMELİ. Tarayıcı sw.js'in kendisini önbelleğe
 *    alırsa yeni sürümü hiç göremez. GitHub Pages bunu doğru yapar; başka bir
 *    yere taşırsan kontrol et.
 *
 * Güncelleme akışı: yeni SW kurulur → BEKLER (otomatik devralmaz) → sayfa
 * "yeni sürüm var" şeridi gösterir → kullanıcı dokununca SKIP_WAITING mesajı
 * gelir → devralır → sayfa yenilenir. Kullanıcı antrenman ortasında sürüm
 * değiştirmez; kararı o verir.
 */
const CACHE = 'fitset-8edcfd6028';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './fonts/fonts.css',
  './js/app.js',
  './js/ui.js',
  './js/store.js',
  './js/schedule.js',
  './js/session.js',
  './js/timer.js',
  './js/anim/engine.js',
  './js/anim/equipment.js',
  './js/data/exercises.js',
  './js/data/warmup.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // Tek tek ekliyoruz: addAll biri 404 verirse HEPSİNİ iptal eder ve
    // uygulama sessizce çevrimdışı çalışmaz hale gelir. Eksiği görmek isteriz.
    await Promise.all(ASSETS.map(u =>
      c.add(u).catch(err => console.warn('[sw] önbelleğe alınamadı:', u, err.message))
    ));
    // Fontlar fonts.css içinde; onları ilk kullanımda runtime önbelleğe alıyoruz.
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Gezinme (sayfa açılışı): önce İSTENEN sayfa, sonra ağ, en son index.html.
  //
  // ⚠️ Eskiden burada koşulsuz index.html dönülüyordu. Sonuç: /mockup.html
  // istendiğinde de uygulama açılıyordu — yedek, kendisi olmayan her sayfayı
  // yutuyordu. Yedek YALNIZ gerçekten bulunamadığında devreye girmeli.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) return res; } catch { /* çevrimdışı */ }
      return (await caches.match('./index.html')) || new Response(
        '<meta charset=utf-8><p style="font:16px system-ui;padding:24px">FitSet çevrimdışı açılamadı. Bir kez internete bağlıyken açman gerekiyor.</p>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    })());
    return;
  }

  // Diğer varlıklar: önbellek öncelikli, kaçanlar ağdan gelip önbelleğe eklenir
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'çevrimdışı' });
    }
  })());
});
