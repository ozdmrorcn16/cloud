import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import SohbetEkrani from '../../../src/app/sohbet/[kullaniciId]'
import {
  konusmalarimiGetir,
  mesajlariGetir,
  mesajGonder,
  konusmayiOkunduIsaretle,
  mesajlaraAbonelOl,
} from '../../../lib/sohbet'
import type { Konusma, Mesaj } from '../../../lib/sohbet'

jest.mock('../../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
  mesajlariGetir: jest.fn(),
  mesajGonder: jest.fn(),
  konusmayiOkunduIsaretle: jest.fn(),
  konusmayiGizle: jest.fn(),
  mesajlaraAbonelOl: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ kullaniciId: 'kullanici-2' }),
}))

function konusma(ustune: Partial<Konusma> = {}): Konusma {
  return {
    konusmaId: 'konusma-1',
    kisiId: 'kullanici-2',
    kullaniciAdi: 'ada123',
    ad: 'Ada',
    sonMesaj: 'Iki',
    sonMesajZamani: '2026-08-20T10:02:00Z',
    okunmamis: 0,
    yazilabilirMi: true,
    ...ustune,
  }
}

function mesaj(ustune: Partial<Mesaj> = {}): Mesaj {
  return {
    id: 'm1',
    gonderenId: 'kullanici-2',
    metin: 'Bir',
    olusturuldu: '2026-08-20T10:01:00Z',
    ...ustune,
  }
}

const bosAbonelikIptali = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
  ;(mesajlariGetir as jest.Mock).mockResolvedValue([])
  ;(konusmayiOkunduIsaretle as jest.Mock).mockResolvedValue(undefined)
  ;(mesajlaraAbonelOl as jest.Mock).mockReturnValue(bosAbonelikIptali)
})

describe('SohbetEkrani', () => {
  it('gecmis mesajlari yeniden eskiye listeler', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm3', metin: 'Uc', olusturuldu: '2026-08-20T10:03:00Z' }),
      mesaj({ id: 'm2', metin: 'Iki', olusturuldu: '2026-08-20T10:02:00Z' }),
      mesaj({ id: 'm1', metin: 'Bir', olusturuldu: '2026-08-20T10:01:00Z' }),
    ])

    await render(<SohbetEkrani />)

    const satirlar = await screen.findAllByTestId('mesaj-metni')
    expect(satirlar.map((s) => s.props.children)).toEqual(['Uc', 'Iki', 'Bir'])
  })

  it('yazip gonderince mesajGonder dogru kullanici id ve metinle cagrilir, giris alani temizlenir', async () => {
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(mesajGonder).toHaveBeenCalledWith('kullanici-2', 'Merhaba')
    })
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('')
    })
  })

  it('gonderme reddedilirse hata mesaji gorunur ve yazilan metin giris alaninda kalir', async () => {
    ;(mesajGonder as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gonder'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('Merhaba')
  })

  it('bos ya da yalnizca bosluk metinle gonder butonu etkin degil', async () => {
    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')

    await fireEvent.changeText(girdi, '   ')
    await fireEvent.press(screen.getByText('Gonder'))

    expect(mesajGonder).not.toHaveBeenCalled()
  })

  it('yazilabilirMi false donerse giris alani yerine kisa bir not gorunur ve gecmis yine okunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ yazilabilirMi: false })])
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([mesaj({ id: 'm1', metin: 'Eski mesaj' })])

    await render(<SohbetEkrani />)

    expect(await screen.findByText('Eski mesaj')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Bir mesaj yaz...')).toBeNull()
    expect(screen.getByText('Bu kisiye su an mesaj gonderemezsin.')).toBeTruthy()
  })

  it('konusma hic yoksa giris alani acik kalir ve ilk gonderme reddi hata olarak gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajGonder as jest.Mock).mockRejectedValue(new Error('Bu kisiye su an mesaj gonderemezsin.'))

    await render(<SohbetEkrani />)
    expect(await screen.findByPlaceholderText('Bir mesaj yaz...')).toBeTruthy()

    await fireEvent.changeText(screen.getByPlaceholderText('Bir mesaj yaz...'), 'Merhaba')
    await fireEvent.press(screen.getByText('Gonder'))

    expect(await screen.findByText('Bu kisiye su an mesaj gonderemezsin.')).toBeTruthy()
    expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('Merhaba')
  })

  it('ekran acilinca konusmayiOkunduIsaretle cagrilir', async () => {
    await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(konusmayiOkunduIsaretle).toHaveBeenCalledWith('konusma-1')
    })
  })

  it('konusma yokken konusmayiOkunduIsaretle cagrilmaz', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<SohbetEkrani />)
    await screen.findByPlaceholderText('Bir mesaj yaz...')

    expect(konusmayiOkunduIsaretle).not.toHaveBeenCalled()
  })

  it('sikayet butonuna basinca sikayet ekranina hedef_tur=mesaj ile yonlendirir', async () => {
    await render(<SohbetEkrani />)
    await fireEvent.press(await screen.findByText('Sikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=mesaj&hedefId=konusma-1')
  })

  it('abonelik konusma id ile kuruluyor ve gelen mesaj listeye eklenir', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })

    await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(mesajlaraAbonelOl).toHaveBeenCalledWith('konusma-1', expect.any(Function))
    })

    expect(geldiCallback).not.toBeNull()
    await act(async () => {
      geldiCallback!(mesaj({ id: 'm-yeni', metin: 'Yeni gelen mesaj' }))
    })

    expect(await screen.findByText('Yeni gelen mesaj')).toBeTruthy()
  })

  it('ekran kapaninca abonelik iptal edilir', async () => {
    const { unmount } = await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(mesajlaraAbonelOl).toHaveBeenCalled()
    })

    await unmount()

    expect(bosAbonelikIptali).toHaveBeenCalled()
  })
})
