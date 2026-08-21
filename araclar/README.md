# Araclar

## mekan-yukle-overture.py (BIRINCIL yukleyici)

Overture Places'ten Turkiye'deki kafe/bar/restoran/park verisini
`mekanlar` tablosuna yukler. **2026-08-21'de ilk kez calistirildi:
196.932 mekan yuklendi** (release 2026-08-19.0, guven esigi 0.5).

1. `pip install duckdb supabase`
2. `python araclar/mekan-yukle-overture.py indir` - Turkiye kesitini
   yerel parquet'e ceker (canliya dokunmaz; dosya gitignored).
3. `SUPABASE_SERVICE_ROLE_KEY` ve `EXPO_PUBLIC_SUPABASE_URL` ortam
   degiskenlerini ayarla (`mobil/.env` icinde).
4. `python araclar/mekan-yukle-overture.py yukle` - `gers_id` uzerinden
   UPSERT eder; ayni betik ayda bir kosulup veriyi tazeler (yeni
   release icin betikteki `RELEASE` sabitini guncelle).

Lisans: CDLA-Permissive 2.0. Uygulamada "Mekan verileri: Overture Maps
Foundation" atfi gorunur olmali (mekan arama ekrani altligi - eski OSM
atfinin guncellenmesi gerekiyor, takip isi).

Kaynak secimi neden Overture: Kadikoy pilotunda ayni kutuda Overture
3.750, OSM 1.439 mekan verdi (2,6 kat); adres dolulugu %97; aylik
yayin + kalici GERS kimligi tazelemeye izin veriyor; icinde Foursquare
ve Meta verisi zaten var. Karsilastirmanin tamami:
`docs/isim-arastirmasi.md` degil, bu dosyanin git gecmisi ve
`docs/konusma-gunlugu.md`.

## mekan-yukle.py (eski, OSM)

OSM'den ayni kategorileri yukleyen ilk betik. Hic gercek veriyle
calistirilmadi; Overture birincil kaynak secilince yedekte kaldi.
Park/kamusal alan tamamlayicisi olarak ileride kullanilabilir.
Yalnizca node okur (way/relation kaybi Kadikoy olcumunde %8).
