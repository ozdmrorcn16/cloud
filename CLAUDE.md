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

### Yerelden devam (2026-08-19'dan sonra tek yol bu)

Butun bulut oturumlari kapatildi. Calisma yalnizca kullanicinin kendi
terminalinde surer. Yeni oturumda:

```bash
cd ~/projects/cloud            # Windows'ta: cd C:\Users\orcns\projects\cloud
git fetch origin
git checkout claude/faz2b-guvenlik
git pull origin claude/faz2b-guvenlik
cd mobil && npm install        # node_modules repoda degil
npm test                       # mock tabanli suite
npm run test:gorunurluk        # gercek veritabani, 10 senaryo
```

Bulutta oturum acma — sebebi asagidaki 2026-08-19 tarihli karar.

### Devam eden is: Faz 3a — bag ve gorunurluk kademeleri

Oturum token siniri yuzunden kesildi. **Yeni oturumda once
`docs/faz3a-devam-notu.md` dosyasini oku** — nerede kalindigi, testlerin
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
- `claude-mem@thedotmack` — oturumlar arasi kalici hafiza. `~/.claude-mem`
  altinda SQLite + chroma; 37700 portunda bir worker calisir.
  `/claude-mem:mem-search`, `/claude-mem:learn-codebase` gibi ~20 beceri.
- `no-ai-slop` (petergyang/no-ai-slop) — market eklentisi **degil**, tek dosyalik
  beceri. Repoya dogrudan kopyalandi: `.claude/skills/no-ai-slop/`. Yaziyi 20+
  "AI slop" kalibindan temizler, sesini korur. `/no-ai-slop <metin>` duzeltir,
  `/no-ai-slop is this slop? <metin>` sadece tespit eder.
- `gstack` (garrytan/gstack) — market eklentisi **degil**;
  `~/.claude/skills/gstack` altina klonlanip `./setup` ile kurulur. 54 beceri,
  hepsi `gstack-` onekli (`/gstack-qa`, `/gstack-ship`, `/gstack-review`...).
  Onek, diger eklentilerle cakismasin diye `--prefix` ile secildi.

## Kararlar

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
