"""Her mekana MAHALLE ve dogru ILCE atar (OSM verisiyle, yerelde).

Kullanicinin istegi (2026-08-31): "Mahalle bilgileri yanlis daha hassas
ve dogru olmali."

YONTEM ve NEDENI:
  1. ILCE: mekan noktasi 969 OSM ilce poligonundan hangisinin icindeyse
     o. Bu KESIN bir atamadir - onceki `semt` degeri Overture komsulugu
     uzerinden CIKARILMISTI ve hatali ornekleri vardi (bir Nilufer
     mekaninda 'Osmangazi', 'Burda', 'Nilufer, Bursa' gibi).
  2. MAHALLE: mekanla AYNI ILCEDEKI en yakin mahalle noktasi. Turkiye'de
     OSM'de mahalle SINIRI yok (admin_level=10 sayisi sifir), yalnizca
     nokta var; bu yuzden "en yakin merkez" yaklasimi kullaniliyor.
     Ilce kisiti onemli: onsuz sinirdaki mekan komsu ilcenin mahallesini
     alabiliyor.
     Olculdu: mekanlarin %99,1'inin 2 km icinde bir mahalle noktasi var,
     ortanca uzaklik 360 m.
  3. UZAK NOKTA ATANMAZ: en yakin mahalle 3 km'den uzaksa mahalle bos
     birakilir. Kirsalda tek bir koy noktasi kilometrelerce oteye
     yanlis atanmasin diye.

Girdi:  araclar/fsq-tr.parquet, osm-mahalleler.parquet, osm-ilceler.parquet
Cikti:  araclar/fsq-tr-mahalleli.parquet - fsq_place_id, mahalle, ilce
"""
import os
import time

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
FSQ = os.path.join(BURASI, 'fsq-tr.parquet')
MAHALLELER = os.path.join(BURASI, 'osm-mahalleler.parquet')
ILCELER = os.path.join(BURASI, 'osm-ilceler.parquet')
CIKTI = os.path.join(BURASI, 'fsq-tr-mahalleli.parquet')
TEMP = os.path.join(BURASI, '_duck_tmp_mahalle')

HUCRE = 0.02          # ~2 km; mahalle aramasi bu izgarada yapiliyor
EN_UZAK_MAHALLE = 3000  # metre


def main() -> None:
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    con.execute(f"SET memory_limit='9GB'; SET temp_directory='{TEMP}'; SET threads=8;")
    t0 = time.time()

    con.execute(f"""
      CREATE TABLE ilce AS
      SELECT ad, ST_GeomFromWKB(geometri) AS g FROM read_parquet('{ILCELER}')
    """)
    con.execute("CREATE TABLE ilce_kutu AS SELECT ad, g, ST_Extent(g) AS kutu FROM ilce")
    print('ilce:', con.execute('SELECT count(*) FROM ilce').fetchone()[0], flush=True)

    # --- mekanlar -> ilce ---
    con.execute(f"""
      CREATE TABLE mekan AS
      SELECT fsq_place_id AS pid, latitude AS lat, longitude AS lng,
             ST_Point(longitude, latitude) AS nokta
      FROM read_parquet('{FSQ}')
    """)
    con.execute("""
      CREATE TABLE mekan_ilce AS
      SELECT m.pid, m.lat, m.lng, i.ad AS ilce
      FROM mekan m JOIN ilce_kutu i
        ON ST_Within(m.nokta, i.g)
    """)
    n = con.execute('SELECT count(*) FROM mekan_ilce').fetchone()[0]
    print(f'ilcesi bulunan mekan: {n:,}  ({time.time() - t0:.0f} sn)', flush=True)

    # --- mahalle noktalari -> ilce ---
    con.execute(f"""
      CREATE TABLE mahalle AS
      SELECT ad, lat, lng, ST_Point(lng, lat) AS nokta FROM read_parquet('{MAHALLELER}')
    """)
    con.execute("""
      CREATE TABLE mahalle_ilce AS
      SELECT h.ad, h.lat, h.lng, i.ad AS ilce,
             cast(floor(h.lat / 0.02) AS int) AS y, cast(floor(h.lng / 0.02) AS int) AS x
      FROM mahalle h JOIN ilce_kutu i ON ST_Within(h.nokta, i.g)
    """)
    print('ilcesi bulunan mahalle noktasi:',
          con.execute('SELECT count(*) FROM mahalle_ilce').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    # --- her mekana AYNI ILCEDEKI en yakin mahalle ---
    con.execute(f"""
      CREATE TABLE sonuc AS
      SELECT pid, ilce, mahalle FROM (
        SELECT m.pid, m.ilce, h.ad AS mahalle,
               row_number() OVER (
                 PARTITION BY m.pid
                 ORDER BY ST_Distance_Sphere(ST_Point(m.lng, m.lat), ST_Point(h.lng, h.lat))
               ) AS sira
        FROM (SELECT *, cast(floor(lat / {HUCRE}) AS int) AS y,
                     cast(floor(lng / {HUCRE}) AS int) AS x FROM mekan_ilce) m
        JOIN mahalle_ilce h
          ON h.ilce = m.ilce
         AND h.y BETWEEN m.y - 1 AND m.y + 1
         AND h.x BETWEEN m.x - 1 AND m.x + 1
         AND ST_Distance_Sphere(ST_Point(m.lng, m.lat), ST_Point(h.lng, h.lat)) <= {EN_UZAK_MAHALLE}
      ) WHERE sira = 1
    """)
    print('mahallesi bulunan:', con.execute('SELECT count(*) FROM sonuc').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    # Ilcesi olup mahallesi bulunamayanlar da ciktiya girsin: ilceleri
    # yine de duzeltilecek.
    con.execute(f"""
      COPY (
        SELECT m.pid AS fsq_place_id, s.mahalle, m.ilce
        FROM mekan_ilce m LEFT JOIN sonuc s USING (pid)
      ) TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    print(f'yazildi: {CIKTI}  ({time.time() - t0:.0f} sn)', flush=True)
    for r in con.execute(f"""
        SELECT mahalle, count(*) c FROM read_parquet('{CIKTI}')
        WHERE mahalle IS NOT NULL GROUP BY 1 ORDER BY c DESC LIMIT 8
    """).fetchall():
        print('  ', r)


if __name__ == '__main__':
    main()
