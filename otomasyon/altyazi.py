"""Sahne metinlerinden SRT altyazi uretimi.

Sahne suresi, sahne metnindeki parcalarin karakter uzunluguna gore paylastirilir.
Kelime bazli zamanlama (Whisper vb.) gerekmeden yeterince isabetli sonuc verir.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Satir:
    metin: str
    baslangic: float
    bitis: float


def _zaman(saniye: float) -> str:
    saniye = max(0.0, saniye)
    saat, kalan = divmod(saniye, 3600)
    dakika, sn = divmod(kalan, 60)
    return f"{int(saat):02d}:{int(dakika):02d}:{int(sn):02d},{int(round((sn % 1) * 1000)):03d}"


def parcala(metin: str, kelime_sayisi: int) -> list[str]:
    """Metni en fazla `kelime_sayisi` kelimelik altyazi parcalarina boler.

    Noktalama isaretleri dogal kesme noktasi kabul edilir.
    """
    metin = re.sub(r"\s+", " ", metin).strip()
    if not metin:
        return []
    cumleler = [c.strip() for c in re.split(r"(?<=[.!?:;])\s+", metin) if c.strip()]
    parcalar: list[str] = []
    for cumle in cumleler:
        kelimeler = cumle.split()
        for i in range(0, len(kelimeler), kelime_sayisi):
            grup = kelimeler[i : i + kelime_sayisi]
            # Tek kelimelik artik parcayi bir oncekine yapistir.
            if len(grup) == 1 and parcalar:
                parcalar[-1] = f"{parcalar[-1]} {grup[0]}"
            else:
                parcalar.append(" ".join(grup))
    return parcalar


def satirlar_uret(
    bloklar: list[tuple[str, float, float]], kelime_sayisi: int = 4
) -> list[Satir]:
    """bloklar: (metin, baslangic, sure) -> zamanlanmis altyazi satirlari."""
    sonuc: list[Satir] = []
    for metin, baslangic, sure in bloklar:
        parcalar = parcala(metin, kelime_sayisi)
        if not parcalar or sure <= 0:
            continue
        toplam = sum(len(p) for p in parcalar) or 1
        imlec = baslangic
        for parca in parcalar:
            pay = sure * (len(parca) / toplam)
            sonuc.append(Satir(parca, imlec, imlec + pay))
            imlec += pay
    return sonuc


def srt_yaz(satirlar: list[Satir], hedef: Path) -> Path:
    parcalar = []
    for sira, satir in enumerate(satirlar, start=1):
        parcalar.append(
            f"{sira}\n{_zaman(satir.baslangic)} --> {_zaman(satir.bitis)}\n{satir.metin}\n"
        )
    hedef.write_text("\n".join(parcalar), encoding="utf-8")
    return hedef


def _ass_zaman(saniye: float) -> str:
    saniye = max(0.0, saniye)
    saat, kalan = divmod(saniye, 3600)
    dakika, sn = divmod(kalan, 60)
    return f"{int(saat)}:{int(dakika):02d}:{int(sn):02d}.{int(round((sn % 1) * 100)):02d}"


def _ass_kacir(metin: str) -> str:
    return metin.replace("\\", "\\\\").replace("{", "(").replace("}", ")").replace("\n", "\\N")


def ass_yaz(satirlar: list[Satir], hedef: Path, ayarlar) -> Path:
    """Altyaziyi ASS olarak yazar.

    SRT'yi dogrudan ffmpeg'e gommek yerine ASS uretiyoruz: boylece PlayRes
    videonun kendi cozunurlugu olur ve punto/kenar bosluk degerleri piksel
    karsiligiyla birebir uyar (aksi halde libass 384x288 varsayip her seyi
    ~6 kat buyutuyor).
    """
    genislik, yukseklik = ayarlar.cozunurluk
    punto = int(ayarlar.al("altyazi.punto", 0) or 0) or max(28, int(yukseklik * 0.038))
    yan_bosluk = int(genislik * 0.08)
    alt_bosluk = int(
        ayarlar.al("altyazi.alt_bosluk", 240) if ayarlar.dikey else int(yukseklik * 0.08)
    )
    from .montaj import yazi_tipi_adi

    basliklar = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {genislik}",
        f"PlayResY: {yukseklik}",
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Ana,{ad},{punto},{renk},{renk},{kenar},&H64000000,-1,0,0,0,100,100,0,0,1,"
        "{kalinlik},0,2,{yan},{yan},{alt},1".format(
            ad=yazi_tipi_adi(),
            punto=punto,
            renk=ayarlar.al("altyazi.renk", "&H00FFFFFF"),
            kenar=ayarlar.al("altyazi.kenar_rengi", "&H00000000"),
            kalinlik=ayarlar.al("altyazi.kenar_kalinligi", 4),
            yan=yan_bosluk,
            alt=alt_bosluk,
        ),
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for satir in satirlar:
        basliklar.append(
            f"Dialogue: 0,{_ass_zaman(satir.baslangic)},{_ass_zaman(satir.bitis)},"
            f"Ana,,0,0,0,,{_ass_kacir(satir.metin)}"
        )
    hedef.write_text("\n".join(basliklar) + "\n", encoding="utf-8")
    return hedef
