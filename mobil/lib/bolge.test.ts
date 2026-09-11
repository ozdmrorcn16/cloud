import { bolgeMetni } from './bolge'

/**
 * "YASADIGIN BOLGE" profilde tek satirda gorunuyor.
 *
 * IKISI BIRDEN ya da HICBIRI: yalnizca ilce secilmis bir profil
 * anlamsiz olurdu ("Nilüfer" hangi ilde?). Kural sunucuda bir CHECK
 * kisitiyla da zorlaniyor; buradaki fonksiyon ayni kurali GOSTERIM
 * tarafinda uyguluyor - eksik veri gelirse satiri hic cizmiyor.
 */
describe('bolgeMetni', () => {
  it('ilce ve ili birlestiriyor', () => {
    expect(bolgeMetni('Bursa', 'Nilüfer')).toBe('Nilüfer, Bursa')
  })

  it('ilce yoksa satir cizilmiyor', () => {
    expect(bolgeMetni('Bursa', null)).toBeNull()
  })

  it('il yoksa satir cizilmiyor', () => {
    expect(bolgeMetni(null, 'Nilüfer')).toBeNull()
  })

  it('ikisi de yoksa satir cizilmiyor', () => {
    expect(bolgeMetni(null, null)).toBeNull()
  })
})
