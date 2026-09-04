"""Karsilama ekranindaki harita zemini icin GERCEK yol geometrisi uretir.

Kullanicinin istegi (2026-09-04): "Bunu gercek map goruntusuyle
oluştursana" ve hemen ardindan "Sokak cadde gibi seyler yazmasin".

NEDEN HAZIR HARITA DEGIL:
  1. `react-native-maps` WEB'DE calismiyor; karsilama ekrani
     slooin.expo.app'te de aciliyor.
  2. Android'de Google Maps anahtari yok - harita zemini gri kalirdi.
  3. Giris yapmamis birinden konum izni istemek yanlis; hazir harita
     bilesenine sabit koordinat vermek de gereksiz agirlik.
  4. Hazir dosemelerde SOKAK ADLARI gomulu gelir; kullanici tam olarak
     onlari istemedi.
  5. Dosemeler her acilista ag istegi demek. Bu bir acilis ekrani.

Cozum: gercek bir yerin yol agini OSM'den BIR KEZ cikarip vektor
olarak gommek. Harita gercek, cizim bizim; renk temadan geliyor,
etiket yok, ag istegi yok.

KAYNAK: OpenStreetMap, ODbL. Turetilmis eser oldugu icin ATIF SART -
karsilama ekraninin altinda kucuk bir satir duruyor.

BOLGE: Bursa / Nilufer. Taninabilir bir sehir dokusu; izgara degil
organik, yani "cizilmis kroki" gibi durmuyor.

Yeniden uretmek icin:
    python araclar/karsilama-yollari-uret.py
Cikti: mobil/src/tasarim/karsilama-yollari.ts
"""

import json
import math
import os
import urllib.parse
import urllib.request

# Sahnenin SVG kutusu. KarsilamaSahnesi.tsx icindeki viewBox ile AYNI
# olmali; degisirse burasi da degismeli.
EN, BOY = 300.0, 330.0

# Bolge merkezi ve kapsam. Kapsam metre cinsinden veriliyor ve viewBox
# oraniyla ayni tutuluyor, boylece yollar ezilmiyor.
MERKEZ_LAT, MERKEZ_LON = 40.2160, 28.9690
YUKSEKLIK_M = 1350.0
GENISLIK_M = YUKSEKLIK_M * (EN / BOY)

# Yol siniflari -> cizgi kalinligi. Hiyerarsi olmadan yol agi tek tip
# bir agdan ibaret kaliyor ve gercek harita gibi okunmuyor.
KALINLIK = {
    'motorway': 'ana', 'trunk': 'ana', 'primary': 'ana',
    'secondary': 'orta', 'tertiary': 'orta',
    'residential': 'ince', 'unclassified': 'ince', 'living_street': 'ince',
}

# Douglas-Peucker toleransi (SVG birimi). Buyudukce dosya kuculur ama
# yollar koselenir.
TOLERANS = 0.9

# Bu uzunlugun altindaki parcalar atiliyor: cizimde nokta gibi
# gorunuyorlar, yalnizca yer kapliyorlar.
EN_KISA = 6.0


def indir():
    guney = MERKEZ_LAT - (YUKSEKLIK_M / 2) / 110574
    kuzey = MERKEZ_LAT + (YUKSEKLIK_M / 2) / 110574
    derece_lon = 111320 * math.cos(math.radians(MERKEZ_LAT))
    bati = MERKEZ_LON - (GENISLIK_M / 2) / derece_lon
    dogu = MERKEZ_LON + (GENISLIK_M / 2) / derece_lon

    turler = '|'.join(KALINLIK)
    sorgu = (
        '[out:json][timeout:60];'
        f'(way({guney:.6f},{bati:.6f},{kuzey:.6f},{dogu:.6f})'
        f'[highway~"^({turler})$"];);'
        'out geom;'
    )
    istek = urllib.request.Request(
        'https://overpass-api.de/api/interpreter',
        data=urllib.parse.urlencode({'data': sorgu}).encode(),
        # Overpass User-Agent'siz istegi 406 ile reddediyor.
        headers={'User-Agent': 'slooin/1.0 (karsilama ekrani yol cizimi)'},
    )
    with urllib.request.urlopen(istek, timeout=120) as c:
        return json.load(c), (guney, bati, kuzey, dogu)


def yansit(nokta, sinirlar):
    """Enlem/boylami SVG koordinatina cevirir.

    Kucuk bir alanda esdikdortgen yansitma yeterli; tek duzeltme
    boylamin enlemle daralmasi (cos), o da yapilmazsa cizim yatayda
    gerilir.
    """
    guney, bati, kuzey, dogu = sinirlar
    x = (nokta['lon'] - bati) / (dogu - bati) * EN
    y = (kuzey - nokta['lat']) / (kuzey - guney) * BOY
    return x, y


def sadelestir(noktalar, tolerans):
    """Douglas-Peucker. Cizginin bicimini bozmadan nokta sayisini dusurur."""
    if len(noktalar) < 3:
        return noktalar
    bas, son = noktalar[0], noktalar[-1]
    dx, dy = son[0] - bas[0], son[1] - bas[1]
    uzunluk = math.hypot(dx, dy)

    en_uzak, en_uzaklik = 0, 0.0
    for i in range(1, len(noktalar) - 1):
        px, py = noktalar[i]
        if uzunluk == 0:
            uzaklik = math.hypot(px - bas[0], py - bas[1])
        else:
            uzaklik = abs(dy * px - dx * py + son[0] * bas[1] - son[1] * bas[0]) / uzunluk
        if uzaklik > en_uzaklik:
            en_uzak, en_uzaklik = i, uzaklik

    if en_uzaklik <= tolerans:
        return [bas, son]
    return (sadelestir(noktalar[:en_uzak + 1], tolerans)[:-1]
            + sadelestir(noktalar[en_uzak:], tolerans))


def kirp(noktalar):
    """Kutunun tamamen disinda kalan parcalari atar.

    Kutuyu KESEN yollar oldugu gibi biraktiriliyor: SVG zaten kirpiyor
    ve kenarda yarim kalan yol, kadrajin devam ettigi hissini veriyor.
    """
    pay = 20.0
    return any(-pay <= x <= EN + pay and -pay <= y <= BOY + pay for x, y in noktalar)


def uzunluk(noktalar):
    return sum(math.hypot(noktalar[i + 1][0] - noktalar[i][0],
                          noktalar[i + 1][1] - noktalar[i][1])
               for i in range(len(noktalar) - 1))


def main():
    veri, sinirlar = indir()
    gruplar = {'ana': [], 'orta': [], 'ince': []}
    ham_nokta = sade_nokta = 0

    for oge in veri['elements']:
        geo = oge.get('geometry')
        if not geo or len(geo) < 2:
            continue
        sinif = KALINLIK.get(oge.get('tags', {}).get('highway'))
        if not sinif:
            continue
        noktalar = [yansit(n, sinirlar) for n in geo]
        ham_nokta += len(noktalar)
        if not kirp(noktalar):
            continue
        noktalar = sadelestir(noktalar, TOLERANS)
        if uzunluk(noktalar) < EN_KISA:
            continue
        sade_nokta += len(noktalar)
        gruplar[sinif].append(noktalar)

    def d(noktalar):
        bas = f'M{noktalar[0][0]:.1f} {noktalar[0][1]:.1f}'
        return bas + ''.join(f'L{x:.1f} {y:.1f}' for x, y in noktalar[1:])

    satirlar = [
        '// URETILMIS DOSYA - elle duzenleme.',
        '// Kaynak: OpenStreetMap (ODbL). Uretim:',
        '//   python araclar/karsilama-yollari-uret.py',
        '//',
        '// Karsilama ekranindaki harita zemininin GERCEK yol geometrisi',
        '// (Bursa / Nilufer). Etiket YOK - kullanicinin istegi 2026-09-04:',
        '// "Sokak cadde gibi seyler yazmasin". Koordinatlar 300x330',
        '// birimlik SVG kutusuna gore.',
        '',
        '/** Ana arterler - en kalin cizgi. */',
        f'export const ANA_YOLLAR = {json.dumps([d(y) for y in gruplar["ana"]], ensure_ascii=False)}',
        '',
        '/** Toplayici yollar. */',
        f'export const ORTA_YOLLAR = {json.dumps([d(y) for y in gruplar["orta"]], ensure_ascii=False)}',
        '',
        '/** Sokaklar - en ince cizgi, dokuyu bunlar veriyor. */',
        f'export const INCE_YOLLAR = {json.dumps([d(y) for y in gruplar["ince"]], ensure_ascii=False)}',
        '',
    ]

    hedef = os.path.join(os.path.dirname(__file__), '..', 'mobil', 'src',
                         'tasarim', 'karsilama-yollari.ts')
    with open(os.path.normpath(hedef), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(satirlar))

    print(f'ana {len(gruplar["ana"])} / orta {len(gruplar["orta"])} / '
          f'ince {len(gruplar["ince"])} yol')
    print(f'nokta {ham_nokta} -> {sade_nokta}')
    print(f'dosya {os.path.getsize(os.path.normpath(hedef)) / 1024:.1f} KB')


if __name__ == '__main__':
    main()
