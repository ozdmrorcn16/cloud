import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import BaglarEkrani from '../../src/app/baglar'
import {
  gelenIstekleriGetir,
  gidenIstekleriGetir,
  takipcilerimiGetir,
  takipEttiklerimiGetir,
} from '../../lib/bag-listeleri'
import {
  takipIsteginiYanitla,
  sohbetIsteginiYanitla,
  takibiBirak,
  takipciyiCikar,
} from '../../lib/bag'
import { engelle } from '../../lib/engelleme'

jest.mock('../../lib/bag-listeleri', () => ({
  gelenIstekleriGetir: jest.fn(),
  gidenIstekleriGetir: jest.fn(),
  takipcilerimiGetir: jest.fn(),
  takipEttiklerimiGetir: jest.fn(),
}))

jest.mock('../../lib/bag', () => ({
  takipIsteginiYanitla: jest.fn(),
  sohbetIsteginiYanitla: jest.fn(),
  takibiBirak: jest.fn(),
  takipciyiCikar: jest.fn(),
}))

jest.mock('../../lib/engelleme', () => ({
  engelle: jest.fn(),
}))

function bosListeleriKur() {
  ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
  ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(takipEttiklerimiGetir as jest.Mock).mockResolvedValue([])
}

beforeEach(() => {
  jest.clearAllMocks()
  bosListeleriKur()
})

describe('BaglarEkrani', () => {
  it('gelen istegi kabul eder', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
    ;(takipEttiklerimiGetir as jest.Mock).mockResolvedValue([])
    ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('k1', true))
  })

  it('kabul butonunun yaninda ne verildigini yazar', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
    ;(takipEttiklerimiGetir as jest.Mock).mockResolvedValue([])

    await render(<BaglarEkrani />)
    expect(
      await screen.findByText('Kabul edersen check-in-lerini gorebilecek.')
    ).toBeTruthy()
  })

  it('takipciyi cikarir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])
    ;(takipEttiklerimiGetir as jest.Mock).mockResolvedValue([])
    ;(takipciyiCikar as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Cikar'))
    await waitFor(() => expect(takipciyiCikar).toHaveBeenCalledWith('k2'))
  })

  it('gelen istegi reddeder', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('k1', false))
  })

  it('gelen sohbet istegini kabul eder', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [],
      sohbet: [{ id: 'k5', kullaniciAdi: 'zeynep', ad: 'Zeynep K' }],
    })
    ;(sohbetIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    await waitFor(() => expect(sohbetIsteginiYanitla).toHaveBeenCalledWith('k5', true))
  })

  it('gelen istekte engelle cagirir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    ;(engelle as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Engelle'))

    await waitFor(() => expect(engelle).toHaveBeenCalledWith('k1'))
  })

  it('giden istekleri listeler', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k3', kullaniciAdi: 'mert', ad: 'Mert D' }],
      sohbet: [],
    })

    await render(<BaglarEkrani />)

    expect(await screen.findByText('mert')).toBeTruthy()
  })

  it('takip ettiklerimi listeler ve takibi birakabilirim', async () => {
    ;(takipEttiklerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k4', kullaniciAdi: 'burak', ad: 'Burak S' },
    ])
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Takibi birak'))

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('k4'))
  })

  it('takipcilerimi listeler', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])

    await render(<BaglarEkrani />)

    expect(await screen.findByText('ayse')).toBeTruthy()
  })
})
