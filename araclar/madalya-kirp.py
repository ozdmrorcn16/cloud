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
# ZEMIN OLCUTU IKI KOSULLU: acik OLACAK ve NOTR olacak.
#
# Tek esik ise yaramiyordu, cunku iki hata birbirinin ziddi:
#   - Esik gevsek (225) olunca 4. MADALYAYA SIZIYOR. O krem renkli ve
#     govdesinin parlakligi 221-225; tasma dis kenardan iceri girip
#     rengi yiyordu - kullanicinin gordugu "silik yerler" buydu.
#   - Esik dar olunca kurdelelerin altindaki GOLGE kaliyor ve acik
#     zeminde beyazimsi bir bulut, koyu modda hale birakiyordu.
#
# Ayrim renkte: zemin ve golge NOTR (olculdu: zemin r-b = 0, golge
# r-b = 8..16), madalyanin kremi ise SICAK (r-b = 29..31). Gumus de
# notr ama dis cemberi koyu oldugu icin tasma ona giremiyor.
# Parlaklik esigi BILEREK DUSUK (200): golgenin koyu katmani 232'de
# yakalanmiyordu ve bariyer olusturup arkasindaki acik golgeyi
# koruyordu - kurdelelerin altinda beyazimsi bir bulut kaliyordu.
# Notrluk sarti sayesinde bu dusuk esik madalyalara zarar vermiyor:
# 4'un kremi r-b = 29, gumusun dis cemberi ise zaten koyu.
ZEMIN_PARLAKLIK = 200
ZEMIN_NOTRLUK = 20
# Bir blogu "madalya" saymak icin en az bu kadar satiri dolu olmali.
EN_AZ_YUKSEKLIK = 60


def zemin_mi(px, x, y):
    r, g, b = px[x, y][:3]
    parlaklik = (r + g + b) / 3
    return parlaklik >= ZEMIN_PARLAKLIK and abs(r - b) <= ZEMIN_NOTRLUK


def dikey_bloklar(im, en_az=None, sol=None, sag=None):
    """Dolu satir bloklarini dondurur."""
    px = im.load()
    genislik, boy = im.size
    sol = SOL if sol is None else sol
    sag = min(SAG if sag is None else sag, genislik)
    if en_az is None:
        en_az = EN_AZ_YUKSEKLIK
    bloklar, bas = [], None
    for y in range(boy):
        dolu = any(not zemin_mi(px, x, y) for x in range(sol, sag))
        if dolu and bas is None:
            bas = y
        elif not dolu and bas is not None:
            bloklar.append((bas, y - 1))
            bas = None
    if bas is not None:
        bloklar.append((bas, boy - 1))
    return [b for b in bloklar if b[1] - b[0] >= en_az]


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
        # RENK KORUNUYOR, yalnizca alfa sifirlaniyor: maske onarimi
        # yanlislikla silinmis bir kenari geri acabilsin diye.
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
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


# 2, 3 VE 4 AYRI KAYNAKLARDAN GELIYOR.
#
# Ana referans gorselde bu ucunde sorun vardi: 3'te defne yoktu, 2 ve
# 4'un kenarlari ise zemin silme sirasinda bozuluyordu. Sebep olculdu:
# gumusun ve 4'un kreminin parlak kisimlari neredeyse saf beyaz, yani
# zeminden RENKLE ayrilamiyorlar. Esik oynatmak (uc tur denendi) ve
# maske onarimi (closing) ikisi de bir tarafi duzeltip otekini
# bozdu - closing madalyayi %12-21 sisirdi, olcumle goruldu.
#
# Kullanici uc temiz gorsel gonderdi; artik onlar kullaniliyor ve
# hicbir tahmin gerekmiyor.
AYRI_KAYNAKLAR = {2: 'madalya-2-kaynak.jpg',
                  3: 'madalya-3-kaynak.jpg',
                  4: 'madalya-4-kaynak.png'}

TASARIM = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', 'tasarim')
)


def zaten_saydam(im):
    """Kaynak saydam zeminle mi geldi?"""
    if im.mode not in ('RGBA', 'LA'):
        return False
    alfa = im.convert('RGBA').getchannel('A')
    return alfa.getextrema()[0] < 24


def ayri_kaynak_oku(sira, hedef_yukseklik):
    """Bir madalyayi kendi kaynagindan okur ve olcegini esitler.

    Kaynaklarda ustte ve altta komsu madalyalarin parcalari da var;
    aranan madalya gorselin DIKEY MERKEZINI iceren blok.

    Olcek YUKSEKLIKTEN esitleniyor: her kaynak farkli buyuklukte
    geldigi icin, ana gorseldeki ayni siranin yuksekligi hedef
    aliniyor. Genislikten esitlemek yanlis olurdu - defneli ve
    defnesiz madalyalarin genisligi farkli.
    """
    yol = os.path.join(TASARIM, AYRI_KAYNAKLAR[sira])
    if not os.path.exists(yol):
        return None

    ham = Image.open(yol)

    if zaten_saydam(ham):
        # KAYNAK HAZIR: hicbir temizlik yapilmiyor.
        # Kullanicinin talimati (2026-09-05): "Bu attigi direk kullan
        # degistirmeden". Zemin silme ve parca ayiklama yalnizca beyaz
        # zeminli kaynaklar icin gerekli; saydam bir PNG'ye
        # dokunulmasi ancak zarar verir.
        parca = ham.convert('RGBA')
    else:
        ham = ham.convert('RGB')
        bloklar = dikey_bloklar(ham, en_az=25, sol=0, sag=ham.size[0])
        if not bloklar:
            return None
        orta = ham.size[1] // 2
        icinde = [b for b in bloklar if b[0] <= orta <= b[1]]
        y0, y1 = icinde[0] if icinde else max(bloklar, key=lambda b: b[1] - b[0])
        parca = zemini_sil(
            ham.crop((0, max(0, y0 - 1), ham.size[0], min(ham.size[1], y1 + 2)))
        )
        parca = yalniz_madalyayi_birak(parca)

    kutu = parca.getbbox()
    if kutu:
        parca = parca.crop(kutu)

    olcek = hedef_yukseklik / parca.size[1]
    return parca.resize(
        (max(1, round(parca.size[0] * olcek)), hedef_yukseklik), Image.LANCZOS
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

    # Ayri kaynagi olan siralar degistiriliyor; olcek ana gorseldeki
    # ayni siranin yuksekligine esitleniyor.
    for sira in AYRI_KAYNAKLAR:
        yeni = ayri_kaynak_oku(sira, parcalar[sira - 1].size[1])
        if yeni is None:
            continue
        tuval = Image.new('RGBA', (tuval_en, tuval_boy), (255, 255, 255, 0))
        tuval.paste(
            yeni,
            ((tuval_en - yeni.size[0]) // 2, (tuval_boy - yeni.size[1]) // 2),
            yeni,
        )
        tuvaller[sira - 1] = tuval

    for sira, tuval in enumerate(tuvaller, start=1):
        yol = os.path.join(HEDEF, f'madalya-{sira}.png')
        tuval.save(yol, 'PNG', optimize=True)
        print(f'madalya-{sira}.png  {tuval_en}x{tuval_boy}  '
              f'{os.path.getsize(yol) / 1024:.1f} KB'
              + ('  (ayri kaynaktan)' if sira in AYRI_KAYNAKLAR else ''))


if __name__ == '__main__':
    main()
