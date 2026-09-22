import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import HikayeIzleEkrani from '../../../src/app/hikaye/izle'
import {
  hikayeAkisiniGetir,
  hikayeGoruntulendi,
  hikayeGoruntuleyenleriGetir,
  hikayeSil,
  hikayeyeYanitVer,
  type HikayeGrubu,
} from '../../../lib/hikaye'

jest.mock('../../../lib/hikaye', () => ({
  ...jest.requireActual('../../../lib/hikaye'),
  hikayeAkisiniGetir: jest.fn(),
  hikayeGoruntulendi: jest.fn(),
  hikayeGoruntuleyenleriGetir: jest.fn(),
  hikayeSil: jest.fn(),
  hikayeyeYanitVer: jest.fn(),
}))

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockPush = jest.fn()
let mockParams: { kullanici?: string } = { kullanici: 'ayse' }
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: mockPush, canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (effect: () => void | (() => void)) => {
    require('react').useEffect(effect, [effect])
  },
}))

/**
 * HIKAYE IZLEYICI (2026-09-22): dokunusla ileri/geri, kisi bitince sonraki
 * kisi, son kisi bitince kapanir; goruntuleme kaydi; sahibine gorenler +
 * sil; baskasina yanit + sikayet; dikey surukleme kapatir.
 */

function hikaye(id: string, kullaniciId: string, ek: Partial<HikayeGrubu['hikayeler'][number]> = {}) {
  return {
    id,
    kullaniciId,
    fotograf: `${kullaniciId}/${id}.jpg`,
    fotografUrl: `https://imzali/${id}.jpg`,
    yazi: null,
    mekanId: null,
    mekanAdi: null,
    olusturuldu: '2026-09-22T10:00:00Z',
    bitis: '2026-09-23T10:00:00Z',
    gordum: false,
    goruntulenmeSayisi: 0,
    ...ek,
  }
}

function gruplar(): HikayeGrubu[] {
  return [
    {
      kullaniciId: 'ben',
      ad: 'Orçun',
      kullaniciAdi: 'byorcun',
      avatarUrl: null,
      benimMi: true,
      gorulmemisVar: false,
      hikayeler: [hikaye('b1', 'ben', { gordum: true, goruntulenmeSayisi: 3, yazi: 'benim yazim' })],
    },
    {
      kullaniciId: 'ayse',
      ad: 'Ayşe',
      kullaniciAdi: 'ayse_k',
      avatarUrl: null,
      benimMi: false,
      gorulmemisVar: true,
      hikayeler: [hikaye('a1', 'ayse', { gordum: true }), hikaye('a2', 'ayse', { mekanId: 'mekan-1', mekanAdi: 'Hozee', yazi: 'selam' })],
    },
    {
      kullaniciId: 'burak',
      ad: 'Burak',
      kullaniciAdi: 'burak_k',
      avatarUrl: null,
      benimMi: false,
      gorulmemisVar: true,
      hikayeler: [hikaye('c1', 'burak')],
    },
  ]
}

async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockParams = { kullanici: 'ayse' }
  ;(hikayeAkisiniGetir as jest.Mock).mockResolvedValue(gruplar())
  ;(hikayeGoruntulendi as jest.Mock).mockResolvedValue(undefined)
  ;(hikayeGoruntuleyenleriGetir as jest.Mock).mockResolvedValue([])
  ;(hikayeSil as jest.Mock).mockResolvedValue(undefined)
  ;(hikayeyeYanitVer as jest.Mock).mockResolvedValue('konusma-1')
})

describe('HikayeIzleEkrani', () => {
  it('parametredeki kisiden, ilk GORULMEMIS hikayesinden baslar; kimlik, mekan ve yazi gorunur; goruntuleme kaydedilir', async () => {
    await render(<HikayeIzleEkrani />)
    expect(await screen.findByTestId('hikaye-fotograf-a2')).toBeTruthy()
    expect(screen.getByText('ayse_k')).toBeTruthy()
    expect(screen.getByText('Hozee')).toBeTruthy()
    expect(screen.getByTestId('hikaye-yazi-metni')).toHaveTextContent('selam')
    await waitFor(() => expect(hikayeGoruntulendi).toHaveBeenCalledWith('a2'))
    // Baskasinin hikayesi: yanit kutusu var, gorenler yok.
    expect(screen.getByTestId('hikaye-yanit')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-gorenler')).toBeNull()
  })

  it('sag dokunus ileri (kisi bitince SONRAKI kisi), sol dokunus geri; son kisinin sonunda KAPANIR', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.press(screen.getByTestId('hikaye-geri'))
    expect(screen.getByTestId('hikaye-fotograf-a1')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-ileri'))
    expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-ileri'))
    // Ayse bitti -> Burak.
    expect(screen.getByTestId('hikaye-fotograf-c1')).toBeTruthy()
    expect(screen.getByText('burak_k')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-ileri'))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('kendi hikayemde "N kisi gordu" ve Sil (onayli); goruntuleme kaydi YOK', async () => {
    mockParams = { kullanici: 'ben' }
    await render(<HikayeIzleEkrani />)
    expect(await screen.findByTestId('hikaye-fotograf-b1')).toBeTruthy()
    expect(hikayeGoruntulendi).not.toHaveBeenCalled()
    expect(screen.getByText('3 kişi gördü')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-yanit')).toBeNull()

    await fireEvent.press(screen.getByTestId('hikaye-gorenler'))
    expect(await screen.findByTestId('gorenler-sayfasi')).toBeTruthy()
    expect(hikayeGoruntuleyenleriGetir).toHaveBeenCalledWith('b1')
    await fireEvent.press(screen.getByTestId('gorenler-zemini'))

    await fireEvent.press(screen.getByTestId('hikaye-menu'))
    await menudenSec('hikaye-menu-sil')
    expect(await screen.findByText('Hikâye silinsin mi?')).toBeTruthy()
    await fireEvent.press(screen.getByText('Sil'))
    await waitFor(() => expect(hikayeSil).toHaveBeenCalledWith('b1'))
    // Tek hikayem silindi: grubum dustu, sonraki gruba (Ayse) gecildi.
    expect(await screen.findByTestId('hikaye-fotograf-a1')).toBeTruthy()
  })

  it('baskasinin hikayesinde menu Sikayet et: sikayet ekranina hedef=hikaye ile gider', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.press(screen.getByTestId('hikaye-menu'))
    expect(screen.queryByTestId('hikaye-menu-sil')).toBeNull()
    await menudenSec('hikaye-menu-sikayet')
    expect(mockPush).toHaveBeenCalledWith('/sikayet?hedefTur=hikaye&hedefId=a2&kullaniciId=ayse')
  })

  it('yanit: on ekli sohbet mesaji gider, "Yanit gonderildi" gorunur, kutu bosalir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.changeText(screen.getByTestId('hikaye-yanit'), 'çok güzel')
    await fireEvent.press(screen.getByTestId('hikaye-yanit-gonder'))
    await waitFor(() => expect(hikayeyeYanitVer).toHaveBeenCalledWith('ayse', 'Hikâyene yanıt:', 'çok güzel'))
    expect(await screen.findByText('Yanıt gönderildi')).toBeTruthy()
    expect(screen.getByTestId('hikaye-yanit').props.value).toBe('')
  })

  it('dikey surukleme kapatir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    fireGestureHandler(getByGestureTestId('hikaye-surukleme'), [
      { state: State.BEGAN, translationY: 0 },
      { state: State.ACTIVE, translationY: 90 },
      { state: State.ACTIVE, translationY: 180 },
      { state: State.END, translationY: 180, velocityY: 0 },
    ])
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })

  it('kisi bulunamazsa / liste bosken "artik gorunmuyor" ve kapat', async () => {
    ;(hikayeAkisiniGetir as jest.Mock).mockResolvedValue([])
    await render(<HikayeIzleEkrani />)
    expect(await screen.findByTestId('hikaye-yok')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('ilerleme cubugu hikaye sayisi kadar; × kapatir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    expect(screen.getByTestId('hikaye-ilerleme').props.children).toHaveLength(2)
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('5 saniye dolunca kendiliginden ilerler; basili tutunca durur', async () => {
    jest.useFakeTimers()
    try {
      await render(<HikayeIzleEkrani />)
      expect(await screen.findByTestId('hikaye-fotograf-a2')).toBeTruthy()
      // Basili: zaman gecse de ilerlemez.
      await fireEvent(screen.getByTestId('hikaye-ileri'), 'pressIn')
      await act(() => {
        jest.advanceTimersByTime(6000)
      })
      expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
      // Birakinca kaldigi yerden: 6 sn sonra sonraki kisidedir.
      await fireEvent(screen.getByTestId('hikaye-ileri'), 'pressOut')
      await act(() => {
        jest.advanceTimersByTime(6000)
      })
      expect(screen.getByTestId('hikaye-fotograf-c1')).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })
})
