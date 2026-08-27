import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * CIHAZ KIMLIGI - hiz sinirinin dar katmani icin.
 *
 * Neden var: hiz siniri yalnizca IP'ye bakarsa gercek kullanimda
 * yanlis calisir. Mobil operatorler CGNAT kullaniyor, yani yuzlerce
 * abone ayni genel IP'den cikiyor; kullanici sayisi arttikca ayni
 * operatordeki mesru kisiler birbirinin hakkini yemeye baslar.
 * Kullanicinin kurali (2026-08-27): "Gercek kullanima gore ayarlamak
 * gerekiyor her adimimizi", "Cok kullanici articak sekilde on gorerek".
 *
 * BU KIMLIK BIR SIR DEGIL VE GUVENLIK DAYANAGI DEGIL. Istemcide
 * uretiliyor, depolamayi temizleyen ya da dogrudan API'ye giden biri
 * yenisini uretir. Isi normal kullaniciyi IP kalabaligindan AYIRMAK;
 * kotu niyetliyi durduran sey sunucudaki genis IP katmanidir.
 * Kimlik gonderilmezse sunucu cihaz katmanini IP'ye baglar, yani
 * gondermemek bir kacis yolu olmaz.
 *
 * Kisisel veri degil: hicbir kisiyle iliskilendirilmiyor, sunucuda
 * yalnizca saatlik sayac kovasi olarak kullaniliyor ve bir saat sonra
 * siliniyor.
 */

const ANAHTAR = 'slooin.cihaz'

/** RFC 4122 v4 bicimi; kriptografik guc gerekmiyor (bkz. bas yorum). */
function yeniKimlik(): string {
  const g = globalThis.crypto
  if (g && typeof g.randomUUID === 'function') return g.randomUUID()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (k) => {
    const r = (Math.random() * 16) | 0
    return (k === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

let onbellek: string | null = null

/**
 * Cihazin kalici kimligini doner. Depolama okunamazsa `null` doner;
 * cagiran taraf bunu sunucuya hic gondermez.
 */
export async function cihazKimligi(): Promise<string | null> {
  if (onbellek) return onbellek

  try {
    const mevcut = await AsyncStorage.getItem(ANAHTAR)
    if (mevcut) {
      onbellek = mevcut
      return mevcut
    }
    const yeni = yeniKimlik()
    await AsyncStorage.setItem(ANAHTAR, yeni)
    onbellek = yeni
    return yeni
  } catch {
    // Ozel sekme, dolu depolama vb. Akisi kilitlemiyoruz.
    return null
  }
}
