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

19-30: Faz 3a (bag: takip, sohbet istegi, uc kademeli bulunurluk):

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
- **28 — Takipciyi cikarinca akis kesilir.** B, A'yi takipcilikten
  cikarinca (`takipciyi_cikar`) `takipler` satiri kayboluyor ve A
  artik B'nin `takipcilerim` check-in'ini goremiyor.
- **29 — Gunluk tavan.** Bkz. asagidaki "--tavan bayragi" bolumu;
  varsayilan kosumda calismaz.
- **30 — Kimliksiz cagrilar reddedilir.** Oturum acmamis ham bir anon
  istemciyle `takip_istegi_gonder` ve `bag_kisileri` cagrilari hata
  doner.

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
