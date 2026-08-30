"""Foursquare OS Places: Turkiye kesitini indirir ve yerel parquet'e yazar.

Kaynak: Hugging Face `foursquare/fsq-os-places` (kapili; Read token
gerekir, HF_TOKEN cevre degiskeni). Dosyalar cografi sirali oldugu icin
parquet row-group istatistikleri sayesinde 11 GB'lik set indirilmeden
Turkiye kutusu suzuluyor (Bursa denemesinde 100 dosya 31 sn surdu).

ALINMAYANLAR (kullanicinin karari 2026-08-30):
  - date_closed dolu (kapandigi onaylanmis)
  - unresolved_flags dolu (closed / duplicate / inappropriate /
    doesnt_exist / privatevenue / delete)
  - mekan olmayan kategoriler: apartman-konut, toplu konut, ofis,
    fabrika, yol, etkinlik (bkz. DISLANAN_KATEGORI)

Cikti: araclar/fsq-tr.parquet (gitignore'da; buyuk dosya).
Kullanim:  HF_TOKEN=hf_... python araclar/fsq-indir.py
"""
import os
import sys
import time

import duckdb

SURUM = "dt=2026-08-11"
TABAN = f"https://huggingface.co/datasets/foursquare/fsq-os-places/resolve/main/release/{SURUM}"
DOSYA_SAYISI = 100
CIKTI = os.path.join(os.path.dirname(__file__), "fsq-tr.parquet")
KATEGORI_CIKTI = os.path.join(os.path.dirname(__file__), "fsq-kategoriler.parquet")

# Turkiye kutusu (biraz genis; ulke filtresi asil siniri koyuyor).
LAT0, LAT1, LNG0, LNG1 = 35.8, 42.2, 25.6, 44.9

# Ilk etiketin herhangi bir seviyesinde bunlar gecen kayit alinmaz.
DISLANAN_KATEGORI = [
    "Residential Building",   # apartman, konut, site
    "Housing Development",    # toplu konut
    "> Office",               # ofisler (Business ... > Office ...)
    "Factory",
    "Travel and Transportation > Road",
    "Event >", "Event",       # konser, festival kayitlari
]


def main() -> None:
    token = os.environ.get("HF_TOKEN")
    if not token:
        sys.exit("HF_TOKEN yok. Hugging Face Read token gerekiyor.")

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; SET threads=8;")
    con.execute(f"CREATE SECRET hf (TYPE http, BEARER_TOKEN '{token}');")
    dosyalar = ", ".join(
        f"'{TABAN}/places/parquet/places_{i:06d}.parquet'" for i in range(DOSYA_SAYISI)
    )
    dislama = " OR ".join(
        f"fsq_category_labels[1] LIKE '%{k}%'" for k in DISLANAN_KATEGORI
    )

    t0 = time.time()
    con.execute(f"""
      CREATE TABLE tr AS
      SELECT fsq_place_id, name, latitude, longitude, address, locality, region,
             admin_region, postcode, date_created, date_refreshed, tel, website,
             fsq_category_ids, fsq_category_labels
      FROM read_parquet([{dosyalar}])
      WHERE country = 'TR'
        AND latitude BETWEEN {LAT0} AND {LAT1} AND longitude BETWEEN {LNG0} AND {LNG1}
        AND date_closed IS NULL
        AND unresolved_flags IS NULL
        AND name IS NOT NULL AND length(trim(name)) >= 2
        AND NOT (fsq_category_labels IS NOT NULL AND len(fsq_category_labels) > 0 AND ({dislama}))
    """)
    n = con.execute("SELECT count(*) FROM tr").fetchone()[0]
    print(f"Turkiye kesiti: {n:,} kayit ({time.time() - t0:.0f} sn)")
    con.execute(f"COPY tr TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)")
    con.execute(
        f"COPY (SELECT * FROM read_parquet('{TABAN}/categories/parquet/categories_000000.parquet')) "
        f"TO '{KATEGORI_CIKTI}' (FORMAT parquet)"
    )
    print("kategorisiz:", con.execute(
        "SELECT count(*) FROM tr WHERE fsq_category_labels IS NULL OR len(fsq_category_labels) = 0"
    ).fetchone()[0])
    print("il dagilimi (region), ilk 10:")
    for r in con.execute("SELECT region, count(*) c FROM tr GROUP BY 1 ORDER BY c DESC LIMIT 10").fetchall():
        print("  ", r)
    print("ust kategori dagilimi:")
    for r in con.execute(
        "SELECT split_part(fsq_category_labels[1], ' > ', 1) u, count(*) c FROM tr GROUP BY 1 ORDER BY c DESC"
    ).fetchall():
        print("  ", r)
    print("yazildi:", CIKTI)


if __name__ == "__main__":
    main()
