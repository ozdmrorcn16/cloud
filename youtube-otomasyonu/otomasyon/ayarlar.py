"""Yapilandirma yonetimi.

Oncelik sirasi (sonraki oncekini ezer):
1. Koddaki varsayilanlar (`VARSAYILAN`)
2. `konfig/kanal.yaml`
3. `--ayar anahtar=deger` bayraklari
4. Ortam degiskenleri (yalnizca sirlar: API anahtarlari)

Sirlar hicbir zaman YAML'a yazilmaz; `.env` dosyasi varsa okunur.
"""

from __future__ import annotations

import copy
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from .gunluk import gunlukcu

KAYIT = gunlukcu("otomasyon.ayarlar")

PROJE_KOKU = Path(__file__).resolve().parent.parent

VARSAYILAN: dict[str, Any] = {
    "kanal": {
        "ad": "Otomatik Kanal",
        "dil": "tr",
        "nis": "gunluk hayatta ise yarayan bilim ve teknoloji bilgileri",
        "hedef_kitle": "Turkce konusan, merakli, 18-35 yas arasi izleyici",
        "ton": "samimi, net, abartisiz; kisa cumleler",
    },
    "video": {
        "bicim": "shorts",          # shorts (dikey 1080x1920) | yatay (1920x1080)
        "sahne_sayisi": 5,
        "hedef_sure": 45,            # saniye (senaryo uzunlugu buna gore ayarlanir)
        "kare_hizi": 30,
        "sahne_arasi_bosluk": 0.25,  # saniye
        "yakinlastirma": True,       # Ken Burns efekti
    },
    "ses": {
        "saglayici_sirasi": ["elevenlabs", "edge", "espeak", "sessiz"],
        "edge_ses": "tr-TR-AhmetNeural",
        "edge_hiz": "+8%",
        "edge_perde": "+0Hz",
        "elevenlabs_ses_id": "",
        "elevenlabs_model": "eleven_multilingual_v2",
        "espeak_hiz": 155,
        "muzik_yolu": "",            # opsiyonel arka plan muzigi (yerel dosya)
        "muzik_seviyesi": 0.10,
    },
    "gorsel": {
        "saglayici_sirasi": ["pexels", "klasor", "yerel"],
        "klasor": "varliklar/gorseller",
        "pexels_tur": "video",       # video | foto
        "higgsfield_model": "",
        "higgsfield_taban_url": "https://platform.higgsfield.ai",
    },
    "altyazi": {
        "etkin": True,
        "kelime_sayisi": 4,          # bir altyazi satirinda kac kelime
        "punto": 0,                  # 0 = cozunurluge gore otomatik
        "renk": "&H00FFFFFF",        # ASS bicimi (BGR)
        "kenar_rengi": "&H00000000",
        "kenar_kalinligi": 4,
        "alt_bosluk": 240,           # dikey videoda alttan bosluk (piksel)
    },
    "metin": {
        "saglayici_sirasi": ["claude", "sablon"],
        "claude_model": "claude-sonnet-5",
        "claude_max_token": 4000,
    },
    "yukleme": {
        "saglayici": "youtube",      # youtube | kuru
        "gizlilik": "private",       # private | unlisted | public
        "kategori_id": "27",         # 27 = Egitim, 28 = Bilim & Teknoloji
        "oynatma_listesi_id": "",
        "kendi_kendine_bildir": True,
        "yayin_zamani": "",          # ISO 8601 -> planli yayin (gizlilik private olmali)
    },
    "cikti": {
        "dizin": "cikti",
        "gecmis_dosyasi": "gecmis/uretimler.json",
        "konu_dosyasi": "konfig/konular.txt",
        "sakla": 20,                 # en fazla kac uretim dizini tutulsun (0 = sinirsiz)
    },
}

# Ortam degiskeni -> ayar anahtari eslemesi (yalnizca sirlar).
SIRLAR = {
    "ANTHROPIC_API_KEY": "sir.anthropic",
    "ELEVENLABS_API_KEY": "sir.elevenlabs",
    "PEXELS_API_KEY": "sir.pexels",
    "PIXABAY_API_KEY": "sir.pixabay",
    "HIGGSFIELD_API_KEY": "sir.higgsfield_anahtar",
    "HIGGSFIELD_API_SECRET": "sir.higgsfield_gizli",
    "YT_CLIENT_ID": "sir.yt_client_id",
    "YT_CLIENT_SECRET": "sir.yt_client_secret",
    "YT_REFRESH_TOKEN": "sir.yt_refresh_token",
}


def _birlestir(taban: dict, ustune: dict) -> dict:
    """Ic ice sozlukleri derin kopyalayarak birlestirir.

    Derin kopya sart: sig kopyada `ata()` cagrisi VARSAYILAN sozlugunu kalici
    olarak degistirir ve bir uretimin ayari digerine sizar.
    """
    sonuc = copy.deepcopy(taban)
    for anahtar, deger in ustune.items():
        if isinstance(deger, dict) and isinstance(sonuc.get(anahtar), dict):
            sonuc[anahtar] = _birlestir(sonuc[anahtar], deger)
        else:
            sonuc[anahtar] = copy.deepcopy(deger)
    return sonuc


def _cevir(metin: str) -> Any:
    """"true"/"3"/"1.5" gibi metinleri uygun Python turune cevirir."""
    dusuk = metin.strip().lower()
    if dusuk in ("true", "evet", "acik"):
        return True
    if dusuk in ("false", "hayir", "kapali"):
        return False
    try:
        return int(metin)
    except ValueError:
        pass
    try:
        return float(metin)
    except ValueError:
        pass
    if "," in metin:
        return [p.strip() for p in metin.split(",") if p.strip()]
    return metin


def _env_dosyasi_oku(yol: Path) -> None:
    """`.env` dosyasindaki degiskenleri (varsa) ortama yazar; mevcutlari ezmez."""
    if not yol.exists():
        return
    for satir in yol.read_text(encoding="utf-8").splitlines():
        satir = satir.strip()
        if not satir or satir.startswith("#") or "=" not in satir:
            continue
        anahtar, _, deger = satir.partition("=")
        anahtar = anahtar.strip()
        deger = deger.strip().strip('"').strip("'")
        os.environ.setdefault(anahtar, deger)


@dataclass
class Ayarlar:
    veri: dict[str, Any]
    koku: Path = PROJE_KOKU

    # --- okuma --------------------------------------------------------------
    def al(self, yol: str, varsayilan: Any = None) -> Any:
        dugum: Any = self.veri
        for parca in yol.split("."):
            if not isinstance(dugum, dict) or parca not in dugum:
                return varsayilan
            dugum = dugum[parca]
        return dugum

    def liste(self, yol: str, varsayilan: list | None = None) -> list:
        """Liste bekleyen ayarlari normallestirir.

        `--ayar ses.saglayici_sirasi=edge` gibi tek degerli ezmeler metin olarak
        gelir; burada tek elemanli listeye cevrilir.
        """
        deger = self.al(yol, varsayilan if varsayilan is not None else [])
        if isinstance(deger, str):
            return [p.strip() for p in deger.split(",") if p.strip()]
        if isinstance(deger, (list, tuple)):
            return [str(x) for x in deger]
        return [str(deger)]

    def sir(self, ad: str) -> str:
        """Bos string donerse saglayici 'hazir degil' sayilir."""
        return str(self.al(f"sir.{ad}", "") or "")

    def ata(self, yol: str, deger: Any) -> None:
        dugum = self.veri
        parcalar = yol.split(".")
        for parca in parcalar[:-1]:
            dugum = dugum.setdefault(parca, {})
        dugum[parcalar[-1]] = deger

    def mutlak(self, goreli: str) -> Path:
        yol = Path(goreli)
        return yol if yol.is_absolute() else (self.koku / yol)

    # --- turetilmis degerler ------------------------------------------------
    @property
    def dikey(self) -> bool:
        return str(self.al("video.bicim", "shorts")).lower() in ("shorts", "dikey", "vertical")

    @property
    def cozunurluk(self) -> tuple[int, int]:
        return (1080, 1920) if self.dikey else (1920, 1080)

    @classmethod
    def yukle(
        cls,
        konfig_yolu: str | Path | None = None,
        ustune: list[str] | None = None,
        koku: Path | None = None,
    ) -> "Ayarlar":
        koku = koku or PROJE_KOKU
        _env_dosyasi_oku(koku / ".env")

        veri = _birlestir({}, VARSAYILAN)
        yol = Path(konfig_yolu) if konfig_yolu else (koku / "konfig" / "kanal.yaml")
        if not yol.is_absolute():
            yol = koku / yol
        if yol.exists():
            dosya_verisi = yaml.safe_load(yol.read_text(encoding="utf-8")) or {}
            if not isinstance(dosya_verisi, dict):
                raise ValueError(f"{yol} bir sozluk icermeli")
            veri = _birlestir(veri, dosya_verisi)
            KAYIT.debug("Yapilandirma okundu: %s", yol)
        else:
            KAYIT.warning("Yapilandirma bulunamadi (%s), varsayilanlar kullaniliyor", yol)

        ayarlar = cls(veri=veri, koku=koku)

        for parca in ustune or []:
            if "=" not in parca:
                raise ValueError(f"--ayar 'anahtar=deger' biciminde olmali: {parca}")
            anahtar, _, deger = parca.partition("=")
            ayarlar.ata(anahtar.strip(), _cevir(deger))

        for env_adi, ayar_yolu in SIRLAR.items():
            deger = os.environ.get(env_adi, "").strip()
            if deger:
                ayarlar.ata(ayar_yolu, deger)

        return ayarlar
