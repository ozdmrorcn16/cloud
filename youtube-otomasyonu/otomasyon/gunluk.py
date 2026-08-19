"""Ortak gunlukleme (logging) kurulumu."""

from __future__ import annotations

import logging
import os
import sys

_KURULDU = False

_RENKLER = {
    "DEBUG": "\033[90m",
    "INFO": "\033[36m",
    "WARNING": "\033[33m",
    "ERROR": "\033[31m",
    "CRITICAL": "\033[41m",
}
_SIFIRLA = "\033[0m"


class _RenkliBicim(logging.Formatter):
    def __init__(self, renkli: bool) -> None:
        super().__init__("%(asctime)s %(levelname)-7s %(name)-22s %(message)s", "%H:%M:%S")
        self.renkli = renkli

    def format(self, kayit: logging.LogRecord) -> str:
        metin = super().format(kayit)
        if self.renkli:
            renk = _RENKLER.get(kayit.levelname, "")
            return f"{renk}{metin}{_SIFIRLA}" if renk else metin
        return metin


def kur(ayrintili: bool = False) -> None:
    """Kok gunlukcuyu bir kez kurar."""
    global _KURULDU
    if _KURULDU:
        logging.getLogger().setLevel(logging.DEBUG if ayrintili else logging.INFO)
        return
    isleyici = logging.StreamHandler(sys.stderr)
    renkli = sys.stderr.isatty() and os.environ.get("NO_COLOR") is None
    isleyici.setFormatter(_RenkliBicim(renkli))
    kok = logging.getLogger()
    kok.handlers = [isleyici]
    kok.setLevel(logging.DEBUG if ayrintili else logging.INFO)
    # Gurultulu kutuphaneleri kis.
    for ad in ("googleapiclient", "google_auth_httplib2", "httpx", "httpcore", "urllib3", "anthropic"):
        logging.getLogger(ad).setLevel(logging.WARNING)
    _KURULDU = True


def gunlukcu(ad: str) -> logging.Logger:
    return logging.getLogger(ad)
