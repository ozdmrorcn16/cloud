# Yurt disina veri aktarim envanteri (KVKK m.9)

Tarih: 2026-09-13. Kullanicinin karari: avukat kullanilmayacak,
hukuki arastirma bu projede Claude tarafindan birincil kaynaklardan
(Kanun, Yonetmelik, Kurum duyurulari ve rehberi) yapilir ve her
iddia kaynagiyla yazilir. Amac: hangi kisisel verinin, hangi rolle, hangi
ulkeye, hangi amacla gittigini TEK YERDE ve kod ile birebir uyumlu
tutmak. Kod degisirse (yeni dis servis, kaldirilan servis) once bu
belge, sonra gizlilik metni (`docs/gizlilik-metni.md` ve
`mobil/lib/hukuki/*.ts`) guncellenir.

## Veri sorumlusu

Orcun Ozdemir (gercek kisi). Basvuru adresi: destek@slooin.com.

## Hukuki cerceve (ozet)

- KVKK m.9, 7499 sayili Kanun ile degisti (yurulukte: 2024-06-01).
  Siralama: (1) Kurul'un yeterlilik karari; yoksa (2) uygun guvence -
  Kurul'un **standart sozlesmesi**, baglayici sirket kurallari,
  Kurul onayli taahhutname; (3) yalnizca ARIZI aktarimlar icin
  istisnalar (acik riza dahil).
- Standart sozlesme: Kurul'un yayimladigi metin **degistirilmeden**
  imzalanir; imzadan itibaren **5 is gunu** icinde Kurum'a bildirilir.
- Bugun itibariyla Kurul'un herhangi bir ulke icin yeterlilik karari
  YOKTUR (AB dahil). Yani Almanya'daki barindirma da guvence ister.
- Bizim aktarimlarimiz surekli ve sistematik; "arizi aktarim"
  istisnasina girmez. **Acik riza bu is icin dayanak yapilmiyor** -
  gerekce: rizanin hizmete sart kosulmasi rizayi sakatlar, riza geri
  alinabilir, ve Kanun surekli aktarimda rizayi ana yol olmaktan
  cikardi.

## Aktarimlar

| # | Alici | Ulke | Rol | Giden veri | Amac | Dayanak (isleme) | Gereken guvence | Durum |
|---|---|---|---|---|---|---|---|---|
| 1 | Supabase Inc. (proje `swpiibyuoffykbmirvgq`, bolge eu-central-1) | Almanya (AB) | Veri isleyen | BUTUN veritabani ve dosya depolama: e-posta, ad, kullanici adi, dogum tarihi, biyografi, fotograflar, konum (check-in aktifken), mesajlar, bag grafigi, bildirim jetonlari, sikayetler, moderasyon izi | Barindirma - hizmetin kendisi | Sozlesmenin ifasi (m.5/2-c); moderasyon verisi mesru menfaat (m.5/2-f) | Standart sozlesme: **veri sorumlusundan veri isleyene** | EKSIK - talep yazisi hazir |
| 2 | Expo (650 Industries, Inc.) - Expo Push API | ABD | Veri isleyen | Cihaz bildirim jetonu, alici kullanici, bildirimi tetikleyen kisinin ADI. Mesaj metni HIC gitmiyor | Push bildirimi | Sozlesmenin ifasi + mesru menfaat | Standart sozlesme: veri sorumlusundan veri isleyene | EKSIK - talep yazisi hazir |
| 3 | Apple Inc. (Apple Haritalar, iOS) / Google LLC (Google Haritalar, Android) | ABD | Bagimsiz veri sorumlusu (kendi kosullari) | Ekranda gorunen harita bolgesinin koordinatlari + cihaz IP'si. Kimlik, hesap, check-in gitmiyor | Harita zemini | Konum izni + aydinlatma | **Aranmiyor** - veri cihazdan dogrudan saglayiciya gidiyor, biz iletmiyoruz (Rehber No. 48, "dogrudan ilgili kisi tarafindan iletilen veri" olcutu; asagida madde 4) | KARAR VERILDI: bizim aktarimimiz degil; gizlilik metninde seffaflik geregi yaziyor |
| 4 | Resend Inc. (alan adi `slooin.com`, bolge **eu-west-1 / Irlanda**, AWS SES altyapisi) | Irlanda (AB) - sirket merkezi ABD | Veri isleyen | E-posta adresi + 6 haneli dogrulama kodu (kayit, giris, hesap silme); alici adi yok | Dogrulama postasi (Supabase SMTP -> Resend, 2026-09-13'ten beri) | Sozlesmenin ifasi | Standart sozlesme: veri sorumlusundan veri isleyene | EKSIK - talep yazisi 2026-09-14'te gonderildi (bkz. talep yazilari, madde 3), cevap bekleniyor. Bolge AB secildi ki veri Supabase ile ayni hukuk alaninda kalsin |
| 5 | Apple / Google (Sign in with Apple / Google Sign-In) | ABD | Bagimsiz veri sorumlusu | Kullanicinin kendi tetikledigi kimlik dogrulama; bize yalnizca kimlik jetonu geliyor | Sosyal giris | Kullanicinin eylemi | Saglayicinin kendi sozlesmesi; bizden ONLARA veri gitmiyor | Bilgi amacli |

Aktarim OLMAYAN, sik karistirilan seyler: "Yol tarifi al" (telefonun
kendi harita uygulamasi aciliyor, biz veri gondermiyoruz), Instagram
satiri (tarayici aciliyor), OSRM (kaldirildi), adres cozumu (kaldirildi).

## Arastirma sonucu netlesen kurallar (2026-09-13, birincil kaynaklar)

Kullanicinin karari: avukat yok, hukuki arastirmayi ben yapiyorum.
Asagidakiler Kurum'un kendi metinlerinden okundu; kaynaklar dipte.

1. **Yeterlilik karari hicbir ulke icin yok** - Kurum sayfasi:
   "Bu konuda Kurul tarafindan henuz bir belirleme yapilmamistir."
   AB/Almanya dahil. Yani Supabase (Almanya) da guvence ister.
2. **Bulut barindirma AKTARIMDIR.** Rehber No. 48: "bir hizmet
   saglayici tarafindan sunulan yurt disinda bulunan bir bulutta
   depolama da ... bir aktarim olarak kabul edilecektir." Supabase
   ve Expo tartismasiz aktarim.
3. **Arizi = tek seferlik/birkac kez, sureklilik arz etmeyen**
   (Rehber No. 48, gerekce). Bizim aktarimlar surekli; m.9/6
   istisnalari (acik riza dahil) KULLANILAMAZ. Bu, "acik riza neden
   yok" sorusunun kaynakli cevabi.
4. **Dogrudan ilgili kisiden giden veri aktarim DEGIL.** Rehber No.
   48 (EDPB 05/2021'i izliyor): "kisisel verilerin dogrudan ilgili
   kisi tarafindan iletilmesi gibi, ... bir veri aktaran olmadigi
   durumlarda bu ikinci kriterin yerine getirildigi kabul
   edilemeyecektir." HARITA SATIRI ICIN KARAR: harita karesi
   istegi kullanicinin cihazindan isletim sisteminin kendi
   cercevesi (MapKit / Google Maps SDK) uzerinden dogrudan
   Apple/Google'a gidiyor; biz bu veriyi hic almiyor, tutmuyor ve
   iletmiyoruz; kimlikle bagli degil. Savunulan pozisyon: bu bizim
   yaptigimiz bir aktarim degil, cihaz-saglayici iliskisi (Apple ve
   Google'in kendi kullanici sozlesmesi). Kalan risk: SDK'yi
   uygulamaya biz gomdugumuz icin "erisilebilir kilan" biziz
   denebilir; bu yuzden gizlilik metninde seffaflik geregi
   yaziyor. Ayni mantik Apple/Google ile giris icin de gecerli.
   Satir 3 ve 5: KARAR VERILDI - standart sozlesme aranmiyor.
5. **Standart sozlesme 4 tip** (Kurul karari 2024/959, 4/6/2024):
   sorumlu->sorumlu, sorumlu->isleyen, isleyen->isleyen,
   isleyen->sorumlu. Bizimki: **veri sorumlusundan veri isleyene.**
6. **IMZA KURALI ASIL ENGEL.** Kurum duyurusu: metin degistirilemez;
   yabanci dilde duzenlenirse imzalar TURKCE metinde olmali;
   imza ISLAK imza ya da Turkiye'deki lisansli saglayicidan guvenli
   e-imza (yabanci sirket icin fiilen imkansiz, yani ISLAK);
   yabanci taraf yetkilisinin imza yetki belgesi APOSTILLI ve
   TURKCE TERCUMELI sunulmali; bildirim imzadan itibaren 5 is gunu
   icinde (fiziki, KEP ya da Standart Sozlesme Bildirim Modulu).
   Supabase/Expo gibi sirketlerin islak imza + apostilli yetki
   belgesi vermesi dusuk ihtimal - talep yazilari buna gore
   guncellendi.
7. **Ceza (2026):** standart sozlesme bildirim yukumlulugu ihlali
   90.308 - 1.806.177 TL; aydinlatma 85.437 - 1.709.200 TL; veri
   guvenligi 256.357 - 17.092.242 TL; VERBIS 341.809 - 17.092.242 TL.
   Cezalar sikayet/inceleme uzerine; alt sinir bile kucuk bir
   uygulama icin agir.
8. **VERBIS: MUAFIZ.** Kurul istisnasi (guncel: 2025/1572):
   yillik calisan < 50 VE bilanco < 100 milyon TL VE ana faaliyet
   ozel nitelikli veri islemek degil. Konum ozel nitelikli veri
   DEGIL (m.6 listesinde yok). Slooin: 0 calisan, bilanco yok, ana
   faaliyet ozel nitelikli veri degil. Kayit gerekmiyor; esikler
   asilirsa 30 gun icinde kayit.

**Karar: iki gercek aktarim var (Supabase, Expo) ve ikisi icin de
tek uyumlu yol standart sozlesme.** Imza gelmezse gercek secenekler:
(a) Expo'yu kaldirip APNs/FCM'e dogrudan gitmek - aktarim yine
Apple/Google'a olur ama satir 4'teki mantikla (isletim sisteminin
kendi bildirim kanali, cihaz jetonu zaten onlarin) daha savunulabilir;
(b) veritabanini Turkiye'de barindirmak (self-host Supabase, Turk
bulut saglayicisi; buyuk is, aylik gider); (c) kalan riski bilerek
tasimak - gizlilik metni durumu zaten acikca yaziyor.

## Yapilacaklar - sira

1. [BEN, yapildi] Bu envanter.
2. [BEN, yapildi] Supabase ve Expo'ya talep yazilari:
   `docs/kvkk-standart-sozlesme-talep-yazilari.md`.
3. [SEN] Kurum sitesinden guncel standart sozlesme metnini indir
   (kvkk.gov.tr > Yurt Disina Veri Aktarimi > Standart Sozlesmeler;
   tur: veri sorumlusundan veri isleyene). Metin degistirilmez;
   ekler doldurulur (taraflar, veri kategorileri, amac, sure).
4. [SEN] Talep yazilarini iki sirketin hukuk/destek kanalina gonder
   (Supabase: support@supabase.io / dashboard support; Expo:
   support@expo.dev). Sozlesmeyi ek olarak koy.
5. [SEN] Imza gelirse: imzadan itibaren 5 is gunu icinde
   Kurum'un online bildirim modulunden bildirim.
6. [BEN] Bildirim yapilinca gizlilik metnindeki "mekanizmamiz YOK"
   paragrafini yedi dilde guncellemek.
7. [YAPILDI] 3 numarali satir (harita) ve VERBIS muafiyeti - yukarida
   4 ve 8 numarali maddelerde karara baglandi.

Imza GELMEZSE secenekler (o gun karar): Kurul'a taahhutname
basvurusu (aylar surer), Expo'yu aradan cikarip APNs/FCM'e dogrudan
baglanmak (aktarim Apple/Google'a kalir), Turkiye'de barindirma
(Supabase'in TR bolgesi yok; kendi sunucu buyuk is).

## Kaynaklar

- Kurum, Yurt Disina Aktarim sayfasi: https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim
- Kurum, Standart Sozlesmelerde Dikkat Edilmesi Gereken Hususlar duyurusu: https://www.kvkk.gov.tr/Icerik/8170/
- Kurum, Standart Sozlesme Bildirim Modulu duyurusu: https://www.kvkk.gov.tr/Icerik/8043/
- Kurum, Kisisel Verilerin Yurt Disina Aktarilmasi Rehberi (Yayin No. 48): https://www.kvkk.gov.tr/Icerik/8142/
- 6698 s. Kanun m.9 (7499 ile degisik, yururluk 2024-06-01): https://mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf
- 2026 idari para cezalari (yeniden degerleme): https://www.mondaq.com/turkey/data-protection/1726256/
- VERBIS istisnasi 2026 esikleri: https://www.mondaq.com/turkey/data-protection/1736820/

## Mağaza etkisi

Apple ve Google bu sozlesmeleri SORMUYOR; onlarin istedigi gizlilik
metni adresi, veri guvenligi formu, hesap silme ve yas
derecelendirmesi - hepsi hazir. Bu belge mağaza basvurusunu
engellemez; hukuki yukumluluk ayri surer.
