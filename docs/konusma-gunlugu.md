# Konusma Gunlugu

Butun oturumlarin kalici kaydi. Bu dosyanin indeks blogu hook tarafindan
otomatik guncellenir; "Kararlar" bolumu elle (Claude veya sen tarafindan)
yazilir.

## Otomatik kayit nasil calisiyor

`.claude/settings.json` icinde iki hook tanimli:

| Olay | Ne yapar |
|---|---|
| `Stop` (her yanit sonunda) | Oturum dokumunu `docs/oturumlar/` altina yazar. Arka planda calisir, yaniti bekletmez. |
| `SessionEnd` (oturum kapanirken) | Ayni dokumu yazar, sonra `docs/oturumlar` ve bu dosyayi commit'leyip dala push eder. |

Her ikisi de `.claude/hooks/oturum-kaydet.py` betigini calistirir. Betik
yalnizca kayit yollarini stage'ler, devam eden calismadaki dosyalara dokunmaz.

Uretilen dosyalar:

- `docs/oturumlar/<tarih>-<oturum>.md` — okunabilir konusma dokumu
- `docs/oturumlar/ham/<tarih>-<oturum>.jsonl` — ham transcript yedegi

### Redaksiyon

Uc cikti da (dokum, ham jsonl, yukaridaki oturum indeksi) diske yazilmadan
once `gizlileri_maskele()` fonksiyonundan gecer. Anahtar gorunumlu diziler
(`sk-ant-…`, `AKIA…`, `ghp_…`, `xoxb-…`, ozel anahtar bloklari ve digerleri;
tam liste betikteki `GIZLI_DESENLER`) `<REDACTED>` ile degistirilir.

Bu susleme degil: kayitlar repoya push edildigi icin maskeleme olmadan
GitHub'in push korumasi butun push'u reddediyor. Indeks ozeti de maskelendikten
**sonra** 80 karaktere kirpilir — tersi olsaydi ortadan kesilen bir anahtar
desene uymaz ve yarisi indekste kalirdi.

### Kapatmak istersen

`.claude/settings.json` dosyasindaki `hooks` blogunu sil, ya da Claude Code
icinde `/hooks` menusunden devre disi birak.

## Oturumlar

<!-- oturumlar:baslangic -->

- 2026-09-03 — [2026-09-03-7087efe7.md](oturumlar/2026-09-03-7087efe7.md) — kaldığımız yerden devam edelim
- 2026-09-02 — [2026-09-02-82180322.md](oturumlar/2026-09-02-82180322.md) — update installed
- 2026-09-02 — [2026-09-02-7087efe7.md](oturumlar/2026-09-02-7087efe7.md) — kaldığımız yerden devam edelim
- 2026-09-02 — [2026-09-02-62e92057.md](oturumlar/2026-09-02-62e92057.md) — kaldığımız yerden devam edelim
- 2026-09-02 — [2026-09-02-11f3a4eb.md](oturumlar/2026-09-02-11f3a4eb.md) — <local-command-stdout>Set model to `Opus 5 (1M context) (default)` and saved as …
- 2026-09-01 — [2026-09-01-62e92057.md](oturumlar/2026-09-01-62e92057.md) — kaldığımız yerden devam edelim
- 2026-09-01 — [2026-09-01-11f3a4eb.md](oturumlar/2026-09-01-11f3a4eb.md) — <local-command-stdout>Set model to `Opus 5 (1M context) (default)` and saved as …
- 2026-08-31 — [2026-08-31-62e92057.md](oturumlar/2026-08-31-62e92057.md) — kaldığımız yerden devam edelim
- 2026-08-31 — [2026-08-31-5128d252.md](oturumlar/2026-08-31-5128d252.md) — claude --model fable
- 2026-08-31 — [2026-08-31-11f3a4eb.md](oturumlar/2026-08-31-11f3a4eb.md) — <local-command-stdout>Set model to `Opus 5 (1M context) (default)` and saved as …
- 2026-08-30 — [2026-08-30-62e92057.md](oturumlar/2026-08-30-62e92057.md) — kaldığımız yerden devam edelim
- 2026-08-30 — [2026-08-30-5de6e87c.md](oturumlar/2026-08-30-5de6e87c.md) — eklentiler aktif mi
- 2026-08-30 — [2026-08-30-5128d252.md](oturumlar/2026-08-30-5128d252.md) — claude --model fable
- 2026-08-30 — [2026-08-30-11f3a4eb.md](oturumlar/2026-08-30-11f3a4eb.md) — <local-command-stdout>Set model to `Opus 5 (1M context) (default)` and saved as …
- 2026-08-29 — [2026-08-29-f5f68d83.md](oturumlar/2026-08-29-f5f68d83.md) — profil oluşturma ekranından devam
- 2026-08-29 — [2026-08-29-5de6e87c.md](oturumlar/2026-08-29-5de6e87c.md) — eklentiler aktif mi
- 2026-08-29 — [2026-08-29-5128d252.md](oturumlar/2026-08-29-5128d252.md) — claude --model fable
- 2026-08-29 — [2026-08-29-11f3a4eb.md](oturumlar/2026-08-29-11f3a4eb.md) — <local-command-stdout>Set model to `Opus 5 (1M context) (default)` and saved as …
- 2026-08-28 — [2026-08-28-5de6e87c.md](oturumlar/2026-08-28-5de6e87c.md) — eklentiler aktif mi
- 2026-08-27 — [2026-08-27-f5f68d83.md](oturumlar/2026-08-27-f5f68d83.md) — profil oluşturma ekranından devam
- 2026-08-27 — [2026-08-27-5de6e87c.md](oturumlar/2026-08-27-5de6e87c.md) — eklentiler aktif mi
- 2026-08-26 — [2026-08-26-f5f68d83.md](oturumlar/2026-08-26-f5f68d83.md) — profil oluşturma ekranından devam
- 2026-08-26 — [2026-08-26-6938e64a.md](oturumlar/2026-08-26-6938e64a.md) — profilden devam
- 2026-08-25 — [2026-08-25-f5f68d83.md](oturumlar/2026-08-25-f5f68d83.md) — profil oluşturma ekranından devam
- 2026-08-25 — [2026-08-25-906da1b5.md](oturumlar/2026-08-25-906da1b5.md) — Telefonda denemeye devam: Expo Go olmadı, APK (EAS build) yoluna geçiyoruz. CLAU…
- 2026-08-25 — [2026-08-25-6938e64a.md](oturumlar/2026-08-25-6938e64a.md) — profilden devam
- 2026-08-24 — [2026-08-24-906da1b5.md](oturumlar/2026-08-24-906da1b5.md) — Telefonda denemeye devam: Expo Go olmadı, APK (EAS build) yoluna geçiyoruz. CLAU…
- 2026-08-23 — [2026-08-23-906da1b5.md](oturumlar/2026-08-23-906da1b5.md) — Telefonda denemeye devam: Expo Go olmadı, APK (EAS build) yoluna geçiyoruz. CLAU…
- 2026-08-22 — [2026-08-22-906da1b5.md](oturumlar/2026-08-22-906da1b5.md) — Telefonda denemeye devam: Expo Go olmadı, APK (EAS build) yoluna geçiyoruz. CLAU…
- 2026-08-22 — [2026-08-22-0f20b7f0.md](oturumlar/2026-08-22-0f20b7f0.md) — docs/moderasyon-paneli-devam-notu.md oku, moderasyon paneli spec'ini yaz
- 2026-08-21 — [2026-08-21-74f56f7b.md](oturumlar/2026-08-21-74f56f7b.md) — Faz 3b'ye kaldığımız yerden devam et
- 2026-08-21 — [2026-08-21-0f20b7f0.md](oturumlar/2026-08-21-0f20b7f0.md) — docs/moderasyon-paneli-devam-notu.md oku, moderasyon paneli spec'ini yaz
- 2026-08-20 — [2026-08-20-869a9560.md](oturumlar/2026-08-20-869a9560.md) — docs/faz3a-devam-notu.md dosyasini oku ve Faz 3a'ya kaldigimiz yerden devam et. …
- 2026-08-20 — [2026-08-20-74f56f7b.md](oturumlar/2026-08-20-74f56f7b.md) — Faz 3b'ye kaldığımız yerden devam et
- 2026-08-19 — [2026-08-19-cc4a8373.md](oturumlar/2026-08-19-cc4a8373.md) — uygulamamıza kaldıgımız yerden burdan devam edebilirmiyiz
- 2026-08-19 — [2026-08-19-ab99deca.md](oturumlar/2026-08-19-ab99deca.md) — bu
- 2026-08-19 — [2026-08-19-aafc33c7.md](oturumlar/2026-08-19-aafc33c7.md) — youtube otomasyon fikrine burdan devam edebilirmiyiz
- 2026-08-19 — [2026-08-19-9b6cdd9b.md](oturumlar/2026-08-19-9b6cdd9b.md) — <local-command-stdout>Login successful</local-command-stdout>
- 2026-08-19 — [2026-08-19-869a9560.md](oturumlar/2026-08-19-869a9560.md) — docs/faz3a-devam-notu.md dosyasini oku ve Faz 3a'ya kaldigimiz yerden devam et. …
- 2026-08-19 — [2026-08-19-64e6494e.md](oturumlar/2026-08-19-64e6494e.md) — bu oturumdan kaldıgımız yerden devam edelim uygulamamıza
- 2026-08-19 — [2026-08-19-639e055b.md](oturumlar/2026-08-19-639e055b.md) — bu oturumdan devam edebilirmiyiz
- 2026-08-19 — [2026-08-19-604558c5.md](oturumlar/2026-08-19-604558c5.md) — oldumu
- 2026-08-19 — [2026-08-19-5fa52514.md](oturumlar/2026-08-19-5fa52514.md) — git fetch origin yap, sonra claude/faz2b-guvenlik dalına geç ve git push -u orig…
- 2026-08-19 — [2026-08-19-45beda08.md](oturumlar/2026-08-19-45beda08.md) — UserPromptSubmit operation blocked by hook: [export PATH="$($SHELL -lc 'echo $PA…
- 2026-08-17 — [2026-08-17-639e055b.md](oturumlar/2026-08-17-639e055b.md) — bu oturumdan devam edebilirmiyiz
- 2026-08-16 — [2026-08-16-639e055b.md](oturumlar/2026-08-16-639e055b.md) — bu oturumdan devam edebilirmiyiz
- 2026-08-15 — [2026-08-15-639e055b.md](oturumlar/2026-08-15-639e055b.md) — bu oturumdan devam edebilirmiyiz
- 2026-08-14 — [2026-08-14-9ff6ffed.md](oturumlar/2026-08-14-9ff6ffed.md) — kaldığımız yere geri aç
- 2026-08-14 — [2026-08-14-639e055b.md](oturumlar/2026-08-14-639e055b.md) — bu oturumdan devam edebilirmiyiz
- 2026-08-14 — [2026-08-14-0193031c.md](oturumlar/2026-08-14-0193031c.md) — https://github.com/ozdmrorcn16/cloud deposunu klonla, claude/code-review-plugin-…
- 2026-08-12 — [2026-08-12-bb3bdf55.md](oturumlar/2026-08-12-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-11 — [2026-08-11-bb3bdf55.md](oturumlar/2026-08-11-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-10 — [2026-08-10-bb3bdf55.md](oturumlar/2026-08-10-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-09 — [2026-08-09-bb3bdf55.md](oturumlar/2026-08-09-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-09 — [2026-08-09-9b839baa.md](oturumlar/2026-08-09-9b839baa.md) — daha önce bir uygulama fikrinden bahsettim hatırlıyormusun

<!-- oturumlar:bitis -->


### 2026-08-25 - Arayuz tasarimi, ikinci oturum

Bu oturumda ekranlarin buyuk kismi gorsel kimlige tasindi ve marka
varliklari yenilendi. Ayrintili durum `CLAUDE.md` icindeki "ARAYUZ
TASARIMI - DEVAM EDEN IS" bolumunde; burada yalnizca alinan KARARLAR:

- **Ana sayfa akisi.** Girisden sonra Instagram'daki gibi bir akis
  gelir; alt cubugun en solunda ev ikonu durur. Akista kullanicinin
  kendi check-in'leri ve karsilikli bag kurdugu kisilerin
  check-in'leri birlikte akar.
- **Alt gezinme HER ekranda sabit.** Cubuk kok yerlesime tasindi;
  ekranlara tek tek eklenmiyor.
- **Uygulama icinde TEK yazi ailesi.** Marka fontu Bricolage arayuzden
  tamamen cikti; hiyerarsi agirlik ve puntoyla kuruluyor. Karakterli
  baslik fontu kararı GECERSIZ.
- **Yeni logo takimi** (S isareti + kelime markasi). Logonun parcasi
  silinmez, isaret yeniden cizilmez; renk cozumlemesiyle ayiklanir.
- **Karsilama ekrani her acilista gorunur** (hesap olusturana kadar);
  "yalnizca ilk indirene goster" kurali ve cihaz isareti kaldirildi.
  Sozlesme onayi ve slogan bu ekrandan cikarildi.
- **Kayit akisi uce bolundu:** yalnizca telefon -> SMS kodu -> profil
  olusturma. Sifre ve KVKK onayi su an akista YOK; kullanici o
  ekranlarin sirasi gelince ele almak istiyor.
- **Istenen kadarini yap.** Kullanicinin uyarisi: istenen ekran
  disinda, akisi tamamlamak icin bile olsa, yeni ekran eklenmez.

Yol ustunde bulunan ve duzeltilen gercek kusurlar: takiplestigin
kisinin canli check-in fotografi hic acilmiyordu (storage politikasi
satirin gorunurluk kuralina baglandi; ayni degisiklik ani
fotograflarindaki fazla genisligi de kapatti), moderatorun fotograf
politikasi var olmayan bir bucket adini suzuyordu, mekan detay
ekraninda mekanin ADI hic gorunmuyordu, detay ekranlarinda geri
dugmesi yoktu, gorunurluk test paketindeki yedi dogrulama 2026-08-23'ten
beri sessizce bos olculuyordu.

## Kararlar

- **2026-08-09** — Depo bos halde bulundu; onceki oturumdan kalan hicbir kayit
  yoktu (commit, dal, issue, PR yok). Bu yuzden kalici hafiza katmani kuruldu.
- **2026-08-09** — Uygulama fikri henuz yazili degil. Anlatildiginda
  `CLAUDE.md` icindeki "Uygulama fikri" bolumu doldurulacak.
- **2026-08-13** — Yas politikasi degisti: alt sinir 16'dan 18'e cikti, 16-17
  yas bandi ve veli onayi akisi tamamen kaldirildi. Gerekce: veli onayi
  mekanizmasinin (SMS/e-posta ile onay linki, ayri bir Edge Function)
  getirdigi karmasikliktan Faz 1'de kacinmak. Spec ve `CLAUDE.md` guncellendi.
- **2026-08-13** — SMS dogrulama icin Faz 1 boyunca ucretli bir saglayici
  kurulmuyor: Supabase'in hosted projede sundugu ucretsiz "test telefon
  numaralari" ozelligi kullanilacak (gercek SMS gonderilmez, ucret cikmaz).
  Gercek saglayici (Twilio) entegrasyonu izole bir goreve (Faz 1 planinin
  Task 14'u) konuldu; yalnizca magazaya cikmadan hemen once calistirilacak.
- **2026-08-13** — Faz 1 ("Hesap": kayit, telefon dogrulama, profil olusturma,
  oturum) uygulama plani yazildi:
  `docs/superpowers/plans/2026-08-13-faz1-hesap.md`. Tech stack: Expo (React
  Native + TypeScript, Expo Router) + Supabase (Auth, Postgres, Storage),
  proje `mobil/` altina kuruluyor. 14 gorev, TDD sirali.
- **2026-08-13** — Faz 1 plani subagent-driven-development ile izole bir
  worktree'de (`faz1-hesap` dali, `.worktrees/faz1-hesap`) uygulandi. 11
  gorev (1, 3-12) tek tek subagent'lara yazdirildi, ayri bir subagent'a
  incelettirildi; her gorevde bulunan gercek plan hatalari (yanlis router
  kok varsayimi — `mobil/app/` degil `mobil/src/app/`; RNTL 14'un
  `render()`/`fireEvent.*`'inin async oldugu; iki ekranda ayni metnin hem
  baslikta hem butonda kullanilmasi; test mock'larinin temizlenmemesi)
  yerinde duzeltildi. Sonunda tum dalin kapsamli incelemesi (en guclu
  modelle) iki kritik capraz-gorev hatasi buldu: profil olusturma
  tamamlandiginda kullanici sonsuz donguyle profil ekranina geri
  atiliyordu (oturum context'i profil olusturuldugunu bilmiyordu), ve
  kayit ekranina arayuzden hic ulasilamiyordu (giris ekraninda link
  yoktu — gercek cihazda kayit imkansizdi). Bu ikisi + 6 onemli bulgu
  (hata capraz-gorev testleri, `_layout.tsx`'in hic test edilmemis olmasi,
  yas kisitinin yalnizca istemci tarafinda olmasi, fotograf yukleme
  hatasinda butonun sonsuza kadar kilitli kalmasi vb.) tek bir duzeltme
  turunda cozuldu, ayri bir dogrulama incelemesiyle hepsi kapatildi
  onaylandi. Sonuc: 12 test suite, 30 test, hepsi yesil.
- **2026-08-13** — Faz 1'in kod tarafi tamamlandi (Task 2, 13, 14 haric —
  bunlar kullanicinin gercek bir Supabase hesabi/projesi acmasini
  bekliyor, tarayici tabanli hesap olusturma/OAuth otomatiklestirilemez).
  Yapilmasi gerekenler: (1) supabase.com'da ucretsiz proje ac, (2)
  `supabase login` ile CLI'yi baglat, (3) `.env`'e gercek URL/anon key'i
  yaz, (4) `supabase db push` ile iki migrasyonu (`profiller` tablosu,
  `profil-fotograflari` bucket'i) uygula, (5) dashboard'da test telefon
  numarasi tanimlayip Task 13'un uctan uca akisini elle dogrula. Ertelenen
  kucuk maddeler (demo bagimlilik temizligi, lint yapilandirmasi, storage
  silme politikasi vb.) `docs/superpowers/plans/2026-08-13-faz1-hesap.md`
  ile ayni dizindeki `.superpowers/sdd/2026-08-13-faz1-hesap/progress.md`
  defterinde kayitli (bu dosya worktree birlestirilmeden once silinecek,
  onemli kararlar buraya ve CLAUDE.md'ye tasindi).
- **2026-08-14** — **Faz 1 tamamlandi.** Supabase projesi (`konum-sosyal`,
  ref `swpiibyuoffykbmirvgq`, eu-central-1) acildi, CLI baglandi, iki
  migrasyon canliya uygulandi, uctan uca akis hem API hem arayuz
  uzerinden dogrulandi (kayit → SMS dogrulama → profil olusturma →
  ana ekran → cikis → tekrar giris).
- **2026-08-14** — Panelden telefon saglayicisini acmak Twilio kimlik
  bilgisi zorunlu kiliyordu; bunun yerine yapilandirma CLI ile gonderildi
  (`supabase config push`), boylece **ucretli bir SMS saglayicisi hesabina
  hic gerek kalmadi**. Dort test numarasi (`+90555000000{0,1,2,3}`,
  hepsi sabit `123456` kodu) tanimli; bu numaralara gercek SMS gitmiyor,
  ucret cikmiyor. Magazaya cikmadan once (Task 14) `auth.sms.test_otp`
  blogu silinip gercek saglayici devreye alinacak.
- **2026-08-14** — Iki gercek hata yalnizca uygulama ilk kez gercekten
  calistirildiginda ortaya cikti, testler bunlari yakalayamazdi:
  - `auth.sms.enable_confirmations` hosted projede `phone_autoconfirm`e
    **birebir** esleniyor (isim yaniltici): `true` yapmak SMS dogrulama
    adimini tamamen atlatiyordu. `false` olmali — akisimiz `verifyOtp`
    bekliyor.
  - `app.json`'daki `web.output: "static"` sayfalari Node'da onceden
    render etmeye calisiyor; Node'da `window` olmadigi icin Supabase'in
    AsyncStorage tabanli oturum deposu uygulama acilmadan cokuyordu ve
    web dev sunucusu hic ayaga kalkmiyordu. `"single"` (SPA) yapildi.

### Faz 2 beyin firtinasi — yarim kaldi, buradan devam edilecek

2026-08-14'te baslandi, bir soru cevaplanmadan birakildi. Alinan kararlar
(hepsi kullanici onayli):

1. **Mekan verisi: OpenStreetMap, Turkiye geneli onden yukleme.** Geofabrik
   Turkiye dosyasindan kafe/bar/restoran/park gibi mekanlar cikarilip kendi
   `mekanlar` tablomuza yazilir (~200-400 bin kayit, ~100 MB). Sorgular
   tamamen kendi PostGIS'imizde calisir. Google Places elendi (kullanim
   basina ucretli + lisansi veriyi kalici saklamayi yasakliyor); canli
   Overpass sorgusu elendi (yavas, hiz sinirli, kullanim politikasina
   aykiri).
2. **Check-in iki katmanli.** Canli check-in kesif icindir ve **4 saat**
   sonra duser; ustune kullanicinin istedigi an basabilecegi bir
   **"ayrildim" butonu** var. Kullanici isterse o check-in'i profiline
   kalici **"ani"** olarak kaydeder: kendisi silebilir, sadece mekan adi
   gorunur, koordinat gorunmez, "su an orada" anlamina gelmez.
   Spec'teki orijinal "check-in birkac saat sonra tamamen silinir" karari
   bu sekilde guncellendi.
3. **Sure dolunca ne olur:** `profilde_kalsin = false` ise satir tamamen
   silinir; `true` ise yalnizca `konum` alani null'lanir. Boylece sistemde
   hicbir zaman koordinat gecmisi birikmiyor — "konum verisi tutmuyoruz"
   duruşu korunuyor.
4. **Medya: once sadece fotograf.** Video (depolama + moderasyon yuku)
   sonraki bir faza birakildi; altyapi hazir olacagi icin eklemesi kolay.
5. **Mekan odasi ozelligi tamamen kaldirildi.** Cekirdek dongu artik:
   check-in → yakindakileri gor → sohbet/takip istegi → birebir sohbet.
   Yan etkisi: spec'in soguk baslangic cevaplarindan biri ("mekan odalari
   kalici, oda hic bos gorunmez") gecersiz kaldi; yerini mekan ekranindaki
   gecmis anilar aliyor.
6. **Mekan ekrani:** ustte su an orada check-in yapmis kisiler, altta o
   mekanda paylasilmis herkese acik anilar. Kimse yokken bile mekan yasiyor
   gorunur.
7. **Kullanici yeni mekan ekleyebilir** (spec'teki "ilk surumde
   eklenemez" karari degisti — aradigi yer OSM'de yoksa kullanici cikmaza
   giriyordu). Korumalar: cihaz konumunun mekana yakin olmasi sarti
   (~200 m), kaydetmeden once benzer isimli yakin mekanlarin gosterilmesi
   (mukerrer kayit onlemi), gunluk limit, ve sikayet edilebilirlik.
   Not: yakinlik sarti bir duvar degil hiz kesici; kararli biri cihaz
   konumunu taklit edebilir.
8. **Faz 2 ikiye bolundu.** Bolme cizgisi guvenlikle ilgili:
   - **Faz 2a — Mekanlar ve check-in:** OSM yukleme, mekan arama/listeleme,
     mekan ekleme, check-in olusturma (not + fotograf), 4 saat + ayrilma,
     profilde ani saklama, kendi anilarini gorme/silme. Sonunda kullanici
     check-in yapabiliyor ama **henuz kimse kimseyi gormuyor.**
   - **Faz 2b — Kesif ve guvenlik:** yakindakiler sorgusu + yaricap ayari,
     mekan detay ekrani, baskasinin profili, gizli check-in, gorunurluk
     tercihi, **engelleme ve sikayet**. Gorunurluk ve koruma ayni anda
     geliyor.
   Yalnizca Faz 2a'nin spec'i yazilacak; 2b kendi spec'ini alacak.
9. **2a'ya bilerek alinmayanlar:** `gizli_mi` ve anilarin gorunurluk
   tercihi. 2a'da kimse kimseyi gormedigi icin bu ayarlarin etkisi olmaz.

10. **Check-in icin yakinlik sarti: evet, ~500 m.** (2026-08-14'te cevaplandi.)
    Cihaz konumu mekana ~500 m'den uzaksa check-in yapilamaz. Yaricap bu kadar
    genis secildi cunku bina icinde, AVM'de ve kalabalik alanda GPS sapmasi
    yuzlerce metreyi bulabiliyor; daha dar bir sinir durust kullaniciyi da
    bloke ederdi. Gerekce: aksi halde biri sehrin obur ucundaki bir mekana
    check-in yapip "su an burada" listesinde gorunebilir — hem listenin
    anlamini bosaltir hem birini bir yere cekmek icin kullanilabilir. Mekan
    *eklemedeki* ~200 m sartindan ayri ve ondan daha genistir. Bu da bir duvar
    degil hiz kesici; kararli biri cihaz konumunu taklit edebilir.

11. **Check-in kalicilik modeli degisti — `profilde_kalsin` bayragi
    kaldirildi.** (2026-08-14, tasarimin ikinci turunda.) Onceki tasarimda
    kullanici suresi dolan check-in'i "aniya kaydet" diyerek kurtariyordu,
    aksi halde satir silinirdi. Yeni model: sure dolunca (ya da "ayrildim"
    ile) check-in **otomatik olarak** aniya donusur — `konum` alani
    null'lanir, satir silinmez. Silme tamamen kullaniciya ait, istedigi
    zaman istedigi anisini silebilir ya da hic silmeyebilir.
    `check_inler` tablosuna bunun yerine `gorunurluk` alani eklendi
    (varsayilan deger, 2a'da islevsiz — gercek mantigi Faz 2b'de yazilacak).
12. **Iki ayri gorunurluk katmani var; canli check-in gorunurlugu
    karsilikli (mutual).** (2026-08-14.)
    - **Ani/profil gorunurlugu:** kullanici gecmis check-in'lerini/anilarini
      profilinde kime gosterecegini kendi secer (karar #11'deki
      `gorunurluk` alani, Faz 2b'de islevsel hale gelecek).
    - **Canli check-in gorunurlugu:** bir mekanda check-in yapan kisi,
      **o an ayni mekanda check-in yapmis olan diger kisiler** tarafindan
      gorulur — bu, profil gorunurluk ayarindan bagimsiz ve otomatik.
      Check-in yapmamis biri bunu goremez.
    - **Yakindakiler sorgusu ucretli olacak.** Check-in yapmamis/o mekanda
      olmayan kullanicilar, birini ancak Faz 2b'nin "yakindakiler sorgusu"
      ozelligiyle bulabilecek ve bu ozellik **premium/ucretli** bir katman
      olarak konumlanacak. Boylece Faz 2a'nin "kimse kimseyi gormuyor"
      ilkesi bozulmuyor (karsilikli check-in gorunurlugu haric) ve Faz 2b
      hem guvenlik hem monetizasyon ekseninde tasarlanacak.

13. **Tek aktif (canli) check-in kurali.** (2026-08-14.) Kullanici ayni anda
    yalnizca bir mekanda "canli" check-in'e sahip olabilir. Yeni bir
    check-in yapmak, varsa oncekini otomatik olarak "ayrildim" gibi
    kapatir (karar #11'e gore aniya donusur). Iki farkli mekanda ayni anda
    "su an buradayim" durumu mantiksal olarak tutarsiz sayildigi icin
    izin verilmiyor.
14. **Gecmis anilar mekan ekraninda 2a'da da gorunur — sadece canli
    check-in karsilikliliga tabi.** (2026-08-14.) Karar #6'daki "mekanda
    paylasilan herkese acik anilar" bolumu Faz 2a'da aktif: bir mekanin
    gecmiste orada check-in yapmis kisilerin anilari (not+fotograf,
    konumsuz) herkese acik sayilir, cunku mekan zaten kamuya acik bir yer
    ve "kimin ne zaman gittigi" hassas degil — hassas olan yalnizca *canli*
    konum. Karar #8'deki "kimse kimseyi gormuyor" ilkesi bu yuzden yalnizca
    canli check-in'e uygulanir, gecmis anilara degil. Kisiye ozel
    gorunurluk tercihi (karar #9'daki `gizli_mi`) hala Faz 2b'de.

15. **Profildeki ani listesinin gorunurlugu kullanicinin kendi secimi
    olacak — "herkese acik" varsayimi reddedildi.** (2026-08-14.)
    `gorunurluk` alani (karar #11) Faz 2b'de islevsel oldugunda uc secenek
    sunacak: **herkese acik**, **takiplesilen (karsilikli takip)
    kisiler**, veya **belirli kisiler** (kullanicinin sectigi ozel liste).
    Bu, bir "takip/arkadaslik" iliski modeline ihtiyac duyuyor — henuz
    tasarlanmadi, sosyal/kesif fazinin kapsaminda. 2a'da alan hala
    islevsiz kaydediliyor (varsayilan deger `herkese_acik`), kullanici
    bunu degistiremiyor cunku ayar arayuzu 2b'de gelecek.
16. **Anida mekanin harita konumu gosterilecek, kullanicinin kisisel
    konumu degil.** (2026-08-14, netlestirme.) Profildeki/mekan
    ekranindaki bir aniyi acinca mekanin kendi sabit haritadaki yeri (pin)
    goruntuye eklenecek. Bu, karar #3/#11'i degistirmiyor — kullanicinin
    check-in anindaki kisisel GPS koordinati hala hic saklanmiyor/
    gosterilmiyor. Gosterilen sey `mekanlar.konum`, kullanicinin
    `check_inler.konum`'u degil; ikisi zaten farkli alanlar.
    Etkilesim: profildeki ani listesinde sadece mekan adi duz metin
    olarak durmaz — kullanici karta tiklayinca mekanin harita konumu
    acilir (harita gorunumu, pin).

**Devam ederken:** beyin firtinasinin butun sorulari cevaplandi. Sirada
tasarimin kalan bolumlerini (guvenlik/mahremiyet mekanikleri, mekan verisi
yukleme yontemi, test yaklasimi) sunmak, onay alinca spec'i
`docs/superpowers/specs/YYYY-MM-DD-faz2a-mekanlar-checkin-design.md`
dosyasina yazmak, kullaniciya incelettirip onayini almak, sonra
`writing-plans` becerisine gecmek var.

### Faz 2a uygulamasi sirasinda alinan kararlar

Spec ve plan yazildiktan sonra, 15 gorevlik uygulama sirasinda ortaya
cikan ve kayda gecmesi gereken sapmalar:

17. **Cevrimdisi kuyruk ozelligi Faz 2a'ya alinmadi.** (2026-08-15.)
    Spec'in hata durumlari tablosu "Ag yok → check-in kuyrukta bekler,
    baglanti gelince gonderilir" diyordu. Uygulanan davranis bunun yerine
    tek seferlik deneme + acik bir hata mesaji ("Internet baglantisi yok,
    tekrar dene") ve kullanicinin elle tekrar denemesi. Gerekce: gercek
    arka-plan kuyruklama kalici yerel depo, baglanti durumu dinleyicisi ve
    otomatik yeniden gonderme gerektiriyor — bu, tek basina kucuk bir
    faz buyuklugunde is. Bilerek ertelendi; Faz 2b oncesinde ya da onunla
    birlikte ayri bir gorev olarak ele alinacak.
18. **Check-in yapanin gorunen adi `check_inler` tablosunda kopyalaniyor
    (denormalizasyon).** (2026-08-15, son incelemede bulunan kritik
    hatanin duzeltmesi.) Mekan detay ekrani baskalarinin adini
    `profiller(ad)` join'iyle okumaya calisiyordu; bu iki sebeple
    calismiyordu: (a) `check_inler` ile `profiller` arasinda FK yok
    (ikisi de bagimsiz olarak `auth.users`'a bagli), PostgREST join'i
    cozemiyor; (b) `profiller`'in Faz 1'den kalan RLS politikasi
    "sadece kendi profilini oku" idi. Cozum olarak `profiller`'in
    politikasini gevsetmek **reddedildi**: Postgres RLS satir
    duzeyindedir, sutun duzeyinde degil — `ad`'i baskalarina acan her
    politika `dogum_tarihi`, `biyografi` ve `fotograflar` alanlarini da
    acardi. Bu, bir hata duzeltmesinin icine gizlenmis bir Faz 2b
    kapsamli gorunurluk degisikligi olurdu. Bunun yerine `check_inler`
    tablosuna `kullanici_adi` sutunu eklendi; `check_in_yap` RPC'si
    (zaten `security definer`) check-in olustururken adi profilden
    okuyup buraya yaziyor. Tavizi: kullanici adini degistirirse eski
    check-in'lerde/anilarda eski ad kalir — anilar icin bu zaten dogru
    davranis (tarihsel kayit), canli check-in'lerde bayatlik penceresi
    en fazla 4 saat.

### Faz 2b beyin firtinasi (2026-08-16)

Faz 2b'nin kapsami beyin firtinasi sirasinda **iki kez** yeniden bolundu.
Kararlarin tam listesi ve gerekceleri:
`docs/superpowers/specs/2026-08-16-faz2b-guvenlik-ve-yogunluk-design.md`.

19. **Engelleme tam kapsamli, cift tarafli ve sessiz.** A, B'yi
    engellediginde B'nin hicbir seyi A'ya gorunmez — canli check-in,
    mekandaki varlik, gecmis anilar, profil. B de A'yi gormez ve
    engellendigini anlamaz. Yarim engelleme (yalnizca canli gorunurlugu
    kesmek) degerlendirildi ve reddedildi: taciz vakasinda engelleyen
    kisi engelledigi kisinin iceriklerini gormeye devam ederdi.
20. **Sikayet hem kisi hem icerik uzerine acilabilir.** `sikayetler`
    tablosu `hedef_tur` ('kullanici' | 'check_in') ve `hedef_id` tutar.
    Yalnizca-kisi modeli reddedildi (sikayet eden hangi icerik yuzunden
    sikayet ettigini serbest metinle anlatmak zorunda kalirdi);
    yalnizca-icerik modeli de reddedildi (profil fotografi ya da
    biyografi taciz iceriyorsa sikayet edecek yer kalmiyordu).
21. **Moderasyon paneli uygulamanin icinde degil, ayri bir web sayfasi
    olacak** ve Faz 2b'nin disinda, sonraki bir is olarak yazilacak.
    Gerekceler: (a) tuketici uygulamasinin icine gizlenmis yonetici
    islevi magaza incelemesinde takilabiliyor; (b) panel uygulamanin
    icindeyse onu koruyan tek sey bir rol kontrolu, o kontrolde bir hata
    olursa siradan kullanici yonetici islevlerine ulasir; (c) sikayet
    edilen fotograf ve metinleri telefon ekraninda incelemek kotu bir
    deneyim. Sira: once sikayet toplama (2b), sonra panel — panel
    olmadan sistem calisir, sikayet akisi olmadan panel ise yaramaz.
22. **Ucretsiz yaricap 1-10 km degil 1-5 km, ve satilan sey yaricap
    degil kimlik.** Ust spec "ucretsiz kullanici gorur, ucretli kullanici
    secer" diyordu (yaricap satiliyordu). Yeni model: **ucretsiz
    kullanici nerede hareket oldugunu gorur (mekan yogunlugu, kimliksiz),
    ucretli kullanici kimlerin oldugunu gorur.**
23. **Kimlik kesfi (yakindakiler kisi listesi) Faz 2b'den cikarilip
    Faz 4'e, odeme altyapisiyla birlikte tasindi.** Gerekce: 2b'de kisi
    listesini ucretsiz verip Faz 4'te paywall koyarsak, kullanicidan
    zaten kullandigi bir ozelligi geri almis oluruz — urun acisindan
    yapilabilecek en zarar verici sey. Hic verilmemis bir seyi satmak
    kolay, verilmis bir seyi geri alip satmak zor. Geriye kalan 2b
    tutarli bir butun: guvenlik makinesi + kimliksiz (toplu) kesif.
24. **Mekan yogunlugu sayisinin uc kurali.** (a) Gizli check-in yapanlar
    sayiya **dahildir** — gizlenen kimliktir, varlik degil; dahil
    edilmezse gizlilik kullananlar mekani bos gosterir ve sayi yalan
    soyler. (b) Engellenenler sayidan **dusmez** — kisiye gore degisen
    sayi, karsilastirmayla engellenme bilgisini sizdirir ("dun 8'di,
    bugun 7"). (c) Sayi **yuvarlanmaz** — "birkac kisi" gorup mekana
    gidip 1 kisi bulan kullanici icin yaniltici olur.
25. **`gizli_mi` bilerek RLS'e konulmadi.** Baglama bagli bir kural:
    ayni satir, kesif yuzeylerinde gizli ama mekan ekranindaki "su an
    burada"da gorunur. RLS satir duzeyindedir, "surada gorunsun burada
    gorunmesin" diyemez. Alternatif (gizli check-in'i her yerde
    gorunmez yapmak) reddedildi: o zaman "gizli" ile "yok" ayni sey
    olurdu ve mekana gidip oradakilerle karsilasma imkani kapanirdi.
    Riski — yeni bir kesif sorgusuna filtreyi koymayi unutmak — spec'te
    acik not ve testle karsilaniyor.
26. **`profiller`'in RLS politikasi degistirilmeyecek.** Baskasinin
    profili yalnizca bir `security definer` RPC uzerinden, yalnizca
    (id, ad, biyografi, fotograflar) alanlariyla okunur. Gerekce:
    Postgres RLS satir duzeyindedir, sutun duzeyinde degil — `ad`'i
    baskalarina acan her politika `dogum_tarihi`'ni de acardi.
27. **Baskasinin profilinde ad, profil fotograflari, biyografi ve
    herkese acik anilar gosterilir; dogum tarihi hicbir kosulda
    gosterilmez.** (2026-08-16.) Once "anilari gormek takip
    gerektirsin" dusunuldu, sonra kullanicinin isaret ettigi gerekceyle
    reddedildi: **ani dedigimiz sey zaten `check_inler` satirinin
    kendisi** — ayni not, ayni fotograf — ve o satir mekan ekraninda
    herkese acik goruluyor (karar #14). Ayni satiri profilde gizlemek
    yeni bir koruma saglamaz; biri o fotografi mekan ekranindan zaten
    gorebilir. Gizlilik kazanci degil, yalnizca bulmayi zorlastirmak
    olurdu.

    Kayda gecen tek fark: profildeki liste **toplu bir hareket
    oruntusu** gosterir ("bu kisi su mekanlara gidiyor"), mekan
    ekranindaki tek tek izlerden farki budur; takip senaryosunda ise
    yarayan sey bu toplamadir. Ama veri zaten acik oldugu icin bu bir
    sizinti degil, kolayliktir — ve kullaniciya bunu tamamen kapatma
    imkani `gorunurluk = 'kimse'` secenegiyle veriliyor.

    Dogum tarihi ise hicbir kullaniciya, ileride takiplesenlere bile
    acilmiyor; yalnizca kayitta yas dogrulamasi icin tutuluyor.
    Gerekirse ileride yalnizca **yas** (tam tarih degil) eklenebilir.
28. **Gorunurluk testleri mock'suz, gercek veritabanina karsi
    yazilacak.** Faz 2a'da 66 Jest testi yesilken mekan detay ekrani
    canli veritabaninda hic calismiyordu; sebebi butun testlerin
    Supabase'i mock'lamasiydi. Bu fazda korunan sey dogrudan guvenlik
    oldugu icin kuralin gercekten uygulandigini mock'la kanitlayamayiz.
    Ayri bir kosum: `npm run test:gorunurluk`.

### Faz 2c beyin firtinasi (2026-08-19)

Spec: `docs/superpowers/specs/2026-08-19-faz2c-kimlik-ve-kisi-arama-design.md`.
Gerekcelerin tamami orada; asagisi ozet.

29. **Kullanici adi, `ad` alaninin yerine gecmez; ek bir kimliktir.**
    `ad` isim soyisimi tasir, `kullanici_adi` benzersizdir. Yerine
    gecirmek, `ad`'in `check_inler` icine kopyalanmasi (karar #18)
    yuzunden her ad degisikliginde gecmis kayitlari toplu guncelleme
    isi dogururdu.
30. **Isim soyisim tek alanda (`ad`) kalir**, ayri `soyad` sutunu
    acilmaz. Soyisim yazmak zorunlu degil.
31. **Kullanici adi bicimi `^[a-z0-9._]{3,20}$`**, kucuk harfle
    saklanir, benzersizlik buyuk/kucuk harf duyarsizdir. Turkce harf
    kabul edilmiyor: gozle ayirt edilemeyen iki hesap taklit icin
    acik kapi olurdu.
32. **Kisi aramasi herkese aciktir ama kapatilabilir.**
    `aramada_gorunsun` varsayilan `true`. Kapatma secenegi olmasaydi
    takip edilmek istemeyen kullaniciya tek secenek hesabi kapatmak
    kalirdi.
33. **Kullanici adi 30 gunde bir degistirilebilir, birakilan ad hemen
    serbest kalir.** Rezerve tablosu YAGNI geregi reddedildi; kural
    tek bir tarih sutunuyla tutuluyor ve sunucuda zorlaniyor.
34. **Mekan ekranlarinda gorunen isim degismez**; kullanici adi
    profil ekranlarinda gosterilir. Karar #29'un dogal sonucu.

### Faz 3a beyin firtinasi (2026-08-19)

Spec: `docs/superpowers/specs/2026-08-19-faz3a-bag-design.md`.
Gerekcelerin tamami orada; asagisi ozet.

35. **Faz 3 dorde bolundu:** 3a bag (istek akisi, gorunurluk
    kademeleri), 3b birebir sohbet, 3c mekan odalari, 3d bildirimler.
    Bu dort parca birbirinden gercekten bagimsiz (bildirim altyapisi
    mesajlasmadan, mekan odasi birebir sohbetten farkli kurallar
    tasiyor) — Faz 2'nin 2a/2b bolunmesindeki mantik burada da gecerli.
36. **3a'da istek akisi var, mesaj ekrani 3b'de.** Sohbet istegi kabul
    edilince "sohbet acik" durumu kaydedilir ama yazacak yer gelmez.
    Takip ve sohbet istegi ayni akisi ve ayni ekranlari paylastigi icin
    birlikte tasarlanmalari, 3b'nin yalnizca mesajlasmaya odaklanmasini
    sagliyor.
37. **Red sonrasi yeniden istek sinirsiz.** Reddedilen istek satiri
    silinir, gonderen hemen yenisini yollayabilir. Israrci davranisa
    karsi koruma engelleme; ayrica toplu taramayi engelleyen gunluk bir
    istek tavani var (50, iki tur birlikte sayilir). Alternatifler
    (kalici red, 30 gunluk bekleme) degerlendirildi ve reddedildi.
38. **Takip, takipciye canli check-in'i uzaktan gorme hakki verir.**
    Takip edilen kisi bir yere check-in yaptiginda, takipci nerede
    olursa olsun gorur (kisinin sectigi bulunurluk kademesine bagli).
    Bu, takibi kabul etmeyi ciddi bir karar haline getiriyor;
    karsiliklari: kabul ekraninda ne verildiginin yazmasi, takipciyi
    cikarabilme, ve engellemenin takibi de kaldirmasi.
39. **Check-in bulunurlugu uc kademeli bir merdiven:** `herkese_acik`
    (mekandakiler + takipciler) > `takipcilerim` (yalnizca takipciler)
    > `gizli` (kimse). Iki eksenli okuma (mekan/uzak ayri) ve dort
    kademeli model reddedildi: kullanicinin kimin gordugunu
    kestirebilmesi, denetimin son zerresinden daha degerli. Bu karar
    Faz 2b karar #25'i degistirdi: uzaktan gorunme yuzeyi olmadan
    "gizli check-in mekanda yine gorunur" kurali gecerliydi, bu faz
    uzaktan gorunmeyi (takipciler) ilk kez yarattigi icin `gizli`
    artik kimseye gorunmuyor.
40. **Varsayilan bulunurluk `herkese_acik`.** Bugunku davranis birebir
    korunur, mevcut kullanicilar icin hicbir sey sessizce degismez.
    Kullanici varsayilani ayarlardan degistirebilir.
41. **Takip ve sohbet istekleri ayri tablolarda** (`takipler`,
    `sohbet_istekleri`), ust spec'in taslagindaki gibi. Tek tablo +
    `tur` sutunu alternatifi degerlendirildi; takip cizgesinin kendi
    dar tablosunda durmasi ve gorunurluk sorgusunun dogrudan ona
    bakmasi tercih edildi. Iki durum makinesinin tekrarina karsi
    onlem: ikisi de ayni `bag.takip_ediyor_mu()` yardimcisini ve ayni
    RPC bicimini paylasir.

### Faz 3b beyin firtinasi (2026-08-20)

Spec: `docs/superpowers/specs/2026-08-20-faz3b-birebir-sohbet-design.md`.
Gerekcelerin tamami orada; asagisi ozet. Bu bolumdeki ilk karar Faz 3a'nin
bag modelini degistiriyor.

42. **Takip artik karsilikli.** Faz 3a'da kabul yalnizca A->B satirini
    yaziyordu; artik kabul iki yonu de yaziyor ve takip bir "bag" oluyor.
    Sonuclari: `takipcilerim` gorunurluk kademesi "beni takip edenler"
    degil "karsilikli bagli oldugum kisiler" demek, bagi koparmak iki
    yonu birden siliyor ve `takipciyi_cikar` RPC'si dusuruldu. Sema
    degismedi; degisen tek sey satirlarin ne zaman yazildigi.
    Karsiliklilik tek bir yerde, kabul RPC'sinde kuruluyor - `takipler`
    tablosuna yalnizca `security definer` RPC'ler yazabildigi icin
    ikinci satiri atlayan bir yol yok. Sirali cift tutan tek satirli bir
    bag tablosu degerlendirildi ve reddedildi: gorunurluk politikasini,
    alti RPC'yi ve iki ekrani yeniden yazmak demekti, karsiliginda
    yalnizca semasal zarafet veriyordu.
43. **Yazma kapisi: karsilikli takip VEYA kabul edilmis sohbet istegi.**
    Ust spec "takip edince yazabilirsin" diyordu ve takip o zaman tek
    yonluydu; bu, bir takip istegini kabul edenin istemeden mesaj
    kutusunu da acmasi demekti. Takip karsilikli olunca sorun ortadan
    kalkiyor. Iki yol da kaliyor: takip istegi kabulu kalici bag verir
    (check-in gorunurlugu **ve** mesajlasma), sohbet istegi kabulu
    yalnizca konusma acar - bag kurulmaz, konum acilmaz.
44. **Konusmayi silmek istegi tuketmiyor.** Ust spec "silen taraf icin
    kaybolur ve yeniden yazmak icin yeni istek gerekir" diyordu; yerine
    yaygin mesajlasma davranisi secildi: silmek yalnizca kendi tarafta
    gizler, karsi taraf yazinca konusma geri gelir. Bedeli acikca kabul
    edildi - gizlemek istenmeyen mesaji durdurmuyor; onun araci
    engelleme, ve engelleme zaten sessiz ve tam. Kullaniciya "sil" degil
    "gizle" denmesinin sebebi de bu.
45. **Yetki her mesajda olculuyor, konusma acilirken bir kez degil.** Bag
    koparsa (takibi birakma, istegi geri cekme, engelleme) konusma
    salt-okunur oluyor: gecmis duruyor, yeni mesaj yazilamiyor; bag
    yeniden kurulursa yazma aciliyor. Gerekce: Faz 3a'da tam bu sinifta
    iki gercek acik cikti - bir kural yalnizca giriste kontrol
    edildiginde, durum sonradan degisince kural delinmis oluyor.
    Konusmanin tamamen silinmesi reddedildi: karsi taraf, senin bagi
    koparman yuzunden kendi gecmisini de kaybederdi.
46. **Okunmamis sayisi var, okundu bilgisi yok.** Uye basina bir
    `son_okuma` zaman damgasi yetiyor. Karsi tarafa "ne zaman okudun"
    gitmiyor: gizlilik yuzeyi aciyor, bu uygulamanin cekirdek ilkesiyle
    gerilimli ve ayrica bir kapatma tercihi gerektirirdi.
47. **Gorunurluk kademesinin ekran metni `takipcilerim` kaliyor.**
    Veritabani degeri de ayni. "Baglantilarim" onerildi ve reddedildi
    (kullanicinin tercihi); boylece veri degeri ile ekran metni
    ayrismiyor.

## Bildirimler mini-fazi (2026-08-21)

Push bildirim sistemi eklendi. Spec:
`docs/superpowers/specs/2026-08-21-bildirimler-design.md`. Kararlar:

48. **Bildirim icerik tasimaz, yalnizca ad.** "Deniz sana mesaj gonderdi"
    - mesajin kendisi kilit ekranina asla dusmuyor. Kullanicinin karari.
    Yabancilarla tanistiran bir uygulamada dogru denge: kimin yazdigi
    gorulur, ne yazdigi gorulmez.
49. **Dort olay bildirim uretir:** yeni mesaj, takip istegi, sohbet
    istegi, istek kabulu. Baska hicbir sey. "Baska hicbir olay" bir kacak
    kontroluyle (test:sema, tgfoid tabanli) baglayici.
50. **Engelleme icin ikinci kontrol katmani yok.** Bildirim ureten her
    olay zaten `bag.yazabilir_mi` / `istek_on_kontrol` yazma kapisindan
    gecmis bir INSERT/UPDATE; engellenen kisi olay uretemedigi icin
    bildirim de uretemez. Fonksiyon yeniden kontrol etmez.
51. **Uctan uca teslim gercek cihaz gerektiriyor; bu faz sunucu yolunu
    dogruladi, cihazi cihaz derlemesine birakti.** Expo Go ve web uzak
    push desteklemiyor. Sunucu zinciri (tetikleyici -> pg_net -> Edge
    Function -> sir + kaynak dogrulama -> Expo cagrisi -> olu jeton
    temizligi) canli, gercek bir olayla dogrulandi; eksik olan yalnizca
    bir telefonun jeton uretip bildirimi almasi.
52. **Payload yalnizca isaretci (id) tasir; icerigi ve aliciyi Edge
    Function kendisi okur, ve KAYNAK SATIRINI dogrular.** Iki sebep:
    (a) pg_net kuyrugu ve HTTP loglari kisisel veri tasimasin; (b) sir
    sizsa bile - ki `net` semasi kilidi platform yuzunden zorlanamiyor -
    saldirgan olmamis bir olay uyduramaz (belirli birini adiyla taklit
    eden sahte bildirim). Kaynak dogrulamasi bu ikinci kapi.
53. **Paylasilan sir veritabaninin ICINDE uretildi (Vault), konusmadan
    hic gecmedi.** Faz 3b'de bir yonetici anahtari konusmaya yapistirilip
    oturum kaydina dusmustu; o dersin uygulamasi. Sirri ne kontrolor ne
    uygulayici gordu.

## Grup sohbeti ve mekan odasi kesin olarak iptal (2026-08-22)

54. **Grup sohbeti, "mekan odasi" ozelligi ve genel olarak COK UYELI
    konusma fikri tamamen ve kalici olarak kaldirildi.** Kullanicinin
    net karari: "grup sohbeti mekan odasi bunlarla alakali bir baglanti
    varsa kaldir, olmayacak, hic olmayacak ... cok uyeli konusmada
    olmayacak ... tamamen bu fikri kaldir." Sonuclari:
    - Uygulama kalici olarak YALNIZCA BIREBIR. Her `konusmalar` satiri
      tam iki uyeli; ikiden fazla uyeli bir konusma turu asla gelmeyecek.
    - Bu, onceki belge notlarindaki "Faz 3c (mekan odalari) grup
      sohbetini ayni RPC'ye baglarsa engelleme kirilir" uyarilarini
      GECERSIZ kilar: risk yok, cunku cok uyeli konusma yok.
      `mesajlari_getir`'deki `limit 1` bir kirilma degil, kalici olarak
      dogru bir varsayim. Ayrinti `docs/faz3b-takip-isleri.md` madde 1a.
    - Karar 35'teki "Faz 3 dorde bolundu: ... 3c mekan odalari ..."
      listesindeki 3c KALDIRILDI. Yapilan fazlar: 3a bag, 3b birebir
      sohbet, ve ayri bir mini-faz olarak bildirimler. 3c yok.
    - Karar 5 ("mekan odasi ozelligi tamamen kaldirildi") zaten bu yonde
      idi; bu karar onu kesinlestirip butun ileri atiflari da temizliyor.
    - Edge Function'daki cogul-alici yolu (`konusmaDigerUyeleri`) diskte
      kalabilir (savunma amacli, zararsiz), ama pratikte hep tek alici
      isler.

## Moderasyon paneli tasarimi (2026-08-22)

Spec: `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`.
Beyin firtinasi kararlari (moderator modeli, tam yonetim konsolu
kapsami, mesaj sikayetinin kaldirilmasi, dilimlere bolme)
`docs/moderasyon-paneli-devam-notu.md` icinde duruyordu; spec o notun
"konusulmayan" listesini asagidaki yedi kararla kapatti.

55. **Panelde service-role anahtari YOK.** Devam notu "panel
    service-role ile her seyi gorecek" varsayimiyla yazilmisti; spec bu
    varsayimi degistirdi. Service-role butun RLS'i atlayan tek bir
    kimlik bilgisi: sizarsa kademe yok, `auth.uid()` olmadigi icin
    denetim izi sentetik olur, ve panel bir daha yerelin disina
    cikamaz. Yerine moderator siradan bir kullanici olarak giris yapar,
    panel yalnizca herkese acik `anon` anahtarini tasir, butun erisim
    `security definer` moderator RPC'lerinden gecer.
56. **Yonetici kimligi: uygulama hesabindan AYRI bir hesap + zorunlu
    TOTP, ve AAL2 veritabaninda zorlanir.** Yetki kapisi
    `auth.jwt()->>'aal' = 'aal2'` ve `moderatorler` tablosunda satir
    olmasini birlikte arar; yalnizca parolayla alinmis bir oturum
    hicbir moderator RPC'sini cagiramaz. Panelin MFA ekranini atlamasi
    bir sey degistirmez. Moderator hesabinin `profiller` satiri yok,
    boylece kisi aramasina ve bag grafigine karismiyor.
57. **"Askiya alma" veritabaninda zorlanir**, `moderasyon.hesap_aktif_mi`
    yardimcisiyla ve ayri bir `hesap_durumlari` tablosuyla. Satirin
    YOKLUGU aktif demek, boylece henuz profili olmayan yeni kullanici
    hicbir kapiya takilmiyor. Bilinen sinir: service-role olmadigi icin
    mevcut Auth oturumu iptal edilemiyor, jeton suresi dolana kadar
    (1 saat) gecerli kaliyor - o sure boyunca yazamiyor ve kimseye
    gorunmuyor.
58. **Panel ayri bir web uygulamasi**, depoda `panel/` altinda: Vite +
    React + TypeScript, sunucu bileseni yok. Expo web uzerine
    bindirilmedi (yonlendirme/oturum/paket yapilandirmasini iki urun
    icin birden tasimak pahali). Ilk dilimde yalnizca yerelde calisir.
59. **Moderator ozel mesaj okuyamaz, hicbir dilimde.** `mesajlar` ve
    `konusmalar` tablolarina bakan hicbir panel RPC'si yok ve
    olmayacak. Karar 3'un (mesaj sikayetinin kaldirilmasi) dogal
    devami.
60. **"Kaldirma" ilk dilimde GIZLEME olarak uygulaniyor.** Onaylanmis
    envanterin bilincli DARALMASI: kalici silme geri alinamaz ve
    fotografin Storage'dan da silinmesini gerektirir. Gizleme guvenlik
    ihtiyacini aninda karsiliyor, geri alinabilir ve izde duruyor.
    Gizlenen icerik sahibine de gorunmuyor.
61. **Denetim izi ekleme-only; moderator dahil kimse silemez.**
    `moderasyon_kayitlari` uzerinde `update`/`delete` hicbir role
    verilmiyor. Aksiyonlarin yani sira kullanici detayinin
    GORUNTULENMESI de kaydediliyor (kisisel veriye erisim izi); liste
    gezinmesi kaydedilmiyor.

### Mesaj erisimi: karar 59 ve karar 3 geri alindi (2026-08-22)

Kullanicinin ayni gun icindeki duzeltmesi: "Mesajlarla alakali bir
sikayet alirsam mesajlari gormem gerek, her seye tam ulasilir olmam
gerek." Spec buna gore degistirildi.

62. **Mesaj sikayeti KALIYOR ve duzgun uygulaniyor.** Onceden alinmis
    karar 3 (mesaj sikayetini tamamen kaldirmak) geri alindi.
    Gerekcelerinden biri "moderatorun ozel mesaj okuma yolunu hic
    acmamak"ti; kullanici o yolu bilerek actigi icin gerekce dustu.
    Dahasi kaldirmak artik zarar veriyordu: sohbetten gelen bir sikayet
    `hedef_tur='kullanici'` olsaydi moderator o sikayetin mesajlarla
    ilgili oldugunu bile bilemezdi. Iki mevcut kusur duzeltiliyor:
    `sikayetler` CHECK kisiti `'mesaj'` turunu taniyacak (bugun insert
    `23514` ile patliyor), ve `hedef_id`'ye konusma id'si yerine gercek
    MESAJ id'si yazilacak. Sikayet edenin o konusmada uye oldugu ve
    kendi mesajini sikayet etmedigi sunucuda dogrulanir.
63. **Moderator konusma gecmisini okuyabilir; erisim IZLI ve
    GEREKCELI.** Erisim kisitlanmiyor, iki kosula baglaniyor: her
    icerik okumasi denetim izine duser (`p_gerekce` zorunlu), ve
    uygulamanin gizlilik metnine moderasyonun mesaj okuyabilecegi acik
    madde olarak yazilir. Ikisi de erisimi zorlastirmak icin degil,
    savunulabilir kilmak icin. Metadata (kim kiminle, kac mesaj, ne
    zaman) ile icerik ayri tutulur. Okuma SALT-OKUNUR: panel mesaj
    silemez, duzenleyemez - silmek karsi tarafin gecmisini de degistirir
    ve sikayetin kanitini yok eder.
64. **Kullanici detayi gercekten her seyi gosterir:** engellemeler (iki
    yon), takip ve sohbet istekleri, gunluk istek sayaci, konusma
    listesi (metadata), bildirim cihazi SAYISI (jetonun kendisi degil -
    jeton bir kimlik bilgisi ve moderasyon degeri yok).

**Yan yukumluluk:** uygulamada gizlilik metni ekrani BUGUN YOK; mesaj
okuma yetkisiyle ayni dilimde gelmesi sart. Ayrilirlarsa aradaki surede
bildirilmemis bir okuma yetkisi calisir durumda olur.

### Gizlilik ve KVKK: standing kural (2026-08-22)

65. **Her adimda gizlilik ilkeleri ve KVKK gozetilecek.** Kullanicinin
    ifadesi: "Attigimiz her adimda bu uygulamanin yapilis suresinde
    gizlilik ilkeleri ve KVKK kurallarini ihlal etmicek sekilde
    ilerlememiz gerek bu onemli buna dikkat et." Tek bir gorev icin
    degil, projenin butunu icin gecerli bir kisit.

    Mekanizmasi: `docs/kvkk-uyum-listesi.md`. Yeni bir is kalemi
    tasarlanirken o dosya okunur ve guncellenir; sonundaki dort soru
    (hangi kisisel veri, hangi hukuki dayanak, ne kadar sure, kim gorur
    ve kaydediliyor mu) spec'te cevaplanir. Kural `CLAUDE.md` icindeki
    "Claude icin kurallar" bolumune de yazildi.

    Ilk envanterin ortaya cikardigi durum: veri guvenligi (KVKK m.12)
    projenin en guclu tarafi (RLS, sutun yetkileri, Vault, AAL2,
    service-role'suz panel), ama **iki madde BLOKE**: aydinlatma metni
    hic yok (m.10) ve hesap silme yok (m.11 silme hakki). Uc madde
    EKSIK: konum icin ayrik acik riza (OS izni ayni sey degil), yurt
    disina aktarim belgelenmemis (Supabase Almanya, Expo Push ABD), ve
    saklama/imha politikasi yok. Iki madde hukukcu onayi bekliyor
    (aktarim mekanizmasi, VERBIS).

    Moderasyon paneli spec'i buna gore guncellendi: gizlilik metni ve
    ekrani zaten ilk dilime alinmisti (karar 63), simdi ayrica saklama
    sureleri de spec'te yaziyor - denetim izi 2 yil, karara baglanmis
    sikayet 1 yil, suresi dolmus aski kaydi 90 gun, `istek_gunlugu`
    budamasiyla ayni `pg_cron` kalibinda.

    Onemli ayrim ve karar 63 ile tutarlilik: uyumun yolu isletmeci
    yetkisini kesmek DEGIL. Yetki genis kalir; uyum aydinlatma,
    denetim izi ve saklama disiplini ile saglanir.

### Hesap haklari: dondurma ve silme (2026-08-22)

Kullanicinin karari: "Kullaniciya istedigi zaman hesabini silme hakki
koymaliyiz ve dondurma hakki koymaliyiz." Netlestirmesi: "Dondurdugu
zaman geri giris yaptiginda hesabi tekrar aktif olucak ama hesabi
sildigi zaman geri donusu olmucak tekrar sifirdan hesap acmali."

66. **Dondurma, moderasyon askisiyla AYNI mekanizmayi kullanir.**
    `hesap_durumlari` tablosuna ucuncu deger (`dondurulmus`) ekleniyor,
    `moderasyon.hesap_aktif_mi` oldugu gibi kaliyor - boylece "askiya
    almanin zorlandigi noktalar" listesindeki 8 yazma kapisi ve 5
    gorunurluk yolu dondurma icin de KENDILIGINDEN calisiyor. Ayri bir
    yol acmak o listeyi ikinci kez ve eksik uygulamak olurdu.
    **Geri acilma OTOMATIK:** dondurma oturumu kapatir, sonraki giriste
    `lib/oturum.tsx` `hesabimi_geri_ac()` cagirir ve hesap aktiflesir;
    ayri bir dugme yok. Guvenligin dayandigi tek nokta: `hesabimi_geri_ac`
    YALNIZCA `dondurulmus` satirini siler - aksi halde askiya alinmis bir
    kullanici giris yapinca askisi farkinda olmadan kalkardi. Kendi
    test:gorunurluk senaryosu olacak.
67. **Silme kalicidir, bekleme suresi YOK.** Cogu uygulamadaki 30 gunluk
    geri alma penceresinin karsiladigi ihtiyaci dondurma zaten
    karsiliyor; KVKK m.11 acisindan da talebi geciktirmek tercih edilen
    davranis degil. Yanlislikla silmeye karsi koruma sure degil
    SURTUNME: parola yeniden istenir ve kullanici kullanici adini
    yazarak onaylar. Telefon numarasi serbest kalir, ayni numarayla
    yeniden kayit olunabilir ama bu SIFIRDAN yeni bir hesaptir.
    Islemi `hesap-sil` Edge Function'i yurutur (auth.users silmek Admin
    API gerektiriyor; karar 55'in service-role yasagi PANELIN PAKETI
    icindir, sunucu fonksiyonu icin degil - bildirim-gonder de ayni
    sekilde kullaniyor).
68. **Silmede mesajlar ve sikayetler KALIR, anonimlesir.** Bugunku
    yabanci anahtarlar bu karari YANLIS veriyor: ikisi de
    `on delete cascade`, yani naif bir silme karsi tarafin konusma
    gecmisini yariya indirir ve kullanicinin BASKALARI hakkinda actigi
    sikayetleri yok eder. Ikisi `set null`'a cevriliyor. Gerekce: bir
    konusma IKI kisinin verisidir; kisiyle bagi koparmak KVKK'nin
    istedigini karsilar, icerigi yok etmek karsi tarafin hakkina girer.
    Tacize ugrayip sikayet eden biri hesabini silince sikayetin de
    silinmesi taciz edeni korurdu.
69. **Silme, "her konusmanin tam iki uyesi var" invaryantini KIRIYOR.**
    Karar 54 bu invaryanti "kalici olarak dogru" ilan etmisti; grup
    sohbeti yonunden dogruydu ama hesap silme onu alttan kiriyor
    (`konusma_uyeleri.kullanici_id` birincil anahtarin parcasi, null
    olamaz, satir cascade ile gidiyor, konusma tek uyeli kaliyor).
    `mesajlari_getir`, `konusmalarim` ve `bag.yazabilir_mi` bu duruma
    gore duzeltiliyor. `docs/faz3b-takip-isleri.md` madde 1a
    guncellendi.
70. **Silinen kullanici adi 90 gun rezerve.** Ad hemen serbest kalirsa
    bir baskasi onu alip silinen kisinin yerine gecebilir. Rezervasyon
    kisiyle hicbir bagi olmayan iki sutunlu bir tabloda tutulur.
    Yan etkisi kabul ediliyor: ayni kisi 90 gun dolmadan donerse eski
    adini alamaz.

**Is iki plana bolundu.** Plan 1 (once): hesap durumu temeli + butun
zorlama noktalari, dondurma, silme, tek uyeli konusma duzeltmeleri,
gizlilik metni ekrani. Plan 2: moderasyon paneli. Sira boyle cunku
uyum listesindeki iki BLOKE madde plan 1'de kapaniyor ve panelin
"askiya al" aksiyonu bu temel olmadan zaten anlamsiz.

### Gizli check-in ve mekan sayaci (2026-08-22)

71. **Gizli check-in mekanin kisi sayacinda GORUNUR, ama kisinin kimligi
    gizli kalir.** Kullanicinin karari. Bu, Faz 2b'den beri var olan
    davranisin bilincli olarak ONAYLANMASIDIR - kaza degil, karar.

    Somut olarak: `yakin_mekanlar_yogunluk`un dondurdugu `kisi_sayisi`
    bulunurluk kademesine bakmaz, yani `gizli` check-in de sayaci
    artirir. Buna karsilik `check_inler` satirinin kendisi RLS ile
    kapalidir (`bulunurluk = 'gizli'` hicbir gorunurluk koluna girmez),
    yani kim oldugu, konumu ve notu kimseye gorunmez.

    **Garantinin siniri acikca yazilsin:** varlik sayilabilir, kimlik
    sizmaz. Cok az kisinin bulundugu bir mekanda sayacin 0'dan 1'e
    cikmasi, oradaki bir gozlemciye "birisi gizli check-in yapti"
    bilgisini verir. Kalabalikta bu bilgi anlamsizlasir. Kullanici bu
    dengeyi bilerek kabul etti; alternatifi (gizli check-in'i sayacdan
    dusurmek) mekan yogunlugu ozelligini gizli kullanicilar icin
    yanlis gosterirdi.

    Sonucu: gizlilik metni bunu OLDUGU GIBI anlatmali - "kimseye
    gorunmez" demek yanlis beyan olur; dogrusu "kimligin gorunmez,
    mekanin anonim kisi sayacinda sayilirsin".

## Plan 1 (hesap durumu temeli ve kullanici haklari) kapanisi (2026-08-22)

18 gorevden 17'si uygulandi, dal `claude/plan1-hesap-haklari`. 16
migrasyon (`20260822090000`den `20260822103000`e - kullanici adi
rezervasyonunu ekleyip sonra kaldiran iki migrasyon dahil), 1 yeni
Edge Function (`hesap-sil`), 1 yeni istemci modulu (`lib/hesap.ts`), 3
yeni ekran, 12 yeni canli senaryo (45-56; 57 kaldirildi, numara
bosta).

**Karar 70 (yukarida "90 gun rezerve") oturum icinde iki kez daha
degisti, son hali GERI ALINMA.** Once kullanicinin istegiyle 24 saate
indirildi, sonra tamamen kaldirildi: ozellik uygulanip incelendiginde
rezervasyonun hicbir YAZMA noktasinda (`kullanici_adi_degistir` RPC'si,
kayittaki `profiller` insert'i) zorlanmadigi ortaya cikti - yalnizca
`kullanici_adi_musait_mi` gostergesi tabloya bakiyordu, gercek yazma
yollari hic bakmiyordu. Ozelligi tam zorlayici yapmak iki yazma yolunu
daha degistirmeyi gerektirecekti; kullanici tamamini kaldirmayi secti.
Sonuc: silinen bir kullanici adi ANINDA serbest kalir, taklit korumasi
yok. Ilgili tablo, RPC ve budama isi veritabanindan dusuruldu.

**Oturum icinde alinan diger kararlar:**

- Dondurulmus hesap geri acilinca canli check-in GERI GELMEZ; yalnizca
  ani olarak kalir. Gerekce: canli varlik zaten ~4 saatlik bir kavram,
  iki hafta sonra donen birinin "su an burada" gorunmesi yanlis olurdu.
- Hesap silme onayi yalnizca PAROLA ile yapilir; kullanici adi onayi
  (karar 67'de yazan) kaldirildi - kullanici zaten kendi hesabinin
  icinde ve kullanici adi herkese acik bir bilgi, gercek bir kapi
  degildi. Parola sunucuda (`hesap-sil` Edge Function'i icinde
  `signInWithPassword` ile) dogrulanir, istemcide degil.
- Karar 71 (gizli check-in mekan sayacinda gorunur) bu oturumda
  yeniden onaylandi, degismedi.

**Dogrulama (Task 18, kapanis kosumu):** `npx jest --runInBand` 44
paket / 359 test yesil; `npm run test:sema` 137 dogrulama, 0 hata;
`npm run test:gorunurluk` 56 senaryo / 306 dogrulama, 0 hata (senaryo
29 bilerek ATLANDI - gunluk tavan, `--tavan` bayragiyla ayrica
calisir); `npx tsc --noEmit` yalnizca bes onceden var olan
`@types/node` hatasi; `deno check hesap-sil/index.ts` ve
`deno check bildirim-gonder/index.ts` temiz, `deno test` 17/17 yesil.

**Gercek hesap silme canli olarak IKI AYRI TURDA dogrulandi** (atilabilir
test hesaplariyla): tam silme akisi (yanlis parolayla red, dogru
parolayla silme, ayni telefonla yeniden kayit) ve parola dogrulama
yolunun kendisinin sunucuda gercekten calistigi. Brief'teki elle
tarayici gezintisinin geri kalani (dondur -> cikis -> giris -> otomatik
geri acilma, askidaki hesap ekrani, gizlilik ekrani) etkilesimli oldugu
icin **kullaniciya birakildi**.

**Enforcement-noktasi denetiminde bulunan uc test bosluğu** (Task 18
Step 2, surec kontrolu - otomatik kacak kontrolu degil): spec'teki 8
yazma kapisi ve 5 gorunurluk yolunun HEPSI migrasyonlarda dogru
uygulanmis, ama ucunun `test:gorunurluk` icinde kendi senaryosu yok:
`bag.yazabilir_mi` (askidaki kullanici mesaj gonderemez - gate 6),
`sohbet_istegini_yanitla`'nin askı kontrolu (gate 5'in yalnizca
`takip_istegini_yanitla` yarisi senaryo 48'de test edildi), ve Storage
`profil-fotograflari` insert politikasi (gate 8). Ayrinti ve migrasyon
kaniti `docs/plan1-takip-isleri.md` icinde.

Kalan takip isleri: `docs/plan1-takip-isleri.md`.

### Uygulamanin adi kesinlesti: SLOOIN (2026-08-23)

72. **Uygulamanin adi SLOOIN. KESIN.** Kullanicinin karari ("slooin
    kesinlesti"). 2026-08-21'deki "isim ertelendi, Wherio kalici degil"
    karari boylece kapandi; isim artik koda giriyor.

    Karar oncesi yapilan kontrolun kaydi: "Slooin" tam yazimiyla ne
    Google Play'de ne App Store'da mevcut - isim bosta. Bilinen tek
    yakin risk: Google Play'de "Sloon" adinda (bir harf eksik) gercek
    zamanli tanisma uygulamasi var - ayni kategori. Kullanici bu risk
    ACIKCA soylendikten sonra "kesinlesti" dedi; yani bilinerek alinmis
    bir karar, gozden kacma degil. Ileride bir marka itirazi ya da
    magaza reddi gelirse donulecek yer burasi.

    Marka tescili ve alan adi kontrolu YAPILMADI; magazaya cikis
    oncesi kalemleri (docs/isim-arastirmasi.md'deki surece eklenecek).

    Ek (2026-08-23, ayni gun): alan adi kontrolu YAPILDI - RDAP ile
    kayit otoritelerinden dogrudan soruldu. slooin.com, slooin.app,
    slooin.net, slooin.co ve slooin.io HEPSI BOSTA (kayitsiz).
    slooin.com.tr RDAP'la dogrulanamadi (TRABIS desteklemiyor; nic.tr
    uzerinden elle bakilmali). Kullaniciya en az slooin.com'un (tercihen
    + slooin.app) hemen alinmasi onerildi; isim public depoda gorunur
    oldugu icin erken kayit ucuz bir sigorta. Satin alma kullanicida.

### Gorsel kimlik calismasi basladi (2026-08-23)

73. **Gorsel yon belirlendi: beyaz + turuncu, modern ve sade.** Surec:
    kullanici once "Swarm x Instagram x Tinder arasi" dedi; ilk taslak
    (mercan-pembe degrade) fazla renkli bulundu ("cok renkli, daha basit
    kullanisli olmali, beyaz ve turuncu agirlikli"); ikinci sade surum de
    yetersiz bulundu ("cok daha modern gelismis seviyede gorunmeli").
    Nihai dil: beyaz zemin, TEK turuncu vurgu (#FF6B1A, yalnizca eylem
    ve canlilik icin), tam kanama fotograf kapaklari uzerinde karartma +
    beyaz yazi, cam (blur) rozetler, YUZER gezinme cubugu, Bricolage
    Grotesque + Instrument Sans. Kelime markasi: siyah "slooin" + turuncu
    nokta. Kanvas: tasarim/slooin-kanvas/ (calisma dosyalari) ve Artifact
    "Slooin Tasarim".

74. **EKRAN METINLERI DUZGUN TURKCE OLACAK (aksanli harflerle).**
    Kullanicinin karari: "yazim yanlislari olmamali". Tasarim
    taslaklarindaki ASCII Turkce ("Su an cevrende", "Kesfet") kullaniciya
    yazim yanlisi olarak gorundu ve hakli: kod/yorum kurali (ASCII)
    KULLANICIYA GORUNEN metinlere uygulanmamali. Sonuc: tasarimda butun
    ekran metinleri duzgun Turkce (Şu an çevrende, Keşfet, Şimdi
    buradasın). ONEMLI TAKIP ISI: uygulamanin KENDISI su an her yerde
    ASCII Turkce metin gosteriyor; gorsel kimlik koda tasinirken UI
    metinleri de duzgun Turkceye cevrilmeli. Kod/yorum/commit kurali
    (ASCII) DEGISMIYOR - yalnizca kullaniciya gorunen string'ler.

75. **EKRAN METINLERI TURKCE'YE CEVRILDI (karar 74 uygulandi).**
    Kullanici uygulamayi telefonda tarayici uzerinden test etti ve tek
    kusur olarak yazim yanlislarini bildirdi ("her sey iyi gorunuyor
    ozellikle dikkatimi cekenler yazim yanlislari cok var"). 21 ekran +
    21 test dosyasinda 421 satir duzeltildi, gizlilik metni ekrani
    bastan yazildi, lib/ icindeki hata metinleri de cevrildi (ekranlar
    e.message'i dogrudan basiyor). Yalnizca c/g/i/o/s/u aksanlari
    kullanildi; duzeltme isaretli harflere girilmedi. KALAN BORC:
    veritabanindaki 32 `raise exception` metni hala aksansiz.
    Commit b431d89.

76. **MODERATORUN MESAJ ERISIMINDE OLCULULUK: dar varsayilan, genis
    erisim ayri eylem.** Kullanici ozel mesaj erisimini kendisi
    sorguladi ("sence mesajlara ulasmak dogru mu degil mi alternatif
    bir yol var mi") ve sunulan oneriyi onayladi. Yetki KESILMIYOR
    (karar 63 gecerli), ama kapsam daraliyor: kademe 1 varsayilandir ve
    yalnizca sikayet edilen mesaji +/- 20 mesajlik cevresiyle gosterir;
    kademe 2 (tam konusma) ayri gerekce, ayri onay adimi ve denetim
    izinde ayri tur (`konusma_tam`) ister. Kullanici detayindan bir
    konusma acmak daima kademe 2'dir. Ayrica sikayet formunda,
    cevredeki mesajlarin incelemeye acilacagi bildirilir. Gerekce:
    KVKK m.4 olcululuk; amac erisimi zorlastirmak degil,
    kazara/aliskanliktan yapilmasini engellemek ve izde ayirt
    edilebilir kilmak. Degerlendirilip ELENEN alternatif: uctan uca
    sifreleme - konum paylasan yabancilarin oldugu bir uygulamada
    taciz vakasinda moderasyonu tamamen kor birakirdi. Spec'te
    "Karar 75" ve "Karar 76" basliklariyla yazildi.

77. **PANELIN YAPIMINA TAM YETKIYLE BASLANDI.** Kullanici "panelin
    yapimina baslarsin tum yetki sende ben yatiyorum" dedi. Plan 2
    (moderasyon paneli) yazilacak ve uygulanacak; ara kararlar
    Claude tarafindan alinip bu deftere yazilacak.

78. **PLAN 2 (MODERASYON PANELI) UYGULANDI.** Kullanicinin tam yetki
    vermesiyle (karar 77) 23 gorevlik plan yazildi ve bes fazi da
    yuruttuldu; dal `claude/plan2-moderasyon-paneli`. Veritabani
    tarafinda 12 migrasyon (moderator kimligi ve AAL2 kapisi, denetim
    izi, sikayet genisletmesi, icerik gizleme, sikayet_gonder
    duzeltmesi, 13 moderator RPC'si, Storage politikalari); mobil
    tarafta mesaj basina sikayet; `panel/` altinda alti ekranli Vite +
    React konsolu. Kapanis: jest 44/364, test:sema 145, test:gorunurluk
    340, mobil tsc bes taban hatasi, panel tsc 0 hata.
    Uc gercek kusur bulundu ve duzeltildi: (a) mesaj sikayeti CHECK
    kisiti yuzunden HIC calismiyordu (Faz 3b'den beri), (b) sohbet
    ekrani konusma id'sini mesaj id'si diye gonderiyordu, (c)
    sikayet_gonder uyelik/sahiplik dogrulamiyordu. Ayrica spec'in
    `check_inler` okuyucu listesi eskimisti; liste canlida yeniden
    uretildi. BLOKAJ: projede TOTP MFA kapali (Supabase proje ayari),
    bu yuzden panele giris yapilamiyor ve pozitif yon dogrulanamadi;
    negatif yon (aal1 ile kapi kapali) gercek bir moderator hesabiyla
    dogrulandi. Ayrinti `docs/plan2-takip-isleri.md`.

79. **MEKAN VERISI FOURSQUARE TEK KAYNAK OLDU; OVERTURE SILINDI**
    (2026-08-30). Once "Foursquare verilerini cekip bir deneme yapalim"
    dendi; deneme raporu (`docs/foursquare-denemesi-2026-08-30.md`)
    Overture'in kalmasini, Foursquare'in sosyal turlerde ek kaynak
    olmasini onerdi. Kullanici sirasiyla: "birlestirmeyelim sadece
    Foursquare'i cekelim" -> "kapali ve bayraklilari alma, iki veriyi
    birlestirip en dogru veriyi olustur" -> (tutarlilik sorusu uzerine)
    "onerini uygula": FOURSQUARE TEK KAYNAK, Overture yalnizca ilce ve
    adres bilgisini bagislar ("Mekanlarin ilce ve adres bilgisi olsun"),
    sonra silinir. Son karar: "check-in yapilmis 16 mekan da silinebilir,
    test icindi; test icin yapilmis seyleri sil, Foursquare ile yeni
    temiz bir konum verisi baslat" -> butun Overture satirlari ve onlara
    bagli test check-in'leri silindi. Sonuc: 5.980.482 Foursquare kaydi
    (kapali, bayrakli ve apartman/toplu konut/ofis/fabrika/yol/etkinlik
    kategorileri disarida), 302 tur, veritabani 3,1 GB. Arama 55 ms,
    yakin mekan 53 ms. Tur gizleme kurali (karar 2026-08-24) DEGISMEDI.

80. **SUPABASE COMPUTE BUYUTULDU: NANO -> MEDIUM** (2026-08-30). Yukleme
    en kucuk sunucuda (224 MB shared_buffers) diske takildi: 25 dakikada
    0,01 derece ilerledi, MCP ve PostgREST baglantilari bile zaman
    asimina dustu. Kullanici once "yavas ucretsiz yoldan devam" dedi,
    sonra rakamlari gorunce ("saatlik oranlanan 60 $/ay, bu is icin bir
    cay parasi") Medium'a gecirdi; ayni is 5 dakikada 2,25 milyon satir
    ilerledi. Kalici boyut karari kullanicida; 6 milyon mekanla Nano'ya
    donmek uygulamayi da yavaslatir. "Kendi sunucumuz" sorusuna cevap:
    mumkun ama isletme yuku bize kalir; magaza oncesi yonetilen kalmasi,
    fatura 100 $/ay'i gecince yeniden bakilmasi onerildi.

81. **ETIKET ONAYI HIC CALISMIYORMUS; TEST BORCU KAPATILIRKEN BULUNDU**
    (2026-09-02). Plan 2'den kalan "gorunurluk paketinde etiket onayi
    senaryosu yok" borcu kapatildi (senaryo 63-64, 28 dogrulama). Senaryo
    yazilir yazilmaz gercek bir kusur cikti: etiketi onaylamak ya da
    reddetmek `42501 permission denied for table check_in_etiketleri` ile
    HIC calismiyordu. Kok neden iki migrasyonun arasinda kalmisti -
    tabloyu kuran 20260826200000 update yetkisini geri almis, onay
    modelini getiren 20260829090000 UPDATE politikasini eklemis ama
    yetkiyi geri vermemisti; yetki yoksa politika hic degerlendirilmiyor.
    Sonucu: her etiket sonsuza kadar 'bekliyor' kaliyordu ve etiketler
    hicbir yerde gorunmuyordu, yani ozellik gonderildigi gunden beri
    kapaliydi. Veri kaybi yok (tablo bostu). Duzeltme migrasyonu
    20260902160000: yetki TABLO GENELINDE degil yalnizca `durum`
    sutununda verildi, cunku politikanin `with check` kolu `check_in_id`
    hakkinda hicbir sey soylemiyor - tablo geneli yetkide etiketlenen
    kisi bekleyen satirini baskasinin check-in'ine tasiyabilirdi.
    Ders: bir tablodan yetki geri alindiktan sonra politika eklemek
    YETMEZ, yetki de geri verilmelidir; politika sessizce olu kalir.
    Kapanis: jest 59/536, test:sema 147, test:gorunurluk sifir hata.

82. **AKIS KARTI: EYLEM SATIRI FOTOGRAFIN USTUNE, UC NOKTA MENUSU VE
    PAYLASIM DUZENLEME** (2026-09-02). Kullanici begeni/yorum/paylas
    ikonlarinin yukari tasinmasini ve bir duzenleme butonu eklenmesini
    istedi. Uc yerlesim secenegi once GORSEL olarak sunuldu; kullanici
    "a olsun duzenle ucnokta olsun silmeyide ucnoktanin icine ekle"
    dedi. Olculen kok neden ikonlarin yeri degildi: fotograf geldigi en
    boy oraniyla ciziliyor, uzun bir gorselde kart ekrani tasiyor ve
    eylem satiri hic gorunmuyordu; kirpma secenegi onerildi ama
    kullanici A duzenini secti (eylemler fotografin ustunde). Baslikta
    cop kutusu kalkti, yerine uc nokta menusu geldi (Duzenle / Sil);
    silme yine iki adimli. Duzenleme penceresinde not degistirilir ya da
    bosaltilip silinir, etiketler carpiyla kaldirilir. MEKAN VE ZAMAN
    DEGISMEZ ve bu ekranda yaziyor - check-in bir konum iddiasi, ustelik
    etiketlenen kisi o konuma bakarak onay vermisti. Yeni RPC
    `check_in_notunu_guncelle` (migrasyon 20260902170000): `check_inler`
    uzerindeki dogrudan update yasagi KORUNDU, yalnizca not yazan dar
    bir kapi acildi. Etiket kaldirma icin yeni bir sey gerekmedi.
    Kapanis: jest 59/545, canli senaryo 65 ile 10 dogrulama.

83. **NOT UZUNLUK SINIRI 500; "acik borc" kabul edilmedi** (2026-09-02).
    Kart duzenleme isi gonderilirken notun uzunluk siniri olmadigi acik
    borc olarak yazilmisti. Kullanicinin cevabi: **"Konmalıysa koy
    sonraya iş bırakma."** Sinir ayni oturumda konuldu: 500 karakter -
    `yorumlar` tablosundaki mevcut tavanla ayni. Uc katman: sutun
    kisiti, iki RPC'de acik kontrol, istemcide kirpma (migrasyon
    20260902180000). Ayni migrasyonda `check_in_yap` notu
    normallestirmeye basladi; onceden yalnizca bosluktan olusan not
    oldugu gibi yaziliyordu ve iki yazma yolu ayni girdiye farkli cevap
    veriyordu. Yazilan test gercek bir tuzak buldu: ekran testi
    `lib/checkin`i mock'ladigi icin `NOT_EN_FAZLA` undefined oluyor ve
    `slice(0, undefined)` sessizce hicbir sey kirpmiyordu; mock artik
    `requireActual` ile sabitleri koruyor. Kapanis: jest 59/548, canli
    senaryo 65 13 dogrulama.

84. **YORUMLAR ALTTAN ACILAN SAYFAYA TASINDI** (2026-09-03). Kullanici
    Instagram'in yorum sayfasini gosterip "yorum ikonuna basinca boyle
    bir yer gelsin" dedi; iki yukseklik secenegi gorsel olarak sunuldu
    ve **"A" (yarim yukseklik)** secildi. Onceki ayri sayfa
    (`/yorumlar/<id>`) SILINDI - gercek ekran goruntusuyle olculen uc
    sorunu vardi: paylasim gozden kayboluyor, alt gezinme cubugu altta
    duruyor, akisa donus sayfa gecisi gerektiriyordu. Yerine
    `src/tasarim/YorumSayfasi.tsx`. Referanstaki "Yanitla", yorum
    begenme ve "Senin icin" siralamasi ALINMADI (karsiligi yok,
    uydurulmadi); emoji seridi alindi ama tepki degil, yazma kutusuna
    metin ekliyor. Uc nokta menusu ortaklastirildi: `PaylasimMenusu`
    yerine genel `SecimPenceresi`. Iki yerlesim kusuru ekran
    goruntusuyle bulundu ve duzeltildi (sayfa icerige gore buzuluyordu;
    FlatList flex almadigi icin yazma alani ortada asili kaliyordu).
    Kapanis: jest 60/565, tsc bes taban hatasi, test:gorunurluk sifir
    hata.

85. **PROFIL KIMLIK BANDI YUMUSATILDI** (2026-09-03). Kullanici profil
    ekraninin goruntusunu gonderip "daha yumusak bir ton" istedi. Dort
    secenek gorsel olarak sunuldu; **"B" - yumusak gecis** secildi ve
    kapsam kullanici tarafindan daraltildi: "sadece profil resminin
    arkasindaki renk icin, geri kalan her sey ayni kalsin". Band zemini
    dolu `#FE7813` yerine uc duraklı bir gradyan
    (`#FFE6D2` -> `#FFF3E9` -> beyaz). Bandin icindeki metinler koyu tona
    gecmek ZORUNDAYDI (beyaz yazi acik gecis uzerinde okunmuyor); disinda
    hicbir sey degismedi ve bu bir testle kilitlendi. Kodda duran
    "dekoratif turuncu, kimlik kuraliyla celisiyor" notu boylece cozuldu:
    ekrandaki tek tam doygun turuncu artik "Profili duzenle" butonu.
    `expo-linear-gradient` zaten bagimlilikta oldugu icin OTA ile
    gidebiliyor. Kapanis: jest 60/568, tsc bes taban hatasi.

86. **PROFIL GECISI TEPEYE UZATILDI, AKIS FOTOGRAFI DUZELDI**
    (2026-09-03). Kullanici "rengi yukari kadar devam ettir sonsuz
    dursun" dedi; uc secenek gorsel olarak sunuldu ve "A" (tepeden
    baslar) secildi. Gecis artik sarmalayici degil arkada duran mutlak
    bir zemin - sarmalamak denendi ve JSX'i bozdu, cunku ust cubuk ile
    kimlik blogu ayri kosullu dallarda. Durum cubugunun ardindaki serit
    kok duzende oldugu icin orasi ayri bir `ust-serit` View'iyle ayni
    renge boyandi; yalnizca profilin kendi ekraninda. Ayni gonderimde
    kullanicinin bildirdigi bir hata da duzeldi: akistaki fotografa
    basinca check-in'in haritasi aciliyordu (fotograf duz bir Image'di,
    dokunus kartin kok Pressable'ina cikiyordu); artik siyah zeminli
    buyuk gorunum aciliyor. Kapanis: jest 60/576, tsc bes taban hatasi.

87. **UST GUVENLI ALAN SERIDI BEYAZ KALIYOR** (2026-09-03). Bir onceki
    adimda profil gecisinin ilk rengi durum cubugunun ardindaki seride
    de tasinmisti; kullanici telefonda gorup geri aldirdi: "saatin
    gorundugu kisim beyaz olsun". Serit artik her ekranda beyaz.
    `ust-serit` View'i KALDI (silinmedi) ki kural gorunur olsun ve
    testle kilitlensin. Gecis ust cubugun ardindan gecmeye devam ediyor,
    yalnizca saat seridine girmiyor.

88. **PROFIL SADELESTI: BANT BUTONLARI KALKTI, @ ISARETI GITTI**
    (2026-09-03). Kullanici banttaki "Profili duzenle" ve "Paylas"
    butonlarinin kaldirilmasini, paylasmanin ayarlar ikonunun yanina bir
    ikon olarak gecmesini istedi; uc yerlesim sunuldu, "A" (ayarlarin
    solunda) secildi. Ayrica kullanici adindan @ kaldirildi ve yeri icin
    dort secenek sunulup yine "A" (ust cubukta kalsin) secildi. Is
    baslamadan bir bagimlilik bulundu ve kullaniciya soylendi:
    ayarlardaki "Profilini duzenle" satiri 2026-08-30'da tam da bant
    dugmesi yuzunden kaldirilmisti, yani dugme kalkinca duzenleme ekrani
    erisilemez kalacakti - satir geri kondu. @ bes yerden birden kalkti
    (profil basligi, baskasinin profili, ayarlar degeri, duzenleme
    satiri, paylasim metni) cunku yarim birakmak tutarsizlik uretirdi;
    uygulamanin geri kalani zaten @'siz gosteriyordu. Kapanis: jest
    60/579, tsc bes taban hatasi.
