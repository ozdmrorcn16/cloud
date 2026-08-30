"""Foursquare kayitlarina ILCE (semt) ve ADRES bilgisini Overture'dan yerelde isler.

Kullanicinin istegi (2026-08-30): "Mekanlarin ilce ve adres bilgisi olsun."

- ILCE: Foursquare'in `locality` alani yarim ve tutarsiz. Kural: kaydin
  bulundugu ~300 m'lik hucredeki (ve yoksa komsu hucrelerdeki) Overture
  kayitlarinin EN SIK semti. Komsular ayni ilcededir, ad eslesmesi
  gerekmez. (Ilk surum "en yakin Overture kaydi" idi; yogun sehirde
  hucre basina yuzlerce komsu pencere fonksiyonunu 600 milyon cifte
  cikarip 3 saatte bitmedi. Hucre modu saniyeler suruyor.)
- ADRES: adresi bos olan kayit, 60 m icinde ADI ESLESEN (jaro-winkler
  >= 0.85) Overture kaydinin adresini alir - ayni mekan oldugu icin.
  Hucre 0,001 derece (~100 m), 3x3 komsuluk.

Girdi:  araclar/fsq-tr.parquet, araclar/overture-tr.parquet
Cikti:  araclar/fsq-tr-semtli.parquet - yalnizca semt ya da adresi DEGISEN
        satirlar, tam haliyle (locality/address sutunlari doldurulmus).
        Yukleyiciye FSQ_PARQUET ile verilir.
"""
import os
import shutil
import time

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
FSQ = os.path.join(BURASI, 'fsq-tr.parquet')
OVERTURE = os.path.join(BURASI, 'overture-tr.parquet')
CIKTI = os.path.join(BURASI, 'fsq-tr-sadece-semt.parquet' if os.environ.get('SADECE_SEMT') == '1' else 'fsq-tr-semtli.parquet')
TEMP = os.path.join(BURASI, '_duck_tmp')

HUCRE_SEMT = 0.003   # ~300 m
# SADECE_SEMT=1: adres eslestirmesi (pahali) atlanir, yalnizca ilce.
SADECE_SEMT = os.environ.get('SADECE_SEMT') == '1'
# 81 il: locality'de il adi varsa semt SAYILMAZ (yukleyiciyle ayni liste).
ILLER = [
    'adana', 'adıyaman', 'afyonkarahisar', 'afyon', 'ağrı', 'amasya', 'ankara', 'antalya',
    'artvin', 'aydın', 'balıkesir', 'bilecik', 'bingöl', 'bitlis', 'bolu', 'burdur', 'bursa',
    'çanakkale', 'çankırı', 'çorum', 'denizli', 'diyarbakır', 'edirne', 'elazığ', 'erzincan',
    'erzurum', 'eskişehir', 'gaziantep', 'giresun', 'gümüşhane', 'hakkari', 'hakkâri', 'hatay',
    'isparta', 'mersin', 'içel', 'istanbul', 'i̇stanbul', 'izmir', 'i̇zmir', 'kars', 'kastamonu',
    'kayseri', 'kırklareli', 'kırşehir', 'kocaeli', 'konya', 'kütahya', 'malatya', 'manisa',
    'kahramanmaraş', 'mardin', 'muğla', 'muş', 'nevşehir', 'niğde', 'ordu', 'rize', 'sakarya',
    'samsun', 'siirt', 'sinop', 'sivas', 'tekirdağ', 'tokat', 'trabzon', 'tunceli', 'şanlıurfa',
    'uşak', 'van', 'yozgat', 'zonguldak', 'aksaray', 'bayburt', 'karaman', 'kırıkkale', 'batman',
    'şırnak', 'bartın', 'ardahan', 'iğdır', 'yalova', 'karabük', 'kilis', 'osmaniye', 'düzce',
    'türkiye', 'turkey',
]
HUCRE_ADRES = 0.001  # ~100 m


def main() -> None:
    shutil.rmtree(TEMP, ignore_errors=True)
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial; SET threads=8;")
    con.execute(f"SET memory_limit='9GB'; SET temp_directory='{TEMP}';")
    con.execute("CREATE TABLE iller (il VARCHAR)")
    con.executemany("INSERT INTO iller VALUES (?)", [[i] for i in ILLER])
    con.execute("CREATE MACRO trk(x) AS lower(translate(coalesce(x,''), 'İIŞĞÜÖÇÂÎÛışğüöçâîû', 'IISGUOCAIUisguocaiu'))")
    t0 = time.time()

    con.execute(f"""
      CREATE TABLE ov AS
      SELECT ad, semt, adres, lat, lng,
             cast(floor(lat / {HUCRE_SEMT}) AS int) AS sy, cast(floor(lng / {HUCRE_SEMT}) AS int) AS sx,
             cast(floor(lat / {HUCRE_ADRES}) AS int) AS ay, cast(floor(lng / {HUCRE_ADRES}) AS int) AS ax
      FROM read_parquet('{OVERTURE}')
    """)
    con.execute(f"""
      CREATE TABLE fs AS
      SELECT fsq_place_id, name, latitude AS lat, longitude AS lng,
             (locality IS NULL OR trim(locality) = ''
              OR (region IS NOT NULL AND lower(trim(locality)) = lower(trim(region)))
              OR lower(trim(locality)) IN (SELECT il FROM iller)) AS semt_yok,
             (address IS NULL OR trim(address) = '') AS adres_yok,
             cast(floor(latitude / {HUCRE_SEMT}) AS int) AS sy, cast(floor(longitude / {HUCRE_SEMT}) AS int) AS sx,
             cast(floor(latitude / {HUCRE_ADRES}) AS int) AS ay, cast(floor(longitude / {HUCRE_ADRES}) AS int) AS ax
      FROM read_parquet('{FSQ}')
    """)
    print('Overture:', con.execute('SELECT count(*) FROM ov').fetchone()[0],
          '| Foursquare:', con.execute('SELECT count(*) FROM fs').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    # --- ILCE: hucre basina en sik Overture semti ---
    con.execute("""
      CREATE TABLE hucre_semt AS
      SELECT sy, sx, semt FROM (
        SELECT sy, sx, semt, count(*) c,
               row_number() OVER (PARTITION BY sy, sx ORDER BY count(*) DESC) sira
        FROM ov WHERE semt IS NOT NULL AND trim(semt) <> ''
        GROUP BY sy, sx, semt
      ) WHERE sira = 1
    """)
    con.execute("""
      CREATE TABLE semtler AS
      SELECT f.fsq_place_id, h.semt
      FROM fs f JOIN hucre_semt h ON h.sy = f.sy AND h.sx = f.sx
      WHERE f.semt_yok
    """)
    con.execute("""
      INSERT INTO semtler
      SELECT fsq_place_id, semt FROM (
        SELECT f.fsq_place_id, h.semt,
               row_number() OVER (PARTITION BY f.fsq_place_id ORDER BY count(*) DESC) sira
        FROM fs f
        JOIN hucre_semt h ON h.sy BETWEEN f.sy - 1 AND f.sy + 1 AND h.sx BETWEEN f.sx - 1 AND f.sx + 1
        WHERE f.semt_yok AND NOT EXISTS (SELECT 1 FROM semtler s WHERE s.fsq_place_id = f.fsq_place_id)
        GROUP BY f.fsq_place_id, h.semt
      ) WHERE sira = 1
    """)
    print('semt bulunan:', con.execute('SELECT count(*) FROM semtler').fetchone()[0], f'({time.time() - t0:.0f} sn)', flush=True)

    # --- ADRES: 60 m icinde adi eslesen Overture ---
    if SADECE_SEMT:
        con.execute("CREATE TABLE adresler (fsq_place_id VARCHAR, adres VARCHAR)")
    else:
      con.execute("""
      CREATE TABLE adresler AS
      SELECT fsq_place_id, adres FROM (
        SELECT f.fsq_place_id, o.adres,
               jaro_winkler_similarity(trk(f.name), trk(o.ad)) AS b,
               row_number() OVER (PARTITION BY f.fsq_place_id
                 ORDER BY jaro_winkler_similarity(trk(f.name), trk(o.ad)) DESC) AS sira
        FROM fs f
        JOIN ov o ON o.ay BETWEEN f.ay - 1 AND f.ay + 1 AND o.ax BETWEEN f.ax - 1 AND f.ax + 1
         AND abs(o.lat - f.lat) < 0.0006 AND abs(o.lng - f.lng) < 0.0008
        WHERE f.adres_yok AND o.adres IS NOT NULL AND trim(o.adres) <> ''
          AND ST_Distance_Sphere(ST_Point(f.lng, f.lat), ST_Point(o.lng, o.lat)) <= 60
      ) WHERE sira = 1 AND b >= 0.85
    """)
    print('adres bulunan:', con.execute('SELECT count(*) FROM adresler').fetchone()[0], f'({time.time() - t0:.0f} sn)', flush=True)

    con.execute("""
      CREATE TABLE sonuc AS
      SELECT coalesce(s.fsq_place_id, a.fsq_place_id) AS fsq_place_id, s.semt, a.adres
      FROM semtler s FULL OUTER JOIN adresler a USING (fsq_place_id)
    """)
    con.execute(f"""
      COPY (
        SELECT t.* REPLACE (coalesce(s.semt, t.locality) AS locality, coalesce(s.adres, t.address) AS address)
        FROM read_parquet('{FSQ}') t JOIN sonuc s USING (fsq_place_id)
      ) TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    print('degisen satir:', con.execute('SELECT count(*) FROM sonuc').fetchone()[0], f'({time.time() - t0:.0f} sn)', flush=True)
    for r in con.execute('SELECT semt, count(*) c FROM semtler GROUP BY 1 ORDER BY c DESC LIMIT 10').fetchall():
        print('  ', r)
    shutil.rmtree(TEMP, ignore_errors=True)


if __name__ == '__main__':
    main()
