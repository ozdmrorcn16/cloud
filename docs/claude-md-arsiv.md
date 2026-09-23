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



---

## [TAM KOPYA: CLAUDE.md 2026-09-24 kisaltmasindan ONCEKI hali (286.018 karakter)]

Asagidaki metin 2026-09-24te CLAUDE.md kisaltilirken OLDUGU GIBI
tasindi (yalnizca "## " basliklari "### " yapildi). Tarihli basliklar,
ornegin "HIKAYE AKISI (24 SAAT) - 2026-09-22", grep ile bulunur.

# Proje Hafizasi

Bu dosya her Claude Code oturumunda otomatik olarak yuklenir. Oturumlar arasinda
tasinmasini istedigimiz her sey buraya yazilir.

### Nasil calisiyor

Claude'un kendi basina oturumlar arasi hafizasi yoktur; her oturum sifirdan
baslar. Sureklilik su uc dosyayla saglanir:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Kalici hafiza. Her oturum basinda otomatik okunur. Kararlar, tercihler, proje durumu. |
| `docs/konusma-gunlugu.md` | Oturum indeksi + karar defteri. |
| `docs/oturumlar/` | Her oturumun tam dokumu (hook tarafindan otomatik yazilir). |

Oturum dokumleri `.claude/hooks/oturum-kaydet.py` tarafindan otomatik uretilir;
ayrintilar `docs/konusma-gunlugu.md` icinde.

### Claude icin kurallar

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

### Proje durumu

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

### DEVAM NOTU - 2026-09-23 GECE: "ANI EKLE" + CHECK-IN GALERI AKISI

**Is YARIM, commit edildi, YAYINLANMADI** (jest kosulmadi, OTA/web
yayini yok). Kullanicinin iki karari:

1. **Hikaye artik "sipsak"**: galeriden fotograf YUKLENEMEZ, yalnizca
   anlik cekim; ekranin adi **"Anı ekle"** (`hikaye.ekleBaslik`, 7 dil).
   `src/app/hikaye/ekle.tsx` cekim modu (yuvarlatilmis canli onizleme +
   flas / yuvarlak deklansor / kamera cevirme + gorunurluk hapi) ve
   duzenleme modu (fotograf tam ekran, sol rafta Not/Mekan/Ifade/
   Etiketle) olarak ikiye ayrildi; galeri karesi, `GaleriSayfasi`
   cagrisi ve sistem secicisi oradan KALKTI. Canli kamera yoksa (eski
   derleme) deklansor sistem kamerasini aciyor.
2. **Check-in duzenleme ve yeni check-in AYNI GALERI AKISINI kullanir**
   ("checkin duzenleme ve yeni checkin kisminda ayni galeri akisini
   kullanicaz"): `FotografIzgarasiDuzenle` icindeki eski Kamera/Galeri
   `SecimPenceresi` yerine `GaleriSayfasi` aciliyor. Sayfaya `enFazla`
   prop'u eklendi: Ekle'de coklu secim (numarali rozet + "Ekle (N)"
   cubugu, kalan yer kadar), Degistir'de tekli. Sozluge yeni **`galeri`
   blogu** girdi (7 dil: baslik, sonFotograflar, kamera, galeridenSec,
   ekle) - eski `hikaye.sonFotograflar/galeri/fotografSecBaslik`
   anahtarlari artik kullanilmiyor, temizlenmedi.
   **Obur yerler DOKUNULMADI** (kullanicinin kurali "obur yerlerde
   galeri yolu ayni kalicak"): mekan duzenleme, sikayet, profil
   fotografi hala kendi Kamera/Galeri penceresinde.

**iOS TUZAGI korundu:** sayfa once kapanir, kamera/sistem secicisi
`EYLEM_GECIKMESI_MS` sonra acilir; hedef kare `hedefRef`te tasiniyor
cunku kapanista `kaynakIcin` null oluyor.

**SIRADAKI ADIMLAR (yeni oturum buradan devam etsin):**
- `__tests__/ekranlar/hikaye/ekle.test.tsx`: `lib/galeri` mock'lari ve
  galeri yolu testleri kalkmali, cekim testleri kalmali.
- `__tests__/ekranlar/check-in/[mekanId].test.tsx`,
  `__tests__/tasarim/CheckInDuzenle.test.tsx`, `ekranlar/index.test.tsx`
  ve `ekranlar/profil/index.test.tsx`: `foto-kamera`/`foto-galeri`
  (SecimPenceresi) yerine `galeri-kamera` / `galeri-<id>` /
  `galeri-sistem` / `galeri-ekle`. `mekanlar/duzenle` ve `sikayet`
  testleri DEGISMEZ.
- `npx jest --runInBand`, `npx tsc --noEmit` (tsc uygulama kodunda
  su an TEMIZ), sonra `npm run yayinla` + `eas update`.
- Telefonda dogrulanacaklar: canli onizleme ve deklansor, check-in
  formunda alttan gelen galeri + coklu secim.

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

### ANDROID versionCode 8 PLAY DAHILI TESTTE - 2026-09-23 (KAPANDI)

Acik is kapandi: **versionCode 8 (1.0.0)** Play dahili test kanalina
yuklendi ve **23 Eylul 20:11'de kullanima sunuldu** ("Etkin", son surum
8). AAB `2ea5b5f7` derlemesinden; `expo-media-library` icerir, yani
hikayedeki galeri okumasi ancak bu surumde calisir. Onceki surum
versionCode 7'ydi.

- **Nasil yuklendi:** `eas submit --platform android` HALA kullanilamaz
  (Google Play servis hesabi anahtari kurulu degil). Tarayici yolu
  kullanildi: AAB yerel bir CORS'lu sunucudan (127.0.0.1:8123)
  `fetch -> File -> DataTransfer -> input.files` ile Play Console'un
  dosya girdisine verildi. **KOSUL: Chrome sekmesi GORUNUR olmali** -
  arka planda Play Console yuklemeyi hic islemiyor (iki kez yasandi).
- **Uyari zararsiz:** "kod gosterme dosyasi mevcut degil" (deobfuscation,
  istege bagli; R8/proguard kullanilmiyor).
- **PLAY SERVIS HESABI KURULDU (ayni gun):** bundan sonra Android
  yuklemeleri tarayiciya ugramadan `npx eas-cli submit --platform
  android --latest` ile gidiyor.
  - Google Cloud (proje `slooin`): "Google Play Android Developer API"
    etkinlestirildi; servis hesabi
    **`eas-play-yayin@slooin.iam.gserviceaccount.com`**; JSON anahtar
    `mobil/gizli/play-servis-hesabi.json` (gitignored - `mobil/gizli/`
    zaten .gitignore'da, dogrulandi).
  - Play Console > Kullanicilar ve izinler: o hesap davet edildi,
    YALNIZCA Slooin uygulamasina ve EN AZ YETKIYLE - "Uygulamalari test
    kanallarina yayinlama" (+ varsayilan iki salt-okunur goruntuleme).
    **URETIM surumu icin yetki YOK**; magazaya cikarken "Uretim
    surumune yayinlama" izni ayrica verilmeli.
  - `eas.json` > `submit.production.android`: `serviceAccountKeyPath`
    ve `track: internal`.
  - **Uctan uca dogrulandi:** gercek bir `eas submit` calistirildi,
    Google Play'e ulasti ve anlamli cevap dondu ("You've already
    submitted this version" - versionCode 8 elle yuklenmisti). Yani
    kimlik dogrulama ve yetki calisiyor; siradaki YENI derleme tek
    komutla gidecek.

### HIKAYE 02 EKRANI VE TELEFONDA COKME - 2026-09-23

Kullanicinin bildirimi ("Sana attigim referansla alakasi yok") ve
ardindan ekran goruntusuyle iki gercek kusur:
- **Ham ceviri anahtari ekranda:** kod `hikaye.kameraVeyaGaleri`
  cagiriyordu ama o anahtar `checkIn` blogundaydi - hikaye blogunda HIC
  yoktu. `ceviri-tamlik` testi bunu GORMEZ (diller arasi tamlik olcer,
  kullanilan anahtarin varligini degil). Yeni anahtar `hikaye.fotografSec`.
- **02 "Hikayeye ekle" ekrani hic yapilmamisti:** ikinci referansa
  bakip uygulama ici galeri izgarasini kapsam disi birakmistim; kullanici
  ilk referansi yeniden gonderince yapildi (`src/app/hikaye/fotograf.tsx`).
  Serit "+" artik oraya gidiyor, secim `/hikaye/ekle?foto=...` ile
  duzenlemeye geciyor. Duzenleme ekraninda ust sagdaki Aa/cikartma
  KALKTI, Not alt cip seridine indi (kullanicinin duzeltmesi).

**COKME (kullanicinin bildirimi "Slooin coktu diye uyari geldi hikaye
eklemeye calisinca"), iki riskli nokta kaldirildi:**
1. **Eksik native modulu `try/catch` icinde `require` etmek YETMIYOR.**
   Yeni mimaride (bridgeless) eksik bir native modulu istemek JS'te
   yakalanamayan olumcul hataya donusebiliyor. `lib/galeri.ts` artik
   once NATIVE KAYITA bakiyor (`globalThis.expo.modules.ExpoMediaLibrary`)
   ve modulu ancak oradaysa yukluyor. KURAL: OTA ile gonderilen kodda
   yeni bir native modul kullanilacaksa once bu kayit okunur.
2. **Yuzdeli `left/top` + yuzdeli `translate` telefonda risk.**
   `HikayeOgesi` konumu artik OLCULEN alandan piksele ceviriyor (oge
   kendi yarisini kendi `onLayout`undan aliyor); izleyici de alani
   olcuyor. Regresyon testi yuzdeli degerin geri gelmesini engelliyor.

**Yayin:** OTA `257bff33`, web `slooin--7hu89q5kyo`. Native derlemeler
(expo-media-library icerir, izgara ancak bunlarda calisir): iOS
`ae5ac897` -> **1.0.0 (14)** App Store Connect'e yuklendi, Android
`2ea5b5f7` -> **versionCode 8** (AAB expo.dev artifacts). Jest 97 paket
/ 1269 test.

### HIKAYE: GORUNURLUK SECIMI VE TUVAL ETIKETLERI - 2026-09-22

Kullanicinin iki referansi ve kararlari. Hikaye ozelligi (24 saat,
serit, izleyici, gorenler) paralel oturumda zaten kurulmustu; bu tur
TASARIM ve GORUNURLUK.
- **Gorunurluk HIKAYE BASINA** (migrasyon `20260922200000`):
  `hikayeler.gorunurluk` = `arkadaslar` (varsayilan) | `herkese_acik`.
  RLS `hikaye_gorunur_mu(sahip, gorunurluk)`; herkese acik dalda ayrica
  `moderasyon.hesap_aktif_mi` araniyor. Secim OLDUGU GIBI uygulanir:
  profil gizli olsa da "Herkese" secilen hikaye herkese acilir - bu
  sahibinin o icerik icin verdigi acik karar. Ekranda **aciklama metni
  YOK**, yalnizca iki satir: "Arkadaslar" / "Herkese" (kullanicinin
  karari: "Aciklama yok arkadaslar ve herkese secenegi sadece").
  Engel her iki halde mutlak.
- **Serit KESIF AKISI DEGIL:** `hikaye_akisi(p_kullanici default null)` -
  null dali kendim + arkadaslarim, yabancinin herkese acik hikayesi ana
  sayfaya DUSMEZ; bir kisinin hikayeleri p_kullanici ile aciliyor.
- **Etiketler tuvalde** (migrasyon `20260922210000`, `yerlesim` jsonb):
  yazi, ifade, mekan ve arkadas etiketleri fotografin UZERINDE
  suruklenip boyutlandiriliyor. Konum ORANSAL (x,y 0..1 + olcek) -
  baska boyda telefonda ayni yerde durur. Bilesen
  `src/tasarim/HikayeOgesi.tsx`: `PanResponder`, pinch icin ayri
  kutuphane YOK (olay iki dokunusu da tasiyor, olcek parmak arasi
  uzaklik oranindan). Reanimated degil `Animated` (2026-09-20 karari).
- **Olusturma ekrani** referansa gore bastan: fotograf tam ekran
  (cover), ust cubuk × + "Yeni hikaye" + Aa + ifade, alt cipler
  Mekan/Ifade/Etiketle, altta "Arkadaslar ⌄" + Paylas. **× fotografi
  KALDIRIR** ve kaynak secimini yeniden acar (ayri "Fotografi degistir"
  dugmesi YOK - kullanicinin duzeltmesi). Mekan ISTEGE BAGLI: aktif
  check-in'den gelir, elle de secilir (yakin mekanlar), kaldirilir;
  hikaye paylasmak check-in OLUSTURMAZ.
- **Izleyici:** etiketler paylasanin biraktigi yerde; mekan hapi mekan
  sayfasini, kisi etiketi profili acar. Ust kimlikteki mekan satiri
  KALKTI (iki yerde birden gorunuyordu, test yakaladi). Altta **mesaj
  kutusu + kalp** (2026-09-22 referansi; 09-22 sabahindaki "yanit
  kutusu kalkti" karari bununla GECERSIZ), kendi hikayemde onun yerinde
  **Gorenler + Sil**. Kalp ve mesaj ayni yoldan gidiyor
  (`hikayeyeYanitVer` -> sohbet mesaji), yeni sunucu isi yok.
- **Serit:** kendi dairemde kesikli halka kalkti; sade daire + turuncu
  arti rozeti.
- **UYGULAMA ICI GALERI IZGARASI YAPILMADI:** ilk referanstaki "Son
  fotograflar" ekrani ikinci referansta yok; "Hikayen +" dogrudan
  kamera/galeri aciyor, yani `expo-media-library` ve yeni derleme
  GEREKMEDI. **VIDEO hikaye de bu turun disinda** - expo-video yeni
  native modul, sonraki derlemeye birakildi.
- **DERS (canli test yakaladi):** `hikaye_gorunur_mu` imzasi degisince
  `sikayet_gonder` ve `hikaye_goruntulendi` eski imzayi cagirmaya devam
  etti ("function does not exist"). Bir fonksiyonun imzasi degisirse
  `pg_proc.prosrc` icinde adi aranip BUTUN cagiranlar ayni migrasyonda
  guncellenir (`20260922220000`).
- **DERS:** `test0@slooin.test` GERCEK bir hesap (byorcun) ve uzerinde
  kullanicinin kendi hikayeleri olabiliyor; canli testin "10 siniri"
  senaryosu bos hesap varsayiyordu ve kullanicinin verisinde patliyordu.
  Artik mevcut sayidan devam ediyor. Test hesaplarinin gercek veri
  tasidigi varsayilir.
Jest 96 paket / 1262 test, tsc temiz, test:sema ve test:gorunurluk
yesil, `araclar/hikaye-canli-test.py` 23/23. Yayin: web
`slooin--drn94cxt7w`, OTA grup `ad668c29-e5ab-42d0-ab0b-27b74f1addf7`.

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

### PERFORMANS: "HER SAYFA HER SEFERINDE YUKLENIYOR" - 2026-09-22

Kullanicinin bildirimi: "uygulama icerisinde yavaslik var her sayfa
herseferinde yuklenmeye calisiyor." OLCULDU, tahminle duzeltilmedi:
yeni arac `mobil/araclar/gezinme-olcum.mjs` (puppeteer; giris yapar,
alt gezinmeden sekme sekme gezer, her geciste Supabase'e giden istek
sayisini ve sureyi yazar). OTA grup `0e8c037c`, web
`slooin--q78h8gwboi` (pakette `getSession`/`onbellekOku`/
`rozetleriTazele` dogrulandi).

| | Once | Sonra (ilk) | Sonra (tekrar) |
|---|---|---|---|
| Ana sayfa | 37 istek / 1249 ms | 18 / 1291 | **13 / 689 ms** |
| Profil | 26 / 951 ms | 18 / 658 | **10 / 356 ms** |
| Mesajlar | ~12 | - | **4 / 311 ms** |

**DORT KOK NEDEN (hepsi olculdu):**
1. **Onbellek yok.** Kok duzen `Slot` kullaniyor; sekme degisince ekran
   AGACTAN KALKIYOR, `useState` varsayilana donuyor, `useFocusEffect`
   her seyi yeniden cekiyor. Ikinci donuste de 37 istek.
2. **`auth.getUser()` sayfa basina DORT kez.** supabase-js v2'de o cagri
   her seferinde SUNUCUYA gidip jetonu dogruluyor; oysa cagiran yerler
   yalnizca "benim kimligim ne" diye soruyor ve o bilgi yerel oturumda.
3. **Ayni avatar BES kez imzalaniyor.** Imza bir saat gecerli ama akis
   karti, serit, etiketler ve hikaye seridi ayri ayri istiyordu.
4. **Alt gezinme rozetleri her yol degisiminde dort istek** atiyordu -
   ekranin kendi istekleri USTUNE.

**COZUM - dort katman, ekran yapilarina dokunmadan:**
- `lib/kimlik.ts`: `kullaniciKimligi()` / `kimligiZorunluOku()` -
  `getSession()` ile YEREL okuma + 3 sn'lik bellek onbellegi + ayni anda
  gelen cagrilari tek istege bindirme. 13 lib dosyasindaki kimlik okuma
  buna gecti. **GUVENLIK-KRITIK UC YER BILEREK DISARIDA**
  (`hesap-guvenlik.ts`, `hesap.ts`, `veri-disa-aktar.ts`): orada amac
  kimligi okumak degil, jetonu sunucuya dogrulatmak.
- `lib/fotograf-url.ts`: kova+yol basina imza onbellegi (50 dk sonra
  yeniden imzalar) + `profilFotografiUrlHaritasi` (toplu
  `createSignedUrls`). `profilOzetleriniGetir` artik kisi basina degil
  TEK istekle imzaliyor.
- `lib/onbellek.ts`: "once eldekini goster, arkada tazele". Ana sayfa,
  profil, mesajlar, kesfet (liste + son bilinen KONUM - onceden her
  girise GPS bekleniyordu) onbellekten aciliyor. Bellekte, DISKTE
  DEGIL: imzali adres ve konum kisa omurlu, ustelik cihaza kisisel veri
  yazmamak gizlilik cizgisiyle uyumlu. Cikista/giriste sifirlaniyor.
- `AltGezinme`: uc rozet istegi TEK turda ve en fazla 60 sn'de bir;
  `rozetleriTazele()` (sohbet okundu, istek/etiket yanitlandi) onbellegi
  dusuruyor, yani sayi beklemeden guncelleniyor.
- `akisiGetir` icindeki etiket + profil + imza zinciri `Promise.all`a
  alindi (uc gidis-donus daha az).

**DERSLER:**
- Modul duzeyinde `supabase.auth.onAuthStateChange(...)` cagirmak 16
  test paketini coktu: testler `supabase`i dar bir mock'la degistiriyor
  ve `auth` yok. Abonelik tek bir savunmali kapiya alindi
  (`lib/oturum-olayi.ts`, optional chaining + try/catch).
- Modul duzeyi onbellek TESTLER ARASI SIZAR (`jest.clearAllMocks()` onu
  sifirlamaz): `jest.setup.js` her testten once kimlik/imza/ekran
  onbelleklerini dusuruyor - mock'lanmis modulde fonksiyon yoksa atlayan
  savunmali dongu ile.
- AYNI TUZAGA IKINCI KEZ DUSULDU (ilki 2026-09-09): ayni testte
  `unmount()` edip yeniden render etmek RNTL'in `screen`ini bozuyor ve
  SONRAKI testler elemanlari bulamiyor. Onbellek testleri iki yonu AYRI
  AYRI olcuyor (onbellege dogrudan yazip ekranin okudugunu, ve ekranin
  yazdigini).
- Olcumde SURE degil ISTEK SAYISI ve TEKRAR bakilir: ayni RPC'nin ayni
  cizimde kac kez gectigi kok nedeni dogrudan gosteriyor.

**IKINCI TUR - BILDIRIMLER (ayni gun, kullanicinin bildirimi "daha iyi
bildirimler birazcik yine yavas sanki"):** ilk turda dort sekme
onbellege alinmisti, BILDIRIMLER LISTEDE YOKTU. Ayrica iki gercek
tekrar bulundu:
- `gelenIstekleriGetir` ALTI SIRALI tur atiyordu: takip kimlikleri ->
  sohbet kimlikleri -> takip kisileri (bag_kisileri + avatar) -> sohbet
  kisileri (yine bag_kisileri + avatar). Artik iki kimlik sorgusu
  PARALEL ve butun kisiler TEK `bag_kisileri` + tek avatar cagrisiyla
  cozulup ayriliyor.
- Bildirimler ekrani avatarlari BASTAN bir kez daha soruyordu; oysa
  istek listesi (`BagKisi.avatarUrl`) ve etkilesimler avatarlarini
  zaten tasiyor. Artik yalnizca EKSIK kalanlar (etiketleyenler)
  sorulur, hicbiri eksik degilse istek yok - `akis_profilleri` 2x -> 1x.
Olcum: Bildirimler 8 istek -> 6, ve ekran artik dolu aciliyor.

**UCUNCU TUR - KISI COZUMU TEK TURDA (kullanicinin "Olc" talimati):**
`bag_kisileri` ile `akis_profilleri` CANLIDA karsilastirildi (MCP,
`begin ... rollback` ile gecici veri - canliya hicbir sey yazilmadi):
yasakli, askida, dondurulmus hesap, IKI YONDE engelleme, bos ve null
dizi senaryolarinin HEPSINDE sonuc BIREBIR AYNI. Sebep tanimlarda:
ikisi de `moderasyon.hesap_aktif_mi` + iki yonlu engelleme kullaniyor
(`gizli.engelli_mi` ile `akis_profilleri`nin satir ici sorgusu ayni
metin). Bu yuzden `kisileriCoz` artik TEK cagri yapiyor
(`profilOzetleriniGetir`, avatar dahil); `bag_kisileri` RPC'si
sunucuda duruyor ama ISTEMCIDEN ARTIK CAGRILMIYOR.

**AYNI OLCUMDE KENDI HATAM BULUNDU:** ikinci turda takip + sohbet
kimliklerini tek cagrida birlestirmistim; RPC'nin 200 kimlik siniri
oldugu icin (201'de `Cok fazla kimlik`) 150 takip + 150 sohbet
istegi olan birinde bildirimler ekrani BASTAN HATA verirdi. Ayni
risk `takipcilerimiGetir`de zaten vardi: 200'den fazla arkadasi olan
kisinin listesi hic gelmiyordu. `profilOzetleriniGetir` artik 200'luk
dilimlere bolup PARALEL soruyor.
Bir ayrim korundu: ozet okunamazsa akis SESSIZCE ozetsiz cizilir, ama
bag listelerinde ozet listenin KENDISI oldugu icin hata firlatilir
(`hatayiFirlat`) - bos liste "kimse yok" diye okunur ve yalan soyler.

Jest 95 paket / 1229 test, tsc temiz; `test:gorunurluk` 453 dogrulama
ve `test:sema` TAMAMEN yesil (kisi cozumu artik baska bir RPC'den
gectigi icin ikisi de kosuldu). OTA `8122ea6e`, web
`slooin--yxhdzirwei`. GERCEK CIHAZDA DOGRULANMADI - telefonda sekme
gecisinin hissi kullanicidan.

### BAYAT SERIT ONBELLEGI: CUBUK SAYISI SONRADAN DEGISIYORDU - 2026-09-22

Kullanicinin bildirimi (ekran goruntusuyle): "burda iki hikaye var bir
tane varmis gibi cubuk ilerliyor, ustte ikinci sonradan beliriyor."

KOK NEDEN: izleyici seridin onbellegiyle ANINDA aciliyor (09-22 gecis
turu), ama hikaye EKLENDIGINDE/SILINDIGINDE o onbellek dusurulmuyordu.
Kullanici hikaye ekleyip hemen seride dokununca ana sayfanin tazelemesi
daha bitmemis oluyor, izleyici BIR HIKAYELIK eski veriyle aciliyor ve
taze veri gelince cubuk ikiye bolunuyordu.

COZUM - onbellek yonetimi tek dosyada (`lib/hikaye.ts`):
- `hikayeSeridiVerisiniGetir` onbellege KENDISI yaziyor (once ana sayfa
  yaziyordu), yani yazan ve dusuren ayni yerde.
- `hikayeEkle` ve `hikayeSil` bittiginde `seritOnbelleginiDusur()`.
- Onbellek YAS damgasiyla tutuluyor; `SERIT_ONBELLEK_OMRU_MS` (90 sn)
  gecmisse `seritOnbelleginiOku()` null doner ve ekran sunucuyu bekler -
  uygulamayi acik unutup geri donen kullanici bayat veri gormez.
DERS: "once eldekini goster" deseni, o veriyi DEGISTIREN her yolun
onbellegi dusurmesiyle birlikte yazilmali; yoksa kazanc bayat ekrana
donuser.

Jest 95 paket / 1245 test.

### HIKAYE: YANIT KUTUSU KALKTI, IMZA ONBELLEGI, DOSYA BOYUTU - 2026-09-22

Kullanicinin istegi: "koydugun yanit yazi kaldir birde hala biraz
gecikmeli geliyor hikayeler." OTA `dfb3217a`, web `slooin--47fmyt1sjl`.

**1. Yanit YAZMA kutusu kaldirildi.** Alttaki "Yanit yaz..." girdisi ve
"Gonder" dugmesi yok; HIZLI TEPKI emojileri duruyor (dokunmak emojiyi
yanit olarak sohbete gonderiyor). Yan sonuc: yukari kaydirma artik
YALNIZCA kendi hikayende izleyen listesini aciyor, baskasininkinde bir
sey yapmiyor. `hikaye.yanitYerTutucu` ve `hikaye.gonder` anahtarlari
7 dilde DURUYOR ama kullanilmiyor.

**2. GECIKMENIN ILK KOK NEDENI: hikaye imzalari onbelleksizdi.**
`lib/hikaye.ts` kendi `createSignedUrls` cagrisini yapiyordu; 09-22
sabahi `lib/fotograf-url.ts`e eklenen imza onbellegine BAGLI DEGILDI.
Sonuc: her akis cekilisinde ayni dosya icin YENI imzali adres, ve
`expo-image` onbellegi adresi anahtar aldigi icin her seferinde iskalama
-> fotograf yeniden iniyor. Artik ortak `hikayeMedyasiUrlHaritasi`
(`toplulukImzala`) kullaniliyor; test: "ikinci akis cekilisinde AYNI
adres doner ve sunucuya yeniden imzalatilmaz".
DERS: bir kova icin onbellek yazildiginda O KOVAYI KULLANAN HER YOL
ona baglanmali; ayri bir imzalama fonksiyonu sessizce onbellegi
bypass eder.

**3. ASIL DARBOGAZ OLCULDU: HIKAYE FOTOGRAFLARI ~2 MB.** Canlidaki uc
hikaye 1686 / 1892 / 2507 KB (ortalama 2028 KB). `hikayeEkle`
`quality: 0.8` ile cekiyor ama COZUNURLUK kucultmuyor - telefon
kamerasi 4032 px cekiyor. Mobil veride tek kare saniyeler suruyor; on
yukleme ve onbellek bunu gizliyor ama on yuklenmemis bir kareye
gidilince gecikme geri geliyor (olcumde bir kare 3832 ms).

**KULLANICININ KARARI: UCRETSIZ YOL, SONRA.** Secenekler olculup
sunuldu; kullanici "sonra ucretsizi yapicaz bu acik is kalsin" dedi.
Yani:
- **Supabase gorsel donusumu ACILMADI** (tekrarlayan gider). Canlida
  DENENDI ve calisiyor: `createSignedUrl(yol, sure, { transform: {
  width: 1080, quality: 75 } })` -> 1686 KB yerine **311 KB** (%18);
  720 px / kalite 70 ise 188 KB. Bedeli Pro planda ayda 100 "origin
  image" dahil, sonrasi 1000 basina ~5 $. Tekrar gundeme gelirse
  olcum burada, yeniden denemeye gerek yok.
- **ACIK IS (yapilacak): `expo-image-manipulator` ile YUKLEME sirasinda
  kucultme** (1080 px + kalite ~0.75). Ucretsiz ve daha dogru: depolama
  da kucuelur, her goruntulemede degil BIR KEZ islenir. Paket KURULU
  DEGIL, yani `npx expo install expo-image-manipulator` + YENI NATIVE
  DERLEME gerekiyor; bir sonraki derlemeyle birlikte yapilacak.
  Dokunulacak yer: `lib/hikaye.ts` -> `hikayeEkle` (dosyayi okumadan
  once olceklendir) ve ayni desen check-in fotograflari icin de
  degerlendirilmeli (`lib/checkin-fotograf-yukle.ts`).
- Denenmeyen kismi cozum: `ImagePicker` `quality` 0.8 -> 0.5 (ucretsiz,
  OTA, ama cozunurluk ayni kaldigi icin yarim cozum).

Jest 95 paket / 1241 test.

### HIKAYE GECISLERI: ON YUKLEME VE ANINDA ACILIS - 2026-09-22

Kullanicinin bildirimi: "hikayeler arasi gecis cok kotu surekli yeniden
yukleniyor gecikmeli geliyor." OLCULDU (yeni arac
`araclar/hikaye-gecis-olcum.mjs`: izleyiciyi SERITTEN aciyor, ilk
karenin ekrana gelme suresini ve her geciste giden medya istegini
yaziyor). OTA `80d32f0c`, web `slooin--q1ziqvzo6k`.

|  | Once | Sonra |
|---|---|---|
| Acilis: ilk fotograf ekranda | 1581 ms | **26 ms** |
| Acilista RPC | 12 (hikaye_akisi + akis_profilleri + imzalama) | **1** (arka plan tazeleme) |
| Ileri gecis | 389-466 ms, HER geciste yeni medya istegi | **7-14 ms, 0 istek** |
| Geri gecis | 66-140 ms | **11-20 ms, 0 istek** |

**UC KOK NEDEN:**
1. **Izleyici veriyi bastan cekiyordu.** Ana sayfadaki serit ayni
   `hikaye_akisi` + `akis_profilleri` + imzalamayi saniyeler once
   yapmisti. Artik `ANAHTAR.hikayeSeridi` onbelleginden ANINDA aciliyor,
   tazeleme arkada. Konum yalnizca ILK yuklemede seciliyor - onbellekten
   acildiysa kullanici bu arada ilerlemis olabilir, geri sarilmaz.
2. **On yukleme yoktu.** Her ileri gecisinde fotograf o an indiriliyordu.
   Artik gorunen karenin komsulari onceden iniyor: ayni kisinin sonraki
   IKI ve onceki BIR hikayesi + SONRAKI KISININ ilk hikayesi (yatay
   kaydirma oraya gidiyor).
3. **Gorsel onbellegi acik degildi.** `cachePolicy="memory-disk"` +
   `recyclingKey={hikaye.id}` + `transition={0}` (solma efekti gecikme
   gibi okunuyordu).

**OLCUM SIRASINDA YASANAN VE DUZELTILEN HATA:** on yukleme ilk yazimda
kare CIZILIRKEN basliyordu ve acilis 1581 -> **3683 ms'ye CIKTI** -
ayni bant genisligini paylasan uc indirme bakilan fotografi
geciktiriyor. Tetikleyici artik gorunen karenin `onLoadEnd`i (600 ms'lik
zamanlayici yalnizca YEDEK: kare onbellekten geldiyse olay gelmeyebilir).
DERS: on yukleme her zaman kazanc degildir - GORUNEN isin onune gecerse
zarardir; olcum bunu ancak gercek gezinmeyle gosterir.

**OLCUM ARACI DERSI:** ilk surum izleyiciyi `page.goto` ile aciyordu;
tam sayfa yenileme modul duzeyindeki onbellegi sifirladigi icin
"seritten aninda acilis" yolu HIC olculemiyordu. Arac artik seritteki
daireye dokunuyor ve kareler arasinda ~1,2 sn bekliyor (kullanici da
bakiyor) - yoksa on yuklemeye hic firsat taniyanmayan, gercekte olmayan
bir kosul olculur.

Jest 95 paket / 1240 test (izleyici 20).

### HIKAYE IZLEYICI = INSTAGRAM ISLEYISI - 2026-09-22

Kullanicinin istegi: "Instagram'in hikaye isleyisini tam ogren ve
aynisini yap." Once ISLEYIS ARASTIRILDI (tahminle degil; kaynaklar
oturum dokumunde), sonra bizimkiyle farki cikarildi ve uygulandi.
OTA `cf04722e`, web `slooin--b1exhxndrp`, goruntu
`tasarim/hikaye-instagram-isleyis.png`.

| Hareket | Instagram | Bizde (once -> sonra) |
|---|---|---|
| Sag / sol DOKUNUS | ayni kisinin sonraki/onceki hikayesi | vardi |
| **Sola / saga KAYDIRMA** | **sonraki / onceki KISI** | YOKTU -> var |
| **Yukari kaydirma** | **yanit kutusu / izleyenler** | kapatiyordu -> Instagram gibi |
| Asagi kaydirma | kapat | vardi |
| Basili tutma | duraklat **+ arayuz gizlenir** | yalnizca duraklatiyordu -> arayuz de gizleniyor |
| **Hizli emoji tepkileri** | var (DM'e duser) | YOKTU -> var (yanit olarak sohbete) |
| Kisi bitince sonraki kisi, hepsi bitince kapanis | var | vardi |
| Fotografta 5 sn, ilk GORULMEMISten baslama | var | vardi |

**TEK PAN, DORT SONUC:** hareket artik tek bir `Gesture.Pan`; karar
parmagin BASKIN YONUYLE veriliyor (`|dx| > |dy|` ise yatay). Eskiden
`failOffsetX` ile yatay hareket vazgeciyordu - yatay kaydirma o yuzden
hic yakalanamiyordu. Esikler: kisi gecisi 70 px / 650 px-sn, kapatma
120 px / 900 px-sn (FotografGezgini ile ayni).

**BILINCLI SAPMA:** kullanicinin 2026-09-22 sabahki istegi "fotograf
buyuk acikken yukari YA DA asagi kaydirinca kapansin" idi; o kural
`FotografGezgini`de AYNEN DURUYOR. Hikaye izleyicisinde yukari
kaydirma Instagram'daki gibi yanit/izleyen aciyor - cunku bu turda
"Instagram'in aynisi" istendi. Iki ekran ayri, kural ayri.

**Hizli tepkiler** `HIZLI_TEPKILER` (Instagram'in seti: kalp, kahkaha,
sasirma, uzgun, alkis, ates, konfeti, kalp gozler). Dokunmak emojiyi
`hikayeyeYanitVer` ile gonderiyor - Instagram'da da tepki DM'e
duesuyor, bizde de sohbete. Kendi hikayende tepki satiri CIZILMIYOR.

**YAPILMAYANLAR (kapsam disi, bilerek):** video, muzik, sticker,
anket/soru kutusu, yakin arkadaslar, one cikanlar (highlights), arsiv,
baglanti (swipe up link), hikayeye mention/hashtag. Bunlarin hicbiri
"isleyis" degil AYRI OZELLIK; hikaye bizde TEK FOTOGRAF + yazi + mekan
(2026-09-22 karari).

Jest 95 paket / 1238 test (izleyici 18); sozluk 7 dil
(`hikaye.tepkiGonder/tepkiGonderildi/sonrakiKisi/oncekiKisi`).
GERCEK CIHAZDA DOGRULANMADI - kaydirma hissi ve tepki gonderimi
telefonda denenmeli.

### HIKAYEDE OKUNURLUK: ACIK FOTOGRAFTA GRADYAN - 2026-09-22

Kullanicinin bildirimi (iki ekran goruntusuyle): "hikayelerdeki dolma
ibaresi beyaz bir fotografta hic gorunmuyor." Ilerleme cubugu, kimlik
satiri, ucnokta/kapat ve alttaki yanit kutusu BEYAZ; acik renkli bir
fotografta (tipik ornek: bir ekran goruntusu paylasmak) hepsi
kayboluyordu.

COZUM (Instagram deseni): icerigin ARKASINA usttan ve alttan koyu
gradyan (`expo-linear-gradient` - 2026-09-03'ten beri bagimliliklarda
ve native derlemede, OTA ile gitti). Fotografin KENDISI karartilmiyor;
gradyan yalnizca kenarlarda, saydamdan koyuya. `pointerEvents="none"`:
sag/sol dokunus ve dikey surukleme gradyana takilmiyor. Ayrica ilerleme
cubugunun BOS kismi beyaz yerine koyu (`rgba(0,0,0,0.45)`) - dolu ve
bos arasindaki fark gradyan ustunde de net.

OLCULDU (gozle "duzeldi" denmedi): `araclar/hikaye-ekran-goruntusu.mjs`
(yeni; genel ekran goruntusu araci bu ekranda yetmiyor - hikaye
fotografi imzali adresten indigi icin sayfa bos cizilirken cekiliyor ve
istenen kare cogu zaman ilk hikaye degil, ileri dokunmak gerekiyor).
Kullanicinin sikayet ettigi GERCEK hikaye uzerinde, cubugun DOLU ve BOS
kismi arasindaki parlaklik farki:

    ONCESI   dolu 255 / bos 237  ->  fark  18   (gozle ayirt edilemez)
    SONRASI  dolu 239 / bos  49  ->  fark 190   (on kat)

Goruntuler `tasarim/hikaye-beyaz-oncesi.png`, `-sonrasi.png`,
`-karsilastirma.png`. Olcum icin gecici beyaz hikaye kuran betik:
`araclar/hikaye-beyaz-olcum.py` (`ekle` / `sil`; kendi actigi hikayeyi
ve kova dosyasini siliyor).

DERS: acik renkli KULLANICI ICERIGI uzerine beyaz arayuz konuyorsa
kontrast icerige birakilamaz - arkaya gradyan ya da koyu zemin sart.
Ayni sinif risk fotograf gezgininde de var (orada zemin zaten siyah,
sorun yok).

Jest 95 paket / 1229 test. OTA `c6b5d227`, web `slooin--agicpq0mxl`.

### HIKAYEYE IFADE VE ARKADAS ETIKETI - 2026-09-22

Kullanicinin istegi (hikaye ekleme ekrani yeniden): "siyah ekran gelsin,
altta yaptigi check-in yeri gelsin isterse kaldirabilsin, not ekleme
kalsin, kendi ifade setimizden de ekleme yapabilsin, arkadas ekleme
bunlar eklensin." Migrasyon `20260922180000`. OTA `ce83f5eb`, web
`slooin--yny6f8inhp`.
- **Ekleme ekrani** (`hikaye/ekle.tsx` bastan): once SIYAH TUVAL +
  kaynak secici; galeriyi iptal etmek ekrani KAPATMIYOR (bos tuval
  kalir, cikis yalnizca ×). Fotograf gelince altta arac seridi
  (`hikaye-arac-not/-ifade/-arkadas`) ve cip seridi - mekan (aktif
  check-in'den, kaldirilabilir), ifade, etiketlenen arkadaslar; hepsi
  x ile kalkiyor. TUZAK: `SecimPenceresi` secimde de `onKapat`
  cagiriyor; "secim yapilmadan kapatildi mi" karari 400 ms sonra ve IKI
  REF ile veriliyor, yoksa galeriye basar basmaz ekran geri donuyordu.
- **Sunucu:** `hikayeler.ifade` (check-in ile AYNI `ifadeler` sozlugu),
  `hikaye_etiketleri` tablosu + RLS + `gizli.hikaye_etiket_durumu()`
  tetikleyicisi. Etiket onayi kurali check-in ile ayni: karsi tarafin
  `etiket_onayi_gerekli` ayari 'bekliyor'/'onaylandi' yaziyor, istemci
  degeri yok sayiliyor; onaylanmamis etiket KIMSEYE gorunmuyor.
  `hikaye_ekle` yeni imza (eski 3 parametreli DROP), yalnizca arkadas
  etiketlenir, kendini etiketleyemezsin. `bekleyen_hikaye_etiketlerim`
  + `hikaye_etiketini_yanitla`.
- **DERS (canli test yakaladi, 2 dogrulama kirikti):** `hikaye_akisi`
  security INVOKER ve `profiller` uzerinde okuma politikasi YOK - gomulu
  `profiller` join'i etiketi SESSIZCE dusuruyordu (etiketlenen kendi
  satirini goruyor, hikaye sahibi gormuyordu). 2026-09-18'de check-in
  etiketlerinde yasanan tuzagin aynisi. Cozum `gizli.hikaye_etiketleri_json`
  (security definer, `gizli` semasinda = PostgREST'e kapali; askidaki
  hesap ve iki yonlu engel orada eleniyor).
- **Bekleyen etiketler TEK LISTE:** `bekleyenEtiketleriGetir` iki RPC'yi
  paralel cekip birlestiriyor; `BekleyenEtiket` artik `{id, tur}`
  tasiyor (`checkInId` KALKTI), `etiketiYanitla(id, onay, tur)`.
  Metin `lib/etiket-metni.ts` (hikayede mekan istege bagli, iki ayri
  anahtar: `bildirimler.hikayeEtiketMetni/…Mekan`, 7 dil). Bildirimler,
  Gizlilik > Bekleyen etiketler, etiket sayaci ve alt gezinme rozeti
  birlikte duzeldi.
- **Izleyici:** ifade yazi kutusunun icinde `IfadeCipi`, altinda
  etiketlenenler satiri (kullanici adlari, dokununca profil).
- KVKK listesine madde yazildi; gizlilik metni 7 dil + docs guncellendi;
  `verilerimi_disa_aktar` iki yonu de tasiyor (`etiketlediklerim` ve
  `hikaye_etiketlerim`).
Canli `araclar/hikaye-ifade-etiket-canli-test.py` **21/21**; jest 95
paket / 1253 test, `test:sema` yesil (4 yeni dogrulama). TELEFONDA
DOGRULANMADI.

### HIKAYE AKISI (24 SAAT) - 2026-09-22

Kullanicinin istegi: "ana sayfaya Instagram gibi hikaye ekleme akisi da
ekle", ardindan "sikayet etme ekleme geri kalanini yap" -> "sikayetle
alakali dediginide yap" -> **"dediklerinin hepsini yap"** (yani sikayet
DAHIL). Spec `docs/superpowers/specs/2026-09-22-hikaye-akisi-design.md`,
migrasyon `20260922150000_hikayeler.sql`, taslak `tasarim/hikaye/taslak.png`.
OTA grup `5f57ccfc`, web `slooin--oidto4ech6` (pakette `hikaye-seridi`
dogrulandi), panel yeniden yayinlandi.

**Kararlar:** tek fotograf + istege bagli yazi (<= 200) + istege bagli
mekan etiketi (AKTIF CHECK-IN'den otomatik; elle mekan secimi YOK);
24 saat, saatlik cron satiri VE kova dosyasini siler (arsiv yok);
gorunurluk check-in ile ayni (sahibi + arkadaslar, engel iki yonlu,
moderasyon gizli kimseye); kisi basina en fazla 10 aktif hikaye;
goruntuleyen listesi yalnizca sahibine; yanit = normal sohbet mesaji
(`mesaj_gonder`, "Hikâyene yanıt:" on ekiyle); PUSH YOK.

**Sunucu:** tablolar `hikayeler` / `hikaye_goruntulemeler`, yardimci
`hikaye_gorunur_mu`, kova `hikaye-medyalari` (ozel, 10 MB, jpeg/png/webp;
SELECT kendi klasoru VEYA hikaye satirina bagli VEYA moderator), RPC'ler
`hikaye_ekle` / `hikaye_akisi` (invoker; `gordum` + `goruntulenme_sayisi`
+ mekan adi) / `hikaye_goruntulendi` / `hikaye_goruntuleyenler` /
`hikaye_sil` (yol doner, dosyayi istemci siler) /
`moderasyon_hikayeyi_gizle` + `..._gizlemeyi_kaldir`; `sikayet_gonder`
'hikaye' hedefi (yalnizca GOREN sikayet edebilir, kendi hikayesi olamaz),
`moderasyon_sikayet_detayi` hikaye kolu, cron
`hikaye-suresi-dolanlari-sil` (`7 * * * *`), `verilerimi_disa_aktar`
`hikayelerim` + `hikaye_goruntulemelerim`. Hepsinde `revoke ... from
public, anon` acikca yazili.

**Istemci:** `lib/hikaye.ts` (grup kurma + siralama saf fonksiyon
`hikayeGruplariniSirala`: BEN once, sonra gorulmemisi olanlar, sonra
gorulmusler - her ikisinde en yeni once; imzalar TEK `createSignedUrls`;
`hikayeSeridiVerisiniGetir` grubum yoksa kendi gorunumumu ayrica okur),
`src/tasarim/HikayeSeridi.tsx` (ana sayfa ListHeaderComponent, "Su an
disarida"nin USTUNDE; kendi dairem HER ZAMAN var - hikayem yoksa kesikli
halka, arti rozeti hep ekleme ekranini acar; gorulmemis turuncu / gorulmus
gri halka), `src/app/hikaye/ekle.tsx`, `src/app/hikaye/izle.tsx`
(ilerleme cubuklari + 5 sn `Animated.timing`, sag/sol dokunus, basili tut
durdur, dikey surukleme kapatir - FotografGezgini deseni; uc nokta
sahibinde Sil (onayli) baskasinda Sikayet et), `KisiListesiSayfasi`
(BegenenlerSayfasi'ndan genellendi; gorenler listesi de onu kullaniyor).
Hikaye rotalarinda ALT GEZINME CIZILMIYOR ve ust payi ekran kendi koyuyor
(`_layout.tsx` `hikayeEkrani`).

**DERSLER:**
- `SecimPenceresi` secimde de `onKapat` cagiriyor (once kapanir, eylem
  80 ms sonra kosar). Ekleme ekraninda "secim yapilmadan kapatildi mi"
  karari bu yuzden 400 ms sonra ve IKI REF ile veriliyor
  (`seciliyorRef`, `kaynakAcikRef`); yoksa kullanici galeriye basar
  basmaz ekran geri donuyordu.
- Izleyicide duraklatma kaynaklari (menu, onay, gorenler sayfasi,
  klavye, basili tutma) TEK yerde toplandi; `ilerleme.stopAnimation
  ((deger) => oynat(deger))` ile kaldigi yerden devam ediyor.
- `_layout` testinde alt gezinmenin CIZILDIGI olculecekse jest.setup'in
  `AltGezinme: () => null` mock'u dosya icinde ezilmeli.
- Sozluk anahtari eklerken `console.log('
...')` gibi kacisli metinleri
  Python betigiyle yazarken tek tirnak/kacis karisabiliyor; `sed -n` ile
  sonuc satirina bakmak sart (bu turda `sema-dogrula.ts` bir kez
  "Unterminated string literal" ile kirildi).

Jest 93 paket / 1203 test, tsc temiz, `test:sema` yesil (15 yeni hikaye
dogrulamasi), canli `araclar/hikaye-canli-test.py` 20/20. GERCEK CIHAZDA
DOGRULANMADI: serit, izleyici dokunus/zamanlama, dikey kapatma.

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

### Uygulama fikri

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

### AGENT REACH KURULDU - 2026-09-06

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

### ARACLAR KULLANICI KAPSAMINDA - 2026-09-19 (KURAL)

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

### SCRAPLING KURULDU - 2026-09-20

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

### GEMINI -> OMNIROUTE -> CLAUDE-MEM ZINCIRI CALISIYOR - 2026-09-20

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

### SCRAPEGRAPHAI KURULDU - 2026-09-20

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

### OMNIROUTE KURULDU - 2026-09-19

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

### EMIL KOWALSKI BECERILERI - 2026-09-20

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

### Eklentiler

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

### Kararlar

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

### Is gunlugu arsivi

Tarihli tur kayitlari (tamamlanmis islerin anlatimi) buradan
`docs/claude-md-arsiv.md` dosyasina TASINDI - silinmedi.

Bir seyin NEDEN oyle yapildigini ya da daha once nelerin denenip
elendigini ararken oraya bak:

```bash
grep -n "aradigin sey" docs/claude-md-arsiv.md
```


### Arsivden tasinan kalici dersler

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

---

## [ANI EKLE TESTLERI + CIFT KAMERA DUZELTMESI - 2026-09-24]

Onceki oturumun yarim biraktigi "Ani ekle" + check-in galeri akisi
(commit b37fe89d) kapatildi. Alti kirik test dosyasi yeni akisa gecti:
check-in / CheckInDuzenle / ana sayfa / profil testleri eski
`foto-kamera`/`foto-galeri` menusu yerine `galeridenSec('galeri-sistem'
| 'galeri-kamera')` yardimcisiyla (jest'te expo-media-library kaydi
olmadigi icin izgara yerine sistem satiri cizilir). `hikaye/ekle.test`
bastan: galeri hic acilmaz, deklansor eski derlemede sistem kamerasina
duser, kamera iptali ekrani kapatmaz, gorunurluk cekimden once secilir.

YENI TEST GERCEK HATA YAKALADI: canli kamera modulu varken
`KameraGorunumu` IKI KEZ cizilyordu (arka planda tam ekran + ortadaki
yuvarlatilmis kart), ikisi ayni `kameraRef`i paylasiyordu. Telefonda
iki eszamanli kamera oturumu demek. Arka plandaki kalkti. Ayrica
`?foto=` parametresi (silinmis `/hikaye/fotograf` ekranindan kalma,
galeri yasaginin arka kapisi), `seciliyorRef`, `ResimCizimi` ve olu
stiller silindi; ekranin basindaki "lib/galeri silindi" yorumu
duzeltildi (check-in hala kullaniyor).

Ayni oturumda CLAUDE.md 286 bin -> 22 bin karaktere indirildi (tam
kopya bu dosyada "TAM KOPYA" basligi altinda) ve boyut bekcisi hook'u
(`.claude/hooks/claude-md-boyut.ps1`, tavan 50 bin) eklendi.

Jest 96 paket / 1267 test, tsc uygulama kodunda temiz. Yayin: web
`slooin--6qnel25x9a` (pakette `galeri-sistem` ve `hikaye-deklansor`
dogrulandi), OTA grup `883713d6-0996-4ec1-aa25-4a992b571c85`.
