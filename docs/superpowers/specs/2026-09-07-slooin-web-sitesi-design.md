# Slooin internet sitesi - tasarim

Tarih: 2026-09-07. Kullanicinin istegi: "inter sitesinin yapimina
baslamaliyiz", ardindan "site hem apple hem google ikisinede uyarli
olucak kurallarina" ve gorsel yon icin "https://tr.swarmapp.com/ bu site
gibi yap", "referansin tam olarak aynisini yap bizim slooin yazimimiz
uygulamada kullandigimiz ve logomuzla".

## Karar ozeti

| Konu | Karar |
|---|---|
| Alan adi | `slooin.com` (kullanicinin secimi; RDAP ile bosta oldugu dogrulandi) |
| Kapsam | Bes sayfa: ana sayfa + dort hukuki/destek sayfasi |
| Gorsel yon | Swarm'in ana sayfasi birebir; tek ekran, kaydirma yok |
| Yigin | Astro, cikti duz HTML; JavaScript yalnizca hesap silme formunda |
| Barindirma | Cloudflare Pages |
| Veri sorumlusu | Gercek kisi: **Orçun Özdemir** + destek e-postasi (posta adresi YAYINLANMAZ) |
| Dil | Cok dilli YAPI kurulur; yayinda yalnizca Turkce ACIK (karar 2026-09-07) |

## 1. Site neden zorunlu

Site bir pazarlama tercihi degil, magaza sarti. Iki magazanin
gereklilikleri kaynagindan dogrulandi (2026-09-07):

| Gereklilik | Apple | Google Play |
|---|---|---|
| Gizlilik politikasi URL'si | Zorunlu; herkese acik **HTTPS sayfasi** olmali - PDF ya da kisaltma linki kabul edilmiyor. Dil basina ayri URL verilebiliyor. | Zorunlu |
| Destek URL'si | Zorunlu (Kilavuz 1.5) | Gelistirici iletisim bilgisi zorunlu |
| Hesap silme | Uygulama ICINDE silme zorunlu | Ayrica **web'den erisilebilir** bir silme URL'si zorunlu; kullanici uygulamayi sildikten sonra da ulasabilmeli. 15 Nisan 2024'ten beri yururlukte. |

Sonuc: **gizlilik politikasi URL'si olmadan iki magazaya da basvuru
yapilamiyor**, dolayisiyla site magaza basvurusundan ONCE yayina
girmeli. Bu, ana sayfadaki indirme blogunun ilk halde olu baglanti
tasimamasi gerektigi anlamina geliyor (bkz. bolum 3).

Uygulama ici silme bizde ZATEN var (`hesap-sil` Edge Function); eksik
olan tek sey web tarafi.

## 2. Alan adi

RDAP ile olculdu (yontem, bilinen kayitli alan adlariyla dogrulandi -
`google.com` ve `expo.app` 200, yani sorgu calisiyor):

```
slooin.com  -> kayitli degil
slooin.app  -> kayitli degil
slooin.net  -> kayitli degil
slooin.co   -> RDAP yonlendirilmiyor, sonuc alinamadi
slooin.io   -> RDAP yonlendirilmiyor, sonuc alinamadi
```

Kullanicinin secimi `slooin.com`. Satin alma kullanicida.

Ayni alan adi bekleyen **SMTP borcunu** da cozuyor: `destek@slooin.com`
Resend uzerinden baglanacak (ucretsiz katman ayda 3.000 mail).
Supabase'in yerlesik e-posta servisi saatte yalnizca birkac mail
gonderiyor, gercek kullaniciya yetmiyor.

## 3. Sayfa yapisi

| Adres | Ne | Karsiladigi sart |
|---|---|---|
| `/` | Tanitim, tek ekran | - |
| `/gizlilik` | Gizlilik politikasi | Apple + Play |
| `/kosullar` | Kullanim kosullari | Kayit ekranindaki atfin karsiligi (bugun belge YOK) |
| `/destek` | Destek ve iletisim | Apple Kilavuz 1.5 |
| `/hesap-sil` | Hesap silme | Play'in web silme URL'si |

### Ana sayfa

Swarm'in duzeni birebir uygulandi. Referans olculdu (1280 px goruntude
sayfa yuksekligi 853 px, marka turuncusu `#FFA633`):

```
sag ust            : cerceveli "Giris" hapi
sol blok           : buyuk kelime markasi
                     -> magaza rozetleri alt alta
                     -> kisa slogan + logo isareti
sag blok           : ust uste binen iki telefon maketi
alt (ince beyaz)   : ortalanmis hukuki baglantilar
```

Referanstan **sapilan tek nokta**: bizde marka tanidik olmadigi icin
"nasil calisir" anlatimi eklenmesi onerildi; kullanici reddetti
("referansin tam olarak aynisini yap"). Sayfa tek ekran kaldi. Bes
adimlik anlatim (check-in yap / gorunur ol / populer yerleri kesfet /
yakinindakilerle tanis / sohbet et) siteye GIRMEDI - ileride bir "nasil
calisir" sayfasi acilirsa oraya girer.

**Indirme blogu ilk halde olu baglanti tasimaz.** Site magazadan once
yayina girecegi icin rozetler "Yakinda App Store'da" / "Yakinda Google
Play'de" yazar ve tiklanabilir degildir; uygulama yayinlaninca gercek
baglantiya donusur.

**Uydurma veri yok.** Ne kullanici sayisi, ne yorum/referans, ne de
"su an N kisi burada" iddiasi. Bu kural karsilama ekraninda 2026-08-27'de
konmustu (ornek check-in kartlari tam bu yuzden kaldirilmisti) ve
sitede de gecerli.

## 4. Marka kullanimi

### Varliklar

Uygulamanin KULLANDIGI dosyalar kullanilir, yeniden cizim yapilmaz.
Turuncu zemin icin dogru surumler olculerek secildi (opak piksellerin
ortalama rengi):

| Dosya | Ortalama renk | Nerede |
|---|---|---|
| `marka-yazisi-koyu.png` | `(244, 235, 226)` acik harf | Kelime markasi - turuncu zeminde bu |
| `marka-yazisi.png` | `(9, 5, 4)` koyu harf | Turuncu zeminde KULLANILMAZ |
| `marka-isareti-koyu.png` | `(255, 255, 255)` beyaz | Isaret - turuncu zeminde bu |
| `marka-isareti-acik.png` | `(249, 93, 2)` turuncu | Turuncu zeminde kaybolur, KULLANILMAZ |

Marka turuncusu `#FE7813` degismez (bkz. `tema.ts` icindeki jeton notu).

### Radar: konum ignesinden yayilan sinyal

Kullanicinin istegi: "slooin yazisinida daha afilli farkli birsey
yapabilirmisin ozgun birsey ve logoyuda daha iyi kullan", ardindan "sol
o radar yaptigini onu kaldirip i nin uzerindeki checkin ikonunu radar
gibi yap" ve "daha yavas ve tutarli bir radar sinyali yap hizala birde".

Kelime markasinin uzerine, ayni `viewBox` (1200x348) ile bindirilmis bir
SVG katmani konuyor; boylece yazi hangi boyutta olursa olsun hizalama
kaymiyor. Katman `overflow: visible`, halkalar yazinin ust hizasini
asabiliyor.

**Olculer PNG uzerinden alindi, tahmin edilmedi:**

```
"i" ustundeki konum ignesi  : bbox x 869-953, y 2-106
ignenin BAS DAIRESI merkezi : (911, 44.5), yaricap 42.5
  (en genis satirlar y=41-48, genislik 85 px)
```

**Yasanmis hata, tekrar edilmesin:** ilk yerlestirmede merkez `(911, 31)`
alinmisti. O deger turuncu piksellerin AGIRLIK MERKEZINDEN geliyordu ve
igne damla bicimli oldugu icin agirlik merkezi yukari kaciyor - halkalar
13,5 piksel yukarida duruyordu. Dogru referans, ignenin en genis
satirlarindan bulunan bas dairesi merkezidir.

**Hareket DOGRUSAL hizda.** Uc halka `1 -> 2.5` olceginde buyuyor,
tur 4,8 saniye, gecikmeler 0 / 1,6 / 3,2 saniye.

Yumusatilmis egri (`ease-out`) DENENDI VE TERK EDILDI - tekrar
onerilmesin. O egride halkalar once firliyor sonra suruenuyor; uc halka
esit gecikmeyle baslatilsa bile aralari surekli degistigi icin sinyal
duzensiz gorunuyor. Kullanicinin "tutarli olsun" istegi tam olarak bunu
isaret ediyordu. Dogrusal hizda aralik sabit kaliyor.

Dogrulandi (puppeteer, `getComputedStyle` ile):

```
hizalama : igne merkezi (320.3, 276.8) - halka merkezi (320.2, 276.8)
tutarlilik: uc halkanin olcek farklari 0.500 ve 0.500 (esit)
```

Sayfa ilk acildiginda halkalar birer birer devreye giriyor (ucuncu
3,2 saniyede); bu bilerek - hepsi ayni anda baslasa tek kalin bir halka
gorunurdu.

`prefers-reduced-motion` acikken hareket duruyor ve ignenin cevresinde
tek bir sabit halka kaliyor (temel opaklik 0.45), yani bos bir yer
olusmuyor.

### Kaldirilan oge - kayda geciyor

Ilk tasarimda sag "o" harfinin icine turuncu bir nokta konmustu ("orada
birisi var"). **Ekranda hic gorunmuyordu:** dolgusu marka turuncusuydu,
harfin bosluguendan gecen zemin de ayni turuncu. Kaldirildi. Ders:
turuncu zemin uzerinde turuncu bir oge cizilemez; harfin icindeki
bosluk arkadaki zemini gosterir.

### Logo isareti

Iki yerde: slogan yaninda 54 px, ve turuncu alanin sol altindan tasan
buyuk bir filigran olarak (opaklik 0.085). Filigran, referanstaki
bulutlarin islevini goruyor - genis turuncu alani duz bir blok olmaktan
cikariyor.

### Telefon maketleri

Referansta gercek uygulama ekranlari var; bizde de gercek ekran
goruntusu kullanilacak. **Su anki maketteki ekranlar yeniden cizimdir ve
uygulama yazilirken gercek goruntulerle degistirilecektir.**

Goruntuler kendi test hesabimizdan alinacak - gercek bir kullanicinin
adi, fotografi ya da check-in'i tasiyan goruntu yayinlanmaz (KVKK).

Maketlerde gosterilen mekanlar veritabaninda GERCEKTEN kayitli ve ilce
bilgisi kendi kayitlarindan geliyor:

```
Galata Kulesi   - Beyoglu,  Istanbul
Emirgan Korusu  - Sariyer,  Istanbul
Yildiz Parki    - Besiktas, Istanbul
Gulhane Park    - Fatih,    Istanbul
```

Olcu seridindeki sayilar tire (—) olarak birakildi; gercek goruntu
alinincaya kadar uydurma sayi yazilmaz.

## 5. Hesap silme akisi

Sitenin en teknik parcasi. **Sunucuda degisiklik GEREKMIYOR** - kod
okundu ve dogrulandi:

- `hesap-sil` Edge Function'inda CORS basligi
  `Access-Control-Allow-Origin: *` ve OPTIONS preflight yaniti var.
- `verify_jwt` ACIK; yetkilendirmenin tamami cagiranin JWT'sine
  dayaniyor.

Akis:

```
1. Kullanici e-posta + parola girer
2. signInWithPassword -> oturum (JWT)
3. hesap-sil cagrilir; govdede { parola }
4. Fonksiyon parolayi SUNUCUDA yeniden dogrular (istemci atlayamaz),
   Storage yollarini toplar, auth.admin.deleteUser calistirir,
   BASARILI donerse Storage'i temizler
5. Onay ekrani: ne silindi, ne kaldi
```

Sitenin kendisi hicbir yetkiye sahip degil; service-role anahtari
siteye GIRMEZ.

### Kenar durumlar - sayfada karsiligi olmali

1. **Parolasi olmayan hesaplar.** Kayit e-posta koduyla basliyor
   (`signInWithOtp`); parola ancak profil olusturma adiminda
   belirleniyor. Yarida birakan birinin parolasi yok, dolayisiyla
   `signInWithPassword` calismaz. Bu kisiler icin destek e-postasi yolu
   sayfada yazili olacak.
2. **Telefonla acilmis eski hesaplar.** Edge Function e-posta VE
   telefonu destekliyor (bu sirayla), ama site formu e-posta soruyor.
   Bugun gercek kullanici yok (olculmustu: veritabanindaki hesaplarin
   hepsi test numarasi), yine de sayfada not duracak.
3. **Askidaki / dondurulmus hesaplar da silebilmeli.** Silme yasal bir
   hak; moderasyon durumu engel olmamali. Fonksiyon hesap durumuna
   bakmiyor, yani bu zaten dogru calisiyor - degistirilmemeli.

### Erisim

Sayfa giris duvarinin ARKASINDA OLMAZ. Ne silindigini anlatan metin
herkese acik, form altta. Play "uygulamayi silmis kullanici
erisebilmeli" diyor.

### Ne silinir, ne kalir

Sayfa durust olacak: mesajlar ve sikayetler **silinmiyor,
anonimlesiyor** (karar 69, `set null`). Bunu yazmamak yanlis beyan
olurdu.

## 6. Hukuki icerik

### `/gizlilik`

Kaynak `docs/gizlilik-metni.md`. Iki eksigi var:

1. **Veri sorumlusu kimligi yok.** KVKK aydinlatma yukumluluegue
   veri sorumlusunun kimliginin metinde yer almasini istiyor.
   Kullanicinin karari: ad soyad + destek e-postasi; adi 2026-09-07'de
   verdi - **Orçun Özdemir**. **Posta adresi yayinlanmaz**; basvurular
   e-posta uzerinden alinir.
2. **Somut saklama suresi yok.** 30 dakika kuralinin kaldirilma karari
   sonrasi metinlerde sabit sayi yerine "check-in suresi dolunca"
   yaziyor. Bu ACIK BORC olarak duruyor (bkz. bolum 9).

### `/kosullar`

**Sifirdan yazilacak - elimizde hic yok**, ama kayit ekranindaki metin
buna atif yapiyor. Kapsam: 18 yas siniri, hesap kurallari, yasakli
davranis (taciz, sahte hesap, baskasini taklit), icerik sahipligi,
askiya alma ve yasaklama, sorumluluk siniri, uygulanacak hukuk.

### `/destek`

SSS + iletisim adresi. Apple Kilavuz 1.5 "gercek bir yardim yolu"
istiyor; yalnizca bir e-posta adresi koymak zayif kalir, sik sorulanlar
da bulunmali.

## 7. Teknik yapi ve dagitim

```
site/                 Astro projesi (depo icinde, mobil/ ve panel/ ile kardes)
  src/pages/          index, gizlilik, kosullar, destek, hesap-sil
  src/bilesenler/     ortak baslik/altbilgi, marka lockup
  public/             marka varliklari, gercek ekran goruntuleri
```

**Neden Astro, neden SPA degil:** hukuki sayfalar JavaScript'in
arkasinda kalmamali. Apple gizlilik politikasinin herkese acik bir HTTPS
sayfasi olmasini sart kosuyor; duz HTML bunu tartismasiz karsiliyor.
Depoda zaten Vite + React var (`panel/`) ama o bir yonetim araci - orada
SPA dogru, burada degil.

**Neden Cloudflare Pages, neden EAS Hosting degil:** EAS Hosting'de ozel
alan adi UCRETLI plan gerektiriyor (kaynaktan dogrulandi). Cloudflare
Pages'te statik site ve ozel alan adi ucretsiz.

Uygulamanin web surumu (`slooin.expo.app`) DEGISMIYOR; site ayri bir
dagitim. Ana sayfadaki "Giris" dugmesi oraya gidiyor.

Supabase anon anahtari yalnizca `/hesap-sil` sayfasinda gerekli, derleme
degiskeninden gelecek. **Depoya yazilmaz** - depo public.

## 8. Dogrulama

| Ne | Nasil |
|---|---|
| Hukuki sayfalar JavaScript kapaliyken aciliyor mu | Apple sarti; tarayicida JS kapatilarak olculur |
| Hesap silme uctan uca | CANLI, atilabilir bir hesapla. Jest yetmez - mock'lanmis test gercek sunucu davranisini dogrulamaz, bu sinif hata daha once yasandi |
| Yatay tasma | Masaustu ve 390 px telefon, `scrollWidth` olcumu |
| Olu baglanti | Butun ic ve dis baglantilar gezilir |
| Radar hizasi | Igne merkezi ile halka merkezi karsilastirilir |

## 9. Acik kararlar ve bagimliliklar

1. **Saklama suresi belirlenmedi.** Check-in gorunurluk suresi
   kullanicinin secebilecegi bir ayara donusecek ama hangi surelerin
   sunulacagi kararlastirilmadi. KVKK sure belirtilmesini ister; o karar
   verilene kadar gizlilik sayfasinda somut sure olmayacak. Site bu
   karar olmadan da yayinlanabilir, cumle sonradan guncellenir.
2. **Alan adi satin alinmadi.** `slooin.com` bosta; satin alma
   kullanicida. Alan adi olmadan Cloudflare Pages'e ozel alan adi
   baglanamaz ve `destek@slooin.com` kurulamaz.
3. **Gercek ekran goruntuleri alinmadi.** Maketlerdeki ekranlar yeniden
   cizim.
4. **Apple Developer hesabinin bireysel mi kurumsal mi oldugu
   dogrulanmadi.** Bireyselse magaza zaten kullanicinin yasal adini
   satici olarak yayinliyor, yani sitede adin gecmesi ek bir ifsa
   olmuyor.

## 10. Bulunan veri sorunu - ayri is kalemi

Maket icin mekan secerken olculdu: veritabaninda ayni adla yanlis
koordinatli kopyalar var.

```
"Galata Kulesi" -> Beyoglu (dogru), ayrica Cekmekoy, Silivri,
                   Buyukcekmece, Sariyer, Fatih kayitlari
"Moda Sahili"   -> Sancaktepe, Fatih, Uskudar, Atasehir
                   (Moda Kadikoy'de; temiz bir kayit YOK)
```

Ilce yanlis atanmis DEGIL - ilce koordinattan poligon testiyle
atandigi icin dogru; yanlis olan kaydin KENDI koordinati. Kaynak
Foursquare'den gelen bozuk kopyalar.

Siteyle ilgisi yok ama uygulamanin ARAMA sonuclarini dogrudan
etkiliyor: kullanici "Moda Sahili" arayinca bu kopyalar da listeye
duesuer. Ayri bir is kalemi olarak ele alinmali.

## 11. Kapsam disi (YAGNI)

- Blog, basin kiti, kariyer sayfasi
- Diger dillerin CEVIRISI (yapi kurulur, iceriik sonra yazilir -
  bkz. bolum 12)
- Analitik ve cerez - statik site, cerez kullanmiyor; boylece cerez
  bildirimi de gerekmiyor
- Uygulamanin web surumunu bu siteye tasimak - `slooin.expo.app`
  oldugu yerde kaliyor

## 12. Cok dillilik

Kullanicinin karari (2026-09-07): "site farkli dillerde de uyarli
olucak". Sunulan uc secenekten **"yapi simdi, ceviri sonra"** secildi.

### Neden ceviri ertelendi

Iki olculu sebep:

1. **Magaza tek bir calisan dille gecer.** Apple gizlilik politikasi
   URL'sini dil basina AYRI kabul ediyor ama zorunlu tutmuyor;
   basvuruyu bloke eden sey tek bir erisilebilir sayfa. Yani ceviri
   magaza basvurusunu bekletmez - siteyi yapma sebebimiz o basvuruydu.
2. **Yarim cevrilmis hukuki metin, cevrilmemisten kotudur.** Gizlilik
   politikasi ve kullanim kosullari BAGLAYICI belgeler; bir dildeki
   eksik ya da hatali cumle, o dildeki kullanici icin gecerli olan
   cumledir. Uygulamanin kendisinde alti dil geride ve eksik anahtarlar
   Turkce'ye duesuer (`lib/dil.tsx`); hukuki metinde boyle bir geri
   duesme YAPILAMAZ.

### URL semasi: Turkce kokte kalir

```
/gizlilik          -> Turkce (kok, DEGISMEZ)
/en/gizlilik       -> Ingilizce (dil acildiginda)
```

Turkce'yi de `/tr/` altina almak DENMEDI ve yapilmayacak: magaza
basvurularina ve gizlilik metnine yazilacak adresler kok adreslerdir,
onlari sonradan degistirmek kirik baglanti uretir.

### Yayinda yalnizca Turkce ACIK

Diller tek bir yapilandirma listesinde (`DILLER`) tutulur ve ilk
surumde yalnizca `tr` icerir. Sonucu onemli: **uretilen adresler bugun
oldugu gibi kalir**, cunku kok dil Turkce. Bir dil eklemek, listeye bir
satir ve o dilin metin dosyasini eklemekten ibaret olur.

Bos bir `/en/gizlilik` sayfasi YAYINLANMAZ. Bir dil ancak dort hukuki
metni de tam yazildiginda listeye girer.

### Yapinin gercekten calistigi nasil dogrulanir

`dogrula.mjs` ikinci bir dili gecici olarak acip butun sayfa setinin
uretildigini, `hreflang` etiketlerinin karsilikli oldugunu ve dil
seciciinin gorundugunu olcer. Yoksa "yapi hazir" iddiasi test edilmemis
bir iddia olarak kalir - bu projede daha once tam bu sinif hata
yasandi (politika yazildi, tablo yetkisi verilmedi, ozellik aylarca olu
kaldi).
