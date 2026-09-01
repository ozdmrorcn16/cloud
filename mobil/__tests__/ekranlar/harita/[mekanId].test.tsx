import { render, screen, waitFor, fireEvent } from '@testing-library/react-native'
import { ActionSheetIOS, Linking } from 'react-native'
import CheckInHaritasiEkrani from '../../../src/app/harita/[mekanId]'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir } from '../../../lib/mekan'

jest.mock('../../../lib/mekan', () => ({
  mekaniGetir: jest.fn(),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}))

const MEKAN = {
  id: 'mekan-1',
  ad: 'Nilüfer Tüvtürk Araç Muayene İstasyonu',
  tur: 'Araç muayene',
  semt: 'Nilüfer',
  mahalle: null,
  il: 'Bursa',
  adres: null,
  kaynak: 'foursquare',
  konum: { lat: 40.2106, lng: 28.9213 },
}

beforeEach(() => {
  jest.clearAllMocks()
  // Komsu KALABALIK: 2026-09-01'den beri haritada yalnizca kalabalik
  // mekanlarin ignesi ciziliyor, sakinler cizilmiyor. Asagidaki
  // `cevreOturana` beklemesi ikinci ignenin cikmasina dayaniyor.
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-2', ad: 'Komşu', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 3 },
  ])
})

/**
 * Ekran iki bagimsiz async zincir isletiyor; test yalnizca adresi
 * bekliyor, cevre mekanlari ondan sonra oturuyor. Beklenmezse React
 * "act(...) disinda guncelleme" uyarisi basiyor.
 */
const cevreOturana = () =>
  waitFor(() => expect(screen.getAllByTestId('harita-ignesi').length).toBeGreaterThan(1))

describe('CheckInHaritasiEkrani', () => {
  /**
   * Kullanicinin SON karari (2026-08-31): "Mahalle adres bilgisi
   * aktarimini durdur ve sil, sadece konumlarin ilce ve il bilgisini
   * gosterecegiz TAM DOGRULUK ADINA."
   *
   * Adres de mahalle de gosterilmiyor - kayitta dolu olsa bile. Once
   * cihazdan adres cozuluyordu (Apple/Google), o YANLIS mahalle
   * uretiyordu; sonra mekanin kendi adresi kullanildi, o da kaynakta
   * kirliydi ("Bursa Erik mah." gibi alanlari karisik girilmis
   * kayitlar). Ilce ve il ise poligon testiyle atandigi icin kesin.
   */
  it('adres ve mahalle dolu OLSA BILE yalnizca ILCE + IL gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      mahalle: 'Ertuğrul',
      adres: 'Alaaddinbey Mah. 613. Sk No:9',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())
    expect(screen.queryByText('Alaaddinbey Mah. 613. Sk No:9')).toBeNull()
    await cevreOturana()
  })

  it('ilcesi yoksa yalnizca il gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, semt: null })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Bursa')).toBeTruthy())
    await cevreOturana()
  })

  /**
   * Kullanicinin duzeltmesi (2026-09-01): dugme ZATEN yol tarifi
   * aciyordu (Apple'da `daddr`, Google'da `dir/?api=1`) ama metin
   * "Harita uygulamasinda ac" diyordu - ne yaptigini soylemiyordu.
   */
  it('dugme "Yol tarifi al" diyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    expect(await screen.findByText('Yol tarifi al')).toBeTruthy()
    expect(screen.queryByText('Harita uygulamasında aç')).toBeNull()
    await cevreOturana()
  })
})

/**
 * YOL TARIFI SECIMI - PLATFORMA GORE (kullanicinin karari 2026-09-01).
 *
 * iOS'ta sistemin KENDI ActionSheet'i aciliyor: kullanicinin telefonun
 * her yerinde gordugu pencerenin aynisi, yazi tipi ve renkleri sistemden
 * geliyor. Kendi Modal'imiz iOS'a yabanci duruyordu.
 *
 * Android'de Apple Haritalar zaten yok, yani secenek TEK; orada pencere
 * hic acilmiyor, dogrudan Google Haritalar aciliyor (bu davranis
 * onceden de vardi). Web'de kendi Modal'imiz kaliyor.
 *
 * jest-expo iOS ontanimli kosuyor, yani asagidaki testler iOS yolunu
 * olcuyor.
 */
describe('CheckInHaritasiEkrani - yol tarifi secimi (iOS)', () => {
  it('"Yol tarifi al" iOS ActionSheet aciyor, kendi modalimizi DEGIL', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {})

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    expect(sheet).toHaveBeenCalledTimes(1)
    const [ayarlar] = sheet.mock.calls[0]
    expect(ayarlar.options).toEqual(['Apple Haritalar', 'Google Haritalar', 'Vazgeç'])
    expect(ayarlar.cancelButtonIndex).toBe(2)
    // Kendi pencere basligimiz cizilmemeli.
    expect(screen.queryByText('Hangi haritayla açalım?')).toBeNull()
    await cevreOturana()
  })

  it('Apple secilince Apple Haritalar yol tarifi acilir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_ayarlar, geriCagir) => geriCagir(0))

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    expect(ac).toHaveBeenCalledWith(
      expect.stringContaining('maps.apple.com/?daddr=40.2106,28.9213')
    )
    await cevreOturana()
  })

  it('Google secilince Google Haritalar yol tarifi acilir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_ayarlar, geriCagir) => geriCagir(1))

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    expect(ac).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps/dir/?api=1&destination=40.2106,28.9213')
    )
    await cevreOturana()
  })

  it('Vazgec secilince hicbir sey acilmaz', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_ayarlar, geriCagir) => geriCagir(2))

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    expect(ac).not.toHaveBeenCalled()
    await cevreOturana()
  })
})

/**
 * KURULU OLMAYAN HARITA GORUNMEZ (kullanicinin istegi 2026-09-01).
 *
 * `Linking.canOpenURL` ile soruluyor. iOS'ta bu cagrinin calismasi icin
 * sorgulanacak semalarin Info.plist'te BEYAN EDILMESI sart
 * (LSApplicationQueriesSchemes, app.json icinde); beyan yoksa cagri
 * sessizce her zaman false doner ve butun secenekler gizlenirdi.
 *
 * Hicbiri kurulu degilse pencere hic acilmiyor ve yol tarifi TARAYICIDA
 * aciliyor - kullanici yine hedefe ulasiyor, sadece uygulama yerine web.
 */
describe('CheckInHaritasiEkrani - yalnizca kurulu haritalar', () => {
  function kurulu(semalar: string[]) {
    jest
      .spyOn(Linking, 'canOpenURL')
      .mockImplementation((url: string) =>
        Promise.resolve(semalar.some((s) => url.startsWith(s)))
      )
  }

  it('Google Haritalar kurulu DEGILSE listede gorunmez', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    kurulu(['maps://'])
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    // Tek secenek kaldi: pencere hic acilmadan Apple Haritalar aciliyor.
    await waitFor(() =>
      expect(ac).toHaveBeenCalledWith(expect.stringContaining('maps.apple.com'))
    )
    await cevreOturana()
  })

  it('ikisi de kuruluysa ikisi birden listelenir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    kurulu(['maps://', 'comgooglemaps://'])
    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(() => {})

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    await waitFor(() => expect(sheet).toHaveBeenCalledTimes(1))
    expect(sheet.mock.calls[0][0].options).toEqual([
      'Apple Haritalar',
      'Google Haritalar',
      'Vazgeç',
    ])
    await cevreOturana()
  })

  /**
   * HICBIRI cikmazsa suzgec UYGULANMIYOR - hepsi listeleniyor.
   *
   * Sebep: Info.plist beyani NATIVE ve OTA ile gitmiyor. Bu kod beyansiz
   * bir derlemeye inerse canOpenURL her sema icin false doner; suzgeci
   * korumasiz uygulasaydik butun harita secenekleri kaybolur ve calisan
   * bir ozelligi bozmus olurduk. Bu test o korumayi kilitliyor.
   */
  it('hicbiri kurulu GORUNMUYORSA suzgec uygulanmaz, hepsi listelenir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    kurulu([])
    const sheet = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(() => {})

    await render(<CheckInHaritasiEkrani />)
    await fireEvent.press(await screen.findByText('Yol tarifi al'))

    await waitFor(() => expect(sheet).toHaveBeenCalledTimes(1))
    expect(sheet.mock.calls[0][0].options).toEqual([
      'Apple Haritalar',
      'Google Haritalar',
      'Vazgeç',
    ])
    await cevreOturana()
  })
})
