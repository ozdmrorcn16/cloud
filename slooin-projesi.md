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

## 8. Kaldigi yer (2026-09-22)

**Son bitirilen isler (2026-09-20 / 21, hepsi YAYINDA - son OTA grup
`ed53c110`, web `slooin.expo.app` guncel, iki depoya push):** kullanicinin
telefondan art arda gonderdigi ekran goruntusu ve referanslarla ~30
kucuk tur. Her birinin ayrintisi CLAUDE.md'de tarihli basliklarda; ozet:
- **Check-in haritasi:** ad etiketleri iOS'ta iğnenin sağında
  (`centerOffset`, kabsiz isaretci, olculen genislik); Yasal/Apple
  logosu sol alta sabit (harita panelin ustunde biter; inset override'i
  yarisliydi); panel elle suruklenir (her yerinden; PanResponder duz
  View'da, Pressable'da eziliyor); mesafe secimi kalici; aktif check-in
  karti basligin ustunde ve varken kapali panel yalnizca o kart;
  kart/panel olculeri referanstan (kare gercek harita 72, cercevesiz).
- **Ana sayfa:** arama sutunu kalkti, sol basta buyutec -> /kisiler;
  kart tek cumle baslik ("ad, mekan'de check-in yapti" - Turkce
  bulunma eki `lib/bulunma-eki.ts`), "adlar ile birlikte", 2:1
  fotograf, yuvarlak cerceveli kart, ic cizgi yok; ifade yalnizca ikon;
  duzenlemede ifade ekle/kaldir (RPC `check_in_ifadesini_guncelle`).
- **Check-in formu:** referans duzeni (mekan karti, Notun, kesikli
  fotograf kutusu, Arkadas etiketle, Birlikte cipleri), tek ekran
  kaydirmasiz (SE dahil); ifade secici kategorileri yana kaydirmali,
  secili cip serit ortasina kayar.
- **Profil:** gizli profili yalnizca ARKADASLIK acar (kabul sohbet
  acmaz - canlida bulunan hata); sikayet damgasi kalkti, tekrar
  sikayette uyari; cek-yenile; ani sayisi sunucudan; sayaclar bolum
  secer (baskasinda arkadas listesi RPC `baskasinin_arkadaslari`);
  kendi profilde "Arkadaslarim" sayfasi (referans); "Anilarim kimlere
  gorunsun" ayari ve RPC'si TAMAMEN KALDIRILDI (kullanicinin 29 anisini
  'kimse' yapmisti; veri duzeltildi); kullanici adi 24 saatte bir.
- **Sohbet:** ust barda adin altinda @kullaniciadi.
- **Genel hatalar:** SecimPenceresi secim once kapanir sonra eylem
  (iOS'ta ikinci Modal acilmiyordu, paylasim sayfasi menuyle kapaniyordu),
  paylasim kalkani kendini kilitleyemez (ekran donmustu).
- **Yan bulgu:** MCP `apply_migration` postgres rolunde kosmuyor ->
  yeni fonksiyona `revoke ... from public, anon` ACIKCA yazilir.

Jest 84 paket / 1124 test; test:sema ve test:gorunurluk yesil
(21.09 ogleden sonra). Telefonda dogrulanmamis son ikisi: ifade
duzenleme ve "ifade yalnizca ikon" - kullanici bakacak.

**Ek (2026-09-21 gece, YAYINDA - OTA `46bcc97d` + `9ec78c2e`, web
guncel):** (1) profil/baskasinin profili anilar sorgusu `ifade`
secmiyordu - duzeltildi (kart uc ekranda ayni). (2) Kartin yerinde
duzenlemesine FOTOGRAF satiri: ekle / degistir / kaldir; RPC
`check_in_fotografini_guncelle` + kova silme politikasi; kaldirilan
dosya kovadan gercekten siliniyor. Ayrinti CLAUDE.md "KARTTA FOTOGRAF
DEGISTIR/KALDIR". Jest 85 paket / 1134 test, test:sema yesil, canli
12/12.

**Ek (2026-09-22, YAYINDA - OTA `4a9aa8ec`, web guncel):** COKLU FOTOGRAF
(check-in basina 5) + referanstaki "Check-in'i duzenle" alttan sayfasi.
Sunucu: `check_inler.fotograflar text[]`, `fotograf` generated, RPC
`check_in_fotograflarini_guncelle`, kova politikasi; istemci: kart
fotograf seridi (yana kaydirmali), duzenleme sayfasi, form coklu secim,
galeriler fotograf birimi. Yerinde duzenleme KALKTI. Ayrinti CLAUDE.md
"COKLU FOTOGRAF (5)". Jest 87 / 1154; canli paketler yesil.

**Ek (2026-09-22 ogle, YAYINDA - OTA `760d92cb`, EF v8):** begeni ve
yorum PUSH bildirimleri (yeni anahtar "Begeniler ve yorumlar"),
Bildirimler'de "Etkilesimler" bolumu, bildirimden acilan yeni PAYLASIM
ekrani (`/paylasim/<id>`), kartta begeni sayisina dokununca BEGENENLER
listesi. Ayrica duzenleme sayfasi referans 2'ye gecti (ikonlu basliklar,
Ifade/Birlikte kutulu satirlar), dip not kalkti, gezginde dikey
surukleme kapatir, izgarada fotografa dokununca buyuk acilir. Ayrinti
CLAUDE.md 2026-09-22 basliklari. Jest 89 / 1169.

**Ek (2026-09-22 aksam, YAYINDA - OTA `5f57ccfc`, web guncel, panel
yeniden yayinlandi):** ana sayfaya INSTAGRAM BENZERI HIKAYE AKISI
(kullanicinin "dediklerinin hepsini yap" onayiyla sikayet dahil). Tek
fotograf + yazi (<= 200) + mekan etiketi (aktif check-in'den), 24 saat
(saatlik cron satiri ve dosyayi siler), yalnizca arkadaslara gorunur,
kisi basina 10 hikaye; ana sayfa seridi (kendi dairem + gorulmemis
turuncu halka), ekleme ekrani, tam ekran izleyici (5 sn ilerleme,
dokunusla ileri/geri, basili tut durdur, dikey surukleme kapatir),
"N kisi gordu" + gorenler listesi, mesajla yanit, silme; sikayet hedefi
'hikaye' ve panelde "Hikayeyi gizle / Gizlemeyi kaldir". PUSH YOK.
Sunucu: migrasyon `20260922150000`, kova `hikaye-medyalari`, 7 RPC + 2
moderasyon RPC'si, disa aktarimda `hikayelerim` +
`hikaye_goruntulemelerim`. Gizlilik metni 7 dil + docs + KVKK listesi.
Jest 93 / 1203, test:sema yesil, canli `araclar/hikaye-canli-test.py`
20/20. Ayrinti CLAUDE.md "HIKAYE AKISI (24 SAAT)".

**Ek (2026-09-22 gece, YAYINDA - OTA `0e8c037c`, web guncel):**
PERFORMANS. Kullanicinin bildirimi "her sayfa her seferinde yuklenmeye
calisiyor" olculdu (`mobil/araclar/gezinme-olcum.mjs`): sekme basina
26-37 istek, ve ikinci donuste de ayni. Dort kok neden: onbellek yok
(`Slot` ekrani unmount ediyor), `auth.getUser()` sayfa basina dort kez
AGA gidiyor, ayni avatar bes kez imzalaniyor, alt gezinme rozetleri her
yol degisiminde dort istek. Dort katman eklendi: `lib/kimlik.ts`
(kimlik yerel oturumdan), `lib/fotograf-url.ts` imza onbellegi + toplu
imzalama, `lib/onbellek.ts` "once eldekini goster arkada tazele" (ana
sayfa, profil, mesajlar, kesfet + son bilinen konum), rozetler tek
turda ve 60 sn'de bir. Olcum: ana sayfa 37/1249 ms -> 13/689 ms, profil
26/951 -> 10/356, mesajlar ~12 -> 4. Jest 95 / 1222. Ayrinti CLAUDE.md
"PERFORMANS".

**Ek (ayni gece, OTA `f4847f7e`):** kullanicinin "bildirimler birazcik
yine yavas" bildirimi uzerine BILDIRIMLER ekrani da onbellege alindi
(ilk turda listede yoktu) ve iki tekrar kaldirildi: `gelenIstekleriGetir`
alti sirali tur yerine iki turda (kimlik sorgulari paralel, kisiler tek
`bag_kisileri` + tek avatar cagrisi), ekranin avatarlari bastan sorma
adimi kalkti (listeler avatari zaten tasiyor). 8 istek -> 6, ekran dolu
aciliyor. Jest 95 / 1225.

**Ek (OTA `8122ea6e`):** kullanicinin "Olc" talimatiyla `bag_kisileri`
ve `akis_profilleri` canlida karsilastirildi (rollback'li gecici veri):
yasakli/askida/dondurulmus/iki yonlu engelleme senaryolarinda sonuc
birebir ayni. Kisi cozumu tek RPC'ye indi (bir gidis-donus daha az).
Ayni olcumde ikinci turda yaptigim birlestirmenin 200 kimlik sinirinda
kirilabildigi bulundu (150+150 bekleyen istek -> ekran hata verirdi);
`profilOzetleriniGetir` artik 200'luk dilimlere bolup paralel soruyor.
test:gorunurluk 453 dogrulama ve test:sema yesil, jest 95 / 1229.

**Ek (OTA `c6b5d227`):** kullanicinin bildirimi "hikayelerdeki dolma
ibaresi beyaz bir fotografta hic gorunmuyor" - hikaye izleyicisinde
ilerleme cubugu, kimlik satiri ve alt eylemler acik renkli fotografta
kayboluyordu. Instagram deseni: ust ve alt koyu gradyan (fotografin
kendisi karartilmiyor), cubugun bos kismi koyu. Olculdu: dolu/bos
parlaklik farki 18 -> 190. Yeni arac
`araclar/hikaye-ekran-goruntusu.mjs` (hikaye ekrani genel arac ile
cekilemiyor: fotograf imzali adresten geliyor, ileri dokunmak gerekiyor).

**Ek (OTA `cf04722e`):** kullanicinin istegi "Instagram'in hikaye
isleyisini tam ogren ve aynisini yap" - isleyis arastirilip farklar
uygulandi: YATAY KAYDIRMA kisi degistiriyor (sola sonraki, saga
onceki; son kisiden sola kaydirmak kapatiyor), YUKARI KAYDIRMA artik
kapatmiyor - baskasinin hikayesinde yanit kutusunu, kendi hikayende
izleyen listesini aciyor; BASILI TUTARKEN arayuz gizleniyor; HIZLI
EMOJI TEPKILERI eklendi (dokunmak emojiyi sohbete gonderiyor).
Kapsam disi birakilanlar (ayri ozellik, isleyis degil): video, muzik,
sticker, anket, yakin arkadaslar, one cikanlar, arsiv, baglanti.
Jest 95 / 1238 (izleyici 18 test). Ayrinti CLAUDE.md "HIKAYE IZLEYICI
= INSTAGRAM ISLEYISI".

**Ek (OTA `80d32f0c`):** kullanicinin bildirimi "hikayeler arasi gecis
cok kotu surekli yeniden yukleniyor" olculdu (yeni arac
`araclar/hikaye-gecis-olcum.mjs`): acilista ilk fotograf 1581 ms,
her ileri geciste yeni indirme (389-466 ms). Uc kok neden duzeltildi:
izleyici seridin onbellegindeki veriyle ANINDA aciliyor (12 RPC -> 1),
komsu kareler onceden iniyor (gorunen kare indikten SONRA - once
denendi ve acilisi 3683 ms'ye cikardi), gorsel onbellegi acildi.
Sonuc: acilis 26 ms, gecisler 7-20 ms ve ek indirme YOK.
Jest 95 / 1240.

**Ek (OTA `dfb3217a`):** yanit YAZMA kutusu kaldirildi (hizli tepki
emojileri duruyor; yukari kaydirma artik yalnizca kendi hikayende
izleyenleri aciyor). Gecikmenin ilk kok nedeni bulundu: hikaye
imzalari ortak imza onbellegine BAGLI DEGILDI, her cekiliste yeni
adres uretiliyor ve gorsel onbellegi iskaliyordu - baglandi.
**ACIK IS (kullanicinin karari):** asil darbogaz hikaye
fotograflarinin ~2 MB olmasi (olculdu: 1686/1892/2507 KB). Supabase
gorsel donusumu canlida denendi (1686 KB -> 311 KB) ama tekrarlayan
gider oldugu icin ACILMADI; kullanici "sonra ucretsizi yapicaz" dedi.
YAPILACAK: bir sonraki NATIVE DERLEMEYLE birlikte
`expo-image-manipulator` kurulup `hikayeEkle` yukleme oncesi 1080 px'e
olceklesin (ayni desen check-in fotograflari icin de dusunulmeli).
Jest 95 / 1241.

**Ek (OTA `ce83f5eb`, web `slooin--yny6f8inhp`):** kullanicinin istegiyle
hikaye ekleme ekrani yeniden - once SIYAH TUVAL, fotograf gelince arac
seridi; mekan cipi (aktif check-in'den, kaldirilabilir), not, KENDI
IFADE SETIMIZDEN ifade ve ARKADAS ETIKETI. Sunucu: `hikayeler.ifade` +
`hikaye_etiketleri` (migrasyon `20260922180000`), etiket onayi check-in
ile ayni kurala tabi (onaylanmamis etiket kimseye gorunmez), yalnizca
arkadas etiketlenir. Bekleyen etiketler artik check-in ile TEK LISTE
(Bildirimler + Gizlilik > Bekleyen etiketler); `BekleyenEtiket` tipi
`{id, tur}` oldu. Canli test iki gercek hata yakaladi: `hikaye_akisi`
invoker oldugu icin gomulu `profiller` join'i etiketi sessizce
dusuruyordu (2026-09-18 tuzaginin aynisi) -> `gizli.hikaye_etiketleri_json`
definer yardimcisi. `verilerimi_disa_aktar` iki yonu de tasiyor.
Canli `araclar/hikaye-ifade-etiket-canli-test.py` 21/21, jest 95 / 1253,
test:sema yesil. Ayrinti CLAUDE.md "HIKAYEYE IFADE VE ARKADAS ETIKETI".

**ACIK / bekleyen:** telefonda dogrulanmamis: duzenleme sayfasi, cok
fotograf secimi, begeni/yorum push'u, Paylasim ekrani, HIKAYE AKISININ
TAMAMI (serit, izleyici dokunus/zamanlama, dikey kapatma, ifade ve
arkadas etiketi ekleme) ve PERFORMANS DUZELTMESININ HISSI (sekme
gecisleri).

## 8a. Onceki kayit (2026-09-19)

**Son bitirilen is (2026-09-19, sunucu tarafi CANLI - OTA/web gerekmedi,
istemci kodu degismedi):** BASTAN SONA GUVENLIK TARAMASI. Tek gercek
acik: `check_in_yap` fotograf yolunun sahibini kontrol etmiyordu
(baskasinin fotografi kendi check-in'ine yazilip okunabiliyordu) -
kapatildi, `profiller.fotograflar` icin tetikleyici, canli senaryo 61b.
anon'a acik kalmis 27 fonksiyon kapatildi ve VARSAYILAN YETKI degisti
(yeni fonksiyon otomatik yalnizca authenticated + service_role; anon
isteyen acikca grant yazar). Kova boyut/tur sinirlari, 5 FK indeksi,
Supabase "leaked password protection" ACIK, `mobil/gizli/` izlemeden
cikti. Migrasyonlar `20260919100000`, `20260919103000`. Jest 81/1064,
test:sema 160, test:gorunurluk tam yesil. Ayrinti CLAUDE.md "GUVENLIK
TARAMASI". Yapilmayan oneri: oturum jetonlari icin expo-secure-store
(native derleme ister).

**Son bitirilen is (2026-09-19, YAYINDA - web `slooin--z5dovg5pl5`, OTA
grup `2f1481d3-984a-49a9-a263-eb17edccafed`; commit `1d96bb1`):** AYARLAR
BASTAN - hub + 17 alt ekran (Hesap ve guvenlik: e-posta/sifre/oturumlar;
Gizlilik: profil/arama/etiketler/mesaj izinleri/engellenenler; Konum ve
check-in; Bildirimler; Uygulama: Gorunum (tema cihazda), Yardim merkezi
(SSS + mailto destek), Slooin hakkinda (topluluk kurallari + hukuki);
Hesap yonetimi: dondur/sil/verilerimi indir). Sunucu: oturumlarim RPC,
mesaj_izni, bildirim tercihleri + gece sessizi + ani hatirlatma cron, EF
bildirim-gonder v7. Supabase panelinde "Change Email Address" sablonu
ve "Secure email change" KAPALI - ben yaptim (opencli ile Chrome), canli
`araclar/eposta-degistir-canli-test.py` 9/9. Ayrinti CLAUDE.md
"AYARLAR YENIDEN" bolumu. Baska bir oturum ayni gun site maketleri
uzerinde calisiyor (`tasarim(site): D` commit'leri).

**ACIK:** kullanici telefonda yeni ayarlari denememis; bildirimde
"ikonlar yazilar birbirine girmis" duzeltildi (Liste.tsx ikon kabi),
baska geri bildirim bekleniyor. Ekran metinleri 7 dilde tamam.

**Son bitirilen is (2026-09-18 sabah, YAYINDA - web `slooin--o8bilmr5r0`, OTA
grup `1ca32176-e68d-43b6-bd5e-bc23ce6587f7`):** hesap olusturmaya 3. adim
"Oturdugun bolge" (ulke -> Turkiye'de il + ilce, ZORUNLU); profilde
varsayilan GIZLI, ayarlarda "Bolgemi profilde goster"; ulke hicbir zaman
gosterilmez (kural sunucuda). Profil duzenlemede ulke secici. Ayrica
moderasyon paneli yeniden tasarlandi ve CANLIDA: https://panel.slooin.com
(`cd panel && npm run deploy`).

**Daha once (2026-09-18 gece, DERLEMELER BITTI - iOS 1.0.0 (13)
App Store Connect'te, Android versionCode 7 AAB hazir; kullanici TestFlight'tan
Build 13'u kurup `slooin.com/byorcun` baglantisini WhatsApp'tan denemeli):** `slooin.com/<ad>`
dogrudan uygulamayi acsin - AASA + assetlinks sitede canli,
`associatedDomains`/`intentFilters` app.json'da, `[kullaniciAdi]` rotasi
OTA'da (`543abca5`). iOS derlemesi `d2b63476`, Android `6892d1ca`
baslatildi; iOS bitince `eas submit --platform ios --latest` ve
TestFlight'tan kurulmali. Ayrica paylasim sayfasi kapanisindan sonraki
dokunuslari yutan kok duzey kalkan (`PaylasimKalkani`).

**Ayni gece (uygulama web `slooin--gkekdg28wg`,
OTA grup `67202e96-1aac-479f-ab3a-693d5805e510`; site push ile):** profil
paylasimi `https://slooin.com/<kullanici_adi>` - sitede sunucu tarafi kart
sayfasi (Open Graph: avatar + ad + Slooin), Edge Function `profil-karti`,
RPC `profil_karti`, yasakli kullanici adlari, KVKK maddesi. Canli olculdu.

**Daha once ayni gun (web `slooin--h34snhhsx1`, OTA grup
`da1a61f4-482b-4dd4-8573-963f3f0ac669`):** paylas ikonu kutu + yukari ok
oldu (her yerde); profil sekmelerine ikon geldi (Anılar takvim+igne, En sık
donen oklar+igne, `sekme-ikonlari.tsx`).

**Ayni gece (web `slooin--wyx4c1zh3s`, OTA grup
`a0d6ca15-46fc-4f05-b447-3d5377f84e38`):** profil arkasindaki harita
dokusunda ana yol inceldi (6,5 -> 3,4 px; kullanicinin secimi A). Dunya
haritasi secenegi gorsel olarak hazirlandi, uygulanmadi.

**Ayni gece (web `slooin--e5046r3ffg`, OTA grup
`1a8f0143-59f5-4b8b-8b0e-118557184c4e`):** baskasinin profilinde avatar ve
profil fotografi seridi de basinca gezginde buyuk aciliyor. Ayni gece: profilde secili sekme ("En sık")
mekan sayfasindan geri donuste korunuyor (rota parametresi,
`lib/sekme-parametresi.ts`); fotograf buyuk acilinca saga-sola kaydirmali
gezgin (`FotografGezgini`) - mekan galerisi, kendi profil (izgara + kartlar)
ve baskasinin profili (kartlar) ayni bileseni kullaniyor. Akis degismedi.

**Ayni gun daha once (web `slooin--mqfme60uw0`, OTA grup
`1500d276-7b6e-4ef3-8ded-e6944804692c`):** check-in formundan once cikan
"Bu check-in ne paylasiyor?" bilgilendirme ekrani kaldirildi (aydinlatma
gizlilik metninde duruyor). Yan sonuc: tek check-in'i gizli yapma yolu
kalmadi, bulunurluk hep profil varsayilani.

**Bir onceki (2026-09-17 gece, web `slooin--gc6zljnv9g`,
OTA grup `ed4fc26c-486c-436d-bfa8-f58a4d111d4a`):** baskasinin profilinde
"Arkadaş ekle" dolu turuncu; istek gidince ayni dugme "Beklemede", tekrar
basinca onay penceresi ("Arkadaşlık isteğini geri çekmek istiyor musun?")
ve istek geri cekiliyor (ayri "İsteği geri çek" satiri kalkti).
Karsi tarafin Bildirimler karti sunucudan dustugu icin kendiliginden
kayboluyor; zaten dusmus push afisi geri cekilemiyor.

**Ayni gun daha once (web `slooin--vo1q6bhs9d`, OTA grup `66029f3f-c8a7-417b-ba6d-29294c8aa116`):** GIZLI profil
gorunumu sadelesti (karar 97) - o halde sayaclar butonlarin ustunde;
acik profilin duzeni degismedi. Ust cubukta tek dugme kaldi:
uc nokta (seftali daire). Menu = Profili paylaş / Şikâyet et /
Engelle; sikayet ve engelleme sayfanin dibinden oraya tasindi (magaza
sarti), paylas ikonu da menuye girdi.

**Ayni gun daha once (ayni yayinda):** buyuk acilan
fotografin sol altinda paylasan kisi, mekan ve zaman gosteriliyor
(karar 96). Mekan galerisindeki altyazi `src/tasarim/FotografAltyazisi.tsx`
bilesenine cikarildi; akis kartinin tam ekran gorunumu ve profildeki
fotograf izgarasi da ayni satiri kullaniyor. Altyazida uc dokunus
hedefi var: avatar ve kullanici adi profili, mekan adi mekan sayfasini
aciyor.

**Ayni gun daha once (ayni yayinda):** check-in listesindeki
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
