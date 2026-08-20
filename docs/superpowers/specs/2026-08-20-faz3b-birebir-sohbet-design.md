# Faz 3b - Birebir sohbet - tasarim

Tarih: 2026-08-20
Onceki faz: `docs/superpowers/specs/2026-08-19-faz3a-bag-design.md`
Ust spec: `docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`

## Tek cumle

Bag kurmus iki kisi birbirine gercek zamanli mesaj yazabilsin; yazma
yetkisi her mesajda sunucuda olculsun.

## Bu fazin sinirlari

Faz 3 dorde bolunmustu (3a bag, 3b birebir sohbet, 3c mekan odalari,
3d bildirimler). 3a istek akisini ve gorunurluk kademelerini getirdi ama
yazacak yer getirmedi: "sohbet acik" durumu kaydediliyor, kimse kimseye
yazamiyor. Bu faz o boslugu kapatiyor.

Bu faz ayrica **Faz 3a'nin bag modelini degistiriyor**. Sebep asagida
"Onceki fazlardan degisen kararlar" bolumunde.

## Kapsam

### Bu fazda var

- Takibin **karsilikli** hale gelmesi (Faz 3a revizyonu).
- `konusmalar`, `konusma_uyeleri`, `mesajlar` tablolari.
- Tek yazma kapisi: `bag.yazabilir_mi(hedef)`.
- Mesaj gonderme, mesaj kutusu, konusma gecmisi, okunmamis sayisi,
  konusmayi gizleme.
- Supabase Realtime ile canli mesaj akisi.
- Mesaj sikayeti (`sikayet_gonder`'e `mesaj` hedef turu).
- Gorunurluk test kosucusunun kendi kotasini tuketmesine kalici cozum.

### Bu fazda yok

- Mekan odalari (3c), bildirimler ve cihaz jetonlari (3d).
- Mesajda fotograf ve konum paylasimi (ust spec: ilk surumde yok).
- Okundu bilgisi ("mavi tik"). Okunmamis sayisi var, karsi tarafa ne
  zaman okudugun gitmiyor.
- Mesaj duzenleme ve silme.
- Sesli/goruntulu arama, gruplar.

## Onceki fazlardan degisen kararlar

**42. Takip artik karsilikli.** Faz 3a takibi tek yonlu kurmustu: A, B'yi
takip etmek icin istek gonderirdi, B kabul edince yalnizca A->B satiri
olusurdu. Artik kabul **iki yonu de** yaziyor; takip bir "bag" oluyor.
Sonucu: `takipcilerim` gorunurluk kademesi "beni takip edenler" degil
"karsilikli bagli oldugum kisiler" anlamina geliyor, ve bagi koparmak
iki yonu de siliyor.

Sema DEGISMIYOR - `takipler` tablosu oldugu gibi kaliyor, degisen tek
sey satirlarin ne zaman yazildigi. Alternatif olarak sirali cift tutan
tek satirli bir bag tablosu degerlendirildi ve reddedildi: gorunurluk
politikasini, `bag.takip_ediyor_mu`'yu, alti RPC'yi, iki ekrani ve canli
senaryolarin cogunu yeniden yazmak demekti; karsiliginda yalnizca
semasal zarafet veriyordu. Bu turda Faz 3a'nin gorunurluk yuzeyi tek tek
incelenip iki gercek gizlilik acigi bulunup kapatilmisti; o dogrulanmis
yuzeyi yeniden acmamak tercih edildi.

Karsiliklilik tek bir yerde, kabul RPC'sinde kuruluyor. `takipler`
tablosuna yalnizca `security definer` RPC'ler yazabiliyor (insert/update
politikasi bilerek yok), dolayisiyla ikinci satiri atlayan bir yazma yolu
yok.

**43. Yazma kapisi: karsilikli takip VEYA kabul edilmis sohbet istegi.**
Ust spec "takip edince istedigin zaman yazabilirsin" diyordu ve takip o
zaman tek yonluydu; bu, bir takip istegini kabul eden kisinin istemeden
mesaj kutusunu da acmasi demekti. Takip karsilikli olunca bu sorun
ortadan kalkiyor: iki taraf da ayni seyi veriyor, tek tarafli maruz kalma
yok.

Iki yol da kaliyor ve farkli ihtiyaci karsiliyor:

| Yol | Verdigi |
|---|---|
| Takip istegi kabul | Karsilikli bag: check-in gorunurlugu **ve** mesajlasma, kalici |
| Sohbet istegi kabul | Yalnizca konusma. Bag kurulmaz, konum acilmaz |

**44. Konusmayi silmek istegi tuketmiyor.** Ust spec "taraflardan biri
konusmayi silerse kendi tarafindan kaybolur ve o kisiye tekrar
yazabilmek icin yeni bir istek gerekir" diyordu. Bunun yerine yaygin
mesajlasma davranisi secildi: silmek yalnizca **kendi tarafinda gizler**,
karsi taraf yazinca konusma geri gelir.

Bedeli acikca kabul edildi: silmek istenmeyen mesaji DURDURMUYOR. Onun
araci **engelleme**, ve engelleme zaten sessiz ve tam. Kullaniciya
"gizle" denmesinin sebebi de bu - "sil" demek yanlis bir cikis kapisi
vaadi olurdu.

**45. Yetki her mesajda olculuyor, konusma acilirken bir kez degil.**
Bag koparsa (takibi birakma, sohbet istegini geri cekme, engelleme)
konusma **salt-okunur** oluyor: gecmis duruyor ve okunabiliyor, yeni
mesaj yazilamiyor. Yeniden bag kurulursa yazma aciliyor.

Gerekce: Faz 3a'da tam bu sinifta iki gercek acik cikti - bir kural
yalnizca giriste kontrol edildiginde, durum sonradan degisince kural
delinmis oluyor. Konusmanin tamamen silinmesi de degerlendirildi ve
reddedildi: karsi taraf, senin bagi koparman yuzunden kendi gecmisini de
kaybederdi ve bunu anlamazdi.

**46. Okunmamis sayisi var, okundu bilgisi yok.** Uye basina bir
`son_okuma` zaman damgasi yetiyor. Karsi tarafa "ne zaman okudun"
gitmiyor: gizlilik yuzeyi aciyor ve bu uygulamanin cekirdek ilkesiyle
gerilimli, ayrica kapatma tercihi gerektirirdi.

**47. Gorunurluk kademesinin ekran metni `takipcilerim` kaliyor.**
Veritabani degeri de ayni. "Baglantilarim" onerildi ve reddedildi;
kullanicinin tercihi. Boylece veri degeri ile ekran metni ayrismiyor.

## Veri modeli

### Yeni tablo: `konusmalar`

```
konusmalar (
  id                uuid primary key,
  tur               text not null default 'birebir'
                      check (tur in ('birebir', 'mekan_odasi')),
  birebir_anahtar   text unique,
  olusturuldu       timestamptz not null default now()
)
```

`tur` simdilik hep `birebir`; 3c'nin mekan odalari icin duruyor.

`birebir_anahtar` sirali ciftten turer: `least(a,b) || ':' || greatest(a,b)`.
Benzersiz oldugu icin bir ciftin **tek** konusmasi olur ve
bul-ya-olustur yarisa acik degildir. Ayni cift hem takiplesip hem sohbet
istegiyle baglanmis olsa bile tek konusma. `mekan_odasi` satirlarinda
null kalir (unique kisiti null'lari saymaz).

### Yeni tablo: `konusma_uyeleri`

```
konusma_uyeleri (
  konusma_id    uuid not null references konusmalar(id) on delete cascade,
  kullanici_id  uuid not null references auth.users(id) on delete cascade,
  gizlendi_mi   boolean not null default false,
  son_okuma     timestamptz,
  primary key (konusma_id, kullanici_id)
)
```

`gizlendi_mi` karar 44'un tasiyicisi: gizleme uye basina, ve
`mesaj_gonder` iki uyenin de bayragini indiriyor.

### Yeni tablo: `mesajlar`

```
mesajlar (
  id            uuid primary key,
  konusma_id    uuid not null references konusmalar(id) on delete cascade,
  gonderen_id   uuid not null references auth.users(id) on delete cascade,
  metin         text not null check (length(trim(metin)) between 1 and 2000),
  olusturuldu   timestamptz not null default now()
)
```

Indeks: `(konusma_id, olusturuldu desc)` - hem gecmis sayfalamasi hem
son mesaj sorgusu bunu kullaniyor.

### Degisen davranis: `takipler`

Sema ayni. Degisen: kabul iki satir yaziyor, kopartma iki satiri da
siliyor (karar 42).

## Yazma kapisi

Tek yardimci, `bag` semasinda (public'te degil - public'teki her fonksiyon
PostgREST tarafindan RPC olarak sunulur):

```
bag.yazabilir_mi(p_hedef uuid) returns boolean
```

Sirasiyla:

1. Engelli iliski varsa (iki yonden herhangi biri) -> false.
2. Karsilikli takip varsa -> true. **Iki yon de ayri ayri sorulur.**
   Kabul zaten iki satiri da yazdigi icin tek kontrol yeterli olurdu;
   ama basibos bir tek yonlu satir (eski veri, ileride bir hata) o
   durumda sessizce "bagli" sayilirdi. Iki yon sormak bunu veri hatasi
   olarak birakir, guvenlik hatasina donusturmez.
3. Iki yonden birinde `durum = 'kabul'` sohbet istegi varsa -> true.
4. Aksi halde false.

## RPC'ler

Hepsi `public` semasinda, `security definer`, `set search_path = public`,
ilk satirda `auth.uid() is null` kontrolu, sonunda
`revoke execute ... from public, anon;` + `grant ... to authenticated;`.

| RPC | Is |
|---|---|
| `mesaj_gonder(p_kullanici_id, p_metin)` | Kapiyi kontrol eder, konusmayi bulur-ya-olusturur, mesaji yazar, iki uyenin de `gizlendi_mi` bayragini indirir, gonderenin `son_okuma`sini ilerletir |
| `konusmalarim()` | Mesaj kutusu satirlari: konusma id, karsi kisi (id, kullanici_adi, ad), son mesaj metni ve zamani, okunmamis sayisi, `yazilabilir_mi` |
| `mesajlari_getir(p_konusma_id, p_once, p_limit)` | Sayfali gecmis, yeniden eskiye |
| `konusmayi_okundu_isaretle(p_konusma_id)` | `son_okuma`yi `now()` yapar |
| `konusmayi_gizle(p_konusma_id)` | Yalnizca cagiranin `gizlendi_mi` bayragini kaldirir |

`mesaj_gonder` kapi kapaliyken **tek ve ayni** hatayi verir; "engellendin"
ile "henuz bagli degilsiniz" ayirt edilmez (Faz 2b sessizlik ilkesi).

Degisen RPC'ler:

- `takip_istegini_yanitla` - kabulde ters yonu de yazar.
- `takibi_birak` - iki yonu de siler.
- `takipciyi_cikar` - dusuruluyor; `takibi_birak` ile ayni ise indi.
- `sikayet_gonder` - izin verilen hedef turlerine `mesaj` ekleniyor.

## RLS

`konusmalar`, `konusma_uyeleri`, `mesajlar`: RLS acik, **yalnizca select
politikasi**. Yazma tamamen RPC uzerinden; insert/update/delete politikasi
bilerek yok (Faz 3a'daki `takipler` / `sohbet_istekleri` kalibi).

Select politikasi: cagiran konusmanin uyesiyse ve karsi tarafla engelli
iliski yoksa. Realtime aboneligi ayni politikadan gectigi icin ayri bir
filtre kurulmuyor - iki yerde iki kural olsa ayrisirdi.

Sutun yetkisi: **uc tablonun ucunde de** `authenticated` rolunden
`insert`, `update` ve `delete` geri alinir; yalnizca `select` kalir.
Faz 3a'nin final incelemesinde `check_inler`de tam bu eksiklik kritik bir
konum acigina yol acmisti (istemci kendi satirinin `mekan_id`'sini
degistirip hic gitmedigi mekandaki herkesin GPS noktasini okuyabiliyordu);
yeni tablolarda bastan kapatiliyor.

## Gercek zamanli

Supabase Realtime, `mesajlar` tablosunun insert olaylarina abonelik.
Konusma ekrani acikken o konusmanin mesajlari, mesaj kutusu acikken
okunmamis sayilari canli guncelleniyor. Yetki kontrolu okuma RLS'inden
geliyor.

## Ekranlar

| Ekran | Degisiklik |
|---|---|
| `mesajlar` (yeni) | Mesaj kutusu: karsi kisi, son mesaj onizlemesi, okunmamis rozeti, satir basina "Gizle" |
| `sohbet/[kullaniciId]` (yeni) | Konusma: mesaj listesi, yazma alani, sikayet girisi |
| `index` | "Mesajlar" girisi + toplam okunmamis sayisi |
| `kullanici/[id]` | Kapi acikken "Mesaj gonder" butonu |
| `baglar` | Iki takip listesi tek listeye iniyor, tek "Bagi kopar" butonu |

Rota `kullaniciId` uzerinden kuruluyor, `konusmaId` uzerinden degil:
boylece profilden, henuz hic konusma yokken de acilabiliyor. Konusmayi
ilk mesajda `mesaj_gonder` olusturuyor.

Kapi kapaliyken yazma alaninin yerini kisa bir not aliyor; gecmis okunur
kaliyor.

## Hata durumlari

| Durum | Kullaniciya gosterilen |
|---|---|
| Kapi kapali (engelli ya da bagsiz) | "Bu kisiye su an mesaj gonderemezsin." |
| Bos ya da yalnizca bosluk mesaj | Gonder butonu etkin degil |
| 2000 karakteri asan mesaj | "Mesaj cok uzun." |
| Kimliksiz cagri | "Kimlik dogrulamasi gerekli" |
| Ag hatasi | Mevcut Turkce ag hatasi mesaji |

## Test yaklasimi

Iki katmanli, Faz 3a'daki gibi.

**Jest (mock'lu):** istemci modulu (`lib/sohbet.ts`) ve bes ekran.

**Canli veritabani senaryolari:** asil kanit burada, cunku yazma kapisi
bu fazin guvenlik yuzeyi ve mock'lu test onu yapisal olarak olcemiyor.
Yeni senaryolar:

1. Takip kabulu iki satir yaziyor.
2. Bagi koparmak iki satiri da siliyor.
3. Karsilikli takipliler birbirine yazabiliyor.
4. Sohbet istegiyle baglananlar, takip olmadan yazabiliyor.
5. Bagsiz kisi yazamiyor.
6. Engelli kisi yazamiyor; hata mesaji 5 ile **ayni**.
7. Engelleme konusmayi ve mesajlari gizliyor.
8. Bag koptuktan sonra gecmis okunuyor, gonderme reddediliyor.
9. Iki yol da **ayni** konusmaya cikiyor (tek `birebir_anahtar`).
10. Gizlenen konusma, karsi taraf yazinca geri geliyor.
11. Okunmamis sayisi dogru; okundu isaretlenince sifirlaniyor.
12. Kimliksiz cagrilar reddediliyor.
13. `mesajlar` ve `konusma_uyeleri` tablolarina dogrudan yazma
    reddediliyor (sutun yetkisi).

Mevcut 19-28 senaryolari karsilikli takibe gore guncelleniyor.

**Kosucunun kota sorunu bu fazda cozuluyor.** Gorunurluk paketi kendi
senaryolarinda gercek istek gonderiyor ve bunlar gunluk 50 istek
tavanindan dusuyor; tavan ekle-only bir gunlugu saydigi ve istemci o
satirlari tasarim geregi silemedigi icin paket gunde ~8 kosumdan sonra
yanlis alarm vermeye basliyor. 2026-08-20'de iki kez elle temizlemek
gerekti. Bu faz istek gonderen senaryo sayisini belirgin artiriyor, yani
cozumsuz birakilirsa paket kendi kendini kullanilamaz hale getirir ve
fazin kendi dogrulamasini curutur.

**Cozum:** kosucunun `temizle()` adimi, her kosumun sonunda test
hesaplarinin `istek_gunlugu` satirlarini siler. Bunun icin kosucuya
`service_role` anahtari verilir (`mobil/.env` icinde, gitignored;
`TEST_HESAP_SIFRESI` zaten orada duruyor). Temizlik yalnizca **test
hesaplarinin** satirlarini hedefler ve yalnizca test kosucusundadir.

Hesaplari donusumlu kullanmak degerlendirildi ve reddedildi: kotayi
tuketmeyi yavaslatir ama bitirmez, ve senaryolarin hangi hesabi
kullandigini takip etmek senaryolari birbirine baglar - Task 17'de tam
bu tur bir gizli kuplaj (bir senaryonun artigini digerinin test etmesi)
gercek bir hataya yol acmisti.

Urun degismezligi bundan etkilenmiyor: `istek_gunlugu`'nun ekle-only
olmasi **istemciye** karsi zorlanan bir kural (RLS acik, politika yok) ve
o kural yerinde kaliyor. `service_role` zaten RLS'i asan bir yonetici
anahtari; uygulama onu hicbir yerde kullanmiyor.

**Dogrulama seti:** `npx jest --runInBand`, `npm run test:sema`,
`npm run test:gorunurluk`, `npx tsc --noEmit`.

`tsc` bu setin parcasi cunku Jest bu sinif hatayi yapisal olarak
goremiyor: ekran testleri lib modullerini mock'ladigi icin degisen bir
fonksiyon imzasi uygulamayi iki gorev boyunca derlenemez birakmis ve 185
test yesil kalmisti.

## Sonraki adim

Uygulama plani: `superpowers:writing-plans` becerisiyle
`docs/superpowers/plans/2026-08-20-faz3b-birebir-sohbet.md`.
