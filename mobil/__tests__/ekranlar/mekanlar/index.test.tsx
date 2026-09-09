import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { acikRenk } from '../../../src/tasarim/tema'
import MekanAramaEkrani from '../../../src/app/mekanlar/index'
import { cihazKonumunuAl, mesafeMetre } from '../../../lib/konum'
import {
  yakinMekanlariYogunlukIleGetir,
  ildekiTurleriGetir,
  TEMEL_TURLER,
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
  ildekiTurleriGetir: jest.fn().mockResolvedValue([]),
}))

const mockRouterPush = jest.fn()
jest.mock('../../../lib/checkin', () => ({
  aktifCheckInimiGetir: jest.fn().mockResolvedValue(null),
  checkIndenAyril: jest.fn(),
  checkIniSil: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() , canGoBack: () => false }),
  // Alt gezinme cubugu hangi sekmenin aktif oldugunu yoldan okuyor.
  usePathname: () => '/mekanlar',
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

beforeEach(async () => {
  jest.clearAllMocks()
  // TUZAK: `clearAllMocks` cagri kayitlarini siliyor ama
  // `mockImplementation` ile verilen govdeyi SILMIYOR. Harita yaricapi
  // testi mesafeyi mekana gore donduren bir govde kuruyor; geri
  // konmazsa sonraki testlerde her mekan 800 m cikiyor ve haritadaki
  // igneler sessizce kayboluyor. Bir kez yasandi.
  ;(mesafeMetre as jest.Mock).mockReturnValue(240)
  // TUR SUZGECI ARTIK CIHAZDA SAKLANIYOR (2026-09-09). Depo testler
  // arasinda PAYLASILIYOR; temizlenmezse bir onceki testin kaydettigi
  // suzgec bir sonrakinde yukleniyor ve secim TERSINE donuyor (secili
  // bir turu tiklamak onu kaldirir). Bir kez yasandi.
  await AsyncStorage.clear()
})

// Testin BITISINDE de temizleniyor: ekran suzgeci arka planda yaziyor
// ve yazma bir sonraki testin baslangicindan sonra tamamlanabilir.
afterEach(async () => {
  await AsyncStorage.clear()
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
    // 2026-09-06'da referans gorsele gecilince DURUM alt satirdan
    // cikip ayri bir ROZETE tasindi; alt satirda yalnizca yer ve
    // mesafe kaldi.
    expect(screen.getAllByText('Nilüfer, Bursa · 240 m').length).toBe(2)
    expect(screen.queryByText('Ertuğrul · 240 m')).toBeNull()
    // Durum rozeti: iki mekan da sakin.
    expect(screen.getAllByText('Sakin').length).toBeGreaterThanOrEqual(2)
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

    // 2026-09-06: sekmeler kalkti, TEK liste var. Kisi sayisi artik
    // ayri bir "canlilar seridi"nde degil, mekanin kendi kartinda.
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
    expect(screen.queryByText('Check-in yap')).toBeNull()

    // EYLEMLER DURUM SERIDININ ICINDE (kullanicinin istegi
    // 2026-09-07). Bir kez kaldirilip ayni gun geri kondular; fark
    // yerlesimde: ayri bir buton satiri degil, seridin sagindaki
    // yazilar. Eski etiket "Ayrıldım" idi, artik "Ayrıl" - mekan
    // sayfasindaki "Buradasın · Ayrıl" cubuguyla ayni kelime.
    expect(screen.getByText('Ayrıldım')).toBeTruthy()
    expect(screen.getByText('Sil')).toBeTruthy()
    expect(screen.queryByText('Ayrıl')).toBeNull()
  })

  /**
   * Kullanicinin istegi 2026-09-07: "yapilan konumun uzerine
   * basilabilsin ve konum icerigi acilsin." Listedeki satirlarla ayni
   * yol: `/harita/<id>`.
   */
  it('karttaki mekan adina basinca mekan sayfasi aciliyor', async () => {
    const { aktifCheckInimiGetir } = require('../../../lib/checkin')
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'ci-1',
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
    await screen.findByText('Şu an buradasın')

    await fireEvent.press(screen.getByLabelText('Sahil Kafe konumunu aç'))
    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
  })

  /**
   * Kartin KOKU basilabilir OLMAMALI. Kabin tamamini basilabilir
   * yapmak icindeki her ogeyi de sessizce ayni eyleme baglar - akis
   * kartinda tam bu hata yasanmisti (2026-09-04). Burada "Ayrıl" ve
   * "Sil" o tuzaga duesuerdue.
   */
  it('"Sil" karta degil kendi eylemine bagli: mekan sayfasi ACILMIYOR', async () => {
    const { aktifCheckInimiGetir } = require('../../../lib/checkin')
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'ci-1',
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
    await screen.findByText('Şu an buradasın')

    mockRouterPush.mockClear()
    await fireEvent.press(screen.getByText('Sil'))
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  /**
   * Kullanicinin istegi 2026-09-07: "haritadaki konumlardan birine
   * basinca o konumun sayfasi acilsin, hemen check-in yapma not yazma
   * sayfasi acilmasin."
   *
   * Boylece ekrandaki UC giris de ayni yere gidiyor: listedeki mekan
   * adi, karttaki mekan adi ve harita ignesi. Check-in yalnizca acikca
   * "Check-in" yazan dugmeden baslatiliyor.
   */
  it('harita ignesine basinca MEKAN SAYFASI aciliyor, check-in ekrani DEGIL', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-7', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 7,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    // Beklemeyi ADA degil IGNEYE bagliyoruz: ad hem haritada hem
    // listede geciyor ve findByText "birden fazla eleman" diye patliyor.
    const igneler = await screen.findAllByTestId('harita-ignesi')
    mockRouterPush.mockClear()
    await fireEvent.press(igneler[0])

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-7')
    expect(mockRouterPush).not.toHaveBeenCalledWith('/check-in/mekan-7')
  })

  /**
   * Kullanicinin bildirdigi hata 2026-09-07: "Yogun" secilikken
   * haritada yesil (sakin) igneler duruyordu - durum suzgeci yalnizca
   * LISTEYE uygulaniyordu. Ekranin iki yarisi farkli sey soyluyordu.
   */
  it('durum cipi HARITAYI da suzuyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'sakin-1', ad: 'Sessiz Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
      {
        id: 'yogun-1', ad: 'Dolu Bar', tur: 'bar', adres: null, osmId: 2,
        konum: { lat: 41.016, lng: 28.979 }, kisiSayisi: 5,
      },
    ])

    await render(<MekanAramaEkrani />)
    // Basta iki mekan da haritada.
    expect(await screen.findByLabelText('Sessiz Kafe, Sakin')).toBeTruthy()
    expect(screen.getByLabelText('Dolu Bar, 5 kişi burada')).toBeTruthy()

    // "Yoğun" metni hem CIPTE hem listedeki durum ROZETINDE geciyor;
    // cipi rolueyle seciyoruz.
    await fireEvent.press(screen.getByRole('button', { name: 'Yoğun' }))

    // Yalnizca kalabalik olan kaliyor.
    await waitFor(() => {
      expect(screen.queryByLabelText('Sessiz Kafe, Sakin')).toBeNull()
    })
    expect(screen.getByLabelText('Dolu Bar, 5 kişi burada')).toBeTruthy()

    // KULLANICININ KENDI IGNESI suzgecten ETKILENMIYOR - o bir mekan
    // degil, nerede oldugunu soyleyen isaret.
    expect(screen.getByLabelText('Buradasın')).toBeTruthy()
  })

  /**
   * Kullanicinin istegi: "secilen kriter yoksa hic birsey gorunmesin."
   */
  it('secili duruma uyan mekan yoksa haritada IGNE KALMIYOR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'sakin-1', ad: 'Sessiz Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    expect(await screen.findByLabelText('Sessiz Kafe, Sakin')).toBeTruthy()

    // Cevrede kalabalik mekan yok.
    await fireEvent.press(screen.getByText('Yoğun'))

    await waitFor(() => {
      expect(screen.queryByLabelText('Sessiz Kafe, Sakin')).toBeNull()
    })

    // Haritada MEKAN ignesi kalmiyor; geriye yalnizca kullanicinin
    // kendi isareti kaliyor.
    const kalanlar = screen.queryAllByTestId('harita-ignesi')
    expect(kalanlar).toHaveLength(1)
    expect(screen.getByLabelText('Buradasın')).toBeTruthy()
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
  it('suzgec KAPALIYKEN tur suzgeci GONDERMEZ, mesafe siniri kalir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)

    // Acilista suzgec KAPALI: tur listesi null gidiyor, yani butun
    // turler geliyor. (Onceden bu testi "Mekan ara sekmesine bas"
    // adimi tetikliyordu; sekmeler 2026-09-06'da kalkti ve varsayilan
    // zaten bu.)
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
  it('arama kutusu HER ZAMAN acik geliyor', async () => {
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
    expect(screen.getByText('Yakınındaki Mekanlar')).toBeTruthy()

    // Kesfet'e gecilince arama kutusu kapaniyor.
    // Suzgec ACILINCA da arama kutusu duruyor: 2026-09-06'da sekmeler
    // kalkti, arama artik her durumda elinin altinda.
    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    expect(screen.getByPlaceholderText('Mekan ara')).toBeTruthy()
  })
  // Kullanicinin istegi (2026-08-31): "Mekan ara kisminda Sonuclar
  // yaziyor, bunu Yakininda olarak degistir."
  //
  // Arama BOSKEN liste gercekten yakindakileri gosteriyor (200 m), o
  // yuzden baslik "Yakininda". Bir sey ARANDIGINDA mesafe siniri
  // kalkiyor ve sonuc baska sehirden de gelebiliyor - orada "Yakininda"
  // yaniltici olurdu, "Sonuclar" kaliyor.
  it('arama bosken baslik "Yakinindaki Mekanlar"', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', semt: 'Kadıköy', il: 'İstanbul',
        adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))


    await waitFor(() => expect(screen.getByText('Yakınındaki Mekanlar')).toBeTruthy())
    expect(screen.queryByText('Sonuçlar')).toBeNull()
  })

  // Kesfet sekmesi sosyal turlere daralmaya DEVAM ediyor: "su an nereye
  // gidip birileriyle karsilasabilirim" sorusu farkli. Varsayilan sekme
  // degisti diye bu davranis kaybolmamali.
  /**
   * TUR SECICI (kullanicinin istegi 2026-09-06). Suzgec dugmesi artik
   * dogrudan suzmuyor, cevredeki TURLERIN listesini aciyor; secim
   * ancak "Kaydet"te uygulaniyor.
   */
  it('suzgec dugmesi tur secicisini aciyor, KAYDET secimi uyguluyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])
    ;(ildekiTurleriGetir as jest.Mock).mockResolvedValue([
      { tur: 'Kafe', adet: 12 },
      { tur: 'Park', adet: 3 },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockClear()

    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    await waitFor(() => expect(screen.getByTestId('tur-secici')).toBeTruthy())

    // Secim PENCEREDE gecici: Kaydet'e basilana kadar liste degismiyor.
    await fireEvent.press(screen.getByTestId('tur-Kafe'))
    expect(yakinMekanlariYogunlukIleGetir).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId('tur-kaydet'))

    // TUR SUZGECI VARKEN DE YARICAP UYGULANIYOR (kullanicinin istegi
    // 2026-09-09: "yakinindaki mekanlar kisminda 1 km mesafe
    // icerisindeki yerler sadece listelenecek"). 2026-09-06'daki
    // "filtrelemede km siniri yok" kurali GERI ALINDI; suzgec artik
    // listeyi daraltiyor, sehre yaymiyor.
    await waitFor(() => {
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
        41.015,
        28.979,
        KESFET_YARICAP_METRE,
        undefined,
        ['Kafe'],
        KESFET_LIMIT
      )
    })
  })

  /** Pencereyi kapatmak secimi UYGULAMIYOR - "Vazgec" gercekten vazgeciyor. */
  it('secici kapatilinca secim UYGULANMIYOR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])
    ;(ildekiTurleriGetir as jest.Mock).mockResolvedValue([{ tur: 'Kafe', adet: 12 }])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockClear()

    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    await waitFor(() => expect(screen.getByTestId('tur-secici')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('tur-Kafe'))
    await fireEvent.press(screen.getByTestId('tur-secici-kapat'))

    expect(yakinMekanlariYogunlukIleGetir).not.toHaveBeenCalled()
  })

  /**
   * "Tumunu sec" GERCEKTEN hepsini seciyor (kullanicinin duzeltmesi
   * 2026-09-06: "Tumune basinca tumunu secmiyor"). Ilk halde bu dugme
   * secimi TEMIZLIYORDU; adi tumunu sececegini soyledigi icin yanlisti.
   */
  it('"Tumunu sec" butun turleri isaretliyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    await waitFor(() => expect(screen.getByTestId('tur-secici')).toBeTruthy())

    // Hicbiri secili degilken dugme "Tumunu sec" diyor.
    expect(screen.getByText('Tümünü seç')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('tur-tumu'))

    // Artik hepsi secili, yani dugme "Temizle"ye donuyor.
    await waitFor(() => expect(screen.getByText('Temizle')).toBeTruthy())
    // Kaydet sayisi da butun temel turleri gosteriyor.
    expect(screen.getByText(`Kaydet (${TEMEL_TURLER.length})`)).toBeTruthy()
  })

  /*
   * BOS DURUM SEBEBINI SOYLUYOR. Tek bir metin uc ayri sebebi birden
   * aciklayamiyordu; ozellikle arama sonucu bosken "bu filtreyle"
   * demek yanlisti. Konum hicbir il sinirinin icinde degilse arama
   * hic sonuc dondurmuyor (kullanicinin karari: "ekran oyle yerlerde
   * bos kalabilir") ve o durumda da bu metin gorunuyor.
   */
  it('arama sonucu bossa sebebini ARAMA olarak soyluyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'zeytin')

    expect(await screen.findByText('"zeytin" için bu ilde sonuç yok.')).toBeTruthy()
  })

  it('arama da suzgec de yokken sebep YAKINDA MEKAN YOK', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)

    expect(await screen.findByText('Yakınında mekân yok.')).toBeTruthy()
  })

  /*
   * SUZGEC CIHAZDA KALICI (kullanicinin istegi 2026-09-09): "kaydet
   * yapinca kayitli kalsin, baska sayfada gezsem de uygulamadan
   * ciksam da kayitli dursun" ve "filtreyi kaldir dersem ancak
   * kaldirilsin".
   *
   * Iki yon ayri ayri olculuyor - AYNI TESTTE ekrani soekup yeniden
   * kurmak denendi ve RNTL'in `screen`ini bozdu (sonraki testler
   * elemanlari bulamadi). Yon 1: depoda kayitli deger EKRANA
   * yansiyor. Yon 2: ekrandaki secim DEPOYA yaziliyor.
   */
  it('depoda kayitli suzgec acilista uygulaniyor', async () => {
    await AsyncStorage.setItem('slooin.tur-suzgeci', JSON.stringify(['Kafe']))
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)

    await waitFor(() => expect(screen.getByTestId('secili-tur-Kafe')).toBeTruthy())
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledWith(
      41.015,
      28.979,
      // Tur suzgeci varken de 1 km yaricap uygulaniyor.
      KESFET_YARICAP_METRE,
      undefined,
      ['Kafe'],
      100
    )
  })

  it('kaydedilen suzgec DEPOYA yaziliyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])
    ;(ildekiTurleriGetir as jest.Mock).mockResolvedValue([{ tur: 'Kafe', adet: 12 }])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    await waitFor(() => expect(screen.getByTestId('tur-secici')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('tur-Kafe'))
    await fireEvent.press(screen.getByTestId('tur-kaydet'))

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('slooin.tur-suzgeci')).toBe(JSON.stringify(['Kafe']))
    )
  })

  /*
   * SUZGEC YALNIZCA KULLANICI KALDIRINCA KALKIYOR. "Filtreyi kaldır"
   * depodaki anahtari da siliyor - yoksa bir sonraki acilista geri
   * gelirdi.
   */
  it('"Filtreyi kaldır" depodaki kaydi da siliyor', async () => {
    await AsyncStorage.setItem('slooin.tur-suzgeci', JSON.stringify(['Kafe']))
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(screen.getByTestId('secili-tur-Kafe')).toBeTruthy())

    await fireEvent.press(screen.getByTestId('turleri-temizle'))

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('slooin.tur-suzgeci')).toBeNull()
    )
  })

  /** Disaridaki "Filtreyi kaldir" cipi secimi temizliyor. */
  it('"Tumu" secimi temizliyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])
    ;(ildekiTurleriGetir as jest.Mock).mockResolvedValue([{ tur: 'Kafe', adet: 12 }])

    await render(<MekanAramaEkrani />)
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByTestId('tur-suzgeci'))
    await waitFor(() => expect(screen.getByTestId('tur-secici')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('tur-Kafe'))
    await fireEvent.press(screen.getByTestId('tur-kaydet'))
    await waitFor(() => expect(screen.getByTestId('secili-tur-Kafe')).toBeTruthy())

    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockClear()
    await fireEvent.press(screen.getByTestId('turleri-temizle'))

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

  it('kesfet listesi yaricapi 1 km', () => {
    expect(KESFET_YARICAP_METRE).toBe(1000)
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

  /**
   * LISTEDE CHECK-IN BUTONU (kullanicinin karari 2026-09-01, gorsel
   * secenek A): her satirin saginda dolu turuncu hap bir "Check-in"
   * dugmesi var ve check-in EKRANINI aciyor (dogrudan check-in
   * YAPMIYOR - kullanicinin secimi).
   *
   * Yogunluk ("Sakin" / "4 kisi") sagdaki ayri sutundan alt satira,
   * mesafenin yanina tasindi; sag taraf tamamen eyleme ayrildi.
   */
  it('her satirda check-in dugmesi var ve check-in ekranini aciyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)
    const dugme = await screen.findByTestId('satir-checkin-mekan-1')

    await fireEvent.press(dugme)

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-1')
  })

  it('durum ROZET olarak gosteriliyor, alt satirda degil', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        semt: 'Nilüfer', il: 'Bursa',
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    expect(await screen.findByText('Nilüfer, Bursa · 240 m')).toBeTruthy()
  })

  /**
   * KUSUR DUZELTMESI (bu is sirasinda bulundu): "Mekan ara" sekmesinde
   * KALABALIK mekanlar hic gorunmuyordu. Canlilar yatay serit olarak
   * yalnizca Kesfet sekmesinde ciziliyor, "Yakininda" listesi ise
   * kisiSayisi === 0 suzuyordu; ikisi birlesince aranan kalabalik bir
   * mekan sonuclarda HIC cikmiyordu.
   *
   * Yogunluk alt satira tasindigi icin artik tek listede hem sakin hem
   * kalabalik gosterilebiliyor.
   */
  it('listede KALABALIK mekan da gorunuyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 4,
      },
    ])

    await render(<MekanAramaEkrani />)

    expect(await screen.findByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('4 kişi burada')).toBeTruthy()
    expect(screen.getByTestId('satir-checkin-mekan-1')).toBeTruthy()
  })

  // ------------------------------------------------------------------ //
  // TURUNCU ENFLASYONU (2026-09-07 tasarim denetimi)
  //
  // Ekranda ayni anda DORT dolu turuncu Check-in butonu vardi; yaninda
  // segment, arama ikonu, suzgec, secili cip, "Tumunu gor" ve alt
  // gezinmenin merkez dugmesi de turuncuydu. Kimligin kurali "bir
  // ekranda genelde TEK birincil turuncu eylem olur" diyor.
  // ------------------------------------------------------------------ //

  it('listedeki check-in butonu DOLU TURUNCU', async () => {
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 4,
      },
    ])

    await render(<MekanAramaEkrani />)

    const buton = await screen.findByTestId('satir-checkin-mekan-1')
    const stil = StyleSheet.flatten(buton.props.style) as {
      backgroundColor?: string
      borderWidth?: number
    }

    // 2026-09-07 denetiminde HAYALETE cevrilmisti ("bir ekranda tek
    // birincil turuncu eylem olur"); kullanici 2026-09-09'da geri aldi.
    // Bu ekranin adi zaten "Check-in" ve listedeki her satirin tek isi
    // o eylem - hayalet buton asil eylemi ikincil gosteriyordu.
    expect(stil.backgroundColor).toBe(acikRenk.turuncu)
    expect(stil.borderWidth).toBeUndefined()

    // "Check-in" ekranda birden fazla yerde geciyor (ust baslik, alt
    // gezinme); etiket BUTONUN ICINDEN aliniyor.
    const etiket = screen.getAllByText('Check-in').find(
      (e) => StyleSheet.flatten(e.props.style)?.color === '#FFFFFF'
    )
    expect(etiket).toBeTruthy()
  })
  // ------------------------------------------------------------------ //
  // SAYFALAMA (kullanicinin istegi 2026-09-09)
  //
  // "1 km mesafe icerisindeki her tur listelenecek, HEPSI asagi dogru
  // kaydirilinca gorunecek." Olculdu: 1 km icinde 1.764 mekan var, yani
  // tek sayfa (100) "hepsi" degil.
  // ------------------------------------------------------------------ //

  /** Sunucudan gelmis gibi N kayit uretir. */
  function sayfa(baslangic: number, adet: number) {
    return Array.from({ length: adet }, (_, i) => ({
      id: `mekan-${baslangic + i}`,
      ad: `Mekan ${baslangic + i}`,
      tur: 'Kafe',
      adres: null,
      osmId: baslangic + i,
      konum: { lat: 41.015, lng: 28.979 },
      kisiSayisi: 0,
    }))
  }

  function dibeKaydir(liste: ReturnType<typeof screen.getByTestId>) {
    fireEvent.scroll(liste, {
      nativeEvent: {
        contentOffset: { y: 4000 },
        contentSize: { height: 4800, width: 390 },
        layoutMeasurement: { height: 800, width: 390 },
      },
    })
  }

  it('dibe yaklasinca SONRAKI SAYFA cekiliyor ve listeye EKLENIYOR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock)
      .mockResolvedValueOnce(sayfa(0, KESFET_LIMIT))
      .mockResolvedValueOnce(sayfa(KESFET_LIMIT, 5))

    await render(<MekanAramaEkrani />)
    await screen.findByText('Mekan 0')

    await dibeKaydir(screen.getByTestId('kesfet-kaydirma'))

    // Ikinci istek OFSET tasiyor: kacinci kayittan devam edecegi.
    await waitFor(() =>
      expect(yakinMekanlariYogunlukIleGetir).toHaveBeenLastCalledWith(
        41.015,
        28.979,
        KESFET_YARICAP_METRE,
        undefined,
        null,
        KESFET_LIMIT,
        KESFET_LIMIT
      )
    )

    // ONCEKI SAYFA SILINMIYOR: yeni kayitlar eskilerin ALTINA ekleniyor.
    expect(await screen.findByText(`Mekan ${KESFET_LIMIT}`)).toBeTruthy()
    expect(screen.getByText('Mekan 0')).toBeTruthy()
  })

  it('EKSIK sayfa geldiyse daha fazla istenmiyor', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    // Ilk sayfa TAM DEGIL: 3 kayit. Sunucuda daha fazlasi yok demek.
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue(sayfa(0, 3))

    await render(<MekanAramaEkrani />)
    await screen.findByText('Mekan 0')
    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledTimes(1)

    await dibeKaydir(screen.getByTestId('kesfet-kaydirma'))

    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledTimes(1)
  })

  /*
   * ARAMADA SAYFALAMA YOK. Arama yolunda limit hic gonderilmiyor
   * (sunucu kendi tavaniyla donuyor), dolayisiyla "tam sayfa geldi mi"
   * olcusu de yok. Sayfa istenseydi ayni kayitlar tekrar gelirdi.
   */
  it('arama sonucunda dibe kaydirmak yeni istek ACMIYOR', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue(sayfa(0, KESFET_LIMIT))

    await render(<MekanAramaEkrani />)
    await screen.findByText('Mekan 0')

    await fireEvent.changeText(screen.getByPlaceholderText('Mekan ara'), 'kafe')
    await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledTimes(2))

    const oncekiSayi = (yakinMekanlariYogunlukIleGetir as jest.Mock).mock.calls.length
    await dibeKaydir(screen.getByTestId('kesfet-kaydirma'))

    expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalledTimes(oncekiSayi)
  })
  // ------------------------------------------------------------------ //
  // HARITA LISTEYLE AYNI MEKANLARI GOSTERIYOR
  //
  // 2026-09-09'da haritaya 500 m'lik ayri bir sinir konmustu; kullanici
  // ERTESI GUN geri aldirdi: "haritada yine 1 km mesafeye kadar
  // gosterelim, boyle sakin yerlerde cok bos kaliyor." Seyrek bir
  // cevrede liste 430/520/560 m gosterirken haritada tek igne
  // kaliyordu.
  //
  // IDDIA SILINMEDI, TERSINE CEVRILDI: mesafe suzgeci geri gelirse bu
  // test kirilir.
  // ------------------------------------------------------------------ //

  it('haritada UZAK mekan da var: liste ile ayni kume', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    // Mesafe mekanin ENLEMINDEN turetiliyor: biri 300 m, oteki 800 m.
    ;(mesafeMetre as jest.Mock).mockImplementation(
      (_a: number, _b: number, lat: number) => (lat === 41.015 ? 300 : 800)
    )
    ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
      {
        id: 'yakin', ad: 'Yakın Kafe', tur: 'Kafe', adres: null, osmId: 1,
        konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 0,
      },
      {
        id: 'uzak', ad: 'Uzak Kafe', tur: 'Kafe', adres: null, osmId: 2,
        konum: { lat: 41.02, lng: 28.979 }, kisiSayisi: 0,
      },
    ])

    await render(<MekanAramaEkrani />)

    // Kullanicinin KENDI ignesi ("Buradasın") mekan degil, sayimdan
    // cikariliyor.
    const hepsi = await screen.findAllByTestId('harita-ignesi')
    const mekanIgneleri = hepsi.filter(
      (i) => i.props.accessibilityLabel !== 'Buradasın'
    )
    expect(mekanIgneleri).toHaveLength(2)

    expect(screen.getByText('Yakın Kafe')).toBeTruthy()
    expect(screen.getByText('Uzak Kafe')).toBeTruthy()
  })
})
