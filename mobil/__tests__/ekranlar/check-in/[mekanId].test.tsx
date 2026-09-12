import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import CheckInEkrani from '../../../src/app/check-in/[mekanId]'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import * as ImagePicker from 'expo-image-picker'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { etiketleriKaydet } from '../../../lib/etiket'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
jest.mock('../../../lib/etiket', () => ({ etiketleriKaydet: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ checkInYap: jest.fn() }))
jest.mock('../../../lib/checkin-fotograf-yukle', () => ({ checkinFotografYukle: jest.fn() }))
jest.mock('../../../lib/ayarlar', () => ({ varsayilanBulunurluguGetir: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
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
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(etiketleriKaydet as jest.Mock).mockResolvedValue(undefined)
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
    ;(checkInYap as jest.Mock).mockRejectedValue(new Error('Mekana cok uzaksin (~1 km icinde olmalisin)'))

    await render(<CheckInEkrani />)
    const buttons = screen.getAllByText('Check-in yap')
    await fireEvent.press(buttons[buttons.length - 1]) // Press the button, not the title

    await waitFor(() => {
      expect(screen.getByText('Mekana cok uzaksin (~1 km icinde olmalisin)')).toBeTruthy()
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

    // Fotograf: once KAYNAK penceresi aciliyor (2026-09-08), sonra
    // galeri seciliyor.
    await fireEvent.press(screen.getByText('Fotoğraf ekle (opsiyonel)'))
    await fireEvent.press(await screen.findByTestId('foto-galeri'))

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

  it('AYARLARDAKI varsayilan bulunurlugu check-in-e gecirir', async () => {
    // Kullanicinin karari 2026-08-30: "Seni kim gorsun" secimi bu
    // ekrandan kaldirildi. Deger artik Ayarlar'daki varsayilandan
    // geliyor, her check-in'de sorulmuyor.
    ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('takipcilerim')
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'ci-1' })

    await render(<CheckInEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    // Ekranda secim satiri YOK.
    expect(screen.queryByText('Seni kim görsün')).toBeNull()
    expect(screen.queryByText('Sadece takipçilerim')).toBeNull()

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
    // Secim satiri kalktigi icin "secili gorunuyor mu" diye bakilamiyor.
    // Butonun gercekten etkinlestiginin olcutu artik davranis: ikinci
    // basiste checkInYap CAGRILIYOR.
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    await waitFor(async () => {
      await fireEvent.press(screen.getAllByText('Check-in yap').slice(-1)[0])
      expect(checkInYap).toHaveBeenCalled()
    })
  })

  it('profil okumasi basarisiz olursa gizliye duser, herkese_acik gondermez', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

    await render(<CheckInEkrani />)
    // Artik ekranda secim satiri yok; dogru olcut GONDERILEN deger.
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

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


/**
 * FOTOGRAF KAYNAGI - kullanicinin istegi 2026-09-08: "fotograf
 * eklemeye basilinca canli fotograf cekmede olsun kamera acilsin".
 */
describe('CheckInEkrani fotograf kaynagi', () => {
  it('"Fotoğraf ekle" DOGRUDAN galeriyi acmiyor, once kaynak soruyor', async () => {
    await render(<CheckInEkrani />)

    await fireEvent.press(screen.getByText('Fotoğraf ekle (opsiyonel)'))

    expect(await screen.findByTestId('foto-kamera')).toBeTruthy()
    expect(screen.getByTestId('foto-galeri')).toBeTruthy()
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
  })

  it('"Fotoğraf çek" izin isteyip KAMERAYI aciyor', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
    ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///local/cekilen.jpg' }],
    })

    await render(<CheckInEkrani />)
    await fireEvent.press(screen.getByText('Fotoğraf ekle (opsiyonel)'))
    await fireEvent.press(await screen.findByTestId('foto-kamera'))

    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled())
    // Galeri ACILMIYOR: iki kaynak birbirinin yerine gecmiyor.
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
  })

  it('kamera izni REDDEDILIRSE sessiz kalmiyor, uyari gosteriyor', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false })

    await render(<CheckInEkrani />)
    await fireEvent.press(screen.getByText('Fotoğraf ekle (opsiyonel)'))
    await fireEvent.press(await screen.findByTestId('foto-kamera'))

    expect(
      await screen.findByText('Fotoğraf çekmek için kamera izni gerekiyor.')
    ).toBeTruthy()
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled()
  })

  // ------------------------------------------------------------------ //
  // ARKADAS EKLE (kullanicinin istegi 2026-09-12)
  //
  // Onceden etiketleme satir ici ciplerdi ve arkadas listesi BOSKEN hic
  // cizilmiyordu; hesabinda arkadas olmayan biri ozelligi hic
  // gormuyordu. Buton artik her zaman gorunuyor.
  // ------------------------------------------------------------------ //

  it('"Arkadaş ekle" butonu arkadas YOKKEN de gorunuyor ve pencere sebebini soyluyor', async () => {
    await render(<CheckInEkrani />)
    const buton = await screen.findByText('Arkadaş ekle (opsiyonel)')
    await fireEvent.press(buton)
    expect(await screen.findByText(/Henüz arkadaşın yok/)).toBeTruthy()
  })

  it('pencereden secilen arkadas butonun altinda cip olarak durur ve check-in ile etiketlenir', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k-2', ad: 'Deniz', kullaniciAdi: 'deniz' },
      { id: 'k-3', ad: 'Ece', kullaniciAdi: 'ece' },
    ])
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-9', mekanId: 'mekan-1', notMetni: null, fotograf: null,
      olusturmaZamani: '2026-09-12T10:00:00Z', bitisZamani: '2026-09-12T11:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaş ekle (opsiyonel)'))
    await fireEvent.press(await screen.findByLabelText('Deniz'))
    await fireEvent.press(screen.getByText('Tamam (1)'))

    // Buton sayiyi soyluyor, cip duruyor.
    expect(await screen.findByText('Arkadaş ekle (1 seçili)')).toBeTruthy()
    expect(screen.getByLabelText('Deniz etiketini kaldır')).toBeTruthy()

    const butonlar = screen.getAllByText('Check-in yap')
    await fireEvent.press(butonlar[butonlar.length - 1])
    await waitFor(() => expect(etiketleriKaydet).toHaveBeenCalledWith('checkin-9', ['k-2']))
  })

  it('cipe dokununca etiket kalkar', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k-2', ad: 'Deniz', kullaniciAdi: 'deniz' },
    ])
    await render(<CheckInEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaş ekle (opsiyonel)'))
    await fireEvent.press(await screen.findByLabelText('Deniz'))
    await fireEvent.press(screen.getByText('Tamam (1)'))
    await fireEvent.press(await screen.findByLabelText('Deniz etiketini kaldır'))

    expect(await screen.findByText('Arkadaş ekle (opsiyonel)')).toBeTruthy()
    expect(screen.queryByLabelText('Deniz etiketini kaldır')).toBeNull()
  })

  it('pencerede arama listeyi suzer', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k-2', ad: 'Deniz', kullaniciAdi: 'deniz' },
      { id: 'k-3', ad: 'Ece', kullaniciAdi: 'ece' },
    ])
    await render(<CheckInEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaş ekle (opsiyonel)'))
    await screen.findByLabelText('Ece')
    await fireEvent.changeText(screen.getByTestId('arkadas-secici-arama'), 'den')

    expect(screen.getByLabelText('Deniz')).toBeTruthy()
    expect(screen.queryByLabelText('Ece')).toBeNull()
  })
})
