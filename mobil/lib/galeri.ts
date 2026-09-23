/**
 * TELEFONUN SON FOTOGRAFLARI (2026-09-22, kullanicinin referansi
 * "02 / Fotoğraf seç"): hikayeye eklenecek fotograf uygulamanin KENDI
 * izgarasinda secilsin diye galeri okunuyor.
 *
 * `expo-media-library` NATIVE bir modul: OTA ile GELMEZ, yalnizca onu
 * iceren bir derlemede vardir.
 *
 * COKME DERSI (2026-09-23, kullanicinin bildirimi "Slooin coktu diye
 * uyari geldi hikaye eklemeye calisinca"): modulu `try/catch` icinde
 * `require` etmek YETMIYOR. Yeni mimaride (bridgeless) eksik bir native
 * modulu istemek JS'te yakalanamayan olumcul bir hataya donusebiliyor.
 *
 * IKINCI DERS (ayni gun, kullanicinin bildirimi "hala boyle goruunuyor"):
 * `globalThis.expo.modules` diye ELLE bakmak da YANLIS - o JSI nesnesi
 * TEMBEL kuruluyor (`ensureNativeModulesAreInstalled`). Kurulum
 * yapilmadan bakilinca modulu ICEREN derlemede bile "yok" cikiyordu.
 * Dogrusu expo-modules-core'un bu is icin yazilmis API'si:
 * `requireOptionalNativeModule` once kurulumu garantiliyor, modul yoksa
 * null donuyor ve HIC atmiyor.
 */

type MedyaModulu = {
  getPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain?: boolean }>
  requestPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain?: boolean }>
  getAssetsAsync: (secenekler: {
    first: number
    mediaType: string[]
    sortBy: string[]
  }) => Promise<{ assets: { id: string; uri: string }[] }>
  MediaType: { photo: string }
  SortBy: { creationTime: string }
}

let modul: MedyaModulu | null | undefined

/** Native taraf bu derlemede kayitli mi. `requireOptionalNativeModule`
 *  kurulumu garantiliyor ve modul yoksa null donuyor - atmiyor. */
function nativeKayitliMi(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (ad: string) => unknown
    }
    return requireOptionalNativeModule('ExpoMediaLibrary') != null
  } catch {
    return false
  }
}

function moduluAl(): MedyaModulu | null {
  if (modul !== undefined) return modul
  if (!nativeKayitliMi()) {
    modul = null
    return modul
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modul = require('expo-media-library') as MedyaModulu
    if (typeof modul?.getAssetsAsync !== 'function') modul = null
  } catch {
    modul = null
  }
  return modul
}

/** Bu derlemede uygulama ici galeri izgarasi cizilebilir mi. */
export function galeriKullanilabilirMi(): boolean {
  return moduluAl() !== null
}

/**
 * Son N fotograf (en yeniden eskiye). Izin yoksa once istenir; izin
 * verilmezse BOS dizi doner - cagiran ekran sistem secicisine duser.
 */
export async function sonFotograflariGetir(adet = 30): Promise<{ id: string; uri: string }[]> {
  const m = moduluAl()
  if (!m) return []
  try {
    let izin = await m.getPermissionsAsync()
    if (!izin.granted) izin = await m.requestPermissionsAsync()
    if (!izin.granted) return []
    const sonuc = await m.getAssetsAsync({
      first: adet,
      mediaType: [m.MediaType.photo],
      sortBy: [m.SortBy.creationTime],
    })
    return sonuc.assets.map((a) => ({ id: a.id, uri: a.uri }))
  } catch {
    return []
  }
}
