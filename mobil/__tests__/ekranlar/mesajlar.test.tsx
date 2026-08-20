import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MesajlarEkrani from '../../src/app/mesajlar'
import { konusmalarimiGetir, konusmayiGizle } from '../../lib/sohbet'
import type { Konusma } from '../../lib/sohbet'

jest.mock('../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
  konusmayiGizle: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

function konusma(ustune: Partial<Konusma> = {}): Konusma {
  return {
    konusmaId: 'k1',
    kisiId: 'u1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    sonMesaj: 'Selam, nasilsin?',
    sonMesajZamani: '2026-08-20T10:00:00Z',
    okunmamis: 0,
    yazilabilirMi: true,
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MesajlarEkrani', () => {
  it('konusmalari karsi kisinin adi ve son mesaj onizlemesiyle listeler', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('Selam, nasilsin?')).toBeTruthy()
  })

  it('okunmamis sayisi sifirdan buyukse rozet gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 3 })])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('3')).toBeTruthy()
  })

  it('okunmamis sayisi sifirsa rozet hic render edilmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 0 })])

    await render(<MesajlarEkrani />)

    await screen.findByText('Orcun Ozdemir')
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bir satira basinca kisi id ile sohbet rotasina yonlendirir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Orcun Ozdemir'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/u1'))
  })

  it('Gizle butonuna basinca konusmayiGizle dogru konusma id ile cagrilir ve satir listeden kalkar', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiGizle as jest.Mock).mockResolvedValue(undefined)

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Gizle'))

    await waitFor(() => expect(konusmayiGizle).toHaveBeenCalledWith('k1'))
    await waitFor(() => expect(screen.queryByText('Orcun Ozdemir')).toBeNull())
  })

  it('gizleme reddedilirse hata mesaji gorunur ve satir listede kalir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiGizle as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Gizle'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('liste bossa bos durum metni gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Henuz bir konusman yok')).toBeTruthy()
  })
})
