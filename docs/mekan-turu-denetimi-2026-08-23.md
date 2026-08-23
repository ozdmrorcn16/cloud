# Mekan turu denetimi - 2026-08-23

Kullanicinin istegiyle mekan turlerinin tamami denetlendi. Cerceveyi
kullanici koydu: "Konum okulsa okul gorulmeli apartsa apart parksa park
siteyse site yolsa yol", "Butun turleri denetlesinler ajanlar",
"Hataya yer yok".

Alti bagimsiz denetim ajani calisti; her biri canli veritabanina karsi
YALNIZCA SELECT calistirdi, kuralini SQL ile saydi ve ornek uzerinde
yanlis-pozitif testinden gecirdi.

| Ajan | Alan | Kural | Etkilenen kayit |
|---|---|---|---|
| 1 | Genel ve belirsiz turler | 25 | 13.623 |
| 2 | Yeme-icme | 21 | ~10.000 |
| 3 | Konaklama, konut, kamu | 14 | 15.113 |
| 4 | Ticaret ve hizmet | 18 | ~34.500 |
| 5 | Egitim ve saglik | 25 | 14.189 |
| 6 | Acik alan, kultur, spor, ulasim | 39 | ~12.200 |

Kurallar arasinda cakisma var; tekil kayit sayisi toplamdan dusuktur.

## Uc kok neden

Denetimin asil degeri tek tek kayitlar degil, hepsinin altindaki uc
sistemik hataydi.

### 1. `lower('İ')` PostgreSQL'de bozuk

Uc ajan birbirinden bagimsiz olarak ayni seyi buldu ve olculdu:

```sql
select 'SİTESİ' ~* 'sitesi';                      -- false
select lower('İ') = 'i';                          -- false ('i' + U+0307)
```

Sonuc: `~*` ve `ilike` ile yazilmis **her** ad kurali, Turkce buyuk İ
tasiyan adlarda sessizce yarim calisiyordu. Olculen ornek:

| Sorgu | Bulunan |
|---|---|
| `tur='İlkokul' and ad like '%İlkokul%'` | 3.492 |
| `tur='İlkokul' and ad ilike '%ilkokul%'` | 1.625 |
| `tur='İlkokul' and tr_kucuk(ad) ~ 'ilkokul'` | 5.153 |

Bunun iki ayri sonucu vardi:

- Daha once uygulanan konut ayristirmasi "SİTesİ", "Evlerİ", "TOKİ"
  yazimlarini hic gormedi; 147 kayit yalnizca normalizasyondan sonra
  yakalandi.
- **Aramanin kendisi bozuktu.** `yakin_mekanlar` ve
  `yakin_mekanlar_yogunluk` RPC'leri `ad ilike '%' || p_arama || '%'`
  kullaniyordu; kullanici "istanbul" yazinca "İstanbul Kafe" BULUNMUYORDU.

Cozum: `public.tr_kucuk(text)` (migrasyon `20260823140000`). Turkce
harfleri once ASCII'ye cevirir, sonra kucultur - sira onemli, cunku
`lower()` once calisirsa birlesen nokta zaten dogmus olur. Bundan sonra
butun ad kurallari ve arama bu fonksiyondan gecer. Yan fayda: desenler
saf ASCII yazilabiliyor, `[iİıI]` gibi varyantlara gerek kalmiyor.

### 2. `duzelt()` isme hic bakmiyordu

`araclar/kategori-eslemesi.py` icindeki `duzelt()`, ana kategori acik
alansa (`beach`, `mountain`, `park`...) ve alternatiflerden herhangi
biri konaklama sinyali tasiyorsa kaydi otele ceviriyordu - **adi hic
okumadan**. "Fatih Mahallesi", "Doğancık Köyü", "Ayralaksa Yaylası" bu
yuzden `Otel` gorunuyordu. Tek basina bu kusur 9.456 kayit uretti ve
`Otel` turunun yaklasik %17'sini kirletti.

Cozum: `duzelt()` artik `ad` parametresi aliyor ve `toponim_mi()` ile
adin bir yer adi olup olmadigina bakiyor. Konaklama override'i yalnizca
ad bir yer adi DEGILSE uygulaniyor. "Park Apt" hala Otel, "Fatih
Mahallesi" degil.

### 3. Esleme sozlugunde olu anahtarlar

`police_station` ve `fire_station` yazilmisti; Overture
`police_department` / `fire_department` yolluyor. Sonuc: `Karakol` ve
`İtfaiye` turleri veritabaninda **0 kayitti**, gercek karakollar
otel/tarihi yer altinda duruyordu. Ayni sinifta `Kasap`, `Manav`,
`Hamam` da bosti - sozlukte tanimliydilar ama hicbir kategori onlara
baglanmamisti.

## Silme yerine gizleme

Denetim ~15.000 kaydin **mekan olmadigini** buldu: yol parcalari
("Bolu-Ankara Otobanı"), koy ve mahalle adlari, kargo firmalari, parke
bayileri, ayni telefon numarasiyla onlarca ilcede tekrar eden ikinci-el
SEO ilanlari.

Bunlar SILINMEDI, `tur = 'yer-degil'` yapildi ve okuma yollari onu
`'test'` gibi disarida birakiyor. Gerekce: silme geri alinamaz, gizleme
alinabilir; ayrica `check_inler.mekan_id` cascade oldugu icin bir silme
hatasi kullanicilarin anilarini da goturur.

## Geri alma kaydi

`public.tur_duzeltme_gecmisi` tablosu her degisikligin eski turunu,
yeni turunu ve kural adini tutar. RLS acik, politika yok - yani
`service_role` disinda kimse okuyamaz. Bir kural ornekte temiz gorunup
genelde bozuk cikarsa geri alinabilir:

```sql
update public.mekanlar m
   set tur = g.eski_tur
  from public.tur_duzeltme_gecmisi g
 where g.mekan_id = m.id and g.kural = '<kural adi>';
```

## Uygulanmayanlar

Ajanlarin DUSUK GUVEN isaretledigi kurallar uygulanmadi. Ikisi ozellikle
kayda deger, cunku uygulansalardi dogru veriyi bozacaklardi:

- `ATM` turundeki "Şubesi" gecen 1.775 kayit gercek ATM'dir; Turk
  bankalari ATM'yi bulundugu subeye gore adlandiriyor.
- `Süpermarket` turundeki 2.951 kaydin hedefi belirsiz (kirtasiyeden
  tekstile kadar karisik); yalnizca adi sarkuteri/gurme olanlar tasindi.

Ayrica bir ajan iki kurali bilerek yazmadi ve gerekcesini raporladi -
her ikisi de dogru kayitlara zarar veriyordu.

## Yanlis pozitife karsi alinan onlemler

Kullanicinin uyarisi kurallarin yazim bicimini belirledi: "Sadece
sonundaki kelime bazen yaniltici olabilir bunuda dikkate al". Uygulanan
ilke: **isletme sinyali konut sinyalini ezer**. "Ottoman Hotel Altay
Sitesi" bir site degil oteldir.

Uc dislama sartsiz zorunludur, ajanlar bunlari ayrica olctu:

| Kural | Dislama olmasa | Ne bozulurdu |
|---|---|---|
| Park icinde konut sitesi | +38 kayit | Gercek parklar ("Sanayi Sitesi Parkı") |
| Cami icinde konut sitesi | +67 kayit | Gercek camiler ("Keresteciler Sitesi Camii") |
| Cami icinde kilise | +5 kayit | Kiliseden cevrilmis, bugun cami olan yapilar |

Son satir ozellikle onemli: "Kilise Camii Güzelyurt" gibi kayitlar
tarihsel olarak kiliseydi ama bugun camidir; naif bir kural onlari
yanlis siniflandirirdi.

## Kod tarafinda degisenler

- `araclar/kategori-eslemesi.py` - olu anahtarlar duzeltildi, 22 yeni
  tur eklendi, `duzelt()` ada bakiyor, `toponim_mi()` eklendi.
- `araclar/mekan-yukle-overture.py` - `duzelt()` cagrisina ad gecti;
  toponim adli kayitlar yuklemede `yer-degil` isaretleniyor.
- `araclar/tur-duzeltmeleri.py` - denetimin butun kurallari, kaynagiyla
  birlikte.
- `mobil/lib/mekan.ts` - yeni turler sosyal tur kumesine eklendi.
- `mobil/src/tasarim/MekanIkonu.tsx` - yeni turler ikon eslemesine
  eklendi.

Migrasyonlar: `20260823140000` (tr_kucuk + tur indeksi), `141000`
(duzeltme kapisi), `142000` (geri alma kaydi), `143000` (arama
duzeltmesi + `yer-degil` filtresi).
