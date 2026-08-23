import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import SikayetEkrani from '../../src/app/sikayet'
import { sikayetGonder } from '../../lib/sikayet'

jest.mock('../../lib/sikayet', () => ({
  sikayetGonder: jest.fn(),
  SIKAYET_SEBEPLERI: [
    { anahtar: 'taciz', etiket: 'Taciz veya rahatsiz etme' },
    { anahtar: 'spam', etiket: 'Spam veya reklam' },
  ],
}))

const mockRouterBack = jest.fn()
// Hedef turu testler arasinda degisiyor: baglam bildirimi yalnizca
// mesaj sikayetinde cikmali (karar 76).
let mockAramaParametreleri: { hedefTur: string; hedefId: string } = {
  hedefTur: 'kullanici',
  hedefId: 'kullanici-2',
}
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => mockAramaParametreleri,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockAramaParametreleri = { hedefTur: 'kullanici', hedefId: 'kullanici-2' }
})

describe('SikayetEkrani', () => {
  it('sebep secip gonderince sikayeti iletir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Taciz veya rahatsiz etme'))
    await fireEvent.changeText(screen.getByPlaceholderText('Eklemek istediğin bir şey var mı?'), 'detay')
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(sikayetGonder).toHaveBeenCalledWith('kullanici', 'kullanici-2', 'taciz', 'detay')
    })
  })

  it('sebep secilmeden gonderilemez', async () => {
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(screen.getByText('Bir sebep seç')).toBeTruthy()
    })
    expect(sikayetGonder).not.toHaveBeenCalled()
  })

  it('gonderdikten sonra teyit gosterir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(screen.getByText('Şikayetin alındı')).toBeTruthy()
    })
  })

  // Karar 76: baglam bildirimi. Kademe 1 incelemesi sikayet edenin kendi
  // konusmasindan da mesaj tasidigi icin bu bildirilmeli.
  it('mesaj sikayetinde baglam bildirimini gosterir', async () => {
    mockAramaParametreleri = { hedefTur: 'mesaj', hedefId: 'mesaj-1' }

    await render(<SikayetEkrani />)

    expect(screen.getByText(/çevresindeki mesajlar/i)).toBeTruthy()
  })

  it('kullanici sikayetinde baglam bildirimi gosterilmez', async () => {
    await render(<SikayetEkrani />)

    expect(screen.queryByText(/çevresindeki mesajlar/i)).toBeNull()
  })
})
