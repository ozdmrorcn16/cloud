"""Sahne gorseli/videosu saglayicilari.

Donen dosya ya bir video (mp4) ya da bir goruntu (jpg/png) olabilir; montaj
adimi ikisini de isler.
"""

from __future__ import annotations

import hashlib
import math
import re
import time
from pathlib import Path

from ..arac import AracHatasi
from ..ayarlar import Ayarlar
from ..gunluk import gunlukcu
from ..modeller import Sahne

KAYIT = gunlukcu("otomasyon.gorsel")

VIDEO_UZANTILARI = {".mp4", ".mov", ".webm", ".mkv"}
FOTO_UZANTILARI = {".jpg", ".jpeg", ".png", ".webp"}


class GorselSaglayici:
    ad = "temel"

    def __init__(self, ayarlar: Ayarlar) -> None:
        self.ayarlar = ayarlar

    def hazir(self) -> bool:
        return False

    def getir(self, sahne: Sahne, sira: int, hedef_dizin: Path) -> Path:
        raise NotImplementedError


def _indir(url: str, hedef: Path, baslik: dict | None = None) -> Path:
    import httpx

    with httpx.stream("GET", url, headers=baslik or {}, timeout=180, follow_redirects=True) as y:
        y.raise_for_status()
        with hedef.open("wb") as dosya:
            for parca in y.iter_bytes(1 << 16):
                dosya.write(parca)
    return hedef


class PexelsGorsel(GorselSaglayici):
    """Pexels'ten telifsiz stok video/foto ceker (ucretsiz API anahtari)."""

    ad = "pexels"

    def hazir(self) -> bool:
        return bool(self.ayarlar.sir("pexels"))

    def getir(self, sahne: Sahne, sira: int, hedef_dizin: Path) -> Path:
        import httpx

        sorgu = sahne.gorsel_sorgu or sahne.metin
        yon = "portrait" if self.ayarlar.dikey else "landscape"
        baslik = {"Authorization": self.ayarlar.sir("pexels")}
        tur = str(self.ayarlar.al("gorsel.pexels_tur", "video"))

        if tur == "video":
            yanit = httpx.get(
                "https://api.pexels.com/videos/search",
                params={"query": sorgu, "per_page": 5, "orientation": yon, "size": "medium"},
                headers=baslik,
                timeout=60,
            )
            yanit.raise_for_status()
            videolar = yanit.json().get("videos", [])
            if not videolar:
                raise AracHatasi(f"Pexels'te video bulunamadi: {sorgu}")
            secim = videolar[sira % len(videolar)]
            dosyalar = sorted(
                (d for d in secim.get("video_files", []) if d.get("link")),
                key=lambda d: abs((d.get("height") or 0) - self.ayarlar.cozunurluk[1]),
            )
            if not dosyalar:
                raise AracHatasi("Pexels video baglantisi yok")
            hedef = hedef_dizin / f"sahne-{sira:02d}.mp4"
            return _indir(dosyalar[0]["link"], hedef)

        yanit = httpx.get(
            "https://api.pexels.com/v1/search",
            params={"query": sorgu, "per_page": 5, "orientation": yon},
            headers=baslik,
            timeout=60,
        )
        yanit.raise_for_status()
        fotolar = yanit.json().get("photos", [])
        if not fotolar:
            raise AracHatasi(f"Pexels'te foto bulunamadi: {sorgu}")
        secim = fotolar[sira % len(fotolar)]
        hedef = hedef_dizin / f"sahne-{sira:02d}.jpg"
        return _indir(secim["src"]["large2x"], hedef)


class KlasorGorsel(GorselSaglayici):
    """Elle (ya da Higgsfield/Midjourney gibi bir arac ile) hazirlanan gorseller.

    `gorsel.klasor` altindaki dosyalar ada gore siralanir ve sahnelere sirayla
    dagitilir. Higgsfield ile uretilen sahneleri buraya birakmak, en guvenilir
    "AI gorsel" yoludur.
    """

    ad = "klasor"

    def _dosyalar(self) -> list[Path]:
        klasor = self.ayarlar.mutlak(str(self.ayarlar.al("gorsel.klasor")))
        if not klasor.exists():
            return []
        return sorted(
            d for d in klasor.iterdir()
            if d.suffix.lower() in VIDEO_UZANTILARI | FOTO_UZANTILARI
        )

    def hazir(self) -> bool:
        return bool(self._dosyalar())

    def getir(self, sahne: Sahne, sira: int, hedef_dizin: Path) -> Path:
        dosyalar = self._dosyalar()
        if not dosyalar:
            raise AracHatasi("Gorsel klasoru bos")
        kaynak = dosyalar[sira % len(dosyalar)]
        hedef = hedef_dizin / f"sahne-{sira:02d}{kaynak.suffix.lower()}"
        hedef.write_bytes(kaynak.read_bytes())
        return hedef


class HiggsfieldGorsel(GorselSaglayici):
    """Higgsfield ile AI gorsel uretimi (DENEYSEL).

    Higgsfield'in REST ucu hesaba gore degisebiliyor; `gorsel.higgsfield_taban_url`
    ve `gorsel.higgsfield_model` ayarlariyla uyarlanir. Anahtarlarin yoksa ya da
    uc yanit vermezse boru hatti bir sonraki saglayiciya duser.
    """

    ad = "higgsfield"

    def hazir(self) -> bool:
        return bool(
            self.ayarlar.sir("higgsfield_anahtar")
            and self.ayarlar.sir("higgsfield_gizli")
            and self.ayarlar.al("gorsel.higgsfield_model")
        )

    def getir(self, sahne: Sahne, sira: int, hedef_dizin: Path) -> Path:
        import httpx

        taban = str(self.ayarlar.al("gorsel.higgsfield_taban_url")).rstrip("/")
        basliklar = {
            "hf-api-key": self.ayarlar.sir("higgsfield_anahtar"),
            "hf-secret": self.ayarlar.sir("higgsfield_gizli"),
            "content-type": "application/json",
        }
        istek = {
            "params": {
                "prompt": sahne.gorsel_sorgu or sahne.metin,
                "model": str(self.ayarlar.al("gorsel.higgsfield_model")),
                "quality": "1080p",
                "aspect_ratio": "9:16" if self.ayarlar.dikey else "16:9",
            }
        }
        yanit = httpx.post(f"{taban}/v1/text2image", headers=basliklar, json=istek, timeout=120)
        if yanit.status_code >= 400:
            raise AracHatasi(f"Higgsfield {yanit.status_code}: {yanit.text[:200]}")
        is_id = yanit.json().get("id")
        if not is_id:
            raise AracHatasi("Higgsfield is kimligi dondurmedi")

        url = ""
        for _ in range(60):
            time.sleep(5)
            durum = httpx.get(f"{taban}/v1/job-sets/{is_id}", headers=basliklar, timeout=60)
            durum.raise_for_status()
            veri = durum.json()
            isler = veri.get("jobs") or []
            if isler and isler[0].get("status") == "completed":
                sonuc = isler[0].get("results") or {}
                url = (sonuc.get("raw") or sonuc.get("min") or {}).get("url", "")
                break
            if isler and isler[0].get("status") in ("failed", "canceled"):
                raise AracHatasi("Higgsfield isi basarisiz")
        if not url:
            raise AracHatasi("Higgsfield zaman asimi")
        return _indir(url, hedef_dizin / f"sahne-{sira:02d}.jpg")


class YerelGorsel(GorselSaglayici):
    """Anahtarsiz yedek: sahne metnine gore uretilmis degradeli arka plan."""

    ad = "yerel"

    def hazir(self) -> bool:
        try:
            import PIL  # noqa: F401
        except ImportError:
            return False
        return True

    def getir(self, sahne: Sahne, sira: int, hedef_dizin: Path) -> Path:
        from PIL import Image, ImageDraw, ImageFilter

        genislik, yukseklik = self.ayarlar.cozunurluk
        tohum = int(hashlib.sha256((sahne.gorsel_sorgu or sahne.metin).encode()).hexdigest(), 16)
        ton = (tohum % 360) / 360.0
        ton2 = ((tohum // 360) % 360) / 360.0

        import colorsys

        ust = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(ton, 0.55, 0.42))
        alt = tuple(int(x * 255) for x in colorsys.hsv_to_rgb(ton2, 0.65, 0.12))

        # Ken Burns icin cozunurlugun 1.3 kati uretilir.
        gen, yuk = int(genislik * 1.3), int(yukseklik * 1.3)
        resim = Image.new("RGB", (gen, yuk), ust)
        cizim = ImageDraw.Draw(resim)
        for y in range(yuk):
            oran = y / max(1, yuk - 1)
            cizim.line(
                [(0, y), (gen, y)],
                fill=tuple(int(ust[i] + (alt[i] - ust[i]) * oran) for i in range(3)),
            )
        # Yumusak isik lekeleri
        for i in range(5):
            yaricap = int(min(gen, yuk) * (0.12 + ((tohum >> (i * 3)) % 20) / 100))
            mx = (tohum >> (i * 5)) % gen
            my = (tohum >> (i * 7)) % yuk
            renk = tuple(min(255, int(c * 1.6) + 25) for c in ust)
            cizim.ellipse([mx - yaricap, my - yaricap, mx + yaricap, my + yaricap], fill=renk)
        resim = resim.filter(ImageFilter.GaussianBlur(radius=max(gen, yuk) // 22))

        hedef = hedef_dizin / f"sahne-{sira:02d}.png"
        resim.save(hedef, "PNG")
        return hedef


SINIFLAR: dict[str, type[GorselSaglayici]] = {
    "pexels": PexelsGorsel,
    "klasor": KlasorGorsel,
    "higgsfield": HiggsfieldGorsel,
    "yerel": YerelGorsel,
}


def gorsel_saglayicilari(ayarlar: Ayarlar) -> list[GorselSaglayici]:
    hazirlar: list[GorselSaglayici] = []
    for ad in ayarlar.liste("gorsel.saglayici_sirasi", ["yerel"]):
        sinif = SINIFLAR.get(str(ad))
        if not sinif:
            KAYIT.warning("Bilinmeyen gorsel saglayicisi: %s", ad)
            continue
        aday = sinif(ayarlar)
        if aday.hazir():
            hazirlar.append(aday)
        else:
            KAYIT.debug("Gorsel saglayicisi hazir degil: %s", ad)
    yerel = YerelGorsel(ayarlar)
    if yerel.hazir() and not any(s.ad == "yerel" for s in hazirlar):
        hazirlar.append(yerel)  # her zaman bir yedek kalsin
    if not hazirlar:
        raise AracHatasi("Hicbir gorsel saglayicisi hazir degil (Pillow kurulu mu?)")
    return hazirlar


def tur_bul(yol: Path) -> str:
    return "video" if yol.suffix.lower() in VIDEO_UZANTILARI else "foto"


def _sadelestir(metin: str) -> str:
    return re.sub(r"\s+", " ", metin).strip()
