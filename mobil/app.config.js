/**
 * app.json'un UZERINE cevre degiskeninden gelen degerleri ekler.
 *
 * app.json statik; icine sir yazilamaz (depo public). Google Haritalar
 * Android anahtari bu yuzden buradan geliyor:
 *   - yerelde `mobil/.env` (gitignored) icinde GOOGLE_MAPS_ANDROID_ANAHTARI
 *   - EAS'te `eas env:create --environment production --name
 *     GOOGLE_MAPS_ANDROID_ANAHTARI --value ...` (preview icin de ayni)
 *
 * Anahtar yoksa derleme yine calisir; Android'de harita zemini bos
 * (gri) gorunur, igneler yine cizilir. iOS Apple Haritalar kullandigi
 * icin anahtardan hic etkilenmiyor.
 */
/**
 * APPLE ILE GIRIS ENTITLEMENT'I - 2026-09-12'de GERI ACILDI.
 *
 * 2026-09-07 ile 2026-09-12 arasinda kapaliydi: provisioning profile
 * 29 Agustos'ta, Sign In with Apple yetkisi eklenmeden ONCE uretilmisti
 * ve Xcode "profile doesn't include the Sign In with Apple capability"
 * diye derlemeyi kiriyordu. O donemde `plugins/apple-signin-entitlement-
 * kaldir.js` adli bir karsi plugin entitlement'i siliyordu.
 *
 * 2026-09-12'de developer.apple.com'da com.slooin.app kimligine "Sign
 * In with Apple" yetkisi ISARETLENDI (profile gecersiz kilindi; EAS bir
 * sonraki derlemede yeniden uretir), Services ID (com.slooin.app.web)
 * ve .p8 anahtari olusturuldu, Supabase'de Apple saglayicisi acildi.
 * Bu yuzden karsi plugin listeden CIKARILDI ve app.json'a
 * `ios.usesAppleSignIn: true` geri kondu. Dosya `plugins/` altinda
 * tarihsel kayit olarak duruyor; bir daha gerekirse listenin EN SONUNA
 * eklenmeli (once calissaydi sildigi anahtar yeniden eklenirdi).
 */
module.exports = ({ config }) => {
  const androidAnahtari = process.env.GOOGLE_MAPS_ANDROID_ANAHTARI

  // GOOGLE ILE GIRIS - eklenti YALNIZCA anahtar varken ekleniyor.
  //
  // Sebep somut: google-signin eklentisi iOS tarafinda `iosUrlScheme`
  // istiyor ve degeri Google Cloud'daki iOS istemcisinden geliyor
  // (ters cevrilmis client id: com.googleusercontent.apps.XXX). Anahtar
  // yokken eklentiyi kosulsuz eklemek prebuild'i kirardi; bu haliyle
  // anahtar gelene kadar derleme calismaya devam ediyor ve "Google ile
  // devam et" dugmesi yalnizca anlasilir bir hata veriyor.
  //
  // Deger sirdir, app.json'a YAZILMAZ (depo public); yerelde
  // mobil/.env, EAS'te `eas env:create --name GOOGLE_IOS_URL_SCHEME`.
  const googleIosSemasi = process.env.GOOGLE_IOS_URL_SCHEME

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', androidAnahtari ? { androidGoogleMapsApiKey: androidAnahtari } : {}],
      ...(googleIosSemasi
        ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosSemasi }]]
        : []),
    ],
  }
}
