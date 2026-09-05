import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnilarEkrani from '../../../src/app/profil/anilar'
import { kullanicininAnilariniGetir, checkIniSil } from '../../../lib/checkin'

jest.mock('../../../lib/checkin', () => ({
  ...jest.requireActual('../../../lib/checkin'),
  kullanicininAnilariniGetir: jest.fn(),
  checkIniSil: jest.fn(),
}))
jest.mock('../../../lib/profil', () => ({
  kendiProfilimiGetir: jest.fn().mockResolvedValue({
    id: 'kullanici-1', kullaniciAdi: 'ada_1', ad: 'Ada', biyografi: null, fotograflar: [],
  }),
}))
jest.mock('../../../lib/fotograf-url', () => ({ profilFotografiUrl: jest.fn() }))
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
    // Kartta KULLANICI ADI yazar (karar 2026-08-30), ad degil - ve
    // basinda @ ISARETI OLMADAN.
    expect(screen.getByText('ada_1')).toBeTruthy()
    expect(screen.queryByText('@ada_1')).toBeNull()
    expect(screen.queryByText('Ada')).toBeNull()
    expect(screen.getByText('Berk')).toBeTruthy()
    expect(screen.getByText('harika')).toBeTruthy()
  })

  it('mekan adina basinca KONUM ekranini acar', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
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

    // Silme artik UC NOKTA MENUSUNUN icinde (kullanicinin karari
    // 2026-09-02): once menu, sonra onay penceresi. Iki adim da yerinde.
    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-sil'))
    expect(checkIniSil).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId('onay-eylemi'))
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

  it('menuden Duzenle notu mevcut haliyle aciyor', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))

    // AYRI PENCERE YOK (kullanicinin istegi 2026-09-05): duzenleme
    // kartin kendi icinde aciliyor.
    expect(screen.queryByText('Paylaşımı düzenle')).toBeNull()
    expect(screen.getByTestId('yerinde-duzenle')).toBeTruthy()
  })
})
