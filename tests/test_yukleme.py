"""YouTube yukleyicisinin testleri (sahte API servisiyle).

Gercek yukleme yapilmaz; googleapiclient servisi taklit edilir. Boylece
istek govdesinin (baslik, gizlilik, planli yayin, etiketler) dogru
kuruldugu ve kapak/oynatma listesi adimlarinin cagrildigi dogrulanir.
"""

import json

import pytest

from otomasyon.arac import AracHatasi
from otomasyon.ayarlar import Ayarlar
from otomasyon.modeller import Fikir, Sahne, Senaryo, Uretim
from otomasyon.saglayicilar.yukleme import (
    KuruYukleyici,
    YouTubeYukleyici,
    kimlik_bilgisi,
    yukleyici,
)


class SahteIstek:
    def __init__(self, kayit, tur, **argumanlar):
        self.kayit = kayit
        self.tur = tur
        self.argumanlar = argumanlar
        kayit.setdefault(tur, []).append(argumanlar)

    def next_chunk(self):
        return None, {"id": "vid123"}

    def execute(self):
        return {"id": "ogeler"}


class SahteServis:
    def __init__(self, kayit):
        self.kayit = kayit

    def videos(self):
        return type("V", (), {"insert": lambda _s, **k: SahteIstek(self.kayit, "insert", **k)})()

    def thumbnails(self):
        return type("T", (), {"set": lambda _s, **k: SahteIstek(self.kayit, "kapak", **k)})()

    def playlistItems(self):
        return type("P", (), {"insert": lambda _s, **k: SahteIstek(self.kayit, "liste", **k)})()


@pytest.fixture
def uretim(tmp_path):
    dizin = tmp_path / "u1"
    dizin.mkdir()
    video = dizin / "video.mp4"
    video.write_bytes(b"\x00" * 2048)
    kapak = dizin / "kapak.jpg"
    kapak.write_bytes(b"\xff\xd8\xff" + b"\x00" * 512)
    return Uretim(
        kimlik="u1",
        dizin=str(dizin),
        video_yolu=str(video),
        kapak_yolu=str(kapak),
        senaryo=Senaryo(
            fikir=Fikir(konu="konu"),
            kanca="k",
            sahneler=[Sahne("m")],
            baslik="B" * 130,                       # 100 karaktere kirpilmali
            aciklama="aciklama",
            etiketler=[f"e{i}" for i in range(30)],  # 15 etikete kirpilmali
        ),
    )


def _yukleyici(ayarlar, kayit):
    hedef = YouTubeYukleyici(ayarlar)
    hedef._servis = lambda: SahteServis(kayit)
    return hedef


def test_istek_govdesi_dogru_kurulur(tmp_path, uretim):
    ayarlar = Ayarlar.yukle(koku=tmp_path)
    kayit: dict = {}
    sonuc = _yukleyici(ayarlar, kayit).yukle(uretim)

    govde = kayit["insert"][0]["body"]
    assert len(govde["snippet"]["title"]) == 100
    assert len(govde["snippet"]["tags"]) == 15
    assert govde["snippet"]["categoryId"] == "27"
    assert govde["snippet"]["defaultLanguage"] == "tr"
    assert govde["status"]["privacyStatus"] == "private"
    assert govde["status"]["selfDeclaredMadeForKids"] is False
    assert sonuc.youtube_id == "vid123"
    assert sonuc.youtube_url == "https://www.youtube.com/watch?v=vid123"


def test_planli_yayin_gizliligi_private_yapar(tmp_path, uretim):
    ayarlar = Ayarlar.yukle(
        koku=tmp_path,
        ustune=["yukleme.gizlilik=public", "yukleme.yayin_zamani=2026-09-01T18:00:00Z"],
    )
    kayit: dict = {}
    _yukleyici(ayarlar, kayit).yukle(uretim)

    durum = kayit["insert"][0]["body"]["status"]
    assert durum["publishAt"] == "2026-09-01T18:00:00Z"
    assert durum["privacyStatus"] == "private"  # YouTube planli yayinda bunu sart kosar


def test_kapak_ve_oynatma_listesi_gonderilir(tmp_path, uretim):
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["yukleme.oynatma_listesi_id=PL123"])
    kayit: dict = {}
    _yukleyici(ayarlar, kayit).yukle(uretim)

    assert kayit["kapak"][0]["videoId"] == "vid123"
    liste = kayit["liste"][0]["body"]["snippet"]
    assert liste["playlistId"] == "PL123"
    assert liste["resourceId"]["videoId"] == "vid123"


def test_oynatma_listesi_tanimsizsa_cagrilmaz(tmp_path, uretim):
    ayarlar = Ayarlar.yukle(koku=tmp_path)
    kayit: dict = {}
    _yukleyici(ayarlar, kayit).yukle(uretim)
    assert "liste" not in kayit


def test_video_dosyasi_yoksa_hata(tmp_path, uretim):
    uretim.video_yolu = str(tmp_path / "olmayan.mp4")
    with pytest.raises(AracHatasi, match="video dosyasi"):
        _yukleyici(Ayarlar.yukle(koku=tmp_path), {}).yukle(uretim)


def test_kimlik_token_dosyasindan_okunur(tmp_path):
    (tmp_path / "konfig").mkdir()
    (tmp_path / "konfig" / "token.json").write_text(
        json.dumps({"client_id": "ci", "client_secret": "cs", "refresh_token": "rt"}),
        encoding="utf-8",
    )
    kimlik = kimlik_bilgisi(Ayarlar.yukle(koku=tmp_path))
    assert kimlik.refresh_token == "rt"
    assert kimlik.client_id == "ci"


def test_kimlik_yoksa_anlasilir_hata(tmp_path):
    with pytest.raises(AracHatasi, match="youtube-yetki"):
        kimlik_bilgisi(Ayarlar.yukle(koku=tmp_path))


def test_kimlik_yoksa_kuru_moda_duser(tmp_path):
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["yukleme.saglayici=youtube"])
    assert isinstance(yukleyici(ayarlar), KuruYukleyici)


def test_kuru_bayragi_youtube_yukleyicisini_ezer(tmp_path, monkeypatch):
    monkeypatch.setenv("YT_CLIENT_ID", "ci")
    monkeypatch.setenv("YT_CLIENT_SECRET", "cs")
    monkeypatch.setenv("YT_REFRESH_TOKEN", "rt")
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["yukleme.saglayici=youtube"])
    assert isinstance(yukleyici(ayarlar), YouTubeYukleyici)
    assert isinstance(yukleyici(ayarlar, kuru=True), KuruYukleyici)
