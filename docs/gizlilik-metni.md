# Gizlilik metni

## Veri sorumlusu

Bu uygulamanın veri sorumlusu, gerçek kişi olarak Orçun Özdemir'dir.
KVKK kapsamındaki başvurularını destek@slooin.com adresine
iletebilirsin; başvurun en geç 30 gün içinde yanıtlanır.

Bu metin uygulama icinde `Ayarlar > Gizlilik metni` uzerinden okunur
(`mobil/src/app/gizlilik.tsx`). Kaynak metin burasidir; ekrandaki metin
bu dosyadan koda sabit olarak kopyalanir, ag baglantisi olmadan da
okunabilmesi icin uzak bir kaynaktan cekilmez. Iki dosya kasitli olarak
BIREBIR AYNI ICERIGI tasir - bu dosya guncellenirse ekran da (ve
tersi) guncellenmelidir; aralarinda fark varsa hangisinin dogru
oldugu belirsizlesir.

Bu metin KVKK m.10 aydinlatma yukumlulugunu karsilar
(`docs/kvkk-uyum-listesi.md` madde 1). Hukuki gorus degildir; gercek
kullaniciya acilmadan once bir danismana dogrulatilmalidir (ayni
dosyadaki not gecerlidir).

**Duzeltme gecmisi (kod incelemesi turleri):**
- **Tur 1:** ilk surum birkac yerde yanlis ya da eksik beyanda
  bulunuyordu (mekan aramasinin da konum kullandigini soylemiyordu,
  saklama surelerini henuz uygulanmamisken kesin dille yaziyordu,
  sikayet kimlik bagini yanlis anlatiyordu, bildirim aktariminda
  gonderenin adinin gittigini soylemiyordu).
- **Tur 2:** tur 1'in kendisi yeni bir yanlis beyan getirdi ("check-in
  yaptiginda konum KALICI saklanir" - oysa check-in aniya donusunce
  koordinat silinir, bu kullanicinin LEHINE bir gercek ve kaybolmustu).
  Ayrica: mekan EKLERKEN de cihaz konumu kullanildigi (ucuncu bir yol)
  eksikti; "tek otomatik silme kurali" iddiasi yanlisti (istek_gunlugu
  budamasi ve check-in konum silme de otomatik); md/ekran arasindaki
  fark tam kapanmamisti.

Asagidaki metin koddan (RPC'ler, migrasyonlar, Edge Function, cron
isleri) dogrulanarak yazildi; her madde ilgili kaynaga atif yapar.

## 1. Hangi verilerini isliyoruz

- **E-posta adresin** - bugun hesabinin BIRINCIL kimligi. Hesap
  acarken ve giris yaparken kullanilir, dogrulama kodu buraya
  gonderilir.
- Telefon numaran - YALNIZCA ESKI HESAPLARDA. Kayit ve giris 2026
  Eylul'unde e-postaya tasindi; daha once telefonla acilmis hesaplar
  calismaya devam ettigi icin numara o hesaplarda kayitli kalir. Yeni
  bir hesap acarken telefon numarasi istenmez.
- Adin, kullanici adin, dogum tarihin, biyografin, profil fotograflarin
- **Konumun** - UC farkli sekilde: mekan ararken ve mekan eklerken
  cihaz konumun sunucuya GONDERILIR ama SAKLANMAZ; check-in aktifken
  koordinatin saklanir, check-in aniya donusunce (1 SAAT sonra ya da
  hemen "ayrildim" dediginde) koordinat SILINIR ve geriye
  yalnizca hangi mekanda oldugun kalir (tam ayrinti madde 3'te)
- Gonderdigin ve aldigin mesajlarin icerigi
- Bag bilgin: kimi takip ettigin, kimlerle sohbet istegi alisverisinde
  bulundugun, kimi engelledigin
- Bildirim gonderebilmemiz icin cihazinin bildirim jetonu
- Sikayet ettigin ya da hakkinda sikayet edilen bilgiler
- Mekanlara verdigin puanlar (Kotu / Iyi / Harika). Herkes yalnizca
  toplamlari gorur; hangi puani verdigini yalnizca sen gorursun.
  Check-in fotograflarin, sectigin gorunurluk kuraliyla o mekanin
  fotograf alaninda da gorunur.

## 2. Ne amacla isliyoruz - ve hangi hukuki sebeple

KVKK m.10, isleme amacinin yaninda **hukuki sebebin** de bildirilmesini
ister. Her amacin dayanagi ayri ayri yazilidir:

- **Hesabini kurmak ve e-posta adresini dogrulamak** (eski hesaplarda
  telefon numarani). Hukuki sebep: **sozlesmenin ifasi** (KVKK
  m.5/2-c) - hesap olmadan uygulamanin hicbir islevi calismaz.
- **Yakinindaki mekanlari ve kisileri kesfetmeni saglamak** (konum ve
  check-in). Hukuki sebep: **sozlesmenin ifasi** (KVKK m.5/2-c).
  Slooin'in yaptigi tek sey bir yere check-in yapman ve orada kimin
  oldugunu gormendir; konum islenmeden uygulama calismaz, yani konum
  ayri bir "ek ozellik" degil hizmetin kendisidir.
- **Mesajlasmani saglamak.** Hukuki sebep: **sozlesmenin ifasi**
  (KVKK m.5/2-c).
- **Kotuye kullanimi (taciz, sahte hesap, uygunsuz icerik) onlemek ve
  incelemek** - sikayet kayitlari, moderasyon denetim izi, hesap
  durumu kayitlari ve istek tavani sayaclari. Hukuki sebep: **mesru
  menfaat** (KVKK m.5/2-f): kullanicilari taciz ve kotuye kullanimdan
  koruyabilmek.

Hesap acarken "Devam"a bastiginda verdigin kabul, bir **ispat kaydi**
olarak veritabanina yazilir: aydinlatma metnini okudugun ve konum
verinin islenmesini kabul ettigin, hangi metin surumu icin ve ne zaman
onay verdiginle birlikte kaydedilir (`kvkk_onaylari` tablosu;
`aydinlatma` ve `konum_rizasi` olmak uzere iki kayit). Bu kayit
yukaridaki hukuki sebeplerin yerine gecmez - onlarin ustune, sana neyin
bildirildigini geriye donuk gosterebilmek icin tutulur.

## 3. Konum ozel olarak

Cihazinin konumu **UC farkli sekilde** kullanilir; bunlari
karistirmamak onemli:

- **Mekan ararken:** yakinindaki mekanlari gosterebilmemiz icin
  cihazinin konumu her mekan aramasinda (`Mekanlar` ekrani acildiginda
  ve arama/yaricap degistikce) sunucuya **GONDERILIR**. Bu konum
  **SAKLANMAZ** - yalnizca o anki sorguyu cevaplamak (hangi mekanlar
  yakinda, hangi sirada) icin kullanilir, veritabaninda bir yere
  yazilmaz. (Kod: `yakin_mekanlar_yogunluk` fonksiyonu konumu yalnizca
  mesafe hesabinda kullanir, hicbir sutuna yazmaz.)
- **Yeni bir mekan eklerken:** eklemek istedigin mekana gercekten
  yakin oldugunu dogrulamak icin cihazinin konumu gonderilir (~200
  metre icinde olman gerekir). Bu konum da **SAKLANMAZ** - yalnizca bu
  yakinlik kontrolu icin kullanilir. Saklanan tek sey eklenen
  **mekanin** konumudur, senin o andaki konumun degil. (Kod:
  `mekan_ekle` fonksiyonu `p_cihaz_lat`/`p_cihaz_lng`yi yalnizca
  `ST_DWithin` kontrolunde kullanir, hicbir sutuna yazmaz.)
- **Check-in yaptiginda:** check-in **AKTIFKEN** koordinatin saklanir.
  Ama bu gecici: check-in **1 SAAT** sonra (ya da hemen
  "ayrildim" dediginde) otomatik olarak **aniya** donusur, ve bu
  donusumde **koordinat SILINIR** (veritabaninda null'a cekilir) -
  geriye yalnizca hangi mekanda oldugun kalir, tam koordinat degil.
  Temizlik isi 10 dakikada bir kostugu icin koordinat en fazla
  **~1 saat 10 dakika** saklanir.
  (Kod: `check_inden_ayril` RPC'si ve 10 dakikada bir calisan
  `check-in-suresi-dolanlari-aniya-cevir` adli pg_cron isi `konum`
  sutununu null yapiyor.)

Check-in aktifken saklanan koordinat, check-in icin sectigin bulunurluk
kademesine gore paylasilir. **Bu, canli check-in icindir** - check-in
aniya donustukten sonra gecerli olan kademe farkli, asagida ayrica
anlatiliyor:

- **Herkese acik:** uygulamadaki herkes DEGIL, yalnizca **ayni mekanda
  o an canli check-in'i olanlar** ya da **karsilikli takiplerin**
  gorur. (Kod: `check-in gorunurlugu` RLS politikasi,
  `bulunurluk = 'herkese_acik'` kolunda `gizli.ayni_mekanda_canli_mi`
  veya `bag.takip_ediyor_mu` sartlarindan biri saglanmali.)
- **Sadece takipcilerim:** yalnizca karsilikli takiplerinin gordugu
- **Gizli:** kimse gormez, check-in yalnizca kendi gecmisinde kalir

Check-in aniya donustukten sonra (yani konum silindikten sonra), anin
gorunurlugu **ayri bir uc kademedir** ve farkli calisir - artik "ayni
mekanda canli olma" sarti yoktur:

- **Herkese acik:** uygulamadaki herkes gorur (aktif hesaplar,
  engelleme haric)
- **Sadece takipcilerim:** yalnizca karsilikli takiplerinin gordugu
- **Kimse:** yalnizca kendi profilinde sen gorursun

`Gizli` sectiginde **kimligin** kimseye gorunmez - moderasyon disinda
(bkz. madde 4). Ama bir istisna var: bulundugun mekanin herkese acik
"kac kisi var" sayacina (yogunluk) bulunurluk kademenden BAGIMSIZ
olarak dahil olursun. Yani kimligin gizli kalir, ama sayac senin
varliginla artar - **sakin bir mekanda sayac 0'dan 1'e ciktiginda
oradaki biri "birisi var" bilgisini cikarabilir.** (Kod:
`yakin_mekanlar_yogunluk` icindeki `kisi_sayisi` alt sorgusu
`bulunurluk`a hic bakmiyor, yalnizca aktif check-in ve aktif hesap
kontrolu yapiyor.)

## 4. Moderasyon erisimi

Bir sikayet aldiginda ya da kotuye kullanim suphesiyle incelenirken,
moderasyon ekibimiz **profilini, check-in'lerini ve mesaj iceriklerini
okuyabilir.** Bu, bulunurluk kademen `gizli` olsa da mesaj icerigin
`gizli` gorunse de gecerlidir - taciz ve kotuye kullanim iddialarini
inceleyebilmek icin gereklidir.

Moderasyonun **her erisimi kaydedilir**: kim, ne zaman, hangi kaydina
baktigi `moderasyon_kayitlari` adli denetim izinde tutulur. Bu tablo
**YALNIZCA EKLEME** kabul eder - kayit sunucu tarafinda olusturulur,
bir moderatorun kendi erisim kaydini silmesine ya da degistirmesine
izin veren hicbir yol yoktur. Erisim yalnizca bir sikayet ya da
inceleme baglaminda kullanilir, gelisiguzel goz atma degildir.
Kayitlar **2 YIL** saklanir (bkz. madde 6).

Bu satiri yazdigimiz gun denetim izinde **hic kayit yok** - bugune
kadar hicbir moderator erisimi olmadi. Bu, mekanizmanin kurulu
olmadigi anlamina gelmez; kurulu ve calisiyor, henuz kullanilmasi
gerekmedi.

## 5. Yurt disina aktarim

Verilerin uc ayri yerde islenir:

- **Supabase** (veritabani ve dosya depolama): sunucular **Almanya**'da
  (`eu-central-1` bolgesi). Butun kisisel verin Turkiye disinda, Avrupa
  Birligi sinirlari icinde tutulur.
- **Expo Push API** (bildirim gonderimi): sunuculari **Amerika Birlesik
  Devletleri**'nde. Bildirim gonderirken cihazinin bildirim jetonu,
  kime gonderildigi bilgisi ve bildirimi tetikleyen kisinin **adi**
  buradan gecer - ornegin "Deniz sana mesaj gonderdi" gibi bir metin
  gider. Mesajin kendi **METNI** bildirime hicbir zaman eklenmez, ama
  baska bir kullanicinin adi da kisisel veridir ve bu aktarimin bir
  parcasidir - "icerik tasimaz" ifadesi yalnizca mesaj metni icin
  gecerlidir, "hicbir kisisel veri gitmiyor" anlamina gelmez.
- **Harita zemini** (2026-08-30'dan itibaren, yalnizca iOS ve Android
  uygulamalarinda): iOS'ta **Apple Haritalar**, Android'de **Google
  Haritalar**. Harita cizilirken ekranda gorunen bolgenin koordinatlari
  saglayiciya gider; kimligin, hesabin ya da check-in'lerin gitmez.
  Web surumunde gercek harita yoktur, bu aktarim da olmaz.
**Aktarimin hukuki sebebi:** uc aktarim da hizmetin verilebilmesi icin
zorunludur, yani madde 2'deki dayanaklarin aynisina - **sozlesmenin
ifasina** - dayanir; bildirim gonderimi ayrica mesru menfaat
kapsamindadir.

Bunu acikca yazmak istiyoruz: KVKK m.9 yurt disina aktarim icin hukuki
sebebin yaninda bir **aktarim mekanizmasi** da arar (yeterlilik karari,
standart sozlesme, taahhutname ya da acik riza). Kisisel Verileri
Koruma Kurulu'nun bu ulkeleri kapsayan bir yeterlilik karari
bulunmuyor ve bizim de bugun imzalanmis bir standart sozlesmemiz
**YOK**. Bu, uygulama gercek kullanicilara acilmadan once tamamlanmasi
gereken acik bir eksiktir ve KVKK uyum listemizde boyle kayitlidir. Var
olmayan bir mekanizmayi varmis gibi gostermemeyi tercih ediyoruz.

## 6. Saklama sureleri

**Bugun gecerli olan otomatik silme/temizleme kurallari BIRDEN
FAZLA** (tek bir kural degil):

- Suresi dolmus (90 gunden eski) hesap askiya alma kayitlari her gun
  otomatik olarak veritabanindan **SILINIR** (tam silme, arsivlenmez).
  Bu kayitlarin baska bir yerde saklanan bir kopyasi bugun **yoktur**.
- Takip/sohbet istegi gunluk tavanini hesaplamak icin tutulan kayitlar
  (`istek_gunlugu`) 2 gunden eski satirlar her gun otomatik silinir.
- Check-in koordinatin (madde 3'te anlatildigi gibi) check-in aniya
  donustugunde otomatik olarak silinir (null'a cekilir).
- **Moderasyon erisim kayitlari** (`moderasyon_kayitlari`, bkz. madde
  4) **2 YIL** saklanir. Her gun 04:45'te calisan
  `moderasyon-izi-buda` adli temizlik isi bundan eski satirlari siler.
  Bu kural bugun **YURURLUKTEDIR**.

Anilarin (check-in gecmisinin geri kalani - hangi mekanda oldugun,
notun, fotografin), mesajlarin ve sikayetler icin bugun tam bir
otomatik silme islemi **YOKTUR** - suresiz saklanirlar. "Gerekli
oldugu sure kadar saklama" ilkesinin tam karsiligi henuz
tamamlanmadi; bu KVKK uyum listemizde acik bir madde olarak durur.

**Planlanan (henuz uygulanmadi):** karara baglanmis sikayetlerin
karardan 1 yil sonra silinmesi. Sikayet kayitlari icin bugun otomatik
bir silme isi YOKTUR.

### Hesabini silersen ne olur

- Profilin, anilarin, baglarin (takip, sohbet istegi, engelleme) ve
  konusma listen **kalici olarak silinir**.
- Gonderdigin **mesajlar silinmez** - cunku bir konusma iki kisinin
  ortak verisidir ve karsi tarafin gecmisini yarida kesmek dogru olmaz.
  Ancak gonderen kimligin konusmadan koparilir; karsi taraf mesaji
  gorur ama artik senin adina baglanmaz.
- **Senin actigin sikayetler** silinmez, ama kimin actigi bilgisi
  (kimlik bagi) **kopar** - kayitta artik kim actigi bilinmez.
- **Hakkinda acilan sikayetler** de silinmez, ama bu sikayetlerde
  kimlik bagi **KOPMAZ** - hedef kimligi moderasyon kaydinda kalmaya
  devam eder. Bunun sebebi: tekrar eden kotuye kullanimi tespit
  edebilmek (biri hesabini silip yeniden acarak gecmis sikayetlerinden
  kurtulamamali).
- Profil ve check-in fotograflarin depolama alanindan silinir.

## 7. Haklarin

- **Hesabini dondurabilirsin.** Verilerin silinmez, gorunmez hale
  gelirsin; tekrar giris yaptiginda hesabin kendiliginden aktif olur.
- **Hesabini kalici olarak silebilirsin.** Geri donusu yoktur; yeniden
  gelmek istersen sifirdan hesap acman gerekir. Ne sildigin ve ne
  kaldigi madde 6'da yazili.
- **Verilerinin bir kopyasini indirebilirsin.** Ayarlar > "Verilerimi
  indir". Dosya JSON biciminde hazirlanir ve 24 saat gecerli bir
  baglantiyla verilir; sure dolunca dosya erisilemez olur ve yeniden
  indirebilirsin.
  **Dosyada NELER YOK:** hakkinda acilan sikayetler (sikayet edenin
  kimligini tasidiklari icin), moderasyon denetim izi, seni kimin
  engelledigi ve sana gelen mesajlarin METINLERI. Sana gelen mesajlar
  icin yalnizca kiminle, kac mesaj ve en son ne zaman bilgisi yer alir -
  bir konusmanin karsi tarafindaki cumleler o kisinin verisidir.
  **Indirdigin dosyayi sen korursun:** icinde konum gecmisin de dahil
  olmak uzere hesabindaki her sey vardir.
- **Basvuru yolu:** basvurularini destek@slooin.com adresine
  gonderebilirsin; basvurun en gec 30 gun icinde yanitlanir.
