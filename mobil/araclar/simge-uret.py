"""Slooin simge varliklarini tek kaynaktan uretir.

Kaynak: tasarim/slooin-logo-2-kaynak.png (kullanicinin 2026-08-25'te
verdigi logo).

TEMEL KURAL: ISARET YENIDEN CIZILMEZ. Ilk denemede beyaz isaret esikle
maskelenip duz beyazla yeniden boyanmisti; kenarlar tirtiklandi ve S'in
katlandigi yerdeki yumusak ic golge kayboldu - kullanicinin ifadesiyle
"goruntu bozuldu". Artik kaynagin PIKSELLERI oldugu gibi kullaniliyor.

Yapilan tek mudahale kosele ilgili: kaynaktaki kiremit beyaz bir zeminin
ortasinda duruyor ve yuvarlak koseleri var; magaza simgesi ise tam
kanama olmali (yuvarlamayi isletim sistemi uygular). Bu yuzden yalnizca
yuvarlak dikdortgenin DISINDA kalan bolge, kaynaktan olculen gradyanla
dolduruluyor ve gecis yumusatiliyor. Isaretin kendisine dokunulmuyor.

Maske yalnizca zemini olmayan surumler icin gerekiyor (Android on plan,
acilis ekrani, uygulama ici isaret). Orada da sert esik yok: alfa mavi
kanaldan YUMUSAK gecisle turetiliyor, boylece kenarlar kaynaktaki gibi
yumusak kaliyor.

Kullanim:  python araclar/simge-uret.py
"""
from PIL import Image, ImageDraw, ImageFilter
import os

KAYNAK = '../tasarim/slooin-logo-2-kaynak.png'
KIREMIT_KUTUSU = (108, 107, 1145, 1145)

# Kaynaktan olculen gradyan koseleri (sol-ust -> sag-alt).
SOL_UST = (254, 170, 3)
SAG_UST = (252, 82, 5)
SOL_ALT = (252, 101, 2)
SAG_ALT = (249, 36, 29)

# Uygulama ici isaretin duz turuncusu: kiremidin orta tonu.
MARKA_TURUNCU = (250, 93, 2)
# Kaynak zeminin mavi kanali (dort kose). Alfa cozumlemesinde
# kullaniliyor - asagidaki isaret_alfasi'na bak.
ZEMIN_MAVI = {'sol_ust': 3, 'sag_ust': 5, 'sol_alt': 2, 'sag_alt': 29}


def gradyan(boyut):
    """Dort kose rengi arasinda iki yonlu dogrusal gecis."""
    g = Image.new('RGB', (boyut, boyut))
    piksel = g.load()
    for y in range(boyut):
        dy = y / (boyut - 1)
        sol = tuple(SOL_UST[i] + (SOL_ALT[i] - SOL_UST[i]) * dy for i in range(3))
        sag = tuple(SAG_UST[i] + (SAG_ALT[i] - SAG_UST[i]) * dy for i in range(3))
        for x in range(boyut):
            dx = x / (boyut - 1)
            piksel[x, y] = tuple(int(sol[i] + (sag[i] - sol[i]) * dx) for i in range(3))
    return g


def acik_surum(alfa):
    """Beyaz zemin + turuncu isaret.

    Isaret yeniden cizilmiyor, yalnizca rengi degisiyor: siluet ve
    yumusak golge cozumlenmis alfadan geliyor.
    """
    boyut = alfa.size[0]
    isaret = Image.new('RGBA', (boyut, boyut), MARKA_TURUNCU + (255,))
    isaret.putalpha(alfa)
    return Image.alpha_composite(
        Image.new('RGBA', (boyut, boyut), (255, 255, 255, 255)), isaret
    ).convert('RGB')


def isaret_alfasi(kiremit):
    """Isaretin alfasini RENK COZUMLEMESIYLE cikarir.

    Kaynaktaki her piksel, beyaz isaret ile turuncu zeminin karisimidir:
    piksel = alfa * beyaz + (1 - alfa) * zemin. Alfayi bu denklemden
    cozersek kenarlardaki ara tonlar oldugu gibi korunur.

    Esikle maskeleme iki kez denendi ve ikisi de bozulma uretti:
    kenarlar tirtiklandi, S'in katlandigi yerdeki yumusak golge ya
    kayboldu ya metalik bir banda dondu. Cozumlemede golge kendiliginden
    dogru cikiyor - o bolge zaten "yari saydam beyaz"dir, yani acik
    zeminde acik turuncu, koyu zeminde soluk somon olur.

    Mavi kanal kullaniliyor: turuncu zeminde 2-29, beyaz isarette 253;
    en genis ayrimi o veriyor.
    """
    boyut = kiremit.size[0]
    px = kiremit.convert('RGB').load()
    alfa = Image.new('L', (boyut, boyut))
    ap = alfa.load()
    for y in range(boyut):
        dy = y / (boyut - 1)
        sol = ZEMIN_MAVI['sol_ust'] + (ZEMIN_MAVI['sol_alt'] - ZEMIN_MAVI['sol_ust']) * dy
        sag = ZEMIN_MAVI['sag_ust'] + (ZEMIN_MAVI['sag_alt'] - ZEMIN_MAVI['sag_ust']) * dy
        for x in range(boyut):
            dx = x / (boyut - 1)
            zemin = sol + (sag - sol) * dx
            a = (px[x, y][2] - zemin) / (253.0 - zemin)
            ap[x, y] = 0 if a <= 0 else (255 if a >= 1 else int(a * 255))
    return alfa


def yaz(gorsel, yol):
    klasor = os.path.dirname(yol)
    if klasor:
        os.makedirs(klasor, exist_ok=True)
    gorsel.save(yol)
    print('  yazildi', yol, gorsel.size)


def main():
    kaynak = Image.open(KAYNAK)
    kiremit = kaynak.crop(KIREMIT_KUTUSU)
    # Kaynaktaki kiremit bir piksel kadar dikdortgen (1037x1038); kare
    # olmayan bir simge magazalarda reddediliyor.
    boyut = min(kiremit.size)
    kiremit = kiremit.resize((boyut, boyut), Image.LANCZOS).convert('RGB')

    # 1) Magaza simgesi: kiremitin ICINDEN kare kirpiliyor.
    #
    # Kosenin disini yapay olarak doldurmak iki kez denendi (once duz
    # gradyan, sonra kaynaktan yayilim) ve ikisinde de koselerde soluk
    # bir yay kaldi. Yuvarlak kosenin tamamen disinda kalan en buyuk
    # kare, kenardan yaricapin %29.3'u kadar iceridedir; %7.5 ic payla
    # kirpinca kose artigi kalmiyor ve her piksel kaynagin kendi
    # pikseli oluyor. Bedeli: isaret %16 buyuyor - simgede sorun degil,
    # zaten iOS/Android simgeleri boyle dolu durur.
    pay = int(boyut * 0.075)
    simge = kiremit.crop((pay, pay, boyut - pay, boyut - pay))
    yaz(simge.resize((1024, 1024), Image.LANCZOS), 'assets/images/icon.png')
    yaz(simge.resize((64, 64), Image.LANCZOS), 'assets/images/favicon.png')

    # Zeminsiz surumler icin alfa.
    alfa = isaret_alfasi(kiremit)

    beyaz = Image.new('RGBA', (boyut, boyut), (255, 255, 255, 255))
    beyaz.putalpha(alfa)
    turuncu = Image.new('RGBA', (boyut, boyut), MARKA_TURUNCU + (255,))
    turuncu.putalpha(alfa)
    siyah = Image.new('RGBA', (boyut, boyut), (0, 0, 0, 255))
    siyah.putalpha(alfa)

    # 2) Android uyarlanabilir simge: on plan guvenli alanda kucuk durur
    #    (dis %25 maskeyle kirpilabilir), arka plan gradyan.
    def guvenli_alanda(kaynak_gorsel):
        tuval = Image.new('RGBA', (boyut, boyut), (255, 255, 255, 0))
        kucuk = kaynak_gorsel.resize((int(boyut * 0.62), int(boyut * 0.62)), Image.LANCZOS)
        tuval.paste(kucuk, ((boyut - kucuk.size[0]) // 2, (boyut - kucuk.size[1]) // 2), kucuk)
        return tuval

    yaz(guvenli_alanda(beyaz).resize((1024, 1024), Image.LANCZOS),
        'assets/images/android-icon-foreground.png')
    yaz(gradyan(boyut).resize((1024, 1024), Image.LANCZOS),
        'assets/images/android-icon-background.png')
    yaz(guvenli_alanda(siyah).resize((1024, 1024), Image.LANCZOS),
        'assets/images/android-icon-monochrome.png')

    # 3) Acilis ekrani: isaret TURUNCU. Acilis zemini acik (#FAF7F3);
    #    beyaz isaret orada gorunmez olurdu.
    yaz(turuncu.resize((512, 512), Image.LANCZOS), 'assets/images/splash-icon.png')

    # 4) Uygulama ICI isaret: acik zeminde turuncu, koyu zeminde beyaz.
    yaz(turuncu.resize((512, 512), Image.LANCZOS), 'assets/images/marka-isareti-acik.png')
    yaz(beyaz.resize((512, 512), Image.LANCZOS), 'assets/images/marka-isareti-koyu.png')

    # 5) ACIK SURUM: beyaz zemin, turuncu isaret. Ayni kirpma
    #    geometrisiyle uretiliyor ki koyu surumle birebir ortussun.
    acik = acik_surum(alfa).crop((pay, pay, boyut - pay, boyut - pay))
    yaz(acik.resize((1024, 1024), Image.LANCZOS), '../tasarim/slooin-simge-2-acik.png')

    # 6) Tasarim klasorune referans kopya.
    yaz(simge.resize((512, 512), Image.LANCZOS), '../tasarim/slooin-simge-2.png')


if __name__ == '__main__':
    main()
