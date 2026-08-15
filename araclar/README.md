# Araclar

## mekan-yukle.py

OpenStreetMap'ten Turkiye'deki kafe/bar/restoran/park verisini `mekanlar`
tablosuna tek seferlik yukler.

1. https://download.geofabrik.de/europe/turkey.html adresinden
   `turkey-latest.osm.pbf` indir.
2. `pip install osmium supabase`
3. `SUPABASE_SERVICE_ROLE_KEY` ortam degiskenini ayarla (Dashboard →
   Project Settings → API → `service_role` anahtari — **gizli tut**).
4. `python araclar/mekan-yukle.py turkey-latest.osm.pbf`

Veri tazelemek istendiginde tekrar calistirilir. OSM lisansi (ODbL) geregi
uygulama icinde "Mekan verileri © OpenStreetMap katkida bulunanlar" atfi
gorunur olmali (bkz. Task 10, mekan arama ekrani altligi).
