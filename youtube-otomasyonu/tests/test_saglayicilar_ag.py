"""Ag saglayicilarinin testleri (sahte HTTP yanitlariyla).

Gercek istek atilmaz: httpx.MockTransport ile Pexels ve ElevenLabs'in
dondurdugu govde bicimleri taklit edilir. Amac, anahtar geldiginde kodun
yaniti dogru ayrisitirdigindan emin olmak.
"""

import json

import httpx
import pytest

from otomasyon.ayarlar import Ayarlar
from otomasyon.modeller import Sahne
from otomasyon.saglayicilar.gorsel import PexelsGorsel, gorsel_saglayicilari, tur_bul
from otomasyon.saglayicilar.ses import ElevenLabsSes

PEXELS_VIDEO_YANITI = {
    "total_results": 2,
    "videos": [
        {
            "id": 111,
            "width": 1080,
            "height": 1920,
            "video_files": [
                {"link": "https://videos.pexels.com/kucuk.mp4", "width": 360, "height": 640,
                 "quality": "sd"},
                {"link": "https://videos.pexels.com/buyuk.mp4", "width": 1080, "height": 1920,
                 "quality": "hd"},
            ],
        },
        {
            "id": 222,
            "width": 720,
            "height": 1280,
            "video_files": [
                {"link": "https://videos.pexels.com/ikinci.mp4", "width": 720, "height": 1280,
                 "quality": "hd"}
            ],
        },
    ],
}

PEXELS_FOTO_YANITI = {
    "total_results": 1,
    "photos": [{"id": 9, "src": {"large2x": "https://images.pexels.com/foto.jpg"}}],
}


@pytest.fixture
def sahte_httpx(monkeypatch):
    """httpx.get / httpx.stream / httpx.post cagrilarini sahte sunucuya baglar."""
    kayit: dict = {"istekler": []}

    def isleyici(istek: httpx.Request) -> httpx.Response:
        kayit["istekler"].append(istek)
        yol = istek.url.path
        if yol == "/videos/search":
            return httpx.Response(200, json=PEXELS_VIDEO_YANITI)
        if yol == "/v1/search":
            return httpx.Response(200, json=PEXELS_FOTO_YANITI)
        if istek.url.host.startswith(("videos.", "images.")):
            return httpx.Response(200, content=b"medya-verisi" * 100)
        if "text-to-speech" in yol:
            return httpx.Response(200, content=b"ID3-sahte-mp3-verisi")
        return httpx.Response(404, json={"error": "yok"})

    istemci = httpx.Client(transport=httpx.MockTransport(isleyici))
    monkeypatch.setattr(httpx, "get", istemci.get)
    monkeypatch.setattr(httpx, "post", istemci.post)
    monkeypatch.setattr(httpx, "stream", istemci.stream)
    return kayit


@pytest.fixture
def ayarlar(tmp_path, monkeypatch):
    monkeypatch.setenv("PEXELS_API_KEY", "sahte-pexels-anahtari")
    return Ayarlar.yukle(koku=tmp_path)


def test_pexels_hazir_anahtar_varsa(ayarlar):
    assert PexelsGorsel(ayarlar).hazir()


def test_pexels_anahtarsizken_hazir_degil(tmp_path):
    assert not PexelsGorsel(Ayarlar.yukle(koku=tmp_path)).hazir()


def test_pexels_video_indirir_ve_cozunurluge_en_yakinini_secer(ayarlar, sahte_httpx, tmp_path):
    yol = PexelsGorsel(ayarlar).getir(Sahne("metin", "night sky"), 0, tmp_path)

    assert yol.suffix == ".mp4" and tur_bul(yol) == "video"
    assert yol.stat().st_size > 0
    indirilen = [i for i in sahte_httpx["istekler"] if i.url.host == "videos.pexels.com"]
    assert str(indirilen[-1].url).endswith("buyuk.mp4")  # 1080x1920'ye en yakin dosya


def test_pexels_dikey_video_icin_portrait_ister(ayarlar, sahte_httpx, tmp_path):
    PexelsGorsel(ayarlar).getir(Sahne("metin", "kedi"), 0, tmp_path)
    arama = sahte_httpx["istekler"][0]
    assert arama.url.params["orientation"] == "portrait"
    assert arama.url.params["query"] == "kedi"
    assert arama.headers["authorization"] == "sahte-pexels-anahtari"


def test_pexels_sahneler_farkli_video_alir(ayarlar, sahte_httpx, tmp_path):
    saglayici = PexelsGorsel(ayarlar)
    saglayici.getir(Sahne("bir", "a"), 0, tmp_path)
    saglayici.getir(Sahne("iki", "a"), 1, tmp_path)
    indirilenler = [str(i.url) for i in sahte_httpx["istekler"] if i.url.host == "videos.pexels.com"]
    assert indirilenler[0] != indirilenler[1]  # sira farkli videoya denk gelir


def test_pexels_foto_modu(tmp_path, monkeypatch, sahte_httpx):
    monkeypatch.setenv("PEXELS_API_KEY", "x")
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["gorsel.pexels_tur=foto"])
    yol = PexelsGorsel(ayarlar).getir(Sahne("metin", "deniz"), 0, tmp_path)
    assert yol.suffix == ".jpg" and tur_bul(yol) == "foto"


def test_pexels_sonuc_bulamazsa_yerele_duser(tmp_path, monkeypatch):
    monkeypatch.setenv("PEXELS_API_KEY", "x")

    def bos(istek):
        return httpx.Response(200, json={"total_results": 0, "videos": []})

    istemci = httpx.Client(transport=httpx.MockTransport(bos))
    monkeypatch.setattr(httpx, "get", istemci.get)

    ayarlar = Ayarlar.yukle(koku=tmp_path)
    saglayicilar = gorsel_saglayicilari(ayarlar)
    assert [s.ad for s in saglayicilar][0] == "pexels"

    # Boru hattinin yaptigi gibi: ilk saglayici patlarsa sonrakine gec.
    sahne = Sahne("metin", "bulunmayan-sey")
    for saglayici in saglayicilar:
        try:
            yol = saglayici.getir(sahne, 0, tmp_path)
            kaynak = saglayici.ad
            break
        except Exception:
            continue
    assert kaynak == "yerel"
    assert yol.exists()


def test_elevenlabs_ses_dosyasi_yazar(tmp_path, monkeypatch, sahte_httpx):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "sahte-el-anahtari")
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["ses.elevenlabs_ses_id=abc123"])
    saglayici = ElevenLabsSes(ayarlar)
    assert saglayici.hazir()

    hedef = saglayici.seslendir("merhaba", tmp_path / "ses.mp3")
    assert hedef.read_bytes().startswith(b"ID3")

    istek = sahte_httpx["istekler"][-1]
    assert istek.url.path.endswith("/abc123")
    assert istek.headers["xi-api-key"] == "sahte-el-anahtari"
    govde = json.loads(istek.content)
    assert govde["text"] == "merhaba"
    assert govde["model_id"] == "eleven_multilingual_v2"


def test_elevenlabs_ses_id_yoksa_hazir_degil(tmp_path, monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "x")
    assert not ElevenLabsSes(Ayarlar.yukle(koku=tmp_path)).hazir()


def test_elevenlabs_hata_kodunu_yukseltir(tmp_path, monkeypatch):
    from otomasyon.arac import AracHatasi

    istemci = httpx.Client(
        transport=httpx.MockTransport(lambda i: httpx.Response(401, text="gecersiz anahtar"))
    )
    monkeypatch.setattr(httpx, "post", istemci.post)
    monkeypatch.setenv("ELEVENLABS_API_KEY", "x")
    ayarlar = Ayarlar.yukle(koku=tmp_path, ustune=["ses.elevenlabs_ses_id=v1"])

    with pytest.raises(AracHatasi, match="401"):
        ElevenLabsSes(ayarlar).seslendir("merhaba", tmp_path / "a.mp3")
