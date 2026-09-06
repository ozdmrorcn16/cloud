# -*- coding: utf-8 -*-
"""Kullanicinin gonderdigi 3D araba gorselini uygulama ikonuna cevirir.

Kullanicinin talimati (2026-09-06): "Bu attigimi direk kullan."

ZOR KISIM ARKA PLAN DEGIL, PARILTI. Gorsel siyah zemin uzerinde duruyor
ama arabanin cevresinde genis bir turuncu isima var ve o isima govdeyle
NEREDEYSE AYNI RENKTE - olculdu:

    araba govdesi : (253, 117,  2)
    parilti       : (240, 127, 15)

Yani parlaklik ya da doygunluk esigiyle ayrilmiyorlar; toplam parlaklikta
parilti gövdeyi bile geciyor. Ayiran tek sey KESKINLIK: arabanin dis
hatti net bir kenar, parilti ise yumusak bir gecis. Bu yuzden maske
renkten degil GRADYANDAN cikariliyor.

Kosum:  python araclar/araba-ikonu-uret.py <kaynak.png>
Cikti:  mobil/assets/araba.png  (saydam zeminli, kirpilmis, 240 px)
"""
import os
import sys

from PIL import Image
import numpy as np
from scipy import ndimage

HEDEF = 240  # uzun kenar; ikon en fazla 24 px cizildigi icin fazlasiyla yeterli

kaynak = sys.argv[1] if len(sys.argv) > 1 else None
if not kaynak or not os.path.exists(kaynak):
    print('kullanim: python araclar/araba-ikonu-uret.py <kaynak.png>')
    sys.exit(1)

k = Image.open(kaynak).convert('RGB')
a = np.asarray(k).astype(float)
gri = a.mean(axis=2)

# 1) KENARLAR. Once hafif bulaniklastiriliyor: JPEG/olcek gurultusu
#    parilti icinde sahte kenarlar uretiyor.
yumusak = ndimage.gaussian_filter(gri, sigma=2.0)
gx = ndimage.sobel(yumusak, axis=1)
gy = ndimage.sobel(yumusak, axis=0)
buyukluk = np.hypot(gx, gy)

# Esik KALIBRE EDILDI: %80'den %94'e kadar taranip her birinin urettigi
# maske orani ve bilesen sayisi olculdu. %88-%90 araliginda sonuc SABIT
# (%53 maske, TEK bilesen) - yani kontur orada gercekten kapaniyor.
# %92'nin uzerinde kontur kirilip 10-26 parcaya ayriliyor, %80'in
# altinda parilti de maskeye giriyor. Arabanin gorseldeki gercek alani
# da ~%53 (genislik %78 x yukseklik %88'lik dikdortgenin ~%75'i), yani
# sayi bagimsiz olarak dogruluyor.
esik = np.percentile(buyukluk, 90)
kenar = buyukluk > esik

# 2) Kenarlari kapatip icini doldur. Kapama sart: dis hat birkac
#    pikselde kesik olabiliyor ve kesik bir konturun ici doldurulamaz.
kapali = ndimage.binary_closing(kenar, structure=np.ones((15, 15)))
dolu = ndimage.binary_fill_holes(kapali)

# 3) EN BUYUK bileseni al - parilti icinde kalan kucuk artiklar elensin.
etiket, adet = ndimage.label(dolu)
if adet == 0:
    print('HATA: hicbir sekil bulunamadi')
    sys.exit(1)
boyutlar = ndimage.sum(dolu, etiket, range(1, adet + 1))
maske = etiket == (int(np.argmax(boyutlar)) + 1)

# 4) Kenari bir tik iceri al: kapama maskeyi birkac piksel sisirdi ve
#    disarida kalan halka parilti rengini tasiyor.
maske = ndimage.binary_erosion(maske, structure=np.ones((5, 5)))

print(f'maske orani: %{100 * maske.mean():.1f}')

# 5) Alfa. Kenarda sert kesim testere birakiyor; 1 piksellik bulanikla
#    yumusatiliyor.
alfa = ndimage.gaussian_filter(maske.astype(float), sigma=1.0)
alfa = np.clip(alfa, 0, 1)

cikti = np.dstack([a, alfa * 255]).astype(np.uint8)
g = Image.fromarray(cikti, 'RGBA')

# 6) Kirp ve olcekle.
kutu = g.getbbox()
if kutu:
    g = g.crop(kutu)
oran = HEDEF / max(g.size)
g = g.resize((max(1, round(g.width * oran)), max(1, round(g.height * oran))), Image.LANCZOS)

hedef = os.path.join(os.path.dirname(__file__), '..', 'mobil', 'assets', 'araba.png')
hedef = os.path.normpath(hedef)
g.save(hedef, optimize=True)
print(f'{hedef}  {g.size}  {os.path.getsize(hedef) // 1024} KB')
