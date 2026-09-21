"""CHECK-IN IFADE SETINI KESER (2026-09-21).

Kullanicinin verdigi tek sayfalik gorsel (12 kategori x 9 ifade = 108)
tek tek PNG'ye ayrilir, krem/beyaz arka plan disaridan tasma doldurmayla
seffaflastirilir (ic beyazlar korunur), etiketler manifeste yazilir.

Girdi : kullanicinin yukledigi JPEG (1570x2576)
Cikti : mobil/assets/ifadeler/<kategori-slug>/<ifade-slug>.png
        mobil/assets/ifadeler/manifest.json  (kategori, etiket, dosya)
        tasarim/ifade-seti-kontrol.png       (kesilenlerin kontak sayfasi)

Yerlesim sabit: 3 sutun x 4 satir panel; her panelde baslik + 3x3 hucre,
her hucrede ikon ustte, etiket altta. Paneller BEYAZ (255), sayfa KREM
(251,248,241) - panel sinirlari renk esiginden bulunur.
"""
import json
import os
import re
import sys
import unicodedata
from collections import deque

from PIL import Image, ImageDraw

KAYNAK = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\orcns\.claude\uploads\556d60d8-57fb-4c62-a157-dc2cb1c3a111\ed9d2af1-image.jpg'
KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CIKTI = os.path.join(KOK, 'mobil', 'assets', 'ifadeler')
KONTROL = os.path.join(KOK, 'tasarim', 'ifade-seti-kontrol.png')

KATEGORILER = [
  ('İçecekler', ['Çay molası', 'Kahve keyfi', 'Türk kahvesi', 'Buzlu kahve', 'Matcha zamanı', 'Limonata ferahlığı', 'Smoothie molası', 'Bubble tea', 'Su molası']),
  ('Yemekler', ['Kahvaltı keyfi', 'Simit molası', 'Pizza zamanı', 'Burger keyfi', 'Kebap molası', 'Sushi zamanı', 'Hafif bir öğün', 'Makarna keyfi', 'Patates molası']),
  ('Tatlılar ve atıştırmalıklar', ['Dondurma keyfi', 'Tatlı kaçamağı', 'Waffle zamanı', 'Baklava keyfi', 'Donut molası', 'Kruvasan keyfi', 'Çikolata mutluluğu', 'Film atıştırması', 'Meyve molası']),
  ('Ruh hâli', ['Çok mutluyum', 'Kahkahadayım', 'Kalbim burada', 'Huzurluyum', 'Düşünceliyim', 'Biraz üzgünüm', 'Pilim bitti', 'Biraz sinirliyim', 'Çok şaşırdım']),
  ('Arkadaşlık ve ilişkiler', ['Çak bir beşlik', 'Ekiple birlikte', 'Aile zamanı', 'Randevu zamanı', 'Seni bekliyorum', 'Kendi başıma', 'İyi ki varsın', 'Sen de gel', 'Özledim']),
  ('Yolculuk ve ulaşım', ['Yoldayım', 'Trafikteyim', 'Yürüyerek', 'Bisikletle', 'Scooter ile', 'Tren yolculuğu', 'Otobüsteyim', 'Uçuş zamanı', 'Tatil başladı']),
  ('Günlük yaşam', ['Çalışıyorum', 'Ders zamanı', 'Alışverişteyim', 'Ev keyfi', 'Market turu', 'Bakım zamanı', 'Sağlık molası', 'Patili dostumla', 'Toplantıdayım']),
  ('Spor ve hareket', ['Antrenmandayım', 'Koşu zamanı', 'Maç keyfi', 'Basket zamanı', 'Tenis zamanı', 'Yüzüyorum', 'Yoga molası', 'Doğa yürüyüşü', 'Bowling zamanı']),
  ('Gezi ve eğlence', ['Sahil keyfi', 'Kamptayım', 'Piknik zamanı', 'Sinemadayım', 'Konserdeyim', 'Dans zamanı', 'Oyun molası', 'Keşif turu', 'Balık tutuyorum']),
  ('Hava ve günün saati', ['Güneşli gün', 'Yağmur keyfi', 'Kar zamanı', 'Rüzgârlı', 'Çok sıcak', 'Üşüdüm', 'Gün batımı', 'Gece modu', 'Bulutlu gün']),
  ('Kutlamalar ve özel anlar', ['İyi ki doğdun', 'Mezun oldum', 'Başardım', 'Küçük bir sürpriz', 'Yıl dönümümüz', 'Düğün zamanı', 'Yeni başlangıç', 'Şans benimle', 'Kutlama zamanı']),
  ('Mekân ve check-in', ['Buradayım', 'İlk kez buradayım', 'Yine buradayım', 'Burası kalabalık', 'Tam kafa dinlemelik', 'Manzara şahane', 'Çok lezzetli', 'Beklediğim gibi değil', 'Gizli bir güzellik']),
]

TR = str.maketrans('çğıöşüâîûÇĞİÖŞÜÂÎÛ', 'cgiosuaiuCGIOSUAIU')


def slug(s: str) -> str:
    s = s.translate(TR).lower()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def beyaz_mi(p):  # panel zemini
    return p[0] >= 252 and p[1] >= 252 and p[2] >= 250


def krem_mi(p):  # sayfa zemini (paneller arasi oluklar)
    return p[0] >= 244 and p[1] >= 240 and p[2] <= 247 and (p[0] - p[2]) >= 5


def panelleri_bul(im: Image.Image):
    """Krem OLUKLARDAN 3x4 panel kutularini bulur: tamamen krem olan
    sutunlar/satirlar oluk, aradaki bloklar panel. Beyaz projeksiyonu
    ikonlar boldugu icin ise yaramadi (ilk deneme: 8 sutun, 16 satir)."""
    w, h = im.size
    px = im.load()
    def bloklar(dizi, en_az):
        sonuc, bas = [], None
        for i, oluk in enumerate(dizi + [True]):
            if not oluk and bas is None: bas = i
            elif oluk and bas is not None:
                if i - bas > en_az: sonuc.append((bas, i))
                bas = None
        return sonuc
    ust = 190  # baslik alani disarida
    sutun_oluk = [sum(1 for y in range(ust, h, 3) if krem_mi(px[x, y])) > 0.97 * len(range(ust, h, 3)) for x in range(w)]
    xs = bloklar(sutun_oluk, 200)
    assert len(xs) == 3, f'sutun: {xs}'
    x0, x1 = xs[0][0], xs[0][1]
    satir_oluk = [sum(1 for x in range(x0, x1, 3) if krem_mi(px[x, y])) > 0.97 * len(range(x0, x1, 3)) for y in range(h)]
    ys = [b for b in bloklar(satir_oluk, 200) if b[0] >= ust - 40]
    assert len(ys) == 4, f'satir: {ys}'
    return [(a, c, b, d) for (c, d) in ys for (a, b) in xs]


def ikon_kutusu(im: Image.Image, kutu):
    """Hucre icinde etiketi disarida birakip ikonun sinirlayici kutusunu bulur:
    doygun (renkli) ya da koyu ama ETIKET BANDI DISINDAKI pikseller."""
    x0, y0, x1, y1 = kutu
    px = im.load()
    # etiket bandi: hucrenin alt ~%22'si
    ust, alt = y0, y0 + int((y1 - y0) * 0.78)
    minx, miny, maxx, maxy = x1, y1, x0, y0
    for y in range(ust, alt):
        for x in range(x0, x1):
            r, g, b = px[x, y]
            doygun = max(r, g, b) - min(r, g, b) > 28
            koyu = (r + g + b) < 560
            if doygun or koyu:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    if maxx <= minx:
        return None
    pay = 6
    return (max(x0, minx - pay), max(y0, miny - pay), min(x1, maxx + pay), min(alt + 4, maxy + pay))


def seffaflastir(parca: Image.Image) -> Image.Image:
    """Kenarlardan tasma doldurma: zemine benzeyen (acik, doygunlugu dusuk)
    pikseller seffaf olur; icerideki beyazlar (goz, dis, sut) korunur."""
    parca = parca.convert('RGBA')
    w, h = parca.size
    px = parca.load()
    gorulen = bytearray(w * h)
    kuyruk = deque()
    def zemin(p):
        r, g, b = p[0], p[1], p[2]
        return (r + g + b) > 690 and (max(r, g, b) - min(r, g, b)) < 22
    for x in range(w):
        for y in (0, h - 1):
            if zemin(px[x, y]): kuyruk.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if zemin(px[x, y]): kuyruk.append((x, y))
    while kuyruk:
        x, y = kuyruk.popleft()
        i = y * w + x
        if gorulen[i]: continue
        gorulen[i] = 1
        r, g, b, a = px[x, y]
        # kenar yumusatma: zemine yakinlik oranina gore alfa
        parlaklik = (r + g + b) / 3
        alfa = 0 if parlaklik > 244 else int(max(0, min(255, (244 - parlaklik) * 12)))
        px[x, y] = (r, g, b, alfa)
        if alfa >= 200: continue
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if 0 <= nx < w and 0 <= ny < h and not gorulen[ny * w + nx] and zemin(px[nx, ny]) or (0 <= nx < w and 0 <= ny < h and not gorulen[ny*w+nx] and (px[nx,ny][0]+px[nx,ny][1]+px[nx,ny][2]) > 660 and (max(px[nx,ny][:3]) - min(px[nx,ny][:3])) < 40):
                kuyruk.append((nx, ny))
    return parca


def main():
    im = Image.open(KAYNAK).convert('RGB')
    paneller = panelleri_bul(im)
    os.makedirs(CIKTI, exist_ok=True)
    manifest = []
    kesikler = []
    for pi, (x0, y0, x1, y1) in enumerate(paneller):
        kat_ad, etiketler = KATEGORILER[pi]
        kat_slug = slug(kat_ad)
        os.makedirs(os.path.join(CIKTI, kat_slug), exist_ok=True)
        # baslik bandi ~ ilk %12; kalan alan 3x3
        icerik_ust = y0 + int((y1 - y0) * 0.12)
        icerik_alt = y1 - int((y1 - y0) * 0.02)
        hw = (x1 - x0) / 3
        hh = (icerik_alt - icerik_ust) / 3
        for i, etiket in enumerate(etiketler):
            r, c = divmod(i, 3)
            hucre = (int(x0 + c * hw), int(icerik_ust + r * hh), int(x0 + (c + 1) * hw), int(icerik_ust + (r + 1) * hh))
            kutu = ikon_kutusu(im, hucre)
            if not kutu:
                print('IKON BULUNAMADI', kat_ad, etiket); continue
            parca = seffaflastir(im.crop(kutu))
            bbox = parca.getchannel('A').getbbox()
            if bbox: parca = parca.crop(bbox)
            dosya = f'{kat_slug}/{slug(etiket)}.png'
            parca.save(os.path.join(CIKTI, dosya))
            manifest.append({'kategori': kat_ad, 'kategoriSlug': kat_slug, 'etiket': etiket, 'slug': slug(etiket), 'dosya': dosya, 'boyut': parca.size})
            kesikler.append((kat_ad, etiket, parca))
    json.dump(manifest, open(os.path.join(CIKTI, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # kontrol sayfasi: kareli koyu zemin uzerinde (seffaflik gorunsun)
    N = 12; boy = 120
    sayfa = Image.new('RGBA', (N * boy, ((len(kesikler) + N - 1) // N) * (boy + 18)), (40, 36, 33, 255))
    ciz = ImageDraw.Draw(sayfa)
    for k, (kat, et, p) in enumerate(kesikler):
        x, y = (k % N) * boy, (k // N) * (boy + 18)
        for gx in range(0, boy, 12):
            for gy in range(0, boy, 12):
                if (gx // 12 + gy // 12) % 2: ciz.rectangle((x+gx, y+gy, x+gx+11, y+gy+11), fill=(55, 50, 46, 255))
        q = p.copy(); q.thumbnail((boy - 10, boy - 10))
        sayfa.alpha_composite(q, (x + (boy - q.width) // 2, y + (boy - q.height) // 2))
        ciz.text((x + 3, y + boy + 2), et[:16], fill=(220, 210, 200, 255))
    sayfa.save(KONTROL)
    boyutlar = [m['boyut'] for m in manifest]
    print(f'{len(manifest)} ifade kesildi -> {CIKTI}')
    print('en kucuk/en buyuk kenar:', min(min(b) for b in boyutlar), max(max(b) for b in boyutlar))
    print('kontrol:', KONTROL)


if __name__ == '__main__':
    main()
