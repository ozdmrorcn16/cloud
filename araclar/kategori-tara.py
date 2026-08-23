"""Overture'daki GERCEK kategori dagilimini cikarir.

Neden gerekli: mevcut yerel parquet zaten eslenmis `tur` sutununu
tasiyor, orijinal Overture kategorisi indirme sirasinda atilmis. Bu
yuzden "Park Apt neden park sayilmis" sorusu bugunku veriden
cevaplanamiyor.

Bu betik hicbir sey yazmaz, yalnizca sayar: hangi kategori kac kez
geciyor. Cikti, tur setini genisletirken hangi kategorilerin gercekten
hacimli oldugunu gormek icin kullanilir.
"""

import sys

import duckdb

XMIN, XMAX = 25.5, 44.9
YMIN, YMAX = 35.7, 42.3
GUVEN_ESIGI = 0.5


def en_yeni_release(con):
    """mekan-yukle-overture.py ile AYNI yontem: bugunden geriye dogru
    aylik yayin adaylarini yoklar, ilk bulunani doner. glob ile dizin
    listelemek calismiyor (bos donuyor)."""
    import os
    from datetime import date, timedelta

    zorla = os.environ.get("OVERTURE_RELEASE")
    if zorla:
        return zorla
    bugun = date.today()
    for geri in range(0, 75):
        aday = (bugun - timedelta(days=geri)).isoformat() + ".0"
        try:
            con.execute(
                "select 1 from read_parquet('s3://overturemaps-us-west-2/"
                f"release/{aday}/theme=places/type=place/*.parquet') limit 1"
            ).fetchone()
            return aday
        except Exception:
            continue
    raise RuntimeError('Overture yayini bulunamadi')


def main():
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")

    release = en_yeni_release(con)
    yol = (
        f"s3://overturemaps-us-west-2/release/{release}"
        "/theme=places/type=place/*.parquet"
    )
    print(f"Overture {release} taraniyor...", flush=True)

    sonuc = con.execute(f"""
        SELECT categories.primary AS kategori, count(*) AS adet
          FROM read_parquet('{yol}')
         WHERE bbox.xmin >= {XMIN} AND bbox.xmax <= {XMAX}
           AND bbox.ymin >= {YMIN} AND bbox.ymax <= {YMAX}
           AND names.primary IS NOT NULL
           AND confidence >= {GUVEN_ESIGI}
           AND categories.primary IS NOT NULL
         GROUP BY 1
         ORDER BY 2 DESC
         LIMIT 200
    """).fetchall()

    print(f"\n{len(sonuc)} kategori (ilk 200):\n", flush=True)
    for kategori, adet in sonuc:
        print(f"{adet:>8}  {kategori}")


if __name__ == '__main__':
    sys.exit(main())
