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
| **Konum** | `check_inler.konum` (geography point) | **Yuksek riskli.** Projenin cekirdek riski; KVKK'da ozel nitelikli degil ama takip/taciz senaryosunun kaynagi |
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

### 1. Aydinlatma yukumlulugu (KVKK m.10) - BLOKE

Uygulamada gizlilik metni ekrani **yok**. Hangi verinin hangi amacla
islendigi, kimlere aktarildigi ve saklama sureleri kullaniciya
bildirilmis degil.

Moderasyon paneli spec'i (karar 63) bu maddeyi ilk dilime aldi, cunku
mesaj okuma yetkisiyle ayni anda yayina girmesi gerekiyor. Metnin
kapsamasi gerekenler: konum isleme, mesaj icerigi ve moderasyonun
kotuye kullanim incelemesinde mesaj okuyabilecegi, yurt disina aktarim,
saklama sureleri, ilgili kisi haklari ve basvuru yolu.

### 2. Acik riza, ozellikle konum icin (KVKK m.5) - EKSIK

Isletim sisteminin konum izni ile KVKK anlaminda acik riza **ayni sey
degildir**. Bugun yalnizca birincisi var. Konum paylasimi icin ayrik,
bilgilendirilmis ve geri alinabilir bir riza akisi gerekiyor; riza
kaydinin ne zaman ve hangi metin surumu icin alindigi saklanmali.

### 3. Yurt disina aktarim (KVKK m.9) - EKSIK, hukukcu onayi

Iki aktarim var ve ikisi de bugun belgelenmemis:

- **Supabase**, proje bolgesi `eu-central-1` (Almanya). Butun kisisel
  veri Turkiye disinda tutuluyor.
- **Expo Push API** (ABD), bildirim gonderiminde. Icerik tasimiyor
  (karar 48) ama cihaz jetonu ve alici bilgisi gidiyor - bu da kisisel
  veridir.

2024 degisikligiyle standart sozlesme yolu acildi; kullanilan yol ne
olursa olsun Kurum'a bildirim ve belgeleme gerekiyor. **Bir danismana
dogrulatilmali.**

### 4. Saklama ve imha politikasi - EKSIK

Bugun tek budama isi `istek_gunlugu` icin var (2 gun). Anilar, mesajlar,
sikayetler ve fotograflar suresiz saklaniyor. "Gerekli oldugu sure
kadar" ilkesinin karsiligi yazili degil.

Moderasyon paneli spec'i yeni veri depolari getiriyor
(`moderasyon_kayitlari`, `hesap_durumlari`), dolayisiyla bu maddeyi
ertelemek artik daha pahali. Spec'te onerilen sureler ve gerekceleri
"Saklama sureleri" bolumunde.

### 5. Silme hakki / hesabin silinmesi (KVKK m.11) - KAPSAMA ALINDI

Kullanicinin 2026-08-22 karariyla hem **hesap silme** hem **hesap
dondurma** kapsama girdi ve moderasyon paneli spec'inin Plan 1'inde yer
aliyor (karar 66-70). Silme kalicidir, bekleme suresi yoktur; geri
donmek isteyen sifirdan hesap acar. Dondurma, kararsiz kullanicinin
ihtiyacini karsiladigi icin silmenin geri alinamaz olmasini mumkun
kiliyor.

Cozulen ayrintilar: mesajlar ve sikayetler silinmez, gonderen
anonimlesir (bir konusma iki kisinin verisidir ve sikayet ucuncu kisi
hakkindadir); fotograflar Storage'dan silinir; kullanici adi 90 gun
rezerve edilir.

Ayrinti dusunulmeli: hesap silinince mesajlarin karsi tarafta ne olacagi
(karsi tarafin kendi verisi de var), anilarin ve sikayetlerin durumu,
denetim izinin korunmasi (moderasyon kaydi silinmemeli ama
kisisellestirmesi azaltilabilir).

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
