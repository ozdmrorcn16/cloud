import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanAramaEkrani from '../../../src/app/mekanlar/index'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariYogunlukIleGetir } from '../../../lib/mekan'

// mesafeMetre de mock'lanmali: ekran mekan uzakligini bununla
// hesapliyor. Yalnizca cihazKonumunuAl mock'lanirsa mesafeMetre
// undefined kalir ve ekran cizilirken patlar.
jest.mock('../../../lib/konum', () => ({
  cihazKonumunuAl: jest.fn(),
  mesafeMetre: jest.fn(() => 240),
}))
// kesfetIcinSuz saf bir fonksiyon (ag yok, yan etki yok): mock'lamak
// yerine GERCEGI kullaniliyor, boylece ekranin suzme davranisi de
// birlikte dogrulanmis oluyor. Yalnizca ag cagrisi mock'lanir.
jest.mock('../../../lib/mekan', () => ({
  ...jest.requireActual('../../../lib/mekan'),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))

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
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(41.015, 28.979, 5000, undefined)
  })

  it('bir mekana basinca detay ekranina yonlendirir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
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
      // Ham hata metni yerine ne yapilacagini soyleyen bir ekran
      // cikiyor; kullaniciya "izin verilmedi" demek tek basina yon
      // vermiyordu.
      expect(screen.getByText('Çevreni göremiyoruz')).toBeTruthy()
      expect(screen.getByText('Tekrar dene')).toBeTruthy()
    })
  })

  it('arama sirasinda sorgu basarisiz olursa hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
          konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
        },
      ])
      .mockRejectedValueOnce(new Error('Sunucuya ulasilamadi'))

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'kafe')

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })

  it('her mekanin yanindaki kisi sayisini gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 8,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('8 kişi burada')).toBeTruthy()
    })
  })

  it('kisi sayisi 0 ise gosterilmez', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(screen.queryByText('0 kişi burada')).toBeNull()
  })

  it('yaricap secicisi 5 km ustunu sunmaz', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    expect(screen.queryByText('10 km')).toBeNull()
    expect(screen.getByText('5 km')).toBeTruthy()
  })

  it('yaricap degistirilince yeni yaricapla sorgu yapar', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(41.015, 28.979, 5000, undefined))

    await fireEvent.press(screen.getByText('1 km'))

    await waitFor(() => {
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(41.015, 28.979, 1000, undefined)
    })
  })
})
