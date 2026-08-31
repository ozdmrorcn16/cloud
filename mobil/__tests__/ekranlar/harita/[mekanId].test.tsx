import { render, screen, waitFor } from '@testing-library/react-native'
import CheckInHaritasiEkrani from '../../../src/app/harita/[mekanId]'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir } from '../../../lib/mekan'

jest.mock('../../../lib/mekan', () => ({
  mekaniGetir: jest.fn(),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}))

const MEKAN = {
  id: 'mekan-1',
  ad: 'Nilüfer Tüvtürk Araç Muayene İstasyonu',
  tur: 'Araç muayene',
  semt: 'Nilüfer',
  mahalle: null,
  il: 'Bursa',
  adres: null,
  kaynak: 'foursquare',
  konum: { lat: 40.2106, lng: 28.9213 },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-2', ad: 'Komşu', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 0 },
  ])
})

/**
 * Ekran iki bagimsiz async zincir isletiyor; test yalnizca adresi
 * bekliyor, cevre mekanlari ondan sonra oturuyor. Beklenmezse React
 * "act(...) disinda guncelleme" uyarisi basiyor.
 */
const cevreOturana = () =>
  waitFor(() => expect(screen.getAllByTestId('harita-ignesi').length).toBeGreaterThan(1))

describe('CheckInHaritasiEkrani', () => {
  /**
   * Kullanicinin karari (2026-08-31): "konumun üzerine basınca gelen
   * sayfada varsa tam adresi, yoksa ilçe il bilgisi... tutarlı olmalı."
   *
   * Adres CIHAZDAN COZULMUYOR. Onceki surum Apple/Google'in
   * reverseGeocode'unu kullaniyordu ve YANLIS mahalle uretiyordu: bu
   * mekan icin "Ertugrul" diyordu, dogrusu Alaaddinbey. Ustelik liste
   * ekrani bizim verimizden "Alaaddinbey" gosterdigi icin iki ekran
   * birbirini tutmuyordu - kullanicinin istedigi tutarlilik bu.
   */
  it('mekanin KENDI adresi varsa onu gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      adres: 'Alaaddinbey Mah. 613. Sk No:9',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Alaaddinbey Mah. 613. Sk No:9')).toBeTruthy()
    })
    await cevreOturana()
  })

  it('adresi yoksa ILCE ve IL gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())
    await cevreOturana()
  })
})
