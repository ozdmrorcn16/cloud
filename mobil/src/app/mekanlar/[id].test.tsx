import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanDetayEkrani from './[id]'
import { suAnBurdakileriGetir, mekanAnilariniGetir, checkIndenAyril } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/checkin', () => ({
  suAnBurdakileriGetir: jest.fn(),
  mekanAnilariniGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'mekan-1' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MekanDetayEkrani', () => {
  it('su an orada olanlari ve anilari iki ayri bolumde gosterir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciAdi: 'Ada', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-2', kullaniciAdi: 'Berk', notMetni: 'guzel', fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: false },
    ])

    await render(<MekanDetayEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('Berk')).toBeTruthy()
    })
  })

  it('kendi aktif check-ini varsa ayrildim butonu gosterir ve basinca cagirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'checkin-1', kullaniciId: 'kullanici-1', kullaniciAdi: 'Sen', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
      ])
      .mockResolvedValueOnce([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])
    ;(checkIndenAyril as jest.Mock).mockResolvedValue(undefined)

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Ayrildim'))
    await fireEvent.press(screen.getByText('Ayrildim'))

    await waitFor(() => {
      expect(checkIndenAyril).toHaveBeenCalledWith('checkin-1')
    })

    await waitFor(() => {
      expect(screen.getByText('Check-in yap')).toBeTruthy()
    })
  })

  it('baskasinin aktif check-ini varsa check-in yap butonu gosterir ve ayrildim butonu yoktur', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-2', kullaniciAdi: 'Baskasi', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Baskasi')).toBeTruthy()
    })
    expect(screen.getByText('Check-in yap')).toBeTruthy()
    expect(screen.queryByText('Ayrildim')).toBeNull()
  })

  it('check-in yap butonuna basinca check-in ekranina yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Check-in yap'))
    await fireEvent.press(screen.getByText('Check-in yap'))

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-1')
  })
})
