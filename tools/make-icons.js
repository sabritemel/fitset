/**
 * İKON ÜRETİCİ — bağımlılıksız PNG rasterleştirici.
 *
 *   node tools/make-icons.js
 *
 * Neden elle? Projede build adımı ve npm bağımlılığı yok; ikon için sharp/canvas
 * kurmak bu ilkeyi bozardı. İkon birkaç geometrik şekilden ibaret olduğu için
 * doğrudan piksel doldurup zlib ile PNG'ye yazmak daha ucuz ve tekrar üretilebilir.
 *
 * TASARIM — marka kimliğinin en indirgenmiş hali:
 *   lacivert zemin (#2A32B8)  = mürekkep
 *   pembe onay işareti        = tamamlanan set (uygulamanın çekirdek etkileşimi)
 *   kırmızı alt çizgi         = defter çizgisi / vurgu
 * 48px launcher boyutunda okunması için detay bilinçli olarak az tutuldu.
 *
 * Maskable güvenli alan: tüm içerik 0.28-0.76 aralığında, yani %80 iç dairenin
 * içinde — Android ikonu daire/squircle'a kırptığında hiçbir şey kesilmez.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');

const INK = [0x2a, 0x32, 0xb8];
const PAPER = [0xf7, 0xde, 0xe6];
const RED = [0xc8, 0x1e, 0x4e];

/* ── geometri yardımcıları (hepsi işaretli mesafe döndürür: <0 = içeride) ── */
const rrect = (x, y, w, h, r) => (px, py) => {
  const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
  const qy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const seg = (ax, ay, bx, by, hw) => (px, py) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) - hw;   // yuvarlak uçlu
};

/** S×S ikonu 4×4 süper-örnekleme ile çizer, RGBA byte dizisi döndürür */
function render(S) {
  const bg = rrect(0, 0, S, S, S * 0.22);
  const rule = rrect(S * 0.28, S * 0.735, S * 0.44, S * 0.055, S * 0.028);
  const c1 = seg(S * 0.29, S * 0.505, S * 0.435, S * 0.635, S * 0.058);
  const c2 = seg(S * 0.435, S * 0.635, S * 0.735, S * 0.325, S * 0.058);

  const px = Buffer.alloc(S * S * 4);
  const SS = 4, inv = 1 / (SS * SS);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const fx = x + (sx + 0.5) / SS, fy = y + (sy + 0.5) / SS;
        if (bg(fx, fy) > 0) continue;                       // zeminin dışı → saydam
        let c = INK;
        if (rule(fx, fy) < 0) c = RED;
        if (c1(fx, fy) < 0 || c2(fx, fy) < 0) c = PAPER;     // onay işareti en üstte
        r += c[0]; g += c[1]; b += c[2]; a += 255;
      }
      const i = (y * S + x) * 4;
      // düz alfa → çarpılmamış renk (kenarlarda renk kirlenmesini önler)
      px[i] = a ? Math.round(r / (a / 255)) : 0;
      px[i + 1] = a ? Math.round(g / (a / 255)) : 0;
      px[i + 2] = a ? Math.round(b / (a / 255)) : 0;
      px[i + 3] = Math.round(a * inv);
    }
  }
  return px;
}

/* ── minimal PNG yazıcı ── */
const TBL = Array.from({ length: 256 }, (_, n) => {
  let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
});
const crc32 = b => { let c = 0xffffffff; for (const v of b) c = TBL[(c ^ v) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(S, px) {
  const raw = Buffer.alloc(S * (S * 4 + 1));
  for (let y = 0; y < S; y++) {                              // her satır başına filtre baytı (0 = yok)
    raw[y * (S * 4 + 1)] = 0;
    px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const S of [180, 192, 512]) {
  const buf = png(S, render(S));
  fs.writeFileSync(path.join(OUT, `icon-${S}.png`), buf);
  console.log(`  ✓ icons/icon-${S}.png  ${S}×${S}  ${(buf.length / 1024).toFixed(1)} KB`);
}
