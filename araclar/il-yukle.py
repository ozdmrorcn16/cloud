"""Il sinirlarini `iller` tablosuna yukler (81 poligon, ~100 m tolerans).

Arama, kullanicinin bulundugu ille sinirli (kullanicinin karari
2026-09-01) ve kullanicinin ili bu poligonlarla, nokta-icinde testiyle
bulunuyor. "En yakin mekanin ilini al" bilerek YAPILMADI: o bir tahmin
olurdu ve il sinirina yakin yerlerde yanilirdi.

Girdi : araclar/osm-iller.parquet (OpenStreetMap idari sinirlari, ODbL)
Cikti : public.iller tablosu

Basitlestirme toleransi 0.001 derece (~100 m): nokta-icinde testi icin
fazlasiyla hassas, sorgu ise cok daha hizli. Olculdu: ham WKT ~10 MB,
bu toleransta 1,16 MB.

Kosum (mobil/.env yuklu kabuk):
    python araclar/il-yukle.py

Idempotent: tabloyu bosaltip yeniden yaziyor.
"""
import os
import duckdb
from supabase import create_client

BURASI = 'C:/Users/orcns/projects/cloud/araclar'
y = create_client(os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])

con = duckdb.connect()
con.execute('INSTALL spatial; LOAD spatial;')
satirlar = con.execute(f"""
  SELECT ad,
         ST_AsText(ST_Multi(ST_Simplify(ST_GeomFromWKB(geometri), 0.001))) AS wkt
  FROM read_parquet('{BURASI}/osm-iller.parquet')
  WHERE ad IS NOT NULL
""").fetchall()
print(f'{len(satirlar)} il okundu')

y.table('iller').delete().neq('ad', '').execute()
for ad, wkt in satirlar:
    y.table('iller').insert({'ad': ad, 'sinir': f'SRID=4326;{wkt}'}).execute()

print('yuklendi:', y.table('iller').select('ad', count='exact').execute().count)
