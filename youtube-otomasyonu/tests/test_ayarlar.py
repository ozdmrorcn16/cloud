import textwrap

from otomasyon.ayarlar import Ayarlar


def test_yaml_varsayilani_ezer_ama_digerlerini_korur(tmp_path):
    (tmp_path / "konfig").mkdir()
    (tmp_path / "konfig" / "kanal.yaml").write_text(
        textwrap.dedent(
            """
            video:
              bicim: yatay
            """
        ),
        encoding="utf-8",
    )
    ayarlar = Ayarlar.yukle(koku=tmp_path)
    assert ayarlar.al("video.bicim") == "yatay"
    assert ayarlar.al("video.kare_hizi") == 30  # varsayilan korunur
    assert ayarlar.cozunurluk == (1920, 1080)
    assert not ayarlar.dikey


def test_bayrakla_ezme_tur_cevirir(tmp_path):
    ayarlar = Ayarlar.yukle(
        koku=tmp_path,
        ustune=["video.hedef_sure=30", "altyazi.etkin=false", "ses.saglayici_sirasi=edge,espeak"],
    )
    assert ayarlar.al("video.hedef_sure") == 30
    assert ayarlar.al("altyazi.etkin") is False
    assert ayarlar.al("ses.saglayici_sirasi") == ["edge", "espeak"]


def test_sirlar_ortamdan_okunur(tmp_path, monkeypatch):
    monkeypatch.setenv("PEXELS_API_KEY", "abc123")
    ayarlar = Ayarlar.yukle(koku=tmp_path)
    assert ayarlar.sir("pexels") == "abc123"
    assert ayarlar.sir("elevenlabs") == ""


def test_shorts_dikeydir(tmp_path):
    ayarlar = Ayarlar.yukle(koku=tmp_path)
    assert ayarlar.dikey
    assert ayarlar.cozunurluk == (1080, 1920)


def test_liste_tek_deger_verilince_bolunmez(tmp_path):
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["ses.saglayici_sirasi=sessiz"])
    assert ayarlar.liste("ses.saglayici_sirasi") == ["sessiz"]


def test_liste_virgullu_degeri_ayirir(tmp_path):
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["gorsel.saglayici_sirasi=pexels,yerel"])
    assert ayarlar.liste("gorsel.saglayici_sirasi") == ["pexels", "yerel"]


def test_ezme_varsayilanlari_kirletmez(tmp_path):
    ilk = Ayarlar.yukle(koku=tmp_path, ustune=["altyazi.etkin=false", "video.kare_hizi=24"])
    assert ilk.al("altyazi.etkin") is False
    ikinci = Ayarlar.yukle(koku=tmp_path)
    assert ikinci.al("altyazi.etkin") is True
    assert ikinci.al("video.kare_hizi") == 30
