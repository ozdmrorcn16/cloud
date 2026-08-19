# Faz 2c — Kimlik ve kisi arama — tasarim

Tarih: 2026-08-19
Durum: kullanici onayindan gecti (beyin firtinasi tamamlandi)
Onceki faz: `docs/superpowers/specs/2026-08-16-faz2b-guvenlik-ve-yogunluk-design.md`
Ust spec: `docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`

## Tek cumle

Her kullanicinin baskasinda olmayan bir kullanici adi olur; kisiler
birbirini kullanici adiyla ya da isim soyisimle arayip bulabilir,
istemeyen ise aramada hic gorunmemeyi secebilir.

## Bu fazin sinirlari ve neden ayri bir faz

Isin kullanici adi kismi kucuk: bir sutun, bir benzersizlik kisiti, iki
ekran. Ayri bir faz olmasinin sebebi ikinci parca — **kisi aramasi.**

Bugune kadar bu uygulamada birini gorebilmenin tek yolu **ayni mekanda
ayni anda check-in yapmis olmak.** Gorunurluk konuma bagliydi ve
kendiliginden siniriydi. Arama bunu degistiriyor: adini bilen herkes
seni bulabilir hale geliyor. Ust spec'in "bastan tasarima girmesi
gereken kisit" bolumu tam olarak bu tur bir yuzey icin uyariyor (taciz,
takip, sahte hesap). O yuzden bu faz, Faz 2b'nin guvenlik altyapisinin
**uzerine** oturuyor: engelleme aramada da gecerli, ve kullanicinin
aramadan tamamen cikma hakki var.

**Faz 4'un kisi listesiyle karistirilmamali.** Faz 4'te satilacak olan
sey "su an yakinimda kimler var" — konuma bagli, kimligi konumla
birlestiren, ucretli bir ozellik. Buradaki arama konumdan tamamen
bagimsiz: kimligi bilinen birini bulmaya yariyor, nerede oldugunu
soylemiyor. Arama sonucundan gidilen profil, Faz 2b'deki
`baskasinin_profili` ekraninin aynisi — yani kisinin nerede oldugu
degil, herkese acik birakmis oldugu anilari gorunuyor.

## Kapsam

### Bu fazda var

| Parca | Aciklama |
|---|---|
| Benzersiz kullanici adi | `profiller.kullanici_adi`, veritabaninda zorunlu ve benzersiz |
| Kayitta secim | Profil olusturma ekraninda, yazarken musaitlik gosterilir |
| Ayarlardan degistirme | 30 gunde bir, kural sunucuda zorunlu |
| Aramada gorunurluk | "Beni aramada gosterme" anahtari, varsayilan gorunur |
| Kisi arama | Kullanici adi ve isim soyisimle, engellemeleri gozeterek |
| Profilde kullanici adi | `baskasinin_profili` kullanici adini da doner |

### Bu fazda yok

- **@etiketleme / mention** — sohbet gelmeden anlamsiz, Faz 3
- **Arkadaslik veya takip iliskisi** — Faz 3
- **Yakindakiler kisi listesi** — Faz 4, odeme ile birlikte
- **Birakilan kullanici adinin rezerve edilmesi** — karar #33
- **Kullanici adi gecmisi** ("eskiden su adi kullaniyordu") — yok
- **Dogrulanmis hesap rozeti**, telefon rehberinden arkadas bulma

## Bu tasarimda alinan kararlar

Numaralar `docs/konusma-gunlugu.md` icindeki karar defterini surduruyor
(Faz 2b 19-28 numaralari kullanmisti).

29. **Kullanici adi, `ad` alaninin yerine gecmez; ek bir kimliktir.**
    `ad` isim soyisimi tasiyan gorunen isim olarak kalir, `kullanici_adi`
    benzersiz kimliktir. Yerine gecirme secenegi reddedildi cunku `ad`
    Faz 2a karar #18 geregi `check_inler.kullanici_adi` sutununa
    **kopyalaniyor**; benzersiz ve degistirilebilir bir adi oraya
    koymak, her ad degisikliginde gecmis check-in ve anilari toplu
    guncelleme isi dogururdu. Ayri alan bu isi tamamen ortadan
    kaldiriyor.
30. **Isim soyisim tek alanda (`ad`) kalir, ayri `soyad` sutunu
    acilmaz.** Kullanici oraya "Orcun Ozdemir" yazar. Gerekce: migrasyon
    ve mevcut kayitlari bolme isi karsiliginda kazanilan tek sey daha
    duzenli veri; arama tek sutunda da calisiyor. Soyisim yazmak
    zorunlu degil.
31. **Bicim: `^[a-z0-9._]{3,20}$`.** Girilen ad kucuk harfe cevrilerek
    saklanir, dolayisiyla benzersizlik buyuk/kucuk harf duyarsizdir —
    `Orcun` ile `orcun` ayni ad sayilir. Turkce harfler kabul
    edilmiyor: gozle ayirt edilemeyen iki hesabin (`orcun` ile Turkce
    harfli benzeri) ayni anda var olmasi taklit ve dolandiricilik icin
    acik kapi olurdu.
32. **Arama herkese aciktir ama kullanici kendini aramadan
    cikarabilir.** `aramada_gorunsun` varsayilan `true`. Kapatma
    secenegi olmayan bir arama, takip edilmek istemeyen kullaniciya tek
    secenek olarak hesabi kapatmayi birakirdi; magaza incelemelerinde
    de zayif nokta olurdu.
33. **Kullanici adi 30 gunde bir degistirilebilir, birakilan ad hemen
    serbest kalir.** Sinirsiz degisiklik reddedildi: ad degistirip
    durarak izini kaybettirmek ve tanidiklarini sasirtmak kolaylasir.
    30 gun rezerve secenegi de reddedildi (YAGNI): ayri bir rezerve
    tablosu ve suresi dolanlari temizleyen bir is gerektiriyor,
    kazanci ise bu asamada dusuk. Kural tek bir tarih sutunuyla
    tutuluyor.
34. **Mekan ekranlarinda gorunen isim degismez.** "Su an burada" ve
    "Anilar" listelerinde bugunku gibi isim soyisim gorunur; kullanici
    adi profil ekranlarinda gosterilir. Karar #29'un dogal sonucu.

## Veri modeli

Yeni tablo yok. `profiller` tablosuna uc sutun ekleniyor.

### Degisen tablo: `profiller`

| Sutun | Tip | Aciklama |
|---|---|---|
| `kullanici_adi` | `text not null unique` | Kucuk harfle saklanir. `check (kullanici_adi ~ '^[a-z0-9._]{3,20}$')` |
| `kullanici_adi_degistirildi` | `timestamptz` | Son degisiklik ani. Kayitta `null` (hic degistirilmemis) |
| `aramada_gorunsun` | `boolean not null default true` | `false` ise kisi arama sonuclarinda hic cikmaz |

Benzersizligi `unique` kisiti sagliyor. Her sey kucuk harf saklandigi
icin ayrica `lower()` indeksine gerek yok — kucuge cevirme istemcide
degil, **veritabanina giren degerin kendisinde** olmali; bunu
`kullanici_adi_degistir` RPC'si ve profil olusturma akisi garanti eder,
`check` kisiti da buyuk harfli bir degeri zaten reddeder.

**Migrasyon sirasi** (mevcut iki test hesabi bozulmasin diye):

1. Sutunu `null` kabul eder halde ekle.
2. Mevcut satirlari doldur: `'kullanici_' || left(id::text, 8)`. Bu
   deger bicim kuralina uyar ve carpismaz.
3. `not null`, `unique` ve `check` kisitlarini ekle.

`profiller`'in RLS **okuma** politikasi degismiyor (Faz 2b karar #26):
satir duzeyinde herkes yalnizca kendi profilini okur. Baskalarina ait
veriye erisen her sey `security definer` RPC uzerinden gecer, cunku RLS
satir duzeyindedir; `ad`'i acan bir politika `dogum_tarihi`'ni de
acardi.

### Sutun duzeyinde yetki (30 gun kuralinin gercekten baglayici olmasi)

`profiller`'de "kendi profilini guncelleyebilir" politikasi var ve RLS
satir duzeyinde calisir. Bu haliyle kullanici `kullanici_adi_degistir`
RPC'sine hic ugramadan, PostgREST uzerinden dogrudan
`update profiller set kullanici_adi = '...'` cagirabilir ve 30 gun
kuralini tamamen atlayabilir. Ayni tuzaga Faz 2a'da `mekan_ekle`'nin
gunluk limitinde dusulmustu: **istemcinin cagirmayi secebilecegi bir
kural, kural degildir.**

Cozum sutun duzeyinde yetki:

```sql
revoke update on public.profiller from authenticated;
grant update (ad, dogum_tarihi, biyografi, fotograflar,
              varsayilan_gizli, aramada_gorunsun)
  on public.profiller to authenticated;
```

Boylece `kullanici_adi` ve `kullanici_adi_degistirildi` sutunlarini
yalnizca tablonun sahibi olarak calisan `security definer` RPC
degistirebilir. Ilk kullanici adi ise `insert` yoluyla giriyor; insert
yetkisi bolunmuyor cunku profil olusturma zaten tek seferlik ve
`kullanici_adi_degistirildi` o anda `null` kaliyor.

`dogum_tarihi` bilerek guncellenebilir birakildi — bugunku davranis bu
ve degistirmek bu fazin isi degil. Yas kapisini saglamlastirmak icin
onu da kilitlemek ayri bir is olarak devrediyor.

## RPC'ler

Uc yeni RPC ekleniyor, bir mevcut RPC genisletiliyor. Ucu de
`security definer` ve ucu de ilk satirda `auth.uid()` null kontrolu
yapar (`baskasinin_profili`'nde bu kontrol zaten var). Bu kontrol
Faz 2a'da `mekan_ekle`'de bulunan gercek acigin tekrarlanmamasi icin
zorunlu tutuluyor.

### `kullanici_adi_musait_mi(p_ad text) returns boolean`

Kayit ve degistirme ekranlarinda, kullanici yazarken cagrilir. Istemci
bunu kendi sorgusuyla yapamaz cunku RLS baskasinin profil satirini
gostermez. Bicime uymayan bir deger icin `false` doner; bicim mesajini
istemci zaten kendisi gosterir.

Bu RPC bir **varlik oracle'idir**: "bu ad alinmis mi" sorusunun cevabi
disari acilir. Benzersiz kullanici adi olan her sistemde bu kacinilmaz.
Sinirlama olarak yalnizca `authenticated` role'une acilir.

### `kullanici_adi_degistir(p_yeni_ad text) returns void`

Bicimi, benzersizligi ve 30 gun kuralini **sunucuda** dogrular; sonra
`kullanici_adi` ve `kullanici_adi_degistirildi` alanlarini gunceller.
Kural istemcide tutulmaz, cunku istemciye guvenilmez — ayni gerekce
`mekan_ekle`'nin gunluk limitinde de gecerliydi.

`kullanici_adi_degistirildi` null ise degisiklik serbesttir (kayittan
sonraki ilk degisiklik).

### `kisi_ara(p_metin text)`

Doner: `id`, `kullanici_adi`, `ad`, `fotograf` (ilk profil fotografi).

- En az 2 karakter ister, aksi halde bos doner. Amac: tek harfle butun
  kullanici tablosunu dokmeyi engellemek.
- En fazla 20 sonuc.
- Eslesme: kullanici adinda **bastan** eslesme, isim soyisimde
  **iceren** eslesme. Ikisinin birlesimi.
- Siralama: once kullanici adi tam eslesenler, sonra kullanici adi
  bastan eslesenler, sonra isim soyisim eslesenler.
- Sonuctan cikarilanlar: **kendisi**, `aramada_gorunsun = false`
  olanlar, ve **engelleme iliskisi olan herkes** — iki yonde de.
  Engelleme mantigi `baskasinin_profili`'ndekiyle birebir ayni
  (Faz 2b): engelleyen de engellenen de digerini goremez, ve sonuc
  "bulunamadi" gibi davranir, "engellendiniz" demez.

Olcek notu: bu asamada duz tarama yeterli. Kullanici sayisi buyudugunde
`ad` uzerine `pg_trgm` indeksi eklenecek; bugun eklemek erken
optimizasyon olur.

### `baskasinin_profili` genisletiliyor

Donen sutunlara `kullanici_adi` eklenir. Dogum tarihi yine hicbir
kosulda donmuyor (Faz 2b karar #27).

## Ekranlar

| Ekran | Degisiklik |
|---|---|
| `profil-olustur` | "Kullanici adi" alani. Yazarken musaitlik gosterilir, bicim kurali ekranda yazar |
| `profil/ayarlar` | Yeni "Hesap" bolumu: kullanici adini degistir, ne zaman tekrar degistirebilecegi yazar. Gizlilik tarafina "Beni aramada gosterme" anahtari |
| `kisiler` (yeni) | Arama kutusu; sonuc listesi kullanici adi + isim soyisim + fotograf. Sonuca basinca `/kullanici/[id]` acilir |
| `kullanici/[id]` | Isim soyisimin altinda kullanici adi gosterilir |
| `index` (ana ekran) | "Kisi ara" girisi |

Profil olusturma ekraninda kullanici adi **zorunlu**; sutun `not null`
oldugu icin bos birakilamaz.

## Hata durumlari

| Durum | Kullaniciya gosterilen |
|---|---|
| Bicime uymayan ad | "Kullanici adi 3-20 karakter olmali; sadece kucuk harf, rakam, nokta ve alt cizgi kullanilabilir." |
| Alinmis ad (kayit) | "Bu kullanici adi alinmis, baska bir tane dene." |
| Alinmis ad (degistirme) | Ayni mesaj |
| 30 gun dolmamis | "Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: N gun." |
| Arama metni 1 karakter | Sonuc listesi yerine "En az 2 karakter yaz." |
| Arama sonucu bos | "Kimse bulunamadi." |
| Kimliksiz cagri | RPC `Kimlik dogrulamasi gerekli` hatasi verir; ekran genel ag hatasi mesajini gosterir |

Veritabani `unique` ihlali (`23505`) istemcide yakalanip yukaridaki
Turkce mesaja cevrilir; ham Postgres mesaji kullaniciya gosterilmez.

## Test yaklasimi

Jest (mock tabanli) tarafinda: bicim dogrulama fonksiyonu, dort ekranin
davranisi (musaitlik gosterimi, hata mesajlari, arama sonucuna
tiklama).

Asil kanit `gorunurluk-testleri` paketine eklenecek **gercek
veritabani** senaryolarinda (Faz 2b karar #28: mock'lu test gecerken
canli veritabaninda calismayan kod uretilebiliyor, Faz 2a'da tam bunu
yasadik):

1. Ayni kullanici adi ikinci kez alinamaz.
2. Buyuk/kucuk harf farki yeni bir ad saymaz (`Orcun` vs `orcun`).
3. Bicime uymayan ad veritabani tarafindan reddedilir.
4. 30 gun dolmadan yapilan degistirme sunucuda reddedilir.
5. Ilk degistirme (henuz hic degistirmemis kullanici) kabul edilir.
6. Arama, kullanici adiyla bulur.
7. Arama, isim soyisimle bulur.
8. Arama, `aramada_gorunsun = false` olan kullaniciyi hic gostermez.
9. Arama, engelleyen ve engellenen kullaniciyi iki yonde de gizler.
10. Arama, kullanicinin kendisini sonuclara koymaz.
11. `kullanici_adi_musait_mi` kimliksiz cagrida hata verir.
12. **Dogrudan `update profiller set kullanici_adi = ...` reddedilir**
    — sutun duzeyindeki yetki kisitinin gercekten yerinde oldugunu
    kanitlar. Bu olmadan 30 gun kurali suslemeden ibaret kalir.
13. Dogrudan `update profiller set aramada_gorunsun = ...` calisir —
    yetki kisitinin fazla genis olmadiginin karsi kontrolu.

## Sonraki adim

Uygulama plani: `superpowers:writing-plans` becerisiyle
`docs/superpowers/plans/2026-08-19-faz2c-kimlik-ve-kisi-arama.md`
dosyasina yazilacak.
