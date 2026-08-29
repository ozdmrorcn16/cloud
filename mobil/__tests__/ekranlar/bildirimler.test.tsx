import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import BildirimlerEkrani from '../../src/app/bildirimler'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { takipIsteginiYanitla } from '../../lib/bag'
import { bekleyenEtiketleriGetir, etiketiYanitla } from '../../lib/etiket'
import { avatarlariGetir } from '../../lib/akis'

jest.mock('../../lib/bag-listeleri', () => ({ gelenIstekleriGetir: jest.fn() }))
jest.mock('../../lib/bag', () => ({ takipIsteginiYanitla: jest.fn() }))
jest.mock('../../lib/etiket', () => ({
  bekleyenEtiketleriGetir: jest.fn(),
  etiketiYanitla: jest.fn(),
}))
jest.mock('../../lib/akis', () => ({ avatarlariGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

const ETIKET = {
  checkInId: 'checkin-1',
  mekanAdi: 'Kahve Durağı',
  etiketleyenId: 'kullanici-2',
  etiketleyenAd: 'Ada',
  etiketleyenKullaniciAdi: 'ada',
  olusturuldu: '2026-08-29T09:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
  ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([])
  ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)
  ;(etiketiYanitla as jest.Mock).mockResolvedValue(undefined)
  ;(avatarlariGetir as jest.Mock).mockResolvedValue({})
})

describe('BildirimlerEkrani', () => {
  it('bekleyen bir sey yoksa yon veren bir metin gosterir', async () => {
    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('Yeni bir şey yok')).toBeTruthy()
  })

  it('gelen arkadaslik istegini gosterir ve kabul edince listeden kaldirir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'kullanici-3', kullaniciAdi: 'deniz', ad: 'Deniz' }],
      sohbet: [],
    })

    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('deniz seninle arkadaş olmak istiyor.')).toBeTruthy()

    await fireEvent.press(screen.getByText('Kabul et'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('kullanici-3', true))
    await waitFor(() =>
      expect(screen.queryByText('deniz seninle arkadaş olmak istiyor.')).toBeNull()
    )
  })

  it('bekleyen etiketi mekan adiyla gosterir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)

    expect(
      await screen.findByText('ada Kahve Durağı check-in’inde seni etiketlemek istiyor.')
    ).toBeTruthy()
  })

  it('etiketi ONAYLAYINCA sunucuya onay gonderir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)
    await fireEvent.press(await screen.findByText('Onayla'))

    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('checkin-1', true))
  })

  it('etiketi REDDEDINCE sunucuya red gonderir ve satir kalkar', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('checkin-1', false))
    await waitFor(() => expect(screen.queryByText('Onayla')).toBeNull())
  })

  it('etiketleyenin profil fotografini satirin basinda gosterir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({
      'kullanici-2': 'https://ornek/ada.jpg',
    })

    await render(<BildirimlerEkrani />)

    const avatar = await screen.findByTestId('bildirim-avatar')
    expect(avatar.props.source).toEqual([{ uri: 'https://ornek/ada.jpg' }])
    expect(avatarlariGetir).toHaveBeenCalledWith(['kullanici-2'])
  })

  it('fotografi olmayan kisi icin adinin bas harfini gosterir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'kullanici-3', kullaniciAdi: 'deniz', ad: 'Deniz' }],
      sohbet: [],
    })

    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('D')).toBeTruthy()
    expect(screen.queryByTestId('bildirim-avatar')).toBeNull()
  })

  it('avatar okunamazsa bildirimler yine gorunur', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])
    ;(avatarlariGetir as jest.Mock).mockRejectedValue(new Error('ag yok'))

    await render(<BildirimlerEkrani />)

    expect(
      await screen.findByText('ada Kahve Durağı check-in’inde seni etiketlemek istiyor.')
    ).toBeTruthy()
  })
})
