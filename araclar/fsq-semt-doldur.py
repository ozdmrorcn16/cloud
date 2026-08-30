"""Foursquare kayitlarina ILCE (semt) ve ADRES bilgisini Overture'dan yerelde isler.

Kullanicinin istegi (2026-08-30): "Mekanlarin ilce ve adres bilgisi olsun."
- ILCE: semt'i bos olan kayit, 300 m icindeki EN YAKIN Overture kaydinin
  semtini alir (komsular ayni ilcededir).
- ADRES: adresi bos olan kayit, 60 m icinde ADI ESLESEN (jaro-winkler
  >= 0.85) Overture kaydinin adresini alir - ayni mekan oldugu icin.

Foursquare'de ilce alani (`locality`) yarim ve tutarsiz; Overture'in
`semt` alani ise dolu ve duzgun. Kural: semt'i bos olan her Foursquare
kaydi, 300 m icindeki EN YAKIN Overture kaydinin semtini alir - komsular
ayni ilcededir, ad eslesmesi gerekmez.

Sunucuda yapilmadi: 6 milyon satirlik KNN guncellemesi PostgREST
zaman asimlarina takildi (2026-08-30). DuckDB'de izgara anahtariyla
komsu hucre join'i dakikalar suruyor.

Girdi:  araclar/fsq-tr.parquet, araclar/overture-tr.parquet
Cikti:  araclar/fsq-tr-semtli.parquet - yalnizca semt'i DEGISEN satirlar,
        tam haliyle (locality sutununa Overture semti yazilmis). Yukleyiciye
        FSQ_PARQUET ile verilir; yukleyicinin _semt kurali il adiyla ayni
        olmayan locality'yi semt olarak alir.
"""
import os
import time

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
FSQ = os.path.join(BURASI, 'fsq-tr.parquet')
OVERTURE = os.path.join(BURASI, 'overture-tr.parquet')
CIKTI = os.path.join(BURASI, 'fsq-tr-semtli.parquet')

# Hucre boyu ~0.003 derece (~300 m); komsu 3x3 hucre taranir.
HUCRE = 0.003


def main() -> None:
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial; SET threads=8;")
    # Bellek: adres join'i 14 GB'a cikip makineyi zorladi; diske tasma acik.
    con.execute(f"SET memory_limit='9GB'; SET temp_directory='{os.path.join(BURASI, '_duck_tmp')}';")
    t0 = time.time()
    con.execute(f"""
      CREATE TABLE ov AS
      SELECT ad, semt, adres, lat, lng,
             cast(floor(lat / {HUCRE}) AS int) AS gy, cast(floor(lng / {HUCRE}) AS int) AS gx
      FROM read_parquet('{OVERTURE}')
    """)
    print('Overture:', con.execute('SELECT count(*) FROM ov').fetchone()[0])

    # Foursquare'in kendi semt kurali (yukleyiciyle ayni): il adiyla ayni
    # olan locality semt sayilmaz.
    con.execute(f"""
      CREATE TABLE fs AS
      SELECT fsq_place_id, name, latitude AS lat, longitude AS lng,
             (locality IS NULL OR trim(locality) = ''
              OR (region IS NOT NULL AND lower(trim(locality)) = lower(trim(region)))) AS semt_yok,
             (address IS NULL OR trim(address) = '') AS adres_yok,
             cast(floor(latitude / {HUCRE}) AS int) AS gy, cast(floor(longitude / {HUCRE}) AS int) AS gx
      FROM read_parquet('{FSQ}')
      WHERE locality IS NULL OR trim(locality) = ''
         OR (region IS NOT NULL AND lower(trim(locality)) = lower(trim(region)))
         OR address IS NULL OR trim(address) = ''
    """)
    print('semt/adres bekleyen Foursquare:', con.execute('SELECT count(*) FROM fs').fetchone()[0])
    con.execute("CREATE MACRO trk(x) AS lower(translate(coalesce(x,''), 'İIŞĞÜÖÇÂÎÛışğüöçâîû', 'IISGUOCAIUisguocaiu'))")

    # ILCE: en yakin Overture komsusu (300 m), semt dolu olan.
    con.execute(f"""
      CREATE TABLE semtler AS
      SELECT fsq_place_id, semt FROM (
        SELECT f.fsq_place_id, o.semt,
               row_number() OVER (PARTITION BY f.fsq_place_id
                 ORDER BY ST_Distance_Sphere(ST_Point(f.lng, f.lat), ST_Point(o.lng, o.lat))) AS sira,
               ST_Distance_Sphere(ST_Point(f.lng, f.lat), ST_Point(o.lng, o.lat)) AS m
        FROM fs f
        JOIN ov o ON o.gy BETWEEN f.gy - 1 AND f.gy + 1 AND o.gx BETWEEN f.gx - 1 AND f.gx + 1
        WHERE f.semt_yok AND o.semt IS NOT NULL AND trim(o.semt) <> ''
      ) WHERE sira = 1 AND m <= 300
    """)
    # ADRES: 60 m icinde ADI ESLESEN Overture kaydi (ayni mekan).
    con.execute(f"""
      CREATE TABLE adresler AS
      SELECT fsq_place_id, adres FROM (
        SELECT f.fsq_place_id, o.adres,
               jaro_winkler_similarity(trk(f.name), trk(o.ad)) AS b,
               row_number() OVER (PARTITION BY f.fsq_place_id
                 ORDER BY jaro_winkler_similarity(trk(f.name), trk(o.ad)) DESC) AS sira
        FROM fs f
        JOIN ov o ON o.gy BETWEEN f.gy - 1 AND f.gy + 1 AND o.gx BETWEEN f.gx - 1 AND f.gx + 1
         AND abs(o.lat - f.lat) < 0.0006 AND abs(o.lng - f.lng) < 0.0008
        WHERE f.adres_yok AND o.adres IS NOT NULL AND trim(o.adres) <> ''
          AND ST_Distance_Sphere(ST_Point(f.lng, f.lat), ST_Point(o.lng, o.lat)) <= 60
      ) WHERE sira = 1 AND b >= 0.85
    """)
    con.execute("""
      CREATE TABLE sonuc AS
      SELECT coalesce(s.fsq_place_id, a.fsq_place_id) AS fsq_place_id, s.semt, a.adres
      FROM semtler s FULL OUTER JOIN adresler a USING (fsq_place_id)
    """)
    n = con.execute('SELECT count(*) FROM sonuc').fetchone()[0]
    print(f'degisen satir: {n:,}  semt: {con.execute("SELECT count(*) FROM semtler").fetchone()[0]:,}  adres: {con.execute("SELECT count(*) FROM adresler").fetchone()[0]:,}  ({time.time() - t0:.0f} sn)')
    # Yukleyici tam satir ister (upsert NOT NULL sutunlari denetler);
    # degisen satirlar tam haliyle, semt'i Overture'dan alinmis olarak yazilir.
    con.execute(f"""
      COPY (
        SELECT t.* REPLACE (coalesce(s.semt, t.locality) AS locality, coalesce(s.adres, t.address) AS address)
        FROM read_parquet('{FSQ}') t JOIN sonuc s USING (fsq_place_id)
      ) TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    for r in con.execute('SELECT semt, count(*) c FROM semtler GROUP BY 1 ORDER BY c DESC LIMIT 10').fetchall():
        print('  ', r)


if __name__ == '__main__':
    main()
