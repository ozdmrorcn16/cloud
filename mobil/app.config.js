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

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', androidAnahtari ? { androidGoogleMapsApiKey: androidAnahtari } : {}],
    ],
  }
}
