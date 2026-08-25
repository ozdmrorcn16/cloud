import { render, screen, fireEvent } from '@testing-library/react-native'
import AnaSayfa from '../../src/app/index'
import { akisiGetir } from '../../lib/akis'
import type { AkisOgesi } from '../../lib/akis'
import { konusmalarimiGetir } from '../../lib/sohbet'

jest.mock('../../lib/akis', () => ({ akisiGetir: jest.fn() }))
jest.mock('../../lib/sohbet', () => ({ konusmalarimiGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

function oge(ustune: Partial<AkisOgesi> = {}): AkisOgesi {
  return {
    id: 'checkin-1',
    kullaniciId: 'kullanici-2',
    kullaniciAdi: 'Ada',
    mekanId: 'mekan-1',
    mekanAdi: 'Sahil Kafe',
    notMetni: 'guzel bir aksam',
    fotografUrl: null,
    olusturmaZamani: new Date().toISOString(),
    canliMi: false,
    benimMi: false,
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(akisiGetir as jest.Mock).mockResolvedValue([])
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
})

describe('AnaSayfa', () => {
  it('akistaki check-ini kisi ve mekan adiyla gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
  })

  it('fotografli check-in fotografiyla gelir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ fotografUrl: 'https://imzali/1.jpg' })])

    await render(<AnaSayfa />)

    expect(await screen.findByTestId('akis-fotografi')).toBeTruthy()
  })

  it('canli check-in "su an burada" rozetiyle gosterilir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ canliMi: true })])

    await render(<AnaSayfa />)

    expect(await screen.findByText('şu an burada')).toBeTruthy()
  })

  it('kendi check-ini de akista gorunur', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ id: 'checkin-2', kullaniciId: 'kullanici-1', kullaniciAdi: 'Ben', benimMi: true }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ben')).toBeTruthy()
  })

  it('kendi satirinda kisiye basinca kendi profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ kullaniciAdi: 'Ben', benimMi: true })])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ben'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil')
  })

  it('baskasinin satirinda kisiye basinca onun profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('mekan adina basinca mekan sayfasini acar', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('akis bosken kesfetmeye yonlendirir', async () => {
    await render(<AnaSayfa />)

    expect(await screen.findByText('Akışın henüz boş')).toBeTruthy()
    fireEvent.press(screen.getByText('Mekanları keşfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('akis yuklenemezse hata mesaji gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))

    await render(<AnaSayfa />)

    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })
})
