# Gorunurluk testleri

Bu testler **gercek** Supabase projesine baglanir ve RLS kurallarinin
gercekten uygulandigini dogrular. `npm test` (Jest) icindeki testler
Supabase'i mock'lar; bu yuzden bir RLS hatasini yakalayamazlar.

Faz 2a'da tam olarak bu oldu: 66 Jest testi yesilken mekan detay ekrani
canli veritabaninda hic calismiyordu.

## Calistirma

```bash
cd mobil
npm run test:gorunurluk
```

`mobil/.env` icindeki `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` degerlerini kullanir. Ayrica
`TEST_HESAP_SIFRESI` de `mobil/.env` icinde tanimli olmali (asagidaki
"Test kullanicilari" bolumune bak); tanimli degilse betik anlamli bir
hatayla durur.

## Test kullanicilari

Faz 1'de tanimlanan ucretsiz test numaralari: `+905550000000` ve
`+905550000001`, ikisinin de SMS kodu `123456`. Betik yoksa olusturur.
Bu iki hesabin sifresi kod icinde gomulu degil; `mobil/.env` icindeki
`TEST_HESAP_SIFRESI` degiskeninden okunur.

## Senaryolar

1-10: Faz 2b (gorunurluk ve guvenlik) — canli check-in gorunurlugu, ani
gorunurlugu, engelleme, gizli check-in, mekan yogunlugu.

11-17: Faz 2c (kimlik ve kisi arama):

- **11 — Kullanici adi benzersizligi.** A, B'nin kullanici adini almaya
  calisir, sunucu reddeder.
- **12 — Bicim kurallari sunucuda zorunlu.** Gecersiz formatlar
  (`kullanici_adi_degistir`) ve buyuk/kucuk harf duyarsizligi
  (`kullanici_adi_musait_mi`) sunucu tarafinda reddedilir.
- **13 — 30 gun kurali sunucuda tutar.** Bkz. asagidaki "30 gun kurali
  neden dolayli test ediliyor" bolumu.
- **14 — Arama kullanici adi ve isimle bulur.** Kismi eslesme, tek
  karakterli aramanin bos donmesi, kullanicinin kendini bulamamasi.
- **15 — Aramada gorunme kapatilinca cikmaz.** `aramada_gorunsun = false`
  arama sonuclarindan cikarir; pozitif kontrol olarak geri acilinca
  yeniden gorunur.
- **16 — Engelleme aramayi iki yonde de keser.** Hem engelleyen hem
  engellenen taraf digerini aramada bulamaz.
- **17 — Kimliksiz cagrilar reddedilir.** Oturum acmamis ham bir anon
  istemciyle `kullanici_adi_musait_mi` ve `kisi_ara` cagrilari hata
  doner.

### 30 gun kurali neden dolayli test ediliyor

`kullanici_adi_degistir` basarili olursa hesap 30 gun kilitlenir ve
betik bir sonraki calismasinda ayni basarili sonucu **tekrar
uretemez**: betik iki (hatta daha fazla) kez ust uste calistirilabilir
olmali, ama ikinci calismada hesap zaten kilitli olacagi icin "basarili
degistirme" dogrudan iddia edilemez.

Bunun yerine senaryo 13, betigin kacinci kez calistigindan bagimsiz iki
iddiaya dayanir:

- Ilk cagri ya basarili olur (hesap daha once hic degistirilmemis ya da
  son degisiklikten 30 gunden fazla gecmis) ya da **yalnizca 30 gun
  mesajiyla** reddedilir — baska bir hata (bicim, benzersizlik) degil.
- Ikinci ardisik cagri **her durumda** 30 gun mesajiyla reddedilir:
  ilk cagri basarili olduysa zaman damgasi az once yazildi, olmadiysa
  zaten yakin gecmiste kalmisti — ikisinde de 30 gunun icindeyiz.

Bu yuzden senaryo 11'in aktoru bilerek **A**, senaryo 13'unku ise
**B**: RPC icinde 30 gun kontrolu benzersizlik kontrolunden once
calisiyor, dolayisiyla A'nin kullanici adi hicbir senaryoda
degistirilmezse (30 gun kilidi hic devreye girmezse) senaryo 11'in
"B'nin adini alamaz" iddiasi her calismada ayni "alinmis" mesajina
dayanir, 30 gun mesajina degil.

Ayrica senaryo 10, kendi ic mantigi geregi A -> B blogunu (engelleme)
kurulu birakarak bitiyor. Senaryo 11'den once bu blok kaldiriliyor,
cunku aksi halde senaryo 14/15'teki "A, B'yi arama sonuclarinda bulur"
pozitif kontrolleri blok yuzunden yanlislikla basarisiz olurdu. Senaryo
16 arama-engelleme etkilesimini kendi bloguyla acikca test ediyor ve
kendi temizligini `t.engellemeler` uzerinden kaydediyor.

Not: spec'in "kullanici adi sutunu dogrudan yazilamaz" ve
"aramada_gorunsun yazilabilir" maddeleri burada tekrarlanmiyor —
`sema-dogrula.ts` icinde, yine gercek veritabanina karsi calisan ayri
bir kontrolde duruyor.

## Dikkat

Bu testler canli veritabanina yazar ve sonunda kendi verisini siler.
Uretim verisi olan bir projede calistirma.
