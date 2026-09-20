import AsyncStorage from '@react-native-async-storage/async-storage'
import { kendiKullaniciIdim } from './profil'

/**
 * MESAFE SECIMI CIHAZDA SAKLANIYOR (kullanicinin bildirimi 2026-09-20:
 * "mesafede hep 1 km secili; en son hangisi seciliyse o gosterilsin").
 * Tur suzgeciyle AYNI desen (`tur-suzgeci-depo.ts`): cihazda, hesaba
 * bagli anahtar, bilinmeyen deger atilir. Kisisel veri degil - yalnizca
 * bir metre degeri.
 */
const ANAHTAR_ONEKI = 'slooin.mesafe-secimi'

async function anahtar(): Promise<string | null> {
  const kimlik = await kendiKullaniciIdim()
  return kimlik ? `${ANAHTAR_ONEKI}.${kimlik}` : null
}

/** Okunan deger `izinli` listesinde degilse null (cagiran varsayilana duser). */
export async function mesafeSeciminiOku(izinli: readonly number[]): Promise<number | null> {
  try {
    const k = await anahtar()
    if (!k) return null
    const ham = await AsyncStorage.getItem(k)
    if (!ham) return null
    const deger = Number(ham)
    return izinli.includes(deger) ? deger : null
  } catch {
    return null
  }
}

export async function mesafeSeciminiYaz(metre: number): Promise<void> {
  try {
    const k = await anahtar()
    if (!k) return
    await AsyncStorage.setItem(k, String(metre))
  } catch {
    // Yazilamamasi ekrani engellemez; secim bir sonraki acilista hatirlanmaz.
  }
}
