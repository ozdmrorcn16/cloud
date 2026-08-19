"""Boru hattinin orkestrasyonu.

Adimlar sirayla calisir ama her biri bagimsizdir: `durum.json` sayesinde
"sadece montaji tekrarla" ya da "sadece yukle" demek mumkundur.
"""

from __future__ import annotations

import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

from . import altyazi as altyazi_modulu
from . import gecmis, montaj
from .arac import AracHatasi, gerekli_araclar, sure_ogren
from .ayarlar import Ayarlar
from .gunluk import gunlukcu
from .modeller import Fikir, Uretim
from .saglayicilar.gorsel import gorsel_saglayicilari
from .saglayicilar.metin import metin_saglayici
from .saglayicilar.ses import ses_saglayicilari
from .saglayicilar.yukleme import yukleyici

KAYIT = gunlukcu("otomasyon.akis")


def slugla(metin: str, uzunluk: int = 40) -> str:
    esleme = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosucgiosu")
    metin = metin.translate(esleme)
    metin = unicodedata.normalize("NFKD", metin).encode("ascii", "ignore").decode()
    metin = re.sub(r"[^a-zA-Z0-9]+", "-", metin).strip("-").lower()
    return metin[:uzunluk] or "video"


class Akis:
    def __init__(self, ayarlar: Ayarlar) -> None:
        self.ayarlar = ayarlar

    # -- 0. hazirlik ---------------------------------------------------------
    def uretim_olustur(self, konu: str | None = None) -> Uretim:
        if konu:
            fikir = Fikir(konu=konu.strip())
        else:
            saglayici = metin_saglayici(self.ayarlar)
            fikirler = saglayici.konu_uret(3, gecmis.islenen_konular(self.ayarlar))
            islenmis = set(gecmis.islenen_konular(self.ayarlar))
            kalanlar = [f for f in fikirler if f.konu not in islenmis]
            if not kalanlar:
                raise AracHatasi("Yeni konu bulunamadi (hepsi daha once islenmis)")
            fikir = kalanlar[0]
        KAYIT.info("Konu: %s", fikir.konu)

        damga = datetime.now().strftime("%Y%m%d-%H%M%S")
        kimlik = f"{damga}-{slugla(fikir.konu)}"
        dizin = self.ayarlar.mutlak(str(self.ayarlar.al("cikti.dizin", "cikti"))) / kimlik
        dizin.mkdir(parents=True, exist_ok=True)
        uretim = Uretim(
            kimlik=kimlik,
            dizin=str(dizin),
            olusturma=datetime.now().isoformat(timespec="seconds"),
        )
        uretim.senaryo = None
        uretim.kaydet()
        # Fikri gecici olarak sakla (senaryo adimi kullanacak).
        (dizin / "fikir.txt").write_text(fikir.konu, encoding="utf-8")
        return uretim

    # -- 1. senaryo ----------------------------------------------------------
    def adim_senaryo(self, uretim: Uretim, konu: str | None = None) -> Uretim:
        if konu is None:
            fikir_dosyasi = uretim.yol / "fikir.txt"
            konu = fikir_dosyasi.read_text(encoding="utf-8").strip() if fikir_dosyasi.exists() else ""
        if not konu:
            raise AracHatasi("Senaryo icin konu yok")
        saglayici = metin_saglayici(self.ayarlar)
        try:
            senaryo = saglayici.senaryo_yaz(Fikir(konu=konu))
        except Exception as hata:
            if saglayici.ad == "sablon":
                raise
            KAYIT.warning("%s senaryo yazamadi (%s); sablona dusuluyor", saglayici.ad, hata)
            from .saglayicilar.metin import SablonMetin

            senaryo = SablonMetin(self.ayarlar).senaryo_yaz(Fikir(konu=konu))
            uretim.not_dus(f"senaryo sablona dustu: {hata}")
        uretim.senaryo = senaryo
        (uretim.yol / "senaryo.txt").write_text(
            f"{senaryo.baslik}\n\n{senaryo.tum_metin()}\n", encoding="utf-8"
        )
        uretim.kaydet()
        KAYIT.info("Senaryo (%s): %d sahne, ~%d kelime",
                   senaryo.kaynak, len(senaryo.sahneler), len(senaryo.tum_metin().split()))
        return uretim

    # -- 2. seslendirme ------------------------------------------------------
    def adim_ses(self, uretim: Uretim) -> Uretim:
        if not uretim.senaryo:
            raise AracHatasi("Once senaryo adimini calistir")
        gerekli_araclar("ffmpeg", "ffprobe")
        dizin = uretim.alt_dizin("ses")
        saglayicilar = ses_saglayicilari(self.ayarlar)
        KAYIT.info("Ses saglayici sirasi: %s", ", ".join(s.ad for s in saglayicilar))
        elenen: set[str] = set()

        # Kanca ilk sahnenin basina eklenir, kapanis son sahnenin sonuna.
        metinler = [s.metin for s in uretim.senaryo.sahneler]
        if uretim.senaryo.kanca:
            metinler[0] = f"{uretim.senaryo.kanca} {metinler[0]}"
        if uretim.senaryo.kapanis:
            metinler[-1] = f"{metinler[-1]} {uretim.senaryo.kapanis}"

        kullanilan = ""
        for sira, (sahne, metin) in enumerate(zip(uretim.senaryo.sahneler, metinler)):
            sahne.metin = metin
            son_hata: Exception | None = None
            for saglayici in list(saglayicilar):
                hedef = dizin / f"sahne-{sira:02d}{saglayici.uzanti}"
                try:
                    saglayici.seslendir(metin, hedef)
                    sahne.ses_yolu = str(hedef)
                    sahne.sure = sure_ogren(hedef)
                    if saglayici.ad != kullanilan:
                        KAYIT.info("Seslendirme: %s", saglayici.ad)
                        kullanilan = saglayici.ad
                    break
                except Exception as hata:
                    son_hata = hata
                    # Ayni saglayici her sahnede tekrar denenmesin.
                    if saglayici.ad not in elenen:
                        elenen.add(saglayici.ad)
                        KAYIT.warning("%s seslendiremedi (%s); sonraki saglayiciya geciliyor",
                                      saglayici.ad, str(hata).splitlines()[0][:160])
                    saglayicilar = [x for x in saglayicilar if x.ad != saglayici.ad] or saglayicilar
            else:
                raise AracHatasi(f"Sahne {sira} seslendirilemedi: {son_hata}")
            KAYIT.debug("Sahne %d: %.2f sn", sira, sahne.sure)

        if kullanilan and kullanilan != (self.ayarlar.liste("ses.saglayici_sirasi") or [""])[0]:
            uretim.not_dus(f"seslendirme saglayicisi: {kullanilan}")
        toplam = sum(s.sure for s in uretim.senaryo.sahneler)
        KAYIT.info("Toplam konusma suresi: %.1f sn", toplam)
        uretim.kaydet()
        return uretim

    # -- 3. gorseller --------------------------------------------------------
    def adim_gorsel(self, uretim: Uretim) -> Uretim:
        if not uretim.senaryo:
            raise AracHatasi("Once senaryo adimini calistir")
        dizin = uretim.alt_dizin("gorsel")
        saglayicilar = gorsel_saglayicilari(self.ayarlar)
        KAYIT.info("Gorsel saglayici sirasi: %s", ", ".join(s.ad for s in saglayicilar))

        for sira, sahne in enumerate(uretim.senaryo.sahneler):
            for saglayici in list(saglayicilar):
                try:
                    yol = saglayici.getir(sahne, sira, dizin)
                    sahne.gorsel_yolu = str(yol)
                    sahne.gorsel_kaynagi = saglayici.ad
                    break
                except Exception as hata:
                    KAYIT.warning("Sahne %d icin %s basarisiz (%s)", sira, saglayici.ad,
                                  str(hata).splitlines()[0][:160])
            else:
                raise AracHatasi(f"Sahne {sira} icin gorsel bulunamadi")
        kaynaklar = {s.gorsel_kaynagi for s in uretim.senaryo.sahneler}
        KAYIT.info("Gorseller hazir (kaynak: %s)", ", ".join(sorted(k or "?" for k in kaynaklar)))
        uretim.kaydet()
        return uretim

    # -- 4. montaj -----------------------------------------------------------
    def adim_montaj(self, uretim: Uretim) -> Uretim:
        if not uretim.senaryo:
            raise AracHatasi("Once senaryo adimini calistir")
        gerekli_araclar("ffmpeg", "ffprobe")
        sahneler = uretim.senaryo.sahneler
        eksik = [i for i, s in enumerate(sahneler) if not (s.ses_yolu and s.gorsel_yolu)]
        if eksik:
            raise AracHatasi(f"Su sahnelerde ses ya da gorsel eksik: {eksik}")

        bosluk = float(self.ayarlar.al("video.sahne_arasi_bosluk", 0.25))
        klip_dizini = uretim.alt_dizin("klipler")

        # 4a. sahne klipleri
        klipler: list[Path] = []
        imlec = 0.0
        bloklar: list[tuple[str, float, float]] = []
        for sira, sahne in enumerate(sahneler):
            sure = sahne.sure + bosluk
            klip = montaj.sahne_klibi(
                Path(sahne.gorsel_yolu), sure, klip_dizini / f"klip-{sira:02d}.mp4", self.ayarlar
            )
            klipler.append(klip)
            bloklar.append((sahne.metin, imlec, sahne.sure))
            imlec += sure

        # 4b. goruntu ve sesi ayri ayri birlestir
        video_ham = montaj.klipleri_birlestir(klipler, uretim.yol / "goruntu.mp4")
        ses_birlesik = montaj.sesleri_birlestir(
            [Path(s.ses_yolu) for s in sahneler], bosluk, uretim.yol / "ses.m4a"
        )
        uretim.ses_yolu = str(ses_birlesik)

        # 4c. altyazi
        srt: Path | None = None
        gomulecek: Path | None = None
        if self.ayarlar.al("altyazi.etkin", True):
            satirlar = altyazi_modulu.satirlar_uret(
                bloklar, int(self.ayarlar.al("altyazi.kelime_sayisi", 4))
            )
            srt = altyazi_modulu.srt_yaz(satirlar, uretim.yol / "altyazi.srt")
            uretim.altyazi_yolu = str(srt)
            # Goruntuye gomulen bicim ASS: punto ve bosluklar piksel bazli olsun.
            gomulecek = altyazi_modulu.ass_yaz(
                satirlar, uretim.yol / "altyazi.ass", self.ayarlar
            )
            KAYIT.info("Altyazi: %d satir", len(satirlar))

        # 4d. son montaj
        video = montaj.son_montaj(
            video_ham, ses_birlesik, uretim.yol / f"{uretim.kimlik}.mp4", self.ayarlar, gomulecek
        )
        uretim.video_yolu = str(video)
        uretim.sure = sure_ogren(video)
        video_ham.unlink(missing_ok=True)
        montaj.gecicileri_temizle(uretim.yol)
        uretim.kaydet()
        return uretim

    # -- 5. kapak ------------------------------------------------------------
    def adim_kapak(self, uretim: Uretim) -> Uretim:
        ilk = None
        if uretim.senaryo and uretim.senaryo.sahneler:
            yol = uretim.senaryo.sahneler[0].gorsel_yolu
            ilk = Path(yol) if yol else None
        kapak = montaj.kapak_uret(uretim, self.ayarlar, ilk)
        uretim.kapak_yolu = str(kapak) if kapak else None
        uretim.kaydet()
        return uretim

    # -- 6. yukleme ----------------------------------------------------------
    def adim_yukle(self, uretim: Uretim, kuru: bool = False) -> Uretim:
        hedef = yukleyici(self.ayarlar, kuru=kuru)
        KAYIT.info("Yukleyici: %s", hedef.ad)
        uretim = hedef.yukle(uretim)
        uretim.kaydet()
        if uretim.senaryo:
            gecmis.ekle(
                self.ayarlar,
                {
                    "konu": uretim.senaryo.fikir.konu,
                    "baslik": uretim.senaryo.baslik,
                    "kimlik": uretim.kimlik,
                    "sure": round(uretim.sure, 1),
                    "youtube_id": uretim.youtube_id,
                    "youtube_url": uretim.youtube_url,
                    "yukleyici": hedef.ad,
                    "kuru": hedef.ad == "kuru",
                },
            )
        return uretim

    # -- tam akis ------------------------------------------------------------
    def tam(self, konu: str | None = None, kuru: bool = False, yuklemesiz: bool = False) -> Uretim:
        uretim = self.uretim_olustur(konu)
        self.adim_senaryo(uretim, konu)
        self.adim_ses(uretim)
        self.adim_gorsel(uretim)
        self.adim_montaj(uretim)
        self.adim_kapak(uretim)
        if not yuklemesiz:
            self.adim_yukle(uretim, kuru=kuru)
        self.eski_uretimleri_sil()
        KAYIT.info("Bitti: %s", uretim.video_yolu)
        return uretim

    # -- bakim ---------------------------------------------------------------
    def eski_uretimleri_sil(self) -> None:
        sinir = int(self.ayarlar.al("cikti.sakla", 0) or 0)
        if sinir <= 0:
            return
        kok = self.ayarlar.mutlak(str(self.ayarlar.al("cikti.dizin", "cikti")))
        if not kok.exists():
            return
        dizinler = sorted((d for d in kok.iterdir() if d.is_dir()), key=lambda d: d.name)
        for eski in dizinler[:-sinir] if len(dizinler) > sinir else []:
            shutil.rmtree(eski, ignore_errors=True)
            KAYIT.debug("Eski uretim silindi: %s", eski.name)


def son_uretim(ayarlar: Ayarlar) -> Uretim:
    kok = ayarlar.mutlak(str(ayarlar.al("cikti.dizin", "cikti")))
    dizinler = sorted(
        (d for d in kok.iterdir() if d.is_dir() and (d / "durum.json").exists()),
        key=lambda d: d.name,
    ) if kok.exists() else []
    if not dizinler:
        raise AracHatasi("Hic uretim yok. Once `tam-akis` ya da `yeni` calistir.")
    return Uretim.yukle(dizinler[-1])
