/**
 * three.js C MANKEN ALT KÜMESİ — js/vendor/three-c.min.js'in girişi (derleme yok; paket depoda hazır durur).
 * C çizicisi (js/anim3d/c/) tam three.js'in şu parçalarını ister: deri bağlama (SkinnedMesh), fiziksel malzeme,
 * PMREM ortam ışığı, yumuşak gölge, GLTFLoader, RoomEnvironment. Kapsül yedeği (webgl.js) ayrı alt kümeyi
 * (three.min.js, tools/three-giris.js) kullanır — ikisi aynı anda yüklenmez.
 *
 * Yeniden üretmek (başka bir klasörde, depoya node_modules sokmadan):
 *   npm i three@0.186.0 esbuild@0.28.2
 *   npx esbuild three-c-giris.js --bundle --minify --format=esm --legal-comments=none \
 *     "--banner:js=/* three.js r186 (C manken alt kümesi: çekirdek + GLTFLoader + RoomEnvironment, esbuild ile paketlendi) — MIT License · Copyright (c) 2010-2026 three.js authors · tam metin: three-LICENSE.txt *\/" \
 *     --outfile=js/vendor/three-c.min.js
 * ⚠️ --legal-comments=none MIT bildirimini SİLER — başlık (--banner) bu yüzden şart.
 * Ölçüm (8 Eki): 610 KB / 154 KB gzip. Yeni bir sınıf kullanılacaksa önce buraya eklenir.
 */
export {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, SkinnedMesh, Color, Vector2, Vector3, Vector4, Quaternion, Matrix4,
  BufferGeometry, BufferAttribute, Float32BufferAttribute, SphereGeometry, CylinderGeometry, LatheGeometry, CircleGeometry, PlaneGeometry,
  MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, MeshDepthMaterial, ShadowMaterial,
  HemisphereLight, DirectionalLight, PMREMGenerator, CanvasTexture, DataTexture,
  DoubleSide, FloatType, NearestFilter, RGBAFormat, RGBADepthPacking, SRGBColorSpace, NeutralToneMapping,
  PCFShadowMap, VSMShadowMap,
} from 'three';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
