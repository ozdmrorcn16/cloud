import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KullaniciProfiliEkrani from './[id]'
import { baskasininProfiliniGetir } from '../../../lib/profil'
import { engelle, engellediklerimiGetir } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir } from '../../../lib/checkin'

jest.mock('../../../lib/profil', () => ({ baskasininProfiliniGetir: jest.fn() }))
jest.mock('../../../lib/engelleme', () => ({
  engelle: jest.fn(),
  engeliKaldir: jest.fn(),
  engellediklerimiGetir: jest.fn(),
}))
jest.mock('../../../lib/checkin', () => ({ kullanicininAnilariniGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'kullanici-2' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(engellediklerimiGetir as jest.Mock).mockResolvedValue([])
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
})

describe('KullaniciProfiliEkrani', () => {
  it('profili gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: 'merhaba', fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('merhaba')).toBeTruthy()
    })
  })

  it('kullanicinin herkese acik anilarini listeler', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotograf: null, olusturmaZamani: '', bitisZamani: '', canliMi: false,
        mekanKonumu: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(kullanicininAnilariniGetir).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
  })

  it('profil null donerse bulunamadi gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue(null)

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Bu profil bulunamadi')).toBeTruthy()
    })
  })

  it('engelle butonuna basinca engeller ve profili kapatir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(engelle as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Engelle'))

    await waitFor(() => {
      expect(engelle).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Bu profil bulunamadi')).toBeTruthy()
    })
  })

  it('sikayet butonuna basinca sikayet ekranina yonlendirir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Sikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })
})
