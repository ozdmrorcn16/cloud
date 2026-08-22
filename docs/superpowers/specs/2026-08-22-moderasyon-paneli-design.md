# Moderasyon paneli - tasarim (2026-08-22)

## Amac

Uygulamanin disinda, uygulamayi isleten kisinin kullandigi bir yonetim
konsolu. Sikayetleri karara baglar, kullanicilari ve icerigi yonetir,
zorlama aksiyonlarini (askiya alma, yasaklama, icerik gizleme) uygular
ve her aksiyonu denetim izine yazar.

Bugun `sikayetler` tablosuna satir yaziliyor ve **hicbir sey onu
okumuyor**. Sikayet akisi Faz 2b'de yazildigindan beri ucu acik: bir
kullanici sikayet edebiliyor, kimse cevap veremiyor. Bu is o ucu
kapatiyor.

Kullanicinin kapsam ifadesi: "panelden cok kapsamli aksiyon almam
gerek, her seye hakim olmam gerek." Yani yalnizca sikayet okuyucusu
degil, tam yonetim konsolu.

## Onceden alinmis kararlar (beyin firtinasi, 2026-08-22)

Bunlar `docs/moderasyon-paneli-devam-notu.md` icinde kullanicinin
onayiyla kapanmisti; burada tekrar ediliyor ki spec tek basina
okunabilsin.

- **Moderator modeli: yalnizca kullanicinin kendisi, simdilik.** Rol
  yonetimi arayuzu yok. Ama veritabani tarafi cok-moderatorlu modele
  sema degisikligi olmadan gececek sekilde tasarlanir: her aksiyon
  "kim yapti" bilgisiyle kaydedilir.
- **Kapsam: tam yonetim konsolu**, dilimlere bolunerek insa edilir ama
  tasarim butunsel yapilir.
- ~~**Mesaj sikayeti tamamen kaldirilir.**~~ **BU KARAR GERI ALINDI**
  (kullanicinin karari, 2026-08-22; asagida karar 62). Mesaj sikayeti
  kaliyor ve DUZGUN uygulaniyor.
- Envanterin `[ILK]` / `[SONRA]` dilimlemesi devam notundaki gibidir;
  son hali asagida "Dilimler" bolumunde.

## Yeni kararlar

Devam notunun "Konusulmayan, spec yazilirken karara baglanacaklar"
listesi burada kapaniyor. Numaralar `docs/konusma-gunlugu.md`
serisinin devami (son karar 54).

### Karar 55 - Panelde service-role anahtari YOK; erisim moderator RPC'leri uzerinden

Devam notu "panel service-role ile her seyi gorecek" varsayimiyla
yazilmisti. Bu tasarim o varsayimi **degistiriyor**.

Service-role anahtari butun RLS'i atlayan tek bir kimlik bilgisidir.
Panelde bulunmasi uc sorun uretir: (a) sizarsa veritabaninin tamami
gider, kademe yok; (b) `auth.uid()` olmadigi icin "kim yapti" bilgisi
sentetik olur, denetim izi panelin kendi durustluguna dayanir; (c)
panel bir daha asla yerelin disina cikamaz.

Yerine: moderator **siradan bir Supabase kullanicisi** olarak giris
yapar, panel yalnizca herkese acik `anon` anahtarini tasir (sir
degildir), ve butun okuma/yazma islemleri `security definer` moderator
RPC'lerinden gecer. Her RPC ilk satirda yetki kapisini cagirir.
Sonuclari:

- Panelin paketinde hicbir sir yok; barinma sorusu guvenlik sorusu
  olmaktan cikiyor.
- `auth.uid()` gercek, yani denetim izini veritabani dolduruyor; panel
  yalan soyleyemez.
- Cok-moderatorlu modele gecis bir satir `insert` demek.
- Kullanici tablolarinin RLS'ine hic dokunulmuyor; moderator
  gorunurlugu ayri bir yoldan geliyor, mevcut politikalari gevsetmiyor.

### Karar 56 - Yonetici kimligi: ayri hesap + zorunlu TOTP, AAL2 veritabaninda zorlanir

- Moderator hesabi **uygulamada kullanilan hesaptan ayridir**: kendi
  telefon numarasi, guclu parola, `profiller` satiri **yok**. Gerekce:
  uygulama hesabinin ele gecirilmesi panelin ele gecirilmesi anlamina
  gelmemeli; ayrica profili olan bir moderator kisi aramasinda cikar,
  sikayet edilebilir ve bag grafigine karisir.
- Ikinci faktor Supabase Auth'un TOTP MFA'sidir (kayit bir kez panelden
  yapilir). Devam notundaki "parola + tek kullanimlik kod" gereksinimi
  budur. Auth saglayicisi degismiyor, yeni bir kayit yuzeyi acilmiyor.
- **MFA arayuzde degil veritabaninda zorlanir.** Yetki kapisi JWT'nin
  `aal` talebine bakar: `auth.jwt() ->> 'aal' = 'aal2'`. Yalnizca parola
  ile alinmis bir oturum (`aal1`) hicbir moderator RPC'sini cagiramaz.
  Panelin "MFA ekranini gostermeyi atlamasi" bir sey degistirmez. Bu,
  projenin kendi kuralinin uygulamasidir: istemcinin cagirmayi
  secebilecegi bir kural, kural degildir.
- Ek olarak `moderatorler` tablosunda satiri olmayan hicbir kimlik
  gecemez. Iki kosul birlikte aranir.

### Karar 57 - "Askiya alma" veritabaninda zorlanir, ayri bir tabloda tutulur

Zorlama tek bir yardimci fonksiyona baglanir
(`moderasyon.hesap_aktif_mi`) ve butun yazma kapilarina ve gorunurluk
yollarina eklenir (tam liste asagida). Istemci tarafindaki "hesabin
askida" ekrani yalnizca UX'tir, kural degildir.

Durum `profiller` icinde degil ayri bir `hesap_durumlari` tablosunda
durur. Uc gerekce: (a) `profiller` kullanicinin kendi verisi, moderasyon
durumu isletenin verisi; (b) satirin **yoklugu** "aktif" demek olur,
yani kayit sirasinda henuz profili olmayan kullanici hicbir kapiya
takilmaz; (c) `profiller` uzerindeki sutun bazli `grant` listesi
kalabaliklasmaz ve sutun yanlislikla yazilabilir hale gelmez.

**Bilinen sinir:** service-role olmadigi icin panel Supabase Auth
oturumunu iptal edemez. Askiya alinan kullanicinin elindeki erisim
jetonu suresi dolana kadar (varsayilan 1 saat) gecerli kalir. O sure
boyunca hicbir sey yazamaz ve kimseye gorunmez; yalnizca kendi verisini
okuyabilir. Bu kabul edilebilir bir gecikme; hemen iptal isteniyorsa
`[SONRA]` diliminde sunucu tarafli kucuk bir Edge Function eklenir.

### Karar 58 - Panel ayri bir web uygulamasidir, depoda `panel/` altinda

- Teknoloji: Vite + React + TypeScript + `@supabase/supabase-js`. Sunucu
  bileseni yok, cikti duz statik paket.
- Mobil uygulamayla kod paylasmaz. Expo web uzerine bindirmek
  yonlendirmeyi, oturumu ve paket yapilandirmasini iki urun icin birden
  tasimak demekti; ayrilik daha ucuz.
- Ilk dilimde yalnizca yerelde calisir (`npm run dev`). Karar 55
  sayesinde pakette sir olmadigi icin daha sonra herhangi bir statik
  barindiriciya cikarilmasi ek bir guvenlik karari gerektirmez; cikarma
  isi `[SONRA]`.

### Karar 59 - GERI ALINDI

Bu karar "moderator ozel mesaj okuyamaz, hicbir dilimde" diyordu.
Kullanici 2026-08-22'de bunu geri cevirdi: "Mesajlarla alakali bir
sikayet alirsam mesajlari gormem gerek, her seye tam ulasilir olmam
gerek." Yerine gecen tasarim karar 63'te.

### Karar 60 - "Kaldirma" ilk dilimde GIZLEME olarak uygulanir

Devam notundaki `[ILK]` maddesi "check-in / ani gizle veya kaldir"
diyordu. Ilk dilim yalnizca **gizlemeyi** getiriyor; kalici silme
`[SONRA]`ya gecti. Gerekce: kalici silme geri alinamaz ve fotografin
Storage'dan da silinmesi gerekir, bu da service-role ya da ek bir
Storage politikasi ister. Gizleme guvenlik ihtiyacini aninda karsiliyor
(icerik kimseye gorunmuyor), geri alinabilir ve denetim izinde duruyor.
Bu, onaylanmis envanterin **daralmasidir** ve bilerek yapilmistir.

Gizlenen icerik **sahibine de gorunmez**. Sahibine "moderasyon
tarafindan gizlendi" bildirimi gosterilmesi ayri bir is ve `[SONRA]`.

### Karar 61 - Denetim izi ekleme-only, moderator dahil kimse silemez

`moderasyon_kayitlari` tablosuna yalnizca RPC'ler yazar; `update` ve
`delete` hicbir role verilmez. Panel gecmisi okuyabilir, degistiremez.
Aksiyonlarin yani sira **kullanici detayinin goruntulenmesi ve mesaj
icerigi okunmasi da** kaydedilir (kisisel veriye erisim izi). Liste
ekranlarinda gezinme kaydedilmez, aksi halde iz gurultuye bogulur.

### Karar 62 - Mesaj sikayeti KALIYOR ve duzgun uygulaniyor

Onceden alinmis karar 3 mesaj sikayetini tamamen kaldiriyordu ve
gerekcelerinden biri "moderatorun ozel mesaj okuma yolunu hic
acmamak"ti. Kullanici o yolu bilerek actigi icin (karar 63) gerekce
dustu, ve kaldirmak artik zarar veriyor: sohbet ekranindan gelen bir
sikayet `hedef_tur = 'kullanici'` olsaydi moderator o sikayetin
mesajlarla ilgili oldugunu bile bilemezdi, elinde yalnizca "bu kisiden
sikayetci" bilgisi olurdu.

Yani mesaj sikayeti duruyor, ama bugunku iki kusuru da gideriliyor:

1. `sikayetler` tablosunun CHECK kisiti `'mesaj'` turunu tanimiyor, bu
   yuzden insert `23514` ile patliyor. Bugun bir mesaj sikayeti
   **gonderilemiyor**. Kisit genisletilir.
2. `hedef_id`'ye mesaj id'si degil **konusma** id'si yaziliyor. Artik
   gercek mesaj id'si yazilir; boylece moderator dogrudan o mesaja
   gider.

Sikayet edenin o mesajin konusmasinda gercekten uye oldugu sunucuda
dogrulanir, ve kendi mesajini sikayet etmesi reddedilir.

### Karar 63 - Moderator konusma gecmisini okuyabilir; erisim izli ve gerekceli

Kullanicinin karari: "Mesajlarla alakali bir sikayet alirsam mesajlari
gormem gerek, her seye tam ulasilir olmam gerek." Panelde `konusmalar`
ve `mesajlar` icerigini okuyan RPC'ler var.

Erisim **kisitlanmiyor**, ama iki kosula baglaniyor. Ikisi de erisimi
zorlastirmak icin degil, erisimi savunulabilir kilmak icin:

- **Her icerik okumasi denetim izine dusuyor**, hangi konusma ve ne
  zaman. Gerekce alani (`p_gerekce`) zorunlu ve ize yaziliyor. Tek
  operatorlu bir sistemde bu bir ic kontrol degil, disariya karsi
  kanittir: bir gun "moderator mesajlarimi neden okudu" sorusu gelirse
  cevabin kaydi var.
- **Uygulamanin gizlilik metnine acik madde ekleniyor:** kotuye
  kullanim incelemesi sirasinda moderasyonun mesajlari okuyabilecegi
  yazili olarak bildirilir. KVKK ve GDPR acisindan gizli tutulan bir
  okuma yetkisi ile bildirilmis bir okuma yetkisi arasindaki fark
  budur; magaza incelemesi de ayni maddeyi ariyor. Bu madde bir
  "guzel olur" degil, **isin parcasi** (asagida "Gizlilik metni
  yukumlulugu").

Metadata (kimin kimle konustugu, mesaj sayisi, son mesaj zamani) ile
icerik ayri tutulur: metadata kullanici detayinda gelir ve zaten oradaki
iz kaydina dahildir, icerik ayri bir cagri ve ayri bir iz satiridir.

### Karar 75 - Mesaj icerigine erisim iki kademeli: dar varsayilan, genis erisim ayri eylem

Kullanicinin 2026-08-23'te onayladigi duzeltme. Karar 63 erisimi
acti, ama kapsami acik birakti: kullanici detayindan herhangi bir
konusma, ortada sikayet olmasa bile, tek gerekce alaniyla acilabiliyordu.
KVKK m.4'un olcululuk ilkesi tam buna bakar - erisim amacla bagli ve
sinirli olmali. Yetki KESILMIYOR; varsayilan daraliyor ve genis erisim
bilincli bir eyleme donusuyor.

**Kademe 1 - sikayet baglami (varsayilan).** Bir mesaj sikayetinden
acilir. Sikayet edilen mesaj, oncesindeki 20 ve sonrasindaki 20 mesajla
birlikte gosterilir. Baglam sunucuda hesaplanir; panel bir pencere
genisligi soyleyemez. Iz turu: `mesaj_baglami`.

**Kademe 2 - tam konusma (genis).** Konusmanin tamami acilir. Uc ek
kosul: (a) ayri bir gerekce girilir - kademe 1'in gerekcesi devralinmaz,
(b) ayri bir onay adimi gecilir ("bu kisinin butun konusmasini
aciyorsun"), (c) denetim izine ayri bir tur olarak yazilir:
`konusma_tam`. Kullanici detayindaki bir konusmayi acmak DAIMA kademe
2'dir, cunku ortada bir sikayet baglami yoktur.

Kademe 2'yi kaldirmak dusunulmedi: bir tacizcinin butun konusmasini
gormek gercek bir moderasyon ihtiyacidir. Amac onu zorlastirmak degil,
**kazara ve aliskanliktan** yapilmasini engellemek ve izde digerinden
ayirt edilebilir kilmak.

### Karar 76 - Sikayet formunda baglam bildirimi

Bir mesaji sikayet eden kisi, gonderim ekraninda su bilgiyi gorur:
sikayet edilen mesajin cevresindeki mesajlarin incelemeye acilacagi.
Gerekce: kademe 1 baglami sikayet edenin kendi konusmasindan da
mesaj tasir; bunun bildirilmemis olmasi, bildirilmis bir erisimi
bildirilmemis hale getirir (karar 63'un kendi mantigi). Ayrica bu,
kademe 1'i hukuki olarak en saglam zemine oturtur: veriyi incelemeye
acan hareketi kisinin kendisi baslatir.

Uygulama: sikayet ekraninda tek satirlik bir aciklama. Ayri bir onay
kutusu YOK - sikayeti gondermek zaten iradi bir eylemdir, ek surtunme
sikayet etmeyi caydirir ve bu istenmez.

### Karar 64 - Kullanici detayi gercekten HER SEYI gosterir

"Her seye hakim olmam gerek" gereginin somut karsiligi. Kullanici
detayi ekrani su ana kadar sayilanlara ek olarak sunlari da gosterir:
engelledigi ve onu engelleyen kullanicilar, gonderdigi/aldigi takip ve
sohbet istekleri (durumlariyla), gunluk istek sayaci
(`istek_gunlugu`, spam incelemesi icin), konusma listesi (metadata),
ve kayitli bildirim cihazi sayisi (jetonun kendisi degil, yalnizca
sayi - jeton bir kimlik bilgisidir ve gosterilmesinin moderasyon
degeri yoktur).

## Mimari

```
panel/ (Vite + React, sirsiz, anon anahtar)
  |
  |  moderator hesabiyla giris (telefon + parola + TOTP -> aal2)
  v
PostgREST  ->  public.moderasyon_* RPC'leri (security definer)
                 |
                 +-- her cagrinin ilk satiri: moderasyon.yetkili_mi_zorla()
                 |      moderatorler tablosunda satir VAR MI
                 |      ve auth.jwt()->>'aal' = 'aal2' MI
                 |
                 +-- okuma: sikayetler, profiller, check_inler,
                 |          hesap_durumlari, engellemeler, takipler,
                 |          sohbet_istekleri, istek_gunlugu,
                 |          konusmalar, mesajlar (karar 63)
                 +-- yazma: hesap_durumlari, check_inler.moderasyon_gizli,
                 |          sikayetler.durum / moderator_notu
                 |          (mesajlara ASLA yazmaz - salt-okunur)
                 +-- her yazma, kullanici detayi okumasi ve
                        mesaj icerigi okumasi:
                        moderasyon_kayitlari'na bir satir
```

Uygulama tarafinda tek yeni kavram var: **hesap aktif mi**. Tek bir
yardimci fonksiyon (`moderasyon.hesap_aktif_mi`) mevcut yazma kapilarina
ve gorunurluk yollarina ekleniyor. Yeni bir katman kurulmuyor.

## Sema degisiklikleri

### Yeni sema ve tablolar

`moderasyon` adinda ozel bir sema (yardimcilar icin; `bag` ve `gizli`
semalariyla ayni kalip: `usage` yalnizca `authenticated` rolunde,
PostgREST bu semayi sunmaz).

```sql
public.moderatorler (
  kullanici_id uuid primary key references auth.users(id) on delete cascade,
  rol          text not null default 'moderator'
                 check (rol in ('moderator', 'yonetici')),
  eklendi      timestamptz not null default now(),
  ekleyen_id   uuid references auth.users(id)
)
```

RLS acik, hicbir politika yok (yani PostgREST uzerinden hicbir rol
okuyamaz). Yalnizca `security definer` yardimcilar gorur. `rol` sutunu
bugun kullanilmiyor; cok-moderatorlu modelin sema degisikligi
gerektirmemesi icin bastan duruyor (onceden alinmis karar 1).

```sql
public.hesap_durumlari (
  kullanici_id uuid primary key references auth.users(id) on delete cascade,
  durum        text not null check (durum in ('askida', 'yasakli')),
  aski_bitisi  timestamptz,
  gerekce      text not null,
  moderator_id uuid not null references auth.users(id),
  guncellendi  timestamptz not null default now(),
  constraint hesap_durumlari_sure check (
    (durum = 'askida'  and aski_bitisi is not null) or
    (durum = 'yasakli' and aski_bitisi is null)
  )
)
```

**Satirin yoklugu aktif demektir.** Askiyi kaldirmak satiri silmektir;
gecmis denetim izinde durur. RLS: kullanici yalnizca kendi satirini
`select` edebilir (uygulama "hesabin askida" ekranini durustce
gosterebilsin diye). `insert` / `update` / `delete` hicbir role
verilmez; tek yazma yolu moderator RPC'leridir.

Suresi dolmus askilar semantik olarak zaten aktiftir
(`hesap_aktif_mi` hesaplar, saklamaz). Panel listesi temiz kalsin diye
gunde bir calisan bir `pg_cron` isi suresi gecmis `askida` satirlarini
siler. Bu is davranissal degil, kozmetiktir.

```sql
public.moderasyon_kayitlari (
  id           uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references auth.users(id),
  eylem        text not null,
  hedef_tur    text not null check (hedef_tur in
                 ('kullanici', 'check_in', 'sikayet', 'konusma')),
  hedef_id     uuid not null,
  ayrinti      jsonb,
  olusturuldu  timestamptz not null default now()
)
```

Ekleme-only (karar 61). `ayrinti` eski/yeni durumu, sureyi ve gerekceyi
tasir. Indeksler: `(hedef_tur, hedef_id)` ve `(olusturuldu desc)`.

### Mevcut tablolara eklenenler

```sql
alter table public.sikayetler
  add column karar_veren_id  uuid references auth.users(id),
  add column karar_zamani    timestamptz,
  add column moderator_notu  text;

-- Karar 62: 'mesaj' turu tabloda da taninir. Bugun yalnizca RPC
-- taniyor, tablo tanimiyor; insert 23514 ile patliyor.
alter table public.sikayetler
  drop constraint sikayetler_hedef_tur_check,
  add  constraint sikayetler_hedef_tur_check
    check (hedef_tur in ('kullanici', 'check_in', 'mesaj'));

alter table public.check_inler
  add column moderasyon_gizli boolean not null default false;
```

Kisitin gercek adi migrasyon yazilirken `pg_constraint`'ten
dogrulanir; `create table` govdesinde adsiz tanimlandigi icin
Postgres'in urettigi ad kullanilir.

`check_inler.moderasyon_gizli` icin sutun bazli `grant` **verilmez**;
`20260820052249_check_inler_sutun_yetkileri.sql` zaten `authenticated`
rolunden butun `update` yetkisini geri almisti, o durum korunur.

## Yetki kapisi

```sql
create function moderasyon.yetkili_mi() returns boolean
  language sql stable security definer as ...
    select auth.uid() is not null
       and (auth.jwt() ->> 'aal') = 'aal2'
       and exists (select 1 from public.moderatorler m
                    where m.kullanici_id = auth.uid());

create function moderasyon.yetkili_mi_zorla() returns void ...
    -- yetkili degilse: raise exception 'Yetkisiz'
```

Her moderator RPC'sinin **ilk** ifadesi `perform
moderasyon.yetkili_mi_zorla();` olur. Ayrica her moderator RPC'si icin
`revoke execute ... from public, anon` uygulanir ve `grant execute ...
to authenticated` verilir; asil kapi fonksiyonun icindedir, cunku
moderator uyeligi bir rol degil satir duzeyinde bir gercektir.

Panelin acilista sordugu tek istisna: `public.moderator_muyum()`, ayni
kosullari degerlendirip `boolean` doner ve hata firlatmaz.

## Hesap aktifligi yardimcisi

Askiya almanin tek kaynagi. `stable` ve `security definer` olmasi sart:
`hesap_durumlari`'nin RLS'ini atlamasi gerekir (kullanici yalnizca kendi
satirini gorebiliyor, oysa fonksiyon baskalarininkini de sormali) ve
RLS politikalari icinde cagrilacagi icin planlayicinin sonucu satir
basina yeniden hesaplamamasi gerekir.

```sql
create function moderasyon.hesap_aktif_mi(p_kullanici_id uuid)
  returns boolean language sql stable security definer as ...
    select not exists (
      select 1 from public.hesap_durumlari d
       where d.kullanici_id = p_kullanici_id
         and (d.durum = 'yasakli' or d.aski_bitisi > now())
    );
```

`p_kullanici_id` null ise `true` doner (satir yok demektir); cagiran
taraflar zaten kendi `auth.uid() is null` kontrolunu once yapiyor.
Suresi dolmus `askida` satiri otomatik olarak aktif sayilir, ayrica bir
is calismasi gerekmez.

Ayni fonksiyon `gizli.engelli_mi` ile ayni yerlerde ve ayni kalipta
kullanilir; performans profili de aynidir (birincil anahtar uzerinden
tek satirlik arama).

## Askiya almanin zorlandigi noktalar

Bu listenin **tamami** uygulanmadan is bitmis sayilmaz. Eksik kalan her
madde panelin yalan soylemesi demektir ("askiya aldim" der, kullanici
calismaya devam eder).

**Yazma kapilari - askidaki kullanici yapamaz:**

| RPC / politika | Neden |
|---|---|
| `public.check_in_yap` | Yeni canli varlik uretemez |
| `public.mekan_ekle` | Kalici kayit uretemez |
| `public.kullanici_adi_degistir` | Kimlik degistirip yasaktan kacamaz |
| `bag.istek_on_kontrol` | Takip ve sohbet istegi gonderemez; askidaki birine de istek gitmez (iki taraf da kontrol edilir) |
| `public.takip_istegini_yanitla`, `public.sohbet_istegini_yanitla` | Yeni bag kuramaz |
| `bag.yazabilir_mi` | Mesaj gonderemez; askidaki birine de mesaj gitmez (iki taraf) |
| `profiller` update politikasi | Profil metnini ve fotograflarini degistiremez |
| Storage `profil-fotograflari` insert politikasi | Yeni fotograf yukleyemez |

**Bilerek serbest birakilanlar:** `check_inden_ayril` (mevcut varligi
azaltir), `ani_gorunurlugunu_ayarla` (yalnizca daraltabilir),
`takibi_birak`, `engelle` / `engeli_kaldir`, `sikayet_gonder`. Askiya
alinmis olmak kendini korumayi engellememeli.

**Gorunurluk - askidaki kullanici baskalarina gorunmez:**

| Yol | Degisiklik |
|---|---|
| `check_inler` select politikasi | `moderasyon.hesap_aktif_mi(kullanici_id)` kosulu eklenir |
| `public.kisi_ara` | Askidaki hedefler sonuctan cikarilir; askidaki cagiran hic sonuc alamaz |
| `public.baskasinin_profili` | Hedef askidaysa satir donmez |
| `public.bag_kisileri` | Askidakiler listeden cikarilir |
| `public.yakin_mekanlar_yogunluk` | Askidakilerin check-in'leri sayilmaz |

**Bilerek degistirilmeyen:** `public.konusmalarim` ve
`public.mesajlari_getir`. Karsi taraf askiya alinsa bile gecmis konusma
**okunabilir** kalir; yazma zaten `bag.yazabilir_mi` ile kapanmistir.
Faz 3b'nin "bag koparsa konusma salt-okunur olur, gecmis silinmez"
kuralinin aynisi.

**Istemci tarafi (UX, kural degil):** `lib/oturum.tsx` oturum acilirken
`hesap_durumlari` icindeki kendi satirini okur; varsa uygulama yerine
sebebi ve bitis tarihini gosteren bir ekran cikar ve cikis dugmesi
sunar. Bu ekran atlansa bile veritabani kapilari yerinde durur.

## Icerik gizleme

`check_inler.moderasyon_gizli = true` olan satir:

- `check_inler` select politikasinin **en disindaki** kosulu olarak
  elenir, yani sahibi dahil kimse goremez (karar 60);
- `security definer` ile `check_inler` okuyan her fonksiyondan da
  elenir. Bugunku okuyucular: `public.baskasinin_profili`,
  `public.yakin_mekanlar_yogunluk`, `gizli.ayni_mekanda_canli_mi`. Plan
  bu listeyi uygularken yeniden dogrular; RLS'i atlayan her okuyucu
  filtreyi ayrica tasimak zorundadir.

Fotograf dosyasi Storage'da yerinde kalir (URL'i bilen erisebilir).
Bugunku Storage okuma politikalari zaten `to authenticated` ve engelleme
kontrollu; gizlenen bir ani icin fotografin da kapatilmasi `[SONRA]`
diliminde kalici silme isiyle birlikte gelir.

## Mesaj sikayetinin duzeltilmesi (karar 62)

Bugun iki ayri sey bozuk; ikisi de duzeltiliyor, ozellik kaldirilmiyor.

1. `sikayet_gonder` `'mesaj'` turunu kabul ediyor ama `sikayetler`
   tablosunun CHECK kisiti yalnizca `('kullanici','check_in')` tanidigi
   icin insert `23514` ile patliyor. Bugun bir mesaj sikayeti
   **gonderilemiyor**.
2. `hedef_id`'ye mesaj id'si degil **konusma** id'si yaziliyor
   (`sohbet/[kullaniciId].tsx:170-171`); moderator "hangi mesaj"
   sorusunu cevaplayamiyor.

Yapilacaklar:

- Migrasyon: tablonun CHECK kisiti `'mesaj'` turunu de tanir (yukarida
  "Mevcut tablolara eklenenler").
- `sikayet_gonder`, `p_hedef_tur = 'mesaj'` icin iki dogrulama daha
  yapar: sikayet eden o mesajin konusmasinda **uye olmali**, ve
  **kendi mesajini** sikayet edememeli. Ikisi de `security definer`
  govdesinde, cunku `mesajlar` RLS'i burada atlaniyor. Uyelik
  kontrolu, var olmayan ya da baskasina ait bir mesaj id'siyle sahte
  sikayet uretilmesini de kapatir.
- Sohbet ekrani sikayeti **mesaj basina** acar: bir mesaja uzun basinca
  "Bu mesaji sikayet et" secenegi cikar ve gercek `mesaj.id` gecirilir.
  Konusma henuz yokken (hic mesajlasilmamis) davranis degismez:
  `hedefTur='kullanici'`.
- `mobil/lib/sikayet.ts`: `SikayetHedefTuru` tipi **degismez**, `'mesaj'`
  gecerli kalir.
- Faz 3b'nin "mesaj turu kabul ediliyor" testi **gercege cevrilir**:
  bugun bos `sebep` ile cagirdigi icin insert yoluna hic girmiyor ve
  CHECK kisitini hic tetiklemiyordu - kusuru bu yuzden kacirdi. Yeni
  test gecerli bir `sebep` ve gercek bir mesaj id'siyle cagirir ve
  satirin **yazildigini** dogrular.
- `docs/faz3b-takip-isleri.md` madde 1b bu isle kapaniyor.

## Konusma erisimi (karar 63)

Panel iki adimda okur; metadata ile icerik bilerek ayri:

- **Metadata** kullanici detayinda gelir: kullanicinin konusmalari,
  karsi taraf, mesaj sayisi, ilk ve son mesaj zamani. Icerik yok.
  Kullanici detayi zaten ize dusuyor, ayri bir kayit uretmez.
- **Icerik** ayri bir cagridir (`moderasyon_konusma_mesajlari`),
  `p_gerekce` zorunludur ve her cagri denetim izine bir
  `konusma_okundu` satiri yazar.

Bir mesaj sikayeti acildiginda panel sikayet edilen mesaji ve
**cevresindeki baglami** (oncesi ve sonrasi 20 mesaj) tek cagrida
getirir; moderator butun konusmayi taramak zorunda kalmaz. Tamamini
gormek isterse ayni RPC sayfalama ile cagrilir, ve o da ize duser.

Okuma **salt-okunurdur**: panel mesaj silemez, duzenleyemez, gizleyemez.
Sohbetteki kotuye kullanimin karsiligi hesap duzeyinde islemdir (askiya
alma / yasaklama). Mesaj silme `[SONRA]` listesinde bile yok, cunku
karsi tarafin gecmisini de degistirir ve kanit niteligini yok eder.

## Gizlilik metni yukumlulugu

Karar 63 bir sey daha zorunlu kiliyor ve bu **isin parcasidir**,
ertelenen bir sus degil: uygulamanin gizlilik metnine, moderasyonun
kotuye kullanim incelemesi sirasinda mesaj icerigini okuyabilecegi acik
bir madde olarak yazilir.

Bugun uygulamada gizlilik metni ekrani **yok**. Ilk dilim su iki seyi
getirir: metnin kendisi (`docs/gizlilik-metni.md`, kaynak) ve
uygulamada okunabilecegi bir ekran (ayarlardan erisilir). Kayit
ekranindaki riza akisina baglanmasi ve magaza listelemesi icin URL'e
konmasi ayri bir is; bu spec metni ve ekrani ustlenir.

Gerekce: konum tabanli bir tanisma uygulamasinda mesaj okuma yetkisinin
bildirilmemis olmasi KVKK ve GDPR acisindan savunulamaz, ve magaza
incelemesi de bu maddeyi arar. Yetkinin kendisi mesru; bildirilmemis
olmasi degil.

## Hesap haklari: dondurma ve silme

Kullanicinin karari (2026-08-22): "Kullaniciya istedigi zaman hesabini
silme hakki koymaliyiz ve dondurma hakki koymaliyiz." Ikisi de bu isin
kapsamina girdi; silme, uyum listesinde **BLOKE** olan KVKK m.11
maddesini de kapatiyor.

Ikisi birlikte tasarlaniyor cunku birbirinin varligina dayaniyorlar:
dondurma var oldugu icin silme geri alinamaz olabiliyor.

### Karar 66 - Dondurma, moderasyon askisiyla ayni mekanizmayi kullanir

Dondurulmus hesap, askiya alinmis hesapla **ayni sekilde** davranir:
kimseye gorunmez, hicbir sey yazamaz, canli check-in'i sona erer,
bildirim almaz. Fark yalnizca kimin koydugu ve kimin kaldirabildigidir.

Bu yuzden ayri bir mekanizma kurulmuyor: `hesap_durumlari` tablosuna
ucuncu bir deger ekleniyor ve `moderasyon.hesap_aktif_mi` oldugu gibi
kaliyor. Yani "askiya almanin zorlandigi noktalar" tablosundaki butun
kapilar dondurma icin de **kendiliginden** calisiyor. Ayri bir yol
acmak, o listeyi ikinci kez ve eksik uygulamak demekti.

```sql
-- durum artik uc deger aliyor
check (durum in ('askida', 'yasakli', 'dondurulmus'))
-- moderator_id, dondurma kullanicinin kendi karari oldugu icin null olabilir
alter table public.hesap_durumlari alter column moderator_id drop not null;
constraint hesap_durumlari_kaynak check (
  (durum = 'dondurulmus' and moderator_id is null) or
  (durum in ('askida', 'yasakli') and moderator_id is not null)
)
```

Iki RPC: `hesabimi_dondur(p_gerekce)` ve `hesabimi_geri_ac()`.

**Geri acilma otomatiktir: kullanici tekrar giris yapinca hesap yeniden
aktif olur** (kullanicinin karari, 2026-08-22). Ayri bir dugmeye basmak
gerekmez. Akis:

- `hesabimi_dondur` cagrildiktan hemen sonra **oturum kapatilir**. Aksi
  halde kullanici dondurulmus ama girisli bir ara durumda kalirdi.
- `lib/oturum.tsx` her oturum kurulusunda `hesabimi_geri_ac()` cagirir.
  Satir `dondurulmus` ise silinir ve kullanici dogrudan uygulamaya
  girer; bir kerelik "Hesabin yeniden aktif" bilgisi gosterilir.
- Satir `askida` ya da `yasakli` ise RPC hicbir sey yapmaz ve askidaki
  hesap ekrani cikar.

Yani dondurulmus kullanici icin ayri bir ekran **yok**; dondurma
yalnizca "giris yapmadigin surece gorunmezsin" demek. Askidaki hesap
ekrani sadece moderasyon kararlari icin kaliyor.

Kritik kisit: **`hesabimi_geri_ac` yalnizca `durum = 'dondurulmus'`
satirini siler.** Aksi halde askiya alinmis bir kullanici giris yapip
kendi askisini kaldirabilirdi - ve bu otomatik cagri yuzunden farkinda
bile olmadan olurdu. Bu kosul, otomatik geri acilmayi guvenli kilan tek
seydir; `test:gorunurluk` icinde kendi senaryosu olur. Ayni sekilde
`hesabimi_dondur`, satir zaten varsa basarisiz olur - boylece askidaki
biri askisini dondurmaya cevirip sureyi sifirlayamaz.

Ters yon serbest: moderator dondurulmus bir hesabi askiya alabilir
(satir uzerine yazilir). O aski kaldirildiginda hesap **tamamen aktif**
olur, eski dondurma hatirlanmaz. Bu bilincli bir sadelestirme; alternatifi
iki bagimsiz durum ekseni tasimakti ve moderasyon kararinin ustune
kullanici tercihi bindirmek karisikliktan baska bir sey uretmiyor.

Arayuz: dondurma girisi ayarlar ekranindadir ve yaninda "Verilerin
silinmez; tekrar giris yaptiginda hesabin kendiliginden aktif olur"
aciklamasi durur.

**Tek istisna - canli check-in geri gelmez (kullanici onayladi,
2026-08-22):** dondurma anindaki canli check-in aniya cevrilir; hesap
geri acildiginda o mekanda yeniden canli gorunmez, gecmiste bir ani
olarak durur. Gerekce: canli varlik zaten dort saatlik bir kavram ve
iki hafta sonra donen birinin hala "su an burada" gorunmesi yanlis
olurdu. Verinin kendisi silinmiyor; yalnizca canliligi sona eriyor.

Ikinci bir sonuc, kullaniciya anlatilmali: dondurulmusken karsi taraf
ona MESAJ YAZAMAZ (`bag.yazabilir_mi` iki tarafi da kontrol ediyor).
Yani donen kullanici birikmis okunmamis mesaj bulmaz; o aralikta
yazmak isteyen kisi yazamamistir. Konusma gecmisi durur.

### Karar 67 - Silme kalicidir, geri alinamaz; bekleme suresi yok

Cogu uygulama silmeye 30 gunluk geri alma penceresi koyar. Burada
koymuyoruz, cunku o pencerenin karsiladigi ihtiyaci (kararsizlik,
"bir sure uzaklasmak istiyorum") **dondurma** zaten karsiliyor. Silme
istegini geciktirmek, KVKK m.11 anlaminda da tercih edilen davranis
degil: talep gecikmeden sonuclandirilmali.

Yanlislikla silmeye karsi koruma sure degil **parola yeniden
dogrulamasidir** (kullanicinin karari, 2026-08-22). Kullanici adi
onayi KALDIRILDI: kullanici zaten kendi hesabinin icinde, ve kullanici
adi herkese acik bir bilgi oldugu icin (`baskasinin_profili` ve
`kisi_ara` donduruyor) gercek bir kapi degildi - yalnizca surtunmeydi.

**Parola SUNUCUDA dogrulanir, istemcide degil.** `hesap-sil` Edge
Function govdeden gelen parolayi anon istemciyle `signInWithPassword`
cagirarak sinar; basarisizsa silme yapilmaz. Boylece istemci
atlanamaz: calinmis bir oturum jetonu tek basina hesabi silmeye
yetmez, parola da gerekir. Parola hicbir log satirina yazilmaz.

Onay ekrani dondurmayi acikca alternatif olarak sunar.

Islemi bir Edge Function yurutur (`hesap-sil`), cunku `auth.users`
satirini silmek Admin API gerektirir ve bu yalnizca sunucu tarafinda
olabilir. Karar 55'in "service-role yok" kurali **panelin paketi**
icindir; sunucu tarafinda calisan bir fonksiyon icin gecerli degildir -
`bildirim-gonder` fonksiyonu da ayni sekilde service-role kullaniyor.

Sira: cagiranin JWT'si dogrulanir (kendi hesabindan baskasini
silemez) -> anonimlestirilecek kayitlar anonimlestirilir -> Storage'daki
profil ve check-in fotograflari silinir -> `auth.admin.deleteUser`
cagrilir ve cascade kalani goturur.

**Geri donus yoktur; kullanici yeniden gelmek isterse sifirdan hesap
acar** (kullanicinin karari, 2026-08-22). `auth.users` satiri silindigi
icin telefon numarasi serbest kalir, yani ayni numarayla yeniden kayit
olunabilir - ama bu tamamen yeni bir hesaptir: eski profil, anilar,
baglar ve konusmalar geri gelmez. Onay ekraninda bu acikca yazar, ve
dondurmayla farki tek cumlede gosterilir:

- **Dondur:** verilerin durur, tekrar giris yapinca hesabin aktif olur.
- **Sil:** geri donusu yok, yeniden gelmek istersen sifirdan hesap
  acman gerekir.

Kullanici adi konusunda bir kisit YOK (karar 70 geri alindi): ayni
kisi yeniden kayit olurken eski kullanici adini alabilir - ama o adi
bu arada bir baskasi da almis olabilir.

### Karar 68 - Silmede ne gider, ne kalir

Bugunku yabanci anahtarlar bu karari **yanlis** veriyor: `mesajlar` ve
`sikayetler` de `on delete cascade` ile bagli, yani naif bir silme
karsi tarafin konusma gecmisini yariya indirir ve kullanicinin
BASKALARI hakkinda actigi sikayetleri yok eder. Ikisi de duzeltiliyor.

| Veri | Karar |
|---|---|
| `profiller`, `check_inler` (canli ve anilar), `takipler`, `sohbet_istekleri`, `engellemeler`, `istek_gunlugu`, `bildirim_jetonlari`, `konusma_uyeleri` | **Silinir** (mevcut cascade dogru) |
| Storage: profil ve check-in fotograflari | **Silinir** (Edge Function) |
| `mesajlar` | **Kalir, gonderen anonimlesir.** `on delete cascade` -> `set null`, `gonderen_id` nullable olur |
| `sikayetler.sikayet_eden_id` | **Kalir, sikayet eden anonimlesir.** cascade -> `set null` |
| `moderasyon_kayitlari.moderator_id` | **Kalir**, `set null` |
| `mekanlar.ekleyen_kullanici` | Kalir (zaten `set null`) |

Mesajlarin kalmasinin gerekcesi: bir konusma **iki kisinin** verisidir.
Silen tarafin mesajlarini yok etmek, karsi tarafin kendi gecmisini
okunamaz yarim bir metne cevirir ve acik bir sikayetin kanitini ortadan
kaldirir. Kisiyle bagi koparmak (anonimlestirme) KVKK'nin istedigini
karsilar; icerigin tamamini yok etmek karsi tarafin hakkina girer.
Arayuzde bu mesajlar "Silinmis kullanici" olarak gorunur.

Sikayetlerin kalmasinin gerekcesi ayni yonde: sikayet ucuncu bir kisi
hakkindadir. Tacize ugrayan biri sikayet edip sonra hesabini silerse,
sikayetin de silinmesi taciz edeni korurdu.

### Karar 69 - Silme, "her konusmanin tam iki uyesi var" invaryantini kirar

`docs/faz3b-takip-isleri.md` madde 1a bunu **kalici bir invaryant**
olarak ilan ediyor ve `mesajlari_getir`'in `limit 1` ile "diger uye"yi
bulmasini buna dayandiriyor. Karar 54 (grup sohbeti hic olmayacak) o
invaryanti dogruluyordu, ama hesap silme onu bambaska bir yerden kiriyor:
`konusma_uyeleri.kullanici_id` birincil anahtarin parcasi oldugu icin
null olamaz, dolayisiyla uyelik satiri silinmek zorunda ve konusma
**tek uyeli** kalir.

Bu, tam olarak o belgenin uyardigi turden bir tuzak: sonraki isi yanlis
yone sokacak bir "kalici dogru". Uc okuyucu buna gore duzeltilir:

- `mesajlari_getir`: karsi uye bulunamazsa engelleme kontrolu atlanir
  (kontrol edilecek kimse yok) ve konusma salt-okunur donulur. Bugun
  `v_diger_id` null kaldiginda davranis tanimsiz.
- `konusmalarim`: karsi taraf yerine "Silinmis kullanici" doner, konusma
  listede kalir.
- `bag.yazabilir_mi`: karsi uye yoksa **false**. Silinmis bir hesaba
  mesaj yazilamaz.

Madde 1a bu spec ile birlikte guncellenir; invaryant artik "en fazla iki
uye, silme sonrasi bir uye olabilir" seklindedir.

### Karar 70 - GERI ALINDI: kullanici adi rezervasyonu YOK

Bu karar once "silinen kullanici adi 90 gun rezerve edilir" diyordu,
sonra kullanicinin istegiyle 24 saate indirildi, sonra **tamamen
kaldirildi** (kullanicinin karari, 2026-08-22).

Sonucu acikca yazilsin: **silinen bir kullanici adi ANINDA serbest
kalir.** Bir baskasi o adi hemen alabilir ve silinen kisinin yerine
gecebilir. Taklit korumasi yoktur.

Kaldirmayi destekleyen bir bulgu: ozellik uygulanip incelendiginde,
rezervasyonun hicbir YAZMA noktasinda zorlanmadigi ortaya cikti.
`kullanici_adi_musait_mi` yalnizca arayuzun gosterge sorgusuydu; adin
fiilen alindigi iki yol (`kullanici_adi_degistir` RPC'si ve kayit
sirasindaki `profiller` insert'i) rezervasyon tablosuna hic bakmiyordu.
Yani rezerve bir ad, dogrudan RPC cagrisiyla ya da kayit akisiyla
alinabiliyordu. Ozelligi tam olarak zorlayici hale getirmek iki yazma
yolunu daha degistirmeyi gerektirecekti; kullanici bunun yerine
ozelligin tamamini kaldirmayi secti.

Ilgili tablo, RPC ve budama isi veritabanindan dusuruldu;
`kullanici_adi_musait_mi` rezervasyon oncesi haline donduruldu.

## Saklama sureleri (karar 65)

Bu is uc yeni kisisel veri deposu getiriyor, dolayisiyla "gerekli oldugu
sure kadar saklanir" ilkesinin karsiligi bu spec'te yaziliyor - ayri bir
uyum isine ertelenmiyor. Silme, `istek_gunlugu` budamasiyla ayni kalipta
gunluk bir `pg_cron` isiyle yapilir.

| Veri | Sure | Gerekce |
|---|---|---|
| `moderasyon_kayitlari` | 2 yil | Erisim izinin kendisi bir koruma araci; bir itiraz ya da inceleme geldiginde geriye donuk cevap verebilmek icin makul bir pencere. Daha uzun saklamanin mesru bir gerekcesi yok |
| Karara baglanmis `sikayetler` | Karardan 1 yil sonra | Tekrar eden suclu tespiti icin gecmis gerekiyor, ama suresiz degil. Karara baglanmamis sikayet silinmez |
| Suresi dolmus `hesap_durumlari` satirlari | 90 gun | Askinin bittigi bilgisi kisa sure daha panelde gorunsun; kalici kayit zaten denetim izinde |

Ucu de **oneridir** ve `docs/kvkk-uyum-listesi.md` madde 4 ile birlikte
degerlendirilmelidir; sureler degisirse tek degisen `pg_cron` isinin
araligidir.

Hesap silme (KVKK m.11) artik `[SONRA]` degil: kullanicinin
2026-08-22 karariyla kapsama girdi ve Plan 1'de yer aliyor. Uyum
listesindeki iki BLOKE maddeden ikincisi de boylece bu isin icinde
kapaniyor.

## Moderator RPC'leri (ilk dilim)

Hepsi `public` semasinda, `security definer`, ilk satirda yetki kapisi.

| RPC | Isi |
|---|---|
| `moderator_muyum()` | Panel acilis kontrolu, hata firlatmaz |
| `moderasyon_sikayetleri_listele(p_durum, p_hedef_tur, p_baslangic, p_bitis, p_sirala, p_limit, p_ofset)` | Baglamli liste: sikayet edenin kullanici adi, hedef turu/adi, sebep, durum, tarih, hedefin toplam sikayet sayisi |
| `moderasyon_sikayet_detayi(p_sikayet_id)` | Sikayet + hedefin tam icerigi (check-in ise not, fotograf yolu, mekan, zaman; kullanici ise profil; mesaj ise mesajin kendisi ve hangi konusmada oldugu) |
| `moderasyon_hedef_gecmisi(p_hedef_tur, p_hedef_id)` | Ayni hedefe ait butun sikayetler ve verilmis kararlar |
| `moderasyon_sikayeti_karara_bagla(p_sikayet_id, p_durum, p_not)` | `durum` gunceller, `karar_veren_id` / `karar_zamani` / `moderator_notu` yazar, ize kaydeder |
| `moderasyon_kullanici_ara(p_metin, p_limit)` | Kullanici adi / ad ile arama; `aramada_gorunsun` ve engelleme **dikkate alinmaz** |
| `moderasyon_kullanici_detayi(p_kullanici_id)` | Profil, hesap durumu, check-in ve ani gecmisi (gizlenenler dahil), baglar, engelledikleri ve onu engelleyenler, takip/sohbet istekleri, gunluk istek sayaci, konusma listesi (metadata), bildirim cihazi sayisi, sikayet ozeti (karar 64). **Ize kaydedilir** (karar 61) |
| `moderasyon_konusma_mesajlari(p_konusma_id, p_gerekce, p_merkez_mesaj_id, p_limit, p_ofset)` | Konusma icerigi. `p_merkez_mesaj_id` verilirse o mesajin oncesi ve sonrasi 20 mesaj gelir (sikayet baglami). `p_gerekce` zorunlu. **Her cagri ize kaydedilir** (karar 63) |
| `moderasyon_hesabi_askiya_al(p_kullanici_id, p_bitis, p_gerekce)` | `hesap_durumlari`'na `askida` satiri yazar |
| `moderasyon_hesabi_yasakla(p_kullanici_id, p_gerekce)` | `yasakli` satiri yazar |
| `moderasyon_hesap_durumunu_kaldir(p_kullanici_id, p_gerekce)` | Satiri siler |
| `moderasyon_icerigi_gizle(p_check_in_id, p_gerekce)` | `moderasyon_gizli = true` |
| `moderasyon_gizlemeyi_kaldir(p_check_in_id, p_gerekce)` | `moderasyon_gizli = false` |
| `moderasyon_kayitlarini_listele(p_hedef_tur, p_hedef_id, p_limit, p_ofset)` | Denetim izi |

Moderatorun kendini askiya almasi ve baska bir moderatoru askiya almasi
reddedilir (`raise exception`), yoksa panel kendi kendini kilitleyebilir.

Storage: `checkin-fotograflari` ve `profil-fotograflari` bucket'larina
`moderasyon.yetkili_mi()` kosullu birer `select` politikasi eklenir ki
panel sikayet edilen fotografi gorebilsin. Service-role'e gerek
birakmayan tek yol budur.

## Panel ekranlari (ilk dilim)

1. **Giris.** Telefon + parola, ardindan TOTP kodu. `aal2` alinmadan
   hicbir sey cagrilmaz. Ilk kurulumda bir kerelik TOTP kayit akisi
   (QR + dogrulama) ayni ekranda.
2. **Sikayetler.** Filtre (durum, hedef turu, tarih araligi), siralama,
   sayfalama. Satirda hedefin toplam sikayet sayisi rozeti (tekrar eden
   suclu hemen goze carpsin).
3. **Sikayet detayi.** Sikayet edilen icerigin tam hali, hedefin sikayet
   gecmisi, karar formu (durum + moderator notu) ve dogrudan aksiyon
   dugmeleri (askiya al / yasakla / icerigi gizle). Mesaj sikayetinde
   sikayet edilen mesaj vurgulanmis halde, oncesi ve sonrasiyla
   birlikte gosterilir; acilmadan once gerekce sorulur (karar 63).
4. **Kullanicilar.** Arama ve kullanici detayi: profil, hesap durumu,
   check-in ve ani gecmisi, baglar, engellemeler, istekler ve gunluk
   sayaci, konusma listesi (metadata), sikayet ozeti (karar 64), ve
   aksiyonlar.
5. **Konusma goruntuleyici.** Kullanici detayindaki bir konusmadan ya
   da bir mesaj sikayetinden acilir. Gerekce girilmeden icerik
   yuklenmez; ekranin ustunde "bu goruntuleme kaydedildi" uyarisi
   durur. Salt-okunur, hicbir aksiyon dugmesi yok.
6. **Denetim izi.** Ters kronolojik liste, hedefe gore filtrelenebilir.
   Mesaj okumalari burada ayirt edilebilir sekilde gorunur.

Tasarim sade, veri yogun, tablo agirlikli olur. `frontend-design`
eklentisi kullanilir ama panel bir vitrin degil; okunabilirlik ve
yanlis tiklamayi zorlastirmak (yikici aksiyonlarda onay adimi) tek
olcut.

## Dogrulama

Projenin mevcut dort kosumu korunur ve genisletilir.

- **`npm run test:sema`** (gercek veritabani): moderator RPC'lerinin
  `anon`'dan geri alinmis oldugu; `moderatorler` ve
  `moderasyon_kayitlari` tablolarinin PostgREST uzerinden okunamadigi;
  `moderasyon_kayitlari` uzerinde `update` / `delete` yetkisinin hicbir
  rolde olmadigi; `hesap_durumlari` uzerinde yalnizca kendi satirini
  `select` yetkisi bulundugu; `check_inler` uzerinde sutun bazli
  `update` yetkisi olmadiginin korundugu.
- **`npm run test:gorunurluk`** (gercek veritabani): askiya almanin
  yukaridaki tablodaki **her** satirini ayri ayri dogrulayan senaryolar.
  Askiya alma islemi testte service-role ile dogrudan
  `hesap_durumlari`'na yazilarak kurulur (harness'in mevcut yontemi),
  boylece TOTP gerektirmez. Yetki kapisi **negatif** yonden dogrulanir:
  moderator olmayan ve `aal1` bir kullanici her moderator RPC'sinden
  `Yetkisiz` alir. Pozitif yon (gercek `aal2` ile calisma) elle
  dogrulanir.
  Ayrica `sikayet_gonder`'in `'mesaj'` turunu **gercekten yazdigi**
  (bugun `23514` ile patliyor), konusmada uye olmayanin ve kendi
  mesajini sikayet edenin reddedildigi.
- **`npx jest --runInBand`**: `lib/sikayet.ts`, mesaj basina sikayet
  akisi (sohbet ekrani), askidaki hesap ekraninin gosterilmesi,
  gizlilik metni ekrani.
- **`npx tsc --noEmit`**: bes onceden var olan hata disinda temiz. Panel
  ayri bir `tsconfig` tasir ve kendi tip kontrolunu ayrica kosar.

**Elle dogrulama bu is icin ertelenmez.** Faz 2a'dan beri devreden "iki
hesapla tarayicida gezinme" borcunun sebebi ayni anda iki insanin
gerekmesiydi; panel tek operatorlu, tek tarayicili ve kullanicinin kendi
makinesinde. Ilk dilim su akis gozle dogrulanmadan bitmis sayilmaz:
TOTP ile giris -> uygulamada bir mesaji sikayet et -> panelde o
sikayeti ac ve sikayet edilen mesaji baglamiyla gor -> gerekce girip
konusmayi ac -> hedefi askiya al -> uygulamada o hesabin yazamadigini
ve baskalarina gorunmedigini gor -> askiyi kaldir -> denetim izinde
mesaj okumasi dahil butun satirlari gor.

## Dilimler

Hesap haklari (karar 66-70) eklendikten sonra bu is tek bir plana
sigmiyor. **Iki plan halinde yurutulur** ve sira onemlidir: birincisi
ikincisinin dayandigi temeli kuruyor.

**Plan 1 - Hesap durumu temeli ve kullanici haklari** (uygulama tarafi):

- `hesap_durumlari` tablosu, `moderasyon.hesap_aktif_mi` yardimcisi ve
  **butun** zorlama noktalari (8 yazma kapisi, 5 gorunurluk yolu)
- Hesap dondurma ve otomatik geri acilma (karar 66)
- Hesap silme: Edge Function, FK duzeltmeleri, Storage temizligi,
  kullanici adi rezervasyonu YOK (karar 70 geri alindi) (karar 67, 68)
- Tek uyeli konusma duzeltmeleri (karar 69)
- Gizlilik metni ve onu gosteren ekran
- Askidaki hesap ekrani

Bu plan once geliyor, cunku (a) uyum listesindeki iki BLOKE maddeyi
kapatiyor, (b) panelin "askiya al" aksiyonu bu temel olmadan zaten
anlamsiz, (c) tamami kullanici tarafinda, yani panelden bagimsiz
dogrulanabilir.

**Plan 2 - Moderasyon paneli:**

- Moderator kimligi, TOTP, AAL2 kapisi, `moderatorler` tablosu
- Denetim izi ve saklama sureleri (karar 61, 65)
- Sikayet listesi, detay, hedef gecmisi, karara baglama
- Kullanici arama ve detayi (karar 64: engellemeler, istekler, konusma
  metadatasi dahil)
- Askiya alma / yasaklama / geri alma aksiyonlari
- Check-in / ani gizleme
- Mesaj sikayetinin duzeltilmesi (karar 62) ve mesaj basina sikayet
- Konusma goruntuleyici, gerekceli ve izli (karar 63)
- `panel/` uygulamasinin kendisi

**Sonraki dilim (bu spec kapsaminda tasarlandi, uygulanmadi):**

- Sikayet edeni degerlendirme (kotu niyetli ihbar sayaci)
- Profil alani temizleme (hakaret iceren kullanici adi / fotograf)
- Pano: canli sayilar (aktif kullanici, bugunku check-in, bekleyen
  sikayet, buyume)
- Mekan kaydi kaldirma
- Icerigin kalici silinmesi ve Storage dosyasinin temizlenmesi
- Sahibine "moderasyon tarafindan gizlendi" bildirimi
- Oturum iptali icin sunucu tarafli yardimci
- Panelin barindiriciya cikarilmasi

## Kapsam disi (hicbir dilimde yok)

- Panelden mesaj silme veya duzenleme. Okuma acik (karar 63), yazma
  degil: bir mesaji silmek karsi tarafin gecmisini de degistirir ve
  sikayetin kanitini yok eder. Sohbetteki kotuye kullanimin karsiligi
  hesap duzeyinde islemdir.
- Rol yonetimi arayuzu (onceden alinmis karar 1)
- Otomatik moderasyon, icerik siniflandirma, kural motoru
- Kullaniciya moderasyon karari icin itiraz akisi
- E-posta ile moderator bildirimi

## Riskler ve bilinen sinirlar

1. **Jeton gecikmesi.** Askiya alinan kullanicinin mevcut erisim jetonu
   suresi dolana kadar gecerlidir (karar 57). Bu sure boyunca yazamaz ve
   gorunmez; yalnizca kendi verisini okur.
2. **Zorlama noktasi kacirma.** Tasarimin en kirilgan yeri budur:
   listeye yeni bir yazma kapisi eklenip askiya alma kontrolunun
   unutulmasi. Karsi onlem, `test:gorunurluk` icinde her kapinin ayri
   bir senaryo olmasidir; yeni bir RPC eklenirse senaryo eksikligi
   kosumda degil incelemede yakalanir. Bu bir surec kontrolu, otomatik
   bir kacak kontrolu degil.
3. **TOTP kaybi.** Ikinci faktoru kaybeden moderator panele giremez.
   Kurtarma yolu Supabase panosundan (dashboard) MFA faktorunu silmek;
   bu, dashboard erisiminin panelin gercek son mercii oldugu anlamina
   gelir. Kabul ediliyor: dashboard zaten veritabaninin sahibi.
4. **Gizlenen fotograf Storage'da kalir.** URL'i onceden bilen biri
   erisebilir. `[SONRA]` diliminde kapaniyor.
5. **Panelin kendi otomatik testi zayif.** Mantik veritabaninda oldugu
   icin otomatik dogrulamanin agirligi orada; panel arayuzu elle
   dogrulaniyor. Bilincli bir denge, cunku Faz 2a'nin dersi mock'lu
   arayuz testlerinin gercek veritabani hatalarini gormedigiydi.
6. **Mesaj okuma yetkisi sistemin en genis yetkisidir** (karar 63) ve
   teknik olarak sinirlandirilmamistir: moderator herhangi bir
   konusmayi, sikayet olmasa da okuyabilir. Tek gercek koruma AAL2
   kapisi (yetkiyi bir hesaba ve bir ikinci faktore baglar) ve denetim
   izidir (okumanin gizli kalmasini engeller). Izin **ekleme-only**
   olmasi (karar 61) bu yuzden dekoratif degil, bu yetkinin
   dengeleyicisidir: moderator okudugunu silemez.
7. **Gizlilik metni gecikirse yetki bildirilmemis olur.** Metin ve
   ekran ilk dilime dahil edildi ki mesaj okuma yetkisiyle ayni anda
   yayina girsin. Ikisi ayrilirsa - once panel, sonra metin - aradaki
   surede bildirilmemis bir okuma yetkisi calisir durumda olur. Plan
   bu iki isi ayni dilimde tutmali.
