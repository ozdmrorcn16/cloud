import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Share } from 'react-native'
import ArkadaslarEkrani from '../../../src/app/profil/arkadaslar'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { takibiBirak } from '../../../lib/bag'
import { engelle } from '../../../lib/engelleme'

jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
jest.mock('../../../lib/bag', () => ({ takibiBirak: jest.fn() }))
jest.mock('../../../lib/engelleme', () => ({ engelle: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn(), canGoBack: () => true }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

/** Menu satirina basar ve menunun KAPANMASINI bekler (SecimPenceresi 2026-09-20). */
async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

const SEMRA = { id: 'k2', kullaniciAdi: 'ozdemrs', ad: 'Semra Özdemir', avatarUrl: 'https://x/semra.jpg' }
const MERT = { id: 'k3', kullaniciAdi: 'mert', ad: 'Mert Kaya', avatarUrl: null }

/*
 * ARKADASLARIM SAYFASI (kullanicinin referans gorseli 2026-09-20).
 * Kendi profildeki "Arkadas" sayaci buraya gelir; eski satir-ici liste
 * ve menusu (2026-09-14) bu sayfaya tasindi.
 */
describe('ArkadaslarEkrani', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([SEMRA, MERT])
  })

  it('baslik, kisi-ekle, sayi satiri ve satirlar (avatar, ad, @kullanici adi) cizilir', async () => {
    await render(<ArkadaslarEkrani />)

    expect(await screen.findByText('Arkadaşlarım')).toBeTruthy()
    expect(screen.getByText('2 arkadaş')).toBeTruthy()
    expect(screen.getByText('Semra Özdemir')).toBeTruthy()
    expect(screen.getByText('@ozdemrs')).toBeTruthy()
    expect(screen.getByTestId('arkadas-avatar-k2').props.source).toEqual([{ uri: 'https://x/semra.jpg' }])

    await fireEvent.press(screen.getByTestId('kisi-ekle'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kisiler')
  })

  it('arama kutusu listeyi ad ya da kullanici adiyla suzer; sayi toplam kalir', async () => {
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.changeText(screen.getByTestId('arkadas-ara'), 'mer')
    expect(screen.queryByText('Semra Özdemir')).toBeNull()
    expect(screen.getByText('Mert Kaya')).toBeTruthy()
    expect(screen.getByText('2 arkadaş')).toBeTruthy()

    await fireEvent.changeText(screen.getByTestId('arkadas-ara'), 'yok')
    expect(screen.getByText('Kimse bulunamadı.')).toBeTruthy()
  })

  it('satirdaki mesaj dugmesi sohbeti, ad profili acar', async () => {
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.press(screen.getByTestId('arkadas-mesaj-k2'))
    expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/k2')
    await fireEvent.press(screen.getByText('Semra Özdemir'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k2')
  })

  it('uc nokta: kisi basligi + Profili gor / Mesaj gonder / Arkadasliktan cikar / Engelle', async () => {
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    expect(await screen.findByText('Profili gör')).toBeTruthy()
    expect(screen.getByText('Mesaj gönder')).toBeTruthy()
    expect(screen.getByText('Arkadaşlıktan çıkar')).toBeTruthy()
    expect(screen.getByText('Engelle')).toBeTruthy()
    // Baslikta kisinin adi (satirdakine ek olarak ikinci kez).
    expect(screen.getAllByText('Semra Özdemir').length).toBe(2)

    await menudenSec('arkadas-profil')
    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k2')
  })

  it('Arkadasliktan cikar: takibiBirak cagrilir, satir ve sayi guncellenir', async () => {
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await menudenSec('arkadas-cikar')

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('k2'))
    await waitFor(() => expect(screen.queryByText('Semra Özdemir')).toBeNull())
    expect(screen.getByText('1 arkadaş')).toBeTruthy()
  })

  it('Engelle: once onay, "Evet, engelle" ile engelle cagrilir', async () => {
    ;(engelle as jest.Mock).mockResolvedValue(undefined)
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await menudenSec('arkadas-engelle')
    expect(engelle).not.toHaveBeenCalled()
    await fireEvent.press(await screen.findByText('Evet, engelle'))

    await waitFor(() => expect(engelle).toHaveBeenCalledWith('k2'))
    await waitFor(() => expect(screen.queryByText('Semra Özdemir')).toBeNull())
  })

  it('islem reddedilirse hata gorunur, satir yerinde kalir', async () => {
    ;(takibiBirak as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Semra Özdemir')

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await menudenSec('arkadas-cikar')

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Semra Özdemir')).toBeTruthy()
  })

  it('davet karti sistem paylasimini slooin.com baglantisiyla acar', async () => {
    const paylasSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never)
    await render(<ArkadaslarEkrani />)
    await screen.findByText('Arkadaşlarınla keşfet')

    await fireEvent.press(screen.getByTestId('arkadas-davet'))
    await waitFor(() => expect(paylasSpy).toHaveBeenCalled())
    expect((paylasSpy.mock.calls[0][0] as { message: string }).message).toContain('https://slooin.com')
    paylasSpy.mockRestore()
  })

  it('arkadas yoksa bos metin', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
    await render(<ArkadaslarEkrani />)
    expect(await screen.findByText('Henüz arkadaşın yok')).toBeTruthy()
    expect(screen.getByText('0 arkadaş')).toBeTruthy()
  })
})
