import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import PaylasimEkrani from '../../src/app/paylasim/[id]'
import { checkInGetir, type AkisOgesi } from '../../lib/akis'
import { etkilesimOzetleriniGetir, begen } from '../../lib/etkilesim'

jest.mock('../../lib/akis', () => ({ ...jest.requireActual('../../lib/akis'), checkInGetir: jest.fn() }))
jest.mock('../../lib/etkilesim', () => ({
  ...jest.requireActual('../../lib/etkilesim'),
  etkilesimOzetleriniGetir: jest.fn(),
  begen: jest.fn(),
  begeniyiKaldir: jest.fn(),
  paylas: jest.fn(),
  yorumlariGetir: jest.fn(),
  begenenleriGetir: jest.fn(),
}))
jest.mock('../../lib/fotograf-url', () => ({ checkInFotografiUrlHaritasi: jest.fn().mockResolvedValue({}) }))

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'checkin-1' }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

/**
 * PAYLASIM EKRANI (2026-09-22): bildirimden acilan tek check-in. Kart
 * akistakiyle ayni; begeni ve yorum calisir; duzenleme menusu YOK.
 */

const OGE: AkisOgesi = {
  id: 'checkin-1',
  kullaniciId: 'kullanici-1',
  kullaniciAdi: 'Orcun',
  rumuz: 'byorcun',
  mekanId: 'mekan-1',
  mekanAdi: 'Sahil Kafe',
  mekanSemti: 'Nilüfer',
  notMetni: 'guzel bir aksam',
  ifade: null,
  fotograflar: [],
  fotografUrller: [],
  olusturmaZamani: new Date().toISOString(),
  canliMi: false,
  benimMi: true,
  etiketler: [],
  avatarUrl: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({ 'checkin-1': { begeni: 1, yorum: 0, begendim: false } })
  ;(begen as jest.Mock).mockResolvedValue(undefined)
})

describe('PaylasimEkrani', () => {
  it('check-in kartini akistaki gibi gosterir; duzenleme menusu YOK', async () => {
    ;(checkInGetir as jest.Mock).mockResolvedValue(OGE)
    await render(<PaylasimEkrani />)
    expect(await screen.findByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
    expect(screen.getByText('Paylaşım')).toBeTruthy()
    expect(checkInGetir).toHaveBeenCalledWith('checkin-1')
    // Kendi paylasimi olsa da burada duzenle/sil menusu yok.
    expect(screen.queryByLabelText('Paylaşım seçenekleri')).toBeNull()
  })

  it('begenince sunucuya yazar ve sayac artar', async () => {
    ;(checkInGetir as jest.Mock).mockResolvedValue(OGE)
    await render(<PaylasimEkrani />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(await screen.findByLabelText('Beğen'))
    await waitFor(() => expect(begen).toHaveBeenCalledWith('checkin-1'))
    expect(await screen.findByText('2')).toBeTruthy()
  })

  it('RLS gostermiyorsa "artik gorunmuyor" der', async () => {
    ;(checkInGetir as jest.Mock).mockResolvedValue(null)
    await render(<PaylasimEkrani />)
    expect(await screen.findByTestId('paylasim-yok')).toBeTruthy()
  })
})
