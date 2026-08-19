"""Seslendirme (TTS) saglayicilari.

Sira: elevenlabs (ucretli, en dogal) -> edge (ucretsiz, dogal) ->
espeak-ng (cevrimdisi, robotik) -> sessiz (yalnizca test icin).
Her saglayici tek bir metin parcasini ses dosyasina yazar.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from ..arac import AracHatasi, ffmpeg, var_mi
from ..ayarlar import Ayarlar
from ..gunluk import gunlukcu

KAYIT = gunlukcu("otomasyon.ses")


class SesSaglayici:
    ad = "temel"
    uzanti = ".mp3"

    def __init__(self, ayarlar: Ayarlar) -> None:
        self.ayarlar = ayarlar

    def hazir(self) -> bool:
        return False

    def seslendir(self, metin: str, hedef: Path) -> Path:
        raise NotImplementedError


class ElevenLabsSes(SesSaglayici):
    ad = "elevenlabs"

    def hazir(self) -> bool:
        return bool(self.ayarlar.sir("elevenlabs") and self.ayarlar.al("ses.elevenlabs_ses_id"))

    def seslendir(self, metin: str, hedef: Path) -> Path:
        import httpx

        ses_id = str(self.ayarlar.al("ses.elevenlabs_ses_id"))
        yanit = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ses_id}",
            headers={
                "xi-api-key": self.ayarlar.sir("elevenlabs"),
                "accept": "audio/mpeg",
                "content-type": "application/json",
            },
            json={
                "text": metin,
                "model_id": str(self.ayarlar.al("ses.elevenlabs_model")),
                "voice_settings": {"stability": 0.45, "similarity_boost": 0.75},
            },
            timeout=180,
        )
        if yanit.status_code >= 400:
            raise AracHatasi(f"ElevenLabs hatasi {yanit.status_code}: {yanit.text[:300]}")
        hedef.write_bytes(yanit.content)
        return hedef


class EdgeSes(SesSaglayici):
    """Microsoft Edge'in ucretsiz sinir-otesi TTS servisi (anahtar gerekmez)."""

    ad = "edge"

    def hazir(self) -> bool:
        try:
            import edge_tts  # noqa: F401
        except ImportError:
            return False
        return True

    def seslendir(self, metin: str, hedef: Path) -> Path:
        import edge_tts

        async def _yaz() -> None:
            iletisim = edge_tts.Communicate(
                metin,
                str(self.ayarlar.al("ses.edge_ses")),
                rate=str(self.ayarlar.al("ses.edge_hiz", "+0%")),
                pitch=str(self.ayarlar.al("ses.edge_perde", "+0Hz")),
            )
            await iletisim.save(str(hedef))

        asyncio.run(_yaz())
        if not hedef.exists() or hedef.stat().st_size < 1024:
            raise AracHatasi("edge-tts bos ses dosyasi uretti")
        return hedef


class EspeakSes(SesSaglayici):
    """Cevrimdisi yedek. Robotik ama internetsiz ve anahtarsiz calisir."""

    ad = "espeak"
    uzanti = ".wav"

    def hazir(self) -> bool:
        return var_mi("espeak-ng")

    def seslendir(self, metin: str, hedef: Path) -> Path:
        from ..arac import calistir

        dil = str(self.ayarlar.al("kanal.dil", "tr"))
        calistir(
            [
                "espeak-ng", "-v", dil,
                "-s", str(self.ayarlar.al("ses.espeak_hiz", 155)),
                "-w", str(hedef), metin,
            ],
            "espeak-ng",
            zaman_asimi=120,
        )
        return hedef


class SessizSes(SesSaglayici):
    """Son care: metnin uzunluguna gore sessiz ses uretir (yalnizca test icin)."""

    ad = "sessiz"
    uzanti = ".m4a"

    def hazir(self) -> bool:
        return var_mi("ffmpeg")

    def seslendir(self, metin: str, hedef: Path) -> Path:
        sure = max(1.5, len(metin.split()) / 2.6)
        ffmpeg(
            ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{sure:.2f}", str(hedef)],
            "sessiz ses",
        )
        return hedef


SINIFLAR: dict[str, type[SesSaglayici]] = {
    "elevenlabs": ElevenLabsSes,
    "edge": EdgeSes,
    "espeak": EspeakSes,
    "sessiz": SessizSes,
}


def ses_saglayicilari(ayarlar: Ayarlar) -> list[SesSaglayici]:
    """Yapilandirmadaki sirada, hazir olan saglayicilarin listesi.

    Liste dondurulur cunku calisma aninda basarisiz olan saglayicidan
    (or. ag engeli) bir sonrakine dusulur.
    """
    hazirlar: list[SesSaglayici] = []
    for ad in ayarlar.liste("ses.saglayici_sirasi", ["espeak"]):
        sinif = SINIFLAR.get(str(ad))
        if not sinif:
            KAYIT.warning("Bilinmeyen ses saglayicisi: %s", ad)
            continue
        aday = sinif(ayarlar)
        if aday.hazir():
            hazirlar.append(aday)
        else:
            KAYIT.debug("Ses saglayicisi hazir degil: %s", ad)
    if not hazirlar:
        raise AracHatasi("Hicbir ses saglayicisi hazir degil (ffmpeg kurulu mu?)")
    return hazirlar
