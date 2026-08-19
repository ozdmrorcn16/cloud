"""Oturum kaydedici hook'un sir gizleme testleri.

Kayit dosyalari depoya commit'lenip push'landigi icin, konusmada gecen bir
API anahtarinin dosyaya yazilmamasi guvenlik acisindan kritik.
"""

import importlib.util
from pathlib import Path

import pytest

KOK = Path(__file__).resolve().parent.parent
HOOK = KOK / ".claude" / "hooks" / "oturum-kaydet.py"


@pytest.fixture(scope="module")
def hook():
    spec = importlib.util.spec_from_file_location("oturum_kaydet", HOOK)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


@pytest.mark.parametrize(
    "gizli",
    [
        "jXsMvxxCgHewf8uWYIgo7QDpPzFDAd9YgDZbGRyHsAs6UM1bTSc1sbFK",  # Pexels bicimi
        "sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWx",
        "ghp_AbCdEfGhIjKlMnOpQrStUvWxYz012345",
        "github_pat_11ABCDEFG0aBcDeFgHiJkL",
        "AIzaSyA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW",
        "GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx",
        "1//09AbCdEfGhIjKlMnOpQrStUvWxYz0123456789",
    ],
)
def test_bilinen_anahtar_bicimleri_gizlenir(hook, gizli):
    cikti = hook.gizle(f"anahtarim {gizli} bu kadar")
    assert gizli not in cikti
    assert hook.GIZLI in cikti


def test_normal_metin_bozulmaz(hook):
    metin = "Bugun montaj adimini duzelttik; commit a6fa87c, 20 test gecti."
    assert hook.gizle(metin) == metin


def test_env_degerleri_gizlenir(hook, tmp_path):
    (tmp_path / ".env").write_text(
        "PEXELS_API_KEY=kisa\nELEVENLABS_API_KEY=uzunca-bir-deger-123\n", encoding="utf-8"
    )
    sirlar = hook.env_sirlari(tmp_path)
    assert "uzunca-bir-deger-123" in sirlar
    assert "kisa" not in sirlar  # 8 karakterden kisa degerler kalip sayilmaz

    cikti = hook.gizle("deger: uzunca-bir-deger-123", sirlar)
    assert "uzunca-bir-deger-123" not in cikti


def test_env_yoksa_sorun_cikmaz(hook, tmp_path):
    assert hook.env_sirlari(tmp_path) == []
