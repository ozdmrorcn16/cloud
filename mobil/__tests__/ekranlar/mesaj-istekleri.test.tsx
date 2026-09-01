import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MesajIstekleriEkrani from '../../src/app/mesaj-istekleri'
import {
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
} from '../../lib/sohbet'

jest.mock('../../lib/sohbet', () => ({
  mesajIsteklerimiGetir: jest.fn(),
  mesajIsteginiKabulEt: jest.fn(),
  mesajIsteginiReddet: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

const ISTEK = {
  gonderenId: 'kisi-1',
  kullaniciAdi: 'deniz',
  ad: 'Deniz',
  konusmaId: 'konusma-1',
  sonMesaj: 'Merhaba, seni parkta gördüm',
  sonMesajZamani: '2026-09-01T10:00:00Z',
}

beforeEach(() => jest.clearAllMocks())

/**
 * Kullanicinin karari (2026-09-01): "Istekler yazisi sabit, basinca yeni
 * sayfa geliyor; orada istekler varsa gorunuyor, yoksa sayfa bos
 * duruyor."
 */
describe('MesajIstekleriEkrani', () => {
  it('gelen istekleri gonderen adi ve mesajiyla listeler', async () => {
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([ISTEK])

    render(<MesajIstekleriEkrani />)

    await waitFor(() => expect(screen.getByText('Deniz')).toBeTruthy())
    expect(screen.getByText('Merhaba, seni parkta gördüm')).toBeTruthy()
  })

  it('istek yoksa bos durum metni gosterir', async () => {
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])

    render(<MesajIstekleriEkrani />)

    await waitFor(() => expect(screen.getByText('Bekleyen istek yok')).toBeTruthy())
  })

  it('istege basinca o kisinin sohbetini acar', async () => {
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([ISTEK])

    render(<MesajIstekleriEkrani />)
    await waitFor(() => screen.getByText('Deniz'))

    await fireEvent.press(screen.getByText('Deniz'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/kisi-1')
  })

  it('Reddet istegi siler ve satiri listeden kaldirir', async () => {
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([ISTEK])
    ;(mesajIsteginiReddet as jest.Mock).mockResolvedValue(undefined)

    render(<MesajIstekleriEkrani />)
    await waitFor(() => screen.getByText('Deniz'))

    await fireEvent.press(screen.getByText('Reddet'))

    await waitFor(() => expect(mesajIsteginiReddet).toHaveBeenCalledWith('kisi-1'))
    await waitFor(() => expect(screen.queryByText('Deniz')).toBeNull())
  })
})
