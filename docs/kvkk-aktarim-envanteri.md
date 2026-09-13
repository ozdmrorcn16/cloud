# Yurt disina veri aktarim envanteri (KVKK m.9)

Tarih: 2026-09-13. Bu belge hukuki gorus degildir; bir KVKK
danismanina dogrulatilmadan mağaza basvurusunda dayanak olarak
kullanilmamalidir. Amac: hangi kisisel verinin, hangi rolle, hangi
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
| 3 | Apple Inc. (Apple Haritalar, iOS) / Google LLC (Google Haritalar, Android) | ABD | Bagimsiz veri sorumlusu (kendi kosullari) | Ekranda gorunen harita bolgesinin koordinatlari + cihaz IP'si. Kimlik, hesap, check-in gitmiyor | Harita zemini | Konum izni + aydinlatma | **Avukat sorusu:** bu bir "kisisel veri aktarimi" mi (koordinat + IP dolayli konum) yoksa isletim sisteminin kendi hizmeti mi. Sayilirsa sozlesme yolu yok - saglayici imzalamaz; alternatif harita zeminini kaldirmak | ACIK KARAR |
| 4 | Resend (planlaniyor, SMTP) | ABD | Veri isleyen | E-posta adresi + dogrulama kodu | Kayit/giris postasi | Sozlesmenin ifasi | Standart sozlesme (SMTP'ye gecince) | HENUZ YOK - su an Supabase'in yerlesik postacisi (1'in icinde) |
| 5 | Apple / Google (Sign in with Apple / Google Sign-In) | ABD | Bagimsiz veri sorumlusu | Kullanicinin kendi tetikledigi kimlik dogrulama; bize yalnizca kimlik jetonu geliyor | Sosyal giris | Kullanicinin eylemi | Saglayicinin kendi sozlesmesi; bizden ONLARA veri gitmiyor | Bilgi amacli |

Aktarim OLMAYAN, sik karistirilan seyler: "Yol tarifi al" (telefonun
kendi harita uygulamasi aciliyor, biz veri gondermiyoruz), Instagram
satiri (tarayici aciliyor), OSRM (kaldirildi), adres cozumu (kaldirildi).

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
5. [SEN + AVUKAT] Imza gelirse: imzadan itibaren 5 is gunu icinde
   Kurum'un online bildirim modulunden bildirim.
6. [BEN] Bildirim yapilinca gizlilik metnindeki "mekanizmamiz YOK"
   paragrafini yedi dilde guncellemek.
7. [AVUKAT] 3 numarali satir (harita) ve VERBIS muafiyeti.

Imza GELMEZSE secenekler (o gun karar): Kurul'a taahhutname
basvurusu (aylar surer), Expo'yu aradan cikarip APNs/FCM'e dogrudan
baglanmak (aktarim Apple/Google'a kalir), Turkiye'de barindirma
(Supabase'in TR bolgesi yok; kendi sunucu buyuk is).

## Mağaza etkisi

Apple ve Google bu sozlesmeleri SORMUYOR; onlarin istedigi gizlilik
metni adresi, veri guvenligi formu, hesap silme ve yas
derecelendirmesi - hepsi hazir. Bu belge mağaza basvurusunu
engellemez; hukuki yukumluluk ayri surer.
