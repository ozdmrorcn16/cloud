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

GIZLI = "[SIR-GIZLENDI]"

# Konusma sirasinda yapistirilmis olabilecek API anahtari bicimleri.
# Kayit dosyalari depoya commit'lendigi icin bunlar yazilmadan once temizlenir.
SIR_KALIPLARI = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{16,}"),          # Anthropic
    re.compile(r"sk-[A-Za-z0-9]{32,}"),                  # OpenAI vb.
    re.compile(r"sk_[a-f0-9]{40,}"),                     # ElevenLabs
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),           # GitHub token
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),         # GitHub ince token
    re.compile(r"AIza[A-Za-z0-9_\-]{30,}"),             # Google API
    re.compile(r"GOCSPX-[A-Za-z0-9_\-]{20,}"),          # Google istemci sifresi
    re.compile(r"1//[A-Za-z0-9_\-]{30,}"),              # Google refresh token
    re.compile(r"xox[baprs]-[A-Za-z0-9\-]{20,}"),       # Slack
    re.compile(r"hf_[A-Za-z0-9]{30,}"),                  # Hugging Face token
    # Supabase'in yeni bicim anahtarlari. `sb_secret_` GERCEK bir sir:
    # RLS'i asar ve butun veriye erisir. 2026-08-20'de bir tanesi
    # konusmaya yapistirildi ve buradaki kalip listesinde karsiligi
    # olmadigi icin oturum dokumune duz metin yazildi; depo public
    # oldugu icin push edilseydi sizacakti. `sb_publishable_` gizli
    # degil (uygulama paketinde zaten gidiyor) ama ayirt etmeyi
    # kolaylastirmak icin o da maskeleniyor.
    re.compile(r"sb_secret_[A-Za-z0-9_\-]{16,}"),        # Supabase gizli anahtar
    re.compile(r"sb_publishable_[A-Za-z0-9_\-]{16,}"),   # Supabase acik anahtar
    # JWT parcalari (Supabase anon/service anahtarlari dahil). Her
    # base64url parcasi ayri ayri maskelenir; nokta ile ayrilmis uc
    # parcanin tamamini tek kalipla yakalamak, kirpilmis kayitlarda
    # ise yaramiyordu.
    re.compile(r"eyJ[A-Za-z0-9_\-]{20,}"),                  # JWT
    # Pexels gibi duz anahtarlar: buyuk+kucuk harf ve rakam iceren uzun dizi.
    re.compile(
        r"\b(?=[A-Za-z0-9]*[a-z])(?=[A-Za-z0-9]*[A-Z])(?=[A-Za-z0-9]*[0-9])"
        r"[A-Za-z0-9]{40,80}\b"
    ),
]


# .env taramasinda atlanan dizinler ve sinirlar. node_modules'u atlamak
# sadece hiz meselesi degil: hook her Stop olayinda calisiyor, yuz binlerce
# dosyayi gezmek kaydi gozle gorulur sekilde geciktirirdi.
ENV_ATLANAN_DIZINLER = {
    "node_modules",
    ".git",
    ".expo",
    ".next",
    "dist",
    "build",
    "coverage",
    "vendor",
    "__pycache__",
    ".venv",
}
ENV_MAKS_DOSYA = 20
ENV_MAKS_DERINLIK = 3


def env_dosyalari(kok: Path) -> list[Path]:
    """Depo kokundeki ve alt dizinlerdeki .env dosyalarini bulur.

    Genislikten once koku ekler, sonra siniri asmayan bir genislik-oncelikli
    gezinti yapar; ATLANAN dizinlere hic girilmez.
    """
    bulunanlar: list[Path] = []
    kok_env = kok / ".env"
    if kok_env.is_file():
        bulunanlar.append(kok_env)

    sira: list[tuple[Path, int]] = [(kok, 0)]
    while sira and len(bulunanlar) < ENV_MAKS_DOSYA:
        dizin, derinlik = sira.pop(0)
        try:
            girdiler = sorted(dizin.iterdir())
        except OSError:
            continue
        for girdi in girdiler:
            if len(bulunanlar) >= ENV_MAKS_DOSYA:
                break
            try:
                if girdi.name == ".env" and girdi.is_file():
                    if girdi != kok_env:
                        bulunanlar.append(girdi)
                elif (
                    derinlik < ENV_MAKS_DERINLIK
                    and girdi.name not in ENV_ATLANAN_DIZINLER
                    and girdi.is_dir()
                    and not girdi.is_symlink()
                ):
                    sira.append((girdi, derinlik + 1))
            except OSError:
                continue
    return bulunanlar


def env_sirlari(kok: Path) -> list[str]:
    """.env dosyalarindaki degerler: kayitlarda bunlar da gizlenir.

    Yalnizca depo kokundeki .env degil, alt dizinlerdekiler de okunur.
    Gercek bir olay bunu gerektirdi: 2026-08-20'de konusmaya yapistirilan
    Supabase yonetici anahtari `mobil/.env` icindeydi, kokte degil - yani
    "kalip listesinde olmasa bile .env'deki degerler maskelenir" emniyeti
    tam o anahtar icin hic devrede degildi. Okunan degerlerin KENDISI
    hicbir yere yazilmaz; yalnizca gizle() icinde arama-degistirme
    girdisi olarak kullanilir.
    """
    degerler = []
    for dosya in env_dosyalari(kok):
        try:
            icerik = dosya.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for satir in icerik.splitlines():
            satir = satir.strip()
            if not satir or satir.startswith("#") or "=" not in satir:
                continue
            deger = satir.partition("=")[2].strip().strip('"').strip("'")
            if len(deger) >= 8:
                degerler.append(deger)
    # set(): ayni deger birden fazla .env icinde olabilir. Uzundan kisaya
    # sirali kaliyor ki uzun bir sir, onun parcasi olan kisa bir degerden
    # once maskelensin.
    return sorted(set(degerler), key=len, reverse=True)


def gizle(metin: str, ek_sirlar: list[str] | None = None) -> str:
    """Kayda yazilmadan once bilinen sir bicimlerini maskeler."""
    for sir in ek_sirlar or []:
        metin = metin.replace(sir, GIZLI)
    for kalip in SIR_KALIPLARI:
        metin = kalip.sub(GIZLI, metin)
    return metin


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

    sirlar = env_sirlari(kok)
    (oturumlar / dosya_adi).write_text(
        gizle(markdown_uret(turler, oturum_id, tarih), sirlar), encoding="utf-8"
    )
    (ham / f"{tarih}-{oturum_id[:8]}.jsonl").write_text(
        gizle(Path(transcript).read_text(encoding="utf-8", errors="replace"), sirlar),
        encoding="utf-8",
    )
    indeksi_guncelle(
        kok / "docs" / "konusma-gunlugu.md", dosya_adi, tarih,
        gizle(ozet_uret(turler), sirlar),
    )

    if "--push" in sys.argv:
        gonder(kok, oturum_id)

    return 0


if __name__ == "__main__":
    sys.exit(main())
