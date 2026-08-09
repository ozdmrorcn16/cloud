#!/usr/bin/env python3
"""Oturum kaydedici hook.

Claude Code'un Stop / SessionEnd olaylarinda calisir. stdin'den gelen hook
JSON'undaki transcript dosyasini okur ve iki sey uretir:

  docs/oturumlar/<tarih>-<oturum>.md    okunabilir konusma dokumu
  docs/oturumlar/ham/<tarih>-<oturum>.jsonl   ham transcript yedegi

Ayrica docs/konusma-gunlugu.md dosyasindaki oturum indeksini gunceller.

--push verildiginde (SessionEnd) yazilan dosyalari commit'leyip uzak dala
gonderir. Sadece docs/oturumlar ve docs/konusma-gunlugu.md yollarini
stage'ler, boylece devam eden calismadaki dosyalara dokunmaz.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

INDEX_BASLANGIC = "<!-- oturumlar:baslangic -->"
INDEX_BITIS = "<!-- oturumlar:bitis -->"


def repo_koku() -> Path:
    """Depo kokunu bul: once CLAUDE_PROJECT_DIR, sonra script konumu."""
    ortam = os.environ.get("CLAUDE_PROJECT_DIR")
    if ortam and (Path(ortam) / ".git").exists():
        return Path(ortam)
    return Path(__file__).resolve().parents[2]


def metin_bloklari(icerik) -> str:
    """Bir mesajin icerigindeki duz metin bloklarini birlestirir.

    Arac cagrilari (tool_use / tool_result) ve dusunme bloklari atlanir --
    amac konusmanin kendisini saklamak, her ara adimi degil.
    """
    if isinstance(icerik, str):
        return icerik.strip()
    if not isinstance(icerik, list):
        return ""
    parcalar = []
    for blok in icerik:
        if isinstance(blok, dict) and blok.get("type") == "text":
            parcalar.append(str(blok.get("text", "")).strip())
    return "\n\n".join(p for p in parcalar if p)


def turlari_oku(transcript: Path):
    """Transcript jsonl dosyasini (rol, zaman, metin) uclulerine cevirir."""
    turler = []
    with transcript.open(encoding="utf-8", errors="replace") as f:
        for satir in f:
            satir = satir.strip()
            if not satir:
                continue
            try:
                kayit = json.loads(satir)
            except json.JSONDecodeError:
                continue
            if kayit.get("isSidechain") or kayit.get("isMeta"):
                continue
            tur = kayit.get("type")
            if tur not in ("user", "assistant"):
                continue
            mesaj = kayit.get("message") or {}
            metin = metin_bloklari(mesaj.get("content"))
            if not metin:
                continue
            # Arac sonuclarini tasiyan sistem hatirlatmalarini disarida birak.
            if metin.startswith("<system-reminder>") or metin.startswith("<command-name>"):
                continue
            turler.append((tur, kayit.get("timestamp", ""), metin))
    return turler


def markdown_uret(turler, oturum_id: str, tarih: str) -> str:
    satirlar = [
        f"# Oturum {tarih}",
        "",
        f"- Oturum kimligi: `{oturum_id}`",
        f"- Son guncelleme: {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC",
        f"- Tur sayisi: {len(turler)}",
        "",
        "---",
        "",
    ]
    for rol, zaman, metin in turler:
        baslik = "Ben" if rol == "user" else "Claude"
        damga = f" _{zaman[:19].replace('T', ' ')} UTC_" if zaman else ""
        satirlar.append(f"## {baslik}{damga}")
        satirlar.append("")
        satirlar.append(metin)
        satirlar.append("")
    return "\n".join(satirlar).rstrip() + "\n"


def indeksi_guncelle(gunluk: Path, dosya_adi: str, tarih: str, ozet: str) -> None:
    """Konusma gunlugundeki isaretli blogu tarihe gore siralayarak gunceller."""
    if not gunluk.exists():
        return
    icerik = gunluk.read_text(encoding="utf-8")
    if INDEX_BASLANGIC not in icerik or INDEX_BITIS not in icerik:
        return

    bas = icerik.index(INDEX_BASLANGIC) + len(INDEX_BASLANGIC)
    son = icerik.index(INDEX_BITIS)
    mevcut = [s for s in icerik[bas:son].strip().splitlines() if s.strip().startswith("-")]

    yeni_satir = f"- {tarih} — [{dosya_adi}](oturumlar/{dosya_adi}) — {ozet}"
    mevcut = [s for s in mevcut if f"(oturumlar/{dosya_adi})" not in s]
    mevcut.append(yeni_satir)
    mevcut.sort(reverse=True)

    yeni = icerik[:bas] + "\n\n" + "\n".join(mevcut) + "\n\n" + icerik[son:]
    gunluk.write_text(yeni, encoding="utf-8")


def ozet_uret(turler) -> str:
    """Indekste gorunecek kisa etiket: ilk kullanici mesajinin bas kismi."""
    for rol, _, metin in turler:
        if rol == "user":
            tek_satir = re.sub(r"\s+", " ", metin).strip()
            return tek_satir[:80] + ("…" if len(tek_satir) > 80 else "")
    return "(bos oturum)"


def git(kok: Path, *argumanlar) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *argumanlar], cwd=kok, capture_output=True, text=True, timeout=120
    )


def gonder(kok: Path, oturum_id: str) -> None:
    """Sadece kayit dosyalarini commit'leyip uzak dala gonderir."""
    dal = git(kok, "rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    if not dal or dal == "HEAD":
        return

    git(kok, "add", "--", "docs/oturumlar", "docs/konusma-gunlugu.md")
    degisiklik = git(kok, "diff", "--cached", "--quiet", "--", "docs/oturumlar", "docs/konusma-gunlugu.md")
    if degisiklik.returncode == 0:
        return  # stage'de fark yok, yapilacak bir sey de yok

    git(kok, "commit", "-m", f"chore(kayit): oturum kaydi guncellendi ({oturum_id[:8]})")

    for bekleme in (0, 2, 4, 8, 16):
        if bekleme:
            import time

            time.sleep(bekleme)
        if git(kok, "push", "-u", "origin", dal).returncode == 0:
            return


def main() -> int:
    try:
        girdi = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        girdi = {}

    transcript = girdi.get("transcript_path")
    oturum_id = girdi.get("session_id") or "bilinmeyen"
    if not transcript or not Path(transcript).exists():
        return 0

    turler = turlari_oku(Path(transcript))
    if not turler:
        return 0

    kok = repo_koku()
    tarih = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dosya_adi = f"{tarih}-{oturum_id[:8]}.md"

    oturumlar = kok / "docs" / "oturumlar"
    ham = oturumlar / "ham"
    oturumlar.mkdir(parents=True, exist_ok=True)
    ham.mkdir(parents=True, exist_ok=True)

    (oturumlar / dosya_adi).write_text(
        markdown_uret(turler, oturum_id, tarih), encoding="utf-8"
    )
    (ham / f"{tarih}-{oturum_id[:8]}.jsonl").write_bytes(Path(transcript).read_bytes())
    indeksi_guncelle(kok / "docs" / "konusma-gunlugu.md", dosya_adi, tarih, ozet_uret(turler))

    if "--push" in sys.argv:
        gonder(kok, oturum_id)

    return 0


if __name__ == "__main__":
    sys.exit(main())
