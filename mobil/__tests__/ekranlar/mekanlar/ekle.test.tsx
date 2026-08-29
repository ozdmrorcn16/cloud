import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanEkleEkrani from '../../../src/app/mekanlar/ekle'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle } from '../../../lib/mekan'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/mekan', () => ({
  yakinMekanlariGetir: jest.fn().mockResolvedValue([]),
  mekanEkle: jest.fn(),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
  ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([])
})

describe('MekanEkleEkrani', () => {
  it('gecerli bilgilerle mekanEkle cagirir ve yeni mekanin check-in ekranina yonlendirir', async () => {
    ;(mekanEkle as jest.Mock).mockResolvedValue({
      id: 'mekan-yeni', ad: 'Yeni Kafe', tur: 'kafe', adres: null, osmId: null,
      konum: { lat: 41.015, lng: 28.979 },
    })

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adı'), 'Yeni Kafe')
    await fireEvent.press(screen.getByText('Kafe'))
    await fireEvent.press(screen.getByText('Ekle'))

    await waitFor(() => {
      expect(mekanEkle).toHaveBeenCalledWith(
        'Yeni Kafe', 'Kafe', { lat: 41.015, lng: 28.979 }, { lat: 41.015, lng: 28.979 }, undefined
      )
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/check-in/mekan-yeni')
  })

  it('sunucu mesafe hatasi donerse gosterir', async () => {
    ;(mekanEkle as jest.Mock).mockRejectedValue(new Error('Mekana yakin olmalisin (~200 m icinde)'))

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adı'), 'Uzak Kafe')
    await fireEvent.press(screen.getByText('Kafe'))
    await fireEvent.press(screen.getByText('Ekle'))

    await waitFor(() => {
      expect(screen.getByText('Mekana yakin olmalisin (~200 m icinde)')).toBeTruthy()
    })
  })

  it('yakinda benzer isimli mekan varsa uyari gosterir', async () => {
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-benzer', ad: 'Yeni Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adı'), 'Yeni Kafe')

    await waitFor(() => {
      expect(screen.getByText('Bunlardan biri mi demek istedin?')).toBeTruthy()
      expect(screen.getByText('Yeni Kafe')).toBeTruthy()
    })
    expect(mekanEkle).not.toHaveBeenCalled()
  })

  it('konum alinamadiysa hata gosterir ve mekanEkle cagirmaz', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockRejectedValue(new Error('Konum izni reddedildi'))

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adı'), 'Yeni Kafe')
    await fireEvent.press(screen.getByText('Kafe'))
    await fireEvent.press(screen.getByText('Ekle'))

    await waitFor(() => {
      expect(screen.getByText('Konum alınamadı, tekrar dene')).toBeTruthy()
    })
    expect(mekanEkle).not.toHaveBeenCalled()
  })
})
