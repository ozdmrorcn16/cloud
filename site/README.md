# Slooin - web sitesi

`slooin.com` icin yazilmis, bes sayfalik statik bir Astro sitesi. Slooin
kendisi bir mobil uygulama (`mobil/`); bu site onun magaza basvurusu
icin ZORUNLU olan web varliklarini barindiriyor - uygulamanin kendisi
degil.

## Neden bu site var

App Store ve Google Play basvurusu ucu ayri web sayfasi istiyor:

- **Gizlilik politikasi** (`/gizlilik`) - ikisi de zorunlu kosuyor.
- **Destek adresi** (`/destek`) - Apple'in App Store Review Guideline
  1.5 maddesi bir Support URL istiyor.
- **Hesabi web'den silme** (`/hesap-sil`) - Google Play'in "hesap
  silme" politikasi, uygulamayi kaldirmadan da hesabin silinebilecegi
  bir web yolu istiyor.
- **Kullanim kosullari** (`/kosullar`) - magaza sarti degil ama
  gizlilik metniyle ayni ciddiyette tutulmasi gereken bir belge,
  bu is kalemi sirasinda sifirdan yazildi.

Bunlara ek olarak bir **ana sayfa** (`/`) var - uygulamayi tanitan tek
ekranlik bir sahne (Swarm tarzi kalabalik animasyonu + iki telefon
maketi).

## Neden Astro, neden Cloudflare Pages

- **Astro 7.3.1, `output: 'static'`.** Bes sayfanin dorduncusu
  (`/hesap-sil`) disinda hicbirinde calisma zamani JavaScript'i yok;
  Apple'in gizlilik/kosullar/destek sayfalarinin **JavaScript
  kapaliyken de okunabilir olmasi** sartini Astro'nun statik ciktisi
  dogal olarak sagliyor. `/hesap-sil` tek istisna: form gonderimi
  Supabase'e dogrudan tarayicidan gidiyor, o yuzden orada JS var ama
  sayfanin ACIKLAMA metni yine JS'siz de okunuyor (asagidaki
  `dogrula.mjs` bunu ayrica kontrol ediyor).
- **Barindirma icin Cloudflare Pages secildi, EAS Hosting DEGIL.**
  Once EAS Hosting denendi (uygulamanin kendi web surumu zaten orada,
  `slooin.expo.app`) ama **ozel alan adi baglamak Expo'nun ucretli
  planini gerektiriyor**. Cloudflare Pages ucretsiz katmanda ozel alan
  adini destekliyor, statik siteler icin dogrudan uygun ve GitHub
  deposuna push ile otomatik yayinliyor.

## Kurulum ve calistirma

```bash
cd site
npm install
cp .env.ornek .env      # gercek degerleri elle doldur, asagiya bak
npm run dev              # http://localhost:4321
npm run build             # dist/ uretir
npm run preview           # dist/'i yerelde servis eder
```

## Ortam degiskenleri

`site/.env` (gitignored, **depoya asla yazilmaz**):

```
PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-anahtar>
```

Bu iki deger yalnizca `/hesap-sil` sayfasindaki formun Supabase'e
baglanabilmesi icin gerekli (anon anahtar zaten RLS ile korunuyor ve
mobil uygulamada da gomulu - burada yeni bir sir acilmiyor, ayni
anahtar tekrar kullaniliyor).

**Cloudflare Pages panelinde de aynen tanimlanmalari gerekiyor**
(Settings > Environment variables), yoksa derleme zamaninda
`import.meta.env.PUBLIC_SUPABASE_URL` bos gelir ve `/hesap-sil` formu
calismaz. Degerler yalnizca panelde tutulur, hicbir dosyaya yazilmaz.

## `dogrula.mjs` - dogrulama araci

```bash
npm run dogrula
# esdeger: node araclar/dogrula.mjs
```

Bu, sitenin `jest` benzeri tek test kosumu. Once `dist/`i (build
onceden alinmis olmali) yerel bir HTTP sunucusuyla servis ediyor,
sonra Puppeteer ile su sorulari cevapliyor:

1. **Sayfalar** - bes sayfa da 200 donuyor mu.
2. **JavaScript kapali** - `/gizlilik`, `/kosullar`, `/destek`
   JavaScript devre disi birakilmis bir sekmede hala anlamli metin
   gosteriyor mu (Apple sarti, dogrudan olculuyor - varsayimla degil).
3. **Yatay tasma** - 1280 px (masaustu) ve 390 px (telefon) genislikte
   `scrollWidth` viewport'u asiyor mu, bes sayfada da.
4. **Marka ve radar** - ana sayfadaki kelime markasiyla radar
   halkalarinin merkezi hizali mi (piksel duzeyinde olculuyor).
5. **Hesap silme erisilebilirligi** - `/hesap-sil` JS'siz halde de
   destek adresini (`destek@slooin.com`) gosteriyor mu - parolasini
   unutmus ya da JS'i engellenmis birinin BASVURACAK bir yolu olsun
   diye.
6. **Cok dilli yapi** - asagidaki bolume bak; `diller.ts`'i GECICI
   olarak iki dile cevirip yeniden derleyerek yapinin gercekten
   calistigini kanitliyor, sonra dosyayi eski haline geri donduruyor.
7. **Olu ic baglanti** - sayfalardaki her `/` ile baslayan baglanti
   gercekten 200 donuyor mu.

Herhangi bir kontrol basarisiz olursa arac cikis kodu 1 ile biter ve
hangi kontrolun KALDI dedigini yaziyor. `npm run build` calistirmadan
`dogrula.mjs` calistirilirsa hemen hata verip durur - once build
gerekiyor.

Windows'ta Chrome yolu varsayilan olarak
`C:/Program Files/Google/Chrome/Application/chrome.exe`; farkli bir
yol gerekiyorsa `SLOOIN_CHROME` ortam degiskeniyle degistirilebilir.

## Canli hesap silme testi

```bash
python ../araclar/site-silme-test-hesabi.py   # EXPO_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY yuklu kabuk
# iki satir yazdirir: e-posta, parola
SILME_TEST_EPOSTA=<yazdirilan e-posta> SILME_TEST_PAROLA=<yazdirilan parola> \
  node araclar/silme-canli-test.mjs
```

Bu, `dogrula.mjs`'nin OLCMEDIGI seyi olcuyor: `/hesap-sil` formunun
GERCEKTEN bir hesabi silip silmedigini. Sirasiyla:

1. `site-silme-test-hesabi.py` gercek (ama atilabilir) bir hesap acar
   - `.test` uzantili bir e-postayla, `auth.admin.createUser` ile.
2. `silme-canli-test.mjs` `dist/`i servis eder, `/hesap-sil` sayfasini
   Puppeteer ile acar, formu bu hesabin bilgileriyle doldurup gonderir.
3. Sayfada basari mesaji ciktigini ve formun gizlendigini dogrular.
4. **Hesabin GERCEKTEN gittigini** ayri bir kontrolle dogrular: ayni
   parolayla giris dener, bu reddedilmeli (400).

**Bu test her kosumda gercek bir hesap acip gercek Supabase projesine
karsi gercekten siliyor** - mock yok. Bu yuzden `EXPO_PUBLIC_SUPABASE_URL`
ve `SUPABASE_SERVICE_ROLE_KEY` (servis rolu anahtari, yalnizca yerel
kabukta, asla depoya yazilmaz) gerektiriyor ve idempotent DEGIL: her
kosum yeni bir `silme-testi-<rastgele>@slooin.test` hesabi acip onu
siler.

**Bu test iki gercek uretim hatasi buldu**, ikisi de bu is kalemi
sirasinda duzeltildi:

1. Yayindaki `hesap-sil` Edge Function'i ESKIYDI - depodaki e-posta
   destekli kod hic deploy edilmemisti, yani e-posta ile acilmis HER
   hesap icin silme imkansizdi. Guncel kod deploy edilerek duzeltildi.
2. `auth.admin.deleteUser` her cagrildiginda `mekanlar.ekleyen_kullanici`
   yabanci anahtari uzerinden 5,98 milyon satirlik `mekanlar` tablosunun
   TAMAMINI tariyordu (sutun indekssizdi) ve bu ~10 saniyede zaman
   asimina duesuyordu. Kismi bir indeks
   (`where ekleyen_kullanici is not null`, `CONCURRENTLY`) eklenerek
   duzeltildi; sonrasinda silme tek denemede ~59 ms'de tamamlandi.

Yani bu test "zaten calisiyor" varsayimini iki kez yanlislamis oldu -
ileride hesap silme akisina dokunan her degisiklikten sonra tekrar
kosulmali.

## Cok dilli yapi

`site/src/i18n/diller.ts` icindeki `DILLER` dizisi hangi dillerin
YAYINDA oldugunu belirliyor. Su an yalnizca `['tr']`.

**Kural: bir dil ancak DORT hukuki metin (gizlilik, kosullar, destek,
hesap-sil) o dilde TAM yazildiginda listeye girer.** Yarim cevrilmis
bir hukuki metin cevrilmemisten kotudur - eksik kalan cumle, kullaniciyi
baglayan cumle olabilir.

Yeni bir dil eklemek icin:

1. `DILLER` dizisine dil kodunu ekle (ornek: `['tr', 'en']`).
2. `site/src/i18n/<dil>.ts` dosyasini olustur (kabuk metinleri: giris
   dugmesi, alt serit baglanti adlari, kunye, dil secici etiketi).
3. Bes sayfanin govde metnini o dilde YAZ - `Metin.astro` gibi ortak
   bilesenler `dil` prop'unu zaten tasiyor, eksik olan sayfa
   icerikleridir.
4. `npm run build && npm run dogrula` calistir - "Cok dilli yapi"
   bolumu yeni dilin uretilip uretilmedigini ve `hreflang`
   etiketlerinin karsilikli oldugunu kontrol ediyor.

Kok dil (Turkce) **hicbir onek almaz** (`/gizlilik`, `/tr/gizlilik`
degil) - magaza basvurusuna ve gizlilik metnine yazilan adresler bu
oneksiz halleridir, sonradan degismemesi gerekiyor. Digerleri
`/en/gizlilik` gibi onek alir.

## Dagitim

Cloudflare Pages, `main` dalina push ile otomatik. Proje ayarlari:

```
Kok dizin      : site
Derleme komutu : npm run build
Cikti klasoru  : dist
```

**Alan adi henuz alinmadi ve Cloudflare Pages projesi henuz
kurulmadi** - bu README yazildigi anda site hicbir yerde yayinda
degil. Kalan adimlar (kullaniciya ait, ajan yapamaz):

1. `slooin.com` satin alinir.
2. Cloudflare Pages projesi olusturulur, GitHub deposu baglanir,
   yukaridaki ayarlar ve ortam degiskenleri (`PUBLIC_SUPABASE_URL`,
   `PUBLIC_SUPABASE_ANON_KEY`) panelde girilir, ozel alan adi baglanir.
3. `destek@slooin.com` posta yonlendirmesi kurulur.
4. Yayin sonrasi `npm run dogrula`'nin kontrol ettigi seyler
   `https://slooin.com` uzerinde de dogrulanir, ve canli silme testi
   bir kez `https://slooin.com`'a karsi kosulur.

**KARISTIRILMAMASI GEREKEN UC AYRI YAYIN YOLU** (bu proje uc ayri sey
yayinliyor, farkli komutlarla):

| Hedef | Nasil |
|---|---|
| Bu site (`slooin.com`) | Cloudflare Pages, `main` dalina push ile otomatik |
| Uygulamanin web surumu (`slooin.expo.app`) | `cd mobil && npm run yayinla` |
| Telefon / TestFlight | `eas update --channel production` |

Bu siteye push atmak digerlerini GUNCELLEMEZ, ve digerlerini
yayinlamak bu siteyi GUNCELLEMEZ - ucu de birbirinden tamamen bagimsiz.

## Ekran goruntuleri - GECICI, yeniden cekilecek

`site/public/ekran-kesfet.png` ve `site/public/ekran-mekan.png`
gercek test hesabindan alinmis gercek ekran goruntuleri (uydurma veri
degil), ama iki sebepten **provizyonel** kabul edilmeli:

1. Kullanicinin uzerinde calistigi ekran degisiklikleri bitince
   yeniden cekilmeleri gerekiyor.
2. **`mobil/`in WEB surumunden** cekildiler; web surumu gercek harita
   yerine bir RADAR cizimi gosteriyor (bkz. `CLAUDE.md`daki "gercek
   harita" karari). Ideal olan bir TELEFON derlemesinden (gercek
   haritayla) yeniden cekmek.

Yenilemek icin, `mobil/` dizininden (bkz. `mobil/araclar/ekran-goruntusu.mjs`):

```bash
cd ../mobil
node araclar/ekran-goruntusu.mjs mekanlar ../site/public/ekran-kesfet.png
node araclar/ekran-goruntusu.mjs "harita/<gercek-bir-mekan-id>" ../site/public/ekran-mekan.png
```

Sonra `npm run dogrula` calistirilarak yatay tasma ve 200 kontrolleri
tekrar dogrulanmali - gorseller degisince sayfa yuksekligi de
degisebilir.
