import { render, screen, waitFor } from '@testing-library/react-native'
import KullaniciBaglantisiEkrani from '../../src/app/[kullaniciAdi]'
import { kullaniciAdindanKimlik } from '../../lib/profil-baglantisi'
import { kendiKullaniciIdim } from '../../lib/profil'

/*
 * `https://slooin.com/<kullanici_adi>` uygulamada acilinca (Universal /
 * App Link, 2026-09-18): ekran hic gorunmeden profile gecilir.
 */

const mockReplace = jest.fn()
let mockAd = 'ada123'
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ kullaniciAdi: mockAd }),
}))
const mockTarayici = jest.fn().mockResolvedValue(undefined)
jest.mock('expo-web-browser', () => ({ openBrowserAsync: (...a: unknown[]) => mockTarayici(...a) }))
jest.mock('../../lib/profil-baglantisi', () => ({
  ...jest.requireActual('../../lib/profil-baglantisi'),
  kullaniciAdindanKimlik: jest.fn(),
}))
jest.mock('../../lib/profil', () => ({ kendiKullaniciIdim: jest.fn() }))

beforeEach(() => {
  jest.clearAllMocks()
  mockAd = 'ada123'
  ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('ben-1')
})

describe('KullaniciBaglantisiEkrani', () => {
  it('kullanici adini kimlige cevirip baskasinin profiline gecer', async () => {
    ;(kullaniciAdindanKimlik as jest.Mock).mockResolvedValue('kisi-2')
    await render(<KullaniciBaglantisiEkrani />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/kullanici/kisi-2'))
    expect(kullaniciAdindanKimlik).toHaveBeenCalledWith('ada123')
  })

  it('kendi kullanici adiysa kendi profiline gecer', async () => {
    ;(kullaniciAdindanKimlik as jest.Mock).mockResolvedValue('ben-1')
    await render(<KullaniciBaglantisiEkrani />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/profil'))
  })

  it('boyle biri yoksa "bulunamadi" ve ana sayfa dugmesi', async () => {
    ;(kullaniciAdindanKimlik as jest.Mock).mockResolvedValue(null)
    await render(<KullaniciBaglantisiEkrani />)
    expect(await screen.findByText('Bu profil bulunamadı')).toBeTruthy()
    expect(screen.getByText('@ada123')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('sitenin sayfa adi (gizlilik) tarayicida acilir, uygulama ana sayfaya doner', async () => {
    mockAd = 'gizlilik'
    await render(<KullaniciBaglantisiEkrani />)
    await waitFor(() => expect(mockTarayici).toHaveBeenCalledWith('https://slooin.com/gizlilik'))
    expect(mockReplace).toHaveBeenCalledWith('/')
    expect(kullaniciAdindanKimlik).not.toHaveBeenCalled()
  })
})
