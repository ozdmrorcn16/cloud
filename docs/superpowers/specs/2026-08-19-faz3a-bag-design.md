# Faz 3a — Bag — tasarim

Tarih: 2026-08-19
Durum: kullanici onayindan gecti (beyin firtinasi tamamlandi)
Onceki faz: `docs/superpowers/specs/2026-08-19-faz2c-kimlik-ve-kisi-arama-design.md`
Ust spec: `docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`

## Tek cumle

Kullanicilar birbirine takip ve sohbet istegi gonderip kabul edebilir;
kabul edilen takip, takipciye kisinin canli check-in'ini uzaktan gorme
hakki verir, ve kullanici her check-in'de kimin gorecegini uc kademeli
olarak secer.

## Bu fazin sinirlari ve neden boyle bolundu

Ust spec'te "Faz 3 — Bag ve sohbet" tek fazdi ve dort ayri parca
iceriyordu: takip/sohbet istekleri, birebir mesajlasma, mekan odalari,
bildirimler. Bunlar birbirinden gercekten bagimsiz — bildirim altyapisi
(cihaz jetonlari, izinler, magaza ayarlari) mesajlasmadan tamamen ayri
bir is, mekan odasi ise birebir sohbetten farkli uyelik kurallari
tasiyor. Faz 2'nin 2a/2b olarak bolunmesindeki mantik burada da gecerli.

Bolunme:

- **3a — Bag** (bu spec): istek akisi, kabul/red, kisi listeleri,
  gorunurluk kademeleri.
- **3b — Birebir sohbet:** konusmalar, mesajlar, gercek zamanli
  abonelik, mesaj sikayeti.
- **3c — Mekan odalari:** ayni mekana check-in yapanlarin ortak, kalici
  odasi.
- **3d — Bildirimler:** push altyapisi.

3a'nin sonunda kullanicilar birbirine bag kurabiliyor ve bu bagin
gorunurluk sonuclari isliyor, ama henuz kimse kimseye mesaj yazamiyor.

## Kapsam

### Bu fazda var

| Parca | Aciklama |
|---|---|
| Takip istegi | Gonderme, kabul, red; tek yonlu bag |
| Sohbet istegi | Ayni akis, ayri tablo; kabul edilince "sohbet acik" durumu kaydedilir |
| Baglar ekrani | Gelen/giden istekler, takipcilerim, takip ettiklerim |
| Takibi birakma | Takip eden taraf iliskiyi sonlandirir |
| Takipciyi cikarma | Takip edilen taraf iliskiyi sonlandirir |
| Check-in bulunurlugu | Uc kademe: herkese acik / sadece takipcilerim / gizli |
| Ani gorunurlugu | Ucuncu secenek: sadece takipcilerim |
| Uzaktan gorunurluk | Takipci, kisinin canli check-in'ini nerede olursa olsun gorur |

### Bu fazda yok

- **Mesaj yazma ekrani ve `mesajlar` tablosu** — 3b
- **Mekan odalari** — 3c
- **Bildirimler** — 3d
- **Yakindakiler kisi listesi** — Faz 4, odeme ile birlikte
- Karsilikli takip icin ayri bir "arkadaslik" kavrami: takip tek yonlu
  kalir, iki taraf da takip ederse karsilikli olur, ayri bir durum yok
- Takipci sayisi/istatistik gosterimi

## Onceki fazlardan degisen karar

**Faz 2b karar #25 degisti.** O karar "gizli check-in mekanda yine
gorunur" diyordu; gerekcesi, aksi halde "gizli" ile "hic check-in
yapmamis olmak" ayni seye dusecegiydi. O gerekce, uzaktan gorunme diye
bir yuzey **olmadigi** icin gecerliydi: `gizli_mi` bugun canli
gorunurluk politikasinda hic kullanilmiyor, tek gercek etkisi check-in
aniya donusurken gorunurlugun kapanmasi.

Bu faz uzaktan gorunmeyi ilk kez yaratiyor (takipciler). Dolayisiyla
kademelerin ne anlama geldigi yeniden tanimlandi ve merdiven bicimi
secildi: her kademe bir oncekinden daha fazlasini kapatir, `gizli`
kimseye gorunmez. Kullanicinin "gizli" kelimesinden bekledigi sey bu.

Sonucu: gizli check-in artik mekandakilere de gorunmez. Kullanici
mekanda karsilasmak istiyorsa `herkese_acik` ya da `takipcilerim`
secmeli.

## Bu tasarimda alinan kararlar

Numaralar `docs/konusma-gunlugu.md` icindeki karar defterini surduruyor
(Faz 2c 29-34 numaralari kullanmisti).

35. **Faz 3 dorde bolundu** (3a bag, 3b birebir sohbet, 3c mekan
    odalari, 3d bildirimler). Gerekce yukarida.
36. **3a'da istek akisi var, mesaj ekrani 3b'de.** Sohbet istegi kabul
    edilince "sohbet acik" durumu kaydedilir ama yazacak yer gelmez.
    Iki istek turu ayni akisi ve ayni ekranlari paylastigi icin birlikte
    tasarlanmalari, 3b'nin yalnizca mesajlasmaya odaklanmasini sagliyor.
37. **Red sonrasi yeniden istek sinirsiz.** Reddedilen istek satiri
    silinir, gonderen hemen yenisini yollayabilir. Israrci davranisa
    karsi koruma **engelleme**; ayrica toplu taramayi engelleyen gunluk
    bir tavan var (asagida "RPC'ler" bolumunde). Alternatifler (kalici red, 30 gunluk
    bekleme) degerlendirildi ve reddedildi.
38. **Takip, takipciye canli check-in'i uzaktan gorme hakki verir.**
    Takip edilen kisi bir yere check-in yaptiginda, takipci nerede
    olursa olsun gorur (kisinin sectigi bulunurluk kademesine bagli).
    Bu, takibi kabul etmeyi ciddi bir karar haline getiriyor;
    karsiliklari: kabul ekraninda ne verildiginin yazmasi, takipciyi
    cikarabilme, ve engellemenin takibi de kaldirmasi.
39. **Check-in bulunurlugu uc kademeli bir merdiven.**
    `herkese_acik` (mekandakiler + takipciler) > `takipcilerim`
    (yalnizca takipciler) > `gizli` (kimse). Iki eksenli okuma
    (mekan/uzak ayri) ve dort kademeli model reddedildi: kullanicinin
    kimin gordugunu kestirebilmesi, denetimin son zerresinden daha
    degerli.
40. **Varsayilan bulunurluk `herkese_acik`.** Bugunku davranis birebir
    korunur, mevcut kullanicilar icin hicbir sey sessizce degismez.
    Kullanici varsayilani ayarlardan degistirebilir.
41. **Takip ve sohbet istekleri ayri tablolarda** (`takipler`,
    `sohbet_istekleri`), ust spec'in taslagindaki gibi. Tek tablo +
    `tur` sutunu alternatifi degerlendirildi; takip cizgesinin kendi dar
    tablosunda durmasi ve gorunurluk sorgusunun dogrudan ona bakmasi
    tercih edildi. Iki durum makinesinin tekrarina karsi onlem: ikisi de
    ayni `bag.takip_ediyor_mu()` yardimcisini ve ayni RPC bicimini
    paylasir.

## Veri modeli

### Yeni tablo: `takipler`

| Sutun | Tip | Aciklama |
|---|---|---|
| `takip_eden_id` | `uuid not null` | `auth.users(id)`, cascade |
| `takip_edilen_id` | `uuid not null` | `auth.users(id)`, cascade |
| `durum` | `text not null` | `beklemede` / `kabul` |
| `olusturuldu` | `timestamptz not null default now()` | |

Birincil anahtar `(takip_eden_id, takip_edilen_id)`. `check (takip_eden_id <> takip_edilen_id)`.
`check (durum in ('beklemede','kabul'))`.

**Red satiri tutulmaz, silinir.** Karar #37 geregi red bir sonraki
istegi engellemedigi icin, red kaydini tutmanin hicbir islevi kalmiyor.

Indeks: `(takip_edilen_id, takip_eden_id) where durum = 'kabul'` —
gorunurluk sorgusunun sicak yolu bu.

### Yeni tablo: `sohbet_istekleri`

`takipler` ile ayni bicim: `(gonderen_id, alan_id, durum, olusturuldu)`,
birincil anahtar `(gonderen_id, alan_id)`, ayni kisitlar.

### Degisen tablo: `check_inler`

`gizli_mi boolean` yerini `bulunurluk text not null default 'herkese_acik'`
aliyor, `check (bulunurluk in ('herkese_acik','takipcilerim','gizli'))`.

Tasima: `gizli_mi = true` olan satirlar `gizli`, digerleri
`herkese_acik`. Sutun sonra dusuruluyor.

`gorunurluk` sutunu `takipcilerim` degerini kazaniyor:
`check (gorunurluk in ('herkese_acik','takipcilerim','kimse'))`.

### Degisen tablo: `profiller`

`varsayilan_gizli boolean` yerini `varsayilan_bulunurluk text not null
default 'herkese_acik'` aliyor, ayni uc degerle. Tasima ayni mantikla.

Sutun duzeyinde `update` yetkisi listesi guncellenmeli: `varsayilan_gizli`
cikip `varsayilan_bulunurluk` girmeli (Faz 2c'de kurulan kisit).

## Gorunurluk kurallarinin uygulanmasi

### Yardimci fonksiyon

Fonksiyon `bag` adinda yeni bir semaya konuyor. Gerekce Faz 2b'den
devraliniyor: `gizli` semasi orada tam da bunun icin acilmisti — RLS'in
cagirdigi `security definer` yardimcilarini `public`ten ayirmak, boylece
PostgREST bu fonksiyonlari istemciye RPC olarak sunmuyor. `gizli` semasi
gizleme kurallarini tasiyor; bag sorgusu oraya semantik olarak ait degil.

```sql
create or replace function bag.takip_ediyor_mu(p_takip_eden uuid, p_takip_edilen uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.takipler
    where takip_eden_id = p_takip_eden
      and takip_edilen_id = p_takip_edilen
      and durum = 'kabul'
  );
$$;
```

Politikalar `takipler` tablosuna **dogrudan bakmaz**, yalnizca bu
fonksiyonu cagirir. Gerekce Faz 2b'de olcuyle ogrenildi: `check_inler`
politikasi kendi tablosuna alt sorguyla baktigi icin Postgres
"infinite recursion detected in policy" ile her sorguyu reddediyordu
(`20260816180000` migrasyonu). Ayni tuzak `takipler` icin de gecerli
olacak, cunku `takipler`'in kendi SELECT politikasi da var.

### Canli check-in (`konum is not null`)

| Bulunurluk | Kim gorur |
|---|---|
| `herkese_acik` | Ayni mekanda canli check-in'i olanlar **veya** takipciler |
| `takipcilerim` | Yalnizca takipciler |
| `gizli` | Yalnizca sahibi |

### Ani (`konum is null`)

| Gorunurluk | Kim gorur |
|---|---|
| `herkese_acik` | Herkes |
| `takipcilerim` | Yalnizca takipciler |
| `kimse` | Yalnizca sahibi |

### Engelleme her ikisinin de onunde

Mevcut politikadaki `not gizli.engelli_mi(...)` kosulu en dista kalir.
Engelli iliskide hicbir sey gorunmez.

### Ani donusumu gorunurlugu genisletmez

Check-in aniya donusurken (hem "ayrildim" hem 4 saatlik pg_cron yolunda):

| Bulunurluk | Aninin gorunurlugu |
|---|---|
| `gizli` | `kimse` (bugunku kural) |
| `takipcilerim` | En fazla `takipcilerim` — `herkese_acik` ise geri cekilir |
| `herkese_acik` | Kullanicinin ani tercihi neyse o kalir |

### Mekan yogunlugu degismiyor

Yogunluk sayisi kim oldugunu soylemedigi icin butun check-in'leri saymaya
devam eder — gizli olanlar dahil (Faz 2b karari). Yogunlugun bulunurluk
kademesine gore degismesi, "sayi dustu, demek ki biri gizlendi" cikarimina
kapi acardi.

## RPC'ler

Hepsi `security definer`, hepsi basta `auth.uid()` null kontrolu yapar,
hepsi `revoke execute ... from public, anon` + `grant ... to authenticated`
ile biter.

| RPC | Isi |
|---|---|
| `takip_istegi_gonder(p_kullanici_id)` | Bekleyen istek olusturur |
| `takip_istegini_yanitla(p_kullanici_id, p_kabul)` | Kabul: `durum='kabul'`. Red: satiri siler |
| `takibi_birak(p_kullanici_id)` | Takip eden taraf siler |
| `takipciyi_cikar(p_kullanici_id)` | Takip edilen taraf siler |
| `sohbet_istegi_gonder(p_kullanici_id)` | Ayni bicim |
| `sohbet_istegini_yanitla(p_kullanici_id, p_kabul)` | Ayni bicim |

Istek gonderen RPC'lerin ortak kontrolleri:

1. Kendine istek yok.
2. Engelli iliski varsa **sessizce** reddedilir — hata mesaji
   "Bu kullanici bulunamadi", "engellendin" demez (Faz 2b sessizlik
   ilkesi).
3. Zaten kabul edilmis bir bag varsa yeni istek olusturulmaz.
4. Gunluk toplam istek tavani: **50** (iki tur birlikte sayilir). Asilirsa
   `Bugunluk istek sinirina ulastin`. Kalibi `mekan_ekle`'nin gunluk
   limitiyle ayni; amaci kisi basi sinirlama degil, tek hesabin yuzlerce
   kisiye istek atarak dizini taramasini engellemek.

Yanitlama RPC'leri yalnizca **alici** tarafindan cagrilabilir; gonderen
kendi istegini kabul edemez.

### Engelleme takibi kaldirir

Mevcut `engelle` RPC'si genisletilir: engelleme kaydi olustuktan sonra
iki yondeki takip ve sohbet kayitlari (bekleyen ve kabul edilmis) silinir.
Bu olmadan engellenen kisi konum akisini gormeye devam ederdi ve sessiz
engelleme ilkesi delinmis olurdu.

## Ekranlar

| Ekran | Degisiklik |
|---|---|
| `kullanici/[id]` | "Takip et" ve "Sohbet iste" butonlari; mevcut durum gosterilir; takip ediyorsan "Takibi birak" |
| `baglar` (yeni) | Gelen istekler (kabul/red), giden istekler, takipcilerim, takip ettiklerim; her satirda "Engelle" |
| `check-in/[mekanId]` | Gizlilik anahtari uc secenekli secime donusur |
| `profil/ayarlar` | Varsayilan bulunurluk uc secenekli; ani gorunurlugu ucuncu secenegi kazanir |
| `index` | "Baglar" girisi, bekleyen istek varsa yaninda sayi |

Kabul dugmesinin yaninda ne verildigi yazar: **"Kabul edersen
check-in'lerini gorebilecek."** Takip artik konum actigi icin bunu
kullanicidan saklamak dogru olmaz.

## Hata durumlari

| Durum | Kullaniciya gosterilen |
|---|---|
| Kendine istek | Buton hic gosterilmez |
| Engelli iliski | "Bu kullanici bulunamadi." |
| Zaten bekleyen istek var | "Istegin zaten gonderilmis." |
| Zaten takip ediyor | Buton "Takibi birak" olarak gorunur |
| Gunluk tavan asildi | "Bugunluk istek sinirina ulastin." |
| Baskasinin istegini yanitlama | RPC reddeder; ekran genel hata gosterir |
| Kimliksiz cagri | `Kimlik dogrulamasi gerekli` |

## Test yaklasimi

Jest (mock tabanli): durum makinesi, bes ekranin davranisi.

Gercek veritabanina karsi (`npm run test:gorunurluk`) — asil kanit:

1. Istek gonderilir; alan gorur, gonderen "beklemede" gorur.
2. Kabul edilince takipci, **mekan disindan** canli check-in'i gorur.
3. Kabul edilmeden goremez (negatif kontrol).
4. `bulunurluk = 'takipcilerim'` olan check-in'i ayni mekandaki yabanci
   goremez.
5. `bulunurluk = 'gizli'` olani kimse goremez (mekandaki dahil).
6. Engelleme takibi kaldirir ve uzaktan akisi keser.
7. Engelliyken istek gonderilemez, hata "bulunamadi" der.
8. Baskasinin istegi kabul edilemez.
9. Ani donusumu gorunurlugu genisletmez (uc kademe icin ayri ayri).
10. Takipciyi cikarinca akis kesilir.
11. Gunluk tavan asildiginda istek reddedilir.
12. Kimliksiz cagrilar reddedilir.

Her senaryo betigi tekrar tekrar calistirilabilir olmali; olusturulan
takip ve engelleme kayitlari sonunda temizlenmeli. Sabit ya da tahmin
edilebilir fixture varsayimi kullanilmamali — Faz 2c'de ayni sinifta uc
kusur yasandi (bir testin yan etkisi baska bir testin varsayimini
cokertiyordu).

## Sonraki adim

Uygulama plani: `superpowers:writing-plans` becerisiyle
`docs/superpowers/plans/2026-08-19-faz3a-bag.md` dosyasina yazilacak.
