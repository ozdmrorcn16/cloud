"""Dis komut (ffmpeg/ffprobe/espeak-ng) yardimcilari."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from .gunluk import gunlukcu

KAYIT = gunlukcu("otomasyon.arac")


class AracHatasi(RuntimeError):
    pass


def var_mi(komut: str) -> bool:
    return shutil.which(komut) is not None


def calistir(argumanlar: list[str], aciklama: str = "", zaman_asimi: int = 900) -> str:
    """Komutu calistirir; hata olursa stderr'i iceren AracHatasi firlatir."""
    KAYIT.debug("$ %s", " ".join(argumanlar[:12]) + (" ..." if len(argumanlar) > 12 else ""))
    try:
        sonuc = subprocess.run(
            argumanlar, capture_output=True, text=True, timeout=zaman_asimi, check=False
        )
    except FileNotFoundError as hata:
        raise AracHatasi(f"{argumanlar[0]} bulunamadi. Kurulu mu?") from hata
    except subprocess.TimeoutExpired as hata:
        raise AracHatasi(f"{argumanlar[0]} zaman asimina ugradi ({zaman_asimi}s)") from hata
    if sonuc.returncode != 0:
        kuyruk = (sonuc.stderr or sonuc.stdout or "").strip().splitlines()[-12:]
        raise AracHatasi(
            f"{aciklama or argumanlar[0]} basarisiz (kod {sonuc.returncode}):\n"
            + "\n".join(kuyruk)
        )
    return sonuc.stdout


def ffmpeg(argumanlar: list[str], aciklama: str = "ffmpeg") -> str:
    return calistir(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *argumanlar], aciklama)


def sure_ogren(yol: str | Path) -> float:
    """Medya dosyasinin saniye cinsinden suresi."""
    cikti = calistir(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "json", str(yol),
        ],
        "ffprobe",
        zaman_asimi=60,
    )
    try:
        return float(json.loads(cikti)["format"]["duration"])
    except (KeyError, ValueError, json.JSONDecodeError) as hata:
        raise AracHatasi(f"{yol} suresi okunamadi") from hata


def gerekli_araclar(*komutlar: str) -> None:
    eksik = [k for k in komutlar if not var_mi(k)]
    if eksik:
        raise AracHatasi(
            "Su arac(lar) kurulu degil: " + ", ".join(eksik)
            + "\nUbuntu/Debian: sudo apt install ffmpeg espeak-ng"
            + "\nmacOS: brew install ffmpeg espeak-ng"
        )
