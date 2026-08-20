# Faz 3a - kapanistan sonra kalan isler

Faz 3a (bag: takip/sohbet istekleri, uc kademeli gorunurluk) tamamlandi:
18 gorev, hepsi incelendi, ardindan dalin tamami ayrica incelendi ve o
incelemenin bulgulari da kapatildi. Bu dosya, **bilerek** yapilmayanlari
ve gelecege birakilanlari tutar. Ayrinti icin `CLAUDE.md` icindeki
"Faz 3a TAMAMLANDI" bolumune bak.

## 1. Yapilmamis elle dogrulama (en onemli acik)

Iki hesapla tarayicida gezinme hic yapilmadi; etkilesimli oldugu ve
telefon kodlu iki ayri giris gerektirdigi icin insan lazim. Bu adim Faz
2a, 2b ve 2c'de de atlanmisti ve Faz 2a'da tam bu yuzden canli
veritabaninda hic calismayan bir ekran yayinlanmisti.

Dogrulanmasi gereken bes senaryo:

1. A, B'nin profilinden "Takip et" der; B'nin "Baglar" ekraninda istek
   gorunur ve yaninda "Kabul edersen check-in'lerini gorebilecek." yazar.
2. B kabul eder; A, B'nin canli check-in'ini **mekana gitmeden** gorur.
3. B `bulunurluk = 'gizli'` ile check-in yapar; A goremez.
4. B, A'yi takipcilerinden cikarir; A yine goremez.
5. A, B'yi engeller; iki tarafta da bag kaybolur.

Bu bes senaryonun **veritabani tarafi** `npm run test:gorunurluk`
icindeki 82 dogrulamada zaten kapsaniyor (ozellikle senaryo 19-28 ve 31).
Acikta kalan yalnizca arayuz kablolamasinin gozle dogrulanmasi.

Nasil calistirilir:

    cd mobil
    npx expo start --web --clear --port 8084

Test numaralari `05550000000` ve `05550000001`, sifre `mobil/.env`
icindeki `TEST_HESAP_SIFRESI`. Gezinti bitince sunucuyu kapat - acik
kalan bir dev sunucusu tam Jest kosumlarinda zaman asimi uretiyor.

## 2. Bilerek yapilmayan iki ozellik

Ikisi de final incelemede bulundu. Ikisi de **kirik** bir sey degil,
**eksik** ozellik: ne spec ne plan bunlari istiyor. Faz kapanisinda
gozden gecirilmemis yuzey acmamak icin disarida birakildilar; karar
kullanicinin.

### 2a. Gonderilmis sohbet istegi geri cekilemiyor

`sohbet_istegini_yanitla` yalnizca `alan_id = auth.uid()` satirlarini
esliyor, `sohbet_istekleri` tablosunda insert/delete politikasi yok ve
baska hicbir RPC o tabloya dokunmuyor. Yani B, A'ya sohbet istegi
gonderdikten sonra geri alamiyor: istek A yanitlayana ya da biri
digerini engelleyene kadar A'nin kutusunda duruyor ve
`sohbet_istegi_gonder` surekli "Istegin zaten gonderilmis" diyor.

Cekirdek riski yabancilarla istenmeyen temas olan bir uygulamada
"yanlislikla gonderdim, geri al" onemsiz bir eksik degil.

Takip istegi tarafinda ilkel mevcut: `takibi_birak` `durum`a bakmadan
siliyor. Ama hicbir ekran onu bekleyen bir istek icin cagirmiyor -
`baglar.tsx` giden istekleri hareketsiz metin olarak, `kullanici/[id].tsx`
"Istek gonderildi"yi `Pressable` degil `View` olarak ciziyor.

Gerekecek: `sohbet_istegini_geri_cek` RPC'si + iki ekranda bekleyen
durumun basilabilir hale gelmesi.

### 2b. `bagDurumunuGetir` yalnizca giden yonu okuyor

`lib/bag.ts` iliskiyi yalnizca "ben baslatan miyim" yonunden okuyor.
Karsi taraf sana istek gondermisse profilinde yine "Takip et" gorunuyor
ve basinca caprazlanmis bir bekleyen cift olusuyor - onlarinkini kabul
etmek yerine.

Gerekecek: gelen yonun de okunmasi ve profilde bir "Kabul et" akisi.

## 3. Kucuk, kapatilmamis maddeler

- `ani_gorunurlugunu_ayarla(p_deger)` icindeki
  `p_deger not in (...)` kontrolu `p_deger` NULL oldugunda NULL'a
  dusuyor, yani gecersiz-deger korumasi atlaniyor. Elle yazilmis bir
  `rpc(..., { p_deger: null })` cagrisi guncellemeye ulasip
  `gorunurluk` sutunundaki `not null` kisitina carpiyor ve dostane mesaj
  yerine ham `23502` donduruyor. Kismi yazma yok, gorunurluk genislemesi
  yok, gizlilik etkisi yok. `p_deger is null or p_deger not in (...)`
  kapatir. Ayni desen `check_in_yap` icinde de var.
- `check_inler` uzerindeki `"kendi check-in'ini guncelleyebilir"` UPDATE
  politikasi hala duruyor ama UPDATE **yetkisi** kaldirildigi icin artik
  olu. Hicbir sey vermiyor. **Ama ileride okuyan birini yaniltabilir:**
  "kullanicilar kendi check-in'lerini guncelleyebilir" diye okunuyor, ki
  bu tam da final incelemenin curuttugu inanc. Birisi bu politikaya
  bakip sutun yetkisini geri verirse kritik acik yeniden acilir. Ayri
  bir migrasyonda dusurulmesi oneriliyor.
- Ayarlardaki "Butun anilarimi kim gorsun" secimi, RPC bazi satirlari
  daha dar bir degere kelepceledigi halde **istenen** degeri secili
  gosteriyor (`gizli` kokenli bir ani `kimse` kalirken "Herkes gorsun"
  secili gorunuyor). Toplu islemin dogasi geregi tek bir dogru deger
  gostermek mumkun degil; satirin altina kisa bir aciklama notu
  belirsizligi kaldirirdi.
- `lib/bag-listeleri.ts` icindeki `kimlikleriOku` bes parametresinden
  ucu ayni tipte ve benzer adli string; konumsal bir yer degistirme
  sessizce derlenir. Dosya bir daha acildiginda nesne argumanina
  gecirilmesi iyi olur.
- `istek_gunlugu` satirlari suresiz birikiyor; 1 gunden eski satirlari
  silen bir pg_cron isi yok. Kullanici basina gunde en fazla 50 satir
  oldugu icin hacim onemsiz, ama tablo bir daha ellendiginde eklenebilir.
- Ana ekran rozeti, yalnizca `.length` icin `bag_kisileri` RPC'siyle tam
  kisi kayitlarini cozuyor (kategori basina bir gidis-donus). Ana ekran
  acilisi yavaslarsa "yalnizca say" yolu eklenebilir.

## 4. Faz 3a'da ogrenilen ve bir daha kesfedilmemesi gereken seyler

Bunlar `CLAUDE.md` icinde de var; burada ozet:

- `npx tsc --noEmit` bu projenin dogrulama setinin parcasi. Jest bu
  sinif hatayi **yapisal olarak** goremiyor: ekran testleri `lib`
  modullerini mock'ladigi icin degisen bir fonksiyon imzasi uygulamayi
  iki gorev boyunca derlenemez birakti ve 185 test yesil kaldi. Taban
  durum: `@types/node` kurulu olmadigi icin var olan bes hata.
- Calisan bir `expo start --web` sunucusu tam Jest kosumlariyla islemci
  icin yarisiyor ve araliklarla 5000 ms render zaman asimlari
  dogurabiliyor. Ama tek sebep o degil: sunucu kapatildiktan sonra da
  bir kez gorundu. Bir ekran paketi duserse once **tek basina** calistir.
- Supabase MCP sunucusu bagliyken canli veritabanina dogrudan SQL
  atilabiliyor. Eski notlardaki "uzaktan SQL calistirmanin yolu yok"
  maddesi **gecersiz**. Bu fazdaki en degerli dogrulamalarin cogu
  bununla yapildi (yetki kontrolleri, politika govdeleri, cron gecmisi).
- **`test:gorunurluk` kendi kendini zehirliyor; gunde ~8 kez
  calistirilabilir.** Paketin senaryolari gercek takip ve sohbet istegi
  gonderiyor, bunlar da gunluk 50 istek tavanindan dusuyor. Tavan
  ekle-only `istek_gunlugu` tablosunu sayiyor ve istemci o satirlari
  **tasarim geregi** silemiyor (RLS acik, politika yok). Yani her kosum
  kotadan yiyor ve birikiyor; kota dolunca senaryo 19, 21, 22, 24, 26 ve
  28 zincirleme duser ve paket **yanlis alarm** verir.

  2026-08-20'de tam bunu yasadik: uc saatte on kosum yapilmis, hesap
  50/50'ye dayanmis, bir alt ajan bunu "migrasyonum bir seyi kirdi mi"
  diye arastirmak zorunda kalmisti. Bir dusme gorursen **once kotayi
  kontrol et**, kodu degil.

  Olcmek icin:

      select count(*) from public.istek_gunlugu
      where gonderen_id = '<A hesabinin id>'
        and olusturuldu > now() - interval '1 day';

  Temizlemek icin (yalnizca yonetici erisimiyle; Supabase MCP bagliysa
  `execute_sql` ile):

      delete from public.istek_gunlugu where gonderen_id = '<A hesabinin id>';

  Bu silme urun degismezligini bozmuyor: ekle-only ozelligi ISTEMCIYE
  karsi zorlanan bir kural ve o kural yerinde kaliyor. Kalici cozum,
  istek gonderen senaryolarin hesaplari donusumlu kullanmasi ya da
  paketin kendi kotasini yonetici anahtariyla temizlemesi olurdu; ikisi
  de yapilmadi.

- `npm run test:gorunurluk --tavan` ayrica ve **bilerek** yikici: tek
  kosumda 50 kalici satir yaziyor, yani gunun geri kalanini tek basina
  bitiriyor. Yalnizca tavan davranisini dogrulamak icin, bilerek
  calistirilir.
- Uygulanmis bir migrasyon dosyasini duzenlemek ise yaramaz; `db push`
  yalnizca daha once calistirmadigi dosyalari calistirir. Duzeltme her
  zaman yeni dosyayla.
