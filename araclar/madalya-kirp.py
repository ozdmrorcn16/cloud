"""Kullanicinin verdigi referans gorselden bes sira madalyasini cikarir.

Kullanicinin istegi (2026-09-05): "Direk attigim gorseldeki gibi
gorunmesini saglayamaz misin". Onceden madalyalar SVG ile CIZILIYORDU
ve referansa yakindi ama ayni degildi; artik referansin kendisi
kullaniliyor.

Beyaz zemin SAYDAMA cevriliyor ama duz esikle DEGIL: 4. madalya
krem/beyaz oldugu icin esik onu da yerdi. Bunun yerine gorselin
KENARINDAN tasma (flood fill) yapiliyor - yalnizca kenara BAGLI beyaz
bolge siliniyor, madalyanin icindeki acik tonlar duruyor.

Cikti: mobil/assets/images/madalya-1.png ... madalya-5.png
"""

import os
import sys
from collections import deque

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow yok: pip install pillow')

KAYNAK = sys.argv[1] if len(sys.argv) > 1 else None
if not KAYNAK or not os.path.exists(KAYNAK):
    sys.exit('Kullanim: python araclar/madalya-kirp.py <referans-gorsel>')

HEDEF = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'mobil', 'assets', 'images')
)

# Referanstaki bes satirin dikey sinirlari ve madalya sutununun yatay
# araligi.
#
# UST PAY: satir sinirinin hemen altindan basliyoruz. Tam sinirdan
# kirpinca bir ustteki madalyanin KURDELE UCU bu kirpmaya tasiyor ve
# saydam zeminde artik bir leke birakiyor. "En buyuk parcayi tut"
# yontemi denendi ve DEFNE DALLARINI da sildi - dal madalyaya
# degmedigi icin ayri bir bilesen sayiliyor.
UST_PAY = 15
SATIRLAR = [
    (0, 133),
    (133 + UST_PAY, 266),
    (266 + UST_PAY, 399),
    (399 + UST_PAY, 532),
    (532 + UST_PAY, 666),
]
SOL, SAG = 30, 185

# Bu esigin uzerindeki her kanal "zemin" sayiliyor.
#
# Esik yalnizca JPEG payi icin degil GOLGE icin de gevsek: referansta
# madalyanin altinda yumusak bir gri golge var ve dar bir esikte golge
# saydam olmuyor - acik zeminde gorunmuyor ama KOYU MODDA madalyanin
# etrafinda beyazimsi bir hale birakiyor.
#
# 225 guvenli bir orta yol: golgeyi yiyor ama madalyanin kendisine
# giremiyor, cunku tasma kenardan basliyor ve her madalyanin DIS
# CEMBERI koyu - en acik olan 4. madalyada bile. En acik ic detay
# (gumusun defne dallari, ~180) esigin cok altinda.
BEYAZ = 225


def zemini_sil(im):
    """Kenara bagli beyaz bolgeyi saydam yapar."""
    im = im.convert('RGBA')
    en, boy = im.size
    px = im.load()

    gorulen = [[False] * boy for _ in range(en)]
    kuyruk = deque()

    def beyaz_mi(x, y):
        r, g, b, _ = px[x, y]
        return r >= BEYAZ and g >= BEYAZ and b >= BEYAZ

    # Dort kenardan basla.
    for x in range(en):
        for y in (0, boy - 1):
            if beyaz_mi(x, y) and not gorulen[x][y]:
                gorulen[x][y] = True
                kuyruk.append((x, y))
    for y in range(boy):
        for x in (0, en - 1):
            if beyaz_mi(x, y) and not gorulen[x][y]:
                gorulen[x][y] = True
                kuyruk.append((x, y))

    while kuyruk:
        x, y = kuyruk.popleft()
        px[x, y] = (255, 255, 255, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < en and 0 <= ny < boy and not gorulen[nx][ny] and beyaz_mi(nx, ny):
                gorulen[nx][ny] = True
                kuyruk.append((nx, ny))

    return im


def yalniz_en_buyuk_parca(im):
    """Yalnizca en buyuk opak parcayi birakir.

    Satir siniri madalyalari tam ayirmiyor: ustteki madalyanin kurdele
    ucu bir alttaki kirpmaya tasiyor ve saydam zeminde artik bir leke
    olarak kaliyor. Bagli bilesenlerden en buyugu madalyanin kendisi;
    gerisi siliniyor.
    """
    en, boy = im.size
    px = im.load()
    etiket = [[0] * boy for _ in range(en)]
    parcalar = []

    for bx in range(en):
        for by in range(boy):
            if px[bx, by][3] < 24 or etiket[bx][by]:
                continue
            no = len(parcalar) + 1
            pikseller = []
            kuyruk = deque([(bx, by)])
            etiket[bx][by] = no
            while kuyruk:
                x, y = kuyruk.popleft()
                pikseller.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if (0 <= nx < en and 0 <= ny < boy
                            and not etiket[nx][ny] and px[nx, ny][3] >= 24):
                        etiket[nx][ny] = no
                        kuyruk.append((nx, ny))
            parcalar.append(pikseller)

    if not parcalar:
        return im
    en_buyuk = max(range(len(parcalar)), key=lambda i: len(parcalar[i])) + 1
    for x in range(en):
        for y in range(boy):
            if etiket[x][y] != en_buyuk:
                px[x, y] = (255, 255, 255, 0)
    return im


def kirp(im):
    """Saydam kenarlari atar - madalya kutuya tam otursun."""
    kutu = im.getbbox()
    return im.crop(kutu) if kutu else im


def main():
    kaynak = Image.open(KAYNAK).convert('RGB')
    for sira, (y0, y1) in enumerate(SATIRLAR, start=1):
        parca = kaynak.crop((SOL, y0, SAG, y1))
        parca = kirp(zemini_sil(parca))
        yol = os.path.join(HEDEF, f'madalya-{sira}.png')
        parca.save(yol, 'PNG', optimize=True)
        print(f'madalya-{sira}.png  {parca.size[0]}x{parca.size[1]}  '
              f'{os.path.getsize(yol) / 1024:.1f} KB')


if __name__ == '__main__':
    main()
