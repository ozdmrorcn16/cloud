import { ulkeleriGetir, ulkeAdi, TURKIYE } from './bolge'

/**
 * `bolgeMetni` KALDIRILDI (kullanicinin karari 2026-09-18 aksam): bolge
 * hicbir profilde gosterilmiyor, yalnizca hesap olusturmada seciliyor.
 * Geriye ulke listesi kaldi; o listenin iki kurali burada kilitli.
 */
describe('ulkeleriGetir', () => {
  it('Turkiye listenin basinda, kalanlar alfabetik', () => {
    const liste = ulkeleriGetir('tr')
    expect(liste[0].kod).toBe(TURKIYE)
    const kalan = liste.slice(1).map((u) => u.ad)
    expect(kalan).toEqual([...kalan].sort((a, b) => a.localeCompare(b, 'tr')))
  })

  it('ulke adi secilen dilde, bilinmeyen kod oldugu gibi', () => {
    expect(ulkeAdi('DE', 'tr')).toBe('Almanya')
    expect(ulkeAdi('DE', 'en')).toBe('Germany')
    expect(ulkeAdi(null, 'tr')).toBeNull()
    expect(ulkeAdi('ZZ', 'tr')).toBe('ZZ')
  })
})
