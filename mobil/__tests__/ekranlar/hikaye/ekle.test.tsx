import React from 'react'
import { View } from 'react-native'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import HikayeEkleEkrani from '../../../src/app/hikaye/ekle'
import { hikayeEkle } from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { galeriKullanilabilirMi } from '../../../lib/galeri'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock('../../../lib/kamera', () => ({
  kameraKullanilabilirMi: jest.fn(() => false),
  kameraGorunumu: jest.fn(() => null),
  kameraIzniAl: jest.fn().mockResolvedValue(false),
}))
jest.mock('../../../lib/galeri', () => ({
  galeriKullanilabilirMi: jest.fn(() => false),
  sonFotograflariGetir: jest.fn().mockResolvedValue([]),
}))
const { sonFotograflariGetir } = jest.requireMock('../../../lib/galeri')
const kameraMock = jest.requireMock('../../../lib/kamera')
jest.mock('../../../lib/hikaye', () => ({ ...jest.requireActual('../../../lib/hikaye'), hikayeEkle: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ aktifCheckInimiGetir: jest.fn() }))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

const mockBack = jest.fn()
const mockReplace = jest.fn()
let mockFotoParam: { foto?: string } = {}
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => mockFotoParam,
}))

/**
 * HIKAYE EKLE (2026-09-22): kaynak secimi -> onizleme -> yazi/mekan -> Paylas.
 */

/**
 * YENI AKIS (2026-09-23): siyah ekranda sol alttaki galeri karesi ->
 * alttan galeri sayfasi. Jest'te native galeri modulu yok, o yuzden
 * sayfa sistem secicisi satirini gosteriyor.
 */
/**
 * Izgara bu derlemede YOKKEN (jest varsayilani) sol alttaki kare
 * DOGRUDAN sistem galerisini aciyor - arada sayfa yok (kullanicinin
 * istegi 2026-09-23: "basinca da galeri direkt acilmiyor").
 */
async function galeridenFotografSec() {
  await fireEvent.press(screen.getByTestId('hikaye-galeri-karesi'))
  await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
}

/** Kamera SOL RAFTA (alttan sayfa kalktiktan sonra oraya tasindi). */
async function kameradanCek() {
  await fireEvent.press(screen.getByTestId('hikaye-arac-kamera'))
}

async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

beforeEach(() => {
    mockFotoParam = {}
    ;(galeriKullanilabilirMi as jest.Mock).mockReturnValue(false)
  jest.clearAllMocks()
  // clearAllMocks cagrilari siler ama DAVRANISI silmez; kamera mock'lari
  // her testte varsayilana donmeli (bkz. 2026-09-21 dersi).
  kameraMock.kameraKullanilabilirMi.mockReturnValue(false)
  kameraMock.kameraGorunumu.mockReturnValue(null)
  kameraMock.kameraIzniAl.mockResolvedValue(false)
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///galeri.jpg' }] })
  ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
  ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///kamera.jpg' }] })
  ;(hikayeEkle as jest.Mock).mockResolvedValue('h-yeni')
})

describe('HikayeEkleEkrani', () => {
  it('acilista SIYAH EKRAN + galeri karesi; galeriden secince onizleme gelir, Paylas etkinlesir', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-galeri-karesi')).toBeTruthy()
    // Fotograf yokken Paylas pasif.
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: true })
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: false })
  })

  it('kamera izni reddedilirse hata gosterir', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false })
    await render(<HikayeEkleEkrani />)
    await kameradanCek()
    expect(await screen.findByText('Fotoğraf çekmek için kamera izni gerekiyor.')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-onizleme')).toBeNull()
    // Kapatma zamanlayicisi (400 ms) menu yeniden acikken geri GONDERMEZ.
    await act(() => new Promise<void>((r) => setTimeout(r, 500)))
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('yazi 200 ile sinirli; aktif check-in varsa mekan etiketi tuvale gelir; Paylas hikayeEkle cagirir ve geri doner', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    expect(await screen.findByTestId('hikaye-oge-mekan')).toBeTruthy()
    expect(screen.getByText('Hozee')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('hikaye-arac-not'))
    await fireEvent.changeText(screen.getByTestId('hikaye-yazi'), 'a'.repeat(260))
    // 200 ile sinirli: girdi degeri kirpilir.
    expect(screen.getByTestId('hikaye-yazi').props.value).toHaveLength(200)
    await fireEvent.changeText(screen.getByTestId('hikaye-yazi'), 'selam')
    await fireEvent.press(screen.getByTestId('hikaye-yazi-tamam'))

    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', 'selam', 'mekan-1', null, [], 'arkadaslar', expect.any(Object))
    )
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('mekan etiketi kaldirilinca mekansiz paylasilir', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-oge-mekan')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('hikaye-arac-mekan'))
    await menudenSec('hikaye-mekan-kaldir')
    await waitFor(() => expect(screen.queryByTestId('hikaye-oge-mekan')).toBeNull())
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', '', null, null, [], 'arkadaslar', expect.any(Object))
    )
  })

  it('GORUNURLUK secilebiliyor: Herkese secilince oyle paylasiliyor', async () => {
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    // Varsayilan Arkadaslar.
    expect(screen.getByTestId('hikaye-gorunurluk')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-gorunurluk'))
    await menudenSec('hikaye-gorunurluk-herkese')
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', '', null, null, [], 'herkese_acik', expect.any(Object))
    )
  })

  it('× fotografi KALDIRIR ve siyah ekrana doner (ekrandan cikmaz)', async () => {
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    await waitFor(() => expect(screen.queryByTestId('hikaye-onizleme')).toBeNull())
    expect(await screen.findByTestId('hikaye-galeri-karesi')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  /** Fotograf secme ekranindan gelince kaynak secimi ACILMAZ. */
  it('foto parametresiyle acilinca dogrudan duzenlemeye gecer', async () => {
    mockFotoParam = { foto: 'file:///secilen.jpg' }
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-onizleme')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-galeri-karesi')).toBeNull()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///secilen.jpg', '', null, null, [], 'arkadaslar', expect.any(Object))
    )
  })

  it('sunucu reddederse hata metni ekranda, geri donmez', async () => {
    ;(hikayeEkle as jest.Mock).mockRejectedValue(new Error('Aynı anda en fazla 10 hikâyen olabilir.'))
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    expect(await screen.findByTestId('hikaye-hata')).toHaveTextContent('Aynı anda en fazla 10 hikâyen olabilir.')
    expect(mockBack).not.toHaveBeenCalled()
  })

  /**
   * "ONCE SIYAH EKRAN" (kullanicinin istegi 2026-09-22). Secim iptal
   * edilince ekran KAPANMIYOR - siyah tuval kaliyor ve dokunmak
   * kaynak secimini yeniden aciyor. Cikis yalnizca x ile.
   */
  it('galeri iptal edilince ekran KAPANMIYOR, siyah ekran kaliyor', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: [] })
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(screen.getByTestId('hikaye-galeri-karesi'))

    await act(() => new Promise<void>((r) => setTimeout(r, 500)))
    expect(mockBack).not.toHaveBeenCalled()
    expect(screen.getByTestId('hikaye-galeri-karesi')).toBeTruthy()

    // Kareye dokunmak sistem galerisini yeniden aciyor.
    await fireEvent.press(screen.getByTestId('hikaye-galeri-karesi'))
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(2))
  })

  it('ARAC CIPLERI siyah ekranda da cizilir, Paylas fotografsiz pasif', async () => {
    await render(<HikayeEkleEkrani />)
    // Fotograf YOKKEN de cipler ve alt satir duruyor.
    expect(await screen.findByTestId('hikaye-araclar')).toBeTruthy()
    expect(screen.getByTestId('hikaye-arac-mekan')).toBeTruthy()
    expect(screen.getByTestId('hikaye-arac-ifade')).toBeTruthy()
    expect(screen.getByTestId('hikaye-arac-arkadas')).toBeTruthy()
    expect(screen.getByTestId('hikaye-gorunurluk')).toBeTruthy()
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState.disabled).toBe(true)

    await galeridenFotografSec()
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState.disabled).toBe(false)
  })

  it('IFADE secilince tuvale gelir; Paylas ifadeyi gonderiyor', async () => {
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-araclar')).toBeTruthy())

    await fireEvent.press(screen.getByTestId('hikaye-arac-ifade'))
    await fireEvent.press(await screen.findByTestId('ifade-kahve-keyfi'))

    // Ifade artik fotografin UZERINDE bir oge (suruklenebilir), cip degil.
    expect(await screen.findByTestId('hikaye-oge-ifade')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', '', null, 'kahve-keyfi', [], 'arkadaslar', expect.any(Object))
    )
  })

  it('ARKADAS etiketlenip kaldirilabiliyor; Paylas etiketi gonderiyor', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'kullanici-2', ad: 'Ada', kullaniciAdi: 'ada', avatarUrl: null },
    ])
    await render(<HikayeEkleEkrani />)
    await galeridenFotografSec()
    await waitFor(() => expect(screen.getByTestId('hikaye-araclar')).toBeTruthy())

    await fireEvent.press(screen.getByTestId('hikaye-arac-arkadas'))
    await fireEvent.press(await screen.findByText('ada'))
    expect(await screen.findByTestId('hikaye-oge-etiket-kullanici-2')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', '', null, null, ['kullanici-2'], 'arkadaslar', expect.any(Object))
    )
  })

  /**
   * GALERI SAYFASI (kullanicinin referansi 2026-09-23): izgara
   * okunabiliyorsa kare alttan sayfayi aciyor; ILK HUCRE KAMERA,
   * gerisi son fotograflar. Web/jest'te native modul yok, bu yuzden
   * izgarali yol yalnizca burada olculuyor.
   */
  it('izgara varken kare SAYFAYI acar: ilk hucre kamera, fotografa dokunmak tuvale koyar', async () => {
    ;(galeriKullanilabilirMi as jest.Mock).mockReturnValue(true)
    ;(sonFotograflariGetir as jest.Mock).mockResolvedValue([
      { id: 'g1', uri: 'file:///g1.jpg' },
      { id: 'g2', uri: 'file:///g2.jpg' },
    ])
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(screen.getByTestId('hikaye-galeri-karesi'))

    expect(await screen.findByTestId('galeri-kamera')).toBeTruthy()
    expect(await screen.findByTestId('galeri-g1')).toBeTruthy()
    expect(screen.getByTestId('galeri-g2')).toBeTruthy()
    // Izgara varken "Galeriden sec" satiri YOK.
    expect(screen.queryByTestId('galeri-sistem')).toBeNull()

    await fireEvent.press(screen.getByTestId('galeri-g2'))
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
  })


  /**
   * CANLI KAMERA (kullanicinin istegi 2026-09-23). Modul YOKSA
   * onizleme ve deklansor hic cizilmiyor - eski derlemede ekran bugunku
   * siyah tuval olarak kaliyor.
   */
  it('kamera modulu yoksa canli onizleme ve deklansor CIZILMEZ', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-galeri-karesi')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-kamera-onizleme')).toBeNull()
    expect(screen.queryByTestId('hikaye-deklansor')).toBeNull()
  })

  it('kamera varken canli onizleme ve deklansor gelir; yuvarlak tus kareyi tuvale koyar', async () => {
    const cek = jest.fn().mockResolvedValue({ uri: 'file:///cekilen.jpg' })
    kameraMock.kameraKullanilabilirMi.mockReturnValue(true)
    kameraMock.kameraIzniAl.mockResolvedValue(true)
    // Sahte onizleme bileseni: ref'e takePictureAsync veriyor.
    kameraMock.kameraGorunumu.mockReturnValue(
      React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
        React.useImperativeHandle(ref, () => ({ takePictureAsync: cek }))
        return <View testID={props.testID as string} />
      })
    )

    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-kamera-onizleme')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-deklansor'))
    await waitFor(() => expect(cek).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    // Fotograf gelince deklansor kalkiyor.
    expect(screen.queryByTestId('hikaye-deklansor')).toBeNull()
  })

})
