import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import HikayeFotografSecEkrani from '../../../src/app/hikaye/fotograf'
import { sonFotograflariGetir, galeriKullanilabilirMi } from '../../../lib/galeri'
import * as ImagePicker from 'expo-image-picker'

const mockReplace = jest.fn()
const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, canGoBack: () => true }),
}))
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock('../../../lib/galeri', () => ({
  galeriKullanilabilirMi: jest.fn(),
  sonFotograflariGetir: jest.fn(),
}))

/**
 * HIKAYEYE EKLE - FOTOGRAF SEC (kullanicinin referansi 02).
 * Izgara NATIVE modul istiyor; modul yoksa ekran sistem secicisine
 * dusmeli, ASLA bos kalmamali - iki hal de burada kilitli.
 */
describe('HikayeFotografSecEkrani', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(galeriKullanilabilirMi as jest.Mock).mockReturnValue(true)
    ;(sonFotograflariGetir as jest.Mock).mockResolvedValue([
      { id: 'f1', uri: 'file:///1.jpg' },
      { id: 'f2', uri: 'file:///2.jpg' },
    ])
  })

  it('son fotograflari izgarada gosterir; secince tik cikar ve Ileri duzenlemeye gecer', async () => {
    await render(<HikayeFotografSecEkrani />)
    expect(await screen.findByTestId('fotograf-f1')).toBeTruthy()
    expect(screen.getByTestId('fotograf-f2')).toBeTruthy()
    // Secim yokken Ileri pasif.
    expect(screen.getByTestId('fotograf-ileri').props.accessibilityState.disabled).toBe(true)

    await fireEvent.press(screen.getByTestId('fotograf-f2'))
    expect(screen.getByTestId('fotograf-tik')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('fotograf-ileri'))
    expect(mockReplace).toHaveBeenCalledWith(`/hikaye/ekle?foto=${encodeURIComponent('file:///2.jpg')}`)
  })

  it('galeri modulu YOKSA izgara yerine "Galeriden sec" karti gelir ve sistem secicisi acilir', async () => {
    ;(galeriKullanilabilirMi as jest.Mock).mockReturnValue(false)
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///sistem.jpg' }],
    })
    await render(<HikayeFotografSecEkrani />)

    expect(await screen.findByTestId('fotograf-galeri')).toBeTruthy()
    expect(screen.queryByTestId('fotograf-ileri')).toBeNull()

    await fireEvent.press(screen.getByTestId('fotograf-galeri'))
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(`/hikaye/ekle?foto=${encodeURIComponent('file:///sistem.jpg')}`)
    )
  })

  it('kamera karti: cekilen fotografla duzenlemeye gecer', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
    ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///kamera.jpg' }],
    })
    await render(<HikayeFotografSecEkrani />)

    await fireEvent.press(await screen.findByTestId('fotograf-kamera'))
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(`/hikaye/ekle?foto=${encodeURIComponent('file:///kamera.jpg')}`)
    )
  })
})
