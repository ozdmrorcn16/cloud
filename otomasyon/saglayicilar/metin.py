"""Konu, senaryo ve YouTube ust verisi ureten saglayicilar."""

from __future__ import annotations

import json
import re
import textwrap

from ..ayarlar import Ayarlar
from ..gunluk import gunlukcu
from ..modeller import Fikir, Sahne, Senaryo

KAYIT = gunlukcu("otomasyon.metin")


class MetinSaglayici:
    ad = "temel"

    def __init__(self, ayarlar: Ayarlar) -> None:
        self.ayarlar = ayarlar

    def hazir(self) -> bool:
        return False

    def konu_uret(self, adet: int, kacinilacak: list[str]) -> list[Fikir]:
        raise NotImplementedError

    def senaryo_yaz(self, fikir: Fikir) -> Senaryo:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Claude
# ---------------------------------------------------------------------------

_SENARYO_SEMASI = """
{
  "baslik": "YouTube basligi (60 karakteri gecmesin, merak uyandirsin, clickbait olmasin)",
  "kanca": "ilk 3 saniyede soylenecek cumle",
  "sahneler": [
    {"metin": "seslendirilecek cumle(ler)", "gorsel_sorgu": "Ingilizce stok video arama terimi"}
  ],
  "kapanis": "izleyiciyi abone olmaya/yorum yapmaya davet eden tek cumle",
  "aciklama": "YouTube aciklamasi (2-4 cumle, sonuna 3-5 hashtag)",
  "etiketler": ["etiket1", "etiket2"],
  "kapak_metni": "kapak gorselinde yer alacak en fazla 4 kelimelik vurucu ifade"
}
"""


class ClaudeMetin(MetinSaglayici):
    """Senaryoyu ve ust veriyi Claude API ile yazar."""

    ad = "claude"

    def hazir(self) -> bool:
        if not self.ayarlar.sir("anthropic"):
            return False
        try:
            import anthropic  # noqa: F401
        except ImportError:
            KAYIT.warning("anthropic paketi kurulu degil; Claude saglayicisi atlaniyor")
            return False
        return True

    def _istemci(self):
        import anthropic

        return anthropic.Anthropic(api_key=self.ayarlar.sir("anthropic"))

    def _sor(self, komut: str) -> str:
        istemci = self._istemci()
        yanit = istemci.messages.create(
            model=str(self.ayarlar.al("metin.claude_model")),
            max_tokens=int(self.ayarlar.al("metin.claude_max_token", 4000)),
            messages=[{"role": "user", "content": komut}],
        )
        return "".join(p.text for p in yanit.content if getattr(p, "type", "") == "text")

    @staticmethod
    def _json_ayikla(metin: str) -> dict | list:
        metin = metin.strip()
        kod = re.search(r"```(?:json)?\s*(.+?)```", metin, re.S)
        if kod:
            metin = kod.group(1).strip()
        ilk = min((i for i in (metin.find("{"), metin.find("[")) if i != -1), default=-1)
        if ilk == -1:
            raise ValueError("Yanitta JSON bulunamadi")
        son = max(metin.rfind("}"), metin.rfind("]"))
        return json.loads(metin[ilk : son + 1])

    def konu_uret(self, adet: int, kacinilacak: list[str]) -> list[Fikir]:
        komut = textwrap.dedent(
            f"""
            Bir YouTube kanali icin {adet} adet yeni video konusu uret.

            Kanal nisi: {self.ayarlar.al('kanal.nis')}
            Hedef kitle: {self.ayarlar.al('kanal.hedef_kitle')}
            Dil: Turkce. Bicim: {'dikey kisa video (Shorts)' if self.ayarlar.dikey else 'yatay video'},
            yaklasik {self.ayarlar.al('video.hedef_sure')} saniye.

            Daha once islenmis ve TEKRARLANMAMASI gereken konular:
            {json.dumps(kacinilacak[-60:], ensure_ascii=False)}

            Yalnizca su semada bir JSON dizisi dondur, baska hicbir sey yazma:
            [{{"konu": "...", "aciklama": "neden ilgi ceker, tek cumle",
               "anahtar_kelimeler": ["...", "..."]}}]
            """
        ).strip()
        veri = self._json_ayikla(self._sor(komut))
        fikirler = [
            Fikir(
                konu=str(x["konu"]).strip(),
                aciklama=str(x.get("aciklama", "")).strip(),
                anahtar_kelimeler=[str(k) for k in x.get("anahtar_kelimeler", [])],
            )
            for x in veri  # type: ignore[union-attr]
        ]
        KAYIT.info("Claude %d konu uretti", len(fikirler))
        return fikirler

    def senaryo_yaz(self, fikir: Fikir) -> Senaryo:
        sahne_sayisi = int(self.ayarlar.al("video.sahne_sayisi", 5))
        hedef = int(self.ayarlar.al("video.hedef_sure", 45))
        # ~2.6 kelime/saniye Turkce konusma hizi.
        kelime = int(hedef * 2.6)
        komut = textwrap.dedent(
            f"""
            "{fikir.konu}" konusunda Turkce bir video senaryosu yaz.

            Kanal tonu: {self.ayarlar.al('kanal.ton')}
            Hedef kitle: {self.ayarlar.al('kanal.hedef_kitle')}
            Bicim: {'dikey Shorts' if self.ayarlar.dikey else 'yatay video'},
            hedef sure {hedef} saniye, toplam yaklasik {kelime} kelime.
            Tam {sahne_sayisi} sahne olsun; her sahne 1-2 kisa cumle.

            Kurallar:
            - Ilk cumle (kanca) merak uyandirsin, soru ya da carpici bilgi olsun.
            - Seslendirilecek metin oldugu icin emoji, parantez, madde imi, kisaltma kullanma.
            - Sayilari rakamla degil yaziyla yazma zorunlulugu yok; dogal okunani sec.
            - Bilgi dogru olsun; emin olmadigin iddiayi yazma.
            - gorsel_sorgu alanlari INGILIZCE ve stok video sitesinde arama yapmaya uygun
              somut sahne tarifleri olsun (ornek: "smartphone charging at night close up").

            Yalnizca su semada JSON dondur, baska hicbir sey yazma:
            {_SENARYO_SEMASI}
            """
        ).strip()
        veri = self._json_ayikla(self._sor(komut))
        assert isinstance(veri, dict)
        sahneler = [
            Sahne(metin=str(s["metin"]).strip(), gorsel_sorgu=str(s.get("gorsel_sorgu", "")).strip())
            for s in veri.get("sahneler", [])
            if str(s.get("metin", "")).strip()
        ]
        if not sahneler:
            raise ValueError("Claude bos senaryo dondurdu")
        senaryo = Senaryo(
            fikir=fikir,
            kanca=str(veri.get("kanca", "")).strip(),
            sahneler=sahneler,
            kapanis=str(veri.get("kapanis", "")).strip(),
            baslik=str(veri.get("baslik", fikir.konu)).strip()[:100],
            aciklama=str(veri.get("aciklama", "")).strip(),
            etiketler=[str(e).strip() for e in veri.get("etiketler", [])][:15],
            kapak_metni=str(veri.get("kapak_metni", "")).strip(),
            kaynak="claude",
        )
        KAYIT.info("Claude senaryosu hazir: %d sahne", len(senaryo.sahneler))
        return senaryo


# ---------------------------------------------------------------------------
# Sablon (anahtarsiz yedek)
# ---------------------------------------------------------------------------

_KANCA = [
    "{konu} hakkinda cogu kisinin bilmedigi bir sey var.",
    "{konu} konusunda yanlis bildigimiz bir detay var.",
    "Bir dakikan varsa, {konu} meselesini kalici olarak ogrenelim.",
]

_GOVDE = [
    "Once isin temelini netlestirelim: {konu} sandigin kadar karmasik degil.",
    "Onemli olan su: kucuk bir aliskanlik degisikligi sonucun tamamini degistiriyor.",
    "Uygulamasi kolay: bugun deneyip farki kendi gozunle gorebilirsin.",
    "Yaygin hata, herkesin yaptigi seyi sorgusuz tekrar etmek.",
    "Ozetle, dogru bilgiyle bir kere ayarladiginda bir daha ugrasmiyorsun.",
]


class SablonMetin(MetinSaglayici):
    """API anahtari gerektirmeyen yedek: konu listesinden iskelet senaryo kurar.

    Icerik kalitesi Claude kadar iyi degildir; amaci boru hattinin anahtarsiz
    da uctan uca calisabilmesidir.
    """

    ad = "sablon"

    def hazir(self) -> bool:
        return True

    def konu_uret(self, adet: int, kacinilacak: list[str]) -> list[Fikir]:
        dosya = self.ayarlar.mutlak(str(self.ayarlar.al("cikti.konu_dosyasi")))
        konular: list[str] = []
        if dosya.exists():
            for satir in dosya.read_text(encoding="utf-8").splitlines():
                satir = satir.strip()
                if satir and not satir.startswith("#") and satir not in kacinilacak:
                    konular.append(satir)
        if not konular:
            raise RuntimeError(
                f"Islenmemis konu kalmadi. {dosya} dosyasina yeni satirlar ekle "
                "ya da ANTHROPIC_API_KEY tanimlayip konulari Claude'a urettir."
            )
        return [Fikir(konu=k) for k in konular[:adet]]

    def senaryo_yaz(self, fikir: Fikir) -> Senaryo:
        sahne_sayisi = int(self.ayarlar.al("video.sahne_sayisi", 5))
        govde = [_GOVDE[i % len(_GOVDE)] for i in range(sahne_sayisi)]
        sahneler = [
            Sahne(metin=k.format(konu=fikir.konu.lower()), gorsel_sorgu=fikir.konu)
            for k in govde
        ]
        return Senaryo(
            fikir=fikir,
            kanca=_KANCA[len(fikir.konu) % len(_KANCA)].format(konu=fikir.konu.lower()),
            sahneler=sahneler,
            kapanis="Faydali olduysa abone ol, bir sonraki videoda gorusuruz.",
            baslik=fikir.konu[:100],
            aciklama=f"{fikir.konu} hakkinda kisa ve net bir anlatim.\n\n#bilgi #ipucu #teknoloji",
            etiketler=[p for p in re.split(r"\W+", fikir.konu.lower()) if len(p) > 3][:10],
            kapak_metni=" ".join(fikir.konu.split()[:3]).upper(),
            kaynak="sablon",
        )


SINIFLAR: dict[str, type[MetinSaglayici]] = {"claude": ClaudeMetin, "sablon": SablonMetin}


def metin_saglayici(ayarlar: Ayarlar) -> MetinSaglayici:
    """Yapilandirmadaki siraya gore hazir olan ilk saglayiciyi dondurur."""
    for ad in ayarlar.liste("metin.saglayici_sirasi", ["sablon"]):
        sinif = SINIFLAR.get(str(ad))
        if not sinif:
            KAYIT.warning("Bilinmeyen metin saglayicisi: %s", ad)
            continue
        aday = sinif(ayarlar)
        if aday.hazir():
            KAYIT.info("Metin saglayicisi: %s", aday.ad)
            return aday
        KAYIT.debug("Metin saglayicisi hazir degil: %s", ad)
    return SablonMetin(ayarlar)
