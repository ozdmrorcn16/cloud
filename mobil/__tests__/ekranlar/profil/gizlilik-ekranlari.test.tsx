import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import GizlilikAyarlariEkrani from '../../../src/app/profil/gizlilik-ayarlari'
import ProfilGorunurluguEkrani from '../../../src/app/profil/profil-gorunurlugu'
import AramaGorunurluguEkrani from '../../../src/app/profil/arama-gorunurlugu'
import EtiketlerEkrani from '../../../src/app/profil/etiketler'
import BekleyenEtiketlerEkrani from '../../../src/app/profil/bekleyen-etiketler'
import MesajIzinleriEkrani from '../../../src/app/profil/mesaj-izinleri'
import KonumCheckinEkrani from '../../../src/app/profil/konum-checkin'
import {
  profilGizliGetir,
  profilGizliAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  etiketOnayiGerekliGetir,
  etiketOnayiGerekliAyarla,
  mesajIzniGetir,
  mesajIzniAyarla,
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
} from '../../../lib/ayarlar'
import { engellediklerimiGetir } from '../../../lib/engelleme'
import { bekleyenEtiketleriGetir, etiketiYanitla } from '../../../lib/etiket'

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), back: jest.fn() },
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    require('react').useEffect(effect, [])
  },
}))
jest.mock('../../../lib/ayarlar', () => ({
  profilGizliGetir: jest.fn(),
  profilGizliAyarla: jest.fn(),
  aramadaGorunsunGetir: jest.fn(),
  aramadaGorunsunAyarla: jest.fn(),
  etiketOnayiGerekliGetir: jest.fn(),
  etiketOnayiGerekliAyarla: jest.fn(),
  mesajIzniGetir: jest.fn(),
  mesajIzniAyarla: jest.fn(),
  varsayilanBulunurluguGetir: jest.fn(),
  varsayilanBulunurluguAyarla: jest.fn(),
}))
jest.mock('../../../lib/engelleme', () => ({ engellediklerimiGetir: jest.fn() }))
jest.mock('../../../lib/etiket', () => ({ bekleyenEtiketleriGetir: jest.fn(), etiketiYanitla: jest.fn() }))
jest.mock('../../../lib/akis', () => ({ avatarlariGetir: jest.fn().mockResolvedValue({}) }))
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: false }),
  requestForegroundPermissionsAsync: jest.fn(),
}))

const BEKLEYEN = [
  {
    checkInId: 'c1',
    mekanAdi: 'Hozee',
    etiketleyenId: 'u1',
    etiketleyenAd: 'Deniz',
    etiketleyenKullaniciAdi: 'deniz',
    olusturuldu: new Date().toISOString(),
  },
  {
    checkInId: 'c2',
    mekanAdi: 'Kafe',
    etiketleyenId: 'u2',
    etiketleyenAd: 'Ece',
    etiketleyenKullaniciAdi: 'ece',
    olusturuldu: new Date().toISOString(),
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(profilGizliGetir as jest.Mock).mockResolvedValue(false)
  ;(profilGizliAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aramadaGorunsunGetir as jest.Mock).mockResolvedValue(true)
  ;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(etiketOnayiGerekliGetir as jest.Mock).mockResolvedValue(true)
  ;(etiketOnayiGerekliAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(mesajIzniGetir as jest.Mock).mockResolvedValue('arkadaslar')
  ;(mesajIzniAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
  ;(varsayilanBulunurluguAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(engellediklerimiGetir as jest.Mock).mockResolvedValue([{ id: 'x' }, { id: 'y' }])
  ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue(BEKLEYEN)
  ;(etiketiYanitla as jest.Mock).mockResolvedValue(undefined)
})

/**
 * GIZLILIK HUB (referans 2026-09-18): "Gorunurlugun" ve "Sosyal
 * izinlerin"; her satir mevcut degeri gosterir ve kendi ekranina gider.
 */
describe('GizlilikAyarlariEkrani', () => {
  it('bes satir, degerler sunucudan, yonlendirmeler', async () => {
    await render(<GizlilikAyarlariEkrani />)
    expect(await screen.findByText('Herkese açık')).toBeTruthy()
    expect(await screen.findByText('Onaylı')).toBeTruthy()
    expect(await screen.findByText('Arkadaşlar')).toBeTruthy()
    expect(await screen.findByText('2')).toBeTruthy()
    expect(screen.getByText('Paylaşımın sınırlarını sen belirle')).toBeTruthy()
    await fireEvent.press(screen.getByText('Profil görünürlüğü'))
    await fireEvent.press(screen.getByText('Aramada görünürlük'))
    await fireEvent.press(screen.getByText('Etiketler'))
    await fireEvent.press(screen.getByText('Mesaj izinleri'))
    await fireEvent.press(screen.getByText('Engellenen kişiler'))
    expect(mockRouterPush.mock.calls.map((c) => c[0])).toEqual([
      '/profil/profil-gorunurlugu',
      '/profil/arama-gorunurlugu',
      '/profil/etiketler',
      '/profil/mesaj-izinleri',
      '/profil/engellenenler',
    ])
  })

  it('gizli profil ve otomatik etiket degerleri', async () => {
    ;(profilGizliGetir as jest.Mock).mockResolvedValue(true)
    ;(etiketOnayiGerekliGetir as jest.Mock).mockResolvedValue(false)
    await render(<GizlilikAyarlariEkrani />)
    expect(await screen.findByText('Sadece arkadaşlar')).toBeTruthy()
    expect(await screen.findByText('Otomatik')).toBeTruthy()
  })
})

describe('ProfilGorunurluguEkrani', () => {
  it('secim sunucuya yazilir; hata olursa geri alinir', async () => {
    await render(<ProfilGorunurluguEkrani />)
    await waitFor(() =>
      expect(screen.getByTestId('profil-gorunurlugu-acik').props.accessibilityState.selected).toBe(true)
    )
    await fireEvent.press(screen.getByTestId('profil-gorunurlugu-gizli'))
    await waitFor(() => expect(profilGizliAyarla).toHaveBeenCalledWith(true))

    ;(profilGizliAyarla as jest.Mock).mockRejectedValue(new Error('olmadi'))
    await fireEvent.press(screen.getByTestId('profil-gorunurlugu-acik'))
    expect(await screen.findByText('olmadi')).toBeTruthy()
    expect(screen.getByTestId('profil-gorunurlugu-gizli').props.accessibilityState.selected).toBe(true)
  })
})

describe('AramaGorunurluguEkrani', () => {
  it('Kapali secilince aramada gorunmez', async () => {
    await render(<AramaGorunurluguEkrani />)
    await waitFor(() =>
      expect(screen.getByTestId('arama-gorunurlugu-acik').props.accessibilityState.selected).toBe(true)
    )
    await fireEvent.press(screen.getByTestId('arama-gorunurlugu-kapali'))
    await waitFor(() => expect(aramadaGorunsunAyarla).toHaveBeenCalledWith(false))
  })
})

/** ETIKETLER (referans): onay anahtari + bekleyen sayisi ile satir. */
describe('EtiketlerEkrani', () => {
  it('anahtar sunucudan, bekleyen sayisi ve yonlendirme', async () => {
    await render(<EtiketlerEkrani />)
    await waitFor(() => expect(screen.getByTestId('etiket-onayi').props.value).toBe(true))
    expect(await screen.findByText('2')).toBeTruthy()
    await act(async () => {
      fireEvent(screen.getByTestId('etiket-onayi'), 'valueChange', false)
    })
    await waitFor(() => expect(etiketOnayiGerekliAyarla).toHaveBeenCalledWith(false))
    await fireEvent.press(screen.getByText('Bekleyen etiketler'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/bekleyen-etiketler')
  })
})

describe('BekleyenEtiketlerEkrani', () => {
  it('liste, onayla ve reddet satiri dusurur', async () => {
    await render(<BekleyenEtiketlerEkrani />)
    expect(await screen.findByTestId('bekleyen-c1')).toBeTruthy()
    expect(screen.getByText('Deniz')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('onayla-c1'))
    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('c1', true))
    await waitFor(() => expect(screen.queryByTestId('bekleyen-c1')).toBeNull())
    await fireEvent.press(screen.getByTestId('reddet-c2'))
    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('c2', false))
    expect(await screen.findByText('Bekleyen etiket yok.')).toBeTruthy()
  })
})

/** MESAJ IZINLERI (referans): Herkes / Yalnizca arkadaslarim / Hic kimse. */
describe('MesajIzinleriEkrani', () => {
  it('mevcut secim isaretli; secim sunucuya gider', async () => {
    await render(<MesajIzinleriEkrani />)
    await waitFor(() =>
      expect(screen.getByTestId('mesaj-izni-arkadaslar').props.accessibilityState.selected).toBe(true)
    )
    expect(screen.getByText('Yeni mesaj istekleri alma.')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('mesaj-izni-hic_kimse'))
    await waitFor(() => expect(mesajIzniAyarla).toHaveBeenCalledWith('hic_kimse'))
  })
})

/** KONUM VE CHECK-IN (referans): konum erisimi satiri + pencere. */
describe('KonumCheckinEkrani', () => {
  it('konum erisimi satiri pencereyi acar; mekanda gorunurluk secimi yazilir', async () => {
    await render(<KonumCheckinEkrani />)
    await waitFor(() =>
      expect(screen.getByTestId('bulunurluk-herkese_acik').props.accessibilityState.selected).toBe(true)
    )
    expect(screen.queryByTestId('konum-izni-penceresi')).toBeNull()
    await fireEvent.press(screen.getByText('Konum erişimi'))
    expect(screen.getByText('Konum iznini yönet')).toBeTruthy()
    expect(screen.getByText(/Ayarlar → Slooin → Konum/)).toBeTruthy()
    await fireEvent.press(screen.getByText('Vazgeç'))
    await waitFor(() => expect(screen.queryByTestId('konum-izni-penceresi')).toBeNull())

    await fireEvent.press(screen.getByTestId('bulunurluk-takipcilerim'))
    await waitFor(() => expect(varsayilanBulunurluguAyarla).toHaveBeenCalledWith('takipcilerim'))
  })
})
