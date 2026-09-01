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
  // Komsu KALABALIK: 2026-09-01'den beri haritada yalnizca kalabalik
  // mekanlarin ignesi ciziliyor, sakinler cizilmiyor. Asagidaki
  // `cevreOturana` beklemesi ikinci ignenin cikmasina dayaniyor.
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-2', ad: 'Komşu', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 3 },
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
   * Kullanicinin SON karari (2026-08-31): "Mahalle adres bilgisi
   * aktarimini durdur ve sil, sadece konumlarin ilce ve il bilgisini
   * gosterecegiz TAM DOGRULUK ADINA."
   *
   * Adres de mahalle de gosterilmiyor - kayitta dolu olsa bile. Once
   * cihazdan adres cozuluyordu (Apple/Google), o YANLIS mahalle
   * uretiyordu; sonra mekanin kendi adresi kullanildi, o da kaynakta
   * kirliydi ("Bursa Erik mah." gibi alanlari karisik girilmis
   * kayitlar). Ilce ve il ise poligon testiyle atandigi icin kesin.
   */
  it('adres ve mahalle dolu OLSA BILE yalnizca ILCE + IL gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      mahalle: 'Ertuğrul',
      adres: 'Alaaddinbey Mah. 613. Sk No:9',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())
    expect(screen.queryByText('Alaaddinbey Mah. 613. Sk No:9')).toBeNull()
    await cevreOturana()
  })

  it('ilcesi yoksa yalnizca il gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, semt: null })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Bursa')).toBeTruthy())
    await cevreOturana()
  })

  /**
   * Kullanicinin duzeltmesi (2026-09-01): dugme ZATEN yol tarifi
   * aciyordu (Apple'da `daddr`, Google'da `dir/?api=1`) ama metin
   * "Harita uygulamasinda ac" diyordu - ne yaptigini soylemiyordu.
   */
  it('dugme "Yol tarifi al" diyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    expect(await screen.findByText('Yol tarifi al')).toBeTruthy()
    expect(screen.queryByText('Harita uygulamasında aç')).toBeNull()
    await cevreOturana()
  })
})
