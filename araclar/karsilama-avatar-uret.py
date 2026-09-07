"""Karsilama ekranindaki igne fotograflarini referans gorselden cikarir.

Kaynak: kullanicinin 2026-09-08'de gonderdigi tasarim referansi
(`tasarim/karsilama-referans.png`). Ekrandaki dort ignenin ICINDEKI
fotograf daireleri kirpilip saydam kenarli PNG olarak kaydediliyor.

Neden PNG: igne SEKLI kodda SVG olarak ciziliyor (renk temadan gelsin,
olcu ekrana gore degissin), ama icindeki fotograf kolaji cizilemez -
referansin kendisinden gelmesi gerekiyor.

Yeniden uretmek icin:
    python araclar/karsilama-avatar-uret.py
Cikti: mobil/assets/karsilama/*.png
"""

import json
import os

from PIL import Image, ImageDraw

KAYNAK = os.path.join(os.path.dirname(__file__), '..', 'tasarim',
                      'karsilama-referans.png')
HEDEF = os.path.join(os.path.dirname(__file__), '..', 'mobil', 'assets',
                     'karsilama')

# Igne dairelerinin OLCULEN merkezi ve ic yaricapi (referans gorselin
# pikselleri).
#
# OLCUM YONTEMI - ilk hali yanlis sonuc verdi, kayda geciyor: turuncu
# maskenin "en genis satiri" dairenin capi SANILMISTI, ama ignenin
# sivri ucu bazi ignelerde daha genis olcuIuyor ve daire 12 px yukari
# kayiyordu; kirpilan parcada turuncu cerceve gorunuyordu. Dogrusu en
# genis satiri yalnizca UST %60'lik bolgede aramak. `ic` degeri de
# olculuyor: halka kalinligi en genis satirda soldan sayiliyor.
IGNELER = {
    'kafe': {'cx': 192, 'cy': 420, 'ic': 50},
    'restoran': {'cx': 660, 'cy': 452, 'ic': 32},
    'bar': {'cx': 122, 'cy': 672, 'ic': 34},
    'etkinlik': {'cx': 646, 'cy': 742, 'ic': 46},
}

# Cikti capi. Ekranda en buyuk igne ~72 pt; 3x yeterli.
CAP = 216


def main():
    kaynak = Image.open(os.path.normpath(KAYNAK)).convert('RGB')
    os.makedirs(os.path.normpath(HEDEF), exist_ok=True)

    for ad, o in IGNELER.items():
        r = o['ic']
        kutu = (o['cx'] - r, o['cy'] - r, o['cx'] + r, o['cy'] + r)
        parca = kaynak.crop(kutu).resize((CAP, CAP), Image.LANCZOS)

        # Dairesel maske: igne icindeki fotograf daire seklinde duruyor.
        # Maske 4x cizilip kucultuluyor - dogrudan cizilen daire
        # kenarinda merdiven olusuyor.
        maske = Image.new('L', (CAP * 4, CAP * 4), 0)
        ImageDraw.Draw(maske).ellipse((0, 0, CAP * 4 - 1, CAP * 4 - 1), fill=255)
        maske = maske.resize((CAP, CAP), Image.LANCZOS)

        cikti = Image.new('RGBA', (CAP, CAP), (0, 0, 0, 0))
        cikti.paste(parca, (0, 0), maske)
        yol = os.path.join(os.path.normpath(HEDEF), f'{ad}.png')
        cikti.save(yol)
        print(f'{ad:9s} {kutu} -> {CAP}x{CAP}  {os.path.getsize(yol) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
