# android — nerede kaldik

Bu klasor **yarim**. Oturum, Gradle iskeleti kurulduktan sonra kullanicinin
istegiyle durduruldu; Kotlin kaynak dosyalari henuz yazilmadi.

## Hazir olanlar

- `settings.gradle.kts`, `build.gradle.kts`, `gradle.properties`
- `gradle/libs.versions.toml` — surum katalogu:
  AGP 8.7.3, Kotlin 2.0.21, Compose BOM 2024.12.01,
  `com.wireguard.android:tunnel:1.0.20230706`, OkHttp 4.12.0,
  kotlinx-serialization 1.7.3, security-crypto 1.1.0-alpha06

## Yapilmayanlar (sirada bunlar var)

1. `gradle/wrapper/` — `gradle wrapper` ile uretilecek (JDK 21 ve Gradle
   konteynerde vardi).
2. `app/build.gradle.kts` — compileSdk 35, minSdk 26, `buildConfig = true`.
   Supabase URL ve anon key `local.properties`'ten okunup `BuildConfig`'e
   gomulecek (depoya girmeyecek).
3. `app/src/main/AndroidManifest.xml` — `INTERNET` izni.
4. Kotlin kaynaklari, paket `com.ozdmr.vpn`:
   - `MainActivity.kt` — Compose host + `VpnService.prepare()` izin akisi
   - `ui/AnaEkran.kt` — tek ekran: giris, sunucu listesi, baglan/kes
   - `ui/AnaViewModel.kt` — durum yonetimi
   - `data/Modeller.kt` — `Sunucu`, `TunelYapilandirmasi`
   - `data/VpnDepo.kt` — OkHttp ile Supabase REST:
     `POST /auth/v1/token?grant_type=password`, `GET /rest/v1/servers`,
     `POST /functions/v1/issue-config`
   - `data/AnahtarDeposu.kt` — `EncryptedSharedPreferences` ile ozel anahtar
   - `tunel/TunelYoneticisi.kt` — `GoBackend` sarmalayicisi

## Alinan iki karar

**Supabase Kotlin SDK kullanilmiyor.** Yerine OkHttp + kotlinx.serialization
ile dogrudan REST cagriliyor. Sebep: SDK'nin 2.x modul adlari
(`gotrue-kt` / `auth-kt`) surumden surume degisti; REST uclari ise sabit.
Bagimlilik sayisi da az kaliyor.

**Kendi `VpnService` sinifimiz yok.** `com.wireguard.android:tunnel`
kutuphanesi `GoBackend$VpnService`'i kendi manifest'inde zaten tanimliyor;
ikinci bir `VpnService` tanimlamak catisir. Uygulamanin yazmasi gereken kisim
`VpnService.prepare(context)` izin akisi ve `GoBackend.setState(...)`
cagrisi — `TunelYoneticisi` bunu sarmalayacak. Kendi servisimizi istersek
GoBackend yerine cekirdek modulu arka ucuna gecmek gerekir; su asamada
gerekmiyor.

## Tunel kurulumunun ozeti

Edge Function `conf` metnini `PrivateKey = ` satiri **bos** doner. Cihaz
kendi ozel anahtarini o satira yazip `Config.parse(...)` ile ayristirir,
sonra `GoBackend.setState(tunel, Tunnel.State.UP, config)` cagirir.
Ozel anahtar cihazdan hic cikmaz.
