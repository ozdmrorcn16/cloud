"""Karsilama ekranindaki igne fotograflarini uretir.

Kaynak: `tasarim/karsilama-avatar-kaynak.png` - dort portrelik 2x2 bir
izgara (2048x1152). Her hucreden yuz kirpilip dairesel maskeyle saydam
kenarli PNG olarak kaydediliyor.

NEDEN KAYNAK DEGISTI (2026-09-08): avatarlar once kullanicinin
gonderdigi tasarim referansindan (`tasarim/karsilama-referans.png`)
kirpiliyordu. Referanstaki igneler kucuk oldugu icin kirpilabilen alan
yalnizca 32-40 px'di; 128 px'e buyutuIunce gozle gorulur sekilde
bulaniklasiyor ve tek kisilik ignelerin net fotograflarinin yaninda
belli oluyordu (olculdu, gercek ekran boyutunda karsilastirildi).
Kullanicinin karari: "Kaynak degil de kendin bir yuz profili de
ekleyebilirsin yenisini". Yeni izgara bu proje icin uretildi, yani
kaynak cozunurlugu artik bir kisit degil (hucre basina 1024x576).

Neden PNG: igne SEKLI kodda SVG olarak ciziliyor (renk temadan gelsin,
olcu ekrana gore degissin), fotograf ise varlik olarak duruyor.

Yeniden uretmek icin:
    python araclar/karsilama-avatar-uret.py
Cikti: mobil/assets/karsilama/*.png
"""

import json
import os

from PIL import Image, ImageDraw

KAYNAK = os.path.join(os.path.dirname(__file__), '..', 'tasarim',
                      'karsilama-avatar-kaynak.png')
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
    # Kaynak izgaranin dort hucresi; deger, yuzun MERKEZI ve kirpilacak
    # karenin yari kenari (piksel). Merkezler hucre ortasindan biraz
    # YUKARIDA: portrelerde yuz ust yariya oturuyor, hucre merkezinden
    # kirpilinca cene kesiliyordu.
    #
    # Yari kenar 270: daha buyugu ust hucrelerde kadrajin DISINA tasip
    # avatarin tepesinde bos bir serit birakiyor (olculdu), daha kucugu
    # yuzu fazla yakin plana aliyor.
    'kafe': {'cx': 540, 'cy': 280, 'ic': 270},
    'restoran': {'cx': 1560, 'cy': 280, 'ic': 270},
    'bar': {'cx': 555, 'cy': 850, 'ic': 270},
    'etkinlik': {'cx': 1545, 'cy': 850, 'ic': 270},
}

# Cikti capi. Ignelerin ekrandaki capi ~41 pt; 3x ekranda 123 px eder.
# Kaynak artik bol (520 px), yani hedefi buyutmenin maliyeti yalnizca
# dosya boyutu.
CAP = 160


def main():
    kaynak = Image.open(os.path.normpath(KAYNAK)).convert('RGB')
    os.makedirs(os.path.normpath(HEDEF), exist_ok=True)

    for ad, o in IGNELER.items():
        r = o['ic']
        kutu = (o['cx'] - r, o['cy'] - r, o['cx'] + r, o['cy'] + r)
        parca = kaynak.crop(kutu).resize((CAP, CAP), Image.LANCZOS)
        # KESKINLESTIRME YOK: kaynak 520 px'ten 128'e KUCULTUluyor, yani
        # buyutmenin yumusatmasi diye bir sorun kalmadi. Eski kaynakta
        # (32-68 px) bir unsharp maske vardi; burada uygulansa
        # gozluklerin ve sac kenarlarinin cevresinde hale yapardi.

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
