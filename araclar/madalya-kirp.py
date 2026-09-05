"""Kullanicinin verdigi referans gorselden bes sira madalyasini cikarir.

Kullanicinin istegi (2026-09-05): "Direk attigim gorseldeki gibi
gorunmesini saglayamaz misin". Onceden madalyalar SVG ile CIZILIYORDU
ve referansa yakindi ama ayni degildi; artik referansin kendisi
kullaniliyor.

UC TUZAK, ucu de olcerek bulundu:

1. ZEMIN DUZ ESIKLE SILINMEZ. 4. madalya krem/beyaz oldugu icin esik
   onu da yerdi. Bunun yerine kenardan TASMA (flood fill): yalnizca
   kenara BAGLI beyaz siliniyor, madalyanin icindeki acik tonlar
   duruyor.

2. ESIK GOLGEYI DE KAPSAMALI. Referansta madalyanin altinda yumusak bir
   gri golge var; dar esikte golge saydam olmuyor. Acik zeminde
   gorunmuyor ama KOYU MODDA madalyanin etrafinda beyazimsi bir hale
   birakiyor.

3. MADALYALAR ESIT SATIRLARA OTURMUYOR. Gorseli bese bolup kirpmak
   yanlis: 1. madalyanin kurdelesi kendi satirinin 11 piksel disina
   tasiyor, 2. madalya ise satir sinirindan 20 piksel SONRA basliyor.
   Sabit pay vermek de (denendi) bu kez madalyalarin KENDI govdesini
   kesti - cikan yukseklikler 131/113/118/114/108 gibi tutarsizdi ve
   kullanici "kesik yerleri var" dedi. Cozum: sinirlar sabit
   yazilmiyor, her madalyanin gercek dikey blogu doluluk profilinden
   BULUNUYOR.

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

ADET = 5
# Madalya sutununun yatay araligi; sagda mekan adi basliyor.
SOL, SAG = 28, 200
# Bu esigin uzerindeki her kanal "zemin" sayiliyor. Golgeyi de kapsamak
# icin bilerek gevsek; madalyanin dis cemberi her sirada bundan koyu,
# en acik olan 4. madalyada bile.
ZEMIN_ESIGI = 225
# Bir blogu "madalya" saymak icin en az bu kadar satiri dolu olmali.
EN_AZ_YUKSEKLIK = 60


def zemin_mi(px, x, y):
    r, g, b = px[x, y][:3]
    return r >= ZEMIN_ESIGI and g >= ZEMIN_ESIGI and b >= ZEMIN_ESIGI


def dikey_bloklar(im):
    """Madalya sutunundaki dolu satir bloklarini dondurur."""
    px = im.load()
    _, boy = im.size
    bloklar, bas = [], None
    for y in range(boy):
        dolu = any(not zemin_mi(px, x, y) for x in range(SOL, SAG))
        if dolu and bas is None:
            bas = y
        elif not dolu and bas is not None:
            bloklar.append((bas, y - 1))
            bas = None
    if bas is not None:
        bloklar.append((bas, boy - 1))
    return [b for b in bloklar if b[1] - b[0] >= EN_AZ_YUKSEKLIK]


def zemini_sil(im):
    """Kenara bagli zemin bolgesini saydam yapar."""
    im = im.convert('RGBA')
    en, boy = im.size
    px = im.load()

    gorulen = [[False] * boy for _ in range(en)]
    kuyruk = deque()

    def ekle(x, y):
        if not gorulen[x][y] and zemin_mi(px, x, y):
            gorulen[x][y] = True
            kuyruk.append((x, y))

    for x in range(en):
        ekle(x, 0)
        ekle(x, boy - 1)
    for y in range(boy):
        ekle(0, y)
        ekle(en - 1, y)

    while kuyruk:
        x, y = kuyruk.popleft()
        px[x, y] = (255, 255, 255, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < en and 0 <= ny < boy:
                ekle(nx, ny)

    return im


def yalniz_madalyayi_birak(im):
    """Madalyanin disinda kalan her seyi siler.

    Kirpma penceresine listenin AYIRICI CIZGISI ve komsu madalyanin
    kurdele ucu girebiliyor; bunlar zemine bagli olmadigi icin tasma
    onlari silmiyor ve saydam zeminde ince siritlar olarak kaliyor.
    Kullanici bunu ekranda gordu ("madalyonun altinda ince cizik").

    Olcut "en buyuk bagli parcayi tut". Bu yontem daha once BIR KEZ
    denenmis ve defne dallarini silmisti - ama o zaman kirpma araligi
    yanlisti ve dallar madalyadan KOPUK kaliyordu. Sinirlar doluluk
    profilinden bulunmaya baslayinca dallar govdeye bagli cikti
    (1. ve 2. madalya tek parca), yani artik guvenli.

    Onceki deneme "yukseklik <= 3 piksel" filtresiydi; 4. madalyadaki
    31x4 pikselluk cizgiyi KACIRDI. Alan olcutu boyle bir esik
    ayarina hic girmiyor.
    """
    en, boy = im.size
    px = im.load()
    gorulen = [[False] * boy for _ in range(en)]
    parcalar = []

    for bx in range(en):
        for by in range(boy):
            if px[bx, by][3] < 24 or gorulen[bx][by]:
                continue
            pikseller, kuyruk = [], deque([(bx, by)])
            gorulen[bx][by] = True
            while kuyruk:
                x, y = kuyruk.popleft()
                pikseller.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if (0 <= nx < en and 0 <= ny < boy
                            and not gorulen[nx][ny] and px[nx, ny][3] >= 24):
                        gorulen[nx][ny] = True
                        kuyruk.append((nx, ny))
            parcalar.append(pikseller)

    if len(parcalar) <= 1:
        return im

    en_buyuk = max(parcalar, key=len)
    for parca in parcalar:
        if parca is en_buyuk:
            continue
        for x, y in parca:
            px[x, y] = (255, 255, 255, 0)
    return im


# 3. MADALYANIN DEFNE DALLARI TURETILIYOR.
#
# Kullanicinin istegi (2026-09-05): "1 ve 2 deki bugday gibi bir sey
# varya 3'e de onu yapabilir misin". Referansta defne yalnizca ilk iki
# madalyada var; ucuncusu onlarla ayni ailedeymis gibi durmuyordu.
#
# Sifirdan cizmek yerine 2. madalyanin dallari aliniyor ve bronza
# boyaniyor: ayni cizim dilinden geldigi icin form, isik ve doku
# tutuyor. Hizalama bedava - butun madalyalar ayni tuvale ortalandigi
# icin cemberlerin merkezi ayni noktada.
#
# 4 ve 5'e EKLENMIYOR: ilk uc gercek madalya (altin/gumus/bronz),
# 4-5 ise "ilk bese girdi" rozeti. Defnenin orada bitmesi bu ayrimi
# gorunur kiliyor.
DEFNE_KAYNAGI = 2
DEFNE_HEDEFI = 3
# Cemberin disinda kalan seritler; ortadaki her sey madalyanin kendisi.
DEFNE_SOL_SINIR = 20
DEFNE_SAG_SINIR = 106
# ALT SINIR: kurdele uclari ve altlarindaki golge de bu seritlere
# tasiyor ve aktarilinca madalyanin yaninda bir leke olarak kaliyordu.
# Defne dallari zaten cemberin hizasinda bitiyor.
DEFNE_ALT_SINIR = 100
# Gri defneyi bronza ceviren kanal carpanlari. Parlaklik korunuyor,
# ton kaydiriliyor - kabartma ve golge boylece kaybolmuyor.
# Ilk deneme (1.02, 0.74, 0.52) fazla acikti: gumus zaten parlak
# oldugu icin sonuc bronzdan cok SARIYA kaciyordu.
BRONZ_CARPAN = (0.86, 0.58, 0.38)


def defneyi_tasi(kaynak_im, hedef_im):
    """Kaynaktaki defne dallarini bronzlastirip hedefin ARKASINA koyar."""
    en, boy = kaynak_im.size
    kaynak_px = kaynak_im.load()

    dallar = Image.new('RGBA', (en, boy), (255, 255, 255, 0))
    dal_px = dallar.load()
    kr, kg, kb = BRONZ_CARPAN

    for x in range(en):
        if DEFNE_SOL_SINIR <= x <= DEFNE_SAG_SINIR:
            continue
        for y in range(boy):
            if y > DEFNE_ALT_SINIR:
                continue
            r, g, b, a = kaynak_px[x, y]
            if a < 24:
                continue
            parlaklik = (r + g + b) / 3
            dal_px[x, y] = (
                min(255, int(parlaklik * kr)),
                min(255, int(parlaklik * kg)),
                min(255, int(parlaklik * kb)),
                a,
            )

    # Dallar ARKADA: once onlar, sonra madalyanin kendisi. Boylece
    # cembere giren uclar gorunmuyor.
    birlesik = Image.new('RGBA', (en, boy), (255, 255, 255, 0))
    birlesik.alpha_composite(dallar)
    birlesik.alpha_composite(hedef_im)
    return birlesik


def main():
    kaynak = Image.open(KAYNAK).convert('RGB')
    bloklar = dikey_bloklar(kaynak)

    if len(bloklar) != ADET:
        sys.exit(f'{ADET} madalya bekleniyordu, {len(bloklar)} blok bulundu: '
                 f'{bloklar}\nGorselin duzeni beklenenden farkli.')

    parcalar = []
    for y0, y1 in bloklar:
        # Bir piksel pay: tasmanin baslayabilmesi icin cevrede saydam
        # bir cerceve kalmali.
        parca = kaynak.crop((SOL, max(0, y0 - 1), SAG, min(kaynak.size[1], y1 + 2)))
        parca = yalniz_madalyayi_birak(zemini_sil(parca))
        kutu = parca.getbbox()
        parcalar.append(parca.crop(kutu) if kutu else parca)

    # ORTAK TUVAL - hepsi ayni olcekte gorunsun diye.
    #
    # Kirpma her madalyayi kendi sinirina oturtuyor ve boyutlar
    # farkli cikiyor: defneli olanlar 157 px genis, defnesizler 94.
    # Bunlari ekranda `contain` ile ayni kutuya sigdirmak, GENIS
    # olanlarin CEMBERINI kucultuyordu - defne yer kapladigi icin.
    # Hepsi ayni tuvale ortalaninca oran korunuyor ve cemberler
    # birbirine yakin boyutta kaliyor.
    tuval_en = max(p.size[0] for p in parcalar)
    tuval_boy = max(p.size[1] for p in parcalar)

    tuvaller = []
    for parca in parcalar:
        tuval = Image.new('RGBA', (tuval_en, tuval_boy), (255, 255, 255, 0))
        tuval.paste(
            parca,
            ((tuval_en - parca.size[0]) // 2, (tuval_boy - parca.size[1]) // 2),
            parca,
        )
        tuvaller.append(tuval)

    tuvaller[DEFNE_HEDEFI - 1] = defneyi_tasi(
        tuvaller[DEFNE_KAYNAGI - 1], tuvaller[DEFNE_HEDEFI - 1]
    )

    for sira, tuval in enumerate(tuvaller, start=1):
        yol = os.path.join(HEDEF, f'madalya-{sira}.png')
        tuval.save(yol, 'PNG', optimize=True)
        print(f'madalya-{sira}.png  {tuval_en}x{tuval_boy}  '
              f'{os.path.getsize(yol) / 1024:.1f} KB'
              + ('  (defne turetildi)' if sira == DEFNE_HEDEFI else ''))


if __name__ == '__main__':
    main()
