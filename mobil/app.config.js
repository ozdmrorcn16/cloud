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
 * ACIK BORC - APPLE ILE GIRIS entitlement'i GECICI OLARAK KAPALI
 * (2026-09-07).
 *
 * `app.json` icinde `ios.usesAppleSignIn: true` vardi ve derlemeyi
 * KIRIYORDU. Xcode\'un verdigi hata aynen soyleydi:
 *
 *   Provisioning profile "[expo] com.slooin.app AppStore
 *   2026-08-29T22:52:14.006Z" doesn't include the Sign In with Apple
 *   capability / the com.apple.developer.applesignin entitlement.
 *
 * Sebep: profile 29 Agustos\'ta, o satir eklenmeden ONCE uretilmisti;
 * icinde o yetki yok. Build 3 bu yuzden gecmis, 4 ve 5 bu yuzden
 * patlamisti.
 *
 * Satir kaldirildi cunku o an CALISAN bir islevi yoktu: Apple ile
 * giris Supabase tarafinda zaten etkin degil, dugmeye basinca "Bu
 * giris yontemi su an kullanilamiyor" donuyor. Yani kayip sifir,
 * kazanc TestFlight\'in yeniden calisir hale gelmesi.
 *
 * GERI ACMAK ICIN (magazaya cikmadan ONCE yapilmali - iOS\'ta baska
 * bir sosyal giris sunuluyorsa App Store "Apple ile giris"i ZORUNLU
 * tutuyor):
 *   1. developer.apple.com > Certificates, IDs & Profiles >
 *      Identifiers > com.slooin.app > "Sign In with Apple" isaretle,
 *      Save.
 *   2. `app.json` icindeki `ios` blokuna `"usesAppleSignIn": true`
 *      geri konur.
 *   3. Yeni bir derleme alinir; EAS profile\'i capability ile birlikte
 *      yeniden uretir.
 *
 * `expo-apple-authentication` paketi ve ekrandaki dugme YERINDE
 * duruyor - yalnizca entitlement kapali.
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
      // EN SONDA olmali: expo-apple-authentication'in kendi plugin'i
      // entitlement'i kosulsuz ekliyor ve bu onu geri siliyor. Once
      // calissaydi silinen anahtar yeniden eklenirdi. Gerekce ve geri
      // acma adimlari dosyanin kendi basinda.
      './plugins/apple-signin-entitlement-kaldir',
    ],
  }
}
