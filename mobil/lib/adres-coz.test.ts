import { adresCoz } from './adres'

jest.mock('expo-location', () => ({ reverseGeocodeAsync: jest.fn() }))

const { reverseGeocodeAsync } = require('expo-location') as {
  reverseGeocodeAsync: jest.Mock
}

/**
 * Cihazin adres servisiyle konusan katman. Servis mock'lu - gercek
 * cagri testte yapilamaz; dogrulanan sey ONUN CIKTISININ nasil
 * yorumlandigi.
 */
describe('adresCoz', () => {
  beforeEach(() => reverseGeocodeAsync.mockReset())

  test('servisin verdigi parcalar tek satir adrese cevrilir', async () => {
    reverseGeocodeAsync.mockResolvedValue([
      {
        district: 'Ataevler Mahallesi',
        street: 'İzmir Yolu Caddesi',
        streetNumber: '12',
        subregion: 'Nilüfer',
        region: 'Bursa',
      },
    ])

    await expect(adresCoz(40.21, 28.92)).resolves.toBe(
      'Ataevler Mahallesi, İzmir Yolu Caddesi No:12, Nilüfer/Bursa'
    )
    expect(reverseGeocodeAsync).toHaveBeenCalledWith({ latitude: 40.21, longitude: 28.92 })
  })

  test('servis hic sonuc vermezse null doner', async () => {
    reverseGeocodeAsync.mockResolvedValue([])
    await expect(adresCoz(40.21, 28.92)).resolves.toBeNull()
  })

  test('servis hata verirse ekran patlamasin diye null doner', async () => {
    // Web surumunde ve ag yokken gercekten olan durum.
    reverseGeocodeAsync.mockRejectedValue(new Error('not supported'))
    await expect(adresCoz(40.21, 28.92)).resolves.toBeNull()
  })
})
