import { hesaplaYas, onSekizAltindaMi } from './yas'

describe('hesaplaYas', () => {
  it('dogum gunu henuz gelmediyse bir yas dusuk hesaplar', () => {
    const bugun = new Date('2026-08-13')
    const dogum = new Date('2008-08-14')
    expect(hesaplaYas(dogum, bugun)).toBe(17)
  })

  it('dogum gunu bugunse yeni yasi sayar', () => {
    const bugun = new Date('2026-08-13')
    const dogum = new Date('2008-08-13')
    expect(hesaplaYas(dogum, bugun)).toBe(18)
  })
})

describe('onSekizAltindaMi', () => {
  it('17 yasindaki kullaniciyi reddeder', () => {
    const bugun = new Date('2026-08-13')
    expect(onSekizAltindaMi(new Date('2009-01-01'), bugun)).toBe(true)
  })

  it('18 yasindaki kullaniciyi kabul eder', () => {
    const bugun = new Date('2026-08-13')
    expect(onSekizAltindaMi(new Date('2008-01-01'), bugun)).toBe(false)
  })
})
