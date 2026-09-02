import { Platform } from 'react-native'
import { supabase } from './supabase'

/**
 * APPLE VE GOOGLE ILE GIRIS.
 *
 * Kullanicinin istegi (2026-09-01). Yol olarak NATIVE giris secildi,
 * tarayici akisi degil:
 *   - iOS'ta Apple'in kendi sistem ekrani aciliyor (Face ID ile tek
 *     dokunus); Apple bu deneyimi tercih ediyor.
 *   - Google iki platformda da kendi yerel ekranini aciyor.
 *   - Tarayici akisi ayrica ALAN ADI DOGRULAMASI isterdi; native akis
 *     istemiyor, yani slooin.com alinmadan da calisiyor.
 *
 * Her iki saglayici da bize bir KIMLIK JETONU (id token) veriyor;
 * Supabase'e `signInWithIdToken` ile o jeton gonderiliyor. Parola yok,
 * dogrulama postasi yok - saglayici kimligi zaten dogrulamis oluyor.
 *
 * HANGI DUGME NEREDE (kullanicinin karari): iOS'ta Apple + Google,
 * Android'de yalnizca Google. Apple iOS'ta ZORUNLU - App Store, baska
 * bir sosyal giris sunuluyorsa "Apple ile giris"in de bulunmasini sart
 * kosuyor.
 *
 * DURUM - CANLI DOGRULANMADI: bu kod yazildiginda saglayici anahtarlari
 * (Google Cloud OAuth istemcisi, Apple Services ID + .p8) HENUZ YOKTU
 * ve Supabase'de saglayicilar acik degildi. Yani akis mock'lu testlerle
 * dogrulandi, GERCEK bir girisle degil. Bu projede tam olarak bu sinif
 * hata yasandi (66 test yesilken ekran canlida hic calismiyordu), o
 * yuzden anahtarlar geldiginde gercek cihazda denenmeden "calisiyor"
 * denmemeli.
 */

export type Saglayici = 'apple' | 'google'

/** Kullaniciya gosterilecek saglayicilar. */
export function saglayicilar(): Saglayici[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

/**
 * Saglayici yapilandirilmamissa firlatilan hata.
 *
 * Ayri bir tur olmasinin sebebi: ekranin "bu yontem su an
 * kullanilamiyor" ile "giris basarisiz" durumlarini ayirt edebilmesi.
 * Ilki bizim eksigimiz, ikincisi kullanicinin islemi.
 */
export class SaglayiciHazirDegil extends Error {
  constructor(saglayici: Saglayici) {
    super(`${saglayici} girisi yapilandirilmamis`)
    this.name = 'SaglayiciHazirDegil'
  }
}

/** Kullanici vazgectiginde firlatilir; ekran bunu HATA olarak gostermez. */
export class Vazgecildi extends Error {
  constructor() {
    super('vazgecildi')
    this.name = 'Vazgecildi'
  }
}

/**
 * Apple ile giris - iOS'a ozel.
 *
 * `expo-apple-authentication` dinamik olarak yukleniyor: modul yalnizca
 * iOS derlemesinde var ve web/Android paketinde import edilmesi
 * gereksiz yere pakete girmesine yol acardi.
 */
async function appleIle(): Promise<void> {
  if (Platform.OS !== 'ios') throw new SaglayiciHazirDegil('apple')

  const AppleAuth = await import('expo-apple-authentication')

  if (!(await AppleAuth.isAvailableAsync())) {
    // Cihazda Sign in with Apple kapali ya da desteklenmiyor.
    throw new SaglayiciHazirDegil('apple')
  }

  let kimlik
  try {
    kimlik = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
    })
  } catch (e) {
    // Kullanici sistem ekranini kapattiginda Apple bu kodu donduruyor.
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') throw new Vazgecildi()
    throw e
  }

  if (!kimlik.identityToken) throw new SaglayiciHazirDegil('apple')

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: kimlik.identityToken,
  })
  if (error) throw error
}

/**
 * Google ile giris - iki platformda da.
 *
 * ONEMLI: Google yalnizca ILK girişte tam profil veriyor ve id token'i
 * her seferinde yeniliyor; bizim ihtiyacimiz olan tek sey id token,
 * onu da her cagrida aliyoruz.
 */
async function googleIle(): Promise<void> {
  const { GoogleSignin, statusCodes } = await import(
    '@react-native-google-signin/google-signin'
  )

  const webIstemci = process.env.EXPO_PUBLIC_GOOGLE_WEB_ISTEMCI_ID
  if (!webIstemci) {
    // Anahtar yoksa Google'a hic gitmiyoruz: kullaniciyi bos bir
    // ekrana goturup hata aldirmaktansa burada durmak dogru.
    throw new SaglayiciHazirDegil('google')
  }

  GoogleSignin.configure({
    // Supabase id token'i DOGRULARKEN web istemcisini bekliyor; iOS
    // istemcisi ayrica gerekiyor ama o eklenti tarafindan (iosUrlScheme)
    // veriliyor.
    webClientId: webIstemci,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_ISTEMCI_ID,
  })

  try {
    await GoogleSignin.hasPlayServices()
    const sonuc = await GoogleSignin.signIn()
    const jeton = sonuc.data?.idToken
    if (!jeton) throw new SaglayiciHazirDegil('google')

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: jeton,
    })
    if (error) throw error
  } catch (e) {
    const kod = (e as { code?: string })?.code
    if (kod === statusCodes.SIGN_IN_CANCELLED) throw new Vazgecildi()
    if (kod === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new SaglayiciHazirDegil('google')
    }
    throw e
  }
}

/** Tek giris noktasi: ekran yalnizca bunu cagiriyor. */
export async function saglayiciylaGirisYap(saglayici: Saglayici): Promise<void> {
  if (saglayici === 'apple') return appleIle()
  return googleIle()
}
