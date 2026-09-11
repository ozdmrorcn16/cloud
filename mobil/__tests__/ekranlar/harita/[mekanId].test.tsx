import { render, screen, waitFor, fireEvent } from '@testing-library/react-native'

import { ActionSheetIOS, Linking } from 'react-native'
import CheckInHaritasiEkrani from '../../../src/app/harita/[mekanId]'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir } from '../../../lib/mekan'
import {
  mekanIstatistikleriniGetir,
  mekanLiderligiGetir,
  mekanSonCheckInleriGetir,
} from '../../../lib/mekan-sayfasi'
import {
  suAnBurdakileriGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
} from '../../../lib/checkin'
import { cihazKonumunuAl } from '../../../lib/konum'
import { mekanFotografiUrl } from '../../../lib/mekan-duzenleme'

// `mekanDurumu` GERCEK kaliyor: harita ignesi onu cagiriyor ve saf bir
// hesap - mock'lamak testin kendi varsayimini dogrulamasina yol acardi.
jest.mock('../../../lib/mekan', () => ({
  ...jest.requireActual('../../../lib/mekan'),
  mekaniGetir: jest.fn(),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))

jest.mock('../../../lib/mekan-sayfasi', () => ({
  mekanIstatistikleriniGetir: jest.fn(),
  mekanLiderligiGetir: jest.fn(),
  mekanSonCheckInleriGetir: jest.fn(),
}))
// Modulun SABITLERI gercek kalsin diye requireActual ile basliyor;
// yalnizca ag cagrisi degistiriliyor (2026-09-02'de ogrenilen tuzak:
// eksik sabit hata vermiyor, sessizce undefined donuyor).
jest.mock('../../../lib/checkin', () => ({
  ...jest.requireActual('../../../lib/checkin'),
  suAnBurdakileriGetir: jest.fn(),
  aktifCheckInimiGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
// `mesafeMetre` GERCEK kaliyor: buton hali bu hesaba dayaniyor ve
// mock'lansaydi test kendi varsayimini dogrulardi.
const mockPush = jest.fn()
jest.mock('../../../lib/mekan-duzenleme', () => ({ mekanFotografiUrl: jest.fn() }))
jest.mock('../../../lib/konum', () => ({
  ...jest.requireActual('../../../lib/konum'),
  cihazKonumunuAl: jest.fn(),
}))
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: mockPush }),
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
  ;(mekanFotografiUrl as jest.Mock).mockResolvedValue(null)
  // Komsu KALABALIK: 2026-09-01'den beri haritada yalnizca kalabalik
  // mekanlarin ignesi ciziliyor, sakinler cizilmiyor. Asagidaki
  // `cevreOturana` beklemesi ikinci ignenin cikmasina dayaniyor.
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-2', ad: 'Komşu', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 3 },
  ])
  // Sayfanin geri kalani varsayilan olarak BOS: her test yalnizca
  // kendi ilgilendigi parcayi doldursun.
  ;(mekanIstatistikleriniGetir as jest.Mock).mockResolvedValue({
    suAnKisi: 0,
    bugunCheckIn: 0,
    toplamCheckIn: 0,
    ilceSirasi: null,
    ilceMekanSayisi: 0,
    ilce: null,
  })
  ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
  ;(mekanLiderligiGetir as jest.Mock).mockResolvedValue([])
  ;(mekanSonCheckInleriGetir as jest.Mock).mockResolvedValue([])
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(checkIndenAyril as jest.Mock).mockResolvedValue(undefined)
  // Varsayilan: konum OKUNAMIYOR. Boylece her test kendi konumunu
  // vermek zorunda kaliyor ve "uzaklik bilinmiyor" hali de varsayilan
  // olarak sinaniyor.
  ;(cihazKonumunuAl as jest.Mock).mockRejectedValue(new Error('izin yok'))
})

/**
 * Harita CEVRE mekanlarini cizmiyor (2026-09-07). Cizilen igneler:
 * mekanin kendisi ve - konum okunabildiyse - kullanicinin konumu.
 * Bekleme ignenin cizilmis olmasina dayaniyor; onsuz React "act(...)
 * disinda guncelleme" uyarisi basiyor.
 */
const cevreOturana = () =>
  waitFor(() =>
    expect(screen.getAllByTestId('harita-ignesi').length).toBeGreaterThanOrEqual(1)
  )

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
  /*
   * SERBEST ADRES HALA GOSTERILMIYOR (2026-08-31 karari): kaynaktaki
   * adres kaydi kirli cikmisti.
   *
   * MAHALLE ISE 2026-09-09'da GERI GELDI - ama yalnizca ONAYLI
   * duzeltmeden geleni. O karar TURETILMIS mahalleye karsiydi; bir
   * insanin beyani ve moderator onayi turetilmis veri degil.
   */
  it('mahalle doluysa ilce ve ille birlikte gosteriliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      mahalle: 'Alaaddinbey',
      adres: 'Alaaddinbey Mah. 613. Sk No:9',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Alaaddinbey, Nilüfer, Bursa')).toBeTruthy())
    /*
     * IDDIA TERSINE CEVRILDI, SILINMEDI (2026-09-10). Eskiden "serbest
     * adres metni HALA gosterilmiyor" diyordu; kullanicinin karariyla
     * KAYITLI ADRES artik gosteriliyor. Alan turetilmis degil - dort
     * ayri olcumle dogrulandi (kaynak zinciri, %35,6 doluluk, ayni
     * koordinatta farkli adresler, insan yazim izleri).
     */
    expect(screen.getByText('Alaaddinbey Mah. 613. Sk No:9')).toBeTruthy()
    await cevreOturana()
  })

  /*
   * KAYITLI ADRES VE IDARI SATIR IKI FARKLI SEY SOYLUYOR:
   * adres bir BEYAN (serbest metin), ilce/il ise koordinatin hangi
   * resmi sinir poligonuna duestuegue - kesin hesap.
   */
  it('kayitli adres varsa ILCE + IL ile BIRLIKTE gosteriliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      mahalle: null,
      adres: 'Ada Sk. No:1',
    })

    await render(<CheckInHaritasiEkrani />)

    // Kisa bir adres tek basina birakilsaydi kullanici hangi sehirde
    // oldugunu bilemezdi.
    expect(await screen.findByTestId('mekan-adresi')).toHaveTextContent('Ada Sk. No:1')
    expect(screen.getByTestId('mekan-idari')).toHaveTextContent('Nilüfer, Bursa')
    await cevreOturana()
  })

  /*
   * TEKRAR ONLENIYOR: bazi kayitli adresler ilceyi zaten iceriyor
   * ("... Merkez Osmangazi -Bursa/Türkiye"). O durumda ikinci satir
   * ayni bilgiyi ikinci kez yazardi.
   */
  it('adres ILCEYI zaten iceriyorsa idari satir TEKRAR EDILMIYOR', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({
      ...MEKAN,
      mahalle: null,
      adres: 'Dr.Sadık Ahmet Cad. No:412/B Nilüfer Bursa',
    })

    await render(<CheckInHaritasiEkrani />)

    await screen.findByTestId('mekan-adresi')
    expect(screen.queryByTestId('mekan-idari')).toBeNull()
    await cevreOturana()
  })

  it('adres YOKSA yalnizca ILCE + IL kaliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, mahalle: null, adres: null })

    await render(<CheckInHaritasiEkrani />)

    expect(await screen.findByTestId('mekan-idari')).toHaveTextContent('Nilüfer, Bursa')
    expect(screen.queryByTestId('mekan-adresi')).toBeNull()
    await cevreOturana()
  })

  it('mahalle yoksa satir eskisi gibi ILCE + IL', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, mahalle: null })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())
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

/**
 * MEKAN SAYFASI (kullanicinin istegi 2026-09-06).
 *
 * Buradaki testlerin cogu bir GORUNUM degil bir KURAL kilitliyor:
 * uydurma veri gostermemek, yuz gostermemek, ve gorunurluk farkini
 * kimlik sizdirmadan anlatmak.
 */
describe('MekanSayfasi - olcu seridi', () => {
  it('uc sayiyi da gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(mekanIstatistikleriniGetir as jest.Mock).mockResolvedValue({
      suAnKisi: 7,
      bugunCheckIn: 23,
      toplamCheckIn: 140,
      ilceSirasi: 3,
      ilceMekanSayisi: 55,
      ilce: 'Nilüfer',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('7')).toBeTruthy())
    expect(screen.getByText('23 check-in')).toBeTruthy()
    expect(screen.getByText('#3')).toBeTruthy()
    expect(screen.getByText('Nilüfer\'deki yerler')).toBeTruthy()
    await cevreOturana()
  })

  /**
   * UYDURMA VERI YOK. Ilce bilinmiyorsa ya da ilcede hic check-in
   * yoksa siralamanin bir evreni yok; "#1" yazmak mekani olmadigi bir
   * yere koymak olurdu.
   */
  it('siralama yoksa "#1" DEGIL cizgi gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Sıralama yok')).toBeTruthy())
    expect(screen.queryByText('#1')).toBeNull()
    await cevreOturana()
  })
})

describe('MekanSayfasi - su an burada', () => {
  /**
   * SAYI ile LISTE UYUSMAYABILIR ve bu KASITLI: sayi `security
   * definer` bir RPC'den geliyor (herkese ayni), liste ise
   * `check_inler` RLS'inden (cagirana gore). Fark "+N" ile
   * anlatiliyor - sayi gorunuyor ama kimlikler gorunmuyor.
   */
  it('gorunen kisiden daha cok kisi varsa farki "+N" ile gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(mekanIstatistikleriniGetir as jest.Mock).mockResolvedValue({
      suAnKisi: 7,
      bugunCheckIn: 0,
      toplamCheckIn: 0,
      ilceSirasi: null,
      ilceMekanSayisi: 0,
      ilce: null,
    })
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'c1', kullaniciId: 'k1', kullaniciAdi: 'Orçun' },
      { id: 'c2', kullaniciId: 'k2', kullaniciAdi: 'Ayşe' },
    ])

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Orçun')).toBeTruthy())
    // 7 kisi var, 2'sini gorebiliyoruz -> +5
    expect(screen.getByText('+5')).toBeTruthy()
    await cevreOturana()
  })

  /**
   * Avatar GERCEK PROFIL FOTOGRAFI gosteriyor (referanstaki gibi), ama
   * fotografi olmayan kisi ADININ BAS HARFINE duesuyor. Bu test o geri
   * duesme yolunu kilitliyor - `profilOzetleriniGetir` mock'lanmadigi
   * icin avatar sozlugu bos kaliyor.
   */
  it('fotografi olmayan kisi BAS HARF gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'c1', kullaniciId: 'k1', kullaniciAdi: 'Orçun' },
    ])

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('O')).toBeTruthy())
    await cevreOturana()
  })

  /**
   * Bos serit "burada kimse yok" demek degil - "senin gorme hakkin
   * yok" da demek olabilir. Ikisini karistiran bir bosluk gostermek
   * yerine bolum hic cizilmiyor.
   */
  it('gorunur kimse yoksa bolumu HIC cizmez', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())
    expect(screen.queryByText('Şu an burada')).toBeNull()
    await cevreOturana()
  })
})

describe('MekanSayfasi - sekmeler', () => {
  it('liderlik tablosu acilista gorunur, sekme degisince son check-inler gelir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(mekanLiderligiGetir as jest.Mock).mockResolvedValue([
      { kullaniciId: 'k1', kullaniciAdi: 'Orçun', checkInSayisi: 18 },
    ])
    ;(mekanSonCheckInleriGetir as jest.Mock).mockResolvedValue([
      {
        id: 'c9',
        kullaniciId: 'k2',
        kullaniciAdi: 'Ayşe',
        olusturmaZamani: new Date().toISOString(),
        notMetni: 'Kahve molası',
        canliMi: true,
      },
    ])

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('18 check-in')).toBeTruthy())
    expect(screen.queryByText('Kahve molası')).toBeNull()

    fireEvent.press(screen.getByTestId('sekme-son'))

    await waitFor(() => expect(screen.getByText('Kahve molası')).toBeTruthy())
    expect(screen.queryByText('18 check-in')).toBeNull()
    await cevreOturana()
  })

  /*
   * ILK UC SIRA, PROFILDEKI "En sik" listesiyle AYNI ROZETI kullaniyor
   * (kullanicinin istegi 2026-09-09). Rozet bir gorsel oldugu icin
   * erisilebilirlik etiketinden olcuIuyor; duz SVG dairelere donuIurse
   * bu iddia kirilir.
   */
  it('liderlikte ilk sira MADALYA ROZETI tasiyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(mekanLiderligiGetir as jest.Mock).mockResolvedValue([
      { kullaniciId: 'k1', kullaniciAdi: 'Orçun', checkInSayisi: 18 },
    ])

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByLabelText('1. sıra')).toBeTruthy())
    await cevreOturana()
  })

  /**
   * Bos durum metni SEBEBINI soylemiyor. Iki sebep var ve ayirt
   * edilemez: gercekten kimse gelmemis olabilir, ya da gorunurluk
   * tercihleri yuzunden sana gorunmuyor olabilir. Ikinciyi ima etmek
   * de bir sizinti olurdu.
   */
  it('liste bossa sebebini ACIKLAMAZ', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() =>
      expect(screen.getByText('Burada henüz gösterilecek bir check-in yok.')).toBeTruthy()
    )
    await cevreOturana()
  })
})

/**
 * ALTA YAPISIK CHECK-IN CUBUGU (kullanicinin sectigi tasarim B,
 * 2026-09-06) ve UC HALI.
 *
 * MEKAN konumu 40.2106, 28.9213. Asagidaki testler gercek `mesafeMetre`
 * hesabini kullaniyor - mock'lansaydi test kendi varsayimini
 * dogrulamis olurdu.
 */
/**
 * HARITA (kullanicinin istegi 2026-09-07: "haritada sadece o konumun
 * yeri gorunsun obur yerler gorunmesin ... ve haritayi kipirdatabiliyim
 * yakinlastirip uzaklastirabiliyim").
 */
describe('MekanSayfasi - harita', () => {
  it('YALNIZCA bu mekanin ignesini ciziyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    // Cevrede baska mekanlar OLSA BILE haritaya girmiyorlar: ekran
    // artik o listeyi hic cekmiyor.
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      { id: 'm2', ad: 'Komşu', konum: { lat: 40.211, lng: 28.922 }, kisiSayisi: 5 },
      { id: 'm3', ad: 'Öteki', konum: { lat: 40.212, lng: 28.923 }, kisiSayisi: 9 },
    ])

    await render(<CheckInHaritasiEkrani />)

    // Konum okunamadigi icin (varsayilan mock reddediyor) yalnizca
    // mekanin ignesi var; cevredeki mekanlar haritaya HIC girmiyor.
    await waitFor(() => expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(1))
    expect(screen.queryByLabelText(/Komşu/)).toBeNull()
  })

  /** Cevre listesi artik HIC cekilmiyor - bosa giden bir istekti. */
  it('cevre mekanlarini CEKMIYOR', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)
    await waitFor(() => expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy())

    expect(yakinMekanlariYogunlukIleGetir).not.toHaveBeenCalled()
    await cevreOturana()
  })
})

/**
 * IGNE RENGI VE KULLANICI KONUMU (kullanicinin istegi 2026-09-07:
 * "haritada konumun ignesi yogunluguna ve sakinligine gore renk alsin
 * ve haritada o an kullanici nerdeyse onun ignesi de gorunsun turuncu
 * ki sectigi konuma mesafesini gorebilsin").
 *
 * Renk dogrudan olculemiyor (igne bir SVG), ama erisilebilirlik
 * etiketi durumu tasiyor - yani hangi durumun secildigi test edilebilir.
 */
describe('MekanSayfasi - igne durumu ve kullanici konumu', () => {
  it('mekan ignesi DURUMU tasiyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(mekanIstatistikleriniGetir as jest.Mock).mockResolvedValue({
      suAnKisi: 6,
      bugunCheckIn: 0,
      toplamCheckIn: 0,
      ilceSirasi: null,
      ilceMekanSayisi: 0,
      ilce: null,
    })

    await render(<CheckInHaritasiEkrani />)

    // 6 kisi -> yogun (esik 3).
    await waitFor(() => expect(screen.getByLabelText('Bu mekan, Yoğun')).toBeTruthy())
  })

  it('konum okunabiliyorsa KULLANICI ignesi de ciziliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 40.2117, lng: 28.9213 })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByLabelText('Buradasın')).toBeTruthy())
    // Mekan + kullanici = iki igne.
    expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(2)
  })

  it('konum okunamazsa YALNIZCA mekan ignesi kaliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    // cihazKonumunuAl varsayilan olarak reddediyor.

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(1))
    expect(screen.queryByLabelText('Buradasın')).toBeNull()
  })

  /*
   * KULLANICI ILE MEKAN ARASINDAKI CIZGI (kullanicinin istegi
   * 2026-09-09). Konum okunamadiginda cizilecek iki nokta yok - cizgi
   * de hic cizilmiyor. Ikinci iddia sart: onsuz "her zaman ciziliyor"
   * hali de yesil gecerdi.
   */
  /*
   * HARITADA ROTA CIZGISI YOK (kullanicinin karari 2026-09-09).
   * Once duz kesikli bir cizgi, sonra OSRM'den gercek yol cizilmisti;
   * gercek yol icin kendi sunucumuz gerekiyordu ve kullanici o
   * maliyeti almak yerine cizgiyi kaldirmayi secti. Yol tarifi
   * telefonun kendi harita uygulamasinda calismaya devam ediyor.
   *
   * Iddia SILINMEDI, tersine cevrildi: cizgi sessizce geri gelirse
   * test kirilir.
   */
  it('haritada rota cizgisi YOK', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 40.2117, lng: 28.9213 })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByLabelText('Buradasın')).toBeTruthy())
    expect(screen.queryByTestId('harita-cizgisi')).toBeNull()
  })

  /*
   * UC NOKTA KALKTI (kullanicinin istegi 2026-09-09). Iddia tersine
   * cevrildi, silinmedi: menu sessizce geri gelirse test kirilir.
   */
  /*
   * DUZENLEME TALEBI GIRISI (kullanicinin istegi 2026-09-09).
   * Ust cubuktaki uc nokta ayni gun kaldirildigi icin giris,
   * duzeltilecek bilginin YANINA - adin altina - kondu.
   */
  it('"Bilgileri düzelt" duzenleme ekranini aciyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)
    await screen.findByText(MEKAN.ad)

    await fireEvent.press(screen.getByTestId('duzenleme-talebi'))

    expect(mockPush).toHaveBeenCalledWith(`/mekanlar/duzenle/${MEKAN.id}`)
  })

  /*
   * KAPAK FOTOGRAFI yalnizca ONAYLANMIS bir talepten geliyor; yoksa
   * hic cizilmiyor - bos bir gorsel kutusu sayfayi uzatmaktan baska
   * bir sey yapmaz.
   */
  it('kapak fotografi yoksa gorsel HIC cizilmiyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)
    await screen.findByText(MEKAN.ad)

    expect(screen.queryByTestId('mekan-kapak')).toBeNull()
  })

  it('onaylanmis kapak fotografi varsa ciziliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, kapakFotograf: 'kisi/1.jpg' })
    ;(mekanFotografiUrl as jest.Mock).mockResolvedValue('https://ornek/kapak.jpg')

    await render(<CheckInHaritasiEkrani />)

    const gorsel = await screen.findByTestId('mekan-kapak')
    expect(gorsel.props.source).toEqual({ uri: 'https://ornek/kapak.jpg' })
  })

  it('ust cubukta UC NOKTA menusu YOK', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)

    await render(<CheckInHaritasiEkrani />)
    await screen.findByText(MEKAN.ad)

    expect(screen.queryByTestId('mekan-menu')).toBeNull()
  })
})

describe('MekanSayfasi - check-in cubugu', () => {
  it('yakinken "Buraya check-in yap" gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    // ~120 m: yaricapin (1 km) icinde.
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 40.2117, lng: 28.9213 })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Buraya check-in yap')).toBeTruthy())
    await cevreOturana()
  })

  /**
   * BOSA IS YAPTIRMA: 1 km kurali sunucuda zorlaniyor, ama kullanici
   * basip check-in ekraninda reddedilmektense burada baştan gormeli.
   * Buton basilamiyor VE mesafeyi soyluyor.
   */
  it('uzaktayken basilamaz ve MESAFEYI yazar', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    // ~2,2 km kuzey.
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 40.2306, lng: 28.9213 })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() =>
      expect(screen.getByText(/Check-in için yaklaş/)).toBeTruthy()
    )
    expect(screen.queryByText('Buraya check-in yap')).toBeNull()
    await cevreOturana()
  })

  /**
   * Konum OKUNAMAZSA buton normal gorunuyor. Bilmedigimiz bir sey
   * yuzunden kullaniciyi engellemek yanlis olurdu; kurali yine sunucu
   * uyguluyor.
   */
  it('konum okunamazsa butonu ENGELLEMEZ', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    // cihazKonumunuAl varsayilan olarak reddediyor.

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Buraya check-in yap')).toBeTruthy())
    await cevreOturana()
  })

  it('bu mekanda aktif check-in varsa "Buradasın · Ayrıl" gosterir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'c1',
      mekanId: 'mekan-1',
      mekanAdi: MEKAN.ad,
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Buradasın · Ayrıl')).toBeTruthy())
    expect(screen.queryByText('Buraya check-in yap')).toBeNull()
    await cevreOturana()
  })

  /** Aktif check-in BASKA bir mekandaysa bu sayfa etkilenmiyor. */
  it('aktif check-in BASKA mekandaysa normal buton kalir', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'c1',
      mekanId: 'baska-mekan',
      mekanAdi: 'Başka Yer',
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Buraya check-in yap')).toBeTruthy())
    await cevreOturana()
  })

  it('"Ayrıl"a basinca check-inden cikiliyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'c1',
      mekanId: 'mekan-1',
      mekanAdi: MEKAN.ad,
    })

    await render(<CheckInHaritasiEkrani />)
    await waitFor(() => expect(screen.getByText('Buradasın · Ayrıl')).toBeTruthy())

    fireEvent.press(screen.getByTestId('checkin-cubugu'))

    await waitFor(() => expect(checkIndenAyril).toHaveBeenCalledWith('c1'))
    await cevreOturana()
  })

  /*
   * KAPANMIS MEKAN (2026-09-11).
   *
   * Kayit listelerden ve aramadan duesueyor ama SAYFASI aciliyor: eski
   * bir check-in kartindan buraya gelinebilir ve o ani silinmemeli
   * (`check_inler.mekan_id` cascade - mekani silmek insanlarin
   * gecmisini goturur).
   */
  it('mekan kapandiysa sebebini yaziyor ve check-in cubugu cizilmiyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, kapali: true })
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)

    await render(<CheckInHaritasiEkrani />)

    expect(await screen.findByTestId('mekan-kapandi')).toBeTruthy()
    expect(screen.queryByTestId('checkin-cubugu')).toBeNull()
    await cevreOturana()
  })

  /*
   * TEK ISTISNA: kisi SU AN oradaysa "Ayril" duruyor. Yoksa mekan
   * kapatildigi anda o kisinin check-in'ini bitirmenin yolu kalmazdi.
   */
  it('kapali mekanda bile aktif check-in varsa "Ayrıl" duruyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, kapali: true })
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'c1',
      mekanId: 'mekan-1',
      mekanAdi: MEKAN.ad,
    })

    await render(<CheckInHaritasiEkrani />)

    await waitFor(() => expect(screen.getByText('Buradasın · Ayrıl')).toBeTruthy())
    await cevreOturana()
  })
})
