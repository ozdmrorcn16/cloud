import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnilarEkrani from '../../../src/app/profil/anilar'
import { kullanicininAnilariniGetir, checkIniSil } from '../../../lib/checkin'

jest.mock('../../../lib/checkin', () => ({
  kullanicininAnilariniGetir: jest.fn(),
  checkIniSil: jest.fn(),
}))
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
  },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
    {
      id: 'checkin-3',
      mekanId: 'mekan-1',
      mekanAdi: 'Sahil Kafe',
      kullaniciAdi: 'Ada',
      notMetni: 'harika',
      fotograf: null,
      fotografUrl: null,
      olusturmaZamani: '2026-08-10T10:00:00Z',
      bitisZamani: '2026-08-10T14:00:00Z',
      canliMi: false,
      mekanKonumu: { lat: 41.015, lng: 28.979 },
      etiketler: [{ kullaniciId: 'kullanici-9', ad: 'Berk' }],
    },
  ])
})

describe('AnilarEkrani', () => {
  it('anilari ANA SAYFADAKI kartla gosterir: kisi, mekan ve etiket', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.getByText('Berk')).toBeTruthy()
    expect(screen.getByText('harika')).toBeTruthy()
  })

  it('mekan adina basinca mekan sayfasini acar', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('etikete basinca o kisinin profiline gider', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Berk'))
    await fireEvent.press(screen.getByText('Berk'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-9')
  })

  it('silme ONAY istiyor ve onaylaninca listeden kaldiriyor', async () => {
    ;(checkIniSil as jest.Mock).mockResolvedValue(undefined)
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    await fireEvent.press(screen.getByLabelText('Sil'))
    expect(checkIniSil).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByText('Sil'))
    await waitFor(() => {
      expect(checkIniSil).toHaveBeenCalledWith('checkin-3')
    })
    await waitFor(() => {
      expect(screen.getByText('Henüz bir anın yok')).toBeTruthy()
    })
  })

  it('anilar yuklenemezse hata mesaji gosterir', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockRejectedValue(
      new Error('Sunucuya ulasilamadi')
    )
    await render(<AnilarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })
})
