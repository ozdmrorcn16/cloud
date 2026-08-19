"""Uctan uca (yuklemesiz) boru hatti testi.

Anahtarsiz saglayicilarla kucuk bir video uretir: sablon senaryo + sessiz ses
+ yerel gorsel. ffmpeg gerektirir.
"""

import shutil

import pytest

from otomasyon.akis import Akis
from otomasyon.ayarlar import Ayarlar
from otomasyon.montaj import yazi_tipi_adi

ffmpeg_gerek = pytest.mark.skipif(
    shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None,
    reason="ffmpeg kurulu degil",
)


@pytest.fixture
def ayarlar(tmp_path):
    (tmp_path / "konfig").mkdir()
    (tmp_path / "konfig" / "konular.txt").write_text("Deneme konusu\n", encoding="utf-8")
    return Ayarlar.yukle(
        koku=tmp_path,
        ustune=[
            "video.sahne_sayisi=2",
            "video.yakinlastirma=false",
            "metin.saglayici_sirasi=sablon",
            "ses.saglayici_sirasi=sessiz",
            "gorsel.saglayici_sirasi=yerel",
            "yukleme.saglayici=kuru",
        ],
    )


@ffmpeg_gerek
def test_uctan_uca_video_uretir(ayarlar):
    akis = Akis(ayarlar)
    uretim = akis.tam(konu="Deneme konusu", kuru=True)

    video = uretim.yol / f"{uretim.kimlik}.mp4"
    assert video.exists() and video.stat().st_size > 10_000
    assert uretim.sure > 1
    assert (uretim.yol / "altyazi.srt").exists()
    assert (uretim.yol / "altyazi.ass").exists()
    assert uretim.kapak_yolu and (uretim.yol / "kapak.jpg").exists()
    # Kuru kosu gecmise yazilir ama konu havuzunu tuketmez.
    from otomasyon import gecmis

    kayitlar = gecmis.oku(ayarlar)
    assert kayitlar and kayitlar[-1]["konu"] == "Deneme konusu"
    assert kayitlar[-1]["kuru"] is True
    assert gecmis.islenen_konular(ayarlar) == []


@ffmpeg_gerek
def test_ass_dosyasi_video_cozunurlugunu_kullanir(ayarlar):
    akis = Akis(ayarlar)
    uretim = akis.tam(konu="Ikinci deneme", kuru=True)
    ass = (uretim.yol / "altyazi.ass").read_text(encoding="utf-8")
    assert "PlayResX: 1080" in ass
    assert "PlayResY: 1920" in ass
    assert f"Style: Ana,{yazi_tipi_adi()}" in ass


def test_yazi_tipi_adi_bosluklu_dondurur():
    assert yazi_tipi_adi() in ("DejaVu Sans", "Liberation Sans", "Arial", "Sans")
