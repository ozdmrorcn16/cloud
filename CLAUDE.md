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

### SLOOIN WEB SITESI EKLENDI - 2026-09-07 (henuz yayinda degil)

Magaza basvurusu icin ayri, statik bes sayfalik bir web sitesi
yazildi: `site/` (Astro 7.3.1, `output: 'static'`). Uygulamanin
kendisi degil, `mobil/`den TAMAMEN ayri bir proje - kendi
`package.json`'i, kendi `README.md`'si var (`site/README.md`).

    /            ana sayfa - tek ekranlik tanitim sahnesi
    /gizlilik    KVKK gizlilik metni  (Apple ve Play ikisi de sart kosuyor)
    /kosullar    kullanim kosullari   (bu is kaleminde SIFIRDAN yazildi)
    /destek      destek + SSS         (Apple Guideline 1.5, Support URL)
    /hesap-sil   web'den hesap silme  (Play sarti; JavaScript tasiyan tek sayfa)

**BARINDIRMA CLOUDFLARE PAGES, EAS Hosting DEGIL.** EAS Hosting
denendi (uygulamanin web surumu zaten orada) ama ozel alan adi
baglamak Expo'nun ucretli planini gerektiriyor; Cloudflare Pages
ucretsiz katmanda ozel alan adini destekliyor.

**HENUZ YAYINDA DEGIL.** Alan adi (`slooin.com`) satin alinmadi,
Cloudflare Pages projesi kurulmadi - ikisi de kullaniciya ait,
etkilesimli adimlar. Kurulunca proje ayarlari: kok dizin `site`,
derleme komutu `npm run build`, cikti klasoru `dist`; ortam
degiskenleri (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
yalnizca Cloudflare panelinde tanimlanir, depoya YAZILMAZ.

**UC AYRI YAYIN YOLU VAR, KARISTIRILMAMALI:**

| Hedef | Nasil |
|---|---|
| Bu site (`slooin.com`, yayinda olunca) | Cloudflare Pages, `main` dalina push ile otomatik |
| Uygulamanin web surumu (`slooin.expo.app`) | `cd mobil && npm run yayinla` |
| Telefon / TestFlight | `eas update --channel production` |

Bu siteye push atmak digerlerini GUNCELLEMEZ, digerlerini yayinlamak
bu siteyi GUNCELLEMEZ.

**DOGRULAMA ARACI: `site/araclar/dogrula.mjs`** (`npm run dogrula`).
Butun sayfalarin 200 dondugunu, hukuki sayfalarin JavaScript
kapaliyken de okunabildigini (Apple sarti), 1280/390 px'te yatay
tasma olmadigini, ic baglantilarin canli oldugunu ve cok dilli
yapinin (su an yalnizca `tr`, `site/src/i18n/diller.ts`) gercekten
calistigini olcuyor.

**CANLI SILME TESTI IKI GERCEK URETIM HATASI BULDU** (ikisi de bu is
kaleminde duzeltildi): (1) yayindaki `hesap-sil` Edge Function'i
ESKIYDI, depodaki e-posta destekli kod hic deploy edilmemisti - e-posta
ile acilmis hicbir hesap silinemiyordu; guncel kod deploy edilerek
duzeltildi. (2) `auth.admin.deleteUser` her cagrildiginda
`mekanlar.ekleyen_kullanici` INDEKSSIZ bir yabanci anahtar yuzunden
5,98 milyon satirlik `mekanlar` tablosunun tamamini tariyor ve ~10
saniyede zaman asimina duesuyordu; kismi bir indeks
(`where ekleyen_kullanici is not null`, `CONCURRENTLY`) eklenerek
duzeltildi, sonrasinda silme tek denemede ~59 ms'de tamamlandi. Test
`site/araclar/silme-canli-test.mjs` + `araclar/site-silme-test-hesabi.py`
- gercek (atilabilir) bir hesap acip GERCEKTEN siliyor, mock degil.

Telefon ekran goruntuleri (`site/public/ekran-*.png`) gercek test
hesabindan ama **provizyonel**: mobil'in WEB surumunden alindilar
(gercek harita yerine radar cizimi gosteriyor) ve kullanicinin
uzerinde calistigi ekran degisiklikleri bitince yeniden cekilmeleri
gerekiyor. Ayrinti ve yenileme komutu `site/README.md` icinde.

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

**ACIK BORC:** kayit ekranindaki metin "Kullanim kosullari"na atif
yapiyor ama boyle bir belgemiz YOK - yalnizca gizlilik metni var. O
belge magaza oncesi yazilmali.

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

### PUSH BILDIRIM METINLERI: arkadaslik dili + duzgun Turkce

Kullanicinin bildirdigi hata: kilit ekraninda "orcun takip istegini
kabul etti" yaziyordu. Iki sorun birdendi - "takip" dili ve ASCII
yazim. Bes metnin hepsi duzeltildi (`supabase/functions/bildirim-gonder/saf.ts`):

    Deniz sana mesaj gönderdi
    Deniz sana arkadaşlık isteği gönderdi
    Deniz arkadaşlık isteğini kabul etti
    Deniz sana sohbet isteği gönderdi
    Deniz sohbet isteğini kabul etti

**Edge Function DEPLOY edildi (surum 3).** Bu metinler SUNUCUDA, yani
OTA ile gitmiyor - `eas update` bunlari guncellemez. Deploy MCP
uzerinden yapildi cunku `supabase` CLI'da access token yok (interaktif
giris gerekiyor). **`verify_jwt` KAPALI olmali** - cagriyi pg_net
yapiyor ve elinde kullanici JWT'si yok; yetkilendirme sir dogrulamasina
dayaniyor.

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

**AYRICA - derleme arsivi 496 MB** ve her denemede ~1,5 dakikasi
yuklemeye gidiyor. `mobil/` altindaki gercek icerik ~50 MB (dist 41,
assets 3, .expo 2); geri kalani node_modules. `.easignore` eklenirse
kisalir ama DIKKAT: `.easignore` varsa `.gitignore` YOKSAYILIR, yani
node_modules dahil her sey o dosyada tek tek yazilmali.

**1. NATIVE DERLEME BEKLIYOR.** Su degisiklikler OTA ILE GITMEZ, yeni
bir iOS derlemesi gerekiyor: Apple ile giris, Google ile giris
(`@react-native-google-signin`), `LSApplicationQueriesSchemes` (yol
tarifinde kurulu olmayan harita uygulamasini gizleme). Bunlar kodda
DURUYOR ama telefondaki mevcut derlemede calismaz.

    npx eas-cli build --platform ios --profile production
    npx eas-cli submit --platform ios --latest

**2. APPLE / GOOGLE GIRISI SUPABASE'DE ACIK DEGIL.** Dugmeler ekranda;
basilinca "Bu giris yontemi su an kullanilamiyor" diyor. Adim adim
rehber: `docs/sosyal-giris-kurulumu.md`. Kullanicinin yapmasi gereken
panel isleri (Google Cloud OAuth istemcileri, Apple Services ID +
.p8, Supabase saglayici ayarlari). iOS'ta Apple ZORUNLU: baska bir
sosyal giris varsa App Store "Apple ile giris"i de sart kosuyor.

**3. SMTP.** Supabase'in yerlesik e-posta servisi saatte yalnizca
birkac mail gonderiyor - kendi testine yeter, gercek kullaniciya
yetmez. Alan adi alinip Resend SMTP olarak baglanmali (ucretsiz
katman ayda 3.000 mail).

**4. "Kullanim kosullari" belgesi YOK** ama kayit ekranindaki metin ona
atif yapiyor. Elimizde yalnizca gizlilik metni var. Magaza oncesi
yazilmali.

**5. Google Maps Android anahtari yok** - Android'de harita zemini gri
kalir. Ayrinti "KALAN (kullanicida)" bolumunde.

**6. ~~`test:gorunurluk` icinde ETIKET ONAYI senaryosu yok~~ KAPANDI**
(2026-09-02) - ve senaryo yazilir yazilmaz gercek bir kusur buldu;
bkz. asagidaki "ETIKET ONAYI HIC CALISMIYORMUS" bolumu.

**7. Panelde 1 bekleyen sikayet var ve GERCEK DEGIL:** 2026-08-23
tarihli, Plan 2 dogrulamasindan kalma bir MESAJ sikayeti. Gercek
kullanici sikayeti sanip islem yapma. Silinmedi cunku sikayet
verisine dokunmak geri alinamaz ve karar kullanicinin.

### DEVIR NOTU - 2026-09-02 (oturum sonu, her sey push edilmis)

Calisma dali `claude/plan2-moderasyon-paneli`, son commit `7dfdc7a`.
Kod tarafinda kaydedilmemis hicbir sey yok.

**YAYIN DURUMU - ikisi de yapildi ve OLCULEREK dogrulandi:**

| Hedef | Komut | Durum |
|---|---|---|
| Web (slooin.expo.app) | `npm run yayinla` | Canlida (paket `entry-70926d73...`) |
| Telefon / TestFlight | `eas update --channel production` | Yayinda, `channel:view` dogruladi |

Dogrulama yontemi: yayindaki paket icinde `onay-penceresi` testID'si
arandi. **Turkce metinle arama YAPMA** - kucultulmus pakette aksanli
harfler kacis dizisine donuyor ve `grep` sifir dondurup "yayin
gecmemis" yanilgisi uretiyor. Bu bir kez yasandi. ASCII bir testID ya
da sinif adi ara.

### ACILIS EKRANI REFERANSA GORE YENIDEN YAZILDI - 2026-09-08

Kullanici bir tasarim referansi gonderip "Acilis ekranini bunun aynisini
yap" dedi. Referans depoda: `tasarim/karsilama-referans.png`.

**YENI DUZEN:** marka -> tek cumlelik vaat ("Dışarıda kim var,
**keşfet.**") -> aciklama -> HARITA SAHNESI -> dort tanitim karti (2x2)
-> "Hesap oluştur →" -> "Hesabın var mı? Giriş yap" -> ODbL atfi.

**SAHNE ARTIK SOYUT DEGIL SOMUT.** 2026-09-03'te secilen "sicak nokta"
lekeleri kalkti; yerine gercek bir harita uzerinde dort igne geldi. Her
igne bir MEKAN: icinde orada olan insanlarin fotografi, saginda kac kisi
oldugu ("8 kişi"), altinda turu ("Kafe"). Ortada kullanicinin kendi
konumu - nabzi atan tek oge. Altta ozet serit: "Yakınında 24 kişi
dışarıda".

**IKI ESKI KURAL BU EKRANDA GECERSIZ - kullanicinin karari:**

1. **"Karsilama ekraninda uydurma veri yok"** (2026-08-27, ornek
   check-in kartlari bu yuzden kaldirilmisti). Referans sayilarla dolu
   ve kullanici "aynisini yap" dedi. Sayilar sunucudan gelmiyor,
   hicbiri kullanicinin cevresi hakkinda bir iddia degil - bir CIZIM.
   **Kural uygulamanin VERI YUZEYLERINDE aynen gecerli**; degisen
   yalnizca tanitim sahnesi.
2. **"Haritada yuz yok"** (yogunluk sayaci kimlik sizdirmasin diye).
   O kural GERCEK veriyle calisan ekranlar icin; buradaki yuzler
   referans gorselden gelen ornek gorsellerdir.

**AVATARLAR BU PROJE ICIN URETILDI.** Kaynak
`tasarim/karsilama-avatar-kaynak.png`: dort portrelik 2x2 bir izgara
(2048x1152, ElevenLabs / bytedance-seedream-5-pro ile uretildi, ~16
sent). `araclar/karsilama-avatar-uret.py` her hucreden yuzu kirpip
dairesel maskeyle 160 px PNG yaziyor. Igne SEKLI kodda SVG - renk
temadan geliyor, olcu ekrana gore degisiyor.

**ONCE REFERANSTAN KIRPILIYORDU VE YETMEDI.** Referanstaki igneler
kucuk oldugu icin kirpilabilen alan 32-40 px'di; buyutuIunce gozle
gorulur sekilde bulaniklasiyor ve tek kisilik ignelerin net
fotograflarinin yaninda belli oluyordu. Uc deneme de olcuIerek elendi:
arkadaki yuz (34 px), ondeki yuz + keskinlestirme (40 px), igne capini
kucultme. Kullanicinin karari bunun uzerine geldi: "Kaynak degil de
kendin bir yuz profili de ekleyebilirsin yenisini". Yeni kaynakta
hucre basina 1024x576 var, yani cozunurluk artik kisit degil.

**Yan fayda: LISANS BORCU KAPANDI.** Sahnedeki yuzler artik referans
gorselden gelmiyor, bu proje icin uretildi.

**OLCUM TUZAGI (referanstan kirparken yasandi, kayda geciyor):**
ignenin turuncu maskesinde "en genis satir" dairenin capi SANILDI, ama
bazi ignelerde sivri uc daha genis olcuIuyor ve daire 12 px yukari
kayiyordu - kirpilan parcada turuncu cerceve gorunuyordu. Dogrusu en
genis satiri yalnizca UST %60'lik bolgede aramak.

**HARITA VERISI GENISLETILDI.** `araclar/karsilama-yollari-uret.py`
artik yol agina ek olarak YESIL ALANLARI ve suyu da cekiyor; cikti
`karsilama-yollari.ts` -> **`karsilama-harita.ts`** olarak yeniden
adlandirildi (eski dosya silindi). Bursa/Nilufer: 9 ana + 24 orta + 141
ince yol, 49 yesil alan.

**SU DENENDI VE BULUNAMADI:** referansta bir dere var; iki merkez
olculdu, ikisinde de cizilebilir su cikmadi (kuzeydeki Nilufer Cayi
kadrajinda yalnizca iki kucuk havuz vardi, ikisi de en kucuk cevre
esiginin altinda). Merkez asil yerinde birakildi - orada yol dokusu
daha zengin (ana yol 9'a karsi 2). Su cizim yollari kodda DURUYOR,
baska bir sehir secilirse kendiliginden calisir.

**REFERANSTAN IKI BILINCLI SAPMA:**

1. **Etkinlik ignesi yukari alindi** (y %63 -> %50). 390 px'lik bir
   telefonda alt serit ayni metinle oransal olarak referanstakinden cok
   daha genis kaliyor (dar tuval) ve ignenin tur etiketini ortuyordu.
   Ekran goruntusuyle olculdu.
2. **Haritanin uzerindeki haplar TEMADAN BAGIMSIZ.** Zemin ve yazi
   sabit (`HARITA.hap` / `HARITA.hapYazi`). Ilk yazimda yazi
   `renk.metin`di ve KOYU MODDA beyaz hapin uzerinde acik yaziya
   donuesuep okunamaz oluyordu - koyu mod ekran goruntusunde yakalandi.
   Harita iki modda da acik, dolayisiyla uzerindeki her sey acik zemine
   gore secilir.

**SAHNE GENISLIGI `Dimensions`TAN BASLIYOR**, sifirdan degil: sifirla
baslasa ilk kare bos bir harita cizer, olcum gelince igneler birden
belirirdi. Ayrica testte `onLayout` hic tetiklenmedigi icin igneler HIC
gorunmuyordu - bu, testin yakaladigi gercek bir kusurdu.

**"ETKINLIK" ETIKETI KALDIRILDI** (kullanicinin istegi 2026-09-08,
ayni gun): uygulamada oyle bir tur YOK ve bir tanitim ekraninin olmayan
bir ozelligi ima etmesi magazada yanlis beyan sayilir. Igne DURUYOR -
fotografi ve "5 kişi" rozetiyle; kalkan yalnizca alttaki tur hapi.
`Igne.turAnahtari` artik opsiyonel, yoksa hap hic cizilmiyor.

Yan temizlik: `TurIkonu` artik ignenin ADINA degil ETIKETE bagli
(`tur` prop'u). Ayni sey iki alandan turetilseydi biri kaldirilinca
digeri olu kalirdi - nitekim nota ikonu tam oyle oldu ve silindi.

### PROFIL SAYAC ETIKETLERI: SILIKTEN OKUNURA - 2026-09-08

Kullanicinin bildirdigi kusur: "Koyu modda ani fotograf arkadaslar
yazisi silik kalmis daha belirgin bir hale getirmeliyiz."

**OLCULDU, gozle karar verilmedi.** Etiketler `metinSoluk`
kullaniyordu; o jetonun sayfa zeminine karsi orani:

    acik mod  #A39B93 / #FFFFFF  ->  2,74:1
    koyu mod  #7C736A / #121110  ->  4,06:1

Ikisi de metin icin gereken 4,5 esiginin ALTINDA - yani kusur yalnizca
koyu modda degildi, acik modda daha da kotuydu ve fark edilmemisti.

Yeni degerler: secili olmayan etiket `metinIkincil` (5,63 / 7,96),
secili olan `metin` (18,48 / 16,63). Secim farki korunuyor ama artik
"soluk ve okunmaz" ile degil "koyu ve daha koyu" ile anlatiliyor.

Kontrast paketi bu jetonu ZATEN kilitliyordu
(`metinIkincil` >= 4,5, her yuzeyde); yalnizca yorumu guncellendi ki
etiketlerin de o iddiaya bagli oldugu gorunsun.

**"Arkadaşlarım" -> "Arkadaş"** (ayni mesajdaki ikinci istek). Sayacin
yanindaki etiket artik digerleriyle ayni bicimde: tekil ve sahipsiz
(Anı / Fotoğraf / Arkadaş).

### PROFIL ZEMINI TAMAMEN BEYAZ - 2026-09-08

Kullanicinin istegi: "Profil sayfasinin arka planini tamamen beyaz
yap." **2026-09-03'te secilen seftaliden beyaza gecis KALDIRILDI** -
asagidaki "PROFIL BANDI: DOLU TURUNCU -> YUMUSAK GECIS" bolumu artik
tarihsel bir kayittir.

`LinearGradient` ve `tepeGecisi` stili silindi; zemin kokten geliyor
(`renk.zemin`), yani profil de uygulamanin geri kalaniyla ayni beyaz
kuralina tabi. `expo-linear-gradient` importu da dustu - paket
bagimliliklarda duruyor, baska bir ekran isterse hazir.

Gecisle birlikte gelmis SICAK TONLU iki sabit de jetona cevrildi
(`#F0DCC9` ayirici, `#E7D3C0` kenarlik): beyaz zeminde bunlar bir
yerden arta kalmis gibi duruyordu, artik `renk.cizgi`.

**PROFIL HALA KENDI UST PAYINI KOYUYOR** (`_layout.tsx` icindeki
`kendiUstPayiniKoyar`). Gerekce degisti, sonuc ayni: eskiden gecis
saatin ardina uzansin diyeydi, simdi kok duzenin verdigi pay ile
ekranin kendi payi ust uste binmesin diye.

**Testler yeni gercege cevrildi, silinmedi:** "band dolu turuncu degil,
seftaliden beyaza gecis" -> "profil zemini TAM BEYAZ: renkli band YOK"
ve gecisin konumunu olcen test -> "kimlik blogunun kendi zemini YOK".
Ikincisi onemli: bloga bir renk geri konursa test kirilir.

Iki modda da ekran goruntusuyle dogrulandi
(`tasarim/profil-beyaz.png`, `profil-beyaz-dark.png`).

### PROFIL: SAYAC KUTULARI KALKTI, SEKME GOSTERGESI KAYIYOR - 2026-09-08

Kullanicinin iki istegi: "Profil ekraninda ani fotograf arkadaslarin
etrafindaki kare sutunu kaldir boyutlarini kucult" ve "Anilar ve en sik
yazisina kaydirmali sutun getir".

**SAYAC KUTULARI:** kenarlik, zemin ve golge kalkti; geriye ikon + sayi
+ etiket kaldi. Olculer de kucuIdue (ikon 38x34 -> 30x27, sayi 23 -> 20,
dikey dolgu 12 -> 8). Uc kutu bandin altinda agir bir serit
olusturuyordu ve bandin kendisi zaten bir yuzey.

**SECIM ARTIK RENKTE.** Kutu kalkinca "hangi bolum acik" gostergesi de
kalkiyordu - o kartlar 2026-09-05'ten beri sayac DEGIL BOLUM SECICI.
Secili olanin sayisi turuncu, etiketi koyu ve kalin; otekiler notre
duesuyor. Renk tek basina anlam tasimasin diye AGIRLIK da degisiyor.

**SEKME ARTIK HAP SEGMENT.** Ilk gecuiste alt cizgi kayan bir seride
cevrilmisti; kullanici netlestirdi: "hap sekilde bastan sona icinde
kaymali sutunlu butonlu". Simdi kapsayici bastan sona uzanan turuncu
tonlu bir hap, icinde beyaz + turuncu kenarlikli bir BUTON kayiyor.

**DIL KESFET EKRANINDAN ALINDI** (oradaki Harita/Liste segmenti):
kapsayici `turuncuZemin`, secili buton `yuzey` + 1.2 turuncu kenarlik,
secili yazi `turuncuYazi`, oteki `metinSoluk`. Ayni isi yapan iki
bilesenin iki farkli gorunusu olmasin.

Kayan dolgu SEKMENIN DEGIL kapsayicinin cocugu ve agacta EN ALTTA:
sekmeye baglansaydi her sekmenin kendi dolgusu olur, kayma diye bir sey
olmazdi; butonlardan sonra cizilseydi yazilari orterdi. Dikeyde
`top`/`bottom` ile geriliyor - sabit yukseklik yazilsaydi punto
degisince hap sekmeye oturmazdi.

Yay SERT ve SONMUS (`speed: 18, bounciness: 0`): iki sekme bitisik
oldugu icin tasip geri donen bir hareket "yanlis sekme secildi" gibi
okunuyor.

**CANLI OLCULDU** (puppeteer, 40 ms araliklarla): kayan buton x=19'dan
x=195'e **10 ara konumdan gecerek** gidiyor ve tasma yapmadan duruyor.
Genislik 176 = (390 - 2x16 - 2x3) / 2, yani sayfa payi ve hapin ic
dolgusu duesuelmues hali.

**ORTAK KANCA: `src/tasarim/hareket.ts`.** "Hareketi azalt" ayarini
okuyan mantik karsilama sahnesinde zaten vardi; ikinci kez yazmak
yerine `useHareket()` olarak cikarildi. Ayar aciksa gosterge kaymiyor,
`setValue` ile aninda geciyor.

**TUZAK, ikinci kez yasandi:** gosterge genisligi `onLayout`tan
geliyordu ve testte o olay hic tetiklenmedigi icin gosterge HIC
cizilmiyordu. Baslangic degeri artik `Dimensions`tan turetiliyor -
ayni cozum karsilama sahnesinde de kullanilmisti. Yan fayda: gercek
kullanimda ilk kare de dogru.

### ACILIS EKRANI: METINLER VE KUCUK EKRAN TASMASI - 2026-09-08

Kullanicinin uc istegi (sirayla geldi):

1. Baslik **"Dışarıda kim var, keşfet."** -> **"Yakınında kim var,
   keşfet."**
2. Alt yazi degisti: **"Check-in yap, yeni insanlarla tanış.
Yakınındaki
   popüler yerleri keşfet."** Satir sonu ELLE veriliyor - dogal sarmaya
   birakilirsa kirilma cumlenin ortasina duesuyor.
3. **"Harita verisi © OpenStreetMap katkicilari" ekrana sigmiyordu.**

**TASMANIN KOK NEDENI OLCULEREK BULUNDU.** Ekran kaydirilamayan duz bir
`View`di ve icerik telefonda ekrandan uzundu. Web'de gorunmuyordu cunku
tarayicida guvenli alan insetleri SIFIR; telefonda ust ~59 + alt ~34 pt
gidiyor. Ekran goruntusu araci artik viewport olcusunu argumanla
aliyor ve **390x751** (844 eksi insetler) telefondaki tasmayi birebir
uretiyor:

    node araclar/ekran-goruntusu.mjs karsilama cikti.png 390 751

Olculen: 751 px'te once "Hesabın var mı? Giriş yap" kesiliyordu, atif
hic gorunmuyordu.

**UC KATMANLI COZUM:**
- Kok `View` -> **`ScrollView`** (`contentContainerStyle` icinde
  `flexGrow: 1`). Icerik siginca kaydirma HIC olusmuyor; sigmayinca
  geri getirilebiliyor. Onceki halde tasan sey kaybediliyordu.
- **Alt guvenli alan payi** eklendi: `guvenliAlan.bottom` sabit bir
  degerin yerine geciyor.
- Dikey bosluklar kisildi (kart dolgusu, kartlar arasi bosluk, buton ve
  ikincil eylem paylari, sahne alt siniri 230 -> 165).

**IGNELERIN DIKEY ARALIGI DA DEGISTI** (%20/%52 -> %13/%55): sahne
`flex` oldugu icin kisa telefonlarda 165 px'e iniyor ve o yukseklikte
ust ignenin tur hapi ile alt ignenin kisi hapi CAKISIYORDU. Yuzde
konumlar sabit oldugu icin aralik EN DAR sahneye gore secilmeli.

**TUZAK, iki kez yasandi:** `tr.ts` ve test dosyasina Python'la `
`
yazarken kacis kayboluyor ve dosyaya GERCEK satir sonu giriyor; sonuc
"unterminated string" ve jest'in dosyayi hic ayristiramamasi. Ters
boluyu `chr(92)` ile kurmak gerekiyor.

### AYNI EKRAN, KULLANICININ UC DUZELTMESI - 2026-09-08

Kullanici ilk gecuisi telefonda gorup uc sey istedi: "Ayni yerde 3
profil gorunenleri teke duesuer tek resim olsun, bos check-in
ignelerini de kaldir, check-in yap yazisi da sanki uzerine basilmis
gibi obuerlerinden koyu, onu da obuerleriyle ayni yap."

| Istek | Ne yapildi |
|---|---|
| Tek profil | Kafe ve Etkinlik ignelerindeki UC yuzluk kolaj kalkti; dort ignede de tek yuz. Caplar da esitlendi (%10,5) - buyuk daire kolaj icindi |
| Bos igneler | Cevreye serpistirilmis yedi kucuk igne SILINDI. Hicbir sey anlatmiyorlardi: sahnenin soyledigi "su mekanda su kadar kisi var", bos igne ne mekani ne kisiyi gosteriyordu |
| Kart vurgusu | Ilk karttaki turuncu tonlu zemin kalkti, dordu de ayni. Vurgu degil BASILI HAL gibi okunuyordu - uygulamanin geri kalaninda dolgunun koyulasmasi tam olarak "su an basiliyor" demek |

**BONUS DUZELTME:** ayni ekran goruntusunde "Restoran" etiketi
"Res..." diye kirpiliyordu. Sebep: haplar ignenin COCUGUYDU ve metin
sarmasi ignenin genisligiyle (~40 px) sinirli kaliyordu. Haplar
sahnenin dogrudan cocugu yapildi; artik ihtiyaci kadar genisliyorlar.

Yeni test: `__tests__/ekranlar/karsilama.test.tsx` (6 test) - vaat
cumlesi, dort kart, sahnedeki tur/sayi/serit, iki eylem ve ODbL atfi.
Dogrulama: jest 64 paket / 727 test, tsc uygulama kodunda 0 hata, iki
modda da ekran goruntusu (`tasarim/karsilama-referansa-gore.png`,
`karsilama-referansa-gore-dark.png`).

### LISTELER SONSUZ: ONIZLEME VE "TUMU" EKRANI KALKTI - 2026-09-07

Kullanicinin kurali: "Yapilan butun paylasimlar check-in'ler hem ana
sayfaya hem profile duesecek, ayni check-in yapilsa da yapilan butun
paylasimlar profilde de gorunecek, orda kalicak kullanici tek tek
silmek isteyene kadar." Ardindan: "Ekle ve profilde tumu sekmesini
kaldir direk profilde tumu hep gorunsun" ve "Ana sayfada profilde hep
asagi dogru kaydirilabilsin".

**VERI TARAFI ZATEN DOGRUYDU** (migrasyon 20260907130000): `check_in_yap`
her zaman YENI satir aciyor, hicbir cron satir silmiyor, iki akista da
teklestirme yok. Canli olculdu: `byorcun` hesabinda 21 satir / 11 mekan,
yalnizca bugun "Hadim erikli subesi"ne BES ayri check-in (11:52, 14:35,
14:59, 15:07, 21:22) ve hepsi duruyor.

**DEGISEN IKI SEY GOSTERIMDI:**

| Yer | Onceki | Simdi |
|---|---|---|
| Ana sayfa akisi | En yeni 30 kayit, devami HIC yuklenmiyor | Sonsuz: sona yaklasinca sonraki sayfa iniyor |
| Profil > Anilar | UC kart onizleme + "Tumu" baglantisi | Hepsi burada; kaydirdikca cizim penceresi buyuyor |

**AYRI "Anılarım" EKRANI SILINDI** (`src/app/profil/anilar.tsx` ve
testi). Erisim yalnizca o "Tumu" baglantisindaydi; baglanti kalkinca
ekran oksuz kalirdi. **Icindeki islemler profile TASINDI** - profil
onizlemesindeki kartlar SALT OKUNURDU (silme, not duzenleme, etiket
kaldirma yalnizca o ayri ekranda vardi). Tasinmasaydi kullanicinin
"kullanici tek tek silmek isteyene kadar" kurali uygulanamaz olurdu.
Ayni tuzak 2026-09-03'te ayarlardaki "Profilini duzenle" satirinda
yasanmisti: bir girisi kaldirmadan once o islemin baska girisi var mi
diye BAK.

**IMLEC OFFSET DEGIL ZAMAN.** `akisiGetir(adet, oncesi?)` ikinci
parametreyi alinca `lt('olusturma_zamani', oncesi)` uyguluyor. `range`
ile sayfalansaydi iki istek arasinda yeni bir check-in eklendiginde
pencere bir satir kayar, ayni kayit iki kez gelir ya da bir kayit hic
gelmezdi. Ayrica kimlikle eleme var: iki kayit ayni ana denk gelirse
imlec onlari ayiramaz.

**TAZELEME ELDEKI KADARINI ISTIYOR.** `useFocusEffect` sabit bir sayfa
isteseydi, kullanici asagi kaydirip baska ekrana gidip donduegunde liste
ilk sayfaya duesuer ve okudugu yeri kaybederdi. Istenen adet
`max(mevcut uzunluk, sayfa boyu)`; uzunluk bir REF'ten okunuyor cunku
odak etkisi bos bagimlilik listesiyle calisiyor ve state'i eski gorurdu.

**PROFILDE VERI DEGIL CIZIM PENCERELENIYOR.** Butun anilar cekilmeye
devam ediyor - banttaki "Anı" sayaci, "En sık" listesi ve fotograf
izgarasi hepsinden besleniyor; sayfalansaydi "21 Anı" yerine "10 Anı"
yazardi. Cizim `ILK_CIZIM_ADEDI = 10` ile basliyor ve `ScrollView`in
`onScroll`u dibe bir ekran boyu kala pencereyi 10 buyutuyor. Profil bir
`FlatList` degil (ust blok + sekmeler + izgara ayni kaydirmada), yani
sanallastirma yok - yuzlerce karti bir anda cizmek acilisi yavaslatirdi.

**OLCUM TUZAGI - iki kez yasandi:** "sona geldim" olayi ne jest'teki
`fireEvent.scroll` ile ne de puppeteer'daki `mouse.wheel` ile
tetikleniyor. Jest'te olay dogrudan listeye gonderiliyor
(`fireEvent(liste, 'endReached')`); tarayicida kaydirilabilir elemanin
`scrollTop` degeri dogrudan artiriliyor. `araclar/ekran-goruntusu.mjs`
artik `SLOOIN_KAYDIR=<tur>` ile kaydiriyor ve **her turda scrollTop'u
yazdiriyor** - sessizce kaydirmayan bir arac "sayfalama calismiyor"
diye yanlis teshise yol aciyor.

**CANLI DOGRULAMA (uc ayri olcum):**
1. PostgREST'e dogrudan imlecli istek: ilk sayfanin son kaydi
   12:41:27, ikinci sayfa 12:10:15'ten basliyor - cakisma yok, atlama
   yok.
2. Web'de sayfa boyu gecici 15 yapilip kaydirildi: liste yuksekligi
   **1702 -> 2839 px** buyudu ve en eski kayda ("6 gun once") kadar
   indi, sonra durdu.
3. Profil: kaydirildikca 10'un otesindeki kartlar cizildi, "Tumu"
   baglantisi ekranda YOK, her kartta uc nokta menusu duruyor
   (`tasarim/profil-tumu.png`, `profil-kaydirilmis.png`).

Dogrulama: jest 63 paket / 721 test, tsc yalnizca yedi taban hatasi.

### AKTIF CHECK-IN KARTI: EYLEMLER SATIR ICINE TASINDI - 2026-09-07

Kullanicinin istegi: "Ayrıldım sil kaldiriyoruz, konum ismi, su an
buradasin, kac kisi bunlar kaliyor."

**BU IS AYNI GUN IKI ADIMDA OLDU; SON HAL IKINCI ADIM.**

Once kullanicinin istegiyle "Ayrıldım" ve "Sil" butonlari kartdan
KALDIRILDI (asagisi o adimin kaydi). Ardindan yine kullanicinin
istegiyle GERI KONDULAR: "ayril ve sil yazisi yine ekle ama bulundugu
sutunu bozma."

**Degisen sey eylemlerin varligi degil YERI.** Eski halde kartin
altinda ayri bir buton satiri vardi ve karti uzatiyordu; simdi ikisi
"Şu an buradasın" SERIDININ ICINDE, sagda, yazi olarak duruyor. Serit
zaten `flexDirection: 'row'` oldugu icin yeni bir satir acilmiyor ve
kartin iki sutunlu duzeni (solda metin, sagda kisi sayisi) oldugu gibi
kaliyor - kullanicinin "sutunu bozma" kisiti tam olarak bu.

Etiket de degisti: **"Ayrıldım" -> "Ayrıl"**, mekan sayfasindaki
"Buradasın · Ayrıl" cubuguyla ayni kelime.

Dokunma alani `hitSlop={10}` ile buyutuldu: kucuk bir metnin kendi
yuksekligi 44 px esiginin altinda.

**MEKAN ADI ARTIK BASILABILIR** (ayni istek: "yapilan konumun uzerine
basilabilsin ve konum icerigi acilsin"). Listedeki satirlarla AYNI
yola gidiyor: `/harita/<id>`.

**KARTIN KOKU BASILABILIR DEGIL** ve bu bilincli: bir kabin tamamini
basilabilir yapmak icindeki her ogeyi de sessizce ayni eyleme baglar -
akis kartinda tam bu hata yasanmisti (2026-09-04) ve buradaki "Ayrıl"
ile "Sil" de o tuzaga duesuerdue. Iki testle kilitli: mekan adina
basinca `/harita/mekan-1` aciliyor, "Sil"e basinca HICBIR yonlendirme
olmuyor.

Asagisi ilk adimin (kaldirma) kaydidir:

**ISLEV KAYBI YOK - onceden kontrol edildi.** Kodda duran yorum
"check-in'i bitirmenin ve silmenin TEK YOLU bu" diyordu ve o ifade
ESKIMISTI; iki eylem de baska ekranlara tasinmisti:

    ayrilma -> mekan sayfasindaki "Buradasın · Ayrıl" cubugu
               (`harita/[mekanId].tsx`, 2026-09-06'da eklendi)
    silme   -> akis/anilar kartinin uc nokta menusu
               (`CheckInKarti` + `SecimPenceresi`, 2026-09-02)

Butonlar buradan kalkabildi cunku ikisi de zaten baska yerde vardi.
**Yeni bir eylem kaldirilirken ayni kontrol yapilmali:** o eylemin
baska bir girisi var mi.

Birlikte temizlenenler: `silOnayi` state'i, `ayril` ve `canliyiSil`
fonksiyonlari, `checkIndenAyril`/`checkIniSil`/`OnayPenceresi`
importlari, ve dort stil (`canliEylemler`, `ikincilButon`,
`ikincilButonYazi`, `silYazi`). Kullanilmayan kod birakilsaydi tsc
uyarmazdi - bu projede `noUnusedLocals` acik degil.

Ekran testindeki iddia TERSINE cevrildi: eskiden "Ayrıldım" ve "Sil"
gorunuyor olmalıydi, artik GORUNMEMELI. Iddiayi silmek yerine tersine
cevirmek onemli - boylece butonlar sessizce geri gelirse test kirilir.

Ekran goruntusu: `tasarim/kart-eylemsiz.png`. NOT: konum satiri ve kisi
sayisi o goruntude gorunmuyor, cunku ikisi de KOSULLU (mekan listede
degilse konum satiri, `kisiSayisi === 0` ise sayi cizilmiyor) ve test
hesabinda o kosullar saglanmiyor. Ikisinin de kodu degistirilmedi.

### CHECK-IN DUGMESINE NEON PARILTI - 2026-09-07

Kullanicinin istegi: "sabit sutundaki checkin dugmesinin altina da
yanindaki sutunlar gibi parlak neon bir isik koy, yanlarindaki
butonlardan referans al."

`merkezDaire` stilindeki notr `golge.yuzer` yerini TURUNCU parilti
aldi. Degerler aktif sekme dairesinden (`daireGovde`) BIREBIR alindi -
referans acikca o oldugu icin ikisi ayni degerleri paylasiyor:

    shadowColor: renk.turuncu
    shadowOpacity: 0.5
    shadowRadius: 12
    shadowOffset: { width: 0, height: 6 }
    elevation: 10

**Biri degistirilirse digeri de degismeli**, yoksa cubukta iki farkli
parilti dili olur.

`golge.yuzer`in YERINI aliyor, yanina gelmiyor: RN'de tek bir golge
var, iki tanim ust uste yazilir ve sonuncusu kazanirdi. Golgenin eski
isi (dugmeyi cubuktan ayirmak) kayboluyor degil - renkli parilti onu
daha da guclu yapiyor.

Iki modda da ekran goruntusuyle dogrulandi (`tasarim/neon-light.png`,
`neon-dark.png`); koyu zeminde parilti belirgin sekilde daha guclu
okunuyor.

### DORDUENCUE TURUNCU JETONU: `turuncuSecili` - 2026-09-07

Kullanicinin bildirdigi sey: "sabit sutundaki checkin dugmesine
basinca koyu renk oluyor, daha acik parlak bir renk olsun."

**KOK NEDEN BIR ROL KARISIKLIGIYDI.** `turuncuBasili` IKI ayri isi
birden yapiyordu ve ikisi ZIT yonde ayar ister:

    basili  = parmak su an uzerinde, ANLIK   -> KOYULASMALI
    secili  = o bolumdesin, KALICI bir hal   -> PARLAKLASMALI

Check-in dugmesi aslinda BASILI degil SECILI (yola bagli, kalici) ve
koyu bir ton orada "basildi" degil "sonmus" okunuyordu. Ayni jeton
`giris` ve `karsilama` ekranlarinda gercek basili hal icin de
kullaniliyor - orada koyulasma DOGRU, o yuzden jetonun kendisi
degistirilmedi.

**YENI JETON `turuncuSecili: '#FF8419'`** (iki palette de ayni),
yalnizca check-in dugmesinin secili halinde ve o dugmenin ikonunun ic
dairesinde kullaniliyor.

**TON AYNI GUN BIR KEZ KISILDI.** Ilk deger `#FF9142` idi ve kullanici
"cok acik renk olmus" dedi; istegi "basilmadan onceki rengi kalsin,
basinca SADECE daha parlak gorunsun, obur butonlar gibi olsun."

**"Obur butonlar kadar ama ters yonde" diye simetrik bir hesap denendi
ve ELENDI** - ilgin bir sonuc verdi: butonlarin basili haldeki
koyulasmasi 0,0938 parlaklik ve ayni miktarda YUKARI cikmak 0,4393
hedefi veriyor, yani zaten cok acik bulunan #FF9142'den (0,4190) DAHA
acik bir ton. **Ders: goz koyulasmayi ve aciltmayi ayni buyuklukte
algilamiyor; parlak yonde ayni sayisal fark cok daha buyuek gorunuyor.**

Secilen fark, butonlarin basili farkinin UCTE BIRI:

    marka   #FE7813  parlaklik 0,3455   beyaz igne 2,65
    secili  #FF8419  parlaklik 0,3783   beyaz igne 2,45   (+0,0328)
    elenen  #FF9142  parlaklik 0,4190   beyaz igne 2,24   (cok acik)
    elenen  #FFA45C  parlaklik 0,4600   beyaz igne 1,96   (igne soluk)

Farki kucultmek ikon okunurlugunu da iyilestirdi (2,24 -> 2,45).

Kontrast paketinde farkin BUYUEKLUEGUE de kilitli: 0,02 ile 0,05
arasinda olmali - alt sinir farkin gozle secilebilir kalmasi, ust
sinir kullanicinin "cok acik" dedigi denemenin (+0,0735) altinda
kalmak icin.

**TON OLCUELEREK SECILDI, tahminle degil.** Beyaz konum ignesinin
dugme uzerindeki kontrasti:

    turuncu (marka)  #FE7813   2,65
    turuncuBasili    #E06509   3,48   (koyu - basili hal icin dogru)
    SECILEN          #FF8419   2,45
    elenen           #FF9142   2,24   <- kullanici "cok acik" buldu
    elenen           #FFA45C   1,96   <- igne gorunur sekilde soluk

**ODUN acikca kabul edildi:** 2,45 grafik esigi olan 3:1'in ALTINDA.
Bu, marka turuncusundaki ayni odunun devami (o da 2,65 ile altinda ve
`marka-turuncusu-degistirilmez` karariyla korunuyor). Secili dugme
ayrica BUYUEYUEP YUKARI KALKIYOR, yani ayirt edicilik yalnizca renge
yuklenmis degil.

**Bu, koyu moddaki eski notla CELISMIYOR.** Orada `turuncuBasili`
#FFA45C'ten #E06509'a geri koyulastirilmisti ve gerekce "alt
gezinmedeki aktif merkez dugme listedeki butonlardan daha ZAYIF
gorunuyordu" idi. O sorunun kaynagi tam da iki rolun tek jetonu
paylasmasiydi; ayirmak onu kokten cozuyor - butonlar koyu kaliyor,
check-in dugmesi parlaklasiyor.

Kontrast paketine uc iddia eklendi: secili ton markadan ve basilidan
PARLAK olmali (yon kilidi), ve 2,24 degeri OLCUM KAYDI olarak sabit
(`toBe`) - ton sessizce daha da acilirsa test kirilir ve karar yeniden
onune gelir.

**YAYINDA** (ayni gun): web `npm run yayinla`, OTA grup
`a8ef067f-16c3-4392-a36f-49e1e135d5c3`.

**DOGRULAMA RENGIN KENDISIYLE YAPILDI** - bir renk degisikliginde en
dogrudan olcum bu. Canli adrese puppeteer ile baglanilip dugmenin
`backgroundColor`i okundu:

    ana sayfadayken (pasif) : rgb(254, 120, 19)  = #FE7813 marka
    check-in ekraninda      : rgb(255, 145, 66)  = #FF9142 secili

**ORTAM NOTU - ayni depoda PARALEL BIR OTURUM calisiyordu.** Yayindan
hemen sonra o oturum kendi isini (`7e04230`, check-in canlilik suresi)
commit'leyip ayri bir OTA daha gonderdi, yani `channel:view` artik
BENIM grup kimligimi degil onunkini gosteriyor. Bu bir sorun degil:
`git merge-base --is-ancestor` ile dogrulandi, benim commit'im
onunkinin ATASI, dolayisiyla son OTA bu degisikligi de tasiyor. Ders:
paralel oturum varken `channel:view`daki mesaja bakip "benim yayinim
gitmemis" sonucuna VARMA; commit atalik iliskisini kontrol et.

### ALT GEZINME: AKTIF SEKME DAIRESI - 2026-09-07

Kullanici bir video gonderdi ("Navigation tabs V2", uc alt gezinme
varyanti) ve "bu videodaki tasarim orneklerini kopyalabilirmisin"
dedi. Uc varyant sunuldu, kullanici **ikincisini** secti: aktif
sekmenin ikonu yukari firlayip dolu bir daireye donuesuyor.

**HAREKET VIDEODAN KARE KARE OLCULDU** (ffmpeg ile 12 fps'te
kirpilarak): videodaki daire once cubugun icine iniyor, sonra yatay
olarak KAYIYOR, sonra yeniden cikiyor.

**AMA YANA KAYMA AYNI GUN KALDIRILDI - kullanicinin duzeltmesi:**
"yana kayiyormus gibi bir animasyon olmasi, sadece secilen one ciksin,
chekin dugmesine de aynisi olsun." Yani referanstaki yatay hareket
uygulanip GERI ALINDI; asagidaki "dalis" anlatimi tarihsel kayittir.

**SU ANKI HAREKET YERINDE:** daire birakilan sekmede kuceuelerek
cubugun icine cekilip soneuyor, sonra yeni sekmede yay ile buyueyerek
one cikiyor. Yatay konum ikisinin ARASINDA, daire tamamen gorunmezken
(`opaklik = 0`) aninda degisiyor.

**OLCULEREK DOGRULANDI** (puppeteer, 45 ms araliklarla): x degeri
19 -> 311.1'e SICRIYOR ve sicramanin oldugu karede opaklik tam 0; ara
konum (100, 150, 200 gibi) hic gorunmuyor.

**DIKKAT - olcumde tuzak:** daire kuceuelurken kendi sinirlayici
kutusu da daraliyor, bu yuzden `getBoundingClientRect().x` ayni slotta
dururken bile birkac piksel oynuyor. "x kac farkli deger aldi" diye
otomatik saymak YANILTICI sonuc veriyor; bakilacak sey x'in ARA
KONUMLARDAN gecip gecmedigi.

**CHECK-IN DUGMESI DE ONE CIKIYOR** (ayni istek): secilince yay ile
8 px yukari kalkip %10 buyueyor, birakilinca eski olcusune donueyor.
Olculdu: pasif `y=-5, genislik=68` -> secili `y=-15.7, genislik=74.8`
(8 px tasma + olcek buyuemesinin kutuya katkisi).

Tasma artik stilde degil ANIMASYONDA (`MERKEZ_TASMA` sabiti). Stilde
sabit bir transform birakilsaydi animasyonlu olan onu ezer ve ayni
ozelligi iki kaynak surerdi. Transform yine PRESSABLE'a veriliyor.

**Yan fayda:** daire artik check-in dugmesinin uzerinden gecmiyor,
ikisinin cakisma ihtimali tamamen ortadan kalkti.

Asagisi referansin ilk uygulamasidir, TARIHSEL:

**DALIS (artik yok):** daire ortadaki check-in dugmesinin uzerinden
gecmek zorundaydi ve ikisi de cubugun ustunde duruyordu; daire
kayarken cubugun ICINDE oldugu icin dugmeyle cakismiyordu.

**IKI NOKTADA BIREBIR KOPYA DEGIL, sebebi kayitli:**
1. Videodaki pembe/kirmizi gradyan yerine marka turuncusu `#FE7813`
   (o ton sabit, bkz. `marka-turuncusu-degistirilmez` hafizasi).
2. Videodaki varyantlarda merkez dugme yok; bizde check-in dugmesi
   duruyor ve animasyon onun etrafindan kurgulandi.

**ETIKETLER GERI GELDI.** Referans varyantta yoktular ve bir sure
kaldirilmislardi; kullanici geri istedi (2026-09-07: "sabit sutunu
butonlari eski haline getir, altlarinda yazi olan haline"). Yani daire
referanstan, etiketler bizden.

Geri gelmeleri IKI YERI etkiledi ve ikisi de olcuelerek duzeltildi:

1. **Check-in dugmesinin tasmasi transform yerine `marginTop`.**
   Etiketler yokken tasma transform'daydi (layout'u etkilemedigi icin
   satiri kisaltmiyordu). Etiketler gelince o cozum bozuldu: transform
   PRESSABLE'a uygulandigi icin ETIKETI de yukari tasiyor ve komsu
   etiketlerden 18 px yukarida birakiyordu. Simdi statik tasma
   `marginTop`ta, secili haldeki EK hareket ise ICTEKI DAIREYE
   uygulanan bir transform - etiket onunla oynamiyor. Pressable'a
   `hitSlop={{ top: 12 }}` verildi: daire secilince transform'la
   yukari cikiyor ve dokunma alani onunla tasinmiyor.

2. **Daireye ETIKET TELAFISI gerekti.** Yuva cubugun tam dikey
   ortasina oturuyor, ama hizalanmasi gereken sey cubugun ortasi degil
   IKONUN merkezi - etiket eklenince ikon kendi slotunda yukari kaydi
   (ikon + gap + etiket birlikte ortalaniyor). `daireYuva`ya
   `paddingBottom: 18` kondu (gap 4 + etiket satiri ~14), icerigi tam
   yarisi kadar (9 px) yukari itiyor.

   **OLCULEREK DOGRULANDI:** dairenin dalista inecegi merkez 783,0 ve
   ikonun merkezi 783 - dikey sapma 0 px, yatay sapma 0,2 px. Bu sayi
   etiketin puntosu ya da gap degisirse GUNCELLENMELI, yoksa daire
   dalista ikonun uzerine tam oturmaz.

**AKTIF SEKMEDE IKON GIZLI AMA ETIKET GORUNUR.** Ikonun yerini ustteki
daire aliyor; etiket ise slotta kalan tek isaret, gizlenseydi aktif
sekmenin adi hicbir yerde yazmazdi. Iki testle kilitli.

**YAYINDA ve CANLIDA DOGRULANDI** (2026-09-07): web `npm run yayinla`,
OTA grup `20e6a6f8-a2df-4455-8935-4917ef6a7a68`. Canli adresten alinan
ekran goruntusunde hem bes etiket (Ana sayfa / Bildirimler / Check-in /
Mesajlar / Profil) hem kartta "Ayrıldım" gorunuyor
(`tasarim/canli-son.png`).

**Kart dogrulamasi icin GECICI bir canli check-in gerekti:** test
hesabinin check-in'i sona ermisti ve kart hic cizilmiyordu. Veritabanina
`not_metni = GECICI-DOGRULAMA-SILINECEK` isaretli bir satir eklenip
goruntu alindi ve satir HEMEN silindi (silme dogrulandi, 0 kaldi).
Gercek veriye dokunulmadi.

**KARTTAKI ETIKET "Ayrıldım"** - bir tur "Ayrıl" yapilmisti (mekan
sayfasindaki cubukla ayni kelime olsun diye) ama kullanici geri
dondurdu. Yani kartta "Ayrıldım", mekan sayfasinda "Ayrıl"; ikisi
bilerek farkli.

**CUBUK KISALMADI - kullanicinin duzeltmesi.** Etiketler kalkinca
cubuk 80 -> 62 px'e duestu; kullanici "cubuk kisalmasin boyutu onceki
gibi olsun ona gore uyarla" dedi. Yeni `SATIR = 54` sabiti eski ic
yuksekligi kilitliyor (cubuk = 12 + 54 + 12 + 2 = 80). Bu ayrica
`ALT_GEZINME_PAYI`ni koruyor - o pay 45 ekranda kullaniliyor ve cubuk
kisalsaydi hepsinde alt bosluk buyurdu.

Merkez dugme artik `marginTop: -18` yerine **transform** ile
tasiniyor: marginTop dugmeyi yukari tasirken satirin yuksekligini de
KISALTIYORDU (54 - 18 = 36) ve cubugun kisalmasinin asil sebebi buydu.
Transform PRESSABLE'a veriliyor, icindeki daireye degil - RN dokunma
alanini transform'a gore hesapliyor, daireye verilseydi dugme yukarida
gorunup dokunma alani asagida kalirdi.

**ANIMASYON `Animated` ILE, Reanimated ile DEGIL.** Hareketin tamami
transform ve opacity, yani `useNativeDriver` ile JS kuyrugunu hic
mesgul etmeden calisiyor; ustelik web surumunde ek yapilandirma
istemiyor (ekran goruntusu araci orayi olcuyor). `react-native-svg`
15.15.4 `FeGaussianBlur`/`FeColorMatrix` tasiyor, yani videodaki
UCUNCU varyantin sivi damla efekti de ileride yapilabilir.
**Yeni paket gerekmedi, degisiklik OTA ile gidiyor.**

**CANLI OLCULDU** (puppeteer, `getBoundingClientRect` ile kare kare).
Kayma kaldirildiktan SONRAKI degerler:

    0-45 ms    CEKIL    daire kuceuelup soneuyor (op 1 -> 0.58 -> 0)
    ~90 ms     SICRAMA  x: 19 -> 311.1, opaklik 0 (gorunmuyor)
    135-225 ms ONE CIK  op 0 -> 1, cap 24 -> 47 -> 44 (yay asmasi)

Olcumler: cubuk 80 px, satir 54 px, dugme tasmasi 5 px (eskisiyle
birebir), daire tasmasi 17 px.

**TESTLER:** `__tests__/tasarim/alt-gezinme.test.tsx` (6 test). Bu
dosya `jest.unmock` kullaniyor - AltGezinme `jest.setup.js` icinde
GLOBAL mock'lu oldugu icin baska hicbir test onu render etmiyor, yani
bu sinif degisiklik ancak burada olculebiliyor.

**IKI KEZ YAYINLANDI** (2026-09-07, kullanicinin istegi). Ilki
referans uygulamasi, ikincisi kaymanin kaldirildigi duzeltme:

| Yayin | Web paketi | OTA grup |
|---|---|---|
| 1 - referans (kaymali) | `entry-86d8d90b...` | `63485624-808c-4678-88e0-3d063b01f0d3` |
| 2 - kayma kalkti | `slooin--et4cdr06yt` | `736f8a40-771d-4491-85f3-197ebdf904e1` |

Ilk yayin paralel bir oturumun "Su an disarida" seridini (commit
`bd25de2`) da tasidi.

**IKINCI YAYIN DAVRANISLA DOGRULANDI, paket adiyla DEGIL.** Sebep:
`npm run yayinla`dan sonra `eas update` calistirildiginda update kendi
`expo export`unu yapip yerel `dist/` klasorunu YENIDEN YAZIYOR, yani
yereldeki paket adi artik web'e yuklenen paketin adi degil. Bunun
yerine canli adrese puppeteer ile baglanip animasyon kare kare
olculdu: daire sol slotta soneuyor, GORUNMEZKEN sag slota geciyor,
orada beliriyor - iki slot arasindaki bolgede opakligi sifirdan buyuk
tek bir kare bile yok. Ilk yayinda ise ASCII testID araması yeterliydi
(o gun yeni testID'ler eklenmisti).

**ORTAM TUZAGI (yasandi):** Bash heredoc'a `'C:\Program Files\...'`
gibi ters bolulu bir yol gecirmek ters bolueleri yiyor; puppeteer
"Browser was not found at C:Program FilesGoogle..." diyor. Windows'ta
duez egik cizgi (`C:/Program Files/...`) kullan.

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

### TASARIM DENETIMI UYGULANDI - 2026-09-07

> **IKI DEGISIKLIK AYNI GUN GERI ALINDI (kullanicinin karari).**
> "Turuncu rengi eski haline cevir, ana sayfa akisi konumlar ismin
> yaninda yine turuncu gorunsun, altindaki tarih yine silinmis devam
> etsin."
>
> 1. **MARKA TONU `#FE7813` GERI GELDI.** Asagida anlatilan
>    koyulastirma (`turuncu` #F66A01, `turuncuYazi` #B04C01) gecersiz.
>    Uc jetonlu YAPI korundu ama `turuncu` ve `turuncuYazi` ayni marka
>    tonunu tasiyor; `turuncuBasili` #E06509. Marka tonu uzerinde
>    beyaz yazinin 2,65:1 verdigi BILINEN VE KABUL EDILEN bir odun -
>    bkz. `marka-turuncusu-degistirilmez` hafizasi. Tonu kontrast
>    gerekcesiyle bile oynatma.
> 2. **AKIS KARTINDA MEKAN ADI ADIN YANINDA VE TURUNCU.** Asagida
>    anlatilan iki satirli duzen (ad ustte, igne ikonu + ikincil metin
>    altta) gecersiz.
>
> **GERI ALINMAYANLAR** - hepsi duruyor: mekan adinin altindaki
> tekrar eden tam tarih (kullanici acikca korunmasini istedi), yer
> tutucular, ODbL atfi, eksik formun buton etiketi, koyu modda basili
> buton, opak gezinme cubugu, kart siniri, hayalet check-in butonlari,
> harita dugmelerinin hitSlop'u ve kontrast test paketi.
>
> Kontrast testi buna gore guncellendi: gecen esikler ESIK IDDIASI
> olarak, gecmeyen marka tonu degerleri ise OLCUM KAYDI olarak duruyor
> (`toBe(2.65)`). Ikincisini silmek "turuncu her yerde esigi geciyor"
> izlenimi birakirdi.


Kullanicinin istegi: "buldugun butun hatalari duzelt ve onerilerini
uygula uygulamayi olmasi gereken en iyi hale getir." Oncesinde bir
denetim yapilmisti (Artifact:
`https://claude.ai/code/artifact/005fb7ce-593d-482a-834d-f53a8fa1bd92`);
10 bulgunun hepsi kapatildi.

**BULGULARIN HEPSI OLCUMDEN GELDI, gozden degil.** Kontrast oranlari
`tema.ts` jetonlarindan WCAG bagil parlaklik formuluyle hesaplandi;
yerlesim kusurlari yayindaki surumun 390 px ekran goruntusunden. Hicbiri
gozle fark edilmemisti.

#### TURUNCU ARTIK UC JETON - en onemli degisiklik

Kok neden: TEK bir turuncu hem dolgu (uzerinde beyaz yazi) hem yazi
(acik zeminde) olarak kullaniliyordu. Bu iki rol ZIT YONDE duzeltme
ister, yani tek jetonla birini duzeltmek digerini bozar - nitekim
bozmustu (asagida).

| Jeton | Acik | Koyu | Rolu |
|---|---|---|---|
| `turuncu` | `#F66A01` | `#F66A01` | DOLGU ve IKON |
| `turuncuYazi` | `#B04C01` | `#FE7813` | METIN |
| `turuncuBasili` | `#D25C05` | `#D25C05` | BASILI dolgu |

`turuncuKoyu` DUSURULDU. 17 kullanim yeri roluene gore ikiye ayrildi
(4 dolgu, 13 yazi), ayrica `color: renk.turuncu` yazan 37 satir
`turuncuYazi`ya gecti.

Olculen sonuclar:

    turuncu dolgu / beyaz yazi ......... 2,65 -> 3,01
    beyaz zemin / turuncu yazi ......... 2,65 -> 5,41
    profil bandi / turuncu yazi ........ 2,21 -> 4,51
    KOYU MODDA basili buton etiketi .... 1,96 -> 3,98

**Marka tonu #FE7813 KAYBOLMADI:** koyu modda `turuncuYazi` olarak
aynen duruyor (orada zemin koyu, odun gerekmiyor) ve marka isareti
varliklari hic degismedi. Acik moddaki koyulastirma YALNIZCA acik
modun bedeli. Dolgudaki degisiklik ise ton ve doygunlugu koruyor,
yalnizca aciklik %54 -> %48; marka isaretiyle yan yana fark gozle
secilmiyor.

**IKONLAR CANLI KALDI.** `turuncu` ikon olarak beyaz uzerinde 3,01:1
veriyor ve metin olmayan ogeler icin gereken esik 3:1 - yani ikonlarin
koyulastirilmasina gerek yoktu, yapilsaydi vurgu gereksiz yere
sonerdi.

#### Diger dokuz bulgu

1. **Akis kartinda hiyerarsi ters donmustu.** Mekan adi turuncu ve yari
   kalindi, kisinin adini bastiriyordu, uzun adlarda iki satira tasip
   her kartin yuksekligini degistiriyordu. Ayrica zaman IKI KEZ
   yaziyordu (sagda "10 saat once", altta "06.09.2026 22:54"). Simdi:
   satir 1 ad (`metin`, kalin), satir 2 igne ikonu + mekan
   (`metinIkincil`, tek satir, `…` ile kirpilir), tam tarih KALDIRILDI.
   Turuncu yalnizca igne ikonunda.
2. **Kesfet ekraninda turuncu enflasyonu.** Ekranda ayni anda DORT dolu
   turuncu Check-in butonu + alti baska turuncu oge vardi. Listedeki
   butonlar HAYALET oldu (kenarlik + `turuncuYazi`); dolu turuncu
   ekranda tek kaldi - alt gezinmenin merkez dugmesi.
3. **Eksik formun butonu okunmuyordu.** `opacity: 0.45` butun butonu
   soldurdugu icin etiket 1,57:1'e duesuyordu; yeni kullanicinin
   gordugu ilk uc ekranda kullanici neye bastigini goremiyordu. Artik
   yalnizca DOLGU notre cekiliyor (`cizgi` + `metinIkincil`), buton
   basilabilir kaliyor.
4. **Yer tutucular** (14 alan) `metinSoluk` -> `metinIkincil`:
   2,74 -> 5,63 (acik), 4,06 -> 7,96 (koyu).
5. **ODbL harita atfi 2,23:1'di** - `opacity: 0.55` yuzunden. Hukuken
   zorunlu bir metin ekranin en zor okunan yeriydi. Opaklik kaldirildi,
   5,27:1.
6. **Kart siniri** `#EFEAE5` (1,20:1) -> `#DCD3C9` (1,48:1). NOT: 3:1
   grafik esigine cikmak MUMKUN DEGIL, olculdu - `#CFC4B8` bile 1,72:1
   veriyor ve daha koyusu karti cerceveli bir kutuya cevirir.
7. **Alt gezinme cubugu OPAK.** Yari saydamdi ama BULANIKLASTIRILMIYOR
   (gercek buzlu cam `expo-blur` ister, o da yeni bir native derleme);
   ardindan gecen icerik malzeme gibi degil cizim hatasi gibi
   okunuyordu. Ileride `expo-blur` eklenirse geri alinabilir.
8. **Harita dugmelerine `hitSlop={5}`.** 34x34'tuler ve dokunma esigi
   44. GORUNTU DEGISMEDI - olculer referans gorselden turetildigi icin
   onlara dokunulmadi, dokunma alani buyutuldu.
9. **`CLAUDE.md` karsilama bolumu yanlisti** (bkz. o bolumdeki
   duzeltme kutusu).

#### YENI TEST PAKETI: `__tests__/tasarim/kontrast.test.ts`

55 iddia, iki paleti de geziyor. Her metin jetonunu her yuzeyle
(zemin, yuzey, karsilama, cip, bandin iki tonu) esleyip esigi olcuyor;
dolgularin uzerindeki beyaz etiketi, basili halin ayirt edilebilirligini
ve ikon esigini de kontrol ediyor.

**Bunu yazmanin sebebi:** butun bu kusurlar aylarca fark edilmedi cunku
hicbir sey onlari olcmuyordu. Bir jetonun degeri ileride degistirilirse
bu paket kirilir. Yardimcinin kendisi de test ediliyor (siyah/beyaz 21,
ayni renk 1, ve denetimde olculen 2,65 degeri) - yoksa yanlis bir
hesap butun iddialari anlamsiz kilardi.

**Dogrulama:** jest 62 paket / 684 test (once 61/622), tsc yalnizca
yedi taban hatasi (`@types/node`, yalnizca test/arac dosyalarinda),
akis ve kesfet ekranlari iki modda ekran goruntusuyle karsilastirildi
(`tasarim/son-akis.png`, `son-kesfet.png`, `son-kesfet-dark.png`;
oncesi `inc-*.png`).

**Bir bulgu KISMEN uygulandi:** kart siniri icin uc yol onerilmisti ve
onerim "liste satirlarini kart olmaktan cikarmak"ti. Uygulanan (b)
sikki, yani yalnizca cizginin koyulastirilmasi. Sebep:
`referans-gorseli-birebir-uygula` kurali - kesfet ekranindaki kartlar
2026-09-06'da kullanicinin onayladigi bir REFERANS GORSELDEN geliyor
ve kart kapsayicisini silmek o referanstan yapisal bir sapma olurdu.
Bir butonun rengini degistirmek (hayalet buton) daha kucuk bir sapma
oldugu icin o uygulandi. Kart yapisini kaldirmak isteniyorsa karar
kullanicinin.

### KARSILAMA EKRANI: SICAK NOKTA **VE** OZELLIK LISTESI - 2026-09-04

> **DUZELTME (2026-09-07):** bu bolum uzun sure "dort baslik SILINDI"
> diyordu ve YANLISTI. Basliklar ayni gun kullanicinin istegiyle GERI
> GELDI; gerekce `karsilama.tsx` icindeki yorumda yazili: "Sahne uc
> vaadi hissettiriyor, bu dort satir onlari ADIYLA soyluyor - ikisi
> birbirinin yerine degil, birlikte calisiyor." Kaldirilan sey tek
> satirlik `soru`/`cevap` metniydi, `OzellikIkonu` bloklari DEGIL.
> Belge o son adimi kaydetmemisti; ekranin gercek halini gormek icin
> koda bak. Asagisi yazildigi gunun ilk halidir.


Kullanicinin istegi: karsilama ekrani check-in, tanisma ve populer
yerler algisini VERSIN. Uc tur gorsel sunuldu (once dort icerik yonu,
sonra alti gorsel dil, sonra dort kompozisyon); kullanici sonuncudan
**"1 - sicak nokta"** yi secti.

**ONCEKI HAL BIR OZELLIK LISTESIYDI:** dort ikon, dort baslik
("Check-in Yap", "Yakininda kimler var gor", "Sohbet Et", "Populer
yerleri kesfet"). Ne yaptigimizi ANLATIYORDU ama gostermiyordu. Ayrica
marka iki kez duruyordu - isaret ve kelime markasi ust uste.

**YENI EKRAN UC VAADI CIZIMLE TASIYOR** (`src/tasarim/KarsilamaSahnesi.tsx`):

| Oge | Vaat |
|---|---|
| Turuncu igne | check-in yapilmis bir yer |
| Avatar kumesi | orada olan insanlar (tanisma) |
| Lekelerin koyulugu | hangisi daha canli (populer yerler) |

Altinda tek soru ("Şu an nerede insan var?") ve tek satirlik cevap.
Dort baslik ve `OzellikIkonu` bloklari SILINDI; `adim1..4Baslik`
anahtarlari yerine `soru` ve `cevap` geldi. `SicaklikZemin`,
`CheckInSahnesi` ve `MarkaIsareti` bu ekrandan cikti (MarkaIsareti
kayit ekraninda kullanilmaya devam ediyor).

**UYDURMA VERI KURALI KORUNDU** - mekan adi yok, "yakininda su kadar
kisi var" iddiasi yok. Kumedeki "+4" bir veri degil kompozisyonun
parcasi; karsilama ekranindaki ornek check-in kartlari 2026-08-27'de
tam bu yuzden kaldirilmisti ve o karar duruyor. Avatarlar HARFLI
daireler: gercek yuz koymak hem uydurma olurdu hem de uygulamanin
"haritada yuz yok, yalnizca sayi" kuraliyla celisirdi.

**IKI YERLESIM KUSURU EKRAN GORUNTUSUYLE BULUNDU:** ikinci avatar
kumesi ekran kenarindan kirpiliyordu (sahne kenardan kenara oldugu
icin), ve ust uste binme SABIT -10 oldugu icin 24 px'lik kucuk
dairelerde harfin uzerini kapatiyordu. Ikisi de duzeltildi; binme artik
capa orantili.

**ARACA MOD ANAHTARI EKLENDI:** `araclar/ekran-goruntusu.mjs` artik
`SLOOIN_TEST_SEMA=dark|light` okuyor. Koyu mod geldikten sonra sart
oldu - verilmezse tarayici MAKINENIN ayarini kullaniyor ve karsilastirma
yaniltici cikiyor (bu bir kez yasandi: acik mod sanilan goruntu koyu
cikti).

Dogrulama: jest 60 paket / 578 test, tsc taban hatalari, ekran iki
modda da goruntulendi (`tasarim/karsilama-yeni-light.png`,
`karsilama-yeni-dark.png`).

**SINYAL ZAMANLAMASI - kullanicinin iki duzeltmesi (2026-09-04):**
"sinyaller cok hizli" ve "ekran acildiginda iki kucuk halka sinyalleri
biraz gec basliyor". Tur suresi **2800 -> 4200 ms**; sicak noktalarin
baslama gecikmeleri **900/1800 -> 250/500 ms**. Gecikmenin amaci uc
noktanin ayni anda atmasini onlemek, ama 1,8 saniyelik bir gecikme
kullanicinin ekrani ilk gordugu anda o noktayi SESSIZ birakiyordu -
yani orasi sicak nokta degilmis gibi duruyordu. Yarim saniyenin
altindaki gecikme senkronlugu yine kiriyor ama acilista bosluk
birakmiyor. Nokta ICINDEKI uc halkanin `TUR_SURESI / 3` gecikmesi
degismedi; ilk halka hemen dogdugu icin orada bosluk yok.

**MARKA YAZISI ORTALI, 132 px** (kullanicinin secimi 2026-09-04). Bes
yerlesim secenegi gorsel olarak sunuldu (sola yasli 108/150/196, ortali
132/200); kullanici 4'u secti. Onceki hal sola yasli 150 px idi.
Gerekce: sahnedeki en buyuk sicak nokta zaten ekranin orta ekseninde
duruyor, marka da oraya oturunca ikisi tek bir dikey omurga oluyor
(marka -> buyuk igne -> "Hesap olustur"). Sola yasli halde marka o
eksenden kacikti ve sahne sol ustten bastirilmis gorunuyordu.
Uygulamasi iki satir: `MarkaYazisi genislik={132}` ve stildeki
`alignSelf: 'center'`. Ekran goruntusu
`tasarim/karsilama-marka-ortali.png`.

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

### HARITADA IKI IGNE: DURUM RENGI + KULLANICI - 2026-09-07

Kullanicinin istegi: "Haritada konumun ignesi yogunluguna ve
sakinligine gore renk alsin ve haritada o an kullanici nerdeyse onun
ignesi de gorunsun turuncu ki sectigi konuma mesafesini gorebilsin",
ardindan "yakin uzakligi ona gore ayarla, otomatik goruntu ona gore
ayarlasin".

| Igne | Renk | Bicim |
|---|---|---|
| Mekan | Durumuna gore: yesil sakin / kirmizi yogun / sari populer | IGNE |
| Kullanici | Her zaman TURUNCU ("sen") | DAIRE |

Bicim farki bilerek: mekan bir igne, kullanici bir daire - haritalarda
alisilmis ayrim, ikisi karismiyor.

**CERCEVE IKISINI DE KAPSIYOR**, yani mesafe gorsel olarak okunuyor.
`EN_FAZLA_KAPSAMA_METRE` 1200 -> 25000: secilen mekan baska bir ilcede
olabiliyor.

**KABUL EDILEN GERILIM:** ayni gun "yakin goruntu, sokak cadde
anlasilir" da istenmisti. Kullanici uzaktaysa cerceve genisliyor ve
sokak adlari kuculuyor - ikisi ayni anda saglanamaz. Harita artik
ETKILESIMLI oldugu icin kullanici yakinlastirabiliyor; acilis cercevesi
"iki noktayi da goster" tarafini seciyor.

**IKI YAN ETKI CIKTI, testler yakaladi:**

1. **Igne araligi cerceveye ORANLIYDI** (`gosterim * 0.22`) ve cerceve
   kilometrelerce acilinca esik sacma buyudu - 25 km'lik bir cercevede
   5,5 km'lik aralik neredeyse butun igneleri eliyordu. Kesfet ekraninda
   iki igne kayboldu. Esige 300 m UST SINIRI kondu.

2. Mekan sayfasi testlerindeki bekleme "tam bir igne" sayiyordu; artik
   konum okunabildiginde iki igne var. Bekleme "en az bir" oldu ve
   igne sayisi ayri testlerle kilitlendi.

**WEB SURUMU AYNI SOZLESMEYI TASIYOR** ama kullanici noktasini
cizmiyor: orada RADAR var ve radarin merkezi zaten kullanicinin
kendisi. Prop yalnizca imza ayni kalsin diye duruyor - ekranlar hangi
platformda calistigini bilmek zorunda kalmasin. `DURUM_RENGI` degerleri
iki dosyada da AYNI; ayrilirlarsa ayni mekan iki platformda farkli renk
gosterirdi.

### MEKAN SAYFASINDAKI HARITA ETKILESIMLI OLDU - 2026-09-07

Kullanicinin istegi: "Bir konuma bastigimdaki bu gelen ekranda haritada
sadece o konumun yeri gorunsun obur yerler gorunmesin ve yakin bir
goruntusu gelsin sokak cadde anlasilir sekilde ve haritayi
kipirdatabiliyim yakinlastirip uzaklastirabiliyim."

**ONCEKI KURAL GERI ALINDI.** 2026-08-30'da "harita dokunmatik degil,
BIR DUGME" karari alinmisti ve gerekcesi soyleydi: ayni alan hem
kaydirilip hem "basilinca acilan" bir dugme olamaz. Kullanici
kaydirmayi sectigi icin harita uygulamasini acma isi TAMAMEN sagdaki
iki yuvarlak dugmeye ve "Yol tarifi al"a kaldi - islev kaybolmadi,
yalnizca yeri degisti.

Uygulamasi: haritayi saran `Pressable` ve `pointerEvents="none"`
kaldirildi. `CanliHarita`nin kendisinde `scrollEnabled` ve
`zoomEnabled` ZATEN aciKTI; engelleyen sey o sarmalayiciydi.

**YALNIZCA BU MEKANIN IGNESI** (`mekanlar={[]}`). Cevre mekanlari da
ciziliyordu ve sayfa "bu mekan nerede" sorusunu cevaplarken ekranda
alti ad birden duruyordu. Igne listesi bos olunca `CanliHarita`
cerceveyi en dar haline (100 m) aliyor - sokak ve cadde adlari okunur
oluyor, yani "yakin goruntu" istegi de ayni degisiklikle karsilaniyor.

**CEVRE LISTESI ARTIK HIC CEKILMIYOR.** `yakinMekanlariYogunlukIleGetir`
cagrisi kaldirildi: harita onu kullanmadigi icin bosa giden bir
istekti. Bir testle kilitli.

**SCROLLVIEW KILIDI SART OLDU.** Harita ve sayfa ikisi de dikey
kayabildigi icin tek parmak hareketi ikisini birden oynatiyordu. Ayni
cakisma kesfet ekraninda da yasanmisti (2026-08-30) ve orada harita
kaydirmasi KAPATILARAK cozulmustu; burada harita kaydirilabilir olmak
zorunda oldugu icin ters yon secildi - haritaya dokunuldugu surece
sayfa kaydirmasi kapali (`onTouchStart` / `onTouchEnd`).

Harita yuksekligi 170 -> 210: kaydirilabilir bir harita dar bir seritte
kullanissiz.

**WEB'DE DOGRULANAMAZ** - orada radar cizimi var, gercek harita yok.
Tek igne kurali web'de de gorunuyor ama kaydirma/yakinlastirma yalnizca
telefonda olculebiliyor.

### HARITA IGNE SINIRI 5 -> 9, KLAVYE KAPANMASI - 2026-09-07

**IGNE SINIRI.** Kullanicinin sorusu: "Haritada sadece 4 tane yesil yer
gorunuyor neden." Sebep benim koydugum `EN_FAZLA_ETIKET = 5`. Cakismayi
onleyen IKI kural vardi - sayi siniri ve igneler arasi en az aralik - ve
ekran goruntusu asil isi ARALIK kuralinin yaptigini gosterdi: bes ignenin
arasi bol bol acikti, yani sayi siniri gereksiz yere bagliyordu. 9'a
cikarildi; aralik kurali yerinde durdugu icin etiketler yeniden ust uste
binmiyor.

**KLAVYE.** Kullanicinin bildirdigi hata: "Bu ekranda boş biryere
basınca klavye kapanmıyor" (yeni mekan ekle). Kok bir `View`di, yani
dokunusu yakalayan hicbir sey yoktu; klavye ekranin yarisini kapatinca
adres alani ve altindaki onay kutusu gorunmez oluyordu. Kok `Pressable`
oldu, `onPress={Keyboard.dismiss}`.

Ic ogeler etkilenmiyor: RN'de en ICTEKI basilabilir oge once yanit
veriyor, kok yalnizca bosluga dokunuldugunda tetikleniyor.
`accessible={false}` sart - onsuz butun ekran ekran okuyucuda tek bir
"buton" olarak okunurdu.

**AYNI SINIF SORUN DIGER FORM EKRANLARINDA DA VAR** ve duzeltilmedi:
`profil-olustur`, `profil/duzenle`, `profil/kullanici-adi`,
`profil/hesabi-sil`, `check-in/[mekanId]`. Kullanici yalnizca mekan
ekleme ekranini bildirdi; ayni desen (kok `Pressable` +
`Keyboard.dismiss` + `accessible={false}`) oralara da uygulanabilir.

### ADRES ONERISI GERI GELDI, AMA ONAYLI - 2026-09-06

Kullanicinin istegi: "Bu yeni yer ekleme ekraninda adres kismina
bulundugu adresi otomatik doldurma yapilabilir mi, dogru mu diye de
sorsun ve degistirilebilsin."

**BU OZELLIK 2026-08-31'DE KALDIRILMISTI** ve sebebi gizlilik ya da
maliyet degil DOGRULUKTU: cihazin adres cozumu yanlis mahalle
donduruyordu (Nilufer'deki bir mekana "Ertugrul" diyordu, dogrusu
ALAADDINBEY). O gun adres kimse dogrulamadan ekranda gosteriliyordu.
`lib/adres.ts` ve testleri silinmisti.

**SIMDI FARKLI ve eski itiraz KAPANIYOR:** sonuc bir ONERI. Alan
doluyor, altinda "Bu adres doğru mu?" sorusu ve iki dugme (Doğru /
Temizle) duruyor, alan her zaman duzenlenebilir. Makine tahmin ediyor,
insan dogruluyor.

**Onay satiri kullanici alani ELLE DEGISTIRDIGI anda kalkiyor** -
artik onaylanacak bir oneri yok, metin kisinin kendisinin.

**KULLANICININ YAZDIGI EZILMIYOR:** oneri ancak alan BOSSA yaziliyor.
Kisi cozum gelmeden once bir sey yazdiysa oldugu gibi kaliyor.

**MEKAN LISTESINDE HALA KULLANILMIYOR.** Orada gosterilen konum ilce ve
il, ikisi de poligon testiyle atandigi icin kesin (karar 2026-08-31,
"TAM DOGRULUK ADINA"). Bu modul yalnizca kisinin KENDI ekledigi mekana
yardim ediyor - liste tarafi degismedi.

Il ve ulke oneriye GIRMIYOR: mekan zaten kullanicinin bulundugu yerde
ve ekranda ilce/il ayrica gosteriliyor.

Oneri gelmezse (web'de bu API yok, izin yok, saglayici bulamadi) hicbir
sey olmuyor - alan zaten opsiyonel. Testle kilitli.

11 yeni test: `lib/adres.test.ts` (6, saf birlestirme) ve ekran
testinde 5 (oneri doluyor + onay cikiyor, "Doğru" sorusu kaldiriyor
ama adresi birakiyor, elle duzeltince soru kalkiyor, "Temizle"
bosaltiyor, oneri yoksa soru hic cikmiyor).

### TUR FILTRESI: TEMEL TURLER, IL BAZLI, KM SINIRSIZ - 2026-09-06

Kullanicinin kurallari (sirayla verildi, her biri oncekini duzeltti):

    "Filtre tusuna basinca bizim mevcuttaki turlerimizin listesi ciksin"
    "Filtrede butun verilerimizin turleri gorulmeli"
    "Temel turleri goster, 300 cok fazla olur"
    "Filtrelemede km siniri yok, filtreleme yapan biri bulundugu
     sehirdeki kayitlara gore sonuclar bulur"
    "Yaptigi filtrelemeye gore yakindan uzaga, bulundugu konuma gore"

**TUR LISTESI ISTEMCIDE SABIT** (`TEMEL_TUR_GRUPLARI`, sekiz grup /
~50 tur). Uc secenek denendi ve ikisi OLCUMLE elendi:

| Deneme | Sonuc |
|---|---|
| Cevredeki turler | Liste 60'ta kesiliyordu; kullanicinin 1 km'sinde 138 tur vardi |
| Butun turler (300) | Kullanici "300 cok fazla olur" dedi |
| En yaygin N | Ilk 45'te "Yapi" 123.499, "Mekan" 66.417, "Isletme", "Depo", "Dag" - kimsenin aramayacagi genel etiketler |

**Yaygin olmak "temel" olmak degil.** Liste elle secildi ve her turun
veritabaninda gercekten bulundugu SQL ile dogrulandi. Cok seyrek
olanlar bilerek disarida: "Berber" 477, "Piknik alani" 12 - secilse
neredeyse hep bos liste verirlerdi.

**ADETLER IL BAZLI** (`ildeki_turler` RPC). Sonuc il sinirli oldugu
icin adet de oyle olmali - "Kafe 23" yazip 500 sonuc gelmesi
yaniltirdi. Canli olculdu: 0,39 sn, Bursa'da 297 tur, Kafe 6105.

**IL BAZLI SAYIM ONCEDEN HESAPLANIYOR** (`mekan_turleri` materialized
view, gunluk cron). Ham sayim OLCULDU: **13,5 saniye**, 122.896 blok -
`mekanlar_il_idx` kullanilmasina ragmen. PostgREST siniri 8 sn, yani
canli sorgulanamaz. Gorunum en fazla 81 il x 300 tur = 24 bin satir.

**KM SINIRI KALKTI, IL SINIRI GELDI.** `yakin_mekanlar_yogunluk` artik
`p_turler` varken de il hesabi yapiyor (onceden yalnizca `p_arama`
varken yapiyordu). Istemci tur secilince `yaricapMetre = null`
gonderiyor. Bu, 2026-09-01'deki ARAMA kuralinin aynisi - iki yol artik
ayni davraniyor.

**SIRALAMA DEGISMEDI:** sabit kural geregi yakindan uzaga, kullanicinin
konumuna gore (`konum <-> ST_MakePoint(...)`). Filtre yalnizca SUZUYOR.

**(il, tur) BILESIK INDEKSI SART CIKTI - olculdu.** Indekssiz halde
"Bursa'daki kafeler, yakindan uzaga, ilk 100" sorgusu **6.452 ms**
suruyor ve zaman asimina duesuyordu. Plan sunu gosterdi:
`mekanlar_il_ad_trgm_idx` ile `mekanlar_tur_idx` BitmapAnd ile
birlestiriliyor, bitmap **TASIYOR** (lossy=43209) ve **1.214.581 satir
heap'ten yeniden okunuyordu**.

    once  : 6.452 ms, 47.383 blok
    sonra :   946 ms,  6.050 blok      (mekanlar_il_tur_idx, 42 MB)

**Ders: iki ayri btree indeksin BitmapAnd ile birlestirilmesi bilesik
indeksin yerini tutmuyor** - bitmap tasinca kazanc tamamen kayboluyor.
Ayni sinif sorun 2026-09-01'de arama tarafinda yasanmisti ve orada
`btree_gin` bilesik indeksiyle cozulmustu.

Canli dogrulama: Kafe 100 sonuc 0,56 sn, uc tur birlikte 1,51 sn,
hepsi Bursa.

**KART DUZENI KULLANICININ IKI DUZELTMESIYLE OTURDU:**

1. "Rozet check-in yazisinin soluna gelicek" - rozet ustte, buton altta
   ayri satirlardaydi; artik IKISI YAN YANA, rozet solda.
2. "Yanlarindaki 3 noktayi kaldirip oyle duzenle" - kart menusu
   KALDIRILDI. Icindeki iki islem zaten baska yerdeydi: mekan ADINA
   basmak konum sayfasini aciyor, buton da check-in'i. Kalkinca sag
   blok daraldi ve mekan adina yer acildi.

Rozet ve buton yan yana durdugu icin ikisinin de dolgusu KISILDI: 342
px'lik bir kartta sag blok genisledikce ad iki satira duesuyordu.

**"TUMU" DUGMESI IKI ISLEVLI - kullanicinin duzeltmesi:** ilk halde
secimi TEMIZLIYORDU (benim okumamla "filtre yok, hepsi gorunsun"), ama
dugmenin adi tumunu SECECEGINI soyluyor ve kullanici hakli olarak onu
bekledi ("Tumune basinca tumunu secmiyor"). Artik duruma gore
degisiyor: hicbiri secili degilse **"Tumunu sec"**, hepsi seciliyse
**"Temizle"**. Etiket her zaman ne yapacagini soyluyor.

**HARITA ETIKETLERI ARTIK CAKISMIYOR.** Kullanicinin ekran
goruntusunde bes igne secilmisti ama ikisi birbirine ~40 m uzaktaydi ve
ADLARI ic ice geciyordu ("Gentaş Aspendos Evleri" ile "Hadim erikli
subesi"). Igne kucuk, cakisan sey etiket. Artik igneler arasinda EN AZ
bir aralik araniyor ve aralik CERCEVEYE ORANLI (gosterim yaricapinin
%22'si): yakinlastirilmis haritada 60 m bile ayri gorunur, genis
cercevede 200 m bile bitisik.

**SECIM PENCEREDE GECICI:** liste ancak "Kaydet"e basilinca degisiyor;
perde ya da carpi hicbir sey uygulamiyor - yoksa "vazgec" diye bir sey
olmazdi. "Tumu" secimi temizliyor. Secili turler ekranda cip olarak
duruyor ve tek dokunusla kaldirilabiliyor; suzgec dugmesinde de kac
tur secili oldugunu soyleyen rozet var. Bunlarin hepsi kullanicinin
"bu tus neye yariyor" sorusundan cikti - suzgec yalnizca pencerenin
icinde kalirsa listenin neden kisa oldugu gorunmuyor.

### SUZGEC DUGMESI TUR SECICIYE DONDU - 2026-09-06

Kullanici sordu: "Mekan ara'nin yanindaki filtreleme tusu neye
yariyor su an?" - ve soru hakliydi. Dugme listeyi sosyal turlere
daraltiyordu (kaldirilan "Kesfet" sekmesinin isi) ama bunu HICBIR
YERDE soylemiyordu; yalnizca turuncuya donuyordu.

Kullanicinin karari: "Filtre tusuna basinca bizim mevcuttaki
turlerimizin listesi ciksin, o listeden sectigi turlere gore sadece o
konumlar listelensin", ardindan "Filtredeki secenekleri kaydetme tusu
da ekle ya da tumu/vazgec gibi secenek ekle".

**YENI RPC `yakin_turler`** - cevrede GERCEKTEN bulunan turler ve
adetleri. Sabit bir liste gosterilmiyor: veritabaninda 162 tur var ve
cogu herhangi bir cevrede hic bulunmuyor, kullanici "Marina" secip bos
bir listeyle karsilasirdi. Yanindaki sayi secimden ONCE sonucu
tahmin ettiriyor. Canli olculdu: 0,51 sn, kullanicinin cevresinde
Kampus binasi 582 / Universite 334 / Kafe 23.

**SUZGEC YINE SUNUCUDA** (`p_turler`). Istemcide suzmek 2026-08-31'de
olculmustu: sunucu en yakin 50 kaydi tur ayrimi yapmadan donduruyor ve
o 50 kaydin yalnizca 3'u sosyal turdeydi, oysa yaricapta 111 sosyal
mekan vardi - liste dolu bir cevrede bile bos gorunuyordu.

**SECIM PENCEREDE GECICI.** Disaridaki liste ancak KAYDET'e basilinca
degisiyor; perde ya da carpi hicbir sey uygulamiyor. Aksi halde
"vazgec" diye bir sey olmazdi - her dokunus listeyi yeniden yukler ve
kullanici yanlislikla actigi bir turden geri donemezdi. Testle kilitli.

Alt satirda iki dugme: **"Tumu"** secimi temizliyor (suzgec kalkiyor,
butun turler gorunuyor), **"Kaydet (N)"** uyguluyor.

**SECILI TURLER EKRANDA GORUNUR DURUYOR** - cipler halinde, her biri
tek dokunusla kaldirilabiliyor, yaninda "Filtreyi kaldir". Suzgec
yalnizca pencerenin icinde kalsaydi kullanici listenin neden kisa
oldugunu goremezdi; sorunun cikis noktasi tam olarak buydu. Suzgec
dugmesinin uzerinde de kac tur secili oldugunu soyleyen bir rozet var.

**ARAMA VARKEN TUR SUZGECI UYGULANMIYOR** (eski davranis korundu):
"eczane" araninca secili turler yuzunden sonuc cikmamasi kullaniciyi
sasirtirdi.

`SOSYAL_TURLER` sabiti artik kesfet ekraninda KULLANILMIYOR ama
`lib/mekan.ts` icinde duruyor - baska bir yerde ise yarayabilir.

**ARACA BEKLEME ANAHTARI EKLENDI:** `SLOOIN_TIKLA_BEKLE`. Tur secici
acilinca cevredeki turleri cekiyor ve ilk ekran goruntusu YUKLENIYOR
halini yakaladi; tiklama sonrasi bekleme suresi artik ayarlanabiliyor
(varsayilan 600 ms).

### KESFET EKRANI REFERANSA CEVRILDI - 2026-09-06

Kullanicinin istegi: "Bu sayfayi referans gorsele cevir aynisini yap",
ardindan "Fotografsiz geri kalanini ayni yap" ve "Fotograflar disinda
butun yerlesim ikonlari ayni yap".

**MEKAN FOTOGRAFI YOK ve olculdu:** `mekanlar` tablosunda fotograf
sutunu HIC yok, 5,9 milyon Foursquare kaydinin hicbirinde gorsel
gelmiyor. Referanstaki kart kapaklari bu yuzden uygulanmadi -
kullanicinin karari da bu yonde oldu.

**DEGISENLER:**

| Blok | Ne oldu |
|---|---|
| Ust cubuk | YENI: "Check-in" basligi + sagda Harita/Liste segmenti |
| Sekmeler | "Mekan ara / Kesfet" KALKTI; tek liste kaldi |
| Arama | Artik HER ZAMAN gorunur, yaninda tur suzgeci dugmesi |
| Durum cipleri | YENI: Tumu / Sakin / Yogun / Populer |
| Bolum basligi | "Yakinindaki Mekanlar" + "Tumunu gor" (liste gorunumune gecer) |
| Liste | Duz satir yerine KART: ad, konum, kisi satiri, durum rozeti, Check-in, uc nokta |
| Harita igneleri | Artik AD ve DURUM tasiyor, renkli; en cok bes tane |

**"POPULER" ICIN SUNUCUYA SUTUN EKLENDI.** Sakin ve Yogun anlik
`kisi_sayisi`ndan hesaplanabiliyordu ama Populer GECMISE bakan bir
olcu; `yakin_mekanlar_yogunluk` artik `toplam_check_in` de donduruyor
(migrasyon `yogunluk_toplam_check_in`). Uydurulamayacak bir veri.

**RPC'nin DONUS TIPI DEGISTIGI ICIN DROP GEREKTI** (42P13): `create or
replace` yeni sutunu kabul etmiyor. Drop ve create ayni islemde, yani
disariya kayip gorunmuyor - ama **drop yetkileri de siliyor**, o yuzden
`grant execute` hemen altinda yeniden veriliyor.

**DURUM KURALLARI** (`lib/mekan.ts` icinde `mekanDurumu`):

    populer -> toplam check-in >= 10   (gecmiste cok gidilmis)
    yogun   -> su an >= 3 kisi
    sakin   -> geri kalan

Oncelik populer > yogun > sakin. **ESIKLER AYNI ZAMANDA BIR GIZLILIK
KORUMASI:** az ziyaret edilen kucuk bir mekanda (ornegin bir konut
sitesinde) "populer" etiketi orada kimin bulundugunu tahmin edilebilir
kilardi; 10 ve 3 tek bir kisinin uretemeyecegi sayilar.

**DURUM RENKLERI MARKA TURUNCUSUNDAN BAGIMSIZ** - yesil / kirmizi /
sari, bir trafik isigi dili. Sebep: bunlar bir eylem degil bir OLCU
anlatiyor; uygulamada turuncu "eylem ya da su an oluyor" demek ve uc
durumu turuncunun tonlariyla gostermek o anlami tuketirdi. Ayni
degerler HARITA IGNELERINDE de kullaniliyor - ikisi ayrilirsa haritada
yesil gorunen bir mekan listede kirmizi rozet tasirdi.

**"KESFET" SEKMESI KAYBOLMADI, DUGMEYE DONDU.** O sekme listeyi sosyal
turlere daraltiyordu (kullanicinin 2026-08-31 karari); islev arama
kutusunun yanindaki suzgec dugmesine tasindi, acikken turuncu.

**HARITA IGNELERI EN COK BES.** 390 px'lik bir haritada daha fazlasi
etiketleri ust uste bindiriyor; once kalabalik, sonra populer olanlar
seciliyor. 2026-09-01'deki "gri noktalari kaldir" karariyla CELISMIYOR:
o karar hicbir sey anlatmayan gri noktalar hakkindaydi, simdi her igne
ad ve durum tasiyor.

**TEST TUZAGI, yasandi:** igneler ad gosterince ayni mekan adi hem
haritada hem listede goruntulendi ve `getByText` "birden fazla eleman"
diye patladi (11 test). Cozum testleri `getAllByText`e cevirmek DEGIL -
o listeyi dogrulayan iddialari zayiflatirdi; `jest.setup.js`'teki
`react-native-maps` mock'u artik Marker'in COCUKLARINI render etmiyor.
Ignenin tasidigi bilgi `accessibilityLabel`da duruyor, yani igne
icerigi hala test edilebilir.

**TELEFONDA OLCULEN UC KUSUR** (kullanicinin ekran goruntusuyle):

1. **HARITA IGNELERI GORUNMUYORDU.** Kok neden `EN_FAZLA_GOSTERIM_METRE
   = 100`: cerceve HER ZAMAN 100 m yaricapla sinirlaniyordu, oysa
   cevredeki mekanlar 420-530 m uzakta - igneler ciziliyor ama gorunur
   alanin DISINDA kaliyordu. Kusur daha once fark edilmemisti cunku o
   gunlerde yalnizca KALABALIK mekanlarin ignesi ciziliyordu ve cevrede
   kalabalik mekan yoktu.

   Kullanicinin "daha yakin baslasin" karari (2026-09-01) KORUNDU ama
   artik yalnizca IGNE YOKKEN gecerli; igne varsa cerceve onlari
   kapsayacak kadar aciliyor (`EN_FAZLA_KAPSAMA_METRE = 1200`). Iki
   kural da ayni seyi istiyor: harita dolu gorunsun.

2. **ARAMA KUTUSU DARDI ve BUYUTECSIZDI.** `TextInput`e `flex`
   verilmemisti, kutu icerigi kadar kaliyor ve suzgec dugmesi ortada
   asili duruyordu. Kutu artik bir sarmalayici icinde (`aramaKutusu`);
   kenarlik ve zemin orada, `TextInput` yalnizca yaziyi tasiyor.

3. **YAN PAY HER OGEDE AYRIYDI.** Ekran yatay payi `icerik`te
   vermiyordu, her oge kendi `marginHorizontal`ini koyuyordu; arama
   kutusu sarmalayiciya alininca o margin dustu ve satir ekranin
   kenarina yapisti. Pay artik TEK YERDE (`icerik.paddingHorizontal`)
   ve referanstaki gibi harita da dahil her sey kenarlardan iceride.

Ust cubuga GERI OKU da eklendi ama `router.canGoBack()` yanlissa
cizilmiyor: bu bir sekme ekrani, normalde geri gidilecek yer yok.

Dogrulama: jest 60 paket / 600 test, tsc taban hatalari, ekran
goruntusuyle olculdu (`tasarim/kesfet-yeni.png`).

### MEKAN SAYFASINA CHECK-IN CUBUGU - 2026-09-06

Uc yerlesim gorsel olarak sunuldu (adin yaninda ikili / alta yapisik /
haritanin ustunde); kullanici **B - alta yapisik**'i secti ve ayrica
"buton her zaman ayni gorunmuyor fikri de guzel" diyerek UC HALI de
onayladi.

Ondan once check-in'e giden tek yol UC NOKTA MENUSUNUN ICINDEYDI, yani
sayfanin asil eylemi gorunmuyordu. Menuden kaldirildi.

**CUBUK ScrollView'IN DISINDA.** React Native'de `position: sticky`
yok; "kaydirsan da altta kalan" bir oge ancak kaydirilan alanin disina
konarak yapiliyor. `ScrollView`in `paddingBottom`u da cubugun
yuksekligini kapsiyor, yoksa listenin son satiri butonun altinda
kaliyor.

**UC HAL:**

| Durum | Buton |
|---|---|
| Bu mekanda aktif check-in var | "Buradasın · Ayrıl", HAYALET (eylem tesvik edilen bir sey degil) |
| Mekana 1 km'den uzak | Notr dolgu, basilamaz, "Check-in için yaklaş · 2,4 km" |
| Digeri | Dolu turuncu, "Buraya check-in yap" |

Uzak hali basilamadigini RENKLE soyluyor (notr dolgu + soluk yazi);
turuncu birakip yalnizca opaklik dusurmek "yukleniyor" gibi okunurdu.

**KONUM ARTIK BU EKRANDA OKUNUYOR** - eski kural "kullanicinin kendi
konumu BURADA KULLANILMIYOR" idi ve gerekcesi "check-in baska bir gun
baska bir yerde yapilmis olabilir, sana uzakligi yaniltici olur"
seklindeydi. O gerekce METIN icin hala gecerli: uzaklik hicbir yerde
GOSTERILMIYOR, yalnizca basilamayacak bir butonu onceden soluk yapmak
icin okunuyor. Kullanicinin "bosa is yaptirma" kurali bunu gerektiriyor.

**KONUM OKUNAMAZSA BUTON ENGELLENMIYOR** (izin yok, ag yok, web'de
reddedildi): bilmedigimiz bir sey yuzunden kullaniciyi durdurmak
yanlis olurdu, kurali yine sunucu uyguluyor. Bu bir testle kilitli.

`CHECK_IN_YARICAP_METRE = 1000` sabiti `lib/checkin.ts`e kondu.
**Asil kural SUNUCUDA** (migrasyon 20260828090000); buradaki sayi
yalnizca ekranin once davranabilmesi icin. Ikisi ayrilirsa kullanici
basabildigi bir butonun reddedilmesiyle karsilasir - sunucudaki
yaricap degisirse bu sabit de degismeli.

**OLCULEREK BULUNAN YERLESIM KUSURU:** cubuk once
`bottom: ALT_GEZINME_PAYI - 26` ile konmustu ve gezinme cubugunun
ALTINDA kaliyordu, yarisi ortuluyordu. `ALT_GEZINME_PAYI` (104 +
guvenli alan) gezinme cubugunun ust kenarindan yalnizca birkac piksel
yukarisi; ustunde durabilmesi icin ondan CIKARMAK degil EKLEMEK
gerekiyor (`+ 8`).

Uc hal de ekran goruntusuyle ayri ayri dogrulandi; "Buradasın · Ayrıl"
icin gecici bir aktif check-in eklenip goruntu alindi ve **hemen
silindi**. Alti yeni test (`test:harita` icinde 23 test).

### SAYFA YAN PAYI TEK JETONA BAGLANDI - 2026-09-06

Kullanicinin istegi: "Ekrani yanlardan sigdir, ekrani yay, tam ekran
gorunsun uygulama her zaman."

Yan pay 45 ayri yerde `paddingHorizontal: bosluk.xl` (24 px) diye
yaziliydi. Hepsi yeni bir jetona baglandi: **`bosluk.sayfa = 16`**.

**Neden yeni jeton, neden `bosluk.l` degil:** `bosluk.xl` dikey bosluk
ve `gap` olarak da kullaniliyor; degerini degistirmek istenmeyen
yerleri de kaydirirdi. Sayfa kenari kendi adiyla durunca ileride tek
yerden ayarlanabiliyor - koyu moddaki jeton gecisinin ayni deseni.

Etkilenen 29 dosya: butun ekranlar, `UstCubuk`, `SecimPenceresi`,
`TarihSecici`, `YorumSayfasi`. Akis, profil ve kesfet ekran
goruntusuyle ayrica kontrol edildi.

**Yeni bir ekran yazarken yan pay `bosluk.sayfa` olmali**, `bosluk.xl`
degil - yoksa o ekran digerlerinden dar gorunur.

### MEKAN SAYFASI IKONLARI REFERANSTAN - 2026-09-06

Kullanici ikonlarin yakin cekimlerini gonderip "ayni bu sekilde alip
ayni boyle gorunmelerini sagla" dedi. Uc olcu ikonu yeniden cizildi:

| Ikon | Duzeltme |
|---|---|
| Kisiler | UC degil IKI kisi; arkadaki %55 opaklikta neredeyse gorunmuyordu, %78'e cikti |
| Cubuklar | Soldan saga duz artan merdiven degil: ORTADAKI en uzun, soldaki kisa ve acik |
| Yildiz | Keskin uclu degil, KOSELERI YUVARLAK (ayni renkte kalin `strokeLinejoin="round"` konturu) |

**ARABA IKONU UC KEZ ELLE CIZILDI, UCU DE TUTMADI** ve sonunda
kullanici gorseli gonderip "bu attigimi direk kullan" dedi. Denenen ve
basarisiz olan uc cizim: (1) kutu govde + uzerinde beyaz daireler -
oyun koluna benziyordu; (2) dolu siluet - referans ici bos cizgiydi;
(3) cizgi ikonu ama tekerlekler govdenin altina konmustu ve "iki bacak"
gibi okunuyordu. Ders: bir ikon uc denemede tutturulamiyorsa cizmeye
devam etmek yerine varligi istemek daha hizli.

**Varlik uretimi: `araclar/araba-ikonu-uret.py`.** Kaynak gorsel siyah
zeminliydi ve arabanin cevresinde genis bir turuncu PARILTI vardi.
Parilti gövdeyle neredeyse ayni renkte - olculdu:

    araba govdesi : (253, 117,  2)   gri 121
    parilti       : (240, 127, 15)   gri 127

Yani parlaklik, doygunluk ya da kanal farkiyla AYRILAMIYOR; toplam
parlaklikta parilti gövdeyi bile geciyor. Ayiran tek sey KESKINLIK:
arabanin dis hatti net bir kenar, parilti yumusak bir gecis. Maske bu
yuzden renkten degil GRADYANDAN cikariliyor (gaussian -> sobel ->
esik -> closing -> fill_holes -> en buyuk bilesen -> erosion).

**Esik olculerek secildi, tahminle degil:** %80'den %94'e taranip her
esigin urettigi maske orani ve bilesen sayisi yazdirildi. %88-%90
araliginda sonuc SABIT (%53 maske, TEK bilesen) - kontur orada
gercekten kapaniyor. %92 ustunde kontur 10-26 parcaya kiriliyor,
%80 altinda parilti maskeye giriyor. Ilk denemede %96 kullanilmis ve
maske %2,4 cikmisti (kontur kapanmadigi icin arabanin yalnizca bir
parcasi secilmisti).

`ArabaIkonu` artik SVG degil `<Image>`; `renk` prop'u ISLEMIYOR, gorsel
kendi rengini tasiyor. Yalnizca turuncu kenarlikli "Yol tarifi al"
dugmesinde kullanildigi icin koyu modda da dogru duruyor.

### KONUM EKRANI MEKAN SAYFASI OLDU - 2026-09-06

Kullanicinin istegi, referans gorselle: "Konumlara bastigimizdaki cikan
sayfayi bu attigim referans gorsele gore uyarla aynisini yap."

Onceki hal harita + ad + ilce/il + tek dugmeydi. Yeni sayfa
(`src/app/harita/[mekanId].tsx`) mekanin KENDISINI anlatiyor:

| Blok | Ne |
|---|---|
| Ust cubuk | geri + baslik + uc nokta menusu (Burada check-in / Yol tarifi) |
| Harita | uzerinde tek yuvarlak dugme (navigasyon oku) |
| Baslik satiri | ad + ilce,il solda; turuncu kenarlikli "Yol tarifi al" sagda |
| Olcu seridi | su an kac kisi / bugun kac check-in / ilcede kacinci |
| Su an burada | bas harfli avatarlar + "+N diger" |
| Iki sekme | Liderlik Tablosu / Son Check-inler |

**IKI FARKLI GORUNURLUK REJIMI VAR ve bu isin en onemli karari.**

    SAYILAR      -> `mekan_istatistikleri`, security DEFINER
                    herkese ayni deger; bir sayi kimseyi tanimlamiyor
                    (mevcut yogunluk sayaciyla ayni sinif, karar 71)

    KISI LISTELERI -> `mekan_liderlik`, `mekan_son_check_inler`,
                      security INVOKER; `check_inler` RLS'i AYNEN
                      calisiyor

`security definer` liste tarafinda KULLANILMADI - kullanilsaydi tek bir
ekran butun gorunurluk modelini delerdi. Canli bir check-in'de
"herkese_acik" bile ancak AYNI MEKANDA CANLIYSAN ya da ARKADASINSA
gorunuyor; bu RLS politikasi degistirilmedi.

Sonucu KASITLI bir tutarsizlik: ustte "7 kisi burada" yazarken asagida
2 avatar gorunebilir. Fark **"+5" rozetiyle** anlatiliyor - sayi
sizmaya devam ediyor, kimlikler sizmiyor. Bir testle kilitli.

**REFERANS BIREBIR KOPYALANDI** - kullanicinin iki ayri talimati:
"Attigim gorseli bozmadan aynisi yap" ve "Ikonlari tasarimi
boyutlarini hepsini tam kopyalamani istiyorum."

Ilk gecuiste UC noktada referanstan sapilmisti; ucu de geri alindi:

1. **YUZLER.** Avatarlar once bas harfli daireler yapilmisti; artik
   GERCEK PROFIL FOTOGRAFI, `profilOzetleriniGetir` ile (akis ve
   bildirimlerle ayni yardimci, yani "kim gorunur" kurali tek yerde -
   `akis_profilleri` RPC'sinde). Fotografi olmayan kisi ADININ BAS
   HARFINE duesuyor ve o geri duesme yolu testle kilitli.

   **"Haritada yuz yok" kurali BURAYI KAPSAMIYOR** - ilk gecuiste
   yanlis genellenmisti. O kural yogunluk sayacinin kimlik
   sizdirmamasi icin: haritada yalnizca SAYI var. Bu listedeki kisiler
   zaten RLS'ten gecmis, yani ADLARI da gorunuyor; adi gosterilen
   birinin fotografini gizlemenin bir korumasi olmaz. Akis kartlari
   2026-08-26'dan beri zaten avatar gosteriyor.

2. **Haritanin uzerindeki IKI yuvarlak dugme.** Once tek dugme
   konmustu ("bizim haritamiz etkilesimsiz, ikincinin karsiligi yok"
   gerekcesiyle). Iki dugme de kondu ve ikisi GERCEKTEN farkli is
   yapiyor - harita uygulamasinin iki ayri kipi:
       ustteki (nisangah) -> konumu haritada GOSTER  (?ll= / search)
       alttaki (ok)       -> YOL TARIFI ver          (?daddr= / dir)

3. **OLCULER.** Butun boyutlar referans gorselden turetildi. Gorsel
   914 px genisliginde uretilmis, telefon 390 px - yani olcek 2,344 ve
   her deger referanstaki pikselin bu olcege bolunmus hali. Degisenler:
   harita yuksekligi 280 -> 170, harita dugmeleri 44 -> 34, avatar
   54 -> 44 (aralik 16 -> 3), liste avatari 38 -> 32, madalya 30 -> 26,
   sekme ikonu 18 -> 15, liste satiri 62 -> ~50 px.

**UYDURMA VERI YOK:** ilce bilinmiyorsa ya da ilcede hic check-in yoksa
siralamanin bir evreni de yok; "#1" yerine cizgi (—) ve "Sıralama yok"
yaziyor. Testle kilitli.

**BOS DURUM SEBEBINI SOYLEMIYOR** - bilerek. Liste iki sebepten bos
olabilir: gercekten kimse gelmemistir, ya da gorunurluk tercihleri
yuzunden sana gorunmuyordur. Ikincisini ima etmek de bir sizinti
olurdu, bu yuzden tek bir notr metin var. Ayni sebeple "Su an burada"
bolumu gorunur kimse yoksa HIC cizilmiyor.

**Migrasyon 20260906120000** uc RPC + `check_inler(mekan_id)` indeksi.
Ilce siralamasi bugun ucuz (`check_inler` binler mertebesinde); tablo
yuz binlere cikarsa her sayfa acilisinda yeniden hesaplanmamali, o gun
dogru cozum gunluk tazelenen bir materialized view.

**CANLI DOGRULANDI:** `araclar/mekan-sayfasi-canli-test.py`, 13
dogrulama. Salt okur, guvenle yeniden kosulur. Olculenler: uc RPC de
calisiyor, liderlik cok gidenden az gidene sirali, limit 20'de kilitli,
son check-inler yeniden eskiye sirali, ve kimliksiz cagri UCUNDE DE
reddediliyor (istatistikler 400, listeler 401 - `revoke ... from public`
sayesinde).

**OLCU SERIDI UC KEZ DEGISTI - 390 px cok dar.** Sirasiyla:
(1) referans duzeni (ikon solda, iki satir sagda) kuruldu ve
"0 check-in" IKIYE BOLUNDU; (2) uc kutu dikey yapiya cevrildi, bolunme
gecti ama referanstan sapildi; (3) referansa geri donuldu ve bu kez
ucuncu kutu kirpildi ("Nilüfer'deki ye…"); ucuncuye pay verilince ORTA
kutu kirpildi ("0 check…").

**Ikisini birden kurtaran sey yalnizca OLCULERI KISMAK oldu:** sayi
fontu 15 -> 13, ikon 19 -> 17 (sonra referans olcusune 21'e cikti),
gap 6 -> 5, serit ic payi 16 -> 12, ucuncu kutuya flex 1,22. Yani
sorun duzen degil, YERDI. Referans gorselde bu sikisma gorunmuyor
cunku orasi 914 px genisliginde uretilmis.

**DERS: bu seridin metinlerinden herhangi biri uzarsa yeniden
kirpilir.** Yeni bir dil eklenirken ("bugün check-in" karsiligi daha
uzunsa) ya da bir ilce adi cok uzunsa ekran goruntusuyle olculmeli.

Ikinci kusur: notu olmayan bir check-in satirinda gorece zaman hem alt
satirda hem sagda yaziyordu. Not yoksa alt satir artik hic cizilmiyor.

**UST CUBUKTA MEKAN ADI YOK** (kullanicinin istegi 2026-09-06:
"Konum isimleri ustte yazmasin, altlarinda yaziyor zaten"). Ad
haritanin hemen altinda TAM haliyle duruyor; ustte ayrica gostermek
hem tekrardi hem de uzun adlar orada kirpiliyordu ("Nilüfer Tüvtürk
Araç ...").

`UstCubuk` artik BASLIKSIZKEN KOMPAKT: baslik bos gelirse Text hic
cizilmiyor ve ust pay 44 -> 12 px'e iniyor. O pay basligin durum
cubugundan ayrilmasi icindi; yalnizca iki ikon tasiyan bir cubukta
gereksiz. Kural genel, yani baska bir ekran da basliksiz cubuk
isterse ayni sekilde toparlaniyor.

**GORSEL DOGRULAMA ICIN GECICI CANLI CHECK-IN GEREKTI.** Veritabaninda
canli check-in olmadigi icin "Su an burada" bolumu bos ekranda hic
cizilmiyordu - ve bos bir ekrana bakip "calisiyor" demek olcum degil
(ayni ders 2026-09-03'te yorumlarda ogrenilmisti). Bes test hesabi icin
gecici canli check-in eklendi, goruntu alindi, **hepsi hemen silindi**;
`check_inler` 9 satira geri dondu, gercek veriye dokunulmadi.

O goruntu bir yerlesim kusuru buldu: avatar 54 px + 16 px aralikla BES
avatar bile 342 px'e sigmiyordu. Referansta avatarlar neredeyse bitisik
(merkez araligi 107 px, cap 104 px -> 3 px bosluk); ayni orana
gecilince alti avatar + "+1" rahat siginiyor.

Avatar altindaki ad da YALNIZCA ILK KELIME: `check_inler.kullanici_adi`
tam adi tasiyor ("Orçun Özdemir") ve 47 px'lik kutuda tam ad her zaman
kirpiliyordu. Listelerde tam ad duruyor - orada satir genis.

Ekran goruntuleri: `tasarim/mekan-sayfasi.png` (acik),
`mekan-sayfasi-dark.png` (koyu + ikinci sekme),
`mekan-sayfasi-dolu.png` (gecici veriyle, "Su an burada" seridi dolu).

Dogrulama: jest 60 paket / 593 test, tsc taban hatalari, canli 13/13.
KVKK notu `docs/kvkk-uyum-listesi.md` icinde ("mekan sayfasindaki
sayilar ve liderlik tablosu"); orada **alinmamis bir karar** duruyor:
kucuk sayilarda siralamayi gizleyecek bir esik konsun mu.

### ETIKET ONAYI ARTIK BIR AYAR - 2026-09-06

Kullanicinin karari: "Bir kullanici arkadas oldugu birisini direk
etiketleyebilir. Ayarlar gizlilik ayarlarinda ... bir gizlilik ayari
getirelim. Etiket onayi kapali olan birini birisi etiketlemek istedigi
zaman o kisiye onay bildirimi gelsin."

**2026-08-29'daki "HER etiket onay bekler" kurali ARTIK GECERSIZ.**
Yeni varsayilan DIREK: karsilikli arkadasin seni onaysiz etiketliyor.
Isteyen `profiller.etiket_onayi_gerekli` ile "once bana sor" diyor.
Ayarlar > "Seni kimler görebilir?" altinda **"Etiketlemeden önce bana
sor"** anahtari.

**KARSILIKLI ARKADASLIK SARTI DEGISMEDI** - yabanci hala
etiketleyemiyor. INSERT politikasindaki `bag.takip_ediyor_mu` duruyor;
degisen yalnizca ONAYIN gerekip gerekmedigi.

**DURUMU ISTEMCI DEGIL SUNUCU YAZIYOR.** Migrasyon 20260906090000:
`etiket_durumu` adli BEFORE INSERT tetikleyicisi hedefin ayarina
bakip `durum` alanini kendisi belirliyor ve **istemciden geleni
EZIYOR**. Tetikleyici `security definer`, cunku `profiller` RLS'i
yalnizca kendi satirini gosteriyor - etiketleyen hedefin ayarini
okuyamaz.

Politikadaki eski `durum = 'bekliyor'` sarti KALDIRILDI; o sart
etiketleyenin kendi etiketini onayli yazmasini engellemek icindi,
artik ayni isi tetikleyici yapiyor. Sart birakilsaydi "onaylandi"
yazan tetikleyici kendi politikasina takilirdi (BEFORE trigger
calisir, SONRA WITH CHECK degerlendirilir).

**CANLI DOGRULANDI** - jest bu sinif davranisi goremez:

    ayar KAPALI, istemci 'bekliyor' gonderdi  -> durum = onaylandi
    ayar ACIK,   istemci 'onaylandi' gonderdi -> durum = bekliyor

Ikinci satir onemli: istemci degeri zorlayamiyor. Test etiketleri
sonrasinda silindi, gercek veriye dokunulmadi.

**PUSH BILDIRIMI EKLENDI (ayni gun, kullanicinin istegi: "Push
bildirimine ekle") - yukaridaki acik borc KAPANDI.** Iki yeni olay:

    durum = 'bekliyor'   -> etiket_istegi   "X seni etiketlemek istiyor"
    durum = 'onaylandi'  -> etiket_eklendi  "X seni bir check-in'de etiketledi"

Tek olay yapip metni durumdan turetmek Edge Function'a is dusururdu;
sozlesme zaten olay adiyla ayriliyor.

**ETIKETLEYENIN KIMLIGI GOVDEDE YOK, check-in'den okunuyor:**
`check_in_etiketleri` satiri kimin etiketledigini tasimiyor - sahip,
check-in'in sahibidir. Check-in bulunamazsa bildirim HIC gonderilmiyor
(adsiz bildirim uretmektense hic uretmemek dogru).

`kaynakDogrula` IKI SEY birden soruyor: etiket satiri gercekten var mi
ve check-in'in sahibi govdede yazan etiketleyen mi. Ikincisi olmadan
sahte bir `etiketleyen_id` ile bildirimde YANLIS AD gosterilebilirdi -
belirli birini adiyla taklit eden taciz.

Migrasyon 20260906091500 (`bildirim.olay_gonder`a `check_in_etiketleri`
dali + `etiket_bildirimi` AFTER INSERT tetikleyicisi). Edge Function
**surum 4 olarak DEPLOY EDILDI**, `verify_jwt` KAPALI (cagriyi pg_net
yapiyor, elinde kullanici JWT'si yok). Bu metinler SUNUCUDA, yani OTA
ile gitmiyor - `eas update` bunlari guncellemez.

**TUZAK, yasandi:** yeni `case` bloklari `switch` icinde `default`un
ALTINA yazilmisti; asla calismazlardi ve tsc uyarmiyordu. Sira
duzeltildi, `deno test` 19/19.

### HESAP OLUSTURMA UC ADIMA BOLUNDU - 2026-09-04

Kullanicinin secimi; uc yaklasim gorsel olarak sunuldu (etiketli tek
form / uc adim / gruplanmis tek ekran), **B - uc adim** secildi.
Ekran: `src/app/profil-olustur.tsx`.

| Adim | Ne soruluyor |
|---|---|
| 1 | Ad soyad + dogum tarihi ("Seni tanıyalım") |
| 2 | Kullanici adi ("Kullanıcı adını seç") |
| 3 | Sifre + tekrar ("Şifreni belirle") |

**COZULEN ALTI KUSUR** (hepsi ekranin kodundan olculdu):
1. Formun yarisi etiketliydi yarisi degil - ad, dogum ve kullanici adi
   yalnizca yer tutucu tasiyordu, sifre alanlarinda etiket VARDI.
   2026-08-26'da "etiketi yer tutucu tasiyor" diye kaldirilmislardi;
   **o karar geri alindi**, cunku yer tutucu ilk harfte siliniyor.
2. Yazinca baglam kayboluyordu.
3. **18 YAS KURALI ARTIK ONCEDEN yaziyor.** Onceden yalnizca hata
   metnindeydi (`dogumHataYas`): 18'inden kucuk biri butun formu
   doldurup en sonda ogreniyordu.
4. Dugme alta itildi (`altBlok` + `icerik.flexGrow: 1`); altindaki bos
   ucte bir kalkti.
5. Kullanici adi kurallari yalnizca kendi adiminda gorunuyor.
6. Dugme, adim eksikken SOLUK ama **basilabilir** kaliyor ve basilinca
   eksigi soyluyor. Tamamen devre disi birakmak kullaniciyi "neden
   calismiyor" sorusuyla bas basa birakirdi.

**GERI TUSU IKI ISI YAPIYOR:** adim 2-3'te bir onceki adima doner
(girilenler durur), yalnizca ADIM 1'de oturumu kapatip acilis ekranina
doner. O cikis sart - profili olmayan acik bir oturum kok yonlendirme
tarafindan aninda bu ekrana geri gonderiliyor.

**SON ADIMDA UC ADIM BIRDEN DOGRULANIYOR:** kullanici geri gidip bir
alani bozmus olabilir; hata varsa o alanin bulundugu adima donuluyor.
Yoksa gorunmeyen bir hata yuzunden takilip kalirdi.

**GORSEL DOGRULAMA ICIN PROFILSIZ HESAP GEREKIYOR** - bu ekran yalnizca
"oturumu var ama profili yok" durumunda goruluyor ve butun test
hesaplarinin profili var. `araclar/profilsiz-test-hesabi.py` idempotent
olarak `profilsiz@slooin.test` hesabini aciyor (sifre
`TEST_HESAP_SIFRESI`), profil satiri olmadigini dogruluyor. Ekran
goruntusu: `tasarim/hesap-olustur-adim1.png`.

Testler 10 -> 13 (`__tests__/ekranlar/profil-olustur.test.tsx`).
Dogrulama: jest 60 paket / 583 test.

**KARSILAMA ZEMINI GERCEK BIR YOL AGI** (kullanicinin istegi
2026-09-04: "Bunu gercek map goruntusuyle olustursana", ardindan
"Sokak cadde gibi seyler yazmasin" ve "sadece goruntu olusturcaksin
harita gerceki durucak"). Onceki hal elle cizilmis dort cizgiydi.
Geometri OpenStreetMap'ten (Bursa/Nilufer), 208 yol / 700 nokta / 9 KB;
uretici `araclar/karsilama-yollari-uret.py` Overpass'ten BIR KEZ cekip
Douglas-Peucker ile sadelestiriyor, cikti
`mobil/src/tasarim/karsilama-yollari.ts`.

**HAZIR HARITA BILESENI (react-native-maps) KULLANILMADI - tekrar
onerme.** Dort sebep: (1) web'de calismiyor, bu ekran tarayicida da
aciliyor; (2) Android'de Google anahtari yok, zemin gri kalirdi;
(3) hazir dosemelerde SOKAK ADLARI gomulu geliyor, kullanici tam olarak
onlari istemedi; (4) her acilista ag istegi demek. Vektor cizim
dordunu de cozuyor ve harita etkilesimsiz kaliyor.

Uc kalinlik sinifi var (arter 6.5 / toplayici 3.4 / sokak 1.6). Tek
kalinlikta cizilirse yol agi gercek harita gibi degil tek tip bir ag
gibi okunuyor - denendi.

**ODbL ATFI SART:** yol agi turetilmis bir eser. Ekranin en altinda
`karsilama.haritaAtfi` anahtariyla, yedi dilde. Kaldirilirsa lisans
ihlali olur.

Not: 2026-08-27'de `KrokiZemin` "burasi neresi sorusunu aciyor ve
cevabi yok" gerekcesiyle silinmisti. Kullaniciya bu hatirlatildi ve
yine de gercek harita istendi; karar kullanicinin.

**UST SINIR CIZGISI KALKTI** (kullanicinin istegi 2026-09-04: "ust
sinir cizgisi olmasin"). Durum cubugunun arkasi beyaz, hemen altindaki
sayfa krem kaliyor ve arada gorunur bir cizgi olusuyordu. 2026-09-03'te
konan kural "profil disindaki ekranlar ust payi kok duzenden alir,
orada saatin arkasi da beyaz oldugu icin cizgi yok" diyordu; bu
varsayim KARSILAMADA TUTMUYOR cunku karsilama beyaz zemin kuralinin tek
istisnasi. Karsilama artik profil gibi kendi ust payini koyuyor
(`guvenliAlan.top + UST_PAY`, UST_PAY = 44) ve `_layout.tsx` ona pay
vermiyor. **Yeni bir ekranin zemini beyaz DEGILSE ayni istisnaya
alinmali**, yoksa ayni cizgi geri gelir. Iki testle kilitli
(`kok-icerik` testID'si): karsilamada pay verilmiyor, baska bir ekranda
veriliyor. Ikinci test sart - onsuz "kosul herkese kapali" hali de
yesil gecerdi. NOT: bu fark WEB'DE GORUNMEZ (tarayicida inset sifir),
yalnizca telefonda olculebilir.

**KARTIN GOVDESI ARTIK HARITAYI ACMIYOR** (kullanicinin bildirdigi hata
2026-09-04: "Paylasimda bos biryere basinca konumun icine gidiyor,
sadece konum yazisinin uzerine basinca haritasina gitsin"). Kartin kok
`Pressable`i butun govdeyi haritaya bagliyordu - not metni, tarih, bos
alan. Kok artik duz bir `View`; basilabilir olan yalnizca gercek
hedefler: avatar ve kullanici adi (profil), mekan adi (harita),
etiketler (profil), uc nokta (menu), begeni/yorum/paylas, fotograf
(buyuk gorunum). Erisilebilirlik etiketi mekan adina tasindi. **Ayni
sinif hata 2026-09-03'te fotografta yasanmisti** - o zaman fotograf
kendi Pressable'ina alinmisti ama kok basilabilirligi durmustu; ders:
bir kabin tamamini basilabilir yapmak, icindeki her yeni ogeyi de
sessizce o eyleme baglar.

**TSC TABAN HATASI ARTIK BES DEGIL YEDI.** Hepsi `@types/node`
yoklugundan ve yalnizca test/arac dosyalarinda (`rota-agaci.test.ts`,
`gorunurluk-testleri/calistir.ts`); `src/` ve `lib/` altinda SIFIR
hata. Belgelerde gecen "bes taban hatasi" ifadesi eskidir - olcut
"uygulama kodunda hata yok" olmali, sabit bir sayi degil.

### KOYU MOD - 2026-09-03

Kullanicinin istegi: "telefonların koyu moduna ya da açık moduna göre
uyarlı olsun". Sebep bir onceki soruydu: ekran karanlik gorunuyordu.
**O sikayetin sebebi uygulama DEGILDI** - kullanicinin gonderdigi ekran
goruntusundeki pikseller olculdu, zemin %57 oraninda tam beyazdi
(`255,255,255`); gri gorunen sey kullanicinin kendi yukledigi harita
fotografiydi. Fark cihazin ekran ayarindaydi (True Tone, Beyaz Noktayi
Azalt, dusuk guc modu). **Ders: "renk yanlis gorunuyor" sikayetinde
once ekran goruntusunun PIKSELINE bak; ekran goruntusu panelin renk
islemesinden ONCE alinir, yani uygulamanin gercek ciktisidir.**

Koyu mod yine de yapildi cunku kullanici acikca istedi.

**BOYUT:** 48 dosya, 606 jeton kullanimi, 46 stil blogu.

**YONTEM - jetonlar calisma aninda:** `StyleSheet.create` blogu modul
yuklenirken BIR KEZ hesaplaniyordu; renk calisma aninda degisecekse o
bloklar da calisma aninda uretilmeli. Her ekran artik
`const stiller = useStiller(stilleriYap)` diyor ve `stilleriYap` paleti
parametre aliyor (`src/tasarim/tema-baglami.tsx`). `useMemo` sart:
StyleSheet her render'da yeniden uretilirse liste satirlari bosuna
yeniden ciziliyor.

**GECISIN KONTROL LISTESI DERLEYICIYDI.** Once `renk` export'u modul
duzeyinden KALDIRILDI; tsc 633 hatayla jetonu hala modul duzeyinde
okuyan her satiri listeledi. Gecis tahmine degil derleyiciye dayandi.
Bitince o export kalici olarak silindi - dursaydi yeni bir ekran
yanlislikla acik paleti sabitleyebilir ve hata ancak koyu modda
gorunurdu.

**KOYU PALET SICAK:** saf gri degil kahverengiye kacan bir siyah
(`zemin #121110`, `yuzey #1C1917`). Sebep marka: turuncu vurgu soguk
grinin uzerinde titriyor. Vurgunun kendisi DEGISMIYOR; basili hal koyu
modda ACILIYOR (`#FFA45C`), cunku koyu zeminde daha koyu bir turuncu
"basildi" degil "pasif" okunuyor.

**GOMULU RENKLERDEN YALNIZCA GEREKENLER JETONA GECTI.** 52 tane
`color: '#FFFFFF'` var ve cogu TURUNCU DOLGUNUN uzerindeki yazi - orada
beyaz iki modda da dogru. Jetona gecenler: yikici kirmizi (30 dosya,
koyu modda `#FF6B5A`'ya aciliyor cunku `#C0392B` koyu zeminde 3,4:1),
profil bandinin gecisi, alt gezinme cubugunun yari saydam zemini, arama
kutusu.

**IKI GERCEK KUSUR GORSEL DOGRULAMADA BULUNDU** - testler goremezdi:
1. `ayar-ikonlari.tsx` ve `etkilesim-ikonlari.tsx` gecise girmemisti
   (icinde `StyleSheet` yok), yani butun ayar ikonlari koyu modda
   gorunmez oldu. Bu dosyalarda ikonlar `export const X = () => govde(...)`
   seklinde; kanca eklemek icin ok fonksiyonlari govdeye cevrildi.
2. Profil fotografindaki `+` rozeti: zemini `renk.metin`di ama uzerindeki
   isaret sabit beyazdi - koyu modda acik rozetin uzerinde beyaz arti
   kaldi. Isaret `renk.zemin`e baglandi (rozetin karsiti).

**MARKA YAZISI ICIN AYRI VARLIK:** kelime markasi KOYU HARFLI bir PNG,
koyu zeminde kayboluyordu. `araclar/marka-yazisi-koyu-uret.py` acik
harfli surumu uretiyor ve TURUNCU NOKTAYI koruyor (o nokta markanin
konum ignesi). Kaynak gorsel degisirse betik yeniden kosulmali.

**NATIVE DERLEME GEREKMIYOR:** `app.json`da `userInterfaceStyle` zaten
`"automatic"`ti, yani `useColorScheme()` cihaz ayarini okuyor. Degisiklik
tamamen JavaScript, OTA ile gidiyor.

Dogrulama: jest 60 paket / 577 test, tsc bes taban hatasi, akis / profil
/ ayarlar / mesajlar / kesfet ekranlari IKI MODDA da ekran goruntusuyle
karsilastirildi (`tasarim/*-light.png`, `*-dark.png`).

Ayrica koyu moddan BAGIMSIZ bir kusur duzeltildi: ayarlardaki "Profilim
gizli" satiri buyutec ikonu kullaniyordu, goz ikonuna cevrildi.

### PROFIL SADELESTI: BANT BUTONLARI KALKTI, @ GITTI - 2026-09-03

Kullanicinin istegi: "Profili duzenle ve paylasi kaldir, profil
duzenleme ayarlardan yapiliyor zaten; ayarlar ikonunun yani sira bir
yerlere profili paylasma icin bir ikon buton koy". Uc yerlesim gorsel
olarak sunuldu, **"A" - paylas ikonu ayarlarin SOLUNDA** secildi.
Ardindan "@ isaretini kaldiralim" ve kullanici adinin yeri icin dort
secenek sunuldu; yine **"A" - ust cubukta kalsin** secildi.

**BULUNAN BAGIMLILIK - is baslamadan once soylendi:** ayarlardaki
"Profilini duzenle" satiri 2026-08-30'da KALDIRILMISTI ve gerekcesi tam
olarak "ayni islem artik profil bandindaki dugmede" idi. Banttaki
dugmeyi kaldirmak, `/profil/duzenle` ekranini ERISILEMEZ birakacakti.
Satir Hesap bolumunun basina geri kondu; bir testle kilitli.

**@ ISARETI BES YERDEN BIRDEN KALKTI** (kullanicinin istegi profildi
ama yarim birakmak tutarsizlik uretirdi): profil basligi, baskasinin
profili, ayarlardaki deger, profil duzenleme satiri ve PAYLASIM METNI
("Slooin'de beni bul: byorcun"). Uygulamanin geri kalani zaten @'siz
gosteriyordu - akis kartlari, arama, mesajlar. Yani degisiklik profili
diger ekranlarla ayni dile getirdi.

Paylas ikonu akis kartlarindakiyle AYNI (kagit ucak): uygulamada tek bir
paylas dili olsun diye. iOS'un kendi paylas ikonu daha tanidik ama iki
farkli ikon olurdu.

Bant kisaldigi icin akista iki ani birden gorunuyor.

Dogrulama: jest 60 paket / 579 test. Dort ESKI test eski davranisi
dogruluyordu, guncellendi; banttaki dugmenin testi kaldirildi ve ayni
iddia ayarlar testine tasindi. Ekran goruntusu `tasarim/profil-sade.png`.

### GECIS TEPEYE UZATILDI + AKIS FOTOGRAFI DUZELDI - 2026-09-03

Iki is birlikte gonderildi.

**1. Profil gecisi artik ekranin TEPESINDEN basliyor** (kullanicinin
istegi: "rengi yukari kadar devam ettir sonsuz dursun"; uc secenek
gorsel olarak sunuldu, "A" secildi). Gecisin yukarida gorunur bir
baslangic kenari kalmadi.

Iki parcasi var, cunku o serit iki ayri agacta:
- Ekranda gecis artik SARMALAYICI DEGIL, arkada duran MUTLAK bir zemin
  (`tepeGecisi`): icerigin ust ve yan paylarini negatif konumla geri
  aliyor. Sarmalamak denendi ve BOZDU - ust cubuk ile kimlik blogu ayri
  kosullu dallarda oldugu icin tek bir JSX agacinda toplanamiyorlar.
  `pointerEvents="none"` sart: aksi halde altindaki ayarlar dugmesi
  tiklanamaz (bir testle kilitli).
- Durum cubugunun ardindaki serit UC KEZ DEGISTI, sonucu su:
  **SERIT YOK.** Sirasiyla (1) profil ekraninda seftali boyandi,
  kullanici geri aldirdi ("saatin gorundugu kisim beyaz olsun"),
  (2) her ekranda beyaz yapildi ama altindaki renkle arasinda SERT BIR
  CIZGI kaldi, (3) yari saydam ortu denendi, (4) kullanici **Instagram'in
  ust kismini** ornek gosterdi: orada serit HIC YOK, icerik dogrudan
  saatin altindan geciyor. Son hal bu.

  Uygulamasi: kok duzendeki `paddingTop: insets.top` artik YALNIZCA
  profil DISINDAKI ekranlara veriliyor; profil kendi ust payini
  `useSafeAreaInsets` ile kendisi koyuyor, boylece gecis saatin ardina
  kadar uzaniyor. Diger ekranlarda saatin arkasi sayfa zemini (beyaz),
  yine cizgi yok cunku iki taraf da beyaz.

  **GERCEK BUZLU CAM `expo-blur` ISTIYOR ve o NATIVE bir paket** -
  eklemek yeni bir derleme gerektirir, OTA ile gitmez. Simdilik
  gerekmedi (serit tamamen kalkinca bulaniklastirilacak bir sey de
  kalmadi), ama ileride istenirse maliyeti budur.

**2. Akistaki fotografa basinca HARITA aciliyordu, artik BUYUK GORUNUM.**
Kullanicinin bildirdigi hata: "gorselin uzerine basinca checkinin
haritasina gidiyor, sadece gorseli buyuk ekran acmasi gerek". Sebep:
fotograf duz bir `Image`di ve dokunus kartin kok `Pressable`ina cikiyordu
(kart haritayi aciyor). Fotograf artik kendi `Pressable`i icinde ve siyah
zeminli bir `Modal` aciyor. Profildeki buyuk gorunumun ayni deseni ama
"Kaldir" YOK - akistaki fotograf baskasinin olabilir.

Uc test: fotograf haritaya GITMIYOR, buyuk gorunum kapatilabiliyor,
kartin geri kalani HALA haritaya gidiyor.

Dogrulama: jest 60 paket / 576 test; ekran goruntuleri
`tasarim/profil-tepe.png` ve `tasarim/foto-buyuk.png`. Gorsel dogrulama
yalnizca goze degil OLCUME de dayandi: fotografa basildiktan sonra
tarayici adresinin DEGISMEDIGI kontrol edildi.

### PROFIL BANDI: DOLU TURUNCU -> YUMUSAK GECIS - 2026-09-03

Kullanicinin istegi ekran goruntusuyle geldi: profil ekranindaki kimlik
bandi tam doygunlukta turuncuydu ve ekranin ucte birini kapliyordu.
Dort yumusatma secenegi gorsel olarak sunuldu (krem bant, yumusak gecis,
soluk turuncu, bantsiz); kullanici **"B" - yumusak gecis** i secti.

Zemin artik `expo-linear-gradient` ile ustte seftali `#FFE6D2`, ortada
`#FFF3E9`, altta beyaz. Uc durak var, iki degil: iki durakli bir gecis
ortada gozle secilen bir bant birakiyordu. Bandin NEREDE BITTIGI artik
gorunmuyor.

**KAPSAM KULLANICININ KURALI:** "sadece profil resminin arkasindaki renk
icin, geri kalan her sey ayni kalsin". Bandin DISINDA hicbir sey
degismedi - ust cubuk, sekmeler, ani satirlari ve oradaki mekan adinin
marka turuncusu aynen duruyor. Bu bir testle KILITLENDI: "bandin DISINDA
hicbir sey degismedi: mekan adi hala marka turuncusu".

**Bandin ICINDEKI metin renkleri degismek ZORUNDAYDI** - beyaz yazi acik
bir gecisin uzerinde okunmuyor. Ad ve sayilar `renk.metin`, ikincil
metinler `renk.metinIkincil`, ayirici `#F0DCC9`, hayalet dugme kenarligi
`#E7D3C0`. Dolu dugme ("Profili duzenle") artik BEYAZ degil TURUNCU.

**Kimlik kurali gerilimi COZULDU.** Kodda "bu blok dekoratif bir turuncu
ve 'turuncu yalnizca eylem ve canlilik icindir' kuraliyla celisiyor" diye
bir not duruyordu. Artik ekrandaki tek tam doygun turuncu "Profili
duzenle" butonu - yani turuncu yeniden EYLEM.

**OTA ile gidebiliyor:** `expo-linear-gradient` zaten bagimliliklarda
(`~57.0.1`), yani yeni bir native paket eklenmedi.

**Test tuzagi:** `LinearGradient` renk dizisini SAYIYA ceviriyor
(`processColor`), yani `props.colors[0]` bir dize degil. Iddia iki tarafi
da ayni donusumden gecirerek yazildi.

Ekran goruntusu: `tasarim/yeni-profil-bandi.png`.

### YORUMLAR ALTTAN ACILAN SAYFAYA TASINDI - 2026-09-03

Kullanicinin istegi (Instagram'in yorum sayfasinin ekran goruntusuyle):
"Yorum yazma ikonuna basinca boyle bir yorum yazma yazilan yorumlari
gorme yeri gelsin". Iki secenek gorsel olarak sunuldu (yarim yukseklik /
neredeyse tam yukseklik); kullanici **"A"yi** - yarim yuksekligi -
secti.

**ONCEKI HAL AYRI BIR SAYFAYDI** (`/yorumlar/<id>`) ve uc sorunu vardi,
ucu de gercek ekran goruntusunde olculdu: paylasim gozden kayboluyordu
(hangi paylasima yazdigin belli degildi), ALT GEZINME CUBUGU altta
duruyordu (cikmanin iki ayri yolu gorunuyordu) ve akisa donmek bir
sayfa gecisi gerektiriyordu. **Sayfa SILINDI**, yerine
`src/tasarim/YorumSayfasi.tsx` geldi.

Kart artik yorum ikonuna basildiginda kendi icinde alt sayfayi aciyor;
`onYorum` prop'u yalnizca ekrani haberdar ediyor. Yeni prop
`onYorumSayisi` ile sayac tazeleniyor - alt sayfada yorum eklenip
silindikce karttaki sayi guncelleniyor.

**REFERANSTAN ALINMAYANLAR** (uydurulmadi, cunku karsiligi yok):
Yanitla (ic ice yanit yok, yorumlar tek seviyeli), yorum begenme
(begeni paylasima ait, yoruma degil), "Senin icin" siralamasi (bizde
kronolojik). **Emoji seridi ALINDI** ama tepki DEGIL: dokununca yazma
kutusuna emoji ekliyor, yanlislikla gonderilen bir tepki geri
alinamazdi.

**UC NOKTA MENUSU ORTAKLASTI.** `PaylasimMenusu` yerini genel
`src/tasarim/SecimPenceresi.tsx` aldi: gosterilecek secimler disaridan
geliyor. Kart Duzenle/Sil veriyor, yorum satiri Sil ya da Şikâyet et.
Hangisinin cikacagini SUNUCU soyluyor (`silebilirMi`), istemci tahmin
etmiyor.

**IKI YERLESIM KUSURU OLCULEREK BULUNDU** - ikisi de ekran
goruntusuyle, tahminle degil:
1. Sayfa `maxHeight` ile tanimliydi ve icerige gore buzuluyordu; bos
   durumda ekranin altinda kucucuk bir serit gibi duruyordu. `height`
   ile sabitlendi.
2. `FlatList`e `flex: 1` verilmemisti; liste icerigi kadar yer kapliyor,
   emoji seridi ve yazma alani sayfanin ortasinda asili kaliyor, altta
   bos beyaz bir alan olusuyordu.

Dogrulama: jest 60 paket / 565 test (YorumSayfasi icin 15 yeni test,
akista 2 tumlesme testi). Ekran goruntusu `tasarim/yeni-yorumlar.png`,
oncesi `tasarim/mevcut-yorumlar.png`.

**Gorsel dogrulamada TUZAK:** gercek check-in'lerde yorum olmadigi icin
liste bos gorunuyordu; dogrulamak icin veritabanina iki gecici yorum
eklenip goruntu alindi ve **yorumlar hemen silindi**. Bos bir ekrana
bakip "calisiyor" demek olcum degildir.

### KART: EYLEM SATIRI YUKARI, UC NOKTA MENUSU, DUZENLEME - 2026-09-02

Kullanicinin istegi: "begeni yorum paylasma ikonlarini yukari tasi
paylasimin altinda olmasi ... birde duzenlemeyle alakali bir buton
eklemeliyiz icerigi yaptigi paylasimi duzenleyebilecek yaptigi etiketi
kaldirabilir yazdigi notu silebilir degistirebilir".

Once uc yerlesim secenegi GORSEL olarak sunuldu (Artifact); kullanici
**A duzenini** ve **uc nokta menusunu** secti: "a olsun duzenle
ucnokta olsun silmeyide ucnoktanin silmenin icine ekle".

**SORUNUN KOKU IKONLARIN YERI DEGILDI.** Ekran goruntusuyle olculdu:
fotograf geldigi en boy oraniyla ciziliyor ve harita ekran goruntusu
gibi uzun bir gorselde kart ekrani tasiyor; eylem satiri fotografin
ALTINDA oldugu icin hic gorunmuyordu. Fotografsiz kartta ikonlar zaten
hemen alttaydi. Kullaniciya kirpma secenegi (B) onerildi ama A secildi -
karar kullanicinin.

**A DUZENI:** baslik -> not -> EYLEM SATIRI -> fotograf. Boylece
fotograf ne kadar uzun olursa olsun begeni/yorum/paylas ekranda kaliyor.

**UC NOKTA MENUSU** (`src/tasarim/PaylasimMenusu.tsx`): baslikta artik
cop kutusu YOK, tek bir uc nokta var. Icinde Duzenle ve Sil. Silme yine
iki adimli - menuden sonra `OnayPenceresi` aciliyor.

**DUZENLEME PENCERESI** (`src/tasarim/PaylasimDuzenle.tsx`): not
degistirilir ya da BOSALTILIP silinir, etiketler cip'lerdeki carpiyla
kaldirilir. "Notu sil" ayri bir dugme DEGIL - alani bosaltip kaydetmek
notu siliyor, sunucu bos metni NULL'a ceviriyor.

**MEKAN VE ZAMAN DEGISMEZ ve bu ekranda YAZIYOR.** Gerekce: check-in
"su saatte suradaydim" iddiasidir; notu ve etiketi kisinin kendi
icerigi ama mekani sonradan degistirmek kaydi uydurma haline getirir.
Ustelik ETIKETLENEN KISI de o konuma bakarak onay vermisti - mekan
degisseydi verdigi onay baska bir seyin onayina donusurdu.

**YENI RPC: `check_in_notunu_guncelle`** (migrasyon 20260902170000).
Neden RPC: `check_inler` uzerinde dogrudan update `authenticated`
rolunden geri alinmis durumda ve o kural KORUNDU - `mekan_id`
yazilabilseydi kisi kendi satirini baska bir mekana tasiyip mekan
kapisini taklit edebilirdi. RPC yalnizca `not_metni` yaziyor, sahiplik
ariyor ve moderasyon karariyla gizlenmis satiri disliyor. Hata metni
"yetkin yok" degil "Bu paylasim bulunamadi" - satirin varligi sizmiyor.

Etiket kaldirma icin YENI BIR SEY GEREKMEDI: silme politikasi zaten
check-in'in sahibine de etiketlenen kisiye de izin veriyor.

Kart uc ekranda ortak: ana sayfa ve Anilarim'da menu VAR, profil
onizlemesinde YOK (orada silme/duzenleme baglanmadi, kart salt okunur).

Dogrulama: jest 59 paket / 545 test; canli senaryo 65 (10 dogrulama)
sahiplik, bos notun NULL'a donmesi, mekan ve zamanin degismemesi,
dogrudan update'in HALA reddedilmesi ve kimliksiz cagriyi olcuyor.
Ekran goruntuleri: `tasarim/yeni-akis.png`, `yeni-menu.png`,
`yeni-duzenle.png` (oncesi: `mevcut-akis.png`).

**NOT SINIRI: 500 KARAKTER, ayni gun konuldu.** Ilk gonderimde
"sinir yok, magaza oncesi konmali" diye acik borc yazilmisti; kullanici
kabul etmedi: **"Konmalıysa koy sonraya iş bırakma."** 500 sayisi keyfi
degil - `yorumlar` tablosunda zaten ayni tavan var, ayni uygulamada iki
serbest metin alaninin iki farkli siniri olmasi icin sebep yok.

Sinir UC KATMANDA (migrasyon 20260902180000):
1. `check_inler_not_uzunlugu` sutun kisiti - ileride yazilacak yeni bir
   RPC bile atlayamaz.
2. `check_in_yap` ve `check_in_notunu_guncelle` icinde acik kontrol -
   kullanici dostane Turkce mesaj goruyor, ham 23514 degil.
3. Istemcide `NOT_EN_FAZLA` ile kirpma (yorum kutusundaki desenin
   aynisi); duzenleme penceresinde sinira 50 karakter kala sayac cikiyor.

Ayni migrasyonda `check_in_yap` notu artik NORMALLESTIRIYOR
(`nullif(btrim(...))`). Onceden yalnizca bosluktan olusan bir not oldugu
gibi yaziliyor ve kart onu "notu var" sayip bos satir ciziyordu;
duzenleme yolu bastan beri normallestirdigi icin iki yol ayni girdiye
farkli cevap veriyordu.

**BURADA BULUNAN TEST TUZAGI - kayda geciyor:** ekran testi
`lib/checkin`i mock'luyordu ve mock sabitleri tasimadigi icin
`NOT_EN_FAZLA` **undefined** oluyordu; `d.slice(0, undefined)` hicbir sey
kirpmadan SESSIZCE geciyor. Yani kirpma testte hic calismiyordu ve bunu
ancak "600 karakter yazdim, 500 bekliyorum" diyen test yakaladi. Cozum:
mock artik `...jest.requireActual('../../lib/checkin')` ile baslıyor -
yalnizca ag cagrilari degistiriliyor, sabitler gercek kaliyor.
**Kural: bir modulu mock'larken o modulun SABITLERINI de tasi; eksik
sabit hata vermiyor, sessizce undefined donuyor.**

### ETIKET ONAYI HIC CALISMIYORMUS - 2026-09-02

Plan 2'den kalan "gorunurluk paketinde etiket onayi senaryosu yok"
borcu kapatilirken ortaya cikti: **etiketi onaylamak ya da reddetmek
sunucuda mumkun degildi.** Etiketlenen kisi onayla dedigi anda
`42501 permission denied for table check_in_etiketleri` donuyordu.

**Kok neden iki migrasyonun arasinda kalmis.** Tabloyu kuran
20260826200000 "guncelleme yok, etiket ya vardir ya yoktur" gerekcesiyle
`revoke update ... from authenticated` yazmisti. Uc gun sonra onay
modelini getiren 20260829090000 "etiketlenen kisi karar verir" UPDATE
POLITIKASINI ekledi ama tablo duzeyindeki yetkiyi GERI VERMEDI.
**Yetki yoksa politika hic degerlendirilmiyor** - politika yazildigi
gunden beri olu koddu.

Sonucu: her etiket sonsuza kadar `bekliyor` kaliyordu ve
`etiketleriGetir` yalnizca `onaylandi` satirlari okudugu icin etiketler
HICBIR YERDE gorunmuyordu. Yani ozellik gonderildigi gunden beri
kapaliydi. Veri kaybi yok - duzeltme aninda tablo bostu (canlida
olculdu), gercek kullanici henuz kimseyi etiketlememis.

Duzeltme migrasyonu 20260902160000: `grant update (durum) on
public.check_in_etiketleri to authenticated`. **Yetki TABLO GENELINDE
DEGIL, yalnizca `durum` sutununda** - politikanin `with check` kolu
`kullanici_id` ve `durum` diyor ama `check_in_id` HAKKINDA HICBIR SEY
soylemiyor; tablo geneli yetkide etiketlenen kisi bekleyen satirini
baskasinin check-in'ine tasiyip kendini davet edilmedigi bir konuma
etiketleyebilirdi.

**Kural olarak alinmali: bir tablodan yetki geri alindiktan sonra o
tabloya politika eklemek YETMEZ; tablo (ya da sutun) yetkisi de geri
verilmeli.** Politika sessizce olu kalir, hicbir yerde uyari cikmaz.

Yeni senaryolar 63 ve 64 (`gorunurluk-testleri/calistir.ts`, 28
dogrulama) ve sema paketinde iki kardes iddia: `check_in_id`
guncellenemiyor (42501), `durum` guncellenebiliyor. Ikinci iddia sart -
onsuz, "tablonun tamami kapali" hali de yesil gecerdi.

### SILME ONAYI EKRANIN ORTASINDA - 2026-09-02

Kullanicinin istegi: "Gonderiyi silmeye basinca ekrana boyle sil
vazgec butonlari ciksin kisa bir bilgilendirme mesajida olabilir."
Referans olarak Instagram'in gonderi silme penceresini gosterdi.

Onceki tasarim onayi kartin ICINDE aciyordu; uzun bir kartta onay
satiri ekranin disinda kalabiliyor ve kullanici cop ikonuna bastigini
sanip hicbir sey olmadigini goruyordu.

Yeni ortak bilesen: `src/tasarim/OnayPenceresi.tsx`.

**`Alert.alert` KULLANILMADI, kendi Modal'imiz - tekrar onerme.**
Uygulama web'de de calisiyor (slooin.expo.app) ve React Native Web'de
`Alert` SESSIZCE hicbir sey yapmiyor; silme orada tamamen kirilirdi.
Kendi penceremiz uc platformda ayni gorunuyor ve test edilebiliyor
(7 test, TDD ile once kirmizi).

Check-in silmenin gectigi IKI yer de ayni pencereye gecirildi: akis /
anilar kartlari (`CheckInKarti`) ve check-in ekranindaki aktif kart
(`mekanlar/index.tsx`). Yeni bir yikici islem eklerken de bu bilesen
kullanilmali - iki yer farkli davranmasin.

Bilgilendirme metni ne kaybedildigini ONCEDEN yaziyor ve
Instagram'inkinden bilerek farkli: bizde 30 gunluk geri yukleme YOK.
Metin `anaSayfa.silAciklama` anahtarinda.

**YANLIS TESHIS, kayda geciyor:** ekran goruntusunde alt gezinme
cubugu karartmanin USTUNDE kalmis gibi gorunuyordu. Olculdu ve
teshis CURUDU - RN Web modal portali `zIndex 9999` ile en ustte ve
cubugun koordinatindaki eleman karartmanin kendisi, yani cubuk
tiklanamiyordu. Sorun islevsel degil gorseldi: beyaz cubuk %40
karartma altinda fazla parlak kaliyordu. Karartma %55'e cikarildi.
**Ders: "ustte gorunuyor" ile "ustte" ayni sey degil;
`elementFromPoint` ile olc.**

### MODERASYON PANELI ARTIK YORUM SIKAYETLERINI GORUYOR - 2026-09-02

Begeni/yorum sistemi eklenince yorum sikayetleri `sikayetler` tablosuna
dusmeye basladi ama panel `'yorum'` turunu tanimiyordu: sikayetler
birikiyor, kimse bakamiyordu. Kapatildi.

**En kritik parca gecici gizliligin COZULMESI.** Sikayet edilen yorum
aninda gizleniyor (`yorumlar.sikayet_gizli`). Karar verilmezse yorum
SONSUZA KADAR gizli kalirdi - yani tek bir sikayet, moderator hic
bakmasa bile kalici sansur olurdu. `moderasyon_sikayeti_karara_bagla`
artik o bayragi coeuyor:

| Karar | Sonuc |
|---|---|
| `reddedildi` | `sikayet_gizli = false` -> yorum GERI GELIR |
| `islem_yapildi` | `sikayet_gizli = false`, `moderasyon_gizli = true` -> kalici |
| diger | gecici gizlilik surer (henuz karar yok) |

Yeni RPC'ler: `moderasyon_yorumu_gizle`, `moderasyon_yorum_gizlemeyi_kaldir`
(ikincisi IKI bayragi da kaldiriyor). `moderasyon_sikayet_detayi` yorum
dalinda yorumun metniyle birlikte BAGLAMI da donduruyor (hangi
paylasima yazildigi + mekan adi) - moderator "bu yorum bu baglamda
taciz mi" sorusunu baglam olmadan cevaplayamaz.

Panelde: sikayet ve denetim izi suzgeclerine "Yorum" secenegi, detayda
yorum blogu ve iki ayri gizlilik gosterimi ("Sikayet uzerine gizli
(gecici)" ile "Moderasyon karariyla gizli" ayri satirlar), ve
gizle / gizlemeyi kaldir dugmeleri.

**CANLI DOGRULANDI - ve dogrulama GERCEK BIR KUSUR buldu.**
`moderasyon_kayitlari.hedef_tur` kontrol kisiti yalnizca
kullanici / check_in / sikayet / konusma kabul ediyordu; iki yeni RPC
iz'e `'yorum'` yazdigi icin **her cagrida patliyorlardi**. Iz
ekleme-only oldugundan kisit ihlali islemin tamamini geri aliyordu -
gizleme yarim kalmiyor, HIC olmuyordu. Migrasyon 20260902150000
duzeltti.

**Kural olarak alinmali: yeni bir moderasyon eylemi eklerken denetim
izinin `hedef_tur` kisiti da genisletilmeli. Iz yazilamazsa eylemin
kendisi olmuyor.**

Betik: `araclar/moderasyon-yorum-canli-test.py`, 13 dogrulama, hepsi
gecti. Jest Supabase'i mock'ladigi icin bu sinif hata ancak canli
kosumla yakalaniyor.

    python araclar/moderasyon-yorum-canli-test.py    # mobil/.env yuklu kabuk

**Betik GECICI BIR MODERATOR HESABI aciyor.** Moderator RPC'leri AAL2
(ikinci faktor) zorluyor; betik yeni bir hesap acip TOTP kaydediyor
(ilk faktor AAL1'de kaydedilebiliyor), isi bitince yetkiyi kaldirip
hesabi siliyor. **Supabase auth admin silme bu projede sik sik zaman
asimina dusuyor** - bu yuzden betik once `moderatorler` satirini
siliyor (kritik olan o; hesap kalsa bile moderator degil), sonra hesabi
silmeyi deniyor. Artik kalirsa `auth.users where email like
'gecici-mod-%'` ile temizlenir. Betik baslangicta da bu artiklari
tariyor.

**TOTP MFA ARTIK ACIK.** Plan 2 kapanisindaki "TOTP MFA kapali, panele
giris yapilamiyor" blokaji GECERSIZ - enroll calisiyor ve AAL2
aliniyor, canli olcuIdu. Test moderator hesabinda (`+905550000009` /
`moderator@slooin.app`) DOGRULANMIS bir TOTP faktoru duruyor; sirri
kullanicida, ajanda degil.

### MESAJ ISTEKLERI EKLENDI - 2026-09-01 (canli dogrulandi, OTA'da)

Kullanicinin istegi: "Mesajlar kismina uste istekler kismi ekle bu
kisimda arkadasin olmayan kisilerden gelen mesaj istekleri gorunecek."
Ardindan duzeltti: "Istekler yazisi SABIT, basinca YENI SAYFA geliyor;
orda istekler varsa gorunuyor, yoksa sayfa bos duruyor."

Yani `mesajlar.tsx` icinde "İstekler ›" satiri HER ZAMAN gorunur
(sayi rozeti yok, kosullu gizleme yok) ve `/mesaj-istekleri` sayfasini
aciyor. Liste ekraninda bolum basligi olarak DEGIL.

**Sunucu kurali `mesaj_gonder` icinde, uc dalli:**

| Durum | Sonuc |
|---|---|
| Karsilikli bag var (`bag.yazabilir_mi`) | sinirsiz yazar |
| Bana BEKLEYEN istegi olan kisiye yaziyorum | istek KABUL olur, konusma Mesajlar'a gecer |
| Yabanciya ilk kez yaziyorum | TEK mesaj gecer, `sohbet_istekleri`ne 'beklemede' satiri yazilir |
| Yabanciya ikinci kez yaziyorum | REDDEDILIR |

Yani bir yabanci sana en fazla BIR mesaj yazabilir; ikincisi icin
senin cevap vermen (= kabul) gerekir. Bu, tacizin en ucuz yolunu
kapatiyor - onay beklemeden mesaj yagdirmak mumkun degil.

`konusmalarim` bekleyen istegi olan konusmalari DISLIYOR; onlar
yalnizca `mesaj_isteklerim`de gorunuyor. Reddetme
(`mesaj_istegini_reddet`) istek satirini siler ve konusmayi YALNIZCA
alan tarafta gizler - gonderen tarafta gecmis durur, cunku silmek
karsi tarafin verisini de goturur.

Gunluk tavan: `bag.istek_on_kontrol` uzerinden gunde 50 istek
(takip + sohbet + mesaj istekleri ortak sayilir).

**CANLI DOGRULANDI** - `araclar/mesaj-istegi-canli-test.py`, iki
gercek test hesabiyla 9 dogrulama, hepsi gecti. Jest testleri
Supabase'i mock'ladigi icin bu ayri betik yazildi; ayni sinif hata
daha once yasanmisti (66 test yesilken ekran canlida hic
calismiyordu). Betik baslangicta iki hesap arasini temizliyor ve
sonunda olusturduklarini siliyor, guvenle yeniden kosulur:

    python araclar/mesaj-istegi-canli-test.py     # mobil/.env yuklu kabuk

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

### KESFET LISTESI: SUZGEC SUNUCUYA TASINDI - 2026-08-31

Kullanicinin bildirdigi hata: "yakinimdaki konumlar kismi da yanlis ya
da eksik ... en yakin 500 mt icerisindeki konumlar yakindan uzaga
siralanmali" (sonra 200 m'ye indirildi).

**KOK NEDEN - suzgec yanlis katmandaydi.** Sunucu en yakin 50 kaydi TUR
AYRIMI YAPMADAN donduruyor, istemci (`kesfetIcinSuz`) sonra sosyal
turlere suzuyordu. Kullanicinin bolgesinde olculdu:

    500 m icindeki sosyal mekan ........ 111
    sunucudan gelen 50 kaydin sosyali ..   3
    50 kaydin bittigi mesafe ........... 222 m

Yani dolu bir cevrede liste neredeyse bos gorunuyordu. **Siralamada
sorun YOKTU** (83 -> 102 -> 114 m); sorun kapsamaydi.

Cozum: `yakin_mekanlar_yogunluk`a `p_turler` ve `p_limit` eklendi
(migrasyon 20260831120000). Tur listesi ISTEMCIDEN gidiyor - `SOSYAL_TURLER`
tek kaynakta kaliyor. `kesfetIcinSuz` SILINDI.

**DAVRANIS (kullanicinin netlestirmesiyle):**
- LISTE: **500 m** yaricap, en yakin 100. Sabitler
  `KESFET_YARICAP_METRE` / `KESFET_LIMIT`. Yaricap once 500'du,
  2026-08-31'de 200'e indirildi, 2026-09-01'de yine 500 oldu.
- **SINIR KESIN.** Yaricap icinde sonuc cikmazsa ekran ESKIDEN sinirsiz
  ikinci bir istek atiyordu; bu, 200 m sinirli listede 420-530 m
  mekanlar gorunmesine yol aciyordu (kullanici ekran goruntusuyle
  yakaladi). O kacis yolu KALDIRILDI - cevrede mekan yoksa liste bos
  kalir.
- TUR SUZGECI yalnizca Kesfet sekmesinde; "Mekan ara" sekmesinde butun
  turler gorunuyor (kullanicinin istegi 2026-08-31).
- Ekran "Mekan ara" sekmesiyle ACILIYOR (2026-09-01).
- ARAMA: sinir YOK - ne mesafe ne tur. "Mesafe siniri yok sadece mekan
  arama kismi icin gecerli." Kullanici baska sehirdeki mekani arayabilir.
- Cevrede hic sosyal mekan yoksa ekran SINIRSIZ ikinci istek atiyor.

200 m'nin bedeli olculdu: kullanicinin bolgesinde 200 m'de 3 sosyal
mekan var, 500 m'de 111 (Kadikoy'de 1.456 / 5.363). Dar gelirse
300-350 m orta yol.

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

### MAHALLE AKTARIMI - CALISIYOR (2026-08-31)

**Durum: cron ACIK, ~36.000 satir/dk, bitince KENDINI KAPATIR.**
Baslangicta 5.895.360 satirdi; kalan sayiyi olcmek icin asagidaki
"ILERLEME OLCUMU" sorgusuna bak.

Gecmisi: aktarim bir ara duraklatildi cunku uygulamayi yavaslatiyor -
olculdu, kesfet sorgusu normalde 137 ms, aktarim koserken **1.817 ms**;
ayni diski paylasiyorlar. Kullanici once "duraklat, test edeyim" dedi,
sonra **"Devam ettir yarım iş bırakma"** deyip tamamlanmasini istedi.
Yani yavaslik BILINEN ve KABUL EDILEN bir bedel; is bitene kadar
telefonda ekranlar 1-2 saniye gecikmeli acilabilir.

**DEVAM ETTIRME (durdurulmussa):**

```sql
select cron.schedule('mahalle-aktarim', '* * * * *',
  $$set statement_timeout = '9min'; select public.mahalle_aktarim_adimi(0)$$);
select cron.schedule('mahalle-aktarim-2', '* * * * *',
  $$set statement_timeout = '9min'; select public.mahalle_aktarim_adimi(1)$$);
```

Kaldigi yerden devam eder: `mahalle_hazirlik.islendi` isaretli, hicbir
sey bastan yapilmaz. Bitince fonksiyon iki cron isini de KENDI kapatir.
Tahmini kalan sure ~2 saat (37.500 satir/dk).

**DURDURMA:**
```sql
select cron.unschedule('mahalle-aktarim');
select cron.unschedule('mahalle-aktarim-2');
-- Baslamis turlar devam eder; hemen durmasi gerekiyorsa:
select pg_cancel_backend(pid) from pg_stat_activity
where query ilike '%mahalle_aktarim%' and state='active' and pid<>pg_backend_pid();
```

**ILERLEME OLCUMU** - `count(*)` tam tarama yaptigi icin zaman asimina
dusuyor; kismi indeksi kullanan su sorgu hizli:
```sql
select count(*) from mahalle_hazirlik where not islendi;
```

Is bitince `mahalle_hazirlik` tablosu DUSURULEBILIR (tek seferlik).
Kaynak parquet `araclar/fsq-tr-mahalle-son.parquet` diskte duruyor.

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

### KONUM EKRANI: ADRES KENDI VERIMIZDEN - 2026-08-31

Ekran `src/app/harita/[mekanId].tsx`, mekan adinin altindaki satir.
Kullanicinin son karari:

    "Konumun üzerine basınca gelen sayfada varsa tam adresi, yoksa
     ilçe il bilgisi... bu şekilde düzenle ve tutarlı olmalı."

Kural: `mekan.adres` varsa O gosterilir, yoksa "ilce, il".

**CIHAZDAN ADRES COZUMU DENENDI VE KALDIRILDI (ayni gun).** Once
`expo-location.reverseGeocodeAsync` ile adres cihazda cozuluyordu
(`lib/adres.ts`). Kaldirilma sebebi gizlilik ya da maliyet DEGIL,
DOGRULUK: saglayici yanlis mahalle donduruyordu. Kullanicinin
gosterdigi ornek - Nilufer'deki bir mekan icin Apple "Ertugrul" diyordu,
dogrusu ALAADDINBEY. Ustelik liste ekrani kendi verimizden dogru
mahalleyi gosterdigi icin IKI EKRAN BIRBIRINI TUTMUYORDU; kullanicinin
istedigi tutarlilik tam olarak buydu.

`lib/adres.ts` ve testleri SILINDI. Gizlilik metnindeki ve
`docs/kvkk-uyum-listesi.md` icindeki "adres cozumu" aktarim maddesi de
kaldirildi - artik disari sorgu gitmiyor.

**Ders:** ucuncu taraf bir servis "daha zengin veri" veriyor diye daha
DOGRU vermiyor. Elimizdeki kayit (mekanin kendi adresi) yerel bilgiyle
dogrulanabiliyorsa ona guvenmek daha iyi.

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

### MEKAN VERISI: FOURSQUARE TEK KAYNAK (2026-08-30) - TAMAMLANDI

Karar 79-80 (`docs/konusma-gunlugu.md`). Overture SILINDI (877.864
satir; test check-in'leri de gitti - kullanicinin karari). `mekanlar`
= 5.980.482 Foursquare kaydi + 3 test mekani. Kaynak `'foursquare'`,
kimlik `fsq_place_id` (tekil indeks). Tur gizleme kurali degismedi
(`turuGosterilir`: yalnizca 'kullanici'). Veritabani 3,1 GB; compute
MEDIUM (kalici boyut karari kullanicida - Nano'da 6 milyon satir
calismiyor, bkz. karar 80).

**Boru hatti (aylik tazeleme icin):** `araclar/README.md` "Foursquare"
bolumu. Kisaca: `fsq-indir.py` (HF token) -> `mekan-yukle-foursquare.py`
(fsq_hazirlik) -> pg_cron `fsq_aktarim_adimi` (migrasyon 20260830130000)
-> `fsq_bitis_adimi` (20260830140000; tazelemede Overture silme adimi
YOK, sadece indeks/temizlik). Istemciden dilim dilim RPC cagirmak
Nano'da CALISMADI (60 sn gateway, hayalet ifadeler, kilit yarisi) -
sunucu tarafi cron tek guvenilir yol.

**ACIK ISLER (bu isten kalan):**
1. ~~Ilce/adres zenginlestirme~~ TAMAMLANDI (2026-08-31 gece): yerel
   hesap bitti (`fsq-tr-semtli.parquet`, 4.973.436 satir), uc paralel
   upsert ile mekanlara islendi (FSQ_TABLO=mekanlar; kismi tekil indeks
   tam tekile cevrildi - PostgREST on_conflict kismi indeksle
   eslesemiyor). Il adi semt kalmis kayitlar ve "Osmangazi / Bursa"
   gibi bolulu biçimler SQL ile temizlendi (ikisi de 0).

   **EK DUZELTME (ayni gece, ikinci oturum):** yukleyicideki `_semt()`
   fonksiyonundaki "locality == region ise semt sayma" kurali
   KALDIRILDI. Kural ham FSQ verisinde il adini elemek icin konmustu,
   ama Foursquare bir kisim kayitta `region` alanina IL yerine ILCE
   yaziyor ("Aliaga/Aliaga", "Cukurova/cukurova"); zenginlestirme o
   kayitlara Overture'dan DOGRU ilceyi koydugu icin kural tam da dogru
   veriyi siliyordu - olculdu, **273.607 kayit bosalmisti**. Il
   adlarini zaten ILLER listesi eledigi icin kuralin kaldirilmasi
   koruma kaybi degil. Etkilenen satirlar ayri bir parquet'e cikarilip
   yeniden yuklendi.

   **SON DURUM: semt dolu 4.868.071 (%81,4), adres dolu 2.343.697,
   toplam 5.980.482.** (Adres sayisi 2.127.122 + zenginlestirmenin
   buldugu 216.575 ile TAM eslesiyor - yani atlanan aralik yok.)
2. ~~`kategori-eslemesi.py`, `tur-duzeltmeleri*.py`,
   `mekan-yukle-overture.py` README'de isaretlenmeli~~ YAPILDI
   (2026-08-31): `araclar/README.md` Foursquare tek kaynak gercegine
   gore yeniden yazildi; Overture donemi betikleri "TARIHSEL,
   calistirilmaz" basligi altinda. `overture-tr.parquet` diskte
   KALMALI - `fsq-semt-doldur.py`nin tek girdisi o.
3. `gers_id` sutunu ve `mekanlar_gers_id_benzersiz` kisiti bos duruyor;
   ileride dusurulebilir.
4. Foursquare'de dahili kopyalar var (Bursa yeme-icmede 251 cift, 40 m
   icinde ayni ad); tekillestirme yapilmadi.
5. Lisans: Apache 2.0 - NOTICE metni belgeye konmali (magaza oncesi).
6. Kullanicinin HF token'i sohbete yapistirildi; iptal etmesi istendi.

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

**TESTFLIGHT ARTIK VAR (2026-08-30).** iOS uretim derlemesi alindi ve
TestFlight'a girdi: build number 3, commit `d13af66`, calisma surumu
1.0.0, kanal `production`. Yani asagidaki eski "bekleyen is" notu
KAPANDI.

**UYGULAMANIN IKI AYRI YAYIN YOLU VAR - KARISTIRMA:**

| Hedef | Komut | Ne guncellenir |
|---|---|---|
| Web (`slooin.expo.app`) | `npm run yayinla` | YALNIZCA tarayici surumu |
| TestFlight / magaza (iOS, Android) | `npx eas-cli update --channel production --environment production --message "..."` | Telefondaki uygulama, OTA |

**`npm run yayinla` TESTFLIGHT'I GUNCELLEMEZ.** Bu bir kez yasandi:
degisiklikler web'de gorunuyordu, kullanici "Testflight'ta
gorunmuyor" dedi. Ikisi ayri paket.

OTA'nin sartlari: `expo-updates` kurulu (commit d13af66'dan beri),
`runtimeVersion` policy `appVersion` (su an 1.0.0) ve derlemenin
kanali ile guncellemenin dali eslesmeli. Dogrulama:
`npx eas-cli channel:view production` - "Branches pointed at this
channel" altinda `production` dali ve ayni calisma surumu gorunmeli.
`--environment` bayragi `--non-interactive` modda ZORUNLU.

YENIDEN DERLEME yalnizca native taraf degisince gerekir (yeni native
paket, izin, app.json'daki native alanlar). Salt JavaScript/varlik
degisiklikleri OTA ile gidiyor. Guncelleme telefonda ARKA PLANDA
iniyor ve BIR SONRAKI acilista uygulaniyor - kullanicinin uygulamayi
tamamen kapatip acmasi gerekir, bazen iki kez.

Yeni bir native derleme gerekirse (kullanicinin kendi terminalinde,
Apple girisi + 2FA istiyor):

```
npx eas-cli build --platform ios --profile production
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

**E-POSTA + SIFRE (2026-09-02'den beri gecerli olan):**

    test0@slooin.test  / test1234   (kullanici adi: byorcun)
    test1@slooin.test  / test1234
    test2@slooin.test  / test1234

Ucunun de profili var, yani giris yapinca dogrudan uygulamaya
giriyorlar. `.test` uzantisi IANA tarafindan rezerve - hicbir zaman
gercek birine ait olamaz, yani yanlislikla kimseye posta gitmez.
Uctan uca dogrulandi: ucu de gercekten giris yapiyor.

**BUNLAR SONRADAN EKLENDI.** Kayit/giris e-postaya tasininca telefonla
acilmis test hesaplari GIRIS EKRANINDAN ULASILAMAZ hale gelmisti -
e-postalari yoktu ve ekran artik e-posta istiyor. Adresler
`araclar/test-hesap-eposta.py` ile eklendi (idempotent, guvenle
yeniden kosulur).

Ayni hesaplarin TELEFONLARI da duruyor (05550000000/1/2, SMS kodu
123456). Telefon yolu istemcide artik kullanilmiyor ama auth kaydinda
yerinde; ileride SMS'e donulurse calisir.


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
