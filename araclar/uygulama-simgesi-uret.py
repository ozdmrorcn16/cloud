"""UYGULAMA SIMGESI - kullanicinin 2026-09-09'da verdigi yeni gorselden.

Kullanicinin talimati: "uygulamanin telefonda gorunen logosu bu olucak."
Kaynak: `tasarim/slooin-simge-3-kaynak.png` (1254x1254, turuncu gradyan
uzerinde beyaz S ve iki nokta, yuvarlatilmis kare, cevresinde beyaz pay).

URETILEN DOSYALAR
  mobil/assets/images/icon.png                  1024, TAM KARE
  mobil/assets/images/android-icon-background.png  1024, yalnizca gradyan
  mobil/assets/images/android-icon-foreground.png  1024, S saydam zeminde
  mobil/assets/images/android-icon-monochrome.png  1024, S beyaz siluet
  mobil/assets/images/favicon.png                  64
  mobil/public/pwa-192-v3.png / pwa-512-v3.png / apple-touch-icon-v3.png

IKI KRITIK DONUSUM, ikisi de gozle degil olcumle:

1. SIMGE SIFIRDAN KURULUYOR, kaynak kirpilmiyor. iOS ve Android
   simgeyi KENDI maskeliyor; hazir yuvarlatilmis bir gorsel verilirse
   koselerde beyaz ucgenler kaliyor (kaynakta kose pikseli
   254,254,253). Ilk deneme koseleri en yakin ic pikselle doldurmakti
   (`distance_transform_edt`) ve SURTUK IZLERI birakti - gorsel
   dogrulamada elendi. Simdi zemin OLCULUP yeniden ureliyor
   (`gradyan_kur`), isaret ustune biniyor: tam kare, dikissiz.

2. PWA DOSYA ADLARINDA SURUM VAR. iOS ana ekran kisayolunun simgesini
   ADRESE gore onbellege aliyor; ayni adla yeni gorsel yayinlaninca
   telefonda ESKI logo gorunmeye devam ediyor (bir kez yasandi).
   Logo degisince SURUM artirilir.

DIKKAT - OTA ILE GITMEZ: uygulama simgesi native pakete gomulu.
Telefonda degismesi icin YENI BIR DERLEME gerekiyor
(`eas build --platform ios --profile production`).
"""
import os
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage

SURUM = 3

KOK = pathlib.Path(__file__).resolve().parent.parent
KAYNAK = KOK / 'tasarim' / 'slooin-simge-3-kaynak.png'
VARLIKLAR = KOK / 'mobil' / 'assets' / 'images'
GENEL = KOK / 'mobil' / 'public'


def kaynagi_oku() -> np.ndarray:
    return np.array(Image.open(KAYNAK).convert('RGB')).astype(np.int16)


def simge_maskesi(a: np.ndarray) -> np.ndarray:
    """Yuvarlatilmis karenin ICI: beyaz paydan ayiran maske.

    Olcut RENK DEGIL DOYGUNLUK: simgenin kendi icinde de beyaz alanlar
    var (S harfi ve iki nokta), yani "beyaz olmayan" demek S'i disarida
    birakirdi. Dis pay NOTR beyaz (254,254,253 - kanallar arasi fark ~1),
    gradyan ise doygun. Once doygun bolge bulunuyor, sonra delikleri
    dolduruluyor - S ve noktalar boylece iceride kaliyor.
    """
    doygunluk = a.max(axis=2) - a.min(axis=2)
    kaba = doygunluk > 12
    dolu = ndimage.binary_fill_holes(kaba)
    # En buyuk bilesen: kenardaki tekil gurultu icerde sayilmasin.
    etiket, adet = ndimage.label(dolu)
    if adet > 1:
        boyutlar = ndimage.sum(dolu, etiket, range(1, adet + 1))
        dolu = etiket == (int(np.argmax(boyutlar)) + 1)
    return dolu


def gradyan_kur(a: np.ndarray, ic: np.ndarray, boyut: int) -> np.ndarray:
    """Zemini SIFIRDAN kurar: kaynaktaki gradyanin dogrusal modeli.

    KOSE DOLDURMA DENENDI VE ELENDI: yuvarlak koseleri en yakin ic
    pikselle doldurmak (`distance_transform_edt`) koselerde SURTUK
    IZLERI birakti - maskenin kenarinda kalan yumusak parilti cizgi
    cizgi yayildi. Gorsel olarak dogrulandi, kabul edilebilir degildi.

    Bunun yerine zemin OLCULUYOR: doygun (isaret olmayan) ic piksellere
    kanal basina `renk = sabit + a*x + b*y` dogrusal modeli en kucuk
    kareler ile oturtuluyor. Kaynak zaten iki duraklı capraz bir
    gradyan oldugu icin model onu neredeyse birebir veriyor ve
    KOSELERDE DE tanimli - yani tam kare, dikissiz.
    """
    h, w, _ = a.shape
    doygunluk = a.max(axis=2) - a.min(axis=2)
    zemin = ndimage.binary_erosion(ic & (doygunluk > 60), iterations=12)
    ys, xs = np.where(zemin)
    tasarim = np.column_stack([np.ones(len(ys)), xs / w, ys / h])

    izgara_y, izgara_x = np.mgrid[0:boyut, 0:boyut] / boyut
    cikti = np.zeros((boyut, boyut, 3))
    for k in range(3):
        katsayi, *_ = np.linalg.lstsq(tasarim, a[ys, xs, k], rcond=None)
        cikti[..., k] = katsayi[0] + katsayi[1] * izgara_x + katsayi[2] * izgara_y
    return np.clip(cikti, 0, 255)


def kirp(a: np.ndarray, ic: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Yuvarlatilmis karenin sinir kutusuna kirpar (dis beyaz pay gider)."""
    ys, xs = np.where(ic)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return a[y0:y1, x0:x1], ic[y0:y1, x0:x1]


def isaret_maskesi(a: np.ndarray) -> np.ndarray:
    """Beyaz S ve iki nokta. Doygunluk DUSUK, parlaklik YUKSEK.

    RENK OLCUTUE TEK BASINA YETMIYOR: kaynaktaki yuvarlatilmis karenin
    PARLAK RIMI de acik ve doygunlugu dusuk, yani ayni olcuete uyuyor.
    Disari alinmazsa simgenin uzerinde HAYALET BIR CERCEVE ciziliyor -
    iki uretimde de gorsel dogrulamada goruIdue (once erozyonla
    denendi, rim erozyondan da kurtuldu).

    Ayirici olcut BICIM: rim bir HALKA, yani sinir kutusu neredeyse
    gorselin tamami ama alani kucuk. S ve noktalar dolu bicimler.
    Sinir kutusu %90'i asan bilesenler eleniyor.
    """
    doygunluk = a.max(axis=2) - a.min(axis=2)
    parlaklik = a.mean(axis=2)
    kaba = (doygunluk < 45) & (parlaklik > 170)

    h, w = kaba.shape
    etiket, adet = ndimage.label(kaba)
    temiz = np.zeros_like(kaba)
    for i, dilim in enumerate(ndimage.find_objects(etiket), start=1):
        parca = etiket[dilim] == i
        alan = parca.sum()
        if alan < 0.001 * h * w:
            continue  # tekil gurultu
        kutu_h = dilim[0].stop - dilim[0].start
        kutu_w = dilim[1].stop - dilim[1].start
        if kutu_h > 0.9 * h and kutu_w > 0.9 * w:
            continue  # HALKA: rim
        temiz[dilim][parca] = True
    return temiz


def yaz(gorsel: Image.Image, yol: pathlib.Path, boyut: int) -> None:
    """Once GECICI dosyaya yazip yerine tasir.

    Windows'ta hedefin uzerine dogrudan yazmak araliklarla
    `OSError: [Errno 22] Invalid argument` veriyordu (yasandi): buyuk
    bir PNG yazildiktan hemen sonra dosya kisa sure baska bir surec
    tarafindan tutulabiliyor. `os.replace` atomik ve hedefi acmiyor.
    """
    yol.parent.mkdir(parents=True, exist_ok=True)
    gecici = yol.with_suffix('.gecici.png')
    gorsel.resize((boyut, boyut), Image.LANCZOS).save(gecici)
    os.replace(gecici, yol)
    print(f'  {yol.relative_to(KOK)}  {boyut}x{boyut}')


def main() -> None:
    ham = kaynagi_oku()
    ic = simge_maskesi(ham)
    print(f'ic bolge orani: {ic.mean():.1%}')

    BOYUT = 1024
    zemin = gradyan_kur(ham.astype(float), ic, BOYUT)
    print(f'zemin kosesi sol ust {zemin[0, 0].round()}  sag alt {zemin[-1, -1].round()}')

    # ISARET: kirpilmis kareden alinip tam boyuta olcekleniyor.
    kirpik, ic_kirpik = kirp(ham, ic)
    # Kenardan biraz iceri: dis paydaki yumusak parilti maskeye
    # girmesin. Halka elemesi `isaret_maskesi` icinde.
    ic_ic = ndimage.binary_erosion(ic_kirpik, iterations=10)
    isaret = isaret_maskesi(kirpik) & ic_ic

    isaret_rgba = np.zeros((*isaret.shape, 4), dtype=np.uint8)
    isaret_rgba[..., :3] = kirpik.astype(np.uint8)
    isaret_rgba[..., 3] = (isaret * 255).astype(np.uint8)
    # Kenar yumusatma: sert maske merdiven basamagi birakiyor.
    isaret_gorsel = Image.fromarray(isaret_rgba, 'RGBA').resize((BOYUT, BOYUT), Image.LANCZOS)

    # ISARET, kaynaktaki oraniyla degil biraz DAHA KUCUK yerlestiriliyor:
    # kaynakta simge kenarlara kadar dayaniyor ve iOS'un maskesi
    # koseleri kirptiginda isaret sikisik gorunuyor.
    olcek = 0.86
    kucuk = isaret_gorsel.resize((int(BOYUT * olcek), int(BOYUT * olcek)), Image.LANCZOS)
    kare_gorsel = Image.fromarray(zemin.astype(np.uint8), 'RGB').convert('RGBA')
    kare_gorsel.paste(
        kucuk,
        ((BOYUT - kucuk.width) // 2, (BOYUT - kucuk.height) // 2),
        kucuk,
    )
    kare_gorsel = kare_gorsel.convert('RGB')

    print('\nSimgeler:')
    yaz(kare_gorsel, VARLIKLAR / 'icon.png', 1024)
    yaz(kare_gorsel, VARLIKLAR / 'favicon.png', 64)

    # ANDROID UYARLANABILIR SIMGE: zemin ve on plan AYRI katman.
    # On plan GUVENLI ALANA (%66) sigiyor - Android kenarlardan kirpiyor
    # ve kirpilan bolgeye dusen bir isaret yarim gorunur.
    yaz(Image.fromarray(zemin.astype(np.uint8), 'RGB'), VARLIKLAR / 'android-icon-background.png', 1024)

    guvenli = Image.new('RGBA', (BOYUT, BOYUT), (0, 0, 0, 0))
    ic_olcek = int(BOYUT * 0.66)
    guvenli.paste(
        isaret_gorsel.resize((ic_olcek, ic_olcek), Image.LANCZOS),
        ((BOYUT - ic_olcek) // 2, (BOYUT - ic_olcek) // 2),
    )
    yaz(guvenli, VARLIKLAR / 'android-icon-foreground.png', 1024)

    # TEK RENK (monochrome): Android 13+ tema simgesi. Yalnizca siluet.
    tek = np.zeros((BOYUT, BOYUT, 4), dtype=np.uint8)
    tek[..., :3] = 255
    tek[..., 3] = np.array(guvenli)[..., 3]
    yaz(Image.fromarray(tek, 'RGBA'), VARLIKLAR / 'android-icon-monochrome.png', 1024)

    print('\nPWA (adlarinda SURUM var):')
    yaz(kare_gorsel, GENEL / f'pwa-192-v{SURUM}.png', 192)
    yaz(kare_gorsel, GENEL / f'pwa-512-v{SURUM}.png', 512)
    yaz(kare_gorsel, GENEL / f'apple-touch-icon-v{SURUM}.png', 180)

    print('\nDIKKAT: simge NATIVE pakete gomulu, OTA ile GITMEZ.')
    print('Telefonda degismesi icin yeni bir derleme gerekiyor.')


if __name__ == '__main__':
    main()
