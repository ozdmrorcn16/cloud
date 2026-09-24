import { etiketYerlesimi, birlikteParcalari, ETIKET_RESIM_CAPI as CAP, ETIKET_ADIMI as ADIM } from './etiket-yerlesimi'

/** Iki satirlik baslik: ikinci satir "check-in yapti." 120 pt. */
const satirlar = [
  { x: 0, y: 0, width: 250, height: 24 },
  { x: 0, y: 24, width: 120, height: 24 },
]

describe('etiketYerlesimi', () => {
  it('tek kisi: resim son satirin DEVAMINDA (8 bosluk), son ek yaninda', () => {
    const y = etiketYerlesimi({ satirlar, kapEn: 280, adet: 1, onEkEn: 0, sonEkEn: 70 })
    expect(y.resimler).toEqual([{ x: 128, y: 24 }])
    expect(y.sonEk).toEqual({ x: 128 + CAP + 6, y: 24 })
    expect(y.onEk).toBeNull()
    expect(y.boy).toBe(48)
  })

  it('iki ve daha fazla kisi ust uste biner (adim < cap)', () => {
    const y = etiketYerlesimi({ satirlar, kapEn: 400, adet: 3, onEkEn: 0, sonEkEn: 70 })
    expect(y.resimler.map((r) => r.x)).toEqual([128, 128 + ADIM, 128 + 2 * ADIM])
    expect(ADIM).toBeLessThan(CAP)
  })

  it('SATIR DOLUNCA resimler ALT SATIRDAN devam eder, sikismaz', () => {
    const y = etiketYerlesimi({ satirlar, kapEn: 280, adet: 12, onEkEn: 0, sonEkEn: 70 })
    const ustSatir = y.resimler.filter((r) => r.y === 24)
    const altSatir = y.resimler.filter((r) => r.y > 24)
    expect(ustSatir.length).toBeGreaterThan(0)
    expect(altSatir.length).toBeGreaterThan(0)
    expect(altSatir[0].x).toBe(0)
    // Hicbir resim tasmaz; adim her yerde ayni.
    for (const r of y.resimler) expect(r.x + CAP).toBeLessThanOrEqual(280)
    // Son ek son resimle ayni satirda ve sigiyor.
    const sonR = y.resimler[y.resimler.length - 1]
    expect(y.sonEk!.y).toBe(sonR.y)
    expect(y.sonEk!.x + 70).toBeLessThanOrEqual(280)
    expect(y.boy).toBe(sonR.y + CAP)
  })

  it('son ek TEK BASINA alt satira dusmez: son resimle birlikte iner', () => {
    // 128 + CAP sigar ama 128 + CAP + 6 + 70 sigmaz.
    const y = etiketYerlesimi({ satirlar, kapEn: 200, adet: 1, onEkEn: 0, sonEkEn: 70 })
    expect(y.resimler[0]).toEqual({ x: 0, y: 48 + 4 })
    expect(y.sonEk!.y).toBe(y.resimler[0].y)
  })

  it('on ek (Ingilizce "with") ilk resimle ayni satirda', () => {
    const y = etiketYerlesimi({ satirlar, kapEn: 400, adet: 2, onEkEn: 30, sonEkEn: 0 })
    expect(y.onEk).toEqual({ x: 128, y: 24 })
    expect(y.resimler[0].x).toBe(128 + 30 + 6)
    expect(y.sonEk).toBeNull()
  })

  it('olcu yokken (ilk cizim) cokmez', () => {
    const y = etiketYerlesimi({ satirlar: [], kapEn: 0, adet: 3, onEkEn: 0, sonEkEn: 0 })
    expect(y.resimler).toHaveLength(3)
  })
})

describe('birlikteParcalari', () => {
  it('Turkce son ek, Ingilizce on ek', () => {
    expect(birlikteParcalari('{{adlar}} ile birlikte')).toEqual({ onEk: '', sonEk: 'ile birlikte' })
    expect(birlikteParcalari('with {{adlar}}')).toEqual({ onEk: 'with', sonEk: '' })
  })
})
