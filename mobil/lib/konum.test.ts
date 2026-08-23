import { mesafeMetre, noktayiCoz } from './konum'

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

describe('noktayiCoz', () => {
  // GERCEK HATA (2026-08-23, kullanici telefonda buldu): PostgREST
  // geography sutununu WKT olarak DEGIL, hex EWKB olarak donduruyor.
  // Ayristirici yalnizca WKT bekledigi icin "Mekanlari kesfet" ekrani
  // "Beklenmeyen konum formati: 0101000020E6100000..." ile patliyordu.
  //
  // Asagidaki dize canli veritabanindan gelen gercek bir degerdir
  // (Bursa civari bir mekan).
  it('hex EWKB degerini cozer (PostgREST in gercekte dondurdugu bicim)', () => {
    const nokta = noktayiCoz('0101000020E61000000000004056CF3C400000000015194440')
    expect(nokta.lng).toBeCloseTo(28.81, 1)
    expect(nokta.lat).toBeCloseTo(40.196, 2)
  })

  it('SRID tasimayan WKB degerini de cozer', () => {
    // 0101000000 = little endian, point, SRID bayragi YOK
    const nokta = noktayiCoz('01010000000000004056CF3C400000000015194440')
    expect(nokta.lng).toBeCloseTo(28.81, 1)
    expect(nokta.lat).toBeCloseTo(40.196, 2)
  })

  it('WKT bicimini cozmeye devam eder (geriye donuk uyum)', () => {
    const nokta = noktayiCoz('POINT(28.9784 41.0082)')
    expect(nokta.lng).toBeCloseTo(28.9784, 4)
    expect(nokta.lat).toBeCloseTo(41.0082, 4)
  })

  it('gercekten anlamsiz bir deger icin hata firlatir', () => {
    expect(() => noktayiCoz('bilinmeyen')).toThrow(/Beklenmeyen konum/)
  })
})
