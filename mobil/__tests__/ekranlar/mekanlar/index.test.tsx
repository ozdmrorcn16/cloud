import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanAramaEkrani from '../../../src/app/mekanlar/index'
import { cihazKonumunuAl } from '../../../lib/konum'
import {
  yakinMekanlariYogunlukIleGetir,
  SOSYAL_TURLER,
  KESFET_YARICAP_METRE,
  KESFET_LIMIT,
} from '../../../lib/mekan'

// mesafeMetre de mock'lanmali: ekran mekan uzakligini bununla
// hesapliyor. Yalnizca cihazKonumunuAl mock'lanirsa mesafeMetre
// undefined kalir ve ekran cizilirken patlar.
jest.mock('../../../lib/konum', () => ({
  cihazKonumunuAl: jest.fn(),
  mesafeMetre: jest.fn(() => 240),
}))
// Sabitler ve saf yardimcilar (SOSYAL_TURLER, KESFET_*) GERCEGIYLE
// kullaniliyor; boylece ekranin sunucuya gonderdigi suzgec de birlikte
// dogrulanmis oluyor. Yalnizca ag cagrisi mock'lanir.
jest.mock('../../../lib/mekan', () => ({
  ...jest.requireActual('../../../lib/mekan'),
  yakinMekanlariYogunlukIleGetir: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('../../../lib/checkin', () => ({
  aktifCheckInimiGetir: jest.fn().mockResolvedValue(null),
  checkIndenAyril: jest.fn(),
  checkIniSil: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() }),
  // Alt gezinme cubugu hangi sekmenin aktif oldugunu yoldan okuyor.
  usePathname: () => '/mekanlar',
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MekanAramaEkrani', () => {
  it('acilista cihaz konumuna gore yakin mekanlari listeler', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    // Ekran "Mekan ara" sekmesiyle ACILIYOR (kullanicinin istegi
    // 2026-09-01: "Checkin sayfasi acildiginda ilk mekan ara butonu
    // uzerinden baslasin, kesfet degil"). O sekmede TUR SUZGECI YOK -
    // "yakinimda ne var" sorusu eczaneyi de bakkali da kapsiyor.
    // Yaricap ve limit yine gonderiliyor.
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
      41.015,
      28.979,
      KESFET_YARICAP_METRE,
      undefined,
      null,
      KESFET_LIMIT
    )
  })

  /**
   * Kullanicinin SON karari (2026-08-31): "Mahalle adres bilgisi
   * aktarimini durdur ve sil, sadece konumlarin ilce ve il bilgisini
   * gosterecegiz TAM DOGRULUK ADINA."
   *
   * Yani mahalle ve adres ekranda HIC gorunmuyor - kayitta dolu olsa
   * bile. Ilce ve il poligon testiyle atandigi icin kesin; mahalle ise
   * kaynakta kirliydi (bkz. "Hadim erikli subesi" vakasi).
   */
  it('mahalle dolu OLSA BILE yalnizca ILCE + IL gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 40.2106, lng: 28.9213 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1',
        ad: 'Alba',
        tur: 'Bisikletçi',
        semt: 'Nilüfer',
        mahalle: 'Ertuğrul',
        il: 'Bursa',
        kaynak: 'foursquare',
        adres: null,
        osmId: null,
        konum: { lat: 40.2106, lng: 28.9213 },
        kisiSayisi: 0,
      },
      {
        id: 'mekan-2',
        ad: 'Mahallesiz Yer',
        tur: 'Kafe',
        semt: 'Nilüfer',
        mahalle: null,
        il: 'Bursa',
        kaynak: 'foursquare',
        adres: null,
        osmId: null,
        konum: { lat: 40.211, lng: 28.922 },
        kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => expect(screen.getByText('Alba')).toBeTruthy())
    // Iki satir da AYNI: mahalle yok sayiliyor.
    expect(screen.getAllByText('Nilüfer, Bursa · 240 m').length).toBe(2)
    expect(screen.queryByText('Ertuğrul · 240 m')).toBeNull()
  })

  it('bir mekana basinca check-in ekranina yonlendirir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
      {
        id: 'mekan-2', ad: 'Moda Parkı', tur: 'park', adres: null, osmId: 2,
        konum: { lat: 41.016, lng: 28.98 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    // Not: en yakin mekani ayrica gosteren kart 2026-08-31'de
    // kaldirildi, artik butun mekanlar listede.
    await waitFor(() => screen.getByText('Moda Parkı'))
    // Mekan ADI artik konum ekranini aciyor (2026-08-31); check-in'e
    // giden yol satirin kendisi ve soldaki igne.
    await fireEvent.press(screen.getByLabelText('Moda Parkı için check-in yap'))

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-2')
  })

  it('mekan adina basinca KONUM ekranini acar', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-2', ad: 'Moda Parkı', tur: 'park', adres: null, osmId: 2,
        konum: { lat: 41.016, lng: 28.98 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Moda Parkı'))
    await fireEvent.press(screen.getByText('Moda Parkı'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-2')
  })

  it('konum izni verilmezse hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockRejectedValue(new Error('Konum izni verilmedi'))
    await render(<MekanAramaEkrani />)
    await waitFor(() => {
      // Ham hata metni yerine ne yapilacagini soyleyen bir ekran
      // cikiyor; kullaniciya "izin verilmedi" demek tek basina yon
      // vermiyordu.
      expect(screen.getByText('Çevreni göremiyoruz')).toBeTruthy()
      expect(screen.getByText('Tekrar dene')).toBeTruthy()
    })
  })

  it('arama sirasinda sorgu basarisiz olursa hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
          konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
        },
      ])
      .mockRejectedValueOnce(new Error('Sunucuya ulasilamadi'))

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    // Arama kutusu artik "Mekan ara" sekmesinin altinda (2026-08-31).
    await fireEvent.press(screen.getByText('Mekan ara'))
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'kafe')

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })

  it('her mekanin yanindaki kisi sayisini gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
      {
        id: 'mekan-2', ad: 'Moda Parkı', tur: 'park', adres: null, osmId: 2,
        konum: { lat: 41.016, lng: 28.98 }, kisiSayisi: 8,
      },
    ])

    await render(<MekanAramaEkrani />)
    // "8 kisi burada" seridi KESFET sekmesinde: o sekme "su an nerede
    // insan var" sorusunu cevapliyor. Varsayilan sekme 2026-09-01'de
    // "Mekan ara" oldugu icin once oraya geciliyor.
    await waitFor(() => screen.getByText('Keşfet'))
    await fireEvent.press(screen.getByText('Keşfet'))

    await waitFor(() => {
      expect(screen.getByText('8 kişi burada')).toBeTruthy()
    })
  })

  it('kisi sayisi 0 ise gosterilmez', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(screen.queryByText('0 kişi burada')).toBeNull()
  })

  it('bu mekanda check-in VARSA "Check-in yap" yerine durum ve eylemler cikar', async () => {
    // Kullanicinin istegi 2026-08-29: yapilan check-inin uzerinde
    // "Check-in yap" yazmayacak, baska mekan secilene kadar.
    const { aktifCheckInimiGetir } = require('../../../lib/checkin')
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'Kafe', semt: 'Nilüfer', kaynak: 'kullanici',
        konum: { lat: 41.015, lng: 28.979 }, adres: null, osmId: null,
        ekleyenKullanici: null, olusturuldu: '2026-08-29T10:00:00Z', kisiSayisi: 0 },
    ])
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      mekanAdi: 'Sahil Kafe',
      notMetni: null,
      fotograf: null,
      olusturmaZamani: '2026-08-29T10:00:00Z',
      bitisZamani: '2026-08-29T10:30:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })

    await render(<MekanAramaEkrani />)

    expect(await screen.findByText('Şu an buradasın')).toBeTruthy()
    expect(screen.getByText('Ayrıldım')).toBeTruthy()
    expect(screen.getByText('Sil')).toBeTruthy()
    expect(screen.queryByText('Check-in yap')).toBeNull()
  })

  it('check-in BASKA bir mekandaysa kart o mekani gosterir', async () => {
    // Kullanicinin istegi 2026-08-29: kart en yakini degil, check-in
    // yapilan yeri gostermeli - "baska mekan secene kadar".
    const { aktifCheckInimiGetir } = require('../../../lib/checkin')
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'Kafe', semt: 'Nilüfer', kaynak: 'kullanici',
        konum: { lat: 41.015, lng: 28.979 }, adres: null, osmId: null,
        ekleyenKullanici: null, olusturuldu: '2026-08-29T10:00:00Z', kisiSayisi: 0 },
    ])
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'checkin-2',
      mekanId: 'mekan-uzak',
      mekanAdi: 'Kent Meydanı',
      notMetni: null,
      fotograf: null,
      olusturmaZamani: '2026-08-29T10:00:00Z',
      bitisZamani: '2026-08-29T10:30:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })

    await render(<MekanAramaEkrani />)

    // Kart, listede olmayan check-in mekanini gosteriyor.
    expect(await screen.findByText('Kent Meydanı')).toBeTruthy()
    expect(screen.getByText('Şu an buradasın')).toBeTruthy()
    // Hicbir yerde "Check-in yap" yok.
    expect(screen.queryByText('Check-in yap')).toBeNull()
  })

  it('ekranda yaricap secici YOK', async () => {
    // Kullanicinin karari 2026-08-28: km cipleri kaldirildi, liste
    // mesafeyle kirpilmiyor.
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    expect(screen.queryByText('1 km')).toBeNull()
    expect(screen.queryByText('2 km')).toBeNull()
    expect(screen.queryByText('5 km')).toBeNull()
  })

  // Kullanicinin istegi (2026-08-31): "Butun turleri mekan ara sonuclar
  // kisminda goster." Kesfet sekmesi sosyal turlere dariliyor ("su an
  // nereye gidip birileriyle karsilasabilirim"), ama Mekan ara sekmesi
  // farkli bir soruyu cevapliyor: "yakinimda ne var". Orada eczane,
  // banka, oto tamirci de gorunmeli.
  it('Mekan ara sekmesinde tur suzgeci GONDERMEZ, mesafe siniri kalir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockClear()

    await fireEvent.press(screen.getByText('Mekan ara'))

    await waitFor(() => {
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
        41.015,
        28.979,
        KESFET_YARICAP_METRE,
        undefined,
        null,
        KESFET_LIMIT
      )
    })
  })

  // Liste 200 m ile sinirli ama ARAMA degil: kullanici baska sehirdeki
  // bir mekani da arayabilmeli. Arama varken tur suzgeci de kalkiyor,
  // yoksa "eczane" araninca sonuc cikmazdi.
  it('aramada mesafe siniri ve tur suzgeci GONDERMEZ', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByText('Mekan ara'))
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'kahve')

    await waitFor(() => {
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
        41.015,
        28.979,
        null,
        'kahve',
        null,
        null
      )
    })
  })

  // Kullanicinin karari 2026-08-31: "En yakin yeri otomatik secen
  // sutunu kaldir tamamen", yerine haritanin altina iki sekme.
  it('en yakin mekani otomatik seçen kartı GOSTERMIYOR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    expect(screen.queryByText('Check-in yap')).toBeNull()
  })

  // Kullanicinin istegi (2026-09-01): "Checkin sayfasi acildiginda ilk
  // mekan ara butonu uzerinden baslasin, kesfet degil."
  it('varsayilan sekme Mekan ara: arama kutusu ACIK geliyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    // Arama kutusu ILK ACILISTA gorunur olmali.
    expect(screen.getByPlaceholderText('Mekan ara')).toBeTruthy()
    expect(screen.getByText('Yakınında')).toBeTruthy()

    // Kesfet'e gecilince arama kutusu kapaniyor.
    await fireEvent.press(screen.getByText('Keşfet'))
    expect(screen.queryByPlaceholderText('Mekan ara')).toBeNull()
  })
  // Kullanicinin istegi (2026-08-31): "Mekan ara kisminda Sonuclar
  // yaziyor, bunu Yakininda olarak degistir."
  //
  // Arama BOSKEN liste gercekten yakindakileri gosteriyor (200 m), o
  // yuzden baslik "Yakininda". Bir sey ARANDIGINDA mesafe siniri
  // kalkiyor ve sonuc baska sehirden de gelebiliyor - orada "Yakininda"
  // yaniltici olurdu, "Sonuclar" kaliyor.
  it('Mekan ara sekmesinde arama bosken baslik "Yakininda"', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', semt: 'Kadıköy', il: 'İstanbul',
        adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))

    await fireEvent.press(screen.getByText('Mekan ara'))

    await waitFor(() => expect(screen.getByText('Yakınında')).toBeTruthy())
    expect(screen.queryByText('Sonuçlar')).toBeNull()
  })

  // Kesfet sekmesi sosyal turlere daralmaya DEVAM ediyor: "su an nereye
  // gidip birileriyle karsilasabilirim" sorusu farkli. Varsayilan sekme
  // degisti diye bu davranis kaybolmamali.
  it('Kesfet sekmesine gecince tur suzgeci GONDERILIR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockClear()

    await fireEvent.press(screen.getByText('Keşfet'))

    await waitFor(() => {
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
        41.015,
        28.979,
        KESFET_YARICAP_METRE,
        undefined,
        [...SOSYAL_TURLER],
        KESFET_LIMIT
      )
    })
  })

  /**
   * Kullanicinin karari (2026-09-01): "Yakininda listesinde bulunan
   * konumun 500 m mesafe icindeki yerleri goster, en yakindan en uzaga.
   * Resimde farkediyorsan daha uzak mesafelerde gosteriliyor."
   *
   * O ekran goruntusunde 200 m siniri varken 420-530 m mekanlar
   * listeleniyordu: yaricap icinde sonuc cikmayinca ekran SINIRSIZ
   * ikinci bir istek atiyordu. O kacis yolu KALDIRILDI - sinir artik
   * kesin. Cevrede hicbir sey yoksa liste bos kalir ve bos durum
   * metni gorunur.
   */
  it('yaricap disina TASMIYOR: sonuc bos donse bile ikinci istek atilmiyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    // TEK cagri: sinirsiz yedek istek YOK.
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledTimes(1)
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
      41.015, 28.979, KESFET_YARICAP_METRE, undefined, null, KESFET_LIMIT
    )
  })

  it('kesfet listesi yaricapi 500 m', () => {
    expect(KESFET_YARICAP_METRE).toBe(500)
  })


  /**
   * SABIT KURAL (kullanicinin karari 2026-09-01): "Siralama her zaman
   * en yakindan uzaga, bu kural sabit."
   *
   * Siralamayi SUNUCU yapiyor (KNN, `konum <-> nokta`) ve istemci ona
   * DOKUNMUYOR - ekranda hicbir `.sort()` yok. Bu test o zinciri
   * kilitliyor: biri ileride listeyi ada, ture ya da kisi sayisina gore
   * siralamaya kalkarsa burasi kirilir.
   */
  it('SABIT KURAL: liste sunucudan gelen yakinlik sirasini korur', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    // Sunucu en yakindan uzaga gonderiyor. Adlar ALFABETIK DEGIL: liste
    // ada gore siralanirsa sira bozulur ve test kirilir.
    //
    // Hepsinin kisiSayisi 0: ekran listeyi CANLI ve SAKIN diye ikiye
    // ayiriyor, canlilar seridi yalnizca Kesfet sekmesinde ciziliyor.
    // Siralamayi "Yakininda" listesinde olcmek icin hepsi sakin olmali.
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Zeytin Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
      {
        id: 'mekan-2', ad: 'Ada Park', tur: 'park', adres: null, osmId: 2,
        konum: { lat: 41.0155, lng: 28.9795 }, kisiSayisi: 0,
      },
      {
        id: 'mekan-3', ad: 'Bahar Bar', tur: 'bar', adres: null, osmId: 3,
        konum: { lat: 41.016, lng: 28.98 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Zeytin Kafe'))

    // getAllByText RENDER SIRASINA gore donuyor; sunucunun verdigi sira
    // korunmus olmali.
    const adlar = screen
      .getAllByText(/^(Zeytin Kafe|Ada Park|Bahar Bar)$/)
      .map((d) => d.props.children)
    expect(adlar).toEqual(['Zeytin Kafe', 'Ada Park', 'Bahar Bar'])
  })

})
