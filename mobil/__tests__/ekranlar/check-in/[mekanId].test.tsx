import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import CheckInEkrani from '../../../src/app/check-in/[mekanId]'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import * as ImagePicker from 'expo-image-picker'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ checkInYap: jest.fn() }))
jest.mock('../../../lib/checkin-fotograf-yukle', () => ({ checkinFotografYukle: jest.fn() }))
jest.mock('../../../lib/ayarlar', () => ({ varsayilanBulunurluguGetir: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
}))

beforeEach(async () => {
  jest.clearAllMocks()
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
  ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
  // Varsayilan olarak ilk kullanim uyarisi daha once gosterilmis kabul edilir;
  // sadece bunu test eden senaryo bu bayragi acikca temizler.
  await AsyncStorage.setItem('ilk-checkin-uyarisi-gosterildi', 'true')
})

describe('CheckInEkrani', () => {
  it('not ile check-in yapar ve check-in sekmesinde kalir', async () => {
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-1', mekanId: 'mekan-1', notMetni: 'harika', fotograf: null,
      olusturmaZamani: '2026-08-14T10:00:00Z', bitisZamani: '2026-08-14T14:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Bir not ekle (opsiyonel)'), 'harika')
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1]) // Press the button, not the title

    await waitFor(() => {
      expect(checkInYap).toHaveBeenCalledWith('mekan-1', 41.015, 28.979, 'harika', undefined, 'herkese_acik')
    })
    // Check-in sonrasi mekan detayina degil, CHECK-IN SEKMESINE
    // donuluyor (kullanicinin karari 2026-08-29).
    expect(mockRouterReplace).toHaveBeenCalledWith('/mekanlar')
  })

  it('sunucu mesafe hatasi donerse gosterir', async () => {
    ;(checkInYap as jest.Mock).mockRejectedValue(new Error('Mekana cok uzaksin (~500 m icinde olmalisin)'))

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1]) // Press the button, not the title

    await waitFor(() => {
      expect(screen.getByText('Mekana cok uzaksin (~500 m icinde olmalisin)')).toBeTruthy()
    })
  })

  it('fotograf yukleme basarisiz olursa uyari gosterir ve check-in\'i engellemiyor', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///local/photo.jpg' }],
    })
    ;(checkinFotografYukle as jest.Mock).mockRejectedValue(new Error('Upload hatasi'))
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-1', mekanId: 'mekan-1', notMetni: 'not', fotograf: null,
      olusturmaZamani: '2026-08-14T10:00:00Z', bitisZamani: '2026-08-14T14:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Bir not ekle (opsiyonel)'), 'not')

    // Fotograf sec
    await fireEvent.press(screen.getByText('Fotoğraf ekle (opsiyonel)'))

    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('Fotoğraf yüklenemedi, notunla check-in yapıldı')).toBeTruthy()
    })
    // checkInYap fotografsiz cagirilmali
    expect(checkInYap).toHaveBeenCalledWith('mekan-1', 41.015, 28.979, 'not', undefined, 'herkese_acik')
  })

  it('ag hatasi icin ozel mesaj gosterir', async () => {
    ;(checkInYap as jest.Mock).mockRejectedValue(new TypeError('Network request failed'))

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('İnternet bağlantısı yok, tekrar dene')).toBeTruthy()
    })
  })

  it('secilen bulunurluk degerini check-in-e gecirir', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'ci-1' })

    await render(<CheckInEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByText('Sadece takipçilerim'))
    await fireEvent.press(screen.getByText('Check-in yap'))

    // notMetni ve fotograf bu senaryoda gercekten undefined (not yazilmadi,
    // fotograf secilmedi) - expect.anything() Jest'te null/undefined ile
    // eslesmedigi icin bu iki pozisyon icin bilinen degeri dogrudan kontrol
    // ediyoruz; mekanId/lat/lng icin anything() yeterli.
    await waitFor(() =>
      expect(checkInYap).toHaveBeenCalledWith(
        expect.anything(), expect.anything(), expect.anything(),
        undefined, undefined, 'takipcilerim'
      )
    )
  })

  it('varsayilan bulunurlugu onceden secili gosterir', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('gizli')
    await render(<CheckInEkrani />)
    expect(await screen.findByLabelText('Bulunurluk: gizli, seçili')).toBeTruthy()
  })

  it('varsayilan bulunurluk cozulmeden gonder butonu devre disi kalir', async () => {
    let cozBekleneni: (deger: 'herkese_acik') => void = () => {}
    ;(varsayilanBulunurluguGetir as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        cozBekleneni = resolve
      })
    )
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    // Cozulmeden basiliyor: buton devre disi oldugu ve checkInYapButonu
    // da erken donduugu icin checkInYap hic cagrilmamali.
    await fireEvent.press(buttons[buttons.length - 1])
    expect(checkInYap).not.toHaveBeenCalled()

    cozBekleneni('herkese_acik')
    // Yalnizca "cagrildi mi" beklemek yetmez: mock zaten ilk render'da
    // cagrildi. Butonun gercekten etkinlestigini (secenegin secili
    // gorunmesini) beklemek gerekiyor, yoksa ikinci basis hala
    // devre disiyken gerceklesir.
    await waitFor(() =>
      expect(screen.getByLabelText('Bulunurluk: herkese_acik, seçili')).toBeTruthy()
    )

    await fireEvent.press(buttons[buttons.length - 1])
    await waitFor(() => expect(checkInYap).toHaveBeenCalled())
  })

  it('profil okumasi basarisiz olursa gizliye duser, herkese_acik gondermez', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

    await render(<CheckInEkrani />)
    await waitFor(() => {
      expect(screen.getByLabelText('Bulunurluk: gizli, seçili')).toBeTruthy()
    })

    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(checkInYap).toHaveBeenCalledWith(
        'mekan-1', 41.015, 28.979, undefined, undefined, 'gizli'
      )
    })
  })

  it('ilk check-in uyarisini gosterir ve oradan gizliye cevrilebilir', async () => {
    await AsyncStorage.removeItem('ilk-checkin-uyarisi-gosterildi')
    ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

    await render(<CheckInEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Bu check-in ne paylaşıyor?')).toBeTruthy()
    })
    await fireEvent.press(screen.getByText('Gizli yap'))
    await fireEvent.press(screen.getByText('Check-in yap'))

    await waitFor(() => {
      expect(checkInYap).toHaveBeenCalledWith(
        'mekan-1', 41.015, 28.979, undefined, undefined, 'gizli'
      )
    })
  })
})
