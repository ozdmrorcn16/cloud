from otomasyon.akis import slugla
from otomasyon.modeller import Fikir, Sahne, Senaryo, Uretim


def test_uretim_kaydet_yukle_dongusu(tmp_path):
    uretim = Uretim(
        kimlik="t1",
        dizin=str(tmp_path / "t1"),
        senaryo=Senaryo(
            fikir=Fikir(konu="konu", anahtar_kelimeler=["a"]),
            kanca="kanca",
            sahneler=[Sahne("metin", "query", sure=2.5)],
            baslik="baslik",
            etiketler=["x"],
        ),
        sure=12.5,
    )
    uretim.kaydet()

    geri = Uretim.yukle(uretim.dizin)
    assert geri.kimlik == "t1"
    assert geri.sure == 12.5
    assert geri.senaryo is not None
    assert geri.senaryo.fikir.konu == "konu"
    assert geri.senaryo.sahneler[0].sure == 2.5
    assert geri.senaryo.etiketler == ["x"]


def test_tum_metin_bos_parcalari_atlar():
    senaryo = Senaryo(fikir=Fikir("k"), kanca="", sahneler=[Sahne("bir"), Sahne("iki")], kapanis="")
    assert senaryo.tum_metin() == "bir iki"


def test_slug_turkce_karakterleri_sadelestirir():
    assert slugla("Şarjı Çabuk Biten Telefon") == "sarji-cabuk-biten-telefon"
    assert slugla("!!!") == "video"


def test_yuklenen_konu_havuzdan_dusulur(tmp_path):
    from otomasyon import gecmis
    from otomasyon.ayarlar import Ayarlar

    ayarlar = Ayarlar.yukle(koku=tmp_path)
    gecmis.ekle(ayarlar, {"konu": "A", "kuru": True})
    gecmis.ekle(ayarlar, {"konu": "B", "kuru": False, "youtube_id": "xyz"})
    assert gecmis.islenen_konular(ayarlar) == ["B"]
