# Gizlilik metni

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

- Telefon numaran (hesap ve dogrulama icin)
- Adin, kullanici adin, dogum tarihin, biyografin, profil fotograflarin
- **Konumun** - UC farkli sekilde: mekan ararken ve mekan eklerken
  cihaz konumun sunucuya GONDERILIR ama SAKLANMAZ; check-in aktifken
  koordinatin saklanir, check-in aniya donusunce (en fazla ~4 saat
  sonra, ya da hemen "ayrildim" dediginde) koordinat SILINIR ve geriye
  yalnizca hangi mekanda oldugun kalir (tam ayrinti madde 3'te)
- Gonderdigin ve aldigin mesajlarin icerigi
- Bag bilgin: kimi takip ettigin, kimlerle sohbet istegi alisverisinde
  bulundugun, kimi engelledigin
- Bildirim gonderebilmemiz icin cihazinin bildirim jetonu
- Sikayet ettigin ya da hakkinda sikayet edilen bilgiler

## 2. Ne amacla isliyoruz

- Hesabini kurmak ve telefon numarani dogrulamak
- Yakinindaki mekanlari ve kisileri kesfetmeni saglamak
- Mesajlasmani saglamak
- Kotuye kullanimi (taciz, sahte hesap, uygunsuz icerik) onlemek ve
  incelemek

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
  Ama bu gecici: check-in en fazla **~4 saat** sonra (ya da hemen
  "ayrildim" dediginde) otomatik olarak **aniya** donusur, ve bu
  donusumde **koordinat SILINIR** (veritabaninda null'a cekilir) -
  geriye yalnizca hangi mekanda oldugun kalir, tam koordinat degil.
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

Moderasyonun **her erisimi kaydedilecek**: kim, ne zaman, hangi
kaydina baktigi bir denetim izinde tutulacak. Bu erisim yalnizca bir
sikayet ya da inceleme baglaminda kullanilir, gelisiguzel goz atma
degildir. (Bu denetim izinin kendisi - `moderasyon_kayitlari` tablosu
- bugun henuz kurulmadi; moderasyon paneliyle birlikte gelecek. Bkz.
madde 6'daki not.)

## 5. Yurt disina aktarim

Verilerin iki ayri yerde islenir:

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

## 6. Saklama sureleri

**Bugun gecerli olan otomatik silme/temizleme kurallari BIRDEN
FAZLA** (tek bir kural degil):

- Suresi dolmus (90 gunden eski) hesap askiya alma kayitlari her gun
  otomatik olarak veritabanindan **SILINIR** (tam silme, arsivlenmez).
  Bu kayitlarin baska bir yerde saklanan bir kopyasi bugun **yoktur**.
- Takip/sohbet istegi gunluk tavanini hesaplamak icin tutulan kayitlar
  (`istek_gunlugu`) 2 gunden eski satirlar her gun otomatik silinir.
- Check-in koordinatin (madde 3'te anlatildigi gibi) check-in aniya
  donustugunde otomatik olarak silinir (null'a cekilir) - en fazla ~4
  saat sonra.

Anilarin (check-in gecmisinin geri kalani - hangi mekanda oldugun,
notun, fotografin), mesajlarin ve sikayetler icin bugun tam bir
otomatik silme islemi **YOKTUR** - suresiz saklanirlar. "Gerekli
oldugu sure kadar saklama" ilkesinin tam karsiligi henuz
tamamlanmadi; bu KVKK uyum listemizde acik bir madde olarak durur.

**Planlanan (henuz uygulanmadi):** moderasyon erisim kayitlarinin 2
yil, karara baglanmis sikayetlerin karardan 1 yil sonra silinmesi. Bu
sureler moderasyon paneliyle birlikte gelecek `moderasyon_kayitlari`
tablosuna baglidir ve bugun icin gecerli DEGILDIR - o tablo henuz
veritabaninda yok.

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
- **Verilerinin bir kopyasini talep edebilirsin.** Bu talep icin bugun
  uygulama icinde otomatik bir akis yok; bize ulasarak talep
  edebilirsin (asagidaki basvuru yolu).
- **Basvuru yolu:** bugun icin somut bir destek kanali (e-posta,
  form) yayinda degil - **bu, yayin oncesi eklenmesi gereken acik bir
  bosluktur.** Eklenene kadar bu satir bir yer tutucudur, gercek bir
  kanal degildir.
