import { Platform } from 'react-native'
import { File } from 'expo-file-system'

/**
 * Yerel bir dosya adresini (galeriden/kameradan gelen URI) ham baytlara
 * cevirir. Fotograf yukleyen iki yardimci da bunu kullaniyor.
 *
 * NEDEN BU DOSYA VAR (2026-08-30, TestFlight'taki ilk denemede
 * bulundu): eski `readAsStringAsync` SDK 54'te kullanimdan kalkti ve
 * gercek cihazda kirmizi bir uyariyla patliyor - "Profil fotografi
 * eklenmiyor". Tarayicida bu yol hic calismadigi icin fark
 * edilmemisti. Yeni API `File` sinifi; base64 ara adimi da gitti,
 * baytlar dogrudan okunuyor (daha az bellek, daha hizli).
 *
 * Web'de galeri secimi `blob:` adresi veriyor; onu tarayicinin kendi
 * `fetch`i okuyor.
 */
export async function dosyayiOku(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const yanit = await fetch(uri)
    return yanit.arrayBuffer()
  }
  return new File(uri).arrayBuffer()
}
