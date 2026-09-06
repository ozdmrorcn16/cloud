import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanEkleEkrani from '../../../src/app/mekanlar/ekle'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle } from '../../../lib/mekan'
import { adresOnerisiAl } from '../../../lib/adres'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/adres', () => ({ adresOnerisiAl: jest.fn() }))
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
  // Varsayilan: ONERI YOK. Boylece her test kendi onerisini vermek
  // zorunda kaliyor ve "oneri gelmezse ekran degismiyor" hali de
  // varsayilan olarak sinaniyor.
  ;(adresOnerisiAl as jest.Mock).mockResolvedValue(null)
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

/**
 * ADRES ONERISI (kullanicinin istegi 2026-09-06: "adres kismina
 * bulundugu adresi otomatik doldurma yapilabilir mi, dogru mu diye de
 * sorsun ve degistirilebilsin").
 *
 * Ozellik 2026-08-31'de bir kez KALDIRILMISTI cunku cihazin adres
 * cozumu yanlis mahalle donduruyordu ve kimse dogrulamiyordu. Buradaki
 * testler tam da o itirazi kapatan adimi kilitliyor: oneri gorunur,
 * degistirilebilir ve onaya tabi.
 */
describe('MekanEkleEkrani - adres onerisi', () => {
  it('oneri gelince alani doldurur ve ONAY sorusu gosterir', async () => {
    ;(adresOnerisiAl as jest.Mock).mockResolvedValue('613. Sk No:9 Alaaddinbey')

    await render(<MekanEkleEkrani />)

    await waitFor(() =>
      expect(screen.getByTestId('adres-girdisi').props.value).toBe(
        '613. Sk No:9 Alaaddinbey'
      )
    )
    expect(screen.getByTestId('adres-onayi')).toBeTruthy()
  })

  it('"Doğru" denince onay sorusu kalkiyor ama adres KALIYOR', async () => {
    ;(adresOnerisiAl as jest.Mock).mockResolvedValue('613. Sk No:9 Alaaddinbey')

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(screen.getByTestId('adres-onayi')).toBeTruthy())

    fireEvent.press(screen.getByTestId('adres-dogru'))

    await waitFor(() => expect(screen.queryByTestId('adres-onayi')).toBeNull())
    expect(screen.getByTestId('adres-girdisi').props.value).toBe(
      '613. Sk No:9 Alaaddinbey'
    )
  })

  /**
   * ONERI YANLIS OLABILIR - ozelligin ilk kaldirilma sebebi buydu.
   * Kullanici alani elle degistirdigi anda onay sorusu kalkiyor:
   * artik onaylanacak bir oneri yok, metin kisinin kendisinin.
   */
  it('kullanici alani duzeltince onay sorusu kalkiyor', async () => {
    ;(adresOnerisiAl as jest.Mock).mockResolvedValue('613. Sk No:9 Ertuğrul')

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(screen.getByTestId('adres-onayi')).toBeTruthy())

    fireEvent.changeText(screen.getByTestId('adres-girdisi'), '613. Sk No:9 Alaaddinbey')

    await waitFor(() => expect(screen.queryByTestId('adres-onayi')).toBeNull())
    expect(screen.getByTestId('adres-girdisi').props.value).toBe(
      '613. Sk No:9 Alaaddinbey'
    )
  })

  it('"Temizle" adresi bosaltiyor', async () => {
    ;(adresOnerisiAl as jest.Mock).mockResolvedValue('613. Sk No:9 Alaaddinbey')

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(screen.getByTestId('adres-onayi')).toBeTruthy())

    fireEvent.press(screen.getByTestId('adres-temizle'))

    await waitFor(() => expect(screen.getByTestId('adres-girdisi').props.value).toBe(''))
    expect(screen.queryByTestId('adres-onayi')).toBeNull()
  })

  /** Oneri gelmezse (web, izin yok, saglayici bulamadi) ekran degismiyor. */
  it('oneri gelmezse onay sorusu HIC cikmiyor', async () => {
    await render(<MekanEkleEkrani />)

    await waitFor(() => expect(screen.getByTestId('adres-girdisi')).toBeTruthy())
    expect(screen.queryByTestId('adres-onayi')).toBeNull()
    expect(screen.getByTestId('adres-girdisi').props.value).toBe('')
  })
})
