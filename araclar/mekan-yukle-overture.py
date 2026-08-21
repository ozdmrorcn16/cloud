"""Overture Places -> mekanlar tablosu yukleyicisi.

Kullanim:
    1) python araclar/mekan-yukle-overture.py indir
       Overture'un guncel yayinindan Turkiye kesitini yerel parquet'e
       indirir (canli veritabanina dokunmaz).
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

RELEASE = "2026-08-19.0"
S3_YOL = f"s3://overturemaps-us-west-2/release/{RELEASE}/theme=places/type=place/*.parquet"
YEREL_PARQUET = os.path.join(os.path.dirname(__file__), "overture-tr.parquet")

# Turkiye'yi kapsayan kutu. Sinir komsularindan tasan az sayida satir
# zararsizdir: arama zaten kullanicinin yaricapinda calisir.
XMIN, XMAX = 25.5, 44.9
YMIN, YMAX = 35.7, 42.3

GUVEN_ESIGI = 0.5

# Overture kategorisi -> uygulamanin tur degeri.
# Uygulamanin bugunku tur seti korunuyor: kafe / bar / restoran / park.
TUR_SQL = """
CASE
  WHEN kategori IN ('cafe', 'coffee_shop', 'tea_room', 'internet_cafe')
       OR kategori LIKE '%_cafe' THEN 'kafe'
  WHEN kategori IN ('bar', 'pub', 'night_club', 'wine_bar', 'cocktail_bar',
                    'beer_garden', 'beer_bar', 'hookah_lounge', 'karaoke')
       OR kategori LIKE '%_bar' THEN 'bar'
  WHEN kategori LIKE '%restaurant%' OR kategori IN ('fast_food', 'food_court',
                    'diner', 'bistro', 'pizzeria', 'kebab_shop')
       THEN 'restoran'
  WHEN kategori IN ('park', 'state_park', 'national_park', 'public_garden',
                    'botanical_garden', 'beach', 'picnic_area')
       THEN 'park'
END
"""


def indir():
    import duckdb

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")
    print(f"Overture {RELEASE} taraniyor (Turkiye kutusu)...")
    con.execute(f"""
        COPY (
          WITH ham AS (
            SELECT id AS gers_id,
                   names.primary AS ad,
                   categories.primary AS kategori,
                   confidence AS guven,
                   bbox.xmin AS lng,
                   bbox.ymin AS lat,
                   addresses[1].freeform AS adres,
                   addresses[1].country AS ulke
            FROM read_parquet('{S3_YOL}')
            WHERE bbox.xmin >= {XMIN} AND bbox.xmax <= {XMAX}
              AND bbox.ymin >= {YMIN} AND bbox.ymax <= {YMAX}
              AND names.primary IS NOT NULL
              AND confidence >= {GUVEN_ESIGI}
          )
          SELECT gers_id, ad, {TUR_SQL} AS tur, guven, lng, lat, adres
          FROM ham
          WHERE (ulke IS NULL OR ulke = 'TR')
            AND ({TUR_SQL}) IS NOT NULL
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
    con = duckdb.connect()
    satirlar = con.execute(
        f"SELECT gers_id, ad, tur, guven, lng, lat, adres FROM read_parquet('{YEREL_PARQUET}')"
    ).fetchall()
    print(f"{len(satirlar)} satir yuklenecek (gers_id ile upsert)...")

    PARCA = 500
    for i in range(0, len(satirlar), PARCA):
        parca = [
            {
                "gers_id": s[0],
                "ad": s[1],
                "tur": s[2],
                "guven": s[3],
                "konum": f"POINT({s[4]} {s[5]})",
                "adres": s[6],
                "kaynak": "overture",
            }
            for s in satirlar[i : i + PARCA]
        ]
        supabase.table("mekanlar").upsert(parca, on_conflict="gers_id").execute()
        if (i // PARCA) % 20 == 0 or i + PARCA >= len(satirlar):
            print(f"{min(i + PARCA, len(satirlar))}/{len(satirlar)}")
    print("Yukleme bitti.")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("indir", "yukle"):
        print("Kullanim: python araclar/mekan-yukle-overture.py [indir|yukle]")
        sys.exit(1)
    (indir if sys.argv[1] == "indir" else yukle)()
