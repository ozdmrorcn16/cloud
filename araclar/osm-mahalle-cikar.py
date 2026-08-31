"""OSM Turkiye kesitinden MAHALLE NOKTALARI ve ILCE POLIGONLARI cikarir.

Kullanicinin istegi (2026-08-31): "Mahalle bilgileri yanlis daha hassas
ve doguru olmali."

NEDEN NOKTA, POLIGON DEGIL: Turkiye'de OSM'de mahalle SINIRI yok -
olculdu, admin_level=10 poligon sayisi SIFIR. Var olan idari poligonlar
il (81), ilce (969) ve belde (1.627) duzeyinde. Mahalleler yalnizca
NOKTA olarak giriliyor: neighbourhood 11.785, suburb 10.852,
quarter 679, village 37.565, hamlet 7.582.

Bu yuzden yontem su: her mekana, KENDI ILCESI icindeki en yakin mahalle
noktasi atanir. Ilce poligonu kisiti onemli - onsuz ilce sinirindaki bir
mekan komsu ilcenin mahallesini alabilir.

Cikti:
  araclar/osm-mahalleler.parquet  - ad, lat, lng, tur (mahalle noktalari)
  araclar/osm-ilceler.parquet     - ad, il, geometri (WKB, ilce poligonlari)
"""
import os
import time

BURASI = os.path.dirname(os.path.abspath(__file__))
os.environ['OSM_CONFIG_FILE'] = os.path.join(BURASI, 'osmconf.ini')

import duckdb  # noqa: E402  (OSM_CONFIG_FILE once ayarlanmali)

PBF = os.path.join(BURASI, 'turkiye-osm.pbf')
MAHALLE_CIKTI = os.path.join(BURASI, 'osm-mahalleler.parquet')
ILCE_CIKTI = os.path.join(BURASI, 'osm-ilceler.parquet')

# Sehir ici mahalle + kirsal yerlesim. 'locality' BILEREK YOK: OSM'de
# mevki/orman/tepe gibi adlandirilmis yerler icin kullaniliyor, mahalle
# degil.
MAHALLE_TURLERI = ('neighbourhood', 'suburb', 'quarter', 'village', 'hamlet', 'town')


def main() -> None:
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    con.execute("SET memory_limit='8GB'")

    t0 = time.time()
    turler = ', '.join(f"'{t}'" for t in MAHALLE_TURLERI)
    con.execute(f"""
      COPY (
        SELECT name AS ad, place AS tur,
               ST_Y(geom) AS lat, ST_X(geom) AS lng
        FROM st_read('{PBF}', layer='points')
        WHERE place IN ({turler}) AND name IS NOT NULL AND trim(name) <> ''
      ) TO '{MAHALLE_CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    adet = con.execute(f"SELECT count(*) FROM read_parquet('{MAHALLE_CIKTI}')").fetchone()[0]
    print(f'mahalle noktasi: {adet:,}  ({time.time() - t0:.0f} sn)', flush=True)

    t1 = time.time()
    con.execute(f"""
      COPY (
        SELECT name AS ad, ST_AsWKB(geom) AS geometri
        FROM st_read('{PBF}', layer='multipolygons')
        WHERE boundary = 'administrative' AND admin_level = '6'
          AND name IS NOT NULL
      ) TO '{ILCE_CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    ilce = con.execute(f"SELECT count(*) FROM read_parquet('{ILCE_CIKTI}')").fetchone()[0]
    print(f'ilce poligonu: {ilce:,}  ({time.time() - t1:.0f} sn)', flush=True)

    print('\nmahalle turu dagilimi:')
    for r in con.execute(
        f"SELECT tur, count(*) FROM read_parquet('{MAHALLE_CIKTI}') GROUP BY 1 ORDER BY 2 DESC"
    ).fetchall():
        print(f'   {r[0]:<16} {r[1]:>7,}')


if __name__ == '__main__':
    main()
