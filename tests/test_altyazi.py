from otomasyon.altyazi import Satir, parcala, satirlar_uret, srt_yaz


def test_parcala_kelime_sayisina_uyar():
    metin = "bir iki uc dort bes alti yedi sekiz"
    parcalar = parcala(metin, 3)
    assert parcalar == ["bir iki uc", "dort bes alti", "yedi sekiz"]


def test_parcala_tek_kelimelik_artigi_birlestirir():
    parcalar = parcala("bir iki uc dort bes alti yedi", 3)
    assert parcalar[-1] == "dort bes alti yedi"
    assert all(p.strip() for p in parcalar)


def test_parcala_cumle_sinirinda_boler():
    parcalar = parcala("Kisa cumle. Ikinci cumle burada.", 5)
    assert parcalar[0] == "Kisa cumle."


def test_zamanlar_blok_icinde_kalir():
    satirlar = satirlar_uret([("bir iki uc dort bes alti", 10.0, 4.0)], kelime_sayisi=3)
    assert satirlar[0].baslangic == 10.0
    assert abs(satirlar[-1].bitis - 14.0) < 1e-6
    for onceki, sonraki in zip(satirlar, satirlar[1:]):
        assert onceki.bitis <= sonraki.baslangic + 1e-9


def test_bos_metin_satir_uretmez():
    assert satirlar_uret([("   ", 0.0, 3.0)]) == []


def test_srt_bicimi(tmp_path):
    yol = srt_yaz([Satir("merhaba dunya", 0.0, 1.5)], tmp_path / "a.srt")
    icerik = yol.read_text(encoding="utf-8")
    assert "00:00:00,000 --> 00:00:01,500" in icerik
    assert icerik.startswith("1\n")
