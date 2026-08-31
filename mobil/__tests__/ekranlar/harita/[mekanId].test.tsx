import { render, screen, waitFor } from '@testing-library/react-native'
import CheckInHaritasiEkrani from '../../../src/app/harita/[mekanId]'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir } from '../../../lib/mekan'
import { adresCoz } from '../../../lib/adres'

jest.mock('../../../lib/mekan', () => ({
  mekaniGetir: jest.fn(),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))
jest.mock('../../../lib/adres', () => ({ adresCoz: jest.fn() }))
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}))

const MEKAN = {
  id: 'mekan-1',
  ad: 'Nilüfer Tüvtürk Araç Muayene İstasyonu',
  tur: 'Araç muayene',
  semt: 'Nilüfer',
  adres: null,
  kaynak: 'foursquare',
  konum: { lat: 40.2106, lng: 28.9213 },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
  // Cevrede bir mekan var: haritada MERKEZ ignesinin yanina ikinci bir
  // igne cikiyor ve testler cevre state'inin oturdugunu bundan anliyor.
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-2', ad: 'Komşu Kafe', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 0 },
  ])
})

/**
 * Ekran iki bagimsiz async zincir isletiyor: adres cozumu ve cevre
 * mekanlari. Test yalnizca adresi bekliyor; cevre ondan SONRA oturuyor
 * ve beklenmezse React "act(...) disinda guncelleme" uyarisi basiyor.
 * Bos bir act() turu yetmiyor (zincir birden fazla mikro gorev
 * gerektiriyor), bu yuzden ignelerin gercekten cizilmesi bekleniyor.
 */
const cevreOturana = () =>
  waitFor(() => expect(screen.getAllByTestId('harita-ignesi').length).toBeGreaterThan(1))

describe('CheckInHaritasiEkrani', () => {
  it('mekanin tam adresini cihazdan cozup gosterir', async () => {
    // Kullanicinin istegi (2026-08-31): bu ekranda konumun tam adresi
    // gorunsun. Veritabanindaki adres alani cogu mekanda bos oldugu
    // icin adres KOORDINATTAN cozuluyor.
    ;(adresCoz as jest.Mock).mockResolvedValue(
      'Ataevler Mahallesi, İzmir Yolu Caddesi No:12, Nilüfer/Bursa'
    )

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => {
      expect(
        screen.getByText('Ataevler Mahallesi, İzmir Yolu Caddesi No:12, Nilüfer/Bursa')
      ).toBeTruthy()
    })
    // Cozum MEKANIN konumuyla yapilir, kullanicinin konumuyla degil.
    expect(adresCoz).toHaveBeenCalledWith(40.2106, 28.9213)
    await cevreOturana()
  })

  it('adres cozulemezse semt gorunmeye devam eder', async () => {
    // Ag yoksa, izin verilmemisse ya da web surumundeyse boyle olur.
    ;(adresCoz as jest.Mock).mockResolvedValue(null)

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer')).toBeTruthy())
    await cevreOturana()
  })
})
