"""Uretim gecmisi: hangi konu ne zaman islendi, hangi video yuklendi.

Gecmis dosyasi depoda tutulur; GitHub Actions her kosuda geri commit'ler.
Boylece ayni konu tekrar uretilmez.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .gunluk import gunlukcu

KAYIT = gunlukcu("otomasyon.gecmis")


def _dosya(ayarlar) -> Path:
    return ayarlar.mutlak(str(ayarlar.al("cikti.gecmis_dosyasi", "gecmis/uretimler.json")))


def oku(ayarlar) -> list[dict[str, Any]]:
    yol = _dosya(ayarlar)
    if not yol.exists():
        return []
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        KAYIT.warning("Gecmis dosyasi bozuk, bos kabul ediliyor: %s", yol)
        return []
    return veri if isinstance(veri, list) else []


def islenen_konular(ayarlar) -> list[str]:
    """Bir daha secilmemesi gereken konular.

    Kuru (deneme) kosular sayilmaz: deneme yaparken konu havuzu tukenmesin.
    """
    return [
        str(k.get("konu", ""))
        for k in oku(ayarlar)
        if k.get("konu") and not k.get("kuru")
    ]


def ekle(ayarlar, kayit: dict[str, Any]) -> Path:
    yol = _dosya(ayarlar)
    yol.parent.mkdir(parents=True, exist_ok=True)
    kayitlar = oku(ayarlar)
    kayit.setdefault("tarih", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    kayitlar.append(kayit)
    yol.write_text(json.dumps(kayitlar, ensure_ascii=False, indent=2), encoding="utf-8")
    KAYIT.debug("Gecmise islendi: %s", kayit.get("konu"))
    return yol
