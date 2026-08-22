# Plan 1 (hesap durumu temeli ve kullanici haklari) - kalan takip isleri

Plan 1, 2026-08-22'de kapandi (18 gorevden 17'si uygulandi; Task 14
uygulanip ayni oturumda kullanici karariyla geri alindi). Bu dosya,
kapanista bilerek ertelenen ya da bulunup duzeltilmeyen maddeleri
toplar. Hicbiri Plan 1'i yeniden acmiyor; hepsi ya baska bir isin
(cogunlukla Plan 2 - moderasyon paneli) kapsamina giriyor ya da
etkilesimli/insan gerektiren bir dogrulama.

## 1. Elle tarayici gezintisi henuz yapilmadi

Task 18 brief'inin Step 3'u etkilesimli ve insan gerektirdigi icin
kullaniciya birakildi. Dogrulanmasi gereken akislar:

- **Dondurma ve otomatik geri acilma:** Ayarlardan "Hesabimi dondur" >
  "Evet, dondur" -> oturumun kapandigini gor -> yeniden giris yap ->
  uygulamaya **dogrudan** girdigini gor (dondurulmus ekrani
  cikmamali - karar 66).
- **Askidaki hesap ekrani:** moderasyon tarafindan askiya alinmis bir
  hesapla giris yapinca sebep ve bitis tarihini gosteren ekranin
  cikmasi (bu ekran Plan 2'nin panel aksiyonlariyla birlikte daha
  anlamli test edilir, ama kendisi Plan 1'de yazildi).
- **Silme akisi:** "Hesabimi sil" ekraninda yanlis parolayla hata
  mesaji, dogru parolayla silme, ayni telefonla yeniden kayit
  olunabilmesi. **Not:** bu akisin veritabani/sunucu tarafi zaten iki
  ayri canli turda dogrulandi (asagida madde 2); burada kalan yalnizca
  arayuz kablolamasinin gozle dogrulanmasi.
- **Gizlilik ekrani:** Ayarlardan "Gizlilik metni" acilinca
  moderasyonun kotuye kullanim incelemesinde mesaj okuyabilecegi
  maddesinin gercekten gorundugunu dogrulamak.
- **"Silinmis kullanici" gosterimi:** silinen bir kullanicinin eski
  konusmalarinda karsi tarafin ekraninda "Silinmis kullanici" yazdigini
  gozle gormek (veritabani tarafi `test:gorunurluk` senaryo 56'da
  kapsaniyor, arayuz tarafi degil).

## 2. Gercek hesap silme zaten iki ayri canli turda dogrulandi

Bu madde bir eksik DEGIL, gelecekte tekrar "silme hic canlida
denenmedi" sanilmasin diye buraya kayit dusuluyor: tam silme akisi
(yanlis parolayla red, dogru parolayla silme, ayni telefonla yeniden
kayit) ve parola dogrulama yolunun kendisi (`hesap-sil` Edge
Function'inin `signInWithPassword`i sunucuda gercekten cagirdigi), ikisi
de atilabilir test hesaplariyla canli dogrulandi.

## 3. Parola deneme tavani yok

`hesap-sil` Edge Function'i parolayi `signInWithPassword` ile sinar
ama kendi basina bir deneme sinirlamasi tasimiyor. Gecerli bir erisim
jetonuna sahip bir saldirgan (orn. calinmis bir oturum) teorik olarak
parolayi sinirsiz deneyebilir. Ilk fren Supabase GoTrue'nun kendi rate
limit'i; ayri bir tavan eklenmedi.

## 4. Storage silme hatasi islemi durdurmuyor

`hesap-sil` fonksiyonu profil ve check-in fotograflarini Storage'dan
silerken bir `remove` cagrisi basarisiz olursa akis DURMUYOR, hata
loglanip devam ediliyor. Sonuc: bazi durumlarda oksuz bir dosya
Storage'da kalabilir (kullaniciya artik baglı degil, ama URL'i bilen
erisebilir). Kabul edilen bir risk; `auth.users` satirini silmenin
Storage temizliginden daha oncelikli oldugu kararina dayaniyor.

## 5. `hesap_durumlari_kaynak` CHECK'inin dusurulen yarisi

Spec'teki kisit `moderator_id`'nin `askida`/`yasakli` durumlarinda
`not null`, `dondurulmus`ta `null` olmasini zorluyor. Bu kisit
veritabaninda duruyor, ama **Plan 2'nin sorumlulugu**: moderasyon
askiya alma RPC'si (`moderasyon_hesabi_askiya_al`) `moderator_id`'yi
`auth.uid()`'den ZORUNLU doldurmali - bu RPC henuz yazilmadi (Plan 2
kapsaminda).

## 6. Dondur -> geri ac dongusu "suresi dolmus aski" satirini erken silebilir

`hesabimi_geri_ac`, kullanici giris yaptiginda yalnizca kendi
`dondurulmus` satirini siler (guvenlik icin gerekli - askidaki biri
kendi askisini kaldiramasin diye). Ama bir yan etki var: eger
kullanicinin `hesap_durumlari` satiri zaten suresi dolmus bir `askida`
kaydiysa (yani `moderasyon.hesap_aktif_mi` zaten `true` donuyor) ve
kullanici sonra dondurup hemen geri donerse, panel listesindeki
"suresi dolmus aski, 90 gun sakla" kaydi normalden erken silinebilir.
Kucuk bir bilgi kaybi; Plan 2'nin panel listesi tasarlanirken akilda
tutulmali.

## 7. Gizlilik metnindeki basvuru kanali yer tutucu

`docs/gizlilik-metni.md` bunu kendi icinde acikca soyluyor ("bu, yayin
oncesi eklenmesi gereken acik bir bosluktur"). Gercek bir destek kanali
(e-posta, form) olmadan uygulama gercek kullaniciya acilmamali.
Ayrinti: `docs/kvkk-uyum-listesi.md` madde 1.

## 8. gizlilik-metni.md:80 "gunluk calisan" yanlis kelime

Metin, check-in suresi dolanlari aniya ceviren `pg_cron` isini "gunluk
calisan" diye tarif ediyor; gercekte is 10 dakikada bir calisiyor. Tek
kelimelik bir duzeltme bekliyor, davranissal bir kusur degil.

## 9. Erisim ve tasinabilirlik hakki (KVKK m.11) hala yok

Kullanici kendi verisinin bir kopyasini talep edebiliyor (gizlilik
metninde yazili) ama bunun icin uygulama icinde otomatik bir akis yok;
talep manuel karsilaniyor. Ayrinti: `docs/kvkk-uyum-listesi.md` madde 6.

## 10. Yurt disi aktarim mekanizmasi (m.9) ve VERBIS hukukcu onayi bekliyor

Iki aktarim var (Supabase eu-central-1, Expo Push ABD) ve ikisi de
gizlilik metninde bildiriliyor, ama KVKK m.9'un istedigi hukuki
mekanizma (standart sozlesme, Kurum bildirimi) kurulmadi. VERBIS
muafiyeti de dogrulanmadi. Ikisi de bir danismana sorulmali. Ayrinti:
`docs/kvkk-uyum-listesi.md` madde 3 ve 9.

## 11. Enforcement-noktasi denetiminde bulunan uc test bosluğu

Task 18 Step 2'nin surec denetimi sirasinda bulundu (otomatik bir kacak
kontrolu degil, spec'in kendi uyarisi - "Riskler" madde 2). Spec'teki
8 yazma kapisi ve 5 gorunurluk yolunun **hepsi** ilgili migrasyonda
DOGRU uygulanmis (asagida migrasyon satiriyla dogrulandi), ama
`test:gorunurluk` icinde ucunun kendi senaryosu yok:

| Kapi | Migrasyon (dogru uygulanmis) | Eksik olan |
|---|---|---|
| `bag.yazabilir_mi` (gate 6 - askidaki kullanici mesaj gonderemez, askidaki birine de mesaj gitmez) | `20260822091000_hesap_aktif_yazma_kapilari_bag.sql` | Hicbir senaryo `mesaj_gonder`i askıda bir kullaniciyla cagirmiyor. Senaryo 45-52 araligi yalnizca `takip_istegi_gonder`, `check_in_yap`, `mekan_ekle`, `kullanici_adi_degistir`, `takip_istegini_yanitla`, profil update, arama/profil/liste/yogunluk RPC'lerini test ediyor. |
| `public.sohbet_istegini_yanitla` (gate 5'in yarisi) | `20260822093000_hesap_aktif_yanit_rpcleri.sql` | Senaryo 48 yalnizca `takip_istegini_yanitla`yi askıda test ediyor; `sohbet_istegini_yanitla` icin ayni kontrol koda eklendi (dosyada goruluyor) ama askıda bir kullaniciyla canli cagrilmadi. |
| Storage `profil-fotograflari` insert politikasi (gate 8) | `20260822094000_hesap_aktif_profil_ve_storage.sql` | `test:gorunurluk` icinde `profil-fotograflari`ya dosya yukleyen tek yer senaryo 18 (imzali URL testi), askıda degilken calisiyor. Askıda bir kullanicinin yukleme denemesi hic sinanmadi. |

Uc kapi da migrasyon dosyasi okunarak dogrulandi (SQL'de kontrol satiri
var, kod dogru), yani **davranissal bir kusur oldugu bilinmiyor** -
eksik olan yalnizca canli, otomatik kanit. Plan 2'nin
`test:gorunurluk` genisletmesi sirasinda ya da bagimsiz bir kucuk isle
bu ucune senaryo eklenmeli.
