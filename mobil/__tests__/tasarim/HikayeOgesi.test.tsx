import { parmakAraligi, yeniKonum } from '../../src/tasarim/HikayeOgesi'

/**
 * Sürüklenip boyutlandırılabilen hikâye etiketlerinin matematiği
 * (2026-09-22). Konumlar oransal tutuluyor; bu testler ekran boyu
 * değişince etiketin aynı yerde kalmasını ve ölçeğin sınırlar dışına
 * çıkmamasını kilitliyor.
 */
describe('parmakAraligi', () => {
  it('tek dokunusta 0 verir', () => {
    expect(parmakAraligi([{ pageX: 10, pageY: 10 }])).toBe(0)
    expect(parmakAraligi([])).toBe(0)
  })

  it('iki dokunus arasindaki uzakligi olcer', () => {
    expect(parmakAraligi([{ pageX: 0, pageY: 0 }, { pageX: 3, pageY: 4 }])).toBe(5)
  })
})

describe('yeniKonum', () => {
  const alan = { en: 400, boy: 800 }
  const baslangic = { x: 0.5, y: 0.5, olcek: 1 }

  it('kaymayi ORANA cevirir', () => {
    const k = yeniKonum(baslangic, { dx: 100, dy: 200 }, alan, 1)
    expect(k.x).toBeCloseTo(0.75)
    expect(k.y).toBeCloseTo(0.75)
  })

  it('ekranin disina TASMAZ', () => {
    const sag = yeniKonum(baslangic, { dx: 5000, dy: 5000 }, alan, 1)
    expect(sag.x).toBe(1)
    expect(sag.y).toBe(1)
    const sol = yeniKonum(baslangic, { dx: -5000, dy: -5000 }, alan, 1)
    expect(sol.x).toBe(0)
    expect(sol.y).toBe(0)
  })

  it('alan olculmediyse konum DEGISMEZ (0 bolme yok)', () => {
    const k = yeniKonum(baslangic, { dx: 100, dy: 100 }, { en: 0, boy: 0 }, 1)
    expect(k.x).toBe(0.5)
    expect(k.y).toBe(0.5)
  })

  it('olcek carpani uygulanir ama 0,5 - 3 arasinda kalir', () => {
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 2).olcek).toBe(2)
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 99).olcek).toBe(3)
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 0.01).olcek).toBe(0.5)
  })
})
