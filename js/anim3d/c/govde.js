/**
 * C MANKEN GÖVDESİ — MakeHuman/MPFB2 sistem varlıkları (CC0), tools/govde-uret/govde_uret.py ile Blender'da
 * ekransız üretilir (kaynak: tools/proto-stil/govde-mh/govde.glb + künye govde.json); uygulama kopyası
 * ./govde.glb kaynaktan `tools/govde-uret/glb-incelt.mjs` ile türetilir. 8 Eki 2026'da prototipten taşındı.
 *
 * ⭐ HAREKET MOTORU AYNI: iskelet `M.an(h, t)` — IK, kısıtlar, fizik denetimi değişmedi. Bu katman her karede
 * glTF iskeletinin her kemiğine bir DÜNYA matrisi yazar (T·R·S·K·T(−p0)·B0). Kollar modelin kendi oranlarında
 * IK ile kurulur; kas vurgusu, kavrama, bilek sınırları, DQS ve deltoid düzeltmesi aşağıda.
 * `globalThis.__*` tanı bayrakları yalnız prototip sayfalarınca kurulur; uygulamada etkisizdir.
 */
import * as T from '../../vendor/three-c.min.js';
import * as M from '../manken3d.js';
import * as P from './motor.js';

const K = 100;                                   // model metre → bizim cm
const THREE_DEG = 180 / Math.PI;
const ACC = 0xf06a5d;
const X0 = new T.Vector3(1, 0, 0), Y0 = new T.Vector3(0, 1, 0), Z0 = new T.Vector3(0, 0, 1);
const V = a => new T.Vector3(a[0], a[1], a[2]);
/** A/B → model tarafı. Gövdenin önü yüz yönüdür; sırtüstü harekette veri yan'ı ters tuttuğu için A SOL olur. */
const tarafi = ters => (ters ? { A: 'l', B: 'r' } : { A: 'r', B: 'l' });

/** Kas anahtarı → kemikler: [kemik ({t} = taraf), yön anahtarı ({K} = A/B) ya da null (tüm kemik), çarpan, kol boyu aralığı?]
 * 7 Eki: üst kol kemiği deltoidi de taşıyor → pazı/triceps yalnız kolun alt kısmında, ön omuz yalnız üstünde yanar. */
// 8 Eki akşam (Sabri: "kas vurgusu doğru yerleri doğru şekilde mi gösteriyor; sadece ilgili kaslarda vurgu olsun"),
// 17 hareket dört açıdan ölçüldü: omuz/ön omuz köprücüğe bağlıydı → vurgu boyun–trapezde çıkıyordu (deltoid üst
// kolun omuz başı: aKolU −0,5…0,38) · göğüs spine_02'ye taşıp karına iniyordu · lat ve orta sırt spine_01 ile kalçaya
// kadar iniyordu. Yön anahtarları: on/arka gövdenin önü/arkası · dis{K} omzun dışa (yana) yönü.
const DELTOID = [-0.5, 0.38];
const KEMIK_KAS = {
  gogus: [['spine_03', 'on', 1]],
  onOmuz: [['upperarm_{t}', 'on', 1, DELTOID], ['clavicle_{t}', 'on', 0.35]],
  omuz: [['upperarm_{t}', 'dis{K}', 1, DELTOID], ['upperarm_{t}', 'on', 0.6, DELTOID], ['clavicle_{t}', 'dis{K}', 0.4]],
  arkaOmuz: [['upperarm_{t}', 'arka', 1, DELTOID], ['clavicle_{t}', 'arka', 0.45]],
  triceps: [['upperarm_{t}', 'bukumTers{K}', 1, [0.3, 1.3]]],
  biceps: [['upperarm_{t}', 'bukum{K}', 1, [0.35, 1.3]]],
  onKol: [['lowerarm_{t}', null, 1]],
  lat: [['spine_03', 'arka', 1], ['spine_02', 'arka', 0.4]],   // bel (spine_02) yalnız hafif: tam güçte şortun üstünü/kalçayı boyuyordu
  sirtOrta: [['spine_03', 'arka', 1], ['clavicle_{t}', 'arka', 0.6]],
  karin: [['spine_01', 'on', 1], ['spine_02', 'on', 0.6], ['pelvis', 'on', 0.45]],
  kuadriseps: [['thigh_{t}', 'uylukOn{K}', 1]],
  arkaBacak: [['thigh_{t}', 'uylukArka{K}', 1]],
  kalca: [['pelvis', 'arka', 1]],
  // 13 Eki (1B): bel (alt sırt, erector spinae) — deadlift, RDL, kürek ve squat'ta ikincil; sırt ortası/lat spine_03'te kalır
  bel: [['spine_01', 'arka', 1], ['spine_02', 'arka', 0.5]],
  baldir: [['calf_{t}', 'baldirArka{K}', 1]],
  kaval: [['calf_{t}', 'kavalOn{K}', 1]],   // 17 Eki (G3): ön kaval kası (tibialis anterior) — tibialis raise
};

/* ── Matris yardımcıları ── */
/** aim birincil, ref ikincil eksen → çerçeve dönüşü */
function cerceveQ(aim, ref) {
  const a = aim.clone().normalize();
  const b = ref.clone().sub(a.clone().multiplyScalar(ref.dot(a)));
  if (b.lengthSq() < 1e-8) b.copy(Math.abs(a.y) < 0.9 ? Y0 : X0).sub(a.clone().multiplyScalar((Math.abs(a.y) < 0.9 ? Y0 : X0).dot(a)));
  b.normalize();
  const c = new T.Vector3().crossVectors(a, b);
  return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(a, b, c));
}
/** dinlenme çerçevesi (aim0, ref0) → hedef çerçeve (aim1, ref1) */
const esle = (aim0, ref0, aim1, ref1) => cerceveQ(aim1, ref1).multiply(cerceveQ(aim0, ref0).invert());
/** eksen boyunca s kat uzatma (diğer yönler 1) */
function uzama(eksen, s) {
  const a = eksen, k = s - 1;
  return new T.Matrix4().set(
    1 + k * a.x * a.x, k * a.x * a.y, k * a.x * a.z, 0,
    k * a.y * a.x, 1 + k * a.y * a.y, k * a.y * a.z, 0,
    k * a.z * a.x, k * a.z * a.y, 1 + k * a.z * a.z, 0,
    0, 0, 0, 1);
}
/** T(p1) · R · S(eksen0, s) · K · T(−p0) */
function afin(p1, q, eksen0, s, p0) {
  return new T.Matrix4().makeTranslation(p1.x, p1.y, p1.z)
    .multiply(new T.Matrix4().makeRotationFromQuaternion(q))
    .multiply(eksen0 ? uzama(eksen0, s) : new T.Matrix4())
    .multiply(new T.Matrix4().makeScale(K, K, K))
    .multiply(new T.Matrix4().makeTranslation(-p0.x, -p0.y, -p0.z));
}
const MUSH_W = 1024;
const BANT_CM = 3.5;   // bel lastiği yüksekliği (şort)
const dikBilesen = (v, eksen) => v.clone().sub(eksen.clone().multiplyScalar(v.dot(eksen)));

/* ── Kemik dokusu: kemik başına DQS + kas verisi (bkz. govdeMalzemesi uKemikTex) ── */
function kemikDokusuKur(kemikSayisi) {
  const doku = new T.DataTexture(new Float32Array(kemikSayisi * 4 * 4), kemikSayisi, 4, T.RGBAFormat, T.FloatType);
  doku.needsUpdate = true;   // varsayılan: en yakın komşu süzgeci, mipmap yok — texelFetch tam değeri okur
  return doku;
}
/** İşlemci dizilerini (uDqR, uDqD, uKasK, uKasB, uDqMaske) dokuya kopyalar. Her karede, çizimden önce. */
export function kemikDokusuDoldur(u) {
  const doku = u.uKemikTex.value, v = doku.image.data, n = doku.image.width;
  for (let j = 0; j < n; j++) {
    const r = u.uDqR.value[j], d = u.uDqD.value[j], k = u.uKasK.value[j], b = u.uKasB.value[j];
    let o = j * 4;              v[o] = r.x; v[o + 1] = r.y; v[o + 2] = r.z; v[o + 3] = r.w;
    o = (n + j) * 4;            v[o] = d.x; v[o + 1] = d.y; v[o + 2] = d.z; v[o + 3] = d.w;
    o = (2 * n + j) * 4;        v[o] = k.x; v[o + 1] = k.y; v[o + 2] = k.z; v[o + 3] = k.w;
    o = (3 * n + j) * 4;        v[o] = b.x; v[o + 1] = b.y; v[o + 2] = u.uDqMaske.value[j]; v[o + 3] = 0;
  }
  doku.needsUpdate = true;
}

/* ── Kas vurgulu, deri bağlı kil malzeme ── */
function govdeMalzemesi(normalMap, normalScale, kemikSayisi, { renk = globalThis.__tenRenk ?? 0xd4c3b2, kumas = false, logo = false, u: paylasilan = null } = {}) {
  // Aksesuar (şort) gövdenin tekdüzenlerini PAYLAŞIR → kas vurgusu kumaşın üstünde de görünür
  const u = paylasilan ?? {
    uKasK: { value: Array.from({ length: kemikSayisi }, () => new T.Vector4()) },
    uKasEsik: { value: new T.Vector2(-0.08, 0.42) },
    uKasRenk: { value: new T.Color(ACC) }, uNabiz: { value: 1 },
    // kumaş altındaki deri kumaşın rengiyle çizilir (gorunumUygula günceller); hangisi: deri köşesinin aUstBolge'si (bel üstü = atlet)
    uAltRenk: { value: new T.Color(0x2b3038) }, uUstRenk: { value: new T.Color(0x4a5566) },
    uKasB: { value: Array.from({ length: kemikSayisi }, () => new T.Vector2(-9, 9)) },
    // Çift kuaterniyonlu deri (DQS) — hacim koruyan bağlama; yalnız KOL kemiklerinde (maske), bkz. dqGuncelle
    uDqR: { value: Array.from({ length: kemikSayisi }, () => new T.Vector4(0, 0, 0, 1)) },
    uDqD: { value: Array.from({ length: kemikSayisi }, () => new T.Vector4()) },
    uDqMaske: { value: new Array(kemikSayisi).fill(0) }, uDqK: { value: 100 }, uDqAcik: { value: 1 },
    // Deltoid düzeltmesi: kol kalkınca omuz başı kabarır (pose-space corrective). [sağ, sol]
    uDeltOmuz: { value: [new T.Vector3(), new T.Vector3()] }, uDeltDirsek: { value: [new T.Vector3(), new T.Vector3()] },
    uDeltMiktar: { value: [0, 0] },
    // Delta Mush (omuz bölgesi): satır 2k = konum ofseti, 2k+1 = normal + ağırlık
    uMushTex: { value: null }, uMushAcik: { value: 0 },
    // KEMİK DOKUSU (10 Eki): yukarıdaki beş kemik dizisi gölgelendiriciye tekdüze olarak DEĞİL, bu dokuyla gider.
    // Diziler 53 kemikte 265 köşe tekdüze yuvası yiyordu (+ matrisler ≈ 300); WebGL2'nin garanti ettiği sınır 256 →
    // o sınırı bildiren telefonlarda program derlenmiyor, manken hiç çizilmiyordu (Sabri'nin ikinci telefonu).
    // Diziler işlemci tarafında kaynak olarak kalır (Delta Mush, testler onları okur); kemikDokusuDoldur kopyalar.
    uKemikTex: { value: kemikDokusuKur(kemikSayisi) },
  };
  // Sabri: "çok kaslı, kaba, korkutucu" → kas kabartması (normal haritası) %18'e, yüzey A ile aynı mat kil
  const m = new T.MeshPhysicalMaterial(kumas
    ? { color: renk, roughness: 0.86, metalness: 0, sheen: 0.7, sheenRoughness: 0.6, sheenColor: 0x5a616c, side: T.DoubleSide }
    : { color: renk, roughness: 0.74, metalness: 0, normalMap, normalScale: normalScale?.clone().multiplyScalar(0.18),
        sheen: 0.18, sheenRoughness: 0.8, sheenColor: 0xffffff });
  m.userData.u = u;
  // ── Deri gölgelendirici parçaları: görünen malzeme VE gölge (derinlik) malzemesi AYNI deriyi çizer ──
  // (7 Eki: gölge three'nin standart derinlik malzemesiyle çiziliyordu; DQS/deltoid/Delta Mush'ı bilmediği için
  //  gölgeyi düzeltilmemiş deri atıyor, omuzda kendi üstüne keskin kenarlı gölge lekeleri çıkıyordu.)
  const DERI_DEKL = `
        // Kemik dokusu: sütun = kemik; satır 0 dqR · 1 dqD · 2 kasK · 3 (kasB.xy, dqMaske, 0) — bkz. kemikDokusuDoldur
        uniform highp sampler2D uKemikTex;
        vec4 kemikSatir(int b, int satir) { return texelFetch(uKemikTex, ivec2(b, satir), 0); }
        float dqMaskeK(int b) { return kemikSatir(b, 3).z; }
        uniform float uDqK; uniform float uDqAcik;
        uniform vec3 uDeltOmuz[2]; uniform vec3 uDeltDirsek[2]; uniform float uDeltMiktar[2];
        attribute vec2 aDelt; attribute float aMushI; uniform sampler2D uMushTex; uniform float uMushAcik;
        vec3 dqDondur(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
        #ifdef USE_SKINNING
        float dqKarisim(out vec4 br, out vec4 bd) {
          ivec4 ix = ivec4(skinIndex + 0.5);
          float w0 = (skinWeight.x * dqMaskeK(ix.x) + skinWeight.y * dqMaskeK(ix.y) + skinWeight.z * dqMaskeK(ix.z) + skinWeight.w * dqMaskeK(ix.w)) * uDqAcik;
          br = vec4(0.0); bd = vec4(0.0);
          if (w0 <= 0.001) return 0.0;
          vec4 r0 = kemikSatir(ix.x, 0);
          for (int c = 0; c < 4; c++) {
            int b = c == 0 ? ix.x : c == 1 ? ix.y : c == 2 ? ix.z : ix.w;
            float w = c == 0 ? skinWeight.x : c == 1 ? skinWeight.y : c == 2 ? skinWeight.z : skinWeight.w;
            vec4 r = kemikSatir(b, 0), d = kemikSatir(b, 1);
            if (dot(r, r0) < 0.0) { r = -r; d = -d; }
            br += w * r; bd += w * d;
          }
          float l = length(br); br /= l; bd /= l;
          return w0;
        }
        #endif`;
  const DERI_NORMAL = `
        vec3 dqNOrj = objectNormal;
        #include <skinnormal_vertex>
        #ifdef USE_SKINNING
        {
          vec4 nBr, nBd; float nW = dqKarisim(nBr, nBd);
          if (nW > 0.001) objectNormal = normalize(mix(objectNormal, dqDondur(nBr, dqNOrj), nW));
        }
        // DELTA MUSH: işlemcide düzeltilmiş normal (yalnız omuz bölgesi, ağırlık w)
        if (aMushI > 0.5 && uMushAcik > 0.5) { int mi = int(aMushI + 0.5) - 1;
          vec4 mn = texelFetch(uMushTex, ivec2(mi % ${MUSH_W}, (mi / ${MUSH_W}) * 2 + 1), 0);
          if (mn.w > 0.0) objectNormal = normalize(mix(objectNormal, mn.xyz, mn.w)); }
        #endif`;
  const DERI_KONUM = `
        vec3 dqPOrj = transformed;
        #include <skinning_vertex>
        #ifdef USE_SKINNING
        {
          vec4 pBr, pBd; float pW = dqKarisim(pBr, pBd);
          if (pW > 0.001) {
            vec3 t = 2.0 * (pBr.w * pBd.xyz - pBd.w * pBr.xyz + cross(pBr.xyz, pBd.xyz));
            vec3 pDq = dqDondur(pBr, uDqK * dqPOrj) + t;
            transformed = mix(transformed, pDq, pW);
          }
        }
        // DELTOİD: üst kol eksenine dik, dışarı doğru — kol kalkış açısıyla
        for (int sd = 0; sd < 2; sd++) {
          float a = (sd == 0 ? aDelt.x : aDelt.y) * uDeltMiktar[sd];
          if (a > 0.0) {
            vec3 ax = normalize(uDeltDirsek[sd] - uDeltOmuz[sd]), d = transformed - uDeltOmuz[sd];
            vec3 dik = d - ax * dot(d, ax);
            if (dot(dik, dik) > 1e-4) transformed += normalize(dik) * a;
          }
        }
        if (aMushI > 0.5 && uMushAcik > 0.5) { int mi = int(aMushI + 0.5) - 1;   // DELTA MUSH konum ofseti (bkz. mushUygula)
          transformed += texelFetch(uMushTex, ivec2(mi % ${MUSH_W}, (mi / ${MUSH_W}) * 2), 0).xyz; }
        #endif`;
  // Gölge malzemesi: aynı deri (VSM gölge geçişi customDepthMaterial'ı kullanır)
  const derinlik = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking });
  derinlik.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <skinning_vertex>', DERI_KONUM)
      .replace('#include <common>', '#include <common>\n' + DERI_DEKL);
  };
  derinlik.customProgramCacheKey = () => 'govde-derinlik-' + kemikSayisi;
  m.userData.derinlik = derinlik;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <skinnormal_vertex>', DERI_NORMAL)
      .replace('#include <skinning_vertex>', DERI_KONUM)
      .replace('#include <common>', `#include <common>
        uniform vec2 uKasEsik; varying float vKas;
        attribute float aKolU;
        ${DERI_DEKL}
        attribute float aGizli; varying float vGizli; attribute float aBelY; varying float vBelY; attribute float aUstBolge; varying float vUst;
        ${logo ? 'attribute vec3 aLogo; varying vec3 vLogo;' : ''}
        float kasKemik(float i, vec3 n) {
          vec4 k = kemikSatir(int(i + 0.5), 2);
          if (k.w <= 0.0) return 0.0;
          vec2 b = kemikSatir(int(i + 0.5), 3).xy;
          k.w *= smoothstep(b.x - 0.08, b.x + 0.08, aKolU) * (1.0 - smoothstep(b.y - 0.08, b.y + 0.08, aKolU));
          if (dot(k.xyz, k.xyz) < 0.01) return k.w;
          return k.w * smoothstep(uKasEsik.x, uKasEsik.y, dot(n, normalize(k.xyz)));
        }`)
      .replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
        vKas = 0.0; vGizli = aGizli; vBelY = aBelY; vUst = aUstBolge;${logo ? ' vLogo = aLogo;' : ''}
        #ifdef USE_SKINNING
          vec3 kasN = normalize(mat3(modelMatrix) * objectNormal);
          vKas = skinWeight.x * kasKemik(skinIndex.x, kasN) + skinWeight.y * kasKemik(skinIndex.y, kasN)
               + skinWeight.z * kasKemik(skinIndex.z, kasN) + skinWeight.w * kasKemik(skinIndex.w, kasN);
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n varying float vKas; varying float vGizli; varying float vBelY; varying float vUst; uniform vec3 uKasRenk; uniform float uNabiz; uniform vec3 uAltRenk; uniform vec3 uUstRenk;' + (logo ? ' varying vec3 vLogo; uniform sampler2D uLogo;' : ''))
      // KUMAŞ ALTINDAKİ DERİ (15 Eki, Sabri: "asılı bacak kaldırmada bacaklar yukarıdayken kalçası birden bozuluyor"): deri
      // eskiden ATILIYORDU (discard). Kalça çok bükülünce doğrusal bağlamada deri kumaştan hızlı hareket edip DIŞARI taşıyor;
      // atılan deri orada delik açıyor, kumaşın içi açık leke gibi görünüyordu (tanıda kırmızı: asılı bacak kaldırmanın
      // tepesinde Leo'da avuç büyüklüğünde, taytta her gövdede). Artık o bölgede deri KUMAŞIN RENGİYLE çizilir: taşan deri
      // delik değil kumaş kabarığı gibi görünür; kumaş dışarıdayken derinlik testi deriyi zaten örter. (__gizliAt: eski davranış)
      .replace('#include <clipping_planes_fragment>', !kumas && globalThis.__gizliAt && !globalThis.__gizliGoster ? '#include <clipping_planes_fragment>\n if (vGizli > 0.5) discard;' : '#include <clipping_planes_fragment>')
      .replace('#include <opaque_fragment>', globalThis.__gizliGoster && !kumas ? '#include <opaque_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.0, 0.0), step(0.5, vGizli));' : '#include <opaque_fragment>')   // TANI: gizli deri kırmızı
      // kumaş renkli deri kumaşın PARLAKLIĞINI da alır (mat örgü + kumaşın sheen'i) — yoksa kumaşın içinde açık benek gibi duruyordu
      .replace('#include <lights_physical_fragment>', !kumas && !globalThis.__gizliGoster && !globalThis.__gizliAt
        ? `#include <lights_physical_fragment>
          #ifdef USE_SHEEN
            if (vGizli > 0.5) { material.roughness = 0.86; material.sheenColor = vec3(0.247, 0.266, 0.297); material.sheenRoughness = 0.6; }
          #else
            if (vGizli > 0.5) material.roughness = 0.86;
          #endif`
        : '#include <lights_physical_fragment>')
      .replace('#include <dithering_fragment>', kumas ? '#include <dithering_fragment>\n if (!gl_FrontFacing) gl_FragColor.rgb *= 0.62;' : '#include <dithering_fragment>')
      .replace('#include <roughnessmap_fragment>', kumas ? `#include <roughnessmap_fragment>
        // BEL LASTİĞİ (7 Eki): ayrı şerit geometrisi katlanıp kanatçık yapıyordu → kumaşın kendi üstünde bant.
        // Üst ${BANT_CM} cm biraz koyu ve daha az mat (örme lastik), alt kenarında ince dikiş çizgisi.
        float bantM = 1.0 - smoothstep(${(BANT_CM / 100).toFixed(3)} - 0.002, ${(BANT_CM / 100).toFixed(3)} + 0.002, vBelY);
        roughnessFactor = mix(roughnessFactor, 0.6, bantM);` : '#include <roughnessmap_fragment>')
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${!kumas && !globalThis.__gizliGoster && !globalThis.__gizliAt ? 'if (vGizli > 0.5) diffuseColor.rgb = vUst > 0.5 ? uUstRenk : uAltRenk;' : ''}
        ${kumas ? `{ float bm = 1.0 - smoothstep(${(BANT_CM / 100).toFixed(3)} - 0.002, ${(BANT_CM / 100).toFixed(3)} + 0.002, vBelY);
          float dikis = 1.0 - smoothstep(0.0006, 0.0016, abs(vBelY - ${(BANT_CM / 100).toFixed(3)} - 0.003));
          diffuseColor.rgb *= mix(1.0, 0.7, bm) * mix(1.0, 0.55, dikis); }` : ''}
        ${logo ? `// GÖĞÜS BASKISI (17 Eki, Sabri: "FS logosunu atletlerin sol göğsüne gri tonlarda bas"): vLogo = dinlenme pozundaki
        // sol göğse DÜZ izdüşüm (atletKur) → baskı deriyle birlikte hareket eder. Doku yalnız şekil: açık harf tam, turuncu
        // vurgu yarım → iki gri ton. Gri kumaşın tonundan: koyu kumaşta açık gri, açık kumaşta koyu gri. Yalnız dış yüz.
        if (gl_FrontFacing && vLogo.z > 0.5 && vLogo.x > 0.0 && vLogo.x < 1.0 && vLogo.y > 0.0 && vLogo.y < 1.0) {
          float la = texture2D(uLogo, vLogo.xy).r;
          float kl = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(kl > 0.25 ? 0.12 : 0.42), la * 0.85);
        }` : ''}
        float kasM = clamp(vKas, 0.0, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, uKasRenk, kasM * 0.92);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += uKasRenk * kasM * 0.55 * uNabiz;`);
  };
  if (logo) m.onBeforeCompile = (onceki => sh => { onceki(sh); sh.uniforms.uLogo = { value: P.logoDokusu() }; })(m.onBeforeCompile);
  m.customProgramCacheKey = () => 'govde-kas-dq-mush-' + kemikSayisi + (kumas ? '-kumas' : '') + (logo ? '-logo' : '');
  return m;
}

/** AVUÇ YÖNÜ — VERİDE YOK (bulgu; uygulamada her hareketin verisine girmeli). Anatomik tanım:
 *   ic        avuçlar birbirine / gövdenin orta çizgisine bakar (nötr kavrama)
 *   ayak      gövdeye göre ayak yönü (bench: pronasyon, sırtüstü)
 *   ileri     gövdenin önü (oturarak pres)
 *   onKolOn   ön kolun ÖN yüzü — supinasyon (curl)
 *   onKolArka ön kolun ARKA yüzü — pronasyon, kol düzken (ön kaldırış)
 * Avuç bu yöne en yakın olacak biçimde seçilir; ikisi de belirsizse (|cos| < 0,25) önceki kare korunur. */
const AVUC = {
  bb_bench_press: 'ayak', bb_incline_press: 'ayak', bb_skull_crusher: 'ayak', machine_incline_press: 'ayak', db_shoulder_press: 'ileri', db_overhead_ext: 'onKolOn',
  cable_front_raise: 'onKolArka', cable_curl: 'onKolOn',
};

/** Elin tuttuğu nesnenin ekseni: e'ye 6 cm'den yakın en yakın ince kapsül (bar, sap, tutamaç) */
function tutulanEksen(e, ilkeller = [], onceki = -1) {
  const olc = j => {
    const geo = ilkeller[j]?.geo;
    if (!geo || geo.tur !== 'k' || geo.r > 3.2) return null;
    const A = V(geo.a3), B = V(geo.b3), AB = B.clone().sub(A), L2 = AB.lengthSq();
    if (L2 < 4) return null;                                     // 2 cm'den kısa kapsül eksen vermez
    const u = Math.max(0, Math.min(1, e.clone().sub(A).dot(AB) / L2));
    const nokta = A.clone().addScaledVector(AB, u);
    return { d: nokta.distanceTo(e), eksen: AB.normalize(), j, nokta, r: geo.r };
  };
  // Süreklilik: önceki karede tutulan ilkel hâlâ 8 cm içindeyse ONDAN ayrılma (V-bar gibi çok parçalı
  // tutamaçta el kareden kareye başka parçaya atlıyor, bilek dönüyordu — Sabri, 6 Eki)
  const eski = onceki >= 0 ? olc(onceki) : null;
  if (eski && eski.d < 8) return eski;
  let en = null;
  for (let j = 0; j < ilkeller.length; j++) { const r = olc(j); if (r && r.d < 6 && (!en || r.d < en.d)) en = r; }
  return en;
}
/** ŞORT — ilk "aksesuar yuvası" (Sabri, 6 Eki: "bu mankene şort giydirebilir miyiz?").
 * Gövdenin KENDİ yüzeyinden türer: bel ile uyluk ortası arasındaki üçgenler, normal boyunca 7 mm dışarı.
 * Aynı iskelet + aynı deri ağırlıkları → her harekette gövdeyle birlikte çalışır; kas vurgusu kumaşın
 * üstünde de görünür (aynı tekdüzenler). Renk nötr grafit: mercan yalnız CANLI olan (kas) içindir. */
/** GİYSİ AYARI (13 Eki, mokap — Sabri: "kadınlarda şort yerine tayt, atlette biraz dekolte, yaşlı adamın kıyafetleri
 *  daha geniş; kıyafet rengi değişebilmeli"). `globalThis.__giysi` YALNIZ mokap sayfasınca kurulur; yoksa her değer
 *  bugünküyle BİREBİR aynıdır (uygulama değişmez). altBol/altPacaBol: şort bolluğu (m) · pacaY: paça yüksekliği (m,
 *  tayt için bileğe yakın) · yakaOn: atlet ön yaka derinliği ek payı (m) · yakaEn: yaka yarı eni (m) · ustBol: atlet kalınlığı. */
/* GÖVDEYE GÖRE KIYAFET (13 Eki, avatar — Sabri onaylı mokap): kadınlarda yüksek belli tayt + V yakalı oturan atlet,
   yaşlı erkekte daha bol şort/atlet. Değerler mokapta (mockup-govde/figur.html) seçildi; erkek (Leo) = bugünkü kıyafet.
   ⚠️ Askı ~6 cm'nin altına inmez: daha incesinde kenar temizliği askıyı yiyordu (denendi). `__giysi` ölçüm aracı içindir. */
export const GIYSI_STILI = {
  kadin:       { pacaBilek: 0.06, altBol: 0.003, altPacaBol: 0, belUst: 0.05, atletAlt: -0.01, yakaOn: 0.085, yakaEn: 0.068, etekUst: 0.11 },
  yasli_kadin: { pacaBilek: 0.06, altBol: 0.004, altPacaBol: 0, belUst: 0.05, atletAlt: -0.01, yakaOn: 0.08, yakaEn: 0.07, etekUst: 0.11 },
  // 15 Eki (Sabri: "Max'in paçası geniş, altından boşluk görünüyor; paçayı biraz uzat, bacağı paçanın altında ~10 cm devam
  // ettir"): pacaOran 0,55 → 0,62 (paça ~3 cm uzun) · gizliPay 4 mm → 10 cm (deri paçanın 10 cm yukarısına kadar çizilir)
  yasli_erkek: { altBol: 0.016, altPacaBol: 0.012, ustBol: 0.011, pacaOran: 0.62, gizliPay: 0.10 },
};
let aktifGiysi = null;                                 // govdeYukle kurulurken gövdenin stili
const giysiAyari = () => globalThis.__giysi ?? aktifGiysi ?? {};
function sortKur(govde, { BEL_Y = 1.12, PACA_Y = 0.72, LOGO = null } = {}) {
  const GY = giysiAyari();
  // Sabri (6 Eki 02:26): "şort biraz bol olsun, vücuda yapışık · bel bölgesi kısa — mankenin beline kadar çek"
  // → bel 1,045 → 1,12 m (doğal bel) · bolluk 7 mm → 15 mm, paçaya doğru 32 mm'ye açılır · kumaş kas hatlarını
  //   İZLEMEZ: yüzey konumdan kaynaştırılıp düz süzgeçle yumuşatılır (gövdenin kas kabartısı kumaşa geçmez)
  const geo = govde.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
  const kaynak = govde.geometry.attributes.position;
  for (let j = 0; j < n; j++) {
    const y = kaynak.getY(j), PACA_UST = PACA_Y + 0.14, paca = Math.max(0, Math.min(1, (PACA_UST - y) / (PACA_UST - PACA_Y)));
    const bel = Math.max(0, Math.min(1, (y - (BEL_Y - 0.07)) / 0.07));        // 1 = bel bandı
    const bol = ((GY.altBol ?? 0.009) + (GY.altPacaBol ?? 0.006) * paca * paca) * (1 - bel) + 0.002 * bel;       // bel sarar · paça hafif bol (6 Eki: oturuşta balon gibiydi → 12→9 mm)
    pos.setXYZ(j, pos.getX(j) + nor.getX(j) * bol, pos.getY(j) + nor.getY(j) * bol, pos.getZ(j) + nor.getZ(j) * bol);
  }
  // Kenar düz olsun (Sabri: "şortun üstü yırtık gibi"): üçgen sınırından KESMEK yerine, banda değen her üçgen
  // alınır ve bandın dışında kalan köşeler bel/paça düzlemine OTURTULUR → dümdüz bel ve paça kenarı
  const ind = govde.geometry.index.array, secili = [];
  // ⚠️ Yalnız yükseklik bandı YETMEZ: A-pozlu gövdede (MakeHuman) eller dinlenmede kalça hizasında sarkar ve
  //   parmak uçları şorta dahil oluyordu (6 Eki, ölçüldü). Köşe ayrıca gövde/bacak kemiklerine bağlı olmalı.
  const si = govde.geometry.attributes.skinIndex, sw = govde.geometry.attributes.skinWeight;
  const adlar = govde.skeleton.bones.map(b => b.name.toLowerCase());
  const govdeKemigi = adlar.map(a => /^(root|pelvis|spine_0[12]|thigh_|calf_)/.test(a));
  const govdede = j => { let w = 0; for (let c = 0; c < 4; c++) if (govdeKemigi[si.getComponent(j, c)]) w += sw.getComponent(j, c); return w > 0.5; };
  const icinde = j => { const y = kaynak.getY(j); return y > PACA_Y && y < BEL_Y && govdede(j); };
  for (let f = 0; f < ind.length; f += 3) if (icinde(ind[f]) || icinde(ind[f + 1]) || icinde(ind[f + 2])) secili.push(ind[f], ind[f + 1], ind[f + 2]);
  const kullanilan = new Set(secili);
  for (const j of kullanilan) {
    const y0 = kaynak.getY(j), yk = Math.min(BEL_Y, Math.max(PACA_Y, y0));
    if (yk !== y0) pos.setY(j, pos.getY(j) + (yk - y0));
    // bel bandı: üst 3 cm biraz daha dışarıda (lastik)
    const bant = Math.max(0, Math.min(1, (yk - (BEL_Y - 0.03)) / 0.03));
    // (bel kabartısı ayrı lastik şeridine taşındı — iki katman üst üste binip yamalı görünüyordu)
  }
  // Kumaş yüzeyi: dikişleri kaynaştır, yalnız şort üçgenlerinin köşelerini düz süzgeçle yumuşat (kenarlar sabit)
  const anahtar = j => `${kaynak.getX(j).toFixed(5)},${kaynak.getY(j).toFixed(5)},${kaynak.getZ(j).toFixed(5)}`;
  const grup = new Map(), kok = new Int32Array(n);
  for (let j = 0; j < n; j++) { const k = anahtar(j); if (!grup.has(k)) grup.set(k, grup.size); kok[j] = grup.get(k); }
  const G = grup.size, P = new Float32Array(G * 3), komsu = Array.from({ length: G }, () => new Set()), kenar = new Uint8Array(G);
  for (let j = 0; j < n; j++) { P[kok[j] * 3] = pos.getX(j); P[kok[j] * 3 + 1] = pos.getY(j); P[kok[j] * 3 + 2] = pos.getZ(j); }
  for (let f = 0; f < secili.length; f += 3) for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) {
    const a = kok[secili[f + x]], b = kok[secili[f + y]]; if (a !== b) { komsu[a].add(b); komsu[b].add(a); }
  }
  for (let j = 0; j < n; j++) { const y = kaynak.getY(j); if (y < PACA_Y + 0.012 || y > BEL_Y - 0.012) kenar[kok[j]] = 1; }
  // ⚠️ Düz süzgeç silindiri BÜZER (ilk denemede bacak kumaşın içinden çıktı) → hacim koruyan Taubin
  const adim = l => { const Q = P.slice();
    for (let v = 0; v < G; v++) { const N = komsu[v]; if (!N.size || kenar[v]) continue; let sx = 0, sy = 0, sz = 0;
      for (const w of N) { sx += Q[w * 3]; sy += Q[w * 3 + 1]; sz += Q[w * 3 + 2]; }
      const m = N.size; P[v * 3] += l * (sx / m - Q[v * 3]); P[v * 3 + 1] += l * (sy / m - Q[v * 3 + 1]); P[v * 3 + 2] += l * (sz / m - Q[v * 3 + 2]); } };
  for (let it = 0; it < 20; it++) { adim(0.5); adim(-0.53); }
  // KALÇA YARIĞI DOLGUSU (7 Eki, Sabri: "şortun arkası yırtık gibi, arkadan bir nesne çıkıyor"). Eski köprü yarıktaki
  // köşeleri kalça tepesine kadar SERT çekiyordu; köşeler yarığın deri ağırlıklarını taşıdığı için kalça bükülünce
  // dikiş çizgisi ve belde/yarık dibinde sivri uçlar oluşuyordu. Şimdi: arka orta şeritte (|x| < 6 cm) yalnız z
  // ekseninde, yalnız GERİYE doğru, kenara sönümlü yumuşatma → kumaş yarığın üstünden yumuşakça geçer.
  if (!globalThis.__yarikEski) {
    let catal = Infinity;
    for (let j = 0; j < n; j++) if (Math.abs(kaynak.getX(j)) < 0.006 && icinde(j)) catal = Math.min(catal, kaynak.getY(j));
    const bolge = [], agirlik = [];
    for (let v = 0; v < G; v++) {
      const x = Math.abs(P[v * 3]), y = P[v * 3 + 1], z = P[v * 3 + 2];
      if (x >= 0.06 || z > -0.02 || kenar[v] || !komsu[v].size || y < catal || y > catal + 0.2) continue;
      const yUst = Math.min(1, (catal + 0.2 - y) / 0.05), yAlt = Math.min(1, (y - catal) / 0.03);   // dikeyde de sönümlü
      bolge.push(v); agirlik.push((1 - (x / 0.06) ** 2) * Math.max(0, Math.min(yUst, yAlt)));
    }
    for (let it = 0; it < 60; it++) {
      const Z = bolge.map(v => { let s2 = 0; for (const w of komsu[v]) s2 += P[w * 3 + 2]; return s2 / komsu[v].size; });
      bolge.forEach((v, k) => { const dz = 0.5 * agirlik[k] * (Z[k] - P[v * 3 + 2]); if (dz < 0) P[v * 3 + 2] += dz; });
    }
  }
  for (let j = 0; j < n; j++) pos.setXYZ(j, P[kok[j] * 3], P[kok[j] * 3 + 1], P[kok[j] * 3 + 2]);
  // Gövde dışarı taşmasın (Sabri: "kalça şortun dışına çıkmış"): her köşe, gövdedeki eşinin normali boyunca
  // en az 2 mm dışarıda kalır (yumuşatma içbükey yerlerde kumaşı gövdenin içine çekiyordu)
  for (const j of kullanilan) {
    const bx = kaynak.getX(j), by = pos.getY(j) - (pos.getY(j) - kaynak.getY(j)), bz = kaynak.getZ(j);
    const dx = pos.getX(j) - bx, dy = pos.getY(j) - by, dz = pos.getZ(j) - bz;
    const nd = dx * nor.getX(j) + dy * nor.getY(j) + dz * nor.getZ(j);
    if (nd < 0.002) { const k2 = 0.002 - nd; pos.setXYZ(j, pos.getX(j) + nor.getX(j) * k2, pos.getY(j) + nor.getY(j) * k2, pos.getZ(j) + nor.getZ(j) * k2); }
  }
  geo.setIndex(secili);
  geo.computeVertexNormals();
  // KUMAŞ AĞIRLIKLARI (7 Eki): kumaş gövdenin kas bazlı ağırlıklarını birebir izliyordu → kalça bükülünce kumaşta
  // keskin kıvrım ve kanatçıklar. Kumaş deriden daha "tek parça" davranır: iç kısımda ağırlıklar komşularla
  // ortalanır; bel ve paça kenarına 3 cm kala gövdeyle birebir (kenarda gövde ile kumaş ayrışmasın).
  if (!globalThis.__kumasAgirlikYok) {
    const gsi = geo.attributes.skinIndex, gsw = geo.attributes.skinWeight;
    const W = new Map(), etki = new Float32Array(G);
    for (const j of kullanilan) { const v = kok[j]; if (W.has(v)) continue;
      const y = kaynak.getY(j); etki[v] = Math.max(0, Math.min(1, Math.min(y - PACA_Y, BEL_Y - y) / 0.03 - 0.0));
      const w = new Map(); for (let c = 0; c < 4; c++) { const x = gsw.getComponent(j, c); if (x > 0) w.set(gsi.getComponent(j, c), (w.get(gsi.getComponent(j, c)) ?? 0) + x); }
      W.set(v, w); }
    // KENARA ÇEKİLEN KÖŞELER (7 Eki, denetim: oturuşta paça kenarı testere dişi gibiydi): düz kenar için bandın dışındaki
    // köşeler kenar çizgisine çekiliyor ama dizdeki/sırttaki ESKİ yerlerinin ağırlıklarını taşıyordu → diz/kalça bükülünce
    // komşularından ayrılıyordu. Şimdi ağırlıklarını bandın içindeki komşularından alırlar (iki geçiş).
    {
      const ky = new Map(); for (const j of kullanilan) if (!ky.has(kok[j])) ky.set(kok[j], kaynak.getY(j));
      const disarida = v => { const y = ky.get(v); return y < PACA_Y || y > BEL_Y; };
      for (let gec = 0; gec < 3; gec++) for (const [v] of W) {
        if (!disarida(v)) continue;
        const top = new Map(); let say = 0;
        for (const u2 of komsu[v]) { const wu = W.get(u2); if (!wu || (gec === 0 && disarida(u2))) continue; say++; for (const [bb, x] of wu) top.set(bb, (top.get(bb) ?? 0) + x); }
        if (say) { for (const [bb, x] of top) top.set(bb, x / say); W.set(v, top); }
      }
    }
    for (let it = 0; it < 12; it++) {
      const yeni = new Map();
      for (const [v, w] of W) {
        const top = new Map(); let say = 0;
        for (const u2 of komsu[v]) { const wu = W.get(u2); if (!wu) continue; say++; for (const [bb, x] of wu) top.set(bb, (top.get(bb) ?? 0) + x); }
        const k = 0.5 * etki[v]; if (!say || k <= 0) { yeni.set(v, w); continue; }
        const o = new Map(); for (const bb of new Set([...w.keys(), ...top.keys()])) o.set(bb, (1 - k) * (w.get(bb) ?? 0) + k * (top.get(bb) ?? 0) / say);
        yeni.set(v, o);
      }
      for (const [v, w] of yeni) W.set(v, w);
    }
    for (const j of kullanilan) {
      const en4 = [...W.get(kok[j]).entries()].sort((x, y) => y[1] - x[1]).slice(0, 4), t = en4.reduce((a2, [, x]) => a2 + x, 0) || 1;
      for (let c = 0; c < 4; c++) { gsi.setComponent(j, c, en4[c]?.[0] ?? 0); gsw.setComponent(j, c, (en4[c]?.[1] ?? 0) / t); }
    }
    gsi.needsUpdate = gsw.needsUpdate = true;
  }
  // GİYSİ ALTI GÖVDE GİZLEME (6 Eki, Sabri: "eğilince şortun altından bir şeyler çıkıyor"): kalça bükülünce
  // doğrusal deri bağlamada gövde, ofsetli kumaştan hızlı hareket edip dışarı taşıyor. Endüstri çözümü
  // (MakeHuman "delete" grubu, MetaHuman hidden face map): kumaşın altında kalan gövde yüzeyi ÇİZİLMEZ.
  // Sınır bel ve paça kenarlarından 2,5 cm İÇERİDE (kenarda boşluk görünmesin).
  const gizli = new Float32Array(n);
  const GP = globalThis.__gizliPay ?? GY.gizliPay ?? 0.004;   // 7 Eki: 2,5 cm → 4 mm (denetim: oturuşta kenardaki deri kumaşın dışına taşıp paçayı testere dişi gösteriyordu)
  for (let j = 0; j < n; j++) { const y = kaynak.getY(j); if (y > PACA_Y + GP && y < BEL_Y - 0.025 && govdede(j)) gizli[j] = 1; }   // belde 2,5 cm kalır (dar payda bel kenarı tırtıklanıyordu)
  govde.geometry.setAttribute('aGizli', new T.BufferAttribute(gizli, 1));
  { const ub = new Float32Array(n); for (let j = 0; j < n; j++) ub[j] = kaynak.getY(j) > BEL_Y - 0.02 ? 1 : 0;   // bel üstü = atlet bölgesi (renk seçimi; ara değer yok)
    govde.geometry.setAttribute('aUstBolge', new T.BufferAttribute(ub, 1)); geo.setAttribute('aUstBolge', new T.BufferAttribute(new Float32Array(n), 1)); }
  geo.setAttribute('aGizli', new T.BufferAttribute(new Float32Array(n), 1));
  { const by = new Float32Array(n); for (let j = 0; j < n; j++) by[j] = BEL_Y - kaynak.getY(j); geo.setAttribute('aBelY', new T.BufferAttribute(by, 1)); }
  govde.geometry.setAttribute('aBelY', new T.BufferAttribute(new Float32Array(n).fill(9), 1));
  geo.setAttribute('aDelt', new T.BufferAttribute(new Float32Array(n * 2), 2));
  geo.setAttribute('aMushI', new T.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aKolU', new T.BufferAttribute(new Float32Array(n).fill(0.5), 1));
  // PAÇA BASKISI (17 Eki): sol bacağa, dış yandan LOGO.on derece ÖNE dönük doğrultuda (n) düz izdüşüm; izdüşüm o
  // yükseklikte bacağın kesit ortasından geçer (kumaşın kendi köşelerinden ölçülür) → baskı bacağın çevresinde o açıda
  // ortalanır. u = n'ye bakan izleyenin sağı, v = yukarı. Maske: dış yüz n'ye bakıyor ve sol bacak (sağ bacağın iç-ön
  // yüzü de n'ye bakabilir; x işaretiyle ayrılır).
  if (LOGO) { const p2 = geo.attributes.position, nr = geo.attributes.normal, s = LOGO.solX, a = LOGO.on * Math.PI / 180;
    const nx = s * Math.cos(a), nz = Math.sin(a), sagX = nz, sagZ = -nx;   // n · izleyenin sağı (= −n × yukarı)
    let xa = Infinity, xb = -Infinity, za = Infinity, zb = -Infinity;
    for (let j = 0; j < n; j++) if (Math.abs(p2.getY(j) - LOGO.y) < 0.01 && p2.getX(j) * s > 0.04) {
      xa = Math.min(xa, p2.getX(j)); xb = Math.max(xb, p2.getX(j)); za = Math.min(za, p2.getZ(j)); zb = Math.max(zb, p2.getZ(j)); }
    const cx = (xa + xb) / 2, cz = (za + zb) / 2, A = new Float32Array(n * 3);
    for (let j = 0; j < n; j++) { const dx = p2.getX(j) - cx, dz = p2.getZ(j) - cz;
      A[j * 3] = (dx * sagX + dz * sagZ) / LOGO.en + 0.5; A[j * 3 + 1] = (p2.getY(j) - LOGO.y) / LOGO.boy + 0.5;
      A[j * 3 + 2] = nr.getX(j) * nx + nr.getZ(j) * nz > 0.5 && p2.getX(j) * s > 0.04 ? 1 : 0; }
    geo.setAttribute('aLogo', new T.BufferAttribute(A, 3)); }
  const u = govde.material.userData.u;
  const mat = govdeMalzemesi(null, null, u.uKasK.value.length, { renk: 0x2b3038, kumas: true, logo: !!LOGO, u });
  const m = new T.SkinnedMesh(geo, mat);
  m.customDepthMaterial = mat.userData.derinlik;
  m.bind(govde.skeleton, govde.bindMatrix);
  m.castShadow = true; m.receiveShadow = !!globalThis.__kendiGolge; m.frustumCulled = false;
  // (7 Eki: ayrı lastik şeridi kaldırıldı — bant artık kumaş gölgelendiricisinde, bkz. BANT_CM)
  return m;
}

/**
 * SPORCU ATLETİ (8 Eki, Sabri: "mankenimize bir sporcu atleti giydirelim"): şortla aynı yöntem — gövdenin kopyası,
 * bölge kemik ağırlığı + konumla seçilir, yüzey normali boyunca dışarı itilir, altında kalan deri çizilmez.
 * Kesim: önde derin yaka, arkada yüksek yaka, geniş kol oyuğu, ince askı; etek şortun bel bandının üstüne biner.
 * Ölçüler modelin kendi iskeletinden (P0): bel, koltuk altı, omuz eklemi, boyun.
 */
function atletKur(govde, { ALT_Y, KOLTUK_Y, OMUZ_Y, BOYUN_Y, LOGO = null }) {
  const GY = giysiAyari();
  const geo = govde.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, n = pos.count;
  const kaynak = govde.geometry.attributes.position, si = govde.geometry.attributes.skinIndex, sw = govde.geometry.attributes.skinWeight;
  const adlar = govde.skeleton.bones.map(b => b.name.toLowerCase());
  const grup = re => adlar.map(a => re.test(a));
  const KOL = grup(/^(upperarm|lowerarm|hand|index|middle|ring|pinky|thumb)/), BAS = grup(/^(neck|head)/), GOVDE = grup(/^(root|pelvis|spine|clavicle)/);
  const agir = (j, G) => { let w = 0; for (let c = 0; c < 4; c++) if (G[si.getComponent(j, c)]) w += sw.getComponent(j, c); return w; };
  // pay > 0: kenarlardan o kadar İÇERİDE (gizleme için)
  const icinde = (j, pay = 0) => {
    const y = kaynak.getY(j), x = Math.abs(kaynak.getX(j)), z = kaynak.getZ(j);
    if (y < ALT_Y + pay || agir(j, BAS) > 0.75) return false;   // boyun açıklığını yaka elipsi verir (0,3 askıyı omuz tepesinde kesiyordu)
    // koltuk altının ALTI: gövdeye bağlı deri (sarkan eller/kalça yanı dışarıda)
    if (y < KOLTUK_Y) return agir(j, GOVDE) >= 0.5 && agir(j, KOL) <= 0.5 - pay * 10;
    // ÜSTÜ: kol ağırlığı eşiği askının içinde tek tük üçgen dışlayıp minik delikler açıyordu → yalnız geometri
    // koltuk altının ÜSTÜ yalnız GEOMETRİYLE (ağırlık eşiği omuzda düzensiz, basamaklı sınır çıkarıyordu):
    // yaka elipsi — önde derin, arkada sığ
    const on = Math.max(0, Math.min(1, (z + 0.03) / 0.08)), yd = 0.05 + (GY.yakaOn ?? 0.06) * on * on * (3 - 2 * on), ye = GY.yakaEn ?? 0.065;   // ön/arka arası yumuşak geçiş (omuz tepesinde basamak yapıyordu)
    if (((BOYUN_Y + 0.02 - y) / (yd + 0.02)) ** 2 + (x / ye) ** 2 < (1 + pay * 12) ** 2) return false;
    // kol oyuğu: koltuk altından omuz tepesine daralan kavis; askı dış kenarı omuz tepesinde 12,5 cm (askı ~6 cm —
    // 4 cm'de yaka ile kol oyuğu arkada tek köşeye kadar daralıyor, kenar şeridi kıvrılıp koyu sivrilik çiziyordu)
    const k = Math.min(1, (y - KOLTUK_Y) / (OMUZ_Y - KOLTUK_Y));
    return x <= (GY.askiDis ?? 0.17) - (GY.askiDar ?? 0.045) * Math.sqrt(k) - pay;   // GY: ince askı (kadın kesimi, mokap)
  };
  const ind = govde.geometry.index.array, secili = [];
  for (let f = 0; f < ind.length; f += 3) if (icinde(ind[f]) && icinde(ind[f + 1]) && icinde(ind[f + 2])) secili.push(ind[f], ind[f + 1], ind[f + 2]);
  // DELİK DOLDURMA (8 Eki akşam, Sabri: "omuz presinde atletin ön askılarında delikler"): seçim köşe ölçütüyle
  // yapıldığı için askının içinde tek tük üçgen dışarıda kalıyordu (deri görünüyordu). Kenarlarından ikisi seçili
  // üçgenlerle ortak olan seçilmemiş gövde üçgeni tur tur geri eklenir (delik ve çentik kapanır).
  {
    const an0 = j => `${kaynak.getX(j).toFixed(5)},${kaynak.getY(j).toFixed(5)},${kaynak.getZ(j).toFixed(5)}`;
    const kk = new Map(), kid = j => { const a = an0(j); if (!kk.has(a)) kk.set(a, kk.size); return kk.get(a); };
    const ek = (a, b) => (a < b ? a + ',' + b : b + ',' + a), uc = (a, b, c) => [a, b, c].sort((x, y) => x - y).join(',');
    for (let tur = 0; tur < 4; tur++) {
      const kenar = new Set(), var0 = new Set();
      for (let f = 0; f < secili.length; f += 3) { const [a, b, c] = [kid(secili[f]), kid(secili[f + 1]), kid(secili[f + 2])]; kenar.add(ek(a, b)); kenar.add(ek(b, c)); kenar.add(ek(c, a)); var0.add(uc(a, b, c)); }
      let eklenen = 0;
      for (let f = 0; f < ind.length; f += 3) {
        const [a, b, c] = [kid(ind[f]), kid(ind[f + 1]), kid(ind[f + 2])];
        if (var0.has(uc(a, b, c))) continue;
        const ortak = (kenar.has(ek(a, b)) ? 1 : 0) + (kenar.has(ek(b, c)) ? 1 : 0) + (kenar.has(ek(c, a)) ? 1 : 0);
        if (ortak >= 2 && icinde(ind[f], -0.03) && icinde(ind[f + 1], -0.03) && icinde(ind[f + 2], -0.03)) { secili.push(ind[f], ind[f + 1], ind[f + 2]); var0.add(uc(a, b, c)); eklenen++; }
      }
      if (!eklenen) break;
    }
  }
  // KENAR TEMİZLİĞİ (8 Eki, Sabri: "atletin askıları bozuk"): sınırda iki kenarı açıkta kalan "kulak" üçgenler ve iki
  // ayrı sınır halkasının tek köşede değdiği düğümler kenarı testere dişi yapıyor, kenar şeridi orada kıvrılıp koyu
  // sivrilikler çiziyordu → kulaklar ve düğüme değen üçgenler tur tur ayıklanır (kenar düz halkalara iner).
  {
    const anah0 = j => `${kaynak.getX(j).toFixed(5)},${kaynak.getY(j).toFixed(5)},${kaynak.getZ(j).toFixed(5)}`;
    const kk = new Map(), kid = j => { const a = anah0(j); if (!kk.has(a)) kk.set(a, kk.size); return kk.get(a); };
    for (let tur = 0; tur < 12; tur++) {
      const ks = new Map(), ek = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
      const id = secili.map(kid);
      for (let f = 0; f < id.length; f += 3) for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) { const e = ek(id[f + x], id[f + y]); ks.set(e, (ks.get(e) ?? 0) + 1); }
      const derece = new Map();
      for (const [e, c] of ks) if (c === 1) for (const v of e.split(',')) derece.set(+v, (derece.get(+v) ?? 0) + 1);
      const kalan = []; let at = 0;
      for (let f = 0; f < id.length; f += 3) {
        let acik = 0; for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) if (ks.get(ek(id[f + x], id[f + y])) === 1) acik++;
        const dugum = [0, 1, 2].some(q => (derece.get(id[f + q]) ?? 0) > 2);
        if (acik >= 2 || (dugum && acik >= 1)) { at++; continue; }
        kalan.push(secili[f], secili[f + 1], secili[f + 2]);
      }
      secili.length = 0; secili.push(...kalan);
      if (!at) break;
    }
  }
  const kullanilan = new Set(secili);
  // 8 Eki (Sabri: "atlet vücutla aynı olsun, vücudun dış pikselinden sonra başlasın, kumaşın kalınlığı birkaç piksel
  // olsun"): yüzey derinin normali boyunca SABİT kalınlıkta dışarıda — iç yüzey yumuşatılmaz (şekil vücudu izler);
  // açık kenarlara deriye inen ŞERİT eklenir (kumaşın kalınlığı görünür).
  // etekte şortun bel bandının ÜSTÜNE çıkar (şort orada deriden ~9 mm dışarıda): son 7 cm'de kalınlık 4 → 12 mm
  // etek ek payı şortun bolluğunu izler (bol şortta atlet eteği şortun içine girmesin)
  const KALIN = GY.ustBol ?? 0.004, ETEK = Math.max(0.008, (GY.altBol ?? 0.009) + 0.003 - KALIN);
  // GY.etekUst: kalın etek bölgesinin üst sınırı (ALT_Y'den, m). Kadın gövdesinde göbek çukuru derin: altın bel bandı
  // çukurun üstünden düz geçip atletin dışına taşıyordu (kırmızı boyanan taytla kanıtlandı) → bölge yukarı uzatılır.
  const ETEK_UST = GY.etekUst ?? 0.07;
  const kal = j => KALIN + ETEK * Math.max(0, Math.min(1, (ALT_Y + ETEK_UST - kaynak.getY(j)) / 0.05));
  for (const j of kullanilan) { const k = kal(j); pos.setXYZ(j, kaynak.getX(j) + nor.getX(j) * k, kaynak.getY(j) + nor.getY(j) * k, kaynak.getZ(j) + nor.getZ(j) * k); }
  // kenar halkaları: dikişler kaynaştırılır, halka yalnız kendi boyunca düzlenir (üçgen basamakları gider)
  const anahtar = j => `${kaynak.getX(j).toFixed(5)},${kaynak.getY(j).toFixed(5)},${kaynak.getZ(j).toFixed(5)}`;
  const gr = new Map(), kok = new Int32Array(n);
  for (let j = 0; j < n; j++) { const k = anahtar(j); if (!gr.has(k)) gr.set(k, gr.size); kok[j] = gr.get(k); }
  const G = gr.size, P = new Float32Array(G * 3), temsil = new Int32Array(G).fill(-1), kenarSay = new Map(), yonlu = new Map();
  // ORTAK NORMAL (8 Eki akşam, Sabri: "omuz presinde ön askılarda delikler"): doku dikişinde aynı noktayı paylaşan
  // köşelerin normalleri farklı; her kopya kendi normaliyle itilince kumaş dikişte açılıyor, üçgenler %15'e
  // büzülüp deri görünüyordu (göğüs üstünde simetrik iki çift). Kopyalar AYNI yöne itilir.
  const NG = new Float32Array(G * 3);
  for (const j of kullanilan) { const v = kok[j]; NG[v * 3] += nor.getX(j); NG[v * 3 + 1] += nor.getY(j); NG[v * 3 + 2] += nor.getZ(j); }
  for (let v = 0; v < G; v++) { const l = Math.hypot(NG[v * 3], NG[v * 3 + 1], NG[v * 3 + 2]); if (l > 0) { NG[v * 3] /= l; NG[v * 3 + 1] /= l; NG[v * 3 + 2] /= l; } }
  const nx = j => NG[kok[j] * 3], ny = j => NG[kok[j] * 3 + 1], nz = j => NG[kok[j] * 3 + 2];
  for (const j of kullanilan) { const k = kal(j); pos.setXYZ(j, kaynak.getX(j) + nx(j) * k, kaynak.getY(j) + ny(j) * k, kaynak.getZ(j) + nz(j) * k); }
  for (const j of kullanilan) { const v = kok[j]; P[v * 3] = pos.getX(j); P[v * 3 + 1] = pos.getY(j); P[v * 3 + 2] = pos.getZ(j); if (temsil[v] < 0) temsil[v] = j; }
  for (let f = 0; f < secili.length; f += 3) for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) {
    const a = kok[secili[f + x]], b = kok[secili[f + y]]; if (a === b) continue;
    const k = a < b ? a + ',' + b : b + ',' + a; kenarSay.set(k, (kenarSay.get(k) ?? 0) + 1); yonlu.set(k, [a, b]);
  }
  // kenar ÜÇGENİN SIRASIYLA (a→b) alınır: sıralı anahtardan alınınca şerit dörtgenlerinin yarısı ters yüzle çiziliyordu (koyu kesikler)
  const sinirKenar = [...kenarSay].filter(([, c]) => c === 1).map(([k]) => yonlu.get(k));
  const sinirK = new Map(); for (const [a, b] of sinirKenar) { (sinirK.get(a) ?? sinirK.set(a, new Set()).get(a)).add(b); (sinirK.get(b) ?? sinirK.set(b, new Set()).get(b)).add(a); }
  for (let it = 0; it < 30; it++) for (const l of [0.5, -0.53]) { const Q = P.slice();
    for (const [v, N] of sinirK) { if (N.size !== 2) continue;   // düğüm (ikiden çok kenar) yerinde kalır — çekilince sivrilik oluyordu
      let sx = 0, sy = 0, sz = 0; for (const w of N) { sx += Q[w * 3]; sy += Q[w * 3 + 1]; sz += Q[w * 3 + 2]; }
      const m = N.size; P[v * 3] += l * (sx / m - Q[v * 3]); P[v * 3 + 1] += l * (sy / m - Q[v * 3 + 1]); P[v * 3 + 2] += l * (sz / m - Q[v * 3 + 2]); } }
  // (8 Eki akşam: kenara komşu iki halkayı gevşetmek kaldırıldı — kumaşı derinin kabarık yerine kaydırıp köprücükte
  //  deriyi kumaşın önüne çıkarıyordu; asıl "koyu diş" sebebi deri gizlemesiydi, bkz. aşağıda ÖRTÜLEN ÜÇGEN)
  for (const j of kullanilan) if (sinirK.has(kok[j])) {
    pos.setXYZ(j, P[kok[j] * 3], P[kok[j] * 3 + 1], P[kok[j] * 3 + 2]);
    // halka düzlenince deriye yaklaşmasın: derinin normali boyunca yine tam kalınlık
    const dx = pos.getX(j) - kaynak.getX(j), dy = pos.getY(j) - kaynak.getY(j), dz = pos.getZ(j) - kaynak.getZ(j);
    const nd = dx * nx(j) + dy * ny(j) + dz * nz(j), k2 = kal(j) - nd;
    pos.setXYZ(j, pos.getX(j) + nx(j) * k2, pos.getY(j) + ny(j) * k2, pos.getZ(j) + nz(j) * k2);
  }
  // KENAR AĞIRLIK YUMUŞATMASI (8 Eki akşam): kol yukarıdayken kol oyuğu kenarı basamaklanıyordu — kenar boyunca
  // komşu köşeler farklı oranda kola/köprücüğe bağlı. Yalnız kenar köşelerinin ağırlıkları kenar boyunca ortalanır
  // (deri kenarda zaten çizildiği için kumaş-deri uyumu bozulmaz; iç kumaş derinin ağırlıklarını korur).
  if (!globalThis.__atletAgirlikYok) {
    const csi = geo.attributes.skinIndex, csw = geo.attributes.skinWeight;
    let W = new Map();
    for (const v of sinirK.keys()) { const j = temsil[v], w = new Map(); for (let c = 0; c < 4; c++) { const x = csw.getComponent(j, c); if (x > 0) w.set(csi.getComponent(j, c), (w.get(csi.getComponent(j, c)) ?? 0) + x); } W.set(v, w); }
    for (let it = 0; it < 8; it++) { const Y = new Map();
      for (const [v, N] of sinirK) { const o = new Map(W.get(v)); for (const [b, x] of o) o.set(b, x * 0.5);
        for (const u of N) for (const [b, x] of W.get(u)) o.set(b, (o.get(b) ?? 0) + 0.5 * x / N.size);
        Y.set(v, o); }
      W = Y; }
    for (const j of kullanilan) { const w = W.get(kok[j]); if (!w) continue;
      const en4 = [...w.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4), t = en4.reduce((q, [, x]) => q + x, 0) || 1;
      for (let c = 0; c < 4; c++) { csi.setComponent(j, c, en4[c]?.[0] ?? 0); csw.setComponent(j, c, (en4[c]?.[1] ?? 0) / t); } }
    csi.needsUpdate = csw.needsUpdate = true;
  }
  // KENAR ŞERİDİ: her açık kenar için dış kenardan deriye (kalınlığın %85'i kadar içe) inen dörtgen. Yeni köşeler
  // kenar köşesinin kopyası (aynı deri ağırlıkları) → kumaşla birlikte hareket eder.
  const ekle0 = [...sinirK.keys()], ekIdx = new Map();
  const yeniN = n + ekle0.length, eskiAttr = geo.attributes;
  for (const ad of Object.keys(eskiAttr)) {
    const at = eskiAttr[ad], is = at.itemSize, A = new at.array.constructor(yeniN * is); A.set(at.array.subarray(0, n * is));
    ekle0.forEach((v, q) => { const j = temsil[v]; for (let c = 0; c < is; c++) A[(n + q) * is + c] = at.array[j * is + c]; });
    geo.setAttribute(ad, new T.BufferAttribute(A, is, at.normalized));
  }
  const pos2 = geo.attributes.position;
  ekle0.forEach((v, q) => { const j = temsil[v], i2 = n + q; ekIdx.set(v, i2);
    const d = kal(j) * 0.85; pos2.setXYZ(i2, pos2.getX(j) - nx(j) * d, pos2.getY(j) - ny(j) * d, pos2.getZ(j) - nz(j) * d); });
  const anaUc = secili.length;
  for (const [a, b] of sinirKenar) { const A = temsil[a], B = temsil[b], A2 = ekIdx.get(a), B2 = ekIdx.get(b); secili.push(B, A, A2, B, A2, B2); }
  geo.setIndex(secili);
  if (globalThis.__atletKenarRenk) { geo.addGroup(0, anaUc, 0); geo.addGroup(anaUc, secili.length - anaUc, 1); }
  geo.computeVertexNormals();
  // kaynak köşe: omuz düzeltmeleri (Delta Mush, deltoid) gövdeye SONRA kurulur → atletKopyala aynı değerleri aktarır
  const kaynakIdx = new Int32Array(n + ekle0.length); for (let j = 0; j < n; j++) kaynakIdx[j] = j;
  ekle0.forEach((v, q) => { kaynakIdx[n + q] = temsil[v]; });
  geo.userData.kaynakIdx = kaynakIdx;
  // altta kalan deri çizilmez (şortun gizlemesiyle BİRLEŞİR)
  const gz = govde.geometry.attributes.aGizli?.array ?? new Float32Array(n);
  // 8 Eki: gizleme KUMAŞIN ÖRTTÜĞÜ ÜÇGENLERE bağlı (konum payı 2,5 cm, büyük omuz üçgenlerinde ve ayıklanan kenar
  // üçgenlerinde kumaşın dışına taşıyordu → deri çizilmiyor, kumaş da yok: karanlık zemin siyah diş gibi görünüyordu).
  // Köşe gizlenir ⇔ kendi BÜTÜN üçgenleri kumaşla örtülü.
  {
    const ortulu = new Set(), uc = t => [kok[t[0]], kok[t[1]], kok[t[2]]].sort((x, y) => x - y).join(',');
    for (let f = 0; f < anaUc; f += 3) ortulu.add(uc([secili[f], secili[f + 1], secili[f + 2]]));
    const tam = new Uint8Array(G).fill(1), dokun = new Uint8Array(G), kom = Array.from({ length: G }, () => []);
    for (let f = 0; f < ind.length; f += 3) {
      const t = [ind[f], ind[f + 1], ind[f + 2]], o = ortulu.has(uc(t));
      for (const q of t) { dokun[kok[q]] = 1; if (!o) tam[kok[q]] = 0; }
      for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) kom[kok[t[x]]].push(kok[t[y]]);
    }
    // ⚠️ 8 Eki akşam: bir halka pay, 6 cm'lik askının altında gizli deri bırakmıyordu → omuz presinde deri askıyı
    // deliyordu. Köşe gizlenir ⇔ kendi BÜTÜN üçgenleri örtülü (kenar köşeleri çizilmeye devam eder; arada kalan
    // yarım üçgen de örtülü üçgenin içindedir).
    for (let j = 0; j < n; j++) { const v = kok[j]; if (dokun[v] && tam[v] && (globalThis.__atletHalkaPay ? kom[v].every(w => tam[w]) : true) ) gz[j] = 1; }
  }
  govde.geometry.setAttribute('aGizli', new T.BufferAttribute(gz, 1));
  const nG = geo.attributes.position.count;
  geo.setAttribute('aGizli', new T.BufferAttribute(new Float32Array(nG), 1));
  geo.setAttribute('aUstBolge', new T.BufferAttribute(new Float32Array(nG), 1));
  geo.setAttribute('aBelY', new T.BufferAttribute(new Float32Array(nG).fill(9), 1));
  geo.setAttribute('aDelt', new T.BufferAttribute(new Float32Array(nG * 2), 2));
  geo.setAttribute('aMushI', new T.BufferAttribute(new Float32Array(nG), 1));
  geo.setAttribute('aKolU', new T.BufferAttribute(new Float32Array(nG).fill(0.5), 1));
  // göğüs baskısının koordinatı: dinlenme pozunda (önden bakışta) sol göğse düz izdüşüm; z = dış yüz önde mi
  if (LOGO) { const A = new Float32Array(nG * 3), p = geo.attributes.position, nr = geo.attributes.normal;
    for (let j = 0; j < nG; j++) { A[j * 3] = (p.getX(j) - LOGO.x) / LOGO.en + 0.5; A[j * 3 + 1] = (p.getY(j) - LOGO.y) / LOGO.boy + 0.5; A[j * 3 + 2] = nr.getZ(j) > 0.35 ? 1 : 0; }
    geo.setAttribute('aLogo', new T.BufferAttribute(A, 3)); }
  const u = govde.material.userData.u;
  const mat = govdeMalzemesi(null, null, u.uKasK.value.length, { renk: globalThis.__atletRenk ?? 0x4a5566, kumas: true, logo: !!LOGO, u });
  const m = new T.SkinnedMesh(geo, globalThis.__atletKenarRenk ? [mat, govdeMalzemesi(null, null, u.uKasK.value.length, { renk: 0xff2020, kumas: true, u })] : mat);
  m.customDepthMaterial = mat.userData.derinlik;
  m.bind(govde.skeleton, govde.bindMatrix);
  m.castShadow = true; m.receiveShadow = !!globalThis.__kendiGolge; m.frustumCulled = false;
  return m;
}

/** 8 Eki (Sabri: "atletin askıları bozuk", kol kalkınca deri atletin içinden çıkıyordu): gövdenin omuz düzeltmeleri
 * (Delta Mush ofseti, deltoid kabarması, kas aralığı) atlete de aynı köşe karşılığıyla uygulanır — yoksa kol kalkınca
 * deri düzeltilmiş yere, atlet düzeltilmemiş yere gider ve deri kumaşı deler. */
function atletKopyala(atlet, govde) {
  const k = atlet.geometry.userData.kaynakIdx;
  for (const ad of ['aDelt', 'aMushI', 'aKolU']) {
    const kaynak = govde.geometry.attributes[ad]; if (!kaynak) continue;
    const is = kaynak.itemSize, A = new Float32Array(k.length * is);
    for (let j = 0; j < k.length; j++) for (let c = 0; c < is; c++) A[j * is + c] = kaynak.array[k[j] * is + c];
    atlet.geometry.setAttribute(ad, new T.BufferAttribute(A, is));
  }
}

/** OMUZ AĞIRLIK YUMUŞATMASI (6 Eki, Sabri: "kollar gövdeye yanlış yerden bağlanıyor"): kol gövdeye inince
 * doğrusal deri bağlamada omuz başı katlanıyordu (dar ağırlık geçişi). Omuz ekleminin çevresinde (yarıçap r)
 * köprücük · üst kol · göğüs omurgası ağırlıkları komşu köşelerle tur tur ortalanır → geçiş genişler. */
function agirlikYumusat(mesh, kemikIdx, merkezler, r = 0.11, tur = 10) {
  const geo = mesh.geometry, pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, n = pos.count;
  const anahtar = j => `${pos.getX(j).toFixed(5)},${pos.getY(j).toFixed(5)},${pos.getZ(j).toFixed(5)}`;
  const grup = new Map(), kok = new Int32Array(n);
  for (let j = 0; j < n; j++) { const k = anahtar(j); if (!grup.has(k)) grup.set(k, grup.size); kok[j] = grup.get(k); }
  const G = grup.size, komsu = Array.from({ length: G }, () => new Set()), temsil = new Int32Array(G).fill(-1);
  for (let j = 0; j < n; j++) if (temsil[kok[j]] < 0) temsil[kok[j]] = j;
  const ind = geo.index.array;
  for (let f = 0; f < ind.length; f += 3) for (const [x, y] of [[0, 1], [1, 2], [2, 0]]) {
    const a = kok[ind[f + x]], b = kok[ind[f + y]]; if (a !== b) { komsu[a].add(b); komsu[b].add(a); } }
  const ilgili = new Set(kemikIdx);
  // bölge: merkezlere r içinde ve ilgili kemiklerden en az birine bağlı
  const W = new Map(), maske = new Float32Array(G);
  const p = new T.Vector3();
  for (let v = 0; v < G; v++) {
    const j = temsil[v]; p.fromBufferAttribute(pos, j);
    let dmin = Infinity; for (const m of merkezler) dmin = Math.min(dmin, p.distanceTo(m));
    if (dmin > r) continue;
    const w = new Map(); let ilg = false;
    for (let c = 0; c < 4; c++) { const b = si.getComponent(j, c), x = sw.getComponent(j, c); if (x > 0) { w.set(b, (w.get(b) ?? 0) + x); if (ilgili.has(b)) ilg = true; } }
    if (!ilg) continue;
    W.set(v, w); maske[v] = 1 - (dmin / r) ** 2;                         // merkezde tam, kenarda sıfır etki
  }
  for (let it = 0; it < tur; it++) {
    const yeni = new Map();
    for (const [v, w] of W) {
      const top = new Map(); let say = 0;
      for (const u of komsu[v]) { const wu = W.get(u); if (!wu) continue; say++; for (const [b, x] of wu) top.set(b, (top.get(b) ?? 0) + x); }
      if (!say) { yeni.set(v, w); continue; }
      const k = 0.5 * maske[v], o = new Map();
      for (const b of new Set([...w.keys(), ...top.keys()])) o.set(b, (1 - k) * (w.get(b) ?? 0) + k * (top.get(b) ?? 0) / say);
      yeni.set(v, o);
    }
    for (const [v, w] of yeni) W.set(v, w);
  }
  for (const [v, w] of W) {
    const en4 = [...w.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), t = en4.reduce((a, [, x]) => a + x, 0) || 1;
    for (let j = 0; j < n; j++) if (kok[j] === v) for (let c = 0; c < 4; c++) {
      si.setComponent(j, c, en4[c]?.[0] ?? 0); sw.setComponent(j, c, (en4[c]?.[1] ?? 0) / t); }
  }
  si.needsUpdate = sw.needsUpdate = true;
}

/** DELTA MUSH (7 Eki, lat çekişi tepesi — omuz/koltuk altı katlanması). Mancewicz vd. 2014 (DreamWorks); Maya, Houdini,
 * Unreal'de standart deformasyon katmanı. Doğrusal deri bağlama, kol 160° kalkınca gövdeye ve kola yarı yarıya bağlı
 * köşeleri katlıyordu (ölçüldü: 33 katlanan kenar; ağırlık yumuşatma, köprücüğe aktarma, DQS genişletme çözmedi).
 * Yöntem: dinlenmede bölge yumuşatılır, her köşenin yumuşatılmış yüzeye göre FARKI kendi yerel çerçevesinde saklanır.
 * Her karede bağlanmış deri aynı işleçle yumuşatılır (katlanma kaybolur), fark yerel çerçevede geri eklenir (kas şekli
 * geri gelir). Yalnız omuzların çevresi (r ≤ 19 cm), kenara doğru sönümlü; sonuç küçük bir veri dokusuyla gider. */
function mushKur(mesh, P0, { rHesap = 0.19, rTam = 0.10, rSifir = 0.16, tur = 20, lambda = 0.5 } = {}) {
  const geo = mesh.geometry, pos = geo.attributes.position, n = pos.count, idx = geo.index.array;
  const merk = ['upperarm_l', 'upperarm_r'].map(P0), v = new T.Vector3();
  const anahtar = j => `${pos.getX(j).toFixed(5)},${pos.getY(j).toFixed(5)},${pos.getZ(j).toFixed(5)}`;
  const gid = new Int32Array(n).fill(-1), harita = new Map(), temsil = [], maske = [];
  for (let j = 0; j < n; j++) {
    v.fromBufferAttribute(pos, j);
    let d = Infinity; for (const m of merk) d = Math.min(d, v.distanceTo(m));
    if (d > rHesap) continue;
    const k = anahtar(j); let g = harita.get(k);
    if (g === undefined) {
      g = temsil.length; harita.set(k, g); temsil.push(j);
      maske.push(d <= rTam ? 1 : d >= rSifir ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (d - rTam) / (rSifir - rTam)));
    }
    gid[j] = g;
  }
  const G = temsil.length, komsuK = Array.from({ length: G }, () => new Set()), yuz = [];
  for (let f = 0; f < idx.length; f += 3) {
    const a = gid[idx[f]], b = gid[idx[f + 1]], c = gid[idx[f + 2]];
    for (const [x, y] of [[a, b], [b, c], [c, a]]) if (x >= 0 && y >= 0 && x !== y) { komsuK[x].add(y); komsuK[y].add(x); }
    if (a >= 0 && b >= 0 && c >= 0 && a !== b && b !== c && a !== c) yuz.push(a, b, c);
  }
  const kBas = new Int32Array(G + 1); komsuK.forEach((st, g) => { kBas[g + 1] = kBas[g] + st.size; });
  const kDiz = new Int32Array(kBas[G]); komsuK.forEach((st, g) => { let o = kBas[g]; for (const x of st) kDiz[o++] = x; });
  const yuzD = Int32Array.from(yuz);
  const A = new Float32Array(G * 3), B = new Float32Array(G * 3);
  // aynı işleç dinlenmede ve her karede (yöntemin tutarlılık şartı)
  const yumusat = P => {
    A.set(P);
    for (let it = 0; it < tur; it++) {
      for (let g = 0; g < G; g++) {
        const b0 = kBas[g], b1 = kBas[g + 1], i3 = 3 * g;
        if (b1 === b0) { B[i3] = A[i3]; B[i3 + 1] = A[i3 + 1]; B[i3 + 2] = A[i3 + 2]; continue; }
        let x = 0, y = 0, z = 0;
        for (let o = b0; o < b1; o++) { const q = 3 * kDiz[o]; x += A[q]; y += A[q + 1]; z += A[q + 2]; }
        const c = 1 / (b1 - b0);
        B[i3] = A[i3] + lambda * (x * c - A[i3]);
        B[i3 + 1] = A[i3 + 1] + lambda * (y * c - A[i3 + 1]);
        B[i3 + 2] = A[i3 + 2] + lambda * (z * c - A[i3 + 2]);
      }
      A.set(B);
    }
    return Float32Array.from(A);
  };
  const normaller = Q => {        // alan ağırlıklı köşe normali
    const N = new Float32Array(G * 3);
    for (let f = 0; f < yuzD.length; f += 3) {
      const a = 3 * yuzD[f], b = 3 * yuzD[f + 1], c = 3 * yuzD[f + 2];
      const ux = Q[b] - Q[a], uy = Q[b + 1] - Q[a + 1], uz = Q[b + 2] - Q[a + 2];
      const wx = Q[c] - Q[a], wy = Q[c + 1] - Q[a + 1], wz = Q[c + 2] - Q[a + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      N[a] += nx; N[a + 1] += ny; N[a + 2] += nz; N[b] += nx; N[b + 1] += ny; N[b + 2] += nz; N[c] += nx; N[c + 1] += ny; N[c + 2] += nz;
    }
    for (let g = 0; g < G; g++) { const l = Math.hypot(N[3 * g], N[3 * g + 1], N[3 * g + 2]) || 1; N[3 * g] /= l; N[3 * g + 1] /= l; N[3 * g + 2] /= l; }
    return N;
  };
  const cerceve = (Q, N, g, o) => {  // o ← [t, b, n] (9 sayı): normal + ilk komşuya yönelen teğet
    const nx = N[3 * g], ny = N[3 * g + 1], nz = N[3 * g + 2];
    const q = kBas[g + 1] > kBas[g] ? 3 * kDiz[kBas[g]] : -1;
    let ex = q >= 0 ? Q[q] - Q[3 * g] : 1, ey = q >= 0 ? Q[q + 1] - Q[3 * g + 1] : 0, ez = q >= 0 ? Q[q + 2] - Q[3 * g + 2] : 0;
    const d = ex * nx + ey * ny + ez * nz; ex -= d * nx; ey -= d * ny; ez -= d * nz;
    const l = Math.hypot(ex, ey, ez) || 1; ex /= l; ey /= l; ez /= l;
    o[0] = ex; o[1] = ey; o[2] = ez; o[3] = ny * ez - nz * ey; o[4] = nz * ex - nx * ez; o[5] = nx * ey - ny * ex; o[6] = nx; o[7] = ny; o[8] = nz;
  };
  const P0g = new Float32Array(G * 3);
  temsil.forEach((j, g) => { P0g[3 * g] = pos.getX(j); P0g[3 * g + 1] = pos.getY(j); P0g[3 * g + 2] = pos.getZ(j); });
  const Q0 = yumusat(P0g), N0 = normaller(Q0), fark = new Float32Array(G * 3), F = new Float32Array(9);
  for (let g = 0; g < G; g++) {
    cerceve(Q0, N0, g, F);
    const dx = P0g[3 * g] - Q0[3 * g], dy = P0g[3 * g + 1] - Q0[3 * g + 1], dz = P0g[3 * g + 2] - Q0[3 * g + 2];
    fark[3 * g] = dx * F[0] + dy * F[1] + dz * F[2]; fark[3 * g + 1] = dx * F[3] + dy * F[4] + dz * F[5]; fark[3 * g + 2] = dx * F[6] + dy * F[7] + dz * F[8];
  }
  const ai = new Float32Array(n); for (let j = 0; j < n; j++) if (gid[j] >= 0) ai[j] = gid[j] + 1;   // 0 = bölge dışı
  geo.setAttribute('aMushI', new T.BufferAttribute(ai, 1));
  const satir = Math.ceil(G / MUSH_W) * 2, veri = new Float32Array(MUSH_W * satir * 4);
  const doku = new T.DataTexture(veri, MUSH_W, satir, T.RGBAFormat, T.FloatType);
  doku.minFilter = doku.magFilter = T.NearestFilter; doku.needsUpdate = true;
  return { G, temsil, maske: Float32Array.from(maske), yumusat, normaller, cerceve, fark, doku, veri, sure: null };
}

/** GÖĞÜS AĞIRLIK DÜZELTMESİ (6 Eki): göğsün ön ve iç kısmındaki köşelerin üst kol ağırlığı, köprücük ve
 * göğüs omurgasına aktarılır. Kol başın üstüne çıkınca göğüs üst kolla birlikte düz bir levha gibi çekiliyordu
 * (lat çekişinin tepesi). Gerçekte büyük göğüs kası esner; göğüs kafesi yerinde kalır. */
function gogusAgirlik(mesh, i, P0, oran = 0.6) {
  const geo = mesh.geometry, pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
  const UA = { r: i('upperarm_r'), l: i('upperarm_l') }, CL = { r: i('clavicle_r'), l: i('clavicle_l') }, SP = i('spine_03');
  let say = 0;
  for (let j = 0; j < pos.count; j++) {
    const x = pos.getX(j), t = x < 0 ? 'r' : 'l', om = P0('upperarm_' + t);
    const dx = Math.abs(x) / Math.abs(om.x);                     // 0 orta çizgi … 1 omuz eklemi
    if (dx > 0.82 || pos.getZ(j) < om.z - 0.01 || pos.getY(j) > om.y + 0.04 || pos.getY(j) < om.y - 0.2) continue;
    const etki = oran * Math.min(1, (0.82 - dx) / 0.25);         // omza yaklaştıkça azalır
    for (let c = 0; c < 4; c++) if (si.getComponent(j, c) === UA[t]) {
      const w = sw.getComponent(j, c), al = w * etki; if (al < 1e-3) continue;
      sw.setComponent(j, c, w - al);
      // alınan ağırlığın yarısı köprücüğe, yarısı göğüs omurgasına (varsa mevcut yuvaya eklenir)
      for (const [hedef, pay] of [[CL[t], al * 0.5], [SP, al * 0.5]]) {
        let yer = -1; for (let d = 0; d < 4; d++) if (si.getComponent(j, d) === hedef) yer = d;
        if (yer < 0) { let enAz = 1e9; for (let d = 0; d < 4; d++) if (d !== c && sw.getComponent(j, d) < enAz) { enAz = sw.getComponent(j, d); yer = d; }
          if (sw.getComponent(j, yer) > 0) { sw.setComponent(j, c, sw.getComponent(j, c) + sw.getComponent(j, yer)); } si.setComponent(j, yer, hedef); sw.setComponent(j, yer, 0); }
        sw.setComponent(j, yer, sw.getComponent(j, yer) + pay);
      }
      say++;
    }
  }
  si.needsUpdate = sw.needsUpdate = true;
  return say;
}

/* ── Yükleme ve dinlenme ölçüleri ── */
export async function govdeYukle(url = new URL('./govde-mh/govde.glb', import.meta.url).href, tur = 'C') {
  aktifGiysi = GIYSI_STILI[tur] ?? null;
  const gltf = await new T.GLTFLoader().loadAsync(url);
  let mesh = null;
  gltf.scene.traverse(o => { if (o.isSkinnedMesh && (!mesh || /human/i.test(o.name))) mesh = o; });
  if (!mesh) throw new Error('gövde ağı bulunamadı');
  const sk = mesh.skeleton, adlar = sk.bones.map(b => b.name);
  const i = n => { let j = adlar.indexOf(n); if (j < 0) j = adlar.findIndex(a => a.toLowerCase() === n.toLowerCase()); return j; };
  // Zemin hizalaması: tabanı y = 0'a getir (MakeHuman iskeletinin kökü kalça hizasında, ayaklar −0,85 m'de).
  // Geometri ve bağlama matrisleri BİRLİKTE kaydırılır → deri bağı bozulmaz.
  mesh.updateMatrixWorld(true);
  {
    const pos = mesh.geometry.attributes.position;
    let yMin = Infinity; for (let j = 0; j < pos.count; j++) yMin = Math.min(yMin, pos.getY(j));
    if (Math.abs(yMin) > 1e-4) {
      for (let j = 0; j < pos.count; j++) pos.setY(j, pos.getY(j) - yMin);
      pos.needsUpdate = true; mesh.geometry.computeBoundingBox(); mesh.geometry.computeBoundingSphere();
      const Tm = new T.Matrix4().makeTranslation(0, -yMin, 0);
      sk.boneInverses.forEach((bi, j) => { bi.copy(bi.clone().invert().premultiply(Tm).invert()); });
    }
  }
  const B0 = sk.boneInverses.map(m => m.clone().invert());
  const p0 = B0.map(m => new T.Vector3().setFromMatrixPosition(m));
  const P0 = n => p0[i(n)];
  // menteşe ekseni (üst kol × büküm/ön yönü) dinlenmede hangi uca bakıyorsa o taraf için İÇ (orta hat) +1, dış −1
  const mentIciBel = {};
  const mentIci = t => mentIciBel[t] ??= (() => {
    const a0 = P0('lowerarm_' + t).clone().sub(P0('upperarm_' + t)).normalize(), m0 = new T.Vector3().crossVectors(a0, Z0);
    return Math.sign(m0.x * -Math.sign(P0('upperarm_' + t).x)) || 1; })();
  // 6 Eki: göğüs düzlüğüne etkisi görülmedi (A/B: C ve B, lat çekişi tepesi) → kapalı; kök çözünürlük + doğrusal deri
  if (globalThis.__gogusVar) gogusAgirlik(mesh, i, P0);
  // 6 Eki: omuz ağırlık yumuşatması koltuk altına etkisizdi (A/B ölçüldü), göğse köprücük ağırlığı taşıyordu → kapalı
  if (globalThis.__omuzYumVar) agirlikYumusat(mesh, ['clavicle_l', 'clavicle_r', 'upperarm_l', 'upperarm_r', 'spine_03', 'spine_02'].map(i).filter(j => j >= 0),
    ['upperarm_l', 'upperarm_r'].map(n => P0(n).clone().lerp(P0(n.replace('upperarm', 'clavicle')), 0.25)));
  // Gövde kesiti (göğüs/bel): kolun gövdeye girmemesi için — MODELDEN ölçülür, uydurulmaz
  // SERBEST EL TEMASI (7 Eki, denetim: lunge'da "eller belde" ve baş üstü triceps'te boştaki el yüzeyden ~4 cm uzakta,
  // havada duruyordu — veri eski mankenin ölçüleriyle yazılmış). Tutamak tutmayan ve gövdeye yakın hedeflenen el, avucu
  // yüzeye oturacak şekilde yüzeyin normali boyunca kaydırılır. Yüzey: elin yakınındaki kemiğin (kalça/uyluk/bel)
  // dinlenme köşelerinden, o kemiğin deri matrisiyle; şort altındaki köşeler kumaş kalınlığı kadar dışarıda sayılır.
  let TEMAS = null;
  const temasKur = () => {
    const pos = mesh.geometry.attributes.position, nor = mesh.geometry.attributes.normal, si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    const gz = mesh.geometry.attributes.aGizli, gruplar = {};
    // her köşe EN ÇOK bağlı olduğu kemiğe (bel/kalça yanı karışık ağırlıklı — %60 eşiği onları dışarıda bırakıyordu)
    const hedefler = new Set(['pelvis', 'spine_01', 'spine_02', 'thigh_l', 'thigh_r'].map(i).filter(j => j >= 0));
    for (const j of hedefler) gruplar[j] = [];
    for (let k = 0; k < pos.count; k++) {
      let bj = -1, bw = 0; for (let c = 0; c < 4; c++) { const w = sw.getComponent(k, c); if (w > bw) { bw = w; bj = si.getComponent(k, c); } }
      if (!hedefler.has(bj) || bw < 0.35) continue;
      gruplar[bj].push([pos.getX(k), pos.getY(k), pos.getZ(k), nor.getX(k), nor.getY(k), nor.getZ(k), gz?.getX(k) ? 0.012 : 0]);
    }
    return gruplar;
  };
  const _tm = new T.Matrix4(), _ti = new T.Matrix4(), _tv = new T.Vector3(), _tp = new T.Vector3(), _tn = new T.Vector3();
  // 17 Eki (Y1): yüzey artık EN YAKIN TEK KÖŞE değil, elin 7 cm çevresindeki köşelerin (tüm kemik gruplarından, dünya uzayında)
  // ağırlıklı düzlemi; temas noktası elin o düzleme izdüşümü. ⚠️ En yakın köşe değişince (lunge'da beldeki el, kalça↔bel
  // grubu) yüzey 2,6 cm sıçrıyor, ön kol 20°, el 30° dönüyordu (ölçüldü). Ağırlık elin uzaklığıyla sürekli azalır.
  function elTemas(e) {
    if (globalThis.__elTemasYok) return null;
    TEMAS ??= temasKur();
    const R2 = 0.0049, c = new T.Vector3(), n = new T.Vector3(); let W = 0, kal = 0;
    for (const j in TEMAS) {
      _tm.multiplyMatrices(sk.bones[j].matrixWorld, sk.boneInverses[j]); _ti.copy(_tm).invert();
      _tv.copy(e).applyMatrix4(_ti);                                  // el, kemiğin dinlenme uzayında (m)
      for (const v of TEMAS[j]) {
        const dx = _tv.x - v[0], dy = _tv.y - v[1], dz = _tv.z - v[2], d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= R2) continue;
        const w = (1 - d2 / R2) ** 2;
        c.addScaledVector(_tp.set(v[0], v[1], v[2]).applyMatrix4(_tm), w);
        n.addScaledVector(_tn.set(v[3], v[4], v[5]).transformDirection(_tm), w);
        kal += v[6] * w; W += w;
      }
    }
    if (W < 0.5 || n.lengthSq() < 1e-8) return null;
    c.multiplyScalar(1 / W); n.normalize();
    const kalin = K * kal / W;
    const yan = e.clone().sub(c).dot(n) - kalin;                     // hedefin yüzeyden yüksekliği (cm)
    if (yan < -4 || yan > 6) return null;
    const yuzey = e.clone().addScaledVector(n, -yan);                // elin yüzeye izdüşümü
    return { yuzey, n };
  }
  const GOVDE_KESIT = (() => {
    const pos = mesh.geometry.attributes.position, si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    const SP = ['spine_01', 'spine_02', 'spine_03'].map(i);
    let xMax = 0, zMin = 9, zMax = -9;
    for (let j = 0; j < pos.count; j++) {
      let w = 0; for (let c = 0; c < 4; c++) if (SP.includes(si.getComponent(j, c))) w += sw.getComponent(j, c);
      if (w < 0.6) continue;
      xMax = Math.max(xMax, Math.abs(pos.getX(j))); zMin = Math.min(zMin, pos.getZ(j)); zMax = Math.max(zMax, pos.getZ(j));
    }
    return { yariEn: K * xMax, yariDerin: K * (zMax - zMin) / 2, merkezOn: K * ((zMax + zMin) / 2) };
  })();
  mesh.material = govdeMalzemesi(mesh.material?.normalMap ?? null, mesh.material?.normalScale?.clone() ?? null, sk.bones.length);
  mesh.customDepthMaterial = mesh.material.userData.derinlik;
  if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
  // 7 Eki: gövde kendi üstüne gölge ALMAZ (yere düşürür): kol/makine omuz başında keskin kenarlı açık lekeler bırakıyordu
  // (ters fly, ölçüldü: gölge kapalıyken kayboluyor). Kil görünümlü stilize karakterlerde yaygın tercih.
  mesh.castShadow = true; mesh.receiveShadow = !!globalThis.__kendiGolge; mesh.frustumCulled = false;
  if (globalThis.__deriGizle) mesh.material.colorWrite = false;   // TANI: yalnız giysiler
  mesh.removeFromParent();                       // kemikler sahnede değil: dünya matrislerini BİZ yazarız
  const nesne = new T.Group(); nesne.add(mesh);
  // GY (mokap): belUst = taytın yüksek beli · atletAlt = atletin kısa kesimi — yoksa bugünkü değerler
  const GY = giysiAyari();
  // paça baskısı (17 Eki, Sabri: "sol paçanın dışa bakan yanına; kadınlarda Leo'nun logo yüksekliği"; 2. tur: "%30 büyüt,
  // paçanın bitiminden 6 cm yukarı"; 3. tur: "%20 büyüt, 2 cm aşağı, sol kenara değil ~30° öne doğru"): en atletteki logonun
  // %60'ı × 1,3 × 1,2 (7,5 cm); ALT kenarı paça kenarının 4 cm üstünde; bacağın dış yanından 30° önde. Taytta (paça
  // bilekte) yükseklik Leo'nun şortundan — iskelet dördünde aynı, aynı formül aynı yüksekliği verir
  const pacaOf = oran => P0('thigh_r').y - oran * (P0('thigh_r').y - P0('calf_r').y);
  const PACA_Y = GY.pacaBilek != null ? P0('foot_r').y + GY.pacaBilek : pacaOf(GY.pacaOran ?? 0.55);
  const solX = Math.sign(P0('clavicle_l').x) || 1, PACA_LOGO_EN = 0.08 * 0.6 * 1.3 * 1.2, PACA_LOGO_BOY = PACA_LOGO_EN * 360 / 620;
  const pacaLogoY = (GY.pacaBilek != null ? pacaOf(0.55) : PACA_Y) + 0.04 + PACA_LOGO_BOY / 2;
  const sort = sortKur(mesh, { BEL_Y: P0('spine_01').y + (GY.belUst ?? 0.03),   // GY.belUst: yüksek bel (tayt)
    PACA_Y, LOGO: globalThis.__logoYok ? null : { y: pacaLogoY, solX, on: 30, en: PACA_LOGO_EN, boy: PACA_LOGO_BOY } }); nesne.add(sort);
  sort.userData.giysi = 'alt';
  // göğüs baskısı (17 Eki): sporcunun SOL göğsü — model ön yüzü +z; sol taraf 'clavicle_l'nin x işaretinden. Ortası gövde
  // ortasından 8 cm yanda, omuz ekleminin ~11 cm altında; en 8 cm (gerçek tişört göğüs baskısı 7–9 cm). en işaretli:
  // önden bakışta sporcunun solu izleyenin sağıdır, logo izleyene düz okunsun
  const LOGO_EN = 0.08;
  const atlet = globalThis.__atletYok ? null : atletKur(mesh, { ALT_Y: P0('spine_01').y + (GY.atletAlt ?? -0.03), KOLTUK_Y: P0('upperarm_r').y - 0.15,
    OMUZ_Y: P0('upperarm_r').y + 0.04, BOYUN_Y: P0('neck_01').y,
    LOGO: globalThis.__logoYok ? null : { x: solX * (globalThis.__logo?.yan ?? 0.08), y: P0('upperarm_l').y - (globalThis.__logo?.asagi ?? 0.11), en: LOGO_EN, boy: LOGO_EN * 360 / 620 } });
  if (atlet && !globalThis.__atletGorunmez) { atlet.userData.giysi = 'ust'; nesne.add(atlet); }
  const sac = SAC_STILI[tur] ? sacKur(mesh, { ...SAC_STILI[tur], ...(globalThis.__sac?.[tur] ?? {}) }) : null;   // __sac: mokap denemesi (14 Eki)
  if (sac) nesne.add(sac);
  // YÜZ AYRINTISI (14 Eki, DENEME — yalnız globalThis.__yuz ile; mokapta Sabri seçecek): göz küresi, kaş, göz çizgisi, dudak
  const yuz = globalThis.__yuz ? yuzKur(mesh, { ...(YUZ_STILI[tur] ?? YUZ_STILI.C), ...globalThis.__yuz }) : null;
  if (yuz) for (const o of yuz) nesne.add(o);

  for (const b of sk.bones) { b.matrixAutoUpdate = false; b.matrixWorldAutoUpdate = false; }

  // El dinlenme çerçevesi MODELDEN ölçülür (MakeHuman A-poz: eğik; sabit eksen varsayılmaz):
  //   parmak = el → orta parmak kökü · çapraz = serçe → işaret kökü · avuç = parmak × çapraz, işareti parmakların
  //   kıvrıldığı yöne (orta parmak ucunun parmak doğrusundan sapması) ya da modelin önüne göre
  const EL0 = {};
  for (const t of ['r', 'l']) {
    const el = P0('hand_' + t), m1 = P0('middle_01_' + t);
    const parmak = m1.clone().sub(el).normalize();
    const capraz = P0('index_01_' + t).clone().sub(P0('pinky_01_' + t)).normalize();
    let avuc = new T.Vector3().crossVectors(parmak, capraz).normalize();
    const uc = P0('middle_03_' + t);
    const sapma = uc ? dikBilesen(uc.clone().sub(m1), parmak) : new T.Vector3();
    const isaret = sapma.length() > 0.004 ? Math.sign(sapma.dot(avuc)) : -Math.sign(avuc.z || 1);
    avuc.multiplyScalar(isaret || 1);
    EL0[t] = { parmak, avuc, capraz: new T.Vector3().crossVectors(avuc, parmak).normalize() };
  }
  const temasDurum = {};
  const AVUC_BOY = K * P0('hand_r').distanceTo(P0('middle_01_r')) * 0.55;   // bilek → avuç merkezi
  // ── KAVRAMA POZU: parmaklar barın çevresine SARILIR (6 Eki) ─────────────────────────────────────────────
  // Sabit açılarla kıvırmak (50/75/55°) parmak boyu farklı gövdelerde bara oturmuyordu: C'de uçlar bardan 8–10 cm
  // uzakta halka çiziyordu (ölçüldü). Endüstri yöntemi: her eklem, bir SONRAKİ eklem (ya da parmak ucu) bar
  // yüzeyine (yarıçap + parmak kalınlığının yarısı) değene kadar kıvrılır → her gövdede, her bar kalınlığında doğru.
  // Bar, dinlenme (bağlama) uzayında: avucun içinden, parmaklar arası yönde geçen bir eksen.
  // Kavrama pozu tutamağın KALINLIĞINA göre kurulur (6 Eki): sabit Ø29 mm ile kalın direkte (calf) parmaklar
  // havada kalıyordu. Yarıçap 0,5 cm adımlarla önbellekte; ilk kullanımda hesaplanır.
  const kavramaOnbellek = new Map();
  const RAHAT = { r: new Map(), l: new Map() };
  const kavramaKur = BAR_R => {
    const anahtar = Math.round(BAR_R * 200) / 200;
    if (kavramaOnbellek.has(anahtar)) return kavramaOnbellek.get(anahtar);
    const kavrama = { r: new Map(), l: new Map() };
    const KAVRAMA0 = {}, BAR0 = {};
    // PARMAKLAR BİTİŞİK (Sabri, 6 Eki 20:35: "kavrarken 4 parmak birbirine bitişik olmalı"): MakeHuman dinlenme
    // pozunda parmaklar yelpaze gibi açık. Kıvırmadan önce her parmak, avuç normali ekseninde kendi kökü
    // etrafında ORTA parmağa paralel döndürülür (işaret ve serçe tarafı hafif içe: %100 adduksiyon).
    const bitistir = (p, t, avuc) => {
      if (p === 'middle') return null;
      const k1 = P0(`${p}_01_${t}`), k2 = P0(`${p}_02_${t}`), m1 = P0(`middle_01_${t}`), m2 = P0(`middle_02_${t}`);
      if (!k1 || !k2 || !m1 || !m2) return null;
      const dp = dikBilesen(k2.clone().sub(k1), avuc).normalize(), dm = dikBilesen(m2.clone().sub(m1), avuc).normalize();
      const aci = Math.atan2(new T.Vector3().crossVectors(dp, dm).dot(avuc), dp.dot(dm));
      return new T.Matrix4().makeTranslation(k1.x, k1.y, k1.z).multiply(new T.Matrix4().makeRotationAxis(avuc, aci))
        .multiply(new T.Matrix4().makeTranslation(-k1.x, -k1.y, -k1.z));
    };
    const PARMAK_YARI = 0.009;
    const eksenUzak = (q, A, u) => { const d = q.clone().sub(A); return d.sub(u.clone().multiplyScalar(d.dot(u))).length(); };
    const sar = (adlarZ, t, A, u, ilkEksen, kivirEksen, hedefR, sinir, onDonus = null) => {
      const zincir = adlarZ.map(i).filter(j => j >= 0); if (zincir.length < 2) return;
      const Mz = zincir.map(j => B0[j].clone()), poz = q => new T.Vector3().setFromMatrixPosition(Mz[q]);
      if (onDonus) for (const m of Mz) m.premultiply(onDonus);
      // son eklemden sonraki "uç": yaprak kemik yoksa son segment yönünde, onun 0,85 katı boyda
      const uc = () => { const n = Mz.length, a2 = poz(n - 2), a3 = poz(n - 1);
        return a3.clone().add(a3.clone().sub(a2).multiplyScalar(0.85)); };
      const sonEklem = adlarZ.length === zincir.length ? Mz.length - 1 : Mz.length;  // yaprak varsa son kemik uçtur
      for (let j = 0; j < sonEklem; j++) {
        const pv = poz(j), eks = j === 0 && ilkEksen ? ilkEksen : kivirEksen;
        const sonraki = () => (j + 1 < Mz.length ? poz(j + 1) : uc());
        const dondur = aci => new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z)
          .multiply(new T.Matrix4().makeRotationAxis(eks, aci)).multiply(new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z));
        const nk = sonraki(); let enIyi = 0, enD = Infinity;
        for (let aci = 0; aci <= sinir[j] * Math.PI / 180 + 1e-9; aci += Math.PI / 90) {
          const d = Math.abs(eksenUzak(nk.clone().applyMatrix4(dondur(aci)), A, u) - hedefR);
          if (d < enD - 1e-5) { enD = d; enIyi = aci; }
          if (eksenUzak(nk.clone().applyMatrix4(dondur(aci)), A, u) <= hedefR) { enIyi = aci; break; }
        }
        const D = dondur(enIyi);
        for (let q = j; q < Mz.length; q++) Mz[q].premultiply(D);
      }
      zincir.forEach((j, q) => kavrama[t].set(j, Mz[q]));
    };
    for (const t of ['r', 'l']) {
      const { parmak, avuc } = EL0[t], capraz = EL0[t].capraz.clone();   // kopya: bilek ölçümü dik çaprazı kullanır
      // Bar ekseni: orta parmak kökünün avuç tarafında (bar yarıçapı + avuç dokusu ~1,2 cm), bileğe doğru 1 cm
      // Bar avuç İÇİNDE, parmak köklerinin ~2,5 cm gerisinde (avuç çizgisi) ve hafif ÇAPRAZ: işaret kökünden serçe
      // tarafında avuç kenarına (15°). Kök hizasında olunca başparmak kökü bara 7–8,5 cm uzak kalıp ulaşamıyordu (ölçüldü).
      const A = P0('middle_01_' + t).clone().addScaledVector(avuc, BAR_R + 0.012).addScaledVector(parmak, -0.025);
      KAVRAMA0[t] = A;
      {
        // işaret → serçe yönü, bileğe doğru 15° eğilir (serçe tarafı daha geride)
        const s0 = Math.sign(capraz.dot(P0('index_01_' + t).clone().sub(P0('pinky_01_' + t)))) || 1;
        const ip = capraz.clone().multiplyScalar(-s0);
        ip.multiplyScalar(Math.cos(15 * Math.PI / 180)).addScaledVector(parmak, -Math.sin(15 * Math.PI / 180)).normalize();
        capraz.copy(ip.multiplyScalar(-s0));
      }
      BAR0[t] = capraz.clone();
      const eks = new T.Vector3().crossVectors(parmak, avuc).normalize();
      const kivir = parmak.clone().applyAxisAngle(eks, 0.3).dot(avuc) > 0 ? eks : eks.clone().negate();
      // (3) DİNLENEN EL (Sabri: "boştaki el gergin, parmaklar açık"): parmaklar bitişik ve eklem başına
      //     12–22° hafif kıvrık (rahat el) — bir kez kurulur, bar kalınlığından bağımsız.
      if (!RAHAT[t].size) for (const p of ['index', 'middle', 'ring', 'pinky']) {
        const zincir = ['01', '02', '03', '04_leaf'].map(n => i(`${p}_${n}_${t}`)).filter(j => j >= 0);
        const Mz = zincir.map(j => B0[j].clone()), b = bitistir(p, t, avuc);
        if (b) for (const m of Mz) m.premultiply(b);
        [14 + (p === 'pinky' ? 6 : 0), 22, 12].forEach((aci, j) => {
          if (j >= Mz.length - (zincir.length === 4 ? 1 : 0)) return;
          const pv = new T.Vector3().setFromMatrixPosition(Mz[j]);
          const D = new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z).multiply(new T.Matrix4().makeRotationAxis(kivir, aci * Math.PI / 180))
            .multiply(new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z));
          for (let q = j; q < Mz.length; q++) Mz[q].premultiply(D);
        });
        zincir.forEach((j, q) => RAHAT[t].set(j, Mz[q]));
      }
      for (const p of ['index', 'middle', 'ring', 'pinky'])
        sar(['01', '02', '03', '04_leaf'].map(n => `${p}_${n}_${t}`), t, A, capraz, null, kivir, BAR_R + PARMAK_YARI, [90, 110, 90], bitistir(p, t, avuc));
      // Başparmak (6 Eki, Sabri: "başparmaklar ters/yanlış yöne bakıyor"): güç kavramasında başparmak barın ÖBÜR
      // yüzünden gelip işaret parmağının orta boğumunun üstüne kapanır. Sargı çözücüsü burada işe yaramıyor (başparmak
      // zaten bara yakın başladığı için hiç dönmüyordu, ölçüldü) → üç eklem açısı ızgarada aranır:
      //   amaç = uç ↔ hedef (işaret 02 eklemi, bardan dışarı 1 cm) · ceza = başparmak barın içine girerse
      const b1 = P0('thumb_01_' + t), b2 = P0('thumb_02_' + t);
      if (b1 && b2) {
        const zincir = ['01', '02', '03', '04_leaf'].map(n => i(`thumb_${n}_${t}`)).filter(j => j >= 0);
        const uc3 = P0('thumb_03_' + t) ?? b2;
        const yan = dikBilesen(uc3.clone().sub(P0('hand_' + t)), parmak);
        const bkiv = yan.clone().applyAxisAngle(parmak, 0.3).dot(avuc) > yan.dot(avuc) ? parmak.clone() : parmak.clone().negate();
        const bd = b2.clone().sub(b1).normalize(), beks = new T.Vector3().crossVectors(bd, avuc).normalize();
        const bkivir = bd.clone().applyAxisAngle(beks, 0.3).dot(avuc) > 0 ? beks : beks.clone().negate();
        // Dinlenen elde başparmak: avuca doğru 25° yaklaşır, eklemleri 15° kıvrılır (dışarı açık kalmasın)
      if (!RAHAT[t].has(zincir[0])) {
        const Mz = zincir.map(j => B0[j].clone());
        [[0, bkiv, 25], [0, bkivir, 10], [1, bkivir, 15], [2, bkivir, 12]].forEach(([j, eks, aci]) => {
          if (j >= Mz.length) return;
          const pv = new T.Vector3().setFromMatrixPosition(Mz[j]);
          const D = new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z).multiply(new T.Matrix4().makeRotationAxis(eks, aci * Math.PI / 180))
            .multiply(new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z));
          for (let q = j; q < Mz.length; q++) Mz[q].premultiply(D);
        });
        zincir.forEach((j, q) => RAHAT[t].set(j, Mz[q]));
      }
      const i2 = kavrama[t].get(i('index_02_' + t)), ip = i2 ? new T.Vector3().setFromMatrixPosition(i2) : P0('index_02_' + t);
        const disari = dikBilesen(ip.clone().sub(A), capraz).normalize();
        const hedef = ip.clone().addScaledVector(disari, 0.004);
        const kur = (a1, a2, a3, a0 = 0) => {
          const Mz = zincir.map(j => B0[j].clone()), poz = q => new T.Vector3().setFromMatrixPosition(Mz[q]);
          // a0: başparmağın avuç düzleminde açılması (abdüksiyon, avuç normali ekseni) — karşıt kavramanın ikinci serbestliği
          if (a0) { const pv = poz(0), D = new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z).multiply(new T.Matrix4().makeRotationAxis(avuc, a0))
            .multiply(new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z)); for (const m of Mz) m.premultiply(D); }
          [[0, bkiv, a1], [1, bkivir, a2], [2, bkivir, a3]].forEach(([j, eks, aci]) => {
            if (j >= Mz.length) return;
            const pv = poz(j), D = new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z)
              .multiply(new T.Matrix4().makeRotationAxis(eks.clone().applyMatrix4(new T.Matrix4().extractRotation(j ? Mz[0].clone().multiply(B0[zincir[0]].clone().invert()) : new T.Matrix4())).normalize(), aci))
              .multiply(new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z));
            for (let q = j; q < Mz.length; q++) Mz[q].premultiply(D);
          });
          const n = Mz.length, a2p = poz(n - 2), a3p = poz(n - 1);
          const ucN = zincir.length === 4 ? a3p : a3p.clone().add(a3p.clone().sub(a2p).multiplyScalar(0.85));
          let ceza = 0;
          for (const q of [...Mz.map((_, k) => poz(k)).slice(1), ucN]) { const d = eksenUzak(q, A, capraz); if (d < BAR_R + 0.006) ceza += (BAR_R + 0.006 - d) * 40; }
          return { Mz, deger: ucN.distanceTo(hedef) + ceza };
        };
        let en = null;
        const R = Math.PI / 180;
        // Eklem eksenlerinin işareti modelden modele değişebilir (B'de büküm ekseni ters çıktı, başparmak dik kaldı) →
        // her açı İKİ yönde aranır; ceza terimi bara giren çözümleri eler
        for (let a0 = -40; a0 <= 60; a0 += 20) for (let a1 = -60; a1 <= 120; a1 += 15)
          for (let a2 = -90; a2 <= 90; a2 += 15) for (let a3 = -90; a3 <= 90; a3 += 15) {
            const r = kur(a1 * R, a2 * R, a3 * R, a0 * R); if (!en || r.deger < en.deger) { en = r; en.acilar = [a0, a1, a2, a3]; }
          }
        zincir.forEach((j, q) => kavrama[t].set(j, en.Mz[q]));
        (globalThis.__basparmak ??= {})[t] = { acilar: en.acilar, deger: +en.deger.toFixed(4), hedefBar: +eksenUzak(hedef, A, capraz).toFixed(4), basBar: +eksenUzak(b1, A, capraz).toFixed(4), b1Hedef: +b1.distanceTo(hedef).toFixed(4) };
      }
    }
    (globalThis.__basparmakR ??= {})[anahtar] = globalThis.__basparmak;
    const o = { kavrama, KAVRAMA0, BAR0 }; kavramaOnbellek.set(anahtar, o); return o;
  };
  kavramaKur(0.0145);
  // Bilekten avuçtaki kavrama noktasına uzaklık (cm, sağ el; simetrik) — kol IK'sı bu boyla kurulur
  const EL_OFSET = K * P0('hand_r').distanceTo(kavramaKur(0.0145).KAVRAMA0.r) * 0.95;

  const kalcaMerkez0 = P0('thigh_l').clone().add(P0('thigh_r')).multiplyScalar(0.5);
  // Gövde en ölçeği: model omuz eklemi ±21,2 cm, verideki omuz ±14 cm. Tam oran (0,66) gövdeyi çöp gibi
  // yapar; 0,8 göğsü mankenin göğüs elipsine (yarı en 14,6) yaklaştırır — ölçülen bant: 1,40 m'de 19,3 → 15,4
  // MakeHuman: göğüs yarı eni ölçülür, mankenin göğüs elipsine (14,6 cm) yaklaştırılır; en çok %20 daraltma
  const GOVDE_EN = 1;   // 6 Eki: kollar modelin omzundan çıktığı için gövde daraltılmaz
  GOVDE_KESIT.yariEn *= GOVDE_EN;
  const govdeBoy0 = P0('neck_01').y - kalcaMerkez0.y;
  const GOVDE = ['root', 'pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01'].map(i).filter(j => j >= 0);
  const elAltindakiler = t => adlar.map((n, j) => (/^(index|middle|ring|pinky|thumb)_/.test(n) && n.endsWith('_' + t)) ? j : -1).filter(j => j >= 0);
  const ayakAltindakiler = t => [i('ball_' + t), i('ball_leaf_' + t)].filter(j => j >= 0);
  // parmak altı: parmak kemiğine bağlı köşelerden dinlenmede tabana en yakın olanlar (en alttan 1,2 cm) — büküm temas sınaması için
  const _pv = new T.Vector3();
  const PARMAK_ALTI = (() => {
    const pos = mesh.geometry.attributes.position, si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, o = {};
    for (const t of ['r', 'l']) {
      const js = new Set(ayakAltindakiler(t)), aday = [];
      for (let q = 0; q < pos.count; q++) {
        let w = 0; for (let c = 0; c < 4; c++) if (js.has(si.getComponent(q, c))) w += sw.getComponent(q, c);
        if (w >= 0.6) aday.push(new T.Vector3(pos.getX(q), pos.getY(q), pos.getZ(q)));
      }
      const enAlt = Math.min(...aday.map(v => v.y)), enUst = Math.max(...aday.map(v => v.y));
      o[t] = aday.filter(v => v.y < enAlt + 0.012);
      o['ust' + t] = aday.filter(v => v.y > enUst - 0.012);          // parmak SIRTI (ayak sırtı yüzeydeyken temas eden taraf)
    }
    return o;
  })();
  const AYAK_TABAN0 = P0('foot_r').y;            // ayak kemiği tabandan 8,6 cm yukarıda (×K)
  const AYAK_TABAN_BIZ = M.AYAK_Y;               // B1: verinin ayak bileği C ölçüsünde (olcu.js · ayakBilek), eskiden 3,6
  const yaz = (j, A, kaynak = B0[j]) => sk.bones[j].matrixWorld.multiplyMatrices(A, kaynak);
  /** DÜZ AVUÇ (14 Eki, şınav): dinlenme pozunda başparmak avucun altına sarkıyor (yerin 5,9 cm altı) ve parmak uçları avucun
   *  1–1,3 cm altına kıvrık (ölçüldü) → her parmak zinciri kökü etrafında AVUÇ DÜZLEMİNE döndürülür (dinlenme uzayında bir kez). */
  const DUZ_EL = {};
  // iki duruş matrisinin arası (konum doğrusal, dönme küresel) — yarı gevşek el için
  const _ka = [new T.Vector3(), new T.Quaternion(), new T.Vector3()], _kb = [new T.Vector3(), new T.Quaternion(), new T.Vector3()];
  const matrisKaris = (A, B, w) => { A.decompose(..._ka); B.decompose(..._kb);
    return new T.Matrix4().compose(_ka[0].clone().lerp(_kb[0], w), _ka[1].clone().slerp(_kb[1], w), _ka[2].clone().lerp(_kb[2], w)); };
  const duzParmak = (p, t) => DUZ_EL[p + t] ??= (() => {
    const a = P0(p + '_01_' + t), c = P0(p + '_03_' + t), v = c.clone().sub(a), n = EL0[t].avuc.clone().normalize();
    // parmaklar avuç düzleminden ~7° yere doğru (uçlar yere değer; tam düzlemde 1–1,4 cm havada kalıyordu); başparmak düzlemde
    const hedef = dikBilesen(v, n).normalize().addScaledVector(n, p === 'thumb' ? 0 : -0.12).normalize(), q = new T.Quaternion().setFromUnitVectors(v.clone().normalize(), hedef);
    return new T.Matrix4().makeTranslation(a.x, a.y, a.z).multiply(new T.Matrix4().makeRotationFromQuaternion(q)).multiply(new T.Matrix4().makeTranslation(-a.x, -a.y, -a.z));
  })();
  // ── DQS (7 Eki, Sabri: "kol hareket ettikçe omuz–kol bağlantısı çok inceliyor") ────────────────────────────
  // Ölçüldü: doğrusal deri bağlamada omuz eklemi kesiti %78–83'e, dirsek %66–77'ye iniyordu (hacim kaybı).
  // Çift kuaterniyon hacmi korur. Deri matrisi A = T·R·S·K·T(−p0): uniform K ön ölçek olarak, R kuaterniyon,
  // öteleme eklem noktasında birebir tutacak biçimde t = A·p0 − R·(K·p0). YALNIZ kol kemikleri (ölçeksiz);
  // bacaklar veriye göre uzatıldığı için (S ≠ 1) doğrusal kalır. Köşe başına karışım = kol ağırlıkları toplamı.
  const DQU = mesh.material.userData.u;
  {
    // aDelt: omuz eklemine yakın (≤ 13 cm, kademeli) ve üst kola/köprücüğe bağlı köşeler — dinlenme pozunda
    const pos = mesh.geometry.attributes.position, si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    const dl = new Float32Array(pos.count * 2), v = new T.Vector3();
    ['r', 'l'].forEach((t, sd) => {
      const om = P0('upperarm_' + t), dr = P0('lowerarm_' + t), ax = dr.clone().sub(om).normalize();
      const kemik = ['upperarm_' + t, 'clavicle_' + t].map(i);
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k);
        let w = 0; for (let c = 0; c < 4; c++) if (kemik.includes(si.getComponent(k, c))) w += sw.getComponent(k, c);
        if (w < 0.15) continue;
        const u = v.clone().sub(om).dot(ax);                         // kol boyunca: −4 … +11 cm aralığı (deltoid)
        if (u < -0.06 || u > 0.14) continue;
        const r = v.clone().sub(om).sub(ax.clone().multiplyScalar(u)).length();
        // 1. sürüm yarıçapla da süzüyordu (r < 6 cm) → deltoid yüzeyinin çoğu dışarıda kalmıştı (298 köşe, etki görünmedi)
        const f = Math.max(0, 1 - Math.abs(u - 0.04) / 0.10) * Math.min(1, w) * (r < 0.13 ? 1 : 0);
        dl[k * 2 + sd] = Math.max(dl[k * 2 + sd], f);
      }
    });
    mesh.geometry.setAttribute('aDelt', new T.BufferAttribute(dl, 2));
    // aKolU: üst kola bağlı köşenin kol boyunca konumu (0 omuz eklemi, 1 dirsek) — kas vurgusu aralığı için
    const ku = new Float32Array(pos.count).fill(0.5);
    ['r', 'l'].forEach(t => {
      const om = P0('upperarm_' + t), dr = P0('lowerarm_' + t), ax = dr.clone().sub(om), L = ax.length(); ax.normalize();
      const ua = i('upperarm_' + t);
      for (let k = 0; k < pos.count; k++) {
        let w = 0; for (let c = 0; c < 4; c++) if (si.getComponent(k, c) === ua) w += sw.getComponent(k, c);
        if (w < 0.01) continue;
        v.fromBufferAttribute(pos, k); ku[k] = v.clone().sub(om).dot(ax) / L;
      }
    });
    mesh.geometry.setAttribute('aKolU', new T.BufferAttribute(ku, 1));
  }
  const MUSH = mushKur(mesh, P0, globalThis.__mushAyar ?? {});
  if (atlet && !globalThis.__atletKopyaYok) atletKopyala(atlet, mesh);
  // 7 Eki: köprücük/üst gövdeye genişletmek denendi — lat tepesi katlanma 33→26 ama omuz şişti (gerilen üçgen 76→142); Delta Mush seçildi
  const DQ_DESEN = /^(upperarm|lowerarm|hand|index|middle|ring|pinky|thumb)_/i;
  adlar.forEach((n, j) => { DQU.uDqMaske.value[j] = DQ_DESEN.test(n) ? 1 : 0; });
  DQU.uDqK.value = K;
  const _A = new T.Matrix4(), _p = new T.Vector3(), _q = new T.Quaternion(), _s = new T.Vector3(), _t = new T.Vector3();
  const _bi = sk.boneInverses.map(m => m.clone());
  const dqGuncelle = () => {
    if (globalThis.__dqKapali) { DQU.uDqAcik.value = 0; return; }
    DQU.uDqAcik.value = 1;
    for (let j = 0; j < sk.bones.length; j++) {
      // TÜM kemikler hesaplanır: omuz köşesi kol + köprücük + omurga karışımıdır; maske yalnız karışım ORANI
      _A.multiplyMatrices(sk.bones[j].matrixWorld, _bi[j]);
      _A.decompose(_p, _q, _s);
      const p0j = p0[j];
      _t.copy(p0j).applyMatrix4(_A).sub(p0j.clone().multiplyScalar(K).applyQuaternion(_q));
      const qd = new T.Quaternion(_t.x, _t.y, _t.z, 0).multiply(_q);
      DQU.uDqR.value[j].set(_q.x, _q.y, _q.z, _q.w);
      DQU.uDqD.value[j].set(0.5 * qd.x, 0.5 * qd.y, 0.5 * qd.z, 0.5 * qd.w);
    }
  };
  // Dinlenme ön kol yönü (dirsek → el). ⚠️ Üst kol yönüyle aynı DEĞİL: MakeHuman A-pozunda dirsek bükük (6 Eki)
  const onKol0 = t => P0('hand_' + t).clone().sub(P0('lowerarm_' + t)).normalize();

  /** Bir karede: iskelet s → kemik dünya matrisleri + kas tekdüzenleri */
  let sonId = null, onGecis = false;
  const ritimOnbellek = new WeakMap();   // hareket → ön geçişte ölçülen oranlar (ısınma listesi, plank seçenekleri aynı ekranda)
  const kavDurum = { A: null, B: null };
  /* SABİT TUTAMAK HAREKETİN VERİSİNDEN (15 Eki, Sabri: "lat çekişte bar en alta inince el sıçrayarak değişiyor"). El kilidi
     tutamağın sabit olup olmadığını kareden kareye yer değişimiyle (< 0,5) anlıyordu: hareketli bar dönüş noktalarında
     yavaşlayınca el DONUYOR, bar 0,5'i aşınca bir anda yerine SIÇRIYORDU (ölçüldü: geniş lat çekişin dibinde bilek 40°/kare
     gidip geliyor). Artık tutamak bütün hareket boyunca yerinde duruyorsa (veride el hedefi ≤ 0,5 cm oynuyorsa) kilit açılır. */
  const sabitOnbellek = new WeakMap();
  const sabitTutamak = (h, k) => {
    if (!h) return null;
    let o = sabitOnbellek.get(h);
    if (!o) { o = { A: true, B: true }; const ilk = {};
      for (let q = 0; q <= 24; q++) { const s = M.an(h, q / 24);
        for (const y of ['A', 'B']) { const p = s.hedef?.[y]?.hedef; if (!p) { o[y] = false; continue; } ilk[y] ??= p; if (M.mesafe(p, ilk[y]) > 0.5) o[y] = false; } }
      sabitOnbellek.set(h, o); }
    return o[k];
  };
  // RİTİM ORANI (8 Eki, Sabri: "tek kol baş üstünde kol omuzdan ayrılıyor gibi, hem dönüyor hem uzuyor"): ritim kolu
  // veriden fazla büktürmeyecek kadarla KARE KARE sınırlanınca omuz hareket boyunca 4,3 cm yükseliyordu (ön kol inerken
  // sınır gevşiyor). Gerçekte baş üstü triceps'te kürek kemiği yerinde durur. Hareket değişince 13 karelik ön geçişte
  // her kolun izin verilen en küçük ritim oranı ölçülür; kare kare ritim = ham ritim × bu oran (zamanda tutarlı).
  const ritimOran = { A: 1, B: 1 };
  /* DURUMSUZ KOL (17 Eki, yapısal analiz Y1 — docs/2026-10-17-motor-yapisal-analiz-PLAN.md): kol eskiden "önceki kareye en yakın"
     seçimlerle çözülüyordu (avuç işareti, büküm yönü, burulma adayı, el kilidi) → AYNI an, önce ne çizildiğine göre 180°'ye kadar
     farklı çiziliyordu (ölçüldü: göğüs presi makinesi el 180°, kablo mekik 178°, yüz çekişi ön kol 168°; 23 hareket). Artık her
     karar o karenin VERİSİNDEN ve hareket başına bir kez ölçülen sabitlerden (ön geçiş) gelir:
       kavrama (avuç tercihi): avucun ÖN KOL ÇERÇEVESİNDEKİ (menteşe ekseni, ön yüz) ortalama yönü — hedef yönün açıklığıyla
         ağırlıklı ölçülür. Kare kare işaret, bu yöne yakın olan aday: el bir hareket içinde ön kola göre 90°'den fazla
         dönmediği sürece işaret DÖNEMEZ. (1. deneme hedef yönü kare kare karıştırıyordu: skull crusher'da "ayağa bak" hedefi
         hareket ortasında tersine geçiyor, deadlift'te avuç hedefe dik kalıyordu → el yine 180° döndü, ölçüldü.)
       kilit: sabit tutamakta elin duruşu hareketin t = 0 anından (eskiden ilk ÇİZİLEN kareden) */
  const kavrama = { A: [0, 0], B: [0, 0] }, kilitSabit = { A: null, B: null };
  const durumSifirla = () => { kavDurum.A = kavDurum.B = null; };
  function guncelle(s, ayar) {
    if (ayar.id !== sonId) { sonId = ayar.id; durumSifirla(); }
    if (ayar.h && !onGecis) {
      const kayitli = ritimOnbellek.get(ayar.h);
      if (kayitli) { Object.assign(ritimOran, kayitli.ritim); kavrama.A = kayitli.kavrama.A; kavrama.B = kayitli.kavrama.B; Object.assign(kilitSabit, kayitli.kilit); }
      else {
        ritimOran.A = ritimOran.B = 1; kavrama.A = [0, 0]; kavrama.B = [0, 0]; kilitSabit.A = kilitSabit.B = null;
        onGecis = true;
        try {
          // 1. tur: ritim sınırı + kavrama yönü birikir · 2. tur (yalnız t = 0): kesinleşen kavramayla sabit tutamak kilidi
          for (let q = 0; q <= 24; q++) guncelle(M.an(ayar.h, q / 24), { ...ayar, ilkeller: [], onQ: q, onFaz: 1 });
          for (const k of ['A', 'B']) { const [a, c] = kavrama[k], u = Math.hypot(a, c); kavrama[k] = u > 1e-6 ? [a / u, c / u] : [0, 0]; }
          durumSifirla(); guncelle(M.an(ayar.h, 0), { ...ayar, ilkeller: [], onQ: 0, onFaz: 2 });
        }
        finally { onGecis = false; durumSifirla(); }
        ritimOnbellek.set(ayar.h, { ritim: { ...ritimOran }, kavrama: { A: kavrama.A, B: kavrama.B }, kilit: { ...kilitSabit } });
      }
    }
    const yon = P.kasYonleri(s), TARAF = tarafi(yon.ters);
    const g = V(s.g), ileri = V(yon.ileri), Pk = V(s.P), boyunK = V(s.boyun);
    const tani = { id: ayar.id, dirsekItme: {}, avucD: {}, bilekAci: {}, kavradi: {} };
    // Gövde: kalça merkezinden boyuna — dikey eksende uzatma (model gövdesi bizimkinden kısa)
    const Rg = esle(Y0, Z0, g, ileri);
    const Ag = afin(Pk, Rg, Y0, M.L.torso / (K * govdeBoy0), kalcaMerkez0)
      .multiply(new T.Matrix4().makeTranslation(kalcaMerkez0.x, kalcaMerkez0.y, kalcaMerkez0.z))
      .multiply(new T.Matrix4().makeScale(GOVDE_EN, 1, 1))
      .multiply(new T.Matrix4().makeTranslation(-kalcaMerkez0.x, -kalcaMerkez0.y, -kalcaMerkez0.z));
    // BEL KIVRILMASI (17 Eki, Sabri: "mekik makinesinde öne eğilirken kalça oturakta deforme oluyor"): iskelette bel ayrı bükülmez;
    // gövde tek parça döndüğünde leğen de tümüyle öne dönüyor, kalça oturaktan kalkıp sırt minderine giriyordu. Veri leğen yönünü
    // verirse (s.gKalca) leğen ona döner, bel kemikleri arada kademeli (kalça merkezi etrafında): leğen 1 · L1 0,6 · L2 0,25 · göğüs 0.
    if (s.gKalca) {
      const gK = V(s.gKalca).normalize(), qK = new T.Quaternion().setFromUnitVectors(g.clone().normalize(), gK);
      const pay = { root: 1, pelvis: 1, spine_01: 0.6, spine_02: 0.25 };
      for (const j of GOVDE) { const w = pay[sk.bones[j].name] ?? 0;
        yaz(j, w ? new T.Matrix4().makeTranslation(Pk.x, Pk.y, Pk.z).multiply(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().slerp(qK, w)))
          .multiply(new T.Matrix4().makeTranslation(-Pk.x, -Pk.y, -Pk.z)).multiply(Ag) : Ag); }
    } else for (const j of GOVDE) yaz(j, Ag);
    const noktaG = n => P0(n).clone().applyMatrix4(Ag);
    // Baş — 8 Eki: verideki boyun eğimi (s.gBas/s.yuzBas, pivot boyun) uygulanır. Sırtüstünde C'nin öne eğik başı
    // sehpadan 7 cm havadaydı; veri başı arkası sehpaya değecek kadar geriye eğer, boyun ve baş birlikte döner.
    const gB = s.gBas ? V(s.gBas) : g, yB = s.yuzBas ? V(s.yuzBas) : V(s.yuz);
    const qBas = esle(g, V(s.yuz), gB, yB), pN = noktaG('neck_01');
    const etrafinda = (p, q) => new T.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(new T.Matrix4().makeRotationFromQuaternion(q))
      .multiply(new T.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
    const Mboyun = etrafinda(pN, qBas);
    yaz(i('neck_01'), Mboyun.clone().multiply(Ag));
    const Rb = esle(Y0, Z0, gB, yB);
    const Abas = afin(noktaG('Head').applyMatrix4(Mboyun), Rb, null, 1, P0('Head'));
    yaz(i('Head'), Abas);
    // BACAKLAR KOLLARDAN ÖNCE (17 Eki, yapısal analiz Y1): boştaki elin uyluğa/kalçaya teması (elTemas) kemiklerin o anki
    // matrisinden okunur; bacaklar kollardan SONRA yazılınca yüzey ÖNCEKİ karedendi — baş üstü triceps'te uyluktaki el, önce
    // sırtüstü bir hareket çizildiyse 70° farklı duruyordu (ölçüldü). Bacak çözümü kol sonuçlarını kullanmaz.
    for (const k of ['A', 'B']) {
      const t = TARAF[k];
      const ka = V(s['ka' + k]), z = V(s['z' + k]), a = V(s['a' + k]), u = V(s['u' + k]);
      // Bacak: ayak tabanı zemine — model ayak kemiği bizimkinden yüksek, bilek tabanın normali boyunca kaldırılır
      // B1: ayak yönü verideki TABAN yönünden (s.tab); a→u tabanın altına kaymış nokta olduğu için ayağı ~16° öne eğiyordu
      const parmak = (s['tab' + k] ? V(s['tab' + k]) : u.clone().sub(a)).normalize();
      // Taban normali: ayak zemindeyse dünya yukarısı; makinede (leg press platformu) kaval kemiği yönü
      const zeminde = a.y < M.AYAK_Y + 6 + (s.zeminY ?? 0);              // 15 Eki: koşu bandı / basamak yüzeyi de zemindir
      // 17 Eki: veri ayak SIRTININ yönünü verebilir (`ayak{k}.sirt`) — yan plankta ayak kenarı üstünde durur; "yerdeyse taban düz"
      // kuralı onu zemine yatırıyor, ayaklar çarpık görünüyordu (Sabri)
      const sirtV = s.hedef?.['ayak' + k]?.sirt;
      const tabanN = (sirtV ? dikBilesen(V(sirtV), parmak) : zeminde && Math.abs(parmak.y) < 0.85 ? dikBilesen(Y0, parmak) : dikBilesen(z.clone().sub(a).normalize(), parmak)).normalize();
      const ayakB = a.clone().addScaledVector(tabanN, K * AYAK_TABAN0 - AYAK_TABAN_BIZ);
      const th = z.clone().sub(ka), a0t = P0('calf_' + t).clone().sub(P0('thigh_' + t));
      // UYLUK BURULMASI DURUMSUZ ve SÜREKLİ (17 Eki, yapısal analiz Y5 — kolun aynı kuralı): bükük dizde dizin GERÇEK büküm
      // yönü (kaval uyluğa göre nereye kıvrılıyorsa uyluğun arkası orası); diz düzleşince verinin diz kutbu, o da uyluğa
      // paralelse leğene göre anatomik arka (dinlenmedeki uyluk arkası, gövdeyle döndürülüp uyluğun yönüne taşınmış).
      // ⚠️ Eskiden kutup → (|dik| > 0,25 ise) büküm → ileri sırasıyla EŞİKLE seçiliyordu: eşikte uyluk tek karede dönüyordu
      // (dead bug 179°, bacak açma/bükme 18° — ölçüldü; uyluk dinlenmeye göre 161° burulu).
      const thN = th.clone().normalize(), shN = ayakB.clone().sub(z).normalize();
      const arkaB = (() => {
        const dikT = dikBilesen(shN, thN), dU = dikT.length();
        const a0n = a0t.clone().normalize();
        const refA = dikBilesen(Z0.clone().negate().applyQuaternion(Rg).applyQuaternion(new T.Quaternion().setFromUnitVectors(a0n.clone().applyQuaternion(Rg), thN)), thN);
        const kp = s.hedef?.['ayak' + k]?.kutup ? dikBilesen(V(s.hedef['ayak' + k].kutup).normalize(), thN).negate() : null;   // kaval kutbun tersine
        const refS = kp && kp.length() >= 0.2 ? kp.normalize() : refA.normalize();
        const w0 = Math.min(1, Math.max(0, (dU - 0.04) / 0.08)), w = w0 * w0 * (3 - 2 * w0);
        const v = (dU > 1e-6 ? dikT.normalize() : refS.clone()).multiplyScalar(w).addScaledVector(refS, 1 - w);
        if (v.lengthSq() < 1e-8) v.copy(refS);
        v.normalize();
        if (dU < 0.35 && v.dot(refA) < -0.5) v.negate();            // diz öne bükülmez
        return v;
      })();
      const Rt = esle(a0t.clone().normalize(), Z0.clone().negate(), th.clone().normalize(), arkaB);
      yaz(i('thigh_' + t), afin(ka, Rt, a0t.clone().normalize(), th.length() / (K * a0t.length()), P0('thigh_' + t)));
      const sh = ayakB.clone().sub(z), a0s = P0('foot_' + t).clone().sub(P0('calf_' + t));
      const Rs = new T.Quaternion().setFromUnitVectors(P0('foot_' + t).clone().sub(P0('calf_' + t)).normalize().applyQuaternion(Rt), sh.clone().normalize()).multiply(Rt);
      yaz(i('calf_' + t), afin(z, Rs, a0s.clone().normalize(), sh.length() / (K * a0s.length()), P0('calf_' + t)));
      const Af = afin(ayakB, esle(Z0, Y0, parmak, tabanN), null, 1, P0('foot_' + t));
      yaz(i('foot_' + t), Af);
      // (4) AYAK PARMAĞI EKLEMİ (Sabri: "parmak ucuna kalkınca parmaklar platformun içine giriyor"): ayak öne-aşağı
      //     eğilince parmaklar ayakla birlikte dönmez; parmak eklemi (ball) etrafında yukarı bükülüp yere paralel
      //     kalır (en çok 65°). Leg press gibi yukarı bakan ayakta dokunulmaz.
      {
        const top0 = P0('ball_' + t);
        let Mt = Af;
        if (top0) {
          const uc0 = P0('ball_leaf_' + t) ?? top0.clone().add(top0.clone().sub(P0('foot_' + t)).multiplyScalar(0.6));
          const pb = top0.clone().applyMatrix4(Af), dW = uc0.clone().applyMatrix4(Af).sub(pb).normalize();
          // 7 Eki (Sabri: "plankta ayak parmakları ters yöne kıvrılıyor"): hedef yön eskiden parmağın YATAY izdüşümüydü;
          // ayak dik durunca (plank) izdüşüm belirsizleşip topuğa dönüyordu. Parmak eklemi yalnız AYAK SIRTINA doğru
          // bükülür (dorsifleksiyon) — dönme ekseni ayağın yan ekseni; plankta ~90°'ye kadar (parmaklar altta).
          const sirt = dikBilesen(tabanN.clone(), dW);
          // 17 Eki (yapısal analiz Y6): büküm TEMASTAN — parmak altı (dinlenmedeki taban köşeleri) yerin altına inecekse yalnız
          // yere değecek kadar; havadaki ayakta parmaklar NÖTR. ⚠️ Eskiden ayak aşağı eğildiğinde parmak her zaman "yere paralel"
          // bükülüyordu: asılı bacak kaldırmada havadaki parmaklar kalkıktı, diz çökme / bird dog'da büküm yere değmeye
          // yetmiyordu (parmak ucu 6,4 cm yerin altında — ölçüldü). Bükülme yine yalnız ayak sırtına (dorsifleksiyon).
          // 2. tur (Sabri: "sehpadaki ayak çok gergin; ucuna doğru yumuşakça sehpaya değmeli"): ayak SIRTI yüzeye bakıyorsa (taban
          // yukarı — tek kol kürek, bulgarian) parmaklar TABANA doğru kıvrılır, parmak sırtı yüzeye değene kadar (en çok 50°); yüzey
          // yüksekliği veriden (`ayak{k}.yuzeyY`, yoksa zemin).
          // ⚠️ 1. sürüm "sırt aşağı bakıyor mu" diye yönden karar veriyordu: plank/şınavda parmak pedi yere basarken sırt da aşağı
          // eğik → yanlış yöne kıvırıp parmakları yere 5 cm soktu (ölçüldü). Karar: parmağın hangi YÜZÜ yüzeye daha yakın.
          const enAltY = kume => { let m = Infinity; for (const v of kume) m = Math.min(m, _pv.copy(v).applyMatrix4(Af).y); return m; };
          const sirtAsagi = PARMAK_ALTI['ust' + t].length > 0 && enAltY(PARMAK_ALTI['ust' + t]) < enAltY(PARMAK_ALTI[t]) - 0.5;
          if (sirt.lengthSq() > 1e-6) {
            sirt.normalize();
            const eks = new T.Vector3().crossVectors(dW, sirt).normalize().multiplyScalar(sirtAsagi ? -1 : 1);
            const y0 = s.hedef?.['ayak' + k]?.yuzeyY ?? s.zeminY ?? 0, sinir = (globalThis.__parmakSinir ?? (sirtAsagi ? 50 : 95)) * Math.PI / 180;
            const temasKume = sirtAsagi ? PARMAK_ALTI['ust' + t] : PARMAK_ALTI[t];
            const Mof = a2 => new T.Matrix4().makeTranslation(pb.x, pb.y, pb.z).multiply(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromAxisAngle(eks, a2)))
              .multiply(new T.Matrix4().makeTranslation(-pb.x, -pb.y, -pb.z)).multiply(Af);
            const alt = Mm => { let m = Infinity; for (const v of temasKume) m = Math.min(m, _pv.copy(v).applyMatrix4(Mm).y); return m; };
            if (temasKume.length && alt(Af) < y0) {
              let lo = 0, hi = sinir;
              if (alt(Mof(hi)) < y0) lo = hi;
              else for (let q = 0; q < 14; q++) { const mid = (lo + hi) / 2; if (alt(Mof(mid)) < y0) lo = mid; else hi = mid; }
              const aci = lo === sinir ? sinir : hi;
              Mt = Mof(aci);
              tani.parmakBukum = { ...(tani.parmakBukum ?? {}), [k]: Math.round(aci * 180 / Math.PI) };
            }
          }
        }
        for (const j of ayakAltindakiler(t)) yaz(j, Mt);
      }
    }
    for (const k of ['A', 'B']) {
      const t = TARAF[k];
      let om = V(s['om' + k]), d = V(s['d' + k]), e = V(s['e' + k]);
      const ka = V(s['ka' + k]), z = V(s['z' + k]), a = V(s['a' + k]), u = V(s['u' + k]);
      // ── OMUZ VE KOL MODELİN KENDİ ORANLARINDA (6 Eki 20:36, Sabri: "kollar gövdeye yanlış yerden bağlanıyor") ──
      // Veri: omuz yarı eni 14 cm, kol 31 + 29. Model (B/C): omuz 21,2, kol 25–26 + 24–27. Eskiden gövde %80'e
      // daraltılıp köprücük ve kol veriye UZATILIYORDU → omuzda kırık/gölge. Şimdi omuz modelin yerinde kalır, kol
      // kendi boyuyla IK'yla hedefe uzanır. Yetmezse kürek kemiği hedefe doğru en çok 6 cm kayar (protraksiyon/
      // elevasyon — gerçek uzanma böyledir); hâlâ yetmezse son çare kol oranlı uzar (tani.kolUzama).
      {
        const omM = noktaG('upperarm_' + t), Lu = K * P0('upperarm_' + t).distanceTo(P0('lowerarm_' + t));
        const Lf = K * P0('lowerarm_' + t).distanceTo(P0('hand_' + t));
        const hedefVar = !!s.hedef?.[k];
        let Lfe = Lf + (hedefVar ? EL_OFSET : 7);
        const omY = omM.clone();
        // SKAPULOHUMERAL RİTİM (6 Eki, Sabri: "kollar yukarıdayken koltuk altı düzleşiyor"): gerçekte kol 30°'nin
        // üstüne kalktıkça kürek kemiği ve köprücük de döner — her 3° kol kalkışının ~1°'i omuzdan gelir. Kol
        // kalkışı hedef ele göre ölçülür; omuz eklemi köprücük kökü etrafında, gövde önü ekseninde yukarı döner
        // (en çok 30°). Bu olmadan üst kol tek başına 160° dönüyor, deri koltuk altında gerilip düzleşiyordu.
        {
          // 17 Eki (Y4): kalkış ÜST KOLDAN (verinin omuz → dirsek yönü), elden değil. ⚠️ Elden ölçülünce skull crusher'da üst kol
          // dik ve sabitken ön kol başın arkasına indikçe omuz kalkıyordu (Sabri: "tepede omuzlar oynuyor") — kürek kemiğini
          // döndüren humerusun kalkışıdır, ön kolun değil.
          const kolY = V(s['d' + k]).sub(V(s['om' + k])).normalize(), asagi = g.clone().negate();
          const kalkis = Math.acos(Math.max(-1, Math.min(1, kolY.dot(asagi))));
          // 1. tur 30° eşik/30° tavan: kollar yandayken trapez kabarıyor, lat çekişinde göğüs düz yüzeylere bölünüyordu → eşik 70°, tavan 22°
          const D2R = Math.PI / 180; let ek = Math.min((globalThis.__ritimTavan ?? 22) * D2R, Math.max(0, kalkis - 70 * D2R) / 3);
          if (ek > 1e-3 && !globalThis.__ritimYok) {
            const kok = noktaG('clavicle_' + t), dis = omM.clone().sub(kok);
            const eks = new T.Vector3().crossVectors(dis, g).normalize();     // dışa→yukarı dönme ekseni
            const omuzAt = a2 => { const y2 = dis.clone().applyAxisAngle(eks, -a2); if (y2.dot(g) < dis.dot(g)) y2.copy(dis.clone().applyAxisAngle(eks, a2)); return kok.clone().add(y2); };
            // RİTİM KOLU VERİDEN FAZLA BÜKMEZ (8 Eki, Sabri: "one arm dambılın kolu eklemlerden doğru çalışmıyor"): omuz
            // 22° dönünce 7 cm yükseliyor, el hedefi aynı kaldığı için baş üstü triceps'in tepesinde dirsek veride 13°
            // iken ekranda 50° bükülüyordu (omuz presinin tepesinde 40 → 71°). Tutamak tutan kolda ritim, kolu verinin
            // dirsek açısından fazla büktürmeyecek kadarla sınırlanır (ikiye bölmeyle en büyük uygun açı).
            // 2. tur: sınır BÜTÜN hedefli kollara (bird dog'da uzanan kol tutamaksızdı: omuz 22° kalkıyor, dirsek 34° bükülüyordu) ve
            // 8° pay — baş üstünde omuz biraz kalkabilsin (Sabri: "aktif ile pasif asılmanın arası").
            if (hedefVar && !globalThis.__ritimSinirYok) {
              if (onGecis || !ayar.h) {
                const veriBuk = V(s['d' + k]).sub(om).angleTo(e.clone().sub(V(s['d' + k]))) + 8 * D2R;
                const Dist = Math.sqrt(Lu * Lu + Lfe * Lfe + 2 * Lu * Lfe * Math.cos(veriBuk));
                let lim = ek;
                if (e.distanceTo(omuzAt(ek)) < Dist) {
                  let lo = 0, hi = ek; for (let q = 0; q < 12; q++) { const mid = (lo + hi) / 2; if (e.distanceTo(omuzAt(mid)) >= Dist) lo = mid; else hi = mid; }
                  lim = e.distanceTo(omM) >= Dist ? lo : 0;
                }
                if (onGecis) ritimOran[k] = Math.min(ritimOran[k], lim / ek); else ek = lim;   // h yoksa (uygulama) kare kare sınır
              } else ek *= ritimOran[k];
              if (ritimOran[k] < 1) (tani.ritimSinir ??= {})[k] = +ritimOran[k].toFixed(2);
            }
            omY.copy(omuzAt(ek));
            tani.omuzRitim = { ...(tani.omuzRitim ?? {}), [k]: Math.round(ek / D2R) };
          }
        }
        temasDurum[k] = null;
        if (hedefVar && !globalThis.__elTemasYok && !s.hedef[k].tutamak) {   // B1: tutmayan el = veride tutamağı olmayan
          // 14 Eki (şınav): `zemin` = avuç YERE düz basar (veriden) — gövde yüzeyleri arasında zemin yok
          const zm = s.hedef[k].zemin;
          // zm.n: yüzeyin normali (avuç ona TERS bakar) — verilmezse yer (yukarı). Goblet squat'ta dambıl başının alt yüzü (aşağı)
          const tm = zm ? { yuzey: zm.avuc ? V(zm.avuc) : new T.Vector3(e.x, 0, e.z), n: zm.n ? V(zm.n).normalize() : new T.Vector3(0, 1, 0), yuk: zm.yuk } : elTemas(e);
          if (tm) {
            // avuç yüzeye bakar, parmaklar verinin ön kol yönünü yüzey boyunca sürdürür; IK hedefi BİLEK olur
            // parmaklar ön kolu ve gövdenin önünü birlikte izler: belde öne-aşağı, uylukta dize doğru
            // ⚠️ 14 Eki (Sabri: "şınavda eller kendi ekseninde dönüyor"): zeminde parmak yönü ön koldan türetilince beden inerken el
            //    63° dönüyor, bilek 5,6 cm kayıyordu (ölçüldü) → yerdeki elin parmak yönü VERİDEN ve sabit
            const f = zm?.parmak ? dikBilesen(V(zm.parmak), tm.n).normalize() : dikBilesen(e.clone().sub(V(s['d' + k])).normalize().add(ileri), tm.n).normalize();
            // 17 Eki (Y1): kareler arası yumuşatma KALKTI — önceki kareye karıştırmak eli geçmişe bağlıyordu (baş üstü triceps'te
            // uyluktaki boş el, arada başka hareket çizilince 55° farklı duruyordu — ölçüldü). Yön her karede yüzeyden.
            // yaslanan el (kendiliğinden temas ya da `zemin.duz`) parmakları hafif kıvrık → avuç 1 cm yukarıda (2. tur; parmak uçları
            // uyluğa 2–3 cm giriyordu)
            const yaslanir = !zm || zm.duz;
            const avucMerkez = tm.yuzey.clone().addScaledVector(tm.n, (tm.yuk ?? 1.1) + (yaslanir ? 1 : 0));   // zeminde avuç kalınlığı veriden
            const bilekH = avucMerkez.clone().addScaledVector(f, -AVUC_BOY);
            (tani.elTemas ??= {})[k] = +bilekH.distanceTo(e).toFixed(1);
            // zeminde avuç eklemleri kalkık kalıyordu (ölçüldü: parmak kökleri 1–1,4 cm havada) → el bilek etrafında ~8° öne-aşağı
            temasDurum[k] = { n: tm.n, f: zm ? f.clone().addScaledVector(tm.n, -0.14).normalize() : f };
            e = bilekH; Lfe = Lf;
          }
        }
        if (hedefVar) {
          const erisim = (Lu + Lfe) * 0.995;
          const uzak = e.distanceTo(omY);
          if (uzak > erisim) { const kay = Math.min(6, uzak - erisim); omY.addScaledVector(e.clone().sub(omY).normalize(), kay); tani.omuzKayma = { ...(tani.omuzKayma ?? {}), [k]: +kay.toFixed(1) }; }
          // DİRSEK ANATOMİK SINIRI (7 Eki, Sabri: "kol dirsekten kırılırken doğru çalışmıyor"): ölçüldü — curl tepesinde
          // tutamak modelin omzuna çok yakın kalıyor, dirsek 154° bükülüyor ve ön kol pazının içine giriyordu (iç kıvrım
          // kesiti %32). Kaslı bir kolda etkin bükülme ~145°'de durur. Gerçekte curl'ün tepesinde omuz geri-aşağı gelir
          // (kürek kemiği retraksiyonu/depresyonu): omuz noktası el hedefinden UZAĞA en çok 4 cm kayar, yukarı kaymaz.
          // ⚠️ çözücü açıyı KAVRAMA noktasına göre kurar; ön kol ekseni ~6° daha bükük çıkıyor (ölçüldü: 145 → 151) → 139
          const BUKUM_MAX = 140.5 * Math.PI / 180 /* B1: fizik denetimi K5 ile aynı (kavramaya göre 140°) */, dMin = Math.sqrt(Lu * Lu + Lfe * Lfe - 2 * Lu * Lfe * Math.cos(Math.PI - BUKUM_MAX));
          const yakin = e.distanceTo(omY);
          if (yakin < dMin && !globalThis.__dirsekSinirYok) {
            const yon2 = omY.clone().sub(e); const yuk = yon2.dot(g); if (yuk > 0) yon2.addScaledVector(g, -yuk);
            if (yon2.lengthSq() > 1e-6) {
              yon2.normalize();
              // |omY + s·yon2 − e| = dMin çözümü (s ≥ 0)
              const w2 = omY.clone().sub(e), bq = w2.dot(yon2), cq = w2.lengthSq() - dMin * dMin;
              const sCoz = -bq + Math.sqrt(Math.max(0, bq * bq - cq)), kay = Math.min(4, Math.max(0, sCoz));
              omY.addScaledVector(yon2, kay);
              (tani.dirsekSinir ??= {})[k] = +kay.toFixed(1);
            }
          }
          const uz2 = e.distanceTo(omY), olcek = uz2 > erisim ? uz2 / erisim : 1;
          if (olcek > 1) tani.kolUzama = { ...(tani.kolUzama ?? {}), [k]: +olcek.toFixed(3) };
          d = V(M.ik2(omY.toArray(), e.toArray(), Lu * olcek, Lfe * olcek, s.hedef[k].kutup).dirsek);
          // DİRSEK OMUZ HİZASINI GEÇMEZ (7 Eki, Sabri: "ters fly'da dirsekler çok yukarı çıkıyor"): ölçüldü — açık
          // konumda dirsek omzun 9,3 cm üstündeydi (veride bile 3,8). El omuz hizasında ya da altındayken dirsek en çok
          // omuz (ya da el) hizasında olur; el başın üstüne çıkan harekette (pres, baş üstü triceps) kural 8→16 cm
          // arasında yumuşakça devreden çıkar. Dirsek omuz–el ekseni etrafında döndürülür: kol boyu ve tutuş değişmez.
          // B1: veri artık kuralı kendisi taşıyor (fizik denetimi K5c) → bekçi verinin KENDİ omzuna göre ölçer ve yalnız
          // verinin dirseği omuz hizasında/altında tuttuğu yerde devreye girer (baş üstü triceps'te dirsek bilerek yukarıda).
          const omV = V(s['om' + k]), dVeri = V(s['d' + k]).sub(omV).dot(g);
          if (!globalThis.__dirsekYukYok && dVeri <= 0.5) {
            const elY = e.clone().sub(omV).dot(g);
            const izin = elY >= 16 ? Infinity : Math.max(0.5, dVeri + 0.5) + Math.max(0, elY - 8) / 8 * 30;
            const dY = d.clone().sub(omV).dot(g);
            if (dY > izin) {
              const ax = e.clone().sub(omY).normalize(), c = omY.clone().addScaledVector(ax, d.clone().sub(omY).dot(ax));
              const rv = d.clone().sub(c), r = rv.length();
              if (r > 1e-3) {
                const u1 = rv.clone().divideScalar(r), u2 = new T.Vector3().crossVectors(ax, u1);
                const A = r * u1.dot(g), B = r * u2.dot(g), C = izin - c.clone().sub(omV).dot(g), R = Math.hypot(A, B);
                const f0 = Math.atan2(B, A);
                let fi;
                if (R < 1e-6) fi = 0;
                else if (Math.abs(C / R) > 1) fi = f0 + Math.PI;                      // en alçak nokta
                else { const da = Math.acos(C / R), a1 = f0 + da, a2 = f0 - da; const n = x => Math.atan2(Math.sin(x), Math.cos(x)); fi = Math.abs(n(a1)) < Math.abs(n(a2)) ? n(a1) : n(a2); }
                d = c.clone().addScaledVector(u1, r * Math.cos(fi)).addScaledVector(u2, r * Math.sin(fi));
                (tani.dirsekYuk ??= {})[k] = +(dY - Math.min(dY, d.clone().sub(omV).dot(g))).toFixed(1);
              }
            }
          }
        } else {
          const ud = V(s['d' + k]).sub(V(s['om' + k])).normalize(), fd = V(s['e' + k]).sub(V(s['d' + k])).normalize();
          d = omY.clone().addScaledVector(ud, Lu); e = d.clone().addScaledVector(fd, Lfe);
        }
        om = omY;
      }
      // Köprücük: gövdeden bizim omuz noktasına
      const pc = noktaG('clavicle_' + t), a0c = P0('upperarm_' + t).clone().sub(P0('clavicle_' + t));
      const hc = om.clone().sub(pc);
      yaz(i('clavicle_' + t), afin(pc, esle(a0c.clone().normalize(), Y0, hc.clone().normalize(), g), a0c.clone().normalize(), hc.length() / (K * a0c.length()), P0('clavicle_' + t)));
      // ── KOL (6 Eki, eklem gözden geçirmesi) ─────────────────────────────────────────────────────
      // (1) Dirsek gövdenin DIŞINDA: model gövdesi bizim mankenden geniş, IK dirseği mankenin genişliğine
      //     koyuyor → kol gövdeye giriyordu (Sabri). Gövde, modelden ÖLÇÜLEN elips kesitli bir sütun.
      const yanK = dikBilesen(dikBilesen(om.clone().sub(boyunK), g), ileri).normalize();
      {
        const v = d.clone().sub(Pk), boy = v.dot(g), en = v.dot(yanK), derin = v.dot(ileri) - GOVDE_KESIT.merkezOn;
        const { yariEn, yariDerin } = GOVDE_KESIT, rKol = 4.8;
        if (boy > 4 && boy < M.L.torso + 4 && en > -4 && Math.abs(derin) < yariDerin + rKol) {
          const q = Math.min(1, Math.abs(derin) / (yariDerin + rKol));
          const gereken = (yariEn + rKol) * Math.sqrt(1 - q * q);
          if (en < gereken) { d.addScaledVector(yanK, gereken - en); tani.dirsekItme[k] = +(gereken - en).toFixed(1); }
        }
      }
      // (2) Üst kol. Büküm yönü (dirseğin büküldüğü taraf) MODELİN KOLUNDAN: dirsek→el'in üst kola dik bileşeni.
      //     ⚠️ Eskiden verinin IK kutbundan geliyordu; baş üstü triceps'te kutup kolun kendisine paralel →
      //     yön gürültüyle dönüyor, üst kol bazı karelerde 150–170° burkuluyordu (ölçüldü). Kol düzken
      //     önceki karenin yönü korunur; hiç yoksa verinin yönü.
      // DİRSEK GERİYE KIRILMAZ (8 Eki, Sabri: "hammer curl'de kollar dirsekten ters kırılıyor"): kol sarkarken verinin
      // kutbu kolun kendisine neredeyse paralel; çözücü dirseği omuz–el çizgisinin ÖN tarafına koyunca ön kol geriye
      // bükülüyordu (ölçüldü: hammer 16°, fly 38°, göğüs açma 15°). Anatomik ön (dinlenmedeki kolun önü, gövdeyle
      // döndürülüp omuz→el yönüne taşınmış) tarafındaki dirsek çizginin öbür yanına aynalanır — el yerinde kalır.
      // Kol başın üstündeyken bu referans güvenilmez (Codman), orada devreden çıkar. Dirseğe dokunan bütün bekçilerden
      // SONRA (önce çözücünün hemen ardındaydı; omuz-hizası bekçisi dirseği yeniden döndürüp fly/pushdown'da geri kırıyordu).
      if (!globalThis.__asiriAcilmaSerbest) {
        const cz = e.clone().sub(om).normalize();
        if (cz.dot(g) < 0.3) {
          const r0 = Z0.clone().applyQuaternion(Rg).applyQuaternion(new T.Quaternion().setFromUnitVectors(
            P0('lowerarm_' + t).clone().sub(P0('upperarm_' + t)).normalize().applyQuaternion(Rg), cz));
          const refC = dikBilesen(r0, cz).normalize(), od = d.clone().sub(om), w = dikBilesen(od, cz);
          // ⚠️ 13 Eki (Sabri: "ısınmada kollar eklem yerlerinden atlıyor"): karar refC BİLEŞENİNE (> 0,3) bakıyor ama
          // eskiden dirseğin BÜTÜN dik sapması (w) aynalanıyordu — kol çevirmede bekçi devreye girdiği karede w 3,9 cm,
          // dirsek ~8 cm sıçrayıp üst kol 17° (göğüs açmada 13,6°) burkuluyordu (ölçüldü: o kare tam bekçinin açıldığı
          // kare). Artık yalnız refC bileşeni aynalanır: omuz–el doğrusunu içeren düzleme göre yansıma → kol boyları
          // aynı, dirsek anatomik öne geçemez ve geçiş SÜREKLİ (bileşen 0'da yansıma da 0).
          const cOn = w.dot(refC);
          if (globalThis.__asiriAcilmaEski) { if (cOn > 0.3) { d.sub(w).sub(w); (tani.asiriAcilma ??= {})[k] = +w.length().toFixed(1); } }   // TANI: eski (A/B)
          else if (cOn > 0) { d.addScaledVector(refC, -2 * cOn); (tani.asiriAcilma ??= {})[k] = +cOn.toFixed(1); }
        }
      }
      const ua = d.clone().sub(om), a0u = P0('lowerarm_' + t).clone().sub(P0('upperarm_' + t));
      let bUst;                                                       // üst kol kemiğinin (burulması sınırlı) büküm yönü
      {
        const uaN = ua.clone().normalize(), dik = dikBilesen(e.clone().sub(d).normalize(), uaN);
        // ANATOMİK REFERANS (8 Eki, Sabri: "hammer curl'de omuz–kol bağlantısı bozuluyor"): dinlenme duruşunda kolun
        // ön yüzü (Z0), gövdeyle döndürülüp üst kolun yeni yönüne en kısa yoldan taşınır. Kol düzken büküm yönü
        // belirsiz; ilk kare verideki yönü alıyordu ve o yön ters işaretliyse "önceki kareyi koru" kuralı yanlışı
        // bütün harekete kilitliyordu — hammer curl'de sağ üst kol 160–178° burulu, sol 2–20° (ölçüldü).
        const ref0 = Z0.clone().applyQuaternion(Rg), qSw = new T.Quaternion().setFromUnitVectors(a0u.clone().normalize().applyQuaternion(Rg), uaN);
        const ref = dikBilesen(ref0.applyQuaternion(qSw), uaN).normalize();
        // DURUMSUZ (17 Eki, Y1): kol düzleşince büküm yönü belirsizleşir ve eskiden ÖNCEKİ kareden alınıyordu (curl'lerde düz
        // kolda yön dönünce avuç hedefi de dönüyordu). Artık SÜREKLİ bir karışım: bükük kolda bükümün kendisi (dik), düzleştikçe
        // anatomik ön yüz (ref) — ağırlık dirsek bükümünün sinüsüyle (0,10 → 0,35 arası yumuşak). ⚠️ 1. deneme düz kolda IK
        // kutbunu kullandı: kutupsuz sarkık kolda (ısınma, tibialis) 3°'lik rastgele büküm yönü üst kolu 90° burdu (ölçüldü).
        // 2. tur (17 Eki): karışım bandı 0,10–0,35 → 0,04–0,12 (dirsek ~2°–7°) ve düz kolun referansı önce VERİNİN dirsek kutbu.
        // ⚠️ Baş üstünde anatomik ön (ref) tekildir (Codman): baş üstü triceps'te veri büküm yönü hareket boyunca tutarlıyken
        // ref onun TERSİNİ gösteriyordu; 0,2'lik bükümde ikisinin karışımı yönü 180° savurdu (üst kol 31 → 97 → 34 → 151°,
        // omuz pres sonu 117 → 41°, barfiks başı — ölçüldü). Dirsek ~2°'den fazla bükükse verinin yönü güvenilir (ölçüldü).
        const dikU = dik.length();                                   // ⚠️ normalize() yerinde değiştirir — uzunluk önce alınır
        const kt = s.hedef?.[k]?.kutup ? dikBilesen(V(s.hedef[k].kutup).normalize(), uaN).negate() : null;   // ön kol kutbun tersine bükülür
        const refD = kt && kt.length() >= 0.2 ? kt : dikBilesen(ref, uaN), wD = Math.min(1, Math.max(0, (dikU - 0.04) / 0.08)), wS = wD * wD * (3 - 2 * wD);
        let b = (dikU > 1e-6 ? dik.clone().normalize() : refD.clone().normalize()).multiplyScalar(wS);
        if (refD.lengthSq() > 1e-8) b.addScaledVector(refD.clone().normalize(), 1 - wS);
        if (b.lengthSq() < 1e-8) b = refD.clone();
        b.normalize();
        // Az bükük dirsekte (< ~20°) anatomiye TERS büküm aşırı açılmadır (dirsek geriye bükülemez): hammer curl'ün
        // altında dambıl dışa açılınca ön kol hafifçe geriye düşüyor, üst kol 164° burkuluyordu (ölçüldü)
        // yalnız kol AŞAĞI yarıdayken: anatomik ön orada güvenilir; baş üstünde (Codman) ters gösterebilir — orada veriye güvenilir
        if (dikU < 0.35 && uaN.dot(g) < 0 && b.dot(ref) < -0.5) b.negate();
        // Dirsek GERİYE bükülemez: büküm yönü bir hareket boyunca tersine dönemez. Kol düzleşip veride hafifçe öbür
        // yana geçince (aşırı açılma) yön 180° dönüyor, üst kol 160–180° burulup göğüs düz yüzeylere çöküyordu (ölçüldü).
        (tani.bukumDbg ??= {})[k] = { dik: +dikU.toFixed(2), b: b.toArray().map(v => +v.toFixed(2)), ua: uaN.toArray().map(v => +v.toFixed(2)), ref: ref.toArray().map(v => +v.toFixed(2)) };
        yon['bukum' + k] = b.toArray();                               // ön kol ve el GERÇEK büküm yönünü kullanır
        yon['mentese' + k] = new T.Vector3().crossVectors(uaN, b).normalize().toArray();   // dirseğin menteşe ekseni (aşağıda ön kolun ön yüzü)
        // BURULMA SINIRI (8 Eki, Sabri: "baş üstü triceps'te kol–omuz bağlantısı kırılıyor"): kol öne kalkıp başın
        // üstüne çıkınca üst kol dinlenmeye göre ~180° burulur (Codman paradoksu). Modelde burulma kemiği yok; bütün
        // dönme omuz ekleminde toplanınca deri katlanıyordu. A/B: burulma sıfırlanınca katlanma tamamen kayboldu,
        // ön kol kendi kemiğiyle yönlendiği için dirsek bozulmadı → YALNIZ ÜST KOL kemiğinin burulması ±45° ile
        // sınırlanır (90° tam yukarıda kabarıklık bırakıyordu — A/B), fazlası dirsekte kalır. Sınırlanan yön ön kola
        // geçerse el çözücüsü ters çözüme atlıyordu (el 48°/kare) → ön kol yukarıdaki gerçek yönle kalır.
        bUst = b;
        {
          // 17 Eki (Y2): ±45° kırpma KALKTI — 31 harekette hareket boyunca doluydu; gerçekte üst kol dışa ~90°, içe ~70° döner ve
          // fazlası ön kola/bileğe itilince eller barın içine giriyor, kollar dönüyordu. Kollarda çift kuaterniyon deri var.
          // (A/B için globalThis.__burulmaTavan derece verilebilir.)
          const BUR_MAX = (globalThis.__burulmaTavan ?? 180) * Math.PI / 180;
          const aci = Math.atan2(new T.Vector3().crossVectors(ref, b).dot(uaN), ref.dot(b));
          if (Math.abs(aci) > BUR_MAX) {
            // ±180°'ye yakın açının işareti kareden kareye sıçrar → iki adaydan önceki karenin sınırlı yönüne yakın olan
            const art = ref.clone().applyAxisAngle(uaN, BUR_MAX), eks = ref.clone().applyAxisAngle(uaN, -BUR_MAX);
            bUst = aci > 0 ? art : eks;
          }
          if (globalThis.__burulmaRef) bUst = ref.clone();            // TANI: burulmasız üst kol (A/B)
        }
      }
      const Ru = esle(a0u.clone().normalize(), Z0, ua.clone().normalize(), bUst);
      { // tanı: üst kolun dinlenmeye göre BURULMASI (swing'den arta kalan, kemik ekseni etrafında)
        // ⚠️ 1. sürüm dünyaya göre ölçüyordu (gövdenin 90° yönü karışıyordu) → GÖVDEYE göre: Rrel = Rg⁻¹·Ru
        const Rrel = Rg.clone().invert().multiply(Ru), ax0 = a0u.clone().normalize();
        const sw = new T.Quaternion().setFromUnitVectors(ax0, ax0.clone().applyQuaternion(Rrel));
        const tw = sw.clone().invert().multiply(Rrel), ax = ax0.clone();
        const pr = ax.multiplyScalar(new T.Vector3(tw.x, tw.y, tw.z).dot(ax));
        const q = new T.Quaternion(pr.x, pr.y, pr.z, tw.w).normalize();
        tani.ustKolBurulma = { ...(tani.ustKolBurulma ?? {}), [k]: Math.round(2 * Math.acos(Math.min(1, Math.abs(q.w))) * 180 / Math.PI) };
      }
      yaz(i('upperarm_' + t), afin(om, Ru, a0u.clone().normalize(), ua.length() / (K * a0u.length()), P0('upperarm_' + t)));
      // (3) El: tutulan nesnenin ekseni + ANATOMİK avuç yönü
      const fa0 = e.clone().sub(d).normalize();
      const dur = kavDurum[k];
      // B1 (D3): tutamak VERİDEN gelir (eksen, yarıçap, avuç). Tahmin (en yakın kapsül) yalnız eski veri için yedek.
      const tv = s.hedef?.[k]?.tutamak;
      const tutulan = !s.hedef?.[k] || globalThis.__kavramaYok ? null
        : tv ? { eksen: V(tv.eksen).normalize(), nokta: e.clone(), r: tv.r, j: 'veri' + k, avuc: tv.avuc }
        : tutulanEksen(e, ayar.ilkeller, dur?.j ?? -1);
      const eksen = tutulan?.eksen ?? null;
      let Ael, Rh = null;
      if (eksen) {
        const f = dikBilesen(fa0, eksen);                          // parmaklar ön kolu sürdürür, bara dik
        (tani.kavramaAci ??= {})[k] = Math.round(Math.asin(Math.min(1, f.length())) * 180 / Math.PI);   // tutamak ekseni ↔ ön kol (90 = dik, ideal)
        if (f.lengthSq() < 1e-4) f.copy(dikBilesen(ileri, eksen));
        f.normalize();
        const n0 = new T.Vector3().crossVectors(eksen, f).normalize();     // avuç ekseni (işareti aşağıda)
        // ön kolun ön yüzü: üst kolun tersinin ön kola dik bileşeni (dirsek bükükken), kol düzken biceps tarafı
        // Ön kolun ön yüzü = dirseğin büküldüğü taraf; IK kutbundan (sürekli). ⚠️ Eskiden üst kolun tersinden
        //   türüyordu: kol düzleşince (baş üstü triceps, t≈0,14) o yön sıfıra iniyor, işareti gürültüyle dönüyor ve
        //   el tek karede 180° çevriliyordu (ölçüldü).
        // 17 Eki (Y1): ön yüz = menteşe ekseni × ön kol. ⚠️ Eskiden büküm yönünün ön kola DİK bileşeniydi: dirsek 90°'deyken büküm
        // yönü ön kola PARALEL olur, bileşen sıfıra iner ve işaret döner — bar curl'ün tam ortasında avuç 180° dönüyordu (ölçüldü;
        // önceki kareye bakan histerezis bunu gizliyordu). Menteşe ekseni (üst kol × büküm yönü) her büküm açısında tanımlı.
        const onKolOn = new T.Vector3().crossVectors(V(yon['mentese' + k]), fa0).normalize();
        const ic = (() => { const c0 = Pk.clone().addScaledVector(g, e.clone().sub(Pk).dot(g)); const m = c0.sub(e);
          m.addScaledVector(ileri, -m.dot(ileri)); return m.lengthSq() > 1e-6 ? m.normalize() : yanK.clone().negate(); })();
        const tur = tutulan.avuc ?? AVUC[ayar.id] ?? 'ic';
        // 'kolaGore' (8 Eki, Sabri: "fly'da bilek çok kısa mesafede bükülüyor, bütün kol hareketi boyunca bükülse daha
        // doğal"): avuç hedefi ön kolun açısına göre KESİNTİSİZ karışır — ön kol gövde önüne (ileri) paralelken içe,
        // ona dikken ileriye. 'ileri' sabitken avuç ekseni bir anda dönüyordu (el 42°/kare).
        const kolaGore = () => { const w = Math.abs(fa0.dot(ileri)); return ic.clone().multiplyScalar(w).addScaledVector(ileri, 1 - w).normalize(); };
        // 'icAsagi' (14 Eki, yana kaldırma): altta avuç uyluğa (iç bileşen), kol yataya çıkınca yere (aşağı bileşen) — kesintisiz
        // 'ileriAsagi' (17 Eki, göğüs presi makinesi): yatay tutamakta avuç aşağıdan öne — üstten kavrar, bilek avucu öne çevirir
        const Dv = tur === 'ileriAsagi' ? ileri.clone().sub(g).normalize() : tur === 'icAsagi' ? ic.clone().add(new T.Vector3(0, -1, 0)).normalize() : tur === 'ayak' ? g.clone().negate() : tur === 'ileri' ? ileri.clone() : tur === 'kolaGore' ? kolaGore()
          : tur === 'onKolOn' ? onKolOn : tur === 'onKolArka' ? onKolOn.clone().negate() : ic;
        // 17 Eki (Y1): önceki kareye göre histerezis KALKTI. Hedef yön AÇIKKEN (|n0·Dv| ≥ 0,35) karar onundur; belirsizleştikçe
        // (avuç ekseni hedefe dik — göğüs presi, skull crusher, geniş lat çekiş, kablo göğüs açmada 0,00–0,02 ölçüldü) karar
        // σ ilişkisine geçer: avucun ön kolun ön yüzüne göre işareti, ön geçişte açık karelerden ölçülmüş. İkisi sürekli karışır.
        const hamDv = n0.dot(Dv), mn = V(yon['mentese' + k]), yerel = [n0.dot(mn), n0.dot(onKolOn)];   // avuç ekseni ön kol çerçevesinde
        if (onGecis && ayar.onFaz === 1) { const a = hamDv * Math.abs(hamDv); kavrama[k][0] += a * yerel[0]; kavrama[k][1] += a * yerel[1]; }
        // ANATOMİK SINIR (17 Eki): avuç ön kol çerçevesinde supinasyon (ön) → nötr (İÇ) → pronasyon (arka) yarım dairesinde
        // dolaşır, DIŞA bakamaz. Menteşe ekseninin iç ucu taraf başına sabittir (dinlenme duruşundan). Kavrama ortalaması bu
        // içe yönle toplanır: kol düzken avuç ekseni ön/arka ortalamaya dik kaldığında (curl'ün altında avuç uyluğa bakar)
        // karar anatomiden gelir. ⚠️ Yalnız ortalama: curl'ün altında işaret belirsizdi, el ve ön kol 177°/121° döndü (ölçüldü).
        // Hiçbiri karar vermezse (avuç tam ön/arka, hedef hep dik — pallof) küçük PRONASYON eğilimi: belirsizlik gürültüyle dönmez.
        const ici = mentIci(t), kv = [kavrama[k][0] + ici, kavrama[k][1] - 0.05], uyum = yerel[0] * kv[0] + yerel[1] * kv[1];
        let isaret = (onGecis && ayar.onFaz === 1) || Math.abs(uyum) < 1e-6 ? Math.sign(hamDv) || 1 : Math.sign(uyum);
        (tani.avucHam ??= {})[k] = +hamDv.toFixed(2); (tani.avucUyum ??= {})[k] = +uyum.toFixed(2); if (globalThis.__avucDbg) (tani.avucYerel ??= {})[k] = [+yerel[0].toFixed(2), +yerel[1].toFixed(2), +kv[0].toFixed(2), +kv[1].toFixed(2), isaret];
        let n = n0.multiplyScalar(isaret);
        // Bilek bükümü: avuç hedef yöne en çok 35° dönebilir (bar ekseni çevresinde = bileğin büküm ekseni) —
        // preslerde gerçek el böyle durur: bar avuç kökünde, bilek hafif geride
        const hedefN = dikBilesen(Dv, eksen);
        // 15 Eki (Sabri: "lat çekişte bar en alta inince el sıçrıyor"): büküm yalnız avuç hedefe bakarken (n·hedef > 0)
        // uygulanıyordu — ön kol yataya yaklaşınca n·hedef sıfırdan geçiyor, 35° büküm TEK KAREDE açılıp kapanıyordu (ölçüldü:
        // geniş lat çekişin dibinde bilek −40° → +5°). Artık büküm n·hedef 0 → 0,35 arasında yumuşakça devreye girer.
        // 17 Eki (Y1): hedef yön tutamak eksenine PARALELKEN (|hedefN| küçük) bükülme yönü gürültüdür — deadlift/RDL/curl'de bilek
        // tek karede 20–40° kıvrılıyordu (ölçüldü). Büküm |hedefN| 0,2 → 0,5 arasında yumuşakça devreye girer.
        const hU = hedefN.length(), hW0 = Math.min(1, Math.max(0, (hU - 0.2) / 0.3)), hW = hW0 * hW0 * (3 - 2 * hW0);
        const nh = hU > 1e-2 ? n.dot(hedefN.clone().normalize()) : 0, agirlik = Math.min(1, Math.max(0, nh / 0.35)) * hW;
        if (agirlik > 0) {
          hedefN.normalize();
          const aci = Math.acos(Math.max(-1, Math.min(1, n.dot(hedefN)))), sinir = 35 * Math.PI / 180 * agirlik * agirlik * (3 - 2 * agirlik);
          if (aci > 1e-3) n = new T.Vector3().copy(n).applyAxisAngle(eksen.clone().multiplyScalar(Math.sign(new T.Vector3().crossVectors(n, hedefN).dot(eksen)) || 1), Math.min(aci, sinir));
          f.copy(new T.Vector3().crossVectors(n, eksen).multiplyScalar(Math.sign(new T.Vector3().crossVectors(n, eksen).dot(f)) || 1)).normalize();
        }
        kavDurum[k] = { j: tutulan.j, n: n.clone(), kilit: dur?.j === tutulan.j ? dur.kilit : null };
        const KV = kavramaKur(Math.max(0.01, Math.min(0.035, tutulan.r / K)));
        const eNokta = tutulan.nokta;                  // el, IK noktasında değil tutamağın EKSENİNDE (calf direği 5 cm yandaydı)
        // (1) El, avuçtaki SANAL bar (15° çapraz güç kavraması) gerçek bar eksenine oturacak biçimde döner.
        //     ⚠️ Eskiden parmak yönü bara dik oturtuluyordu → parmaklar 15° eğik bara sarılıp gerçek bardan
        //     1–3 cm ayrılıyor, serçe parmak açılıyordu (Sabri, 6 Eki 21:22: "parmaklar bitişik değil").
        const pf0 = dikBilesen(EL0[t].parmak, KV.BAR0[t]).normalize();
        Rh = esle(pf0, EL0[t].avuc, f, n);
        // (2) SABİT NESNEDE EL KİLİTLİ (Sabri: "calf raise'de el direğin içinde dönüyor, bilek hareket etmiyor"):
        //     tutulan nesne yerinden oynamıyorsa (direk, makine tutamağı) el ilk karedeki dünyadaki duruşunu korur;
        //     gövde hareket ettikçe farkı BİLEK karşılar (aşağıdaki anatomik sınırla).
        const kd = kavDurum[k];
        if (onGecis && ayar.onFaz === 2 && sabitTutamak(ayar.h, k)) kilitSabit[k] = { Rh: Rh.clone(), nokta: eNokta.clone(), eksen: eksen.clone() };
        const ks = kilitSabit[k], kilitli = !!(ks && !onGecis && sabitTutamak(ayar.h, k) && ks.nokta.distanceTo(eNokta) < 0.5 && Math.abs(ks.eksen.dot(eksen)) > 0.999);
        if (kilitli) Rh = ks.Rh.clone();
        {
          // ANATOMİK BİLEK SINIRI (6 Eki, Sabri: "bilek hareketleri doğal ve doğru olsun"). Tek bir koni yerine
          // iki eksen ayrı ölçülür ve ayrı sınırlanır (ön kol çerçevesinde, parmak yönünün açıları):
          //   fleksiyon (avuca doğru) ≤ 70° · ekstansiyon (geriye) ≤ 60° · radyal (başparmağa) ≤ 20° · ulnar ≤ 30°
          // Sınıra yaklaşırken YUMUŞAK kırpılır (son %30'da sıkışır) → hareket sınırda sıçramaz.
          const bilekTahmin = P0('hand_' + t).clone().applyMatrix4(afin(eNokta, Rh, null, 1, KV.KAVRAMA0[t]));
          const ok = bilekTahmin.sub(d).normalize();
          const parmak = EL0[t].parmak.clone().applyQuaternion(Rh);
          const avucY = dikBilesen(EL0[t].avuc.clone().applyQuaternion(Rh), ok).normalize();   // + = fleksiyon
          // radyal eksen: parmak yönüne DİK çapraz (EL0.capraz), başparmak tarafı + . ⚠️ Ham işaret–serçe doğrusu
          //   parmağa dik değil (B'de 22°) → sapma yanlılıklı ölçülüyor ve el gereksiz döndürülüyordu (6 Eki).
          const cap0 = EL0[t].capraz.clone().multiplyScalar(Math.sign(EL0[t].capraz.dot(P0('index_01_' + t).clone().sub(P0('pinky_01_' + t)))) || 1);
          const radY = dikBilesen(cap0.applyQuaternion(Rh), ok);
          radY.sub(avucY.clone().multiplyScalar(radY.dot(avucY))).normalize();                    // + = radyal
          const x = parmak.dot(ok), fl = Math.atan2(parmak.dot(avucY), x), sp = Math.atan2(parmak.dot(radY), x);
          (tani.bilekX ??= {})[k] = +x.toFixed(2);
          const yumusak = (a, alt, ust) => {               // [alt, ust] içine yumuşak sıkıştırma (rad)
            const k = (v, s) => { const b = 0.7 * s; return v <= b ? v : b + (s - b) * Math.tanh((v - b) / (s - b)); };
            return a >= 0 ? k(a, ust) : -k(-a, -alt);
          };
          const D2R = Math.PI / 180;
          const fl2 = yumusak(fl, -60 * D2R, 70 * D2R), sp2 = yumusak(sp, -30 * D2R, 20 * D2R);
          if (Math.abs(fl2 - fl) > 1e-3 || Math.abs(sp2 - sp) > 1e-3) {
            const hedefP = ok.clone().addScaledVector(avucY, Math.tan(fl2)).addScaledVector(radY, Math.tan(sp2)).normalize();
            Rh = new T.Quaternion().setFromUnitVectors(parmak, hedefP).multiply(Rh);
            tani.bilekSinir = (tani.bilekSinir ?? 0) + 1;
          }
          tani.bilekFl = tani.bilekFl ?? {}; tani.bilekSp = tani.bilekSp ?? {};
          tani.bilekFl[k] = Math.round(fl2 / D2R); tani.bilekSp[k] = Math.round(sp2 / D2R);
        }
        tani.kilitli = { ...(tani.kilitli ?? {}), [k]: kilitli };
        Ael = afin(eNokta, Rh, null, 1, KV.KAVRAMA0[t]);
        tani.avucD[k] = +n.dot(Dv).toFixed(2); tani.kavradi[k] = true;
        { const a3 = eNokta.clone().addScaledVector(eksen, -6).toArray(), b3 = eNokta.clone().addScaledVector(eksen, 6).toArray();
          const geo = typeof tutulan.j === 'number' ? ayar.ilkeller[tutulan.j].geo : { a3, b3, r: tutulan.r };
          tani.cubuk = tani.cubuk ?? {}; tani.cubuk[k] = { a: geo.a3, b: geo.b3, r: geo.r, taraf: t }; }
      } else if (temasDurum[k]) {
        // gövdeye dayalı el (lunge'da bel, triceps'te uyluk): avuç yüzeye, bilek IK noktasında
        Rh = esle(EL0[t].parmak, EL0[t].avuc, temasDurum[k].f, temasDurum[k].n.clone().negate());
        Ael = afin(e, Rh, null, 1, P0('hand_' + t));
        tani.kavradi[k] = false;
      } else {
        const bilek0 = e.clone().addScaledVector(fa0, -7);
        Ael = afin(bilek0, new T.Quaternion().setFromUnitVectors(onKol0(t).applyQuaternion(Ru), fa0).multiply(Ru), null, 1, P0('hand_' + t));
        tani.kavradi[k] = false;
      }
      // (4) Ön kol: bilekten türer; elin ön kol eksenindeki burulmasının %65'i ön kola (pronasyon/supinasyon)
      const bilek = P0('hand_' + t).clone().applyMatrix4(Ael), a0l = P0('hand_' + t).clone().sub(P0('lowerarm_' + t));
      // KEMİK BOYU SABİT (2. tur, Sabri: "göğüs açmada dirsek elastik, ön kol arkadan yetişemiyor"): bilek, elin tutamaktaki
      // duruşundan konumlanıyor; dirsek ise bilek bilinmeden (el noktasına göre) çözülmüştü → ön kol kemiği aradaki farkı UZAYARAK
      // kapatıyordu (17 harekette; göğüs açma 27,1 → 29,8, ters kelebek/pec deck 32,1 cm — ölçüldü). Artık dirsek omuz ile GERÇEK
      // bilek arasında kendi kol boylarıyla yeniden çözülür (bükülme düzlemi korunur) ve üst kol yeni dirseğe döndürülür.
      // Bilek erişim dışındaysa (kol neredeyse düz) kemik uzamaz: omuz bileğe doğru en çok 6 cm kayar (uzanma — ekleme kayması gibi),
      // köprücük yeniden yazılır. ⚠️ 1. sürüm erişim dışında düzeltmeyi atlıyordu: kemik yine uzuyor, açılıp kapanma sıçratıyordu.
      let RuK = Ru;
      {
        const Lf0 = K * a0l.length(), Lu2 = d.distanceTo(om);
        let uzak = om.distanceTo(bilek);
        const acik = uzak - (Lu2 + Lf0 - 0.05);
        if (acik > 0) {
          const kay = Math.min(6, acik);
          om = om.clone().addScaledVector(bilek.clone().sub(om).normalize(), kay); uzak = om.distanceTo(bilek);
          const pc = noktaG('clavicle_' + t), a0c = P0('upperarm_' + t).clone().sub(P0('clavicle_' + t)), hc = om.clone().sub(pc);
          yaz(i('clavicle_' + t), afin(pc, esle(a0c.clone().normalize(), Y0, hc.clone().normalize(), g), a0c.clone().normalize(), hc.length() / (K * a0c.length()), P0('clavicle_' + t)));
          (tani.uzanma ??= {})[k] = +kay.toFixed(1);
        }
        if (Math.abs(bilek.distanceTo(d) - Lf0) > 0.02 || acik > 0) {
          const L = bilek.clone().sub(om).normalize(), dik2 = dikBilesen(d.clone().sub(om), L);
          const kut = dik2.lengthSq() > 1e-6 ? dik2 : dikBilesen(V(yon['bukum' + k]).negate(), L);
          const d2 = V(M.ik2(om.toArray(), bilek.toArray(), Lu2, Lf0, kut.toArray()).dirsek);
          RuK = new T.Quaternion().setFromUnitVectors(d.clone().sub(om).normalize(), d2.clone().sub(om).normalize()).multiply(Ru);
          yaz(i('upperarm_' + t), afin(om, RuK, a0u.clone().normalize(), Lu2 / (K * a0u.length()), P0('upperarm_' + t)));
          (tani.dirsekDuzelt ??= {})[k] = +d.distanceTo(d2).toFixed(1);
          d = d2;
        }
      }
      const oL = bilek.clone().sub(d);
      let Rl = new T.Quaternion().setFromUnitVectors(onKol0(t).applyQuaternion(RuK), oL.clone().normalize()).multiply(RuK);
      if (Rh) {
        const qd = Rh.clone().multiply(Rl.clone().invert()), ax = oL.clone().normalize();
        const pr = ax.clone().multiplyScalar(new T.Vector3(qd.x, qd.y, qd.z).dot(ax));
        const burulma = new T.Quaternion(pr.x, pr.y, pr.z, qd.w).normalize();
        if (globalThis.__avucDbg) (tani.onKolBur ??= {})[k] = Math.round(2 * Math.atan2(new T.Vector3(burulma.x, burulma.y, burulma.z).dot(ax), burulma.w) * 180 / Math.PI);
        Rl = new T.Quaternion().slerp(burulma, 0.65).multiply(Rl);
        // bilek açısı: ön kol ile parmak yönü arasındaki büküm (doğal sınır ~70°)
        const parmakY = EL0[t].parmak.clone().applyQuaternion(Rh);
        tani.bilekAci[k] = Math.round(THREE_DEG * Math.acos(Math.max(-1, Math.min(1, parmakY.dot(oL.clone().normalize())))));
      }
      yaz(i('lowerarm_' + t), afin(d, Rl, a0l.clone().normalize(), oL.length() / (K * a0l.length()), P0('lowerarm_' + t)));
      yaz(i('hand_' + t), Ael);
      // EL KİPLERİ (2. tur, Sabri: "avuçla basmadığı zaman parmaklar daha yumuşak ve eğimli olmalı"):
      //   kavra   tutamak tutan el (kavrama pozu)
      //   bas     avuçla yere/sehpaya BASAN el (`zemin`, normal yok, `duz` yok) — parmaklar avuç düzleminde DÜZ
      //   yasla   yüzeye YASLANAN el (gövdeye kendiliğinden temas ya da `zemin.duz`: mekikte uyluk) — hafif gevşek (düz ↔ rahat %30; %50'de parmak uçları uyluğa 2–4 cm giriyordu)
      //   rahat   havadaki ve nesneyi saran el (goblet: `zemin.n`)
      // ⚠️ 0.17.1 yaslanan eli tamamen düz yapmıştı (kıvrık parmaklar bacağa giriyordu) → tahta gibi sertti.
      const zmK = s.hedef?.[k]?.zemin;
      const elKip = eksen ? 'kavra' : !temasDurum[k] ? 'rahat' : zmK && !zmK.n && !zmK.duz ? 'bas' : zmK?.n && !zmK.duz ? 'rahat' : 'yasla';
      // basan el yüzeyden kalkınca (bird dog'da uzanan el veride `zemin.kalkis` = avucun yüzeyden yüksekliği) parmaklar düzden gevşeğe
      // geçer (0 → 4 cm). ⚠️ 1. sürüm yüksekliği YERDEN ölçtü: sehpaya basan el (tek kol kürek) kıvrılıp sehpaya 3 cm girdi.
      const basYuk = elKip === 'bas' ? Math.min(1, Math.max(0, (zmK.kalkis ?? 0) / 4)) : 0;
      (tani.elKip ??= {})[k] = elKip;
      for (const j of elAltindakiler(t)) {
        const duzM = () => duzParmak(sk.bones[j].name.split('_')[0], t).clone().multiply(B0[j]);
        yaz(j, Ael, (elKip === 'kavra' ? kavramaKur(Math.max(0.01, Math.min(0.035, tutulan.r / K))).kavrama[t].get(j)
          : elKip === 'bas' ? (basYuk > 0 ? matrisKaris(duzM(), RAHAT[t].get(j) ?? B0[j], basYuk) : duzM()) : elKip === 'yasla' ? matrisKaris(duzM(), RAHAT[t].get(j) ?? B0[j], 0.3) : RAHAT[t].get(j)) || B0[j]);
      }
    }
    dqGuncelle();
    {
      // kol kalkışı (gövdenin aşağı yönüne göre): 40° altında 0, 130°'de en çok 1,6 cm (sağ/sol model kemiğinden)
      const asagi = g.clone().negate();
      ['r', 'l'].forEach((t, sd) => {
        const om = new T.Vector3().setFromMatrixPosition(sk.bones[i('upperarm_' + t)].matrixWorld);
        const dr = new T.Vector3().setFromMatrixPosition(sk.bones[i('lowerarm_' + t)].matrixWorld);
        const kalkis = Math.acos(Math.max(-1, Math.min(1, dr.clone().sub(om).normalize().dot(asagi)))) * 180 / Math.PI;
        DQU.uDeltOmuz.value[sd].copy(om); DQU.uDeltDirsek.value[sd].copy(dr);
        DQU.uDeltMiktar.value[sd] = globalThis.__deltYok ? 0 : 2.2 * Math.min(1, Math.max(0, (kalkis - 35) / 85));
        (tani.deltoid ??= {})[t] = +DQU.uDeltMiktar.value[sd].toFixed(2);
      });
    }
    mushUygula();
    tani.elEl = V(s.eA).distanceTo(V(s.eB));
    sonuc.sonTani = tani;
    // Kas tekdüzenleri
    const kk = mesh.material.userData.u;
    kk.uNabiz.value = ayar.nabiz ?? 1;
    for (const v of kk.uKasK.value) v.set(0, 0, 0, 0);
    for (const b of kk.uKasB.value) b.set(-9, 9);
    const tanim = ayar.kas && P.HAREKET_KAS[ayar.id];
    // EVRE (8 Eki akşam, Sabri: "kas vurgusu güç harcarken yansın, bırakırken sönsün"): motor.js kasEvresi → 0…1
    const evre = ayar.kasGuc ?? 1;
    if (tanim && evre > 0.005) {
      const TARAF = tarafi(yon.ters), yanlar = tanim[2]?.taraf ? [tanim[2].taraf] : ['A', 'B'];
      // kasYan (kardiyo, 16 Eki): kas ve taraf başına etkinlik 0…1; taraflı olmayan kemikte (göğüs, kalça, bel) iki tarafın büyüğü
      const yanK = (anahtar, k, tarafli) => { const y = ayar.kasYan; if (!y) return 1;
        return tarafli ? (y[k]?.[anahtar] ?? 0) : Math.max(y.A?.[anahtar] ?? 0, y.B?.[anahtar] ?? 0); };
      const isle = (anahtar, guc) => {
        for (const [kemik, yonAd, carpan, aralik] of KEMIK_KAS[anahtar] ?? []) { const tarafli = kemik.includes('{t}') || yonAd?.includes('{K}'); for (const k of tarafli ? yanlar : ['A']) {
          const j = i(kemik.replace('{t}', TARAF[k])), deger = guc * carpan * evre * yanK(anahtar, k, tarafli), v = kk.uKasK.value[j];
          if (j < 0 || v.w >= deger) continue;
          const y = yonAd ? yon[yonAd.replace('{K}', k)] : [0, 0, 0];
          v.set(y[0], y[1], y[2], deger);
          kk.uKasB.value[j].set(...(globalThis.__kasAralikYok ? [-9, 9] : aralik ?? [-9, 9]));
        } }
      };
      tanim[0].forEach(x => isle(x, 1));
      tanim[1].forEach(x => isle(x, 0.42));
    }
  }
  /** KAVRAMA DENETİMİ: parmak ucu (03 kemiğine en çok bağlı köşeler) ve avuç → bar ekseni uzaklığı (cm).
   * İyi kavrama: uçlar barın çevresinde (≤ r + 3,5 cm) ve avuç-bar ≤ r + 3 cm. */
  const ucKoseleri = {};
  {
    const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    for (const t of ['r', 'l']) for (const p of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      const j3 = i(`${p}_03_${t}`), L = [];
      for (let v = 0; v < si.count; v++) { let w = 0; for (let c = 0; c < 4; c++) if (si.getComponent(v, c) === j3) w += sw.getComponent(v, c); if (w > 0.8) L.push(v); }
      ucKoseleri[t + p] = L.filter((_, q) => q % 3 === 0);
    }
  }
  function kavramaOlc() {
    const o = {}, tn = sonuc.sonTani; if (!tn?.cubuk) return o;
    const v = new T.Vector3();
    for (const [k, c] of Object.entries(tn.cubuk)) {
      const A = V(c.a), B = V(c.b), AB = B.clone().sub(A), L2 = AB.lengthSq();
      const uz = q => { const u = Math.max(0, Math.min(1, q.clone().sub(A).dot(AB) / L2)); return A.clone().addScaledVector(AB, u).distanceTo(q); };
      const r = {};
      for (const p of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
        const L = ucKoseleri[c.taraf + p]; if (!L.length) continue;
        let toplam = 0; for (const vi of L) { v.fromBufferAttribute(mesh.geometry.attributes.position, vi); mesh.applyBoneTransform(vi, v); toplam += uz(v); }
        r[p] = +(toplam / L.length - c.r).toFixed(1);
      }
      o[k] = r;
    }
    return o;
  }
  /** Ölçüm için ekran kartındaki derinin İŞLEMCİ kopyası (LBS + kol bölgesinde DQS karışımı). ⚠️ three'nin
   *  applyBoneTransform'u yalnız doğrusal bağlamayı bilir; DQS'yi ölçmek için bu kullanılmalı. */
  const _r = new T.Vector4(), _d = new T.Vector4(), _r0 = new T.Vector4();
  const dqDon = (q, v) => { const u = new T.Vector3(q.x, q.y, q.z), c = new T.Vector3().crossVectors(u, v).addScaledVector(v, q.w);
    return v.clone().add(new T.Vector3().crossVectors(u, c).multiplyScalar(2)); };
  function deriKonum0(k, v) {
    const orj = v.clone(); mesh.applyBoneTransform(k, v);
    if (!DQU.uDqAcik.value) return v;
    const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight;
    let w = 0; for (let c = 0; c < 4; c++) w += sw.getComponent(k, c) * DQU.uDqMaske.value[si.getComponent(k, c)];
    if (w < 0.001) return v;
    _r.set(0, 0, 0, 0); _d.set(0, 0, 0, 0); _r0.copy(DQU.uDqR.value[si.getComponent(k, 0)]);
    for (let c = 0; c < 4; c++) { const b = si.getComponent(k, c), x = sw.getComponent(k, c);
      const r = DQU.uDqR.value[b].clone(), d = DQU.uDqD.value[b].clone(); if (r.dot(_r0) < 0) { r.negate(); d.negate(); }
      _r.addScaledVector(r, x); _d.addScaledVector(d, x); }
    const l = _r.length(); _r.divideScalar(l); _d.divideScalar(l);
    const rv = new T.Vector3(_r.x, _r.y, _r.z), dv = new T.Vector3(_d.x, _d.y, _d.z);
    const t = dv.clone().multiplyScalar(_r.w).sub(rv.clone().multiplyScalar(_d.w)).add(new T.Vector3().crossVectors(rv, dv)).multiplyScalar(2);
    const pDq = dqDon(_r, orj.multiplyScalar(K)).add(t);
    v.lerp(pDq, w);
    const dl = mesh.geometry.attributes.aDelt;
    if (dl) for (let sd = 0; sd < 2; sd++) { const a = dl.getComponent(k, sd) * DQU.uDeltMiktar.value[sd]; if (a <= 0) continue;
      const om = DQU.uDeltOmuz.value[sd], ax = DQU.uDeltDirsek.value[sd].clone().sub(om).normalize(), d = v.clone().sub(om);
      const dk = d.sub(ax.multiplyScalar(d.dot(ax))); if (dk.lengthSq() > 1e-4) v.addScaledVector(dk.normalize(), a); }
    return v;
  }
  /** Ölçüm kopyası + Delta Mush ofseti (ham=true: ofsetsiz bağlanmış konum — mushUygula'nın girdisi). */
  function deriKonum(k, v, ham = false) {
    deriKonum0(k, v);
    if (ham || !DQU.uMushAcik.value) return v;
    const mi = mesh.geometry.attributes.aMushI.getX(k);
    if (mi > 0.5) { const g = mi - 1, o = 8 * MUSH_W * Math.floor(g / MUSH_W) + 4 * (g % MUSH_W); v.x += MUSH.veri[o]; v.y += MUSH.veri[o + 1]; v.z += MUSH.veri[o + 2]; }
    return v;
  }
  /** Delta Mush'ı uygula (her kare, deltoidden sonra). Bağlanmış konum ekran kartıyla aynı hesaptan (deriKonum0). */
  const _mP = new Float32Array(MUSH.G * 3), _mF = new Float32Array(9), _mv = new T.Vector3();
  function mushUygula() {
    const acik = !globalThis.__mushYok;   // 7 Eki: varsayılan AÇIK (ölçüm: lat tepesi katlanma 33→18, pres 6→0)
    DQU.uMushAcik.value = acik ? 1 : 0; DQU.uMushTex.value = MUSH.doku;
    if (!acik) return;
    const t0 = performance.now();
    const pos = mesh.geometry.attributes.position, { G, temsil, maske, fark, veri } = MUSH;
    for (let g = 0; g < G; g++) { _mv.fromBufferAttribute(pos, temsil[g]); deriKonum0(temsil[g], _mv); _mP[3 * g] = _mv.x; _mP[3 * g + 1] = _mv.y; _mP[3 * g + 2] = _mv.z; }
    const t1 = performance.now();
    const Q = MUSH.yumusat(_mP), N = MUSH.normaller(Q), S = new Float32Array(G * 3);
    for (let g = 0; g < G; g++) {
      MUSH.cerceve(Q, N, g, _mF);
      const a = K * fark[3 * g], b = K * fark[3 * g + 1], c = K * fark[3 * g + 2];   // dinlenme metre → sahne cm
      S[3 * g] = Q[3 * g] + a * _mF[0] + b * _mF[3] + c * _mF[6];
      S[3 * g + 1] = Q[3 * g + 1] + a * _mF[1] + b * _mF[4] + c * _mF[7];
      S[3 * g + 2] = Q[3 * g + 2] + a * _mF[2] + b * _mF[5] + c * _mF[8];
    }
    const NS = MUSH.normaller(S);
    for (let g = 0; g < G; g++) {
      const w = maske[g], o = 8 * MUSH_W * Math.floor(g / MUSH_W) + 4 * (g % MUSH_W), o2 = o + 4 * MUSH_W;
      veri[o] = w * (S[3 * g] - _mP[3 * g]); veri[o + 1] = w * (S[3 * g + 1] - _mP[3 * g + 1]); veri[o + 2] = w * (S[3 * g + 2] - _mP[3 * g + 2]);
      veri[o2] = NS[3 * g]; veri[o2 + 1] = NS[3 * g + 1]; veri[o2 + 2] = NS[3 * g + 2]; veri[o2 + 3] = w;
    }
    MUSH.doku.needsUpdate = true;
    MUSH.sure = { deri: +(t1 - t0).toFixed(2), toplam: +(performance.now() - t0).toFixed(2), G };
  }
  // Dışarıya verilen güncellemeler kemik dokusunu da tazeler: çizimden önce çağrılan son iş budur
  const sonuc = { nesne, mesh, sac, tur, kemikler: adlar, GOVDE_KESIT, EL_OFSET, sonTani: null, kavramaOlc, deriKonum, MUSH, elTemas, tutulanEksen,
    guncelle: (s, ayar) => { guncelle(s, ayar); kemikDokusuDoldur(DQU); },
    dqGuncelle: () => { dqGuncelle(); kemikDokusuDoldur(DQU); } };
  return sonuc;
}

/* ── SAÇ (13 Eki, avatar — mokapta olgunlaştı, Sabri onaylı) ──────────────────────────────────────────────
   Kil üslubuna uygun YONTULMUŞ saç: kafanın kendi yüzeyinden türer (başa bağlı köşeler, saç çizgisinin üstü, normal
   boyunca kalınlık) + kadında topuz. Kafa kemiğine tam bağlı → kafayla hareket eder. Saç çizgisini KESEN üçgenler tam
   çizgiden kesilir (bütün üçgen seçmek kenarı testere dişi yapıyordu); kenarda kalınlık 0 (deriyle birleşir). Kulak
   üstü ÖLÇÜLÜR (sabit %66 kadında 3 cm açık bırakıyordu): saç kulağın 1,2 cm üstünden başlar. */
const SAC_STILI = {
  // 14 Eki (Sabri): kadınlarda alın çizgisi "yüksek" (mokap: kask görüntüsü kalkar) · yan saç hiçbir avatarda kulağın 1,2 cm
  // üstünden yukarıda değil (Leo, Max, Nora'da kulak çevresi boştu; Mia'nınki düzeltilmişti) · ense biraz iner
  // ERKEK KESİMİ (14 Eki, Sabri: "erkeklerin saçı topuzsuz kadın saçıyla aynı tip olmuş, daha erkeksi yap"): üstte hacim
  // (kalin), yanlar ve ense KISA — kafa boyunun %66'sının altında kalınlık yanKalin oranına iner — ve kulak önünde favori
  erkek:       { kalin: 0.013, on: 0.76, yan: 0.5, ense: 0.27, topuz: 0, yanKalin: 0.2, favori: 0.022, sakak: 0.012 },
  C:           { kalin: 0.013, on: 0.76, yan: 0.5, ense: 0.27, topuz: 0, yanKalin: 0.2, favori: 0.022, sakak: 0.012 },
  kadin:       { kalin: 0.014, on: 0.79, yan: 0.5, ense: 0.2, topuz: 0.058 },
  yasli_erkek: { kalin: 0.009, on: 0.84, yan: 0.5, ense: 0.27, topuz: 0, yanKalin: 0.3, favori: 0.015, sakak: 0.018 },
  yasli_kadin: { kalin: 0.013, on: 0.8, yan: 0.5, ense: 0.2, topuz: 0.055 },
};
function sacKur(mesh, ayar) {
  const g = mesh.geometry, pos = g.attributes.position, nor = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const bas = mesh.skeleton.bones.findIndex(b => b.name === 'head');
  if (bas < 0) return null;
  const basAg = j => { let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(j, k) === bas) w += sw.getComponent(j, k); return w; };
  const secili = new Uint8Array(pos.count), kafa = [];
  for (let j = 0; j < pos.count; j++) if (basAg(j) >= 0.6) { secili[j] = 1; kafa.push(j); }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const j of kafa) { const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const H = y1 - y0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, yD = (z1 - z0) / 2, yG = (x1 - x0) / 2;
  // saç çizgisi: önde alın (on), yanda (yan), arkada ense — modelin önü +z
  const yum = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  let kulakUst = -Infinity;
  // ⚠️ 14 Eki: eşik 0,85'ti — geniş kafada KAFATASININ ÜST YANI da o dilime giriyor, "kulak üstü" 2–3 cm yüksek bulunuyordu
  //    (ölçüldü: kulak üstü/kafa boyu 0,85 → Leo 0,62 · Max 0,64 · Nora 0,67 · Mia 0,52; 0,93 → hepsi 0,51–0,56). Leo, Max, Nora'da kulak çevresi boştu.
  for (const j of kafa) if (Math.abs(pos.getX(j) - cx) > 0.93 * yG) kulakUst = Math.max(kulakUst, pos.getY(j));
  const yanY = Math.min(y0 + ayar.yan * H, kulakUst + 0.012);
  const cizgi = (x, z) => { const f = Math.max(-1, Math.min(1, (z - cz) / yD));
    // şakak (erkekte): alın çizgisi şakaklarda hafif geri çekilir → M biçimi
    const sak = ayar.sakak ? ayar.sakak * yum(0.3, 0.55, Math.abs(x - cx) / yG) * (1 - yum(0.7, 0.85, Math.abs(x - cx) / yG)) * Math.max(0, f) : 0;
    return (f >= 0 ? yanY + (y0 + ayar.on * H - yanY) * f : yanY + (y0 + ayar.ense * H - yanY) * -f) + sak; };
  const kulakli = (x, z) => { const c = cizgi(x, z), ust = kulakUst + 0.012, fz = (z - cz) / yD;
    const k = c < ust ? c + (ust - c) * yum(0.66, 0.82, Math.abs(x - cx) / yG) * yum(-0.6, -0.2, -Math.abs(fz)) : c;
    // favori: kulağın önünde, yanağa doğru inen dar şerit
    return ayar.favori ? k - ayar.favori * yum(0.72, 0.86, Math.abs(x - cx) / yG) * yum(0.1, 0.18, fz) * (1 - yum(0.3, 0.4, fz)) : k; };
  const kisa = j => ayar.yanKalin ? ayar.yanKalin + (1 - ayar.yanKalin) * yum(0.66, 0.82, (pos.getY(j) - y0) / H) : 1;
  const D = new Float32Array(pos.count).fill(-1);
  for (const j of kafa) D[j] = pos.getY(j) - kulakli(pos.getX(j), pos.getZ(j));
  const kalinlik = d => ayar.kalin * Math.min(1, Math.pow(Math.max(0, d) / (0.12 * H), 0.7));
  const P = [], I = [], koseNo = new Int32Array(pos.count).fill(-1), kenarNo = new Map();
  const kose = j => { if (koseNo[j] < 0) { const k = kalinlik(D[j]) * kisa(j); koseNo[j] = P.length / 3;
    P.push(pos.getX(j) + nor.getX(j) * k, pos.getY(j) + nor.getY(j) * k, pos.getZ(j) + nor.getZ(j) * k); } return koseNo[j]; };
  const kenar = (a, b) => { const k = a < b ? a * 1e6 + b : b * 1e6 + a;
    if (!kenarNo.has(k)) { const t = D[a] / (D[a] - D[b]); kenarNo.set(k, P.length / 3);
      P.push(pos.getX(a) + (pos.getX(b) - pos.getX(a)) * t, pos.getY(a) + (pos.getY(b) - pos.getY(a)) * t, pos.getZ(a) + (pos.getZ(b) - pos.getZ(a)) * t); }
    return kenarNo.get(k); };
  const idx = g.index;
  for (let t = 0; t < idx.count; t += 3) {
    const v = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
    if (!secili[v[0]] || !secili[v[1]] || !secili[v[2]]) continue;
    const ic = v.map(k => D[k] >= 0), n = ic.filter(Boolean).length;
    if (n === 0) continue;
    if (n === 3) { I.push(kose(v[0]), kose(v[1]), kose(v[2])); continue; }
    // döndür: n = 1 → içerdeki ilk sırada · n = 2 → dışarıdaki son sırada (sarım yönü korunur)
    let rr = 0; while (n === 1 ? !ic[rr] : ic[(rr + 2) % 3]) rr++;
    const [a, b, c] = [v[rr], v[(rr + 1) % 3], v[(rr + 2) % 3]];
    if (n === 1) I.push(kose(a), kenar(a, b), kenar(a, c));
    else I.push(kose(a), kose(b), kenar(b, c), kose(a), kenar(b, c), kenar(a, c));
  }
  if (ayar.topuz) {                                                             // topuz: başın arka-üstünde
    const kure = new T.SphereGeometry(ayar.topuz, 28, 18), kp = kure.attributes.position, ki = kure.index, o = P.length / 3;
    const merkez = [cx, y0 + 0.74 * H, z0 - ayar.topuz * 0.15];
    for (let j = 0; j < kp.count; j++) P.push(merkez[0] + kp.getX(j) * 1.05, merkez[1] + kp.getY(j) * 0.9, merkez[2] + kp.getZ(j) * 0.85);
    for (let t = 0; t < ki.count; t++) I.push(ki.getX(t) + o);
  }
  const geo = new T.BufferGeometry(), n = P.length / 3;
  geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  geo.setIndex(new T.BufferAttribute(new Uint32Array(I), 1));
  const SI = new Float32Array(n * 4), SW = new Float32Array(n * 4);
  for (let j = 0; j < n; j++) { SI[j * 4] = bas; SW[j * 4] = 1; }
  geo.setAttribute('skinIndex', new T.BufferAttribute(SI, 4));
  geo.setAttribute('skinWeight', new T.BufferAttribute(SW, 4));
  geo.computeVertexNormals();
  // parlaklık payı düşük (0,15): beyaz parlaklık koyu saçı grileştiriyordu (mokapta ölçüldü)
  const mat = new T.MeshPhysicalMaterial({ color: 0x3b2a20, roughness: 0.78, metalness: 0, sheen: 0.15, sheenRoughness: 0.6, sheenColor: 0xffffff });
  const sac = new T.SkinnedMesh(geo, mat);
  sac.bind(mesh.skeleton, mesh.bindMatrix);
  sac.userData.sac = true;
  sac.castShadow = true; sac.receiveShadow = !!globalThis.__kendiGolge; sac.frustumCulled = false;
  return sac;
}

/* ── YÜZ AYRINTISI (14 Eki, DENEME) ─────────────────────────────────────────────────────────────────────────────
   Sabri: "kadınlar daha güzel ve alımlı olmalı; yüzleri kadınımsı". Ölçüldü: MakeHuman'ın göz küreleri yardımcı ağdır ve
   dışa aktarımda silinir → GÖZ YUVALARI BOŞ (açık zeminde beyaz, koyuda kara delik; dört gövdede de). Kaş ve dudak rengi de
   yok. Saç gibi KAFA YÜZEYİNDEN türer ve kafa kemiğine bağlanır: göz ve ağız açıklıkları ağın SINIR KENARLARINDAN bulunur
   (tek üçgene ait kenar), kaş/göz çizgisi/dudak o açıklıklara göre çizilen bölgelerden ince kabuk olarak kesilir. */
const YUZ_STILI = {
  C:           { iris: 0x4a3426, kas: 0x2e2119, kasKalin: 0.0034, kasY: 0.011, cizgi: 0, dudak: [0.9, 0.7, 0.68] },
  erkek:       { iris: 0x4a3426, kas: 0x2e2119, kasKalin: 0.0034, kasY: 0.011, cizgi: 0, dudak: [0.9, 0.7, 0.68] },
  kadin:       { iris: 0x5a3a24, kas: 0x2e2119, kasKalin: 0.0026, kasY: 0.012, cizgi: 1, dudak: [0.86, 0.5, 0.52] },
  yasli_erkek: { iris: 0x4f5b63, kas: 0x9a958e, kasKalin: 0.0034, kasY: 0.011, cizgi: 0, dudak: [0.88, 0.7, 0.68] },
  yasli_kadin: { iris: 0x4f5b63, kas: 0x8d877f, kasKalin: 0.0024, kasY: 0.012, cizgi: 0.7, dudak: [0.86, 0.6, 0.6] },
};
/** Bölge kabuğu: D > 0 olan köşelerin üçgenleri, D = 0 çizgisinden kesilerek (sacKur ile aynı kesim), normal boyunca kalınlıkla */
function kabukGeo(g, secili, D, kalinlik) {
  const pos = g.attributes.position, nor = g.attributes.normal, idx = g.index;
  const P = [], I = [], koseNo = new Int32Array(pos.count).fill(-1), kenarNo = new Map();
  const kose = j => { if (koseNo[j] < 0) { const k = kalinlik(D[j]); koseNo[j] = P.length / 3;
    P.push(pos.getX(j) + nor.getX(j) * k, pos.getY(j) + nor.getY(j) * k, pos.getZ(j) + nor.getZ(j) * k); } return koseNo[j]; };
  const kenar = (a, c) => { const k = a < c ? a * 1e6 + c : c * 1e6 + a;
    if (!kenarNo.has(k)) { const t = D[a] / (D[a] - D[c]), k0 = kalinlik(0); kenarNo.set(k, P.length / 3);
      P.push(pos.getX(a) + (pos.getX(c) - pos.getX(a)) * t + nor.getX(a) * k0, pos.getY(a) + (pos.getY(c) - pos.getY(a)) * t + nor.getY(a) * k0,
        pos.getZ(a) + (pos.getZ(c) - pos.getZ(a)) * t + nor.getZ(a) * k0); }
    return kenarNo.get(k); };
  for (let t = 0; t < idx.count; t += 3) {
    const v = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
    if (!secili[v[0]] || !secili[v[1]] || !secili[v[2]]) continue;
    const ic = v.map(k => D[k] >= 0), n = ic.filter(Boolean).length;
    if (n === 0) continue;
    if (n === 3) { I.push(kose(v[0]), kose(v[1]), kose(v[2])); continue; }
    let rr = 0; while (n === 1 ? !ic[rr] : ic[(rr + 2) % 3]) rr++;
    const [a, c, e] = [v[rr], v[(rr + 1) % 3], v[(rr + 2) % 3]];
    if (n === 1) I.push(kose(a), kenar(a, c), kenar(a, e));
    else I.push(kose(a), kose(c), kenar(c, e), kose(a), kenar(c, e), kenar(a, e));
  }
  return { P, I };
}
function basaBagla(mesh, bas, P, I, mat, renkler = null) {
  const geo = new T.BufferGeometry(), n = P.length / 3;
  geo.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  geo.setIndex(new T.BufferAttribute(new Uint32Array(I), 1));
  if (renkler) geo.setAttribute('color', new T.Float32BufferAttribute(renkler, 3));
  const SI = new Float32Array(n * 4), SW = new Float32Array(n * 4);
  for (let j = 0; j < n; j++) { SI[j * 4] = bas; SW[j * 4] = 1; }
  geo.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new T.BufferAttribute(SW, 4));
  geo.computeVertexNormals();
  const o = new T.SkinnedMesh(geo, mat); o.bind(mesh.skeleton, mesh.bindMatrix);
  o.userData.yuz = true; o.frustumCulled = false; return o;
}
function yuzKur(mesh, ayar) {
  const g = mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, idx = g.index;
  const bas = mesh.skeleton.bones.findIndex(b => b.name === 'head');
  if (bas < 0 || !idx) return null;
  const basAg = j => { let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(j, k) === bas) w += sw.getComponent(j, k); return w; };
  const secili = new Uint8Array(pos.count); for (let j = 0; j < pos.count; j++) if (basAg(j) >= 0.5) secili[j] = 1;
  // SINIR KENARLARI: bütün ağda tek üçgene ait kenar; iki ucu da kafada olanlar → bağlı bileşenler (göz, göz, ağız)
  const say = new Map();
  for (let t = 0; t < idx.count; t += 3) for (let e = 0; e < 3; e++) {
    const a = idx.getX(t + e), c = idx.getX(t + (e + 1) % 3), k = a < c ? a * 1e6 + c : c * 1e6 + a; say.set(k, (say.get(k) ?? 0) + 1); }
  const ata = new Map(), bul = x => { while (ata.get(x) !== x) { ata.set(x, ata.get(ata.get(x))); x = ata.get(x); } return x; };
  for (const [k, n] of say) { if (n !== 1) continue; const a = Math.floor(k / 1e6), c = k % 1e6;
    if (!secili[a] || !secili[c]) continue; for (const x of [a, c]) if (!ata.has(x)) ata.set(x, x); ata.set(bul(a), bul(c)); }
  const gruplar = new Map(); for (const x of ata.keys()) { const r = bul(x); if (!gruplar.has(r)) gruplar.set(r, []); gruplar.get(r).push(x); }
  const halka = [...gruplar.values()].filter(v => v.length >= 6).map(v => {
    const c = [0, 1, 2].map(i => v.reduce((s, j) => s + pos.getComponent(j, i), 0) / v.length);
    const ek = i => [Math.min(...v.map(j => pos.getComponent(j, i))), Math.max(...v.map(j => pos.getComponent(j, i)))];
    return { v, c, x: ek(0), y: ek(1), z: ek(2) }; });
  globalThis.__yuzHalka = halka.map(h => ({ n: h.v.length, c: h.c.map(x => +x.toFixed(4)), x: h.x, y: h.y }));   // TANI
  if (halka.length < 3) return null;
  // ⚠️ Doku dikişlerinde köşeler İKİZDİR (aynı yer, iki kimlik) → dikiş de "sınır" görünür ve her açıklık iki kez gelir
  //    (ölçüldü: orta hat dikişi, ağız içi). Göz: her yanda en öndeki (z) yüksek halka · ağız: ortada, gözün altında EN ÖNDEKİ.
  const goz = s => halka.filter(h => Math.sign(h.c[0]) === s && Math.abs(h.c[0]) > 0.015 && h.x[1] - h.x[0] < 0.04)
    .sort((a, b) => b.c[2] - a.c[2] || b.c[1] - a.c[1])[0];
  const gozler = [goz(1), goz(-1)].filter(Boolean);
  if (gozler.length < 2) return null;
  const agiz = halka.filter(h => Math.abs(h.c[0]) < 0.005 && h.c[1] < gozler[0].c[1] - 0.03 && h.c[1] > gozler[0].c[1] - 0.11)
    .sort((a, b) => b.c[2] - a.c[2])[0];
  if (!agiz) return null;
  const ten = mesh.material.color, ogeler = [];
  // GÖZ KÜRESİ: açıklığın arkasında; kutup +z (öne), beyaz · iris · göz bebeği köşe rengiyle
  for (const h of gozler) {
    const R = ayar.gozR ?? 0.0118, mer = [h.c[0], h.c[1] - 0.0004, h.c[2] - R * (ayar.gozGeri ?? 0.78)];
    const kure = new T.SphereGeometry(R, 32, 20); kure.rotateX(Math.PI / 2);
    const kp = kure.attributes.position, P = [], C = [], ir = new T.Color(ayar.iris), ak = new T.Color(0xe9e3da), bb = new T.Color(0x0b0807);
    for (let j = 0; j < kp.count; j++) { const x = kp.getX(j), y = kp.getY(j), z = kp.getZ(j); P.push(mer[0] + x, mer[1] + y, mer[2] + z);
      const cz = z / R, renk = cz > 0.975 ? bb : cz > 0.9 ? ir : ak; C.push(renk.r, renk.g, renk.b); }
    ogeler.push(basaBagla(mesh, bas, P, Array.from(kure.index.array), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }), C));
  }
  const D = new Float32Array(pos.count);
  const kabuk = (Dfn, kal, mat) => { for (let j = 0; j < pos.count; j++) D[j] = secili[j] ? Dfn(pos.getX(j), pos.getY(j), pos.getZ(j)) : -1;
    const { P, I } = kabukGeo(g, secili, D, kal); if (I.length) ogeler.push(basaBagla(mesh, bas, P, I, mat)); };
  // KAŞ ve GÖZ ÇİZGİSİ: YÜZEYE YATIRILMIŞ ŞERİT. ⚠️ Bölge kabuğu burada işe yaramadı (ölçüldü): kaş bandı 3–4 mm, yüzün
  // köşe aralığı ~5 mm → köşelerin çoğu bandın dışında kalıyor, kaş kesik kesik çıkıyordu. Şerit noktaları kafanın ÖNE BAKAN
  // üçgenlerine (xy izdüşümü) oturtulur: z ve normal o üçgenden.
  const onUcgen = []; {
    const y0 = gozler[0].c[1] - 0.03, y1 = gozler[0].c[1] + 0.04, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
    for (let t = 0; t < idx.count; t += 3) { const v = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
      if (!secili[v[0]] || !secili[v[1]] || !secili[v[2]]) continue;
      a.fromBufferAttribute(pos, v[0]); b.fromBufferAttribute(pos, v[1]); c.fromBufferAttribute(pos, v[2]);
      if (Math.max(a.y, b.y, c.y) < y0 || Math.min(a.y, b.y, c.y) > y1) continue;
      n.subVectors(b, a).cross(c.clone().sub(a)).normalize(); if (n.z < 0.2) continue;
      onUcgen.push([a.clone(), b.clone(), c.clone(), n.clone()]); } }
  const yuzey = (x, y, dis) => {                       // (x, y) → deri üstünde, normal boyunca `dis` dışarıda
    let en = null;
    for (const [a, b, c, n] of onUcgen) {
      const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y); if (Math.abs(d) < 1e-12) continue;
      const l1 = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / d, l2 = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / d, l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const z = l1 * a.z + l2 * b.z + l3 * c.z; if (!en || z > en.z) en = { z, n };
    }
    return en ? [x + en.n.x * dis, y + en.n.y * dis, en.z + en.n.z * dis] : null;
  };
  const serit = (ust, alt, mat) => {                   // iki kenar dizisi (aynı uzunluk) → üçgen şerit
    const P = [], I = []; let k = 0;
    for (let i = 0; i < ust.length; i++) { if (!ust[i] || !alt[i]) continue; P.push(...ust[i], ...alt[i]);
      if (k > 0) { const o = 2 * k; I.push(o - 2, o - 1, o, o - 1, o + 1, o); } k++; }
    if (I.length) ogeler.push(basaBagla(mesh, bas, P, I, mat));
  };
  const kasMat = new T.MeshStandardMaterial({ color: ayar.kas, roughness: 0.85, side: T.DoubleSide });
  if (ayar.kasKalin) for (const h of gozler) {
    const dis = Math.sign(h.c[0]), x0 = dis > 0 ? h.x[0] - 0.002 : h.x[1] + 0.002, x1 = dis > 0 ? h.x[1] + 0.008 : h.x[0] - 0.008, N = 28, ust = [], alt = [];
    for (let i = 0; i <= N; i++) { const u = i / N, x = x0 + (x1 - x0) * u;
      const yb = h.y[1] + (ayar.kasY ?? 0.0085) + (ayar.kasKavis ?? 0.0035) * Math.sin(Math.PI * Math.min(1, u * 1.3)) - 0.002 * u;
      const w = ayar.kasKalin * (1 - 0.6 * u) * Math.min(1, u * 8 + 0.35);   // içte küt, dışta sivri
      ust.push(yuzey(x, yb + w, ayar.kasDis ?? 0.0009)); alt.push(yuzey(x, yb - w * 0.7, ayar.kasDis ?? 0.0009)); }
    serit(ust, alt, kasMat);
  }
  // GÖZ ÇİZGİSİ (kadında): üst kapağın kenarı (açıklığın üst yarısı) boyunca; dış köşede biraz kalınlaşır
  if (ayar.cizgi) for (const h of gozler) {
    const dis = Math.sign(h.c[0]), ustK = h.v.filter(j => pos.getY(j) >= h.c[1]).map(j => [pos.getX(j), pos.getY(j)]);
    const tek = new Map(); for (const p of ustK) tek.set(p[0].toFixed(4), p); const kenar = [...tek.values()].sort((a, b) => dis * (a[0] - b[0]));
    const ust = [], alt = [];
    kenar.forEach((p, i) => { const u = i / Math.max(1, kenar.length - 1), w = 0.0011 * ayar.cizgi * (0.5 + u);
      alt.push(yuzey(p[0], p[1] + 0.0002, 0.0006)); ust.push(yuzey(p[0] + dis * 0.0006 * u, p[1] + w, 0.0006)); });
    serit(ust, alt, new T.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.7, side: T.DoubleSide }));
  }
  // DUDAK: ağız açıklığının çevresinde elips (alt dudak dolgun); renk TENDEN türer (ten değişince güncellenir)
  if (ayar.dudak) { const h = agiz, yg = (h.x[1] - h.x[0]) / 2 + 0.003, my = h.c[1];
    const dudakMat = new T.MeshStandardMaterial({ roughness: 0.55 });
    dudakMat.userData.carpan = ayar.dudak;
    dudakMat.color.setRGB(ten.r * ayar.dudak[0], ten.g * ayar.dudak[1], ten.b * ayar.dudak[2]);
    kabuk((x, y, z) => { if (z < h.z[0] - 0.012) return -1; const dy = y - my, hh = dy < 0 ? 0.0088 : 0.0068;
      return 1 - ((x - h.c[0]) / yg) ** 2 - (dy / hh) ** 2; }, () => 0.0004, dudakMat);
    ogeler.at(-1).userData.dudak = true; }
  return ogeler;
}

/** Avatarın görünümü (js/avatar.js cozumle): ten, saç (rengi + var/yok), üst ve alt kıyafet rengi — yeniden kurmadan */
export function gorunumUygula(govde, g) {
  if (!govde || !g) return;
  govde.mesh.material.color.set(g.renk.ten);
  govde.nesne.traverse(o => {
    if (o.userData.giysi === 'ust') o.material.color.set(g.renk.ust);
    if (o.userData.giysi === 'alt') o.material.color.set(g.renk.alt);
  });
  const u = govde.mesh.material.userData.u;                      // kumaş altındaki deri kumaşın rengini alır
  if (u?.uAltRenk) { u.uAltRenk.value.set(g.renk.alt); u.uUstRenk.value.set(g.renk.ust); }
  if (govde.sac) { govde.sac.material.color.set(g.renk.sac); govde.sac.visible = !!g.sacli; }
  govde.nesne.traverse(o => { const c = o.userData.dudak && o.material.userData.carpan;
    if (c) { const t = govde.mesh.material.color; o.material.color.setRGB(t.r * c[0], t.g * c[1], t.b * c[2]); } });
}

/** C = MakeHuman/MPFB2 (CC0). Uygulama kopyası (doku koordinatları atılmış, bkz. glb-incelt.mjs). */
/* AVATAR GÖVDELERİ (13 Eki): dördü AYNI iskelette (tools/govde-uret/govde_cesit.py); C = erkek (Leo) — eski ad korunur */
export const GOVDELER = {
  C: new URL('./govde.glb', import.meta.url).href,
  erkek: new URL('./govde.glb', import.meta.url).href,
  kadin: new URL('./govde-kadin.glb', import.meta.url).href,
  yasli_erkek: new URL('./govde-yasli_erkek.glb', import.meta.url).href,
  yasli_kadin: new URL('./govde-yasli_kadin.glb', import.meta.url).href,
};
/** `gorunum` (avatar.js cozumle) İLK KAREDEN ÖNCE uygulanır — gövde değişince yanlış renkle tek kare bile çizilmez */
export async function motorKur(renderer, { tur = 'C', gorunum = null } = {}) {
  const t = GOVDELER[tur] ? tur : 'C';
  const govde = await govdeYukle(GOVDELER[t], t);
  gorunumUygula(govde, gorunum);
  const motor = P.motorKur(renderer, { govde });
  return Object.assign(motor, { govde });
}
