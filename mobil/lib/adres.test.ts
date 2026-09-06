import { adresiBirlestir } from './adres'
import type * as Location from 'expo-location'

/** Test icin kisa yol: eksik alanlar undefined kalsin. */
function adres(p: Partial<Location.LocationGeocodedAddress>) {
  return p as Location.LocationGeocodedAddress
}

/**
 * ADRES BIRLESTIRME.
 *
 * Bu modul 2026-08-31'de bir kez SILINMISTI: cihazin adres cozumu
 * yanlis mahalle donduruyordu ve adres kimse dogrulamadan ekranda
 * gosteriliyordu. 2026-09-06'da geri geldi ama artik yalnizca bir
 * ONERI - kullanici goruyor, duzeltiyor, onayliyor.
 */
describe('adresiBirlestir', () => {
  it('sokak, kapi numarasi ve mahalleyi birlestirir', () => {
    expect(
      adresiBirlestir(adres({ street: '613. Sk', name: 'No:9', district: 'Alaaddinbey' }))
    ).toBe('613. Sk No:9 Alaaddinbey')
  })

  /**
   * `name` cogu saglayicida sokakla AYNI geliyor; iki kez yazmak
   * "613. Sk 613. Sk" gibi bir satir uretirdi.
   */
  it('name sokakla ayniysa tekrar etmez', () => {
    expect(adresiBirlestir(adres({ street: '613. Sk', name: '613. Sk' }))).toBe('613. Sk')
  })

  it('yalnizca mahalle varsa onu doner', () => {
    expect(adresiBirlestir(adres({ district: 'Alaaddinbey' }))).toBe('Alaaddinbey')
  })

  /**
   * IL VE ULKE BILEREK DISARIDA: mekan zaten kullanicinin bulundugu
   * yerde ve ekranda ilce/il ayrica gosteriliyor.
   */
  it('il ve ulkeyi ALMAZ', () => {
    const sonuc = adresiBirlestir(
      adres({ street: '613. Sk', city: 'Bursa', region: 'Bursa', country: 'Türkiye' })
    )
    expect(sonuc).toBe('613. Sk')
  })

  /** Hicbir parca yoksa `null` - cagiran alani bos birakiyor. */
  it('hicbir sey bulunamazsa null doner', () => {
    expect(adresiBirlestir(adres({}))).toBeNull()
  })

  it('bosluktan ibaret alanlari yok sayar', () => {
    expect(adresiBirlestir(adres({ street: '   ', district: 'Alaaddinbey' }))).toBe(
      'Alaaddinbey'
    )
  })
})
