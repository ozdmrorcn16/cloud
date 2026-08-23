"""Overture Places -> mekanlar tablosu yukleyicisi.

Kullanim:
    1) python araclar/mekan-yukle-overture.py indir
       En guncel Overture yayinini KENDISI BULUR ve Turkiye kesitini
       yerel parquet'e indirir (canli veritabanina dokunmaz).
    2) python araclar/mekan-yukle-overture.py yukle
       Yerel parquet'i mekanlar tablosuna gers_id uzerinden UPSERT eder.
       Ayni betik ayda bir yeniden kosulup veriyi tazeler.

Gerekli ortam degiskenleri (yalnizca 'yukle' adiminda):
    EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (mobil/.env)

Lisans: Overture verisi CDLA-Permissive 2.0. Uygulamada
"Mekan verileri: Overture Maps Foundation" atfi gorunur olmali.
"""

import os
import sys

# Sürüm elle sabitlenmez: en guncel Overture yayini otomatik bulunur.
# Gerekirse OVERTURE_RELEASE ortam degiskeniyle sabitlenebilir.
def s3_yolu(release):
    return f"s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*.parquet"


def en_yeni_release(con):
    """Bugunden geriye dogru aylik yayin adaylarini yoklar, ilk bulunani doner."""
    from datetime import date, timedelta

    zorla = os.environ.get("OVERTURE_RELEASE")
    if zorla:
        print(f"Ortamdan sabitlenen release: {zorla}")
        return zorla
    bugun = date.today()
    for geri in range(0, 75):
        aday = (bugun - timedelta(days=geri)).isoformat() + ".0"
        try:
            con.execute(
                f"SELECT 1 FROM read_parquet('{s3_yolu(aday)}') LIMIT 1"
            ).fetchall()
            print(f"En guncel release bulundu: {aday}")
            return aday
        except Exception:
            continue
    raise RuntimeError("Son 75 gunde hicbir Overture yayini bulunamadi")
YEREL_PARQUET = os.path.join(os.path.dirname(__file__), "overture-tr.parquet")

# Turkiye'yi kapsayan kutu. Sinir komsularindan tasan az sayida satir
# zararsizdir: arama zaten kullanicinin yaricapinda calisir.
XMIN, XMAX = 25.5, 44.9
YMIN, YMAX = 35.7, 42.3

# 0.5'ten 0.6'ya cikarildi: Overture'in yanlis etiketledigi kayitlarin
# cogu dusuk guvenli. Ornek: "Park Apt" 0.43 guvenle 'park' kategorisinde
# duruyordu. Esik yukseltmek kapsami bir miktar daraltiyor ama
# kullanicinin bildirdigi yaniltici etiketleri belirgin sekilde azaltiyor.
GUVEN_ESIGI = 0.6

# Kategori eslemesi ARTIK SQL'DE DEGIL: araclar/kategori-eslemesi.py.
# Sebep: eski esleme her seyi dort ture (kafe/bar/restoran/park)
# sikistiriyordu ve plaj "park", apartman "park" gorunuyordu. Yeni esleme
# 168 kategoriyi kendi Turkce adiyla tasiyor ve Overture'in alternatif
# kategorilerini de kullanarak yanlis etiketleri duzeltiyor.
def _esleme():
    import importlib.util
    import os as _os

    yol = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                        'kategori-eslemesi.py')
    spec = importlib.util.spec_from_file_location('kategori_eslemesi', yol)
    modul = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modul)
    return modul


def indir():
    import duckdb

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")
    release = en_yeni_release(con)
    print(f"Overture {release} taraniyor (Turkiye kutusu)...")
    con.execute(f"""
        COPY (
          WITH ham AS (
            SELECT id AS gers_id,
                   names.primary AS ad,
                   categories.primary AS kategori,
                   categories.alternate AS alt_kategoriler,
                   confidence AS guven,
                   bbox.xmin AS lng,
                   bbox.ymin AS lat,
                   addresses[1].freeform AS adres,
                   addresses[1].country AS ulke
            FROM read_parquet('{s3_yolu(release)}')
            WHERE bbox.xmin >= {XMIN} AND bbox.xmax <= {XMAX}
              AND bbox.ymin >= {YMIN} AND bbox.ymax <= {YMAX}
              AND names.primary IS NOT NULL
              AND confidence >= {GUVEN_ESIGI}
          )
          SELECT gers_id, ad, kategori, alt_kategoriler, guven, lng, lat, adres
          FROM ham
          WHERE (ulke IS NULL OR ulke = 'TR')
            AND kategori IS NOT NULL
        ) TO '{YEREL_PARQUET}' (FORMAT parquet)
    """)
    n = con.execute(f"SELECT count(*) FROM read_parquet('{YEREL_PARQUET}')").fetchone()[0]
    print(f"{n} mekan yerel parquet'e yazildi: {YEREL_PARQUET}")


def yukle():
    import duckdb
    from supabase import create_client

    supabase = create_client(
        os.environ["EXPO_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    esleme = _esleme()
    con = duckdb.connect()
    ham = con.execute(
        "SELECT gers_id, ad, kategori, alt_kategoriler, guven, lng, lat, adres "
        f"FROM read_parquet('{YEREL_PARQUET}')"
    ).fetchall()

    # Esleme burada uygulaniyor: sozlukte karsiligi olmayan kategori
    # ALINMAZ. Boylece ekranda hicbir zaman ham Ingilizce kategori adi
    # gorunmez. Ham kategori ayrica sutunda saklanir - esleme sonradan
    # degisirse veriyi yeniden indirmeye gerek kalmaz.
    satirlar = []
    atlanan = {}
    for gers_id, ad, kategori, alt, guven, lng, lat, adres in ham:
        tur = esleme.duzelt(kategori, list(alt) if alt is not None else [])
        if tur is None:
            atlanan[kategori] = atlanan.get(kategori, 0) + 1
            continue
        satirlar.append((gers_id, ad, tur, kategori, guven, lng, lat, adres))

    print(f"{len(ham)} kayittan {len(satirlar)} tanesi eslesti.")
    if atlanan:
        ilk = sorted(atlanan.items(), key=lambda x: -x[1])[:10]
        print("Eslesmedigi icin ALINMAYAN kategoriler (ilk 10):")
        for kategori, adet in ilk:
            print(f"   {adet:>7}  {kategori}")
        print(f"   ... toplam {sum(atlanan.values())} kayit alinmadi.")

    PARCA = 500
    for i in range(0, len(satirlar), PARCA):
        parca = [
            {
                "gers_id": s[0],
                "ad": s[1],
                "tur": s[2],
                "kategori": s[3],
                "guven": s[4],
                "konum": f"POINT({s[5]} {s[6]})",
                "adres": s[7],
                "kaynak": "overture",
            }
            for s in satirlar[i : i + PARCA]
        ]
        supabase.table("mekanlar").upsert(parca, on_conflict="gers_id").execute()
        if (i // PARCA) % 40 == 0 or i + PARCA >= len(satirlar):
            print(f"{min(i + PARCA, len(satirlar))}/{len(satirlar)}")
    print("Yukleme bitti.")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("indir", "yukle"):
        print("Kullanim: python araclar/mekan-yukle-overture.py [indir|yukle]")
        sys.exit(1)
    (indir if sys.argv[1] == "indir" else yukle)()
