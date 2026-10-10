"""FitSet logosu — kaynak görselden (Sabri, 9 Eki) vektör + uygulama simgeleri.

  python tools/logo/logo-uret.py

Kaynak: tools/logo/kaynak-logo.png (raster). Beyaz ve mercan bölgeler yumuşak maskeyle ayrılır,
8 kat büyütülüp alt piksel doğruluğunda çizgiye çevrilir. Slogan ("BETTER EVERY SET") kaynakta
yoktur: Archivo (OFL) harfleri çizgiye çevrilerek eklenir.

Üretilenler (hepsi bu betikten — elle düzenlenmez):
  tools/logo/fitset-isaret.svg        yalnız FS işareti
  tools/logo/fitset-logo.svg          işaret + FitSet + slogan (koyu zemin)
  tools/logo/fitset-logo-acik.svg     aynısı açık zemin için
  icons/icon-180.png · icon-192.png · icon-512.png · icon-maskable-512.png
  ../Launcher/frontend/public/logos/fit_harf.png   (Launcher kutusu, şeffaf)
"""
from pathlib import Path

import cv2
import numpy as np
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

KOK = Path(__file__).resolve().parents[2]
LOGO = KOK / 'tools/logo'
OLCEK = 8                       # izleme büyütmesi
ZEMIN = (27, 30, 34)            # --s2 (#1B1E22): --bg'den bir ton açık, koyu duvar kâğıdında kaybolmasın (make-icons kararı)
BEYAZ = '#F6F6F8'
MERCAN = ('#FF6E45', '#F23E3C')  # kaynaktan ölçüldü: sol üst turuncu → sağ alt kırmızı
KOYU_YAZI = '#15181C'

ISARET = (440, 165, 1060, 525)  # x0, y0, x1, y1 (kaynak pikselleri)
KELIME = (400, 548, 1135, 752)
SLOGAN = 'BETTER EVERY SET'


# ── izleme ─────────────────────────────────────────────────────────────────────
def maskeler():
    im = cv2.imread(str(LOGO / 'kaynak-logo.png'))[..., ::-1].astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    hepsi = np.clip((r - 12) / (240 - 12), 0, 1)                 # beyaz ve mercan, ikisinde de kırmızı yüksek
    beyaz = np.clip((np.minimum(g, b) - 70) / (235 - 70), 0, 1)  # mercanda yeşil/mavi ≤ 110
    return beyaz, np.clip(hepsi - beyaz, 0, 1)


def izle(maske, kutu):
    x0, y0, x1, y1 = kutu
    parca = cv2.resize(maske[y0:y1, x0:x1], None, fx=OLCEK, fy=OLCEK, interpolation=cv2.INTER_CUBIC)
    ikili = (parca > 0.5).astype(np.uint8)
    konturlar, _ = cv2.findContours(ikili, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    yollar = []
    for k in konturlar:
        if cv2.contourArea(k) < 30 * OLCEK * OLCEK:   # kenar kırıntıları
            continue
        k = cv2.approxPolyDP(k, 0.9, True)[:, 0, :].astype(np.float64)
        yollar.append(k / OLCEK + (x0, y0))
    return yollar


def yol_d(yollar):
    return ' '.join('M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in k) + ' Z' for k in yollar)


# ── slogan (Archivo, çizgiye çevrilir) ─────────────────────────────────────────
def slogan(merkez_x, taban_y, buyukluk, aralik_em):
    font = instancer.instantiateVariableFont(TTFont(KOK / 'fonts/archivo-latin.woff2'), {'wght': 560, 'wdth': 112})
    cmap, gs = font.getBestCmap(), font.getGlyphSet()
    k = buyukluk / font['head'].unitsPerEm
    genislikler = [gs[cmap[ord(c)]].width * k + aralik_em * buyukluk for c in SLOGAN]
    toplam = sum(genislikler) - aralik_em * buyukluk
    x, parca = merkez_x - toplam / 2, []
    for c, w in zip(SLOGAN, genislikler):
        if c != ' ':
            pen = SVGPathPen(gs)
            gs[cmap[ord(c)]].draw(pen)
            parca.append(f'<path transform="translate({x:.2f} {taban_y:.2f}) scale({k:.5f} {-k:.5f})" d="{pen.getCommands()}"/>')
        x += w
    return ''.join(parca)


def svg(govde, kutu, ac):
    x0, y0, x1, y1 = kutu
    gr = (f'<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1">'
          f'<stop offset="0" stop-color="{MERCAN[0]}"/><stop offset="1" stop-color="{MERCAN[1]}"/></linearGradient></defs>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" '
            f'role="img" aria-label="FitSet">{gr}{govde}</svg>\n').replace('BEYAZ', ac)


# ── raster çizim (simgeler aynı çokgenlerden) ──────────────────────────────────
def boya(kanvas, yollar, renk_fn, donustur, ss):
    h, w = kanvas.shape[:2]
    m = np.zeros((h * ss, w * ss), np.uint8)
    pts = [np.round(donustur(k) * ss).astype(np.int32) for k in yollar]
    cv2.fillPoly(m, pts, 255, lineType=cv2.LINE_AA)
    a = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
    renk = renk_fn(h, w)
    alt = kanvas[..., 3:] / 255
    yeni_a = a + alt * (1 - a)
    kanvas[..., :3] = np.where(yeni_a > 0, (renk * a + kanvas[..., :3] * alt * (1 - a)) / np.maximum(yeni_a, 1e-6), 0)
    kanvas[..., 3:] = yeni_a * 255


def hex2rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def simge(beyaz_y, mercan_y, kenar, doluluk, zemin='yuvarlak'):
    """İşareti kenar×kenar tuvale ortalar; doluluk = işaretin genişliği / kenar.
    zemin: 'yuvarlak' köşeler saydam (tarayıcı, masaüstü) · 'dolu' tam kare (Android maskable) · None saydam."""
    hepsi = np.concatenate(beyaz_y + mercan_y)
    mn, mx = hepsi.min(0), hepsi.max(0)
    olc = kenar * doluluk / (mx - mn)[0]
    kay = np.array([kenar, kenar]) / 2 - (mn + mx) / 2 * olc
    don = lambda k: k * olc + kay  # noqa: E731
    uzak = np.linalg.norm(don(hepsi) - kenar / 2, axis=1).max() / kenar
    kanvas = np.zeros((kenar, kenar, 4), np.float32)
    ss = 8
    if zemin:
        kare = np.zeros((kenar * ss, kenar * ss), np.uint8)
        r = 0 if zemin == 'dolu' else int(kenar * 0.22 * ss)
        cv2.rectangle(kare, (r, 0), (kenar * ss - 1 - r, kenar * ss - 1), 255, -1)
        cv2.rectangle(kare, (0, r), (kenar * ss - 1, kenar * ss - 1 - r), 255, -1)
        for cx, cy in ((r, r), (kenar * ss - 1 - r, r), (r, kenar * ss - 1 - r), (kenar * ss - 1 - r, kenar * ss - 1 - r)):
            if r:
                cv2.circle(kare, (cx, cy), r, 255, -1, lineType=cv2.LINE_AA)
        a = cv2.resize(kare, (kenar, kenar), interpolation=cv2.INTER_AREA).astype(np.float32)
        kanvas[..., :3] = ZEMIN
        kanvas[..., 3] = a
    boya(kanvas, beyaz_y, lambda h, w: hex2rgb(BEYAZ), don, ss)
    # mercan: işaretin kutusu boyunca sol üst → sağ alt geçiş
    mn_m, mx_m = don(np.concatenate(mercan_y)).min(0), don(np.concatenate(mercan_y)).max(0)

    def gecis(h, w):
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        t = ((xx - mn_m[0]) / (mx_m[0] - mn_m[0]) + (yy - mn_m[1]) / (mx_m[1] - mn_m[1])) / 2
        t = np.clip(t, 0, 1)[..., None]
        return hex2rgb(MERCAN[0]) * (1 - t) + hex2rgb(MERCAN[1]) * t
    boya(kanvas, mercan_y, gecis, don, ss)
    return kanvas, uzak


def yaz_png(yol, kanvas):
    k = cv2.cvtColor(np.clip(np.round(kanvas), 0, 255).astype(np.uint8), cv2.COLOR_RGBA2BGRA)
    cv2.imwrite(str(yol), k)
    print('yazıldı', yol.relative_to(KOK.parent), k.shape[1], 'px')


def main():
    beyaz, mercan = maskeler()
    ib, im_ = izle(beyaz, ISARET), izle(mercan, ISARET)
    kb, km = izle(beyaz, KELIME), izle(mercan, KELIME)
    isaret = f'<path fill="BEYAZ" fill-rule="evenodd" d="{yol_d(ib)}"/><path fill="url(#m)" fill-rule="evenodd" d="{yol_d(im_)}"/>'
    kelime = f'<path fill="BEYAZ" fill-rule="evenodd" d="{yol_d(kb)}"/><path fill="url(#m)" fill-rule="evenodd" d="{yol_d(km)}"/>'
    hepsi_x = np.concatenate(ib + im_ + kb + km)[:, 0]
    orta = (hepsi_x.min() + hepsi_x.max()) / 2
    slg = f'<g fill="BEYAZ">{slogan(orta, 800, 31, 0.32)}</g>'

    (LOGO / 'fitset-isaret.svg').write_text(svg(isaret, (440, 165, 1060, 525), BEYAZ), encoding='utf-8')
    tam = (360, 150, 1180, 830)
    (LOGO / 'fitset-logo.svg').write_text(svg(isaret + kelime + slg, tam, BEYAZ), encoding='utf-8')
    (LOGO / 'fitset-logo-acik.svg').write_text(svg(isaret + kelime + slg, tam, KOYU_YAZI), encoding='utf-8')
    print('yazıldı tools/logo/fitset-isaret.svg · fitset-logo.svg · fitset-logo-acik.svg')

    ikon = KOK / 'icons'
    for kenar, ad in ((180, 'icon-180.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
        yaz_png(ikon / ad, simge(ib, im_, kenar, 0.66)[0])
    kanvas, uzak = simge(ib, im_, 512, 0.64, zemin='dolu')
    # Android yalnız merkezdeki %80'lik daireyi (yarıçap 0,40·S) garanti eder
    assert uzak <= 0.40, f'maskable: içerik merkezden {uzak:.3f}·S uzakta (> 0,40)'
    print(f'maskable güvenli alan: en uzak piksel {uzak:.3f}·S (sınır 0,40)')
    yaz_png(ikon / 'icon-maskable-512.png', kanvas)
    launcher = KOK.parent / 'Launcher/frontend/public/logos/fit_harf.png'
    yaz_png(launcher, simge(ib, im_, 530, 0.66, zemin=None)[0])


if __name__ == '__main__':
    main()
