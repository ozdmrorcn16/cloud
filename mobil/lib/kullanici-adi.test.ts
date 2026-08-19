import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiniNormallestir,
  kullaniciAdiGecerliMi,
} from './kullanici-adi'

describe('kullaniciAdiniNormallestir', () => {
  it('bastaki ve sondaki bosluklari atar', () => {
    expect(kullaniciAdiniNormallestir('  orcun  ')).toBe('orcun')
  })

  it('buyuk harfleri kucultur', () => {
    expect(kullaniciAdiniNormallestir('Orcun.Ozdemir')).toBe('orcun.ozdemir')
  })
})

describe('kullaniciAdiGecerliMi', () => {
  it('kucuk harf, rakam, nokta ve alt cizgiyi kabul eder', () => {
    expect(kullaniciAdiGecerliMi('orcun.ozdemir_16')).toBe(true)
  })

  it('3 karakterden kisayi reddeder', () => {
    expect(kullaniciAdiGecerliMi('or')).toBe(false)
  })

  it('20 karakterden uzunu reddeder', () => {
    expect(kullaniciAdiGecerliMi('a'.repeat(21))).toBe(false)
  })

  it('buyuk harfi reddeder', () => {
    expect(kullaniciAdiGecerliMi('Orcun')).toBe(false)
  })

  it('bosluk ve tire gibi karakterleri reddeder', () => {
    expect(kullaniciAdiGecerliMi('orcun ozdemir')).toBe(false)
    expect(kullaniciAdiGecerliMi('orcun-ozdemir')).toBe(false)
  })

  it('kural metni kullaniciya kurali aciklar', () => {
    expect(KULLANICI_ADI_KURALI).toContain('3-20')
  })
})
