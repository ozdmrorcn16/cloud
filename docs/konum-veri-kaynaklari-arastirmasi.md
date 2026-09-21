# Ucretsiz ve yasal mekan (POI) verisi + mekan fotografi kaynaklari - arastirma

Tarih: 2026-09-21. Soru (kullanici): "Internette baska tur gercek konum
verileri, fotograf - bunlari ucretsiz cekebilecegimiz bir kaynak var mi?
GitHub depolarini da arastir."

Olcut uc kosul birden: (1) veriyi KENDI veritabanimiza yazip saklayabilelim,
(2) kendi haritamizda/listemizde gosterebilelim (kaynagin haritasi sart
olmasin), (3) ucretsiz. Ayrica kullanicinin kurallari: turetilmis/tahmin
veri yok, dogrulugu garanti edilemeyen alan gosterilmez.

Araclar: Agent Reach (GitHub CLI, Jina okuyucu), Wikidata SPARQL,
Wikimedia Commons API, IBB CKAN API, duckdb (yerel olcumler).

## Ozet tablo

| Kaynak | Lisans | Ne verir | Saklama / kendi haritada gosterme | Turkiye / Bursa olcumu | Karar |
|---|---|---|---|---|---|
| **Foursquare OS Places** (kullaniyoruz) | Apache 2.0 | ad, koordinat, kategori (1.279 kategori) | serbest | 5,98 M kayit, Bursa 212 K | Temel veri. Kategori %100 guvenilir DEGIL (2026-08-24 denetimi) |
| **Overture Maps Places** | CDLA-Permissive 2.0 (+ Apache 2.0 FSQ dilimi) | ad, koordinat, kategori, web/sosyal baglanti, guven skoru; kaynaklar Meta 58,5 M, Microsoft 6,3 M, BrightQuery 2,3 M | serbest (ODbL share-alike YOK) | `araclar/overture-tr.parquet` 98 MB elimizde; 2026-08-30'da kategori guvensizligi yuzunden BIRAKILDI | Tur icin ikinci gorus olabilir ama ayni sinif hata; fotograf yok |
| **OpenStreetMap** (kullaniyoruz: il/ilce, yol dokusu) | ODbL (atif + share-alike) | amenity/shop/cuisine etiketleri, bazen `image`/Commons baglantisi | serbest, atifla | Bursa: 8.733 adli POI; FSQ mekanlarimizin %1,4'u eslesiyor, %0,9'u turlu; sosyal turlerde 220 kafe / 314 restoran / 13 bar (bizde 23.285) - `araclar/osm-tur-olcum.py` | Kapsam olarak islemez (2026-09-20 olcumu) |
| **AllThePlaces** (github.com/alltheplaces/alltheplaces, 828 yildiz) | Veri **CC0**, kod MIT | Markalarin KENDI magaza bulucularindan kazinan subeler: ad, koordinat, marka, kategori (marka -> Wikidata/NSI eslemesi), acilis saatleri, telefon, web. Haftalik derleme: 5.137 orumcek, 36,7 M kayit, output.zip 2,4 GB | serbest (CC0) | **48 `_tr` orumcek, 102.143 kayit** (12 Eylul derlemesi): BIM 12.989, SOK 11.259, Easy Point 9.862, Ziraat 9.590, Garanti 7.203, Halkbank 6.134, Vodafone 5.880, Yapi Kredi 5.684, Vakifbank 5.091, QNB 4.036, Migros 3.814, Denizbank 3.698... Sosyal zincirler: Burger King, McDonald's, Popeyes, Carl's Jr, Baydoner, HD Iskender, Usta Donerci, Tavuk Dunyasi; kuresel orumcekler (Starbucks EU/MENA, IKEA, Decathlon, Zara, Mango, Tchibo) TR subelerini de tasiyabilir | **TEK YENI ve GUVENILIR TUR KAYNAGI**: tur markanin kendi beyani, tahmin degil. Ama yalnizca ZINCIRLER; bagimsiz kafe/bar yok. Fotograf yok |
| **Who's On First venue** (whosonfirst-data) | CC BY (SimpleGeo kokenli CC0) | eski venue verisi | serbest | 2011 SimpleGeo dokumu, TR kapsami zayif ve eski | Degmez |
| **Wikidata** | CC0 | koordinat (P625), tur (P31), resim (P18 -> Commons) | serbest | Bursa: koordinatli+resimli oge **59**; kafe/restoran/bar sinifinda **0** | Yalnizca anit/muze/cami gibi "yer isaretleri"; isletme yok |
| **Wikimedia Commons** | dosya basina CC BY / CC BY-SA / CC0 (kontrol sart) | cografi etiketli fotograflar, API `list=geosearch` | serbest, dosya basina atif + lisans gosterimi | Bursa merkez 2 km: **500+** fotograf (limit doldu), cogu panoramio aktarimi: Kent Muzesi, Valilik, Ulu Cami... | Yer isaretleri icin gercek fotograf VAR; kafe/bar icin yok. Fotograf -> mekan eslemesi koordinatla (yakinlik = tahmin riski) |
| **Mapillary** | CC BY-SA 4.0 | sokak seviyesi fotograf (Meta), ucretsiz API (token) | gosterim serbest, atif + share-alike | TR'de yaygin (arac kameralari) | Mekanin DIS CEPHESI olur, "mekan fotografi" degil; koordinat esleme tahmin |
| **KartaView / Panoramax** | CC BY-SA | sokak seviyesi | ayni | TR kapsami dagilmis / Panoramax Fransa agirlikli | Mapillary ile ayni sinif |
| **Openverse API** | dosya basina CC | CC gorsel arama (Flickr, Commons, ...) | dosya basina | "bursa kafe" ticari lisans suzgeci: **1** sonuc | Yetersiz |
| **Flickr API** (CC suzgecli, geotag) | dosya basina CC | gercek mekan fotograflari (populer yerler) | dosya basina atif; NC/ND varyantlari elenmeli | anahtar gerekir; kapsam populer yerlerde | Kafe/bar icin seyrek; hukuki temizlik dosya basina is |
| **IBB Acik Veri** (data.ibb.gov.tr) | IBB Acik Veri Lisansi = **CC BY 4.0** (ticari kullanim ve urune ekleme acikca serbest) | resmi tesisler: park 23 set, muze 3, restoran 4 (belediye tesisleri), kutuphane, kultur-sanat merkezleri, spor tesisleri | serbest, atifla | Yalnizca Istanbul; belediye mulkiyetindeki/ruhsatli tesisler | Istanbul acilisinda park/kutuphane/kultur merkezi gibi turleri RESMI kaynaktan alabiliriz |
| **Bursa BB Acik Veri** (acikveri.bursa.bel.tr) | ? | ? | ? | Portal erisilemedi (baglanti yok) | Tekrar denenmeli |
| **Google Places / Yandex / Yelp / TripAdvisor / Foursquare Places API (kapali)** | sozlesmeli | her sey (tur, fotograf, yorum) | **saklama YASAK, kendi haritada gosterme YASAK/kisitli**, ucretli | - | Elendi (2026-08-31 Google, 2026-09-21 Yandex) |
| **Kazima** (Scrapling vb. ile Google/Yandex/Instagram) | - | - | sozlesme + telif ihlali | - | Yapilmaz |

## Bulgular

1. **Turu %100 guvenilir olan tek ucretsiz kaynak AllThePlaces** - cunku tur
   markanin kendi sitesinden geliyor. Ama yalnizca zincirler: Turkiye'de
   102 bin kaydin buyuk kismi banka/ATM, market, telekom. Bizim ana
   turlerimizde (kafe/bar/restoran) yalnizca fast-food ve doner
   zincirleri. Bagimsiz mekanlarin (Slooin'in gercek hedefi) hicbiri yok.
2. **Fotograf icin isletme duzeyinde ucretsiz+yasal kaynak yok.**
   Commons/Wikidata yer isaretlerini (cami, muze, park, meydan) kapsar;
   kafe, bar, restoran icin fotograf yok. Sokak seviyesi (Mapillary)
   cephe verir, o da koordinatla eslenir = tahmin.
3. **Resmi acik veri (IBB) tur icin gercek kayittir** ama yalnizca kamu
   tesisleri ve yalnizca Istanbul.
4. Overture ve OSM tur icin "ikinci gorus" olabilir; ikisi de eksik ve
   FSQ ile celisen kayitlari var. Uc kaynak uyusuyorsa gostermek gibi bir
   kural, kapsami yine cok dusuk birakir (OSM %1).

## Oneri

- Tur: (a) AllThePlaces ile ZINCIR subelerinin turunu markadan al -
  eslestirme marka adi + 60 m; bu kayitlarda tur gosterilebilir cunku
  kaynak markanin kendisi. (b) Bagimsiz mekanlarda tur yalnizca
  KULLANICI/moderator girisiyle (duzenleme talebi altyapisi hazir).
  (c) Istanbul'da IBB setlerinden park/kutuphane/kultur merkezi turleri.
- Fotograf: kaynak yok; uygulamanin kendi check-in fotograflari (mevcut
  kural 5). Yer isaretleri icin istenirse Commons (dosya basina lisans
  ve atif goruntusu ile) - kapsam kucuk, hukuki is dosya basina.
- Bu tablo "tekrar arastirilmasin" listesidir; yeni kaynak cikarsa buraya
  eklenir.
