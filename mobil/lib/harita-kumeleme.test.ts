import { kumele, kumeSiniri, KUME_HUCRE_PX } from './harita-kumeleme'

const n = (id: string, lat: number, lng: number) => ({ id, lat, lng })

describe('kumele', () => {
  // 390 px eninde 0.02 derece gorunuyor -> hucre ~0.00287 derece.
  const lngDelta = 0.02
  const en = 390

  it('ayni hucreye dusen mekanlari tek kumede toplar, sayi uye sayisidir', () => {
    const kumeler = kumele(
      [n('a', 40.2, 28.9), n('b', 40.2001, 28.9001), n('c', 40.2002, 28.9002)],
      lngDelta,
      en
    )
    expect(kumeler).toHaveLength(1)
    expect(kumeler[0].uyeler).toHaveLength(3)
    expect(kumeler[0].id.startsWith('kume:')).toBe(true)
  })

  it('uzak mekanlar tekil kalir', () => {
    const kumeler = kumele([n('a', 40.2, 28.9), n('b', 40.21, 28.92)], lngDelta, en)
    expect(kumeler).toHaveLength(2)
    expect(kumeler.every((k) => k.uyeler.length === 1)).toBe(true)
    // Tekil ignenin anahtari mekanin kendi id'si.
    expect(kumeler.map((k) => k.id).sort()).toEqual(['a', 'b'])
  })

  it('secili mekan HIC kumelenmez, komsulari kumelenir', () => {
    const kumeler = kumele(
      [n('a', 40.2, 28.9), n('b', 40.2001, 28.9001), n('c', 40.2002, 28.9002)],
      lngDelta,
      en,
      'b'
    )
    const secili = kumeler.find((k) => k.id === 'b')
    expect(secili?.uyeler).toHaveLength(1)
    const kume = kumeler.find((k) => k.id !== 'b')
    expect(kume?.uyeler.map((u) => u.id).sort()).toEqual(['a', 'c'])
  })

  it('yakinlasinca (kucuk lngDelta) kume dagilir', () => {
    const noktalar = [n('a', 40.2, 28.9), n('b', 40.2001, 28.9001)]
    expect(kumele(noktalar, 0.02, en)).toHaveLength(1)
    expect(kumele(noktalar, 0.0005, en)).toHaveLength(2)
  })

  it('olcu bilinmiyorsa (ilk cizim) her igne tekil', () => {
    const kumeler = kumele([n('a', 40.2, 28.9), n('b', 40.2, 28.9)], 0, 0)
    expect(kumeler).toHaveLength(2)
  })

  it('hucre boyu KUME_HUCRE_PX piksele denk gelir', () => {
    // 2 hucre boyu uzaktaki iki nokta ayri kalmali, yarim hucre yakini ayni.
    const hucreDerece = (lngDelta / en) * KUME_HUCRE_PX
    const ayri = kumele([n('a', 40, 28), n('b', 40, 28 + 2 * hucreDerece)], lngDelta, en)
    expect(ayri).toHaveLength(2)
  })

  it('kume merkezi uyelerin ortalamasidir', () => {
    const [k] = kumele([n('a', 40.0, 28.0), n('b', 40.0002, 28.0002)], lngDelta, en)
    expect(k.lat).toBeCloseTo(40.0001, 6)
    expect(k.lng).toBeCloseTo(28.0001, 6)
  })
})

describe('kumeSiniri', () => {
  it('uyeleri kapsayan kutuyu doner', () => {
    expect(kumeSiniri([n('a', 40.1, 28.1), n('b', 40.3, 27.9)])).toEqual({
      kuzey: 40.3,
      guney: 40.1,
      dogu: 28.1,
      bati: 27.9,
    })
  })
})
