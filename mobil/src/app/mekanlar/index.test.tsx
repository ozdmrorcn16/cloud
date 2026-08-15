import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanAramaEkrani from './index'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir } from '../../../lib/mekan'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/mekan', () => ({ yakinMekanlariGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MekanAramaEkrani', () => {
  it('acilista cihaz konumuna gore yakin mekanlari listeler', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(yakinMekanlariGetir).toHaveBeenCalledWith(41.015, 28.979, undefined)
  })

  it('bir mekana basinca detay ekranina yonlendirir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('konum izni verilmezse hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockRejectedValue(new Error('Konum izni verilmedi'))
    await render(<MekanAramaEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Konum izni verilmedi')).toBeTruthy()
    })
  })

  it('arama sirasinda sorgu basarisiz olursa hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariGetir as jest.Mock)
      .mockResolvedValueOnce([
        { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
      ])
      .mockRejectedValueOnce(new Error('Sunucuya ulasilamadi'))

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'kafe')

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })
})
