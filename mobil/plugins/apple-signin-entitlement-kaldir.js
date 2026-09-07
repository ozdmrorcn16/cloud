/**
 * GECICI: "Sign in with Apple" entitlement'ini uretilen iOS
 * yapilandirmasindan SILER.
 *
 * NEDEN VAR
 * ---------
 * `expo-apple-authentication` paketi kendi config plugin'ini tasiyor ve
 * autolinking onu KENDILIGINDEN uyguluyor. O plugin entitlement'i
 * KOSULSUZ ekliyor - `app.json` icindeki `ios.usesAppleSignIn` alanina
 * hic bakmiyor:
 *
 *     config.modResults['com.apple.developer.applesignin'] = ['Default']
 *
 * Bu yuzden `usesAppleSignIn` satirini kaldirmak derlemeyi KURTARMADI
 * (2026-09-07, build 6 ayni hatayla duestue). Entitlement paketten
 * geliyor, app.json'dan degil.
 *
 * Entitlement duruyor ama provisioning profile (29 Agustos'ta, o paket
 * eklenmeden once uretildi) o yetkiyi tasimiyor ve Xcode imzalarken
 * reddediyor:
 *
 *     Provisioning profile ... doesn't include the Sign In with Apple
 *     capability / the com.apple.developer.applesignin entitlement.
 *
 * BEDELI SIFIR: Apple ile giris Supabase tarafinda zaten etkin degil;
 * dugmeye basinca "Bu giris yontemi su an kullanilamiyor" donuyor.
 * Paket, ekran ve `lib/sosyal-giris.ts` icindeki kod OLDUGU GIBI
 * duruyor - yalnizca imzalanan entitlement cikiyor. Kod zaten
 * `isAvailableAsync()` false donunce zarifce vazgeciyor.
 *
 * KALDIRMA KOSULU - magazaya cikmadan ONCE yapilmali. iOS'ta baska bir
 * sosyal giris sunuluyorsa App Store "Apple ile giris"i ZORUNLU tutar.
 *
 *   1. developer.apple.com > Certificates, IDs & Profiles >
 *      Identifiers > com.slooin.app > "Sign In with Apple" > Save
 *   2. `app.json` icindeki `ios` blokuna "usesAppleSignIn": true geri
 *      konur
 *   3. Bu dosya `app.config.js` icindeki plugins listesinden CIKARILIR
 *   4. Yeni derleme alinir; EAS profile'i capability ile yeniden uretir
 *
 * SIRA ONEMLI: bu plugin, paketin kendi plugin'inden SONRA calismak
 * zorunda - yoksa sildigi anahtari o yeniden ekler. `app.config.js`
 * icinde listenin SONUNA konuyor ve dogrulamasi prebuild ciktisindaki
 * `ios/Slooin/Slooin.entitlements` dosyasiyla yapildi.
 */
const { withEntitlementsPlist } = require('expo/config-plugins')

module.exports = function appleSignInEntitlementKaldir(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['com.apple.developer.applesignin']
    return c
  })
}
