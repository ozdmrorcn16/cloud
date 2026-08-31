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

### 2. Acik riza, ozellikle konum icin (KVKK m.5) - EKSIK

Isletim sisteminin konum izni ile KVKK anlaminda acik riza **ayni sey
degildir**. Bugun yalnizca birincisi var. Konum paylasimi icin ayrik,
bilgilendirilmis ve geri alinabilir bir riza akisi gerekiyor; riza
kaydinin ne zaman ve hangi metin surumu icin alindigi saklanmali.

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

### 6. Erisim ve tasinabilirlik hakki (KVKK m.11) - EKSIK

Kullanici kendi verisinin kopyasini alamiyor. Silme kadar acil degil ama
ayni maddeden dogan bir hak.

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
