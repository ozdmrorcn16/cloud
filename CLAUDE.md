# Proje Hafizasi

Her Claude Code oturumunda otomatik yuklenir. Sureklilik uc yerde:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Yururlukteki kurallar, guncel durum, acik borclar, tuzaklar. KISA. |
| `docs/claude-md-arsiv.md` | Tarihli tur anlatimlari, gerekceler, olcumler (grep ile aranir). |
| `docs/konusma-gunlugu.md` | Oturum indeksi + karar defteri. |
| `docs/oturumlar/` | Her oturumun tam dokumu (`.claude/hooks/oturum-kaydet.py` yazar). |

Bir kuralin NEDENINI ya da daha once neyin denenip elendigini ararken:
`grep -n "anahtar kelime" docs/claude-md-arsiv.md`. Bu dosyadaki
maddelerin cogunun tam anlatimi orada ayni baslik/tarihle duruyor.

## Claude icin kurallar

- **`slooin-projesi.md`** (depo koku) tek dosyalik devir belgesi;
  oturum basinda YALNIZCA "Kaldigi yer" bolumu okunur
  (`sed -n '/^## 8. Kaldigi yer/,$p' slooin-projesi.md`) - geri kalani
  bu dosyayla ortusur, butunu ~12 bin token. Her yayindan sonra
  "Kaldigi yer" guncellenir. Masaustu
  `slooin projesi.md` ve GitHub `ozdmrorcn16/slooin-projesi` ayni dosyanin
  kopyalari; `git push origin` IKI depoya birden gider.
- Kullaniciyla Turkce konus. Kod, yorum, commit: duz ASCII Turkce.
  Ekran metinleri: duzgun aksanli Turkce (karar 74).
- **Her sey push edilir** (2026-08-19). Commit sonrasi `git push`, izin
  sormadan. Calisma dali: `claude/plan2-moderasyon-paneli`.
- **Sirlar asla depoya girmez.** Depo PUBLIC. Gercek anahtar ne teste,
  ne ornege, ne belgeye (bir kez Pexels anahtari sizmisti). Kullanici bir
  jeton yapistirirsa `oturum-kaydet.py` maskesine kalibi ekle.
- **Gizlilik ve KVKK her adimda** (2026-08-22). Yeni is kaleminde
  `docs/kvkk-uyum-listesi.md` okunur/guncellenir; dort soru (hangi veri,
  hangi dayanak, ne kadar sure, kim gorur) cevaplanir. Isletmeci
  yetkisi KESILMEZ; uyum aydinlatma + denetim izi + saklama suresiyle.
- **BU DOSYA KISA KALIR: TAVAN 50.000 KARAKTER.** 2026-09-13'te 407 bin,
  2026-09-24'te yine 286 bin karaktere (~95 bin token, her oturum basi)
  cikti. Buraya yalnizca: yururlukteki kural, guncel durum, acik borc,
  ortam tuzagi, "bir daha yapma" dersi - birer iki satir. Tur anlatimi
  ("su ekrani su hale getirdik", OTA grup kimlikleri, olcum tablolari)
  `docs/claude-md-arsiv.md` sonuna yazilir. Olcut: GECMISI anlatiyorsa
  arsive, GELECEKTEKI bir karari degistiriyorsa buraya; ikisiyse dersi
  buraya, anlatimi arsive. Oturum basindaki `claude-md-boyut.ps1`
  tavan asilinca uyarir - uyari gelirse o oturumda once budama yapilir.
- Kalici karar alininca bu dosya ya da konusma gunlugu guncellenir ve
  commit'lenir. Yayindan sonra `slooin-projesi.md` "Kaldigi yer".
- Ayni dalda PARALEL BASKA BIR OTURUM calisiyor olabilir. Push
  reddedilirse force-push YOK: `git ls-remote` ile hangi ucun ayri
  oldugunu olc, birlestir (kullanicinin secim yaptigi surum kazanir).
  Ilk commit'e giren degisikligi `git checkout -- dosya` geri almaz;
  `git checkout <eski> -- dosya`.

## Guncel durum (2026-09-24)

Acik yarim is YOK. Son yayin: "Ani ekle" sipsak akisi + check-in galeri
sayfasi (OTA `883713d6`, web `slooin--6qnel25x9a`). Kurallar:
- 24 saatlik ozelligin ADI "ANLIK" (tr; en moment, de Moment, es
  momento, fr instant, ru момент, ar لحظة) - her ekranda, bildirimde,
  hata metninde ve gizlilik metninde TEK AD (2026-09-24, kullanicinin
  karari). "Anı/Anılar" YALNIZCA profildeki check-in gecmisi; karistirma.
  Kod adi hala `hikaye` (tablo, RPC, dosya, sozluk anahtari).
- ANLIK ARSIVI (2026-09-24): anlik seritte 24 saat, sonra YALNIZCA
  SAHIBININ arsivinde suresiz ("Anlık ekle" ekraninin SAG USTUNDEKI ikon -> `/anlik-arsivi`; ana
  sayfada YOK -
  izleyici `?arsiv=<id>`). Gorenler/ifadeler/etiketler 24 saatte silinir
  (cron artik yalnizca bunlari siler). Izleyicide ZAMANLAYICI YOK;
  dokunus/kaydirmayla gecilir. Ustte SIRA GOSTERGESI (2026-09-26): anlik
  sayisi kadar parca, gecince bulunulan parca 240 ms'de dolar - sure degil. RLS "kendi anlik
  arsivi"; `hikaye_akisi` sure suzgecini ACIKCA tasir. Hesap silme anlik
  ve TUM check-in fotograflarini kovadan siler (hesap-sil v8). Canli
  `araclar/anlik-arsivi-canli-test.py` 13/13. Ikon: B (arsiv kutusu,
  kullanicinin secimi; `tasarim/anlik-arsivi/`).
- Anlık ekle: galeriden yukleme YOK (ne galeri karesi, ne
  `?foto=`), yalnizca anlik cekim. Cekimden sonra fotograf AYNI
  kartta kalir (`ANI_KART_ORANI` 3:4 = 0.75 (2026-09-24; once 0.88), cover); izleyici de ayni oran
  ve kirpmayla ciziyor - paylasanin gordugu kare = izleyenin gordugu.
  Cekim dugmeleri kalkar; KONUM HAPI fotografin UZERINDE altta ortada
  (check-in varsa mekan + x), fotografin hemen altinda solda gizlilik
  (Arkadaslar ⌄), saginda Paylas - ikisi `HareketliDugme` (2026-09-26,
  kullanicinin karari; "Tekrar cek" ve "Kimler gorebilir?" YOK). Cekimde
  gizlilik YOK. TUZAK: Animated.View icindeki Pressable'a `flex:1` verme -
  sutun kapta yukseklik 0 olur (telefonda zemin/yazi kayboldu, jest gormez). PAYLASAN yazi/ifade/etiket EKLEYEMEZ.
- Baskasinin anliginda (2026-09-26): fotografin ALTINDA en sik 6 IFADE (108'lik
  set; `sik_ifadeler` RPC: once kisinin kendi sikliklari, sonra genel adet) +
  ARTI (IfadeSecici, butun liste). Dokunmak ifadeyi ANLIGA birakir
  (`hikaye_ifadesi_gonder`, sahibi Gorenler'de gorur), yeniden dokunmak
  kaldirir. Standart emoji -> sohbet yolu KALKTI. En altta "Yanıt ver…" sohbete.
- Ana sayfa anlik seridi: DAIRE DEGIL, cekim kartinin kucugu (3:4, 72x96,
  oval kose; 2026-09-26 secim B): icinde EN YENI anligin fotografi, sol altta
  kucuk profil resmi (anligi olmayan kendi kartimda profil resmim). Kenardaki
  halka (2026-09-25, "A ile C") kisinin anlik
  SAYISI kadar dilim; gorulmemis dilim kalin turuncu->sari->pembe gradyan,
  gorulen ince gri; avatarla halka arasi beyaz bosluk; yenisi olanin adi
  kalin. KENDI dairemde de ayni halka (anligim varsa); sahibin izlemesi
  `hikayeler.sahip_gordu` bayragina yazilir, Gorenler'e DEGIL (2026-09-26).
  "Anlık" ve "Anlık ekle" yazilari kalin (tek dosyali fontta
  fontWeight telefonda ISLEMEZ - kalin AILE `yazi.ekranBasligi` verilir).
- Anlik izleyici (2026-09-26): kendi anligimda "Anlığı sil" dugmesi YOK
  (yalnizca uc nokta menusunde); uc nokta ve × `HareketliDugme`
  (`src/tasarim/HareketliDugme.tsx`, ekle ile ortak).
  Uc nokta menusu `AnlikMenusu` (Secenek A duzeni, BEYAZ kart = tema `yuzey`: onizlemeli
  baslik, yayli giris, kademeli satirlar, arkadaki kart %94); diger
  ekranlar beyaz `SecimPenceresi`nde kalir.
  Silme onayi `AnlikSilOnayi` (A, BEYAZ kart: egik onizleme + kirmizi cop
  rozeti; Sil'e basinca onizleme rozete suzulur, sonra silinir).
- Canli kamera YALNIZCA kartta tek `CameraView`. Modul yoksa deklansor
  sistem kamerasini acar.
- Check-in formu ve duzenleme `GaleriSayfasi` kullanir (ilk hucre
  kamera, son fotograflar, Ekle'de coklu). Mekan duzenleme, sikayet,
  profil fotografi eski Kamera/Galeri penceresinde KALIR.
- Kamera karti SESSIZ GRI KALMAZ: `kameraIzinDurumu` (verildi /
  sorulabilir / ayarlardan / modul-yok) karta yazilir; "Izin ver" ya da
  "Ayarlari ac". KOK NEDEN (2026-09-24, kullanicinin "Izin ver'e basinca
  bir sey olmuyor" bildirimi): expo-camera SDK 57 izin islevlerini
  kokten degil `Camera` nesnesinden veriyor; kok duzeyden cagri
  TypeError -> izin HIC sorulmuyordu. `lib/kamera.test.ts` paket
  seklini node_modules dosyasindan kilitliyor.
- TELEFONDA DOGRULANDI (2026-09-24, kullanici, iOS 1.0.0 (15) + OTA
  `ae6d66cc`): izin penceresi + canli onizleme aciliyor.
- HALA DOGRULANACAK: deklansorle cekim + flas/cevir,
  check-in'de alttan galeri + coklu secim.

**Yayin durumu:** en yeni native derlemeler (commit 01481244,
`expo-camera` + `expo-media-library` icerir): iOS **1.0.0 (15)** TestFlight
dahili grup "tesstt"te IN_BETA_TESTING (public link
testflight.apple.com/join/vfgCFp3b); Android **versionCode 9** Play dahili
testte (opt-in https://play.google.com/apps/internaltest/4700396095656408634).
Canli kamera ancak bunlarda calisir; (14)/8'de kart gri kalir (olculdu,
kullanicinin ekran goruntusu 2026-09-24). ASC durumunu API ile sormak:
`mobil/gizli/AuthKey_ASC_T2DU3DFMW4.p8` + `asc-issuer.txt` ile ES256 JWT
(python `jwt`), `/v1/builds?filter[app]=...`; `eas submit` "failed"
diyorsa once derleme zaten yuklu mu bak. Runtime 1.0.0, kanal production;
OTA'lar bunlara gider. Site https://slooin.com, panel
https://panel.slooin.com, uygulama web `slooin.expo.app`.

## Acik borclar

- **Hikaye/check-in fotograflari ~2 MB** (4032 px). Karar (kullanici):
  UCRETSIZ yol - `expo-image-manipulator` ile yuklemede 1080 px / ~0.75
  kucultme; paket kurulu degil, sonraki NATIVE derlemeyle. Yer:
  `lib/hikaye.ts` `hikayeEkle` + `lib/checkin-fotograf-yukle.ts`.
  Supabase gorsel donusumu ACILMADI (tekrarlayan gider; olcum arsivde).
- **Video hikaye** yok (expo-video yeni native modul).
- **Oturum jetonlari AsyncStorage'da**; `expo-secure-store` magaza
  oncesi (native).
- **Yazi buyutme** (`maxFontSizeMultiplier`) yapilmadi, ekran ekran is.
- **Play:** servis hesabi `eas-play-yayin@slooin.iam.gserviceaccount.com`
  yalnizca test kanallari; URETIM icin "Uretim surumune yayinlama" izni
  ayrica verilecek. Ilk kurulum formlari (magaza girisi, icerik
  derecelendirme, veri guvenligi, uygulama erisimi) kapali test/uretim
  oncesi. "Kurulusunuzu dogrulayin" kimlik belgesi kullanicida.
- **Play imzasi SHA-1 belirsiz** (klasik A2:ED:59... / kuantum 39:62...
  / assetlinks 4C:8D...); ucu de kayitli. Play'den kurulan surumde Google
  girisi + harita DOGRULANMALI; DEVELOPER_ERROR / gri harita = SHA-1.
- **Magaza baglantilari** gelince: slooin.com/<ad> sayfasindaki
  "yakinda" notu dugmeye, `[ad].js` intent fallback'i Play'e.
- **Apple magaza formu** gizlilik adresi `slooin.com/gizlilik` olmali;
  Apple SPF paneli kirmiziydi (asil olcum gecmisti).
- **KVKK m.9 standart sozlesmeler:** Supabase bilet SU-471923, Expo
  formu, Resend (2026-09-14) - cevap bekleniyor;
  `docs/kvkk-aktarim-envanteri.md`, `docs/kvkk-standart-sozlesme-talep-yazilari.md`.
- **Magaza ulke kapsami** onerisi: ilk yayinda yalnizca Turkiye.
- Ifade ETIKETLERI cevrilmedi (setin kendi adlari).
- Kullanilmayan ama duran: `lib/harita-kumeleme.ts`, `MekanKapakHarita`
  (mekanlar/index'te degil), `BinaIkonu`, `akisAyrac` jetonu,
  `anaSayfa.aramaYerTutucu`, `hikaye.yanitYerTutucu/gonder`,
  `bag_kisileri` RPC (istemci cagirmiyor), `MekanIkonu`/`MekanGorseli`.
- Panelde 2026-08-23 tarihli 1 bekleyen mesaj sikayeti TEST VERISI
  (Plan 2 dogrulamasi); silme karari kullanicida.
- GERCEK CIHAZDA DOGRULANMAMIS: animasyonlar (surukle-kapat hissi),
  hikaye kaydirma/tepki, performans hissi, canli kamera.

## Komutlar

```bash
cd mobil
npx jest --runInBand          # mock tabanli (~97 paket / ~1270 test)
npx tsc --noEmit              # uygulama kodunda TEMIZ olmali
npm run test:sema             # canli DB: sema, yetki, anon kapisi
npm run test:gorunurluk       # canli DB: gorunurluk senaryolari
                              # tek senaryo: SLOOIN_SENARYO=66
npm run yayinla               # expo export + eas deploy --prod (web)
npx eas-cli update --channel production --environment production --non-interactive -m "..."
npx eas-cli build --platform ios|android --profile production
npx eas-cli submit --platform android --latest   # servis hesabiyla, tarayicisiz
cd supabase/functions && deno test --allow-net --allow-env
```
Canli test betikleri `mobil/araclar/*-canli-test.py` (her ozellik icin
bir tane; kendi actigi veriyi siler). Ekran goruntusu:
`araclar/ekran-goruntusu.mjs` (`SLOOIN_TEST_SEMA=light`,
`SLOOIN_SAHTE_RPC=<rpc>`), SPA icin `node araclar/spa-sunucu.mjs dist`
(python http.server SPA yolunda 404). Olcum: `araclar/gezinme-olcum.mjs`,
`araclar/hikaye-gecis-olcum.mjs`. Cihaz taramasi `araclar/cihaz-taramasi.sh`.

**Sunucu davranisini degistiren HER iste `test:gorunurluk` ve
`test:sema` kosulur** - jest Supabase'i mock'ladigi icin bu sinifi
goremez (bir kez 11 dogrulama kirik kaldi).

## Urun kurallari (yururlukte - tekrar onerme)

Genel
- Slooin: check-in yap, gorunur ol, populer yerleri kesfet,
  yakinindakilerle tanis, sohbet et (bes adim, kisaltilmaz). 18+.
  Yalnizca birebir sohbet (grup/mekan odasi KALICI olarak yok).
- Marka turuncusu #FE7813 sabit. Sayfa zemini TAM BEYAZ (yalnizca
  karsilama `karsilamaZemini`); gri akis zemini denendi, reddedildi.
  Kart ile sayfa renkle ayrilmaz: `cizgi` kenarlik / golge sart.
  Uygulama ici tek yazi ailesi Instrument Sans.
- Ekranda "bag" degil "arkadas". Metinler once Turkce, sonra 7 dil
  (tr en de es fr ru ar).
- Hukuki onaylar TEK yerde (kayitta "Devam"a basmak = kabul; KVKK onay
  kaydi tutulur). Kimlik e-posta + OTP (SMS YOK: TR'de vergi mukellefi
  sart; Twilio/yerel/Firebase elendi). Apple + Google girisi calisiyor.
- Sitede `slooin.expo.app`'e ASLA baglanti yok; web giris sayfasi iptal.

Check-in ve mekan
- Check-in 1 km icinde; 1 saat "su an burada", sonra gorece zaman;
  koordinat cron ile silinir (~1 sa 10 dk). Her check-in YENI satir
  (kendi paylasimi, ayri duzenlenir/silinir). Mekan "Son check-inler":
  son 24 saat, kisi basina tek satir. Liderlik her zaman 3 kisi.
  (Kural bir LISTENIN gosterim kurali; veri modeline yayma.)
- Siralama HER ZAMAN en yakindan uzaga (sunucu; testle kilitli).
- "Yakinindaki mekanlar" 1 km (tur suzgeci varken de). Arama kullanicinin
  O ANKI ILIYLE sinirli; il bulunamazsa en yakin il. Tur suzgeci ve
  mesafe secimi cihazda kalici (AsyncStorage), "kaldir" denene kadar.
- Dis kaynakli mekanda TUR GOSTERILMEZ (`turuGosterilir`); yalnizca
  kullanicinin ekledigi mekanda. Konum ibaresi yalnizca "Ilce, Il"
  (poligon icinde; mahalle/adres gosterilmez - uc deneme elendi).
  Turetilmis veri YOK. OSM/ATP/Yandex/Google tur/fotograf kaynagi
  olarak olculdu ve elendi (arsiv + `docs/konum-veri-kaynaklari-arastirmasi.md`).
- Kapali mekan: kullanici bildirir, moderator onaylar (`kapali`
  varsayilan onayda YOK), listeden/check-in'den duser, silinmez, geri
  acilabilir. Tur duzeltme ayni talep akisi.
- Check-in: en fazla 5 fotograf (`fotograflar text[]`, `fotograf`
  generated); ifade (108'lik set, tek); arkadas etiketi (onay ayari
  karsi tarafin). Bulunurluk her zaman profil varsayilani (ilk kullanim
  ekrani kaldirildi).
- Akis karti: etiketlenenler "check-in yaptı." cumlesinin DEVAMINDA,
  yalnizca profil resmi + "ile birlikte" (kullanici adi YOK, 1 kiside
  de); resimler ust uste, satir dolunca alt satirdan devam; yazi son
  resimle bolunmez. Telefonda olcumlu (`etiket-yerlesimi.ts`), webde
  inline akis (react-native-web `onTextLayout` VERMIYOR). "check-in"
  bolunmez tireyle (U+2011). Ornek `tasarim/etiket-satir-ici/`.
- Mekan sayfasi: puan blogu EN ALTTA; puan 3+ oyla, yalnizca o mekanda
  check-in yapan oy verir. Fotograflar sekmesi (RLS aynen).

Profil, arkadaslik, gizlilik
- Tek gizlilik anahtari `profil_gizli`. Gizli profili yalnizca
  ARKADASLIK acar (kabul edilmis sohbet acmaz). "Anilarim kimlere
  gorunsun" ayari KALDIRILDI, tekrar onerme.
- Acik profile "Arkadas ekle" = aninda arkadas; gizliye istek.
  "Beklemede"ye basmak onayla geri ceker. Mesaj istegi GERI ALINAMAZ;
  engelleme konusmalari iki taraftan siler (sessizlik ilkesi:
  engelli "Bu kullanici bulunamadi" alir).
- Oturdugun bolge yalnizca kayitta, profilde hic gorunmez, ayar yok.
- Kullanici adi 24 saatte bir. Sitenin sayfa adlari yasakli ad.
- Sikayet: tek giris profildeki uc nokta (sohbette yok); tekrar
  sikayette uyari penceresi. Sikayete fotograf eklenebilir.
- Akista birden fazla kart ayni anda duzenlenebilir (kilit denendi,
  geri alindi). Cikis yap onayli.
- Veri disa aktarma: kendi mesajlari tam, karsinin metinsiz; hakkindaki
  sikayetler ve kendisini engelleyenler ASLA girmez.

Hikaye
- 24 saat, kisi basina 10; gorunurluk hikaye basina Arkadaslar/Herkese
  (aciklama metni YOK), secim oldugu gibi uygulanir; serit kesif akisi
  degil (ben + arkadaslar). Push yok. Etiketler tuvalde oransal konum.
  Izleyici Instagram isleyisi (tek pan: yatay kisi, asagi kapat, yukari
  izleyenler). Acik fotografta ustte/altta gradyan.

Tasarim sureci
- Referans gorsel BIREBIR uygulanir; daha iyisini gorursem ONERIRIM.
- Tasarim secenekleri once gorsel sunulur; secim olmadan kod yok.
- Istenen kadarini yap; ekranlar tek tek, kullanicinin talimatiyla.
- Ayni kavram her ekranda ayni ikon/bilesen. Listeler sonsuz kaydirma.
- Geri oku (`UstCubuk`, 21 ekran) HAREKETLI (2026-09-26): sagdan yayli
  giris, basinca sola itilip kuculur.
- HER DEGISIKLIK KOYU MODA UYARLI (2026-09-26): renk tema jetonundan
  (`useStiller`), sabit hex yalnizca her iki temada ayni kalacak yuzeyde
  (anlik izleyici/kamera siyahi, perde).
- Yan etki olarak bilesen dis olcusu kucultulmez.

## Kod kurallari ve tuzaklar (bir daha yapma)

Veritabani / Supabase
- Yeni SECURITY DEFINER fonksiyonda `revoke ... from public, anon`
  ACIKCA yazilir (MCP `apply_migration` postgres rolunde kosmuyor,
  varsayilan yetki islemiyor). Kimliksiz cagri isteyen fonksiyona acik
  `grant execute ... to anon` (bugun: eposta_kayitli_mi,
  telefon_kayitli_mi, profil_karti).
- `profiller`e sutun ekleyen migrasyon `grant update (sutun)` tasir
  (profil_gizli 16 gun kaydedilemedi).
- Fonksiyon imzasi degisirse eski imza DROP (asiri yukleme tuzagi) ve
  `pg_proc.prosrc` icinde adi aranip BUTUN cagiranlar ayni migrasyonda.
- Bir fonksiyonu "dosyadan kopyalamadan" once `pg_get_functiondef` ile
  CANLI tanimi karsilastir (MCP ile canliya konan kosul dosyada yoktu).
  `verilerimi_disa_aktar` degisikligi canli tanimdan devam eder.
- PostgREST gomulu sorgu: FK hangi tabloya gidiyor bak
  (check_in_etiketleri -> auth.users, profiller degil). `profiller`
  uzerinde okuma politikasi yok; invoker fonksiyonda join sessizce
  bos doner - `gizli` semasinda definer yardimci kullan.
- `raise exception` metni degisirse `lib/hata-metni.ts` anahtari da.
- Kismi tekil indeks `on_conflict` ile eslesmez; sema degisikliginden
  sonra `notify pgrst, 'reload schema'`.
- EXPLAIN'de sureye degil BLOK SAYISINA bak (onbellek yaniltir).
  `mekanlar` 5,9M satir: toplu UPDATE ~20 bin satir/dk (disk);
  `ad` esitligi ve `il='Bursa' order by id` zaman asimina duser -
  toplu olcum yerel parquet'ten.
- pg_cron'da `statement_timeout` cron KOMUTUNUN icine yazilir.
- pg_cron (SQL) `storage.objects`ten SILEMEZ ("Direct deletion from
  storage tables is not allowed"): eski anlik silme isi 22-24 Eylul arasi
  HER SAAT bu hatayla dustu ve fark edilmedi. Dosya silme Storage API
  (Edge Function / istemci) ile yapilir. Yeni cron isi kurunca
  `cron.job_run_details` ile ilk kosumun `succeeded` oldugu OLCULUR.
- `public.spatial_ref_sys` (PostGIS, sahibi supabase_admin) RLS'siz ve
  anon'a yazilabilirdi; RLS/REVOKE bizden YAPILAMAZ. PostgREST pre-request
  `public.istek_kapisi` o yolu 42501 ile kapatiyor (migrasyon
  `20260924100000`, `alter role authenticator set pgrst.db_pre_request`).
  Danisman ve haftalik "rls_disabled_in_public" postasi yine ERROR der -
  RLS bayragina bakiyor, kapiyi gormuyor; bilinen durum. Istek kapisi HER
  istekte kosar: degistirilirse test:sema kosulur. Geri alma: `alter role
  authenticator reset pgrst.db_pre_request; notify pgrst, 'reload config'`.
- Kovaya yukleme `image/jpeg` gondermeli (text/plain 415). Sizmis
  parola korumasi admin API'de de gecerli (test hesabina `test1234`
  verilemez). `test0@slooin.test` GERCEK hesap (byorcun) - test
  hesaplarinda gercek veri varsayilir. `.test` adreslerine posta gitmez.

Istemci (React Native / Expo)
- Bir Modal'dan ikinci Modal/push/Share acilacaksa ilki ONCE kapanir;
  `SecimPenceresi` bunu kendisi yapar (eylem kapanistan
  `EYLEM_GECIKMESI_MS` sonra). Onay/secim kapanisini `waitFor` ile olc.
- Ekrani orten katman hicbir zaman yalnizca bir sozun cozulmesine
  baglanmaz (PaylasimKalkani kilitlenmisti).
- PanResponder islevleri duz `View`/`Animated.View`a; `Pressable`
  kendi responder'lariyla onlari ezer (jest gormez).
- OTA ile giden kodda yeni native modul: once expo-modules-core
  `requireOptionalNativeModule('<Ad>')` (null = yok, atmaz). try/catch
  require COKMEYI onlemez; `globalThis.expo.modules`e elle bakmak da
  YANLIS (tembel kurulur, modul varken "yok" der). SDK 57
  `expo-media-library` klasik API `expo-media-library/legacy` altinda
  (`lib/galeri.ts`). Yuzdeli left/top + yuzdeli translate telefonda risk.
- react-native-maps: `anchor` yalnizca Android, `centerOffset` yalnizca
  iOS; Apple ozel isaretciyi ortalar. iOS'ta isaretci cocugu kabsiz
  hap. Native'e ozgu gorseli goremiyorum: once kutuphane kaynagini oku,
  tek gerekceli cozum yayinla, "dogrular misin" de.
- `alignItems:'center'` icinde yuzde genislik sifirlanir; yatay
  FlatList sayfa yuksekligi `onLayout` ile acik verilir.
- Kok duzen `Slot`: sekme degisince ekran agactan kalkar - kalici
  secim rota parametresine (`useSekmeParametresi`) ya da onbellege.
- "Once eldekini goster" onbellegi: veriyi degistiren HER yol onu
  dusurur (serit bayat kalmisti); bir kova icin imza onbellegi varsa
  o kovayi kullanan HER yol ona baglanir. Kimlik okumasi
  `lib/kimlik.ts` (getSession); guvenlik-kritik uc yer (hesap-guvenlik,
  hesap, veri-disa-aktar) bilerek getUser.
- Sozluk anahtarini degistirmeden once `grep -rn "blok.anahtar" src`
  (liste karti, panel ve cubuk ayni anahtari paylasabilir).
  `ceviri-tamlik` kullanilan anahtarin VARLIGINI olcmez. `t()`
  parametresiz cagrida yer tutucu "[missing ...]" olur.
- ANA SEKMELER ARASI SAG/SOL KAYDIRMA (2026-09-24): `SekmeKaydirma` kok
  duzende Slot'u sarar; yalnizca `/`, `/bildirimler`, `/mekanlar`,
  `/mesajlar`, `/profil`. Bu ekranlara YENI YATAY kaydirilan oge (yatay
  liste, harita, carousel) eklenirse kokune `{...yatayAlan}`
  (`lib/yatay-kilit.ts`) konur, yoksa sekme de degisir. RNGH Swipeable
  kendi 10 px esigiyle kazanir; saga hareketi olmayan satirlarda
  `dragOffsetFromLeftEdge` buyuk verilir (mesajlar).
- Girdili kaydirmasiz ekran = `FormSayfasi` (`flexGrow:1`). Kendi ust
  payini koyan ekran `_layout.tsx` `kendiUstPayiniKoyar` listesinde.
  Kisa ekran esigi `useWindowDimensions().height < 720`.
- Animasyon: RN `Animated` + native driver, transform/opacity;
  Reanimated YOK (jest kurulumu yok). Hareket sozlugu
  `src/tasarim/hareket.ts`. Sarmal bilesende oynat karari mount'ta
  `useRef` (yoksa cocuk yeniden mount).
- Native paketin API'sini cagiran sarmalayicida (lib/kamera, lib/galeri)
  en az bir test paketin GERCEK disa aktarim seklini dogrulasin; ekran
  testleri sarmalayiciyi taklit ettigi icin yanlis isim gorunmez.
- Sessizce yutulan hata ozelligi "calisiyor" gosterir; `.catch(()=>{})`
  yazarken dikkat. Sunucudan gelen alani istemcide ayristiran yer en
  az bir testte GERCEK sunucu ciktisiyla (geography = hex EWKB).

Test
- Modul duzeyi onbellek testler arasi sizar: `jest.setup.js` dusuruyor;
  yeni onbellek eklenirse oraya da. AsyncStorage `beforeEach/afterEach
  clear`. Tam mock'lanan modulde sabitler `requireActual` ile.
- Ayni testte unmount + yeniden render RNTL `screen`ini bozar; iki yonu
  ayri olc. Her `fireEvent` await edilir. RNTL 14'te `UNSAFE_*` yok;
  sira icin `toJSON`; `getByGestureTestId` yalnizca yeni Gesture API.
  `_layout` testinde AltGezinme mock'u dosyada ezilir.
- tsx dosyasini Bash heredoc'la yazma (kiriliyor) - Write araci.
  Python ile sozluk duzenlerken sonucu `sed -n` ile oku.

## Ortam tuzaklari

- **Yayin:** `eas deploy --prod` DERLEMEZ, `dist`i yukler -> her zaman
  `npm run yayinla`. Cloudflare `index.html`'i ~3-4 dk onbellekte
  tutar; yeniden yayinlamak hizlandirmaz. Dogrulama ICERIKLE: canli
  pakette yeni metni/testID'yi grep et (paket adi karsilastirmasi
  `eas update` dist'i yeniden yazdigi icin yaniltir).
  `eas update --non-interactive` icin `--environment production` sart.
  `eas build:view` `--non-interactive` kabul etmez.
- `mobil/.expo` SILINMEZ (router tip dosyasi); yeni rota sonrasi tsc
  yolu reddederse `npx expo start --web --port 8123` ~80 sn, kapat.
- **EAS arsivi:** kok `.easignore` var; varsa `.gitignore` okunmaz ->
  sirlar (`mobil/.env`, `mobil/gizli/`) `.easignore`da da yazili
  olmali; desenler koke sabit (`/tasarim/`). `build:inspect -s
  pre-build` Windows'ta calismaz. Derleme gunlugu: EAS GraphQL
  `builds.byId.logFiles` + `curl --compressed`.
- iOS entitlement/capability eklenince provisioning profile eskir;
  EAS'in Apple oturumu dusmusse ASC API anahtari (T2DU3DFMW4, EAS'ten
  GraphQL ile) + `POST /v1/bundleIdCapabilities`.
- **Play Console tarayicida:** sekme GORUNUR olmali (arka planda dialog
  cizilmez, yukleme islenmez). Buyuk AAB: yerel CORS sunucusu
  (127.0.0.1:8123) + `fetch -> File -> DataTransfer`. Artik
  `eas submit` ile gerek yok.
- **Tarayici:** kullanicinin gercek Chrome'u `opencli browser`
  (`export PATH=$PATH:$APPDATA/npm`; `opencli doctor`, gerekirse
  `opencli daemon restart`); arka planda da calisir. claude-in-chrome
  de var ama Cloudflare/Supabase panelleri gizli sekmede acilmaz.
  Hangi profilde hangi hesap acik VARSAYMA, sayfadan oku. Chrome
  otomatik doldurma form alanlarina parola/e-posta yazabilir.
  Supabase paneli: sablon `auth/templates/<slug>` (monaco
  `getModels()[0].setValue`), saglayici `auth/providers`.
- Supabase Management API token'i (`sbp_`) `mobil/.env`de; sohbete
  yapistirilmaz. Teshis yeri `auth_logs` (MCP `query_logs`).
- Bulut oturumunda (claude.ai/code) supabase.co ag politikasiyla
  kapali, EAS girisi yok - yayin yerelden.
- **claude-mem:** worker port 37777; nobetci
  `.claude/hooks/claude-mem-nobetci.ps1` oksuz chroma'yi temizler.
  Gozlemci OmniRoute -> Gemini 3.6 Flash (ucretsiz proje
  `slooin-ucretsiz`; `model: auto` KULLANMA). "allowance exhausted"
  uyarisi kendini besleyen kilit olabilir: `observations` max tarihi
  `user_prompts`inkinin gerisindeyse kilittir; worker'i restart etme.
  `installed_plugins.json` bozulabilir; `claude plugin list` ile kontrol.
  Kullanici `settings.json`da `claude-mem@thedotmack: false` worker'i
  sessizce kapatir.
- Eklenti kontrolu `claude plugin list` (settings.json niyeti gosterir).
  Yeni eklenti/beceri/hook/MCP KULLANICI kapsamina.
- Hook'lara `|| true` eklenmez (hata yutan hook sessizce bozulur).
- PowerShell 5.1: native exe'de `2>&1` exit kodunu bozar; `&&` yok.

## Hesaplar ve kimlikler (sir degil)

- GitHub `ozdmrorcn16/cloud` + ayna `ozdmrorcn16/slooin-projesi`.
- Supabase proje `swpiibyuoffykbmirvgq` (Pro). Google Cloud proje
  `slooin` (slooinapp@gmail.com, faturali - Maps) ve `slooin-ucretsiz`
  (Gemini). Play Console gelistirici 8670756961503280599, app
  4975519482711386603, paket `com.slooin.app`. Apple Team 79QNZVGJC7,
  Services ID `com.slooin.app.web`, Sign in with Apple key 4T394Q83H5
  (.p8 `mobil/gizli/`, yedeklenmeli), ASC API key T2DU3DFMW4.
- Cloudflare (slooinapp): Pages `slooin` (dal
  `claude/plan2-moderasyon-paneli`, kok `site`), Worker `slooin-panel`.
  Resend (`noreply@slooin.com`, SMTP kullanici adi `resend`),
  `destek@slooin.com` -> slooinapp@gmail.com. OTP 10 dk, posta konusu
  `Slooin kodun: {{ .Token }}`.
- EAS hesabi byorcun; Wrangler slooinapp; gh ozdmrorcn16.
- Degerler (anahtarlar) `mobil/.env` ve EAS ortamlarinda; buraya yazilmaz.

## Araclar

Kullanici kapsaminda: superpowers, frontend-design, code-review,
security-guidance, claude-mem eklentileri; `~/.claude/skills/` altinda
ui-ux-pro-max (paleti Slooin jetonlarina TABI), design/brand/
banner-design/design-system/slides, ek-* (Emil Kowalski animasyon),
gstack (`gstack-` onekli), agent-reach, no-ai-slop. Projede
`slooin-tasarim`. MCP: scrapling (`mcp__scrapling__*`), claude.ai
baglayicilari (Supabase vb.; n8n 404). Yerel: OmniRoute
(127.0.0.1:20128, Windows acilisinda kalkar), ScrapeGraphAI
(`araclar/scrapegraph-ornek.py`, `gemini/gemini-3.6-flash`).
Ayrintilar ve kurulum dersleri arsivde ("AGENT REACH", "SCRAPLING",
"OMNIROUTE", "GEMINI" basliklari).
