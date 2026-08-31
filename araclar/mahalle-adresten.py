"""Mahalle YALNIZCA mekanin kendi adres kaydindan; yoksa ilce + il.

Kullanicinin karari (2026-08-31):

    "Sadece doğru veriler adresler işlenecek, adresi olana adresi,
     adresi olmayana ilçe il yazılacak."
    "Tahmini koordinatla ya da veri işlenmeyecek."

Bu yuzden burada TAHMIN YOK:
- Mahalle, YALNIZCA o kaydin kendi `address` alaninda yaziyorsa alinir.
- Komsuluktan yayma YAPILMAZ. Onceki surumde ~300 m'lik hucrede en sik
  gecen mahalle o hucredeki diger mekanlara da yaziliyordu; kapsamayi
  %11,6'dan %80,3'e cikariyordu ama kullanici bunu "uydurma veri"
  saydigi icin KALDIRILDI.
- Mahallesi olmayan kayitta ekran ILCE + IL gosterir. Ikisi de nokta-
  icinde poligon testiyle atanir, yani onlar da tahmin degil.

ONCEKI YONTEM NEDEN BIRAKILDI (tarihsel, tekrar denenmesin): mahalle
OSM'in yerlesim NOKTALARINDAN, "ayni ilcedeki en yakin merkez" kuralıyla
atanmisti. Kullanici somut hata gosterdi - bir mekan "Ertugrul"
gorunuyordu, dogrusu ALAADDINBEY:

    Ertugrul     683 m   <- en yakin nokta
    Alaaddinbey 1415 m   <- dogrusu

Mahalle merkezine uzaklik, o mahallenin ICINDE olup olmadigini
soylemiyor; yaricap daraltmak da cozmuyor (1 km sinirinda dogru olan
busbutun elenirdi). Apple Haritalar da ayni hatayi yapiyor.

Girdi:  fsq-tr.parquet, osm-ilceler.parquet, osm-iller.parquet
Cikti:  fsq-mahalle-adres.parquet (fsq_place_id, mahalle, ilce, il)
"""
import os
import time

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
FSQ = os.path.join(BURASI, 'fsq-tr.parquet')
ILCELER = os.path.join(BURASI, 'osm-ilceler.parquet')
ILLER = os.path.join(BURASI, 'osm-iller.parquet')
CIKTI = os.path.join(BURASI, 'fsq-mahalle-adres.parquet')

# Adresten mahalle adini yakalayan kalip. Sondaki tembel nicelik onemli:
# adres birden fazla "Mah." iceriyorsa ILK adi alinir.
KALIP = (
    r"(?i)([A-Za-zÇĞİÖŞÜçğıöşü0-9\.\- ]{3,40}?)\s*"
    r"(?:mahallesi|mahalles|mah\.|mah |mh\.|mh )"
)

# Mahalle adi olmayan, adres metninden sizan kelimeler.
COP = ("no", "sk", "sok", "cad", "cd", "blok", "kat", "daire", "apt",
       "plaza", "sitesi", "site", "merkezi", "bulvari", "bulvar")


def main() -> None:
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    con.execute("SET memory_limit='9GB'; SET threads=8;")
    t0 = time.time()

    con.execute(f"""
      CREATE TABLE ham AS
      SELECT fsq_place_id AS pid, address AS adres,
             ST_Point(longitude, latitude) AS nokta
      FROM read_parquet('{FSQ}')
    """)

    # --- MAHALLE: yalnizca kendi adresinden ---
    cop_kosul = " AND ".join(f"lower(mahalle) <> '{k}'" for k in COP)
    con.execute(f"""
      CREATE TABLE mahalle AS
      SELECT pid, mahalle FROM (
        SELECT pid, trim(regexp_extract(adres, '{KALIP}', 1)) AS mahalle
        FROM ham
        WHERE adres IS NOT NULL
          AND regexp_matches(lower(adres), '(mahalle|mah\\.|mah |mh\\.|mh )')
      )
      WHERE mahalle IS NOT NULL
        AND length(mahalle) between 3 and 40
        AND NOT regexp_matches(mahalle, '^[0-9]')
        AND {cop_kosul}
    """)
    print('kendi adresinde mahalle yazan:',
          con.execute('SELECT count(*) FROM mahalle').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    # --- ILCE ve IL: nokta-icinde poligon testi (tahmin degil) ---
    con.execute(f"""
      CREATE TABLE ilce AS
      SELECT h.pid, i.ad AS ilce
      FROM ham h JOIN (
        SELECT ad, ST_GeomFromWKB(geometri) AS g FROM read_parquet('{ILCELER}')
      ) i ON ST_Within(h.nokta, i.g)
    """)
    print('ilcesi bulunan:', con.execute('SELECT count(*) FROM ilce').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    con.execute(f"""
      CREATE TABLE il AS
      SELECT h.pid, i.ad AS il
      FROM ham h JOIN (
        SELECT ad, ST_GeomFromWKB(geometri) AS g FROM read_parquet('{ILLER}')
      ) i ON ST_Within(h.nokta, i.g)
    """)
    print('ili bulunan:', con.execute('SELECT count(*) FROM il').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    con.execute(f"""
      COPY (
        SELECT h.pid AS fsq_place_id, m.mahalle, c.ilce, l.il
        FROM ham h
        LEFT JOIN mahalle m ON m.pid = h.pid
        LEFT JOIN ilce c ON c.pid = h.pid
        LEFT JOIN il l ON l.pid = h.pid
        WHERE m.mahalle IS NOT NULL OR c.ilce IS NOT NULL OR l.il IS NOT NULL
      ) TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    s = con.execute(f"""
      SELECT count(*), count(mahalle), count(ilce), count(il)
      FROM read_parquet('{CIKTI}')
    """).fetchone()
    print(f'yazildi: {s[0]:,} satir | mahalle {s[1]:,} | ilce {s[2]:,} | il {s[3]:,}'
          f'  ({time.time() - t0:.0f} sn)', flush=True)


if __name__ == '__main__':
    main()
