# Gizlilik metni

Bu metin uygulama icinde `Ayarlar > Gizlilik metni` uzerinden okunur
(`mobil/src/app/gizlilik.tsx`). Kaynak metin burasidir; ekrandaki metin
bu dosyadan koda sabit olarak kopyalanir, ag baglantisi olmadan da
okunabilmesi icin uzak bir kaynaktan cekilmez.

Bu metin KVKK m.10 aydinlatma yukumlulugunu karsilar
(`docs/kvkk-uyum-listesi.md` madde 1). Hukuki gorus degildir; gercek
kullaniciya acilmadan once bir danismana dogrulatilmalidir (ayni
dosyadaki not gecerlidir).

## 1. Hangi verilerini isliyoruz

- Telefon numaran (hesap ve dogrulama icin)
- Adin, kullanici adin, dogum tarihin, biyografin, profil fotograflarin
- **Konumun** - yalnizca check-in yaptiginda
- Gonderdigin ve aldigin mesajlarin icerigi
- Bag bilgin: kimi takip ettigin, kimlerle sohbet istegi alisverisinde
  bulundugun, kimi engelledigin
- Bildirim gonderebilmemiz icin cihazinin bildirim jetonu
- Sikayet ettigin ya da hakkinda sikayet edilen bilgiler

## 2. Ne amacla isliyoruz

- Hesabini kurmak ve telefon numarani dogrulamak
- Yakinindaki kisileri kesfetmeni saglamak
- Mesajlasmani saglamak
- Kotuye kullanimi (taciz, sahte hesap, uygunsuz icerik) onlemek ve
  incelemek

## 3. Konum ozel olarak

Konumun yalnizca **check-in yaptiginda** paylasilir; check-in yapmadigin
surece hicbir konum bilgin islenmez. Paylasilan konum, o check-in icin
sectigin bulunurluk kademesine gore gorunur:

- **Herkese acik:** uygulamadaki herkes gorur
- **Sadece takipcilerim:** yalnizca karsilikli takiplerinin gordugu
- **Gizli:** kimse gormez, check-in yalnizca kendi gecmisinde kalir

`Gizli` sectiginde konumun kimseye gorunmez - moderasyon disinda (bkz.
madde 4).

## 4. Moderasyon erisimi

Bir sikayet aldiginda ya da kotuye kullanim suphesiyle incelenirken,
moderasyon ekibimiz **profilini, check-in'lerini ve mesaj iceriklerini
okuyabilir.** Bu, bulunurluk kademen `gizli` olsa da mesaj icerigin
`gizli` gorunse de gecerlidir - taciz ve kotuye kullanim iddialarini
inceleyebilmek icin gereklidir.

Moderasyonun **her erisimi kaydedilir**: kim, ne zaman, hangi kaydina
baktigi denetim izinde tutulur. Bu erisim yalnizca bir sikayet ya da
inceleme baglaminda kullanilir, gelisiguzel goz atma degildir.

## 5. Yurt disina aktarim

Verilerin iki ayri yerde islenir:

- **Supabase** (veritabani ve dosya depolama): sunucular **Almanya**'da
  (`eu-central-1` bolgesi). Butun kisisel verin Turkiye disinda, Avrupa
  Birligi sinirlari icinde tutulur.
- **Expo Push API** (bildirim gonderimi): sunuculari **Amerika Birlesik
  Devletleri**'nde. Bildirim gonderirken cihazinin bildirim jetonu ve
  kime gonderildigi bilgisi buradan gecer. Bildirim **icerik tasimaz**
  (mesaj metni bildirimde yer almaz, yalnizca "biri sana mesaj
  gonderdi" gibi genel bir bilgilendirme gider).

## 6. Saklama sureleri

- Anilarin (check-in gecmisin), mesajlarin ve sikayetler ilke olarak
  "gerekli oldugu sure kadar" saklanir; kalici bir imha takvimi henuz
  tamamlanmadi (bu, uyum listemizde acik bir madde olarak durur).
- Moderasyon erisim kayitlari (kim, ne zaman, hangi kaydina baktigi):
  **2 yil**.
- Karara baglanmis sikayetler: karardan **1 yil** sonra silinir.
  Karara baglanmamis sikayetler silinmez.
- Suresi dolmus hesap askiya alma kayitlari: **90 gun** sonra panelden
  kaldirilir; kalici kayit denetim izinde durmaya devam eder.

### Hesabini silersen ne olur

- Profilin, anilarin, baglarin (takip, sohbet istegi, engelleme) ve
  konusma listen **kalici olarak silinir**.
- Gonderdigin **mesajlar silinmez** - cunku bir konusma iki kisinin
  ortak verisidir ve karsi tarafin gecmisini yarida kesmek dogru olmaz.
  Ancak gonderen kimligin konusmadan koparilir; karsi taraf mesaji
  gorur ama artik senin adina baglanmaz.
- Hakkinda ya da senin actigin **sikayetler silinmez** - sikayet
  ucuncu kisiler hakkinda da bilgi tasidigi icin tek tarafli silinemez.
  Sikayet kaydindaki kimlik bagi kopar.
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
- **Basvuru yolu:** hesabinla ilgili bir talebin, sorunun ya da itirazin
  varsa uygulama icindeki destek/sikayet akisi uzerinden ya da
  hesabinla iliskili iletisim bilgin uzerinden bize ulasabilirsin.
