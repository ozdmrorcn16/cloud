# Araclar

## Foursquare OS Places - TEK MEKAN KAYNAGI (2026-08-30)

Karar 79-80 (`docs/konusma-gunlugu.md`): Overture SILINDI, mekan verisi
tek kaynaktan gelir. `mekanlar` = Foursquare kayitlari + 3 test mekani.
Kaynak `'foursquare'`, kimlik `fsq_place_id` (tekil indeks). Kapali
(`date_closed`), bayrakli (`unresolved_flags`) ve mekan olmayan
kategoriler (apartman/konut, toplu konut, ofis, fabrika, yol, etkinlik)
ALINMAZ. Tur gizleme kurali degismedi: `turuGosterilir` yalnizca
`kaynak = 'kullanici'` icin true.

### Boru hatti (aylik tazeleme)

1. Hugging Face hesabi + veri seti sartlarini onayla
   (https://huggingface.co/datasets/foursquare/fsq-os-places, kapili)
   + Read token. Veri ARTIK S3'TE DEGIL.
   `HF_TOKEN=hf_... python araclar/fsq-indir.py` - Turkiye kesiti
   (5.980.482 kayit, 278 MB, gitignored `fsq-tr.parquet`; ~10 dk).
   Kategori tablosu da iner (`fsq-kategoriler.parquet`).
   Tazelemede `fsq-indir.py` icindeki `SURUM` sabiti guncellenir.

2. `python araclar/mekan-yukle-foursquare.py yukle` - `fsq_hazirlik`
   hazirlik tablosuna upsert (1.000'lik paketler). Tek surec ~40 bin
   satir/dk; paralel icin `FSQ_BASLANGIC`/`FSQ_BITIS` ile aralik ver,
   her surec yalnizca kendi araligini okur (~1,5 GB bellek).

3. Aktarim SUNUCUDA, pg_cron ile: `fsq_aktarim_adimi` (migrasyon
   20260830130000) hazirlik tablosundan `mekanlar`a dilim dilim aktarir.
   Bitince `fsq_bitis_adimi` (20260830140000) indeks ve temizlik yapar;
   tazelemede Overture silme adimi YOKTUR.

   **Istemciden dilim dilim RPC cagirmak CALISMIYOR** (denendi): 60 sn
   gateway zaman asimi, hayalet ifadeler ve kilit yarisi. Sunucu tarafi
   cron tek guvenilir yol.

4. Kategori sozlugu: `araclar/fsq-kategori-eslemesi.py` - 1.279
   Foursquare kategorisi -> Turkce tur (en ozgul dugumden yukari,
   karsiliksiz etiket yok).

### fsq-semt-doldur.py (ILCE ve ADRES zenginlestirmesi)

Foursquare'in `locality` alani yarim ve tutarsiz, `address` alaninin
buyuk kismi bos. Bu betik eksikleri Overture kesitinden (`overture-tr.parquet`,
silinmeden once alinan yerel kopya) yerelde tamamlar:

- ILCE: kaydin ~300 m'lik hucresindeki (yoksa 3x3 komsulugundaki)
  Overture kayitlarinin EN SIK semti. Komsular ayni ilcededir, ad
  eslesmesi gerekmez. "En yakin kaydi al" ilk surumu 600 milyon cifte
  cikip 3 saatte bitmemisti; hucre modu saniyeler suruyor.
- ADRES: adresi bos kayit, 60 m icinde ADI ESLESEN (jaro-winkler
  >= 0.85) Overture kaydinin adresini alir - ayni mekan oldugu icin.
  `SADECE_SEMT=1` bu pahali adimi atlar.

```
PYTHONIOENCODING=utf-8 python araclar/fsq-semt-doldur.py
FSQ_PARQUET=araclar/fsq-tr-semtli.parquet FSQ_TABLO=mekanlar \
  python araclar/mekan-yukle-foursquare.py yukle
```

`FSQ_TABLO=mekanlar`: `tazelendi` alani atlanir, `kaynak='foursquare'`
eklenir, `fsq_place_id` uzerinden upsert - yalnizca semt/adres/tur gibi
alanlar tazelenir.

Lisans: Apache 2.0 (atif zorunlu degil). NOTICE metni magaza oncesi
belgeye konmali - ACIK IS.

## TARIHSEL - Overture donemi betikleri

Overture 2026-08-30'da tamamen silindi. Asagidaki betikler CALISTIRILMAZ;
yalnizca gecmisi anlamak icin duruyorlar.

- `mekan-yukle-overture.py` - Overture Places yukleyicisi. 2026-08-21'de
  bir kez calisti (196.932 mekan, guven esigi 0.5), sonra 877.972 kayda
  cikti.
- `kategori-eslemesi.py` - Overture'in 168 kategorisi -> Turkce tur.
  Foursquare karsiligi `fsq-kategori-eslemesi.py`.
- `tur-duzeltmeleri.py`, `tur-duzeltmeleri-2-isyeri.py`,
  `tur-duzeltmeleri-3-tarihi-yer.py` - 2026-08-23 denetiminin 98 kurali
  (73.101 kayit duzeltildi). Foursquare verisine UYGULANMADI.
- `konut-turlerini-ayir.py`, `kategori-tara.py` - ayni denetimin
  yardimcilari.
- `mekan-yukle.py` - hic gercek veriyle calismamis ilk OSM yukleyicisi.

`overture-tr.parquet` diskte KALIYOR: ilce/adres zenginlestirmesinin
tek girdisi o. Silinirse `fsq-semt-doldur.py` bir daha kosulamaz.
