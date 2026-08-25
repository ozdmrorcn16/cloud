import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * "Ilk acilis ekrani gosterildi mi?" isareti.
 *
 * Kullanicinin karari (2026-08-25): ilk acilis ekrani uygulamayi ILK
 * INDIREN kisiye gosterilir ve bir daha gorunmez; kullanici uygulamayi
 * silip tekrar indirirse yeniden gorunur.
 *
 * Bu yuzden isaret CIHAZDA saklaniyor, hesapta degil:
 *  - Uygulama silininde AsyncStorage da silinir, yani "sil ve tekrar
 *    indir" durumunda ekran dogal olarak geri gelir.
 *  - Hesapta saklansaydi, hesabi olmayan biri (henuz kayit olmamis)
 *    icin saklanacak yer olmazdi.
 *
 * Not: cikis yapmak bu isareti SILMEZ. Cikan kullanici tanitim
 * ekranini degil giris ekranini gorur - dogru olan da budur.
 */
const ANAHTAR = 'slooin.ilkAcilisGosterildi'

export async function ilkAcilisGosterildiMi(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ANAHTAR)) === '1'
  } catch {
    // Saklama okunamazsa ekrani GOSTERME tarafina dusuyoruz: tanitim
    // ekranini bir kez fazla gostermek, uygulamayi acilmaz yapmaktan
    // iyidir.
    return true
  }
}

export async function ilkAcilisiIsaretle(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANAHTAR, '1')
  } catch {
    // Yazilamazsa ekran bir sonraki acilista tekrar cikar; kabul
    // edilebilir, akisi kirmiyor.
  }
}
