import { render, screen } from '@testing-library/react-native'
// jest-expo iOS ontanimli: bu import `.native.tsx` dosyasini cozer.
import { MekanKapakHarita } from '../../src/tasarim/MekanKapakHarita'

const KONUM = { lat: 40.19, lng: 29.06 }

/**
 * Kartin kare kucuk haritasi (kullanicinin istegi 2026-09-17).
 * Gercek harita jest'te cizilmiyor; dogrulanabilen sey MapView'e ne
 * verildigi - kadrajin MEKANIN USTUNDE olmasi ve kipin "liste icin
 * ucuz" olmasi.
 */
describe('MekanKapakHarita (native)', () => {
  it('kadraj mekanin tam ustunde ve sokak olceginde', async () => {
    await render(<MekanKapakHarita konum={KONUM} olcu={96} testID="kapak" />)

    const harita = screen.getByTestId('kapak-harita')
    const bolge = harita.props.initialRegion
    expect(bolge.latitude).toBe(KONUM.lat)
    expect(bolge.longitude).toBe(KONUM.lng)
    // 120 m yaricap -> ~240 m yukseklik. Sehir olcegine acilmamali.
    expect(bolge.latitudeDelta).toBeCloseTo(240 / 110540, 6)
    expect(bolge.latitudeDelta).toBeLessThan(0.01)
  })

  // jest-expo iOS ontanimli kosuyor: beklenen kip iOS'unki.
  it('liste icin ucuz kipte cizilir (iOS onbellekli, Android lite)', async () => {
    await render(<MekanKapakHarita konum={KONUM} olcu={96} testID="kapak" />)

    const harita = screen.getByTestId('kapak-harita')
    expect(harita.props.cacheEnabled).toBe(true)
    // Lite kip Android'e ait; iOS'ta acik kalmamali.
    expect(harita.props.liteMode).toBe(false)
  })

  it('cizilsin false ise harita KURULMAZ, kare yine ayni olcude durur', async () => {
    await render(<MekanKapakHarita konum={KONUM} olcu={96} cizilsin={false} testID="kapak" />)

    expect(screen.queryByTestId('kapak-harita')).toBeNull()
    const kutu = screen.getByTestId('kapak')
    expect(kutu.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 96, height: 96 })])
    )
  })

  it('konum yoksa harita kurulmaz', async () => {
    await render(<MekanKapakHarita konum={null} olcu={96} testID="kapak" />)

    expect(screen.queryByTestId('kapak-harita')).toBeNull()
    expect(screen.getByTestId('kapak')).toBeTruthy()
  })
})
