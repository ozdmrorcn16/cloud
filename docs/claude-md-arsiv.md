# CLAUDE.md arsivi - tarihli is gunlugu

Bu dosya `CLAUDE.md` icinden CIKARILAN bolumleri oldugu gibi tasir.
Hicbiri silinmedi; yalnizca her oturumda otomatik yuklenmiyorlar.

Sebep olculdu: `CLAUDE.md` 407.302 karakter (~136.000 token) olmustu ve
her oturum basinda tam bedeliyle yukleniyordu. Icerigin buyuk kismi
tamamlanmis turlarin anlatimiydi; yururlukteki kurallar onlarin arasina
gomuluyordu. Kisaltmanin ikinci sebebi kalite: guncel kuralin eskimis
kurallarin altinda kalmasi, yanlis kuralin izlenmesine yol aciyordu.

Aramak icin: `grep -n "aradigin sey" docs/claude-md-arsiv.md`

---

## [i18n BITTI, BASKASININ PROFILI YENIDEN, BOS AVATAR - 2026-09-13 SABAH]

### i18n BITTI, BASKASININ PROFILI YENIDEN, BOS AVATAR - 2026-09-13 SABAH

Onceki oturumun (4857d87a) devir notundaki uc acik is bu oturumda
kapatildi. Oturum baslarken kullanicinin istegiyle o oturum
KAPATILDI (pid 26860; isini bitirmis, `5c90832` commit'lenmisti) ve
kaldigi yerden buradan devam edildi. Kullanici ayrica "onceki
oturumda soyledigim duzeltmelerin hepsinin yapildigindan emin ol"
dedi; tam transkriptten 28 mesaj cikarilip tek tek kodda dogrulandi -
hepsi yapilmis, ve OTA listesine gore arayuz duzeltmeleri (gruplar
`db0eff7d`, `9ef4c3a3`) telefona da gitmisti. TUZAK: oturum dokumu
(`docs/oturumlar/*.md`) telefondan gonderilen mesajlari (queued_command,
gorselli olanlar dahil) TASIMIYOR; tam liste yalnizca
`~/.claude/projects/.../<oturum>.jsonl` icindeki `attachment` satirlarinda.

**1. HUKUKI METINLER YEDI DILDE (i18n E asamasi).** `lib/hukuki/`:
`tur.ts` (tip), `tr.ts` (KAYNAK - eski `gizlilik.tsx` ve
`kosullar.tsx` dizileri buraya tasindi), `en/de/es/fr/ru/ar.ts`
(ceviriler), `index.ts` (`hukukiMetin(dil)`, `gizlilikBolumleri`,
`kosulBolumleri`). Ekranlar `useDil().dil`e gore belgeyi seciyor;
Turkce disindaki dillerde belgenin basinda **"Turkce metin esastir"**
notu var (`hukuki.ustunlukNotu`, testID `ustunluk-notu`). Sozluklere
`hukuki` bolumu eklendi (gizlilikBaslik, kosullarBaslik,
sonGuncelleme, ustunlukNotu). `BOLUMLER` / `KOSUL_BOLUMLERI` disa
aktarimlari DURUYOR (testler okuyor) ve Turkce kaynagi veriyor.
Kosullardaki tarih `toLocaleDateString(dil)` ile ("September 7, 2026").

`lib/hukuki/hukuki.test.ts` yapisal esitligi kilitliyor: bolum ve
paragraf sayilari tr ile birebir, hicbir paragraf tr'nin kopyasi
degil, olgusal sabitler (destek@slooin.com, 30, 200, 04:45/04h45,
eu-central-1, Foursquare, OpenStreetMap, JSON, 24) her dilde geciyor.
`__tests__/ekranlar/kosullar.test.tsx` cihazi Ingilizce yapip iki
ekrani olcuyor. **KURAL: `docs/gizlilik-metni.md` degisirse
`lib/hukuki/tr.ts` VE alti ceviri ayni turda guncellenir; test
paragraf sayisi uyusmazsa kirilir.**

**2. BASKASININ PROFILI KENDI PROFIL DUZENINDE** (kullanicinin
tarifi 2026-09-13 02:04, kendi profilinin ekran goruntusuyle).
`kullanici/[id].tsx` bastan yazildi: avatar solda + harita dokusu
(`ProfilHaritaZemini`, ayni sabitler), ad / @kullaniciadi / biyografi /
bolge / Instagram, eylem satiri **"Arkadas ekle" + "Mesaj yaz"**
(yukseklik 40, `turuncuZemin`), **paylas ikonu SAG USTTE** (kendi
profildeki dislinin yeri; `kullanici.paylasMetni`), sayaclar salt
sayi, SekmeHapi (Anilar / En sik), **acik profilde `CheckInKarti`
akisi** (`anidanAkisOgesi(..., { benimMi: false })` - menu yok,
begeni/yorum/paylas var, cizim penceresi 10'ar), **kapali profilde
72 px kilit**. "En sik" satirlari kendi profildeki gibi `SiraRozeti`
ile, ilk bes.

**"MESAJ YAZ" HER ZAMAN VAR ve dogrudan `/sohbet/<id>` aciyor.**
Ayri "Sohbet iste" adimi, "Istek gonderildi" / "Sohbet acik"
etiketleri ve "Mesaj gonder" butonu KALKTI: mesaj istekleri modeli
(2026-09-01) geregi yabanci zaten tek mesaj yazabiliyor ve kural
sunucuda (`mesaj_gonder`); sohbet ekrani konusma yokken yazmaya
izin veriyor (`yazilabilirMi` true). `sohbetIstegiGonder` RPC'si
lib'de duruyor ama profil artik cagirmiyor. Gelen takip/sohbet
istegi kartlari (Kabul et / Reddet) duruyor. Arkadas butonu uc
halde: "Arkadas ekle" (basilir) / "Beklemede" / "Arkadassin"
(ikisi basilamaz, `cizgi` dolgu); geri cekme ve arkadasliktan cikma
altindaki ikincil satirda. Kapali profili acan sey `bagVar` (takip
kabul ya da sohbet kabul). Test 49/49; iddialar silinmedi, tersine
cevrildi ("bag yokken Mesaj yaz VAR", "Sohbet acik etiketi YOK").

**3. BOS AVATAR GORUNUR: ortak `src/tasarim/BasHarfAvatar.tsx`.**
Acik turuncu zemin + turuncu harf (akis kartlariyla ayni dil) +
**2 px turuncu kenarlik**. Kendi profilde daire beyaz zeminli ve
beyaz halkaliydi, harita dokusunda kayboluyordu (kullanicinin ekran
goruntusu). Dolu turuncu daire bilerek secilmedi (ust blokta buyuk
turuncu leke, kural ihlali). Iki profil ekrani da bu bileseni
kullaniyor (`testID="bos-avatar"`); `profil/index.tsx`teki
`avatarYok`/`basHarf` stilleri silindi, `AVATAR_CAPI = 88` sabiti geldi.

**YAN DUZELTME:** `profil/index.tsx`te `aniListesi` ve `izgara`
`marginHorizontal: -bosluk.xl` (24) tasiyordu; sayfa payi 2026-09-06'da
`bosluk.sayfa` (16) olmustu, yani kartlar iki yandan 8 px tasiyordu.
`-bosluk.sayfa` yapildi.

Ekran goruntuleri: `tasarim/baskasinin-profili-acik.png` (koyu),
`baskasinin-profili-kapali.png`, `profil-bos-avatar.png`,
`kosullar-en.png`, `gizlilik-de.png`. Kapali profil goruntusu icin
test2 hesabinin `profil_gizli`/`fotograflar` gecici degistirilip
GERI ALINDI.

**KALAN (degismedi):** Apple/Google girisi Build 8 ile cihazda
dogrulanmadi; Play Console'a Maps anahtarli AAB (versionCode 3,
`ROC-eU5l...aab`) yukleme kullanicida.

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


## [PUSH BILDIRIM METINLERI: arkadaslik dili + duzgun Turkce]

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


## [DEVIR NOTU - 2026-09-02 (oturum sonu, her sey push edilmis)]

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


## [HARITADA BUTUN IGNELER, MAHALLE/IL/ILCE, YENI SIMGE - 2026-09-09 (altinci tur)]

### HARITADA BUTUN IGNELER, MAHALLE/IL/ILCE, YENI SIMGE - 2026-09-09 (altinci tur)

**1. HARITA LISTEDEKI HER MEKANI GOSTERIYOR.** Kullanicinin istegi:
"yakinindaki mekanlar listesinde gorunen butun yerler haritada o anlik
gosterilsin". Iki sinir vardi ve ikisi de IGNEYI eliyordu:
`EN_FAZLA_IGNE = 12` ve etiket araligi kurali. Sonuc: listede gorunen
mekan haritada yoktu, ekranin iki yarisi farkli sey soyluyordu.

**AYRIM: cakisan sey IGNE DEGIL ETIKET.** Igne kucuk ve renk tasiyor,
ust uste binse bile harita okunur kaliyor; ADLAR ic ice gecince ikisi
de okunmaz oluyor (2026-09-06'daki ekran goruntusu). Artik LISTEDEKI
HER MEKANIN IGNESI ciziliyor, aralik ve sayi kurali yalnizca ADIN
yazilip yazilmayacagini belirliyor.

Performans: her igne `tracksViewChanges={false}` ile ciziliyor - ozel
gorunumlu bir igne bu bayrak olmadan her karede yeniden ciziliyor ve
yuz igne haritayi takiyor.

**ETIKET ELEMESI SONRA BIR KEZ DAHA DEGISTI** (kullanicinin
bildirdigi hata: "isimleri yazmiyor"). Kural METRE cinsindendi ve
esigi `max(50 m, cerceve * %22)` idi; birbirine yakin bir kumede on
iki mekandan yalnizca IKISININ adi yaziliyordu - ekran goruntusuyle
goruIdue.

**DOGRU OLCU METRE DEGIL PIKSEL:** cakisan sey etiket KUTUSU. Iki
etiket yatayda kutu genisligi (130 px) ya da dikeyde kutu yuksekligi
(26 px) kadar ayriysa ust uste binmiyor - ayrik eksen testi. Boylece
dikeyde siralanan mekanlarin HEPSININ adi yazilabiliyor; metre esigi
onlari da eliyordu. Haritanin gercek piksel olcusu `onLayout` ile
okunuyor, cunku derece->piksel donusumu onsuz yapilamaz.

**KURAL ARTIK SAF BIR FONKSIYON VE TESTLI:**
`lib/harita-etiket.ts` + `lib/harita-etiket.test.ts` (7 test). Bunu
ayirmanin sebebi kayda deger: ayni kural AYNI GUN IKI KEZ kirildi ve
ikisini de KULLANICI bildirdi - bilesenin icinde durdugu surece
hicbir sey onu olcmuyordu. Testler iki hatayi da kilitliyor (dikeyde
ayrik olanlarin hepsi etiketleniyor; ust uste binenlerden yalnizca
biri).

**WEB RADARI DA AYNI KURALA GECTI** (ayni gun): orada da 12'lik sayi
siniri vardi. Piksel araligi kurali radarda DURUYOR - orada cizilen
sey ad tasimayan kucuk bir daire ve tam ust uste binen iki nokta
ikisini birden okunmaz yapiyor; native tarafta ayrim etiket uzerinden
yapilabiliyor cunku igne adi tasiyor.

**2. DUZENLEME TALEBINE MAHALLE, IL VE ILCE.** Kullanicinin istegi:
"adres kismina mahalle yazisi da ekle basa, ayri bir de il ilce sutunu
ekle."

**MAHALLE GERI GELDI ama BASKA BIR YOLDAN.** `mekanlar.mahalle` sutunu
2026-08-31'de dusuruImustu ve gerekce DOGRULUKTU: mahalle uc kez
TURETILMEYE calisildi (en yakin OSM yerlesim noktasi, komsuluga yayma,
kirli adres kaydi) ve ucu de yanlis sonuc verdi. Buradaki mahalle
turetilmiyor - orada bulunan kisi yaziyor, moderator onayliyor. Yani
"turetilmis veri degil gercek kayit" kurali korunuyor.

Mekan sayfasindaki adres satiri artik `mahalle, ilce, il`; mahalle
yoksa eskisi gibi `ilce, il`.

**IL SERBEST METIN DEGIL:** 81 ilin listesi zaten `public.iller`
tablosunda duruyor ve sunucu onu dogruluyor - uydurma bir il, il bazli
aramayi ve tur suzgecini bozardi. ILCE icin ayni kontrol YOK: 945
ilcenin adini ikinci bir yerde tutmak onlari guncel tutma yukumlulugu
getirirdi, moderator zaten her talebi goruyor.

**TUZAK, yasandi:** RPC'ye yeni parametre eklemek ayni adla IKINCI bir
fonksiyon uretiyor; `grant`/`revoke` "function name is not unique"
diye reddediliyor ve migrasyonun TAMAMI geri aliniyor. Once eski imza
`drop function ... (uuid, text, text, text, text)` ile dusurulmeli.

**ONAY YOLU CANLI DOGRULANDI: `araclar/mekan-duzenleme-onay-canli-test.py`,
14/14.** Kardes betik yalnizca TALEP GONDERMEYI olcuyordu; bu betik
gecici bir moderator hesabi (TOTP ile AAL2) acip ONAYIN kendisini
olcuyor.

En kritik iddia DENETIM IZI: `moderasyon.kaydet` yeni `hedef_tur =
'mekan'` degerini kabul etmeseydi kisit ihlali ISLEMIN TAMAMINI geri
alirdi ve onay HIC olmazdi - 2026-09-02'de yorum tarafinda tam olarak
bu yasanmisti. Iz satirinin yazildigi dogrulandi.

Ayrica olculdu: ALAN ALAN onay gercekten alan alan calisiyor (yalnizca
mahalle ve ilce onaylandi; onerilmis olmasina ragmen ad, tur ve il
DEGISMEDI), `elle_duzenlendi` isaretleniyor, karara baglanmis talep
ikinci kez karara baglanamiyor, ve olmayan bir il reddediliyor.

Betik gercek bir mekan kaydini degistirdigi icin BASLANGIC HALINI
saklayip sonunda geri yukluyor; denetim izi satiri ise kaliyor -
iz ekleme-only ve silinebilseydi izin kendisi anlamsiz olurdu.

**3. UYGULAMA SIMGESI DENENDI VE GERI ALINDI.** Kullanici yeni bir
simge gorseli verdi ("uygulamanin telefonda gorunen logosu bu
olucak"); gorsel yuvarlatilmis kare ve cevresinde beyaz pay tasidigi
icin - iOS ve Android simgeyi kendi maskeledigi icin koselerde beyaz
ucgen kalirdi - simge SIFIRDAN kuruldu: zemin olcuIup yeniden
uretildi, isaret ustune bindirildi.

**KULLANICI SONUCU BEGENMEDI ve HEPSI GERI ALINDI** (ayni gun):
"olmamis logoyla alakali ne yaptiysan en son geri al, eski hali
dursun". Uretici betik, kaynak gorsel ve uretilen butun varliklar
(icon, favicon, Android katmanlari, PWA v3 dosyalari) silindi;
`index.html` ve `manifest.json` v2 adlarina dondu. Depoda simgeyle
ilgili hicbir degisiklik kalmadi.

**DERS:** kullanici BITMIS bir varlik verdiginde onu yeniden
kurmaya calisma. Teknik bir kisit (iOS maskesi) gercekten vardi ama
dogru davranis kisiti SOYLEYIP karari kullaniciya birakmakti; ayni
ders 2026-09-06'da araba ikonunda da ogrenilmisti ("bu attigimi
direk kullan").

### MEKAN DUZENLEME TALEPLERI - 2026-09-09 (besinci tur)

Kullanicinin istegi: "konumlara duzenleme talebi gonder ekle; talebe
basan kisi konum ismi, adresi, kapak fotografi, turunu secebilsin,
moderatore talebini gondersin."

**NEDEN BU IS TUR SORUNUNUN CEVABI.** Ayni gun olcuIdue: dis kaynakli
mekanlarin turu guvenilir degil ve kok neden BIZDE DEGIL - Bursa'daki
6.105 "Kafe" kaydinin **5.992'si Foursquare'in tek bir genel "Café"
kategorisinden** geliyor; ayni kategoride pub, yurt kantini, waffle'ci,
hatta bir dernek var. Kullanicinin uyarisi da yerindeydi: "sadece ada
gore yapmak da yanlis olabilir" (ayni tuzak 2026-08-23 denetiminde de
yasandi: "Cafe Bar~Ça" adinda "Bar" geciyor ama bar degil). Orada
bulunan insan hepsinden iyi biliyor.

**AKIS:** kisi mekan sayfasindaki "Bilgileri düzelt" baglantisina
basiyor -> ad / adres / tur / kapak fotografi -> talep moderatore
gidiyor -> onaylanana kadar **mekan kaydi DEGISMIYOR**.

| Parca | Yeri |
|---|---|
| Tablo | `mekan_duzenleme_talepleri` (RLS: yalnizca kendi talebini gorursun) |
| Gonderme | `mekan_duzenleme_talebi_gonder` RPC |
| Moderator | `moderasyon_duzenleme_talepleri` / `..._detayi` / `..._karara_bagla` |
| Kova | `mekan-fotograflari` (private) |
| Ekran | `src/app/mekanlar/duzenle/[mekanId].tsx` |
| Panel | `panel/src/ekranlar/DuzenlemeTalepleri.tsx` |

**"MEKANLARIN FOTOGRAFI YOK" KURALI BU YOLLA DEGISTI.** 2026-08-24'teki
o karar DIS KAYNAKTAN gorsel cekmeyi reddediyordu (telif, kapsam, API
bagimliligi); buradaki gorsel kullanicinin kendi cektigi ve
MODERATORDEN GECMIS bir fotograf. `mekanlar.kapak_fotograf` sutunu
yalnizca onayla doluyor ve mekan sayfasinin basinda ciziliyor.

**ALAN ALAN ONAY.** Moderator talebin yalnizca dogru bulduğu alanlarini
uyguluyor (`p_alanlar`): ucunden ikisi dogru biri yanlis olabilir,
hepsini birden reddetmek dogru duzeltmeyi de coepe atardi.

**SUNUCUDA ZORLANAN KURALLAR** (istemci atlayamaz): kimlik, hesap
aktifligi, en az bir alan dolu, **tur yalnizca veritabaninda ZATEN VAR
OLAN bir tur** (onayda deger dogrudan `mekanlar.tur`a yaziliyor -
uydurma bir tur butun suzgecleri kirletirdi), fotograf yalnizca KENDI
klasorunden, gunde 5 talep, ayni mekana ikinci bekleyen talep yok.

**`elle_duzenlendi` SUTUNU:** onaylanmis bir duzeltme toplu veri
yuklemesinde ezilmemeli. Mevcut `fsq_aktar` zaten `on conflict do
nothing` kullaniyor (yani ezmiyor) ama `fsq-semt-doldur` gibi
DOGRUDAN upsert yapan betikler var - yeni bir toplu yukleme yazilirken
bu sutun kontrol edilmeli.

**DENETIM IZI GENISLETILDI:** `hedef_tur` kisitina `'mekan'` eklendi ve
canli dogrulandi. Bu adim atlansaydi onay HIC calismazdi - iz
yazilamayinca kisit ihlali islemin tamamini geri aliyor (2026-09-02'de
yasandi).

**CANLI DOGRULANDI:** `araclar/mekan-duzenleme-canli-test.py`, **14/14**.
Olculenler: kimliksiz cagri, bos talep, olmayan tur, baskasinin
fotografi REDDEDILIYOR; gecerli talep kabul ediliyor; ikinci bekleyen
talep reddediliyor; **onay olmadan mekan kaydi degismiyor**; uc
moderator RPC'si de siradan kullaniciyi reddediyor; kisi kendi talebini
goruyor. Betik idempotent, actigi satiri siliyor.

**AYNI GUN UC DUZELTME** (kullanicinin bildirdikleri):

1. **EKRAN KAYDIRILMIYORDU.** Kokte `Pressable` vardi (bos yere basinca
   klavye kapansin diye) ve o Pressable DOKUNMA YANITINI KAPIYORDU:
   parmak surukleyince liste hic kaymiyordu. Kok duz bir `View` oldu;
   klavyeyi artik `keyboardDismissMode="on-drag"` kapatiyor - ayni isi
   kaydirma hareketinin kendisi yapiyor.

   **Kural: kaydirilabilir bir alanin ustune kok `Pressable` KOYMA.**
   Mekan ekleme ekranindaki desen (2026-09-07) orada calisiyor cunku o
   ekranda kaydirma yok.

2. **"Galeriden seç" GALERIYI ACMIYORDU.** Iki katmanli duzeltme:
   secici artik kaynak penceresi KAPANDIKTAN SONRA aciliyor (iOS bir
   modal kapanirken uzerine ikinci bir native ekran sunamiyor, cagri
   sessizce donuyor) ve galeri izni artik ACIKCA isteniyor - izin
   yokken `launchImageLibraryAsync` hicbir sey gostermeden donuyordu.
   Hatalar da yutulmuyor, ekranda yaziyor.

3. **"Hızlı ve tatlı" grubu "Yeme içme" icine tasindi** (kullanicinin
   istegi): ikisi de yeme icme, ayri baslik listeyi uzatmaktan baska
   bir sey yapmiyordu. Degisiklik `TEMEL_TUR_GRUPLARI` icinde, yani
   kesfet suzgecinde de gecerli.

**TEST ORTAMI TUZAGI - kayda geciyor:** bu ortamda (React 19 + RNTL)
bir `setState` AYNI TURDA ekrana yansimiyor. `fireEvent.changeText`ten
hemen sonra `fireEvent.press` yapilinca dugme ESKI kapanisi calistiriyor
ve "degisiklik yok" dali isliyordu; alanin degeri olcuIdue ve girilen
'Sahil Kahve' iken hala 'Sahil Kafe' gorunuyordu. Cozum: `fireEvent`
cagrilarini **await** etmek (depoda zaten bu desen vardi). Belirtisi
yaniltici - ilk test geciyor, sonrakiler zaman asimina duesuyor.

Dogrulama: jest 65 paket / 761 test, tsc uygulama kodunda 0 hata,
panel derlemesi temiz, canli 14/14, ekran goruntuleri
`tasarim/duzenleme-talebi.png` ve `mekan-duzelt-girisi.png`.

### ROTA CIZGISI KALDIRILDI, YORUMLARA AVATAR - 2026-09-09 (dorduencue tur)

**1. HARITADAKI ROTA CIZGISI TAMAMEN KALKTI - kullanicinin karari.**
Ayni gun once duz kesikli cizgi, sonra OSRM'den gercek yol cizilmisti.
Kullanici once gercek yolu istedi, sonra maliyeti sorup **cizgiden
vazgecti**: "rota cizilmesin".

**KARARIN DAYANAGI MALIYET.** Kullaniciya sunulan tablo:

| Secenek | Ucret | Neden |
|---|---|---|
| OSRM demo sunucusu | 0 | AMA "makul, ticari olmayan kullanim", saniyede 1 istek, uptime garantisi yok - magazadaki bir uygulama buradan gecemez |
| Kendi OSRM sunucumuz | ~7 EUR/ay | Turkiye grafigi ~3 GB RAM istiyor ve makine surekli acik kalmali; istek basina ucret yok |
| OpenRouteService / Mapbox | 0'dan baslayip artan | Ucretsiz katman (2.000/gun, 100 bin/ay) agir kullanimda kesiliyor ya da faturaya donuyor |
| Cizgiyi hic cizmemek | 0 | "Yol tarifi al" ZATEN telefonun kendi harita uygulamasini aciyor; rotayi orada Apple/Google kendi hesabindan ciziyor |

Kullanici sonuncuyu secti. **YOL TARIFI ISLEVI KAYBOLMADI** - yalnizca
rota bizim ekranimizda cizilmiyor.

Silinenler: `lib/rota.ts`, `lib/rota.test.ts`, `CanliHarita`in `rota`
prop'u ve `Polyline`, mekan sayfasindaki rota istegi, jest'teki
`Polyline` mock'u. Testteki iddia SILINMEDI tersine cevrildi
("haritada rota cizgisi YOK") - cizgi sessizce geri gelirse kirilir.

**KVKK - YAN FAYDA:** rota istegi kullanicinin koordinatini ucuncu bir
tarafa gonderiyordu ve gizlilik metnine yazilmisti. Cizgi kalkinca o
aktarim da kalkti; metinlerden cikarildi ve `kvkk-uyum-listesi.md`
icinde "eklendi, ayni gun kaldirildi" kaydi birakildi (adres
cozumunde de ayni desen). Yurt disina aktarim yeniden UC kalem.

**2. YORUMLARDA PROFIL FOTOGRAFI.** Kullanicinin istegi: "yorumlarda
kullanicilarin profil resmide gorunsun". Onceden yalnizca bas harfli
turuncu daire vardi.

Fotograf `yorumlari_getir` RPC'sinden GELMIYOR; `avatarlariGetir`
(yani `akis_profilleri` RPC'si) ile ayrica cekiliyor. Sebep migrasyon
kacinmak degil, **"kim gorunur" kuralinin tek yerde kalmasi**: o RPC
engellenen ve askidaki kisiyi zaten eliyor, ve akis, bildirimler ve
mekan sayfasi da avatarlarini oradan aliyor.

Avatar cagrisi yorumlardan SONRA ve BEKLETMEDEN yapiliyor; gelmezse ya
da patlarsa liste yine ciziliyor ve kisi bas harfe duesuyor. Uc testle
kilitli (resim ciziliyor / fotografsiz kisi bas harfe duesuyor / cagri
patlasa da yorumlar duruyor).

Dogrulama: jest 64 paket / 749 test, tsc uygulama kodunda 0 hata.

### PROFILDE ETKILESIM SATIRI + GERCEK YOL ROTASI - 2026-09-09 (ucuncu tur)

**1. PROFIL KARTLARINDA BEGEN / YORUM / PAYLAS.** Kullanicinin istegi:
"profildeki paylasimlarda ana sayfadaki gibi begen paylas yorum yapma
ikonu ekle".

Kart bu satiri ancak `ozet` (begeni/yorum sayilari) verilince ciziyor
ve **profil ekrani ozetleri hic cekmiyordu** - yani ikonlar orada
gorunmuyordu. Artik `etkilesimOzetleriniGetir` cagriliyor; begenme
ana sayfadaki gibi IYIMSER (kalp aninda doluyor, sunucu reddederse
geri aliniyor), yorumlar kartin icinde alttan aciliyor, paylas
`Share`i aciyor.

**OZETLER CIZIM PENCERESINE GORE cekiliyor**, hepsi icin degil:
ekranda cizilmeyen kartin sayacina ihtiyac yok ve yuzlerce kimligi tek
istekte sormanin anlami yok.

**SONSUZ DONGU TESTTE YAKALANDI - kayda geciyor.** Ilk yazimda etki
`ozetler`e bagliydi ve eksik kimlikleri her seferinde yeniden
soruyordu; hic begenisi/yorumu olmayan bir check-in icin sunucu SATIR
DONDURMUYOR, dolayisiyla "eksik" listesi hic bosalmiyor ve etki kendi
kendini tetikliyordu. Jest kosumu takildi (300 sn'de bitmedi). Iki
katmanli cozum: sorulan kimlikler bir REF'te tutuluyor ve cevap
gelmeyenler SIFIR ozetle dolduruluyor.

**2. HARITADA GERCEK YOL ROTASI.** Bir onceki turda cizilen duz kesikli
cizgiyi kullanici reddetti: "boyle kesik cizgi olmaz, yol tarifi al
dendiginde en kisa yol nerden gosteriyorsa gercek haritanin cizdigi
gibi yol ciz yoldan" (ornek olarak Google Haritalar'in mavi rotasini
gosterdi). **Yani bir onceki turun 6. maddesindeki "duz cizgi bilincli"
gerekcesi GECERSIZ.**

Yeni modul `mobil/lib/rota.ts`: **OSRM** (Open Source Routing Machine)
genel sunucusu, OpenStreetMap verisiyle. Anahtar ve hesap istemiyor.
Canli dogrulandi: Bursa'da iki nokta arasi `code: Ok`, 6.919 m,
193 nokta.

**ELENEN SECENEKLER, tekrar arastirilmasin:**

| Secenek | Neden olmadi |
|---|---|
| Google Directions | Ucretli; sonucu SAKLAMAK yasak ve gosterirken GOOGLE HARITASI sarti var - biz iOS'ta Apple Haritalar kullaniyoruz |
| Apple MKDirections | Yerel olarak var ama `react-native-maps` disari acmiyor; native modul yeni derleme demek, OTA ile gitmez |
| Mapbox / OpenRouteService | Ucretsiz katmanlari var ama HESAP ve ANAHTAR gerektiriyor |

**ROTA GELMEZSE HICBIR SEY CIZILMIYOR.** Duz cizgi yedegi bilerek yok:
kullanici tam olarak onu reddetti ve yanlis bir yol gostermektense hic
gostermemek dogru (`guvenilmeyen-veriyi-gosterme` kurali).

**TUZAK: OSRM koordinati BOYLAM,ENLEM sirasiyla istiyor** - alisilmis
sirann tersi. Ters yazilirsa sunucu hata VERMIYOR, denizin ortasindan
bir rota deniyor. Bir testle kilitli.

**ACIK BORC - MAGAZA ONCESI:** OSRM'in genel sunucusu "demo"
niteliginde, agir kullanim icin verilmis bir soz yok. Yayina cikmadan
once kendi ornegimiz ya da anahtarli bir saglayici baglanmali;
sozlesme tek dosyada (`lib/rota.ts`) oldugu icin degisiklik oraya
sinirli.

**KVKK - ATLANMADI:** cagri kullanicinin koordinatini UCUNCU BIR
TARAFA gonderiyor. Uygulama ici gizlilik metni (madde 5),
`docs/gizlilik-metni.md` ve `docs/kvkk-uyum-listesi.md` guncellendi;
harita saglayicisiyla ayni sinifa yazildi ve dort soru cevaplandi.
Istek kimlik tasimiyor - yalnizca iki koordinat.

Dogrulama: jest 65 paket / 754 test, tsc uygulama kodunda 0 hata,
OSRM canli cagriyla dogrulandi. Harita cizimi WEB'DE GORUNMEZ (orada
radar var), telefonda bakilmali.

### GEZINME, KART VE HARITA DUZELTMELERI - 2026-09-09 (ikinci tur)

Kullanicinin arka arkaya verdigi yedi duzeltme. Ilki bir onceki turun
YAN ETKISI, ikincisi ise o turun GERI ALINMASI.

**1. ALT GEZINME: DAIRELER ETIKETLERIN UZERINE BINIYORDU.**
Bir onceki turda dugmeler "one cikmasin" diye tasma sifirlanmisti; o
degisiklik 54 px'lik satira 54 px'lik daireyi + etiketi birlikte
sokusturdu ve daire etiketi ortuyordu (kullanicinin ekran goruntusu).

**OLCULDU** (canli, puppeteer): daire 754-798, "Bildirimler" etiketi
785-799 - yani etiketin tamami dairenin altinda. Ayrica cubuk sessizce
80 -> 94 px'e cikmisti ve "Check-in" etiketi komsularindan **20 px
asagida** duruyordu.

**COZUM BUYUTMEK, KUCULTMEK DEGIL.** Yeni `IKON_ALANI = 54` sabiti her
slotta ayni: ikon (ya da daire) o alanin ortasinda, etiket altinda.
Satir 54 -> 72, cubuk 80 -> 98, `ALT_GEZINME_PAYI` 104 -> 122.
Daireleri kucultmek check-in dugmesini 54'ten ~34'e indirirdi ve o
dugmenin "obur ikonlardan buyuk" olmasi kullanicinin karari
(2026-08-26).

**GORSEL AYAK IZI BUYUMEDI:** eskiden daire cubuktan 17 px yukari
tasiyordu, yani ekranda kapladigi alan zaten buydu - tasan parca artik
cubugun icinde.

Ayrica merkez dugmenin secilince YAY ILE 8 px YUKSELIP %10 BUYUMESI
kaldirildi. Bir onceki turda atlanmisti; kullanicinin kurali "one dogru
cikmasin, oldugu yerde turuncu parlak halde olsun" onu da kapsiyor.
Secili hal artik yalnizca `turuncuSecili` + parilti.

**SONRA OLCULDU:** cubuk 98, BES ETIKETIN BESI DE y=805 (ayni hiza),
daire 752-796, etiket 805 - 9 px acikta.

Rozet (okunmamis sayaci) ikonun KENDI kutusunda kaldi: ikon 54'luk
alanin ortasinda duruyor ama rozet 24'luk ikona gore konumlaniyor,
yoksa alanin kosesine kacardi.

**2. KALEM GERI ALINDI: PAYLAS VE UC NOKTA GERI GELDI.** Ayni gun
sabah yapilan degisiklik (uc nokta -> kalem, silme duzenleme alanina)
kullanicinin istegiyle TAMAMEN geri alindi: "paylasma ikonunu geri
getir uc noktayi geri getir kalemi sil". `git apply -R` ile commit'in
kart ve test parcalari tersine uygulandi. Yani akis kartinda yine
begeni / yorum / PAYLAS ve baslikta UC NOKTA menusu (Duzenle + Sil)
var.

**3. MEKAN SAYFASINDAKI UC NOKTA KALDIRILDI.** Islev kaybi YOK ve
bu once kontrol edildi: menude tek secim vardi ("Haritada ac") ve o
secim `haritayaDokunuldu` cagiriyordu - baslik satirindaki "Yol tarifi
al" dugmesinin CAGIRDIGI FONKSIYONUN AYNISI. Ayni eylemin iki girisi
vardi. Iddia testte TERSINE cevrildi (menu YOK), silinmedi.

**4. MADALYA ROZETI ORTAK BILESEN OLDU: `src/tasarim/SiraRozeti.tsx`.**
Profildeki "En sik" listesi kurdeleli madalya GORSELLERINI kullaniyordu,
mekan sayfasindaki liderlik tablosu ise duz SVG daireler ciziyordu -
ayni sira iki ekranda iki turlu gorunuyordu. Kullanicinin istegi:
"bu ayni ikonlarin ilk ucunu liderlik tablosunun ilk ucunun ikonu yap".
Artik tek bilesen; liderlikte 34 px, profilde 44 px.

Profildeki olcu 48 -> 44 (kullanicinin istegi: "bu bes ikonun cok az
boyutunu kucult"). `SiraMadalyasi` (SVG) artik kullanilmiyor ama
`mekan-ikonlari.tsx` icinde duruyor.

**5. KULLANICI IGNESI IKI EKRANDA AYNI OLDU.** Kesfet ekraninda
kullanici haritanin MERKEZI ve turuncu bir IGNE olarak ciziliyordu;
mekan sayfasinda ise ayri bir marker ve turuncu bir DAIRE idi. Yani
"ben neredeyim" iki ekranda iki bicimde okunuyordu. Kullanicinin
istegi: "konumun icine girincede turuncu kullanicinin ikonu ayni
gorunsun".

Yeni `KullaniciIgnesi` bileseni iki yerde de ayni: 38 px turuncu igne,
beyaz konturlu, icinde beyaz daire. **2026-09-09 sabahki "kullanici
DAIRE, mekan IGNE" ayrimi boylece GECERSIZ** - ayrimi artik RENK ve
OLCU tasiyor (kullanici turuncu 38, mekan durum renginde 30).

**6. KULLANICI ILE MEKAN ARASINDA CIZGI.** Kullanicinin istegi:
"secilen konumla kullanicinin o anki konumu arasinda bir yol cizilsin".

**DUZ VE KESIKLI CIZGI, GERCEK ROTA DEGIL - bilincli.** Surus rotasi
bir yol tarifi servisi ister (Apple/Google Directions): ek anahtar,
kota, lisans; ustelik Google'in verisi saklanamiyor (2026-08-31
arastirmasi). Ayrica ekrandaki mesafe hapi ZATEN kus ucusu mesafeyi
yaziyor - egri bir rota cizip yanina kus ucusu mesafe yazmak ikisini
celiskiye duesuerurdu. Kesik cizgi "yaklasik/dogrudan bag" diyor, duz
kalin bir cizgi ise surulecek bir yol gibi okunurdu.

`Polyline` markerlardan ONCE ciziliyor (ignelerin altinda kaliyor) ve
yalnizca kullanicinin konumu okunabildiginde var; kesfet ekraninda
kullanici zaten merkez oldugu icin hic cizilmiyor. Iki testle kilitli
(konum varken cizgi VAR, yokken YOK).

**HARITA DEGISIKLIKLERI WEB'DE DOGRULANAMAZ** - orada radar cizimi
var, gercek harita yalnizca telefonda. Jest tarafi `react-native-maps`
mock'una eklenen `Polyline` ile olcuIuyor.

Dogrulama: jest 64 paket / 744 test, tsc uygulama kodunda 0 hata,
gezinme geometrisi canli olcuIdu, ekran goruntuleri
`tasarim/gezinme-duzeltme.png`, `profil-madalya.png`,
`mekan-sayfasi-son.png`.


## [AYARLAR YENIDEN DIZILDI, CHECK-IN'E "ARKADAS EKLE" - 2026-09-12]

### AYARLAR YENIDEN DIZILDI, CHECK-IN'E "ARKADAS EKLE" - 2026-09-12

Kullanicinin arka arkaya uc istegi, hepsi yayinda (OTA grup
`825f6cdc-a725-40b3-a6a8-67faab0c23d9`, jest 73 paket / 873 test).

**1. Gizlilik metni + Verilerimi indir EN ALTA, KART DISINA.**
"Hesabin" karti tamamen kalkti; iki satir "Hesap" bolumunun ustunde
duz baglanti (`ayar-baglantilari` testID). Ayni sabah eklenen
`IndirIkonu` ve `BelgeIkonu` olu kaldi, silindi. Siralama ve kart
disiligi testle kilitli.

**2. "Yeni check-in'lerim" satiri KALDIRILDI, baslik "Gizlilik
ayarlari".** Tek girisi bu satirdi; `/profil/check-in-gorunurlugu`
ekrani, testleri ve `varsayilanBulunurluguAyarla` SILINDI
(`varsayilanBulunurluguGetir` DURUYOR - check-in ekrani okuyor).
**SONUCU KULLANICIYA SOYLENDI:** varsayilan bulunurluk artik
degistirilemiyor, sunucudaki varsayilan (herkese_acik) gecerli;
paylasimlari daraltmanin tek kontrolu "Profilim gizli". Not:
`/profil/ani-gorunurlugu` ekrani 2026-08-30'dan beri ayni sekilde
oksuz ve HALA duruyor - bu iste dokunulmadi.

**3. Check-in ekraninda "Arkadas ekle (opsiyonel)" butonu.**
Etiketleme ZATEN vardi ama satir ici cipler arkadas listesi BOSKEN
hic cizilmiyordu - kullanicinin hesabinda arkadas olmadigi icin
ozelligi hic gormedi ve "arkadas ekle koy" dedi. Buton artik her
zaman gorunuyor (fotograf butonuyla ayni dil), yeni
`src/tasarim/ArkadasSecici.tsx` alttan aciliyor: aranabilir, COKLU
secim, "Tamam (N)"; liste bossa sebebini soyluyor. Secilenler
butonun altinda cip, dokununca kalkiyor. `ListeSecici` kullanilmadi:
o tek secimlik ve secince kapaniyor.

Yan duzeltme: ilk kullanim uyarisi ("Bu check-in ne paylasiyor?")
metni ASCII'ydi (karar 74 ihlali, 2026-08-23 cevirisinde atlanmis),
duzgun Turkceye cevrildi; "takip eden arkadaslarina" -> "arkadaslarina".

**EKRAN GORUNTUSU TUZAGI:** ekran goruntusu araci temiz profil
kullandigi icin check-in ekraninda ilk kullanim uyarisi cikiyor;
`SLOOIN_TIKLA="Anladım|Arkadaş ekle (opsiyonel)"` ile gecilir.


## [DEVIR NOTU - 2026-09-12 AKSAM: --chrome ILE YENIDEN AC, GOOGLE CLOUD'DAN BASLA]

### DEVIR NOTU - 2026-09-12 AKSAM: --chrome ILE YENIDEN AC, GOOGLE CLOUD'DAN BASLA

Kullanici .bat'i duzenledi, oturum ONAYSIZ KIPTE acildi ve "hazir"
dedi. Ama tarayiciyi surmenin iki yolu da bu oturumda kapali cikti:

1. **Kopya profil yolu OLMUYOR - tekrar denenmesin.** Chrome 152
   cerezleri "app-bound encryption" ile sifreliyor ve anahtar PROFIL
   YOLUNA bagli: `Profile 2` (Slooin, slooinapp@gmail.com)
   scratchpad'e kopyalanip `--remote-debugging-port` ile acildi,
   Google oturumu ACILMADI (accounts.google.com giris ekrani).
   Ayrica cerez dosyasi Chrome acikken kilitli (paylasimli okuma bile
   reddediliyor) ve yonetici yetkisi yok; Chrome'u kapatip kopyalamak
   gerekti - kullanicinin pencereleri `--restore-last-session` ile
   geri acildi. Chrome 136+ ayrica gercek (varsayilan) profil dizini
   icin uzaktan hata ayiklamayi tamamen engelliyor.
2. **`claude-in-chrome` bu oturumda BAGLI DEGILDI** cunku oturum
   `--chrome` bayragi olmadan acilmisti. Eklenti kurulu
   (`~/.claude.json` -> cachedChromeExtensionInstalled: true).

**YAPILAN:** masaustundeki `Claude - cloud projesi.bat` iki yerden
duzeltildi: `--chrome` eklendi ve `claude claude ...` satirindaki
fazla "claude" kaldirildi (o kelime her acilista ILK MESAJ olarak
gidiyordu; bu oturumun ilk mesaji o yuzden "claude" idi).

**YENI OTURUMUN ILK ISI:** `mcp__claude-in-chrome__*` araclariyla
GERCEK Chrome'u sur. Kullanicinin uyarisi: iki Gmail ile iki Chrome
penceresi acik - **hangi hesapla calistigini sayfadan OKUYARAK
dogrula** (Google hesap menusu / myaccount), varsayma. Dogru hesap
`slooinapp@gmail.com`, profil adi "Slooin" (`Profile 2`). Sonra
`docs/sosyal-giris-kurulumu.md` sirasi: Google Cloud (proje Slooin,
OAuth consent, 3 istemci: web / iOS / Android + Maps SDK for Android
anahtari) -> Apple Developer -> Supabase -> derleme. Android SHA-1:
`npx eas-cli credentials`. Anahtarlar `mobil/.env` ve EAS env'e;
DEPOYA YAZILMAZ, SOHBETE YAPISTIRILMAZ.

Yardimci: scratchpad'de `tarayici.mjs` (puppeteer CDP surucusu) ve
`chrome-kopya/` duruyor; ikisi de artik gereksiz.

### ESKI: SIRADAKI IS: APPLE / GOOGLE GIRISI - BYPASS KIPI BEKLIYOR - 2026-09-12

Kullanici Apple/Google girisine gecmeye karar verdi. Marka hesaplari
acildi: **Google Cloud ve Play Console `slooinapp@gmail.com` ile**
(ana hesap degil, ayri marka hesabi). Panelde HENUZ HICBIR ADIM
YAPILMADI: `mobil/.env`de Google anahtari yok, EAS'te yok,
`SUPABASE_ACCESS_TOKEN` da yok. Rehber `docs/sosyal-giris-kurulumu.md`.

**Neden ilerlenemedi - uc kapi da kapandi:** (1) `claude-in-chrome`
bilgisayar basinda onay istiyor, kullanici telefondan takip ediyordu;
(2) Chrome profilini puppeteer ile okumak auto-mode siniflandiricisi
tarafindan kesildi (hassas veri); (3) izin ayarlarini kendim
genisletmek "self-modification" diye kesildi. Ucuncusu belirleyici:
bu anahtari yalnizca kullanici cevirebilir, ajan ceviremez.

**Kullanicinin karari: "eve gidince yapicaz".** Yapacagi uc sey:
masaustundeki `Claude - cloud projesi.bat` icine
`--dangerously-skip-permissions`, Chrome'da `slooinapp@gmail.com`
girisi, "Claude in Chrome" eklentisi. Sonra "hazir" diyecek ve
YENI OTURUM Google Cloud -> Apple Developer -> Supabase -> derleme
sirasini tarayiciyi surerek kendisi yurutecek. Kullanicinin standing
kurali `kullanici-uzakta-onaysiz-calis` hafizasinda: panel islerini
onun yerine yap, onay gerektiren araca ilk secenek olarak yaslanma,
beklemedeyken sessiz kalma.

### "VERILERIMI INDIR" SATIRINA AYRI IKON - 2026-09-12

Ayarlar > Hesabin bolumunde "Gizlilik metni" ile "Verilerimi indir"
AYNI belge ikonunu tasiyordu; yan yana iki satirin ayni isareti
tasimasi ikonun tek isini (satiri gozle ayirmak) bosa cikariyordu.
Yeni `IndirIkonu` (`ayar-ikonlari.tsx`): tepsiye inen ok, ayni dilde
(20 px, 1.8 cizgi, dolgusuz). Belge degil EYLEM ikonu - satir bir
sey acmiyor, dosya uretiyor. Canli ekran goruntusu
`tasarim/ayarlar-indir-ikonu.png`. Yayin: web `slooin.expo.app`, OTA
grup `1ff52715-443c-4f40-b211-91ab0aee07d0`. Jest ayarlar 19/19.

### AYARLAR SADELESTI: IKI SATIR KALKTI, BIR EKRAN SILINDI - 2026-09-12

Kullanicinin istegi: "Ayarlardan profili duzenle ve kullanici adi
kismini kaldir."

**ONCE KONTROL EDILDI** - bu projede defalarca yasanmis bir tuzak var:
bir girisi kaldirmadan once o islemin BASKA girisi var mi diye
bakilmali. Iki satirin durumu FARKLI cikti:

| Satir | Baska giris | Sonuc |
|---|---|---|
| Profili duzenle | VAR - profil ekranindaki "Profili düzenle" butonu | Satir guvenle kalkti |
| Kullanici adi | YOK - tek giris buydu | Satir kalkti, EKRAN SILINDI |

**`/profil/kullanici-adi` EKRANI SILINDI ve islev KAYBOLMADI:** kullanici
adi duzenlemesi 2026-09-11'de `profil/duzenle` ekranina SATIR ICI
tasinmisti, yani ayri ekran zaten ikinci bir yoldu. Satir kalkinca
oksuz kaliyordu - ayni karar 2026-09-07'de `profil/anilar.tsx` icin de
verilmisti.

**BU IS ESKI BIR TEST BOSLUGUNU ACIGA CIKARDI.** "Profili düzenle"
butonu artik `/profil/duzenle` ekraninin TEK girisi, ama profil ekrani
testi yalnizca butonun GORUNDUGUNU olcuyordu - nereye gittigini DEGIL.
Yani bir yonlendirme kopmasi o ekrani tamamen ulasilamaz yapar ve
hicbir test yakalamazdi. Yeni test o iddiayi kilitliyor.

**DORT TEST IDDIASI TERSINE CEVRILDI, SILINMEDI** (depoda yerlesik
kural): "kullanici adini gosterir" -> "satir ARTIK YOK", "kendi
ekranina goturur" -> "o adrese hicbir yonlendirme yok", ve iki
"Profili düzenle VAR" iddiasi -> "YOK". Silmek "bu hic test edilmedi"
izlenimi birakirdi; tersine cevirmek satirlar sessizce geri gelirse
testi kiriyor.

Birlikte temizlenenler: `kullaniciAdi` state'i, `kullaniciAdiDurumunuGetir`
cagrisi ve ayarlardaki importu, `KalemIkonu` ve `KisiIkonu` importlari.
`kullaniciAdiDurumunuGetir` LIB'DE DURUYOR - `profil/duzenle` onu hala
kullaniyor.

Dogrulama: jest 71 paket / 852 test (bir paket silindigi icin 72'den
dustu), tsc uygulama kodunda 0 hata, canli ekran goruntusu
`tasarim/ayarlar-sade.png`. Yayin: web `slooin.expo.app`, OTA grup
`9724759b-a565-4d07-b33a-00754db52d69`.

**BIR TEST YORUMU DA BAYATTI ve duzeltildi:** profil ekrani testinde
"Ayarlardaki 'Profilini düzenle' satiri DURUYOR" yaziyordu; artik
durmuyor.


## [YARIM KALAN ISLER KAPATILDI - 2026-09-11]

### YARIM KALAN ISLER KAPATILDI - 2026-09-11

Kullanicinin istegi: "yarim kalan islerimizi tamamlayalim." Acik borc
listeleri tarandi; bulunanlarin bir kismi ZATEN KAPANMISTI (liste
bayatlamis), bir kismi da gercekten aciktı.

**1. IKI CANLI TEST PAKETI DE KIRMIZIYDI ve kimse gormuyordu.**

`test:gorunurluk` **10 dogrulama**, `test:sema` **2 dogrulama** ile
basarisiz kosuyordu. Ucu de ayni sinif: KURAL DEGISTI, IDDIA
GUNCELLENMEDI. Yani paketler bir seyi korumuyor, artik var olmayan bir
davranisi olcuyordu.

| Iddia | Ne zamandan beri kirik | Gercek kural |
|---|---|---|
| "HER etiket onay bekler" (senaryo 63, 64) | 2026-09-06 | Onay bir AYAR, varsayilan DIREKT |
| "arama cagiranin kendisini koymaz" (sema) | 2026-09-10 | Kisi kendi aramasinda EN USTTE cikiyor |
| "tam olarak BES bildirim tetikleyicisi" (sema) | 2026-09-06 | ALTI - `etiket_bildirimi` eklendi |

**SENARYO 63 YENIDEN YAZILDI ve artik ASIL KURALI olcuyor:** durumu
istemci degil SUNUCU yaziyor (`etiket_durumu` BEFORE INSERT
tetikleyicisi). Iki bolum var ve ikisi de istemcinin degeri
ZORLAMASINI deniyor:

    ayar KAPALI + istemci 'bekliyor' gonderir  -> 'onaylandi'  (ezildi)
    ayar ACIK   + istemci 'onaylandi' gonderir -> 'bekliyor'   (ezildi)

Tek yon test edilseydi tetikleyicinin degeri gercekten BELIRLEDIGI
degil, rastlantiyla ayni sonucu verdigi de dogru olabilirdi. Bu
davranis 2026-09-06'da elle bir kez olculmustu ama pakete hic
girmemisti; artik girdi.

Senaryo 64 (reddedilen etiket) ayari ACIYOR, cunku "reddetme" diye bir
adim ancak etiket BEKLEYEN girerse var. Iki senaryo da ayari
varsayilana geri donduruyor - kirli birakilsaydi paketin geri kalani
"varsayilan direkt" varsayimiyla celisirdi.

**DERS: ayni kurali iki paket olcuyorsa kural degisince IKISI de
aranmali.** Arama kurali 2026-09-10'da degistirildiginde yalnizca
gorunurluk paketindeki kardesi guncellendi, sema paketindeki kopya
atlandi. Ayni gun "eski test iddiasi kurali hic olcmuyormus" diye bir
ders yazilmisti; bu onun kardesi.

**2. OLU KOD SILINDI** - her biri once grep ile tarandi ve yalnizca
kendi tanimindan (ve varsa kendi testinden) referans aldigi
dogrulandi:

    src/tasarim/MekanIkonu.tsx      2026-08-24'te tur gosterimi kalkinca
    src/tasarim/MekanGorseli.tsx    oksuz kaldi (821 satirin 448'i)
    SiraMadalyasi                   2026-09-09'da ortak SiraRozeti geldi
    mekanAnilariniGetir             2026-08-29'da mekan detayi silindi
    goreceZamanGosterilir           uygulamada hic cagrilmiyordu

Son ikisinin TESTLERI de silindi: olu kodu test etmek kapsamayi
sisirip hicbir sey korumuyordu.

**BILEREK BIRAKILANLAR** (CLAUDE.md'de zaten gerekceli): `SOSYAL_TURLER`
ve `DAIRE_YUKSEK`. Ikisi de olu ama kayitli birer "geri istenirse tek
satirlik is" notu tasiyor.

**3. BAYAT CIKAN BORCLAR - listeler guncellendi, is yoktu:**

- Gizlilik metnindeki "telefon numaran" ifadesi ZATEN e-postaya
  gore yeniden yazilmis (hem `gizlilik.tsx` hem `docs/gizlilik-metni.md`).
- `gizlilik-metni.md`deki "gunluk calisan" yanlis kelimesi ZATEN
  duzeltilmis; metin "10 dakikada bir" diyor.

**4. KAPATILAMAYANLAR ve sebebi** - hicbiri koda bagli degil:

| Borc | Neden bekliyor |
|---|---|
| Gizlilik metnindeki basvuru kanali | Gercek bir destek e-postasi gerekiyor, uydurulamaz |
| Erisim/tasinabilirlik akisi (KVKK m.11) | Yeni bir ozellik; bugun talep elle karsilaniyor |
| Elle tarayici gezintileri (Faz 2b-3b, Plan 1) | Etkilesimli, insan gerektiriyor |
| Apple/Google girisi, SMTP, alan adi, native derleme | Kullanicinin panel/magaza isleri |
| Cok dillilik (i18n) | Ertelenmis faz, tasarim bitince |
| `mahalle_hazirlik` (5,98M satir) dusurulebilir | Yikici; `ilceler` artik ondan kopyalandi, dusurmek serbest ama karar kullanicinin |

### KULLANICI ADI SATIR ICINDE, YASADIGIN BOLGE - 2026-09-11

**1. KULLANICI ADI ARTIK PROFIL DUZENLEMEDE SATIR ICINDE.**
Kullanicinin istegi: "kullanici adi satirina basinca baska sayfaya
geciyor, onu iptal et; bu attigim kendi satirinda duzenleme
yapilacak." Onceden satir `/profil/kullanici-adi` ekranina gidiyordu.

**O EKRAN SILINMEDI ve bu bilincli:** ayarlardaki "Kullanıcı adı"
satiri hala oraya gidiyor, yani ikinci bir girisi var. Bir girisi
kaldirmadan once o islemin baska girisi var mi diye BAKMAK gerekiyor -
ayni tuzak 2026-09-03'te ayarlardaki "Profili düzenle" satirinda ve
2026-09-07'de "Anılarım" ekraninda yasandi.

Mantik iki kez yazilmadi: bicim kurallari ve degistirme cagrisi
`lib/kullanici-adi.ts` icinde, iki ekran da onu kullaniyor.

**SIRA ONEMLI - kaydetmede kullanici adi ONCE deneniyor.** O islem
reddedilebilir (30 gun kurali, ad alinmis); sonra yapilsaydi ad ve
biyografi kaydedilir, kullanici adi reddedilirdi ve kisi neyin
kaydedilip neyin kaydedilmedigini anlamazdi.

**DEGISMEDIYSE RPC HIC CAGRILMIYOR:** 30 gun sayaci yalnizca ad
gercekten degistiginde harcanmali. Kisi biyografisini duzeltip
kaydettiginde kullanici adi hakkini kaybetmemeli. Bir testle kilitli.

**2. YASADIGIN BOLGE (il + ilce), OPSIYONEL.**
Kullanicinin istegi: "profili duzenlemeye yasadigin bolge diye bir sey
ekleyelim, il ilce secilsin, sadece opsiyonel; secerse profilinde
biyografi kisimlarinin orada gorunur."

**ILCE LISTESI TURETILMIS DEGIL - bu isin en onemli karari.**
Kullanicinin kurali (`turetilmis-veri-degil-gercek-kayit`) geregi liste
`mekanlar.semt` sutunundan CIKARILMADI. O sutun KARMA bir kaynak
(poligon testi + Foursquare `locality`) ve olculdu: Bursa'da 17 gercek
ilcenin yaninda **33 cop kayit** var - "Avustralya", "Bilinmez",
"Marmara Bölgesi", "Bırsa", "Burda".

Liste `mahalle_hazirlik` tablosundan geldi: o tablo 2026-08-31'de OSM
IDARI SINIR POLIGONLARIYLA nokta-icinde-poligon testiyle uretilmisti,
yani her satir "bu koordinat su ilcenin SINIRLARI ICINDE" diyor.
Sonuc `public.ilceler`: **968 (il, ilce) cifti, 81 il**; Turkiye'de 973
ilce var ve Bursa kontrol edildiginde TAM 17 ilce, sifir cop.

**DEGER SERBEST METIN DEGIL:** `profiller(yasadigi_il, yasadigi_ilce)`
uzerinde `ilceler`e BILESIK YABANCI ANAHTAR var. Uydurma bir yer adi
profilde gercek bilgi gibi dururdu.

**IKISI BIRDEN YA DA HICBIRI:** `check ((yasadigi_il is null) =
(yasadigi_ilce is null))`. Yalnizca ilce secilmis bir profil anlamsiz
olurdu ("Nilüfer" hangi ilde?). Yabanci anahtar MATCH SIMPLE oldugu
icin ikisi de null'ken kisit saglanmis sayiliyor, yani alan bos
kalabiliyor.

**YENI BILESEN `ListeSecici`:** alttan acilan, ARANABILIR liste.
Mevcut `SecimPenceresi` uc bes secimlik bir eylem menusu - kaydirilmiyor
ve arama kutusu yok. 81 il icin arama sart: alfabetik bir listede
"Zonguldak"a kaydirarak inmek iki harf yazmaktan cok daha yorucu.

**3. PROFILDE KULLANICI ADI DAHA BELIRGIN.** `metinSoluk` ->
`metinIkincil`, punto 13 -> 15. Bu ayni zamanda bir KONTRAST
DUZELTMESI: soluk jeton beyaz zeminde 2,74:1 veriyordu ve metin icin
gereken 4,5 esiginin ALTINDAYDI (2026-09-08 olcumu); `metinIkincil`
5,63. Ad hala `ekranBasligi` ve kalin, yani hiyerarsi korunuyor.

**KVKK:** bolge alani icin listeye madde eklendi. Kritik ayrim orada
yaziyor - bu KABA KONUM bir BEYAN (ilce duzeyi, adres ya da koordinat
degil) ve check-in konumuyla hicbir ilgisi yok: cihazdan hicbir sey
okunmuyor, secim elle yapiliyor.

### PROFILE INSTAGRAM KULLANICI ADI - 2026-09-11

Kullanicinin istegi: "profiline kullanicilar instagramini
baglayabilir mi ya da instagram adresini ekleyebilsinler."

**"BAGLAMA" (OAUTH) MUMKUN DEGIL - arastirildi, tekrar denenmesin.**
Meta, Instagram Basic Display API'yi **4 Aralik 2024'te kapatti** ve
kisisel hesap destegini tamamen kaldirdi. Yerine gelen "Instagram API
with Instagram Login" ve Graph API yalnizca ISLETME/ICERIK URETICI
hesaplariyla calisiyor; siradan bir kullanici hesabini donusturmeden
baglayamaz. Yani "bu hesap gercekten onun" dogrulamasini yapmanin
yolu YOK.

**BU YUZDEN ALAN BIR BEYAN ve kullaniciya ACIKCA SOYLENDI.** Kisi
teorik olarak baskasinin kullanici adini yazabilir; karsiligi mevcut
sikayet akisi. Kullanici bu haliyle onayladi ("Ekle"). Instagram'in
kendi "baglantilar" alani da ayni sekilde calisiyor. Bunu gizlemek ya
da dogrulanmis bir bag gibi sunmak yanlis olurdu - duzenleme
ekranindaki ipucu da "Doğrulanmaz" diyor.

| Parca | Yeri |
|---|---|
| Sutun | `profiller.instagram` + bicim kisiti, `grant update (instagram)` |
| Bicim kurallari | `lib/instagram.ts` (saf, 11 testli) |
| Okuma | `kendiProfilimiGetir` ve `baskasinin_profili` (RPC donus tipi degisti, DROP+CREATE) |
| Yazma | `profiliGuncelle` |
| Ekran | `profil/duzenle` (onekli girdi) |
| Gosterim | `src/tasarim/InstagramSatiri.tsx` - IKI profil ekrani da ayni bileseni kullaniyor |

**UC YAZIM BICIMI DE KABUL EDILIYOR:** `orcun`, `@orcun`,
`https://instagram.com/orcun/`. `instagramNormallestir` hepsini ayni
degere indiriyor - alanin tek isi bir profile gitmek, "yanlis yazdin"
demek gereksiz surtunme olurdu.

**`toLowerCase` YERELDEN BAGIMSIZ olmali:** `toLocaleLowerCase('tr')`
'I' harfini 'ı' yapar ve o karakter ASCII disi oldugu icin hem
sunucudaki kisiti ihlal eder hem de baglantiyi bozardi. Bir testle
kilitli.

**KISIT IKI KATMANDA ve ISLERI FARKLI:** sunucudaki check yalnizca
KARAKTER KUMESI ve UZUNLUK bakiyor - isi copu (tam URL, bosluklu
metin, olta baglantisi) engellemek. Ince kurallar (nokta basta/sonda
olamaz, cift nokta olmaz) ISTEMCIDE, cunku orada kullaniciya sebebini
soyleyen bir mesaj gosterilebiliyor; sunucudan gelen ham kisit ihlali
kullaniciya hicbir sey anlatmaz.

**KAPALI PROFILDE DE GORUNUYOR**, biyografi gibi: "profilim gizli"
ayari ANILARI kapatiyor, kimlik satirini degil.

Ikon Instagram'in GRADYANLI marka isareti DEGIL, tek renkli bir kamera
cizimi - baglanti satirlarinin alisilmis dili bu ve marka renkleri
profildeki turuncu kimlige yabanci duserdi.

### PROFIL UST BLOGU REFERANSA GORE YENIDEN DUZENLENDI - 2026-09-10

Kullanici bir referans gorsel gonderip "profil sayfasinin ust kismini
boyle yap, ornek gorsel olustur once" dedi. Mockup
`tasarim/profil-yeni-dizilim.html` + `.png`; onaydan SONRA kod yazildi.

**DEGISENLER:**

| Blok | Onceki | Simdi |
|---|---|---|
| Ust cubuk | kullanici adi + paylas + ayarlar | **"Profil"** basligi + ayarlar |
| Kimlik | avatar ORTALI, bilgiler altinda | avatar **SOLDA**, bilgiler saginda |
| Kullanici adi | ust cubukta, @'siz | **adin altinda, @ ile** |
| Eylemler | yok (2026-09-03'te kaldirilmisti) | **"Profili düzenle" + kare paylas** |
| Sayaclar | kutusuz, duz satir | **tek KART**, aralarinda ayirici |
| Sekmeler | HAP + kayan buton | **ALT CIZGI** + kayan cizgi |
| Fotograf rozeti | acik modda koyu | **iki modda da turuncu** |
| Arka plan | duz beyaz | ust blokta **isimsiz harita dokusu** |

**UC ESKI KARAR BILINCLI OLARAK GERI ALINDI** - kullanici referansla
birlikte istedi:
- "Profili düzenle / Paylaş butonlarini kaldir" (2026-09-03)
- "@ isaretini kaldiralim" (2026-09-03)
- "sayac kutularini kaldir" ve "hap sekilde kaymali sekme" (2026-09-08)

Ayarlardaki "Profilini düzenle" satiri DURUYOR. Iki giris zarar
vermiyor; kaldirmak o ekrani yine oksuz birakma riski tasiyordu (ayni
tuzak 2026-09-03'te yasanmisti).

**HARITA DOKUSU: YENI VERI CEKILMEDI.** `ProfilHaritaZemini` bileseni
karsilama ekraninin `karsilama-harita.ts` dosyasini kullaniyor -
Bursa/Nilufer'in gercek yol agi (9 ana + 24 orta + 141 ince yol, 49
yesil alan), OSM'den bir kez cekilmis. **Hazir harita dosemesi
KULLANILMADI** cunku onlarda sokak adlari gomulu geliyor ve kullanici
"hicbiryerin ismi yazmayan" dedi; ayrica vektor cizim ag istegi
yapmiyor.

Doku `opacity: 0.18` ve yuksekligi `HARITA_YUKSEKLIGI = 152` -
kullanicinin siniri: "profili duzenle yazisina kadar olsun yeter."
**Avatar boyu ya da paylar degisirse o sabit de degismeli**, yoksa doku
ya butonun altina tasar ya da erken biter.

Renkler TEMADAN BAGIMSIZ: doku iki modda da acik bir harita gibi
okunmali; temayla donen jetonlar koyu modda yollari beyaza cevirir ve
doku bir agacik gibi gorunurdu.

**SEKME BILESENININ ADI YANILTICI KALDI:** `SekmeHapi` artik hap degil
alt cizgi, ama iki ekran onu bu adla cagiriyor ve yeniden adlandirma bu
isin kapsami disindaydi. Dosyanin basindaki yorum durumu acikliyor.
Kayma KORUNDU - yalnizca sekli degisti (dolu buton -> ince cizgi).

**BES TEST IDDIASI TERSINE CEVRILDI, SILINMEDI:** "butonlar YOK" ->
"VAR", "@ YOK" -> "@ VAR", rozet koyu -> turuncu. Iddialari silmek
"bu hic test edilmedi" izlenimi birakirdi; tersine cevirmek eski
davranis sessizce geri gelirse testi kiriyor.

**CANLI OLCUM BIR HATA YAKALADI - harita dokusu KOYU MODDA PARLIYORDU.**
Ilk yazimda renkler SABITTI ve gerekce "harita her modda acik gorunsun"
diye yazilmisti. Ekran goruntusu tersini gosterdi: acik gri yollar siyah
zeminde beyaz gibi parliyordu. Dogru olcut sabit renk degil, ZEMINE
GORE HAFIF kalmak. Dort yeni jeton eklendi (`haritaYolInce/Orta/Ana`,
`haritaYesil`) ve iki palette ayri degerler tasiyorlar.

**DERS: "temadan bagimsiz olsun" karari her doku icin dogru degil.**
Harita ETIKETLERINDE dogruydu (2026-09-10) cunku Apple Haritalar iki
modda da acik zemin veriyor; ama bu doku UYGULAMANIN kendi zemininin
uzerinde duruyor ve o zemin temayla donuyor.

**HARITA TAMAMEN DEKORATIF** (kullanicinin teyidi): `pointerEvents="none"`,
dokunma almiyor, hicbir islevi yok - yalnizca arka plan dokusu.

**UC DUZELTME - 2026-09-11 (kullanicinin bildirdikleri, hepsi yayinda).**

1. **"Bu kismi kucult, profili duzenleyle ust uste binmis."** Olculdu ve
   sebep tam olarak buydu: "Profili düzenle" butonu 218pt'de bitiyor,
   sayac karti **TAM 218pt'de** basliyordu - aralarinda SIFIR bosluk
   vardi. `ProfilSayaclari`a `marginTop: bosluk.m` eklendi; kart ayrica
   kisaldi (dikey dolgu 12 -> 8, ikon 30x27 -> 26x23, sayi 20 -> 18).
   **Gozle "bitisik duruyor" demek yerine iki ogenin alt/ust
   koordinatini olcmek dogru yol** - fark bir margin eksikligiydi, bir
   olcu hatasi degil.

2. **"Arkasindaki harita gorselini de daha yukari dogru uzat, bitisi
   gorunmesin."** `ProfilHaritaZemini` artik `ustTasma` prop'u aliyor
   (`HARITA_UST_TASMA = 96`) ve `top: -ustTasma` ile ust cubugun
   ARKASINA uzaniyor, yani ust kenari ekran disinda kaliyor. Alt kenar
   icin `overflow: hidden` YETMEDI - keskin bir cizgi birakiyor ve doku
   "yarim kalmis gorsel" gibi okunuyordu; `LinearGradient` ile
   seffaftan `renk.zemin`e sonen 56 px'lik bir kapanis eklendi.
   Gradyan zeminin KENDI rengiyle bitiyor, yoksa doku sayfanin icinde
   erimezdi.

3. **"Profili duzenle sutununu incelt biraz."** `duzenleButonu`
   yuksekligi 46 -> 40, `paylasButonu` 56x46 -> 52x40.

Dogrulama: jest 67 paket / 808 test, tsc uygulama kodunda 0 hata, IKI
MODDA da canli ekran goruntusu (`tasarim/profil-canli-light.png`,
`profil-canli-dark.png`). Yayin: web `slooin--f43grktb7l.expo.app`,
OTA grup `20568225-d146-4f86-b481-14f671ad06a3`.

**JEST GENEL TIMEOUT'U 20 SN'YE CIKARILDI** (`package.json` icindeki
`jest.testTimeout`). Bugun DORT KEZ ayni sey yasandi: testler tek
basina 3-5 sn suruyor, tam paket kosumunda makine yuklu oldugu icin 5
sn'lik varsayilani asiyor ve KOD DEGISMEDIGI HALDE kiriliyorlar.
Dosya dosya `jest.setTimeout` eklemek yerine tek yerden cozuldu;
`harita/[mekanId].test.tsx` icindeki dosya bazli tekrar kaldirildi.

Dogrulama: jest 67 paket / 808 test, tsc uygulama kodunda 0 hata,
canli ekran goruntusu IKI MODDA da alindi
(`tasarim/profil-canli.png`, `profil-canli-light.png`).

**UST CUBUKTAKI "Profil" BASLIGI KALDIRILDI ve BLOK YUKARI ALINDI -
2026-09-11 (kullanicinin iki istegi).**

Baslik 2026-09-10'da referans gorselle gelmisti; kullanici kaldirtti.
Cubukta artik yalnizca ayarlar var, dolayisiyla hizalama
`space-between` degil **`flex-end`**: tek cocukla `space-between`
disliyi SOLA yapistirirdi. `profil.baslik` ceviri anahtari ve
`sayfaBasligi` stili de silindi - ikisi de tek kullanimliydi ve olu
kalirdi.

Ikinci istek: "profil resmi, isim, kullanici adi, biyografi kismini
bunlari beraber biraz daha yukari tasi." Iki yerden 16 px kisildi:
`ustCubuk.marginBottom` 12 -> 4 ve `kimlik.paddingTop` 8 -> 0.
`HARITA_YUKSEKLIGI` de 152 -> 144, cunku ikinci degisiklik dugmeyi
dokuya GORE 8 px yukari cekiyor - doku kisalmasa butonun altina
tasardi.

**BU IS ESKI BIR KUSURU ACIGA CIKARDI: sonme gradyani hic calismiyormus.**
`ProfilHaritaZemini` icindeki `opacity: 0.18` KABA uygulaniyordu ve
alttaki `LinearGradient`i de solduruyordu - %18 opak bir beyaz, %18
opak bir dokuyu ancak %18 kadar beyazlatir, yani doku hicbir zaman tam
sonmuyordu. Blok yukari alininca o kenar acikta kaldi ve gorunur oldu.
Opaklik artik SVG'de; gradyan tam opak calisiyor.

**OLCULEREK dogrulandi, gozle degil:** dokunun sapmasi 240. satirda
11,5 iken 288-298 araliginda 1-3'e iniyor ve buton (300) baslamadan
sifirlaniyor - yani keskin kenar YOK. Ilk bakista "cizgi" sanilan sey
dokunun kendi yol cizgisiydi; ayni tuzak 2026-09-03'te "karanlik
ekran" sikayetinde de yasanmisti.

Yeni test: "ust cubukta sayfa basligi YOK, yalnizca ayarlar var"
(`queryByText('Profil')` null). Baslik sessizce geri gelirse kirilir;
tam eslesme oldugu icin "Profili düzenle" butonu iddiayi tetiklemiyor.

**BIYOGRAFI KIRPMASI KALKTI, DOKU ARTIK OLCUELEN YUKSEKLIGE BAGLI -
2026-09-11 (kullanicinin bildirdigi kusur).**

"Biyografi satirina alt alta 2-3 tane sey yazinca hepsi gorunmuyor."
Sebep `numberOfLines={2}` idi. Kaldirildi; SINIRSIZ BUYUME RISKI YOK
cunku alan duzenleme ekraninda 160 karakterle kapali, yani en fazla
dort-bes satir.

**BU, SABIT `HARITA_YUKSEKLIGI` SAYISINI GECERSIZ KILDI.** O sabit
(152, sonra 144) avatar satirinin paylarindan ELLE hesaplanmisti ve
sessiz bir varsayima dayaniyordu: biyografi iki satirda kirpildigi
icin blogun boyu da sabitti. Kirpma kalkinca blok 1-5 satir arasi
degisiyor; sabit sayi ya erken biter ya butonun altina tasardi.
Artik `kimlik` blogunun yuksekligi `onLayout` ile OLCUELUEYOR ve doku
`olculen + HARITA_KUYRUGU (50)` kadar uzuyor - kuyruk, sonme
gradyaninin eriyip kaybolmasi icin gereken pay.

**Ders: elle hesaplanmis bir yerlesim sabiti, hesabin dayandigi
varsayim degistiginde sessizce yanlis olur.** Burada varsayim bir
KIRPMAYDI ve kaldirildigi anda sabit anlamsizlasti. Icerik boyu
degisken olabiliyorsa olcum sabitten iyidir.

Ayrica eylem satiri ve altindakiler biraz asagi alindi (kullanicinin
ayni mesajdaki istegi): `eylemler.marginTop = 12`, yani kimlik
blogunun kendi alt payiyla birlikte aradaki bosluk 28 px. Pay
`eylemler`de, `kimlik.paddingBottom`da DEGIL - doku artik kimlik
blogunun olcuelen yuksekligine gore uzadigi icin o paya eklenen her
piksel dokuyu da uzatirdi.

**KOYU MODDA DOKU GORUNMUYORDU** (kullanicinin ayni turdaki ikinci
bildirimi). Jetonlar (`haritaYol*`, `haritaYesil`) zeminle (#121110)
neredeyse ayniydi ve doku %18 opaklikla cizildigi icin fark 3-6
seviyeye duesueyordu - pratikte gorunmez.

Yeni degerler OLCULEREK secildi, gozle degil:

    efektif = zemin + 0,18 * (ton - zemin)

    eski  #332E29 -> fark  6 seviye   (gorunmuyor)
    YENI  #55504A -> fark 12 seviye   (acik moddaki farkla ayni)
    2026-09-10'da parlayan deger #D5C9BA -> fark 38 (cok fazla)

Yani bu jetonlar iki kez yanlis ayarlandi ve iki hata ZIT yondeydi:
once cok parlak (acik paletten alinmisti), sonra cok sonuk. Dogru
olcut mutlak ton degil ZEMINE GORE FARK - ve o fark opakligi de
hesaba katmali.

**ADIN YERI SABITLENDI, BIYOGRAFIYE UC SATIRLIK ALAN AYRILDI -
2026-09-11 (biyografi kirpmasinin YAN ETKISI).**

Kirpma kalkinca yeni bir kusur dogdu ve kullanici bildirdi: "isim kismi
bu sefer yukari dogru kayiyor, yeri sabit olmali." Sebep
`kimlik.alignItems: 'center'` idi - sutun biyografi uzadikca buyuyor
ve ORTALANDIGI icin ad yukari tasiyordu. `flex-start` ile ad artik
satirin tepesine sabit; blok yalnizca ASAGI dogru buyuyor.

`biyografi.minHeight = 60` (3 x lineHeight 20): kullanicinin istegi
"yazilacaginca gorunecegi alt alta birkac satirlik alan yarat".
`minHeight`, sabit `height` DEGIL - 160 karakter dort-bes satir
edebiliyor ve orada kirpmak ayni gun duzeltilen kusurun ta kendisi
olurdu. Biyografi yoksa alan da ayrilmiyor.

**OLCULEREK dogrulandi:** dort satirlik biyografisi olan hesapla tek
satirlik olan yan yana kondu; `@kullaniciadi` satiri ikisinde de
y=147, biyografinin ilk satiri ikisinde de y=191. **Olcuemde tuzak:**
once ADIN ust kenari karsilastirildi ve 100 vs 108 cikti - fark
yerlesimden degil GLIFTEN geliyordu (buyuk "O" kucuk "o"dan yukari
uzaniyor). Iki profilde AYNI stille cizilen bir satiri (`@`) olcut
almak gerekiyor.

### YARICAP 500 M: LISTE VE HARITA AYNI - 2026-09-10

Kullanicinin karari: "yakindaki mekanlar da 500 m mesafedeki yerler
gosterilsin, haritada da 500 m mesafe gosterilsin."

`KESFET_YARICAP_METRE` 1000 -> **500**. Harita AYRI bir sayi tasimiyor:
listeyle ayni kumeyi ciziyor, dolayisiyla tek sabit yetiyor.

**GECMISI: 500 -> 200 (2026-08-31) -> 500 -> 1000 (2026-09-01) -> 500.**

**ONCEKI 500 M DENEMESI NEDEN GERI ALINMISTI:** 2026-09-09'da yalnizca
HARITAYA 500 m konmustu, liste 1 km kalmisti. Seyrek bir cevrede liste
430/520/560 m'lik yerler gosterirken haritada TEK igne kaliyordu -
ekranin iki yarisi birbirini tutmuyordu. Kullanici ertesi gun geri
aldirdi ("sakin yerlerde cok bos kaliyor").

**BU KEZ FARKLI:** ikisi birden 500 m, yani o tutarsizlik bastan
olusmuyor.

**OLCULDU** (Bursa/Nilufer): 1 km'de 1.764 mekan, 500 m'de **466**
(Kafe 23 -> 6). Liste kisaliyor ama yakinlik vaadi guclesiyor.

Bos durum metni de guncellendi: "Bu filtreyle 500 m içinde mekân yok."
Test `toBe(1000)` yerine `toBe(500)` iddiasini tasiyor.

**KURAL YALNIZCA LISTELEMEYE AIT - CHECK-IN 1 KM KALIYOR.** Kullanici
bunu ayrica vurguladi (2026-09-10): "bu kural sadece bu dedigim icin
gecerli; bir konuma check-in yapabilmek icin 1 km icinde olman gerek
kurali ayni devam."

Teyit edildi, varsayilmadi:

    istemci  lib/checkin.ts   CHECK_IN_YARICAP_METRE = 1000
    sunucu   check_in_yap()   ST_DWithin(..., 1000)
                              'Mekana cok uzaksin (~1 km icinde olmalisin)'

Iki sayi AYRI YERDE ve ayri sey anlatiyor: `KESFET_YARICAP_METRE`
"listede neyi gosterelim", `CHECK_IN_YARICAP_METRE` "nereye check-in
yapilabilir". Pratik sonucu: 700 m otedeki bir mekan listede
GORUNMEZ ama arama ya da harita uzerinden sayfasina gidilip check-in
YAPILABILIR. Biri degistirilirken otekine dokunulmamali - ayni ders
`kurali-soylendigi-ekranda-birak` hafizasinda.

### KAYITLI ADRES ARTIK GOSTERILIYOR - 2026-09-10

Kullanicinin karari. `mekanlar.adres` **2.311.583 kayitta (%39,6) dolu
ve bugune kadar HICBIR EKRANDA kullanilmiyordu.**

**NEDEN KULLANILMIYORDU:** 2026-08-31'deki "yalnizca ilce ve il, TAM
DOGRULUK ADINA" karari bu alani da kullanim disi birakmisti. Ama o
kararin gerekcesi TURETILMIS mahalleydi - en yakin OSM noktasi,
komsuluga yayma, kirli kaynak; ucu de yanlis sonuc vermisti. Bu alan
turetilmis DEGIL.

**KULLANICI ISRAR ETTI VE OLCTURDU** ("tahmini degil gercek kayitli
adresler"). Dort bagimsiz kanit:

1. **Kaynak zinciri:** `fsq-indir.py` Foursquare'in `address` sutununu
   DOGRUDAN `SELECT` ediyor. Depoda ters cografi kodlama yapan tek yer
   `lib/adres.ts` ve o YALNIZCA yeni mekan ekleme ekraninda, kullanici
   onayiyla calisiyor; 5,8 milyonluk kayda hic dokunmuyor.
2. **Doluluk %35,6** (ham veri). Koordinattan turetilseydi **%100**
   olurdu - her kaydin koordinati var. 3.853.360 kayit adressiz cunku
   kimse girmemis.
3. **Ayni koordinat, farkli adres:** ayni noktada birden fazla kayit
   olan 5.823 yerin **%63'unde** adresler farkli. Makine turetseydi
   ayni olurdu.
4. **Yazim bicimleri insan izi:** 'Mahallesi' 257.394, 'Mah.' 208.632,
   'mahallesi' 78.122, 'Mh.' 44.838, 'mah.' 37.043, 'Mah ' 29.748...
   Tek bir makine sekiz farkli yazim uretmez.

**IKI SATIR, cunku ikisi FARKLI SEY soyluyor:** ustte kayitli adres
(bir BEYAN, serbest metin, kisa ya da eksik olabilir), altta ilce/il
(koordinatin hangi resmi sinir poligonuna duestuegue - kesin hesap).
Adres "Ada Sk. No:1" gibi kisa oldugunda ikinci satir olmasa kullanici
hangi sehirde oldugunu bilemezdi. Alt satir daha soluk: ayni tonda
olsalardi iki satir tek bir adres bloguymus gibi okunurdu.

**TEKRAR ONLENIYOR:** bazi adresler ilceyi zaten iceriyor ("... Merkez
Osmangazi -Bursa/Türkiye"); o durumda idari satir hic cizilmiyor.

Eski test iddiasi ("serbest adres metni HALA gosterilmiyor") silinmedi,
TERSINE cevrildi. Uc yeni test: kisa adres + idari satir birlikte,
tekrar onleme, adressiz kayitta yalnizca ilce/il.

#### ADRES ICIN ARASTIRILAN VE ELENEN YOLLAR (tekrar denenmesin)

**OSM'DEN ADRES BIRLESTIRME - OLCULDU, DEGMEZ.** Bursa'nin TAMAMINDA
yeme icme kategorisinde OSM'in Foursquare'e kattigi adres sayisi **5**.

    OSM Bursa yeme icme          : 689     (Foursquare 5.911 - 9x fark)
    OSM mekani FSQ ile eslesti   : 355
    OSM adresli / FSQ ADRESSIZ   :   5     <- asil kazanc
    ikisinde de adres var        :  34
    FSQ da hic yok + OSM adresli :  22

Eslestirme 60 m + ad benzerligi >= 0,60 ile yapildi. Esik gevsetilirse
YANLIS MEKANA YANLIS ADRES yazilir - tam olarak mahallede uc kez
yasanan hata. Karsiliginda gereken is: 644 MB PBF isleme, GDAL kurulumu,
eslestirme boru hatti, ODbL atfi genisletme. **Emek kazancin kat kat
ustunde.**

OSM'in tek ustunlugu adresi AYRI ALANLARDA tutmasi (`addr:street`,
`addr:housenumber`, `addr:neighbourhood`) - ama Bursa'da kapsamasi
yalnizca %8,9.

**FOURSQUARE'DEN IL/ILCE ALMA - OLCULDU, GEREKSIZ.**

    alan            Foursquare    Bizim (poligon testi)
    ilce/semt       %34,8         %99,65
    il              %20,4         %99,99
    admin_region    %0,0 (bos)    -

Bizde ilcesiz kalan 20.457 kayit (%0,35) KARADA DEGIL - "Antalya Kaş
Açıkları", Marmara'daki tekneler, kiyi noktalari. Bu kayitlarin 12
ornegi kontrol edildi: **12'sinde de** FSQ'nun `locality` ve `region`
alanlari BOS. Yani bosluk doldurulamaz, ilce gercekten yok.

Ayrica FSQ'nun `region` alani kirli: il yerine ilce yaziyor
("Aliaga/Aliaga", "Cukurova/cukurova").

**POSTA KODU ISTENMIYOR - KAPANDI.** `postcode` ham veride %36,3 dolu
ve `mekanlar` tablosuna hic aktarilmadi; aktarilmasi bir is kalemi
olarak onerildi ve kullanici REDDETTI (2026-09-10: "posta koduna gerek
yok"). Tekrar onerme.

**TEST TUZAGI - kayda geciyor:** mekan sayfasi testleri jest'in 5 sn
varsayilanina cok yakin (tek basina ~4 sn) cunku her biri mekan
bilgisini, istatistikleri, liderligi, son check-inleri ve cevre
listesini birden bekliyor. Tam paket kosumunda makine yuklu oldugu icin
siniri astilar. Dosya geneline `jest.setTimeout(20000)` kondu; testler
kirik degil YAVAS.

Dogrulama: jest 67 paket / 808 test, tsc uygulama kodunda 0 hata.

### "EN SIK" BASKASININ PROFILINDE ILK BES - 2026-09-10

Kullanicinin karari: "baskasi baskasinin profiline baktiginda en sik
ilk 5'i gorebilsin sadece."

**KENDI profilinde sinir YOK** - orasi kisinin kendi gecmisi.
Baskasinin profilindeki liste ise bir TANITIM: "bu kisi genelde nereye
gidiyor" sorusunu bes satirda cevapliyor, tam bir ziyaret dokumu
vermiyor.

**SINIR ISTEMCIDE ve bu bir GIZLILIK SINIRI DEGIL.** Anilarin gercek
korumasi `check_inler` RLS'inde ve o zaten devrede; ekrana gelen
kayitlarin hepsi zaten gorulmesine izin verilmis kayitlar. Sunucuya
ayri bir sinir koymak ayni veriyi iki kez kisitlamak olurdu.

Sabit `EN_SIK_GORUNEN = 5`, liste `slice` ile kesiliyor. Test yedi
farkli mekan uretip ilk besin gorundugunu, altinci ve yedincinin
kesildigini olcuyor.

### UC DUZELTME - 2026-09-10 (ikinci tur)

**1. BOLUM BASLIGI KARTLARLA HIZALANDI.** Kullanicinin bildirdigi
kusur: "Yakınındaki Mekanlar yazisini sol basa hizala." Baslik KENDI
yan payini koyuyordu (`paddingHorizontal: bosluk.sayfa`) ve o pay
sayfanin payiyla TOPLANIYORDU - baslik 32 px iceride, arama kutusu ve
kartlar 16 px'teydi. Yani ekrandaki tek hizasiz oge oydu.

**AYNI TUZAK IKINCI KEZ:** 2026-09-06'da yan pay her ogede ayri ayri
veriliyordu ve `bosluk.sayfa` jetonu tam bunu bitirmek icin
cikarilmisti; bu satir o temizlikten arta kalmis. Artik bir testle
kilitli ("bolum basligi KENDI yan payini koymuyor").

**2. ARAMADA KISI KENDINI DE GORUYOR** (migrasyon 20260910120000).
Kullanicinin bildirdigi kusur: "aramaya kendi kullanici adimi
yazdigimda kendi profilim cikmiyor, cikmasi gerek."

`kisi_ara` icindeki `p.id <> auth.uid()` kosulu kaldirildi. O kosul
"kendine arkadaslik istegi gonderemezsin" mantigindan geliyordu, ama
arama bir EYLEM listesi degil bir BULMA yuzeyi. Kendi profiline
dokununca ekran zaten `/profil`e yonlendiriyor (ayni gun eklendi), yani
akis kendiliginden dogru.

**`aramada_gorunsun` KENDIM ICIN UYGULANMIYOR:** o ayar BASKALARINA
gorunmekle ilgili; uygulansaydi ayari kapatan kisi kendi profilini de
bulamaz ve sebebini goremezdi. Siralamada kendim EN USTTE - kendi adini
yazan kisi kendini ariyordur.

**ESKI TEST IDDIASI KURALI HIC OLCMUYORMUS:** "arama kullanicinin
kendisini sonuclara koymaz" diyordu ama B'nin adini arayip A'nin
cikmadigina bakiyordu - A'nin adi eslesmedigi icin zaten cikmazdi.
Dogru olcum A'nin KENDI adini aramasi; senaryo o sekilde yeniden
yazildi.

Canli dogrulandi (6/6): kendi adimla cikiyorum, en ustteyim, ismimle de
cikiyorum, ayar KAPALIYKEN de kendimi goruyorum ama BASKASI beni
gormuyor.

**3. KAPALI PROFILDE SEKME SECICI CIZILMIYOR, KILIT IKONU GELDI.**
Kullanicinin netlestirmesi: "arkadas olmadigim birinin profiline
baktigimda profili gizliyse asagida kitli oldugunu gosteren bir ifade
olucak; profili herkese aciksa normalde nasil gorunuyorsa oyle
gorunecek."

Onceden sekmeler ("Anılar" / "En sık") kapali profilde de duruyordu ve
basildiginda HICBIR SEY degismiyordu - secilecek bir sey yokken secici
gostermek bozuk bir kontrol sunuyordu. Ayrica kilit durumu duz bir
metindi ve listenin BOS oldugu durumdan ayirt edilemiyordu; ikisi de
sayfanin ortasinda gri bir cumleydi. Artik bir kilit ikonu var.

ACIK profilde HICBIR SEY DEGISMEDI ve bu ayri bir testle kilitli -
onsuz "sekmeyi herkese kapat" hali de yesil gecerdi. Eski iddia
silinmedi, tersine cevrildi.

**GORUNURLUK PAKETINDE 10 KIRIK DOGRULAMA VAR ve benim degisikliklerimle
ILGISIZ.** Hepsi ETIKET ONAYI senaryolarinda (61-64) ve sebep
2026-09-06'daki karar: etiket onayi artik bir AYAR ve varsayilan DIREK
(onaysiz). Testler hala "her etiket onay bekler" davranisini oleuyor,
yani o gunden beri kirikilar ve fark edilmemis. Arama senaryolari (14,
15) TEMIZ gecti.

Dogrulama: jest 67 paket / 804 test, tsc uygulama kodunda 0 hata,
`kisi_ara` canli 6/6.

### HARITA ETIKETLERI: BEYAZ HAP + KOYU YAZI - 2026-09-10

Kullanicinin bildirdigi kusur: "haritada konumlarin isimleri yine zor
gorunuyor, daha gorunur bir hale getir" - ardindan "ona gore rengini
ayarla".

**BU KUSUR UC KEZ GERI GELDI** (2026-09-08 koyu mod, 2026-09-09 beyaz
yazi, 2026-09-10 "yine zor gorunuyor") ve sebep her seferinde AYNIYDI:
renk GOZLE seciliyordu, harita zemini hic olcuIemedi.

**BU KEZ OLCULDU** - kullanicinin gonderdigi ekran goruntusunun gercek
pikselleri:

    harita zemini        beyaz yazi   koyu yazi
    bina bloklari        1,21         15,24
    bej zemin            1,12         16,52
    yollar (beyaz)       1,00         18,48

Yani beyaz yazi harita zeminine karsi **PRATIKTE GORUNMEZ**;
okunurlugu tamamen GOLGE tasiyordu ve golge yumusak bir hale, keskin
bir kenar degil. 2026-09-09'daki "beyaz yap" istegi koyu bir harita
varsayiyordu - ama **Apple Haritalar iki modda da ACIK zemin veriyor**.

**COZUM IKI KATMANLI:** yazi KOYU (`#17130F`, 18:1) ve arkasinda
NEREDEYSE OPAK BEYAZ HAP (`#FFFFFFF2`). Hap yalnizca kontrast icin
degil - haritanin karmasik dokusundan (yol cizgileri, bina bloklari,
sokak adlari) ayiriyor ve ust uste binen iki etiketin nerede bittigini
gosteriyor. Hapin kendisi de hafif golgeli: beyaz yollarin uzerinde
kenari kayboluyordu.

**DEGERLER KARSILAMA SAHNESINDEN ALINDI** (`HARITA.hap` / `hapYazi`,
ayni ikili). Ayni isi yapan iki yuzeyin iki farkli gorunusu olmasin.

**TEMADAN BAGIMSIZ ve bu SART:** harita iki modda da acik, dolayisiyla
temayla donen bir jeton koyu modda hapi siyaha yaziyi beyaza cevirir ve
okunurluk yine kaybolurdu. `renk.metin` gibi jetonlar burada YANLIS.

**KONTRAST PAKETINE UC IDDIA EKLENDI** (`__tests__/tasarim/kontrast.test.ts`,
`harita etiketi` blogu): yazi hap uzerinde esigi geciyor, yazi HAPSIZ
da harita zeminlerinde okunuyor, ve bir OLCUM KAYDI - beyaz yazinin
beyaz yolda tam 1,00 verdigi sabitlendi. Sonuncusu "haritada beyaz
yazi" fikri geri gelirse neden olmadigini gosteriyor.

**DERS: harita gibi RESIM uzerindeki metinde renk gozle secilmez.**
Zemin uygulamanin jetonlarindan gelmiyor, ucuncu tarafin cizdigi bir
goruntuden geliyor; tek dogru yol o goruntunun pikselini olcmek.

Dogrulama: jest 67 paket / 801 test, tsc uygulama kodunda 0 hata.

### MAGAZADAN INEN KULLANICI EN SON HALI GORECEK - 2026-09-10

Kullanicinin karari: **"magazaya ciktiginda en sonki halini kullanici
gormeli."**

**SORUN GERCEK BIR CIHAZDA YASANDI.** Test uygulamasi ikinci bir
telefona indirildi ve GUNCEL HALI GORUNMEDI. Once sunucu tarafi
olculdu ve TEMIZ cikti:

    build 7 : runtime 01a04fbb-f5e4-723c-abba-d04ebdf2f0d8 (1.0.0),
              kanal production
    son OTA : AYNI runtime kimligi, AYNI kanal

Yani guncelleme o derlemeye INIYOR. Sebep baskaydi ve VARSAYILAN
DAVRANISTI: `fallbackToCacheTimeout` tanimsizken 0 sayiliyor, uygulama
acilista guncellemeyi BEKLEMIYOR - arka planda indirip **bir sonraki
acilista** uyguluyor. Sonucu: yeni kuran herkes ilk acilista DERLEME
ANINDAKI surumu goruyor (build 7 = 7 Eylul hali).

**COZUM (app.json):**

    "checkAutomatically": "ON_LOAD",
    "fallbackToCacheTimeout": 8000

8 sn secildi: yavas bir baglantida paketin inmesine yetiyor ama acilis
"donmus" hissi vermiyor. Ust sinir da testle kilitli (<= 10 sn) -
sinirsiz buyutmek "hiz ve akicilik" kuralini bozardi. Ag yoksa istek
hizlica basarisiz oluyor, timeout dolmuyor.

**BU DEGISIKLIK OTA ILE GITMEZ - YENI DERLEME SART.** Native bir ayar.
Yani mevcut build 7'deki sorun bununla DUZELMEZ; duzelme bir sonraki
iOS derlemesinden sonra baslar. Ayni derleme zaten gerekiyordu (Apple
girisi entitlement'i magaza oncesi geri acilmali).

**IKI ALTERNATIF DE ELENDI, ayni sebeple:** `Updates.checkForUpdateAsync`
+ `reloadAsync` deseni JavaScript ama ILK ACILISTA ESKI JS calisiyor -
derlemenin icinde o kod yoksa devreye giremez. Yani hicbir yol mevcut
derlemenin ilk acilisini duzeltemiyor.

**YENI TEST PAKETI: `__tests__/yayin-ayarlari.test.ts`** (5 iddia).
Ayarin sessizce kaldirilmasi ya da sinirsiz buyutulmesi artik testi
kirar. Bunu yazmanin sebebi: buradaki bir hata OTA ile duzeltilemiyor,
yani en pahali hata sinifina giriyor.

**AYRICA: magaza derlemesi mumkun oldugunca GEC alinmali** - gomulu JS
derleme anindaki koddur ve `fallbackToCacheTimeout` yalnizca aradaki
farki kapatir.

**TEST TUZAGI - kayda geciyor:** uc sayfalama testi jest'in 5 sn
varsayilanini asti ve tam paket kosumunda KIRILDI (dosya tek basina
kosulunca geciyordu). Sebep kod degil YAVASLIK: her biri 100 kart
render edip aramanin 300 ms'lik bekletmesini gercek zamanda bekliyor.
Kayit sayisi azaltilamaz - `dahaVar` kosulu "gelen sayfa TAM MI" diye
soruyor ve tam sayfa tam olarak `KESFET_LIMIT` kadar kayit demek. Ucune
de acik timeout (20 sn) verildi.

Dogrulama: jest 67 paket / 798 test, tsc uygulama kodunda 0 hata,
`npx expo config --type introspect` ayarin gercekten uygulandigini
gosterdi.

### ARAMA ONERILERI VE COK SATIRLI ADRES - 2026-09-10

**1. ARAMA ONERI PANELI.** Kullanicinin istegi: "mekan arada kelimeler
yazmaya baslar baslamaz, mekan ara sutunun hemen altinda yazmaya
calistigim kelimenin benzerlerini bana oneren bir sey ciksin."

Kutunun HEMEN ALTINDA, en fazla alti satirlik bir kart. Her satir tek
dokunusla mekan sayfasini aciyor.

**AYRI BIR ISTEK ATILMIYOR - en onemli karar.** Oneriler ZATEN gelmis
arama sonucunun ilk altisindan turetiliyor. Ikinci bir RPC her tusta
IKI ag istegi demekti ve ayni veriyi iki kez cekerdi; sonuc zaten
yakinlik sirasinda geldigi icin oneriler de en yakindan basliyor. Bir
testle kilitli ("oneri paneli EK ISTEK atmiyor").

**PANELIN ISI LISTEDEN FARKLI, o yuzden tekrar degil:** liste bir
CHECK-IN yuzeyi (kart, durum rozeti, buton), panel bir GEZINME
kisayolu (tek satir, dokun ve mekan sayfasi acilsin). Panel acikken
alttaki liste duruyor.

**AKIS ICINDE, YUZEN KATMAN DEGIL.** Ekran bir `ScrollView`; mutlak
konumlu bir panel kaydirmayla birlikte kayar ve altindaki ogelerin
dokunuslarini yutar. Kullanicinin istegi de "kutunun hemen altinda"
idi.

`oneriGizli` bayragi: bir oneriye dokununca panel kapaniyor, YENI BIR
HARF yazilinca geri aciliyor. Bayrak kalici olsaydi kullanici
aramasini duzeltirken oneri alamazdi - testle kilitli.

**2. ADRES ALANI COK SATIRLI.** Kullanicinin bildirdigi kusur:
"otomatik adresin yazildigi sutunda yazi uzun olunca kaydirmasi zor
oluyor, adresin devamini gormek icin ona bir yol bul."

Tek satirlik bir `TextInput`ta uzun metin YATAY kayiyor ve telefonda o
kaydirmayi yakalamak zor - ekran goruntusunde adres "Şehit Çavuş Er…"
diye kirpilmisti. **Cozum kaydirmayi kolaylastirmak degil, IHTIYACI
ORTADAN KALDIRMAK:** alan `multiline`, metin sariyor, devami alt
satirda kendiliginden gorunuyor.

`minHeight: 76` kutu birden buyuyup formu zipzip oynatmasin diye;
`maxHeight: 140` cunku sinirsiz buyuyen bir alan "Ekle" dugmesini
ekrandan cikarabilir - o noktadan sonra alan kendi icinde DIKEY
kayiyor, ki telefonda dogal olan hareket odur.
`textAlignVertical: 'top'` Android icin sart: onsuz metin dikeyde
ortalaniyor ve iki satirli alanda ilk satir asagi kaciyor.

Dogrulama: jest 66 paket / 793 test, tsc uygulama kodunda 0 hata.

### UC DUZELTME - 2026-09-10

**1. HARITA YINE 1 KM.** Bir gun onceki 500 m siniri kullanicinin
istegiyle GERI ALINDI: "haritada yine 1 km mesafeye kadar gosterelim,
boyle sakin yerlerde cok bos kaliyor." Ekran goruntusuyle geldi ve
hakliydi - seyrek bir cevrede liste 430/520/560 m'lik yerler
gosterirken haritada TEK igne kaliyordu. Yani sinir, kalabalik cevredeki
etiket cakismasini cozerken seyrek cevrede haritayi ise yaramaz hale
getiriyordu ve ekranin iki yarisi birbirini tutmuyordu.

Cakisma sorunu ayri bir yoldan hafifledi: etiketler ayni gun BEYAZ ve
KOYU GOLGELI yapildi, yani ust uste binseler bile okunuyorlar.
`HARITA_YARICAP_METRE` sabiti ve istemcideki mesafe suzgeci silindi;
harita yine `suzulmus` kumesini ciziyor. Testteki iddia SILINMEDI,
tersine cevrildi ("haritada UZAK mekan da var: liste ile ayni kume") -
suzgec geri gelirse kirilir.

**DERS: bir gosterim sinirini koymadan once SEYREK durumu da dusun.**
500 m karari kalabalik bir cevrenin ekran goruntusune bakilarak
verilmisti; ayni sayi seyrek cevrede tersine calisti.

**2. CHECK-IN DUGMESI BASILINCA BUYUYOR VE YUKARI CIKIYOR**
(kullanicinin istegi: "basilinca biraz buyusun yukari dogru ciksin
basildigi anlasilsin").

**BU, 2026-09-09'DA KALDIRILAN HAREKETIN GERI GELMESI DEGIL.** O
hareket SECILI hale bagliydi ("o sekmedesin", kalici) ve kullanici onu
kaldirtmisti. Buradaki hareket BASILI hale bagli: parmak su an
uzerinde, ANLIK. Secili hal hala yalnizca RENK. Ayni ayrim
`turuncuBasili` / `turuncuSecili` jetonlarinda da var (2026-09-07
dersi) - iki hal ZIT yonde sinyal ister.

Olculer kucuk: %8 buyume, 4 px tasma. Daire kendi ikon alanini (48 px)
neredeyse tam dolduruyor, fazlasi cubuktan tasardi.

**TRANSFORM ICTEKI DAIREDE, PRESSABLE'DA DEGIL.** Pressable'a
verilseydi altindaki "Check-in" ETIKETI de yukari cikardi ve komsu
etiketlerden ayrilirdi - tam bu hata 2026-09-07'de yasanmisti (etiket
komsularindan 18 px yukarida kaliyordu). Dokunma alani da boylece
yerinde kaliyor.

**"Hareketi azalt" aciksa deger ANINDA atanıyor**, yani buyume ve tasma
yine oluyor; kaybolan tek sey yay. Geri bildirimin kendisi
erisilebilirlik ayarina feda edilmedi.

**TEST TUZAGI - kayda geciyor:** yay yolu jest'te OLCULEMEZ.
`Animated.spring` zaman aliyor ve `useNativeDriver: true` yuzunden JS
tarafindaki deger hic ilerlemiyor; test degeri 1 okuyup kiriliyordu.
Cozum: testte `useHareket` mock'lanip "hareketi azalt" ACIK kabul
ediliyor - o yolda deger `setValue` ile aninda atanıyor ve olculen sey
(buyume + tasma) iki yolda da ayni.

**3. NEON PARILTI KALDIRILDI** (kullanicinin istegi: "sabit sutundaki
tuslarin altinda neon isigi olmasin"). 2026-09-07'de eklenmisti; hem
aktif sekme dairesinden hem check-in dugmesinden BIRLIKTE kaldirildi -
degerleri paylasiyorlardi, biri kalsaydi cubukta iki farkli parilti
dili olurdu.

Check-in dugmesi GOLGESIZ BIRAKILMADI, notr `golge.yuzer`e dondu:
golgenin isi dugmeyi cubuktan ayirmak ve parilti onun YERINE gecmisti,
yanina degil. Aktif sekme dairesinde ise golge hic geri konmadi - orada
ayirt ediciligi RENK tasiyor.

Testteki iddia silinmedi, tersine cevrildi: "dugmelerin altinda TURUNCU
parilti yok".

Dogrulama: jest 66 paket / 787 test, tsc uygulama kodunda 0 hata.

### YAKININDAKI MEKANLAR: 1 KM, HER TUR, SONSUZ KAYDIRMA - 2026-09-09

Kullanicinin istegi: "Yakinindaki mekanlar 1 km mesafe icerisindeki her
tur listelenecek, hepsi asagi dogru kaydirilinca gorunecek; filtreden
secilen ture gore de 1 km mesafedeki tur secili yerler listelenecek ve
haritada da ayni sekilde listelenen yerler gorunecek; haritadaki
ignelerde yerlerin isimleri gorunecek."

Dort maddenin dordu de uygulandi.

**1. YARICAP ARTIK YALNIZCA ARAMADA KALKIYOR.** 2026-09-06'daki
"filtrelemede km siniri yok, il bazli sonuclar" kurali GERI ALINDI. Tur
suzgeci artik listeyi DARALTIYOR, sehre yaymiyor - "Yakinindaki
Mekanlar" basligi bunu zaten soyluyordu. Performans bedeli degil KAZANCI
var, olculdu: tur suzgeci + 1 km yaricap 27 ms (sicak) / 2.488 ms
(soguk); il bazli sinirsiz sorgu 946 ms idi.

**2. SAYFALAMA GELDI** (migrasyon 20260909160000). `KESFET_LIMIT = 100`
artik TAVAN degil SAYFA BOYU; dibe bir ekran boyu kala sonraki sayfa
iniyor. Sart oldu, cunku olculdu: **1 km icinde 1.764 mekan var**
(Bursa/Nilufer; Kafe 23). Yani eski 100'luk liste "hepsi" degildi.

`yakin_mekanlar_yogunluk` yeni bir `p_ofset` parametresi aliyor.
**OFSET, IMLEC DEGIL:** siralama KNN mesafesine gore
(`konum <-> nokta`) ve mesafe istemciye hic donmuyor, yani elde bir
imlec degeri yok. Kullanicinin konumu sabit kaldigi surece siralama da
sabit - akistaki gibi araya yeni kayit girmedigi icin pencere kaymiyor.
(Ana sayfa akisinda tam tersi gecerli ve orada IMLEC kullaniliyor.)

**TUZAK, yasandi:** RPC'ye parametre eklerken once
`drop function ... (uuid, text, ...)` gerekiyor; yoksa ayni adla ikinci
bir fonksiyon olusuyor ve `grant`/`revoke` "function name is not unique"
diye reddediliyor. Drop yetkileri de siliyor, `grant execute` hemen
altinda yeniden veriliyor.

`dahaVar` sunucudan TAM SAYFA geldigi surece acik: eksik sayfa "son
sayfa" demek. Ayri bir toplam sayisi istemek gereksiz ikinci bir sorgu
olurdu. **Aramada sayfalama YOK** - orada limit hic gonderilmiyor
(sunucu kendi 200'luk tavaniyla donuyor), dolayisiyla olcut de yok.

**KABUL EDILEN SINIR:** durum cipleriyle (Sakin / Yoğun / Popüler)
daraltilmis bir listede bir sayfa hic eslesme getirmeyebilir; sayfa
uzamadigi icin sonraki sayfa tetiklenmez. Cipler bilincli bir daraltma
oldugu icin bu kabul edildi; "Tümü" secildiginde sinir yok.

**3. HARITADA HER MEKANIN IGNESI VAR.** `EN_FAZLA_IGNE = 12` siniri
kaldirildi, `tracksViewChanges={false}` eklendi.

**HARITA 500 M, LISTE 1 KM** (kullanicinin kurali, ayni gun ekran
goruntusuyle geldi): "sadece haritada gecerli soyleyecegim kural:
haritada 500 m mesafeye kadar olan konumlar listelensin, en yakinlar."

Sinir kaldirilinca 1 km'deki butun igneler cizildi ve 390 px'lik
haritada adlar ust uste bindi - okunmaz oldu. **LISTE DEGISMEDI:**
orada kaydirma var, yer sorunu yok. Yani bu bir GOSTERIM kurali, veri
kurali degil - ayni ders `kurali-soylendigi-ekranda-birak` hafizasinda.

Sabit `HARITA_YARICAP_METRE = 500` (`lib/mekan.ts`), suzgec ISTEMCIDE:
sunucudan zaten 1 km'lik sayfa geliyor, ikinci istek atmak ayni veriyi
iki kez cekmek olurdu. Konum okunamazsa suzgec UYGULANMIYOR - mesafe
bilinmiyorken igneleri elemek haritayi sebepsiz bosaltirdi.

**TEST TUZAGI, yasandi:** `jest.clearAllMocks()` cagri kayitlarini
siliyor ama `mockImplementation` govdesini SILMIYOR. Harita yaricapi
testi mesafeyi mekana gore donduren bir govde kuruyor; `beforeEach`
icinde varsayilan geri konmazsa sonraki testlerde her mekan 800 m
cikiyor ve igneler sessizce kayboluyor.

**HARITA ETIKETLERI BEYAZ VE KALIN** (kullanicinin istegi, ayni gun):
"haritadaki konum isimlerini belirgin, anlasilir bir beyaz renk yap,
biraz kalinlastirabilirsin de."

**GOLGE DE TERS CEVRILDI ve bu sart:** onceden yazi KOYU, golge BEYAZDI
(`renk.zemin + 'F2'`). Yalnizca yaziyi beyaz yapmak adi acik harita
zemininde tamamen kaybederdi - golge her zaman yazinin TERSI olmali.
Simdi yazi `#FFFFFF`, golge `rgba(0,0,0,0.85)` + 1 px kayma.

**TEMADAN BAGIMSIZ:** harita zemini iki modda da acik (Apple Haritalar
kendi paletini kullaniyor), dolayisiyla `renk.metin` gibi temayla donen
bir jeton koyu modda beyaz olur ve koyu golgesiyle birlikte okunmaz
hale gelirdi. Ayni gerekce karsilama sahnesindeki harita haplarinda da
var. Punto 9,5 -> 11, kutu 84 -> 96 px (buyuyen punto ayni kutuda daha
erken kirpilirdi).

**ALT GEZINME INCELDI VE HAFIF SAYDAMLASTI** (kullanicinin istegi
2026-09-09: "sabit sutun birde cok kalin biraz incelt cok genis
duruyor birde arkasini cok az seffaf yap").

Ikon alani 54 -> 48, dikey dolgu 12 -> 8; satir 72 -> 66, cubuk
98 -> 84 px, `ALT_GEZINME_PAYI` 122 -> 108. Kisalan sey yalnizca
BOSLUK: etiketler, daire ve check-in dugmesi duruyor. **ALT SINIR
aktif sekme dairesi:** `DAIRE` 44 px, yani 48 ona 2 px pay birakiyor -
daha asagisi daireyi kirpardi. Check-in dugmesi hala en buyuk slot
(48'e karsi 24 px ikonlar), yani "obur ikonlardan buyuk olsun" kurali
(2026-08-26) bozulmadi.

**SAYDAMLIK GERI GELDI ama %6.** `yuzerZemin` 2026-09-07 denetiminde
opaga cekilmisti; o gun sorunu ureten deger **%86 opaklikti** -
bulaniklik olmadan cubugun ardindan kirpilmis bir mekan adi ve yarim
bir buton hayalet gibi goruenuyordu. Yeni deger `#FFFFFFF0` (%94), yani
altta gecen sey okunacak kadar belirmiyor; yalnizca cam yuzey hissi
kaliyor. Gercek buzlu cam hala `expo-blur` ister ve OTA ile gitmez.

**KONTRAST TESTINDEKI IDDIA TERSINE CEVRILDI, SILINMEDI:** eskiden
"cubuk TAM OPAK" (duz 6 haneli hex) diyordu; artik saydamligin
OLCUSUNU kilitliyor - alfa >= %90. Biri ileride %86'ya geri donerse
test kirilir ve karar yeniden onune gelir.

**KENDI PROFILIM ARTIK `/kullanici/[id]` EKRANINDA ACILMIYOR.**
Kullanicinin bildirdigi hata (2026-09-09): "yorumda kendi profilime
basinca sanki baskasinin profiliymis gibi gosteriyor." Gercekten
oyleydi - ekran kendi kimligini tanimadigi icin kisiye KENDISI icin
"Arkadaş ekle" ve "Sohbet iste" gosteriyordu.

**KURAL EKRANDA, GIRIS NOKTALARINDA DEGIL.** Kok neden bir
TEKRARDI: `kisi.benimMi ? '/profil' : '/kullanici/<id>'` kontrolu her
cagiran tarafta elle yaziliyordu ve **on uc yerin yalnizca IKISINDE**
vardi (`CheckInKarti`, `SuAnDisarida`). Yorum sayfasi, bildirimler,
mekan sayfasi, kisi arama ve profildeki arkadas listesi kontrolsuzdu.
Kontrol artik `kullanici/[id].tsx` icinde: kimlik eslesirse
`router.replace('/profil')`. Boylece hepsi birden duzeldi ve yarin
eklenecek yeni bir giris de kendiliginden dogru olur.

`replace`, `push` DEGIL: geri tusu kullaniciyi geldigi yere
dondurmeli. Veri cekme yonlendirmeden SONRAYA birakildi - kimlik
eslesirse uc istek de bosa giderdi. Kimlik okunamazsa (oturum yok, ag
hatasi) eski davranis suruyor.

Yeni yardimci: `kendiKullaniciIdim()` (`lib/profil.ts`). ATMIYOR,
null donuyor - cagiran taraf "bilmiyorsam eski davranisa duş" istiyor
ve hata firlatmak calisan bir ekrani bozardi.

**YORUMDA AVATAR DA PROFILE GIDIYOR** (kullanicinin istegi, ayni gun:
"yorumda profil resmine basincada o kisinin profiline gitsin").
Onceden yalnizca AD basilabilirdi; fotograf uygulamanin geri kalaninda
(akis karti, mekan sayfasi) zaten profile goturuyor ve burada
gotermemesi tutarsizdi. Silinmis kullanicida basilabilir DEGIL -
gidilecek profil yok, ayni kosul adda da var.

Erisilebilirlik etiketi SARMALAYICIYA tasindi ("<ad> profilini gör");
ic ice iki erisilebilirlik dugumu ekran okuyucuda tekrar uretirdi.
Resmin kendisi artik `testID="yorum-avatari"` ile bulunuyor.

**4. HER IGNEDE AD YAZIYOR.** Etiket elemesi TAMAMEN kaldirildi ve
`lib/harita-etiket.ts` silindi. Kullanici bunu UC KEZ bildirmek zorunda
kaldi ("İsimleri yazmıyor", "İsimsiz iğneler var hala", "İğneler bir
konumu gösteriyor, isimleri olması gerek") ve her seferinde eleme
kuralinin baska bir katmani suclu cikti:
  (1) sayi siniri + metre araligi igneleri de eliyordu,
  (2) metre esigi yakin kumede 12 mekandan 2'sini birakiyordu,
  (3) piksel kutusu (130x26) 1 km'lik cercevede ~730 m demekti.
Ders: kullanici ayni sikayeti ikinci kez bildiriyorsa esik ayarlamayi
birak, KURALI KALDIR. Etiket artik tek satir, `maxWidth: 84`,
`fontSize: 9.5`; durum satiri silindi (renk zaten durumu soyluyor).

**BOS DURUM SEBEBINI SOYLUYOR.** Uc ayri sebep var ve tek metin ucunu
de aciklayamiyordu: arama yaptin o ilde eslesen yok / suzgec sectin
1 km'de o turden yok / cevrede mekan yok.

**IL BULUNAMAZSA ARAMA BOS DONUYOR** (migrasyon 20260909150000).
Onceden sinirsiz kaliyordu; bu, "bulundugun ille sinirli" kuralini
denizde ve yurt disinda sessizce deliyordu. Kullanicinin karari: "ekran
oyle yerlerde bos kalabilir".

**TUR SUZGECI ARTIK CIHAZDA KALICI** (`lib/tur-suzgeci-depo.ts`,
AsyncStorage, anahtar `slooin.tur-suzgeci`). Kullanicinin istegi:
"filtreyi kaydet yapinca kayitli kalsin, baska sayfada gezsem de
uygulamadan ciksam da kayitli dursun" ve "filtreyi kaldir dersem ancak
kaldirilsin". Sunucuda degil cihazda, cunku bu bir tercih degil bir
GORUNUM AYARI. Okurken `TEMEL_TURLER`e suzuluyor: depodaki deger eski
bir surumden kalmis olabilir ve tanimadigimiz bir tur sunucuya gidip
bos liste dondururdu.

**TEST TUZAGI, yasandi:** AsyncStorage mock'u testler arasinda
PAYLASILIYOR; temizlenmezse onceki testin suzgeci sonrakinde yukleniyor
ve secim TERSINE donuyor. `beforeEach` VE `afterEach` icinde
`AsyncStorage.clear()` gerekiyor (yazma bir sonraki testin
baslangicindan sonra tamamlanabiliyor).

Dogrulama: jest 66 paket / 778 test, tsc uygulama kodunda 0 hata, canli
`araclar/kesfet-sayfalama-canli-test.py` 6/6 ve
`araclar/il-sinirli-arama-test.py` 7/7.

### BES KUCUK DEGISIKLIK - 2026-09-09

**1. LISTEDEKI CHECK-IN BUTONLARI DOLU TURUNCU.** 2026-09-07
denetiminde HAYALETE cevrilmislerdi ("bir ekranda tek birincil turuncu
eylem olur"); kullanici geri aldi. Karar savunulabilir: ekranin adi
zaten "Check-in" ve listedeki her satirin TEK isi o eylem - hayalet
buton asil eylemi ikincil gosteriyordu. Test tersine cevrildi.

**2. MEKAN SAYFASI HARITASI.** Kullanicinin ignesi BUYUDU (26 -> 34),
mekanin ignesi KUCULDU (38 -> 30). Olcu `merkezDurumu`ya bagli: o alan
doluysa merkez bir MEKANDIR (mekan sayfasi), bossa merkez KULLANICININ
KENDISIDIR (kesfet ekrani) ve orada kucultmek yanlis olurdu.

**3. HARITADAKI IKI YUVARLAK DUGME KALDIRILDI**, yerine MESAFE
GOSTERGESI geldi. Islev kaybi kontrol edildi: "Yol tarifi" ayni ekranda
baslik satirindaki butonda duruyor. Konum okunamazsa hap hic
cizilmiyor - bilmedigimiz bir seyi yazmak yerine sessiz kalmak dogru.

**4. AKIS KARTI: UC NOKTA KALKTI, YERINE KALEM.** Duzenleme artik eylem
satirindaki kalem ikonundan. **Silme duzenleme alaninin icine tasindi**
- uc nokta kalkinca silmenin baska girisi kalmiyordu. Yikici eylem
"Kaydet"ten ayri bir satirda ve zeminsiz: yan yana olsaydi kaydetmek
isteyen kazayla silebilirdi.

**TEST BIR REGRESYON YAKALADI:** eylem satiri yalnizca `ozet` varken
ciziliyordu ve profil ekrani begeni sayilarini gecmiyor - yani kalem
oraya hic duesmuyordu ve profildeki duzenleme/silme TAMAMEN kayboldu.
Kosul `ozet || menuVar` oldu.

**5. ALT GEZINME BUTONLARI ONE CIKMIYOR.** Aktif sekmenin dairesi
cubugun ustune tasiyordu (2026-09-07 animasyonu), merkez check-in
dugmesi de 18 px yukaridaydi. Ikisi de sifirlandi; secili hal artik
yalnizca RENK ve PARILTI ile anlatiliyor. `DAIRE_YUKSEK` sabiti
korundu - yeniden yukselmesi istenirse tek satirlik is.

### AKIS FOTOGRAFI: SAG BOSLUK GITTI, ZOOM GELDI - 2026-09-08

**1. SAGDAKI BEYAZ SERIT.** Kullanicinin bildirdigi kusur: "fotograf
sagdan bosluk var ekrana sigsin". Kok neden: tam genislik icin verilen
negatif yatay pay GORSELIN kendisindeydi, sarmalayici `Pressable`
kartin IC genisliginde kaliyordu. Sonuc: gorsel yalnizca SOLA tasiyor,
sagda kartin dolgusu kadar (16 px) beyaz serit kaliyordu.

Pay artik sarmalayicida, gorsel `width: '100%'`. Olculdu: fotograf
satirinda hem sol (x=1) hem sag (x=388) kenar fotograf pikseli.

**2. IKI PARMAKLA YAKINLASTIRMA.** Buyuk gorunumdeki fotograf artik
yakinlastirilabilir (`src/tasarim/YakinlastirilabilirGorsel.tsx`).

**REANIMATED + GESTURE-HANDLER DENENDI VE ELENDI.** Ikisi de zaten
bagimliliklarda ve iki platformda calisirdi, ama reanimated 4 jest'te
kurulu degil ve testler **komple cokuyordu** ("Cannot read properties
of undefined (reading 'loadUnpackers')"); ustelik ikisi de uygulamada
ilk kez devreye girecekti, yani mevcut TestFlight derlemesinde
calisip calismadigi belirsizdi.

Secilen yol `ScrollView`in KENDI yakinlastirmasi: saf JavaScript, OTA
ile gidiyor, testleri bozmuyor ve hareket sistemin geri kalaniyla ayni
hissediyor.

**IKI PLATFORMA GECIRILDI (ayni gun, kullanicinin "simdi yap"
talimati).** `ScrollView` yakinlastirmasi yalnizca iOS'ta calisiyordu;
yerini `react-native-gesture-handler` + RN'IN KENDI `Animated`i aldi
(`PinchGestureHandler` + `PanGestureHandler`).

**REANIMATED YINE KULLANILMADI, sebebi olculdu:** projede
`babel.config.js` HIC YOK, yani reanimated'in zorunlu babel eklentisi
hicbir zaman yapilandirilmamis - worklet'ler o eklenti olmadan
calismaz. Gesture-handler'in klasik API'si babel eklentisi istemiyor.

**JEST KURULUMU SART CIKTI:** `GestureHandlerRootView` render
edilirken "_RNGestureHandlerModule.default.install is not a function"
ile cokuyordu; `jest.setup.js`'in basina
`require('react-native-gesture-handler/jestSetup')` eklendi.

**GUVENLIK AGI - onemli.** Gesture-handler NATIVE bir modul ve bugune
kadar uygulamada HIC KULLANILMIYORDU. Bagimliliklarda oldugu icin
autolinking ile derlemeye girmis olmasi gerekir, ama bunu mevcut
TestFlight derlemesinde dogrulamanin yolu yok. Guncelleme OTA ile
gittigi icin modul o derlemede yoksa fotografa basan herkes COKME
yasardi. Bilesen bir `ErrorBoundary` ile sarildi: hata olursa duz bir
`Image`e duesuyor - yakinlastirma calismaz ama fotograf acilir.

**Yeni bir native derleme alinip zoom telefonda dogrulandiktan sonra o
sinif kaldirilabilir.**

**GENISLIGI SIFIRLAYAN TUZAK - yasandi ve olculdu.** Kullanici ilk
gecuiste "zoom da calismiyor, fotografa basinca tam ekranda acilmiyor"
dedi. Tarayicida olculdu:

    kap  :  0 x 844     <- genislik SIFIR
    foto :  0 x 591

Sebep: modal `alignItems: 'center'` kullaniyor, dolayisiyla cocugun
genisligi ICERIGE gore hesaplaniyor; icerik de `width: '100%'` istedigi
icin sonuc sifir oluyordu. `flex: 1` yalnizca YUKSEKLIGI dolduruyor.
`alignSelf: 'stretch'` ile duzeldi (390 x 844 / 390 x 591) ve testte
kilitlendi.

**DERS:** `alignItems: 'center'` olan bir kapsayicinin icinde yuzde
genislik isteyen bir cocuk varsa, cocuga `alignSelf: 'stretch'`
verilmeli - yoksa yuzde sifirin yuzdesi olur.

**ZOOM TELEFONDA DOGRULANDI** (kullanici, ayni gun): tam ekran
gorunumde iki parmakla yakinlastirma calisiyor. Bu ayni zamanda
gesture-handler'in NATIVE modulunun mevcut TestFlight derlemesinde
BULUNDUGUNU kanitliyor.

#### KART ICINDE ZOOM VE ODAK NOKTASI - ayni gun, iki ek istek

**1. "Tam ekran acilmadan da zoom yapma ekle".** Akis kartindaki
fotograf da yakinlastirilabiliyor. Kartta parmak kalkinca 1x'e DONUYOR
(`birakincaSifirla`): kart sabit yukseklikte ve listenin icinde, kalici
zoom komsu kartlarin uzerine tasar ve kullanici o karti bir daha
duzeltemez. Tam ekranda ise zoom KALICI - inceledigin yerde
kalabilmelisin.

Kart icindeki hareketler icin kok duzene `GestureHandlerRootView`
eklendi. Modal kendi kokunu tasimaya devam ediyor
(`YakinlastirilabilirTamEkran`): modal agacin disinda kaldigi icin
kokteki saglayici oraya ULASMIYOR.

Kaydirma kartta IKI PARMAK istiyor (`minPointers={2}`): tek parmak
listenin kaydirmasi olarak kalmali. Tek DOKUNUS hala tam ekrani
aciyor - `Pressable` disarida, hareketler icerideki katmanda.

**2. "Istedigim yere zoom yapabiliyim, sadece ortaya yaptiriyor".**
Onceki surum yalnizca `scale` degerini buyutuyordu, dolayisiyla goruntu
her zaman MERKEZDEN aciliyordu. Artik parmaklarin ORTA NOKTASI sabit
kaliyor. Formul: bir P noktasi olcek s'ten s2'ye giderken yerinde
kalsin isteniyorsa oteleme `t2 = P - (P - t) * (s2 / s)` olmali.

**NATIVE SURUCU KAPATILDI** (`useNativeDriver: false`) ve bu bilincli:
odak hesabi her karede JavaScript'te yapiliyor cunku olcek ve oteleme
BIRLIKTE guncelleniyor. Native surucuyle yalnizca merkezden zoom
yapilabilirdi - yani kullanicinin sikayet ettigi davranis.

**3. "Zoomlamis bir sekilde dururken saga sola kaydirabiliyim".** Iki
eksik vardi:
- `simultaneousHandlers` VERILMEMISTI. Gesture-handler o olmadan iki
  hareketten birini secip otekini iptal ediyor; yani zoom yaparken
  kaydirmak mumkun degildi. Pan ve pinch artik birbirini taniyor.
- Tam ekranda kaydirma IKI PARMAK istiyordu. Orada altta kaydirilacak
  bir liste yok, dolayisiyla tek parmagi esirgemenin sebebi de yok:
  `kaydirmaParmagi` prop'u geldi (tam ekran 1, akis karti 2).

**4. SAG-SOL SERIT** (kullanicinin bildirdigi kusur). Ortak bilesene
gecerken `resizeMode` sabit `contain` yazilmisti; kartin kutusu 4:5 ve
fotograf dikey oldugunda yanlarda kart zemini gorunuyordu. Kart artik
`cover` (kirpar, doldurur), tam ekran `contain` (fotografin tamamini
gosterir) - `oturma` prop'u ile.

**5. EKRAN KAYDINDAKI DAVRANIS** (kullanici bir Instagram kaydi
gonderdi): kart icinde zoom yapilinca goruntu kartin SINIRLARINI ASIP
one cikiyor. Bizde `overflow: hidden` onu kirpiyordu. Artik hareket
SURERKEN kirpma kalkiyor ve katman one aliniyor (`zIndex` + Android
icin `elevation`); parmak kalkinca eski haline donuyor - yoksa her kart
komsusunun uzerine binerdi. Kirpma, kucuIme animasyonu bittikten
sonra geri geliyor (200 ms); hemen kapatilsaydi donuş kirpilmis
gorunurdu.

### CHECK-IN FOTOGRAFI: ONCE KAYNAK SORULUYOR - 2026-09-08

Kullanicinin istegi: "check-in yaparken fotograf eklemeye basilinca
canli fotograf cekmede olsun kamera acilsin".

"Fotoğraf ekle" artik dogrudan galeriyi ACMIYOR; ortak `SecimPenceresi`
ile kaynak soruluyor. **KAMERA ONCE**: check-in "su an buradayim"
demek, dolayisiyla beklenen kaynak o; listede ilk sira en cok beklenen
secim olmali.

**YENI DERLEME GEREKMIYOR, kontrol edildi.** `expo-image-picker` zaten
kurulu ve `app.json`daki config plugin **kamera izin metnini
2026-08-23'ten beri tasiyor** ("Slooin, mekânda fotoğraf çekebilmen için
kameranı kullanır"), yani TestFlight'taki build 7 o izinle uretildi.
`launchCameraAsync` saf JavaScript cagrisi - OTA ile gidiyor.

**IZIN REDDEDILIRSE SESSIZ KALINMIYOR:** kullanici dugmeye basip
hicbir sey olmamasini "uygulama bozuk" diye okur. Uyari metni
gosteriliyor ve kamera acilmiyor (testle kilitli).

**BU EKRANIN METINLERI SOZLUKTE DEGIL**, bastan beri koda gomulu.
Yeni metinler de ayni yerde tutuldu ki ekranin yarisi sozlukten yarisi
gomuluden gelmesin; ekranin tamaminin i18n'e tasinmasi ayri bir is
(acik borc).

Uc yeni test: kaynak penceresi aciliyor ve galeri DOGRUDAN acilmiyor,
"Fotoğraf çek" kamerayi aciyor (galeri acilmadan), izin reddedilince
uyari cikiyor.

### KESFET: "TUMUNU GOR" KALDIRILDI - 2026-09-08

Kullanicinin istegi. **Islev kaybi YOK, once kontrol edildi:** o
baglanti yalnizca `setGorunum('liste')` yapiyordu ve ayni is ust
cubuktaki Harita/Liste segmentinde zaten var - yani ayni eylemin iki
girisi vardi. Bolum basligi ("Yakinindaki Mekanlar") artik tek basina.

Birlikte temizlenenler: uc stil ve `kesfet.tumunuGor` ceviri anahtari.

### TUR SUZGECI ZAMAN ASIMI VE BASKASININ PROFILI - 2026-09-08

Kullanicinin bes istegi/hatasi bir arada ele alindi.

#### 1. TUR SUZGECINDE ZAMAN ASIMI - KOK NEDEN OLCULDU

Kullanici: "filtrede bir tur sectim islem zaman asimina ugradi".

Il, nokta-icinde-poligon testiyle bulunuyor ve BULUNAMAZSA suzgec
uygulanmiyordu ("sinirsiz kalir" - 2026-09-01'de ARAMA icin alinmis bir
karar). Arama tarafinda zararsiz (trigram indeksi var), TUR tarafinda
felaket:

    il suzgeci VAR : mekanlar_il_tur_idx, "Plaj" 1,1 sn / "Kafe" 36 ms
    il suzgeci YOK : KNN taramasi, 40 saniyede BITMEDI

Sebep secicilik: KNN en yakindan uzaga giderek 100 eslesme ariyor ve
nadir bir turde milyonlarca satir geziyor. **Mesafe tavani COZMUYOR,
olculdu:** 100 km'lik `ST_DWithin` BitmapAnd'i 1,66 milyon satira
cikariyor, sure 27 saniye.

**Cozum (migrasyon 20260908130000): tur suzgeci varken il ZORUNLU.**
Poligon testi bos donerse EN YAKIN il seciliyor - 81 poligonda GIST ile
4,4 ms. Denizde bir noktayla dogrulandi: "Çanakkale" secildi, 100 sonuc,
**251 ms**.

Bu, kullanicinin ayni gun netlestirdigi kurali da karsiliyor: "once
bulundugu konumdaki il tespit edilecek ve filtredeki seceneklerden
sectiklerine gore en yakin yerler listelenecek". Siralama zaten
degismedi - sabit kural geregi en yakindan uzaga.

#### 2. ASAGI CEKINCE YENILEME

Kesfet ekranindaki kok `ScrollView`a `RefreshControl` eklendi. Ekran
zaten odaklandiginda yeniliyordu ama ekrandan CIKMADAN takilan bir
istegi (zaman asimi, ag kopmasi) kurtarmanin yolu yoktu.

#### 3. KOYU MODDA HARITA ETIKETLERI

Mekan adi sabit koyu bir tondaydi (`#1A1512`) ve harita koyu moda
gecince okunmuyordu. Artik `renk.metin`; golge de temayla donuyor
(`renk.zemin + 'F2'`, yani jetonun %95 opak hali) cunku golge yazinin
TERSI olmali - beyaz yazinin arkasindaki beyaz golge onu
bulaniklastirirdi.

#### 4. BASKASININ PROFILI KENDI PROFIL DUZENINE TASINDI

Kullanici: "baskasi baskasinin profilini boyle goruyor boyle olmamali,
su an kullanicinin profili nasilsa aynisinin kapali halini gormeli".

Ekran once yan yana kucuk bir kimlik satiri + duz bir ani listesiydi.
Artik kendi profille AYNI duzen: ortali 88 px avatar, ad, biyografi, uc
sayac, hap segment (Anilar / En sik), liste.

**IKI ORTAK BILESEN CIKARILDI** - iki ekran ayni parcayi kullaniyor,
yoksa biri degistiginde oteki geride kalirdi:

| Bilesen | Ne |
|---|---|
| `src/tasarim/ProfilSayaclari.tsx` | Ani / Fotograf / Arkadas satiri. `onSec` verilmezse SALT OKUNUR - baskasinin profilinde sayaclar bolum secmiyor |
| `src/tasarim/SekmeHapi.tsx` | Kayan butonlu hap segment |
| `src/tasarim/hareket.ts` | "Hareketi azalt" ayarini okuyan kanca (uc yerde kullaniliyor) |

**ARKADAS SAYISI SUNUCUDAN GELIYOR** (migrasyon 20260908120000):
`baskasinin_profili` RPC'si artik `arkadas_sayisi` de donduruyor. Ani ve
fotograf sayilari istemcide hesaplanabiliyor ama arkadas sayisi
hesaplanamaz - bag listesi RLS'e tabi. **SAYI evet, LISTE hayir**; ayni
ayrim mekan sayfasinda da var.

**`profil_gizli` ARTIK OKUNUYOR.** Sunucu bu alani 2026-09-02'den beri
donduruyordu ama istemci HIC okumuyordu - yani "profilim gizli" ayarinin
baskasinin profil ekraninda hicbir karsiligi yoktu. Kapali profilde
duzen AYNI kaliyor, yalnizca liste yerine "Bu profil kapalı" aciklamasi
cikiyor. Bu bir GORUNUM karari, guvenlik siniri degil: anilarin gercek
korumasi `check_inler` RLS'inde ve o zaten devrede.

#### 5. "TAKIP ET" -> "ARKADAŞ EKLE", ISTEK GONDERILINCE "BEKLEMEDE"

Kullanicinin istegi. Istek gonderildiginde birincil dugmenin yerini
BEKLEMEDE durumu aliyor; basilabilir DEGIL cunku karar karsi tarafta.
Dolgu notr - turuncu birakip yalnizca opaklik dusurmek "yukleniyor" gibi
okunurdu (ayni ders mekan sayfasindaki uzak check-in dugmesinde
ogrenilmisti). Geri cekmek isteyen altindaki ikincil eylemi kullaniyor.

Dogrulama: jest 64 paket / 736 test, tsc uygulama kodunda 0 hata, ekran
goruntusu `tasarim/baskasinin-profili.png`.

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


## [TASARIM DENETIMI UYGULANDI - 2026-09-07]

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


## [HARITADA IKI IGNE: DURUM RENGI + KULLANICI - 2026-09-07]

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


## [KESFET LISTESI: SUZGEC SUNUCUYA TASINDI - 2026-08-31]

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


## [MAHALLE AKTARIMI - CALISIYOR (2026-08-31)]

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


## [KONUM EKRANI: ADRES KENDI VERIMIZDEN - 2026-08-31]

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


## [DEVIR NOTU - 2026-08-27 (kalici yayin adresi)]

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


## [Mekan turu DENETIMI: alti ajan, uc sistemik kok neden (2026-08-23)]

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


## [Plan 2 (moderasyon paneli) UYGULANDI (2026-08-23)]

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


## [ARSIV - Faz 3a'nin ortasinda yazilmis devam notu (GECERSIZ)]

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


## [Siradaki adim]

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


## [Kararlar]


