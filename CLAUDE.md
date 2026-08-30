# Proje Hafizasi

Bu dosya her Claude Code oturumunda otomatik olarak yuklenir. Oturumlar arasinda
tasinmasini istedigimiz her sey buraya yazilir.

## Nasil calisiyor

Claude'un kendi basina oturumlar arasi hafizasi yoktur; her oturum sifirdan
baslar. Sureklilik su uc dosyayla saglanir:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Kalici hafiza. Her oturum basinda otomatik okunur. Kararlar, tercihler, proje durumu. |
| `docs/konusma-gunlugu.md` | Oturum indeksi + karar defteri. |
| `docs/oturumlar/` | Her oturumun tam dokumu (hook tarafindan otomatik yazilir). |

Oturum dokumleri `.claude/hooks/oturum-kaydet.py` tarafindan otomatik uretilir;
ayrintilar `docs/konusma-gunlugu.md` icinde.

## Claude icin kurallar

- Oturuma baslarken `docs/konusma-gunlugu.md` dosyasindaki son girdileri oku.
- Kalici bir karar alindiginda (teknoloji secimi, kapsam, isim, mimari) bu
  dosyayi veya konusma gunlugunu guncelle ve commit'le.
- **Her sey GitHub'a push edilir.** Kullanicinin karari (2026-08-19):
  2026-08-14'te konan "hicbir sey push edilmeyecek" kurali kaldirildi.
  Commit attiktan sonra `git push` calistir; ayrica izin istemeye gerek
  yok. Yeni dal aciyorsan `git push -u origin <dal>`.
- Sirlar asla depoya girmez. Depo public ve artik her sey itiliyor;
  gercek API anahtari ne teste, ne ornege, ne belgeye yazilir. (Bu daha
  once bir kez yasandi: gercek bir Pexels anahtari teste ornek deger
  olarak yazilip push edilmisti.)
- Kullaniciyla Turkce konus.
- **Gizlilik ve KVKK her adimda gozetilir** (kullanicinin karari,
  2026-08-22): "Attigimiz her adimda ... gizlilik ilkeleri ve KVKK
  kurallarini ihlal etmicek sekilde ilerlememiz gerek." Yeni bir is
  kalemi tasarlarken `docs/kvkk-uyum-listesi.md` okunur ve guncellenir;
  o dosyanin sonundaki dort soru (hangi veri, hangi dayanak, ne kadar
  sure, kim gorur ve kaydediliyor mu) spec'te cevaplanir. Uyum sonradan
  eklenen bir katman degil, her isin icinde tasinan bir kisittir.
  Onemli ayrim: cozum isletmeci yetkisini KESMEK degil; yetki genis
  kalir, uyum aydinlatma metni, denetim izi ve saklama suresi ile
  saglanir.

## Proje durumu

- **Depo:** `ozdmrorcn16/cloud`
- **Calisma dali:** `claude/faz2b-guvenlik` (2026-08-19'da kullanicinin
  acik istegiyle `origin`'e push edildi; bulut oturumlari artik kodu
  gorebiliyor)
- **Asama:** Faz 2b tamamlandi (18/18 gorev). Sirada moderasyon paneli
  ya da Faz 3.
- **Guncelleme (2026-08-19, Faz 2c kapanisi):** Calisma dali su an
  `claude/faz2c-kimlik`. Faz 2c (kimlik ve kisi arama) tamamlandi
  (16/16 gorev). Ayrinti asagida "Faz 2c TAMAMLANDI" bolumunde.
- **Guncelleme (2026-08-20, Faz 3a kapanisi):** Calisma dali su an
  `claude/faz3a-bag`. Faz 3a (bag: takip/sohbet istekleri, uc kademeli
  gorunurluk) tamamlandi (18/18 gorev, hepsi incelendi) - asagidaki
  "ARSIV - Faz 3a'nin ortasinda yazilmis devam notu" basligindaki 8/18
  notu artik gecersiz. Ayrinti asagida
  "Faz 3a TAMAMLANDI" bolumunde.

- **Guncelleme (2026-08-20, Faz 3b kapanisi):** Calisma dali su an
  `claude/faz3b-sohbet`. Faz 3b (birebir sohbet) tamamlandi (18/18
  gorev, hepsi incelendi). Faz 3a birlestirilip `claude/faz2c-kimlik`'e
  push edildi; 3b onun ucundan ayrildi. Ayrinti asagida "Faz 3b
  TAMAMLANDI" bolumunde. Fazin gunu gunune gunlugu (hangi commit hangi
  gorev, ortam tuzaklari, faz sirasinda yasanan guvenlik olayi)
  `docs/faz3b-devam-notu.md` icinde durur; artik bir "devam noktasi"
  degil, tarihsel kayit. Kalan takip isleri:
  `docs/faz3b-takip-isleri.md`.

- **Guncelleme (2026-08-22, Plan 1 kapanisi):** Calisma dali su an
  `claude/plan1-hesap-haklari`. **Plan 1 (hesap durumu temeli ve
  kullanici haklari) TAMAMLANDI** - 18 gorevden 17'si uygulandi; Task 14
  (kullanici adi rezervasyonu) uygulanip ayni oturumda **kullanici
  karariyla GERI ALINDI** (karar 70), yani ozellik yok, ilgili tablo ve
  RPC dusuruldu. **SIRADAKI IS: Plan 2 (moderasyon paneli).** Plan 2'ye
  gecmeden once brief'te tanimli elle tarayici gezintisi
  (dondur -> cikis -> giris -> otomatik geri acilma, askidaki hesap
  ekrani, silme akisi, gizlilik ekrani) **kullaniciya birakildi** -
  etkilesimli, insan gerektiriyor. Ayrinti asagida "Plan 1 TAMAMLANDI"
  bolumunde, kalan borclar `docs/plan1-takip-isleri.md` icinde.

- **Guncelleme (2026-08-23):** Uc sey oldu, ucü de kayitli:
  (1) **Uygulamanin adi SLOOIN, kesin** (karar 72) - app.json guncellendi
  (name Slooin, slug/scheme slooin); alan adlari kontrol edildi, ana
  uzantilar bosta, satin alma kullanicida. Marka tescili magaza oncesi is.
  (2) **Gorsel kimlik belirlendi** (karar 73-74): beyaz + tek turuncu
  vurgu (#FF6B1A), tam kanama fotograf kapaklari + karartma, cam rozetler,
  yuzer gezinme cubugu, Bricolage Grotesque + Instrument Sans. Kanvas
  calisma dosyalari `tasarim/slooin-kanvas/`, yayin "Slooin Tasarim"
  Artifact'i. KARAR 74 ONEMLI: ekran metinleri DUZGUN TURKCE olacak
  (aksanli); ASCII kurali yalnizca kod/yorum/commit icin. Uygulamanin
  mevcut ASCII UI metinleri kimlik koda tasinirken cevrilecek.
  SIRADAKI TASARIM ADIMI: kullanici kanvasa bakip onaylarsa kimligi
  gercek uygulamaya tasima plani yazilacak.
  (3) Expo SDK ici paketler 57.0.15'e hizalandi; expo-image config
  plugin'i app.json'a girdi. **Telefonda deneme: Expo Go DENENDI VE
  OLMADI** (surum uyumsuzlugu asilamadi); kullanicinin karariyla APK
  yoluna (EAS build) gecilecek. MEVCUT DURUM: eas-cli calisiyor ama
  GIRIS YAPILMAMIS (`npx eas-cli whoami` -> Not logged in), `eas.json`
  yok, `app.json`da `android.package` ve `projectId` tanimsiz.
  **GUNCELLEME (ayni gun, commit 5a6f49d): giris disindaki hazirlik
  BITTI.** `app.json`a `android.package` ve `ios.bundleIdentifier`
  (`com.slooin.app`) ile uc native config plugin'i (expo-location,
  expo-image-picker, expo-notifications) eklendi; izin metinleri
  ekran metni sayildigi icin duzgun Turkce yazildi (karar 74).
  `eas.json` elle yazildi: development / preview / production
  profilleri, preview APK uretir. Dogrulama: `npx expo-doctor` 21/21
  gecti; `npx expo prebuild --platform android` gercekten calisti ve
  uretilen manifestte `applicationId com.slooin.app`,
  ACCESS_FINE/COARSE_LOCATION ve VIBRATE izinleri dogrulandi (uretilen
  `android/` klasoru ve prebuild'in package.json'a yaptigi yan
  degisiklik geri alindi; CNG akisi korunuyor).

  KALAN TEK ENGEL: `npx eas-cli whoami` hala `Not logged in`. Giris
  interaktif parola istedigi icin ajan yapamaz, kullanici yapmali:
  `! npx eas-cli login` (hesap yoksa `! npx eas-cli register`).

  GIRISTEN SONRAKI SIRA: (a) `eas init` (projectId'yi app.json'a yazar),
  (b) **Supabase degiskenlerini EAS'e tanimla** - `mobil/.env` gitignored
  oldugu icin derleme sunucusuna YUKLENMEZ; anahtarsiz APK acilista
  patlar. Cozum `eas env:create --environment preview` ile
  EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanimlamak
  (eas.json'daki `"environment": "preview"` bunlari derlemeye tasir).
  Anahtarlar eas.json'a YAZILMAZ - depo public.
  (c) `eas build --profile preview --platform android` -> APK linki
  telefona indirilip kurulur. Not: ilk derleme kuyrukta 10-30 dk
  surebilir (ucretsiz katman); ilk derlemede EAS Android keystore
  uretmek icin onay isteyebilir, o adim interaktifse kullaniciya
  birakilir.

### GERCEK HARITA (iOS + Android) EKLENDI - 2026-08-30

Kullanicinin karari: kesfet ve check-in harita ekranindaki radar
cizimi yerine GERCEK harita, iOS ve Android'de; web'de radar kaliyor.
Secilen yol A: `react-native-maps` 1.27.2 - iOS'ta Apple Haritalar
(anahtarsiz, ucretsiz), Android'de Google Haritalar. Spec:
`docs/superpowers/specs/2026-08-30-gercek-harita-design.md`.

- `src/tasarim/CanliHarita.native.tsx` (gercek harita) ve
  `CanliHarita.tsx` (web radari) AYNI arayuzu veriyor; ekranlar
  degismedi. Metro platforma gore dosyayi seciyor.
- `app.config.js` YENI: app.json'u alip `react-native-maps`
  eklentisini ekliyor; Android anahtari `GOOGLE_MAPS_ANDROID_ANAHTARI`
  cevre degiskeninden. ANAHTAR DEPOYA YAZILMAZ. Prebuild ile
  dogrulandi: degisken varsa manifest'e `com.google.android.geo.API_KEY`
  giriyor.
- jest-expo iOS ontanimli oldugu icin ekran testleri artik NATIVE
  bileseni render ediyor; `react-native-maps` mock'u `jest.setup.js`
  icinde (Marker testID: `harita-ignesi`).
- Kaydirma kapali, yakinlastirma acik (ScrollView icindeki kartta tek
  parmak kaydirma sayfayla cakisiyordu). Sistemin mavi konum noktasi
  kapali; merkez bizim turuncu igne. Yuz yok.
- Gizlilik metni madde 5 ve `docs/kvkk-uyum-listesi.md` 3. madde:
  harita saglayicisina giden veri yazildi.

**KALAN (kullanicida):**
1. iOS: TestFlight derlemesi - harita orada ilk kez GORULECEK.
2. Android: Google Cloud'da Maps SDK for Android anahtari almak
   (faturalandirma hesabi sart, mobil SDK ucretsiz), anahtari paket
   adina (`com.slooin.app`) ve imza SHA-1'ine kisitlamak, sonra
   `eas env:create --environment production --name
   GOOGLE_MAPS_ANDROID_ANAHTARI --value <anahtar>` (preview icin de).
   Anahtar yokken Android'de harita zemini gri kalir.
3. `npx expo-doctor` 14 paketin guncel olmadigini soyluyor
   (react-native 0.86.2 -> 0.86.3 vb.) - bu ISTEN ONCE de vardi,
   harita degisikligiyle ilgisi yok; ayri bir bakim isi.

### DEVAM EDEN IS: FOURSQUARE TEK KAYNAK YUKLEMESI (2026-08-30, gece)

Kullanicinin kararlari sirasiyla: (1) Foursquare'i cek, (2) birlestirme
degil TEK KAYNAK Foursquare - "daha tutarli, temiz"; Overture yalnizca
ilce/adres bilgisini bagislar, sonra silinir (check-in yapilmis 16 mekan
haric), (3) "Mekanlarin ilce ve adres bilgisi olsun", (4) veritabani
compute buyutulmeyecek, yavas ucretsiz yoldan devam.

DURUM (oturum bittiginde bakilacak):
- `fsq_hazirlik` tablosunda 5.980.482 Foursquare satiri (kapali,
  bayrakli ve mekan olmayan kategoriler elenmis) YUKLU.
- `mekanlar`'a aktarim SURUYOR: `mobil/araclar/fsq-birlestir.mjs`
  uc paralel surec (FSQ_RPC=fsq_aktar, boylam dilimleri 25.6-32 /
  32-38 / 38-44.9), loglar `araclar/fsq-aktarim-*.log`. Hiz disk
  yuzunden ~120 satir/sn (compute en kucuk boy: 224 MB shared_buffers);
  tahmini 10+ saat. `fsq_aktar` idempotent (on conflict fsq_place_id),
  yarim kalirsa AYNI komutla yeniden baslatilir; tamamlanan dilimler
  hizla gecer.
- mekanlar uzerindeki konum/tur/kategori/trgm indeksleri aktarim icin
  KULLANICININ ONAYIYLA GECICI OLARAK DUSURULDU. Aktarim bitince
  YENIDEN KURULMALI (sirasiyla): mekanlar_konum_idx (gist konum),
  mekanlar_ad_trgm_idx (gin tr_kucuk(ad) gin_trgm_ops),
  mekanlar_tur_idx, mekanlar_kategori_idx; sonra ANALYZE. Indeksler
  yokken uygulamada kesfet/arama calismaz.
- Ilce/adres zenginlestirme YERELDE suruyor: `araclar/fsq-semt-doldur.py`
  -> `araclar/fsq-tr-semtli.parquet` (semt: 300 m icindeki en yakin
  Overture; adres: 60 m icinde adi eslesen Overture). Bitince
  `FSQ_PARQUET=araclar/fsq-tr-semtli.parquet` ile yukleyici yeniden
  kosulur - ama hedef tablo mekanlar olmali (fsq_place_id uzerinden
  upsert; yukleyiciye FSQ_TABLO ekleme gerekiyor, henuz yok).
- Check-in yapilmis 16 Overture mekanindan 11'i Foursquare karsiligina
  baglandi (`fsq-checkin-koru.mjs`); 5'i Foursquare'de yok, Overture
  satiri olarak kalacak.
- SONRA: Overture satirlari silinir
  (`delete from mekanlar where kaynak='overture' and id not in (select
  mekan_id from check_inler)`; 877 bin satir, tur_duzeltme_gecmisi
  cascade), VACUUM, test:sema + test:gorunurluk, telefonda kesfet/arama,
  karar defteri (konusma-gunlugu) ve bu notun temizlenmesi.
- Kullanicinin HF token'i sohbete yapistirildi; iptal etmesi istendi.

### FOURSQUARE DENEMESI - 2026-08-30 (karar bekliyor)

Kullanicinin istegiyle Foursquare OS Places (Hugging Face, kapili,
Apache 2.0) Bursa kesiti indirilip Overture verimizle karsilastirildi.
Rapor: `docs/foursquare-denemesi-2026-08-30.md`. Ozet: sosyal
mekanlarda (kafe/restoran/bar/park) Foursquare bizim ~10 katimiz kayit
tasiyor; tur dogrulugu Overture'a BENZER (tur sorununu cozmuyor);
gurultu ve eskilik var. ONERI: Overture kalsin, Foursquare yalnizca
sosyal turlerde EK kaynak olarak birlestirilsin. Karar kullanicida.
Deneme icin acilan gecici RPC'ler dusuruldu; canliya dokunulmadi.
Kullanicinin HF token'i sohbete yapistirildi - iptal etmesi istendi;
oturum kaydi betigine `hf_...` maskesi eklendi.

### DEVIR NOTU - 2026-08-27/30 (tasarim turu, yayin ve TestFlight)

Calisma dali ayni: `claude/plan2-moderasyon-paneli`. Her sey commit'li
ve push'lu.

**EN ONEMLI DEGISIKLIK: UYGULAMA KALICI ADRESTE YAYINDA.**
`https://slooin.expo.app` - EAS Hosting. Tunel yolu birakildi.
Yayinlamak icin `cd mobil && npm run yayinla`.

**BEKLEYEN TEK IS: TestFlight.** Kullanici Apple Developer hesabini
acti. Benim tarafimdaki hazirlik BITTI (EAS production ortamina
Supabase degiskenleri tanimlandi, app.json'a ihracat uyumlulugu ve
tablet bayraklari eklendi, kullanilmayan mikrofon izni engellendi).
Kalan adim KULLANICININ kendi terminalinde:

```
npx eas-cli build --platform ios --profile production
# Apple girisi + 2FA; Bundle ID, sertifika, profil ve PUSH KEY icin
# "evet" denecek. Push key atlanirsa bildirim calismaz.
npx eas-cli submit --platform ios --latest
```

**Bu turda degisen ekranlar (hepsi yayinda):**

| Ekran | Ne oldu |
|---|---|
| Karsilama | Ornek kartlar kalkti; arka plan sicaklik haritasi (`SicaklikZemin`) |
| Ana sayfa | Marka uste, altinda "Ara" kutusu (KISI aramasi, mekan degil); akis ORTAK CHECK-IN KARTI (2026-08-30: zaman tuneli kaldirildi, `AniTuneli.tsx` silindi) |
| Profil | Turuncu kimlik bandi, uc sayi (Ani/Yer/Arkadas), Duzenle+Paylas, Anilar/Yerler sekmeleri, kurdeleli madalya rozetleri |
| Check-in (kesfet) | Km cipleri kalkti, harita en ustte; aktif check-in varsa kart o mekani ve Ayrildim/Sil gosteriyor |
| Bildirimler | YENI sekme (Kisiler'in yerine): arkadaslik istekleri + etiket onaylari |
| Ayarlar | "Profilini duzenle" ve "Gecmis anilarim" satirlari kalkti |
| Mekan detayi | SILINDI |

**Kalici kararlar (tekrar onerme):** sayfa zemini TAM BEYAZ (yalnizca
karsilama sicak); profilde ayri "su an buradasin" seridi YOK; check-in
ekraninda gorunurluk secimi YOK (Ayarlar'daki varsayilan kullaniliyor).

**ACIK BORCLAR:**
1. `test:gorunurluk` icinde ETIKET ONAYI senaryosu yok
   (`docs/plan2-takip-isleri.md`).
2. ~~Veritabani 420/500 MB~~ KAPANDI: 2026-08-30'da Supabase PRO
   plana gecildi; pg_trgm indeksi kuruldu, arama havuzu kalkti
   (migrasyon 20260830090000). Guven esigi (0.60) hala acik karar.
3. ~~Gun ayraci metinleri~~ KAPANDI: `AniTuneli` 2026-08-30'da silindi
   (ortak CheckInKarti her yerde), gun ayraci artik yok.
4. Test hesaplarindaki ornek veriler SAHTE; silme komutu
   `docs/elle-test-listesi.md` icinde.

### KARAR: mekan detay ekrani SILINDI (2026-08-29)

Kullanicinin karari: "Checkin yaptiktan sonra bu ekran gelmesin
checkin ekraninda kalmaya devam etsin o attigim ekrani sil".

`src/app/mekanlar/[id].tsx` ve testi SILINDI. O ekran bir mekanin
adini, semtini ve orada su an olan kisileri gosteriyordu; check-in
sonrasi otomatik olarak aciliyordu.

Iki degisiklik birlikte yapildi:
1. `check_in_yap` sonrasi yonlendirme `/mekanlar/<id>` yerine
   `/mekanlar` (check-in sekmesi). Kart zaten "Şu an buradasın"
   haline geciyor, yani kullanici sonucu ayni ekranda goruyor.
2. Mekan detayina giden ON BAGLANTI `/check-in/<id>` adresine
   yonlendirildi (akis, profil, anilar, kesfet listesi, harita,
   mekan ekleme, check-in karti). Yani bir mekana dokununca artik
   o mekanin check-in ekrani aciliyor.

KAYBEDILEN ISLEV, bilerek: "bu mekanda su an kimler var" listesi
artik hicbir yerde gosterilmiyor. Yogunluk SAYISI kesfet listesinde
duruyor ama kimlikler yok. Geri istenirse o ekranin git gecmisinde
tam hali duruyor.

### ORTAM TUZAGI: `mobil/.expo` KLASORUNU SILME (2026-08-29)

`mobil/.expo/types/router.d.ts` expo-router'in URETTIGI tip dosyasidir
ve `tsconfig.json` onu `include` ediyor. Klasor gitignore'da, yani
depoda yok - yalnizca yerelde uretiliyor.

Silinirse `npx tsc --noEmit` ALAKASIZ gorunen hatalar veriyor, ornek:

    src/app/_layout.tsx(51,57): error TS2493:
    Tuple type '[string]' of length '1' has no element at index '1'

Sebep: `segments` dizisinin tipi daralıyor. Kodda hicbir sey bozuk
degil.

**Yeniden uretmenin yolu `expo export` DEGIL** (denendi, uretmiyor).
Dev sunucusunu bir kez calistirmak gerekiyor:

```bash
cd mobil && npx expo start --web --port 8099    # ~40 sn bekle
# .expo/types/router.d.ts olusunca sunucuyu kapat
```

Onbellek temizligi yaparken `dist` ve `node_modules/.cache` silinebilir
ama `.expo` SILINMEMELI.

### ORTAM TUZAGI: `eas deploy` ANINDA YAYINA GECMIYOR (2026-08-28)

Iki kez yasandi ve ikincisinde OLCULEREK dogrulandi. `eas deploy --prod`
komutu "Production URL" yazip basariyla donuyor, ama adresi hemen o an
acarsan BIR ONCEKI surumu gorebiliyorsun.

Belirtisi yaniltici: degisiklik yapiyorsun, testler geciyor, yayina
aliyorsun, ekran goruntusu aliyorsun ve ESKI hali goruyorsun. Ilk
seferinde bunu "expo export eski onbellegi kullandi" diye teshis
ettim - **o teshis YANLISTI**. Ikinci seferinde olctum:

- `dist/` icindeki paket DOGRUYDU (`grep marginTop:32` sifir sonuc,
  yani yeni degerler pakette).
- `--clear` ile ve `dist`/`.expo`/`node_modules/.cache` tamamen
  silinerek yeniden uretilen paketin **hash'i degismedi** - yani
  export zaten dogru calisiyordu.
- Ayni komutu tekrar `eas deploy --prod` ile yayinlayip olcunce
  degerler dogru geldi.

**KURAL: bir degisikligin yayina gectigini ekran goruntusuyle
dogrularken, goruntu eskiyi gosteriyorsa once YENIDEN YAYINLA.**
Metro onbellegini suclamadan once bunu dene.

Olcum icin gozle bakmak yerine sayisal yontem daha guvenilir: sayfadaki
ogelerin `getBoundingClientRect()` ve `getComputedStyle()` degerlerini
puppeteer ile dokmek. Bosluk tartismasinda "sanki degismemis" demek
yerine `marginTop: 32px` -> `16px` diye kesin sonuc verir.

### KARAR: mesafe siniri kalkti, check-in 1 km (2026-08-28)

Kullanicinin karari: kesfet ekranindaki "1 km / 2 km / 5 km" cipleri
KALDIRILDI, harita en ustte. Liste ve arama artik mesafeyle
kirpilmiyor; siralama en yakindan. Tek mesafe kurali check-in'de ve
**500 m degil 1 km** (migrasyon 20260828090000, sunucuda zorlaniyor).

`yakin_mekanlar_yogunluk` artik `p_yaricap_metre = null` kabul ediyor;
null gelirse `ST_DWithin` hic uygulanmiyor, PostGIS'in KNN operatoru
(`<->`) en yakin 50 kaydi veriyor. Istemci null gonderiyor.

**GUNCELLEME 2026-08-30: PRO PLANA GECILDI, pg_trgm INDEKSI KURULDU,
ARAMA HAVUZU KALKTI** (migrasyon 20260830090000). Asagidaki olcum
tablosu tarihsel kayit; "20.000 mekan havuzu" ve "baska sehirdeki
mekan aramada cikmaz" siniri ARTIK YOK. `mekanlar_ad_trgm_idx`
(`tr_kucuk(ad)` uzerinde GIN, 51 MB; veritabani 471 MB) kuruldu ve
`yakin_mekanlar_yogunluk` tek sorgu bicimine indi: filtre butun
tabloda, siralama en yakindan, limit 50. Planlayici terime gore
indeks seciyor - nadir terimde trgm (47.700 ms -> 177 ms), yaygin
terimde ("kafe") konum indeksi + filtre (~900 ms, degismedi).
`tr_kucuk` IMMUTABLE; fonksiyon degisirse indeks yeniden kurulmali.

**ARAMADA MALIYET KILOMETREYLE DEGIL SAYIYLA SINIRLI - olculdu**
(TARIHSEL, 2026-08-28; yukaridaki guncellemeye bak).
`ad` uzerinde `like '%...%'` vardi ve pg_trgm indeksi kurulu degildi
(veritabani 500 MB ucretsiz sinirin dibinde). Bursa merkezinden
olculen gercek sureler:

| Sorgu | Sure |
|---|---|
| yaricapsiz, aramasiz (KNN + limit 50) | 125 ms |
| yaricapsiz, NADIR arama terimi | **47.700 ms** |
| 200 km yaricap, nadir terim | **13.900 ms** |
| 25 km yaricap, nadir terim | 710 ms |
| en yakin 20.000 mekan havuzu, nadir terim | 470 ms |

PostgREST zaman asimi 8 saniye; bu yuzden arama o gun en yakin
20.000 mekan icinde yapilmisti (Bursa merkezinde ~18 km). Bu sinir
2026-08-30'da kaldirildi.

Test mekanlarinin arasi 1.967 m olcuIdu, yani 1 km'lik yeni check-in
kurali `test:gorunurluk` senaryolarini bozmuyor.

### KARAR: sayfa zemini TAM BEYAZ (2026-08-27)

Kullanicinin karari: "Ilk baslangic ekrani disindaki butun sayfalarin
arka planini tam beyaz yap" ve ardindan karsilama ekraninin ekran
goruntusuyle "Bu sayfa disinda butun acilan ekranlarin arka planini
tam beyaz yap".

Uygulanisi: `renk.zemin` jetonunun DEGERI `#FAF7F3` -> `#FFFFFF`
yapildi, boylece o jetonu kullanan 30'dan fazla ekran tek hamlede
degisti. Karsilama icin yeni jeton: `renk.karsilamaZemini` (#FAF7F3),
yalnizca `karsilama.tsx` ve `SicaklikZemin.tsx` kullaniyor.

**DIKKAT - yeni ekran yaparken:** `renk.yuzey` de beyaz. Yani kart ile
sayfa zemini artik RENKLE ayrilmiyor; ayrimi `renk.cizgi` kenarligi ve
`golge.kart` tasiyor. Kenarliksiz ve golgesiz bir kart beyaz zeminde
gorunmez olur. Mevcut ekranlar kontrol edildi (ayarlar, profil,
kesfet, kisiler): hepsinde kenarlik ya da golge zaten vardi.

### DEVIR NOTU - 2026-08-27 (kalici yayin adresi)

**Uygulama artik kalici bir adreste yayinda: https://slooin.expo.app**

Tunel yolu (cloudflared quick tunnel) BIRAKILDI. Sebep kullanicinin
sikayetiydi: adres her calistirmada degisiyordu ve tarayici depolamayi
adrese bagladigi icin her seferinde yeniden giris gerekiyordu.

Secilen yol **EAS Hosting** (`eas deploy`). Gerekce: Expo hesabina
(`byorcun`) zaten giris yapilmisti ve `app.json` icindeki EAS projesi
(`972aa05d-569b-4a5a-ab75-2b149fd8588c`) bagliydi; yeni hesap acmak
gerekmedi. Adres KOK dizinde (`/`), yani PWA manifest'indeki
`start_url` ve `scope` degerleri ("/") oldugu gibi calisiyor -
GitHub Pages alt yolu (`/cloud/`) secilseydi `experiments.baseUrl`
ayari ve manifest yollarinin tamami degistirilmek zorunda kalirdi.

**Yeniden yayinlamak icin tek komut** (mobil/ icinden):

```bash
npm run yayinla     # expo export --platform web && eas-cli deploy --prod
```

Uretim adresi her yayinda AYNI kalir; her yayin ayrica kendi
`slooin--<hash>.expo.app` adresini de alir (geri donmek gerekirse).

`araclar/ekran-goruntusu.mjs` artik `SLOOIN_TABAN_ADRES` cevre
degiskenini okuyor; varsayilan yerel 127.0.0.1:8080, yayindaki surumu
denetlemek icin `SLOOIN_TABAN_ADRES=https://slooin.expo.app` verilir.

**Guvenlik / KVKK notu:** adres kalici olarak internete acik. Uc sey
dogrulandi: (1) `service_role` anahtari ve test sifresi `dist/` icinde
YOK (yalnizca `EXPO_PUBLIC_*` degerleri gomulu, ki anon anahtar zaten
RLS ile korunuyor); (2) Supabase'de SMS saglayicisi tanimli DEGIL,
yani adresi bulan biri gercek bir numarayla hesap acamaz - yalnizca
test numaralari kod aliyor; (3) veri tarafinda RLS devrede.

**ELLE TEST LISTESI: `docs/elle-test-listesi.md`.** Fazlardan devreden
butun "elle tarayici gezintisi" borclari (Faz 2b, 2c, 3a, 3b, Plan 1)
tek listede toplandi; iki hesap gerektirenler isaretli.

**TEST NUMARASI SORUNU (karar bekliyor):** kayit akisini bastan sona
denemek icin bos numara KALMADI. `05550000003` 2026-08-26'da profil
olusturularak harcandi (kullanici adi `asdfgh`). Canli veritabaninda
dogrulandi. Iki cozum var: Supabase panelinden test numarasi listesine
yeni numara eklemek, ya da `05550000003`un profil satirini silmek.

### DEVIR NOTU - 2026-08-26/27 (arayuz tasarimi, ucuncu oturumun DEVAMI)

Bu bolum asagidaki 2026-08-26 notunun UZERINE gelir; o not gunun ilk
yarisini anlatiyor, burasi geri kalanini. Calisma dali ayni
(`claude/plan2-moderasyon-paneli`), her sey commit'li ve push'lu.

**Yeni ekranlar ve bilesenler**

| Dosya | Ne |
|---|---|
| `src/tasarim/CanliHarita.tsx` | Merkezde kullanici, cevresinde mekanlar GERCEK yon/mesafeyle. Gercek harita DEGIL - sebebi asagida. |
| `src/tasarim/CheckInKarti.tsx` | Ana sayfa VE profildeki anilar ayni karti kullaniyor. |
| `src/app/harita/[mekanId].tsx` | Bir check-in'in konumu; karta basinca aciliyor. |
| `src/app/profil/duzenle.tsx` | Profilini duzenle: ad, biyografi (+ kullanici adi ekranina baglanti). |
| `lib/etiket.ts` | Check-in'de arkadas etiketleme. |
| `lib/hata-metni.ts` | Sunucu hatalarinin TEK ceviri kapisi. |
| `lib/kod-gonderim.ts` | SMS kod gonderim sayaci (cihazda, numara basina). |
| `lib/zaman.ts` | Gorece zaman + "su an burada" esigi + tam zaman. |

**Alt gezinme:** Kesfet sekmesi ORTADAKI BUYUK TURUNCU CHECK-IN
DUGMESINE donustu. Cubuk: Ana sayfa / Kisiler / [CHECK-IN] / Mesajlar /
Profil. `/kisiler` CIKARILAMAZ - o ekrana cubuk disinda giris yok.

**Kalici kararlar (tekrar onerme):**

- **Gercek harita yok, kendimiz ciziyoruz.** `react-native-maps`in web
  destegi yok ve uygulama telefonda TARAYICIDAN deneniyor; tile
  servisi ayri bagimlilik/kota/ucret demek. Native derlemeye gecilirse
  ayni bilesenin arkasina gercek harita takilabilir.
- **Haritada ve kartlarda YUZ YOK.** `yakin_mekanlar_yogunluk` bilerek
  yalnizca SAYI donduruyor; kimin nerede oldugu check-in yapmadan ya da
  bag kurmadan gorunmez.
- **Etiketleme kurallari POLITIKADA, arayuzde degil** (migrasyon
  20260826200000): yalnizca karsilikli bagli kisi etiketlenebilir ve
  ETIKETLENEN kisi kendi etiketini kaldirabilir. Gorunurluk icin ayri
  kural yok - select politikasi `check_inler`e bakiyor, onun RLS'i
  devrede.
- **Profil fotografi: TEK dosya, eskisi hicbir yerde gorunmez.**
  Migrasyon 20260826210000 + 20260826220000: bir dosya ancak sahibinin
  GUNCEL profil fotografiysa okunabiliyor - SAHIBI DAHIL kimse eskisini
  goremiyor. `profilFotografiniDegistir` klasoru temizliyor (yeni dosya
  disinda her sey siliniyor). Bunu yapmak guvenli, cunku
  `profil-fotograflari` kovasi YALNIZCA profil fotografi tutuyor;
  check-in fotograflari ayri kovada.
- **CHECK-IN CANLILIK PENCERESI 30 DAKIKA** (kullanicinin karari
  2026-08-29; onceki kural "4 saat canli, ilk bir saat etiket" idi ve
  KALDIRILDI). Zaman etiketi uc kademeli:
    0-30 dk    "şu an burada"
    30-60 dk   gorece zaman: "35 dk önce", "1 saat önce"
    60 dk+     ibare yok; yalnizca tarih ve saat
  Sunucu ayni pencerede: `check_in_yap` artik `now() + 30 minutes`
  yaziyor (migrasyon 20260829100000) ve her 10 dakikada bir calisan
  cron kaydi aniya cevirip `konum`u siliyor. Yani canlilik suresi ile
  etiket suresi AYNI - onceden etiket bir saatte susuyordu ama kayit
  dort saat canli kaliyordu.
  Yan etkiler: yogunluk sayaci ("7 kisi burada") da 30 dakikalik
  pencereye dondu, ve koordinat en fazla ~40 dakika sakli kaliyor
  (30 dk + cron araligi) - gizlilik metnindeki "~4 saat" ifadeleri
  bu yuzden "~30 dakika" olarak guncellendi.
- **Silme iki adimli** (akis, profil canli serit, anilar). Geri
  alinamayan islem tek dokunusla yapilmiyor.

**Ortam tuzaklari - ikisi de bu oturumda yasandi:**

1. **Bash heredoc'a Turkce karakter GECIRME.** Windows'ta bozuluyor ve
   desen eslesmiyor. Turkce metin iceren duzenleme betigini once
   DOSYAYA yaz (Write), sonra `python <dosya>` ile calistir.
2. **Python'da `\b` BACKSPACE kacisidir.** Ham olmayan bir dizede
   regex'e `\b` yazarsan dosyaya gercek bir kontrol karakteri
   gidiyor ve regex sessizce hic eslesmiyor. Ham dize (`r"..."`)
   kullan. Bir kez yasandi, testi yakaladi.

**Guvenlik taramasi elle kosuluyor** (eklenti hook'lari bu oturumda
yuklenmemisti):

```bash
SG=~/.claude/plugins/cache/claude-code-plugins/security-guidance/2.0.0
printf '{"hook_event_name":"PostToolUse","cwd":"C:/Users/orcns/projects/cloud","tool_name":"Edit","tool_input":{"file_path":"<mutlak yol>"}}' \
  | bash "$SG/hooks/sg-python.sh" "$SG/hooks/security_reminder_hook.py"
```

Cikti bossa temiz. **LLM katmanlari bu makinede HIC calismadi**
(`ANTHROPIC_API_KEY` yok) - yeniden baslatmak bunu degistirmez.

**Acik isler:**

1. Supabase auth HIZ SINIRLARI gozden gecirilmedi (panelden yapilir).
   Istemcideki kod gonderim sayaci en kolay istismar yolunu kapatiyor
   ama asil sinir sunucuda.
2. Diger diller (en/de/es/fr/ru/ar) geride; eksik anahtar artik
   Turkce'ye duesuyor, yani ham anahtar gorunmuyor. Toplu ceviri
   tasarim bitince.
3. Anilar ekraninda `mekanAnilariniGetir` artik cagrilmiyor (mekan
   detayindan anilar kaldirildi) ama fonksiyon lib'de duruyor.
4. Onizleme tuneli her calistirmada adres degistiriyor.

**Test hesaplari** asagidaki bolumde; kayit akisini denemek icin TEK
uygun numara `05550000003`.

### DEVIR NOTU - 2026-08-26 (arayuz tasarimi, ucuncu oturum)

Calisma dali `claude/plan2-moderasyon-paneli`, her sey push edildi.
Calisma bicimi degismedi: **sayfa sayfa, kullanicinin talimatiyla**
(bkz. asagidaki "ARAYUZ TASARIMI" bolumu). Bugun ogrenilen ek kural:
bu, ekranlar ARASI gecis kadar tek bir ekranin ICI icin de gecerli -
bir ekrana baslamak, duzenini kendi tespitime gore kurmam anlamina
gelmiyor.

**Biten ekranlar / isler:**

- `profil-olustur` BASTAN YAZILDI ve artik HESABIN OLUSTUGU ekran:
  ad-soyad tek kutuda, dogum tarihi kaydirmali secici ile
  (`src/tasarim/TarihSecici.tsx` - platform seciciler kullanilmadi,
  uc platformda uc turlu gorunuyorlardi), kullanici adi, sifre, sifre
  dogrulama ve KAPSAMLI SOZLESME ONAYI. Onay verilmeden hicbir sey
  yazilmiyor. Fotograf ve biyografi bu ekrandan CIKARILDI.
  Iki eski borc kapandi: sifre artik bu akista belirleniyor ve KVKK
  onayi kayit altina aliniyor.
- `dogrula`: numara ZATEN KAYITLIYSA kayit akisi burada kesiliyor
  ("Bu numarada zaten bir hesap var" -> girise). **2026-08-27'de bu
  kontrolun bir KOPYASI kayit ekranina, SMS gonderiminden ONCE
  eklendi** (kullanicinin istegi: "bosuna kod gonderimini direk
  engellemek icin"). Yeni RPC: `public.telefon_kayitli_mi`, yalnizca
  boolean doner. Hiz siniri IKI KATMANLI: cihaz basina saatte 10,
  IP basina saatte 300. **Tek olcut IP OLAMAZ** - mobil operatorler
  CGNAT kullaniyor, yuzlerce abone ayni IP'den cikiyor; tek katmanli
  15'lik ilk tasarim tek kisilik teste gore secilmisti ve ayni gun
  degistirildi. Tavanlar `public.hiz_limitleri` tablosunda, UPDATE ile
  degisiyor. Kullanim `public.telefon_kontrol_ozeti` icinde saatlik
  toplanıyor (IP ya da numara tasimaz).
  `telefon_kontrol_gunlugu` tablosunda IP en fazla 1 saat durur.
  Cevap alinamazsa (tavan ya da ag) istemci eski akisa duesuyor: kod
  gonderilir ve kontrol dogrula ekranindaki son kapida yapilir - yani
  ORASI KALDIRILMADI, hizli yol eklendi.
  ONEMLI: "oncesinde yapmak numara taramasina izin verirdi" gerekcesi
  HALA GECERLI ve risk bilerek kabul edildi; tavan toplu taramayi
  engelliyor, hedefli tek sorguyu engellemiyor. Ayrinti ve dort soru:
  `docs/kvkk-uyum-listesi.md` icindeki "Acik karar" bolumu.
- `karsilama`: aciklama satirlari kalkti, dort baslik kaldi; ornek
  check-in kartlari eklendi (SAYILAR ORNEK, gercek veri degil).
  Slogan bir eklenip ayni gun kaldirildi - tekrar onerme.
  Krokinin yollari DUZLESTIRILDI: egik yollar yazilari yamuk
  gosteriyordu, yanilsama yazi tarafinda giderilemiyor.
  Adalar artik yol izgarasindan turetiliyor.
- `kayit`: baslik ve alt not kaldirildi, marka sola-yukari alindi.
- ALT GEZINME: Kesfet sekmesi ORTADAKI BUYUK TURUNCU CHECK-IN
  DUGMESINE donustu. Cubuk: Ana sayfa / Kisiler / [CHECK-IN] /
  Mesajlar / Profil. `/kisiler` cikarilamaz - o ekrana cubuk disinda
  giris yok.
- YENI `lib/hata-metni.ts`: sunucu hatalarinin TEK ceviri kapisi
  (45 veritabani metni + Supabase kimlik hatalari). Ayrinti asagida.
- YENI `lib/kod-gonderim.ts`: SMS kod gonderim sayaci, cihazda,
  numara basina. Ayrinti asagida.

**TEST HESAPLARI DEGISTI** - asagidaki "Test hesaplari" bolumune bak.
Kayit akisini denemek icin TEK uygun numara `05550000003`.

**ACIK ISLER:**

1. Supabase auth HIZ SINIRLARI gozden gecirilmedi. Istemcideki kod
   gonderim sayaci en kolay istismar yolunu kapatiyor ama asil sinir
   sunucuda; panelden bakilmali.
2. `security-guidance` eklentisinin LLM katmanlari bu makinede HIC
   calismadi (`ANTHROPIC_API_KEY` yok). Yalnizca desen taramasi
   calisiyor. Ayrinti asagidaki eklenti karari notunda.
3. Diger diller (en/de/es/fr/ru/ar) geride: eski kayit ekraninin
   anahtarlarini tasiyorlar ve yeni ekranlarin anahtarlari yok.
   Eksik anahtar artik Turkce'ye duesuyor (`lib/dil.tsx`), yani ham
   anahtar gorunmuyor. Toplu ceviri tasarim bitince yapilacak.
4. Onizleme tuneli her calistirmada adres degistiriyor; kalici cozum
   (GitHub Pages) hala onerилmis durumda, kullanici "simdilik tunelle
   devam" dedi.

### ARAYUZ TASARIMI - DEVAM EDEN IS (2026-08-25, ikinci oturum)

**Calisma bicimi (kullanicinin iki kurali):**
1. "Sayfa sayfa ilerlicez talimatlarla." Bir ekran bitince SIRADAKINE
   KENDILIGINDEN GECILMEZ; hangi sayfaya gecilecegi sorulur. Her adim
   ekran goruntusuyle gosterilir.
2. **ISTENEN KADARINI YAP.** Kullanici 2026-08-25'te bunu acikca
   soyledi: telefon + dogrulama ekrani istemisti, ben akisi tamamlamak
   icin ucuncu bir "sifre belirle" ekrani ekledim ve geri aldirdi:
   "Sifre belirleme ekraniyla suan ugrasma, sadece sana soyledigimi
   yap." Yaptigin adim baska bir sey gerektiriyorsa YAPMA, SOYLE.

**Referans:** Instagram. Kullanici ekran goruntuleri gonderip "bu
gorseldeki gibi olsun" diyor; gonderdigi gorsel cogu zaman KENDI
ekranimizin telefondaki hali oluyor.

#### SIRADAKI IS: `profil-olustur` ekrani

Kullanici "onaylandiktan sonra profil olusturma ekranina geciyoruz"
dedi ve orada durduk. Ekranin su anki hali `tasarim/ekran-profil-olustur.png`.
Tespit edilen bes sorun (kullaniciya soylendi, onayi BEKLENIYOR):
alan etiketi yok; dogum tarihi `YYYY-AA-GG` diye elle yaziliyor;
fotograf bir kutu icinde duz metin; kullanici adi musaitlik sonucuna
yer ayrilmamis; zorunlu/istege bagli ayrimi yok.

**Bu ekrani gormek icin PROFILI OLMAYAN bir kullanici gerekiyor** -
mevcut test hesaplarinin hepsinin profili var ve yonlendirme kontrolu
onlari uygulamaya sokuyor. Cozum: service-role ile profilsiz bir
hesap acmak (`+905550000008` / `test1234` bu amacla olusturuldu,
profil satiri yok).

#### Biten ekranlar (hepsi kimlikte)

| Ekran | Not |
|---|---|
| `(auth)/karsilama` | Kroki arka plan, dort tanitim maddesi, marka kilidi |
| `(auth)/giris` | Instagram duzeni |
| `(auth)/kayit` | YALNIZCA telefon numarasi + "Kodu gonder" |
| `(auth)/dogrula` | Alti kutulu SMS kodu, geri sayimli tekrar gonder |
| `index` (ana sayfa) | AKIS: kendi ve baglarin check-in'leri |
| `mekanlar/index` | Kesfet |
| `mekanlar/[id]` | Mekan detayi (adi artik gorunuyor) |
| `kisiler`, `mesajlar` | Liste ekranlari |
| `profil/index` | YENI: profil ana ekrani, "su an buradasin" seridi |
| `kullanici/[id]` | Baskasinin profili, iki adimli engelleme |
| `profil/ayarlar` | Instagram duzeni: gruplanmis satirlar |
| `profil/kullanici-adi`, `profil/check-in-gorunurlugu`, `profil/ani-gorunurlugu` | Ayarlarin alt ekranlari |
| `profil/engellenenler` | YENI |
| Diger ekranlar | Tipografi ve jetonlar kimlige gecti, yerlesim eski |

#### KAYIT AKISI (2026-08-25'te degisti)

`karsilama` -> `kayit` (yalnizca telefon, `signInWithOtp`) ->
`dogrula` (SMS kodu) -> `profil-olustur`.

**IKI ACIK BORC** (kullaniciya soylendi, o an istemedi):
1. Bu akista SIFRE BELIRLENMIYOR ama `giris` ekrani numara + sifre
   istiyor. Yani bu yolla acilan hesap giris ekranindan tekrar giremez.
2. KVKK ONAYI HICBIR YERDE ALINMIYOR - onay kutusu eski kayit
   ekranindaydi. Onay metadatasini `kvkk_onaylari` tablosuna alan
   tetikleyici artik hem INSERT hem UPDATE'te calisiyor
   (migrasyon 20260825170000), yani onay nereye konursa konsun
   kaydedilecek.

#### ALT GEZINME: her ekranda, kokten geliyor

`src/tasarim/AltGezinme.tsx` - yuzer, BES sekme (Ana sayfa / Kesfet /
Kisiler / Mesajlar / Profil). Kullanicinin karari: "hangi sayfaya
girilirse girilsin alttaki sutun sabit kalacak."

Cubuk `src/app/_layout.tsx` icinde `<Slot />` ile birlikte ciziliyor;
EKRANLARA TEK TEK EKLENMEZ. Ekranlar yalnizca `ALT_GEZINME_PAYI`
kadar alt pay birakir. Okunmamis rozetini cubuk kendisi cekiyor
(yol degistikce). Giris/kayit, profil olusturma ve askidaki hesap
ekranlarinda cubuk YOK.

Testlerde cubuk `jest.setup.js` icinde GLOBAL mock'lu.

#### MARKA: yeni logo takimi (2026-08-25)

Kullanici yeni bir logo verdi: gradyanli kiremit uzerinde beyaz S
isareti (iki noktasiyla) ve koyu harfli "slooin" yazisi (i'nin noktasi
turuncu konum ignesi). Kaynaklar `tasarim/slooin-logo-2-kaynak.png` ve
`tasarim/slooin-kelime-markasi-2-kaynak.png`.

**ISARET YENIDEN CIZILMEZ.** Iki kez denendi (esikle maskeleyip duz
renkle boyamak) ve ikisinde de kullanici "goruntu bozuldu" dedi.
Dogru yontem RENK COZUMLEMESI: `piksel = alfa * isaret + (1-alfa) *
zemin` denklemi alfa icin cozuluyor, kenar tonlari ve S'in katlanma
golgesi korunuyor. Logonun PARCASI SILINMEZ - iki nokta bir kez
kaldirildi, geri aldirildi.

Butun simge varliklari iki betikten uretiliyor:
- `araclar/simge-uret.py` - icon, favicon, Android ucusu, acilis
  isareti, uygulama ici isaret (acik/koyu), PWA simgeleri.
- `araclar/kelime-markasi-uret.py` - kelime markasinin beyaz zeminini
  saydama cevirir, kirpar, en/boy oranini ekrana basar (o oran
  `MarkaYazisi.tsx` icinde SABIT yazili, gorsel degisirse guncellenmeli).

**PWA SIMGELERI AYRI DOSYALAR** (`public/pwa-*-v2.png`,
`apple-touch-icon-v2.png`): `app.json`daki `icon` onlara dokunmuyor.
Adlarinda SURUM var, cunku iOS ana ekran kisayolunun simgesini ADRESE
gore onbellege aliyor; ayni adla yeni gorsel yayinlaninca telefonda
eski logo gorunmeye devam ediyordu. Logo degisirse
`araclar/simge-uret.py` icindeki `SURUM` artirilir.

#### TIPOGRAFI: uygulama icinde TEK yazi ailesi

Kullanicinin karari: "Basliklar dahil butun yazim stilleri resimdeki
gibi olucak." Marka fontu Bricolage Grotesque arayuzden TAMAMEN cikti;
`yazi.baslik` ve `yazi.baslikKalin` jetonlari SILINDI. Basliklar,
govde, bas harfli avatarlar ve sayilar ayni aileden (Instrument Sans);
baslik olmak agirlik ve punto degistiriyor, yazi tipini degil. Baslik
jetonu: `yazi.ekranBasligi` (InstrumentSans_700Bold).
Olcek: baslik 26 / altBaslik 19 / govde 15 / kucuk 13 / minik 11.

#### KARSILAMA EKRANI

- Hesabi olmayan HERKES, HER acilista goruyor (hesap olusturana kadar).
  Onceki "yalnizca ilk indirene goster" kurali ve onu tasiyan cihaz
  isareti (`lib/ilk-acilis.ts`) kaldirildi.
- Arka plan `src/tasarim/SicaklikZemin.tsx`: SICAKLIK HARITASI -
  zemin uzerinde yumusak turuncu lekeler, harita mobilyasi (yol, ada,
  insan ikonu) YOK. **KrokiZemin 2026-08-27'de SILINDI**; kullaniciya
  alti arka plan onerisi gorsel olarak sunuldu ve bunu secti
  (`tasarim/arka-plan-fikirleri.html`, oneri 1).
  Gerekce: cizilmis sokak izgarasi "burasi neresi" sorusunu aciyordu
  ve cevabi yoktu - kullanici henuz giris yapmadigi icin gercek bir
  yer gosterilemez. Sicaklik lekesi ayni seyi soruyu acmadan soyluyor.
  Lekelerin kenar cizgisi yok ve en koyusu %34 opaklikta; kroki
  zemindeki beyaz yol seritleri metnin arkasindan gecen sert kenarlar
  uretiyordu.
  **HAREKET ARTIK YOK** - nabiz gibi atan halkalar KrokiZemin ile
  birlikte gitti. Istenirse lekelere cok yavas bir "nefes" eklenebilir;
  o zaman "hareketi azalt" kontrolu de geri gelmeli.
- Sozlesme onayi ve slogan bu ekrandan KALDIRILDI.
- ORNEK CHECK-IN KARTLARI da KALDIRILDI (2026-08-27, kullanicinin
  istegi: "Sahille kampus yazili yerleri kaldir"). Uydurma mekan adi
  ve uydurma kisi sayisi tasiyorlardi. Tekrar onerme.

#### EKRAN GORUNTUSU ARACI

`mobil/araclar/ekran-goruntusu.mjs` (puppeteer-core). Tasarimi gozle
dogrulamanin tek guvenilir yolu.

```bash
cd mobil
node araclar/ekran-goruntusu.mjs karsilama ../tasarim/ekran.png
SLOOIN_TEST_TELEFON=05550000000 SLOOIN_TEST_SIFRE=test1234 \
  node araclar/ekran-goruntusu.mjs profil ../tasarim/ekran.png
```

Git Bash'te yolu BASTAKI EGIK CIZGI OLMADAN yaz. Ana sayfa icin bos
dize kullan (`""`).

#### Onizleme akisi (her degisiklikten sonra)

```bash
# 1) sunucuyu durdur (dist kilitli kalirsa export EBUSY verir)
powershell -c "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { $_.CommandLine -like '*spa-sunucu*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
cd mobil && npx expo export --platform web
# 2) sunucuyu baslat
nohup python <scratchpad>/spa-sunucu.py C:/Users/orcns/projects/cloud/mobil/dist 8080 &
# 3) tunel (telefonda bakmak icin) - ADRES HER CALISTIRMADA DEGISIR
"/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url http://127.0.0.1:8080 --no-autoupdate
```

Kullanici tunel adresinin degismesinden sikayetci ("her seferinde
giris yapmak zorunda kaliyorum"): tarayici depolamayi adrese bagli
tuttugu icin yeni adres = yeni oturum. Oturum kaliciligi UYGULAMADA
DOGRU calisiyor (olculdu: tarayici kapatilip acildiginda oturum
duruyor). Kalici cozum sabit bir adres (GitHub Pages onerildi,
kullanici "simdilik tunelle devam" dedi).

#### Test hesaplari

`05550000000`, `05550000001`, `05550000002`: sifre `test1234`, SMS kodu
`123456`, UCUNUN DE PROFILI VAR - kayit akisini denemek icin uygun
degiller, dogrulamadan sonra "bu numarada zaten hesap var" ekranina
duserler.

`05550000003`: SMS kodu alabiliyor ve **hesabi var ama PROFILI YOK**.
Kayit akisini bastan sona denemek icin kullanilacak numara budur;
profil olusturmadan cikildigi surece yeniden kullanilabilir.

`05550000008`: profilsiz ama Supabase'in test numarasi listesinde
DEGIL, yani SMS kodu alamiyor (`Unable to get SMS provider`). Yalnizca
giris ekranindan `test1234` ile girilerek profil olusturma ekranina
ulasilir.

#### EAS / APK durumu

Expo hesabina giris yapildi (`byorcun`), Android APK bir kez derlendi.
Kullanici iPHONE kullaniyor - APK ona kurulamaz, PWA yolunda devam.

### KARAR: dis kaynakli mekanlarda TUR GOSTERILMIYOR (2026-08-24)

Kullanicinin karari, tur hatalarini "yuzde yuz nasil cozeriz" sorusuna
verdigi cevap: **"Tür ve ikonları kaldıralım sadece konum adı semt
bilgisi olsun sadece yeni eklenen konumlara kişiler tür ekliyebilsin
ikon olmucak altında tür görüncek."**

Gerekce: alti denetim ajani, 98 kural ve 87 bin kayitlik duzeltmeden
sonra bile tur verisi %100 dogru yapilamiyor. "Konak Restaurant" ile
"Hünkar Konakları" ayrimi isim kalibiyla cozulemez; Overture'in kendi
etiketi de yanlis olabiliyor. Kullanici, dogrulugu garanti edilemeyen
bir alani gostermek yerine HIC GOSTERMEMEYI secti.

Uygulanan kural tek yerde: `lib/mekan.ts` icindeki `turuGosterilir()`.
  kaynak = 'kullanici'  -> tur GOSTERILIR
  kaynak = 'overture'   -> tur GIZLENIR
  kaynak bilinmiyor     -> tur GIZLENIR (guvenli taraf)
Uc davranis da test altinda (`lib/mekan.test.ts`).

Ekranda ne degisti:
- Kesfet listesinde ve canli kartlarda ikon/kapak gorseli YOK; satir
  artik "ad" + "semt · uzaklik".
- Tur filtre cipleri kaldirildi (tur gosterilmiyorsa ona gore suzmek de
  anlamsiz).
- `mekanlar/ekle.tsx` tur secimi KALIYOR ve tek tur girisi noktasi o:
  kullanicinin ekledigi mekanda tur gosteriliyor, cunku ekleyen kisi
  oradadir. Cipteki ikonlar kaldirildi.
- `yakin_mekanlar_yogunluk` RPC'si artik `kaynak` sutununu donduruyor.

ONEMLI: tur verisi SILINMEDI, yalnizca gosterilmiyor. Arka plandaki
kullanimlari duruyor: `SOSYAL_TURLER` ile kesfet daraltmasi ve
'yer-degil' filtresi. Ileride tur verisi guvenilir hale gelirse
`turuGosterilir()` tek satirla acilabilir.

MekanIkonu.tsx ve MekanGorseli.tsx dosyalari SILINMEDI ama artik
kullanilmiyor.

### Mekan turu DENETIMI: alti ajan, uc sistemik kok neden (2026-08-23)

Kullanicinin istegi: "Butun turleri denetlesinler ajanlar", "Hataya yer
yok", ve ardindan "konutlari is yerleri fabrikalari bunlarin hepsi cok
iyi ayrilmali dogru turu gostermeli". Alti bagimsiz denetim ajani
calisti (yalnizca SELECT), 142 kural onerdi. Tam rapor:
`docs/mekan-turu-denetimi-2026-08-23.md`.

**UC SISTEMIK KOK NEDEN - hepsi duzeltildi:**

1. **`lower('İ')` PostgreSQL'de bozuk**: tek 'i' degil 'i' + U+0307
   uretiyor. Yani `~*` ve `ilike` ile yazilmis HER ad kurali Turkce
   buyuk İ'de sessizce yarim calisiyordu (`ad like '%İlkokul%'` 3492,
   `ad ilike '%ilkokul%'` 1625). **En agir sonucu ARAMANIN KENDISIYDI**:
   kullanici "istanbul" yazinca "İstanbul Kafe" bulunmuyordu. Cozum:
   `public.tr_kucuk()`; `yakin_mekanlar` ve `yakin_mekanlar_yogunluk`
   artik iki tarafi da bundan geciriyor. **KURAL: bundan sonra ad
   uzerinde yazilan her SQL kurali `tr_kucuk(ad)` kullanir, ham `ad`
   veya `ilike` DEGIL.** Yan fayda: desenler saf ASCII yazilir.
2. **`duzelt()` isme hic bakmiyordu**: ana kategori acik alansa ve
   alternatifte konaklama sinyali varsa kaydi otele ceviriyordu.
   "Fatih Mahallesi", "Doğancık Köyü" bu yuzden Otel'di - 9.456 kayit,
   Otel turunun ~%17'si. Artik `ad` parametresi aliyor ve
   `toponim_mi()` ile yer adi olup olmadigina bakiyor.
3. **ESLEME'de olu anahtarlar**: `police_station`/`fire_station`
   yazilmisti, Overture `police_department`/`fire_department` yolluyor.
   `Karakol` ve `İtfaiye` turleri 0 kayitti.

**SILME YERINE GIZLEME:** mekan olmayan ~15 bin kayit (yol parcasi, koy
adi, kargo firmasi, parke bayii, telefonlu SEO ilani) silinmedi,
`tur = 'yer-degil'` yapildi; okuma yollari onu `'test'` gibi filtreler.
Silme geri alinamaz ve `check_inler` cascade oldugu icin bir silme
hatasi kullanicilarin anilarini goturur.

**GERI ALMA KAYDI:** `public.tur_duzeltme_gecmisi` her degisikligin eski
turunu, yeni turunu ve kural adini tutuyor (RLS acik, politika yok ->
yalnizca service_role).

**NIHAI SONUC (denetim kapandi):** 98 kural calisti, **73.101 tekil
kayit** duzeltildi, 12.676 kayit gizlendi. Gorunen mekan 865.188,
**tur sayisi 133 -> 162**. Ornekler: Spa 24.120 -> 8.831
(kuafor/berber/guzellik ayrildi), Kuafor 14.028, Berber 9.464,
Guzellik salonu 16.720, ATM 21.264 (Banka'dan ayrildi). Kapsam
daraltilmak yerine GENISLETILDI (kullanicinin karari).

**Konut / is yeri / fabrika ayrimi** (kullanicinin ayrica istedigi):
Site 20.377 (yalnizca konut) / Apartman 2.970 / Ogrenci yurdu 2.525 /
İş merkezi 1.231 / Rezidans 1.162 / Konak 1.144 / Fabrika 913 /
Sanayi sitesi 527 / Depo 201 / Villa 31. Fabrika ve Depo bilerek
`SOSYAL_TURLER` disinda: aramada bulunuyorlar ama kesfet akisini
doldurmuyorlar.

**Kapanis dogrulamasi:** kalan kirlilik SQL ile olculdu (Banka icinde
ATM 0, Kitapci icinde kirtasiye 0, Hastane icinde aile sagligi 1).
Kalan tekil artiklarin incelenmesi dislama kurallarinin DOGRU
calistigini gosterdi: "Bolu Berberler ve Kuaförler Odası" meslek
odasidir, kuafor degil; "Anzer Çiçekli Köyü Dinlenme ve Konaklama
Tesisleri" gercekten konaklamadir. Meslek odalari icin ayrica 113
kayitlik bir duzeltme yapildi (-> Toplum merkezi).
Testler: jest 44 paket / 371 test yesil, tsc bes taban hatasi.

**ORTAM TUZAGI (yasandi, iki kez):** PostgREST cagrilarinda
`statement_timeout` 8 saniye ve `tr_kucuk(ad)` uzerinde regex indeksi
yok (pg_trgm kurulu degil, veritabani 500 MB sinirinin dibinde). Ilk
kosumda 47 kural bu yuzden YARIM KALDI ve bu `ATLANDI` satirlari
sayilmadan fark edilmiyor. Cozum `mekan_turunu_duzelt` fonksiyonuna
`set statement_timeout = '180s'` eklemek oldu. **Toplu bakim
betiklerinden sonra `ATLANDI` satirlari mutlaka sayilmali** - betik
exit 0 dondugu halde is yarim kalmis olabilir.

**Betikler:** `araclar/tur-duzeltmeleri.py` (ana denetim, ~90 kural),
`araclar/tur-duzeltmeleri-2-isyeri.py` (konut/is yeri/fabrika ayrimi:
Fabrika, Sanayi sitesi, İş merkezi, Depo turleri). Ikisi de IDEMPOTENT,
guvenle yeniden calistirilabilir.

### Mekan verisi bastan yuklendi: 4 tur -> 133 tur (2026-08-23)

Kullanici bildirdi: "Park Apt" apartman ama PARK gorunuyor, "ganita
beach" plaj ama PARK gorunuyor. Istegi net: "konum okulsa okul
gorulmeli apartsa apart parksa park siteyse site yolsa yol", ve
"tur sayisi artmali dogru konumlandirilmali".

**Kok neden ikiye ayrildi, ikisi de canlida dogrulandi:**
1. BIZIM hatamiz - esleme her seyi dort ture sikistiriyordu
   (kafe/bar/restoran/park); `beach` de "park" sayiliyordu.
2. OVERTURE'in hatasi - "Lüleburgaz Ögretmenler Sitesi"ne 0.76 guvenle
   `beach` demis, "Küpeli Cesme"ye `wine_bar`.

**Yapilan:**
- `araclar/kategori-eslemesi.py`: 168 kategori, her biri kendi TURKCE
  adiyla. Zorlama gruplama YOK. Sozlukte karsiligi olmayan kategori
  ALINMAZ - boylece ekranda ham Ingilizce kategori adi hic gorunmez.
- Overture'in ALTERNATIF kategori alani artik kullaniliyor (onceden hic
  okunmuyordu): ana kategorisi acik alan ama alternatifinde
  konaklama/konut olan kayitlar duzeltiliyor. "Park Apt" -> Otel,
  "Ögretmenler Sitesi" -> Konaklama.
- Guven esigi 0.5 -> 0.6.
- `mekanlar.kategori` sutunu: ham kaynak kategorisi ARTIK SAKLANIYOR.
  Bu onemli - onceden saklanmadigi icin "bu kayit neden park" sorusu
  geriye donuk cevaplanamiyordu. Esleme degisirse veri yeniden
  indirilmeden duzeltilebilir.
- Test mekanlari (GORUNURLUK-TEST-*) artik kullaniciya gorunmuyor.

**Sonuc:** 196.935 kayit / 4 tur  ->  877.972 kayit / 133 tur.
Veritabani 100 MB -> 370 MB (ucretsiz katmanin %74'u).

**Temizlik notu:** eski yuklemeden kalan 23.204 kayit (guven < 0.6,
kucuk harfli "kafe"/"park" turleri) silindi - yoksa filtrede "Kafe" ve
"kafe" ayri cipler olarak gorunuyordu. Silme sorgusu check-in'i olan
mekani KORUYOR; `check_inler.mekan_id` cascade oldugu icin boyle bir
silme kullanicinin check-in gecmisini de goturur.

**ACIK KARAR:** guven esigi kullanicinin karariyla 0.60'ta BIRAKILDI
(2026-08-23). 0.80'e cikarmak 694 bin kayda dusurur (~310 MB) ve
kullanicinin bildirdigi iki hatali kaydi da elerdi ("Park Apt" 0.71,
"Ögretmenler Sitesi" 0.76). Yer sikisirsa ilk basvurulacak kol budur.

**Bilinen sinir:** Overture'in tekil hatalari (ornek "Küpeli Cesme" ->
wine_bar) elimizdeki sinyallerle duzeltilemiyor; alternatif kategorisi
de yok. Bunlar ancak kullanici sikayeti ya da elle duzeltmeyle temizlenir.

### KRITIK DERS: mock'lanmis test gercek veri bicimini dogrulamaz (2026-08-23)

Kullanici uygulamayi telefonda deneyip "Mekanlari kesfet" ekraninin
`Beklenmeyen konum formati: 0101000020E6100000...` ile patladigini
bildirdi. Yani **mekan kesfetme hic calismiyordu** - Bursa'da da,
hicbir yerde de.

Sebep: PostgREST `geography` sutununu WKT (`POINT(x y)`) olarak degil
**hex EWKB** olarak donduruyor. `lib/konum.ts` icindeki `noktayiCoz`
yalnizca WKT taniyordu ve gelen her gercek degeri reddediyordu.

**Hicbir kosum yakalamadi:**
- jest ekran testleri Supabase'i mock'luyor -> gercek bicimi hic gormuyor
- `test:gorunurluk` RPC'yi cagiriyor ama `konum` alanini hic OKUMUYOR
- elle tarayici gezintisi Faz 2a'dan beri borc olarak duruyordu

**Bu ayni sinif hata Faz 2a'da da yasanmisti** (mekan detay ekrani canli
veritabaninda hic calismiyordu, 66 test yesilken). Ders tekrar etti:
bir alan yalnizca mock'ta okunuyorsa, o alanin gercek bicimi hic
dogrulanmamis demektir.

Duzeltme istemcide yapildi (`noktayiCoz` artik iki bicimi de coziyor),
testler canlidan alinmis GERCEK bir deger kullaniyor. Sunucuya
dokunulmadi.

**Kural olarak alinmali:** sunucudan gelen bir alani ISTEMCIDE
ayristiran her yer, en az bir testte gercek sunucu ciktisiyla
dogrulanmali. Mock veri, bicim varsayimini test etmez - yalnizca
varsayimi tekrar eder.

### Plan 2 (moderasyon paneli) UYGULANDI (2026-08-23)

**Calisma dali degisti: `claude/plan2-moderasyon-paneli`** (ucu
`claude/plan1-hesap-haklari`ndan ayrildi). Plan:
`docs/superpowers/plans/2026-08-23-plan2-moderasyon-paneli.md`
(23 gorev, 5 faz). Kullanici "panelin yapimina baslarsin tum yetki
sende ben yatiyorum" dedi (karar 77) ve is bu yetkiyle yuruttuldu.

**Yapilanlar:**

- **Faz A - veritabani temeli:** `moderatorler` tablosu ve AAL2 yetki
  kapisi (`moderasyon.yetkili_mi` / `yetkili_mi_zorla`,
  `public.moderator_muyum`); ekleme-only denetim izi
  (`moderasyon_kayitlari` + `moderasyon.kaydet` + 2 yillik budama
  cron'u); `sikayetler`e karar sutunlari ve `'mesaj'` turu;
  `check_inler.moderasyon_gizli` ve gizleme filtresinin uc yola
  islenmesi.
- **Faz B - sikayet akisinin duzeltilmesi:** `sikayet_gonder`'e uyelik
  ve sahiplik dogrulamasi; sohbet ekraninda **mesaj basina sikayet**
  (uzun basis) ve karar 76 baglam bildirimi.
- **Faz C - 13 moderator RPC'si:** sikayet listesi/detayi/hedef
  gecmisi, karara baglama, kullanici arama/detayi, iki kademeli konusma
  erisimi, askiya alma/yasaklama/kaldirma, icerik gizleme, iz
  listeleme, iki Storage politikasi.
- **Faz D - canli dogrulama:** senaryo 59 (13 RPC'nin hepsi yetkisiz
  cagriyi reddediyor) ve senaryo 60 (gizleme uc yoldan da kesiyor,
  sahibi dahil).
- **Faz E - panel:** `panel/` altinda Vite + React + TS, alti ekran.

**Kapanis dogrulamasi:** jest 44 paket / 364 test yesil;
`test:sema` 145 dogrulama; `test:gorunurluk` 340 dogrulama; mobil
`tsc` yalnizca bes onceden var olan `@types/node` hatasi; panel `tsc`
0 hata ve uretim derlemesi temiz.

**BLOKAJ - siradaki oturumun ILK isi:** projede **TOTP MFA kapali**.
`mfa.enroll` cagrisi `MFA enroll is disabled for TOTP` donuyor. Bu bir
Supabase **proje ayaridir**, migrasyonla ya da MCP ile acilamaz:
Supabase Dashboard -> Authentication -> Multi-Factor Authentication ->
TOTP acilmali. Acilana kadar panele giris yapilamaz ve pozitif yon
(dogru kimlik kapiyi aciyor mu) dogrulanamaz.

Negatif yon TAM dogrulandi: gercek bir moderator hesabi olusturulup
`moderatorler` tablosuna eklendi, parola ile giris yapildi (aal1) ve
kapi KAPALI kaldi - `moderator_muyum` false dondu, moderator RPC'si
`Yetkisiz` verdi. Yani ikinci faktor gercekten zorlaniyor.

**Test moderator hesabi duruyor:** `+905550000009` /
`moderator-test-1234`, `profiller` satiri yok (karar 56 geregi dogru).
Parola `docs/plan2-takip-isleri.md` icinde yazili oldugu icin bu hesap
GERCEK moderator hesabi olarak kullanilmamali; kullanici kendi
hesabini kurunca silinmeli ya da parolasi degistirilmeli.

Kalan borclar ve `[SONRA]` listesi: `docs/plan2-takip-isleri.md`.
Panelin kendi belgesi (neden service-role yok, ilk moderator nasil
eklenir, iki kademe nasil calisir): `panel/README.md`.

### Ekran metinleri duzgun Turkce'ye cevrildi (2026-08-23, commit b431d89)

Kullanici uygulamayi tarayici yolundan telefonda test etti ve tek
kusur olarak yazim yanlislarini bildirdi: arayuz bastan sona aksansiz
yazilmisti. Karar 74 bunu zaten sart kosuyordu ama metinler hic
cevrilmemisti. 21 ekran + 21 test dosyasinda 421 satir duzeltildi;
`gizlilik.tsx` (hukuki metin) bastan yazildi; `lib/` icindeki hata
metinleri de cevrildi, cunku ekranlar `e.message` degerini dogrudan
basiyor.

Kural netlesti: ASCII yalnizca kod, yorum ve commit metinleri icin.
Kullanicinin gordugu HER metin aksanli yazilir. Yalnizca c, g, i, o,
s, u aksanlari kullanilir; duzeltme isaretli harflere (a, i)
girilmez - "mekan" ve "sikayet" oldugu gibi kalir.

**Tuzak (yasandi):** toplu dize degistirme kod tanimlayicilarina
tasar. "Adin" -> aksanli karsiligi kurali `kullaniciAdiniNormallestir`
fonksiyon adinin icine girdi ve uygulamayi bozdu; ayni sekilde
`BaglarEkrani`, `setSifre`, `AnilariniGetir`, `AnilarEkrani`,
`setAnilar`, `gecmisAnilar` da bozuldu. Hepsi, dize sabitleri DISINDA
aksanli harf arayan bir taramayla bulunup geri alindi. Boyle bir
degisiklikten sonra o tarama mutlaka kosulmali.

**Bu borc 2026-08-26'da KAPANDI, ama migrasyonla degil.** 45 `raise
exception` metni veritabaninda oldugu gibi duruyor; cevrilme
ISTEMCIDE, tek kapida yapiliyor: `lib/hata-metni.ts`. Gerekce:
metinler onlarca fonksiyonun govdesinde ve migrasyonla yeniden yazmak
o fonksiyonlari bastan olusturmak demek; ayrica `test:sema` ve
`test:gorunurluk` bu metinler uzerinden dogruluyor. Istemcide tek kapi
hem daha guvenli hem de ileride diger dillere cevrilebilir - bir
veritabani mesaji kullanicinin diline gore degisemez.

Ayni kapi Supabase'in INGILIZCE kimlik hatalarini da ceviriyor
("Unable to get SMS provider" gibi metinler kullaniciya oldugu gibi
cikiyordu). Bilinmeyen bir metin gelirse: Ingilizce gorunuyorsa genel
bir metin doner ve asil hata konsola yazilir, Turkce gorunuyorsa
oldugu gibi gecer. **Bu ikinci kural onemli** - ilk denemede olcut
"aksanli harf tasiyor mu" idi ve bizim kendi aksansiz ama dogru
mesajlarimizi ("Konum izni verilmedi") genel metinle eziyordu.

Dogrulama: jest 44 paket / 360 test yesil, tsc yalnizca bes onceden
var olan @types/node hatasi.

### Telefonda deneme - TARAYICI YOLU (2026-08-23, kullanicinin karari)

EAS/APK yolu **askiya alindi**: kullanici "expo disinda baska bir yolla
teste gecelim" dedi. Yerel APK derlemesi de elendi, cunku bu makinede
hicbir Android zinciri yok (java, Android SDK, adb - ucu de kurulu
degil); kurulum ~5 GB indirme ve saatlerce is demek.

Secilen yol: **web surumunu telefonun tarayicisindan denemek.**

```bash
cd mobil && npx expo export --platform web      # dist/ uretir (prod paket)
python <scratchpad>/spa-sunucu.py <mutlak dist yolu> 8080   # arka planda
"/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url http://127.0.0.1:8080 --no-autoupdate
```

`cloudflared` bu makineye winget ile kuruldu
(`winget install --id Cloudflare.cloudflared -e`). Hesapsiz "quick
tunnel" gecici bir `https://<rastgele>.trycloudflare.com` adresi verir;
adres her calistirmada degisir ve surec olunce olur.

**HTTPS neden sart:** tarayici konum API'sini yalnizca guvenli baglamda
acar. `http://192.168.x.x` ile konum izni hic sorulmaz, uygulama sessizce
calismaz gorunur. Bu yuzden yerel IP degil tunel kullaniliyor.

`spa-sunucu.py` (scratchpad'te) `dist/`i servis eder ve bilinmeyen yollari
`index.html`e dusurur; yoksa telefonda sayfa yenilendiginde 404 gelir
(expo-router yonlendirmeyi istemcide yapiyor).

**Bu yolun sinirlari:** push bildirimleri web'de calismaz (zaten bilinen
borc); paket statik, kod degisirse `expo export` yeniden kosulmalidir.
**Gizlilik notu:** tunel arayuzu gecici olarak internete acar. Adres
tahmin edilemez, tunel kapaninca olur ve veri tarafinda Supabase RLS
korumasi durur; yine de canli veritabanina bagli bir arayuz disari
aciliyor, bilerek yapiliyor.

EAS tarafi olduğu yerde duruyor: `app.json` ve `eas.json` hazir
(commit 5a6f49d), tek eksik Expo hesabi girisi. Ileride gercek cihazda
bildirim denemek gerekirse o yol bir `eas-cli login` uzaklikta.

### Yerelden devam (2026-08-19'dan sonra tek yol bu)

Butun bulut oturumlari kapatildi. Calisma yalnizca kullanicinin kendi
terminalinde surer. Yeni oturumda:

```bash
cd ~/projects/cloud            # Windows'ta: cd C:\Users\orcns\projects\cloud
git fetch origin
git checkout claude/plan1-hesap-haklari
git pull origin claude/plan1-hesap-haklari
cd mobil && npm install        # node_modules repoda degil
npx jest --runInBand           # mock tabanli suite (44 paket / 359 test)
npm run test:sema              # gercek veritabani, sema ve yetkiler (137 dogrulama)
npm run test:gorunurluk        # gercek veritabani, 56 senaryo / 306 dogrulama
npx tsc --noEmit               # bes onceden var olan hata beklenir
cd supabase/functions && deno check hesap-sil/index.ts && deno check bildirim-gonder/index.ts && deno test --allow-net --allow-env
```

Dal adi guncel kalmali: en son calisilan dal `claude/plan1-hesap-haklari`
(2026-08-22, Plan 1 kapanisi). Sayilar Plan 1 kapanisindaki degerler
(senaryo 29 varsayilan kosumda bilerek ATLANDI gosterilir - gunluk
tavan senaryosu; senaryo 57 kaldirildi, numara bosta).

Bulutta oturum acma — sebebi asagidaki 2026-08-19 tarihli karar.

### ARSIV - Faz 3a'nin ortasinda yazilmis devam notu (GECERSIZ)

**Bu bolum tarihsel bir kayittir; aktif is DEGILDIR.** Faz 3a
2026-08-20'de 18/18 gorevle kapandi, ardindan Faz 3b de kapandi. Guncel
durum icin "Faz 3a TAMAMLANDI" ve "Faz 3b TAMAMLANDI" bolumlerine bak.
Asagisi yazildigi gunun kaydidir.

Oturum token siniri yuzunden kesildi. **Yeni oturumda once
`docs/faz3a-devam-notu.md` dosyasini oku** - nerede kalindigi, testlerin
hali, bilerek acik birakilan kirik pencereler ve ortam tuzaklari orada.

Kisaca: dal `claude/faz3a-bag`, 18 gorevden 8'i uygulandi, Task 8
incelenmeyi bekliyor. Spec ve plan
`docs/superpowers/specs/2026-08-19-faz3a-bag-design.md` ve
`docs/superpowers/plans/2026-08-19-faz3a-bag.md`. Yurutme defteri
`.superpowers/sdd/2026-08-19-faz3a-bag/progress.md` (git'e girmiyor ama
diskte duruyor).

## Uygulama fikri

**Konum tabanli sosyal uygulama.** Kullanicilar arkadas buluyor, arkadas
ekliyor, konum belirtiyor ve sohbet ediyor.

- **Platform:** gercek mobil uygulama (magazadan indirilen). Tarayici
  uygulamasi degil — kullanicinin karari, 2026-08-11.
- **Cekirdek islevler:** arkadas kesfi, arkadas ekleme, konum paylasimi,
  mesajlasma.

### Henuz cevaplanmamis (fikri netlestirmek icin gerekli)

1. **Kime hitap ediyor ve neden mevcutlardan farkli?** Bu tarif bugun onlarca
   uygulamaya uyuyor. Ayirt edici nokta belirlenmeden teknoloji secimi
   yapilmamali — mimariyi belirleyen sey bu.
2. **Konum ne kadar hassas?** Canli konum mu, sehir/semt gibi kaba bir alan mi,
   yoksa "su an burada" seklinde anlik bir paylasim mi? Uc secenek uc farkli
   mimari ve uc farkli risk profili demek.
3. **Kimler birbirini gorebiliyor?** Sadece karsilikli arkadaslar mi, yakindaki
   herkes mi? Yabancilar birbirinin konumunu gorebiliyorsa uygulama guvenlik
   acisindan bambaska bir kategoriye giriyor.

### Yerel kuruluma gecis

Gelistirme kullanicinin kendi bilgisayarina tasiniyor. Adim adim rehber:
`docs/yerel-kuruluma-gecis.md`. claude-mem hafizasinin (181 gozlem) yedegi
`docs/hafiza/claude-mem-yedek.db` icinde; maskelenmis ve sikistirilmis kopya.

### Siradaki adim

Tasarim tamam ve onaylandi:
`docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`
(2026-08-13'te yas politikasi 18+'a sadelestirildi — asagidaki "Kararlar"
bolumune bak).

**Faz 1 tamamlandi** (`docs/superpowers/plans/2026-08-13-faz1-hesap.md`).
Kayit, telefon dogrulama, profil olusturma ve oturum calisiyor; uctan uca
hem API hem arayuz uzerinden dogrulandi. Kod `mobil/` altinda (Expo +
Supabase), 12 test suite / 30 test yesil.

**Canli Supabase projesi:** `konum-sosyal`, ref `swpiibyuoffykbmirvgq`,
bolge eu-central-1. Iki migrasyon uygulandi (`profiller` tablosu +
`profil-fotograflari` bucket'i). Telefon dogrulama, ucretsiz test
numaralariyla calisiyor: `+90555000000{0,1,2,3}`, hepsinin kodu `123456`,
gercek SMS gitmiyor. Gercek anahtarlar `mobil/.env` icinde (gitignored).

Calistirmak icin: `cd mobil && npx expo start --web` → <http://localhost:8081>

Sirada **Faz 2** var ve ikiye bolundu:

- **Faz 2a — Mekanlar ve check-in:** OSM mekan yuklemesi, mekan arama, mekan
  ekleme, check-in (not + fotograf), 4 saat + "ayrildim", profilde ani.
  Sonunda kullanici check-in yapabiliyor ama henuz kimse kimseyi gormuyor.
- **Faz 2b — Kesif ve guvenlik:** yakindakiler sorgusu, yaricap ayari, mekan
  detayi, baskasinin profili, gizli check-in, gorunurluk tercihi, engelleme
  ve sikayet. Gorunurluk ve koruma ayni anda geliyor.

**Faz 2a TAMAMLANDI** (2026-08-15). Spec:
`docs/superpowers/specs/2026-08-14-faz2a-mekanlar-checkin-design.md`,
plan: `docs/superpowers/plans/2026-08-14-faz2a-mekanlar-checkin.md`.
15 gorev, 24 commit, 21 test paketi / 69 test yesil. Beyin firtinasinda
alinan 18 kararin tam listesi `docs/konusma-gunlugu.md` icinde.

Calisan islevler: mekan arama (PostGIS, sabit 3 km yaricap), mekan
ekleme (~200 m yakinlik + gunluk 5 limit, sunucuda zorunlu), check-in
(~500 m yakinlik, not + fotograf, tek aktif check-in), karsilikli canli
gorunurluk (ayni mekanda check-in yapanlar birbirini gorur — RLS ile),
4 saat sonra ya da "ayrildim" ile otomatik ani donusumu (pg_cron),
profilde anilari gorme/haritada acma/silme.

**Faz 2a'da bulunup duzeltilen uc gercek kusur** (surec kayitlari icin):
1. Storage politikalarinda `to authenticated` eksikti — kimliksiz
   kullanici ani fotograflarini okuyabiliyordu.
2. `mekan_ekle` RPC'sinde `auth.uid()` null kontrolu yoktu — kimliksiz
   cagri gunluk limiti atlatip sahipsiz kayit ekleyebiliyordu. Ayni
   koruma diger iki `security definer` RPC'ye de onden eklendi.
3. Mekan detay ekrani baskalarinin adini `profiller(ad)` join'iyle
   okumaya calisiyordu; FK yoklugu + Faz 1'in "sadece kendi profilini
   oku" RLS'i yuzunden gercek veritabaninda hic calismiyordu ve
   sessizce bos ekran gosteriyordu. 66 test yesil oldugu halde
   yakalanmamisti cunku hepsi Supabase'i mock'luyor. Cozum: ad
   `check_inler`'e denormalize edildi (karar #18).

Faz 2a'nin "elle ucdan uca dogrulama" borcu Faz 2b'de kismen kapandi:
artik canli veritabanina karsi calisan bir gorunurluk test paketi var
(`npm run test:gorunurluk`), yani RLS kurallari mock'a degil gercek
veritabanina soruluyor. Geriye kalan tek borc, arayuzu iki hesapla
tarayicida elle gezmek.

**Faz 2b TAMAMLANDI** (2026-08-19). Spec:
`docs/superpowers/specs/2026-08-16-faz2b-guvenlik-ve-yogunluk-design.md`,
plan: `docs/superpowers/plans/2026-08-16-faz2b-guvenlik-ve-yogunluk.md`.
18 gorev, dal `claude/faz2b-guvenlik`. 28 test paketi / 115 Jest testi
yesil, ayrica canli veritabanina karsi 10 senaryoluk gorunurluk testi
(`npm run test:gorunurluk`) tam gecti.

Calisan islevler: gizli check-in (`gizli_mi`) ve varsayilan gizlilik
tercihi, ani gorunurlugu secimi, cift tarafli ve sessiz engelleme
(gecmis anilari da kapsar), sikayet akisi, baskasinin profili
(`security definer` RPC ile, dogum tarihi acilmadan), mekan yogunlugu
sayisi (kim oldugu gorunmeden), 1-5 km yaricap ayari, ana ekrandan
gizlilik ayarlarina erisim. Gizli bir check-in aniya donusurken
(hem "ayrildim" hem 4 saatlik pg_cron yolunda) gorunurlugu de
`'kimse'` yapiliyor.

**Faz 2b'nin elle dogrulanmayan kismi:** Task 17 Step 5'teki iki hesapli
tarayici gezintisi (iki test numarasiyla ayni mekana check-in →
birbirini gorme → engelleme → gormeme → yogunluk sayisinin ikisinde de
ayni kalmasi). Dev sunucusunun ayaga kalktigi ve web paketinin hatasiz
derlendigi dogrulandi (1088 modul), ama etkilesimli adimlar bir insan
gerektirdigi icin yapilmadi. Ayni senaryolarin veritabani tarafi
gorunurluk testlerinde zaten kapsaniyor; acikta kalan yalnizca arayuz
kablolamasi.

**Faz 2b'de hala yapilmamis elle dogrulama** (plan Task 17 Step 5, "Atlama"
notu var): iki tarayici penceresinde iki test numarasiyla
(`+905550000000` ve `+905550000001`, kod `123456`) ayni mekana check-in →
birbirinizi goruyor musunuz → biri digerini engelliyor → artik gormuyor
musunuz → yogunluk sayisi ikisinde de ayni mi. Faz 2a'da tam bu adim
atlandigi icin canli veritabaninda hic calismayan bir ekran uretilmisti.

**Faz 1'den devreden temizlik isleri** (hicbiri acil degil): kullanilmayan
demo bagimliliklarinin (`@expo/ui`, `expo-symbols`, `expo-image` vb.) ve
sablon gorsellerinin silinmesi, ESLint yapilandirmasinin eklenmesi,
`jest`/`jest-expo`'nun `dependencies`ten `devDependencies`e tasinmasi,
storage bucket'ina silme politikasi, `expo-image-picker` config
plugin'inin `app.json`'a eklenmesi (gercek iOS derlemesi icin sart).

**Faz 2a'dan devreden isler:** cevrimdisi kuyruk (karar #17), OSM
yukleme betiginin gercek veriyle ilk kez calistirilmasi
(`araclar/README.md`), check-in fotografi silinince Storage'da kalan
oksuz dosya, ag hatasi mesajinin sadece bir ekranda Turkcelestirilmis
olmasi.

**Faz 2b'den sonra sirada** iki bagimsiz is var: **moderasyon paneli**
(uygulamanin icinde degil, `sikayetler` tablosunu okuyan ayri bir web
sayfasi; kendi kucuk planini alacak) ve **Faz 3 — bag ve sohbet** ya da
**Faz 4 — gelir**. Faz 4'un kisi listesi Faz 2b'nin guvenlik
altyapisinin uzerine oturacak.

**Faz 2c TAMAMLANDI** (2026-08-19). Spec:
`docs/superpowers/specs/2026-08-19-faz2c-kimlik-ve-kisi-arama-design.md`.
16 gorev, dal `claude/faz2c-kimlik`. `npx jest --runInBand` ile 32 test
paketi / 151 test yesil, ayrica canli veritabanina karsi calisan iki ayri
kosum tam gecti: `npm run test:sema` (sema ve sutun yetkilerini gercek
veritabaninda dogruluyor, 22 dogrulama) ve `npm run test:gorunurluk`
(17 senaryo — Faz 2b'nin 10 senaryosuna Faz 2c'nin 7 yeni kimlik/arama
senaryosu eklendi).

Calisan islevler: `profiller` tablosuna uc yeni sutun — `kullanici_adi`
(zorunlu, benzersiz, bicim `^[a-z0-9._]{3,20}$`), `kullanici_adi_degistirildi`,
`aramada_gorunsun`. Sutun duzeyinde yetki kisitlamasi var: `authenticated`
rolu `kullanici_adi` ve `kullanici_adi_degistirildi` sutunlarini dogrudan
guncelleyemiyor, yalnizca RPC uzerinden degistirilebiliyor — 30 gunluk
degistirme kuralini sunucuda **baglayici** yapan sey bu (istemci
atlayamaz). Uc yeni RPC: `kullanici_adi_musait_mi` (canli musaitlik
kontrolu), `kullanici_adi_degistir` (30 gun kurali sunucuda zorlaniyor),
`kisi_ara` (kullanici adi ve isimle arama; iki yonlu engelleme,
`aramada_gorunsun` tercihi, kendini disliyor, en az 2 karakter, en fazla
20 sonuc, `%`/`_`/`\` joker karakterleri kacisli). `baskasinin_profili`
RPC'si kullanici adini da donecek sekilde genisletildi. Bes ekran
degisikligi: kayitta kullanici adi secimi + canli musaitlik gosterimi,
ayarlarda kullanici adi degistirme + "Beni aramada goster" anahtari,
yeni `kisiler` (kisi arama) ekrani, ana ekranda kisi aramaya giris,
baskasinin profilinde `@kullaniciadi`. Iki yeni istemci modulu:
`lib/kullanici-adi.ts` (bicim kurallari + RPC sarmalayicilari),
`lib/kisi-ara.ts` (arama cagrisi); `lib/profil.ts` ve `lib/ayarlar.ts`
genisletildi.

**Task 16 kapanisinda bulunan bir test hatasi (kodda degil, testte):**
`test:sema` icindeki joker-kacis dogrulamasi ilk calistirmada basarisiz
oldu — ama sebep `kisi_ara`'nin kacis mantigindaki bir kusur degildi.
Test, B kullanicisinin adinin 5. karakterinin gercekte alt cizgi
olmadigini varsayarak sabit bir konuma joker yerlestiriyordu; Task 15'in
30-gun senaryosu B'nin adini `test_<zaman damgasi>` yapinca bu varsayim
gerceklikten koptu ve mesru bir eslesme "hata" olarak raporlandi (ters
bolu kacis probu ayrica calistirilip dogru sonuc verdigi icin kacis
mantiginin saglam oldugu ayrica dogrulandi). Duzeltme: joker konumu artik
B'nin gercek adindan turetiliyor (ilk alt-cizgi-olmayan karakterin
konumu bulunup oraya joker konuyor), sabit bir indekse guvenmiyor.
Degisen tek dosya `mobil/gorunurluk-testleri/sema-dogrula.ts`.

Dev sunucusu 8083 portunda `--web --clear` ile ayaga kalkti, HTTP 200
donduruyor, log'da `Web Bundled ... (973 modules)` satiri var ve
`ERROR` satiri yok — hem bu oturumda hem koordinator tarafindan ayrica
dogrulandi.

**Faz 2c'nin elle dogrulanmayan kismi:** iki hesapla tarayicida gezinme
hic yapilmadi (etkilesimli, insan gerektiriyor). Dogrulanmasi gereken
senaryolar: iki test numarasiyla (`+905550000000` / `+905550000001`,
sifre `test1234`) giris; A'nin kisi aramasinda B'yi kullanici adi ve
isimle bulmasi; B'nin profilinde `@kullaniciadi`nin gorunmesi; B
"Beni aramada goster"u kapatinca A'nin aramasinda B'nin kaybolmasi ve
geri acinca yeniden gorunmesi; B'nin kullanici adini degistirmesi ve
ikinci denemede 30 gun mesaji almasi; A, B'yi engelleyince ikisinin de
birbirini aramada bulamamasi. Bu senaryolarin veritabani tarafi
`npm run test:gorunurluk` icindeki 7 yeni senaryoda zaten kapsaniyor;
acikta kalan yalnizca arayuz kablolamasinin elle dogrulanmasi.

**Faz 3a TAMAMLANDI** (2026-08-20). Spec:
`docs/superpowers/specs/2026-08-19-faz3a-bag-design.md`, plan:
`docs/superpowers/plans/2026-08-19-faz3a-bag.md`. 18 gorev, dal
`claude/faz3a-bag`, hepsi incelendi. Fazin **son** dogrulama degerleri
(final inceleme dalgasi `b0f03c9` dahil): `npx jest --runInBand` ile 36
test paketi / 224 test yesil, `npm run test:sema` ile 42 dogrulama
yesil, `npm run test:gorunurluk` ile 82 dogrulama yesil sifir
basarisizlikla (senaryo 29 varsayilan kosumda bilerek ATLANDI
gosteriliyor - gunluk tavan senaryosu, ayri `--tavan` bayragiyla
calisiyor). Bu bolum ilk yazildiginda 216 / 40 / 79 yaziyordu; o
degerler final incelemeden ONCEKI anin degerleriydi ve
`docs/faz3a-takip-isleri.md` ile celisiyorlardi.

Yeni tablolar: `takipler`, `sohbet_istekleri`, `istek_gunlugu`. Yeni
sutunlar: `check_inler.bulunurluk`, `profiller.varsayilan_bulunurluk`
(eski `check_inler.gizli_mi` ve `profiller.varsayilan_gizli` dusuruldu).
Yeni ozel sema yardimcilari: `bag.takip_ediyor_mu`, `bag.ani_gorunurlugu`,
`bag.istek_on_kontrol`. Yeni genel RPC'ler: `takip_istegi_gonder`,
`takip_istegini_yanitla`, `takibi_birak`, `takipciyi_cikar`
(Faz 3b'de dusuruldu),
`sohbet_istegi_gonder`, `sohbet_istegini_yanitla`, `bag_kisileri`;
`engelle` iki yondeki takip/sohbet kayitlarini da silecek sekilde
genisletildi; `check_in_yap` ve `check_inden_ayril` uc kademeli modele
gecti. Canli varlik icin uc kademe: `herkese_acik` / `takipcilerim` /
`gizli`; anilar icin uc kademe: `herkese_acik` / `takipcilerim` /
`kimse`. Yeni istemci modulleri `lib/bag.ts` ve `lib/bag-listeleri.ts`;
`lib/checkin.ts` ve `lib/ayarlar.ts` uc kademeli modele tasindi. Yeni
ekran `baglar`; degisen ekranlar: check-in, ayarlar, baskasinin profili,
ana ekran.

**Faz 3a'nin elle dogrulanmayan kismi:** iki hesapla tarayicida gezinme
(Task 18 Step 3) yapilmadi (etkilesimli, insan gerektiriyor).
Dogrulanmasi gereken bes senaryo: A, B'nin profilinden takip istegi
gonderir ve B'nin "Baglar" ekraninda istegi gorur; B kabul edince A,
B'nin canli check-in'ini mekana gitmeden gorur; B `bulunurluk = 'gizli'`
ile check-in yapinca A goremez; B, A'yi takipcilerinden cikarinca A yine
goremez; A, B'yi engelleyince iki tarafta da bag kaybolur. Bu bes
senaryonun veritabani tarafi `npm run test:gorunurluk` icindeki 79
dogrulamada zaten kapsaniyor (ozellikle senaryo 19-28); acikta kalan
yalnizca arayuz kablolamasinin elle dogrulanmasi.

**Faz 3a'da ogrenilen ortam tuzaklari:**
- `npx tsc --noEmit` bu fazin dogrulama setinin bir parcasi. Jest bu
  sinif hatayi goremiyor: ekran testleri `lib` modullerini mock'luyor,
  bu yuzden degisen bir fonksiyon imzasi uygulamayi iki gorev boyunca
  derlenemez halde birakti ama 185 test yesil kaldi. Taban durum
  `@types/node` kurulu olmadigi icin var olan bes onceden gelen hata.
- Calisan bir `expo start --web` sunucusu tam Jest kosumlariyla islemci
  icin yarisir ve araliklarla 5000 ms render-timeout hatalari dogurur.
  Tam kosumdan once kapatilmali.
- Supabase MCP sunucusu baglaniyken canli veritabanina dogrudan SQL
  erisimi veriyor. "Uzaktan SQL calistirmanin yolu yok" diyen eski not
  gecersiz.
- `test:gorunurluk --tavan` gunun geri kalani icin yikici: test
  hesabinin ekle-only istek gunlugune 50 kalici satir yaziyor, istemci
  bunlari tasarim geregi silemiyor.

**Faz 3b bu bolumu iki noktada gecersiz kildi:** takip artik KARSILIKLI
(kabul iki satir yaziyor) ve `takipciyi_cikar` RPC'si dusuruldu. Ayrinti
asagida "Faz 3b TAMAMLANDI" bolumunde.

**Faz 3b TAMAMLANDI** (2026-08-20). Spec:
`docs/superpowers/specs/2026-08-20-faz3b-birebir-sohbet-design.md`, plan:
`docs/superpowers/plans/2026-08-20-faz3b-birebir-sohbet.md`. 18 gorev,
dal `claude/faz3b-sohbet`, hepsi incelendi. Kapanista kosulan dort
dogrulama: `npx jest --runInBand` ile 39 test paketi / 289 test yesil;
`npm run test:sema` ile 69 dogrulama yesil; `npm run test:gorunurluk`
ile 44 senaryo / 216 dogrulama yesil, sifir basarisizlik (senaryo 29
varsayilan kosumda bilerek ATLANDI gosteriliyor - gunluk tavan
senaryosu, ayri `--tavan` bayragiyla calisiyor); `npx tsc --noEmit`
yalnizca bes onceden var olan hatada kaldi (hepsi `@types/node`
yoklugundan).

**Faz 3a'nin bag modelini degistiren karar (karar #42): takip artik
KARSILIKLI.** Faz 3a'da kabul edilen bir takip istegi `takipler`
tablosuna tek satir (A->B) yaziyordu; artik kabul IKI satir birden
yaziyor (A->B ve B->A, ikisi de `kabul`). Sonuclari: `takipcilerim`
gorunurluk kademesi "beni takip edenler" degil "karsilikli bagli oldugum
kisiler" demek; `takibi_birak` iki yonu birden siliyor; `takipciyi_cikar`
RPC'si ve istemcideki `takipciyiCikar` sarmalayicisi DUSURULDU; `baglar`
ekrani iki ayri liste yerine tek takip listesi gosteriyor. `takipler`
tablosunun semasi degismedi, degisen tek sey satirlarin ne zaman
yazildigi; karsiliklilik yalnizca kabul RPC'sinde kuruluyor ve tabloya
baska yazma yolu yok. **Faz 3a belgelerinde "takip tek yonlu" diyen her
ifade artik gecersizdir.**

Yeni tablolar: `konusmalar`, `konusma_uyeleri`, `mesajlar`. Yeni ozel
sema yardimcisi: `bag.yazabilir_mi` - tek yazma kapisi; karsilikli takip
VEYA kabul edilmis sohbet istegi yaziyor olmayi saglar. Yeni genel
RPC'ler: `mesaj_gonder` (bul-ya-olustur), `konusmalarim`,
`mesajlari_getir`, `konusmayi_okundu_isaretle`, `konusmayi_gizle`;
`sikayet_gonder` artik `'mesaj'` turunu de kabul ediyor; `mesajlar`
tablosu Realtime yayininda. Yazma yetkisi **her mesajda** yeniden
olculuyor, konusma acilirken bir kez degil: bag koparsa konusma
salt-okunur oluyor, gecmis silinmiyor. Konusmayi "gizle" yalnizca kendi
tarafta calisiyor; karsi taraf yazinca konusma geri geliyor. Yeni istemci
modulu `lib/sohbet.ts`; `lib/bag.ts`'ten `takipciyiCikar` cikarildi. Yeni
ekranlar: `mesajlar` (mesaj kutusu) ve `sohbet/[kullaniciId]` (konusma);
degisen ekranlar: ana ekran (mesajlar girisi + okunmamis rozeti),
`baglar`, baskasinin profili (mesaj gonder butonu).

**Faz 3b'nin elle dogrulanmayan kismi:** iki hesapla tarayicida gezinme
yine yapilmadi (etkilesimli, insan gerektiriyor). Dogrulanmasi gerekenler:
karsilikli bag kurulunca profildeki "Mesaj gonder" butonunun acilmasi;
gonderilen mesajin karsi tarafta Realtime ile belirmesi; ana ekrandaki
okunmamis rozetinin artmasi ve konusma acilinca sifirlanmasi; konusmayi
gizlemenin yalnizca kendi tarafta calismasi ve karsi taraf yazinca geri
gelmesi; bag koptuktan sonra gecmisin okunabilir ama yazma alaninin
kapali olmasi. Bunlarin veritabani tarafi `npm run test:gorunurluk`
icindeki 44 senaryoda kapsaniyor; acikta kalan yalnizca arayuz
kablolamasinin gozle dogrulanmasi.

**Faz 3b'den kalan takip isleri:** `docs/faz3b-takip-isleri.md`. O
dosyanin ilk iki maddesi gelecekteki bir isi yanlis yone sokabilecek
cinsten: birincisi `mesajlari_getir`'in engelleme kontrolunun her
konusmanin tam iki uyeli olduguna dayandigini belgeliyor (bu artik
KALICI bir varsayim; asagidaki karara bak), ikincisi mesaj sikayetinin
hangi mesaja ait oldugunun `sikayetler` tablosundan okunamadigini
anlatiyor - ikincisi moderasyon panelini yazani ilgilendiriyor.

**Plan 1 TAMAMLANDI** (2026-08-22). Spec:
`docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`
("Hesap haklari: dondurma ve silme" bolumu, karar 55-70), plan:
`docs/superpowers/plans/2026-08-22-plan1-hesap-durumu-ve-haklari.md`.
Dal `claude/plan1-hesap-haklari`. 18 gorevden 17'si uygulandi; **Task
14 (kullanici adi rezervasyonu) uygulanip ayni oturumda kullanici
karariyla GERI ALINDI** (karar 70) - ilgili tablo, RPC ve budama isi
veritabanindan dusuruldu, `kullanici_adi_musait_mi` rezervasyon oncesi
haline dondu. 16 migrasyon (`20260822090000`den `20260822103000`e,
kullanici adi rezervasyonunun ekleyip-sonra-kaldiran iki migrasyonu
dahil), 1 yeni Edge Function (`hesap-sil`), 1 yeni istemci modulu
(`lib/hesap.ts`), 3 yeni ekran (askidaki hesap, gizlilik metni, hesap
silme), 12 yeni canli senaryo (45-56; senaryo 57 - rezervasyon testi -
ozellikle birlikte kaldirildi, numara bosta).

Kapanis dogrulamasi (bu oturum, Task 18): `npx jest --runInBand` 44
paket / 359 test yesil; `npm run test:sema` 137 dogrulama, 0 hata;
`npm run test:gorunurluk` 56 senaryo (29 bilerek ATLANDI - gunluk
tavan) / 306 dogrulama, 0 hata; `npx tsc --noEmit` yalnizca bes
onceden var olan `@types/node` hatasi; `deno check` iki Edge
Function'da da temiz, `deno test` 17/17 yesil.

Calisan islevler: `hesap_durumlari` tablosu (`askida` / `yasakli` /
`dondurulmus`) ve `moderasyon.hesap_aktif_mi` yardimcisi; spec'teki 8
yazma kapisinin (check_in_yap, mekan_ekle, kullanici_adi_degistir,
bag.istek_on_kontrol, takip/sohbet istegini yanitla, bag.yazabilir_mi,
profiller update politikasi, Storage profil-fotograflari insert
politikasi) ve 5 gorunurluk yolunun (check_inler select, kisi_ara,
baskasinin_profili, bag_kisileri, yakin_mekanlar_yogunluk) hepsi
askiya alma/dondurma/yasaklamaya baglandi; `hesabimi_dondur` /
`hesabimi_geri_ac` RPC'leri (geri acilma otomatik, girisde tetiklenir);
`hesap-sil` Edge Function'i (parola sunucuda `signInWithPassword` ile
dogrulanir, Storage fotograflari silinir, `auth.admin.deleteUser`
cagrilir); mesajlarda gonderen, sikayetlerde sikayet eden anonimlesir
(cascade yerine `set null`); tek uyeli konusma destegi
(`mesajlari_getir`, `konusmalarim`, `bag.yazabilir_mi` uc okuyucu da
duzeltildi); gizlilik metni (`docs/gizlilik-metni.md`) ve onu gosteren
ekran (`Ayarlar > Gizlilik metni`).

**Gercek hesap silme canli olarak IKI AYRI TURDA dogrulandi**
(kontrolor tarafindan, atilabilir test hesaplariyla): tam silme akisi
(yanlis parolayla red, dogru parolayla silme, ayni telefonla yeniden
kayit) ve parola dogrulama yolunun kendisi (`signInWithPassword`
sunucuda gercekten calisiyor). Brief'teki Step 3'un geri kalani -
dondur -> cikis -> giris -> otomatik geri acilma, askidaki hesap
ekrani, gizlilik ekrani - **kullaniciya birakildi**; etkilesimli,
insan gerektiriyor.

Oturum icinde kullanicinin verdigi kararlar: dondurulmus hesap geri
acilinca canli check-in geri gelmez (yalnizca ani olarak kalir);
kullanici adi rezervasyonu tamamen kaldirildi (karar 70, gerekce:
ozellik hicbir yazma noktasinda zorlanmiyordu); hesap silme onayi
yalnizca parola ile yapilir, kullanici adi onayi kaldirildi; gizli
check-in yogunluk sayacinda gorunmeye devam eder (karar 71).

Enforcement-noktasi denetiminde (Task 18 Step 2) bulunan uc test
bosluğu: `bag.yazabilir_mi` (askidaki kullanici mesaj gonderemez,
gate 6), `sohbet_istegini_yanitla`'nin askı kontrolu (gate 5'in yarisi
- yalnizca `takip_istegini_yanitla` senaryo 48'de test edildi) ve
Storage `profil-fotograflari` insert politikasi (gate 8) migrasyonlarda
DOGRU uygulanmis ama `test:gorunurluk` icinde kendi senaryolari yok.
Tam liste ve okuma kaniti `docs/plan1-takip-isleri.md` icinde.

Kalan takip isleri: `docs/plan1-takip-isleri.md`.

### Bastan tasarima girmesi gereken kisit

Yabancilarla konum paylasimi bu uygulamanin **cekirdek riski**, sonradan
eklenecek bir ozellik degil. Sonuclari:

- Turkiye'de KVKK, AB kullanicisi olacaksa GDPR kapsaminda konum "ozel nitelikli
  olmayan ama yuksek riskli" kisisel veri; acik riza, saklama suresi ve silme
  akisi gerekiyor.
- App Store ve Play Store konum izni ve resit olmayan kullanicilar konusunda
  ayri kurallar isletiyor; yanlis kurgu magaza reddine yol aciyor.
- Taciz, takip ve sahte hesap senaryolari icin engelleme/sikayet akisi ilk
  surumde olmali.

- 2026-08-19 — **claude-mem kapatildi; oturumlar arasi hafiza tamamen
  depodaki dosyalara birakildi.** Eklentinin `UserPromptSubmit` hook'u her
  mesajda 37700 portundaki worker'a ulasmaya calisiyor ve ulasamayinca
  **mesaji bloke ediyordu** ("claude-mem worker unreachable for 102
  consecutive hooks"). Worker bu makinede hic baslamiyordu, cunku onu kuran
  `SessionStart` hook'u ayarlardan cikarilmisti. Bu, kullaniciyi hicbir sey
  yazamaz hale getiren bir ariza; worker'i yeniden baslatmak da kalici cozum
  degil, cunku bir sonraki basarisizlikta ayni blokaj geri gelir.

  Kapatma **proje ayarinda** (`.claude/settings.json`) yapildi ki depoyla
  birlikte tasinsin; ayrica `.claude/settings.local.json` icinde de `false`
  duruyor (ikinci emniyet, gitignored).

  **Hicbir bilgi kaybedilmedi.** Kapatmadan once veritabaninin WAL'i ana
  dosyaya islendi (4.2 MB veri orada bekliyordu) ve tam kopya
  `~/.claude-mem/backups/claude-mem-2026-08-19-tam.db` olarak alindi:
  820 gozlem, `pragma integrity_check` = ok. Bu kopya **depoya konmadi**,
  cunku depo artik public ve veritabani ham oturum icerigi tasiyor.
  Depodaki eski `docs/hafiza/claude-mem-yedek.db` (181 gozlem, maskelenmis)
  oldugu yerde kaliyor.

  Sureklilik zaten claude-mem'e degil su uce dayaniyordu ve dayanmaya devam
  ediyor: `CLAUDE.md` (her oturum basinda otomatik yuklenir),
  `docs/konusma-gunlugu.md`, ve `.claude/hooks/oturum-kaydet.py` tarafindan
  yazilan oturum dokumleri. Ucu de dosya tabanli, bloke etmiyor ve git'te
  duruyor.

## Eklentiler

Hepsi `.claude/settings.json` icinde **proje kapsaminda** tanimli, yani yeni
konteynerde kendiliginden geri gelir. Nasil eklendigi: `docs/eklenti-ekleme.md`.

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi.
- `code-review@claude-code-plugins` — PR'lari 4 paralel ajanla denetleyip
  bulgulari 0-100 guven puaniyla eleyen otomatik kod incelemesi (esik 80).
  Cagrisi: `/code-review:code-review`, PR'a yorum birakmak icin `--comment`.
- `security-guidance@claude-code-plugins` — her duzenlemeyi guvenlik acigi
  kaliplarina karsi tarayan hook tabanli eklenti (komut enjeksiyonu, sizmis
  anahtar, vb.). Slash komutu yok, arka planda calisir.
- `claude-mem@thedotmack` — **KAPATILDI (2026-08-19).** Oturumlar arasi
  hafiza eklentisiydi; `~/.claude-mem` altinda SQLite + chroma tutuyor ve
  37700 portunda bir worker calistiriyordu. `UserPromptSubmit` hook'u
  worker'a ulasamadiginda **mesaji bloke ettigi** icin kapatildi — asagidaki
  karara bak. Verisi duruyor, kaybedilmedi.

- `no-ai-slop` (petergyang/no-ai-slop) — market eklentisi **degil**, tek dosyalik
  beceri. Repoya dogrudan kopyalandi: `.claude/skills/no-ai-slop/`. Yaziyi 20+
  "AI slop" kalibindan temizler, sesini korur. `/no-ai-slop <metin>` duzeltir,
  `/no-ai-slop is this slop? <metin>` sadece tespit eder.
- `gstack` (garrytan/gstack) — market eklentisi **degil**;
  `~/.claude/skills/gstack` altina klonlanip `./setup` ile kurulur. 54 beceri,
  hepsi `gstack-` onekli (`/gstack-qa`, `/gstack-ship`, `/gstack-review`...).
  Onek, diger eklentilerle cakismasin diye `--prefix` ile secildi.

## Kararlar

- 2026-08-22 - **Plan 1 (hesap durumu temeli ve kullanici haklari)
  KAPANDI; SIRADAKI IS Plan 2 (moderasyon paneli).** Asagidaki
  "SIRADAKI IS: moderasyon paneli. SPEC YAZILDI, kod yazilmadi." girdisi
  artik kismen gecersiz - spec ve Plan 1 uygulandi, kod yazildi. Ayrinti
  "Faz 3b'den kalan takip isleri" basligindan hemen sonraki "Plan 1
  TAMAMLANDI" bolumunde. Ozet: 17/18 gorev (Task 14 uygulanip geri
  alindi), dort otomatik kosum sifir hatayla yesil, gercek hesap silme
  iki ayri canli turda dogrulandi, elle tarayici gezintisi kullaniciya
  birakildi. Plan 2 baslamadan once o gezinti tamamlanmali.

- 2026-08-22 - **SIRADAKI IS: moderasyon paneli. SPEC YAZILDI, kod
  yazilmadi.** Spec:
  `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`.
  Beyin firtinasi kararlari `docs/moderasyon-paneli-devam-notu.md`
  icinde (tek moderator simdilik, kapsam TAM YONETIM KONSOLU, mesaj
  sikayeti tamamen kaldiriliyor). Spec o notun acik biraktigi dort
  soruyu karar 55-61 ile kapatti (`docs/konusma-gunlugu.md`):
  **panelde service-role YOK** (moderator siradan kullanici olarak
  girer, erisim `security definer` RPC'lerden gecer), yonetici kimligi
  AYRI hesap + zorunlu TOTP ve **AAL2 veritabaninda zorlanir**,
  "askiya alma" `hesap_durumlari` tablosu + `moderasyon.hesap_aktif_mi`
  ile butun yazma kapilarinda ve gorunurluk yollarinda zorlanir, panel
  `panel/` altinda ayri bir Vite + React uygulamasi, moderator ozel
  "kaldirma" ilk dilimde GIZLEME olarak gelir, denetim izi
  ekleme-only. **Karar 62-64 (ayni gun, kullanicinin duzeltmesi):**
  karar 59 ve onceden alinmis karar 3 GERI ALINDI - moderator ozel
  mesajlari OKUYABILIR ("her seye tam ulasilir olmam gerek") ve mesaj
  sikayeti kaliyor, iki kusuru duzeltilerek. Mesaj okuma izli ve
  gerekceli, salt-okunur; yan yukumluluk olarak gizlilik metni ekrani
  ayni dilime girdi. **Karar 65-70:** gizlilik/KVKK her adimda gozetilir
  (`docs/kvkk-uyum-listesi.md`), ve kullanici hesabini DONDURABILIR
  (geri giriste otomatik aktif olur) ya da KALICI SILEBILIR (geri
  donusu yok, sifirdan hesap acilir). Silme mesajlari ve sikayetleri
  anonimlestirir ama silmez, ve "her konusmanin tam iki uyesi var"
  invaryantini kirar (karar 69). **Is iki plana bolundu:** Plan 1
  hesap durumu temeli + hesap haklari + gizlilik metni, Plan 2
  moderasyon paneli. **Plan 1 YAZILDI:**
  `docs/superpowers/plans/2026-08-22-plan1-hesap-durumu-ve-haklari.md`
  (18 gorev, 12 migrasyon, 1 Edge Function, 3 yeni ekran, 12 yeni canli
  senaryo 45-56). Kod yazilmadi. Sonraki adim: Plan 1'in uygulanmasi
  (subagent-driven-development ya da executing-plans), ardindan Plan 2
  icin ayri bir plan yazilmasi.

- 2026-08-22 - **Grup sohbeti, "mekan odasi" ve COK UYELI konusma fikri
  tamamen ve kalici olarak kaldirildi.** Uygulama yalnizca birebir;
  her konusma tam iki uyeli. Karar 54 (`docs/konusma-gunlugu.md`).
  Eski belgelerdeki "Faz 3c (mekan odalari)" atiflari temizlendi;
  `mesajlari_getir`'deki `limit 1` artik risk degil kalici invaryant.

- 2026-08-21 - **Bildirimler (push) mini-fazi tamamlandi.** Spec:
  `docs/superpowers/specs/2026-08-21-bildirimler-design.md`, plan 5 gorev.
  Uygulama kapaliyken telefona dusen bildirimler: yeni mesaj, takip
  istegi, sohbet istegi, istek kabulu. Icerik TASIMAZ, yalnizca ad
  ("Deniz sana mesaj gonderdi") - karar 48, kullanicinin karari.
  Mimari: `mesajlar`/`takipler`/`sohbet_istekleri` INSERT/UPDATE -> AFTER
  trigger (`bildirim.olay_gonder`) -> pg_net ile Edge Function
  `bildirim-gonder` -> Vault sirri dogrulanir, KAYNAK SATIRI dogrulanir
  (kimlik taklidi engeli), alici cikarilir, ad okunur, Expo Push API'ye
  iletilir, DeviceNotRegistered jetonlari silinir. Sunucu tarafi canli
  UCTAN UCA dogrulandi (gercek takip istegi -> Expo cagrisi -> olu jeton
  temizligi). Yeni tablo `bildirim_jetonlari` (RPC ile yazma: jeton_kaydet
  advisory-lock atomik, jeton_sil idempotent). Ozel sema `bildirim`
  (sir_oku yalnizca service_role). Istemci `lib/bildirim.ts`
  (expo-notifications, web'de sessiz atlar, cihaz-degil/izin-red hata
  yutar), `_layout.tsx` ve `index.tsx`e baglandi.
  Testler: jest 40 paket / 316 test, test:sema 129, test:gorunurluk 216,
  tsc 5 taban - dordu de sifir hata (kontrolor bagimsiz olctu).
  ACIK BORCLAR: `docs/bildirimler-takip-isleri.md`. En onemli ikisi:
  (1) gercek cihazda ilk bildirim hic gorulmedi - EAS derlemesine kaldi
  (Expo Go/web uzak push desteklemiyor); (2) `net` semasi kilidi platform
  yuzunden zorlanamiyor, sir kuyruga cleartext yaziliyor, tek koruma
  PostgREST'in `net`i expose etmemesi + Edge Function'in kaynak
  dogrulamasi (`README-net-kilidi.md`).

- 2026-08-23 - **UYGULAMANIN ADI KESINLESTI: SLOOIN** (karar 72,
  `docs/konusma-gunlugu.md`). `app.json` guncellendi (name: Slooin,
  slug/scheme: slooin). Bilinen risk kayitli: Play'de "Sloon" adli ayni
  kategoride bir uygulama var; kullanici riski bilerek onayladi. Marka
  tescili ve alan adi kontrolu henuz yapilmadi (magaza oncesi is).
  Asagidaki 2026-08-21 karari boylece KAPANDI.
- 2026-08-21 - **Calisma adi Wherio; KALICI DEGIL.** Kullanici once
  Wherio'yu secti, ayni gun "isim degisikligi olabilir, kalici olmasin;
  isim ve tasarimi sonraya alalim" dedi. Nihai isim ve gorsel kimlik
  ERTELENDI; oncelik altyapi ve isleyis. Arastirmanin tamami (elenen
  ~30 isim, rakip listesi, riskler): `docs/isim-arastirmasi.md`.
  Konumlandirma kararlari (bunlar KALICI): hedef "ayni anda ayni seyi
  yapanlar"; amac check-in araciligiyla YENI INSANLARLA TANISMAK;
  isim uluslararasi olacak, urun cok dilli. Kod tarafi degismedi
  (`app.json` hala `mobil`), bilerek - isim kesinlesmeden koda
  girmeyecek.

- 2026-08-19 — **Push yasagi kaldirildi.** Is hem yerelde tutulacak hem
  GitHub'a itilecek. 2026-08-14'teki karar tek kopya riski dogurdugu icin
  degistirildi.
- 2026-08-19 — **YouTube otomasyonu bu depodan cikarildi.** Kendi deposuna
  tasindi: C:\Users\orcns\projects\youtube-otomasyonu. Kullanici iki isin
  karismamasini istedi. Ayirma `git subtree split` ile yapildi.

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
- 2026-08-09 — `code-review` eklentisi ayni markete (`claude-code-plugins`)
  eklendi. Bu ortamda `/plugin` paneli calismadigi icin eklentiler her zaman
  `.claude/settings.json` uzerinden acilacak; elle ekleme yontemleri
  `docs/eklenti-ekleme.md` dosyasina yazildi.
- 2026-08-09 — `settings.json`'a yazmak **tek basina yetmiyor**: dis kaynakli
  eklenti diskte kurulu degilse yuklenmiyor. `claude plugin install ... --scope
  project` de calistirilmali. Onceki oturumun `frontend-design`'i bu yuzden
  hic aktif olmamisti.
  **BU 2026-08-26'DA TEKRAR YASANDI:** uc eklenti (`frontend-design`,
  `code-review`, `security-guidance`) settings.json'da `true` gorunuyor,
  dosyalari da `~/.claude/plugins/cache` altinda duruyordu, ama
  `installed_plugins.json` icinde KAYITLI DEGILLERDI - yani yuklu
  sayilmiyorlardi. `security-guidance`'in hook'lari 2026-08-14'ten beri
  hic calismamis (pycache tarihinden olculdu). Kurulum kayidi
  `~/.claude` altinda tutuldugu ve depoya girmedigi icin bu her yeni
  makinede/klonda tekrarlanabilir. **KONTROL YOLU: `claude plugin list`**
  - settings.json'a bakmak yeterli degil, o yalnizca niyeti gosteriyor.
  Duzeltme: `claude plugin install <ad>@claude-code-plugins --scope project`.
  Yeni kurulan eklentiler ANCAK BIR SONRAKI OTURUMDA devreye girer.

- 2026-08-09 — `security-guidance`, `claude-mem` ve `gstack` kuruldu ve test
  edildi. Konteyner gecici oldugu icin `~/.claude` altina kurulanlari geri
  getiren bir `SessionStart` hook'u yazildi:
  `.claude/hooks/eklentileri-kur.sh`.
- 2026-08-09 — gstack'in Playwright'i chromium-1208 ariyor ama
  `cdn.playwright.dev` ag politikasiyla blokli. Konteynerdeki chromium-1194,
  1208'in bekledigi Chrome-for-Testing yerlesimiyle `/opt/pw-browsers` altina
  sembolik linklendi. Bu takla da hook'ta duruyor.
- 2026-08-09 — Yetenekler tek tek test edildi. Iki gercek ariza bulundu ve
  duzeltildi, biri ortam kisiti olarak birakildi. Ayrinti:
  `docs/eklenti-ekleme.md` → "Yetenek testi sonuclari".
  - claude-mem'in `smart_outline`/`smart_search` araclari **her** dosyada bos
    donuyordu: `tree-sitter-cli` binary'si hic inmemis. Hook'a indirme adimi
    eklendi. Hata mesaji ("unsupported language") yanilticiydi.
  - 17 gstack becerisinin ihtiyac duydugu `gh` CLI kurulu degildi; hook'a
    eklendi. GraphQL komutlari (`gh pr list/view`) proxy tarafindan blokli,
    REST (`gh api`, `gh pr diff`) calisiyor.
  - security-guidance'in LLM inceleme katmani bu ortamda calisamiyor:
    `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` yok. Desen taramasi (25 kural)
    calisiyor. Oturum kimligini env'e kopyalamak dogru olmaz diye
    dokunulmadi — karar kullanicinin.
- 2026-08-09 — Oturum kaydinin redaksiyonu tamamlandi. `gizlileri_maskele()`
  onceki oturumda yazilmisti ama **hic cagrilmiyordu** (code-review eklentisinin
  buldugu gercek acik). Artik uc cikti da maskeden geciyor: dokum `.md`, ham
  `.jsonl` ve `konusma-gunlugu.md` indeksi. Indeks ozeti maskelendikten sonra
  kirpiliyor, boylece yarim kalan bir anahtar sizmiyor.
- 2026-08-09 — Maskeleme, `temizle()` adinda tek kapiya donusturuldu:
  `gizlileri_maskele()` + yeni `kimlikleri_kisalt()`. Ikincisi `toolu_`/`msg_`/
  `req_` onekli ic kimlikleri kisaltiyor; sir degiller ama GitHub'in push
  korumasi onlari Stripe anahtari sanip push'u reddedebiliyor. Mevcut ham
  dokumler de ayni fonksiyonla temizlendi.
- 2026-08-11 — `no-ai-slop` becerisi `~/.claude` yerine **repoya** kuruldu
  (`.claude/skills/no-ai-slop/`). Deponun onerdigi `npx skills add --global`
  konteynerle birlikte silinirdi; repodaki kopya hook'suz kaliciysa tercih
  edilir. Bundan sonra tek dosyalik beceriler icin varsayilan yontem bu.
- 2026-08-11 — **Uygulama fikri belirlendi:** konum tabanli sosyal uygulama
  (arkadas bulma/ekleme, konum, sohbet). Platform gercek mobil uygulama olacak,
  web degil. Ayrinti ve acik sorular yukarida "Uygulama fikri" bolumunde.
- 2026-08-11 — Mobil karari geliztirme yerini de belirliyor: simulator, cihazda
  deneme ve magazaya yukleme bulut konteynerinden yapilamaz. Asil gelistirme
  kullanicinin kendi bilgisayarinda olacak; bu depo (CLAUDE.md, docs, hook'lar)
  klonla birlikte tasiniyor, `~/.claude-mem` veritabani tasinmiyor.
- 2026-08-14 — **Oturum kaydi bu makinede hic calismiyormus; duzeltildi.**
  Uc ayri ariza ust uste binmisti. (1) Python kurulu degildi; `python3` diye
  gorunen sey Microsoft Store'un kisayol taslagiydi ve "Python was not found"
  donuyordu. (2) Hook komutu `2>/dev/null || true` ile bitiyordu, yani hata
  yutuluyor ve kullaniciya hic gosterilmiyordu. (3) Oturumlar proje
  klasorunden degil `C:\WINDOWS\system32` icinden aciliyordu, bu yuzden
  `CLAUDE.md` de otomatik yuklenmiyordu. Yapilanlar: Python 3.12 kuruldu
  (winget, kullanici kapsami); hook komutu mutlak Python yoluna baglandi ve
  `args` (exec) bicimine cevrildi — artik kabuk devrede degil ve hata
  yutulmuyor; ayni hook `~/.claude/settings.json` icine de eklendi, boylece
  oturum hangi klasorde acilirsa acilsin kayit yaziliyor. Masaustune
  `Claude - cloud projesi.bat` kisayolu kondu. Kayip oturum dokumu
  transcript'ten geri uretildi: `docs/oturumlar/2026-08-14-0193031c.md`,
  213 tur. **Ders:** hata yutan bir hook, calismayan bir hook'tan daha
  kotudur; yeni hook'lara `|| true` eklenmeyecek.
- 2026-08-12 — **Yas politikasi degisti: alt sinir 16'dan 18'e cikti.** Veli
  onayi karmasikligindan kacinmak icin 16-17 yas bandi ve veli onayi akisi
  tamamen kaldirildi; tek yetiskin kullanici kitlesi var. Spec
  (`docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`)
  guncellendi: "Yas politikasi" bolumu, `profiller` tablosundaki `yas_bandi`
  alani ve "yakindakiler" sorgusundaki yas bandi filtresi kaldirildi.
- 2026-08-19 — **Bulut oturumlarinin hepsi kapatildi; tek oturumla, yalnizca
  kullanicinin kendi terminalinden devam edilecek.** Ayni anda acik duran
  15 bulut/kopru oturumu is parcalanmasina yol aciyordu (ayni is iki ayri
  dalda birikmisti: `claude/faz2b-guvenlik` ve
  `claude/burden-devam-edelim-ucxayd`, ikisi de `fc82f4d`). Bundan sonra
  tek calisma dali `claude/faz2b-guvenlik`.
- 2026-08-19 — **`.claude/settings.json` artik yalniz Windows'a gore
  ayarli; bulutta acilan oturumda bozuluyor.** Iki belirti: (1) `claude-mem`
  `enabledPlugins` icinde acik ama onu kuran `SessionStart` hook'u
  (`eklentileri-kur.sh`) settings.json'dan cikarilmis — Linux konteynerinde
  worker (port 37700) hic baslamiyor, eklentinin `UserPromptSubmit` hook'u
  ust uste basarisiz olup mesaji **bloke ediyor**. (2) `Stop`/`SessionEnd`
  oturum kaydi hook'lari `C:/Users/orcns/.../python.exe` yolunu gosterdigi
  icin bulutta hic calismiyor. Yerelde ikisi de dogru; sorun yalnizca
  bulut oturumu acildiginda cikiyor. Cozum: bulutta oturum acma.
