import { eFormatinaCevir } from './telefon'

describe('eFormatinaCevir', () => {
  it('basinda 0 olan 11 haneli numarayi +90 formatina cevirir', () => {
    expect(eFormatinaCevir('05551234567')).toBe('+905551234567')
  })

  it('basinda 0 olmayan 10 haneli numarayi +90 formatina cevirir', () => {
    expect(eFormatinaCevir('5551234567')).toBe('+905551234567')
  })

  it('bosluklu ve tireli girisi temizler', () => {
    expect(eFormatinaCevir('0555 123 45 67')).toBe('+905551234567')
  })

  it('gecersiz uzunluktaki numara icin null doner', () => {
    expect(eFormatinaCevir('12345')).toBeNull()
  })

  it('zaten +90 ile baslayan numarayi oldugu gibi kabul eder', () => {
    expect(eFormatinaCevir('+905551234567')).toBe('+905551234567')
  })
})
