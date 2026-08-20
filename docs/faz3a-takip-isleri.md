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

## 2. Kapatildi (2026-08-20)

Bu bolumdeki iki eksik ozellik ve asagidaki kucuk maddelerin cogu
kapatildi. Uc gorevlik bir turda yapildi, her biri ayrica incelendi.

### 2a. Gonderilmis sohbet istegi geri cekilebiliyor - KAPANDI

Yeni `public.sohbet_istegini_geri_cek(p_kullanici_id)` RPC'si yalnizca
gonderenin KENDI `beklemede` satirini siliyor. Ekranlarda bekleyen giden
istek artik hareketsiz metin degil, "Istegi geri cek" butonu; takip icin
`takibi_birak` (zaten `durum`a bakmadan siliyordu), sohbet icin yeni RPC.

**Onemli degismezlik:** geri cekme gunluk istek kotasini IADE ETMIYOR.
`istek_gunlugu` ekle-only kaliyor ve RPC ona dokunmuyor. Iade etseydi
"gonder -> geri cek -> sayac dussun -> tekrarla" ile gunluk 50 istek
tavani tamamen atlatilirdi; tavanin bu bicimi Faz 3a'da tam olarak bu
istismari kapatmak icin secilmisti. Bu ozelligi ileride degistiren
herkes bunu korumali.

### 2b. `bagDurumunuGetir` gelen yonu de okuyor - KAPANDI

Donus tipi genisletildi (mevcut alanlar korundu): `takip`, `sohbet`
yaninda artik `gelenTakip`, `gelenSohbet` da var. Dort sorgu
`Promise.all` ile paralel. Profilde gelen bekleyen istek icin "Kabul et"
/ "Reddet" butonlari ve `Kabul edersen check-in'lerini gorebilecek.`
metni geliyor.

**Dikkat - takip TEK YONLU, sohbet SIMETRIK.** Birinin seni takip
ediyor olmasi senin onu takip ettigin anlamina gelmez, dolayisiyla
`gelenTakip` `kabul` ya da `beklemede` iken profilde "Takip et"
gostermek DOGRU. Sohbet oyle degil: kabul edilmis bir sohbet iki taraf
icin de aciktir, o yuzden "Sohbet acik" hem `sohbet` hem `gelenSohbet`
`kabul` oldugunda cikiyor. Bu ayrimi bozmak bu turda iki kez az kalsin
yapilan hataydi.

### Kapatilan kucuk maddeler

- Uc RPC'de (`ani_gorunurlugunu_ayarla`, `check_in_yap`,
  `sikayet_gonder`) `x not in (...)` kontrolu NULL girdide sessizce
  atlaniyordu; hepsi `is null or` ile guclendirildi. `sikayet_gonder`'in
  `p_sebep` ve `p_hedef_id` parametrelerine de dogrulama eklendi.
- `check_inler` uzerindeki olu `"kendi check-in'ini guncelleyebilir"`
  UPDATE politikasi dusuruldu. Artik hicbir sey vermiyordu ama
  "kullanicilar kendi check-in'lerini guncelleyebilir" diye okunuyordu;
  birisi ona bakip sutun yetkisini geri verirse kritik konum acigi
  yeniden acilirdi.
- `istek_gunlugu` icin gunluk budama isi eklendi (`istek-gunlugu-buda`,
  her gun 04:00, **2 gunden** eskiyi siler). 1 gun degil 2: tavan 24
  saatlik kayan pencereyi sayiyor, tam 1 gunde budamak sinirdaki
  satirlari erken silip kotayi gevsetirdi.
- Ayarlardaki "Butun anilarimi kim gorsun" satirinin altina aciklama
  notu eklendi: secilen deger her aniya oldugu gibi uygulanmiyor, gizli
  check-in'den gelenler kapali kaliyor.
- `bagDurumunuGetir`'in iki ardisik sorgusu `Promise.all` ile
  paralellesti.

## 3. Hala acik kucuk maddeler

- `lib/bag-listeleri.ts` icindeki `kimlikleriOku` bes parametresinden
  ucu ayni tipte ve benzer adli string; konumsal bir yer degistirme
  sessizce derlenir. Dosya bir daha acildiginda nesne argumanina
  gecirilmesi iyi olur.
- Ana ekran rozeti, yalnizca `.length` icin `bag_kisileri` RPC'siyle tam
  kisi kayitlarini cozuyor (kategori basina bir gidis-donus). Ana ekran
  acilisi yavaslarsa "yalnizca say" yolu eklenebilir.
- `kullanici/[id].tsx` ve `baglar.tsx` bazi stilleri birebir
  tekrarliyor. Kod tabaninin mevcut ekran basi stil uslubuyla tutarli;
  ortak modul acmak istenirse ayri bir is.
- Gorunurluk paketinin kendi kotasini tuketmesine kalici cozum
  yapilmadi (asagida, bolum 4). Istek gonderen senaryolarin hesaplari
  donusumlu kullanmasi ya da paketin kendi kotasini yonetici anahtariyla
  temizlemesi gerekirdi.

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
