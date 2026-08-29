# Gercek harita (iOS + Android) - tasarim

Tarih: 2026-08-30. Kullanicinin karari: "Burdaki haritayi gercek konumu
gosteren harita yapmaliyiz iosta ve androidde calisan" ve secenekler
arasinda **A: Apple Haritalar + Google Haritalar** (`react-native-maps`).
Web'de gercek harita ISTENMEDI ("2.si olucak"); web'de mevcut radar
cizimi kaliyor.

## Karar ozeti

| Platform | Motor | Anahtar | Maliyet |
|---|---|---|---|
| iOS | Apple Haritalar (react-native-maps varsayilan saglayici) | yok | ucretsiz |
| Android | Google Haritalar (react-native-maps, Google saglayici) | Google Cloud'dan Maps SDK for Android anahtari | mobil SDK ucretsiz; faturalandirma hesabi acmak sart (kart baglanir, ucret cekilmez) |
| Web | mevcut `CanliHarita` radar cizimi | - | - |

Elenen secenek B (MapLibre + OpenFreeMap): tamamen anahtarsiz ve tek
gorunumlu olurdu; kullanici A'yi secti.

## Mimari

Platform dosya uzantisiyla ayrisiyor; ekranlar HIC degismiyor:

```
src/tasarim/CanliHarita.tsx          -> web (mevcut radar; Metro web'de bunu secer)
src/tasarim/CanliHarita.native.tsx   -> iOS + Android (react-native-maps)
```

Iki dosya ayni arayuzu disari veriyor:

```ts
type HaritaMekani = { id; ad; konum: {lat,lng} | null; kisiSayisi }
CanliHarita({ merkez, mekanlar, yukseklik = 260, onMekanSec })
```

`HaritaMekani` tipi ve igne secim kurali (`EN_FAZLA_IGNE = 12`, once
kalabaliklar sonra en yakinlar, cakisanlar elenir) web dosyasinda
kaliyor; native dosya ayni kurali kendi icinde uyguluyor (cakisma
elemesi native'de yok - gercek haritada kullanici yakinlastirabilir).

### Native bilesen davranisi

- `merkez` null iken harita CIZILMEZ; ayni yukseklikte bos bir yuzey
  durur (konum henuz gelmemis).
- Harita `merkez` ve en uzak ignenin mesafesine gore cerceveleniyor;
  `merkez` ya da mekanlar degisince `animateToRegion` ile kaydiriliyor.
  Ilk cizimde `initialRegion`.
- **Kaydirma kapali, yakinlastirma acik.** Harita bir ScrollView'un
  icinde 260 px'lik bir kart; tek parmakla kaydirma sayfa kaydirmasiyla
  cakisiyordu. Igneler dokunulabilir kaliyor.
- Merkez ISARETI bizim turuncu ignemiz (`Marker`, anchor alt-orta).
  Sistemin mavi "kullanici konumu" noktasi KAPALI: iki isaret iki farkli
  sey soylerdi ve harita ekraninda (`harita/[mekanId]`) merkez zaten
  kullanicinin degil mekanin konumu.
- Mekan igneleri: kisi varsa turuncu balon icinde sayi, yoksa gri
  nokta - web'deki gorunumun aynisi. `accessibilityLabel` ayni.
- YUZ YOK (mevcut karar): igneler yalnizca sayi tasiyor.
- Harita mobilyasi sade: pusula, trafik, binalar, iOS'ta ilgi noktasi
  etiketleri kapali; Android'de Google'in kendi ilgi noktasi etiketleri
  `customMapStyle` ile gizli. Sebep: bizim mekan igneleri Google'in
  kendi mekan etiketleriyle karismasin.
- Olcek etiketi (web'de "1,7 km") native'de YOK: gercek harita mesafe
  hissini kendisi veriyor.

### Yapilandirma

- `app.config.js` eklendi; `app.json`'u oldugu gibi alir ve uzerine
  `react-native-maps` eklentisini ekler. Android anahtari
  `GOOGLE_MAPS_ANDROID_ANAHTARI` cevre degiskeninden okunur -
  **anahtar depoya YAZILMAZ** (depo public). Yerelde `mobil/.env`,
  EAS'te `eas env:create` ile tanimlanir.
- Anahtar yoksa derleme yine calisir; Android'de harita zemini bos
  (gri) gorunur, igneler yine cizilir. iOS etkilenmez.
- iOS icin Google anahtari VERILMIYOR; Apple Haritalar kullaniliyor.

### Test

- `jest.setup.js` icinde `react-native-maps` global mock: `MapView`
  bir View, `Marker` dokunulabilir bir View (onPress'i gecirir).
  jest-expo iOS ontanimli oldugu icin ekran testleri artik NATIVE
  bileseni render ediyor; web radarinin testleri (varsa) `.tsx`
  dosyasini dogrudan import etmeli.
- Yeni test `__tests__/tasarim/CanliHarita.native.test.tsx`: merkez
  yokken harita yok; en fazla 12 igne; kalabalik igne sayiyi gosterir;
  igneye basinca `onMekanSec` cagrilir; merkez ignesi vardir.
- Gercek dogrulama cihazda: iOS icin TestFlight derlemesi
  (`eas build --platform ios --profile production`), Android icin
  anahtar tanimlandiktan sonra `eas build --platform android --profile
  preview`.

## Gizlilik / KVKK (dort soru)

- **Hangi veri:** kullanicinin cihaz konumu (merkez) ve yakindaki
  mekanlarin konumlari. Yeni bir veri toplanmiyor; bu veriler zaten
  radar cizimi icin cihazda vardi.
- **Hangi dayanak:** mevcut konum izni ve aydinlatma metni; degismedi.
- **Ne kadar sure:** harita saglayiciya yalnizca goruntulenecek bolge
  (harita karesi) gider; Apple/Google bu istekleri kendi politikalarina
  gore isler. Uygulama tarafinda ek saklama yok.
- **Kim gorur:** Apple (iOS) ve Google (Android) harita karesi
  istegini gorur - kullanicinin kimligi degil, ekranin baktigi bolge.
  Gizlilik metnine "harita zemini Apple Haritalar / Google Haritalar
  tarafindan saglanir" satiri eklenmeli (magaza incelemesi de bunu
  bekler). Bu, ayri bir "sonra" maddesi degil, bu isin parcasi.
