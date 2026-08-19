#!/usr/bin/env python3
"""YouTube icin bir kerelik yetkilendirme (OAuth) betigi.

Kendi bilgisayarinda bir kez calistirilir; tarayici acilir, kanalini secersin
ve `konfig/token.json` dosyasi olusur. GitHub Actions'ta kullanmak icin
betigin sonunda basilan uc degeri depo Secrets'ina ekle.

Kullanim:
    python scripts/youtube-yetki.py istemci_gizli.json

`istemci_gizli.json`: Google Cloud Console > APIs & Services > Credentials
altinda "OAuth client ID" > "Desktop app" olusturup indirdigin dosya.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KOK))

KAPSAMLAR = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


def main() -> int:
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Once bagimliliklari kur:  pip install -r requirements.txt")
        return 1

    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    gizli_dosya = Path(sys.argv[1])
    if not gizli_dosya.exists():
        print(f"Dosya bulunamadi: {gizli_dosya}")
        return 1

    akis = InstalledAppFlow.from_client_secrets_file(str(gizli_dosya), KAPSAMLAR)
    print("Tarayici aciliyor. Videolarin yuklenecegi Google hesabini sec.")
    kimlik = akis.run_local_server(port=0, prompt="consent", access_type="offline")

    if not kimlik.refresh_token:
        print("\nrefresh_token alinamadi. Google hesabi ayarlarindan uygulamanin")
        print("erisimini kaldirip betigi tekrar calistir.")
        return 1

    hedef = KOK / "konfig" / "token.json"
    hedef.parent.mkdir(parents=True, exist_ok=True)
    hedef.write_text(
        json.dumps(
            {
                "client_id": kimlik.client_id,
                "client_secret": kimlik.client_secret,
                "refresh_token": kimlik.refresh_token,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    hedef.chmod(0o600)

    print(f"\nYetki kaydedildi: {hedef}")
    print("Bu dosya .gitignore'da; depoya girmez.\n")
    print("GitHub Actions kullanacaksan su ucunu depo Secrets'ina ekle")
    print("(Settings > Secrets and variables > Actions > New repository secret):\n")
    print(f"  YT_CLIENT_ID     = {kimlik.client_id}")
    print(f"  YT_CLIENT_SECRET = {kimlik.client_secret}")
    print(f"  YT_REFRESH_TOKEN = {kimlik.refresh_token}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
