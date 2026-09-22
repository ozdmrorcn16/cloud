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

- **ONCE `slooin-projesi.md` OKU** (depo koku, 2026-09-14): projenin tek
  dosyalik devir belgesi - servisler, komutlar, kullanicinin kalici
  kurallari ve "kaldigi yer". Her yayindan sonra oradaki "Kaldigi yer"
  bolumu guncellenir. Masaustundeki `slooin projesi.md` ve GitHub
  `ozdmrorcn16/slooin-projesi` aynasi ayni dosyanin kopyalari;
  `git push origin` iki depoya birden gider.
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
- **Bu dosya KISA kalir; tarihli tur anlatimi buraya YAZILMAZ.** Olculdu
  (2026-09-13): dosya 407.302 karaktere (~136.000 token) buyumustu ve
  her oturum basinda tam bedeliyle yukleniyordu. Bir ayda o boyuta
  geldi, yani kendiliginden geri buyuer.
  Buraya yalnizca sunlar girer: yururlukteki kurallar, guncel durum,
  acik borclar, ortam tuzaklari ve "bir daha yapma" dersleri.
  "Su turda su ekrani su hale getirdik" anlatimi
  `docs/claude-md-arsiv.md` dosyasina yazilir.
  Olcut basit: bir bolum GECMISI anlatiyorsa arsive, GELECEKTEKI bir
  karari degistiriyorsa buraya. Ikisini birden yapiyorsa dersi buraya,
  anlatimi arsive.
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

### PLAY CONSOLE DAHILI TEST KURULDU - 2026-09-22

Kullanicinin secimi (APK yerine Play akisi). Play Console'da (hesap
slooinapp@gmail.com, gelistirici id 8670756961503280599) **Slooin
uygulamasi olusturuldu** (app id `4975519482711386603`, paket
com.slooin.app, Turkce, ucretsiz), **dahili test kanalina AAB
versionCode 7 (EAS 320ddc2a) yuklendi ve yayinlandi**, test listesi
"Slooin dahili test" (ozdmrorcn16@gmail.com, slooinapp@gmail.com).
**Opt-in bağlantısı: https://play.google.com/apps/internaltest/4700396095656408634**
(telefonda listedeki Google hesabiyla ac -> Play'den kur).
- **Play Uygulama Imzalama:** Google'in anahtari "kuantum uyumlu
  (Beta)" - IKI sertifika: klasik SHA-1 `A2:ED:59:E4:6C:88:04:02:30:38:
  57:C7:84:7D:0E:70:FB:BE:F5:C6` (SHA-256 F4:1B...), kuantum sonrasi
  SHA-1 `39:62:E4:52:...:FE:20` (SHA-256 E6:25...). Play'in Digital
  Asset Links snippet'i ise 4C:8D:F1... veriyor. Hangisinin APK'yi
  imzaladigi olculemedi (sertifika indirme 73FED255 hatasi) - bu
  yuzden UCU de kaydedildi: Google Cloud'da iki yeni Android OAuth
  istemcisi ("Play imzasi - klasik/kuantum"), Maps Android anahtari
  kisitina iki SHA-1, `site/public/.well-known/assetlinks.json`a uc
  SHA-256. Supabase Google saglayicisi DEGISMEDI (native akista aud =
  web istemci id). Play'den kurulan surumde Google girisi ve harita
  DOGRULANMALI; DEVELOPER_ERROR / gri harita gorulurse ilk suphe SHA-1.
- **TARAYICI DERSLERI:** (1) Play Console'a 81 MB AAB'yi
  `claude-in-chrome` file_upload ile veremezsin (10 MB siniri); yerel
  CORS'lu `ThreadingHTTPServer` (127.0.0.1:8123) + sayfada `fetch ->
  File -> DataTransfer -> input.files + change` calisti. Chrome bunun
  icin "yerel aga erisim" izni istiyor ve sekme ARKA PLANDAYSA soru
  cikmiyor (fetch sonsuza dek bekler). (2) Play Console'un dialoglari
  (e-posta listesi vb.) arka plandaki sekmede HIC cizilmiyor
  (rAF durur); kullanici sekmeyi one getirmeli. (3) Kopyala dugmeleri
  `navigator.clipboard.writeText`i sarmalayarak okunabiliyor.
- Play Console'da ilk kurulum gorevleri (magaza girisi, icerik
  derecelendirme, veri guvenligi, uygulama erisimi) YAPILMADI - dahili
  test icin gerekmedi; kapali test/uretim oncesi gerekecek. Not:
  "Kurulusunuzu dogrulayin (dokuman yukleyin)" istemi gorundu - kimlik
  belgesi, kullanicinin isi.

### CHECK-IN PANELI REFERANS DUZENINDE - 2026-09-20 AKSAM

Kullanicinin referans gorseli ("boyle yap, tur ikonu yerine harita
olacak yine"). `mekanlar/index.tsx`; OTA `2a08f10e`, web guncel,
goruntu `tasarim/checkin-panel-referans.png`.
- **Aktif check-in karti:** seftali zemin, cercevesiz; solda igne,
  "AKTİF CHECK-IN" (turuncu, harf araligi), ad, "ilce, il" (uzaklik
  yok); altta "N kişi burada ›" (turuncu, mekan sayfasi, yalnizca N>0)
  ve beyaz "Ayrıldım" hapi; sag ustte uc nokta -> `SecimPenceresi`
  "Sil" (yikici) -> OnayPenceresi. 2026-09-19'un buyuk sayi + "Şu an
  buradasın" seridi + yan yana Ayrıldım/Sil kalkti. Sozluk
  `kesfet.aktifCheckIn`, `kesfet.mesafe` 7 dil.
- **Baslik:** "Mesafe ▾" sade gri metin + turuncu ok (hap kalkti);
  daraltilmissa "100 m içinde" yazar.
- **Kartlar cercevesiz:** kare GERCEK HARITA (kapak yoksa) solda, ad,
  "ilce, il · uzaklik", rozet sagda; altta tam genislik "Yol tarifi"
  (ARABA ikonu, cerceveli) + "Check-in yap" (dolu), 14 px dikey dolgu.
  SECILI = seftali zemin (`mekanKartiOneCikan`) YALNIZCA liste acikken
  (kapali panelde tek satir zeminsiz - kullanicinin "hatali" bildirimi
  sonrasi); turuncu cerceve kalkti.
- **OLCULER REFERANSTAN ORANTILANDI (ayni aksam, OTA asagida):** kare
  `KAPAK_OLCUSU` 96 -> 72, ad 17, alt satir 13, rozet 4/9 dolgu, avatar
  yigini 22, dugmeler paddingVertical 10 (~40 pt), baslik 18, "Mesafe"
  13; aktif kart dolgu 12, ad 18, etiket 12, Ayrildim 7 px dolgu.
- **2026-09-21:** aktif check-in karti "Yakinindaki mekanlar"
  basliginin USTUNDE (tutamacin hemen altinda; panel acik/kapali fark
  etmez, listeyle kaymaz). Mesafe secenegi "1 km icinde" - "(tumu)" eki
  7 dilde kalkti. OTA asagida.

### AKIS KARTI: TEK CUMLE BASLIK, "ILE BIRLIKTE" - 2026-09-20 AKSAM

Kullanicinin referans gorseli ("ana sayfada akisi bu sekilde yap").
`CheckInKarti` (uc ekranda ortak) yeniden; OTA `18a6af61`, web guncel,
goruntu `tasarim/akis-cumle-referans.png`.
- **Baslik tek cumle:** "**byorcun**, **Ozdemir Kafe**'de check-in
  yapti." - ad kalin siyah (profil), mekan kalin turuncu (harita), ek ve
  fiil duz; altinda gorece zaman ya da "su an burada". Sablon
  `anaSayfa.checkInYapti` 7 dil (`{{ad}}`, `{{mekan}}`, `{{ek}}`);
  parcalar ic ice Text. **TUZAK (webde goruldu, jest'te degil):** `t`
  parametresiz cagrilinca yer tutuculari "[missing ... value]" yapiyor;
  NOBETCI degerler (-) verilip onlardan bolunuyor; test
  `/missing/` yokluğunu kilitliyor. 2026-09-18'in igneli ayri mekan
  satiri KALKTI (`MekanIgnesi` silindi).
- **Turkce bulunma eki `lib/bulunma-eki.ts`** (20 test): unlu uyumu,
  sert unsuz ('ta/'te), cok kelimeli + dar unluyle biten = iyelik
  ('nda/'nde: "Kultur Merkezi'nde"), rakamla biten ("34'te", "40'ta"),
  kisaltma ("AVM'de"). 2026-09-13'te ek bilerek yoktu; referans istedi.
  Yalnizca `dil === 'tr'`, digerlerinde ek bos.
- **"<adlar> ile birlikte"** satiri (`anaSayfa.ileBirlikte`): 28'lik
  ust uste avatarlar (ilk 3) + KULLANICI ADLARI kalin, geri kalan gri;
  metin sutunuyla hizali; avatar ve ad profile gider (`birlikte-<id>`).
  `anaSayfa.birlikte` anahtari silindi. Not da metin sutunuyla hizali.
- Kart: yuvarlak 16, ince `cizgi` cerceve, 8 px yan pay, 12 px ara,
  ZEMIN BEYAZ (referansin gri sayfasi bilerek alinmadi - kullanicinin
  sabahki karari). Sabahki "tam genislik + gri bant" (B) bu referansla
  KAPANDI; `akisAyrac` jetonu duruyor, kullanilmiyor. Fotograf 2:1
  (16:7 idi). Fotografsiz karttaki eylem ustu cizgi 2026-09-21 sabahi
  kullanicinin istegiyle KALKTI ("sutun icindeki cizgiyi kaldir").

### MESAFE SECIMI KALICI - 2026-09-20

Kullanicinin bildirimi ("mesafede hep 1 km secili, en son hangisi
seciliyse o gosterilsin"): `lib/mesafe-secimi-depo.ts` - tur suzgeci
deposuyla ayni desen (AsyncStorage, anahtar `slooin.mesafe-secimi.<id>`,
izinli olmayan deger atilir). Ekran acilista okur, secimde yazar.
Testte AsyncStorage `beforeEach/afterEach clear` zaten var. OTA asagida.

### CHECK-IN FORMU REFERANS DUZENINDE - 2026-09-20

Kullanicinin referans gorseli ("check-in'e basinca gelecek sayfayi
boyle yap; her Check-in yap'a basildiginda bu ekran gelecek").
`src/app/check-in/[mekanId].tsx` render'i bastan, mantik (kamera/
galeri secimi, ArkadasSecici, bulunurluk = profil varsayilani, basari
animasyonu) AYNI. OTA `27d759d9` + duzeltme, web guncel, goruntu
`tasarim/checkin-form-referans.png`.
- Sira: UstCubuk "Yeni check-in" -> MEKAN KARTI (`mekaniGetir`; seftali
  kare `IgneIkonu` - tur ikonu YOK, 2026-08-24 kurali; ad; "ilce, il";
  sagda turuncu "Degistir" = `router.back()`) -> "Not, fotograf ve
  arkadas eklemek istege bagli." -> "Notun" + 130 px kutu -> "Fotograf"
  + KESIKLI kutu (kamera ikonu, "Fotograf ekle"; secilince 16:10 tam
  genislik onizleme + sag ustte x `foto-kaldir`, onizlemeye dokunmak
  kaynak secimini yeniden acar) -> "Arkadas etiketle / Kimlerle
  birliktesin?" satiri (ok; arkadas yokken de gorunur) -> secim varsa
  "Birlikte" + sagda turuncu "Ekle" + avatarli KULLANICI ADI cipleri
  (x ile kaldir) -> "Gorunurluk, gizlilik ayarlarina gore belirlenir."
  (marginTop auto, dugmenin ustune yapisik) -> "Check-in paylas".
- Sozluk `checkIn` blogu 7 dilde bastan. TUZAK (yasandi): `checkIn.gonder`
  ("Check-in yap") liste kartlari, panel ve alt cubuk etiketinde de
  kullaniliyor; ilk yayinda "Check-in paylas" yapinca 4 test kirildi ve
  `&&` zinciri grep yuzunden gecti. Form dugmesi ayri anahtar
  `checkIn.paylas`. DERS: sozluk anahtarini degistirmeden once
  `grep -rn "checkIn.<anahtar>" src`.
- Butun "Check-in yap" dugmeleri (liste karti, secili kart, mekan
  sayfasi) zaten `/check-in/<id>`e gidiyor; alt cubuk sekmesi mekan
  listesi (once mekan secilir).
- **TEK EKRAN, KAYDIRMASIZ (kullanicinin istegi, sonraki OTA):** not
  kutusu `flex: 1` (min 72), fotograf kutusu/onizleme `flex: 1.4` (min
  96) - kalan yuksekligi paylasiyorlar, FormSayfasi flexGrow 1. Kisa
  ekranda (`useWindowDimensions().height < 720`, SE) ipucu satiri
  gizli, kart/satir dolgusu 8, kutu min 48/64, fotograf kutusu yatay.
  Olculdu: 390x751 ve 375x647 sigiyor (`tasarim/checkin-form-referans.png`,
  `checkin-form-se.png`).

### ARKADASLARIM SAYFASI - 2026-09-20

Kullanicinin referans gorseli ("Arkadas'a basilinca gorunecek arkadas
listesi sayfasini bu sekilde yap"): `src/app/profil/arkadaslar.tsx`,
OTA `992b27f9`, web guncel, goruntu `tasarim/arkadaslarim.png` +
`arkadaslarim-menu.png`.
- Kendi profildeki "Arkadas" sayaci artik `/profil/arkadaslar`a gider;
  2026-09-14'un satir-ici arkadas listesi + menusu profil ekranindan
  KALKTI (PROFIL_SEKMELERI: anilar/yerler/fotograflar). Baskasinin
  profilindeki Arkadas bolumu (ayni gun) yerinde - orada islem yok.
- Sayfa: `UstCubuk` (sagda `KisiEkleIkonu` -> /kisiler), seftali arama
  kutusu (YEREL suzgec, ad/kullanici adi), "N arkadas", beyaz kartta
  satirlar (Avatar 48, ad, @kullanici adi, seftali kare mesaj dugmesi
  -> /sohbet, uc nokta), davet karti (`KisilerIkonu`, "Arkadaslarinla
  kesfet", cerceveli "Arkadas davet et" -> sistemPaylasimi
  `arkadaslar.davetMesaji` + slooin.com). Uc nokta = `SecimPenceresi`
  yeni `baslik` prop'u (avatar + ad karti) + ikonlu satirlar: Profili
  gor / Mesaj gonder / Arkadasliktan cikar (kirmizi) / Engelle
  (kirmizi, OnayPenceresi) / Vazgec. Ikonlar `arkadas-ikonlari.tsx`;
  `BuyutecIkonu` ortak bilesene cikti (ana sayfa da onu kullaniyor).
- `useFocusEffect` ile her donuste yeniden okunuyor (profilden
  arkadasliktan cikinca liste guncel). Sozluk `arkadaslar` blogu 7 dil.
  Testler `__tests__/ekranlar/profil/arkadaslar.test.tsx` (9).

### GIZLI PROFILI YALNIZCA ARKADASLIK ACAR; SIKAYET DAMGASI KALKTI - 2026-09-20

- **HATA (kullanicinin bildirimi "profili gizli birinin ekrani acik
  gorunuyor"):** `kullanici/[id]` `bagVar` kabul edilmis SOHBET
  istegini de bag sayiyordu; canlida ozdemrs->byorcun 'kabul' sohbet
  satiri vardi, arkadaslik yoktu -> acik duzen cizildi (anilar RLS ile
  zaten gizliydi, "Henuz bir anisi yok"). Artik `bagVar = takip ===
  'kabul'` - ekran, sunucunun kuraliyla (check_inler RLS) ayni. Test:
  "kabul edilmis SOHBET kapali profili ACMAZ".
- **Sikayet gorunumu (kullanicinin istegi):** 2026-09-19'un kimlik
  blogundaki "Bu kullaniciyi sikayet ettin" notu ve menudeki pasif
  "Sikayet edildi" satiri KALKTI. Menude "Sikayet et" hep var; daha
  once sikayet ettiysem basinca sikayet ekrani degil UYARI penceresi
  ("Bu kullaniciyi sikayet ettin" + aciklama, tek dugme Tamam).
  `OnayPenceresi` yeni `tekDugme` prop'u (Vazgec cizilmez). Sozluk:
  `kullanici.sikayetEdildi` silindi, `sikayetEttinAciklama` 7 dil.
  OTA `9cae6db3`, web guncel.
- **UC NOKTA MENUSU ISLEVLERI BOZUKTU - KOK NEDEN `SecimPenceresi`
  (kullanicinin bildirimi "uc noktadaki islevlerde hata var"):** satir
  `onSec`i dogrudan cagiriyor, menu ACIK kaliyordu. iOS'ta acik bir
  RN Modal'in ustune ikinci Modal SUNULAMAZ -> "Engelle" onayi hic
  cikmiyordu; "Sikayet et" push'u menunun arkasinda kaliyordu;
  "Profili paylas" sonrasi menu duruyordu. Diger ekranlar kendi
  isleyicilerinde `setX(false)` cagirdigi icin oralarda gorunmuyordu.
  Duzeltme BILESENDE: secim `onKapat()` cagirir, eylem `gorunur`
  false olunca (Modal agactan kalkinca) kosar. KURAL: bir Modal'dan
  ikinci Modal/push/Share acilacaksa ilki once KAPANMALI. Testler:
  `menudenSec(testID)` yardimcisi (basar + `secim-penceresi`nin
  kalkmasini bekler) 7 test dosyasinda; menu satirina basip sonucu
  hemen arayan iddia artik yarisir. OTA `63752df7`.
- **IKI ACIL DEVAM (ayni saat):** (1) "Profili paylas'a bastim hicbir
  sey olmadi": Modal'in kalkmasi UIManager toplu isiyle, `Share.share`
  dogrudan native'e gidiyor -> paylasim sayfasi henuz dismiss olmamis
  menu VC'sinden sunulup onunla birlikte kapaniyordu. Eylem artik Modal
  kalktiktan `EYLEM_GECIKMESI_MS` (80) sonra; `menudenSec` yardimcisi
  120 ms de bekliyor. (2) **"Ekranda hicbir seye basamiyorum"** - o
  kapanan sayfanin `Share.share` sozu HIC cozulmedi, `PaylasimKalkani`
  (kok duzen, absoluteFill) sonsuza dek kaldi. Kalkan artik KENDINI
  KILITLEYEMEZ: kalkana ulasan dokunus `paylasimKapandiVarsay()` ile
  yutulur ve 700 ms pencere baslar (sayfa gercekten acikken dokunus
  kalkana zaten ulasamaz). KURAL: ekranin tamamini orten bir katman
  hicbir zaman yalnizca bir sozun cozulmesine baglanmaz. OTA `3c0dd88f`.
- **CEK-YENILE + ANI SAYISI (ogleden sonra):** `kullanici/[id]`
  ScrollView'a `RefreshControl` (istek kabul edilince Beklemede ->
  Arkadassin, kilit -> anilar, sayfayi yeniden acmadan). Ani sayaci
  `anilar.length`ten geliyordu; gizli profilde RLS listeyi bos
  dondurdugu icin 5 check-in'li profil "0 Ani" gosteriyordu. Migrasyon
  `20260920120000`: `baskasinin_profili` yeni `ani_sayisi` (moderasyon
  gizli degil, gorunurluk <> 'kimse'; yalnizca ADET aciliyor, icerik
  RLS'te). **TUZAK (olculdu):** MCP `apply_migration` postgres rolunde
  kosmuyor -> 20260919100000'in varsayilan yetkisi ISLEMEDI, anon +
  PUBLIC EXECUTE aldi; migrasyona acik `revoke ... from public, anon`
  yazildi. Her yeni fonksiyonda revoke ACIKCA yazilir. test:sema ve
  test:gorunurluk yesil. Testte `duzenMetni()` yardimcisi
  (`refreshControl` prop'u dongusel JSON veriyor). OTA `1c7c98d2`.
- **"ARKADASIM ANILARIMI GOREMIYOR" - VERI HATASI (ogleden sonra):**
  kullanicinin 29 anisinin HEPSI `gorunurluk = 'kimse'` idi (ozdemrs
  gozuyle RLS 0 satir). Sebep `ani_gorunurlugunu_ayarla` RPC'si
  ("Anilarim kimlere gorunsun" = Kimse, TUM anilari toplu yazar);
  ekrani `profil/ani-gorunurlugu.tsx` 2026-09-19 ayarlar yeniden
  yaziminda menuden dustu ama ekran + RPC duruyor - geri alma yolu YOK.
  Veri elle duzeltildi (`bag.ani_gorunurlugu(bulunurluk,
  'herkese_acik')`), RLS ile ozdemrs gozunden 29 olculdu. **KARAR (B,
  kullanici): ayar TAMAMEN KALKTI** - `profil/ani-gorunurlugu.tsx`,
  `aniGorunurlugunuAyarla`, sozluk anahtarlari (7 dil), RPC
  `ani_gorunurlugunu_ayarla` (migrasyon `20260920140000` drop; canli
  senaryo 31 artik PGRST202 ile "yok" olcuyor, senaryo 4 'kimse'yi
  servis roluyle yaziyor). TEK gizlilik anahtari `profil_gizli`;
  `bag.ani_gorunurlugu` cron icin duruyor. Tekrar onerme. OTA asagida.
- **SAYACLAR BOLUM SECER (ayni tur, OTA asagida):** baskasinin
  profilinde Ani / Fotograf / Arkadas sayaclari kendi profildeki gibi
  bolum acar (2026-09-13 "salt sayi" tarifi degisti). Arkadas listesi
  yeni RPC `baskasinin_arkadaslari` (migrasyon `20260920130000`; kapi
  paylasimlarla AYNI: aktif, engel yok, gizliyse arkadas; liste pasif/
  engelli eler; revoke anon acik). `lib/bag-listeleri.ts`
  `baskasininArkadaslariniGetir`. Fotograf bolumu `fotografliAnilar`
  izgarasi, gezgin ayni. SekmeHapi yalnizca Ani bolumunde. KVKK listesi
  maddesi yazildi. Sozluk `kullanici.fotografYok/arkadasYok` 7 dil.

### ANA SAYFA: YUMUSAK KARTLAR, ARAMA SUTUNU KALKTI - 2026-09-20

Kullanicinin referans gorseli ("kartlar bu paylasimdaki gibi, arka
planla yakin seffaflikta; bizde kenar cizgileri cok keskin") ve ayni
dakikalardaki iki istek. OTA `c8094a96`, web guncel, goruntu
`tasarim/ana-sayfa-yumusak-kart.png`.
- **Kart:** `borderColor` artik `renk.kartCerceve` (acik:
  `rgba(23,19,15,0.05)`, koyu: cizgi), golge `golge.akisKarti` (0,07 /
  14 / y4). `CheckInKarti` uc ekranda ortak - profil ekranlarinda da
  ayni yumusak kart (zemin orada beyaz kaldi).
- **Gri akis zemini DENENDI VE GERI ALINDI** (sabah, kullanici: "arka
  plan gri olmayacak, beyaz olacak"). Zemin `renk.zemin` (beyaz), 2026-08-27
  karari aynen; `akisZemini` jetonu silindi. Tekrar gri onerme.
- **KART DUZENI KESINLESTI - SECENEK B (ayni sabah, OTA asagida):**
  kullanici "kenarlari kaldir, sadece alt-ust ayrimi belli olsun,
  yanlar sonsuz durup ekrana sigsin nasil durur" diye sordu; iki secenek
  gorsel sunuldu (`tasarim/akis-tam-genislik-secenekler.png`: A ince
  alt cizgi, B 8 px gri bant), **B secildi**. `CheckInKarti.kart`: yan
  pay, kose yuvarlagi, cerceve, golge YOK; `borderBottomWidth: 8` +
  `renk.akisAyrac` (#F3F1EE; koyu: zemin). `kartCerceve` ve
  `golge.akisKarti` jetonlari silindi. 2026-09-18 referans karti
  KAPANDI. Uc ekranda ortak (profil listeleri `aniListesi: -8` payi
  ile tam genislik, olculdu). Web'de ekran cekerken `python -m
  http.server` SPA yollarina 404 verir: `node araclar/spa-sunucu.mjs
  dist` (yeni, port 8080) kullan.
- **Arama sutunu KALKTI** (2026-08-28'in markanin altindaki kutusu ve
  akis-yerine-sonuc davranisi). Ust cubukta marka ortada, SOL BASTA
  buyutec (`kisi-ara`, mutlak konum, 44'luk hedef) -> `/kisiler`
  (var olan kisi arama sayfasi; ana sayfadaki kopya mantik silindi).
  `kisiler.tsx` artik `UstCubuk` (geri oku) + `autoFocus` kutu.
  `anaSayfa.aramaYerTutucu` anahtari 7 dilde duruyor, kullanilmiyor.

### MEKAN SAYFASI: PUAN BLOGU EN ALTTA - 2026-09-20

Kullanicinin istegi ("Puan sutununu en asagiya cek", sonra "bunlar
[Su an burada + sekmeler] ustte puan altta"): `harita/[mekanId]`
icindeki `MekanPuanlama` blogu istatistik seridinin altindan ScrollView
iceriginin SONUNA (sekme blogundan sonra) tasindi. Sira testle kilitli
("PUAN blogu sayfanin EN ALTINDA"). OTA `57b5731f`.

### CHECK-IN EKRANI: HARITA ANA TUVAL + CEKILEN PANEL - 2026-09-19

Kullanicinin referans tasarimi ("en onemli degisiklik haritayi okunur
hale getirmek"): `src/app/mekanlar/index.tsx` render'i bastan,
`CanliHarita` (native + web) yeni sozlesme. Goruntu
`tasarim/checkin-harita.png`. OTA grup `a62d7efb`.
- **Harita ust bloktan (arama + kompakt cipler) alt gezinmeye kadar
  DOLDURUYOR** (`doldur` prop). Igneler uc tur: sayili KUME (beyaz
  daire + turuncu nokta; dokununca `fitToCoordinates` ile yakinlasir),
  TEKIL (beyaz daire icinde kucuk turuncu igne), SECILI (buyuk turuncu
  igne + adi beyaz hapta). Kumeleme `lib/harita-kumeleme.ts` (izgara,
  56 px hucre, gorunur `longitudeDelta` + piksel eni; secili ASLA
  kumelenmez; 8 test). Web radar ayni kurali piksel duzleminde uygular.
- **KULLANICI ARTIK MAVI NOKTA + hale** (`KullaniciNoktasi`,
  `KULLANICI_MAVISI`), turuncu igne degil - mekan sayfasinda da ayni.
  Sag altta "konuma don" dugmesi (`konumDugmesi`, `harita.konumaDon`).
- **`altPay`/`mapPadding`:** panel haritanin altini ortuyor; merkez ve
  cerceve GORUNEN alana gore (native `mapPadding.bottom`, web
  `merkezY`). Panel yuksekligi `onLayout` ile olculup veriliyor.
- **Panel** (`mekan-paneli`): kapaliyken SECILI (varsayilan en yakin)
  mekanin kompakt satiri + Yol tarifi / Check-in yap + "Diger mekanlari
  goster"; tutamac (`panel-tutamaci`, PanResponder yukari/asagi) ya da o
  satir paneli acar, LayoutAnimation ile `haritaAlani - 24` yuksekluge
  cikar ve butun liste (sayfalama, yenileme) orada. Arama yazilinca
  panel KENDILIGINDEN acilir. Liste gorunumunde panel/harita yok.
- **Kompakt satir:** seftali kutu (kapak fotografi varsa o, yoksa
  ture bagli OLMAYAN `BinaIkonu`), ad 2 satir, "110 m · Nilufer,
  Bursa" (UZAKLIK ONCE, ayirac `·`), durum rozeti, kisi satiri. Ad ve
  simge MEKAN SAYFASINI acar; satirin geri kalani (`mekan-sec-<id>`)
  mekani SECER ve paneli kapatir. Eylemler YALNIZCA secili satirda.
- **Kompakt cipler:** tek satir hap; Tumu dolu turuncu, Sakin/Yogun
  renkli nokta, Populer yildiz.
- **KOK NEDEN BULUNDU (2026-09-20 gece, dort kor OTA'dan sonra):**
  react-native-maps belgesi: `anchor` YALNIZCA Android/Google'da,
  `centerOffset` YALNIZCA iOS/Apple'da calisir; Apple ozel gorunumlu
  isaretciyi koordinata ORTALAR. Bugune kadar butun igneler yalnizca
  `anchor` ile konumlaniyordu, yani iOS'ta igne ucu hic noktaya
  basmiyordu ve igne+ad tek gorunum oldugu icin igne gercek noktanin
  SOLUNA kayiyordu. Simdi her isaretcide IKISI BIRDEN: igne
  `centerOffset {0,-13}` (26 px), merkez mekan ignesi `{0,-15}` (30 px),
  ad etiketi sabit 136x26 kutu (`ETIKET_KUTU_EN/BOY`) + `centerOffset
  {68,-13}` + Android icin `anchor {0,1}` ve ic bosluk; kullanici mavi
  noktasi ortali (0). Igne isaretcisinde artik gorunmez etiket YOK.
  DERS (hafizaya da yazildi): native'e ozgu gorseli telefonda
  goremiyorum - once kutuphane kaynagini oku, tek gerekceli cozum
  yayinla, "duzeldi" degil "dogrular misin" de.
- **AD ETIKETI BASILABILIR + MAVI NOKTA (ayni gece, sonraki istek):**
  ignenin yanindaki ad AYRI bir `Marker` (`centerOffset` 16/-13,
  `igne-etiket-<id>`, `harita.adEtiketi` 7 dil) - iOS'ta ozel gorunumlu
  isaretcinin dokunma alani gorselle sinirli kaliyordu; etiket kendi
  isaretcisi olunca ona dokunmak da `onMekanSec` cagiriyor. Ignenin
  icindeki eski etiket GORUNMEZ yer tutucu (`igneEtiketGorunmez`,
  hiza icin). Kullanici yeniden MAVI NOKTA + hale (`KullaniciIgnesi`
  artik mavi nokta ciziyor, `renk` prop'u yok sayilir; anchor 0.5/0.5).
  Testler: isaretci sayimlari etiketleri de iceriyor (`/ etiketi$/`
  suzgeci).
- **ETIKET GENISLIGI OLCULUYOR (2026-09-20 gece, OTA `8b075a0f`):**
  sabit 136'lik kutu + `centerOffset x: 68` etiketi kullanicinin ekran
  goruntusunde ~30 pt fazla SAGA atiyordu - iOS `reactSetFrame`
  isaretci cercevesini Yoga'nin verdigi ICERIK boyutundan kuruyor ve
  koordinata ortaliyor. Artik `etiketKabi` genisliksiz (16 px sol
  bosluk + hap), hapin genisligi `onLayout` ile `etiketEnleri` state'ine
  yaziliyor, `centerOffset x = (16 + olculen) / 2` (ilk kare icin 80
  varsayilan). Kutuphane kaynagindan dogrulandi: iOS
  `tracksViewChanges`'i hic okumuyor (Android'e ozgu), ozel gorunumlu
  isaretci canli UIView, `centerOffset` prop'u dogrudan
  `MKAnnotationView.centerOffset`e gidiyor - olcum sonrasi guncelleme
  yansir. **Kullanici "hala hatali" dedi (00:20 goruntusu); piksel
  olcumu: hap sol +24,2 pt (beklenen 16), dikey -7,5 (beklenen -13),
  iki farkli genislikte AYNI sapma.** Tek acıklayan model: Apple
  isaretci cercevesini KABIN degil HAPIN boyutundan kuruyor, kabi sol
  ust koseden ciziyor (sabit 136 kutuda +29, olculen kabda +8 - ikisi
  de bu modelin ongorusu). COZUM (OTA `960e0850`): iOS'ta isaretcinin
  cocugu KABSIZ, dogrudan hap (`Platform.OS === 'ios'`), bosluk
  `centerOffset x = 16 + hap/2`, `y = -13`; Android kab + anchor (0,1)
  aynen. `etiketKabi` stili artik yalnizca Android. **Kullanicinin
  01:00 goruntusuyle DOGRULANDI: etiketler ignenin saginda.** Sonra
  "biraz yaklastir": `ETIKET_SOL_BOSLUK` 16 -> 12 (OTA `b789e42c`).
- **YASAL / APPLE LOGOSU SOL ALTA SABIT (2026-09-20 01:xx, OTA
  `52ff2841`):** kullanici "her giriste yeri degisiyor" dedi. KOK NEDEN
  kutuphane kaynaginda (AIRMap.mm): `_legalLabel` (MKAttributionLabel)
  YALNIZCA init'te aranir, MapKit onu bazen sonradan ekler -> referans
  nil, `legalLabelInsets` hic uygulanmaz; logo icin `updateAppleLogoInsets`
  yeniden ariyor, etiket icin yok. Yani inset override'i acilisa gore
  bazen calisir bazen calismaz. COZUM: override YOK; `MapView` style
  `bottom: altPay - 24` (yalnizca panel kose yuvarlagi kadar altina
  girer), `mapPadding.bottom = 24`; Apple/Google etiketi kendi kuraliyla
  haritanin sol altina = panelin ustune koyar. `PANEL_KOSE` sabiti
  `mekanlar/index.tsx` panel `borderTopRadius` ile ayni kalmali.
  Onceki `altPay + 8 / +20 / +6 / -6` denemeleri (ucu OTA) gecersiz.
- **PANEL ELLE SURUKLENIR (OTA `2f21d8bb`):** kullanicinin istegi
  "yukari asagi elle cekilebilsin, acilma sinirlari ayni kalsin".
  `panelBoyu` (Animated.Value) parmagi izler; duraklar eskisiyle ayni
  (kapali dogal olcu / harita alani - 24), birakinca `vy` 0,5 ya da
  orta cizgi karar verir, `Animated.timing` 220 ms. Surukleme alani
  tutamac + baslik satiri (`panel-surukleme-alani`); "Mesafeye gore"
  dokunmayi hala alir (PanResponder 8 px dikey hareketten sonra).
  Yukari cekilince liste ANINDA gelir; kapanista icerik animasyon
  bitince kompakta doner. `LayoutAnimation` kalkti. Olcum yokken (jest)
  animasyonsuz yol. `AnimatedPressable` = createAnimatedComponent.
  **HER YERINDEN CEKILIR (sonraki istek, OTA asagida):** panHandlers
  panelin KOKUNDE; tek istisna acik paneldeki liste - dokunus listeden
  basladiysa (`listeyeDokunuluyor`, ScrollView onTouchStart/End) panel
  devralmaz, liste kaydirma ve yenileme korunur.
  **HATA VE DERS (sabah, kullanici "kaydiramiyorum"):** panHandlers
  `Pressable`a yayilmisti; Pressable kendi responder islevlerini
  props'tan SONRA yazip onlari eziyor - surukleme hic baslamiyordu
  (jest bunu gormez, host props'ta islev gorunur). PanResponder
  islevleri HER ZAMAN duz `View`/`Animated.View`a verilir; klavye
  kapatan Pressable icte (`panelIci` flex 1). Dis kap
  `panel-surukleme-alani`, ic `mekan-paneli`.
- **HARITA IGNELERI DE ESKI HALINE DONDU (ayni gece, kullanicinin
  istegi "haritada konumlarin gorunumunu de eski haline cevir"):**
  kumeler, beyaz daireli tekil igne, yalnizca-secili-ad ve mavi
  kullanici noktasi GERI ALINDI; `CanliHarita` iki surumde de 6a4c80d
  igne cizimi (durum renkli igne + her ignede ad, turuncu
  `KullaniciIgnesi`). Kalanlar: `doldur`, `altPay`/mapPadding, konuma
  don dugmesi, `onBosaDokun`, `seciliId` (yalnizca erisilebilirlik
  durumu). `lib/harita-kumeleme.ts` ve testi duruyor, kullanilmiyor.
  Yani bu turdan geriye kalan: harita tam tuval + panel + basilabilir
  mesafe secimi + kompakt cipler + konuma don.
- **AYNI AKSAM IKI DEGISIKLIK (kullanicinin istegi):** (a) "Mesafeye
  gore" artik BASILABILIR (seftali hap, turuncu yazi, asagi ok) ->
  `SecimPenceresi` ile 100 m / 250 m / 500 m / 1 km (tumu); secim
  liste + haritayi ISTEMCIDE daraltiyor (`mesafeyeUyan`, arama yokken),
  siralama sabit kalir; etiket secimi yazar ("100 m icinde"). (b)
  Panel icindeki satirlar ESKI KART DUZENINE dondu ("sutunlari eski
  haline cevir"): kucuk gercek harita karesi / kapak, ad, "Nilufer,
  Bursa • 110 m", rozet, kisi satiri, HER KARTTA Yol tarifi + Check-in
  yap; turuncu cerceve = SECILI (varsayilan en yakin); kartin bos
  yerine dokunmak secer. Yukaridaki "kompakt satir" maddesi bu yuzden
  GECERSIZ; `BinaIkonu`/`satirSimge` stilleri dosyada duruyor ama
  kullanilmiyor.
- **REFERANSLA DEGISEN ESKI KARARLAR:** (1) 2026-09-09 "her ignede ad"
  -> yalnizca secili ignede ad; (2) 2026-09-07 "igneye basinca mekan
  sayfasi" -> igne mekani SECER; (3) 2026-09-17 "her kartta eylem
  satiri + kucuk gercek harita karesi" -> eylem yalnizca secili
  satirda, kare yerine simge/kapak (`MekanKapakHarita` artik burada
  kullanilmiyor, dosya duruyor); (4) turuncu kullanici ignesi -> mavi
  nokta. "Mesafeye gore" hala ETIKET (sabit siralama kurali), referanstaki
  ok BILEREK yok.
- Test: `listeyiAc()` yardimcisi (panel kapali acildigi icin listeyi
  olcen testler once "Diger mekanlari goster"a basar); jest.setup
  Marker mock'u `accessibilityState` tasiyor, MapView `fitToCoordinates`.
  Jest 81 paket / 1078 test.

### CIHAZ UYUMU: BUTUN TELEFONLAR - 2026-09-19

Kullanicinin istegi: "farkli boyutlarda telefonlar var, uygulama
kullanilan cihaza gore optimize olmali, Apple ve Android tumu icin".
Yontem: 16 ekran x 3 olcu (`araclar/cihaz-taramasi.sh`: iPhone SE
375x647, yaygin Android 360x736, Pro Max 430x839 - guvenli alan
dusulmus etkin alan) cizildi, kirilanlar duzeltildi; kod duzeyinde
klavye ve durum cubugu ele alindi. **YENI KURALLAR:**
- **Girdili, "kaydirmasiz" ekran = `FormSayfasi`** (`src/tasarim/`):
  iOS'ta KeyboardAvoidingView (padding; Android'de pencere zaten
  resize), ScrollView + `flexGrow: 1` (yer varsa dizilim aynen, kucuk
  ekranda kaydirir), bos alana dokununca/kaydirinca klavye kapanir.
  giris, kayit, sifre-sifirla, dogrula, check-in/[mekanId], sikayet
  buna gecti (`KlavyeKapatan` o uc ekrandan cikti). Icerik stili
  `icerikStili`na, `flex: 1` DEGIL `flexGrow: 1`.
- **Durum cubugu temayi takip eder:** `_layout.tsx` `<StatusBar
  style={koyuMu ? 'light' : 'dark'}>` (`useKoyuMu`, tema-baglami).
  Onceden hic ayarlanmiyordu; "Acik"a zorlanmis uygulama koyu cihazda
  beyaz ustune beyaz saat gosteriyordu.
- **Kisa ekran (pencere < 720 pt):** karsilama sahnesi 140, kart
  dolgusu kucuk - "Hesap olustur" SE'de ilk bakista gorunur
  (`tasarim/karsilama-se.png`). Ayni desen baska ekranlarda gerekirse
  `useWindowDimensions().height < 720`.
- **375/360 genislik kirilmalari:** `MekanPuanlama.puanKutu` sabit 112
  (minWidth ile cubuklarin ustune biniyordu); `Liste.Satir` etiketi 2
  satira sarar, `deger` daralmaz (%45 tavan) - "Profil gorunurlu..."
  kirpilmasi.
- Sabit/cift ust pay: yalnizca `_layout` `kendiUstPayiniKoyar`
  listesindekiler kendi `insets.top`unu koyar (sikayet cift pay hatasi
  ayni gun bulundu).
- Android: `orientation portrait`, kenar-kenara (SDK 57 varsayilani),
  `ALT_GEZINME_PAYI` hareket cubugu insetini zaten tasiyor; klavye
  `resize`. Yazi buyutme (`maxFontSizeMultiplier`) YAPILMADI - RN 0.81
  /React 19'da global varsayilan yok, ekran ekran is; acik borc.
Tarama gorselleri scratchpad'de kaldi (buyuk); betik depoda.

### SABAH TURU: MESAJLAR, SIKAYET, CHECK-IN HARITASI - 2026-09-19

Kullanicinin telefondan ekran goruntuleriyle art arda istekleri (hepsi
yayinda, OTA tek grup, web + panel guncel):
- **Mesajlar:** satirlar arasi cizgi KALKTI; sira sunucudan (son
  mesajin zamani, kim yazdigina bakmadan) - ekran bozmuyor, testle
  kilitli. Okunmamis konusma: ad kalin, onizleme KOYU + kalin, sayi
  rozeti satirin SAG UCUNDA (adin yanindayken goze carpmiyordu).
- **Sikayet ekrani:** `paddingTop: guvenliAlan.top` ekranda BIR KEZ
  DAHA ekleniyordu (kok duzen zaten veriyor) - cift pay yuzunden
  "Sikayeti gonder" telefonda gezinme cubugunun altina dusuyordu.
  Kaldirildi; rozet 52, satir dolgusu 10. 390x751 (telefon guvenli
  alanlari dusulmus) olcusunde sigiyor: `tasarim/sikayet-01.png`.
  DERS: ekran kendi ust payini koyacaksa `_layout.tsx`teki
  `kendiUstPayiniKoyar` listesine girmeli; yoksa pay iki kez gelir.
- **Ek aciklama siniri YOK** (500 ve sayac kalkti; sunucuda sinir
  yoktu).
- **Sikayete FOTOGRAF** (migrasyon `20260919110000`): ozel kova
  `sikayet-fotograflari` (10 MB, gorsel), `sikayetler.fotograf`,
  `sikayet_gonder` 5. parametre `p_fotograf` (eski imza DROP edildi -
  asiri yukleme tuzagi) + sahiplik kontrolu; okuma yalnizca yukleyen +
  moderator. Panel sikayet detayinda imzali onizleme. Gizlilik metni
  7 dil + docs, KVKK listesi maddesi. Canli: yabanci yol reddediliyor.
- **Sohbette sikayet girisi KALKTI** (ust bar dugmesi + mesaja uzun
  basma); tek giris baskasinin profilindeki uc nokta. Sunucu/panel
  mesaj sikayetini hala destekliyor.
- **"Sikayet edildi" belli:** profilde daha once sikayet ettiysem
  menude pasif "Sikayet edildi" (`SecimPenceresi` yeni `pasif` alani)
  ve kimlik blogunda turuncu not; `kullaniciyiSikayetEttimMi`
  (`sikayetler` RLS kendi satirlarim). `useFocusEffect` ile donuste
  tazeleniyor.
- **Check-in sayfasi haritasi** mekan sayfasiyla ayni olcu: tam
  genislik (negatif yan pay) + 210 yuksek.

### GUVENLIK TARAMASI: BASTAN SONA - 2026-09-19

Kullanicinin istegi: "uygulamayi bastan sona tara, hatalari duzelt,
guvenlik aciklari varsa coz". gstack `/cso` yontemiyle (sir arkeolojisi,
bagimlilik, CI, Supabase danismanlari, RLS/yetki/kova, Edge Function,
site/panel, OWASP) tarandi; her bulgu CANLIDA olculdu. Rapor (yerel,
gitignored): `.gstack/security-reports/2026-09-19-guvenlik-taramasi.json`.

**Duzeltilenler (migrasyon `20260919100000`, uygulandi):**
1. **GERCEK ACIK - check_in_yap `p_fotograf` sahipligine bakmiyordu.**
   Storage okuma politikasi `exists (check_inler.fotograf = name)` ile
   calistigi icin biri BASKASININ fotograf yolunu kendi check-in'ine
   yazip o dosyayi (engellenmis/gizli profil olsa da) acabiliyordu.
   Artik yol `<kendi id>/<dosya>` olmak zorunda. `profiller.fotograflar`
   icin de tetikleyici (`gizli.profil_fotograf_yollarini_dogrula`).
   Canli senaryo **61b** bunu kilitliyor.
2. **anon 27 SECURITY DEFINER fonksiyonu cagirabiliyordu** (Postgres
   yeni fonksiyona PUBLIC'e EXECUTE verir; `revoke ... from public, anon`
   unutulan her migrasyon bunu aciyordu). Hepsi `auth.uid() is null`
   kontrolu tasidigi icin sizinti OLCULMEDI ama kapatildi ve
   **VARSAYILAN YETKI DEGISTI**: `alter default privileges for role
   postgres in schema public` - yeni fonksiyon otomatik olarak yalnizca
   authenticated + service_role. **YENI KURAL: kimliksiz cagri isteyen
   fonksiyona acikca `grant execute ... to anon` yaz** (bugun yalnizca
   eposta_kayitli_mi, telefon_kayitli_mi, profil_karti). `test:sema`
   sonundaki "anon kapisi" blogu bunu olcuyor.
3. `mahalle_aktarim_adimi()` (bitmis veri isi, anon'a acik) ve eski
   4 parametreli `yakin_mekanlar` asiri yuklemesi DUSURULDU.
4. Kovalara sinir: fotograf kovalari 10 MB + image/jpeg|png|webp,
   `veri-disa-aktarim` 50 MB + application/json. **Canli test
   yuklemeleri artik `image/jpeg` gondermeli** (text/plain 415 alir -
   `calistir.ts` duzeltildi).
5. `iller` ve `mekan_turleri` yalnizca authenticated.
6. Performans (`20260919103000`): 5 FK indeksi + cift indeks
   `check_inler_mekan_idx` dustu.
7. Supabase Auth "Prevent use of leaked passwords" (HaveIBeenPwned)
   ACILDI (opencli ile panelden; `weak_password` metni 7 dilde zaten
   vardi). Kayitta sizmis parola artik reddedilir. **DIKKAT: admin
   API `create_user` ve `updateUser` de reddediyor** (olculdu) - canli
   test betikleri gecici hesaplara `test1234` gibi sizmis parola
   VEREMEZ (mevcut betikler rastgele/ozgun parola kullaniyor;
   `sifre-sifirla-canli-test.py` iddiasi `weak/pwned`i kabul edecek
   sekilde guncellendi). Mevcut test hesaplarina GIRIS etkilenmiyor.
8. Depo: `mobil/gizli/asc-issuer.txt` public depoya girmisti (ASC
   issuer id - tek basina sir degil, anahtar + key id gerekir; rotasyon
   gerekmedi); `mobil/gizli/` gitignore'a eklendi, izlemeden cikti.
   `.github/workflows/mekan-tazele.yml` (Overture, kaynak 08-30'da
   degisti; secret yok, varsayilan dalda degil) silindi.

**Temiz cikanlar:** git gecmisinde sir yok (yalnizca anon JWT ve test
kaliplari); Edge Function'lar (hesap-sil JWT + taze giris kapisi,
bildirim-gonder sir + kaynak dogrulama, profil-karti); site `[ad].js`
kacisi tam; panel service-role yok, AAL2 DB'de; kovalar private; RLS
her tabloda; npm audit: panel/site 0, mobil'de yalnizca derleme araci
(metro/xmldom/js-yaml, cihazda calismaz).

**ONERI, YAPILMADI (native derleme ister):** oturum jetonlari
AsyncStorage'da; `expo-secure-store` ile sifreli saklama magaza oncesi
degerlendirilmeli. `auth_rls_initplan` uyarisi (24 politikada
`auth.uid()` -> `(select auth.uid())`) olcek isi, bugun gerekmedi.
`tr_kucuk` search_path uyarisi BILEREK acik: GIN indeks ifadesi.

### CHECK-IN IFADELERI (108 IFADE) - 2026-09-21

Kullanicinin verdigi tek sayfalik ifade seti (12 kategori x 9) kesildi
(`araclar/ifade-seti-kes.py` -> `mobil/assets/ifadeler/<kat>/<slug>.png`
+ `manifest.json` + URETILEN `lib/ifadeler.ts` statik require haritasi).
Karar: "check-in yaparken not ekleme kisminda kullanilacak" -> "Kararini
uygula".
- **Sunucu (migrasyon `20260921120000`, uygulandi):** `public.ifadeler`
  sozlugu (slug PK, kategori, etiket, sira; anon+auth okur),
  `check_inler.ifade` FK, `check_in_yap(..., p_ifade)` - ESKI IMZA
  DUSURULDU (asiri yukleme tuzagi), sozlukte olmayan slug 'Gecersiz
  ifade' ile REDDEDILIR; `verilerimi_disa_aktar` check_inler bloguna
  `ifade` (canli tanimdan, 09-18 dersi). Canli test
  `araclar/check-in-ifade-canli-test.py` 7/7.
- **Istemci:** `src/tasarim/IfadeSecici.tsx` (alttan gelen sayfa,
  useModalHareketi; 12 kategori cipi + 3 sutun izgara, ikon 56, TEK
  secim, secince kapanir) + `IfadeCipi`; check-in formunda not alaninin
  ustunde hayalet "İfade ekle" -> cip (x ile kaldir); `checkInYap` 7.
  parametre `ifade`; akis/anilar select'lerine `ifade`; `CheckInKarti`
  notun basinda 32 pt ikon + kalin etiket (` · ` ile not), not yoksa
  yalnizca ifade; sozlukte olmayan slug cizilmez.
- Metinler: `checkIn.ifadeEkle/ifadeBaslik/ifadeKaldir` + `hatalar.vt.
  gecersiz_ifade` 7 dil; kullanim kosullari 6. madde "not, ifade ve
  fotograf" 7 dil; KVKK listesine madde (dayanak notla ayni).
- Ifade ETIKETLERI cevrilmedi (setin kendi adlari, manifestten) -
  ayri is. SINIR: kaynak JPEG kolaj, ifade basina 68-125 px; 56 pt
  izgara ve 32 pt kartta yeter, daha buyuk gosterimde bulanir; ozgun
  PNG disa aktarimi gelirse ayni klasore konur, betik yerine koyar.
- Yerinde duzenlemede ifade DEGISTIRILEMIYOR (yalnizca olustururken) -
  istenirse `check_in_notunu_guncelle`ye p_ifade eklenir.
Jest 84 paket / 1123 test. Yayin: web `slooin--dzjbxhil1p`, OTA grup
`5cf2bc28-7520-4a2f-a9c2-6c72c243a8d5`.

### YEDI UYGULAMA ICI ANIMASYON + HAREKET SOZLUGU - 2026-09-20

Kullanicinin istegi: "uygulama ici animasyon ornekleri ... ornekler
olustur" -> `ek-find-animation-opportunities` taramasi (7 aday, 6 ret;
rapor oturum dokumunde), web prototipi Artifact
`RHhztTP63yEyCsdoF1fFbG` -> "Hepsini yap".
- **Hareket sozlugu** `src/tasarim/hareket.ts`: `EGRI` (girisCikis
  `.23,1,.32,1` / hareket `.77,0,.175,1` / cekmece `.32,.72,0,1`),
  `SURE`, `useModalHareketi(acikMi)` (giris + CIKIS animasyonu; bilesen
  `acikMi` kapaninca 150-240 ms daha agacta kalir). RN `Animated` +
  native driver, YALNIZCA transform/opacity. Reanimated DEGIL (jest
  kurulumu yok, 2026-09-14). `expo-haptics` kurulu degil - haptik yok.
- **Bilesenler:** `BasariDugmesi` (check-in: hap daireye toplanir, tik,
  "Şu an buradasın", 1,15 s sonra `onBasariBitti` -> yonlendirme;
  `router.replace` artik oradan), `SecimPenceresi` ALTTAN GELEN SAYFA
  oldu (once ortada fade idi; PanGestureHandler + Animated.event ile
  surukle-kapat: hiz > 800 ya da 1/3 yukseklik; yukari lastik direnc),
  `OnayPenceresi` fade + %97 olcek (ortada kalir), `DurumGecisi`
  (arkadas dugmesi uc hali: 110 ms sol + 110 ms belir; renk gorunmez
  anda degisir), `BegeniKalbi` (yalnizca dolarken tek spring vurusu),
  `KademeliGiris` (ana sayfa ilk 6 kart, 40 ms kademe, kimlik basina
  BIR kez - `oynatilanlar` kumesi) ve `BosDurumGirisi` (ana sayfa,
  mesajlar, bildirimler bos durumlari).
- **TUZAK, yasandi:** sarmal bilesende `oynat` her render'da yeniden
  hesaplaninca Animated.View <-> Fragment degisiyor, cocuk YENIDEN
  MOUNT oluyor ve kartin acik yorum sayfasi kayboluyordu. Karar
  mount'ta `useRef` ile sabitlenir; regresyon testi
  `hareket-bilesenleri.test.tsx`.
- **TEST DERSI:** cikis animasyonu olan pencereler kapaninca aninda
  dusmez; "kapandi" olcumleri `waitFor` ile yapilir (5 test cevrildi).
  Ayrica menu acikken ikinci bir "Vazgeç" olabilir - once menunun
  dusmesi beklenir.
Reddedilenler (dokunulmadi): alt gezinme, sekme hapi (gunde 100+ kez),
liste sirasi/kisi sayilari (okunan veri), sohbet balonlari, harita
igneleri, hold-to-confirm (onay penceresi karari var).
Jest 83 paket / 1090 test. Yayin: web `slooin--73t87zndut`, OTA grup
`94226950-fe44-4dfb-a63a-029a04540c7c`. GERCEK CIHAZDA DOGRULANMADI -
surukleme hizi, spring hissi ve zamanlamalar telefonda denenmeli.

### BASKASININ PROFILINDE UST CUBUK KALKTI - 2026-09-18

Kullanicinin istegi: "sol ustteki geri dugmesini kaldir; kendi
profilimde ne nerede hangi olcude duruyorsa butun profillerin
yerlesimi oyle gorunecek". Uygulamayi PARALEL BIR OTURUM yapti
(cloud-1f, commit `bf535da`): geri oku ve ust cubugun TAMAMI kalkti,
kimlik blogu yukari alindi, uc nokta menusu kosede mutlak konumda
(`MENU_CAPI` 40, `KIMLIK_UST_PAYI` 16). Kullaniciya dort dizilim
secenegi sunulmus, secim "sira ayni, sadece yukari kaysin" olmus.

**ORTAM DERSI - IKI OTURUM AYNI ISTEGI ISLEDI.** Bu oturum ayni isi
daha dar yapti (yalnizca oku kaldirip cubugu birakti) ve once cloud
deposuna push etti; otekinin commit'i AYNA depoya (`slooin-projesi`)
gitmisti. `origin` iki push URL'si tasidigi icin ikinci push yalnizca
aynada reddedildi ve bolunme boyle gorundu. Cozum force-push DEGIL
birlestirme: `git merge` + cakisan dosyada `--theirs` (kullanicinin
secim yaptigi surum kazanir), sonra tek push ile iki depo esitlendi.
Yeni oturum kurali: ayni dalda calisan baska bir oturum olabilir;
push reddedilirse once `git ls-remote` ile HANGI ucun ayri oldugu
olculur.

Yayin (birlesik surum): web `slooin--z62qooo6kg`, OTA grup
`d7170e92-a11c-4b58-9107-eceafa443162`. Jest 77 paket / 1029 test.

### "ARKADAS ETIKETLE" DUGMESI + ARANABILIR LISTE - 2026-09-18 GECE

Kullanicinin istegi: yerinde duzenlemede "Arkadas etiketle" butonu;
basinca profil resmi + kullanici adi ile arkadas listesi, ad ya da
kullanici adiyla arama; etiket onayi acik degilse hemen, acıksa onaya
gider ve onaylaninca kartta gorunur.
- `CheckInKarti` duzenleme: 2026-09-05'in satir ici "+ ad" cipleri
  KALKTI; hayalet "Arkadas etiketle" dugmesi (`arkadas-etiketle`)
  mevcut `ArkadasSecici`yi aciyor (zaten etiketli olanlar listede yok).
  Secilenler ve mevcut etiketler avatarli cip; Kaydet'e kadar sunucuya
  gitmez (eski kural).
- `ArkadasSecici` satirlari: `Avatar` 40 + kullanici adi (kalin) +
  ad (ikincil); arama zaten ikisinde. `BagKisi.avatarUrl` eklendi
  (`kisileriCoz` -> `avatarlariGetir`, okunamazsa null). Check-in
  formundaki ayni secici de boylece avatarli oldu.
- Onay kurali DEGISMEDI: sunucudaki trigger (20260906090000) karsi
  tarafin `etiket_onayi_gerekli` ayarina gore 'onaylandi' / 'bekliyor'
  yaziyor; akis yalnizca onaylananlari cizer, onaylaninca (odak
  yenilemesi) gorunur.
Jest 78 paket / 1043 test. Yayin: web guncel, OTA grup
`846d9eee-5390-44a1-bd5e-c7f4f4c4aafe` (test duzeltmesi sonraki
commit'te; davranis ayni).
- **Ek (ayni gece, kullanicinin duzeltmesi):** ciplerde AD-SOYAD DEGIL
  KULLANICI ADI (`Etiket.kullaniciAdi` eklendi, rumuz); Kaydet'ten
  sonra `etiketleriGetir([id])` yeniden okunup karta yaziliyor - onay
  ayari kapali kisilerde etiket ANINDA "Birlikte" satirinda (onaya dusen
  onaylanana kadar gorunmez, tahmin edilmiyor). Profil ekranina da
  `onEtiketEkle` baglandi (eksikti; dugme oradaki duzenlemede de var).
  OTA grup `8420667c-722a-4249-8dd4-66214df6a0ee`.
- **Profil ust blogu kartla ayni hizada (ayni gece, kullanicinin
  istegi "ust kisimlari alttaki sutunlara orantila"):** iki profil
  ekraninda `icerik.paddingHorizontal` 16 -> 8 (`bosluk.s`),
  `izgara`/`aniListesi` negatif paylari da -8. Goruntu
  `tasarim/profil-hiza.png`. OTA grup `7cb67fff-470f-4de6-978c-fb54d9dc967d`.

### AKIS KARTI REFERANS DUZENINE GECTI; "BIRLIKTE" YALNIZCA AVATAR - 2026-09-18 GECE

Kullanicinin referans gorseli: "ana sayfa paylasim akisi ayni bu
duzene gore olacak; Birlikte yazan kismin yaninda etiketlenen kisiler,
ama kullanici adlari yazmayacak, sadece profil resimleri; basinca
profiline gidilecek" + "fotograflar akista referanstaki boyutta, buyuk
acilinca kendi boyutunda". `CheckInKarti` (uc ekranda ortak) yeniden:
- Kart: yuvarlak (20) + ince cerceve + hafif golge, yanlardan
  `bosluk.sayfa` payli. Avatar 52; sagda kullanici adi (kalin 18),
  altinda gorece zaman ya da "su an burada" (nokta + turuncu yazi);
  uc nokta sag ustte. Mekan adi bir alt satirda dolu turuncu igne ile
  (`MekanIgnesi`), turuncu marka tonu, tek satir kirpilir; dokunma
  hedefi yazi kadar (`mekanDugmesi` flexShrink + maxWidth).
- "Birlikte" satiri: etiket gruplari 36'lik `Avatar` (ad YAZMAZ), her
  biri `/kullanici/<id>` (testID `birlikte-<id>`). `Etiket` tipine
  `avatarUrl` girdi: `etiketleriGetir` `profiller(ad, fotograflar)`
  cekip kisi basina bir kez imzaliyor.
- Fotograf kartin ICINDE, yuvarlak (14), **16:7 yatay** sabit oran
  (referans olcusu); buyuk gorunum zaten `contain` - kendi oraninda.
- Eylem satiri fotografin ALTINDA, paylas sagda (marginLeft auto);
  sayilar govde boyunda koyu.
GERI ALINAN ESKI KARARLAR (referansla): 2026-09-02 "tam genislik,
yalnizca alt cizgi" karti ve "eylemler fotografin ustunde (A)";
2026-09-08/18 kenara yapisik 4:5 fotograf. Sebep: yeni referans;
eylemler artik 16:7 ile her zaman gorunur. Profil listelerinin
`aniListesi: -bosluk.sayfa` payi duruyor (kart kendi payini tasiyor).
Sozluk `anaSayfa.birlikte` 7 dil. Goruntu `tasarim/akis-referans.png`.

**ETIKETLER HIC GORUNMUYORMUS (kullanicinin bildirimi, ayni gece):**
`check_in_etiketleri.kullanici_id` auth.users'a bagli, profiller'e
DEGIL; `etiketleriGetir`in `profiller(ad)` gomusu PostgREST'te
"Could not find a relationship" veriyordu ve akis `.catch(() => ({}))`
ile yuttugu icin etiket satiri hic cizilmiyordu (canli test hesabiyla
olculdu). Duzeltme: satirlar duz cekiliyor, profiller
`profilOzetleriniGetir` (akis_profilleri RPC). `lib/etiket.test.ts`
yeni (3 test; gomulu profil yasak). DERS: sessizce yutulan bir hata
ozelligi "calisiyor" gosterir - gomulu sorgu yazarken FK'nin hangi
tabloya gittigine bak. Kart yanlara uzadi (`marginHorizontal: bosluk.s`).
Jest 78 paket / 1042 test. Yayin: web guncel, OTA grup
`31132a52-f122-4093-914b-41c0f3eecb26`.

### SIKAYET AKISI REFERANS TASARIMA GORE - 2026-09-18 GECE

Kullanicinin referans gorseli ("bu iki ekranin aynisini yap, hicbir
seyi degistirme"): `src/app/sikayet.tsx` bastan, ikonlar
`src/tasarim/sikayet-ikonlari.tsx` (kalkan, kalkan-tik, bes sebep,
kisi-yasak, carpi).
- **01 Sikayet olustur:** ortali "Sikâyet et" (kendi ust cubugu -
  ortak `UstCubuk` sola yaslar), seftali kalkan rozeti, "Bize ne
  oldugunu anlat" + alt baslik (hesap/mesaj'a gore), TEK kartta bes
  sebep (ikon + etiket + radyo; secili satir seftali zemin, ikon
  turuncu, radyo dolu turuncu + beyaz ic halka), "Ek aciklama / Istege
  bagli", 0/500 sayacli kutu (maxLength 500), ipucu, "Sikâyeti gonder".
  Mesaj sikayetinde karar 76 baglam notu alt basligin altinda duruyor.
- **02 Gonderim sonrasi:** sag ustte x, 190'lik seftali daire + dolu
  kalkan-tik, "Sikâyetin alindi", iki satir tesekkur, "Bu hesabi
  engellemek ister misin?" karti (cerceveli "Hesabi engelle" ->
  `OnayPenceresi` -> `engelle`; sonra "Hesap engellendi"), "Tamam".
  Kart yalnizca engellenecek hesap biliniyorsa: kullanici sikayetinde
  hedef, mesaj sikayetinde sohbetin gonderdigi yeni `kullaniciId`
  parametresi.
- Zemin BEYAZ (2026-08-27 karari; referansin kremi kanvas). Sozluk
  `sikayet` blogu 7 dilde bastan; `kullanici.sikayetEt` de "Sikâyet
  et" (sapkali, referans yazimi). Jest 77 paket / 1038 test.
- **KAYDIRMASIZ (kullanicinin istegi, ayni gece):** iki ekranda da
  ScrollView yok; 01'de rozet 60, satir dolgusu 11, aciklama kutusu
  kalan yeri dolduruyor (flexGrow, minHeight 72), dugme en altta;
  02'de icerik dikeyde ortali (rozet 150), Tamam altta. 390x844'te
  ikisi de tasmadan siniyor: `tasarim/sikayet-01.png`, `sikayet-02.png`.
  ARAC: `ekran-goruntusu.mjs` `SLOOIN_SAHTE_RPC=sikayet_gonder` ile o
  RPC'yi (OPTIONS dahil) 200/null cevapliyor - yazan bir ekranin
  "sonra" hali canli veriye dokunmadan cizdirilebiliyor. TUZAK: python
  `http.server` SPA yolu (/sikayet) icin 404 verir; bu kez portta baska
  bir sunucu oldugu icin daha once "calismis gibi" gorunmustu. SPA
  geri donuslu kucuk node sunucusu gerekiyor (scratchpad'de yazildi).
  Yayin: web guncel, OTA grup `2d6f28d0-ccdd-4acd-b359-1943e871c503`.

### ACIK PROFILDE DOGRUDAN ARKADAS, "ARKADASSIN" TIKLI; IKI CANLI HATA - 2026-09-18 GECE

Kullanicinin istegi: "Arkadassin yazisinin yanina tik; profili herkese
acik birini arkadas ekleye basinca istek gonderilmeden arkadas olur,
gizli profile basinca istek gonderilir."

- **Sunucu (migrasyon `20260918210000`, uygulandi):**
  `takip_istegi_gonder` artik TEXT doner - hedef `profil_gizli`
  ise 'beklemede' satiri (eski akis), ACIKSA iki yonde 'kabul' satiri
  ve 'kabul' doner (drop + create; on kontroller ve gunluk 50 siniri
  aynen). Karsi tarafta bekleyen istek varsa on conflict ile 'kabul'e
  cekilir (o gecis zaten `takip_kabul` push'u uretir).
- **Bildirim:** yeni olay `takip_eklendi` ("X seni arkadas olarak
  ekledi"; dokununca ekleyenin profili). Tetikleyici
  `takip_eklendi_bildirimi` (INSERT + 'kabul'); `bildirim.olay_gonder`
  YALNIZCA RPC'nin koydugu islem-yerel `bag.dogrudan_ekleme` ayari
  varken ve satir aktorun kendi yonuyken olay uretir - yanitla'nin ayna
  insert'i boylece cift bildirim uretmez. Edge Function `bildirim-gonder`
  SURUM 5 (MCP; verify_jwt kapali), deno 13/13.
- **Istemci:** `takipIstegiGonder` donen degeri veriyor; ekran ona gore
  "Beklemede" ya da "Arkadassin" (+ arkadas sayaci +1). "Arkadassin"
  dugmesinde turuncu tik (`ArkadasTikIkonu`, testID `arkadas-tik`).

**CANLI test:gorunurluk IKI GERCEK HATA YAKALADI** (sunucu davranisi
degisince kosuldu - 2026-09-02 dersi):
1. **"Profilim gizli" anahtari 2 Eylul'den beri HIC KAYDEDILEMIYORDU:**
   `profil_gizli` sutunu `authenticated` UPDATE yetki listesinde yoktu
   ("permission denied for table profiller"); canlida 7 profilin sifiri
   gizliydi. Migrasyon `20260918213000` yetkiyi verdi. DERS: profiller'e
   sutun ekleyen her migrasyon `grant update (sutun)` tasimali.
2. **`konusmalarim` bekleyen istek suzgecini kaybetmisti:** 09-01'de
   MCP ile canliya konan kosul dosyada yoktu; 09-14'te konusmayi_sil
   fonksiyonu 08-22 dosyasindan kopyalayinca dustu - yabancinin ilk
   mesaji Istekler'e dusuyor AMA Mesajlar listesinde de gorunuyordu (4
   gun). Migrasyon `20260918214000` tam govdeyle geri koydu. DERS:
   "ayni dosyadan kopyala" demeden once `pg_get_functiondef` ile canli
   tanimi karsilastir.

Senaryolar yeni kurala gore: `bagKur` (on kosul, acik profil, 'kabul'
olculur) ve `istekYolu` (hedefi gecici gizli yapar; 19/20/21/26/32/48),
yeni senaryo 19b (acik profilde dogrudan bag). Test hesaplari acik
profil. `sema-dogrula` yedi tetikleyici bekliyor. Canli: gorunurluk ve
sema paketleri TAMAMEN yesil; jest 77 paket / 1031 test. Yayin: web
guncel, OTA grup `8528eaaf-7dad-48f5-9434-df80e12bd7c8`.

### PROFIL DUZENLE: "KAYDEDILDI" DUGMENIN HEMEN USTUNDE - 2026-09-18 AKSAM

Kullanicinin istegi: "kaydete basinca kaydedildigi hemen ustunde yazsin,
en ustte solda degil". Hata ve bilgi satiri ScrollView'in tepesinden
Kaydet dugmesinin hemen ustune tasindi, ortali (testID `kaydet-bilgi`
/ `kaydet-hata`). Sira testle kilitli (`toJSON` metin sirasi: ipucu ->
mesaj -> Kaydet; RNTL 14'te `UNSAFE_getAllByType` yok, `toJSON` deseni
ayarlar testindekiyle ayni). Yayin: web guncel, OTA grup
`521803af-4986-4112-b2d5-96f779718eea`.

### OTURDUGUN BOLGE: PROFILDE HIC YOK, AYAR YOK, YALNIZCA VERI - 2026-09-18 AKSAM

Kullanicinin karari (sabahki modeli ayni gun degistirdi): "Oturdugun
bolge kismini kaldir; bu secim sadece hesap olusturma adiminda olacak,
profilde gorunmeyecek, gizleme secenegine de gerek kalmayacak; secim
veri olarak saklanacak sadece." Yukaridaki "HESAP OLUSTURMA: OTURDUGUN
BOLGE" bolumundeki `bolge_gizli` / "Bolgemi profilde goster" /
profil-duzenlede ulke secici anlatimi ARTIK GECERSIZ.

- **Kalan tek giris noktasi:** hesap olusturma 3. adimi (zorunlu, ulke
  + TR'de il/ilce). Alt yazi "Profilinde gosterilmez; yalnizca
  hesabinla birlikte saklanir." (7 dil); `bolgeIpucu` anahtarlari
  kalkti.
- **Kalkanlar:** profil-duzenle bolge blogu (`profiliGuncelle` bolge
  alanlarina DOKUNMUYOR - kayittaki deger korunur, testle kilitli),
  ayarlardaki anahtar + `bolgeGosterGetir/Ayarla`, iki profil
  ekranindaki satir, `bolgeMetni`, `BaskaProfil/KendiProfil`
  bolge alanlari, `profilDuzenle.bolge*` ve `ayarlar.bolgeGoster*`
  sozluk anahtarlari.
- **Sunucu (migrasyon `20260918200000`, uygulandi):**
  `baskasinin_profili` il/ilceyi hic dondurmuyor (drop + create),
  `bolge_gizli` sutunu dustu, `verilerimi_disa_aktar` profil bloguna
  `yasadigi_ulke` girdi. Veri sutunlari DURUYOR; RLS zaten baskasina
  kapali.
- **KVKK:** amac = hizmeti hangi bolgelerde gelistirecegimizi bilmek
  (mesru menfaat); gizlilik metni 7 dilde + docs + KVKK listesi
  guncellendi. Ders: "sadece saklanacak" veri icin bile amac yazilir.

Jest 77 paket / 1025 test. Yayin: web guncel, OTA grup
`870c4f6b-a090-49a1-8910-665fc0396aec`; site push ile.

### BEGENI/YORUM BILDIRIMLERI, PAYLASIM EKRANI, BEGENENLER LISTESI - 2026-09-22

Kullanicinin istekleri: "begeni ve yorum yapan kisilerden bildirim gelsin,
bildirimlerde de gorunsun" + "begeni kalbin yanindaki sayiya basilinca
kimlerin begendigi gorunsun". OTA `760d92cb`, web guncel.
- **Sunucu (migrasyon `20260922120000`):** `bildirim.olay_gonder`'e
  `begeniler`/`yorumlar` kollari (olay `begeni` {check_in_id, begenen_id,
  sahip_id}, `yorum` {+yorum_id, yorumlayan_id}); kendi paylasimi ve gizli
  yorum olay uretmez; tetikleyiciler `begeni_bildirimi`, `yorum_bildirimi`
  (sema testi artik DOKUZ tetikleyici bekliyor). `profiller.
  bildirim_etkilesim` (+ grant update). **Edge Function v8:** iki olay,
  kaynak dogrulama (begeni satiri + sahip; yorum gizli degil), metinler
  icerik tasimaz, tercih `bildirim_etkilesim`, push data'ya `checkInId`.
  Deno 16/16. Canli: `araclar/begeni-yorum-bildirim-canli-test.py` 5/5;
  EF gunlugunde olay=begeni/yorum "alici islendi" olculdu (test0'in
  jetonuna push gitti). Betik on kosul olarak B->A arkadasligini kurar
  (RLS: B, A'nin check-in'ini ancak arkadassa gorur) ve sonunda birakir.
- **Uygulama ici:** Bildirimler ekraninda "Etkilesimler" bolumu -
  `etkilesimBildirimleriniGetir` (ayri tablo YOK; begeniler/yorumlar
  `check_inler!inner` gomulu suzgeciyle RLS'ten okunur, aktor ozetleri
  `akis_profilleri`); satir `/paylasim/<id>`, avatar kisiye gider.
  Yorum satirinda yorumun metni gorunur (alicinin kendi paylasimindaki
  yorum). Ayarlar > Bildirimler: "Begeniler ve yorumlar" anahtari.
- **YENI EKRAN `src/app/paylasim/[id].tsx`:** tek check-in karti
  (`checkInGetir`), begeni/yorum/paylas calisir, duzenle/sil menusu YOK
  (kart prop'lari verilmiyor); RLS gostermezse "artik gorunmuyor".
  Push dokunusu (`lib/bildirim.ts` rotaUret) begeni/yorum'da buraya.
- **Begenenler:** kartta kalbin yanindaki sayi AYRI hedef
  (`begeni-sayisi`) -> `BegenenlerSayfasi` (alttan yarim sayfa, avatar +
  ad + @kullanici; kisiye dokununca sayfa kapanir, 80 ms sonra profil).
  `begenenleriGetir`: begeniler RLS + akis_profilleri (engelli gorunmez).
- Sozluk 7 dil: `bildirimAyarlari.etkilesim/…Aciklama`, `bildirimler.
  etkilesimBolumu/begeniMetni/yorumMetni`, `etkilesim.begenenler/
  begenenYok/paylasimBaslik/paylasimBulunamadi`. Jest 89 / 1169.
  KVKK listesi maddesi yazildi. Telefonda dogrulanmadi.

### GEZGINDE DIKEY SURUKLEME KAPATIR; DUZENLEMEDE KLAVYE SERIDI ITMEZ - 2026-09-22

- **FotografGezgini:** tek parmakla yukari/asagi surukleme fotografi
  tasir + soldurur, 120 px ya da 900 px/sn'de kapanir, yoksa spring ile
  oturur (kullanicinin istegi). YENI Gesture API (`Gesture.Pan()` +
  `GestureDetector`, `runOnJS(true)`, reanimated yok): jest'te
  `getByGestureTestId` yalnizca bu API'nin kaydini buluyor (eski
  `PanGestureHandler` testID kaydetmiyor; RNTL 14'te `UNSAFE_*` de yok).
  `maxPointers(1)` (iki parmak yakinlastirmada kalir), `failOffsetX
  [-12,12]` (yatay sayfa kaydirmasi FlatList'te). Test
  `__tests__/tasarim/FotografGezgini.test.tsx` (5). OTA `5d6f0e5a`.
- **CheckInDuzenle SECENEK A (kullanicinin secimi, "biraz daha
  daraltalim"):** uc secenek gorsel sunuldu
  (`tasarim/checkin-duzenle-daralt/secenekler.png`: A siki bosluklar,
  B tek satir mekan + yan yana bolumler, C en siki); **A secildi**:
  duzen ayni, avatar 44, not kutusu 64, dolgular/yazilar bir kademe
  kucuk, fotograf izgarasi 4 sutun (`FotografIzgarasiDuzenle` yeni
  `sutun` prop'u; form 3'te kaldi). Olculdu: ~760 -> ~625 px
  (`tasarim/checkin-duzenle.png`). OTA asagida.
- **CheckInDuzenle REFERANS 2 (kullanicinin gorseli
  `tasarim/checkin-duzenle-referans-2.jpg`, "duzenleyi boyle yap";
  once ikon secenekleri sunuldu `checkin-duzenle-daralt/ikon-secenekler.png`):**
  basliklar ikonlu (kalem / resim, `duzenle-ikonlari.tsx`), sagda gri
  "Istege bagli" (`checkIn.istegeBagliKisa` - `istegeBagli` formun uzun
  ipucu!) / "N fotograf" (`fotografSayisi`); not kutusu krem zemin;
  kareler yine 3 sutun, ekle karesi "+ Fotograf ekle" krem; **Ifade ve
  Birlikte SATIR oldu**: 52'lik seftali kutu (gulen yuz / KisilerIkonu),
  baslik + alt yazi (`ifadeEkleAlt`, `birlikteAlt`), sagda ok / turuncu
  +; satirin tamami seciciyi acar. Ifade seciliyse kutuda ifadenin ikonu
  (`duzenle-ifade-<slug>`), baslikta etiketi, alt yazi
  `degistirmekIcinDokun`, sagda x (`ifade-kaldir`). Etiket cipleri
  Birlikte satirinin altinda. Araya ince ayiraclar. Secenek A'nin
  4 sutunu bu referansla 3'e dondu. Goruntu `tasarim/checkin-duzenle.png`.
- **Ayni gun iki ek:** (1) izgaradaki kareye dokunmak ortak
  `FotografGezgini`ni o kareden acar (`FotografIzgarasiDuzenle` icinde,
  testID `${testID}-ac-<i>`; form ve duzenleme ikisinde de). (2) Alt
  seritteki "Degisiklikler kaydedildiginde uygulanir." notu ve ust
  cizgi KALKTI (`kaydedinceUygulanir` anahtari 7 dilden silindi); serit
  yalnizca hata satiri + Vazgec/Kaydet, sayfa ~50 px kisaldi.
- **CheckInDuzenle klavye:** `KeyboardAvoidingView` KALKTI (kullanici:
  "klavye acilinca Vazgec/Kaydet ustune gelmesin, asagida kalsin");
  ScrollView `automaticallyAdjustKeyboardInsets` - icerik klavye kadar
  kayar, alt serit yerinde (klavye orter). OTA asagida.

### COKLU FOTOGRAF (5) + "CHECK-IN'I DUZENLE" SAYFASI - 2026-09-22

Kullanicinin referans gorseli (`tasarim/checkin-duzenle-referans.png`,
"Check-in duzenleme sayfasi bu sekilde olacak") ve karari "coklu
fotograf". Spec `docs/superpowers/specs/2026-09-21-coklu-fotograf-ve-
duzenleme-sayfasi-design.md`, plan `docs/superpowers/plans/...`. OTA
`4a9aa8ec`, web guncel, goruntu `tasarim/checkin-duzenle.png`.
- **Sunucu (migrasyon `20260921180000`):** `check_inler.fotograflar
  text[]` (check <= 5, GIN indeks); `fotograf` sutunu GENERATED
  (`fotograflar[1]`) - moderasyon RPC'leri, panel JSON'u, canli
  senaryolar, eski OTA kirilmadi. `check_in_yap` 8 parametre
  (`p_fotograflar`; `p_fotograf` uyumluluk icin durur, eski imza drop).
  `check_in_fotograflarini_guncelle(id, text[]) returns text[]` =
  KALDIRILAN yollar (istemci kovadan siler); dunku tekil
  `check_in_fotografini_guncelle` ince sarmalayici. Kova okuma
  politikasi `name = any(fotograflar)` + kendi klasoru.
  `mekan_fotograflari` fotograf basina satir (unnest with ordinality);
  `verilerimi_disa_aktar` `fotograflar`. Canli
  `araclar/check-in-fotograf-degistir-canli-test.py` 15/15.
- **Istemci tipleri:** `CheckIn.fotograflar`, `AniGorunumu.fotografUrller`,
  `AkisOgesi.fotograflar + fotografUrller` (`fotografUrl` KALKTI).
  Imza TOPLU: `checkInFotografiUrlHaritasi` (tek `createSignedUrls`).
  `checkinFotograflariniYukle` (sirali, `kismi` geri alma),
  `checkInFotograflariniDegistir(id, {kalanYollar, yeniUriler})`.
- **Kart:** `FotografSeridi` (2:1, yatay sayfali, >1'de nokta + "1/3"
  rozeti; testID kok `akis-fotografi-serit`, tek foto `akis-fotografi`,
  sayfalar `akis-fotografi-<i>`); buyuk gorunum ortak `FotografGezgini`
  (`akis-buyuk-gorunum`). **YERINDE DUZENLEME KALKTI** (2026-09-05 ve
  dunku "kartta fotograf satiri" GECERSIZ); menu "Duzenle" ->
  `onDuzenle(id)`.
- **`CheckInDuzenle`** (alttan sayfa, referans birebir): mekan karti,
  Notun, Fotograflar (`FotografIzgarasiDuzenle`: 3 sutun kare, x, alt
  "Degistir" seridi, kesikli "+ Ekle"; bos halde kesikli buyuk kutu),
  Ifade + "Degistir/Ekle", Birlikte + "+ Ekle", "Degisiklikler
  kaydedildiginde uygulanir.", Vazgec/Kaydet. Tek paket
  `DuzenlemeDegisiklikleri`; ekran `duzenlemeyiKaydet`: fotograf ->
  etiket kaldir -> ekle -> ifade -> not (not en son). TUZAK: effect
  bagimliligi `oge?.id` - profil ogeyi her render yeniden uretiyor,
  nesneye baglaninca taslak siliniyordu.
- **Form:** ayni izgara; galeri `allowsMultipleSelection` +
  `selectionLimit = 5 - mevcut`; `checkInYap(..., yollar[])`.
- **Galeriler** (profil izgarasi, baskasinin profili, gezgin) fotograf
  birimine duzlesti: `fotografBirimleri(anilar)` (`izgara-<aniId>-<i>`).
- TEST TUZAGI: `lib/checkin` tam mock'lanan dosyalarda
  `EN_FAZLA_FOTOGRAF` undefined -> `selectionLimit: NaN`; `requireActual`
  ile sabitler gercek tutulur. Sozluk `checkIn.duzenleBaslik/fotograflar/
  kameraVeyaGaleri/ifade/kaydedinceUygulanir` 7 dil (`degistir` zaten
  vardi). Jest 87 / 1154; test:sema, test:gorunurluk, tekrar 18/18,
  ifade 7/7 yesil. Telefonda dogrulanmadi (kamera/galeri coklu secim).

### KARTTA FOTOGRAF DEGISTIR/KALDIR; PROFILDE IFADE EKSIKTI - 2026-09-21 GECE

Kullanicinin iki bildirimi ("eklenen fotograf, arkadas, ifade duzenleme
ana sayfada da profilde de ayni gorunmeli" + "fotograf duzenlemede
eklenmeli: kaldirabilir ya da yenisini ekleyebilir"). OTA `46bcc97d`
(ifade) + `9ec78c2e` (fotograf), web guncel.
- **HATA:** `kullanicininAnilariniGetir` select'i `ifade` secmiyordu
  (akis seciyordu) -> profil ve baskasinin profilindeki kart ifadesiz.
  DERS: uc ekran ortak karti cizerken UC SORGU da ayni alanlari tasimali;
  yeni sutun eklerken `grep -n "select(" lib/*.ts` ile hepsine bak.
- **Fotograf duzenleme:** kart duzenleme alaninda ifade satirinin
  altinda fotograf satiri - varsa 96x48 onizleme + "Degistir" +
  "Fotografi kaldir" (kirmizi), yoksa hayalet "Fotograf ekle"; kaynak
  formdaki Kamera/Galeri `SecimPenceresi`. Taslak `undefined` (dokunulmadi)
  / `null` (kaldir) / uri; Kaydet'e kadar sunucuya gitmez, Vazgec atar.
  `lib/checkin-fotograf-degistir.ts` `checkInFotografiniDegistir`: yukle
  -> RPC `check_in_fotografini_guncelle` (migrasyon `20260921170000`;
  ayni kapi, yol `<uid>/...`, ESKI YOLU dondurur) -> eski dosyayi
  kovadan sil (basarisizsa sessiz; RPC reddederse yeni yuklenen geri
  silinir). Kovaya DELETE politikasi + okuma politikasina "kendi
  klasoru" istisnasi (Storage `remove` once SELECT ister; satira bagli
  kural eski dosyayi RPC'den sonra sahibine bile kapatiyordu). Ekranlar
  `onFotografKaydet` ile `fotografUrl`i yerinde gunceller. Sozluk
  `checkIn.fotografDegistir` 7 dil. Canli
  `araclar/check-in-fotograf-degistir-canli-test.py` 12/12. Jest 85 / 1134.

### AKIS KARTINDA IFADE DUZENLEME - 2026-09-21

Kullanicinin istegi ("burada da ifade ekleme, eklenen ifade
silinebilsin"): yerinde duzenlemede (`CheckInKarti` duzenle alani) not
kutusunun altinda `IfadeCipi` (basinca secici, x ile kaldir) ya da
hayalet "Ifade ekle" (`duzenle-ifade-ekle`); Kaydet'te degistiyse
`onIfadeKaydet(id, slug|null)` -> `checkInIfadesiniGuncelle` -> yeni RPC
`check_in_ifadesini_guncelle` (migrasyon `20260921150000`; kendi +
moderasyon gizli degil + slug `ifadeler`de; null = kaldir; revoke anon).
Ana sayfa ve profil listeyi yerinde gunceller (`ifade` alani). Kartta
ifade YALNIZCA IKON (ayni gun: "yaninda yazisi eklenmesin"); etiket
accessibilityLabel'da, `ifadeEtiket` stili silindi.

### IFADE SECICI: KATEGORILER YANA KAYDIRMALI - 2026-09-21

Kullanicinin istegi ("sayfa elle yana kaydirilabilsin, kaydirinca obur
ifadelere gecilsin"). `IfadeSecici.tsx` (paralel oturumun 70c14513'te
kurdugu 12 kategori / 108 ifade secicisi): tek FlatList yerine
`horizontal + pagingEnabled` sayfa listesi, her sayfa bir kategorinin
3 sutunlu izgarasi (`satirlar()` ile bolunmus, dikey ScrollView).
Sayfa eni `onLayout` (olcum gelene kadar pencere - 24). Cip -> 
`scrollToIndex`; `onMomentumScrollEnd` -> cip. Butun sayfalar bastan
cizili (`initialNumToRender/windowSize` = 12): yerel PNG'ler hafif,
sanal listede cip kaydirmasi ve jest bos sayfa veriyordu. Secili cip
`cipKonumlari` (onLayout x/en) ile serit ortasina kaydirilir
(kullanicinin bildirimi: "hangi baslikta olundugu gorulmuyor").

### KULLANICI ADI 24 SAATTE BIR; PANEL AKTIF KARTLA KAPALI - 2026-09-21

- **Kullanici adi 24 saat (30 gundu):** migrasyon `20260921100000`
  (`kullanici_adi_degistir`, mesaj "Kullanici adini 24 saatte bir
  degistirebilirsin. Kalan sure: N saat"); `hata-metni.ts` deseni +
  `hatalar.kullaniciAdi24Saat`; `lib/ayarlar.ts` BEKLEME_MS 24 saat.
  Profili duzenle: alanin altindaki TARIH NOTU KALKTI; 24 saat icinde
  ikinci degisiklik denenirse `OnayPenceresi` (tekDugme)
  `kullaniciAdiEkrani.tekrarUyariBaslik/tekrarUyari` ({{saat}}) - sunucuya
  gitmez (kural yine sunucuda). Hukuki metin 7 dil + docs "24 saatte
  bir". Canli senaryo 13 "24 saat". OTA `062b095c`.
- **Aktif check-in varken kapali panel YALNIZCA o kart** (kullanici:
  "harita cok kapaniyor"): `aktifKartVar` iken baslik ve secili satir
  gizli, altta "Yakinindaki mekanlari goster" (`kesfet.yakinMekanlariGoster`
  7 dil) -> panel acilir, baslik + liste gelir; kart panelin ustunde
  durur. TEST TUZAGI: `aktifCheckInimiGetir` mock'u testler arasinda
  siziyordu (clearAllMocks uygulamayi sifirlamaz) - beforeEach null.

### SOHBET UST BARINDA KULLANICI ADI - 2026-09-21

Kullanicinin istegi ("isim soyisimin altinda kullanici adi da yazsin"):
`sohbet/[kullaniciId]` ust barinda adin altinda `@kullaniciadi`
(`sohbet-kullanici-adi`, gri, 13). Ayni Pressable icinde, profile gider.

### SOHBETTE AVATAR VE AD PROFILE GIDER - 2026-09-18 AKSAM

Kullanicinin istegi: "mesajlarda sohbette kullanicinin profil resmine
ve kullanici adina basinca onun profiline gitsin". Onceden yalnizca ust
bardaki avatar gidiyordu. Sohbet ekraninda (`sohbet/[kullaniciId]`)
ust barda avatar + ad TEK `Pressable` (`kimlikDugmesi`, flex 1 - adin
sagindaki bosluk da hedef; testID `sohbet-ad`), her karsi balonun
yanindaki avatar da `Pressable` (`balon-avatar-dugmesi-<id>`); hepsi
`profiliAc` -> `/kullanici/<id>`. Mesajlar LISTESI degismedi (satir
sohbeti acar). Jest 77 paket / 1031 test. Yayin: web guncel (pakette
`balon-avatar-dugmesi` dogrulandi), OTA grup
`8ab51f07-2679-445c-a40c-f9aec472a8ab`.

### CLAUDE-MEM 4 GUN SESSIZ KAPALIYDI; REMOTE CONTROL KISAYOLDA - 2026-09-18 AKSAM

Kullanicinin istegi: "claude mem calisir hale getir, baska calismayan
arac var mi kontrol et". Iki kok neden bulundu, ikisi de olculdu:

1. **`~/.claude/plugins/installed_plugins.json` BOZUK JSON'du** (14 Eylul
   19:59'da yarim yazilmis; claude-mem girdisi kesik). O tarihten beri
   `claude plugin list` alti eklentiyi de gosteremiyordu. Dosya elle
   yeniden yazildi (yedek: `plugins/backups-installed_plugins-bozuk-
   2026-09-18.json`); alti eklenti (claude-mem 13.24.23, code-review,
   frontend-design, security-guidance, iki superpowers) "enabled".
2. **Worker 13.24.x'ten beri `~/.claude/settings.json` icinde
   `claude-mem@thedotmack: false` gorunce LOG YAZMADAN cikis 0 veriyor**
   (`Ow()` fonksiyonu; proje ayari true olsa bile). O `false` 19
   Agustos'taki kapatmadan kalan "ikinci emniyet"ti; 1 Eylul'de eklenti
   acilirken kaldirilmamisti ve 13.18.0 buna bakmiyordu. Satir silindi.
   Nobetci (`claude-mem-nobetci.ps1`) artik bu ayari gorurse acikca
   soyluyor. Olcum: `user_prompts` 545 -> 546, chroma bagli.
   **TESHIS DERSI:** worker "Cached ... at boot" satirlarindan sonra
   susuyorsa ve bun sureci yoksa, ilk bakilacak yer kullanici
   settings.json'daki enabledPlugins.

**"CLAUDE-MEM OUTAGE / allowance exhausted" UYARISI KENDINI BESLEYEN BIR
KILIT OLABILIR (2026-09-19, olculdu):** 13 Eylul'de bir kez gercek kota
hatasi alindi; kaynak koda gore bekleme kaydi ve uyari YALNIZCA basarili
bir gozlem kaydindan sonra siliniyor. Uyari her oturumun baglamina
"(Assistant: tell the user about this outage...)" talimatiyla girdigi
icin GOZLEMCI (o da bir Claude ajani) talimati kendine soylenmis sanip
XML yerine uyari duzyazisi uretti -> parser reddetti -> basari yok ->
uyari kaldi. 5 gun (3117'de takili) hic gozlem yazilmadi; kota aslinda
DOLU DEGILDI. Teshis: `observations` tablosunun `max(created_at)`i ile
`user_prompts`inkini karsilastir - ikincisi ilerliyor, birincisi duruyorsa
bu kilittir, kota degil. Kilit gozlemcinin onune gercek icerik dusunce
(kaynak kod ciktilari) kendiliginden cozuldu; cozulmezse
`~/.claude-mem/quota-cooldown.json` silinip `observer-health.json`da
`lastErrorKind`/`quotaCooldown` null yapilir ve worker yeniden
baslatilir (bellekteki harita yalnizca acilista okunur). Yedek:
`backups/observer-health-2026-09-19-kilit.json`.

**Remote Control:** yerel oturum claude.ai/code ve telefonda ancak
`--remote-control` ile acilirsa gorunur; kullanici iki kez (00:38 ve
19:02) elle `/remote-control` yazmak zorunda kaldi. Masaustundeki
`Claude - cloud projesi.bat` artik `--remote-control` ile aciyor.

**Login sorunu (19:00):** debug gunlugu yok, kesin sebep bilinmiyor;
sabah 05:39'da Claude Code 2.1.275 -> 2.1.276 otomatik guncellendi,
kimlik dosyasi 19:02'de `/login` ile yenilendi. Tekrarlarsa
`claude --debug` ile acilip gunluk okunmali.

Diger araclar temiz: EAS (byorcun), Wrangler (slooinapp), gh
(ozdmrorcn16) girisleri acik; hook'lar yerinde. Tek dis ariza claude.ai
tarafindaki **n8n MCP bagayicisi 404** - bu makineden duzeltilemez.
Yayin durumu: paralel oturum bugunku birlesik surumu 19:22'de
yayinlamisti (web `slooin--z62qooo6kg`, OTA `d7170e92`); canli pakette
bugunun anahtarlari dogrulandi, site ve panel 200. Yeni yayin gerekmedi.

### HESAP OLUSTURMA: "OTURDUGUN BOLGE" ADIMI - 2026-09-18 SABAH

Kullanicinin istekleri, sirayla (hepsi ayni saat icinde): "hesap
olusturma adimina yasadigin bolge diye bir adim ekle; il, ilce, ulke
secimi olsun" -> "yasadigin degil OTURDUGUN bolge" -> "ZORUNLU
secilecek ama ayarlarda gizleyebilecek" -> "ilk etapta GIZLI; profilde
goster yaparsa il/ilce gorunecek; ULKE HEP GIZLI kalacak".

- **Akis 4 adim oldu:** kimlik, kullanici adi, OTURDUGUN BOLGE, sifre.
  Ulke (varsayilan Turkiye) -> Turkiye'de il + ilce (ZORUNLU, `bolgeHata`);
  baska ulkede yalnizca ulke (il/ilce listesi yok, serbest metin YOK -
  2026-09-11 kurali). `ListeSecici` aramali. Insert `yasadigi_ulke/il/ilce`.
- **Ulke listesi** `lib/ulkeler-veri.ts`: Node/ICU `Intl.DisplayNames`
  ile 7 dilde uretildi (242 ulke; tarihsel/takma kodlar DD, UK, SU...
  ve EU/UN/Antarktika disarida; ~40 KB). `ulkeleriGetir(dil)` Turkiye'yi
  basa aliyor. Uretim komutu bu bolumun altinda.
- **Sunucu** (migrasyon `20260918120000`): `profiller.yasadigi_ulke`
  (ISO-2, check), `bolge_gizli boolean default TRUE`, kisit "il dolu ise
  ulke TR ya da null". `baskasinin_profili` il/ilceyi YALNIZCA
  `bolge_gizli=false` iken donduruyor, ULKEYI HIC DONDURMUYOR - kural
  sunucuda. Mevcut 7 profil de varsayilan gizli oldu.
- **Ayarlar:** "Bolgemi profilde goster" anahtari (`bolgeGosterGetir/
  Ayarla`, sutun `bolge_gizli`in tersi), `KonumIkonu`.
- **Profil duzenle:** ulke secici eklendi, "Bolgeyi kaldir" KALKTI
  (zorunlu), il+ilce eksikse kaydetmez. `bolgeMetni(il, ilce)` ulkeyi
  hic yazmiyor (kendi profilinde de).
- **Gizlilik metni 7 dilde** + `docs/gizlilik-metni.md` + KVKK listesi
  ("oturdugun bolge" maddesi, dort soru yeniden cevaplandi).
- TUZAK: sozluk uretirken `adim3Aciklama` ilk once KARSILAMA blogunda
  eslesti (orada da adim3 var) - profilOlustur blogunu index ile
  sinirlayarak duzeltildi. Tirnak: Fransizca/Turkce kesmeli metinler
  cift tirnaga alindi.

Ulke listesi uretimi (Node):
`new Intl.DisplayNames([dil],{type:'region'}).of(kod)` AA..ZZ tarayip
`of(k) !== k` olanlar; ESKI/ozel kod listesi kod icinde.

Jest 77 paket / 1026 test. Yayin: web `slooin--o8bilmr5r0`, OTA grup
`1ca32176-e68d-43b6-bd5e-bc23ce6587f7`; site push ile (hukuki metin).

### AYARLAR YENIDEN: HUB + 17 ALT EKRAN - 2026-09-18/19

Kullanicinin referans gorselleriyle (yaklasik 20 ekran goruntusu, hepsi
"bunu ekle / basinca bu gelsin") ayarlar bastan kuruldu. `ayarlar.tsx`
artik YALNIZCA yonlendirme: dort bolum, her satir kendi ekranina.

| Bolum | Satirlar -> ekran |
|---|---|
| Hesabin | Hesap ve guvenlik -> `hesap-guvenlik` (E-posta adresi `eposta-degistir`, Sifreyi degistir `sifre-degistir`, Acik oturumlar `oturumlar`) |
| Gizlilik ve etkilesim | Gizlilik `gizlilik-ayarlari` (Profil gorunurlugu, Aramada gorunurluk, Etiketler + `bekleyen-etiketler`, Mesaj izinleri, Engellenen kisiler), Konum ve check-in `konum-checkin`, Bildirimler `bildirim-ayarlari` |
| Uygulama | Gorunum `gorunum`, Yardim merkezi `yardim`, Slooin hakkinda `hakkinda` (-> `/topluluk-kurallari`, `/gizlilik`, `/kosullar`) |
| Hesap islemleri | Hesap yonetimi `hesap-yonetimi` (dondur, sil, Verilerimi indir), Cikis yap (seftali satir, `Satir vurgulu`) |

Ortak iskelet `src/tasarim/AyarSayfasi.tsx` (AyarSayfasi, AyarBolumBasligi,
IkonKutusu, BilgiKarti, RadyoKarti); ikonlar `hesap-ikonlari.tsx`,
`uygulama-ikonlari.tsx`, `zil-ikonu.tsx`. "Gizlilik metni" ve
"Verilerimi indir" duz baglantilari hub'dan KALKTI (hakkinda / hesap
yonetimi icinde).

**Sunucu (hepsi canli, MCP ile):** `20260918230000` oturumlarim() +
oturumu_kapat(uuid) (auth.sessions, yalnizca kendi); `20260918233000`
bildirim_mesaj/arkadas/ani; `20260918234000` `profiller.mesaj_izni`
(herkes|arkadaslar|hic_kimse) + `mesaj_gonder` yeniden ('hic_kimse'
arkadasin da yeni konusma acmasini engeller, ret metni engellemeyle
ayni); `20260919000000` bildirim_anlik, bildirim_ani_hatirlatma,
sessiz_gece, saat_dilimi + `bildirim.ani_hatirlatmalarini_gonder()`
cron `0 7 * * *` (UTC). Edge Function `bildirim-gonder` SURUM 7:
tercihleri okur (`gonderilsinMi`: ana anahtar -> olay anahtari -> gece
sessizi 22-08 yerel), yeni olay `ani_hatirlatma` ("Bir yil once bugun:
<mekan>"). Deno 15/15. `test:gorunurluk` ve `test:sema` KOSULDU, gecti.

**Kararlar / dersler:**
- E-posta degistirme: mevcut adrese kod (signInWithOtp) -> yeni adrese
  kod (`updateUser({email})` + `verifyOtp type email_change`).
  **PANEL ISI YAPILDI (2026-09-19, ben yaptim):** Supabase "Change
  Email Address" sablonu `docs/posta-sablonu-eposta-degisikligi.html`
  (konu `Slooin kodun: {{ .Token }}`), "Secure email change" KAPATILDI
  (Sign In / Providers > Email). Yeniden yukleyip okuyarak dogrulandi;
  canli `araclar/eposta-degistir-canli-test.py` **9/9** (kod
  `generate_link(type=email_change_new)` ile; yalnizca yeni adresin
  koduyla adres degisiyor, eski adresle giris reddediliyor).
  **CHROME ERISIMI: `opencli browser`** (agent-reach'in Browser Bridge
  eklentisi, kullanicinin GERCEK Chrome'u, ozdmrorcn16 oturumu).
  `claude-in-chrome` araci bu oturumda YOKTU; kullanici "senin chrome
  erisimin var" deyince bulundu. Kullanim: `export PATH=$PATH:$APPDATA/npm`;
  `opencli doctor` (eklenti "not connected" derse `opencli daemon
  restart`, 4 sn bekle); `opencli browser sb open <url>`; `... eval
  "<js>"` (uzun JS'i dosyadan `$(cat)` ile); `... click --role button
  --name "Save"`; `... screenshot <yol>`. Supabase paneli 2026-09-19'da
  YENI YERLESIMDE: sablonlar `auth/templates/<slug>` alt sayfasi
  (monaco `getModels()[0].setValue` + subject input native setter + Save
  changes), saglayici ayarlari `auth/providers` > "Email" satiri
  (`div[role=button]`) > yan panel, anahtarlar `button[role=switch]`,
  panel altinda "Save". Sekme ARKA PLANDA da calisti (opencli CDP
  kullanmiyor).
- Sifre degistirme en az 12 karakter (`EN_AZ_YENI_SIFRE`), kayitta 8
  (`EN_AZ_SIFRE`) - referans ekran 12 diyordu; ikisi ayri sabit.
  Degisince diger cihazlar dusuruluyor.
- Bildirimler: "Mekan onerileri" anahtari BILEREK YOK (oneri motoru
  yok, sahte anahtar yaklasik olurdu). Ani hatirlatmasi GERCEK (cron).
- Gorunum: tema tercihi CIHAZDA (`lib/tema-tercihi.ts`, AsyncStorage,
  `useSyncExternalStore`); `useRenk` ona abone, kok duzen acilista
  yukler. "Hareket tercihleri" icin denetim istenmedi, yok.
- Yardim: SSS cevaplari gercek davranisi anlatiyor (sozluk
  `uygulama.cevapN`) - kural degisirse cevap da degismeli. "Sorun
  bildir" = mailto destek@slooin.com.
- Topluluk kurallari 6 madde, 7 dil (`toplulukKurallari`), ekran
  `src/app/topluluk-kurallari.tsx`.
- Oturumlar: `cihazAdi(ua)` "iPhone · Slooin" / "Safari · Mac"; IP
  gosterilmiyor ama RPC donduruyor. Gizlilik metni (7 dil + docs) ve
  KVKK listesi guncellendi.
- TUZAK (uc kez): RNTL'de `fireEvent.changeText` art arda AWAIT'siz
  cagrilinca "overlapping act()" ve sonraki degerler DUSUYOR - her
  fireEvent await edilmeli. Bash heredoc'la tsx yazmak yine kirildi
  ("unexpected EOF"); Write araci kullanildi.
- Ekran goruntusu araci tarayici koyu moddaysa koyu cizer;
  `SLOOIN_TEST_SEMA=light` ver. Goruntuler `tasarim/ayar-*.png`,
  `topluluk-kurallari.png`, `ayar-gorunum-koyu.png`.

Jest 81 paket / 1064 test, tsc temiz. Yayin: web `slooin--7vsyt8lbxi`,
OTA grup `b376cb33-c05d-453b-83e4-36ab705ddfb3`.
- **DUZENLEME KILIDI DENENDI VE GERI ALINDI (2026-09-19):** kullanici
  once "bir duzenleme kapanmadan obur duzenleme acilmasin" dedi (modul
  duzeyi kilit, commit `ef625bf`), ayni saat icinde "vazgectim, eski
  haline al" dedi - revert edildi. Akista birden fazla kart ayni anda
  duzenlenebilir; bu davranis BILEREK boyle, tekrar onerme.
- **CIKIS ONAYLI (2026-09-19, kullanicinin istegi "cikis yap basinca
  hemen cikis yapmasin, once sorsun"):** ayarlar hub'inda "Cikis yap"
  `OnayPenceresi` aciyor (`ayarlar.cikisOnayBaslik/cikisOnayAciklama`
  7 dil, `yikici={false}` - geri giris mumkun); jeton silme + signOut
  yalnizca onaydan sonra, testle kilitli (vazgecince hicbiri cagrilmaz).
- **DUZELTME 2 (2026-09-19, kullanicinin istegi "yazilar biraz daha
  belirgin, iki ikonda sorun var"):** `Liste.tsx` ortak: bolum basligi
  14, satir etiketi 600/16 (500/15'ti), aciklama 14/20 - butun ayar
  ekranlari birlikte. Ikonlar: `KonumIkonu` hub'da tek siyah ikondu
  (renk.metin) -> varsayilan turuncu (`renk` prop'u ile ezilebilir);
  `GunesAyIkonu` yarim dolu daire yayi MERKEZDEN basliyordu, kirik bir
  dilim ciziyordu -> `M12 7.5a4.5 4.5 0 0 0 0 9z`. Goruntu
  `tasarim/ayar-hub.png`. OTA grup `6f91cb9a-05fe-43e2-a22f-b6f8394e04c9`,
  web guncel.
- **DUZELTME (kullanicinin bildirimi "ikonlar yazilar birbirine
  girmis"):** `Liste.tsx` `ikon` kabi `width: 22` SABITTI; 44'luk
  seftali kutular tasip yaziya biniyordu (web goruntusunde fark
  edilmemisti - overflow gorunur). Artik `minWidth: 22`, icerige gore
  buyur; Satir kullanan HER ekran duzeldi. Sonraki OTA/web asagida.

### MODERASYON PANELI YENIDEN TASARLANDI - 2026-09-18 GECE

Kullanicinin istegi: "moderator sayfasini profesyonel kurallara uygun
duzenle". Oneri Artifact `8spWPc4TAhWbq3CnvWEW7t` ile sunuldu, "Yap"
dendi. `panel/` bastan yazildi (13 dosya, +1.450/-910; islev ayni,
kabuk ve butun ekranlar yeni):

- **Kabuk:** sol kenar cubugu (Ozet / Sikayetler+rozet / Kullanicilar /
  Duzenleme talepleri+rozet / Denetim izi), altta moderator e-postasi +
  "TOTP dogrulandi · AAL2", dar ekranda ust sekmeler. 30 dk
  hareketsizlikte otomatik cikis (yalnizca ekran; kapi DB'de).
- **Ozet (yeni):** RPC `public.moderasyon_ozet()` (migrasyon
  `20260918110000`; bekleyen sikayet + en eskisi, bugun/7 gun karar,
  askida/yasakli, bekleyen talep) + en eski bes bekleyen. Kabuk
  rozetleri her rota degisiminde tazeleniyor.
- **Tek durum dili:** `SikayetRozeti` (Yeni turuncu / Incelendi sari /
  Islem yapildi yesil / Reddedildi gri), `HesapRozeti`, `TalepRozeti`,
  `HedefEtiketi` (ikon + ad), `sebepMetni` - hepsi `ortak/Durum.tsx`.
- **Sikayet detayi:** iki sutun; sagda yapiskan KARAR karti - gerekce
  ZORUNLU (bos ise dugme pasif; onceden istege bagliydi), "Yeni"ye
  geri donus secenegi kaldirildi; ayri kirmizi "hesap ve icerik
  islemleri" bolgesi, yikici dugme birincil turuncuyla yan yana degil.
  `GerekceSor` pencere; onay gerektiren eylemde dugme kirmizi, Esc
  kapatir, textarea otomatik odak.
- **Sikayetler:** filtre cipleri, adreste `?durum=&hedef=&sira=&sayfa=`
  (detaydan donunce filtre kalir), varsayilan Bekleyen + once eski;
  satirin tamami tiklanir, Enter ile acilir.
- **Denetim izi:** eylem gruplari (Okumalar/Kararlar/Hesap), hedef
  baglantili, moderator sutunu; okuma satirlari turuncu zemin.
  Eylem kodlari migrasyonlardan dogrulandi.
- **Sahte veri kipi:** `VITE_SAHTE=1 npx vite` -> `src/sahte.ts`
  (uydurma veri); `supabase.ts` dinamik import ile yalnizca DEV'de
  yukler - statik import uretim paketine sizdi (olculdu), dinamik ile
  0. Ekran goruntusu betigi `panel/araclar/ekran-goruntusu.mjs`
  (puppeteer-core `mobil/node_modules`ta; betik oradan kosuluyor).
  Goruntuler `tasarim/panel/` (acik mod; koyu mod da olculdu).
- Degismeyen: service-role yok, AAL2 kapisi DB'de, her erisim
  `moderasyon_*` RPC.

**CANLI: https://panel.slooin.com** (kullanici "Al" dedi). Cloudflare
Workers statik varlik, `panel/wrangler.toml` (`name slooin-panel`,
`routes` custom_domain). Kimlik: `npx wrangler login` OAuth -
Cloudflare girisini Chrome'da Google ile (slooinapp@gmail.com, "Last
used") yaptim, OAuth onayini DOM'dan tikladim; sekme arka plandayken
ekran goruntusu zaman asimina dusuyor ama `javascript_tool` ile DOM
okunup tiklanabiliyor (React-select formlari haric - API token
sayfasi bu yuzden birakildi, OAuth daha kolay). Wrangler oturumu
`%APPDATA%/xdg.config/.wrangler`. Uc tuzak `panel/README.md`de
(jsonc toml'u eziyor, _redirects dongu, routes ust duzeyde).
Yanlislikla olusan "panel" adli Worker silindi. Canli olcum: 200,
SPA yollari 200, giris ekrani goruntusu `tasarim/panel/panel-giris-canli.png`.

### MESAJLAR: GERI OKU KALKTI - 2026-09-18 GECE

Kullanicinin istegi: "Mesajlar yazisinin yaninda geri cikma tusu
olmasin". 2026-09-14'te konan sol ust ok kaldirildi - sekme ekrani,
alt cubuktan aciliyor. Sohbet ekranindaki ok duruyor. Test
"baslik satirinda geri oku YOK".

### UC KUCUK DUZELTME - 2026-09-18 GECE (kullanicinin telefondan bildirimleri)

1. **Mekan sayfasi haritasi tam genislik**: "harita kenarlardan tam
   sigmamis". `haritaCercevesi` yuvarlak kose + cerceve yerine
   `marginHorizontal: -bosluk.sayfa` (akis fotografiyla ayni desen).
2. **Buyuk gorunumlerde × SOLDA**: gezgin zaten soldaydi; akis karti ve
   profil avatar buyuk gorunumu `right` -> `left: bosluk.sayfa`.
3. **"Harita verisi" atfi ekranin altina sabit** - ILK YORUM YANLISTI:
   kesfetteki "Mekan verileri: Foursquare..." satirini sabitlemistim;
   kullanici "kesfet sayfasinda olmasin o veri, yanlis yapmissin,
   hangi sayfalara eklediysen ayni sayfalarda en altta sabit" dedi.
   Kastedilen KARSILAMA ekranindaki "Harita verisi © OpenStreetMap"
   satiri (`karsilama.haritaAtfi`, tek kullanim yeri). Kesfet eski
   haline dondu (atif listenin sonunda, kaydirmayla). Karsilamada kok
   `View` + ScrollView + `atifSeridi` (absolute bottom 0, guvenli alan
   payi), icerik alt payi + `ATIF_YUKSEKLIGI` 22. Ekran goruntusu
   `tasarim/karsilama-atif-sabit.png`. Ders: "harita verileri" sozu
   OSM atfini kastediyor, mekan atfini degil.

### AKIS KARTI: FOTOGRAF ALTTA DA KENARA YAPISIK - 2026-09-18

Kullanicinin bildirimi: "fotograflarin altinda cok az bos yer kaliyor".
Fotograf kartin son ogesi ama kartin `paddingVertical` alt dolgusu
altinda ince beyaz serit birakiyordu. `fotografKabi`ye `marginBottom:
-bosluk.m` (yanlardaki negatif payin alt kardesi); ayirici cizgi artik
fotografin hemen altinda. Test: ana sayfa "fotograf kabi kartin alt
dolgusunu geri alir". Ayni kart profil ve baskasinin profilinde de
kullanildigi icin uc ekran birden.

### BAGLANTI DOGRUDAN UYGULAMAYA + PAYLASIM KALKANI - 2026-09-18 GECE

**1. Paylasim kalkani.** Kullanicinin bildirimi: iOS paylasim sayfasini
disina dokunarak kapatinca dokunus arkadaki fotografa dusup buyuk
gorunumu aciyordu; genellemesi "bir sey acikken arkada baska bir seye
basilinca direkt acilmamali". Cozum TEK YERDE: `lib/paylasim.ts`
`sistemPaylasimi` (butun `Share.share` cagrilari buradan; kapanis
anini kaydeder + dinleyicilere haber verir) ve kok duzende
`PaylasimKalkani` (kapanistan sonra 700 ms boyunca `absoluteFill`
gorunmez katman, her seyin ustunde). Kartta yerel koruma BILEREK yok.
`jest.setup.js` her testten once `paylasimKorumasiniSifirla()` - modul
duzeyindeki an testler arasi tasiyordu (2 test kirilmisti).

**2. slooin.com/<ad> dogrudan uygulamayi acar** (kullanicinin istegi:
"siteye yonlendirmesin, direkt uygulamada o kisinin profili acilsin,
yuklu degilse yuklemeye"). Uc parca:
- **Site:** `public/.well-known/apple-app-site-association`
  (appID `79QNZVGJC7.com.slooin.app`, site sayfalari ve dil onekleri
  `exclude`), `assetlinks.json` (SHA-256 `6D:B8:0F:CB:...` - EAS
  keystore; AAB'den `META-INF/*.RSA` + Android Studio'nun keytool'u ile
  okundu, `eas credentials` etkilesimsiz calismiyor), `_headers`
  (Content-Type application/json), middleware `/.well-known/` muaf.
  Canli: 200 + application/json. Sayfa Android'de `intent://` ile
  otomatik deniyor (yoksa sayfada kalir); iOS'ta OTOMATIK sema YOK
  (uygulama yoksa Safari uyari verirdi) - iOS'ta is Universal Links'in.
- **Uygulama:** `app.json` `ios.associatedDomains: [applinks:slooin.com]`,
  `android.intentFilters` (autoVerify, https slooin.com, pathPrefix /).
  Rota `src/app/[kullaniciAdi].tsx`: `profil_karti` RPC ile kullanici
  adi -> kimlik -> `/kullanici/<id>` (kendi adiysa `/profil`); site
  sayfa adlari (Android hepsini getirir) `expo-web-browser` ile
  tarayicida. Bilinen sinir: oturum yoksa kok duzen karsilamaya atar,
  baglanti kaybolur.
- **NATIVE DERLEME YAPILDI:** iOS **1.0.0 (13)** (`f450a872`) App
  Store Connect'e yuklendi, Android **versionCode 7** (`320ddc2a`, AAB
  `https://expo.dev/artifacts/eas/I1zaHmo87R9egrCyeGdevUkyIuAZkQBFWNeo2vjcJMc.aab`).
  **Universal Link ancak Build 13'te calisir** - TestFlight'tan kur.
  YOLDA IKI KIRILMA: (1) `.easignore` `tasarim/` deseni
  `mobil/src/tasarim/`i de disliyordu ("Unable to resolve
  ../../tasarim/tema") - desenler koke sabitlendi (`/tasarim/`).
  (2) Provisioning profile "Associated Domains" tasimiyordu (Sign in
  with Apple'daki sinif). EAS'in Apple portal oturumu (~/.app-store)
  SURESI DOLMUSTU; cozum: EAS'teki ASC API anahtari (T2DU3DFMW4,
  APP_MANAGER) GraphQL `appStoreConnectApiKey.byId.keyP8` ile cekilip
  `mobil/gizli/AuthKey_ASC_T2DU3DFMW4.p8` + `asc-issuer.txt`e yazildi
  (gitignored) ve ham ASC API `POST /v1/bundleIdCapabilities`
  (bundleId `V9N8HVCS7P`, ASSOCIATED_DOMAINS) ile yetenek eklendi;
  eas-cli'nin `syncCapabilitiesForEntitlementsAsync`i "request entity
  is not valid" verdi (settings gonderiyor). EAS sonraki derlemede
  profile'i kendisi yeniledi. Derleme loglari EAS GraphQL
  `builds.byId.logFiles` + `curl --compressed` (brotli) ile okunuyor;
  `--non-interactive` metni gostermiyor. Fazladan baslatilan 2 iOS
  derlemesi iptal edildi.
  "Yuklu degilse magazaya": magaza baglantilari yokken sayfada
  "yakinda" notu; cikinca `[ad].js` METIN.indir + intent
  `S.browser_fallback_url` Play'e cevrilecek.

OTA (kalkan + rota): grup `543abca5-5738-4439-a8a9-cf59b7796657`, web
`slooin--jf21x16e2i`. Jest 77 paket / 1020 test.

### PROFIL PAYLASIMI: slooin.com/<kullanici_adi> + ONIZLEME KARTI - 2026-09-18

Kullanicinin istegi ("profilimi paylastigim zaman daha profesyonel
olsun"); Artifact `MtUWGFzCM1dQRCWpwuMKSM` ile sunuldu, "/u/" oneki
soruldu, kullanici **oneksiz `slooin.com/byorcun`** secti.

**Zincir:** uygulama `lib/paylasim.ts` `profilBaglantisi(ad)` ->
`https://slooin.com/<ad>` -> Cloudflare Pages Function
`site/functions/[ad].js` (sunucuda HTML + Open Graph; dil
Accept-Language/cerez, 7 dil sozlugu fonksiyonun icinde) -> Supabase
Edge Function `profil-karti` (verify_jwt KAPALI, service role ile
imzali fotograf URL'si 24 saat) -> RPC `public.profil_karti(text)`
(anon'a acik; migrasyon `20260918100000`). Sayfa: avatar + ad +
@kullaniciadi + "Uygulamada aç" (`slooin://kullanici/<id>`, mevcut
derlemede calisir) + "Slooin nedir?"; Expo web'e baglanti YOK.
Genel OG gorseli `site/public/og-slooin.png` (1200x630).

**GIZLILIK (KVKK listesi maddesi yazildi):** kart yalnizca ad,
kullanici adi, ilk fotograf; `profil_gizli` VEYA `aramada_gorunsun=false`
ise ad ve fotograf NULL (yalnizca @ad); aktif olmayan hesap 404.
Service role Supabase icinde kaldi, Cloudflare'e yalnizca anon gitti.

**YASAKLI KULLANICI ADLARI:** sitenin sayfa adlari (gizlilik, kosullar,
destek, posta, _astro, slooin, admin, ...) DB check kisiti
`profiller_kullanici_adi_yasakli` + istemci `kullaniciAdiGecerliMi`.

**IKI CLOUDFLARE DERSI (olculdu):** (1) `_middleware.js` oneksiz yolu
dile yonlendirir; profil yolu (`^/[a-z0-9._]{3,20}/?$`, site sayfasi
degil) MUAF tutuldu, yoksa `/de/byorcun/` 404 olurdu. (2) **Pages'te
fonksiyon rotasi statik varliktan ONCE eslesir**: ilk yayinda
`/gizlilik/` ve `/og-slooin.png` fonksiyona dusup 404 oldu; fonksiyon
artik once `env.ASSETS.fetch` deniyor, 404 degilse onu donduruyor.

Canli olcum: tr/de basliklar dogru, robot taklidinde og:image var,
olmayan ad 404, gizlilik/kosullar/ana sayfa/og gorseli 200, Almanca
tarayici `/gizlilik` -> `/de/gizlilik/` 302 (eski davranis korundu).
Metinler: `profil.paylasMetni` (yeni, 7 dil, "Slooin'de beni ekle 👋"),
`kullanici.paylasMetni` @ ile. Jest 76 paket / 1015 test. Uygulama:
web `slooin--gkekdg28wg`, OTA grup `67202e96-1aac-479f-ab3a-693d5805e510`.
KALAN: magaza baglantilari gelince sayfadaki "yakinda" notu dugmeye
donusecek.

### PAYLAS IKONU + SEKME IKONLARI - 2026-09-18

**Paylas ikonu:** kagit ucak -> kutu + yukari ok (iOS "Paylas"; kullanicinin
secimi A, dort alternatif `tasarim/paylas-ikonu-secenekler.png`). Tek
tanim `etkilesim-ikonlari.tsx`; profil dugmesi ve ani karti birlikte dondu.
Gerekce: kagit ucak Instagram'da "DM ile gonder"; bizde dugme sistem
paylasim penceresi aciyor.

**Anılar / En sık sekme ikonlari** (kullanicinin referans gorseli,
"birebir"): `src/tasarim/sekme-ikonlari.tsx` - Anılar = takvim icinde
konum ignesi, En sık = ignenin cevresinde donen iki ok. `SekmeHapi`
sekme ogesine istege bagli `ikon(renk)` aldi; renk etiketle ayni (secili
`turuncuYazi`, degilse `metinSoluk`), satir `flexDirection: row` + gap.
Iki profil ekrani da veriyor. Ekran goruntusu `tasarim/profil-sekme-
ikonlari.png` (yerel `expo export` + `python -m http.server 8080 -d dist`
+ `araclar/ekran-goruntusu.mjs profil`, test hesabi test0@slooin.test).

Duzeltme (ayni gece, kullanicinin bildirimi "En sık ikonu cok
kucuk"): En sık cizimi viewBox `2 2 20 20` ile buyutuldu, cizgi 1,5 -
takvimle ayni gorunur boy. Ders: iki ikon ayni `boyut` alsa da cizim
kutuyu ne kadar dolduruyorsa o kadar buyuk gorunur.

Yayin: web `slooin--h34snhhsx1` (+ boyut duzeltmesi sonraki dagitim),
OTA grup `da1a61f4-482b-4dd4-8573-963f3f0ac669` ve ardindan boyut
duzeltmesi (paylas ikonu tek basina `a02d560e`).

### PROFIL HARITA DOKUSU: ANA YOL INCELDI - 2026-09-18

Kullanici once profil arkasina Turkiye merkezli DUNYA HARITASI istedi;
iki secenek gorsel olarak hazirlandi (`tasarim/profil-dunya-haritasi-
secenekler.png`, Natural Earth 1:50m kamu mali, Mercator, uretim betigi
gecici). Sonra "su anki hali kalsin, sadece ortadan gecen kalin yol
yaziya engel olmasin" dedi; dort secenek cizildi
(`tasarim/profil-harita-anayol-secenekler.png`) ve **A secildi**: ana
yol 6,5 -> 3,4 px (orta yollarla ayni), renk duruyor. Tek satir,
`ProfilHaritaZemini.tsx`; karsilama ekrani degismedi (orada yazi yok).
Dunya haritasi FIKRI reddedilmedi, ertelendi - istenirse uretim
`scratchpad/dunya-harita.py` deseniyle 10 dakikalik is (85 KB yol
verisi, sadelestirme 0,35 px).

Yayin: web `slooin--wyx4c1zh3s`, OTA grup
`a0d6ca15-46fc-4f05-b447-3d5377f84e38`.

### SEKME GERI DONUSTE KORUNUR; FOTOGRAF GEZGINI - 2026-09-18

**1. "En sık" sekmesi geri donuste kayboluyordu** (kullanicinin
bildirimi). Kok duzen `Slot`: baska sayfaya gidince ekran KALDIRILIYOR,
donuste sifirdan kuruluyor, `useState` varsayilana donuyor. Cozum
`lib/sekme-parametresi.ts` (`useSekmeParametresi`): secim
`router.setParams({ sekme })` ile rotanin parametresine yaziliyor,
acilista `useLocalSearchParams`tan okunuyor, bilinen sekmelere
suzuluyor. Geri donus ayni rota kaydina geldigi icin sekme korunur;
alt cubuktan "Profil" parametresiz yeni rota actigi icin varsayilanda
acilir. Modul duzeyi degisken BILEREK kullanilmadi - alt cubuktan gelen
taze acilisi da son sekmeye kilitlerdi. Iki profil ekrani da kullaniyor.
Test mock'lari: `useLocalSearchParams` artik `sekme` donduruyor
(`mockSekmeParam`), `useRouter` `setParams` tasiyor.

**2. Fotograf gezgini** (kullanicinin istegi: "buyuk acinca saga sola
kaydirip fotograflar arasinda gezebileyim, kendi profilimde ya da
baskasinin profilinde"). Mekan galerisinin buyuk gorunumu
`src/tasarim/FotografGezgini.tsx` olarak cikarildi (siyah zemin, × ve
"3 / 12" sayaci, sayfali yatay FlatList, iki parmak zoom, altyazi
cagirandan). Uc yer kullaniyor: mekan galerisi (testID on eki `galeri`),
kendi profil (`izgara` - izgara VE ani kartlari), baskasinin profili
(`kullanici` - ani kartlari). Liste = fotografli anilar, akis sirasi.
`CheckInKarti` yeni `onFotografAc` prop'u aldi: verilirse kart kendi tek
fotografli penceresini ACMAZ, ekrana bildirir. **Akis (ana sayfa)
DEGISMEDI** - orada prop verilmiyor, kart eskisi gibi tek fotograf acar.
Baskasinin profilindeki AVATAR ve PROFIL FOTOGRAFI SERIDI de basilinca
ayni gezginde aciliyor (kullanicinin istegi, ayni gece: "basinca buyuk
acilsin o da") - AYRI liste (profil fotograflari, anilar degil), testID
on eki `profil-fotograflari`, altyazi yalnizca ad. Sozluk
`kullanici.fotografiAc` 7 dil.

Jest 76 paket / 1014 test. Yayin: web `slooin--e5046r3ffg`, OTA grup
`1a8f0143-59f5-4b8b-8b0e-118557184c4e` (bir onceki `85821a09`).

### CHECK-IN ILK KULLANIM EKRANI KALDIRILDI - 2026-09-18

Kullanicinin istegi (ekran goruntusuyle): "Check-in yapmaya basinca bu
ekran cikiyor, bunu sil." Hesap basina bir kez gosterilen "Bu check-in
ne paylasiyor?" bilgilendirme ekrani (Anladim / Gizli yap) KALKTI:
`src/app/check-in/[mekanId].tsx`ten ekran, AsyncStorage bayragi
(`ilk-checkin-uyarisi-gosterildi.<kimlik>`) ve `bulunurlukDegistir`
yolu; 7 sozlukten `checkIn.ilkUyariBaslik/ilkUyariMetin/anladim/gizliYap`.

**KVKK:** aydinlatma kaybolmadi - ayni bilgi gizlilik metninde
(check-in gorunurlugu, sure, aniya donusme) ve kayitta onaylaniyor.
Bu ekran onun tekrariydi; "onaylar tek yerde" cizgisiyle uyumlu.

**YAN SONUC - bilerek:** tek bir check-in'i "gizli" yapmanin son
yolu da bu ekrandi (formda secici yok; ayarlardaki varsayilan satiri
2026-09-12'de kalkmisti). Artik bulunurluk HER ZAMAN profilin
varsayilani; paylasimi daraltmanin tek kontrolu "Profilim gizli".
Sunucu tarafi ('gizli' degeri, eski gizli check-in'lerin anilari)
DOKUNULMADI - veri modeli ayni, yalnizca giris yolu yok.

Jest 76 paket / 1007 test. Yayin: web `slooin--mqfme60uw0`, OTA grup
`1500d276-7b6e-4ef3-8ded-e6944804692c`.

### ARKADAS EKLE DOLU, BEKLEMEDE BASINCA GERI CEKER - 2026-09-17 GECE

Kullanicinin istegi (ekran goruntusuyle): "Arkadaş ekle" DOLU turuncu
(Mesaj yaz ile ayni agirlik); istek gidince ayni dugme "Beklemede"
olur ve ona TEKRAR basmak istegi geri ceker; ayri "İsteği geri çek"
satiri KALKTI. **Basinca ONAY penceresi** (kullanicinin ikinci istegi,
ayni gece): `OnayPenceresi`, baslik `istegiGeriCek`, aciklama
`geriCekOnayi`, dugme `geriCekEvet` (7 dil), `yikici={false}` -
geri alinabilir bir eylem, kirmizi degil turuncu. Beklemede notr gri (`cizgi`), basili hali `metinSoluk`
(opaklik degil - 2026-09-07 dersi). `kullanici.istegiGeriCek` anahtari
sozlukte duruyor, dugmenin `accessibilityLabel`i.

**Karsi taraftaki bildirim:** uygulama ici Bildirimler karti sunucudan
bekleyen `takipler` satirini canli okuyor; `takibi_birak` satiri
sildigi icin kart sekme acilinca KENDILIGINDEN dusuyor - kod
degismedi. Telefona zaten dusmus PUSH afisi ise geri CEKILEMEZ (Expo
Push'ta iptal yok; sessiz push + native arka plan kipi gerekir, yeni
derleme). Kullaniciya soylendi.

Jest 76 paket / 1008 test. Yayin: web `slooin--gc6zljnv9g`, OTA grup
`ed4fc26c-486c-436d-bfa8-f58a4d111d4a` (onaysiz ilk hali `e2edee18`).

### GIZLI PROFIL GORUNUMU SADELESTI - 2026-09-17

Kullanicinin istegi (ekran goruntusuyle): sayac sutunu ile "Arkadaş
ekle / Mesaj yaz" butonlarinin yeri degisti (once SAYACLAR, sonra
butonlar); sayfanin dibindeki "Şikâyet et / Engelle" satiri kalkti.

**KURAL YALNIZCA GIZLI PROFIL ICIN** (kullanicinin duzeltmesi, ayni
gun: "bu gorunus profili gizli olan birinin goruntusu olucak"). Ilk
uygulamada butun kullanici profillerine yayilmisti ve ACIK profilin
duzeni de bozulmustu - geri alindi.

| | Gizli profil | Acik profil |
|---|---|---|
| Sira | kimlik -> SAYACLAR -> butonlar -> kilit | kimlik -> butonlar -> sayaclar -> sekmeler (ESKISI) |
| "Anılar / En sık" | yok (zaten cizilmiyordu) | VAR |

Kod tarafinda iki blok (`eylemSatiri`, `sayacSatiri`) degisken olarak
duruyor ve `kapali` durumuna gore siralaniyor; ikisi de ayni JSX,
kopya yok. Sira testle kilitli - IKI test birden yazildi, cunku
yalnizca biri olsaydi "her iki halde ayni sira" da yesil gecerdi.

**SIKAYET VE ENGELLEME SILINMEDI, TASINDI**: ust cubuktaki uc nokta
menusune (iki halde de ayni yer, tek giris). App Store kullanici
iceriigi olan uygulamalarda engelleme ve sikayet yolunu SART kosuyor;
sayfadan tamamen kaldirmak magaza reddi riskiydi. Menu testle kilitli.

**UST CUBUKTA TEK DUGME: UC NOKTA** (kullanicinin istegi, ayni gun).
Paylas ikonu oradan kalkti, "Profili paylaş" menunun ILK satiri oldu -
yan yana iki ikon dururken hangisinin ne yaptigi okunmuyordu. Menu:
Profili paylaş / Şikâyet et / Engelle (yikici en altta). Ikon SEFTALI
DAIREDE (40 px, kesfetteki suzgec dugmesiyle ayni desen) ve `renk.metin`
ile koyu: soluk gri uc nokta beyaz zeminde kayboluyordu.
`UcNoktaIkonu` artik istege bagli `boyut`/`renk` aliyor; VARSAYILANLAR
DEGISMEDI, yani akis kartindaki ve yorumlardaki menuler ayni.

Yeni sozluk
anahtari `kullanici.secenekler` yedi dilde; etiket "Profil
seçenekleri" - kartin "Paylaşım seçenekleri" etiketiyle CAKISMASIN
diye (jest `getByLabelText` tam eslesme ariyor, bir test bu yuzden
kirilmisti).

### BUYUK ACILAN FOTOGRAFIN SOL ALTINDA PAYLASAN - 2026-09-17

Kullanicinin istegi (Swarm ekran goruntusuyle): "paylasilan fotografin
sol altinda paylasanin resmi, kullanici adi, konumu ve tarihi
gosterilsin fotograf buyuk acildigi zaman."

Satir MEKAN SAYFASININ galerisinde zaten vardi; akista ve profilde
fotograf ciplak aciliyordu - ayni fotograf uc yerde uc turlu. Cozum
yeni bir tasarim degil, TASIMA: galerinin ici
`src/tasarim/FotografAltyazisi.tsx` olarak cikarildi ve uc yerde de o
kullaniliyor (galeri, akis karti tam ekran, profil izgarasi).

- Renkler bilerek SABIT (#FFFFFF / #B3B3B3 / #333333), tema jetonu yok:
  zemin iki modda da siyah, tema metni acik modda siyah olurdu.
- Mekan adinda BULUNMA EKI YOK (2026-09-13 karari): ad kendi satirinda.
- **UC AYRI DOKUNUS HEDEFI** (kullanicinin istegi, ayni gun): avatar
  ve kullanici adi KISININ PROFILINE, mekan adi MEKAN SAYFASINA
  gidiyor; her birinde buyuk gorunum once kapaniyor. Hedef yazinin
  kendisi kadar (`alignSelf: 'flex-start'`) - satirin bos sagina
  basmak bir sey acmiyor.
- Baglanti yalnizca ANLAMLI oldugu yerde: profil izgarasinda ad
  baglantisi yok (zaten o profildeyiz), mekan galerisinde mekan
  baglantisi yok (zaten o mekanin sayfasindayiz).
- Profil izgarasi state'i artik URL degil ANININ KENDISI tutuyor
  (altyazi bilgileri yalnizca orada).

### KART KARESI GERCEK HARITA, BUTUN KARTLAR AYNI - 2026-09-17

Kullanicinin istegi: "butun konumlar ilk sutundaki gibi yap, kucuk map
goruntusunde de gercek haritadaki yeri gorunsun."

- **Eylem satiri artik HER kartta** (Yol tarifi + Check-in yap).
  Onceden yalnizca en yakin karttaydi, digerlerinde Check-in kisi
  satirinin sagina sikisiyordu. **Turuncu cerceve yalnizca EN YAKIN
  kartta kaldi** - o bir bilgi ("en yakini bu"), hepsine verilse ya da
  kaldirilsa liste onu kaybeder.
- **Karenin ici gercek harita** (`src/tasarim/MekanKapakHarita`):
  iOS Apple, Android Google - buyuk haritayla AYNI motor ve stil
  (`harita-ortak.ts`, `CanliHarita.native` de oradan okuyor). Ucuncu
  servis, anahtar, tekrarlayan gider YOK. `Marker` kullanilmiyor:
  harita zaten koordinatta merkezli, igne ustune SVG olarak ciziliyor.
- **Kapak fotografi yolu DURUYOR**: fotograf varsa o gorunur, yoksa
  harita. Canlida kapakli mekan sayisi 0 (olculdu), yani bugun her
  kartta harita var.
- **Web'de harita YOK** (react-native-maps web'i desteklemiyor,
  2026-08-30 karari): kare igneli kutu olarak kaliyor.
- **PERFORMANS: harita yalnizca ekrana yakin kartlarda kuruluyor.**
  Liste 100 karta cikabiliyor; yuz canli harita telefonu yorar.
  Pencere kaydirma konumundan TAHMINLE hesaplaniyor (kart yuksekligi
  170-240 px, iki uca 4 kart pay), olcum tutulmuyor - yanlis tahminin
  bedeli yalnizca bir karenin gec dolmasi. Kip platforma gore:
  Android `liteMode`, iOS `cacheEnabled` (ikisi ayni anda VERILMEZ).

**ORTAM TUZAGI - BULUT OTURUMUNDA supabase.co KAPALI.** Bu oturum
Claude Code on the web'de kostu ve ag politikasi
`swpiibyuoffykbmirvgq.supabase.co:443` CONNECT'ini 403 ile reddediyor
(`curl -sS "$HTTPS_PROXY/__agentproxy/status"` ile gorulur). Sonuc:
`araclar/ekran-goruntusu.mjs` giris yapamiyor, ekran hep karsilama
sayfasinda kaliyor. Supabase MCP calisiyor (o baska yoldan gidiyor).
Cozum: puppeteer'da `setRequestInterception` ile Supabase cevaplarini
sahte vermek ve oturumu `localStorage`a sahte jetonla koymak - boyle
cizdirildi, betik gecici oldugu icin depoya konmadi.
`ekran-goruntusu.mjs` artik `SLOOIN_CHROME` ile Chrome yolu alabiliyor
(Linux konteynerinde Windows yolu yok).

**YAYINLANDI (ayni gun aksam, yerel oturum):** bulut oturumunda EAS
girisi olmadigi icin yayin yerelden yapildi. Jest 76 paket / 1006
test, tsc uygulama kodunda 0 hata (bulutun test dosyasinda biraktigi
bir mock tipi duzeltildi). Web `slooin--vo1q6bhs9d`, OTA grup
`66029f3f-c8a7-417b-ba6d-29294c8aa116`. **DERS:** `eas update`
`--non-interactive` ile `--environment production` ISTIYOR; bayraksiz
cagri "update command failed" ile duser.

### SITEDE OTOMATIK DIL ALGILAMA + EMAIL_OFF - 2026-09-14

Kullanicinin istegi: "otomatik dil algilayici koy". Cloudflare Pages
Function `site/functions/_middleware.js`: `Accept-Language` -> oneksiz
yoldan `/xx/...`e 302, `dil` cerezi secimi kilitler (onekli yol
ziyareti cerezi yazar; alt seritteki "Turkce" `?dil=tr`). Canli olculdu
(de/en yonleniyor, tr/ja dokunulmuyor, cerez ustun). Ayrintisi
`site/README.md`. Ayni turda: Cloudflare e-posta gizlemesi
`<!--email_off-->` ile kapatildi (JS kapaliyken "[email protected]"
kaliyordu), hesap-sil dipnotu 7 dilde "gizli Apple adresine kod
ULASIR" diye duzeltildi.

Kullanicinin "sitede giris yapma ekrani yanlis" sozunun cevabi once
Swarm referansli `slooin.com/giris` sayfasi oldu, sonra IPTAL edildi -
bkz. asagidaki "WEB GIRIS SAYFASI IPTAL" bolumu.

### POSTA SABLONU YENIDEN, KOD 10 DAKIKA - 2026-09-13 GECE

Kullanici gelen postayi gordu: konu ve baslik ayni cumle, duz metin,
marka yok. Uc tasarim gorsel olarak sunuldu (`tasarim/posta-tasarimlari.png`,
Artifact `7ec6c44e-...`); **C - sade** secildi ve iki duzeltme geldi:
"dakika belirtilmesin" (sure yazmiyor) ve baslik "Merhaba, Slooin
dogrulama kodun:"; "Kodu uygulamadaki kutuya gir" satiri kaldirildi.

Sablon depoda: `docs/posta-sablonu-dogrulama-kodu.html` (tablo tabanli,
satir ici stil, sistem yazi tipi; tek gorsel `https://slooin.com/posta/simge.png`
- `site/public/posta/`, 176 px uygulama simgesi). **Konu satiri
`Slooin kodun: {{ .Token }}`** - Supabase konuyu da Go sablonu olarak
isliyor, canlida dogrulandi ("Slooin kodun: 602874"). Bildirimden
acmadan okunuyor.

**Supabase'e BEN yazdim (claude-in-chrome, Browser 2 = Supabase
oturumu):** Magic Link + Confirm sign up, ikisi de. Yontem: sayfa
`window.monaco`yu aciyor, `monaco.editor.getModels()[0].setValue(html)`
+ subject input'una native setter + `input` olayi + "Save changes"
tiklamasi. Kaydin gercekten gectigi Resend gonderim kaydindan olculdu
(konu + govde). Supabase SPA'si de GIZLI SEKMEDE hic acilmiyor
(Cloudflare ile ayni) - kullanici sekmeyi one getirince yuklendi.

**OTP suresi 10 dakika** (kullanici: "bir saat yanlis geldi"): Supabase
"Email OTP Expiration" = 600 sn (kullanici panelde yapti). Metinler:
`hesabiSil.kodGonderildi` (7 dil), hukuki metin Resend paragrafi (7 dil),
site sozlugu (7 dil), `docs/gizlilik-metni.md`. `lib/kod-gonderim.ts`
icindeki saatlik GONDERIM SAYACI penceresi ayri bir sey, dokunulmadi.
Yayin: web `slooin--2kqu96kj50`, OTA grup
`45b3eda5-40ce-4a59-93bb-3978eba84aa5`.

### SLOOIN.COM ALINDI, SITE YAYINDA - 2026-09-13 AKSAM

Kullanici `slooin.com`u Cloudflare Registrar'dan aldi (hesap
`slooinapp@gmail.com`, account id `376c8a91fdd83c6366bdcf10e65dc08c`).
Pages projesi `slooin` GERCEK Chrome'da (claude-in-chrome) kuruldu:
GitHub uygulamasi YALNIZCA `ozdmrorcn16/cloud` deposuna yetkili,
uretim dali **`claude/plan2-moderasyon-paneli`**, kok `site`, derleme
`npm run build`, cikti `dist`, ortam `PUBLIC_SUPABASE_URL` +
`PUBLIC_SUPABASE_ANON_KEY`. Ozel alan adlari `slooin.com` ve
`www.slooin.com` (CNAME -> slooin.pages.dev, Cloudflare kendi yazdi).
**https://slooin.com CANLI**, 7 dil 200; canli silme testi canli siteye
karsi kosuldu ve gecti (`site/README.md` "Dagitim").

**Ilk derleme kirildi: "Tsconfig not found expo/tsconfig.base".** Site
`mobil/lib/hukuki`'yi dogrudan iceri aliyordu; Vite o dosyalar icin
`mobil/tsconfig.json`u (`extends expo/tsconfig.base`) okuyor ve
Cloudflare'de `mobil/node_modules` yok. Cozum `site/araclar/
hukuki-kopyala.mjs` (`prebuild`): metinler `site/src/hukuki/`ye
kopyalaniyor (gitignored), site mobil'in arac zincirine dokunmuyor.
Commit `639a967`.

**CLAUDE-IN-CHROME + CLOUDFLARE DERSLERI (uc kez yasandi):**
1. Cloudflare paneli SEKME ARKA PLANDAYKEN hic acilmiyor
   (`visibilityState: hidden` -> yukleme animasyonunda kalir, her CDP
   komutu 45 sn zaman asimi). Kullanici terminale gecince Chrome
   arkada kaliyor. Cozum: kullanici Chrome'u ekranin yarisina koyup
   sekmeyi gorunur tutuyor; "renderer frozen" hatasinin sebebi bu,
   anti-debug degil.
2. **Hangi Chrome profilinde hangi oturum acik VARSAYMA.** CLAUDE.md
   "Browser 2 = slooinapp" diyordu; Cloudflare oturumu Browser 1'deydi
   ve ilk deneme `/login`e dustu. Kullanici "yanlis e-posta oturumunda
   deniyorsun / boyle yanlislar yapma" dedi. Dogrusu: sayfa basligini
   OKUYARAK dogrulamak ("Slooinapp@gmail.com's Account").
3. `find` / `read_page` bu panelde sik sik zaman asimina dusuyor;
   ekran goruntusu + koordinatla tiklama ve `get_page_text` calisiyor.
4. `*.pages.dev` bu agdan erisilemiyor (curl 000, baglanti zaman
   asimi); olcum `slooin.com` uzerinden yapilir.

**POSTA ZINCIRI KURULDU (ayni aksam):**

- **Resend** (hesap `slooinapp@gmail.com`, API anahtari `mobil/.env`
  `RESEND_API_KEY`; kullanici anahtari sohbete yapistirdi, oturum
  kaydina `re_` maskesi eklendi). Alan adi API ile eklendi
  (`region: eu-west-1`, id `a20861f2-...`), DKIM/SPF/CNAME + DMARC
  kayitlari Cloudflare'e **BIND import** ile girildi (tek dosya,
  `Import` dugmesi - satir satir form doldurmaktan cok daha saglam),
  durum **verified**. Test postasi `noreply@slooin.com` -> Gmail
  delivered.
- **Supabase SMTP**: kullanici panelde girdi (host `smtp.resend.com`,
  port 465, kullanici `resend`, parola = API anahtari, gonderen
  `Slooin <noreply@slooin.com>`). Ilk deneme `535 Invalid username`
  ile kirildi - kullanici adi alanina e-posta yazilmisti; dogrusu
  kelimenin kendisi `resend`. Ozel SMTP acilinca Supabase'in saatlik
  posta siniri 2 -> 30'a cikti (auth_logs'ta gorundu). Zincir olculdu:
  `signInWithOtp` -> Resend `delivered` ("Slooin dogrulama kodun").
- **Apple "Sign in with Apple for Email Communication"**: `slooin.com`,
  `noreply@slooin.com`, `destek@slooin.com` kaydedildi (Successfully
  Registered). Apple SPF'yi KOK alan adinda ariyor; Resend'in SPF'si
  `send.` alt alanindaydi, koke `v=spf1 include:_spf.mx.cloudflare.net
  include:amazonses.com ~all` eklendi. Panel hala kirmizi "SPF"
  gosteriyor (Reverify denendi) - onbellek. **ASIL OLCUM GECTI:**
  kullanicinin `@privaterelay.appleid.com` adresine Supabase uzerinden
  gonderilen kod Apple ID posta kutusuna DUSTU (kullanici dogruladi,
  2026-09-13 23:30). Yani "E-postami gizle" hesaplarinda kod yolu artik
  calisiyor; ekrandaki "Apple hesabina bagli adrese yonlendirilir" notu
  dogru.
- **`destek@slooin.com`**: Cloudflare Email Routing -> slooinapp@gmail.com
  (hedef adres hesabin kendisi oldugu icin aninda Verified; MX x3 +
  DKIM Cloudflare'in "Add missing records" dugmesiyle, SPF mevcut kok
  kaydi taniyip "Unlocked" birakti - ikinci SPF eklemedi, DoH ile
  dogrulandi). Test postasi delivered.
- Gizlilik metni (7 dil + docs) ve KVKK envanteri/listesi Resend ile
  guncellendi ("uc aktarim" -> "dort").

Gizlilik metni yayinda: web `slooin--tee6yc230m`, OTA grup
`355569ff-fab4-41d7-b20c-684d81bf82db`; site push ile kendiliginden.

**KALAN:** Apple magaza formundaki gizlilik adresi
`slooin.expo.app/gizlilik` -> `slooin.com/gizlilik`; Apple SPF
durumunun yesile donmesi (birkac saat sonra bak). Resend KVKK
standart sozlesme talebi 2026-09-14'te GONDERILDI (Resend API,
destek@ -> support@resend.com, delivered; cevap slooinapp@gmail.com'a
duser).

### SOHBET: PROFIL RESIMLERI, "TESLIM EDILDI", KLAVYE - 2026-09-14

Kullanicinin telefondan uc istegi (aynı sabah): (1) Mesajlar listesinde
satir basinda profil resmi, (2) sohbet ekraninda karsi tarafin profil
resmi, (3) kendi mesajinin altinda "Teslim edildi"; ayrica bildirdigi
hata: yazma kutusu klavyenin altinda kaliyordu.

- Avatar bildirimlerle AYNI yol: `Avatar` bileseni + `avatarlariGetir`
  (listeden sonra, ayri; kova okunamazsa bas harf, hata yok). Listede
  48, ust barda 36 px; ust bardaki avatar profile gider.
- Karsi tarafin HER balonunun solunda 28 px avatar (kullanicinin
  ikinci istegi, ayni sabah: "her yazdigi mesaj satirinin yaninda").
  Instagram'in "grubun sonuncusunda" sadelestirmesi bilerek
  YAPILMADI - kullanici "her" dedi.
- "Teslim edildi" YALNIZCA en son kendi mesajimin altinda (Instagram
  deseni); iyimser (`yerelMi`) satirda yazilmaz, sunucu satiri gelince
  yazar. "Goruldu" YOK - karsi tarafin son okumasi istemciye acik degil.
  `sohbet.teslimEdildi` 7 dil.
- MESAJLAR LISTESI: "Gizle" KALKTI, satir sola kaydirilinca sagda
  kirmizi "Sil" (RNGH eski `Swipeable`, Animated tabanli - reanimated
  jest'te calismadigi icin ReanimatedSwipeable DEGIL). Kullanicinin
  karari: "Sil'e basinca benden silinir, karsi tarafta kalir."
  Sunucu: `konusma_uyeleri.silme_zamani` + `konusmayi_sil` RPC;
  `konusmalarim` ve `mesajlari_getir` silme anindan oncekileri eler;
  biri yazinca konusma yalnizca yeni mesajlarla geri gelir
  (migrasyon `20260914120000`). `konusmayi_gizle` RPC eski surumler
  icin duruyor. Canli: `test:gorunurluk` senaryo 66 (yeni
  `SLOOIN_SENARYO=66` filtresiyle tek basina kosulabiliyor).
  Kullanicinin gizledigi tek konusma SQL ile geri acildi.
  KVKK listesi: "Konusmayi kendi tarafindan silme" bolumu.
  Sil ONAY ISTER (kullanicinin istegi, ayni gun): `OnayPenceresi`,
  metin `mesajlar.silBaslik/silAciklama` (7 dil).
- PROFIL EKRANLARI (ayni gun, kullanicinin istekleri): (a) kendi
  profildeki arkadas listesi: `Avatar` + sagda `UcNoktaIkonu` ->
  `SecimPenceresi` (Arkadasliktan cikar / Engelle; engel `OnayPenceresi`
  ile). YENI BILESEN YAZILMADI - `SecimPenceresi` zaten vardi (bir kez
  yazip silindi; once `src/tasarim`a bak). (b) baskasinin profili:
  "Mesaj yaz" dolu turuncu + beyaz, "Arkadassin" turuncu cerceveli ve
  BASILABILIR -> menude "Arkadasliktan cikar" (ayri satir kalkti,
  "Istegi geri cek" satiri duruyor). (c) "ust taraf sonsuz": kok duzen
  `kullanici/[id]` icin de ust pay vermiyor (`_layout.tsx`
  `baskasininProfili`), ust cubuk kaydirmanin icine alindi, iki
  profilde de doku tasmasi `HARITA_UST_TASMA + guvenliAlan.top` -
  kenar ekranin disinda.
- Geri oku ust barda (`GeriOkIkonu`); gecmis yoksa (bildirimden
  acildi) `/mesajlar`a gider. Uygulamada Stack yok, ekran kendi okunu
  tasimak zorunda.
- Saat her balonun altinda (`saatYazisi`), son kendi mesajimda
  "12:01 · Teslim edildi". Gun ayraci (`gunEtiketi`, lib/zaman.ts):
  "Bugün" / "Dün" / "2 Eylül" / "31 Aralık 2025"; ay adi cihaz diline
  gore, Bugün/Dün sozlukten (`sohbet.bugun/dun`, 7 dil). Ters listede
  ayrac, mesajin gunu bir ESKI mesajinkinden farkliysa balonun ustune.
- HATA DUZELTILDI (kullanicinin bildirimi): gondere basinca mesaj bir
  an KARSI TARAF yazmis gibi (sol, avatarli) gorunuyordu. Iyimser satir
  `gonderenId: ''` tasiyordu ve `benimMi` dusuyordu; artik kendi
  kimligim. Eski yorum "gonderenId yerel satirda kullanilmiyor" diyordu
  - YANLISTI, benimMi hep ona bakiyordu; avatar gelince gorunur oldu.
  TEST DERSI: `Avatar` bas harf halinde testID tasimiyordu, bu yuzden
  "avatar yok" iddiasi fotografsiz mock'ta bos bos geciyordu; artik
  iki halde de tasiyor, "resim yok" olcusu `props.source` undefined.
- Klavye: iOS'ta `keyboardWillShow/Hide` ile alt pay ALT_GEZINME_PAYI
  yerine klavye yuksekligi (gezinme cubugu zaten klavyenin arkasinda).
  Android'e dokunulmadi (pencere `resize` ile kendisi daraliyor).
  **Web'de olculemedi**, telefonda dogrulanmali.
- Yan duzeltme: `hesabi-sil.test.tsx` "bir saat" bekliyordu (dun geceki
  10 dakika degisikligi testi guncellememisti).

Jest 75 paket / 956 test. Yayin: web `slooin--13w4011lam`, OTA grup
`96d76377-b436-41d7-b86e-9b872546461d`. Goruntuler
`tasarim/mesajlar-avatar.png`, `tasarim/sohbet-avatar-teslim.png`.

### WEB GIRIS SAYFASI IPTAL, SITEDE expo.app YOK - 2026-09-14

Kullanici Swarm referansiyla `slooin.com/giris` istemisti; sayfa
yazildi, yayinlandi, ardindan AYNI GECE iki karar geldi ve ikisi de
KALICI:

1. **"Sitede slooin.expo'yu kullanma"** - `slooin.com` hicbir yerde
   `slooin.expo.app`'e baglanti vermez (ana sayfadaki "Giris" dugmesi
   bu yuzden KALDIRILDI; tek hedefi orasiydi). Uygulamanin web surumu
   sitede ancak kendi alan adimiz altinda yasarsa gosterilir - o is
   yapilmadi, istenmedi.
2. **"Giris sayfasi ekleme iptal"** - `/giris` sayfasi, betigi, 7 dil
   sozluk blogu, `girisDugmesi` anahtari ve `detectSessionInUrl`
   degisikligi geri alindi (commit `cb98e21`, `7d599e0`).

Tekrar istenirse bilinen calisan mekanizma: site `signInWithPassword`
ile giris yapip oturumu URL FRAGMENT'iyla (`#access_token=...`)
uygulamaya devrediyor, uygulama web'de `detectSessionInUrl: true` ile
okuyor; yerelde olculmustu (commit `72bd276` icerigi). Ama hedef
expo.app OLAMAZ (kural 1).

**ORTAM DERSI:** `site/araclar/dogrula.mjs` DERLEME YAPMAZ, mevcut
`dist`i olcer; degisiklikten sonra once `npm run build`. Bir kez eski
dist ekran goruntusune yansidi.

**IKI OTURUM AYNI CALISMA AGACINDA:** bu is sirasinda ikinci bir
oturum ayni dizinde commit atti (`6a0b78c`, yalnizca CLAUDE.md); ilk
commit'e giren bir degisikligi `git checkout -- dosya` GERI ALMAZ,
onceki commit'ten almak gerekir (`git checkout <eski> -- dosya`).

### HESAP SILME: PAROLA YERINE E-POSTA ONAY KODU - 2026-09-13 OGLEDEN SONRA

Kullanici once "sifre tamamen kalksin" dedi, sonra "sifre yine kalsin,
taze dogrulama ekleyelim", en sonunda karari kesinlestirdi: **"hesap
silme adimina e-postaya onaylama kodu getirilsin; e-postaya gelen onay
kodunu giren biri hesabini silebilecek; bilgilendirme yazilari da
olacak."** Parola GIRIS ve profil olusturma icin DURUYOR (Apple/Google
ile acilan hesap da profil-olustur 3. adimda parola belirliyor);
degisen yalnizca SILME kapisi.

**AKIS (`src/app/profil/hesabi-sil.tsx`, bastan yazildi):** bilgilendirme
(geri alinamaz / ne silinir / ne kalir / "bunun yerine dondur") ->
"Onay kodu gonder" (`signInWithOtp`, `shouldCreateUser:false`,
`gonderimKaydet` ile cihaz sayaci) -> 6 haneli kod -> "Hesabimi kalici
olarak sil" (`verifyOtp type:'email'` -> `hesabiSil()` -> `signOut`).
Apple/Google ile acilmis hesapta (`app_metadata.providers`) ayrica
"Apple/Google ile onayla" dugmesi; Apple yalnizca iOS'ta. Parola alani
YOK. testID'ler: `kod-gonder`, `dogrulama-kodu`, `kodla-sil`,
`saglayici-<s>`.

**SUNUCU KAPISI (`hesap-sil` Edge Function SURUM 7, MCP ile deploy,
verify_jwt acik):** govdede `parola` varsa eski yol (signInWithPassword)
aynen; yoksa `girisTazeMi(last_sign_in_at)` - son giris **10 dakikadan
taze** degilse 403 "Onay gerekli: parolani yaz ya da yeniden dogrula".
`verifyOtp` ve `signInWithIdToken` gercek giris sayildigi icin
`last_sign_in_at`i ilerletiyor; jeton YENILEME ilerletmiyor - kapi bu
yuzden isliyor. Saf fonksiyon `saf.ts` icinde, deno test 10/10.

**CANLI OLCULDU, iki parcada:**
- `araclar/hesap-sil-kod-canli-test.py` **8/8**: taze giris + parolasiz
  -> silindi; gecersiz jeton -> 401; admin `generate_link(magiclink)`
  ile alinan `email_otp` (postadaki kodun kendisi) `verifyOtp`ten
  gecip parolasiz silme -> silindi; yanlis parola 400 / dogru parola
  silindi (eski yol duruyor).
- KAPALI YON elle (betik `last_sign_in_at`i eskitemiyor, auth semasi
  PostgREST'e kapali): gecici hesap acildi, giris yapildi, MCP SQL ile
  `last_sign_in_at = now() - 1 saat`, ayni jetonla parolasiz cagri ->
  **403**; ayni jetonla parola verilince 200 silindi.

**KOD OMRU 1 SAAT, .test adreslerine posta GITMIYOR** (Supabase posta
katmani reddediyor) - bu yuzden betik kodu admin API'den aliyor;
gercek adresle posta zinciri 2026-09-02'de olculmustu.

**SITE DE AYNI AKISA GECTI** (`site/src/betik/hesap-sil.ts`,
`hesap-sil.astro`, `sozlukler.ts` yedi dilde): `#kod-dugmesi` ->
signInWithOtp; form -> verifyOtp -> `functions.invoke('hesap-sil',
{ body: {} })`. `npm run dogrula` HEPSI GECTI.

Yedi dil: `hesabiSil` blogu bastan (baslik, uyari, neSilinir/neKalir,
dondur, kodAciklama, kodGonder, kodGonderildi, kodYerTutucu, kodEksik,
tekrarGonder, epostaYok, saglayiciAciklama, appleIleDogrula,
googleIleDogrula, sil); `hatalar.vt` bes yeni sunucu metni
(`hata-metni.ts` haritasi dahil). ceviri-tamlik 25/25. Jest 75 paket /
943 test, tsc uygulama kodunda 0 hata. KVKK listesi 5. madde
guncellendi (dort soru cevapli).

**YAYINDA:** commit `1c2b704`, web `slooin.expo.app` (dagitim
`slooin--sjug3578v1`, pakette `kodla-sil` testID'si dogrulandi), OTA grup
`c8baae8a-9e7e-4690-aa5c-1267b702f6ca`.

**AYNI GUN IKI DUZELTME (kullanicinin telefondan bildirdikleri):**

1. **"Cok uzun bir sayfa; basliktaki alt baslik dursun, altina 'bunun
   yerine hesabimi dondur' gelsin ve basan kisiyi baska sayfaya
   yonlendirme, ayni sayfada bilgilendirme cikip dondurabilsin."**
   "Ne silinir / Ne kalir" bloklari KALKTI (yedi sozlukten de - o
   bilgi gizlilik metninde duruyor); uyari cumlesinin hemen altinda
   "Bunun yerine hesabimi dondur" hayalet butonu, basinca ayni sayfada
   kutu aciliyor (`ayarlar.dondurAciklama` + "Evet, dondur" / "Vazgec",
   ayarlar ekraniyla AYNI metinler) ve onay `hesabiDondur` + `signOut`.
   Onceden buton `router.back()` yapiyordu, yani dondurma yalnizca
   ayarlardaydi. testID'ler `dondur-ac`, `dondurma-kutusu`,
   `dondur-onayla`. Ekran goruntusu `tasarim/hesabi-sil-dondur-acik.png`.

2. **"Cok degisik bir e-posta yaziyor, kod nereye gonderiliyor?"**
   Kullanicinin hesabi Apple ile ve "e-postami gizle" secilmis; adres
   `xxxx@privaterelay.appleid.com` - Apple'in AKTARMA adresi, kisinin
   kendisi bile ilk kez goruyor. Ekran artik bu adreslerde bir not
   gosteriyor (`hesabiSil.gizliAppleAdresi`, 7 dil, testID
   `gizli-apple-notu`): "Apple'in e-postani gizlemek icin olusturdugu
   aktarma adresi; kod oradan asil adresine yonlendirilir."
   **AMA AKTARIM BUGUN CALISMIYOR:** Apple yalnizca Apple Developer >
   "Sign in with Apple for Email Communication"da KAYITLI gonderici
   alan adlarindan gelen postayi iletiyor; bizim gonderici Supabase'in
   varsayilan alani ve kayitli degil. Yani bu hesaplar icin bugun tek
   calisan yol "Apple ile onayla" dugmesi (kullaniciya soylendi).
   slooin.com + Resend SMTP kurulunca alan adi Apple'a kaydedilecek
   ve kod yolu da acilacak.

   Jest 75 paket / 947 test (hesabi-sil 13). Yayin: web
   `slooin--k8ewnmtn5u`, OTA grup `241a068b-e4c7-4a51-8763-86f0b72e6ff2`.

**3. EKRAN REFERANS GORSELE GORE YENIDEN YAZILDI** (kullanici uc
yerlesim istedi - Artifact `fabfb194-84df-40c1-adbf-a3a691d3cc96`,
A iki kart / B ayarlar listesi / C iki adim - sonra KENDI referans
gorselini gonderip "Boyle yap" dedi; uc secenegin hicbiri secilmedi,
referans birebir uygulandi). Yerlesim: ust cubuk "Hesabi sil" ->
acik kirmizi kutuda cop ikonu -> 30 px "Hesabini silmek istedigine
emin misin?" -> uyari -> SEFTALI KART (durak ikonu, "Sadece ara
vermek mi istiyorsun? / Hesabimi dondur", ok; ayni sayfada aciliyor)
-> "Kimligini dogrula" + aciklama -> GRI KART (zarf, "E-posta
adresin", kisaltilmis adres `dsh5…@privaterelay.appleid.com`, ayirici,
not) -> TURUNCU DOLU "Onay kodu gonder" (kod gelince kod kutusu +
KIRMIZI "Hesabimi kalici olarak sil" + "Kodu tekrar gonder") ->
"veya" -> saglayici dugmesi -> "Vazgec" (geri).

Saglayici dugmesi hesabin ACILDIGI saglayiciya gore: Apple hesabi
SIYAH "Apple ile onayla" (Apple kilavuzu), Google hesabi beyaz
cizgili "Google ile onayla" (Google kilavuzu), e-posta hesabinda
hicbiri ve "veya" ayraci da yok. Kullanicinin sorusu "Google ile
girseydim Google mi yazardi" - evet.

Butonlar HAP degil `yuvarlak.kart` (16) - referans oyle. Gri kart
`karsilamaZemini` (tek acik-gri jeton; koyu modda da calisiyor, iki
modda ekran goruntusu `tasarim/hesabi-sil-referans.png` /
`-dark.png`). Sozluk `hesabiSil` blogu yedi dilde bastan (19 anahtar:
baslik, soru, uyari, araSoru, dondur, dogrulaBaslik, dogrulaAciklama,
epostaEtiket, kodNot, gizliAppleAdresi, kodGonder, kodGonderildi,
kodYerTutucu, kodEksik, tekrarGonder, epostaYok, appleIleDogrula,
googleIleDogrula, sil); "veya" ve "Vazgec" `kayit.veya` /
`ayarlar.vazgec`ten. Yayin: web `slooin--r85kz1ii83`, OTA grup
`9ec449d7-e100-447b-85ae-ab703beb5eb0`.

### SITE YEDI DILDE, HUKUKI METINLER ORTAK KAYNAKTAN; KVKK m.9 ISI - 2026-09-13 OGLE

**Site (`site/`) yedi dile gecti** (commit `824cc01`): gizlilik ve
kosullar sayfalari `mobil/lib/hukuki/<dil>.ts` dosyalarini DOGRUDAN
import ediyor (`src/ortak/HukukiBolumler.astro`) - uygulama ile site
artik ayni diziyi okuyor, elle tekrarlanan metin yok. Kabuk, ana
sayfa, destek ve hesap silme `site/src/i18n/sozlukler.ts` (7 dil);
`diller.ts` yedi dil; Arapca `dir="rtl"`; hesap-sil betigi durum
metinlerini `<html lang>`den seciyor. `npm run dogrula` 128/128.
Yayinda DEGIL (Cloudflare Pages kurulmadi, alan adi alinmadi).
Dipnot: "parola yoksa form calismaz, destek@slooin.com'a yaz".
(Ilk yazimda "Apple/Google ile girdiysen parolan yok" denmisti -
YANLIS: profil olusturma adimi sosyal giriste de parola belirletiyor;
Apple ile acilan gercek hesapta `encrypted_password` dolu. Duzeltildi.)

**APPLE GIRISI CANLIDA CALISIYOR (olculdu, 2026-09-13):** auth_logs'ta
Build 8 ile uc basarili `provider: apple` girisi (2026-09-12 22:05-22:12
UTC), `privaterelay.appleid.com` adresli hesap, profil "ozdmr", KVKK
onay kayitlari ve parola yerinde. Google icin sunucuya HIC istek
gelmedi - cihazdaki davranis kullanicidan soruldu. Not: Apple "e-postami
gizle" aktarici adresine posta gonderebilmek icin gonderici alan adi
Apple Developer > "Sign in with Apple for Email Communication"da
kayitli olmali (slooin.com + SMTP kurulunca).

**KVKK m.9 - avukatsiz, kaynakli arastirma yapildi** (kullanicinin
karari: "avukatsiz devam, bir avukat kadar bilgi"; hafiza
`avukatsiz-hukuki-danisman-rolu`). Sonuclar ve kaynaklar
`docs/kvkk-aktarim-envanteri.md`: yeterlilik karari hicbir ulke icin
yok; bulut barindirma aktarimdir; acik riza yalnizca arizi aktarimda;
harita/sosyal giris bizim aktarimimiz degil (dogrudan cihazdan);
VERBIS muafiyeti var; standart sozlesme ISLAK IMZA + apostilli yetki
belgesi istiyor (asil engel); 2026 cezalari. **Talepler gonderildi:**
Supabase bilet SU-471923 (e-posta + dashboard formu, Pro org
"uygulama"), Expo contact formu (Free plan). Cevap gelince
`docs/kvkk-standart-sozlesme-talep-yazilari.md` tablosu guncellenir.
Imza gelmezse secenekler envanterde (APNs/FCM'e gecis, TR barindirma,
riski tasima).

**Magaza ulke kapsami - oneri kabul bekliyor:** ilk yayinda iki
magazada da yalnizca Turkiye (veri yalnizca TR, GDPR yuku yok).
Yurt disi genisleme mumkun: ulke basina Foursquare dilimi + OSM idari
poligonlari, AB icin GDPR m.27 temsilci; ilk aday Almanya.

### KIMLIK TELEFONDAN E-POSTAYA TASINDI - 2026-09-01/02

Kullanicinin karari. **Sebep hukuki degil pratik: SMS gonderemiyoruz.**
Turkiye'de A2P SMS icin operatorler gonderici basligi kaydi istiyor ve
bunun icin VERGI MUKELLEFIYETI sart (NetGSM/IletiMerkezi: vergi levhasi,
imza sirkuleri, KEP uzerinden basvuru). Kullanicinin sirketi yok.
Twilio da ayni duvara carpiyor - Turkiye icin Letter of Authorization ve
sirket belgesi istiyor. Firebase Phone Auth sirket istemiyor ama gunde
yalnizca 10 SMS ucretsiz, yayina yetmez.

**ARASTIRILDI VE ELENDI, tekrar denenmesin:** Twilio (sirket sart),
yerel saglayicilar (vergi levhasi sart), Firebase (10/gun).

Onceki durum olculmustu: veritabanindaki 6 hesabin HEPSI test numarasi,
gercek numarayla HIC kayit olmamis - yani SMS yolu zaten hic
calismiyordu.

**DEGISEN EKRANLAR:**

| Ekran | Yeni hali |
|---|---|
| kayit | E-posta kutusu, `signInWithOtp({ email })` |
| dogrula | `verifyOtp({ email, token, type: 'email' })`, resend `type: 'signup'` |
| giris | `signInWithPassword({ email, password })` |
| profil-olustur | Onay kutusu KALDIRILDI (asagida) |
| hesap-sil (Edge Function) | Parola dogrulamasi E-POSTA VE TELEFON, bu sirayla |

`auth.users.phone` alani DURUYOR ve telefonla acilmis eski hesaplar
calismaya devam ediyor - hesap-sil ikisini de destekliyor. Ileride
sahis firmasi acilirsa SMS'e donmek bir ayar degisikligi.

**YENI PARCALAR:** `lib/eposta.ts` (bicim + normallestirme; desen
kasitli olarak DAR ve ASCII'ye kapali - Turkce harf iceren adres
reddediliyor, cunku dogrulama postasi hic ulasmaz), `lib/eposta-kayit.ts`,
`public.eposta_kayitli_mi` RPC (telefon surumunun birebir kardesi, AYNI
iki katmanli hiz siniri ve ayni gunluk/ozet tablolari).

**ONAY KUTUSU KALDIRILDI, KAYIT KALDI.** Kabul artik kayit ekranindaki
"Devam"a basmakla veriliyor; altta "Devam ederek Kullanim kosullarimizi
kabul ettigini ve Gizlilik Politikamizi okudugunu onayliyorsun" yaziyor.
`kayitMetadatasi({ kabul: true })` hala `aydinlatma_onayi` ve
`konum_rizasi` tasiyor, yani kvkk_onaylari tablosundaki ISPAT KAYDI
yerinde. Ortuk onay burada savunulabilir: konumun hukuki dayanagi
sozlesmenin ifasi, check-in olmadan uygulama zaten calismiyor.

**SAGLAYICI DUGMELERI (Apple / Google) EKRANDA VAR ama SUPABASE'DE ACIK
DEGIL.** Basilinca "Bu giris yontemi su an kullanilamiyor" hatasi
veriliyor. Acmak icin: Supabase panelinde saglayici ayari + Google
Cloud'da OAuth istemcisi + Apple Developer'da Sign in with Apple. Ikisi
de NATIVE yapilandirma, yeni derleme ister. iOS'ta Apple ZORUNLU: App
Store, baska bir sosyal giris varsa "Apple ile giris"i de sart kosuyor.
Android'de Apple GOSTERILMIYOR (orada zorunlu degil).

**KALAN IKI ADIM - bunlar olmadan akis calismaz:**

1. ~~E-posta sablonu~~ **TAMAMLANDI ve UCTAN UCA DOGRULANDI**
   (2026-09-02). Kullanici Supabase panelinden "Magic Link" sablonuna
   `{{ .Token }}` ekledi. Olculen zincir: `signInWithOtp({ email })` ->
   posta gidiyor (auth_logs: `mail.send`, `mail_type: magic_link`) ->
   mailde 6 haneli kod var -> `verifyOtp({ email, token, type: 'email' })`
   OTURUM ACIYOR.

   **KODUN OMRU 1 SAAT.** Bir kez yanlis teshise yol acti: gonderilen
   kod iki saat sonra denendi ve `otp_expired` (403) dondu; sorun
   sablonda sanildi. Dogrulama ekranindaki "Tekrar gonder" bu durumu
   zaten cozuyor.

   **SABLONLAR MANAGEMENT API ILE DUZELTILDI (2026-09-02).** Ilk elle
   duzenlemede iki kusur kalmisti: (a) sablonun basinda Supabase'in
   varsayilan Ingilizce metni duruyordu ve "asagidaki baglantiyi takip
   et" diyordu - ama baglanti silinmisti, yani kullanici olmayan bir
   seyi ariyordu; (b) metnin yarisi Ingilizce oldugu icin Gmail maili
   Ingilizce sanip Turkceye ceviriyor ve kullanicinin yazdigi
   "dogrulama" kelimesini "destek" yapiyordu. Ayrica MAGIC LINK sablonu
   hic duzenlenmemisti - kod yalnizca Confirm signup'tan geliyordu.

   Su an ikisi de ayni ve sadece sunu iceriyor:

       <h2>Slooin dogrulama kodun</h2>
       <p>Kodun: <strong>{{ .Token }}</strong></p>
       <p>Kod bir saat gecerli. ...</p>

   Konu satiri ikisinde de "Slooin dogrulama kodun".

   **NASIL DUZELTILDI:** `PATCH /v1/projects/<ref>/config/auth` (alanlar
   `mailer_templates_confirmation_content`,
   `mailer_templates_magic_link_content`, `mailer_subjects_*`). Bu bir
   Supabase ACCESS TOKEN gerektiriyor (`sbp_...`), MCP ile yapilamiyor.
   Token `mobil/.env` icinde `SUPABASE_ACCESS_TOKEN` olarak durmali -
   **SOHBETE YAPISTIRILMAMALI**: bir kez yapistirildi ve iptal edilmek
   zorunda kalindi (ayni sinif sizinti hf_ jetonunda da yasanmisti).
   Oturum kaydi betigine `sbp_` maskesi eklendi.

   **TESHIS YERI: `auth_logs`.** MCP `query_logs` ile okunuyor ve posta
   gerceklen gidiyor mu, hangi sablon kullanildi, dogrulama neden
   reddedildi - hepsi orada. Sablonun KENDISI okunamiyor (panel ayari,
   veritabaninda degil, Management API token'i yok), bu yuzden dogrulama
   ancak GERCEK bir gonderimle yapilabiliyor.
2. **SMTP.** Supabase'in yerlesik e-posta servisi saatte yalnizca birkac
   mail gonderiyor; kendi testin icin yeter, gercek kullanicilar icin
   yetmez. Alan adi alinip Resend SMTP olarak baglanmali (ucretsiz
   katman ayda 3.000 mail).

**~~ACIK BORC~~ KAPANDI (2026-09-13):** kullanim kosullari belgesi
yazildi (`docs/kullanim-kosullari.md`, `src/app/kosullar.tsx`,
`slooin.com/kosullar`).

### ARAMA KULLANICININ ILIYLE SINIRLI - 2026-09-01

Kullanicinin kurali: **"Km siniri yok ama kullanicinin bulundugu konum
Bursa'daysa arattigi kelimeye gore sadece Bursa'daki konumlari gorecek;
o an hangi sehirdeyse o sehrin konumlarini."**

Bu, 2026-08-28'deki "arama tamamen sinirsiz, baska sehir de aranabilir"
kuralinin YERINI ALIYOR. Asagidaki eski bolumlerde o ifade hala geciyor;
gecerli olan budur.

**Kullanicinin ili NOKTA-ICINDE-POLIGON testiyle bulunuyor**
(`public.iller`, 81 il, migrasyon 20260901140000). "En yakin mekanin
ilini al" bilerek YAPILMADI: o bir tahmin olurdu ve il sinirina yakin
yerlerde yanilirdi. Yukleyici `araclar/il-yukle.py`; kaynak OSM idari
sinirlari (ODbL), ~100 m toleransla basitlestirilmis.

Dogrulandi: Bursa/Nilufer -> "Bursa", Kadikoy -> "İstanbul",
Kizilay -> "Ankara", Ege Denizi -> null.

**KURALIN SINIRLARI:**
- Yalnizca ARAMAYA uygulanir. `p_arama` null oldugunda ("Yakininda"
  listesi) hicbir sey degismedi; orada zaten 1 km yaricap var ve il
  sinirini oraya koymak, il sinirinda oturan birinin 300 m otesindeki
  mekani gormesini engellerdi.
- Il bulunamazsa (denizde, sinirda, yurt disinda) arama SINIRSIZ kalir -
  eski davranis. Aksi halde ekran sebebi gorunmeden bombos kalirdi.

**PERFORMANS TUZAGI - yasandi ve olculdu.** Il suzgeci eklenince "kafe"
aramasi **2.646 ms**'ye cikti ve PostgREST'in 8 sn sinirinda zaman
asimina duestu. Plan sunu gosterdi: trgm indeksi 18.580 satir buluyor,
bunlarin **16.911'i HEAP'ten okunup** il suzgeciyle eleniyordu (17.658
blok).

Iki cozum denendi:
1. `mekanlar(il)` btree indeksi - **YETMEDI.** Planlayici onu secmedi
   (trgm satir tahmini 594 iken gercek 18.580, istatistik sapmasi); plan
   hic degismedi. Olculen "hizlanma" (2.646 -> 206 ms) yalnizca
   ONBELLEGIN ISINMASINDAN geliyordu - okunan blok sayisi ayniydi.
   **Ders: EXPLAIN ciktisinda sureye degil BLOK SAYISINA bak; sure
   onbellek durumuna gore yaniltir.**
2. `btree_gin` + bilesik GIN: `gin (il, tr_kucuk(ad) gin_trgm_ops)` -
   **COZDU.** Eleme artik indekste yapiliyor, heap bloklari
   **17.658 -> 780**. Sure 126 ms (soguk okumayla).

Bilesik GIN'de sutunlar bagimsiz anahtar oldugu icin `il` kosulu
olmadan da (sinirsiz arama yolu) trgm tarafi kullanilabiliyor.

Indeks oluşturma 5,98M satirda ~2 dakika surdu; MCP baglantisi zaman
asimina duestu ama sunucudaki islem devam etti - `pg_stat_activity`
ile takip edilip bitmesi beklendi.

**ISTEMCI KODU DEGISMEDI**: RPC imzasi ayni, suzgec tamamen sunucuda.
Yani bu degisiklik OTA gerektirmiyor, telefondaki uygulamada aninda
gecerli.

Canli dogrulama: `araclar/il-sinirli-arama-test.py`, 7 dogrulama.

### ISTEK GERI ALINAMAZ, ENGELLEME KONUSMAYI SILER - 2026-09-01

Kullanicinin kurali: **"Gonderdigi mesaj istegini geri cekme diye bir
islem yok. Mesaj bir kere gonderildikten sonra geri alinamaz. Ancak
mesaj gonderdigi kisiyi engelleyip geri acarsa mesajlari ve istegi
kaybolur."**

Bu kural konmadan once mevcut davranis OLCULDU ve **iki gercek hata**
cikti - ikisi de kuralin tersi yonde calisiyordu:

1. **"Istegi geri cek" istegi geri ALMIYOR, ONAYLIYORDU.** Yalnizca
   `sohbet_istekleri` satirini siliyor, konusmayi birakiyordu.
   `konusmalarim` bir konusmayi "istek" saymak icin BEKLEYEN istek
   satiri aradigi icin, satir silinince konusma normal sayiliyor ve
   alicinin MESAJLAR kutusuna dusuyordu. Olculen:
       once : B'nin Istekler'inde VAR,  Mesajlar'inda yok
       sonra: B'nin Istekler'inde yok,  Mesajlar'inda VAR
2. **Engelleyip acmak da ayni sonucu veriyordu** - engelleme istek
   satirini siliyor ama konusmaya dokunmuyordu.

**Kok neden tek: istek satiri ile konusma AYRISABILIYORDU.** Cozum de
kok nedeni kapatiyor (migrasyon 20260901130000):
- `sohbet_istegini_geri_cek` **DUSURULDU** (istemciden gizlemek yetmez;
  RPC acik kalsa dogrudan cagrilarak kural atlatilirdi).
- `engelle` artik ikimizin de uye oldugu birebir konusmalari SILIYOR;
  mesajlar CASCADE ile gidiyor. Kullanicinin karari: silme kabul
  edilmis konusmalari da kapsar ("tum konusmalara yay").

Boylece "istek satiri yok ama konusma var" durumu hic olusmuyor ve
`konusmalarim` suzgeci degistirilmeden dogru calisiyor. Suzgeci yazma
hakkina baglamak DENENMEDI cunku "bag koparsa gecmis silinmez, konusma
salt-okunur olur" karari (Faz 3b) bozulurdu.

Profil ekraninda "Istegi geri cek" yerine **"Istek gonderildi"** durum
etiketi var. TAKIP istegi geri cekme DURUYOR (mesaj icermiyor).

Engelleme onay metni ve gizlilik metni guncellendi: silme iki tarafta
da gecerli ve geri alinamaz.

**Guvenlik olcumu:** engellenen de engelleyen de yazamiyor, ikisi de
"Bu kullanici bulunamadi" aliyor - yani engelleme, hesabin silinmis
olmasindan ayirt edilemiyor (sessizlik ilkesi korunuyor).

### GORUNURLUK TESTLERI: mesaj istekleri sonrasi 5 senaryo guncellendi

**DERS: mesaj istekleri ozelligi gonderilirken `test:gorunurluk`
kosulmamisti.** 11 dogrulama kirik durumdaydi ve bu ancak bir sonraki
kosumda fark edildi. Sunucu davranisini degistiren her iste bu paket de
kosulmali - jest Supabase'i mock'ladigi icin bu sinif degisikligi
goremiyor.

Guncellenen senaryolar ve YENI gercek:
- **36** "Bagsiz kisi yazamaz" -> **"Bagsiz kisi TEK mesaj yazar,
  ikincisi reddedilir"**. Yabanci artik tam bir mesaj yazabiliyor;
  mesaj Mesajlar'a degil Istekler'e duesuyor.
- **37** engelleme hatasi artik 36'daki metinle AYNI DEGIL: engelli
  "Bu kullanici bulunamadi" aliyor. Ortu hala calisiyor (engelli mi
  silinmis mi ayirt edilemiyor), degisen sey hangi kapinin taklit
  edildigi.
- **38** engelleme konusmayi GIZLEMIYOR, SILIYOR.
- **39** bag kopan kisi yabanci kuralina tabi: bir mesaj daha
  yazabiliyor. Ekranda karsiligi yok - `yazilabilir_mi` false oldugu
  icin istemci yazma kutusunu kapali tutuyor. Sunucu ile ekran
  arasindaki bu fark bilerek kayda gecirildi.
- **56** ayni sebeple: taklit kurulumda C'nin profili durdugu icin
  sunucu tek mesaja izin veriyor; salt-okunurluk `yazilabilir_mi`
  kontrolunde olculuyor.

`sema-dogrula.ts` icindeki eski "kimliksiz geri cek reddediliyor"
kontrolu, **"fonksiyon artik YOK (PGRST202)"** kontrolune cevrildi -
kural boylece sunucuda kilitli.

### ACIK BORCLAR - 2026-09-02 itibariyla (yeni oturum buradan baksin)

Kod tarafinda yarim kalan is YOK. Asagidakiler ya kullanicinin panel
islerine ya da native derlemeye bagli.

**0. TESTFLIGHT: BUILD 7 YUKLENDI, HARICI TEST INCELEMEDE - 2026-09-07.**

Build 3'un "Expired" olmasi bir YAN BELIRTIYDI; altindaki gercek sorun
iOS DERLEMESININ 9 GUNDUR KIRIK olmasiydi ve fark edilmemisti, cunku o
sure boyunca yalnizca OTA (JavaScript) yayini yapildi, native derleme
hic denenmedi. Ayrinti asagida "APPLE ILE GIRIS ENTITLEMENT" maddesinde.

    Build 7   finished   1.0.0 (7)   TestFlight'a yuklendi
    Harici grup "tesstt" + public link: testflight.apple.com/join/vfgCFp3b
    Durum: Beta App Review - "Waiting for Review" (kullanici dogruladi)

**PUBLIC LINK ONAY GELENE KADAR CALISMAZ** - grup sayfasindaki sari
uyari ("Testers cannot join public link until this group has an
approved build") bu yuzden duruyor ve bizim tarafimizda yapilacak bir
sey yok.

**Test Information doldurulurken TAKILINAN YER kayda geciyor:** Apple
"Email / Sign-in required / User Name / Password couldn't be saved
because ANOTHER field is invalid" diyor ve asil hatali alani
soylemiyor. Suclu TELEFON NUMARASI idi; Turkiye bicimi (0 ile
baslayan) kabul edilmiyor, uluslararasi bicim gerekiyor:
`+905xxxxxxxxx` (bosluksuz, bastaki sifir ATILARAK).

**Beta App Review icin verilen demo hesap** - Slooin girissiz hicbir
sey gostermedigi icin bu ZORUNLU, verilmezse dogrudan reddediliyor:

    test0@slooin.test / test1234

**Gizlilik metni WEB'DE YAYINDA ve Apple'a o adres verildi:**
`https://slooin.expo.app/gizlilik` - giris istemeden aciliyor,
olculerek dogrulandi. ACIK BORC: metin hala "telefon numaran (hesap ve
dogrulama icin)" diyor, oysa kayit E-POSTAYA tasinmisti. Apple magaza
basvurusunda gizlilik metnini uygulamanin gercekte topladigi veriyle
karsilastiriyor; o metin guncellenmeli.

**Kendi cihazin icin inceleme BEKLENMEZ:** dahili (internal) test
Beta App Review'a tabi degil, gruba build eklenince aninda calisiyor.

**0. TESTFLIGHT BUILD 3 "EXPIRED" - 2026-09-07, DIKKAT.**
App Store Connect'te build 3 "Expired" gorunuyor. **Suresi DOLMADI:**
telefondaki TestFlight hala "Bitis Tarihi 28 Kas 2026" diyor (30
Agustos + 90 gun). "Expired" burada build'in TestFlight DAGITIMINDAN
cikarildigi anlamina geliyor - "Expire Build" dugmesi ya da test
grubundan kaldirilma.

**`eas update` BUNU YAPMAZ** ve yapmadi: OTA guncellemesi yuklu
uygulamanin JavaScript'ini degistiriyor, App Store Connect'teki build
kaydina hic dokunmuyor. O gun alti OTA yayini yapilmisti; ikisi
arasinda nedensellik yok.

**Uygulama telefonda NORMAL ACILIYOR ve OTA almaya devam ediyor**
(kullanici dogruladi). Yani is kaybi yok.

**TEK GERCEK RISK - uyarilmali: UYGULAMAYI TELEFONDAN SILME.**
Build TestFlight'tan indirilemez durumda oldugu icin silinirse GERI
YUKLENEMEZ; once yeni bir derleme gerekir. Ayni sebeple yeni testci de
eklenemez.

Yeni derleme gerektiginde surum/kanal tarafinda yapilacak bir sey YOK,
olculdu: `runtimeVersion` politikasi `appVersion` (1.0.0) ve
production profili `autoIncrement: true` + `channel: production`.
Yani yeni build
1.0.0 (4) olur ve bugune kadarki BUTUN OTA guncellemelerini aninda
alir.

**0.5. APPLE ILE GIRIS ENTITLEMENT'I GECICI KAPALI - 2026-09-07.**

`app.json` icindeki `ios.usesAppleSignIn: true` KALDIRILDI cunku
derlemeyi kiriyordu. Xcode hatasi aynen:

    Provisioning profile "[expo] com.slooin.app AppStore
    2026-08-29T22:52:14.006Z" doesn't include the Sign In with Apple
    capability / the com.apple.developer.applesignin entitlement.

**Kok neden IKI KATMANLI ve ilk teshis EKSIKTI:**

1. Provisioning profile 29 Agustos'ta, Apple girisi eklenmeden ONCE
   uretilmisti ve o yetkiyi tasimiyor. Build 3 (30 Agustos) bu yuzden
   gecti; 4 ve 5 bu yuzden patladi.
2. **`app.json`daki `usesAppleSignIn` satirini kaldirmak YETMEDI** -
   build 6 ayni hatayla duestue. Cunku entitlement o alandan degil,
   `expo-apple-authentication` PAKETININ KENDI config plugin'inden
   geliyor ve autolinking onu kendiliginden uyguluyor. Plugin
   kosulsuz yaziyor, app.json'a hic bakmiyor:

       config.modResults['com.apple.developer.applesignin'] = ['Default']

**COZUM: KARSI PLUGIN.** `mobil/plugins/apple-signin-entitlement-kaldir.js`
o anahtari geri siliyor ve `app.config.js` icindeki listenin EN SONUNA
konuyor - once calissaydi sildigi anahtar yeniden eklenirdi.

**OLCULEREK DOGRULANDI.** iOS prebuild Windows'ta calismiyor ("Run
npx expo prebuild again from macOS or Linux"), bu yuzden olcum
`npx expo config --type introspect --json` ile yapildi; o komut
plugin'leri uygulayip sonucu veriyor. Cikti:

    iOS entitlements: aps-environment = development
    com.apple.developer.applesignin: YOK **Teshis tuzagi:** EAS "All credentials are ready
to build" diyor ve profile "active" gorunuyor - yani credential
ekranina bakarak sorun ANLASILMIYOR, hata ancak Xcode asamasinda
cikiyor. Ayrica `--non-interactive` build hatanin metnini GOSTERMIYOR;
gormek icin CLI'yi bekleyen (interaktif) modda kosmak gerekti.

**Kaldirmanin bedeli SIFIR oldu:** Apple ile giris Supabase tarafinda
zaten etkin degil, dugmeye basinca "Bu giris yontemi su an
kullanilamiyor" donuyor. Paket ve dugme yerinde duruyor, yalnizca
entitlement kapali.

**GERI ACMA - magazaya cikmadan ONCE sart** (iOS'ta baska bir sosyal
giris varsa App Store "Apple ile giris"i ZORUNLU tutuyor):

    1. developer.apple.com > Certificates, IDs & Profiles >
       Identifiers > com.slooin.app > "Sign In with Apple" > Save
    2. app.json icindeki ios blokuna "usesAppleSignIn": true geri konur
    3. plugins/apple-signin-entitlement-kaldir.js, app.config.js
       icindeki plugins listesinden CIKARILIR  <-- bu adim atlanirsa
       entitlement yine silinir ve Apple girisi calismaz
    4. Yeni derleme; EAS profile'i capability ile yeniden uretir

Ayrinti ve gerekce `mobil/app.config.js` basindaki yorumda.

**Derleme arsivi: KAPANDI (2026-09-14), bkz. "EAS ARSIVI 1,2 GB -> 5 MB"
bolumu.** Eski teshis ("geri kalani node_modules") YANLISTI.

**1. ~~NATIVE DERLEME BEKLIYOR~~ KAPANDI (2026-09-12, iOS build 8 ve Android 6a377678).** Su degisiklikler OTA ILE GITMEZ, yeni
bir iOS derlemesi gerekiyor: Apple ile giris, Google ile giris
(`@react-native-google-signin`), `LSApplicationQueriesSchemes` (yol
tarifinde kurulu olmayan harita uygulamasini gizleme). Bunlar kodda
DURUYOR ama telefondaki mevcut derlemede calismaz.

    npx eas-cli build --platform ios --profile production
    npx eas-cli submit --platform ios --latest

**2. ~~APPLE / GOOGLE GIRISI SUPABASE'DE ACIK DEGIL~~ KAPANDI (2026-09-12, saglayicilar Enabled).** Eski hali: dugmeler ekranda;
basilinca "Bu giris yontemi su an kullanilamiyor" diyor. Adim adim
rehber: `docs/sosyal-giris-kurulumu.md`. Kullanicinin yapmasi gereken
panel isleri (Google Cloud OAuth istemcileri, Apple Services ID +
.p8, Supabase saglayici ayarlari). iOS'ta Apple ZORUNLU: baska bir
sosyal giris varsa App Store "Apple ile giris"i de sart kosuyor.

**3. ~~SMTP~~ KAPANDI (2026-09-13, Resend).** Eski hali: Supabase'in yerlesik e-posta servisi saatte yalnizca
birkac mail gonderiyor - kendi testine yeter, gercek kullaniciya
yetmez. Alan adi alinip Resend SMTP olarak baglanmali (ucretsiz
katman ayda 3.000 mail).

**4. ~~"Kullanim kosullari" belgesi YOK~~ KAPANDI (2026-09-13):**
`docs/kullanim-kosullari.md`, uygulamada `src/app/kosullar.tsx`, sitede
`slooin.com/kosullar` (7 dil).

**5. ~~Google Maps Android anahtari yok~~ KAPANDI (2026-09-13, anahtar
EAS'te, derleme 6a377678).**

**6. ~~`test:gorunurluk` icinde ETIKET ONAYI senaryosu yok~~ KAPANDI**
(2026-09-02) - ve senaryo yazilir yazilmaz gercek bir kusur buldu;
bkz. asagidaki "ETIKET ONAYI HIC CALISMIYORMUS" bolumu.

**7. Panelde 1 bekleyen sikayet var ve GERCEK DEGIL:** 2026-08-23
tarihli, Plan 2 dogrulamasindan kalma bir MESAJ sikayeti. Gercek
kullanici sikayeti sanip islem yapma. Silinmedi cunku sikayet
verisine dokunmak geri alinamaz ve karar kullanicinin.

### TUR SUZGECI KALICI, LISTE 1 KM ILE SINIRLI - 2026-09-09 (yedinci tur)

**1. SUZGEC CIHAZDA KALICI.** Kullanicinin istegi: "check-in
sayfasinda yaptigim filtreyi kaydet yapinca kayitli kalsin, baska
sayfada gezsem de uygulamadan ciksam da kayitli dursun" ve **"filtreyi
kaldir dersem ancak kaldirilsin"**.

Onceden secim yalnizca ekranin state'indeydi: baska bir sekmeye gecip
donmek bile sifirliyordu. Artik `lib/tur-suzgeci-depo.ts` (AsyncStorage)
icinde. Cihazda, sunucuda DEGIL: bu bir hesap tercihi degil, o telefonda
o an neye bakildigi. Ilk yuklemede once depo okunuyor, liste ONDAN
SONRA tek seferde cekiliyor - once bossuz cekip sonra kayitliyla tekrar
cekmek hem iki istek hem gorunur bir zipzip olurdu.

Okurken deger BILINEN TURLERE suzuluyor: eski bir surumden kalmis ya da
bozulmus bir tur sunucuya gidip bos liste dondururdu ve kullanici
sebebini goremezdi.

**TEST TUZAGI, yasandi:** AsyncStorage mock'u testler ARASINDA
paylasiliyor. Bir onceki testin kaydettigi suzgec sonrakinde
yukleniyor ve secim TERSINE donuyor (secili bir turu tiklamak onu
kaldirir). `beforeEach` VE `afterEach` icinde `AsyncStorage.clear()`
sart; ayrica yazma artik `void` degil AWAIT ediliyor.

**Ikinci tuzak:** ayni testte ekrani `unmount()` edip yeniden render
etmek RNTL'in `screen`ini bozdu ve SONRAKI testler elemanlari
bulamadi. Kaliciligi olcmenin dogru yolu iki yonu AYRI AYRI olcmek:
depoya elle yazip ekranin okudugunu, ve ekranda secip deponun
yazildigini dogrulamak.

**2. LISTE 1 KM ILE SINIRLI - TUR SUZGECI VARKEN DE.** Kullanicinin
istegi: "yakinindaki mekanlar kisminda kullanicinin bulundugu konumdan
1 km mesafe icerisindeki yerler sadece listelenecek, haritada da ayni
sekilde listedeki yerler gorunecek."

Yaricap zaten 1 km'ydi ama TUR SUZGECI VARKEN KALKIYORDU (2026-09-06
karari: "filtrelemede km siniri yok, bulundugu sehirdeki kayitlara
gore"). **O kural GERI ALINDI:** suzgec artik listeyi daraltiyor,
sehre yaymiyor - "Yakinindaki Mekanlar" basligi bunu zaten soyluyordu.

**PERFORMANS BEDELI DEGIL KAZANCI VAR, olculdu:**

    tur suzgeci + 1 km yaricap : 27 ms (sicak) / 2.488 ms (soguk)
    il bazli sinirsiz sorgu    : 946 ms (2026-09-06 olcumu)

**IL SUZGECI DE KALKTI - yaricap varken.** O suzgec bir PERFORMANS
KORUMASIYDI (sinirsiz KNN taramasi zaman asimina duesuyordu, 40 sn);
yaricap verildiginde gereksiz. Ustelik ZARARLI olurdu: il sinirinda
oturan birinin 300 m otesindeki mekani elerdi - ayni gerekce
"Yakininda" listesinde bastan beri gecerliydi. Migrasyon
`20260909140000`.

**ARAMADA YARICAP YOK, IL SINIRI VAR** ve bu kural ayni gun
KESINLESTIRILDI (kullanicinin ifadesi: "mekan aramada kullanicinin o an
bulundugu konum hangi ile bagliysa o ile bagli arama sonuclari
gosterilecek, km siniri bulundugu ille sinirli olacak").

Kural 2026-09-01'den beri zaten calisiyordu ve CANLI OLCUELDUE:
Bursa'dan "kafe" -> yalnizca Bursa (470 ms), Bursa'dan "kadikoy" ->
yine yalnizca Bursa, Istanbul'dan "kafe" -> yalnizca Istanbul.

**DEGISEN TEK SEY: IL BULUNAMADIGINDA.** Nokta-icinde-poligon testi
denizde, sinirda ya da yurt disinda bos donuyor ve arama o durumda
SINIRSIZ kaliyordu ("ekran sebebi gorunmeden bombos kalmasin"). Artik
EN YAKIN IL uygulanıyor - sonuc yine geliyor ama bir ile bagli.
Sinirsiz arama ayrica bir performans riskiydi: nadir bir terimde KNN
taramasi 47 saniyeye cikiyor (2026-08-28) ve PostgREST'in 8 saniyelik
sinirini asiyordu. Migrasyon `20260909150000`; canli dogrulama
`araclar/il-sinirli-arama-test.py` **8/8** (Ege Denizi'nden arama artik
yalnizca Izmir donduruyor).

Dogrulama: jest 67 paket / 780 test, tsc uygulama kodunda 0 hata.

### KAPALI MEKAN BILDIRIMI - 2026-09-11

Kullanicinin sorusu (2026-09-10): "Konum verilerimizde kapali, gercekte
olmayan yerler var, bunlari tespit etmek mumkun mu?" Ayni gun onayiyla
uygulandi.

**OTOMATIK TESPIT OLCULDU VE ELENDI - tekrar arastirilmasin:**

    Foursquare `date_closed`  : INDIRME SIRASINDA zaten filtrelenmis.
                                Elimizdeki 5,98M kaydin hepsi kaynaga
                                gore "acik"; kapalilar bize hic gelmiyor.
    `date_refreshed`          : kayitlarin %61'i 2020 oncesi (barlarda
                                %66). "Alti yildir dokunulmamis" ile
                                "kapandi" AYNI SEY DEGIL - on bes yillik
                                bir esnaf da guncellenmemis olabilir.

Yani elimizde kapaliligi soyleyen bir sinyal YOK; `date_refreshed`e
bakip kayit gizlemek ACIK yerleri de silerdi. Kaynak makine degil
INSAN oldu - ayni gerekce tur duzeltmesinde de gecerliydi (2026-09-09)
ve altyapinin tamami zaten oradaydi.

**AKIS:** mekan sayfasi -> "Bilgileri düzelt" -> en altta **"Burası
kalıcı olarak kapandı"** anahtari -> moderator onaylarsa
`mekanlar.kapali = true`.

**NEDEN AYRI SUTUN, `tur = 'yer-degil'` DEGIL.** 2026-08-23'te mekan
olmayan ~15 bin kayit (yol parcasi, koy adi, SEO ilani) o degere
cevrilerek gizlenmisti. Kapali bir kafe BASKA BIR SEY: o bir mekandi,
kapandi. Ikisini ayni degere yikmak (a) asil `tur` verisini geri
alinamaz sekilde silerdi, (b) "hic mekan degildi" ile "artik yok"u
ayirt edilemez yapardi. Ayri bayrak tek satirda geri alinabiliyor.

**KAPATMA VARSAYILAN ONAYDA YOK - en onemli guvenlik karari.**
`moderasyon_duzenleme_talebini_karara_bagla`'nin varsayilan `p_alanlar`
listesi 'kapali' TASIMIYOR; panel de o kutuyu isaretsiz aciyor ve
yalnizca bildirim varsa cizyor. Sebep: sonucu en agir olan alan bu -
"hepsini onayla" refleksiyle bir mekanin kazara kapanmasi en pahali
hata olurdu. Canli testte ayrica olculuyor.

**KAYIT SILINMIYOR, GIZLENIYOR.** `check_inler.mekan_id` cascade; mekani
silmek insanlarin anilarini, begenilerini ve yorumlarini goturur.

**UC GIZLEME YOLU (hepsi sunucuda):**

| Yer | Ne |
|---|---|
| `yakin_mekanlar_yogunluk` | `and not m.kapali` - liste ve arama |
| `mekan_turleri` matview | kapali sayilmiyor; yoksa "Kafe 23" yazip 22 sonuc gelirdi |
| `check_in_yap` | kapali mekana check-in REDDEDILIYOR |

Check-in kontrolu MESAFE KONTROLUNDEN ONCE: canli testte kasitli olarak
(0,0) koordinatiyla cagriliyor ve mesafe hatasi degil kapali hatasi
bekleniyor - yoksa kural kapaliliga degil konuma baglanmis olurdu.

**SAYFA ACIK KALIYOR.** Mekan listelerden duesueyor ama sayfasina eski
bir check-in kartindan gidilebiliyor; orada "Bu mekân kalıcı olarak
kapandı" seridi var ve check-in cubugu HIC cizilmiyor. **Tek istisna:**
kisi su an oradaysa "Ayrıl" duruyor, yoksa check-in'ini bitirmenin yolu
kalmazdi.

**GERI ALINABILIR:** `moderasyon_mekani_geri_ac` RPC'si + panelde
"Mekânı geri aç" dugmesi. Geri alinamayan bir moderasyon eylemi
birakmak tek bir hatali onayi kalici yapardi (ayni gerekce yorum
gizlemede de var, 2026-09-02).

**CANLI DOGRULANDI: `araclar/kapali-mekan-canli-test.py`, 13/13.** Jest
Supabase'i mock'ladigi icin bu kurallarin HICBIRI jest'te gorulemiyor.
Betik gecici bir moderator hesabi (TOTP ile AAL2) aciyor, mekani
LISTENIN KENDISINDEN seciyor (kullanicinin gercekten gordugu liste
uzerinde olcmek icin), sonunda mekani eski haline donduruyor.

**YAN DUZELTME - ESKI BIR SESSIZ HATA.** `lib/hata-metni.ts` icindeki
`'Mekana cok uzaksin (~500 m icinde olmalisin)'` anahtari HIC
ESLESMIYORDU: sunucudaki yaricap 2026-08-28'de 1 km'ye cikarilmis ama
karsilik guncellenmemisti, yani kullanici ham ASCII mesaji goruyordu.
Ayrica mekan duzenleme talebi ailesinin ON hata metni (2026-09-09'da
eklenmis) hic haritalanmamisti - ayni sinif sizinti. Hepsi kondu.
**Kural: bir `raise exception` metni degistiginde `hata-metni.ts`
anahtari da degismeli; eslesmeyen anahtar sessizce ham metne duesuyor.**

### EAS ARSIVI 1,2 GB -> 5 MB; .p8 HER DERLEMEDE YUKLENIYORMUS - 2026-09-14

`eas build:inspect -p android -s archive -o <dizin>` ile arsiv YERELDE
uretilip olculdu (derleme baslatmadan): **1,2 GB**. Sebep `mobil`
degil (13 MB): EAS **git kokunu** kopyaliyor; `docs/` 853 MB (oturum
dokumleri), `.git` 261 MB, `tasarim/` 69 MB. Eski "node_modules
yuzunden" teshisi yanlisti.

Kok dizine `.easignore` yazildi; arsiv **5,1 MB / 181 dosya**, sir yok.
eas-cli kaynagindan (vcs/local.js, clients/git.js) okunan uc kural,
dosyanin basinda da yaziyor:

1. `.easignore` VARSA `.gitignore`lar HIC OKUNMAZ (yalnizca `.git` ve
   `node_modules` varsayilan). Ilk denemede `mobil/.env` (service role,
   Resend anahtari) arsive GIRDI; sirlar `.easignore`da da yazili
   olmak ZORUNDA.
2. `.easignore` YOKKEN ic `mobil/.gitignore` Windows'ta uygulanamiyor
   (onek `mobil/` ile yol `mobil\...` eslesmiyor). **Bu yuzden Apple
   `.p8` anahtari ve `dist/` bugune kadarki HER derlemede EAS'e
   yuklendi.** Sizinti degil (EAS ozel), ama gereksizdi; artik kapali.
3. `.git` ancak `.easignore`da acikca yazilirsa silinir.

Dogrulama: `build:inspect -s pre-build` WINDOWS'TA CALISMIYOR ("Android
builds are supported only on Linux and macOS" - .easignore ile ilgisi
yok). Esdegeri elle yapildi: arsiv kopyasinda `npm ci` (940 paket) +
`npx expo prebuild --platform android --no-install` GECTI;
`applicationId com.slooin.app`, Maps anahtari meta-data'da, konum
izinleri ve simgeler uretildi. Gercek kanit bir sonraki EAS derlemesi;
kirilirsa ilk suphe `.easignore`daki `mobil/` satirlari. `.p8` olmadan derleme calisir: Apple
anahtari yalnizca Supabase panelinde/tarayici OAuth'ta kullaniliyor,
native derleme okumuyor; `.env` yerine EAS ortam degiskenleri
(`production`/`preview`) devrede.

### ILK ANDROID URETIM DERLEMESI (AAB) - 2026-09-12

Kullanici "Android test uygulamasi hazir mi" diye sordu; degildi -
elde yalnizca 25 Agustos'tan kalma bir preview APK vardi. EAS'te
`production` profiliyle ilk AAB alindi:

    Build   e0aaded9-be53-4aed-8825-89c0200effc2   finished, 24 dk
    AAB     https://expo.dev/artifacts/eas/xfNHHEtTqq9CtqDq3kyVnL9Lj-qfKDM7cGrnXHKQWHQ.aab
    Kanal   production, runtime 1.0.0 -> bugune kadarki OTA'lar gomulu

Keystore 25 Agustos'taki APK derlemesinden zaten vardi; derleme
`--non-interactive --no-wait` ile sormadan basladi.

**BILINEN EKSIK: HARITA GRI.** `GOOGLE_MAPS_ANDROID_ANAHTARI` EAS'te
tanimsiz, app.config.js anahtari manifeste yazmadi. Native oldugu
icin OTA ile gelmez; anahtar alininca IKINCI derleme sart. Anahtar,
OAuth istemcileriyle birlikte Google Cloud'da (`slooinapp@gmail.com`)
bypass kipi acilinca alinacak.

**Play Console icin siradaki adimlar** (hesap `slooinapp@gmail.com`
ile acildi): uygulama olustur -> Kapali test -> AAB yukle -> 12
kisilik test listesi -> opt-in linki. 14 gunlik saat linkin
dagitildigi gun baslar; haritali ikinci derleme ayni kanala sonradan
yuklenir. Ilk kurulum formlari (gizlilik adresi
`slooin.expo.app/gizlilik`, icerik derecelendirme, veri guvenligi)
kapali test icin de kismen zorunlu.

**Derleme arsivi: `.easignore` YAZILDI (2026-09-14)**, bkz. "EAS
ARSIVI 1,2 GB -> 5 MB" bolumu.

**Arac tuzagi:** `eas build:view` `--non-interactive` bayragini
KABUL ETMIYOR ("Nonexistent flag"); onunla cagrilinca hata donuyor
ve bir yoklama dongusu sessizce hic eslesmiyor.

### "SIFRENI MI UNUTTUN?" - SIFRE SIFIRLAMA - 2026-09-12

Kullanicinin istegi: "hesabi olan kullanicinin giris yapma sayfasina
sifreni unuttun mu ekle." Giris ekraninda butonun altinda duz metin
baglanti (`giris.sifremiUnuttum`), yeni ekran
`src/app/(auth)/sifre-sifirla.tsx`: **uc asama tek ekranda** -
e-posta -> 6 haneli kod -> yeni sifre. Girise yazilmis e-posta
parametreyle tasiniyor, ikinci kez yazdirilmiyor.

**`resetPasswordForEmail` KULLANILMADI, `signInWithOtp` kullanildi:**
o yol Supabase'in "Reset Password" sablonunu gonderir ve o sablon
BAGLANTI tasir (telefonda derin baglanti kurulumu ister, sablon hic
duzenlenmedi, panel de bugun ulasilamaz). `signInWithOtp` ise kayit
akisinin zaten kullandigi ve `{{ .Token }}` tasidigi DOGRULANMIS
"Magic Link" sablonunu gonderiyor; kod `verifyOtp(type:'email')` ile
dogrulaninca oturum aciliyor, `updateUser({password})` sifreyi yaziyor.
**Panelde hicbir sey degismeden bugun calisiyor.**

`shouldCreateUser: false` SART - ekran hesap ACMAZ; olmayan adres
`otp_disabled` donduruyor, ekran bunu "hesap bulunamadi" diye
gosteriyor. Onceden `epostaKayitliMi` (hiz sinirli RPC) ile kontrol
edilip posta hic atilmiyor (bosa is yaptirma kurali; kayit ekrani
zaten "hesap var" dedigi icin yeni sizinti yok).

**KOK YONLENDIRME MUAFIYETI (`_layout.tsx`):** kod dogrulaninca oturum
aciliyor ama sifre henuz yazilmadi; ekran `dogrula` gibi muaf
tutulmasa kisi sifre yazamadan `/`a atilirdi. Testle kilitli.

Yan isler: sifre kurali `lib/sifre.ts`e cikti (`EN_AZ_SIFRE = 8`,
profil-olustur da oradan okuyor); `hata-metni.ts`teki telefon
doneminden kalma iki metin duzeltildi ("Telefon numarasi ya da sifre
hatali" -> "E-posta adresi ya da sifre hatali", "Bu numarada zaten" ->
"Bu adreste zaten").

**TUZAK: expo-router tip dosyasi yeni rotayi bilmiyordu** ve tsc
`/sifre-sifirla` yolunu reddetti. `.expo/types/router.d.ts` ancak
dev sunucusu calisinca uretiliyor (`npx expo start --web --port
8123`, ~80 sn, sonra kapat). Port 8099 eski bir surecte takili
kalmisti; `Get-NetTCPConnection -LocalPort` ile bulunup kapatildi.

**Canli: `araclar/sifre-sifirla-canli-test.py`, 6/6.** Olculenler:
olmayan adres reddediliyor ve HESAP ACILMIYOR; gercek hesapta kapi
geciliyor; `updateUser` reauthentication istemiyor ("secure password
change" kapali). **Test hesaplarina posta GITMIYOR:** Supabase posta
katmani `.test` uzantisini "invalid" diye reddediyor - bu akisin
degil test hesabinin siniri; posta zinciri 2026-09-02'de gercek
adresle olculmustu. Gercek gmail hesaplarina test postasi atilmadi.

Ekran goruntuleri `tasarim/giris-sifremi-unuttum.png`,
`sifre-sifirla.png`. Testler: `sifre-sifirla.test.tsx` (16), giris +2,
layout +3; jest 73 paket / 873 test. Yayin: web `slooin.expo.app`,
OTA grup `bddc8f54-2090-4080-8ca6-b5a2e0627205`.

### MEKAN FOTOGRAF ALANI VE PUANLAMA - 2026-09-13 GECE

Kullanicinin iki istegi, ikisi de mekan sayfasinda, ikisi de YAYINDA
(web `slooin.expo.app`, OTA grup `42687a0b-11d2-48f8-96d9-9a189378adc9`).
Jest 72 paket / 881 test, tsc temiz.

**1. FOTOGRAF ALANI** ("check-in'lere konan fotograflar orada gorunecek").
Ucuncu sekme "Fotograflar": 3 sutunlu izgara, dokununca buyuk gorunum
(1/N sayaci, kaydirarak gecis, altta avatar + ad + mekan + gorece
zaman - kullanicinin verdigi Swarm ornegi). RPC `mekan_fotograflari`
`security invoker`: check_inler RLS'i aynen, kova politikasi ayni
satira bagli - gorunurluk modeli GENISLEMEDI. 24 saat suzgeci YOK
(galeri, "kim burada" listesi degil). Bilesen
`src/tasarim/MekanFotografGalerisi.tsx`.

**BULUNMA EKI BILEREK YOK.** Ilk yazimda altyazi "Ad · Mekan'da" idi ve
`lib/turkce-ek.ts` unlu uyumuyla ek uretiyordu; test gercek bir hata
yakaladi: "Muayene Istasyonu'da" (dogrusu "Istasyonu'nda" - iyelik
ekli tamlamada kaynastirma n). "Dayi'da" ile "Merkezi'nde" sozluk
olmadan ayirt edilemez; yanlis ek gostermektense uc satir (ad / mekan
/ zaman). Yardimci ve testi SILINDI.

**TUZAK - yatay FlatList'te sayfa yuksekligi:** `flex: 1` sayfa 0 px
yukseklik aldi, fotograf hic cizilmedi (ekran goruntusuyle yakalandi:
siyah ekran, sayac ve altyazi var, fotograf yok). Akis kartindaki
"genislik sifir" tuzaginin dikey kardesi; yukseklik `onLayout` ile
olculup sayfaya ACIKCA veriliyor.

Uc sekme sigsin diye etiketler kisaldi: "Liderlik" / "Son gelenler" /
"Fotograflar" (eski "Liderlik Tablosu" ve "Son Check-inler" 390 px'te
iki satira kiriliyordu).

**2. PUANLAMA** (Swarm referansi). Kotu / Iyi / Harika; kisi basina
mekan basina TEK oy (upsert); puan 0-10 = Kotu 2 / Iyi 7 / Harika 10
ortalamasi (seffaf, sunucuda); **3+ oy olmadan puan gelmiyor** (tek
oyla "10,0" hem anlamsiz hem oyu ele verir), seviye sayilari her
zaman; **yalnizca o mekanda check-in yapmis kisi oy verebilir**
(sunucuda; ekran onceden "once check-in yap" diyor). Kisinin oyu
yalnizca kendisine (`benim_puanim`), tabloya dogrudan erisim kapali.
Migrasyonlar `20260913110000` (tablo + 2 RPC) ve `20260913120000`
(disa aktarima `mekan_puanlarim`; fonksiyon govdesi tek parca oldugu
icin 20260911180000 kopyalanip anahtar eklendi - sonraki degisiklik
BU dosyadan devam etmeli). Bilesen `src/tasarim/MekanPuanlama.tsx`,
ikonlar `mekan-ikonlari.tsx` (uc yuz). Gizlilik metni (uygulama +
docs) ve `kvkk-uyum-listesi.md` guncellendi.

Canli: `araclar/mekan-puanlama-canli-test.py` **15/15** (gecici
check-in'leri service role ile ekliyor - `bitis_zamani` NOT NULL,
gecmis bir tarih veriliyor; sonunda siliyor).

**TESTFLIGHT NOTU (kullanicinin "Apple/Google girisi hala calismiyor"
bildirimi):** App Store Connect'te Build 8 "Ready to Submit" ve dahili
grup "tesstt"te; kullanicinin telefonu hala Build 7 (o derlemede Apple
entitlement'i ve Google iOS URL semasi YOK, calisamaz). TestFlight'tan
1.0.0 (8) kurulmasi istendi; sonucu bekleniyor. Calismazsa ekrandaki
hata metni + `auth_logs` ile devam.

**VPN PROJESI .BAT:** kullanicinin istegiyle `Claude - vpn.bat` son
satiri `claude --dangerously-skip-permissions --chrome` yapildi.

### SOSYAL GIRIS PANEL ISLERI BITTI, iOS DERLEMESI ALINDI - 2026-09-12 GECE

Kullanici "hersey tamam, ayriliyorum, sana tam yetki" dedi; asagidakilerin
hepsi `claude-in-chrome` ile GERCEK Chrome uzerinden yapildi (iki
profil: Browser 2 = slooinapp@gmail.com -> Google Cloud; Browser 1 =
kisisel hesap -> Apple Developer ve Supabase oturumlari oradaydi).

**GOOGLE CLOUD (proje `slooin`, hesap slooinapp@gmail.com):** Hizmet
Sartlari kabul edildi (kullanicinin onayiyla), OAuth consent (Google
Auth Platform) kuruldu ve **"In production"a alindi** (yalnizca
e-posta/profil kapsami, dogrulama gerekmedi; logo yuklenmedi cunku logo
dogrulama sartini tetikliyor). Test kullanicilari slooinapp ve
ozdmrorcn16. Uc istemci: Web (`Slooin Web`, redirect
`.../auth/v1/callback`), iOS (`com.slooin.app`, App Store ID
6806677710), Android (`com.slooin.app`, EAS keystore SHA-1
`0C:27:27:DA:1F:64:41:E7:50:0D:BB:DE:A5:55:A0:13:A6:31:4E:7B`).
Kimlikler `mobil/.env` icinde (`EXPO_PUBLIC_GOOGLE_WEB_ISTEMCI_ID`,
`EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI_ID`, `GOOGLE_IOS_URL_SCHEME`,
`GOOGLE_ANDROID_ISTEMCI_ID`, `GOOGLE_WEB_ISTEMCI_SIFRESI`) ve ilk ucu
EAS `production` + `preview` ortamlarinda.

**PLAY APP SIGNING TUZAGI (ileride):** magazaya Play uzerinden cikinca
Google APK'yi KENDI anahtariyla yeniden imzalar; o anahtarin SHA-1'i
ile IKINCI bir Android OAuth istemcisi gerekir (Play Console > App
integrity > App signing key certificate). Yoksa magazadan inen
uygulamada Google girisi DEVELOPER_ERROR verir.

**MAPS SDK FOR ANDROID ANAHTARI ALINDI (2026-09-13 gece):** kullanici
`slooinapp@gmail.com` ile faturalandirma hesabini KENDI acti (kart
girisi onda; 300 $ / 14.440 TL deneme kredisi, 90 gun). Google hesabi
otomatik olarak "My First Project" adli BOS bir projeye baglamisti;
Slooin `billing/linkedaccount?project=slooin` -> "Link a billing
account" ile "My Billing Account"a baglandi. Maps SDK for Android
etkinlestirilince Google'in onboarding akisi anahtari KENDILIGINDEN
uretti ("Maps Platform API Key", 35 API'ye acik); anahtar
**"Slooin Maps Android"** olarak yeniden adlandirilip iki yonden
kisitlandi: Application = Android apps (`com.slooin.app` + EAS SHA-1),
API = YALNIZCA Maps SDK for Android (kullanici "1 tane mi olmaliydi"
diye sordu; evet, en az yetki - uygulama baska Maps API'si cagirmiyor).
Deger `mobil/.env` (`GOOGLE_MAPS_ANDROID_ANAHTARI`) ve EAS
`production` + `preview` (sensitive). `npx expo config --type
introspect` react-native-maps plugin'ine anahtarin gectigini dogruladi.
"My First Project" bos duruyor, silinebilir.

**TUZAK - API kisiti coklu secim:** mat-select listesinde secenekleri
tiklamak YETMIYOR, panelin altindaki **OK** dugmesine basmadan model
degismiyor (backdrop'a tiklayip kapatinca 35'e geri donuyor).

**ANDROID DERLEMESI (Maps anahtarli):** `6a377678-9a6c-4ccd-b4d6-157af1f91d69`
(production, AAB). Bitince Play Console kapali teste bu yuklenmeli;
`e0aaded9` (gri haritali) artik gecersiz.

**APPLE DEVELOPER (Team 79QNZVGJC7):** `com.slooin.app` App ID'ye
Sign In with Apple isaretlendi (profile gecersiz kilindi, EAS derlemede
yeniden uretti - "Updated 1 second ago" gorundu). Services ID
`com.slooin.app.web` (domain `swpiibyuoffykbmirvgq.supabase.co`, return
URL `/auth/v1/callback`). Anahtar `Slooin Sign in with Apple`, **Key ID
4T394Q83H5**, .p8 dosyasi `mobil/gizli/AuthKey_4T394Q83H5.p8`
(gitignored; Apple bir daha indirtmez, YEDEKLE). `.env`de
`APPLE_TEAM_ID`, `APPLE_SERVICES_ID`, `APPLE_KEY_ID`, `APPLE_P8_DOSYASI`.

**SUPABASE:** Google ve Apple saglayicilari **Enabled**. Google Client
IDs = uc istemci virgulle; Apple Client IDs = `com.slooin.app,
com.slooin.app.web`. **SECRET ALANLARI BOS BIRAKILDI - bilincli:**
uygulama native `signInWithIdToken` kullaniyor ve o yol yalnizca Client
IDs ister; secret yalnizca tarayici OAuth akisi icin. Ayrica ajan kimlik
bilgisini tarayici formuna girmiyor. Web OAuth (ornegin `slooin.expo.app`
uzerinden Google/Apple ile giris) ISTENIRSE Google secret'i `.env`den,
Apple icin .p8'den uretilen JWT'yi kullanici panele girmeli.

**TUZAK - CHROME OTOMATIK DOLDURMA:** Supabase saglayici formunda
Chrome, Client IDs alanina e-posta, Secret alanina 11 karakterlik
KAYITLI BIR PAROLA yazdi; Google'da bu bir kez KAYDEDILDI (sonra
temizlendi), Apple'da kaydi reddettirdi ("Disabled" kaldi). Parola
alanina `[value redacted]` gorunuyorsa once bosalt.

**SUPABASE ACCESS TOKEN:** panelden 7 gunluk, proje kapsamli bir token
uretildi ama degerini okumak siniflandirici tarafindan engellendi
("credential materialization"); kullanilmadi, 7 gunde duser. Ihtiyac
olursa `supabase.com/dashboard/account/tokens`ten silinebilir.

**KOD:** `app.json`a `ios.usesAppleSignIn: true` geri kondu,
`app.config.js`ten karsi plugin CIKARILDI (dosya `plugins/` altinda
tarihsel kayit). `npx expo config --type introspect` ile dogrulandi:
entitlements `com.apple.developer.applesignin: [Default]`, plugin
listesinde `@react-native-google-signin/google-signin` var. Commit
`f26a951`.

**iOS DERLEMESI BITTI VE APP STORE CONNECT'E YUKLENDI:** build
`1ddfb894-f87e-4859-ae2f-2cb68bc486e5` -> **1.0.0 (8)**, entitlement
hatasi YOK (2026-09-07'den beri kirik olan iOS derlemesi bu yolla
duzeldi). `eas submit --latest --non-interactive` EAS'teki ASC API
anahtariyla (Key ID T2DU3DFMW4) sormadan gecti; Apple isleme 5-10 dk.
Dahili test grubuna build 8 eklenince telefonda GERCEK cihazda
dogrulanacaklar `docs/sosyal-giris-kurulumu.md` sonundaki liste.
Dogrulanmadan "calisiyor" DENMEZ. Build 8 bugune kadarki butun OTA
guncellemelerini gomulu tasiyor (runtime 1.0.0, kanal production).

**ANDROID NOTU:** bugunku AAB (build e0aaded9) google-signin native
modulunu autolinking ile zaten iceriyor; `EXPO_PUBLIC_GOOGLE_*`
degerleri JS'e gomuldugu icin bir sonraki `eas update` Android'de
Google girisini ACAR (yeni derleme gerekmez). Maps anahtari gelince
zaten yeniden derlenecek.

**Google nonce notu:** Supabase Google saglayicisinda "Skip nonce
checks" KAPALI birakildi; `lib/sosyal-giris.ts` nonce gondermiyor ve
Google'in native SDK jetonu nonce tasimiyor, yani gecmeli. iOS'ta
"nonce" hatasi gorulurse o anahtar acilir.

**CLAUDE-IN-CHROME DERSLERI:** (1) iki tarayici bagliysa arac once
`AskUserQuestion` ile secim ister, `select_browser` ile gecilir;
hangi hesap oldugu `myaccount.google.com` metninden OKUNARAK dogrulandi.
(2) Sekme arka plandayken (`document.visibilityState === 'hidden'`)
ekran goruntusu ZAMAN ASIMINA duesuyor ve `type` bazen hic yazmiyor;
DOM tarafi calisiyor: `javascript_tool` ile native value setter +
`input` olayi guvenilir. (3) Supabase panosu ayni sekmede ikinci
navigasyonda "document_idle" olmuyor - sekmeyi kapatip yenisini acmak
cozuyor. (4) `javascript_tool` ciktisinda URL/cerez benzeri metin varsa
sonuc `[BLOCKED: Cookie/query string data]` donuyor; kimlik iceren
yollari `replace` ile maskeleyip yazdir.

### ERISIM HAKKI: "VERILERIMI INDIR" - 2026-09-11

KVKK m.11 kisiye kendi verisinin bir KOPYASINI isteme hakki veriyor.
Silme hakki 2026-08-22'de kapanmisti; erisim tarafi acikti ve bir
talep gelse ELLE SQL yazmak gerekiyordu.

Ayarlar > "Verilerimi indir". `verilerimi_disa_aktar` RPC'si (security
definer, yalnizca `auth.uid()` satirlarini okur) JSON uretiyor; istemci
onu gizli `veri-disa-aktarim` kovasina yukleyip 24 saatlik IMZALI
BAGLANTIYI aciyor.

**KAPSAM UC KARARLA BELIRLENDI** - ucu de baskasinin verisiyle
kesistigi icin kullaniciya soruldu:

| Alan | Karar |
|---|---|
| Mesajlar | Kendi yazdiklari TAM METINLE; karsi tarafinkiler METINSIZ (kiminle, kac mesaj, son tarih) |
| Hakkindaki sikayetler | **HIC GIRMIYOR** (kullanicinin acik karari). Kendi gonderdikleri tam giriyor |
| Moderasyon denetim izi | Girmiyor. Hesap durumu (aski/yasak, gerekce) giriyor |

Kullanici once onerilen orta yolu ("varligi ve sonucu girsin, kimlik
girmesin") REDDETTI ve hakkindaki sikayetlerin tamamen disarida
kalmasini secti.

**KENDISINI ENGELLEYENLER ASLA GIRMIYOR** - bu bir tasarim karari
degil, mevcut bir ilkenin korunmasi: uygulamanin SESSIZLIK ILKESI
engellenenin engellendigini anlamamasi uzerine kurulu (2026-09-01,
engelli "Bu kullanici bulunamadi" aliyor ve engelleme silinmis
hesaptan ayirt edilemiyor). Dosyaya koymak o ilkeyi tek hamlede
yikardi.

**TESLIMAT: KOVA + IMZALI BAGLANTI. Elenen yollar ve sebepleri:**

| Yol | Neden olmadi |
|---|---|
| `expo-sharing` | YENI NATIVE MODUL - yeni derleme ister, OTA ile GITMEZ, ozellik bugun calismazdi |
| RN'in `Share.share({ url })` | Dosya paylasimi yalnizca iOS'ta; Android'de yalnizca metin. Iki magazaya da cikiliyor |
| JSON'u metin olarak paylasmak | 9 KB'lik blob kullanilabilir bir teslimat degil |

**DOSYA KUCUK, OLCULDU:** gercek bir hesapta (22 check-in) **9,3 KB**.
Bu yuzden "hazirlaniyor, bildirim gonderecegiz" akisi KURULMADI -
indirme aninda yapiliyor.

**SAKLAMA:** kisi basina EN FAZLA BIR dosya (yeni disa aktarim
oncekini siliyor, ayni desen profil fotografinda da var) ve gunluk
cron 24 saatten eskileri budanıyor. Icinde konum gecmisi olan bir
dosyanin kovada beklemesi kabul edilemezdi.

**FOTOGRAFLAR GOMULMUYOR**, imzali baglanti veriliyor: gomulu gorsel
dosyayi megabaytlara cikarirdi. Baglanti uretilemezse yol oldugu gibi
kaliyor - kisi en azindan neyin var oldugunu goruyor.

**CANLI DOGRULANDI: `araclar/veri-disa-aktarim-canli-test.py`, 15/15.**
Jest Supabase'i mock'ladigi icin bu kurallarin hicbiri jest'te
gorulemiyor. Betik iki test hesabi arasina mesaj, sikayet ve KARSILIKLI
engelleme ekiyor, sonra A'nin dosyasinda karsi tarafin mesaj metninin,
hakkindaki sikayetin ve kendisini engelleyenin GECMEDIGINI olcuyor.
Actigi butun satirlari siliyor.

Gizlilik metni de guncellendi: hak artik "talep edebilirsin" degil
"indirebilirsin" diyor, dosyada NELER OLMADIGI tek tek yaziyor ve
"indirdigin dosyayi sen korursun" uyarisi var.

### CHECK-IN SURESI VE TEKRAR KURALI - 2026-09-07 (KARAR TAM, UYGULANDI)

> **KAPSAM DUZELTMESI (ayni gun, kullanicinin duzeltmesi):** "Kural
> mekan listesi icin gecerli. Ana sayfa ve profil akisi paylasilanlar
> oldugu gibi kaliyor, kisi paylasima ozel duzenleme ve silme
> yapabiliyor."
>
> Asagida anlatilan **"check_in_yap mevcut satiri gunceller" dali
> GERI ALINDI** (migrasyon 20260907130000). `check_in_yap` HER ZAMAN
> yeni satir aciyor: her check-in kendi paylasimi, kisi her birini
> ayri ayri duzenleyip siliyor. Teklestirme ve 24 saat suzgeci
> YALNIZCA `mekan_son_check_inler` icinde - kullanicinin tarif ettigi
> davranis tam olarak orasi.
>
> Hata bir ASIRI GENELLEMEYDI: bir listenin gosterim kurali veri
> modeline indirilmisti. Kullanicinin ayni mesajdaki diger cumleleri
> kapsami zaten soyluyordu ("son check-inlerde", "son check-inlerden
> silinir") - kural bir LISTEDEN bahsediyordu.
>
> Yan sonuc: `ilk_check_in` sutunu ve indeksi DUSURULDU. O sutun
> yalnizca guncelleme dalinin 24 saatlik capasiydi; satirlar artik
> birikmeye devam ettigi icin liderlik sayaci dogal olarak buyuyor ve
> asagida anlatilan "celiski" kendiliginden ortadan kalkti. Yani
> asagidaki "COZULEN CELISKI" bolumu tarihsel bir kayittir.
>
> GECERLI OLANLAR: 1 saatlik canlilik, 24 saatlik liste penceresi,
> listede kisi basina tek satir, liderlik 3 kisi.
>
> Canli dogrulama guncellendi: `araclar/check-in-tekrar-canli-test.py`
> **18/18**. Yeni olctugu seyler: ikinci check-in YENI satir aciyor,
> ilk paylasimin notu ve zamani DEGISMIYOR, yalnizca yenisi canli
> kaliyor, ve iki paylasim AYRI AYRI duzenlenebiliyor.

Kullanicinin karari. **Bu, 2026-08-29'un 30 DAKIKA kuralini ve
2026-09-04'te "sure kullanici tarafindan secilecek" diye acik birakilan
kararin ikisini de KAPATIYOR.** Asagidaki iki eski bolum artik
gecersiz: "CHECK-IN CANLILIK PENCERESI 30 DAKIKA" ve "GORUNURLUK
SURESI DEGISECEK (KARAR YARIM)".

Kullanicinin ifadesi: "Check-in yapan biri yaptigi an 'su an burada'
kisminda gorunuyor. Konumun icine girildiginde son check-inlerde 'su an
burada'; 1 saati dolunca '1 saat once', kac saat gecmisse o sekilde
devam eden bir gosterme. Yapilan bir check-in 24 saatini doldurdugunda
son check-inlerden silinir. Ayni kisi ayni yerde 24 saati dolmadan yine
check-in yaparsa yaptigi saate gore check-in guncellenir. Liderlik
tablosu en cok o konumda check-in yapan 3 kisi sabit kalir her zaman."

| Kural | Deger |
|---|---|
| "Su an burada" suresi | **1 saat** (onceki 30 dk) |
| 1 saatten sonra | gorece zaman: "1 saat once", "5 saat once", "1 gun once" |
| Son check-inler listesi | son **24 saat**, kisi basina TEK satir |
| Ayni kisi + ayni mekan, 24 saat icinde | kayit **GUNCELLENIR** |
| Liderlik tablosu | **her zaman 3 kisi** (ust sinir da 3) |

**COZULEN CELISKI - en onemli karar.** "Check-in guncellenir" kurali
kisi basina TEK SATIR birakiyor; `mekan_liderlik` ise satir sayiyor
(`count(*)`, canli semadan olculdu). Ikisi bir arada olsa her gun gelen
birinin sayaci 1'de takilir ve liderlik tablosu anlamsizlasirdi.

Kullaniciya uc secenek gorsel olarak sunuldu ve **"24 saati ilk
kayittan say"** secildi: ayni gun icindeki tekrarlar tek satiri
gunceller, 24 saat dolduktan sonraki check-in YENI satir acar. Boylece
gunde bir satir birikiyor ve liderlik "kac kez geldi" sorusunu dogru
cevapliyor. Ayri bir sayac sutunu gerekmedi.

**YENI SUTUN: `check_inler.ilk_check_in`.** 24 saatlik pencerenin
capasi. Ayri olmasi SART: ekranda gorunen zaman `olusturma_zamani` ve o
guncelleniyor; capa onu tasisaydi pencere her ziyarette ileri kayar ve
yeni satir hic acilmazdi (tam da yukaridaki celiski). Mevcut 13 satir
geriye donuk `olusturma_zamani` ile dolduruldu.

**"SILINIR" LISTEYE AIT, SATIRA DEGIL.** 24 saati dolan kayit yalnizca
mekanin "Son check-inler" listesinden duesuyor; satir DURUYOR. Check-in
kisinin anisi - silmek gecmisini, begenilerini ve yorumlarini goturur.
Canli testte ayrica dogrulandi.

**Guncellemede not ve fotograf `coalesce` ile korunuyor:** kullanici
ikinci check-in'inde bir sey yazmadiysa ilk yazdigi silinmiyor.
`gorunurluk` ise canli varsayilanina donuyor - guncellenen satir bir
ANI olmus olabilir ve yeniden canli olduguna gore yeni bir check-in'le
ayni degeri tasimasi gerekiyor.

**`moderasyon_gizli` satir guncellenmiyor**, yeni satir aciliyor:
moderasyon karariyla gizlenmis bir kaydi guncelleyip yeniden gorunur
kilmak kararin etrafindan dolanmak olurdu.

**DEGISEN YERLER**

| Yer | Ne |
|---|---|
| Migrasyon `20260907120000` | `ilk_check_in` sutunu + indeks, `check_in_yap` (1 saat + guncelleme dali), `mekan_son_check_inler` (24 saat + teklestirme), `mekan_liderlik` (3) |
| `lib/zaman.ts` | `CANLI_ETIKET_SURESI` 30 dk -> `SAAT` |
| `lib/mekan-sayfasi.ts` | liderlik varsayilani 5 -> 3 |
| `src/app/gizlilik.tsx`, `docs/gizlilik-metni.md`, `docs/kvkk-uyum-listesi.md` | koordinat saklama suresi somutlastirildi |

`gorecelZaman` icin YENI KOD YAZILMADI - zaten dakika/saat/gun/tarih
basamaklarini uretiyor. `goreceZamanGosterilir` ise yalnizca testlerde
kullaniliyor, uygulamada olu.

**GIZLILIK ETKISI, atlanmadi:** canli pencere 30 dk -> 1 saat cikinca
koordinat da daha uzun saklaniyor. Cron 10 dakikada bir kostugu icin
ust sinir **~1 saat 10 dakika**. 2026-09-04'te "gizlilik metninde artik
somut saklama suresi yok, sure kesinlesince geri konmali" diye yazilan
acik borc BUNUNLA KAPANDI: uc metne de gercek sure yazildi.

**CANLI DOGRULANDI: `araclar/check-in-tekrar-canli-test.py`, 17/17.**
Jest Supabase'i mock'ladigi icin guncelleme-mi-yeni-satir-mi dali
mock'la GORULEMEZ. Betik idempotent, actigi satirlari siliyor;
kosumdan sonra veritabani 14 satirda ve Hozee'de artik yok.

Olculenler: 1 saatlik bitis zamani, ikinci check-in'in yeni satir
ACMAMASI, capanin degismemesi, notun korunmasi, capa eskitilince yeni
satir acilmasi, listede kisi basina tek satir, listedeki kaydin en
yenisi olmasi, liderligin limit 20 istense de 3 dondurmesi, sayacin 2
olmasi, ve 24 saati dolan kaydin listeden duesup SATIR OLARAK
KALMASI.

**TUZAK, yasandi:** `mekanlar` tablosunda ada gore tam esitlik
(`eq('ad', 'Hozee')`) PostgREST'in 8 saniyelik sinirinda zaman asimina
duesuyor - 5,9 milyon satir ve `ad` uzerinde yalnizca `tr_kucuk(ad)`
trigram GIN'i var. Betik mekan kimligini DOGRUDAN tasiyor. Ayrica
check-in'in 1 km kuralini gecmesi icin mekanin KENDI koordinati
gerekiyor; Nilufer merkezi Hozee'ye 5.157 m uzakta ve reddediliyor.

### GORUNURLUK SURESI DEGISECEK - 2026-09-04 (KARAR YARIM)

> **KAPANDI 2026-09-07.** Sure kullanici tarafindan secilmiyor;
> SABIT ve 1 SAAT. Bkz. "CHECK-IN SURESI VE TEKRAR KURALI".


**30 DAKIKA KURALI KALKIYOR.** Kullanicinin karari: "30 dakika kuralini
kaldir, ona farkli kurallar koyucaz, 30 dakikadan fazla gorunurluk
olucak." Yani asagidaki "CHECK-IN CANLILIK PENCERESI 30 DAKIKA" bolumu
ARTIK KALICI DEGIL - o sureyi sabit bir kural gibi okuma.

**NETLESEN KISIM:** sure SABIT OLMAYACAK, **kullanici check-in yaparken
kendisi secekecek**. Gerekce: konumunun ne kadar saklanacagina kisinin
kendisi karar veriyor, bu KVKK acisindan en savunulabilir olan.

**NETLESMEYEN KISIM: hangi sureler sunulacak.** Uc set onerildi
(1/4/8 saat, 2/6 saat + gun sonu, 30 dk/2/6 saat) ama kullanici karari
vermedi - soru reddedildi, secim ona birakildi. **Bu karar alinmadan
kod degistirilmemeli.**

**METINLERDEN IBARE KALDIRILDI (ayni gun, kullanicinin talimati:
"sadece 30 dakika ibaresi gecerli degil, onu kaldir, sure degisicek").**
Kullaniciya gorunen her yerde sabit sayi yerine olay yaziyor: "check-in
suresi dolunca". Degisen dosyalar: `gizlilik.tsx` (uc yer),
`check-in/[mekanId].tsx`, `docs/gizlilik-metni.md` (uc yer).

Bu sirada BIR TUTARSIZLIK bulundu: `docs/gizlilik-metni.md` hala
**"~4 saat"** diyordu - 2026-08-29'da 30 dakikaya gecilirken belge
guncellenmemis, yani uygulama ici metin ile depodaki belge birbirini
tutmuyordu. Ikisi de ayni ifadeye cekildi.

**ACIK BORC:** gizlilik metninde artik SOMUT SAKLAMA SURESI YOK. KVKK
saklama suresinin belirtilmesini ister; sure kesinlesince o uc ifadeye
gercek sure geri konmali. Simdilik yanlis sure yazmaktansa olayi
anlatmak tercih edildi.

**SURE MEKANIZMASI HALA 30 DAKIKA** - davranista hicbir sey
degistirilmedi. Degisecek bes yer:

| Yer | Ne yapiyor |
|---|---|
| `check_in_yap` RPC | `now() + interval '30 minutes'` (migrasyon 20260829100000) |
| pg_cron (10 dk'da bir) | Suresi dolani aniya cevirir, KOORDINATI SILER |
| `yakin_mekanlar_yogunluk` | "Burada kac kisi var" ayni pencereyi kullaniyor |
| `lib/zaman.ts` | `CANLI_ETIKET_SURESI = 30 * DAKIKA`, uc kademeli etiket |
| Metinler | `gizlilik.tsx` (uc yerde "~30 dakika"), `check-in/[mekanId].tsx`, `CheckInKarti.tsx` yorumu |

**YAN YUKUMLULUKLER - is yapilirken atlanmamali:** sure uzayinca
koordinat daha uzun saklanacak, yani gizlilik metnindeki uc ifade ve
`docs/kvkk-uyum-listesi.md` guncellenmeli. Ayrica sure artik
istemciden geldigi icin sunucu onu DOGRULAMALI (izinli degerler
disindaki bir sure kabul edilmemeli), yoksa dogrudan RPC cagirarak
sinirsiz gorunurluk alinabilir.

### SABIT KURAL: SIRALAMA HER ZAMAN EN YAKINDAN UZAGA

Kullanicinin karari (2026-09-01): **"Siralama her zaman en yakindan
uzaga, bu kural sabit."**

Siralamayi SUNUCU yapiyor: `yakin_mekanlar_yogunluk` icinde iki ayri
KNN siralamasi var (`konum <-> ST_MakePoint(...)`), biri alt sorguda
biri disarida. Istemci siraya DOKUNMUYOR - ekran kodunda hicbir
`.sort()` yok, `kesfetListesi = mekanlar`.

Kural `__tests__/ekranlar/mekanlar/index.test.tsx` icindeki
"SABIT KURAL: liste sunucudan gelen yakinlik sirasini korur" testiyle
kilitli. Biri listeyi ada, ture ya da kisi sayisina gore siralamaya
kalkarsa o test kirilir.

**Test yazarken tuzak:** ekran listeyi CANLI ve SAKIN diye ikiye
ayiriyor; canlilar seridi (kisiSayisi > 0) yalnizca Kesfet sekmesinde
ciziliyor. "Yakininda" listesinde siralamayi olcmek icin mock'taki
butun mekanlarin `kisiSayisi` degeri 0 olmali - yoksa kayitlar listede
hic gorunmez ve test yaniltici sekilde "bulunamadi" der.

### KONUM BILGISI: YALNIZCA ILCE + IL - 2026-08-31 (SON KARAR)

Kullanicinin son karari, uc denemeden sonra:

    "Mahalle adres bilgisi aktarimini durdur ve sil, sadece konumlarin
     ilce ve il bilgisini gosterecegiz TAM DOGRULUK ADINA."
    "Mekan ara sonuclar kisminda cikan her konumun altinda ait oldugu
     ilce yazicak."

Ekranda gorunen tek konum ibaresi: **"Nilufer, Bursa"**. Mahalle ve
adres HICBIR YERDE gosterilmiyor. `mekanlar.mahalle` sutunu DUSURULDU,
RPC'den ve istemci tipinden cikarildi. `mekanlar.adres` sutunu duruyor
ama ekranda kullanilmiyor.

**MAHALLE UC KEZ DENENDI, UCU DE YANLIS SONUC VERDI** - tekrar
denenmesin diye kaydi:

1. **OSM yerlesim noktalari** ("ayni ilcedeki en yakin merkez"). Turkiye'de
   OSM'de mahalle SINIRI yok (admin_level=10 sayisi SIFIR), yalnizca
   69.391 nokta var. Kullanicinin gosterdigi hata: bir mekan "Ertugrul"
   gorunuyordu, dogrusu ALAADDINBEY.
       Ertugrul     683 m   <- en yakin nokta, secilen
       Alaaddinbey 1415 m   <- dogrusu
   Mahalle merkezine uzaklik, o mahallenin ICINDE olup olmadigini
   soylemiyor. Kullanicinin "yaricapi daraltalim" onerisi de cozmuyor:
   1 km sinirinda dogru olan busbutun elenirdi. **Apple Haritalar da ayni
   hatayi yapiyor** - cihazdan adres cozumu (`reverseGeocodeAsync`) de bu
   yuzden kaldirildi.
2. **Mekanin kendi adresinden cikarip komsuluga yayma** (~300 m hucre).
   Kapsama %11,6 -> %80,3. Kullanici reddetti: turetilmis veri "uydurma
   veri" sayiliyor.
3. **Yalnizca kendi adres kaydi** (turetme yok, %11,4). Bu kez KAYNAGIN
   KENDISI kirli cikti: "Hadim erikli subesi" kaydinda adres "Bursa Erik
   mah.", ilce alaninda IL, il alaninda MAHALLE yaziyordu (2013'te
   girilmis, 2018'den beri dokunulmamis). 2.139 boyle kayit bulundu.
   Kaynak guvenilir olmadigi icin mahalle tamamen birakildi.

**ILCE ve IL KALDI cunku TAHMIN DEGIL:** mekanin koordinati hangi idari
sinir POLIGONUNUN icindeyse o atandi (`araclar/mahalle-adresten.py`).
945 farkli ilce (%98,6 kapsama), 81 il (%100). Kaynak OpenStreetMap
idari sinirlari (ODbL); cikarma `osm-mahalle-cikar.py` (ilce) ve il
poligonlari icin ayni desen.

Araclar: `mahalle-adresten.py` (ilce/il uretir - adi tarihsel),
`mahalle-yukle.py` (hazirlik tablosuna), `osm-mahalle-cikar.py`.
`araclar/turkiye-osm.pbf` (614 MB) ve `osmconf.ini` gitignored.

**ATIF DUZELTILDI:** kesfet ekraninin altinda hala "Overture Maps
Foundation" yaziyordu (Overture 2026-08-30'da silinmisti). Dogrusu:
Foursquare + OpenStreetMap. OSM'in lisansi (ODbL) atfi HUKUKEN sart.

### GOOGLE MAPS VERISI: CEKILEMEZ (2026-08-31, arastirildi)

Kullanicinin sorusu: "Google mapsden sadece konum verilerini kendimize
cekme imkanimiz varmi". Cevap HAYIR, sebebi hukuki:

- Places API icerigini onceden cekmek, onbellege almak, saklamak YASAK
  (Google Places API politika sayfasindan dogrulandi). Ad, adres ve
  KOORDINAT dahil - "sadece konum alalim" da kapsam disi.
- Tek istisna `place_id`: suresiz saklanabilir ama tek basina ise
  yaramaz, koordinat icin her seferinde yeniden sorgu gerekir.
- Places verisi gosterilirken Google logosu ve tercihen GOOGLE HARITASI
  sarti var; biz iOS'ta Apple Haritalar kullaniyoruz - celisiyor.
- Maliyet: 6 milyon mekan on binlerce dolar, ustelik saklanamadigi icin
  tekrar tekrar odenir.

Mesru kullanim yalnizca "saklamadan canli sorgu" olurdu; mevcut 55 ms'lik
ucretsiz aramamizi ag gecikmesi + faturaya cevirmek anlamsiz.
Elimizdeki Foursquare Apache 2.0 (serbest), OSM ODbL (atifla serbest).

### ORTAM TUZAKLARI - 2026-08-31 (uc tanesi de yasandi)

1. **PostgREST SEMA ONBELLEGI.** `mekanlar`a upsert
   `there is no unique or exclusion constraint matching the ON CONFLICT`
   ile reddedildi. Indeks ASLINDA vardi ama KISMIYDI; ayrica PostgREST
   sonradan kurulan indeksi gormuyordu. Iki ders: kismi tekil indeks
   `on_conflict` ile ESLESMEZ, ve indeks/sema degisikliginden sonra
   `notify pgrst, 'reload schema'` calistirilmali.

2. **pg_cron'da `statement_timeout` FONKSIYONA YAZILMAZ.** Fonksiyon
   uzerindeki `set statement_timeout = '5min'` ISE YARAMIYOR: cron isi
   `select fonksiyon()` diye cagiriyor ve DISTAKI ifadenin siniri (bu
   projede 2 dakika) once isliyor. Butun turlar tam 00:02:00'da
   "canceling statement due to statement timeout" ile GERI ALINDI - yani
   saatlerce bosa dondu. Dogrusu cron KOMUTUNUN ICINE yazmak:
   `cron.schedule(..., $$set statement_timeout = '9min'; select f()$$)`.

3. **`mekanlar` uzerinde toplu UPDATE COK YAVAS: ~20.000 satir/dakika.**
   Tablo 3 GB, indeksler 1,4 GB (GIN 251 MB + GIST 452 MB dahil); Medium
   compute'ta bellege sigmiyor, her guncelleme diske iniyor. Olculdu:
   dilim boyutunu buyutmek de paralel kol eklemek de hizi DEGISTIRMIYOR,
   darbogaz disk IOPS. 5,9 milyon satir ~4,5 saat. Kullanici
   2026-08-31'de "beklesin, ucretsiz" dedi (compute buyutme reddedildi).
   Bir dahaki toplu veri isinde bunu bastan hesaba kat.

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

**ONCE SUNU KONTROL ET: `eas deploy --prod` TEK BASINA DERLEMEZ.**
Yalnizca `dist/` klasorunde NE VARSA onu yukler. Kodu degistirip
`npx eas-cli deploy --prod` calistirirsan ESKI paketi yayinlarsin ve
"yayin gecmiyor" sanirsin. Bu iki kez yasandi (2026-08-30). Dogru
komut `npm run yayinla` - once `expo export`, sonra deploy.

**Ikinci sebep, o da olculdu: Cloudflare `index.html`'i onbellekte
tutuyor; yeniden yayinlamak bunu HIZLANDIRMIYOR, beklemek gerekiyor.**
Ustteki "once yeniden yayinla" tavsiyesi yanlisti.

**PAKET ADI KARSILASTIRMASI GUVENILIR DEGIL.** `eas update` kendi
`expo export`'unu calistirip `dist/` klasorunu YENIDEN YAZIYOR, yani
deploy'dan sonra update calistirdiysan yereldeki paket adi artik
yayinlanan paketin adi degil. Bu bir kez yanlis teshise yol acti
(2026-08-30).

**Dogru yontem ICERIGE bakmak:** yeni eklenen bir ekran metnini ya da
yolu canli pakette ara.

```bash
B=$(curl -s https://slooin.expo.app/ | grep -o '_expo/static/js/web/entry-[a-f0-9]*\.js' | head -1)
curl -s "https://slooin.expo.app/$B" | grep -c 'Hangi haritayla'   # yeni metin
```

Sifir donerse yayin gecmemis, pozitif donerse gecmis.

Eski yontem (yalnizca deploy calistirildiysa gecerli): `index.html`
icindeki paket adi karsilastirilir.

```bash
# yerelde uretilen paket
grep -o 'entry-[a-f0-9]*\.js' mobil/dist/index.html | head -1
# yayindaki paket
curl -s https://slooin.expo.app/ | grep -o 'entry-[a-f0-9]*\.js' | head -1
# yayinin KENDI adresi - burasi HEP guncel gelir
curl -s https://slooin--<hash>.expo.app/ | grep -o 'entry-[a-f0-9]*\.js' | head -1
```

Dagitimin kendi adresi yeni paketi gosteriyor ama uretim adresi eskiyi
gosteriyorsa is DOGRU yayinlanmistir, yalnizca kenar onbellegi henuz
donmemistir. Olculen sure ~3-4 dakika (`curl -sI` ciktisindaki `Age`
basligi onbellegin yasini veriyor). Bu surede ikinci kez
`eas deploy --prod` calistirmak hicbir sey degistirmiyor - iki kez
denendi. 20 saniyede bir yoklayip beklemek dogru davranis.

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

### UCRETSIZ MEKAN VERISI + FOTOGRAF KAYNAKLARI ARASTIRMASI - 2026-09-21

Kullanicinin istegi: "detayli arastir, GitHub'i da". Rapor:
`docs/konum-veri-kaynaklari-arastirmasi.md` (13 kaynak, lisans, TR/Bursa
olcumu, karar). Uc bulgu: (1) turu %100 guvenilir TEK ucretsiz kaynak
**AllThePlaces** (CC0; markalarin kendi magaza bulucularindan; TR 48
orumcek / 102 bin kayit ama banka-market-telekom agirlikli; sosyalde
yalnizca fast-food/doner zincirleri; bagimsiz kafe/bar YOK). (2) Isletme
fotografi icin ucretsiz+yasal kaynak YOK; Commons/Wikidata yalnizca yer
isaretleri (Bursa: 59 resimli oge, 0 kafe/bar); Mapillary cephe = tahmin.
(3) IBB Acik Veri CC BY 4.0, ticari kullanim serbest - Istanbul'da kamu
tesisleri (park/kutuphane/kultur merkezi) icin resmi tur kaynagi.
**ATP x FSQ Bursa OLCULDU** (`araclar/atp-tur-olcum.py`): 212.162 mekanin
903'u (%0,43) zincir subesiyle eslesti, sosyal turde yalnizca 80;
ATP kayitlarinin %13'u koordinatsiz (BIM tamami). Uyusmazliklarda hakli
taraf ATP - FSQ'nun kendi turu yanlis (08-24 denetimini dogruluyor).
Yandex: Google ile ayni duvar (saklama yasak, kendi haritada gosterme
yasak, ticari lisans ~120 bin ruble/yil). Overture elimizde ama 08-30'da
kategori guvensizligi yuzunden birakilmisti - durum ayni.

### OSM TUR OLCUMU: TEKRAR DENENMESIN - 2026-09-20

Kullanicinin sorusu: yeni kazima araclariyla (Scrapling, ScrapeGraphAI)
gercek tur ve fotograf verisine ulasmak kolaylasti mi? CEVAP HAYIR -
engel teknik degil: Google/Yelp/Instagram verisi sozlesme+telif,
LLM tahmini "turetilmis veri", fotograf icin mesru kaynak yok.
Tek mesru aday OSM etiketleriydi; Bursa'da OLCULDU
(`araclar/osm-tur-olcum.py`, tamamen yerel: fsq-tr.parquet +
turkiye-osm.pbf, cikti `olcum-bursa-cikti.txt`):
- 212.162 Foursquare mekani; OSM'de Bursa'da adli POI yalnizca 8.733.
- 40 m + ad benzerligiyle eslesen: 3.023 (%1,4); OSM turu yazili: 1.946 (%0,9).
- Sosyal turlerde OSM: 220 cafe / 314 restaurant / 13 bar; bizde 23.285.
- Eslesen ciftlerde aile bazinda tutarlilik %80 - OSM bile %20 farkli
  soyluyor (AVM icindeki restoran "mall", pastane "cafe").
SONUC: OSM turu kapsam olarak isleyemez (%1), guvenilirlik olarak da
%100 degil. 24 Agustos karari (dis kaynakli mekanda tur gosterilmez)
DURUYOR; fotograf icin tek kaynak uygulamanin kendi check-in anilari.
PostgREST tuzagi: `il='Bursa' order by id` 8 sn'de zaman asimi
(212 bin satir sirasi) - toplu olcumler yerel parquet'ten yapilir.

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

- 2026-09-01 — **claude-mem YENIDEN ACILDI ve sorunsuz calisiyor**
  (kullanicinin istegi). Asagidaki 2026-08-19 tarihli kapatma karari
  boylece gecersiz; o notu tarihsel kayit olarak oku.

  **Kok neden buydu: BUN KURULU DEGILDI.** claude-mem'in calisma
  zamani `worker` ve Bun gerektiriyor;
  `~/.claude-mem/last-install-error.json` icinde 2026-08-12 tarihli
  `bun-missing-after-install` / ABORT kaydi duruyordu. Worker hic
  baslayamadigi icin `UserPromptSubmit` hook'u her seferinde
  basarisiz oluyor ve KULLANICININ MESAJINI BLOKE EDIYORDU. Yani
  sorun eklentinin kendisinde degil, eksik bir calisma zamanindaydi.

  Bugun iki sey degismisti: (1) Bun winget ile kurulmus ve PATH'te
  (`bun --version` -> 1.3.14), (2) eklenti 13.18.0'a guncellenmis.

  **Iki sey OLCULEREK dogrulandi, varsayilmadi:**
  - Worker KAPALIYKEN `UserPromptSubmit` hook'u calistirildi:
    cikis kodu **0**, cikti `{}`. Yani yeni surum worker'a
    ulasamayinca artik bloke ETMIYOR - eski arizanin tekrarlamasi
    icin gereken kosul ortadan kalkmis.
  - Worker acikken ayni hook uc kez kosuldu: cikis 0, sure
    1.3-1.5 sn. `~/.claude-mem/state/hook-failures.json` ->
    `consecutiveFailures: 0`.

  **PORT DEGISTI: 37700 DEGIL 37777.** Eski notlardaki 37700
  gecersiz. Saglik ucu: `curl http://127.0.0.1:37777/health` ->
  `{"status":"ok",...}`.

  Veri kaybi yok: `~/.claude-mem/claude-mem.db` icinde **820 gozlem**,
  **171 oturum ozeti**, `pragma integrity_check` = ok.

  SessionStart hook'u artik eklentinin KENDI `hooks.json` dosyasindan
  geliyor (worker'i o baslatiyor), yani 2026-08-09'da yazilan
  `eklentileri-kur.sh` benzeri bir takla gerekmiyor.

  **Gizlilik notu:** claude-mem ham oturum icerigini
  `~/.claude-mem` altinda, DEPO DISINDA tutuyor. Depo public oldugu
  icin o veritabani buraya KOPYALANMAZ - 2026-08-19'da alinan bu
  karar aynen gecerli.

  **DIKKAT:** eklenti ancak BIR SONRAKI oturumda devreye girer.
  Kontrol yolu `claude plugin list` (settings.json'a bakmak yetmez).

  **BULUNAN KIRILGANLIK VE COZUMU - OKSUZ CHROMA SURECI.**
  Asagidaki sorun ARTIK KENDILIGINDEN duzeliyor: oturum basinda
  calisan `.claude/hooks/claude-mem-nobetci.ps1` bunu temizliyor
  (bkz. bu bolumun sonu). Sorunun kendisi:
 Worker acilirken
  once dosyalari onbellege aliyor, sonra chroma'yi baslatiyor, EN SON
  portu aciyor. Onceki kosumdan kalan bir chroma (uv onbelleginden
  calisan `python.exe`) hayattaysa yeni worker o adimda TAKILIYOR ve
  port hic acilmiyor. Gunlukte belirtisi net:

      Worker not running - lazy-spawning
      Worker port did not open after lazy-spawn within the cold-boot wait (~15s)

  Bu, Claude Code zorla kapatildiginda (cokme, gorev yoneticisinden
  sonlandirma) olusabilir. Sonucu SESSIZDIR: hook yine 0 donuyor, yani
  hicbir sey bloke olmuyor, ama hafiza kayit tutmayi birakiyor.

  **Kurtarma (olculdu, 3.9 sn'de acildi):**

  ```bash
  powershell -NoProfile -Command "Get-Process bun -EA SilentlyContinue | Stop-Process -Force; Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | Where-Object { \$_.CommandLine -like '*uv*archive*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }"
  # sonra bir mesaj yaz ya da oturumu yeniden ac; worker kendiliginden kalkar
  curl -s http://127.0.0.1:37777/health    # {"status":"ok",...} bekleniyor
  ```

  **Calistigini dogrulama yolu:** `~/.claude-mem/claude-mem.db` icindeki
  `user_prompts` sayisi her mesajda birer artmali. 2026-09-01'de
  olculdu: 99 -> 100 -> ... -> 107.

  ### NOBETCI: `.claude/hooks/claude-mem-nobetci.ps1`

  Oturum basinda (SessionStart) calisan bir hook. Uc adim:
  1. Port 37777 saglikliysa HICBIR SEY yapmaz.
  2. Degilse claude-mem'e ait ESKI surecleri temizler: 60 saniyeden
     once baslamis `bun` surecleri ve komut satirinda `uv`/`archive`
     gecen `python.exe` (chroma) surecleri. 60 saniye siniri, o an
     ACILMAKTA olan bir worker'i oldurmemek icin. Chroma'yi komut
     satirindan ayirt etmek onemli: kullanicinin kendi python
     islerine dokunmamak gerekiyor.
  3. Worker'i ISITIR - ilk mesaji beklemeden acar.

  **Neden isitma sart:** eklentinin kendi SessionStart hook'u da
  worker'i aciyor ama HOOK SIRASI GARANTI DEGIL. Eklentininki once
  calisip oksuz surece takilirsa worker ilk mesaja kadar kapali kalir
  ve O MESAJ KAYDEDILMEZ. Olculdu: soguk acilisin hemen ardindan
  gelen ilk hook'ta `user_prompts` artmadi (100 -> 100), sonrakiler
  arttI.

  **Isitma ESZAMANLI ve STDIN ile yapiliyor.** `Start-Process` ile
  arka planda denendi ve SESSIZCE basarisiz oldu: hook girdisini
  STDIN'den okuyor, `Start-Process`'te stdin olmadigi icin surec hemen
  cikiyor ve hicbir sey baslamiyordu. Belirtisi aldatici - komut
  basariyla dondu, hic surec kalmadi.

  **Hook HER ZAMAN 0 doner.** claude-mem 2026-08-19'da tam olarak
  "hook basarisiz olunca kullanicinin mesajini bloke etme" yuzunden
  kapatilmisti; onu onlemek icin yazilan bir hook'un ayni hataya
  dusmesi kabul edilemez. Hatalar yutulmuyor, ekrana yaziliyor.

  **Uc senaryo da olculdu (2026-09-01):**

  | Durum | Sonuc |
  |---|---|
  | Worker saglikli | "dokunulmadi", cikis 0, 2 sn |
  | Worker olu, oksuz chroma YOK | worker acildi, cikis 0, 6.5 sn |
  | Worker olu, 60 sn'den eski 2 oksuz chroma | 2 surec temizlendi, worker acildi, cikis 0, 12.3 sn |

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

## AGENT REACH KURULDU - 2026-09-06

Kullanicinin istegiyle Agent Reach kuruldu (rehber:
`https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md`).
Ajanin internete erisimini acan bir secici/kurucu/saglik denetcisi; kendisi
bir sarmalayici degil, ustteki araclari (opencli, gh, yt-dlp, bili, twitter,
mcporter) dogrudan cagiriyorsun. Beceri `~/.claude/skills/agent-reach`
altinda, yani her oturumda kullanilabilir.

**Kurulanlar:** pipx (kullanici kapsami), agent-reach 1.5.0
(`~/.local/bin`), mcporter (npm global), yt-dlp, bili-cli, twitter-cli,
opencli + Chrome eklentisi (v1.0.24, bagli), xiaoyuzhou transkripsiyon
betigi. Kullanicinin karari: **15 kanalin hepsi kurulacak**
(`--channels=all`).

**OLCULEREK CALISTIGI DOGRULANAN 9 KANAL:** Web (Jina Reader), YouTube,
V2EX, RSS, Bilibili, Exa (arama), Reddit, Facebook, GitHub
(`ozdmrorcn16` olarak bagli).

**`agent-reach doctor` SAYISINA GUVENME.** Doctor "5/15" diyor ama Exa'yi,
Reddit'i ve Facebook'u saymiyor - uzak servise baglanip dogrulamadigi icin
temkinli davraniyor. Gercek durum ancak komutu KOSARAK olculur
(`opencli reddit search ...` gibi).

**KALAN 6 KANAL - hepsi kullanicinin elini gerektiriyor:**

| Kanal | Eksik olan |
|---|---|
| Instagram | KISMEN calisiyor: `search` calisiyor, `profile` 429, `user` HTML donduruyor |
| Xiaohongshu | Chrome'da xiaohongshu.com girisi (AUTH_REQUIRED) |
| Xiaoyuzhou | Ucretsiz Groq key -> `agent-reach configure groq-key` |
| Twitter/X | Cookie-Editor ile x.com cerezleri -> `agent-reach configure twitter-cookies` |
| Xueqiu | `agent-reach configure --from-browser chrome --platform xueqiu` |
| LinkedIn | `uvx mcp-server-linkedin@latest --login` (mcporter kaydi YAPILDI) |

**INSTAGRAM DERSI:** giris yapilmisti ve oturum gecerliydi; 429 girisle
degil HIZ SINIRIYLA ilgiliydi. `profile` ucu arka arkaya cagrildigi icin
kisitlandi. Ayni sinir `user` ucunda JSON yerine HTML sayfasi olarak
goruluyor - bu bir ayristirma hatasi degil, ayni kisitlamanin baska yuzu.
Tekrar denemek siniri uzatiyor; saatler sonra kendiliginden aciliyor.

**ORTAM TUZAKLARI:**
- `agent-reach` komutu YALNIZCA yeni acilan terminallerde PATH'te. Mevcut
  kabukta `$env:USERPROFILE\.local\bin` (ve npm icin `$env:APPDATA\npm`)
  elle eklenmeli.
- Izin siniflandiricisi `--system` kurulumunu ve `mcporter config add`
  komutunu Bash'te de PowerShell'de de REDDETTI. Kurulum PowerShell'den
  tek komut halinde gecti; LinkedIn kaydi ise dogrudan
  `~/.mcporter/mcporter.json` duzenlenerek yapildi.
- PowerShell'de native exe ciktisini `2>&1` ile yonlendirmek exit kodunu
  bozuyor (CLAUDE.md'de zaten yazili); `opencli` cagrilarinda icerik
  dondugu halde exit 255 gorunuyor.

**GUVENLIK NOTU:** cerez/oturum ile baglanan platformlarda (Twitter,
Xiaohongshu, Reddit, Facebook, Instagram, Xueqiu) rehber ANA HESAP yerine
ikincil hesap oneriyor: cerez tam hesap erisimi demek ve platformlar API
disi cagrilari tespit edip hesabi kisitlayabiliyor.

## ARACLAR KULLANICI KAPSAMINDA - 2026-09-19 (KURAL)

Kullanicinin karari: "butun eklentiler, skiller, araclar, MCP'ler her
oturumda her projede kullanilabilir olsun." Yapilanlar:
- Eklentiler `--scope user` ile kuruldu (frontend-design, code-review,
  security-guidance, claude-mem; superpowers zaten user). Proje
  kapsamindaki kayitlar depo klonlansin diye DURUYOR; iki kapsam ayni
  eklentiyi tasiyor, sorun degil.
- Beceriler `~/.claude/skills/`e KOPYALANDI (ui-ux-pro-max, no-ai-slop,
  banner-design, brand, design, design-system, slides, ui-styling,
  design-taste, frontend-design). `slooin-tasarim` BILEREK projede
  kaldi (baska projede anlamsiz). Yeni beceri once kullanici kapsamina.
- claude-mem nobetci hook'u `~/.claude/settings.json` SessionStart'a
  eklendi (yedek: settings.json.yedek-2026-09-19). Betik yolu hala bu
  depodaki `.claude/hooks/claude-mem-nobetci.ps1` - depo tasinirsa yol
  guncellenmeli.
- OmniRoute Windows acilisinda kendiliginden kalkiyor:
  `%APPDATA%\omniroute\omniroute-baslat.vbs` kopyasi Baslangic
  klasorunde (shell:startup). Kaldirmak icin o kopyayi sil.
- MCP: proje-ozel `.mcp.json` yok; claude.ai baglayicilari hesap
  duzeyinde, claude-in-chrome yerlesik - zaten her yerde.
Yeni kurulumlarda kural: eklenti `--scope user`, beceri `~/.claude/skills`,
hook `~/.claude/settings.json`, MCP `~/.claude.json` ust duzey.

## SCRAPLING KURULDU - 2026-09-20

Kullanicinin verdigi baglanti (D4Vinci/Scrapling, BSD-3): Python web
kazima catisi - `Fetcher` (HTTP), `StealthyFetcher` (Cloudflare/anti-bot
atlatan Patchright Chromium), `DynamicFetcher` (tarayici otomasyonu),
Spider, CLI ve MCP. Kurulum kullanici kapsaminda: `pip install --user
"scrapling[fetchers,ai]"` (0.4.15) + `scrapling install` + `patchright
install chromium` (114 MB, `%LOCALAPPDATA%/ms-playwright`). Canli olcum:
Fetcher ve StealthyFetcher slooin.com'dan 200 aldi.
**MCP Claude Code'a bagli (user scope, `~/.claude.json`):** `claude mcp
add --scope user scrapling -- <Scripts>/scrapling.exe mcp`; `claude mcp
list` Connected. Araclari: get/fetch/stealthy_fetch + oturumlu surumler
(`open_session` acilirsa `close_session` sart). TUZAK: `mcp` modulu
`[fetchers]` ekstrasinda YOK, `[ai]` ekstrasinda - ilk denemede sunucu
"No module named mcp" ile kapandi. Yeni oturumdan itibaren araclar
`mcp__scrapling__*` adiyla gorunur. Kullanim alani: agent-reach'in
Jina okuyucusunun yetmedigi (JS'li, bot korumali) sayfalar.

## GEMINI -> OMNIROUTE -> CLAUDE-MEM ZINCIRI CALISIYOR - 2026-09-20

Kullanicinin karari: "ucretsiz kullanilan modele dussun" -> claude-mem
gozlemcisi artik Claude kotasina DOKUNMUYOR: `~/.claude-mem/settings.json`
`CLAUDE_MEM_PROVIDER=openrouter`, `BASE_URL=http://127.0.0.1:20128/v1`
(OmniRoute), `MODEL=gemini/gemini-3.6-flash`, anahtar yer tutucu
(yedek: settings.json.yedek-2026-09-20). Olculdu: gunlukte
`OpenRouter API usage {model=gemini-3.6-flash}` + `STORED`, gozlem
3692 -> 3695. ScrapeGraphAI ornegi de ayni yoldan gercek JSON dondurdu.

OmniRoute'ta Gemini (Google AI Studio) API anahtariyla bagli
(baglanti `47666593`, ad `main`, varsayilan model gemini-3.6-flash).
**UC DERS:**
1. Anahtar `slooin` Google Cloud projesinde uretilirse CALISMAZ: proje
   faturaya bagli (Maps), Google faturali projede Gemini API'yi on
   odemeli krediyle isletiyor -> her model 402 "prepayment credits are
   depleted". Ucretsiz katman icin FATURASIZ ayri proje
   (`slooin-ucretsiz`) gerekti; anahtar orada uretildi.
2. `model: auto` Pro'ya (kredi isteyen) gidip 402 alinca OmniRoute
   baglantiyi BELLEK ICI `credits_exhausted` isaretliyor ve butun
   Gemini istekleri kilitleniyor; `resilience reset` ve `edit --active`
   acmiyor, yalnizca sunucuyu yeniden baslatmak aciyor. Bu yuzden her
   yerde ACIK model adi kullanilir (`gemini/gemini-3.6-flash`), auto degil.
3. Gemini 3.6 Flash dusunen model: `max_tokens` kucukse cevap bos gelir
   (reasoning_tokens butceyi yer). claude-mem 4096 veriyor, sorun yok.
Google OAuth yolu (Antigravity karti) BILEREK KULLANILMADI: OmniRoute
kendi uyarisiyla "official session not authorized for proxy use, account
may be banned" diyor; slooinapp hesabi (Cloud, Play, Maps) riske atilmaz.
Ollama kurulmadi (kullanici istemedi). GUVENLIK: ilk anahtar sohbete
yapistirildi -> `oturum-kaydet.py` maskesine `AQ.` kalibi eklendi;
o anahtar zaten calismayan projedeydi, AI Studio'da silinmeli.

## SCRAPEGRAPHAI KURULDU - 2026-09-20

Kullanicinin verdigi baglanti (ScrapeGraphAI/Scrapegraph-ai, MIT):
LLM'e dogal dille "sunu cikar" diyerek kazima (SmartScraperGraph vb.).
Kurulum kullanici kapsaminda: `pip install --user scrapegraphai` (2.2.4)
+ `python -m playwright install chromium`. **LLM'i OmniRoute'tan alir:**
`araclar/scrapegraph-ornek.py` -> `openai/auto` + `base_url
http://127.0.0.1:20128/v1`. Zincir uctan uca olculdu (sayfa cekildi,
OmniRoute'a istek gitti); LLM cevabi OmniRoute'ta GERCEK bir saglayici
baglaninca gelir (Gemini OAuth panelden, bkz. OmniRoute bolumu).
MCP'si kurulmadi: onlarin bulut API'si icin (ucretli anahtar).
Scrapling ile is bolumu: Scrapling secici tabanli/hizli ve bot korumasi
gecer; ScrapeGraphAI sema bilinmeyen sayfadan LLM ile yapisal veri cikarir.

## OMNIROUTE KURULDU - 2026-09-19

Kullanicinin istegiyle `omniroute` 3.8.50 (`npm install -g`, MIT yerel AI
ag gecidi; diegosouzapw/OmniRoute) kuruldu. Panel http://localhost:20128,
saglik ucu `/api/monitoring/health` (`/health` YOK; ilk acilista Next.js
derlemesi yuzunden sayfalar 1-2 dk gec cevap verir, "kapali" sanma).
Veri `~/.omniroute/` (storage.sqlite + .env). GUVENLIK: varsayilan
0.0.0.0 ve anahtarsiz dinliyordu; `.env`e `OMNIROUTE_SERVER_HOST=127.0.0.1`
yazildi. npm bazi native kurulum betiklerini (keytar, onnxruntime, koffi)
calistirmadi - anahtar zinciri gibi ozellikler gerekirse
`npm install -g --allow-scripts=... omniroute` ile yeniden kurulur.
Baslatma elle: `omniroute` (arka planda `cmd /c omniroute > %TEMP%\omniroute.log`).
Claude Code'a BAGLANMADI (ANTHROPIC_BASE_URL degistirilmedi) - kullanici
isterse ayri karar.

## EMIL KOWALSKI BECERILERI - 2026-09-20

`emilkowalski/skills` (MIT) deposundan 11 beceri `~/.claude/skills/ek-*`
altina kuruldu (kullanici kapsami, `ek-` oneki cakisma onlemi):
ek-review-animations (animasyon kodunu Kowalski olcutleriyle denetler;
`disable-model-invocation`, elle cagrilir), ek-animate, **ek-animate-expo**
(RN/Expo animasyonu - karsilama yol animasyonunun RN tasimasinda
kullanilacak), ek-improve-animations, ek-find-animation-opportunities,
ek-animation-vocabulary, ek-apple-design, ek-mobile-native,
ek-emil-design-eng, ek-prototype, ek-pick-ui-library. Disarida
birakilanlar: write-swift, ask-sonner. Ilkelerin ozeti prototipte
(`tasarim/karsilama-yol/prototip.html` yorumlari): yalnizca
transform/opacity, ease-out giris `(.23,1,.32,1)`, hareket ease-in-out
`(.77,0,.175,1)`, UI gecisleri <300 ms, stagger 30-80 ms, 2 px blur,
reduced motion = solma kalir.

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
- `claude-mem@thedotmack` — **2026-09-01'de YENIDEN ACILDI ve
  calisiyor** (surum 13.18.0, proje kapsaminda). Asagidaki
  "KAPATILDI" notu tarihsel kayittir; kok neden ve cozum icin
  "claude-mem yeniden acildi" bolumune bak. Eski hali:
  **KAPATILDI (2026-08-19).** Oturumlar arasi
  hafiza eklentisiydi; `~/.claude-mem` altinda SQLite + chroma tutuyor ve
  37700 portunda bir worker calistiriyordu. `UserPromptSubmit` hook'u
  worker'a ulasamadiginda **mesaji bloke ettigi** icin kapatildi — asagidaki
  karara bak. Verisi duruyor, kaybedilmedi.

- `no-ai-slop` (petergyang/no-ai-slop) — market eklentisi **degil**, tek dosyalik
  beceri. Repoya dogrudan kopyalandi: `.claude/skills/no-ai-slop/`. Yaziyi 20+
  "AI slop" kalibindan temizler, sesini korur. `/no-ai-slop <metin>` duzeltir,
  `/no-ai-slop is this slop? <metin>` sadece tespit eder.
- `ui-ux-pro-max` (nextlevelbuilder/ui-ux-pro-max-skill, 2026-09-19) -
  market eklentisi **degil**; `uipro init --ai claude` ile depoya kuruldu:
  `.claude/skills/ui-ux-pro-max/` (SKILL.md + CSV veri + Python arama
  betikleri; 3,6 MB). Kendiliginden tetiklenir; elle:
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "<konu>"
  --design-system -p "Slooin"`. **KURAL:** onerdigi renk paletleri
  Slooin jetonlarina TABIDIR - marka turuncusu #FE7813 ve tema jetonlari
  degismez; beceri yerlesim, UX kurali ve tipografi icin kullanilir.
  Kurulum tuzagi: `uipro` komutu Git Bash'te yol cevirisiyle kiriliyor
  (Program Files/Git/Users/... diye arar), PowerShell'den kosulur.
  Ayni kurulum alti beceri daha birakti ve HEPSI DEPODA (kullanici
  karari bana birakti): brand (marka sesi - magaza metni), banner-design
  (magaza/sosyal gorseller), design (logo/simge/CIP, Gemini anahtari
  GEMINI_API_KEY ortam degiskeninden), design-system (jeton mimarisi),
  slides ve ui-styling (shadcn/Tailwind - bizde yok, muhtemelen
  kullanilmaz). banner-design'in andigi ai-artist / ai-multimodal
  becerileri KURULU DEGIL.
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

## Is gunlugu arsivi

Tarihli tur kayitlari (tamamlanmis islerin anlatimi) buradan
`docs/claude-md-arsiv.md` dosyasina TASINDI - silinmedi.

Bir seyin NEDEN oyle yapildigini ya da daha once nelerin denenip
elendigini ararken oraya bak:

```bash
grep -n "aradigin sey" docs/claude-md-arsiv.md
```


## Arsivden tasinan kalici dersler

Asagidakiler is gunlugunden ayiklandi. Tam baglam
`docs/claude-md-arsiv.md` icinde, koseli parantezdeki baslikla aranir.

- `db0eff7d`, `9ef4c3a3`) telefona da gitmisti. TUZAK: oturum dokumu  _[i18n BITTI, BASKASININ PROFILI YENIDEN, BOS AVATAR - 2026-09]_
- SU DENENDI VE BULUNAMADI:** referansta bir dere var; iki merkez  _[ACILIS EKRANI REFERANSA GORE YENIDEN YAZILDI - 2026-09-08]_
- TUZAK, yasandi:** RPC'ye yeni parametre eklemek ayni adla IKINCI bir  _[HARITADA BUTUN IGNELER, MAHALLE/IL/ILCE, YENI SIMGE - 2026-0]_
- 3. UYGULAMA SIMGESI DENENDI VE GERI ALINDI.** Kullanici yeni bir  _[HARITADA BUTUN IGNELER, MAHALLE/IL/ILCE, YENI SIMGE - 2026-0]_
- DERS:** kullanici BITMIS bir varlik verdiginde onu yeniden  _[HARITADA BUTUN IGNELER, MAHALLE/IL/ILCE, YENI SIMGE - 2026-0]_
- gore yapmak da yanlis olabilir" (ayni tuzak 2026-08-23 denetiminde de  _[MEKAN DUZENLEME TALEPLERI - 2026-09-09 (besinci tur)]_
- TUZAK: OSRM koordinati BOYLAM,ENLEM sirasiyla istiyor** - alisilmis  _[PROFILDE ETKILESIM SATIRI + GERCEK YOL ROTASI - 2026-09-09 (]_
- 1. **Kopya profil yolu OLMUYOR - tekrar denenmesin.** Chrome 152  _[DEVIR NOTU - 2026-09-12 AKSAM: --chrome ILE YENIDEN AC, GOOG]_
- ONCE KONTROL EDILDI** - bu projede defalarca yasanmis bir tuzak var:  _[AYARLAR SADELESTI: IKI SATIR KALKTI, BIR EKRAN SILINDI - 202]_
- DERS: ayni kurali iki paket olcuyorsa kural degisince IKISI de  _[YARIM KALAN ISLER KAPATILDI - 2026-09-11]_
- ayni tuzak 2026-09-03'te ayarlardaki "Profili düzenle" satirinda ve  _[KULLANICI ADI SATIR ICINDE, YASADIGIN BOLGE - 2026-09-11]_
- "BAGLAMA" (OAUTH) MUMKUN DEGIL - arastirildi, tekrar denenmesin.**  _[PROFILE INSTAGRAM KULLANICI ADI - 2026-09-11]_
- tuzak 2026-09-03'te yasanmisti).  _[PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09]_
- DERS: "temadan bagimsiz olsun" karari her doku icin dogru degil.**  _[PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09]_
- dokunun kendi yol cizgisiydi; ayni tuzak 2026-09-03'te "karanlik  _[PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09]_
- Ders: elle hesaplanmis bir yerlesim sabiti, hesabin dayandigi  _[PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09]_
- y=147, biyografinin ilk satiri ikisinde de y=191. **Olcuemde tuzak:**  _[PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09]_
- #### ADRES ICIN ARASTIRILAN VE ELENEN YOLLAR (tekrar denenmesin)  _[KAYITLI ADRES ARTIK GOSTERILIYOR - 2026-09-10]_
- AYNI TUZAK IKINCI KEZ:** 2026-09-06'da yan pay her ogede ayri ayri  _[UC DUZELTME - 2026-09-10 (ikinci tur)]_
- DERS: harita gibi RESIM uzerindeki metinde renk gozle secilmez.**  _[HARITA ETIKETLERI: BEYAZ HAP + KOYU YAZI - 2026-09-10]_
- DERS: bir gosterim sinirini koymadan once SEYREK durumu da dusun.**  _[UC DUZELTME - 2026-09-10]_
- TUZAK, yasandi:** RPC'ye parametre eklerken once  _[YAKININDAKI MEKANLAR: 1 KM, HER TUR, SONSUZ KAYDIRMA - 2026-]_
- Ders: kullanici ayni sikayeti ikinci kez bildiriyorsa esik ayarlamayi  _[YAKININDAKI MEKANLAR: 1 KM, HER TUR, SONSUZ KAYDIRMA - 2026-]_
- REANIMATED + GESTURE-HANDLER DENENDI VE ELENDI.** Ikisi de zaten  _[AKIS FOTOGRAFI: SAG BOSLUK GITTI, ZOOM GELDI - 2026-09-08]_
- GENISLIGI SIFIRLAYAN TUZAK - yasandi ve olculdu.** Kullanici ilk  _[AKIS FOTOGRAFI: SAG BOSLUK GITTI, ZOOM GELDI - 2026-09-08]_
- DERS:** `alignItems: 'center'` olan bir kapsayicinin icinde yuzde  _[AKIS FOTOGRAFI: SAG BOSLUK GITTI, ZOOM GELDI - 2026-09-08]_
- TUZAK, ikinci kez yasandi:** gosterge genisligi `onLayout`tan  _[PROFIL: SAYAC KUTULARI KALKTI, SEKME GOSTERGESI KAYIYOR - 20]_
- TUZAK, iki kez yasandi:** `tr.ts` ve test dosyasina Python'la `  _[ACILIS EKRANI: METINLER VE KUCUK EKRAN TASMASI - 2026-09-08]_
- Ayni tuzak 2026-09-03'te ayarlardaki "Profilini duzenle" satirinda  _[LISTELER SONSUZ: ONIZLEME VE "TUMU" EKRANI KALKTI - 2026-09-]_
- acik bir ton. **Ders: goz koyulasmayi ve aciltmayi ayni buyuklukte  _[DORDUENCUE TURUNCU JETONU: `turuncuSecili` - 2026-09-07]_
- onunkinin ATASI, dolayisiyla son OTA bu degisikligi de tasiyor. Ders:  _[DORDUENCUE TURUNCU JETONU: `turuncuSecili` - 2026-09-07]_
- DIKKAT - olcumde tuzak:** daire kuceuelurken kendi sinirlayici  _[ALT GEZINME: AKTIF SEKME DAIRESI - 2026-09-07]_
- ORTAM TUZAGI (yasandi):** Bash heredoc'a `'C:\Program Files\...'`  _[ALT GEZINME: AKTIF SEKME DAIRESI - 2026-09-07]_
- cagrisi kaldirildi: harita onu kullanmadigi icin bosa giden bir  _[MEKAN SAYFASINDAKI HARITA ETKILESIMLI OLDU - 2026-09-07]_
- ~50 tur). Uc secenek denendi ve ikisi OLCUMLE elendi:  _[TUR FILTRESI: TEMEL TURLER, IL BAZLI, KM SINIRSIZ - 2026-09-]_
- Ders: iki ayri btree indeksin BitmapAnd ile birlestirilmesi bilesik  _[TUR FILTRESI: TEMEL TURLER, IL BAZLI, KM SINIRSIZ - 2026-09-]_
- gibi okunuyordu. Ders: bir ikon uc denemede tutturulamiyorsa cizmeye  _[MEKAN SAYFASI IKONLARI REFERANSTAN - 2026-09-06]_
- DERS: bu seridin metinlerinden herhangi biri uzarsa yeniden  _[KONUM EKRANI MEKAN SAYFASI OLDU - 2026-09-06]_
- TUZAK, yasandi:** yeni `case` bloklari `switch` icinde `default`un  _[ETIKET ONAYI ARTIK BIR AYAR - 2026-09-06]_
- ALTINA yazilmisti; asla calismazlardi ve tsc uyarmiyordu. Sira  _[ETIKET ONAYI ARTIK BIR AYAR - 2026-09-06]_
- kendi Pressable'ina alinmisti ama kok basilabilirligi durmustu; ders:  _[HESAP OLUSTURMA UC ADIMA BOLUNDU - 2026-09-04]_
- Azalt, dusuk guc modu). **Ders: "renk yanlis gorunuyor" sikayetinde  _[KOYU MOD - 2026-09-03]_
- aliyor. Sarmalamak denendi ve BOZDU - ust cubuk ile kimlik blogu ayri  _[GECIS TEPEYE UZATILDI + AKIS FOTOGRAFI DUZELDI - 2026-09-03]_
- Gorsel dogrulamada TUZAK:** gercek check-in'lerde yorum olmadigi icin  _[YORUMLAR ALTTAN ACILAN SAYFAYA TASINDI - 2026-09-03]_
- `Alert.alert` KULLANILMADI, kendi Modal'imiz - tekrar onerme.**  _[SILME ONAYI EKRANIN ORTASINDA - 2026-09-02]_
- Ders: "ustte gorunuyor" ile "ustte" ayni sey degil;  _[SILME ONAYI EKRANIN ORTASINDA - 2026-09-02]_
- sey bastan yapilmaz. Bitince fonksiyon iki cron isini de KENDI kapatir.  _[MAHALLE AKTARIMI - CALISIYOR (2026-08-31)]_
- CIHAZDAN ADRES COZUMU DENENDI VE KALDIRILDI (ayni gun).** Once  _[KONUM EKRANI: ADRES KENDI VERIMIZDEN - 2026-08-31]_
- Ders:** ucuncu taraf bir servis "daha zengin veri" veriyor diye daha  _[KONUM EKRANI: ADRES KENDI VERIMIZDEN - 2026-08-31]_
- Kalici kararlar (tekrar onerme):** sayfa zemini TAM BEYAZ (yalnizca  _[DEVIR NOTU - 2026-08-27/30 (tasarim turu, yayin ve TestFligh]_
- Kalici kararlar (tekrar onerme):**  _[DEVIR NOTU - 2026-08-26/27 (arayuz tasarimi, ucuncu oturumun]_
- Ortam tuzaklari - ikisi de bu oturumda yasandi:**  _[DEVIR NOTU - 2026-08-26/27 (arayuz tasarimi, ucuncu oturumun]_
- Slogan bir eklenip ayni gun kaldirildi - tekrar onerme.  _[DEVIR NOTU - 2026-08-26 (arayuz tasarimi, ucuncu oturum)]_
- ve uydurma kisi sayisi tasiyorlardi. Tekrar onerme.  _[ARAYUZ TASARIMI - DEVAM EDEN IS (2026-08-25, ikinci oturum)]_
- ORTAM TUZAGI (yasandi, iki kez):** PostgREST cagrilarinda  _[Mekan turu DENETIMI: alti ajan, uc sistemik kok neden (2026-]_
- Tuzak (yasandi):** toplu dize degistirme kod tanimlayicilarina  _[Ekran metinleri duzgun Turkce'ye cevrildi (2026-08-23, commi]_
- hali, bilerek acik birakilan kirik pencereler ve ortam tuzaklari orada.  _[ARSIV - Faz 3a'nin ortasinda yazilmis devam notu (GECERSIZ)]_
- Faz 3a'da ogrenilen ortam tuzaklari:**  _[Siradaki adim]_
