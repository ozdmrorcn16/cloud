"""Mahalleyi MEKANLARIN KENDI ADRES KAYDINDAN cikarir (OSM yerine).

Kullanicinin bildirdigi hata (2026-08-31): Nilufer'deki bir mekan icin
uygulama "Ertugrul" gosteriyordu, oysa orasi ALAADDINBEY mahallesi.

NEDEN OSM YONTEMI BIRAKILDI - olculdu, kok neden nokta/sinir farki:

    Ertugrul     683 m  (OSM suburb)   <- "en yakin nokta" bunu secti
    Alaaddinbey 1415 m  (OSM village)  <- dogrusu buydu

Mahalle merkezine olan uzaklik, o mahallenin ICINDE olup olmadigini
soylemiyor. Yaricapi daraltmak da cozmuyor: 1 km sinirinda Alaaddinbey
busbutun elenir, yanlis olan Ertugrul yine kazanirdi. Apple Haritalar da
ayni hatayi yapiyor (uygulamadaki tam adres satiri "Ertugrul" diyordu).

DOGRU KAYNAK mekanlarin KENDI adres alani:
    "Alaaddinbey Mah. 613.sk no 9 nilufer bursa"
    "Alaaddinbey Mahallesi, Sam3 Plaza B Blok"

Yontem: adresten '<ad> Mahallesi/Mah./Mh.' kalibi cikarilir, ~300 m'lik
hucrede EN SIK ad o hucrenin mahallesi sayilir ve hucredeki butun
mekanlara yayilir. Yayilim sart: adresi olan kayit 2,1 milyon, mahalle
yazani 696 bin; komsuluk olmadan kapsama %11,6'da kalirdi.

Kapsama %80,6. Kalan %19,4'te mahalle BOS birakilir - kullanicinin
karari (2026-08-31): "sadece adres kaydi". Bos kalan yerde ekran ilceyi
gosterir; yanlis mahalle gostermektense ilce gosterilir.

ILCE bu betikten GELMEZ: o `fsq-tr-mahalle-son.parquet` icinde duruyor
ve 969 OSM ilce poligonuna nokta-icinde testiyle atandi - poligon oldugu
icin ilcede boyle bir sorun yok.

Girdi:  araclar/fsq-tr.parquet, araclar/fsq-tr-mahalle-son.parquet
Cikti:  araclar/fsq-mahalle-adres.parquet (fsq_place_id, mahalle, ilce)
"""
import os
import time

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
FSQ = os.path.join(BURASI, 'fsq-tr.parquet')
ILCELI = os.path.join(BURASI, 'fsq-tr-mahalle-son.parquet')
CIKTI = os.path.join(BURASI, 'fsq-mahalle-adres.parquet')

HUCRE = 0.003  # ~300 m

# Adresten mahalle adini yakalayan kalip. Sondaki tembel nicelik (?)
# onemli: adres "X Mahallesi Y Mah." gibi tekrar iceriyorsa ILK adi alir.
KALIP = (
    r"(?i)([A-Za-zÇĞİÖŞÜçğıöşü0-9\.\- ]{3,40}?)\s*"
    r"(?:mahallesi|mahalles|mah\.|mah |mh\.|mh )"
)

# Mahalle adi olmayan, adres metninden sizan kaliplar.
COP = ("no", "sk", "sok", "cad", "cd", "blok", "kat", "daire", "apt",
       "plaza", "sitesi", "site", "merkezi", "bulvari", "bulvar")


def main() -> None:
    con = duckdb.connect()
    con.execute("SET memory_limit='9GB'; SET threads=8;")
    t0 = time.time()

    con.execute(f"""
      CREATE TABLE ham AS
      SELECT fsq_place_id AS pid, address AS adres,
             cast(floor(latitude / {HUCRE}) AS int) AS y,
             cast(floor(longitude / {HUCRE}) AS int) AS x
      FROM read_parquet('{FSQ}')
    """)

    con.execute(f"""
      CREATE TABLE cikan AS
      SELECT pid, y, x, trim(regexp_extract(adres, '{KALIP}', 1)) AS mahalle
      FROM ham
      WHERE adres IS NOT NULL
        AND regexp_matches(lower(adres), '(mahalle|mah\\.|mah |mh\\.|mh )')
    """)
    # Temizlik: cok kisa, sayiyla baslayan ve adres parcasi olan adlar.
    cop_kosul = " AND ".join(f"lower(mahalle) <> '{k}'" for k in COP)
    con.execute(f"""
      CREATE TABLE temiz AS
      SELECT pid, y, x, mahalle FROM cikan
      WHERE mahalle IS NOT NULL
        AND length(mahalle) between 3 and 40
        AND NOT regexp_matches(mahalle, '^[0-9]')
        AND {cop_kosul}
    """)
    print('adresten cikan mahalle:',
          con.execute('SELECT count(*) FROM temiz').fetchone()[0],
          f'({time.time() - t0:.0f} sn)', flush=True)

    # Hucre basina EN SIK ad. Cogunluk ayni zamanda yazim varyasyonlarini
    # da eliyor: "Alaadinbey" ile "Alaaddinbey" ayni hucredeyse yaygin
    # olan kazaniyor.
    con.execute("""
      CREATE TABLE hucre AS
      SELECT y, x, mahalle FROM (
        SELECT y, x, mahalle,
               row_number() OVER (PARTITION BY y, x ORDER BY count(*) DESC, mahalle) AS sira
        FROM temiz GROUP BY y, x, mahalle
      ) WHERE sira = 1
    """)
    print('mahallesi bilinen hucre:',
          con.execute('SELECT count(*) FROM hucre').fetchone()[0], flush=True)

    con.execute(f"""
      COPY (
        SELECT h.pid AS fsq_place_id, c.mahalle, i.ilce
        FROM ham h
        LEFT JOIN hucre c ON c.y = h.y AND c.x = h.x
        LEFT JOIN read_parquet('{ILCELI}') i ON i.fsq_place_id = h.pid
        WHERE c.mahalle IS NOT NULL OR i.ilce IS NOT NULL
      ) TO '{CIKTI}' (FORMAT parquet, COMPRESSION zstd)
    """)
    son = con.execute(f"""
      SELECT count(*), count(mahalle), count(ilce) FROM read_parquet('{CIKTI}')
    """).fetchone()
    print(f'yazildi: {son[0]:,} satir | mahalleli {son[1]:,} | ilceli {son[2]:,}'
          f'  ({time.time() - t0:.0f} sn)', flush=True)


if __name__ == '__main__':
    main()
