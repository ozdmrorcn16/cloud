"""ffmpeg ile ses/gorsel birlestirme, altyazi gomme ve kapak uretimi."""

from __future__ import annotations

import shutil
from pathlib import Path

from .arac import AracHatasi, ffmpeg, sure_ogren
from .ayarlar import Ayarlar
from .gunluk import gunlukcu
from .modeller import Uretim
from .saglayicilar.gorsel import tur_bul

KAYIT = gunlukcu("otomasyon.montaj")

YAZI_TIPI_ADAYLARI = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def yazi_tipi_bul() -> str | None:
    for aday in YAZI_TIPI_ADAYLARI:
        if Path(aday).exists():
            return aday
    return None


def yazi_tipi_adi() -> str:
    """libass'in fontconfig uzerinden bulabilecegi yazi tipi adi."""
    yol = yazi_tipi_bul()
    if not yol:
        return "Sans"
    kok = Path(yol).stem  # DejaVuSans-Bold -> DejaVu Sans
    kok = kok.split("-")[0]
    return {"DejaVuSans": "DejaVu Sans", "LiberationSans": "Liberation Sans"}.get(kok, kok)


def _kacir(yol: Path) -> str:
    """ffmpeg filtre zincirinde dosya yolu kacislamasi."""
    return str(yol).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def sahne_klibi(
    kaynak: Path,
    sure: float,
    hedef: Path,
    ayarlar: Ayarlar,
) -> Path:
    """Tek sahnenin sessiz video klibini uretir (sabit cozunurluk/kare hizi)."""
    genislik, yukseklik = ayarlar.cozunurluk
    fps = int(ayarlar.al("video.kare_hizi", 30))
    kare = max(1, int(round(sure * fps)))
    olcek = (
        f"scale={genislik}:{yukseklik}:force_original_aspect_ratio=increase,"
        f"crop={genislik}:{yukseklik}"
    )

    if tur_bul(kaynak) == "video":
        suzgec = f"{olcek},fps={fps},setsar=1,format=yuv420p"
        girdi = ["-stream_loop", "-1", "-i", str(kaynak)]
    elif ayarlar.al("video.yakinlastirma", True):
        # Ken Burns: yavas yakinlastirma. zoompan girdi karesi basina calisir,
        # bu yuzden once fps'e cikarilir.
        suzgec = (
            f"scale={genislik * 2}:{yukseklik * 2}:force_original_aspect_ratio=increase,"
            f"crop={genislik * 2}:{yukseklik * 2},"
            f"zoompan=z='min(1+0.0009*on,1.18)':d={kare}:s={genislik}x{yukseklik}:fps={fps},"
            f"setsar=1,format=yuv420p"
        )
        girdi = ["-loop", "1", "-i", str(kaynak)]
    else:
        suzgec = f"{olcek},fps={fps},setsar=1,format=yuv420p"
        girdi = ["-loop", "1", "-i", str(kaynak)]

    ffmpeg(
        [
            *girdi,
            "-t", f"{sure:.3f}",
            "-an",
            "-vf", suzgec,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-r", str(fps),
            str(hedef),
        ],
        f"sahne klibi ({kaynak.name})",
    )
    return hedef


def klipleri_birlestir(klipler: list[Path], hedef: Path) -> Path:
    liste = hedef.parent / "klip-listesi.txt"
    liste.write_text(
        "\n".join(f"file '{k.resolve()}'" for k in klipler) + "\n", encoding="utf-8"
    )
    ffmpeg(
        ["-f", "concat", "-safe", "0", "-i", str(liste), "-c", "copy", str(hedef)],
        "klip birlestirme",
    )
    return hedef


def sesleri_birlestir(sesler: list[Path], bosluk: float, hedef: Path) -> Path:
    """Sahne seslerini aralarina sessizlik koyarak tek dosyada birlestirir."""
    if not sesler:
        raise AracHatasi("Birlestirilecek ses yok")
    girdiler: list[str] = []
    suzgecler: list[str] = []
    for sira, yol in enumerate(sesler):
        girdiler += ["-i", str(yol)]
        suzgecler.append(
            f"[{sira}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,"
            f"apad=pad_dur={bosluk:.3f}[a{sira}]"
        )
    zincir = "".join(f"[a{i}]" for i in range(len(sesler)))
    suzgec = ";".join(suzgecler) + f";{zincir}concat=n={len(sesler)}:v=0:a=1[cikti]"
    ffmpeg(
        [*girdiler, "-filter_complex", suzgec, "-map", "[cikti]",
         "-c:a", "aac", "-b:a", "192k", str(hedef)],
        "ses birlestirme",
    )
    return hedef


def son_montaj(
    video: Path,
    ses: Path,
    hedef: Path,
    ayarlar: Ayarlar,
    altyazi: Path | None = None,
) -> Path:
    """Goruntu + ses (+ altyazi + arka plan muzigi) -> yuklenmeye hazir mp4."""
    genislik, yukseklik = ayarlar.cozunurluk
    girdiler = ["-i", str(video), "-i", str(ses)]
    suzgecler: list[str] = []

    muzik = str(ayarlar.al("ses.muzik_yolu", "") or "")
    muzik_yolu = ayarlar.mutlak(muzik) if muzik else None
    muzik_var = bool(muzik_yolu and muzik_yolu.exists())
    if muzik_var:
        girdiler += ["-stream_loop", "-1", "-i", str(muzik_yolu)]

    if altyazi and ayarlar.al("altyazi.etkin", True):
        if altyazi.suffix.lower() == ".ass":
            suzgecler.append(f"[0:v]ass='{_kacir(altyazi)}'[v]")
        else:
            punto = int(ayarlar.al("altyazi.punto", 0) or 0) or max(28, int(yukseklik * 0.038))
            stil = (
                f"FontName={yazi_tipi_adi()},FontSize={punto},"
                f"PrimaryColour={ayarlar.al('altyazi.renk')},"
                f"OutlineColour={ayarlar.al('altyazi.kenar_rengi')},"
                f"BorderStyle=1,Outline={ayarlar.al('altyazi.kenar_kalinligi')},Shadow=0,"
                f"Alignment=2,MarginV={ayarlar.al('altyazi.alt_bosluk')},Bold=1"
            )
            suzgecler.append(
                f"[0:v]subtitles='{_kacir(altyazi)}':force_style='{stil}'"
                f":original_size={genislik}x{yukseklik}[v]"
            )
        video_akisi = "[v]"
    else:
        suzgecler.append("[0:v]null[v]")
        video_akisi = "[v]"

    if muzik_var:
        seviye = float(ayarlar.al("ses.muzik_seviyesi", 0.1))
        suzgecler.append(f"[2:a]volume={seviye}[muzik]")
        suzgecler.append("[1:a][muzik]amix=inputs=2:duration=first:dropout_transition=0[a]")
        ses_akisi = "[a]"
    else:
        ses_akisi = "1:a"

    ffmpeg(
        [
            *girdiler,
            "-filter_complex", ";".join(suzgecler),
            "-map", video_akisi, "-map", ses_akisi,
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
            "-movflags", "+faststart",
            "-shortest",
            str(hedef),
        ],
        "son montaj",
    )
    KAYIT.info("Video hazir: %s (%.1f sn)", hedef, sure_ogren(hedef))
    return hedef


def kapak_uret(uretim: Uretim, ayarlar: Ayarlar, kaynak_gorsel: Path | None) -> Path | None:
    """Ilk sahne gorselinden buyuk metinli bir kapak (thumbnail) uretir."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        KAYIT.warning("Pillow yok; kapak uretilmedi")
        return None

    hedef = uretim.yol / "kapak.jpg"
    genislik, yukseklik = (1280, 720)
    taban = Image.new("RGB", (genislik, yukseklik), (18, 18, 24))

    if kaynak_gorsel and kaynak_gorsel.exists():
        try:
            if tur_bul(kaynak_gorsel) == "video":
                kare = uretim.yol / "_kapak-kare.jpg"
                ffmpeg(["-i", str(kaynak_gorsel), "-vframes", "1", str(kare)], "kapak karesi")
                kaynak_gorsel = kare
            resim = Image.open(kaynak_gorsel).convert("RGB")
            oran = max(genislik / resim.width, yukseklik / resim.height)
            resim = resim.resize((int(resim.width * oran) + 1, int(resim.height * oran) + 1))
            sol = (resim.width - genislik) // 2
            ust = (resim.height - yukseklik) // 2
            taban = resim.crop((sol, ust, sol + genislik, ust + yukseklik))
        except Exception as hata:  # gorsel bozuksa duz zemine dus
            KAYIT.warning("Kapak gorseli kullanilamadi (%s), duz zemin kullaniliyor", hata)

    kaplama = Image.new("RGBA", taban.size, (0, 0, 0, 110))
    taban = Image.alpha_composite(taban.convert("RGBA"), kaplama).convert("RGB")
    cizim = ImageDraw.Draw(taban)

    metin = (uretim.senaryo.kapak_metni if uretim.senaryo else "") or (
        uretim.senaryo.baslik if uretim.senaryo else "VIDEO"
    )
    metin = metin.upper()[:60]
    yol = yazi_tipi_bul()
    punto = 96
    while punto > 28:
        yazi = ImageFont.truetype(yol, punto) if yol else ImageFont.load_default()
        kelimeler = metin.split()
        satirlar: list[str] = []
        gecerli = ""
        for kelime in kelimeler:
            aday = f"{gecerli} {kelime}".strip()
            if cizim.textlength(aday, font=yazi) <= genislik * 0.86:
                gecerli = aday
            else:
                if gecerli:
                    satirlar.append(gecerli)
                gecerli = kelime
        if gecerli:
            satirlar.append(gecerli)
        if len(satirlar) <= 3 or not yol:
            break
        punto -= 8

    satir_yuksekligi = int(punto * 1.25)
    toplam = satir_yuksekligi * len(satirlar)
    y = (yukseklik - toplam) // 2
    for satir in satirlar:
        genislik_metin = cizim.textlength(satir, font=yazi)
        x = (genislik - genislik_metin) / 2
        cizim.text((x, y), satir, font=yazi, fill=(255, 255, 255), stroke_width=6,
                   stroke_fill=(0, 0, 0))
        y += satir_yuksekligi

    taban.save(hedef, "JPEG", quality=88)
    gecici = uretim.yol / "_kapak-kare.jpg"
    if gecici.exists():
        gecici.unlink()
    KAYIT.info("Kapak hazir: %s", hedef)
    return hedef


def gecicileri_temizle(dizin: Path) -> None:
    for ad in ("klipler", "_gecici"):
        yol = dizin / ad
        if yol.exists():
            shutil.rmtree(yol, ignore_errors=True)
