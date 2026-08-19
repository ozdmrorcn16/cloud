"""Komut satiri arayuzu.

    python -m otomasyon dogrula                 # ortam ve saglayici kontrolu
    python -m otomasyon tam-akis --kuru         # yuklemeden uctan uca uret
    python -m otomasyon tam-akis --konu "..."   # belirli konuyla uret + yukle
    python -m otomasyon montaj                  # son uretimin yalnizca montaji
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import gecmis
from .akis import Akis, son_uretim
from .arac import AracHatasi, var_mi
from .ayarlar import Ayarlar
from .gunluk import gunlukcu, kur
from .modeller import Uretim

KAYIT = gunlukcu("otomasyon.cli")


def _ayrastirici() -> argparse.ArgumentParser:
    ana = argparse.ArgumentParser(
        prog="python -m otomasyon",
        description="Uctan uca YouTube video otomasyonu",
    )
    ana.add_argument("--konfig", help="Yapilandirma dosyasi (varsayilan: konfig/kanal.yaml)")
    ana.add_argument(
        "--ayar", action="append", default=[], metavar="ANAHTAR=DEGER",
        help="Tek seferlik ayar ezmesi, ornek: --ayar video.hedef_sure=30",
    )
    ana.add_argument("-v", "--ayrintili", action="store_true", help="Ayrintili gunluk")

    alt = ana.add_subparsers(dest="komut", required=True)

    alt.add_parser("dogrula", help="Ortami ve saglayicilari kontrol et")
    alt.add_parser("gecmis", help="Uretim gecmisini listele")
    alt.add_parser("sesler", help="Kullanilabilir edge-tts seslerini listele")

    p_konu = alt.add_parser("konular", help="Yeni video konusu oner")
    p_konu.add_argument("-n", "--adet", type=int, default=5)

    p_tam = alt.add_parser("tam-akis", help="Fikirden yuklemeye kadar hepsini calistir")
    p_tam.add_argument("--konu", help="Konuyu kendin ver (yoksa otomatik secilir)")
    p_tam.add_argument("--kuru", action="store_true", help="Yukleme yapma, sadece raporla")
    p_tam.add_argument("--yuklemesiz", action="store_true", help="Yukleme adimini tamamen atla")

    p_yeni = alt.add_parser("yeni", help="Yalnizca yeni uretim dizini olustur")
    p_yeni.add_argument("--konu")

    for ad, yardim in [
        ("senaryo", "Senaryo ve ust veriyi yaz"),
        ("ses", "Sahneleri seslendir"),
        ("gorsel", "Sahne gorsellerini getir"),
        ("montaj", "Klipleri birlestir, altyaziyi gom"),
        ("kapak", "Kapak (thumbnail) uret"),
    ]:
        alt_p = alt.add_parser(ad, help=yardim)
        alt_p.add_argument("--uretim", help="Uretim dizini (varsayilan: en sonuncusu)")
        if ad == "senaryo":
            alt_p.add_argument("--konu")

    p_yukle = alt.add_parser("yukle", help="Hazir videoyu YouTube'a yukle")
    p_yukle.add_argument("--uretim")
    p_yukle.add_argument("--kuru", action="store_true")

    return ana


def _uretim_bul(ayarlar: Ayarlar, dizin: str | None) -> Uretim:
    return Uretim.yukle(Path(dizin)) if dizin else son_uretim(ayarlar)


def _dogrula(ayarlar: Ayarlar) -> int:
    from .saglayicilar.gorsel import SINIFLAR as GORSEL
    from .saglayicilar.metin import SINIFLAR as METIN
    from .saglayicilar.ses import SINIFLAR as SES
    from .saglayicilar.yukleme import SINIFLAR as YUKLEME

    print("== Dis araclar ==")
    sorun = 0
    for arac, zorunlu in [("ffmpeg", True), ("ffprobe", True), ("espeak-ng", False)]:
        varmi = var_mi(arac)
        print(f"  {'OK ' if varmi else ('EKSIK' if zorunlu else 'yok')}  {arac}")
        if zorunlu and not varmi:
            sorun += 1

    print("\n== Python paketleri ==")
    for paket, aciklama in [
        ("edge_tts", "ucretsiz seslendirme"),
        ("httpx", "HTTP istekleri"),
        ("PIL", "kapak/gorsel uretimi"),
        ("anthropic", "Claude ile senaryo"),
        ("googleapiclient", "YouTube yukleme"),
        ("yaml", "yapilandirma"),
    ]:
        try:
            __import__(paket)
            print(f"  OK    {paket} ({aciklama})")
        except ImportError:
            print(f"  yok   {paket} ({aciklama})")

    print("\n== Saglayicilar ==")
    for baslik, sinifar, sira in [
        ("metin", METIN, ayarlar.liste("metin.saglayici_sirasi")),
        ("ses", SES, ayarlar.liste("ses.saglayici_sirasi")),
        ("gorsel", GORSEL, ayarlar.liste("gorsel.saglayici_sirasi")),
        ("yukleme", YUKLEME, [ayarlar.al("yukleme.saglayici", "kuru")]),
    ]:
        durumlar = []
        for ad in sira:
            sinif = sinifar.get(str(ad))
            if not sinif:
                durumlar.append(f"{ad}(bilinmiyor)")
                continue
            try:
                hazir = sinif(ayarlar).hazir()
            except Exception:
                hazir = False
            durumlar.append(f"{ad}{'*' if hazir else ''}")
        print(f"  {baslik:8s}: {', '.join(durumlar)}   (* = hazir)")

    print("\n== Yapilandirma ==")
    print(f"  kanal      : {ayarlar.al('kanal.ad')}")
    print(f"  bicim      : {ayarlar.al('video.bicim')} ({ayarlar.cozunurluk[0]}x{ayarlar.cozunurluk[1]})")
    print(f"  hedef sure : {ayarlar.al('video.hedef_sure')} sn / {ayarlar.al('video.sahne_sayisi')} sahne")
    print(f"  gizlilik   : {ayarlar.al('yukleme.gizlilik')}")
    print(f"  cikti      : {ayarlar.mutlak(str(ayarlar.al('cikti.dizin')))}")

    if sorun:
        print("\nEksikler var: ffmpeg kurulmadan video uretilemez.")
    else:
        print("\nOrtam hazir.")
    return 1 if sorun else 0


def _sesler() -> int:
    import asyncio

    try:
        import edge_tts
    except ImportError:
        print("edge-tts kurulu degil: pip install edge-tts")
        return 1

    async def _listele():
        return await edge_tts.list_voices()

    for ses in asyncio.run(_listele()):
        if str(ses.get("Locale", "")).startswith("tr"):
            print(f"  {ses['ShortName']:26s} {ses.get('Gender','')}")
    return 0


def main(argumanlar: list[str] | None = None) -> int:
    secim = _ayrastirici().parse_args(argumanlar)
    kur(secim.ayrintili)
    ayarlar = Ayarlar.yukle(secim.konfig, secim.ayar)
    akis = Akis(ayarlar)

    try:
        if secim.komut == "dogrula":
            return _dogrula(ayarlar)

        if secim.komut == "sesler":
            return _sesler()

        if secim.komut == "gecmis":
            kayitlar = gecmis.oku(ayarlar)
            if not kayitlar:
                print("Gecmis bos.")
            for kayit in kayitlar[-30:]:
                print(f"  {kayit.get('tarih','')}  {kayit.get('konu','')}"
                      f"  {kayit.get('youtube_url') or '(yuklenmedi)'}")
            return 0

        if secim.komut == "konular":
            from .saglayicilar.metin import metin_saglayici

            saglayici = metin_saglayici(ayarlar)
            for fikir in saglayici.konu_uret(secim.adet, gecmis.islenen_konular(ayarlar)):
                print(f"  - {fikir.konu}" + (f"  ({fikir.aciklama})" if fikir.aciklama else ""))
            return 0

        if secim.komut == "tam-akis":
            uretim = akis.tam(konu=secim.konu, kuru=secim.kuru, yuklemesiz=secim.yuklemesiz)
            print(f"\nVideo: {uretim.video_yolu}")
            print(f"Kapak: {uretim.kapak_yolu}")
            if uretim.youtube_url:
                print(f"YouTube: {uretim.youtube_url}")
            return 0

        if secim.komut == "yeni":
            uretim = akis.uretim_olustur(secim.konu)
            print(uretim.dizin)
            return 0

        uretim = _uretim_bul(ayarlar, getattr(secim, "uretim", None))
        if secim.komut == "senaryo":
            akis.adim_senaryo(uretim, getattr(secim, "konu", None))
        elif secim.komut == "ses":
            akis.adim_ses(uretim)
        elif secim.komut == "gorsel":
            akis.adim_gorsel(uretim)
        elif secim.komut == "montaj":
            akis.adim_montaj(uretim)
            print(uretim.video_yolu)
        elif secim.komut == "kapak":
            akis.adim_kapak(uretim)
            print(uretim.kapak_yolu)
        elif secim.komut == "yukle":
            akis.adim_yukle(uretim, kuru=secim.kuru)
            print(uretim.youtube_url or "(yuklenmedi)")
        return 0

    except AracHatasi as hata:
        KAYIT.error("%s", hata)
        return 2
    except KeyboardInterrupt:
        KAYIT.warning("Iptal edildi")
        return 130


if __name__ == "__main__":
    sys.exit(main())
