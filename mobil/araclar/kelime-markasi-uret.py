"""Kelime markasini (slooin yazisi) uygulama varligina cevirir.

Kaynak: tasarim/slooin-kelime-markasi-2-kaynak.png (kullanicinin
2026-08-25'te verdigi ikinci logo takimi).

Kaynakta yazi BEYAZ zeminin uzerinde duruyor. Uygulamanin zemini ise
sicak beyaz (#FAF7F3); beyaz zeminli bir PNG oraya konunca gorunur bir
kutu birakiyor. Bu yuzden zemin saydama cevriliyor.

Yontem yine RENK COZUMLEMESI, esik degil (bkz. araclar/simge-uret.py):

    piksel = alfa * renk + (1 - alfa) * beyaz

Beyaz zemin uzerindeki koyu ya da doygun bir sekil icin alfa, en dusuk
kanaldan cikar: alfa = 1 - min(r,g,b)/255. Rengi geri kazanmak icin de
piksel beyaz zeminden arindirilir. Boylece hem koyu harfler hem turuncu
konum ignesi kendi renginde kaliyor, kenarlardaki ara tonlar bozulmuyor.

Kullanim:  python araclar/kelime-markasi-uret.py
"""
from PIL import Image
import os

KAYNAK = '../tasarim/slooin-kelime-markasi-2-kaynak.png'
HEDEF = 'assets/images/marka-yazisi.png'
ONIZLEME = '../tasarim/onizleme-kelime-markasi.png'

# Uretilen varligin genisligi. Uygulamada en fazla 200 px genisliginde
# ve iki kat piksel yogunluguyla cizildigi icin 1200 fazlasiyla yeter.
GENISLIK = 1200


def zemini_ayikla(im):
    im = im.convert('RGB')
    w, h = im.size
    sonuc = Image.new('RGBA', (w, h))
    kaynak_px = im.load()
    hedef_px = sonuc.load()
    for y in range(h):
        for x in range(w):
            r, g, b = kaynak_px[x, y]
            a = 1.0 - min(r, g, b) / 255.0
            # Kaynak zemin tam beyaz degil (254'lere kadar inen hafif bir
            # gurultu var); 0.004'luk esik onu saydam saymiyordu ve
            # kirpma kutusu butun goruntuyu kapsiyordu. Esik gurultunun
            # ustune cekildi, sekil bundan etkilenmiyor.
            if a <= 0.02:
                hedef_px[x, y] = (0, 0, 0, 0)
                continue
            # Beyaz zeminden arindir (unpremultiply).
            renk = tuple(
                max(0, min(255, int((k - 255 * (1 - a)) / a))) for k in (r, g, b)
            )
            hedef_px[x, y] = renk + (int(a * 255),)
    return sonuc


def main():
    ham = Image.open(KAYNAK)
    saydam = zemini_ayikla(ham)

    # Bos kenarlari kirp: kaynakta yazinin cevresinde genis bosluk var,
    # ekranda hizalamayi zorlastiriyor.
    kutu = saydam.getbbox()
    kirpik = saydam.crop(kutu)
    print('  kirpma kutusu', kutu, '->', kirpik.size)

    oran = kirpik.size[1] / kirpik.size[0]
    yukseklik = max(1, round(GENISLIK * oran))
    olceklenmis = kirpik.resize((GENISLIK, yukseklik), Image.LANCZOS)

    os.makedirs(os.path.dirname(HEDEF), exist_ok=True)
    olceklenmis.save(HEDEF)
    print('  yazildi', HEDEF, olceklenmis.size)
    print('  EN/BOY ORANI (MarkaYazisi.tsx icine yazilacak):',
          f'{GENISLIK} x {yukseklik}')

    # Uygulama zemininde nasil duruyor.
    onizleme = Image.new('RGB', (390, 160), (250, 247, 243))
    kucuk = olceklenmis.resize((200, max(1, round(200 * oran))), Image.LANCZOS)
    onizleme.paste(kucuk, ((390 - 200) // 2, (160 - kucuk.size[1]) // 2), kucuk)
    onizleme.save(ONIZLEME)
    print('  yazildi', ONIZLEME)


if __name__ == '__main__':
    main()
