"""Boru hattinda dolasan veri yapilari.

Hepsi JSON'a cevrilebilir; `Uretim.kaydet()` ile `durum.json` dosyasina yazilir,
`Uretim.yukle()` ile geri okunur. Boyunca adimlar birbirinden bagimsiz
calistirilabilir (ornegin sadece `montaj` yeniden kosulabilir).
"""

from __future__ import annotations

import dataclasses
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


def _sozluge(deger: Any) -> Any:
    if dataclasses.is_dataclass(deger) and not isinstance(deger, type):
        return {a: _sozluge(b) for a, b in dataclasses.asdict(deger).items()}
    if isinstance(deger, list):
        return [_sozluge(x) for x in deger]
    if isinstance(deger, Path):
        return str(deger)
    return deger


@dataclass
class Fikir:
    """Uretilecek videonun konusu."""

    konu: str
    aciklama: str = ""
    anahtar_kelimeler: list[str] = field(default_factory=list)


@dataclass
class Sahne:
    """Videonun tek bir parcasi: bir cumle/paragraf + ona eslik eden gorsel."""

    metin: str
    gorsel_sorgu: str = ""
    # Adimlar doldurur:
    ses_yolu: str | None = None
    sure: float = 0.0
    gorsel_yolu: str | None = None
    gorsel_kaynagi: str | None = None


@dataclass
class Senaryo:
    """Tam metin: kanca + sahneler + kapanis, ve YouTube ust verisi."""

    fikir: Fikir
    kanca: str
    sahneler: list[Sahne]
    kapanis: str = ""
    baslik: str = ""
    aciklama: str = ""
    etiketler: list[str] = field(default_factory=list)
    kapak_metni: str = ""
    kaynak: str = "sablon"  # senaryoyu kim yazdi: claude | sablon

    def tum_metin(self) -> str:
        parcalar = [self.kanca, *(s.metin for s in self.sahneler), self.kapanis]
        return " ".join(p.strip() for p in parcalar if p and p.strip())


@dataclass
class Uretim:
    """Tek bir videonun uretim durumu ve dizini."""

    kimlik: str
    dizin: str
    senaryo: Senaryo | None = None
    ses_yolu: str | None = None
    altyazi_yolu: str | None = None
    video_yolu: str | None = None
    kapak_yolu: str | None = None
    sure: float = 0.0
    youtube_id: str | None = None
    youtube_url: str | None = None
    olusturma: str = ""
    notlar: list[str] = field(default_factory=list)

    # --- dizin yardimcilari -------------------------------------------------
    @property
    def yol(self) -> Path:
        return Path(self.dizin)

    def alt_dizin(self, ad: str) -> Path:
        hedef = self.yol / ad
        hedef.mkdir(parents=True, exist_ok=True)
        return hedef

    # --- kalicilik ----------------------------------------------------------
    @property
    def durum_dosyasi(self) -> Path:
        return self.yol / "durum.json"

    def kaydet(self) -> Path:
        self.yol.mkdir(parents=True, exist_ok=True)
        self.durum_dosyasi.write_text(
            json.dumps(_sozluge(self), ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return self.durum_dosyasi

    def not_dus(self, metin: str) -> None:
        self.notlar.append(metin)

    @classmethod
    def yukle(cls, dizin: str | Path) -> "Uretim":
        yol = Path(dizin)
        veri = json.loads((yol / "durum.json").read_text(encoding="utf-8"))
        senaryo = veri.pop("senaryo", None)
        uretim = cls(**veri)
        if senaryo:
            fikir = Fikir(**senaryo.pop("fikir"))
            sahneler = [Sahne(**s) for s in senaryo.pop("sahneler", [])]
            uretim.senaryo = Senaryo(fikir=fikir, sahneler=sahneler, **senaryo)
        return uretim
