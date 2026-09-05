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


# 3. MADALYA AYRI BIR KAYNAKTAN GELIYOR.
#
# Kullanicinin istegi (2026-09-05): "1 ve 2 deki bugday gibi bir sey
# varya 3'e de onu yapabilir misin". Ilk denemede 2. madalyanin
# dallari alinip bronza boyanmisti; kullanici sonucu begenmedi
# ("3 olmamis, defne kopuk duruyor") ve defneli 3. madalyanin kendi
# gorselini gonderdi. Turetme tamamen birakildi.
#
# Kaynak depoda: tasarim/madalya-3-kaynak.jpg
UC_KAYNAK = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'tasarim', 'madalya-3-kaynak.jpg')
)
# Kaynakta ustte 2. madalyanin kurdelesi, altta 4'un ustu de var;
# ucuncusu bu dikey aralikta (doluluk profilinden olculdu).
UC_ARALIK = (45, 178)


def ucuncuyu_oku(hedef_genislik):
    """3. madalyayi kendi kaynagindan okur ve olcegi esitler.

    `hedef_genislik` 2. madalyanin defne dahil genisligi; ikisi ayni
    gorselden gelmedigi icin olcek elle esitleniyor, yoksa 3. madalya
    listede otekilerden buyuk duruyor.
    """
    if not os.path.exists(UC_KAYNAK):
        return None

    ham = Image.open(UC_KAYNAK).convert('RGB')
    y0, y1 = UC_ARALIK
    parca = zemini_sil(ham.crop((0, y0, ham.size[0], y1)))
    # Ayirici cizgi ve komsu madalyalarin uclari kucuk parcalar olarak
    # kaliyor; madalya en buyuk parca.
    parca = yalniz_madalyayi_birak(parca)
    kutu = parca.getbbox()
    if kutu:
        parca = parca.crop(kutu)

    olcek = hedef_genislik / parca.size[0]
    return parca.resize(
        (hedef_genislik, max(1, round(parca.size[1] * olcek))), Image.LANCZOS
    )


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

    # 3. madalya kendi kaynagindan; olcegi 2. madalyaya esitleniyor.
    ucuncu = ucuncuyu_oku(parcalar[1].size[0])
    if ucuncu is not None:
        tuval = Image.new('RGBA', (tuval_en, tuval_boy), (255, 255, 255, 0))
        tuval.paste(
            ucuncu,
            ((tuval_en - ucuncu.size[0]) // 2, (tuval_boy - ucuncu.size[1]) // 2),
            ucuncu,
        )
        tuvaller[2] = tuval

    for sira, tuval in enumerate(tuvaller, start=1):
        yol = os.path.join(HEDEF, f'madalya-{sira}.png')
        tuval.save(yol, 'PNG', optimize=True)
        print(f'madalya-{sira}.png  {tuval_en}x{tuval_boy}  '
              f'{os.path.getsize(yol) / 1024:.1f} KB'
              + ('  (ayri kaynaktan)' if sira == 3 else ''))


if __name__ == '__main__':
    main()
