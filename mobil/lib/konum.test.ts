import { mesafeMetre } from './konum'

describe('mesafeMetre', () => {
  it('ayni noktada 0 doner', () => {
    expect(mesafeMetre(41.015, 28.979, 41.015, 28.979)).toBe(0)
  })

  it('bilinen iki nokta arasindaki mesafeyi yaklasik dogru hesaplar', () => {
    // Istanbul Taksim (41.0370, 28.9850) - Kadikoy (40.9903, 29.0275) ~ 6.4 km
    const mesafe = mesafeMetre(41.037, 28.985, 40.9903, 29.0275)
    expect(mesafe).toBeGreaterThan(6000)
    expect(mesafe).toBeLessThan(6800)
  })

  it('100 metre gibi kucuk mesafeleri dogru ayirt eder', () => {
    // ~90 m kuzeye kaydirilmis nokta
    const mesafe = mesafeMetre(41.015, 28.979, 41.0158, 28.979)
    expect(mesafe).toBeGreaterThan(50)
    expect(mesafe).toBeLessThan(150)
  })
})
