"""
FitSet gövde üreticisi — Blender (taşınabilir 4.5 LTS) + MPFB 2.0.17, EKRANSIZ çalışır.

    blender.exe -b -P tools/govde-uret/govde_uret.py -- <cikti_klasoru> [ayar.json]

Varlıklar: MakeHuman/MPFB sistem varlıkları (temel mesh, hedefler, game_engine iskeleti + ağırlıklar)
— lisans CC0 1.0 (github.com/makehumancommunity/mpfb2/blob/master/LICENSE.ASSETS.md).
MPFB eklentisinin kendisi GPL-3.0'dır ama yalnız ARAÇ olarak çalışır; çıktıya kod girmez.

Çıktı: govde.glb (tek SkinnedMesh + game_engine iskeleti, malzeme/doku yok) + govde.json (künye).
"""
import bpy, sys, os, json, hashlib, datetime

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
CIKTI = os.path.abspath(argv[0] if argv else "govde-cikti")
AYAR = json.load(open(argv[1], encoding="utf-8")) if len(argv) > 1 else {}
os.makedirs(CIKTI, exist_ok=True)

from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.exportservice import ExportService

# Sahneyi temizle (varsayılan küp, kamera, ışık)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# ── Gövde ölçüleri (0..1 makro değerler; MakeHuman anlamıyla) ──────────────────────────────────
# Sabri: "sevimli ama güçlü, karizmatik; iri ve korkutucu değil" → atletik, orta kas, ideal oran
makro = TargetService.get_default_macro_info_dict()
makro.update({
    "gender": AYAR.get("gender", 1.0),        # erkek
    "age": AYAR.get("age", 0.5),              # ~25 yaş
    "muscle": AYAR.get("muscle", 0.68),       # orta üstü kas (0,5 = ortalama) — 6 Eki: 0,62 → 0,68 (Sabri: "çok az kaslı")
    "weight": AYAR.get("weight", 0.48),       # ince-orta
    "proportions": AYAR.get("proportions", 0.65),  # ideal oranlara yakın
    "height": AYAR.get("height", 0.55),       # ~178 cm
})
govde = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True,
                                  feet_on_ground=False, scale=0.1, macro_detail_dict=makro)
# ⚠️ detailed_helpers=True ŞART: iskelet eklemleri `joint-*` köşe gruplarından bulur; False ile parmak kemikleri
#    geometrinin ~2 cm gerisine oturuyordu (6 Eki, ölçüldü).
# ⚠️ feet_on_ground=True gövdeyi zemine taşıyıp transformu UYGULUYOR, iskelet ise sonra eski koordinatlara oturuyor
#    → kemikler gövdeden 0,85 m aşağıda kalıyordu (ölçüldü). Zemine hizalama uygulamadaki yükleyicide yapılır.

# Ek hedefler (yüz/gövde inceltmeleri) — ayar dosyasından: {"hedefler": {"ad": değer}}
# Sabri (6 Eki 20:35): "çok az kaslı, çok az omuzları geniş" → omuz mesafesi + hafif V gövde
# 7 Eki (Sabri): "omuzlar biraz geniş olmuş, çok az daralt · pazılar çok az kalınlaşsın"
HEDEFLER = {"measure-shoulder-dist-incr": 0.0, "torso-vshape-incr": 0.2,
            "l-upperarm-muscle-incr": 0.35, "r-upperarm-muscle-incr": 0.35}
HEDEFLER.update(AYAR.get("hedefler", {}))
for ad, deger in HEDEFLER.items():
    TargetService.load_target(govde, TargetService.target_full_path(ad), weight=deger, name=ad)

# ⚠️ SIRA ÖNEMLİ (6 Eki, ölçüldü): iskelet hedefler pişirilmeden oturtulursa VARSAYILAN gövdeye oturuyor —
#    C'de parmak kemikleri geometrinin ~2 cm gerisinde kaldı, parmaklar yanlış noktadan bükülüp yay çizdi.
#    Önce hedefleri pişir (yardımcı geometri hâlâ yerinde), SONRA iskeleti oturt.
TargetService.bake_targets(govde)

# İskelet: game_engine (UE adlandırması; 53 kemik) + ağırlıklar
iskelet = HumanService.add_builtin_rig(govde, "game_engine", import_weights=True)

# Maske değiştiricisini pişir, yardımcı geometriyi (göz/diş/dil/kıyafet yardımcıları) sil
ExportService.bake_modifiers_remove_helpers(govde, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=False)

# Malzemeleri kaldır (renk/yüzey uygulamada verilir)
govde.data.materials.clear()

# Ölçüler (künye için)
me = govde.data
ucgen = sum(len(p.vertices) - 2 for p in me.polygons)
zs = [v.co.z for v in me.vertices]
boy = (max(zs) - min(zs))

dosya = os.path.join(CIKTI, "govde.glb")
bpy.ops.object.select_all(action="DESELECT")
govde.select_set(True); iskelet.select_set(True)
bpy.context.view_layer.objects.active = iskelet
bpy.ops.export_scene.gltf(filepath=dosya, export_format="GLB", use_selection=True, export_skins=True,
                          export_animations=False, export_morph=False, export_materials="NONE",
                          export_yup=True, export_apply=False, export_texcoords=True, export_normals=True)

with open(dosya, "rb") as f:
    sha = hashlib.sha256(f.read()).hexdigest()
kunye = {
    "uretim": datetime.datetime.now().isoformat(timespec="seconds"),
    "arac": {"blender": bpy.app.version_string, "mpfb": "2.0.17"},
    "lisans": {"varlik": "CC0-1.0", "kaynak": "https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.ASSETS.md"},
    "makro": {k: v for k, v in makro.items() if k != "race"},
    "hedefler": HEDEFLER,
    "iskelet": "game_engine", "kemik": len(iskelet.data.bones),
    "kose": len(me.vertices), "ucgen": ucgen, "boy_m": round(boy, 3),
    "dosya": "govde.glb", "boyut": os.path.getsize(dosya), "sha256": sha,
}
json.dump(kunye, open(os.path.join(CIKTI, "govde.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
_ayak = iskelet.data.bones["foot_r"].head_local
_vg = {g.index: g.name for g in govde.vertex_groups}
def _uzanim(kemik):
    idx = [g.index for g in govde.vertex_groups if g.name == kemik]
    if not idx: return None
    zs = [v.co for v in me.vertices if any(gg.group == idx[0] and gg.weight > 0.5 for gg in v.groups)]
    return len(zs)
_m1 = iskelet.data.bones["middle_01_r"].head_local; _m2 = iskelet.data.bones["middle_02_r"].head_local
kunye["denetim"] = {"ayak_bilegi_z": round(_ayak.z, 3), "govde_zmin": round(min(v.co.z for v in me.vertices), 3),
                    "orta_parmak_segment_cm": round((_m2 - _m1).length * 100, 2)}
json.dump(kunye, open(os.path.join(CIKTI, "govde.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("FITSET_GOVDE", json.dumps(kunye, ensure_ascii=False))
