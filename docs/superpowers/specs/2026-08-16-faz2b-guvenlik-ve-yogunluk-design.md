# Faz 2b — Guvenlik ve yogunluk — tasarim

Tarih: 2026-08-16
Durum: kullanici onayindan gecti (beyin firtinasi tamamlandi)
Onceki faz: `docs/superpowers/specs/2026-08-14-faz2a-mekanlar-checkin-design.md`
Ust spec: `docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`

## Tek cumle

Kullanici kendini gizleyebilir, anilarinin kimlere gorunecegini secebilir,
rahatsiz eden kisiyi engelleyip sikayet edebilir; ve cevresindeki mekanlarin
ne kadar yogun oldugunu — kimlerin orada oldugunu gormeden — gorebilir.

## Bu fazin sinirlari ve neden boyle bolundu

Ust spec'te "Faz 2 — Kesif ve guvenlik" tek fazdi. Once 2a/2b olarak
bolundu (2a: check-in altyapisi, 2b: kesif ve guvenlik). Bu tasarim
sirasinda ikinci bir bolme daha yapildi: **kimlik kesfi (yakindakiler
kisi listesi) bu fazdan cikarilip Faz 4'e, odeme altyapisiyla birlikte
tasindi.**

Gerekcesi: kisi listesi urunun satilacak ozelligi (karar #12). Odeme
altyapisi Faz 4'un isi. Eger 2b'de kisi listesini ucretsiz verirsek,
Faz 4'te paywall koyarken kullanicidan zaten kullandigi bir ozelligi geri
almis oluruz — urun acisindan yapilabilecek en zarar verici sey. Hic
verilmemis bir seyi satmak kolay, verilmis bir seyi geri alip satmak
zor. O yuzden kimlik kesfi ve paywall birlikte dogacak.

Geriye kalan 2b tutarli bir butun: **guvenlik makinesi + kimliksiz
(toplu) kesif.** Guvenlik altyapisinin kimlik kesfinden once hazir olmasi,
2a/2b bolunmesinin zaten asil gerekcesiydi.

## Kapsam

### Bu fazda var

| Parca | Aciklama |
|---|---|
| Mekan yogunlugu | Her mekanin yanindaki anlik check-in sayisi, ucretsiz, 1-5 km |
| Gizli check-in | `gizli_mi` — kisi mekanda gorunur ama uzaktan bulunamaz |
| Varsayilan gizlilik | Kullanici "her check-in'im varsayilan gizli olsun" diyebilir |
| Ani gorunurlugu | `gorunurluk` alani islevsel hale gelir: herkese acik / kimse |
| Baskasinin profili | Ad, fotograflar, biyografi, herkese acik anilar |
| Engelleme | Cift tarafli, sessiz, gecmis anilar dahil tam kapsamli |
| Sikayet | Kisi ve icerik ayri ayri sikayet edilebilir |

### Bu fazda yok

- **Yakindakiler kisi listesi (isimler)** — Faz 4, odeme ile birlikte
- **Odeme / abonelik altyapisi** — Faz 4
- **Moderasyon paneli** — ayri ve sonraki bir is (asagida "Moderasyon")
- **Takip/arkadaslik iliski modeli** — Faz 3. Bu yuzden ani gorunurlugu
  bu fazda uc degil **iki** secenekli (karar #15'in tam hali Faz 3'te)
- Mesajlasma, sohbet istegi — Faz 3

## Ust spec'ten degisen kararlar

Bu tasarim sirasinda ust spec'in iki karari degisti:

1. **Ucretsiz yaricap 1-10 km degil, 1-5 km.** Ucretli katmanin degerini
   artiriyor. Tavizi: seyrek bolgelerde ucretsiz kullanici daha cok bos
   ekran gorur; yogunluk sayisi bunu kismen telafi ediyor.
2. **Satilan sey yaricap degil, kimlik.** Ust spec "ucretsiz kullanici
   gorur, ucretli kullanici secer" diyordu (yaricap ayari satiliyordu).
   Yeni model: ucretsiz kullanici *nerede hareket oldugunu* gorur,
   ucretli kullanici *kimlerin oldugunu* gorur.

## Veri modeli

### Yeni tablolar

```
engellemeler  (engelleyen_id, engellenen_id, olusturuldu)
              primary key (engelleyen_id, engellenen_id)

sikayetler    (id, sikayet_eden_id, hedef_tur, hedef_id, sebep,
               aciklama, durum, olusturuldu)
              hedef_tur: 'kullanici' | 'check_in'
              durum:     'yeni' | 'incelendi' | 'islem_yapildi' | 'reddedildi'
```

**`engellemeler` tek yonlu kayit tutar, cift yonlu okunur.** A→B kaydi
varsa hem A B'yi gormez hem B A'yi gormez. Boylece B engellendigini
kayittan anlayamaz (sessizlik ilkesi) ve tek satir iki yonu de cozer.

**`sikayetler.hedef_id` bilerek yabanci anahtar degil.** Hedef ya
`auth.users` ya `check_inler` olabiliyor; ayrica sikayet edilen icerik
silinse bile sikayet kaydi durmali (moderasyon gecmisi).

### Degisen tablolar

**`check_inler`** — bir yeni alan, bir alan islevsel hale geliyor:

- **`gizli_mi boolean not null default false`** (yeni). Bu check-in
  yogunluk disindaki kesif yuzeylerinde gorunmez. Mekan ekranindaki
  "su an burada" listesinde **yine gorunur** (2a'nin karsilikli
  gorunurluk kurali gecerli). Anlami: "buradayim ama uzaktan
  bulunmak istemiyorum".
- **`gorunurluk`** (2a'da eklendi, islevsizdi). Artik iki deger aliyor:
  `herkese_acik` | `kimse`. Ani fazini yonetiyor.

Iki alan, check-in'in iki ayri yasam evresini yonetiyor: `gizli_mi`
**canli** evreyi, `gorunurluk` **ani** evreyi.

**`profiller`** — bir yeni alan:

- **`varsayilan_gizli boolean not null default false`**. Check-in ekrani
  bu degeri on-secili getirir, kullanici o check-in icin degistirebilir.
  Gerekce: gizlilik bir guvenlik ozelligi; her seferinde hatirlamak
  zorunda birakmak ozelligi fiilen ise yaramaz hale getirir.

## Gorunurluk ve engelleme kurallarinin uygulanmasi

**Ilke (2a'dan devam):** filtreleme Postgres'te, istemci hicbir sey
gizlemiyor. Bu uygulamada gorunurluk hatasi bir goruntu hatasi degil,
guvenlik olayi; tek yerde tanimli olmasi hem gozden gecirilebilir hem de
yeni ekran eklenince kurali uygulamayi unutmayi imkansiz kiliyor.

### RLS'e giren kurallar (baglamdan bagimsiz)

1. **Engelleme.** Iki kullanici arasinda herhangi bir yonde engelleme
   kaydi varsa, o kullanicinin hicbir `check_inler` satiri digerine
   gorunmez — canli, ani, fark etmez.
2. **Ani gorunurlugu.** `gorunurluk = 'kimse'` olan bir aniyi sadece
   sahibi gorur.

Bunlar 2a'nin mevcut SELECT politikasinin uzerine eklenir; 2a'nin uc
kosulu (kendi satirin / ani / ayni mekanda karsilikli canli) korunur.

### RLS'e giremeyen kural

3. **Gizli check-in.** `gizli_mi` **baglama baglidir**: ayni satir,
   yogunluk disindaki kesif yuzeylerinde gizli ama mekan ekranindaki
   "su an burada"da gorunur. RLS satir duzeyindedir — "surada gorunsun,
   burada gorunmesin" diyemez. Dolayisiyla `gizli_mi` ilgili sorgunun
   kendi `where` kosulunda uygulanir.

**Bu bilincli bir sapma ve bir riski var:** ileride kesif benzeri yeni bir
sorgu yazilirsa `gizli_mi` filtresini oraya koymayi unutmak mumkun.
Karsi tedbir: bu spec'teki acik not ve her yeni kesif sorgusu icin
`gizli_mi` filtresini dogrulayan bir test.

Alternatif — `gizli_mi`'yi evrensel yapmak (hicbir yerde gorunmemek) —
degerlendirildi ve reddedildi: o zaman "gizli" ile "yok" ayni sey olurdu
ve mekana gidip oradakilerle karsilasma imkani da kapanirdi, ki ust
spec'in kastettigi bu degil.

## Mekan yogunlugu

Ucretsiz, kimliksiz kesif. Mekan arama ekraninda her mekanin yaninda o
an oradaki aktif check-in sayisi gorunur. Yaricap 1-5 km.

**Sayinin kurallari:**

- **Gizli check-in yapanlar sayiya dahildir.** Gizlenen kimliktir,
  varlik degil. Dahil edilmezse gizlilik kullananlar mekani bos gosterir
  ve sayi yalan soyler. Sayi kimseyi ele vermiyor.
- **Engellenenler sayidan dusmez.** Sayi herkes icin ayni olmalidir;
  kisiye gore degisen bir sayi, karsilastirmayla engellenme bilgisini
  sizdirabilir ("dun 8'di, bugun 7 — demek ki X beni engelledi").
  Sessizlik ilkesi bunu gerektiriyor.
- **Sayi oldugu gibi gosterilir, yuvarlanmaz.** Yuvarlama ("birkac kisi")
  degerlendirildi ve reddedildi: mekana gidip 1 kisi bulan kullanici icin
  yaniltici olur.

Bu, sayinin kisi listesinden farkli bir gizlilik kategorisinde oldugu
anlamina gelir: kimlik acmadigi icin engelleme/gizlilik kurallarindan
etkilenmez.

## Ekranlar

**Mekan arama** (2a'da var, guncelleniyor) — her mekan satirinin yaninda
anlik check-in sayisi.

**Baskasinin profili** (yeni) — ad, fotograflar, biyografi ve o kisinin
`gorunurluk = 'herkese_acik'` anilari. Alt kosede **Engelle** ve
**Sikayet et**.

**Gorunurluk ayarlari** (yeni, kendi profilinde) — `varsayilan_gizli`
anahtari ve "anilarimi kimler gorsun" (herkese acik / kimse).

**Check-in ekrani** (2a'da var, guncelleniyor) — "Gizli check-in"
anahtari, `varsayilan_gizli` degerinden on-secili gelir. **Ilk
check-in'de tam ekran uyari:** ne paylasildigi acikca yazili, oradan tek
dokunusla gizliye cevrilebilir. Bu, KVKK'nin acik riza beklentisini
karsilayan yer.

**Sikayet akisi** — profilden kisi sikayeti, bir check-in/ani kartindan
icerik sikayeti. Sebep secimi + istege bagli aciklama. Gonderdikten
sonra "aldik" teyidi; "inceleyecegiz" denmez — elle moderasyonda
tutulamayacak bir soz olabilir.

**Kullaniciyla karsilasma noktalari** 2a'dan geliyor: mekan ekranindaki
"su an burada" listesi ve mekan anilari. Bir isme dokununca baskasinin
profili acilir. Yani 2b'de koruma ozelliklerinin gercek bir yuzeyi var.

## Moderasyon

Sikayetler `sikayetler` tablosuna duser. **Moderasyon paneli bu fazin
disinda** ve uygulamanin *icinde* degil, **ayri bir web sayfasi** olarak
yazilacak.

Gerekceler:
1. **Magaza incelemesi.** Tuketici uygulamasinin icine gizlenmis yonetici
   islevi App Store/Play Store incelemesinde takilabiliyor.
2. **Yetki sizmasi.** Panel uygulamanin icindeyse onu koruyan tek sey bir
   rol kontrolu; o kontrolde bir hata olursa sıradan kullanici yonetici
   islevlerine ulasir. Ayri sayfada kod kullanicinin cihazinda hic
   bulunmaz.
3. **Pratiklik.** Sikayet edilen fotograf ve metinleri telefon ekraninda
   incelemek kotu bir deneyim.

Sira: 2b'de sikayet toplama, sonra panel. Panel olmadan da sistem calisir
(sikayetler birikir, Supabase panelinden bakilabilir); sikayet gonderme
akisi olmadan panel ise yaramaz.

## Hata durumlari

| Durum | Davranis |
|---|---|
| Konum izni reddedildi | Yogunluk gosterilemez, sebep acikca yazilir |
| Kendini engellemeye calisma | RPC reddeder |
| Zaten engellenmis kisiyi tekrar engelleme | Sessizce basarili sayilir |
| Engellenen kisinin profiline dogrudan gitme | "Bulunamadi" gibi davranir — "engellendin" denmez |
| Ayni hedefe tekrar sikayet | Kabul edilir; panelde tek kisiden cok sikayet olarak gorunur |
| Silinmis icerige acilmis sikayet | Sikayet kaydi durur (`hedef_id` FK degil) |
| Ag yok | Acik hata mesaji, elle tekrar deneme (2a'daki gibi) |

## Test yaklasimi

Burada 2a'dan bilincli bir farklilasma var.

- **Birim testleri** (2a'daki gibi, mock'lu): ekran davranislari, istemci
  fonksiyonlari.
- **Gorunurluk testleri — mock'suz, gercek veritabanina karsi.**
  Engelleme, gizli check-in ve ani gorunurlugu kurallari icin gercek
  Postgres'e yazip gercek RLS ile okuyan testler.

  **Gerekce:** Faz 2a'da 66 test yesilken mekan detay ekrani canli
  veritabaninda hic calismiyordu; sebebi butun testlerin Supabase'i
  mock'lamasiydi. Bu fazda korunan sey dogrudan guvenlik oldugu icin,
  kuralin gercekten uygulandigini mock'la kanitlayamayiz.
- **Engelleme testinin ozel onemi:** A engelledikten sonra B'nin A'yi
  hicbir yuzeyde (yogunluk sayisi haric) goremedigi ayrica dogrulanir.

## Sonraki adim

Bu spec onaylandiktan sonra `writing-plans` becerisiyle Faz 2b'nin
uygulama plani yazilacak.
