/**
 * TASARIM DİLİ KAPISI —  node tools/check-tasarim.js
 *
 * Tasarım dili 2. sürüm AZALTARAK kurulmuştu (tek aile, tek vurgu), ama kuralı tutan
 * bir kapı yoktu. İki ayda punto 18 ayrı değere, düğme 7 ayrı biçime dağıldı: her yeni
 * ekran "bir tık küçük", "yarım piksel büyük" diye kendi değerini yazdı (27 Eyl'de ölçüldü,
 * docs/2026-09-27-tasarim-dili-analizi.md). Kural koda bağlanmazsa sessizce dağılır.
 *
 * Bu kapı KAYNAKTAN okur:
 *   1. style.css'te her font-size / font-weight bir DEĞİŞKENDEN gelir (--f-* / --w-*);
 *      ölçek 7 basamak, ağırlık 3 değer — sayı :root dışında yazılamaz
 *   2. renk yalnız :root'ta tanımlanır; kurallar değişken kullanır (hex/rgb() yok)
 *   3. text-transform: uppercase YOK (küçük harfli etiket kararı; Türkçe i → I tuzağı da kapanır)
 *   4. 1 px'ten kalın yan şerit (border-left/right) YOK — kart kenar süsü yasak
 *   5. ui.js'te satır içi stil yalnız VERİ taşır (--p yüzdesi, sayaç çubuğu); punto/renk yazılmaz
 *   6. ui.js'in çağırdığı her ikon index.html'deki sprite'ta var (yoksa boş kare çizilir)
 *
 * Neyi DENETLEMEZ (yazılı): dokunma hedefinin boyutu ve gerçek punto dağılımı çizimde
 * ortaya çıkar; onlar tarayıcıda ölçülür (bkz. docs/2026-09-27-tasarim-dili-analizi.md §8).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const oku = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };

/** Yorumları sıyır — yalnız KENDİ satırında açılan blok yorumlar (dize içindeki "/*"a takılmasın) */
const yorumsuz = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = yorumsuz(oku('css/style.css'));

/** Her bildirimi {secici, ozellik, deger} olarak çıkar; özel özellik (--x) tanımları ayrı tutulur */
const bildirimler = [];
for (const blok of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const secici = blok[1].trim();
  for (const b of blok[2].split(';')) {
    const i = b.indexOf(':');
    if (i < 0) continue;
    const ozellik = b.slice(0, i).trim(), deger = b.slice(i + 1).trim();
    if (ozellik) bildirimler.push({ secici, ozellik, deger });
  }
}
const kural = bildirimler.filter(d => !d.ozellik.startsWith('--'));
const tanim = bildirimler.filter(d => d.ozellik.startsWith('--'));
// Eşlik kapısı: ayrıştırıcı kaynağı yutmasın — bu projede ayrıştırıcı iki kez sessizce kod yuttu
ok(kural.length > 300 && tanim.length > 30, `style.css ayrıştırıldı: ${kural.length} bildirim · ${tanim.length} değişken tanımı`);

console.log('\n1) PUNTO VE AĞIRLIK YALNIZ DEĞİŞKENDEN');
const olcek = [...new Set(tanim.filter(d => /^--f-/.test(d.ozellik)).map(d => d.ozellik))];
const agirlik = [...new Set(tanim.filter(d => /^--w-/.test(d.ozellik)).map(d => d.ozellik))];
ok(olcek.length === 7, `tip ölçeği 7 basamak: ${olcek.join(' ')}`);
ok(agirlik.length === 3, `ağırlık 3 değer: ${agirlik.join(' ')}`);
const fs1 = kural.filter(d => d.ozellik === 'font-size' && !/^var\(--f-[a-z0-9]+\)$/.test(d.deger));
ok(!fs1.length, `font-size sabit sayı değil: ${fs1.map(d => `${d.secici} → ${d.deger}`).join(' · ') || 'hepsi değişken'}`);
const fw1 = kural.filter(d => d.ozellik === 'font-weight' && !/^var\(--w-[a-z]+\)$/.test(d.deger));
ok(!fw1.length, `font-weight sabit sayı değil: ${fw1.map(d => `${d.secici} → ${d.deger}`).join(' · ') || 'hepsi değişken'}`);
const font = kural.filter(d => d.ozellik === 'font' && d.deger !== 'inherit');
ok(!font.length, `kısaltma "font:" yalnız inherit: ${font.map(d => d.secici).join(' · ') || 'temiz'}`);

console.log('\n2) RENK YALNIZ :root\'TA');
const renkli = kural.filter(d => /#[0-9a-f]{3,8}\b|rgba?\(/i.test(d.deger));
ok(!renkli.length, `kurallarda hex/rgb yok: ${renkli.map(d => `${d.secici} { ${d.ozellik} }`).join(' · ') || 'hepsi değişken'}`);

console.log('\n3) YASAKLI KALIPLAR');
const buyuk = kural.filter(d => d.ozellik === 'text-transform' && /uppercase/.test(d.deger));
ok(!buyuk.length, `text-transform: uppercase yok: ${buyuk.map(d => d.secici).join(' · ') || 'temiz'}`);
const serit = kural.filter(d => /^border-(left|right)(-width)?$/.test(d.ozellik) && (parseFloat(d.deger) > 1 || /(\d+(\.\d+)?)px/.exec(d.deger)?.[1] > 1));
ok(!serit.length, `1 px'ten kalın yan şerit yok: ${serit.map(d => d.secici).join(' · ') || 'temiz'}`);

console.log('\n4) ŞABLONLAR (js/ui.js)');
const UI = oku('js/ui.js');
const satirIci = [...UI.matchAll(/style="([^"]*)"/g)].map(m => m[1]);
const izinli = s => /^--p:\$\{[^}]+\}$/.test(s) || /^transform:scaleX\(\$\{.+\}\)$/.test(s);
ok(satirIci.length > 0 && satirIci.every(izinli),
  `satır içi stil yalnız veri: ${satirIci.filter(s => !izinli(s)).join(' · ') || satirIci.length + ' kullanım, hepsi veri'}`);
ok(!/font-size|font-weight|color\s*:/.test(satirIci.join(' ')), 'şablonda punto/ağırlık/renk yazılmıyor');

console.log('\n5) İKONLAR');
const semboller = new Set([...oku('index.html').matchAll(/<symbol id="i-([a-z-]+)"/g)].map(m => m[1]));
const cagrilar = new Set();
for (const m of UI.matchAll(/\bik\(([^)]*)\)/g)) for (const a of m[1].matchAll(/'([a-z-]+)'/g)) cagrilar.add(a[1]);
ok(semboller.size >= 10, `index.html sprite: ${semboller.size} sembol`);
ok(cagrilar.size >= 10, `ui.js ${cagrilar.size} ayrı ikon çağırıyor`);
const eksik = [...cagrilar].filter(a => !semboller.has(a));
ok(!eksik.length, `çağrılan her ikon sprite'ta var: ${eksik.join(', ') || 'tamam'}`);

console.log(`\n${'─'.repeat(64)}\n${pass} geçti · ${fail} kaldı`);
process.exit(fail ? 1 : 0);
