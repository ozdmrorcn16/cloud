#!/usr/bin/env python3
"""Eklenti kurucu hook.

Claude Code'un SessionStart olayinda calisir ve projenin bagimli oldugu
eklentileri konteynerde hazir hale getirir.

Neden gerekli: `.claude/settings.json` icindeki `extraKnownMarketplaces` ve
`enabledPlugins` ayarlari depoyla birlikte her konteynere geliyor, ama Claude
Code on the web (bulut) konteynerlerinde `SKIP_PLUGIN_MARKETPLACE=true`
tanimli oldugu icin market klonlanmiyor ve eklenti kurulmuyor. Yani ayar
geri geliyor, eklenti gelmiyor. Bu betik farki kapatiyor.

Calisma mantigi:

  1. Eklenti zaten kuruluysa hicbir sey yapmaz, ciktisiz cikar (yerel CLI'da
     ve ayni konteynerdeki ikinci oturumlarda durum budur).
  2. Kurulu degilse market ekler ve eklentiyi kurar.
  3. Basarili olursa `reloadSkills` bayragiyla ciktigi icin beceri, kurulumun
     yapildigi oturumda da kullanilabilir olur -- sonraki oturumu beklemez.

Hicbir kosulda oturum acilisini engellemez: her hata yutulur, en fazla
bilgilendirme metni dondurulur.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

EKLENTI = "frontend-design@claude-code-plugins"
MARKET_ADI = "claude-code-plugins"
MARKET_KAYNAK = "anthropics/claude-code"

# Market klonu buyuk olabildigi icin comert, ama sinirli tutuluyor.
MARKET_ZAMAN_ASIMI = 120
KURULUM_ZAMAN_ASIMI = 60


def claude_dizini() -> Path:
    """Eklenti kayitlarinin tutuldugu dizin."""
    ortam = os.environ.get("CLAUDE_CONFIG_DIR")
    if ortam:
        return Path(ortam)
    return Path.home() / ".claude"


def kurulu_mu() -> bool:
    """Eklenti gercekten diskte duruyor mu?

    Yalnizca kayit dosyasina bakmak yetmez; kayit durup dizin silinmis
    olabilir. Bu yuzden manifest dosyasi da dogrulanir.
    """
    kayit = claude_dizini() / "plugins" / "installed_plugins.json"
    try:
        veri = json.loads(kayit.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    for girdi in veri.get("plugins", {}).get(EKLENTI) or []:
        yol = girdi.get("installPath")
        if yol and (Path(yol) / ".claude-plugin" / "plugin.json").is_file():
            return True
    return False


def calistir(argv, zaman_asimi) -> tuple[bool, str]:
    """Komutu calistirir, (basarili, mesaj) doner. Istisna sizdirmaz."""
    try:
        sonuc = subprocess.run(
            argv,
            capture_output=True,
            text=True,
            timeout=zaman_asimi,
        )
    except subprocess.TimeoutExpired:
        return False, f"zaman asimi ({zaman_asimi}s): {' '.join(argv)}"
    except OSError as hata:
        return False, f"calistirilamadi: {hata}"
    if sonuc.returncode != 0:
        ayrinti = (sonuc.stderr or sonuc.stdout or "").strip().splitlines()
        return False, ayrinti[-1] if ayrinti else f"cikis kodu {sonuc.returncode}"
    return True, ""


def cik(mesaj: str = "", skill_yenile: bool = False) -> None:
    """SessionStart hook ciktisini yazip cikar. Mesaj bossa sessiz cikilir."""
    if mesaj:
        cikti = {
            "hookEventName": "SessionStart",
            "additionalContext": mesaj,
        }
        if skill_yenile:
            cikti["reloadSkills"] = True
        print(json.dumps({"hookSpecificOutput": cikti}))
    sys.exit(0)


def main() -> None:
    if kurulu_mu():
        cik()

    basarili, hata = calistir(
        ["claude", "plugin", "marketplace", "add", MARKET_KAYNAK],
        MARKET_ZAMAN_ASIMI,
    )
    # Market zaten kayitliysa komut hata verebilir; kurulum yine de denenir.
    if not basarili and not (claude_dizini() / "plugins" / "marketplaces" / MARKET_ADI).is_dir():
        cik(f"Eklenti kurulamadi -- market eklenemedi ({hata}). "
            f"Arayuz tasarimi isi gelirse {EKLENTI} olmadan devam et.")

    basarili, hata = calistir(
        ["claude", "plugin", "install", EKLENTI],
        KURULUM_ZAMAN_ASIMI,
    )
    if not basarili or not kurulu_mu():
        cik(f"Eklenti kurulamadi ({hata or 'kurulum dogrulanamadi'}). "
            f"Arayuz tasarimi isi gelirse {EKLENTI} olmadan devam et.")

    cik(f"{EKLENTI} bu konteynere yeni kuruldu; frontend-design becerisi kullanilabilir.",
        skill_yenile=True)


if __name__ == "__main__":
    main()
