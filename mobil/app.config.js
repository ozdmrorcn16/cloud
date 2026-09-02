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
