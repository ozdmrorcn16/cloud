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
  sohbetIsteginiGeriCek,
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
  sohbetIsteginiGeriCek: jest.fn(),
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
      await screen.findByText("Kabul edersen check-in'lerini gorebilecek.")
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

  it('gelen sohbet istegini reddeder', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [],
      sohbet: [{ id: 'k5', kullaniciAdi: 'zeynep', ad: 'Zeynep K' }],
    })
    ;(sohbetIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(sohbetIsteginiYanitla).toHaveBeenCalledWith('k5', false))
    await waitFor(() => expect(screen.queryByText('zeynep')).toBeNull())
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

  it('giden takip istegini geri ceker', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k3', kullaniciAdi: 'mert', ad: 'Mert D' }],
      sohbet: [],
    })
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Geri cek'))

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('k3'))
    await waitFor(() => expect(screen.queryByText('mert')).toBeNull())
  })

  it('giden sohbet istegini geri ceker', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [],
      sohbet: [{ id: 'k6', kullaniciAdi: 'deniz', ad: 'Deniz K' }],
    })
    ;(sohbetIsteginiGeriCek as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Geri cek'))

    await waitFor(() => expect(sohbetIsteginiGeriCek).toHaveBeenCalledWith('k6'))
    await waitFor(() => expect(screen.queryByText('deniz')).toBeNull())
  })

  it('giden sohbet istegi geri cekme basarisiz olursa hata gosterir ve satiri listeden kaldirmaz', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [],
      sohbet: [{ id: 'k6', kullaniciAdi: 'deniz', ad: 'Deniz K' }],
    })
    ;(sohbetIsteginiGeriCek as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Geri cek'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('deniz')).toBeTruthy()
  })

  it('ayni kisiye hem takip hem sohbet istegi gonderilmisse giden istekler listesinde iki ayri satir gorunur', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k7', kullaniciAdi: 'mert', ad: 'Mert D' }],
      sohbet: [{ id: 'k7', kullaniciAdi: 'mert', ad: 'Mert D' }],
    })
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)
    ;(sohbetIsteginiGeriCek as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)

    const gonderilenSatirlar = await screen.findAllByText('mert')
    expect(gonderilenSatirlar).toHaveLength(2)

    const geriCekButonlari = screen.getAllByText('Geri cek')
    expect(geriCekButonlari).toHaveLength(2)

    // Ilk satir gidenTakip'ten geliyor (data dizisinde takip once ekleniyor).
    await fireEvent.press(geriCekButonlari[0])
    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('k7'))
    expect(sohbetIsteginiGeriCek).not.toHaveBeenCalled()

    // Yalnizca takip satiri kalkmis olmali; sohbet satiri hala orada ve
    // kendi isleyicisine bagli kalmis olmali (bilesik anahtar sayesinde
    // React iki satiri karistirmiyor).
    await waitFor(() => expect(screen.getAllByText('mert')).toHaveLength(1))
    const kalanButon = screen.getByText('Geri cek')
    await fireEvent.press(kalanButon)
    await waitFor(() => expect(sohbetIsteginiGeriCek).toHaveBeenCalledWith('k7'))
    await waitFor(() => expect(screen.queryByText('mert')).toBeNull())
  })

  it('giden istegi geri cekme basarisiz olursa hata gosterir ve satiri listeden kaldirmaz', async () => {
    ;(gidenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k3', kullaniciAdi: 'mert', ad: 'Mert D' }],
      sohbet: [],
    })
    ;(takibiBirak as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Geri cek'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('mert')).toBeTruthy()
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

  it('disarida tek bir kaydirici var ve butun ic listeler kendi kaydirmasini kapatiyor', async () => {
    // Bes FlatList tek bir View'da flex:1 icinde ustuste durdugunda dis
    // kaydirma yoktu ve son bolumler ("Takipcilerim", "Takip ettiklerim")
    // telefonda kirpilip erisilemez oluyordu (final inceleme Madde 4).
    // Duzeltme: tek bir ScrollView + her FlatList'te scrollEnabled=false.
    await render(<BaglarEkrani />)
    await waitFor(() => expect(gelenIstekleriGetir).toHaveBeenCalled())

    const kok = screen.root
    if (!kok) throw new Error('render kok elemani yok')

    // Dis kaydirici tam olarak kok eleman (screen.root); testID'siyle
    // kanitlaniyor.
    expect(kok.props.testID).toBe('baglar-kaydirici')

    // FlatList kendi host RCTScrollView'ina indiriyor; ic kaydirmanin
    // gercekten kapali oldugunu (yalnizca prop olarak GECMEDIGINI degil,
    // rendered agacta da gorunecegini) bu seviyede dogruluyoruz.
    // includeSelf: false (varsayilan) oldugu icin kok kendisi bu listeye
    // girmiyor, yalnizca 5 ic FlatList'in host'lari giriyor.
    const icKaydiricilar = kok.queryAll(
      (dugum) => dugum.type === 'RCTScrollView'
    )
    expect(icKaydiricilar).toHaveLength(5)
    for (const dugum of icKaydiricilar) {
      expect(dugum.props.scrollEnabled).toBe(false)
    }
  })

  it('yanitlama hatasinda hata bandini gosterir ve satiri listeden kaldirmaz', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    ;(takipIsteginiYanitla as jest.Mock).mockRejectedValue(
      new Error('Yanitlanacak istek bulunamadi')
    )

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    expect(await screen.findByText('Yanitlanacak istek bulunamadi')).toBeTruthy()
    expect(screen.queryByText('orcun')).toBeTruthy()
  })
})
