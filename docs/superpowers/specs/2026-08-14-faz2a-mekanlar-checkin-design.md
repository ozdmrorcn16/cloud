# Faz 2a — Mekanlar ve check-in — tasarim

Tarih: 2026-08-14
Durum: kullanici onayindan gecti (beyin firtinasi tamamlandi)
Ust spec: `docs/superpowers/specs/2026-08-11-konum-tabanli-sosyal-uygulama-design.md`
(orada "Faz 2 — Kesif ve guvenlik" tek fazdi; guvenlik gerekcesiyle ikiye
bolundu — bu belge yalnizca 2a'yi kapsiyor, 2b kendi spec'ini alacak)

## Tek cumle

Kullanici bir mekan bulur ya da ekler, check-in yapar, 4 saat (ya da
"ayrildim" diyene kadar) o mekanda ayni anda check-in yapmis kisiler
tarafindan gorulur; sure dolunca check-in otomatik olarak profilinde
kalici bir aniya donusur.

## Faz 2a / 2b ayrimi ve bu fazin siniri

Bolme cizgisi guvenlikle ilgili: 2a bilerek "kimse kimseyi gormuyor"
sinirinda tutuluyor (canli check-in'in karsilikli gorunurlugu haric —
asagida), ki Faz 2b'de genel "yakindakiler" kesfi, gorunurluk tercihleri
ve **engelleme/sikayet** ayni anda gelsin. Yarim birakilmis bir gorunurluk
ozelligi guvenlik acigi dogurmasin diye.

**Faz 2a sonunda:** kullanici mekan arayabiliyor/ekleyebiliyor, check-in
yapabiliyor, kendi anilarini goruyor/siliyor. **Faz 2a'ya bilerek
alinmayan:** genel "yakindakiler" sorgusu (herkesin herkesi mesafeyle
bulmasi), kisiye ozel gorunurluk ayari arayuzu, engelleme, sikayet. Bu
dorde de karsilik gelen veritabani alanlari (`gorunurluk` gibi) 2a'da
semada duruyor ama islevsiz — gercek mantiklari 2b'de yazilacak.

## Kapsam

### Bu fazda var

| Parca | Aciklama |
|---|---|
| Mekan verisi yuklemesi | OSM'den (Geofabrik Turkiye) tek seferlik toplu yukleme |
| Mekan arama | Yakindaki mekanlari mesafeye gore listeleme |
| Mekan ekleme | Kullanici OSM'de olmayan bir mekani ekleyebilir, korumali |
| Check-in olusturma | Not + fotograf, ~500 m yakinlik sarti, tek aktif check-in |
| Canli gorunurluk | Ayni mekanda ayni anda check-in yapanlar birbirini gorur |
| Otomatik ani donusumu | Sure dolunca / "ayrildim" ile check-in kalici aniya doner |
| Mekan ekrani | Su an orada olanlar (karsilikli) + gecmis anilar (herkese acik) |
| Profil anilari | Kullanici kendi anilarini gorur, tikliyinca mekan haritada acilir, istedigini siler |

### Bu fazda yok (2b'ye veya sonrasina birakildi)

- Genel "yakindakiler" sorgusu (mesafeyle herkesi bulma) — **2b, ucretli**
- Kisiye ozel gorunurluk tercihi arayuzu (herkese acik / takiplesilenler /
  belirli kisiler) — **2b**, semadaki `gorunurluk` alani suan islevsiz
- Gizli check-in (`gizli_mi`) — **2b**
- Engelleme, sikayet — **2b**
- Takip/arkadaslik iliski modeli (gorunurluk secenegi icin gerekli) —
  sosyal/kesif fazi kapsaminda, henuz tasarlanmadi
- Video (yalnizca fotograf var) — sonraki bir faz
- Mekan odasi — spec'ten tamamen kaldirildi (bkz. ust spec, karar #5)

## Veri modeli

```
mekanlar     (id, ad, tur, konum geography(Point), adres, osm_id,
              ekleyen_kullanici)
check_inler  (id, kullanici_id, mekan_id, not, fotograf,
              olusturma_zamani, bitis_zamani, konum geography(Point) null,
              gorunurluk)
```

**`mekanlar`** — OSM'den gelen kalici mekan katalogu (~200-400 bin kayit).
`konum` uzerinde GiST indeksi var; "yakinimdaki mekanlar" sorgusunu hizli
tutan bu. `ekleyen_kullanici`, OSM'den geldiyse bos, kullanici eklediyse
dolu.

**`check_inler`** — her check-in tek satir. `bitis_zamani = olusturma +
4 saat` (ya da erken "ayrildim"). `konum`, canli fazda cihaz konumu;
sure dolunca/ayrilinca **null'lanir**, satir silinmez. `gorunurluk`, 2b'de
islevsel olacak alan (varsayilan `herkese_acik`, su an degistirilemez).

**Ayri bir "ani" tablosu yok.** Suresi dolmus (`konum IS NULL`) bir
check-in satiri zaten anidir — "aniya cevirme" bir kopyalama degil, tek
alanlik bir guncelleme (otomatik, kullanici mudahalesi gerekmez).

**Kalicilik:** hicbir check-in otomatik silinmez. Kullanici anisini
istedigi zaman elle silebilir ya da hic silmeyebilir. Bu, ust spec'teki
"check-in dustugunde kaydi da silinir" ifadesini degistiriyor —
guncellenen davranis: **konum silinir, kayit kalir**, "konum verisi
tutmuyoruz" durusu boylece korunuyor (kullanicinin GPS izi hicbir zaman
birikmiyor, ama not/fotograf/mekan hatirasi kalici).

## Mekan arama ve ekleme akisi

**Arama:** kullanici konum izni verir, `ST_DWithin(mekanlar.konum,
:cihaz_konumu, :yaricap)` sorgusuyla yakin mekanlar cekilir, isteğe bağlı
isim filtresiyle daraltilir, mesafeye gore siralanir. Tamamen kendi
PostGIS'imizde, dis servise gitmiyor.

**Mekan bulunamazsa — ekleme:**
- Form: ad, tur, adres (opsiyonel, GPS'ten otomatik).
- **~200 m yakinlik sarti:** cihaz konumu mekana bu mesafeden uzaksa form
  gonderilemez — ekleyen kisi fiilen orada olmali.
- **Mukerrer kayit onleme:** kaydetmeden once yakin cevredeki benzer
  isimli mekanlar gosterilir.
- **Gunluk ekleme limiti:** kotuye kullanimi frenlemek icin.
- Eklenen mekan `ekleyen_kullanici` ile isaretlenir, moderasyon
  kuyrugu olmadan hemen `mekanlar`'a girer. Sikayet edilebilirlik tamamen
  2b'ye birakildi (2a'da henuz bir sikayet mekanizmasi yok).

Yakinlik sartlari (~200 m ekleme, ~500 m check-in) bir duvar degil hiz
kesici; kararli biri cihaz konumunu taklit edebilir.

## Check-in olusturma akisi

1. Kullanici bir mekan secer.
2. **~500 m yakinlik kontrolu:** cihaz konumu mekana bu mesafeden uzaksa
   check-in engellenir. Yaricap bu kadar genis cunku bina ici/AVM/kalabalik
   alanda GPS sapmasi yuzlerce metreyi bulabiliyor; daha dar bir sinir
   durust kullaniciyi da bloke ederdi.
3. Kullanici istege bagli not yazar ve/veya fotograf ekler (video yok).
4. Check-in olusur: `bitis_zamani = simdi + 4 saat`, `konum = cihaz
   konumu`, `gorunurluk = varsayilan`.
5. **Tek aktif check-in kurali:** kullanicinin ayni anda yalnizca bir
   canli check-in'i olabilir. Yeni check-in yapmak varsa oncekini otomatik
   kapatir (o da aniya doner).

**Canli fazda (0-4 saat / "ayrildim"a kadar):** check-in, o mekanda ayni
anda check-in yapmis **diger kisilere** gorunur (mekan ekraninin "su an
burada" bolumu). Check-in yapmamis biri bu bolumu goremez. Kullanici
istedigi an "ayrildim" butonuyla canli fazi erken bitirebilir.

**Sure dolunca / "ayrildim" ile:** `konum` null'lanir, satir otomatik
aniya doner. Mekanin "su an burada" listesinden duser, "anilar" bolumune
gecer (herkese acik, asagida).

## Gorunurluk katmanlari

Iki ayri katman var, birbirinden bagimsiz calisir:

1. **Canli check-in gorunurlugu — karsilikli, otomatik, 2a'da aktif.**
   Bir mekanda check-in yapan kisi, o an **ayni mekanda check-in yapmis
   diger kisiler** tarafindan gorulur. Check-in yapmamis/o mekanda
   olmayan biri goremez. Profil gorunurluk ayarindan bagimsiz.

2. **Ani/profil gorunurlugu — kullanicinin kendi secimi, 2b'de aktif
   olacak.** `check_inler.gorunurluk` alani uc deger alacak: herkese
   acik / takiplesilen (karsilikli takip) kisiler / belirli kisiler
   (ozel liste). Bunun icin bir takip/arkadaslik iliski modeli gerekiyor
   — henuz tasarlanmadi, sosyal/kesif fazinin kapsaminda. 2a'da alan
   varsayilan `herkese_acik` degeriyle kaydedilir, kullanici
   degistiremez (ayar arayuzu 2b'de gelecek).

**Yakindakiler sorgusu — tamamen 2b, ucretli.** Check-in yapmamis/o
mekanda olmayan kullanicilar birini ancak Faz 2b'nin genel "yakindakiler"
sorgusuyla bulabilecek, bu ozellik premium/ucretli bir katman olarak
konumlanacak. Boylece 2a'nin "kimse kimseyi gormuyor" ilkesi (karsilikli
check-in gorunurlugu haric) korunuyor, 2b hem guvenlik hem monetizasyon
ekseninde tasarlanacak.

## Mekan ekrani ve profil anilari

**Mekan ekrani (mekan halka acik oldugu icin herkes goruntuleyebilir):**
- **Ust bolum — "Su an burada":** yalnizca kendisi de o mekanda canli
  check-in yapmis kullanicilara gorunur (katman 1).
- **Alt bolum — "Anilar":** o mekanda gecmiste check-in yapilmis, suresi
  dolmus kayitlar (not + fotograf, konumsuz). **Herkese acik** — mekan
  zaten kamuya acik bir yer, "kimin ne zaman gittigi" hassas degil,
  hassas olan yalnizca *canli* konum. "Kimse kimseyi gormuyor" ilkesi
  (karar #8, ust spec) bu yuzden yalnizca canli check-in'e uygulaniyor,
  gecmis anilara degil.

**Profildeki anilar (kullanicinin kendi profili):**
- Kronolojik liste: mekan adi, not, fotograf, tarih. Kullanicinin kisisel
  GPS koordinati hicbir zaman saklanmiyor/gosterilmiyor.
- Karta tiklayinca **mekanin** kendi sabit harita konumu (pin) acilir —
  gosterilen `mekanlar.konum`, kullanicinin `check_inler.konum`'u degil;
  ikisi zaten ayri alanlar ve check_inler.konum zaten null.
- Kullanici istedigi aniyi tek tek silebilir, hic silmeyebilir.
- Kimin gorebilecegi: yukaridaki katman 2, 2a'da islevsiz.

## Hata durumlari

| Durum | Davranis |
|---|---|
| Konum izni reddedildi | Mekan aramasi/check-in yapilamaz, sebep acikca yazilir |
| Check-in sirasinda mekana ~500 m'den uzak | Check-in engellenir, mesafe gosterilir |
| Mekan ekleme sirasinda ~200 m'den uzak | Form gonderilemez |
| Ayni isimde yakin mekan var | Kaydetmeden once benzer mekanlar onerilir |
| Gunluk mekan ekleme limiti asildi | Ertesi gune kadar engellenir |
| Zaten aktif check-in varken yeni check-in | Oncekini otomatik kapatir (aniya doner), yenisini acar |
| Ag yok | Check-in kuyrukta bekler, baglanti gelince gonderilir |
| Fotograf yuklenemedi | Not olmadan check-in'e izin verilir, fotograf sonra eklenebilir |

## Test yaklasimi

- **Birim:** ~500 m ve ~200 m yakinlik kontrolleri, tek aktif check-in
  kurali, sure dolunca otomatik ani donusumu (konum null'lama, satir
  silinmemesi) tek tek test edilir.
- **Guvenlik/mahremiyet:** canli check-in gorunurlugunun gercekten
  karsilikli oldugu (check-in yapmamis kullanicinin "su an burada"
  bolumunu goremedigi) ayrica dogrulanir — bu, 2a'nin tek gercek
  gorunurluk yuzeyi.
- **Entegrasyon:** mekan arama → mekan ekleme → check-in → canli gorunum
  → sure dolma/ayrilma → ani donusumu → profilde goruntuleme/silme akisi
  uctan uca.

## Sonraki adim

Bu spec onaylandi. Siradaki adim `writing-plans` becerisiyle Faz 2a'nin
uygulama planini yazmak.
