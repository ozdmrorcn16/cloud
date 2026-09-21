"""ALLTHEPLACES (CC0) x FOURSQUARE - BURSA TUR OLCUMU (2026-09-21).

Soru: Bursa'daki Foursquare mekanlarimizin kaci AllThePlaces'taki bir
ZINCIR subesiyle eslesiyor (marka adi + 100 m)? Eslesen kayitta tur
markanin kendi beyanidir (amenity/shop/cuisine). Veriye dokunmaz.

Kaynak: https://alltheplaces-data.openaddresses.io/runs/<run>/output/<spider>.geojson
48 `_tr` orumcegi + TR subesi tasiyabilen kuresel zincirler. Onbellek:
araclar/atp/<spider>.geojson (gitignore'da).

Kosum: python araclar/atp-tur-olcum.py
"""
import json
import os
import unicodedata
import urllib.request

import duckdb

BURASI = os.path.dirname(os.path.abspath(__file__))
RUN = '2026-09-12-13-32-21'
TABAN = f'https://alltheplaces-data.openaddresses.io/runs/{RUN}/output/'
ATP_DIZIN = os.path.join(BURASI, 'atp')
MEKAN_PQ = os.path.join(BURASI, 'olcum-bursa-mekanlar.parquet')
KUTU = (28.0, 39.6, 30.1, 40.7)

TR_ORUMCEKLER = """a101 arcelik_global bauhaus baydoner beymen bim bpet burger_king carls_jr decathlon defacto
denizbank desa easy_point ekomini erciyes_anadolu_holding five_sarj garanti_bbva gratis halkbank hd_iskender ikea
kadoil kooperatifmarket kuveyt_turk mazda mcdonalds mediamarkt migros mitsubishi moil network popeyes pudo qnb
rossmann soil sok tavuk_dunyasi teb teco turk_telekom usta_donerci vakif_katilim vakifbank vodafone yapi_kredi
ziraat_bankasi""".split()
KURESEL = ['starbucks_eu', 'starbucks_mena', 'mango', 'zara', 'tchibo', 'coffee_republic', 'popeyes', 'mcdonalds',
           'burger_king', 'ikea', 'lc_waikiki', 'koton', 'gloria_jeans', 'sbarro', 'subway', 'kfc', 'dominos_pizza',
           'pizza_hut', 'hard_rock_cafe', 'nusr_et', 'espressolab', 'kahve_dunyasi', 'mado', 'simit_sarayi']


def indir(spider: str) -> str | None:
    os.makedirs(ATP_DIZIN, exist_ok=True)
    yol = os.path.join(ATP_DIZIN, f'{spider}.geojson')
    if os.path.exists(yol):
        return yol
    try:
        with urllib.request.urlopen(TABAN + f'{spider}.geojson', timeout=120) as r:
            veri = r.read()
    except Exception as e:  # 404 = o orumcek bu derlemede yok
        print(f'  {spider}: yok ({str(e)[:40]})')
        return None
    open(yol, 'wb').write(veri)
    return yol


def normalize(s: str) -> str:
    s = (s or '').lower().replace('ı', 'i')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in s).split())


def atp_bursa():
    satirlar, toplam_tr, geosuz = [], 0, 0
    spiders = TR_ORUMCEKLER and [f'{s}_tr' for s in TR_ORUMCEKLER] + KURESEL
    for sp in spiders:
        yol = indir(sp)
        if not yol:
            continue
        try:
            fc = json.load(open(yol, encoding='utf-8'))
        except Exception:
            continue
        for f in fc.get('features', []):
            p = f.get('properties', {})
            if p.get('addr:country') not in (None, 'TR') and not sp.endswith('_tr'):
                continue
            toplam_tr += 1
            g = f.get('geometry')
            if not g or not g.get('coordinates'):
                geosuz += 1
                continue
            lng, lat = g['coordinates'][:2]
            if not (KUTU[0] <= lng <= KUTU[2] and KUTU[1] <= lat <= KUTU[3]):
                continue
            tur = p.get('amenity') or p.get('shop') or p.get('leisure') or p.get('tourism') or p.get('office') or ''
            satirlar.append((sp, p.get('brand') or p.get('name') or '', p.get('name') or '', tur, p.get('cuisine') or '', lng, lat))
    return satirlar, toplam_tr, geosuz


def main():
    satirlar, toplam_tr, geosuz = atp_bursa()
    print(f'\nATP Turkiye kaydi (indirilen orumcekler): {toplam_tr:,}; koordinatsiz: {geosuz:,} ({geosuz/max(1,toplam_tr):.0%})')
    print(f'ATP Bursa kutusunda koordinatli kayit: {len(satirlar):,}')
    con = duckdb.connect()
    con.execute('INSTALL spatial; LOAD spatial;')
    con.create_function('norm', normalize, ['VARCHAR'], 'VARCHAR')
    con.execute('create table a(sp varchar, marka varchar, ad varchar, tur varchar, cuisine varchar, lng double, lat double)')
    con.executemany('insert into a values (?,?,?,?,?,?,?)', satirlar)
    con.execute('alter table a add column nmarka varchar; update a set nmarka = norm(marka)')
    con.execute(f"create table m as select *, norm(ad) nad from '{MEKAN_PQ}'")
    print('\nATP Bursa - orumcek basina:')
    for r in con.execute('select sp, count(*) n, any_value(tur) tur from a group by 1 order by 2 desc').fetchall():
        print(f'  {r[0]:<24} {r[1]:>5}  {r[2]}')
    # eslestirme: 100 m + FSQ adinin marka adini icermesi (normalize)
    con.execute("""
      create table es as
      select distinct m.id, m.ad, m.tur ftur, a.sp, a.marka, a.tur atur, a.cuisine,
        ST_Distance_Sphere(ST_Point(m.lng,m.lat), ST_Point(a.lng,a.lat)) mesafe
      from m join a on abs(m.lat-a.lat) < 0.0012 and abs(m.lng-a.lng) < 0.0016
      where ST_Distance_Sphere(ST_Point(m.lng,m.lat), ST_Point(a.lng,a.lat)) <= 100
        and length(a.nmarka) >= 3 and contains(m.nad, a.nmarka)
    """)
    toplam = con.execute('select count(*) from m').fetchone()[0]
    eslesen = con.execute('select count(distinct id) from es').fetchone()[0]
    turlu = con.execute("select count(distinct id) from es where atur <> ''").fetchone()[0]
    sosyal = con.execute("select count(distinct id) from es where atur in ('cafe','restaurant','fast_food','bar','pub','coffee_shop','ice_cream')").fetchone()[0]
    print(f'\n=== ALLTHEPLACES x FOURSQUARE - BURSA ===')
    print(f'Foursquare mekani (Bursa)               : {toplam:,}')
    print(f'ATP zincir subesiyle eslesen (100 m+ad) : {eslesen:,} ({eslesen/toplam:.2%})')
    print(f'  eslesen ve ATP turu yazili             : {turlu:,}')
    print(f'  bunlardan SOSYAL tur (kafe/restoran/bar): {sosyal:,}')
    print('\nEslesenlerde ATP turu dagilimi:')
    for r in con.execute("select atur, count(distinct id) n from es where atur<>'' group by 1 order by 2 desc limit 12").fetchall():
        print(f'  {r[0]:<16} {r[1]:>5}')
    print('\nMarka basina eslesme (ATP Bursa sube / eslesen FSQ):')
    for r in con.execute("select a.marka, count(*) sube, (select count(distinct id) from es where es.marka=a.marka) esl from a group by 1 order by 2 desc limit 15").fetchall():
        print(f'  {r[0][:22]:<22} {r[1]:>5} / {r[2]:>5}')
    print('\nOrnek eslesmeler (10):')
    for r in con.execute("select ad, marka, ftur, atur, cuisine, round(mesafe) from es where atur<>'' order by random() limit 10").fetchall():
        print(f'  {r[0][:30]:<30} = {r[1]:<14} fsq={r[2]} atp={r[3]} {("("+r[4]+")") if r[4] else ""} {int(r[5])} m')
    # bizde tur ile ATP turu tutarli mi (sosyal aile)
    aile = {'restaurant': ('restaurant','burger','fast food','kofte','doner','kebab','chicken','wing'), 'fast_food': ('restaurant','burger','fast food','kofte','doner','kebab','chicken','wing','pizza'),
            'cafe': ('caf','coffee','tea'), 'supermarket': ('grocery','supermarket','market','convenience'), 'bank': ('bank',), 'fuel': ('gas station','fuel'),
            'electronics': ('electronics','phone','mobile'), 'clothes': ('clothing','apparel','boutique','fashion'), 'furniture': ('furniture','home'), 'sports': ('sport',), 'cosmetics': ('cosmetic','beauty','pharmacy','drugstore')}
    ciftler = con.execute("select ftur, atur from es where atur<>'' and ftur is not null").fetchall()
    degerlendir = [(f, a) for f, a in ciftler if a in aile]
    tutan = sum(1 for f, a in degerlendir if any(k in (f or '').lower() for k in aile[a]))
    if degerlendir:
        print(f'\nFSQ turu ile ATP turu ayni aileden: {tutan}/{len(degerlendir)} ({tutan/len(degerlendir):.0%})')
        print('Uyusmayan ornekler (8):')
        for f, a in [(f, a) for f, a in degerlendir if not any(k in (f or '').lower() for k in aile[a])][:8]:
            print(f'  fsq={f} atp={a}')


if __name__ == '__main__':
    main()
