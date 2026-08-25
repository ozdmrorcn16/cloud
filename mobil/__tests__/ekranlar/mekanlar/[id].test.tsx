import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanDetayEkrani from '../../../src/app/mekanlar/[id]'
import { suAnBurdakileriGetir, mekanAnilariniGetir, checkIndenAyril } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/checkin', () => ({
  suAnBurdakileriGetir: jest.fn(),
  mekanAnilariniGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
jest.mock('../../../lib/mekan', () => ({
  ...jest.requireActual('../../../lib/mekan'),
  mekaniGetir: jest.fn().mockResolvedValue({
    id: 'mekan-1',
    ad: 'Sahil Kafe',
    tur: 'Kafe',
    semt: 'Nilüfer',
    kaynak: 'overture',
    adres: null,
    osmId: null,
    konum: { lat: 40, lng: 29 },
  }),
}))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
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
    await waitFor(() => screen.getByText('Ayrıldım'))
    await fireEvent.press(screen.getByText('Ayrıldım'))

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
    expect(screen.queryByText('Ayrıldım')).toBeNull()
  })

  it('check-in yap butonuna basinca check-in ekranina yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Check-in yap'))
    await fireEvent.press(screen.getByText('Check-in yap'))

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-1')
  })

  it('veri yuklemesi basarisiz olursa hata mesaji gosterir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })

  it('su an buradakiler listesinde baskasinin adina basinca profiline yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-2', kullaniciAdi: 'Ada', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('su an buradakiler listesinde kendi adina basilinca yonlendirme yapmaz', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-1', kullaniciAdi: 'Sen', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Sen'))
    await fireEvent.press(screen.getByText('Sen'))

    expect(mockRouterPush).not.toHaveBeenCalledWith(expect.stringContaining('/kullanici/'))
  })

  it('anilar listesinde baskasinin adina basinca profiline yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-2', kullaniciId: 'kullanici-3', kullaniciAdi: 'Berk', notMetni: 'guzel', fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: false },
    ])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Berk'))
    await fireEvent.press(screen.getByText('Berk'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-3')
  })

  it('baskasinin su an buradaki karti sikayet et baglantisi gosterir ve basinca sikayet ekranina yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-2', kullaniciAdi: 'Ada', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Şikayet et'))
    await fireEvent.press(screen.getByText('Şikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=check_in&hedefId=checkin-1')
  })

  it('kendi su an buradaki kartinda sikayet et baglantisi gosterilmez', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-1', kullaniciAdi: 'Sen', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Sen'))

    expect(screen.queryByText('Şikayet et')).toBeNull()
  })

  it('baskasinin ani karti sikayet et baglantisi gosterir ve basinca sikayet ekranina yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-2', kullaniciId: 'kullanici-3', kullaniciAdi: 'Berk', notMetni: 'guzel', fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: false },
    ])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Şikayet et'))
    await fireEvent.press(screen.getByText('Şikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=check_in&hedefId=checkin-2')
  })

  it('kendi ani kartinda sikayet et baglantisi gosterilmez', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-2', kullaniciId: 'kullanici-1', kullaniciAdi: 'Sen', notMetni: 'guzel', fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: false },
    ])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Sen'))

    expect(screen.queryByText('Şikayet et')).toBeNull()
  })
})
