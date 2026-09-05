"""Kart ikonlarini uygulama paketine uygun boyuta indirir.

Kullanicinin gonderdigi 3D ikonlar 1200 piksel civarinda ve ~1,2 MB;
ekranda 34 piksel gosteriliyorlar. Ucu birden pakete ~3,5 MB
ekliyordu.

Iki adim, ikisi de KAYIPSIZ sayilir:
  1. Saydam kenarlar kirpiliyor - gorunen hicbir piksel gitmiyor.
  2. En buyuk kenar 240 piksele indiriliyor. Retina 3x cizdigi icin
     34 piksellik bir ikon 102 piksel istiyor; 240 ileride kart
     buyurse bile (80 px'e kadar) yetiyor.

Yeniden kosulabilir: zaten kucuk olan dosyayi tekrar kucultmuyor.

    python araclar/ikon-optimize.py mobil/assets/images/profil-ikon-ani.png
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow yok: pip install pillow')

# En buyuk kenarin hedef boyutu.
HEDEF = 240

if len(sys.argv) < 2:
    sys.exit('Kullanim: python araclar/ikon-optimize.py <png> [<png> ...]')

for yol in sys.argv[1:]:
    if not os.path.exists(yol):
        print(f'ATLANDI (yok): {yol}')
        continue

    onceki = os.path.getsize(yol)
    im = Image.open(yol).convert('RGBA')

    kutu = im.getbbox()
    if kutu:
        im = im.crop(kutu)

    if max(im.size) > HEDEF:
        olcek = HEDEF / max(im.size)
        im = im.resize(
            (max(1, round(im.size[0] * olcek)), max(1, round(im.size[1] * olcek))),
            Image.LANCZOS,
        )

    im.save(yol, 'PNG', optimize=True)
    sonraki = os.path.getsize(yol)
    print(f'{os.path.basename(yol)}  {im.size[0]}x{im.size[1]}  '
          f'{onceki / 1024:.0f} KB -> {sonraki / 1024:.0f} KB '
          f'(%{100 - sonraki * 100 // onceki} kucuk)')
