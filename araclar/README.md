# Araclar

## Foursquare OS Places (2026-08-30, Overture ile BIRLESTIRME)

Kullanicinin karari: Overture kalir, Foursquare uzerine BIRLESTIRILIR.
Kapali (`date_closed`), bayrakli (`unresolved_flags`) ve mekan olmayan
kategoriler (apartman/konut, toplu konut, ofis, fabrika, yol, etkinlik)
alinmaz. Ayni mekan iki kaynakta da varsa TEK kayit kalir (Overture
satirina `fsq_place_id` islenir); olmayanlar `kaynak = 'foursquare'`.
Deneme raporu: `docs/foursquare-denemesi-2026-08-30.md`.

1. Hugging Face hesabi + veri seti sartlarini onayla
   (https://huggingface.co/datasets/foursquare/fsq-os-places, kapili)
   + Read token. Veri ARTIK S3'TE DEGIL.
2. `HF_TOKEN=hf_... python araclar/fsq-indir.py` - Turkiye kesiti
   (5.980.482 kayit, 278 MB, gitignored `fsq-tr.parquet`; ~10 dk).
   Kategori tablosu da iner (`fsq-kategoriler.parquet`).
3. `python araclar/mekan-yukle-foursquare.py yukle` - `fsq_hazirlik`
   hazirlik tablosuna upsert (1.000'lik paketler). Tek surec ~40 bin
   satir/dk; paralel icin `FSQ_BASLANGIC`/`FSQ_BITIS` ile aralik ver,
   her surec yalnizca kendi araligini okur (~1,5 GB bellek).
4. `node mobil/araclar/fsq-birlestir.mjs` - sunucudaki `fsq_birlestir(lng0,
   lng1)` fonksiyonunu boylam dilimleri halinde cagirir: 60 m icinde +
   ad benzerligi (pg_trgm) olan Overture kaydina kimlik islenir,
   eslesmeyenler yeni satir olur. Zaman asimina dusen dilim ikiye
   bolunur; islenen satirlar `islendi = true` oldugu icin tekrar
   zararsiz.
5. Kategori sozlugu: `araclar/fsq-kategori-eslemesi.py` - 1.279
   Foursquare kategorisi -> Turkce tur (en ozgul dugumden yukari,
   karsiliksiz etiket yok). Tur adlari Overture sozlugu ile ortak.

Lisans: Apache 2.0 (atif zorunlu degil; NOTICE metni bu dosyada
anilir). Aylik tazeleme: `fsq-indir.py` icindeki `SURUM` sabiti
guncellenir, 2-4 tekrar kosulur.

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
