import ayarlar from '../app.json'

/**
 * YAYIN AYARLARI - magazadaki kullanicinin GORDUGU SURUMU belirliyor.
 *
 * Bu dosyadaki iddialar kozmetik degil: yanlis ayar, magazadan
 * indiren kullanicinin ilk acilista ESKI bir surum gormesine yol
 * aciyor ve bu OTA ile duzeltilemiyor - yeni bir native derleme
 * gerekiyor. Yani buradaki bir hata en pahali hata sinifina giriyor.
 */
describe('yayin ayarlari', () => {
  const expo = ayarlar.expo as {
    version: string
    runtimeVersion?: { policy?: string }
    updates?: {
      url?: string
      checkAutomatically?: string
      fallbackToCacheTimeout?: number
    }
  }

  /*
   * KULLANICI EN SON HALI GORMELI (kullanicinin karari 2026-09-10:
   * "magazaya ciktiginda en sonki halini kullanici gormeli").
   *
   * Varsayilan davranis bunu VERMIYOR: `fallbackToCacheTimeout`
   * tanimsizken 0 sayiliyor, yani uygulama acilista guncellemeyi
   * BEKLEMIYOR - arka planda indirip BIR SONRAKI acilista uyguluyor.
   * Sonucu, yeni kuran herkesin ilk acilista derleme anindaki surumu
   * gormesi. Kullanici bunu gercek bir cihazda yasadi (2026-09-10,
   * TestFlight build 7).
   */
  it('acilista guncelleme BEKLENIYOR: ilk acilis da guncel', () => {
    expect(expo.updates?.fallbackToCacheTimeout).toBeGreaterThan(0)
  })

  /*
   * UST SINIR DA VAR. Bekleme suresi acilis ekranini uzatiyor; agi
   * yavas bir kullanici her acilista bu kadar bekleyebilir. 8 sn
   * secildi: yavas bir baglantida paketin inmesine yetiyor ama acilis
   * "donmus" hissi vermiyor. Sinirsiz buyutmek "hiz ve akicilik"
   * kuralini bozardi.
   */
  it('bekleme suresi acilisi kilitleyecek kadar uzun DEGIL', () => {
    expect(expo.updates?.fallbackToCacheTimeout).toBeLessThanOrEqual(10000)
  })

  it('guncelleme her acilista kontrol ediliyor', () => {
    expect(expo.updates?.checkAutomatically).toBe('ON_LOAD')
  })

  /*
   * RUNTIME POLITIKASI `appVersion`: OTA yalnizca AYNI surum
   * numarasini tasiyan derlemelere iner. `version` degistirildiginde
   * eski derlemeler guncelleme almayi birakir - bu bilincli bir
   * davranis (native taraf degistiyse eski JS oraya uymaz), ama surum
   * numarasi yalnizca YENI DERLEME alinacaksa artirilmali.
   */
  it('runtime politikasi appVersion', () => {
    expect(expo.runtimeVersion?.policy).toBe('appVersion')
  })

  it('guncelleme adresi tanimli', () => {
    expect(expo.updates?.url).toContain('u.expo.dev')
  })
})
