import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import CheckInEkrani from './[mekanId]'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import * as ImagePicker from 'expo-image-picker'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ checkInYap: jest.fn() }))
jest.mock('../../../lib/checkin-fotograf-yukle', () => ({ checkinFotografYukle: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
})

describe('CheckInEkrani', () => {
  it('not ile check-in yapar ve mekan ekranina yonlendirir', async () => {
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-1', mekanId: 'mekan-1', notMetni: 'harika', fotograf: null,
      olusturmaZamani: '2026-08-14T10:00:00Z', bitisZamani: '2026-08-14T14:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Bir not ekle (opsiyonel)'), 'harika')
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1]) // Press the button, not the title

    await waitFor(() => {
      expect(checkInYap).toHaveBeenCalledWith('mekan-1', { lat: 41.015, lng: 28.979 }, 'harika', undefined)
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('sunucu mesafe hatasi donerse gosterir', async () => {
    ;(checkInYap as jest.Mock).mockRejectedValue(new Error('Mekana cok uzaksin (~500 m icinde olmalisin)'))

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1]) // Press the button, not the title

    await waitFor(() => {
      expect(screen.getByText('Mekana cok uzaksin (~500 m icinde olmalisin)')).toBeTruthy()
    })
  })

  it('fotograf yukleme basarisiz olursa uyari gosterir ve check-in\'i engellemiyor', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///local/photo.jpg' }],
    })
    ;(checkinFotografYukle as jest.Mock).mockRejectedValue(new Error('Upload hatasi'))
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-1', mekanId: 'mekan-1', notMetni: 'not', fotograf: null,
      olusturmaZamani: '2026-08-14T10:00:00Z', bitisZamani: '2026-08-14T14:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Bir not ekle (opsiyonel)'), 'not')

    // Fotograf sec
    await fireEvent.press(screen.getByText('Fotograf ekle (opsiyonel)'))

    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('Fotograf yuklenemedi, notunla check-in yapildi')).toBeTruthy()
    })
    // checkInYap fotografsiz cagirilmali
    expect(checkInYap).toHaveBeenCalledWith('mekan-1', { lat: 41.015, lng: 28.979 }, 'not', undefined)
  })

  it('ag hatasi icin ozel mesaj gosterir', async () => {
    ;(checkInYap as jest.Mock).mockRejectedValue(new TypeError('Network request failed'))

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('Internet baglantisi yok, tekrar dene')).toBeTruthy()
    })
  })
})
