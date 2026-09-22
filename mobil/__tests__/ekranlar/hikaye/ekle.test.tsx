import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import HikayeEkleEkrani from '../../../src/app/hikaye/ekle'
import { hikayeEkle } from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock('../../../lib/hikaye', () => ({ ...jest.requireActual('../../../lib/hikaye'), hikayeEkle: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ aktifCheckInimiGetir: jest.fn() }))

const mockBack = jest.fn()
const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn(), canGoBack: () => true }),
}))

/**
 * HIKAYE EKLE (2026-09-22): kaynak secimi -> onizleme -> yazi/mekan -> Paylas.
 */

async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///galeri.jpg' }] })
  ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true })
  ;(ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///kamera.jpg' }] })
  ;(hikayeEkle as jest.Mock).mockResolvedValue('h-yeni')
})

describe('HikayeEkleEkrani', () => {
  it('acilista kaynak secimi; galeriden secince onizleme gelir, Paylas etkinlesir', async () => {
    await render(<HikayeEkleEkrani />)
    expect(await screen.findByTestId('secim-penceresi')).toBeTruthy()
    // Fotograf yokken Paylas pasif.
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: true })
    await menudenSec('hikaye-galeri')
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    expect(screen.getByTestId('hikaye-paylas').props.accessibilityState).toEqual({ disabled: false })
  })

  it('kamera izni reddedilirse hata gosterir ve secim yeniden acilir', async () => {
    ;(ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false })
    await render(<HikayeEkleEkrani />)
    await menudenSec('hikaye-kamera')
    expect(await screen.findByText('Fotoğraf çekmek için kamera izni gerekiyor.')).toBeTruthy()
    expect(await screen.findByTestId('secim-penceresi')).toBeTruthy()
    // Kapatma zamanlayicisi (400 ms) menu yeniden acikken geri GONDERMEZ.
    await act(() => new Promise<void>((r) => setTimeout(r, 500)))
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('yazi 200 ile sinirli; aktif check-in varsa mekan cipi gelir ve kaldirilabilir; Paylas hikayeEkle cagirir ve geri doner', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await menudenSec('hikaye-galeri')
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    expect(await screen.findByTestId('hikaye-mekan-cipi')).toBeTruthy()
    expect(screen.getByText('Hozee')).toBeTruthy()

    await fireEvent.changeText(screen.getByTestId('hikaye-yazi'), 'a'.repeat(260))
    expect(screen.getByText('200/200')).toBeTruthy()
    await fireEvent.changeText(screen.getByTestId('hikaye-yazi'), 'selam')

    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() => expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', 'selam', 'mekan-1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  it('mekan cipi kaldirilinca mekansiz paylasilir', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({ mekanId: 'mekan-1', mekanAdi: 'Hozee' })
    await render(<HikayeEkleEkrani />)
    await menudenSec('hikaye-galeri')
    await fireEvent.press(await screen.findByTestId('hikaye-mekan-kaldir'))
    expect(screen.queryByTestId('hikaye-mekan-cipi')).toBeNull()
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    await waitFor(() => expect(hikayeEkle).toHaveBeenCalledWith('file:///galeri.jpg', '', null))
  })

  it('sunucu reddederse hata metni ekranda, geri donmez', async () => {
    ;(hikayeEkle as jest.Mock).mockRejectedValue(new Error('Aynı anda en fazla 10 hikâyen olabilir.'))
    await render(<HikayeEkleEkrani />)
    await menudenSec('hikaye-galeri')
    await waitFor(() => expect(screen.getByTestId('hikaye-onizleme')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('hikaye-paylas'))
    expect(await screen.findByTestId('hikaye-hata')).toHaveTextContent('Aynı anda en fazla 10 hikâyen olabilir.')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('galeri secimi iptal edilirse ve fotograf yoksa ekran geri doner', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: [] })
    await render(<HikayeEkleEkrani />)
    await menudenSec('hikaye-galeri')
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})
