"""Kelime markasinin KOYU MOD surumunu uretir.

Kullanicinin istegi (2026-09-03): uygulama telefonun koyu/acik moduna
uysun. Kelime markasi KOYU HARFLI bir PNG; koyu zeminde neredeyse
gorunmez oluyor.

Cozum harfleri acik tona cevirmek ama TURUNCU NOKTAYI KORUMAK: "i"nin
noktasi markanin konum ignesi, onu da beyaza boyamak markayi bozar.
Ayrim dogrudan renkten yapiliyor - koyu pikseller harf, turuncu
pikseller nokta.

Kaynak dosya `assets/images/marka-yazisi.png`, cikti
`marka-yazisi-koyu.png`. Kaynak degisirse bu betik yeniden kosulur.
"""
from PIL import Image
import os

os.chdir(os.path.join(os.path.dirname(__file__), ".."))

ACIK_METIN = (244, 240, 235)  # koyu paletteki `metin`

kaynak = Image.open("assets/images/marka-yazisi.png").convert("RGBA")
px = kaynak.load()
w, h = kaynak.size

degisen = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        # Turuncu nokta: kirmizi kanal belirgin sekilde yuksek.
        turuncuMu = r > 120 and g < 180 and b < 100
        if turuncuMu:
            continue
        # Harfler: koyu. Kenar yumusatmasini ALFA tasidigi icin dolgu
        # duz acik tona cevriliyor, tonlama kaybi olmuyor.
        px[x, y] = (*ACIK_METIN, a)
        degisen += 1

kaynak.save("assets/images/marka-yazisi-koyu.png")
print(f"marka-yazisi-koyu.png yazildi ({degisen} piksel acik tona cevrildi)")
