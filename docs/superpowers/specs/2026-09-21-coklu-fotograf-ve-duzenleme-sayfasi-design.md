# Check-in'de coklu fotograf + "Check-in'i duzenle" sayfasi (2026-09-21)

Kullanicinin referans gorseli (`tasarim/checkin-duzenle-referans.png`):
alttan gelen "Check-in'i duzenle" sayfasi; "Fotograflar" alaninda birden
fazla kare + "Ekle". Kullanicinin karari: **coklu fotograf** (tek
fotograf secenegi reddedildi). Bu belge iki isi birlikte tanimlar cunku
ikincisi birincisiz uygulanamaz.

## 1. Kararlar

| Konu | Karar | Gerekce |
|---|---|---|
| Ust sinir | check-in basina **5 fotograf** | Referans 2 + Ekle gosteriyor; sinirsiz olamaz (kova, akis kartinin agirligi). Sunucuda `check` kisiti. |
| Veri modeli | `check_inler.fotograflar text[] not null default '{}'`; mevcut `fotograf` sutunu **GENERATED** (`fotograflar[1]`) olur | Moderasyon RPC'leri, panel JSON'u, eski OTA'lar `fotograf`i okumaya devam eder; iki sutun birbirinden kayamaz (tetikleyiciye gerek yok). |
| `check_in_yap` | `p_fotograf text` KALIR + `p_fotograflar text[] default null` eklenir; tek fonksiyon (eski 7 parametreli imza DUSER - asiri yukleme tuzagi) | Telefondaki bir onceki JS bir oturum daha `p_fotograf` gonderebilir. Her yol icin sahiplik kontrolu (`<uid>/...`). |
| Duzenleme RPC | `check_in_fotograflarini_guncelle(p_check_in_id, p_fotograflar text[]) returns text[]` = kaldirilan eski yollar | Istemci onlari kovadan siler. Bugunku `check_in_fotografini_guncelle` (OTA 9ec78c2e cagiriyor) ince sarmalayici olarak kalir. |
| Kova okuma politikasi | `storage.objects.name = any(c.fotograflar)` + kendi klasoru; `check_inler_fotograflar_gin` (GIN) indeks, eski btree `check_inler_fotograf_idx` duser | Politika her fotograf erisiminde calisiyor; `= any` icin GIN sart. |
| `mekan_fotograflari` | `unnest(fotograflar) with ordinality` - fotograf basina bir satir, sira korunur | Galeri her fotografi ayri gosterir. |
| `verilerimi_disa_aktar` | check_inler bloguna `fotograflar` eklenir (`fotograf` de durur) | Erisim hakki tam kopya. |
| Imzali adres | `checkInFotografiUrlleri(yollar[])` = `createSignedUrls` (tek istek) | Akis sayfasi 20 kart x 5 fotograf = 100 imza; tek tek istek yavaslatirdi (hiz kurali). |
| Kart gosterimi | 2:1 alan icinde yatay SAYFALI kaydirma; >1 ise altta nokta gostergesi ve sag ustte "1/3" rozeti; dokunma o indeksten buyuk gorunum | Ana sayfa / iki profil ayni kart. |
| Galeriler | profil izgarasi, baskasinin profili, mekan galerisi: liste "fotograf" birimine duzlesir (ani x indeks); gezgin ayni | Referans: "buyuk acilinca saga sola gezilir". |
| Check-in formu | `allowsMultipleSelection`, `selectionLimit: 5 - secili`; kesikli kutu -> kucuk kareler + "Ekle" karesi (referansin duzenleme sayfasindaki desen) | Ayni sey her ekranda ayni gorunsun. |
| Duzenleme | Yerinde duzenleme KALKAR (2026-09-05 karari referansla degisti); `CheckInDuzenle` alttan gelen sayfa | Referans. |

## 2. "Check-in'i duzenle" sayfasi (`src/tasarim/CheckInDuzenle.tsx`)

`useModalHareketi` ile alttan gelir (SecimPenceresi/IfadeSecici deseni),
tam yukseklige yakin, icerik kaydirilir, klavye acilinca kayar.

Sira (referans birebir):
1. Tutamac; baslik **"Check-in'i düzenle"**, sagda X (= Vazgec).
2. Mekan karti: avatar 60, turuncu igne + **mekan adi** (kalin), altinda
   "kullaniciadi · gorece zaman" (gri). Salt gosterim.
3. **Notun** + cok satirli kutu (mevcut sinir).
4. **Fotoğraflar**: yoksa kesikli tam genislik kutu (resim+ ikonu,
   "Fotoğraf ekle", "Kamera veya galeriden seç"); varsa 3 sutun kare
   izgara: her karede sag ustte beyaz daire **x** (kaldir), altta yarim
   saydam **"Değiştir"** seridi (kalem ikonu); son kare kesikli **"+
   Ekle"** (5'e ulasinca gizlenir). Ekle = Kamera / Galeri
   `SecimPenceresi` (galeri coklu secim). Degistir = tek secim, o
   kareyi yenisiyle degistirir.
5. **İfade** + sagda turuncu **"Değiştir"**; altinda cip (ikon + etiket
   + x). Ifade yoksa "Değiştir" yerine "Ekle" yazar, cip yok.
6. **Birlikte** + sagda turuncu **"+ Ekle"**; altinda avatarli kullanici
   adi cipleri (x). ArkadasSecici (mevcut).
7. Ayirac; gri "Değişiklikler kaydedildiğinde uygulanır."; **Vazgeç**
   (cerceveli) / **Kaydet** (dolu turuncu).

Taslak sayfada tutulur; Kaydet'e kadar sunucuya hicbir sey gitmez
(mevcut kural). Kaydet sirasi: fotograflar (yukle -> RPC -> eskileri
sil) -> etiket kaldir -> etiket ekle -> ifade -> not (not en son, hata
olursa pencere acik kalir - mevcut kural). Hata satiri Kaydet'in ustunde.

Kart tarafi: `CheckInKarti` menusundeki "Düzenle" bu sayfayi acar; kartin
icindeki duzenleme alani, ilgili state ve stiller SILINIR. Ekranlar
(`index`, `profil/index`) `onDuzenleKaydet(id, degisiklikler)` ile tek
noktadan alir: `{ not, ifade, fotograflar: { kalanYollar, yeniUriler },
etiketEkle, etiketKaldir }`. Ekran lib cagrilarini yapar ve listeyi
yerinde gunceller (bugunku dort ayri handler tek fonksiyona iner).

## 3. Sunucu (tek migrasyon `20260921180000_coklu_fotograf.sql`)

1. `alter table check_inler add column fotograflar text[] not null default '{}'`;
   backfill `update ... set fotograflar = array[fotograf] where fotograf is not null`;
   `check (cardinality(fotograflar) <= 5)`.
2. Politikalar ve indeks dusurulur; `fotograf` sutunu drop + generated
   olarak yeniden eklenir; moderasyon RPC'leri degismeden calisir
   (test:sema ile olculur).
3. `check_in_yap` yeniden (8 parametre; eski imza drop); `v_fotograflar =
   coalesce(p_fotograflar, case when p_fotograf ... array[..] else '{}')`;
   her eleman icin sahiplik; `cardinality <= 5` yoksa 'En fazla 5 fotograf'.
4. `check_in_fotograflarini_guncelle` (+ eski adi sarmalayan surum).
5. Kova okuma politikasi + delete politikasi (bugunku) korunur; GIN indeks.
6. `mekan_fotograflari` unnest; `verilerimi_disa_aktar` `fotograflar`.
7. `hata-metni.ts`: 'En fazla 5 fotograf' -> `en_fazla_5_fotograf` (7 dil).

## 4. Istemci tipleri

- `CheckIn.fotograflar: string[]` (yollar); `fotograf` alani kalkar.
- `AniGorunumu.fotografUrller: string[]`; `AkisOgesi.fotograflar` +
  `fotografUrller`. `fotografUrl` (check-in baglaminda) kalkar - tsc
  butun kullanimlari gosterir.
- `MekanFotografi` (mekan galerisi) ayni kalir (RPC satir basina bir
  fotograf).

## 5. KVKK

Yeni veri kalemi yok (fotograf zaten vardi); sayi artiyor. Silme
disiplini bugunku gibi: kaldirilan her yol kovadan silinir. Gizlilik
metni "fotograf" diyor, cogul olmasi gerekmiyor. `kvkk-uyum-listesi.md`
maddesi "5'e kadar" diye guncellenir; kullanim kosullari degismez.

## 6. Test

- Jest: `checkin.test` (p_fotograflar), `akis.test`, `fotograf-url`
  (toplu imza), `CheckInDuzenle` bileseni (tum alanlar + Kaydet sirasi +
  Vazgec), form (coklu secim, 5 siniri), kart (kaydirma + rozet),
  galeriler (duzlesme), ekranlar (duzenle -> sayfa -> yerinde guncelleme).
- Canli: `araclar/check-in-fotograf-degistir-canli-test.py` yeni RPC'ye
  gecer + 5 siniri + eski sarmalayici; `test:sema`, `test:gorunurluk`
  (fotograf senaryolari), `check-in-tekrar` betigi.
- Ekran goruntusu: duzenleme sayfasi 390x751 (`tasarim/checkin-duzenle.png`).

## 7. Kapsam disi

Fotograf sirasini surukleyerek degistirme; fotograf kirpma/filtre;
video. Panelde check-in fotograflarinin tumunu gosterme (panel bugun
hicbirini gostermiyor).
