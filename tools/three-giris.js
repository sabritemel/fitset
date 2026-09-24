/**
 * three.js ALT KÜMESİ — js/vendor/three.min.js'in girişi (derleme yok; paket depoda hazır durur).
 *
 * Yeniden üretmek (başka bir klasörde, depoya node_modules sokmadan):
 *   npm i three@0.186.0 esbuild@0.28.2
 *   npx esbuild three-giris.js --bundle --minify --format=esm --legal-comments=none \
 *     "--banner:js=/* three.js r186 (alt küme, esbuild ile paketlendi) — MIT License · Copyright (c) 2010-2026 three.js authors · tam metin: three-LICENSE.txt *\/" \
 *     --outfile=js/vendor/three.min.js
 *   cp node_modules/three/LICENSE js/vendor/three-LICENSE.txt
 * ⚠️ --legal-comments=none MIT bildirimini SİLER — başlık (--banner) bu yüzden şart.
 * Yeni bir three.js sınıfı kullanılacaksa önce buraya eklenir. Ölçüm (24 Eyl): 530 KB / 135 KB gzip.
 */
export {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, Color, Vector3, Quaternion, Matrix4,
  SphereGeometry, CylinderGeometry, LatheGeometry, CircleGeometry, BufferGeometry, Float32BufferAttribute,
  MeshStandardMaterial, MeshBasicMaterial, LineDashedMaterial, Line,
  HemisphereLight, DirectionalLight, AmbientLight,
  Vector2, DoubleSide, PCFShadowMap, SRGBColorSpace, ACESFilmicToneMapping, NoToneMapping,
} from 'three';
