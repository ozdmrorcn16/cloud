import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KullaniciProfiliEkrani from '../../../src/app/kullanici/[id]'
import { baskasininProfiliniGetir } from '../../../lib/profil'
import { engelle, engellediklerimiGetir } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir } from '../../../lib/checkin'
import { profilFotograflariUrl } from '../../../lib/fotograf-url'

jest.mock('../../../lib/profil', () => ({ baskasininProfiliniGetir: jest.fn() }))
jest.mock('../../../lib/engelleme', () => ({
  engelle: jest.fn(),
  engeliKaldir: jest.fn(),
  engellediklerimiGetir: jest.fn(),
}))
jest.mock('../../../lib/checkin', () => ({ kullanicininAnilariniGetir: jest.fn() }))
jest.mock('../../../lib/fotograf-url', () => ({ profilFotograflariUrl: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'kullanici-2' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(engellediklerimiGetir as jest.Mock).mockResolvedValue([])
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
  ;(profilFotograflariUrl as jest.Mock).mockImplementation((yollar: string[]) =>
    Promise.resolve(yollar.map((yol) => `https://ornek/imzali/${yol}`))
  )
})

describe('KullaniciProfiliEkrani', () => {
  it('profili gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: 'merhaba', fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('merhaba')).toBeTruthy()
    })
  })

  it('kullanici adini gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'k1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun Ozdemir',
      biyografi: null,
      fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
      expect(screen.getByText('@orcun')).toBeTruthy()
    })
  })

  it('kullanicinin herkese acik anilarini listeler', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
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

  it('fotograflari olan profil icin imzali URL ile Image gosterir, olmayan icin gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: ['kullanici-2/1.jpg', 'kullanici-2/2.jpg'],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(profilFotograflariUrl).toHaveBeenCalledWith(['kullanici-2/1.jpg', 'kullanici-2/2.jpg'])
    })

    await waitFor(() => {
      const gorseller = screen.getAllByTestId('profil-fotografi')
      expect(gorseller).toHaveLength(2)
      expect(gorseller.map((g) => g.props.source.uri)).toEqual([
        'https://ornek/imzali/kullanici-2/1.jpg',
        'https://ornek/imzali/kullanici-2/2.jpg',
      ])
    })
  })

  it('fotografi olmayan profil icin Image gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => screen.getByText('Ada'))

    expect(screen.queryAllByTestId('profil-fotografi')).toHaveLength(0)
  })

  it('engelle butonuna basinca engeller ve profili kapatir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
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
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Sikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })

  it('engelleme basarisiz olursa hata gosterir ve profili kapatmaz', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(engelle as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Engelle'))

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.queryByText('Bu profil bulunamadi')).toBeNull()
  })

  it('yuklenirken bulunamadi mesajini gostermez', async () => {
    let cozumlendir: (deger: unknown) => void = () => {}
    const bekleyenSoz = new Promise((cozum) => {
      cozumlendir = cozum
    })
    ;(baskasininProfiliniGetir as jest.Mock).mockReturnValue(bekleyenSoz)

    await render(<KullaniciProfiliEkrani />)

    expect(screen.queryByText('Bu profil bulunamadi')).toBeNull()

    cozumlendir({ id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [] })
    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
    })
  })

  it('baskasinin anisinda sil butonu gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotograf: null, olusturmaZamani: '', bitisZamani: '', canliMi: false,
        mekanKonumu: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(screen.queryByText('Sil')).toBeNull()
  })
})
