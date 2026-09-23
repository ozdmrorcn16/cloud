import React from 'react'
import { View } from 'react-native'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import HikayeEkleEkrani from '../../../src/app/hikaye/ekle'
import { hikayeEkle } from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'

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
const kameraMock = jest.requireMock('../../../lib/kamera')
jest.mock('../../../lib/hikaye', () => ({ ...jest.requireActual('../../../lib/hikaye'), hikayeEkle: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ aktifCheckInimiGetir: jest.fn() }))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

const mockBack = jest.fn()
const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
}))

/**
 * ANI EKLE (2026-09-23, kullanicinin karari: "sipsak" - galeriden
 * yukleme YOK, yalnizca anlik cekim). Cekim ekrani: canli onizleme +
 * flas / deklansor / cevir + gorunurluk hapi. Kare gelince duzenleme:
 * sol raf (Not/Mekan/Ifade/Etiketle) + Arkadaslar + Paylas.
 *
 * Jest varsayilani canli kamera modulu YOK (eski derleme): deklansor
 * SISTEM KAMERASINI aciyor. Canli kamerali yol en alttaki iki testte.
 */

/** Deklansor -> sistem kamerasi -> kare tuvalde. */
async function cek() {
  await fireEvent.press(await screen.findByTestId('hikaye-deklansor'))
  await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
}

async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

beforeEach(() => {
  jest.clearAllMocks()
  // clearAllMocks cagrilari siler ama DAVRANISI silmez; kamera mock'lari
  // her testte varsayilana donmeli (bkz. 2026-09-21 dersi).
  kameraMock.kameraKullanilabilirMi.mockReturnValue(false)
  kameraMock.kameraGorunumu.mockReturnValue(null)
  kameraMock.kameraIzniAl.mockResolvedValue(false)
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
  ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///kamera.jpg' }] })
  ;(hikayeEkle as jest.Mock).mockResolvedValue('h-yeni')
})

describe('HikayeEkleEkrani', () => {
  it('acilista CEKIM EKRANI: baslik "Anı ekle", deklansor ve gorunurluk; duzenleme araclari ve Paylas YOK', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByText('Anı ekle')).toBeTruthy()
    expect(screen.getByTestId('hikaye-deklansor')).toBeTruthy()
    expect(screen.getByTestId('hikaye-gorunurluk')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-araclar')).toBeNull()
    expect(screen.queryByTestId('hikaye-paylas')).toBeNull()

    await cek()
    expect(screen.getByTestId('hikaye-araclar')).toBeTruthy()
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: false })
    // Kare gelince deklansor kalkiyor.
    expect(screen.queryByTestId('hikaye-deklansor')).toBeNull()
  })

  /** Kullanicinin karari: "galeriden fotograf yuklenemicek". */
  it('GALERI YOK: hicbir galeri girisi cizilmez, sistem galerisi hic acilmaz', async () => {
    await render(<HikayeEkleEkrani />)
    await screen.findByTestId('hikaye-deklansor')
    expect(screen.queryByTestId('hikaye-galeri-karesi')).toBeNull()
    expect(screen.queryByTestId('galeri-sayfasi')).toBeNull()
    expect(screen.queryByTestId('galeri-sistem')).toBeNull()
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    await screen.findByTestId('hikaye-deklansor')
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
  })

  it('kamera izni reddedilirse hata gosterir, ekranda kalir', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false })
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(await screen.findByTestId('hikaye-deklansor'))
    expect(await screen.findByText('Fotoğraf çekmek için kamera izni gerekiyor.')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-onizleme')).toBeNull()
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('kamera iptal edilince ekran KAPANMIYOR; deklansor yeniden kamerayi acar', async () => {
    ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({ canceled: true, assets: [] })
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(await screen.findByTestId('hikaye-deklansor'))
    await act(() => new Promise<void>((r) => setTimeout(r, 200)))
    expect(mockBack).not.toHaveBeenCalled()
    expect(screen.queryByTestId('hikaye-onizleme')).toBeNull()

    await cek()
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(2)
  })

  it('yazi 200 ile sinirli; aktif check-in varsa mekan etiketi tuvale gelir; Paylas hikayeEkle cagirir ve geri doner', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await cek()
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
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', 'selam', 'mekan-1', null, [], 'arkadaslar', expect.any(Object))
    )
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('mekan etiketi kaldirilinca mekansiz paylasilir', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await cek()
    await waitFor(() => expect(screen.getByTestId('hikaye-oge-mekan')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('hikaye-arac-mekan'))
    await menudenSec('hikaye-mekan-kaldir')
    await waitFor(() => expect(screen.queryByTestId('hikaye-oge-mekan')).toBeNull())
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', null, null, [], 'arkadaslar', expect.any(Object))
    )
  })

  it('GORUNURLUK cekimden ONCE secilebiliyor ve duzenlemede korunuyor', async () => {
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(await screen.findByTestId('hikaye-gorunurluk'))
    await menudenSec('hikaye-gorunurluk-herkese')
    expect(screen.getByText('Herkese')).toBeTruthy()
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', null, null, [], 'herkese_acik', expect.any(Object))
    )
  })

  it('× fotografi KALDIRIR ve cekim ekranina doner (ekrandan cikmaz); ikinci × cikar', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    await waitFor(() => expect(screen.queryByTestId('hikaye-onizleme')).toBeNull())
    expect(await screen.findByTestId('hikaye-deklansor')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('sunucu reddederse hata metni ekranda, geri donmez', async () => {
    ;(hikayeEkle as jest.Mock).mockRejectedValue(new Error('Aynı anda en fazla 10 hikâyen olabilir.'))
    await render(<HikayeEkleEkrani />)
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    expect(await screen.findByTestId('hikaye-hata')).toHaveTextContent('Aynı anda en fazla 10 hikâyen olabilir.')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('IFADE secilince tuvale gelir; Paylas ifadeyi gonderiyor', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()

    await fireEvent.press(screen.getByTestId('hikaye-arac-ifade'))
    await fireEvent.press(await screen.findByTestId('ifade-kahve-keyfi'))

    // Ifade fotografin UZERINDE bir oge (suruklenebilir), cip degil.
    expect(await screen.findByTestId('hikaye-oge-ifade')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', null, 'kahve-keyfi', [], 'arkadaslar', expect.any(Object))
    )
  })

  it('ARKADAS etiketlenebiliyor; Paylas etiketi gonderiyor', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'kullanici-2', ad: 'Ada', kullaniciAdi: 'ada', avatarUrl: null },
    ])
    await render(<HikayeEkleEkrani />)
    await cek()

    await fireEvent.press(screen.getByTestId('hikaye-arac-arkadas'))
    await fireEvent.press(await screen.findByText('ada'))
    expect(await screen.findByTestId('hikaye-oge-etiket-kullanici-2')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', null, null, ['kullanici-2'], 'arkadaslar', expect.any(Object))
    )
  })

  /**
   * CANLI KAMERA NATIVE. Modul YOKSA (OTA ile guncellenen eski derleme)
   * onizleme, flas ve cevirme cizilmez ama deklansor DURUR ve sistem
   * kamerasini acar - ekran islevsiz kalmaz.
   */
  it('kamera modulu yoksa canli onizleme/flas/cevir CIZILMEZ, deklansor sistem kamerasini acar', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-deklansor')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-kamera-onizleme')).toBeNull()
    expect(screen.queryByTestId('hikaye-flas')).toBeNull()
    expect(screen.queryByTestId('hikaye-kamera-cevir')).toBeNull()
    await cek()
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1)
  })

  it('kamera varken canli onizleme, flas ve cevir gelir; yuvarlak tus kareyi tuvale koyar (sistem kamerasi acilmaz)', async () => {
    const kareAl = jest.fn().mockResolvedValue({ uri: 'file:///cekilen.jpg' })
    kameraMock.kameraKullanilabilirMi.mockReturnValue(true)
    kameraMock.kameraIzniAl.mockResolvedValue(true)
    // Sahte onizleme bileseni: ref'e takePictureAsync veriyor.
    kameraMock.kameraGorunumu.mockReturnValue(
      React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
        React.useImperativeHandle(ref, () => ({ takePictureAsync: kareAl }))
        return <View testID={props.testID as string} />
      })
    )

    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('hikaye-kamera-onizleme')).toBeTruthy()
    expect(screen.getByTestId('hikaye-flas')).toBeTruthy()
    expect(screen.getByTestId('hikaye-kamera-cevir')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('hikaye-flas'))
    expect(screen.getByTestId('hikaye-flas').props.accessibilityState).toEqual({ selected: true })

    await fireEvent.press(screen.getByTestId('hikaye-deklansor'))
    await waitFor(() => expect(kareAl).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled()
    expect(screen.queryByTestId('hikaye-deklansor')).toBeNull()
  })
})
