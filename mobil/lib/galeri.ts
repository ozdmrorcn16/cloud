/**
 * TELEFONUN SON FOTOGRAFLARI (2026-09-22, kullanicinin referansi
 * "02 / Fotoğraf seç"): hikayeye eklenecek fotograf uygulamanin KENDI
 * izgarasinda secilsin diye galeri okunuyor.
 *
 * `expo-media-library` NATIVE bir modul: OTA ile gelmiyor, yalnizca
 * onu iceren bir derlemede var. Bu yuzden modul DINAMIK yukleniyor ve
 * yoksa `galeriKullanilabilirMi()` false donuyor - ekran o zaman
 * sistem secicisine dusuyor, cokmuyor. Eski derlemelerdeki kullanici
 * icin davranis bugunkuyle ayni kaliyor.
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

function moduluAl(): MedyaModulu | null {
  if (modul !== undefined) return modul
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modul = require('expo-media-library') as MedyaModulu
    // Modul JS'te var ama native tarafi yoksa cagri patlar; varligi
    // fonksiyonlarindan anlasiliyor.
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
