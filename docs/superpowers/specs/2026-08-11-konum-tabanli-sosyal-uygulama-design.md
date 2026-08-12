# Konum tabanli sosyal uygulama — tasarim

Tarih: 2026-08-11
Durum: ilk surum tasarimi, kullanici onayindan gecti

## Tek cumle

Bir mekana check-in yaparsin, civarindaki insanlari gorursun, mekan odasinda
konusursun, sevdiginle takiplesip birebir sohbete gecersin.

## Hedef kitle

Yakinindaki **yabancilarla tanismak** isteyen kisiler. Yeni bir sehre tasinmis,
cevresi olmayan, yeni insan aramaya acik insanlar. Mevcut arkadaslarla bulusma
uygulamasi degil; tanisma uygulamasi.

Bu secim uygulamayi en zor kategoriye sokuyor: yabancilar birbirinin nerede
oldugunu goruyor. Guvenlik tasarimi bu yuzden sonradan eklenen bir ozellik
degil, mimarinin parcasi.

## Cekirdek dongu

```
mekana check-in → yakindakileri gor (≈mesafe + mekan) → mekan odasinda konus
                                                              ↓
                        birebir sohbet ← kabul ← sohbet / takip istegi
```

## Kapsam

### Ilk surumde var

| Parca | Aciklama |
|---|---|
| Kayit + telefon dogrulama | Telefon numarasi + sifre, ardindan SMS dogrulamasi. Dogrulanmamis hesap uygulamayi kullanamaz |
| Profil | Asgari: ad, dogum tarihi, birkac fotograf, kisa yazi |
| Mekan + check-in | Mekan listesinden secip check-in. Urunun kalbi |
| Yakindakiler | Ayarlanan yaricap icindeki kullanicilar, yaklasik mesafeyle |
| Check-in gorunurlugu | Yakindaki biri check-in yaptiysa **nerede** oldugu da gorunur |
| Mekan odasi | Ayni mekana check-in yapanlarin ortak sohbeti |
| Sohbet istegi | Kabul edilirse konusma acilir |
| Takip istegi | Kabul edilirse kalici bag; istenilen zaman yazilabilir |
| Birebir sohbet | Gercek zamanli mesajlasma |
| Engelleme + sikayet | Pazarlik konusu degil; magaza da sart kosuyor |
| Ucretli paket | Mesafe ayarinin genisi (asagida) |

### Ilk surumde yok

Harita gorunumu, sesli/goruntulu arama, hikayeler, gruplar, etkinlik
olusturma, begeni/eslesme mekanigi, kesif algoritmasi, mesajda fotograf ve
konum paylasimi, kademeli paketler, reklam.

Hicbiri cekirdek donguyu calistirmak icin gerekli degil. Hepsi sonradan
eklenebilir.

## Bag modeli

Profilde **iki buton** var:

- **Sohbet iste** — "su an konusmak istiyorum". Kabul edilirse konusma acilir
  ve iki taraf da yazabilir. Konusma her iki tarafin mesaj kutusunda durur;
  taraflardan biri konusmayi silerse kendi tarafindan kaybolur ve o kisiye
  tekrar yazabilmek icin yeni bir istek gerekir. Takip bagi kurulmaz —
  konusmanin devami ancak taraflardan biri takip istegi gonderirse saglanir.
- **Takip et** — "bagimizi surdurelim". Kabul edilirse kisi listende durur ve
  istedigin zaman yazabilirsin.

Ikisi farkli ihtiyaci karsiliyor: biri anlik tanisma, digeri iliskiyi
surdurme. Istek gonderilmeden mesaj ulasmaz; istenmeyen mesaj yuzeyi bastan
kapali.

Takip tek yonlu: A, B'yi takip etmek icin istek gonderir, B kabul ederse A
yazabilir. B'nin de A'ya yazabilmesi icin B'nin ayrica takip etmesi gerekir.

## Konum modeli

Iki gorunurluk kanali var:

1. **Mekan ici** — ayni yere check-in yapanlar birbirini gorur, aralarinda bag
   olmasa bile.
2. **Mesafe** — ayarlanan yaricap icindeki kullanicilar gorunur. Biri bir yere
   check-in yaptiysa **mekan adi da gorunur**.

Surekli arka plan konum takibi **yok**. Kullanici bilincli olarak check-in
yapar; yapmadiginda konumu hicbir yerde islenmez.

Buna ragmen "yakindakiler" sorgusunun kullanicinin konumunu bilmesi gerekiyor.
Celiski degil, ayrim su: konum **yalnizca uygulama on plandayken ve kullanici
yakindakiler ekranini actiginda** okunur, sorguya parametre olarak gecer ve
**kaydedilmez**. Kalici olarak yazilan tek konum, kullanicinin kendi
iradesiyle yaptigi check-in'dir. Yani sistemde "kullanicinin konumu" diye bir
alan yok; check-in var.

### Yogunluk (soguk baslangic) cozumu

Uygulama Turkiye geneline acilacak, yani cogu kullanicinin yakininda kimse
olmayacak. Tasarim buna su sekilde cevap veriyor:

- Mekanlar **onceden yuklu** gelir. Kullanici bos ekran yerine "buraya ilk
  check-in yapan sen ol" gorur.
- Mekan odalari **kalici**. Dun yazilan mesaj durur, oda hic bos gorunmez.
- Sonuc bossa **daha genis yaricaptaki sayi gosterilir**: "10 km'de kimse yok.
  50 km'de 12 kisi var." Kisiler degil sadece sayi. Hem bos ekran cozulur hem
  odeme teklifi ihtiyac aninda cikar.

## Mesafe ayari ve gelir modeli

Ilke: **ucretsiz kullanici gorur, ucretli kullanici secer.** Ucretsiz deneyimi
kisitlayarak degil, ucretliye kontrol satarak para kazaniyoruz.

| | Ucretsiz | Ucretli |
|---|---|---|
| Yakindakileri gorme | Var | Var |
| Yaricap ayari | 1–10 km arasinda | 500 m – 500 km |
| Baska sehre bakma | Yok | Var |
| Mekan check-in ve odalar | Tam | Tam |
| Sohbet, takip, mesajlasma | Sinirsiz | Sinirsiz |

**Mesajlasma asla ucretli olmayacak.** Konusmayi kesen paywall bu kategoride
kullaniciyi dogrudan kaciriyor ve magaza incelemesinde sorun cikarabiliyor.
Gelir kesfin genisliginden gelir, iletisimin kendisinden degil.

Ilk surumde tek paket: aylik abonelik, tek fiyat.

**Magaza kisiti:** dijital abonelik Apple ve Google'in kendi odeme sistemleri
uzerinden satilmak zorunda, komisyon %15–30. Kredi kartini dogrudan almak
magaza kurallarina aykiri ve uygulamanin kaldirilma sebebi. Fiyatlama bu
komisyona gore yapilmali.

## Guvenlik ve mahremiyet

Yabancilarin birbirinin bulundugu mekani gordugu bir uygulama yapiyoruz. Bu
bolum sonradan eklenemez.

- **Check-in'in omru var.** Birkac saat sonra kendiliginden duser. Kimse dun
  nerede oldugunu goremez. Uygulama "su an buradayim" der, "hayatim soyle
  geciyor" demez.
- **Gizli check-in.** Mekana girip odada konusabilirsin ama yakindakiler
  listesinde gorunmezsin.
- **Check-in'i kim gorsun.** Herkes / sadece takipcilerim / kimse. Varsayilan
  "herkes" (urunun ozu bu), degistirmesi tek dokunus.
- **Engelleme cift tarafli ve sessiz.** Engellenen kisi seni hicbir listede ve
  hicbir mekan odasinda goremez, engellendigini de anlamaz. "Engellendim"
  bilgisi cogu zaman misilleme getirdigi icin bu sekilde kuruluyor.
- **Sikayet her ekranda:** profil, mesaj, mekan odasi. Sikayet edilen icerik
  incelemeye duser, tekrarlayan hesap kapanir. Ilk surumde moderasyon elle.
- **Konum verisi saklanmiyor.** Check-in dustugunde kaydi da silinir. KVKK
  acisindan en temiz cevap "tutmuyoruz".

## Yas politikasi

Alt sinir **18**. (2026-08-12 karari — ilk surumde 16 idi, veli onayi
karmasikligindan kacinmak icin 18'e cikarildi.)

Kayit sirasinda dogum tarihinden yas hesaplanir; 18'in altindaysa kayit
reddedilir. Yas bandi ayrimi ve veli onayi akisi **yok** — tek bir yetiskin
kullanici kitlesi var, ek bir gorunurluk katmani veya onay adimi gerekmiyor.

## Teknik mimari

**Secim: Expo (React Native) + Supabase.**

Gerekce cografi sorgu. Uygulamanin en sik calistiracagi is "10 km icinde kim
var" sorusu. Supabase'in altinda PostgreSQL + PostGIS var, bu soru tek satir
SQL. Ustune gercek zamanli abonelik (sohbet), telefon+SMS kimlik dogrulama ve
dosya depolama (profil fotograflari) hazir geliyor. Expo tarafinda tek kod
tabanindan iki magazaya cikiliyor ve kucuk degisiklikler magaza incelemesi
beklemeden gonderilebiliyor.

**Elenen secenekler:**

- *Firebase* — bildirim altyapisi daha olgun ama cografi sorguyu dogrudan
  desteklemiyor; "yakindakiler" icin geohash el isi gerekiyor. Mesafe filtresi
  urunun kalbi oldugu icin bunu elle yazmak istemiyoruz. Olceklendiginde
  faturasi da surpriz yapiyor.
- *Kendi sunucumuz* — en fazla kontrol, ama kimlik dogrulama, gercek zamanli
  baglanti, dosya yukleme ve bildirimi sifirdan yazmak isi aylarca uzatir. Urun
  tutarsa sonradan gecilebilir; Supabase acik kaynak oldugu icin o kapi kapali
  degil.

### Bilesenler

| Bilesen | Teknoloji |
|---|---|
| Mobil uygulama | Expo (React Native), TypeScript |
| Veritabani | PostgreSQL + PostGIS (Supabase) |
| Kimlik dogrulama | Supabase Auth, telefon + SMS |
| Gercek zamanli sohbet | Supabase Realtime |
| Dosya depolama | Supabase Storage (profil fotograflari) |
| Bildirim | Expo Notifications → FCM / APNs |
| Abonelik | Magaza ici satin alma (RevenueCat ile sadelestirilebilir) |

### Veri modeli taslagi

```
profiller        (id, telefon_dogrulandi, ad, dogum_tarihi,
                  biyografi, fotograflar[], checkin_gorunurlugu)
mekanlar         (id, ad, konum geography(Point), adres, kategori)
check_inler      (id, kullanici_id, mekan_id, konum, olusturuldu,
                  sona_erer, gizli_mi)
takipler         (takip_eden_id, takip_edilen_id, durum, olusturuldu)
sohbet_istekleri (gonderen_id, alan_id, durum, olusturuldu)
konusmalar       (id, tur)            -- birebir | mekan_odasi
konusma_uyeleri  (konusma_id, kullanici_id)
mesajlar         (id, konusma_id, gonderen_id, metin, olusturuldu)
engellemeler     (engelleyen_id, engellenen_id, olusturuldu)
sikayetler       (id, sikayet_eden_id, hedef_tur, hedef_id, sebep, durum)
abonelikler      (kullanici_id, durum, saglayici, biter)
```

### Kritik sorgu

"Yakindakiler" sorgusu su filtrelerden geciyor:

1. `check_inler.sona_erer > now()` — sadece aktif check-in'ler
2. `ST_DWithin(konum, :benim_konumum, :yaricap)` — mesafe
3. `gizli_mi = false` — gizli check-in'ler haric
4. `checkin_gorunurlugu` tercihine uygun olanlar
5. Karsilikli engelleme kaydi olmayanlar

Bu sorgu urunun en sik calisan islemi; PostGIS uzamsal indeksi bu yuzden
onemli.

## Hata durumlari

| Durum | Davranis |
|---|---|
| Konum izni reddedildi | Uygulama calisir, check-in yapilamaz. Izin isteme sebebi acikca yazilir |
| SMS gelmedi | Tekrar gonder (bekleme sureli), farkli numara ile devam secenegi |
| Ag yok | Mesajlar kuyrukta bekler, baglanti gelince gonderilir. Yakindakiler son bilinen liste + "guncel degil" uyarisi |
| Yaricapta kimse yok | Bos ekran yerine daha genis yaricaptaki sayi + paket teklifi |
| Mekan bulunamadi | Yakindaki mekanlar listelenir; kullanici mekan olusturamaz (ilk surumde) |
| Abonelik dogrulanamadi | Ucretsiz kademeye duser, veri kaybi olmaz |

## Test yaklasimi

- **Birim:** yakindakiler sorgusunun filtreleri (mesafe, gizlilik,
  engelleme) tek tek test edilir. Bu sorgu yanlis calisirsa mahremiyet ihlali
  olur, o yuzden en cok test edilecek yer burasi.
- **Entegrasyon:** kayit → dogrulama → profil → check-in → yakindakiler →
  istek → sohbet akisi ucdan uca.
- **Guvenlik:** engellenen kullanicinin hicbir yuzeyde gorunmedigi ayrica
  dogrulanir.

## Fazlar

Bu tasarim tek bir uygulama planina sigmayacak kadar buyuk. Dort faza
ayriliyor; her fazin sonunda calisan bir uygulama var.

**Faz 1 — Hesap.** Kayit, telefon dogrulama, profil olusturma, oturum. Sonunda:
kullanici hesap acabiliyor ama henuz kimseyi gormuyor. Kayitta 18 yas alt
siniri dogrulanir.

**Faz 2 — Kesif ve guvenlik.** Mekanlar, check-in, yakindakiler sorgusu, mesafe
ayari (ucretsiz aralik), gizli check-in, gorunurluk tercihi, **engelleme ve
sikayet**. Sonunda: kullanicilar birbirini goruyor.

Engelleme ve sikayet bu faza ait, sonrakine degil. Kullanicilarin birbirini
gordugu ilk an, korunmaya ihtiyac duyduklari ilk andir.

**Faz 3 — Bag ve sohbet.** Sohbet istegi, takip istegi, birebir mesajlasma,
mekan odalari, bildirimler. Sonunda: cekirdek dongu tamam.

**Faz 4 — Gelir.** Abonelik, genis mesafe ayari, sehir secimi, magaza ici satin
alma. Sonunda: uygulama para kazanabiliyor.

Her faz kendi spec → plan → uygulama dongusunden gecer. Bir sonraki adim
Faz 1'in planini yazmak.

## Acik sorular

Bunlar ilk surumu engellemiyor ama yazilmadan once cevaplanmali:

1. Mekan verisi nereden gelecek? (Google Places, OpenStreetMap, elle giris)
2. Check-in kac saat sonra dussun?
3. Ucretli paketin fiyati ne olacak? (magaza komisyonu dusuldukten sonra)
4. SMS saglayicisi hangisi? (Turkiye icin yerel saglayici daha ucuz)
5. Ilk moderasyonu kim yapacak?

## Sonraki adim

Faz 1'in (hesap: kayit, telefon dogrulama, profil) uygulama plani.

## Notlar

`check_inler` tablosu hem `mekan_id` hem `konum` tutuyor. Bu bilincli bir
tekrar: yakindakiler sorgusu dogrudan `check_inler` uzerinde uzamsal indeks
kullanabilsin diye. Mekanin konumu sonradan duzeltilirse gecmis check-in'ler
etkilenmez, bu da istenen davranis.
