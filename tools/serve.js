/**
 * GELİŞTİRME SUNUCUSU —  node tools/serve.js [port]
 *
 * Neden gerekli: ES modülleri ve service worker `file://` üzerinde ÇALIŞMAZ
 * (modüller CORS'a takılır, SW güvenli bağlam ister). Yani index.html'e çift
 * tıklamak bu uygulamayı açmaz. Yayında bu işi GitHub Pages yapacak.
 *
 * Telefondan test için: bilgisayarla aynı Wi-Fi ağındayken aşağıda yazan
 * ağ adresini telefonun tarayıcısına gir. (Service worker yalnız https veya
 * localhost'ta kaydolur; ağ IP'sinde çevrimdışı test edilemez — o yüzden
 * çevrimdışı sınaması yayına alındıktan sonra yapılmalı.)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.argv[2] || 5099;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);

  // Dizin dışına çıkmayı engelle
  if (!path.resolve(file).startsWith(path.resolve(ROOT))) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end('yok: ' + url); return; }

  const ext = path.extname(file);
  const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
  // sw.js ASLA önbelleğe alınmamalı, yoksa yeni sürüm hiç görülmez
  headers['Cache-Control'] = path.basename(file) === 'sw.js' ? 'no-cache, no-store' : 'no-cache';
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  const ip = Object.values(os.networkInterfaces()).flat()
    .find(i => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`FitSet çalışıyor:`);
  console.log(`  bilgisayar : http://localhost:${PORT}`);
  if (ip) console.log(`  telefon    : http://${ip}:${PORT}   (aynı Wi-Fi ağında)`);
});
