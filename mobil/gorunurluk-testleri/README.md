# Gorunurluk testleri

Bu testler **gercek** Supabase projesine baglanir ve RLS kurallarinin
gercekten uygulandigini dogrular. `npm test` (Jest) icindeki testler
Supabase'i mock'lar; bu yuzden bir RLS hatasini yakalayamazlar.

Faz 2a'da tam olarak bu oldu: 66 Jest testi yesilken mekan detay ekrani
canli veritabaninda hic calismiyordu.

## Calistirma

```bash
cd mobil
npm run test:gorunurluk
```

`mobil/.env` icindeki `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` degerlerini kullanir. Ayrica
`TEST_HESAP_SIFRESI` de `mobil/.env` icinde tanimli olmali (asagidaki
"Test kullanicilari" bolumune bak); tanimli degilse betik anlamli bir
hatayla durur.

Varsayilan kosum senaryo 29'u ("gunluk tavan") **atlar** — bkz. asagidaki
"--tavan bayragi" bolumu. Onu ayrica calistirmak icin:

```bash
npm run test:gorunurluk -- --tavan
```

## Test kullanicilari

Faz 1'de tanimlanan ucretsiz test numaralari: `+905550000000` ve
`+905550000001`, ikisinin de SMS kodu `123456`. Betik yoksa olusturur.
Bu iki hesabin sifresi kod icinde gomulu degil; `mobil/.env` icindeki
`TEST_HESAP_SIFRESI` degiskeninden okunur.

Senaryo 22 ve 23, "takipci olmayan ama ayni mekanda bulunan yabanci"
rolu icin ucuncu bir hesap kullanir: `+905550000002` (ayni SMS kodu,
ayni sifre). Bu hesabin profil satiri A/B'den farkli olarak kayit
ekranindan gecmedi; ilk kosumda `ucuncuKullaniciIleBaglan()` tarafindan
dogrudan `profiller`e eklenir (sabit bir dogum tarihiyle, 18 yas
kisitini gecmek icin).

### Faz 3a'da neyin degistigi

`check_in_yap`'in `p_gizli_mi` (boolean) parametresi `p_bulunurluk`
(`'herkese_acik' | 'takipcilerim' | 'gizli'`) oldu. Bu betikteki
`checkInYap` yardimcisi ayni sekilde guncellendi ve artik tam satiri
degil dogrudan check-in id'sini (string) donuyor.

Kural olarak da bir sey tersine dondu: Faz 2b'de (karar #25) `gizli`
bir check-in ayni mekandaki herkese hala gorunurdu (yalnizca kimligi
gizleniyordu). Faz 3a'da (karar #39) bu tersine dondu — `gizli` artik
sahibi disinda **kimseye** gorunmuyor, ayni mekanda olsa bile. 1-10
arasindaki senaryolar bu yeni kurala gore guncellendi; hicbiri artik
"gizli check-in mekanda gorunur" iddiasinda bulunmuyor. Mekan yogunlugu
(`yakin_mekanlar_yogunluk`, senaryo 8/9) bu degisiklikten etkilenmedi:
sayim hep herkesi (gizli dahil) sayiyordu ve saymaya devam ediyor —
"kim oldugu" sorusuyla "kac kisi" sorusu ayri.

## Senaryolar

1-10: Faz 2b (gorunurluk ve guvenlik) — canli check-in gorunurlugu, ani
gorunurlugu, engelleme, gizli check-in, mekan yogunlugu. Faz 3a'da
`gizli_mi` (boolean) `bulunurluk` (uc kademeli metin) oldugu icin bu
senaryolar guncellendi; ayrintisi yukaridaki "Faz 3a'da neyin degistigi"
bolumunde.

11-17: Faz 2c (kimlik ve kisi arama):

- **11 — Kullanici adi benzersizligi.** A, B'nin kullanici adini almaya
  calisir, sunucu reddeder.
- **12 — Bicim kurallari sunucuda zorunlu.** Gecersiz formatlar
  (`kullanici_adi_degistir`) ve buyuk/kucuk harf duyarsizligi
  (`kullanici_adi_musait_mi`) sunucu tarafinda reddedilir.
- **13 — 30 gun kurali sunucuda tutar.** Bkz. asagidaki "30 gun kurali
  neden dolayli test ediliyor" bolumu.
- **14 — Arama kullanici adi ve isimle bulur.** Kismi eslesme, tek
  karakterli aramanin bos donmesi, kullanicinin kendini bulamamasi.
- **15 — Aramada gorunme kapatilinca cikmaz.** `aramada_gorunsun = false`
  arama sonuclarindan cikarir; pozitif kontrol olarak geri acilinca
  yeniden gorunur.
- **16 — Engelleme aramayi iki yonde de keser.** Hem engelleyen hem
  engellenen taraf digerini aramada bulamaz.
- **17 — Kimliksiz cagrilar reddedilir.** Oturum acmamis ham bir anon
  istemciyle `kullanici_adi_musait_mi` ve `kisi_ara` cagrilari hata
  doner.
- **18 — Profil fotografi imzali URL ile okunabiliyor.** B, A'nin
  profil fotografini imzali URL ile gercekten indirebiliyor; A, B'yi
  engelledikten sonra artik indiremiyor. Senaryo, kendi ic mantigi
  geregi A -> B blogunu kurulu birakarak bitiyor (bkz. asagidaki not).

19-31: Faz 3a (bag: takip, sohbet istegi, uc kademeli bulunurluk):

- **19 — Istek gonderilir.** A, B'ye takip istegi gonderir; hem A hem B
  `takipler` tablosunda satiri `beklemede` durumunda gorur. Senaryo
  kendi istegini hemen temizler (`takibi_birak`), cunku 20/21 ayni
  ciftle temiz baslamak zorunda.
- **20 — Kabul edilmeden uzaktan gorunmez.** B, mekan-1'de canli
  `herkese_acik` check-in yapar; A mekanda degil ve istegi henuz kabul
  edilmedi — A, B'nin check-in'ini goremez.
- **21 — Kabul edilince uzaktan gorunur.** Ayni kurulum; B istegi kabul
  edince A, mekana gitmeden B'nin canli check-in'ini gorur. Bu iki
  senaryo taslak spesifikasyonunda birebir verildigi icin (A -> B
  takibi kasitli olarak deferred cleanup'a birakiliyor) 21, 20'nin
  biraktigi beklemedeki istegi devam ettiriyor.
- **22 — 'takipcilerim' yabanciyi disari birakir.** B ayni mekanda
  `takipcilerim` ile check-in yapar; takipcisi olan A gorur (saglama),
  takipcisi olmayan ve ayni mekandaki ucuncu hesap C goremez.
- **23 — 'gizli' kimseye gorunmez.** B `gizli` ile check-in yapar; ne
  takipcisi A ne ayni mekandaki C gorur, yalnizca B kendi satirini
  gorur. Faz 2b'nin eski kurali (gizli check-in ayni mekandakilere
  gorunurdu, karar #25) burada tersine donuyor (karar #39).
- **24 — Engelleme takibi kaldirir.** A, B'yi engelleyince `takipler`
  satiri kayboluyor ve A artik B'nin (onceden gorebildigi)
  `takipcilerim` check-in'ini goremiyor.
- **25 — Engelliyken istek gonderilemez.** B, kendisini engellemis
  A'ya istek gondermeye calisir; hata mesaji "bulunamadi" icerir,
  "engellendin" demez (Faz 2b sessizlik ilkesi).
- **26 — Baskasinin istegi kabul edilemez.** A, C'ye istek gonderir,
  sonra kendi gonderdigi istegi kabul etmeye calisir — RPC yalnizca
  aliciyi (`takip_edilen_id = auth.uid()`) kabul ettigi icin reddedilir.
- **27 — Ani donusumu genisletmez.** `takipcilerim` ile check-in
  yapip ayrilinca ani `takipcilerim` kalir (genislemez); `gizli` ile
  yapip ayrilinca ani `kimse` olur (daralir). `bag.ani_gorunurlugu`
  yardimcisini dogrudan degil, `check_inden_ayril` uzerinden dolayli
  test ediyor.
- **28 - Bagi koparinca akis kesilir.** Faz 3b'de karsilikli takibe
  gore guncellendi (bkz. asagidaki "Faz 3b'de neyin degistigi"):
  B, `takibi_birak` cagirinca (eski `takipciyi_cikar` artik yok) hem
  A->B hem B->A satiri `takipler`den kayboluyor ve A artik B'nin
  `takipcilerim` check-in'ini goremiyor.
- **29 — Gunluk tavan.** Bkz. asagidaki "--tavan bayragi" bolumu;
  varsayilan kosumda calismaz.
- **30 — Kimliksiz cagrilar reddedilir.** Oturum acmamis ham bir anon
  istemciyle `takip_istegi_gonder` ve `bag_kisileri` cagrilari hata
  doner.
- **31 - `ani_gorunurlugunu_ayarla` genisletmeyi kelepceler.** Gizli
  kokenli bir ani (`check_inden_ayril` ile 'gizli'den donusmus, yani
  gorunurlugu 'kimse') RPC ile 'herkese_acik'a genisletilmeye
  calisilir; `bag.ani_gorunurlugu` yardimcisi bunu engelledigi icin
  deger 'kimse' olarak kaliyor ve A anisi hala goremiyor.

32-44: Faz 3b (birebir sohbet: mesaj gonderme, mesaj kutusu, okunmamis
sayisi, gizleme, karsilikli takibin yazma kapisiyla iliskisi):

- **32 - Kabul iki satir yazar.** A istek gonderir, B kabul eder;
  `takipler`de hem A->B hem B->A satiri `kabul` durumunda beliriyor
  (karar 42). On kosul olarak, gonderilmeden once ciftin arasinda hic
  satir olmadigi ayrica dogrulaniyor.
- **33 - Bagi koparmak iki satiri da siler.** Senaryo 32'nin biraktigi
  karsilikli bagi kullanir; A `takibi_birak` cagirinca TEK cagriyla
  iki yonun ikisi de gidiyor. On kosul olarak bagin IKI satirinin da
  gercekten durdugu burada ayrica sorulur - boylece 32 tek satir
  yazsaydi bu senaryo yaniltici bir OK basmaz.
- **34 - Karsilikli takipliler yazabilir.** Bag kurulunca A, `mesaj_gonder`
  ile B'ye yazabiliyor; B bu mesaji `mesajlari_getir` ile gercekten
  okuyabildigini gosteriyor (pozitif kontrol). Senaryo kendi bagini ve
  olusturdugu konusmayi (yonetici istemcisiyle) temizler.
- **35 - Sohbet istegiyle baglananlar yazabilir.** Takip bagi YOKKEN,
  yalnizca kabul edilmis bir sohbet istegiyle A, B'ye yazabiliyor.
  Kabul edilmis bir sohbet istegini kaldiran ayri bir RPC olmadigi icin
  (`sohbet_istegini_geri_cek` yalnizca beklemedeki istegi kaldirir)
  temizlik gecici bir engelle/engeli_kaldir cifti ile yapiliyor - net
  etki yalnizca sohbet baginin kalkmasi.
- **36 - Bagsiz kisi yazamaz.** Ne takip ne sohbet bagi varken A, B'ye
  yazamaz; hata mesaji "mesaj gonderemezsin" iceriyor ve hicbir
  konusma satiri olusmuyor. Bu senaryonun yakaladigi hata metni,
  37 ve 39'da birebir karsilastirma icin saklaniyor.
- **37 - Engelli yazamaz, hata AYNI.** Engelin TEK degisken olmasi
  gerekiyor, yoksa senaryo yalnizca 36'yi tekrar eder. Akis: (1) iki
  `kabul` satiri yonetici istemcisiyle dogrudan `takipler`e yazilir -
  bagi genel RPC'lerle kurmak ise yaramaz, cunku `engelle` iki yondeki
  takip ve sohbet satirlarini kosulsuz siliyor; (2) bu bagla B'nin
  A'ya yazabildigi gosterilir (pozitif saglama); (3) A, B'yi engeller;
  (4) **engellemenin bagi da sildigi ayrica dogrulanir ve bag yonetici
  istemcisiyle YENIDEN yazilir** - kritik adim bu, yoksa ikinci
  denemede cift hem engelli hem bagsiz olur ve red engelden degil
  bagsizliktan gelirdi; (5) cift artik hem ENGELLI hem BAGLI (iki
  `kabul` satiri yerinde, sohbet bagi yok - yani yazma yetkisinin tek
  kaynagi karsilikli takip) ve B yine yazamaz. Hata mesaji senaryo
  36'daki bagsizlik hatasiyla **birebir ayni** (Faz 2b sessizlik
  ilkesi: "engellendin" ile "bagsizsin" ayirt edilmiyor). Temizlik:
  `engeli_kaldir` engelden sonra yazilan satirlari SILMEZ, bu yuzden
  onlar yonetici istemcisiyle acikca silinir ve gittikleri dogrulanir.
- **38 - Engelleme konusmayi gizler.** Engellemeden once B hem kendi
  hem A'nin mesajini goruyor (pozitif kontrol); A, B'yi engelleyince
  B artik yalnizca kendi mesajini goruyor, A'nin mesajlari `mesajlar`
  tablosunun RLS'i tarafindan filtreleniyor.
- **39 - Bag kopunca salt-okunur.** Bagli A mesaj gonderir; bagi
  koparinca (`takibi_birak`) gecmis (`mesajlari_getir`) hala
  okunabiliyor ama yeni mesaj denemesi 36'daki AYNI hatayla
  reddediliyor (karar 45: yetki her mesajda olculuyor). `konusmalarim`
  satirindaki `yazilabilir_mi` alani da burada olculuyor: bag varken
  `true`, bag koptuktan sonra `false` - istemcinin yazma kutusunu acip
  kapatan alan boylece canli veritabaninda dogrulanmis oluyor.
- **40 - Iki yol ayni konusmaya cikar.** Once sohbet istegiyle
  mesajlasip sonra ayrica takiplesince, iki `mesaj_gonder` cagrisi
  AYNI konusma id'sini donuyor ve A'nin `konusmalarim` listesinde B
  ile yalnizca TEK satir var (`birebir_anahtar` benzersizligi).
- **41 - Gizlenen konusma geri gelir.** A, `konusmayi_gizle` cagirinca
  B `konusmalarim` listesinden kayboluyor (gizlemeden once orada
  oldugu ayrica dogrulanmis); B yazinca `mesaj_gonder` iki uyenin de
  bayragini indirdigi icin konusma A'nin listesinde tekrar beliriyor
  (karar 44).
- **42 - Okunmamis sayisi dogru.** B iki mesaj yazinca A'nin
  `konusmalarim` satirinda `okunmamis = 2` (ve `son_mesaj` gercekten
  ikinci mesaja isaret ediyor); A `konusmayi_okundu_isaretle`
  cagirinca sayac `0`a doner.
- **43 - Kimliksiz cagrilar reddedilir.** Oturum acmamis ham bir anon
  istemciyle `mesaj_gonder` ve `konusmalarim` cagrilari hata doner.
- **44 - Kendine mesaj yok.** A, kendine `mesaj_gonder` cagirir; RPC
  bunu bag kontrolunden ONCE reddeder ("Kendine mesaj gonderemezsin")
  ve hicbir konusma satiri olusmuyor.

Bu bloktaki senaryolar (34, 35, 37, 38, 39, 40, 41, 42) kendi
olusturdugu takip/sohbet baglarini, engellemeleri ve mesajlasma
satirlarini kendi icinde temizler; hicbir temizlik adimi sessiz
degildir, hepsi `esitMi` ile dogrulanir - "hata donmedi" degil, "satir
gercekten gitti" iddia edilir.

**Tek istisna senaryo 32:** kurdugu karsilikli bagi BILEREK temizlemez,
senaryo 33'e birakir. 33'un iddiasi (tek `takibi_birak` cagrisiyla iki
satirin da gitmesi) tam olarak o bagi gerektiriyor; 33 bagi koparir ve
gittigini dogrular, yani blok yine kalintisiz kapanir.

`konusmalar` (ve CASCADE ile `konusma_uyeleri`,
`mesajlar`) satirlarini silmenin tek yolu asagidaki "Kota temizligi ve
konusma silme yetkisi" bolumunde anlatilan yonetici istemcisidir -
sirasiyla RPC'lerle konusan A/B istemcilerinin bu tabloda hicbir yazma
yetkisi yok (insert/update/delete `authenticated`den geri alindi).

45-62: Plan 1 (hesap durumu ve kullanici haklari) ve Plan 2
(moderasyon paneli) senaryolari. Askiya alma her yazma kapisinda ve her
gorunurluk yolunda, dondurma ve otomatik geri acilma, moderator RPC
kapisi, moderasyon gizlemesi, check-in fotografi, engellenenler listesi.

63-64: **Etiket onayi.** Etiketlenmek, kisinin kimliginin bir konuma
baglanmasi demek; kurallarin hepsi politikalarda.

- **63 — Etiket onay bekler.** Bagli olmayan ve kisinin kendisi
  etiketlenemez; satir `bekliyor` olarak girer ve onaylanana kadar
  ucuncu kisiye gorunmez; karari YALNIZCA etiketlenen verir (check-in'in
  sahibi kendi etiketini onaylayamaz). C'nin check-in'i gercekten
  gordugu ONCE dogrulaniyor, yoksa "goremiyor" iddiasi vakumda gecerdi.
- **64 — Reddedilen etiket duruyor.** Red satiri silinmiyor; birincil
  anahtar oldugu icin ayni etiketin tekrar gonderilmesini engelliyor.
  Karar verilmis bir etiket yeniden `bekliyor` yapilamiyor.

Bu iki senaryo yazilir yazilmaz gercek bir kusur buldu: onay/reddetme
`42501 permission denied` ile HIC calismiyordu, cunku tabloya update
politikasi eklenmis ama tablo yetkisi geri verilmemisti. Duzeltme
migrasyonu 20260902160000.

### Faz 3b'de neyin degistigi

**Takip artik karsilikli** (karar 42, `docs/superpowers/specs/2026-08-20-faz3b-birebir-sohbet-design.md`).
Eskiden kabul yalnizca A->B satirini yaziyordu; artik `takip_istegini_yanitla`
kabul kolunda ayna satiriyi (B->A, `kabul`) de kendiliginden yaziyor, ve
`takibi_birak` iki yonu birden siliyor. **`takipciyi_cikar` RPC'si
dusuruldu** - `takibi_birak` ile ayni ise indigi icin. 19-30 arasindaki
senaryolarin cogu bundan etkilenmedi (kabul sonrasi row-count iddiasi
tasimiyorlardi), ama senaryo 28 iki degisikligi birden gerektirdi:
`takipciyi_cikar` cagrisi `takibi_birak`'a cevrildi, ve "takipler satiri
kayboluyor" iddiasi tek yon yerine **iki** yonu de kapsayacak sekilde
genisletildi (bkz. yukarida senaryo 28 ve 32/33).

**Kota temizligi artik gercekten calisiyor.** `mobil/.env` icine
`SUPABASE_SERVICE_ROLE_KEY` eklendi ve `yardimcilar.ts`teki
`yoneticiIstemcisi()`/`kotayiTemizle()` (Faz 3b Task 1) artik her
kosumun sonunda test hesaplarinin `istek_gunlugu` satirlarini gercekten
siliyor. Bu, "paket gunde ~8 kosumdan sonra kota yuzunden yanlis alarm
verir" sorununu ortadan kaldiriyor - asagidaki "--tavan bayragi"
bolumundeki uyari, `--tavan`in KENDISI icin hala gecerli (o bayrak
bilerek tavana **carpana kadar** gonderim yapar), ama artik normal
kosumlar arasinda kota birikmiyor.

**Kota temizligi ve konusma silme yetkisi.** Ayni yonetici istemcisi
(`yoneticiIstemcisi()`), Faz 3b'nin messaging senaryolarinin
olusturdugu `konusmalar` satirlarini silmek icin de kullaniliyor:
`konusmalar`, `konusma_uyeleri`, `mesajlar` uc tablosunun ucunde de
`authenticated` rolunden insert/update/delete geri alindi (yalnizca
`select` var), yani A/B istemcileriyle konusma silinemez.
`konusmaTemizleVeDogrula()` (calistir.ts) yonetici istemcisiyle siler
VE ardindan bir select ile satirin gercekten gittigini dogrular -
yalnizca "hata donmedi" degil, "artik yok" iddia edilir.
`SUPABASE_SERVICE_ROLE_KEY` tanimli degilse bu adim `esitMi` ile
GURULTULU sekilde basarisiz olur (sessizce atlanmaz).

### --tavan bayragi

`bag.istek_on_kontrol`'un gunluk 50 istek tavani, canli satirlari degil
ekle-only `istek_gunlugu` tablosunu sayar (karar: engelleme ve red
istek satirlarini siler ama gunlugu silmez, aksi halde gonderen kendi
sayacini engelleyip-tekrar-deneyerek dusurebilirdi). Bu, tavani test
eden senaryonun **kalici** bir yan etkisi oldugu anlamina gelir: A'nin
gunluk sayaci gercekten 50'yi gecince, ayni gun icindeki **butun**
sonraki kosumlarda 19/20/26/28 gibi A'dan `takip_istegi_gonder`
cagiran senaryolar da tavana takilip basarisiz olur.

Bu yuzden senaryo 29 varsayilan kosumdan cikarildi ve yalnizca acikca
istendiginde (`--tavan`) calisir:

```bash
npm run test:gorunurluk -- --tavan
```

`--tavan` verilmezse betik bu senaryoyu atlar (bir "ATLANDI" satiri
yazar, basarisizlik saymaz) ve geri kalan butun senaryolari normal
calistirir. `--tavan` verildiginde butun senaryolar (1-30) ayni
kosumda calisir; senaryo 29, A'nin sayaci nereden basliyorsa oradan
basarili gonder+`takibi_birak` dongusune girip hataya (istek sinirina
ulasildi) carpana kadar devam eder — bu yuzden A'nin o gunku baslangic
sayacindan bagimsiz calisir. `--tavan`'i calistirdiktan sonra ayni gun
icinde betigi tekrar (bayraksiz) calistirmayin; 19/20/26/28
basarisiz olur.

### 30 gun kurali neden dolayli test ediliyor

`kullanici_adi_degistir` basarili olursa hesap 30 gun kilitlenir ve
betik bir sonraki calismasinda ayni basarili sonucu **tekrar
uretemez**: betik iki (hatta daha fazla) kez ust uste calistirilabilir
olmali, ama ikinci calismada hesap zaten kilitli olacagi icin "basarili
degistirme" dogrudan iddia edilemez.

Bunun yerine senaryo 13, betigin kacinci kez calistigindan bagimsiz iki
iddiaya dayanir:

- Ilk cagri ya basarili olur (hesap daha once hic degistirilmemis ya da
  son degisiklikten 30 gunden fazla gecmis) ya da **yalnizca 30 gun
  mesajiyla** reddedilir — baska bir hata (bicim, benzersizlik) degil.
- Ikinci ardisik cagri **her durumda** 30 gun mesajiyla reddedilir:
  ilk cagri basarili olduysa zaman damgasi az once yazildi, olmadiysa
  zaten yakin gecmiste kalmisti — ikisinde de 30 gunun icindeyiz.

Bu yuzden senaryo 11'in aktoru bilerek **A**, senaryo 13'unku ise
**B**: RPC icinde 30 gun kontrolu benzersizlik kontrolunden once
calisiyor, dolayisiyla A'nin kullanici adi hicbir senaryoda
degistirilmezse (30 gun kilidi hic devreye girmezse) senaryo 11'in
"B'nin adini alamaz" iddiasi her calismada ayni "alinmis" mesajina
dayanir, 30 gun mesajina degil.

Ayrica senaryo 10, kendi ic mantigi geregi A -> B blogunu (engelleme)
kurulu birakarak bitiyor. Senaryo 11'den once bu blok kaldiriliyor,
cunku aksi halde senaryo 14/15'teki "A, B'yi arama sonuclarinda bulur"
pozitif kontrolleri blok yuzunden yanlislikla basarisiz olurdu. Senaryo
16 arama-engelleme etkilesimini kendi bloguyla acikca test ediyor ve
kendi temizligini `t.engellemeler` uzerinden kaydediyor. Senaryo 18 de
ayni sebeple (imzali URL testi) A -> B blogunu kurulu birakarak
bitiyor; senaryo 19'dan once bu blok da ayni desenle kaldiriliyor —
aksi halde `bag.istek_on_kontrol` engelli ciftler icin "Bu kullanici
bulunamadi" dondurdugu icin 19-28 arasindaki hicbir takip/sohbet
istegi gercekten gonderilemezdi.

Not: spec'in "kullanici adi sutunu dogrudan yazilamaz" ve
"aramada_gorunsun yazilabilir" maddeleri burada tekrarlanmiyor —
`sema-dogrula.ts` icinde, yine gercek veritabanina karsi calisan ayri
bir kontrolde duruyor.

## Dikkat

Bu testler canli veritabanina yazar ve sonunda kendi verisini siler.
Uretim verisi olan bir projede calistirma.
