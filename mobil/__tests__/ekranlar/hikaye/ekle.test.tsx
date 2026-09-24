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
  kameraGorunumu: jest.fn(() => null),
  kameraIzinDurumu: jest.fn().mockResolvedValue('modul-yok'),
}))
const kameraMock = jest.requireMock('../../../lib/kamera')
jest.mock('../../../lib/hikaye', () => ({ ...jest.requireActual('../../../lib/hikaye'), hikayeEkle: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ aktifCheckInimiGetir: jest.fn() }))
jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/mekan', () => ({ yakinMekanlariGetir: jest.fn() }))
const { cihazKonumunuAl } = jest.requireMock('../../../lib/konum')
const { yakinMekanlariGetir } = jest.requireMock('../../../lib/mekan')
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: mockPush, canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
}))

/**
 * ANI EKLE (2026-09-23, kullanicinin karari: "sipsak" - galeriden
 * yukleme YOK, yalnizca anlik cekim). Cekim ekrani: canli onizleme +
 * flas / deklansor / cevir + gorunurluk hapi. Kare gelince (2026-09-24):
 * fotograf AYNI kartta, cekim dugmeleri kalkar, altta check-in mekani +
 * Paylas, en altta gizlilik. Paylasan yazi/ifade/etiket EKLEYEMEZ.
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
  kameraMock.kameraGorunumu.mockReturnValue(null)
  kameraMock.kameraIzinDurumu.mockResolvedValue('modul-yok')
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
  ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///kamera.jpg' }] })
  ;(hikayeEkle as jest.Mock).mockResolvedValue('h-yeni')
  cihazKonumunuAl.mockResolvedValue({ lat: 40.2, lng: 29 })
  yakinMekanlariGetir.mockResolvedValue([])
})

describe('HikayeEkleEkrani', () => {
  it('acilista CEKIM EKRANI: baslik "Anlık ekle", deklansor; gorunurluk (Arkadaslar) ve Paylas YOK', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByText('Anlık ekle')).toBeTruthy()
    expect(screen.getByTestId('hikaye-deklansor')).toBeTruthy()
    // 2026-09-24: cekim ekraninda "Arkadaslar" dugmesi YOK.
    expect(screen.queryByTestId('hikaye-gorunurluk')).toBeNull()
    expect(screen.queryByTestId('hikaye-paylas')).toBeNull()

    await cek()
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: false })
    // Kare AYNI kartta; cekim dugmeleri kalkiyor, gizlilik duruyor.
    expect(screen.getByTestId('hikaye-kart')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-deklansor')).toBeNull()
    expect(screen.queryByTestId('hikaye-flas')).toBeNull()
    expect(screen.queryByTestId('hikaye-kamera-cevir')).toBeNull()
    expect(screen.getByTestId('hikaye-gorunurluk')).toBeTruthy()
  })

  it('SAG USTTE anlik arsivi ikonu arsiv ekranini acar (2026-09-24)', async () => {
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(await screen.findByTestId('anlik-arsivi'))
    expect(mockPush).toHaveBeenCalledWith('/anlik-arsivi')
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

  it('aktif check-in varsa MEKAN Paylas yaninda; Paylas mekanla (yazisiz, ifadesiz) gonderir ve geri doner', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await cek()
    expect(await screen.findByTestId('hikaye-mekan')).toHaveTextContent(/Hozee/)

    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', 'mekan-1', null, [], 'arkadaslar', {})
    )
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  /** KONUM HAPI (kullanicinin referansi 2026-09-24). */
  it('check-in yokken hap "Konum ekle" der; dokununca yakin mekanlar, secilen mekanla paylasilir', async () => {
    yakinMekanlariGetir.mockResolvedValue([{ id: 'm-7', ad: 'Kahve Durağı' }, { id: 'm-8', ad: 'Park' }])
    await render(<HikayeEkleEkrani />)
    await cek()
    expect(screen.getByTestId('hikaye-konum')).toHaveTextContent(/Konum ekle/)
    await fireEvent.press(screen.getByTestId('hikaye-konum'))
    expect(await screen.findByText('Konum seç')).toBeTruthy()
    await menudenSec('hikaye-mekan-m-7')
    await waitFor(() => expect(screen.getByTestId('hikaye-mekan')).toHaveTextContent('Kahve Durağı'))
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', 'm-7', null, [], 'arkadaslar', {})
    )
  })

  it('yakinda mekan yoksa secim penceresi bunu soyler', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-konum'))
    expect(await screen.findByText('Yakınında mekân bulunamadı.')).toBeTruthy()
  })

  it('check-in yoksa mekan satiri cizilmez', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()
    expect(screen.queryByTestId('hikaye-mekan')).toBeNull()
  })

  it('mekan x ile kaldirilinca mekansiz paylasilir', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await cek()
    await fireEvent.press(await screen.findByTestId('hikaye-mekan-kaldir'))
    expect(screen.queryByTestId('hikaye-mekan')).toBeNull()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() =>
      expect(hikayeEkle).toHaveBeenCalledWith('file:///kamera.jpg', '', null, null, [], 'arkadaslar', {})
    )
  })

  it('GORUNURLUK cekimden SONRA secilir (varsayilan Arkadaslar); Herkese secilince oyle paylasilir', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()
    expect(screen.getByText('Arkadaşlar')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-gorunurluk'))
    await menudenSec('hikaye-gorunurluk-herkese')
    expect(screen.getByText('Herkese')).toBeTruthy()
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
    ;(hikayeEkle as jest.Mock).mockRejectedValue(new Error('Aynı anda en fazla 10 anlığın olabilir.'))
    await render(<HikayeEkleEkrani />)
    await cek()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    expect(await screen.findByTestId('hikaye-hata')).toHaveTextContent('Aynı anda en fazla 10 anlığın olabilir.')
    expect(mockBack).not.toHaveBeenCalled()
  })

  /** Kullanicinin karari (2026-09-24): ifadeyi IZLEYEN atar. */
  it('paylasan YAZI, IFADE ya da ETIKET ekleyemez: hicbir arac cizilmez', async () => {
    await render(<HikayeEkleEkrani />)
    await cek()
    for (const id of ['hikaye-araclar', 'hikaye-arac-not', 'hikaye-arac-ifade', 'hikaye-arac-arkadas', 'hikaye-ifadeler']) {
      expect(screen.queryByTestId(id)).toBeNull()
    }
    expect(screen.queryByTestId('hikaye-oge-ifade')).toBeNull()
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
    kameraMock.kameraIzinDurumu.mockResolvedValue('verildi')
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

  /**
   * GRI KART SESSIZ KALMAZ (kullanicinin bildirimi 2026-09-24: "karenin
   * icinde kamera gorunecek" - kart gri kaliyordu, sebebi okunmuyordu).
   */
  it('modul yoksa kart "son surum gerekiyor" der', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByText(/Canlı kamera için uygulamanın son sürümü gerekiyor/)).toBeTruthy()
    expect(screen.queryByTestId('hikaye-kamera-izin')).toBeNull()
  })

  it('izin reddedilmis ama sorulabilirse "İzin ver" yeniden sorar; verilince canli onizleme acilir', async () => {
    kameraMock.kameraGorunumu.mockReturnValue((props: Record<string, unknown>) => <View testID={props.testID as string} />)
    kameraMock.kameraIzinDurumu.mockResolvedValueOnce('sorulabilir').mockResolvedValueOnce('verildi')
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByText('Kamera izni kapalı.')).toBeTruthy()
    await fireEvent.press(screen.getByText('İzin ver'))
    expect(await screen.findByTestId('hikaye-kamera-onizleme')).toBeTruthy()
    expect(kameraMock.kameraIzinDurumu).toHaveBeenLastCalledWith(true)
  })

  it('kalici redde dugme "Ayarları aç" olur ve sistem ayarlarini acar', async () => {
    const { Linking } = jest.requireActual('react-native')
    const ac = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined)
    kameraMock.kameraIzinDurumu.mockResolvedValue('ayarlardan')
    await render(<HikayeEkleEkrani />)
    await fireEvent.press(await screen.findByText('Ayarları aç'))
    expect(ac).toHaveBeenCalled()
    ac.mockRestore()
  })
})
