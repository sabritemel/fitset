/**
 * Uygulama gövdesi: tools/proto-stil/govde-mh/govde.glb (Blender çıktısı, kaynak) → js/anim3d/c/govde.glb
 *
 * Yalnız KULLANILMAYAN veri atılır, geometri ve ağırlıklar bayt bayt aynı kalır:
 *   · TEXCOORD_0 (doku yok; çizici UV okumuyor) — 116 KB ham
 * Kaynak dosya değişmez (ölçü üreticisi `olcu-uret.mjs --denetle` onu denetler).
 *
 *   node tools/govde-uret/glb-incelt.mjs            → yazar
 *   node tools/govde-uret/glb-incelt.mjs --denetle  → uygulama kopyası kaynaktan türetilmiş mi (fark = hata)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KOK = fileURLToPath(new URL('../../', import.meta.url));
const KAYNAK = KOK + 'tools/proto-stil/govde-mh/govde.glb';
const HEDEF = KOK + 'js/anim3d/c/govde.glb';
const AT = ['TEXCOORD_0'];

function oku(b) {
  const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString());
  const bl = b.readUInt32LE(20 + jl);
  return { j, bin: b.subarray(28 + jl, 28 + jl + bl) };
}

export function incelt(kaynakBayt) {
  const { j, bin } = oku(kaynakBayt);
  const atilanAcc = new Set();
  for (const m of j.meshes) for (const p of m.primitives) for (const a of AT) if (a in p.attributes) { atilanAcc.add(p.attributes[a]); delete p.attributes[a]; }
  // kullanılan erişimciler ve görünümler (sıra korunur, indeksler yeniden numaralanır)
  const accEski = j.accessors, accYeni = [], accMap = new Map();
  accEski.forEach((a, i) => { if (!atilanAcc.has(i)) { accMap.set(i, accYeni.length); accYeni.push(a); } });
  const bvKullanilan = new Set(accYeni.map(a => a.bufferView));
  for (const s of j.skins ?? []) if (s.inverseBindMatrices != null) bvKullanilan.add(accEski[s.inverseBindMatrices].bufferView);
  const bvMap = new Map(), bvYeni = [], parcalar = [];
  let ofs = 0;
  j.bufferViews.forEach((bv, i) => {
    if (!bvKullanilan.has(i)) return;
    const veri = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    const pad = (4 - (ofs % 4)) % 4; if (pad) { parcalar.push(Buffer.alloc(pad)); ofs += pad; }
    bvMap.set(i, bvYeni.length); bvYeni.push({ ...bv, byteOffset: ofs }); parcalar.push(veri); ofs += veri.length;
  });
  for (const a of accYeni) a.bufferView = bvMap.get(a.bufferView);
  j.accessors = accYeni; j.bufferViews = bvYeni;
  const yenile = i => accMap.get(i);
  for (const m of j.meshes) for (const p of m.primitives) {
    for (const k of Object.keys(p.attributes)) p.attributes[k] = yenile(p.attributes[k]);
    if (p.indices != null) p.indices = yenile(p.indices);
  }
  for (const s of j.skins ?? []) if (s.inverseBindMatrices != null) s.inverseBindMatrices = yenile(s.inverseBindMatrices);
  let yeniBin = Buffer.concat(parcalar);
  const binPad = (4 - (yeniBin.length % 4)) % 4; if (binPad) yeniBin = Buffer.concat([yeniBin, Buffer.alloc(binPad)]);
  j.buffers = [{ byteLength: yeniBin.length }];
  let js = Buffer.from(JSON.stringify(j));
  const jsPad = (4 - (js.length % 4)) % 4; if (jsPad) js = Buffer.concat([js, Buffer.alloc(jsPad, 0x20)]);
  const bas = Buffer.alloc(12), jsBas = Buffer.alloc(8), binBas = Buffer.alloc(8);
  bas.writeUInt32LE(0x46546c67, 0); bas.writeUInt32LE(2, 4); bas.writeUInt32LE(12 + 8 + js.length + 8 + yeniBin.length, 8);
  jsBas.writeUInt32LE(js.length, 0); jsBas.writeUInt32LE(0x4e4f534a, 4);
  binBas.writeUInt32LE(yeniBin.length, 0); binBas.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([bas, jsBas, js, binBas, yeniBin]);
}

const cikti = incelt(readFileSync(KAYNAK));
if (process.argv.includes('--denetle')) {
  let mevcut = null; try { mevcut = readFileSync(HEDEF); } catch { /* yok */ }
  if (!mevcut || !mevcut.equals(cikti)) { console.error('✗ js/anim3d/c/govde.glb kaynaktan türetilmemiş — node tools/govde-uret/glb-incelt.mjs'); process.exit(1); }
  console.log(`✓ uygulama gövdesi kaynakla eşleşiyor (${cikti.length} bayt)`);
} else {
  writeFileSync(HEDEF, cikti);
  console.log(`yazıldı: js/anim3d/c/govde.glb ${cikti.length} bayt (kaynak ${readFileSync(KAYNAK).length})`);
}
