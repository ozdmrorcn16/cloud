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
- **Mesaj sikayeti tamamen kaldirilir.** Sohbet ekraninda yalnizca
  "kullaniciyi sikayet et" kalir.
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

### Karar 59 - Moderator ozel mesaj okuyamaz, hicbir dilimde

Karar 3'un (mesaj sikayetinin kaldirilmasi) dogal devami. Panelde
`mesajlar` ve `konusmalar` tablolarina bakan hicbir RPC yoktur ve
olmayacaktir. Sohbette taciz eden kullanici "kullaniciyi sikayet et"
yoluyla bildirilir ve hesap duzeyinde islem gorur. Uygulamanin gizlilik
durusuyla tutarli tek secim bu.

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
Aksiyonlarin yani sira **kullanici detayinin goruntulenmesi de**
kaydedilir (kisisel veriye erisim izi). Liste ekranlarinda gezinme
kaydedilmez, aksi halde iz gurultuye bogulur.

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
                 +-- okuma: sikayetler, profiller, check_inler, hesap_durumlari
                 +-- yazma: hesap_durumlari, check_inler.moderasyon_gizli,
                 |          sikayetler.durum / moderator_notu
                 +-- her yazma ve kullanici detayi okumasi:
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
                 ('kullanici', 'check_in', 'sikayet')),
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

alter table public.check_inler
  add column moderasyon_gizli boolean not null default false;
```

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

## Mesaj sikayetinin kaldirilmasi (karar 3)

Bugun iki ayri sey bozuk ve bu degisiklik ikisini birden kaynagindan
siliyor:

1. `sikayet_gonder` `'mesaj'` turunu kabul ediyor ama `sikayetler`
   tablosunun CHECK kisiti yalnizca `('kullanici','check_in')` tanidigi
   icin insert `23514` ile patliyor. Bugun bir mesaj sikayeti
   **gonderilemiyor**.
2. Gonderilebilseydi bile `hedef_id`'ye mesaj id'si degil **konusma**
   id'si yaziliyor; moderator "hangi mesaj" sorusunu cevaplayamazdi.

Yapilacaklar:

- Yeni migrasyon: `sikayet_gonder` govdesinden `'mesaj'` cikarilir.
  Tablonun CHECK kisitina **dokunulmaz**, zaten dogrudur.
- `mobil/src/app/sohbet/[kullaniciId].tsx`: `sikayetHedefTur` /
  `sikayetHedefId` ayrimi kalkar; her zaman `hedefTur='kullanici'`,
  `hedefId=kullaniciId`.
- `mobil/lib/sikayet.ts`: `SikayetHedefTuru` tipinden `'mesaj'` cikar.
- Faz 3b'nin "mesaj turu kabul ediliyor" testi **tersine** cevrilir:
  artik reddedilmeli. Yeni test insert yoluna gercekten girmeli
  (gecerli bir `sebep` ile), cunku eski test bos `sebep` kullandigi icin
  CHECK kisitina hic ulasmiyordu ve kusuru bu yuzden kacirdi.
- `docs/faz3b-takip-isleri.md` madde 1b kapandi diye isaretlenir.

## Moderator RPC'leri (ilk dilim)

Hepsi `public` semasinda, `security definer`, ilk satirda yetki kapisi.

| RPC | Isi |
|---|---|
| `moderator_muyum()` | Panel acilis kontrolu, hata firlatmaz |
| `moderasyon_sikayetleri_listele(p_durum, p_hedef_tur, p_baslangic, p_bitis, p_sirala, p_limit, p_ofset)` | Baglamli liste: sikayet edenin kullanici adi, hedef turu/adi, sebep, durum, tarih, hedefin toplam sikayet sayisi |
| `moderasyon_sikayet_detayi(p_sikayet_id)` | Sikayet + hedefin tam icerigi (check-in ise not, fotograf yolu, mekan, zaman; kullanici ise profil) |
| `moderasyon_hedef_gecmisi(p_hedef_tur, p_hedef_id)` | Ayni hedefe ait butun sikayetler ve verilmis kararlar |
| `moderasyon_sikayeti_karara_bagla(p_sikayet_id, p_durum, p_not)` | `durum` gunceller, `karar_veren_id` / `karar_zamani` / `moderator_notu` yazar, ize kaydeder |
| `moderasyon_kullanici_ara(p_metin, p_limit)` | Kullanici adi / ad ile arama; `aramada_gorunsun` ve engelleme **dikkate alinmaz** |
| `moderasyon_kullanici_detayi(p_kullanici_id)` | Profil, hesap durumu, check-in ve ani gecmisi (gizlenenler dahil), bag sayilari, aldigi ve gonderdigi sikayet sayilari. **Ize kaydedilir** (karar 61) |
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
   dugmeleri (askiya al / yasakla / icerigi gizle).
4. **Kullanicilar.** Arama, kullanici detayi (profil, hesap durumu,
   check-in ve ani gecmisi, bag sayilari, sikayet ozeti) ve aksiyonlar.
5. **Denetim izi.** Ters kronolojik liste, hedefe gore filtrelenebilir.

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
- **`npx jest --runInBand`**: `lib/sikayet.ts` ve sohbet ekrani
  degisikligi; askidaki hesap ekraninin gosterilmesi.
- **`npx tsc --noEmit`**: bes onceden var olan hata disinda temiz. Panel
  ayri bir `tsconfig` tasir ve kendi tip kontrolunu ayrica kosar.

**Elle dogrulama bu is icin ertelenmez.** Faz 2a'dan beri devreden "iki
hesapla tarayicida gezinme" borcunun sebebi ayni anda iki insanin
gerekmesiydi; panel tek operatorlu, tek tarayicili ve kullanicinin kendi
makinesinde. Ilk dilim su akis gozle dogrulanmadan bitmis sayilmaz:
TOTP ile giris -> sikayeti gor -> hedefi askiya al -> uygulamada o
hesabin yazamadigini ve baskalarina gorunmedigini gor -> askiyi kaldir
-> denetim izinde uc satiri gor.

## Dilimler

**Ilk dilim (bu spec'in plani):**

- Moderator kimligi, TOTP, AAL2 kapisi, `moderatorler` tablosu
- Denetim izi
- Hesap durumu kavrami ve **butun** zorlama noktalari
- Sikayet listesi, detay, hedef gecmisi, karara baglama
- Kullanici arama ve detayi
- Check-in / ani gizleme
- Mesaj sikayetinin kaldirilmasi

**Sonraki dilim (bu spec kapsaminda tasarlandi, uygulanmadi):**

- Sikayet edeni degerlendirme (kotu niyetli ihbar sayaci)
- Profil alani temizleme (hakaret iceren kullanici adi / fotograf)
- Hesap silme (KVKK), geri alinamaz
- Pano: canli sayilar (aktif kullanici, bugunku check-in, bekleyen
  sikayet, buyume)
- Mekan kaydi kaldirma
- Icerigin kalici silinmesi ve Storage dosyasinin temizlenmesi
- Sahibine "moderasyon tarafindan gizlendi" bildirimi
- Oturum iptali icin sunucu tarafli yardimci
- Panelin barindiriciya cikarilmasi

## Kapsam disi (hicbir dilimde yok)

- Ozel mesaj okuma (karar 59)
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
