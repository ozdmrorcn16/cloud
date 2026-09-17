# SLOOIN PROJESI - TEK DOSYA DEVIR BELGESI

> **Bu dosya ne icin var:** Slooin projesine YENI bir Claude hesabindan
> ya da yeni bir makineden girildiginde, hicbir sey hatirlamadan
> kaldigi yerden devam edebilmek icin. Once bunu oku, sonra `CLAUDE.md`
> (kurallar ve tuzaklar), sonra `docs/konusma-gunlugu.md` (karar
> defteri). Kullanici ile **Turkce** konus.
>
> Son guncelleme: **2026-09-14** (commit `ac800f7` sonrasi). Bu dosya her
> onemli isin sonunda guncellenir; "Kaldigi yer" bolumu en guncel durum.

---

## 1. Slooin nedir

Konum tabanli sosyal mobil uygulama. Kullanicinin kendi sozleriyle ana
isleyis **bes adim**: **check-in yap, gorunur ol, populer yerleri kesfet,
yakinindaki insanlarla tanis, sohbet et.** (Bu bes adim uygulamayi
anlatan her yerde kullanilir; kisaltilmaz.)

- Kisi bir mekana check-in yapar (1 km icinde olmali), 1 saat "su an
  burada" gorunur, sonra check-in aniya donusur (koordinat silinir).
- Mekan sayfasinda kim oldugu, liderlik tablosu (3 kisi), son check-inler
  (24 saat), fotograflar, puanlama (Kotu/Iyi/Harika) var.
- Kisi arama, arkadaslik (kod adi "bag"; ekranda daima "arkadas"),
  birebir sohbet (grup YOK, kalici karar), mesaj istekleri, engelleme,
  sikayet, moderasyon paneli (web, ayri uygulama).
- Yas siniri 18. Yalnizca Turkiye'de yayina cikacak (ilk surum).
- Hem **App Store** hem **Google Play** (kullanici iPhone kullaniyor;
  Android APK ona kurulamaz).
- Yedi dil: tr, en, de, es, fr, ru, ar (cihaz dilinden; ekran metinleri
  duzgun aksanli Turkce, kod/yorum/commit duz ASCII).

Marka: **Slooin**, turuncu `#FE7813` (degistirilmez), beyaz zemin, tek
yazi ailesi Instrument Sans (marka fontu Bricolage yalnizca kelime
markasinda). Site: **https://slooin.com** (Swarm ana sayfasi
referansli, 7 dil). Uygulamanin web surumu `https://slooin.expo.app`
(sitede ona ASLA baglanti verilmez).

## 2. Depo ve dallar

- GitHub: `ozdmrorcn16/cloud` (PUBLIC - sir asla girmez).
- Calisma dali: **`claude/plan2-moderasyon-paneli`** (her sey buraya
  commit'lenir ve push edilir; izin sormaya gerek yok).
- Cloudflare Pages `slooin.com` bu daldan (`site/` koku) otomatik
  derlenir; site degisikligi push ile yayina girer.
- Yerel yol (kullanicinin PC'si): `C:\Users\orcns\projects\cloud`.

Klasorler:

| Klasor | Ne |
|---|---|
| `mobil/` | Expo SDK 57 + expo-router uygulamasi (iOS, Android, web). Asil is burada. |
| `mobil/src/app/` | Ekranlar (dosya tabanli rota). `(auth)/` karsilama-kayit-giris-sifre-sifirla; `mekanlar/` check-in ekrani (yakin mekanlar); `harita/[mekanId]` mekan sayfasi; `check-in/[mekanId]`; `sohbet/[kullaniciId]`; `mesajlar`, `mesaj-istekleri`, `kisiler`, `baglar`, `bildirimler`, `profil/`, `kullanici/[id]`, `sikayet`, `gizlilik`, `kosullar`, `hesap-durumu`, `profil-olustur`. |
| `mobil/src/tasarim/` | Ortak bilesenler ve tema (`tema.ts` jetonlar, `Avatar`, `OnayPenceresi`, `SecimPenceresi`, `UstCubuk`, `CanliHarita`, `TurSecici`, `MekanPuanlama`, ikon dosyalari). Yeni bilesen yazmadan once buraya bak - ayni sey iki kez yazildi ve silindi. |
| `mobil/lib/` | Supabase cagrilari ve saf yardimcilar (`mekan.ts`, `checkin.ts`, `sohbet.ts`, `bag.ts`, `akis.ts`, `zaman.ts`, `konum.ts`, `yol-tarifi.ts`, `hata-metni.ts` ...). Sozlukler `lib/ceviriler/{tr,en,de,es,fr,ru,ar}.ts`, hukuki metinler `lib/hukuki/`. |
| `mobil/supabase/migrations/` | Butun veritabani gecmisi (tarihli SQL). Canliya MCP `apply_migration` ile uygulanir, dosya da depoya konur. |
| `mobil/supabase/functions/` | Edge Function'lar: `hesap-sil`, `bildirim-gonder` (Deno). |
| `mobil/__tests__/`, `mobil/lib/*.test.ts` | Jest + RNTL (Supabase mock'lu). |
| `mobil/gorunurluk-testleri/` | CANLI veritabanina karsi senaryo kosucu (`npm run test:gorunurluk`, `test:sema`). |
| `mobil/araclar/` | Ekran goruntusu (`ekran-goruntusu.mjs`), marka/simge uretimi. |
| `araclar/` | Python canli testler (`*-canli-test.py`), Foursquare/OSM veri yukleme betikleri, ikon uretimi. |
| `site/` | Astro sitesi (slooin.com): ana sayfa, gizlilik, kosullar, destek, hesap-sil, 404; `functions/_middleware.js` dil algilama; `araclar/dogrula.mjs` (yerel dist) ve `canli-dogrula.mjs` (canli site). |
| `panel/` | Moderasyon paneli (Vite + React, ayri uygulama, moderator TOTP ile girer). |
| `docs/` | Karar defteri, KVKK dosyalari, spec/plan'lar (`docs/superpowers/`), oturum dokumleri (`docs/oturumlar/`, hook otomatik yazar), CLAUDE.md arsivi. |
| `tasarim/` | Referans gorseller, ekran goruntuleri, kanvas dosyalari. |
| `.claude/` | Hook'lar (oturum kaydi, claude-mem nobetci), proje becerileri, eklenti ayarlari. |
| `.easignore` | EAS arsivini 1,2 GB'tan 5 MB'a indiren liste; sirlari da disarida tutar. DOKUNMADAN once CLAUDE.md'deki bolumu oku. |

## 3. Servisler ve hesaplar (deger yok, yalnizca nerede)

| Servis | Ne icin | Kimlik / not |
|---|---|---|
| **Supabase** | Postgres + PostGIS, Auth, Storage, Edge Functions, Realtime | Proje ref `swpiibyuoffykbmirvgq` (Pro plan, org "uygulama"). MCP `claude.ai Supabase` ile SQL/migrasyon/log okunur. |
| **Expo / EAS** | Derleme, OTA, web dagitimi | projectId `972aa05d-569b-4a5a-ab75-2b149fd8588c`, slug `slooin`, paket `com.slooin.app`. Kanal `production`, runtime `1.0.0`. |
| **Apple Developer** | App Store, TestFlight, Sign in with Apple | Team `79QNZVGJC7`, ASC app id `6806677710`, Services ID `com.slooin.app.web`, Key ID `4T394Q83H5` (.p8 `mobil/gizli/`, gitignored - YEDEKLE). Build 8 TestFlight'ta. |
| **Google Cloud** | OAuth (web/iOS/Android istemcileri), Maps SDK for Android | Proje `slooin`, hesap `slooinapp@gmail.com`. Faturalandirma acik (deneme kredisi). |
| **Google Play Console** | Android yayini | Hesap `slooinapp@gmail.com`. Kapali test icin AAB `6a377678…` hazir, yukleme kullanicida. |
| **Cloudflare** | Alan adi `slooin.com`, Pages, Email Routing (`destek@` -> gmail), DNS | Hesap `slooinapp@gmail.com`, account id `376c8a91fdd83c6366bdcf10e65dc08c`. |
| **Resend** | SMTP (Supabase auth postalari) + API | Hesap `slooinapp@gmail.com`, gonderen `noreply@slooin.com`, alan adi verified. |
| **Foursquare OS Places + OpenStreetMap** | Mekan verisi (5,98M kayit) + il/ilce poligonlari | Atif ekranda zorunlu (ODbL). |
| GitHub | Depo | `ozdmrorcn16` |

**Sirlar:** `mobil/.env` (gitignored) icinde: Supabase URL/anon/service
role, Google OAuth istemci kimlikleri, Apple kimlikleri, Maps Android
anahtari, Resend anahtari, test hesabi sifresi. Ayni degerler EAS
`production` ve `preview` ortamlarinda da tanimli (`eas env:list`).
Yeni makinede `.env`'i ya kullanicidan iste ya da her degeri kendi
panelinden yeniden al; **sohbete yapistirma** (oturum kaydi maskeler
ama bir kez sizinti yasandi).

Demo/test hesabi (Apple incelemesine de verildi): `test0@slooin.test`
/ `test1234`. `.test` adreslerine posta GITMEZ.

## 4. Nasil calistirilir

```bash
cd C:\Users\orcns\projects\cloud
git fetch origin && git checkout claude/plan2-moderasyon-paneli && git pull
cd mobil && npm install
npx jest --runInBand          # 75 paket / 992 test (2026-09-14)
npx tsc --noEmit              # uygulama kodunda 0 hata (gorunurluk-testleri/rota-agaci'ndaki Buffer/fs hatalari onceden var)
npm run test:gorunurluk       # CANLI DB senaryolari (SLOOIN_SENARYO=66 ile tek senaryo)
npm run test:sema             # CANLI sema/yetki dogrulamasi
npx expo start --web --port 8123   # dev sunucu; .expo/types/router.d.ts bunu bir kez calistirinca uretilir (tsc icin sart)
```

Yayin (her isin sonunda ikisi de yapilir):

```bash
npm run yayinla                                     # expo export + eas deploy --prod  -> slooin.expo.app (3-4 dk onbellek)
npx eas-cli update --channel production --platform all --environment production --message "..." --non-interactive   # OTA (--environment sart)
```

Native derleme (OTA ile gitmeyen degisikliklerde: yeni native modul,
Info.plist, entitlement):

```bash
npx eas-cli build --platform ios --profile production --non-interactive
npx eas-cli submit --platform ios --latest --non-interactive
npx eas-cli build --platform android --profile production --non-interactive   # AAB, Play Console'a kullanici yukler
```

Ekran goruntusu (gercek telefon olcusu, puppeteer + sistem Chrome):

```bash
npx expo export --platform web && python <scratch>/spa-sunucu.py dist 8080   # ya da herhangi bir SPA sunucusu
SLOOIN_TEST_EPOSTA=test0@slooin.test SLOOIN_TEST_SIFRE=test1234 SLOOIN_TEST_SEMA=light node araclar/ekran-goruntusu.mjs mekanlar ../tasarim/x.png
```

Site: `cd site && npm run build && npm run dogrula` (dogrula DERLEME
YAPMAZ, once build), canli: `npm run dogrula:canli`.

Edge Functions: `cd mobil/supabase/functions && deno check hesap-sil/index.ts && deno test --allow-net --allow-env`; deploy MCP `deploy_edge_function` ile.

## 5. Mimari ozet (sunucu kurallari)

- **Butun is kurallari SUNUCUDA** (RPC'ler `security definer`, RLS
  politikalari). Istemci hicbir gorunurluk/yetki kurali tasimaz. Jest
  Supabase'i mock'ladigi icin sunucu davranisini GOREMEZ - sunucu
  degisince `test:gorunurluk` ve ilgili `araclar/*-canli-test.py`
  kosulur.
- Onemli RPC'ler: `yakin_mekanlar_yogunluk` (liste + arama, il
  siniri, sayfalama, `kapak_fotograf`), `check_in_yap`,
  `mekan_son_check_inler`, `mekan_liderlik`, `mekan_fotograflari`,
  `mekan_puanla`, `konusmalarim`, `mesajlari_getir`, `mesaj_gonder`,
  `konusmayi_sil`, `engelle`, `hesap_durumlari`, `verilerimi_disa_aktar`,
  moderasyon `moderasyon_*`.
- Gorunurluk modeli: canli check-in yalnizca `bulunurluk` ayarina ve
  ayni mekanda/arkadas olmaya gore gorunur ("check-in gorunurlugu"
  politikasi). Engelleme SESSIZ: engellenen "kullanici bulunamadi"
  gorur. Engelleme konusmayi SILER; mesaj istegi geri cekilemez.
- Sabit kurallar: liste siralamasi HER ZAMAN en yakindan uzaga;
  yakin mekanlar 500 m/1 km yaricap (arama ise il siniri, yaricap yok);
  dis kaynakli mekanda TUR gosterilmez (yalnizca kullanici ekledigi);
  mahalle YOK, yalnizca ilce + il; turetilmis veri YOK.
- KVKK: her yeni is `docs/kvkk-uyum-listesi.md` dosyasindaki dort
  soruyla (hangi veri, dayanak, sure, kim gorur) kapatilir. Yurt disi
  aktarim envanteri `docs/kvkk-aktarim-envanteri.md`. Avukat YOK;
  hukuki arastirmayi ajan yapar, kaynak gosterir.
- Kimlik: e-posta + parola (SMS yolu ELENDI - operator kaydi sirket
  ister). Apple ve Google girisi Supabase'de acik, native derleme 8'de.
  Hesap silme e-posta onay koduyla (10 dk OTP).
- Bildirimler: DB trigger -> pg_net -> Edge Function -> Expo Push.

## 6. Araclar, eklentiler, beceriler (Claude tarafi)

Proje ayari `.claude/settings.json`; yeni makinede `claude plugin list`
ile GERCEKTEN yuklu mu diye bak (settings'e bakmak yetmez; `claude plugin
install <ad>@claude-code-plugins --scope project`, sonraki oturumda
devreye girer).

- **Eklentiler:** `superpowers` (brainstorming/plan/TDD/debug
  becerileri; `using-superpowers` her oturumda yuklenir),
  `frontend-design`, `code-review`, `security-guidance` (hook),
  `claude-mem` (oturumlar arasi gozlem hafizasi; worker port 37777,
  nobetci hook `.claude/hooks/claude-mem-nobetci.ps1`; observer Claude
  kotasini kullanir, kota bitince kayit durur - yeniden baslatma).
- **Proje becerileri** (`.claude/skills/`): `slooin-tasarim` (gorsel
  kimlik kurallari), `design-taste`, `frontend-design`, `no-ai-slop`.
- **Kullanici becerileri** (`~/.claude/skills/`, makineye bagli):
  `gstack-*` (54 beceri), `agent-reach` (web/YouTube/Reddit/GitHub
  erisimi).
- **MCP sunuculari:** `claude.ai Supabase` (SQL, migrasyon, log, edge
  deploy - EN COK KULLANILAN), `claude-in-chrome` (gercek Chrome; iki
  profil var, hangi hesabin acik oldugunu SAYFADAN oku, varsayma;
  kullanici uzaktayken izin isteyen araclara yaslanma), `Figma`,
  `ElevenLabs` / `Higgsfield` (gorsel varlik uretimi - once maliyet sor).
- **Hook'lar:** `oturum-kaydet.py` (her oturum `docs/oturumlar/`ye
  dokum yazar, sirlari maskeler; commit oncesi taranir), claude-mem
  nobetci (SessionStart).
- **Hafiza katmani:** `CLAUDE.md` (otomatik yuklenir; kurallar,
  tuzaklar, acik borclar - KISA tutulur, tarihli anlatim
  `docs/claude-md-arsiv.md`'ye), `docs/konusma-gunlugu.md` (numarali
  kararlar, son: 92), bu dosya, ve makineye bagli otomatik hafiza
  (`~/.claude/projects/C--Users-orcns-projects-cloud/memory/`). O
  hafiza yeni hesapta/makinede OLMAYABILIR - ozu 7. bolumde.

## 7. Kullanicinin kaliciligi olan kurallari (hafizadan ozet)

Bunlar kullanicinin acikca soyledigi, her oturumda gecerli kurallar.
Yeni oturum bunlari bilerek baslar.

1. **Turkce konus** - her kullaniciya donuk metin (durum satiri dahil).
2. **Kullanici cogu zaman bilgisayarin basinda degil**; telefondan
   takip ediyor. Onay isteyen araca (claude-in-chrome) ilk secenek
   olarak yaslanma; izin reddedilirse tekrar deneme, alternatif yolu
   soyle. Uzun iste kisa durum satirlari yaz; sessizlik "cevap
   vermiyor" diye okunuyor. Panel islerinde (sozlesme kutusu, proje
   olusturma, yayina alma) sormadan yap, sonunda raporla; kart/odeme
   ve parola girisi kullanicida kalir.
3. **Karari sen ver**, secenek dizme; secmek gerekiyorsa en iyisini
   gerekcesiyle sec. Soru sorman gerekiyorsa **tek tek** sor.
4. **Referans gorsel birebir uygulanir**; bitmis varlik yeniden
   kurulmaz. Daha iyisi varsa ONER, karar onun. Tasarim secenekleri
   yaziyla degil GORSEL sunulur (once gorsel, sonra kod).
5. **Istenen kadarini yap**, sonraki ekrani/adimi kendiliginden ekleme;
   ekranlar sayfa sayfa, kullanicinin talimatiyla ilerler. Ama
   **yarim is birakma**: basladigin isi bitir; kendi tespit ettigin
   eksigi "sonraki is" diye yazma, o an yap (borc listesine yalnizca
   baskasina bagli isler girer).
6. **Yaklasik/temsili surum yok**: ya gercegini yap ya hic yapma;
   tekrarlayan gider gerekiyorsa once maliyeti sor (aylik gidere
   temkinli).
7. **Guvenilmeyen veriyi gosterme; turetilmis veri uretme.** Bos alan
   yanlis bilgiden iyidir. Mekan verisi kusursuz olmali (tur hatasi
   kabul edilemez) - cozum kapsami daraltmak degil dogru siniflamak.
8. **Gizlilik/KVKK her adimda**, ama isletmeci yetkisi daraltilmaz:
   yetki genis kalir, uyum aydinlatma + denetim izi + saklama suresiyle
   saglanir. Onaylar tek yerde (kayit adimi), yeni onay kutusu
   eklenmez. Erken hata ver (bosa is yaptirma).
9. **Kalite citasi:** magazadan reddedilmeyecek, hizli ve akici, gercek
   kullanima gore ayarlanmis sayilar (tek kisilik teste gore degil).
   Model/rigor'dan tasarruf etme; kota bitince bekle.
10. **Gorsel kimlik:** turuncu `#FE7813` degismez; bilesen olcusu yan
    etkiyle kucuelmez; ayni kavram her ekranda ayni bilesenle cizilir;
    tek yazi ailesi; sayfa zemini tam beyaz; listeler sonsuz kaydirma
    (onizleme + "Tumu" deseni yok); ekran metinlerinde "bag" degil
    "arkadas".
11. **Bir kural soylendigi ekranin gosterim kuralidir**; veri modeline
    ya da baska ekranlara kendiliginden yayilmaz.
12. **Ceviri:** tasarim surerken yalnizca `tr.ts`; diger diller toplu
    ve sonra (bugun 7 dil TAMAM; yeni anahtar eklerken artik yedisine
    birden yazilir, `ceviri-tamlik` testi kilitler).
13. **Her sey push edilir; sir asla depoya girmez.** Oturum dokumleri
    commit oncesi sir kaliplarina taranir (eslesen icerik yazdirilmaz).
14. Kullanici bir seyin var oldugunda israr ederse ayni aramayi
    tekrarlama; yeni kaynaklara bak (`git fetch`, tarayici gecmisi).
15. Her oturumda eklenti/becerilerin GERCEKTEN aktif oldugunu dogrula.
16. **Oturumlar arasi hafiza hep bir sonrakine aktarilir**: is
    bitmeden/kesilmeden once CLAUDE.md + gunluk + bu dosya guncel olsun.

## 8. Kaldigi yer (2026-09-17)

**Son bitirilen is (2026-09-17, YAYINLANMADI):** buyuk acilan
fotografin sol altinda paylasan kisi, mekan ve zaman gosteriliyor
(karar 96). Mekan galerisindeki altyazi `src/tasarim/FotografAltyazisi.tsx`
bilesenine cikarildi; akis kartinin tam ekran gorunumu ve profildeki
fotograf izgarasi da ayni satiri kullaniyor. Altyazida uc dokunus
hedefi var: avatar ve kullanici adi profili, mekan adi mekan sayfasini
aciyor.

**Ayni gun daha once (YAYINLANMADI):** check-in listesindeki
kartlar tekduze hale getirildi ve karenin ici gercek harita oldu
(kullanicinin istegi; karar 95). Eylem satiri (Yol tarifi + Check-in
yap) her kartta; turuncu cerceve yalnizca en yakinda.
`src/tasarim/MekanKapakHarita.native.tsx` iOS'ta Apple, Android'de
Google Haritalar ciziyor (buyuk haritayla ayni motor, `harita-ortak.ts`);
web'de igneli kutu kaliyor. Harita yalnizca ekrana yakin kartlarda
kuruluyor. Jest 76 paket / 997 test, tsc'de yeni hata yok.

**YAYIN BORCU:** bu is BULUT oturumunda yapildi, orada EAS girisi ve
`mobil/.env` yok - `npm run yayinla` ve `eas update` KOSULMADI.
Telefonda gorunmesi icin kullanicinin makinesinden yayinlanmali:
`cd mobil && npm run yayinla` + `npx eas-cli update --channel
production --platform all --environment production --message "..."
--non-interactive`. Gercek harita ancak TELEFONDA gorulur (web'de
react-native-maps yok).

**Bir onceki is:** Check-in ekranindaki "Yakinindaki mekanlar"
listesi kullanicinin referans gorseline gore yeniden yazildi (commit
`ac800f7`; web `slooin--6nj44gwuyk`, OTA grup
`bf373ed7-9d37-4e01-bc56-4e6c2dd2022f`):

- Kart: solda 96 px kare kapak (`mekanlar.kapak_fotograf`, moderator
  onayli; yoksa igneli acik turuncu kutu), sagda ad + durum rozeti
  (renkli nokta: yesil Sakin / kirmizi Yogun / sari Populer), altinda
  "Kafe • Nilüfer, Bursa • 120 m" (tur yalnizca kullanici ekledigi
  mekanda), en altta avatar yigini (en fazla 3, yalnizca SANA GORUNEN
  canli check-in'ler - `check_inler` dogrudan, RLS) + "4 kişi burada".
- En yakin (ilk) kart turuncu cerceveli; altinda "Yol tarifi"
  (cerceveli, `lib/yol-tarifi.ts` - mekan sayfasiyla ortak) +
  "Check-in yap" (dolu). Diger kartlarda Check-in kisi satirinin
  saginda; dar ekranda sarar.
- Baslik sagi "Mesafeye göre" ETIKET (secici degil; siralama sabit).
- Migrasyon `20260914150000` (RPC `kapak_fotograf` donduruyor, canliya
  uygulandi). 7 dilde `kesfet.mesafeyeGore`, `kesfet.yolTarifi`;
  `kesfet.yakinindakiMekanlar` = "Yakınındaki mekânlar".
- Telefonda henuz kullanici dogrulamadi (OTA yeni gitti). KVKK: yeni
  veri sinifi yok - avatarlar mekan sayfasindaki "kim burada" ile
  ayni politikadan geciyor; `docs/kvkk-uyum-listesi.md`'ye kisa not
  eklendi.

**Ayni gun daha once bitenler:** mesajlar listesinde avatar +
sola kaydirinca Sil (benden silinir, onayli), sohbette her balonda
avatar, saat, gun ayraci, "Teslim edildi", geri oku, klavye duzeltmesi
(iOS); profil arkadas listesi menusu (Arkadasliktan cikar / Engelle);
baskasinin profilinde turuncu "Mesaj yaz", "Arkadassin" menusu, doku
tepeye kadar; web giris sayfasi IPTAL; sitede 404 sayfasi + canli
dogrulama; `.easignore`; Resend KVKK sozlesme talebi gonderildi.

**Kullanicinin elinde olan acik isler (ajan yapamaz):**
- App Store Connect: gizlilik adresi `https://slooin.com/gizlilik/`
  (Safari'den; ASC mobil uygulamasi bu alani duzenletmiyor);
  TestFlight Test Information ayni adres.
- Play Console: kapali test icin AAB `6a377678…` yukleme, ayni
  gizlilik adresi, icerik derecelendirme, veri guvenligi formu.
- Telefonda dogrulama: iOS klavye, sola kaydirip Sil, yeni mekan karti.
- Apple Developer SPF paneli kirmizi (kozmetik; posta zinciri olculdu
  ve calisiyor).
- Resend/Supabase/Expo KVKK standart sozlesme cevaplari
  (`docs/kvkk-standart-sozlesme-talep-yazilari.md`).
- Play App Signing anahtari icin IKINCI Android OAuth istemcisi
  (magazaya cikinca; yoksa Google girisi DEVELOPER_ERROR).
- Panelde 1 bekleyen sikayet var ve GERCEK DEGIL (test kalintisi).

**Sirada ne var:** kullanici ekran ekran talimat veriyor; sirayi o
belirler. Kendiliginden yeni ekran acma. Magaza oncesi denetim
listesi `docs/magaza-hazirlik-denetimi-2026-09-13.md`.

## 9. Yeni hesap/makinede ilk 10 dakika

1. Depoyu klonla, dala gec, `mobil/npm install`, `site/npm install`.
2. `mobil/.env`'i kullanicidan al (ya da 3. bolumdeki panellerden
   yeniden uret). `mobil/gizli/AuthKey_*.p8` yedegini iste.
3. `npx eas-cli whoami` (Expo hesabi), `claude plugin list`, MCP
   Supabase baglantisini dene (`list_projects`).
4. `npx jest --runInBand` yesil mi, `npx expo start --web --port 8123`
   ile `.expo/types/router.d.ts` uret, `npx tsc --noEmit`.
5. `CLAUDE.md`'nin "ACIK BORCLAR" ve bu dosyanin "Kaldigi yer"
   bolumunu oku; kullaniciya tek cumleyle "buradan devam ediyorum" de
   ve talimat bekle.

## 10. Bu dosyanin bakimi

- Her yayindan sonra 8. bolumu guncelle (commit, web dagitim adi, OTA
  grup, ne degisti, kullanicinin dogrulayacagi seyler).
- Yeni servis/hesap eklenince 3. bolume satir ekle (deger yazma).
- Kullanici yeni bir kalici kural koyunca 7. bolume tek madde ekle.
- Dosya tek parca ve okunur kalsin; tarihli anlatim buraya degil
  `docs/claude-md-arsiv.md` ve `docs/konusma-gunlugu.md`'ye.
