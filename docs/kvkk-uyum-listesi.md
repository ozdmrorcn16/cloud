# KVKK ve gizlilik uyum listesi

Kullanicinin 2026-08-22 tarihli standing karari: "Attigimiz her adimda
bu uygulamanin yapilis suresinde gizlilik ilkeleri ve KVKK kurallarini
ihlal etmicek sekilde ilerlememiz gerek."

Bu dosya o kuralin yasayan karsiligidir. **Yeni bir is kalemi
tasarlanirken buraya bakilir ve buradaki durum guncellenir.** Amac
sonradan yapilacak bir "uyum projesi" degil, her isin icinde tasinan
bir kisittir.

**Bu belge hukuki gorus degildir.** Teknik bir calisma listesidir;
"hukukcu onayi" isaretli maddeler gercek bir kullaniciya acilmadan once
bir danismana dogrulatilmalidir.

## Uygulamanin isledigi kisisel veriler

| Veri | Nerede | Hassasiyet |
|---|---|---|
| Telefon numarasi | `auth.users` | Kimlik belirleyici |
| Ad, kullanici adi, biyografi, fotograflar | `profiller` | Dogrudan kimlik |
| Dogum tarihi | `profiller.dogum_tarihi` | Tam tarih saklaniyor, yalnizca 18+ kontrolu icin gerekli (bkz. madde 8) |
| **Konum** | `check_inler.konum` (geography point) | **Yuksek riskli.** Projenin cekirdek riski; KVKK'da ozel nitelikli degil ama takip/taciz senaryosunun kaynagi. NOT: mekan listesi acilirken de cihaz konumu sunucuya gonderiliyor (`yakin_mekanlar_yogunluk`), check-in olmadan - saklanmiyor ama isleniyor; aydinlatma metni bunu belirtmek zorunda |
| Mesaj icerigi | `mesajlar` | Haberlesme gizliligi (Anayasa m.22) |
| Bag grafigi | `takipler`, `sohbet_istekleri`, `engellemeler` | Iliski verisi, cikarim gucu yuksek |
| Cihaz bildirim jetonu | `bildirim_jetonlari` | Cihaz belirleyici |
| Sikayetler | `sikayetler` | Ucuncu kisi hakkinda iddia icerir |
| Moderasyon erisim izi | `moderasyon_kayitlari` (planlandi) | Kimin kimin verisine baktigi |

Uygulama 18 yas alti kullanici kabul etmiyor (2026-08-12 karari), yani
cocuk verisi rejimi devreye girmiyor. Bu, uyum acisindan projenin en
guclu tarafi.

## Yukumlulukler ve bugunku durum

Durum isaretleri: **TAMAM** / **EKSIK** / **BLOKE** (gercek kullaniciya
acilmadan once mutlaka kapanmali).

### 1. Aydinlatma yukumlulugu (KVKK m.10) - KAPANDI

Gizlilik metni yazildi ve uygulamada okunabilir hale geldi: kaynak metin
`docs/gizlilik-metni.md`, ekran `mobil/src/app/gizlilik.tsx`
(`Ayarlar > Gizlilik metni`den erisiliyor). Yedi maddeyi kapsiyor:
hangi veri, ne amacla, konum ozel olarak, moderasyon erisimi (mesaj
icerigi dahil), yurt disina aktarim, saklama sureleri ve hesap silinince
ne olacagi, kullanici haklari ve basvuru yolu.

Kayit ekranindaki riza akisina baglanmasi ve magaza listelemesi icin
URL'e konmasi henuz yapilmadi - ayri bir is.

**Metnin icindeki basvuru kanali hala yer tutucu ve bu yayin oncesi
BLOKE.** `docs/gizlilik-metni.md` madde "Basvuru yolu" bunu kendi
icinde acikca soyluyor: somut bir destek kanali (e-posta, form) yok,
satir gercek bir kanal degil, tek basina bir yer tutucu. Madde 1'in
"KAPANDI" isareti metnin YAZILMIS ve OKUNABILIR olmasi icin gecerli;
basvuru kanalinin gercek bir adrese baglanmasi ayri ve hala acik bir
is, gercek kullaniciya acilmadan once tamamlanmali.

### 2. Isleme sartlari ve hukuki sebep (KVKK m.5) - KAPANDI

**2026-09-07'de kapandi.** Gizlilik metni artik yalnizca AMACLARI degil
her amacin **hukuki sebebini** de sayiyor. Onceden hicbir metinde
"sozlesmenin ifasi", "acik riza" ya da "mesru menfaat" ifadeleri
gecmiyordu; KVKK m.10 hukuki sebebin de bildirilmesini istedigi icin
bu, aydinlatmanin eksik olmasi demekti.

Yazilan dayanaklar (madde 2, uc metinde de ayni):

| Amac | Hukuki sebep |
|---|---|
| Hesap kurmak, e-postayi dogrulamak | Sozlesmenin ifasi (m.5/2-c) |
| Konum ve check-in | Sozlesmenin ifasi (m.5/2-c) |
| Mesajlasma | Sozlesmenin ifasi (m.5/2-c) |
| Sikayet, moderasyon izi, hesap durumu, istek tavani | Mesru menfaat (m.5/2-f) |

**Konumun dayanagi neden acik riza degil sozlesmenin ifasi:** check-in
uygulamanin kendisidir, konum islenmeden hicbir islevi calismaz. Bir
seyi "riza"ya baglamak, ancak reddedildiginde hizmetin calismaya devam
etmesi halinde anlamlidir; burada oyle degil. Bu gerekce daha once
kayit ekranindaki onay kutusu kaldirilirken de kullanilmisti
(`CLAUDE.md`, e-postaya gecis bolumu).

**Ispat kaydi DURUYOR ve bu onemli:** `kvkk_onaylari` tablosu kayit
aninda iki satir yaziyor - `aydinlatma` ve `konum_rizasi` - metin
surumu ve zaman damgasiyla. Canlida dogrulandi (2026-09-07): tabloda 4
satir var, onay turleri tam olarak bu ikisi. Bu kayit hukuki sebebin
YERINE GECMEZ, onun ustune "kullaniciya ne bildirildi" sorusunu geriye
donuk cevaplayabilmek icin tutulur - ve gizlilik metni artik bunu da
oyle anlatiyor.

Isletim sisteminin konum izni ile KVKK anlaminda acik rizanin **ayni
sey olmadigi** uyarisi hala dogrudur; degisen sey, konumun dayanaginin
acik riza OLMAMASI, dolayisiyla ayrik bir riza akisinin da
gerekmemesidir.

### 3. Yurt disina aktarim (KVKK m.9) - EKSIK, hukukcu onayi

Uc aktarim var ve ucu de bugun belgelenmemis:

- **Supabase**, proje bolgesi `eu-central-1` (Almanya). Butun kisisel
  veri Turkiye disinda tutuluyor.
- **Expo Push API** (ABD), bildirim gonderiminde. Icerik tasimiyor
  (karar 48) ama cihaz jetonu ve alici bilgisi gidiyor - bu da kisisel
  veridir.
- **Apple Haritalar / Google Haritalar** (2026-08-30, yalnizca iOS ve
  Android uygulamalarinda; web'de yok). Harita zemini cizilirken
  ekranda gorunen bolgenin koordinatlari saglayiciya gider. Kimlik,
  hesap ya da check-in gitmez; ama kesfet ekraninda o bolge
  kullanicinin bulundugu yerdir, yani dolayli olarak konum verisidir.
  Gizlilik metni madde 5'e yazildi. Dort soru:
  hangi veri = gorunen harita bolgesi; dayanak = konum izni ve
  aydinlatma; sure = uygulama tarafinda saklama yok, saglayicinin
  politikasi; kim gorur = Apple (iOS) / Google (Android).
- **Mekan duzenleme talepleri** (2026-09-09). Kullanici bir mekanin
  adini, adresini, turunu ve kapak fotografini duzeltmek icin talep
  gonderiyor; moderator onaylayinca mekan kaydi guncelleniyor.
  Dort soru: hangi veri = talebi gonderenin KIMLIGI, onerdigi metinler
  ve varsa YUKLEDIGI FOTOGRAF; dayanak = kullanicinin kendi eylemi
  (sozlesmenin ifasi) ve icerik denetimi icin mesru menfaat;
  sure = talep kaydi suresiz (moderasyon gecmisi), hesap silinirse
  kullanici_id NULL'a duesuyor yani talep anonimlesiyor; kim gorur =
  yalnizca talebi gonderen ve moderator - baskasinin talebi hic
  gorunmuyor (RLS `kullanici_id = auth.uid()`).
  FOTOGRAF ONAYA KADAR GIZLI: kova private, okuma politikasi yalnizca
  yukleyene, moderatore ve ONAYLANMIS kapak fotografina aciliyor.
  Onaylanmamis bir gorselin yayinda beklemesi kabul edilemezdi.
  Karar denetim izine yaziliyor (`hedef_tur = 'mekan'`).
  **GENISLETILDI (2026-09-11): "burasi kalici olarak kapandi"
  bildirimi.** Yeni bir KISISEL VERI TURU GIRMIYOR - tasidigi tek sey
  bir boolean ve zaten kaydedilen gonderen kimligi; dayanak, sure ve
  gorunurluk yukaridakiyle ayni. Bildirimin sonucu MEKAN kaydinda
  (`mekanlar.kapali`), yani bir kisi hakkinda degil bir yer hakkinda
  bilgi. Geri alinabilir olmasi ayrica onemli: moderator karari
  `moderasyon_mekani_geri_ac` ile donuyor ve iki islem de denetim izine
  yaziliyor.
- **Profildeki "yasadigin bolge"** (2026-09-11). Kisi profiline il ve
  ilce secebiliyor; secerse biyografisinin altinda gorunuyor. Dort
  soru: hangi veri = KABA KONUM (ilce duzeyinde, adres ya da koordinat
  DEGIL); dayanak = kullanicinin kendi eylemi, alan TAMAMEN OPSIYONEL
  ve bos birakilabiliyor - ekranda da "İsteğe bağlı" yaziyor; sure =
  kisi kaldirana ya da hesabini silene kadar; kim gorur = profili
  gorebilen herkes, biyografiyle ayni gorunurlukte.
  **CHECK-IN KONUMUYLA KARISTIRILMAMALI:** bu alan kisinin BEYAN
  ETTIGI yerlesim bolgesi, o anki konumu degil; cihazdan hicbir sey
  okunmuyor ve secim yalnizca elle yapiliyor. Check-in koordinati
  bambaska bir yolda ve 1 saatte siliniyor.
  Deger serbest metin DEGIL, `public.ilceler` listesinden seciliyor
  (OSM idari sinir poligonlarindan uretilmis 968 il/ilce cifti); yani
  profilde uydurma bir yer adi gorunemiyor.
  **GUNCELLEME 2026-09-18 - "oturdugun bolge", ZORUNLU + ULKE:**
  kullanicinin karari. Hesap acmanin 3. adiminda ulke (ISO-2, 242 ulke,
  ICU listesi) ve Turkiye'de il+ilce ZORUNLU; baska ulkede yalnizca
  ulke (il/ilce listesi yok, serbest metin alinmiyor). Dort soru
  yeniden: hangi veri = ulke + kaba konum (ilce); dayanak = sozlesmenin
  ifasi (m.5/2-c) - bolge, yakindakileri esleme urununun parcasi; ama
  GOSTERIM kisinin elinde; sure = hesap silinene kadar; kim gorur =
  VARSAYILAN HIC KIMSE (`bolge_gizli` true), kisi ayarlardan "Bolgemi
  profilde goster" derse il/ilce profili gorebilen herkes; ULKE HICBIR
  ZAMAN baskasina gosterilmez (`baskasinin_profili` sutunu hic
  dondurmuyor - kural sunucuda). Gizlilik metni 7 dilde guncellendi.
  **GUNCELLEME 2026-09-18 AKSAM - PROFILDE HIC GOSTERILMEZ, AYAR YOK:**
  kullanicinin karari ("profilde gorunmeyecek, gizleme secenegine de
  gerek kalmayacak, veri olarak saklanacak sadece"). Profil duzenle
  ekranindan kalkti, "Bolgemi profilde goster" anahtari ve `bolge_gizli`
  sutunu dustu, `baskasinin_profili` il/ilceyi de artik HIC dondurmuyor
  (migrasyon `20260918200000`). Dort soru yeniden: hangi veri = ulke +
  ilce duzeyinde kaba konum (kisinin BEYANI, cihazdan okunmuyor);
  dayanak = mesru menfaat (m.5/2-f) - hizmetin hangi bolgelerde
  gelistirilecegini bilmek; kisi bazinda hicbir gosterim ya da esleme
  yok, yani kisinin hak ve ozgurluklerine etkisi asgari; sure = hesap
  silinene kadar (hesap silme satiri siliyor); kim gorur = HIC KIMSE
  (ne baska kullanici ne panel ekrani; yalnizca kisinin kendisi
  "Verilerimi indir" dosyasinda - `yasadigi_ulke` de o dosyaya bu
  migrasyonla girdi, sabah eksik kalmisti). Aydinlatma: gizlilik metni
  7 dilde "hicbir zaman gosterilmez, yalnizca hesabinla saklanir, amac
  ..." diye guncellendi; hesap olusturma adiminin alt yazisi da ayni
  seyi soyluyor. TUZAK: "sadece saklanacak" bir veri icin bile AMAC
  yazilmak zorunda (m.4 amacla sinirlilik); metinde amac acikca var.
- **Profildeki Instagram kullanici adi** (2026-09-11). Kisi profiline
  Instagram kullanici adini yaziyor; profilinde tiklanabilir bir
  baglanti olarak herkese gorunuyor. Dort soru: hangi veri = kisinin
  KENDI BEYAN ETTIGI bir hesap adi (baska bir platformdaki acik
  profiline isaret ediyor); dayanak = kullanicinin kendi eylemi, alan
  tamamen istege bagli ve bos birakilabiliyor; sure = kisi silene ya
  da hesabini kapatana kadar, hesap silinince profil satiriyla
  birlikte gidiyor; kim gorur = profili gorebilen herkes -
  BIYOGRAFIYLE AYNI gorunurlukte, "profilim gizli" ayari anilari
  kapatiyor kimlik satirini degil.
  **DOGRULAMA YOK ve bu bilerek kabul edildi.** Meta, Instagram Basic
  Display API'yi 2024-12-04'te kapatti; kisisel hesaplar icin OAuth
  ile "bu hesap gercekten benim" dogrulamasi artik mumkun degil.
  Sonucu: kisi teorik olarak baskasinin kullanici adini yazabilir.
  Kullaniciya acikca soylendi ve bu haliyle onaylandi; karsiligi
  mevcut sikayet akisi. Alan uygulama DISINA baglanti veriyor ama
  bizden Instagram'a hicbir veri GITMIYOR - baglantiya basan kisinin
  tarayicisi aciliyor, yani yurt disina aktarim listesine girmiyor.
- **OSRM yol tarifi servisi** (2026-09-09'da EKLENDI, ayni gun
  KALDIRILDI). Mekan sayfasinda kullanicidan mekana giden yolu haritada
  cizmek icin iki koordinat (kullanicinin anlik konumu ve mekanin
  konumu) acik kaynakli bir yol tarifi servisine gonderiliyordu.
  Kaldirilma sebebi gizlilik degil MALIYET: gercek rota ancak kendi
  OSRM sunucumuzla agir kullanima uygun olurdu (~7 EUR/ay) ve kullanici
  bu gideri almak yerine haritadaki cizgiden vazgecti. Yol tarifi
  islevi duruyor - telefonun KENDI harita uygulamasinda calisiyor, yani
  hesabi Apple/Google kendi uygulamasinda yapiyor ve bizim
  gonderdigimiz bir veri yok.
  YAN FAYDA: yurt disina aktarim listesinden bir kalem duestue.
  Cizgi geri istenirse aktarim da geri gelir ve gizlilik metnine
  yeniden yazilmasi gerekir.
- **Adres cozumu** (2026-08-31'de EKLENDI, ayni gun KALDIRILDI).
  Bir mekanin konum ekrani acilinca koordinati Apple/Google'a gonderip
  tam adrese cevirmeyi denedik. Kaldirilma sebebi gizlilik degil
  DOGRULUK: saglayici yanlis mahalle donduruyordu (bir mekanda
  "Ertugrul", dogrusu Alaaddinbey) ve liste ekraniyla celisiyordu.
  Artik adres YALNIZCA kendi veritabanimizdan okunuyor, disari hicbir
  sorgu gitmiyor - yani bu aktarim ARTIK YOK.

2024 degisikligiyle standart sozlesme yolu acildi; kullanilan yol ne
olursa olsun Kurum'a bildirim ve belgeleme gerekiyor. **Bir danismana
dogrulatilmali.**

**2026-09-13 - is baslatildi.** Aktarimlarin tam envanteri (alici,
ulke, rol, giden veri, gereken guvence, durum) artik ayri belgede:
`docs/kvkk-aktarim-envanteri.md`. Supabase ve Expo'ya gonderilecek
standart sozlesme talep yazilari hazir:
`docs/kvkk-standart-sozlesme-talep-yazilari.md`. Kullaniciya acikca
soylendi: hukuken zorunlu, mağaza icin engel degil; acik riza bu is
icin dayanak yapilmiyor (surekli aktarim, hizmete sart kosulan riza
sakat, riza geri alinabilir). Sira: kullanici standart sozlesmeyi
indirip yazilari gonderir -> imza gelirse 5 is gununde Kurum
bildirimi -> gizlilik metni yedi dilde guncellenir.

Gizlilik metni (madde 1) artik bu aktarimin **durumunu bildiriyor**
(hangi veri nereye, hangi ulkeye gidiyor), ama bu yalnizca bildirimdir -
KVKK m.9'un istedigi **hukuki mekanizma** (standart sozlesme, Kurum
bildirimi, belgeleme) hala kurulmadi. Bu madde bu yuzden EKSIK olarak
kaliyor; bildirim yapilmis olmasi hukuki dayanagi tamamlamiyor.

### 4. Saklama ve imha politikasi - EKSIK

Bugun tek budama isi `istek_gunlugu` icin var (2 gun). Anilar, mesajlar,
sikayetler ve fotograflar suresiz saklaniyor. "Gerekli oldugu sure
kadar" ilkesinin karsiligi yazili degil.

Moderasyon paneli spec'i yeni veri depolari getiriyor
(`moderasyon_kayitlari`, `hesap_durumlari`), dolayisiyla bu maddeyi
ertelemek artik daha pahali. Spec'te onerilen sureler ve gerekceleri
"Saklama sureleri" bolumunde.

### 5. Silme hakki / hesabin silinmesi (KVKK m.11) - KAPANDI

Kullanicinin 2026-08-22 karariyla hem **hesap silme** hem **hesap
dondurma** kapsama girdi; Plan 1 2026-08-22'de kapandi ve ikisi de
kodda calisiyor (karar 66-70, karar 70 sonradan geri alindi - asagida).
Silme, `hesap-sil` Edge Function'i uzerinden calisiyor ve iki ayri
canli turda (tam silme akisi + parola dogrulama yolunun kendisi)
dogrulandi. Kalicidir, bekleme suresi yoktur; geri
donmek isteyen sifirdan hesap acar. Dondurma, kararsiz kullanicinin
ihtiyacini karsiladigi icin silmenin geri alinamaz olmasini mumkun
kiliyor.

Cozulen ayrintilar: mesajlar ve sikayetler silinmez, gonderen
anonimlesir (bir konusma iki kisinin verisidir ve sikayet ucuncu kisi
hakkindadir); fotograflar Storage'dan silinir. Kullanici adi rezerve
EDILMEZ (karar 70 geri alindi): silinen ad aninda serbest kalir.

Denetim izi (`moderasyon_kayitlari`) silinmez, `moderator_id` alani
`set null` olur: izin butunlugu korunur, kisiyle bagi kopar.

**Silme kapisi 2026-09-13'te degisti: parola yerine E-POSTA ONAY KODU.**
Kullanicinin karari: "hesap silme adimina e-postaya onaylama kodu
getirilsin; e-postaya gelen onay kodunu giren biri hesabini silebilecek,
bilgilendirme yazilari da olacak." Ekran once neyin silinip neyin
kaldigini yaziyor, sonra kullanicinin KAYITLI adresine 6 haneli kod
gonderiyor (`signInWithOtp`, `shouldCreateUser: false`); kod
`verifyOtp` ile dogrulaninca `hesap-sil` cagriliyor. Apple/Google ile
acilmis hesapta ayrica "Apple/Google ile onayla" dugmesi var (saglayici
ile yeniden giris de ayni kapiyi aciyor). Sunucu (surum 7) parola
gelmediginde `last_sign_in_at`in 10 dakikadan taze olmasini sart
kosuyor; parola yolu web formu ve eski istemciler icin duruyor.

Dort soru: (a) hangi veri - kullanicinin kendi e-posta adresi ve
oturum kaydi, yeni veri toplanmiyor; (b) dayanak - veri sahibinin
kimliginin dogrulanmasi (KVKK m.13, basvurunun kimlik tespitiyle
alinmasi); (c) sure - kod bir saat gecerli, oturum zaten var olan
oturum; (d) kim gorur - yalnizca kullanici (posta) ve sunucu; kod
hicbir yerde saklanmiyor. Canli olcum `araclar/hesap-sil-kod-canli-test.py`
(8/8) + kapali yon MCP SQL ile elle (eski giris + parolasiz -> 403).

### 6. Erisim hakki (KVKK m.11) - KAPANDI (2026-09-11)

Ayarlar > "Verilerimi indir". `verilerimi_disa_aktar` RPC'si (security
definer, yalnizca `auth.uid()` satirlarini okur) JSON uretiyor; istemci
onu gizli `veri-disa-aktarim` kovasina yukleyip 24 saatlik imzali
baglantiyi aciyor. Kova gunluk budaniyor ve kisi basina en fazla BIR
dosya kaliyor (yeni disa aktarim oncekini siliyor).

**KAPSAM UC KARARLA BELIRLENDI** (kullanicinin karari 2026-09-11) -
ucu de baskasinin verisiyle kesistigi icin:

- **Mesajlar:** kendi yazdiklari tam metinle; karsi tarafinkiler
  METINSIZ (kiminle, kac mesaj, son tarih). Bir konusma iki kisiye ait.
- **Hakkindaki sikayetler:** HIC GIRMIYOR. Sikayet kaydi sikayet
  edenin kimligini tasiyor. Kendi gonderdikleri tam giriyor.
- **Moderasyon denetim izi:** girmiyor (denetim aracinin kendisi).
  Hesap durumu (aski/yasak, gerekce) giriyor - kisiyi dogrudan
  etkiliyor ve zaten ekranda goruyor.

Ayrica **kendisini engelleyenler ASLA girmiyor**: uygulamanin sessizlik
ilkesi (engelli, engellendigini silinmis hesaptan ayirt edemiyor) tek
hamlede yikilirdi.

TASINABILIRLIK (GDPR m.20) AYRI BIR HAK ve KVKK'da karsiligi yok;
uretilen dosya makine-okunur JSON oldugu icin pratikte o ihtiyaci da
karsiliyor.

### 7. Veri guvenligi (KVKK m.12) - TAMAM, projenin en guclu tarafi

Satir duzeyi guvenlik butun tablolarda; sutun duzeyinde yetki
kisitlamasi (`profiller`, `check_inler`); yazma yollari `security
definer` RPC'lere kapatilmis; paylasilan sirlar Vault'ta; bildirim
Edge Function'i kaynak satirini dogruluyor; moderasyon panelinde
service-role yok ve ikinci faktor veritabaninda zorlaniyor (karar 55,
56). Bu maddede yapilacak yeni bir is yok, korumak yeterli.

### 8. Veri minimizasyonu - GOZDEN GECIRILMELI

`profiller.dogum_tarihi` tam tarih olarak saklaniyor, oysa isin
gerektirdigi tek sey "18 yasindan buyuk mu" bilgisi. Profilde yas
gosterilecekse tarih gerekli olabilir; gosterilmeyecekse yalnizca
dogrulama aninda kullanilip bir boolean'a indirgenmesi daha uygun olur.
Karar verilmemis.

### 9. VERBIS kaydi (KVKK m.16) - hukukcu onayi

Muafiyet kriterleri var; ana faaliyet konusu ve olcek belirleyici.
Konum verisi isleyen bir uygulama icin bunu varsaymak dogru olmaz.
Danismana sorulmali.

### 10. Veri ihlali bildirimi (72 saat) - EKSIK

Bir ihlal fark edildiginde ne yapilacagi yazili degil. Kucuk bir yazili
prosedur yeterli; teknik is degil.

## Acik karar: numara kayit durumunun kayit ekraninda gosterilmesi

**Tarih:** 2026-08-27. **Kullanicinin karari.** Bu bolum bilinerek
alinmis bir riskin kaydidir; kapanmis bir madde degildir.

**Ne degisti.** Kayit ekraninda telefon numarasi girilip "Kodu gonder"e
basildiginda, SMS gonderilmeden once sunucuya "bu numarada tamamlanmis
bir hesap var mi" diye soruluyor (`public.telefon_kayitli_mi`). Varsa
kod hic gonderilmiyor, hata ayni ekranda cikiyor.

**Neden istendi.** Kullanicinin ifadesi: "kayitli bir telefon numarasi
girilirse direk bu ekranda hata vermeli ki bosuna kod gonderimini direk
engellemek icin". Onceki tasarimda kullanici kodu bekliyor, giriyor ve
ancak ondan sonra "bu numarada zaten hesap var" mesajini goruyordu.

**Bunun ONCEKI kararla celistigi nokta.** 2026-08-26'da bu kontrol
BILEREK dogrulama sonrasina konmustu; gerekce, kimligini dogrulamamis
birine "bu numara kayitli mi" sorusunu cevaplamanin elindeki numara
listesiyle kimin uygulamayi kullandigini taramaya (enumeration) izin
vermesiydi. O gerekce hala gecerli; degisen sey, kullanicinin bosa SMS
gonderimini daha onemli bulmasi.

**Dort soru:**

1. *Hangi kisisel veri?* Iki tane. (a) Sorgulanan telefon numarasinin
   kayitli olup olmadigi - bu, numaranin sahibi hakkinda bir bilgidir
   ve ucuncu bir kisiye aciliyor. (b) Sorguyu yapanin IP adresi.
2. *Hukuki dayanak?* (a) icin mesru menfaat (kotuye kullanimi ve gereksiz
   SMS maliyetini onlemek); pratikte sektor standardi bir davranistir
   (Instagram, X ve benzerleri ayni bilgiyi kayit ekraninda verir).
   (b) icin mesru menfaat: guvenlik ve hiz siniri.
3. *Saklama suresi?* Numara sorgusunun kendisi HIC saklanmiyor - hangi
   numaranin sorulduğu kaydedilmiyor. IP `telefon_kontrol_gunlugu`
   icinde en fazla **1 saat** duruyor ve her cagride eski satirlar
   siliniyor. Kalici bir "kim hangi numarayi sordu" kaydi olusmuyor.
4. *Kim gorebiliyor?* Tablonun RLS'i acik ve HICBIR politikasi yok;
   yalnizca `security definer` fonksiyon ve `service_role` erisebiliyor.
   Fonksiyon disariya yalnizca `boolean` doner.

**Riski sinirlayan uc onlem:**

- IKI KATMANLI hiz siniri: cihaz basina saatte 10, IP basina saatte
  300 sorgu. Tavan asilirsa fonksiyon cevap vermiyor. IP adresi
  `cf-connecting-ip` basligindan okunuyor.
  Iki duzeltme ayni gun yapildi: (a) ilk yazimda `x-forwarded-for`in
  ILK parcasi kullaniliyordu, o parca cagiran tarafindan
  uydurulabildigi icin tavan hic devreye girmiyordu (20260827093000);
  (b) tek olcut IP idi ve tavan 15 idi - bu sayi TEK KISILIK test
  durumuna gore secilmisti, CGNAT arkasindaki gercek kullanicilar
  birbirinin hakkini yerdi (20260827100000).
  Tavan degerleri `public.hiz_limitleri` tablosunda; gercek kullanim
  verisiyle migrasyon yazmadan degistirilebiliyorlar.
- OLCUM: `public.telefon_kontrol_ozeti` saatlik toplamlari tutuyor
  (kac cagri, kac farkli kaynak). IP ya da numara TASIMAZ - limitleri
  gercek kullanima gore ayarlayabilmek icin yalnizca sayilar.
- Istemci, cevap alamadiginda ESKI akisa duesuyor (kodu gonderiyor).
  Yani mesru kullanici engellenmiyor, tarayici da cevap alamiyor.
- Dogrulama ekranindaki kontrol KALDIRILMADI; son kapi yerinde duruyor.

**Kalan risk (kabul edildi):** hedefli tek bir sorgu hala mumkun -
birisi tanidiginin numarasini yazip Slooin hesabi olup olmadigini
ogrenebilir. Tavan bunu ENGELLEMIYOR, yalnizca toplu taramayi
engelliyor. Gercek kullaniciya acilmadan once aydinlatma metnine bu
davranisin eklenmesi gerekir.

## Acik karar: mekan sayfasindaki sayilar ve liderlik tablosu

2026-09-06'da konum ekrani bir **mekan sayfasina** donustu: ustte uc
sayi (su an kac kisi, bugun kac check-in, ilcesinde kacinci), altinda
"su an burada" avatarlari ve iki liste (liderlik tablosu / son
check-inler).

**Dort soru:**

1. **Hangi veri?** Yeni bir kisisel veri TOPLANMIYOR. Islenen sey zaten
   var olan `check_inler` kayitlari; yeni olan sey onlarin **toplu**
   gosterimi (sayim, siralama) ve mekan bazli bir **erisim yolu** -
   onceden bir mekanin gecmisine bakmanin yolu yoktu.
2. **Dayanak?** Check-in'in kendisi sozlesmenin ifasi (uygulama onsuz
   calismiyor); kim tarafindan gorulecegi ise kullanicinin kendi
   **gorunurluk tercihi** ile belirleniyor - `bulunurluk` (canli) ve
   `gorunurluk` (ani) alanlari. Yeni sayfa bu tercihleri degistirmiyor.
3. **Sure?** Canli check-in 1 SAAT surer (kullanicinin karari
   2026-09-07; onceki deger 30 dakikaydi). Suresi dolunca koordinat
   siliniyor; ani kaydi kullanici silene ya da hesabini silene kadar
   duruyor.
4. **Kim gorebiliyor?** Burada **iki ayri rejim** var ve ayrim kasitli:

   | Ne | Rejim | Kim gorur |
   |---|---|---|
   | Uc sayi | `security definer` | Giris yapmis herkes, ayni deger |
   | Avatarlar, liderlik, son check-inler | `security invoker` | Yalnizca `check_inler` RLS'inin izin verdigi kisiler |

   Yani **sayi herkese ayni, kimlikler degil**. Canli bir check-in'de
   "herkese acik" bile ancak ayni mekanda canliysan ya da arkadasinsa
   gorunuyor. Ekranda ustteki sayi ile asagidaki listenin uyusmadigi
   durumda fark `+N` rozetiyle anlatiliyor.

**Kabul edilen risk - kayitli olsun diye yaziyorum:** sayilar toplu
oldugu icin kimseyi tanimlamiyor, ama **kucuk sayilar + kucuk mekan**
birlesimi cikarim yapilabilir kilabilir. Ornegin bir konut sitesinde
"bugun 1 check-in" gorunuyorsa ve orada kimin oturdugu biliniyorsa,
sayi tek basina bir bilgi tasir.

Bu risk **yeni degil**: kesfet listesindeki yogunluk sayaci
(`yakin_mekanlar_yogunluk`) 2026-08-16'dan beri ayni sinif bilgiyi
veriyor ve karar 71 ile gizli check-in'in bile o sayaca girmesi kabul
edilmisti. Yeni sayfa bu davranisi genisletti ama degistirmedi.

**Onerilen ama HENUZ ALINMAMIS karar:** bir esigin altindaki sayilari
hic gostermemek (ornegin haftada 5'ten az check-in almis mekanda
siralama ve toplam gizlensin) ve konut turu kayitlari siralama
disinda birakmak. Esigin ne olacagi kullanicinin karari.

## Mekan fotograf alani ve puanlama - 2026-09-13

Iki yeni is kalemi, ikisi de mekan sayfasinda.

**Fotograf alani** (check-in'lere konan fotograflar mekan sayfasinda):

1. **Hangi veri:** YENI veri YOK. Zaten var olan check-in fotografi ve
   check-in'in sahibi/zamani, yeni bir YERDEN (mekan sayfasi) gosteriliyor.
2. **Dayanak:** check-in'in kendisiyle ayni (sozlesmenin ifasi; kisi
   fotografi paylasarak yukledi, gorunurluk tercihini secti).
3. **Sure:** check-in'in suresi; ayri saklama yok.
4. **Kim gorur:** `check_inler` RLS'i AYNEN - RPC `security invoker`,
   kova politikasi ayni satira bagli. Yani gorunurluk modeli
   GENISLEMEDI: kisi ancak zaten gorebildigi check-in'in fotografini
   gorur. Erisim kaydi yok (okuma; mevcut listelerle ayni).

**Puanlama** (Kotu / Iyi / Harika, 0-10 puan):

1. **Hangi veri:** YENI - `mekan_puanlari(mekan_id, kullanici_id, puan,
   zaman)`. Kisinin bir mekan hakkindaki gorusu; kimlige bagli tutulmak
   ZORUNDA (kisi basina tek oy kurali ve oyunu degistirebilmesi icin).
2. **Dayanak:** sozlesmenin ifasi (ozellik kullanicinin kendi istegiyle
   verdigi bir oy); aydinlatma metnine "mekan puanlarin" maddesi
   eklenmeli (ACIK - gizlilik metnine bir satir).
3. **Sure:** hesap omru; hesap silinince `on delete cascade` ile gidiyor.
   Veri disa aktarimina `mekan_puanlarim` olarak giriyor.
4. **Kim gorur:** herkes yalnizca TOPLAMLARI (kac Harika/Iyi/Kotu, puan);
   kisinin KENDI oyu yalnizca kendisine (`benim_puanim`, auth.uid()).
   Tabloya dogrudan erisim kapali, iki RPC tek kapi. Puan ancak 3+ oyla
   hesaplaniyor - tek oyla "10,0" o kisinin oyunu ele verirdi; seviye
   sayilari ise 1'den itibaren gorunuyor (mekan istatistikleriyle ayni
   sinif, karar 71). Kucuk mekanda kucuk sayi riski yukaridaki "mekan
   sayfasindaki sayilar" acik karariyla AYNI ve o karar hala acik.

Ek kural: yalnizca o mekanda check-in yapmis kisi oy verebiliyor. Bu
bir gizlilik onlemi degil, veri kalitesi onlemi (uzaktan oy sisirme).

## Konusmayi kendi tarafindan silme - 2026-09-14

Kullanicinin karari: Mesajlar listesinde satiri sola kaydirinca "Sil";
"Sil'e basinca benden silinir, karsi tarafta kalir." Dort soru:

- **Hangi veri:** `konusma_uyeleri.silme_zamani` (yalnizca bir zaman
  damgasi). Mesaj satirlari DEGISMIYOR.
- **Dayanak:** sozlesmenin ifasi (m.5/2-c) - kullanicinin kendi
  arayuzunu duzenlemesi. Karsi tarafin kopyasi onun verisi; onun
  gorunumu silinmiyor. Bir konusma iki kisiye ait, tek taraf digerinin
  kaydini yok edemez (erisim hakki bolumundeki ilkeyle ayni).
- **Sure:** mesajlar mevcut saklama kuralina tabi (madde 4); silme
  damgasi uyelik satiriyla birlikte yasar.
- **Kim gorur:** silen kisi silme anindan onceki mesajlari bir daha
  gormez (konusmalarim + mesajlari_getir sunucuda eler). Karsi taraf
  ve moderasyon paneli (sikayet uzerine, izli) eskisi gibi gorur.
  Konusma biri yazinca silen tarafa yalnizca yeni mesajlarla geri gelir.

Gizlilik metninde degisiklik gerekmedi: metin zaten mesajlarin karsi
tarafta kaldigini soyluyor. Canli olcum: `test:gorunurluk` senaryo 66.

## Yakin mekanlar listesinde kapak fotografi ve avatar yigini - 2026-09-14

Kullanicinin referans gorseli: her kartta mekan fotografi ve orada
bulunanlarin avatarlari. Dort soru:

- **Hangi veri:** (a) `mekanlar.kapak_fotograf` - kullanicinin cekip
  moderatorden gecirdigi mekan gorseli (kisisel veri degil, mekan
  verisi; yukleyenin kimligi gosterilmiyor). (b) mekanda SU AN canli
  check-in'i olan kisilerin kimligi ve avatari (kisisel veri, konumla
  bagli).
- **Dayanak:** sozlesmenin ifasi (m.5/2-c) - "gorunur ol" adimi; kisi
  `bulunurluk` ayariyla kimin gorecegini kendisi seciyor.
- **Sure:** yeni saklama YOK; canli check-in koordinatiyla birlikte 1
  saat (+cron gecikmesi) gorunur, sonra listeden duser.
- **Kim gorur:** YENI BIR GORUNURLUK ACILMADI. Liste `check_inler`i
  dogrudan okuyor, yani mekan sayfasindaki "kim burada" ile AYNI satir
  guvenligi ("check-in gorunurlugu" politikasi): yalnizca ayni mekanda
  canli olan ya da takip eden kisi gorur; profili gizli / engelli /
  askida hesap gorunmez. Kisi sayisi ise eskisi gibi kimliksiz toplam.
  Bu yuzden avatar sayisi sayidan kucuk olabilir ve bu bir hata degil.

Gizlilik metninde degisiklik gerekmedi: check-in gorunurlugu bolumu bu
durumu zaten anlatiyor.

## Profil paylasim karti: slooin.com/<kullanici_adi> - 2026-09-18

Kullanicinin istegi: "profilimi paylastigim zaman daha profesyonel
gorunsun". Paylasilan baglanti `https://slooin.com/<kullanici_adi>`;
sayfa sunucuda cizilip Open Graph etiketleriyle mesajlasma
uygulamalarinda kart (avatar + ad + Slooin) cikariyor. Dort soru:

- **Hangi veri:** ad, kullanici adi, ilk profil fotografi (24 saatlik
  imzali baglanti). Biyografi, bolge, Instagram, anilar, sayaclar
  YOK. Cagiran kimliksiz (WhatsApp onizleme robotu, tarayici).
- **Dayanak:** kisinin kendi eylemi - baglantiyi kendisi uretip
  kendisi gonderiyor (m.5/1 acik riza degil, m.5/2-c sozlesmenin
  ifasi + kisinin alenilestirmesi m.5/2-d). Baskasinin profilini
  paylasan icin: gosterilen veri o kisinin uygulamada ZATEN herkese
  acik tuttugu veri (kisi arama ayni uc alani veriyor).
- **Sure:** yeni saklama YOK; sayfa veriyi her istekte canli okur,
  kenar onbellegi 5 dakika, fotograf imzasi 24 saat.
- **Kim gorur:** baglantiya sahip herkes - AMA yalnizca kisi
  gorunmeyi secmisse: `profil_gizli` VEYA `aramada_gorunsun = false`
  ise kart YALNIZCA kullanici adini tasir (ad ve fotograf sunucuda
  NULL doner - `public.profil_karti`). Askida/yasakli/silinmis hesap
  404. Engelleme kimliksiz cagrida uygulanamiyor; engellenen kisi
  tarayicidan yalnizca bu uc alani gorur.
- **Sayim riski:** kullanici adi denenerek "boyle biri var mi"
  ogrenilebilir; bu, uygulamadaki kisi aramanin zaten verdigi bilgi.
  Ustteki iki ayar acikken ad ve yuz gelmedigi icin sizinti kullanici
  adiyla sinirli - o da baglantinin kendisinde.
- **Sifirlama yolu:** service role Supabase Edge Function'da
  (`profil-karti`) kaliyor; Cloudflare'e yalnizca anon anahtar
  gidiyor.

Gizlilik metni: "kullanici adin ve profil fotografin diger
kullanicilara gorunur" bolumu bunu zaten kapsiyor; paylasim
baglantisi yeni bir alici sinifi acmiyor (kisi kendisi gonderiyor).
Kullanici adlarindan sitenin sayfa adlari (gizlilik, kosullar, ...)
yasaklandi - veritabani kisiti + istemci listesi.

## Ayarlar yeniden tasarimi: oturumlar, bildirim tercihleri, mesaj izni - 2026-09-19

Ayarlar hub oldu (Hesabin / Gizlilik ve etkilesim / Uygulama / Hesap
islemleri). Kisisel veriye dokunan yeni parcalar ve dort soru:

- **Acik oturumlar** (`public.oturumlarim`, `oturumu_kapat`): kisi
  YALNIZCA KENDI `auth.sessions` satirlarini gorur (cihaz user-agent,
  IP, son etkinlik). Veri zaten Supabase Auth tarafindan tutuluyordu;
  yeni toplama yok, yeni bir GORME ve KAPATMA yolu var (m.11 erisim +
  guvenlik). Sure: Supabase oturum omru; kapatilan satir silinir.
  Gizlilik metnine madde yazildi (7 dil + docs).
- **E-posta degistirme**: once mevcut adrese, sonra yeni adrese kod;
  yeni adres dogrulanana kadar giris adresi degismez. Iki kod da 10
  dakika (Supabase OTP ayari). Yeni veri yok.
- **Sifre degistirme**: mevcut sifre `signInWithPassword` ile
  dogrulanir, degisince DIGER cihazlarin oturumlari kapatilir
  (`signOut({ scope: 'others' })`) - ele gecirilmis oturumu dusurmek
  icin.
- **Bildirim tercihleri** (`profiller.bildirim_*`, `sessiz_gece`,
  `saat_dilimi`): tercih verisi + IANA saat dilimi (gece sessizi
  yerel saatle calissin diye). Dayanak sozlesmenin ifasi (kisinin
  kendi tercihi). Edge Function gondermeden once okur; sunucudaki
  gonderim kaydi degismedi. Ani hatirlatmasi gunluk cron ile
  "bir yil once bugun" - yalnizca kisinin KENDI check-in'i, baskasi
  gormez; kisi kapatabilir (varsayilan KAPALI).
- **Mesaj izni** (`profiller.mesaj_izni`): herkes / yalnizca
  arkadaslar / hic kimse. Sunucuda `mesaj_gonder` icinde zorlanir;
  ret metni engellemeyle AYNI ("Bu kullanici bulunamadi") - sessizlik
  ilkesi korunuyor.
- **Gorunum (tema)**: CIHAZDA (AsyncStorage), sunucuya gitmez;
  kisisel veri islenmiyor.
- **Yardim merkezi "Sorun bildir"**: `mailto:destek@slooin.com` -
  posta Gmail'e duser (Resend maddesindeki not gecerli).
- **Topluluk kurallari** uygulama icinde okunur (App Store 1.2 UGC
  sarti); sikayet ve engelleme yolunu gosteriyor.

## Sikayete fotograf ekleme - 2026-09-19

Kullanici bir sikayete istege bagli tek bir fotograf ekleyebiliyor
(`sikayetler.fotograf`, ozel kova `sikayet-fotograflari`,
`<sikayet eden id>/<zaman>.jpg`; migrasyon `20260919110000`). Dort soru:

1. **Hangi veri:** sikayet edenin cihazindan sectigi bir gorsel. Ucuncu
   kisiyi (sikayet edileni ya da baskalarini) gosterebilir - bu yuzden
   gorsel HICBIR kullaniciya gosterilmez, yalnizca moderasyon delili.
2. **Dayanak:** mesru menfaat (kotuye kullanimin incelenmesi, m.5/2-f);
   sikayet listesindeki mevcut satirla ayni. Gizlilik metni 7 dilde
   guncellendi ("bir sikayete fotograf eklersen ... yalnizca moderasyon
   ekibi gorur").
3. **Sure:** sikayet kaydiyla ayni - kayit anonimlesse de (sikayet eden
   hesabini silince `sikayet_eden_id` null) dosya kovada kalir; kararli
   sikayetlerin 1 yil sonra silinmesi plani (gizlilik-metni.md) bu
   dosyayi da kapsayacak. Sikayet gonderilmeden vazgecilirse istemci
   yuklemiyor (secim cihazda kalir, yalnizca Gonder'de yuklenir).
4. **Kim gorur:** yukleyen (kendi klasoru) ve AAL2 moderator
   (`moderasyon.yetkili_mi()`); panel sikayet detayinda imzali adres,
   1 saat. Sunucu (`sikayet_gonder`) yolun sahibini dogruluyor -
   baskasinin dosyasi "delil" diye gosterilemez. Moderatorun sikayeti
   acmasi zaten denetim izine yaziliyor (mevcut kural).

Ayni turda: sohbet ekranindaki sikayet girisleri (ust bar + mesaja
uzun basma) kaldirildi; mesaj sikayeti sunucuda ve panelde duruyor,
yalnizca arayuz giris noktasi profil menusu. Ek aciklamanin 500
karakter siniri kalkti (sunucuda sinir yoktu).

## Baskasinin profilinde arkadas listesi ve ani sayisi - 2026-09-20

Baskasinin profilindeki sayaclar bolum seciyor; "Arkadas" bolumu o
kisinin arkadaslarini listeliyor (RPC `baskasinin_arkadaslari`,
migrasyon `20260920130000`) ve "Ani" sayaci sunucudan geliyor
(`baskasinin_profili.ani_sayisi`, migrasyon `20260920120000`). Dort soru:

1. **Hangi veri:** kisinin kabul edilmis arkadaslik iliskileri (kimin
   kiminle arkadas oldugu) ve ani ADEDI. Anilarin icerigi/konumu
   acilmiyor; adet konum degil.
2. **Dayanak:** hizmetin dogasi - sosyal uygulamada arkadas listesi
   profilin parcasi (sozlesmenin ifasi, m.5/2-c); gizlilik metni
   "arkadaslik bilgin" maddesini zaten sayiyor.
3. **Sure:** yeni veri yok; mevcut `takipler` satirlari okunuyor.
4. **Kim gorur:** PAYLASIMLARLA AYNI KAPI (`20260902120000` politikasi):
   hedef aktif, aramizda engel yok, profil gizliyse yalnizca arkadaslari.
   Listedeki kisiler de tek tek eleniyor (pasif / engelli gorunmez).
   Gizli profilin ani sayisi herkese gorunur (Instagram'in gizli
   hesapta gonderi sayisi gibi) - icerik degil, adet.

## Bu listeyi kullanma bicimi

Yeni bir is kalemi (faz, mini-faz, ozellik) tasarlanirken su dort soru
cevaplanir ve cevaplar spec'e yazilir:

1. Bu adim hangi yeni kisisel veriyi isliyor ya da hangi mevcut veriye
   yeni bir erisim yolu aciyor?
2. Hukuki dayanak ne (acik riza, sozlesmenin ifasi, mesru menfaat) ve
   kullaniciya bildirilmis mi?
3. Ne kadar sure saklanacak, kim silecek?
4. Kim gorebiliyor, ve bu erisim kayit altina aliniyor mu?

Erisimi **kesmek** varsayilan cozum degildir (bkz. moderasyon paneli
karar 63): yetki genis kalabilir, uyum seffaflik, denetim izi ve
saklama disiplini ile saglanir.

### Resend SMTP - 2026-09-13

Dogrulama postalari artik Supabase'in yerlesik postacisindan degil
**Resend** uzerinden gidiyor (`noreply@slooin.com`, alan adi Resend'de
DKIM/SPF ile dogrulandi, bolge eu-west-1 / Irlanda). Dort soru:
(a) hangi veri - e-posta adresi ve 6 haneli kod; (b) dayanak -
sozlesmenin ifasi (kayit/giris/silme dogrulamasi); (c) sure - Resend
gonderim gunlugu (adres + konu + teslimat durumu) Resend'de kalir,
kodun kendisi bir saatte gecersiz; (d) kim gorur - Resend (isleyen)
ve alicinin posta saglayicisi. Yurt disina aktarim envanterine 4.
satir olarak islendi; gizlilik metnine (uygulama 7 dil + docs) Resend
paragrafi eklendi, "uc aktarim" -> "dort aktarim".

`destek@slooin.com` Cloudflare Email Routing ile `slooinapp@gmail.com`a
yonlendiriliyor - gelen destek postasi Gmail'de durur; KVKK basvurulari
bu kanaldan gelecegi icin Gmail hesabinin erisimi de kisisel veri
erisimidir (2FA acik tutulmali).



## Check-in ifadesi (2026-09-21)

Kullanici check-in yaparken 108 ifadelik sabit setten (ornegin "Kahve
keyfi", "Huzurluyum") TEK ifade secebiliyor; `check_inler.ifade` (FK ->
`ifadeler.slug`), akis kartinda notun basinda gorunur.

- Hangi veri: kullanicinin sectigi ifade slug'i. Ruh hali ifadeleri
  ("Biraz uzgunum") duygu durumu anlatir ama serbest metin not zaten
  ayni sinifta; ozel nitelikli veri (saglik) degil, kullanicinin kendi
  paylasim secimi.
- Dayanak: notla ayni - sozlesmenin ifasi (m.5/2-c); paylasmak istege
  bagli, varsayilan bos.
- Sure: check-in ile ayni (anilar suresiz; check-in silinince silinir).
- Kim gorur: check-in'in gorunurluk kademesi neyse o; moderasyon ekibi
  sikayet uzerine.
- Kayit: `verilerimi_disa_aktar` check_inler bloguna `ifade` eklendi;
  kullanim kosullari 6. madde (icerik sahipligi) 7 dilde "not, ifade ve
  fotograf" oldu.

## Check-in fotograflarini sonradan degistirme / kaldirma; 5'e kadar fotograf (2026-09-21/22)

Bir check-in'e artik 5'e kadar fotograf eklenebiliyor
(`check_inler.fotograflar text[]`, migrasyon 20260921180000; eski tekil
`fotograf` sutunu turetilmis = ilk fotograf). Kullanici paylasimini
"Check-in'i duzenle" sayfasinda duzenlerken fotograf ekleyebilir,
kaldirabilir ya da degistirebilir (RPC `check_in_fotograflarini_guncelle`
kaldirilan yollari dondurur). Yeni veri kalemi yok, sayi artti; degisen
sey SILME disiplini:

- Kaldirilan ya da degistirilen eski fotograf kovadan GERCEKTEN
  silinir (istemci `remove`; kovaya "kendi klasorunu silebilir"
  politikasi eklendi). Onceden fotografi degistirme yolu yoktu, yani
  yetim dosya da olusmuyordu; artik olusabilecegi icin silme ayni
  isin parcasi (KVKK m.4 "gerekli sure kadar saklama", m.7 silme).
- Silme basarisiz olursa dosya hicbir satira bagli olmadigi icin
  sahibinden baskasina okunmaz (okuma politikasi satira bagli); yetim
  dosya sahibinin bir sonraki denemesinde gider.
- Yeni fotograf yolu `<kendi id>/...` olmak zorunda (2026-09-19
  sahiplik kurali burada da uygulanir); baskasinin dosyasi bir
  check-in'e baglanamaz.
- Canli olcum: `araclar/check-in-fotograf-degistir-canli-test.py` 15/15
  (5 siniri, baskasinin yolu/check-in'i, kaldirilan dosyanin kovadan
  silinmesi, disa aktarimda `fotograflar`).

## Begeni ve yorum bildirimleri; begenenler listesi (2026-09-22)

Paylasim sahibine, paylasimini begenen/yorumlayan kisi icin push
(`bildirim_etkilesim` anahtari, varsayilan acik, Bildirimler ayarinda
kapatilabilir) ve uygulama ici "Etkilesimler" bolumu; kartta begeni
sayisina dokununca begenenler listesi.

- Hangi veri: push metni YALNIZCA aktorun adi ("X paylasimini begendi",
  "X paylasimina yorum yapti") - yorum metni push'a GIRMEZ (karar 48).
  Uygulama ici listede yorumun metni gorunur: o zaten alicinin kendi
  paylasimindaki, gorebildigi yorum.
- Dayanak: sozlesmenin ifasi (m.5/2-c) - etkilesim bildirimi sosyal
  uygulamanin temel islevi; kullanici anahtarla kapatabilir.
- Sure: ayri bildirim tablosu YOK; liste begeniler/yorumlar satirlarindan
  RLS ile okunur, yani saklama suresi o satirlarinki (paylasim silinince
  cascade). Push'un kendisi Expo'da gecici.
- Kim gorur: yalnizca paylasim sahibi (RLS `check_inler.kullanici_id =
  ben` gomulu suzgeci). Begenenler listesi: paylasimi gorebilen herkes
  begenenleri gorur (begeniler RLS zaten boyleydi); engellenen kisi iki
  yonde de listede gorunmez (`akis_profilleri`).
- Kayit: Edge Function her olayda kaynak satiri dogrular; gizli
  (sikayet/moderasyon) yorum olay uretmez; kendi eylemi bildirilmez.
  Canli olcum: `araclar/begeni-yorum-bildirim-canli-test.py` 5/5 +
  Edge Function gunlugu ("alici islendi olay=begeni/yorum").

## Hikaye akisi: 24 saatlik fotograf + yazi + mekan, goruntuleyenler, sikayet (2026-09-22)

Ana sayfada Instagram benzeri hikaye seridi. Spec
`docs/superpowers/specs/2026-09-22-hikaye-akisi-design.md`, migrasyon
`20260922150000_hikayeler.sql`.

- Hangi veri: hikaye fotografi (kova `hikaye-medyalari`, ozel), istege
  bagli yazi (<= 200), istege bagli mekan etiketi (aktif check-in'den);
  goruntuleme kaydi (hikaye, kim, ne zaman). Hikayeye yanit = normal
  sohbet mesaji (mevcut mesaj kurallari).
- Dayanak: sozlesmenin ifasi (m.5/2-c) - kullanicinin kendi paylasimi;
  goruntuleme kaydi hizmetin parcasi ("kimler gordu"), yalnizca sahibine.
- Sure: 24 saat. Saatlik cron `hikaye-suresi-dolanlari-sil` once
  kovadaki dosyayi, sonra satiri siler; goruntulemeler cascade. Arsiv
  yok. Kullanici istedigi an siler (`hikaye_sil` + dosya). Hesap silme
  mevcut cascade ile hikayeleri de goturur (`kullanici_id` FK).
- Kim gorur (2026-09-22 GUNCELLENDI, migrasyon
  `20260922200000_hikaye_gorunurluk.sql`): artik HIKAYE BASINA secim -
  `gorunurluk` sutunu `arkadaslar` (varsayilan) ya da `herkese_acik`.
  'arkadaslar': sahibi + karsilikli arkadaslar (`takipler` 'kabul').
  'herkese_acik': giris yapmis herkes, hesabin AKTIF olmasi sartiyla
  (askidaki/yasakli hesabin icerigi yabancilara acilmaz). Secim oldugu
  gibi uygulanir: profil gizli olsa da "herkese" secilen hikaye herkese
  acilir - bu sahibinin o icerik icin verdigi acik karardir ve ekranda
  iki secenek disinda bir sey yazmaz (kullanicinin karari: "Aciklama yok
  arkadaslar ve herkese secenegi sadece"). Engel HER IKI halde de
  mutlak (`gizli.engelli_mi`, iki yonlu); moderasyonla gizlenen KIMSEYE
  (sahibi dahil) gorunmez. ANA SAYFA SERIDI yabanciya acilmaz: serit
  yalnizca kendim + arkadaslarim (`hikaye_akisi` p_kullanici null dali);
  "herkese acik" bir hikaye ancak o kisinin uzerinden acilir - yani
  gorunurluk bir KESIF akisi yaratmiyor. Kova SELECT ayni kuralla (hikayeler RLS uzerinden) +
  moderator. Goruntuleyen listesi YALNIZCA sahibine (`hikaye_goruntuleyenler`
  baskasina bos doner). Kendi hikayeni izlemek kayit uretmez.
- Moderasyon: sikayet hedefi 'hikaye' (yalnizca goren sikayet edebilir,
  kendi hikayesi olamaz); panelde fotograf + yazi + mekan + sahibi,
  "Hikayeyi gizle" / "Gizlemeyi kaldir" -> `moderasyon_denetim_izi`
  (`hikaye_gizle` / `hikaye_gizleme_kaldir`, gerekce zorunlu).
- Disa aktarim: `verilerimi_disa_aktar` -> `hikayelerim` +
  `hikaye_goruntulemelerim` (kendi hikayelerimi kimin gordugu; kimi
  izledigim baskasinin verisi sayildi, DAHIL DEGIL).
- Etiket yerlesimi (2026-09-22, migrasyon `20260922210000`): yazi,
  ifade, mekan ve arkadas etiketlerinin fotograf uzerindeki yeri
  `yerlesim` jsonb'sinde ORANSAL saklanir (x,y 0..1 + olcek). Kisisel
  veri degil, bicim verisi; sunucu icerigi yorumlamaz, yalnizca tipini
  ve 4 KB sinirini dogrular. Hikaye silinince onunla gider.
- Aydinlatma: gizlilik metni 1. madde "Hikayelerin" (gorunurluk secimi
  2026-09-22'de eklendi) + 6. madde saklama satiri, 7 dil +
  `docs/gizlilik-metni.md`.
- Canli olcum: `araclar/hikaye-canli-test.py` 20/20 (arkadas gorur /
  yabanci gormez, kova imzasi, goruntuleme sayaci ve listesi, 10 siniri,
  sikayet kurallari, moderasyon gizleme, disa aktarim, silme -> dosya
  gider, anon kapali).


## Hikayede ifade ve arkadas etiketi (2026-09-22)

Hikayeye check-in'dekiyle AYNI ifade sozlugunden tek bir ifade ve
arkadas etiketi eklenebiliyor (kullanicinin istegi). Dort soru:

- **Hangi veri:** `hikayeler.ifade` (sozluk slug'i) ve
  `hikaye_etiketleri` (hikaye, etiketlenen kisi, durum, zaman).
  Etiket BASKA BIR KISININ verisi oldugu icin ayri ele alindi.
- **Hangi dayanak:** hikayenin kendisiyle ayni - sozlesmenin ifasi
  (KVKK m.5/2-c); kisi ifadeyi ve etiketi kendisi seciyor. Etiketlenen
  kisi acisindan dayanak ACIK RIZA degil, ONAY MEKANIZMASI: profilinde
  "Etiket onayi gerekli" aciksa etiket onaylanana kadar KIMSEYE
  gorunmez (`durum = 'bekliyor'`), reddedilebilir. Karari sunucudaki
  tetikleyici koyuyor, istemcinin yazdigi deger yok sayiliyor.
- **Ne kadar sure:** hikayeyle birlikte 24 saat; saatlik temizlik
  hikayeyi silince etiket satirlari cascade ile gider. Arsiv yok.
- **Kim gorur, kaydediliyor mu:** yalnizca hikayeyi gorebilenler
  (sahibi + arkadaslar; engel iki yonlu, moderasyon gizli kimseye).
  Onaylanmamis etiket hicbir yerde gorunmez. Askidaki/yasakli hesap ve
  engelli kisi etiketi de gizlenir (`gizli.hikaye_etiketleri_json`).
  Ayri bir denetim izi tutulmuyor - etiket zaten hikayenin bir parcasi.

Erisim hakki (m.11): `verilerimi_disa_aktar` iki yonu de tasiyor -
kendi hikayemde `etiketlediklerim` ve baskasinin hikayesinde
`hikaye_etiketlerim` (kim etiketledi, durum, zaman). Ikincisinde
hikayenin fotografi ya da yazisi YOK; o baskasinin verisi.

Bekleyen etiketler check-in etiketleriyle AYNI listede (Bildirimler ve
Gizlilik > Etiketler > Bekleyen etiketler): kisi ayni yerden onaylayip
reddediyor, iki ayri kutu yok.

## Aniya ifade tepkisi; paylasan artik yazi/ifade/etiket eklemiyor (2026-09-24)

Kullanicinin karari: "ani paylasan ifade ya da yazi ekleyemiyor,
baskasi sadece o aniya ifade atabiliyor"; tepki paylasana "Gorenler"
listesinde gorunur (sohbete dusmez, push yok). Migrasyon
`20260924110000_hikaye_ifade_tepkisi.sql`.

- **Hangi veri:** `hikaye_goruntulemeler.ifade` - hangi kisinin hangi
  aniya hangi ifadeyi (108'lik sozlukten slug) attigi. Paylasan tarafta
  yeni hikayelerde yazi, ifade ve arkadas etiketi artik HIC toplanmiyor
  (veri azaldi).
- **Hangi dayanak:** sozlesmenin ifasi (KVKK m.5/2-c): ozelligin
  kendisi; kisi ifadeyi kendisi secip atiyor, geri alabiliyor.
- **Ne kadar sure:** goruntuleme satiriyla birlikte - ani 24 saatte
  silinince cascade ile gider; kisi ifadeyi her an kaldirabilir.
- **Kim gorur, kaydediliyor mu:** yalnizca ani sahibi
  (`hikaye_goruntuleyenler`, sahiplik kontrolu) ve atan kisinin
  kendisi (`hikaye_goruntulendi` doner). Aniyi goremeyen (engel,
  gizlilik, moderasyon) atamaz; kendi anina atilamaz; kurallar
  `hikaye_ifadesi_gonder` icinde. Ayri denetim izi yok.

Erisim hakki (m.11): `verilerimi_disa_aktar` sahibin dosyasinda
`hikaye_goruntulemelerim` satirlarina `ifade` ekledi, atanin dosyasinda
yeni `hikaye_ifadelerim` blogu var. Gizlilik metni 7 dil + docs
guncellendi.

## Anlik arsivi: anliklar artik suresiz saklaniyor (2026-09-24)

Kullanicinin karari: "anliklar 24 saat durucak; sag ustte atilan
anliklarin kayitli kalabilecegi bir alan, sureli olmayacaklar". Arsivi
YALNIZCA SAHIBI gorur; gorenler ve ifadeler 24 saatte silinir
(kullanicinin secimi). Migrasyon `20260924120000_anlik_arsivi.sql`.

- **Hangi veri:** kisinin kendi anlik fotografi, mekani, zamani ve
  gorunurluk secimi - artik 24 saat degil SURESIZ. Baskasinin verisi
  (goruntuleme, attigi ifade, etiket) arsive GIRMEZ.
- **Hangi dayanak:** sozlesmenin ifasi (KVKK m.5/2-c): kisinin kendi
  arsivi, kendi istegiyle tutulan bir hizmet ozelligi.
- **Ne kadar sure:** anlik ve fotografi sahibi silene ya da hesabini
  silene kadar. Goruntulemeler, ifadeler ve etiketler 24 saatte saatlik
  cron ile silinir. HESAP SILINCE fotograflar kovadan da silinir
  (`hesap-sil` v8; ayni turda eklendi - onceden saatlik temizlik
  ortuyordu). Ayni duzeltmede check-in'lerin 2.-5. fotograflarinin
  hesap silmede kovada kaldigi bulundu ve kapatildi.
- **Kim gorur, kaydediliyor mu:** 24 saat icinde secilen gorunurlukla
  arkadaslar/herkes; sonra YALNIZCA sahibi (RLS "kendi anlik arsivi";
  kova okumasi satira bagli oldugu icin baskasi fotografa da erisemez).
  Denetim izi yok.

Erisim hakki (m.11): `verilerimi_disa_aktar` `hikayelerim` blogu sure
suzgeci olmadan okudugu icin arsiv dosyada. Gizlilik metni 7 dil + docs
guncellendi ("arsiv tutulmaz" ifadesi kalkti).

## Anliga ifade atma KALDIRILDI; standart emoji + yanit sohbete (2026-09-24)

Kullanicinin karari: izleyicide 108'lik ifade seridi yerine fotografin
altinda standart emojiler, en altta "Yanit ver". Ikisi de sahibine
SOHBET MESAJI olarak gider (`hikayeyeYanitVer` -> `mesaj_gonder`); yeni
bir veri kalemi yok, mesajlasma maddesinin dort cevabi gecerli.
`hikaye_goruntulemeler.ifade` artik YAZILMIYOR (istemci
`hikaye_ifadesi_gonder` cagirmiyor); sutun ve RPC sunucuda duruyor,
eski satirlar 24 saatlik cron ile zaten siliniyor. Gizlilik metni 7 dil
+ docs "ifade kaydedilir" ifadesinden arindirildi.

## Kendi anligini izleme bayragi (2026-09-26)

- Hangi veri: `hikayeler.sahip_gordu` - sahibi kendi anligini izledi mi
  (tek bit). Baskasi hakkinda veri degil.
- Dayanak: sozlesmenin ifasi (seritte kendi anliginin yeni/goruldu
  gorunumu).
- Sure: anligin kendisiyle ayni (anlik satiri silinince gider).
- Kim gorur: yalnizca sahibi (`hikaye_akisi` baskasina bu bayragi
  vermez; baskasi icin gordum = kendi goruntuleme kaydi). Sahibin
  izlemesi Gorenler listesine YAZILMAZ.

## Anliga ifade birakma GERI GELDI; en sik ifadeler (2026-09-26)

- Hangi veri: izleyenin anliga biraktigi ifade (`hikaye_goruntulemeler.ifade`,
  108'lik sozlukten slug). "En sik ifadeler" listesi (`sik_ifadeler` RPC)
  kisinin KENDI birakma/check-in ifadelerinin adedinden ve butun uygulamanin
  YALNIZCA ADET toplamindan hesaplanir - kimin neyi kullandigi donmez.
- Dayanak: sozlesmenin ifasi (anliga tepki birakma ozelligi).
- Sure: goruntuleme satiriyla birlikte 24 saatte silinir (mevcut cron).
- Kim gorur: yalnizca anligin sahibi ("Gorenler" listesi). Standart emoji
  -> sohbet yolu kalkti; "Yanit ver" sohbete mesaj olarak gitmeye devam eder.
- Gizlilik metni 7 dil + docs guncellendi.
