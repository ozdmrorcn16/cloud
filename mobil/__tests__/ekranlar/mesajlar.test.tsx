import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MesajlarEkrani from '../../src/app/mesajlar'
import { konusmalarimiGetir, konusmayiSil, mesajIsteklerimiGetir } from '../../lib/sohbet'
import type { Konusma, MesajIstegi } from '../../lib/sohbet'
import { avatarlariGetir } from '../../lib/akis'

jest.mock('../../lib/akis', () => ({ avatarlariGetir: jest.fn() }))
jest.mock('../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
  konusmayiSil: jest.fn(),
  mesajIsteklerimiGetir: jest.fn(),
}))

const mockRouterPush = jest.fn()
// useFocusEffect'i gercek useEffect gibi (mount'ta bir kez) davranacak
// sekilde taklit ediyoruz, ayrica sonuncu geri cagirmayi testlerin
// "yeniden odaklanma" simule edebilmesi icin disariya biriktiriyoruz. Set
// kullaniyoruz cunku bu ekranda konusma listesi her cekiste yeni bir dizi
// referansi aldigi icin (sayi rozetindeki gibi ayni deger bailout'u yok)
// bilesen birden fazla kez render olabiliyor; ayni useCallback referansi
// her render'da tekrar kaydedilirse dizi cogalirdi, Set bunu tekillestirir.
let mockOdakGeriCagirmalari = new Set<() => void>()
const mockRouterBack = jest.fn()
let mockGeriGidilebilir = true
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, canGoBack: () => mockGeriGidilebilir }),
  useFocusEffect: (effect: () => void) => {
    mockOdakGeriCagirmalari.add(effect)
    require('react').useEffect(effect, [])
  },
}))

function konusma(ustune: Partial<Konusma> = {}): Konusma {
  return {
    konusmaId: 'k1',
    kisiId: 'u1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    sonMesaj: 'Selam, nasilsin?',
    sonMesajZamani: '2026-08-20T10:00:00Z',
    okunmamis: 0,
    yazilabilirMi: true,
    ...ustune,
  }
}

function istek(ustune: Partial<MesajIstegi> = {}): MesajIstegi {
  return {
    gonderenId: 'y1',
    kullaniciAdi: 'yabanci',
    ad: 'Yabanci Kisi',
    konusmaId: 'ky1',
    sonMesaj: 'Merhaba',
    sonMesajZamani: '2026-09-01T10:00:00Z',
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockOdakGeriCagirmalari = new Set<() => void>()
  // Ekran artik konusmalarla BIRLIKTE mesaj isteklerini de cekiyor
  // (Promise.all). Varsayilan bos: istegi olan testler kendi degerini
  // ayrica veriyor. Bu olmadan cagri undefined donuyor ve ekran hata
  // durumuna dusuyor.
  ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])
  ;(avatarlariGetir as jest.Mock).mockResolvedValue({})
})

describe('MesajlarEkrani', () => {
  it('konusmalari karsi kisinin adi ve son mesaj onizlemesiyle listeler', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('Selam, nasilsin?')).toBeTruthy()
  })

  it('okunmamis sayisi sifirdan buyukse rozet gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 3 })])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('3')).toBeTruthy()
  })

  it('okunmamis sayisi sifirsa rozet hic render edilmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 0 })])

    await render(<MesajlarEkrani />)

    await screen.findByText('Orcun Ozdemir')
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bir satira basinca kisi id ile sohbet rotasina yonlendirir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Orcun Ozdemir'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/u1'))
  })

  // "GIZLE" KALKTI, "SIL" GELDI (kullanicinin karari 2026-09-14): satir
  // sola kaydirilinca sagda Sil. Kaydirma hareketi jest'te yok; dugme
  // agacta duruyor (Swipeable sag eylemleri hep cizer), dogrudan
  // basiliyor.
  it('satirda "Gizle" YOK', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await screen.findByText('Orcun Ozdemir')

    expect(screen.queryByText('Gizle')).toBeNull()
  })

  // Sil ONAY ISTER (kullanicinin istegi 2026-09-14: "Sil'e basinca bir
  // uyari gorunsun, onay verince silinsin").
  it('Sil dugmesi once uyari acar; onaylayinca konusmayiSil cagrilir ve satir kalkar', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiSil as jest.Mock).mockResolvedValue(undefined)

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByTestId('konusma-sil-k1'))

    expect(konusmayiSil).not.toHaveBeenCalled()
    expect(screen.getByText('Konuşmayı sil')).toBeTruthy()
    // Aciklama YOK (kullanicinin istegi): yalnizca baslik + Sil / Vazgec.
    expect(screen.queryByText(/karşı tarafta kalır/)).toBeNull()
    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    await waitFor(() => expect(konusmayiSil).toHaveBeenCalledWith('k1'))
    await waitFor(() => expect(screen.queryByText('Orcun Ozdemir')).toBeNull())
  })

  it('uyaride Vazgec: silinmez, satir kalir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByTestId('konusma-sil-k1'))
    await fireEvent.press(screen.getByText('Vazgeç'))

    expect(konusmayiSil).not.toHaveBeenCalled()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.queryByText('Konuşmayı sil')).toBeNull()
  })

  it('silme reddedilirse hata mesaji gorunur ve satir listede kalir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiSil as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByTestId('konusma-sil-k1'))
    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('liste bossa bos durum metni gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Henüz bir konuşman yok')).toBeTruthy()
  })

  /**
   * Kullanicinin karari (2026-09-01): bos durumun altindaki
   * bilgilendirme cumlesi KALDIRILDI. Baslik tek basina yeterli;
   * kimlerle mesajlasilabilecegini anlatan cumle ekrani dolduruyordu.
   */
  it('bos durumda aciklama cumlesi GOSTERILMEZ', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<MesajlarEkrani />)

    await screen.findByText('Henüz bir konuşman yok')
    expect(screen.queryByText(/mesajlaşabilirsin/)).toBeNull()
  })

  it('silinmis karsi taraf icin "Silinmiş kullanıcı" gosterir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      konusma({
        kisiId: null,
        kullaniciAdi: null,
        ad: null,
        sonMesaj: 'eski mesaj',
        okunmamis: 0,
        yazilabilirMi: false,
      }),
    ])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Silinmiş kullanıcı')).toBeTruthy()
  })

  it('ekrana yeniden odaklaninca listeyi tekrar ceker (useFocusEffect, tek seferlik useEffect degil)', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await waitFor(() => expect(konusmalarimiGetir).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()

    // konusma acilip okunmus, geri donulmus gibi: okunmamis sayisi
    // degisti VE ekran yeniden odaklandi. useEffect (deps: []) olsaydi
    // bu ikinci cagriyi hic yapmazdi - liste bayat kalirdi.
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 0 })])
    await act(async () => {
      mockOdakGeriCagirmalari.forEach((geriCagirma) => geriCagirma())
    })

    await waitFor(() => expect(konusmalarimiGetir).toHaveBeenCalledTimes(2))
  })
})

/**
 * MESAJ ISTEKLERI (kullanicinin karari 2026-09-01, netlestirme):
 * "Istekler yazisi SABIT; basinca yeni sayfa geliyor, orada istekler
 * varsa gorunuyor, yoksa sayfa bos duruyor."
 *
 * Yani bu ekranda istek LISTESI yok - yalnizca her zaman duran bir
 * giris satiri var.
 */
describe('MesajlarEkrani - istekler girisi', () => {
  it('Istekler satiri istek OLMASA BILE gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    render(<MesajlarEkrani />)

    await waitFor(() => expect(screen.getByText('İstekler')).toBeTruthy())
  })

  it('Istekler satirina basinca istekler sayfasini acar', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    render(<MesajlarEkrani />)
    await waitFor(() => screen.getByText('İstekler'))

    await fireEvent.press(screen.getByText('İstekler'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mesaj-istekleri')
  })

  /**
   * Kullanicinin secimi (2026-09-01, gorsel secenek C): "Istekler"
   * basligin KARSISINDA, sag ustte durur ve yaninda BEKLEYEN SAYISI
   * gorunur. Sayi, ekranin asil sorusunu ("bakmam gereken bir sey var
   * mi") sayfayi acmadan cevapliyor.
   */
  it('bekleyen istek sayisini rozet olarak gosterir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([
      istek(),
      istek({ gonderenId: 'y2', konusmaId: 'ky2' }),
    ])

    await render(<MesajlarEkrani />)

    expect(await screen.findByTestId('istek-sayisi')).toHaveTextContent('2')
  })

  it('bekleyen istek yoksa rozet HIC render edilmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])

    await render(<MesajlarEkrani />)
    await waitFor(() => screen.getByText('İstekler'))

    // Sifir yazan bir rozet "bos" degil "sifir tane" diye okunur;
    // dogrusu hic cizmemek.
    expect(screen.queryByTestId('istek-sayisi')).toBeNull()
  })

  /**
   * Istek sayisi ekran her odaklandiginda tazelenir. Kullanici istegi
   * kabul edip geri dondugunde eski sayi kalirsa rozet yalan soyler.
   */
  it('ekran yeniden odaklanınca istek sayisini tazeler', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([istek()])

    await render(<MesajlarEkrani />)
    expect(await screen.findByTestId('istek-sayisi')).toHaveTextContent('1')

    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])
    await act(async () => {
      mockOdakGeriCagirmalari.forEach((g) => g())
    })

    await waitFor(() => expect(screen.queryByTestId('istek-sayisi')).toBeNull())
  })

  /**
   * Istekler cekilemezse EKRAN CALISMAYA DEVAM ETMELI: konusmalar
   * gorunur, yalnizca rozet cizilmez. Sayi ikincil bir bilgi; onun
   * yuzunden mesaj kutusunu hata ekranina cevirmek orantisiz olur.
   */
  it('istek sayisi cekilemezse konusmalar yine listelenir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(mesajIsteklerimiGetir as jest.Mock).mockRejectedValue(new Error('ag hatasi'))

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.queryByTestId('istek-sayisi')).toBeNull()
  })

  // PROFIL RESMI (kullanicinin istegi 2026-09-14: "basinda profil resmi
  // gorunsun"). Bildirimler ekraniyla AYNI Avatar bileseni ve AYNI
  // avatarlariGetir yolu.
  it('her satirin basinda karsi kisinin avatari var; fotografi yoksa bas harf', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      konusma(),
      konusma({ konusmaId: 'k2', kisiId: 'u2', kullaniciAdi: 'semra', ad: 'Semra Ozdemir' }),
    ])
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({ u1: 'https://x/u1.jpg', u2: null })

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Semra Ozdemir')).toBeTruthy()
    await waitFor(() => expect(avatarlariGetir).toHaveBeenCalledWith(['u1', 'u2']))
    // u1 fotografli: Image cizilir; u2 fotografsiz: bas harf "S"
    await waitFor(() => expect(screen.getByTestId('konusma-avatar-u1').props.source).toEqual([{ uri: 'https://x/u1.jpg' }]))
    expect(screen.getByText('S')).toBeTruthy()
  })

  it('avatarlar cekilemezse konusmalar yine listelenir (bas harfle)', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(avatarlariGetir as jest.Mock).mockRejectedValue(new Error('kova okunamadi'))

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('O')).toBeTruthy()
    expect(screen.queryByText('kova okunamadi')).toBeNull()
  })

  it('silinmis karsi taraf icin avatar cekilmez, soru isareti cizilir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ kisiId: null, ad: null, kullaniciAdi: null })])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Silinmiş kullanıcı')).toBeTruthy()
    expect(avatarlariGetir).not.toHaveBeenCalled()
    expect(screen.getByText('?')).toBeTruthy()
  })

  // GERI OKU (kullanicinin istegi 2026-09-14): sol ustte.
  it('sol ustteki geri oku onceki ekrana doner; gecmis yoksa ana sayfaya', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    mockGeriGidilebilir = true
    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByLabelText('Geri'))
    expect(mockRouterBack).toHaveBeenCalled()

    mockGeriGidilebilir = false
    await fireEvent.press(screen.getByLabelText('Geri'))
    expect(mockRouterPush).toHaveBeenCalledWith('/')
  })
})
