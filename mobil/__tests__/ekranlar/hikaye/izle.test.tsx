import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import HikayeIzleEkrani from '../../../src/app/hikaye/izle'
import { ANAHTAR, onbellekYaz } from '../../../lib/onbellek'
import {
  hikayeAkisiniGetir,
  hikayeGoruntulendi,
  hikayeGoruntuleyenleriGetir,
  hikayeSil,
  hikayeyeYanitVer,
  anlikArsiviniGetir,
  ANI_KART_ORANI,
  SERIT_ONBELLEK_OMRU_MS,
  type HikayeGrubu,
} from '../../../lib/hikaye'

jest.mock('expo-image', () => {
  const React = require('react')
  const { Image: RNImage } = require('react-native')
  const Image = (props: Record<string, unknown>) => React.createElement(RNImage, props)
  Image.prefetch = jest.fn()
  return { Image }
})
jest.mock('../../../lib/hikaye', () => ({
  ...jest.requireActual('../../../lib/hikaye'),
  hikayeAkisiniGetir: jest.fn(),
  hikayeGoruntulendi: jest.fn(),
  hikayeGoruntuleyenleriGetir: jest.fn(),
  hikayeSil: jest.fn(),
  hikayeyeYanitVer: jest.fn(),
  anlikArsiviniGetir: jest.fn(),
}))

const mockBack = jest.fn()
const mockReplace = jest.fn()
const mockPush = jest.fn()
let mockParams: { kullanici?: string; arsiv?: string } = { kullanici: 'ayse' }
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
 * sil; baskasina IFADE SERIDI + sikayet; dikey surukleme kapatir.
 */

function hikaye(id: string, kullaniciId: string, ek: Partial<HikayeGrubu['hikayeler'][number]> = {}) {
  return {
    id,
    kullaniciId,
    fotograf: `${kullaniciId}/${id}.jpg`,
    fotografUrl: `https://imzali/${id}.jpg`,
    yazi: null,
    ifade: null,
    etiketler: [],
    mekanId: null,
    mekanAdi: null,
    olusturuldu: '2026-09-22T10:00:00Z',
    // Hep AKTIF (arsivde degil): sabit gecmis tarih testleri arsiv moduna dusurur.
    bitis: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    gordum: false,
    goruntulenmeSayisi: 0,
    gorunurluk: 'arkadaslar' as const,
    yerlesim: null,
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

/** Tek parmakla surukleme: yatay (x) ya da dikey (y) baskin. */
function surukle({ x = 0, y = 0 }: { x?: number; y?: number }) {
  fireGestureHandler(getByGestureTestId('hikaye-surukleme'), [
    { state: State.BEGAN, translationX: 0, translationY: 0 },
    { state: State.ACTIVE, translationX: x / 2, translationY: y / 2 },
    { state: State.ACTIVE, translationX: x, translationY: y },
    { state: State.END, translationX: x, translationY: y, velocityX: 0, velocityY: 0 },
  ])
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
  ;(hikayeGoruntulendi as jest.Mock).mockResolvedValue(null)
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
    // Mekan kartin ALTINDA (2026-09-24), fotografin uzerinde degil.
    expect(screen.getByTestId('hikaye-mekan')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-oge-mekan')).toBeNull()
    // Baskasinin anligi: emojiler ve yanit kutusu var, gorenler yok.
    expect(screen.getByTestId('hikaye-emojiler')).toBeTruthy()
    expect(screen.getByTestId('hikaye-mesaj')).toBeTruthy()
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
    expect(await screen.findByText('Anlık silinsin mi?')).toBeTruthy()
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

  /**
   * Baskasinin hikayesinde altta MESAJ KUTUSU + KALP (2026-09-22
   * referansi). Kendi hikayemde bu satirin yerinde GORENLER ve SIL var -
   * ayri testte.
   */
  it('baskasinin anliginda STANDART EMOJILER ve YANIT VER var; 108lik ifade seridi YOK', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    expect(screen.getByTestId('hikaye-emojiler')).toBeTruthy()
    expect(screen.getByTestId('hikaye-mesaj').props.placeholder).toBe('Yanıt ver…')
    expect(screen.queryByTestId('hikaye-ifade-seridi')).toBeNull()
    expect(screen.queryByTestId('hikaye-sahip-eylemleri')).toBeNull()
  })

  it('ASAGI surukleme kapatir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    surukle({ y: 180 })
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })

  /**
   * INSTAGRAM ISLEYISI (kullanicinin istegi 2026-09-22: "Instagram'in
   * hikaye isleyisini tam ogren ve aynisini yap"). Dokunus AYNI kisinin
   * hikayeleri arasinda gezer; KAYDIRMA kisiyi atlar.
   */
  it('SOLA kaydirma SONRAKI KISIYE gecer (dokunus gibi tek hikaye ilerletmez)', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    surukle({ x: -140 })

    // Ayse'nin ikinci hikayesindeydik; kaydirma Burak'a atladi.
    expect(await screen.findByTestId('hikaye-fotograf-c1')).toBeTruthy()
    expect(screen.getByText('burak_k')).toBeTruthy()
  })

  it('SAGA kaydirma ONCEKI KISIYE doner', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    surukle({ x: 140 })

    expect(await screen.findByTestId('hikaye-fotograf-b1')).toBeTruthy()
    expect(screen.getByText('byorcun')).toBeTruthy()
  })

  it('SON kisiden sola kaydirmak izleyiciyi KAPATIR', async () => {
    mockParams = { kullanici: 'burak' }
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-c1')

    surukle({ x: -140 })

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1))
  })

  it('kisa yatay kaydirma kisiyi DEGISTIRMEZ', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    surukle({ x: -30 })

    expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('YUKARI kaydirma KAPATMAZ (baskasinin hikayesinde bir sey acmaz)', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    surukle({ y: -180 })

    expect(mockBack).not.toHaveBeenCalled()
    expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
  })

  it('YUKARI kaydirma KENDI hikayemde GORENLER listesini acar', async () => {
    mockParams = { kullanici: 'ben' }
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-b1')

    surukle({ y: -180 })

    expect(await screen.findByTestId('gorenler-sayfasi')).toBeTruthy()
  })

  /** Kullanicinin karari (2026-09-24): standart emoji -> sohbette yanit. */
  it('EMOJI: dokunmak emojiyi sahibine yanit olarak gonderir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.press(screen.getByTestId('hikaye-tepki-0'))
    await waitFor(() => expect(hikayeyeYanitVer).toHaveBeenCalledWith('ayse', 'Anlığına yanıt:', '❤️'))
    expect(await screen.findByTestId('hikaye-yanit-durumu')).toHaveTextContent('❤️ gönderildi')
  })

  it('YANIT VER: yazilan metin sohbete gider, kutu temizlenir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.changeText(screen.getByTestId('hikaye-mesaj'), 'çok güzel')
    await fireEvent.press(screen.getByTestId('hikaye-mesaj-gonder'))
    await waitFor(() => expect(hikayeyeYanitVer).toHaveBeenCalledWith('ayse', 'Anlığına yanıt:', 'çok güzel'))
    expect(screen.getByTestId('hikaye-mesaj').props.value).toBe('')
  })

  it('yanit gonderilemezse sebep yazilir', async () => {
    ;(hikayeyeYanitVer as jest.Mock).mockRejectedValue(new Error('Bu kullanıcı bulunamadı.'))
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    await fireEvent.press(screen.getByTestId('hikaye-tepki-1'))
    expect(await screen.findByTestId('hikaye-yanit-durumu')).toHaveTextContent('Bu kullanıcı bulunamadı.')
  })

  it('ANI KARTI: fotograf paylasandaki ORANDA ve cover ile cizilir (izleyen ayni kareyi gorur)', async () => {
    await render(<HikayeIzleEkrani />)
    const foto = await screen.findByTestId('hikaye-fotograf-a2')
    expect(foto.props.contentFit).toBe('cover')
    const kart = StyleSheet.flatten(screen.getByTestId('hikaye-kart').props.style)
    expect(kart.aspectRatio).toBe(ANI_KART_ORANI)
  })

  it('KENDI animda ifade seridi YOK; yerinde gorenler ve sil var', async () => {
    mockParams = { kullanici: 'ben' }
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-b1')

    expect(screen.queryByTestId('hikaye-emojiler')).toBeNull()
    expect(screen.queryByTestId('hikaye-mesaj')).toBeNull()
    expect(screen.getByTestId('hikaye-sahip-eylemleri')).toBeTruthy()
    expect(screen.getByTestId('hikaye-gorenler')).toBeTruthy()
    expect(screen.getByTestId('hikaye-sil')).toBeTruthy()
  })

  it('BASILI TUTARKEN arayuz gizlenir, birakinca geri gelir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    const gorunur = () => {
      const d = screen.getByTestId('hikaye-ust')
      const stil = StyleSheet.flatten(d?.props.style)
      return stil?.opacity !== 0
    }
    expect(gorunur()).toBe(true)

    await fireEvent(screen.getByTestId('hikaye-ileri'), 'pressIn')
    expect(gorunur()).toBe(false)

    await fireEvent(screen.getByTestId('hikaye-ileri'), 'pressOut')
    expect(gorunur()).toBe(true)
  })

  it('kisi bulunamazsa / liste bosken "artik gorunmuyor" ve kapat', async () => {
    ;(hikayeAkisiniGetir as jest.Mock).mockResolvedValue([])
    await render(<HikayeIzleEkrani />)
    expect(await screen.findByTestId('hikaye-yok')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('ILERLEME CUBUGU YOK (2026-09-24); × kapatir', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')
    expect(screen.queryByTestId('hikaye-ilerleme')).toBeNull()
    await fireEvent.press(screen.getByTestId('hikaye-kapat'))
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  /** Kullanicinin karari (2026-09-24): "sureli olmayacaklar; basilirsa
   *  ya da kaydirilirsa gecilecek". */
  it('SURE YOK: zaman gecse de kendiliginden ilerlemez; dokunus ilerletir', async () => {
    jest.useFakeTimers()
    try {
      await render(<HikayeIzleEkrani />)
      expect(await screen.findByTestId('hikaye-fotograf-a2')).toBeTruthy()
      await act(() => {
        jest.advanceTimersByTime(20000)
      })
      expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
      await fireEvent.press(screen.getByTestId('hikaye-ileri'))
      expect(screen.getByTestId('hikaye-fotograf-c1')).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })

  /**
   * ANLIK ARSIVI (2026-09-24): `?arsiv=<id>` kisinin kendi butun
   * anliklarini tek grup acar; suresi dolmus anlikta Gorenler YOK (24
   * saatte silinir), Sil var.
   */
  it('ARSIV: kendi anliklari, verilen anliktan acilir; dokunusla gezilir; eski anlikta Gorenler yok', async () => {
    const eski = new Date(Date.now() - 5 * 86400000).toISOString()
    ;(anlikArsiviniGetir as jest.Mock).mockResolvedValue({
      kullaniciId: 'ben', ad: 'Ben', kullaniciAdi: 'ben', avatarUrl: null, benimMi: true, gorulmemisVar: false,
      hikayeler: [
        hikaye('x1', 'ben', { olusturuldu: eski, bitis: eski }),
        hikaye('x2', 'ben', { olusturuldu: eski, bitis: eski }),
      ],
    })
    mockParams = { arsiv: 'x2' }
    await render(<HikayeIzleEkrani />)
    expect(await screen.findByTestId('hikaye-fotograf-x2')).toBeTruthy()
    expect(hikayeAkisiniGetir).not.toHaveBeenCalled()
    expect(screen.queryByTestId('hikaye-gorenler')).toBeNull()
    expect(screen.getByTestId('hikaye-sil')).toBeTruthy()
    expect(screen.queryByTestId('hikaye-emojiler')).toBeNull()
    expect(hikayeGoruntulendi).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByTestId('hikaye-geri'))
    expect(screen.getByTestId('hikaye-fotograf-x1')).toBeTruthy()
  })

  /**
   * ON YUKLEME (kullanicinin bildirimi 2026-09-22: "hikayeler arasi
   * gecis cok kotu surekli yeniden yukleniyor gecikmeli geliyor").
   * Olculdu: her ileri gecisinde yeni medya istegi + ~390 ms bekleme.
   */
  it('KOMSU KARELER onceden indiriliyor (sonraki iki, onceki bir, sonraki KISININ ilki)', async () => {
    await render(<HikayeIzleEkrani />)
    await screen.findByTestId('hikaye-fotograf-a2')

    // On yukleme gorunen kare INDIKTEN sonra basliyor (`onLoadEnd`),
    // jest'te o olay gelmedigi icin yedek zamanlayici devreye giriyor.
    await waitFor(() => expect(Image.prefetch).toHaveBeenCalled(), { timeout: 2000 })
    const istenen = (Image.prefetch as jest.Mock).mock.calls.flatMap((c) => c[0] as string[])
    // Ayse'nin 2. hikayesindeyiz: onceki (a1) ve SONRAKI KISININ ilki (c1).
    expect(istenen).toContain('https://imzali/a1.jpg')
    expect(istenen).toContain('https://imzali/c1.jpg')
    // Gorunen karenin kendisi on yukleme listesinde DEGIL - zaten cizili.
    expect(istenen).not.toContain('https://imzali/a2.jpg')
  })

  it('ONBELLEKTEN ACILIS: serit verisi eldeyse ag beklenmeden kare cizilir', async () => {
    // Onbellek YAS damgasiyla yaziliyor (2026-09-22): bayat veriyle
    // acilip cubuk sayisinin sonradan degismesi boyle onleniyor.
    onbellekYaz(ANAHTAR.hikayeSeridi, { veri: { gruplar: gruplar(), ben: null }, zaman: Date.now() })
    // Ag CEVAP VERMIYOR.
    ;(hikayeAkisiniGetir as jest.Mock).mockReturnValue(new Promise(() => {}))

    await render(<HikayeIzleEkrani />)

    expect(screen.getByTestId('hikaye-fotograf-a2')).toBeTruthy()
  })

  it('YASLI onbellek KULLANILMIYOR: bayat veriyle acilip cubuk sayisi degismesin', async () => {
    // Kullanicinin bildirimi: "iki hikaye var bir tane varmis gibi cubuk
    // ilerliyor, ustte ikinci sonradan beliriyor."
    onbellekYaz(ANAHTAR.hikayeSeridi, {
      veri: { gruplar: gruplar(), ben: null },
      zaman: Date.now() - (SERIT_ONBELLEK_OMRU_MS + 1000),
    })
    ;(hikayeAkisiniGetir as jest.Mock).mockReturnValue(new Promise(() => {}))

    await render(<HikayeIzleEkrani />)

    // Bayat veri cizilmedi; ekran sunucuyu bekliyor.
    expect(screen.queryByTestId('hikaye-fotograf-a2')).toBeNull()
  })
})
