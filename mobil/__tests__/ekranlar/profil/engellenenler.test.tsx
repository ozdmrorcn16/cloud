import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import EngellenenlerEkrani from '../../../src/app/profil/engellenenler'
import { engellediklerimiListele, engeliKaldir } from '../../../lib/engelleme'

jest.mock('../../../lib/engelleme', () => ({
  engellediklerimiListele: jest.fn(),
  engeliKaldir: jest.fn(),
}))

const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockRouterBack }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(engellediklerimiListele as jest.Mock).mockResolvedValue([])
})

describe('EngellenenlerEkrani', () => {
  it('engellenen kisileri adi ve kullanici adiyla listeler', async () => {
    ;(engellediklerimiListele as jest.Mock).mockResolvedValue([
      { id: 'k2', kullaniciAdi: 'ada123', ad: 'Ada', engellendi: '2026-08-20T10:00:00Z' },
    ])

    await render(<EngellenenlerEkrani />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    expect(screen.getByText('@ada123')).toBeTruthy()
  })

  it('engeli kaldirinca dogru id ile cagirir ve satir listeden cikar', async () => {
    ;(engellediklerimiListele as jest.Mock).mockResolvedValue([
      { id: 'k2', kullaniciAdi: 'ada123', ad: 'Ada', engellendi: '2026-08-20T10:00:00Z' },
    ])
    ;(engeliKaldir as jest.Mock).mockResolvedValue(undefined)

    await render(<EngellenenlerEkrani />)
    fireEvent.press(await screen.findByText('Engeli kaldır'))

    await waitFor(() => expect(engeliKaldir).toHaveBeenCalledWith('k2'))
    await waitFor(() => expect(screen.queryByText('Ada')).toBeNull())
  })

  it('kaldirma basarisiz olursa satir yerinde kalir ve hata gorunur', async () => {
    ;(engellediklerimiListele as jest.Mock).mockResolvedValue([
      { id: 'k2', kullaniciAdi: 'ada123', ad: 'Ada', engellendi: '2026-08-20T10:00:00Z' },
    ])
    ;(engeliKaldir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<EngellenenlerEkrani />)
    fireEvent.press(await screen.findByText('Engeli kaldır'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Ada')).toBeTruthy()
  })

  it('kimse engellenmemisse yon veren bos ekran gosterir', async () => {
    await render(<EngellenenlerEkrani />)
    expect(await screen.findByText('Kimseyi engellemedin')).toBeTruthy()
  })

  it('liste yuklenemezse hata gosterir', async () => {
    ;(engellediklerimiListele as jest.Mock).mockRejectedValue(new Error('ağ hatası'))

    await render(<EngellenenlerEkrani />)

    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })

  it('geri dugmesi onceki ekrana doner', async () => {
    await render(<EngellenenlerEkrani />)
    fireEvent.press(await screen.findByLabelText('Geri'))
    expect(mockRouterBack).toHaveBeenCalled()
  })
})
