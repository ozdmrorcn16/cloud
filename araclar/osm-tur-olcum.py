"""OSM'DE YAZILI TUR OLCUMU (2026-09-20, kullanicinin istegi "Olc").

Soru: Foursquare kaynakli mekanlarimizin kaci OpenStreetMap'te bir POI ile
eslesiyor ve o POI'de KAYNAGA GERCEKTEN YAZILMIS bir tur (amenity/shop/
cuisine/leisure/tourism) var? Tahmin degil, olcum. Kapsam: Bursa
(acilis sehri). Veriye DOKUNMAZ - yalnizca okur ve rapor yazar.

Adimlar:
  1. Bursa mekanlari YEREL ham Foursquare dosyasindan (fsq-tr.parquet);
     tur = FSQ kategori yaprak etiketi. Onbellek: olcum-bursa-mekanlar.parquet
  2. turkiye-osm.pbf -> Bursa kutusu icindeki turlu POI'ler (nokta +
     alan merkezleri), duckdb spatial. Onbellek: olcum-bursa-osm.parquet
  3. Eslestirme: 40 m icinde + ad benzerligi (normalize edilmis, jaro-
     winkler >= 0.85 ya da bir adin digerini icermesi).
  4. Rapor: eslesme orani, turlu eslesme orani, OSM turu ile bizim tur
     ne kadar tutuyor (kaba esleme), ornekler.

Kosum: python araclar/osm-tur-olcum.py   (tamamen yerel, sunucuya gitmez)
"""
import os
import struct
import sys
import time
import unicodedata

BURASI = os.path.dirname(os.path.abspath(__file__))
os.environ['OSM_CONFIG_FILE'] = os.path.join(BURASI, 'osmconf.ini')
import duckdb  # noqa: E402

PBF = os.path.join(BURASI, 'turkiye-osm.pbf')
MEKAN_PQ = os.path.join(BURASI, 'olcum-bursa-mekanlar.parquet')
OSM_PQ = os.path.join(BURASI, 'olcum-bursa-osm.parquet')
# Bursa ili kaba kutusu (lng, lat)
KUTU = (28.0, 39.6, 30.1, 40.7)


def env_yukle():
    yol = os.path.join(BURASI, '..', 'mobil', '.env')
    for satir in open(yol, encoding='utf-8'):
        satir = satir.strip()
        if satir and not satir.startswith('#') and '=' in satir:
            k, v = satir.split('=', 1)
            os.environ.setdefault(k, v.strip().strip('"'))


def ewkb_nokta(hexs: str):
    b = bytes.fromhex(hexs)
    # 01 (LE) + tip 4 bayt (0x20000001 = point + SRID) + SRID 4 bayt + x + y
    x, y = struct.unpack('<dd', b[9:25])
    return x, y


def mekanlari_indir():
    """Bursa mekanlari YEREL ham Foursquare dosyasindan (fsq-tr.parquet +
    fsq-konum-son.parquet il sutunu). Sunucuya gidilmiyor: PostgREST'te
    `il='Bursa' order by id` 8 sn sinirinda zaman asimina dustu (212 bin
    satirin sirasi). Tur = Foursquare kategori yaprak etiketi - bizim
    `mekanlar.tur` zaten bundan turetilmisti (fsq-kategori-eslemesi.py)."""
    if os.path.exists(MEKAN_PQ):
        return
    con = duckdb.connect()
    con.execute(f"""
      copy (
        select f.fsq_place_id id, f.name ad,
          case when len(f.fsq_category_labels) > 0
               then regexp_extract(f.fsq_category_labels[1], '([^>]+)$', 1) end tur,
          'foursquare' kaynak, f.longitude lng, f.latitude lat
        from '{os.path.join(BURASI, 'fsq-tr.parquet')}' f
        join '{os.path.join(BURASI, 'fsq-konum-son.parquet')}' k using (fsq_place_id)
        where k.il = 'Bursa' and f.name is not null
      ) to '{MEKAN_PQ}' (format parquet)
    """)
    print('mekanlar:', con.execute(f"select count(*) from '{MEKAN_PQ}'").fetchone()[0], '->', MEKAN_PQ)


def osm_cikar():
    if os.path.exists(OSM_PQ):
        return
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    x0, y0, x1, y1 = KUTU
    # points katmani: amenity/shop gibi etiketler other_tags icinde (hstore
    # metni). Alanlar (multipolygons) icin merkez alinir - kafe/AVM binasi
    # cizilmis olabilir.
    con.execute(f"""
      create table osm as
      with p as (
        select name, other_tags, ST_X(geom) lng, ST_Y(geom) lat
        from st_read('{PBF}', layer='points', open_options=['INTERLEAVED_READING=YES'])
        where name is not null
      ), a as (
        select name, other_tags, ST_X(ST_Centroid(geom)) lng, ST_Y(ST_Centroid(geom)) lat
        from st_read('{PBF}', layer='multipolygons', open_options=['INTERLEAVED_READING=YES'])
        where name is not null
      ), hepsi as (select * from p union all select * from a)
      select name, lng, lat,
        regexp_extract(other_tags, '"amenity"=>"([^"]+)"', 1) amenity,
        regexp_extract(other_tags, '"shop"=>"([^"]+)"', 1) shop,
        regexp_extract(other_tags, '"cuisine"=>"([^"]+)"', 1) cuisine,
        regexp_extract(other_tags, '"leisure"=>"([^"]+)"', 1) leisure,
        regexp_extract(other_tags, '"tourism"=>"([^"]+)"', 1) tourism
      from hepsi
      where lng between {x0} and {x1} and lat between {y0} and {y1}
    """)
    con.execute(f"copy osm to '{OSM_PQ}' (format parquet)")
    n = con.execute('select count(*), count(*) filter (where amenity<>\'\' or shop<>\'\' or leisure<>\'\' or tourism<>\'\') from osm').fetchone()
    print(f'osm bursa: {n[0]} adli poi, {n[1]} turlu -> {OSM_PQ}')


def normalize(s: str) -> str:
    s = (s or '').lower().replace('ı', 'i')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in s).split())


def rapor():
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    con.create_function('norm', normalize, ['VARCHAR'], 'VARCHAR')
    con.execute(f"create table m as select *, norm(ad) nad from '{MEKAN_PQ}' where kaynak is distinct from 'kullanici'")
    con.execute(f"create table o as select *, norm(name) nad, coalesce(nullif(amenity,''), nullif(shop,''), nullif(leisure,''), nullif(tourism,'')) osm_tur from '{OSM_PQ}'")
    toplam = con.execute('select count(*) from m').fetchone()[0]
    turlu_biz = con.execute("select count(*) from m where tur is not null and tur<>'yer-degil'").fetchone()[0]
    # 40 m icinde aday ciftler (kaba derece kutusu, sonra haversine)
    con.execute("""
      create table aday as
      select m.id, m.ad, m.tur, m.nad, o.name oname, o.nad onad, o.osm_tur, o.cuisine,
        ST_Distance_Sphere(ST_Point(m.lng, m.lat), ST_Point(o.lng, o.lat)) mesafe
      from m join o on abs(m.lat-o.lat) < 0.0005 and abs(m.lng-o.lng) < 0.0007
      where ST_Distance_Sphere(ST_Point(m.lng, m.lat), ST_Point(o.lng, o.lat)) <= 40
    """)
    con.execute("""
      create table esles as
      select *, jaro_winkler_similarity(nad, onad) benzerlik from aday
      where jaro_winkler_similarity(nad, onad) >= 0.85 or contains(nad, onad) or contains(onad, nad)
    """)
    eslesen = con.execute('select count(distinct id) from esles').fetchone()[0]
    turlu_eslesen = con.execute("select count(distinct id) from esles where osm_tur is not null").fetchone()[0]
    # kaba tutarlilik: bizim tur ile OSM turu ayni aileden mi
    # FSQ yaprak etiketi (kucuk harf, anahtar kelime) -> OSM degerleri.
    # Kaba aile eslemesi; amac "ayni sey mi" sorusuna evet/hayir.
    AILE = [
      (('cafe', 'coffee', 'tea'), {'cafe', 'coffee_shop', 'tea'}),
      (('restaurant', 'diner', 'steakhouse', 'kebab', 'pizzeria', 'bistro', 'food'), {'restaurant', 'fast_food', 'food_court'}),
      (('bar', 'pub', 'night club', 'nightclub', 'lounge', 'beer'), {'bar', 'pub', 'nightclub', 'biergarten'}),
      (('bakery', 'dessert', 'pastry', 'ice cream', 'patisserie'), {'bakery', 'pastry', 'confectionery', 'ice_cream'}),
      (('park', 'garden', 'playground'), {'park', 'garden', 'playground'}),
      (('shopping mall', 'shopping plaza'), {'mall'}),
      (('gym', 'fitness', 'sports', 'stadium', 'soccer', 'football'), {'fitness_centre', 'sports_centre', 'stadium', 'pitch'}),
      (('museum', 'theater', 'theatre', 'movie', 'cinema', 'library', 'art', 'gallery', 'cultural'), {'museum', 'theatre', 'cinema', 'library', 'arts_centre', 'gallery', 'attraction'}),
      (('hotel', 'hostel', 'motel', 'inn', 'resort', 'lodging'), {'hotel', 'hostel', 'guest_house', 'motel'}),
      (('grocery', 'supermarket', 'market', 'convenience'), {'supermarket', 'convenience', 'greengrocer', 'marketplace'}),
      (('pharmacy',), {'pharmacy'}), (('bank',), {'bank'}), (('hospital', 'clinic', 'doctor', 'dentist'), {'hospital', 'clinic', 'doctors', 'dentist'}),
      (('school', 'university', 'college'), {'school', 'university', 'college'}), (('mosque', 'church', 'temple'), {'place_of_worship'}),
      (('gas station', 'fuel'), {'fuel'}), (('hair', 'barber', 'salon', 'beauty'), {'hairdresser', 'beauty'}),
      (('clothing', 'boutique', 'apparel', 'shoe'), {'clothes', 'shoes', 'boutique'}),
    ]
    def ayni_aile(tur, osm):
        t = (tur or '').lower()
        for anahtarlar, osm_kume in AILE:
            if any(a in t for a in anahtarlar):
                return osm in osm_kume
        return None  # bizim tur icin aile tanimli degil
    con.execute("create table cift as select distinct id, tur, osm_tur, cuisine, ad, oname from esles where osm_tur is not null and tur is not null and tur<>'yer-degil'")
    ciftler = con.execute('select tur, osm_tur from cift').fetchall()
    degerlendirilen = [(t, o) for t, o in ciftler if ayni_aile(t, o) is not None]
    tutan = sum(1 for t, o in degerlendirilen if ayni_aile(t, o))
    print('\n=== OSM TUR OLCUMU - BURSA ===')
    print(f'Foursquare kaynakli mekan (Bursa)  : {toplam:,}')
    print(f'  bizde tur yazili (yer-degil haric): {turlu_biz:,} ({turlu_biz/toplam:.1%})')
    print(f'OSM POI ile eslesen (40 m + ad)     : {eslesen:,} ({eslesen/toplam:.1%})')
    print(f'  eslesen VE OSM turu yazili         : {turlu_eslesen:,} ({turlu_eslesen/toplam:.1%} / tum mekanlar)')
    if ciftler:
        print(f'Her ikisinde tur olan cift          : {len(ciftler):,}; aile tanimli: {len(degerlendirilen):,}; AYNI aile: {tutan:,} ({tutan/max(1,len(degerlendirilen)):.0%})')
    print('\nEn sik OSM turleri (eslesenlerde):')
    for r in con.execute('select osm_tur, count(*) n from esles where osm_tur is not null group by 1 order by 2 desc limit 12').fetchall():
        print(f'  {r[0]:<20} {r[1]:>6}')
    print('\nBizim tur x OSM turu (en sik 15 cift):')
    for r in con.execute('select tur, osm_tur, count(*) n from cift group by 1,2 order by 3 desc limit 15').fetchall():
        print(f'  {str(r[0]):<14} -> {r[1]:<18} {r[2]:>5}')
    print('\nOrnek eslesmeler (rastgele 12):')
    for r in con.execute('select ad, oname, tur, osm_tur, cuisine, round(mesafe) from esles where osm_tur is not null order by random() limit 12').fetchall():
        print(f'  {r[0][:28]:<28} | {r[1][:28]:<28} | biz={r[2]} osm={r[3]} {("("+r[4]+")") if r[4] else ""} {int(r[5])} m')
    print('\nUYUSMAZLIK ornekleri (farkli aile, 10):')
    for t, o, c, ad, oname in [(t,o,c,ad,on) for t,o,c,ad,on in con.execute('select tur, osm_tur, cuisine, ad, oname from cift').fetchall() if ayni_aile(t, o) is False][:10]:
        print(f'  {ad[:30]:<30} biz={t} osm={o} {("("+c+")") if c else ""}')


if __name__ == '__main__':
    mekanlari_indir()
    osm_cikar()
    rapor()
