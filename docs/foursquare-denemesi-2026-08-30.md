# Foursquare OS Places denemesi (2026-08-30)

Kullanicinin istegi: "Foursquare verilerini cekip bir deneme yapalim."
Bu bir DENEME (spike): cikti bir karar, kod degil. Canli veritabanina
dokunulmadi; deneme icin acilan iki gecici RPC (`deneme_bursa_*`)
sonunda dusuruldu.

## Kaynak ve erisim

- Foursquare OS Places, surum `dt=2026-08-11`, Apache 2.0. ~100 dosya,
  11 GB parquet. Amazon S3 kovasi BOSALTILMIS (yalnizca LICENSE ve
  NOTICE kaldi); veri artik yalnizca Hugging Face'te ve KAPILI:
  ucretsiz hesapla form (kurum, unvan, ulke, amac) doldurulup otomatik
  onay aliniyor, indirme icin Read token gerekiyor.
- Okuma DuckDB + httpfs ile dogrudan HTTPS uzerinden (Bearer token).
  Dosyalar cografi sirali; parquet row-group istatistikleri sayesinde
  Bursa kutusu (lat 40.05-40.35, lng 28.80-29.35) 100 dosyadan
  **31 saniyede** suzuldu, 11 GB indirilmedi.
- Kategori tablosu yalnizca INGILIZCE (`category_label`). Turkce
  karsilik bizde `araclar/kategori-eslemesi.py` benzeri bir sozlukle
  yazilmak zorunda.

## Sayilar (Bursa kutusu)

| | Foursquare | Bizim (Overture) |
|---|---|---|
| Toplam kayit | 191.539 | 20.071 (kutu dilimleriyle alinan kesit; tam kutu 26.230) |
| Acik + bayraksiz | 180.444 | 19.557 gorunen |
| "Sosyal" mekan (Dining, Arts, Landmarks, Sports) | **52.375** | **~5.000** |
| Dining and Drinking (restoran/kafe/bar/firin) | 31.000+ | ~4.000 |
| Adressiz | 107.718 (%56) | - |
| Telefonlu | 27.979 | 0 |
| Kapali isaretli | 9.057 | - |

Esleme (60 m icinde + ad benzerligi >= 0.85): bizim 20.071 kaydin
**%33'u (6.620)** Foursquare'de de var. Bizim Kafe/Restoran/Turk
mutfagi kayitlarinin 890/2.316'si Foursquare'de YOK; Foursquare'in
Dining kayitlarinin 26.656'si bizde yok (bunlarin 8.235'i 2024 ve
sonrasinda tazelenmis, 6.815'i 2019 oncesinden kalma).

## Tur kalitesi

Eslesen kayitlarda Foursquare kategorisi bizim turle karsilastirildi:

- Bizde **Park** olan 103 kaydin 76'sina Foursquare da Park diyor;
  9 oyun parki, 3 plaza, 4 acik alan. Yalnizca **5'i** konut/cami
  (yani Overture'in "Park Apt" hatasi).
- Bizde **Site** olan 479 kaydin 398'i Foursquare'de Apartman, 78'i
  Toplu konut - yani bizim konut ayrimi (2026-08-23 denetimi) tutarli.
- Bizde **Kafe** olan 222 kaydin 160'i Café, 14'u Coffee Shop, 5'i Tea
  Room; **8'i Foursquare'de "Factory"** (Foursquare'in hatasi).
- Bizde **Restoran** olanlarda Foursquare daha ince ayrim veriyor:
  Kebab, Soup Spot, Kofte, Meyhane, Fried Chicken...

Sonuc: iki kaynagin tur dogrulugu birbirine YAKIN; Foursquare'in
avantaji kategori derinligi (Kofte Place, Manti Place, Cocktail Bar),
dezavantaji kullanicidan gelen gurultu.

## Foursquare'in zayif taraflari (olculdu)

- **Gurultu:** 18.834 kayit tamamen kucuk harf ("esnaf cay ocagi"),
  441 kayit ev/oda adi ("evim", "odam"), "Demtas oto yikama" Bar
  kategorisinde, "Candan Ercetin Konseri" mekan olarak kayitli.
- **Sosyal olmayan yigin:** 40.885 kayit apartman, toplu konut,
  fabrika, ofis - Bursa'da en buyuk kategori "Apartment or Condo"
  (13.323). Kesfet akisina alinmamali.
- **Kopya:** Dining'de ayni adla 40 m icinde 251 cift.
- **Eskilik:** acik kayitlarin ~%35'i en son 2019'dan once tazelenmis;
  kapali olup kapali isaretlenmemis dukkan sayisi bilinmiyor.
- **Adres:** yarisindan fazlasi adressiz; semt bilgisi (`locality`)
  105 bin kayitta bos, kalanda tutarsiz ("Bursa", "bursa", "BURSA").

## Oneri

**Overture kalsin, Foursquare'i YALNIZCA sosyal turlerde EK kaynak
olarak birlestir.** Gerekce:

1. Uygulamanin sorusu "su an nerede insan var": kafe, restoran, bar,
   park, spor. Foursquare bu turlerde bizim 10 katimiz kayit tasiyor
   (52 bin / 5 bin) ve ornekler gercek isletmeler (Hacı Ömer Baklava,
   Radyopub, Mantımia, Tavuk Dünyası...). Bu eksik, kullanicinin
   "aradigim yer yok" demesinin en olasi sebebi.
2. Tur dogrulugu Overture'dan iyi DEGIL, benzer; yani Foursquare
   "tur sorununu" cozmuyor. Karar 2026-08-24 (dis kaynakta tur
   gosterilmez) DEGISMEZ.
3. Butun Foursquare'i almak 40 bin apartman/fabrika/ofis ve on
   binlerce eski kayit demek; veritabani Bursa icin 9 kat buyur,
   ulke icin tahminen 4-5 milyon kayit (~2 GB). Sosyal turlerle
   sinirlayip 2019 oncesi tazelenmemis ve bayrakli kayitlari
   disarida birakinca Bursa'da ~35 bin, ulkede tahminen 1-1,5 milyon.

Birlestirme yapilacaksa is kalemleri: (a) Foursquare kategorisi ->
bizim tur sozlugu (yalnizca sosyal turler), (b) 60 m + ad benzerligi
ile Overture kayitlariyla tekillestirme (bu denemede kurulan esleme
kullanilir), (c) `kaynak = 'foursquare'` ve `fsq_place_id` sutunlari,
(d) Turkiye geneli cekim (Bursa 31 sn surdu; ulke tahminen 10-15 dk),
(e) lisans notu: Apache 2.0, atif zorunlu degil ama NOTICE dosyasi
belgeye konur.

## Deneme sirasinda ogrenilenler

- `konum::geometry` uzerinde `ST_Intersects` GiST indeksini devre disi
  birakiyor (878 bin satirda tam tarama, 5 sn+). Kutu sorgusu
  `konum && ST_MakeEnvelope(...)::geography` ile 0,6 sn.
- PostgREST `range()` ile offset sayfalama buyuk tabloda zaman asimina
  dusuyor; keyset ya da kutu dilimleri gerekiyor.
- DuckDB'de 20k x 191k kaba mesafe join'i bitmiyor; 0,001 derecelik
  izgara anahtariyla komsu hucre join'i saniyeler icinde.
- Windows'ta Python cikisi cp1254; Turkce/ozel karakter basarken
  `PYTHONIOENCODING=utf-8` gerekiyor.
